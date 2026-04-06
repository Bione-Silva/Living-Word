import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const emojis = ['📂', '📖', '✝️', '🕊️', '🔥', '💡', '🎯', '⛪', '🌿', '💎'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📂');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('workspaces').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        emoji,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(t('workspaces.created'));
      setName('');
      setDescription('');
      setEmoji('📂');
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('workspaces.new')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-2xl p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-secondary'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{t('workspaces.name')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workspaces.name.placeholder')}
              className="mt-1 border-border bg-secondary/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{t('workspaces.description')}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 border-border bg-secondary/50"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? '...' : t('workspaces.new')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
