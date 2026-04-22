export type L = 'PT' | 'EN' | 'ES';

export const bibleBooks = [
  { id: 'Genesis', chapters: 50 }, { id: 'Exodus', chapters: 40 }, { id: 'Leviticus', chapters: 27 },
  { id: 'Numbers', chapters: 36 }, { id: 'Deuteronomy', chapters: 34 }, { id: 'Joshua', chapters: 24 },
  { id: 'Judges', chapters: 21 }, { id: 'Ruth', chapters: 4 }, { id: '1 Samuel', chapters: 31 },
  { id: '2 Samuel', chapters: 24 }, { id: '1 Kings', chapters: 22 }, { id: '2 Kings', chapters: 25 },
  { id: '1 Chronicles', chapters: 29 }, { id: '2 Chronicles', chapters: 36 }, { id: 'Ezra', chapters: 10 },
  { id: 'Nehemiah', chapters: 13 }, { id: 'Esther', chapters: 10 }, { id: 'Job', chapters: 42 },
  { id: 'Psalms', chapters: 150 }, { id: 'Proverbs', chapters: 31 }, { id: 'Ecclesiastes', chapters: 12 },
  { id: 'Song of Solomon', chapters: 8 }, { id: 'Isaiah', chapters: 66 }, { id: 'Jeremiah', chapters: 52 },
  { id: 'Lamentations', chapters: 5 }, { id: 'Ezekiel', chapters: 48 }, { id: 'Daniel', chapters: 12 },
  { id: 'Hosea', chapters: 14 }, { id: 'Joel', chapters: 3 }, { id: 'Amos', chapters: 9 },
  { id: 'Obadiah', chapters: 1 }, { id: 'Jonah', chapters: 4 }, { id: 'Micah', chapters: 7 },
  { id: 'Nahum', chapters: 3 }, { id: 'Habakkuk', chapters: 3 }, { id: 'Zephaniah', chapters: 3 },
  { id: 'Haggai', chapters: 2 }, { id: 'Zechariah', chapters: 14 }, { id: 'Malachi', chapters: 4 },
  { id: 'Matthew', chapters: 28 }, { id: 'Mark', chapters: 16 }, { id: 'Luke', chapters: 24 },
  { id: 'John', chapters: 21 }, { id: 'Acts', chapters: 28 }, { id: 'Romans', chapters: 16 },
  { id: '1 Corinthians', chapters: 16 }, { id: '2 Corinthians', chapters: 13 }, { id: 'Galatians', chapters: 6 },
  { id: 'Ephesians', chapters: 6 }, { id: 'Philippians', chapters: 4 }, { id: 'Colossians', chapters: 4 },
  { id: '1 Thessalonians', chapters: 5 }, { id: '2 Thessalonians', chapters: 3 }, { id: '1 Timothy', chapters: 6 },
  { id: '2 Timothy', chapters: 4 }, { id: 'Titus', chapters: 3 }, { id: 'Philemon', chapters: 1 },
  { id: 'Hebrews', chapters: 13 }, { id: 'James', chapters: 5 }, { id: '1 Peter', chapters: 5 },
  { id: '2 Peter', chapters: 3 }, { id: '1 John', chapters: 5 }, { id: '2 John', chapters: 1 },
  { id: '3 John', chapters: 1 }, { id: 'Jude', chapters: 1 }, { id: 'Revelation', chapters: 22 },
];

