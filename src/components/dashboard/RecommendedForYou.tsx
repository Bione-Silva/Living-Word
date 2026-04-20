import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const L10N = {
  section: { PT: 'RECOMENDADO PARA VOCÊ', EN: 'RECOMMENDED FOR YOU', ES: 'RECOMENDADO PARA TI' },
  viewAll: { PT: 'Ver tudo', EN: 'View all', ES: 'Ver todo' },
  basedOn: {
    PT: 'Baseado em suas leituras e temas que você tem pesquisado.',
    EN: 'Based on your readings and topics you have explored.',
    ES: 'Basado en tus lecturas y temas que has investigado.',
  },
  fallbackTitle: {
    PT: 'Confiança em Deus em Tempos Difíceis',
    EN: 'Trusting God in Difficult Times',
    ES: 'Confianza en Dios en Tiempos Difíciles',
  },
  explore: { PT: 'Explorar', EN: 'Explore', ES: 'Explorar' },
} satisfies Record<string, Record<L, string>>;

export function RecommendedForYou() {
  const { user } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const [item, setItem] = useState<{ id: string; title: string; cover: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('devotionals')
        .select('id, title, cover_image_url')
        .eq('language', lang)
        .lte('scheduled_date', today)
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setItem({ id: data.id, title: data.title, cover: data.cover_image_url });
    })();
  }, [user, lang]);

  const cover = item?.cover ?? '/placeholder.svg';
  const title = item?.title ?? L10N.fallbackTitle[lang];

  return (
    <section className="h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {L10N.section[lang]}
        </p>
        <Link
          to="/devocional"
          className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {L10N.viewAll[lang]} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5 flex gap-3 h-[calc(100%-1.75rem)]">
        <div className="w-[78px] sm:w-[92px] aspect-[9/16] rounded-lg overflow-hidden shrink-0 bg-muted">
          <img src={cover} alt={title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2">
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-snug mt-1.5 line-clamp-3">
            {L10N.basedOn[lang]}
          </p>
          <div className="mt-auto pt-2">
            <Button asChild size="sm" className="h-8 px-3 text-xs">
              <Link to="/devocional">{L10N.explore[lang]}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
