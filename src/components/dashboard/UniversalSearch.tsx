import { Search, Clock, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { DeepSearchModal } from './DeepSearchModal';

type L = 'PT' | 'EN' | 'ES';

const placeholder: Record<L, string> = {
  PT: 'Pesquise versículos, temas, estudos, sermões...',
  EN: 'Search verses, topics, studies, sermons...',
  ES: 'Busca versículos, temas, estudios, sermones...',
};

const btnLabel: Record<L, string> = {
  PT: 'Pesquisar',
  EN: 'Search',
  ES: 'Buscar',
};

const recentLabel: Record<L, string> = {
  PT: 'Pesquisas recentes',
  EN: 'Recent searches',
  ES: 'Búsquedas recientes',
};

const HISTORY_KEY = 'lw-search-history';
const MAX_HISTORY = 8;

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

export function UniversalSearch() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');
  const [history, setHistory] = useState<string[]>(getHistory);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback((q?: string) => {
    const term = (q ?? query).trim();
    if (term.length < 2) return;
    setActiveQuery(term);
    setModalOpen(true);
    setShowHistory(false);

    // Add to history (deduplicate, most recent first)
    const updated = [term, ...history.filter((h) => h.toLowerCase() !== term.toLowerCase())].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistory(updated);
  }, [query, history]);

  const handleOpenModal = () => {
    setActiveQuery(query.trim());
    setModalOpen(true);
    setShowHistory(false);
  };

  const removeFromHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h !== item);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="relative" ref={wrapperRef}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              placeholder={placeholder[lang]}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={query.trim().length < 2}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0"
          >
            {btnLabel[lang]}
          </button>
        </form>

        {/* Recent searches dropdown */}
        {showHistory && history.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {recentLabel[lang]}
            </p>
            {history.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  doSearch(item);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors group"
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left truncate">{item}</span>
                <span
                  role="button"
                  onClick={(e) => removeFromHistory(item, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-opacity"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <DeepSearchModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        query={activeQuery}
      />
    </>
  );
}
