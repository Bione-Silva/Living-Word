/**
 * Detector trilíngue de referências bíblicas inline (PT/EN/ES).
 *
 * Reconhece padrões como:
 *   - João 3:16     | João 3:16-18      | João 3.16
 *   - 1 Coríntios 13:4-7
 *   - John 3:16     | 1 John 4:8
 *   - Juan 3:16     | 1 Juan 4:8
 *   - Sal 23.1      | Mt 5:3-12         | Rom 8:28
 *
 * Usado para destacar referências na cor identitária do bloco
 * (Modo Púlpito, Live Preview e exportações PPTX/PDF).
 */

/** Lista de "stems" de livros bíblicos nos 3 idiomas + abreviações comuns. */
const BOOK_STEMS = [
  // Português (com e sem acento)
  'gen', 'gn', 'gen[eé]sis', 'ex', 'êxodo', 'exodo', 'lv', 'lev[ií]tico',
  'nm', 'n[uú]meros', 'dt', 'deuteron[oô]mio', 'js', 'josu[eé]',
  'jz', 'ju[ií]zes', 'rt', 'rute', '1\\s*sm', '2\\s*sm', '1\\s*samuel', '2\\s*samuel',
  '1\\s*rs', '2\\s*rs', '1\\s*reis', '2\\s*reis',
  '1\\s*cr', '2\\s*cr', '1\\s*cr[oô]nicas', '2\\s*cr[oô]nicas',
  'esdras', 'neemias', 'ester', 'j[oó]', 'jo', 'jó',
  'sl', 'sal', 'salmos?', 'pv', 'pr', 'prov[eé]rbios',
  'ec', 'eclesiastes', 'ct', 'c[aâ]nticos?',
  'is', 'isa[ií]as', 'jr', 'jeremias', 'lm', 'lamenta[cç][oõ]es',
  'ez', 'ezequiel', 'dn', 'daniel',
  'os', 'os[eé]ias', 'jl', 'joel', 'am', 'am[oó]s', 'obadias', 'jonas',
  'mq', 'miqu[eé]ias', 'naum', 'habacuque', 'sofonias', 'ageu', 'zacarias', 'malaquias',
  'mt', 'mateus', 'mc', 'marcos', 'lc', 'lucas', 'jo', 'jo[aã]o',
  'at', 'atos', 'rm', 'rom', 'romanos',
  '1\\s*co', '2\\s*co', '1\\s*cor[ií]ntios', '2\\s*cor[ií]ntios',
  'gl', 'g[aá]latas', 'ef', 'ef[eé]sios', 'fp', 'filipenses', 'cl', 'colossenses',
  '1\\s*ts', '2\\s*ts', '1\\s*tessalonicenses', '2\\s*tessalonicenses',
  '1\\s*tm', '2\\s*tm', '1\\s*tim[oó]teo', '2\\s*tim[oó]teo',
  'tt', 'tito', 'fm', 'filemom',
  'hb', 'hebreus', 'tg', 'tiago',
  '1\\s*pe', '2\\s*pe', '1\\s*pedro', '2\\s*pedro',
  '1\\s*jo', '2\\s*jo', '3\\s*jo', '1\\s*jo[aã]o', '2\\s*jo[aã]o', '3\\s*jo[aã]o',
  'judas', 'ap', 'apocalipse',
  // English
  'gen', 'genesis', 'exodus', 'lev', 'leviticus', 'num', 'numbers',
  'deut', 'deuteronomy', 'josh', 'joshua', 'judg', 'judges', 'ruth',
  '1\\s*sam', '2\\s*sam', '1\\s*samuel', '2\\s*samuel',
  '1\\s*kgs', '2\\s*kgs', '1\\s*kings', '2\\s*kings',
  '1\\s*chr', '2\\s*chr', '1\\s*chronicles', '2\\s*chronicles',
  'ezra', 'neh', 'nehemiah', 'esther', 'job',
  'ps', 'psalm', 'psalms', 'prov', 'proverbs', 'eccl', 'ecclesiastes',
  'song', 'song of solomon', 'isa', 'isaiah', 'jer', 'jeremiah',
  'lam', 'lamentations', 'ezek', 'ezekiel', 'dan', 'daniel',
  'hos', 'hosea', 'joel', 'amos', 'obad', 'obadiah', 'jonah',
  'mic', 'micah', 'nah', 'nahum', 'hab', 'habakkuk',
  'zeph', 'zephaniah', 'hag', 'haggai', 'zech', 'zechariah', 'mal', 'malachi',
  'matt', 'matthew', 'mark', 'luke', 'john',
  'acts', 'rom', 'romans',
  '1\\s*cor', '2\\s*cor', '1\\s*corinthians', '2\\s*corinthians',
  'gal', 'galatians', 'eph', 'ephesians',
  'phil', 'philippians', 'col', 'colossians',
  '1\\s*thess', '2\\s*thess', '1\\s*thessalonians', '2\\s*thessalonians',
  '1\\s*tim', '2\\s*tim', '1\\s*timothy', '2\\s*timothy',
  'titus', 'phlm', 'philemon',
  'heb', 'hebrews', 'jas', 'james',
  '1\\s*pet', '2\\s*pet', '1\\s*peter', '2\\s*peter',
  '1\\s*jn', '2\\s*jn', '3\\s*jn', '1\\s*john', '2\\s*john', '3\\s*john',
  'jude', 'rev', 'revelation',
  // Español
  'g[eé]nesis', '[eé]xodo', 'lev[ií]tico', 'n[uú]meros', 'deuteronomio',
  'josu[eé]', 'jueces', 'rut',
  '1\\s*samuel', '2\\s*samuel', '1\\s*reyes', '2\\s*reyes',
  '1\\s*cr[oó]nicas', '2\\s*cr[oó]nicas',
  'esdras', 'nehem[ií]as', 'ester',
  'salmos?', 'proverbios', 'eclesiast[eé]s', 'cantares',
  'isa[ií]as', 'jerem[ií]as', 'lamentaciones', 'ezequiel', 'daniel',
  'oseas', 'joel', 'am[oó]s', 'abd[ií]as', 'jon[aá]s',
  'miqueas', 'nah[uú]m', 'habacuc', 'sofon[ií]as', 'ageo', 'zacar[ií]as', 'malaqu[ií]as',
  'mateo', 'marcos', 'lucas', 'juan', 'hechos', 'romanos',
  '1\\s*corintios', '2\\s*corintios', 'g[aá]latas', 'efesios',
  'filipenses', 'colosenses',
  '1\\s*tesalonicenses', '2\\s*tesalonicenses',
  '1\\s*timoteo', '2\\s*timoteo', 'tito', 'filem[oó]n',
  'hebreos', 'santiago',
  '1\\s*pedro', '2\\s*pedro',
  '1\\s*juan', '2\\s*juan', '3\\s*juan',
  'judas', 'apocalipsis',
];

