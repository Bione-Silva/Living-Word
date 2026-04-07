import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type L = 'PT' | 'EN' | 'ES';

const pageTitle: Record<L, string> = { PT: 'A Bíblia', EN: 'The Bible', ES: 'La Biblia' };

const bibleBooks = [
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

// Portuguese book names for PT interface
const ptNames: Record<string, string> = {
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

const esNames: Record<string, string> = {
  'Genesis': 'Génesis', 'Exodus': 'Éxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio', 'Joshua': 'Josué', 'Judges': 'Jueces', 'Ruth': 'Rut',
  'Psalms': 'Salmos', 'Proverbs': 'Proverbios', 'Ecclesiastes': 'Eclesiastés',
  'Song of Solomon': 'Cantares', 'Isaiah': 'Isaías', 'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones', 'Ezekiel': 'Ezequiel', 'Matthew': 'Mateo', 'Mark': 'Marcos',
  'Luke': 'Lucas', 'John': 'Juan', 'Acts': 'Hechos', 'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios', '2 Corinthians': '2 Corintios', 'Galatians': 'Gálatas',
  'Ephesians': 'Efesios', 'Philippians': 'Filipenses', 'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses', '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo', '2 Timothy': '2 Timoteo', 'Titus': 'Tito', 'Philemon': 'Filemón',
  'Hebrews': 'Hebreos', 'James': 'Santiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro',
  '1 John': '1 Juan', '2 John': '2 Juan', '3 John': '3 Juan', 'Jude': 'Judas', 'Revelation': 'Apocalipsis',
};

function getBookName(id: string, lang: L) {
  if (lang === 'PT') return ptNames[id] || id;
  if (lang === 'ES') return esNames[id] || id;
  return id;
}

interface Verse {
  verse: number;
  text: string;
}

export default function BibleReader() {
  const { lang } = useLanguage();
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentBook = bibleBooks.find((b) => b.id === book)!;

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setError('');
    setVerses([]);
    try {
      const ref = `${book} ${chapter}`;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      if (data.verses) {
        setVerses(data.verses.map((v: any) => ({ verse: v.verse, text: v.text })));
      } else if (data.text) {
        setVerses([{ verse: 1, text: data.text }]);
      }
    } catch {
      setError(lang === 'PT' ? 'Não foi possível carregar o texto.' : lang === 'EN' ? 'Could not load text.' : 'No se pudo cargar el texto.');
    } finally {
      setLoading(false);
    }
  }, [book, chapter, lang]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  const goPrev = () => {
    if (chapter > 1) setChapter(chapter - 1);
  };
  const goNext = () => {
    if (chapter < currentBook.chapters) setChapter(chapter + 1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{pageTitle[lang]}</h1>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={book} onValueChange={(v) => { setBook(v); setChapter(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {bibleBooks.map((b) => (
              <SelectItem key={b.id} value={b.id}>{getBookName(b.id, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {Array.from({ length: currentBook.chapters }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {lang === 'PT' ? 'Cap.' : lang === 'EN' ? 'Ch.' : 'Cap.'} {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" onClick={goPrev} disabled={chapter <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goNext} disabled={chapter >= currentBook.chapters}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reading area */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 min-h-[400px]">
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          {getBookName(book, lang)} {chapter}
        </h2>
        <p className="text-[11px] text-muted-foreground mb-6">World English Bible (WEB)</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-10 text-sm">{error}</p>
        ) : (
          <div className="space-y-1 leading-[1.9] text-[16px] md:text-[17px] font-serif text-foreground/90">
            {verses.map((v) => (
              <span key={v.verse}>
                <sup className="text-primary/60 font-sans text-[11px] font-bold mr-1 select-none">{v.verse}</sup>
                {v.text.trim()}{' '}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={chapter <= 1} className="gap-1.5">
          <ChevronLeft className="h-3.5 w-3.5" />
          {lang === 'PT' ? 'Anterior' : lang === 'EN' ? 'Previous' : 'Anterior'}
        </Button>
        <span className="text-xs text-muted-foreground">{chapter} / {currentBook.chapters}</span>
        <Button variant="outline" size="sm" onClick={goNext} disabled={chapter >= currentBook.chapters} className="gap-1.5">
          {lang === 'PT' ? 'Próximo' : lang === 'EN' ? 'Next' : 'Siguiente'}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
