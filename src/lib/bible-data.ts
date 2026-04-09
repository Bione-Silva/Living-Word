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

/** Available translations per language with their bible-api.com codes */
export const translationOptions: Record<L, { code: string; label: string }[]> = {
  PT: [
    { code: 'nvi', label: 'NVI' },
    { code: 'almeida', label: 'ARA' },
    { code: 'acf', label: 'ACF' },
    { code: 'ntlh', label: 'NTLH' },
  ],
  EN: [
    { code: 'web', label: 'WEB' },
    { code: 'kjv', label: 'KJV' },
  ],
  ES: [
    { code: 'valera', label: 'RVR' },
  ],
};

export function getTranslation(lang: L): string {
  return translationOptions[lang][0].code;
}

export function getTranslationLabel(lang: L): string {
  if (lang === 'PT') return 'Nova Versão Internacional';
  if (lang === 'ES') return 'Reina Valera';
  return 'World English Bible (WEB)';
}

export function getTranslationLabelByCode(code: string): string {
  const map: Record<string, string> = {
    nvi: 'Nova Versão Internacional (NVI)',
    almeida: 'Almeida Revista e Atualizada (ARA)',
    acf: 'Almeida Corrigida Fiel (ACF)',
    ntlh: 'Nova Tradução na Linguagem de Hoje (NTLH)',
    web: 'World English Bible (WEB)',
    kjv: 'King James Version (KJV)',
    valera: 'Reina Valera',
  };
  return map[code] || code;
}