export const ptNames: Record<string, string> = {
  'Genesis': 'Gênesis', 'Exodus': 'Êxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números',
  'Deuteronomy': 'Deuteronômio', 'Joshua': 'Josué', 'Judges': 'Juízes', 'Ruth': 'Rute',
  '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel', '1 Kings': '1 Reis', '2 Kings': '2 Reis',
  '1 Chronicles': '1 Crônicas', '2 Chronicles': '2 Crônicas', 'Ezra': 'Esdras', 'Nehemiah': 'Neemias',
  'Esther': 'Ester', 'Job': 'Jó', 'Psalms': 'Salmos', 'Proverbs': 'Provérbios',
  'Ecclesiastes': 'Eclesiastes', 'Song of Solomon': 'Cânticos', 'Isaiah': 'Isaías', 'Jeremiah': 'Jeremias',
  'Lamentations': 'Lamentações', 'Ezekiel': 'Ezequiel', 'Daniel': 'Daniel', 'Hosea': 'Oséias',
  'Joel': 'Joel', 'Amos': 'Amós', 'Obadiah': 'Obadias', 'Jonah': 'Jonas', 'Micah': 'Miquéias',
  'Nahum': 'Naum', 'Habakkuk': 'Habacuque', 'Zephaniah': 'Sofonias', 'Haggai': 'Ageu',
  'Zechariah': 'Zacarias', 'Malachi': 'Malaquias', 'Matthew': 'Mateus', 'Mark': 'Marcos',
  'Luke': 'Lucas', 'John': 'João', 'Acts': 'Atos', 'Romans': 'Romanos',
  '1 Corinthians': '1 Coríntios', '2 Corinthians': '2 Coríntios', 'Galatians': 'Gálatas',
  'Ephesians': 'Efésios', 'Philippians': 'Filipenses', 'Colossians': 'Colossenses',
  '1 Thessalonians': '1 Tessalonicenses', '2 Thessalonians': '2 Tessalonicenses',
  '1 Timothy': '1 Timóteo', '2 Timothy': '2 Timóteo', 'Titus': 'Tito', 'Philemon': 'Filemom',
  'Hebrews': 'Hebreus', 'James': 'Tiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro',
  '1 John': '1 João', '2 John': '2 João', '3 John': '3 João', 'Jude': 'Judas', 'Revelation': 'Apocalipse',
};

export const esNames: Record<string, string> = {
  'Genesis': 'Génesis', 'Exodus': 'Éxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio', 'Joshua': 'Josué', 'Judges': 'Jueces', 'Ruth': 'Rut',
  '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel', '1 Kings': '1 Reyes', '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas', '2 Chronicles': '2 Crónicas', 'Ezra': 'Esdras', 'Nehemiah': 'Nehemías',
  'Esther': 'Ester', 'Job': 'Job', 'Psalms': 'Salmos', 'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastés', 'Song of Solomon': 'Cantares', 'Isaiah': 'Isaías', 'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones', 'Ezekiel': 'Ezequiel', 'Daniel': 'Daniel', 'Hosea': 'Oseas',
  'Joel': 'Joel', 'Amos': 'Amós', 'Obadiah': 'Abdías', 'Jonah': 'Jonás', 'Micah': 'Miqueas',
  'Nahum': 'Nahúm', 'Habakkuk': 'Habacuc', 'Zephaniah': 'Sofonías', 'Haggai': 'Hageo',
  'Zechariah': 'Zacarías', 'Malachi': 'Malaquías', 'Matthew': 'Mateo', 'Mark': 'Marcos',
  'Luke': 'Lucas', 'John': 'Juan', 'Acts': 'Hechos', 'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios', '2 Corinthians': '2 Corintios', 'Galatians': 'Gálatas',
  'Ephesians': 'Efesios', 'Philippians': 'Filipenses', 'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses', '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo', '2 Timothy': '2 Timoteo', 'Titus': 'Tito', 'Philemon': 'Filemón',
  'Hebrews': 'Hebreos', 'James': 'Santiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro',
  '1 John': '1 Juan', '2 John': '2 Juan', '3 John': '3 Juan', 'Jude': 'Judas', 'Revelation': 'Apocalipsis',
};

export function getBookName(id: string, lang: L): string {
  if (lang === 'PT') return ptNames[id] || id;
  if (lang === 'ES') return esNames[id] || id;
  return id;
}

/**
 * Bolls.life uses numeric book IDs (1=Genesis ... 66=Revelation, canonical Protestant order).
 */
export const bollsBookNumber: Record<string, number> = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
  'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
  'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
  'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
  'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47,
  'Galatians': 48, 'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
  '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54, '2 Timothy': 55,
  'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59, '1 Peter': 60,
  '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66,
};

/**
 * Returns the book name for use with bible-api.com (legacy fallback).
 * Bolls uses numeric IDs and does NOT need this.
 */
