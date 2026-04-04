import { Lock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MindFullData } from '@/data/minds';

type L = 'PT' | 'EN' | 'ES';

interface MindCardProps {
  mind: MindFullData;
  lang: L;
  isFree: boolean;
  onClick: (mind: MindFullData) => void;
  index: number;
}

export function MindCard({ mind, lang, isFree, onClick, index }: MindCardProps) {
  const isLocked = mind.locked && isFree;

  return (
    <button
      onClick={() => onClick(mind)}
      className="group relative text-left rounded-xl border border-[hsl(43,55%,58%)]/15 bg-[hsl(210,40%,9%)] hover:bg-[hsl(210,40%,12%)] hover:border-[hsl(43,55%,58%)]/30 transition-all duration-300 p-5 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'backwards' }}
    >
      {isLocked && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-[hsl(210,40%,6%)]/80 backdrop-blur flex items-center justify-center border border-[hsl(43,55%,58%)]/30">
            <Lock className="h-3.5 w-3.5 text-[hsl(43,55%,58%)]" />
          </div>
        </div>
      )}

      <div className="relative mx-auto w-20 h-20 rounded-full border-2 border-[hsl(43,55%,58%)]/30 group-hover:border-[hsl(43,55%,58%)]/50 transition-colors overflow-hidden mb-4">
        <img src={mind.image} alt={mind.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" width={80} height={80} />
      </div>

      <div className="text-center space-y-1.5">
        <h3 className="font-display text-lg font-bold text-white">{mind.name}</h3>
        <p className="text-[13px] italic text-[hsl(43,55%,58%)]/80">{mind.subtitle[lang]}</p>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400/90 font-medium">Mentor Online</span>
        </div>
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
