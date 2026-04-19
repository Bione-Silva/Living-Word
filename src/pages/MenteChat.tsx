import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2, BookOpen, PenTool, Users, GraduationCap, ThumbsUp, ThumbsDown, Copy, Sparkles, X, Save } from 'lucide-react';
import { ArtifactActions } from '@/components/mind-chat/ArtifactActions';
import { useState, useRef, useEffect, useCallback } from 'react';
import { minds } from '@/data/minds';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

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
    PT: (n) => `Paz, meu querido(a)! Que privilégio poder caminhar contigo nessa construção. Sou ${n}, e estou aqui para te ajudar a preparar um **sermão completo e profissional**.\n\nPara que eu possa estruturar esse sermão com a precisão de um mentor e a unção de um pastor, preciso de três informações estratégicas:\n\n**📖 O Texto Base:** Você já tem uma passagem em mente que está queimando no seu coração? Se não tiver, posso sugerir uma.\n\n**👥 O Público-Alvo:** É uma igreja de famílias, jovens, empresários, ou uma congregação mais madura e tradicional? Isso muda o tom da entrega.\n\n**💔 O "Ponto de Dor":** Qual a maior dificuldade que você percebe na sua igreja hoje? (Ex: falta de propósito, conflitos, luto, crise financeira...)\n\n*Me dê esses detalhes e eu vou montar o sermão completo para você!*`,
    EN: (n) => `Peace, dear one! What a privilege to walk with you in this process. I'm ${n}, and I'm here to help you prepare a **complete, professional sermon**.\n\nTo structure this sermon with both precision and anointing, I need three key pieces of information:\n\n**📖 The Base Text:** Do you already have a passage burning in your heart? If not, I can suggest one.\n\n**👥 The Audience:** Is it a family church, youth group, leaders, or a more mature congregation? This changes the delivery tone.\n\n**💔 The "Pain Point":** What's the biggest struggle you see in your church today? (e.g.: lack of purpose, conflict, grief, financial crisis...)\n\n*Give me these details and I'll build the complete sermon for you!*`,
    ES: (n) => `¡Paz, querido(a)! Qué privilegio caminar contigo en esta construcción. Soy ${n}, y estoy aquí para ayudarte a preparar un **sermón completo y profesional**.\n\nPara estructurar este sermón con precisión y unción, necesito tres informaciones clave:\n\n**📖 El Texto Base:** ¿Ya tienes un pasaje en mente? Si no, puedo sugerir uno.\n\n**👥 El Público:** ¿Es una iglesia de familias, jóvenes, líderes, o una congregación más madura? Esto cambia el tono.\n\n**💔 El "Punto de Dolor":** ¿Cuál es la mayor dificultad que percibes en tu iglesia hoy?\n\n*¡Dame esos detalles y te preparo el sermón completo!*`,
  },
  aconselhamento: {
    PT: (n) => `Paz do Senhor. Sou ${n}. Estou aqui para ouvi-lo com o coração aberto. O que está pesando em sua alma hoje?`,
    EN: (n) => `Peace of the Lord. I'm ${n}. I'm here to listen with an open heart. What's weighing on your soul today?`,
    ES: (n) => `Paz del Señor. Soy ${n}. Estoy aquí para escucharte con el corazón abierto. ¿Qué pesa en tu alma hoy?`,
  },
  estudo: {
    PT: (n) => `Saudações, irmão(ã)! Sou ${n}. Que alegria poder mergulhar nas Escrituras contigo.\n\nPara preparar um **estudo bíblico completo e profundo**, me diga:\n\n**📖 Passagem ou Tema:** Qual texto ou doutrina deseja explorar?\n\n**🎯 Propósito:** É para estudo pessoal, escola bíblica, célula ou discipulado?\n\n**📊 Profundidade:** Quer algo panorâmico ou um deep dive exegético?\n\n*Com essas informações, vou gerar o estudo completo para você!*`,
    EN: (n) => `Greetings! I'm ${n}. What a joy to dive into the Scriptures with you.\n\nTo prepare a **complete, in-depth Bible study**, tell me:\n\n**📖 Passage or Topic:** Which text or doctrine would you like to explore?\n\n**🎯 Purpose:** Is it for personal study, Sunday school, small group, or discipleship?\n\n**📊 Depth:** Do you want an overview or a deep exegetical dive?\n\n*With these details, I'll generate the complete study for you!*`,
    ES: (n) => `¡Saludos! Soy ${n}. Qué gozo poder sumergirnos en las Escrituras juntos.\n\nPara preparar un **estudio bíblico completo y profundo**, dime:\n\n**📖 Pasaje o Tema:** ¿Qué texto o doctrina deseas explorar?\n\n**🎯 Propósito:** ¿Es para estudio personal, escuela bíblica, célula o discipulado?\n\n**📊 Profundidad:** ¿Quieres algo panorámico o un deep dive exegético?\n\n*¡Con esos detalles, te genero el estudio completo!*`,
  },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mind-chat`;

async function streamMindChat({
  messages,
  mindId,
  modality,
  language,
  userName,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  mindId: string;
  modality: string;
  language: string;
  userName: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, mindId, modality, language, userName }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: 'Unknown error' }));
    onError(body.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError('No response body');
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
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
  const { user, profile } = useAuth();
  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'pastor';
  const menteId = searchParams.get('mente') || '';
  const modalidade = searchParams.get('modalidade') || '';
  const mind = minds.find((m) => m.id === menteId);
  const name = mind?.name || 'Mentor';
  const modLabel = modalityLabels[modalidade]?.[lang] || modalidade;
  const ModIcon = modalityIcons[modalidade] || BookOpen;
  const welcome = welcomeMessages[modalidade]?.[lang]?.(name) || `Olá, sou ${name}.`;

  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: welcome }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionPopup, setSelectionPopup] = useState<{
    text: string;
    msgIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [improving, setImproving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const isArtifact = (content: string) => {
    if (content.length < 800) return false;
    const hasHeaders = (content.match(/^#{1,3}\s/gm) || []).length >= 2;
    return hasHeaders;
  };

  const handleSaveToLibrary = async (content: string, msgIndex: number) => {
    if (!user) {
      toast.error(lang === 'PT' ? 'Faça login para salvar' : lang === 'EN' ? 'Login to save' : 'Inicia sesión para guardar');
      return;
    }

    const typeMap: Record<string, string> = { sermao: 'sermon', estudo: 'study', devocional: 'devotional', aconselhamento: 'counseling' };
    const materialType = typeMap[modalidade] || 'sermon';

    const titleMatch = content.match(/^#\s+(.+)/m) || content.match(/^##\s+(.+)/m);
    const title = titleMatch?.[1]?.replace(/[*_]/g, '').trim() || `${modLabel} — ${name}`;

    const { error } = await supabase.from('materials').insert({
      user_id: user.id,
      type: materialType,
      title,
      content,
      language: lang,
    });

    if (error) {
      toast.error(lang === 'PT' ? 'Erro ao salvar' : lang === 'EN' ? 'Error saving' : 'Error al guardar');
    } else {
      setSavedIndexes((prev) => new Set(prev).add(msgIndex));
      toast.success(lang === 'PT' ? 'Salvo na Biblioteca! 📚' : lang === 'EN' ? 'Saved to Library! 📚' : '¡Guardado en la Biblioteca! 📚');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length < 10) return;

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
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
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
        userName: userDisplayName,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            lang === 'PT'
              ? '⚠️ Erro de conexão. Tente novamente.'
              : lang === 'EN'
                ? '⚠️ Connection error. Please try again.'
                : '⚠️ Error de conexión. Inténtalo de nuevo.',
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(lang === 'PT' ? 'Texto copiado!' : lang === 'EN' ? 'Text copied!' : '¡Texto copiado!');
  };

  const handleFeedback = (index: number, type: 'up' | 'down') => {
    setFeedback((prev) => ({
      ...prev,
      [index]: prev[index] === type ? undefined! : type,
    }));

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
    setSelectionPopup(null);

    const improvePrompt =
      lang === 'PT'
        ? `Por favor, melhore e expanda o seguinte trecho, mantendo o mesmo tom e estilo pastoral. Retorne apenas o texto melhorado:\n\n"${selectedText}"`
        : lang === 'EN'
          ? `Please improve and expand the following excerpt, keeping the same pastoral tone and style. Return only the improved text:\n\n"${selectedText}"`
          : `Por favor, mejora y expande el siguiente fragmento, manteniendo el mismo tono y estilo pastoral. Devuelve solo el texto mejorado:\n\n"${selectedText}"`;

    const userMsg: Msg = { role: 'user', content: improvePrompt };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
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
        userName: userDisplayName,
        onDelta: upsert,
        onDone: () => {
          setIsLoading(false);
          setImproving(false);
        },
        onError: (msg) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
          setIsLoading(false);
          setImproving(false);
        },
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: lang === 'PT' ? '⚠️ Erro ao melhorar texto.' : lang === 'EN' ? '⚠️ Error improving text.' : '⚠️ Error al mejorar el texto.',
        },
      ]);
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
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/mentes/${menteId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {mind && (
          <div className="w-10 h-10 rounded-full border-2 border-[hsl(263,70%,50%)]/40 overflow-hidden">
            <MindAvatar src={mind.image} name={name} size={40} />
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-5 px-1" onMouseUp={handleMouseUp}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] sm:max-w-[75%]">
              <div
                data-msg-index={i}
                className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[hsl(263,70%,50%)] text-[hsl(210,40%,6%)] rounded-br-md'
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

              {msg.role === 'assistant' && i > 0 && !isLoading && (
                <>
                <div className="flex items-center gap-1 mt-1.5 ml-1">
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    title={lang === 'PT' ? 'Copiar texto' : lang === 'EN' ? 'Copy text' : 'Copiar texto'}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(i, 'up')}
                    className={`p-1.5 rounded-md transition-colors ${
                      feedback[i] === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                    title={lang === 'PT' ? 'Gostei' : lang === 'EN' ? 'Like' : 'Me gustó'}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(i, 'down')}
                    className={`p-1.5 rounded-md transition-colors ${
                      feedback[i] === 'down' ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                    title={lang === 'PT' ? 'Não gostei' : lang === 'EN' ? 'Dislike' : 'No me gustó'}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>

                  {isArtifact(msg.content) && (
                    <button
                      onClick={() => handleSaveToLibrary(msg.content, i)}
                      disabled={savedIndexes.has(i)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ml-1 ${
                        savedIndexes.has(i)
                          ? 'text-emerald-500 bg-emerald-500/10 cursor-default'
                          : 'text-[hsl(263,70%,50%)] hover:bg-[hsl(263,70%,50%)]/10 hover:text-[hsl(270,35%,78%)]'
                      }`}
                      title={lang === 'PT' ? 'Salvar na Biblioteca' : lang === 'EN' ? 'Save to Library' : 'Guardar en Biblioteca'}
                    >
                      <Save className="h-3.5 w-3.5" />
                      {savedIndexes.has(i)
                        ? (lang === 'PT' ? 'Salvo' : lang === 'EN' ? 'Saved' : 'Guardado')
                        : (lang === 'PT' ? 'Salvar na Biblioteca' : lang === 'EN' ? 'Save to Library' : 'Guardar en Biblioteca')}
                    </button>
                  )}
                </div>
                {isArtifact(msg.content) && user && (
                  <ArtifactActions
                    content={msg.content}
                    lang={lang}
                    userId={user.id}
                    modalidade={modalidade}
                    mindName={name}
                    blogHandle={profile?.blog_handle}
                  />
                )}
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-muted/40 border border-border/40 rounded-2xl rounded-bl-md px-5 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(263,70%,50%)]" />
            </div>
          </div>
        )}
      </div>

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
            <button onClick={() => setSelectionPopup(null)} className="p-1 rounded-md hover:bg-background/10 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="w-0 h-0 mx-auto border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-foreground" />
        </div>
      )}

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
            className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(263,70%,50%)]/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="h-11 w-11 rounded-xl bg-[hsl(263,70%,50%)] hover:bg-[hsl(270,35%,78%)] text-[hsl(210,40%,6%)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
