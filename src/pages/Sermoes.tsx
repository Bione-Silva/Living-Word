import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Trash2, Plus, History, Copy, Share2, FileText, Image, RefreshCw, BookOpen, Save, Presentation, Mic, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadHistory, saveMessage } from '@/hooks/useChatHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { openWhatsAppShare } from '@/lib/whatsapp';
import { SermonCarouselModal } from '@/components/sermon/SermonCarouselModal';
import { SermonSlidesModal } from '@/components/sermon/SermonSlidesModal';
import { BibleDrawer } from '@/components/BibleDrawer';
import { parseBibleUri, type ParsedBibleRef } from '@/lib/bible-ref-parser';

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
  title: { PT: 'Gerador de Pregação', EN: 'Sermon Generator', ES: 'Generador de Predicación' },
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-primary/5'}`}
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
  html = html.replace(/\[([^\]]+)\]\(bible:\/\/[^)]+\)/g, '<strong style="color:#8B6914;">$1</strong>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:18px 0 8px;color:#333;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:24px 0 10px;color:#222;border-left:3px solid #8B6914;padding-left:10px;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;">$1</h1>');
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #D4A853;padding:10px 16px;margin:16px 0;background:#FFFDF5;font-style:italic;color:#555;border-radius:0 6px 6px 0;">$1</blockquote>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:10px 0;padding-left:20px;list-style:disc;">${m}</ul>`);
  html = html.replace(/^---$/gm, '<div style="text-align:center;margin:20px 0;color:#D4A853;font-size:14px;">✝</div>');
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // History
  const [sessions, setSessions] = useState<SermonSession[]>([]);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  // Modals
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [slidesOpen, setSlidesOpen] = useState(false);

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

  /* ═══ Restore a saved session ═══ */
  const handleRestoreSession = (session: SermonSession) => {
    setSermonContent(session.content);
    setSermonTitle(session.title);
    setSermonTopic(session.passage);
    setActiveSessionId(session.id);
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
    border-bottom: 2px solid #D4A853; padding-bottom: 10px; margin-bottom: 24px;
  }
  .pdf-body h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: #111; page-break-after: avoid; }
  .pdf-body h2 { font-size: 17px; font-weight: 700; margin: 28px 0 10px; color: #222; border-left: 3px solid #8B6914; padding-left: 10px; page-break-after: avoid; }
  .pdf-body h3 { font-size: 15px; font-weight: 700; margin: 18px 0 8px; color: #333; page-break-after: avoid; }
  .pdf-body blockquote { border-left: 3px solid #D4A853; padding: 10px 16px; margin: 16px 0; background: #FFFDF5; font-style: italic; color: #555; border-radius: 0 6px 6px 0; page-break-inside: avoid; }
  .pdf-body p { margin: 8px 0; line-height: 1.8; font-size: 13px; }
  .pdf-body ul { margin: 10px 0; padding-left: 20px; list-style: disc; }
  .pdf-body li { margin: 4px 0; padding-left: 4px; font-size: 13px; line-height: 1.7; }
  .pdf-body strong { font-weight: 700; }
  .pdf-body em { font-style: italic; }
  .pdf-divider { text-align: center; margin: 24px 0; color: #D4A853; font-size: 14px; page-break-after: avoid; }
  .pdf-footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E8E0D0; display: flex; align-items: center; justify-content: center; gap: 8px; }
</style>
<div style="font-family:'Georgia','Palatino Linotype',serif;max-width:680px;margin:0 auto;padding:0;color:#333;">
  <div class="pdf-page-header">
    <div>
      <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B6914;font-weight:700;">Living Word</span>
      <span style="font-size:10px;color:#999;margin-left:8px;">✝</span>
    </div>
    <span style="font-size:9px;color:#999;">${dateStr}</span>
  </div>
  <div class="pdf-body">
    ${markdownToHtml(sermonContent)}
  </div>
  <div class="pdf-footer">
    <span style="font-size:12px;color:#D4A853;font-weight:700;">✝</span>
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
  const handleBibleClick = (uriPath: string) => {
    const parsed = parseBibleUri(uriPath);
    if (parsed) {
      setBibleRef(parsed);
    } else {
      setBibleRef(null);
    }
    setBibleDrawerOpen(true);
  };

  /* ═══ Custom markdown components ═══ */
  const markdownComponents = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('bible://')) {
        const ref = href.replace('bible://', '');
        return (
          <button
            onClick={() => handleBibleClick(ref)}
            className="font-bold inline-flex items-center gap-0.5 cursor-pointer hover:underline"
            style={{ color: '#D4A853' }}
            title={ref.replace(/\//g, ' ')}
            {...props}
          >
            📖 {children}
          </button>
        );
      }
      // Non-bible links also open internally — prevent external navigation
      return (
        <button
          onClick={() => setBibleDrawerOpen(true)}
          className="font-bold inline-flex items-center gap-0.5 cursor-pointer hover:underline"
          style={{ color: '#D4A853' }}
          {...props}
        >
          {children}
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
            <button onClick={() => setMobileHistoryOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
              <History className="h-5 w-5" />
            </button>
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

              {/* Options */}
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">{labels.preachingType[lang]}</p>
                  <ChipGroup items={preachingTypes} selected={preachingType} onSelect={setPreachingType} lang={lang} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{labels.audience[lang]}</p>
                    <ChipGroup items={audiences} selected={audience} onSelect={setAudience} lang={lang} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{labels.duration[lang]}</p>
                    <ChipGroup items={durations} selected={duration} onSelect={setDuration} lang={lang} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{labels.style[lang]}</p>
                    <ChipGroup items={preachingStyles} selected={style} onSelect={setStyle} lang={lang} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">{labels.tone[lang]}</p>
                    <ChipGroup items={tones} selected={tone} onSelect={setTone} lang={lang} />
                  </div>
                </div>

                {/* Topic suggestions */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">{labels.suggestions[lang]}</p>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions[lang].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${topic === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic input + Generate button */}
                <div className="pt-2 space-y-3">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={labels.topicPlaceholder[lang]}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
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

              {loading ? (
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
                      <button onClick={handleCopy} className={actionBtn}>
                        <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
                      </button>
                      <button onClick={handleSendWpp} className={actionBtn}>
                        <Share2 className="h-3.5 w-3.5" /> {labels.sendWpp[lang]}
                      </button>
                      <button onClick={() => setCarouselOpen(true)} className={actionBtn}>
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-bold text-muted-foreground tracking-wide">{labels.history[lang]}</span>
          <button onClick={handleNewSermon} className="text-xs font-bold text-primary hover:underline">{labels.newSermon[lang]}</button>
        </div>
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

      {/* ─── Carousel modal ─── */}
      <SermonCarouselModal
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        sermonMarkdown={sermonContent}
        sermonTitle={sermonTitle}
        materialId={activeSessionId}
      />

      {/* ─── Slides modal ─── */}
      <SermonSlidesModal
        open={slidesOpen}
        onOpenChange={setSlidesOpen}
        sermonMarkdown={sermonContent}
        sermonTitle={sermonTitle}
        materialId={activeSessionId}
      />
      <BibleDrawer open={bibleDrawerOpen} onOpenChange={setBibleDrawerOpen} />
    </div>
  );
}
