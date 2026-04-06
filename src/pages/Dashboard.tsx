import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Wand2, PenLine, Type, BookOpen, Languages, Search, Globe, Quote,
  Clapperboard, ScrollText, Lightbulb, Sparkles, Crown, Film,
  Gamepad2, Feather, Baby, ArrowRightLeft, GraduationCap,
  FileText, Mic, ChevronRight, Package
} from 'lucide-react';
import { ToolCard, type ToolCardData } from '@/components/ToolCard';
import { ToolSheet } from '@/components/ToolSheet';
import { ExtrasModal } from '@/components/ExtrasModal';

/* ─── Tool definitions ─── */
const researchTools: ToolCardData[] = [
  { id: 'topic-explorer', icon: Search, title: { PT: 'Explorador de Tópicos', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: 'Descubra subtemas e ângulos para sua pregação', EN: 'Discover subtopics and angles for your sermon', ES: 'Descubre subtemas y ángulos para tu sermón' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, description: { PT: 'Busque versículos relevantes por tema', EN: 'Search relevant verses by topic', ES: 'Busca versículos relevantes por tema' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: 'Contexto cultural e histórico da passagem', EN: 'Cultural and historical context', ES: 'Contexto cultural e histórico' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: 'Citações de teólogos e pensadores cristãos', EN: 'Quotes from theologians and thinkers', ES: 'Citas de teólogos y pensadores' }, hasModal: true },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: 'Explore Grego e Hebraico simplificado', EN: 'Explore simplified Greek and Hebrew', ES: 'Explora Griego y Hebreo simplificado' }, locked: true, hasModal: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: 'Análise de palavras originais e raízes', EN: 'Original word analysis and roots', ES: 'Análisis de palabras originales' }, locked: true, hasModal: true },
];

