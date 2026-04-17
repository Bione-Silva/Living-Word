import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Palette, ArrowRight, Sparkles } from 'lucide-react';

const copy = {
  PT: {
    badge: 'NOVO',
    title: 'Estúdio Social',
    desc: 'Crie artes bíblicas prontas para Instagram, Stories e carrosséis em segundos.',
    cta: 'Abrir Estúdio',
  },
  EN: {
    badge: 'NEW',
    title: 'Social Studio',
    desc: 'Create biblical art ready for Instagram, Stories and carousels in seconds.',
    cta: 'Open Studio',
  },
  ES: {
    badge: 'NUEVO',
    title: 'Estudio Social',
    desc: 'Crea artes bíblicas listas para Instagram, Stories y carruseles en segundos.',
    cta: 'Abrir Estudio',
  },
};

export function SocialStudioHighlightCard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = copy[lang];

  return (
    <button
      onClick={() => navigate('/social-studio')}
      className="w-full text-left group"
      aria-label={t.title}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group-active:scale-[0.99]">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

        <div className="relative p-4 sm:p-5 flex items-center gap-4">
          <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Palette className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                {t.badge}
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight truncate">
                {t.title}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">
              {t.desc}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
            <span className="hidden sm:inline">{t.cta}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </button>
  );
}
