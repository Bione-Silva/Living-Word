import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * The authenticated app follows the fixed Warm Parchment palette from the
 * project design system. User profile theme colors must not override it.
 */

/**
 * Maps font_family names from the wizard to CSS font-family stacks.
 */
const FONT_MAP: Record<string, string> = {
  cormorant: "'Cormorant Garamond', serif",
  playfair: "'Playfair Display', serif",
  merriweather: "'Merriweather', serif",
  lora: "'Lora', serif",
  inter: "'Inter', sans-serif",
  dm_sans: "'DM Sans', sans-serif",
  montserrat: "'Montserrat', sans-serif",
};

/**
 * Injects only typography custom properties while preserving the fixed app palette.
 */
export function ThemeInjector() {
  const { profile } = useAuth();

  useEffect(() => {
    const root = document.documentElement;

    // The authenticated palette is fixed by the design system.
    // profile.theme_color is intentionally ignored here.

    // Inject font family
    const fontKey = profile?.font_family || 'cormorant';
    const fontStack = FONT_MAP[fontKey];
    if (fontStack) {
      root.style.setProperty('--font-display', fontStack);
    }

    return () => {
      root.style.removeProperty('--font-display');
    };
  }, [profile?.theme_color, profile?.font_family]);

  return null;
}
