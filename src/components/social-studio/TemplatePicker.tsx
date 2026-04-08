export type CanvasTemplate = 'editorial' | 'swiss' | 'cinematic' | 'gradient' | 'lw-amber';

interface Props {
  value: CanvasTemplate;
  onChange: (v: CanvasTemplate) => void;
  lang: 'PT' | 'EN' | 'ES';
}

const templates: { id: CanvasTemplate; emoji: string; label: Record<string, string>; desc: Record<string, string> }[] = [
  {
    id: 'editorial',
    emoji: '📰',
    label: { PT: 'Editorial Minimalista', EN: 'Minimalist Editorial', ES: 'Editorial Minimalista' },
    desc: { PT: 'Imagem + base sólida', EN: 'Image + solid base', ES: 'Imagen + base sólida' },
  },
  {
    id: 'swiss',
    emoji: '🔲',
    label: { PT: 'Tipografia Suíça', EN: 'Swiss Typography', ES: 'Tipografía Suiza' },
    desc: { PT: 'Texto massivo, puro design', EN: 'Massive text, pure design', ES: 'Texto masivo, diseño puro' },
  },
  {
    id: 'cinematic',
    emoji: '🎬',
    label: { PT: 'Cinematic Overlay', EN: 'Cinematic Overlay', ES: 'Cinematic Overlay' },
    desc: { PT: 'Foto fullscreen + gradiente', EN: 'Fullscreen photo + gradient', ES: 'Foto fullscreen + gradiente' },
  },
  {
    id: 'gradient',
    emoji: '🎨',
    label: { PT: 'Gradient Poster', EN: 'Gradient Poster', ES: 'Gradient Poster' },
    desc: { PT: 'Gradiente vibrante + geometria', EN: 'Vibrant gradient + geometry', ES: 'Gradiente vibrante + geometría' },
  },
];

export function TemplatePicker({ value, onChange, lang }: Props) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-foreground font-semibold uppercase tracking-wider">
        {lang === 'PT' ? 'Estilo do Cartaz' : lang === 'EN' ? 'Poster Style' : 'Estilo del Cartel'}
      </span>
      <div className="grid grid-cols-4 gap-2">
        {templates.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-center transition-all duration-200 border-2 ${
                active
                  ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-[10px] font-bold leading-tight">{t.label[lang]}</span>
              <span className="text-[9px] opacity-60 leading-tight">{t.desc[lang]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
