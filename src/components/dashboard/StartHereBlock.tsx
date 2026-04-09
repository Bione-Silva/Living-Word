import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Mic, GraduationCap, PenLine, ImageIcon } from 'lucide-react';

const actions = [
  {
    id: 'sermon',
    icon: Mic,
    label: { PT: 'Preparar Sermão', EN: 'Prepare Sermon', ES: 'Preparar Sermón' },
    desc: { PT: 'Esboço, roteiro e sermão completo', EN: 'Outline, script and full sermon', ES: 'Bosquejo, guión y sermón completo' },
    action: 'tool:studio',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 'study',
    icon: GraduationCap,
    label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
    desc: { PT: 'Estudo teológico com 8 seções', EN: 'Theological study with 8 sections', ES: 'Estudio teológico con 8 secciones' },
    action: 'navigate:/estudos/novo',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    id: 'article',
    icon: PenLine,
    label: { PT: 'Criar Artigo', EN: 'Write Article', ES: 'Crear Artículo' },
    desc: { PT: 'Blog, devocional ou texto livre', EN: 'Blog, devotional or free text', ES: 'Blog, devocional o texto libre' },
    action: 'tool:free-article',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 'social',
    icon: ImageIcon,
    label: { PT: 'Conteúdo Social', EN: 'Social Content', ES: 'Contenido Social' },
    desc: { PT: 'Artes para Instagram e Stories', EN: 'Art for Instagram and Stories', ES: 'Artes para Instagram y Stories' },
    action: 'navigate:/social-studio',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
];

interface StartHereBlockProps {
  onToolClick: (toolId: string) => void;
}

export function StartHereBlock({ onToolClick }: StartHereBlockProps) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const sectionTitle = {
    PT: '👑 COMECE AQUI',
    EN: '👑 START HERE',
    ES: '👑 COMIENZA AQUÍ',
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
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary mb-3 px-1">
        {sectionTitle[lang]}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => handleClick(a.action)}
              className="group rounded-xl p-4 flex flex-col items-start gap-2.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.bg}`}>
                <Icon className={`h-5 w-5 ${a.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{a.label[lang]}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{a.desc[lang]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
