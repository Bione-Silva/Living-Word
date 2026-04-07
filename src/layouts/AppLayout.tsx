import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HelpArticleModal } from '@/components/HelpArticleModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { GenerationCounter } from '@/components/GenerationCounter';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  HelpCircle, Feather, Baby, Globe, Gamepad2, ShieldAlert,
  ExternalLink, User, Package, GraduationCap, FolderOpen, ImageIcon,
  PanelLeftClose, PanelLeftOpen
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
      { id: 'original-text', icon: FileText, label: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' }, locked: true },
      { id: 'lexical', icon: LanguagesIcon, label: { PT: 'Análise Lexical', EN: 'Lexical Analysis', ES: 'Análisis Léxico' }, locked: true },
    ],
  },
  {
    label: { PT: 'Criar', EN: 'Create', ES: 'Crear' },
    icon: PenTool,
    tools: [
      { id: 'studio', icon: Wand2, label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' } },
      { id: 'biblical-study', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' } },
      { id: 'free-article', icon: PenTool, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' } },
      { id: 'title-gen', icon: Sparkles, label: { PT: 'Títulos', EN: 'Titles', ES: 'Títulos' } },
      { id: 'metaphor-creator', icon: Palette, label: { PT: 'Metáforas', EN: 'Metaphors', ES: 'Metáforas' } },
      { id: 'illustrations', icon: Film, label: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' }, locked: true },
      { id: 'bible-modernizer', icon: Repeat, label: { PT: 'Modernizador', EN: 'Modernizer', ES: 'Modernizador' } },
      { id: 'youtube-blog', icon: Video, label: { PT: 'YouTube → Blog', EN: 'YouTube → Blog', ES: 'YouTube → Blog' }, locked: true },
    ],
  },
  {
    label: { PT: 'Extras', EN: 'Extras', ES: 'Extras' },
    icon: Package,
    tools: [
      { id: 'reels-script', icon: Video, label: { PT: 'Roteiro Reels', EN: 'Reels Script', ES: 'Guión Reels' } },
      { id: 'cell-group', icon: Users, label: { PT: 'Célula', EN: 'Cell Group', ES: 'Célula' } },
      { id: 'social-caption', icon: MessageSquare, label: { PT: 'Legendas', EN: 'Captions', ES: 'Leyendas' } },
      { id: 'newsletter', icon: Mail, label: { PT: 'Newsletter', EN: 'Newsletter', ES: 'Newsletter' } },
      { id: 'announcements', icon: Megaphone, label: { PT: 'Avisos', EN: 'Announcements', ES: 'Avisos' } },
      { id: 'trivia', icon: Gamepad2, label: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' } },
      { id: 'poetry', icon: Feather, label: { PT: 'Poesia', EN: 'Poetry', ES: 'Poesía' } },
      { id: 'kids-story', icon: Baby, label: { PT: 'Infantil', EN: 'Kids Story', ES: 'Infantil' } },
      { id: 'deep-translation', icon: Globe, label: { PT: 'Tradução', EN: 'Translation', ES: 'Traducción' }, locked: true },
    ],
  },
];

function SidebarTooltipWrap({ collapsed, label, children }: { collapsed: boolean; label: string; children: React.ReactNode }) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs font-medium">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // ALL groups closed by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [helpToolId, setHelpToolId] = useState<string | null>(null);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('lw-sidebar-collapsed') === 'true'; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('lw-sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };

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
    // Special navigation for biblical-study
    if (tool.id === 'biblical-study') {
      navigate('/estudos/novo');
      setMobileToolsOpen(false);
      return;
    }
    setMobileToolsOpen(false);
    setActiveTool({ id: tool.id, title: tool.label[lang] });
  };

  // Generation usage
  const used = profile?.generations_used || 0;
  const limit = profile?.generations_limit || 5;
  const pct = Math.min(Math.round((used / limit) * 100), 100);

  if (isMobile) {
    return (
      <div className="theme-app min-h-screen bg-background flex flex-col">
        <ThemeInjector />
        <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <Link to="/dashboard" className="font-display text-lg font-bold text-foreground truncate">Living Word</Link>
          <div className="flex items-center gap-2 shrink-0">
            <SupportChatBubble />
            {profile?.blog_handle && (
              <Link to={`/blog/${profile.blog_handle}`} target="_blank" className="text-primary">
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
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
                const isOpen = mobileOpenGroups[groupKey] ?? false;
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

              {/* Quick navigation links for mobile */}
              <div className="pt-3 border-t border-border mt-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-2 mb-2">
                  {lang === 'PT' ? 'NAVEGAÇÃO' : lang === 'EN' ? 'NAVIGATION' : 'NAVEGACIÓN'}
                </p>
                <div className="grid grid-cols-3 gap-2 px-1">
                  {[
                    { to: '/biblioteca', icon: Library, label: { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' } },
                    { to: '/workspaces', icon: FolderOpen, label: { PT: 'Workspaces', EN: 'Workspaces', ES: 'Workspaces' } },
                    { to: '/social-studio', icon: ImageIcon, label: { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' } },
                    { to: '/ajuda', icon: HelpCircle, label: { PT: 'Central de Ajuda', EN: 'Help Center', ES: 'Centro de Ayuda' } },
                    { to: '/upgrade', icon: Crown, label: { PT: 'Plano e Uso', EN: 'Plan & Usage', ES: 'Plan y Uso' } },
                    { to: '/configuracoes', icon: Settings, label: { PT: 'Configurações', EN: 'Settings', ES: 'Configuración' } },
                  ].map((nav) => {
                    const NavIcon = nav.icon;
                    return (
                      <Link
                        key={nav.to}
                        to={nav.to}
                        onClick={() => setMobileToolsOpen(false)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors text-center ${
                          location.pathname === nav.to
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border/60 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                          <NavIcon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-[11px] leading-tight font-medium line-clamp-2">
                          {nav.label[lang]}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
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

  const sidebarW = collapsed ? 'w-[68px]' : 'w-[260px]';
  const mainMl = collapsed ? 'ml-[68px]' : 'ml-[260px]';

  return (
    <div className="theme-app min-h-screen bg-background flex">
      <ThemeInjector />
      {/* Desktop Sidebar */}
      <aside className={`${sidebarW} min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-sidebar text-sidebar-foreground transition-all duration-200`}>
        {/* Logo */}
        <div className={`p-4 pb-2 shrink-0 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <Wand2 className="h-4 w-4 text-sidebar-primary" />
            </div>
            {!collapsed && <span className="font-display text-xl font-bold text-sidebar-primary">Living Word</span>}
          </Link>
          {!collapsed && (
            <button onClick={toggleCollapsed} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" title="Recolher sidebar">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center py-1 shrink-0">
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button onClick={toggleCollapsed} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors p-1.5 rounded-lg hover:bg-sidebar-accent/50">
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">
                {lang === 'PT' ? 'Expandir sidebar' : lang === 'EN' ? 'Expand sidebar' : 'Expandir sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {!collapsed && (
          <div className="px-5 pt-2 pb-1 shrink-0">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">
              {t('nav.tools') || 'FERRAMENTAS'}
            </span>
          </div>
        )}

        <nav className={`flex-1 ${collapsed ? 'px-1.5' : 'px-3'} space-y-0.5 overflow-y-auto min-h-0`}>
          <SidebarTooltipWrap collapsed={collapsed} label={t('nav.dashboard') || 'Dashboard'}>
            <Link
              to="/dashboard"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && t('nav.dashboard')}
            </Link>
          </SidebarTooltipWrap>

          {toolGroups.map((group) => {
            const groupKey = group.label.PT;
            const isOpen = openGroups[groupKey] ?? false;
            const GroupIcon = group.icon;

            return (
              <div key={groupKey}>
                <SidebarTooltipWrap collapsed={collapsed} label={group.label[lang]}>
                  <button
                    onClick={() => !collapsed && toggleGroup(groupKey)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors`}
                  >
                    <GroupIcon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{group.label[lang]}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      </>
                    )}
                  </button>
                </SidebarTooltipWrap>

                {isOpen && !collapsed && (
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

          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'EN' ? 'Brilliant Minds' : lang === 'ES' ? 'Mentes Brillantes' : 'Mentes Brilhantes'}>
            <Link
              to="/dashboard/mentes"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith('/dashboard/mentes')
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Brain className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  {lang === 'EN' ? '🧠 Brilliant Minds' : lang === 'ES' ? '🧠 Mentes Brillantes' : '🧠 Mentes Brilhantes'}
                  <Badge variant="outline" className="ml-auto text-[9px] border-sidebar-primary/40 text-sidebar-primary px-1.5 py-0">
                    Premium
                  </Badge>
                </>
              )}
            </Link>
          </SidebarTooltipWrap>

          <SidebarTooltipWrap collapsed={collapsed} label={t('nav.library') || 'Biblioteca'}>
            <Link
              to="/biblioteca"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/biblioteca'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Library className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && t('nav.library')}
            </Link>
          </SidebarTooltipWrap>

          <SidebarTooltipWrap collapsed={collapsed} label="Workspaces">
            <Link
              to="/workspaces"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/workspaces'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && 'Workspaces'}
            </Link>
          </SidebarTooltipWrap>

          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'PT' ? 'Estúdio Social' : lang === 'EN' ? 'Social Studio' : 'Estudio Social'}>
            <Link
              to="/social-studio"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/social-studio'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (lang === 'PT' ? 'Estúdio Social' : lang === 'EN' ? 'Social Studio' : 'Estudio Social')}
            </Link>
          </SidebarTooltipWrap>

          <div className="flex-1" />

          {!collapsed ? (
            <div className="pt-3 pb-1 border-t border-sidebar-border mt-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50 px-3">
                {lang === 'PT' ? 'CONTA' : lang === 'EN' ? 'ACCOUNT' : 'CUENTA'}
              </span>
            </div>
          ) : (
            <div className="pt-3 mt-2 border-t border-sidebar-border" />
          )}

          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'PT' ? 'Meu Perfil' : lang === 'EN' ? 'My Profile' : 'Mi Perfil'}>
            <Link
              to="/configuracoes"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/configuracoes'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              {!collapsed && (lang === 'PT' ? 'Meu Perfil' : lang === 'EN' ? 'My Profile' : 'Mi Perfil')}
            </Link>
          </SidebarTooltipWrap>

          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'PT' ? 'Plano e Uso' : lang === 'EN' ? 'Plan & Usage' : 'Plan y Uso'}>
            <Link
              to="/upgrade"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/upgrade'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Crown className="h-4 w-4 shrink-0" />
              {!collapsed && (lang === 'PT' ? 'Plano e Uso' : lang === 'EN' ? 'Plan & Usage' : 'Plan y Uso')}
            </Link>
          </SidebarTooltipWrap>

          {profile?.blog_handle && (
            <SidebarTooltipWrap collapsed={collapsed} label="Portal">
              <Link
                to={`/blog/${profile.blog_handle}`}
                target="_blank"
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors`}
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                {!collapsed && 'Portal'}
              </Link>
            </SidebarTooltipWrap>
          )}

          <SidebarTooltipWrap collapsed={collapsed} label={t('nav.blog') || 'Blog'}>
            <Link
              to="/blog"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/blog'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && t('nav.blog')}
            </Link>
          </SidebarTooltipWrap>

          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'PT' ? 'Central de Ajuda' : lang === 'EN' ? 'Help Center' : 'Centro de Ayuda'}>
            <Link
              to="/ajuda"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith('/ajuda')
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              {!collapsed && (lang === 'PT' ? 'Central de Ajuda' : lang === 'EN' ? 'Help Center' : 'Centro de Ayuda')}
            </Link>
          </SidebarTooltipWrap>

          <SidebarTooltipWrap collapsed={collapsed} label={t('nav.settings') || 'Configurações'}>
            <Link
              to="/configuracoes"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/configuracoes'
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && t('nav.settings')}
            </Link>
          </SidebarTooltipWrap>

          {isAdmin && (
            <SidebarTooltipWrap collapsed={collapsed} label="Back-office">
              <Link
                to="/admin/dashboard"
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors mt-1 ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-destructive/10 text-destructive'
                    : 'text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive/70'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && 'Back-office'}
              </Link>
            </SidebarTooltipWrap>
          )}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-sidebar-border">
          {!collapsed ? (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-sidebar-foreground/50 mb-1.5">
                {lang === 'PT' ? 'Uso do mês' : lang === 'EN' ? 'Monthly usage' : 'Uso del mes'}
              </p>
              <Progress value={pct} className="h-1.5 mb-1" />
              <p className="text-[11px] text-sidebar-foreground/60">
                {used} {lang === 'PT' ? 'de' : lang === 'EN' ? 'of' : 'de'} {limit} · {limit > 0 ? ((used / limit) * 100).toFixed(1) : '0'}%
              </p>
            </div>
          ) : (
            <div className="px-2 py-3 flex justify-center">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center" title={`${used}/${limit}`}>
                <span className="text-[9px] font-bold text-sidebar-primary">{pct}%</span>
              </div>
            </div>
          )}

          {isFree && !collapsed && (
            <div className="px-3 pb-2">
              <Link to="/upgrade">
                <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 gap-2" size="sm">
                  <Crown className="h-4 w-4" />
                  {t('nav.upgrade')}
                </Button>
              </Link>
            </div>
          )}

          <div className={`${collapsed ? 'px-1.5' : 'px-3'} py-2 border-t border-sidebar-border`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <Link to="/configuracoes" className={`flex items-center ${collapsed ? '' : 'gap-3 flex-1 min-w-0'}`}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || ''}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary shrink-0">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-[11px] text-sidebar-foreground/50 capitalize">{profile?.plan || 'free'}</p>
                  </div>
                )}
              </Link>
              {!collapsed && (
                <button onClick={handleSignOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0" title="Sair">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 ${mainMl} transition-all duration-200`}>
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-end gap-3">
          {profile?.blog_handle && (
            <Link
              to={`/blog/${profile.blog_handle}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {lang === 'PT' ? 'Acessar Portal' : lang === 'EN' ? 'Open Portal' : 'Abrir Portal'}
            </Link>
          )}
          <LanguageToggle />
          <Link to="/configuracoes" className="shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ''}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </Link>
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
