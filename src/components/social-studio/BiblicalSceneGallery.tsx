import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Wand2, Lock, Crown, Database, Check, Images, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { CarouselDistributionMode, SceneAsset, SceneSourceType, VariationMode } from './scene-distribution';

type L = 'PT' | 'EN' | 'ES';

interface SceneRow {
  id: string;
  prompt: string;
  description: string;
  keywords: string[];
  image_url: string;
  is_curated: boolean;
  use_count: number;
}

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}

const labels = {
  PT: {
    title: 'Cenas Bíblicas',
    hint: 'Imagens compartilhadas pela comunidade — escolha uma ou crie a sua',
    customTitle: 'Criar nova cena com IA',
    customPlaceholder: 'Ex: Davi e Golias, Jesus caminhando sobre as águas...',
    generate: 'Criar com IA',
    quotaLabel: (u: number, l: number) => `${u}/${l} novas este mês`,
    noQuota: 'Cota mensal esgotada — apenas Pro/Igreja podem criar novas',
    starterQuota: 'Plano Starter usa apenas o banco compartilhado',
    generated: 'Cena criada e salva no banco!',
    applied: 'Cena aplicada!',
    error: 'Erro ao criar cena',
    quotaError: 'Você atingiu o limite mensal de criações',
    emptyPrompt: 'Descreva a cena bíblica',
    searchEmpty: 'Nenhuma cena no banco ainda. Crie a primeira!',
    upgradeStarter: 'Upgrade para Pro',
    poweredBy: 'Banco compartilhado da comunidade',
  },
  EN: {
    title: 'Biblical Scenes',
    hint: 'Community-shared images — pick one or create your own',
    customTitle: 'Create new scene with AI',
    customPlaceholder: 'E.g. David and Goliath, Jesus walking on water...',
    generate: 'Create with AI',
    quotaLabel: (u: number, l: number) => `${u}/${l} new this month`,
    noQuota: 'Monthly quota reached — only Pro/Church can create new',
    starterQuota: 'Starter plan uses the shared library only',
    generated: 'Scene created and added to library!',
    applied: 'Scene applied!',
    error: 'Error creating scene',
    quotaError: 'You reached the monthly creation limit',
    emptyPrompt: 'Describe the biblical scene',
    searchEmpty: 'No scenes in library yet. Be the first to create!',
    upgradeStarter: 'Upgrade to Pro',
    poweredBy: 'Shared community library',
  },
  ES: {
    title: 'Escenas Bíblicas',
    hint: 'Imágenes compartidas por la comunidad — elige una o crea la tuya',
    customTitle: 'Crear nueva escena con IA',
    customPlaceholder: 'Ej: David y Goliat, Jesús caminando sobre las aguas...',
    generate: 'Crear con IA',
    quotaLabel: (u: number, l: number) => `${u}/${l} nuevas este mes`,
    noQuota: 'Cuota mensual alcanzada — solo Pro/Iglesia pueden crear nuevas',
    starterQuota: 'Plan Starter usa solo la biblioteca compartida',
    generated: '¡Escena creada y agregada a la biblioteca!',
    applied: '¡Escena aplicada!',
    error: 'Error al crear escena',
    quotaError: 'Alcanzaste el límite mensual de creaciones',
    emptyPrompt: 'Describe la escena bíblica',
    searchEmpty: 'Aún no hay escenas. ¡Sé el primero en crear!',
    upgradeStarter: 'Mejorar a Pro',
    poweredBy: 'Biblioteca compartida de la comunidad',
  },
};

interface Props {
  onChangeScenePool: (payload: {
    assets: SceneAsset[];
    sourceType: SceneSourceType;
    variationMode: VariationMode;
    distributionMode: CarouselDistributionMode;
  }) => void;
  lang: L;
  activeIds?: string[];
  searchTerm?: string; // optional search/filter (e.g. verse text or theme)
  /**
   * Visual mode chosen in the Style step. Sent to the edge function so the
   * generated image actually matches what the user picked (Moderna Natural
   * must NOT come back as a biblical painting).
   */
  visualMode?: 'biblica' | 'moderna' | 'editorial' | 'simbolica';
  slideCount?: number;
}

