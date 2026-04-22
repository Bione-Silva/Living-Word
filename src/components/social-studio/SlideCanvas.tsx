import { forwardRef } from 'react';
import type { AspectRatio } from './AspectRatioSelector';
import type { CanvasTemplate } from './TemplatePicker';

export interface SlideData {
  text: string;
  subtitle?: string;
  slideNumber?: number;
  totalSlides?: number;
  bgImageUrl?: string;
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
  /**
   * Posição do slide no carrossel (0-based).
   * Quando `themeColors` tem múltiplos itens, rotaciona o fundo para criar
   * ritmo visual (`themeColors[slideIndex % themeColors.length]`).
   * Quando há `bgImageUrl` única, alterna a tonalidade da overlay.
   */
  slideIndex?: number;
  /**
   * Paleta sequencial do tema atual (3+ gradientes harmônicos).
   * Se omitida, comportamento legado: `themeColor` aplicado em todos os slides.
   */
  themeColors?: string[];
}

/**
 * Overlays sutis (R/G/B com alpha baixo) para alternar a "vibe" de uma
 * mesma imagem ao longo do carrossel — quente, frio, neutro, neutro escuro.
 */
const IMAGE_OVERLAY_TINTS = [
  'rgba(0,0,0,0)',
  'rgba(212,168,83,0.18)',   // gold warm
  'rgba(13,59,102,0.22)',    // ocean cool
  'rgba(0,0,0,0.18)',        // neutral deepen
];

const aspectClasses: Record<AspectRatio, string> = {
  '9:16': 'aspect-[9/16] max-w-[360px]',
  '4:5': 'aspect-[4/5] max-w-[440px]',
  '1:1': 'aspect-square max-w-[480px]',
  '1.91:1': 'aspect-[1.91/1] max-w-[560px]',
  '9:16-tiktok': 'aspect-[9/16] max-w-[360px]',
};

const captureSizes: Record<AspectRatio, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
  '1.91:1': { width: 1200, height: 628 },
  '9:16-tiktok': { width: 1080, height: 1920 },
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

/**
 * Auto-scale the verse font size based on text length so it always
 * looks balanced — long verses shrink, short verses breathe big.
 * Returns a value in `cqw` (container-query width) units so it
 * works identically in preview and exported canvas.
 */
function autoVerseSize(text: string): string {
  const len = (text || '').length;
  if (len < 60) return '8.5cqw';
  if (len < 120) return '7cqw';
  if (len < 200) return '5.8cqw';
  if (len < 300) return '5cqw';
  return '4.4cqw';
}

/* ────────────────────────────────────────────
   TEMPLATE 1 — EDITORIAL (image top, verse centered in lower panel)
   ──────────────────────────────────────────── */
function EditorialTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const solidBg = dark ? '#FDFAF5' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const verseSize = autoVerseSize(slide.text);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden" style={{ fontFamily: font, containerType: 'size' }}>
      <div className="relative" style={{ height: '55%' }}>
        {bgImageUrl ? (
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} />
        )}
      </div>
      <div
        className="relative flex-1 flex flex-col items-center justify-center text-center"
        style={{ backgroundColor: solidBg, padding: '6cqw 8cqw' }}
      >
        <p
          className="font-medium leading-[1.45] tracking-wide"
          style={{ color: dark ? '#2D1F14' : txtColor, fontFamily: font, fontSize: verseSize }}
        >
          {slide.text}
        </p>
        {slide.subtitle && (
          <p
            className="font-semibold uppercase font-sans"
            style={{
              color: dark ? '#8A6A52' : `${txtColor}99`,
              fontSize: '2.2cqw',
              letterSpacing: '0.25em',
              marginTop: '4cqw',
            }}
          >
            — {slide.subtitle}
          </p>
        )}
        {slide.slideNumber && slide.totalSlides && (
          <span
            className="absolute font-sans font-medium"
            style={{ color: dark ? '#BBA58A' : `${txtColor}66`, top: '3cqw', right: '4cqw', fontSize: '2cqw' }}
          >
            {slide.slideNumber}/{slide.totalSlides}
          </span>
        )}
        {showWatermark && (
          <span
            className="absolute uppercase font-sans font-medium"
            style={{
              color: dark ? '#C4AE93' : `${txtColor}33`,
              bottom: '3cqw',
              fontSize: '1.6cqw',
              letterSpacing: '0.4em',
            }}
          >
            LIVING WORD
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 2 — SWISS TYPOGRAPHY (centered verse, grid lines)
   ──────────────────────────────────────────── */
function SwissTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const bg = dark ? '#F8F6FF' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const lineColor = dark ? '#C9BCE8' : `${txtColor}22`;
  const font = fontFamily || "'Montserrat', 'Helvetica Neue', sans-serif";
  const verseSize = autoVerseSize(slide.text);

  return (
    <div
      className="relative h-full w-full overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: bg, fontFamily: font, containerType: 'size' }}
    >
      {/* Optional background image with soft tint for readability */}
      {bgImageUrl && (
        <>
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: dark ? 'rgba(248,246,255,0.82)' : `${baseColor(themeColor)}D9`,
            }}
          />
        </>
      )}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 bottom-0" style={{ left: '10%', width: '1px', backgroundColor: lineColor }} />
        <div className="absolute top-0 bottom-0" style={{ right: '10%', width: '1px', backgroundColor: lineColor }} />
        <div className="absolute left-0 right-0" style={{ top: '12%', height: '1px', backgroundColor: lineColor }} />
        <div className="absolute left-0 right-0" style={{ bottom: '12%', height: '1px', backgroundColor: lineColor }} />
      </div>

      {/* Centered content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ paddingLeft: '12cqw', paddingRight: '12cqw' }}
      >
        <p
          className="font-black leading-[1.15] tracking-tight"
          style={{ color: dark ? '#1A1008' : txtColor, fontSize: verseSize, fontFamily: font }}
        >
          {slide.text.replace(/^"|"$/g, '')}
        </p>
        {slide.subtitle && (
          <div className="flex items-center gap-3" style={{ marginTop: '5cqw' }}>
            <div className="h-px" style={{ backgroundColor: dark ? '#1E1240' : txtColor, width: '6cqw' }} />
            <p
              className="font-bold uppercase font-sans"
              style={{
                color: dark ? '#1E1240' : `${txtColor}CC`,
                fontSize: '2.2cqw',
                letterSpacing: '0.3em',
              }}
            >
              {slide.subtitle}
            </p>
          </div>
        )}
      </div>

      {slide.slideNumber && slide.totalSlides && (
        <span
          className="absolute font-mono font-bold"
          style={{
            color: dark ? '#1E1240' : `${txtColor}88`,
            top: '4cqw',
            right: '5cqw',
            fontSize: '2cqw',
          }}
        >
          {String(slide.slideNumber).padStart(2, '0')}/{String(slide.totalSlides).padStart(2, '0')}
        </span>
      )}
      {showWatermark && (
        <span
          className="absolute uppercase font-sans font-medium"
          style={{
            color: dark ? '#1E124066' : `${txtColor}55`,
            bottom: '4cqw',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.6cqw',
            letterSpacing: '0.4em',
          }}
        >
          LIVING WORD
        </span>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 3 — CINEMATIC (image bg, verse centered with overlay)
   ──────────────────────────────────────────── */
function CinematicTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const fallbackGradient = themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)';
  const txtColor = textColor || '#FFF8E7';
  const verseSize = autoVerseSize(slide.text);
  const activeBgImageUrl = slide.bgImageUrl || bgImageUrl;

  return (
    <div
      className="relative h-full w-full overflow-hidden flex items-center justify-center"
      style={{ fontFamily: font, containerType: 'size' }}
    >
      {activeBgImageUrl ? (
        <img src={activeBgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: fallbackGradient }} />
      )}
      {/* Symmetric vignette so the verse sits comfortably in the center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.9) 100%)',
        }}
      />

      {/* Centered verse */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ paddingLeft: '10cqw', paddingRight: '10cqw' }}
      >
        <p
          className="font-semibold leading-[1.4] tracking-wide"
          style={{
            color: txtColor,
            fontSize: verseSize,
            textShadow: '0 4px 24px rgba(0,0,0,0.7)',
            fontFamily: font,
          }}
        >
          {slide.text}
        </p>
        {slide.subtitle && (
          <div className="flex items-center gap-3" style={{ marginTop: '5cqw' }}>
            <div className="h-px" style={{ backgroundColor: 'rgba(245,215,142,0.5)', width: '6cqw' }} />
            <p
              className="font-sans font-semibold uppercase"
              style={{
                color: 'rgba(245,215,142,0.85)',
                fontSize: '2.2cqw',
                letterSpacing: '0.3em',
              }}
            >
              {slide.subtitle}
            </p>
            <div className="h-px" style={{ backgroundColor: 'rgba(245,215,142,0.5)', width: '6cqw' }} />
          </div>
        )}
      </div>

      {slide.slideNumber && slide.totalSlides && (
        <span
          className="absolute font-sans font-medium"
          style={{
            color: 'rgba(255,255,255,0.5)',
            top: '4cqw',
            right: '5cqw',
            fontSize: '2cqw',
            letterSpacing: '0.2em',
          }}
        >
          {slide.slideNumber}/{slide.totalSlides}
        </span>
      )}
      {showWatermark && (
        <span
          className="absolute uppercase font-sans font-medium"
          style={{
            color: 'rgba(255,255,255,0.35)',
            bottom: '4cqw',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.6cqw',
            letterSpacing: '0.4em',
          }}
        >
          LIVING WORD
        </span>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 4 — GRADIENT POSTER (centered verse, geometric accents)
   ──────────────────────────────────────────── */
function GradientTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const gradient = themeColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
  const txtColor = textColor || '#FFFFFF';
  const verseSize = autoVerseSize(slide.text);

  return (
    <div
      className="relative h-full w-full overflow-hidden flex items-center justify-center"
      style={{ backgroundImage: bgImageUrl ? undefined : gradient, containerType: 'size' }}
    >
      {/* Optional background image with gradient overlay for color cohesion */}
      {bgImageUrl && (
        <>
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0" style={{ backgroundImage: gradient, opacity: 0.78, mixBlendMode: 'multiply' }} />
        </>
      )}
      {/* Geometric decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ top: '-8%', left: '-6%', width: '35%', height: '35%', border: '1px solid rgba(255,255,255,0.12)' }} />
        <div className="absolute rounded-full" style={{ bottom: '-12%', right: '-8%', width: '45%', height: '45%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div
          className="absolute"
          style={{
            top: '50%', left: '50%',
            width: '60%', height: '60%',
            border: '1px solid rgba(255,255,255,0.06)',
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        />
        <div className="absolute left-[10%] right-[10%]" style={{ top: '14%', height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute left-[10%] right-[10%]" style={{ bottom: '14%', height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Centered content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ paddingLeft: '10cqw', paddingRight: '10cqw' }}
      >
        <p
          className="font-bold leading-[1.3] tracking-wide"
          style={{
            color: txtColor,
            fontFamily: font,
            fontSize: verseSize,
            textShadow: '0 2px 24px rgba(0,0,0,0.3)',
          }}
        >
          {slide.text}
        </p>

        {slide.subtitle && (
          <div className="flex items-center gap-3" style={{ marginTop: '5cqw' }}>
            <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.4)', width: '6cqw' }} />
            <p
              className="font-sans font-semibold uppercase"
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: '2.2cqw', letterSpacing: '0.3em' }}
            >
              {slide.subtitle}
            </p>
            <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.4)', width: '6cqw' }} />
          </div>
        )}
      </div>

      {slide.slideNumber && slide.totalSlides && (
        <span
          className="absolute font-sans font-medium uppercase"
          style={{
            color: 'rgba(255,255,255,0.55)',
            top: '4cqw',
            right: '5cqw',
            fontSize: '2cqw',
            letterSpacing: '0.3em',
          }}
        >
          {slide.slideNumber} / {slide.totalSlides}
        </span>
      )}
      {showWatermark && (
        <span
          className="absolute uppercase font-sans font-medium"
          style={{
            color: 'rgba(255,255,255,0.35)',
            bottom: '4cqw',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.6cqw',
            letterSpacing: '0.4em',
          }}
        >
          LIVING WORD
        </span>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 5 — LIVING WORD AMBER (centered verse, warm cross motif)
   ──────────────────────────────────────────── */
function LwAmberTemplate({ slide, bgImageUrl, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const txtColor = textColor || '#F5E6C8';
  const verseSize = autoVerseSize(slide.text);
  const amberGradient = 'linear-gradient(145deg, #1a0f05 0%, #2d1a0a 25%, #4a2c17 50%, #1E1240 75%, #6D28D9 100%)';

  return (
    <div
      className="relative h-full w-full overflow-hidden flex items-center justify-center"
      style={{
        background: bgImageUrl ? undefined : amberGradient,
        containerType: 'size',
      }}
    >
      {/* Optional background image with amber overlay for warm cohesion */}
      {bgImageUrl && (
        <>
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0" style={{ background: amberGradient, opacity: 0.75, mixBlendMode: 'multiply' }} />
        </>
      )}
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{ top: '8%', left: '50%', width: '1px', height: '14%', backgroundColor: 'rgba(245,230,200,0.2)', transform: 'translateX(-50%)' }} />
        <div className="absolute" style={{ top: '13%', left: '50%', width: '8%', height: '1px', backgroundColor: 'rgba(245,230,200,0.2)', transform: 'translateX(-50%)' }} />
        <div className="absolute" style={{ bottom: '6%', left: '6%', width: '4cqw', height: '4cqw', borderLeft: '1px solid rgba(245,230,200,0.25)', borderBottom: '1px solid rgba(245,230,200,0.25)' }} />
        <div className="absolute" style={{ top: '6%', right: '6%', width: '4cqw', height: '4cqw', borderRight: '1px solid rgba(245,230,200,0.25)', borderTop: '1px solid rgba(245,230,200,0.25)' }} />
        <div className="absolute" style={{ top: '50%', left: '50%', width: '80%', height: '80%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* Centered content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ paddingLeft: '10cqw', paddingRight: '10cqw' }}
      >
        <p
          className="font-bold leading-[1.35] tracking-wide"
          style={{
            color: txtColor,
            fontFamily: font,
            fontSize: verseSize,
            textShadow: '0 2px 24px rgba(0,0,0,0.5)',
          }}
        >
          {slide.text}
        </p>

        {slide.subtitle && (
          <div className="flex items-center gap-3" style={{ marginTop: '5cqw' }}>
            <div className="h-px" style={{ backgroundColor: 'rgba(245,230,200,0.5)', width: '6cqw' }} />
            <p
              className="font-sans font-semibold uppercase"
              style={{ color: '#F5E6C8', fontSize: '2.2cqw', letterSpacing: '0.3em' }}
            >
              {slide.subtitle}
            </p>
            <div className="h-px" style={{ backgroundColor: 'rgba(245,230,200,0.5)', width: '6cqw' }} />
          </div>
        )}
      </div>

      {slide.slideNumber && slide.totalSlides && (
        <span
          className="absolute font-sans font-medium uppercase"
          style={{
            color: 'rgba(245,230,200,0.55)',
            top: '4cqw',
            right: '5cqw',
            fontSize: '2cqw',
            letterSpacing: '0.3em',
          }}
        >
          {slide.slideNumber} / {slide.totalSlides}
        </span>
      )}
      {showWatermark && (
        <span
          className="absolute uppercase font-sans font-medium"
          style={{
            color: 'rgba(245,230,200,0.4)',
            bottom: '4cqw',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.6cqw',
            letterSpacing: '0.4em',
          }}
        >
          LIVING WORD
        </span>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 6 — SPLIT FRAME (Text top/bottom, image centered)
   ──────────────────────────────────────────── */
function SplitFrameTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const solidBg = dark ? '#FFFFFF' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const font = fontFamily || "'Montserrat', 'Helvetica Neue', sans-serif";
  const verseSize = autoVerseSize(slide.text);

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: solidBg, fontFamily: font, containerType: 'size' }}>
      {/* Top Banner (Subtitle / Book) */}
      <div className="w-full flex items-center justify-center text-center" style={{ height: '22%', padding: '0 8cqw' }}>
        <p className="font-bold uppercase font-sans tracking-widest" style={{ color: dark ? '#555555' : `${txtColor}EE`, fontSize: '2.5cqw', letterSpacing: '0.25em' }}>
          {slide.subtitle || 'LIVING WORD'}
        </p>
      </div>

      {/* Center Frame (Image) */}
      <div className="w-full flex-1 relative px-6 z-10" style={{ height: '48%' }}>
        <div className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl border border-white/10">
          {bgImageUrl ? (
            <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} />
          )}
        </div>
      </div>

      {/* Bottom Banner (Verse Text) */}
      <div className="w-full flex flex-col items-center justify-center text-center relative" style={{ height: '30%', padding: '2cqw 8cqw 4cqw 8cqw' }}>
        <p className="font-semibold leading-[1.3] tracking-wide" style={{ color: dark ? '#222222' : txtColor, fontSize: verseSize, fontFamily: font }}>
          {slide.text}
        </p>
        
        {slide.slideNumber && slide.totalSlides && (
          <span className="absolute font-sans font-bold" style={{ color: dark ? '#888888' : `${txtColor}88`, bottom: '4cqw', left: '6cqw', fontSize: '1.8cqw' }}>
            {slide.slideNumber} / {slide.totalSlides}
          </span>
        )}

        {showWatermark && (
          <span className="absolute uppercase font-sans font-bold" style={{ color: dark ? '#888888' : `${txtColor}88`, bottom: '4cqw', right: '6cqw', fontSize: '1.6cqw', letterSpacing: '0.4em' }}>
            LIVING WORD
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 7 — PHOTO CARD (Top text, middle image, bottom text area)
   ──────────────────────────────────────────── */
function PhotoCardTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const bg = dark ? '#F3F6FA' : baseColor(themeColor);
  const titleColor = dark ? '#1E3A8A' : '#FFFFFF'; // Deep blue or white
  const bodyColor = dark ? '#334155' : 'rgba(255,255,255,0.9)';
  const font = fontFamily || "'Inter', 'Helvetica Neue', sans-serif";
  
  // Decide which is the title and which is the body.
  // Usually, religious content has `text` (the verse) and `subtitle` (the reference).
  // For the corporate style, we'll make the first part of the text large, or if it's short, all of it.
  return (
    <div
      className="relative h-full w-full flex flex-col justify-between"
      style={{ backgroundColor: bg, fontFamily: font, containerType: 'size', padding: '8cqw 6cqw' }}
    >
      {/* Title Area */}
      <div className="text-left" style={{ marginBottom: '4cqw' }}>
        <h2 className="font-extrabold leading-[1.05] tracking-tight" style={{ color: titleColor, fontSize: '6cqw' }}>
          {slide.subtitle ? slide.subtitle : 'DESTAQUE'}
        </h2>
      </div>

      {/* Covered Image Area */}
      <div className="w-full relative rounded-2xl overflow-hidden shadow-sm" style={{ flex: '1', minHeight: '30%' }}>
        {bgImageUrl ? (
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #94a3b8, #cbd5e1)' }} />
        )}
      </div>

      {/* Body Area */}
      <div className="text-left" style={{ marginTop: '4cqw', marginBottom: '4cqw' }}>
        <p className="font-medium leading-[1.4]" style={{ color: bodyColor, fontSize: '3.2cqw' }}>
          {slide.text}
        </p>
      </div>

      {/* Footer Area */}
      {showWatermark && (
        <div className="w-full flex items-center justify-between border-t" style={{ paddingTop: '2cqw', borderColor: dark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }}>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: titleColor, color: bg }}>▶</span>
            <span className="text-[1.8cqw] font-semibold" style={{ color: dark ? '#64748B' : 'rgba(255,255,255,0.6)' }}>@livingword</span>
          </div>
          {slide.slideNumber && slide.totalSlides && (
            <div className="flex gap-1">
               {Array.from({ length: slide.totalSlides }).map((_, i) => (
                 <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (i + 1) === slide.slideNumber ? titleColor : (dark ? '#CBD5E1' : 'rgba(255,255,255,0.2)') }} />
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 8 — PHOTO OVERLAY (Full image, bottom dark gradient text)
   ──────────────────────────────────────────── */
function PhotoOverlayTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const font = fontFamily || "'Inter', 'Helvetica Neue', sans-serif";
  const titleColor = '#FFFFFF';
  const bodyColor = 'rgba(255,255,255,0.9)';

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: baseColor(themeColor), fontFamily: font, containerType: 'size' }}>
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        {bgImageUrl ? (
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #1e293b, #0f172a)' }} />
        )}
      </div>

      {/* Dark Gradient Overlay for Text */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)' }} />

      {/* Content Positioned at Bottom */}
      <div className="relative z-10 flex-1 flex flex-col justify-end text-left" style={{ padding: '8cqw 6cqw' }}>
        <h2 className="font-extrabold leading-[1.05] tracking-tight mb-4" style={{ color: titleColor, fontSize: '6.5cqw', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {slide.subtitle || 'DESTAQUE'}
        </h2>
        <p className="font-medium leading-[1.4]" style={{ color: bodyColor, fontSize: '3.5cqw', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {slide.text}
        </p>

        {showWatermark && (
          <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-[2cqw] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>@livingword</span>
            </div>
            {slide.slideNumber && slide.totalSlides && (
              <div className="flex gap-1.5">
                 {Array.from({ length: slide.totalSlides }).map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (i + 1) === slide.slideNumber ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }} />
                 ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TEMPLATE 9 — PHOTO TOP (Big text on top solid half, image on bottom half)
   ──────────────────────────────────────────── */
function PhotoTopTemplate({ slide, bgImageUrl, themeColor, fontFamily, textColor, showWatermark }: Omit<Props, 'aspectRatio' | 'template'>) {
  const dark = isDarkText(textColor);
  const bg = dark ? '#FFFFFF' : baseColor(themeColor);
  const titleColor = dark ? '#0F172A' : '#FFFFFF';
  const font = fontFamily || "'Inter', 'Helvetica Neue', sans-serif";

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: bg, fontFamily: font, containerType: 'size' }}>
      
      {/* Top Text Area */}
      <div className="w-full flex flex-col items-start justify-center text-left" style={{ height: '45%', padding: '6cqw 8cqw' }}>
        <h2 className="font-extrabold leading-[1.05] tracking-tight" style={{ color: titleColor, fontSize: '6cqw' }}>
          {slide.subtitle ? slide.subtitle : 'DESTAQUE'}
        </h2>
        <p className="mt-3 font-medium leading-[1.4]" style={{ color: dark ? '#475569' : 'rgba(255,255,255,0.8)', fontSize: '3cqw' }}>
          {slide.text}
        </p>
      </div>

      {/* Bottom Image Area */}
      <div className="w-full relative shadow-inner" style={{ height: '55%' }}>
        {bgImageUrl ? (
          <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: themeColor || 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' }} />
        )}
        
        {/* Footer Overlay */}
        {showWatermark && (
          <div className="absolute bottom-0 left-0 w-full p-4 flex items-center justify-between bg-black/40 backdrop-blur-md">
            <span className="text-[2cqw] font-semibold text-white/90">@livingword</span>
            {slide.slideNumber && slide.totalSlides && (
              <span className="text-[2cqw] font-bold text-white/60">
                {slide.slideNumber} / {slide.totalSlides}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   EXPORTED COMPONENT
   ──────────────────────────────────────────── */
export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  (
    {
      slide,
      aspectRatio,
      template,
      bgImageUrl,
      showWatermark = true,
      themeColor,
      fontFamily,
      textColor,
      slideIndex = 0,
      themeColors,
    },
    ref,
  ) => {
    const captureSize = captureSizes[aspectRatio];

    // Variação Sequencial — rotaciona o fundo pelo índice do slide
    // para evitar carrossel monótono. Se a paleta não foi fornecida,
    // mantém o `themeColor` original (retrocompat).
    const effectiveThemeColor =
      themeColors && themeColors.length > 0
        ? themeColors[slideIndex % themeColors.length]
        : themeColor;
    const effectiveBgImageUrl = slide.bgImageUrl || bgImageUrl;

    // Quando há imagem única, alternamos uma tint suave por índice
    // para simular variação visual entre slides do mesmo carrossel.
    const overlayTint = effectiveBgImageUrl
      ? IMAGE_OVERLAY_TINTS[slideIndex % IMAGE_OVERLAY_TINTS.length]
      : null;

    return (
      <div className={`w-full ${aspectClasses[aspectRatio]} mx-auto transition-all duration-500 ease-in-out`}>
        <div
          ref={ref}
          data-capture-width={captureSize.width}
          data-capture-height={captureSize.height}
          className="relative h-full w-full overflow-hidden rounded-2xl select-none isolate shadow-xl"
        >
          {template === 'editorial' && (
            <EditorialTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'swiss' && (
            <SwissTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'cinematic' && (
            <CinematicTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'gradient' && (
            <GradientTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'lw-amber' && (
            <LwAmberTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'split-frame' && (
            <SplitFrameTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'photo-card' && (
            <PhotoCardTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'photo-overlay' && (
            <PhotoOverlayTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}
          {template === 'photo-top' && (
            <PhotoTopTemplate slide={slide} bgImageUrl={effectiveBgImageUrl} themeColor={effectiveThemeColor} fontFamily={fontFamily} textColor={textColor} showWatermark={showWatermark} />
          )}

          {/* Overlay tonal por índice — só quando há imagem única
              (cria sensação de variação sem trocar a foto). */}
          {overlayTint && overlayTint !== 'rgba(0,0,0,0)' && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: overlayTint, mixBlendMode: 'soft-light' }}
            />
          )}
        </div>
      </div>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';
