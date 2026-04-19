/**
 * Catálogo central de versões bíblicas suportadas pelo Living Word.
 * Fonte única da verdade para Configurações, seletores no Modo Púlpito,
 * geração de conteúdo e comparação inline de versículos.
 */

export type BibleVersionLang = 'PT' | 'EN' | 'ES';

export interface BibleVersion {
  /** Código curto usado no banco e nas edge functions (ex: 'ARA', 'NVI'). */
  code: string;
  /** Idioma nativo da tradução. */
  lang: BibleVersionLang;
  /** Nome curto exibido em badges. */
  short: string;
  /** Nome completo exibido em selects. */
  full: string;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  // Português
  { code: 'ARA',   lang: 'PT', short: 'ARA',   full: 'ARA — Almeida Revista e Atualizada' },
  { code: 'ACF',   lang: 'PT', short: 'ACF',   full: 'ACF — Almeida Corrigida Fiel' },
  { code: 'ARC',   lang: 'PT', short: 'ARC',   full: 'ARC — Almeida Revista e Corrigida' },
  { code: 'NVI',   lang: 'PT', short: 'NVI',   full: 'NVI — Nova Versão Internacional' },
  { code: 'NVT',   lang: 'PT', short: 'NVT',   full: 'NVT — Nova Versão Transformadora' },
  { code: 'NAA',   lang: 'PT', short: 'NAA',   full: 'NAA — Nova Almeida Atualizada' },
  { code: 'NTLH',  lang: 'PT', short: 'NTLH',  full: 'NTLH — Nova Tradução na Linguagem de Hoje' },

  // English
  { code: 'KJV',   lang: 'EN', short: 'KJV',   full: 'KJV — King James Version' },
  { code: 'ESV',   lang: 'EN', short: 'ESV',   full: 'ESV — English Standard Version' },
  { code: 'NIV',   lang: 'EN', short: 'NIV',   full: 'NIV — New International Version' },
  { code: 'NASB',  lang: 'EN', short: 'NASB',  full: 'NASB — New American Standard Bible' },
  { code: 'NLT',   lang: 'EN', short: 'NLT',   full: 'NLT — New Living Translation' },
  { code: 'NKJV',  lang: 'EN', short: 'NKJV',  full: 'NKJV — New King James Version' },

  // Español
  { code: 'RVR60', lang: 'ES', short: 'RVR60', full: 'RVR60 — Reina-Valera 1960' },
  { code: 'RVC',   lang: 'ES', short: 'RVC',   full: 'RVC — Reina-Valera Contemporánea' },
  { code: 'NTV',   lang: 'ES', short: 'NTV',   full: 'NTV — Nueva Traducción Viviente' },
  { code: 'NVI-ES', lang: 'ES', short: 'NVI',  full: 'NVI — Nueva Versión Internacional (ES)' },
  { code: 'DHH',   lang: 'ES', short: 'DHH',   full: 'DHH — Dios Habla Hoy' },
];

/** Default extra versions to compare when the user hasn't picked any. */
export const DEFAULT_COMPARE_VERSIONS: Record<BibleVersionLang, [string, string]> = {
  PT: ['NVI', 'ACF'],
  EN: ['ESV', 'NIV'],
  ES: ['NVI-ES', 'NTV'],
};

export function getVersionByCode(code: string | null | undefined): BibleVersion | null {
  if (!code) return null;
  return BIBLE_VERSIONS.find((v) => v.code.toLowerCase() === code.toLowerCase()) ?? null;
}

export function getVersionLabel(code: string | null | undefined): string {
  return getVersionByCode(code)?.short ?? (code || '—');
}
