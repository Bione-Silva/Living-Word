import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Home, Loader2, ChevronDown, Star, RefreshCw, BookOpen, Columns2 } from 'lucide-react';

import { getBookName, getTranslationLabelByCode, getVersionsForUserLanguage, getDefaultVersionCode, getBibleVersion, fetchBibleChapter, type L } from '@/lib/bible-data';
import { InlineVerseToolbar } from './InlineVerseToolbar';
import { StudySidebar } from './StudySidebar';
import { BibleVersionSelector } from './BibleVersionSelector';
import { BibleCompareColumn } from './BibleCompareColumn';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

const HINT_STORAGE_KEY = 'bible_double_tap_hint_seen_v1';
const doubleTapHint: Record<L, string> = {
  PT: 'Toque duas vezes em um versículo para abrir as ferramentas',
  EN: 'Double-tap a verse to open the tools',
  ES: 'Toca dos veces un versículo para abrir las herramientas',
};
const dragHintLabel: Record<L, string> = {
  PT: 'Arraste do versículo N até M para selecionar um trecho',
  EN: 'Drag from verse N to M to select a range',
  ES: 'Arrastra del versículo N al M para seleccionar un rango',
};

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
  highlightVerse?: string | null;
  onHighlightClear?: () => void;
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

// Unified fetcher (Bolls + bible-api fallback) lives in bible-data.ts

