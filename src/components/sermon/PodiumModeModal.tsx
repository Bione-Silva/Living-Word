import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  MonitorSmartphone,
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
import { splitByVerseRefs } from '@/lib/verse-highlighter';
import { BibleCompareSheet } from './BibleCompareSheet';
import { useAuth } from '@/contexts/AuthContext';

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
  alertTone: { PT: 'Tom do alerta', EN: 'Alert tone', ES: 'Tono de alerta' },
  toneBell: { PT: 'Sino suave', EN: 'Soft bell', ES: 'Campana suave' },
  toneGong: { PT: 'Gongo', EN: 'Gong', ES: 'Gong' },
  toneSilent: { PT: 'Silencioso', EN: 'Silent', ES: 'Silencioso' },
  keepScreenOn: { PT: 'Manter tela ligada', EN: 'Keep screen on', ES: 'Mantener pantalla encendida' },
  testTone: { PT: 'Testar', EN: 'Test', ES: 'Probar' },
  warningTime: { PT: 'Pré-aviso sonoro', EN: 'Audible pre-warning', ES: 'Pre-aviso sonoro' },
  warningTimeHint: {
    PT: 'Antes do fim do regressivo',
    EN: 'Before countdown ends',
    ES: 'Antes del final del regresivo',
  },
  amberAlert: { PT: 'Aviso âmbar', EN: 'Amber warning', ES: 'Aviso ámbar' },
  amberAlertHint: {
    PT: 'Quando o cronômetro fica âmbar pulsante',
    EN: 'When the timer turns pulsing amber',
    ES: 'Cuándo el cronómetro se vuelve ámbar',
  },
  secondsShort: { PT: 's', EN: 's', ES: 's' },
  minutesShort: { PT: 'min', EN: 'min', ES: 'min' },
  warningOff: { PT: 'Sem aviso', EN: 'No warning', ES: 'Sin aviso' },
};

/* ─── Detecção de tipo de bloco a partir do heading ─── */
export type BlockTone = 'idea' | 'hook' | 'passage' | 'illustration' | 'application' | 'main' | 'conclusion' | 'original' | 'transition' | 'quote' | 'explanation' | 'doctrine' | 'objection' | 'appeal' | 'generic';

