import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Lock, Crown, BookOpen, FileText, Heart, Eye, Trash2, Copy, Star, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';

const typeIcons: Record<string, React.ElementType> = {
  sermon: BookOpen,
  outline: FileText,
  devotional: Heart,
  blog_article: FileText,
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

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(lang === 'PT' ? 'Material excluído' : 'Material deleted');
    },
  });

  const toggleFavMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const { error } = await supabase.from('materials').update({ favorite: !favorite }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });

  const filtered = materials.filter((m: any) => {
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.passage?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    const matchFav = !favFilter || m.favorite;
    return matchSearch && matchType && matchFav;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(lang === 'PT' ? 'Copiado!' : 'Copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t('library.title')}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'PT' ? 'Buscar por título, passagem...' : 'Search by title, passage...'}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'PT' ? 'Todos' : 'All'}</SelectItem>
            <SelectItem value="sermon">{lang === 'PT' ? 'Sermão' : 'Sermon'}</SelectItem>
            <SelectItem value="outline">{lang === 'PT' ? 'Esboço' : 'Outline'}</SelectItem>
            <SelectItem value="devotional">{lang === 'PT' ? 'Devocional' : 'Devotional'}</SelectItem>
            <SelectItem value="blog_article">{lang === 'PT' ? 'Artigo' : 'Article'}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={favFilter ? 'default' : 'outline'}
          size="icon"
          onClick={() => setFavFilter(!favFilter)}
          className="shrink-0"
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{lang === 'PT' ? 'Nenhum material encontrado' : 'No materials found'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item: any, i: number) => {
            const Icon = typeIcons[item.type] || FileText;
            const isLocked = isFree && i >= 10;

            return (
              <Card key={item.id} className={`relative ${isLocked ? 'overflow-hidden' : ''}`}>
                {isLocked && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">{lang === 'PT' ? 'Arquivado — desbloqueie no Pastoral' : 'Archived — unlock on Pastoral'}</p>
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
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.passage && `${item.passage} · `}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{item.type}</Badge>
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
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{viewItem?.title}</DialogTitle>
          </DialogHeader>
          {viewItem?.passage && <p className="text-sm text-muted-foreground">{viewItem.passage}</p>}
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{viewItem?.content || ''}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
