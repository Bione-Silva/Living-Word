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
  {
    id: 'sunrise',
    label: { PT: 'Amanhecer', EN: 'Sunrise', ES: 'Amanecer' },
    emoji: '🌅',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFA726 50%, #FFD54F 100%)',
    textColor: '#3E1A0E',
    preview: { from: '#FF6B6B', to: '#FFD54F' },
  },
  {
    id: 'ocean',
    label: { PT: 'Oceano', EN: 'Ocean', ES: 'Océano' },
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #001F3F 0%, #003366 50%, #0074D9 100%)',
    textColor: '#E0F4FF',
    preview: { from: '#001F3F', to: '#0074D9' },
  },
  {
    id: 'royal',
    label: { PT: 'Real', EN: 'Royal', ES: 'Real' },
    emoji: '👑',
    gradient: 'linear-gradient(135deg, #1E1240 0%, #4C1D95 50%, #7C3AED 100%)',
    textColor: '#F5E6C8',
    preview: { from: '#1E1240', to: '#7C3AED' },
  },
  {
    id: 'rose',
    label: { PT: 'Rosa', EN: 'Rose', ES: 'Rosa' },
    emoji: '🌸',
    gradient: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 50%, #E91E63 100%)',
    textColor: '#3D0F1F',
    preview: { from: '#FCE4EC', to: '#E91E63' },
  },
  {
    id: 'desert',
    label: { PT: 'Deserto', EN: 'Desert', ES: 'Desierto' },
    emoji: '🏜️',
    gradient: 'linear-gradient(135deg, #C19A6B 0%, #D4A574 50%, #E8C39E 100%)',
    textColor: '#3D2817',
    preview: { from: '#C19A6B', to: '#E8C39E' },
  },
  {
    id: 'glacier',
    label: { PT: 'Glaciar', EN: 'Glacier', ES: 'Glaciar' },
    emoji: '❄️',
    gradient: 'linear-gradient(135deg, #E8F4F8 0%, #B8D8E8 50%, #6BA4C7 100%)',
    textColor: '#0F2436',
    preview: { from: '#E8F4F8', to: '#6BA4C7' },
  },
  {
    id: 'forest',
    label: { PT: 'Floresta', EN: 'Forest', ES: 'Bosque' },
    emoji: '🌲',
    gradient: 'linear-gradient(135deg, #0F2419 0%, #1F3A28 50%, #2D5A3D 100%)',
    textColor: '#E8F5E0',
    preview: { from: '#0F2419', to: '#2D5A3D' },
  },
  {
    id: 'lavender',
    label: { PT: 'Lavanda', EN: 'Lavender', ES: 'Lavanda' },
    emoji: '💜',
    gradient: 'linear-gradient(135deg, #E6E0F8 0%, #B8A4E0 50%, #7C5CC2 100%)',
    textColor: '#2A1B4D',
    preview: { from: '#E6E0F8', to: '#7C5CC2' },
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
  return (
    <div className="space-y-2">
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
