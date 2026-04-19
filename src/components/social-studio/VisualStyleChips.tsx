import { Sparkles, Minimize2, Crown, Camera, Circle, Palette as PaletteIcon } from 'lucide-react';

export type VisualStyle = 'moderno' | 'minimalista' | 'elegante' | 'vintage' | 'neutro' | 'colorido';

type L = 'PT' | 'EN' | 'ES';

interface StyleDef {
  id: VisualStyle;
  icon: React.ElementType;
  label: Record<L, string>;
}

const STYLES: StyleDef[] = [
  { id: 'moderno', icon: Sparkles, label: { PT: 'Moderno', EN: 'Modern', ES: 'Moderno' } },
  { id: 'minimalista', icon: Minimize2, label: { PT: 'Minimalista', EN: 'Minimalist', ES: 'Minimalista' } },
  { id: 'elegante', icon: Crown, label: { PT: 'Elegante', EN: 'Elegant', ES: 'Elegante' } },
  { id: 'vintage', icon: Camera, label: { PT: 'Vintage', EN: 'Vintage', ES: 'Vintage' } },
  { id: 'neutro', icon: Circle, label: { PT: 'Neutro', EN: 'Neutral', ES: 'Neutro' } },
  { id: 'colorido', icon: PaletteIcon, label: { PT: 'Colorido', EN: 'Colorful', ES: 'Colorido' } },
];

interface Props {
  value: VisualStyle;
  onChange: (s: VisualStyle) => void;
  lang: L;
}

const headings: Record<L, { title: string; subtitle: string }> = {
  PT: { title: 'Estilo visual', subtitle: 'Escolha o clima da sua arte' },
  EN: { title: 'Visual style', subtitle: 'Pick the mood of your art' },
  ES: { title: 'Estilo visual', subtitle: 'Elige el clima de tu arte' },
};

export function VisualStyleChips({ value, onChange, lang }: Props) {
  const h = headings[lang];

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium text-foreground">{h.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{h.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STYLES.map((s) => {
          const Icon = s.icon;
          const active = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              {s.label[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
