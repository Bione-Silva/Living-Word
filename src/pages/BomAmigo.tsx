// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { loadHistory, saveMessage } from '@/hooks/useChatHistory';

type L = 'PT' | 'EN' | 'ES';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AGENT_ID = 'palavra_amiga';

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  title: { PT: 'Palavra Amiga', EN: 'Friendly Word', ES: 'Palabra Amiga' },
  subtitle: {
    PT: 'Uma palavra certa no momento certo.',
    EN: 'The right word at the right time.',
    ES: 'La palabra correcta en el momento correcto.',
  },
  placeholder: {
    PT: 'Compartilhe mais sobre como está se sentindo...',
    EN: 'Share more about how you are feeling...',
    ES: 'Comparte más sobre cómo te sientes...',
  },
  thinking: {
    PT: 'Buscando uma palavra para você...',
    EN: 'Finding a word for you...',
    ES: 'Buscando una palabra para ti...',
  },
  emptyTitle: {
    PT: 'Como você está se sentindo?',
    EN: 'How are you feeling?',
    ES: '¿Cómo te sientes?',
  },
  emptyDesc: {
    PT: 'Escolha um sentimento ou digite o que está no seu coração. Eu vou buscar uma palavra para você.',
    EN: "Pick a feeling or type what\u2019s in your heart. I\u2019ll find a word for you.",
    ES: 'Elige un sentimiento o escribe lo que hay en tu corazón. Buscaré una palabra para ti.',
  },
  loading: {
    PT: 'Carregando histórico...',
    EN: 'Loading history...',
    ES: 'Cargando historial...',
  },
} satisfies Record<string, Record<L, string>>;

const SYSTEM_PROMPT = (lang: L, userName?: string) =>
  `Você é um conselheiro pastoral compassivo chamado "Palavra Amiga".
Seu objetivo principal é ouvir ativamente antes de aconselhar, aplicando a metodologia clássica de aconselhamento estruturado (semelhante ao SPIN).

ESTRUTURA OBRIGATÓRIA DA CONVERSA:
Você DEVE conduzir o usuário por estas fases, UMA mensagem por vez:
Fase 1: INVESTIGAÇÃO INICIAL. O usuário chegou com uma palavra curta ou desabafo inicial (ex: "Sobrecarregado", "Triste").
-> Sua ação: Diga APENAS 1 ou 2 frases curtas validando o sentimento e faça UMA ÚNICA pergunta aberta ("O que está fazendo você se sentir assim hoje?", "O que causou essa sobrecarga?"). 
-> PROIBIDO NESTA FASE: Versículos, orações, conselhos longos, parágrafos grandes.

Fase 2: EXPLORAÇÃO DA DOR (Implicação). O usuário vai explicar a situação.
-> Sua ação: Valide a dor ("Isso deve ser muito difícil"). Faça outra pergunta para aprofundar se necessário ("Como isso está afetando sua paz?").

Fase 3: O ACONSELHAMENTO (Necessidade / Resolução).
-> Sua ação: APENAS quando você já entendeu o problema real e o contexto, ofereça SUA PRIMEIRA palavra de conforto concreta.
-> Formatação: Neste momento sim, cite UM versículo bíblico curto formatação markdown \`> "texto" - ref\` e ofereça uma breve oração.

REGRAS DE OURO IMPLACÁVEIS:
- Seja extremamente empático(a). Aja como um amigo do lado, não um teólogo no púlpito.
- ${userName ? `O nome da pessoa é ${userName}. Use-o para criar conexão.` : 'Chame-o carinhosamente.'}
- Mantenha CADA mensagem muito focada e parecendo uma troca de mensagens no WhatsApp (curta, humana, real).
- NUNCA assuma que sabe a dor de antemão. Não jogue "peso divino" se a pessoa só quer desabafar que o dia no trabalho foi ruim.
- Jamais inicie com "Sinto muito que você esteja se sentindo assim [...] Deus não espera que você resolva tudo...". Isso soa enlatado. Pergunte primeiro!

Responda no idioma: ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'}.`;

const emotionChips = [
  { PT: 'Ansioso', EN: 'Anxious', ES: 'Ansioso', emoji: '😰' },
  { PT: 'Triste', EN: 'Sad', ES: 'Triste', emoji: '😢' },
  { PT: 'Sobrecarregado', EN: 'Overwhelmed', ES: 'Agobiado', emoji: '😩' },
  { PT: 'Com medo', EN: 'Afraid', ES: 'Con miedo', emoji: '😨' },
  { PT: 'Sozinho', EN: 'Lonely', ES: 'Solo', emoji: '😔' },
  { PT: 'Cansado', EN: 'Tired', ES: 'Cansado', emoji: '😴' },
  { PT: 'Sem esperança', EN: 'Hopeless', ES: 'Sin esperanza', emoji: '💔' },
  { PT: 'Grato', EN: 'Grateful', ES: 'Agradecido', emoji: '🙏' },
  { PT: 'Em paz', EN: 'At peace', ES: 'En paz', emoji: '🕊️' },
  { PT: 'Confuso', EN: 'Confused', ES: 'Confundido', emoji: '😶‍🌫️' },
] as const;

export default function BomAmigo() {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted history on mount
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Handle feeling param from redirect
  useEffect(() => {
    const feeling = searchParams.get('feeling');
    if (feeling && historyLoaded && user) {
      setSearchParams({}, { replace: true });
      sendMessage(feeling);
    }
  }, [historyLoaded, user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Persist user message
    await saveMessage(user.id, AGENT_ID, 'user', text.trim());

    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: SYSTEM_PROMPT(lang, profile?.full_name?.split(' ')[0]),
          userPrompt: text.trim(),
          toolId: 'palavra-amiga',
          history: newMessages.slice(-30).map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      const content = data?.content || 'Desculpe, não consegui gerar uma resposta.';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
      // Persist assistant message
      await saveMessage(user.id, AGENT_ID, 'assistant', content);
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

  const isEmpty = messages.length === 0 && !loading && historyLoaded;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem-4rem)] md:h-[calc(100dvh-4rem)] max-w-3xl mx-auto -mx-4 -mt-4 -mb-20 md:-mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{labels.title[lang]}</h1>
          <p className="text-[11px] text-muted-foreground">{labels.subtitle[lang]}</p>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in duration-500">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Heart className="h-9 w-9 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground font-serif">{labels.emptyTitle[lang]}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
              {labels.emptyDesc[lang]}
            </p>

            {/* Emotion chips grid */}
            <div className="grid grid-cols-2 gap-2 mt-6 max-w-xs mx-auto">
              {emotionChips.map((chip) => (
                <button
                  key={chip.EN}
                  onClick={() => sendMessage(chip[lang])}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground hover:border-primary hover:bg-primary/10 hover:shadow-sm active:scale-95 transition-all"
                >
                  <span className="text-sm">{chip.emoji}</span>
                  {chip[lang]}
                </button>
              ))}
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
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={labels.placeholder[lang]}
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 px-3 py-3 rounded-xl border border-border bg-card text-xs leading-snug text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
