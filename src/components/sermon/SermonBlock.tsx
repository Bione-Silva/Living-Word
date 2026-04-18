import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  SERMON_BLOCK_META,
  countWords,
  getBlockDisplayLabel,
  type SermonBlockData,
} from './sermon-block-types';

type Lang = 'PT' | 'EN' | 'ES';

interface SermonBlockProps {
  block: SermonBlockData;
  lang: Lang;
  /** Contexto global para a IA sugerir conteúdo coerente */
  context?: { bigIdea?: string; passage?: string; topic?: string };
  onChange: (next: SermonBlockData) => void;
  onDelete: (id: string) => void;
}

const tr = {
  words: { PT: 'palavras', EN: 'words', ES: 'palabras' },
  suggest: { PT: 'Sugerir com IA', EN: 'Suggest with AI', ES: 'Sugerir con IA' },
  suggesting: { PT: 'Pensando...', EN: 'Thinking...', ES: 'Pensando...' },
  titlePlaceholder: {
    PT: 'Subtítulo opcional do bloco (ex: "Ponto 1 — A Graça que Salva")',
    EN: 'Optional block subtitle (e.g.: "Point 1 — The Grace that Saves")',
    ES: 'Subtítulo opcional del bloque (ej: "Punto 1 — La Gracia que Salva")',
  },
  passageRefPlaceholder: {
    PT: 'Referência bíblica exata — livro capítulo:versículo (ex: João 3:16-21)',
    EN: 'Exact biblical reference — book chapter:verse (e.g.: John 3:16-21)',
    ES: 'Referencia bíblica exacta — libro capítulo:versículo (ej: Juan 3:16-21)',
  },
  collapse: { PT: 'Recolher', EN: 'Collapse', ES: 'Contraer' },
  expand: { PT: 'Expandir', EN: 'Expand', ES: 'Expandir' },
  remove: { PT: 'Remover bloco', EN: 'Remove block', ES: 'Eliminar bloque' },
  drag: { PT: 'Arrastar', EN: 'Drag', ES: 'Arrastrar' },
  renameLabel: { PT: 'Renomear rótulo do bloco', EN: 'Rename block label', ES: 'Renombrar etiqueta del bloque' },
  labelHint: {
    PT: 'Clique no rótulo para renomear (ex: trocar "Introdução" por "Abertura")',
    EN: 'Click the label to rename (e.g. swap "Introduction" for "Opening")',
    ES: 'Haga clic en la etiqueta para renombrar',
  },
};

