import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, Star, MessageSquare, CalendarDays, BarChart3, GraduationCap, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { bibleBooks, getBookName, getTranslation, ptNames, esNames, translationOptions, type L } from '@/lib/bible-data';
import { BibleBookGrid } from '@/components/bible/BibleBookGrid';
import { BibleChapterGrid } from '@/components/bible/BibleChapterGrid';
import { BibleReadingView } from '@/components/bible/BibleReadingView';
import { BibleTabs } from '@/components/bible/BibleTabs';
import { FavoritesSidebar } from '@/components/bible/FavoritesSidebar';
import { ReadingPlans } from '@/components/bible/ReadingPlans';
import { BibleProgress } from '@/components/bible/BibleProgress';
import { BibleResources } from '@/components/bible/BibleResources';

const pageTitle: Record<L, string> = { PT: 'A Bíblia', EN: 'The Bible', ES: 'La Biblia' };
const pageSubtitle: Record<L, string> = {
  PT: 'Leia, estude e crie artes dos versículos',
  EN: 'Read, study and create verse art',
  ES: 'Lee, estudia y crea arte de versículos',
};
const searchPlaceholder: Record<L, string> = {
  PT: 'Buscar livro ou referência (ex: João 3:16)...',
  EN: 'Search book or reference (e.g. John 3:16)...',
  ES: 'Buscar libro o referencia (ej: Juan 3:16)...',
};

type MainTab = 'read' | 'plans' | 'progress' | 'resources';
type ReadView = 'books' | 'chapters' | 'reading';

const mainTabs: { key: MainTab; icon: React.ElementType; label: Record<L, string> }[] = [
  { key: 'read', icon: BookOpen, label: { PT: 'Ler', EN: 'Read', ES: 'Leer' } },
  { key: 'plans', icon: CalendarDays, label: { PT: 'Planos', EN: 'Plans', ES: 'Planes' } },
  { key: 'progress', icon: BarChart3, label: { PT: 'Progresso', EN: 'Progress', ES: 'Progreso' } },
  { key: 'resources', icon: GraduationCap, label: { PT: 'Recursos', EN: 'Resources', ES: 'Recursos' } },
];

interface SearchResult {
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
}

/** Parse search like "João 3", "João 3:16", "Genesis 1:1", "Gn 3", etc. */
function parseReference(query: string, lang: L): SearchResult | null {
  const q = query.trim();
  const match = q.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const [, rawBook, chStr, vStr] = match;
  const chapter = parseInt(chStr, 10);
  const verse = vStr ? parseInt(vStr, 10) : undefined;
  const bookQuery = rawBook.trim().toLowerCase();

  for (const book of bibleBooks) {
    const names = [
      book.id.toLowerCase(),
      (ptNames[book.id] || '').toLowerCase(),
      (esNames[book.id] || '').toLowerCase(),
    ];
    if (names.some(n => n && (n.startsWith(bookQuery) || bookQuery.startsWith(n.substring(0, 3))))) {
      if (chapter >= 1 && chapter <= book.chapters) {
        return { bookId: book.id, bookName: getBookName(book.id, lang), chapter, verse };
      }
    }
  }
  return null;
}

function searchBooks(query: string, lang: L): SearchResult[] {
  const q = query.toLowerCase();
  return bibleBooks
    .filter(b => {
      const names = [b.id.toLowerCase(), (ptNames[b.id] || '').toLowerCase(), (esNames[b.id] || '').toLowerCase()];
      return names.some(n => n && n.includes(q));
    })
    .slice(0, 8)
    .map(b => ({ bookId: b.id, bookName: getBookName(b.id, lang), chapter: 1 }));
}

