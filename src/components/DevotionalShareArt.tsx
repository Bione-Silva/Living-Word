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
    if (verseText.length > 260) return 38;
    if (verseText.length > 190) return 44;
    if (verseText.length > 130) return 50;
    return 58;
  }

  if (verseText.length > 260) return '1.2rem';
  if (verseText.length > 190) return '1.35rem';
  if (verseText.length > 130) return '1.5rem';
  return '1.7rem';
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
            'linear-gradient(180deg, hsla(0, 0%, 0%, 0.28) 0%, hsla(0, 0%, 0%, 0.18) 24%, hsla(0, 0%, 0%, 0.22) 52%, hsla(0, 0%, 0%, 0.52) 76%, hsla(0, 0%, 0%, 0.72) 100%)',
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
        className="absolute inset-x-5 bottom-5 rounded-[30px] border px-5 py-5"
        style={{
          backgroundColor: 'hsla(41, 46%, 95%, 0.94)',
          borderColor: 'hsla(35, 26%, 62%, 0.6)',
          boxShadow: '0 20px 60px hsla(0, 0%, 0%, 0.18)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'hsl(34 39% 44%)' }}
        >
          {verseLabel}
        </p>

        {verseText && (
          <blockquote
            className="mt-3 font-serif font-semibold tracking-[-0.02em]"
            style={{
              color: 'hsl(24 30% 16%)',
              fontSize: verseSize,
              lineHeight: exportMode ? 1.08 : 1.12,
            }}
          >
            {verseText}
          </blockquote>
        )}

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            {verseReference && (
              <p className="text-sm font-bold" style={{ color: 'hsl(24 30% 18%)' }}>
                {verseReference}
              </p>
            )}
            <p className="mt-1 text-[11px]" style={{ color: 'hsl(24 18% 38%)' }}>
              livingwordgo.com
            </p>
          </div>

          {bibleVersion && (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
              style={{
                color: 'hsl(24 30% 18%)',
                backgroundColor: 'hsla(41, 58%, 84%, 0.72)',
                border: '1px solid hsla(35, 28%, 58%, 0.45)',
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