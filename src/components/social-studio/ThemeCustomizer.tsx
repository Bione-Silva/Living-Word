import { useState } from 'react';
import { Paintbrush, Type, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ThemeConfig {
  gradient: string;
  fontFamily: string;
  textColor: string;
  overlayOpacity: number;
}

interface Props {
  value: ThemeConfig;
  onChange: (v: ThemeConfig) => void;
  lang: 'PT' | 'EN' | 'ES';
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
  { id: 'silver', label: 'Prata', color: '#E0E0E0', preview: '#E0E0E0' },
  { id: 'sky', label: 'Céu', color: '#BAE6FD', preview: '#BAE6FD' },
];

const labels = {
  PT: { color: 'Fundo', font: 'Fonte', customize: 'Personalizar', text: 'Texto', custom: 'Hex', overlay: 'Overlay' },
  EN: { color: 'Background', font: 'Font', customize: 'Customize', text: 'Text', custom: 'Hex', overlay: 'Overlay' },
  ES: { color: 'Fondo', font: 'Fuente', customize: 'Personalizar', text: 'Texto', custom: 'Hex', overlay: 'Overlay' },
};

export function ThemeCustomizer({ value, onChange, lang }: Props) {
  const l = labels[lang];
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customHex, setCustomHex] = useState('');

  const applyCustomHex = () => {
    const hex = customHex.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      // Derive a darker shade for gradient
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 40);
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 40);
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 40);
      const darker = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      const darkest = `${Math.max(0, r - 30).toString(16).padStart(2, '0')}${Math.max(0, g - 30).toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`;
      onChange({ ...value, gradient: `from-[#${hex}] via-[#${darker}] to-[#${darkest}]` });
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Paintbrush className="h-3.5 w-3.5" />
        {l.customize}
      </div>

      {/* Background color presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
          <Palette className="h-3 w-3" /> {l.color}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {colorPresets.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ ...value, gradient: c.gradient })}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                value.gradient === c.gradient ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: c.preview }}
              title={c.label}
            />
          ))}
          {/* Custom hex toggle */}
          <button
            onClick={() => setShowCustomColor(!showCustomColor)}
            className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 ${
              showCustomColor ? 'border-primary text-primary' : 'border-border text-muted-foreground'
            }`}
            title={l.custom}
            style={{
              background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
          >
            <span className="bg-card rounded-full w-4 h-4 flex items-center justify-center text-[8px]">+</span>
          </button>
        </div>
        {showCustomColor && (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#3B82F6"
              className="h-7 text-xs w-28 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && applyCustomHex()}
            />
            <button
              onClick={applyCustomHex}
              className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Text color presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
          <Type className="h-3 w-3" /> {l.text}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {textColorPresets.map((tc) => (
            <button
              key={tc.id}
              onClick={() => onChange({ ...value, textColor: tc.color })}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                value.textColor === tc.color ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-muted-foreground/30'
              }`}
              style={{ backgroundColor: tc.preview }}
              title={tc.label}
            />
          ))}
        </div>
      </div>

      {/* Font selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-medium">{l.font}:</span>
        <Select
          value={fontPresets.find((f) => f.family === value.fontFamily)?.id || 'serif'}
          onValueChange={(id) => {
            const preset = fontPresets.find((f) => f.id === id);
            if (preset) onChange({ ...value, fontFamily: preset.family });
          }}
        >
          <SelectTrigger className="h-7 w-[180px] text-xs">
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