const createTools: ToolCardData[] = [
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: 'Gere sermões, esboços e devocionais', EN: 'Generate sermons, outlines and devotionals', ES: 'Genera sermones, bosquejos y devocionales' }, hasModal: true },
  { id: 'biblical-study', icon: GraduationCap, title: { PT: 'Estudo Bíblico Completo', EN: 'Complete Bible Study', ES: 'Estudio Bíblico Completo' }, description: { PT: 'Estudo teológico profundo com 8 seções', EN: 'Deep theological study with 8 sections', ES: 'Estudio teológico profundo con 8 secciones' }, path: '/estudos/novo' },
  { id: 'free-article', icon: PenLine, title: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, description: { PT: 'Crie artigos de blog de qualquer tema', EN: 'Create blog articles on any topic', ES: 'Crea artículos de blog' }, hasModal: true },
  { id: 'title-gen', icon: Type, title: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' }, description: { PT: 'Ideias criativas de títulos para sermões', EN: 'Creative title ideas for sermons', ES: 'Ideas creativas de títulos' }, hasModal: true },
  { id: 'metaphor-creator', icon: Lightbulb, title: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, description: { PT: 'Metáforas poderosas para sua mensagem', EN: 'Powerful metaphors for your message', ES: 'Metáforas poderosas para tu mensaje' }, hasModal: true },
  { id: 'illustrations', icon: Film, title: { PT: 'Ilustrações para Sermões', EN: 'Sermon Illustrations', ES: 'Ilustraciones' }, description: { PT: 'Histórias e ilustrações contemporâneas', EN: 'Contemporary stories and illustrations', ES: 'Historias e ilustraciones contemporáneas' }, locked: true, hasModal: true },
  { id: 'bible-modernizer', icon: Sparkles, title: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' }, description: { PT: 'Recontextualize histórias bíblicas', EN: 'Recontextualize Bible stories', ES: 'Recontextualiza historias bíblicas' }, hasModal: true },
  { id: 'free-article-universal', icon: PenLine, title: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' }, description: { PT: 'Crie artigos e textos de qualquer tema', EN: 'Create articles on any topic', ES: 'Crea artículos de cualquier tema' }, hasModal: true },
];

// Keep outreach/fun tools for allTools lookup (used by ?tool= param)
const outreachTools: ToolCardData[] = [
  { id: 'reels-script', icon: Wand2, title: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'cell-group', icon: Wand2, title: { PT: 'Estudo de Célula', EN: 'Cell Group Study', ES: 'Estudio de Célula' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'social-caption', icon: Wand2, title: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'newsletter', icon: Wand2, title: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'announcements', icon: Wand2, title: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
];
const funTools: ToolCardData[] = [
  { id: 'trivia', icon: Gamepad2, title: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'poetry', icon: Feather, title: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'kids-story', icon: Baby, title: { PT: 'Histórias Infantis', EN: 'Kids Stories', ES: 'Historias Infantiles' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'deep-translation', icon: ArrowRightLeft, title: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' }, description: { PT: '', EN: '', ES: '' }, locked: true, hasModal: true },
];

const allTools: ToolCardData[] = [...researchTools, ...createTools, ...outreachTools, ...funTools];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFree = profile?.plan === 'free';
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string } | null>(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const requestedToolId = searchParams.get('tool');

  const [stats, setStats] = useState({ sermons: 0, studies: 0, articles: 0, devotionals: 0, total: 0 });
  const [recentMaterials, setRecentMaterials] = useState<Array<{ id: string; title: string; type: string; passage: string | null; language: string | null; created_at: string }>>([]);

  const userName = profile?.full_name?.split(' ')[0] || (lang === 'PT' ? 'Amigo' : lang === 'EN' ? 'Friend' : 'Amigo');

  // Adaptive quick access: map material types → quick tool entries
  const typeToQuickTool: Record<string, { icon: string; label: Record<'PT' | 'EN' | 'ES', string>; action: () => void }> = {
    sermon: { icon: '📖', label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, action: () => handleToolClick(createTools[0]) },
    pastoral: { icon: '📖', label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, action: () => handleToolClick(createTools[0]) },
    biblical_study: { icon: '📚', label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, action: () => navigate('/estudos/novo') },
    study: { icon: '📚', label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, action: () => navigate('/estudos/novo') },
    article: { icon: '✍️', label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: () => navigate('/blog') },
    blog: { icon: '✍️', label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: () => navigate('/blog') },
    blog_article: { icon: '✍️', label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: () => navigate('/blog') },
    devotional: { icon: '📖', label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, action: () => handleToolClick(createTools[0]) },
  };

  const defaultQuickTools = [
    { icon: '📖', label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, action: () => handleToolClick(createTools[0]) },
    { icon: '📚', label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, action: () => navigate('/estudos/novo') },
    { icon: '✍️', label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: () => navigate('/blog') },
    { icon: '🔎', label: { PT: 'Pesquisa', EN: 'Research', ES: 'Investigación' }, action: () => handleToolClick(researchTools[0]) },
  ];

  const [adaptiveQuickTools, setAdaptiveQuickTools] = useState<typeof defaultQuickTools | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Fetch last 30 days of materials for adaptive quick access
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: materials } = await supabase
        .from('materials')
        .select('id, title, type, passage, language, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (materials) {
        setStats({
          sermons: materials.filter(m => m.type === 'sermon' || m.type === 'pastoral').length,
          studies: materials.filter(m => m.type === 'biblical_study' || m.type === 'study').length,
          articles: materials.filter(m => m.type === 'article' || m.type === 'blog' || m.type === 'blog_article').length,
          devotionals: materials.filter(m => m.type === 'devotional').length,
          total: materials.length,
        });
        setRecentMaterials(materials.slice(0, 5));

        // Build adaptive quick access from recent usage
        const recentMats = materials.filter(m => new Date(m.created_at) >= thirtyDaysAgo);
        if (recentMats.length >= 3) {
          // Count frequency by canonical tool key
          const freq: Record<string, number> = {};
          for (const m of recentMats) {
            const tool = typeToQuickTool[m.type];
            if (tool) {
              const key = tool.label.PT; // use PT label as unique key
              freq[key] = (freq[key] || 0) + 1;
            }
          }
          // Sort by frequency, take top 4, deduplicate
          const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
          const topTools: typeof defaultQuickTools = [];
          const seen = new Set<string>();
          for (const [key] of sorted) {
            if (seen.has(key) || topTools.length >= 4) break;
            seen.add(key);
            const match = Object.values(typeToQuickTool).find(t => t.label.PT === key);
            if (match) topTools.push(match);
          }
          // Fill remaining slots with defaults
          for (const dt of defaultQuickTools) {
            if (topTools.length >= 4) break;
            if (!seen.has(dt.label.PT)) {
              seen.add(dt.label.PT);
              topTools.push(dt);
            }
          }
          if (topTools.length >= 4) {
            setAdaptiveQuickTools(topTools.slice(0, 4));
          }
        }
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!requestedToolId) return;
    const requestedTool = allTools.find((tool) => tool.id === requestedToolId);
    if (!requestedTool) return;
    if (requestedTool.locked && isFree) {
      setSearchParams({}, { replace: true });
      return;
    }
    setActiveSheet((current) =>
      current?.id === requestedTool.id ? current : { id: requestedTool.id, title: requestedTool.title[lang] }
    );
  }, [requestedToolId, isFree, lang, setSearchParams]);

  const handleToolClick = (tool: ToolCardData) => {
    if (tool.locked && isFree) return;
    if (tool.hasModal) {
      setActiveSheet({ id: tool.id, title: tool.title[lang] });
    }
  };

  const handleExtrasToolClick = (toolId: string, title: string) => {
    setActiveSheet({ id: toolId, title });
  };

  const sectionLabel = (emoji: string, pt: string, en: string, es: string) => {
    const labels = { PT: pt, EN: en, ES: es };
    return `${emoji} ${labels[lang]}`;
  };

  const statCards = [
    { n: stats.sermons, label: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' }, color: '#C4956A', icon: Mic },
    { n: stats.studies, label: { PT: 'Estudos', EN: 'Studies', ES: 'Estudios' }, color: '#7B9E6B', icon: BookOpen },
    { n: stats.articles, label: { PT: 'Artigos', EN: 'Articles', ES: 'Artículos' }, color: '#6B8BBE', icon: FileText },
    { n: stats.devotionals, label: { PT: 'Devocionais', EN: 'Devotionals', ES: 'Devocionales' }, color: '#9B7EC8', icon: Sparkles },
    { n: stats.total, label: { PT: 'Total Criados', EN: 'Total Created', ES: 'Total Creados' }, color: '#D4A853', icon: Wand2 },
    { n: profile?.generations_used || 0, label: { PT: 'Uso do Mês', EN: 'Monthly Usage', ES: 'Uso del Mes' }, color: '#E07A5F', icon: Sparkles },
  ];

  const quickTools = adaptiveQuickTools || defaultQuickTools;

  const typeIcons: Record<string, string> = {
    sermon: '🎤', pastoral: '🎤', study: '📖', biblical_study: '📖',
    article: '✍️', blog: '✍️', blog_article: '✍️', devotional: '✨', default: '📄',
  };
  const typeLabels: Record<string, Record<string, string>> = {
    sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
    pastoral: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
    study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
    biblical_study: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
    article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
    blog: { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
    blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
    devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Welcome */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {lang === 'PT' ? 'Olá' : lang === 'EN' ? 'Hello' : 'Hola'}, {userName}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-xl">
          {lang === 'PT'
            ? 'Seu centro de trabalho para estudar, preparar e criar conteúdos com profundidade e agilidade.'
            : lang === 'EN'
            ? 'Your workspace to study, prepare and create content with depth and agility.'
            : 'Tu centro de trabajo para estudiar, preparar y crear contenidos con profundidad y agilidad.'}
        </p>
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl p-3 text-center transition-transform hover:scale-[1.03] bg-card border border-border shadow-sm">
              <div className="flex justify-center mb-1">
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-display" style={{ color: s.color }}>{s.n}</p>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5">{s.label[lang]}</p>
            </div>
          );
        })}
      </div>

      {/* 3. Quick Access */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
          {lang === 'PT' ? '⚡ ACESSO RÁPIDO' : lang === 'EN' ? '⚡ QUICK ACCESS' : '⚡ ACCESO RÁPIDO'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickTools.map((qt, i) => (
            <button key={i} onClick={qt.action}
              className="rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-card border border-border shadow-sm">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0 bg-primary/10">{qt.icon}</div>
              <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{qt.label[lang]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Research Tools */}
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap font-body">
              {sectionLabel('🔎', 'FERRAMENTAS DE PESQUISA', 'RESEARCH TOOLS', 'HERRAMIENTAS DE INVESTIGACIÓN')}
            </h2>
            <div className="flex-1 h-px bg-border/50" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {researchTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
          ))}
        </div>
      </section>

      {/* 5. Writing & Creation */}
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap font-body">
              {sectionLabel('🖋️', 'ESCRITA E CRIAÇÃO', 'WRITING & CREATION', 'ESCRITURA Y CREACIÓN')}
            </h2>
            <div className="flex-1 h-px bg-border/50" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {createTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
          ))}
        </div>
      </section>

      {/* 6. Extras Card */}
      <section>
        <Card
          className="cursor-pointer border-border/60 bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 hover:border-accent/50"
          onClick={() => setExtrasOpen(true)}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {lang === 'PT' ? 'Recursos Extras' : lang === 'EN' ? 'Extra Resources' : 'Recursos Extra'}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lang === 'PT' ? 'Ferramentas de alcance, comunidade e conteúdos especiais' : lang === 'EN' ? 'Outreach, community and special content tools' : 'Herramientas de alcance, comunidad y contenidos especiales'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </section>

      {/* 7. Recent Generations — at the bottom */}
      {recentMaterials.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              {lang === 'PT' ? '📝 GERAÇÃO RECENTE' : lang === 'EN' ? '📝 RECENT GENERATION' : '📝 GENERACIÓN RECIENTE'}
            </p>
            <Link to="/biblioteca" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline">
              {lang === 'PT' ? 'Ver tudo' : lang === 'EN' ? 'View all' : 'Ver todo'}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentMaterials.map((m) => (
              <div key={m.id} className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-all hover:shadow-md bg-card border border-border">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 bg-primary/5">
                  {typeIcons[m.type] || typeIcons.default}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {typeLabels[m.type]?.[lang] || m.type}
                    {m.passage && ` · ${m.passage}`}
                    {m.language && ` · ${m.language}`}
                  </p>
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                  {typeLabels[m.type]?.[lang] || m.type}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <ExtrasModal
        open={extrasOpen}
        onOpenChange={setExtrasOpen}
        lang={lang}
        isFree={isFree}
        onToolClick={handleExtrasToolClick}
      />

      {activeSheet && (
        <ToolSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setActiveSheet(null);
              if (requestedToolId) {
                setSearchParams({}, { replace: true });
              }
            }
          }}
          toolId={activeSheet.id}
          toolTitle={activeSheet.title}
        />
      )}
    </div>
  );
}
