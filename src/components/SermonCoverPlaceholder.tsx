import { Mic } from 'lucide-react';

interface SermonCoverPlaceholderProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Watercolor-style placeholder used in the Library when a sermon has no cover image.
 * Pure CSS (radial + linear gradients) to evoke an organic, painterly feel without
 * loading any external asset. Subtle paper grain via SVG noise filter.
 */
export function SermonCoverPlaceholder({ className = '', iconClassName = '' }: SermonCoverPlaceholderProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(ellipse at 25% 30%, hsl(35 55% 82% / 0.95) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 70%, hsl(28 50% 76% / 0.85) 0%, transparent 60%),
          radial-gradient(ellipse at 50% 100%, hsl(20 40% 70% / 0.6) 0%, transparent 70%),
          linear-gradient(135deg, hsl(38 60% 90%) 0%, hsl(30 45% 82%) 100%)
        `,
      }}
    >
      {/* Watercolor wash layer */}
      <div
        className="absolute inset-0 opacity-50 mix-blend-multiply"
        style={{
          background: `
            radial-gradient(circle at 15% 85%, hsl(15 45% 65% / 0.4), transparent 40%),
            radial-gradient(circle at 85% 20%, hsl(45 60% 75% / 0.5), transparent 45%)
          `,
        }}
      />

      {/* Subtle paper grain via SVG noise */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18] mix-blend-overlay" aria-hidden="true">
        <filter id="sermon-cover-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.6 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sermon-cover-noise)" />
      </svg>

      {/* Mic icon — soft circular vignette behind */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 -m-6 rounded-full opacity-70 blur-xl"
          style={{ background: 'radial-gradient(circle, hsl(38 70% 92% / 0.9), transparent 70%)' }}
        />
        <Mic
          className={`relative drop-shadow-sm ${iconClassName || 'h-10 w-10'}`}
          style={{ color: 'hsl(25 40% 35%)', strokeWidth: 1.5 }}
        />
      </div>
    </div>
  );
}
