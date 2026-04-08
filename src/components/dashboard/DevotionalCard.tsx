import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, BookOpen, ChevronRight, Coffee } from 'lucide-react';
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
  header: { PT: 'Devocional de Hoje', EN: "Today's Devotional", ES: 'Devocional de Hoy' },
  listen: { PT: 'Ouvir', EN: 'Listen', ES: 'Escuchar' },
  read: { PT: 'Ler Devocional', EN: 'Read Devotional', ES: 'Leer Devocional' },
  loading: { PT: 'Carregando...', EN: 'Loading...', ES: 'Cargando...' },
  error: { PT: 'Não foi possível carregar o devocional.', EN: 'Could not load devotional.', ES: 'No se pudo cargar el devocional.' },
} satisfies Record<string, Record<L, string>>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

function InlineAudioPlayer({ audioUrl, duration }: { audioUrl: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [speed, setSpeed] = useState(1);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
    setPlaying(!playing);
  }, [playing]);

  const cycleSpeed = useCallback(() => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [speed]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * totalDuration;
  }, [totalDuration]);

  return (
    <div className="bg-background/50 rounded-xl p-3 mt-3 space-y-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setTotalDuration(audioRef.current?.duration || duration || 0)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <div
            className="h-1 bg-border rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: totalDuration ? `${(currentTime / totalDuration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>

        <button
          onClick={cycleSpeed}
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

export function DevotionalCard() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<DevotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

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
      <div className="rounded-2xl border-l-4 border-primary bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border-l-4 border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{labels.error[lang]}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-l-4 border-primary bg-card p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            {labels.header[lang]}
          </span>
        </div>
        <Link
          to="/devocional"
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          {formatDate(data.scheduled_date, lang)}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Verse card */}
      <div className="bg-background/40 rounded-xl p-4 space-y-2">
        <span className="inline-block bg-primary/15 text-primary text-[11px] px-2 py-0.5 rounded-full font-medium">
          {data.category}
        </span>
        <p className="font-display text-base sm:text-lg leading-relaxed text-foreground italic">
          "{data.anchor_verse_text}"
        </p>
        <p className="text-xs text-muted-foreground text-right">
          — {data.anchor_verse}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {data.audio_url && (
          <button
            onClick={() => setShowPlayer((p) => !p)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            {labels.listen[lang]}
            {data.audio_duration_seconds && (
              <span className="text-primary-foreground/70 text-xs ml-0.5">
                — {formatDuration(data.audio_duration_seconds)}
              </span>
            )}
          </button>
        )}
        <Link
          to="/devocional"
          className="flex items-center gap-1.5 border border-primary text-primary rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
          {labels.read[lang]}
        </Link>
      </div>

      {/* Inline audio player */}
      {showPlayer && data.audio_url && (
        <InlineAudioPlayer audioUrl={data.audio_url} duration={data.audio_duration_seconds} />
      )}
    </div>
  );
}
