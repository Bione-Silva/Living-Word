import { forwardRef } from 'react';
import type { AspectRatio } from './AspectRatioSelector';

export interface SlideData {
  text: string;
  subtitle?: string;
  slideNumber?: number;
  totalSlides?: number;
}

interface Props {
  slide: SlideData;
  aspectRatio: AspectRatio;
  bgImageUrl?: string;
  showWatermark?: boolean;
  themeColor?: string;
  fontFamily?: string;
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

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  ({ slide, aspectRatio, bgImageUrl, showWatermark = true, themeColor, fontFamily }, ref) => {
    const gradient = themeColor || 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]';
    const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
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
          {/* Background */}
          {bgImageUrl ? (
            <>
              <img
                src={bgImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/55" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}

          {/* Decorative elements */}
          <div className="absolute left-0 top-0 h-full w-full">
            <div className="absolute left-8 top-8 h-16 w-16 rounded-full border border-white/10" />
            <div className="absolute bottom-12 right-8 h-24 w-24 rounded-full border border-white/5" />
            <div className="absolute right-12 top-1/4 h-16 w-1 bg-gradient-to-b from-amber-400/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-8 py-12 text-center sm:px-10">
            {slide.slideNumber && slide.totalSlides && (
              <div className="absolute right-6 top-6 text-xs font-sans tracking-wider text-white/40">
                {slide.slideNumber}/{slide.totalSlides}
              </div>
            )}

            <div className="mb-6 h-0.5 w-10 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            <p className="text-white text-xl font-semibold leading-relaxed tracking-wide drop-shadow-lg sm:text-2xl md:text-3xl">
              "{slide.text}"
            </p>

            {slide.subtitle && (
              <p className="mt-6 font-sans text-sm font-medium uppercase tracking-widest text-amber-200/80 sm:text-base">
                — {slide.subtitle}
              </p>
            )}

            <div className="mt-6 h-0.5 w-10 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          </div>

          {showWatermark && (
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/25 font-sans">
                Palavra Viva
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';
