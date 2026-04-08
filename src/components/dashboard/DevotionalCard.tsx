import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ChevronRight, Headphones, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type L = 'PT' | 'EN' | 'ES';

interface DevotionalData {
  id: string;
  title: string;
  category: string;
  anchor_verse: string;
  anchor_verse_text: string;
  body_text: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  reflection_question: string;
  scheduled_date: string;
}

const labels = {
  section: { PT: '📖 PALAVRA VIVA DE HOJE', EN: '📖 TODAY\'S LIVING WORD', ES: '📖 PALABRA VIVA DE HOY' },
  header: { PT: 'SUA LEITURA DIÁRIA', EN: 'YOUR DAILY READING', ES: 'TU LECTURA DIARIA' },
  listen: { PT: 'Escutar', EN: 'Listen', ES: 'Escuchar' },
  cta: { PT: 'Abrir leitura completa', EN: 'Open full reading', ES: 'Abrir lectura completa' },
  loading: { PT: 'Preparando sua palavra...', EN: 'Preparing your word...', ES: 'Preparando tu palabra...' },
  error: { PT: 'Não conseguimos carregar a palavra de hoje.', EN: 'We couldn\'t load today\'s word.', ES: 'No pudimos cargar la palabra de hoy.' },
} satisfies Record<string, Record<L, string>>;

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function DevotionalCard() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<DevotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data: result, error: err } = await supabase.functions.invoke('get-devotional-today');
        if (err || !result) throw err;
        setData(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Skeleton className="h-3 w-32" />
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-48 rounded-full mx-auto" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{labels.error[lang]}</p>
      </div>
    );
  }

  return (
    <section className="space-y-2">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap">
          {labels.section[lang]}
        </p>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
                {labels.header[lang]}
              </p>
              <p className="text-base font-semibold text-foreground leading-snug mt-0.5">
                {data.title}
              </p>
            </div>
          </div>
          <Link to="/devocional" className="text-muted-foreground hover:text-primary transition-colors mt-1">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] px-2.5 py-1 rounded-full font-medium">
            📗 {data.category}
          </span>
          {data.audio_url && (
            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] px-2.5 py-1 rounded-full font-medium">
              <Headphones className="h-3 w-3" /> {labels.listen[lang]}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted">
            <Calendar className="h-3 w-3" /> {formatDate(data.scheduled_date, lang)}
          </span>
        </div>

        {/* Verse quote */}
        <div className="rounded-xl bg-background/40 border border-border/50 p-4">
          <blockquote className="text-sm italic text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
            {data.anchor_verse_text}
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2 pl-3">
            — {data.anchor_verse}
          </p>
        </div>

        {/* CTA button */}
        <div className="flex justify-center">
          <Link
            to="/devocional"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {labels.cta[lang]}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
