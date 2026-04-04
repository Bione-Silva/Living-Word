import { useEffect, useState, useMemo, useRef } from 'react';
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
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

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
  // Dynamic Open Graph & Twitter Card meta tags for rich social sharing
  useEffect(() => {
    if (!article) return;

    const url = window.location.href;
    const description = article.content
      ? article.content.replace(/[#*_\[\]()>`~]/g, '').substring(0, 160).trim() + '…'
      : '';
    const coverImg = (article as any)?.cover_image_url || '';
    const authorName = profile?.full_name || 'Living Word';

    const metaTags: Record<string, string> = {
      'og:type': 'article',
      'og:url': url,
      'og:title': article.title,
      'og:description': description,
      'og:image': coverImg,
      'og:site_name': `${authorName} — Living Word`,
      'og:locale': article.language === 'EN' ? 'en_US' : article.language === 'ES' ? 'es_ES' : 'pt_BR',
      'twitter:card': 'summary_large_image',
      'twitter:title': article.title,
      'twitter:description': description,
      'twitter:image': coverImg,
      'article:published_time': article.created_at,
      'article:author': authorName,
    };

    const cleanups: (() => void)[] = [];

    const prevTitle = document.title;
    document.title = `${article.title} — ${authorName}`;
    cleanups.push(() => { document.title = prevTitle; });

    Object.entries(metaTags).forEach(([key, value]) => {
      if (!value) return;
      const isOg = key.startsWith('og:') || key.startsWith('article:');
      const attr = isOg ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      const existed = !!el;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute('content');
      el.setAttribute('content', value);
      cleanups.push(() => {
        if (!existed && el?.parentNode) el.parentNode.removeChild(el);
        else if (existed && el) el.setAttribute('content', prev || '');
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [article, profile]);


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
  const shareTitle = article?.title || 'Living Word';
  const shareText = `${shareTitle}\n\n${articleUrl}`;

  const estimateReadTime = (content: string) => {
    const words = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  const openExternalShare = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    toast.success('Link copiado!');
    setShareOpen(false);
  };

  const handleShareWhatsApp = () => {
    openExternalShare(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`);
  };

  const handleShareX = () => {
    openExternalShare(`https://x.com/intent/post?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(articleUrl)}`);
  };

  const handleShareTelegram = () => {
    openExternalShare(`https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareTitle)}`);
  };

  const handleShareLinkedIn = () => {
    openExternalShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`);
  };

  const handleShareFacebook = () => {
    openExternalShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`);
  };

  // Close share dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    if (shareOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

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
            <div className="relative" ref={shareRef}>
              <Button variant="ghost" size="icon" onClick={() => setShareOpen(!shareOpen)} title="Compartilhar" className="text-[#6B4F3A] hover:text-[#3c2f21] hover:bg-[#3c2f21]/5">
                <Share2 className="w-4 h-4" />
              </Button>
              {shareOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#3c2f21]/10 py-2 min-w-[180px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button onClick={() => { handleShareX(); setShareOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3c2f21] hover:bg-[#3c2f21]/5 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </button>
                  <button onClick={() => { handleShareWhatsApp(); setShareOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3c2f21] hover:bg-[#3c2f21]/5 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button onClick={() => { handleShareTelegram(); setShareOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3c2f21] hover:bg-[#3c2f21]/5 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    Telegram
                  </button>
                  <button onClick={() => { handleShareLinkedIn(); setShareOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3c2f21] hover:bg-[#3c2f21]/5 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </button>
                  <button onClick={() => { handleShareFacebook(); setShareOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3c2f21] hover:bg-[#3c2f21]/5 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              )}
            </div>
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
