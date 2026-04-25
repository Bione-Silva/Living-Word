import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import '@/styles/cea-theme.css';

/* ─── i18n ─── */
const T: Record<string, Record<string, string>> = {
  eyebrow:     { PT: 'Centro de Estudos Avançados', EN: 'Advanced Studies Center', ES: 'Centro de Estudios Avanzados' },
  heroTitle1:  { PT: 'Teologia de seminário', EN: 'Seminary-level theology', ES: 'Teología de seminario' },
  heroTitle2:  { PT: 'ao alcance de ', EN: 'within reach of ', ES: 'al alcance de ' },
  heroTitle3:  { PT: 'todo líder', EN: 'every leader', ES: 'todo líder' },
  heroSub:     { PT: '40 parábolas, 200 personagens, 66 livros, grego e hebraico originais — tudo conectado à geração de sermões, carrosséis e materiais.', EN: '40 parables, 200 characters, 66 books, original Greek and Hebrew — all connected to sermon, carousel and material generation.', ES: '40 parábolas, 200 personajes, 66 libros, griego y hebreo originales — todo conectado a la generación de sermones, carruseles y materiales.' },
  parables:    { PT: 'Parábolas', EN: 'Parables', ES: 'Parábolas' },
  characters:  { PT: 'Personagens', EN: 'Characters', ES: 'Personajes' },
  books:       { PT: 'Livros', EN: 'Books', ES: 'Libros' },
  questions:   { PT: 'Questões', EN: 'Questions', ES: 'Preguntas' },
  searchPh:    { PT: 'Pesquise por qualquer ', EN: 'Search for any ', ES: 'Busque cualquier ' },
  searchBold:  { PT: 'parábola, personagem, livro, palavra em grego ou hebraico', EN: 'parable, character, book, Greek or Hebrew word', ES: 'parábola, personaje, libro, palabra en griego o hebreo' },
  modules:     { PT: 'Módulos de estudo', EN: 'Study modules', ES: 'Módulos de estudio' },
  continueT:   { PT: 'Continue de onde parou', EN: 'Continue where you left off', ES: 'Continúa donde lo dejaste' },
  viewAll:     { PT: 'Ver todos', EN: 'View all', ES: 'Ver todos' },
  studyDay:    { PT: 'Estudo do dia', EN: 'Study of the day', ES: 'Estudio del día' },
  studyNow:    { PT: 'Estudar agora', EN: 'Study now', ES: 'Estudiar ahora' },
  genSermon:   { PT: 'Gerar sermão', EN: 'Generate sermon', ES: 'Generar sermón' },
  makeCarousel:{ PT: 'Criar carrossel', EN: 'Create carousel', ES: 'Crear carrusel' },
  items:       { PT: 'itens', EN: 'items', ES: 'ítems' },
  booksLabel:  { PT: 'livros', EN: 'books', ES: 'libros' },
  unlimited:   { PT: 'ilimitado', EN: 'unlimited', ES: 'ilimitado' },
  questLabel:  { PT: 'questões', EN: 'questions', ES: 'preguntas' },
  dashboard:   { PT: 'dashboard', EN: 'dashboard', ES: 'panel' },
  done:        { PT: 'concluído', EN: 'completed', ES: 'completado' },
  dayLabel:    { PT: 'Parábola do dia', EN: 'Parable of the day', ES: 'Parábola del día' },
  ago2d:       { PT: 'há 2 dias', EN: '2 days ago', ES: 'hace 2 días' },
  ago5d:       { PT: 'há 5 dias', EN: '5 days ago', ES: 'hace 5 días' },
  ago1w:       { PT: 'há 1 sem', EN: '1 week ago', ES: 'hace 1 sem' },
  // Module names
  mParabolas:     { PT: 'Parábolas', EN: 'Parables', ES: 'Parábolas' },
  mParabolasDesc: { PT: '40 parábolas de Jesus com contexto histórico, análise do grego e aplicação pastoral.', EN: '40 parables of Jesus with historical context, Greek analysis and pastoral application.', ES: '40 parábolas de Jesús con contexto histórico, análisis del griego y aplicación pastoral.' },
  mPersonagens:     { PT: 'Personagens', EN: 'Characters', ES: 'Personajes' },
  mPersonagensDesc: { PT: '200 personagens bíblicos com biografia, cronologia, lições e estudos tipológicos.', EN: '200 biblical characters with biography, chronology, lessons and typological studies.', ES: '200 personajes bíblicos con biografía, cronología, lecciones y estudios tipológicos.' },
  mPanorama:     { PT: 'Panorama', EN: 'Overview', ES: 'Panorama' },
  mPanoramaDesc: { PT: '66 livros da Bíblia com autor, contexto histórico, mensagem central e versículos-chave.', EN: '66 books of the Bible with author, historical context, central message and key verses.', ES: '66 libros de la Biblia con autor, contexto histórico, mensaje central y versículos clave.' },
  mOriginal:     { PT: 'Pesquisa do Original', EN: 'Original Language', ES: 'Idioma Original' },
  mOriginalDesc: { PT: 'Grego · Hebraico · Aramaico — morfologia completa, Strong\'s e comparação de versões.', EN: 'Greek · Hebrew · Aramaic — full morphology, Strong\'s and version comparison.', ES: 'Griego · Hebreo · Arameo — morfología completa, Strong\'s y comparación de versiones.' },
  mQuiz:     { PT: 'Quiz Bíblico', EN: 'Bible Quiz', ES: 'Quiz Bíblico' },
  mQuizDesc: { PT: '250 perguntas + geração automática por IA. Sessões gamificadas com conquistas.', EN: '250 questions + AI auto-generation. Gamified sessions with achievements.', ES: '250 preguntas + generación automática por IA. Sesiones gamificadas con logros.' },
  mProgress:     { PT: 'Meu Progresso', EN: 'My Progress', ES: 'Mi Progreso' },
  mProgressDesc: { PT: 'Streak, conquistas, histórico de estudos e dashboard de desempenho completo.', EN: 'Streak, achievements, study history and full performance dashboard.', ES: 'Racha, logros, historial de estudios y panel de rendimiento completo.' },
};
const t = (key: string, lang: string) => T[key]?.[lang] || T[key]?.PT || key;

