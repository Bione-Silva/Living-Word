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

const BASE_DOMAINS = ['livingwordgo.com', 'livingword.app', 'living-word.lovable.app'];

export function getSubdomainHandle(): string | null {
  const hostname = window.location.hostname;

  // Skip localhost and Lovable preview domains
  if (hostname === 'localhost' || hostname.includes('lovableproject.com')) {
    return null;
  }

  for (const base of BASE_DOMAINS) {
    if (!hostname.endsWith(base)) continue;

    // Strip the base domain to get subdomain parts
    const prefix = hostname.slice(0, -(base.length + 1)); // remove ".livingwordgo.com"
    if (!prefix) continue; // naked domain

    // Split subdomains: "www.pastorjoao" → ["www", "pastorjoao"] or "pastorjoao" → ["pastorjoao"]
    const parts = prefix.split('.').filter(Boolean);

    // Remove "www" if present
    const filtered = parts.filter(p => p !== 'www');

    if (filtered.length === 1) {
      return filtered[0];
    }
  }

  return null;
}

export function useSubdomainBlog(): string | null {
  // This is intentionally not reactive — hostname doesn't change during SPA navigation
  return getSubdomainHandle();
}
