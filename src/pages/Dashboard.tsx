import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Wand2, PenLine, Type, Video, BookOpen, Languages, X,
  Search, Globe, Quote, Clapperboard, ScrollText, Lightbulb, Sparkles,
  Crown, Film, Megaphone, MessageSquare, Mail, Newspaper,
  Gamepad2, Feather, Baby, ArrowRightLeft
} from 'lucide-react';
import { useState } from 'react';
import { ToolCard, type ToolCardData } from '@/components/ToolCard';
import { ToolSheet } from '@/components/ToolSheet';

const researchTools: ToolCardData[] = [
  { id: 'topic-explorer', icon: Search, title: { PT: 'Explorador de Tópicos', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: 'Descubra subtemas e ângulos para sua pregação', EN: 'Discover subtopics and angles for your sermon', ES: 'Descubre subtemas y ángulos para tu sermón' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, description: { PT: 'Busque versículos relevantes por tema', EN: 'Search relevant verses by topic', ES: 'Busca versículos relevantes por tema' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: 'Contexto cultural e histórico da passagem', EN: 'Cultural and historical context', ES: 'Contexto cultural e histórico' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: 'Citações de teólogos e pensadores cristãos', EN: 'Quotes from theologians and thinkers', ES: 'Citas de teólogos y pensadores' }, hasModal: true },
  { id: 'movie-scenes', icon: Clapperboard, title: { PT: 'Cenas de Filmes', EN: 'Movie Scenes', ES: 'Escenas de Películas' }, description: { PT: 'Cenas de filmes para seu sermão', EN: 'Movie scenes for your sermon', ES: 'Escenas de películas para tu sermón' }, hasModal: true },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: 'Explore Grego e Hebraico simplificado', EN: 'Explore simplified Greek and Hebrew', ES: 'Explora Griego y Hebreo simplificado' }, locked: true, hasModal: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: 'Análise de palavras originais e raízes', EN: 'Original word analysis and roots', ES: 'Análisis de palabras originales' }, locked: true, hasModal: true },
];

const createTools: ToolCardData[] = [
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: 'Gere sermões, esboços e devocionais', EN: 'Generate sermons, outlines and devotionals', ES: 'Genera sermones, bosquejos y devocionales' }, path: '/estudio' },
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

export default function Dashboard() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isFree = profile?.plan === 'free';
  const [showBanner, setShowBanner] = useState(true);
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string } | null>(null);

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

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          {lang === 'PT'
            ? `Shalom, ${profile?.full_name?.split(' ')[0] || 'Pastor'}! 🕊️`
            : lang === 'EN'
            ? `Shalom, ${profile?.full_name?.split(' ')[0] || 'Pastor'}! 🕊️`
            : `Shalom, ${profile?.full_name?.split(' ')[0] || 'Pastor'}! 🕊️`}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'PT'
            ? 'Todas as suas ferramentas pastorais em um só lugar. Escolha e comece a criar.'
            : lang === 'EN'
            ? 'All your pastoral tools in one place. Pick one and start creating.'
            : 'Todas tus herramientas pastorales en un solo lugar. Elige y empieza a crear.'}
        </p>
      </div>

      {/* Upgrade Banner */}
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

      {/* Blog Status */}
      {profile?.blog_handle && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3.5">
            <p className="text-sm">
              🎉 {lang === 'PT' ? 'Seu blog está no ar:' : lang === 'EN' ? 'Your blog is live:' : 'Tu blog está en línea:'}{' '}
              <a href={`/blog/${profile.blog_handle}`} className="text-primary font-semibold underline underline-offset-2">
                {profile.blog_handle}.livingword.app
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid 1: Research */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap font-body">
            {sectionLabel('🔎', 'FERRAMENTAS DE PESQUISA', 'RESEARCH TOOLS', 'HERRAMIENTAS DE INVESTIGACIÓN')}
          </h2>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {researchTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
          ))}
        </div>
      </section>

      {/* Grid 2: Writing & Creation */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap font-body">
            {sectionLabel('🖋️', 'ESCRITA E CRIAÇÃO', 'WRITING & CREATION', 'ESCRITURA Y CREACIÓN')}
          </h2>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {createTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
          ))}
        </div>
      </section>

      {/* Grid 3: Outreach */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">
            {sectionLabel('📢', 'FERRAMENTAS DE ALCANCE', 'OUTREACH TOOLS', 'HERRAMIENTAS DE ALCANCE')}
          </h2>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {outreachTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
          ))}
        </div>
      </section>

      {/* Grid 4: Fun & Dynamic */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">
            {sectionLabel('🎮', 'DIVERTIDAS E DINÂMICAS', 'FUN & DYNAMIC', 'DIVERTIDAS Y DINÁMICAS')}
          </h2>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {funTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} lang={lang} isFree={isFree} onClick={handleToolClick} index={i} />
          ))}
        </div>
      </section>

      {/* Legend */}
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

      {/* Tool Sheet */}
      {activeSheet && (
        <ToolSheet
          open={true}
          onOpenChange={(open) => !open && setActiveSheet(null)}
          toolId={activeSheet.id}
          toolTitle={activeSheet.title}
        />
      )}
    </div>
  );
}