/* ─── Module config ─── */
const MODULES = [
  { id: 'parabolas', icon: '📖', nameKey: 'mParabolas', descKey: 'mParabolasDesc', countLabel: '40 ', countKey: 'items', color: 'cea-mc-teal', pct: 20, pctColor: '#14B8A6', href: '/estudos/parabolas' },
  { id: 'personagens', icon: '👤', nameKey: 'mPersonagens', descKey: 'mPersonagensDesc', countLabel: '200 ', countKey: 'items', color: 'cea-mc-blue', pct: 10, pctColor: '#3B82F6', href: '/estudos/personagens' },
  { id: 'panorama', icon: '📚', nameKey: 'mPanorama', descKey: 'mPanoramaDesc', countLabel: '66 ', countKey: 'booksLabel', color: 'cea-mc-gold', pct: 30, pctColor: '#F59E0B', href: '/estudos/livros' },
  { id: 'original', icon: '🔬', nameKey: 'mOriginal', descKey: 'mOriginalDesc', countLabel: '', countKey: 'unlimited', color: 'cea-mc-coral', pct: -1, pctColor: '', href: '/estudos/pesquisa' },
  { id: 'quiz', icon: '🎯', nameKey: 'mQuiz', descKey: 'mQuizDesc', countLabel: '250+ ', countKey: 'questLabel', color: 'cea-mc-purple', pct: 40, pctColor: '#9F67FF', href: '/estudos/quiz' },
  { id: 'progress', icon: '🏆', nameKey: 'mProgress', descKey: 'mProgressDesc', countLabel: '', countKey: 'dashboard', color: 'cea-mc-green', pct: -1, pctColor: '', href: '/estudos/meu-progresso' },
];

const CONTINUE = [
  { type: 'Parábola', title: 'O Filho Pródigo', pct: 68, color: '#7C3AED', agoKey: 'ago2d', href: '/estudos/parabolas' },
  { type: 'Personagem', title: 'Elias', pct: 45, color: '#3B82F6', agoKey: 'ago5d', href: '/estudos/personagens' },
  { type: 'Panorama', title: 'Romanos', pct: 30, color: '#F59E0B', agoKey: 'ago1w', href: '/estudos/livros' },
];

