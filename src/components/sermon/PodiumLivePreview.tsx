import { useMemo } from 'react';
import { MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  splitIntoCards,
  BLOCK_META,
  bolderVerseNumbers,
  type Card,
  type BlockTone,
} from './PodiumModeModal';
import { splitByVerseRefs } from '@/lib/verse-highlighter';

type Lang = 'PT' | 'EN' | 'ES';

/** Mapeamento tom → classe Tailwind para destacar referências bíblicas inline. */
const VERSE_REF_CLASS: Record<BlockTone, string> = {
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

interface PodiumLivePreviewProps {
  /** Markdown gerado em tempo real a partir dos blocos do Studio */
  markdown: string;
  /** Título do sermão (Big Idea ou Passagem) */
  title?: string;
  lang?: Lang;
  /** Tamanho de fonte base do preview (px). Default: 17 (preview compacto). */
  fontPx?: number;
  className?: string;
}

const tr = {
  livePreview: { PT: 'Pré-visualização Modo Púlpito', EN: 'Podium Mode Preview', ES: 'Vista previa Modo Púlpito' },
  liveSync: { PT: 'Sincronizado em tempo real', EN: 'Synced in real time', ES: 'Sincronizado en tiempo real' },
  empty: {
    PT: 'Comece a digitar nos blocos à esquerda — o preview aparecerá aqui em tempo real.',
    EN: 'Start typing in the blocks on the left — the preview will appear here in real time.',
    ES: 'Empiece a escribir en los bloques a la izquierda — la vista previa aparecerá aquí en tiempo real.',
  },
};

/** Renderiza markdown inline com negritos/itálicos + destaque de versículos, no estilo Púlpito Claro. */
function InlineMarkdown({
  text,
  isQuote,
  fontPx,
  refClass,
}: {
  text: string;
  isQuote: boolean;
  fontPx: number;
  refClass: string;
}) {
  const processed = bolderVerseNumbers(text);
  const lines = processed.split('\n');

  const renderRefs = (raw: string, keyBase: string) => {
    const segs = splitByVerseRefs(raw);
    if (segs.length === 1 && segs[0].type === 'text') return raw;
    return segs.map((seg, i) =>
      seg.type === 'ref' ? (
        <span
          key={`${keyBase}-r${i}`}
          className={cn(
            'inline-flex items-baseline px-1.5 py-0.5 mx-0.5 rounded-md text-[0.92em] font-semibold ring-1',
            refClass,
          )}
        >
          {seg.value}
        </span>
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
          <strong key={k} className="font-bold text-slate-950">
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
      className={cn(isQuote ? 'font-serif italic' : 'font-sans', 'text-slate-800 space-y-3 break-words')}
      style={{ fontSize: fontPx, lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
    >
      {lines.map((line, i) => {
        const t = line.replace(/^>\s?/, '').trimEnd();
        if (!t) return <div key={i} style={{ height: fontPx * 0.35 }} />;
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-slate-400">•</span>
              <span>{renderInline(t.slice(2), `l${i}`)}</span>
            </div>
          );
        }
        return <p key={i} className="tracking-[0.005em]">{renderInline(t, `l${i}`)}</p>;
      })}
    </div>
  );
}

/**
 * Preview leve e somente leitura do Modo Púlpito (tema CLARO).
 * Reusa BLOCK_META e splitIntoCards do PodiumModeModal para manter 1:1 fidelidade visual
 * com o Púlpito Claro identitário (paleta -50). Sincroniza em tempo real com o markdown
 * gerado a partir dos blocos do Studio.
 */
export function PodiumLivePreview({
  markdown,
  title,
  lang = 'PT',
  fontPx = 17,
  className,
}: PodiumLivePreviewProps) {
  const cards: Card[] = useMemo(() => splitIntoCards(markdown), [markdown]);
  const isEmpty = !markdown.trim() || cards.length === 0;

  return (
    <div className={cn('flex flex-col rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50/40 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 overflow-hidden', className)}>
      {/* Header sticky compacto */}
      <header className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-500/20">
          <MonitorPlay className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-widest text-amber-700/80 dark:text-amber-400/80 font-bold">
            {tr.livePreview[lang]}
          </p>
          <p className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
            {title || (lang === 'PT' ? 'Sermão' : lang === 'ES' ? 'Sermón' : 'Sermon')}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {tr.liveSync[lang]}
        </span>
      </header>

      {/* Body — paleta clara identitária do Púlpito */}
      <div className="flex-1 overflow-y-auto bg-white/80 dark:bg-slate-50/95">
        {isEmpty ? (
          <div className="flex items-center justify-center min-h-[280px] p-8">
            <p className="text-xs text-slate-500 text-center max-w-sm leading-relaxed">
              {tr.empty[lang]}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-3">
            {cards.map((card) => {
              const meta = BLOCK_META[card.tone];
              return (
                <article
                  key={card.id}
                  className={cn(
                    'rounded-xl border shadow-sm overflow-hidden',
                    meta.lightCardBg,
                    meta.lightBorderLeft,
                  )}
                >
                  {card.heading && (
                    <header className="flex items-center gap-2 px-3.5 pt-3 pb-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ring-1',
                        meta.badgeClass,
                      )}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label[lang]}</span>
                      </span>
                    </header>
                  )}
                  {card.heading && (
                    <h3 className={cn('px-3.5 text-sm sm:text-base font-bold leading-tight', meta.lightHeading)}>
                      {card.heading.replace(/^[\p{Emoji}\s]+/u, '').trim() || card.heading}
                    </h3>
                  )}
                  {card.body.trim() && (
                    <div className="px-3.5 py-3">
                      <InlineMarkdown
                        text={card.body}
                        isQuote={card.isQuote}
                        fontPx={fontPx}
                        refClass={VERSE_REF_CLASS[card.tone]}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
