import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Wand2, Image as ImageIcon, Lock, Crown, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  onPick: (imageUrl: string, label: string) => void;
  lang: L;
  activeId?: string | null;
  searchTerm?: string; // optional search/filter (e.g. verse text or theme)
}

export function BiblicalSceneGallery({ onPick, lang, activeId, searchTerm }: Props) {
  const l = labels[lang];
  const [scenes, setScenes] = useState<SceneRow[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);

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

  const handlePick = (s: SceneRow) => {
    onPick(s.image_url, s.description || s.prompt.slice(0, 40));
    toast.success(l.applied);
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
        body: { mode: 'generate', prompt: customPrompt.trim() },
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
      onPick(url, customPrompt.trim());
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
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-bold text-foreground truncate">{l.title}</h3>
        </div>
        {quota && quota.limit > 0 && (
          <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
            {l.quotaLabel(quota.used, quota.limit)}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground px-1">{l.hint}</p>

      {/* Library grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : scenes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">{l.searchEmpty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {scenes.map((s) => {
            const isActive = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handlePick(s)}
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
