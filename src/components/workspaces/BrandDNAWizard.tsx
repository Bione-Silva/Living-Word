// @ts-nocheck
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Plus, ArrowRight, ArrowLeft, Save, Loader2, Palette, MessageSquareText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { CanvasTemplate } from '@/components/social-studio/TemplatePicker';

type L = 'PT' | 'EN' | 'ES';

const labels: Record<string, Record<L, string>> = {
  step1Title: { PT: 'DNA do Conteúdo', EN: 'Content DNA', ES: 'ADN del Contenido' },
  step1Desc: { PT: 'Defina a voz do seu ministério para a IA criar conteúdo personalizado.', EN: 'Define your ministry voice so AI creates personalized content.', ES: 'Define la voz de tu ministerio para que la IA cree contenido personalizado.' },
  step2Title: { PT: 'Identidade Visual', EN: 'Visual Identity', ES: 'Identidad Visual' },
  step2Desc: { PT: 'Escolha a cor e o template padrão do seu ministério.', EN: 'Choose the default color and template for your ministry.', ES: 'Elige el color y template predeterminado de tu ministerio.' },
  audience: { PT: 'Público-Alvo', EN: 'Target Audience', ES: 'Público Objetivo' },
  audiencePh: { PT: 'Ex: Jovens universitários buscando discipulado', EN: 'E.g. College students seeking discipleship', ES: 'Ej: Jóvenes universitarios buscando discipulado' },
  tone: { PT: 'Tom de Comunicação', EN: 'Communication Tone', ES: 'Tono de Comunicación' },
  tonePh: { PT: 'Ex: Pastoral e curativo, próximo da linguagem jovem', EN: 'E.g. Pastoral and healing, youth-friendly language', ES: 'Ej: Pastoral y sanador, lenguaje juvenil' },
  prefs: { PT: 'O que seu público ama consumir', EN: 'What your audience loves', ES: 'Lo que tu público ama consumir' },
  prefsPh: { PT: 'Ex: Devocionais em lista, Salmos de encorajamento', EN: 'E.g. List devotionals, Psalms of encouragement', ES: 'Ej: Devocionales en lista, Salmos de aliento' },
  color: { PT: 'Cor Principal do Ministério', EN: 'Primary Ministry Color', ES: 'Color Principal del Ministerio' },
  customHex: { PT: 'HEX personalizado', EN: 'Custom HEX', ES: 'HEX personalizado' },
  template: { PT: 'Padrão de Design Favorito', EN: 'Favorite Design Pattern', ES: 'Patrón de Diseño Favorito' },
  next: { PT: 'Próximo', EN: 'Next', ES: 'Siguiente' },
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  save: { PT: 'Salvar DNA da Marca', EN: 'Save Brand DNA', ES: 'Guardar ADN de Marca' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'DNA da Marca salvo com sucesso!', EN: 'Brand DNA saved successfully!', ES: '¡ADN de Marca guardado con éxito!' },
  error: { PT: 'Erro ao salvar.', EN: 'Error saving.', ES: 'Error al guardar.' },
  editorial: { PT: 'Editorial Minimalista', EN: 'Minimalist Editorial', ES: 'Editorial Minimalista' },
  editorialDesc: { PT: 'Tipografia elegante sobre fundo suave.', EN: 'Elegant typography on soft background.', ES: 'Tipografía elegante sobre fondo suave.' },
  swiss: { PT: 'Tipografia Suíça', EN: 'Swiss Typography', ES: 'Tipografía Suiza' },
  swissDesc: { PT: 'Blocos geométricos e alto contraste.', EN: 'Geometric blocks and high contrast.', ES: 'Bloques geométricos y alto contraste.' },
  cinematic: { PT: 'Cinematic Overlay', EN: 'Cinematic Overlay', ES: 'Cinematic Overlay' },
  cinematicDesc: { PT: 'Gradiente cinematográfico dramático.', EN: 'Dramatic cinematic gradient.', ES: 'Gradiente cinematográfico dramático.' },
};

