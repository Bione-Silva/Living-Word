import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bibleBooks, getBookName, getTranslation, translationOptions, getTranslationLabelByCode, type L } from '@/lib/bible-data';
import { VerseContextMenu } from '@/components/bible/VerseContextMenu';
import { BibleTabs } from '@/components/bible/BibleTabs';
import { ReadingPlans } from '@/components/bible/ReadingPlans';

const pageTitle: Record<L, string> = { PT: 'A Bíblia', EN: 'The Bible', ES: 'La Biblia' };

interface Verse { verse: number; text: string; }

export default function BibleReader() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [translation, setTranslation] = useState(() => getTranslation(lang));
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookOpen, setBookOpen] = useState(false);
  const [goToVerse, setGoToVerse] = useState('');
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  // Context menu state
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [favoritedVerses, setFavoritedVerses] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [tabsRefreshKey, setTabsRefreshKey] = useState(0);

  const currentBook = bibleBooks.find((b) => b.id === book)!;
  const availableTranslations = translationOptions[lang];

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setError('');
    setVerses([]);
    try {
      const ref = `${book} ${chapter}`;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`);
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
  }, [book, chapter, lang, translation]);

  useEffect(() => { fetchChapter(); }, [fetchChapter]);

  // Reset translation when language changes
  useEffect(() => {
    setTranslation(getTranslation(lang));
  }, [lang]);

  // Load favorites and highlights for current chapter
  useEffect(() => {
    if (!user) return;
    supabase.from('bible_favorites')
      .select('verse_number')
      .eq('user_id', user.id)
      .eq('book_id', book)
      .eq('chapter_number', chapter)
      .then(({ data }) => {
        if (data) setFavoritedVerses(new Set(data.map(d => d.verse_number)));
      });
    supabase.from('bible_highlights')
      .select('start_verse_number, color_key')
      .eq('user_id', user.id)
      .eq('book_id', book)
      .eq('chapter_number', chapter)
      .then(({ data }) => {
        if (data) {
          const map: Record<number, string> = {};
          data.forEach(d => { map[d.start_verse_number] = d.color_key; });
          setHighlights(map);
        }
      });
  }, [user, book, chapter]);

  const handleGoToVerse = () => {
    const num = parseInt(goToVerse, 10);
    if (!num || !verseRefs.current[num]) return;
    verseRefs.current[num]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setGoToVerse('');
  };

  const handleVerseClick = (e: React.MouseEvent, verse: Verse) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVerse(verse);
  };

  const handleHighlight = async (color: string) => {
    if (!user || !selectedVerse) return;
    await supabase.from('bible_highlights')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', book)
      .eq('chapter_number', chapter)
      .eq('start_verse_number', selectedVerse.verse);

    await supabase.from('bible_highlights').insert({
      user_id: user.id,
      book_id: book,
      chapter_number: chapter,
      start_verse_number: selectedVerse.verse,
      end_verse_number: selectedVerse.verse,
      selected_text: selectedVerse.text.trim(),
      color_key: color,
      language: lang,
      translation_code: translation,
    });

    setHighlights(prev => ({ ...prev, [selectedVerse.verse]: color }));
  };

  const handleNavigate = (bookId: string, chapterNum: number) => {
    setBook(bookId);
    setChapter(chapterNum);
  };

  const highlightClass = (colorKey: string) => {
    const map: Record<string, string> = {
      yellow: 'bg-yellow-200/40',
      green: 'bg-green-200/40',
      blue: 'bg-blue-200/40',
      pink: 'bg-pink-200/40',
    };
    return map[colorKey] || '';
  };

  const bookItems = useMemo(() =>
    bibleBooks.map((b) => ({ id: b.id, name: getBookName(b.id, lang) })),
    [lang]
  );

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
        <Popover open={bookOpen} onOpenChange={setBookOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between font-normal text-foreground border-border">
              {getBookName(book, lang)}
              <Search className="ml-2 h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0" align="start">
            <Command>
              <CommandInput placeholder={lang === 'PT' ? 'Buscar livro...' : lang === 'EN' ? 'Search book...' : 'Buscar libro...'} />
              <CommandList className="max-h-[250px]">
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

        <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
          <SelectTrigger className="w-[100px] text-foreground border-border">
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

        {/* Translation selector */}
        {availableTranslations.length > 1 && (
          <Select value={translation} onValueChange={setTranslation}>
            <SelectTrigger className="w-[90px] text-foreground border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTranslations.map((t) => (
                <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            placeholder="v."
            value={goToVerse}
            onChange={(e) => setGoToVerse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoToVerse()}
            className="w-16 h-9 text-center"
          />
          <Button variant="ghost" size="sm" onClick={handleGoToVerse} className="px-2">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => chapter > 1 && setChapter(chapter - 1)} disabled={chapter <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => chapter < currentBook.chapters && setChapter(chapter + 1)} disabled={chapter >= currentBook.chapters}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reading area */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 min-h-[400px]">
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          {getBookName(book, lang)} {chapter}
        </h2>
        <p className="text-[11px] text-muted-foreground mb-6">{getTranslationLabelByCode(translation)}</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-10 text-sm">{error}</p>
        ) : (
          <div className="space-y-1 leading-[1.9] text-[16px] md:text-[17px] font-serif text-foreground/90">
            {verses.map((v) => (
              <span
                key={v.verse}
                ref={(el) => { verseRefs.current[v.verse] = el; }}
                onClick={(e) => handleVerseClick(e, v)}
                className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-primary/10 ${highlights[v.verse] ? highlightClass(highlights[v.verse]) : ''}`}
              >
                <sup className="text-primary/60 font-sans text-[11px] font-bold mr-1 select-none">{v.verse}</sup>
                {v.text.trim()}{' '}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Reading Plans */}
      <div className="rounded-xl border border-border bg-card p-4">
        <ReadingPlans onNavigate={handleNavigate} />
      </div>

      {/* Favorites & Notes tabs */}
      <div className="rounded-xl border border-border bg-card p-4">
        <BibleTabs refreshKey={tabsRefreshKey} onNavigate={handleNavigate} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => chapter > 1 && setChapter(chapter - 1)} disabled={chapter <= 1} className="gap-1.5 text-foreground border-border">
          <ChevronLeft className="h-3.5 w-3.5" />
          {lang === 'PT' ? 'Anterior' : lang === 'EN' ? 'Previous' : 'Anterior'}
        </Button>
        <span className="text-xs text-muted-foreground">{chapter} / {currentBook.chapters}</span>
        <Button variant="outline" size="sm" onClick={() => chapter < currentBook.chapters && setChapter(chapter + 1)} disabled={chapter >= currentBook.chapters} className="gap-1.5 text-foreground border-border">
          {lang === 'PT' ? 'Próximo' : lang === 'EN' ? 'Next' : 'Siguiente'}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Context menu */}
      {selectedVerse && (
        <VerseContextMenu
          verse={selectedVerse}
          bookId={book}
          chapter={chapter}
          translationCode={translation}
          isFavorited={favoritedVerses.has(selectedVerse.verse)}
          onClose={() => setSelectedVerse(null)}
          onFavoriteToggle={() => {
            setFavoritedVerses(prev => {
              const next = new Set(prev);
              if (next.has(selectedVerse.verse)) next.delete(selectedVerse.verse);
              else next.add(selectedVerse.verse);
              return next;
            });
            setTabsRefreshKey(prev => prev + 1);
          }}
          onHighlight={handleHighlight}
          onNoteSaved={() => setTabsRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
