import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
}

export function SaveToWorkspaceDialog({ open, onOpenChange, materialId }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && open,
  });

  const saveMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const { error } = await supabase
        .from('materials')
        .update({ workspace_id: workspaceId })
        .eq('id', materialId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-items'] });
      toast.success(t('workspaces.saved'));
      onOpenChange(false);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{t('workspaces.save_to.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('workspaces.empty')}</p>
            ) : (
              workspaces.map((ws: any) => (
                <button
                  key={ws.id}
                  onClick={() => saveMutation.mutate(ws.id)}
                  disabled={saveMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <span className="text-xl">{ws.emoji || '📂'}</span>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{ws.name}</span>
                </button>
              ))
            )}
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> {t('workspaces.new')}
          </Button>
        </DialogContent>
      </Dialog>
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