export default function CEAHome() {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const today = new Date();
  const dayNames: Record<string, string[]> = {
    PT: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
    EN: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    ES: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  };
  const monthNames: Record<string, string[]> = {
    PT: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
    EN: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    ES: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  };
  const dayStr = `${dayNames[lang]?.[today.getDay()] || dayNames.PT[today.getDay()]}, ${today.getDate()} ${monthNames[lang]?.[today.getMonth()] || monthNames.PT[today.getMonth()]}`;

  return (
    <div className="cea-scope cea-fade-in" style={{ padding: '28px 28px 40px', overflowY: 'auto', flex: 1 }}>

      {/* ═══ HERO ═══ */}
      <div className="cea-hero" style={{ marginBottom: 24 }}>
        <div className="cea-hero-eyebrow">{t('eyebrow', lang)}</div>
        <div className="cea-hero-title">
          {t('heroTitle1', lang)}<br />
          {t('heroTitle2', lang)}<em>{t('heroTitle3', lang)}</em>
        </div>
        <div className="cea-hero-sub">{t('heroSub', lang)}</div>
        <div className="cea-hero-stats">
          <div className="cea-hero-stat"><div className="n">40</div><div className="l">{t('parables', lang)}</div></div>
          <div className="cea-hero-stat"><div className="n">200</div><div className="l">{t('characters', lang)}</div></div>
          <div className="cea-hero-stat"><div className="n">66</div><div className="l">{t('books', lang)}</div></div>
          <div className="cea-hero-stat"><div className="n">250+</div><div className="l">{t('questions', lang)}</div></div>
        </div>
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="cea-search-bar" style={{ marginBottom: 24, cursor: 'text' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text"
          placeholder={`${t('searchPh', lang)}${t('searchBold', lang)}…`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim().length >= 3) {
              navigate(`/estudos/pesquisa?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
            }
          }}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            outline: 'none', 
            color: 'var(--cea-text-1)',
            flex: 1,
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif"
          }}
        />
        <span className="cea-kbd" style={{ flexShrink: 0 }}>⌘K</span>
      </div>

      {/* ═══ MODULES GRID ═══ */}
      <div className="cea-section-head"><div className="cea-section-title">{t('modules', lang)}</div></div>
      <div className="cea-modules-grid" style={{ marginBottom: 24 }}>
        {MODULES.map(m => (
          <div key={m.id} className={`cea-module-card ${m.color}`} onClick={() => navigate(m.href)}>
            <span className="cea-module-icon">{m.icon}</span>
            <div className="cea-module-name">{t(m.nameKey, lang)}</div>
            <div className="cea-module-desc">{t(m.descKey, lang)}</div>
            <div className="cea-module-meta">
              <span className="cea-module-count">{m.countLabel}{t(m.countKey, lang)}</span>
              {m.pct >= 0 && (
                <span style={{ fontSize: 11, color: m.pctColor }}>{m.pct}% {t('done', lang)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ CONTINUE ═══ */}
      <div className="cea-section-head">
        <div className="cea-section-title">{t('continueT', lang)}</div>
        <div className="cea-section-link">{t('viewAll', lang)}</div>
      </div>
      <div className="cea-continue-grid" style={{ marginBottom: 24 }}>
        {CONTINUE.map((c, i) => (
          <div key={i} className="cea-continue-card" onClick={() => navigate(c.href)}>
            <div className="cea-cc-type">{c.type}</div>
            <div className="cea-cc-title">{c.title}</div>
            <div className="cea-cc-bar"><div className="cea-cc-fill" style={{ width: `${c.pct}%`, background: c.color }} /></div>
            <div className="cea-cc-meta">
              <span className="cea-cc-pct">{c.pct}%</span>
              <span className="cea-cc-ago">{t(c.agoKey, lang)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ STUDY OF THE DAY ═══ */}
      <div className="cea-section-head"><div className="cea-section-title">{t('studyDay', lang)}</div></div>
      <div className="cea-study-day" onClick={() => navigate('/estudos/parabolas')}>
        <div style={{ flex: 1 }}>
          <div className="cea-sd-eyebrow">{t('dayLabel', lang)} · {dayStr}</div>
          <div className="cea-sd-title">O Bom Samaritano</div>
          <div className="cea-sd-ref">Lucas 10:30-37</div>
          <div className="cea-sd-desc">
            {lang === 'EN'
              ? 'The most powerful parable about loving your neighbor — told in a context of real ethnic tension between Jews and Samaritans in the 1st century.'
              : lang === 'ES'
              ? 'La parábola más poderosa sobre el amor al prójimo — contada en un contexto de tensión étnica real entre judíos y samaritanos en el siglo I.'
              : 'A parábola mais poderosa sobre amor ao próximo — contada em um contexto de tensão étnica real entre judeus e samaritanos no século I.'}
          </div>
          <div className="cea-sd-actions">
            <button className="cea-btn cea-btn-primary" onClick={e => { e.stopPropagation(); navigate('/estudos/parabolas'); }}>
              {t('studyNow', lang)}
            </button>
            <button className="cea-btn cea-btn-ghost" onClick={e => { e.stopPropagation(); navigate('/sermoes'); }}>
              {t('genSermon', lang)}
            </button>
            <button className="cea-btn cea-btn-ghost" onClick={e => { e.stopPropagation(); navigate('/social-studio'); }}>
              {t('makeCarousel', lang)}
            </button>
          </div>
        </div>
        <div className="cea-sd-icon">📖</div>
      </div>
    </div>
  );
}
