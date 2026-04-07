import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function UniversalSearch() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const placeholder = {
    PT: 'Pesquise versículos, temas, estudos, sermões...',
    EN: 'Search verses, topics, studies, sermons...',
    ES: 'Busca versículos, temas, estudios, sermones...',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/dashboard?tool=topic-explorer`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder[lang]}
        className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
      />
    </form>
  );
}
