import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Maps theme_color names from the wizard to HSL values for --primary injection.
 */
const COLOR_MAP: Record<string, string> = {
  amber: '36 64% 57%',
  blue: '217 91% 60%',
  green: '142 71% 45%',
  purple: '262 83% 58%',
  rose: '350 89% 60%',
  teal: '173 80% 40%',
  indigo: '239 84% 67%',
  orange: '25 95% 53%',
};

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

    // Inject primary color
    const colorKey = profile?.theme_color || 'amber';
    const hsl = COLOR_MAP[colorKey];
    if (hsl) {
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
    }

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
