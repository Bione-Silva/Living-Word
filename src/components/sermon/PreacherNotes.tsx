import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, Trash2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Minus, Quote, ChevronDown, Highlighter, CheckSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type L = 'PT' | 'EN' | 'ES';

const TEXT_COLORS = [
  { value: '#374151', label: 'Cinza' },
  { value: '#1E40AF', label: 'Azul' },
  { value: '#15803D', label: 'Verde' },
  { value: '#DC2626', label: 'Vermelho' },
  { value: '#92400E', label: 'Marrom' },
  { value: '#D4A853', label: 'Dourado' },
];

const HIGHLIGHT_COLORS = [
  { value: '', label: { PT: 'Nenhum', EN: 'None', ES: 'Ninguno' }, bg: 'transparent' },
  { value: '#F3E8FF', label: { PT: 'Roxo', EN: 'Purple', ES: 'Púrpura' }, bg: '#F3E8FF', dot: '#A855F7' },
  { value: '#FFE4E6', label: { PT: 'Rosa', EN: 'Pink', ES: 'Rosa' }, bg: '#FFE4E6', dot: '#F43F5E' },
  { value: '#FFEDD5', label: { PT: 'Laranja', EN: 'Orange', ES: 'Naranja' }, bg: '#FFEDD5', dot: '#F97316' },
  { value: '#D1FAE5', label: { PT: 'Menta', EN: 'Mint', ES: 'Menta' }, bg: '#D1FAE5', dot: '#34D399' },
  { value: '#DBEAFE', label: { PT: 'Azul', EN: 'Blue', ES: 'Azul' }, bg: '#DBEAFE', dot: '#3B82F6' },
  { value: '#FEF9C3', label: { PT: 'Amarelo', EN: 'Yellow', ES: 'Amarillo' }, bg: '#FEF9C3', dot: '#EAB308' },
];

const BLOCK_STYLES = [
  { tag: 'h1', label: { PT: 'Título', EN: 'Title', ES: 'Título' }, className: 'text-2xl font-bold' },
  { tag: 'h2', label: { PT: 'Cabeçalho', EN: 'Heading', ES: 'Encabezado' }, className: 'text-xl font-bold' },
  { tag: 'h3', label: { PT: 'Subtítulo', EN: 'Subtitle', ES: 'Subtítulo' }, className: 'text-lg font-semibold text-muted-foreground' },
  { tag: 'p', label: { PT: 'Corpo', EN: 'Body', ES: 'Cuerpo' }, className: 'text-sm' },
  { tag: 'pre', label: { PT: 'Estilo Fixo', EN: 'Monospace', ES: 'Estilo Fijo' }, className: 'font-mono text-sm' },
];

const labels = {
  placeholder: { PT: 'Escreva suas anotações pessoais...', EN: 'Write your personal notes...', ES: 'Escriba sus notas personales...' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'Salvo', EN: 'Saved', ES: 'Guardado' },
  clear: { PT: 'Limpar', EN: 'Clear', ES: 'Limpiar' },
  noMaterial: { PT: 'Selecione ou gere um material para anotar.', EN: 'Select or generate content to take notes.', ES: 'Seleccione o genere un material para anotar.' },
  bulletList: { PT: 'Lista com Marcadores', EN: 'Bullet List', ES: 'Lista con Viñetas' },
  dashList: { PT: 'Lista com Travessões', EN: 'Dash List', ES: 'Lista con Guiones' },
  numberedList: { PT: 'Lista Numerada', EN: 'Numbered List', ES: 'Lista Numerada' },
  blockquote: { PT: 'Citação em Bloco', EN: 'Block Quote', ES: 'Cita en Bloque' },
  checklist: { PT: 'Lista de Tarefas', EN: 'Checklist', ES: 'Lista de Tareas' },
} satisfies Record<string, Record<L, string>>;

