import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type L = 'PT' | 'EN' | 'ES';

interface DevotionalShareArtProps {
  title: string;
  category?: string;
  verseText?: string;
  verseReference?: string;
  bibleVersion?: string;
  imageUrl: string;
  formattedDate: string;
  exportMode?: boolean;
  className?: string;
  lang: L;
}

function getTitleSize(title: string, exportMode: boolean) {
  if (exportMode) {
    if (title.length > 60) return 68;
    if (title.length > 38) return 82;
    return 94;
  }

  if (title.length > 60) return '1.9rem';
  if (title.length > 38) return '2.25rem';
  return '2.6rem';
}

function getVerseSize(verseText: string, exportMode: boolean) {
  if (exportMode) {
    if (verseText.length > 260) return 34;
    if (verseText.length > 190) return 40;
    if (verseText.length > 130) return 46;
    return 54;
  }

  if (verseText.length > 260) return '1.05rem';
  if (verseText.length > 190) return '1.18rem';
  if (verseText.length > 130) return '1.35rem';
  return '1.55rem';
}

export const DevotionalShareArt = forwardRef<HTMLDivElement, DevotionalShareArtProps>(function DevotionalShareArt(
  {
    title,
    category,
    verseText,
    verseReference,
    bibleVersion,
    imageUrl,
    formattedDate,
    exportMode = false,
    className,
    lang,
  },
  ref,
) {
  const titleSize = getTitleSize(title, exportMode);
  const verseSize = getVerseSize(verseText || '', exportMode);
  const verseLabel = lang === 'PT' ? 'Versículo do dia' : lang === 'ES' ? 'Versículo del día' : 'Verse of the day';

  return (
    <div
      ref={ref}
      data-capture-width={exportMode ? '1080' : undefined}
      data-capture-height={exportMode ? '1440' : undefined}
      className={cn(
        'relative overflow-hidden',
        exportMode ? '' : 'w-full max-w-sm aspect-[3/4] rounded-[28px] shadow-lg',
        className,
      )}
      style={
        exportMode
          ? {
              width: '1080px',
              height: '1440px',
              borderRadius: '40px',
              backgroundColor: 'hsl(0 0% 0%)',
            }
          : {
              backgroundColor: 'hsl(0 0% 0%)',
            }
      }
    >
      <img
        src={imageUrl}
        alt={title}
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover"
        loading={exportMode ? 'eager' : 'lazy'}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsla(0, 0%, 0%, 0.18) 0%, hsla(0, 0%, 0%, 0.12) 22%, hsla(0, 0%, 0%, 0.22) 48%, hsla(0, 0%, 0%, 0.58) 74%, hsla(0, 0%, 0%, 0.9) 100%)',
        }}
      />

      <div className="absolute inset-x-0 top-6 flex items-center justify-center px-6">
        <span
          className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{
            color: 'hsla(0, 0%, 100%, 0.92)',
            backgroundColor: 'hsla(0, 0%, 0%, 0.22)',
            border: '1px solid hsla(0, 0%, 100%, 0.28)',
            backdropFilter: 'blur(10px)',
          }}
        >
          Living Word
        </span>
      </div>

      <div className="absolute inset-x-0 top-[10%] px-7 text-center">
        {category && (
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: 'hsla(41, 72%, 82%, 0.98)' }}
          >
            {category}
          </p>
        )}

        <h3
          className="font-playfair font-black leading-[0.95] tracking-tight"
          style={{
            color: 'hsl(0 0% 100%)',
            fontSize: titleSize,
            textShadow: '0 10px 30px hsla(0, 0%, 0%, 0.35)',
          }}
        >
          {title}
        </h3>

        <p
          className="mt-4 text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: 'hsla(0, 0%, 100%, 0.86)' }}
        >
          {formattedDate}
        </p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 px-6 pb-7 pt-24"
        style={{
          background:
            'linear-gradient(180deg, hsla(0, 0%, 0%, 0) 0%, hsla(0, 0%, 0%, 0.18) 18%, hsla(0, 0%, 0%, 0.72) 68%, hsla(0, 0%, 0%, 0.9) 100%)',
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'hsla(41, 72%, 82%, 0.96)' }}
        >
          {verseLabel}
        </p>

        {verseText && (
          <blockquote
            className="mt-3 max-w-[92%] font-serif font-semibold tracking-[-0.02em]"
            style={{
              color: 'hsla(40, 60%, 97%, 0.98)',
              fontSize: verseSize,
              lineHeight: exportMode ? 1.12 : 1.16,
              textShadow: '0 10px 28px hsla(0, 0%, 0%, 0.46)',
            }}
          >
            {verseText}
          </blockquote>
        )}

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            {verseReference && (
              <p className="text-sm font-bold" style={{ color: 'hsla(0, 0%, 100%, 0.96)' }}>
                {verseReference}
              </p>
            )}
            <p className="mt-1 text-[11px]" style={{ color: 'hsla(0, 0%, 100%, 0.7)' }}>
              livingwordgo.com
            </p>
          </div>

          {bibleVersion && (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
              style={{
                color: 'hsla(41, 72%, 90%, 0.98)',
                backgroundColor: 'hsla(0, 0%, 0%, 0.22)',
                border: '1px solid hsla(41, 54%, 69%, 0.46)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {bibleVersion}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});