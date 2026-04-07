import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Download, Loader2, X, StickyNote, Save, Palette } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArticleReaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id?: string;
    title: string;
    passage?: string | null;
    content: string;
    cover_image_url?: string | null;
    article_images?: string[] | null;
    notes?: string | null;
  } | null;
}

function intercalateImages(markdown: string, images: string[]): string {
  if (!images.length) return markdown;
  const lines = markdown.split('\n');
  const headingIndices: number[] = [];
  lines.forEach((line, i) => {
    if (/^#{2,3}\s/.test(line.trim())) headingIndices.push(i);
  });
  const insertPoints = headingIndices.slice(1);
  const result = [...lines];
  let offset = 0;
  images.forEach((imgUrl, idx) => {
    if (idx < insertPoints.length) {
      const insertAt = insertPoints[idx] + offset + 2;
      result.splice(insertAt, 0, `\n![Ilustração ${idx + 1}](${imgUrl})\n`);
      offset += 1;
    }
  });
  return result.join('\n');
}

function getBodyImages(item: any): string[] {
  const images: string[] = (item?.article_images || []).filter(Boolean);
  const cover = item?.cover_image_url;
  return cover && images[0] === cover ? images.slice(1) : images;
}

export function ArticleReaderModal({ open, onOpenChange, item }: ArticleReaderModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [articleImages, setArticleImages] = useState<string[]>([]);
  const { lang } = useLanguage();

  useEffect(() => {
    if (item) {
      setNotes(item.notes || '');
      setArticleImages((item.article_images as string[]) || []);
    }
  }, [item?.id]);

  const saveNotes = useCallback(async () => {
    if (!item?.id) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase.from('materials').update({ notes }).eq('id', item.id);
      if (error) throw error;
      toast.success(lang === 'PT' ? 'Anotações salvas!' : lang === 'EN' ? 'Notes saved!' : '¡Notas guardadas!');
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao salvar' : 'Error saving');
    } finally {
      setSavingNotes(false);
    }
  }, [item?.id, notes, lang]);
  const handleEnrich = useCallback(async () => {
    if (!item?.id) return;
    setEnriching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/enrich-illustrations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ material_id: item.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed');
      setArticleImages(data.images);
      toast.success(
        lang === 'PT' ? `${data.images.length} ilustrações geradas!` :
        lang === 'EN' ? `${data.images.length} illustrations generated!` :
        `¡${data.images.length} ilustraciones generadas!`
      );
    } catch (err: any) {
      console.error('Enrich error:', err);
      toast.error(lang === 'PT' ? 'Erro ao gerar ilustrações' : 'Error generating illustrations');
    } finally {
      setEnriching(false);
    }
  }, [item?.id, lang]);

  if (!item) return null;

  const currentImages = articleImages.length > 0 ? articleImages : (getBodyImages(item));
  const finalContent = intercalateImages(item.content || '', currentImages);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${item.title.replace(/[^a-zA-Z0-9À-ú ]/g, '').substring(0, 60)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      await html2pdf().set(opt).from(contentRef.current).save();
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col min-h-0 p-0 border-none rounded-2xl shadow-2xl [color-scheme:light]"
        style={{ backgroundColor: '#f7f5f0', color: '#1e1710' }}
      >
        {/* Action buttons */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1">
          {item.id && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`rounded-full p-2 hover:bg-black/5 transition-colors ${showNotes ? 'bg-black/5' : ''}`}
              style={{ color: '#6B4F3A' }}
              title={lang === 'PT' ? 'Anotações do Pregador' : 'Preacher Notes'}
            >
              <StickyNote className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="rounded-full p-2 hover:bg-black/5 transition-colors"
            style={{ color: '#6B4F3A' }}
            title="Exportar PDF"
          >
            {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 hover:bg-black/5 transition-colors"
            style={{ color: '#6B4F3A' }}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        <DialogTitle className="sr-only">{item.title}</DialogTitle>

        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Main content */}
          <div className={`flex-1 min-w-0 overflow-y-auto ${showNotes ? 'border-r' : ''}`} style={{ borderColor: '#d4c8b8' }}>
            <div ref={contentRef} style={{ backgroundColor: '#f7f5f0' }}>
              {/* Cover image */}
              {item.cover_image_url && (
                <div className="w-full h-56 md:h-72 overflow-hidden rounded-t-2xl">
                  <img
                    src={item.cover_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Article content */}
              <div className="px-6 md:px-12 py-8 md:py-10 max-w-3xl mx-auto">
                <h1
                  className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4"
                  style={{ color: '#3c2f21' }}
                >
                  {item.title}
                </h1>

                {item.passage && (
                  <p className="text-sm flex items-center gap-1.5 mb-6" style={{ color: '#8B7355' }}>
                    <BookOpen className="w-4 h-4" /> {item.passage}
                  </p>
                )}

                <div className="w-16 h-0.5 mb-8" style={{ backgroundColor: '#C4956A' }} />

                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:leading-relaxed
                    prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                    prose-img:rounded-xl prose-img:shadow-lg prose-img:mx-auto prose-img:max-h-96 prose-img:w-full prose-img:object-cover prose-img:my-8
                    prose-a:underline
                    prose-li:leading-relaxed
                    prose-strong:font-bold
                  "
                  style={{
                    '--tw-prose-headings': '#1a1208',
                    '--tw-prose-body': '#1e1710',
                    '--tw-prose-bold': '#1a1208',
                    '--tw-prose-quotes': '#2a1f14',
                    '--tw-prose-quote-borders': '#C4956A',
                    '--tw-prose-links': '#4a3218',
                    '--tw-prose-bullets': '#6B4F3A',
                    '--tw-prose-counters': '#6B4F3A',
                    '--tw-prose-hr': '#d4c8b8',
                    '--tw-prose-th-borders': '#d4c8b8',
                    '--tw-prose-td-borders': '#e7dfd5',
                    '--tw-prose-code': '#1a1208',
                    '--tw-prose-pre-bg': '#eae4d9',
                    '--tw-prose-pre-code': '#1e1710',
                    color: '#1e1710',
                  } as React.CSSProperties}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {finalContent}
                  </ReactMarkdown>
                </div>

                <div className="mt-10 pt-6 border-t text-center text-xs" style={{ borderColor: '#d4c8b8', color: '#a0906e' }}>
                  Feito com ❤️ pela Living Word
                </div>
              </div>
            </div>
          </div>

          {/* Notes sidebar */}
          {showNotes && (
            <div className="w-[280px] md:w-[320px] shrink-0 flex flex-col p-4 overflow-y-auto" style={{ backgroundColor: '#faf8f3' }}>
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="h-4 w-4" style={{ color: '#6B4F3A' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#3c2f21' }}>
                  {lang === 'PT' ? 'Anotações do Pregador' : lang === 'EN' ? 'Preacher Notes' : 'Notas del Predicador'}
                </h3>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={lang === 'PT' ? 'Escreva suas anotações pessoais aqui...' : lang === 'EN' ? 'Write your personal notes here...' : 'Escribe tus notas personales aquí...'}
                className="flex-1 min-h-[200px] resize-none text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                style={{ backgroundColor: 'transparent', color: '#1e1710' }}
              />
              <Button
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-3 gap-1.5"
              >
                {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {lang === 'PT' ? 'Salvar Anotações' : lang === 'EN' ? 'Save Notes' : 'Guardar Notas'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
