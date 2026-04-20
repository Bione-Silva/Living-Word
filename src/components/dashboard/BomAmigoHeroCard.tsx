import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const L10N = {
  label: { PT: 'PALAVRA AMIGA', EN: 'FRIENDLY WORD', ES: 'PALABRA AMIGA' },
  subtitle: {
    PT: 'Converse, desabafe e receba apoio espiritual com IA.',
    EN: 'Talk, share and receive spiritual support with AI.',
    ES: 'Conversa, desahógate y recibe apoyo espiritual con IA.',
  },
  agent: {
    PT: 'Bom dia! Como você está se sentindo hoje?',
    EN: 'Good morning! How are you feeling today?',
    ES: '¡Buenos días! ¿Cómo te sientes hoy?',
  },
  user: {
    PT: 'Estou ansioso e com o coração pesado.',
    EN: 'I feel anxious and heavy-hearted.',
    ES: 'Estoy ansioso y con el corazón pesado.',
  },
  agent2: {
    PT: 'Entendo... Estou aqui para ouvir você. Quer me contar o que está acontecendo?',
    EN: "I understand... I'm here to listen. Want to tell me what's happening?",
    ES: 'Entiendo... Estoy aquí para escucharte. ¿Quieres contarme qué pasa?',
  },
  cta: { PT: 'Conversar agora', EN: 'Talk now', ES: 'Conversar ahora' },
  trust: {
    PT: 'Atendimento seguro e confidencial',
    EN: 'Safe and confidential support',
    ES: 'Atención segura y confidencial',
  },
} satisfies Record<string, Record<L, string>>;

export function BomAmigoHeroCard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <section
      className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-foreground">
          {L10N.label[lang]}
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-foreground/75 leading-relaxed mb-4">
        {L10N.subtitle[lang]}
      </p>

      {/* Conversation preview */}
      <div className="flex-1 space-y-2.5 mb-4">
        <div className="flex items-end gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 max-w-[80%]">
            <p className="text-xs text-foreground leading-snug">{L10N.agent[lang]}</p>
          </div>
        </div>

        <div className="flex items-end gap-2 justify-end">
          <div className="rounded-2xl rounded-br-sm bg-primary/15 text-foreground px-3 py-2 max-w-[80%]">
            <p className="text-xs leading-snug">{L10N.user[lang]}</p>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 max-w-[80%]">
            <p className="text-xs text-foreground leading-snug">{L10N.agent2[lang]}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/bom-amigo')}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        {L10N.cta[lang]}
        <ArrowRight className={`h-4 w-4 transition-transform ${hovered ? 'translate-x-0.5' : ''}`} />
      </button>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" />
        <span>{L10N.trust[lang]}</span>
      </div>
    </section>
  );
}
