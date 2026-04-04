import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Brain, Lock, Crown, BookOpen, MessageSquare, PenTool, Users, GraduationCap } from 'lucide-react';
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
  whatToDo: { PT: 'O que você quer fazer?', EN: 'What do you want to do?', ES: '¿Qué quieres hacer?' },
  unlock: { PT: 'Desbloqueie a Sabedoria Histórica', EN: 'Unlock Historical Wisdom', ES: 'Desbloquea la Sabiduría Histórica' },
  upgradePrice: { PT: 'Faça o upgrade por $100/mês', EN: 'Upgrade for $100/month', ES: 'Mejora por $100/mes' },
};

interface Modality {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  description: Record<L, string>;
}

const modalities: Modality[] = [
  {
    id: 'devocional',
    icon: BookOpen,
    label: { PT: '📖 Devocional Diário', EN: '📖 Daily Devotional', ES: '📖 Devocional Diario' },
    description: { PT: 'Para encorajamento matinal', EN: 'For morning encouragement', ES: 'Para aliento matutino' },
  },
  {
    id: 'sermao',
    icon: PenTool,
    label: { PT: '📝 Preparação de Sermão', EN: '📝 Sermon Preparation', ES: '📝 Preparación de Sermón' },
    description: { PT: 'Ajuda para montar um esboço', EN: 'Help building an outline', ES: 'Ayuda para armar un esquema' },
  },
  {
    id: 'aconselhamento',
    icon: Users,
    label: { PT: '🗣️ Aconselhamento Pastoral', EN: '🗣️ Pastoral Counseling', ES: '🗣️ Consejería Pastoral' },
    description: { PT: 'Buscando sabedoria para uma crise', EN: 'Seeking wisdom for a crisis', ES: 'Buscando sabiduría para una crisis' },
  },
  {
    id: 'estudo',
    icon: GraduationCap,
    label: { PT: '📚 Estudo Teológico', EN: '📚 Theological Study', ES: '📚 Estudio Teológico' },
    description: { PT: 'Discutir conceitos profundos', EN: 'Discuss deep concepts', ES: 'Discutir conceptos profundos' },
  },
];

export function MindProfileSheet({ open, onOpenChange, mind, lang, isFree }: MindProfileSheetProps) {
  const navigate = useNavigate();
  const isLocked = mind.locked && isFree;
  const initials = mind.name.split(' ').map(w => w[0]).join('');

  const handleModality = (modalityId: string) => {
    const menteSlug = mind.id;
    navigate(`/dashboard/mentes/chat?mente=${menteSlug}&modalidade=${modalityId}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-[hsl(210,40%,6%)] border-[hsl(43,55%,58%)]/20 text-white overflow-y-auto">
        <SheetHeader className="text-center pt-6 pb-4">
          {/* Avatar */}
          <div className="mx-auto w-28 h-28 rounded-full border-2 border-[hsl(43,55%,58%)]/50 overflow-hidden mb-3 shadow-[0_0_40px_hsl(43,55%,58%,0.15)]">
            <img src={mind.image} alt={mind.name} className="w-full h-full object-cover" width={112} height={112} />
          </div>
          <SheetTitle className="font-display text-2xl font-bold text-white">
            {mind.name}
          </SheetTitle>
          <p className="text-sm italic text-[hsl(43,55%,58%)]/80">{mind.subtitle[lang]}</p>
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
                <Badge key={i} variant="outline" className="text-[11px] border-[hsl(43,55%,58%)]/20 bg-[hsl(43,55%,58%)]/5 text-[hsl(43,55%,58%)]/80 px-3 py-1">
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
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[hsl(210,40%,10%)] border border-[hsl(43,55%,58%)]/10">
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
            <p className="text-sm leading-relaxed text-white/70">{mind.theology[lang]}</p>
          </div>

          {/* Modality Selection or Paywall */}
          {isLocked ? (
            <div className="rounded-xl border border-[hsl(43,55%,58%)]/20 bg-[hsl(43,55%,58%)]/5 p-5 text-center space-y-3">
              <Lock className="h-8 w-8 mx-auto text-[hsl(43,55%,58%)]/60" />
              <p className="font-display text-lg font-bold text-[hsl(43,55%,58%)]">
                {labels.unlock[lang]}
              </p>
              <p className="text-sm text-white/50">{labels.upgradePrice[lang]}</p>
              <Button
                onClick={() => { navigate('/upgrade'); onOpenChange(false); }}
                className="w-full py-5 text-base font-semibold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] hover:from-[hsl(43,55%,65%)] hover:to-[hsl(35,55%,57%)] text-[hsl(210,40%,6%)] gap-2"
              >
                <Crown className="h-4 w-4" />
                {labels.upgradePrice[lang]}
              </Button>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-[hsl(43,55%,58%)]/60 mb-3 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                {labels.whatToDo[lang]}
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {modalities.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => handleModality(mod.id)}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-[hsl(43,55%,58%)]/15 bg-[hsl(210,40%,9%)] hover:bg-[hsl(210,40%,12%)] hover:border-[hsl(43,55%,58%)]/30 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center shrink-0 group-hover:bg-[hsl(43,55%,58%)]/20 transition-colors">
                      <mod.icon className="h-5 w-5 text-[hsl(43,55%,58%)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{mod.label[lang]}</p>
                      <p className="text-xs text-white/50 mt-0.5">{mod.description[lang]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