export function getApiBookName(id: string, versionCode: string): string {
  const apiCode = getApiCodeForVersion(versionCode);
  if (apiCode === 'almeida') return ptNames[id] || id;
  return id;
}

/* ── Bible Version System ── */

export interface BibleVersion {
  code: string;
  name: string;
  shortLabel: string;
  language: 'PT' | 'EN' | 'ES';
  /** Source for fetching: 'bolls' (bolls.life) or 'biblapi' (bible-api.com legacy) */
  source: 'bolls' | 'biblapi';
  /** ID for the chosen API */
  apiCode: string;
  isAvailable: boolean;
  isPremium: boolean;
  isDefault?: boolean;
}

/**
 * Catálogo completo de versões.
 * • Português: 7 versões via Bolls.life (ARA, NAA, NVT, NVI-PT, NTLH, ARC09, ACF11)
 * • Inglês: 7 versões via Bolls.life (KJV, NKJV, NIV, ESV, NASB, WEB, YLT)
 * • Espanhol: 6 versões via Bolls.life (RV1960, RV2004, NVI, NTV, LBLA, PDT)
 */
export const bibleVersions: BibleVersion[] = [
  // ── Português ──
  { code: 'ara',    name: 'Almeida Revista e Atualizada',  shortLabel: 'ARA',   language: 'PT', source: 'bolls', apiCode: 'ARA',   isAvailable: true, isPremium: false, isDefault: true },
  { code: 'naa',    name: 'Nova Almeida Atualizada',        shortLabel: 'NAA',   language: 'PT', source: 'bolls', apiCode: 'NAA',   isAvailable: true, isPremium: false },
  { code: 'nvt',    name: 'Nova Versão Transformadora',     shortLabel: 'NVT',   language: 'PT', source: 'bolls', apiCode: 'NVT',   isAvailable: true, isPremium: false },
  { code: 'nvipt',  name: 'Nova Versão Internacional',      shortLabel: 'NVI',   language: 'PT', source: 'bolls', apiCode: 'NVIPT', isAvailable: true, isPremium: false },
  { code: 'ntlh',   name: 'Nova Tradução na Linguagem de Hoje', shortLabel: 'NTLH', language: 'PT', source: 'bolls', apiCode: 'NTLH', isAvailable: true, isPremium: false },
  { code: 'arc09',  name: 'Almeida Revista e Corrigida',    shortLabel: 'ARC',   language: 'PT', source: 'bolls', apiCode: 'ARC09', isAvailable: true, isPremium: false },
  { code: 'acf11',  name: 'Almeida Corrigida Fiel',         shortLabel: 'ACF',   language: 'PT', source: 'bolls', apiCode: 'ACF11', isAvailable: true, isPremium: false },

  // ── Originais ──
  { code: 'orig',   name: 'Texto Original',                 shortLabel: 'ORIG',  language: 'ORIG' as any, source: 'biblapi', apiCode: 'orig', isAvailable: true, isPremium: false },

  // ── Español ──
  { code: 'rv1960', name: 'Reina-Valera 1960',              shortLabel: 'RVR',   language: 'ES', source: 'bolls', apiCode: 'RV1960', isAvailable: true, isPremium: false, isDefault: true },
  { code: 'rv2004', name: 'Reina Valera Gómez',             shortLabel: 'RVG',   language: 'ES', source: 'bolls', apiCode: 'RV2004', isAvailable: true, isPremium: false },
  { code: 'nvi',    name: 'Nueva Versión Internacional',    shortLabel: 'NVI',   language: 'ES', source: 'bolls', apiCode: 'NVI',    isAvailable: true, isPremium: false },
  { code: 'ntv',    name: 'Nueva Traducción Viviente',      shortLabel: 'NTV',   language: 'ES', source: 'bolls', apiCode: 'NTV',    isAvailable: true, isPremium: false },
  { code: 'lbla',   name: 'La Biblia de las Américas',      shortLabel: 'LBLA',  language: 'ES', source: 'bolls', apiCode: 'LBLA',   isAvailable: true, isPremium: false },
  { code: 'pdt',    name: 'Palabra de Dios para Todos',     shortLabel: 'PDT',   language: 'ES', source: 'bolls', apiCode: 'PDT',    isAvailable: true, isPremium: false },

  // ── English ──
  { code: 'kjv',    name: 'King James Version',             shortLabel: 'KJV',   language: 'EN', source: 'bolls', apiCode: 'KJV',    isAvailable: true, isPremium: false, isDefault: true },
  { code: 'nkjv',   name: 'New King James Version',         shortLabel: 'NKJV',  language: 'EN', source: 'bolls', apiCode: 'NKJV',   isAvailable: true, isPremium: false },
  { code: 'niv',    name: 'New International Version',      shortLabel: 'NIV',   language: 'EN', source: 'bolls', apiCode: 'NIV2011',isAvailable: true, isPremium: false },
  { code: 'esv',    name: 'English Standard Version',       shortLabel: 'ESV',   language: 'EN', source: 'bolls', apiCode: 'ESV',    isAvailable: true, isPremium: false },
  { code: 'nasb',   name: 'New American Standard Bible',    shortLabel: 'NASB',  language: 'EN', source: 'bolls', apiCode: 'NASB',   isAvailable: true, isPremium: false },
  { code: 'web',    name: 'World English Bible',            shortLabel: 'WEB',   language: 'EN', source: 'bolls', apiCode: 'WEB',    isAvailable: true, isPremium: false },
  { code: 'ylt',    name: "Young's Literal Translation",    shortLabel: 'YLT',   language: 'EN', source: 'bolls', apiCode: 'YLT',    isAvailable: true, isPremium: false },
];

