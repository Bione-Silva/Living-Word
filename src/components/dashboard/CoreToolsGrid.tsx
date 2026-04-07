import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wand2, GraduationCap, PenLine, Search, ImageIcon, Library } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface CoreTool {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  desc: Record<L, string>;
  action: string;
}

const coreTools: CoreTool[] = [
  { id: 'studio', icon: Wand2, label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, desc: { PT: 'Sermões, esboços e devocionais', EN: 'Sermons, outlines and devotionals', ES: 'Sermones, bosquejos y devocionales' }, action: 'tool:studio' },
  { id: 'biblical-study', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, desc: { PT: 'Estudo profundo com 8 seções', EN: 'Deep study with 8 sections', ES: 'Estudio profundo con 8 secciones' }, action: 'navigate:/estudos/novo' },
  { id: 'blog', icon: PenLine, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, desc: { PT: 'Artigos, devocionais e textos', EN: 'Articles, devotionals and texts', ES: 'Artículos, devocionales y textos' }, action: 'tool:free-article' },
  { id: 'research', icon: Search, label: { PT: 'Pesquisa', EN: 'Research', ES: 'Investigación' }, desc: { PT: 'Versículos, contexto e citações', EN: 'Verses, context and quotes', ES: 'Versículos, contexto y citas' }, action: 'tool:topic-explorer' },
  { id: 'social-studio', icon: ImageIcon, label: { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' }, desc: { PT: 'Artes para redes sociais', EN: 'Art for social media', ES: 'Artes para redes sociales' }, action: 'navigate:/social-studio' },
  { id: 'library', icon: Library, label: { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' }, desc: { PT: 'Seus materiais salvos', EN: 'Your saved materials', ES: 'Tus materiales guardados' }, action: 'navigate:/biblioteca' },
];

interface CoreToolsGridProps {
  onToolClick: (toolId: string) => void;
}

export function CoreToolsGrid({ onToolClick }: CoreToolsGridProps) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const sectionTitle = {
    PT: '🛠️ FERRAMENTAS PRINCIPAIS',
    EN: '🛠️ MAIN TOOLS',
    ES: '🛠️ HERRAMIENTAS PRINCIPALES',
  };

  const handleClick = (action: string) => {
    if (action.startsWith('navigate:')) {
      navigate(action.replace('navigate:', ''));
    } else if (action.startsWith('tool:')) {
      onToolClick(action.replace('tool:', ''));
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 px-1">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap">
          {sectionTitle[lang]}
        </p>
        <div className="flex-1 h-px bg-border/50" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {coreTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleClick(tool.action)}
              className="rounded-xl p-3.5 flex flex-col items-start gap-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground leading-tight">{tool.label[lang]}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{tool.desc[lang]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
