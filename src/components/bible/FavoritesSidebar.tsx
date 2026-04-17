import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, X, ChevronRight, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getBookName, type L } from '@/lib/bible-data';

const labels = {
  title: { PT: 'FAVORITOS', EN: 'FAVORITES', ES: 'FAVORITOS' },
  count: { PT: 'versículos salvos', EN: 'saved verses', ES: 'versículos guardados' },
  empty: { PT: 'Nenhum versículo favoritado ainda.', EN: 'No favorite verses yet.', ES: 'Ningún versículo favorito aún.' },
} satisfies Record<string, Record<L, string>>;

interface FavoriteRow {
  id: string;
  book_id: string;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
  created_at: string;
}

interface GroupedBook {
  bookId: string;
  bookName: string;
  verses: FavoriteRow[];
}

interface FavoritesSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (bookId: string, chapter: number) => void;
  refreshKey?: number;
}

export function FavoritesSidebar({ open, onOpenChange, onNavigate, refreshKey = 0 }: FavoritesSidebarProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    setLoading(true);
    supabase
      .from('bible_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) setFavorites(data as FavoriteRow[]);
        setLoading(false);
      });
  }, [user, open, refreshKey]);

  const grouped: GroupedBook[] = [];
  const bookMap = new Map<string, FavoriteRow[]>();
  for (const fav of favorites) {
    const existing = bookMap.get(fav.book_id);
    if (existing) existing.push(fav);
    else bookMap.set(fav.book_id, [fav]);
  }
  for (const [bookId, verses] of bookMap) {
    grouped.push({ bookId, bookName: getBookName(bookId, lang), verses });
  }

  const handleClick = (fav: FavoriteRow) => {
    onNavigate(fav.book_id, fav.chapter_number);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="bible-light w-[320px] sm:w-[360px] p-0 border-r border-border bg-card">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Star className="h-4 w-4 text-primary fill-primary" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold tracking-wide text-foreground">
                {labels.title[lang]}
              </SheetTitle>
              <p className="text-[11px] text-muted-foreground">
                {favorites.length} {labels.count[lang]}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-88px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12 px-6">{labels.empty[lang]}</p>
          ) : (
            <div className="p-3 space-y-1">
              {grouped.map((group) => (
                <div key={group.bookId}>
                  {grouped.length > 1 && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-3 pb-1">
                      {group.bookName}
                    </p>
                  )}
                  {group.verses.map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => handleClick(fav)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-background hover:bg-muted/60 hover:border-primary/30 transition-all group mb-1.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-primary flex items-center gap-1">
                          {getBookName(fav.book_id, lang).toUpperCase()} {fav.chapter_number}:{fav.verse_number}
                          <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {fav.verse_text}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
