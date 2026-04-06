import { forwardRef } from 'react';
import type { AspectRatio } from './AspectRatioSelector';
import type { CanvasTemplate } from './TemplatePicker';

export interface VerseData {
  text: string;
  book: string;
  topic_image: string;
}

interface Props {
  verse: VerseData;
  aspectRatio: AspectRatio;
  template: CanvasTemplate;
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

function isDarkText(textColor?: string) {
  const c = (textColor || '#FFFFFF').toLowerCase();
  return c !== '#ffffff' && c !== '#fff8e7' && c !== '#f5d78e' && c !== '#fbbf24';
}

function baseColor(gradient?: string) {
  const match = gradient?.match(/#([0-9a-fA-F]{6})/);
  return match ? `#${match[1]}` : '#1a1a2e';
}

/* ── EDITORIAL ── */
function EditorialVerse({ verse, fontFamily, textColor, backgroundImageUrl, themeColor }: { verse: VerseData; fontFamily?: string; textColor?: string; backgroundImageUrl?: string; themeColor?: string }) {
  const dark = isDarkText(textColor);
  const solidBg = dark ? '#FDFAF5' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const imgUrl = backgroundImageUrl || verse.topic_image;

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden" style={{ fontFamily: font }}>
      <div className="relative" style={{ height: '60%' }}>
        <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      </div>
      <div className="relative flex flex-col items-center justify-center px-8 text-center" style={{ height: '40%', backgroundColor: solidBg }}>
        <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium mb-3" style={{ color: dark ? '#BBA58A' : `${txtColor}66` }}>
          Versículo do Dia
        </p>
        <p className="text-base font-medium leading-relaxed tracking-wide sm:text-lg" style={{ color: dark ? '#2D1F14' : txtColor }}>
          "{verse.text}"
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-6" style={{ backgroundColor: dark ? '#C4AE93' : `${txtColor}44` }} />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] font-sans" style={{ color: dark ? '#6B4F3A' : `${txtColor}99` }}>
            {verse.book}
          </p>
          <div className="h-px w-6" style={{ backgroundColor: dark ? '#C4AE93' : `${txtColor}44` }} />
        </div>
        <span className="absolute bottom-2 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: dark ? '#D4C5B3' : `${txtColor}33` }}>
          Living Word
        </span>
      </div>
    </div>
  );
}

/* ── SWISS ── */
function SwissVerse({ verse, fontFamily, textColor, themeColor }: { verse: VerseData; fontFamily?: string; textColor?: string; themeColor?: string }) {
  const dark = isDarkText(textColor);
  const bg = dark ? '#F8F5F0' : baseColor(themeColor);
  const txtColor = textColor || '#FFFFFF';
  const lineColor = dark ? '#D4C5B3' : `${txtColor}22`;
  const font = fontFamily || "'Montserrat', 'Helvetica Neue', sans-serif";

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: bg, fontFamily: font }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 bottom-0" style={{ left: '12%', width: '1px', backgroundColor: lineColor }} />
        <div className="absolute left-0 right-0" style={{ top: '75%', height: '1px', backgroundColor: lineColor }} />
        <div className="absolute top-[75%] bottom-[8%]" style={{ left: '88%', width: '2px', backgroundColor: dark ? '#6B4F3A' : txtColor }} />
      </div>

      <span className="absolute top-4 left-[12%] ml-4 text-[9px] uppercase tracking-[0.3em] font-sans font-medium" style={{ color: dark ? '#BBA58A' : `${txtColor}55` }}>
        Versículo do Dia
      </span>

      <div className="absolute flex flex-col justify-center" style={{ top: '10%', bottom: '30%', left: '12%', right: '10%', paddingLeft: '1rem' }}>
        <p className="text-2xl sm:text-3xl md:text-4xl font-black leading-[1.1] tracking-tight text-left" style={{ color: dark ? '#1A1008' : txtColor }}>
          {verse.text}
        </p>
      </div>

      <div className="absolute flex flex-col items-end" style={{ bottom: '8%', right: '10%' }}>
        <div className="h-px w-12 mb-2" style={{ backgroundColor: dark ? '#6B4F3A' : txtColor }} />
        <p className="text-xs font-bold uppercase tracking-[0.3em] font-sans text-right" style={{ color: dark ? '#6B4F3A' : `${txtColor}CC` }}>
          {verse.book}
        </p>
      </div>

      <span className="absolute bottom-3 left-[12%] ml-4 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: dark ? '#C4AE93' : `${txtColor}33` }}>
        Palavra Viva
      </span>
    </div>
  );
}

/* ── CINEMATIC ── */
function CinematicVerse({ verse, fontFamily, backgroundImageUrl }: { verse: VerseData; fontFamily?: string; backgroundImageUrl?: string }) {
  const font = fontFamily || "'Cormorant Garamond', 'Georgia', serif";
  const imgUrl = backgroundImageUrl || verse.topic_image;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ fontFamily: font }}>
      <img src={imgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 55%, transparent 70%)' }} />

      <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 sm:px-10 sm:pb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium mb-4" style={{ color: 'rgba(245,215,142,0.55)' }}>
          Versículo do Dia
        </p>
        <p className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" style={{ color: '#FFF8E7' }}>
          "{verse.text}"
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px w-8" style={{ backgroundColor: 'rgba(245,215,142,0.5)' }} />
          <p className="text-xs font-sans font-semibold uppercase tracking-[0.25em]" style={{ color: 'rgba(245,215,142,0.75)' }}>
            {verse.book}
          </p>
        </div>
        <span className="mt-6 text-[7px] uppercase tracking-[0.4em] font-sans font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Palavra Viva
        </span>
      </div>
    </div>
  );
}

/* ── EXPORTED ── */
export const VerseOfDayBanner = forwardRef<HTMLDivElement, Props>(
  ({ verse, aspectRatio, template, fontFamily, textColor, backgroundImageUrl }, ref) => {
    const captureSize = captureSizes[aspectRatio];

    return (
      <div className={`w-full ${aspectClasses[aspectRatio]} mx-auto transition-all duration-500 ease-in-out`}>
        <div
          ref={ref}
          data-capture-width={captureSize.width}
          data-capture-height={captureSize.height}
          className="relative h-full w-full overflow-hidden rounded-2xl select-none isolate shadow-xl"
        >
          {template === 'editorial' && <EditorialVerse verse={verse} fontFamily={fontFamily} textColor={textColor} backgroundImageUrl={backgroundImageUrl} />}
          {template === 'swiss' && <SwissVerse verse={verse} fontFamily={fontFamily} textColor={textColor} />}
          {template === 'cinematic' && <CinematicVerse verse={verse} fontFamily={fontFamily} backgroundImageUrl={backgroundImageUrl} />}
        </div>
      </div>
    );
  }
);

VerseOfDayBanner.displayName = 'VerseOfDayBanner';
