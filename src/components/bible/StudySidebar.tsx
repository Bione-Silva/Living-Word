// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Copy, Share2, FileDown, Loader2, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getBookName, type L } from '@/lib/bible-data';
import ReactMarkdown from 'react-markdown';

/** Convert structured study JSON to markdown */
function studyToMarkdown(study: Record<string, any>): string {
  const lines: string[] = [];
  if (study.title) lines.push(`# ${study.title}\n`);
  if (study.central_idea) lines.push(`> ${study.central_idea}\n`);
  if (study.summary) lines.push(`## Resumo\n${study.summary}\n`);

  if (study.historical_context?.text) {
    lines.push(`## Contexto Histórico\n${study.historical_context.text}\n`);
  }
  if (study.literary_context) {
    const lc = study.literary_context;
    if (lc.genre) lines.push(`**Gênero literário:** ${lc.genre}\n`);
    if (lc.position_in_book) lines.push(`${lc.position_in_book}\n`);
  }

  if (study.bible_text?.length) {
    lines.push(`## Texto Bíblico\n`);
    for (const v of study.bible_text) {
      lines.push(`**${v.reference || ''}** — ${v.text || ''}\n`);
    }
  }

  if (study.text_structure?.length) {
    lines.push(`## Estrutura do Texto\n`);
    for (const s of study.text_structure) {
      lines.push(`- **${s.section || ''}** (${s.verses || ''}): ${s.description || ''}`);
    }
    lines.push('');
  }

  if (study.exegesis?.length) {
    lines.push(`## Exegese\n`);
    for (const e of study.exegesis) {
      lines.push(`### ${e.verse_ref || e.verse || ''}\n`);
      if (e.linguistic_note) lines.push(`${e.linguistic_note}\n`);
      if (e.theological_insight) lines.push(`*${e.theological_insight}*\n`);
    }
  }

  if (study.theological_interpretation?.length) {
    lines.push(`## Interpretação Teológica\n`);
    for (const t of study.theological_interpretation) {
      lines.push(`- **${t.theme || ''}**: ${t.interpretation || ''}`);
    }
    lines.push('');
  }

  if (study.biblical_connections?.length) {
    lines.push(`## Conexões Bíblicas\n`);
    for (const c of study.biblical_connections) {
      lines.push(`- **${c.reference || ''}**: ${c.note || ''}`);
    }
    lines.push('');
  }

  if (study.application?.length) {
    lines.push(`## Aplicação\n`);
    for (const a of study.application) {
      lines.push(`- **${a.application || ''}** → ${a.practical_action || ''}`);
    }
    lines.push('');
  }

  if (study.reflection_questions?.length) {
    lines.push(`## Perguntas para Reflexão\n`);
    for (const q of study.reflection_questions) {
      lines.push(`- ${q.question || q}`);
    }
    lines.push('');
  }

  if (study.conclusion) lines.push(`## Conclusão\n${study.conclusion}\n`);
  if (study.pastoral_warning) lines.push(`> ⚠️ ${study.pastoral_warning}\n`);

  return lines.join('\n');
}

