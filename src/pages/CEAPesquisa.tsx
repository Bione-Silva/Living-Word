import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/cea-theme.css';

const T: Record<string, Record<string, string>> = {
  title: { PT:'Pesquisa Avançada (RAG)', EN:'Advanced Search (RAG)', ES:'Búsqueda Avanzada (RAG)' },
  sub: { PT:'Pesquise por parábolas, personagens, contexto histórico e originais usando IA.', EN:'Search for parables, characters, historical context and originals using AI.', ES:'Busca parábolas, personajes, contexto histórico y originales usando IA.' },
  placeholder: { PT:'Ex: O que significa o fermento na parábola?', EN:'E.g.: What does the leaven mean in the parable?', ES:'Ej: ¿Qué significa la levadura en la parábola?' },
  search: { PT:'Pesquisar', EN:'Search', ES:'Buscar' },
  back: { PT:'← Voltar', EN:'← Back', ES:'← Volver' },
  searching: { PT:'Buscando no banco de conhecimento...', EN:'Searching knowledge base...', ES:'Buscando en la base de conocimiento...' },
  resultsFor: { PT:'Resultados para', EN:'Results for', ES:'Resultados para' },
  relevance: { PT:'Relevância', EN:'Relevance', ES:'Relevancia' },
  source: { PT:'Fonte', EN:'Source', ES:'Fuente' },
  noResults: { PT:'Nenhum resultado encontrado.', EN:'No results found.', ES:'No se encontraron resultados.' },
  error: { PT:'Erro ao buscar dados.', EN:'Error fetching data.', ES:'Error al obtener datos.' }
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

interface SearchResult {
  chunk_id: string;
  content: string;
  similarity: number;
  document_title: string;
}

export default function CEAPesquisa() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 3) {
      handleSearch(initialQuery);
    }
  }, []);

  const handleSearch = async (searchQuery = query) => {
    const q = searchQuery.trim();
    if (!q || q.length < 3) return;
    setLoading(true);
    setHasSearched(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('cea-search', {
        body: { query: q }
      });

      if (error) throw error;
      
      if (data && data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error('RAG Search Error:', err);
      setErrorMsg(t('error', lang));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cea-scope cea-fade-in" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <div className="cea-ws-scroll" style={{ padding: '28px' }}>
        <button onClick={() => navigate('/estudos')} style={{ background:'none', border:'none', color:'var(--cea-purple)', cursor:'pointer', fontSize:12, marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>{t('back', lang)}</button>
        <div className="cea-grid-title">{t('title', lang)}</div>
        <div className="cea-grid-sub">{t('sub', lang)}</div>

        <div className="cea-ws-search">
          <input className="cea-ws-input" placeholder={t('placeholder', lang)} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button className="cea-ws-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? '...' : t('search', lang)}
          </button>
        </div>

        {errorMsg && <div style={{ color: '#ef4444', marginTop: 16 }}>{errorMsg}</div>}

        {hasSearched && (
          <div style={{ marginTop: 32 }}>
            {loading ? (
              <div style={{ color: 'var(--cea-text-muted)', fontStyle: 'italic' }}>{t('searching', lang)}</div>
            ) : results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="cea-field-label">{t('resultsFor', lang)} "{query}" ({results.length})</div>
                {results.map((r, i) => (
                  <div key={i} className="cea-study-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className="cea-sc-num">{t('source', lang)}: {r.document_title || 'Documento'}</span>
                      <span className="cea-tag">{t('relevance', lang)}: {(r.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="cea-field-text" style={{ fontSize: 14, lineHeight: 1.6 }}>
                      {r.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--cea-text-muted)' }}>{t('noResults', lang)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
