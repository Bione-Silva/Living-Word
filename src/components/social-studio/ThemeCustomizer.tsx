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

const colorPresets = [
  { id: 'midnight', label: 'Midnight Blue', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 52%, #0f3460 100%)', preview: '#16213e' },
  { id: 'royal', label: 'Royal Purple', gradient: 'linear-gradient(135deg, #2d1b69 0%, #11001c 52%, #1a0a2e 100%)', preview: '#2d1b69' },
  { id: 'forest', label: 'Forest Green', gradient: 'linear-gradient(135deg, #1b4332 0%, #081c15 52%, #2d6a4f 100%)', preview: '#1b4332' },
  { id: 'wine', label: 'Wine Red', gradient: 'linear-gradient(135deg, #3c1518 0%, #1a0000 52%, #69140e 100%)', preview: '#3c1518' },
  { id: 'charcoal', label: 'Charcoal', gradient: 'linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 52%, #0a0a0a 100%)', preview: '#1c1c1c' },
  { id: 'ocean', label: 'Ocean Teal', gradient: 'linear-gradient(135deg, #0d3b66 0%, #14283c 52%, #1a535c 100%)', preview: '#0d3b66' },
  { id: 'sunset', label: 'Sunset Gold', gradient: 'linear-gradient(135deg, #4a3728 0%, #2c1810 52%, #6b4423 100%)', preview: '#4a3728' },
  { id: 'rose', label: 'Rose', gradient: 'linear-gradient(135deg, #4a1942 0%, #2a0e2e 52%, #6b2d5b 100%)', preview: '#4a1942' },
  { id: 'terracotta', label: 'Terracotta', gradient: 'linear-gradient(135deg, #B85042 0%, #6b2f26 52%, #3d1a15 100%)', preview: '#B85042' },
  { id: 'sage', label: 'Sage', gradient: 'linear-gradient(135deg, #3a5a40 0%, #2d4a33 52%, #1a3a20 100%)', preview: '#3a5a40' },
];

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
  { id: 'espresso', label: 'Espresso', color: '#3D2B1F', preview: '#3D2B1F' },
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
