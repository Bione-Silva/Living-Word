import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type ToolCardData } from '@/components/ToolCard';
import { ExtraToolsSections } from '@/components/ExtraToolsSections';

type L = 'PT' | 'EN' | 'ES';

interface ExtrasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: L;
  isFree: boolean;
  onToolClick: (toolId: string, title: string) => void;
}

export function ExtrasModal({ open, onOpenChange, lang, isFree, onToolClick }: ExtrasModalProps) {
  const handleCardClick = (tool: ToolCardData) => {
    onToolClick(tool.id, tool.title[lang]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {lang === 'PT' ? '📦 Recursos Extras' : lang === 'EN' ? '📦 Extra Resources' : '📦 Recursos Extra'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'PT' ? 'Ferramentas de alcance, comunidade e conteúdos especiais' : lang === 'EN' ? 'Outreach, community and special content tools' : 'Herramientas de alcance, comunidad y contenidos especiales'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-[70vh] overflow-y-auto pr-1">
          <ExtraToolsSections lang={lang} isFree={isFree} onToolClick={handleCardClick} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
