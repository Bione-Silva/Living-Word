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
  const match = gradient?.match(/#([0-9a-fA-F]{6})/);
  return match ? `#${match[1]}` : '#1a1a2e';
}

/* ────────────────────────────────────────────
   TEMPLATE 1 — EDITORIAL MINIMALISTA
   ──────────────────────────────────────────── */
function EditorialTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const solidBg = dark ? '#FDFAF5' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden" style={{ fontFamily: font }}>
      <div className="relative" style={{ height: '60%' }}>
        {bgImageUrl ? (
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} />
        )}
      </div>
      <div
        className="relative flex flex-col items-center justify-center px-8 text-center"
        style={{ height: '40%', backgroundColor: solidBg }}
      >
        <p className="text-base font-medium leading-relaxed tracking-wide sm:text-lg" style={{ color: dark ? '#2D1F14' : txtColor, fontFamily: font }}>
          {slide.text}
        </p>
        {slide.subtitle && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] font-sans" style={{ color: dark ? '#8A6A52' : `${txtColor}99` }}>
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
   ──────────────────────────────────────────── */
function SwissTemplate({ slide, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template' | 'bgImageUrl'>) {
  const dark = isDarkText(textColor);
  const bg = dark ? '#F8F6FF' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const lineColor = dark ? '#C9BCE8' : `${txtColor}22`;
  const font = fontFamily || "'Montserrat', 'Helvetica Neue', sans-serif";

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: bg, fontFamily: font }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 bottom-0" style={{ left: '12%', width: '1px', backgroundColor: lineColor }} />
        <div className="absolute left-0 right-0" style={{ top: '75%', height: '1px', backgroundColor: lineColor }} />
        <div className="absolute top-[75%] bottom-[8%]" style={{ left: '88%', width: '2px', backgroundColor: dark ? '#1E1240' : txtColor }} />
      </div>
      <div className="absolute flex flex-col justify-center" style={{ top: '8%', bottom: '30%', left: '12%', right: '10%', paddingLeft: '1rem' }}>
        <p className="text-2xl sm:text-3xl md:text-4xl font-black leading-[1.1] tracking-tight text-left" style={{ color: dark ? '#1A1008' : txtColor }}>
          {slide.text.replace(/^"|"$/g, '')}
        </p>
      </div>
      {slide.slideNumber && slide.totalSlides && (
        <span className="absolute top-4 right-5 text-xs font-mono font-bold" style={{ color: dark ? '#1E1240' : `${txtColor}88` }}>
          {String(slide.slideNumber).padStart(2, '0')}/{String(slide.totalSlides).padStart(2, '0')}
        </span>
      )}
      {slide.subtitle && (
        <div className="absolute flex flex-col items-end" style={{ bottom: '8%', right: '10%' }}>
          <div className="h-px w-12 mb-2" style={{ backgroundColor: dark ? '#1E1240' : txtColor }} />
          <p className="text-xs font-bold uppercase tracking-[0.3em] font-sans text-right" style={{ color: dark ? '#1E1240' : `${txtColor}CC` }}>
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
   ──────────────────────────────────────────── */
function CinematicTemplate({ slide, bgImageUrl, themeColor, fontFamily, showWatermark }: Omit<Props, 'aspectRatio' | 'template' | 'textColor'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const fallbackGradient = themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)';

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ fontFamily: font }}>
      {bgImageUrl ? (
        <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: fallbackGradient }} />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 55%, transparent 70%)' }} />
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
   TEMPLATE 4 — GRADIENT POSTER
   Vibrant gradient background + geometric accents + centered display typography
   ──────────────────────────────────────────── */
