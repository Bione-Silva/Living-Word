import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, StickyNote, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  favorites: { PT: 'Favoritos', EN: 'Favorites', ES: 'Favoritos' },
  notes: { PT: 'Notas', EN: 'Notes', ES: 'Notas' },
  emptyFav: { PT: 'Nenhum versículo favoritado ainda.', EN: 'No favorite verses yet.', ES: 'Ningún versículo favorito aún.' },
  emptyNotes: { PT: 'Nenhuma nota criada ainda.', EN: 'No notes yet.', ES: 'Ninguna nota aún.' },
} satisfies Record<string, Record<L, string>>;

interface FavoriteRow { id: string; book_id: string; chapter_number: number; verse_number: number; verse_text: string; created_at: string; }
interface NoteRow { id: string; book_id: string; chapter_number: number; verse_number: number; note_text: string; created_at: string; }

interface BibleTabsProps {
  refreshKey: number;
  onNavigate?: (bookId: string, chapter: number) => void;
}

export function BibleTabs({ refreshKey, onNavigate }: BibleTabsProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('bible_favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setFavorites(data as FavoriteRow[]); });
    supabase.from('bible_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setNotes(data as NoteRow[]); });
  }, [user, refreshKey]);

  const removeFav = async (id: string) => {
    await supabase.from('bible_favorites').delete().eq('id', id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const removeNote = async (id: string) => {
    await supabase.from('bible_notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Tabs defaultValue="favorites" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="favorites" className="flex-1 gap-1.5 text-xs">
          <Heart className="h-3.5 w-3.5" /> {labels.favorites[lang]}
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex-1 gap-1.5 text-xs">
          <StickyNote className="h-3.5 w-3.5" /> {labels.notes[lang]}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="favorites">
        <ScrollArea className="max-h-[300px]">
          {favorites.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{labels.emptyFav[lang]}</p>
          ) : (
            <div className="space-y-2 p-1">
              {favorites.map(f => (
                <div
                  key={f.id}
                  className="flex items-start gap-2 p-3 rounded-xl border border-border bg-card/50 group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onNavigate?.(f.book_id, f.chapter_number)}
                >
                  <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{f.book_id} {f.chapter_number}:{f.verse_number}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{f.verse_text}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFav(f.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="notes">
        <ScrollArea className="max-h-[300px]">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{labels.emptyNotes[lang]}</p>
          ) : (
            <div className="space-y-2 p-1">
              {notes.map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 p-3 rounded-xl border border-border bg-card/50 group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onNavigate?.(n.book_id, n.chapter_number)}
                >
                  <StickyNote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.book_id} {n.chapter_number}:{n.verse_number}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.note_text}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeNote(n.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
