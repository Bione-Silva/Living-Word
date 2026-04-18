import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Trash2, Plus, History, Copy, Share2, FileText, Image, RefreshCw, BookOpen, Save, Presentation, Mic, Sparkles, PenLine, Layers, Zap, MonitorPlay } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadHistory, saveMessage } from '@/hooks/useChatHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { SermonSlidesModal } from '@/components/sermon/SermonSlidesModal';
import { PodiumModeModal } from '@/components/sermon/PodiumModeModal';
import { BibleDrawer } from '@/components/BibleDrawer';
import { parseBibleUri, parseBibleRefString, type ParsedBibleRef } from '@/lib/bible-ref-parser';
import { versionToApiCode, versionAbbrToCode } from '@/lib/bible-data';
import { PreacherNotes } from '@/components/sermon/PreacherNotes';
import { SermonBlockEditor, blocksToMarkdown, type SermonBlockData } from '@/components/sermon/SermonBlockEditor';
import { exportSermonToPptx } from '@/lib/sermon-pptx';

type L = 'PT' | 'EN' | 'ES';

const AGENT_ID = 'sermon_generator';

/* ═══ Filter chip data ═══ */
const preachingTypes = [
  { PT: 'Expositivo', EN: 'Expository', ES: 'Expositivo' },
  { PT: 'Temático', EN: 'Thematic', ES: 'Temático' },
  { PT: 'Narrativo', EN: 'Narrative', ES: 'Narrativo' },
  { PT: 'Textual', EN: 'Textual', ES: 'Textual' },
  { PT: 'Biográfico', EN: 'Biographical', ES: 'Biográfico' },
  { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  { PT: 'Apologético', EN: 'Apologetic', ES: 'Apologético' },
];

const audiences = [
  { PT: 'Geral', EN: 'General', ES: 'General' },
  { PT: 'Jovens', EN: 'Youth', ES: 'Jóvenes' },
  { PT: 'Adultos', EN: 'Adults', ES: 'Adultos' },
  { PT: 'Homens', EN: 'Men', ES: 'Hombres' },
  { PT: 'Mulheres', EN: 'Women', ES: 'Mujeres' },
  { PT: 'Casais', EN: 'Couples', ES: 'Parejas' },
  { PT: 'Líderes', EN: 'Leaders', ES: 'Líderes' },
  { PT: 'Crianças', EN: 'Children', ES: 'Niños' },
];

const durations = ['15 min', '30 min', '45 min', '1 hora'];

const preachingStyles = [
  { PT: 'Contemporâneo', EN: 'Contemporary', ES: 'Contemporáneo' },
  { PT: 'Pentecostal', EN: 'Pentecostal', ES: 'Pentecostal' },
  { PT: 'Reformado', EN: 'Reformed', ES: 'Reformado' },
  { PT: 'Tradicional', EN: 'Traditional', ES: 'Tradicional' },
  { PT: 'Evangelístico', EN: 'Evangelistic', ES: 'Evangelístico' },
  { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
  { PT: 'Profético', EN: 'Prophetic', ES: 'Profético' },
];

const tones = [
  { PT: 'Equilibrado', EN: 'Balanced', ES: 'Equilibrado' },
  { PT: 'Intenso', EN: 'Intense', ES: 'Intenso' },
  { PT: 'Reflexivo', EN: 'Reflective', ES: 'Reflexivo' },
  { PT: 'Motivacional', EN: 'Motivational', ES: 'Motivacional' },
];

const topicSuggestions: Record<L, string[]> = {
  PT: [
    'A fé que vence o medo', 'O poder da oração persistente', 'Graça que transforma vidas',
    'Identidade e propósito em Cristo', 'Superando a ansiedade pela fé', 'O amor incondicional de Deus',
    'Avivamento e renovação espiritual', 'A armadura de Deus para tempos difíceis',
    'Perdão: libertando o coração', 'O fruto do Espírito na vida diária',
  ],
  EN: [
    'Faith that overcomes fear', 'The power of persistent prayer', 'Grace that transforms lives',
    'Identity and purpose in Christ', 'Overcoming anxiety through faith', 'God\'s unconditional love',
    'Revival and spiritual renewal', 'The armor of God for hard times',
    'Forgiveness: freeing the heart', 'The fruit of the Spirit in daily life',
  ],
  ES: [
    'La fe que vence el miedo', 'El poder de la oración persistente', 'Gracia que transforma vidas',
    'Identidad y propósito en Cristo', 'Superando la ansiedad por la fe', 'El amor incondicional de Dios',
    'Avivamiento y renovación espiritual', 'La armadura de Dios para tiempos difíciles',
    'Perdón: liberando el corazón', 'El fruto del Espíritu en la vida diaria',
  ],
};

const labels = {
  title: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  breadcrumb: { PT: 'Ferramentas', EN: 'Tools', ES: 'Herramientas' },
  subtitle: {
    PT: 'Crie esboços completos de sermões, estruture suas mensagens com introdução, desenvolvimento e aplicação prática. IA especializada em homilética.',
    EN: 'Create complete sermon outlines, structure your messages with introduction, development and practical application. AI specialized in homiletics.',
    ES: 'Cree bosquejos completos de sermones, estructure sus mensajes con introducción, desarrollo y aplicación práctica. IA especializada en homilética.',
  },
  preachingType: { PT: '📋 TIPO DE PREGAÇÃO', EN: '📋 PREACHING TYPE', ES: '📋 TIPO DE PREDICACIÓN' },
  audience: { PT: '👥 PÚBLICO-ALVO', EN: '👥 AUDIENCE', ES: '👥 PÚBLICO OBJETIVO' },
  duration: { PT: '⏱️ DURAÇÃO', EN: '⏱️ DURATION', ES: '⏱️ DURACIÓN' },
  style: { PT: 'ESTILO DE PREGAÇÃO', EN: 'PREACHING STYLE', ES: 'ESTILO DE PREDICACIÓN' },
  tone: { PT: 'TOM DA MENSAGEM', EN: 'MESSAGE TONE', ES: 'TONO DEL MENSAJE' },
  suggestions: { PT: '✨ SUGESTÕES DE TEMA', EN: '✨ TOPIC SUGGESTIONS', ES: '✨ SUGERENCIAS DE TEMA' },
  topicPlaceholder: { PT: 'Digite o tema ou passagem bíblica...', EN: 'Enter topic or Bible passage...', ES: 'Escriba el tema o pasaje bíblico...' },
  generate: { PT: 'Gerar Sermão', EN: 'Generate Sermon', ES: 'Generar Sermón' },
  generating: { PT: 'Gerando sermão...', EN: 'Generating sermon...', ES: 'Generando sermón...' },
  history: { PT: 'HISTÓRICO RECENTE', EN: 'RECENT HISTORY', ES: 'HISTORIAL RECIENTE' },
  newSermon: { PT: 'NOVO SERMÃO', EN: 'NEW SERMON', ES: 'NUEVO SERMÓN' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  sendWpp: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  carousel: { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
  slides: { PT: 'Slides', EN: 'Slides', ES: 'Diapositivas' },
  pdf: { PT: 'PDF', EN: 'PDF', ES: 'PDF' },
  regenerate: { PT: 'Regenerar', EN: 'Regenerate', ES: 'Regenerar' },
  save: { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  saved: { PT: 'Salvo!', EN: 'Saved!', ES: '¡Guardado!' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  noSermons: { PT: 'Nenhum sermão criado ainda.', EN: 'No sermons created yet.', ES: 'Ningún sermón creado aún.' },
  backToForm: { PT: '← Novo Sermão', EN: '← New Sermon', ES: '← Nuevo Sermón' },
} satisfies Record<string, Record<L, string>>;

function buildSystemPrompt(
  lang: L,
  userName: string | undefined,
  selections: { preachingType: string | null; audience: string | null; duration: string | null; style: string | null; tone: string | null },
) {
  const langFull = lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese';
  const parts: string[] = [];
  parts.push(`You are an expert Christian homiletician, trained to create complete, deep, pastoral sermons.`);
  parts.push(`You are the "Sermon Generator" of Living Word.`);
  if (userName) parts.push(`The pastor's name is ${userName}.`);

  parts.push(`\nUSER PREFERENCES (respect strictly):`);
  if (selections.preachingType) parts.push(`- Preaching type: ${selections.preachingType}`);
  if (selections.audience) parts.push(`- Target audience: ${selections.audience}`);
  if (selections.duration) parts.push(`- Estimated duration: ${selections.duration}`);
  if (selections.style) parts.push(`- Preaching style: ${selections.style}`);
  if (selections.tone) parts.push(`- Message tone: ${selections.tone}`);

  parts.push(`\nMANDATORY SERMON STRUCTURE (use Markdown):`);
  parts.push(`1. **# Title** — creative and memorable`);
  parts.push(`2. **Text-base:** with the main biblical passage as a clickable reference`);
  parts.push(`3. **> Blockquote** — the full biblical text quoted in italics`);
  parts.push(`4. **## 🚀 Introduction** — hook, contextualization, central thesis`);
  parts.push(`5. **## Main Points** (3-4 points), each with:`);
  parts.push(`   - Bold subtitle (e.g. **Love: The Essence of the Fruit**)`);
  parts.push(`   - Detailed exposition of the biblical text`);
  parts.push(`   - Practical illustration or real-life example`);
  parts.push(`   - Supporting verse references written as clickable links`);
  parts.push(`   - Use cross (†) dividers between major sections`);
  parts.push(`6. **## ✨ Practical Applications** — bullet list with bold labels`);
  parts.push(`7. **## 🌹 Conclusion** — summary, appeal, closing prayer`);

  parts.push(`\nBIBLE REFERENCES — CRITICAL RULES:`);
  parts.push(`- Write ALL Bible references as Markdown links: [Book Chapter:Verse (VERSION)](bible://Book/Chapter/Verse)`);
  parts.push(`- ALWAYS include the Bible version in parentheses: (ARA), (NVI), (ESV), (KJV), etc.`);
  parts.push(`- Examples: [Gálatas 5:22-23 (ARA)](bible://Galatas/5/22-23), [John 14:27 (ESV)](bible://John/14/27), [Tiago 1:2-4 (ARA)](bible://Tiago/1/2-4)`);
  parts.push(`- Use the book names in ${langFull}`);
  parts.push(`- NEVER write a verse reference without making it a link`);
  parts.push(`- NEVER write a verse reference without the Bible version in parentheses`);

  parts.push(`\nFORMATTING RULES:`);
  parts.push(`- Respond ALWAYS in rich Markdown`);
  parts.push(`- Use ONLY real Bible verses. Never invent references.`);
  parts.push(`- The sermon must have at least 1000 words for depth.`);
  parts.push(`- Use blockquotes (>) for the main text citation.`);
  parts.push(`- Use horizontal dividers or cross symbols (†) between major sections.`);
  parts.push(`- Bold key phrases for emphasis and scannability.`);
  parts.push(`- Respond in ${langFull}.`);

  return parts.join('\n');
}

interface SermonSession {
  id: string;
  title: string;
  content: string;
  passage: string;
  date: string;
}

function ChipGroup({ items, selected, onSelect, lang }: { items: Record<L, string>[] | string[]; selected: string | null; onSelect: (val: string | null) => void; lang: L }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => {
        const label = typeof item === 'string' ? item : item[lang];
        const isActive = selected === label;
        return (
          <button
            key={i}
            onClick={() => onSelect(isActive ? null : label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══ Markdown → clean HTML for PDF ═══ */
function markdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/\[([^\]]+)\]\(bible:\/\/[^)]+\)/g, '<strong style="color:#5B21B6;">$1</strong>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:18px 0 8px;color:#333;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:24px 0 10px;color:#222;border-left:3px solid #5B21B6;padding-left:10px;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;">$1</h1>');
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #6D28D9;padding:10px 16px;margin:16px 0;background:#FFFDF5;font-style:italic;color:#555;border-radius:0 6px 6px 0;">$1</blockquote>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:10px 0;padding-left:20px;list-style:disc;">${m}</ul>`);
  html = html.replace(/^---$/gm, '<div style="text-align:center;margin:20px 0;color:#6D28D9;font-size:14px;">✝</div>');
  html = html.replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.75;">');
  html = html.replace(/\n/g, '<br/>');
  return `<p style="margin:8px 0;line-height:1.75;">${html}</p>`;
}

export default function Sermoes() {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Form state
  const [topic, setTopic] = useState('');
  const [preachingType, setPreachingType] = useState<string | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>('30 min');
  const [style, setStyle] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);

  // Result state
  const [sermonContent, setSermonContent] = useState('');
  const [sermonTitle, setSermonTitle] = useState('');
  const [sermonTopic, setSermonTopic] = useState('');
  const [bibleDrawerOpen, setBibleDrawerOpen] = useState(false);
  const [bibleRef, setBibleRef] = useState<ParsedBibleRef | null>(null);
  const [bibleTranslationCode, setBibleTranslationCode] = useState<string | undefined>(undefined);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // History
  const [sessions, setSessions] = useState<SermonSession[]>([]);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'notes'>('history');

  // Modals
  const [slidesOpen, setSlidesOpen] = useState(false);
  const [podiumOpen, setPodiumOpen] = useState(false);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);

  // ─── Studio de Blocos ───
  const [editorMode, setEditorMode] = useState<'ai' | 'blocks'>('ai');
  const [blocks, setBlocks] = useState<SermonBlockData[]>([]);
  const [bigIdea, setBigIdea] = useState('');
  const [passageRef, setPassageRef] = useState('');

  // ─── Bridge: Série de Mensagens → Studio de Blocos ───
  // Aceita: ?mode=blocks&theme=...&passage=...&week=...&seriesTitle=...
  const [searchParams, setSearchParams] = useSearchParams();
  const bridgeApplied = useRef(false);
  useEffect(() => {
    if (bridgeApplied.current) return;
    const mode = searchParams.get('mode');
    const theme = searchParams.get('theme') || '';
    const passage = searchParams.get('passage') || '';
    const week = searchParams.get('week') || '';
    const seriesTitle = searchParams.get('seriesTitle') || '';
    if (mode !== 'blocks' && !theme && !passage && !week && !seriesTitle) return;
    bridgeApplied.current = true;

    if (mode === 'blocks') {
      setEditorMode('blocks');
      setShowResult(true);
    }
    if (theme) setBigIdea(theme);
    if (passage) setPassageRef(passage);

    // Pré-popula o primeiro bloco do tipo "main_point" com título contextual
    if (theme || week || seriesTitle) {
      const titleParts: string[] = [];
      if (seriesTitle) titleParts.push(seriesTitle);
      if (week) titleParts.push(`Semana ${week}`);
      if (theme && !seriesTitle) titleParts.push(theme);
      const blockTitle = titleParts.join(' — ');

      // Importa dinamicamente para evitar dependência circular
      import('@/components/sermon/sermon-block-types').then(({ createEmptyBlock }) => {
        setBlocks((prev) => {
          if (prev.length > 0) return prev;
          const seed = [];
          if (passage) {
            const passageBlock = createEmptyBlock('passage');
            passageBlock.title = passage;
            passageBlock.passageRef = passage;
            seed.push(passageBlock);
          }
          const mainBlock = createEmptyBlock('main_point');
          mainBlock.title = blockTitle || theme || 'Ponto principal';
          seed.push(mainBlock);
          return seed;
        });
      });
    }

    // Limpa os params para não re-aplicar em F5
    const next = new URLSearchParams(searchParams);
    ['mode', 'theme', 'passage', 'week', 'seriesTitle'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);


  const resultRef = useRef<HTMLDivElement>(null);

  const refreshSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('materials').select('id, title, content, passage, created_at').eq('user_id', user.id).eq('type', 'sermon').order('created_at', { ascending: false }).limit(20);
    if (data) {
      setSessions(data.map(d => ({
        id: d.id, title: d.title, content: d.content, passage: d.passage || '',
        date: new Date(d.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      })));
    }
  }, [user, lang]);

  useEffect(() => { refreshSessions(); }, [refreshSessions]);

  /* ═══ Generate sermon ═══ */
  const handleGenerate = async (topicText: string) => {
    if (!topicText.trim() || !user || loading) return;
    setLoading(true);
    setShowResult(true);
    setSermonContent('');
    setSermonTopic(topicText.trim());

    try {
      const systemPrompt = buildSystemPrompt(lang, profile?.full_name?.split(' ')[0], { preachingType, audience, duration, style, tone });
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: { systemPrompt, userPrompt: topicText.trim(), toolId: 'sermon-generator' },
      });
      if (error) throw error;
      const content = data?.content || (lang === 'PT' ? 'Desculpe, não consegui gerar o sermão.' : 'Sorry, could not generate the sermon.');
      setSermonContent(content);

      const titleMatch = content.match(/^#+\s*(.+)/m);
      const title = titleMatch?.[1]?.replace(/\*+/g, '').trim() || topicText.trim().slice(0, 60);
      setSermonTitle(title);

      // Save to DB
      const { data: insertedData } = await supabase.from('materials').insert({
        user_id: user.id, type: 'sermon', title, content, language: lang, passage: topicText.trim(),
      }).select('id').single();
      if (insertedData) setActiveSessionId(insertedData.id);

      // Also save to chat history for continuity
      await saveMessage(user.id, AGENT_ID, 'user', topicText.trim());
      await saveMessage(user.id, AGENT_ID, 'assistant', content);

      await refreshSessions();
    } catch {
      const errContent = lang === 'PT' ? 'Desculpe, ocorreu um erro. Tente novamente.' : lang === 'ES' ? 'Lo siento, ocurrió un error. Intenta de nuevo.' : 'Sorry, an error occurred. Please try again.';
      setSermonContent(errContent);
      setSermonTitle('Erro');
    } finally {
      setLoading(false);
    }
  };

  /* ═══ Restore a saved session (detecta JSON de blocos vs markdown puro) ═══ */
  const handleRestoreSession = (session: SermonSession) => {
    try {
      const parsed = JSON.parse(session.content);
      if (parsed && parsed._type === 'blocks') {
        setBlocks(parsed.blocks || []);
        setBigIdea(parsed.bigIdea || '');
        setPassageRef(parsed.passageRef || '');
        setSermonContent(parsed.markdown || blocksToMarkdown(parsed.blocks || [], lang));
        setSermonTitle(session.title);
        setSermonTopic(session.passage);
        setActiveSessionId(session.id);
        setEditorMode('blocks');
        setShowResult(true);
        setMobileHistoryOpen(false);
        return;
      }
    } catch { /* fallthrough — markdown puro */ }
    setSermonContent(session.content);
    setSermonTitle(session.title);
    setSermonTopic(session.passage);
    setActiveSessionId(session.id);
    setEditorMode('ai');
    setShowResult(true);
    setMobileHistoryOpen(false);
  };

  const handleNewSermon = () => {
    setShowResult(false);
    setSermonContent('');
    setSermonTitle('');
    setSermonTopic('');
    setActiveSessionId(null);
    setTopic('');
    setPreachingType(null);
    setAudience(null);
    setDuration('30 min');
    setStyle(null);
    setTone(null);
    setBlocks([]);
    setBigIdea('');
    setPassageRef('');
  };

  /* ─── Salvar sermão construído por blocos ─── */
  const handleSaveBlocks = async () => {
    if (!user || blocks.length === 0) return;
    const md = blocksToMarkdown(blocks, lang);
    const title = bigIdea.trim().slice(0, 80) || passageRef.trim().slice(0, 80) || (lang === 'PT' ? 'Sermão sem título' : 'Untitled sermon');
    const payload = JSON.stringify({ _type: 'blocks', blocks, bigIdea, passageRef, markdown: md });
    try {
      if (activeSessionId) {
        await (supabase as any).from('materials').update({ title, content: payload, passage: passageRef }).eq('id', activeSessionId);
      } else {
        const { data } = await (supabase as any).from('materials').insert({
          user_id: user.id, type: 'sermon', title, content: payload, language: lang, passage: passageRef,
        }).select('id').single();
        if (data) setActiveSessionId(data.id);
      }
      setSermonContent(md);
      setSermonTitle(title);
      toast.success(labels.saved[lang]);
      await refreshSessions();
    } catch (e) {
      toast.error('Erro ao salvar');
    }
  };

  const handleDeleteSession = async (id: string) => {
    await supabase.from('materials').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) handleNewSermon();
  };

  /* ═══ Action handlers ═══ */
  const handleCopy = async () => {
    if (!sermonContent) return;
    await navigator.clipboard.writeText(sermonContent);
    toast.success(labels.copied[lang]);
  };

  const handleSendWpp = () => {
    if (!sermonContent) return;
    const short = sermonContent.replace(/[#*_>`~\[\]()]/g, '').slice(0, 3000);
    openWhatsAppShare(short);
  };

  const handlePdf = async () => {
    if (!sermonContent) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const dateStr = new Date().toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    const platformLabel = lang === 'PT' ? 'Plataforma Pastoral com IA' : lang === 'ES' ? 'Plataforma Pastoral con IA' : 'AI Pastoral Platform';
    const el = document.createElement('div');
    el.innerHTML = `
<style>
  @page { margin: 20mm 15mm 25mm 15mm; }
  .pdf-page-header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #6D28D9; padding-bottom: 10px; margin-bottom: 24px;
  }
  .pdf-body h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: #111; page-break-after: avoid; }
  .pdf-body h2 { font-size: 17px; font-weight: 700; margin: 28px 0 10px; color: #222; border-left: 3px solid #5B21B6; padding-left: 10px; page-break-after: avoid; }
  .pdf-body h3 { font-size: 15px; font-weight: 700; margin: 18px 0 8px; color: #333; page-break-after: avoid; }
  .pdf-body blockquote { border-left: 3px solid #6D28D9; padding: 10px 16px; margin: 16px 0; background: #FFFDF5; font-style: italic; color: #555; border-radius: 0 6px 6px 0; page-break-inside: avoid; }
  .pdf-body p { margin: 8px 0; line-height: 1.8; font-size: 13px; }
  .pdf-body ul { margin: 10px 0; padding-left: 20px; list-style: disc; }
  .pdf-body li { margin: 4px 0; padding-left: 4px; font-size: 13px; line-height: 1.7; }
  .pdf-body strong { font-weight: 700; }
  .pdf-body em { font-style: italic; }
  .pdf-divider { text-align: center; margin: 24px 0; color: #6D28D9; font-size: 14px; page-break-after: avoid; }
  .pdf-footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E8E0D0; display: flex; align-items: center; justify-content: center; gap: 8px; }
</style>
<div style="font-family:'Georgia','Palatino Linotype',serif;max-width:680px;margin:0 auto;padding:0;color:#333;">
  <div class="pdf-page-header">
    <div>
      <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5B21B6;font-weight:700;">Living Word</span>
      <span style="font-size:10px;color:#999;margin-left:8px;">✝</span>
    </div>
    <span style="font-size:9px;color:#999;">${dateStr}</span>
  </div>
  <div class="pdf-body">
    ${markdownToHtml(sermonContent)}
  </div>
  <div class="pdf-footer">
    <span style="font-size:12px;color:#6D28D9;font-weight:700;">✝</span>
    <span style="font-size:10px;color:#999;letter-spacing:1.5px;font-weight:600;">LIVING WORD</span>
    <span style="font-size:10px;color:#ccc;">•</span>
    <span style="font-size:9px;color:#bbb;">${platformLabel}</span>
  </div>
</div>`;
    document.body.appendChild(el);
    await html2pdf().from(el).set({
      margin: [18, 12, 22, 12],
      filename: `${sermonTitle.slice(0, 40)}.pdf`,
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['h1', 'h2', 'h3', 'blockquote', '.pdf-divider'] },
    }).save();
    document.body.removeChild(el);
    toast.success('PDF!');
  };

  const handleSave = async () => {
    if (!sermonContent || !user) return;
    if (activeSessionId) {
      await supabase.from('materials').update({ content: sermonContent, title: sermonTitle }).eq('id', activeSessionId);
    } else {
      const { data } = await supabase.from('materials').insert({ user_id: user.id, type: 'sermon', title: sermonTitle, content: sermonContent, language: lang, passage: sermonTopic }).select('id').single();
      if (data) setActiveSessionId(data.id);
    }
    toast.success(labels.saved[lang]);
    await refreshSessions();
  };

  const handleRegenerate = () => {
    if (sermonTopic) handleGenerate(sermonTopic);
  };

  /* ═══ Bible reference click handler — parses URI and opens drawer with correct ref ═══ */
  const handleBibleClick = (uriPath: string, linkText?: string) => {
    const parsed = parseBibleUri(uriPath);
    if (parsed) {
      setBibleRef(parsed);
    } else {
      setBibleRef(null);
    }

    // Extract version from link text like "Gálatas 5:22-23 (ARA)" → "ARA"
    let translationCode: string | undefined;
    if (linkText) {
      const versionMatch = linkText.match(/\(([A-Z]{2,6})\)\s*$/);
      if (versionMatch) {
        translationCode = versionAbbrToCode(versionMatch[1]) || versionToApiCode(versionMatch[1]) || undefined;
      }
    }
    // Also check if parsed ref has a version from the URI itself
    if (!translationCode && parsed?.version) {
      translationCode = versionAbbrToCode(parsed.version) || versionToApiCode(parsed.version) || undefined;
    }
    setBibleTranslationCode(translationCode);
    setBibleDrawerOpen(true);
  };

  /* ═══ Custom markdown components ═══ */
  const markdownComponents = {
    a: ({ href, children, ...props }: any) => {
      // Extract plain text from children for version parsing
      const extractText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (node?.props?.children) return extractText(node.props.children);
        return '';
      };
      const linkText = extractText(children);

      if (href?.startsWith('bible://')) {
        const ref = href.replace('bible://', '');
        return (
          <button
            onClick={() => handleBibleClick(ref, linkText)}
            className="font-bold inline-flex items-center gap-0.5 cursor-pointer hover:underline"
            style={{ color: '#6D28D9' }}
            title={linkText || ref.replace(/\//g, ' ')}
            {...props}
          >
            📖 {children}
          </button>
        );
      }
      // Non-bible links — try to parse the text as a Bible reference
      return (
        <button
          onClick={() => {
            const parsed = parseBibleRefString(linkText);
            if (parsed) {
              setBibleRef(parsed);
              const tc = parsed.version ? versionAbbrToCode(parsed.version) || versionToApiCode(parsed.version) || undefined : undefined;
              setBibleTranslationCode(tc);
            } else {
              setBibleRef(null);
              setBibleTranslationCode(undefined);
            }
            setBibleDrawerOpen(true);
          }}
          className="font-bold inline-flex items-center gap-0.5 cursor-pointer hover:underline"
          style={{ color: '#6D28D9' }}
          {...props}
        >
          📖 {children}
        </button>
      );
    },
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-primary/40 pl-4 py-2 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground" {...props}>
        <span className="text-2xl text-primary/30 leading-none">"</span>
        {children}
      </blockquote>
    ),
    h1: ({ children, ...props }: any) => (
      <h1 className="text-xl md:text-2xl font-bold text-foreground font-display flex items-center gap-2 mb-2" {...props}>
        <BookOpen className="h-5 w-5 text-primary shrink-0" />
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-lg font-bold text-foreground mt-6 mb-2 flex items-center gap-2 border-l-3 border-primary pl-3" {...props}>
        {children}
      </h2>
    ),
    hr: () => (
      <div className="flex items-center justify-center my-6 text-muted-foreground/30">
        <div className="flex-1 h-px bg-border" />
        <span className="px-3 text-sm">✝</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-bold text-foreground" {...props}>{children}</strong>
    ),
  };

  const actionBtn = "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors";

  /* ═══ Session item renderer ═══ */
  const renderSessionItem = (s: SermonSession, showDelete = true) => (
    <div
      key={s.id}
      className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${activeSessionId === s.id ? 'bg-primary/5 border border-primary/20' : ''}`}
      onClick={() => handleRestoreSession(s)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{s.date}</p>
      </div>
      {showDelete && (
        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-4rem)] pb-28 md:pb-0">
      {/* ─── Main content area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">{labels.breadcrumb[lang]} / <span className="font-medium text-foreground">{labels.title[lang]}</span></p>
          </div>
          {isMobile && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setBibleRef(null); setBibleTranslationCode(undefined); setBibleDrawerOpen(true); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={lang === 'PT' ? 'Bíblia' : lang === 'ES' ? 'Biblia' : 'Bible'}
              >
                <BookOpen className="h-5 w-5" />
              </button>
              {showResult && activeSessionId && (
                <button onClick={() => setMobileNotesOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={lang === 'PT' ? 'Anotações' : lang === 'ES' ? 'Notas' : 'Notes'}>
                  <PenLine className="h-5 w-5" />
                </button>
              )}
              <button onClick={() => setMobileHistoryOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={lang === 'PT' ? 'Histórico' : lang === 'ES' ? 'Historial' : 'History'}>
                <History className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content: Form or Result */}
        <div ref={resultRef} className="flex-1 overflow-y-auto px-4 py-6">
          {!showResult ? (
            /* ═══ FORM VIEW ═══ */
            <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
              {/* Hero */}
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">{labels.title[lang]}</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">{labels.subtitle[lang]}</p>
              </div>

              {/* ─── Toggle: Gerar com IA  vs  Studio de Blocos ─── */}
              <div className="flex p-1 bg-muted/50 rounded-xl border border-border mb-6">
                <button
                  onClick={() => setEditorMode('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${editorMode === 'ai' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {lang === 'PT' ? 'Gerar com IA' : lang === 'ES' ? 'Generar con IA' : 'Generate with AI'}
                </button>
                <button
                  onClick={() => { setEditorMode('blocks'); setShowResult(true); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${editorMode === 'blocks' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {lang === 'PT' ? 'Studio de Blocos' : lang === 'ES' ? 'Studio de Bloques' : 'Block Studio'}
                </button>
              </div>


              {/* Options */}
              <div className="space-y-4">
                {/* Tipo de Pregação — full width */}
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">{labels.preachingType[lang]}</p>
                  <ChipGroup items={preachingTypes} selected={preachingType} onSelect={setPreachingType} lang={lang} />
                </div>

                {/* Público-Alvo + Duração — side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">{labels.audience[lang]}</p>
                    <ChipGroup items={audiences} selected={audience} onSelect={setAudience} lang={lang} />
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">{labels.duration[lang]}</p>
                    <ChipGroup items={durations} selected={duration} onSelect={setDuration} lang={lang} />
                  </div>
                </div>

                {/* Estilo + Tom — side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">{labels.style[lang]}</p>
                    <ChipGroup items={preachingStyles} selected={style} onSelect={setStyle} lang={lang} />
                  </div>
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">{labels.tone[lang]}</p>
                    <ChipGroup items={tones} selected={tone} onSelect={setTone} lang={lang} />
                  </div>
                </div>

                {/* Topic suggestions */}
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <p className="text-xs font-bold text-muted-foreground mb-3 tracking-wide">{labels.suggestions[lang]}</p>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions[lang].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${topic === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic input + Prompt preview + Generate button */}
                <div className="pt-2 space-y-3">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={labels.topicPlaceholder[lang]}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />

                  {/* Prompt preview — shows what will be sent to AI */}
                  {topic.trim() && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                      <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                        {lang === 'PT' ? '🧠 Prompt que será enviado à IA' : lang === 'ES' ? '🧠 Prompt que se enviará a la IA' : '🧠 Prompt that will be sent to AI'}
                      </p>
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        <span className="font-semibold">{lang === 'PT' ? 'Tema:' : lang === 'ES' ? 'Tema:' : 'Topic:'}</span> {topic.trim()}
                        {preachingType && <><br /><span className="font-semibold">{lang === 'PT' ? 'Tipo:' : lang === 'ES' ? 'Tipo:' : 'Type:'}</span> {preachingType}</>}
                        {audience && <><br /><span className="font-semibold">{lang === 'PT' ? 'Público:' : lang === 'ES' ? 'Público:' : 'Audience:'}</span> {audience}</>}
                        {duration && <><br /><span className="font-semibold">{lang === 'PT' ? 'Duração:' : lang === 'ES' ? 'Duración:' : 'Duration:'}</span> {duration}</>}
                        {style && <><br /><span className="font-semibold">{lang === 'PT' ? 'Estilo:' : lang === 'ES' ? 'Estilo:' : 'Style:'}</span> {style}</>}
                        {tone && <><br /><span className="font-semibold">{lang === 'PT' ? 'Tom:' : lang === 'ES' ? 'Tono:' : 'Tone:'}</span> {tone}</>}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleGenerate(topic)}
                    disabled={!topic.trim() || loading}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2.5 hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors font-semibold text-sm shadow-sm"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {labels.generating[lang]}</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> {labels.generate[lang]}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ═══ RESULT VIEW ═══ */
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              {/* Back to form */}
              <button
                onClick={handleNewSermon}
                className="text-xs text-primary hover:underline font-medium mb-4 inline-flex items-center gap-1"
              >
                {labels.backToForm[lang]}
              </button>

              {editorMode === 'blocks' ? (
                /* ─── STUDIO DE BLOCOS ─── */
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">💡 {lang === 'PT' ? 'Grande Ideia' : lang === 'ES' ? 'Gran Idea' : 'Big Idea'}</p>
                    <input
                      value={bigIdea}
                      onChange={(e) => setBigIdea(e.target.value)}
                      placeholder={lang === 'PT' ? 'A frase única que resume todo o sermão...' : lang === 'ES' ? 'La frase única que resume todo el sermón...' : 'The single sentence that summarizes the whole sermon...'}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      value={passageRef}
                      onChange={(e) => setPassageRef(e.target.value)}
                      placeholder={lang === 'PT' ? 'Passagem principal (ex: João 3:16)' : 'Main passage (e.g. John 3:16)'}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <SermonBlockEditor
                    blocks={blocks}
                    onChange={setBlocks}
                    bigIdea={bigIdea}
                    passageRef={passageRef}
                    topic={topic}
                    lang={lang}
                  />
                  {blocks.length > 0 && (
                    <div className="text-center pt-2 pb-24">
                      <button
                        onClick={() => { setBlocks([]); setBigIdea(''); setPassageRef(''); }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                      >
                        {lang === 'PT' ? 'Reiniciar com outro template' : lang === 'ES' ? 'Reiniciar con otra plantilla' : 'Restart with another template'}
                      </button>
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">{labels.generating[lang]}</p>
                  <div className="flex gap-1 mt-3">
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Sermon document */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
                    [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                    [&_h1]:text-xl [&_h1]:md:text-2xl [&_h1]:font-bold [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-l-3 [&_h2]:border-primary [&_h2]:pl-3
                    [&_ul]:space-y-2 [&_li]:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {sermonContent}
                    </ReactMarkdown>
                  </div>

                  {/* Action buttons */}
                  {sermonContent && (
                    <div className="flex flex-wrap gap-2 mt-6 mb-4 pt-4 border-t border-border justify-start animate-in fade-in duration-300">
                      <button onClick={handleSave} className={`${actionBtn} !border-primary/30 !bg-primary/5 !text-primary`}>
                        <Save className="h-3.5 w-3.5" /> {labels.save[lang]}
                      </button>
                      <button
                        onClick={() => setPodiumOpen(true)}
                        className={`${actionBtn} !border-amber-500/40 !bg-amber-500/10 !text-amber-700 dark:!text-amber-400`}
                      >
                        <MonitorPlay className="h-3.5 w-3.5" /> {lang === 'PT' ? 'Modo Púlpito' : lang === 'ES' ? 'Modo Púlpito' : 'Podium Mode'}
                      </button>
                      <button onClick={handleCopy} className={actionBtn}>
                        <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
                      </button>
                      <button onClick={handleSendWpp} className={actionBtn}>
                        <Share2 className="h-3.5 w-3.5" /> {labels.sendWpp[lang]}
                      </button>
                      <button
                        onClick={() => {
                          if (!sermonContent.trim()) {
                            toast.error(lang === 'PT' ? 'Gere o sermão antes' : lang === 'ES' ? 'Genere el sermón antes' : 'Generate the sermon first');
                            return;
                          }
                          navigate('/social-studio', {
                            state: {
                              source_content: sermonContent,
                              source_title: sermonTitle,
                              source_origin: 'sermon',
                            },
                          });
                        }}
                        className={actionBtn}
                      >
                        <Image className="h-3.5 w-3.5" /> {labels.carousel[lang]}
                      </button>
                      <button onClick={() => setSlidesOpen(true)} className={actionBtn}>
                        <Presentation className="h-3.5 w-3.5" /> {labels.slides[lang]}
                      </button>
                      <button onClick={handlePdf} className={actionBtn}>
                        <FileText className="h-3.5 w-3.5" /> {labels.pdf[lang]}
                      </button>
                      <button onClick={handleRegenerate} className={actionBtn}>
                        <RefreshCw className="h-3.5 w-3.5" /> {labels.regenerate[lang]}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right sidebar: history (desktop) ─── */}
      <aside className="hidden lg:flex flex-col w-72 border-l border-border bg-background shrink-0">
        {/* Tab bar */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setSidebarTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-bold tracking-wide transition-colors ${sidebarTab === 'history' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <History className="h-3.5 w-3.5" />
            {labels.history[lang]}
          </button>
          <button
            onClick={() => setSidebarTab('notes')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-bold tracking-wide transition-colors ${sidebarTab === 'notes' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <PenLine className="h-3.5 w-3.5" />
            {lang === 'PT' ? 'ANOTAÇÕES' : lang === 'ES' ? 'NOTAS' : 'NOTES'}
          </button>
        </div>

        {sidebarTab === 'history' ? (
          <>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sessions.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">{labels.noSermons[lang]}</p>}
                {sessions.map((s) => renderSessionItem(s))}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-border">
              <button onClick={handleNewSermon} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                <Plus className="h-3.5 w-3.5" /> {labels.newSermon[lang]}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <PreacherNotes materialId={activeSessionId} />
          </div>
        )}
      </aside>

      {/* ─── Mobile history sheet ─── */}
      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent side="bottom" className="theme-app max-h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-sm font-bold">{labels.history[lang]}</SheetTitle>
            <SheetDescription className="sr-only">{labels.history[lang]}</SheetDescription>
          </SheetHeader>
          <div className="space-y-1 mt-2 overflow-y-auto max-h-[50vh]">
            {sessions.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">{labels.noSermons[lang]}</p>}
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${activeSessionId === s.id ? 'bg-primary/5' : ''}`}
                onClick={() => handleRestoreSession(s)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.date}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <button onClick={() => { handleNewSermon(); setMobileHistoryOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
              <Plus className="h-3.5 w-3.5" /> {labels.newSermon[lang]}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Mobile notes drawer ─── */}
      <Sheet open={mobileNotesOpen} onOpenChange={setMobileNotesOpen}>
        <SheetContent side="bottom" className="theme-app max-h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" />
              {lang === 'PT' ? 'Anotações do Pregador' : lang === 'ES' ? 'Notas del Predicador' : 'Preacher Notes'}
            </SheetTitle>
            <SheetDescription className="sr-only">Preacher notes</SheetDescription>
          </SheetHeader>
          <div className="mt-2 overflow-y-auto max-h-[50vh]">
            <PreacherNotes materialId={activeSessionId} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Slides modal ─── */}
      <SermonSlidesModal
        open={slidesOpen}
        onOpenChange={setSlidesOpen}
        sermonMarkdown={sermonContent}
        sermonTitle={sermonTitle}
        materialId={activeSessionId}
      />
      <BibleDrawer
        open={bibleDrawerOpen}
        onOpenChange={setBibleDrawerOpen}
        initialBook={bibleRef?.bookId}
        initialChapter={bibleRef?.chapter}
        initialVerse={bibleRef?.verseStart}
        initialVerseEnd={bibleRef?.verseEnd}
        initialTranslation={bibleTranslationCode}
      />

      {/* ─── Modo Púlpito ─── */}
      <PodiumModeModal
        open={podiumOpen}
        onOpenChange={setPodiumOpen}
        sermonMarkdown={sermonContent || (blocks.length ? blocksToMarkdown(blocks, lang) : '')}
        sermonTitle={sermonTitle || bigIdea || 'Sermão'}
        durationLimitMinutes={duration?.match(/\d+/) ? parseInt(duration.match(/\d+/)![0]) : 30}
        materialId={activeSessionId}
        lang={lang}
      />
      {/* ─── ActionBar fixa inferior — só no Studio de Blocos ─── */}
      {editorMode === 'blocks' && showResult && blocks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
          {/* Mobile: horizontal scroll carousel; Desktop (sm+): wrap right-aligned */}
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap sm:justify-end scrollbar-hide [-webkit-overflow-scrolling:touch]">
            <button
              onClick={handleSaveBlocks}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors whitespace-nowrap"
            >
              <Save className="h-3.5 w-3.5" /> {labels.save[lang]}
            </button>
            <button
              onClick={() => setRawTextOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5" /> {lang === 'PT' ? 'Ver como texto' : lang === 'ES' ? 'Ver como texto' : 'View as text'}
            </button>
            <button
              onClick={() => { setSermonContent(blocksToMarkdown(blocks, lang)); setSermonTitle(bigIdea.trim() || passageRef.trim() || 'Sermão'); setPodiumOpen(true); }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              <MonitorPlay className="h-3.5 w-3.5" /> {lang === 'PT' ? 'Modo Púlpito' : lang === 'ES' ? 'Modo Púlpito' : 'Podium Mode'}
            </button>
            <button
              onClick={async () => {
                if (!blocks.length) {
                  toast.error(lang === 'PT' ? 'Adicione blocos primeiro' : lang === 'ES' ? 'Añada bloques primero' : 'Add blocks first');
                  return;
                }
                setExportingPptx(true);
                try {
                  const total = await exportSermonToPptx({
                    blocks,
                    title: bigIdea.trim() || passageRef.trim() || (lang === 'PT' ? 'Sermão' : lang === 'ES' ? 'Sermón' : 'Sermon'),
                    bigIdea,
                    passageRef,
                    lang,
                  });
                  toast.success(
                    lang === 'PT' ? `PPTX gerado com ${total} slides` :
                    lang === 'ES' ? `PPTX generado con ${total} diapositivas` :
                    `PPTX generated with ${total} slides`
                  );
                } catch (err) {
                  console.error('pptx export', err);
                  toast.error(lang === 'PT' ? 'Erro ao gerar PPTX' : lang === 'ES' ? 'Error al generar PPTX' : 'PPTX export error');
                } finally {
                  setExportingPptx(false);
                }
              }}
              disabled={exportingPptx}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {exportingPptx
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Presentation className="h-3.5 w-3.5" />}
              {lang === 'PT' ? 'Exportar PPTX' : lang === 'ES' ? 'Exportar PPTX' : 'Export PPTX'}
            </button>
            <button
              onClick={() => {
                const md = blocksToMarkdown(blocks, lang);
                if (!md.trim()) {
                  toast.error(lang === 'PT' ? 'Adicione conteúdo aos blocos primeiro' : lang === 'ES' ? 'Añada contenido primero' : 'Add content to blocks first');
                  return;
                }
                navigate('/social-studio', {
                  state: {
                    source_content: md,
                    source_title: bigIdea.trim() || passageRef.trim() || 'Sermão',
                    source_origin: 'sermon-blocks',
                  },
                });
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all bg-gradient-to-r from-primary via-purple-600 to-fuchsia-600 hover:scale-[1.02] whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" /> {lang === 'PT' ? 'Gerar Arte / Carrossel' : lang === 'ES' ? 'Generar Arte / Carrusel' : 'Generate Art / Carousel'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal: Ver como texto (raw markdown) ─── */}
      <Dialog open={rawTextOpen} onOpenChange={setRawTextOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {lang === 'PT' ? 'Sermão em texto puro (Markdown)' : lang === 'ES' ? 'Sermón en texto puro (Markdown)' : 'Sermon as raw text (Markdown)'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-lg border border-border bg-muted/30 p-4">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
              {blocksToMarkdown(blocks, lang) || (lang === 'PT' ? '(vazio)' : '(empty)')}
            </pre>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={async () => { await navigator.clipboard.writeText(blocksToMarkdown(blocks, lang)); toast.success(labels.copied[lang]); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