/** Group versions by language */
export function getVersionsByLanguage(): Record<string, BibleVersion[]> {
  const pt = bibleVersions.filter(v => v.language === 'PT');
  const es = bibleVersions.filter(v => v.language === 'ES');
  const en = bibleVersions.filter(v => v.language === 'EN');
  const orig = bibleVersions.filter(v => v.language === 'ORIG' as any);
  const groups: Record<string, BibleVersion[]> = {};
  
  if (orig.length) groups['Idiomas Originais'] = orig;
  if (pt.length) groups['Português'] = pt;
  if (es.length) groups['Español'] = es;
  if (en.length) groups['English'] = en;
  return groups;
}

/** Versions filtered for the user's language: same-language first, others as secondary. */
export function getVersionsForUserLanguage(userLang: L): { primary: BibleVersion[]; secondary: BibleVersion[] } {
  const primary = bibleVersions.filter(v => v.language === userLang);
  const secondary = bibleVersions.filter(v => v.language !== userLang);
  if (primary.length === 0) {
    const ptVersions = bibleVersions.filter(v => v.language === 'PT');
    const rest = bibleVersions.filter(v => v.language !== 'PT');
    return { primary: ptVersions, secondary: rest };
  }
  return { primary, secondary };
}

/** Get a BibleVersion by code (case-insensitive). */
export function getBibleVersion(code: string): BibleVersion | undefined {
  if (!code) return undefined;
  const lower = code.toLowerCase();
  return bibleVersions.find(v => v.code.toLowerCase() === lower);
}

/** Get the default version code for a language. */
export function getDefaultVersionCode(lang: L): string {
  const v = bibleVersions.find(v => v.language === lang && v.isDefault);
  return v?.code || (lang === 'PT' ? 'ara' : lang === 'ES' ? 'rv1960' : 'kjv');
}

/** Get the API translation code for a version code (used by bible-api.com legacy paths). */
export function getApiCodeForVersion(code: string): string {
  const v = getBibleVersion(code);
  return v?.apiCode || 'web';
}

/** Available translations per language — LEGACY compat */
export const translationOptions: Record<L, { code: string; label: string }[]> = {
  PT: bibleVersions.filter(v => v.language === 'PT').map(v => ({ code: v.code, label: `${v.name} (${v.shortLabel})` })),
  EN: bibleVersions.filter(v => v.language === 'EN').map(v => ({ code: v.code, label: `${v.name} (${v.shortLabel})` })),
  ES: bibleVersions.filter(v => v.language === 'ES').map(v => ({ code: v.code, label: `${v.name} (${v.shortLabel})` })),
};

