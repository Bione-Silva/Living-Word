import { Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useRef } from 'react';
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

export function UniversalSearch() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = () => {
    const q = query.trim();
    if (q.length < 2) return;
    setActiveQuery(q);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  return (
    <>
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
      </div>

      <DeepSearchModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        query={activeQuery}
      />
    </>
  );
}
