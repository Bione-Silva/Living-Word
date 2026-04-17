import { Smartphone, Square, RectangleHorizontal, Linkedin, Music2 } from 'lucide-react';

export type AspectRatio = '9:16' | '4:5' | '1:1' | '1.91:1' | '9:16-tiktok';

interface Props {
  value: AspectRatio;
  onChange: (v: AspectRatio) => void;
  lang: 'PT' | 'EN' | 'ES';
}

interface Option {
  ratio: AspectRatio;
  icon: React.ElementType;
  emoji: string;
  label: Record<'PT' | 'EN' | 'ES', string>;
  group: 'instagram' | 'linkedin' | 'tiktok';
  hint: Record<'PT' | 'EN' | 'ES', string>;
}

const options: Option[] = [
  { ratio: '9:16', icon: Smartphone, emoji: '📱', group: 'instagram',
    label: { PT: 'Stories / Reels', EN: 'Stories / Reels', ES: 'Stories / Reels' },
    hint: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' } },
  { ratio: '4:5', icon: RectangleHorizontal, emoji: '🖼️', group: 'instagram',
    label: { PT: 'Feed / Carrossel', EN: 'Feed / Carousel', ES: 'Feed / Carrusel' },
    hint: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' } },
  { ratio: '1:1', icon: Square, emoji: '⏹️', group: 'instagram',
    label: { PT: 'Quadrado', EN: 'Square', ES: 'Cuadrado' },
    hint: { PT: 'Instagram / LinkedIn', EN: 'Instagram / LinkedIn', ES: 'Instagram / LinkedIn' } },
  { ratio: '1.91:1', icon: Linkedin, emoji: '💼', group: 'linkedin',
    label: { PT: 'LinkedIn Post', EN: 'LinkedIn Post', ES: 'LinkedIn Post' },
    hint: { PT: 'Horizontal', EN: 'Landscape', ES: 'Horizontal' } },
  { ratio: '9:16-tiktok', icon: Music2, emoji: '🎵', group: 'tiktok',
    label: { PT: 'TikTok / Shorts', EN: 'TikTok / Shorts', ES: 'TikTok / Shorts' },
    hint: { PT: 'Safe-area', EN: 'Safe-area', ES: 'Safe-area' } },
];

const groupLabel = {
  instagram: { PT: 'Instagram', EN: 'Instagram', ES: 'Instagram' },
  linkedin: { PT: 'LinkedIn', EN: 'LinkedIn', ES: 'LinkedIn' },
  tiktok: { PT: 'TikTok', EN: 'TikTok', ES: 'TikTok' },
};

export function AspectRatioSelector({ value, onChange, lang }: Props) {
  const groups: Array<'instagram' | 'linkedin' | 'tiktok'> = ['instagram', 'linkedin', 'tiktok'];

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g} className="space-y-1.5">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/80 px-1">
            {groupLabel[g][lang]}
          </span>
          <div className="flex flex-wrap gap-2">
            {options.filter((o) => o.group === g).map((opt) => {
              const active = value === opt.ratio;
              return (
                <button
                  key={opt.ratio}
                  onClick={() => onChange(opt.ratio)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 border-2 ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]'
                      : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground hover:border-primary/30'
                  }`}
                >
                  <span className="text-sm">{opt.emoji}</span>
                  <span className="hidden sm:inline">{opt.label[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