/** LEGACY — get default translation code for a language */
export function getTranslation(lang: L): string {
  return getDefaultVersionCode(lang);
}

/** LEGACY — get default translation label */
export function getTranslationLabel(lang: L): string {
  const code = getDefaultVersionCode(lang);
  return getTranslationLabelByCode(code);
}

export function getTranslationLabelByCode(code: string): string {
  const v = getBibleVersion(code);
  if (v) return `${v.name} (${v.shortLabel})`;
  return code;
}

/**
 * Map a Bible version abbreviation (from sermon text) to a version code.
 * Returns the internal code (e.g. "ara", "kjv", "rv1960") so the caller can
 * resolve API specifics afterwards.
 */
export function versionToApiCode(version: string): string | null {
  const upper = version.toUpperCase().trim();
  const direct = bibleVersions.find(v => v.shortLabel === upper);
  if (direct) return direct.apiCode;
  return null;
}

/** Map a version abbreviation to the internal version code */
export function versionAbbrToCode(abbr: string): string | null {
  const upper = abbr.toUpperCase().trim();
  const found = bibleVersions.find(v => v.shortLabel === upper);
  return found?.code || null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Unified chapter fetcher                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export interface BibleVerseRow { verse: number; text: string; }

interface FetchOpts {
  bookId: string;
  chapter: number;
  versionCode: string;
  /** User language — used as last-resort fallback if chosen version 404s. */
  fallbackLang: L;
  signal?: AbortSignal;
}

async function tryFetchJson(url: string, signal?: AbortSignal): Promise<any | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {
      // retry
    }
    if (attempt === 0) await new Promise(r => setTimeout(r, 600));
  }
  return null;
}

function cleanVerseText(raw: string): string {
  if (!raw) return '';
  // Strip Strong/H references and HTML tags that some Bolls translations include
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFromBolls(version: BibleVersion, bookId: string, chapter: number, signal?: AbortSignal): Promise<BibleVerseRow[] | null> {
  const bookNum = bollsBookNumber[bookId];
  if (!bookNum) return null;
  const url = `https://bolls.life/get-text/${version.apiCode}/${bookNum}/${chapter}/`;
  const data = await tryFetchJson(url, signal);
  if (!Array.isArray(data) || data.length === 0) return null;
  return data
    .map((v: any) => ({ verse: v.verse, text: cleanVerseText(v.text) }))
    .filter(v => v.verse && v.text);
}

async function fetchFromBibleApi(version: BibleVersion, bookId: string, chapter: number, signal?: AbortSignal): Promise<BibleVerseRow[] | null> {
  const apiBook = version.apiCode === 'almeida' ? (ptNames[bookId] || bookId) : bookId;
  const ref = `${apiBook} ${chapter}`;
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version.apiCode}`;
  const data = await tryFetchJson(url, signal);
  if (!data?.verses) return null;
  return data.verses.map((v: any) => ({ verse: v.verse, text: cleanVerseText(v.text) }));
}

/**
 * Unified Bible chapter fetcher. Routes to the proper backend based on the
 * version's `source`. Falls back to the language's default version if the
 * primary lookup fails (so users always see *something* in their language).
 */
export async function fetchBibleChapter(opts: FetchOpts): Promise<BibleVerseRow[]> {
  const { bookId, chapter, versionCode, fallbackLang, signal } = opts;
  const version = getBibleVersion(versionCode);

  // Primary attempt
  if (version) {
    const fetcher = version.source === 'bolls' ? fetchFromBolls : fetchFromBibleApi;
    const rows = await fetcher(version, bookId, chapter, signal);
    if (rows && rows.length > 0) return rows;
  }

  // Fallback: default version of user's language
  const fallbackCode = getDefaultVersionCode(fallbackLang);
  const fallbackVersion = getBibleVersion(fallbackCode);
  if (fallbackVersion && fallbackVersion.code !== version?.code) {
    const fetcher = fallbackVersion.source === 'bolls' ? fetchFromBolls : fetchFromBibleApi;
    const rows = await fetcher(fallbackVersion, bookId, chapter, signal);
    if (rows && rows.length > 0) return rows;
  }

  return [];
}
