/**
 * Parse a bible:// URI or a localized Bible reference string into structured data.
 *
 * Supports:
 *   bible://Galatas/5/22-23
 *   bible://Tito/2/11-14
 *   "Gálatas 5:22-23"
 *   "Tito 2:11-14 (ARA)"
 *   "John 14:27 (ESV)"
 *   "1 João 3:16"
 */

import { bibleBooks, ptNames, esNames } from './bible-data';

export interface ParsedBibleRef {
  bookId: string;       // internal id like 'Titus', 'Galatians'
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  version?: string;     // e.g. 'ARA', 'NVI', 'ESV'
}

// Build reverse maps: localized name → internal id
const reverseMap: Record<string, string> = {};

// English ids are the canonical keys
for (const b of bibleBooks) {
  reverseMap[b.id.toLowerCase()] = b.id;
}

// Portuguese names
for (const [id, name] of Object.entries(ptNames)) {
  reverseMap[name.toLowerCase()] = id;
  // Also without accents
  reverseMap[name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] = id;
}

// Spanish names
for (const [id, name] of Object.entries(esNames)) {
  reverseMap[name.toLowerCase()] = id;
  reverseMap[name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] = id;
}

// Common aliases that the AI might use
const aliases: Record<string, string> = {
  'gn': 'Genesis', 'ex': 'Exodus', 'lv': 'Leviticus', 'nm': 'Numbers',
  'dt': 'Deuteronomy', 'js': 'Joshua', 'jz': 'Judges', 'rt': 'Ruth',
  'sl': 'Psalms', 'pv': 'Proverbs', 'ec': 'Ecclesiastes',
  'is': 'Isaiah', 'jr': 'Jeremiah', 'lm': 'Lamentations',
  'ez': 'Ezekiel', 'dn': 'Daniel', 'os': 'Hosea',
  'jl': 'Joel', 'am': 'Amos', 'ob': 'Obadiah', 'jn': 'Jonah',
  'mq': 'Micah', 'na': 'Nahum', 'hc': 'Habakkuk', 'sf': 'Zephaniah',
  'ag': 'Haggai', 'zc': 'Zechariah', 'ml': 'Malachi',
  'mt': 'Matthew', 'mc': 'Mark', 'lc': 'Luke', 'jo': 'John',
  'at': 'Acts', 'rm': 'Romans', 'gl': 'Galatians', 'ef': 'Ephesians',
  'fp': 'Philippians', 'cl': 'Colossians', 'tt': 'Titus', 'fm': 'Philemon',
  'hb': 'Hebrews', 'tg': 'James', 'jd': 'Jude', 'ap': 'Revelation',
  // Portuguese full without accents
  'galatas': 'Galatians', 'efesios': 'Ephesians', 'filipenses': 'Philippians',
  'colossenses': 'Colossians', 'tito': 'Titus', 'filemom': 'Philemon',
  'hebreus': 'Hebrews', 'tiago': 'James', 'judas': 'Jude', 'apocalipse': 'Revelation',
  'genesis': 'Genesis', 'exodo': 'Exodus', 'levitico': 'Leviticus', 'numeros': 'Numbers',
  'deuteronomio': 'Deuteronomy', 'josue': 'Joshua', 'juizes': 'Judges', 'rute': 'Ruth',
  'esdras': 'Ezra', 'neemias': 'Nehemiah', 'ester': 'Esther', 'job': 'Job',
  'salmos': 'Psalms', 'proverbios': 'Proverbs', 'eclesiastes': 'Ecclesiastes',
  'canticos': 'Song of Solomon', 'isaias': 'Isaiah', 'jeremias': 'Jeremiah',
  'lamentacoes': 'Lamentations', 'ezequiel': 'Ezekiel', 'oseias': 'Hosea',
  'jonas': 'Jonah', 'miqueias': 'Micah', 'naum': 'Nahum', 'habacuque': 'Habakkuk',
  'sofonias': 'Zephaniah', 'ageu': 'Haggai', 'zacarias': 'Zechariah', 'malaquias': 'Malachi',
  'mateus': 'Matthew', 'marcos': 'Mark', 'lucas': 'Luke', 'joao': 'John',
  'atos': 'Acts', 'romanos': 'Romans',
  '1 samuel': '1 Samuel', '2 samuel': '2 Samuel',
  '1 reis': '1 Kings', '2 reis': '2 Kings',
  '1 cronicas': '1 Chronicles', '2 cronicas': '2 Chronicles',
  '1 corintios': '1 Corinthians', '2 corintios': '2 Corinthians',
  '1 tessalonicenses': '1 Thessalonians', '2 tessalonicenses': '2 Thessalonians',
  '1 timoteo': '1 Timothy', '2 timoteo': '2 Timothy',
  '1 pedro': '1 Peter', '2 pedro': '2 Peter',
  '1 joao': '1 John', '2 joao': '2 John', '3 joao': '3 John',
  // Spanish
  'mateo': 'Matthew', 'juan': 'John', 'hechos': 'Acts',
  'santiago': 'James',
};

