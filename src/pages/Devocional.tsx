import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen, ArrowLeft, Calendar, MessageCircle,
  Play, Pause, Volume2, VolumeX, Share2, Copy, ListChecks,
  PenLine, Send, Download, Image as ImageIcon, Clock, Check,
  Mic, User, UserRound
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
  audio_url_nova?: string;
  audio_url_alloy?: string;
  audio_url_onyx?: string;
  audio_duration_seconds?: number;
  reflection_question: string;
  scheduled_date: string;
  cover_image_url?: string | null;
  closing_prayer?: string;
}

interface PastDevotional {
  id: string;
  title: string;
  anchor_verse: string;
  scheduled_date: string;
  body_text: string;
  cover_image_url?: string | null;
  audio_url_nova?: string | null;
  audio_url_alloy?: string | null;
  audio_url_onyx?: string | null;
}

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  pageTitle: { PT: 'Café com a Palavra Viva de Deus', EN: 'Coffee with the Living Word of God', ES: 'Café con la Palabra Viva de Dios' },
  subtitle: { PT: 'Sua dose diária de inspiração bíblica, preparada com IA pastoral', EN: 'Your daily dose of biblical inspiration, crafted with pastoral AI', ES: 'Tu dosis diaria de inspiración bíblica, preparada con IA pastoral' },
  listenLabel: { PT: 'ESCUTE A PALAVRA', EN: 'HEAR THE WORD', ES: 'ESCUCHA LA PALABRA' },
  coverSection: { PT: 'ARTE DO DIA', EN: "TODAY'S ART", ES: 'ARTE DEL DÍA' },
  coverSub: { PT: 'Baixe ou envie para sua comunidade', EN: 'Download or send to your community', ES: 'Descarga o envía a tu comunidad' },
  meditation: { PT: 'MEDITAÇÃO', EN: 'MEDITATION', ES: 'MEDITACIÓN' },
  challenge: { PT: 'DESAFIO DO DIA', EN: "TODAY'S CHALLENGE", ES: 'DESAFÍO DEL DÍA' },
  prayer: { PT: 'ORAÇÃO', EN: 'PRAYER', ES: 'ORACIÓN' },
  copy: { PT: 'Copiar texto', EN: 'Copy text', ES: 'Copiar texto' },
  saveImage: { PT: 'Baixar arte', EN: 'Download art', ES: 'Descargar arte' },
  share: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  shareWa: { PT: 'WhatsApp', EN: 'WhatsApp', ES: 'WhatsApp' },
  deepenChat: { PT: 'Continuar no Chat', EN: 'Continue in Chat', ES: 'Continuar en el Chat' },
  journal: { PT: '✍️ Minha Reflexão Pessoal', EN: '✍️ My Personal Reflection', ES: '✍️ Mi Reflexión Personal' },
  journalSub: {
    PT: 'Escreva suas reflexões, orações ou pensamentos sobre o devocional de hoje...',
    EN: 'Write your reflections, prayers or thoughts about today\'s devotional...',
    ES: 'Escribe tus reflexiones, oraciones o pensamientos sobre el devocional de hoy...',
  },
  journalPlaceholder: {
    PT: 'Escreva suas reflexões pessoais...',
    EN: 'Write your personal reflections...',
    ES: 'Escribe tus reflexiones personales...',
  },
  saveNote: { PT: 'Salvar Reflexão', EN: 'Save Reflection', ES: 'Guardar Reflexión' },
  saved: { PT: 'Reflexão salva!', EN: 'Reflection saved!', ES: '¡Reflexión guardada!' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  error: { PT: 'Ops, não conseguimos carregar a palavra de hoje. Tente novamente.', EN: "Oops, we couldn't load today's word. Please try again.", ES: 'Ups, no pudimos cargar la palabra de hoy. Inténtalo de nuevo.' },
  history: { PT: 'Histórico de Leituras', EN: 'Reading History', ES: 'Historial de Lecturas' },
  historySub: { PT: 'Releia as palavras que marcaram sua semana', EN: 'Revisit the words that marked your week', ES: 'Relee las palabras que marcaron tu semana' },
  noHistory: { PT: 'Suas leituras aparecerão aqui.', EN: 'Your readings will appear here.', ES: 'Tus lecturas aparecerán aquí.' },
  voiceFemale: { PT: 'Feminina', EN: 'Female', ES: 'Femenina' },
  voiceSoftMale: { PT: 'Masculina Suave', EN: 'Soft Male', ES: 'Masculina Suave' },
  voiceDeepMale: { PT: 'Masculina Forte', EN: 'Deep Male', ES: 'Masculina Fuerte' },
  audioSoon: { PT: 'Versão em áudio chegando em breve', EN: 'Audio version arriving soon', ES: 'Versión en audio llegando pronto' },
  backToday: { PT: 'Voltar à leitura de hoje', EN: "Back to today's reading", ES: 'Volver a la lectura de hoy' },
} satisfies Record<string, Record<L, string>>;

