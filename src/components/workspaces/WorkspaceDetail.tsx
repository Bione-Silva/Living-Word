import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Trash2, BookOpen, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { ArticleReaderModal } from '@/components/ArticleReaderModal';
import type { Workspace } from '@/pages/Workspaces';

const typeLabels: Record<string, Record<string, string>> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  outline: { PT: 'Esboço', EN: 'Outline', ES: 'Esquema' },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  biblical_study: { PT: 'Estudo Bíblico', EN: 'Biblical Study', ES: 'Estudio Bíblico' },
  blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
};

interface Props {
  workspace: Workspace;
  onBack: () => void;
}

export function WorkspaceDetail({ workspace, onBack }: Props) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [viewItem, setViewItem] = useState<any>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['workspace-items', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('workspaces').delete().eq('id', workspace.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(t('workspaces.deleted'));
      onBack();
    },
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/workspaces/${workspace.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: workspace.name, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('workspaces.share.copied'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> {t('workspaces.back')}
        </Button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{workspace.emoji}</span>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">{workspace.name}</h2>
            {workspace.description && (
              <p className="text-sm text-muted-foreground">{workspace.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" /> {t('workspaces.share')}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted/30" /></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">{t('workspaces.no_items')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.passage && `${item.passage} · `}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {typeLabels[item.type]?.[lang] || item.type}
                </Badge>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewItem(item)}>
                  <Eye className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
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
