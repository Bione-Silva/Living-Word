import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { bibleBooks, getBookName, translationOptions, type L } from '@/lib/bible-data';
import { bookDescriptions, ntBookIds } from '@/data/bible-book-descriptions';

interface Props {
  translation: string;
  onTranslationChange: (t: string) => void;
  onSelectBook: (bookId: string) => void;
}

export function BibleBookGrid({ translation, onTranslationChange, onSelectBook }: Props) {
  const { lang } = useLanguage();
  const [testament, setTestament] = useState<'OT' | 'NT'>('OT');
  const availableTranslations = translationOptions[lang];

  const filteredBooks = useMemo(() => {
    return bibleBooks.filter(b =>
      testament === 'NT' ? ntBookIds.has(b.id) : !ntBookIds.has(b.id)
    );
  }, [testament]);

  const labels = {
    ot: { PT: 'Antigo Testamento', EN: 'Old Testament', ES: 'Antiguo Testamento' },
    nt: { PT: 'Novo Testamento', EN: 'New Testament', ES: 'Nuevo Testamento' },
    caps: { PT: 'caps', EN: 'ch', ES: 'cap' },
    cap: { PT: 'cap', EN: 'ch', ES: 'cap' },
  };

  const otBooks = bibleBooks.filter(b => !ntBookIds.has(b.id));
  const globalIndex = (bookId: string) => bibleBooks.findIndex(b => b.id === bookId) + 1;

  return (
    <div className="space-y-4">
      {/* Testament toggle + Translation pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
          <button
            onClick={() => setTestament('OT')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
              testament === 'OT'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10'
            }`}
          >
            {labels.ot[lang]}
          </button>
          <button
            onClick={() => setTestament('NT')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
              testament === 'NT'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10'
            }`}
          >
            {labels.nt[lang]}
          </button>
        </div>

        {availableTranslations.length > 1 && (
          <div className="flex items-center gap-1">
            {availableTranslations.map(t => (
              <button
                key={t.code}
                onClick={() => onTranslationChange(t.code)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  translation === t.code
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:text-foreground bg-muted border border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Book grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredBooks.map((book) => {
          const idx = globalIndex(book.id);
          const name = getBookName(book.id, lang);
          const desc = bookDescriptions[book.id] || '';
          const capsLabel = book.chapters === 1 ? labels.cap[lang] : labels.caps[lang];

          return (
            <button
              key={book.id}
              onClick={() => onSelectBook(book.id)}
              className="text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all p-3.5 space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-primary/70">#{String(idx).padStart(2, '0')}</span>
                <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  {book.chapters} {capsLabel}
                </span>
              </div>
              <p className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                {name}
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
