import { useState } from 'react';
import { Paintbrush, Type, Palette, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  { id: 'midnight', label: 'Midnight Blue', gradient: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]', preview: '#16213e' },
  { id: 'royal', label: 'Royal Purple', gradient: 'from-[#2d1b69] via-[#11001c] to-[#1a0a2e]', preview: '#2d1b69' },
  { id: 'forest', label: 'Forest Green', gradient: 'from-[#1b4332] via-[#081c15] to-[#2d6a4f]', preview: '#1b4332' },
  { id: 'wine', label: 'Wine Red', gradient: 'from-[#3c1518] via-[#1a0000] to-[#69140e]', preview: '#3c1518' },
  { id: 'charcoal', label: 'Charcoal', gradient: 'from-[#1c1c1c] via-[#2d2d2d] to-[#0a0a0a]', preview: '#1c1c1c' },
  { id: 'ocean', label: 'Ocean Teal', gradient: 'from-[#0d3b66] via-[#14283c] to-[#1a535c]', preview: '#0d3b66' },
  { id: 'sunset', label: 'Sunset Gold', gradient: 'from-[#4a3728] via-[#2c1810] to-[#6b4423]', preview: '#4a3728' },
  { id: 'rose', label: 'Rose', gradient: 'from-[#4a1942] via-[#2a0e2e] to-[#6b2d5b]', preview: '#4a1942' },
  { id: 'terracotta', label: 'Terracotta', gradient: 'from-[#B85042] via-[#6b2f26] to-[#3d1a15]', preview: '#B85042' },
  { id: 'sage', label: 'Sage', gradient: 'from-[#3a5a40] via-[#2d4a33] to-[#1a3a20]', preview: '#3a5a40' },
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
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customHex, setCustomHex] = useState('');

  const applyCustomHex = () => {
    const hex = customHex.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 40);
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 40);
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 40);
      const darker = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      const darkest = `${Math.max(0, r - 30).toString(16).padStart(2, '0')}${Math.max(0, g - 30).toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`;
      onChange({ ...value, gradient: `from-[#${hex}] via-[#${darker}] to-[#${darkest}]`, backgroundImageUrl: undefined });
    }
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
          <button
            type="button"
            onClick={() => setShowCustomColor(!showCustomColor)}
            className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-all hover:scale-110 ${
              showCustomColor ? 'border-primary text-primary' : 'border-border text-foreground'
            }`}
            title={l.custom}
            style={{ background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          >
            <span className="bg-card rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">+</span>
          </button>
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
        {showCustomColor && (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#3B82F6"
              className="h-8 text-xs w-28 font-mono bg-background text-foreground"
              onKeyDown={(e) => e.key === 'Enter' && applyCustomHex()}
            />
            <Button type="button" onClick={applyCustomHex} size="sm" className="h-8 px-3 text-xs">
              OK
            </Button>
          </div>
        )}
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
        <span className="text-xs text-foreground font-medium">{l.font}:</span>
        <Select
          value={fontPresets.find((f) => f.family === value.fontFamily)?.id || 'serif'}
          onValueChange={(id) => {
            const preset = fontPresets.find((f) => f.id === id);
            if (preset) onChange({ ...value, fontFamily: preset.family });
          }}
        >
          <SelectTrigger className="h-8 w-[190px] text-xs bg-background text-foreground border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontPresets.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span style={{ fontFamily: f.family }}>{f.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { colorPresets, fontPresets, textColorPresets };
