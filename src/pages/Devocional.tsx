import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, ArrowLeft, Headphones, Calendar, MessageCircle,
  Play, Pause, Volume2, VolumeX, Share2, Copy, ListChecks,
  PenLine, Send, Download, Image as ImageIcon, Clock, Check
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
  content: string;
  cover_image_url?: string | null;
}

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  pageTitle: { PT: 'Palavra Viva', EN: 'Living Word', ES: 'Palabra Viva' },
  subtitle: { PT: 'Sua dose diária de inspiração bíblica, preparada com IA pastoral', EN: 'Your daily dose of biblical inspiration, crafted with pastoral AI', ES: 'Tu dosis diaria de inspiración bíblica, preparada con IA pastoral' },
  listenSection: { PT: 'ESCUTE A PALAVRA', EN: 'HEAR THE WORD', ES: 'ESCUCHA LA PALABRA' },
  coverSection: { PT: 'ARTE DO DIA', EN: "TODAY'S ART", ES: 'ARTE DEL DÍA' },
  coverSub: { PT: 'Baixe ou envie para sua comunidade', EN: 'Download or send to your community', ES: 'Descarga o envía a tu comunidad' },
  reflection: { PT: 'MEDITAÇÃO', EN: 'MEDITATION', ES: 'MEDITACIÓN' },
  practice: { PT: 'DESAFIO DO DIA', EN: "TODAY'S CHALLENGE", ES: 'DESAFÍO DEL DÍA' },
  copy: { PT: 'Copiar texto', EN: 'Copy text', ES: 'Copiar texto' },
  saveImage: { PT: 'Baixar arte', EN: 'Download art', ES: 'Descargar arte' },
  share: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  shareWa: { PT: 'WhatsApp', EN: 'WhatsApp', ES: 'WhatsApp' },
  continueChat: { PT: 'Aprofundar no Chat', EN: 'Go deeper in Chat', ES: 'Profundizar en el Chat' },
  personalReflection: { PT: 'Diário Espiritual', EN: 'Spiritual Journal', ES: 'Diario Espiritual' },
  personalReflectionSub: {
    PT: 'Registre aqui o que Deus falou ao seu coração hoje. Suas anotações ficam salvas na sua biblioteca.',
    EN: 'Write down what God spoke to your heart today. Your notes are saved in your library.',
    ES: 'Registra aquí lo que Dios habló a tu corazón hoy. Tus notas se guardan en tu biblioteca.',
  },
  personalPlaceholder: {
    PT: 'O que o Espírito destacou para você nesta leitura?',
    EN: 'What did the Spirit highlight for you in this reading?',
    ES: '¿Qué destacó el Espíritu para ti en esta lectura?',
  },
  saveReflection: { PT: 'Guardar anotação', EN: 'Save note', ES: 'Guardar nota' },
  saved: { PT: 'Anotação guardada!', EN: 'Note saved!', ES: '¡Nota guardada!' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  imageSaved: { PT: 'Arte salva!', EN: 'Art saved!', ES: '¡Arte guardada!' },
  error: { PT: 'Ops, não conseguimos carregar a palavra de hoje. Tente novamente.', EN: 'Oops, we couldn\'t load today\'s word. Please try again.', ES: 'Ups, no pudimos cargar la palabra de hoy. Inténtalo de nuevo.' },
  previousDevotionals: { PT: 'Histórico de Leituras', EN: 'Reading History', ES: 'Historial de Lecturas' },
  previousSub: { PT: 'Releia as palavras que marcaram sua semana', EN: 'Revisit the words that marked your week', ES: 'Relee las palabras que marcaron tu semana' },
  noPrevious: { PT: 'Suas leituras aparecerão aqui.', EN: 'Your readings will appear here.', ES: 'Tus lecturas aparecerán aquí.' },
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
  const progressRef = useRef<HTMLDivElement>(null);

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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * (duration || 1);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6 space-y-5">
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
        <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
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
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="w-full h-2 rounded-full bg-muted cursor-pointer relative group"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary shadow-md border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPct}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground font-medium tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={() => setMuted(!muted)}
          className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          onClick={togglePlay}
          className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95"
        >
          {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
        </button>
        <button
          onClick={cycleSpeed}
          className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm font-bold transition-all"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

/* ─── Audio Player Placeholder (no audio yet) ─── */
function AudioPlayerPlaceholder({ title, lang }: { title: string; lang: L }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Headphones className="h-5 w-5 text-primary/60" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary/60">
            {labels.listenSection[lang]}
          </p>
          <p className="text-sm font-medium text-foreground/70 leading-snug">{title}</p>
        </div>
      </div>

      {/* Disabled progress bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-muted" />
        <div className="flex justify-between text-[11px] text-muted-foreground/50 font-medium tabular-nums">
          <span>0:00</span>
          <span>0:00</span>
        </div>
      </div>

      {/* Disabled controls */}
      <div className="flex items-center justify-center gap-8">
        <div className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground/40">
          <Volume2 className="h-5 w-5" />
        </div>
        <div className="h-16 w-16 rounded-full bg-primary/20 text-primary-foreground/50 flex items-center justify-center shadow-sm">
          <Play className="h-7 w-7 ml-0.5" />
        </div>
        <div className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground/40 text-sm font-bold">
          1x
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/60 italic">
        {lang === 'PT' ? 'Áudio em breve disponível' : lang === 'ES' ? 'Audio disponible pronto' : 'Audio coming soon'}
      </p>
    </div>
  );
}

