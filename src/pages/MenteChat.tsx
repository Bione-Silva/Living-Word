import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2, BookOpen, PenTool, Users, GraduationCap, ThumbsUp, ThumbsDown, Copy, Sparkles, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { minds } from '@/data/minds';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

type L = 'PT' | 'EN' | 'ES';
type Msg = { role: 'user' | 'assistant'; content: string };

const modalityLabels: Record<string, Record<L, string>> = {
  devocional: { PT: 'Devocional Diário', EN: 'Daily Devotional', ES: 'Devocional Diario' },
  sermao: { PT: 'Preparação de Sermão', EN: 'Sermon Preparation', ES: 'Preparación de Sermón' },
  aconselhamento: { PT: 'Aconselhamento Pastoral', EN: 'Pastoral Counseling', ES: 'Consejería Pastoral' },
  estudo: { PT: 'Estudo Teológico', EN: 'Theological Study', ES: 'Estudio Teológico' },
};

const modalityIcons: Record<string, React.ElementType> = {
  devocional: BookOpen,
  sermao: PenTool,
  aconselhamento: Users,
  estudo: GraduationCap,
};

const welcomeMessages: Record<string, Record<L, (name: string) => string>> = {
  devocional: {
    PT: (n) => `Bom dia! Sou ${n}. Estou aqui para conduzir seu devocional. Qual passagem ou tema gostaria de meditar hoje?`,
    EN: (n) => `Good morning! I'm ${n}. I'm here to guide your devotional. Which passage or theme would you like to meditate on today?`,
    ES: (n) => `¡Buenos días! Soy ${n}. Estoy aquí para guiar tu devocional. ¿Qué pasaje o tema te gustaría meditar hoy?`,
  },
  sermao: {
    PT: (n) => `Olá, pastor. Sou ${n}. Vamos preparar um sermão juntos. Me diga: qual é o texto bíblico, quem é o público e qual o contexto do culto?`,
    EN: (n) => `Hello, pastor. I'm ${n}. Let's prepare a sermon together. Tell me: what's the biblical text, who's the audience, and what's the service context?`,
    ES: (n) => `Hola, pastor. Soy ${n}. Preparemos un sermón juntos. Dime: ¿cuál es el texto bíblico, quién es el público y cuál es el contexto del culto?`,
  },
  aconselhamento: {
    PT: (n) => `Paz do Senhor. Sou ${n}. Estou aqui para ouvi-lo com o coração aberto. O que está pesando em sua alma hoje?`,
    EN: (n) => `Peace of the Lord. I'm ${n}. I'm here to listen with an open heart. What's weighing on your soul today?`,
    ES: (n) => `Paz del Señor. Soy ${n}. Estoy aquí para escucharte con el corazón abierto. ¿Qué pesa en tu alma hoy?`,
  },
  estudo: {
    PT: (n) => `Saudações! Sou ${n}. Vamos mergulhar profundamente nas Escrituras. Qual doutrina, passagem ou questão teológica deseja explorar?`,
    EN: (n) => `Greetings! I'm ${n}. Let's dive deep into the Scriptures. Which doctrine, passage, or theological question would you like to explore?`,
    ES: (n) => `¡Saludos! Soy ${n}. Sumerjámonos en las Escrituras. ¿Qué doctrina, pasaje o cuestión teológica deseas explorar?`,
  },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mind-chat`;

async function streamMindChat({
  messages,
  mindId,
  modality,
  language,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  mindId: string;
  modality: string;
  language: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, mindId, modality, language }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: "Unknown error" }));
    onError(body.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) { onError("No response body"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

export default function MenteChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const menteId = searchParams.get('mente') || '';
  const modalidade = searchParams.get('modalidade') || '';
  const mind = minds.find(m => m.id === menteId);
  const name = mind?.name || 'Mentor';
  const modLabel = modalityLabels[modalidade]?.[lang] || modalidade;
  const ModIcon = modalityIcons[modalidade] || BookOpen;

  const welcome = welcomeMessages[modalidade]?.[lang]?.(name) || `Olá, sou ${name}.`;

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: welcome },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Text selection "improve" popup state
  const [selectionPopup, setSelectionPopup] = useState<{
    text: string;
    msgIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [improving, setImproving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for text selection on assistant messages
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 10) return; // Ignore very short selections

    // Find which message index the selection is in
    const anchorNode = selection.anchorNode;
    const msgEl = anchorNode?.parentElement?.closest('[data-msg-index]');
    if (!msgEl) return;

    const msgIndex = parseInt(msgEl.getAttribute('data-msg-index') || '-1', 10);
    if (msgIndex < 0) return;
    if (messages[msgIndex]?.role !== 'assistant') return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectionPopup({
      text: selectedText,
      msgIndex,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, [messages]);

  // Close popup on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectionPopup(null);
      }
    };
    if (selectionPopup) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [selectionPopup]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Msg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const history = [...messages.slice(1), userMsg];
      await streamMindChat({
        messages: history,
        mindId: menteId,
        modality: modalidade,
        language: lang,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'PT'
          ? '⚠️ Erro de conexão. Tente novamente.'
          : lang === 'EN'
            ? '⚠️ Connection error. Please try again.'
            : '⚠️ Error de conexión. Inténtalo de nuevo.',
      }]);
      setIsLoading(false);
    }
  };
...
    if (type === 'up') {
      toast.success(lang === 'PT' ? 'Obrigado pelo feedback! 👍' : lang === 'EN' ? 'Thanks for the feedback! 👍' : '¡Gracias por tu feedback! 👍');
    } else {
      toast(lang === 'PT' ? 'Feedback registrado. Vamos melhorar! 🙏' : lang === 'EN' ? 'Feedback noted. We\'ll improve! 🙏' : 'Feedback registrado. ¡Vamos a mejorar! 🙏');
    }
  };

  const handleImproveSelection = async () => {
    if (!selectionPopup || improving) return;
    setImproving(true);

    const selectedText = selectionPopup.text;
    const msgIndex = selectionPopup.msgIndex;
    setSelectionPopup(null);

    // Send a request to improve the selected text
    const improvePrompt = lang === 'PT'
      ? `Por favor, melhore e expanda o seguinte trecho, mantendo o mesmo tom e estilo pastoral. Retorne apenas o texto melhorado:\n\n"${selectedText}"`
      : lang === 'EN'
      ? `Please improve and expand the following excerpt, keeping the same pastoral tone and style. Return only the improved text:\n\n"${selectedText}"`
      : `Por favor, mejora y expande el siguiente fragmento, manteniendo el mismo tono y estilo pastoral. Devuelve solo el texto mejorado:\n\n"${selectedText}"`;

    const userMsg: Msg = { role: 'user', content: improvePrompt };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamMindChat({
        messages: [...messages.slice(1), userMsg],
        mindId: menteId,
        modality: modalidade,
        language: lang,
        onDelta: upsert,
        onDone: () => { setIsLoading(false); setImproving(false); },
        onError: (msg) => {
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
          setIsLoading(false);
          setImproving(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erro ao melhorar texto.' }]);
      setIsLoading(false);
      setImproving(false);
    }
  };

  const placeholder: Record<L, string> = {
    PT: `Pergunte algo a ${name}...`,
    EN: `Ask ${name} something...`,
    ES: `Pregunta algo a ${name}...`,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/mentes/${menteId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {mind && (
          <div className="w-10 h-10 rounded-full border-2 border-[hsl(43,55%,58%)]/40 overflow-hidden">
            <img src={mind.image} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg font-bold text-foreground truncate">{name}</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ModIcon className="h-3 w-3" />
            <span>{modLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-5 px-1" onMouseUp={handleMouseUp}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] sm:max-w-[75%]">
              <div
                data-msg-index={i}
                className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[hsl(43,55%,58%)] text-[hsl(210,40%,6%)] rounded-br-md'
                    : 'bg-muted/40 border border-border/40 text-foreground rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {/* Action bar for assistant messages (skip welcome) */}
              {msg.role === 'assistant' && i > 0 && !isLoading && (
                <div className="flex items-center gap-1 mt-1.5 ml-1">
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    title={lang === 'PT' ? 'Copiar texto' : 'Copy text'}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(i, 'up')}
                    className={`p-1.5 rounded-md transition-colors ${
                      feedback[i] === 'up'
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                    title={lang === 'PT' ? 'Gostei' : 'Like'}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(i, 'down')}
                    className={`p-1.5 rounded-md transition-colors ${
                      feedback[i] === 'down'
                        ? 'text-red-400 bg-red-400/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                    title={lang === 'PT' ? 'Não gostei' : 'Dislike'}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-muted/40 border border-border/40 rounded-2xl rounded-bl-md px-5 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(43,55%,58%)]" />
            </div>
          </div>
        )}
      </div>

      {/* Text selection "Improve with AI" popup */}
      {selectionPopup && (
        <div
          ref={popupRef}
          className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${selectionPopup.x}px`,
            top: `${selectionPopup.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-1 bg-foreground text-background rounded-lg shadow-xl px-2 py-1.5">
            <button
              onClick={handleImproveSelection}
              disabled={improving}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium hover:bg-background/10 transition-colors disabled:opacity-50"
            >
              {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {lang === 'PT' ? 'Melhorar com IA' : lang === 'EN' ? 'Improve with AI' : 'Mejorar con IA'}
            </button>
            <button
              onClick={() => {
                if (selectionPopup) handleCopy(selectionPopup.text);
                setSelectionPopup(null);
              }}
              className="p-1 rounded-md hover:bg-background/10 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={() => setSelectionPopup(null)}
              className="p-1 rounded-md hover:bg-background/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {/* Arrow */}
          <div className="w-0 h-0 mx-auto border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-foreground" />
        </div>
      )}

      {/* Input */}
      <div className="pt-4 pb-2 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder[lang]}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(43,55%,58%)]/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="h-11 w-11 rounded-xl bg-[hsl(43,55%,58%)] hover:bg-[hsl(43,55%,65%)] text-[hsl(210,40%,6%)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