export function BiblicalSceneGallery({ onChangeScenePool, lang, activeIds = [], searchTerm, visualMode = 'biblica', slideCount = 1 }: Props) {
  const l = labels[lang];
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState<SceneRow[]>([]);
  const [variationBusy, setVariationBusy] = useState(false);

  // Detecta se o usuário é admin (para mostrar botão de popular banco)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(data === true);
    })();
  }, []);

  const handleSeed = async () => {
    if (!confirm('Gerar 10 cenas curadas no banco compartilhado? (~30s, custo ~$0.39)')) return;
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-biblical-scenes', { body: {} });
      if (error) throw error;
      const ok = (data?.results || []).filter((r: { status: string }) => r.status === 'created').length;
      toast.success(`${ok} cenas criadas no banco!`);
      await loadScenes(searchTerm);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao popular banco');
    } finally {
      setSeeding(false);
    }
  };

  const loadScenes = useCallback(async (term?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-scene', {
        body: { mode: 'search', prompt: term || 'biblical scene' },
      });
      if (error) throw error;
      setScenes(data?.scenes || []);
      setQuota(data?.quota || null);
    } catch (e) {
      console.error('Load scenes error:', e);
      setScenes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScenes(searchTerm);
  }, [loadScenes, searchTerm]);

  const toAsset = (scene: SceneRow, origin: SceneAsset['origin'] = 'library'): SceneAsset => ({
    id: scene.id,
    imageUrl: scene.image_url,
    label: scene.description || scene.prompt.slice(0, 40),
    prompt: scene.prompt,
    origin,
  });

  const handleToggleScene = (scene: SceneRow) => {
    setSelectedScenes((prev) => {
      const exists = prev.some((item) => item.id === scene.id);
      return exists ? prev.filter((item) => item.id !== scene.id) : [...prev, scene];
    });
  };

  const handleUseSingle = (scene: SceneRow) => {
    setSelectedScenes([scene]);
    onChangeScenePool({
      assets: [toAsset(scene)],
      sourceType: 'library_single',
      variationMode: 'none',
      distributionMode: 'auto_balance',
    });
    toast.success(l.applied);
  };

  const handleUseMulti = () => {
    if (selectedScenes.length === 0) return;
    onChangeScenePool({
      assets: selectedScenes.map((scene) => toAsset(scene)),
      sourceType: selectedScenes.length > 1 ? 'library_multi' : 'library_single',
      variationMode: 'none',
      distributionMode: selectedScenes.length > 1 ? 'alternate_image_text' : 'auto_balance',
    });
    toast.success(lang === 'PT' ? 'Pool de cenas aplicado!' : lang === 'EN' ? 'Scene pool applied!' : '¡Pool de escenas aplicado!');
  };

  const handleGenerateVariations = async () => {
    const baseScene = selectedScenes[0];
    if (!baseScene) {
      toast.error(lang === 'PT' ? 'Selecione uma cena base primeiro' : lang === 'EN' ? 'Select a base scene first' : 'Selecciona una escena base primero');
      return;
    }

    if (quota && quota.remaining <= 0) {
      toast.error(l.quotaError);
      return;
    }

    setVariationBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-scene', {
        body: {
          mode: 'generate',
          prompt: baseScene.prompt,
          visualMode,
          baseImageUrl: baseScene.image_url,
          variationMode: 'visual_variation',
          variationCount: Math.min(Math.max(slideCount, 3), 5),
        },
      });
      if (error) throw error;

      const variations = Array.isArray(data?.variations) ? data.variations : [];
      const assets = variations
        .filter((item: { imageUrl?: string }) => Boolean(item?.imageUrl))
        .map((item: { sceneId?: string; imageUrl: string; label?: string; prompt?: string }, index: number) => ({
          id: item.sceneId || `${baseScene.id}-variation-${index}`,
          imageUrl: item.imageUrl,
          label: item.label || `${baseScene.description || baseScene.prompt} ${index + 1}`,
          prompt: item.prompt || baseScene.prompt,
          origin: 'variation' as const,
        }));

      if (assets.length === 0) throw new Error('No variations returned');

      onChangeScenePool({
        assets,
        sourceType: 'ai_variations_from_library',
        variationMode: 'visual_variation',
        distributionMode: 'image_every_slide',
      });

      if (data?.quota) setQuota(data.quota);
      toast.success(lang === 'PT' ? 'Variações reais aplicadas!' : lang === 'EN' ? 'Real variations applied!' : '¡Variaciones reales aplicadas!');
    } catch (e) {
      console.error(e);
      toast.error(l.error);
    } finally {
      setVariationBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (!customPrompt.trim()) {
      toast.error(l.emptyPrompt);
      return;
    }
    if (quota && quota.remaining <= 0) {
      toast.error(l.quotaError);
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-scene', {
        body: { mode: 'generate', prompt: customPrompt.trim(), visualMode },
      });
      if (error) throw error;
      if (data?.error === 'quota_exceeded') {
        toast.error(data.message || l.quotaError);
        if (data.quota) setQuota(data.quota);
        return;
      }
      const url: string | undefined = data?.imageUrl;
      if (!url) throw new Error('No image returned');
      toast.success(l.generated);
      onChangeScenePool({
        assets: [{ id: data?.sceneId || crypto.randomUUID(), imageUrl: url, label: customPrompt.trim(), prompt: customPrompt.trim(), origin: 'generated' }],
        sourceType: 'ai_generated',
        variationMode: 'none',
        distributionMode: 'auto_balance',
      });
      setCustomPrompt('');
      // Recarrega banco para incluir a nova cena
      await loadScenes(searchTerm);
    } catch (e) {
      console.error(e);
      toast.error(l.error);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = quota && quota.limit > 0 && quota.remaining > 0;
  const isStarter = quota?.plan === 'starter';

  return (
    <div className="space-y-3">
      {quota && quota.limit > 0 && (
        <div className="flex justify-end px-1">
          <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
            {l.quotaLabel(quota.used, quota.limit)}
          </Badge>
        </div>
      )}

      {/* Library grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : scenes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">{l.searchEmpty}</p>
          {isAdmin && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSeed}
              disabled={seeding}
              className="gap-1.5 mx-auto"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              {seeding ? 'Gerando 10 cenas...' : 'Popular banco (admin)'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {scenes.map((s) => {
            const isActive = activeIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleToggleScene(s)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 group aspect-[4/3] ${
                  isActive
                    ? 'border-primary ring-2 ring-primary/30 shadow-md'
                    : 'border-border hover:border-primary/40'
                }`}
                title={s.description || s.prompt}
              >
                <img
                  src={s.image_url}
                  alt={s.description || 'Biblical scene'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {s.is_curated && (
                  <div className="absolute top-1.5 left-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground drop-shadow" />
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <p className="text-[10px] font-medium text-white drop-shadow line-clamp-1">
                    {s.description || s.prompt.slice(0, 30)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Caption */}
      <p className="text-[10px] text-muted-foreground/70 text-center italic px-1">
        ✨ {l.poweredBy}
      </p>

      {selectedScenes.length > 0 && (
        <Card className="border-border bg-secondary/30">
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">
                {lang === 'PT' ? 'Como deseja usar esta cena?' : lang === 'EN' ? 'How do you want to use this scene?' : '¿Cómo deseas usar esta escena?'}
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {selectedScenes.length > 1
                  ? (lang === 'PT' ? 'Você montou um pool visual para distribuir no carrossel.' : lang === 'EN' ? 'You created a visual pool to distribute across the carousel.' : 'Creaste un pool visual para distribuir en el carrusel.')
                  : (lang === 'PT' ? 'Escolha entre usar a cena original, adicionar mais cenas ou gerar variações reais com IA.' : lang === 'EN' ? 'Choose between using the original scene, adding more scenes, or generating real AI variations.' : 'Elige entre usar la escena original, añadir más escenas o generar variaciones reales con IA.')}
              </div>
            </div>

            <div className="grid gap-2">
              <Button type="button" size="sm" className="justify-start gap-2" onClick={() => handleUseSingle(selectedScenes[0])}>
                <Check className="h-3.5 w-3.5" />
                {lang === 'PT' ? 'Usar esta imagem' : lang === 'EN' ? 'Use this image' : 'Usar esta imagen'}
              </Button>
              <Button type="button" size="sm" variant="outline" className="justify-start gap-2" onClick={handleUseMulti}>
                <Images className="h-3.5 w-3.5" />
                {lang === 'PT' ? `Escolher mais imagens (${selectedScenes.length})` : lang === 'EN' ? `Choose more images (${selectedScenes.length})` : `Elegir más imágenes (${selectedScenes.length})`}
              </Button>
              <Button type="button" size="sm" variant="outline" className="justify-start gap-2" onClick={handleGenerateVariations} disabled={variationBusy || selectedScenes.length !== 1 || !canGenerate}>
                {variationBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                {lang === 'PT' ? 'Criar variações com IA' : lang === 'EN' ? 'Create AI variations' : 'Crear variaciones con IA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom AI prompt — only for plans with quota */}
      <div className="pt-2 border-t border-border space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{l.customTitle}</span>
        </div>

        {isStarter ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2.5">
            <Crown className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-foreground leading-relaxed">{l.starterQuota}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px] shrink-0"
              onClick={() => window.location.assign('/upgrade')}
            >
              {l.upgradeStarter}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={l.customPlaceholder}
              className="flex-1 h-9 text-xs bg-background"
              disabled={!canGenerate || generating}
              onKeyDown={(e) => e.key === 'Enter' && canGenerate && !generating && handleGenerate()}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={!canGenerate || generating || !customPrompt.trim()}
              className="gap-1.5 shrink-0"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {l.generate}
            </Button>
          </div>
        )}

        {quota && quota.limit > 0 && quota.remaining === 0 && !isStarter && (
          <div className="flex items-center gap-2 text-[11px] text-destructive px-1">
            <Lock className="h-3 w-3" />
            <span>{l.noQuota}</span>
          </div>
        )}
      </div>
    </div>
  );
}
