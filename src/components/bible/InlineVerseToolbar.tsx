// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, Copy, Share2, Pencil, BookOpen, Palette, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getBookName, type L } from '@/lib/bible-data';

const highlightColors = [
  { key: 'yellow', class: 'bg-yellow-400' },
  { key: 'green', class: 'bg-green-400' },
  { key: 'blue', class: 'bg-blue-400' },
  { key: 'pink', class: 'bg-purple-400' },
];

const labels = {
  copied: { PT: 'Versículo(s) copiado(s)!', EN: 'Verse(s) copied!', ES: '¡Versículo(s) copiado(s)!' },
  favorited: { PT: 'Favoritado!', EN: 'Favorited!', ES: '¡Favorito!' },
  removed: { PT: 'Favorito removido', EN: 'Favorite removed', ES: 'Favorito eliminado' },
  shared: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  noteSaved: { PT: 'Nota salva!', EN: 'Note saved!', ES: '¡Nota guardada!' },
  notePlaceholder: { PT: 'Escreva sua nota...', EN: 'Write your note...', ES: 'Escribe tu nota...' },
  save: { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  art: { PT: 'Arte', EN: 'Art', ES: 'Arte' },
  blog: { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  selected: { PT: 'selecionados', EN: 'selected', ES: 'seleccionados' },
} satisfies Record<string, Record<L, string>>;

interface VerseItem { verse: number; text: string; }

interface Props {
  /** All selected verses (multi-select) */
  selectedVerses: VerseItem[];
  bookId: string;
  chapter: number;
  translationCode: string;
  favoritedVerses: Set<number>;
  onFavoriteToggle: (verseNum: number) => void;
  onHighlight: (color: string, verseNums: number[]) => void;
  onNoteSaved: () => void;
  onClose: () => void;
  onStudySidebar?: (passage: string, verseText: string) => void;
}

export function InlineVerseToolbar({
  selectedVerses, bookId, chapter, translationCode,
  favoritedVerses, onFavoriteToggle, onHighlight, onNoteSaved, onClose, onStudySidebar,
}: Props) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = (Array.isArray(selectedVerses) ? selectedVerses : []).sort((a, b) => a.verse - b.verse);
  const firstVerse = sorted[0];
  const lastVerse = sorted[sorted.length - 1];

  // Build reference like "Genesis 3:1-5" or "Genesis 3:2"
  const verseRange = sorted.length === 1
    ? `${firstVerse.verse}`
    : `${firstVerse.verse}-${lastVerse.verse}`;
  const verseRef = `${getBookName(bookId, lang)} ${chapter}:${verseRange}`;
  const combinedText = sorted.map(v => v.text.trim()).join(' ');
  const verseFullText = `${combinedText} (${verseRef})`;

  const verseNums = sorted.map(v => v.verse);

  // Are ALL selected verses favorited?
  const allFavorited = sorted.every(v => favoritedVerses.has(v.verse));

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
    for (const v of sorted) {
      const isFav = favoritedVerses.has(v.verse);
      if (allFavorited) {
        // Remove all
        await (supabase as any).from('bible_favorites')
          .delete().eq('user_id', user.id).eq('book_id', bookId)
          .eq('chapter_number', chapter).eq('verse_number', v.verse);
      } else if (!isFav) {
        // Add missing
        await (supabase as any).from('bible_favorites').insert({
          user_id: user.id, book_id: bookId, chapter_number: chapter,
          verse_number: v.verse, verse_text: v.text.trim(),
          translation_code: translationCode, language: lang,
        });
      }
      onFavoriteToggle(v.verse);
    }
    toast.success(allFavorited ? labels.removed[lang] : labels.favorited[lang]);
  };

  const handleSaveNote = async () => {
    if (!user || !noteText.trim()) return;
    setSaving(true);
    // Save note on first verse
    await (supabase as any).from('bible_notes').insert({
      user_id: user.id, book_id: bookId, chapter_number: chapter,
      verse_number: firstVerse.verse, note_text: noteText.trim(),
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
          className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/60"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={() => setShowNote(false)} className="px-3.5 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            ←
          </button>
          <button
            onClick={handleSaveNote}
            disabled={saving || !noteText.trim()}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
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
          onClick={() => onHighlight(c.key, verseNums)}
          className={`w-5 h-5 rounded-full ${c.class} hover:scale-125 transition-transform active:scale-95`}
        />
      ))}

      <div className="w-px h-4 bg-border mx-1" />

      {/* Actions */}
      <button onClick={handleFavorite} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Star className={`h-4 w-4 ${allFavorited ? 'text-yellow-500 fill-yellow-500' : 'text-foreground/60'}`} />
      </button>
      <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Copy className="h-4 w-4 text-foreground/60" />
      </button>
      <button onClick={handleShare} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Share2 className="h-4 w-4 text-foreground/60" />
      </button>
      <button onClick={() => setShowNote(true)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
        <Pencil className="h-4 w-4 text-foreground/60" />
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Study, Art & Blog buttons */}
      <button
        onClick={() => {
          if (onStudySidebar) {
            onStudySidebar(verseRef, combinedText);
          } else {
            navigate('/estudo-biblico', { state: { passage: verseRef } });
            onClose();
          }
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold">{labels.study[lang]}</span>
      </button>
      <button
        onClick={() => { navigate('/social-studio', { state: { verseText: combinedText, passage: verseRef } }); onClose(); }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Palette className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold">{labels.art[lang]}</span>
      </button>
      <button
        onClick={() => { navigate('/blog', { state: { passage: verseRef, verseText: combinedText } }); onClose(); }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <FileText className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold">{labels.blog[lang]}</span>
      </button>
    </div>
  );
}
