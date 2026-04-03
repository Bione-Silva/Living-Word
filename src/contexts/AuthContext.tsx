import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  blog_handle: string;
  plan: 'free' | 'pastoral' | 'church' | 'ministry';
  generations_used: number;
  generations_limit: number;
  language: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PREVIEW_USER_ID = 'preview-user';
const PREVIEW_EMAIL = 'preview@livingword.app';

const buildPreviewUser = (email = PREVIEW_EMAIL): User => ({
  id: PREVIEW_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email,
  phone: '',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { preview: true },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as User);

const buildPreviewSession = (email = PREVIEW_EMAIL): Session => ({
  access_token: 'preview-access-token',
  refresh_token: 'preview-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: buildPreviewUser(email),
} as Session);

const buildPreviewProfile = (metadata?: Record<string, unknown>): UserProfile => ({
  id: PREVIEW_USER_ID,
  full_name: typeof metadata?.full_name === 'string' && metadata.full_name.trim()
    ? metadata.full_name
    : 'Pastor de Preview',
  blog_handle: typeof metadata?.blog_handle === 'string' && metadata.blog_handle.trim()
    ? metadata.blog_handle
    : 'pastor-preview',
  plan: 'free',
  generations_used: 2,
  generations_limit: 5,
  language: typeof metadata?.language === 'string' ? metadata.language : 'PT',
});

const requireSupabase = () => {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Autenticação indisponível no preview porque as credenciais do Supabase não estão configuradas.');
  }

  return supabase;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyPreviewAuth = (email = PREVIEW_EMAIL, metadata?: Record<string, unknown>) => {
    setUser(buildPreviewUser(email));
    setSession(buildPreviewSession(email));
    setProfile(buildPreviewProfile(metadata));
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile({
          id: data.id,
          full_name: data.full_name || data.name || '',
          blog_handle: data.blog_handle || '',
          plan: data.plan || 'free',
          generations_used: data.generations_used || 0,
          generations_limit: data.generations_limit || 5,
          language: data.language || 'PT',
          avatar_url: data.avatar_url,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    if (!supabase) {
      applyPreviewAuth();
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    if (!supabase || !isSupabaseConfigured) {
      applyPreviewAuth(email, metadata);
      return;
    }

    const client = requireSupabase();
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      applyPreviewAuth(email);
      return;
    }

    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) {
      setProfile(null);
      setUser(null);
      setSession(null);
      return;
    }

    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
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
