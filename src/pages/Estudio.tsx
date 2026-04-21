import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isFreePlan } from '@/lib/plan-normalization';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToolCard, type ToolCardData } from '@/components/ToolCard';
import { ToolSheet } from '@/components/ToolSheet';
import { HelpArticleModal } from '@/components/HelpArticleModal';
import {
  Search, BookOpen, Quote, Film, FileText, Languages as LanguagesIcon,
  Lightbulb, PenTool, Sparkles, Repeat, Palette, Wand2,
  Video, Users, MessageSquare, Mail, Megaphone,
  HelpCircle, Feather, Baby, Globe,
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface ToolSection {
  label: Record<L, string>;
  subtitle: Record<L, string>;
  tools: ToolCardData[];
}

const sections: ToolSection[] = [
  {
    label: { PT: '🔍 Pesquisa & Estudo', EN: '🔍 Research & Study', ES: '🔍 Investigación & Estudio' },
    subtitle: {
      PT: 'Aprofunde-se antes de escrever. Contexto, versículos, citações e mais.',
      EN: 'Go deeper before you write. Context, verses, quotes and more.',
      ES: 'Profundiza antes de escribir. Contexto, versículos, citas y más.',
    },
    tools: [
      { id: 'topic-explorer', icon: Lightbulb, title: { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: 'Descubra subtópicos e ângulos para seu sermão', EN: 'Discover subtopics and angles for your sermon', ES: 'Descubre subtemas y ángulos para tu sermón' } },
      { id: 'verse-finder', icon: Search, title: { PT: 'Localizador de Versículos', EN: 'Verse Finder', ES: 'Localizador de Versículos' }, description: { PT: 'Encontre versículos relevantes por tema', EN: 'Find relevant verses by topic', ES: 'Encuentra versículos relevantes por tema' } },
      { id: 'historical-context', icon: BookOpen, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: 'Contexto cultural e histórico da passagem', EN: 'Cultural and historical context of the passage', ES: 'Contexto cultural e histórico del pasaje' } },
      { id: 'quote-finder', icon: Quote, title: { PT: 'Citações Teológicas', EN: 'Theological Quotes', ES: 'Citas Teológicas' }, description: { PT: 'Citações de teólogos e autores cristãos', EN: 'Quotes from theologians and Christian authors', ES: 'Citas de teólogos y autores cristianos' } },
      { id: 'movie-scenes', icon: Film, title: { PT: 'Cenas de Filmes', EN: 'Movie Scenes', ES: 'Escenas de Películas' }, description: { PT: 'Ilustrações de filmes para o sermão', EN: 'Movie illustrations for the sermon', ES: 'Ilustraciones de películas para el sermón' } },
      { id: 'original-text', icon: FileText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: 'Grego e Hebraico com análise palavra a palavra', EN: 'Greek and Hebrew with word-by-word analysis', ES: 'Griego y Hebreo con análisis palabra por palabra' }, locked: true },
      { id: 'lexical', icon: LanguagesIcon, title: { PT: 'Análise Lexical', EN: 'Lexical Analysis', ES: 'Análisis Léxico' }, description: { PT: 'Estudo profundo de termos originais', EN: 'Deep study of original terms', ES: 'Estudio profundo de términos originales' }, locked: true },
    ],
  },
  {
    label: { PT: '✍️ Escrita & Criação', EN: '✍️ Writing & Creation', ES: '✍️ Escritura & Creación' },
    subtitle: {
      PT: 'Gere títulos, metáforas, artigos e mais — com sua voz pastoral.',
      EN: 'Generate titles, metaphors, articles and more — with your pastoral voice.',
      ES: 'Genera títulos, metáforas, artículos y más — con tu voz pastoral.',
    },
    tools: [
      { id: 'title-gen', icon: Sparkles, title: { PT: 'Gerador de Títulos', EN: 'Title Generator', ES: 'Generador de Títulos' }, description: { PT: '10 títulos criativos para seu sermão', EN: '10 creative titles for your sermon', ES: '10 títulos creativos para tu sermón' } },
      { id: 'metaphor-creator', icon: Palette, title: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, description: { PT: 'Analogias modernas para conceitos bíblicos', EN: 'Modern analogies for biblical concepts', ES: 'Analogías modernas para conceptos bíblicos' } },
      { id: 'bible-modernizer', icon: Repeat, title: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' }, description: { PT: 'Recontar histórias bíblicas no contexto atual', EN: 'Retell Bible stories in a modern context', ES: 'Recontar historias bíblicas en contexto actual' } },
      { id: 'illustrations', icon: PenTool, title: { PT: 'Ilustrações para Sermão', EN: 'Sermon Illustrations', ES: 'Ilustraciones para Sermón' }, description: { PT: 'Histórias reais para enriquecer a pregação', EN: 'Real stories to enrich your preaching', ES: 'Historias reales para enriquecer la predicación' } },
      { id: 'free-article', icon: Wand2, title: { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' }, description: { PT: 'Artigo devocional completo pronto para publicar', EN: 'Complete devotional article ready to publish', ES: 'Artículo devocional completo listo para publicar' } },
      { id: 'youtube-blog', icon: Video, title: { PT: 'Link do YouTube', EN: 'YouTube Link', ES: 'Enlace de YouTube' }, description: { PT: 'Transforme vídeos em artigos cristãos', EN: 'Turn videos into Christian articles', ES: 'Transforma videos en artículos cristianos' }, locked: true },
    ],
  },
  {
    label: { PT: '📣 Alcance & Distribuição', EN: '📣 Outreach & Distribution', ES: '📣 Alcance & Distribución' },
    subtitle: {
      PT: 'Leve sua mensagem além do púlpito — redes, célula, newsletter.',
      EN: 'Take your message beyond the pulpit — social, cell group, newsletter.',
      ES: 'Lleva tu mensaje más allá del púlpito — redes, célula, newsletter.',
    },
    tools: [
      { id: 'reels-script', icon: Video, title: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guión para Reels' }, description: { PT: 'Script de 30-60s com gancho, conteúdo e CTA', EN: '30-60s script with hook, content and CTA', ES: 'Script de 30-60s con gancho, contenido y CTA' } },
      { id: 'cell-group', icon: Users, title: { PT: 'Material de Célula', EN: 'Cell Group Material', ES: 'Material de Célula' }, description: { PT: 'Estudo completo com perguntas e dinâmica', EN: 'Complete study with questions and dynamics', ES: 'Estudio completo con preguntas y dinámica' } },
      { id: 'social-caption', icon: MessageSquare, title: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Leyendas para Redes' }, description: { PT: '5 opções de legenda com emojis e hashtags', EN: '5 caption options with emojis and hashtags', ES: '5 opciones de leyenda con emojis y hashtags' } },
      { id: 'newsletter', icon: Mail, title: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' }, description: { PT: 'Newsletter completa com devocional e avisos', EN: 'Complete newsletter with devotional and announcements', ES: 'Newsletter completa con devocional y avisos' } },
      { id: 'announcements', icon: Megaphone, title: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' }, description: { PT: 'Avisos claros e acolhedores para o boletim', EN: 'Clear, warm announcements for the bulletin', ES: 'Avisos claros y acogedores para el boletín' } },
    ],
  },
  {
    label: { PT: '🎲 Divertidas & Dinâmicas', EN: '🎲 Fun & Dynamic', ES: '🎲 Divertidas & Dinámicas' },
    subtitle: {
      PT: 'Quiz bíblico, poesia, história para crianças e tradução profunda.',
      EN: 'Bible trivia, poetry, kids stories and deep translation.',
      ES: 'Trivia bíblica, poesía, historias infantiles y traducción profunda.',
    },
    tools: [
      { id: 'trivia', icon: HelpCircle, title: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' }, description: { PT: '10 perguntas divertidas com alternativas', EN: '10 fun questions with multiple choice', ES: '10 preguntas divertidas con alternativas' } },
      { id: 'poetry', icon: Feather, title: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' }, description: { PT: 'Poema inspirado em passagem ou tema', EN: 'Poem inspired by passage or topic', ES: 'Poema inspirado en pasaje o tema' } },
      { id: 'kids-story', icon: Baby, title: { PT: 'História Infantil', EN: 'Kids Story', ES: 'Historia Infantil' }, description: { PT: 'Reconto bíblico para crianças de 5-10 anos', EN: 'Bible retelling for children 5-10 years', ES: 'Recuento bíblico para niños de 5-10 años' } },
      { id: 'deep-translation', icon: Globe, title: { PT: 'Tradução Profunda', EN: 'Deep Translation', ES: 'Traducción Profunda' }, description: { PT: 'Tradução teológica com nuance e contexto', EN: 'Theological translation with nuance and context', ES: 'Traducción teológica con matiz y contexto' }, locked: true },
    ],
  },
];

const greeting: Record<L, { h1: string; sub: string }> = {
  PT: {
    h1: 'Seu estúdio pastoral está pronto.',
    sub: 'Escolha uma ferramenta abaixo e comece a criar. Cada clique abre um painel focado — sem complicação.',
  },
  EN: {
    h1: 'Your pastoral studio is ready.',
    sub: 'Choose a tool below and start creating. Each click opens a focused panel — no complications.',
  },
  ES: {
    h1: 'Tu estudio pastoral está listo.',
    sub: 'Elige una herramienta abajo y empieza a crear. Cada clic abre un panel enfocado — sin complicaciones.',
  },
};

export default function Estudio() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isFree = isFreePlan(profile?.plan);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolCardData | null>(null);
  const [helpToolId, setHelpToolId] = useState<string | null>(null);

  const handleToolClick = (tool: ToolCardData) => {
    setActiveTool(tool);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          {greeting[lang].h1}
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2 max-w-xl">
          {greeting[lang].sub}
        </p>
      </div>

      {/* Tool Sections */}
      {sections.map((section, si) => (
        <section key={si}>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-foreground">{section.label[lang]}</h2>
            <p className="text-[13px] text-muted-foreground">{section.subtitle[lang]}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {section.tools.map((tool, ti) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                lang={lang}
                isFree={isFree}
                onClick={handleToolClick}
                onHelp={(id) => setHelpToolId(id)}
                index={si * 7 + ti}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Sheet for tool interaction */}
      {activeTool && (
        <ToolSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          toolId={activeTool.id}
          toolTitle={activeTool.title[lang]}
        />
      )}

      {helpToolId && (
        <HelpArticleModal
          open={!!helpToolId}
          onOpenChange={(open) => !open && setHelpToolId(null)}
          toolId={helpToolId}
        />
      )}
    </div>
  );
}