export function SermonBlock({ block, lang, context, onChange, onDelete }: SermonBlockProps) {
  const meta = SERMON_BLOCK_META[block.type];
  const wordCount = countWords(block.content);
  const [collapsed, setCollapsed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  const displayLabel = getBlockDisplayLabel(block, lang);

  useEffect(() => {
    if (editingLabel) {
      labelInputRef.current?.focus();
      labelInputRef.current?.select();
    }
  }, [editingLabel]);

  function startEditingLabel() {
    setLabelDraft(displayLabel);
    setEditingLabel(true);
  }

  function commitLabel() {
    const next = labelDraft.trim();
    // Se voltar ao default do tipo, limpa o customLabel para evitar redundância
    const defaultLabel = meta.label[lang];
    onChange({
      ...block,
      customLabel: next && next !== defaultLabel ? next : undefined,
    });
    setEditingLabel(false);
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleSuggestWithAI() {
    setAiLoading(true);
    try {
      const langFull = lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese';
      const blockLabel = meta.label[lang];

      const ctx: string[] = [];
      if (context?.topic) ctx.push(`Sermon topic: ${context.topic}`);
      if (context?.passage) ctx.push(`Main passage: ${context.passage}`);
      if (context?.bigIdea) ctx.push(`Big idea: ${context.bigIdea}`);
      if (block.title?.trim()) ctx.push(`Block subtitle: ${block.title.trim()}`);
      if (block.content?.trim()) ctx.push(`Existing draft to improve: ${block.content.trim()}`);

      const systemPrompt = [
        `You are an expert Christian homiletician helping a pastor build a sermon block by block.`,
        `You are writing ONLY ONE block of type: "${blockLabel}".`,
        `Be focused, pastoral, biblically grounded. Cite Scripture with book chapter:verse when relevant.`,
        `Respond in ${langFull}. Use plain prose (no markdown headers). 80-180 words. No preamble, no closing remarks — just the block content.`,
      ].join('\n');

      const userPrompt = ctx.length
        ? `Context:\n${ctx.join('\n')}\n\nWrite the "${blockLabel}" block now.`
        : `Write a "${blockLabel}" block for a pastoral sermon.`;

      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: { systemPrompt, userPrompt, toolId: 'sermon-block-suggest' },
      });
      if (error) throw error;
      const suggested = (data?.content || '').trim();
      if (!suggested) throw new Error('Empty response');

      // Append or replace? — Append with a separator if there's existing content.
      const next = block.content.trim()
        ? `${block.content.trim()}\n\n${suggested}`
        : suggested;
      onChange({ ...block, content: next });
      toast.success(lang === 'PT' ? 'Sugestão adicionada' : lang === 'ES' ? 'Sugerencia añadida' : 'Suggestion added');
    } catch (err) {
      console.error(err);
      toast.error(lang === 'PT' ? 'Erro ao sugerir' : 'AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-border border-l-4 shadow-sm transition-shadow w-full min-w-0 overflow-hidden',
        meta.cardBgClass,
        meta.borderClass,
        isDragging && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-t-xl', meta.headerBgClass)}>
        <button
          {...attributes}
          {...listeners}
          aria-label={tr.drag[lang]}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {editingLabel ? (
          <input
            ref={labelInputRef}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitLabel(); }
              if (e.key === 'Escape') { e.preventDefault(); setEditingLabel(false); }
            }}
            maxLength={48}
            className={cn(
              'min-w-0 flex-1 bg-background/70 border border-border rounded-md px-1.5 py-0.5',
              'text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40',
              meta.accentClass,
            )}
            aria-label={tr.renameLabel[lang]}
          />
        ) : (
          <button
            type="button"
            onClick={startEditingLabel}
            title={tr.labelHint[lang]}
            className={cn(
              'group/label text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-1.5 min-w-0 truncate',
              'rounded-md px-1 -mx-1 py-0.5 hover:bg-foreground/5 transition-colors text-left',
              meta.accentClass,
            )}
          >
            <span className="shrink-0">{meta.emoji}</span>
            <span className="truncate">{displayLabel}</span>
            <Pencil className="h-3 w-3 opacity-0 group-hover/label:opacity-60 shrink-0 transition-opacity" />
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? tr.expand[lang] : tr.collapse[lang]}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onDelete(block.id)}
          aria-label={tr.remove[lang]}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-2.5 sm:p-3 space-y-2 min-w-0">
          <Input
            value={block.title || ''}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder={tr.titlePlaceholder[lang]}
            className="h-9 text-sm font-medium w-full"
          />

          {block.type === 'passage' && (
            <Input
              value={block.passageRef || ''}
              onChange={(e) => onChange({ ...block, passageRef: e.target.value })}
              placeholder={tr.passageRefPlaceholder[lang]}
              className="h-9 text-sm w-full"
            />
          )}

          <Textarea
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder={meta.placeholder[lang]}
            rows={5}
            className="text-sm leading-relaxed resize-y min-h-[120px] w-full break-words"
          />

          {/* Footer: word count + AI suggest */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {wordCount} {tr.words[lang]}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSuggestWithAI}
              disabled={aiLoading}
              className={cn('h-8 gap-1.5 text-xs shrink-0', meta.accentClass, 'border-current/30 hover:bg-current/5')}
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden xs:inline">{aiLoading ? tr.suggesting[lang] : tr.suggest[lang]}</span>
              <span className="xs:hidden">{aiLoading ? '...' : 'IA'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
