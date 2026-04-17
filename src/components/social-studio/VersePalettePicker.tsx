import { Sparkles } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

export interface VersePalette {
  id: string;
  label: Record<L, string>;
  emoji: string;
  gradient: string;
  textColor: string;
  preview: { from: string; to: string };
}

/**
 * Curated palette gallery for verse-of-the-day art.
 * Each palette pairs a refined gradient with a high-contrast text color
 * so the verse always reads beautifully — no manual tweaking required.
 */
export const VERSE_PALETTES: VersePalette[] = [
  {
    id: 'serene',
    label: { PT: 'Sereno', EN: 'Serene', ES: 'Sereno' },
    emoji: '🕊️',
    gradient: 'linear-gradient(135deg, #F5F0E8 0%, #E8DDC9 52%, #D4C4A8 100%)',
    textColor: '#2D1F14',
    preview: { from: '#F5F0E8', to: '#D4C4A8' },
  },
  {
    id: 'gold',
    label: { PT: 'Dourado', EN: 'Gold', ES: 'Dorado' },
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #2C1810 0%, #4A2F1A 52%, #6B4423 100%)',
    textColor: '#F5D78E',
    preview: { from: '#6B4423', to: '#F5D78E' },
  },
  {
    id: 'night',
    label: { PT: 'Noturno', EN: 'Night', ES: 'Nocturno' },
    emoji: '🌙',
    gradient: 'linear-gradient(135deg, #0A0E27 0%, #1A1A2E 52%, #16213E 100%)',
    textColor: '#FFF8E7',
    preview: { from: '#0A0E27', to: '#16213E' },
  },
  {
    id: 'nature',
    label: { PT: 'Natureza', EN: 'Nature', ES: 'Naturaleza' },
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 52%, #52B788 100%)',
    textColor: '#FFFFFF',
    preview: { from: '#1B4332', to: '#52B788' },
  },
];

const labels: Record<L, { title: string; hint: string }> = {
  PT: {
    title: 'Paleta de Versículo',
    hint: 'Escolha um clima visual — texto centralizado e contraste otimizado',
  },
  EN: {
    title: 'Verse Palette',
    hint: 'Pick a visual mood — centered text and optimized contrast',
  },
  ES: {
    title: 'Paleta de Versículo',
    hint: 'Elige un clima visual — texto centrado y contraste optimizado',
  },
};

interface Props {
  value: string | null;
  onChange: (palette: VersePalette) => void;
  lang: L;
}

export function VersePalettePicker({ value, onChange, lang }: Props) {
  const l = labels[lang];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{l.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground px-1">{l.hint}</p>
      <div className="grid grid-cols-2 gap-2">
        {VERSE_PALETTES.map((p) => {
          const active = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 group ${
                active
                  ? 'border-primary ring-2 ring-primary/30 shadow-md'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div
                className="h-14 w-full flex items-center justify-center relative"
                style={{ background: p.gradient }}
              >
                <span className="text-xl drop-shadow-sm">{p.emoji}</span>
                <span
                  className="absolute bottom-1 right-2 text-[8px] font-semibold uppercase tracking-widest opacity-80"
                  style={{ color: p.textColor }}
                >
                  Aa
                </span>
              </div>
              <div className="px-2 py-1.5 bg-card text-left">
                <span className="text-xs font-semibold text-foreground">
                  {p.label[lang]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
