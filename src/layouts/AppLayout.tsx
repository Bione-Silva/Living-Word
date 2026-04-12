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
  LayoutDashboard, Wand2, BookOpen, Library, CalendarDays, Mic,
  Settings, LogOut, Crown, ChevronDown, Search, PenTool, Send, Brain,
  Lightbulb, Quote, Film, FileText, Languages as LanguagesIcon, Type,
  Sparkles, Repeat, Palette, Video, Users, MessageSquare, Mail, Megaphone,
  HelpCircle, Feather, Baby, Globe, Gamepad2, ShieldAlert, ChevronUp,
  ExternalLink, User, Package, GraduationCap, FolderOpen, ImageIcon,
  PanelLeftClose, PanelLeftOpen, Lock, Building2, MoreHorizontal,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { ToolSheet } from '@/components/ToolSheet';
import { SupportChatBubble } from '@/components/SupportChatBubble';
import { ThemeInjector } from '@/components/ThemeInjector';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { UpgradeModal } from '@/components/UpgradeModal';
import {
  PLAN_CREDITS, isToolLockedForPlan, getMinPlanForTool, getUpgradeBadge,
  type PlanSlug, PLAN_DISPLAY_NAMES
} from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

interface SidebarToolItem {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
}

interface SidebarToolGroup {
  key: string;
  label: Record<L, string>;
  icon: React.ElementType;
  tools: SidebarToolItem[];
}

