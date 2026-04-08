import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Heart, Loader2, Copy, Share2, ThumbsUp,
  Sparkles, HandHeart
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

interface BomAmigoResponse {
  verse: string;
  ref: string;
  message: string;
  prayer?: string;
  detected_emotion?: string;
}

interface HistoryEntry {
  input: string;
  response: BomAmigoResponse;
}

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  title: { PT: 'O Bom Amigo', EN: 'Good Friend', ES: 'El Buen Amigo' },
  subtitle: {
    PT: 'Uma palavra certa no momento certo.',
    EN: 'The right word at the right time.',
    ES: 'La palabra correcta en el momento correcto.',
  },
  question: {
    PT: 'Como você está se sentindo agora?',
    EN: 'How are you feeling right now?',
    ES: '¿Cómo te sientes ahora?',
  },
  placeholder: {
    PT: 'Pode ser sincero. Estou aqui para ouvir.',
    EN: 'Be honest. I am here to listen.',
    ES: 'Sé sincero. Estoy aquí para escuchar.',
  },
  button: {
    PT: '💛 Quero uma Palavra',
    EN: '💛 Give me a Word',
    ES: '💛 Quiero una Palabra',
  },
  loading: {
    PT: 'Buscando uma palavra para você...',
    EN: 'Finding a word for you...',
    ES: 'Buscando una palabra para ti...',
  },
  youSaid: { PT: 'Você disse:', EN: 'You said:', ES: 'Dijiste:' },
  detected: { PT: 'Detectamos:', EN: 'Detected:', ES: 'Detectamos:' },
  prayer: { PT: '🙏 Oração', EN: '🙏 Prayer', ES: '🙏 Oración' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  copied: { PT: 'Texto copiado!', EN: 'Text copied!', ES: '¡Texto copiado!' },
  feedbackQ: {
    PT: 'Como foi essa palavra para você?',
    EN: 'How was this word for you?',
    ES: '¿Cómo fue esta palabra para ti?',
  },
  helpedMe: { PT: 'Me ajudou', EN: 'It helped', ES: 'Me ayudó' },
  beautiful: { PT: 'Foi lindo', EN: 'Beautiful', ES: 'Fue hermoso' },
  thankYou: { PT: 'Obrigado', EN: 'Thank you', ES: 'Gracias' },
  continueLabel: {
    PT: 'Compartilhe mais sobre como está se sentindo...',
    EN: 'Share more about how you are feeling...',
    ES: 'Comparte más sobre cómo te sientes...',
  },
} satisfies Record<string, Record<L, string>>;

const emotionChips: Record<L, string[]> = {
  PT: ['Ansioso', 'Sobrecarregado', 'Sozinho', 'Com medo', 'Grato', 'Sem direção', 'Triste', 'Cansado'],
  EN: ['Anxious', 'Overwhelmed', 'Lonely', 'Afraid', 'Grateful', 'Lost', 'Sad', 'Tired'],
  ES: ['Ansioso', 'Abrumado', 'Solo', 'Con miedo', 'Agradecido', 'Sin rumbo', 'Triste', 'Cansado'],
};