export function BibleReadingView({
  bookId, chapter, totalChapters, translation,
  onBack, onHome, onChapterChange, onTabsRefresh, onTranslationChange,
  highlightVerse, onHighlightClear,
}: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [favoritedVerses, setFavoritedVerses] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyPassage, setStudyPassage] = useState('');
  const [studyVerseText, setStudyVerseText] = useState('');
  const [activeHighlightVerses, setActiveHighlightVerses] = useState<Set<number>>(new Set());
  const [compareCode, setCompareCode] = useState<string | null>(null);

  // Drag-to-select (desktop only)
  const dragAnchorRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // First-time hint toast (once per user/browser)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem(HINT_STORAGE_KEY)) return;
      const t = setTimeout(() => {
        toast(doubleTapHint[lang], {
          description: dragHintLabel[lang],
          duration: 6000,
        });
        localStorage.setItem(HINT_STORAGE_KEY, '1');
      }, 1200);
      return () => clearTimeout(t);
    } catch { /* noop */ }
  }, [lang]);

  // Parse highlightVerse param (e.g. "22", "22-23") into a set of verse numbers
  useEffect(() => {
    if (!highlightVerse || verses.length === 0) {
      setActiveHighlightVerses(new Set());
      return;
    }
    const parts = highlightVerse.split('-').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    const verseSet = new Set<number>();
    if (parts.length === 2) {
      for (let i = parts[0]; i <= parts[1]; i++) verseSet.add(i);
    } else if (parts.length === 1) {
      verseSet.add(parts[0]);
    }
    setActiveHighlightVerses(verseSet);

    // Scroll to the first highlighted verse after a tick
    if (verseSet.size > 0) {
      const firstVerse = Math.min(...verseSet);
      setTimeout(() => {
        const el = document.getElementById(`verse-${firstVerse}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      // Auto-clear after 8s
      const timer = setTimeout(() => {
        setActiveHighlightVerses(new Set());
        onHighlightClear?.();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [highlightVerse, verses]);

  const handleOpenStudy = (passage: string, verseText: string) => {
    setStudyPassage(passage);
    setStudyVerseText(verseText);
    setStudyOpen(true);
  };

  const name = getBookName(bookId, lang);
  const prev: Record<L, string> = { PT: 'Anterior', EN: 'Previous', ES: 'Anterior' };
  const next: Record<L, string> = { PT: 'Próximo', EN: 'Next', ES: 'Siguiente' };
  const { primary: primaryVersions, secondary: secondaryVersions } = getVersionsForUserLanguage(lang);

  const fetchChapter = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true); else setLoading(true);
    setError(''); setVerses([]); setSelectedVerses(new Set());
    try {
      const rows = await fetchBibleChapter({
        bookId, chapter, versionCode: translation, fallbackLang: lang,
      });
      if (rows.length > 0) setVerses(rows);
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

  const handleHighlight = async (color: string, verseNums: number[]) => {
    if (!user || verseNums.length === 0) return;

    for (const vn of verseNums) {
      const v = verses.find(vv => vv.verse === vn);
      if (!v) continue;

      // Toggle: same color = remove
      if (highlights[vn] === color) {
        await supabase.from('bible_highlights').delete()
          .eq('user_id', user.id).eq('book_id', bookId)
          .eq('chapter_number', chapter).eq('start_verse_number', vn);
        setHighlights(p => {
          const copy = { ...p };
          delete copy[vn];
          return copy;
        });
        continue;
      }

      await supabase.from('bible_highlights').delete()
        .eq('user_id', user.id).eq('book_id', bookId)
        .eq('chapter_number', chapter).eq('start_verse_number', vn);
      await supabase.from('bible_highlights').insert({
        user_id: user.id, book_id: bookId, chapter_number: chapter,
        start_verse_number: vn, end_verse_number: vn,
        selected_text: v.text.trim(), color_key: color,
        language: lang, translation_code: translation,
      });
      setHighlights(p => ({ ...p, [vn]: color }));
    }
  };

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum); else next.add(verseNum);
      return next;
    });
  };

  // ─── Double-tap activation (mobile + desktop) ───
  // Two quick taps within 300ms toggle the verse selection.
  // Single tap does nothing → eliminates conflict with scroll.
  const lastTapRef = useRef<{ verse: number; time: number } | null>(null);
  const DOUBLE_TAP_MS = 300;

  const handleDoubleActivate = (verseNum: number) => {
    // Haptic feedback on supported mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch { /* noop */ }
    }
    toggleVerseSelection(verseNum);
  };

  // Manual double-tap detection for touch devices (onDoubleClick is unreliable on mobile)
  const handleVerseTap = (verseNum: number) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && last.verse === verseNum && now - last.time < DOUBLE_TAP_MS) {
      lastTapRef.current = null;
      handleDoubleActivate(verseNum);
    } else {
      lastTapRef.current = { verse: verseNum, time: now };
    }
  };

  // Helper: clear selection with subtle haptic feedback
  const clearSelection = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([10, 30, 10]); } catch { /* noop */ }
    }
    setSelectedVerses(new Set());
  }, []);

  // ─── Drag-to-select range (desktop only, via mouse) ───
  // Mousedown on a verse # → start anchor; mouseenter on others while dragging extends the range.
  // Touch devices keep the double-tap flow (pointerType filter).
  const selectRange = useCallback((from: number, to: number) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const next = new Set<number>();
    for (let i = lo; i <= hi; i++) next.add(i);
    setSelectedVerses(next);
  }, []);

  const handleDragStart = (e: React.PointerEvent, verseNum: number) => {
    if (e.pointerType !== 'mouse') return;
    if (e.button !== 0) return;
    dragAnchorRef.current = verseNum;
    setIsDragging(true);
  };

  const handleDragEnter = (verseNum: number) => {
    if (!isDragging || dragAnchorRef.current == null) return;
    if (dragAnchorRef.current === verseNum) return;
    selectRange(dragAnchorRef.current, verseNum);
  };

  // Global mouseup ends the drag. If a real range was made, suppress the imminent click.
  useEffect(() => {
    if (!isDragging) return;
    const end = () => {
      const wasRange = selectedVerses.size > 1;
      setIsDragging(false);
      dragAnchorRef.current = null;
      if (wasRange && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(20); } catch { /* noop */ }
      }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [isDragging, selectedVerses.size]);

  // ─── Auto-dismiss: outside click + scroll closes the floating toolbar ───
  useEffect(() => {
    if (selectedVerses.size === 0) return;

    const handleOutside = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Ignore clicks inside any verse row, the toolbar itself, or popovers/dialogs
      if (target.closest('[id^="verse-"]')) return;
      if (target.closest('[data-verse-toolbar]')) return;
      if (target.closest('[role="dialog"]')) return;
      if (target.closest('[data-radix-popper-content-wrapper]')) return;
      clearSelection();
    };

    let scrollStartY = window.scrollY;
    const handleScroll = () => {
      if (Math.abs(window.scrollY - scrollStartY) > 30) {
        clearSelection();
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [selectedVerses.size, clearSelection]);

  // ─── Keyboard shortcuts (desktop power users) ───
  // H = highlight yellow, F = favorite, Esc = clear selection
  useEffect(() => {
    if (selectedVerses.size === 0) return;

    const handleKey = async (e: KeyboardEvent) => {
      // Skip when typing in inputs / editable surfaces
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const verseNums = Array.from(selectedVerses);

      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      if (key === 'h') {
        e.preventDefault();
        await handleHighlight('yellow', verseNums);
        return;
      }

      if (key === 'f') {
        e.preventDefault();
        if (!user) return;
        for (const vn of verseNums) {
          const v = verses.find(vv => vv.verse === vn);
          if (!v) continue;
          const isFav = favoritedVerses.has(vn);
          if (isFav) {
            await supabase.from('bible_favorites').delete()
              .eq('user_id', user.id).eq('book_id', bookId)
              .eq('chapter_number', chapter).eq('verse_number', vn);
          } else {
            await supabase.from('bible_favorites').insert({
              user_id: user.id, book_id: bookId, chapter_number: chapter,
              verse_number: vn, verse_text: v.text.trim(),
              translation_code: translation, language: lang,
            });
          }
          setFavoritedVerses(p => {
            const n = new Set(p);
            if (n.has(vn)) n.delete(vn); else n.add(vn);
            return n;
          });
        }
        onTabsRefresh();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedVerses, clearSelection, verses, favoritedVerses, user, bookId, chapter, translation, lang, onTabsRefresh]);

  const chapterNumbers = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div className="bible-light space-y-4">
      {/* Breadcrumb: Home > Book > Cap N ▾  ... Version  */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:border-0 md:bg-transparent md:p-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
              <PopoverContent className="bible-light w-56 p-3" align="start">
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
            <BibleVersionSelector value={translation} onChange={(v) => onTranslationChange?.(v)} compact />
            <button
              onClick={() => {
                if (compareCode) {
                  setCompareCode(null);
                } else {
                  // Pick a sensible second version: language default if different from current, else first other in same language
                  const currentVer = getBibleVersion(translation);
                  const langDefault = getDefaultVersionCode(lang);
                  let pick = langDefault !== translation ? langDefault : '';
                  if (!pick) {
                    const same = primaryVersions.find(v => v.code !== translation && v.isAvailable);
                    pick = same?.code || langDefault;
                  }
                  setCompareCode(pick);
                }
              }}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border rounded-lg transition-colors ${
                compareCode
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/60 text-foreground hover:bg-muted'
              }`}
              title={lang === 'PT' ? 'Comparar versões' : lang === 'ES' ? 'Comparar versiones' : 'Compare versions'}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{lang === 'PT' ? 'Comparar' : lang === 'ES' ? 'Comparar' : 'Compare'}</span>
            </button>
          </div>
        </div>

        {/* Version indicator bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border">
          <BookOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" />
          <span className="text-[11px] text-primary/80 font-medium truncate">
            {name} {chapter} — {getTranslationLabelByCode(translation)}
          </span>
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

      {/* Verses (with optional compare column) */}
      <div className={compareCode ? 'grid grid-cols-1 lg:grid-cols-2 gap-3' : ''}>
        <div className="min-h-[400px] rounded-2xl border border-border bg-card p-3 md:p-4">
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
          <div className="space-y-1">
            {verses.map((v, idx) => {
              const isSelected = selectedVerses.has(v.verse);
              const hlClass = highlights[v.verse] ? highlightClassMap[highlights[v.verse]] || '' : '';
              const isUrlHighlight = activeHighlightVerses.has(v.verse);
              // Show toolbar on the LAST selected verse in sequence
              const isLastSelected = isSelected && !selectedVerses.has(verses[idx + 1]?.verse);

              return (
                <div
                  key={v.verse}
                  id={`verse-${v.verse}`}
                  onPointerEnter={() => handleDragEnter(v.verse)}
                  className={`flex items-start gap-3 py-2.5 px-2 rounded-lg transition-all ${
                      isUrlHighlight
                        ? 'bg-primary/10 ring-2 ring-primary/30 animate-pulse'
                        : isSelected
                          ? 'bg-primary/5 ring-1 ring-primary/20'
                          : hlClass || 'hover:bg-muted/40'
                  } ${isDragging ? 'select-none' : ''}`}
                >
                  {/* Verse number badge — double-tap (touch) / drag (mouse) to select */}
                  <button
                    onPointerDown={(e) => handleDragStart(e, v.verse)}
                    onClick={(e) => {
                      // Suppress click after a drag-range selection
                      if (selectedVerses.size > 1 && selectedVerses.has(v.verse)) {
                        e.preventDefault();
                        return;
                      }
                      handleVerseTap(v.verse);
                    }}
                    onDoubleClick={(e) => { e.preventDefault(); handleDoubleActivate(v.verse); }}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors select-none ${
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
                      onClick={() => handleVerseTap(v.verse)}
                      onDoubleClick={(e) => { e.preventDefault(); handleDoubleActivate(v.verse); }}
                      onContextMenu={(e) => e.preventDefault()}
                      className="leading-[1.9] text-[16px] md:text-[17px] font-serif text-foreground/90 cursor-pointer"
                    >
                      {v.text.trim()}
                    </span>
                    {isLastSelected && selectedVerses.size > 0 && (
                      <div data-verse-toolbar onPointerDown={(e) => e.stopPropagation()}>
                        <InlineVerseToolbar
                          selectedVerses={verses.filter(vv => selectedVerses.has(vv.verse))}
                          bookId={bookId}
                          chapter={chapter}
                          translationCode={translation}
                          favoritedVerses={favoritedVerses}
                          onFavoriteToggle={(vn) => {
                            setFavoritedVerses(p => {
                              const n = new Set(p);
                              if (n.has(vn)) n.delete(vn); else n.add(vn);
                              return n;
                            });
                            onTabsRefresh();
                          }}
                          onHighlight={handleHighlight}
                          onNoteSaved={onTabsRefresh}
                          onClose={clearSelection}
                          onStudySidebar={handleOpenStudy}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {/* Compare column */}
        {compareCode && (
          <BibleCompareColumn
            bookId={bookId}
            bookName={name}
            chapter={chapter}
            versionCode={compareCode}
            onVersionChange={setCompareCode}
            onClose={() => setCompareCode(null)}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-3">
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

      {/* Study Sidebar */}
      <StudySidebar
        open={studyOpen}
        onOpenChange={setStudyOpen}
        passage={studyPassage}
        verseText={studyVerseText}
        bookId={bookId}
        chapter={chapter}
        onNavigate={(bId, ch) => {
          onChapterChange(ch);
          setStudyOpen(false);
        }}
      />
    </div>
  );
}
