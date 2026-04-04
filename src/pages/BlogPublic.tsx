import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Calendar, Search, Clock } from 'lucide-react';
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
      <div className="min-h-screen bg-[hsl(40,30%,96%)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[hsl(40,30%,96%)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Blog não encontrado</h1>
          <p className="text-muted-foreground">O handle "{handle}" não existe.</p>
          <Link to="/">
            <Button variant="outline">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background theme-app">
      {/* Top Navigation */}
      <header className="bg-[hsl(40,30%,96%)] border-b border-border/30 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-primary">
            {profile.full_name}
          </h2>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hover:text-primary cursor-pointer">Início</span>
          </nav>
        </div>
      </header>

      {/* Hero Banner — warm tones */}
      <div className="bg-gradient-to-b from-primary/10 to-[hsl(40,30%,96%)] py-14 text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">Blog</h1>

        {/* Search */}
        <div className="max-w-md mx-auto flex items-center gap-2 px-4">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artigos no blog..."
              className="pl-4 pr-10 h-11 bg-card border-border/50 text-foreground placeholder:text-muted-foreground rounded-lg"
            />
          </div>
          <Button size="icon" variant="outline" className="h-11 w-11 border-border/50">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Articles Section */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-10">
          Últimos Artigos Publicados
        </h2>

        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden bg-card border-border/30">
                <Skeleton className="h-52 w-full rounded-none" />
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
            <BookOpen className="w-12 h-12 mx-auto text-accent mb-4" />
            <h3 className="text-xl font-serif text-foreground">
              {searchQuery ? 'Nenhum artigo encontrado' : 'Nenhum artigo publicado ainda'}
            </h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery ? 'Tente buscar com outros termos.' : 'Volte em breve para novos conteúdos.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => {
              const coverUrl = (article as any).cover_image_url;
              return (
                <Link key={article.id} to={`/blog/${handle}/${article.id}`} className="group">
                  <Card className="overflow-hidden bg-card border-border/20 hover:shadow-lg transition-all duration-300 h-full flex flex-col rounded-xl">
                    {/* Cover Image */}
                    <div className="relative h-52 overflow-hidden bg-muted/30">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <BookOpen className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5 flex flex-col flex-1">
                      <h3 className="font-serif text-lg font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {new Date(article.published_at || article.created_at).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3 flex-1">
                        {getExcerpt(article.content)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/20">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {estimateReadTime(article.content)} min de leitura
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Watermark */}
        {isFree && (
          <div className="text-center py-10 mt-8 border-t border-border/20">
            <p className="text-xs text-accent">
              ✝️ Gerado com{' '}
              <Link to="/" className="underline hover:text-primary">Living Word</Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
