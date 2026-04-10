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
  Archive, ArchiveRestore, Save, X, Eye, Trash2, Upload, Loader2, ImagePlus,
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
import { openWhatsAppShare } from '@/lib/whatsapp';

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

  const [editArticle, setEditArticle] = useState<ArticleRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArticleRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishStep, setPublishStep] = useState<'cover' | 'publishing' | null>(null);
  const [generatingCover, setGeneratingCover] = useState<Set<string>>(new Set());

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

  const tabs: { key: TabFilter; labelKey: string }[] = [
    { key: 'all', labelKey: 'blog.tab_all' },
    { key: 'published', labelKey: 'blog.tab_published' },
    { key: 'draft', labelKey: 'blog.tab_draft' },
    { key: 'archived', labelKey: 'blog.tab_archived' },
  ];

  const handleCopyLink = (articleId: string) => {
    const handle = profile?.blog_handle;
    if (!handle) { toast.error(t('blog.handle_missing')); return; }
    navigator.clipboard.writeText(`${window.location.origin}/blog/${handle}/${articleId}`);
    toast.success(t('blog.link_copied'));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openEditor = (article: ArticleRow) => {
    setEditArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!editArticle) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() })
        .eq('id', editArticle.id);
      if (error) throw error;
      toast.success(t('blog.saved_ok'));
      setEditArticle(null);
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error(t('blog.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (article: ArticleRow) => {
    setPublishing(article.id);
    try {
      // Step 1: Generate cover image if none exists
      if (!article.cover_image_url) {
        setPublishStep('cover');
        try {
          const { data: coverData, error: coverError } = await supabase.functions.invoke(
            'generate-article-cover',
            { body: { article_id: article.id, title: article.title, content: article.content } }
          );
          if (coverError) {
            console.warn('[Blog] Cover generation failed:', coverError);
            toast.warning('Artigo será publicado sem imagem de capa.');
          } else if (coverData?.cover_image_url) {
            article.cover_image_url = coverData.cover_image_url;
          }
        } catch (e) {
          console.warn('[Blog] Cover generation error:', e);
          toast.warning('Artigo será publicado sem imagem de capa.');
        }
      }

      // Step 2: Publish
      setPublishStep('publishing');
      if (article.queue_id) {
        const { error } = await supabase
          .from('editorial_queue')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', article.queue_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('editorial_queue').insert({
          user_id: user!.id,
          material_id: article.id,
          status: 'published',
          published_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      toast.success(t('blog.published_ok') || 'Artigo publicado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error(t('blog.status_error'));
    } finally {
      setPublishing(null);
      setPublishStep(null);
    }
  };

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
      toast.success(newStatus === 'archived' ? t('blog.archived_ok') : t('blog.restored_ok'));
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error(t('blog.status_error'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.queue_id) {
        await supabase.from('editorial_queue').delete().eq('id', deleteTarget.queue_id);
      }
      const { error } = await supabase.from('materials').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success(t('blog.deleted_ok'));
      queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
    } catch {
      toast.error(t('blog.delete_error'));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleGenerateCover = async (article: ArticleRow) => {
    setGeneratingCover(prev => new Set(prev).add(article.id));
    try {
      const { data: coverData, error } = await supabase.functions.invoke('generate-article-cover', {
        body: { article_id: article.id, title: article.title, content: article.content },
      });
      if (error) throw error;
      if (coverData?.cover_image_url) {
        toast.success('Capa gerada com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['my-blog-articles'] });
      }
    } catch (e) {
      console.warn('[Blog] Cover generation failed:', e);
      toast.error('Falha ao gerar capa.');
    } finally {
      setGeneratingCover(prev => { const n = new Set(prev); n.delete(article.id); return n; });
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'published') return t('blog.status_published');
    if (status === 'archived') return t('blog.status_archived');
    return t('blog.status_draft');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t('blog.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('blog.subtitle')}</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => navigate('/dashboard?tool=free-article')}>
          <Plus className="w-4 h-4" /> {t('blog.create_new')}
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
              {t(tab.labelKey)}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('blog.search_placeholder')} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length || 0} {t('blog.article_count')}</p>

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
            {searchQuery ? t('blog.no_results') : t('blog.no_articles')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchQuery ? t('blog.no_results_hint') : t('blog.no_articles_hint')}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/dashboard?tool=free-article')} className="gap-2">
              <Plus className="w-4 h-4" /> {t('blog.create_first')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => {
            const isPublished = article.queue_status === 'published';
            const isArchived = article.queue_status === 'archived';
            return (
              <Card key={article.id} className="overflow-hidden bg-card border hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-44 overflow-hidden bg-muted">
                  {(() => {
                    const thumb = article.cover_image_url || article.content?.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)?.[1];
                    return thumb ? (
                      <img src={thumb} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    );
                  })()}
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
                      {statusLabel(article.queue_status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-2">
                    {!isPublished && !isArchived && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        disabled={publishing === article.id}
                        onClick={() => handlePublish(article)}
                      >
                        {publishing === article.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {publishStep === 'cover' ? 'Gerando capa...' : 'Publicando...'}
                          </>
                        ) : (
                          <><Upload className="w-3 h-3" /> {t('blog.publish') || 'Publicar'}</>
                        )}
                      </Button>
                    )}
                    {isPublished && profile?.blog_handle && (
                      <Link to={`/blog/${profile.blog_handle}/${article.id}`} target="_blank">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                          <Globe className="w-3 h-3" /> {t('blog.open')}
                        </Button>
                      </Link>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => openEditor(article)}>
                      <Pencil className="w-3 h-3" /> {t('blog.edit')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyLink(article.id)}>{t('blog.copy_link')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          openWhatsAppShare(`${article.title} ${window.location.origin}/blog/${profile?.blog_handle}/${article.id}`);
                        }}>
                          {t('blog.share_whatsapp')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleArchive(article)}>
                          {isArchived ? (
                            <><ArchiveRestore className="w-3.5 h-3.5 mr-2" /> {t('blog.restore')}</>
                          ) : (
                            <><Archive className="w-3.5 h-3.5 mr-2" /> {t('blog.archive')}</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(article)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('blog.delete')}
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
            <p className="text-sm font-medium">{t('blog.free_notice')}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">{t('blog.free_hint')}</p>
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
            <DialogTitle className="font-display text-xl text-foreground">{t('blog.edit_title')}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">{t('blog.field_title')}</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-display text-base bg-background text-foreground border-input" />
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant={previewMode ? 'outline' : 'default'} onClick={() => setPreviewMode(false)} className="gap-1.5 text-xs">
                <Pencil className="w-3 h-3" /> {t('blog.edit')}
              </Button>
              <Button size="sm" variant={previewMode ? 'default' : 'outline'} onClick={() => setPreviewMode(true)} className="gap-1.5 text-xs">
                <Eye className="w-3 h-3" /> {t('blog.preview')}
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
                placeholder={t('blog.content_placeholder')}
              />
            )}
          </div>

          <DialogFooter className="flex flex-wrap gap-2 pt-4 border-t border-border sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditArticle(null)} className="gap-1.5">
                <X className="w-4 h-4" /> {t('blog.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="w-4 h-4" /> {saving ? t('blog.saving') : t('blog.save')}
              </Button>
            </div>
            <div className="flex gap-2">
              {editArticle && editArticle.queue_status !== 'published' && (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={async () => {
                    await handleSave();
                    if (editArticle) {
                      await handlePublish(editArticle);
                      setEditArticle(null);
                    }
                  }}
                  disabled={saving}
                >
                  <Upload className="w-4 h-4" /> {t('blog.publish') || 'Publicar'}
                </Button>
              )}
              {editArticle && (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={async () => {
                    await handleToggleArchive(editArticle);
                    setEditArticle(null);
                  }}
                >
                  <Archive className="w-4 h-4" /> {editArticle.queue_status === 'archived' ? (t('blog.restore') || 'Desarquivar') : (t('blog.archive') || 'Arquivar')}
                </Button>
              )}
              {editArticle && (
                <Button
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteTarget(editArticle);
                    setEditArticle(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> {t('blog.delete')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('blog.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('blog.delete_confirm_desc')} "{deleteTarget?.title}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('blog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('blog.deleting') : t('blog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
