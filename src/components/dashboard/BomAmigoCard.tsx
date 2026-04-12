import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  header: { PT: 'PALAVRA AMIGA', EN: 'FRIENDLY WORD', ES: 'PALABRA AMIGA' },
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
  const navigate = useNavigate();
  const [feeling, setFeeling] = useState('');

  const handleSubmit = () => {
    if (!feeling.trim()) return;
    navigate(`/bom-amigo?feeling=${encodeURIComponent(feeling.trim())}`);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
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

      <div className="space-y-2">
        <input
          type="text"
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={labels.placeholder[lang]}
          className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!feeling.trim()}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
        >
          {labels.button[lang]}
        </button>
      </div>
    </div>
  );
}
