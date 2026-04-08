import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Send, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function SupportChatBubble() {
  const { profile } = useAuth();
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
      {/* Inline trigger button — rendered where placed in layout, not floating */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
          title="Central de Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      )}

      {/* Inline close button when chat is open */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors flex items-center justify-center"
          title="Fechar Ajuda"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Chat Window — fixed overlay */}
      {open && (
        <div className="fixed top-16 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-[360px] h-[480px] max-h-[calc(100vh-5rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
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

          {/* Messages */}
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

          {/* Input */}
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
