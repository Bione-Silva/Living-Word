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
  textColor?: string;
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

function getContrastSettings(bgImageUrl?: string, textColor?: string) {
  const txtColor = textColor || '#FFFFFF';
  const darkText = txtColor.toLowerCase() !== '#ffffff' && txtColor.toLowerCase() !== '#fff8e7' && txtColor.toLowerCase() !== '#f5d78e' && txtColor.toLowerCase() !== '#fbbf24';

  return {
    txtColor,
    overlayClass: bgImageUrl
      ? darkText
        ? 'bg-white/78'
        : 'bg-black/58'
      : undefined,
    shadow: darkText
      ? 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.35)]'
      : 'drop-shadow-[0_4px_18px_rgba(0,0,0,0.72)]',
    mutedColor: darkText ? '#3D2B1F' : `${txtColor}D9`,
    subtleColor: darkText ? '#6B4F3A' : `${txtColor}80`,
    faintColor: darkText ? '#8A6A52' : `${txtColor}4D`,
  };
}

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  ({ slide, aspectRatio, bgImageUrl, showWatermark = true, themeColor, fontFamily, textColor }, ref) => {
    const gradient = themeColor || 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]';
    const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
    const captureSize = captureSizes[aspectRatio];
    const contrast = getContrastSettings(bgImageUrl, textColor);

    return (
      <div className={`w-full ${aspectClasses[aspectRatio]} mx-auto`}>
        <div
          ref={ref}
          data-capture-width={captureSize.width}
          data-capture-height={captureSize.height}
          className="relative h-full w-full overflow-hidden rounded-2xl select-none isolate shadow-xl"
          style={{ fontFamily: font }}
        >
          {bgImageUrl ? (
            <>
              <img
                src={bgImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                crossOrigin="anonymous"
              />
              <div className={`absolute inset-0 ${contrast.overlayClass}`} />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}

          <div className="absolute left-0 top-0 h-full w-full">
            <div className="absolute left-8 top-8 h-16 w-16 rounded-full border" style={{ borderColor: contrast.faintColor }} />
            <div className="absolute bottom-12 right-8 h-24 w-24 rounded-full border" style={{ borderColor: `${contrast.faintColor}88` }} />
            <div className="absolute right-12 top-1/4 h-16 w-1" style={{ background: `linear-gradient(to bottom, ${contrast.subtleColor}, transparent)` }} />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-8 py-12 text-center sm:px-10">
            {slide.slideNumber && slide.totalSlides && (
              <div className="absolute right-6 top-6 text-xs font-sans tracking-wider font-semibold" style={{ color: contrast.mutedColor }}>
                {slide.slideNumber}/{slide.totalSlides}
              </div>
            )}

            <div className="mb-6 h-0.5 w-10" style={{ background: `linear-gradient(to right, transparent, ${contrast.subtleColor}, transparent)` }} />

            <p className={`text-xl font-semibold leading-relaxed tracking-wide sm:text-2xl md:text-3xl ${contrast.shadow}`} style={{ color: contrast.txtColor }}>
              "{slide.text}"
            </p>

            {slide.subtitle && (
              <p className="mt-6 font-sans text-sm font-semibold uppercase tracking-widest sm:text-base" style={{ color: contrast.mutedColor }}>
                — {slide.subtitle}
              </p>
            )}

            <div className="mt-6 h-0.5 w-10" style={{ background: `linear-gradient(to right, transparent, ${contrast.subtleColor}, transparent)` }} />
          </div>

          {showWatermark && (
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[9px] uppercase tracking-[0.3em] font-sans font-semibold" style={{ color: contrast.faintColor }}>
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
