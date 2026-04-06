import { Smartphone, Square, RectangleHorizontal } from 'lucide-react';

export type AspectRatio = '9:16' | '4:5' | '1:1';

interface Props {
  value: AspectRatio;
  onChange: (v: AspectRatio) => void;
  lang: 'PT' | 'EN' | 'ES';
}

const options: { ratio: AspectRatio; icon: React.ElementType; label: Record<string, string> }[] = [
  { ratio: '9:16', icon: Smartphone, label: { PT: 'Stories / TikTok', EN: 'Stories / TikTok', ES: 'Stories / TikTok' } },
  { ratio: '4:5', icon: RectangleHorizontal, label: { PT: 'Feed / Carrossel', EN: 'Feed / Carousel', ES: 'Feed / Carrusel' } },
  { ratio: '1:1', icon: Square, label: { PT: 'Quadrado', EN: 'Square', ES: 'Cuadrado' } },
];

export function AspectRatioSelector({ value, onChange, lang }: Props) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.ratio;
        return (
          <button
            key={opt.ratio}
            onClick={() => onChange(opt.ratio)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
              active
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{opt.label[lang]}</span>
            <span className="text-[10px] opacity-70">{opt.ratio}</span>
          </button>
        );
      })}
    </div>
  );
}
