import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Wand2, PenLine, Type, Video, BookOpen, Film, Languages, Lock, X } from 'lucide-react';
import { useState } from 'react';

interface ToolCard {
  id: string;
  icon: React.ElementType;
  title: { PT: string; EN: string; ES: string };
  description: { PT: string; EN: string; ES: string };
  path?: string;
  locked?: boolean;
}

const createTools: ToolCard[] = [
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: 'Gere sermões, esboços e devocionais a partir de passagens bíblicas', EN: 'Generate sermons, outlines and devotionals from Bible passages', ES: 'Genera sermones, bosquejos y devocionales' }, path: '/estudio' },
  { id: 'free-article', icon: PenLine, title: { PT: 'Artigo Livre', EN: 'Free Article', ES: 'Artículo Libre' }, description: { PT: 'Crie artigos de blog a partir de um tema ou ideia', EN: 'Create blog articles from a topic or idea', ES: 'Crea artículos de blog desde un tema' }, path: '/estudio' },
  { id: 'title-gen', icon: Type, title: { PT: 'Gerador de Títulos', EN: 'Title Generator', ES: 'Generador de Títulos' }, description: { PT: 'Ideias criativas de títulos para seus sermões', EN: 'Creative title ideas for your sermons', ES: 'Ideas creativas de títulos para sermones' }, locked: true },
];

const videoTools: ToolCard[] = [
  { id: 'youtube-blog', icon: Video, title: { PT: 'Vídeo para Blog', EN: 'Video to Blog', ES: 'Video a Blog' }, description: { PT: 'Transforme vídeos do YouTube em artigos de blog', EN: 'Turn YouTube videos into blog articles', ES: 'Transforma videos de YouTube en artículos' }, path: '/estudio' },
];

const researchTools: ToolCard[] = [
  { id: 'verse-explorer', icon: BookOpen, title: { PT: 'Explorador de Versículos', EN: 'Verse Explorer', ES: 'Explorador de Versículos' }, description: { PT: 'Encontre versículos por tema ou palavra-chave', EN: 'Find verses by topic or keyword', ES: 'Encuentra versículos por tema' }, path: '/estudio' },
  { id: 'illustrations', icon: Film, title: { PT: 'Ilustrações Contemporâneas', EN: 'Contemporary Illustrations', ES: 'Ilustraciones Contemporáneas' }, description: { PT: 'Cenas de filmes e histórias aplicáveis ao seu sermão', EN: 'Movie scenes and stories applicable to your sermon', ES: 'Escenas de películas aplicables a tu sermón' }, path: '/estudio' },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: 'Explore o Grego e Hebraico simplificado', EN: 'Explore simplified Greek and Hebrew', ES: 'Explora Griego y Hebreo simplificado' }, locked: true },
];

function ToolCardComponent({ tool, lang, isFree }: { tool: ToolCard; lang: 'PT' | 'EN' | 'ES'; isFree: boolean }) {
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
  if (isLocked) return <Link to="/upgrade">{content}</Link>;
  if (tool.path) return <Link to={tool.path}>{content}</Link>;
  return content;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isFree = profile?.plan === 'free';
  const [showBanner, setShowBanner] = useState(true);

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
              <h3 className="font-semibold text-sm">{lang === 'PT' ? 'Personalize sua saída' : 'Personalize your output'}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'PT' ? 'Aprimore seus sermões adicionando sua denominação e versão bíblica preferida. Disponível no plano Pastoral.' : 'Enhance your sermons by adding your denomination and preferred Bible version. Available on the Pastoral plan.'}
              </p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground shrink-0 ml-4"><X className="h-4 w-4" /></button>
          </CardContent>
        </Card>
      )}

      {profile?.blog_handle && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm">🎉 {lang === 'PT' ? 'Seu blog está no ar:' : 'Your blog is live:'}{' '}
              <a href={`/blog/${profile.blog_handle}`} className="text-primary font-semibold underline underline-offset-2">{profile.blog_handle}.livingword.app</a>
            </p>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">🖋️ {lang === 'PT' ? 'ESCREVER E CRIAR' : 'WRITE & CREATE'}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {createTools.map((t) => <ToolCardComponent key={t.id} tool={t} lang={lang} isFree={isFree} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">🎥 {lang === 'PT' ? 'VÍDEO PARA BLOG' : 'VIDEO TO BLOG'}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videoTools.map((t) => <ToolCardComponent key={t.id} tool={t} lang={lang} isFree={isFree} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">🔎 {lang === 'PT' ? 'FERRAMENTAS DE PESQUISA' : 'RESEARCH TOOLS'}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {researchTools.map((t) => <ToolCardComponent key={t.id} tool={t} lang={lang} isFree={isFree} />)}
        </div>
      </section>
    </div>
  );
}
