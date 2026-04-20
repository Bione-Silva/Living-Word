import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { safeInvoke } from '@/lib/safe-invoke';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  BookOpen, Play, Pause, Download, Link as LinkIcon, MessageCircle, ChevronRight, Bookmark, FileText
} from 'lucide-react';
import { openWhatsAppShare } from '@/lib/whatsapp';

type L = 'PT' | 'EN' | 'ES';

interface DevotionalData {
  id: string;
  title: string;
  category: string;
  anchor_verse: string;
  anchor_verse_text: string;
  body_text: string;
  audio_url?: string;
  audio_url_nova?: string | null;
  audio_url_alloy?: string | null;
  audio_url_onyx?: string | null;
  audio_duration_seconds?: number;
  cover_image_url?: string | null;
  scheduled_date: string;
}

const L10N = {
  label: { PT: 'DEVOCIONAL DIÁRIO', EN: 'DAILY DEVOTIONAL', ES: 'DEVOCIONAL DIARIO' },
  storyTag: { PT: 'FORMATO STORY (9:16)', EN: 'STORY FORMAT (9:16)', ES: 'FORMATO STORY (9:16)' },
  listen: { PT: 'Ouvir devocional', EN: 'Listen devotional', ES: 'Escuchar devocional' },
  pause: { PT: 'Pausar', EN: 'Pause', ES: 'Pausar' },
  whatsapp: { PT: 'Enviar no WhatsApp', EN: 'Send on WhatsApp', ES: 'Enviar en WhatsApp' },
  read: { PT: 'Ler em texto', EN: 'Read text', ES: 'Leer en texto' },
  download: { PT: 'Baixar arte', EN: 'Download art', ES: 'Descargar arte' },
  copy: { PT: 'Copiar link', EN: 'Copy link', ES: 'Copiar enlace' },
  copied: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  copyTitle: { PT: 'Ouça a Palavra de hoje e compartilhe esperança com mais pessoas.', EN: "Listen to today's Word and share hope with more people.", ES: 'Escucha la Palabra de hoy y comparte esperanza con más personas.' },
  audioPrep: { PT: 'Áudio em preparação', EN: 'Audio in preparation', ES: 'Audio en preparación' },
  error: { PT: 'Não conseguimos carregar a palavra de hoje.', EN: "We couldn't load today's word.", ES: 'No pudimos cargar la palabra de hoy.' },
} satisfies Record<string, Record<L, string>>;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function DevotionalHeroCard() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DevotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: result, unauthorized, error: err } = await safeInvoke<DevotionalData>('get-devotional-today');
      if (unauthorized) {
        setData(null);
        setLoading(false);
        return;
      }
      if (err || !result) setError(true);
      else setData(result);
      setLoading(false);
    })();
  }, [user]);

  const audioSrc =
    data?.audio_url ||
    data?.audio_url_nova ||
    data?.audio_url_alloy ||
    data?.audio_url_onyx ||
    null;

  const togglePlay = () => {
    if (!audioSrc) {
      toast.info(L10N.audioPrep[lang]);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) setProgress(audioRef.current.currentTime);
      });
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {
        toast.error(lang === 'PT' ? 'Não foi possível reproduzir' : 'Cannot play audio');
      });
    }
  };

  const link = `${window.location.origin}/devocional`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success(L10N.copied[lang]);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const txt = `${data.title}\n\n"${data.anchor_verse_text}"\n— ${data.anchor_verse}\n\n${link}`;
    openWhatsAppShare(txt);
  };

  const handleRead = () => {
    navigate('/devocional');
  };

  const handleDownload = () => {
    toast.info(lang === 'PT' ? 'Abrindo gerador de arte...' : lang === 'EN' ? 'Opening art generator...' : 'Abriendo generador de arte...');
    navigate('/devocional?share=1');
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="grid sm:grid-cols-[1fr_180px] gap-5">
          <div className="space-y-3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <Skeleton className="aspect-[9/16] rounded-2xl w-full" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">{L10N.error[lang]}</p>
      </div>
    );
  }

  const duration = data.audio_duration_seconds || 128;
  const cover = data.cover_image_url;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col h-full">
      {/* Section label */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary inline-flex items-center gap-1.5">
          <span className="text-amber-500">☀</span> {L10N.label[lang]}
        </p>
        <Link to="/devocional" aria-label="Salvar" className="text-muted-foreground hover:text-primary transition-colors">
          <Bookmark className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] md:grid-cols-[1fr_150px] xl:grid-cols-[1fr_170px] gap-4 sm:gap-4 lg:gap-5 flex-1 min-h-0">
        {/* LEFT: text + audio + actions — no mobile fica DEPOIS da arte */}
        <div className="min-w-0 space-y-3.5 flex flex-col order-2 sm:order-1">
          <h2 className="font-display text-xl sm:text-[1.4rem] lg:text-[1.6rem] xl:text-[1.75rem] font-bold text-foreground leading-tight">
            {data.title}
          </h2>
          <p className="text-sm font-semibold text-primary">{data.anchor_verse}</p>

          <blockquote className="text-sm italic text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3">
            {data.anchor_verse_text}
          </blockquote>

          {/* Audio player */}
          <button
            onClick={togglePlay}
            className="w-full rounded-xl bg-background/60 border border-border hover:border-primary/40 transition-colors flex items-center gap-3 px-3.5 py-3 text-left group"
          >
            <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-foreground truncate">
                {playing ? L10N.pause[lang] : L10N.listen[lang]}
              </span>
              <span className="block h-1 mt-1.5 rounded-full bg-muted overflow-hidden">
                <span
                  className="block h-full bg-primary transition-all"
                  style={{ width: `${duration ? Math.min((progress / duration) * 100, 100) : 0}%` }}
                />
              </span>
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {fmt(playing ? progress : duration)}
            </span>
          </button>

          {/* Action grid — 1 col em telas estreitas/tablet onde o card divide espaço, 2 col só quando há largura suficiente */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors px-3 min-w-0"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{L10N.whatsapp[lang]}</span>
            </button>
            <button
              onClick={handleRead}
              className="h-10 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors px-3 min-w-0"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{L10N.read[lang]}</span>
            </button>
            <button
              onClick={handleDownload}
              className="h-10 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors px-3 min-w-0"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{L10N.download[lang]}</span>
            </button>
            <button
              onClick={handleCopy}
              className="h-10 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors px-3 min-w-0"
            >
              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{L10N.copy[lang]}</span>
            </button>
          </div>

          {/* Support copy — esconde em mobile pra liberar espaço */}
          <div className="hidden sm:flex rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 items-start gap-2 mt-auto">
            <MessageCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-foreground/70 leading-snug">
              {L10N.copyTitle[lang]}
            </p>
          </div>
        </div>

        {/* RIGHT: Story 9:16 art preview — largura controlada para nunca explodir */}
        <Link
          to="/devocional?share=1"
          className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 group shrink-0 w-[140px] sm:w-full mx-auto sm:mx-0 self-start"
        >
          {cover && (
            <img
              src={cover}
              alt={data.title}
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />

          <span className="absolute top-2 left-2 text-[8px] font-bold tracking-[0.15em] uppercase bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full">
            {L10N.storyTag[lang]}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
            <p
              className="font-display text-[11px] leading-snug font-semibold mb-1 line-clamp-4 drop-shadow"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              "{data.anchor_verse_text}"
            </p>
            <p className="text-[9px] font-bold tracking-[0.12em] uppercase opacity-90">
              {data.anchor_verse}
            </p>
          </div>

          <div className="absolute bottom-1.5 right-1.5 text-[8px] text-white/60 font-medium">
            Living Word
          </div>

          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
        </Link>
      </div>
    </section>
  );
}
