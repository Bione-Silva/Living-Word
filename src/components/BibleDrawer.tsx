import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Search, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { bibleBooks, getBookName, getApiBookName, getApiCodeForVersion, getTranslation, getTranslationLabelByCode, translationOptions, getVersionsByLanguage, getVersionsForUserLanguage, getBibleVersion, type BibleVersion, type L } from '@/lib/bible-data';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  initialVerseEnd?: number;
  initialTranslation?: string;
  /** When set, only versions matching this language are shown (e.g. 'PT' when opened from a PT sermon) */
  languageFilter?: 'PT' | 'EN' | 'ES';
}

export function BibleDrawer({ open, onOpenChange, initialBook, initialChapter, initialVerse, initialVerseEnd, initialTranslation, languageFilter }: Props) {
  const { lang } = useLanguage();
  const [book, setBook] = useState(initialBook || 'John');
  const [chapter, setChapter] = useState(initialChapter || 3);
  const [translation, setTranslation] = useState(initialTranslation || getTranslation(lang));
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [goToVerse, setGoToVerse] = useState('');
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const [highlightRange, setHighlightRange] = useState<{ start: number; end?: number } | null>(null);
  // When opened from a ref link, default to showing only the referenced verses
  const [showFullChapter, setShowFullChapter] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialBook) setBook(initialBook);
      if (initialChapter) setChapter(initialChapter);
      if (initialTranslation) setTranslation(initialTranslation);
      if (initialVerse) {
        setHighlightRange({ start: initialVerse, end: initialVerseEnd });
        setShowFullChapter(false); // reset to focused view
      } else {
        setHighlightRange(null);
        setShowFullChapter(true); // no specific verse = show all
      }
    }
  }, [open, initialBook, initialChapter, initialVerse, initialVerseEnd, initialTranslation]);

  const currentBook = bibleBooks.find((b) => b.id === book) || bibleBooks[0];

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setVerses([]);
    try {
      const apiTranslation = getApiCodeForVersion(translation);
      const apiBook = getApiBookName(book, translation);
      const ref = `${apiBook} ${chapter}`;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${apiTranslation}`);
      let data = res.ok ? await res.json() : null;
      
      // If failed, fallback to language-appropriate version
      if ((!data || (!data.verses && !data.text))) {
        const fb = lang === 'EN' ? 'web' : 'almeida';
        if (apiTranslation !== fb) {
          const fbBook = getApiBookName(book, fb === 'almeida' ? 'ara' : 'web');
          const fbRef = `${fbBook} ${chapter}`;
          const fbRes = await fetch(`https://bible-api.com/${encodeURIComponent(fbRef)}?translation=${fb}`);
          data = fbRes.ok ? await fbRes.json() : null;
        }
      }
      
      if (data?.verses) {
        setVerses(data.verses.map((v: any) => ({ verse: v.verse, text: v.text })));
      }
    } catch {
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [book, chapter, translation, lang]);

  useEffect(() => {
    if (open) fetchChapter();
  }, [open, fetchChapter]);

  // Scroll to highlighted verse after verses load (only in full chapter mode)
  useEffect(() => {
    if (highlightRange && verses.length > 0 && showFullChapter) {
      const timer = setTimeout(() => {
        const el = verseRefs.current[highlightRange.start];
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightRange, verses, showFullChapter]);

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

  const isHighlighted = (verseNum: number) => {
    if (!highlightRange) return false;
    const end = highlightRange.end || highlightRange.start;
    return verseNum >= highlightRange.start && verseNum <= end;
  };

  const { primary: primaryVersions, secondary: secondaryVersions } = useMemo(() => {
    const result = getVersionsForUserLanguage(lang);
    if (languageFilter) {
      // When a language filter is active (e.g. from a sermon), only show versions in that language
      const filtered = [...result.primary, ...result.secondary].filter(v => v.language === languageFilter);
      return { primary: filtered, secondary: [] as BibleVersion[] };
    }
    return result;
  }, [lang, languageFilter]);
  const currentVersion = getBibleVersion(translation);
  const currentTranslationLabel = currentVersion ? `${currentVersion.name} (${currentVersion.shortLabel})` : translation;

  const langGroupLabels: Record<string, Record<L, string>> = {
    'primary': { PT: 'Recomendadas', EN: 'Recommended', ES: 'Recomendadas' },
    'secondary': { PT: 'Outras versões', EN: 'Other versions', ES: 'Otras versiones' },
  };

  const renderVersionSelector = (compact = false) => (
    <Select value={translation} onValueChange={setTranslation}>
      <SelectTrigger className={compact ? "w-auto h-8 px-3 gap-1.5 text-xs font-medium border-border bg-muted/60 rounded-lg" : "flex-1 h-8 text-xs text-foreground"}>
        {compact && <Globe className="h-3 w-3 text-primary/60" />}
        <SelectValue placeholder={currentVersion?.shortLabel || translation} />
      </SelectTrigger>
      <SelectContent className="max-h-[340px]">
        {primaryVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold px-2 py-1.5">
              {langGroupLabels['primary'][lang]}
            </SelectLabel>
            {primaryVersions.filter(v => v.isAvailable).map(v => (
              <SelectItem key={v.code} value={v.code} className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{v.shortLabel}</span>
                  <span className="text-muted-foreground">{v.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {secondaryVersions.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold px-2 py-1.5">
              {langGroupLabels['secondary'][lang]}
            </SelectLabel>
            {secondaryVersions.filter(v => v.isAvailable).map(v => (
              <SelectItem key={v.code} value={v.code} className="text-xs">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{v.shortLabel}</span>
                  <span className="text-muted-foreground text-[10px]">{v.name} ({v.language})</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );

  // Filter verses: show only highlighted range when in focused mode
  const displayVerses = useMemo(() => {
    if (showFullChapter || !highlightRange) return verses;
    const end = highlightRange.end || highlightRange.start;
    return verses.filter(v => v.verse >= highlightRange.start && v.verse <= end);
  }, [verses, highlightRange, showFullChapter]);

  const focusedLabel = useMemo(() => {
    if (!highlightRange) return '';
    const bookName = getBookName(book, lang);
    const end = highlightRange.end;
    return `${bookName} ${chapter}:${highlightRange.start}${end ? `-${end}` : ''}`;
  }, [highlightRange, book, chapter, lang]);

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
          {/* Focused reference badge */}
          {highlightRange && (
            <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary">{focusedLabel}</p>
                <p className="text-[10px] text-primary/60 mt-0.5">{currentTranslationLabel}</p>
              </div>
              {renderVersionSelector(true)}
            </div>
          )}

          {/* Focused verse display (when not showing full chapter) */}
          {!showFullChapter && highlightRange && (
            <>
              <div className="min-h-[100px]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="leading-[2] text-base font-serif text-foreground/90 bg-card rounded-xl p-4 border border-border">
                    {displayVerses.map((v) => (
                      <span key={v.verse}>
                        <sup className="text-primary/70 font-sans text-[10px] font-bold mr-1">{v.verse}</sup>
                        {v.text.trim()}{' '}
                      </span>
                    ))}
                    {displayVerses.length === 0 && !loading && (
                      <p className="text-sm text-muted-foreground italic">
                        {lang === 'PT' ? 'Versículo não encontrado.' : lang === 'ES' ? 'Versículo no encontrado.' : 'Verse not found.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Expand to full chapter */}
              <button
                onClick={() => setShowFullChapter(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {lang === 'PT' ? 'Ver capítulo completo' : lang === 'ES' ? 'Ver capítulo completo' : 'View full chapter'}
              </button>
            </>
          )}

          {/* Full chapter mode — show navigation + all verses */}
          {showFullChapter && (
            <>
              <div className="flex gap-2">
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
                              onSelect={() => { setBook(b.id); setChapter(1); setHighlightRange(null); setBookOpen(false); }}
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

                <Select value={String(chapter)} onValueChange={(v) => { setChapter(Number(v)); setHighlightRange(null); }}>
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

              <div className="flex items-center gap-2">
                {renderVersionSelector()}
              </div>

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

              <div className="min-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="leading-[1.9] text-[15px] font-serif text-foreground/90">
                    {verses.map((v) => (
                      <span
                        key={v.verse}
                        ref={(el) => { verseRefs.current[v.verse] = el; }}
                        className={isHighlighted(v.verse) ? 'bg-primary/15 rounded px-0.5' : ''}
                      >
                        <sup className="text-primary/60 font-sans text-[10px] font-bold mr-0.5">{v.verse}</sup>
                        {v.text.trim()}{' '}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => { setChapter(chapter - 1); setHighlightRange(null); }} disabled={chapter <= 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {lang === 'PT' ? 'Anterior' : lang === 'EN' ? 'Prev' : 'Anterior'}
                </Button>
                <span className="text-xs text-muted-foreground">{getBookName(book, lang)} {chapter} • {currentTranslationLabel}</span>
                <Button variant="ghost" size="sm" onClick={() => { setChapter(chapter + 1); setHighlightRange(null); }} disabled={chapter >= currentBook.chapters}>
                  {lang === 'PT' ? 'Próximo' : lang === 'EN' ? 'Next' : 'Siguiente'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
