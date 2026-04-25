import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/cea-theme.css';

const T: Record<string, Record<string, string>> = {
  title: { PT: 'Panorama Bíblico', EN: 'Bible Overview', ES: 'Panorama Bíblico' },
  sub: { PT: '66 livros da Bíblia com autor, contexto histórico, mensagem central e versículos-chave.', EN: '66 books of the Bible with author, historical context, central message and key verses.', ES: '66 libros de la Biblia con autor, contexto histórico, mensaje central y versículos clave.' },
  back: { PT: '← Voltar', EN: '← Back', ES: '← Volver' },
  overview: { PT: 'Visão Geral', EN: 'Overview', ES: 'Visión General' },
  keys: { PT: 'Versículos-Chave', EN: 'Key Verses', ES: 'Versículos Clave' },
  genSermon: { PT: 'Gerar Sermão', EN: 'Generate Sermon', ES: 'Generar Sermón' },
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

const BOOKS_FALLBACK = [
  { n: 1, nome: 'Gênesis', abrev: 'Gn', test: 'AT', secao: 'Pentateuco', autor: 'Moisés', caps: 50 },
  { n: 2, nome: 'Êxodo', abrev: 'Ex', test: 'AT', secao: 'Pentateuco', autor: 'Moisés', caps: 40 },
  { n: 3, nome: 'Levítico', abrev: 'Lv', test: 'AT', secao: 'Pentateuco', autor: 'Moisés', caps: 27 },
];

const FILTERS = [
  { label: { PT: 'Todos', EN: 'All', ES: 'Todos' }, value: 'all' },
  { label: { PT: 'AT', EN: 'OT', ES: 'AT' }, value: 'at' },
  { label: { PT: 'NT', EN: 'NT', ES: 'NT' }, value: 'nt' },
  null,
  { label: { PT: 'Pentateuco', EN: 'Pentateuch', ES: 'Pentateuco' }, value: 'Pentateuco' },
  { label: { PT: 'Poético', EN: 'Poetic', ES: 'Poético' }, value: 'Poético' },
  { label: { PT: 'Evangelho', EN: 'Gospel', ES: 'Evangelio' }, value: 'Evangelho' },
  { label: { PT: 'Paulina', EN: 'Pauline', ES: 'Paulina' }, value: 'Paulina' },
];

export default function CEAPanorama() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [books, setBooks] = useState<any[]>(BOOKS_FALLBACK);
  const [selected, setSelected] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase.from('lw_bible_books').select('*').order('numero_canon');
      if (data && !error) {
        setBooks(data.map(b => {
          const fallback = BOOKS_FALLBACK.find(f => f.n === b.numero_canon);
          return {
            n: b.numero_canon,
            nome: b.nome,
            abrev: b.abreviacao || b.nome.substring(0, 3),
            test: b.testamento,
            secao: b.secao,
            autor: b.autor,
            data: b.data_escrita,
            caps: b.total_capitulos || fallback?.caps || 0,
            tags: b.temas_principais || [],
            desc: b.resumo || 'Visão geral teológica e histórica extraída do material didático...',
            keys: b.versiculos_chave || []
          };
        }));
      }
    };
    fetchBooks();
  }, []);

  const filtered = filter === 'all' ? books : filter === 'at' ? books.filter(b => b.test === 'AT') : filter === 'nt' ? books.filter(b => b.test === 'NT') : books.filter(b => b.secao === filter);

  return (
    <div className="cea-scope cea-fade-in" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div className="cea-grid-main">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--cea-purple)', cursor: 'pointer', fontSize: 12, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>{t('back', lang)}</button>
        <div className="cea-grid-title">{t('title', lang)}</div>
        <div className="cea-grid-sub">{t('sub', lang)}</div>
        <div className="cea-filter-bar">
          {FILTERS.map((f, i) => f === null ? <div key={i} className="cea-filter-sep" /> : (
            <button key={f.value} className={`cea-filter-pill${filter === f.value ? ' active' : ''}`} onClick={() => setFilter(f.value)}>{f.label[lang as keyof typeof f.label] || f.label.PT}</button>
          ))}
        </div>
        <div className="cea-study-grid">
          {filtered.map(b => (
            <div key={b.n} className={`cea-study-card${selected?.n === b.n ? ' selected' : ''}`} onClick={() => { setSelected(b); setActiveTab('overview'); }}>
              <div className="cea-sc-num">#{String(b.n).padStart(2, '0')} · {b.abrev}</div>
              <div className="cea-sc-title">{b.nome}</div>
              <div className="cea-sc-ref">{b.secao} · {b.caps} caps</div>
              <div className="cea-sc-tags"><span className="cea-tag">{b.test}</span><span className="cea-tag">{b.autor}</span></div>
              <div className="cea-sc-prog"><div className="cea-sc-prog-fill" style={{ width: '0%' }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className={`cea-deep-panel${selected ? ' open' : ''}`}>
        {selected && <>
          <div className="cea-dp-header">
            <div style={{ flex: 1 }}>
              <div className="cea-dp-ref">{selected.secao} · {selected.caps} capítulos</div>
              <div className="cea-dp-title">{selected.nome}</div>
              <div className="cea-dp-type">{selected.autor}</div>
            </div>
            <button className="cea-dp-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="cea-dp-tabs">
            {['overview', 'keys'].map(tb => <div key={tb} className={`cea-dp-tab${activeTab === tb ? ' active' : ''}`} onClick={() => setActiveTab(tb)}>{t(tb, lang)}</div>)}
          </div>
          <div className="cea-dp-body">
            {activeTab === 'overview' && <div className="cea-field-text">{selected.desc}</div>}
            {activeTab === 'keys' && (
              <ul className="cea-app-list">
                {selected.keys && selected.keys.length > 0 ? (
                  selected.keys.map((k: string, idx: number) => <li key={idx} className="cea-app-item"><div className="cea-app-num">{idx + 1}</div><div>{k}</div></li>)
                ) : (
                  <li className="cea-app-item"><div>Versículos-chave sendo processados pelo motor de IA...</div></li>
                )}
              </ul>
            )}
          </div>
          <div className="cea-dp-footer">
            <button className="cea-dp-action primary" onClick={() => navigate('/sermoes')}>📝 {t('genSermon', lang)}</button>
          </div>
        </>}
      </div>
    </div>
  );
}
