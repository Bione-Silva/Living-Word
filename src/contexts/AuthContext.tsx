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

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Forçamos case insensitive no email
      const isMaster = email?.toLowerCase() === 'bx4usa@gmail.com';

      setProfile({
        id: userId,
        full_name: data?.full_name || (isMaster ? 'Master Admin' : 'Usuário'),
        blog_handle: data?.blog_handle || '',
        plan: isMaster ? 'igreja' : (data?.plan || 'free'), 
        generations_used: data?.generations_used || 0,
        generations_limit: isMaster ? 999999 : (data?.generations_limit || 100),
        language: data?.language || 'PT',
        avatar_url: data?.avatar_url,
        doctrine: data?.doctrine,
        pastoral_voice: data?.pastoral_voice,
        bible_version: data?.bible_version,
      });

    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback absoluto para Mestre
      if (email?.toLowerCase() === 'bx4usa@gmail.com') {
        setProfile({
          id: userId,
          full_name: 'Master Admin',
          blog_handle: '',
          plan: 'igreja', 
          generations_used: 0,
          generations_limit: 999999,
          language: 'PT',
        } as UserProfile);
      } else {
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => fetchProfile(nextSession.user.id, nextSession.user.email), 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        fetchProfile(nextSession.user.id, nextSession.user.email);
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
    if (user) await fetchProfile(user.id, user.email);
  };

  // Verificações super defensivas para garantir que não existem falhas de string match
  const rawEmail = user?.email || '';
  const isMaster = rawEmail.toLowerCase().trim().includes('bx4usa') || rawEmail === 'bx4usa@gmail.com';
  
  if (isMaster) {
    console.log('👑 GHOST BYPASS ATIVADO NO CONTEXTO:', rawEmail);
  }

  // Garantia blindada de que o Mestre sempre terá os acessos ilimitados
  // não importando race conditions, problemas de HMR ou banco de dados.
  const effectiveProfile = React.useMemo(() => {
    if (!profile && !isMaster) return null;
    if (isMaster) {
      return {
        ...(profile || {}),
        id: profile?.id || user?.id || '',
        full_name: profile?.full_name || 'Master Admin',
        plan: 'igreja' as PlanSlug,
        generations_used: profile?.generations_used || 0,
        generations_limit: 999999,
        language: profile?.language || 'PT',
        profile_completed: true
      } as UserProfile;
    }
    return profile;
  }, [profile, isMaster, user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, profile: effectiveProfile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
