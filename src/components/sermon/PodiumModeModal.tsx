import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Check,
  Clock,
  Download,
  Hourglass,
  ImageIcon,
  Languages,
  Maximize2,
  Minus,
  Moon,
  MoreVertical,
  Pause,
  Pencil,
  PenLine,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Settings,
  Share2,
  Sun,
  Timer,
  BookOpen,
  Volume2,
  VolumeX,
  X,
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
type PodiumTheme = 'dark' | 'light';

interface PodiumModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonMarkdown: string;
  sermonTitle: string;
  /** Limite de duração em minutos para alertar quando ultrapassado */
  durationLimitMinutes?: number;
  /** ID do material para salvar/carregar notas */
  materialId?: string | null;
  /** Callback opcional quando o pregador edita o sermão in-place */
  onMarkdownChange?: (next: string) => void;
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
  themeLight: { PT: 'Modo claro', EN: 'Light mode', ES: 'Modo claro' },
  themeDark: { PT: 'Modo escuro', EN: 'Dark mode', ES: 'Modo oscuro' },
  editBlock: { PT: 'Editar bloco', EN: 'Edit block', ES: 'Editar bloque' },
  saveEdit: { PT: 'Salvar edição', EN: 'Save edit', ES: 'Guardar edición' },
  doubleClickHint: { PT: 'Toque duplo para editar', EN: 'Double-tap to edit', ES: 'Toque doble para editar' },
  alertSound: { PT: 'Som do alerta', EN: 'Alert sound', ES: 'Sonido de alerta' },
  on: { PT: 'Ligado', EN: 'On', ES: 'Activado' },
  off: { PT: 'Desligado', EN: 'Off', ES: 'Desactivado' },
};

/* ─── Detecção de tipo de bloco a partir do heading ─── */
type BlockTone = 'idea' | 'hook' | 'passage' | 'illustration' | 'application' | 'main' | 'conclusion' | 'original' | 'transition' | 'quote' | 'explanation' | 'doctrine' | 'objection' | 'appeal' | 'generic';

interface BlockMeta {
  tone: BlockTone;
  emoji: string;
  label: { PT: string; EN: string; ES: string };
  /** classes de cor para a badge (bg + texto + ring), funcionam em dark e light */
  badgeClass: string;
  /** Modo Claro — fundo vibrante suave do cartão (cor identitária do bloco) */
  lightCardBg: string;
  /** Modo Claro — borda esquerda vibrante (faixa identitária) */
  lightBorderLeft: string;
  /** Modo Claro — cor do título/heading do bloco */
  lightHeading: string;
  /** Modo Escuro — borda esquerda vibrante */
  darkBorderLeft: string;
  /** Modo Escuro — cor do título/heading do bloco */
  darkHeading: string;
}

