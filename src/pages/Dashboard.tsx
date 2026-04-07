import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToolSheet } from '@/components/ToolSheet';
import { ExtrasModal } from '@/components/ExtrasModal';
import { extraOutreachTools, extraFunTools } from '@/components/ExtraToolsSections';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { UniversalSearch } from '@/components/dashboard/UniversalSearch';
import { StartHereBlock } from '@/components/dashboard/StartHereBlock';
import { QuickAccessBar } from '@/components/dashboard/QuickAccessBar';
import { CoreToolsGrid } from '@/components/dashboard/CoreToolsGrid';
import { MoreToolsAccordion } from '@/components/dashboard/MoreToolsAccordion';
import { AccountInfoBar } from '@/components/dashboard/AccountInfoBar';
import { RecentGenerations } from '@/components/dashboard/RecentGenerations';
import {
  Search, BookOpen, Globe, Quote, ScrollText, Languages,
  Wand2, PenLine, Type, Lightbulb, Sparkles, Film,
  GraduationCap, Gamepad2, Feather, Baby
} from 'lucide-react';
import type { ToolCardData } from '@/components/ToolCard';

/* Build allTools lookup for ?tool= deep linking */
const researchTools: ToolCardData[] = [
  { id: 'topic-explorer', icon: Search, title: { PT: 'Explorador de Tópicos', EN: 'Topic Explorer', ES: 'Explorador de Temas' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: '', EN: '', ES: '' }, hasModal: true },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: '', EN: '', ES: '' }, locked: true, hasModal: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: '', EN: '', ES: '' }, locked: true, hasModal: true },
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
  const isFree = profile?.plan === 'free';
  const [activeSheet, setActiveSheet] = useState<{ id: string; title: string } | null>(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const requestedToolId = searchParams.get('tool');

  // Deep-link support for ?tool= param
  useEffect(() => {
    if (!requestedToolId) return;
    const tool = allTools.find((t) => t.id === requestedToolId);
    if (!tool) return;
    if (tool.locked && isFree) {
      setSearchParams({}, { replace: true });
      return;
    }
    setActiveSheet((c) => c?.id === tool.id ? c : { id: tool.id, title: tool.title[lang] });
  }, [requestedToolId, isFree, lang, setSearchParams]);

  const handleToolClick = (toolId: string) => {
    const tool = allTools.find((t) => t.id === toolId);
    if (!tool) return;
    if (tool.locked && isFree) return;
    if (tool.hasModal) {
      setActiveSheet({ id: tool.id, title: tool.title[lang] });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 1. Greeting — first fold mobile */}
      <DashboardGreeting />

      {/* 2. Universal Search */}
      <UniversalSearch />

      {/* 3. Start Here — hero block */}
      <StartHereBlock onToolClick={handleToolClick} />

      {/* 4. Quick Access */}
      <QuickAccessBar onToolClick={handleToolClick} />

      {/* 5. Core Tools Grid */}
      <CoreToolsGrid onToolClick={handleToolClick} />

      {/* 6. More Tools (collapsed) */}
      <MoreToolsAccordion onToolClick={handleToolClick} />

      {/* 7. Account Info — below the fold */}
      <AccountInfoBar />

      {/* 8. Recent Generations */}
      <RecentGenerations />

      {/* Modals */}
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
    </div>
  );
}
