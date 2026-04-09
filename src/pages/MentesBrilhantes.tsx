import { useNavigate } from 'react-router-dom';
import { hasAccess, type PlanSlug } from '@/lib/plans';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MindCard } from '@/components/MindCard';
import { MindDetailSheet } from '@/components/MindDetailSheet';
import { minds, type MindFullData } from '@/data/minds';
import { Brain, Sparkles, Lock, Crown, Database, Cpu, ArrowLeftRight } from 'lucide-react';
import { CompareMindsDialog } from '@/components/minds/CompareMindsDialog';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const isFree = !hasAccess((profile?.plan as PlanSlug) || 'free', 'mentes_brilhantes');
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedMind, setSelectedMind] = useState<MindFullData | null>(null);
  const [activeMinds, setActiveMinds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [loadingMinds, setLoadingMinds] = useState(true);

  useEffect(() => {
    const loadActiveMinds = async () => {
      const { data } = await supabase
        .from('mind_settings')
        .select('mind_id')
        .eq('active', true);
      if (data) setActiveMinds(data.map((d: any) => d.mind_id));
      setLoadingMinds(false);
    };
    loadActiveMinds();
  }, []);

  const visibleMinds = minds.filter(m => activeMinds.includes(m.id));

  const handleMindClick = (mind: MindFullData) => {
    if (mind.locked && isFree) {
      setShowPaywall(true);
    } else {
      setSelectedMind(mind);
    }
  };

  const totalTokens = '168M+';
  const totalPages = '30,000+';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Hero Header (Clean/Light) ── */}
      <div className="relative rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-5 sm:p-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,40%,75%)] to-transparent" />

        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[hsl(35,35%,93%)] flex items-center justify-center shrink-0 border border-[hsl(35,25%,85%)]">
              <Brain className="h-6 w-6 text-[hsl(35,45%,45%)]" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-[hsl(220,15%,15%)] flex items-center gap-3 tracking-tight">
                {pageTitle[lang]}
                <Sparkles className="h-5 w-5 text-[hsl(35,50%,55%)]" />
              </h1>
              <p className="text-sm text-[hsl(220,10%,50%)] mt-1.5 max-w-2xl leading-relaxed">
                {pageSubtitle[lang]}
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-[hsl(30,15%,90%)]">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[hsl(35,40%,55%)]" />
              <div>
                <p className="text-lg font-bold text-[hsl(220,15%,20%)] font-mono">{totalTokens}</p>
                <p className="text-[10px] text-[hsl(220,10%,55%)] uppercase tracking-wider">{lang === 'EN' ? 'Context Tokens' : 'Tokens de Contexto'}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[hsl(30,15%,88%)]" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[hsl(35,40%,55%)]" />
              <div>
                <p className="text-lg font-bold text-[hsl(220,15%,20%)] font-mono">{totalPages}</p>
                <p className="text-[10px] text-[hsl(220,10%,55%)] uppercase tracking-wider">{lang === 'EN' ? 'Pages Processed' : 'Páginas Processadas'}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[hsl(30,15%,88%)]" />
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-lg font-bold text-emerald-600 font-mono">{visibleMinds.length}</p>
                <p className="text-[10px] text-[hsl(220,10%,55%)] uppercase tracking-wider">{lang === 'EN' ? 'Active Agents' : 'Agentes Ativos'}</p>
              </div>
            </div>
            {visibleMinds.length >= 2 && (
              <>
                <div className="w-px h-8 bg-[hsl(30,15%,88%)]" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompare(true)}
                  className="gap-2 border-[hsl(35,30%,80%)] text-[hsl(35,45%,40%)] hover:bg-[hsl(35,40%,95%)]"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  {lang === 'EN' ? 'Compare Minds' : lang === 'ES' ? 'Comparar Mentes' : 'Comparar Mentes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Minds Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {loadingMinds ? (
          <p className="col-span-full text-center text-muted-foreground py-8">{t('minds.loading')}</p>
        ) : visibleMinds.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">{t('minds.empty')}</p>
        ) : visibleMinds.map((mind, index) => (
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

      {/* ── Mind Detail Sheet ── */}
      <MindDetailSheet
        mind={selectedMind}
        open={!!selectedMind}
        onOpenChange={(open) => { if (!open) setSelectedMind(null); }}
      />

      {/* ── Paywall Dialog ── */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="bg-white border-[hsl(30,15%,85%)] max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[hsl(35,35%,93%)] flex items-center justify-center mb-3 border border-[hsl(35,25%,85%)]">
              <Lock className="h-6 w-6 text-[hsl(35,45%,45%)]" />
            </div>
            <DialogTitle className="font-display text-2xl text-[hsl(35,45%,40%)]">
              {lang === 'EN' ? 'Unlock Historical Wisdom' : lang === 'ES' ? 'Desbloquea la Sabiduría Histórica' : 'Desbloqueie a Sabedoria Histórica'}
            </DialogTitle>
            <DialogDescription className="text-[hsl(220,10%,50%)] mt-2">
              {lang === 'EN' ? 'Upgrade for $100/month to access all Brilliant Minds.' : lang === 'ES' ? 'Mejora por $100/mes para acceder a todas las Mentes Brillantes.' : 'Faça o upgrade por $100/mês para acessar todas as Mentes Brilhantes.'}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => { setShowPaywall(false); navigate('/upgrade'); }}
            className="w-full py-5 text-base font-bold bg-gradient-to-r from-[hsl(28,45%,32%)] to-[hsl(25,40%,26%)] hover:from-[hsl(28,45%,38%)] hover:to-[hsl(25,40%,32%)] text-white gap-2 rounded-xl"
          >
            <Crown className="h-5 w-5" />
            {lang === 'EN' ? 'Upgrade Now' : lang === 'ES' ? 'Mejorar Ahora' : 'Fazer Upgrade'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Compare Dialog ── */}
      <CompareMindsDialog
        open={showCompare}
        onOpenChange={setShowCompare}
        minds={visibleMinds}
        lang={lang}
      />
    </div>
  );
}
