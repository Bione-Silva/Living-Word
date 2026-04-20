export type SceneSourceType =
  | 'library_single'
  | 'library_multi'
  | 'ai_generated'
  | 'ai_variations_from_library'
  | 'custom_upload';

export type VariationMode =
  | 'none'
  | 'reframe'
  | 'visual_variation'
  | 'lighting_variation'
  | 'composition_variation';

export type CarouselDistributionMode =
  | 'auto_balance'
  | 'alternate_image_text'
  | 'image_every_slide'
  | 'image_priority';

export interface SceneAsset {
  id: string;
  imageUrl: string;
  label: string;
  prompt?: string;
  origin: 'library' | 'variation' | 'generated' | 'upload';
}

interface DistributionOptions {
  scenePool: SceneAsset[];
  sourceType?: SceneSourceType | null;
  distributionMode?: CarouselDistributionMode;
}

function buildImageSlots(
  slideCount: number,
  sourceType: SceneSourceType | null | undefined,
  distributionMode: CarouselDistributionMode,
) {
  if (slideCount <= 0) return [];

  if (distributionMode === 'image_every_slide') {
    return Array.from({ length: slideCount }, () => true);
  }

  if (distributionMode === 'image_priority') {
    return Array.from({ length: slideCount }, (_, index) => index < Math.min(slideCount, 5));
  }

  if (distributionMode === 'alternate_image_text') {
    return Array.from({ length: slideCount }, (_, index) => index % 2 === 0);
  }

  if (slideCount === 1) return [true];

  switch (sourceType) {
    case 'ai_variations_from_library':
    case 'ai_generated':
      return Array.from({ length: slideCount }, () => true);
    case 'library_multi':
      return Array.from({ length: slideCount }, (_, index) => index % 2 === 0);
    case 'custom_upload':
    case 'library_single':
    default:
      return Array.from({ length: slideCount }, (_, index) => index % 2 === 0).map((useImage, index) => {
        if (!useImage) return false;
        const imageSlotIndex = Math.floor(index / 2);
        return imageSlotIndex < 3;
      });
  }
}

export function resolveSceneAssignments(
  slideCount: number,
  { scenePool, sourceType, distributionMode = 'auto_balance' }: DistributionOptions,
): Array<SceneAsset | undefined> {
  if (slideCount <= 0 || scenePool.length === 0) {
    return Array.from({ length: slideCount }, () => undefined);
  }

  const imageSlots = buildImageSlots(slideCount, sourceType, distributionMode);
  const assignments: Array<SceneAsset | undefined> = Array.from({ length: slideCount }, () => undefined);
  let cursor = 0;
  let previousId: string | null = null;

  for (let index = 0; index < slideCount; index += 1) {
    if (!imageSlots[index]) continue;

    let candidate = scenePool[cursor % scenePool.length];
    if (scenePool.length > 1 && candidate.id === previousId) {
      cursor += 1;
      candidate = scenePool[cursor % scenePool.length];
    }

    assignments[index] = candidate;
    previousId = candidate.id;
    cursor += 1;
  }

  return assignments;
}

export function applySceneDistribution<T extends { bgImageUrl?: string }>(
  slides: T[],
  options: DistributionOptions,
): T[] {
  const assignments = resolveSceneAssignments(slides.length, options);

  return slides.map((slide, index) => ({
    ...slide,
    bgImageUrl: assignments[index]?.imageUrl,
  }));
}