import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, Package } from 'lucide-react';

interface MoreToolsAccordionProps {
  // Kept for API compatibility with Dashboard; no longer used.
  onToolClick?: (toolId: string) => void;
}

export function MoreToolsAccordion(_props: MoreToolsAccordionProps) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const label = {
    PT: 'Ver mais ferramentas',
    EN: 'See more tools',
    ES: 'Ver más herramientas',
  };
  const subtitle = {
    PT: 'Explore todas as ferramentas organizadas por categoria',
    EN: 'Explore all tools organized by category',
    ES: 'Explora todas las herramientas organizadas por categoría',
  };

  return (
    <section>
      <button
        onClick={() => navigate('/ferramentas')}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/40 active:scale-[0.99] transition-all text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{label[lang]}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{subtitle[lang]}</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </section>
  );
}
