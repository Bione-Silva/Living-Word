import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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

const PHONE_GRADIENTS = [
  'from-amber-300 via-orange-400 to-rose-500',
  'from-purple-500 via-fuchsia-500 to-pink-500',
  'from-sky-400 via-indigo-500 to-purple-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
];

export function SocialStudioPromoCard() {
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const navigate = useNavigate();
  const t = COPY[lang];

  return (
    <section className="h-full">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/8 p-4 sm:p-5 h-full flex items-center gap-3 sm:gap-4 overflow-hidden relative">
        {/* Left: copy */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {t.badge}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
              {t.badge}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight mb-1.5">
            {t.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mb-3 line-clamp-3">
            {t.desc}
          </p>
          <Button
            onClick={() => navigate('/social-studio')}
            size="sm"
            className="h-8 px-3 text-xs gap-1.5"
          >
            {t.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: phone fan mockup */}
        <div className="shrink-0 relative w-[120px] sm:w-[150px] h-[140px] sm:h-[160px]">
          {PHONE_GRADIENTS.map((g, i) => {
            const offset = (i - 1.5) * 14;
            const rotate = (i - 1.5) * 6;
            const z = i === 1 || i === 2 ? 20 : 10;
            const scale = i === 1 || i === 2 ? 1 : 0.92;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-[42px] sm:w-[52px] h-[90px] sm:h-[110px] rounded-[10px] sm:rounded-[12px] border-[2px] border-foreground/80 bg-foreground/5 overflow-hidden shadow-md"
                style={{
                  transform: `translate(-50%, -50%) translateX(${offset}px) rotate(${rotate}deg) scale(${scale})`,
                  zIndex: z,
                }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${g} flex items-end p-1`}>
                  <div className="w-full h-1 rounded-full bg-white/40" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