function formatDateFull(dateStr: string, lang: L): string {
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

/* ─── Animated Sound Waves ─── */
function SoundWaves({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${active ? 'animate-sound-wave' : 'h-1 opacity-40'}`}
          style={{
            animationDelay: active ? `${i * 0.12}s` : undefined,
            height: active ? undefined : '4px',
            backgroundColor: 'hsl(38, 52%, 58%)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Voice type ─── */
type VoiceKey = 'nova' | 'alloy' | 'onyx';

/* ─── Audio Player with Voice Selector ─── */
function AudioPlayer({ data, lang }: { data: DevotionalData; lang: L }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<VoiceKey>('nova');

  const voiceOptions: { key: VoiceKey; label: string; icon: React.ReactNode }[] = [
    { key: 'nova', label: labels.voiceFemale[lang], icon: <UserRound className="h-3.5 w-3.5" /> },
    { key: 'alloy', label: labels.voiceSoftMale[lang], icon: <User className="h-3.5 w-3.5" /> },
    { key: 'onyx', label: labels.voiceDeepMale[lang], icon: <Mic className="h-3.5 w-3.5" /> },
  ];

  const audioSrc = voice === 'alloy' ? (data.audio_url_alloy || data.audio_url)
    : voice === 'onyx' ? (data.audio_url_onyx || data.audio_url)
    : (data.audio_url_nova || data.audio_url);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
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

  const handleVoiceChange = (v: VoiceKey) => {
    const wasPlaying = playing;
    if (audioRef.current) audioRef.current.pause();
    setPlaying(false);
    setVoice(v);
    setCurrentTime(0);
    setTimeout(() => {
      if (wasPlaying && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setPlaying(true);
      }
    }, 100);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioSrc) return <AudioPlaceholder title={data.title} lang={lang} />;

  return (
    <div className="rounded-2xl border p-5 sm:p-6 space-y-5" style={{ borderColor: 'hsl(38, 40%, 80%)', background: 'linear-gradient(135deg, hsl(38, 40%, 96%), hsl(36, 30%, 94%))' }}>
      <audio
        ref={audioRef}
        src={audioSrc}
        muted={muted}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
      />

      {/* Header with waves */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(38, 52%, 58%, 0.15)' }}>
            <SoundWaves active={playing} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(38, 52%, 48%)' }}>
              {labels.listenLabel[lang]}
            </p>
            <p className="text-sm font-medium leading-snug line-clamp-1" style={{ color: 'hsl(24, 30%, 15%)' }}>{data.title}</p>
          </div>
        </div>
      </div>

      {/* Voice Selector */}
      <div className="flex items-center gap-2">
        {voiceOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => handleVoiceChange(opt.key)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
            style={voice === opt.key
              ? { backgroundColor: 'hsl(38, 52%, 48%)', color: '#fff', boxShadow: '0 2px 8px hsl(38, 52%, 48%, 0.3)' }
              : { backgroundColor: 'hsl(36, 20%, 90%)', color: 'hsl(24, 18%, 45%)' }
            }
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="w-full h-2 rounded-full cursor-pointer relative group"
          style={{ backgroundColor: 'hsl(36, 20%, 88%)' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: 'hsl(38, 52%, 48%)' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full shadow-md border-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPct}% - 8px)`, backgroundColor: 'hsl(38, 52%, 48%)', borderColor: '#fff' }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-medium tabular-nums" style={{ color: 'hsl(24, 18%, 50%)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={() => setMuted(!muted)}
          className="h-10 w-10 rounded-full flex items-center justify-center transition-all hover:bg-accent/10"
          style={{ color: 'hsl(24, 18%, 50%)' }}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          onClick={togglePlay}
          className="h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: 'hsl(38, 52%, 48%)', color: '#fff', boxShadow: '0 8px 24px hsl(38, 52%, 48%, 0.35)' }}
        >
          {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
        </button>
        <button
          onClick={cycleSpeed}
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:bg-accent/10"
          style={{ color: 'hsl(24, 18%, 50%)' }}
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

/* ─── Audio Placeholder (no audio yet) ─── */
function AudioPlaceholder({ title, lang }: { title: string; lang: L }) {
  return (
    <div className="rounded-2xl border p-5 sm:p-6 space-y-5" style={{ borderColor: 'hsl(38, 40%, 85%)', background: 'hsl(38, 30%, 96%)' }}>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(38, 52%, 58%, 0.12)' }}>
          <SoundWaves active={false} />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'hsl(38, 40%, 60%)' }}>
            {labels.listenLabel[lang]}
          </p>
          <p className="text-sm font-medium leading-snug" style={{ color: 'hsl(24, 30%, 15%)' }}>{title}</p>
        </div>
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'hsl(38, 30%, 90%)' }} />
      <div className="flex items-center justify-center gap-8">
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ color: 'hsl(38, 40%, 70%)' }}>
          <Volume2 className="h-5 w-5" />
        </div>
        <div className="h-16 w-16 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: 'hsl(38, 40%, 85%)', color: 'hsl(38, 40%, 55%)' }}>
          <Play className="h-7 w-7 ml-0.5" />
        </div>
        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ color: 'hsl(38, 40%, 65%)' }}>
          1x
        </div>
      </div>
      <p className="text-center text-[11px] italic" style={{ color: 'hsl(38, 30%, 60%)' }}>
        {labels.audioSoon[lang]}
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

