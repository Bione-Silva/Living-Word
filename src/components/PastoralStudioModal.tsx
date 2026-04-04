import { useMemo, useState } from 'react';
import { BookOpen, Copy, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

type OutputMode = 'sermon' | 'outline' | 'devotional';

interface PastoralStudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolTitle: string;
}

interface PastoralStudioFormData {
  bible_passage: string;
  audience: string;
  pain_point: string;
  language: 'PT' | 'EN' | 'ES';
  bible_version: string;
  output_modes: OutputMode[];
}

const bibleVersions = ['ARA', 'NVI', 'NAA', 'KJV', 'ESV', 'NKJV', 'NIV', 'ARC'];

const audienceOptions = {
  PT: [
    { value: 'general', label: 'Congregação geral' },
    { value: 'youth', label: 'Jovens e adolescentes' },
    { value: 'leaders', label: 'Líderes e obreiros' },
    { value: 'women', label: 'Ministério feminino' },
    { value: 'immigrants', label: 'Imigrantes brasileiros' },
  ],
  EN: [
    { value: 'general', label: 'General congregation' },
    { value: 'youth', label: 'Youth and teens' },
    { value: 'leaders', label: 'Leaders and workers' },
    { value: 'women', label: 'Women ministry' },
    { value: 'immigrants', label: 'Brazilian immigrants' },
  ],
  ES: [
    { value: 'general', label: 'Congregación general' },
    { value: 'youth', label: 'Jóvenes y adolescentes' },
    { value: 'leaders', label: 'Líderes y obreros' },
    { value: 'women', label: 'Ministerio femenino' },
    { value: 'immigrants', label: 'Inmigrantes brasileños' },
  ],
} as const;

const outputLabels = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  outline: { PT: 'Esboço', EN: 'Outline', ES: 'Bosquejo' },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
};

const copy = {
  PT: {
    subtitle: 'Gere sermões, esboços e devocionais sem sair do dashboard.',
    passage: 'Passagem bíblica',
    passagePlaceholder: 'Ex: Romanos 8:1-11',
    audience: 'Público',
    context: 'Contexto pastoral',
    contextPlaceholder: 'Ex: culto de domingo, série sobre esperança, momento de luto...',
    version: 'Versão bíblica',
    language: 'Idioma da geração',
    formats: 'Formatos para gerar',
    generate: 'Gerar material',
    generating: 'Gerando material pastoral...',
    empty: 'Preencha a passagem e gere seu conteúdo pastoral.',
    emptyHint: 'O resultado aparecerá aqui em abas, sem redirecionar você para outra tela.',
    copied: 'Conteúdo copiado!',
    genericError: 'Erro ao gerar material pastoral.',
    limitError: 'Você atingiu o limite do seu plano.',
    results: 'Resultados gerados',
    copyCurrent: 'Copiar aba atual',
    requiredFormat: 'Selecione pelo menos um formato.',
  },
  EN: {
    subtitle: 'Generate sermons, outlines and devotionals without leaving the dashboard.',
    passage: 'Bible passage',
    passagePlaceholder: 'E.g.: Romans 8:1-11',
    audience: 'Audience',
    context: 'Pastoral context',
    contextPlaceholder: 'E.g.: Sunday service, hope series, season of grief...',
    version: 'Bible version',
    language: 'Generation language',
    formats: 'Formats to generate',
    generate: 'Generate material',
    generating: 'Generating pastoral material...',
    empty: 'Fill in the passage and generate your pastoral content.',
    emptyHint: 'The result will appear here in tabs, without sending you to another screen.',
    copied: 'Content copied!',
    genericError: 'Error generating pastoral material.',
    limitError: 'You reached your plan limit.',
    results: 'Generated results',
    copyCurrent: 'Copy current tab',
    requiredFormat: 'Select at least one format.',
  },
  ES: {
    subtitle: 'Genera sermones, bosquejos y devocionales sin salir del dashboard.',
    passage: 'Pasaje bíblico',
    passagePlaceholder: 'Ej: Romanos 8:1-11',
    audience: 'Público',
    context: 'Contexto pastoral',
    contextPlaceholder: 'Ej: culto del domingo, serie sobre esperanza, tiempo de duelo...',
    version: 'Versión bíblica',
    language: 'Idioma de la generación',
    formats: 'Formatos a generar',
    generate: 'Generar material',
    generating: 'Generando material pastoral...',
    empty: 'Completa el pasaje y genera tu contenido pastoral.',
    emptyHint: 'El resultado aparecerá aquí en pestañas, sin enviarte a otra pantalla.',
    copied: '¡Contenido copiado!',
    genericError: 'Error al generar material pastoral.',
    limitError: 'Has alcanzado el límite de tu plan.',
    results: 'Resultados generados',
    copyCurrent: 'Copiar pestaña actual',
    requiredFormat: 'Selecciona al menos un formato.',
  },
} as const;

function createInitialFormData(language: 'PT' | 'EN' | 'ES', bibleVersion?: string | null): PastoralStudioFormData {
  return {
    bible_passage: '',
    audience: 'general',
    pain_point: '',
    language,
    bible_version: bibleVersion || 'ARA',
    output_modes: ['sermon', 'outline', 'devotional'],
  };
}

