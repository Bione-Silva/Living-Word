import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToolSheet } from '@/components/ToolSheet';
import { ExtrasModal } from '@/components/ExtrasModal';
import { extraOutreachTools, extraFunTools } from '@/components/ExtraToolsSections';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { DashboardTopBanner } from '@/components/dashboard/DashboardTopBanner';
import { BomAmigoCard } from '@/components/dashboard/BomAmigoCard';
import { DevotionalCard } from '@/components/dashboard/DevotionalCard';
import { ToolsCircleGrid } from '@/components/dashboard/ToolsCircleGrid';
import { StreakBar } from '@/components/dashboard/StreakBar';
import { MoreToolsAccordion } from '@/components/dashboard/MoreToolsAccordion';
import { RecentGenerations } from '@/components/dashboard/RecentGenerations';
import { SocialStudioHighlightCard } from '@/components/dashboard/SocialStudioHighlightCard';
import { MonthlyOverviewCard } from '@/components/dashboard/MonthlyOverviewCard';
import { OnboardingNudgeCard } from '@/components/dashboard/OnboardingNudgeCard';
import { SmartDevotionalRecommender } from '@/components/engagement/SmartDevotionalRecommender';
import { UserEngagementDashboard } from '@/components/engagement/UserEngagementDashboard';
import { NotificationCenter } from '@/components/engagement/NotificationCenter';
import { UpgradeModal } from '@/components/UpgradeModal';
import {
  Search, BookOpen, Globe, Quote, ScrollText, Languages,
  Wand2, PenLine, Type, Lightbulb, Sparkles, Film,
  GraduationCap, Gamepad2, Feather, Baby
} from 'lucide-react';
import type { ToolCardData } from '@/components/ToolCard';
import { isToolLockedForPlan, getMinPlanForTool, type PlanSlug } from '@/lib/plans';

const researchTools: ToolCardData[] = [
  { id: 'topic-explorer', icon: Search, title: { PT: 'Explorador de Tópicos', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
];
const createTools: ToolCardData[] = [
  { id: 'studio', icon: Wand2, title: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'biblical-study', icon: GraduationCap, title: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, description: { PT: '', EN: '', ES: '' }, path: '/estudos/novo' },
  { id: 'free-article', icon: PenLine, title: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'title-gen', icon: Type, title: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'metaphor-creator', icon: Lightbulb, title: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'illustrations', icon: Film, title: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' }, description: { PT: '', EN: '', ES: '' }, locked: true, hasModal: true },
  { id: 'bible-modernizer', icon: Sparkles, title: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'free-article-universal', icon: PenLine, title: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
];
const allTools: ToolCardData[] = [...researchTools, ...createTools, ...extraOutreachTools, ...extraFunTools];

export default function Dashboard() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const userPlan: PlanSlug = (profile?.plan as PlanSlug) || 'free';
  const isFree = userPlan === 'free';
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string } | null>(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ featureName: string; toolId: string; requiredPlan: PlanSlug } | null>(null);
  const requestedToolId = searchParams.get('tool');

  useEffect(() => {
    if (!requestedToolId) return;
    const tool = allTools.find((t) => t.id === requestedToolId);
    if (!tool) return;
    if (isToolLockedForPlan(tool.id, userPlan)) {
      setSearchParams({}, { replace: true });
      return;
    }
    setActiveSheet((c) => c?.id === tool.id ? c : { id: tool.id, title: tool.title[lang] });
  }, [requestedToolId, userPlan, lang, setSearchParams]);

  const handleToolClick = (toolId: string) => {
    const tool = allTools.find((t) => t.id === toolId);
    if (!tool) return;
    if (isToolLockedForPlan(tool.id, userPlan)) {
      setUpgradeModal({
        featureName: tool.title[lang],
        toolId: tool.id,
        requiredPlan: getMinPlanForTool(tool.id),
      });
      return;
    }
    if (tool.hasModal) {
      setActiveSheet({ id: tool.id, title: tool.title[lang] });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <DashboardTopBanner />
      <DashboardGreeting />
      <OnboardingNudgeCard />
      <MonthlyOverviewCard />
      <div id="bom-amigo">
        <BomAmigoCard />
      </div>
      <DevotionalCard />
      <SmartDevotionalRecommender />
      <ToolsCircleGrid onToolClick={handleToolClick} />
      <SocialStudioHighlightCard />
      <StreakBar />
      <NotificationCenter />
      <MoreToolsAccordion onToolClick={handleToolClick} />
      <UserEngagementDashboard />
      <RecentGenerations />

      <ExtrasModal
        open={extrasOpen}
        onOpenChange={setExtrasOpen}
        lang={lang}
        isFree={isFree}
        onToolClick={(toolId, title) => setActiveSheet({ id: toolId, title })}
      />
      {activeSheet && (
        <ToolSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setActiveSheet(null);
              if (requestedToolId) setSearchParams({}, { replace: true });
            }
          }}
          toolId={activeSheet.id}
          toolTitle={activeSheet.title}
        />
      )}
      {upgradeModal && (
        <UpgradeModal
          open={!!upgradeModal}
          onOpenChange={(open) => !open && setUpgradeModal(null)}
          featureName={upgradeModal.featureName}
          toolId={upgradeModal.toolId}
          currentPlan={userPlan}
          requiredPlan={upgradeModal.requiredPlan}
        />
      )}
    </div>
  );
}
