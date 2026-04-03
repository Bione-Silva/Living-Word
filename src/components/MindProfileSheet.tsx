import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Brain, Lock, Crown, BookOpen, MessageSquare } from 'lucide-react';
import type { MindData } from '@/components/MindCard';

type L = 'PT' | 'EN' | 'ES';

interface MindProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mind: MindData;
  lang: L;
  isFree: boolean;
}

const labels = {
  techBadges: { PT: 'Capacidade Tecnológica', EN: 'Technological Capacity', ES: 'Capacidad Tecnológica' },
  skills: { PT: 'Especialidades', EN: 'Specialties', ES: 'Especialidades' },
  theology: { PT: 'Resumo Teológico', EN: 'Theological Summary', ES: 'Resumen Teológico' },
  startChat: { PT: 'Iniciar Conversa Profunda com', EN: 'Start Deep Conversation with', ES: 'Iniciar Conversación Profunda con' },
  unlock: { PT: 'Desbloqueie a Sabedoria Histórica', EN: 'Unlock Historical Wisdom', ES: 'Desbloquea la Sabiduría Histórica' },
  subscribe: { PT: 'Assinar', EN: 'Subscribe', ES: 'Suscribirse' },
};

export function MindProfileSheet({ open, onOpenChange, mind, lang, isFree }: MindProfileSheetProps) {
  const navigate = useNavigate();
  const isLocked = mind.locked && isFree;
  const initials = mind.name.split(' ').map(w => w[0]).join('');

  const handleStartChat = () => {
    if (isLocked) {
      navigate('/upgrade');
    } else {
      navigate(`/mentes/${mind.id}`);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-[hsl(210,40%,6%)] border-[hsl(43,55%,58%)]/20 text-white overflow-y-auto">
        <SheetHeader className="text-center pt-6 pb-4">
          {/* Avatar */}
          <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-[hsl(43,55%,58%)]/30 to-[hsl(43,55%,58%)]/10 border-3 border-[hsl(43,55%,58%)]/50 flex items-center justify-center mb-3 shadow-[0_0_40px_hsl(43,55%,58%,0.15)]">
            <span className="text-3xl font-display font-bold text-[hsl(43,55%,58%)]">
              {initials}
            </span>
          </div>
          <SheetTitle className="font-display text-2xl font-bold text-white">
            {mind.name}
          </SheetTitle>
          <p className="text-sm italic text-[hsl(43,55%,58%)]/80">{mind.subtitle[lang]}</p>

          {/* Online status */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400/90 font-medium">Mentor Online</span>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-1 pb-8">
          {/* Tech Badges */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[hsl(43,55%,58%)]/60 mb-3 flex items-center gap-2">
              <Brain className="h-3.5 w-3.5" />
              {labels.techBadges[lang]}
            </h4>
            <div className="flex flex-wrap gap-2">
              {mind.badges.map((badge, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[11px] border-[hsl(43,55%,58%)]/20 bg-[hsl(43,55%,58%)]/5 text-[hsl(43,55%,58%)]/80 px-3 py-1"
                >
                  {badge[lang]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[hsl(43,55%,58%)]/60 mb-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              {labels.skills[lang]}
            </h4>
            <div className="space-y-2">
              {mind.skills.map((skill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[hsl(210,40%,10%)] border border-[hsl(43,55%,58%)]/10"
                >
                  <Zap className="h-3.5 w-3.5 text-[hsl(43,55%,58%)] shrink-0" />
                  <span className="text-sm text-white/90">{skill[lang]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Theology Summary */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[hsl(43,55%,58%)]/60 mb-3 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              {labels.theology[lang]}
            </h4>
            <p className="text-sm leading-relaxed text-white/70">
              {mind.theology[lang]}
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            {isLocked ? (
              <Button
                onClick={handleStartChat}
                className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] hover:from-[hsl(43,55%,65%)] hover:to-[hsl(35,55%,57%)] text-[hsl(210,40%,6%)] gap-2"
              >
                <Lock className="h-4 w-4" />
                {labels.unlock[lang]} ({labels.subscribe[lang]})
              </Button>
            ) : (
              <Button
                onClick={handleStartChat}
                className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] hover:from-[hsl(43,55%,65%)] hover:to-[hsl(35,55%,57%)] text-[hsl(210,40%,6%)] gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {labels.startChat[lang]} {mind.name}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
