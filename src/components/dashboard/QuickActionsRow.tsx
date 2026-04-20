import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Mic, BookOpen, GraduationCap, Palette, Library,
  Heart, Search, MoreHorizontal,
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface QuickActionsRowProps {
  onMore: () => void;
}

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  action: () => void;
}

export function QuickActionsRow({ onMore }: QuickActionsRowProps) {
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const navigate = useNavigate();

  const sectionTitle = {
    PT: 'AÇÕES RÁPIDAS',
    EN: 'QUICK ACTIONS',
    ES: 'ACCIONES RÁPIDAS',
  } satisfies Record<L, string>;

  const actions: QuickAction[] = [
    { id: 'bible', icon: BookOpen, label: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' }, action: () => navigate('/bible') },
    { id: 'sermon', icon: Mic, label: { PT: 'Novo Sermão', EN: 'New Sermon', ES: 'Nuevo Sermón' }, action: () => navigate('/sermoes') },
    { id: 'study', icon: GraduationCap, label: { PT: 'Novo Estudo', EN: 'New Study', ES: 'Nuevo Estudio' }, action: () => navigate('/estudos/novo') },
    { id: 'social', icon: Palette, label: { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' }, action: () => navigate('/social-studio') },
    { id: 'library', icon: Library, label: { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' }, action: () => navigate('/biblioteca') },
    { id: 'palavra', icon: Heart, label: { PT: 'Palavra Amiga', EN: 'Friendly Word', ES: 'Palabra Amiga' }, action: () => navigate('/bom-amigo') },
    { id: 'search', icon: Search, label: { PT: 'Pesquisa', EN: 'Search', ES: 'Búsqueda' }, action: () => navigate('/ferramentas') },
    { id: 'more', icon: MoreHorizontal, label: { PT: 'Mais opções', EN: 'More', ES: 'Más opciones' }, action: onMore },
  ];

  return (
    <section className="h-full">
      <div className="flex items-center mb-3 px-1">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {sectionTitle[lang]}
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={a.action}
              className="flex flex-col items-center gap-1.5 group min-w-0"
            >
              <div className="w-full aspect-square max-h-14 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center transition-all group-hover:bg-primary/15 group-hover:border-primary/30 group-active:scale-95">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight line-clamp-2 w-full">
                {a.label[lang]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
