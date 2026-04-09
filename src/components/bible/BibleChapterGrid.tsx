import { useLanguage } from '@/contexts/LanguageContext';
import { getBookName, bibleBooks, type L } from '@/lib/bible-data';
import { ChevronLeft, Star } from 'lucide-react';

interface Props {
  bookId: string;
  onBack: () => void;
  onSelectChapter: (chapter: number) => void;
}

export function BibleChapterGrid({ bookId, onBack, onSelectChapter }: Props) {
  const { lang } = useLanguage();
  const book = bibleBooks.find(b => b.id === bookId)!;
  const name = getBookName(bookId, lang);
  const backLabel = { PT: 'Voltar aos livros', EN: 'Back to books', ES: 'Volver a libros' };
  const chaptersLabel = { PT: 'capítulos', EN: 'chapters', ES: 'capítulos' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-primary text-sm hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel[lang]}
        </button>
        <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <Star className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">{name}</h2>
        <div className="w-10 h-0.5 bg-primary mx-auto rounded-full" />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3 font-medium">{chaptersLabel[lang]}</p>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
          {Array.from({ length: book.chapters }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => onSelectChapter(i + 1)}
              className="aspect-square flex items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-primary/15 hover:border-primary/40 hover:text-primary transition-all"
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
