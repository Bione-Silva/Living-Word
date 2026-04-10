import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Trash2, Plus, History, Copy, Share2, FileText, Image, RefreshCw, BookOpen, Save, Presentation } from 'lucide-react';
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

type L = 'PT' | 'EN' | 'ES';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    PT: 'Crie pregações completas com estrutura profunda, referências bíblicas e aplicações práticas.',
    EN: 'Create complete sermons with deep structure, biblical references and practical applications.',
    ES: 'Cree predicaciones completas con estructura profunda, referencias bíblicas y aplicaciones prácticas.',
  },
  preachingType: { PT: '📋 TIPO DE PREGAÇÃO', EN: '📋 PREACHING TYPE', ES: '📋 TIPO DE PREDICACIÓN' },
  audience: { PT: '👥 PÚBLICO-ALVO', EN: '👥 AUDIENCE', ES: '👥 PÚBLICO OBJETIVO' },
  duration: { PT: '⏱️ DURAÇÃO', EN: '⏱️ DURATION', ES: '⏱️ DURACIÓN' },
  style: { PT: 'ESTILO DE PREGAÇÃO', EN: 'PREACHING STYLE', ES: 'ESTILO DE PREDICACIÓN' },
  tone: { PT: 'TOM DA MENSAGEM', EN: 'MESSAGE TONE', ES: 'TONO DEL MENSAJE' },
  suggestions: { PT: '✨ SUGESTÕES DE TEMA', EN: '✨ TOPIC SUGGESTIONS', ES: '✨ SUGERENCIAS DE TEMA' },
  placeholder: { PT: 'Digite sua mensagem...', EN: 'Type your message...', ES: 'Escribe tu mensaje...' },
  send: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  enterHint: { PT: 'Enter para enviar • Shift+Enter para nova linha', EN: 'Enter to send • Shift+Enter for new line', ES: 'Enter para enviar • Shift+Enter para nueva línea' },
  thinking: { PT: 'Gerando sermão...', EN: 'Generating sermon...', ES: 'Generando sermón...' },
  history: { PT: 'HISTÓRICO RECENTE', EN: 'RECENT HISTORY', ES: 'HISTORIAL RECIENTE' },
  newChat: { PT: 'NOVO CHAT', EN: 'NEW CHAT', ES: 'NUEVO CHAT' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  sendWpp: { PT: 'Enviar', EN: 'Send', ES: 'Enviar' },
  carousel: { PT: 'Carrossel', EN: 'Carousel', ES: 'Carrusel' },
  pdf: { PT: 'PDF', EN: 'PDF', ES: 'PDF' },
  regenerate: { PT: 'Regenerar', EN: 'Regenerate', ES: 'Regenerar' },
  save: { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  saved: { PT: 'Salvo!', EN: 'Saved!', ES: '¡Guardado!' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  messages: { PT: 'mensagens', EN: 'messages', ES: 'mensajes' },
  noSermons: { PT: 'Nenhum sermão criado ainda.', EN: 'No sermons created yet.', ES: 'Ningún sermón creado aún.' },
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
  parts.push(`- Write ALL Bible references as Markdown links: [Book Chapter:Verse](bible://Book/Chapter/Verse)`);
  parts.push(`- Examples: [Gálatas 5:22-23](bible://Galatas/5/22-23), [John 14:27](bible://John/14/27), [Tiago 1:2-4](bible://Tiago/1/2-4)`);
  parts.push(`- Use the book names in ${langFull}`);
  parts.push(`- NEVER write a verse reference without making it a link`);

  parts.push(`\nFORMATTING RULES:`);
  parts.push(`- Respond ALWAYS in rich Markdown`);
  parts.push(`- Use ONLY real Bible verses. Never invent references.`);
  parts.push(`- The sermon must have at least 1000 words for depth.`);
  parts.push(`- Use blockquotes (>) for the main text citation.`);
  parts.push(`- Use horizontal dividers or cross symbols (†) between major sections.`);
  parts.push(`- Bold key phrases for emphasis and scannability.`);
  parts.push(`- Remember context from previous messages.`);
  parts.push(`- Respond in ${langFull}.`);

  return parts.join('\n');
}

interface SermonSession {
  id: string;
  title: string;
  date: string;
  messageCount: number;
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

/* ═══════════════ Bible reference regex ═══════════════ */
const BIBLE_LINK_RE = /\[([^\]]+)\]\(bible:\/\/([^)]+)\)/g;

export default function Sermoes() {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [lastSermonContent, setLastSermonContent] = useState('');
  const [lastSermonTitle, setLastSermonTitle] = useState('');
  const [lastUserPrompt, setLastUserPrompt] = useState('');

  const [preachingType, setPreachingType] = useState<string | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>('30 min');
  const [style, setStyle] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SermonSession[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const history = await loadHistory(user.id, AGENT_ID);
      if (!cancelled) { setMessages(history); setHistoryLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const refreshSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('materials').select('id, title, created_at').eq('user_id', user.id).eq('type', 'sermon').order('created_at', { ascending: false }).limit(20);
    if (data) {
      setSessions(data.map(d => ({
        id: d.id, title: d.title,
        date: new Date(d.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        messageCount: 2,
      })));
    }
  }, [user, lang]);

  useEffect(() => { refreshSessions(); }, [refreshSessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setLastUserPrompt(text.trim());

    await saveMessage(user.id, AGENT_ID, 'user', text.trim());

    try {
      const systemPrompt = buildSystemPrompt(lang, profile?.full_name?.split(' ')[0], { preachingType, audience, duration, style, tone });
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: { systemPrompt, userPrompt: text.trim(), toolId: 'sermon-generator', history: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      const content = data?.content || (lang === 'PT' ? 'Desculpe, não consegui gerar o sermão.' : 'Sorry, could not generate the sermon.');
      setMessages(prev => [...prev, { role: 'assistant', content }]);
      await saveMessage(user.id, AGENT_ID, 'assistant', content);

      setLastSermonContent(content);
      const titleMatch = content.match(/^#+\s*(.+)/m);
      const sermonTitle = titleMatch?.[1]?.replace(/\*+/g, '').trim() || text.trim().slice(0, 60);
      setLastSermonTitle(sermonTitle);

      await supabase.from('materials').insert({ user_id: user.id, type: 'sermon', title: sermonTitle, content, language: lang, passage: text.trim() });
      await refreshSessions();
    } catch {
      const errContent = lang === 'PT' ? 'Desculpe, ocorreu um erro. Tente novamente.' : lang === 'ES' ? 'Lo siento, ocurrió un error. Intenta de nuevo.' : 'Sorry, an error occurred. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errContent }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleNewChat = () => {
    setMessages([]); setPreachingType(null); setAudience(null); setDuration('30 min'); setStyle(null); setTone(null);
    setLastSermonContent(''); setLastSermonTitle('');
  };

  const handleDeleteSession = async (id: string) => {
    await supabase.from('materials').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  /* ═══ Action handlers ═══ */
  const handleCopy = async () => {
    if (!lastSermonContent) return;
    await navigator.clipboard.writeText(lastSermonContent);
    toast.success(labels.copied[lang]);
  };

  const handleSend = () => {
    if (!lastSermonContent) return;
    const short = lastSermonContent.replace(/[#*_>`~\[\]()]/g, '').slice(0, 3000);
    openWhatsAppShare(short);
  };

  const handlePdf = async () => {
    if (!lastSermonContent) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const el = document.createElement('div');
    el.innerHTML = `<div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#333;">
      <h1 style="font-size:24px;margin-bottom:8px;">${lastSermonTitle}</h1>
      <div style="font-size:14px;line-height:1.8;">${lastSermonContent.replace(/\n/g, '<br/>')}</div>
      <div style="margin-top:32px;text-align:center;font-size:10px;color:#999;">Living Word • ${new Date().toLocaleDateString()}</div>
    </div>`;
    document.body.appendChild(el);
    await html2pdf().from(el).set({ margin: [10, 10], filename: `${lastSermonTitle.slice(0, 40)}.pdf`, html2canvas: { scale: 2 }, jsPDF: { format: 'a4' } }).save();
    document.body.removeChild(el);
    toast.success('PDF!');
  };

  const handleSave = () => {
    toast.success(labels.saved[lang]);
  };

  const handleRegenerate = () => {
    if (lastUserPrompt) sendMessage(lastUserPrompt);
  };

  /* ═══ Bible reference click handler ═══ */
  const handleBibleClick = (ref: string) => {
    // ref like "Galatas/5/22-23" → navigate to Bible reader
    const parts = ref.split('/');
    if (parts.length >= 2) {
      const bookId = parts[0].toLowerCase();
      const chapter = parts[1];
      navigate(`/biblia?book=${bookId}&chapter=${chapter}`);
    }
  };

  const isEmpty = messages.length === 0 && !loading && historyLoaded;
  const hasSermon = messages.some(m => m.role === 'assistant');

  /* ═══ Custom markdown components for clickable Bible refs ═══ */
  const markdownComponents = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('bible://')) {
        const ref = href.replace('bible://', '');
        return (
          <button
            onClick={() => handleBibleClick(ref)}
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
            {...props}
          >
            {children}
          </button>
        );
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props}>{children}</a>;
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

  /* ═══ Render action buttons ═══ */
  const renderActionButtons = () => {
    if (!hasSermon || loading) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-4 mb-2 justify-start animate-in fade-in duration-300">
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
          <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
        </button>
        <button onClick={handleSend} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
          <Share2 className="h-3.5 w-3.5" /> {labels.sendWpp[lang]}
        </button>
        <button onClick={() => setCarouselOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
          <Image className="h-3.5 w-3.5" /> {labels.carousel[lang]}
        </button>
        <button onClick={handlePdf} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
          <FileText className="h-3.5 w-3.5" /> {labels.pdf[lang]}
        </button>
        <button onClick={handleRegenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> {labels.regenerate[lang]}
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] pb-28 md:pb-0">
      {/* ─── Main chat area ─── */}
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

        {/* Messages / Empty state */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {isEmpty && (
            <div className="flex flex-col items-center text-center px-4 animate-in fade-in duration-500 max-w-2xl mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground font-display">{labels.title[lang]}</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">{labels.subtitle[lang]}</p>

              <div className="w-full text-left mt-8 space-y-5">
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
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">{labels.suggestions[lang]}</p>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions[lang].map((topic) => (
                      <button key={topic} onClick={() => sendMessage(topic)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >{topic}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2.5 flex items-start gap-3">
                    <p className="text-sm text-foreground flex-1">{msg.content}</p>
                    {profile?.avatar_url && <img src={profile.avatar_url} className="h-8 w-8 rounded-full shrink-0" alt="" />}
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Logo icon */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">✝</div>
                    </div>
                    {/* Sermon content with rich markdown */}
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                      [&_h1]:text-xl [&_h1]:md:text-2xl [&_h1]:font-bold [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2
                      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-l-3 [&_h2]:border-primary [&_h2]:pl-3
                      [&_ul]:space-y-2 [&_li]:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Action buttons after last assistant message */}
                    {i === messages.length - 1 && msg.role === 'assistant' && renderActionButtons()}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs">{labels.thinking[lang]}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border px-4 py-3 bg-background">
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            <textarea
              ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={labels.placeholder[lang]} rows={1}
              className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
              className="h-11 px-5 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium text-sm"
            >
              <Send className="h-4 w-4" />
              {labels.send[lang]}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">{labels.enterHint[lang]}</p>
        </div>
      </div>

      {/* ─── Right sidebar: history ─── */}
      <aside className="hidden lg:flex flex-col w-72 border-l border-border bg-background shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-bold text-muted-foreground tracking-wide">{labels.history[lang]}</span>
          <button onClick={handleNewChat} className="text-xs font-bold text-primary hover:underline">{labels.newChat[lang]}</button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((s) => (
              <div key={s.id} className="group flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.date} • {s.messageCount} {labels.messages[lang]}</p>
                </div>
                <button onClick={() => handleDeleteSession(s.id)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
            <Plus className="h-3.5 w-3.5" /> {labels.newChat[lang]}
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
              <div key={s.id} className="flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.date} • {s.messageCount} {labels.messages[lang]}</p>
                </div>
                <button onClick={() => handleDeleteSession(s.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <button onClick={() => { handleNewChat(); setMobileHistoryOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
              <Plus className="h-3.5 w-3.5" /> {labels.newChat[lang]}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Carousel modal ─── */}
      <SermonCarouselModal
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        sermonMarkdown={lastSermonContent}
        sermonTitle={lastSermonTitle}
      />
    </div>
  );
}
