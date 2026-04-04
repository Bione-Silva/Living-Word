import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Calendar, Share2, Copy, MessageCircle, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Lang = 'PT' | 'EN' | 'ES';

const LANG_LABELS: Record<Lang, string> = { PT: 'PT-BR', EN: 'EN', ES: 'ES' };

/**
 * Intercalates images semantically into markdown content.
 * Images are inserted after H2/H3 headings to break up text walls.
 */
function intercalateImages(markdown: string, images: string[]): string {
  if (!images.length) return markdown;

  const lines = markdown.split('\n');
  const headingIndices: number[] = [];

  lines.forEach((line, i) => {
    if (/^#{2,3}\s/.test(line.trim())) {
      headingIndices.push(i);
    }
  });

  // Skip the very first heading (title area), distribute images after subsequent headings
  const insertPoints = headingIndices.slice(1);
  const result = [...lines];
  let offset = 0;

  images.forEach((imgUrl, idx) => {
    if (idx < insertPoints.length) {
      // Insert after the heading line (+ 1 for the heading itself, + 1 for blank line)
      const insertAt = insertPoints[idx] + offset + 2;
      const imgMarkdown = `\n![Ilustração ${idx + 1}](${imgUrl})\n`;
      result.splice(insertAt, 0, imgMarkdown);
      offset += 1;
    }
  });

  // If there are leftover images (more images than headings), distribute evenly in remaining text
  const remaining = images.slice(insertPoints.length);
  if (remaining.length > 0) {
    const totalLines = result.length;
    remaining.forEach((imgUrl, idx) => {
      const position = Math.floor((totalLines / (remaining.length + 1)) * (idx + 1)) + offset;
      const imgMarkdown = `\n![Ilustração](${imgUrl})\n`;
      result.splice(Math.min(position, result.length), 0, imgMarkdown);
      offset += 1;
    });
  }

  return result.join('\n');
}

