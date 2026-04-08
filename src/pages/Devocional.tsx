import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, ArrowLeft, Headphones, Calendar, MessageCircle,
  Play, Pause, Volume2, VolumeX, Share2, Download, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
  pageTitle: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  subtitle: { PT: 'Reflexões diárias para fortalecer sua fé', EN: 'Daily reflections to strengthen your faith', ES: 'Reflexiones diarias para fortalecer tu fe' },
  listenSection: { PT: 'OUVIR DEVOCIONAL', EN: 'LISTEN TO DEVOTIONAL', ES: 'ESCUCHAR DEVOCIONAL' },
  reflection: { PT: 'REFLEXÃO', EN: 'REFLECTION', ES: 'REFLEXIÓN' },
  reflectionQ: { PT: 'PARA REFLETIR', EN: 'TO REFLECT', ES: 'PARA REFLEXIONAR' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  whatsapp: { PT: 'WhatsApp', EN: 'WhatsApp', ES: 'WhatsApp' },
  copyText: { PT: 'Copiar texto', EN: 'Copy text', ES: 'Copiar texto' },
  copied: { PT: 'Texto copiado!', EN: 'Text copied!', ES: '¡Texto copiado!' },
  error: { PT: 'Não foi possível carregar o devocional.', EN: 'Could not load devotional.', ES: 'No se pudo cargar el devocional.' },
} satisfies Record<string, Record<L, string>>;

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Audio Player ─── */
function AudioPlayer({ src, title, lang }: { src: string; title: string; lang: L }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <audio
        ref={audioRef}
        src={src}
        muted={muted}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
            {labels.listenSection[lang]}
          </p>
          <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground transition-colors">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          onClick={togglePlay}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          {playing
            ? <Pause className="h-6 w-6" />
            : <Play className="h-6 w-6 ml-0.5" />
          }
        </button>
        <button onClick={cycleSpeed} className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors min-w-[32px]">
          {speed}x
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
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

  const handleCopyText = () => {
    if (!data) return;
    const text = `${data.title}\n\n"${data.anchor_verse_text}"\n— ${data.anchor_verse}\n\n${data.body_text}\n\n${data.reflection_question}`;
    navigator.clipboard.writeText(text);
    toast.success(labels.copied[lang]);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const text = `*${data.title}*\n\n_"${data.anchor_verse_text}"_\n— ${data.anchor_verse}\n\n${data.body_text.slice(0, 500)}${data.body_text.length > 500 ? '...' : ''}\n\n💭 ${data.reflection_question}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `"${data.anchor_verse_text}" — ${data.anchor_verse}\n\n${data.reflection_question}`,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopyText();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-56" />
          </div>
        </div>
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-7 w-full" />
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
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Back link */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-display font-bold text-foreground">
            Living Word {labels.pageTitle[lang]}
          </p>
          <p className="text-xs text-muted-foreground">{labels.subtitle[lang]}</p>
        </div>
      </div>

      {/* Date + Category badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs px-3 py-1.5 rounded-lg font-medium bg-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span className="capitalize">{formatDate(data.scheduled_date, lang)}</span>
        </span>
        <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-3 py-1.5 rounded-lg font-semibold">
          📗 {data.category}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground leading-snug">
        {data.title}
      </h1>

      {/* Verse quote card */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <blockquote className="text-base sm:text-lg italic text-foreground/90 leading-relaxed border-l-[3px] border-primary/50 pl-4">
          "{data.anchor_verse_text}"
        </blockquote>
        <p className="text-sm text-primary mt-3 pl-4 font-medium">
          — {data.anchor_verse}
        </p>
      </div>

      {/* Audio player */}
      {data.audio_url && (
        <AudioPlayer src={data.audio_url} title={data.title} lang={lang} />
      )}

      {/* Share buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleCopyText}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
        >
          <Download className="h-4 w-4" /> {labels.copyText[lang]}
        </button>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
        >
          <Share2 className="h-4 w-4" /> {labels.share[lang]}
        </button>
        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          {labels.whatsapp[lang]}
        </button>
      </div>

      {/* Reflexão (body text) */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs font-bold tracking-[0.12em] uppercase text-primary">
            {labels.reflection[lang]}
          </p>
        </div>
        <div className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line">
          {data.body_text}
        </div>
      </div>

      {/* Reflection question */}
      {data.reflection_question && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-primary">
              {labels.reflectionQ[lang]}
            </p>
          </div>
          <p className="text-sm sm:text-base text-foreground leading-relaxed italic">
            {data.reflection_question}
          </p>
        </div>
      )}
    </div>
  );
}
