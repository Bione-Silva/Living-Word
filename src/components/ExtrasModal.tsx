import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, MessageSquare, Mail, Megaphone, Newspaper, Gamepad2, Feather, Baby, Globe, Users } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface ExtrasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: L;
  onToolClick: (toolId: string, title: string) => void;
}

const outreachTools = [
  { id: 'reels-script', icon: Video, label: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' } },
  { id: 'cell-group', icon: Users, label: { PT: 'Estudo de Célula', EN: 'Cell Group Study', ES: 'Estudio de Célula' } },
  { id: 'social-caption', icon: Megaphone, label: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' } },
  { id: 'newsletter', icon: Mail, label: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' } },
  { id: 'announcements', icon: Newspaper, label: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' } },
];

const funTools = [
  { id: 'trivia', icon: Gamepad2, label: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' } },
  { id: 'poetry', icon: Feather, label: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' } },
  { id: 'kids-story', icon: Baby, label: { PT: 'Histórias Infantis', EN: 'Kids Stories', ES: 'Historias Infantiles' } },
  { id: 'deep-translation', icon: Globe, label: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' } },
];

export function ExtrasModal({ open, onOpenChange, lang, onToolClick }: ExtrasModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {lang === 'PT' ? '📦 Recursos Extras' : lang === 'EN' ? '📦 Extra Resources' : '📦 Recursos Extra'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'PT' ? 'Ferramentas de alcance, comunidade e conteúdos especiais' : lang === 'EN' ? 'Outreach, community and special content tools' : 'Herramientas de alcance, comunidad y contenidos especiales'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="outreach" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="outreach">
              {lang === 'PT' ? '📢 Alcance' : lang === 'EN' ? '📢 Outreach' : '📢 Alcance'}
            </TabsTrigger>
            <TabsTrigger value="fun">
              {lang === 'PT' ? '🎮 Divertidas' : lang === 'EN' ? '🎮 Fun' : '🎮 Divertidas'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outreach" className="mt-3">
            <div className="grid grid-cols-1 gap-2">
              {outreachTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => { onToolClick(tool.id, tool.label[lang]); onOpenChange(false); }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{tool.label[lang]}</span>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="fun" className="mt-3">
            <div className="grid grid-cols-1 gap-2">
              {funTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => { onToolClick(tool.id, tool.label[lang]); onOpenChange(false); }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{tool.label[lang]}</span>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