export interface BlockMeta {
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

export const BLOCK_META: Record<BlockTone, BlockMeta> = {
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

export function detectBlockTone(heading?: string): BlockTone {
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
export interface Card {
  id: string;
  heading?: string;
  body: string;
  isQuote: boolean;
  tone: BlockTone;
  /** índice das linhas originais [start, end) para reescrever o markdown ao editar */
  range: [number, number];
}

export function splitIntoCards(md: string): Card[] {
  // Defesa: aceita undefined/null sem quebrar (sermões antigos podem ter content nulo).
  if (typeof md !== 'string' || !md.trim()) return [];
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
    // Aceita headings de qualquer nível (#, ##, ###, ####) — sermões IA frequentemente usam ###
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      push(i);
      cur = { heading: hMatch[2].trim(), bodyStart: i + 1, headingLine: i };
      continue;
    }
    if (!cur) cur = { heading: undefined, bodyStart: i, headingLine: null };
  }
  push(lines.length);

  // Fallback robusto: se markdown é puro texto sem headings, ainda renderiza 1 card único
  // — evita que o púlpito apareça vazio (tela escura) com sermões IA antigos.
  if (cards.length === 0) {
    const body = md.trim();
    if (body) {
      cards.push({
        id: 'card_0',
        heading: undefined,
        body,
        isQuote: body.split('\n').every((l) => l.startsWith('>') || !l.trim()),
        tone: 'generic',
        range: [0, lines.length],
      });
    }
  }
  return cards;
}

/** Aplica negrito em números de versículo: "16 Porque..." -> "**16** Porque..." */
export function bolderVerseNumbers(text: string): string {
  // Defesa: pode receber undefined/null vindo de cards corrompidos do histórico.
  if (typeof text !== 'string' || !text) return '';
  return text
    .replace(/^(\s*>?\s*)(\d{1,3})(\s+)/gm, '$1**$2**$3')
    .replace(/(?<=[.!?]\s)(\d{1,3})(\s+)/g, '**$1**$2');
}

/** Mapeamento tom → classe Tailwind para destacar referências bíblicas inline. */
const VERSE_REF_LIGHT: Record<BlockTone, string> = {
  idea: 'bg-purple-100 text-purple-800 ring-purple-300',
  hook: 'bg-orange-100 text-orange-800 ring-orange-300',
  passage: 'bg-sky-100 text-sky-800 ring-sky-300',
  illustration: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  application: 'bg-orange-100 text-orange-900 ring-orange-400',
  main: 'bg-blue-100 text-blue-800 ring-blue-300',
  conclusion: 'bg-rose-100 text-rose-800 ring-rose-300',
  original: 'bg-amber-100 text-amber-900 ring-amber-400',
  transition: 'bg-slate-100 text-slate-800 ring-slate-300',
  quote: 'bg-yellow-100 text-yellow-900 ring-yellow-400',
  explanation: 'bg-violet-100 text-violet-800 ring-violet-300',
  doctrine: 'bg-indigo-100 text-indigo-800 ring-indigo-300',
  objection: 'bg-amber-100 text-amber-900 ring-amber-400',
  appeal: 'bg-red-100 text-red-800 ring-red-300',
  generic: 'bg-slate-100 text-slate-800 ring-slate-300',
};

const VERSE_REF_DARK: Record<BlockTone, string> = {
  idea: 'bg-purple-500/20 text-purple-200 ring-purple-400/40',
  hook: 'bg-orange-500/20 text-orange-200 ring-orange-400/40',
  passage: 'bg-sky-500/20 text-sky-200 ring-sky-400/40',
  illustration: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40',
  application: 'bg-orange-600/25 text-orange-200 ring-orange-500/40',
  main: 'bg-blue-500/20 text-blue-200 ring-blue-400/40',
  conclusion: 'bg-rose-500/20 text-rose-200 ring-rose-400/40',
  original: 'bg-amber-700/25 text-amber-200 ring-amber-500/40',
  transition: 'bg-slate-500/20 text-slate-200 ring-slate-400/40',
  quote: 'bg-yellow-500/20 text-yellow-200 ring-yellow-400/40',
  explanation: 'bg-violet-500/20 text-violet-200 ring-violet-400/40',
  doctrine: 'bg-indigo-500/20 text-indigo-200 ring-indigo-400/40',
  objection: 'bg-amber-500/20 text-amber-200 ring-amber-400/40',
  appeal: 'bg-red-500/20 text-red-200 ring-red-400/40',
  generic: 'bg-slate-500/20 text-slate-200 ring-slate-400/40',
};

/** Renderiza markdown simples (negrito, citações, listas) com tipografia de Púlpito + destaque de versículos. */
function PodiumMarkdown({
  text,
  isQuote,
  fontPx,
  theme,
  tone = 'generic',
  onVerseClick,
}: {
  text: string;
  isQuote: boolean;
  fontPx: number;
  theme: PodiumTheme;
  tone?: BlockTone;
  /** Callback quando o pregador toca em uma referência bíblica inline. */
  onVerseClick?: (reference: string) => void;
}) {
  const processed = bolderVerseNumbers(text);
  const lines = processed.split('\n');

  const baseColor = theme === 'dark' ? 'text-slate-100/95' : 'text-slate-800';
  const strongColor = theme === 'dark' ? 'text-white' : 'text-slate-950';
  const bulletColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const refClass = theme === 'dark' ? VERSE_REF_DARK[tone] : VERSE_REF_LIGHT[tone];

  const renderRefs = (raw: string, keyBase: string) => {
    const segs = splitByVerseRefs(raw);
    if (segs.length === 1 && segs[0].type === 'text') return raw;
    return segs.map((seg, i) =>
      seg.type === 'ref' ? (
        <button
          key={`${keyBase}-r${i}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onVerseClick?.(seg.value);
          }}
          title={onVerseClick ? (theme === 'dark' ? 'Comparar versões' : 'Comparar versões') : undefined}
          className={cn(
            'inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded-md text-[0.92em] font-semibold ring-1 transition-all',
            refClass,
            onVerseClick && 'cursor-pointer hover:ring-2 hover:scale-[1.03] active:scale-[0.97]',
          )}
        >
          {seg.value}
        </button>
      ) : (
        <span key={`${keyBase}-t${i}`}>{seg.value}</span>
      ),
    );
  };

  const renderInline = (s: string, keyBase: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
      const k = `${keyBase}-${i}`;
      if (p.startsWith('**') && p.endsWith('**')) {
        return (
          <strong key={k} className={cn(strongColor, 'font-bold')}>
            {renderRefs(p.slice(2, -2), k)}
          </strong>
        );
      }
      if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
        return <em key={k} className="italic">{renderRefs(p.slice(1, -1), k)}</em>;
      }
      return <span key={k}>{renderRefs(p, k)}</span>;
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
              <span>{renderInline(t.slice(2), `l${i}`)}</span>
            </div>
          );
        }
        return <p key={i} className="tracking-[0.005em]">{renderInline(t, `l${i}`)}</p>;
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
  const { profile, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<PodiumTheme>('dark');
  const isDark = theme === 'dark';

  /* ─── Comparar versões bíblicas ─── */
  const [compareRef, setCompareRef] = useState<string | null>(null);

  /* ─── Tipografia ─── */
  const [fontPx, setFontPx] = useState(28);

  /* ─── Markdown editável (espelha prop, mas permite edição in-place) ─── */
  // Defesa: prop pode chegar undefined/null em sermões antigos, vindos do histórico.
  // Sem coerção, .split() e regex em string vazia/null derrubam o React (tela preta no iOS).
  const safeMarkdown = typeof sermonMarkdown === 'string' ? sermonMarkdown : '';
  const [localMd, setLocalMd] = useState<string>(safeMarkdown);
  useEffect(() => { setLocalMd(safeMarkdown); }, [safeMarkdown]);

  /* ─── Cartões do sermão ─── */
  const cards = useMemo(() => {
    try {
      return splitIntoCards(localMd);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[PodiumModeModal] splitIntoCards falhou:', e);
      return [];
    }
  }, [localMd]);

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
  /** Pré-aviso aos 5 minutos restantes — dispara uma única vez por ciclo. */
  const warningAlertFiredRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  /** Opções (em minutos) para o pré-aviso suave antes do fim. 0 = desligado. */
  const WARNING_OPTIONS_MIN = [0, 3, 5, 7, 10] as const;
  type WarningMinutes = (typeof WARNING_OPTIONS_MIN)[number];
  /** Minutos antes do fim para o pré-aviso suave (configurável, persistido). */
  const [warningMinutes, setWarningMinutes] = useState<WarningMinutes>(() => {
    if (typeof window === 'undefined') return 5;
    try {
      const v = window.localStorage.getItem('podium:warningMinutes');
      const n = v == null ? NaN : parseInt(v, 10);
      if ((WARNING_OPTIONS_MIN as readonly number[]).includes(n)) return n as WarningMinutes;
      // Migração: valor antigo 1 vira 3 (opção válida mais próxima)
      if (n === 1) return 3;
      return 5;
    } catch {
      return 5;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('podium:warningMinutes', String(warningMinutes));
    } catch {
      /* noop */
    }
  }, [warningMinutes]);
  const WARNING_THRESHOLD_SECONDS = warningMinutes * 60;

  /** Opções (em segundos) para quando o cronômetro fica âmbar pulsante. */
  const AMBER_OPTIONS_SEC = [15, 30, 60, 120] as const;
  type AmberSeconds = (typeof AMBER_OPTIONS_SEC)[number];
  /** Segundos antes do fim para aviso visual âmbar pulsante (configurável, persistido). */
  const [amberSeconds, setAmberSeconds] = useState<AmberSeconds>(() => {
    if (typeof window === 'undefined') return 30;
    try {
      const v = window.localStorage.getItem('podium:amberSeconds');
      const n = v == null ? NaN : parseInt(v, 10);
      return (AMBER_OPTIONS_SEC as readonly number[]).includes(n) ? (n as AmberSeconds) : 30;
    } catch {
      return 30;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('podium:amberSeconds', String(amberSeconds));
    } catch {
      /* noop */
    }
  }, [amberSeconds]);
  const IMMINENT_END_SECONDS = amberSeconds;

  /** Tom do alerta sonoro persistido. 'silent' substitui o antigo OFF. */
  type AlertTone = 'bell' | 'gong' | 'silent';
  const [alertTone, setAlertTone] = useState<AlertTone>(() => {
    if (typeof window === 'undefined') return 'bell';
    try {
      const v = window.localStorage.getItem('podium:alertTone');
      if (v === 'bell' || v === 'gong' || v === 'silent') return v;
      // Migração do toggle antigo: '0' = silencioso, '1' (ou ausente) = bell
      const legacy = window.localStorage.getItem('podium:alertSound');
      if (legacy === '0') return 'silent';
      return 'bell';
    } catch {
      return 'bell';
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('podium:alertTone', alertTone);
    } catch {
      /* storage indisponível: ok */
    }
  }, [alertTone]);
  const soundEnabled = alertTone !== 'silent';

  /** Wake Lock — mantém a tela ligada durante a pregação. Persistido em localStorage. */
  const [keepScreenOn, setKeepScreenOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const v = window.localStorage.getItem('podium:keepScreenOn');
      return v === null ? true : v === '1';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('podium:keepScreenOn', keepScreenOn ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [keepScreenOn]);

  // Wake Lock API: solicita enquanto modal aberto + toggle ligado; reativa ao voltar de background.
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  useEffect(() => {
    if (!open || !keepScreenOn) {
      setWakeLockActive(false);
      return;
    }
    let cancelled = false;
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } }) : null;
    if (!nav?.wakeLock) {
      setWakeLockActive(false);
      return; // iOS Safari < 16.4 não suporta — silencioso
    }

    const request = async () => {
      try {
        const sentinel = await nav.wakeLock!.request('screen');
        if (cancelled) {
          void sentinel.release().catch(() => {});
          return;
        }
        wakeLockRef.current = sentinel;
        setWakeLockActive(true);
        sentinel.addEventListener('release', () => {
          setWakeLockActive(false);
          // Se ainda devemos manter ligada e o doc estiver visível, re-solicita.
          if (!cancelled && keepScreenOn && document.visibilityState === 'visible') {
            void request();
          }
        });
      } catch {
        setWakeLockActive(false);
        /* permissão negada ou bateria fraca — silencioso */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && keepScreenOn && !wakeLockRef.current) {
        void request();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    void request();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (wakeLockRef.current) {
        void wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      setWakeLockActive(false);
    };
  }, [open, keepScreenOn]);

  /** Garante AudioContext criado/retomado (iOS exige após gesto). */
  function ensureAudioCtx(): AudioContext | null {
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (!Ctx) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  /** Sino suave: 3 toques senoidais (A5 → E6 → A5). */
  function playBellSequence() {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
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
    tone(0.0, 880);
    tone(0.55, 1318.5);
    tone(1.1, 880);
  }

  /** Gongo: tom grave (110Hz) com harmônicos e decay longo, ressonante. */
  function playGongSequence() {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const fundamentals = [110, 165, 220]; // A2, E3, A3
    fundamentals.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const peak = i === 0 ? 0.28 : 0.12;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.6);
    });
  }

  /** Alerta de fim do regressivo. Respeita tom + dispara vibração. */
  function playEndAlert() {
    if (alertTone === 'silent') return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([400, 150, 400, 150, 600]);
      }
    } catch {
      /* noop */
    }
    try {
      if (alertTone === 'gong') playGongSequence();
      else playBellSequence();
    } catch {
      /* audio bloqueado: silencioso por design */
    }
  }

  /** Pré-aviso suave aos 5 minutos: sino único discreto + vibração curta. */
  function playWarningAlert() {
    if (alertTone === 'silent') return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(250);
      }
    } catch {
      /* noop */
    }
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Gongo usa freq mais grave de pré-aviso; sino usa E5.
      osc.type = 'sine';
      osc.frequency.value = alertTone === 'gong' ? 220 : 659.25;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch {
      /* audio bloqueado: silencioso por design */
    }
  }

  /** Toca um teste curto do tom selecionado para o pastor conferir. */
  function testCurrentTone() {
    if (alertTone === 'silent') {
      try { navigator.vibrate?.(120); } catch { /* noop */ }
      return;
    }
    if (alertTone === 'gong') playGongSequence();
    else playBellSequence();
  }

  useEffect(() => {
    setRunning(false);
    endAlertFiredRef.current = false; // reset ao trocar de modo / duração
    warningAlertFiredRef.current = false;
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
            // Pré-aviso suave: apenas se configurado (>0) e a duração total for maior que o limiar.
            if (
              warningMinutes > 0 &&
              next === WARNING_THRESHOLD_SECONDS &&
              s > WARNING_THRESHOLD_SECONDS &&
              limitSeconds > WARNING_THRESHOLD_SECONDS &&
              !warningAlertFiredRef.current
            ) {
              warningAlertFiredRef.current = true;
              playWarningAlert();
            }
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
    // Pré-aviso: rearma quando o tempo restante volta a ficar acima do limiar (ex: após reset).
    if (mode !== 'countdown' || seconds > WARNING_THRESHOLD_SECONDS) {
      warningAlertFiredRef.current = false;
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
    warningAlertFiredRef.current = false; // rearma o pré-aviso de 5min
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
  // Aviso visual sutil: faltando 30s ou menos (mas ainda > 0) — fundo âmbar pulsante.
  const imminentEnd = mode === 'countdown' && seconds > 0 && seconds <= IMMINENT_END_SECONDS;
  const timerBg = timerAlert
    ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse shadow-lg shadow-red-500/40'
    : imminentEnd
    ? (isDark
        ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/60 animate-pulse shadow-md shadow-amber-500/20'
        : 'bg-amber-100 text-amber-800 ring-1 ring-amber-400/70 animate-pulse shadow-md shadow-amber-500/20')
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

  // Renderiza via portal no document.body para escapar contenções de layout do
  // AppLayout (overflow:auto no <main>, transforms herdados, etc.) que em iOS Safari
  // podem fazer o modal `fixed` aparecer em branco/preto sem cabeçalho.
  return createPortal(
    <div
      className={cn('fixed inset-0 z-[200] flex flex-col overflow-x-hidden', bgRoot)}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
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
                title={
                  running
                    ? (lang === 'EN' ? 'Pause timer' : lang === 'ES' ? 'Pausar temporizador' : 'Pausar cronômetro')
                    : (lang === 'EN' ? 'Start timer' : lang === 'ES' ? 'Iniciar temporizador' : 'Iniciar cronômetro')
                }
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Indicador discreto de Wake Lock ativo (tela não vai apagar) — ícone próprio (MonitorSmartphone) para NÃO confundir com toggle de tema */}
          {wakeLockActive && (
            <div
              className={cn(
                'relative p-1.5 sm:p-2 rounded-md',
                isDark ? 'text-emerald-300' : 'text-emerald-600',
              )}
              role="status"
              aria-live="polite"
              aria-label={
                lang === 'EN'
                  ? 'Anti-sleep mode active: your screen will not turn off during preaching'
                  : lang === 'ES'
                  ? 'Modo anti-bloqueo activo: la pantalla no se apagará durante la predicación'
                  : 'Modo anti-bloqueio ativo: a tela não vai apagar durante a pregação'
              }
              title={
                lang === 'EN'
                  ? '🖥️📱 Anti-sleep mode active\nYour screen (computer or phone) will stay on during the entire sermon — no need to touch it.'
                  : lang === 'ES'
                  ? '🖥️📱 Modo anti-bloqueo activo\nTu pantalla (computadora o móvil) permanecerá encendida durante toda la predicación — sin necesidad de tocarla.'
                  : '🖥️📱 Modo anti-bloqueio ativo\nSua tela (computador ou celular) ficará ligada durante toda a pregação — sem precisar tocar nela.'
              }
            >
              <MonitorSmartphone className="h-4 w-4" />
              <span
                className={cn(
                  'absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2',
                  isDark ? 'ring-slate-900' : 'ring-white',
                )}
                aria-hidden="true"
              />
            </div>
          )}

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
            title={tr.exit[lang]}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Linha 2 — ações secundárias (compactam em mobile dentro de "More") */}
        <div className={cn('flex items-center gap-1 px-3 sm:px-4 pb-2 -mt-1 border-t pt-2', headerBorder)}>
          {/* Timer mode dropdown — botão obvio com texto "Configurar Timer" + indicador do valor atual */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-md transition-colors text-xs font-semibold cursor-pointer',
                  isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800 ring-1 ring-slate-700/60'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200 ring-1 ring-slate-300',
                )}
                aria-label={lang === 'PT' ? 'Configurar Timer' : lang === 'ES' ? 'Configurar Temporizador' : 'Configure Timer'}
                title={lang === 'PT' ? 'Configurar Timer — modo, duração, alertas sonoros e wake lock' : lang === 'ES' ? 'Configurar Temporizador — modo, duración, alertas sonoras' : 'Configure Timer — mode, duration, sound alerts'}
              >
                {mode === 'countdown' && <Hourglass className="h-4 w-4" />}
                {mode === 'progressive' && <Timer className="h-4 w-4" />}
                {mode === 'clock' && <Clock className="h-4 w-4" />}
                <span className="inline">
                  {lang === 'PT' ? 'Timer' : lang === 'ES' ? 'Timer' : 'Timer'}
                </span>
                {/* Indicador visual do valor atual configurado */}
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums leading-none',
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
                      : 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/40',
                  )}
                  aria-label={
                    mode === 'countdown'
                      ? `${durationMin} ${tr.minutes[lang]}`
                      : mode === 'progressive'
                      ? tr.progressive[lang]
                      : tr.clock[lang]
                  }
                >
                  {mode === 'countdown' && `${durationMin}m`}
                  {mode === 'progressive' && (lang === 'PT' ? 'Prog.' : lang === 'ES' ? 'Prog.' : 'Prog.')}
                  {mode === 'clock' && (lang === 'PT' ? 'Hora' : lang === 'ES' ? 'Hora' : 'Time')}
                </span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className={cn(dropdownBg, 'w-64 z-[200]')}>
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
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{tr.alertTone[lang]}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); testCurrentTone(); }}
                  className={cn(
                    'text-[10px] font-semibold normal-case tracking-normal px-2 py-0.5 rounded-md transition-colors',
                    isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  )}
                >
                  {tr.testTone[lang]}
                </button>
              </DropdownMenuLabel>
              <div className="px-2 pb-2 grid grid-cols-3 gap-1">
                {([
                  { key: 'bell' as const, label: tr.toneBell[lang], icon: <Volume2 className="h-3 w-3" /> },
                  { key: 'gong' as const, label: tr.toneGong[lang], icon: <Volume2 className="h-3 w-3" /> },
                  { key: 'silent' as const, label: tr.toneSilent[lang], icon: <VolumeX className="h-3 w-3 opacity-70" /> },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={(e) => { e.preventDefault(); setAlertTone(opt.key); }}
                    className={cn(
                      'flex flex-col items-center gap-1 text-[10px] py-1.5 rounded-md transition-colors',
                      alertTone === opt.key
                        ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-400'
                        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{tr.warningTime[lang]}</span>
                <span className={cn('text-[9px] font-normal normal-case tracking-normal', subtitleColor)}>
                  {tr.warningTimeHint[lang]}
                </span>
              </DropdownMenuLabel>
              <div className="px-2 pb-2 grid grid-cols-5 gap-1">
                {WARNING_OPTIONS_MIN.map((m) => (
                  <button
                    key={m}
                    onClick={(e) => { e.preventDefault(); setWarningMinutes(m); }}
                    className={cn(
                      'text-[10px] py-1.5 rounded-md tabular-nums transition-colors',
                      warningMinutes === m
                        ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-400'
                        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                    title={m === 0 ? tr.warningOff[lang] : `${m} ${tr.minutesShort[lang]}`}
                  >
                    {m === 0 ? '—' : `${m}${tr.minutesShort[lang]}`}
                  </button>
                ))}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider opacity-70 flex items-center justify-between">
                <span>{tr.amberAlert[lang]}</span>
                <span className={cn('text-[9px] font-normal normal-case tracking-normal', subtitleColor)}>
                  {tr.amberAlertHint[lang]}
                </span>
              </DropdownMenuLabel>
              <div className="px-2 pb-2 grid grid-cols-4 gap-1">
                {AMBER_OPTIONS_SEC.map((s) => {
                  const label = s < 60 ? `${s}${tr.secondsShort[lang]}` : `${s / 60}${tr.minutesShort[lang]}`;
                  return (
                    <button
                      key={s}
                      onClick={(e) => { e.preventDefault(); setAmberSeconds(s); }}
                      className={cn(
                        'text-[10px] py-1.5 rounded-md tabular-nums transition-colors',
                        amberSeconds === s
                          ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-400'
                          : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      )}
                      title={label}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setKeepScreenOn((v) => !v); }}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs">
                  <Sun className="h-4 w-4" />
                  {tr.keepScreenOn[lang]}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                    keepScreenOn
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-500/15 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/30',
                  )}
                >
                  {keepScreenOn ? tr.on[lang] : tr.off[lang]}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={resetTimer}
            className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)}
            aria-label={lang === 'PT' ? 'Reiniciar cronômetro' : lang === 'ES' ? 'Reiniciar temporizador' : 'Reset timer'}
            title={lang === 'PT' ? 'Reiniciar cronômetro (volta ao tempo inicial)' : lang === 'ES' ? 'Reiniciar temporizador' : 'Reset timer'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className={cn('w-px h-5 mx-1', isDark ? 'bg-slate-800' : 'bg-slate-300')} />

          {/* Quick panels — botões individuais só em desktop (lg+). Mobile + tablet usam o "More". */}
          <button
            onClick={() => setNotesOpen(true)}
            className={cn('hidden lg:inline-flex p-2 rounded-md transition-colors', iconBtn)}
            aria-label={tr.preacherNotes[lang]}
            title={tr.preacherNotes[lang]}
          >
            <PenLine className="h-4 w-4" />
          </button>
          <button
            onClick={() => setBibleOpen(true)}
            className={cn('hidden lg:inline-flex p-2 rounded-md transition-colors', iconBtn)}
            aria-label={tr.bibleVersions[lang]}
            title={tr.bibleVersions[lang]}
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOriginalOpen(true)}
            className={cn('hidden lg:inline-flex p-2 rounded-md transition-colors', iconBtn)}
            aria-label={tr.originalLang[lang]}
            title={tr.originalLang[lang]}
          >
            <Languages className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIllusOpen(true)}
            className={cn('hidden lg:inline-flex p-2 rounded-md transition-colors', iconBtn)}
            aria-label={tr.illustrations[lang]}
            title={tr.illustrations[lang]}
          >
            <ImageIcon className="h-4 w-4" />
          </button>

          {/* Mobile + tablet (até lg): agrupa todos os painéis num "More" */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn('lg:hidden p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)}
                aria-label={lang === 'PT' ? 'Mais ferramentas' : lang === 'ES' ? 'Más herramientas' : 'More tools'}
                title={lang === 'PT' ? 'Mais ferramentas (Anotações, Bíblia, Original, Ilustrações)' : lang === 'ES' ? 'Más herramientas' : 'More tools'}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className={cn(dropdownBg, 'z-[200]')}>
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
              <button
                type="button"
                className={cn('p-1.5 sm:p-2 rounded-md transition-colors', iconBtn)}
                aria-label={lang === 'PT' ? 'Configurações (fonte e compartilhar)' : lang === 'ES' ? 'Ajustes (fuente y compartir)' : 'Settings (font and share)'}
                title={lang === 'PT' ? 'Configurações: tamanho da fonte e compartilhar link' : lang === 'ES' ? 'Ajustes: tamaño de fuente y compartir enlace' : 'Settings: font size and share link'}
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className={cn(dropdownBg, 'w-56 z-[200]')}>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── Sermão em cartões ─── */}
      <main ref={scrollerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 md:px-10 py-5 sm:py-10 space-y-4 sm:space-y-7">
          {cards.length === 0 && (
            <div className={cn('text-center py-20 px-4', isDark ? 'text-slate-400' : 'text-slate-500')}>
              <Maximize2 className="h-10 w-10 mx-auto mb-4 opacity-40" />
              <p className="text-base font-semibold mb-2">
                {lang === 'PT' ? 'Sermão vazio' : lang === 'ES' ? 'Sermón vacío' : 'Empty sermon'}
              </p>
              <p className="text-sm opacity-80 mb-6 max-w-sm mx-auto">
                {lang === 'PT'
                  ? 'Não foi possível carregar o conteúdo deste sermão. Volte ao editor e verifique se há texto salvo.'
                  : lang === 'ES'
                  ? 'No se pudo cargar el contenido. Vuelva al editor y verifique si hay texto guardado.'
                  : 'Could not load this sermon content. Go back to the editor and check if there is saved text.'}
              </p>
              <button
                onClick={() => onOpenChange(false)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors',
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-white ring-1 ring-slate-700'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900 ring-1 ring-slate-300',
                )}
              >
                <X className="h-4 w-4" />
                {tr.exit[lang]}
              </button>
            </div>
          )}

          {cards.map((c, idx) => {
            const meta = BLOCK_META[c.tone];
            const isEditing = editingId === c.id;
            const stepNumber = idx + 1;
            // Modo Claro: usa paleta vibrante identitária do bloco. Modo Escuro: mantém superfície dark, só pinta a borda.
            const cardSurface = isDark
              ? cn(cardBg, meta.darkBorderLeft)
              : c.isQuote
              ? cn(cardQuoteBg, meta.lightBorderLeft)
              : cn(meta.lightCardBg, meta.lightBorderLeft);
            // Sanitiza heading: remove "### N.", "## N.", "N." ou "N -" do início para evitar
            // que numeração injetada pela IA polua o subtítulo (numeração agora vem do frontend).
            const cleanHeading = c.heading
              ? c.heading
                  .replace(/^[\p{Emoji}\s]+/u, '')
                  .replace(/^#{1,6}\s*/, '')
                  .replace(/^\d+\s*[.\-—:)]\s*/, '')
                  .trim()
              : '';
            return (
              <div key={c.id} className="relative">
                {/* ─── Mobile: índice discreto na cabeceira (entre cards) ─── */}
                <div
                  className={cn(
                    'lg:hidden flex items-center gap-2 mb-2 px-1',
                    isDark ? 'text-slate-500' : 'text-slate-400',
                  )}
                  aria-hidden="true"
                >
                  <span className="font-mono text-[11px] font-bold tabular-nums tracking-widest">
                    {String(stepNumber).padStart(2, '0')}
                  </span>
                  <span className={cn('h-px flex-1', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
                </div>

                {/* ─── Desktop/iPad: numeral grande à esquerda, fora do card ─── */}
                <span
                  className={cn(
                    'hidden lg:block absolute -left-16 xl:-left-20 top-3 select-none pointer-events-none font-serif font-bold tabular-nums leading-none',
                    isDark ? 'text-slate-700/70' : 'text-slate-300',
                  )}
                  style={{ fontSize: 'clamp(48px, 5.5vw, 72px)' }}
                  aria-hidden="true"
                >
                  {stepNumber}
                </span>

                <section
                  className={cn(
                    'relative rounded-2xl border shadow-sm transition-shadow w-full min-w-0 break-words',
                    cardSurface,
                    isEditing && (isDark ? 'ring-2 ring-amber-500/60' : 'ring-2 ring-amber-500'),
                  )}
                  aria-label={lang === 'PT' ? `Bloco ${stepNumber}` : lang === 'ES' ? `Bloque ${stepNumber}` : `Block ${stepNumber}`}
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
                          aria-label={lang === 'PT' ? 'Cancelar edição' : lang === 'ES' ? 'Cancelar' : 'Cancel'}
                          title={lang === 'PT' ? 'Cancelar edição' : lang === 'ES' ? 'Cancelar' : 'Cancel'}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => commitEdit(c)}
                          className="p-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-500"
                          aria-label={tr.saveEdit[lang]}
                          title={tr.saveEdit[lang]}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Heading visual (subtítulo) — usa cor identitária do bloco */}
                  {cleanHeading && (
                    <h3
                      className={cn(
                        'font-sans font-bold tracking-tight px-3 sm:px-6 pt-3 break-words',
                        isDark ? meta.darkHeading : meta.lightHeading,
                      )}
                      style={{ fontSize: `clamp(16px, ${Math.round(fontPx * 0.85)}px, ${Math.round(fontPx * 0.85)}px)`, lineHeight: 1.2 }}
                    >
                      {cleanHeading}
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
                      <PodiumMarkdown text={c.body} isQuote={c.isQuote} fontPx={fontPx} theme={theme} tone={c.tone} onVerseClick={(ref) => setCompareRef(ref)} />
                    )}
                  </div>
                </section>
              </div>
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

      {/* Comparar versões bíblicas — sheet (mobile) / drawer (desktop) */}
      <BibleCompareSheet
        open={!!compareRef}
        onClose={() => setCompareRef(null)}
        reference={compareRef || ''}
        primaryVersion={profile?.bible_version || 'ARA'}
        defaultCompareVersion2={(profile as { pulpit_compare_version_2?: string | null } | null)?.pulpit_compare_version_2 ?? null}
        defaultCompareVersion3={(profile as { pulpit_compare_version_3?: string | null } | null)?.pulpit_compare_version_3 ?? null}
        lang={lang}
        theme={theme}
        onSaveDefaults={async (v2, v3) => {
          if (!profile?.id) return;
          const { error } = await supabase
            .from('profiles')
            .update({
              pulpit_compare_version_2: v2,
              pulpit_compare_version_3: v3,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);
          if (error) throw error;
          await refreshProfile?.();
        }}
      />
    </div>,
    document.body,
  );
}
