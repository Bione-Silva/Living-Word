import { useMemo, useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, ChevronDown, ChevronUp, Sparkles, Loader2, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SermonBlock } from './SermonBlock';
import { SermonTemplateDialog } from './SermonTemplateDialog';
import {
  SERMON_BLOCK_META,
  SERMON_BLOCK_ORDER,
  SPURGEON_MODEL_ORDER,
  createEmptyBlock,
  countWords,
  type SermonBlockData,
  type SermonBlockType,
} from './sermon-block-types';

type Lang = 'PT' | 'EN' | 'ES';

// Re-export para conveniência de quem importa só o editor
export { blocksToMarkdown, type SermonBlockData } from './sermon-block-types';

interface SermonBlockEditorProps {
  blocks: SermonBlockData[];
  onChange: (next: SermonBlockData[]) => void;
  bigIdea?: string;
  passageRef?: string;
  topic?: string;
  lang: Lang;
}

const tr = {
  empty: {
    PT: 'Comece adicionando blocos para construir seu sermão.',
    EN: 'Start by adding blocks to build your sermon.',
    ES: 'Comience añadiendo bloques para construir su sermón.',
  },
  addBlock: { PT: 'Adicionar Bloco', EN: 'Add Block', ES: 'Añadir Bloque' },
  totalWords: { PT: 'palavras no total', EN: 'total words', ES: 'palabras en total' },
  blocks: { PT: 'blocos', EN: 'blocks', ES: 'bloques' },
  pickType: { PT: 'Escolha o tipo de bloco', EN: 'Pick a block type', ES: 'Elija el tipo de bloque' },
  quickAdd: { PT: 'Atalho rápido — adicionar bloco', EN: 'Quick add — append block', ES: 'Atajo rápido — añadir bloque' },
  quickAddHint: {
    PT: 'Cada bolinha representa um tipo de bloco. Clique para adicionar ao final do sermão.',
    EN: 'Each dot is a block type. Click to append it to the end of the sermon.',
    ES: 'Cada bolita es un tipo de bloque. Haga clic para añadirlo al final del sermón.',
  },
  bulkGen: { PT: 'Gerar Esboço com IA', EN: 'Generate Outline with AI', ES: 'Generar Bosquejo con IA' },
  bulkGenLoading: { PT: 'Construindo no estilo Spurgeon...', EN: 'Building in Spurgeon style...', ES: 'Construyendo al estilo Spurgeon...' },
  spurgeonHint: {
    PT: 'Esqueleto homilético padrão (modelo Spurgeon expositivo). Edite, reordene ou apague o que não usar.',
    EN: 'Default homiletic skeleton (Spurgeon expository model). Edit, reorder or delete what you don\'t use.',
    ES: 'Esqueleto homilético estándar (modelo Spurgeon expositivo). Edite, reordene o elimine lo que no use.',
  },
  bulkSuccess: { PT: 'Esboço Spurgeon gerado!', EN: 'Spurgeon outline generated!', ES: '¡Bosquejo Spurgeon generado!' },
  bulkError: { PT: 'Não foi possível gerar o esboço', EN: 'Could not generate the outline', ES: 'No se pudo generar el bosquejo' },
  bulkNeedsContext: {
    PT: 'Preencha a Grande Ideia ou a Passagem antes de gerar.',
    EN: 'Fill in the Big Idea or Passage before generating.',
    ES: 'Complete la Gran Idea o el Pasaje antes de generar.',
  },
  saveTpl: { PT: 'Salvar template', EN: 'Save template', ES: 'Guardar plantilla' },
  loadTpl: { PT: 'Meus templates', EN: 'My templates', ES: 'Mis plantillas' },
};

/** Esqueleto padrão Spurgeon — auto-carregado quando o studio abre vazio. */
function buildSpurgeonSkeleton(): SermonBlockData[] {
  return SPURGEON_MODEL_ORDER.map((type) => createEmptyBlock(type));
}

