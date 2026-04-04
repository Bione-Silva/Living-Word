import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Plus, Search, Globe, Pencil, ExternalLink,
  BookOpen, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TabFilter = 'all' | 'published' | 'draft' | 'archived';

export default function Blog() {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isFree = profile?.plan === 'free';
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all blog articles for this user
  const { data: articles, isLoading } = useQuery({
    queryKey: ['my-blog-articles', user?.id],
    queryFn: async () => {
      // Get all blog_article materials
      const { data: materials, error: mErr } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user!.id)
        .eq('type', 'blog_article')
        .order('created_at', { ascending: false });
      if (mErr) throw mErr;

      // Get editorial queue statuses
      const { data: queue, error: qErr } = await supabase
        .from('editorial_queue')
        .select('material_id, status, published_at')
        .eq('user_id', user!.id);
      if (qErr) throw qErr;

      const statusMap = new Map(queue?.map(q => [q.material_id, { status: q.status, published_at: q.published_at }]));

      return (materials || []).map(m => ({
        ...m,
        queue_status: statusMap.get(m.id)?.status || 'draft',
        published_at: statusMap.get(m.id)?.published_at || null,
      }));
    },
    enabled: !!user?.id,
  });

  const counts = {
    all: articles?.length || 0,
    published: articles?.filter(a => a.queue_status === 'published').length || 0,
    draft: articles?.filter(a => a.queue_status !== 'published' && a.queue_status !== 'archived').length || 0,
    archived: articles?.filter(a => a.queue_status === 'archived').length || 0,
  };

  const filtered = articles?.filter(a => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'published' && a.queue_status === 'published') ||
      (activeTab === 'draft' && a.queue_status !== 'published' && a.queue_status !== 'archived') ||
      (activeTab === 'archived' && a.queue_status === 'archived');
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'published', label: 'Publicados' },
    { key: 'draft', label: 'Rascunhos' },
    { key: 'archived', label: 'Arquivados' },
  ];

  const handleCopyLink = (articleId: string) => {
    const handle = profile?.blog_handle;
    if (!handle) {
      toast.error('Configure seu blog handle nas Configurações.');
      return;
    }
    const url = `${window.location.origin}/blog/${handle}/${articleId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Meus Artigos</h1>
            <p className="text-sm text-muted-foreground">Gerencie todos os seus artigos em um só lugar</p>
          </div>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate('/estudio')}
        >
          <Plus className="w-4 h-4" /> Criar Novo
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered?.length || 0} artigo(s)
      </p>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-display font-semibold text-foreground">
            {searchQuery ? 'Nenhum artigo encontrado' : 'Nenhum artigo ainda'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchQuery ? 'Tente buscar com outros termos.' : 'Crie seu primeiro artigo no Estúdio Pastoral.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/estudio')} className="gap-2">
              <Plus className="w-4 h-4" /> Criar Primeiro Artigo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(article => {
            const isPublished = article.queue_status === 'published';
            const coverUrl = (article as any).cover_image_url;
            return (
              <Card key={article.id} className="overflow-hidden bg-card border hover:shadow-md transition-shadow flex flex-col">
                {/* Cover Image */}
                <div className="relative h-44 overflow-hidden bg-muted">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 mb-2">
                    {article.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant={isPublished ? 'default' : 'secondary'}
                      className={`text-[10px] font-medium ${
                        isPublished
                          ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPublished ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-2">
                    {isPublished && profile?.blog_handle && (
                      <Link to={`/blog/${profile.blog_handle}/${article.id}`} target="_blank">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                          <Globe className="w-3 h-3" /> Abrir
                        </Button>
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant={isPublished ? 'outline' : 'default'}
                      className="gap-1.5 text-xs h-8"
                      onClick={() => toast.info('Editor de artigos em breve!')}
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLink(article.id)}>
                          Copiar link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const url = `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.origin + '/blog/' + profile?.blog_handle + '/' + article.id)}`;
                          window.open(url, '_blank');
                        }}>
                          Compartilhar no WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Free plan notice */}
      {isFree && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-medium">Plano Free: 1 artigo de blog por mês</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Desbloqueie publicação ilimitada com o Pastoral</p>
            <Button size="sm" className="bg-primary text-primary-foreground" asChild>
              <a href="/upgrade">{t('upgrade.cta')}</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
