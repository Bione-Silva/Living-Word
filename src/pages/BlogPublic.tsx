import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Share2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPublic() {
  const { handle } = useParams<{ handle: string }>();

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

  const isLoading = profileLoading || articlesLoading;
  const isFree = profile?.plan === 'free';

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4F3A]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-[#E8DDD0] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#6B4F3A] flex items-center justify-center text-white font-bold">
                {profile.full_name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h1 className="font-serif text-lg font-bold text-[#3D2B1F]">{profile.full_name}</h1>
              {profile.bio && <p className="text-xs text-[#6B4F3A]">{profile.bio}</p>}
            </div>
          </div>
          <Link to="/" className="text-xs text-[#C4956A] hover:text-[#6B4F3A] font-medium">
            Living Word
          </Link>
        </div>
      </header>

      {/* Articles */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {articlesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white border-[#E8DDD0]">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !articles?.length ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-[#C4956A] mb-4" />
            <h2 className="text-xl font-serif text-[#3D2B1F]">Nenhum artigo publicado ainda</h2>
            <p className="text-[#6B4F3A] mt-2">Volte em breve para novos conteúdos.</p>
          </div>
        ) : (
          articles.map(article => (
            <Link key={article.id} to={`/blog/${handle}/${article.id}`}>
              <Card className="bg-white border-[#E8DDD0] hover:shadow-md transition-shadow cursor-pointer mb-4">
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-bold text-[#3D2B1F] mb-2">{article.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-[#6B4F3A] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.published_at || article.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {article.passage && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {article.passage}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6B4F3A] line-clamp-3">
                    {article.content.replace(/[#*_`>]/g, '').substring(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}

        {/* Watermark for free plan */}
        {isFree && (
          <div className="text-center py-8 border-t border-[#E8DDD0]">
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