export default function BibleReader() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTab>('read');
  const [readView, setReadView] = useState<ReadView>('books');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [translation, setTranslation] = useState(() => {
    const saved = localStorage.getItem('bible_translation_preference');
    if (saved) {
      const valid = translationOptions[lang].some(o => o.code === saved);
      if (valid) return saved;
    }
    return getTranslation(lang);
  });

  useEffect(() => {
    const valid = translationOptions[lang].some(o => o.code === translation);
    if (!valid) {
      const fallback = getTranslation(lang);
      setTranslation(fallback);
      localStorage.setItem('bible_translation_preference', fallback);
    }
  }, [lang, translation]);

  const [tabsRefreshKey, setTabsRefreshKey] = useState(0);
  const [tabsDefaultTab, setTabsDefaultTab] = useState<'favorites' | 'notes'>('favorites');
  const [favSidebarOpen, setFavSidebarOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentBook = selectedBook ? bibleBooks.find(b => b.id === selectedBook) : null;

  const handleSelectBook = (bookId: string) => { setSelectedBook(bookId); setReadView('chapters'); };
  const handleSelectChapter = (ch: number) => { setSelectedChapter(ch); setReadView('reading'); };

  const handleNavigate = useCallback((bookId: string, chapter: number) => {
    setSelectedBook(bookId);
    setSelectedChapter(chapter);
    setReadView('reading');
    setActiveTab('read');
  }, []);

  const scrollToTabs = (tab: 'favorites' | 'notes') => {
    setActiveTab('read');
    setTabsDefaultTab(tab);
    setTabsRefreshKey(k => k + 1);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setShowResults(false); return; }
    const timer = setTimeout(() => {
      const ref = parseReference(searchQuery, lang);
      if (ref) { setSearchResults([ref]); setShowResults(true); return; }
      const books = searchBooks(searchQuery, lang);
      setSearchResults(books);
      setShowResults(books.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, lang]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    setSelectedBook(result.bookId);
    setSelectedChapter(result.chapter);
    setReadView('reading');
    setActiveTab('read');
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setReadView('books'); setActiveTab('read'); setSelectedBook(''); }}
            className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors"
            title={lang === 'PT' ? 'Menu principal' : lang === 'EN' ? 'Main menu' : 'Menú principal'}
          >
            <BookOpen className="h-6 w-6 text-primary" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{pageTitle[lang]}</h1>
            <p className="text-sm text-muted-foreground">{pageSubtitle[lang]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavSidebarOpen(true)}
            className="p-2 rounded-lg border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors"
            title={lang === 'PT' ? 'Favoritos' : lang === 'EN' ? 'Favorites' : 'Favoritos'}
          >
            <Star className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={() => scrollToTabs('notes')}
            className="p-2 rounded-lg border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors"
            title={lang === 'PT' ? 'Notas' : lang === 'EN' ? 'Notes' : 'Notas'}
          >
            <MessageSquare className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder={searchPlaceholder[lang]}
          className="pl-10 pr-8 bg-card border-border"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={`${r.bookId}-${r.chapter}-${i}`}
                onClick={() => handleSearchSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-b-0"
              >
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.bookName} {r.chapter}{r.verse ? `:${r.verse}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'PT' ? 'Ir para' : lang === 'EN' ? 'Go to' : 'Ir a'} {r.bookName} {lang === 'PT' ? 'capítulo' : lang === 'EN' ? 'chapter' : 'capítulo'} {r.chapter}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
        {mainTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label[lang]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        {activeTab === 'read' && (
          <>
            {readView === 'books' && (
              <BibleBookGrid translation={translation} onTranslationChange={setTranslation} onSelectBook={handleSelectBook} />
            )}
            {readView === 'chapters' && selectedBook && (
              <BibleChapterGrid bookId={selectedBook} onBack={() => setReadView('books')} onSelectChapter={handleSelectChapter} />
            )}
            {readView === 'reading' && selectedBook && currentBook && (
              <BibleReadingView
                bookId={selectedBook} chapter={selectedChapter} totalChapters={currentBook.chapters}
                translation={translation} onBack={() => setReadView('chapters')} onHome={() => setReadView('books')}
                onChapterChange={setSelectedChapter} onTabsRefresh={() => setTabsRefreshKey(k => k + 1)}
                onTranslationChange={setTranslation}
              />
            )}
          </>
        )}
        {activeTab === 'plans' && <ReadingPlans onNavigate={handleNavigate} />}
        {activeTab === 'progress' && <BibleProgress />}
        {activeTab === 'resources' && <BibleResources />}
      </div>

      {/* Favorites & Notes */}
      {activeTab === 'read' && (
        <div className="rounded-xl border border-border bg-card p-4">
          <BibleTabs ref={tabsRef} refreshKey={tabsRefreshKey} onNavigate={handleNavigate} defaultTab={tabsDefaultTab} />
        </div>
      )}

      {/* Favorites Sidebar */}
      <FavoritesSidebar
        open={favSidebarOpen}
        onOpenChange={setFavSidebarOpen}
        onNavigate={handleNavigate}
        refreshKey={tabsRefreshKey}
      />
    </div>
  );
}
