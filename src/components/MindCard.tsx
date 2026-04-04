import { Lock, Zap, Database } from 'lucide-react';
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
      className="group relative text-left rounded-2xl border border-[hsl(30,15%,80%)]/40 bg-card hover:border-[hsl(30,15%,70%)]/60 hover:shadow-lg transition-all duration-500 p-6 sm:p-7 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-[hsl(43,55%,58%)]/[0.04] to-transparent pointer-events-none" />

      {isLocked && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-9 h-9 rounded-full bg-[hsl(210,40%,5%)]/90 backdrop-blur-sm flex items-center justify-center border border-[hsl(43,55%,58%)]/25 shadow-lg">
            <Lock className="h-4 w-4 text-[hsl(43,55%,58%)]" />
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Photo */}
        <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[hsl(43,55%,58%)]/25 group-hover:border-[hsl(43,55%,58%)]/50 transition-all duration-500 overflow-hidden mb-5 shadow-[0_0_40px_hsl(43,55%,58%,0.08)] ring-2 ring-[hsl(43,55%,58%)]/[0.04] ring-offset-2 ring-offset-[hsl(210,40%,9%)]">
          <img
            src={mind.image}
            alt={mind.name}
            className={`w-full h-full object-cover transition-all duration-700 ${isLocked ? 'grayscale brightness-50' : 'grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105'}`}
            loading="lazy"
            width={112}
            height={112}
          />
        </div>

        {/* Name & subtitle */}
        <div className="text-center space-y-2">
          <h3 className="font-display text-xl font-bold text-white tracking-tight">{mind.name}</h3>
          <p className="text-[13px] italic text-[hsl(43,55%,58%)]/70 font-display">{mind.subtitle[lang]}</p>

          {/* Online indicator */}
          {!isLocked && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] text-emerald-400/80 font-semibold">Online</span>
            </div>
          )}

          {/* Role badge */}
          <div className="pt-2">
            <Badge variant="outline" className="text-[11px] border-[hsl(43,55%,58%)]/20 text-[hsl(43,55%,58%)]/60 bg-[hsl(43,55%,58%)]/[0.05] gap-1.5 px-3 py-1">
              <Zap className="h-3 w-3" />
              {mind.role[lang]}
            </Badge>
          </div>

          {/* Data weight mini-badges */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
            {mind.badges.slice(0, 2).map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-white/30 font-medium">
                <Database className="h-2.5 w-2.5" />
                {b[lang]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
