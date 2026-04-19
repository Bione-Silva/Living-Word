import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Download, Loader2, X, StickyNote, Save, FolderOpen, Sparkles, Globe, CheckCircle2, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { SaveToWorkspaceDialog } from '@/components/workspaces/SaveToWorkspaceDialog';
import { openWhatsAppShare } from '@/lib/whatsapp';

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
 */
function intercalateImages(markdown: string, images: string[]): string {
  if (!images.length) return markdown;
  const lines = markdown.split('\n');
  const headingIndices: number[] = [];
  lines.forEach((line, i) => {
    if (/^#{2,3}\s/.test(line.trim())) headingIndices.push(i);
  });

  const candidates = headingIndices.slice(1);
  if (candidates.length === 0) return markdown;

  const insertPoints: number[] = [];
  const N = Math.min(images.length, candidates.length);
  for (let i = 0; i < N; i++) {
    const idx = Math.floor((i * candidates.length) / N);
    const point = candidates[idx];
    if (!insertPoints.includes(point)) insertPoints.push(point);
  }

  const result = [...lines];
  insertPoints
    .map((point, i) => ({ point, img: images[i] }))
    .reverse()
    .forEach(({ point, img }) => {
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
  const { user, profile } = useAuth();
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
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [publishing, setPublishing] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    if (item) {
      setNotes(item.notes || '');
      setArticleImages((item.article_images as string[]) || []);
      setCoverUrl(item.cover_image_url || null);
      setLiveContent(item.content || '');
      setLiveTitle(item.title || '');
      setPublishStatus('draft');
    }
  }, [item?.id]);

  const isBlogArticle = item?.type === 'blog_article';
  const canTransform = !!item?.id && !isBlogArticle;

  // Load current publish status for blog articles
  useEffect(() => {
    if (!item?.id || !isBlogArticle) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('editorial_queue')
        .select('status')
        .eq('material_id', item.id!)
        .maybeSingle();
      if (cancelled) return;
      const s = (data?.status as 'draft' | 'published' | 'archived') || 'draft';
      setPublishStatus(s);
    })();
    return () => { cancelled = true; };
  }, [item?.id, isBlogArticle]);

  const tx = (pt: string, en: string, es: string) => (lang === 'PT' ? pt : lang === 'EN' ? en : es);

  const saveNotes = useCallback(async () => {
    if (!item?.id) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase.from('materials').update({ notes }).eq('id', item.id);
      if (error) throw error;
      toast.success(tx('Anotações salvas!', 'Notes saved!', '¡Notas guardadas!'));
    } catch {
      toast.error(tx('Erro ao salvar', 'Error saving', 'Error al guardar'));
    } finally {
      setSavingNotes(false);
    }
  }, [item?.id, notes, lang]);

  const handlePublish = useCallback(async () => {
    if (!item?.id || !user || publishing) return;
    setPublishing(true);
    try {
      const { data: existing } = await supabase
        .from('editorial_queue')
        .select('id, status')
        .eq('material_id', item.id)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('editorial_queue')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('editorial_queue').insert({
          user_id: user.id,
          material_id: item.id,
          status: 'published',
          published_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      setPublishStatus('published');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      toast.success(tx('Artigo publicado! 🌍', 'Article published! 🌍', '¡Artículo publicado! 🌍'));
    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(tx('Erro ao publicar', 'Error publishing', 'Error al publicar'));
    } finally {
      setPublishing(false);
    }
  }, [item?.id, user, publishing, queryClient, lang]);

  const handleTransformToBlog = useCallback(async () => {
    if (!item?.id || transforming) return;
    setTransforming(true);

    const styleEmoji: Record<ImageStyle, string> = {
      watercolor: '🎨', oil: '🖌️', minimalist: '◻️', photographic: '📷',
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
      // Do NOT pass `title` so the edge function generates a clean topic-based title
      // (the source sermon's title can have prefixes like "Blog & Artigos" we don't want)
      const { data, error } = await supabase.functions.invoke('generate-blog-article', {
        body: {
          passage: item.passage || item.title,
          source_content: item.content,
          source_type: item.type || 'sermon',
          image_style: imageStyle,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        tx('Artigo de blog criado! Sermão original preservado.',
           'Blog article created! Original sermon preserved.',
           '¡Artículo de blog creado! Sermón original conservado.')
      );

      queryClient.invalidateQueries({ queryKey: ['materials'] });

      // Use the title returned by the edge function — never inherit the sermon's title
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
        ? tx('Créditos insuficientes (15 necessários)', 'Insufficient credits (15 needed)', 'Créditos insuficientes (15 necesarios)')
        : tx('Erro ao transformar em artigo', 'Error transforming to article', 'Error al transformar');
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
      // Force light surface for PDF export readability
      wrapper.style.background = '#ffffff';
      wrapper.style.color = '#1a1208';
      document.body.appendChild(wrapper);
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${(liveTitle || item.title).replace(/[^a-zA-Z0-9À-ú ]/g, '').substring(0, 60)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
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

  const isPublished = publishStatus === 'published';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="dark max-w-4xl w-[100vw] sm:w-[95vw] h-[100dvh] sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col min-h-0 p-0 border-0 sm:border sm:border-border rounded-none sm:rounded-2xl shadow-2xl bg-background text-foreground"
        >
          {/* Top bar — discrete utility actions */}
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3 z-20 flex items-center gap-1">
            {item.id && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`rounded-full p-2 transition-colors text-foreground/80 hover:text-foreground hover:bg-foreground/10 ${showNotes ? 'bg-foreground/10' : ''}`}
                title={tx('Anotações do Pregador', 'Preacher Notes', 'Notas del Predicador')}
              >
                <StickyNote className="h-5 w-5" />
              </button>
            )}
            {isBlogArticle && isPublished && item.id && profile?.blog_handle && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/blog/${profile.blog_handle}/${item.id}`;
                  const text = tx(
                    `📖 *${liveTitle || item.title}*\n\nLeia o artigo:\n${url}`,
                    `📖 *${liveTitle || item.title}*\n\nRead the article:\n${url}`,
                    `📖 *${liveTitle || item.title}*\n\nLee el artículo:\n${url}`,
                  );
                  openWhatsAppShare(text);
                }}
                className="rounded-full p-2 transition-colors text-foreground/80 hover:text-foreground hover:bg-foreground/10"
                title={tx('Compartilhar no WhatsApp', 'Share on WhatsApp', 'Compartir en WhatsApp')}
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="rounded-full p-2 transition-colors text-foreground/80 hover:text-foreground hover:bg-foreground/10"
              title="Exportar PDF"
            >
              {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 transition-colors text-foreground/80 hover:text-foreground hover:bg-foreground/10"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Transform progress banner */}
          {transforming && transformStep && (
            <div className="mx-3 sm:mx-4 mt-14 mb-2 px-3 sm:px-4 py-3 rounded-xl flex items-center gap-3 bg-primary/15 text-foreground border border-primary/30">
              <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
              <span className="text-sm font-medium break-words">{transformStep}</span>
            </div>
          )}

          <DialogTitle className="sr-only">{liveTitle || item.title}</DialogTitle>

          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Main content */}
            <div className={`flex-1 min-w-0 overflow-y-auto ${showNotes ? 'md:border-r md:border-border' : ''}`}>
              <div ref={contentRef} className="bg-background">
                {/* Cover image */}
                {coverUrl && (
                  <div className="w-full h-44 sm:h-56 md:h-72 overflow-hidden sm:rounded-t-2xl relative">
                    <img
                      src={coverUrl}
                      alt={liveTitle || item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Article content */}
                <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-10 max-w-3xl mx-auto">
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground break-words min-w-0 flex-1">
                      {liveTitle || item.title}
                    </h1>
                    {isBlogArticle && (
                      <Badge
                        variant="outline"
                        className={`mt-2 shrink-0 gap-1.5 ${
                          isPublished
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isPublished ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {isPublished
                          ? tx('Publicado', 'Published', 'Publicado')
                          : tx('Rascunho', 'Draft', 'Borrador')}
                      </Badge>
                    )}
                  </div>

                  {item.passage && (
                    <p className="text-sm flex items-center gap-1.5 mb-6 text-muted-foreground">
                      <BookOpen className="w-4 h-4" /> {item.passage}
                    </p>
                  )}

                  <div className="w-16 h-0.5 mb-6 bg-primary" />

                  {/* Action bar — clear primary actions */}
                  {item.id && (
                    <div className="mb-8 -mx-1 sm:-mx-2 px-2.5 sm:px-3 py-3 rounded-xl flex flex-col gap-3 bg-card border border-border">
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {tx(
                            'O que você quer fazer com este material?',
                            'What would you like to do with this material?',
                            '¿Qué quieres hacer con este material?'
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSaveWsOpen(true)}
                            className="gap-1.5 flex-1 sm:flex-none min-w-0"
                          >
                            <FolderOpen className="h-4 w-4 shrink-0" />
                            <span className="truncate">{tx('Salvar', 'Save', 'Guardar')}</span>
                          </Button>

                          {isBlogArticle && !isPublished && (
                            <Button
                              size="sm"
                              onClick={handlePublish}
                              disabled={publishing}
                              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex-1 sm:flex-none min-w-0"
                            >
                              {publishing ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              ) : (
                                <Globe className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">{tx('🌍 Publicar', '🌍 Publish', '🌍 Publicar')}</span>
                            </Button>
                          )}

                          {isBlogArticle && isPublished && (
                            <Badge className="gap-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 px-3 py-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {tx('Publicado', 'Published', 'Publicado')}
                            </Badge>
                          )}

                          {canTransform && (
                            <Button
                              size="sm"
                              onClick={handleTransformToBlog}
                              disabled={transforming}
                              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none min-w-0"
                            >
                              {transforming ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              ) : (
                                <Sparkles className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">{tx('Virar Artigo', 'To Article', 'A Artículo')}</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Image style picker — only relevant when transforming */}
                      {canTransform && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-border">
                          <span className="text-[11px] font-medium uppercase tracking-wide shrink-0 text-muted-foreground">
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
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border disabled:opacity-50 ${
                                    active
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-card text-foreground/80 border-border hover:border-primary/50'
                                  }`}
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
                    className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none break-words
                      prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:break-words
                      prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:break-words
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:py-2 prose-blockquote:px-3 sm:prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:bg-card prose-blockquote:text-foreground/95
                      prose-img:rounded-xl prose-img:shadow-2xl prose-img:mx-auto prose-img:max-h-96 prose-img:w-full prose-img:object-cover prose-img:my-6 sm:prose-img:my-8 prose-img:border prose-img:border-border
                      prose-a:text-primary prose-a:underline prose-a:break-words
                      prose-li:leading-relaxed prose-li:text-foreground/90
                      prose-strong:font-bold prose-strong:text-foreground
                      prose-code:text-primary prose-code:bg-card prose-code:px-1 prose-code:rounded prose-code:break-words
                      prose-pre:overflow-x-auto
                    "
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finalContent}
                    </ReactMarkdown>
                  </div>

                  <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
                    Feito com ❤️ pela Living Word
                  </div>
                </div>
              </div>
            </div>

            {/* Notes sidebar */}
            {showNotes && (
              <div className="w-full md:w-[280px] lg:w-[320px] shrink-0 flex flex-col p-4 overflow-y-auto bg-card border-t md:border-t-0 md:border-l border-border max-h-[40vh] md:max-h-none">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {tx('Anotações do Pregador', 'Preacher Notes', 'Notas del Predicador')}
                  </h3>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tx('Escreva suas anotações pessoais aqui...', 'Write your personal notes here...', 'Escribe tus notas personales aquí...')}
                  className="flex-1 min-h-[150px] sm:min-h-[200px] resize-none text-sm bg-background border-border text-foreground placeholder:text-muted-foreground"
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
