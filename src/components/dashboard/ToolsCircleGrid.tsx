import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  Wand2, GraduationCap, PenLine, ImageIcon, BookOpen,
  Search, Heart, Gamepad2, Baby, Mic
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface CircleTool {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  action: string;
}

const tools: CircleTool[] = [
  { id: 'studio', icon: Mic, label: { PT: 'Gerador de Pregação', EN: 'Sermon Generator', ES: 'Generador de Sermón' }, action: 'tool:studio' },
  { id: 'biblical-study', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, action: 'navigate:/estudos/novo' },
  { id: 'social-studio', icon: ImageIcon, label: { PT: 'Artes Bíblicas', EN: 'Biblical Art', ES: 'Artes Bíblicas' }, action: 'navigate:/social-studio' },
  { id: 'bible-reader', icon: BookOpen, label: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' }, action: 'navigate:/bible' },
  { id: 'blog', icon: PenLine, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: 'tool:free-article' },
  { id: 'research', icon: Search, label: { PT: 'Pesquisa', EN: 'Research', ES: 'Investigación' }, action: 'tool:topic-explorer' },
  { id: 'bom-amigo', icon: Heart, label: { PT: 'O Bom Amigo', EN: 'Good Friend', ES: 'El Buen Amigo' }, action: 'navigate:/bom-amigo' },
  { id: 'kids', icon: Baby, label: { PT: 'Kids', EN: 'Kids', ES: 'Niños' }, action: 'tool:kids_story' },
];

interface ToolsCircleGridProps {
  onToolClick: (toolId: string) => void;
}

export function ToolsCircleGrid({ onToolClick }: ToolsCircleGridProps) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const sectionTitle = {
    PT: '🚀 NAVEGUE NAS FERRAMENTAS',
    EN: '🚀 BROWSE TOOLS',
    ES: '🚀 NAVEGA EN LAS HERRAMIENTAS',
  };

  const handleClick = (action: string) => {
    if (action.startsWith('navigate:')) {
      navigate(action.replace('navigate:', ''));
    } else if (action.startsWith('tool:')) {
      onToolClick(action.replace('tool:', ''));
    } else if (action.startsWith('scroll:')) {
      const el = document.getElementById(action.replace('scroll:', ''));
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap">
          {sectionTitle[lang]}
        </p>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
        <div className="flex gap-4 sm:gap-5 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center py-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleClick(tool.action)}
                className="flex flex-col items-center gap-2 group w-[72px] sm:w-[80px] shrink-0"
              >
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-card border-2 border-border flex items-center justify-center transition-all group-hover:border-primary/50 group-hover:shadow-md group-hover:shadow-primary/10 group-active:scale-95">
                  <Icon className="h-6 w-6 text-primary/80 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">
                  {tool.label[lang]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
