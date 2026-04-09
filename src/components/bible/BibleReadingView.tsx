import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Home, Loader2, ChevronDown, Star, RefreshCw } from 'lucide-react';
import { getBookName, translationOptions, type L } from '@/lib/bible-data';
import { InlineVerseToolbar } from './InlineVerseToolbar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

interface Verse { verse: number; text: string; }

interface Props {
  bookId: string;
  chapter: number;
  totalChapters: number;
  translation: string;
  onBack: () => void;
  onHome: () => void;
  onChapterChange: (ch: number) => void;
  onTabsRefresh: () => void;
  onTranslationChange?: (code: string) => void;
}

const highlightClassMap: Record<string, string> = {
  yellow: 'bg-yellow-100/60 border-l-2 border-yellow-400',
  green: 'bg-green-50/60 border-l-2 border-green-400',
  blue: 'bg-blue-50/60 border-l-2 border-blue-400',
  pink: 'bg-pink-50/60 border-l-2 border-pink-400',
};

const retryLabels: Record<L, { retrying: string; failed: string; retry: string }> = {
  PT: { retrying: 'Tentando novamente...', failed: 'Não foi possível carregar este capítulo.', retry: 'Tentar novamente' },
  EN: { retrying: 'Retrying...', failed: 'Could not load this chapter.', retry: 'Try again' },
  ES: { retrying: 'Reintentando...', failed: 'No se pudo cargar este capítulo.', retry: 'Intentar de nuevo' },
};

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch {
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed after retries');
}