/* ─── WhatsApp SVG Icon ─── */
const WhatsAppIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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

  const [pastItems, setPastItems] = useState<PastDevotional[]>([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewingPast, setViewingPast] = useState<PastDevotional | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data: result, error: err } = await supabase.functions.invoke('get-devotional-today');
        if (err || !result) throw err;
        setData(result);

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
            title: result.title,
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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('materials')
        .select('id, title, type, passage, created_at, content, cover_image_url')
        .eq('user_id', user.id)
        .eq('type', 'devotional')
        .order('created_at', { ascending: false })
        .limit(20);
      setPastItems((data as any) || []);
      setPastLoading(false);
    };
    load();
  }, [user]);

  const handleSelectPast = useCallback((item: PastDevotional) => {
    if (activeItemId === item.id) {
      setTransitioning(true);
      setTimeout(() => {
        setActiveItemId(null);
        setViewingPast(null);
        setTransitioning(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setActiveItemId(item.id);
      setViewingPast(item);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  }, [activeItemId]);

  const handleBackToToday = () => {
    setTransitioning(true);
    setTimeout(() => {
      setActiveItemId(null);
      setViewingPast(null);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const handleCopy = () => {
    if (!data) return;
    const text = viewingPast
      ? `*${viewingPast.title}*\n\n${viewingPast.content}`
      : `*${data.title}*\n\n"${data.anchor_verse_text}"\n— ${data.anchor_verse}\n\n${data.body_text}\n\n💡 ${data.daily_practice || ''}\n\n💭 ${data.reflection_question}`;
    navigator.clipboard.writeText(text);
    toast.success(labels.copied[lang]);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const text = viewingPast
      ? `*${viewingPast.title}*\n\n${viewingPast.content.slice(0, 500)}...`
      : `*${data.title}*\n\n_"${data.anchor_verse_text}"_\n— ${data.anchor_verse}\n\n${data.body_text.slice(0, 500)}...\n\n💡 ${data.daily_practice || ''}\n\n💭 ${data.reflection_question}`;
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
    } catch { /* silent */ } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-muted-foreground">{labels.error[lang]}</p>
        </div>
      </div>
    );
  }

  const isViewingPast = !!viewingPast;
  const displayTitle = isViewingPast ? viewingPast.title : data.title;
  const displayBody = isViewingPast ? viewingPast.content : data.body_text;
  const displayVerse = isViewingPast ? (viewingPast.passage || '') : data.anchor_verse;
  const displayVerseText = isViewingPast ? '' : data.anchor_verse_text;
  const displayCategory = isViewingPast ? '' : data.category;
  const displayDate = isViewingPast ? viewingPast.created_at : data.scheduled_date;
  const displayCover = isViewingPast ? viewingPast.cover_image_url : data.cover_image_url;

  const renderBodyText = (text: string) => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    if (paragraphs.length === 0) {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length <= 1) {
        return [<p key={0} className="text-sm sm:text-[15px] text-foreground/90 leading-[1.95] first-letter:text-4xl first-letter:font-display first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:mt-0.5 first-letter:leading-none">{text.trim()}</p>];
      }
      return lines.map((line, idx) => (
        <p key={idx} className={`text-sm sm:text-[15px] text-foreground/90 leading-[1.95] ${idx === 0 ? 'first-letter:text-4xl first-letter:font-display first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:mt-0.5 first-letter:leading-none' : 'mt-5'}`}>
          {line.trim()}
        </p>
      ));
    }

    return paragraphs.map((paragraph, idx) => {
      const trimmed = paragraph.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-display font-bold text-primary mt-8 mb-3 flex items-center gap-2.5">
            <span className="w-1 h-5 bg-primary/40 rounded-full shrink-0" />
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-display font-bold text-foreground mt-10 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-xl font-display font-black text-foreground mt-10 mb-4 uppercase tracking-wide">
            {trimmed.replace('# ', '')}
          </h2>
        );
      }

      const isPrayer = /^(Senhor|Pai|Deus|Lord|Father|God|Señor|Padre),?\s/i.test(trimmed);
      if (isPrayer) {
        return (
          <div key={idx} className="mt-8 rounded-xl bg-primary/5 border border-primary/15 p-5">
            <p className="text-sm sm:text-[15px] italic text-foreground/85 leading-[1.95]">
              {trimmed}
            </p>
          </div>
        );
      }

      return (
        <p
          key={idx}
          className={`text-sm sm:text-[15px] text-foreground/90 leading-[1.95] ${
            idx === 0
              ? 'first-letter:text-4xl first-letter:font-display first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:mt-0.5 first-letter:leading-none'
              : 'mt-5'
          }`}
        >
          {trimmed}
        </p>
      );
    });
  };

  /* ─── Sidebar (right) ─── */
  const sidebar = user && (
    <div className="w-[300px] shrink-0 hidden lg:block">
      <div className="sticky top-6 rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {labels.previousDevotionals[lang]}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {labels.previousSub[lang]}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(100vh-200px)]">
          <div className="p-1.5">
            {pastLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pastItems.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {labels.noPrevious[lang]}
              </p>
            ) : (
              pastItems.map((item) => {
                const isActive = activeItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPast(item)}
                    className={`w-full flex gap-3 p-2.5 rounded-lg transition-colors text-left group ${
                      isActive
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    {item.cover_image_url ? (
                      <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium leading-snug line-clamp-2 transition-colors ${
                        isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {item.passage && (
                            <span className="truncate">{item.passage}</span>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatShortDate(item.created_at, lang)}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  /* ─── Main content ─── */
  const mainContent = (
    <div className="flex-1 min-w-0 pb-10">
      {/* Page header */}
      {!isViewingPast && (
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">{labels.pageTitle[lang]}</h1>
            <p className="text-xs text-muted-foreground">{labels.subtitle[lang]}</p>
          </div>
        </div>
      )}

      {isViewingPast && (
        <button
          onClick={handleBackToToday}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {lang === 'PT' ? 'Voltar ao devocional de hoje' : lang === 'ES' ? 'Volver al devocional de hoy' : 'Back to today\'s devotional'}
        </button>
      )}

      {/* ═══ EDITORIAL CARD ═══ */}
      <div className={`rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all duration-200 ${transitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

        {/* ── 1. DATE BAR ── */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3 border-b border-border bg-muted/30">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {formatDate(isViewingPast ? displayDate.slice(0, 10) : data.scheduled_date, lang)}
          </span>
          {displayCategory && (
            <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[10px] px-3 py-1 rounded-full font-semibold">
              📗 {displayCategory}
            </span>
          )}
        </div>

        {/* ── 2. TITLE ── */}
        <div className="px-5 sm:px-8 pt-6 pb-2">
          <h1 className="text-xl sm:text-2xl font-display font-black text-foreground leading-tight">
            {displayTitle}
          </h1>
        </div>

        {/* ── 3. VERSE QUOTE ── */}
        {!isViewingPast && displayVerseText && (
          <div className="mx-5 sm:mx-8 mt-4 rounded-xl bg-primary/5 border border-primary/15 p-5">
            <div className="flex gap-3">
              <span className="text-3xl text-primary/40 font-display font-black leading-none shrink-0 select-none">&ldquo;</span>
              <div>
                <blockquote className="text-sm sm:text-base italic text-foreground/90 leading-relaxed">
                  {displayVerseText}
                </blockquote>
                <p className="text-xs font-bold text-primary mt-2.5">&mdash; {displayVerse}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. AUDIO PLAYER ── */}
        {!isViewingPast && (
          <div className="mx-5 sm:mx-8 mt-5">
            {data.audio_url ? (
              <AudioPlayer src={data.audio_url} title={data.title} lang={lang} />
            ) : (
              <AudioPlayerPlaceholder title={data.title} lang={lang} />
            )}
          </div>
        )}

        {/* ── 5. COVER IMAGE + save/share ── */}
        {displayCover && (
          <div className="mx-5 sm:mx-8 mt-5 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary">{labels.coverSection[lang]}</p>
                <p className="text-xs text-muted-foreground">{labels.coverSub[lang]}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative rounded-xl overflow-hidden shadow-lg max-w-xs w-full aspect-[3/4]">
                <img src={displayCover} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 55%, transparent 70%)' }} />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  {displayCategory && (
                    <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider">
                      📗 {displayCategory}
                    </span>
                  )}
                  <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Living Word</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
                  <h3 className="text-white text-lg font-display font-bold leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{displayTitle}</h3>
                  {displayVerse && (
                    <p className="text-white/80 text-xs italic leading-relaxed line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                      &ldquo;{displayVerseText || displayVerse}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = displayCover!;
                  a.target = '_blank';
                  a.download = `devocional-${displayTitle.slice(0, 20).replace(/\s+/g, '-')}.png`;
                  a.click();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
              >
                <Download className="h-4 w-4" /> {labels.saveImage[lang]}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) navigator.share({ title: displayTitle, url: displayCover! });
                  else { navigator.clipboard.writeText(displayCover!); toast.success(labels.copied[lang]); }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
              >
                <Share2 className="h-4 w-4" /> {labels.share[lang]}
              </button>
              <button
                onClick={() => {
                  const text = `*${displayTitle}*\n📖 ${displayVerse}\n\n${displayCover}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <WhatsAppIcon /> {labels.shareWa[lang]}
              </button>
            </div>
          </div>
        )}

        {/* ── 6. REFLEXÃO ── */}
        <div className="px-5 sm:px-8 pt-8 pb-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary">
              {labels.reflection[lang]}
            </h2>
          </div>

          <div className="space-y-0">
            {renderBodyText(displayBody)}
          </div>
        </div>

        {/* ── 7. PRÁTICA DO DIA ── */}
        {!isViewingPast && data.daily_practice && (
          <div className="mx-5 sm:mx-8 mb-5 rounded-xl bg-primary/5 border border-primary/20 p-5">
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

        {/* ── 8. ACTION BAR ── */}
        <div className="border-t border-border px-5 sm:px-8 py-4 flex items-center gap-2 flex-wrap bg-muted/20">
          <button onClick={handleCopy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors">
            <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
          </button>
          <button onClick={handleWhatsApp} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
            <WhatsAppIcon /> {labels.shareWa[lang]}
          </button>
          <button
            onClick={() => { if (navigator.share) navigator.share({ title: displayTitle, text: `${displayTitle} — ${displayVerse}` }); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> {labels.share[lang]}
          </button>
          <Link
            to="/mente-chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> {labels.continueChat[lang]}
          </Link>
        </div>
      </div>

      {/* Personal reflection */}
      {!isViewingPast && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <PenLine className="h-4 w-4 text-foreground" />
            <p className="text-sm font-bold text-foreground">{labels.personalReflection[lang]}</p>
          </div>
          <p className="text-xs text-muted-foreground">{labels.personalReflectionSub[lang]}</p>
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
      )}

      {/* Mobile: past devotionals list */}
      {isMobile && user && (
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">{labels.previousDevotionals[lang]}</p>
            </div>
          </div>
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {pastLoading ? (
              <div className="space-y-2 p-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : pastItems.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">{labels.noPrevious[lang]}</p>
            ) : (
              pastItems.map(item => {
                const isActive = activeItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPast(item)}
                    className={`w-full flex gap-3 p-2.5 rounded-lg transition-colors text-left ${
                      isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    {item.cover_image_url ? (
                      <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-primary/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium leading-snug line-clamp-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{formatShortDate(item.created_at, lang)}</span>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!isMobile && user) {
    return (
      <div className="flex gap-5 items-start w-full">
        {mainContent}
        {sidebar}
      </div>
    );
  }

  return mainContent;
}
