import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/* ─── Types ─── */

export interface CEAProgressItem {
  modulo: string;
  status: string;
  percentual: number;
  item_id?: string;
  updated_at?: string;
}

export interface CEASearchResult {
  id: string;
  tipo: string;
  titulo?: string;
  nome?: string;
  referencia?: string;
  content?: string;
  similarity: number;
}

/* ─── useCEAProgress ─── */

export function useCEAProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CEAProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('lw_cea_progress')
      .select('modulo, status, percentual, item_id, updated_at')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setProgress(data);
        setLoading(false);
      });
  }, [user]);

  const getModuleProgress = useCallback((modulo: string) => {
    const items = progress.filter(p => p.modulo === modulo);
    if (items.length === 0) return 0;
    const concluded = items.filter(i => i.status === 'concluido').length;
    return Math.round((concluded / items.length) * 100);
  }, [progress]);

  return { progress, loading, getModuleProgress };
}

/* ─── useCEASearch ─── */

export function useCEASearch() {
  const [results, setResults] = useState<CEASearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, limit = 6) => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('cea-search', {
        body: { query, limit }
      });
      if (fnErr) throw fnErr;
      setResults(data?.results || []);
    } catch (err) {
      console.error('CEA Search error:', err);
      setError('Erro ao buscar. Tente novamente.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const clear = useCallback(() => { setResults([]); setError(null); }, []);

  return { results, searching, error, search, clear };
}

/* ─── useCEAChunks — raw semantic search on knowledge.chunks ─── */

export function useCEAChunks() {
  const [chunks, setChunks] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const searchChunks = useCallback(async (query: string, docType?: string, limit = 10) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cea-search', {
        body: { query, doc_type: docType, limit }
      });
      if (error) throw error;
      setChunks(data?.results || []);
    } catch (err) {
      console.error('Chunk search error:', err);
      setChunks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { chunks, loading, searchChunks };
}
