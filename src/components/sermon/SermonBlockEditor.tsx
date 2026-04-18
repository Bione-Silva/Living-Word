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
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SermonBlock } from './SermonBlock';
import {
  SERMON_BLOCK_META,
  SERMON_BLOCK_ORDER,
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
};

/**
 * Mapeia o token Tailwind `border-l-{cor}-{tom}` para `bg-{cor}-{tom}` (cor da bolinha).
 * Mantém PurgeCSS feliz porque os utilitários originais já existem em sermon-block-types.
 */
function dotColorClass(borderClass: string): string {
  return borderClass
    .replace('border-l-', 'bg-')
    .trim();
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
  const pickerRef = useRef<HTMLDivElement>(null);

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

  const context = { bigIdea, passage: passageRef, topic };

  return (
    <div className="space-y-4">
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
                        dotColorClass(meta.borderClass),
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
    </div>
  );
}
