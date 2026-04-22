export type CanvasTemplate = 'editorial' | 'swiss' | 'cinematic' | 'gradient' | 'lw-amber' | 'split-frame' | 'photo-card' | 'photo-overlay' | 'photo-top';

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
    id: 'photo-card',
    emoji: '📱',
    label: { PT: 'Card Realista', EN: 'Realistic Card', ES: 'Tarjeta Realista' },
    desc: { PT: 'Foto central, título no topo', EN: 'Center photo, title on top', ES: 'Foto central, título arriba' },
  },
  {
    id: 'photo-overlay',
    emoji: '🏙️',
    label: { PT: 'Impacto Visual', EN: 'Visual Impact', ES: 'Impacto Visual' },
    desc: { PT: 'Foto total, texto no rodapé', EN: 'Full photo, bottom text', ES: 'Foto total, texto abajo' },
  },
  {
    id: 'photo-top',
    emoji: '📝',
    label: { PT: 'Foco no Texto', EN: 'Text Focus', ES: 'Foco en el Texto' },
    desc: { PT: 'Texto gigante no topo', EN: 'Giant text on top', ES: 'Texto gigante arriba' },
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
  {
    id: 'lw-amber',
    emoji: '✨',
    label: { PT: 'Living Word', EN: 'Living Word', ES: 'Living Word' },
    desc: { PT: 'Âmbar + ouro pastoral', EN: 'Amber + pastoral gold', ES: 'Ámbar + oro pastoral' },
  },
  {
    id: 'split-frame',
    emoji: '🖼️',
    label: { PT: 'Moldura Clássica', EN: 'Classic Frame', ES: 'Marco Clásico' },
    desc: { PT: 'Texto acima e abaixo, imagem no meio', EN: 'Text above/below, image middle', ES: 'Texto arriba/abajo, imagen en medio' },
  },
];

export function TemplatePicker({ value, onChange, lang }: Props) {
  return (
    <div className="space-y-2 pb-2">
      <span className="text-xs text-foreground font-semibold uppercase tracking-wider pl-1">
        {lang === 'PT' ? 'Estilo do Cartaz' : lang === 'EN' ? 'Poster Style' : 'Estilo del Cartel'}
      </span>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 px-1 pb-1 w-full overflow-hidden">
        {templates.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center justify-center gap-1 p-2 w-full min-w-0 min-h-[95px] overflow-hidden rounded-xl text-center transition-all duration-200 border-2 ${
                active
                  ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <span className="text-xl mb-0.5 flex-shrink-0">{t.emoji}</span>
              <span className="text-[10px] font-bold leading-tight break-words w-full px-1">{t.label[lang]}</span>
              <span className="text-[9px] opacity-70 leading-tight break-words w-full px-1">{t.desc[lang]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
