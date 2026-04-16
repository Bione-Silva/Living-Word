import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Language, detectLanguage, t as translate } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  /** Monotonically increasing counter that bumps on every language change.
   *  Use as a React `key` on wrappers that need to fully remount. */
  langVersion: number;
}

const LANGUAGE_STORAGE_KEY = 'living-word-language';
const LANGUAGE_VALUES: Language[] = ['PT', 'EN', 'ES'];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'PT';

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && LANGUAGE_VALUES.includes(stored as Language)) {
    return stored as Language;
  }

  return detectLanguage();
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangInternal] = useState<Language>(getInitialLanguage);
  const [langVersion, setLangVersion] = useState(0);

  const setLang = useCallback((next: Language) => {
    setLangInternal((prev) => {
      if (prev === next) return prev;
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      setLangVersion((v) => v + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Update the html lang attribute for accessibility / SEO
    document.documentElement.lang = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es' : 'en';
  }, [lang]);

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langVersion }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
