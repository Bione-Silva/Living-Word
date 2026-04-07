import { Search, Loader2, FileText, BookOpen, Mic, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type L = 'PT' | 'EN' | 'ES';

interface SearchResult {
  id: string;
  title: string;
  type: string;
  passage: string | null;
}

const typeIcons: Record<string, React.ElementType> = {
  sermon: Mic, pastoral: Mic, study: BookOpen, biblical_study: BookOpen,
  article: FileText, blog: FileText, blog_article: FileText, devotional: Heart,
};

const typeLabels: Record<string, Record<L, string>> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  pastoral: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
  study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  biblical_study: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
  article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  blog: { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
};

export function UniversalSearch() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const placeholder: Record<L, string> = {
    PT: 'Pesquise versículos, temas, estudos, sermões...',
    EN: 'Search verses, topics, studies, sermons...',
    ES: 'Busca versículos, temas, estudios, sermones...',
  };

  const noResults: Record<L, string> = {
    PT: 'Nenhum resultado encontrado',
    EN: 'No results found',
    ES: 'Sin resultados',
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = async (q: string) => {
    if (!user || q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const term = `%${q.trim()}%`;
      const { data } = await supabase
        .from('materials')
        .select('id, title, type, passage')
        .eq('user_id', user.id)
        .or(`title.ilike.${term},passage.ilike.${term},content.ilike.${term}`)
        .order('created_at', { ascending: false })
        .limit(8);
      setResults(data || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/biblioteca?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(`/biblioteca?search=${encodeURIComponent(item.title)}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder[lang]}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {results.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{noResults[lang]}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-border">
              {results.map((item) => {
                const Icon = typeIcons[item.type] || FileText;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {typeLabels[item.type]?.[lang] || item.type}
                          {item.passage && ` · ${item.passage}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
