import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { PlanSlug } from '@/lib/plans';
import { normalizePlan } from '@/lib/plan-normalization';

interface UserProfile {
  id: string;
  full_name: string;
  blog_handle: string;
  plan: PlanSlug;
  generations_used: number;
  generations_limit: number;
  language: string;
  avatar_url?: string;
  doctrine?: string;
  pastoral_voice?: string;
  preaching_style?: string;
  audience?: string;
  bible_version?: string;
  trial_started_at?: string;
  trial_ends_at?: string;
  phone?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  church_name?: string;
  church_role?: string;
  denomination?: string;
  theme_color?: string;
  font_family?: string;
  layout_style?: string;
  profile_completed?: boolean;
  blog_name?: string;
  church_logo_url?: string;
  blog_author_display?: 'pastor' | 'church';
  custom_doctrine?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_MATCHERS = [/^sb-/, /^supabase\.auth\./, /-auth-token/];

function purgeAuthStorage(storage: Storage) {
  const keys: string[] = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;
    if (AUTH_STORAGE_MATCHERS.some((matcher) => matcher.test(key))) {
      keys.push(key);
    }
  }

  keys.forEach((key) => storage.removeItem(key));
}

async function clearBrowserAuthArtifacts(options?: { clearCaches?: boolean; unregisterPush?: boolean }) {
  const clearCaches = options?.clearCaches ?? false;
  const unregisterPush = options?.unregisterPush ?? false;

  try {
    purgeAuthStorage(window.localStorage);
    purgeAuthStorage(window.sessionStorage);
  } catch (error) {
    console.warn('[Auth] Storage purge failed:', error);
  }

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations.map(async (registration) => {
          const scriptUrl =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            '';
          const isPushWorker = scriptUrl.includes('/sw-push.js');

          if (isPushWorker) {
            if (unregisterPush) {
              try {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                  await supabase.functions.invoke('push-register', {
                    body: { action: 'unsubscribe', endpoint: subscription.endpoint },
                  });
                  await subscription.unsubscribe();
                }
              } catch (error) {
                console.warn('[Auth] Push unsubscribe cleanup failed:', error);
              }
              await registration.unregister();
            }
            return;
          }

          await registration.unregister();
        })
      );
    } catch (error) {
      console.warn('[Auth] Service worker cleanup failed:', error);
    }
  }

  if (clearCaches && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    } catch (error) {
      console.warn('[Auth] Cache cleanup failed:', error);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const activeUserIdRef = useRef<string | null>(null);
  const profileRequestRef = useRef(0);
  const profileRef = useRef<UserProfile | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = async (userId: string, source: string, authEmail?: string) => {
    const requestId = ++profileRequestRef.current;

    try {
      console.info('[Auth] Fetching profile', {
        source,
        authUserId: userId,
        authEmail: authEmail ?? null,
        requestId,
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const isStale = !mountedRef.current || activeUserIdRef.current !== userId || requestId !== profileRequestRef.current;

      if (isStale) {
        console.warn('[Auth] Discarded stale profile response', {
          source,
          authUserId: userId,
          activeUserId: activeUserIdRef.current,
          requestId,
          latestRequestId: profileRequestRef.current,
        });
        return;
      }

      if (error) {
        console.error('[Auth] Error fetching profile', {
          source,
          authUserId: userId,
          authEmail: authEmail ?? null,
          error,
        });
        setProfile(null);
        return;
      }

      if (!data) {
        console.warn('[Auth] No profile found for authenticated user', {
          source,
          authUserId: userId,
          authEmail: authEmail ?? null,
        });
        setProfile(null);
        return;
      }

      if (data.id !== userId) {
        console.error('[Auth] CRITICAL: profile.id mismatch with auth user', {
          source,
          authUserId: userId,
          profileId: data.id,
          authEmail: authEmail ?? null,
        });
        setProfile(null);
        return;
      }

      console.info('[Auth] Profile loaded', {
        source,
        authUserId: userId,
        authEmail: authEmail ?? null,
        profileId: data.id,
        profileFullName: data.full_name,
      });

      setProfile({
        id: data.id,
        full_name: data.full_name || '',
        blog_handle: data.blog_handle || '',
        plan: normalizePlan(data.plan),
        generations_used: data.generations_used || 0,
        generations_limit: data.generations_limit || 5,
        language: data.language || 'PT',
        avatar_url: data.avatar_url,
        doctrine: data.doctrine,
        pastoral_voice: data.pastoral_voice,
        bible_version: data.bible_version,
        trial_started_at: data.trial_started_at,
        trial_ends_at: data.trial_ends_at,
        phone: (data as any).phone,
        street: (data as any).street,
        neighborhood: (data as any).neighborhood,
        city: (data as any).city,
        state: (data as any).state,
        zip_code: (data as any).zip_code,
        country: (data as any).country,
        theme_color: (data as any).theme_color,
        font_family: (data as any).font_family,
        layout_style: (data as any).layout_style,
        profile_completed: (data as any).profile_completed ?? false,
        blog_name: data.blog_name ?? undefined,
        church_name: (data as any).church_name ?? undefined,
        church_role: (data as any).church_role ?? undefined,
        denomination: (data as any).denomination ?? undefined,
        preaching_style: (data as any).preaching_style ?? undefined,
        audience: (data as any).audience ?? undefined,
        church_logo_url: (data as any).church_logo_url ?? undefined,
        blog_author_display: ((data as any).blog_author_display as 'pastor' | 'church') ?? 'pastor',
        custom_doctrine: (data as any).custom_doctrine ?? undefined,
      });
    } catch (err) {
      if (mountedRef.current && activeUserIdRef.current === userId && requestId === profileRequestRef.current) {
        console.error('[Auth] Unexpected profile fetch failure', {
          source,
          authUserId: userId,
          authEmail: authEmail ?? null,
          error: err,
        });
        setProfile(null);
      }
    } finally {
      if (mountedRef.current && activeUserIdRef.current === userId && requestId === profileRequestRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const syncSession = (nextSession: Session | null, source: string) => {
      const nextUser = nextSession?.user ?? null;
      const nextUserId = nextUser?.id ?? null;
      const previousUserId = activeUserIdRef.current;

      activeUserIdRef.current = nextUserId;
      setSession(nextSession);
      setUser(nextUser);

      console.info('[Auth] Session resolved', {
        source,
        authUserId: nextUserId,
        authEmail: nextUser?.email ?? null,
        previousAuthUserId: previousUserId,
      });

      if (!nextUserId) {
        profileRequestRef.current += 1;
        setProfile(null);
        setLoading(false);
        return;
      }

      const shouldFetchProfile =
        source === 'bootstrap' ||
        previousUserId !== nextUserId ||
        !profileRef.current ||
        source.includes('SIGNED_IN') ||
        source.includes('INITIAL_SESSION') ||
        source.includes('USER_UPDATED');

      if (!shouldFetchProfile) {
        setLoading(false);
        return;
      }

      setProfile(null);
      setLoading(true);
      setTimeout(() => {
        void fetchProfile(nextUserId, source, nextUser?.email);
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      syncSession(nextSession, `auth:${event}`);
    });

    const bootstrap = async () => {
      setLoading(true);

      const { data: { session: storedSession } } = await supabase.auth.getSession();

      if (!storedSession) {
        syncSession(null, 'bootstrap');
        return;
      }

      const { data: { user: confirmedUser }, error } = await supabase.auth.getUser();

      if (error || !confirmedUser) {
        console.warn('[Auth] Stored session invalid during bootstrap; clearing local auth state', {
          error,
        });
        await clearBrowserAuthArtifacts();
        syncSession(null, 'bootstrap-invalid');
        return;
      }

      const validatedSession: Session =
        storedSession.user.id === confirmedUser.id
          ? storedSession
          : { ...storedSession, user: confirmedUser };

      syncSession(validatedSession, 'bootstrap');
    };

    void bootstrap();

    return () => {
      mountedRef.current = false;
      profileRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>): Promise<{ needsConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    // If no session returned, email confirmation is required
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    console.info('[Auth] signIn requested', { authEmail: email });
    setLoading(true);
    setProfile(null);
    profileRequestRef.current += 1;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut error (continuing cleanup):', e);
    }

    await clearBrowserAuthArtifacts({ clearCaches: true, unregisterPush: true });

    activeUserIdRef.current = null;
    profileRequestRef.current += 1;
    setProfile(null);
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user.id, 'manual-refresh', user.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
