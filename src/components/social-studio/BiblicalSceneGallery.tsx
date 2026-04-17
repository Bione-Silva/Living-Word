import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Wand2, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

export interface BiblicalScene {
  id: string;
  label: Record<L, string>;
  emoji: string;
  /** Prompt used when user clicks to generate (cached after first gen) */
  prompt: string;
  /** Cached data URL once generated */
  cachedUrl?: string;
}

/** Curated biblical scenes — generated on demand and cached in localStorage. */
const BASE_SCENES: BiblicalScene[] = [
  { id: 'cross', emoji: '✝️', label: { PT: 'Cruz', EN: 'Cross', ES: 'Cruz' },
    prompt: 'A wooden cross silhouetted at golden hour, dramatic warm sunlight piercing through clouds, painterly biblical landscape, cinematic, soft bokeh, no text' },
  { id: 'ark', emoji: '🚢', label: { PT: 'Arca de Noé', EN: "Noah's Ark", ES: 'Arca de Noé' },
    prompt: "Noah's wooden ark on calm waters at dawn, rainbow arching across moody sky, painterly biblical scene, soft warm light, no text" },
  { id: 'lamb', emoji: '🐑', label: { PT: 'Cordeiro', EN: 'Lamb', ES: 'Cordero' },
    prompt: 'A gentle lamb on a misty hillside at sunrise, soft golden backlight, painterly biblical landscape, peaceful, cinematic, no text' },
  { id: 'sea-galilee', emoji: '🌊', label: { PT: 'Mar da Galileia', EN: 'Sea of Galilee', ES: 'Mar de Galilea' },
    prompt: 'The Sea of Galilee at dawn, calm rippling water, distant fishing boat silhouette, warm horizon glow, painterly biblical, no text' },
  { id: 'desert', emoji: '🏜️', label: { PT: 'Deserto', EN: 'Desert', ES: 'Desierto' },
    prompt: 'Vast biblical desert at dusk, rolling sand dunes, lone path winding through, warm amber light, cinematic painterly, no text' },
  { id: 'wheat', emoji: '🌾', label: { PT: 'Searas', EN: 'Wheat fields', ES: 'Trigales' },
    prompt: 'Golden wheat field swaying in soft wind at golden hour, low warm sun, painterly biblical landscape, cinematic, no text' },
  { id: 'light', emoji: '🕯️', label: { PT: 'Luz / Vitral', EN: 'Light / Stained glass', ES: 'Luz / Vitral' },
    prompt: 'Cathedral stained glass window casting warm golden and amber light into a quiet sanctuary, dust particles floating, painterly cinematic, no text' },
  { id: 'jerusalem', emoji: '🏛️', label: { PT: 'Jerusalém', EN: 'Jerusalem', ES: 'Jerusalén' },
    prompt: 'Ancient Jerusalem at dawn, warm stone walls, soft golden mist over the old city, painterly biblical landscape, cinematic, no text' },
  { id: 'manger', emoji: '👶', label: { PT: 'Manjedoura', EN: 'Manger', ES: 'Pesebre' },
    prompt: 'A humble wooden manger filled with hay, soft warm lantern light, peaceful Christmas night atmosphere, painterly biblical, no text' },
  { id: 'path', emoji: '🛤️', label: { PT: 'Caminho', EN: 'The Way', ES: 'Camino' },
    prompt: 'A narrow path through golden grass leading to a glowing horizon at sunrise, painterly biblical landscape, hope and journey, cinematic, no text' },
];

