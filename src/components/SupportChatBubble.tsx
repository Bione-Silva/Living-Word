import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Send, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EMOTIONAL_PATTERNS = [
  // PT
  /como\s+(voc[êe]|vc)\s+(est[áa]|t[áa])/i,
  /me\s+sint[oa]/i,
  /estou\s+(triste|ansios[oa]|sozinho|com\s+medo|cansad[oa]|sobrecarregad[oa]|preocupad[oa]|angustiad[oa]|deprimid[oa])/i,
  /t[ôo]\s+(triste|ansios[oa]|sozinho|com\s+medo|cansad[oa]|sobrecarregad[oa]|mal|preocupad[oa])/i,
  /preciso\s+(de\s+)?(ajuda|oração|uma\s+palavra|consolo|conforto|desabafar|conversar)/i,
  /pode\s+orar/i,
  /ora\s+(por|comigo)/i,
  /tudo\s+certo\s+com\s+voc[êe]/i,
  /voc[êe]\s+est[áa]\s+bem/i,
  // EN
  /how\s+are\s+you\s+feeling/i,
  /i\s+feel\s+(sad|anxious|lonely|afraid|tired|overwhelmed|depressed|worried)/i,
  /i\s+am\s+(sad|anxious|lonely|afraid|tired|overwhelmed|worried)/i,
  /i\s+need\s+(help|prayer|a\s+word|comfort|to\s+talk)/i,
  /pray\s+for\s+me/i,
  /are\s+you\s+ok/i,
  // ES
  /c[óo]mo\s+te\s+sientes/i,
  /me\s+siento\s+(triste|ansios[oa]|sol[oa]|con\s+miedo|cansad[oa]|abrumad[oa])/i,
  /necesito\s+(ayuda|oración|una\s+palabra|consuelo|hablar)/i,
  /ora\s+por\s+m[íi]/i,
];

function isEmotionalMessage(text: string): boolean {
  return EMOTIONAL_PATTERNS.some(p => p.test(text));
}

export function SupportChatBubble() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const userName = profile?.full_name?.split(' ')[0] || '';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: userName
      ? `Olá, ${userName}! Eu sou o assistente oficial de treinamento da Living Word. Como posso te ajudar hoje?`
      : 'Olá! Eu sou o assistente oficial de treinamento da Living Word. Como posso te ajudar hoje?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Detect emotional messages → redirect to Palavra Amiga chat
    if (isEmotionalMessage(text)) {
      const redirectMsg = lang === 'EN'
        ? `I noticed you'd like to talk about how you're feeling. Let me take you to our Friendly Word chat, where I can listen to you with more care. 💛`
        : lang === 'ES'
        ? `Noté que quieres hablar sobre cómo te sientes. Déjame llevarte a nuestro chat Palabra Amiga, donde puedo escucharte con más cariño. 💛`
        : `Percebi que você quer conversar sobre como está se sentindo. Deixa eu te levar pro nosso chat Palavra Amiga, onde posso te ouvir com mais carinho. 💛`;

      setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: redirectMsg }]);
      setInput('');

      setTimeout(() => {
        setOpen(false);
        navigate(`/bom-amigo?feeling=${encodeURIComponent(text)}`);
      }, 1500);
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('support-agent', {
        body: { message: text, history: [...messages, userMsg].slice(-10), userName: userName || undefined },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data?.reply || 'Desculpe, não consegui responder agora.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com o assistente. Tente novamente.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
          title="Central de Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      )}

      {open && (
        <button
          onClick={() => setOpen(false)}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors flex items-center justify-center"
          title="Fechar Ajuda"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="fixed top-16 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-[360px] h-[480px] max-h-[calc(100vh-5rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <LifeBuoy className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Central de Ajuda</p>
              <p className="text-[10px] opacity-80">Living Word Assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">
                  Digitando...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border shrink-0 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua dúvida..."
              disabled={loading}
              className="text-sm text-foreground bg-background placeholder:text-muted-foreground"
            />
            <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
