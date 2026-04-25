import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToolSheet } from '@/components/ToolSheet';
import { UpgradeModal } from '@/components/UpgradeModal';
import {
  Search, BookOpen, Globe, Quote, ScrollText, Languages as LanguagesIcon,
  Lightbulb, FileText, Lock, Crown, Building2
} from 'lucide-react';
import { isToolLockedForPlan, getMinPlanForTool, getUpgradeBadge, type PlanSlug } from '@/lib/plans';
import { normalizePlan } from '@/lib/plan-normalization';

type L = 'PT' | 'EN' | 'ES';

interface ToolOption {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  desc: Record<L, string>;
  to?: string;
  categoryId: string;
}

const CATEGORIES = [
  { id: 'bible', label: { PT: 'Bíblia e Exegese', EN: 'Bible and Exegesis', ES: 'Biblia y Exégesis' } },
  { id: 'history', label: { PT: 'História e Cultura', EN: 'History and Culture', ES: 'Historia y Cultura' } },
];

const researchTools: ToolOption[] = [
  // Bible
  { id: 'topic-explorer', categoryId: 'bible', icon: Lightbulb, label: { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, desc: { PT: 'Descubra temas em toda a Bíblia', EN: 'Discover themes across the Bible', ES: 'Descubre temas en toda la Biblia' } },
  { id: 'verse-finder', categoryId: 'bible', icon: Search, label: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, desc: { PT: 'Busque passagens por assunto', EN: 'Search passages by subject', ES: 'Busca pasajes por tema' } },
  { id: 'original-text', categoryId: 'bible', icon: FileText, label: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, desc: { PT: 'Consulte hebraico e grego', EN: 'Consult Hebrew and Greek', ES: 'Consulta hebreo y griego' } },
  { id: 'lexical', categoryId: 'bible', icon: LanguagesIcon, label: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, desc: { PT: 'Significados profundos de palavras', EN: 'Deep meanings of words', ES: 'Significados profundos de palabras' } },

  // History
  { id: 'historical-context', categoryId: 'history', icon: Globe, label: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, desc: { PT: 'Entenda a época e costumes', EN: 'Understand the era and customs', ES: 'Entiende la época y costumbres' } },
  { id: 'quote-finder', categoryId: 'history', icon: Quote, label: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, desc: { PT: 'Citações de teólogos e pais da igreja', EN: 'Quotes from theologians and church fathers', ES: 'Citas de teólogos y padres de la iglesia' } },
];

function LockBadge({ userPlan, toolId, lang }: { userPlan: PlanSlug; toolId: string; lang: L }) {
  const requiredPlan = getMinPlanForTool(toolId);
  const badgeType = getUpgradeBadge(userPlan, requiredPlan);
  const lockText = lang === 'PT' ? 'Bloqueado' : lang === 'EN' ? 'Locked' : 'Bloqueado';

  return (
    <span className="inline-flex items-center gap-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded shrink-0">
      {badgeType === 'church' ? <Building2 className="h-2 w-2" /> : badgeType === 'crown' ? <Crown className="h-2 w-2" /> : <Lock className="h-2 w-2" />}
      {lockText}
    </span>
  );
}

export default function PesquisarHub() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const userPlan: PlanSlug = normalizePlan(profile?.plan);
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ featureName: string; toolId: string; requiredPlan: PlanSlug } | null>(null);

  const handleClick = (tool: any) => {
    if (isToolLockedForPlan(tool.id, userPlan)) {
      setUpgradeModal({
        featureName: tool.label[lang],
        toolId: tool.id,
        requiredPlan: getMinPlanForTool(tool.id),
      });
      return;
    }
    if (tool.to) {
      navigate(tool.to);
      return;
    }
    setActiveTool({ id: tool.id, title: tool.label[lang] });
  };

  const pageTitle = lang === 'PT' ? 'Hub de Pesquisa' : lang === 'EN' ? 'Research Hub' : 'Hub de Investigación';
  const pageSubtitle = lang === 'PT'
    ? 'Todas as ferramentas para exegese, pesquisa lexical, contexto histórico e temas bíblicos.'
    : lang === 'EN'
    ? 'All tools for exegesis, lexical research, historical context and biblical themes.'
    : 'Todas las herramientas para exégesis, investigación léxica, contexto histórico y temas bíblicos.';

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-10">
      {/* ── Help hero header ── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight text-foreground">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {CATEGORIES.map(category => {
          const categoryTools = researchTools.filter(t => t.categoryId === category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  {category.label[lang as L]}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {categoryTools.map((tool) => {
                  const Icon = tool.icon;
                  const locked = isToolLockedForPlan(tool.id, userPlan);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleClick(tool)}
                      className={`group relative text-left rounded-lg border p-2.5 transition-all flex items-start gap-2.5 bg-background hover:border-primary/40 hover:bg-muted/40 border-border ${
                        locked ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors mt-0.5 bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <div className="text-xs font-semibold text-foreground leading-tight truncate">
                            {tool.label[lang as L]}
                          </div>
                          {locked && <LockBadge userPlan={userPlan} toolId={tool.id} lang={lang as L} />}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground leading-snug line-clamp-2">
                          {tool.desc[lang as L]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {activeTool && (
        <ToolSheet
          open={!!activeTool}
          onOpenChange={(open) => !open && setActiveTool(null)}
          toolId={activeTool.id}
          toolTitle={activeTool.title}
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
