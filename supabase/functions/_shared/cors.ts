// ═══════════════════════════════════════════════════════════════
// Living Word — Hardened CORS Module
// Validates Origin against an explicit allowlist.
// Rejects unauthorized origins in production.
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS: string[] = [
  // Local development
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  // Lovable preview / production
  "https://palavra-viva.lovable.app",
  "https://lovable.dev",
  // Supabase own domain (Edge Functions calling each other)
  "https://priumwdestycikzfcysg.supabase.co",
  // Add custom domains here as needed:
  // "https://palavraviva.com.br",
];

const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

/**
 * Returns CORS headers for the given request.
 * If the request's Origin is in the allowlist, it's reflected back.
 * Otherwise, no Access-Control-Allow-Origin header is set (browser will block).
 *
 * For internal service-to-service calls (no Origin header), we allow them
 * since they come from other Edge Functions.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");

  // Service-to-service calls (no browser Origin) — allow
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    };
  }

  // Check against allowlist
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": ALLOWED_HEADERS,
      "Vary": "Origin",
    };
  }

  // Unknown origin — return restrictive headers (browser will block)
  return {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 */
export function handleCorsOptions(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}

// ═══════════════════════════════════════════════════════════════
// Input Sanitization Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Strips HTML tags and script injections from a string.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")           // remove HTML tags
    .replace(/javascript:/gi, "")       // remove javascript: URIs
    .replace(/on\w+\s*=/gi, "")         // remove event handlers
    .trim();
}

/**
 * Validates and truncates a text field to a max length.
 * Returns null if the input is not a string.
 */
export function sanitizeField(
  input: unknown,
  maxLength: number,
  fallback = ""
): string {
  if (typeof input !== "string") return fallback;
  return stripHtml(input).slice(0, maxLength);
}

/**
 * Validates that a string matches a safe slug pattern (alphanumeric + hyphens).
 */
export function isValidSlug(input: string, maxLength = 30): boolean {
  if (input.length > maxLength) return false;
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(input) || /^[a-z0-9]$/.test(input);
}