const BLOCK_META: Record<BlockTone, BlockMeta> = {
  idea:         { tone: 'idea',         emoji: '💡', label: { PT: 'Grande Ideia',    EN: 'Big Idea',      ES: 'Gran Idea' },        badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 ring-purple-500/30',  lightCardBg: 'bg-purple-50 border-purple-200',  lightBorderLeft: 'border-l-4 border-l-purple-500',  lightHeading: 'text-purple-700',  darkBorderLeft: 'border-l-4 border-l-purple-500',  darkHeading: 'text-purple-200' },
  hook:         { tone: 'hook',         emoji: '🎣', label: { PT: 'Gancho',          EN: 'Hook',          ES: 'Gancho' },           badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 ring-orange-500/30',  lightCardBg: 'bg-orange-50 border-orange-200',  lightBorderLeft: 'border-l-4 border-l-orange-500',  lightHeading: 'text-orange-700',  darkBorderLeft: 'border-l-4 border-l-orange-500',  darkHeading: 'text-orange-200' },
  passage:      { tone: 'passage',      emoji: '📖', label: { PT: 'Passagem',        EN: 'Passage',       ES: 'Pasaje' },           badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30',              lightCardBg: 'bg-sky-50 border-sky-200',        lightBorderLeft: 'border-l-4 border-l-sky-500',     lightHeading: 'text-sky-700',     darkBorderLeft: 'border-l-4 border-l-sky-500',     darkHeading: 'text-sky-200' },
  illustration: { tone: 'illustration', emoji: '🖼️', label: { PT: 'Ilustração',      EN: 'Illustration',  ES: 'Ilustración' },      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30', lightCardBg: 'bg-emerald-50 border-emerald-200', lightBorderLeft: 'border-l-4 border-l-emerald-500', lightHeading: 'text-emerald-700', darkBorderLeft: 'border-l-4 border-l-emerald-500', darkHeading: 'text-emerald-200' },
  application:  { tone: 'application',  emoji: '🎯', label: { PT: 'Aplicação',       EN: 'Application',   ES: 'Aplicación' },       badgeClass: 'bg-amber-600/20 text-amber-700 dark:text-amber-300 ring-amber-600/40',       lightCardBg: 'bg-orange-50 border-orange-200',  lightBorderLeft: 'border-l-4 border-l-orange-700',  lightHeading: 'text-orange-800', darkBorderLeft: 'border-l-4 border-l-orange-600',  darkHeading: 'text-orange-200' },
  main:         { tone: 'main',         emoji: '🔷', label: { PT: 'Ponto Principal', EN: 'Main Point',    ES: 'Punto Principal' },  badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-blue-500/30',           lightCardBg: 'bg-blue-50 border-blue-200',      lightBorderLeft: 'border-l-4 border-l-blue-600',    lightHeading: 'text-blue-700',    darkBorderLeft: 'border-l-4 border-l-blue-500',    darkHeading: 'text-blue-200' },
  conclusion:   { tone: 'conclusion',   emoji: '🙏', label: { PT: 'Conclusão',       EN: 'Conclusion',    ES: 'Conclusión' },       badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30',           lightCardBg: 'bg-rose-50 border-rose-200',      lightBorderLeft: 'border-l-4 border-l-rose-500',    lightHeading: 'text-rose-700',    darkBorderLeft: 'border-l-4 border-l-rose-500',    darkHeading: 'text-rose-200' },
  original:     { tone: 'original',     emoji: '🔍', label: { PT: 'Hebraico/Grego',  EN: 'Hebrew/Greek',  ES: 'Hebreo/Griego' },    badgeClass: 'bg-amber-700/20 text-amber-800 dark:text-amber-400 ring-amber-700/40',       lightCardBg: 'bg-amber-50 border-amber-300',    lightBorderLeft: 'border-l-4 border-l-amber-800',   lightHeading: 'text-amber-800',   darkBorderLeft: 'border-l-4 border-l-amber-700',   darkHeading: 'text-amber-300' },
  transition:   { tone: 'transition',   emoji: '➰', label: { PT: 'Transição',       EN: 'Transition',    ES: 'Transición' },       badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 ring-slate-500/30',       lightCardBg: 'bg-slate-50 border-slate-200',    lightBorderLeft: 'border-l-4 border-l-slate-500',   lightHeading: 'text-slate-700',   darkBorderLeft: 'border-l-4 border-l-slate-500',   darkHeading: 'text-slate-200' },
  quote:        { tone: 'quote',        emoji: '📚', label: { PT: 'Citação',         EN: 'Quote',         ES: 'Cita' },             badgeClass: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 ring-yellow-500/30',   lightCardBg: 'bg-yellow-50 border-yellow-300',  lightBorderLeft: 'border-l-4 border-l-yellow-600',  lightHeading: 'text-yellow-800',  darkBorderLeft: 'border-l-4 border-l-yellow-500',  darkHeading: 'text-yellow-200' },
  explanation:  { tone: 'explanation',  emoji: '📜', label: { PT: 'Explicação',      EN: 'Explanation',   ES: 'Explicación' },      badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-violet-500/30',   lightCardBg: 'bg-violet-50 border-violet-200',  lightBorderLeft: 'border-l-4 border-l-violet-500',  lightHeading: 'text-violet-700',  darkBorderLeft: 'border-l-4 border-l-violet-500',  darkHeading: 'text-violet-200' },
  doctrine:     { tone: 'doctrine',     emoji: '📘', label: { PT: 'Doutrina',        EN: 'Doctrine',      ES: 'Doctrina' },         badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30',   lightCardBg: 'bg-indigo-50 border-indigo-200',  lightBorderLeft: 'border-l-4 border-l-indigo-600',  lightHeading: 'text-indigo-700',  darkBorderLeft: 'border-l-4 border-l-indigo-500',  darkHeading: 'text-indigo-200' },
  objection:    { tone: 'objection',    emoji: '⚖️', label: { PT: 'Objeção',         EN: 'Objection',     ES: 'Objeción' },         badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30',       lightCardBg: 'bg-amber-50 border-amber-200',    lightBorderLeft: 'border-l-4 border-l-amber-600',   lightHeading: 'text-amber-800',   darkBorderLeft: 'border-l-4 border-l-amber-500',   darkHeading: 'text-amber-200' },
  appeal:       { tone: 'appeal',       emoji: '🔥', label: { PT: 'Apelo',           EN: 'Appeal',        ES: 'Llamado' },          badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 ring-red-500/30',               lightCardBg: 'bg-red-50 border-red-200',        lightBorderLeft: 'border-l-4 border-l-red-600',     lightHeading: 'text-red-700',     darkBorderLeft: 'border-l-4 border-l-red-500',     darkHeading: 'text-red-200' },
  generic:      { tone: 'generic',      emoji: '✦',  label: { PT: 'Bloco',           EN: 'Block',         ES: 'Bloque' },           badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 ring-slate-500/30',       lightCardBg: 'bg-white border-slate-200',       lightBorderLeft: 'border-l-4 border-l-slate-400',   lightHeading: 'text-slate-700',   darkBorderLeft: 'border-l-4 border-l-slate-500',   darkHeading: 'text-amber-200/95' },
};

function detectBlockTone(heading?: string): BlockTone {
  if (!heading) return 'generic';
  const h = heading.toLowerCase();
  // detecta por emoji primeiro (markdown gerado pelo studio inclui emojis)
  if (heading.includes('💡')) return 'idea';
  if (heading.includes('🎯') || heading.includes('🚀')) return h.includes('aplica') ? 'application' : 'hook';
  if (heading.includes('📖')) return 'passage';
  if (heading.includes('🎬') || heading.includes('🖼')) return 'illustration';
  if (heading.includes('✨')) return 'application';
  if (heading.includes('🙏') || heading.includes('🌹')) return 'conclusion';
  if (heading.includes('🔷')) return 'main';
  if (heading.includes('🔍')) return 'original';
  if (heading.includes('➰')) return 'transition';
  if (heading.includes('📚')) return 'quote';
  if (heading.includes('📜')) return 'explanation';
  if (heading.includes('📘')) return 'doctrine';
  if (heading.includes('⚖')) return 'objection';
  if (heading.includes('🔥')) return 'appeal';
  // fallback por palavras-chave
  if (/grande ideia|big idea|gran idea/.test(h)) return 'idea';
  if (/gancho|hook|introdu|introducc?ión/.test(h)) return 'hook';
  if (/passagem|passage|pasaje/.test(h)) return 'passage';
  if (/ilustra/.test(h)) return 'illustration';
  if (/aplica/.test(h)) return 'application';
  if (/conclus|oração|prayer|oración/.test(h)) return 'conclusion';
  if (/hebraic|grego|hebrew|greek|hebreo|griego/.test(h)) return 'original';
  if (/transi/.test(h)) return 'transition';
  if (/cita|quote/.test(h)) return 'quote';
  if (/explica|explanation/.test(h)) return 'explanation';
  if (/doutrina|doctrine|doctrina/.test(h)) return 'doctrine';
  if (/obje[cç][aã]o|objection|objeci[óo]n|refuta/.test(h)) return 'objection';
  if (/apelo|appeal|altar call|llamado|chamado/.test(h)) return 'appeal';
  if (/ponto|point|punto/.test(h)) return 'main';
  return 'generic';
}

/** Quebra o markdown em "cartões" — cada heading h1/h2 inicia um novo cartão. */
interface Card {
  id: string;
  heading?: string;
  body: string;
  isQuote: boolean;
  tone: BlockTone;
  /** índice das linhas originais [start, end) para reescrever o markdown ao editar */
  range: [number, number];
}

function splitIntoCards(md: string): Card[] {
  if (!md) return [];
  const lines = md.split('\n');
  const cards: Card[] = [];
  let cur: { heading?: string; bodyStart: number; headingLine: number | null } | null = null;
  let counter = 0;

  const push = (endIdx: number) => {
    if (!cur) return;
    const bodyLines = lines.slice(cur.bodyStart, endIdx);
    const body = bodyLines.join('\n').trim();
    const startLine = cur.headingLine !== null ? cur.headingLine : cur.bodyStart;
    if (cur.heading || body) {
      const trimmed = body;
      const isQuote = trimmed.startsWith('>') || trimmed.split('\n').every((l) => l.startsWith('>') || !l.trim());
      cards.push({
        id: `card_${counter++}`,
        heading: cur.heading,
        body,
        isQuote,
        tone: detectBlockTone(cur.heading),
        range: [startLine, endIdx],
      });
    }
    cur = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h1) {
      push(i);
      cur = { heading: h1[1].trim(), bodyStart: i + 1, headingLine: i };
      continue;
    }
    if (h2) {
      push(i);
      cur = { heading: h2[1].trim(), bodyStart: i + 1, headingLine: i };
      continue;
    }
    if (!cur) cur = { heading: undefined, bodyStart: i, headingLine: null };
  }
  push(lines.length);
  return cards;
}

/** Aplica negrito em números de versículo: "16 Porque..." -> "**16** Porque..." */
function bolderVerseNumbers(text: string): string {
  return text
    .replace(/^(\s*>?\s*)(\d{1,3})(\s+)/gm, '$1**$2**$3')
    .replace(/(?<=[.!?]\s)(\d{1,3})(\s+)/g, '**$1**$2');
}

/** Renderiza markdown simples (negrito, citações, listas) com tipografia de Púlpito. */
function PodiumMarkdown({ text, isQuote, fontPx, theme }: { text: string; isQuote: boolean; fontPx: number; theme: PodiumTheme }) {
  const processed = bolderVerseNumbers(text);
  const lines = processed.split('\n');

  const baseColor = theme === 'dark' ? 'text-slate-100/95' : 'text-slate-800';
  const strongColor = theme === 'dark' ? 'text-white' : 'text-slate-950';
  const bulletColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const renderInline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} className={cn(strongColor, 'font-bold')}>{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
        return <em key={i} className="italic">{p.slice(1, -1)}</em>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div
      className={cn(isQuote ? 'font-serif italic' : 'font-sans', baseColor, 'space-y-5 sm:space-y-6 break-words')}
      style={{ fontSize: `clamp(15px, ${fontPx}px, ${fontPx}px)`, lineHeight: 1.75, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
    >
      {lines.map((line, i) => {
        const t = line.replace(/^>\s?/, '').trimEnd();
        if (!t) return <div key={i} style={{ height: fontPx * 0.4 }} />;
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-3 pl-2">
              <span className={bulletColor}>•</span>
              <span>{renderInline(t.slice(2))}</span>
            </div>
          );
        }
        return <p key={i} className="tracking-[0.005em]">{renderInline(t)}</p>;
      })}
    </div>
  );
}

/* ─── Painel deslizante reutilizável ─── */
function SlidePanel({
  open, onClose, title, side = 'right', widthClass = 'w-[380px]', children, theme,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  widthClass?: string;
  children: React.ReactNode;
  theme: PodiumTheme;
}) {
  const isDark = theme === 'dark';
  return (
    <>
      {open && (
        <button
          aria-label="close-overlay"
          onClick={onClose}
          className="fixed inset-0 z-[110] bg-black/50"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 bottom-0 z-[120] transform transition-transform duration-300 flex flex-col max-w-[92vw]',
          widthClass,
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <header className={cn('flex items-center justify-between px-4 py-3 border-b shrink-0', isDark ? 'border-slate-800' : 'border-slate-200')}>
          <h3 className="text-sm font-bold">{title}</h3>
          <button onClick={onClose} className={cn(isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}>
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
  onMarkdownChange,
  lang = 'PT',
}: PodiumModeModalProps) {
  /* ─── Tema do Púlpito (independente do tema global) ─── */
  const [theme, setTheme] = useState<PodiumTheme>('dark');
  const isDark = theme === 'dark';

  /* ─── Tipografia ─── */
  const [fontPx, setFontPx] = useState(28);

  /* ─── Markdown editável (espelha prop, mas permite edição in-place) ─── */
  const [localMd, setLocalMd] = useState(sermonMarkdown);
  useEffect(() => { setLocalMd(sermonMarkdown); }, [sermonMarkdown]);

  /* ─── Cartões do sermão ─── */
  const cards = useMemo(() => splitIntoCards(localMd), [localMd]);

  /* ─── Edição in-place ─── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');

  function startEdit(card: Card) {
    setEditingId(card.id);
    setEditingDraft(card.body);
  }

  function commitEdit(card: Card) {
    const lines = localMd.split('\n');
    const [start, end] = card.range;
    // Mantém o heading (start), substitui apenas as linhas do corpo
    const headOffset = card.heading ? 1 : 0;
    const before = lines.slice(0, start + headOffset);
    const after = lines.slice(end);
    const newBodyLines = editingDraft.split('\n');
    const next = [...before, ...newBodyLines, ...after].join('\n');
    setLocalMd(next);
    onMarkdownChange?.(next);
    setEditingId(null);
    setEditingDraft('');
    toast.success(lang === 'PT' ? 'Bloco atualizado' : lang === 'ES' ? 'Bloque actualizado' : 'Block updated');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingDraft('');
  }

  /* ─── Timer ─── */
  const [mode, setMode] = useState<TimerMode>('progressive');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clockTime, setClockTime] = useState(new Date());
  const [durationMin, setDurationMin] = useState(durationLimitMinutes);
  const [customMin, setCustomMin] = useState<string>(String(durationLimitMinutes));
  const limitSeconds = durationMin * 60;

  /** Garante que o alerta sonoro/vibração toca uma única vez por countdown. */
  const endAlertFiredRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  /** Preferência persistida do usuário para o sino + vibração ao bater 00:00. */
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const v = window.localStorage.getItem('podium:alertSound');
      return v === null ? true : v === '1';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('podium:alertSound', soundEnabled ? '1' : '0');
    } catch {
      /* storage indisponível: ok */
    }
  }, [soundEnabled]);

  /** Sino suave via WebAudio (3 toques curtos) + vibração no mobile. Sem assets externos. */
  function playEndAlert() {
    if (!soundEnabled) return; // respeita preferência do usuário
    // Vibração — Android/Chrome mobile (iOS Safari ignora silenciosamente, ok).
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([400, 150, 400, 150, 600]);
      }
    } catch {
      /* noop */
    }

    // Bell suave: 3 toques senoidais com decaimento exponencial.
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!Ctx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      // iOS exige resume após gesto do usuário — Play/Pause já contou como gesto.
      if (ctx.state === 'suspended') void ctx.resume();

      const now = ctx.currentTime;
      const tone = (offset: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 1.0);
      };
      // Acorde de sino: A5 → E6 → A5 (suave, não estridente).
      tone(0.0, 880);
      tone(0.55, 1318.5);
      tone(1.1, 880);
    } catch {
      /* audio bloqueado: silencioso por design */
    }
  }

  useEffect(() => {
    setRunning(false);
    endAlertFiredRef.current = false; // reset ao trocar de modo / duração
    if (mode === 'countdown') setSeconds(limitSeconds);
    else if (mode === 'progressive') setSeconds(0);
  }, [mode, limitSeconds]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setClockTime(new Date());
      if (running) {
        setSeconds((s) => {
          if (mode === 'countdown') {
            const next = Math.max(0, s - 1);
            // Disparo único exatamente na transição para 0.
            if (next === 0 && s > 0 && !endAlertFiredRef.current) {
              endAlertFiredRef.current = true;
              playEndAlert();
            }
            return next;
          }
          if (mode === 'progressive') return s + 1;
          return s;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [running, mode, open]);

  // Reset do flag de alerta quando o usuário reseta ou some do modo countdown.
  useEffect(() => {
    if (mode !== 'countdown' || seconds > 0) {
      endAlertFiredRef.current = false;
    }
  }, [mode, seconds]);


  const overLimit = useMemo(() => {
    if (mode === 'progressive') return seconds > limitSeconds;
    if (mode === 'countdown') return seconds === 0;
    return false;
  }, [mode, seconds, limitSeconds]);

  const timerDisplay = useMemo(() => {
    if (mode === 'clock') {
      return clockTime.toLocaleTimeString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', {
        hour: '2-digit', minute: '2-digit',
      });
    }
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [mode, seconds, clockTime, lang]);

  function resetTimer() {
    setRunning(false);
    endAlertFiredRef.current = false; // rearma o sino para o próximo ciclo
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

  /* ─── Consulta IA ─── */
  const [bibleQuery, setBibleQuery] = useState('');
  const [bibleResult, setBibleResult] = useState('');
  const [bibleLoading, setBibleLoading] = useState(false);
  const [origQuery, setOrigQuery] = useState('');
  const [origResult, setOrigResult] = useState('');
  const [origLoading, setOrigLoading] = useState(false);
  const [illusQuery, setIllusQuery] = useState('');
  const [illusResult, setIllusResult] = useState('');
  const [illusLoading, setIllusLoading] = useState(false);

  /** Idioma humano-legível para travar a saída da IA — evita alucinação de idiomas. */
  const langFull = lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish (español neutro)' : 'Brazilian Portuguese (português do Brasil)';
  const langDirective = `CRITICAL LANGUAGE LOCK: Respond ONLY in ${langFull}. Never mix languages. Do not output English unless the user's selected language is English. Do not output Spanish unless selected. All headings, labels, transliterations explanations, and prose must be in ${langFull}.`;

  async function aiQuery(systemPrompt: string, userPrompt: string) {
    const { data, error } = await supabase.functions.invoke('ai-tool', {
      body: {
        systemPrompt: `${langDirective}\n\n${systemPrompt}`,
        userPrompt: `${userPrompt}\n\n[Output language: ${langFull}]`,
        toolId: 'podium-quick-consult',
      },
    });
    if (error) throw error;
    return (data?.content || '').trim();
  }

  async function consultBible() {
    if (!bibleQuery.trim()) return;
    setBibleLoading(true);
    try {
      const r = await aiQuery(
        `You are a biblical reference assistant. Given a Bible reference, return the verse text in 4 versions (ARA, NVI, ESV, KJV) in a compact, scannable format. Use plain text, no markdown headers. Keep it short. The reference label and any commentary must be in ${langFull}; the verse text itself follows the version (ARA/NVI in Portuguese, ESV/KJV in English).`,
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
        `You are a Hebrew/Greek biblical languages assistant. Provide a quick original-language analysis in plain text (no markdown headers). Include: original word(s) (in Hebrew/Greek script), transliteration, gloss, brief semantic range, and one quick exegetical insight. Keep it under 150 words. ALL explanatory prose, glosses and insights MUST be written in ${langFull}.`,
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
        `You are a historical illustrations assistant for preachers. Given a topic, return 3 short historical/biographical illustrations (each 60-100 words) usable in a sermon. Plain text, separated by blank lines, no markdown headers. Write the entire response in ${langFull}.`,
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
    const blob = new Blob([`# ${sermonTitle}\n\n${localMd}`], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${sermonTitle.slice(0, 60) || 'sermao'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handlePrint() {
    window.print();
  }

  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  /* ─── Tokens de tema ─── */
  const bgRoot = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const headerBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const headerBg = isDark ? 'bg-slate-900/95' : 'bg-white/95';
  const titleColor = isDark ? 'text-white' : 'text-slate-900';
  const subtitleColor = isDark ? 'text-slate-500' : 'text-slate-500';
  const iconBtn = isDark
    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200';
  const timerAlert = mode === 'countdown' && seconds === 0;
  const timerBg = timerAlert
    ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse shadow-lg shadow-red-500/40'
    : isDark
    ? (overLimit ? 'bg-red-950/60 text-red-300 ring-1 ring-red-500/50' : 'bg-slate-800 text-slate-100')
    : (overLimit ? 'bg-red-100 text-red-700 ring-1 ring-red-400/60' : 'bg-slate-200 text-slate-800');
  const cardBg = isDark
    ? 'bg-slate-800 border-slate-700/60'
    : 'bg-white border-slate-200';
  // ⚠️ Bege global REMOVIDO. Quote no modo claro agora também usa meta.lightCardBg (yellow-50).
  const cardQuoteBg = isDark
    ? 'bg-slate-800/80 border-amber-700/40'
    : 'bg-yellow-50 border-yellow-300';
  const dropdownBg = isDark
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className={cn('fixed inset-0 z-[100] flex flex-col overflow-x-hidden', bgRoot)}>
      {/* ─── Top Bar (mobile-first, colapsável) ─── */}
      <header className={cn('shrink-0 border-b backdrop-blur-md', headerBorder, headerBg)}>
        {/* Linha 1 — sempre visível: título + timer + sair */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2">
          <div className="min-w-0 flex-1">
            <p className={cn('text-[9px] sm:text-[10px] uppercase tracking-widest', subtitleColor)}>Modo Púlpito</p>
            <h2 className={cn('text-sm sm:text-base font-semibold truncate', titleColor)}>{sermonTitle || 'Sermão'}</h2>
          </div>

          {/* Timer display + play/pause sempre visível */}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                'tabular-nums font-mono text-sm sm:text-base font-bold px-2.5 sm:px-3 py-1 rounded-md min-w-[68px] sm:min-w-[80px] text-center transition-colors',
                timerBg,
              )}
            >
              {timerDisplay}
            </div>
            {mode !== 'clock' && (
              <button
                onClick={() => setRunning((r) => !r)}
                className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)}
                aria-label={running ? 'pause' : 'play'}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Toggle tema (sempre visível) */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)}
            aria-label={isDark ? tr.themeLight[lang] : tr.themeDark[lang]}
            title={isDark ? tr.themeLight[lang] : tr.themeDark[lang]}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Sair (sempre visível) */}
          <button
            onClick={() => onOpenChange(false)}
            className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)}
            aria-label={tr.exit[lang]}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Linha 2 — ações secundárias (compactam em mobile dentro de "More") */}
        <div className={cn('flex items-center gap-1 px-3 sm:px-4 pb-2 -mt-1 border-t pt-2', headerBorder)}>
          {/* Timer mode dropdown — botão obvio com texto "Configurar Timer" */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-md transition-colors text-xs font-semibold',
                  isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800 ring-1 ring-slate-700/60'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200 ring-1 ring-slate-300',
                )}
                aria-label="timer mode"
                title={lang === 'PT' ? 'Configurar Timer' : lang === 'ES' ? 'Configurar Timer' : 'Configure Timer'}
              >
                {mode === 'countdown' && <Hourglass className="h-4 w-4" />}
                {mode === 'progressive' && <Timer className="h-4 w-4" />}
                {mode === 'clock' && <Clock className="h-4 w-4" />}
                <span className="hidden xs:inline sm:inline">
                  {lang === 'PT' ? 'Configurar Timer' : lang === 'ES' ? 'Configurar Timer' : 'Configure Timer'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={cn(dropdownBg, 'w-64')}>
              <DropdownMenuLabel>{lang === 'PT' ? 'Modo do Timer' : 'Timer Mode'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setMode('progressive')}>
                <Timer className="h-4 w-4 mr-2" /> {tr.progressive[lang]} {lang === 'PT' ? '(padrão)' : lang === 'ES' ? '(predet.)' : '(default)'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDurationMin(60); setCustomMin('60'); setMode('countdown'); }}>
                <Hourglass className="h-4 w-4 mr-2" /> {tr.countdown[lang]} — 60 min
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDurationMin(45); setCustomMin('45'); setMode('countdown'); }}>
                <Hourglass className="h-4 w-4 mr-2" /> {tr.countdown[lang]} — 45 min
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDurationMin(30); setCustomMin('30'); setMode('countdown'); }}>
                <Hourglass className="h-4 w-4 mr-2" /> {tr.countdown[lang]} — 30 min
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('clock')}>
                <Clock className="h-4 w-4 mr-2" /> {tr.clock[lang]}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider opacity-70">
                {tr.duration[lang]}
              </DropdownMenuLabel>
              <div className="px-2 pb-2 space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  {[15, 30, 45, 60, 75, 90].map((m) => (
                    <button
                      key={m}
                      onClick={(e) => { e.preventDefault(); setDurationMin(m); setCustomMin(String(m)); }}
                      className={cn(
                        'text-xs py-1.5 rounded-md tabular-nums transition-colors',
                        durationMin === m
                          ? 'bg-amber-600 text-white font-bold'
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={1} max={300}
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    onBlur={() => {
                      const n = Math.max(1, Math.min(300, parseInt(customMin || '0', 10) || 0));
                      if (n > 0) { setDurationMin(n); setCustomMin(String(n)); }
                      else setCustomMin(String(durationMin));
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder={tr.custom[lang]}
                    className={cn(
                      'flex-1 rounded px-2 py-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500',
                      isDark ? 'bg-slate-950 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900',
                    )}
                  />
                  <span className={cn('text-[11px]', subtitleColor)}>{tr.minutes[lang]}</span>
                </div>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setSoundEnabled((v) => !v); }}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-60" />}
                  {tr.alertSound[lang]}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                    soundEnabled
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-500/15 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/30',
                  )}
                >
                  {soundEnabled ? tr.on[lang] : tr.off[lang]}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button onClick={resetTimer} className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)} aria-label="reset">
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className={cn('w-px h-5 mx-1', isDark ? 'bg-slate-800' : 'bg-slate-300')} />

          {/* Quick panels — escondidos individuais em XS, sempre via "More" */}
          <button onClick={() => setNotesOpen(true)} className={cn('hidden sm:inline-flex p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)} aria-label="notes">
            <PenLine className="h-4 w-4" />
          </button>
          <button onClick={() => setBibleOpen(true)} className={cn('hidden sm:inline-flex p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)} aria-label="bible">
            <BookOpen className="h-4 w-4" />
          </button>
          <button onClick={() => setOriginalOpen(true)} className={cn('hidden sm:inline-flex p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)} aria-label="original">
            <Languages className="h-4 w-4" />
          </button>
          <button onClick={() => setIllusOpen(true)} className={cn('hidden sm:inline-flex p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)} aria-label="illustrations">
            <ImageIcon className="h-4 w-4" />
          </button>

          {/* Mobile: agrupa todos os painéis num "More" */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn('sm:hidden p-1.5 rounded-md transition-colors', iconBtn)} aria-label="more tools">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={dropdownBg}>
              <DropdownMenuItem onClick={() => setNotesOpen(true)}>
                <PenLine className="h-4 w-4 mr-2" /> {tr.preacherNotes[lang]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBibleOpen(true)}>
                <BookOpen className="h-4 w-4 mr-2" /> {tr.bibleVersions[lang]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOriginalOpen(true)}>
                <Languages className="h-4 w-4 mr-2" /> {tr.originalLang[lang]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIllusOpen(true)}>
                <ImageIcon className="h-4 w-4 mr-2" /> {tr.illustrations[lang]}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Settings (font + share) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)} aria-label="settings">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn(dropdownBg, 'w-56')}>
              <DropdownMenuLabel>{tr.fontSize[lang]}</DropdownMenuLabel>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button onClick={() => setFontPx((f) => Math.max(16, f - 2))} className={cn('flex-1 flex items-center justify-center gap-1 p-2 rounded', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}>
                  <Minus className="h-3 w-3" /> <span className="text-sm">a</span>
                </button>
                <span className={cn('text-xs tabular-nums w-10 text-center', subtitleColor)}>{fontPx}px</span>
                <button onClick={() => setFontPx((f) => Math.min(64, f + 2))} className={cn('flex-1 flex items-center justify-center gap-1 p-2 rounded', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}>
                  <Plus className="h-3 w-3" /> <span className="text-base font-bold">A</span>
                </button>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> {tr.share[lang]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> {tr.download[lang]}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> {tr.print[lang]}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── Sermão em cartões ─── */}
      <main ref={scrollerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 md:px-10 py-5 sm:py-10 space-y-4 sm:space-y-7">
          {cards.length === 0 && (
            <div className={cn('text-center py-20', isDark ? 'text-slate-500' : 'text-slate-400')}>
              <Maximize2 className="h-10 w-10 mx-auto mb-4 opacity-40" />
              <p>{lang === 'PT' ? 'Sermão vazio.' : 'Empty sermon.'}</p>
            </div>
          )}

          {cards.map((c) => {
            const meta = BLOCK_META[c.tone];
            const isEditing = editingId === c.id;
            // Modo Claro: usa paleta vibrante identitária do bloco. Modo Escuro: mantém superfície dark, só pinta a borda.
            const cardSurface = isDark
              ? cn(cardBg, meta.darkBorderLeft)
              : c.isQuote
              ? cn(cardQuoteBg, meta.lightBorderLeft)
              : cn(meta.lightCardBg, meta.lightBorderLeft);
            return (
              <section
                key={c.id}
                className={cn(
                  'relative rounded-2xl border shadow-sm transition-shadow w-full min-w-0 break-words',
                  cardSurface,
                  isEditing && (isDark ? 'ring-2 ring-amber-500/60' : 'ring-2 ring-amber-500'),
                )}
              >
                {/* Badge flutuante + ações */}
                <div className="flex items-start justify-between gap-2 px-3 sm:px-6 pt-3 sm:pt-5">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ring-1',
                    meta.badgeClass,
                  )}>
                    <span className="text-sm leading-none">{meta.emoji}</span>
                    <span>{meta.label[lang]}</span>
                  </span>

                  {/* Botão lápis (sempre visível em hover desktop, sempre em mobile) */}
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(c)}
                      className={cn(
                        'p-1.5 rounded-md opacity-60 hover:opacity-100 transition-opacity shrink-0',
                        iconBtn,
                      )}
                      aria-label={tr.editBlock[lang]}
                      title={`${tr.editBlock[lang]} — ${tr.doubleClickHint[lang]}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={cancelEdit}
                        className={cn('p-1.5 rounded-md', iconBtn)}
                        aria-label="cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => commitEdit(c)}
                        className="p-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-500"
                        aria-label={tr.saveEdit[lang]}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Heading visual (subtítulo) — usa cor identitária do bloco */}
                {c.heading && (
                  <h3
                    className={cn(
                      'font-sans font-bold tracking-tight px-3 sm:px-6 pt-3 break-words',
                      isDark ? meta.darkHeading : meta.lightHeading,
                    )}
                    style={{ fontSize: `clamp(16px, ${Math.round(fontPx * 0.85)}px, ${Math.round(fontPx * 0.85)}px)`, lineHeight: 1.2 }}
                  >
                    {c.heading.replace(/^[\p{Emoji}\s]+/u, '').trim() || c.heading}
                  </h3>
                )}

                {/* Corpo: leitura ou edição */}
                <div
                  className="px-3 sm:px-6 py-3 sm:py-5 min-w-0"
                  onDoubleClick={() => !isEditing && startEdit(c)}
                >
                  {isEditing ? (
                    <Textarea
                      value={editingDraft}
                      onChange={(e) => setEditingDraft(e.target.value)}
                      autoFocus
                      className={cn(
                        'w-full min-h-[200px] resize-y border-0 focus-visible:ring-0 px-0 font-sans',
                        isDark ? 'bg-transparent text-white placeholder:text-slate-500' : 'bg-transparent text-slate-900',
                      )}
                      style={{ fontSize: `${Math.min(fontPx, 22)}px`, lineHeight: 1.7 }}
                    />
                  ) : (
                    <PodiumMarkdown text={c.body} isQuote={c.isQuote} fontPx={fontPx} theme={theme} />
                  )}
                </div>
              </section>
            );
          })}
          <div className="h-32" />
        </div>
      </main>

      {/* ─── Painéis flutuantes ─── */}
      <SlidePanel open={notesOpen} onClose={() => setNotesOpen(false)} title={tr.preacherNotes[lang]} theme={theme}>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={tr.notesPlaceholder[lang]}
          rows={20}
          className={cn(
            'text-base resize-none min-h-[60vh]',
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900',
          )}
        />
        <Button
          onClick={async () => {
            await saveNotes();
            setNotesOpen(false);
          }}
          disabled={savingNotes}
          className="mt-3 w-full bg-amber-600 hover:bg-amber-500 text-white"
        >
          {savingNotes ? '...' : tr.saveNotes[lang]}
        </Button>
      </SlidePanel>

      <SlidePanel open={bibleOpen} onClose={() => setBibleOpen(false)} title={tr.bibleVersions[lang]} theme={theme}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={bibleQuery}
              onChange={(e) => setBibleQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultBible()}
              placeholder={tr.searchVerse[lang]}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500',
                isDark ? 'bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500' : 'bg-white border border-slate-300 text-slate-900',
              )}
            />
            <Button onClick={consultBible} disabled={bibleLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {bibleLoading ? tr.loading[lang] : tr.consult[lang]}
            </Button>
          </div>
          {bibleResult && (
            <div className={cn('rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed', isDark ? 'bg-slate-950 border border-slate-800 text-slate-200' : 'bg-slate-50 border border-slate-200 text-slate-800')}>
              {bibleResult}
            </div>
          )}
        </div>
      </SlidePanel>

      <SlidePanel open={originalOpen} onClose={() => setOriginalOpen(false)} title={tr.originalLang[lang]} theme={theme}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={origQuery}
              onChange={(e) => setOrigQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultOriginal()}
              placeholder={tr.searchOriginal[lang]}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500',
                isDark ? 'bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500' : 'bg-white border border-slate-300 text-slate-900',
              )}
            />
            <Button onClick={consultOriginal} disabled={origLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {origLoading ? tr.loading[lang] : tr.consult[lang]}
            </Button>
          </div>
          {origResult && (
            <div className={cn('rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed font-serif', isDark ? 'bg-slate-950 border border-slate-800 text-slate-200' : 'bg-slate-50 border border-slate-200 text-slate-800')}>
              {origResult}
            </div>
          )}
        </div>
      </SlidePanel>

      <SlidePanel open={illusOpen} onClose={() => setIllusOpen(false)} title={tr.illustrations[lang]} theme={theme}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={illusQuery}
              onChange={(e) => setIllusQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultIllus()}
              placeholder={tr.searchIllus[lang]}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500',
                isDark ? 'bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500' : 'bg-white border border-slate-300 text-slate-900',
              )}
            />
            <Button onClick={consultIllus} disabled={illusLoading} className="bg-amber-600 hover:bg-amber-500 text-white">
              {illusLoading ? tr.loading[lang] : tr.consult[lang]}
            </Button>
          </div>
          {illusResult && (
            <div className={cn('rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed', isDark ? 'bg-slate-950 border border-slate-800 text-slate-200' : 'bg-slate-50 border border-slate-200 text-slate-800')}>
              {illusResult}
            </div>
          )}
        </div>
      </SlidePanel>
    </div>
  );
}
