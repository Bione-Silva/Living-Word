import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Download, Loader2, X, StickyNote, Save, FolderOpen, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { SaveToWorkspaceDialog } from '@/components/workspaces/SaveToWorkspaceDialog';

type ImageStyle = 'watercolor' | 'oil' | 'minimalist' | 'photographic';

interface ArticleReaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id?: string;
    title: string;
    type?: string;
    passage?: string | null;
    content: string;
    cover_image_url?: string | null;
    article_images?: string[] | null;
    notes?: string | null;
  } | null;
  /** Called after a sermon is transformed into a NEW blog_article material.
   *  Parent should swap the viewed item to the new article so the original
   *  sermon stays intact in the library. */
  onReplaceItem?: (newItem: any) => void;
}

/**
 * Distribute images evenly between H2/H3 section headings.
 * Avoids clustering all images at the top — spaces them across the article body.
 */
function intercalateImages(markdown: string, images: string[]): string {
  if (!images.length) return markdown;
  const lines = markdown.split('\n');
  const headingIndices: number[] = [];
  lines.forEach((line, i) => {
    if (/^#{2,3}\s/.test(line.trim())) headingIndices.push(i);
  });

  // Skip the first heading (image goes after, not before intro)
  // and pick evenly spaced insertion points among the remaining headings
  const candidates = headingIndices.slice(1);
  if (candidates.length === 0) return markdown;

  const insertPoints: number[] = [];
  const N = Math.min(images.length, candidates.length);
  for (let i = 0; i < N; i++) {
    // even spacing across candidates
    const idx = Math.floor((i * candidates.length) / N);
    const point = candidates[idx];
    if (!insertPoints.includes(point)) insertPoints.push(point);
  }

  // Insert in reverse order so earlier indices stay valid
  const result = [...lines];
  insertPoints
    .map((point, i) => ({ point, img: images[i] }))
    .reverse()
    .forEach(({ point, img }) => {
      // Insert after the heading line and any directly following blank line
      const insertAt = point + 1;
      result.splice(insertAt, 0, '', `![Ilustração](${img})`, '');
    });

  return result.join('\n');
}

function getBodyImages(item: any): string[] {
  const images: string[] = (item?.article_images || []).filter(Boolean);
  const cover = item?.cover_image_url;
  return cover && images[0] === cover ? images.slice(1) : images;
}

export function ArticleReaderModal({ open, onOpenChange, item, onReplaceItem }: ArticleReaderModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [transformStep, setTransformStep] = useState('');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('watercolor');
  const [saveWsOpen, setSaveWsOpen] = useState(false);
  const [articleImages, setArticleImages] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState<string>('');
  const [liveTitle, setLiveTitle] = useState<string>('');
  const { lang } = useLanguage();

  useEffect(() => {
    if (item) {
      setNotes(item.notes || '');
      setArticleImages((item.article_images as string[]) || []);
      setCoverUrl(item.cover_image_url || null);
      setLiveContent(item.content || '');
      setLiveTitle(item.title || '');
    }
  }, [item?.id]);

  const isBlogArticle = item?.type === 'blog_article';
  const canTransform = !!item?.id && !isBlogArticle;

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

  const handleTransformToBlog = useCallback(async () => {
    if (!item?.id || transforming) return;
    setTransforming(true);

    const styleEmoji: Record<ImageStyle, string> = {
      watercolor: '🎨',
      oil: '🖌️',
      minimalist: '◻️',
      photographic: '📷',
    };
    const styleLabel: Record<ImageStyle, { PT: string; EN: string; ES: string }> = {
      watercolor: { PT: 'aquarela', EN: 'watercolor', ES: 'acuarela' },
      oil: { PT: 'óleo', EN: 'oil painting', ES: 'óleo' },
      minimalist: { PT: 'minimalista', EN: 'minimalist', ES: 'minimalista' },
      photographic: { PT: 'fotográfico', EN: 'photographic', ES: 'fotográfico' },
    };
    const sLabel = styleLabel[imageStyle][lang];

    const steps = lang === 'PT'
      ? ['Analisando o sermão...', 'Reestruturando como artigo...', `Gerando capa em ${sLabel} ${styleEmoji[imageStyle]}`, 'Distribuindo ilustrações nas seções 🖼️', 'Finalizando...']
      : lang === 'EN'
      ? ['Analyzing sermon...', 'Restructuring as article...', `Generating ${sLabel} cover ${styleEmoji[imageStyle]}`, 'Placing illustrations across sections 🖼️', 'Finishing...']
      : ['Analizando el sermón...', 'Reestructurando como artículo...', `Generando portada ${sLabel} ${styleEmoji[imageStyle]}`, 'Distribuyendo ilustraciones 🖼️', 'Finalizando...'];

    let stepIdx = 0;
    setTransformStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setTransformStep(steps[stepIdx]);
    }, 9000);

    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-article', {
        body: {
          passage: item.passage || item.title,
          title: item.title,
          source_content: item.content,
          source_type: item.type || 'sermon',
          image_style: imageStyle,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        lang === 'PT' ? 'Artigo de blog criado! Sermão original preservado.' :
        lang === 'EN' ? 'Blog article created! Original sermon preserved.' :
        '¡Artículo de blog creado! Sermón original conservado.'
      );

      queryClient.invalidateQueries({ queryKey: ['materials'] });

      // Swap to the newly created blog_article so user immediately sees it,
      // while the original sermon stays untouched in the library.
      if (onReplaceItem && data?.material_id) {
        onReplaceItem({
          id: data.material_id,
          title: data.title,
          type: 'blog_article',
          passage: data.passage,
          content: data.content,
          cover_image_url: data.cover_image_url,
          article_images: data.article_images,
        });
      }
    } catch (err: any) {
      console.error('Transform error:', err);
      const msg = err?.message?.includes('insufficient_credits')
        ? (lang === 'PT' ? 'Créditos insuficientes (15 necessários)' : 'Insufficient credits (15 needed)')
        : (lang === 'PT' ? 'Erro ao transformar em artigo' : 'Error transforming to article');
      toast.error(msg);
    } finally {
      clearInterval(interval);
      setTransforming(false);
      setTransformStep('');
    }
  }, [item, lang, imageStyle, queryClient, transforming, onReplaceItem]);

  if (!item) return null;

  const currentImages = articleImages.length > 0 ? articleImages : getBodyImages(item);
  const finalContent = intercalateImages(liveContent || '', currentImages);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const { pdfBrandHeader, pdfBrandFooter } = await import('@/lib/export-branding');
      const wrapper = document.createElement('div');
      wrapper.innerHTML = pdfBrandHeader();
      wrapper.appendChild(contentRef.current.cloneNode(true));
      wrapper.insertAdjacentHTML('beforeend', pdfBrandFooter());
      document.body.appendChild(wrapper);
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${(liveTitle || item.title).replace(/[^a-zA-Z0-9À-ú ]/g, '').substring(0, 60)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      await html2pdf().set(opt).from(wrapper).save();
      document.body.removeChild(wrapper);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const tx = (pt: string, en: string, es: string) => (lang === 'PT' ? pt : lang === 'EN' ? en : es);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col min-h-0 p-0 border-none rounded-2xl shadow-2xl [color-scheme:light]"
          style={{ backgroundColor: '#f7f5f0', color: '#1e1710' }}
        >
          {/* Top bar — discrete utility actions */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-1">
            {item.id && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`rounded-full p-2 hover:bg-black/5 transition-colors ${showNotes ? 'bg-black/5' : ''}`}
                style={{ color: '#1E1240' }}
                title={tx('Anotações do Pregador', 'Preacher Notes', 'Notas del Predicador')}
              >
                <StickyNote className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="rounded-full p-2 hover:bg-black/5 transition-colors"
              style={{ color: '#1E1240' }}
              title="Exportar PDF"
            >
              {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 hover:bg-black/5 transition-colors"
              style={{ color: '#1E1240' }}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Transform progress banner */}
          {transforming && transformStep && (
            <div
              className="mx-4 mt-14 mb-2 px-4 py-3 rounded-xl flex items-center gap-3"
              style={{ backgroundColor: '#ede6d8', color: '#3c2f21' }}
            >
              <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: '#C4956A' }} />
              <span className="text-sm font-medium">{transformStep}</span>
            </div>
          )}

          <DialogTitle className="sr-only">{liveTitle || item.title}</DialogTitle>

          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Main content */}
            <div className={`flex-1 min-w-0 overflow-y-auto ${showNotes ? 'border-r' : ''}`} style={{ borderColor: '#d4c8b8' }}>
              <div ref={contentRef} style={{ backgroundColor: '#f7f5f0' }}>
                {/* Cover image */}
                {coverUrl && (
                  <div className="w-full h-56 md:h-72 overflow-hidden rounded-t-2xl">
                    <img
                      src={coverUrl}
                      alt={liveTitle || item.title}
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
                    {liveTitle || item.title}
                  </h1>

                  {item.passage && (
                    <p className="text-sm flex items-center gap-1.5 mb-6" style={{ color: '#8B7355' }}>
                      <BookOpen className="w-4 h-4" /> {item.passage}
                    </p>
                  )}

                  <div className="w-16 h-0.5 mb-6" style={{ backgroundColor: '#C4956A' }} />

                  {/* Action bar — clear primary actions */}
                  {item.id && (
                    <div
                      className="mb-8 -mx-2 px-3 py-3 rounded-xl flex flex-col gap-3"
                      style={{ backgroundColor: '#efe7d6', border: '1px solid #e0d4be' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <p className="text-xs sm:text-sm flex-1" style={{ color: '#5a4a35' }}>
                          {tx(
                            'O que você quer fazer com este material?',
                            'What would you like to do with this material?',
                            '¿Qué quieres hacer con este material?'
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSaveWsOpen(true)}
                            className="gap-1.5 bg-white/70 hover:bg-white border-[#d4c8b8] text-[#3c2f21]"
                          >
                            <FolderOpen className="h-4 w-4" />
                            {tx('Salvar no Workspace', 'Save to Workspace', 'Guardar en Workspace')}
                          </Button>
                          {canTransform && (
                            <Button
                              size="sm"
                              onClick={handleTransformToBlog}
                              disabled={transforming}
                              className="gap-1.5 text-white"
                              style={{ backgroundColor: '#1E1240' }}
                            >
                              {transforming ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              {tx('Transformar em Artigo de Blog', 'Turn into Blog Article', 'Transformar en Artículo')}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Image style picker — only relevant when transforming */}
                      {canTransform && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t" style={{ borderColor: '#e0d4be' }}>
                          <span className="text-[11px] font-medium uppercase tracking-wide shrink-0" style={{ color: '#8B7355' }}>
                            {tx('Estilo das ilustrações', 'Illustration style', 'Estilo de ilustraciones')}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {([
                              { key: 'watercolor', pt: 'Aquarela', en: 'Watercolor', es: 'Acuarela', emoji: '🎨' },
                              { key: 'oil', pt: 'Óleo', en: 'Oil', es: 'Óleo', emoji: '🖌️' },
                              { key: 'minimalist', pt: 'Minimalista', en: 'Minimalist', es: 'Minimalista', emoji: '◻️' },
                              { key: 'photographic', pt: 'Fotográfico', en: 'Photo', es: 'Foto', emoji: '📷' },
                            ] as const).map((s) => {
                              const active = imageStyle === s.key;
                              return (
                                <button
                                  key={s.key}
                                  type="button"
                                  onClick={() => setImageStyle(s.key)}
                                  disabled={transforming}
                                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border disabled:opacity-50"
                                  style={
                                    active
                                      ? { backgroundColor: '#1E1240', color: '#fff', borderColor: '#1E1240' }
                                      : { backgroundColor: '#fff', color: '#5a4a35', borderColor: '#d4c8b8' }
                                  }
                                >
                                  <span className="mr-1">{s.emoji}</span>
                                  {tx(s.pt, s.en, s.es)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                      '--tw-prose-bullets': '#1E1240',
                      '--tw-prose-counters': '#1E1240',
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
                  <StickyNote className="h-4 w-4" style={{ color: '#1E1240' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#3c2f21' }}>
                    {tx('Anotações do Pregador', 'Preacher Notes', 'Notas del Predicador')}
                  </h3>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tx('Escreva suas anotações pessoais aqui...', 'Write your personal notes here...', 'Escribe tus notas personales aquí...')}
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
                  {tx('Salvar Anotações', 'Save Notes', 'Guardar Notas')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {item.id && (
        <SaveToWorkspaceDialog
          open={saveWsOpen}
          onOpenChange={setSaveWsOpen}
          materialId={item.id}
        />
      )}
    </>
  );
}