interface PreacherNotesProps {
  materialId: string | null;
}

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
  const editorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef({ content: '', textColor: '#374151' });
  const isLoadingRef = useRef(false);

  // Load note
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
        .from('sermon_notes')
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
        await supabase.from('sermon_notes').update({ content: html, text_color: color }).eq('id', noteId);
      } else {
        const { data } = await supabase
          .from('sermon_notes')
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
      await supabase.from('sermon_notes').delete().eq('id', noteId);
      setNoteId(null);
      lastSavedRef.current = { content: '', textColor };
      setSaveStatus('idle');
      toast.success(lang === 'PT' ? 'Notas limpas' : lang === 'ES' ? 'Notas borradas' : 'Notes cleared');
    }
  };

  const applyBlockStyle = (tag: string) => {
    editorRef.current?.focus();
    if (tag === 'pre') {
      execCmd('formatBlock', 'pre');
    } else {
      execCmd('formatBlock', tag);
    }
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

  // Current block style label
  const getCurrentBlockLabel = (): string => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return BLOCK_STYLES[3].label[lang]; // Body
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        const match = BLOCK_STYLES.find(s => s.tag === tag);
        if (match) return match.label[lang];
      }
      node = node.parentNode;
    }
    return BLOCK_STYLES[3].label[lang];
  };

  if (!materialId) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-muted-foreground text-center px-4">{labels.noMaterial[lang]}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30">
        {/* Inline formatting */}
        <button onClick={() => toggleFormat('bold')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => toggleFormat('italic')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => toggleFormat('underline')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => toggleFormat('strikeThrough')} className="p-1.5 rounded hover:bg-accent transition-colors" title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Highlight color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-accent transition-colors" title="Highlight">
              <Highlighter className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {HIGHLIGHT_COLORS.map((c) => (
              <DropdownMenuItem key={c.value || 'none'} onClick={() => applyHighlight(c.value)} className="gap-2 text-xs">
                <span className="w-3 h-3 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: c.dot || 'transparent' }} />
                {c.label[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-accent transition-colors flex items-center gap-0.5">
              <span className="w-3.5 h-3.5 rounded-full border border-border/50" style={{ backgroundColor: textColor }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[100px]">
            {TEXT_COLORS.map((c) => (
              <DropdownMenuItem key={c.value} onClick={() => handleColorChange(c.value)} className="gap-2 text-xs">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.value }} />
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Block style dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors text-xs font-medium text-muted-foreground">
              Aa <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            {BLOCK_STYLES.map((style) => (
              <DropdownMenuItem key={style.tag} onClick={() => applyBlockStyle(style.tag)} className="py-1.5">
                <span className={style.className}>{style.label[lang]}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => insertList('ul')} className="gap-2 text-xs">
              <List className="h-3.5 w-3.5" /> {labels.bulletList[lang]}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              editorRef.current?.focus();
              // Insert dash list as UL with custom style
              execCmd('insertUnorderedList');
              // Apply dash style via CSS class
              const sel = window.getSelection();
              if (sel?.anchorNode) {
                let node: Node | null = sel.anchorNode;
                while (node && node !== editorRef.current) {
                  if (node.nodeType === 1 && (node as HTMLElement).tagName === 'UL') {
                    (node as HTMLElement).style.listStyleType = '"– "';
                    break;
                  }
                  node = node.parentNode;
                }
              }
              triggerSave();
            }} className="gap-2 text-xs">
              <Minus className="h-3.5 w-3.5" /> {labels.dashList[lang]}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertList('ol')} className="gap-2 text-xs">
              <ListOrdered className="h-3.5 w-3.5" /> {labels.numberedList[lang]}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={insertBlockquote} className="gap-2 text-xs">
              <Quote className="h-3.5 w-3.5" /> {labels.blockquote[lang]}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer + status */}
        <div className="flex-1" />
        <div className="flex items-center gap-2 shrink-0">
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
          {hasContent && (
            <button onClick={handleClear} className="text-muted-foreground hover:text-destructive transition-colors" title={labels.clear[lang]}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Rich editor ── */}
      <div className="flex-1 overflow-y-auto p-3">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={triggerSave}
          onBlur={triggerSave}
          data-placeholder={labels.placeholder[lang]}
          className="min-h-[200px] outline-none text-sm leading-relaxed
            [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50 [&:empty]:before:pointer-events-none
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-muted-foreground [&_h3]:my-1.5
            [&_pre]:font-mono [&_pre]:text-sm [&_pre]:bg-muted/50 [&_pre]:rounded [&_pre]:p-2 [&_pre]:my-2
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
            [&_li]:my-0.5"
          style={{ color: textColor }}
        />
      </div>
    </div>
  );
}
