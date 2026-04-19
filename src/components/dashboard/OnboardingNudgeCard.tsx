import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const COPY = {
  PT: {
    title: 'Personalize sua experiência pastoral',
    desc: 'Diga-nos sua doutrina, tom e contexto. A IA passa a falar como você.',
    cta: 'Completar agora',
    later: 'Depois',
  },
  EN: {
    title: 'Personalize your pastoral experience',
    desc: 'Tell us your doctrine, tone and context. The AI starts speaking like you.',
    cta: 'Complete now',
    later: 'Later',
  },
  ES: {
    title: 'Personaliza tu experiencia pastoral',
    desc: 'Cuéntanos tu doctrina, tono y contexto. La IA empieza a hablar como tú.',
    cta: 'Completar ahora',
    later: 'Después',
  },
};

const STORAGE_KEY = 'lw-onboarding-nudge-dismissed';

export function OnboardingNudgeCard() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const incomplete = !profile?.doctrine || !profile?.pastoral_voice || !profile?.church_name;
  if (!incomplete || dismissed) return null;

  const c = COPY[(lang as keyof typeof COPY)] || COPY.PT;

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <Card className="relative p-5 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0 overflow-hidden">
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-display text-base font-semibold text-foreground">{c.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
          <div className="flex items-center gap-2 mt-3">
            <Button asChild size="sm">
              <Link to="/configuracoes?tab=church">
                {c.cta}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              {c.later}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
