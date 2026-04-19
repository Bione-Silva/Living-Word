import { useMemo } from 'react';

/**
 * 4 modos visuais REAIS — cada um carrega prompt_prefix + negative_prompt
 * fortes que mudam de verdade a saída do gerador de imagem.
 *
 * Regra: o nome escolhido na UI tem que produzir uma imagem coerente com o
 * nome. "Moderna Natural" NÃO pode entregar pintura bíblica clássica, e
 * "Bíblica Cinematográfica" NÃO pode entregar foto de café da manhã.
 */
export type ImageMode = 'biblica' | 'moderna' | 'editorial' | 'simbolica';

type L = 'PT' | 'EN' | 'ES';

interface ModeDef {
  id: ImageMode;
  label: Record<L, string>;
  desc: Record<L, string>;
  gradient: string;
  glyph: string;
  glyphColor: string;
  /** Direção visual concreta — usada como prefixo do prompt da imagem. */
  promptPrefix: string;
  /** Bloqueios fortes — vão como negative prompt e como instrução textual. */
  negativePrompt: string;
  /** Cenas-base sugeridas quando o usuário não escolhe cena específica. */
  defaultScenes: string[];
}

const MODES: ModeDef[] = [
  {
    id: 'biblica',
    label: { PT: 'Bíblica Cinematográfica', EN: 'Biblical Cinematic', ES: 'Bíblica Cinematográfica' },
    desc: {
      PT: 'Cenas bíblicas, luz dramática',
      EN: 'Biblical scenes, dramatic light',
      ES: 'Escenas bíblicas, luz dramática',
    },
    gradient: 'linear-gradient(135deg, #3d2006, #7a4010)',
    glyph: '✦',
    glyphColor: 'rgba(255,220,150,0.9)',
    promptPrefix:
      'Cinematic biblical scene set in the ancient Middle East, painterly photoreal style with dramatic warm golden lighting, reverent atmosphere, devotional mood, period-accurate stone architecture, tunics, olive trees and desert landscape, depth of field, film grain, museum-quality composition',
    negativePrompt:
      'no modern clothing, no smartphones, no contemporary buildings, no urban setting, no coffee mugs, no laptops, no text, no captions, no watermarks, no faces of God',
    defaultScenes: [
      'shepherd at sunrise on a Judean hillside',
      'ancient scroll on a stone table with oil lamp',
      'Galilean fishing boat at golden hour',
    ],
  },
  {
    id: 'moderna',
    label: { PT: 'Moderna Natural', EN: 'Modern Natural', ES: 'Moderna Natural' },
    desc: {
      PT: 'Fotografia contemporânea real',
      EN: 'Contemporary real photography',
      ES: 'Fotografía contemporánea real',
    },
    gradient: 'linear-gradient(135deg, #4a5b6b, #7a8a99)',
    glyph: '☼',
    glyphColor: 'rgba(255,255,255,0.95)',
    promptPrefix:
      'Contemporary lifestyle photography, photorealistic real-world scene, soft natural daylight from a window, editorial Christian brand campaign aesthetic, clean modern composition with negative space for typography, premium magazine quality, warm and human atmosphere, shallow depth of field, candid moment, muted natural color palette',
    negativePrompt:
      'STRICT: no biblical period costumes, no tunics, no sandals, no ancient architecture, no desert, no painterly sacred art style, no oil painting look, no dramatic golden light rays, no giant cross on mountain, no mystical glow, no fog, no theatrical staging, no excessive gold tones, no Renaissance painting, no medieval art',
    defaultScenes: [
      'open Bible and ceramic coffee mug on a light wooden table near a sunlit window',
      'young person looking out a bright window in the morning, soft daylight',
      'hands holding a Bible in a modern minimalist living room',
      'Bible, leather journal and pen on a clean desk with natural light',
    ],
  },
  {
    id: 'editorial',
    label: { PT: 'Editorial Clean', EN: 'Editorial Clean', ES: 'Editorial Clean' },
    desc: {
      PT: 'Tipográfico, sofisticado',
      EN: 'Typographic, sophisticated',
      ES: 'Tipográfico, sofisticado',
    },
    gradient: 'linear-gradient(135deg, #1a1a1a, #3a3a3a)',
    glyph: 'A',
    glyphColor: 'rgba(255,255,255,0.92)',
    promptPrefix:
      'Editorial design poster, sophisticated minimalist composition, premium magazine layout, single hero element on a flat solid background, abundant negative space designed to receive large typography, refined neutral palette of cream beige off-white and deep charcoal, art-direction quality, calm and elegant',
    negativePrompt:
      'no people, no faces, no biblical costumes, no painterly style, no busy background, no clutter, no decorative ornaments, no rainbow gradients, no neon, no 3D render, no stock photo look',
    defaultScenes: [
      'single olive branch on cream paper background',
      'open book photographed top-down on warm beige surface',
      'a single ray of morning light across an empty linen surface',
    ],
  },
  {
    id: 'simbolica',
    label: { PT: 'Simbólica Minimalista', EN: 'Symbolic Minimalist', ES: 'Simbólica Minimalista' },
    desc: {
      PT: 'Ícones, metáforas visuais',
      EN: 'Icons, visual metaphors',
      ES: 'Iconos, metáforas visuales',
    },
    gradient: 'linear-gradient(135deg, #0e2010, #1a3d1e)',
    glyph: '◯',
    glyphColor: 'rgba(180,230,190,0.95)',
    promptPrefix:
      'Minimalist symbolic illustration, single conceptual element as the only subject (such as a small wooden cross, a single dove silhouette, a wheat stalk, a candle flame, or a single light ray), clean geometric composition, flat or low-texture background, contemporary Christian visual identity, calm muted palette with one subtle accent color',
    negativePrompt:
      'no people, no faces, no realistic biblical scenes, no period costumes, no busy environment, no photographic detail, no dramatic cinematic lighting, no painterly sacred art, no text, no watermark',
    defaultScenes: [
      'small wooden cross casting a soft shadow on a textured cream wall',
      'single white dove silhouette flying against pale sky',
      'a single lit candle on a dark surface, minimal composition',
    ],
  },
];

export function getImageModePromptFragment(mode: ImageMode): string {
  return MODES.find((m) => m.id === mode)?.promptPrefix ?? '';
}

export function getImageModeNegativePrompt(mode: ImageMode): string {
  return MODES.find((m) => m.id === mode)?.negativePrompt ?? '';
}

export function getImageModeDefaultScenes(mode: ImageMode): string[] {
  return MODES.find((m) => m.id === mode)?.defaultScenes ?? [];
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
  PT: { title: 'Estilo visual', subtitle: 'Define a aparência real da imagem gerada' },
  EN: { title: 'Visual style', subtitle: 'Defines the actual look of the generated image' },
  ES: { title: 'Estilo visual', subtitle: 'Define la apariencia real de la imagen generada' },
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

      <div className="grid grid-cols-2 gap-2">
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
                className="h-12 flex items-center justify-center"
                style={{ background: m.gradient }}
              >
                <span
                  className="font-display font-bold"
                  style={{ fontSize: 18, color: m.glyphColor }}
                >
                  {m.glyph}
                </span>
              </div>
              <div className="px-2 pt-1.5 pb-2">
                <div className="text-[11px] font-semibold text-foreground leading-tight">
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
