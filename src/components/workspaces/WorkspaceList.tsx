import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';
import type { Workspace } from '@/pages/Workspaces';

interface Props {
  workspaces: Workspace[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

export function WorkspaceList({ workspaces, isLoading, onSelect, onCreateNew }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Button onClick={onCreateNew} className="gap-2" size="lg">
        <Plus className="h-4 w-4" />
        {t('workspaces.new')}
      </Button>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6 h-32 animate-pulse bg-muted/30" /></Card>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-foreground font-medium">{t('workspaces.empty')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('workspaces.empty.sub')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => onSelect(ws.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{ws.emoji || '📂'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {ws.name}
                    </p>
                    {ws.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ws.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-medium mt-2">
                      {ws.item_count || 0} {t('workspaces.items')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