const STEM_GROUP = `(?:${[...new Set(BOOK_STEMS)].join('|')})`;

/**
 * Regex global, case-insensitive, com Unicode.
 *
 * Match: [livro] [capítulo][:|.][versículo(-versículo)?]
 * Ex.: João 3:16, 1 Cor 13:4-7, Sl 23.1, Mt 5:3-12, John 3:16-18
 */
export const VERSE_REF_REGEX = new RegExp(
  `\\b(${STEM_GROUP})\\.?\\s+(\\d{1,3})[:\\.](\\d{1,3})(?:[-–](\\d{1,3}))?\\b`,
  'giu',
);

export interface VerseMatch {
  /** Texto original no documento (ex: "João 3:16-18") */
  raw: string;
  /** Posição inicial no string */
  index: number;
  /** Comprimento do match */
  length: number;
}

/** Encontra todas as referências bíblicas em um texto. */
export function findVerseRefs(text: string): VerseMatch[] {
  if (!text) return [];
  const out: VerseMatch[] = [];
  const re = new RegExp(VERSE_REF_REGEX.source, VERSE_REF_REGEX.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ raw: m[0], index: m.index, length: m[0].length });
  }
  return out;
}

/**
 * Quebra um texto em segmentos alternados: trecho normal e referência bíblica detectada.
 * Útil para renderizar inline com cor diferenciada.
 */
export type Segment =
  | { type: 'text'; value: string }
  | { type: 'ref'; value: string };

export function splitByVerseRefs(text: string): Segment[] {
  if (!text) return [];
  const matches = findVerseRefs(text);
  if (matches.length === 0) return [{ type: 'text', value: text }];

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, m.index) });
    }
    segments.push({ type: 'ref', value: m.raw });
    cursor = m.index + m.length;
  }
  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor) });
  }
  return segments;
}