for (const [alias, id] of Object.entries(aliases)) {
  reverseMap[alias] = id;
}

function resolveBookId(rawBook: string): string | null {
  const normalized = rawBook.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (reverseMap[normalized]) return reverseMap[normalized];
  
  // Try prefix matching for longer names
  for (const [key, id] of Object.entries(reverseMap)) {
    if (key.startsWith(normalized) && normalized.length >= 3) return id;
  }
  return null;
}

/**
 * Parse a bible:// URI path like "Galatas/5/22-23" or "Tito/2/11-14"
 */
export function parseBibleUri(uriPath: string): ParsedBibleRef | null {
  // uriPath = "Galatas/5/22-23" or "Tito/2/11-14" or "John/14/27"
  const parts = uriPath.split('/');
  if (parts.length < 2) return null;

  // Book might have multiple parts: "1/Samuel/3/16" or just "John/3/16"
  // Strategy: try from the end. Last part might be "22-23", second to last is chapter, rest is book.
  let verseStr: string | undefined;
  let chapterStr: string;
  let bookParts: string[];

  if (parts.length >= 3 && /^\d+(-\d+)?$/.test(parts[parts.length - 1])) {
    // Last part is verse(s), second-to-last is chapter
    verseStr = parts[parts.length - 1];
    chapterStr = parts[parts.length - 2];
    bookParts = parts.slice(0, parts.length - 2);
  } else if (parts.length >= 2) {
    // Last part is chapter
    chapterStr = parts[parts.length - 1];
    bookParts = parts.slice(0, parts.length - 1);
    verseStr = undefined;
  } else {
    return null;
  }

  const rawBook = bookParts.join(' ');
  const bookId = resolveBookId(rawBook);
  if (!bookId) return null;

  const chapter = parseInt(chapterStr, 10);
  if (isNaN(chapter)) return null;

  let verseStart: number | undefined;
  let verseEnd: number | undefined;
  if (verseStr) {
    const [s, e] = verseStr.split('-');
    verseStart = parseInt(s, 10);
    verseEnd = e ? parseInt(e, 10) : undefined;
  }

  return { bookId, chapter, verseStart, verseEnd };
}

/**
 * Parse a localized Bible reference string like "Gálatas 5:22-23 (ARA)"
 */
export function parseBibleRefString(ref: string): ParsedBibleRef | null {
  // Extract version if present: "(ARA)", "(NVI)", etc.
  let version: string | undefined;
  const versionMatch = ref.match(/\(([^)]+)\)\s*$/);
  if (versionMatch) {
    version = versionMatch[1].trim();
    ref = ref.replace(versionMatch[0], '').trim();
  }

  // Match: "Book Chapter:Verse-End" or "Book Chapter:Verse"
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (m) {
    const bookId = resolveBookId(m[1]);
    if (!bookId) return null;
    return {
      bookId,
      chapter: parseInt(m[2], 10),
      verseStart: parseInt(m[3], 10),
      verseEnd: m[4] ? parseInt(m[4], 10) : undefined,
      version,
    };
  }

  // Match: "Book Chapter" (no verse)
  const m2 = ref.match(/^(.+?)\s+(\d+)$/);
  if (m2) {
    const bookId = resolveBookId(m2[1]);
    if (!bookId) return null;
    return { bookId, chapter: parseInt(m2[2], 10), version };
  }

  return null;
}
