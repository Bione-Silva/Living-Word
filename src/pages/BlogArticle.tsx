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

type PublicBlogProfile = {
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  blog_name: string | null;
  blog_handle: string;
  church_name: string | null;
  city: string | null;
  country: string | null;
  font_family: string | null;
  language: string;
  layout_style: string | null;
  theme_color: string | null;
};

type PublicBlogArticle = {
  id: string;
  type: string;
  title: string;
  content: string;
  bible_version: string | null;
  language: string | null;
  passage: string | null;
  article_images: string[] | null;
  cover_image_url: string | null;
  updated_at: string;
  created_at: string;
  favorite: boolean | null;
};

type PublicBlogSibling = {
  id: string;
  language: string | null;
  title: string;
};

const LANG_LABELS: Record<Lang, string> = { PT: 'PT-BR', EN: 'EN', ES: 'ES' };

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

  const remaining = images.slice(insertPoints.length);
  if (remaining.length > 0) {
    const totalLines = result.length;
    remaining.forEach((imgUrl, idx) => {
      const position = Math.floor((totalLines / (remaining.length + 1)) * (idx + 1)) + offset;
      result.splice(Math.min(position, result.length), 0, `\n![Ilustração](${imgUrl})\n`);
      offset += 1;
    });
  }

  return result.join('\n');
}

export default function BlogArticle() {
  const { handle, articleId } = useParams<{ handle: string; articleId: string }>();
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

  const { data: profile } = useQuery<PublicBlogProfile>({
    queryKey: ['blog-profile', handle],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_blog_profile', { p_handle: handle! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('Profile not found');
      return row;
    },
    enabled: !!handle,
  });

  const { data: article, isLoading } = useQuery<PublicBlogArticle | null>({
    queryKey: ['blog-article', articleId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_public_blog_article', { p_article_id: articleId! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    },
    enabled: !!articleId,
  });

  const { data: siblings } = useQuery<PublicBlogSibling[]>({
    queryKey: ['blog-article-siblings', articleId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_public_blog_siblings', { p_article_id: articleId! });
      if (error) throw error;
      return data || [];
    },
    enabled: !!articleId,
  });

  useEffect(() => {
    if (!article) return;

    const url = window.location.href;
    const description = article.content
      ? article.content.replace(/[#*_\[\]()>`~]/g, '').substring(0, 160).trim() + '…'
      : '';
    const coverImg = article.cover_image_url || '';
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

    return () => cleanups.forEach((fn) => fn());
  }, [article, profile]);

  const availableLangs = useMemo(() => {
    const langs = new Set<Lang>();
    langs.add((article?.language as Lang) || 'PT');
    siblings?.forEach((s) => {
      if (s.language && ['PT', 'EN', 'ES'].includes(s.language)) langs.add(s.language as Lang);
    });
    return Array.from(langs);
  }, [article, siblings]);

  const coverUrl = article?.cover_image_url;
  const articleImages = (article?.article_images || []).filter(Boolean);
  const bodyImages = coverUrl && articleImages[0] === coverUrl ? articleImages.slice(1) : articleImages;

  const articleUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const { origin, pathname } = window.location;
    const isPreview = origin.includes('localhost') || origin.includes('preview');
    const publicOrigin = isPreview ? 'https://living-word.lovable.app' : origin;
    return `${publicOrigin}${pathname}`;
  }, []);

  const shareTitle = article?.title || 'Living Word';

  const estimateReadTime = (content: string) => Math.max(1, Math.ceil((content?.split(/\s+/).length || 0) / 200));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(articleUrl).then(() => toast.success('Link copiado!'));
    setShareOpen(false);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n\n${articleUrl}`)}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };
  const handleShareX = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };
  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };
  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };
  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    if (shareOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const handleLangSwitch = (newLang: Lang) => {
    const sibling = siblings?.find((s) => s.language === newLang);
    if (sibling && sibling.id !== articleId) window.location.href = `/blog/${handle}/${sibling.id}`;
  };

  const enrichedContent = useMemo(() => {
    if (!article?.content) return '';
    return intercalateImages(article.content, bodyImages);
  }, [article?.content, bodyImages]);

  if (isLoading) {
    return <div className="min-h-screen bg-background theme-blog flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background theme-blog flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Artigo não encontrado</h1>
          <Link to={`/blog/${handle}`}>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background theme-blog">
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/blog/${handle}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">{profile?.full_name || 'Blog'}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyLink} title="Copiar link"><Copy className="w-4 h-4" /></Button>
            <div className="relative" ref={shareRef}>
              <Button variant="ghost" size="icon" onClick={() => setShareOpen(!shareOpen)} title="Compartilhar"><Share2 className="w-4 h-4" /></Button>
              {shareOpen && (
                <div className="absolute right-0 top-full mt-2 bg-card rounded-xl shadow-xl border border-border py-2 min-w-[180px] z-50">
                  <button onClick={handleShareX} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">X (Twitter)</button>
                  <button onClick={handleShareWhatsApp} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"><MessageCircle className="w-4 h-4" />WhatsApp</button>
                  <button onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">Telegram</button>
                  <button onClick={handleShareLinkedIn} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">LinkedIn</button>
                  <button onClick={handleShareFacebook} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">Facebook</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {coverUrl && <div className="w-full h-64 md:h-96 overflow-hidden"><img src={coverUrl} alt={article.title} className="w-full h-full object-cover" /></div>}

      <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="font-display text-3xl md:text-[2.75rem] md:leading-[1.2] font-bold text-foreground mb-6 leading-tight">{article.title}</h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-4 pb-5 border-b border-border">
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(article.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{estimateReadTime(article.content)} min de leitura</span>
          {article.passage && <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {article.passage}</span>}
        </div>

        {availableLangs.length > 1 && (
          <div className="flex items-center gap-2 mb-8">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="flex rounded-full bg-muted p-0.5">
              {availableLangs.map((l) => (
                <button key={l} onClick={() => handleLangSwitch(l)} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${(article.language || 'PT') === l ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        )}

        <section className="prose prose-lg pastoral-prose max-w-3xl mx-auto prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto prose-img:max-h-[28rem] prose-img:w-full prose-img:object-cover prose-img:my-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{enrichedContent}</ReactMarkdown>
        </section>
      </article>
    </div>
  );
}
