import { useMemo } from 'react';
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
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  addBlock: { PT: 'Adicionar bloco', EN: 'Add block', ES: 'Añadir bloque' },
  totalWords: { PT: 'palavras no total', EN: 'total words', ES: 'palabras en total' },
  blocks: { PT: 'blocos', EN: 'blocks', ES: 'bloques' },
};

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
      {/* Toolbar — Adicionar bloco por tipo */}
      <div className="rounded-xl border border-border bg-card/60 p-3">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          {tr.addBlock[lang]}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SERMON_BLOCK_ORDER.map((type) => {
            const meta = SERMON_BLOCK_META[type];
            return (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border-l-4 border-y border-r border-border bg-background hover:bg-muted/40 transition-colors',
                  meta.borderClass,
                )}
              >
                <span>{meta.emoji}</span>
                <span className="text-foreground/90">{meta.label[lang]}</span>
                <Plus className={cn('h-3 w-3 ml-0.5', meta.accentClass)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de blocos com DnD */}
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">{tr.empty[lang]}</p>
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
