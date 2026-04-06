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
}

const aspectClasses: Record<AspectRatio, string> = {
  '9:16': 'aspect-[9/16] max-w-[360px]',
  '4:5': 'aspect-[4/5] max-w-[440px]',
  '1:1': 'aspect-square max-w-[480px]',
};

export const VerseOfDayBanner = forwardRef<HTMLDivElement, Props>(
  ({ verse, aspectRatio }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative w-full ${aspectClasses[aspectRatio]} mx-auto overflow-hidden rounded-2xl select-none`}
        style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
      >
        {/* Background image */}
        <img
          src={verse.topic_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />

        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        {/* Soft vignette */}
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px 30px rgba(0,0,0,0.4)' }} />

        {/* Top decorative element */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="text-amber-300/70 text-2xl">✦</div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-10 sm:px-12 py-16 text-center">
          {/* Label */}
          <p className="text-amber-300/80 text-[10px] sm:text-xs tracking-[0.4em] uppercase font-sans mb-6">
            Versículo do Dia
          </p>

          {/* Verse text */}
          <p className="text-white text-lg sm:text-xl md:text-2xl font-semibold leading-[1.6] tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            "{verse.text}"
          </p>

          {/* Decorative separator */}
          <div className="flex items-center gap-3 mt-8">
            <div className="w-8 h-px bg-amber-400/40" />
            <div className="text-amber-400/50 text-xs">✝</div>
            <div className="w-8 h-px bg-amber-400/40" />
          </div>

          {/* Book reference */}
          <p className="mt-4 text-amber-200/90 text-sm sm:text-base font-medium tracking-[0.2em] uppercase font-sans">
            {verse.book}
          </p>
        </div>

        {/* Bottom watermark */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="text-[8px] text-white/20 tracking-[0.4em] uppercase font-sans">
            Palavra Viva
          </span>
        </div>
      </div>
    );
  }
);

VerseOfDayBanner.displayName = 'VerseOfDayBanner';
