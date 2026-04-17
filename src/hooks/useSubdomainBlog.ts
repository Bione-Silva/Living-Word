/**
 * Detects if the current hostname is a blog subdomain (e.g., pastorjoao.livingwordgo.com).
 * Returns the blog handle extracted from the subdomain, or null if on the main domain.
 *
 * Supported patterns:
 *   pastorjoao.livingwordgo.com    → "pastorjoao"
 *   www.pastorjoao.livingwordgo.com → "pastorjoao"
 *   pastorjoao.livingword.app      → "pastorjoao"
 *
 * Ignored (returns null):
 *   livingwordgo.com, www.livingwordgo.com, localhost, preview URLs
 */

// Only real production domains. Lovable preview hosts (`*.lovable.app`,
// `*.lovableproject.com`) are NEVER treated as blog subdomains — they use
// `--` separators (e.g. `preview--living-word.lovable.app`) which would
// otherwise be parsed as the handle "preview-".
const BASE_DOMAINS = ['livingwordgo.com', 'livingword.app'];

// Blog handles are alphanumeric (with optional internal hyphens/underscores),
// 2-32 chars. No leading/trailing hyphen. Anything else → not a blog.
const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9_-]{0,30}[a-z0-9])?$/i;

export function getSubdomainHandle(): string | null {
  const hostname = window.location.hostname;

  // Skip localhost, Lovable preview domains, and any host that uses `--`
  // (Lovable's preview separator that would confuse subdomain parsing).
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovableproject.com') ||
    hostname.includes('--')
  ) {
    return null;
  }

  for (const base of BASE_DOMAINS) {
    if (!hostname.endsWith(base)) continue;
    if (hostname === base) return null; // naked domain

    // Strip ".base" to get the subdomain prefix
    const prefix = hostname.slice(0, -(base.length + 1));
    if (!prefix) continue;

    // Split subdomains: "www.pastorjoao" → ["www", "pastorjoao"]
    const parts = prefix.split('.').filter(Boolean);
    const filtered = parts.filter((p) => p !== 'www');

    if (filtered.length === 1 && HANDLE_REGEX.test(filtered[0])) {
      return filtered[0].toLowerCase();
    }
  }

  return null;
}

export function useSubdomainBlog(): string | null {
  // This is intentionally not reactive — hostname doesn't change during SPA navigation
  return getSubdomainHandle();
}
