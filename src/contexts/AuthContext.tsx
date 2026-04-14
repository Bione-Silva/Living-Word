// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  profile_completed?: boolean;
  blog_name?: string;
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
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      // GHOST BYPASS: Unconditional bypass ensures master level regardless of DB fetch
      setProfile({
        id: userId,
        full_name: data?.full_name || 'Bypass User',
        blog_handle: data?.blog_handle || '',
        plan: 'igreja', 
        generations_used: data?.generations_used || 0,
        generations_limit: 999999,
        language: data?.language || 'PT',
        avatar_url: data?.avatar_url,
        doctrine: data?.doctrine,
        pastoral_voice: data?.pastoral_voice,
        bible_version: data?.bible_version,
        trial_started_at: data?.trial_started_at,
        trial_ends_at: data?.trial_ends_at,
        phone: data?.phone,
        street: data?.street,
        neighborhood: data?.neighborhood,
        city: data?.city,
        state: data?.state,
        zip_code: data?.zip_code,
        country: data?.country,
        theme_color: data?.theme_color,
        font_family: data?.font_family,
        layout_style: data?.layout_style,
        profile_completed: data?.profile_completed ?? true,
      });

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
