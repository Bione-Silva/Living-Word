import { Paintbrush, Type, Palette, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ThemeConfig {
  gradient: string;
  fontFamily: string;
  textColor: string;
  overlayOpacity: number;
  backgroundImageUrl?: string;
}

interface Props {
  value: ThemeConfig;
  onChange: (v: ThemeConfig) => void;
  lang: 'PT' | 'EN' | 'ES';
  onUploadBackground?: (file: File) => void;
}

/**
 * Cada tema agora carrega uma PALETA de 3 gradientes harmônicos.
 * O carrossel rotaciona pelo índice do slide (`palette[i % palette.length]`)
 * para criar ritmo visual em vez de fundo chapado.
 *
 * `gradient` (singular) = primeiro item da paleta — mantido para
 * retrocompat com swatches, picker custom e dados salvos antigos.
 */
const colorPresets = [
  {
    id: 'midnight', label: 'Midnight Blue', preview: '#16213e',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 52%, #0f3460 100%)',
    palette: [
      'linear-gradient(135deg, #1a1a2e 0%, #16213e 52%, #0f3460 100%)',
      'linear-gradient(135deg, #0f1c3d 0%, #1b2a4e 52%, #233a6b 100%)',
      'linear-gradient(135deg, #0a1128 0%, #11244d 52%, #1a3a8c 100%)',
    ],
  },
  {
    id: 'royal', label: 'Royal Purple', preview: '#2d1b69',
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #11001c 52%, #1a0a2e 100%)',
    palette: [
      'linear-gradient(135deg, #2d1b69 0%, #11001c 52%, #1a0a2e 100%)',
      'linear-gradient(135deg, #3c1e7a 0%, #1a0a2e 52%, #25104a 100%)',
      'linear-gradient(135deg, #1f0f4a 0%, #0a0014 52%, #2a1659 100%)',
    ],
  },
  {
    id: 'forest', label: 'Forest Green', preview: '#1b4332',
    gradient: 'linear-gradient(135deg, #1b4332 0%, #081c15 52%, #2d6a4f 100%)',
    palette: [
      'linear-gradient(135deg, #1b4332 0%, #081c15 52%, #2d6a4f 100%)',
      'linear-gradient(135deg, #14342a 0%, #061612 52%, #245a44 100%)',
      'linear-gradient(135deg, #25553f 0%, #0c2520 52%, #38805f 100%)',
    ],
  },
  {
    id: 'wine', label: 'Wine Red', preview: '#3c1518',
    gradient: 'linear-gradient(135deg, #3c1518 0%, #1a0000 52%, #69140e 100%)',
    palette: [
      'linear-gradient(135deg, #3c1518 0%, #1a0000 52%, #69140e 100%)',
      'linear-gradient(135deg, #4d1a1f 0%, #220404 52%, #7a1a14 100%)',
      'linear-gradient(135deg, #2d1014 0%, #100000 52%, #500e0a 100%)',
    ],
  },
  {
    id: 'charcoal', label: 'Charcoal', preview: '#1c1c1c',
    gradient: 'linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 52%, #0a0a0a 100%)',
    palette: [
      'linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 52%, #0a0a0a 100%)',
      'linear-gradient(135deg, #232323 0%, #363636 52%, #111111 100%)',
      'linear-gradient(135deg, #141414 0%, #242424 52%, #050505 100%)',
    ],
  },
  {
    id: 'ocean', label: 'Ocean Teal', preview: '#0d3b66',
    gradient: 'linear-gradient(135deg, #0d3b66 0%, #14283c 52%, #1a535c 100%)',
    palette: [
      'linear-gradient(135deg, #0d3b66 0%, #14283c 52%, #1a535c 100%)',
      'linear-gradient(135deg, #114a7a 0%, #18324a 52%, #1f6770 100%)',
      'linear-gradient(135deg, #082f54 0%, #0e2034 52%, #134048 100%)',
    ],
  },
  {
    id: 'sunset', label: 'Sunset Gold', preview: '#4a3728',
    gradient: 'linear-gradient(135deg, #4a3728 0%, #2c1810 52%, #6b4423 100%)',
    palette: [
      'linear-gradient(135deg, #4a3728 0%, #2c1810 52%, #6b4423 100%)',
      'linear-gradient(135deg, #5a4332 0%, #361e14 52%, #82542c 100%)',
      'linear-gradient(135deg, #3a2a1f 0%, #20120a 52%, #54341b 100%)',
    ],
  },
  {
    id: 'rose', label: 'Rose', preview: '#4a1942',
    gradient: 'linear-gradient(135deg, #4a1942 0%, #2a0e2e 52%, #6b2d5b 100%)',
    palette: [
      'linear-gradient(135deg, #4a1942 0%, #2a0e2e 52%, #6b2d5b 100%)',
      'linear-gradient(135deg, #5a1e50 0%, #341238 52%, #80376e 100%)',
      'linear-gradient(135deg, #3a1434 0%, #1f0a23 52%, #542346 100%)',
    ],
  },
  {
    id: 'terracotta', label: 'Terracotta', preview: '#B85042',
    gradient: 'linear-gradient(135deg, #B85042 0%, #6b2f26 52%, #3d1a15 100%)',
    palette: [
      'linear-gradient(135deg, #B85042 0%, #6b2f26 52%, #3d1a15 100%)',
      'linear-gradient(135deg, #cc5e4f 0%, #823a2e 52%, #4f221b 100%)',
      'linear-gradient(135deg, #9d4438 0%, #57271f 52%, #2f140f 100%)',
    ],
  },
  {
    id: 'sage', label: 'Sage', preview: '#3a5a40',
    gradient: 'linear-gradient(135deg, #3a5a40 0%, #2d4a33 52%, #1a3a20 100%)',
    palette: [
      'linear-gradient(135deg, #3a5a40 0%, #2d4a33 52%, #1a3a20 100%)',
      'linear-gradient(135deg, #466b4d 0%, #365840 52%, #21472a 100%)',
      'linear-gradient(135deg, #2e4a34 0%, #243d2a 52%, #133018 100%)',
    ],
  },
  {
    id: 'sunset-pink', label: 'Sunset Rosa', preview: '#e65c00',
    gradient: 'linear-gradient(135deg, #e65c00 0%, #c2185b 52%, #880e4f 100%)',
    palette: [
      'linear-gradient(135deg, #e65c00 0%, #c2185b 52%, #880e4f 100%)',
      'linear-gradient(135deg, #ff7320 0%, #d72370 52%, #a01060 100%)',
      'linear-gradient(135deg, #c44d00 0%, #a01250 52%, #6f0a3f 100%)',
    ],
  },
  {
    id: 'ocean-green', label: 'Ocean Verde', preview: '#0077b6',
    gradient: 'linear-gradient(135deg, #0077b6 0%, #00838f 52%, #2e7d32 100%)',
    palette: [
      'linear-gradient(135deg, #0077b6 0%, #00838f 52%, #2e7d32 100%)',
      'linear-gradient(135deg, #0088cc 0%, #00959f 52%, #388e3c 100%)',
      'linear-gradient(135deg, #006298 0%, #006d77 52%, #256628 100%)',
    ],
  },
  {
    id: 'royal-gold', label: 'Royal Dourado', preview: '#4a148c',
    gradient: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 52%, #c5a028 100%)',
    palette: [
      'linear-gradient(135deg, #4a148c 0%, #6a1b9a 52%, #c5a028 100%)',
      'linear-gradient(135deg, #5b1aa3 0%, #7b22b0 52%, #d4af3a 100%)',
      'linear-gradient(135deg, #3a0f70 0%, #56167d 52%, #a8851a 100%)',
    ],
  },
  {
    id: 'aurora', label: 'Aurora', preview: '#1a237e',
    gradient: 'linear-gradient(135deg, #1a237e 0%, #00695c 52%, #1b5e20 100%)',
    palette: [
      'linear-gradient(135deg, #1a237e 0%, #00695c 52%, #1b5e20 100%)',
      'linear-gradient(135deg, #232b94 0%, #00786b 52%, #226d28 100%)',
      'linear-gradient(135deg, #131b66 0%, #00524a 52%, #144d18 100%)',
    ],
  },
  {
    id: 'ember', label: 'Ember', preview: '#bf360c',
    gradient: 'linear-gradient(135deg, #bf360c 0%, #d84315 52%, #ff8f00 100%)',
    palette: [
      'linear-gradient(135deg, #bf360c 0%, #d84315 52%, #ff8f00 100%)',
      'linear-gradient(135deg, #d6420f 0%, #e85020 52%, #ffa120 100%)',
      'linear-gradient(135deg, #a02c0a 0%, #b8360f 52%, #d97a00 100%)',
    ],
  },
];

/**
 * Retorna a paleta sequencial associada a um gradient.
 * - Se o gradient corresponde a um preset → paleta de 3 variações harmônicas.
 * - Caso contrário (cor custom / upload) → array com o próprio gradient.
 *
 * Use para rotacionar fundo entre slides:
 *   const palette = getThemePalette(theme.gradient);
 *   const bg = palette[index % palette.length];
 */
export function getThemePalette(gradient?: string): string[] {
  if (!gradient) return [];
  const preset = colorPresets.find((p) => p.gradient === gradient);
  return preset?.palette ?? [gradient];
}

const fontPresets = [
  { id: 'serif', label: 'Clássica (Serif)', family: "'Cormorant Garamond', 'Georgia', serif" },
  { id: 'sans', label: 'Moderna (Sans)', family: "'Montserrat', 'Helvetica Neue', sans-serif" },
  { id: 'display', label: 'Display (Bold)', family: "'Playfair Display', 'Georgia', serif" },
  { id: 'mono', label: 'Código (Mono)', family: "'JetBrains Mono', monospace" },
  { id: 'elegant', label: 'Elegante', family: "'DM Serif Display', 'Georgia', serif" },
  { id: 'clean', label: 'Clean (DM Sans)', family: "'DM Sans', 'Helvetica Neue', sans-serif" },
];

const textColorPresets = [
  { id: 'white', label: 'Branco', color: '#FFFFFF', preview: '#FFFFFF' },
  { id: 'gold', label: 'Ouro', color: '#F5D78E', preview: '#F5D78E' },
  { id: 'cream', label: 'Creme', color: '#FFF8E7', preview: '#FFF8E7' },
  { id: 'amber', label: 'Âmbar', color: '#FBBF24', preview: '#FBBF24' },
  { id: 'slate', label: 'Slate', color: '#1F2937', preview: '#1F2937' },
  { id: 'espresso', label: 'Espresso', color: '#0F0A18', preview: '#0F0A18' },
];

const labels = {
  PT: { color: 'Fundo', font: 'Fonte', customize: 'Personalizar', text: 'Texto', custom: 'Hex', upload: 'Upload fundo' },
  EN: { color: 'Background', font: 'Font', customize: 'Customize', text: 'Text', custom: 'Hex', upload: 'Upload background' },
  ES: { color: 'Fondo', font: 'Fuente', customize: 'Personalizar', text: 'Texto', custom: 'Hex', upload: 'Subir fondo' },
};

export function ThemeCustomizer({ value, onChange, lang, onUploadBackground }: Props) {
  const l = labels[lang];

  const applyPickedColor = (hex: string) => {
    const clean = hex.replace('#', '');
    const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - 40);
    const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - 40);
    const darker = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const darkest = `${Math.max(0, r - 30).toString(16).padStart(2, '0')}${Math.max(0, g - 30).toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`;
    onChange({ ...value, gradient: `linear-gradient(135deg, #${clean} 0%, #${darker} 52%, #${darkest} 100%)`, backgroundImageUrl: undefined });
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Paintbrush className="h-4 w-4 text-primary" />
        {l.customize}
      </div>

      <div className="space-y-1.5">
        <span className="text-xs text-foreground font-medium flex items-center gap-1">
          <Palette className="h-3.5 w-3.5 text-primary" /> {l.color}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {colorPresets.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange({ ...value, gradient: c.gradient, backgroundImageUrl: undefined })}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                !value.backgroundImageUrl && value.gradient === c.gradient ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: c.preview }}
              title={c.label}
            />
          ))}
          {/* Native color picker — no hex codes needed */}
          <label
            className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:border-primary overflow-hidden"
            title={l.custom}
            style={{ background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          >
            <input
              type="color"
              className="absolute opacity-0 w-0 h-0"
              onChange={(e) => applyPickedColor(e.target.value)}
            />
            <span className="bg-card rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold text-foreground pointer-events-none">+</span>
          </label>
          {onUploadBackground && (
            <label className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer text-xs font-medium">
              <Upload className="h-3.5 w-3.5" />
              {l.upload}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadBackground(file);
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs text-foreground font-medium flex items-center gap-1">
          <Type className="h-3.5 w-3.5 text-primary" /> {l.text}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {textColorPresets.map((tc) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => onChange({ ...value, textColor: tc.color })}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                value.textColor === tc.color ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: tc.preview }}
              title={tc.label}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground font-semibold">{l.font}:</span>
        <Select
          value={fontPresets.find((f) => f.family === value.fontFamily)?.id || 'serif'}
          onValueChange={(id) => {
            const preset = fontPresets.find((f) => f.id === id);
            if (preset) onChange({ ...value, fontFamily: preset.family });
          }}
        >
          <SelectTrigger className="h-9 w-[200px] text-sm font-medium bg-card text-foreground border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card text-foreground border-border">
            {fontPresets.map((f) => (
              <SelectItem key={f.id} value={f.id} className="text-foreground">
                <span className="text-foreground font-medium" style={{ fontFamily: f.family }}>{f.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { colorPresets, fontPresets, textColorPresets };
