import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Calendar, Share2, Copy, MessageCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const isFree = profile?.plan === 'free';
  const articleUrl = window.location.href;
  const coverUrl = (article as any)?.cover_image_url;
  const articleImages: string[] = (article as any)?.article_images || [];

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center theme-app">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center theme-app">
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
    <div className="min-h-screen bg-background theme-app">
      {/* Header */}
      <header className="bg-background border-b border-border/30 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/blog/${handle}`} className="flex items-center gap-2 text-sm text-primary hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            {profile?.full_name || 'Blog'}
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyLink} title="Copiar link">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShareWhatsApp} title="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShareX} title="X/Twitter">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {coverUrl && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img src={coverUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border/20">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(article.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {estimateReadTime(article.content)} min de leitura
          </span>
          {article.passage && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> {article.passage}
            </span>
          )}
        </div>

        <div
          className="prose prose-lg max-w-none prose-headings:font-serif [&]:text-[#4A3728] [&_h1]:text-[#3D2B1F] [&_h2]:text-[#3D2B1F] [&_h3]:text-[#3D2B1F] [&_h4]:text-[#3D2B1F] [&_p]:text-[#4A3728] [&_li]:text-[#4A3728] [&_strong]:text-[#3D2B1F] [&_em]:text-[#4A3728] [&_a]:text-[#6B4F3A] [&_blockquote]:text-[#5A4738] [&_blockquote]:border-l-[#C4956A] [&_blockquote]:bg-white/50 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:rounded-r-lg"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {/* Additional article images */}
        {articleImages.length > 1 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articleImages.slice(1).map((imgUrl, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden shadow-sm">
                <img src={imgUrl} alt={`${article.title} — imagem ${idx + 2}`} className="w-full h-48 object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* Share footer */}
        <div className="mt-12 pt-6 border-t border-border/20 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Compartilhe esta mensagem</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="border-border/40">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareX} className="border-border/40">
              <Share2 className="w-4 h-4 mr-2" /> X / Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="border-border/40">
              <Copy className="w-4 h-4 mr-2" /> Copiar Link
            </Button>
          </div>
        </div>

        {/* Powered by Living Word — always visible */}
        <footer className="mt-10 pt-6 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground">
            Feito com ❤️ por{' '}
            <Link to="/" className="font-semibold text-primary hover:underline">Living Word</Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
