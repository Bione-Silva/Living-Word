import { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const TEXT_COLORS = [
  { value: '#374151', label: 'Cinza' },
  { value: '#1E40AF', label: 'Azul' },
  { value: '#15803D', label: 'Verde' },
  { value: '#DC2626', label: 'Vermelho' },
  { value: '#92400E', label: 'Marrom' },
  { value: '#D4A853', label: 'Dourado' },
];

const labels = {
  title: { PT: '📝 Anotações do Pregador', EN: '📝 Preacher Notes', ES: '📝 Notas del Predicador' },
  placeholder: { PT: 'Escreva suas anotações pessoais para este sermão...', EN: 'Write your personal notes for this sermon...', ES: 'Escriba sus notas personales para este sermón...' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'Salvo', EN: 'Saved', ES: 'Guardado' },
  clear: { PT: 'Limpar', EN: 'Clear', ES: 'Limpiar' },
  noSermon: { PT: 'Selecione ou gere um sermão para anotar.', EN: 'Select or generate a sermon to take notes.', ES: 'Seleccione o genere un sermón para anotar.' },
};

interface PreacherNotesProps {
  materialId: string | null;
}

export function PreacherNotes({ materialId }: PreacherNotesProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [content, setContent] = useState('');
  const [textColor, setTextColor] = useState('#374151');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [noteId, setNoteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef({ content: '', textColor: '#374151' });

  // Load note when materialId changes
  useEffect(() => {
    if (!user || !materialId) {
      setContent('');
      setTextColor('#374151');
      setNoteId(null);
      setSaveStatus('idle');
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('sermon_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('material_id', materialId)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setContent(data.content || '');
        setTextColor(data.text_color || '#374151');
        setNoteId(data.id);
        lastSavedRef.current = { content: data.content || '', textColor: data.text_color || '#374151' };
      } else {
        setContent('');
        setTextColor('#374151');
        setNoteId(null);
        lastSavedRef.current = { content: '', textColor: '#374151' };
      }
      setSaveStatus('idle');
    })();

    return () => { cancelled = true; };
  }, [user, materialId]);

  const saveNote = useCallback(async (newContent: string, newColor: string) => {
    if (!user || !materialId) return;
    if (newContent === lastSavedRef.current.content && newColor === lastSavedRef.current.textColor) return;

    setSaveStatus('saving');
    try {
      if (noteId) {
        await supabase
          .from('sermon_notes')
          .update({ content: newContent, text_color: newColor })
          .eq('id', noteId);
      } else {
        const { data } = await supabase
          .from('sermon_notes')
          .insert({ user_id: user.id, material_id: materialId, content: newContent, text_color: newColor })
          .select('id')
          .single();
        if (data) setNoteId(data.id);
      }
      lastSavedRef.current = { content: newContent, textColor: newColor };
      setSaveStatus('saved');
    } catch {
      setSaveStatus('idle');
    }
  }, [user, materialId, noteId]);

  // Debounced auto-save
  const handleContentChange = (val: string) => {
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(val, textColor), 1500);
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(content, color), 500);
  };

  const handleClear = async () => {
    setContent('');
    if (noteId) {
      await supabase.from('sermon_notes').delete().eq('id', noteId);
      setNoteId(null);
      lastSavedRef.current = { content: '', textColor };
      setSaveStatus('idle');
      toast.success(lang === 'PT' ? 'Notas limpas' : lang === 'ES' ? 'Notas borradas' : 'Notes cleared');
    }
  };

  if (!materialId) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-muted-foreground text-center px-4">{labels.noSermon[lang]}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with color picker and status */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleColorChange(c.value)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${textColor === c.value ? 'border-primary scale-110' : 'border-transparent hover:border-muted-foreground/30'}`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> {labels.saving[lang]}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[10px] text-green-600">
              <Check className="h-3 w-3" /> {labels.saved[lang]}
            </span>
          )}
          {content.trim() && (
            <button onClick={handleClear} className="text-muted-foreground hover:text-destructive transition-colors" title={labels.clear[lang]}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-2">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={labels.placeholder[lang]}
          className="h-full min-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed bg-transparent"
          style={{ color: textColor }}
        />
      </div>
    </div>
  );
}
