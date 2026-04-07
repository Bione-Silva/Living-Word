import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { EditableBlogArticle, getBodyArticleImages, intercalateArticleImages } from '@/lib/blog-article';
import { Archive, Eye, FileText, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemo, useState } from 'react';

type Lang = 'PT' | 'EN' | 'ES';
type ViewMode = 'edit' | 'preview' | 'split';

interface BlogArticleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: EditableBlogArticle | null;
  onArticleChange: (next: EditableBlogArticle) => void;
  onSave: () => Promise<void> | void;
  onPublish?: () => Promise<void> | void;
  onArchive?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  lang?: Lang;
  saving?: boolean;
  publishing?: boolean;
  archiving?: boolean;
  deleting?: boolean;
}

const copy = {
  PT: {
    title: 'Editar artigo do blog',
    description: 'Edite o markdown, visualize a estrutura final com imagens e publique quando estiver pronto.',
    edit: 'Editar texto',
    preview: 'Preview',
    split: 'Lado a lado',
    articleTitle: 'Título do artigo',
    articleBody: 'Conteúdo em Markdown',
    save: 'Salvar',
    publish: 'Publicar',
    archive: 'Arquivar',
    unarchive: 'Desarquivar',
    delete: 'Excluir',
  },
  EN: {
    title: 'Edit blog article',
    description: 'Edit the markdown, review the final structure with images, and publish when ready.',
    edit: 'Edit text',
    preview: 'Preview',
    split: 'Side by side',
    articleTitle: 'Article title',
    articleBody: 'Markdown content',
    save: 'Save',
    publish: 'Publish',
    archive: 'Archive',
    unarchive: 'Unarchive',
    delete: 'Delete',
  },
  ES: {
    title: 'Editar artículo del blog',
    description: 'Edita el markdown, revisa la estructura final con imágenes y publica cuando esté listo.',
    edit: 'Editar texto',
    preview: 'Vista previa',
    split: 'Lado a lado',
    articleTitle: 'Título del artículo',
    articleBody: 'Contenido en Markdown',
    save: 'Guardar',
    publish: 'Publicar',
    archive: 'Archivar',
    unarchive: 'Desarchivar',
    delete: 'Eliminar',
  },
} as const;

export function BlogArticleEditorDialog({
  open,
  onOpenChange,
  article,
  onArticleChange,
  onSave,
  onPublish,
  onArchive,
  onDelete,
  lang = 'PT',
  saving = false,
  publishing = false,
  archiving = false,
  deleting = false,
}: BlogArticleEditorDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const text = copy[lang];

  const previewContent = useMemo(() => {
    if (!article) return '';
    return intercalateArticleImages(article.content || '', getBodyArticleImages(article));
  }, [article]);

  if (!article) return null;

  const isArchived = article.queue_status === 'archived';
  const showEditor = viewMode === 'edit' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-app max-w-7xl w-[96vw] max-h-[95vh] overflow-hidden overflow-x-hidden flex flex-col bg-background text-foreground min-h-0 max-md:w-full max-md:h-full max-md:max-h-full max-md:rounded-none max-md:m-0 break-words">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-xl text-foreground">{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button size="sm" variant={viewMode === 'edit' ? 'default' : 'outline'} className="gap-1.5" onClick={() => setViewMode('edit')}>
            <Pencil className="h-3.5 w-3.5" /> {text.edit}
          </Button>
          <Button size="sm" variant={viewMode === 'preview' ? 'default' : 'outline'} className="gap-1.5" onClick={() => setViewMode('preview')}>
            <Eye className="h-3.5 w-3.5" /> {text.preview}
          </Button>
          <Button size="sm" variant={viewMode === 'split' ? 'default' : 'outline'} className="gap-1.5" onClick={() => setViewMode('split')}>
            <FileText className="h-3.5 w-3.5" /> {text.split}
          </Button>
        </div>

        <div className={`flex-1 min-h-0 grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
          {showEditor && (
            <div className="min-h-0 rounded-xl border border-border bg-card p-4 flex flex-col gap-3 overflow-hidden">
              <div className="space-y-2 shrink-0">
                <p className="text-sm font-medium text-foreground">{text.articleTitle}</p>
                <Input
                  value={article.title}
                  onChange={(e) => onArticleChange({ ...article, title: e.target.value })}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2 min-h-0 flex-1 flex flex-col overflow-hidden">
                <p className="text-sm font-medium text-foreground">{text.articleBody}</p>
                <Textarea
                  value={article.content}
                  onChange={(e) => onArticleChange({ ...article, content: e.target.value })}
                  className="min-h-[320px] lg:min-h-0 flex-1 resize-none bg-background font-mono text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {showPreview && (
            <div className="min-h-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 min-h-0">
                <div className="min-h-full">
                  {article.cover_image_url && (
                    <div className="h-56 w-full overflow-hidden border-b border-border bg-muted">
                      <img src={article.cover_image_url} alt={article.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  )}

                  <div className="p-5 lg:p-8">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{article.title}</h1>
                    {article.passage && <p className="mt-2 text-sm text-muted-foreground">{article.passage}</p>}

                    <div className="prose prose-sm pastoral-prose max-w-none mt-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4 shrink-0">
          <Button onClick={() => void onSave()} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {text.save}
          </Button>
          {onPublish && article.queue_status !== 'published' && (
            <Button variant="outline" onClick={() => void onPublish()} disabled={publishing} className="gap-1.5">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {text.publish}
            </Button>
          )}
          {onArchive && (
            <Button variant="outline" onClick={() => void onArchive()} disabled={archiving} className="gap-1.5">
              {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              {isArchived ? text.unarchive : text.archive}
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" onClick={() => void onDelete()} disabled={deleting} className="gap-1.5 ml-auto">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {text.delete}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}