function GradientTemplate({ slide, themeColor, fontFamily, showWatermark }: Omit<Props, 'aspectRatio' | 'template' | 'bgImageUrl' | 'textColor'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const gradient = themeColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center" style={{ backgroundImage: gradient }}>
      {/* Geometric decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left circle */}
        <div
          className="absolute rounded-full"
          style={{ top: '-8%', left: '-6%', width: '35%', height: '35%', border: '1px solid rgba(255,255,255,0.12)' }}
        />
        {/* Bottom-right circle */}
        <div
          className="absolute rounded-full"
          style={{ bottom: '-12%', right: '-8%', width: '45%', height: '45%', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        {/* Center diamond */}
        <div
          className="absolute"
          style={{
            top: '50%', left: '50%',
            width: '60%', height: '60%',
            border: '1px solid rgba(255,255,255,0.06)',
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        />
        {/* Thin horizontal lines */}
        <div className="absolute left-[10%] right-[10%]" style={{ top: '18%', height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute left-[10%] right-[10%]" style={{ bottom: '18%', height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        {/* Vertical accent */}
        <div className="absolute" style={{ top: '15%', bottom: '15%', left: '8%', width: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute" style={{ top: '15%', bottom: '15%', right: '8%', width: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
        {/* Small decorative dot */}
        <div className="absolute rounded-full" style={{ top: '18%', left: '8%', width: '6px', height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '18%', right: '8%', width: '6px', height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', transform: 'translate(50%, 50%)' }} />
      </div>

      {/* Content — centered */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-10 sm:px-14 max-w-full">
        {slide.slideNumber && slide.totalSlides && (
          <span className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {slide.slideNumber} / {slide.totalSlides}
          </span>
        )}

        <p
          className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug tracking-wide"
          style={{ color: '#FFFFFF', fontFamily: font, textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}
        >
          {slide.text}
        </p>

        {slide.subtitle && (
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px w-10" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <p className="text-xs font-sans font-semibold uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {slide.subtitle}
            </p>
            <div className="h-px w-10" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}

        {showWatermark && (
          <span className="mt-8 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Living Word
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 5 — LIVING WORD AMBER
   Warm amber/gold pastoral gradient with cross motif
   ──────────────────────────────────────────── */
function LwAmberTemplate({ slide, fontFamily, showWatermark }: Omit<Props, 'aspectRatio' | 'template' | 'bgImageUrl' | 'textColor'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #1a0f05 0%, #2d1a0a 25%, #4a2c17 50%, #1E1240 75%, #6D28D9 100%)' }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cross motif */}
        <div className="absolute" style={{ top: '8%', left: '50%', width: '1px', height: '20%', backgroundColor: 'rgba(109,40,217,0.15)', transform: 'translateX(-50%)' }} />
        <div className="absolute" style={{ top: '16%', left: '50%', width: '12%', height: '1px', backgroundColor: 'rgba(109,40,217,0.15)', transform: 'translateX(-50%)' }} />
        {/* Corner accents */}
        <div className="absolute" style={{ bottom: '6%', left: '6%', width: '30px', height: '30px', borderLeft: '1px solid rgba(109,40,217,0.2)', borderBottom: '1px solid rgba(109,40,217,0.2)' }} />
        <div className="absolute" style={{ top: '6%', right: '6%', width: '30px', height: '30px', borderRight: '1px solid rgba(109,40,217,0.2)', borderTop: '1px solid rgba(109,40,217,0.2)' }} />
        {/* Radial glow */}
        <div className="absolute" style={{ top: '50%', left: '50%', width: '80%', height: '80%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-10 sm:px-14 max-w-full">
        {slide.slideNumber && slide.totalSlides && (
          <span className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase mb-6" style={{ color: 'rgba(109,40,217,0.5)' }}>
            {slide.slideNumber} / {slide.totalSlides}
          </span>
        )}

        <p
          className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug tracking-wide"
          style={{ color: '#F5E6C8', fontFamily: font, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
        >
          {slide.text}
        </p>

        {slide.subtitle && (
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px w-10" style={{ backgroundColor: 'rgba(109,40,217,0.4)' }} />
            <p className="text-xs font-sans font-semibold uppercase tracking-[0.3em]" style={{ color: '#6D28D9' }}>
              {slide.subtitle}
            </p>
            <div className="h-px w-10" style={{ backgroundColor: 'rgba(109,40,217,0.4)' }} />
          </div>
        )}

        {showWatermark && (
          <span className="mt-8 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: 'rgba(109,40,217,0.25)' }}>
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
          {template === 'gradient' && (
            <GradientTemplate slide={slide} themeColor={themeColor} fontFamily={fontFamily} showWatermark={showWatermark} />
          )}
          {template === 'lw-amber' && (
            <LwAmberTemplate slide={slide} fontFamily={fontFamily} showWatermark={showWatermark} />
          )}
        </div>
      </div>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';
