import { useState } from 'react';
import { DndContext, type DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GripVertical, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NETWORK_META } from './NetworkFilterBar';
import type { CalendarItem } from './CalendarGrid';

type L = 'PT' | 'EN' | 'ES';
type Status = 'draft' | 'approved' | 'scheduled' | 'published';

const COLUMNS: Record<Status, Record<L, string>> = {
  draft: { PT: 'Rascunho', EN: 'Draft', ES: 'Borrador' },
  approved: { PT: 'Aprovado', EN: 'Approved', ES: 'Aprobado' },
  scheduled: { PT: 'Agendado', EN: 'Scheduled', ES: 'Programado' },
  published: { PT: 'Publicado', EN: 'Published', ES: 'Publicado' },
};

const COLUMN_ORDER: Status[] = ['draft', 'approved', 'scheduled', 'published'];

interface Props {
  items: CalendarItem[];
  selectedId: string | null;
  onSelect: (item: CalendarItem) => void;
  lang: L;
}

export function KanbanBoard({ items, selectedId, onSelect, lang }: Props) {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Optimistic local override of statuses
  const [localOverrides, setLocalOverrides] = useState<Record<string, Status>>({});

  const updateStatus = useMutation({
    mutationFn: async ({ item, status }: { item: CalendarItem; status: Status }) => {
      const table = item.kind === 'social' ? 'social_calendar_posts' : 'editorial_queue';
      const { error } = await supabase.from(table).update({ status }).eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-calendar'] });
      qc.invalidateQueries({ queryKey: ['editorial-queue-cal'] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setLocalOverrides({});
    },
  });

  const grouped: Record<Status, CalendarItem[]> = {
    draft: [],
    approved: [],
    scheduled: [],
    published: [],
  };
  items.forEach((it) => {
    const s = (localOverrides[it.id] ?? (it.status as Status)) || 'draft';
    const bucket: Status = COLUMN_ORDER.includes(s) ? s : 'draft';
    grouped[bucket].push(it);
  });

  const handleDragEnd = (e: DragEndEvent) => {
    const itemId = e.active.id as string;
    const newStatus = e.over?.id as Status | undefined;
    if (!newStatus || !COLUMN_ORDER.includes(newStatus)) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const current = (localOverrides[item.id] ?? item.status) as Status;
    if (current === newStatus) return;
    setLocalOverrides((p) => ({ ...p, [item.id]: newStatus }));
    updateStatus.mutate({ item, status: newStatus });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 sm:p-4">
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={COLUMNS[status][lang]}
            items={grouped[status]}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  label,
  items,
  selectedId,
  onSelect,
}: {
  status: Status;
  label: string;
  items: CalendarItem[];
  selectedId: string | null;
  onSelect: (it: CalendarItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border bg-muted/20 p-2 min-h-[300px] flex flex-col gap-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between px-1.5 pt-1 pb-2 sticky top-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Badge variant="outline" className="h-5 text-[10px] px-1.5">{items.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-muted-foreground/60">—</div>
        ) : (
          items.map((it) => (
            <KanbanCard
              key={it.id}
              item={it}
              isSelected={selectedId === it.id}
              onSelect={() => onSelect(it)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  item,
  isSelected,
  onSelect,
}: {
  item: CalendarItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });

  const editorialKey: 'sermon' | 'blog' =
    item.editorial_type && /sermon|pastoral|sermao|sermão/i.test(item.editorial_type)
      ? 'sermon'
      : 'blog';
  const meta =
    item.kind === 'editorial' ? NETWORK_META[editorialKey] : NETWORK_META[item.network!];
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`rounded-lg border bg-card p-2.5 shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className={`h-6 w-6 rounded-md ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
            {item.title}
          </p>
          {item.auto_generated && (
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] uppercase tracking-wide text-primary/80">
              <Sparkles className="h-2.5 w-2.5" /> AutoFeed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
