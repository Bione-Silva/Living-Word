import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, Star, MessageSquare, CalendarDays, BarChart3, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { bibleBooks, getBookName, getTranslation, translationOptions, type L } from '@/lib/bible-data';
import { BibleBookGrid } from '@/components/bible/BibleBookGrid';
import { BibleChapterGrid } from '@/components/bible/BibleChapterGrid';
import { BibleReadingView } from '@/components/bible/BibleReadingView';
import { BibleTabs } from '@/components/bible/BibleTabs';
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
  PT: 'Buscar palavra-chave, livro, capítulo ou versículo...',
  EN: 'Search keyword, book, chapter or verse...',
  ES: 'Buscar palabra clave, libro, capítulo o versículo...',
};

type MainTab = 'read' | 'plans' | 'progress' | 'resources';
type ReadView = 'books' | 'chapters' | 'reading';

const mainTabs: { key: MainTab; icon: React.ElementType; label: Record<L, string> }[] = [
  { key: 'read', icon: BookOpen, label: { PT: 'Ler', EN: 'Read', ES: 'Leer' } },
  { key: 'plans', icon: CalendarDays, label: { PT: 'Planos', EN: 'Plans', ES: 'Planes' } },
  { key: 'progress', icon: BarChart3, label: { PT: 'Progresso', EN: 'Progress', ES: 'Progreso' } },
  { key: 'resources', icon: GraduationCap, label: { PT: 'Recursos', EN: 'Resources', ES: 'Recursos' } },
];

export default function BibleReader() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTab>('read');
  const [readView, setReadView] = useState<ReadView>('books');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [translation, setTranslation] = useState(() => getTranslation(lang));
  const [tabsRefreshKey, setTabsRefreshKey] = useState(0);

  const currentBook = selectedBook ? bibleBooks.find(b => b.id === selectedBook) : null;

  const handleSelectBook = (bookId: string) => {
    setSelectedBook(bookId);
    setReadView('chapters');
  };

  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setReadView('reading');
  };

  const handleNavigate = useCallback((bookId: string, chapter: number) => {
    setSelectedBook(bookId);
    setSelectedChapter(chapter);
    setReadView('reading');
    setActiveTab('read');
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{pageTitle[lang]}</h1>
            <p className="text-sm text-muted-foreground">{pageSubtitle[lang]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Star className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder[lang]}
          className="pl-10 bg-card border-border"
        />
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
              <BibleBookGrid
                translation={translation}
                onTranslationChange={setTranslation}
                onSelectBook={handleSelectBook}
              />
            )}
            {readView === 'chapters' && selectedBook && (
              <BibleChapterGrid
                bookId={selectedBook}
                onBack={() => setReadView('books')}
                onSelectChapter={handleSelectChapter}
              />
            )}
            {readView === 'reading' && selectedBook && currentBook && (
              <BibleReadingView
                bookId={selectedBook}
                chapter={selectedChapter}
                totalChapters={currentBook.chapters}
                translation={translation}
                onBack={() => setReadView('chapters')}
                onHome={() => setReadView('books')}
                onChapterChange={setSelectedChapter}
                onTabsRefresh={() => setTabsRefreshKey(k => k + 1)}
                onTranslationChange={setTranslation}
              />
            )}
          </>
        )}

        {activeTab === 'plans' && (
          <ReadingPlans onNavigate={handleNavigate} />
        )}

        {activeTab === 'progress' && (
          <BibleProgress />
        )}

        {activeTab === 'resources' && (
          <BibleResources />
        )}
      </div>

      {/* Favorites & Notes (always visible below) */}
      {activeTab === 'read' && (
        <div className="rounded-xl border border-border bg-card p-4">
          <BibleTabs refreshKey={tabsRefreshKey} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}
