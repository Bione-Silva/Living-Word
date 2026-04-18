import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Play, Pause, RotateCcw, Settings, Plus, Minus, Share2, Download, Printer,
  PenLine, BookOpen, Languages, ImageIcon, Clock, Timer, Hourglass, Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Lang = 'PT' | 'EN' | 'ES';
type TimerMode = 'countdown' | 'progressive' | 'clock';

interface PodiumModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonMarkdown: string;
  sermonTitle: string;
  /** Limite de duração em minutos para alertar quando ultrapassado */
  durationLimitMinutes?: number;
  /** ID do material para salvar/carregar notas */
  materialId?: string | null;
  lang?: Lang;
}

const tr = {
  preacherNotes: { PT: 'Anotações do Pregador', EN: 'Preacher Notes', ES: 'Notas del Predicador' },
  notesPlaceholder: {
    PT: 'Anotações pessoais para a hora de pregar — só você vê...',
    EN: 'Personal notes for preaching time — only you see these...',
    ES: 'Notas personales para el momento de predicar — solo usted las ve...',
  },
  bibleVersions: { PT: 'Versões Bíblicas', EN: 'Bible Versions', ES: 'Versiones Bíblicas' },
  originalLang: { PT: 'Hebraico / Grego', EN: 'Hebrew / Greek', ES: 'Hebreo / Griego' },
  illustrations: { PT: 'Ilustrações da Época', EN: 'Period Illustrations', ES: 'Ilustraciones de la Época' },
  fontSize: { PT: 'Tamanho da fonte', EN: 'Font size', ES: 'Tamaño de fuente' },
  share: { PT: 'Compartilhar link', EN: 'Share link', ES: 'Compartir enlace' },
  download: { PT: 'Baixar Markdown', EN: 'Download Markdown', ES: 'Descargar Markdown' },
  print: { PT: 'Imprimir', EN: 'Print', ES: 'Imprimir' },
  exit: { PT: 'Sair do Púlpito', EN: 'Exit Podium', ES: 'Salir del Púlpito' },
  countdown: { PT: 'Regressivo', EN: 'Countdown', ES: 'Regresivo' },
  progressive: { PT: 'Progressivo', EN: 'Progressive', ES: 'Progresivo' },
  clock: { PT: 'Relógio', EN: 'Clock', ES: 'Reloj' },
  duration: { PT: 'Duração da pregação', EN: 'Sermon duration', ES: 'Duración del sermón' },
  minutes: { PT: 'min', EN: 'min', ES: 'min' },
  custom: { PT: 'Personalizado', EN: 'Custom', ES: 'Personalizado' },
  searchVerse: { PT: 'Digite a referência (ex: João 3:16)', EN: 'Type the reference (e.g. John 3:16)', ES: 'Escriba la referencia' },
  searchOriginal: { PT: 'Palavra/conceito para análise original...', EN: 'Word/concept for original analysis...', ES: 'Palabra/concepto para análisis original...' },
  searchIllus: { PT: 'Tema histórico (ex: Império Romano)', EN: 'Historical theme (e.g. Roman Empire)', ES: 'Tema histórico (ej: Imperio Romano)' },
  consult: { PT: 'Consultar', EN: 'Consult', ES: 'Consultar' },
  loading: { PT: 'Buscando...', EN: 'Loading...', ES: 'Buscando...' },
  notesSaved: { PT: 'Anotações salvas', EN: 'Notes saved', ES: 'Notas guardadas' },
  saveNotes: { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
};

/** Quebra o markdown em "cartões" — cada heading h2 inicia um novo cartão. */
function splitIntoCards(md: string): { heading?: string; body: string; isQuote: boolean }[] {
  if (!md) return [];
  const lines = md.split('\n');
  const cards: { heading?: string; body: string; isQuote: boolean }[] = [];
  let current: { heading?: string; body: string[]; isQuote: boolean } | null = null;

  const flush = () => {
    if (current) {
      cards.push({
        heading: current.heading,
        body: current.body.join('\n').trim(),
        isQuote: current.isQuote,
      });
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw;
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h1) {
      flush();
      current = { heading: h1[1].trim(), body: [], isQuote: false };
      continue;
    }
    if (h2) {
      flush();
      current = { heading: h2[1].trim(), body: [], isQuote: false };
      continue;
    }
    if (!current) current = { heading: undefined, body: [], isQuote: false };
    current.body.push(line);
  }
  flush();

  // Detecta cartões inteiros que são citações bíblicas (começam com >)
  return cards
    .filter((c) => c.heading || c.body.trim())
    .map((c) => {
      const trimmed = c.body.trim();
      const isQuote = trimmed.startsWith('>') || trimmed.split('\n').every((l) => l.startsWith('>') || !l.trim());
      return { ...c, isQuote };
    });
}

/** Aplica negrito em números de versículo: "16 Porque..." -> "**16** Porque..." */
function bolderVerseNumbers(text: string): string {
  // Inicio de linha OU após citação ">" — número 1-3 dígitos seguido de espaço
  return text
    .replace(/^(\s*>?\s*)(\d{1,3})(\s+)/gm, '$1**$2**$3')
    .replace(/(?<=[.!?]\s)(\d{1,3})(\s+)/g, '**$1**$2');
}

/** Renderiza markdown simples (negrito, citações, listas) com tipografia de Púlpito. */
function PodiumMarkdown({ text, isQuote, fontPx }: { text: string; isQuote: boolean; fontPx: number }) {
  const processed = bolderVerseNumbers(text);
  const lines = processed.split('\n');

  const renderInline = (s: string) => {
    // ** ** -> <strong>
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{p.slice(2, -2)}</strong>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div
      className={cn(
        isQuote ? 'font-serif italic' : 'font-sans',
        'text-white/90 leading-relaxed space-y-4',
      )}
      style={{ fontSize: `${fontPx}px`, lineHeight: 1.5 }}
    >
      {lines.map((line, i) => {
        const t = line.replace(/^>\s?/, '').trimEnd();
        if (!t) return <div key={i} style={{ height: fontPx * 0.5 }} />;
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-3 pl-4">
              <span className="text-white/50">•</span>
              <span>{renderInline(t.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(t)}</p>;
      })}
    </div>
  );
}

/* ─── Painel deslizante reutilizável ─── */
function SlidePanel({
  open, onClose, title, side = 'right', widthClass = 'w-[380px]', children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  widthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {open && (
        <button
          aria-label="close-overlay"
          onClick={onClose}
          className="fixed inset-0 z-[110] bg-black/40"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 bottom-0 z-[120] transform transition-transform duration-300 bg-zinc-950 border-zinc-800 text-white flex flex-col max-w-[92vw]',
          widthClass,
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h3 className="text-sm font-bold">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}

export function PodiumModeModal({
  open,
  onOpenChange,
  sermonMarkdown,
  sermonTitle,
  durationLimitMinutes = 30,
  materialId,
  lang = 'PT',
}: PodiumModeModalProps) {
  /* ─── Tipografia ─── */
  const [fontPx, setFontPx] = useState(28);

  /* ─── Cartões do sermão ─── */
  const cards = useMemo(() => splitIntoCards(sermonMarkdown), [sermonMarkdown]);

  /* ─── Timer ─── */
  const [mode, setMode] = useState<TimerMode>('progressive');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0); // segundos decorridos (progressivo) ou restantes (regressivo)
  const [clockTime, setClockTime] = useState(new Date());
  const [durationMin, setDurationMin] = useState(durationLimitMinutes);
  const [customMin, setCustomMin] = useState<string>(String(durationLimitMinutes));
  const limitSeconds = durationMin * 60;

  // Reset timer ao mudar de modo ou de duração
  useEffect(() => {
    setRunning(false);
    if (mode === 'countdown') setSeconds(limitSeconds);
    else if (mode === 'progressive') setSeconds(0);
  }, [mode, limitSeconds]);

  // Tick
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setClockTime(new Date());
      if (running) {
        setSeconds((s) => {
          if (mode === 'countdown') return Math.max(0, s - 1);
          if (mode === 'progressive') return s + 1;
          return s;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [running, mode, open]);

  const overLimit = useMemo(() => {
    if (mode === 'progressive') return seconds > limitSeconds;
    if (mode === 'countdown') return seconds === 0;
    return false;
  }, [mode, seconds, limitSeconds]);

  const timerDisplay = useMemo(() => {
    if (mode === 'clock') {
      return clockTime.toLocaleTimeString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    }
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [mode, seconds, clockTime, lang]);

  function resetTimer() {
    setRunning(false);
    if (mode === 'countdown') setSeconds(limitSeconds);
    else setSeconds(0);
  }

  /* ─── Painéis flutuantes ─── */
  const [notesOpen, setNotesOpen] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [illusOpen, setIllusOpen] = useState(false);

  /* ─── Preacher Notes (persistidas) ─── */
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!open || !materialId || notesLoaded) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('sermon_notes')
        .select('content')
        .eq('material_id', materialId)
        .maybeSingle();
      if (data?.content) setNotes(data.content);
      setNotesLoaded(true);
    })();
  }, [open, materialId, notesLoaded]);

  async function saveNotes() {
    if (!materialId) {
      toast.info(lang === 'PT' ? 'Salve o sermão primeiro' : 'Save the sermon first');
      return;
    }
    setSavingNotes(true);
    try {
      const { data: existing } = await (supabase as any)
        .from('sermon_notes')
        .select('id')
        .eq('material_id', materialId)
        .maybeSingle();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('not-auth');
      if (existing?.id) {
        await (supabase as any).from('sermon_notes').update({ content: notes }).eq('id', existing.id);
      } else {
        await (supabase as any).from('sermon_notes').insert({ user_id: user.id, material_id: materialId, content: notes });
      }
      toast.success(tr.notesSaved[lang]);
    } catch (e) {
      toast.error('Erro ao salvar');
    } finally {
      setSavingNotes(false);
    }
  }

  /* ─── Consulta IA — versões bíblicas / hebraico-grego / ilustrações ─── */
  const [bibleQuery, setBibleQuery] = useState('');
  const [bibleResult, setBibleResult] = useState('');
  const [bibleLoading, setBibleLoading] = useState(false);
  const [origQuery, setOrigQuery] = useState('');
  const [origResult, setOrigResult] = useState('');
  const [origLoading, setOrigLoading] = useState(false);
  const [illusQuery, setIllusQuery] = useState('');
  const [illusResult, setIllusResult] = useState('');
  const [illusLoading, setIllusLoading] = useState(false);

  async function aiQuery(systemPrompt: string, userPrompt: string) {
    const { data, error } = await supabase.functions.invoke('ai-tool', {
      body: { systemPrompt, userPrompt, toolId: 'podium-quick-consult' },
    });
    if (error) throw error;
    return (data?.content || '').trim();
  }

  async function consultBible() {
    if (!bibleQuery.trim()) return;
    setBibleLoading(true);
    try {
      const r = await aiQuery(
        `You are a biblical reference assistant. Given a Bible reference, return the verse text in 4 versions (ARA, NVI, ESV, KJV) in a compact, scannable format. Use plain text, no markdown headers. Keep it short.`,
        `Reference: ${bibleQuery.trim()}. Show the same verse(s) in ARA, NVI, ESV and KJV.`,
      );
      setBibleResult(r);
    } catch { toast.error('Erro'); } finally { setBibleLoading(false); }
  }

  async function consultOriginal() {
    if (!origQuery.trim()) return;
    setOrigLoading(true);
    try {
      const r = await aiQuery(
        `You are a Hebrew/Greek biblical languages assistant. Provide a quick original-language analysis in plain text (no markdown headers). Include: original word(s), transliteration, gloss, brief semantic range, and one quick exegetical insight. Keep it under 150 words.`,
        `Term/concept: ${origQuery.trim()}`,
      );
      setOrigResult(r);
    } catch { toast.error('Erro'); } finally { setOrigLoading(false); }
  }

  async function consultIllus() {
    if (!illusQuery.trim()) return;
    setIllusLoading(true);
    try {
      const r = await aiQuery(
        `You are a historical illustrations assistant for preachers. Given a topic, return 3 short historical/biographical illustrations (each 60-100 words) usable in a sermon. Plain text, separated by blank lines, no markdown headers.`,
        `Topic: ${illusQuery.trim()}`,
      );
      setIllusResult(r);
    } catch { toast.error('Erro'); } finally { setIllusLoading(false); }
  }

  /* ─── Settings menu actions ─── */
  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: sermonTitle, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success(lang === 'PT' ? 'Link copiado' : 'Link copied');
    }
  }

  function handleDownload() {
    const blob = new Blob([`# ${sermonTitle}\n\n${sermonMarkdown}`], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${sermonTitle.slice(0, 60) || 'sermao'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handlePrint() {
    window.print();
  }

  /* ─── Scroll do sermão ─── */
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#080808' }}>
      {/* ─── Top Bar ─── */}
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-900 shrink-0">
        {/* Title */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Modo Púlpito</p>
          <h2 className="text-sm font-semibold text-white truncate">{sermonTitle || 'Sermão'}</h2>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="timer mode">
                {mode === 'countdown' && <Hourglass className="h-4 w-4" />}
                {mode === 'progressive' && <Timer className="h-4 w-4" />}
                {mode === 'clock' && <Clock className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white w-64">
              <DropdownMenuLabel>{lang === 'PT' ? 'Modo do Timer' : 'Timer Mode'}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={() => setMode('countdown')} className="focus:bg-zinc-800 focus:text-white">
                <Hourglass className="h-4 w-4 mr-2" /> {tr.countdown[lang]} ({durationMin} min)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('progressive')} className="focus:bg-zinc-800 focus:text-white">
                <Timer className="h-4 w-4 mr-2" /> {tr.progressive[lang]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('clock')} className="focus:bg-zinc-800 focus:text-white">
                <Clock className="h-4 w-4 mr-2" /> {tr.clock[lang]}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-zinc-500">
                {tr.duration[lang]}
              </DropdownMenuLabel>
              <div className="px-2 pb-2 space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  {[15, 30, 45, 60, 75, 90].map((m) => (
                    <button
                      key={m}
                      onClick={(e) => {
                        e.preventDefault();
                        setDurationMin(m);
                        setCustomMin(String(m));
                      }}
                      className={cn(
                        'text-xs py-1.5 rounded-md tabular-nums transition-colors',
                        durationMin === m
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    onBlur={() => {
                      const n = Math.max(1, Math.min(300, parseInt(customMin || '0', 10) || 0));
                      if (n > 0) {
                        setDurationMin(n);
                        setCustomMin(String(n));
                      } else {
                        setCustomMin(String(durationMin));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    placeholder={tr.custom[lang]}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-zinc-500">{tr.minutes[lang]}</span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className={cn(
              'tabular-nums font-mono text-base font-bold px-3 py-1 rounded-md min-w-[90px] text-center transition-colors',
              overLimit ? 'bg-red-900/40 text-red-400 ring-1 ring-red-500/50' : 'bg-zinc-900 text-zinc-200',
            )}
          >
            {timerDisplay}
          </div>

          {mode !== 'clock' && (
            <>
              <button
                onClick={() => setRunning((r) => !r)}
                className="text-zinc-400 hover:text-white p-2 rounded-md"
                aria-label={running ? 'pause' : 'play'}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button onClick={resetTimer} className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="reset">
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-800 mx-1" />

        {/* Quick panels */}
        <button onClick={() => setNotesOpen(true)} className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="notes">
          <PenLine className="h-4 w-4" />
        </button>
        <button onClick={() => setBibleOpen(true)} className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="bible">
          <BookOpen className="h-4 w-4" />
        </button>
        <button onClick={() => setOriginalOpen(true)} className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="original">
          <Languages className="h-4 w-4" />
        </button>
        <button onClick={() => setIllusOpen(true)} className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="illustrations">
          <ImageIcon className="h-4 w-4" />
        </button>

        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-zinc-400 hover:text-white p-2 rounded-md" aria-label="settings">
              <Settings className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white w-56">
            <DropdownMenuLabel>{tr.fontSize[lang]}</DropdownMenuLabel>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <button onClick={() => setFontPx((f) => Math.max(16, f - 2))} className="flex-1 flex items-center justify-center gap-1 p-2 rounded hover:bg-zinc-800">
                <Minus className="h-3 w-3" /> <span className="text-sm">a</span>
              </button>
              <span className="text-xs text-zinc-400 tabular-nums w-10 text-center">{fontPx}px</span>
              <button onClick={() => setFontPx((f) => Math.min(64, f + 2))} className="flex-1 flex items-center justify-center gap-1 p-2 rounded hover:bg-zinc-800">
                <Plus className="h-3 w-3" /> <span className="text-base font-bold">A</span>
              </button>
            </div>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={handleShare} className="focus:bg-zinc-800 focus:text-white">
              <Share2 className="h-4 w-4 mr-2" /> {tr.share[lang]}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} className="focus:bg-zinc-800 focus:text-white">
              <Download className="h-4 w-4 mr-2" /> {tr.download[lang]}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint} className="focus:bg-zinc-800 focus:text-white">
              <Printer className="h-4 w-4 mr-2" /> {tr.print[lang]}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => onOpenChange(false)}
          className="text-zinc-400 hover:text-white p-2 rounded-md ml-1"
          aria-label={tr.exit[lang]}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* ─── Sermão em cartões ─── */}
      <main ref={scrollerRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {cards.length === 0 && (
            <div className="text-center text-zinc-500 py-20">
              <Maximize2 className="h-10 w-10 mx-auto mb-4 opacity-40" />
              <p>{lang === 'PT' ? 'Sermão vazio.' : 'Empty sermon.'}</p>
            </div>
          )}
          {cards.map((c, i) => (
            <section
              key={i}
              className={cn(
                'rounded-2xl border p-6 md:p-10',
                c.isQuote
                  ? 'bg-zinc-950 border-amber-700/30'
                  : 'bg-zinc-950/60 border-zinc-900',
              )}
            >
              {c.heading && (
                <h3
                  className="font-sans font-bold text-amber-200/90 mb-6 tracking-tight"
                  style={{ fontSize: `${Math.round(fontPx * 0.95)}px`, lineHeight: 1.2 }}
                >
                  {c.heading}
                </h3>
              )}
              <PodiumMarkdown text={c.body} isQuote={c.isQuote} fontPx={fontPx} />
            </section>
          ))}
          <div className="h-32" />
        </div>
      </main>

      {/* ─── Painel: Anotações do Pregador ─── */}
      <SlidePanel open={notesOpen} onClose={() => setNotesOpen(false)} title={tr.preacherNotes[lang]}>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={tr.notesPlaceholder[lang]}
          rows={20}
          className="bg-zinc-900 border-zinc-800 text-white text-base resize-none min-h-[60vh]"
        />
        <Button onClick={saveNotes} disabled={savingNotes} className="mt-3 w-full bg-amber-600 hover:bg-amber-500 text-white">
          {savingNotes ? '...' : tr.saveNotes[lang]}
        </Button>
      </SlidePanel>

      {/* ─── Painel: Múltiplas Versões Bíblicas ─── */}
      <SlidePanel open={bibleOpen} onClose={() => setBibleOpen(false)} title={tr.bibleVersions[lang]}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={bibleQuery}
              onChange={(e) => setBibleQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultBible()}
              placeholder={tr.searchVerse[lang]}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Button onClick={consultBible} disabled={bibleLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {bibleLoading ? tr.loading[lang] : tr.consult[lang]}
            </Button>
          </div>
          {bibleResult && (
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {bibleResult}
            </div>
          )}
        </div>
      </SlidePanel>

      {/* ─── Painel: Hebraico/Grego ─── */}
      <SlidePanel open={originalOpen} onClose={() => setOriginalOpen(false)} title={tr.originalLang[lang]}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={origQuery}
              onChange={(e) => setOrigQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultOriginal()}
              placeholder={tr.searchOriginal[lang]}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Button onClick={consultOriginal} disabled={origLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {origLoading ? tr.loading[lang] : tr.consult[lang]}
            </Button>
          </div>
          {origResult && (
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-serif">
              {origResult}
            </div>
          )}
        </div>
      </SlidePanel>

      {/* ─── Painel: Ilustrações da Época ─── */}
      <SlidePanel open={illusOpen} onClose={() => setIllusOpen(false)} title={tr.illustrations[lang]}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={illusQuery}
              onChange={(e) => setIllusQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultIllus()}
              placeholder={tr.searchIllus[lang]}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Button onClick={consultIllus} disabled={illusLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {illusLoading ? tr.loading[lang] : tr.consult[lang]}
            </Button>
          </div>
          {illusResult && (
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {illusResult}
            </div>
          )}
        </div>
      </SlidePanel>
    </div>
  );
}
