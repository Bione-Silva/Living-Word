import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, Copy, Share2, Send } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

type L = 'PT' | 'EN' | 'ES';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  copied: { PT: 'Texto copiado!', EN: 'Text copied!', ES: '¡Texto copiado!' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  thinking: {
    PT: 'Buscando uma palavra para você...',
    EN: 'Finding a word for you...',
    ES: 'Buscando una palabra para ti...',
  },
} satisfies Record<string, Record<L, string>>;

const SYSTEM_PROMPT = (lang: L, userName?: string) =>
  `You are "Palavra Amiga" (Friendly Word), a compassionate pastoral friend.

CRITICAL RULES:
- NEVER write more than ONE short paragraph per message (3-4 sentences MAX).
- Be conversational and natural, like a caring friend texting.
- If the user says something brief like "hi" or "oi", respond briefly: greet them by name and ask how they're doing. Nothing more.
- Only include a Bible verse when the user shares a feeling or situation that calls for it. Format as: > "*verse*" — Reference
- Do NOT include prayers, long encouragements, or multiple sections in a single message. Keep it short.
- Wait for the user to share more before going deeper. Let the conversation flow naturally.
- Respond in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'}.
${userName ? `The user's name is ${userName}. Use it naturally.` : ''}
- Remember context from previous messages.`;

export default function BomAmigo() {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Handle initial feeling from query param
  useEffect(() => {
    const feeling = searchParams.get('feeling');
    if (feeling && messages.length === 0 && user) {
      setSearchParams({}, { replace: true });
      sendMessage(feeling);
    }
  }, [user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: SYSTEM_PROMPT(lang, profile?.full_name?.split(' ')[0]),
          userPrompt: text.trim(),
          toolId: 'palavra-amiga',
          history: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const content = data?.content || 'Desculpe, não consegui gerar uma resposta.';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'PT' ? 'Desculpe, ocorreu um erro. Tente novamente.' : lang === 'ES' ? 'Lo siento, ocurrió un error. Intenta de nuevo.' : 'Sorry, an error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(labels.copied[lang]);
  };

  const handleShare = async (content: string) => {
    if (navigator.share) {
      try { await navigator.share({ title: labels.title[lang], text: content }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(content);
      toast.success(labels.copied[lang]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{labels.title[lang]}</h1>
          <p className="text-[11px] text-muted-foreground">{labels.subtitle[lang]}</p>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
              : 'bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Copy className="h-3 w-3" /> {labels.copy[lang]}
                    </button>
                    <button
                      onClick={() => handleShare(msg.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Share2 className="h-3 w-3" /> {labels.share[lang]}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.thinking[lang]}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={labels.placeholder[lang]}
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
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
