import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Wand2, PenLine, Type, Video, BookOpen, Film, Languages, Lock, X,
  Search, Globe, Quote, Clapperboard, ScrollText, Lightbulb, Sparkles, BookText
} from 'lucide-react';
import { useState } from 'react';
import { ToolModal } from '@/components/ToolModal';

interface ToolCard {
  id: string;
  icon: React.ElementType;
  title: { PT: string; EN: string; ES: string };
  description: { PT: string; EN: string; ES: string };
  path?: string;
  locked?: boolean;
  hasModal?: boolean;
}

const researchTools: ToolCard[] = [
  { id: 'topic-explorer', icon: Search, title: { PT: 'Explorador de Tópicos', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: 'Descubra subtemas e ângulos para sua pregação', EN: 'Discover subtopics and angles for your sermon', ES: 'Descubre subtemas y ángulos para tu sermón' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos sobre o Tema', EN: 'Find Verses on Topic', ES: 'Encuentra Versículos por Tema' }, description: { PT: 'Busque versículos relevantes por tema ou palavra-chave', EN: 'Search relevant verses by topic or keyword', ES: 'Busca versículos relevantes por tema' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico do Verso', EN: 'Verse Historical Context', ES: 'Contexto Histórico del Verso' }, description: { PT: 'Entenda o contexto cultural e histórico da passagem', EN: 'Understand the cultural and historical context', ES: 'Entiende el contexto cultural e histórico' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: 'Encontre citações de teólogos e pensadores cristãos', EN: 'Find quotes from theologians and Christian thinkers', ES: 'Encuentra citas de teólogos y pensadores' }, hasModal: true },
  { id: 'movie-scenes', icon: Clapperboard, title: { PT: 'Localizador de Cenas de Filmes', EN: 'Movie Scene Finder', ES: 'Buscador de Escenas de Películas' }, description: { PT: 'Cenas de filmes aplicáveis ao seu sermão', EN: 'Movie scenes applicable to your sermon', ES: 'Escenas de películas aplicables a tu sermón' }, hasModal: true },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Explorador de Texto Original', EN: 'Original Text Explorer', ES: 'Explorador de Texto Original' }, description: { PT: 'Explore o Grego e Hebraico simplificado', EN: 'Explore simplified Greek and Hebrew', ES: 'Explora Griego y Hebreo simplificado' }, locked: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical / Línguas Clássicas', EN: 'Lexical Research / Classical Languages', ES: 'Investigación Léxica / Lenguas Clásicas' }, description: { PT: 'Análise de palavras originais e raízes linguísticas', EN: 'Original word analysis and linguistic roots', ES: 'Análisis de palabras originales y raíces' }, locked: true },
];

const createTools: ToolCard[] = [
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: 'Gere sermões, esboços e devocionais a partir de passagens bíblicas', EN: 'Generate sermons, outlines and devotionals from Bible passages', ES: 'Genera sermones, bosquejos y devocionales' }, path: '/estudio' },
  { id: 'title-gen', icon: Type, title: { PT: 'Gerador de Títulos Criativos', EN: 'Creative Title Generator', ES: 'Generador de Títulos Creativos' }, description: { PT: 'Ideias criativas de títulos para seus sermões', EN: 'Creative title ideas for your sermons', ES: 'Ideas creativas de títulos para sermones' }, hasModal: true },
  { id: 'metaphor-creator', icon: Lightbulb, title: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, description: { PT: 'Metáforas e analogias poderosas para sua mensagem', EN: 'Powerful metaphors and analogies for your message', ES: 'Metáforas y analogías poderosas para tu mensaje' }, hasModal: true },
  { id: 'illustrations', icon: Film, title: { PT: 'Ilustrações para Sermões', EN: 'Sermon Illustrations', ES: 'Ilustraciones para Sermones' }, description: { PT: 'Histórias e ilustrações contemporâneas para seu sermão', EN: 'Contemporary stories and illustrations for your sermon', ES: 'Historias e ilustraciones contemporáneas' }, locked: true },
  { id: 'bible-modernizer', icon: Sparkles, title: { PT: 'Modernizador de Histórias Bíblicas', EN: 'Bible Story Modernizer', ES: 'Modernizador de Historias Bíblicas' }, description: { PT: 'Recontextualize histórias bíblicas para o mundo atual', EN: 'Recontextualize Bible stories for the modern world', ES: 'Recontextualiza historias bíblicas al mundo actual' }, hasModal: true },
  { id: 'free-article', icon: PenLine, title: { PT: 'Artigo Livre / Redator Universal', EN: 'Free Article / Universal Writer', ES: 'Artículo Libre / Redactor Universal' }, description: { PT: 'Crie artigos de blog a partir de um tema ou ideia', EN: 'Create blog articles from a topic or idea', ES: 'Crea artículos de blog desde un tema' }, hasModal: true },
];

