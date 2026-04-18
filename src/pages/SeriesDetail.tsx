import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, FileText, Tag, Sparkles, BookOpen, MonitorPlay, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

/* ─────────────────────────────────────────────────────────────
   Tipos
   ───────────────────────────────────────────────────────────── */
interface SeriesWeek {
  number: number;
  title: string;
  passage: string;
  bigIdea?: string;
  summary?: string;
}

interface SermonSeries {
  id: string;
  title: string;
  subtitle?: string;
  overview: string;
  topics: string[];
  weeks: SeriesWeek[];
}

/* ─────────────────────────────────────────────────────────────
   Mock — substituir por fetch ao Supabase quando a tabela
   `sermon_series` existir.
   ───────────────────────────────────────────────────────────── */
const MOCK_SERIES: Record<string, SermonSeries> = {
  'tesouro-da-graca': {
    id: 'tesouro-da-graca',
    title: 'O Tesouro da Graça (Spurgeon)',
    subtitle: '4 semanas',
    overview:
      'Uma exploração da graça soberana de Deus sob a perspectiva do Príncipe dos Pregadores. Cada semana mergulhamos na poesia vitoriana e na profundidade teológica de Spurgeon para entender como a graça nos atrai, nos justifica e nos sustenta até o fim.',
    topics: [
      'Graça Soberana', 'Chamado Eficaz', 'Eleição', 'Justificação', 'Expiação',
      'Paz com Deus', 'Intercessão', 'Ousadia', 'Comunhão', 'Perseverança',
      'Segurança Eterna', 'Fidelidade de Deus',
    ],
    weeks: [
      { number: 1, title: 'O Chamado Soberano', passage: 'Salmo 34:8', bigIdea: 'Provai e vede que o Senhor é bom — a graça começa com um chamado irresistível.', summary: 'Como Deus desperta o coração morto à vida pela primeira vez.' },
      { number: 2, title: 'Justificados pelo Sangue', passage: 'Romanos 5:1', bigIdea: 'Há paz duradoura para quem foi declarado justo pela fé.', summary: 'A doutrina da justificação como fundamento da nossa segurança.' },
      { number: 3, title: 'O Incenso da Oração', passage: 'Tiago 5:16', bigIdea: 'A oração do justo pode muito porque ela alcança o trono.', summary: 'Spurgeon e a vida de oração como respiração da alma.' },
      { number: 4, title: 'Seguros nas Mãos de Deus', passage: 'Filipenses 1:6', bigIdea: 'Aquele que começou a boa obra a completará.', summary: 'A perseverança dos santos como obra contínua de Deus.' },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────
   Página
   ───────────────────────────────────────────────────────────── */
export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const series = useMemo(() => MOCK_SERIES[id || 'tesouro-da-graca'] || MOCK_SERIES['tesouro-da-graca'], [id]);

  // Tab ativa: 'overview' ou número da semana
  const [activeTab, setActiveTab] = useState<'overview' | number>('overview');
  const activeWeek = typeof activeTab === 'number' ? series.weeks.find((w) => w.number === activeTab) : null;

  /* ─── Ponte: Série → Studio de Blocos ─── */
  function handlePrepareSermon(week: SeriesWeek) {
    const params = new URLSearchParams({
      mode: 'blocks',
      week: String(week.number),
      passage: week.passage,
      theme: week.bigIdea || week.title,
      seriesTitle: series.title,
    });
    navigate(`/sermoes?${params.toString()}`);
  }

  const tr = {
    back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
    overview: { PT: 'Visão Geral', EN: 'Overview', ES: 'Visión General' },
    week: { PT: 'Semana', EN: 'Week', ES: 'Semana' },
    weeks: { PT: 'semanas', EN: 'weeks', ES: 'semanas' },
    aboutSeries: { PT: 'SOBRE ESTA SÉRIE', EN: 'ABOUT THIS SERIES', ES: 'SOBRE ESTA SERIE' },
    topics: { PT: 'TÓPICOS', EN: 'TOPICS', ES: 'TEMAS' },
    bigIdea: { PT: 'Grande Ideia', EN: 'Big Idea', ES: 'Gran Idea' },
    passage: { PT: 'Passagem', EN: 'Passage', ES: 'Pasaje' },
    summary: { PT: 'Resumo', EN: 'Summary', ES: 'Resumen' },
    prepare: { PT: 'Preparar sermão desta semana', EN: 'Prepare this week\'s sermon', ES: 'Preparar el sermón de esta semana' },
    openInStudio: { PT: 'Abrir no Studio de Blocos', EN: 'Open in Block Studio', ES: 'Abrir en Studio de Bloques' },
    clickToOpen: { PT: 'Clique em uma semana para preparar o sermão.', EN: 'Click on a week to prepare the sermon.', ES: 'Haga clic en una semana para preparar el sermón.' },
  };

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-20 backdrop-blur-md border-b border-white/5" style={{ background: 'rgba(8,8,8,0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr.back[lang]}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* ─── Cabeçalho da série ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: '#1a1a1a' }}>
              <CalendarDays className="h-4 w-4 text-amber-400" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
              {series.weeks.length} {tr.weeks[lang]}
            </span>
            <p className="text-xs text-zinc-500 italic ml-1">
              {lang === 'PT' ? 'Clique em qualquer texto para editar' : lang === 'ES' ? 'Haga clic en cualquier texto para editar' : 'Click any text to edit'}
            </p>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight font-display">
            {lang === 'PT' ? 'Série:' : lang === 'ES' ? 'Serie:' : 'Series:'} {series.title}
          </h1>
          {series.subtitle && (
            <p className="text-sm text-zinc-400 mt-1">{series.subtitle}</p>
          )}
        </div>

        {/* ─── Layout 2 colunas ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* ┌─ Coluna principal ─┐ */}
          <div>
            {/* Tabs de semanas — pílulas dark modernas */}
            <div className="flex flex-wrap gap-2 mb-5">
              <TabPill
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                label={tr.overview[lang]}
              />
              {series.weeks.map((w) => (
                <TabPill
                  key={w.number}
                  active={activeTab === w.number}
                  onClick={() => setActiveTab(w.number)}
                  label={`${tr.week[lang]} ${w.number}`}
                />
              ))}
            </div>

            {/* Conteúdo da tab ativa */}
            <div
              className="rounded-2xl border border-white/5 p-6 md:p-8"
              style={{ background: '#1a1a1a' }}
            >
              {activeTab === 'overview' ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-3 font-display">{tr.overview[lang]}</h2>
                  <p className="text-zinc-300 leading-relaxed">{series.overview}</p>

                  <div className="my-6 h-px bg-white/5" />

                  <ul className="space-y-1">
                    {series.weeks.map((w) => (
                      <li key={w.number}>
                        <button
                          onClick={() => setActiveTab(w.number)}
                          className="w-full flex items-center gap-4 py-3 px-3 -mx-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        >
                          <span className="flex-none h-9 w-9 rounded-full inline-flex items-center justify-center text-sm font-bold text-primary bg-primary/15 border border-primary/30">
                            {w.number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm md:text-base font-semibold text-white truncate group-hover:text-amber-200 transition-colors">
                              {w.title}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">{w.passage}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-amber-400 transition-colors flex-none" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-zinc-500 italic mt-6 text-center">
                    {tr.clickToOpen[lang]}
                  </p>
                </>
              ) : activeWeek ? (
                <WeekDetail week={activeWeek} lang={lang} tr={tr} onPrepare={() => handlePrepareSermon(activeWeek)} />
              ) : null}
            </div>
          </div>

          {/* ┌─ Sidebar direita ─┐ */}
          <aside className="space-y-4">
            <SidebarCard icon={<FileText className="h-3.5 w-3.5 text-amber-400" />} title={tr.aboutSeries[lang]}>
              <p className="text-sm text-zinc-300">
                {series.weeks.length} {tr.weeks[lang]}
              </p>
            </SidebarCard>

            <SidebarCard icon={<Tag className="h-3.5 w-3.5 text-amber-400" />} title={tr.topics[lang]}>
              <div className="flex flex-wrap gap-1.5">
                {series.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-zinc-300 border border-white/10 hover:border-primary/40 hover:text-primary transition-colors cursor-default"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Subcomponentes
   ───────────────────────────────────────────────────────────── */
function TabPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
          : 'bg-white/[0.03] text-zinc-400 border-white/10 hover:bg-white/[0.06] hover:text-white hover:border-white/20',
      )}
    >
      {label}
    </button>
  );
}

function SidebarCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: '#1a1a1a' }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function WeekDetail({
  week, lang, tr, onPrepare,
}: {
  week: SeriesWeek;
  lang: 'PT' | 'EN' | 'ES';
  tr: Record<string, Record<'PT' | 'EN' | 'ES', string>>;
  onPrepare: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="flex-none h-10 w-10 rounded-full inline-flex items-center justify-center text-base font-bold text-primary bg-primary/15 border border-primary/30">
          {week.number}
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            {tr.week[lang]} {week.number}
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-white font-display">{week.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <InfoBlock icon={<BookOpen className="h-3.5 w-3.5 text-amber-400" />} label={tr.passage[lang]}>
          <p className="text-base font-semibold text-white">{week.passage}</p>
        </InfoBlock>
        {week.bigIdea && (
          <InfoBlock icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />} label={tr.bigIdea[lang]}>
            <p className="text-sm text-zinc-200 leading-snug">{week.bigIdea}</p>
          </InfoBlock>
        )}
      </div>

      {week.summary && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{tr.summary[lang]}</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{week.summary}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
        <button
          onClick={onPrepare}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/30"
        >
          <MonitorPlay className="h-4 w-4" />
          {tr.prepare[lang]}
        </button>
        <button
          onClick={onPrepare}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {tr.openInStudio[lang]}
        </button>
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 p-4" style={{ background: '#0f0f0f' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}
