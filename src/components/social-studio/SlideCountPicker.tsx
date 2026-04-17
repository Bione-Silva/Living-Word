import { Layers } from 'lucide-react';

export type SlideCount = 1 | 3 | 5 | 7;

interface Props {
  value: SlideCount;
  onChange: (v: SlideCount) => void;
  lang: 'PT' | 'EN' | 'ES';
  /** Disable when no verse loaded yet */
  disabled?: boolean;
}

const labels = {
  PT: { title: 'Quantidade de Slides', hint: 'Escolha o tamanho do carrossel', single: 'Arte única' },
  EN: { title: 'Number of Slides', hint: 'Pick the carousel length', single: 'Single art' },
  ES: { title: 'Cantidad de Slides', hint: 'Elige el tamaño del carrusel', single: 'Arte única' },
};

const counts: SlideCount[] = [1, 3, 5, 7];

export function SlideCountPicker({ value, onChange, lang, disabled = false }: Props) {
  const l = labels[lang];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{l.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground px-1">{l.hint}</p>
      <div className="grid grid-cols-4 gap-2">
        {counts.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl border-2 transition-all duration-200 ${
                disabled
                  ? 'opacity-40 cursor-not-allowed border-border bg-card'
                  : active
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                    : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-secondary'
              }`}
            >
              <span className="text-lg font-black leading-none">{n}</span>
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${active ? 'opacity-90' : 'opacity-60'}`}>
                {n === 1 ? (lang === 'PT' ? 'arte' : lang === 'EN' ? 'art' : 'arte') : (lang === 'PT' ? 'slides' : 'slides')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