const labels = {
  PT: {
    title: 'Cenas Bíblicas',
    hint: 'Escolha uma cena pronta ou gere uma personalizada com IA',
    generating: 'Gerando cena...',
    customTitle: 'Gerar cena personalizada',
    customPlaceholder: 'Ex: Davi e Golias, Jesus caminhando sobre as águas...',
    generate: 'Gerar com IA',
    generated: 'Cena pronta!',
    error: 'Erro ao gerar cena',
    emptyPrompt: 'Descreva a cena bíblica',
  },
  EN: {
    title: 'Biblical Scenes',
    hint: 'Pick a ready scene or generate a custom one with AI',
    generating: 'Generating scene...',
    customTitle: 'Generate custom scene',
    customPlaceholder: 'E.g. David and Goliath, Jesus walking on water...',
    generate: 'Generate with AI',
    generated: 'Scene ready!',
    error: 'Error generating scene',
    emptyPrompt: 'Describe the biblical scene',
  },
  ES: {
    title: 'Escenas Bíblicas',
    hint: 'Elige una escena lista o genera una personalizada con IA',
    generating: 'Generando escena...',
    customTitle: 'Generar escena personalizada',
    customPlaceholder: 'Ej: David y Goliat, Jesús caminando sobre las aguas...',
    generate: 'Generar con IA',
    generated: '¡Escena lista!',
    error: 'Error al generar escena',
    emptyPrompt: 'Describe la escena bíblica',
  },
};

const CACHE_KEY = 'lw_biblical_scenes_cache_v1';

function loadCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCache(cache: Record<string, string>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

interface Props {
  onPick: (imageUrl: string, label: string) => void;
  lang: L;
  activeId?: string | null;
}

export function BiblicalSceneGallery({ onPick, lang, activeId }: Props) {
  const l = labels[lang];
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [cache, setCache] = useState<Record<string, string>>(() => loadCache());

  const generateScene = async (prompt: string, cacheKey: string, label: string) => {
    // Cache hit: use immediately
    const cached = cache[cacheKey];
    if (cached) {
      onPick(cached, label);
      return;
    }
    setLoadingId(cacheKey);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-scene', {
        body: { prompt },
      });
      if (error) throw error;
      const url: string | undefined = data?.imageUrl;
      if (!url) throw new Error('No image returned');
      const newCache = { ...cache, [cacheKey]: url };
      setCache(newCache);
      saveCache(newCache);
      onPick(url, label);
      toast.success(l.generated);
    } catch (e) {
      console.error(e);
      toast.error(l.error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCustom = async () => {
    if (!customPrompt.trim()) {
      toast.error(l.emptyPrompt);
      return;
    }
    const enriched = `${customPrompt.trim()} — painterly biblical landscape, cinematic, soft warm light, no text, no captions`;
    const key = `custom-${customPrompt.trim().slice(0, 32).toLowerCase().replace(/\s+/g, '-')}`;
    await generateScene(enriched, key, customPrompt.trim());
    setCustomPrompt('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <ImageIcon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{l.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground px-1">{l.hint}</p>

      {/* Scene grid */}
      <div className="grid grid-cols-2 gap-2">
        {BASE_SCENES.map((s) => {
          const isLoading = loadingId === s.id;
          const isActive = activeId === s.id;
          const isCached = !!cache[s.id];
          return (
            <button
              key={s.id}
              type="button"
              disabled={isLoading}
              onClick={() => generateScene(s.prompt, s.id, s.label[lang])}
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 group min-h-[64px] ${
                isActive
                  ? 'border-primary ring-2 ring-primary/30 shadow-md'
                  : 'border-border hover:border-primary/40'
              } ${isLoading ? 'opacity-70' : ''}`}
            >
              {cache[s.id] ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${cache[s.id]})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted/50" />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="relative flex flex-col items-center justify-center gap-1 py-3 px-2 text-center">
                <span className="text-xl drop-shadow">{s.emoji}</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow leading-tight">
                  {s.label[lang]}
                </span>
                {isLoading && (
                  <Loader2 className="h-3 w-3 text-white animate-spin mt-0.5" />
                )}
                {isCached && !isLoading && (
                  <Sparkles className="absolute top-1.5 right-1.5 h-3 w-3 text-primary-foreground/80" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom AI prompt */}
      <div className="pt-2 border-t border-border space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{l.customTitle}</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={l.customPlaceholder}
            className="flex-1 h-9 text-xs bg-background"
            onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustom}
            disabled={!customPrompt.trim() || loadingId === 'custom'}
            className="gap-1.5 shrink-0"
          >
            {loadingId?.startsWith('custom-') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {l.generate}
          </Button>
        </div>
      </div>
    </div>
  );
}
