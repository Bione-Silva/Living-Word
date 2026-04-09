import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { bibleBooks, getBookName, getApiBookName, getTranslation, getTranslationLabel, type L } from '@/lib/bible-data';

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
  const [bookOpen, setBookOpen] = useState(false);
  const [goToVerse, setGoToVerse] = useState('');
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  const currentBook = bibleBooks.find((b) => b.id === book)!;
  const translation = getTranslation(lang);

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setVerses([]);
    try {
      const apiBook = getApiBookName(book, translation);
      const ref = `${apiBook} ${chapter}`;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`);
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
  }, [book, chapter, translation]);

  useEffect(() => {
    if (open) fetchChapter();
  }, [open, fetchChapter]);

  const handleGoToVerse = () => {
    const num = parseInt(goToVerse, 10);
    if (!num || !verseRefs.current[num]) return;
    verseRefs.current[num]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setGoToVerse('');
  };

  const bookItems = useMemo(() =>
    bibleBooks.map((b) => ({ id: b.id, name: getBookName(b.id, lang) })),
    [lang]
  );

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
            {/* Searchable book combobox */}
            <Popover open={bookOpen} onOpenChange={setBookOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between font-normal text-foreground">
                  {getBookName(book, lang)}
                  <Search className="ml-2 h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={lang === 'PT' ? 'Buscar livro...' : lang === 'EN' ? 'Search book...' : 'Buscar libro...'} />
                  <CommandList className="max-h-[220px]">
                    <CommandEmpty>{lang === 'PT' ? 'Nenhum livro' : 'No book found'}</CommandEmpty>
                    <CommandGroup>
                      {bookItems.map((b) => (
                        <CommandItem
                          key={b.id}
                          value={b.name}
                          onSelect={() => { setBook(b.id); setChapter(1); setBookOpen(false); }}
                          className="cursor-pointer"
                        >
                          {b.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Chapter */}
            <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
              <SelectTrigger className="w-20 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {Array.from({ length: currentBook.chapters }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Verse jump */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              placeholder={lang === 'PT' ? 'Ir ao versículo...' : lang === 'EN' ? 'Go to verse...' : 'Ir al versículo...'}
              value={goToVerse}
              onChange={(e) => setGoToVerse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGoToVerse()}
              className="flex-1 h-8 text-sm"
            />
            <Button variant="ghost" size="sm" onClick={handleGoToVerse} className="px-2 h-8">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Translation label */}
          <p className="text-[10px] text-muted-foreground">{getTranslationLabel(lang)}</p>

          <div className="min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="leading-[1.9] text-[15px] font-serif text-foreground/90">
                {verses.map((v) => (
                  <span key={v.verse} ref={(el) => { verseRefs.current[v.verse] = el; }}>
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
              {lang === 'PT' ? 'Anterior' : lang === 'EN' ? 'Prev' : 'Anterior'}
            </Button>
            <span className="text-xs text-muted-foreground">{getBookName(book, lang)} {chapter}</span>
            <Button variant="ghost" size="sm" onClick={() => chapter < currentBook.chapters && setChapter(chapter + 1)} disabled={chapter >= currentBook.chapters}>
              {lang === 'PT' ? 'Próximo' : lang === 'EN' ? 'Next' : 'Siguiente'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
