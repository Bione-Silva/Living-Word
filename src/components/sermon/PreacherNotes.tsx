import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, List, ListOrdered, 
  Quote, CheckSquare, Sparkles, Wand2, Type, Highlighter, Trash2, Heading1, Heading2, Heading3
} from 'lucide-react';

interface PreacherNotesProps {
  materialId: string | null;
}

const labels = {
  noMaterial: { PT: 'Nenhum material selecionado.', EN: 'No material selected.', ES: 'Ningún material seleccionado.' },
  bulletList: { PT: 'Lista com marcadores', EN: 'Bullet list', ES: 'Lista con viñetas' },
  dashList: { PT: 'Lista com traços', EN: 'Dash list', ES: 'Lista con guiones' },
  numberedList: { PT: 'Lista numerada', EN: 'Numbered list', ES: 'Lista numerada' },
  blockquote: { PT: 'Citação', EN: 'Blockquote', ES: 'Cita' },
  checklist: { PT: 'Lista de verificação', EN: 'Checklist', ES: 'Lista de verificación' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'Salvo', EN: 'Saved', ES: 'Guardado' },
  placeholder: { PT: 'Escreva suas anotações aqui...', EN: 'Write your notes here...', ES: 'Escriba sus notas aquí...' },
};

const HIGHLIGHT_COLORS = [
  { value: '', label: { PT: 'Nenhum', EN: 'None', ES: 'Ninguno' } },
  { value: 'yellow', label: { PT: 'Amarelo', EN: 'Yellow', ES: 'Amarillo' } },
  { value: 'cyan', label: { PT: 'Ciano', EN: 'Cyan', ES: 'Cian' } },
  { value: '#00ff00', label: { PT: 'Verde', EN: 'Green', ES: 'Verde' } },
];

const TEXT_COLORS = [
  { value: '#374151', label: 'Default' },
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
];

const BLOCK_STYLES = [
  { tag: 'h1', label: { PT: 'Título 1', EN: 'Heading 1', ES: 'Título 1' } },
  { tag: 'h2', label: { PT: 'Título 2', EN: 'Heading 2', ES: 'Título 2' } },
  { tag: 'h3', label: { PT: 'Título 3', EN: 'Heading 3', ES: 'Título 3' } },
  { tag: 'p', label: { PT: 'Parágrafo', EN: 'Paragraph', ES: 'Párrafo' } },
] as const;

function execCmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function PreacherNotes({ materialId }: PreacherNotesProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [textColor, setTextColor] = useState('#374151');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef({ content: '', textColor: '#374151' });
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!user || !materialId) {
      if (editorRef.current) editorRef.current.innerHTML = '';
      setTextColor('#374151');
      setNoteId(null);
      setHasContent(false);
      setSaveStatus('idle');
      return;
    }

    let cancelled = false;
    isLoadingRef.current = true;
    (async () => {
      const { data } = await supabase
        .from('sermon_notes' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('material_id', materialId)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        if (editorRef.current) editorRef.current.innerHTML = data.content || '';
        setTextColor(data.text_color || '#374151');
        setNoteId(data.id);
        setHasContent(!!(data.content?.trim()));
        lastSavedRef.current = { content: data.content || '', textColor: data.text_color || '#374151' };
      } else {
        if (editorRef.current) editorRef.current.innerHTML = '';
        setTextColor('#374151');
        setNoteId(null);
        setHasContent(false);
        lastSavedRef.current = { content: '', textColor: '#374151' };
      }
      setSaveStatus('idle');
      isLoadingRef.current = false;
    })();

    return () => { cancelled = true; };
  }, [user, materialId]);

  const saveNote = useCallback(async (html: string, color: string) => {
    if (!user || !materialId) return;
    if (html === lastSavedRef.current.content && color === lastSavedRef.current.textColor) return;

    setSaveStatus('saving');
    try {
      if (noteId) {
        await supabase.from('sermon_notes' as any).update({ content: html, text_color: color }).eq('id', noteId);
      } else {
        const { data } = await supabase
          .from('sermon_notes' as any)
          .insert({ user_id: user.id, material_id: materialId, content: html, text_color: color })
          .select('id')
          .single();
        if (data) setNoteId(data.id);
      }
      lastSavedRef.current = { content: html, textColor: color };
      setSaveStatus('saved');
    } catch {
      setSaveStatus('idle');
    }
  }, [user, materialId, noteId]);

  const triggerSave = useCallback(() => {
    if (isLoadingRef.current) return;
    const html = editorRef.current?.innerHTML || '';
    setHasContent(!!html.replace(/<[^>]*>/g, '').trim());
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(html, textColor), 1500);
  }, [saveNote, textColor]);

  const handleColorChange = (color: string) => {
    setTextColor(color);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const html = editorRef.current?.innerHTML || '';
    debounceRef.current = setTimeout(() => saveNote(html, color), 500);
  };

  const handleClear = async () => {
    if (editorRef.current) editorRef.current.innerHTML = '';
    setHasContent(false);
    if (noteId) {
      await supabase.from('sermon_notes' as any).delete().eq('id', noteId);
      setNoteId(null);
      lastSavedRef.current = { content: '', textColor };
      setSaveStatus('idle');
      toast.success(lang === 'PT' ? 'Notas limpas' : lang === 'ES' ? 'Notas borradas' : 'Notes cleared');
    }
  };

  const applyBlockStyle = (tag: string) => {
    editorRef.current?.focus();
    execCmd('formatBlock', tag);
    triggerSave();
  };

  const applyHighlight = (color: string) => {
    editorRef.current?.focus();
    if (!color) {
      execCmd('removeFormat');
    } else {
      execCmd('hiliteColor', color);
    }
    triggerSave();
  };

  const toggleFormat = (cmd: string) => {
    editorRef.current?.focus();
    execCmd(cmd);
    triggerSave();
  };

  const insertList = (type: 'ul' | 'ol') => {
    editorRef.current?.focus();
    execCmd(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    triggerSave();
  };

  const insertBlockquote = () => {
    editorRef.current?.focus();
    execCmd('formatBlock', 'blockquote');
    triggerSave();
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    const id = \`chk-\${Date.now()}\`;
    const html = \`<div class="checklist-item"><input type="checkbox" id="\${id}" class="checklist-item_input"/><label for="\${id}"> </label></div>\`;
    execCmd('insertHTML', html);
    const label = editorRef.current?.querySelector(\`label[for="\${id}"]\`) as HTMLElement | null;
    if (label) {
      const range = document.createRange();
      range.selectNodeContents(label);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    triggerSave();
  };

  const handleAnalyze = async () => {
    const html = editorRef.current?.innerHTML || '';
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim();
    if (!plainText || plainText.length < 20) {
      toast.warning(lang === 'PT' ? 'Escreva mais conteúdo para analisar.' : lang === 'ES' ? 'Escriba más contenido para analizar.' : 'Write more content to analyze.');
      return;
    }
    setIsAnalyzing(true);
    setShowAnalysis(true);
    setAnalysisResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-notes', {
        body: { notes_text: plainText, language: lang },
      });
      if (error) throw error;
      if (data?.error === 'rate_limit') { toast.error(lang === 'PT' ? 'Limite de requisições. Tente novamente.' : 'Rate limited. Try again.'); return; }
      if (data?.error === 'payment_required') { toast.error(lang === 'PT' ? 'Créditos insuficientes.' : 'Insufficient credits.'); return; }
      setAnalysisResult(data?.analysis || '');
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao analisar.' : lang === 'ES' ? 'Error al analizar.' : 'Analysis error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!materialId) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
        {labels.noMaterial[lang]}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border shadow-sm pb-10">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/20 flex-wrap sticky top-0 z-10">
        <button onClick={() => toggleFormat('bold')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => toggleFormat('italic')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => toggleFormat('underline')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Underline">
          <Underline className="w-4 h-4" />
        </button>
        <button onClick={() => toggleFormat('strikeThrough')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="relative group">
          <button className="p-1.5 rounded hover:bg-accent transition-colors flex items-center" title="Highlight">
            <Highlighter className="w-4 h-4" />
          </button>
          <div className="absolute top-full left-0 mt-1 bg-popover border shadow-md rounded p-1 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 flex flex-col gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button key={c.value} onClick={() => applyHighlight(c.value)} className="text-left px-2 py-1 text-xs hover:bg-accent rounded flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.value || "transparent" }}></span>
                {c.label[lang as keyof typeof c.label] || c.label.EN}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="relative group">
          <button className="p-1.5 rounded hover:bg-accent transition-colors flex items-center gap-1" title="Color">
            <div className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: textColor }}></div>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-popover border shadow-md rounded p-1 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 flex flex-col gap-1">
            {TEXT_COLORS.map((c) => (
              <button key={c.value} onClick={() => handleColorChange(c.value)} className="text-left px-2 py-1 text-xs hover:bg-accent rounded flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.value }}></span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="relative group">
          <button className="p-1.5 rounded hover:bg-accent transition-colors flex items-center" title="Typography">
            <Type className="w-4 h-4" />
          </button>
          <div className="absolute top-full left-0 mt-1 bg-popover border shadow-md rounded p-1 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 flex flex-col gap-1">
            {BLOCK_STYLES.map((style) => (
              <button key={style.tag} onClick={() => applyBlockStyle(style.tag)} className="text-left px-2 py-1 text-xs hover:bg-accent rounded">
                <span className={\`\${style.tag === 'h1' ? 'font-bold text-base' : style.tag === 'h2' ? 'font-semibold text-sm' : ''}\`}>{style.label[lang as keyof typeof style.label] || style.label.EN}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-px h-4 bg-border mx-1" />

        <button onClick={() => insertList('ul')} className="p-1.5 rounded hover:bg-accent transition-colors" title={labels.bulletList[lang as keyof typeof labels.bulletList]}>
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => insertList('ol')} className="p-1.5 rounded hover:bg-accent transition-colors" title={labels.numberedList[lang as keyof typeof labels.numberedList]}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <button onClick={insertBlockquote} className="p-1.5 rounded hover:bg-accent transition-colors" title={labels.blockquote[lang as keyof typeof labels.blockquote]}>
          <Quote className="w-4 h-4" />
        </button>
        <button onClick={insertChecklist} className="p-1.5 rounded hover:bg-accent transition-colors" title={labels.checklist[lang as keyof typeof labels.checklist]}>
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {hasContent && (
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
            {isAnalyzing ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Wand2 className="w-3.5 h-3.5" />}
            {lang === 'PT' ? 'Analisar' : lang === 'ES' ? 'Analizar' : 'Analyze'}
          </button>
        )}
        
        {saveStatus === 'saving' && (
          <span className="text-xs text-muted-foreground mr-2 animate-pulse">{labels.saving[lang as keyof typeof labels.saving]}</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-2">{labels.saved[lang as keyof typeof labels.saved]}</span>
        )}
        
        {hasContent && (
          <button onClick={handleClear} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1" title="Clear">
             <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onInput={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
            setTimeout(triggerSave, 50);
          }
          triggerSave();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const sel = window.getSelection();
            let node = sel?.anchorNode as HTMLElement | null;
            while (node && node !== editorRef.current) {
              if (node.classList?.contains('checklist-item')) {
                e.preventDefault();
                insertChecklist();
                return;
              }
              node = node.parentElement;
            }
          }
        }}
        data-placeholder={labels.placeholder[lang as keyof typeof labels.placeholder]}
        className="flex-1 p-4 outline-none text-sm leading-relaxed overflow-y-auto
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50 [&:empty]:before:pointer-events-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-muted-foreground [&_h3]:my-1.5
          [&_pre]:font-mono [&_pre]:text-sm [&_pre]:bg-muted/50 [&_pre]:rounded [&_pre]:p-2 [&_pre]:my-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:my-0.5
          [&_.checklist-item]:flex [&_.checklist-item]:items-center [&_.checklist-item]:gap-1.5 [&_.checklist-item]:my-1
          [&_.checklist-item_input:checked+label]:line-through [&_.checklist-item_input:checked+label]:text-muted-foreground"
        style={{ color: textColor }}
      />

      {showAnalysis && (
        <div className="border-t bg-muted/10 p-4 relative animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              {lang === 'PT' ? 'Análise IA' : lang === 'ES' ? 'Análisis IA' : 'AI Analysis'}
            </h4>
            <button onClick={() => setShowAnalysis(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Fechar
            </button>
          </div>
          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pr-6 max-h-[200px] overflow-y-auto custom-scrollbar">
            {isAnalyzing ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Wand2 className="w-3 h-3 animate-spin" />
                {lang === 'PT' ? 'Analisando suas anotações...' : lang === 'ES' ? 'Analizando sus notas...' : 'Analyzing your notes...'}
              </span>
            ) : analysisResult ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {analysisResult}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
