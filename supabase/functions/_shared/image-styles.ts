// ============================================================================
// ESTILOS VISUAIS GLOBAIS — compartilhados por devocional, blog e estúdio
// 16 estilos: 14 fotográficos realistas + 2 artísticos
// ============================================================================

export const IMAGE_STYLES = [
  { kind: 'wheat-field', desc: 'wide-angle photograph of a vast golden wheat field at sunset, soft warm natural light, shallow depth of field, photojournalistic style, no filters' },
  { kind: 'coastal-city', desc: 'aerial drone photograph of a Mediterranean coastal town with white-washed buildings cascading down a hillside to turquoise water, golden hour, photorealistic' },
  { kind: 'mountain-sunrise', desc: 'landscape photograph of mountain peaks at sunrise, pink and orange sky, mist in valleys, shot on professional DSLR, sharp detail, real-world photography' },
  { kind: 'olive-grove', desc: 'natural photograph of an ancient olive grove in Israel, gnarled trunks, dappled sunlight through silver-green leaves, warm earth tones, documentary style' },
  { kind: 'desert-path', desc: 'landscape photograph of the Negev desert at golden hour, winding footpath through red sand dunes, long shadows, warm amber tones, real photography' },
  { kind: 'calm-lake', desc: 'landscape photograph of a still lake at dawn reflecting pastel sky, reeds in foreground, distant treeline, serene and peaceful, shot on mirrorless camera' },
  { kind: 'vineyard', desc: 'wide photograph of terraced Mediterranean vineyard at sunset, rows of green vines, warm golden light, rural Tuscan feel, natural photography' },
  { kind: 'countryside-road', desc: 'photograph of a long straight country road lined with cypress trees leading toward distant hills, warm afternoon light, Southern France or Tuscany feel' },
  { kind: 'jerusalem-modern', desc: 'street-level photograph of Jerusalem Old City stone alleyways at golden hour, warm stone walls, hanging lanterns, real photography, no tourists' },
  { kind: 'sky-rays', desc: 'dramatic real photograph of crepuscular sun rays breaking through storm clouds over green rolling hills, high contrast, shot on DSLR, nature photography' },
  { kind: 'garden', desc: 'close-up photograph of a peaceful garden with wildflowers, morning dew, soft bokeh background, warm natural light, macro photography feel' },
  { kind: 'fishing-village', desc: 'photograph of a small fishing village harbor at dawn, colorful wooden boats, calm water reflections, Mediterranean coast, documentary photography' },
  { kind: 'forest-path', desc: 'photograph of a sunlit forest path with light filtering through tall trees, green ferns, peaceful morning atmosphere, nature photography' },
  { kind: 'starry-sky', desc: 'real photograph of the Milky Way over a quiet landscape, deep blue night sky, thousands of stars, long exposure, no light pollution, astrophotography' },
  { kind: 'oil-painting', desc: 'museum-quality Renaissance oil painting of a biblical landscape — golden light through stone arches, chiaroscuro, painterly brushstrokes, classical art' },
  { kind: 'watercolor', desc: 'gentle watercolor illustration of a winding path toward distant light, pastel washes, hand-painted texture, contemplative and serene' },
] as const;

export type ImageStyleKind = typeof IMAGE_STYLES[number]['kind'];

/**
 * Enforcamento de realismo — adicionado ao prompt de estilos fotográficos.
 * Impede que o modelo gere imagens com estilo medieval, dourado ou ilustração.
 */
export const REALISTIC_ENFORCEMENT =
  ' CRITICAL: This must look like a REAL PHOTOGRAPH taken with a professional camera. Do NOT render it as a painting, illustration, digital art, or medieval-style image. No golden/sepia vintage filter. No painterly brushstrokes. Real-world colors, real textures, real lighting.';

/**
 * Hash determinístico — mesmo seed sempre gera mesmo estilo,
 * mas seeds diferentes (datas, títulos) rotacionam automaticamente.
 */
export function pickStyle(seed: string): typeof IMAGE_STYLES[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return IMAGE_STYLES[Math.abs(h) % IMAGE_STYLES.length];
}

/**
 * Verifica se o estilo é artístico (oil-painting ou watercolor).
 */
export function isArtisticStyle(kind: string): boolean {
  return kind === 'oil-painting' || kind === 'watercolor';
}

/**
 * Monta o prompt completo com estilo, tema e enforcamento de realismo.
 */
export function buildImagePrompt(opts: {
  title: string;
  context?: string;
  seed: string;
  aspectRatio?: string;
}): string {
  const style = pickStyle(opts.seed);
  const artistic = isArtisticStyle(style.kind);
  const enforcement = artistic ? '' : REALISTIC_ENFORCEMENT;
  const ratio = opts.aspectRatio || '3:4';
  const contextPart = opts.context ? `, context: ${opts.context}` : '';

  return `${style.desc}. Theme inspired by "${opts.title}"${contextPart}. NO people faces, NO cartoons, NO anime, NO text, NO watermarks, NO captions. ${ratio} aspect ratio.${enforcement}`;
}
