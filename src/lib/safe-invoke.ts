import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface SafeInvokeResult<T> {
  data: T | null;
  error: Error | null;
  /** True when the call failed because the user has no valid session (401/403). */
  unauthorized: boolean;
}

/**
 * Wrapper around `supabase.functions.invoke` that:
 *  - Verifies an active session exists before calling (avoids "Edge function returned 401").
 *  - Catches `FunctionsHttpError` for 401/403 and surfaces `unauthorized: true` instead of throwing.
 *  - Never throws — callers always get a structured result.
 *
 * Use this for any edge function called from the dashboard, sidebar, or other always-mounted UI
 * so an expired session degrades silently to an empty state instead of a blank screen.
 */
export async function safeInvoke<T = unknown>(
  fn: string,
  options?: { body?: unknown; requireAuth?: boolean }
): Promise<SafeInvokeResult<T>> {
  const requireAuth = options?.requireAuth ?? true;

  try {
    if (requireAuth) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return { data: null, error: null, unauthorized: true };
      }
    }

    const { data, error } = await supabase.functions.invoke<T>(fn, {
      body: options?.body,
    });

    if (error) {
      // Inspect FunctionsHttpError for status code
      if (error instanceof FunctionsHttpError) {
        try {
          const ctx = error.context as Response | undefined;
          if (ctx && (ctx.status === 401 || ctx.status === 403)) {
            return { data: null, error: null, unauthorized: true };
          }
        } catch { /* ignore */ }
      }
      return { data: null, error: error as Error, unauthorized: false };
    }

    return { data: (data as T) ?? null, error: null, unauthorized: false };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    // Network failure / aborted — also treat as soft failure
    return { data: null, error: err, unauthorized: false };
  }
}