const outreachTools: ToolCard[] = [
  { id: 'youtube-blog', icon: Video, title: { PT: 'Transformar Vídeo em Blog', EN: 'Video to Blog', ES: 'Video a Blog' }, description: { PT: 'Transforme vídeos do YouTube em artigos de blog', EN: 'Turn YouTube videos into blog articles', ES: 'Transforma videos de YouTube en artículos' }, hasModal: true },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isFree = profile?.plan === 'free';
  const [showBanner, setShowBanner] = useState(true);
  const [activeModal, setActiveModal] = useState<{ id: string; title: string } | null>(null);

  const sectionLabel = (emoji: string, pt: string, en: string, es: string) => {
    const labels = { PT: pt, EN: en, ES: es };
    return `${emoji} ${labels[lang]}`;
  };

  const handleToolClick = (tool: ToolCard) => {
    if (tool.locked && isFree) return;
    if (tool.hasModal) {
      setActiveModal({ id: tool.id, title: tool.title[lang] });
    }
  };

  const renderToolCard = (tool: ToolCard) => {
    const isLocked = tool.locked && isFree;
    const Icon = tool.icon;
    const content = (
      <Card className={`group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isLocked ? 'opacity-75' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{tool.title[lang]}</h3>
                {isLocked && <Lock className="h-3.5 w-3.5 text-accent" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description[lang]}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    if (isLocked) return <Link key={tool.id} to="/upgrade">{content}</Link>;
    if (tool.path) return <Link key={tool.id} to={tool.path}>{content}</Link>;
    return <div key={tool.id} onClick={() => handleToolClick(tool)}>{content}</div>;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {lang === 'PT' ? 'Ferramentas pastorais ao seu alcance' : lang === 'EN' ? 'Pastoral tools at your fingertips' : 'Herramientas pastorales a tu alcance'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {lang === 'PT' ? 'As ferramentas disponíveis estão listadas abaixo, organizadas por categoria.' : lang === 'EN' ? 'Available tools are listed below, organized by category.' : 'Las herramientas disponibles están a continuación.'}
        </p>
      </div>

      {showBanner && isFree && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">
                {lang === 'PT' ? 'Personalize sua saída' : lang === 'EN' ? 'Personalize your output' : 'Personaliza tu salida'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'PT' ? 'Aprimore seus sermões adicionando sua denominação e versão bíblica preferida. Disponível no plano Pastoral.' : lang === 'EN' ? 'Enhance your sermons by adding your denomination and preferred Bible version. Available on the Pastoral plan.' : 'Mejora tus sermones añadiendo tu denominación y versión bíblica. Disponible en el plan Pastoral.'}
              </p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground shrink-0 ml-4"><X className="h-4 w-4" /></button>
          </CardContent>
        </Card>
      )}

      {profile?.blog_handle && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm">🎉 {lang === 'PT' ? 'Seu blog está no ar:' : lang === 'EN' ? 'Your blog is live:' : 'Tu blog está en línea:'}{' '}
              <a href={`/blog/${profile.blog_handle}`} className="text-primary font-semibold underline underline-offset-2">{profile.blog_handle}.livingword.app</a>
            </p>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {sectionLabel('🔎', 'FERRAMENTAS DE PESQUISA', 'RESEARCH TOOLS', 'HERRAMIENTAS DE INVESTIGACIÓN')}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {researchTools.map(renderToolCard)}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {sectionLabel('🖋️', 'ESCRITA E CRIAÇÃO', 'WRITING & CREATION', 'ESCRITURA Y CREACIÓN')}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {createTools.map(renderToolCard)}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {sectionLabel('📢', 'FERRAMENTAS DE ALCANCE', 'OUTREACH TOOLS', 'HERRAMIENTAS DE ALCANCE')}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {outreachTools.map(renderToolCard)}
        </div>
      </section>

      {activeModal && (
        <ToolModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          toolId={activeModal.id}
          toolTitle={activeModal.title}
        />
      )}
    </div>
  );
}
