import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/cea-theme.css';

const T: Record<string, Record<string, string>> = {
  title: { PT:'Parábolas de Jesus', EN:'Parables of Jesus', ES:'Parábolas de Jesús' },
  sub: { PT:'40 parábolas com contexto histórico, análise do grego e aplicação pastoral.', EN:'40 parables with historical context, Greek analysis and pastoral application.', ES:'40 parábolas con contexto histórico, análisis del griego y aplicación pastoral.' },
  all: { PT:'Todas', EN:'All', ES:'Todas' },
  context: { PT:'Contexto', EN:'Context', ES:'Contexto' },
  original: { PT:'Original', EN:'Original', ES:'Original' },
  message: { PT:'Mensagem', EN:'Message', ES:'Mensaje' },
  versions: { PT:'Versões', EN:'Versions', ES:'Versiones' },
  apply: { PT:'Aplicação', EN:'Application', ES:'Aplicación' },
  histCtx: { PT:'Contexto Histórico', EN:'Historical Context', ES:'Contexto Histórico' },
  insight: { PT:'Insight Teológico', EN:'Theological Insight', ES:'Insight Teológico' },
  keyword: { PT:'Palavra-chave', EN:'Keyword', ES:'Palabra clave' },
  morpho: { PT:'Morfologia', EN:'Morphology', ES:'Morfología' },
  meaning: { PT:'Significado', EN:'Meaning', ES:'Significado' },
  genSermon: { PT:'Gerar Sermão', EN:'Generate Sermon', ES:'Generar Sermón' },
  carousel: { PT:'Carrossel', EN:'Carousel', ES:'Carrusel' },
  devotional: { PT:'Devocional', EN:'Devotional', ES:'Devocional' },
  back: { PT:'← Voltar', EN:'← Back', ES:'← Volver' },
  done: { PT:'concluído', EN:'completed', ES:'completado' },
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

const PARABOLAS_FALLBACK = [
  { n:1, t:'O Semeador', r:'Mateus 13:3-23', ev:'Mateus', tags:['ensino','reino'], p:100, ctx:'Jesus estava à beira do mar da Galileia, ensinando multidões tão grandes que precisou entrar num barco. O cenário agrícola era cotidiano para os ouvintes — todos conheciam a frustração de semear em solo ruim.', origWord:'σπείρω', origTrans:'speirō — semear, espalhar', origStrongs:'G4687', origMorpho:'Verbo · Aoristo · Ativo · Infinitivo', origMeaning:'Lançar semente; metáfora para disseminar a Palavra de Deus.', insightText:'<strong>A parábola inverte a expectativa</strong>: o foco não está no semeador (qualidade), mas no solo (receptividade). Jesus redefine produtividade espiritual — o mesmo Evangelho produz resultados radicalmente diferentes dependendo do coração que o recebe.' },
  { n:2, t:'O Joio e o Trigo', r:'Mateus 13:24-30', ev:'Mateus', tags:['juízo','paciência'], p:85 },
  { n:3, t:'O Grão de Mostarda', r:'Mateus 13:31-32', ev:'Mateus', tags:['reino','crescimento'], p:90 },
  { n:4, t:'O Fermento', r:'Mateus 13:33', ev:'Mateus', tags:['reino','transformação'], p:70 },
  { n:5, t:'O Tesouro Escondido', r:'Mateus 13:44', ev:'Mateus', tags:['reino','valor'], p:60 },
];

const FILTERS = [
  { label: { PT:'Todas', EN:'All', ES:'Todas' }, value: 'all' },
  { label: { PT:'AT', EN:'OT', ES:'AT' }, value: 'at' },
  { label: { PT:'NT', EN:'NT', ES:'NT' }, value: 'nt' },
  null,
  { label: { PT:'Perdão / Graça', EN:'Forgiveness / Grace', ES:'Perdón / Gracia' }, value: 'grace' },
  { label: { PT:'Reino', EN:'Kingdom', ES:'Reino' }, value: 'kingdom' },
  { label: { PT:'Juízo', EN:'Judgment', ES:'Juicio' }, value: 'judgment' },
  { label: { PT:'Oração', EN:'Prayer', ES:'Oración' }, value: 'prayer' },
];

const TABS = ['context', 'original', 'message', 'versions', 'apply'];

export default function CEAParabolas() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [parabolas, setParabolas] = useState<any[]>(PARABOLAS_FALLBACK);
  const [selected, setSelected] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('context');

  useEffect(() => {
    const fetchParabolas = async () => {
      const { data, error } = await supabase.from('lw_parables').select('*').order('numero');
      if (data && !error) {
        setParabolas(data.map(p => {
          const fallback = PARABOLAS_FALLBACK.find(f => f.n === p.numero);
          return {
            n: p.numero,
            t: p.titulo,
            r: p.referencia,
            ev: p.evangelho,
            tags: p.temas || [],
            p: fallback?.p || 0,
            ctx: p.contexto_epoca || fallback?.ctx || 'Contexto histórico extraído do material didático...',
            origWord: fallback?.origWord || '',
            origTrans: fallback?.origTrans || '',
            origStrongs: fallback?.origStrongs || '',
            origMorpho: fallback?.origMorpho || '',
            origMeaning: fallback?.origMeaning || '',
            insightText: p.mensagem_central || fallback?.insightText || 'Insight teológico em breve...',
          };
        }));
      }
    };
    fetchParabolas();
  }, []);

  const tagMap: Record<string, string[]> = { grace:['perdão','graça','restauração'], kingdom:['reino','crescimento','transformação'], judgment:['juízo','separação','rejeição'], prayer:['oração','persistência'] };
  const filtered = filter === 'all' ? parabolas : parabolas.filter(p => tagMap[filter]?.some(tg => p.tags?.includes(tg)));

  return (
    <div className="cea-scope cea-fade-in" style={{ display:'flex', flex:1, overflow:'hidden' }}>
      {/* GRID */}
      <div className="cea-grid-main">
        <button onClick={() => navigate('/estudos')} style={{ background:'none', border:'none', color:'var(--cea-purple)', cursor:'pointer', fontSize:12, marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>{t('back', lang)}</button>
        <div className="cea-grid-title">{t('title', lang)}</div>
        <div className="cea-grid-sub">{t('sub', lang)}</div>
        <div className="cea-filter-bar">
          {FILTERS.map((f, i) => f === null ? <div key={i} className="cea-filter-sep" /> : (
            <button key={f.value} className={`cea-filter-pill${filter === f.value ? ' active' : ''}`} onClick={() => setFilter(f.value)}>{f.label[lang as keyof typeof f.label] || f.label.PT}</button>
          ))}
        </div>
        <div className="cea-study-grid">
          {filtered.map(p => (
            <div key={p.n} className={`cea-study-card${selected?.n === p.n ? ' selected' : ''}`} onClick={() => { setSelected(p); setActiveTab('context'); }}>
              <div className="cea-sc-num">#{String(p.n).padStart(2, '0')} · {p.ev}</div>
              <div className="cea-sc-title">{p.t}</div>
              <div className="cea-sc-ref">{p.r}</div>
              <div className="cea-sc-tags">{p.tags.map(tg => <span key={tg} className="cea-tag">{tg}</span>)}</div>
              <div className="cea-sc-prog"><div className="cea-sc-prog-fill" style={{ width: `${p.p}%` }} /></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                <span style={{ fontSize:10, color:'var(--cea-text-3)' }}>{p.p}% {t('done', lang)}</span>
                {p.p === 100 && <span style={{ fontSize:10, color:'#10B981' }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEEP PANEL */}
      <div className={`cea-deep-panel${selected ? ' open' : ''}`}>
        {selected && <>
          <div className="cea-dp-header">
            <div style={{ flex:1 }}>
              <div className="cea-dp-ref">{selected.r}</div>
              <div className="cea-dp-title">{selected.t}</div>
              <div className="cea-dp-type">Parábola</div>
            </div>
            <button className="cea-dp-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="cea-dp-tabs">
            {TABS.map(tb => <div key={tb} className={`cea-dp-tab${activeTab === tb ? ' active' : ''}`} onClick={() => setActiveTab(tb)}>{t(tb, lang)}</div>)}
          </div>
          <div className="cea-dp-body">
            {activeTab === 'context' && <>
              <div className="cea-field-label">{t('histCtx', lang)}</div>
              <div className="cea-field-text" style={{ marginBottom:18 }}>{selected.ctx || 'Contexto histórico em breve...'}</div>
              {selected.insightText && <>
                <div className="cea-field-label">{t('insight', lang)}</div>
                <div className="cea-insight-box" dangerouslySetInnerHTML={{ __html: selected.insightText }} />
              </>}
            </>}
            {activeTab === 'original' && <>
              {selected.origWord ? (
                <div className="cea-orig-box">
                  <div className="cea-orig-word">{selected.origWord}</div>
                  <div className="cea-orig-trans">{selected.origTrans}</div>
                  <span className="cea-strongs-badge">{selected.origStrongs}</span>
                  <table className="cea-orig-table" style={{ marginTop:14 }}>
                    <tbody>
                      <tr><td>{t('keyword', lang)}</td><td>{selected.origWord}</td></tr>
                      <tr><td>{t('morpho', lang)}</td><td>{selected.origMorpho}</td></tr>
                      <tr><td>{t('meaning', lang)}</td><td>{selected.origMeaning}</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : <div className="cea-field-text" style={{ color:'var(--cea-text-3)' }}>Análise do original em breve...</div>}
            </>}
            {activeTab === 'versions' && <>
              <div className="cea-ver-item"><div className="cea-ver-badge cea-vb-nvi">NVI</div><div className="cea-ver-text">"Ouçam! O semeador saiu a semear..."</div></div>
              <div className="cea-ver-item"><div className="cea-ver-badge cea-vb-ara">ARA</div><div className="cea-ver-text">"Eis que o semeador saiu a semear..."</div></div>
              <div className="cea-ver-item"><div className="cea-ver-badge cea-vb-naa">NAA</div><div className="cea-ver-text">"Certo semeador saiu a semear..."</div></div>
            </>}
            {activeTab === 'message' && <div className="cea-field-text">Mensagem central e aplicação teológica em breve...</div>}
            {activeTab === 'apply' && (
              <ul className="cea-app-list">
                {[1,2,3].map(n => <li key={n} className="cea-app-item"><div className="cea-app-num">{n}</div><div>Ponto de aplicação pastoral #{n} em breve...</div></li>)}
              </ul>
            )}
          </div>
          <div className="cea-dp-footer">
            <button className="cea-dp-action primary" onClick={() => navigate('/sermoes')}>📝 {t('genSermon', lang)}</button>
            <button className="cea-dp-action" onClick={() => navigate('/social-studio')}>🎨 {t('carousel', lang)}</button>
            <button className="cea-dp-action">✍️ {t('devotional', lang)}</button>
          </div>
        </>}
      </div>
    </div>
  );
}