export function SermonBlockEditor({
  blocks,
  onChange,
  bigIdea,
  passageRef,
  topic,
  lang,
}: SermonBlockEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [tplDialog, setTplDialog] = useState<null | 'save' | 'load'>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  // ─── Auto-seed: ao abrir o studio do zero, carrega o esqueleto Spurgeon ───
  useEffect(() => {
    if (seededRef.current) return;
    if (blocks.length === 0) {
      seededRef.current = true;
      onChange(buildSpurgeonSkeleton());
    } else {
      seededRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fecha o picker ao clicar fora
  useEffect(() => {
    if (!pickerOpen) return;
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const totalWords = useMemo(
    () => blocks.reduce((sum, b) => sum + countWords(b.content), 0),
    [blocks],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  function addBlock(type: SermonBlockType) {
    onChange([...blocks, createEmptyBlock(type)]);
    setPickerOpen(false);
    // Scroll suave para o final
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 80);
  }

  function updateBlock(next: SermonBlockData) {
    onChange(blocks.map((b) => (b.id === next.id ? next : b)));
  }

  function deleteBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  /* ═══ Gerar Esboço com IA — preenche TODOS os blocos no modelo Spurgeon ═══ */
  async function handleBulkGenerate() {
    const ctxBigIdea = (bigIdea || '').trim();
    const ctxPassage = (passageRef || '').trim();
    const ctxTopic = (topic || '').trim();

    if (!ctxBigIdea && !ctxPassage && !ctxTopic) {
      toast.error(tr.bulkNeedsContext[lang]);
      return;
    }

    setBulkLoading(true);
    try {
      const langFull = lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Brazilian Portuguese (PT-BR)';

      // Garante que a tela tenha o esqueleto Spurgeon ANTES de gerar
      const targetBlocks: SermonBlockData[] =
        blocks.length === 0 ? buildSpurgeonSkeleton() : blocks;

      // Mapa dos tipos que a IA deve preencher, na ordem Spurgeon
      const spurgeonKeys = SPURGEON_MODEL_ORDER.join(' > ');

      const systemPrompt = [
        `You are a master Christian homiletician trained in the expository style of Charles H. Spurgeon, with the doctrinal anchor of John Wesley and the evangelistic appeal of Billy Graham.`,
        `You will produce a complete sermon outline organized as JSON, STRICTLY following the Spurgeon Expository Model in this exact order of blocks:`,
        spurgeonKeys + '.',
        ``,
        `Return ONLY a JSON object — no preamble, no markdown fences — matching this schema exactly:`,
        `{ "blocks": [ { "type": "<one of: hook|passage|doctrine|objection|main_point|explanation|illustration|application|appeal|conclusion>", "title": "<short title>", "content": "<80-160 words of pastoral prose>" } ] }`,
        ``,
        `══════════════════════════════════════════════════════════`,
        `ABSOLUTE LANGUAGE LOCK — ZERO TOLERANCE:`,
        `══════════════════════════════════════════════════════════`,
        `- ALL "title" and "content" fields MUST be written in ${langFull}.`,
        lang === 'PT'
          ? `- NUNCA use termos estruturais em inglês dentro do "title" ou "content" (proibidos: "Main Points", "Hook", "Big Idea", "Conclusion", "Outline", "Introduction", "Application", "Appeal").`
          : `- NEVER use structural English jargon inside "title" or "content" when language is not English.`,
        lang === 'PT'
          ? `- O "title" deve ser uma frase pastoral PURA em Português do Brasil (ex: "A Graça que Restaura"). NÃO o tipo do bloco.`
          : `- The "title" must be a pure pastoral phrase in ${langFull} — NOT the block type label.`,
        ``,
        `══════════════════════════════════════════════════════════`,
        `NUMBERING LOCK — DO NOT ADD NUMBERS TO TITLES:`,
        `══════════════════════════════════════════════════════════`,
        `- NEVER prefix the "title" with numbers like "1. ...", "1) ...", "I. ...", "### 1. ...".`,
        `- NEVER add markdown headers (#, ##, ###) inside "title" or "content" fields. They are plain prose.`,
        `- The visual numbering (1, 2, 3...) is rendered automatically by the frontend.`,
        ``,
        `Rules:`,
        `- Output the blocks in the EXACT order listed above. Never skip a block. Never add extra blocks.`,
        `- Each "content" must be PLAIN pastoral prose (no markdown headers, no numbered lists, no bullet lists), 80-160 words.`,
        `- "passage" content must include the literal Bible text and reference (book chapter:verse).`,
        `- "doctrine" must state ONE clear theological truth from the text.`,
        `- "objection" must voice a real skeptic's doubt and refute it briefly.`,
        `- "appeal" must invite a concrete decision (Billy Graham style altar call).`,
        `- "conclusion" must restate the Big Idea + a closing prayer.`,
        `- Write everything in ${langFull}.`,
      ].join('\n');

      const userPromptParts: string[] = [];
      if (ctxTopic) userPromptParts.push(`Sermon topic: ${ctxTopic}`);
      if (ctxPassage) userPromptParts.push(`Main biblical passage: ${ctxPassage}`);
      if (ctxBigIdea) userPromptParts.push(`Big idea: ${ctxBigIdea}`);
      userPromptParts.push(`\nGenerate the full Spurgeon-model outline now as JSON.`);

      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt,
          userPrompt: userPromptParts.join('\n'),
          toolId: 'sermon-bulk-spurgeon',
        },
      });
      if (error) throw error;
      const raw = (data?.content || '').trim();
      if (!raw) throw new Error('Empty response');

      // Robust JSON parse — strip code fences if present
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
      const parsed = JSON.parse(jsonStr) as { blocks?: Array<{ type: SermonBlockType; title?: string; content?: string }> };
      const aiBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];

      // Funde a saída da IA com o esqueleto Spurgeon (preserva qualquer conteúdo já digitado)
      const merged: SermonBlockData[] = SPURGEON_MODEL_ORDER.map((type) => {
        const existing = targetBlocks.find((b) => b.type === type);
        const ai = aiBlocks.find((b) => b.type === type);
        const base = existing ?? createEmptyBlock(type);
        // Se já tem conteúdo do usuário, NÃO sobrescreve.
        if (existing && existing.content?.trim()) return base;
        return {
          ...base,
          title: ai?.title?.trim() || base.title || '',
          content: ai?.content?.trim() || base.content || '',
          ...(type === 'passage' && ctxPassage ? { passageRef: ctxPassage } : {}),
        };
      });

      // Mantém quaisquer blocos extras (ex: quote, transition) que o usuário tenha adicionado fora do modelo
      const extras = targetBlocks.filter((b) => !SPURGEON_MODEL_ORDER.includes(b.type));
      onChange([...merged, ...extras]);
      toast.success(tr.bulkSuccess[lang]);
    } catch (err) {
      console.error('[handleBulkGenerate]', err);
      toast.error(tr.bulkError[lang]);
    } finally {
      setBulkLoading(false);
    }
  }

  const context = { bigIdea, passage: passageRef, topic };
  const isSkeletonOnly = blocks.length > 0 && blocks.every((b) => !b.content?.trim() && !b.title?.trim());

  return (
    <div className="space-y-4">
      {/* ─── Seletor compacto: bolinhas coloridas com fundo -50 (mesma paleta do Púlpito Claro) ─── */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {tr.quickAdd[lang]}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/80 leading-snug mb-2">
          {tr.quickAddHint[lang]}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SERMON_BLOCK_ORDER.map((type) => {
            const meta = SERMON_BLOCK_META[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                title={`${meta.emoji} ${meta.label[lang]}`}
                aria-label={`${tr.addBlock[lang]}: ${meta.label[lang]}`}
                className={cn(
                  // Fundo -50 (paleta identitária) — extraído do cardBgClass via prefixo "bg-...-50"
                  meta.cardBgClass.split(' ').find((c) => /^bg-[a-z]+-50$/.test(c)) ?? 'bg-muted',
                  'group relative h-8 w-8 sm:h-9 sm:w-9 rounded-full',
                  'flex items-center justify-center',
                  'ring-1 ring-border/50 hover:ring-2 hover:ring-foreground/30',
                  'shadow-sm hover:shadow-md hover:scale-110 active:scale-95',
                  'transition-all duration-150',
                )}
              >
                {/* Dot sólido central — identidade colorida da paleta */}
                <span className={cn('h-2.5 w-2.5 rounded-full', meta.dotClass)} />
                {/* Tooltip flutuante na hover (desktop) */}
                <span
                  className={cn(
                    'pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 z-10',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'whitespace-nowrap rounded-md bg-foreground/90 px-1.5 py-0.5',
                    'text-[10px] font-medium text-background',
                  )}
                >
                  {meta.label[lang]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Linha de ações: Gerar com IA (compacto) + Templates */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleBulkGenerate}
          disabled={bulkLoading}
          className={cn(
            'flex-1 min-w-[180px] inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg transition-all',
            'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:shadow-md',
            'disabled:opacity-70 disabled:cursor-wait text-xs font-semibold',
          )}
        >
          {bulkLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="truncate">{tr.bulkGenLoading[lang]}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span className="truncate">{tr.bulkGen[lang]}</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTplDialog('load')}
          title={tr.loadTpl[lang]}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-xs font-medium text-foreground transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tr.loadTpl[lang]}</span>
        </button>
        <button
          type="button"
          onClick={() => setTplDialog('save')}
          disabled={blocks.length === 0}
          title={tr.saveTpl[lang]}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-xs font-medium text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tr.saveTpl[lang]}</span>
        </button>
      </div>

      {/* Hint sobre o esqueleto padrão (mostra só enquanto a tela está com a estrutura inicial vazia) */}
      {isSkeletonOnly && (
        <p className="text-[11px] text-muted-foreground text-center px-2">
          ✶ {tr.spurgeonHint[lang]}
        </p>
      )}

      {/* Lista de blocos com DnD */}
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">{tr.empty[lang]}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {blocks.map((block) => (
                <SermonBlock
                  key={block.id}
                  block={block}
                  lang={lang}
                  context={context}
                  onChange={updateBlock}
                  onDelete={deleteBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* + Adicionar Bloco — botão expansível com grid de tipos */}
      <div ref={pickerRef} className="relative">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all',
            'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60',
            pickerOpen && 'border-primary bg-primary/10',
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-semibold">{tr.addBlock[lang]}</span>
          {pickerOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {pickerOpen && (
          <div className="mt-2 rounded-xl border border-border bg-card shadow-lg p-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {tr.pickType[lang]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
              {SERMON_BLOCK_ORDER.map((type) => {
                const meta = SERMON_BLOCK_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left"
                  >
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-current/20',
                        meta.dotClass,
                      )}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground/85 group-hover:text-foreground">
                      {meta.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas globais */}
      {blocks.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>
            {blocks.length} {tr.blocks[lang]}
          </span>
          <span className="tabular-nums font-medium">
            {totalWords} {tr.totalWords[lang]}
          </span>
        </div>
      )}

      {/* Dialog de Templates (salvar / carregar) */}
      <SermonTemplateDialog
        open={tplDialog !== null}
        onOpenChange={(v) => { if (!v) setTplDialog(null); }}
        mode={tplDialog ?? 'load'}
        lang={lang}
        currentBlocks={blocks}
        onApplyTemplate={(next) => onChange(next)}
      />
    </div>
  );
}