const BRAND_COLORS = [
  { name: 'Marsala', hex: '#955251' },
  { name: 'Navy Blue', hex: '#1B3A5C' },
  { name: 'Forest Green', hex: '#2D6A4F' },
  { name: 'Mustard', hex: '#D4A843' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Ocean Teal', hex: '#0D9488' },
  { name: 'Burnt Orange', hex: '#C2410C' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Plum', hex: '#9333EA' },
  { name: 'Coral', hex: '#F97316' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Crimson', hex: '#BE123C' },
  { name: 'Charcoal', hex: '#1F2937' },
  { name: 'Gold', hex: '#CA8A04' },
];

const TEMPLATES: { id: CanvasTemplate; emoji: string }[] = [
  { id: 'editorial', emoji: '📝' },
  { id: 'swiss', emoji: '🧱' },
  { id: 'cinematic', emoji: '🎬' },
];

interface Props {
  workspaceId: string;
  initialData?: {
    target_audience?: string | null;
    communication_tone?: string | null;
    content_preferences?: string | null;
    brand_color?: string | null;
    default_template?: string | null;
  };
  onSaved?: () => void;
}

export function BrandDNAWizard({ workspaceId, initialData, onSaved }: Props) {
  const { lang } = useLanguage();
  const l = lang as L;
  const lb = (key: string) => labels[key]?.[l] || labels[key]?.['PT'] || key;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [audience, setAudience] = useState(initialData?.target_audience || '');
  const [tone, setTone] = useState(initialData?.communication_tone || '');
  const [prefs, setPrefs] = useState(initialData?.content_preferences || '');

  // Step 2
  const [brandColor, setBrandColor] = useState(initialData?.brand_color || '');
  const [customHex, setCustomHex] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState<CanvasTemplate>(
    (initialData?.default_template as CanvasTemplate) || 'cinematic'
  );

  useEffect(() => {
    if (initialData) {
      setAudience(initialData.target_audience || '');
      setTone(initialData.communication_tone || '');
      setPrefs(initialData.content_preferences || '');
      setBrandColor(initialData.brand_color || '');
      setDefaultTemplate((initialData.default_template as CanvasTemplate) || 'cinematic');
      if (initialData.brand_color && !BRAND_COLORS.find(c => c.hex === initialData.brand_color)) {
        setCustomHex(initialData.brand_color);
        setShowCustom(true);
      }
    }
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          target_audience: audience.trim() || null,
          communication_tone: tone.trim() || null,
          content_preferences: prefs.trim() || null,
          brand_color: brandColor || null,
          default_template: defaultTemplate,
        } as any)
        .eq('id', workspaceId);
      if (error) throw error;
      toast.success(lb('saved'));
      onSaved?.();
    } catch {
      toast.error(lb('error'));
    } finally {
      setSaving(false);
    }
  };

  const selectColor = (hex: string) => {
    setBrandColor(hex);
    setShowCustom(false);
  };

  const applyCustom = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
      setBrandColor(customHex);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          <MessageSquareText className="h-4 w-4" />
          <span>1. {lb('step1Title')}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          <Palette className="h-4 w-4" />
          <span>2. {lb('step2Title')}</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <p className="text-sm text-muted-foreground">{lb('step1Desc')}</p>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">{lb('audience')}</label>
            <Textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder={lb('audiencePh')}
              className="min-h-[80px] border-border bg-secondary/50"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">{lb('tone')}</label>
            <Textarea
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder={lb('tonePh')}
              className="min-h-[80px] border-border bg-secondary/50"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">{lb('prefs')}</label>
            <Textarea
              value={prefs}
              onChange={(e) => setPrefs(e.target.value)}
              placeholder={lb('prefsPh')}
              className="min-h-[80px] border-border bg-secondary/50"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} className="gap-2">
              {lb('next')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <p className="text-sm text-muted-foreground">{lb('step2Desc')}</p>

          {/* Color picker */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">{lb('color')}</label>
            <div className="flex flex-wrap gap-3">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.name}
                  onClick={() => selectColor(c.hex)}
                  className="relative h-10 w-10 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ backgroundColor: c.hex }}
                >
                  {brandColor === c.hex && (
                    <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center transition-transform hover:scale-110 ${showCustom ? 'ring-2 ring-primary' : ''}`}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {showCustom && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#A855F7"
                  maxLength={7}
                  className="w-32 font-mono text-sm border-border bg-secondary/50"
                />
                <Button size="sm" variant="outline" onClick={applyCustom} disabled={!/^#[0-9A-Fa-f]{6}$/.test(customHex)}>
                  {lb('next')}
                </Button>
                {brandColor && !BRAND_COLORS.find(c => c.hex === brandColor) && (
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: brandColor }}>
                    <Check className="h-4 w-4 text-white m-auto mt-2 drop-shadow-md" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template picker */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">{lb('template')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((tmpl) => {
                const isSelected = defaultTemplate === tmpl.id;
                return (
                  <Card
                    key={tmpl.id}
                    onClick={() => setDefaultTemplate(tmpl.id)}
                    className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary shadow-primary/20' : 'hover:ring-1 hover:ring-border'}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Preview swatch */}
                      <div
                        className="h-28 rounded-lg flex items-center justify-center text-4xl relative overflow-hidden"
                        style={{
                          background: tmpl.id === 'editorial'
                            ? '#F8F5F0'
                            : tmpl.id === 'swiss'
                              ? 'linear-gradient(135deg, #1F2937 50%, #F8F5F0 50%)'
                              : `linear-gradient(135deg, ${brandColor || '#1B3A5C'}, ${brandColor ? brandColor + '88' : '#1B3A5C88'})`,
                        }}
                      >
                        <span className="text-3xl">{tmpl.emoji}</span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{lb(tmpl.id)}</p>
                        <p className="text-xs text-muted-foreground">{lb(tmpl.id + 'Desc')}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {lb('back')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {lb('saving')}</>
              ) : (
                <><Save className="h-4 w-4" /> {lb('save')}</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
