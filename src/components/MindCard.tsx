import { Lock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type L = 'PT' | 'EN' | 'ES';

export interface MindData {
  id: string;
  name: string;
  image: string;
  subtitle: Record<L, string>;
  role: Record<L, string>;
  locked: boolean;
  badges: Record<L, string>[];
  skills: Record<L, string>[];
  theology: Record<L, string>;
}

interface MindCardProps {
  mind: MindData;
  lang: L;
  isFree: boolean;
  onClick: (mind: MindData) => void;
  index: number;
}

export function MindCard({ mind, lang, isFree, onClick, index }: MindCardProps) {
  const isLocked = mind.locked && isFree;
  const initials = mind.name.split(' ').map(w => w[0]).join('');

  return (
    <button
      onClick={() => onClick(mind)}
      className="group relative text-left rounded-xl border border-[hsl(43,55%,58%)]/15 bg-[hsl(210,40%,9%)] hover:bg-[hsl(210,40%,12%)] hover:border-[hsl(43,55%,58%)]/30 transition-all duration-300 p-5 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'backwards' }}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-[hsl(210,40%,6%)]/80 backdrop-blur flex items-center justify-center border border-[hsl(43,55%,58%)]/30">
            <Lock className="h-3.5 w-3.5 text-[hsl(43,55%,58%)]" />
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="relative mx-auto w-20 h-20 rounded-full border-2 border-[hsl(43,55%,58%)]/30 group-hover:border-[hsl(43,55%,58%)]/50 transition-colors overflow-hidden mb-4">
        <img src={mind.image} alt={mind.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" width={80} height={80} />
        <div className="absolute inset-0 rounded-full bg-[hsl(43,55%,58%)]/0 group-hover:bg-[hsl(43,55%,58%)]/10 transition-colors" />
      </div>

      {/* Info */}
      <div className="text-center space-y-1.5">
        <h3 className="font-display text-lg font-bold text-white">{mind.name}</h3>
        <p className="text-[13px] italic text-[hsl(43,55%,58%)]/80">{mind.subtitle[lang]}</p>

        {/* Status */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400/90 font-medium">Mentor Online</span>
        </div>

        {/* Role badge */}
        <div className="pt-2">
          <Badge variant="outline" className="text-[11px] border-[hsl(43,55%,58%)]/25 text-[hsl(43,55%,58%)]/70 bg-[hsl(43,55%,58%)]/5">
            <Zap className="h-3 w-3 mr-1" />
            {mind.role[lang]}
          </Badge>
        </div>
      </div>
    </button>
  );
}
