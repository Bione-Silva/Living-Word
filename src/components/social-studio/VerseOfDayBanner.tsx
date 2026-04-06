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
  overlayGradient?: string;
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

export const VerseOfDayBanner = forwardRef<HTMLDivElement, Props>(
  ({ verse, aspectRatio, fontFamily, textColor, overlayGradient }, ref) => {
    const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
    const txtColor = textColor || '#FFFFFF';
    const accentColor = textColor === '#FBBF24' || textColor === '#F5D78E'
      ? txtColor
      : '#F5D78E'; // gold accent
    const captureSize = captureSizes[aspectRatio];

    return (
      <div className={`w-full ${aspectClasses[aspectRatio]} mx-auto`}>
        <div
          ref={ref}
          data-capture-width={captureSize.width}
          data-capture-height={captureSize.height}
          className="relative h-full w-full overflow-hidden rounded-2xl select-none isolate"
          style={{ fontFamily: font }}
        >
          <img
            src={verse.topic_image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px 30px rgba(0,0,0,0.4)' }} />

          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="text-2xl" style={{ color: `${accentColor}B3` }}>✦</div>
            <div className="h-0.5 w-8" style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-10 py-16 text-center sm:px-12">
            <p className="mb-6 text-[10px] uppercase tracking-[0.4em] font-sans sm:text-xs" style={{ color: `${accentColor}CC` }}>
              Versículo do Dia
            </p>

            <p className="text-lg font-semibold leading-[1.6] tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-xl md:text-2xl" style={{ color: txtColor }}>
              "{verse.text}"
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-8" style={{ backgroundColor: `${accentColor}66` }} />
              <div className="text-xs" style={{ color: `${accentColor}80` }}>✝</div>
              <div className="h-px w-8" style={{ backgroundColor: `${accentColor}66` }} />
            </div>

            <p className="mt-4 font-sans text-sm font-medium uppercase tracking-[0.2em] sm:text-base" style={{ color: `${accentColor}E6` }}>
              {verse.book}
            </p>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-[8px] uppercase tracking-[0.4em] font-sans" style={{ color: `${txtColor}33` }}>
              Palavra Viva
            </span>
          </div>
        </div>
      </div>
    );
  }
);

VerseOfDayBanner.displayName = 'VerseOfDayBanner';