const labels = {
  title: { PT: 'Estudo Rápido', EN: 'Quick Study', ES: 'Estudio Rápido' },
  generating: { PT: 'Gerando estudo...', EN: 'Generating study...', ES: 'Generando estudio...' },
  copied: { PT: 'Estudo copiado!', EN: 'Study copied!', ES: '¡Estudio copiado!' },
  shared: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  pdfDownloading: { PT: 'Baixando PDF...', EN: 'Downloading PDF...', ES: 'Descargando PDF...' },
  error: { PT: 'Erro ao gerar estudo.', EN: 'Error generating study.', ES: 'Error al generar estudio.' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  share: { PT: 'Enviar', EN: 'Share', ES: 'Compartir' },
  pdf: { PT: 'PDF', EN: 'PDF', ES: 'PDF' },
} satisfies Record<string, Record<L, string>>;

// Match verse references like "João 3:16", "Genesis 1:1-3", "1 Coríntios 13:4"
const verseRefRegex = /(\d?\s?[A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)\s+(\d+):(\d+)(?:-(\d+))?/g;

interface StudySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passage: string;
  verseText: string;
  bookId: string;
  chapter: number;
  onNavigate: (bookId: string, chapter: number) => void;
}

export function StudySidebar({ open, onOpenChange, passage, verseText, bookId, chapter, onNavigate }: StudySidebarProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastPassageRef = useRef('');

  const generate = useCallback(async () => {
    if (!user || !passage) return;
    if (passage === lastPassageRef.current && content) return;
    lastPassageRef.current = passage;
    setLoading(true);
    setError('');
    setContent('');

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-biblical-study', {
        body: {
          bible_passage: passage,
          depth_level: 'basic',
          language: lang === 'PT' ? 'Português' : lang === 'EN' ? 'English' : 'Español',
        },
      });

      if (fnErr) throw fnErr;
      // The edge function returns { study: { title, summary, exegesis, ... } }
      const study = data?.study;
      if (study) {
        const md = studyToMarkdown(study);
        setContent(md);
      } else {
        setError(labels.error[lang]);
      }
    } catch {
      setError(labels.error[lang]);
    } finally {
      setLoading(false);
    }
  }, [user, passage, lang]);

  // Trigger generation when sidebar opens with a passage
  useEffect(() => {
    if (open && passage && user) {
      generate();
    }
    if (!open) {
      lastPassageRef.current = '';
    }
  }, [open, passage, user, generate]);

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success(labels.copied[lang]);
  };

  const handleShare = async () => {
    const text = `${passage}\n\n${content}`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success(labels.shared[lang]);
    }
  };

  const handlePdf = async () => {
    toast.info(labels.pdfDownloading[lang]);
    const { default: html2pdf } = await import('html2pdf.js');
    const { pdfBrandHeader, pdfBrandFooter } = await import('@/lib/export-branding');
    const el = document.getElementById('study-sidebar-content');
    if (!el) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = pdfBrandHeader();
    wrapper.appendChild(el.cloneNode(true));
    wrapper.insertAdjacentHTML('beforeend', pdfBrandFooter());
    document.body.appendChild(wrapper);
    html2pdf().set({
      margin: [10, 10],
      filename: `${passage.replace(/\s+/g, '_')}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(wrapper).save();
    document.body.removeChild(wrapper);
  };

  // Render markdown with clickable verse references
  const renderContent = () => {
    if (!content) return null;

    // Process content to make verse references clickable
    const processedContent = content.replace(verseRefRegex, (match) => {
      return `[${match}](#verse-ref)`;
    });

    return (
      <div id="study-sidebar-content" className="prose prose-sm max-w-none text-foreground/90">
        <ReactMarkdown
          components={{
            a: ({ children, href }) => {
              if (href === '#verse-ref') {
                const text = String(children);
                return (
                  <button
                    onClick={() => handleVerseClick(text)}
                    className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary font-medium cursor-pointer"
                  >
                    {text}
                    <ExternalLink className="h-3 w-3 inline" />
                  </button>
                );
              }
              return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
            },
            h1: ({ children }) => <h1 className="text-lg font-display font-bold text-foreground mb-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-display font-bold text-foreground mt-5 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-display font-bold text-foreground mt-4 mb-1.5">{children}</h3>,
            p: ({ children }) => <p className="text-sm leading-relaxed text-foreground/85 mb-3">{children}</p>,
            li: ({ children }) => <li className="text-sm leading-relaxed text-foreground/85">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-3 border-primary/40 pl-3 italic text-foreground/80 my-3">
                {children}
              </blockquote>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  };

  const handleVerseClick = (refText: string) => {
    // Try to navigate to the verse reference
    // For now, navigate to the same book/chapter since full parsing is complex
    onNavigate(bookId, chapter);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] p-0 border-l border-border bg-card">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold tracking-wide text-foreground">
                  {labels.title[lang]}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">{passage}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {content && !loading && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/60 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/60 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" /> {labels.share[lang]}
              </button>
              <button
                onClick={handlePdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted/60 transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" /> {labels.pdf[lang]}
              </button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">{labels.generating[lang]}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={generate}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  {lang === 'PT' ? 'Tentar novamente' : lang === 'EN' ? 'Try again' : 'Intentar de nuevo'}
                </button>
              </div>
            ) : content ? (
              renderContent()
            ) : (
              <p className="text-xs text-muted-foreground text-center py-12">
                {lang === 'PT' ? 'Selecione versículos para gerar um estudo.' : lang === 'EN' ? 'Select verses to generate a study.' : 'Seleccione versículos para generar un estudio.'}
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
