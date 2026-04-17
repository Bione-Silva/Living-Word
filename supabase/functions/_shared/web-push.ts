// Minimal Web Push (RFC 8291) sender for Deno using Web Crypto.
// Encrypts payload with aes128gcm and signs VAPID JWT.

function b64uToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64u(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey('raw', salt as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm as BufferSource));
  const prkKey = await crypto.subtle.importKey('raw', prk as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const t = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, concatBytes(info, new Uint8Array([0x01])) as BufferSource));
  return t.slice(0, length);
}

// Convert raw 65-byte uncompressed P-256 pubkey to JWK.
function rawToJwk(raw: Uint8Array): JsonWebKey {
  if (raw.length !== 65 || raw[0] !== 0x04) throw new Error('Invalid raw pubkey');
  const x = raw.slice(1, 33);
  const y = raw.slice(33, 65);
  return { kty: 'EC', crv: 'P-256', x: bytesToB64u(x), y: bytesToB64u(y), ext: true };
}

async function importEcdhPub(raw: Uint8Array) {
  return crypto.subtle.importKey('jwk', rawToJwk(raw), { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

async function exportRaw(key: CryptoKey): Promise<Uint8Array> {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  const out = new Uint8Array(65);
  out[0] = 0x04;
  out.set(b64uToBytes(jwk.x!), 1);
  out.set(b64uToBytes(jwk.y!), 33);
  return out;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string; // base64url uncompressed pub
  auth: string; // base64url 16 bytes
}

export interface VapidConfig {
  publicJwk: JsonWebKey; // EC P-256
  privateJwk: JsonWebKey; // includes d
  subject: string; // mailto:...
}

export async function sendWebPush(
  sub: PushSubscriptionData,
  payload: string | Uint8Array,
  vapid: VapidConfig,
  ttl = 60 * 60 * 24
): Promise<Response> {
  const payloadBytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;

  const userPub = b64uToBytes(sub.p256dh);
  const userAuth = b64uToBytes(sub.auth);

  // Generate ephemeral ECDH keypair
  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const ephemeralPubRaw = await exportRaw(ephemeral.publicKey);
  const userPubKey = await importEcdhPub(userPub);

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: userPubKey }, ephemeral.privateKey, 256)
  );

  // Per aes128gcm: PRK = HKDF(auth, ECDH, "WebPush: info\0" || ua_pub || as_pub, 32)
  const authInfo = concatBytes(
    new TextEncoder().encode('WebPush: info\0'),
    userPub,
    ephemeralPubRaw
  );
  const prkKey = await hkdf(userAuth, sharedSecret, authInfo, 32);

  // Salt for content encryption
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // CEK: HKDF(salt, prkKey, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdf(salt, prkKey, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  // NONCE: HKDF(salt, prkKey, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdf(salt, prkKey, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  // Plaintext + 0x02 padding delimiter (no extra padding bytes)
  const plaintext = concatBytes(payloadBytes, new Uint8Array([0x02]));

  const aesKey = await crypto.subtle.importKey('raw', cek as BufferSource, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aesKey, plaintext as BufferSource)
  );

  // Build aes128gcm body: salt(16) || rs(4 BE) || idlen(1) || keyid(idlen) || ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const body = concatBytes(salt, rs, new Uint8Array([ephemeralPubRaw.length]), ephemeralPubRaw, ciphertext);

  // VAPID JWT
  const url = new URL(sub.endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: vapid.subject,
  };
  const enc = (o: unknown) => bytesToB64u(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(claims)}`;

  const privKey = await crypto.subtle.importKey(
    'jwk',
    vapid.privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, new TextEncoder().encode(signingInput) as BufferSource)
  );
  const jwt = `${signingInput}.${bytesToB64u(sig)}`;

  // Build VAPID public key (raw 65 bytes from JWK)
  const vapidRawPub = new Uint8Array(65);
  vapidRawPub[0] = 0x04;
  vapidRawPub.set(b64uToBytes(vapid.publicJwk.x!), 1);
  vapidRawPub.set(b64uToBytes(vapid.publicJwk.y!), 33);

  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    TTL: String(ttl),
    Authorization: `vapid t=${jwt}, k=${bytesToB64u(vapidRawPub)}`,
  });

  return await fetch(sub.endpoint, { method: 'POST', headers, body: body as BodyInit });
}
