// @ts-nocheck
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkspaceList } from '@/components/workspaces/WorkspaceList';
import { WorkspaceDetail } from '@/components/workspaces/WorkspaceDetail';
import { CreateWorkspaceDialog } from '@/components/workspaces/CreateWorkspaceDialog';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emoji: string;
  created_at: string;
  item_count?: number;
}

export default function Workspaces() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Count materials per workspace
      const ids = (data || []).map((w: any) => w.id);
      if (ids.length === 0) return (data || []).map((w: any) => ({ ...w, item_count: 0 }));

      const { data: counts } = await supabase
        .from('materials')
        .select('workspace_id')
        .in('workspace_id', ids);

      const countMap: Record<string, number> = {};
      (counts || []).forEach((m: any) => {
        countMap[m.workspace_id] = (countMap[m.workspace_id] || 0) + 1;
      });

      return (data || []).map((w: any) => ({ ...w, item_count: countMap[w.id] || 0 }));
    },
    enabled: !!user,
  });

  const selected = workspaces.find((w) => w.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">{t('workspaces.title')}</h1>
      </div>

      {selectedId && selected ? (
        <WorkspaceDetail workspace={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <WorkspaceList
          workspaces={workspaces}
          isLoading={isLoading}
          onSelect={(id) => setSelectedId(id)}
          onCreateNew={() => setCreateOpen(true)}
        />
      )}

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
