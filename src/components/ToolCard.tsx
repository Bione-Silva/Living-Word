import { Card, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ToolCardData {
  id: string;
  icon: React.ElementType;
  title: { PT: string; EN: string; ES: string };
  description: { PT: string; EN: string; ES: string };
  tip?: { PT: string; EN: string; ES: string };
  path?: string;
  locked?: boolean;
  hasModal?: boolean;
}

/** Short tips (≤10 words) explaining each tool */
const toolTips: Record<string, { PT: string; EN: string; ES: string }> = {
  'topic-explorer': { PT: 'Descubra ângulos criativos para seu sermão', EN: 'Discover creative angles for your sermon', ES: 'Descubre ángulos creativos para tu sermón' },
  'verse-finder': { PT: 'Ache versículos por tema ou palavra-chave', EN: 'Find verses by topic or keyword', ES: 'Encuentra versículos por tema o palabra clave' },
  'historical-context': { PT: 'Entenda o cenário original da passagem', EN: 'Understand the original setting of the passage', ES: 'Entiende el escenario original del pasaje' },
  'quote-finder': { PT: 'Citações de teólogos para enriquecer a pregação', EN: 'Theologian quotes to enrich your preaching', ES: 'Citas de teólogos para enriquecer la predicación' },
  'movie-scenes': { PT: 'Ilustre com cenas marcantes do cinema', EN: 'Illustrate with memorable movie scenes', ES: 'Ilustra con escenas memorables del cine' },
  'original-text': { PT: 'Veja o Grego e Hebraico simplificados', EN: 'View simplified Greek and Hebrew text', ES: 'Ve el Griego y Hebreo simplificados' },
  'lexical': { PT: 'Estude raízes e significados das palavras', EN: 'Study word roots and original meanings', ES: 'Estudia raíces y significados de las palabras' },
  'studio': { PT: 'Crie sermões completos com IA pastoral', EN: 'Create full sermons with pastoral AI', ES: 'Crea sermones completos con IA pastoral' },
  'title-gen': { PT: 'Gere 10 títulos criativos para sermões', EN: 'Generate 10 creative sermon titles', ES: 'Genera 10 títulos creativos para sermones' },
  'metaphor-creator': { PT: 'Transforme conceitos em analogias modernas', EN: 'Turn concepts into modern analogies', ES: 'Transforma conceptos en analogías modernas' },
  'bible-modernizer': { PT: 'Reconte passagens no contexto de hoje', EN: 'Retell passages in today\'s context', ES: 'Recuenta pasajes en el contexto de hoy' },
  'illustrations': { PT: 'Histórias reais para ilustrar sua mensagem', EN: 'Real stories to illustrate your message', ES: 'Historias reales para ilustrar tu mensaje' },
  'free-article': { PT: 'Escreva artigos prontos para publicar', EN: 'Write articles ready to publish', ES: 'Escribe artículos listos para publicar' },
  'youtube-blog': { PT: 'Converta vídeos em artigos escritos', EN: 'Convert videos into written articles', ES: 'Convierte videos en artículos escritos' },
  'reels-script': { PT: 'Roteiro de 30-60s para redes sociais', EN: '30-60s script for social media', ES: 'Guión de 30-60s para redes sociales' },
  'cell-group': { PT: 'Estudo pronto com perguntas e dinâmica', EN: 'Ready study with questions and dynamics', ES: 'Estudio listo con preguntas y dinámica' },
  'social-caption': { PT: 'Legendas com emojis e hashtags prontas', EN: 'Captions with emojis and hashtags ready', ES: 'Leyendas con emojis y hashtags listas' },
  'newsletter': { PT: 'Newsletter pastoral semanal completa', EN: 'Complete weekly pastoral newsletter', ES: 'Newsletter pastoral semanal completa' },
  'announcements': { PT: 'Avisos claros e acolhedores pro culto', EN: 'Clear warm announcements for service', ES: 'Avisos claros y acogedores para el culto' },
  'trivia': { PT: 'Perguntas divertidas pra gincana bíblica', EN: 'Fun questions for Bible game night', ES: 'Preguntas divertidas para juego bíblico' },
  'poetry': { PT: 'Crie poemas inspirados em passagens bíblicas', EN: 'Create poems inspired by Bible passages', ES: 'Crea poemas inspirados en pasajes bíblicos' },
  'kids-story': { PT: 'Reconte histórias bíblicas para crianças', EN: 'Retell Bible stories for children', ES: 'Recuenta historias bíblicas para niños' },
  'deep-translation': { PT: 'Traduza textos com precisão teológica', EN: 'Translate texts with theological precision', ES: 'Traduce textos con precisión teológica' },
};

interface ToolCardProps {
  tool: ToolCardData;
  lang: 'PT' | 'EN' | 'ES';
  isFree: boolean;
  onClick: (tool: ToolCardData) => void;
  index?: number;
}

export function ToolCard({ tool, lang, isFree, onClick, index = 0 }: ToolCardProps) {
  const isLocked = tool.locked && isFree;
  const Icon = tool.icon;
  const animDelay = `${index * 60}ms`;
  const tip = tool.tip?.[lang] || toolTips[tool.id]?.[lang];

  const card = (
    <Card
      className={`group relative cursor-pointer border-border/60 bg-card hover:shadow-lg hover:-translate-y-0.5 animate-[fade-in_0.4s_ease-out_both] transition-all duration-200 ${
        isLocked
          ? 'opacity-60 hover:opacity-80'
          : 'hover:border-accent/50 hover:shadow-[0_0_20px_-5px_hsl(44,65%,58%,0.25)]'
      }`}
      style={{ animationDelay: animDelay }}
    >
      {isLocked && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
            <Crown className="h-3 w-3 text-accent" />
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center gap-2.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isLocked
                ? 'bg-muted/50'
                : 'bg-primary/10 group-hover:bg-primary/15'
            }`}
          >
            <Icon
              className={`h-5.5 w-5.5 ${
                isLocked ? 'text-muted-foreground' : 'text-primary'
              }`}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight">
              {tool.title[lang]}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {tool.description[lang]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const wrappedCard = tip ? (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {isLocked ? (
            <Link to="/upgrade">{card}</Link>
          ) : tool.path ? (
            <Link to={tool.path}>{card}</Link>
          ) : (
            <div onClick={() => onClick(tool)}>{card}</div>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  if (wrappedCard) return wrappedCard;

  if (isLocked) return <Link to="/upgrade">{card}</Link>;
  if (tool.path) return <Link to={tool.path}>{card}</Link>;
  return <div onClick={() => onClick(tool)}>{card}</div>;
}