export function PastoralStudioModal({ open, onOpenChange, toolTitle }: PastoralStudioModalProps) {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const text = copy[lang];

  const [formData, setFormData] = useState<PastoralStudioFormData>(() =>
    createInitialFormData(lang, profile?.bible_version)
  );
  const [outputs, setOutputs] = useState<Partial<Record<OutputMode, string>>>({});
  const [activeTab, setActiveTab] = useState<OutputMode>('sermon');
  const [upgradeHint, setUpgradeHint] = useState<string | null>(null);
  const [blockedFormats, setBlockedFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const availableTabs = useMemo(
    () => (['sermon', 'outline', 'devotional'] as OutputMode[]).filter((mode) => Boolean(outputs[mode])),
    [outputs]
  );

  const resetState = () => {
    setFormData(createInitialFormData(lang, profile?.bible_version));
    setOutputs({});
    setActiveTab('sermon');
    setUpgradeHint(null);
    setBlockedFormats([]);
    setLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const update = (field: keyof PastoralStudioFormData, value: string | OutputMode[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleOutputMode = (mode: OutputMode) => {
    setFormData((prev) => {
      const exists = prev.output_modes.includes(mode);
      return {
        ...prev,
        output_modes: exists ? prev.output_modes.filter((item) => item !== mode) : [...prev.output_modes, mode],
      };
    });
  };

  const handleGenerate = async () => {
    if (!formData.bible_passage.trim()) return;
    if (!formData.output_modes.length) {
      toast.warning(text.requiredFormat);
      return;
    }

    setLoading(true);
    setOutputs({});
    setUpgradeHint(null);
    setBlockedFormats([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pastoral-material', {
        body: formData,
      });

      if (error) {
        if (/limit/i.test(error.message || '')) {
          toast.warning(text.limitError);
        } else {
          toast.error(error.message || text.genericError);
        }
        return;
      }

      const nextOutputs = (data?.outputs || {}) as Partial<Record<OutputMode, string>>;
      const firstTab = (['sermon', 'outline', 'devotional'] as OutputMode[]).find((mode) => nextOutputs[mode]);

      if (!firstTab) {
        toast.error(text.genericError);
        return;
      }

      setOutputs(nextOutputs);
      setActiveTab(firstTab);
      setUpgradeHint(data?.upgrade_hint || null);
      setBlockedFormats(Array.isArray(data?.blocked_formats) ? data.blocked_formats : []);
    } catch {
      toast.error(text.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const currentContent = outputs[activeTab];
    if (!currentContent) return;
    await navigator.clipboard.writeText(currentContent);
    toast.success(text.copied);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="theme-app max-w-6xl w-[96vw] max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{toolTitle}</DialogTitle>
          <DialogDescription>{text.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="border-border/60 bg-card h-fit">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pastoral-bible-passage">{text.passage}</Label>
                <Input
                  id="pastoral-bible-passage"
                  value={formData.bible_passage}
                  onChange={(event) => update('bible_passage', event.target.value)}
                  placeholder={text.passagePlaceholder}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{text.audience}</Label>
                <Select value={formData.audience} onValueChange={(value) => update('audience', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions[lang].map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pastoral-context">{text.context}</Label>
                <Textarea
                  id="pastoral-context"
                  value={formData.pain_point}
                  onChange={(event) => update('pain_point', event.target.value)}
                  placeholder={text.contextPlaceholder}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{text.version}</Label>
                  <Select value={formData.bible_version} onValueChange={(value) => update('bible_version', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleVersions.map((version) => (
                        <SelectItem key={version} value={version}>
                          {version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{text.language}</Label>
                  <Select value={formData.language} onValueChange={(value) => update('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PT">Português</SelectItem>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{text.formats}</Label>
                <div className="flex flex-wrap gap-2">
                  {(['sermon', 'outline', 'devotional'] as OutputMode[]).map((mode) => {
                    const isSelected = formData.output_modes.includes(mode);
                    return (
                      <Button
                        key={mode}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        className="gap-2"
                        onClick={() => toggleOutputMode(mode)}
                      >
                        {outputLabels[mode][lang]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerate}
                className="w-full gap-2"
                disabled={loading || !formData.bible_passage.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? text.generating : text.generate}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4 min-w-0">
            {upgradeHint && (
              <Card className="border-border/60 bg-muted/40">
                <CardContent className="p-3 text-sm text-muted-foreground">{upgradeHint}</CardContent>
              </Card>
            )}

            {!!blockedFormats.length && (
              <Card className="border-border/60 bg-muted/40">
                <CardContent className="p-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{lang === 'PT' ? 'Formatos bloqueados:' : lang === 'EN' ? 'Blocked formats:' : 'Formatos bloqueados:'}</span>
                  {blockedFormats.map((format) => (
                    <Badge key={format} variant="secondary">{format}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {!availableTabs.length ? (
              <Card className="border-border/60 bg-card min-h-[420px]">
                <CardContent className="h-full min-h-[420px] flex flex-col items-center justify-center text-center px-6">
                  <BookOpen className="h-14 w-14 text-muted-foreground/40 mb-4" />
                  <p className="font-medium text-foreground">{text.empty}</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">{text.emptyHint}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground">{text.results}</p>
                      <p className="text-sm text-muted-foreground">{formData.bible_passage}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                      {text.copyCurrent}
                    </Button>
                  </div>

                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OutputMode)}>
                    <TabsList className="flex flex-wrap h-auto gap-1">
                      {availableTabs.map((mode) => (
                        <TabsTrigger key={mode} value={mode}>
                          {outputLabels[mode][lang]}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {availableTabs.map((mode) => (
                      <TabsContent key={mode} value={mode} className="mt-4">
                        <div className="prose prose-sm max-w-none rounded-lg border border-border/60 bg-muted/20 p-4 max-h-[56vh] overflow-y-auto">
                          <ReactMarkdown>{outputs[mode] || ''}</ReactMarkdown>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}