import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Check, Paintbrush, BookOpen, Clock, Search } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const COLOR_PRESETS = [
  { id: 'amber', label: 'Âmbar', hsl: '45 93% 31%', hex: '#B58B00' },
  { id: 'purple', label: 'Roxo', hsl: '263 70% 58%', hex: '#8B5CF6' },
  { id: 'blue', label: 'Azul', hsl: '221 83% 53%', hex: '#3B82F6' },
  { id: 'green', label: 'Verde', hsl: '142 71% 45%', hex: '#22C55E' },
  { id: 'rose', label: 'Rosa', hsl: '347 77% 50%', hex: '#E11D48' },
  { id: 'teal', label: 'Teal', hsl: '173 80% 32%', hex: '#0D9488' },
  { id: 'indigo', label: 'Índigo', hsl: '239 84% 67%', hex: '#6366F1' },
  { id: 'orange', label: 'Laranja', hsl: '21 90% 48%', hex: '#EA580C' },
  { id: 'black', label: 'Preto', hsl: '0 0% 15%', hex: '#262626' },
];

const FONT_PRESETS = [
  { id: 'cormorant', label: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
  { id: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif" },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif" },
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif" },
  { id: 'merriweather', label: 'Merriweather', family: "'Merriweather', serif" },
  { id: 'dm_sans', label: 'DM Sans', family: "'DM Sans', sans-serif" },
  { id: 'lora', label: 'Lora', family: "'Lora', serif" },
];

const LABELS: Record<string, Record<L, string>> = {
  title: { PT: 'Personalizar Blog', EN: 'Customize Blog', ES: 'Personalizar Blog' },
  colors: { PT: 'Cor Principal', EN: 'Primary Color', ES: 'Color Principal' },
  custom: { PT: 'Cor personalizada', EN: 'Custom color', ES: 'Color personalizado' },
  font: { PT: 'Fonte do Blog', EN: 'Blog Font', ES: 'Fuente del Blog' },
  preview: { PT: 'Pré-visualização', EN: 'Preview', ES: 'Vista previa' },
  save: { PT: 'Salvar tema', EN: 'Save theme', ES: 'Guardar tema' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'Tema salvo com sucesso!', EN: 'Theme saved!', ES: '¡Tema guardado!' },
  error: { PT: 'Erro ao salvar tema.', EN: 'Error saving theme.', ES: 'Error al guardar tema.' },
  blog_title: { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  search_placeholder: { PT: 'Buscar artigos...', EN: 'Search articles...', ES: 'Buscar artículos...' },
  latest: { PT: 'Últimos Artigos', EN: 'Latest Articles', ES: 'Últimos Artículos' },
  read_time: { PT: 'min de leitura', EN: 'min read', ES: 'min de lectura' },
  made_with: { PT: 'Feito com ❤️ por', EN: 'Made with ❤️ by', ES: 'Hecho con ❤️ por' },
};

function hexToHsl(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Mock articles for preview
const MOCK_ARTICLES = [
  { title: 'O Senhor é meu pastor', date: '10 Jul 2025', excerpt: 'Uma reflexão profunda sobre confiança e provisão divina em tempos difíceis...', readTime: 4 },
  { title: 'Tudo posso naquele que me fortalece', date: '8 Jul 2025', excerpt: 'Descobrindo a verdadeira força espiritual através da fé inabalável...', readTime: 3 },
  { title: 'Confia no Senhor de todo coração', date: '5 Jul 2025', excerpt: 'Como entregar nossos planos e caminhos nas mãos do Criador...', readTime: 5 },
];

export function BlogThemeCustomizer() {
  const { profile, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const l = (lang || 'PT') as L;
  const lb = (key: string) => LABELS[key]?.[l] || LABELS[key]?.['PT'] || key;

  const [selectedColor, setSelectedColor] = useState(profile?.theme_color || 'purple');
  const [customHex, setCustomHex] = useState('');
  const [selectedFont, setSelectedFont] = useState(profile?.font_family || 'cormorant');
  const [saving, setSaving] = useState(false);

  // Derive active HSL
  const activePreset = COLOR_PRESETS.find(c => c.id === selectedColor);
  const activeHsl = customHex
    ? hexToHsl(customHex)
    : activePreset?.hsl || COLOR_PRESETS[0].hsl;
  const activeFont = FONT_PRESETS.find(f => f.id === selectedFont)?.family || FONT_PRESETS[0].family;

  useEffect(() => {
    if (profile) {
      setSelectedColor(profile.theme_color || 'purple');
      setSelectedFont(profile.font_family || 'cormorant');
    }
  }, [profile]);

  const handleColorSelect = (id: string) => {
    setSelectedColor(id);
    setCustomHex('');
  };

  const handleCustomColor = (hex: string) => {
    setCustomHex(hex);
    setSelectedColor('');
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        font_family: selectedFont,
        updated_at: new Date().toISOString(),
      };
      if (customHex) {
        updateData.theme_color = customHex;
      } else {
        updateData.theme_color = selectedColor || 'purple';
      }
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(lb('saved'));
    } catch {
      toast.error(lb('error'));
    } finally {
      setSaving(false);
    }
  };

  const blogName = profile?.blog_name || profile?.full_name || 'Meu Blog';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Paintbrush className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">{lb('title')}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL — Controls */}
        <div className="space-y-6">
          {/* Color presets */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{lb('colors')}</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleColorSelect(c.id)}
                  className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedColor === c.id && !customHex
                      ? 'border-foreground ring-2 ring-foreground/20 scale-110'
                      : 'border-border'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {selectedColor === c.id && !customHex && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{lb('custom')}</Label>
            <div className="flex items-center gap-3">
              <label
                className="w-10 h-10 rounded-full border-2 border-dashed border-border cursor-pointer overflow-hidden flex items-center justify-center transition-all hover:scale-110 hover:border-primary"
                style={{
                  background: customHex || 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                }}
              >
                <input
                  type="color"
                  className="absolute opacity-0 w-0 h-0"
                  value={customHex || '#8B5CF6'}
                  onChange={(e) => handleCustomColor(e.target.value)}
                />
                {!customHex && (
                  <span className="bg-card rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold text-foreground">+</span>
                )}
              </label>
              <Input
                value={customHex}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) {
                    const hex = v.startsWith('#') ? v : `#${v}`;
                    if (hex.length === 7) handleCustomColor(hex);
                    else setCustomHex(v);
                  }
                }}
                placeholder="#8B5CF6"
                className="w-32 font-mono text-sm"
              />
            </div>
          </div>

          {/* Font selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{lb('font')}</Label>
            <Select value={selectedFont} onValueChange={setSelectedFont}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_PRESETS.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    <span style={{ fontFamily: f.family }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{lb('saving')}</> : lb('save')}
          </Button>
        </div>

        {/* RIGHT PANEL — Live Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{lb('preview')}</Label>
          <div
            className="rounded-xl border border-border overflow-hidden bg-background shadow-lg"
            style={{ fontFamily: activeFont }}
          >
            {/* Header bar */}
            <div className="border-b border-border/30 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: `hsl(${activeHsl})` }}>
                {blogName}
              </span>
              <span className="text-xs text-muted-foreground">Início</span>
            </div>

            {/* Hero banner */}
            <div
              className="py-8 text-center"
              style={{ background: `linear-gradient(to bottom, hsl(${activeHsl} / 0.15), transparent)` }}
            >
              <h2
                className="text-xl font-bold text-foreground mb-2"
                style={{ fontFamily: activeFont }}
              >
                {lb('blog_title')}
              </h2>
              <div className="max-w-[200px] mx-auto flex items-center gap-1.5">
                <div className="flex-1 h-8 rounded-md border border-border/40 bg-card flex items-center px-2">
                  <span className="text-[10px] text-muted-foreground">{lb('search_placeholder')}</span>
                </div>
                <div
                  className="h-8 w-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${activeHsl})` }}
                >
                  <Search className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            {/* Article cards */}
            <div className="px-4 py-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground text-center mb-2" style={{ fontFamily: activeFont }}>
                {lb('latest')}
              </h3>
              {MOCK_ARTICLES.map((a, i) => (
                <div key={i} className="rounded-lg border border-border/20 bg-card p-3 space-y-1.5">
                  <div className="flex gap-2">
                    <div
                      className="w-14 h-10 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `hsl(${activeHsl} / 0.08)` }}
                    >
                      <BookOpen className="h-4 w-4" style={{ color: `hsl(${activeHsl} / 0.4)` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs font-bold text-foreground truncate leading-tight"
                        style={{ fontFamily: activeFont }}
                      >
                        {a.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">{a.date}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {a.excerpt}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground pt-1 border-t border-border/10">
                    <Clock className="w-2.5 h-2.5" />
                    {a.readTime} {lb('read_time')}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center py-3 border-t border-border/20">
              <p className="text-[9px] text-muted-foreground">
                {lb('made_with')}{' '}
                <span className="font-semibold" style={{ color: `hsl(${activeHsl})` }}>Living Word</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
