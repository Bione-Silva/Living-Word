import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ArrowLeft, Headphones, Calendar, MessageCircle } from 'lucide-react';
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
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  header: { PT: 'Devocional do Dia', EN: "Today's Devotional", ES: 'Devocional del Día' },
  listen: { PT: 'Ouvir áudio', EN: 'Listen to audio', ES: 'Escuchar audio' },
  reflect: { PT: '💭 Pergunta para reflexão', EN: '💭 Reflection question', ES: '💭 Pregunta de reflexión' },
  loading: { PT: 'Carregando devocional...', EN: 'Loading devotional...', ES: 'Cargando devocional...' },
  error: { PT: 'Não foi possível carregar o devocional.', EN: 'Could not load devotional.', ES: 'No se pudo cargar el devocional.' },
} satisfies Record<string, Record<L, string>>;

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Devocional() {
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-muted-foreground">{labels.error[lang]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      {/* Title block */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
              {labels.header[lang]}
            </p>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground leading-snug">
              {data.title}
            </h1>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap pl-14">
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] px-2.5 py-1 rounded-full font-medium">
            📗 {data.category}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted">
            <Calendar className="h-3 w-3" /> {formatDate(data.scheduled_date, lang)}
          </span>
        </div>
      </div>

      {/* Verse quote */}
      <div className="rounded-xl bg-card border border-border p-5">
        <blockquote className="text-base italic text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-4">
          "{data.anchor_verse_text}"
        </blockquote>
        <p className="text-sm text-muted-foreground mt-3 pl-4">
          — {data.anchor_verse}
        </p>
      </div>

      {/* Audio player */}
      {data.audio_url && (
        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Headphones className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">{labels.listen[lang]}</p>
            <audio controls src={data.audio_url} className="w-full h-8" />
          </div>
        </div>
      )}

      {/* Body text */}
      <div className="rounded-xl bg-card border border-border p-5 sm:p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
          {data.body_text}
        </div>
      </div>

      {/* Reflection question */}
      {data.reflection_question && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-primary">
              {labels.reflect[lang]}
            </p>
          </div>
          <p className="text-sm text-foreground leading-relaxed italic">
            {data.reflection_question}
          </p>
        </div>
      )}
    </div>
  );
}
