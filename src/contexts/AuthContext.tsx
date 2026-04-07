import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { PlanSlug } from '@/lib/plans';
import { supabase } from '@/integrations/supabase/client';

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
  theme_color?: string;
  font_family?: string;
  layout_style?: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile({
          id: data.id,
          full_name: data.full_name || '',
          blog_handle: data.blog_handle || '',
          plan: (data.plan as UserProfile['plan']) || 'free',
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
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => fetchProfile(nextSession.user.id), 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
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
