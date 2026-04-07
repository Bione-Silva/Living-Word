import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

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

const ptNames: Record<string, string> = {
  'Genesis': 'Gênesis', 'Exodus': 'Êxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números',
  'Deuteronomy': 'Deuteronômio', 'Joshua': 'Josué', 'Judges': 'Juízes', 'Ruth': 'Rute',
  'Psalms': 'Salmos', 'Proverbs': 'Provérbios', 'Ecclesiastes': 'Eclesiastes',
  'Song of Solomon': 'Cânticos', 'Isaiah': 'Isaías', 'Jeremiah': 'Jeremias',
  'Lamentations': 'Lamentações', 'Ezekiel': 'Ezequiel', 'Matthew': 'Mateus', 'Mark': 'Marcos',
  'Luke': 'Lucas', 'John': 'João', 'Acts': 'Atos', 'Romans': 'Romanos',
  'Hebrews': 'Hebreus', 'James': 'Tiago', 'Revelation': 'Apocalipse',
};

function getBookName(id: string, lang: L) {
  if (lang === 'PT') return ptNames[id] || id;
  return id;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BibleDrawer({ open, onOpenChange }: Props) {
  const { lang } = useLanguage();
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const currentBook = bibleBooks.find((b) => b.id === book)!;

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setVerses([]);
    try {
      const ref = `${book} ${chapter}`;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=web`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.verses) {
        setVerses(data.verses.map((v: any) => ({ verse: v.verse, text: v.text })));
      }
    } catch {
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [book, chapter]);

  useEffect(() => {
    if (open) fetchChapter();
  }, [open, fetchChapter]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {lang === 'PT' ? 'Bíblia' : lang === 'EN' ? 'Bible' : 'Biblia'}
          </SheetTitle>
          <SheetDescription className="sr-only">Bible reader</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Select value={book} onValueChange={(v) => { setBook(v); setChapter(1); }}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {bibleBooks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{getBookName(b.id, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {Array.from({ length: currentBook.chapters }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="leading-[1.9] text-[15px] font-serif text-foreground/90">
                {verses.map((v) => (
                  <span key={v.verse}>
                    <sup className="text-primary/60 font-sans text-[10px] font-bold mr-0.5">{v.verse}</sup>
                    {v.text.trim()}{' '}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => chapter > 1 && setChapter(chapter - 1)} disabled={chapter <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {lang === 'PT' ? 'Anterior' : 'Prev'}
            </Button>
            <span className="text-xs text-muted-foreground">{getBookName(book, lang)} {chapter}</span>
            <Button variant="ghost" size="sm" onClick={() => chapter < currentBook.chapters && setChapter(chapter + 1)} disabled={chapter >= currentBook.chapters}>
              {lang === 'PT' ? 'Próximo' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
