import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToolSheet } from '@/components/ToolSheet';
import { UpgradeModal } from '@/components/UpgradeModal';
import { Card } from '@/components/ui/card';
import {
  Mic, GraduationCap, PenTool, Palette, Type, Lightbulb, Film, Sparkles,
  Video, MessageSquare, Mail, Megaphone, HelpCircle, Feather, Globe,
  Search, BookOpen, Quote, FileText, Languages as LanguagesIcon,
  Library, CalendarDays, FolderOpen, Brain, Lock, Crown, Building2,
  type LucideIcon,
} from 'lucide-react';
import {
  isToolLockedForPlan, getMinPlanForTool, getUpgradeBadge, type PlanSlug,
} from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

interface ToolItem {
  id: string;
  icon: LucideIcon;
  label: Record<L, string>;
  description?: Record<L, string>;
  /** If set, navigates instead of opening modal */
  to?: string;
}

interface ToolCategory {
  key: string;
  title: Record<L, string>;
  subtitle: Record<L, string>;
  tools: ToolItem[];
}

const categories: ToolCategory[] = [
  {
    key: 'creation',
    title: { PT: 'Criação', EN: 'Creation', ES: 'Creación' },
    subtitle: {
      PT: 'Produza conteúdo pastoral e ministerial',
      EN: 'Produce pastoral and ministry content',
      ES: 'Produce contenido pastoral y ministerial',
    },
    tools: [
      { id: 'sermon-generator', icon: Mic, label: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' }, to: '/sermoes' },
      { id: 'biblical-study', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, to: '/estudos/novo' },
      { id: 'social-studio', icon: Palette, label: { PT: 'Post Social', EN: 'Social Post', ES: 'Post Social' }, to: '/social-studio' },
      { id: 'free-article', icon: PenTool, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, to: '/blog' },
      { id: 'title-gen', icon: Type, label: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' } },
      { id: 'metaphor-creator', icon: Lightbulb, label: { PT: 'Metáforas', EN: 'Metaphors', ES: 'Metáforas' } },
      { id: 'illustrations', icon: Film, label: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' } },
      { id: 'bible-modernizer', icon: Sparkles, label: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' } },
      { id: 'free-article-universal', icon: PenTool, label: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' } },
    ],
  },
  {
    key: 'study',
    title: { PT: 'Estudo & Pesquisa', EN: 'Study & Research', ES: 'Estudio e Investigación' },
    subtitle: {
      PT: 'Aprofunde-se nas Escrituras com rigor',
      EN: 'Dive deeper into Scripture with rigor',
      ES: 'Profundiza en las Escrituras con rigor',
    },
    tools: [
      { id: 'bible-reader', icon: BookOpen, label: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' }, to: '/bible' },
      { id: 'topic-explorer', icon: Lightbulb, label: { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' } },
      { id: 'verse-finder', icon: Search, label: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' } },
      { id: 'historical-context', icon: Globe, label: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' } },
      { id: 'quote-finder', icon: Quote, label: { PT: 'Citações', EN: 'Quotes', ES: 'Citas' } },
      { id: 'original-text', icon: FileText, label: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' } },
      { id: 'lexical', icon: LanguagesIcon, label: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' } },
    ],
  },
  {
    key: 'support',
    title: { PT: 'Apoio Pastoral', EN: 'Pastoral Support', ES: 'Apoyo Pastoral' },
    subtitle: {
      PT: 'Ferramentas para o ministério e a comunicação',
      EN: 'Tools for ministry and communication',
      ES: 'Herramientas para el ministerio y la comunicación',
    },
    tools: [
      { id: 'newsletter', icon: Mail, label: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' } },
      { id: 'announcements', icon: Megaphone, label: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' } },
      { id: 'social-caption', icon: MessageSquare, label: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' } },
      { id: 'reels-script', icon: Video, label: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' } },
      { id: 'youtube-blog', icon: Video, label: { PT: 'YouTube → Blog', EN: 'YouTube → Blog', ES: 'YouTube → Blog' } },
      { id: 'biblioteca', icon: Library, label: { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' }, to: '/biblioteca' },
      { id: 'workspaces', icon: FolderOpen, label: { PT: 'Workspaces', EN: 'Workspaces', ES: 'Workspaces' }, to: '/workspaces' },
      { id: 'calendario', icon: CalendarDays, label: { PT: 'Calendário', EN: 'Calendar', ES: 'Calendario' }, to: '/calendario' },
    ],
  },
  {
    key: 'intelligent',
    title: { PT: 'Inteligentes', EN: 'Intelligent', ES: 'Inteligentes' },
    subtitle: {
      PT: 'IA pastoral, traduções e recursos especiais',
      EN: 'Pastoral AI, translations and special resources',
      ES: 'IA pastoral, traducciones y recursos especiales',
    },
    tools: [
      { id: 'mentes', icon: Brain, label: { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' }, to: '/dashboard/mentes' },
      { id: 'deep-translation', icon: Globe, label: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' } },
      { id: 'trivia', icon: HelpCircle, label: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' } },
      { id: 'poetry', icon: Feather, label: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' } },
    ],
  },
];

function LockBadge({ userPlan, toolId }: { userPlan: PlanSlug; toolId: string }) {
  const requiredPlan = getMinPlanForTool(toolId);
  const badgeType = getUpgradeBadge(userPlan, requiredPlan);
  if (badgeType === 'church') return <Building2 className="h-3.5 w-3.5 text-blue-500/70" />;
  if (badgeType === 'crown') return <Crown className="h-3.5 w-3.5 text-primary/70" />;
  return <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />;
}

export default function Ferramentas() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const userPlan: PlanSlug = (profile?.plan as PlanSlug) || 'free';
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ featureName: string; toolId: string; requiredPlan: PlanSlug } | null>(null);

  const handleClick = (tool: ToolItem) => {
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

  const pageTitle =
    lang === 'PT' ? 'Ferramentas' : lang === 'EN' ? 'Tools' : 'Herramientas';
  const pageSubtitle =
    lang === 'PT'
      ? 'Tudo que você precisa para criar, estudar e ministrar.'
      : lang === 'EN'
      ? 'Everything you need to create, study and minister.'
      : 'Todo lo que necesitas para crear, estudiar y ministrar.';

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          {pageTitle}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
          {pageSubtitle}
        </p>
      </header>

      {/* Categories */}
      <div className="space-y-10">
        {categories.map((cat) => (
          <section key={cat.key}>
            <div className="mb-4 px-1">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                {cat.title[lang]}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                {cat.subtitle[lang]}
              </p>
            </div>

            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
              <div className="flex gap-4 sm:gap-5 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-start py-1">
                {cat.tools.map((tool) => {
                  const Icon = tool.icon;
                  const locked = isToolLockedForPlan(tool.id, userPlan);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleClick(tool)}
                      className="flex flex-col items-center gap-2 group w-[72px] sm:w-[80px] shrink-0"
                    >
                      <div
                        className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-card border-2 flex items-center justify-center transition-all ${
                          locked
                            ? 'border-border/60 opacity-70'
                            : 'border-border group-hover:border-primary/50 group-hover:shadow-md group-hover:shadow-primary/10 group-active:scale-95'
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 transition-colors ${
                            locked
                              ? 'text-muted-foreground'
                              : 'text-primary/80 group-hover:text-primary'
                          }`}
                        />
                        {locked && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
                            <LockBadge userPlan={userPlan} toolId={tool.id} />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">
                        {tool.label[lang]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
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
