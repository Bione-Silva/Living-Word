import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Lock, Crown, BookOpen, FileText, Heart, Eye, Trash2, Copy, Star, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ArticleReaderModal } from '@/components/ArticleReaderModal';

const PAGE_SIZE = 20;

const typeLabels: Record<string, { PT: string; EN: string; ES: string; icon: React.ElementType }> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón', icon: BookOpen },
  outline: { PT: 'Esboço', EN: 'Outline', ES: 'Esquema', icon: FileText },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional', icon: Heart },
  blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo', icon: FileText },
  'topic-explorer': { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas', icon: FileText },
  'verse-finder': { PT: 'Versículos', EN: 'Verses', ES: 'Versículos', icon: BookOpen },
  'historical-context': { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico', icon: BookOpen },
  'quote-finder': { PT: 'Citações', EN: 'Quotes', ES: 'Citas', icon: FileText },
  'movie-scenes': { PT: 'Cenas de Filmes', EN: 'Movie Scenes', ES: 'Escenas', icon: FileText },
  'original-text': { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original', icon: FileText },
  'lexical': { PT: 'Análise Lexical', EN: 'Lexical Analysis', ES: 'Análisis Léxico', icon: FileText },
  'title-gen': { PT: 'Títulos', EN: 'Titles', ES: 'Títulos', icon: FileText },
  'metaphor-creator': { PT: 'Metáforas', EN: 'Metaphors', ES: 'Metáforas', icon: FileText },
  'bible-modernizer': { PT: 'Modernizador', EN: 'Modernizer', ES: 'Modernizador', icon: FileText },
  'illustrations': { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones', icon: FileText },
  'free-article': { PT: 'Artigo', EN: 'Article', ES: 'Artículo', icon: FileText },
  'reels-script': { PT: 'Roteiro Reels', EN: 'Reels Script', ES: 'Guión Reels', icon: FileText },
  'cell-group': { PT: 'Célula', EN: 'Cell Group', ES: 'Célula', icon: FileText },
  'social-caption': { PT: 'Legendas', EN: 'Captions', ES: 'Leyendas', icon: FileText },
  'newsletter': { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter', icon: FileText },
  'announcements': { PT: 'Avisos', EN: 'Announcements', ES: 'Avisos', icon: FileText },
  'trivia': { PT: 'Quiz', EN: 'Trivia', ES: 'Trivia', icon: FileText },
  'poetry': { PT: 'Poesia', EN: 'Poetry', ES: 'Poesía', icon: FileText },
  'kids-story': { PT: 'Infantil', EN: 'Kids Story', ES: 'Infantil', icon: FileText },
  'deep-translation': { PT: 'Tradução', EN: 'Translation', ES: 'Traducción', icon: FileText },
};

export default function Biblioteca() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [favFilter, setFavFilter] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const isFree = profile?.plan === 'free';
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searchPlaceholder = lang === 'PT'
    ? 'Buscar por título, passagem...'
    : lang === 'EN'
      ? 'Search by title, passage...'
      : 'Buscar por título, pasaje...';

  const allLabel = lang === 'PT' ? 'Todos' : lang === 'EN' ? 'All' : 'Todos';
  const deletedToast = lang === 'PT' ? 'Material excluído' : lang === 'EN' ? 'Material deleted' : 'Material eliminado';
  const copiedToast = lang === 'PT' ? 'Copiado!' : lang === 'EN' ? 'Copied!' : '¡Copiado!';
  const emptyLabel = lang === 'PT' ? 'Nenhum material encontrado' : lang === 'EN' ? 'No materials found' : 'No se encontraron materiales';
  const archivedLabel = lang === 'PT'
    ? 'Arquivado — desbloqueie no Pastoral'
    : lang === 'EN'
      ? 'Archived — unlock on Pastoral'
      : 'Archivado — desbloquéalo en Pastoral';

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['materials', user?.id, typeFilter, favFilter, search],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { items: [], nextPage: null };
      let query = supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      if (favFilter) {
        query = query.eq('favorite', true);
      }
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,passage.ilike.%${search}%`);
      }

      const { data: items, error } = await query;
      if (error) throw error;
      return {
        items: items || [],
        nextPage: (items?.length || 0) >= PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!user,
  });

  const allItems = data?.pages.flatMap((p) => p.items) || [];

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(deletedToast);
    },
  });

  const toggleFavMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const { error } = await supabase.from('materials').update({ favorite: !favorite }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(copiedToast);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">{t('library.title')}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px] border-lw-amber/40 bg-background text-foreground shadow-sm">
            <Filter className="h-3 w-3 mr-1 text-lw-cafe" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">{allLabel}</SelectItem>
            {Object.entries(typeLabels).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val[lang]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={favFilter ? 'default' : 'outline'}
          size="icon"
          onClick={() => setFavFilter(!favFilter)}
          className={`shrink-0 border-lw-amber/40 shadow-sm ${favFilter ? '' : 'text-lw-cafe'}`}
        >
          <Star className={`h-4 w-4 ${favFilter ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted/30" /></Card>
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {allItems.map((item: any, i: number) => {
            const typeInfo = typeLabels[item.type];
            const Icon = typeInfo?.icon || FileText;
            const isLocked = isFree && i >= 10;

            return (
              <Card key={item.id} className={`relative ${isLocked ? 'overflow-hidden' : ''}`}>
                {isLocked && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">{archivedLabel}</p>
                      <Button size="sm" className="mt-2 gap-1 bg-primary text-primary-foreground" asChild>
                        <a href="/upgrade"><Crown className="h-3 w-3" /> {t('upgrade.cta')}</a>
                      </Button>
                    </div>
                  </div>
                )}
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{item.title}</p>
                    <p className="text-xs text-foreground/60">
                      {item.passage && `${item.passage} · `}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0 text-foreground/80">{typeLabels[item.type]?.[lang] || item.type}</Badge>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleFavMutation.mutate({ id: item.id, favorite: item.favorite })}>
                      <Star className={`h-3 w-3 ${item.favorite ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewItem(item)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(item.content)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div ref={sentinelRef} className="py-4 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      )}

      <ArticleReaderModal
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
        item={viewItem}
      />
    </div>
  );
}
