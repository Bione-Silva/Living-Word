import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import promoImg from '@/assets/social-studio-promo.png';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  PT: {
    badge: 'Novo',
    title: 'Estúdio Social',
    desc: 'Crie artes incríveis para Instagram, Stories e carrosséis em segundos com IA.',
    cta: 'Abrir Estúdio',
  },
  EN: {
    badge: 'New',
    title: 'Social Studio',
    desc: 'Create stunning art for Instagram, Stories and carousels in seconds with AI.',
    cta: 'Open Studio',
  },
  ES: {
    badge: 'Nuevo',
    title: 'Estudio Social',
    desc: 'Crea artes increíbles para Instagram, Stories y carruseles en segundos con IA.',
    cta: 'Abrir Estudio',
  },
} satisfies Record<L, { badge: string; title: string; desc: string; cta: string }>;

export function SocialStudioPromoCard() {
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const navigate = useNavigate();
  const t = COPY[lang];

  return (
    <section className="h-full">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-primary/5 p-4 sm:p-5 h-full flex items-center gap-3 sm:gap-4 overflow-hidden relative">
        {/* Left: copy + CTA */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
              {t.badge}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/60 text-primary border border-primary/25">
              {t.badge}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight mb-2">
            {t.title}
          </h3>

          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mb-3.5 line-clamp-3">
            {t.desc}
          </p>

          <Button
            onClick={() => navigate('/social-studio')}
            size="sm"
            className="h-9 px-4 text-xs gap-1.5 rounded-lg"
          >
            {t.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: phone fan illustration (uploaded reference asset) */}
        <div className="shrink-0 w-[140px] sm:w-[170px] flex items-center justify-end">
          <img
            src={promoImg}
            alt={t.title}
            className="w-full h-auto object-contain pointer-events-none select-none"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
