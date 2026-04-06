import { forwardRef } from 'react';
import type { AspectRatio } from './AspectRatioSelector';

export interface VerseData {
  text: string;
  book: string;
  topic_image: string;
}

interface Props {
  verse: VerseData;
  aspectRatio: AspectRatio;
  fontFamily?: string;
  textColor?: string;
  backgroundImageUrl?: string;
}

const aspectClasses: Record<AspectRatio, string> = {
  '9:16': 'aspect-[9/16] max-w-[360px]',
  '4:5': 'aspect-[4/5] max-w-[440px]',
  '1:1': 'aspect-square max-w-[480px]',
};

const captureSizes: Record<AspectRatio, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
};

function getContrastSettings(textColor?: string) {
  const txtColor = textColor || '#FFFFFF';
  const darkText = txtColor.toLowerCase() !== '#ffffff' && txtColor.toLowerCase() !== '#fff8e7' && txtColor.toLowerCase() !== '#f5d78e' && txtColor.toLowerCase() !== '#fbbf24';

  return {
    txtColor,
    darkText,
    overlayClass: darkText ? 'bg-white/80' : 'bg-black/62',
    shadow: darkText
      ? 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.35)]'
      : 'drop-shadow-[0_4px_18px_rgba(0,0,0,0.72)]',
    accentColor: darkText ? '#6B4F3A' : '#F5D78E',
    mutedColor: darkText ? '#3D2B1F' : '#F8E9C2',
    faintColor: darkText ? '#8A6A52' : '#E7C978',
    watermark: darkText ? '#6B4F3A99' : '#FFFFFF40',
  };
}

export const VerseOfDayBanner = forwardRef<HTMLDivElement, Props>(
  ({ verse, aspectRatio, fontFamily, textColor, backgroundImageUrl }, ref) => {
    const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
    const captureSize = captureSizes[aspectRatio];
    const contrast = getContrastSettings(textColor);
    const imageUrl = backgroundImageUrl || verse.topic_image;

    return (
      <div className={`w-full ${aspectClasses[aspectRatio]} mx-auto`}>
        <div
          ref={ref}
          data-capture-width={captureSize.width}
          data-capture-height={captureSize.height}
          className="relative h-full w-full overflow-hidden rounded-2xl select-none isolate shadow-xl"
          style={{ fontFamily: font }}
        >
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
          />

          <div className={`absolute inset-0 ${contrast.overlayClass}`} />
          <div className="absolute inset-0" style={{ boxShadow: contrast.darkText ? 'inset 0 0 120px 30px rgba(255,255,255,0.18)' : 'inset 0 0 120px 30px rgba(0,0,0,0.45)' }} />

          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="text-2xl" style={{ color: contrast.accentColor }}>✦</div>
            <div className="h-0.5 w-8" style={{ background: `linear-gradient(to right, transparent, ${contrast.accentColor}, transparent)` }} />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-10 py-16 text-center sm:px-12">
            <p className="mb-6 text-[10px] uppercase tracking-[0.4em] font-sans font-semibold sm:text-xs" style={{ color: contrast.faintColor }}>
              Versículo do Dia
            </p>

            <p className={`text-lg font-semibold leading-[1.6] tracking-wide sm:text-xl md:text-2xl ${contrast.shadow}`} style={{ color: contrast.txtColor }}>
              "{verse.text}"
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-8" style={{ backgroundColor: contrast.accentColor }} />
              <div className="text-xs" style={{ color: contrast.accentColor }}>✝</div>
              <div className="h-px w-8" style={{ backgroundColor: contrast.accentColor }} />
            </div>

            <p className="mt-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] sm:text-base" style={{ color: contrast.mutedColor }}>
              {verse.book}
            </p>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-[8px] uppercase tracking-[0.4em] font-sans font-semibold" style={{ color: contrast.watermark }}>
              Palavra Viva
            </span>
          </div>
        </div>
      </div>
    );
  }
);

VerseOfDayBanner.displayName = 'VerseOfDayBanner';
