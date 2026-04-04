import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText, Plus, Search, Globe, Pencil, BookOpen, MoreHorizontal,
  Archive, ArchiveRestore, Save, X, Eye, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';

type TabFilter = 'all' | 'published' | 'draft' | 'archived';

interface ArticleRow {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  queue_status: string;
  published_at: string | null;
  queue_id: string | null;
  language: string | null;
}

export default function Blog() {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFree = profile?.plan === 'free';
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor state
  const [editArticle, setEditArticle] = useState<ArticleRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArticleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['my-blog-articles', user?.id],
    queryFn: async (): Promise<ArticleRow[]> => {
      const { data: materials, error: mErr } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user!.id)
        .eq('type', 'blog_article')
        .order('created_at', { ascending: false });
      if (mErr) throw mErr;

      const { data: queue, error: qErr } = await supabase
        .from('editorial_queue')
        .select('id, material_id, status, published_at')
        .eq('user_id', user!.id);
      if (qErr) throw qErr;

      const statusMap = new Map(queue?.map(q => [q.material_id, { status: q.status, published_at: q.published_at, id: q.id }]));

      return (materials || []).map(m => ({
        id: m.id,
        title: m.title,
        content: m.content,
        cover_image_url: (m as any).cover_image_url || null,
        created_at: m.created_at,
        queue_status: statusMap.get(m.id)?.status || 'draft',
        published_at: statusMap.get(m.id)?.published_at || null,
        queue_id: statusMap.get(m.id)?.id || null,
        language: m.language || 'PT',
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
    const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (!handle) { toast.error('Configure seu blog handle nas Configurações.'); return; }
    navigator.clipboard.writeText(`${window.location.origin}/blog/${handle}/${articleId}`);
    toast.success('Link copiado!');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Open editor
  const openEditor = (article: ArticleRow) => {
    setEditArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setPreviewMode(false);
  };

  // Save edits
  const handleSave = async () => {
    if (!editArticle) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() })
        .eq('id', editArticle.id);
      if (error) throw error;
      toast.success('Artigo salvo com sucesso!');
      setEditArticle(null);
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error('Erro ao salvar artigo.');
    } finally {
      setSaving(false);
    }
  };

  // Archive / Unarchive
  const handleToggleArchive = async (article: ArticleRow) => {
    const newStatus = article.queue_status === 'archived' ? 'published' : 'archived';
    try {
      if (article.queue_id) {
        const { error } = await supabase
          .from('editorial_queue')
          .update({ status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null })
          .eq('id', article.queue_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('editorial_queue').insert({
          user_id: user!.id,
          material_id: article.id,
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }
      toast.success(newStatus === 'archived' ? 'Artigo arquivado.' : 'Artigo restaurado.');
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete from editorial_queue first (if exists)
      if (deleteTarget.queue_id) {
        await supabase.from('editorial_queue').delete().eq('id', deleteTarget.queue_id);
      }
      // Delete the material
      const { error } = await supabase.from('materials').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Artigo excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error('Erro ao excluir artigo.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
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
        <Button className="gap-2" onClick={() => navigate('/estudio')}>
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
                activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por título..." className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length || 0} artigo(s)</p>

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
            const isArchived = article.queue_status === 'archived';
            return (
              <Card key={article.id} className="overflow-hidden bg-card border hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-44 overflow-hidden bg-muted">
                  {article.cover_image_url ? (
                    <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 mb-2">{article.title}</h3>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-medium ${
                        isPublished ? 'bg-green-100 text-green-700 border-green-200' :
                        isArchived ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPublished ? 'Publicado' : isArchived ? 'Arquivado' : 'Rascunho'}
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
                    <Button size="sm" variant={isPublished ? 'outline' : 'default'} className="gap-1.5 text-xs h-8" onClick={() => openEditor(article)}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLink(article.id)}>Copiar link</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.origin + '/blog/' + profile?.blog_handle + '/' + article.id)}`, '_blank');
                        }}>
                          Compartilhar no WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleArchive(article)}>
                          {isArchived ? (
                            <><ArchiveRestore className="w-3.5 h-3.5 mr-2" /> Restaurar</>
                          ) : (
                            <><Archive className="w-3.5 h-3.5 mr-2" /> Arquivar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(article)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
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

      {/* Editor Dialog */}
      <Dialog open={!!editArticle} onOpenChange={(open) => { if (!open) setEditArticle(null); }}>
        <DialogContent className="theme-app max-w-3xl max-h-[90vh] flex flex-col bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Editar Artigo</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Título</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-display text-base bg-background text-foreground border-input" />
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant={previewMode ? 'outline' : 'default'} onClick={() => setPreviewMode(false)} className="gap-1.5 text-xs">
                <Pencil className="w-3 h-3" /> Editar
              </Button>
              <Button size="sm" variant={previewMode ? 'default' : 'outline'} onClick={() => setPreviewMode(true)} className="gap-1.5 text-xs">
                <Eye className="w-3 h-3" /> Pré-visualizar
              </Button>
            </div>

            {previewMode ? (
              <div className="blog-prose prose prose-sm max-w-none border border-border rounded-lg p-4 bg-muted/30 min-h-[300px]">
                <ReactMarkdown>{editContent}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="min-h-[350px] font-mono text-sm leading-relaxed bg-background text-foreground border-input"
                placeholder="Conteúdo em Markdown..."
              />
            )}
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setEditArticle(null)} className="gap-1.5">
              <X className="w-4 h-4" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O artigo "{deleteTarget?.title}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