export function BibleReadingView({
  bookId, chapter, totalChapters, translation,
  onBack, onHome, onChapterChange, onTabsRefresh, onTranslationChange,
}: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [favoritedVerses, setFavoritedVerses] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);

  const name = getBookName(bookId, lang);
  const prev: Record<L, string> = { PT: 'Anterior', EN: 'Previous', ES: 'Anterior' };
  const next: Record<L, string> = { PT: 'Próximo', EN: 'Next', ES: 'Siguiente' };
  const options = translationOptions[lang];

  const fetchChapter = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true); else setLoading(true);
    setError(''); setVerses([]); setSelectedVerse(null);
    try {
      const ref = `${bookId} ${chapter}`;
      const res = await fetchWithRetry(
        `https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`
      );
      const data = await res.json();
      if (data.verses) setVerses(data.verses.map((v: any) => ({ verse: v.verse, text: v.text })));
      else if (data.text) setVerses([{ verse: 1, text: data.text }]);
      else setError(retryLabels[lang].failed);
    } catch {
      setError(retryLabels[lang].failed);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [bookId, chapter, translation, lang]);

  useEffect(() => { fetchChapter(); }, [fetchChapter]);

  // Persist translation preference
  useEffect(() => {
    localStorage.setItem('bible_translation_preference', translation);
  }, [translation]);

  useEffect(() => {
    if (!user) return;
    supabase.from('bible_favorites').select('verse_number')
      .eq('user_id', user.id).eq('book_id', bookId).eq('chapter_number', chapter)
      .then(({ data }) => { if (data) setFavoritedVerses(new Set(data.map(d => d.verse_number))); });
    supabase.from('bible_highlights').select('start_verse_number, color_key')
      .eq('user_id', user.id).eq('book_id', bookId).eq('chapter_number', chapter)
      .then(({ data }) => {
        if (data) {
          const m: Record<number, string> = {};
          data.forEach(d => { m[d.start_verse_number] = d.color_key; });
          setHighlights(m);
        }
      });
  }, [user, bookId, chapter]);

  const handleHighlight = async (color: string) => {
    if (!user || selectedVerse === null) return;
    const v = verses.find(vv => vv.verse === selectedVerse);
    if (!v) return;

    // Toggle: same color = remove
    if (highlights[selectedVerse] === color) {
      await supabase.from('bible_highlights').delete()
        .eq('user_id', user.id).eq('book_id', bookId)
        .eq('chapter_number', chapter).eq('start_verse_number', selectedVerse);
      setHighlights(p => {
        const copy = { ...p };
        delete copy[selectedVerse];
        return copy;
      });
      return;
    }

    await supabase.from('bible_highlights').delete()
      .eq('user_id', user.id).eq('book_id', bookId)
      .eq('chapter_number', chapter).eq('start_verse_number', selectedVerse);
    await supabase.from('bible_highlights').insert({
      user_id: user.id, book_id: bookId, chapter_number: chapter,
      start_verse_number: selectedVerse, end_verse_number: selectedVerse,
      selected_text: v.text.trim(), color_key: color,
      language: lang, translation_code: translation,
    });
    setHighlights(p => ({ ...p, [selectedVerse]: color }));
  };

  const chapterNumbers = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Breadcrumb: Home > Book > Cap N ▾  ... NVI  ☆ */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onHome} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <Home className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={onBack} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 text-foreground text-xs font-medium hover:bg-muted">
            📖 {name} <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Chapter dropdown picker */}
          <Popover open={chapterPickerOpen} onOpenChange={setChapterPickerOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 text-foreground text-xs font-medium hover:bg-muted">
                Cap {chapter} <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="grid grid-cols-6 gap-1.5">
                {chapterNumbers.map(n => (
                  <button
                    key={n}
                    onClick={() => { onChapterChange(n); setChapterPickerOpen(false); }}
                    className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                      n === chapter
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Select value={translation} onValueChange={(v) => onTranslationChange?.(v)}>
            <SelectTrigger className="w-auto h-7 px-2.5 gap-1 text-xs font-medium border-border bg-muted/60 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(o => (
                <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Star className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Prev/Next */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => chapter > 1 && onChapterChange(chapter - 1)}
          disabled={chapter <= 1}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> {prev[lang]}
        </button>
        <button
          onClick={() => chapter < totalChapters && onChapterChange(chapter + 1)}
          disabled={chapter >= totalChapters}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        >
          {next[lang]} <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Verses */}
      <div className="min-h-[400px]">
        {(loading || retrying) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {retrying && <p className="text-xs text-muted-foreground">{retryLabels[lang].retrying}</p>}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-center text-muted-foreground text-sm">{error}</p>
            <button
              onClick={() => fetchChapter(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {retryLabels[lang].retry}
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {verses.map(v => {
              const isSelected = selectedVerse === v.verse;
              const hlClass = highlights[v.verse] ? highlightClassMap[highlights[v.verse]] || '' : '';

              return (
                <div key={v.verse} className={`flex items-start gap-3 py-2.5 px-2 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-primary/8 ring-1 ring-primary/20'
                    : hlClass || 'hover:bg-muted/40'
                }`}>
                  {/* Verse number badge */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedVerse(isSelected ? null : v.verse); }}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                    }`}
                  >
                    {v.verse}
                  </button>

                  {/* Verse text + inline toolbar */}
                  <div className="flex-1 min-w-0">
                    <span
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedVerse(isSelected ? null : v.verse); }}
                      className="cursor-pointer leading-[1.9] text-[16px] md:text-[17px] font-serif text-foreground/90"
                    >
                      {v.text.trim()}
                    </span>
                    {isSelected && (
                      <InlineVerseToolbar
                        verse={v}
                        bookId={bookId}
                        chapter={chapter}
                        translationCode={translation}
                        isFavorited={favoritedVerses.has(v.verse)}
                        onFavoriteToggle={() => {
                          setFavoritedVerses(p => {
                            const n = new Set(p);
                            if (n.has(v.verse)) n.delete(v.verse); else n.add(v.verse);
                            return n;
                          });
                          onTabsRefresh();
                        }}
                        onHighlight={handleHighlight}
                        onNoteSaved={onTabsRefresh}
                        onClose={() => setSelectedVerse(null)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => chapter > 1 && onChapterChange(chapter - 1)}
          disabled={chapter <= 1}
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {prev[lang]}
        </button>
        <span className="text-xs text-muted-foreground">{chapter} / {totalChapters}</span>
        <button
          onClick={() => chapter < totalChapters && onChapterChange(chapter + 1)}
          disabled={chapter >= totalChapters}
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary disabled:opacity-30 transition-colors"
        >
          {next[lang]} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
