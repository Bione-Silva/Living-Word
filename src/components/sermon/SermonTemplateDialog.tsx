/**
 * SermonTemplateDialog
 * Permite ao pastor SALVAR a estrutura atual de blocos como template nomeado
 * e CARREGAR um template salvo previamente. Persiste em localStorage por usuário,
 * sob a chave `lw-sermon-templates`. Mantém apenas a "casca" dos blocos (tipo +
 * customLabel + título + ordem) — o conteúdo NÃO é salvo, para que cada sermão
 * comece em branco a partir do template.
 */
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, FolderOpen, Trash2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  SERMON_BLOCK_META,
  newBlockId,
  type SermonBlockData,
  type SermonBlockType,
} from './sermon-block-types';

type Lang = 'PT' | 'EN' | 'ES';
type Mode = 'save' | 'load';

interface SavedTemplate {
  id: string;
  name: string;
  createdAt: number;
  blocks: Array<{ type: SermonBlockType; title?: string; customLabel?: string }>;
}

const STORAGE_KEY = 'lw-sermon-templates';

function loadTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistTemplates(items: SavedTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const tr = {
  saveTitle: { PT: 'Salvar como Template', EN: 'Save as Template', ES: 'Guardar como Plantilla' },
  loadTitle: { PT: 'Carregar Template', EN: 'Load Template', ES: 'Cargar Plantilla' },
  saveDesc: {
    PT: 'Salve a estrutura atual (tipos, ordem e rótulos dos blocos) para reutilizar em sermões futuros.',
    EN: 'Save the current structure (block types, order and labels) to reuse in future sermons.',
    ES: 'Guarde la estructura actual (tipos, orden y etiquetas) para reutilizar en sermones futuros.',
  },
  loadDesc: {
    PT: 'Escolha um template salvo. Ele substituirá os blocos atuais (em branco).',
    EN: 'Pick a saved template. It will replace your current blocks (empty).',
    ES: 'Elija una plantilla guardada. Reemplazará sus bloques actuales (en blanco).',
  },
  namePlaceholder: { PT: 'Nome do template (ex: "Modelo Domingo Manhã")', EN: 'Template name (e.g. "Sunday AM Model")', ES: 'Nombre de la plantilla' },
  saveBtn: { PT: 'Salvar Template', EN: 'Save Template', ES: 'Guardar Plantilla' },
  loadBtn: { PT: 'Usar este template', EN: 'Use this template', ES: 'Usar esta plantilla' },
  empty: { PT: 'Nenhum template salvo ainda.', EN: 'No templates saved yet.', ES: 'Aún no hay plantillas guardadas.' },
  emptyBlocks: { PT: 'Adicione ao menos um bloco antes de salvar.', EN: 'Add at least one block before saving.', ES: 'Añada al menos un bloque antes de guardar.' },
  saveSuccess: { PT: 'Template salvo!', EN: 'Template saved!', ES: '¡Plantilla guardada!' },
  loadSuccess: { PT: 'Template carregado!', EN: 'Template loaded!', ES: '¡Plantilla cargada!' },
  deleted: { PT: 'Template removido.', EN: 'Template removed.', ES: 'Plantilla eliminada.' },
  duplicateName: { PT: 'Já existe um template com esse nome.', EN: 'A template with that name already exists.', ES: 'Ya existe una plantilla con ese nombre.' },
  blocks: { PT: 'blocos', EN: 'blocks', ES: 'bloques' },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  lang: Lang;
  /** Blocos atuais (modo "save") */
  currentBlocks: SermonBlockData[];
  /** Aplicar template carregado (modo "load") */
  onApplyTemplate: (blocks: SermonBlockData[]) => void;
}

export function SermonTemplateDialog({
  open,
  onOpenChange,
  mode,
  lang,
  currentBlocks,
  onApplyTemplate,
}: Props) {
  const [name, setName] = useState('');
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);

  useEffect(() => {
    if (open) {
      setTemplates(loadTemplates());
      setName('');
    }
  }, [open]);

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => b.createdAt - a.createdAt),
    [templates],
  );

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (currentBlocks.length === 0) {
      toast.error(tr.emptyBlocks[lang]);
      return;
    }
    if (templates.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(tr.duplicateName[lang]);
      return;
    }
    const next: SavedTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      createdAt: Date.now(),
      blocks: currentBlocks.map((b) => ({
        type: b.type,
        title: b.title || undefined,
        customLabel: b.customLabel || undefined,
      })),
    };
    const updated = [next, ...templates];
    persistTemplates(updated);
    setTemplates(updated);
    toast.success(tr.saveSuccess[lang]);
    onOpenChange(false);
  }

  function handleLoad(tpl: SavedTemplate) {
    const blocks: SermonBlockData[] = tpl.blocks.map((b) => ({
      id: newBlockId(),
      type: b.type,
      title: b.title || '',
      customLabel: b.customLabel,
      content: '',
    }));
    onApplyTemplate(blocks);
    toast.success(tr.loadSuccess[lang]);
    onOpenChange(false);
  }

  function handleDelete(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    persistTemplates(updated);
    setTemplates(updated);
    toast.success(tr.deleted[lang]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'save' ? <Save className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
            {mode === 'save' ? tr.saveTitle[lang] : tr.loadTitle[lang]}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === 'save' ? tr.saveDesc[lang] : tr.loadDesc[lang]}
          </DialogDescription>
        </DialogHeader>

        {mode === 'save' ? (
          <div className="space-y-3">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr.namePlaceholder[lang]}
              maxLength={60}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              }}
            />
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 max-h-40 overflow-auto">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {currentBlocks.length} {tr.blocks[lang]}
              </p>
              <ul className="space-y-1">
                {currentBlocks.map((b, i) => {
                  const meta = SERMON_BLOCK_META[b.type];
                  const label = b.customLabel?.trim() || meta.label[lang];
                  return (
                    <li key={b.id} className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground tabular-nums w-4 shrink-0">{i + 1}.</span>
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', meta.dotClass)} />
                      <span className="truncate">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button onClick={handleSave} disabled={!name.trim() || currentBlocks.length === 0} className="w-full">
              <Save className="h-4 w-4 mr-1.5" />
              {tr.saveBtn[lang]}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {sortedTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                <Layers className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">{tr.empty[lang]}</p>
              </div>
            ) : (
              sortedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold text-foreground truncate">{tpl.name}</h4>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {tpl.blocks.slice(0, 12).map((b, i) => {
                      const meta = SERMON_BLOCK_META[b.type];
                      return (
                        <span
                          key={i}
                          title={b.customLabel || meta.label[lang]}
                          className={cn('h-2 w-2 rounded-full', meta.dotClass)}
                        />
                      );
                    })}
                    {tpl.blocks.length > 12 && (
                      <span className="text-[10px] text-muted-foreground">+{tpl.blocks.length - 12}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoad(tpl)}
                    className="w-full h-8 text-xs"
                  >
                    <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                    {tr.loadBtn[lang]} ({tpl.blocks.length} {tr.blocks[lang]})
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
