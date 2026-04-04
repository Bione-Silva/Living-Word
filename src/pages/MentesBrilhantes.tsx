import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MindCard } from '@/components/MindCard';
import { minds, type MindFullData } from '@/data/minds';
import { Brain, Sparkles, Lock, Crown, Database, Shield, Cpu } from 'lucide-react';
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

  const totalTokens = '105M+';
  const totalPages = '18,000+';
  const totalHours = '1,250+';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative rounded-3xl border border-[hsl(43,30%,40%)]/15 bg-gradient-to-br from-[hsl(220,20%,7%)] via-[hsl(220,18%,9%)] to-[hsl(220,20%,6%)] p-8 sm:p-12 overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-[-100px] left-1/3 w-[600px] h-[600px] bg-[hsl(43,55%,58%)]/[0.03] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-50px] right-1/4 w-[300px] h-[300px] bg-[hsl(43,55%,58%)]/[0.02] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(43,55%,58%)]/20 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(43,55%,58%)]/10 flex items-center justify-center shrink-0 border border-[hsl(43,55%,58%)]/15">
              <Brain className="h-7 w-7 text-[hsl(43,55%,58%)]" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white/95 flex items-center gap-3 tracking-tight">
                {pageTitle[lang]}
                <Sparkles className="h-5 w-5 text-[hsl(43,55%,58%)]" />
              </h1>
              <p className="text-sm text-white/50 mt-2 max-w-2xl leading-relaxed">
                {pageSubtitle[lang]}
              </p>
            </div>
          </div>

          {/* Ecosystem stats bar */}
          <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[hsl(43,55%,58%)]/60" />
              <div>
                <p className="text-lg font-bold text-white/90 font-mono">{totalTokens}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{lang === 'EN' ? 'Context Tokens' : 'Tokens de Contexto'}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[hsl(43,55%,58%)]/60" />
              <div>
                <p className="text-lg font-bold text-white/90 font-mono">{totalPages}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{lang === 'EN' ? 'Pages Processed' : 'Páginas Processadas'}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[hsl(43,55%,58%)]/60" />
              <div>
                <p className="text-lg font-bold text-white/90 font-mono">{totalHours}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{lang === 'EN' ? 'Hours of Material' : 'Horas de Material'}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-400/60" />
              <div>
                <p className="text-lg font-bold text-emerald-400/90 font-mono">{minds.length}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{lang === 'EN' ? 'Active Agents' : 'Agentes Ativos'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Minds Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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

      {/* ── Paywall Dialog ─────────────────────────────────── */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="bg-[hsl(220,20%,8%)] border-[hsl(43,30%,40%)]/20 max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[hsl(43,55%,58%)]/10 flex items-center justify-center mb-3 border border-[hsl(43,55%,58%)]/15">
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
            className="w-full py-6 text-base font-bold bg-gradient-to-r from-[hsl(43,55%,48%)] to-[hsl(35,45%,38%)] hover:from-[hsl(43,55%,55%)] hover:to-[hsl(35,45%,45%)] text-white gap-2 rounded-xl"
          >
            <Crown className="h-5 w-5" />
            {lang === 'EN' ? 'Upgrade Now' : lang === 'ES' ? 'Mejorar Ahora' : 'Fazer Upgrade'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
