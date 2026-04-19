import { useMemo } from 'react';

export type ImageMode = 'biblica' | 'moderna' | 'simbolica';

type L = 'PT' | 'EN' | 'ES';

interface ModeDef {
  id: ImageMode;
  label: Record<L, string>;
  desc: Record<L, string>;
  gradient: string;
  glyph: string;
  glyphColor: string;
  /** Prompt fragment appended to image generation requests. */
  promptFragment: string;
}

const MODES: ModeDef[] = [
  {
    id: 'biblica',
    label: { PT: 'Época Bíblica', EN: 'Biblical Era', ES: 'Época Bíblica' },
    desc: {
      PT: 'Oriente Médio antigo',
      EN: 'Ancient Middle East',
      ES: 'Oriente Medio antiguo',
    },
    gradient: 'linear-gradient(135deg, #3d2006, #7a4010)',
    glyph: 'B',
    glyphColor: 'rgba(255,220,150,0.9)',
    promptFragment:
      'Ancient Middle East biblical era, cinematic lighting, warm golden tones, photorealistic, stone architecture, olive trees, desert landscape, no faces, no text',
  },
  {
    id: 'moderna',
    label: { PT: 'Moderna', EN: 'Modern', ES: 'Moderna' },
    desc: {
      PT: 'Editorial contemporânea',
      EN: 'Contemporary editorial',
      ES: 'Editorial contemporánea',
    },
    gradient: 'linear-gradient(135deg, #0f1f3d, #1a3a6e)',
    glyph: 'M',
    glyphColor: 'rgba(150,200,255,0.9)',
    promptFragment:
      'Modern Christian lifestyle photography, editorial style, warm natural light, soft bokeh, minimalist composition, hope and peace atmosphere, no text, no faces',
  },
  {
    id: 'simbolica',
    label: { PT: 'Simbólica', EN: 'Symbolic', ES: 'Simbólica' },
    desc: {
      PT: 'Cruz, luz, elementos',
      EN: 'Cross, light, elements',
      ES: 'Cruz, luz, elementos',
    },
    gradient: 'linear-gradient(135deg, #0e2010, #1a3d1e)',
    glyph: 'S',
    glyphColor: 'rgba(150,220,160,0.9)',
    promptFragment:
      'Minimalist Christian symbolism, clean geometric composition, single symbolic element such as cross or wheat field or dove or light rays, professional design, no text, no faces',
  },
];

export function getImageModePromptFragment(mode: ImageMode): string {
  return MODES.find((m) => m.id === mode)?.promptFragment ?? '';
}

export function getImageModeLabel(mode: ImageMode, lang: L): string {
  return MODES.find((m) => m.id === mode)?.label[lang] ?? '';
}

interface Props {
  value: ImageMode;
  onChange: (mode: ImageMode) => void;
  lang: L;
}

const headings: Record<L, { title: string; subtitle: string }> = {
  PT: { title: 'Modo de Imagem', subtitle: 'Escolha o estilo visual das imagens geradas' },
  EN: { title: 'Image Mode', subtitle: 'Choose the visual style of generated images' },
  ES: { title: 'Modo de Imagen', subtitle: 'Elige el estilo visual de las imágenes generadas' },
};

export function ImageModePicker({ value, onChange, lang }: Props) {
  const h = headings[lang];
  const modes = useMemo(() => MODES, []);

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-medium text-foreground">{h.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{h.subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {modes.map((m) => {
          const selected = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`group text-left rounded-xl overflow-hidden bg-background transition-all duration-200 cursor-pointer ${
                selected
                  ? 'border-2 border-primary -translate-y-0.5 shadow-sm'
                  : 'border border-border hover:border-primary/40 hover:-translate-y-0.5'
              }`}
              style={selected ? { background: 'hsl(var(--primary) / 0.04)' } : undefined}
              aria-pressed={selected}
            >
              <div
                className="h-14 flex items-center justify-center"
                style={{ background: m.gradient }}
              >
                <span
                  className="font-display font-bold"
                  style={{ fontSize: 20, color: m.glyphColor }}
                >
                  {m.glyph}
                </span>
              </div>
              <div className="px-1.5 pt-1.5 pb-2">
                <div className="text-[11px] font-medium text-foreground leading-tight">
                  {m.label[lang]}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {m.desc[lang]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
