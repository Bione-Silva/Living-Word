import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HelpArticleModal } from '@/components/HelpArticleModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { GenerationCounter } from '@/components/GenerationCounter';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  LayoutDashboard, Wand2, BookOpen, Library, CalendarDays,
  Settings, LogOut, Crown, ChevronDown, Search, PenTool, Send, Brain,
  Lightbulb, Quote, Film, FileText, Languages as LanguagesIcon,
  Sparkles, Repeat, Palette, Video, Users, MessageSquare, Mail, Megaphone,
  HelpCircle, Feather, Baby, Globe, Gamepad2, ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { ToolSheet } from '@/components/ToolSheet';
import { SupportChatBubble } from '@/components/SupportChatBubble';
import { ThemeInjector } from '@/components/ThemeInjector';

type L = 'PT' | 'EN' | 'ES';

interface SidebarToolItem {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  locked?: boolean;
}

interface SidebarToolGroup {
  label: Record<L, string>;
  icon: React.ElementType;
  tools: SidebarToolItem[];
}

const toolGroups: SidebarToolGroup[] = [
  {
    label: { PT: 'Pesquisa', EN: 'Research', ES: 'Investigación' },
    icon: Search,
    tools: [
      { id: 'topic-explorer', icon: Lightbulb, label: { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' } },
      { id: 'verse-finder', icon: Search, label: { PT: 'Versículos', EN: 'Verse Finder', ES: 'Versículos' } },
      { id: 'historical-context', icon: BookOpen, label: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' } },
      { id: 'quote-finder', icon: Quote, label: { PT: 'Citações', EN: 'Quotes', ES: 'Citas' } },
      { id: 'movie-scenes', icon: Film, label: { PT: 'Cenas de Filmes', EN: 'Movie Scenes', ES: 'Escenas' } },
      { id: 'original-text', icon: FileText, label: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, locked: true },
      { id: 'lexical', icon: LanguagesIcon, label: { PT: 'Análise Lexical', EN: 'Lexical Analysis', ES: 'Análisis Léxico' }, locked: true },
    ],
  },
  {
    label: { PT: 'Criar', EN: 'Create', ES: 'Crear' },
    icon: PenTool,
    tools: [
      { id: 'studio', icon: Wand2, label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' } },
      { id: 'title-gen', icon: Sparkles, label: { PT: 'Títulos', EN: 'Titles', ES: 'Títulos' } },
      { id: 'metaphor-creator', icon: Palette, label: { PT: 'Metáforas', EN: 'Metaphors', ES: 'Metáforas' } },
      { id: 'bible-modernizer', icon: Repeat, label: { PT: 'Modernizador', EN: 'Modernizer', ES: 'Modernizador' } },
      { id: 'illustrations', icon: PenTool, label: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' } },
      { id: 'free-article', icon: Wand2, label: { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo' } },
      { id: 'youtube-blog', icon: Video, label: { PT: 'YouTube → Blog', EN: 'YouTube → Blog', ES: 'YouTube → Blog' }, locked: true },
    ],
  },
  {
    label: { PT: 'Alcance', EN: 'Outreach', ES: 'Alcance' },
    icon: Send,
    tools: [
      { id: 'reels-script', icon: Video, label: { PT: 'Roteiro Reels', EN: 'Reels Script', ES: 'Guión Reels' } },
      { id: 'cell-group', icon: Users, label: { PT: 'Célula', EN: 'Cell Group', ES: 'Célula' } },
      { id: 'social-caption', icon: MessageSquare, label: { PT: 'Legendas', EN: 'Captions', ES: 'Leyendas' } },
      { id: 'newsletter', icon: Mail, label: { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' } },
      { id: 'announcements', icon: Megaphone, label: { PT: 'Avisos', EN: 'Announcements', ES: 'Avisos' } },
    ],
  },
  {
    label: { PT: 'Divertidas', EN: 'Fun', ES: 'Divertidas' },
    icon: Gamepad2,
    tools: [
      { id: 'trivia', icon: HelpCircle, label: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' } },
      { id: 'poetry', icon: Feather, label: { PT: 'Poesia', EN: 'Poetry', ES: 'Poesía' } },
      { id: 'kids-story', icon: Baby, label: { PT: 'Infantil', EN: 'Kids Story', ES: 'Infantil' } },
      { id: 'deep-translation', icon: Globe, label: { PT: 'Tradução', EN: 'Translation', ES: 'Traducción' }, locked: true },
    ],
  },
];

const mobileNavItems = [
  { key: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.studio', path: '/estudio', icon: Wand2 },
  { key: 'nav.minds', path: '/dashboard/mentes', icon: Brain },
  { key: 'nav.blog', path: '/blog', icon: BookOpen },
  { key: 'nav.settings', path: '/configuracoes', icon: Settings },
];

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Pesquisa: true, Criar: true, Alcance: false, Divertidas: false,
  });
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [helpToolId, setHelpToolId] = useState<string | null>(null);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Record<string, boolean>>({
    Pesquisa: true, Criar: true, Alcance: true, Divertidas: true,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMobileGroup = (key: string) => {
    setMobileOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isFree = profile?.plan === 'free';
  const isAdmin = user?.email === 'bionicaosilva@gmail.com';

  const handleToolClick = (tool: SidebarToolItem) => {
    if (tool.locked && isFree) {
      navigate('/upgrade');
      return;
    }
    setMobileToolsOpen(false);
    setActiveTool({ id: tool.id, title: tool.label[lang] });
  };

  if (isMobile) {
    return (
      <div className="theme-app min-h-screen bg-background flex flex-col">
        <ThemeInjector />
        <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <Link to="/dashboard" className="font-display text-lg font-bold text-foreground truncate">Living Word</Link>
          <div className="flex items-center gap-2 shrink-0">
            <GenerationCounter compact />
            <LanguageToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-4 pb-20">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-2 py-1 safe-area-bottom">
          <div className="flex justify-around items-center">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="truncate">{t('nav.dashboard')}</span>
            </Link>

            {/* Tools bottom sheet trigger */}
            <button
              onClick={() => setMobileToolsOpen(true)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                mobileToolsOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Wand2 className="h-5 w-5" />
              <span className="truncate">{t('nav.studio')}</span>
            </button>

            <Link
              to="/dashboard/mentes"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                location.pathname.startsWith('/dashboard/mentes') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Brain className="h-5 w-5" />
              <span className="truncate">{lang === 'PT' ? 'Mentes' : lang === 'EN' ? 'Minds' : 'Mentes'}</span>
            </Link>

            <Link
              to="/blog"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                location.pathname === '/blog' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="truncate">{t('nav.blog')}</span>
            </Link>

            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                  location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
                <span className="truncate">Admin</span>
              </Link>
            ) : (
              <Link
                to="/configuracoes"
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                  location.pathname === '/configuracoes' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="truncate">{t('nav.settings')}</span>
              </Link>
            )}
          </div>
        </nav>

        <Sheet open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-display text-lg">
                {lang === 'PT' ? '⚡ Ferramentas' : lang === 'EN' ? '⚡ Tools' : '⚡ Herramientas'}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {lang === 'PT' ? 'Selecione uma ferramenta' : lang === 'EN' ? 'Select a tool' : 'Selecciona una herramienta'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 mt-2">
              {toolGroups.map((group) => {
                const groupKey = group.label.PT;
                const isOpen = mobileOpenGroups[groupKey] ?? true;
                const GroupIcon = group.icon;

                return (
                  <div key={groupKey}>
                    <button
                      onClick={() => toggleMobileGroup(groupKey)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-semibold text-foreground"
                    >
                      <GroupIcon className="h-4 w-4 text-primary" />
                      <span className="flex-1 text-left">{group.label[lang]}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                    </button>

                    {isOpen && (
                      <div className="grid grid-cols-3 gap-2 px-1 pb-2">
                        {group.tools.map((tool) => {
                          const Icon = tool.icon;
                          const isLocked = tool.locked && isFree;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleToolClick(tool)}
                              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors text-center ${
                                isLocked
                                  ? 'border-border/40 opacity-50'
                                  : 'border-border/60 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10'
                              }`}
                            >
                              {isLocked && (
                                <Crown className="absolute top-1.5 right-1.5 h-3 w-3 text-primary/50" />
                              )}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                isLocked ? 'bg-muted/50' : 'bg-primary/10'
                              }`}>
                                <Icon className={`h-4 w-4 ${isLocked ? 'text-muted-foreground' : 'text-primary'}`} />
                              </div>
                              <span className="text-[11px] leading-tight font-medium line-clamp-2">
                                {tool.label[lang]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {activeTool && (
          <ToolSheet
            open={!!activeTool}
            onOpenChange={(open) => !open && setActiveTool(null)}
            toolId={activeTool.id}
            toolTitle={activeTool.title}
          />
        )}
        <SupportChatBubble />
      </div>
    );
  }

  return (
    <div className="theme-app min-h-screen bg-background flex">
      <ThemeInjector />
      {/* Desktop Sidebar */}
      <aside className="w-[260px] min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="p-4 pb-2 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <Wand2 className="h-4 w-4 text-sidebar-primary" />
            </div>
            <span className="font-display text-xl font-bold text-sidebar-primary">Living Word</span>
          </Link>
        </div>

        {/* Tools label */}
        <div className="px-5 pt-2 pb-1 shrink-0">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">
            {t('nav.tools') || 'FERRAMENTAS'}
          </span>
        </div>

        {/* Grouped Navigation — scrollable */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto min-h-0">
          {/* Dashboard link */}
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            {t('nav.dashboard')}
          </Link>

          {/* Tool groups */}
          {toolGroups.map((group) => {
            const groupKey = group.label.PT;
            const isOpen = openGroups[groupKey] ?? false;
            const GroupIcon = group.icon;

            return (
              <div key={groupKey}>
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                >
                  <GroupIcon className="h-4 w-4" />
                  <span className="flex-1 text-left">{group.label[lang]}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </button>

                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                    {group.tools.map((tool) => {
                      const Icon = tool.icon;
                      const isLocked = tool.locked && isFree;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors text-left ${
                            isLocked
                              ? 'text-sidebar-foreground/40 hover:bg-sidebar-accent/30'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="truncate">{tool.label[lang]}</span>
                          {isLocked && (
                            <Crown className="h-3 w-3 ml-auto text-sidebar-primary/50 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Publicar group — pages */}
          <div>
            <button
              onClick={() => toggleGroup('Publicar')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="flex-1 text-left">{lang === 'EN' ? 'Publish' : lang === 'ES' ? 'Publicar' : 'Publicar'}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openGroups['Publicar'] ? '' : '-rotate-90'}`} />
            </button>
            {openGroups['Publicar'] && (
              <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                <Link
                  to="/biblioteca"
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    location.pathname === '/biblioteca'
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                  }`}
                >
                  <Library className="h-3.5 w-3.5" />
                  {t('nav.library')}
                </Link>
                <Link
                  to="/blog"
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    location.pathname === '/blog'
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {t('nav.blog')}
                </Link>
                <Link
                  to="/calendario"
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    location.pathname === '/calendario'
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('nav.calendar')}
                </Link>
              </div>
            )}
          </div>

          {/* Mentes Brilhantes — Premium */}
          <Link
            to="/dashboard/mentes"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/dashboard/mentes')
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Brain className="h-4 w-4" />
            {lang === 'EN' ? '🧠 Brilliant Minds' : lang === 'ES' ? '🧠 Mentes Brillantes' : '🧠 Mentes Brilhantes'}
            <Badge variant="outline" className="ml-auto text-[9px] border-sidebar-primary/40 text-sidebar-primary px-1.5 py-0">
              Premium
            </Badge>
          </Link>

          {/* Admin - Master only */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/admin/dashboard'
                  ? 'bg-destructive/10 text-destructive'
                  : 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Back-office (Master)
            </Link>
          )}

          {/* Help Center */}
          <Link
            to="/ajuda"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/ajuda')
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            {lang === 'PT' ? 'Central de Ajuda' : lang === 'EN' ? 'Help Center' : 'Centro de Ayuda'}
          </Link>

          {/* Settings */}
          <Link
            to="/configuracoes"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/configuracoes'
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            {t('nav.settings')}
          </Link>
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-sidebar-border">
          <div className="px-3 py-2">
            <GenerationCounter />
          </div>

          {profile?.plan === 'free' && (
            <div className="px-3 pb-2">
              <Link to="/upgrade">
                <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 gap-2" size="sm">
                  <Crown className="h-4 w-4" />
                  {t('nav.upgrade')}
                </Button>
              </Link>
            </div>
          )}

          <div className="px-3 py-2 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary shrink-0">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuário'}</p>
                <p className="text-[11px] text-sidebar-foreground/50 capitalize">{profile?.plan || 'free'}</p>
              </div>
              <button onClick={handleSignOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[260px]">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-end">
          <LanguageToggle />
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {activeTool && (
        <ToolSheet
          open={!!activeTool}
          onOpenChange={(open) => !open && setActiveTool(null)}
          toolId={activeTool.id}
          toolTitle={activeTool.title}
        />
      )}
      {helpToolId && (
        <HelpArticleModal
          open={!!helpToolId}
          onOpenChange={(open) => !open && setHelpToolId(null)}
          toolId={helpToolId}
        />
      )}
      <SupportChatBubble />
    </div>
  );
}
