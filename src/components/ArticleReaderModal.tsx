import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleReaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    title: string;
    passage?: string | null;
    content: string;
    cover_image_url?: string | null;
    article_images?: string[] | null;
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
  if (!item) return null;

  const finalContent = intercalateImages(item.content || '', getBodyImages(item));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#f7f5f0' }}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-20 rounded-full p-2 hover:bg-black/5 transition-colors"
          style={{ color: '#6B4F3A' }}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </button>

        <DialogTitle className="sr-only">{item.title}</DialogTitle>

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
          {/* Title */}
          <h1
            className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4"
            style={{ color: '#3c2f21' }}
          >
            {item.title}
          </h1>

          {/* Passage */}
          {item.passage && (
            <p className="text-sm flex items-center gap-1.5 mb-6" style={{ color: '#8B7355' }}>
              <BookOpen className="w-4 h-4" /> {item.passage}
            </p>
          )}

          {/* Divider */}
          <div className="w-16 h-0.5 mb-8" style={{ backgroundColor: '#C4956A' }} />

          {/* Prose content */}
          <div
            className="prose prose-stone prose-lg max-w-none
              prose-headings:font-display prose-headings:font-bold
              prose-p:leading-relaxed
              prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-img:w-full prose-img:rounded-xl prose-img:shadow-sm prose-img:my-6
              prose-a:underline
            "
            style={{
              '--tw-prose-headings': '#3c2f21',
              '--tw-prose-body': '#4a3f35',
              '--tw-prose-bold': '#3c2f21',
              '--tw-prose-quotes': '#5a4a3a',
              '--tw-prose-quote-borders': '#C4956A',
              '--tw-prose-links': '#6B4F3A',
            } as React.CSSProperties}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {finalContent}
            </ReactMarkdown>
          </div>

          {/* Footer signature */}
          <div className="mt-10 pt-6 border-t text-center text-xs" style={{ borderColor: '#d4c8b8', color: '#a0906e' }}>
            Feito com ❤️ pela Living Word
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
