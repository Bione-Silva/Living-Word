import { forwardRef } from 'react';
import { ChevronRight, MessageCircle, Repeat2, Heart, BarChart3, BadgeCheck } from 'lucide-react';
import type { SlideData } from './SlideCanvas';

export type ArtStyle = 'instagram' | 'x-thread';

interface Props {
  slide: SlideData;
  index: number;
  totalSlides: number;
  artStyle: ArtStyle;
  /** Profile info for X Thread mode */
  profileName?: string;
  profileHandle?: string;
  profileAvatar?: string;
  /** Church / brand name for CTA slide */
  brandName?: string;
  lang: 'PT' | 'EN' | 'ES';
}

const CTA_LABELS = {
  PT: 'Compartilhe ✦',
  EN: 'Share ✦',
  ES: 'Comparte ✦',
};

/* ── Helpers ── */
function isDark(index: number, artStyle: ArtStyle) {
  if (artStyle === 'x-thread') return false; // X mode always light base
  return index % 2 === 1; // Instagram alternates light/dark
}

function ProgressBar({ index, total, dark }: { index: number; total: number; dark: boolean }) {
  const pct = ((index + 1) / total) * 100;
  return (
    <div className="absolute bottom-0 left-0 w-full px-7 pb-5 z-10">
      <div className={`h-[3px] w-full rounded-sm ${dark ? 'bg-white/10' : 'bg-black/10'}`}>
        <div
          className="h-full rounded-sm bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className="block mt-1.5 text-right font-sans"
        style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }}
      >
        {index + 1} / {total}
      </span>
    </div>
  );
}

function SwipeChevron({ dark }: { dark: boolean }) {
  return (
    <div className="absolute right-0 inset-y-0 w-12 flex items-center justify-center z-10 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: dark
            ? 'linear-gradient(to left, rgba(255,255,255,0.06), transparent)'
            : 'linear-gradient(to left, rgba(0,0,0,0.04), transparent)',
        }}
      />
      <ChevronRight
        className="relative"
        size={22}
        style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)' }}
      />
    </div>
  );
}

function XThreadHeader({ name, handle, avatar }: { name: string; handle: string; avatar?: string }) {
  return (
    <div className="px-9 pt-6 pb-3">
      <div className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-sans font-bold text-sm text-gray-900">{name}</span>
            <BadgeCheck size={16} className="text-blue-500" />
          </div>
          <span className="font-sans text-xs text-gray-500">@{handle}</span>
        </div>
      </div>
      <hr className="mt-3 border-gray-100" />
    </div>
  );
}

function XThreadFooter({ index, total }: { index: number; total: number }) {
  return (
    <div className="absolute bottom-0 left-0 w-full px-9 pb-5 z-10">
      <hr className="mb-3 border-gray-100" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          {[
            { Icon: MessageCircle, count: '124' },
            { Icon: Repeat2, count: '2.3k' },
            { Icon: Heart, count: '18.4k' },
            { Icon: BarChart3, count: '89k' },
          ].map(({ Icon, count }, i) => (
            <div key={i} className="flex items-center gap-1 text-gray-400">
              <Icon size={15} />
              <span className="text-[11px] font-sans">{count}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] font-sans font-medium text-gray-300 bg-gray-50 rounded-full px-2 py-0.5">
          {index + 1}/{total}
        </span>
      </div>
    </div>
  );
}

function CTASlide({ brandName, dark, lang }: { brandName: string; dark: boolean; lang: 'PT' | 'EN' | 'ES' }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      {/* Brand circle */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold font-sans shadow-lg"
        style={{
          backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color: dark ? '#fff' : '#1a1a1a',
        }}
      >
        {brandName.charAt(0)}
      </div>
      <span
        className="font-sans font-semibold text-sm tracking-wide"
        style={{ color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
      >
        {brandName}
      </span>
      <span className="rounded-full bg-primary text-white px-6 py-2 text-sm font-sans font-bold shadow-md">
        {CTA_LABELS[lang]}
      </span>
    </div>
  );
}

export const SlideCard = forwardRef<HTMLDivElement, Props>(
  ({ slide, index, totalSlides, artStyle, profileName, profileHandle, profileAvatar, brandName, lang }, ref) => {
    const dark = isDark(index, artStyle);
    const isLast = index === totalSlides - 1;
    const isXMode = artStyle === 'x-thread';

    const bgColor = isXMode ? '#FFFFFF' : dark ? '#121212' : '#FAFAFA';
    const textColor = isXMode ? '#0f1419' : dark ? '#FAFAFA' : '#121212';
    const subtitleColor = isXMode ? '#536471' : dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

    return (
      <div
        ref={ref}
        data-capture-width={1080}
        data-capture-height={1350}
        className="w-[420px] h-[525px] shrink-0 snap-center relative overflow-hidden select-none"
        style={{ backgroundColor: bgColor }}
      >
        {/* X Thread Header */}
        {isXMode && (
          <XThreadHeader
            name={profileName || 'Pastor'}
            handle={profileHandle || 'seuministério'}
            avatar={profileAvatar}
          />
        )}

        {/* Main content area */}
        {isLast && totalSlides > 1 ? (
          <CTASlide brandName={brandName || profileName || 'Living Word'} dark={dark} lang={lang} />
        ) : (
          <div
            className="flex flex-col justify-center h-full"
            style={{ padding: isXMode ? '0 2.25rem 4rem 2.25rem' : '2.5rem 2.25rem 4rem 2.25rem' }}
          >
            {/* Title / verse text */}
            <p
              className="text-xl font-semibold leading-relaxed tracking-tight"
              style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontWeight: 600,
                color: textColor,
              }}
            >
              {slide.text}
            </p>

            {/* Subtitle / reference */}
            {slide.subtitle && (
              <p
                className="mt-4 text-sm font-medium leading-relaxed"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontWeight: 400,
                  color: subtitleColor,
                }}
              >
                — {slide.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Footer elements */}
        {isXMode ? (
          <XThreadFooter index={index} total={totalSlides} />
        ) : (
          <ProgressBar index={index} total={totalSlides} dark={dark} />
        )}

        {/* Swipe chevron (not on last slide) */}
        {!isLast && !isXMode && <SwipeChevron dark={dark} />}
      </div>
    );
  }
);

SlideCard.displayName = 'SlideCard';
