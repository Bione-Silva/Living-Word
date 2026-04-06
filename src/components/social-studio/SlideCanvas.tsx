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
}

const aspectClasses: Record<AspectRatio, string> = {
  '9:16': 'aspect-[9/16] max-w-[360px]',
  '4:5': 'aspect-[4/5] max-w-[440px]',
  '1:1': 'aspect-square max-w-[480px]',
};

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  ({ slide, aspectRatio, bgImageUrl, showWatermark = true, themeColor }, ref) => {
    const gradient = themeColor || 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]';

    return (
      <div
        ref={ref}
        className={`relative w-full ${aspectClasses[aspectRatio]} mx-auto overflow-hidden rounded-2xl select-none`}
        style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
      >
        {/* Background */}
        {bgImageUrl ? (
          <>
            <img
              src={bgImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-8 left-8 w-16 h-16 border border-white/10 rounded-full" />
          <div className="absolute bottom-12 right-8 w-24 h-24 border border-white/5 rounded-full" />
          <div className="absolute top-1/4 right-12 w-1 h-16 bg-gradient-to-b from-amber-400/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-8 sm:px-10 py-12 text-center">
          {/* Slide counter */}
          {slide.slideNumber && slide.totalSlides && (
            <div className="absolute top-6 right-6 text-white/40 text-xs font-sans tracking-wider">
              {slide.slideNumber}/{slide.totalSlides}
            </div>
          )}

          {/* Decorative line */}
          <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mb-6" />

          {/* Main text */}
          <p className="text-white text-xl sm:text-2xl md:text-3xl font-semibold leading-relaxed tracking-wide drop-shadow-lg">
            "{slide.text}"
          </p>

          {/* Subtitle / Reference */}
          {slide.subtitle && (
            <p className="mt-6 text-amber-200/80 text-sm sm:text-base font-medium tracking-widest uppercase font-sans">
              — {slide.subtitle}
            </p>
          )}

          {/* Decorative line */}
          <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mt-6" />
        </div>

        {/* Watermark */}
        {showWatermark && (
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-[9px] text-white/25 tracking-[0.3em] uppercase font-sans">
              Palavra Viva
            </span>
          </div>
        )}
      </div>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';
