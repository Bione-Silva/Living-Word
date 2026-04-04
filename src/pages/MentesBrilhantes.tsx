import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MindCard } from '@/components/MindCard';
import { minds, type MindFullData } from '@/data/minds';
import { Brain, Sparkles, Lock } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type L = 'PT' | 'EN' | 'ES';

const pageTitle: Record<L, string> = {
  PT: 'Mentes Brilhantes',
  EN: 'Brilliant Minds',
  ES: 'Mentes Brillantes',
};

const pageSubtitle: Record<L, string> = {
  PT: 'Converse com as maiores mentes da história da pregação cristã. Cada mentor foi treinado com centenas de horas de material original.',
  EN: 'Converse with the greatest minds in Christian preaching history. Each mentor was trained on hundreds of hours of original material.',
  ES: 'Conversa con las mayores mentes de la historia de la predicación cristiana. Cada mentor fue entrenado con cientos de horas de material original.',
};

export default function MentesBrilhantes() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isFree = profile?.plan === 'free';
  const [showPaywall, setShowPaywall] = useState(false);

  const handleMindClick = (mind: MindFullData) => {
    if (mind.locked && isFree) {
      setShowPaywall(true);
    } else {
      navigate(`/dashboard/mentes/${mind.id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(43,55%,58%)]/20 flex items-center justify-center">
          <Brain className="h-5 w-5 text-[hsl(43,55%,58%)]" />
        </div>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
            {pageTitle[lang]}
            <Sparkles className="h-6 w-6 text-[hsl(43,55%,58%)]" />
          </h1>
          <p className="text-[15px] text-muted-foreground mt-1 max-w-2xl">
            {pageSubtitle[lang]}
          </p>
        </div>
      </div>

      <div className="relative rounded-2xl border border-[hsl(43,55%,58%)]/20 bg-[hsl(210,40%,6%)] p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(43,55%,58%)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[hsl(43,55%,58%)]/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {minds.map((mind, index) => (
            <MindCard
              key={mind.id}
              mind={mind}
              lang={lang}
              isFree={isFree}
              onClick={handleMindClick}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Paywall Dialog */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="bg-[hsl(210,40%,6%)] border-[hsl(43,55%,58%)]/20 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[hsl(43,55%,58%)]/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-[hsl(43,55%,58%)]" />
            </div>
            <DialogTitle className="font-display text-xl text-[hsl(43,55%,58%)]">
              {lang === 'EN' ? 'Unlock Historical Wisdom' : lang === 'ES' ? 'Desbloquea la Sabiduría Histórica' : 'Desbloqueie a Sabedoria Histórica'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {lang === 'EN' ? 'Upgrade for $100/month to access all Brilliant Minds.' : lang === 'ES' ? 'Mejora por $100/mes para acceder a todas las Mentes Brillantes.' : 'Faça o upgrade por $100/mês para acessar todas as Mentes Brilhantes.'}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => { setShowPaywall(false); navigate('/upgrade'); }}
            className="w-full py-5 text-base font-semibold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] text-[hsl(210,40%,6%)] gap-2"
          >
            {lang === 'EN' ? 'Upgrade Now' : lang === 'ES' ? 'Mejorar Ahora' : 'Fazer Upgrade'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