export default function BlogArticle() {
  const { handle, articleId } = useParams<{ handle: string; articleId: string }>();
  const [lang, setLang] = useState<Lang>('PT');

  useEffect(() => {
    document.documentElement.classList.add('theme-blog');
    document.body.classList.add('theme-blog');
    return () => {
      document.documentElement.classList.remove('theme-blog');
      document.body.classList.remove('theme-blog');
    };
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['blog-profile', handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, blog_handle, plan')
        .eq('blog_handle', handle!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  // Fetch all language versions of this article (same passage, same user)
  const { data: article, isLoading } = useQuery({
    queryKey: ['blog-article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', articleId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!articleId,
  });

  // Try to find sibling articles in other languages (same user, same passage, type blog_article)
  const { data: siblings } = useQuery({
    queryKey: ['blog-article-siblings', article?.user_id, article?.passage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, language, title')
        .eq('user_id', article!.user_id)
        .eq('passage', article!.passage || '')
        .eq('type', article!.type);
      if (error) throw error;
      return data || [];
    },
    enabled: !!article?.user_id && !!article?.passage,
  });

  const availableLangs = useMemo(() => {
    const langs = new Set<Lang>();
    langs.add((article?.language as Lang) || 'PT');
    siblings?.forEach(s => {
      if (s.language && ['PT', 'EN', 'ES'].includes(s.language)) {
        langs.add(s.language as Lang);
      }
    });
    return Array.from(langs);
  }, [article, siblings]);

  const coverUrl = (article as any)?.cover_image_url;
  const articleImages: string[] = ((article as any)?.article_images || []).filter(Boolean);
  // Remove cover from intercalation images (first image is usually the cover)
  const bodyImages = coverUrl && articleImages[0] === coverUrl ? articleImages.slice(1) : articleImages;

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';

  const estimateReadTime = (content: string) => {
    const words = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    toast.success('Link copiado!');
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${article?.title}\n\n${articleUrl}`)}`, '_blank');
  };

  const handleShareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title || '')}&url=${encodeURIComponent(articleUrl)}`, '_blank');
  };

  const handleLangSwitch = (newLang: Lang) => {
    const sibling = siblings?.find(s => s.language === newLang);
    if (sibling && sibling.id !== articleId) {
      window.location.href = `/blog/${handle}/${sibling.id}`;
    }
    setLang(newLang);
  };

  // Intercalate images into the markdown content
  const enrichedContent = useMemo(() => {
    if (!article?.content) return '';
    return intercalateImages(article.content, bodyImages);
  }, [article?.content, bodyImages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4F3A]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#3c2f21]">Artigo não encontrado</h1>
          <Link to={`/blog/${handle}`}>
            <Button variant="outline" className="border-[#6B4F3A]/30 text-[#6B4F3A]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      {/* Sticky Header */}
      <header className="bg-[#f7f5f0]/95 backdrop-blur-sm border-b border-[#3c2f21]/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={`/blog/${handle}`}
            className="flex items-center gap-2 text-sm text-[#6B4F3A] hover:text-[#3c2f21] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">{profile?.full_name || 'Blog'}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyLink} title="Copiar link" className="text-[#6B4F3A] hover:text-[#3c2f21] hover:bg-[#3c2f21]/5">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShareWhatsApp} title="WhatsApp" className="text-[#6B4F3A] hover:text-[#3c2f21] hover:bg-[#3c2f21]/5">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShareX} title="X/Twitter" className="text-[#6B4F3A] hover:text-[#3c2f21] hover:bg-[#3c2f21]/5">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image — full bleed */}
      {coverUrl && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={coverUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        {/* Title */}
        <h1
          className="font-serif text-3xl md:text-[2.75rem] md:leading-[1.2] font-bold text-[#3c2f21] mb-6 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {article.title}
        </h1>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6B4F3A]/70 mb-4 pb-5 border-b border-[#3c2f21]/10">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(article.created_at).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {estimateReadTime(article.content)} min de leitura
          </span>
          {article.passage && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> {article.passage}
            </span>
          )}
        </div>

        {/* Language Switcher */}
        {availableLangs.length > 1 && (
          <div className="flex items-center gap-2 mb-8">
            <Globe className="w-4 h-4 text-[#6B4F3A]/50" />
            <div className="flex rounded-full bg-[#3c2f21]/5 p-0.5">
              {availableLangs.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLangSwitch(l)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    (article.language || 'PT') === l
                      ? 'bg-[#6B4F3A] text-white shadow-sm'
                      : 'text-[#6B4F3A]/70 hover:text-[#3c2f21]'
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prose — images are intercalated within the markdown */}
        <section
          className="prose prose-lg prose-stone max-w-3xl mx-auto
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[#1a1208]
            prose-headings:font-serif
            prose-p:leading-relaxed prose-p:text-[#2e2318]
            prose-strong:text-[#1a1208]
            prose-blockquote:border-l-[#C4956A] prose-blockquote:bg-[#3c2f21]/[0.03] prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:text-[#2e2318] prose-blockquote:not-italic
            prose-img:rounded-2xl prose-img:shadow-2xl prose-img:mx-auto prose-img:w-full prose-img:object-cover prose-img:my-10
            prose-a:text-[#5a3e28] prose-a:underline-offset-2
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-5
            prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{enrichedContent}</ReactMarkdown>
        </section>

        {/* Share footer */}
        <div className="mt-14 pt-6 border-t border-[#3c2f21]/10 flex flex-col items-center gap-4">
          <p className="text-sm text-[#6B4F3A]/60 font-medium">Compartilhe esta mensagem</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="border-[#3c2f21]/15 text-[#6B4F3A] hover:bg-[#3c2f21]/5"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareX}
              className="border-[#3c2f21]/15 text-[#6B4F3A] hover:bg-[#3c2f21]/5"
            >
              <Share2 className="w-4 h-4 mr-2" /> X / Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-[#3c2f21]/15 text-[#6B4F3A] hover:bg-[#3c2f21]/5"
            >
              <Copy className="w-4 h-4 mr-2" /> Copiar Link
            </Button>
          </div>
        </div>

        {/* Powered by Living Word — mandatory viral signature */}
        <footer className="mt-10 pt-6 border-t border-[#3c2f21]/10 text-center">
          <p className="text-xs text-[#6B4F3A]/50">
            Feito com ❤️ por{' '}
            <Link to="/" className="font-semibold text-[#6B4F3A] hover:underline">
              Living Word
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
