import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Calendar, Share2, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BlogArticle() {
  const { handle, articleId } = useParams<{ handle: string; articleId: string }>();

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
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!articleId,
  });

  const isFree = profile?.plan === 'free';
  const articleUrl = window.location.href;

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
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4F3A]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Artigo não encontrado</h1>
          <Link to={`/blog/${handle}`}>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-[#E8DDD0] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/blog/${handle}`} className="flex items-center gap-2 text-sm text-[#6B4F3A] hover:text-[#3D2B1F]">
            <ArrowLeft className="w-4 h-4" />
            {profile?.full_name || 'Blog'}
          </Link>
          <div className="flex items-center gap-2">
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

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#3D2B1F] mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-[#6B4F3A] mb-8 pb-6 border-b border-[#E8DDD0]">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(article.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {article.passage && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> {article.passage}
            </span>
          )}
        </div>

        <div className="prose prose-lg prose-stone max-w-none
          prose-headings:font-serif prose-headings:text-[#3D2B1F]
          prose-p:text-[#4A3728] prose-p:leading-relaxed
          prose-a:text-[#C4956A] prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-[#C4956A] prose-blockquote:bg-white/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
          prose-strong:text-[#3D2B1F]
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {/* Share footer */}
        <div className="mt-12 pt-6 border-t border-[#E8DDD0] flex flex-col items-center gap-4">
          <p className="text-sm text-[#6B4F3A]">Compartilhe esta mensagem</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="border-[#E8DDD0]">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareX} className="border-[#E8DDD0]">
              <Share2 className="w-4 h-4 mr-2" /> X / Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="border-[#E8DDD0]">
              <Copy className="w-4 h-4 mr-2" /> Copiar Link
            </Button>
          </div>
        </div>

        {/* Watermark */}
        {isFree && (
          <div className="mt-8 text-center">
            <p className="text-xs text-[#C4956A]">
              ✝️ Gerado com{' '}
              <Link to="/" className="underline hover:text-[#6B4F3A]">Living Word</Link>
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
