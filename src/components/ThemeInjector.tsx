import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Maps theme_color names from the wizard to HSL values for --primary injection.
 */
/**
 * NOTE: With the new Purple identity, the global --primary token IS the brand.
 * We no longer override --primary from the user profile theme_color to avoid
 * breaking the unified palette. Only the font_family is injected dynamically.
 */
const COLOR_MAP: Record<string, string> = {};

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
 * Injects the user's selected theme_color and font_family as CSS custom properties
 * on the document root, enabling dynamic theming across the authenticated app.
 */
export function ThemeInjector() {
  const { profile } = useAuth();

  useEffect(() => {
    const root = document.documentElement;

    // Primary color is now globally fixed to the Purple brand identity.
    // (theme_color from profile is intentionally ignored.)

    // Inject font family
    const fontKey = profile?.font_family || 'cormorant';
    const fontStack = FONT_MAP[fontKey];
    if (fontStack) {
      root.style.setProperty('--font-display', fontStack);
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--font-display');
    };
  }, [profile?.theme_color, profile?.font_family]);

  return null;
}
