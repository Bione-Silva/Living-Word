import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generates a VAPID keypair (P-256 ECDSA) using Web Crypto and stores in global_settings.
// Returns the public key (base64url) so the browser can subscribe.
async function generateVapidKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  // Build uncompressed public key (0x04 || X || Y) and base64url-encode it
  const x = base64UrlToBytes(publicJwk.x!);
  const y = base64UrlToBytes(publicJwk.y!);
  const pub = new Uint8Array(65);
  pub[0] = 0x04;
  pub.set(x, 1);
  pub.set(y, 33);
  return {
    publicKey: bytesToBase64Url(pub),
    privateKey: publicJwk.d ? privateJwk.d! : '',
    publicJwk,
    privateJwk,
  };
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64Url(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Try to load existing key
    const { data: existing } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'vapid_public_key')
      .maybeSingle();

    if (existing?.value) {
      return new Response(JSON.stringify({ publicKey: existing.value }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate fresh
    const { publicKey, publicJwk, privateJwk } = await generateVapidKeys();

    await supabase.from('global_settings').upsert(
      [
        { key: 'vapid_public_key', value: publicKey, updated_at: new Date().toISOString() },
        { key: 'vapid_public_jwk', value: JSON.stringify(publicJwk), updated_at: new Date().toISOString() },
        { key: 'vapid_private_jwk', value: JSON.stringify(privateJwk), updated_at: new Date().toISOString() },
        { key: 'vapid_subject', value: 'mailto:bionicaosilva@gmail.com', updated_at: new Date().toISOString() },
      ],
      { onConflict: 'key' }
    );

    return new Response(JSON.stringify({ publicKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('vapid error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
