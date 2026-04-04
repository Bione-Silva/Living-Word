import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Wand2, PenLine, Type, Video, BookOpen, Languages, X,
  Search, Globe, Quote, Clapperboard, ScrollText, Lightbulb, Sparkles,
  Crown, Film, Megaphone, MessageSquare, Mail, Newspaper,
  Gamepad2, Feather, Baby, ArrowRightLeft, ExternalLink, Copy, GraduationCap
} from 'lucide-react';
import { ToolCard, type ToolCardData } from '@/components/ToolCard';
import { ToolSheet } from '@/components/ToolSheet';
import { toast } from 'sonner';

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
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: 'Gere sermões, esboços e devocionais', EN: 'Generate sermons, outlines and devotionals', ES: 'Genera sermones, bosquejos y devocionales' } },
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
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFree = profile?.plan === 'free';
  const [showBanner, setShowBanner] = useState(true);
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string } | null>(null);
  const requestedToolId = searchParams.get('tool');

  const userName = profile?.full_name?.split(' ')[0] || (lang === 'PT' ? 'Amigo' : lang === 'EN' ? 'Friend' : 'Amigo');

  const copyLinkToast = lang === 'PT' ? 'Link copiado!' : lang === 'EN' ? 'Link copied!' : '¡Enlace copiado!';
  const copyLabel = lang === 'PT' ? 'Copiar' : lang === 'EN' ? 'Copy' : 'Copiar';
  const portalLabel = lang === 'PT' ? 'Acessar Portal' : lang === 'EN' ? 'Visit Portal' : 'Acceder al Portal';

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

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {lang === 'PT'
            ? `Olá, ${userName}! 👋`
            : lang === 'EN'
              ? `Hello, ${userName}! 👋`
              : `¡Hola, ${userName}! 👋`}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed max-w-xl">
          {lang === 'PT'
            ? 'Aqui estão todas as ferramentas para ajudar você a preparar, criar e compartilhar conteúdo. Escolha uma categoria e comece.'
            : lang === 'EN'
              ? 'Here are all the tools to help you prepare, create and share content. Pick a category and get started.'
              : 'Aquí tienes todas las herramientas para ayudarte a preparar, crear y compartir contenido. Elige una categoría y comienza.'}
        </p>
      </div>

      {showBanner && isFree && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-xs">
                  {lang === 'PT' ? 'Desbloqueie todas as ferramentas' : lang === 'EN' ? 'Unlock all tools' : 'Desbloquea todas las herramientas'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === 'PT' ? 'Teste grátis por 7 dias, sem cartão de crédito.' : lang === 'EN' ? 'Free 7-day trial, no credit card needed.' : 'Prueba gratis 7 días, sin tarjeta.'}
                </p>
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
                    {lang === 'PT' ? 'Seu Portal do Blog' : lang === 'EN' ? 'Your Blog Portal' : 'Tu Portal del Blog'}
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
                  className="gap-1.5 text-xs h-8"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/blog/${profile.blog_handle}`);
                    toast.success(copyLinkToast);
                  }}
                >
                  <Copy className="w-3 h-3" />
                  {copyLabel}
                </Button>
                <Link to={`/blog/${profile.blog_handle}`} target="_blank">
                  <Button size="sm" className="gap-1.5 text-xs h-8">
                    <ExternalLink className="w-3 h-3" />
                    {portalLabel}
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
          <span>
            {lang === 'PT'
              ? 'Itens com este ícone estão disponíveis no plano Pastoral'
              : lang === 'EN'
                ? 'Items with this icon are available on the Pastoral plan'
                : 'Los ítems con este ícono están disponibles en el plan Pastoral'}
          </span>
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
