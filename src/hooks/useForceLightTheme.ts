import { useEffect } from 'react';

/**
 * Forces light theme on specific pages (auth, onboarding, upgrade).
 * Adds 'light' class and removes 'dark' class from <html>,
 * restoring the previous state on unmount.
 */
export function useForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');

    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      root.classList.remove('light');
      if (hadDark) root.classList.add('dark');
    };
  }, []);
}
