import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Wand2, PenLine, Type, Video, BookOpen, Languages, X,
  Search, Globe, Quote, Clapperboard, ScrollText, Lightbulb, Sparkles,
  Crown, Film, Megaphone, MessageSquare, Mail, Newspaper,
  Gamepad2, Feather, Baby, ArrowRightLeft, ExternalLink, Copy, GraduationCap,
  FileText, Brain, Mic, ChevronRight
} from 'lucide-react';
import { ToolCard, type ToolCardData } from '@/components/ToolCard';
import { ToolSheet } from '@/components/ToolSheet';
import { toast } from 'sonner';
import { TrialCountdown } from '@/components/TrialCountdown';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { ProductionCapacityBar } from '@/components/ProductionCapacityBar';

const researchTools: ToolCardData[] = [
  { id: 'topic-explorer', icon: Search, title: { PT: 'Explorador de Tópicos', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: 'Descubra subtemas e ângulos para sua pregação', EN: 'Discover subtopics and angles for your sermon', ES: 'Descubre subtemas y ángulos para tu sermón' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, description: { PT: 'Busque versículos relevantes por tema', EN: 'Search relevant verses by topic', ES: 'Busca versículos relevantes por tema' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: 'Contexto cultural e histórico da passagem', EN: 'Cultural and historical context', ES: 'Contexto cultural e histórico' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: 'Citações de teólogos e pensadores cristãos', EN: 'Quotes from theologians and thinkers', ES: 'Citas de teólogos y pensadores' }, hasModal: true },
  { id: 'movie-scenes', icon: Clapperboard, title: { PT: 'Cenas de Filmes', EN: 'Movie Scenes', ES: 'Escenas de Películas' }, description: { PT: 'Cenas de filmes para seu sermão', EN: 'Movie scenes for your sermon', ES: 'Escenas de películas para tu sermón' }, hasModal: true },
  { id: 'biblical-study', icon: GraduationCap, title: { PT: 'Estudo Bíblico Completo', EN: 'Complete Bible Study', ES: 'Estudio Bíblico Completo' }, description: { PT: 'Estudo teológico profundo com 8 seções detalhadas', EN: 'Deep theological study with 8 detailed sections', ES: 'Estudio teológico profundo con 8 secciones detalladas' }, path: '/estudos/novo' },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: 'Explore Grego e Hebraico simplificado', EN: 'Explore simplified Greek and Hebrew', ES: 'Explora Griego y Hebreo simplificado' }, locked: true, hasModal: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: 'Análise de palavras originais e raízes', EN: 'Original word analysis and roots', ES: 'Análisis de palabras originales' }, locked: true, hasModal: true },
];

