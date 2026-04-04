import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Calendar, ArrowLeft, Search, Clock, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPublic() {
  const { handle } = useParams<{ handle: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['blog-profile', handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, blog_handle, plan')
        .eq('blog_handle', handle!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['blog-articles', profile?.id],
    queryFn: async () => {
      const { data: queueItems, error: qErr } = await supabase
        .from('editorial_queue')
        .select('material_id, published_at')
        .eq('user_id', profile!.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (qErr) throw qErr;
      if (!queueItems?.length) return [];

      const materialIds = queueItems.map(q => q.material_id).filter(Boolean) as string[];
      const { data: materials, error: mErr } = await supabase
        .from('materials')
        .select('*')
        .in('id', materialIds);
      if (mErr) throw mErr;

      const pubMap = new Map(queueItems.map(q => [q.material_id, q.published_at]));
      return (materials || [])
        .map(m => ({ ...m, published_at: pubMap.get(m.id) }))
        .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
    },
    enabled: !!profile?.id,
  });

  const isFree = profile?.plan === 'free';

  const filteredArticles = articles?.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const estimateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const getExcerpt = (content: string) => {
    return content
      .replace(/^#.*$/gm, '')
      .replace(/[#*_`>]/g, '')
      .trim()
      .substring(0, 160)
      .trim() + '...';
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4F3A]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Blog não encontrado</h1>
          <p className="text-[#6B4F3A]">O handle "{handle}" não existe.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[#3D2B1F]">{profile.full_name}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6B4F3A] hidden sm:inline">Início</span>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 h-9 w-48 bg-gray-50 border-gray-200 text-sm"
              />
            </div>
            {profile.blog_handle && (
              <Button size="sm" variant="outline" className="text-xs gap-1 border-[#6B4F3A] text-[#6B4F3A] hover:bg-[#6B4F3A] hover:text-white">
                <ExternalLink className="w-3 h-3" /> Visite nosso site
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#6B4F3A] via-[#8B6F5A] to-[#C4956A] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur">
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">{profile.full_name}</h1>
          {profile.bio && (
            <p className="text-white/80 text-base max-w-lg mx-auto mb-6">{profile.bio}</p>
          )}
          {/* Mobile search */}
          <div className="max-w-md mx-auto flex gap-2 sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artigos no blog..."
                className="pl-9 bg-white/90 text-[#3D2B1F] border-0 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Articles Section */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-serif text-2xl font-bold text-[#3D2B1F] text-center mb-8">
          Últimos Artigos Publicados
        </h2>

        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden bg-white border-gray-100">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !filteredArticles?.length ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-[#C4956A] mb-4" />
            <h3 className="text-xl font-serif text-[#3D2B1F]">
              {searchQuery ? 'Nenhum artigo encontrado' : 'Nenhum artigo publicado ainda'}
            </h3>
            <p className="text-[#6B4F3A] mt-2">
              {searchQuery ? 'Tente buscar com outros termos.' : 'Volte em breve para novos conteúdos.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => {
              const coverUrl = (article as any).cover_image_url;
              return (
                <Link key={article.id} to={`/blog/${handle}/${article.id}`} className="group">
                  <Card className="overflow-hidden bg-white border-gray-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#E8DDD0] to-[#D4C5B5]">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-[#C4956A]/50" />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5 flex flex-col flex-1">
                      <h3 className="font-serif text-lg font-bold text-[#3D2B1F] mb-2 line-clamp-2 group-hover:text-[#6B4F3A] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-[#6B4F3A]/80 mb-3 line-clamp-3 flex-1">
                        {getExcerpt(article.content)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#9B8A7A] mt-auto pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.published_at || article.created_at).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {estimateReadTime(article.content)} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Watermark for free plan */}
        {isFree && (
          <div className="text-center py-10 mt-8 border-t border-gray-100">
            <p className="text-xs text-[#C4956A]">
              ✝️ Gerado com{' '}
              <Link to="/" className="underline hover:text-[#6B4F3A]">Living Word</Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
