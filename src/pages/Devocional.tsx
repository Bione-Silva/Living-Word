import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, ArrowLeft, Headphones, Calendar, MessageCircle,
  Play, Pause, Volume2, VolumeX, Share2, Copy, ListChecks,
  PenLine, Send, Download, Image as ImageIcon, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

type L = 'PT' | 'EN' | 'ES';

interface DevotionalData {
  id: string;
  title: string;
  category: string;
  anchor_verse: string;
  anchor_verse_text: string;
  body_text: string;
  daily_practice?: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  reflection_question: string;
  scheduled_date: string;
  cover_image_url?: string | null;
}

interface PastDevotional {
  id: string;
  title: string;
  type: string;
  passage: string | null;
  created_at: string;
}

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  pageTitle: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  subtitle: { PT: 'Reflexões diárias para fortalecer sua fé', EN: 'Daily reflections to strengthen your faith', ES: 'Reflexiones diarias para fortalecer tu fe' },
  listenSection: { PT: 'OUVIR DEVOCIONAL', EN: 'LISTEN TO DEVOTIONAL', ES: 'ESCUCHAR DEVOCIONAL' },
  coverSection: { PT: 'CAPA DO DEVOCIONAL', EN: 'DEVOTIONAL COVER', ES: 'PORTADA DEL DEVOCIONAL' },
  coverSub: { PT: 'Salve e compartilhe', EN: 'Save and share', ES: 'Guarda y comparte' },
  reflection: { PT: 'REFLEXÃO', EN: 'REFLECTION', ES: 'REFLEXIÓN' },
  practice: { PT: 'PRÁTICA DO DIA', EN: 'DAILY PRACTICE', ES: 'PRÁCTICA DEL DÍA' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  saveImage: { PT: 'Salvar Imagem', EN: 'Save Image', ES: 'Guardar Imagen' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  shareWa: { PT: 'WhatsApp', EN: 'WhatsApp', ES: 'WhatsApp' },
  continueChat: { PT: 'Continuar no Chat', EN: 'Continue in Chat', ES: 'Continuar en el Chat' },
  personalReflection: { PT: 'Minha Reflexão Pessoal', EN: 'My Personal Reflection', ES: 'Mi Reflexión Personal' },
  personalReflectionSub: {
    PT: 'Escreva suas reflexões pessoais, orações ou pensamentos sobre o devocional de hoje.',
    EN: 'Write your personal reflections, prayers or thoughts about today\'s devotional.',
    ES: 'Escribe tus reflexiones personales, oraciones o pensamientos sobre el devocional de hoy.',
  },
  personalPlaceholder: {
    PT: 'O que este devocional significou para você hoje?',
    EN: 'What did this devotional mean to you today?',
    ES: '¿Qué significó este devocional para ti hoy?',
  },
  saveReflection: { PT: 'Salvar Reflexão', EN: 'Save Reflection', ES: 'Guardar Reflexión' },
  saved: { PT: 'Reflexão salva!', EN: 'Reflection saved!', ES: '¡Reflexión guardada!' },
  copied: { PT: 'Texto copiado!', EN: 'Text copied!', ES: '¡Texto copiado!' },
  imageSaved: { PT: 'Imagem salva!', EN: 'Image saved!', ES: '¡Imagen guardada!' },
  error: { PT: 'Não foi possível carregar o devocional.', EN: 'Could not load devotional.', ES: 'No se pudo cargar el devocional.' },
  previousDevotionals: { PT: 'Devocionais Anteriores', EN: 'Previous Devotionals', ES: 'Devocionales Anteriores' },
  noPrevious: { PT: 'Nenhum devocional salvo ainda.', EN: 'No saved devotionals yet.', ES: 'Aún no hay devocionales guardados.' },
} satisfies Record<string, Record<L, string>>;

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr);
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
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

      <div className="flex items-center justify-center gap-6">
        <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground transition-colors">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          onClick={togglePlay}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </button>
        <button onClick={cycleSpeed} className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors min-w-[32px]">
          {speed}x
        </button>
      </div>
    </div>
  );
}

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── Cover Image with Overlay ─── */
function CoverImageSection({ imageUrl, title, category, verse, lang }: {
  imageUrl: string;
  title: string;
  category: string;
  verse: string;
  lang: L;
}) {
  const handleSaveImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devocional-${title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(labels.imageSaved[lang]);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — ${verse}`, url: imageUrl });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast.success(labels.copied[lang]);
    }
  };

  const handleWhatsApp = () => {
    const text = `*${title}*\n📗 ${category}\n📖 ${verse}\n\n${imageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary">
            {labels.coverSection[lang]}
          </p>
          <p className="text-xs text-muted-foreground">{labels.coverSub[lang]}</p>
        </div>
      </div>

      {/* Image with overlay */}
      <div className="flex justify-center">
        <div className="relative rounded-xl overflow-hidden shadow-lg max-w-sm w-full aspect-[3/4]">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 55%, transparent 70%)',
            }}
          />
          {/* Top badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider">
              📗 {category}
            </span>
            <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
              Living Word
            </span>
          </div>
          {/* Bottom text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col gap-3">
            <h3 className="text-white text-lg sm:text-xl font-display font-bold leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-white/20" />
            </div>
            <p className="text-white/80 text-xs sm:text-sm italic leading-relaxed line-clamp-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
              "{verse}"
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={handleSaveImage}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
        >
          <Download className="h-4 w-4" /> {labels.saveImage[lang]}
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
          <WhatsAppIcon /> {labels.shareWa[lang]}
        </button>
      </div>
    </div>
  );
}

/* ─── Previous Devotionals Sidebar ─── */
function PreviousDevotionalsSidebar({ lang, userId }: { lang: L; userId: string }) {
  const [items, setItems] = useState<(PastDevotional & { cover_image_url?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('materials')
        .select('id, title, type, passage, created_at, cover_image_url')
        .eq('user_id', userId)
        .eq('type', 'devotional')
        .order('created_at', { ascending: false })
        .limit(15);
      setItems((data as any) || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  return (
    <div className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-6 rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {labels.previousDevotionals[lang]}
            </p>
          </div>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[calc(100vh-200px)]">
          <div className="p-2">
            {loading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {labels.noPrevious[lang]}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-default"
                >
                  {/* Thumbnail */}
                  {item.cover_image_url ? (
                    <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <img
                        src={item.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary/50" />
                    </div>
                  )}
                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {formatShortDate(item.created_at, lang)}
                      </span>
                      {item.passage && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          📖 {item.passage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Devocional() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [data, setData] = useState<DevotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data: result, error: err } = await supabase.functions.invoke('get-devotional-today');
        if (err || !result) throw err;
        setData(result);

        // Persist devotional to materials for history sidebar (upsert by date)
        const todayTitle = result.title;
        const todayDate = result.scheduled_date;
        const { data: existing } = await supabase
          .from('materials')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'devotional')
          .gte('created_at', todayDate + 'T00:00:00')
          .lte('created_at', todayDate + 'T23:59:59')
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('materials').insert({
            user_id: user.id,
            title: todayTitle,
            type: 'devotional',
            content: result.body_text,
            passage: result.anchor_verse,
            cover_image_url: result.cover_image_url || null,
          });
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleCopy = () => {
    if (!data) return;
    const text = `*${data.title}*\n\n"${data.anchor_verse_text}"\n— ${data.anchor_verse}\n\n${data.body_text}\n\n💡 ${data.daily_practice || ''}\n\n💭 ${data.reflection_question}`;
    navigator.clipboard.writeText(text);
    toast.success(labels.copied[lang]);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const text = `*${data.title}*\n\n_"${data.anchor_verse_text}"_\n— ${data.anchor_verse}\n\n${data.body_text.slice(0, 500)}${data.body_text.length > 500 ? '...' : ''}\n\n💡 ${data.daily_practice || ''}\n\n💭 ${data.reflection_question}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveNote = async () => {
    if (!personalNote.trim() || !user || !data) return;
    setSavingNote(true);
    try {
      await supabase.from('materials').insert({
        user_id: user.id,
        title: `Reflexão: ${data.title}`,
        type: 'devotional_reflection',
        content: personalNote,
        passage: data.anchor_verse,
      });
      toast.success(labels.saved[lang]);
      setPersonalNote('');
    } catch {
      // silent
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div>
        </div>
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
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

  /* Day number within year (1–365) */
  const dayOfYear = (() => {
    const d = new Date(data.scheduled_date + 'T12:00:00');
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d.getTime() - start.getTime()) / 86400000);
  })();

  /* Short date for editorial header (e.g. "28 | FEV") */
  const editorialDate = (() => {
    const d = new Date(data.scheduled_date + 'T12:00:00');
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames: Record<L, string[]> = {
      PT: ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'],
      EN: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
      ES: ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'],
    };
    return `${day} | ${monthNames[lang][d.getMonth()]}`;
  })();

  const mainContent = (
    <div className="flex-1 min-w-0 max-w-2xl pb-10">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      {/* ═══ EDITORIAL DEVOTIONAL CARD ═══ */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

        {/* ── Top bar: date ── */}
        <div className="flex items-center justify-center py-2.5 border-b border-border bg-muted/30">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
            {editorialDate}
          </span>
        </div>

        {/* ── Cover image hero ── */}
        {data.cover_image_url && (
          <div className="relative w-full aspect-[16/7] overflow-hidden">
            <img
              src={data.cover_image_url}
              alt={data.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, hsla(var(--card), 1) 0%, hsla(var(--card), 0.7) 30%, transparent 60%)' }}
            />
          </div>
        )}

        {/* ── Title + Verse header ── */}
        <div className="px-5 sm:px-8 pt-5 pb-4 text-center border-b border-border/50">
          <h1 className="text-xl sm:text-2xl font-display font-black uppercase tracking-wide text-foreground leading-tight">
            {data.title}
          </h1>
          <div className="mt-3 max-w-md mx-auto">
            <p className="text-sm italic text-foreground/70 leading-relaxed">
              {data.anchor_verse_text}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mt-2">
              {data.anchor_verse}
            </p>
          </div>
        </div>

        {/* ── Two-column layout: sidebar quote + body ── */}
        <div className="flex flex-col sm:flex-row">

          {/* Left sidebar — quote card + meta */}
          <div className="sm:w-48 md:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-border/50 p-5 sm:p-6 flex flex-col gap-5 bg-primary/[0.03]">
            {/* Highlighted quote */}
            <div className="rounded-xl border-l-4 border-primary bg-primary/8 p-4">
              <p className="text-sm font-display font-bold italic text-foreground leading-relaxed">
                "{data.anchor_verse_text.length > 120
                  ? data.anchor_verse_text.slice(0, 120) + '…'
                  : data.anchor_verse_text}"
              </p>
            </div>

            {/* Meta info */}
            <div className="space-y-3 text-[11px]">
              <div>
                <p className="font-bold uppercase tracking-[0.15em] text-primary">
                  {labels.pageTitle[lang].toUpperCase()} 365
                </p>
                <p className="text-muted-foreground font-medium">
                  {dayOfYear}/365
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.15em] text-primary flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {lang === 'PT' ? 'LEITURA BÍBLICA' : lang === 'ES' ? 'LECTURA BÍBLICA' : 'BIBLE READING'}
                </p>
                <p className="text-foreground font-medium mt-0.5">
                  {data.anchor_verse}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[10px] px-2.5 py-1 rounded-md font-semibold uppercase">
                  📗 {data.category}
                </span>
              </div>
            </div>

            {/* Anotações label */}
            <div className="mt-auto pt-3 border-t border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                {lang === 'PT' ? 'ANOTAÇÕES' : lang === 'ES' ? 'ANOTACIONES' : 'NOTES'}
              </p>
              <div className="mt-2 space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-px bg-border/60" />
                ))}
              </div>
            </div>
          </div>

          {/* Right content — body text */}
          <div className="flex-1 p-5 sm:p-6 md:p-8">
            {/* Audio player inline */}
            {data.audio_url && (
              <div className="mb-6">
                <AudioPlayer src={data.audio_url} title={data.title} lang={lang} />
              </div>
            )}

            {/* Body text — editorial style with drop cap */}
            <div className="text-sm sm:text-[15px] text-foreground/90 leading-[1.85] whitespace-pre-line">
              {data.body_text.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={`${idx > 0 ? 'mt-4' : ''} ${idx === 0 ? 'first-letter:text-4xl first-letter:font-display first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-1.5 first-letter:mt-0.5 first-letter:leading-none' : ''}`}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Reflection question */}
            {data.reflection_question && (
              <div className="mt-6 rounded-xl bg-muted/50 border border-border p-4 sm:p-5">
                <div className="flex items-start gap-2.5">
                  <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary mb-1.5">
                      {labels.reflection[lang]}
                    </p>
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      {data.reflection_question}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Daily practice */}
            {data.daily_practice && (
              <div className="mt-5 rounded-xl bg-primary/5 border border-primary/20 p-4 sm:p-5">
                <div className="flex items-start gap-2.5">
                  <ListChecks className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary mb-1.5">
                      {labels.practice[lang]}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {data.daily_practice}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom action bar ── */}
        <div className="border-t border-border px-5 sm:px-8 py-4 flex items-center gap-2 flex-wrap bg-muted/20">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
          </button>
          {data.cover_image_url && (
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = data.cover_image_url!;
                a.target = '_blank';
                a.download = `devocional-${data.title.slice(0,20).replace(/\s+/g,'-')}.png`;
                a.click();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> {labels.saveImage[lang]}
            </button>
          )}
          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <WhatsAppIcon /> {labels.shareWa[lang]}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: data.title, text: `${data.title} — ${data.anchor_verse}` });
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> {labels.share[lang]}
          </button>
        </div>
      </div>

      {/* ═══ PERSONAL REFLECTION (below the card) ═══ */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <PenLine className="h-4 w-4 text-foreground" />
          <p className="text-sm font-bold text-foreground">
            {labels.personalReflection[lang]}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {labels.personalReflectionSub[lang]}
        </p>
        <textarea
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
          placeholder={labels.personalPlaceholder[lang]}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveNote}
            disabled={!personalNote.trim() || savingNote}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Send className="h-4 w-4" /> {labels.saveReflection[lang]}
          </button>
        </div>
      </div>
    </div>
  );

  // Desktop: side-by-side layout with previous devotionals sidebar
  if (!isMobile && user) {
    return (
      <div className="flex gap-6 items-start">
        {mainContent}
        <PreviousDevotionalsSidebar lang={lang} userId={user.id} />
      </div>
    );
  }

  return mainContent;
}
