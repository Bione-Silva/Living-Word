import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchBibleChapter, getTranslationLabelByCode, type L } from '@/lib/bible-data';
import { BibleVersionSelector } from './BibleVersionSelector';

interface Props {
  bookId: string;
  bookName: string;
  chapter: number;
  versionCode: string;
  onVersionChange: (code: string) => void;
  onClose: () => void;
}

const labels: Record<L, { loading: string; failed: string }> = {
  PT: { loading: 'Carregando...', failed: 'Não foi possível carregar.' },
  EN: { loading: 'Loading...', failed: 'Could not load.' },
  ES: { loading: 'Cargando...', failed: 'No se pudo cargar.' },
};

export function BibleCompareColumn({
  bookId, bookName, chapter, versionCode, onVersionChange, onClose,
}: Props) {
  const { lang } = useLanguage();
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setVerses([]);
    fetchBibleChapter({ bookId, chapter, versionCode, fallbackLang: lang })
      .then(rows => {
        if (cancelled) return;
        if (rows.length === 0) setError(labels[lang].failed);
        else setVerses(rows);
      })
      .catch(() => { if (!cancelled) setError(labels[lang].failed); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bookId, chapter, versionCode, lang]);

  return (
    <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-primary/5 border-b border-border">
        <BibleVersionSelector value={versionCode} onChange={onVersionChange} compact />
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Close compare"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Reference */}
      <div className="px-3 py-1.5 text-[11px] text-primary/80 font-medium border-b border-border bg-background truncate">
        {bookName} {chapter} — {getTranslationLabelByCode(versionCode)}
      </div>

      {/* Body */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-center text-xs text-muted-foreground py-12">{error}</p>
        ) : (
          <div className="space-y-1.5">
            {verses.map(v => (
              <p key={v.verse} className="leading-[1.85] text-[15px] font-serif text-foreground/90">
                <sup className="text-[10px] font-bold text-primary/70 mr-1">{v.verse}</sup>
                {v.text.trim()}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