export default function BomAmigo() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [feeling, setFeeling] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BomAmigoResponse | null>(null);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    setFeeling(chip);
  };

  const handleSubmit = async () => {
    if (!feeling.trim() || !user || loading) return;
    setLoading(true);
    setResponse(null);
    setFeedbackGiven(false);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are a compassionate pastoral counselor called "O Bom Amigo" (The Good Friend).
The user will share how they're feeling. Respond with deep empathy and pastoral warmth.

Return ONLY valid JSON with these fields:
- "detected_emotion": the emotion you detected (1-2 words, in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'})
- "verse": the Bible verse text in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'}
- "ref": the Bible reference
- "message": a warm pastoral encouragement connecting the verse to their situation (4-6 sentences, in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'})
- "prayer": a short closing prayer (3-4 sentences, in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'})`,
          userPrompt: feeling,
          toolId: 'bom-amigo',
        },
      });

      if (error) throw error;

      const content = data?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setResponse(parsed);
          setHistory(prev => [...prev.slice(-2), { input: feeling, response: parsed }]);
        } catch {
          const fallback: BomAmigoResponse = { verse: content, ref: '', message: '', prayer: '' };
          setResponse(fallback);
        }
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    const text = `"${response.verse}"\n— ${response.ref}\n\n${response.message}${response.prayer ? `\n\n🙏 ${response.prayer}` : ''}`;
    navigator.clipboard.writeText(text);
    toast.success(labels.copied[lang]);
  };

  const handleShare = async () => {
    if (!response) return;
    const text = `"${response.verse}" — ${response.ref}\n\n${response.message}`;
    if (navigator.share) {
      try { await navigator.share({ title: labels.title[lang], text }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      toast.success(labels.copied[lang]);
    }
  };

  const handleFeedback = async (type: string) => {
    setFeedbackGiven(true);
    if (!user) return;
    await supabase.from('material_feedback').insert({
      user_id: user.id,
      material_type: 'bom-amigo',
      rating: type,
      comment: feeling,
    });
  };

  const handleContinue = () => {
    setResponse(null);
    setFeeling('');
    setSelectedChip(null);
    setFeedbackGiven(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
          <Heart className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          💬 {labels.title[lang]}
        </h1>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      {/* Input section */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <p className="text-sm font-semibold text-foreground">{labels.question[lang]}</p>
        
        <textarea
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={labels.placeholder[lang]}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />

        {/* Emotion chips */}
        <div className="flex flex-wrap gap-2">
          {emotionChips[lang].map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedChip === chip
                  ? 'bg-primary/15 border-primary/50 text-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!feeling.trim() || loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {labels.loading[lang]}
            </>
          ) : (
            labels.button[lang]
          )}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
          {/* User said */}
          <div>
            <p className="text-xs text-muted-foreground">{labels.youSaid[lang]}</p>
            <p className="text-sm text-foreground italic mt-0.5">"{feeling}"</p>
          </div>

          <div className="h-px bg-border" />

          {/* Detected emotion */}
          {response.detected_emotion && (
            <p className="text-xs text-muted-foreground">
              {labels.detected[lang]} <span className="font-semibold text-primary">{response.detected_emotion}</span>
            </p>
          )}

          {/* Verse card */}
          <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 sm:p-5 space-y-2">
            <p className="text-sm font-display italic text-foreground leading-relaxed">
              "{response.verse}"
            </p>
            {response.ref && (
              <p className="text-xs text-muted-foreground text-right font-medium">— {response.ref}</p>
            )}
          </div>

          {/* Pastoral message */}
          {response.message && (
            <p className="text-sm text-foreground/85 leading-[1.8]">{response.message}</p>
          )}

          {/* Prayer */}
          {response.prayer && (
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                {labels.prayer[lang]}
              </p>
              <p className="text-sm italic text-muted-foreground leading-relaxed">{response.prayer}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-card hover:bg-muted/50 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> {labels.share[lang]}
            </button>
          </div>

          <div className="h-px bg-border" />

          {/* Feedback */}
          {!feedbackGiven ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">{labels.feedbackQ[lang]}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleFeedback('helped')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium text-foreground bg-background hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> {labels.helpedMe[lang]}
                </button>
                <button
                  onClick={() => handleFeedback('beautiful')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium text-foreground bg-background hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {labels.beautiful[lang]}
                </button>
                <button
                  onClick={() => handleFeedback('grateful')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium text-foreground bg-background hover:bg-primary/10 hover:border-primary/30 transition-all"
                >
                  <HandHeart className="h-3.5 w-3.5" /> {labels.thankYou[lang]}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-primary font-medium">
              {lang === 'PT' ? '❤️ Obrigado pelo seu retorno!' : lang === 'ES' ? '❤️ ¡Gracias por tu respuesta!' : '❤️ Thank you for your feedback!'}
            </p>
          )}

          <div className="h-px bg-border" />

          {/* Continue */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{labels.continueLabel[lang]}</p>
            <button
              onClick={handleContinue}
              className="w-full h-10 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              {lang === 'PT' ? 'Continuar conversa' : lang === 'ES' ? 'Continuar conversación' : 'Continue conversation'}
            </button>
          </div>
        </div>
      )}

      {/* History (previous interactions from session) */}
      {history.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground px-1">
            {lang === 'PT' ? 'CONVERSAS ANTERIORES' : lang === 'ES' ? 'CONVERSACIONES ANTERIORES' : 'PREVIOUS CONVERSATIONS'}
          </p>
          {history.slice(0, -1).reverse().map((entry, idx) => (
            <div key={idx} className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-2">
              <p className="text-xs text-muted-foreground italic">"{entry.input}"</p>
              <blockquote className="text-xs text-foreground/70 border-l-2 border-primary/30 pl-3">
                "{entry.response.verse}" — {entry.response.ref}
              </blockquote>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
