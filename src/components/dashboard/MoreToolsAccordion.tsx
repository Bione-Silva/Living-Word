import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, Crown } from 'lucide-react';
import { extraOutreachTools, extraFunTools } from '@/components/ExtraToolsSections';
import type { ToolCardData } from '@/components/ToolCard';
import {
  Type, Lightbulb, Sparkles, BookOpen, Globe, Quote,
  ScrollText, Languages, Film, Library, CalendarDays, FolderOpen, Brain
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

// Items with `to` are direct navigation; without `to` use the tool modal flow.
type ExtendedTool = ToolCardData & { to?: string };

// Sidebar items that should appear here for quick access (Biblioteca, Calendário, Workspaces, Mentes).
const sidebarShortcuts: ExtendedTool[] = [
  { id: 'biblioteca', icon: Library, title: { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' }, description: { PT: 'Seus materiais salvos', EN: 'Your saved materials', ES: 'Tus materiales guardados' }, hasModal: false, to: '/biblioteca' },
  { id: 'calendario', icon: CalendarDays, title: { PT: 'Calendário', EN: 'Calendar', ES: 'Calendario' }, description: { PT: 'Agenda pastoral', EN: 'Pastoral agenda', ES: 'Agenda pastoral' }, hasModal: false, to: '/calendario' },
  { id: 'workspaces', icon: FolderOpen, title: { PT: 'Workspaces', EN: 'Workspaces', ES: 'Workspaces' }, description: { PT: 'Espaços por projeto', EN: 'Project spaces', ES: 'Espacios por proyecto' }, hasModal: false, to: '/workspaces' },
  { id: 'mentes', icon: Brain, title: { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' }, description: { PT: 'IA pastoral histórica', EN: 'Historical pastoral AI', ES: 'IA pastoral histórica' }, hasModal: false, to: '/dashboard/mentes' },
];

// Additional content tools not in the "Start Here" or "Core" blocks
const additionalTools: ExtendedTool[] = [
  { id: 'title-gen', icon: Type, title: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' }, description: { PT: 'Ideias criativas de títulos para sermões', EN: 'Creative title ideas for sermons', ES: 'Ideas creativas de títulos' }, hasModal: true },
  { id: 'metaphor-creator', icon: Lightbulb, title: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, description: { PT: 'Metáforas poderosas para sua mensagem', EN: 'Powerful metaphors for your message', ES: 'Metáforas poderosas para tu mensaje' }, hasModal: true },
  { id: 'bible-modernizer', icon: Sparkles, title: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' }, description: { PT: 'Recontextualize histórias bíblicas', EN: 'Recontextualize Bible stories', ES: 'Recontextualiza historias bíblicas' }, hasModal: true },
  { id: 'historical-context', icon: Globe, title: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' }, description: { PT: 'Contexto cultural e histórico', EN: 'Cultural and historical context', ES: 'Contexto cultural e histórico' }, hasModal: true },
  { id: 'quote-finder', icon: Quote, title: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' }, description: { PT: 'Citações de teólogos e pensadores', EN: 'Quotes from theologians', ES: 'Citas de teólogos y pensadores' }, hasModal: true },
  { id: 'verse-finder', icon: BookOpen, title: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' }, description: { PT: 'Busque versículos por tema', EN: 'Search verses by topic', ES: 'Busca versículos por tema' }, hasModal: true },
  { id: 'original-text', icon: ScrollText, title: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, description: { PT: 'Grego e Hebraico simplificado', EN: 'Simplified Greek and Hebrew', ES: 'Griego y Hebreo simplificado' }, locked: true, hasModal: true },
  { id: 'lexical', icon: Languages, title: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' }, description: { PT: 'Análise de palavras originais', EN: 'Original word analysis', ES: 'Análisis de palabras originales' }, locked: true, hasModal: true },
  { id: 'illustrations', icon: Film, title: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' }, description: { PT: 'Histórias e ilustrações contemporâneas', EN: 'Contemporary illustrations', ES: 'Ilustraciones contemporáneas' }, locked: true, hasModal: true },
  { id: 'free-article-universal', icon: Type, title: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' }, description: { PT: 'Artigos e textos de qualquer tema', EN: 'Articles on any topic', ES: 'Artículos de cualquier tema' }, hasModal: true },
];

const allExtras = [...extraOutreachTools, ...extraFunTools] as ExtendedTool[];

interface MoreToolsAccordionProps {
  onToolClick: (toolId: string) => void;
}

export function MoreToolsAccordion({ onToolClick }: MoreToolsAccordionProps) {
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isFree = profile?.plan === 'free';
  const [open, setOpen] = useState(false);

  const label = {
    PT: '📦 Ver mais ferramentas',
    EN: '📦 See more tools',
    ES: '📦 Ver más herramientas',
  };

  // Order: sidebar shortcuts first (Biblioteca, Calendário, Workspaces, Mentes), then content tools, then extras.
  const combined: ExtendedTool[] = [...sidebarShortcuts, ...additionalTools, ...allExtras];

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all text-sm font-semibold text-foreground"
      >
        <span>{label[lang]}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 mt-3">
          {combined.map((tool) => {
            const Icon = tool.icon;
            const isLocked = tool.locked && isFree;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (isLocked) return;
                  if (tool.to) {
                    navigate(tool.to);
                    return;
                  }
                  onToolClick(tool.id);
                }}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                  isLocked
                    ? 'border-border/40 opacity-40 cursor-not-allowed'
                    : 'border-border/60 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm active:scale-[0.97]'
                }`}
              >
                {isLocked && <Crown className="absolute top-1.5 right-1.5 h-3 w-3 text-primary/50" />}
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${isLocked ? 'bg-muted/50' : 'bg-primary/10'}`}>
                  <Icon className={`h-3.5 w-3.5 ${isLocked ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <span className="text-[10px] leading-tight font-semibold line-clamp-2 text-foreground">
                  {tool.title[lang]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
