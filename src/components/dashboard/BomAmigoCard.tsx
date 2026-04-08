import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Loader2 } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  header: { PT: 'O BOM AMIGO', EN: 'GOOD FRIEND', ES: 'EL BUEN AMIGO' },
  question: {
    PT: 'Como você está se sentindo hoje?',
    EN: 'How are you feeling today?',
    ES: '¿Cómo te sientes hoy?',
  },
  placeholder: {
    PT: 'Ex: Estou ansioso, me sinto sozinho...',
    EN: 'Ex: I feel anxious, I feel lonely...',
    ES: 'Ej: Estoy ansioso, me siento solo...',
  },
  button: {
    PT: 'Quero uma Palavra',
    EN: 'Give me a Word',
    ES: 'Quiero una Palabra',
  },
} satisfies Record<string, Record<L, string>>;

export function BomAmigoCard() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [feeling, setFeeling] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ verse: string; ref: string; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!feeling.trim() || !user || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are a compassionate pastoral counselor called "O Bom Amigo" (The Good Friend). 
The user will share how they're feeling. Respond with:
1. A relevant Bible verse with reference
2. A brief, warm, pastoral encouragement (2-3 sentences max)

Return ONLY valid JSON with these fields:
- "verse": the Bible verse text in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'}
- "ref": the Bible reference
- "message": the encouragement message in ${lang === 'EN' ? 'English' : lang === 'ES' ? 'Spanish' : 'Portuguese'}`,
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
        } catch {
          setResponse({ verse: content, ref: '', message: '' });
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
            {labels.header[lang]}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {labels.question[lang]}
          </p>
        </div>
      </div>

      {/* Input + Button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={labels.placeholder[lang]}
          className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!feeling.trim() || loading}
          className="h-11 px-4 sm:px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {labels.button[lang]}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div className="rounded-xl bg-background/50 border border-border/50 p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <blockquote className="text-sm italic text-foreground leading-relaxed border-l-2 border-primary pl-3">
            "{response.verse}"
          </blockquote>
          {response.ref && (
            <p className="text-xs text-muted-foreground text-right">— {response.ref}</p>
          )}
          {response.message && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
              {response.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
