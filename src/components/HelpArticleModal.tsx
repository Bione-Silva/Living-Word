import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getHelpArticle } from '@/data/help-articles';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string;
}

export function HelpArticleModal({ open, onOpenChange, toolId }: HelpArticleModalProps) {
  const { lang } = useLanguage();
  const article = getHelpArticle(toolId);

  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold leading-tight">
            {article.title[lang]}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {lang === 'PT' ? 'Artigo de ajuda' : lang === 'EN' ? 'Help article' : 'Artículo de ayuda'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-100px)]">
          <div className="space-y-5 pr-2">
            {article.sections.map((section, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  {section.icon && <span className="text-base">{section.icon}</span>}
                  {section.heading}
                </h3>

                {section.type === 'tip' ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ) : section.type === 'warning' ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
