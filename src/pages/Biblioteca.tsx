import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Lock, Crown, BookOpen, FileText, Heart, Eye, Trash2, Copy, Star, Loader2, FolderOpen, SearchCheck, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { ArticleReaderModal } from '@/components/ArticleReaderModal';
import { SaveToWorkspaceDialog } from '@/components/workspaces/SaveToWorkspaceDialog';
import { SermonCoverPlaceholder } from '@/components/SermonCoverPlaceholder';

const isSermonLike = (type: string) => type === 'sermon' || type === 'outline';

const PAGE_SIZE = 20;

const typeLabels: Record<string, { PT: string; EN: string; ES: string; icon: React.ElementType }> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón', icon: BookOpen },
  outline: { PT: 'Esboço', EN: 'Outline', ES: 'Esquema', icon: FileText },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional', icon: Heart },
  biblical_study: { PT: 'Estudo Bíblico', EN: 'Biblical Study', ES: 'Estudio Bíblico', icon: BookOpen },
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
  'deep_search': { PT: 'Pesquisa Profunda', EN: 'Deep Search', ES: 'Búsqueda Profunda', icon: SearchCheck },
};

type ChipFilter = { key: string; label: { PT: string; EN: string; ES: string }; types: string[] };

const chipFilters: ChipFilter[] = [
  { key: 'all', label: { PT: 'Todos', EN: 'All', ES: 'Todos' }, types: [] },
  { key: 'sermons', label: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' }, types: ['sermon', 'outline'] },
  { key: 'studies', label: { PT: 'Estudos Bíblicos', EN: 'Biblical Studies', ES: 'Estudios Bíblicos' }, types: ['biblical_study'] },
  { key: 'articles', label: { PT: 'Artigos', EN: 'Articles', ES: 'Artículos' }, types: ['blog_article', 'free-article'] },
  { key: 'devotionals', label: { PT: 'Devocionais', EN: 'Devotionals', ES: 'Devocionales' }, types: ['devotional'] },
  { key: 'cells', label: { PT: 'Células', EN: 'Cell Groups', ES: 'Células' }, types: ['cell-group'] },
  { key: 'reels', label: { PT: 'Reels', EN: 'Reels', ES: 'Reels' }, types: ['reels-script'] },
  { key: 'newsletter', label: { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' }, types: ['newsletter'] },
  { key: 'social', label: { PT: 'Social', EN: 'Social', ES: 'Social' }, types: ['social-caption', 'announcements'] },
  { key: 'research', label: { PT: 'Pesquisa', EN: 'Research', ES: 'Investigación' }, types: ['topic-explorer', 'verse-finder', 'historical-context', 'quote-finder', 'movie-scenes', 'original-text', 'lexical', 'illustrations', 'deep_search'] },
  { key: 'deep_search', label: { PT: 'Pesquisa Profunda', EN: 'Deep Search', ES: 'Búsqueda Profunda' }, types: ['deep_search'] },
  { key: 'extras', label: { PT: 'Extras', EN: 'Extras', ES: 'Extras' }, types: ['trivia', 'poetry', 'kids-story', 'deep-translation', 'title-gen', 'metaphor-creator', 'bible-modernizer'] },
];

export default function Biblioteca() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [chipFilter, setChipFilter] = useState('all');
  const activeChip = chipFilters.find((c) => c.key === chipFilter) || chipFilters[0];
  const [favFilter, setFavFilter] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [saveToWsItem, setSaveToWsItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (localStorage.getItem('library_view_mode') as 'grid' | 'list') || 'grid';
  });
  useEffect(() => {
    localStorage.setItem('library_view_mode', viewMode);
  }, [viewMode]);
  const isFree = isFreePlan(profile?.plan);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searchPlaceholder = lang === 'PT'
    ? 'Buscar por título, passagem...'
    : lang === 'EN'
      ? 'Search by title, passage...'
      : 'Buscar por título, pasaje...';

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
    queryKey: ['materials', user?.id, chipFilter, favFilter, search],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { items: [], nextPage: null };
      let query = supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (activeChip.types.length === 1) {
        query = query.eq('type', activeChip.types[0]);
      } else if (activeChip.types.length > 1) {
        query = query.in('type', activeChip.types);
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
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('library.title')}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>
        <div className="shrink-0 inline-flex items-center rounded-md border border-border bg-card p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`h-8 w-8 inline-flex items-center justify-center rounded-sm transition-colors ${
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`h-8 w-8 inline-flex items-center justify-center rounded-sm transition-colors ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant={favFilter ? 'default' : 'outline'}
          size="icon"
          onClick={() => setFavFilter(!favFilter)}
          className={`shrink-0 border-border shadow-sm ${favFilter ? '' : 'text-muted-foreground'}`}
        >
          <Star className={`h-4 w-4 ${favFilter ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {chipFilters.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setChipFilter(chip.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              chipFilter === chip.key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
            }`}
          >
            {chip.label[lang]}
          </button>
        ))}
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
      ) : viewMode === 'list' ? (
        <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
          {allItems.map((item: any, i: number) => {
            const typeInfo = typeLabels[item.type];
            const Icon = typeInfo?.icon || FileText;
            const isLocked = isFree && i >= 10;
            return (
              <div
                key={item.id}
                className={`relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-secondary/40 transition-colors ${isLocked ? '' : 'cursor-pointer'}`}
                onClick={() => !isLocked && setViewItem(item)}
              >
                {isLocked && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{archivedLabel}</span>
                      <Button size="sm" className="ml-2 gap-1 bg-primary text-primary-foreground" asChild>
                        <a href="/upgrade"><Crown className="h-3 w-3" /> {t('upgrade.cta')}</a>
                      </Button>
                    </div>
                  </div>
                )}
                <div className="h-12 w-12 shrink-0 rounded-md bg-secondary/50 overflow-hidden flex items-center justify-center">
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : isSermonLike(item.type) ? (
                    <SermonCoverPlaceholder iconClassName="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] text-secondary-foreground">
                      {typeLabels[item.type]?.[lang] || item.type}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {item.passage && (
                      <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">· {item.passage}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleFavMutation.mutate({ id: item.id, favorite: item.favorite }); }}>
                    <Star className={`h-4 w-4 ${item.favorite ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hidden sm:inline-flex" onClick={(e) => { e.stopPropagation(); handleCopy(item.content); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hidden sm:inline-flex" onClick={(e) => { e.stopPropagation(); setSaveToWsItem(item.id); }}>
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allItems.map((item: any, i: number) => {
            const typeInfo = typeLabels[item.type];
            const Icon = typeInfo?.icon || FileText;
            const isLocked = isFree && i >= 10;
            const excerpt = item.content
              ? item.content.replace(/[#*_\[\]>`~]/g, '').slice(0, 140).trim() + (item.content.length > 140 ? '…' : '')
              : '';

            return (
              <Card key={item.id} className={`relative group overflow-hidden hover:shadow-lg transition-shadow ${isLocked ? '' : 'cursor-pointer'}`}>
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

                {/* Cover image area */}
                <div
                  className="w-full aspect-[16/9] bg-secondary/40 flex items-center justify-center overflow-hidden"
                  onClick={() => !isLocked && setViewItem(item)}
                >
                  {item.cover_image_url ? (
                    <img
                      src={item.cover_image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : isSermonLike(item.type) ? (
                    <SermonCoverPlaceholder iconClassName="h-12 w-12" />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-3 sm:p-4 space-y-2 min-w-0" onClick={() => !isLocked && setViewItem(item)}>
                  <p className="font-display text-sm font-bold text-foreground line-clamp-2 leading-snug break-words">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] text-secondary-foreground">
                      {typeLabels[item.type]?.[lang] || item.type}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {excerpt && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 break-words whitespace-normal">{excerpt}</p>
                  )}
                </CardContent>

                {/* Actions row */}
                <div className="flex items-center justify-between px-4 pb-3 pt-0">
                  <div className="flex gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleFavMutation.mutate({ id: item.id, favorite: item.favorite }); }}>
                      <Star className={`h-3.5 w-3.5 ${item.favorite ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(item.content); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSaveToWsItem(item.id); }}>
                      <FolderOpen className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}

          <div ref={sentinelRef} className="col-span-full py-4 flex justify-center">
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
        onReplaceItem={(newItem) => setViewItem(newItem)}
      />

      {saveToWsItem && (
        <SaveToWorkspaceDialog
          open={!!saveToWsItem}
          onOpenChange={(open) => !open && setSaveToWsItem(null)}
          materialId={saveToWsItem}
        />
      )}
    </div>
  );
}
