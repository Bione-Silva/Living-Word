import { forwardRef } from 'react';
import type { AspectRatio } from './AspectRatioSelector';
import type { CanvasTemplate } from './TemplatePicker';

export interface SlideData {
  text: string;
  subtitle?: string;
  slideNumber?: number;
  totalSlides?: number;
}

interface Props {
  slide: SlideData;
  aspectRatio: AspectRatio;
  template: CanvasTemplate;
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

/* ── Helpers ── */

function isDarkText(textColor?: string) {
  const c = (textColor || '#FFFFFF').toLowerCase();
  return c !== '#ffffff' && c !== '#fff8e7' && c !== '#f5d78e' && c !== '#fbbf24';
}

function baseColor(gradient?: string) {
  // Extract first hex from gradient
  const match = gradient?.match(/#([0-9a-fA-F]{6})/);
  return match ? `#${match[1]}` : '#1a1a2e';
}

/* ────────────────────────────────────────────
   TEMPLATE 1 — EDITORIAL MINIMALISTA
   Image top 60% / Solid base 40% with text
   ──────────────────────────────────────────── */
function EditorialTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const solidBg = dark ? '#FDFAF5' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden" style={{ fontFamily: font }}>
      {/* Top 60%: image or gradient */}
      <div className="relative" style={{ height: '60%' }}>
        {bgImageUrl ? (
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} />
        )}
      </div>

      {/* Bottom 40%: solid base with text */}
      <div
        className="relative flex flex-col items-center justify-center px-8 text-center"
        style={{ height: '40%', backgroundColor: solidBg }}
      >
        <p
          className="text-base font-medium leading-relaxed tracking-wide sm:text-lg"
          style={{ color: dark ? '#2D1F14' : txtColor, fontFamily: font }}
        >
          {slide.text}
        </p>

        {slide.subtitle && (
          <p
            className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] font-sans"
            style={{ color: dark ? '#8A6A52' : `${txtColor}99` }}
          >
            — {slide.subtitle}
          </p>
        )}

        {slide.slideNumber && slide.totalSlides && (
          <span className="absolute top-3 right-4 text-[10px] font-sans font-medium" style={{ color: dark ? '#BBA58A' : `${txtColor}66` }}>
            {slide.slideNumber}/{slide.totalSlides}
          </span>
        )}

        {showWatermark && (
          <span className="absolute bottom-2 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: dark ? '#C4AE93' : `${txtColor}33` }}>
            Living Word
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 2 — SWISS TYPOGRAPHY
   Massive bold text, grid lines, no photos
   ──────────────────────────────────────────── */
function SwissTemplate({ slide, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template' | 'bgImageUrl'>) {
  const dark = isDarkText(textColor);
  const bg = dark ? '#F8F5F0' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const lineColor = dark ? '#D4C5B3' : `${txtColor}22`;
  const font = fontFamily || "'Montserrat', 'Helvetica Neue', sans-serif";

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: bg, fontFamily: font }}>
      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical line at 12% */}
        <div className="absolute top-0 bottom-0" style={{ left: '12%', width: '1px', backgroundColor: lineColor }} />
        {/* Horizontal line at 75% */}
        <div className="absolute left-0 right-0" style={{ top: '75%', height: '1px', backgroundColor: lineColor }} />
        {/* Vertical accent at 88% */}
        <div className="absolute top-[75%] bottom-[8%]" style={{ left: '88%', width: '2px', backgroundColor: dark ? '#6B4F3A' : txtColor }} />
      </div>

      {/* Main text — massive, left-aligned */}
      <div className="absolute flex flex-col justify-center" style={{ top: '8%', bottom: '30%', left: '12%', right: '10%', paddingLeft: '1rem' }}>
        <p
          className="text-2xl sm:text-3xl md:text-4xl font-black leading-[1.1] tracking-tight text-left"
          style={{ color: dark ? '#1A1008' : txtColor }}
        >
          {slide.text.replace(/^"|"$/g, '')}
        </p>
      </div>

      {/* Slide number — top right */}
      {slide.slideNumber && slide.totalSlides && (
        <span className="absolute top-4 right-5 text-xs font-mono font-bold" style={{ color: dark ? '#6B4F3A' : `${txtColor}88` }}>
          {String(slide.slideNumber).padStart(2, '0')}/{String(slide.totalSlides).padStart(2, '0')}
        </span>
      )}

      {/* Reference — bottom right, async float */}
      {slide.subtitle && (
        <div className="absolute flex flex-col items-end" style={{ bottom: '8%', right: '10%' }}>
          <div className="h-px w-12 mb-2" style={{ backgroundColor: dark ? '#6B4F3A' : txtColor }} />
          <p className="text-xs font-bold uppercase tracking-[0.3em] font-sans text-right" style={{ color: dark ? '#6B4F3A' : `${txtColor}CC` }}>
            {slide.subtitle}
          </p>
        </div>
      )}

      {showWatermark && (
        <span className="absolute bottom-3 left-[12%] ml-4 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: dark ? '#C4AE93' : `${txtColor}33` }}>
          Living Word
        </span>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 3 — CINEMATIC OVERLAY
   Full bleed image + deep bottom gradient
   ──────────────────────────────────────────── */
function CinematicTemplate({ slide, bgImageUrl, themeColor, fontFamily, showWatermark }: Omit<Props, 'aspectRatio' | 'template' | 'textColor'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const fallbackGradient = themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)';

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ fontFamily: font }}>
      {/* Full bleed image */}
      {bgImageUrl ? (
        <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: fallbackGradient }} />
      )}

      {/* Deep gradient overlay — bottom half protection */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 55%, transparent 70%)',
        }}
      />

      {/* Content — exclusively in the bottom half */}
      <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 sm:px-10 sm:pb-12">
        {slide.slideNumber && slide.totalSlides && (
          <span className="text-[10px] font-sans font-medium tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {slide.slideNumber}/{slide.totalSlides}
          </span>
        )}

        <p className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" style={{ color: '#FFF8E7' }}>
          {slide.text}
        </p>

        {slide.subtitle && (
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px w-8" style={{ backgroundColor: 'rgba(245,215,142,0.5)' }} />
            <p className="text-xs font-sans font-semibold uppercase tracking-[0.25em]" style={{ color: 'rgba(245,215,142,0.75)' }}>
              {slide.subtitle}
            </p>
          </div>
        )}

        {showWatermark && (
          <span className="mt-6 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Living Word
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   EXPORTED COMPONENT
   ──────────────────────────────────────────── */
export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  ({ slide, aspectRatio, template, bgImageUrl, showWatermark = true, themeColor, fontFamily, textColor }, ref) => {
    const captureSize = captureSizes[aspectRatio];

    return (
      <div className={`w-full ${aspectClasses[aspectRatio]} mx-auto transition-all duration-500 ease-in-out`}>
        <div
          ref={ref}
          data-capture-width={captureSize.width}
          data-capture-height={captureSize.height}
          className="relative h-full w-full overflow-hidden rounded-2xl select-none isolate shadow-xl"
        >
          {template === 'editorial' && (
            <EditorialTemplate slide={slide} bgImageUrl={bgImageUrl} themeColor={themeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'swiss' && (
            <SwissTemplate slide={slide} themeColor={themeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'cinematic' && (
            <CinematicTemplate slide={slide} bgImageUrl={bgImageUrl} themeColor={themeColor} fontFamily={fontFamily} showWatermark={showWatermark} />
          )}
        </div>
      </div>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';
