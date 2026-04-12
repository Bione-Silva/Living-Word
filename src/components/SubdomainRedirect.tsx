import { Navigate } from 'react-router-dom';
import { useSubdomainBlog } from '@/hooks/useSubdomainBlog';

/**
 * If the current hostname is a blog subdomain (e.g., pastorjoao.livingwordgo.com),
 * this component redirects to /blog/{handle} so the existing BlogPublic page renders.
 * Returns null if no subdomain is detected (normal navigation continues).
 */
export function SubdomainRedirect() {
  const handle = useSubdomainBlog();

  if (!handle) return null;

  return <Navigate to={`/blog/${handle}`} replace />;
}
