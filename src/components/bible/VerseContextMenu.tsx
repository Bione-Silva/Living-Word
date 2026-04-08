import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, StickyNote, Copy, Share2, Palette, Brain, X } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  favorite: { PT: 'Favoritar', EN: 'Favorite', ES: 'Favorito' },
  unfavorite: { PT: 'Desfavoritar', EN: 'Unfavorite', ES: 'Quitar' },
  addNote: { PT: 'Nota', EN: 'Note', ES: 'Nota' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  genArt: { PT: 'Gerar arte', EN: 'Gen art', ES: 'Crear arte' },
  studyAI: { PT: 'Estudar com IA', EN: 'Study w/ AI', ES: 'Estudiar IA' },
  copied: { PT: 'Versículo copiado!', EN: 'Verse copied!', ES: '¡Versículo copiado!' },
  favorited: { PT: 'Versículo favoritado!', EN: 'Verse favorited!', ES: '¡Versículo favorito!' },
  removed: { PT: 'Favorito removido', EN: 'Favorite removed', ES: 'Favorito eliminado' },
  noteSaved: { PT: 'Nota salva!', EN: 'Note saved!', ES: '¡Nota guardada!' },
  notePlaceholder: { PT: 'Escreva sua nota...', EN: 'Write your note...', ES: 'Escribe tu nota...' },
  save: { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  shared: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
} satisfies Record<string, Record<L, string>>;

const highlightColors = [
  { key: 'yellow', emoji: '🟡', class: 'bg-yellow-200/60' },
  { key: 'green', emoji: '🟢', class: 'bg-green-200/60' },
  { key: 'blue', emoji: '🔵', class: 'bg-blue-200/60' },
  { key: 'pink', emoji: '🔴', class: 'bg-pink-200/60' },
];

interface VerseContextMenuProps {
  verse: { verse: number; text: string };
  bookId: string;
  chapter: number;
  translationCode: string;
  isFavorited: boolean;
  onClose: () => void;
  onFavoriteToggle: () => void;
  onHighlight: (color: string) => void;
  onNoteSaved: () => void;
}

export function VerseContextMenu({
  verse, bookId, chapter, translationCode,
  isFavorited, onClose, onFavoriteToggle, onHighlight, onNoteSaved,
}: VerseContextMenuProps) {
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
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: verseFullText });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(verseFullText);
      toast.success(labels.shared[lang]);
    }
    onClose();
  };

  const handleFavorite = async () => {
    if (!user) return;
    if (isFavorited) {
      await supabase.from('bible_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('chapter_number', chapter)
        .eq('verse_number', verse.verse);
      toast.success(labels.removed[lang]);
    } else {
      await supabase.from('bible_favorites').insert({
        user_id: user.id,
        book_id: bookId,
        chapter_number: chapter,
        verse_number: verse.verse,
        verse_text: verse.text.trim(),
        translation_code: translationCode,
        language: lang,
      });
      toast.success(labels.favorited[lang]);
    }
    onFavoriteToggle();
    onClose();
  };

  const handleSaveNote = async () => {
    if (!user || !noteText.trim()) return;
    setSaving(true);
    await supabase.from('bible_notes').insert({
      user_id: user.id,
      book_id: bookId,
      chapter_number: chapter,
      verse_number: verse.verse,
      note_text: noteText.trim(),
      translation_code: translationCode,
      language: lang,
    });
    toast.success(labels.noteSaved[lang]);
    setSaving(false);
    onNoteSaved();
    onClose();
  };

  const handleGenArt = () => {
    navigate('/social-studio', { state: { verseText: verse.text.trim(), passage: verseRef } });
    onClose();
  };

  const handleStudyAI = () => {
    navigate('/estudo-biblico', { state: { passage: verseRef } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Verse preview */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-display italic text-foreground leading-relaxed flex-1">
            <sup className="text-primary/60 text-[10px] font-sans font-bold mr-1">{verse.verse}</sup>
            {verse.text.trim()}
          </p>
          <button onClick={onClose} className="shrink-0 p-1 rounded-full hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="h-px bg-border" />

        {!showNote ? (
          <div className="space-y-2">
            {/* Row 1: Highlight colors */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-muted-foreground mr-1">{lang === 'PT' ? 'Destacar' : lang === 'EN' ? 'Highlight' : 'Resaltar'}</span>
              {highlightColors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => { onHighlight(c.key); onClose(); }}
                  className="text-lg hover:scale-125 transition-transform active:scale-95"
                  title={c.key}
                >
                  {c.emoji}
                </button>
              ))}
            </div>

            <div className="h-px bg-border" />

            {/* Row 2: Favorite, Note, Copy, Share */}
            <div className="grid grid-cols-4 gap-1">
              <button onClick={handleFavorite} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors">
                <Heart className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                <span className="text-[10px] text-muted-foreground">{isFavorited ? labels.unfavorite[lang] : labels.favorite[lang]}</span>
              </button>
              <button onClick={() => setShowNote(true)} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors">
                <StickyNote className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{labels.addNote[lang]}</span>
              </button>
              <button onClick={handleCopy} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors">
                <Copy className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{labels.copy[lang]}</span>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors">
                <Share2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{labels.share[lang]}</span>
              </button>
            </div>

            <div className="h-px bg-border" />

            {/* Row 3: Gen Art, Study AI */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleGenArt} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">{labels.genArt[lang]}</span>
              </button>
              <button onClick={handleStudyAI} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">{labels.studyAI[lang]}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={labels.notePlaceholder[lang]}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNote(false)} className="flex-1 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
                ← {lang === 'PT' ? 'Voltar' : 'Back'}
              </button>
              <button
                onClick={handleSaveNote}
                disabled={saving || !noteText.trim()}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
              >
                {labels.save[lang]}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
