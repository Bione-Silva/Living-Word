import { Smartphone, Square, RectangleHorizontal } from 'lucide-react';

export type AspectRatio = '9:16' | '4:5' | '1:1';

interface Props {
  value: AspectRatio;
  onChange: (v: AspectRatio) => void;
  lang: 'PT' | 'EN' | 'ES';
}

const options: { ratio: AspectRatio; icon: React.ElementType; label: Record<string, string>; emoji: string }[] = [
  { ratio: '9:16', icon: Smartphone, emoji: '📱', label: { PT: 'Stories / Reels', EN: 'Stories / Reels', ES: 'Stories / Reels' } },
  { ratio: '4:5', icon: RectangleHorizontal, emoji: '🖼️', label: { PT: 'Feed / Carrossel', EN: 'Feed / Carousel', ES: 'Feed / Carrusel' } },
  { ratio: '1:1', icon: Square, emoji: '⏹️', label: { PT: 'Quadrado', EN: 'Square', ES: 'Cuadrado' } },
];

export function AspectRatioSelector({ value, onChange, lang }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.ratio;
        return (
          <button
            key={opt.ratio}
            onClick={() => onChange(opt.ratio)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border-2 ${
              active
                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground hover:border-primary/30'
            }`}
          >
            <span className="text-sm">{opt.emoji}</span>
            <span className="hidden sm:inline">{opt.label[lang]}</span>
            <span className={`text-[10px] font-mono ${active ? 'opacity-80' : 'opacity-50'}`}>({opt.ratio})</span>
          </button>
        );
      })}
    </div>
  );
}