const createTools: ToolCardData[] = [
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: 'Gere sermões, esboços e devocionais', EN: 'Generate sermons, outlines and devotionals', ES: 'Genera sermones, bosquejos y devocionales' }, hasModal: true },
  { id: 'title-gen', icon: Type, title: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' }, description: { PT: 'Ideias criativas de títulos para sermões', EN: 'Creative title ideas for sermons', ES: 'Ideas creativas de títulos' }, hasModal: true },
  { id: 'metaphor-creator', icon: Lightbulb, title: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, description: { PT: 'Metáforas poderosas para sua mensagem', EN: 'Powerful metaphors for your message', ES: 'Metáforas poderosas para tu mensaje' }, hasModal: true },
  { id: 'illustrations', icon: Film, title: { PT: 'Ilustrações para Sermões', EN: 'Sermon Illustrations', ES: 'Ilustraciones' }, description: { PT: 'Histórias e ilustrações contemporâneas', EN: 'Contemporary stories and illustrations', ES: 'Historias e ilustraciones contemporáneas' }, locked: true, hasModal: true },
  { id: 'bible-modernizer', icon: Sparkles, title: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' }, description: { PT: 'Recontextualize histórias bíblicas', EN: 'Recontextualize Bible stories', ES: 'Recontextualiza historias bíblicas' }, hasModal: true },
  { id: 'free-article', icon: PenLine, title: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' }, description: { PT: 'Crie artigos de blog de qualquer tema', EN: 'Create blog articles on any topic', ES: 'Crea artículos de blog' }, hasModal: true },
];

const outreachTools: ToolCardData[] = [
  { id: 'reels-script', icon: Video, title: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' }, description: { PT: 'Scripts para Reels e TikTok', EN: 'Scripts for Reels and TikTok', ES: 'Guiones para Reels y TikTok' }, hasModal: true },
  { id: 'cell-group', icon: MessageSquare, title: { PT: 'Estudo de Célula', EN: 'Cell Group Study', ES: 'Estudio de Célula' }, description: { PT: 'Roteiro completo para célula', EN: 'Complete cell group study plan', ES: 'Plan completo para célula' }, hasModal: true },
  { id: 'social-caption', icon: Megaphone, title: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' }, description: { PT: 'Legendas para Instagram e Facebook', EN: 'Captions for Instagram and Facebook', ES: 'Subtítulos para Instagram y Facebook' }, hasModal: true },
  { id: 'newsletter', icon: Mail, title: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' }, description: { PT: 'Newsletter pastoral da semana', EN: 'Weekly pastoral newsletter', ES: 'Newsletter pastoral semanal' }, hasModal: true },
  { id: 'announcements', icon: Newspaper, title: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' }, description: { PT: 'Avisos claros e engajantes', EN: 'Clear and engaging announcements', ES: 'Avisos claros y atractivos' }, hasModal: true },
];

const funTools: ToolCardData[] = [
  { id: 'trivia', icon: Gamepad2, title: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' }, description: { PT: 'Perguntas divertidas sobre a Bíblia', EN: 'Fun Bible trivia questions', ES: 'Preguntas divertidas sobre la Biblia' }, hasModal: true },
  { id: 'poetry', icon: Feather, title: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' }, description: { PT: 'Poemas inspirados na Palavra', EN: 'Poetry inspired by the Word', ES: 'Poemas inspirados en la Palabra' }, hasModal: true },
  { id: 'kids-story', icon: Baby, title: { PT: 'Histórias Infantis', EN: 'Kids Stories', ES: 'Historias Infantiles' }, description: { PT: 'Histórias bíblicas para crianças', EN: 'Bible stories for children', ES: 'Historias bíblicas para niños' }, hasModal: true },
  { id: 'deep-translation', icon: ArrowRightLeft, title: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' }, description: { PT: 'Tradução profunda com nuance teológica', EN: 'Deep translation with theological nuance', ES: 'Traducción profunda con matiz teológico' }, locked: true, hasModal: true },
];

const allTools: ToolCardData[] = [...researchTools, ...createTools, ...outreachTools, ...funTools];

const sectionDescriptions = {
  research: {
    PT: 'Aprofunde-se no texto bíblico antes de preparar sua mensagem. Encontre contexto, versículos e citações relevantes.',
    EN: 'Dive deeper into the biblical text before preparing your message. Find context, verses and relevant quotes.',
    ES: 'Profundice en el texto bíblico antes de preparar su mensaje. Encuentre contexto, versículos y citas relevantes.',
  },
  create: {
    PT: 'Transforme seu estudo em conteúdo pronto para usar: sermões, devocionais, títulos criativos e artigos.',
    EN: 'Turn your study into ready-to-use content: sermons, devotionals, creative titles and articles.',
    ES: 'Transforma tu estudio en contenido listo para usar: sermones, devocionales, títulos creativos y artículos.',
  },
  outreach: {
    PT: 'Leve sua mensagem além do púlpito com conteúdo para redes sociais, células e newsletters.',
    EN: 'Take your message beyond the pulpit with content for social media, cell groups and newsletters.',
    ES: 'Lleva tu mensaje más allá del púlpito con contenido para redes sociales, células y newsletters.',
  },
  fun: {
    PT: 'Engaje sua comunidade com quizzes, poesias e histórias para todas as idades.',
    EN: 'Engage your community with quizzes, poetry and stories for all ages.',
    ES: 'Involucra a tu comunidad con quizzes, poesía e historias para todas las edades.',
  },
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFree = profile?.plan === 'free';
  const [showBanner, setShowBanner] = useState(true);
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string } | null>(null);
  const requestedToolId = searchParams.get('tool');

  // Stats
  const [stats, setStats] = useState({ sermons: 0, studies: 0, articles: 0, devotionals: 0, blogs: 0, total: 0 });
  const [recentMaterials, setRecentMaterials] = useState<Array<{ id: string; title: string; type: string; passage: string | null; language: string | null; created_at: string }>>([]);

  const userName = profile?.full_name?.split(' ')[0] || (lang === 'PT' ? 'Amigo' : lang === 'EN' ? 'Friend' : 'Amigo');

  // Fetch stats + recent materials
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
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
          articles: materials.filter(m => m.type === 'article' || m.type === 'blog').length,
          devotionals: materials.filter(m => m.type === 'devotional').length,
          blogs: materials.filter(m => m.type === 'blog').length,
          total: materials.length,
        });
        setRecentMaterials(materials.slice(0, 5));
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
      current?.id === requestedTool.id
        ? current
        : { id: requestedTool.id, title: requestedTool.title[lang] }
    );
  }, [requestedToolId, isFree, lang, setSearchParams]);

  const handleToolClick = (tool: ToolCardData) => {
    if (tool.locked && isFree) return;
    if (tool.hasModal) {
      setActiveSheet({ id: tool.id, title: tool.title[lang] });
    }
  };

  const sectionLabel = (emoji: string, pt: string, en: string, es: string) => {
    const labels = { PT: pt, EN: en, ES: es };
    return `${emoji} ${labels[lang]}`;
  };

  const renderSection = (
    emoji: string,
    ptLabel: string,
    enLabel: string,
    esLabel: string,
    description: { PT: string; EN: string; ES: string },
    tools: ToolCardData[]
  ) => (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap font-body">
            {sectionLabel(emoji, ptLabel, enLabel, esLabel)}
          </h2>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-2xl">
          {description[lang]}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
        ))}
      </div>
    </section>
  );

  const statCards = [
    { n: stats.sermons, label: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' }, color: '#C4956A', icon: Mic },
    { n: stats.studies, label: { PT: 'Estudos', EN: 'Studies', ES: 'Estudios' }, color: '#7B9E6B', icon: BookOpen },
    { n: stats.articles, label: { PT: 'Artigos', EN: 'Articles', ES: 'Artículos' }, color: '#6B8BBE', icon: FileText },
    { n: stats.devotionals, label: { PT: 'Devocionais', EN: 'Devotionals', ES: 'Devocionales' }, color: '#9B7EC8', icon: Sparkles },
    { n: stats.total, label: { PT: 'Total Criados', EN: 'Total Created', ES: 'Total Creados' }, color: '#D4A853', icon: Wand2 },
    { n: profile?.generations_used || 0, label: { PT: 'Gerações Usadas', EN: 'Generations Used', ES: 'Generaciones Usadas' }, color: '#E07A5F', icon: Sparkles },
  ];

  const quickTools = [
    { icon: '📖', label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, action: () => handleToolClick(createTools[0]) },
    { icon: '📚', label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, action: () => navigate('/estudos/novo') },
    { icon: '✍️', label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: () => navigate('/blog') },
    { icon: '🧠', label: { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' }, action: () => navigate('/dashboard/mentes') },
  ];

  const typeIcons: Record<string, string> = {
    sermon: '🎤', pastoral: '🎤', study: '📖', biblical_study: '📖',
    article: '✍️', blog: '✍️', devotional: '✨', default: '📄',
  };
  const typeLabels: Record<string, Record<string, string>> = {
    sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
    pastoral: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
    study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
    biblical_study: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
    article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
    blog: { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
    devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ─── Welcome + Overview (Mockup Style) ─── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('dashboard.greeting')}, {userName}! 👋
          </h1>
          {profile && (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #C4956A, #D4A853)', color: '#fff' }}>
              {(profile.full_name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-xl">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl p-3 text-center transition-transform hover:scale-[1.03]"
              style={{ background: 'var(--card)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
              <div className="flex justify-center mb-1">
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-display" style={{ color: s.color }}>{s.n}</p>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5">{s.label[lang]}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Tools */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
          {lang === 'PT' ? '⚡ ACESSO RÁPIDO' : lang === 'EN' ? '⚡ QUICK ACCESS' : '⚡ ACCESO RÁPIDO'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickTools.map((t, i) => (
            <button key={i} onClick={t.action}
              className="rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--card)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ background: 'rgba(196,149,106,0.1)' }}>{t.icon}</div>
              <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{t.label[lang]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Generations */}
      {recentMaterials.length > 0 && (
        <div>
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
              <div key={m.id} className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-all hover:shadow-md"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: 'rgba(196,149,106,0.1)' }}>
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
                <div className="flex gap-1.5 shrink-0">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(196,149,106,0.12)', color: '#C4956A' }}>
                    {typeLabels[m.type]?.[lang] || m.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TrialCountdown />
      <PWAInstallBanner />
      <ProductionCapacityBar />

      {showBanner && isFree && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">{t('dashboard.unlock_tools')}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('dashboard.trial_hint')}</p>
              </div>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {profile?.blog_handle && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('dashboard.blog_portal')}
                  </p>
                  <p className="text-sm font-mono font-semibold text-primary mt-0.5">
                    {profile.blog_handle}.livingword.app
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8 min-h-[44px]"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/blog/${profile.blog_handle}`);
                    toast.success(t('dashboard.link_copied'));
                  }}
                >
                  <Copy className="w-3 h-3" />
                  {t('dashboard.copy')}
                </Button>
                <Link to={`/blog/${profile.blog_handle}`} target="_blank">
                  <Button size="sm" className="gap-1.5 text-xs h-8 min-h-[44px]">
                    <ExternalLink className="w-3 h-3" />
                    {t('dashboard.visit_portal')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {renderSection('🔎', 'FERRAMENTAS DE PESQUISA', 'RESEARCH TOOLS', 'HERRAMIENTAS DE INVESTIGACIÓN', sectionDescriptions.research, researchTools)}
      {renderSection('🖋️', 'ESCRITA E CRIAÇÃO', 'WRITING & CREATION', 'ESCRITURA Y CREACIÓN', sectionDescriptions.create, createTools)}
      {renderSection('📢', 'FERRAMENTAS DE ALCANCE', 'OUTREACH TOOLS', 'HERRAMIENTAS DE ALCANCE', sectionDescriptions.outreach, outreachTools)}
      {renderSection('🎮', 'DIVERTIDAS E DINÂMICAS', 'FUN & DYNAMIC', 'DIVERTIDAS Y DINÁMICAS', sectionDescriptions.fun, funTools)}

      {isFree && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
            <Crown className="h-3 w-3 text-accent" />
          </div>
          <span>{t('dashboard.pastoral_hint')}</span>
        </div>
      )}

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