/* ─── BibleRichText: intercepts [Text](/biblia/...) links ─── */
function BibleRichText({ text, className }: { text: string; className?: string }) {
  // Parse inline **bold**, *italic*, and [text](/biblia/...) links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold" style={{ color: 'hsl(24, 30%, 12%)' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic" style={{ color: 'hsl(24, 30%, 20%, 0.85)' }}>{part.slice(1, -1)}</em>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          if (href.startsWith('/biblia')) {
            return <Link key={i} to={href} className="underline decoration-1 underline-offset-2 font-medium transition-colors hover:opacity-80" style={{ color: 'hsl(38, 52%, 42%)' }}>{label}</Link>;
          }
          return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-2 font-medium transition-colors hover:opacity-80" style={{ color: 'hsl(38, 52%, 42%)' }}>{label}</a>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
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
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);
  const [showAddReflection, setShowAddReflection] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        // Edge function now handles caching & persistence — no client-side insert needed
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single();
      const userLang = profile?.language || lang;
      const { data } = await supabase
        .from('devotionals')
        .select('id, title, anchor_verse, scheduled_date, body_text, cover_image_url, audio_url_nova, audio_url_alloy, audio_url_onyx')
        .eq('language', userLang)
        .order('scheduled_date', { ascending: false })
        .limit(30);
      setPastItems((data as PastDevotional[]) || []);
      setPastLoading(false);
    };
    load();
  }, [user, lang]);

  // Load existing note for today's devotional
  useEffect(() => {
    if (!user || !data) return;
    const loadNote = async () => {
      const { data: existing } = await supabase
        .from('materials')
        .select('id, content, notes')
        .eq('user_id', user.id)
        .eq('type', 'devotional')
        .gte('created_at', data.scheduled_date + 'T00:00:00')
        .lte('created_at', data.scheduled_date + 'T23:59:59')
        .limit(1);
      if (existing && existing.length > 0 && existing[0].notes) {
        setPersonalNote(existing[0].notes);
      }
      setNoteLoaded(true);
    };
    loadNote();
  }, [user, data]);

  // Auto-save note with debounce
  const autoSaveNote = useCallback(async (noteText: string) => {
    if (!user || !data || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const { data: existing } = await supabase
        .from('materials')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'devotional')
        .gte('created_at', data.scheduled_date + 'T00:00:00')
        .lte('created_at', data.scheduled_date + 'T23:59:59')
        .limit(1);
      if (existing && existing.length > 0) {
        await supabase.from('materials').update({ notes: noteText }).eq('id', existing[0].id);
      }
      const now = new Date();
      setNoteSavedAt(now.toLocaleTimeString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch { /* silent */ } finally {
      setSavingNote(false);
    }
  }, [user, data, lang]);

  const handleNoteChange = (value: string) => {
    setPersonalNote(value);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => autoSaveNote(value), 1500);
  };

  const handleSelectPast = useCallback((item: PastDevotional) => {
    if (activeItemId === item.id) {
      setTransitioning(true);
      setTimeout(() => { setActiveItemId(null); setViewingPast(null); setTransitioning(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 200);
      return;
    }
    setTransitioning(true);
    setTimeout(() => { setActiveItemId(item.id); setViewingPast(item); setTransitioning(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 200);
  }, [activeItemId]);

  const handleBackToToday = () => {
    setTransitioning(true);
    setTimeout(() => { setActiveItemId(null); setViewingPast(null); setTransitioning(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 200);
  };

  const handleCopy = () => {
    if (!data) return;
    const text = viewingPast
      ? `*${viewingPast.title}*\n\n${viewingPast.body_text}`
      : `*${data.title}*\n\n"${data.anchor_verse_text}"\n— ${data.anchor_verse}\n\n${data.body_text}\n\n💡 ${data.daily_practice || ''}\n\n💭 ${data.reflection_question}`;
    navigator.clipboard.writeText(text);
    toast.success(labels.copied[lang]);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const text = viewingPast
      ? `*${viewingPast.title}*\n\n${viewingPast.body_text.slice(0, 500)}...`
      : `*${data.title}*\n\n_"${data.anchor_verse_text}"_\n— ${data.anchor_verse}\n\n${data.body_text.slice(0, 500)}...\n\n💡 ${data.daily_practice || ''}\n\n💭 ${data.reflection_question}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveNote = async () => {
    if (!personalNote.trim() || !user || !data) return;
    await autoSaveNote(personalNote);
    setNoteSavedSuccess(true);
    setShowAddReflection(false);
    toast.success(labels.saved[lang]);
  };

  const handleAddMoreReflection = () => {
    setShowAddReflection(true);
    setNoteSavedSuccess(false);
  };

  /* ─── Styles ─── */
  const colors = {
    bg: '#F5F0E8',
    text: '#2C2416',
    textMuted: 'hsl(24, 18%, 45%)',
    gold: '#C9A84C',
    goldLight: 'hsl(38, 52%, 92%)',
    goldMuted: 'hsl(38, 40%, 75%)',
    cardBg: '#FFFDF9',
    verseBg: '#FEFCF5',
    prayerBg: '#F0EBE1',
    border: 'hsl(30, 20%, 85%)',
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-5 py-4" style={{ backgroundColor: colors.bg }}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-3xl mx-auto py-8" style={{ backgroundColor: colors.bg }}>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 mb-6" style={{ color: colors.textMuted }}>
          <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
        </Link>
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
          <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p style={{ color: colors.textMuted }}>{labels.error[lang]}</p>
        </div>
      </div>
    );
  }

  const isViewingPast = !!viewingPast;
  const displayTitle = isViewingPast ? viewingPast.title : data.title;
  const displayBody = isViewingPast ? viewingPast.body_text : data.body_text;
  const displayVerse = isViewingPast ? (viewingPast.anchor_verse || '') : data.anchor_verse;
  const displayVerseText = isViewingPast ? '' : data.anchor_verse_text;
  const displayCategory = isViewingPast ? '' : data.category;
  const displayDate = isViewingPast ? viewingPast.scheduled_date : data.scheduled_date;
  const displayCover = isViewingPast ? viewingPast.cover_image_url : data.cover_image_url;

  /* ─── Body text renderer ─── */
  const renderBodyText = (text: string) => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    if (paragraphs.length === 0) return [<p key={0} className="font-serif text-[1.1rem] leading-[1.9]" style={{ color: colors.text }}>{text.trim()}</p>];

    return paragraphs.map((paragraph, idx) => {
      const trimmed = paragraph.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-playfair font-bold mt-8 mb-3 flex items-center gap-2.5" style={{ color: colors.gold }}>
            <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: colors.goldMuted }} />
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-playfair font-bold mt-10 mb-4" style={{ color: colors.text }}>
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      // Detect "Oração:" prefix paragraphs or prayer-like starts
      const isOracaoLabel = /^Ora[çc][ãa]o:/i.test(trimmed);
      const isPrayer = isOracaoLabel || /^(Senhor|Pai|Deus|Lord|Father|God|Señor|Padre),?\s/i.test(trimmed);
      if (isPrayer) {
        const prayerText = isOracaoLabel ? trimmed.replace(/^Ora[çc][ãa]o:\s*/i, '') : trimmed;
        return (
          <div key={idx} className="mt-8 rounded-xl p-5" style={{ backgroundColor: colors.prayerBg }}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🙏</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: colors.gold }}>
                  {labels.prayer[lang]}
                </p>
                <p className="font-serif text-[1.05rem] italic leading-[1.9]" style={{ color: 'hsl(24, 30%, 20%, 0.85)' }}>
                  <BibleRichText text={prayerText} />
                </p>
              </div>
            </div>
          </div>
        );
      }

      const showDivider = idx > 0 && idx % 3 === 0 && idx < paragraphs.length - 1;

      return (
        <div key={idx}>
          {showDivider && (
            <div className="flex items-center justify-center gap-3 my-6">
              <span className="h-px w-8" style={{ backgroundColor: colors.goldMuted + '40' }} />
              <span className="text-xs" style={{ color: colors.goldMuted + '60' }}>✦</span>
              <span className="h-px w-8" style={{ backgroundColor: colors.goldMuted + '40' }} />
            </div>
          )}
          <p
            className={`font-serif text-[1.05rem] sm:text-[1.1rem] leading-[1.9] ${
              idx === 0
                ? 'first-letter:text-4xl first-letter:font-playfair first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-0.5 first-letter:leading-none'
                : 'mt-5'
            }`}
            style={{ color: 'hsl(24, 30%, 18%, 0.92)' }}
          >
            <BibleRichText text={trimmed} />
          </p>
        </div>
      );
    });
  };

  /* ─── Closing prayer section (explicit field) ─── */
  const closingPrayerSection = !isViewingPast && data.closing_prayer && (
    <div className="mx-5 sm:mx-8 mb-5 rounded-xl p-5" style={{ backgroundColor: colors.prayerBg }}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">🙏</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: colors.gold }}>
            {labels.prayer[lang]}
          </p>
          <p className="font-serif text-[1.05rem] italic leading-[1.9]" style={{ color: 'hsl(24, 30%, 20%, 0.85)' }}>
            <BibleRichText text={data.closing_prayer} />
          </p>
        </div>
      </div>
    </div>
  );

  /* ─── Sidebar (right) ─── */
  const sidebar = user && (
    <div className="w-[300px] shrink-0 hidden lg:block">
      <div className="sticky top-6 rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.goldLight }}>
              <Clock className="h-4 w-4" style={{ color: colors.gold }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: colors.text }}>{labels.history[lang]}</p>
              <p className="text-[10px]" style={{ color: colors.textMuted }}>{labels.historySub[lang]}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(100vh-200px)]">
          <div className="p-1.5">
            {pastLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map(i => (
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
              <p className="text-xs p-3 text-center" style={{ color: colors.textMuted }}>{labels.noHistory[lang]}</p>
            ) : (
              pastItems.map(item => {
                const isActive = activeItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPast(item)}
                    className="w-full flex gap-3 p-2.5 rounded-lg transition-colors text-left group border"
                    style={{
                      backgroundColor: isActive ? colors.goldLight : 'transparent',
                      borderColor: isActive ? colors.goldMuted : 'transparent',
                    }}
                  >
                    {item.cover_image_url ? (
                      <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: colors.goldLight }}>
                        <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: colors.goldLight }}>
                        <BookOpen className="h-5 w-5" style={{ color: colors.goldMuted }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug line-clamp-2 transition-colors" style={{ color: isActive ? colors.gold : colors.text }}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.anchor_verse && <span className="text-[10px] truncate" style={{ color: colors.textMuted }}>{item.anchor_verse}</span>}
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>{formatShortDate(item.scheduled_date, lang)}</span>
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0 mt-1" style={{ color: colors.gold }} />}
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
      {/* Page header — "Café com a Palavra Viva de Deus" */}
      {!isViewingPast && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colors.goldLight }}>
              <BookOpen className="h-5 w-5" style={{ color: colors.gold }} />
            </div>
            <div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-black tracking-tight" style={{ color: colors.text }}>
                {labels.pageTitle[lang]}
              </h1>
              <p className="text-xs capitalize" style={{ color: colors.textMuted }}>
                {formatDateFull(data.scheduled_date, lang)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isViewingPast && (
        <button
          onClick={handleBackToToday}
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors hover:opacity-80"
          style={{ color: colors.gold }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {labels.backToday[lang]}
        </button>
      )}

      {/* ═══ EDITORIAL CARD ═══ */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200 ${transitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}
      >

        {/* ── 1. Category badge ── */}
        {displayCategory && (
          <div className="px-5 sm:px-8 pt-5">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full font-semibold uppercase tracking-wider"
              style={{ backgroundColor: colors.goldLight, color: colors.gold }}
            >
              ✦ {displayCategory}
            </span>
          </div>
        )}

        {/* ── 2. TITLE (Playfair Display) ── */}
        <div className="px-5 sm:px-8 pt-5 pb-2">
          <h1 className="font-playfair text-2xl sm:text-[2rem] font-black leading-tight tracking-tight" style={{ color: colors.text }}>
            {displayTitle}
          </h1>
          <p className="text-[11px] mt-2 capitalize flex items-center gap-2" style={{ color: colors.textMuted }}>
            <Calendar className="h-3.5 w-3.5" />
            {formatDateFull(isViewingPast ? displayDate.slice(0, 10) : data.scheduled_date, lang)}
          </p>
        </div>

        {/* ── 3. VERSE QUOTE ── */}
        {!isViewingPast && displayVerseText && (
          <div className="mx-5 sm:mx-8 mt-5 rounded-xl p-5" style={{ borderLeft: `4px solid ${colors.gold}`, backgroundColor: colors.verseBg }}>
            <div className="flex gap-3">
              <span className="text-3xl font-playfair font-black leading-none shrink-0 select-none" style={{ color: colors.goldMuted }}>&ldquo;</span>
              <div>
                <blockquote className="font-serif text-base sm:text-lg italic leading-relaxed" style={{ color: 'hsl(24, 30%, 18%, 0.9)' }}>
                  {displayVerseText}
                </blockquote>
                <p className="text-xs font-bold mt-3" style={{ color: colors.gold }}>&mdash; {displayVerse}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. AUDIO PLAYER ── */}
        {!isViewingPast && (
          <div className="mx-5 sm:mx-8 mt-6">
            <AudioPlayer data={data} lang={lang} />
          </div>
        )}

        {/* ── 5. IMAGEM DO DEVOCIONAL (portrait, competitor-style) ── */}
        {displayCover && (
          <div className="mx-5 sm:mx-8 mt-6 rounded-xl border p-5 space-y-4" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.goldLight }}>
                <ImageIcon className="h-4 w-4" style={{ color: colors.gold }} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: colors.gold }}>{labels.coverSection[lang]}</p>
                <p className="text-xs" style={{ color: colors.textMuted }}>{labels.coverSub[lang]}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative rounded-xl overflow-hidden shadow-lg w-full max-w-sm aspect-[3/4]">
                {/* Background image */}
                <img src={displayCover} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />

                {/* Gradient overlays for text readability */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.75) 100%)',
                }} />

                {/* Top: Brand */}
                <div className="absolute top-5 left-0 right-0 flex items-center justify-center">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.25em] px-4 py-1"
                    style={{ color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.25)' }}
                  >
                    Living Word
                  </span>
                </div>

                {/* Center: Title + Category */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <h3
                    className="font-playfair text-3xl sm:text-4xl font-black leading-tight text-white drop-shadow-lg"
                    style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                  >
                    {displayTitle}
                  </h3>
                  {displayCategory && (
                    <>
                      <div className="flex items-center gap-3 mt-4 mb-1">
                        <span className="h-px w-6" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
                        <span className="text-white/50 text-xs">✦</span>
                        <span className="h-px w-6" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
                      </div>
                      <span className="text-sm tracking-wider text-white/80 font-medium">{displayCategory}</span>
                    </>
                  )}
                </div>

                {/* Bottom: Verse */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pt-10">
                  {displayVerseText && (
                    <p
                      className="text-white/90 text-xs sm:text-sm italic leading-relaxed mb-1"
                      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
                    >
                      {displayVerseText}
                    </p>
                  )}
                  {displayVerse && (
                    <p className="text-white/60 text-[11px] font-medium">&mdash; {displayVerse}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  try {
                    const resp = await fetch(displayCover!, { mode: 'cors' });
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `devocional-${displayTitle.slice(0, 20).replace(/\s+/g, '-')}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(displayCover!, '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBg }}
              >
                <Download className="h-4 w-4" /> {labels.saveImage[lang]}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) navigator.share({ title: displayTitle, url: displayCover! });
                  else { navigator.clipboard.writeText(displayCover!); toast.success(labels.copied[lang]); }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBg }}
              >
                <Share2 className="h-4 w-4" /> {labels.share[lang]}
              </button>
              <button
                onClick={() => {
                  const text = `*${displayTitle}*\n📖 ${displayVerse}\n\n${displayCover}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                style={{ borderColor: colors.gold + '50', color: colors.gold, backgroundColor: colors.goldLight }}
              >
                <WhatsAppIcon /> {labels.shareWa[lang]}
              </button>
            </div>
          </div>
        )}

        {/* ── 6. MEDITAÇÃO (Body) ── */}
        <div className="px-5 sm:px-8 pt-8 pb-4">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.goldLight }}>
              <MessageCircle className="h-4 w-4" style={{ color: colors.gold }} />
            </div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: colors.gold }}>
              {labels.meditation[lang]}
            </h2>
          </div>
          <div className="space-y-0">
            {renderBodyText(displayBody)}
          </div>

          {/* Reflection question */}
          {!isViewingPast && data.reflection_question && (
            <div className="mt-8 pl-5 py-2" style={{ borderLeft: `3px solid ${colors.goldMuted}` }}>
              <p className="font-serif text-base italic leading-relaxed" style={{ color: 'hsl(24, 30%, 20%, 0.8)' }}>
                💭 {data.reflection_question}
              </p>
            </div>
          )}
        </div>

        {/* ── 6b. CLOSING PRAYER (explicit field) ── */}
        {closingPrayerSection}

        {/* ── 7. DESAFIO DO DIA ── */}
        {!isViewingPast && data.daily_practice && (
          <div className="mx-5 sm:mx-8 mb-5 rounded-xl p-5" style={{ backgroundColor: colors.goldLight, border: `1px solid ${colors.goldMuted}40` }}>
            <div className="flex items-start gap-2.5">
              <ListChecks className="h-4 w-4 mt-0.5 shrink-0" style={{ color: colors.gold }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: colors.gold }}>
                  {labels.challenge[lang]}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                  {data.daily_practice}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. ACTION BAR ── */}
        <div className="border-t px-5 sm:px-8 py-4 flex items-center gap-2 flex-wrap" style={{ borderColor: colors.border, backgroundColor: colors.goldLight + '60' }}>
          <button onClick={handleCopy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80" style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBg }}>
            <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
          </button>
          <button onClick={handleWhatsApp} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80" style={{ borderColor: colors.gold + '50', color: colors.gold, backgroundColor: colors.goldLight }}>
            <WhatsAppIcon /> {labels.shareWa[lang]}
          </button>
          <button
            onClick={() => { if (navigator.share) navigator.share({ title: displayTitle, text: `${displayTitle} — ${displayVerse}` }); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
            style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBg }}
          >
            <Share2 className="h-3.5 w-3.5" /> {labels.share[lang]}
          </button>
          <Link
            to="/mente-chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
            style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBg }}
          >
            <MessageCircle className="h-3.5 w-3.5" /> {labels.deepenChat[lang]}
          </Link>
        </div>
      </div>

      {/* ── 9. JOURNALING ── */}
      {!isViewingPast && (
        <div className="mt-6 rounded-2xl border p-5 sm:p-6 space-y-4" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PenLine className="h-4 w-4" style={{ color: colors.gold }} />
              <p className="text-sm font-bold" style={{ color: colors.text }}>{labels.journal[lang]}</p>
            </div>
            {noteSavedAt && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: colors.textMuted }}>
                <Check className="h-3 w-3" style={{ color: colors.gold }} />
                {noteSavedAt}
              </span>
            )}
            {savingNote && (
              <span className="text-[10px] italic" style={{ color: colors.textMuted }}>
                {lang === 'PT' ? 'Salvando...' : lang === 'ES' ? 'Guardando...' : 'Saving...'}
              </span>
            )}
          </div>

          {/* Show reflection question as prompt */}
          {data.reflection_question && (
            <p className="text-sm italic pl-3" style={{ color: 'hsl(24, 30%, 30%, 0.75)', borderLeft: `2px solid ${colors.goldMuted}` }}>
              {data.reflection_question}
            </p>
          )}

          {/* Success state after manual save */}
          {noteSavedSuccess && !showAddReflection ? (
            <div className="space-y-4">
              {/* Show saved note preview */}
              <div className="rounded-xl p-4" style={{ backgroundColor: colors.goldLight, border: `1px solid ${colors.goldMuted}40` }}>
                <p className="font-serif text-sm leading-relaxed" style={{ color: colors.text }}>
                  {personalNote}
                </p>
              </div>

              {/* Success message + Add Reflection button */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs flex items-center gap-1.5" style={{ color: colors.gold }}>
                  <Check className="h-4 w-4" />
                  {lang === 'PT' ? 'Reflexão salva com sucesso!' : lang === 'ES' ? '¡Reflexión guardada!' : 'Reflection saved!'}
                </span>
                <button
                  onClick={handleAddMoreReflection}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                  style={{ borderColor: colors.gold + '50', color: colors.gold, backgroundColor: colors.goldLight }}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  {lang === 'PT' ? 'Adicionar Reflexão' : lang === 'ES' ? 'Agregar Reflexión' : 'Add Reflection'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={personalNote}
                onChange={(e) => { handleNoteChange(e.target.value); setNoteSavedSuccess(false); }}
                placeholder={labels.journalPlaceholder[lang]}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border font-serif text-sm resize-none focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  '--tw-ring-color': colors.gold + '40',
                } as React.CSSProperties}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={!personalNote.trim() || savingNote}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  style={{ backgroundColor: colors.gold, color: '#fff' }}
                >
                  <Send className="h-4 w-4" /> {labels.saveNote[lang]}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile: reading history */}
      {isMobile && user && (
        <div className="mt-6 rounded-2xl border overflow-hidden" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
          <div className="p-4 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4" style={{ color: colors.gold }} />
              <p className="text-sm font-bold" style={{ color: colors.text }}>{labels.history[lang]}</p>
            </div>
          </div>
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {pastLoading ? (
              <div className="space-y-2 p-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : pastItems.length === 0 ? (
              <p className="text-xs p-3 text-center" style={{ color: colors.textMuted }}>{labels.noHistory[lang]}</p>
            ) : (
              pastItems.map(item => {
                const isActive = activeItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPast(item)}
                    className="w-full flex gap-3 p-2.5 rounded-lg transition-colors text-left"
                    style={{ backgroundColor: isActive ? colors.goldLight : 'transparent' }}
                  >
                    {item.cover_image_url ? (
                      <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: colors.goldLight }}>
                        <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: colors.goldLight }}>
                        <BookOpen className="h-4 w-4" style={{ color: colors.goldMuted }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug line-clamp-1" style={{ color: isActive ? colors.gold : colors.text }}>
                        {item.title}
                      </p>
                      <span className="text-[10px]" style={{ color: colors.textMuted }}>{formatShortDate(item.scheduled_date, lang)}</span>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0 mt-1" style={{ color: colors.gold }} />}
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
