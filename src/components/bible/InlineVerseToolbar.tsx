import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, Copy, Share2, Pencil, BookOpen, Palette } from 'lucide-react';
import { toast } from 'sonner';
import type { L } from '@/lib/bible-data';

const highlightColors = [
  { key: 'yellow', class: 'bg-yellow-400' },
  { key: 'green', class: 'bg-green-400' },
  { key: 'blue', class: 'bg-blue-400' },
  { key: 'pink', class: 'bg-purple-400' },
];

const labels = {
  copied: { PT: 'Versículo copiado!', EN: 'Verse copied!', ES: '¡Versículo copiado!' },
  favorited: { PT: 'Favoritado!', EN: 'Favorited!', ES: '¡Favorito!' },
  removed: { PT: 'Favorito removido', EN: 'Favorite removed', ES: 'Favorito eliminado' },
  shared: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  noteSaved: { PT: 'Nota salva!', EN: 'Note saved!', ES: '¡Nota guardada!' },
  notePlaceholder: { PT: 'Escreva sua nota...', EN: 'Write your note...', ES: 'Escribe tu nota...' },
  save: { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  art: { PT: 'Arte', EN: 'Art', ES: 'Arte' },
} satisfies Record<string, Record<L, string>>;

interface Props {
  verse: { verse: number; text: string };
  bookId: string;
  chapter: number;
  translationCode: string;
  isFavorited: boolean;
  onFavoriteToggle: () => void;
  onHighlight: (color: string) => void;
  onNoteSaved: () => void;
  onClose: () => void;
}

export function InlineVerseToolbar({
  verse, bookId, chapter, translationCode,
  isFavorited, onFavoriteToggle, onHighlight, onNoteSaved, onClose,
}: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const verseRef = `${bookId} ${chapter}:${verse.verse}`;
  const verseFullText = `${verse.text.trim()} (${verseRef})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verseFullText);
    toast.success(labels.copied[lang]);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: verseFullText }); } catch {}
    } else {
      navigator.clipboard.writeText(verseFullText);
      toast.success(labels.shared[lang]);
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    if (isFavorited) {
      await supabase.from('bible_favorites')
        .delete().eq('user_id', user.id).eq('book_id', bookId)
        .eq('chapter_number', chapter).eq('verse_number', verse.verse);
      toast.success(labels.removed[lang]);
    } else {
      await supabase.from('bible_favorites').insert({
        user_id: user.id, book_id: bookId, chapter_number: chapter,
        verse_number: verse.verse, verse_text: verse.text.trim(),
        translation_code: translationCode, language: lang,
      });
      toast.success(labels.favorited[lang]);
    }
    onFavoriteToggle();
  };

  const handleSaveNote = async () => {
    if (!user || !noteText.trim()) return;
    setSaving(true);
    await supabase.from('bible_notes').insert({
      user_id: user.id, book_id: bookId, chapter_number: chapter,
      verse_number: verse.verse, note_text: noteText.trim(),
      translation_code: translationCode, language: lang,
    });
    toast.success(labels.noteSaved[lang]);
    setSaving(false);
    setShowNote(false);
    setNoteText('');
    onNoteSaved();
  };

  if (showNote) {
    return (
      <div className="mt-2 space-y-2 animate-in fade-in duration-200">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={labels.notePlaceholder[lang]}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={() => setShowNote(false)} className="px-3 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted">
            ←
          </button>
          <button
            onClick={handleSaveNote}
            disabled={saving || !noteText.trim()}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"
          >
            {labels.save[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap animate-in fade-in duration-200">
      {/* Highlight colors */}
      {highlightColors.map(c => (
        <button
          key={c.key}
          onClick={() => onHighlight(c.key)}
          className={`w-5 h-5 rounded-full ${c.class} hover:scale-125 transition-transform active:scale-95`}
        />
      ))}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Actions */}
      <button onClick={handleFavorite} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Star className={`h-4 w-4 ${isFavorited ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
      </button>
      <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Copy className="h-4 w-4 text-muted-foreground" />
      </button>
      <button onClick={handleShare} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Share2 className="h-4 w-4 text-muted-foreground" />
      </button>
      <button onClick={() => setShowNote(true)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Study & Art buttons */}
      <button
        onClick={() => { navigate('/estudo-biblico', { state: { passage: verseRef } }); onClose(); }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-medium text-primary">{labels.study[lang]}</span>
      </button>
      <button
        onClick={() => { navigate('/social-studio', { state: { verseText: verse.text.trim(), passage: verseRef } }); onClose(); }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Palette className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-medium text-primary">{labels.art[lang]}</span>
      </button>
    </div>
  );
}
