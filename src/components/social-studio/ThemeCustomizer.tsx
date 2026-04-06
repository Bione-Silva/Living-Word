import { Paintbrush } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ThemeConfig {
  gradient: string;
  fontFamily: string;
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
];

const fontPresets = [
  { id: 'serif', label: 'Clássica (Serif)', family: "'Cormorant Garamond', 'Georgia', serif" },
  { id: 'sans', label: 'Moderna (Sans)', family: "'Montserrat', 'Helvetica Neue', sans-serif" },
  { id: 'display', label: 'Display (Bold)', family: "'Playfair Display', 'Georgia', serif" },
  { id: 'mono', label: 'Código (Mono)', family: "'JetBrains Mono', monospace" },
];

const labels = {
  PT: { color: 'Cor do Fundo', font: 'Tipografia', customize: 'Personalizar' },
  EN: { color: 'Background Color', font: 'Typography', customize: 'Customize' },
  ES: { color: 'Color de Fondo', font: 'Tipografía', customize: 'Personalizar' },
};

export function ThemeCustomizer({ value, onChange, lang }: Props) {
  const l = labels[lang];

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Paintbrush className="h-3.5 w-3.5" />
        {l.customize}
      </div>

      {/* Color presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium mr-1">{l.color}:</span>
        {colorPresets.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange({ ...value, gradient: c.gradient })}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
              value.gradient === c.gradient ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border'
            }`}
            style={{ backgroundColor: c.preview }}
            title={c.label}
          />
        ))}
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
          <SelectTrigger className="h-7 w-[160px] text-xs">
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

export { colorPresets, fontPresets };
