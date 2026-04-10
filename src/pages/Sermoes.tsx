import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, Send, Loader2, Trash2, Plus, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { loadHistory, saveMessage } from '@/hooks/useChatHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

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
  subtitle: {
    PT: 'Crie esboços completos de sermões, estruture suas mensagens com introdução, desenvolvimento e aplicação prática. IA especializada em homilética.',
    EN: 'Create complete sermon outlines, structure your messages with introduction, development and practical application. AI specialized in homiletics.',
    ES: 'Cree esquemas completos de sermones, estructure sus mensajes con introducción, desarrollo y aplicación práctica. IA especializada en homilética.',
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
  loading: { PT: 'Carregando...', EN: 'Loading...', ES: 'Cargando...' },
} satisfies Record<string, Record<L, string>>;

function buildSystemPrompt(
  lang: L,
  userName: string | undefined,
  selections: {
    preachingType: string | null;
    audience: string | null;
    duration: string | null;
    style: string | null;
    tone: string | null;
  },
) {
  const parts: string[] = [];
  parts.push(`Você é um especialista em homilética cristã, treinado para criar sermões completos e profundos.`);
  parts.push(`Seu nome é "Gerador de Pregação" do Living Word.`);
  if (userName) parts.push(`O nome do pastor/usuário é ${userName}.`);

  parts.push(`\nDIRETRIZES DO USUÁRIO (respeite rigorosamente):`);
  if (selections.preachingType) parts.push(`- Tipo de pregação: ${selections.preachingType}`);
  if (selections.audience) parts.push(`- Público-alvo: ${selections.audience}`);
  if (selections.duration) parts.push(`- Duração estimada: ${selections.duration}`);
  if (selections.style) parts.push(`- Estilo de pregação: ${selections.style}`);
  if (selections.tone) parts.push(`- Tom da mensagem: ${selections.tone}`);

  parts.push(`\nESTRUTURA OBRIGATÓRIA DO SERMÃO:`);
  parts.push(`1. **Título** — criativo e memorável`);
  parts.push(`2. **Texto-base** — passagem bíblica principal`);
  parts.push(`3. **Introdução** — gancho, contextualização, tese central`);
  parts.push(`4. **Pontos principais** (2-4 pontos) — cada um com:`);
  parts.push(`   - Subtítulo`);
  parts.push(`   - Explicação do texto bíblico`);
  parts.push(`   - Ilustração ou exemplo prático`);
  parts.push(`   - Versículo de apoio`);
  parts.push(`   - Aplicação prática`);
  parts.push(`5. **Conclusão** — resumo, apelo, oração final`);
  parts.push(`6. **Notas adicionais** — dicas de entrega, pausas dramáticas`);

  parts.push(`\nREGRAS:`);
  parts.push(`- Responda SEMPRE em Markdown formatado.`);
  parts.push(`- Use APENAS versículos reais da Bíblia. Nunca invente referências.`);
  parts.push(`- Adapte a linguagem e profundidade ao público-alvo selecionado.`);
  parts.push(`- O sermão deve ter no mínimo 800 palavras.`);
  parts.push(`- Se o usuário enviar apenas um tema ou saudação, responda adequadamente.`);
  parts.push(`- Lembre do contexto de mensagens anteriores.`);
  parts.push(`- Responda em ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'}.`);

  return parts.join('\n');
}

interface SermonSession {
  id: string;
  title: string;
  date: string;
  messageCount: number;
}

function ChipGroup({
  items,
  selected,
  onSelect,
  lang,
}: {
  items: Record<L, string>[] | string[];
  selected: string | null;
  onSelect: (val: string | null) => void;
  lang: L;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => {
        const label = typeof item === 'string' ? item : item[lang];
        const isActive = selected === label;
        return (
          <button
            key={i}
            onClick={() => onSelect(isActive ? null : label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Sermoes() {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Filter selections
  const [preachingType, setPreachingType] = useState<string | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>('30 min');
  const [style, setStyle] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);

  // History sidebar
  const [sessions, setSessions] = useState<SermonSession[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const history = await loadHistory(user.id, AGENT_ID);
      if (!cancelled) {
        setMessages(history);
        setHistoryLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Load recent sermon materials for sidebar
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('materials')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .eq('type', 'sermon')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) {
        setSessions(data.map(d => ({
          id: d.id,
          title: d.title,
          date: new Date(d.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          messageCount: 0,
        })));
      }
    })();
  }, [user, lang]);

  // Auto-scroll
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

    await saveMessage(user.id, AGENT_ID, 'user', text.trim());

    try {
      const systemPrompt = buildSystemPrompt(lang, profile?.full_name?.split(' ')[0], {
        preachingType, audience, duration, style, tone,
      });

      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt,
          userPrompt: text.trim(),
          toolId: 'sermon-generator',
          history: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      const content = data?.content || (lang === 'PT' ? 'Desculpe, não consegui gerar o sermão.' : 'Sorry, could not generate the sermon.');
      setMessages(prev => [...prev, { role: 'assistant', content }]);
      await saveMessage(user.id, AGENT_ID, 'assistant', content);

      // Auto-save as material
      const titleMatch = content.match(/^#+\s*(.+)/m);
      const sermonTitle = titleMatch?.[1]?.replace(/\*+/g, '').trim() || text.trim().slice(0, 60);
      await supabase.from('materials').insert({
        user_id: user.id,
        type: 'sermon',
        title: sermonTitle,
        content,
        language: lang,
      });

      // Refresh sidebar
      const { data: refreshed } = await supabase
        .from('materials')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .eq('type', 'sermon')
        .order('created_at', { ascending: false })
        .limit(20);
      if (refreshed) {
        setSessions(refreshed.map(d => ({
          id: d.id,
          title: d.title,
          date: new Date(d.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          messageCount: 0,
        })));
      }
    } catch {
      const errContent = lang === 'PT' ? 'Desculpe, ocorreu um erro. Tente novamente.'
        : lang === 'ES' ? 'Lo siento, ocurrió un error. Intenta de nuevo.'
        : 'Sorry, an error occurred. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errContent }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setPreachingType(null);
    setAudience(null);
    setDuration('30 min');
    setStyle(null);
    setTone(null);
  };

  const handleDeleteSession = async (id: string) => {
    await supabase.from('materials').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const isEmpty = messages.length === 0 && !loading && historyLoaded;

  return (
    <div className="flex h-[calc(100vh-4rem)] pb-28 md:pb-0">
      {/* ─── Main chat area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-sm font-bold text-foreground">{labels.title[lang]}</h1>
        </div>

        {/* Messages / Empty state */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isEmpty && (
            <div className="flex flex-col items-center text-center px-4 animate-in fade-in duration-500 max-w-2xl mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground font-display">{labels.title[lang]}</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">{labels.subtitle[lang]}</p>

              {/* Filter chips */}
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
                      <button
                        key={topic}
                        onClick={() => sendMessage(topic)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] ${msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
                : 'bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
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

        {/* Input area */}
        <div className="shrink-0 border-t border-border px-4 py-3 bg-background">
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={labels.placeholder[lang]}
              rows={1}
              className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
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
              <div key={s.id} className="group flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.date}</p>
                </div>
                <button
                  onClick={() => handleDeleteSession(s.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-border">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.newChat[lang]}
          </button>
        </div>
      </aside>
    </div>
  );
}
