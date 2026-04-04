import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MindCard } from '@/components/MindCard';
import { minds, type MindFullData } from '@/data/minds';
import { Brain, Sparkles, Lock, Crown, Database } from 'lucide-react';
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
  PT: 'Converse com as maiores mentes da história da pregação cristã. Cada mentor foi treinado com centenas de horas de material original, milhares de páginas processadas e milhões de tokens de contexto.',
  EN: 'Converse with the greatest minds in Christian preaching history. Each mentor was trained on hundreds of hours of original material, thousands of processed pages and millions of context tokens.',
  ES: 'Conversa con las mayores mentes de la historia de la predicación cristiana. Cada mentor fue entrenado con cientos de horas de material original, miles de páginas procesadas y millones de tokens de contexto.',
};

const statsLabel: Record<L, string> = {
  PT: 'Ecossistema de Inteligência Pastoral',
  EN: 'Pastoral Intelligence Ecosystem',
  ES: 'Ecosistema de Inteligencia Pastoral',
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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[hsl(43,55%,58%)]/15 flex items-center justify-center shrink-0">
          <Brain className="h-6 w-6 text-[hsl(43,55%,58%)]" />
        </div>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2.5 tracking-tight">
            {pageTitle[lang]}
            <Sparkles className="h-6 w-6 text-[hsl(43,55%,58%)]" />
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            {pageSubtitle[lang]}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[hsl(43,55%,58%)]/10 bg-[hsl(43,55%,58%)]/[0.03]">
        <Database className="h-4 w-4 text-[hsl(43,55%,58%)]/60" />
        <span className="text-xs font-semibold text-[hsl(43,55%,58%)]/70 tracking-wide uppercase">{statsLabel[lang]}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">{minds.length} {lang === 'EN' ? 'Agents Available' : lang === 'ES' ? 'Agentes Disponibles' : 'Agentes Disponíveis'}</span>
      </div>

      {/* Grid */}
      <div className="relative rounded-3xl border border-[hsl(43,55%,58%)]/15 bg-gradient-to-b from-[hsl(215,50%,7%)] to-[hsl(210,40%,5%)] p-6 sm:p-10 overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[hsl(43,55%,58%)]/[0.03] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[hsl(43,55%,58%)]/[0.02] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(43,55%,58%)]/15 to-transparent" />

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
        <DialogContent className="bg-gradient-to-b from-[hsl(215,50%,8%)] to-[hsl(210,40%,5%)] border-[hsl(43,55%,58%)]/20 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[hsl(43,55%,58%)]/10 flex items-center justify-center mb-3">
              <Lock className="h-7 w-7 text-[hsl(43,55%,58%)]" />
            </div>
            <DialogTitle className="font-display text-2xl text-[hsl(43,55%,58%)]">
              {lang === 'EN' ? 'Unlock Historical Wisdom' : lang === 'ES' ? 'Desbloquea la Sabiduría Histórica' : 'Desbloqueie a Sabedoria Histórica'}
            </DialogTitle>
            <DialogDescription className="text-white/50 mt-2">
              {lang === 'EN' ? 'Upgrade for $100/month to access all Brilliant Minds and unlock their full theological intelligence.' : lang === 'ES' ? 'Mejora por $100/mes para acceder a todas las Mentes Brillantes y desbloquear su inteligencia teológica completa.' : 'Faça o upgrade por $100/mês para acessar todas as Mentes Brilhantes e desbloquear toda a inteligência teológica.'}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => { setShowPaywall(false); navigate('/upgrade'); }}
            className="w-full py-6 text-base font-bold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] hover:from-[hsl(43,55%,65%)] hover:to-[hsl(35,55%,57%)] text-[hsl(210,40%,6%)] gap-2 rounded-xl shadow-[0_0_40px_hsl(43,55%,58%,0.2)]"
          >
            <Crown className="h-5 w-5" />
            {lang === 'EN' ? 'Upgrade Now' : lang === 'ES' ? 'Mejorar Ahora' : 'Fazer Upgrade'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