/* ─── NEW STRUCTURE: "Criar" merges old Criar + Extras + Estúdio Social ─── */
const forYouLinks = [
  { id: 'dashboard', to: '/dashboard', icon: LayoutDashboard, label: { PT: 'Início', EN: 'Home', ES: 'Inicio' } },
  { id: 'devocional', to: '/devocional', icon: BookOpen, label: { PT: 'Devocional Diário', EN: 'Daily Devotional', ES: 'Devocional Diario' }, badge: 'Novo' },
  { id: 'bible', to: '/bible', icon: Library, label: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' } },
  { id: 'bom-amigo', to: '/bom-amigo', icon: MessageSquare, label: { PT: 'Palavra Amiga', EN: 'Friendly Word', ES: 'Palabra Amiga' } },
  { id: 'blog', to: '/blog', icon: PenTool, label: { PT: 'Meu Blog', EN: 'My Blog', ES: 'Mi Blog' }, pro: true },
];

const toolsLinks = [
  { id: 'sermon', to: '/sermoes/editor', icon: Wand2, label: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' } },
  { id: 'bible-study', to: '/estudos/novo', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' } },
  { id: 'articles', to: '/blog', icon: FileText, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog & Artículos' } },
  { id: 'social', to: '/social-studio', icon: ImageIcon, label: { PT: 'Artes Bíblicas', EN: 'Biblical Arts', ES: 'Artes Bíblicas' } },
  { id: 'minds', to: '/dashboard/mentes', icon: Brain, label: { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' }, pro: true },
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

function ToolLockBadge({ userPlan, toolId }: { userPlan: PlanSlug; toolId: string }) {
  const requiredPlan = getMinPlanForTool(toolId);
  const badgeType = getUpgradeBadge(userPlan, requiredPlan);

  if (badgeType === 'church') return <Building2 className="h-3 w-3 ml-auto text-blue-400/60 shrink-0" />;
  if (badgeType === 'crown') return <Crown className="h-3 w-3 ml-auto text-primary/50 shrink-0" />;
  return <Lock className="h-3 w-3 ml-auto text-muted-foreground/50 shrink-0" />;
}

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Only ONE group open at a time — stored in localStorage for session persistence
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    try { return localStorage.getItem('lw-sidebar-open-group') || null; } catch { return null; }
  });
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [helpToolId, setHelpToolId] = useState<string | null>(null);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('lw-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ featureName: string; toolId: string; requiredPlan: PlanSlug } | null>(null);

  const userPlan: PlanSlug = (profile?.plan as PlanSlug) || 'free';
  const isFree = userPlan === 'free';

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

  // Only one group open at a time
  const toggleGroup = useCallback((key: string) => {
    setOpenGroup((prev) => {
      const next = prev === key ? null : key;
      try { localStorage.setItem('lw-sidebar-open-group', next || ''); } catch {}
      return next;
    });
  }, []);

  const toggleMobileGroup = (key: string) => {
    setMobileOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAdmin = user?.email === 'bionicaosilva@gmail.com';

  const handleToolClick = (tool: SidebarToolItem) => {
    if (isToolLockedForPlan(tool.id, userPlan)) {
      setUpgradeModal({
        featureName: tool.label[lang],
        toolId: tool.id,
        requiredPlan: getMinPlanForTool(tool.id),
      });
      return;
    }
    if (tool.id === 'sermon-generator') {
      navigate('/sermoes');
      setMobileToolsOpen(false);
      return;
    }
    if (tool.id === 'biblical-study') {
      navigate('/estudos/novo');
      setMobileToolsOpen(false);
      return;
    }
    if (tool.id === 'social-content') {
      navigate('/social-studio');
      setMobileToolsOpen(false);
      return;
    }
    if (tool.id === 'free-article') {
      navigate('/blog');
      setMobileToolsOpen(false);
      return;
    }
    setMobileToolsOpen(false);
    setActiveTool({ id: tool.id, title: tool.label[lang] });
  };

  // Credits usage
  const used = profile?.generations_used || 0;
  const limit = PLAN_CREDITS[userPlan] || profile?.generations_limit || 150;
  const pct = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  const remaining = Math.max(limit - used, 0);
  const creditColor = remaining > 500 ? 'text-emerald-500' : remaining > 100 ? 'text-yellow-500' : 'text-destructive';

  // ─── Account items for dropdown ───
  const accountItems = [
    { to: '/configuracoes', icon: User, label: { PT: 'Meu Perfil', EN: 'My Profile', ES: 'Mi Perfil' } },
    { to: '/upgrade', icon: Crown, label: { PT: 'Plano e Uso', EN: 'Plan & Usage', ES: 'Plan y Uso' } },
    ...(profile?.blog_handle ? [{ to: `/blog/${profile.blog_handle}`, icon: ExternalLink, label: { PT: 'Portal', EN: 'Portal', ES: 'Portal' }, external: true }] : []),
    { to: '/blog', icon: BookOpen, label: { PT: 'Blog', EN: 'Blog', ES: 'Blog' } },
    { to: '/ajuda', icon: HelpCircle, label: { PT: 'Central de Ajuda', EN: 'Help Center', ES: 'Centro de Ayuda' } },
    { to: '/configuracoes', icon: Settings, label: { PT: 'Configurações', EN: 'Settings', ES: 'Configuración' } },
    { to: '/workspaces', icon: FolderOpen, label: { PT: 'Workspaces', EN: 'Workspaces', ES: 'Workspaces' } },
    ...(isAdmin ? [{ to: '/admin/dashboard', icon: ShieldAlert, label: { PT: 'Back-office', EN: 'Back-office', ES: 'Back-office' }, admin: true }] : []),
  ] as Array<{ to: string; icon: React.ElementType; label: Record<L, string>; external?: boolean; admin?: boolean }>;

  /* ═══════════════════════════════════════════════════════════════
     MOBILE LAYOUT
     ═══════════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="theme-app h-screen bg-background flex flex-col">
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

        <div className="px-4 pt-2">
          <PWAInstallBanner />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-20">
          <Outlet />
        </main>

        {/* ─── Mobile BottomNavBar: 5 items ─── */}
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
              onClick={() => { setMobileToolsOpen(true); setMobileAccountOpen(false); }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                mobileToolsOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span className="truncate">{lang === 'PT' ? 'Criar' : lang === 'EN' ? 'Create' : 'Crear'}</span>
            </button>

            <Link
              to="/bible"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                location.pathname === '/bible' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="truncate">{lang === 'PT' ? 'Bíblia' : lang === 'EN' ? 'Bible' : 'Biblia'}</span>
            </Link>

            <Link
              to="/dashboard/mentes"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                location.pathname.startsWith('/dashboard/mentes') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Brain className="h-5 w-5" />
              <span className="truncate">{lang === 'PT' ? 'Mentes' : lang === 'EN' ? 'Minds' : 'Mentes'}</span>
            </Link>

            <button
              onClick={() => { setMobileAccountOpen(true); setMobileToolsOpen(false); }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                mobileAccountOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="truncate">{lang === 'PT' ? 'Conta' : lang === 'EN' ? 'Account' : 'Cuenta'}</span>
            </button>
          </div>
        </nav>

        {/* ─── Mobile "Criar" bottom sheet ─── */}
        <Sheet open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
          <SheetContent side="bottom" className="theme-app max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-display text-lg">
                {lang === 'PT' ? '⚡ Ferramentas' : lang === 'EN' ? '⚡ Tools' : '⚡ Herramientas'}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {lang === 'PT' ? 'Selecione uma ferramenta' : lang === 'EN' ? 'Select a tool' : 'Selecciona una herramienta'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 mt-2">
              {([
                { key: 'for-you', label: { PT: 'Para Você', EN: 'For You', ES: 'Para Ti' } as Record<L, string>, icon: LayoutDashboard, tools: forYouLinks.map(l => ({ id: l.id, icon: l.icon, label: l.label })) },
                { key: 'tools', label: { PT: 'Ferramentas', EN: 'Tools', ES: 'Herramientas' } as Record<L, string>, icon: Sparkles, tools: toolsLinks.map(l => ({ id: l.id, icon: l.icon, label: l.label })) },
              ] satisfies SidebarToolGroup[]).map((group) => {
                const isOpen = mobileOpenGroups[group.key] ?? false;
                const GroupIcon = group.icon;

                return (
                  <div key={group.key}>
                    <button
                      onClick={() => toggleMobileGroup(group.key)}
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
                          const isLocked = isToolLockedForPlan(tool.id, userPlan);
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
                              {isLocked && <ToolLockBadge userPlan={userPlan} toolId={tool.id} />}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                isLocked ? 'bg-muted/50' : 'bg-primary/10'
                              }`}>
                                <Icon className={`h-4 w-4 ${isLocked ? 'text-muted-foreground' : 'text-primary'}`} />
                              </div>
                              <span className="text-[11px] leading-tight font-medium line-clamp-2 text-foreground">
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

              {/* Navigation shortcuts in mobile tools sheet */}
              <div className="pt-3 border-t border-border mt-2">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-2 mb-2">
                  {lang === 'PT' ? 'NAVEGAÇÃO' : lang === 'EN' ? 'NAVIGATION' : 'NAVEGACIÓN'}
                </p>
                <div className="grid grid-cols-3 gap-2 px-1">
                  {[
                    { to: '/biblioteca', icon: Library, label: { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' } },
                    { to: '/calendario', icon: CalendarDays, label: { PT: 'Calendário', EN: 'Calendar', ES: 'Calendario' } },
                    { to: '/bible', icon: BookOpen, label: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' } },
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
                        <span className="text-[11px] leading-tight font-medium line-clamp-2 text-foreground">
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

        {/* ─── Mobile "Conta" bottom sheet ─── */}
        <Sheet open={mobileAccountOpen} onOpenChange={setMobileAccountOpen}>
          <SheetContent side="bottom" className="theme-app max-h-[70vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-display text-lg">
                {lang === 'PT' ? '👤 Conta' : lang === 'EN' ? '👤 Account' : '👤 Cuenta'}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {lang === 'PT' ? 'Menu de conta' : lang === 'EN' ? 'Account menu' : 'Menú de cuenta'}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-1 mt-2">
              {accountItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.to + item.label.PT}
                    to={item.to}
                    target={item.external ? '_blank' : undefined}
                    onClick={() => setMobileAccountOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      item.admin
                        ? 'text-destructive hover:bg-destructive/10'
                        : location.pathname === item.to
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/70 hover:bg-muted'
                    }`}
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" />
                    <span>{item.label[lang]}</span>
                    {item.external && <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />}
                  </Link>
                );
              })}

              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={() => { setMobileAccountOpen(false); handleSignOut(); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{lang === 'PT' ? 'Sair' : lang === 'EN' ? 'Sign Out' : 'Salir'}</span>
                </button>
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

  /* ═══════════════════════════════════════════════════════════════
     DESKTOP LAYOUT
     ═══════════════════════════════════════════════════════════════ */
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

        {/* ─── SECTION 1: PARA VOCÊ ─── */}
        {!collapsed && (
          <div className="px-5 pt-2 pb-1 shrink-0 mt-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">
              {lang === 'PT' ? 'PARA VOCÊ' : lang === 'ES' ? 'PARA TI' : 'FOR YOU'}
            </span>
          </div>
        )}

        <nav className={`flex-1 ${collapsed ? 'px-1.5' : 'px-3'} space-y-0.5 min-h-[min-content]`}>
          {forYouLinks.map(link => {
            const Icon = link.icon;
            const isPro = link.pro && isFree;
            return (
              <SidebarTooltipWrap key={link.id} collapsed={collapsed} label={link.label[lang]}>
                <Link
                  to={isPro ? '/upgrade' : link.to}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between">
                      <span>{link.label[lang]}</span>
                      {link.badge && (
                        <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500 px-1.5 py-0 bg-emerald-500/10">
                          {link.badge}
                        </Badge>
                      )}
                      {link.pro && (
                        <Badge variant="outline" className="text-[9px] border-sidebar-primary/40 text-sidebar-primary px-1.5 py-0">
                          Pro
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              </SidebarTooltipWrap>
            );
          })}

          {/* ─── Separator ─── */}
          <div className={`${collapsed ? 'mx-1' : 'mx-0'} border-t border-sidebar-border my-3`} />

          {/* ─── SECTION 2: FERRAMENTAS ─── */}
          {!collapsed && (
            <div className="px-5 pb-1 shrink-0">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">
                {lang === 'PT' ? 'FERRAMENTAS' : lang === 'ES' ? 'HERRAMIENTAS' : 'TOOLS'}
              </span>
            </div>
          )}

          {toolsLinks.map(link => {
            const Icon = link.icon;
            const isPro = link.pro && isFree;
            return (
              <SidebarTooltipWrap key={link.id} collapsed={collapsed} label={link.label[lang]}>
                <Link
                  to={isPro ? '/upgrade' : link.to}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith(link.to)
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between">
                      <span>{link.label[lang]}</span>
                      {link.pro && (
                        <Badge variant="outline" className="text-[9px] border-sidebar-primary/40 text-sidebar-primary px-1.5 py-0">
                          Pro
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>
              </SidebarTooltipWrap>
            );
          })}
        </nav>

        {/* ─── Bottom section: Credits + Account ─── */}
        <div className="shrink-0 border-t border-sidebar-border">
          {/* Credits wallet */}
          {!collapsed ? (
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${remaining > 500 ? 'bg-emerald-500' : remaining > 100 ? 'bg-yellow-500' : 'bg-destructive'}`} />
                <p className="text-[10px] font-semibold tracking-wider uppercase text-sidebar-foreground/50">
                  {lang === 'PT' ? 'Créditos' : lang === 'EN' ? 'Credits' : 'Créditos'}
                </p>
              </div>
              <Progress value={pct} className="h-1.5 mb-1" />
              <p className={`text-[11px] font-mono ${creditColor}`}>
                🟢 {remaining.toLocaleString()} {lang === 'PT' ? 'disponíveis' : lang === 'EN' ? 'available' : 'disponibles'}
              </p>
              {isFree && (
                <Link to="/upgrade" className="block mt-2">
                  <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 gap-2" size="sm">
                    <Crown className="h-4 w-4" />
                    {t('nav.upgrade')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="px-2 py-3 flex justify-center">
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${remaining > 500 ? 'bg-emerald-500/20' : remaining > 100 ? 'bg-yellow-500/20' : 'bg-destructive/20'}`} title={`${remaining}/${limit}`}>
                    <span className={`text-[9px] font-bold ${creditColor}`}>{remaining > 999 ? `${Math.round(remaining / 1000)}k` : remaining}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">
                  🟢 {remaining.toLocaleString()} {lang === 'PT' ? 'créditos' : 'credits'}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* ─── SECTION 3: CONTA (collapsible) ─── */}
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
                    <p className="text-[11px] text-sidebar-foreground/50 capitalize">
                      {PLAN_DISPLAY_NAMES[userPlan]?.[lang] || userPlan}
                    </p>
                  </div>
                )}
              </Link>
              {!collapsed && (
                <button
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0 p-1 rounded hover:bg-sidebar-accent/50 transition-colors"
                  title={lang === 'PT' ? 'Menu de conta' : 'Account menu'}
                >
                  <ChevronUp className={`h-4 w-4 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Account dropdown (desktop) */}
            {accountOpen && !collapsed && (
              <div className="mt-2 space-y-0.5 animate-in slide-in-from-bottom-2 duration-150">
                {accountItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.to + item.label.PT}
                      to={item.to}
                      target={item.external ? '_blank' : undefined}
                      onClick={() => setAccountOpen(false)}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        item.admin
                          ? 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive'
                          : location.pathname === item.to
                            ? 'bg-sidebar-accent text-sidebar-primary'
                            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                      }`}
                    >
                      <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label[lang]}</span>
                      {item.external && <ExternalLink className="h-3 w-3 ml-auto text-sidebar-foreground/30" />}
                    </Link>
                  );
                })}

                <button
                  onClick={() => { setAccountOpen(false); handleSignOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span>{lang === 'PT' ? 'Sair' : lang === 'EN' ? 'Sign Out' : 'Salir'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 ${mainMl} transition-all duration-200 h-screen flex flex-col`}>
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
          <SupportChatBubble />
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
        <main className="flex-1 overflow-y-auto p-6">
          <PWAInstallBanner />
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
