import { Lock, Database } from 'lucide-react';
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
      className="group relative text-left rounded-2xl border border-[hsl(30,15%,85%)] bg-white hover:border-[hsl(30,30%,70%)] hover:shadow-xl transition-all duration-400 p-6 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
    >
      {/* Subtle warm hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-[hsl(35,40%,95%)] to-transparent pointer-events-none" />

      {isLocked && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-[hsl(30,10%,93%)] flex items-center justify-center border border-[hsl(30,15%,85%)]">
            <Lock className="h-3.5 w-3.5 text-[hsl(30,10%,55%)]" />
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Photo + Flag */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="w-full h-full rounded-full border-2 border-[hsl(35,30%,85%)] group-hover:border-[hsl(35,50%,65%)] transition-all duration-500 overflow-hidden shadow-sm">
            <img
              src={mind.image}
              alt={mind.name}
              className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'grayscale brightness-75' : 'group-hover:scale-105'}`}
              loading="lazy"
              width={96}
              height={96}
            />
          </div>
          {/* Country flag */}
          <span className="absolute -bottom-1 -right-1 text-lg drop-shadow-sm">{mind.flag}</span>
        </div>

        {/* Name & subtitle */}
        <div className="text-center space-y-1.5">
          <h3 className="font-display text-lg font-bold text-[hsl(220,15%,20%)] tracking-tight">{mind.name}</h3>
          <p className="text-[13px] italic text-[hsl(35,40%,45%)] font-display">{mind.subtitle[lang]}</p>

          {/* Online indicator */}
          {!isLocked && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Online</span>
            </div>
          )}

          {/* Role badge */}
          <div className="pt-2">
            <Badge variant="outline" className="text-[10px] border-[hsl(35,30%,80%)] text-[hsl(35,40%,40%)] bg-[hsl(35,40%,96%)] px-2.5 py-0.5">
              {mind.role[lang]}
            </Badge>
          </div>

          {/* Data weight mini-badges */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
            {mind.badges.slice(0, 2).map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-[hsl(220,10%,55%)] font-medium">
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
