import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HelpArticleModal } from '@/components/HelpArticleModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { GenerationCounter } from '@/components/GenerationCounter';
// LanguageToggle removed from top navbar — language switch lives in Settings now.
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
  PanelLeftClose, PanelLeftOpen, Lock, Building2, MoreHorizontal, Menu, X,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { BrandIcon } from '@/components/BrandIcon';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { Badge } from '@/components/ui/badge';
import { ToolSheet } from '@/components/ToolSheet';
import { SupportChatBubble } from '@/components/SupportChatBubble';
import { ThemeInjector } from '@/components/ThemeInjector';
import { MobileInstallBanner } from '@/components/MobileInstallBanner';
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
const sidebarGroups: SidebarToolGroup[] = [
  {
    key: 'criar',
    label: { PT: 'Criar', EN: 'Create', ES: 'Crear' },
    icon: Sparkles,
    tools: [
      { id: 'sermon-generator', icon: Mic, label: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' } },
      { id: 'biblical-study', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' } },
      { id: 'free-article', icon: PenTool, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' } },
      { id: 'title-gen', icon: Type, label: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' } },
      { id: 'metaphor-creator', icon: Lightbulb, label: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' } },
      { id: 'illustrations', icon: Film, label: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' } },
      { id: 'bible-modernizer', icon: Sparkles, label: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' } },
      { id: 'free-article-universal', icon: Type, label: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' } },
      { id: 'social-studio', icon: Palette, label: { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' } },
      { id: 'youtube-blog', icon: Video, label: { PT: 'YouTube → Blog', EN: 'YouTube → Blog', ES: 'YouTube → Blog' } },
      { id: 'reels-script', icon: Video, label: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' } },
      { id: 'social-caption', icon: MessageSquare, label: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' } },
      { id: 'newsletter', icon: Mail, label: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' } },
      { id: 'announcements', icon: Megaphone, label: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' } },
      { id: 'trivia', icon: HelpCircle, label: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' } },
      { id: 'poetry', icon: Feather, label: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' } },
      { id: 'deep-translation', icon: Globe, label: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' } },
    ],
  },
  {
    key: 'pesquisar',
    label: { PT: 'Pesquisar', EN: 'Research', ES: 'Investigar' },
    icon: Search,
    tools: [
      { id: 'topic-explorer', icon: Lightbulb, label: { PT: 'Explorador de Temas', EN: 'Topic Explorer', ES: 'Explorador de Temas' } },
      { id: 'verse-finder', icon: BookOpen, label: { PT: 'Encontre Versículos', EN: 'Find Verses', ES: 'Encuentra Versículos' } },
      { id: 'historical-context', icon: Globe, label: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' } },
      { id: 'quote-finder', icon: Quote, label: { PT: 'Localizador de Citações', EN: 'Quote Finder', ES: 'Buscador de Citas' } },
      { id: 'original-text', icon: FileText, label: { PT: 'Texto Original', EN: 'Original Text', ES: 'Texto Original' } },
      { id: 'lexical', icon: LanguagesIcon, label: { PT: 'Pesquisa Lexical', EN: 'Lexical Research', ES: 'Investigación Léxica' } },
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

function ToolLockBadge({ userPlan, toolId }: { userPlan: PlanSlug; toolId: string }) {
  const requiredPlan = getMinPlanForTool(toolId);
  const badgeType = getUpgradeBadge(userPlan, requiredPlan);

  if (badgeType === 'church') return <Building2 className="h-3 w-3 ml-auto text-blue-400/60 shrink-0" />;
  if (badgeType === 'crown') return <Crown className="h-3 w-3 ml-auto text-primary/50 shrink-0" />;
  return <Lock className="h-3 w-3 ml-auto text-muted-foreground/50 shrink-0" />;
}

export default function AppLayout() {
  const { user, profile, signOut, loading } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isBibleRoute = location.pathname === '/bible';

  // Force light theme (Divine White #F8F6FF) across all authenticated screens —
  // matches the look of MindProfile and keeps Bible/reading/writing surfaces light.
  useForceLightTheme();


  // Only ONE group open at a time — stored in localStorage for session persistence
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    try { return localStorage.getItem('lw-sidebar-open-group') || null; } catch { return null; }
  });
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    if (tool.id === 'social-content' || tool.id === 'social-studio') {
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
      <div className={`${isBibleRoute ? 'bible-light bg-background' : 'theme-app bg-background'} h-[100dvh] flex flex-col`}>
        <ThemeInjector />
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-3 min-h-[calc(4rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              className="h-10 w-10 -ml-1 rounded-lg flex items-center justify-center text-foreground hover:bg-primary/10 active:bg-primary/15 transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/dashboard" className="font-display text-lg font-bold text-foreground truncate leading-none">Living Word</Link>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-center">
            <SupportChatBubble />
            {!loading && profile?.blog_handle && (
              <Link to={`/blog/${profile.blog_handle}`} target="_blank" className="text-primary">
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        </header>

        <div className="px-4 pt-2">
          <MobileInstallBanner />
        </div>

        <main className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] ${isBibleRoute ? 'bible-light bible-light-surface' : ''}`}>
          <Outlet />
        </main>

        {/* ─── Mobile BottomNavBar: 6 essential items ─── */}
        <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-1 py-1 safe-area-bottom ${isBibleRoute ? 'bible-light' : ''}`}>
          <div className="flex justify-around items-center">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] text-[9.5px] font-medium transition-colors ${
                location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-[18px] w-[18px]" />
              <span className="truncate leading-tight">{lang === 'PT' ? 'Início' : lang === 'EN' ? 'Home' : 'Inicio'}</span>
            </Link>

            <button
              onClick={() => { setMobileToolsOpen(true); setMobileAccountOpen(false); }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] text-[9.5px] font-medium transition-colors ${
                mobileToolsOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="h-[18px] w-[18px]" />
              <span className="truncate leading-tight">{lang === 'PT' ? 'Criar' : lang === 'EN' ? 'Create' : 'Crear'}</span>
            </button>

            <Link
              to="/bible"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] text-[9.5px] font-medium transition-colors ${
                location.pathname === '/bible' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <BookOpen className="h-[18px] w-[18px]" />
              <span className="truncate leading-tight">{lang === 'PT' ? 'Bíblia' : lang === 'EN' ? 'Bible' : 'Biblia'}</span>
            </Link>

            <Link
              to="/dashboard/mentes"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] text-[9.5px] font-medium transition-colors ${
                location.pathname.startsWith('/dashboard/mentes') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Brain className="h-[18px] w-[18px]" />
              <span className="truncate leading-tight">{lang === 'PT' ? 'Mentes' : lang === 'EN' ? 'Minds' : 'Mentes'}</span>
            </Link>

            <Link
              to="/ferramentas"
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] text-[9.5px] font-medium transition-colors ${
                location.pathname === '/ferramentas' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Package className="h-[18px] w-[18px]" />
              <span className="truncate leading-tight">{lang === 'PT' ? 'Tools' : lang === 'EN' ? 'Tools' : 'Tools'}</span>
            </Link>

            <button
              onClick={() => { setMobileAccountOpen(true); setMobileToolsOpen(false); }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[44px] text-[9.5px] font-medium transition-colors ${
                mobileAccountOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <User className="h-[18px] w-[18px]" />
              <span className="truncate leading-tight">{lang === 'PT' ? 'Conta' : lang === 'EN' ? 'Account' : 'Cuenta'}</span>
            </button>
          </div>
        </nav>

        {/* ─── Mobile "Criar" bottom sheet — only the 3 main actions ─── */}
        <Sheet open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
          <SheetContent side="bottom" className="theme-app max-h-[70vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="pb-3">
              <SheetTitle className="font-display text-xl">
                {lang === 'PT' ? 'O que você quer criar?' : lang === 'EN' ? 'What do you want to create?' : '¿Qué quieres crear?'}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {lang === 'PT'
                  ? 'Escolha uma ação principal para começar.'
                  : lang === 'EN'
                  ? 'Choose a main action to get started.'
                  : 'Elige una acción principal para empezar.'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-2.5 mt-2">
              {[
                {
                  to: '/sermoes',
                  icon: Mic,
                  label: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
                  desc: {
                    PT: 'Esboços, ilustrações e fechamentos pastorais.',
                    EN: 'Outlines, illustrations and pastoral closings.',
                    ES: 'Esquemas, ilustraciones y cierres pastorales.',
                  },
                },
                {
                  to: '/estudos/novo',
                  icon: GraduationCap,
                  label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
                  desc: {
                    PT: 'Exposição, contexto e aplicação prática.',
                    EN: 'Exposition, context and practical application.',
                    ES: 'Exposición, contexto y aplicación práctica.',
                  },
                },
                {
                  to: '/social-studio',
                  icon: Palette,
                  label: { PT: 'Post Social', EN: 'Social Post', ES: 'Post Social' },
                  desc: {
                    PT: 'Artes bíblicas e carrosséis para redes.',
                    EN: 'Biblical art and carousels for social.',
                    ES: 'Arte bíblico y carruseles para redes.',
                  },
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => { setMobileToolsOpen(false); navigate(item.to); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] transition-all text-left"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ItemIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[15px] text-foreground leading-tight">
                        {item.label[lang]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {item.desc[lang]}
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => { setMobileToolsOpen(false); navigate('/ferramentas'); }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-medium text-foreground/80"
              >
                <Package className="h-4 w-4" />
                {lang === 'PT' ? 'Ver todas as ferramentas' : lang === 'EN' ? 'See all tools' : 'Ver todas las herramientas'}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* ─── Mobile Hamburger Menu (left drawer) — full navigation ─── */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="theme-app w-[88vw] max-w-[340px] p-0 overflow-y-auto">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <SheetTitle className="font-display text-xl text-sidebar-foreground text-left">Living Word</SheetTitle>
              <SheetDescription className="sr-only">Menu principal</SheetDescription>
            </SheetHeader>

            <div className="px-3 py-3 space-y-1">
              {/* Primary navigation */}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>{t('nav.dashboard')}</span>
              </Link>
              <Link
                to="/bible"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/bible' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>{lang === 'PT' ? 'Bíblia' : lang === 'EN' ? 'Bible' : 'Biblia'}</span>
              </Link>
              <Link
                to="/dashboard/mentes"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/dashboard/mentes') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <Brain className="h-4 w-4 shrink-0" />
                <span>{lang === 'PT' ? 'Mentes' : lang === 'EN' ? 'Minds' : 'Mentes'}</span>
              </Link>
              <Link
                to="/biblioteca"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/biblioteca' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <Library className="h-4 w-4 shrink-0" />
                <span>{lang === 'PT' ? 'Biblioteca' : lang === 'EN' ? 'Library' : 'Biblioteca'}</span>
              </Link>
              <Link
                to="/calendario"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/calendario' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>{lang === 'PT' ? 'Calendário' : lang === 'EN' ? 'Calendar' : 'Calendario'}</span>
              </Link>

              {/* Ferramentas — single link to dedicated page (no nested groups on mobile) */}
              <Link
                to="/ferramentas"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/ferramentas' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <Package className="h-4 w-4 shrink-0" />
                <span>{lang === 'PT' ? 'Ferramentas' : lang === 'EN' ? 'Tools' : 'Herramientas'}</span>
              </Link>

              {/* Account */}
              <div className="pt-3 mt-2 border-t border-border">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground px-3 mb-1.5">
                  {lang === 'PT' ? 'Conta' : lang === 'EN' ? 'Account' : 'Cuenta'}
                </p>
                {accountItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={`menu-${item.to}-${item.label.PT}`}
                      to={item.to}
                      target={item.external ? '_blank' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        item.admin
                          ? 'text-destructive hover:bg-destructive/10'
                          : location.pathname === item.to
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <ItemIcon className="h-4 w-4 shrink-0" />
                      <span>{item.label[lang]}</span>
                      {item.external && <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />}
                    </Link>
                  );
                })}

                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{lang === 'PT' ? 'Sair' : lang === 'EN' ? 'Sign Out' : 'Salir'}</span>
                </button>
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
            <div className="w-8 h-8 rounded-lg bg-sidebar-foreground/15 flex items-center justify-center shrink-0 overflow-hidden">
              <BrandIcon className="h-6 w-6" />
            </div>
            {!collapsed && <span className="font-display text-xl font-bold text-sidebar-foreground">Living Word</span>}
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

        {/* ─── SECTION 1: FERRAMENTAS ─── */}
        {!collapsed && (
          <div className="px-5 pt-2 pb-1 shrink-0">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">
              {t('nav.tools') || 'FERRAMENTAS'}
            </span>
          </div>
        )}

        <nav className={`flex-1 ${collapsed ? 'px-1.5' : 'px-3'} space-y-0.5 overflow-y-auto min-h-0`}>
          {/* 1.1 — Dashboard */}
          <SidebarTooltipWrap collapsed={collapsed} label={t('nav.dashboard') || 'Dashboard'}>
            <Link
              to="/dashboard"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && t('nav.dashboard')}
            </Link>
          </SidebarTooltipWrap>

          {/* 1.2 & 1.3 — Criar + Pesquisar (collapsible, only one open) */}
          {sidebarGroups.map((group) => {
            const isOpen = openGroup === group.key;
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                <SidebarTooltipWrap collapsed={collapsed} label={group.label[lang]}>
                  <button
                    onClick={() => !collapsed && toggleGroup(group.key)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isOpen
                        ? 'text-sidebar-foreground bg-sidebar-accent/30'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    }`}
                  >
                    <GroupIcon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{group.label[lang]}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'} ${isOpen ? 'text-sidebar-foreground' : 'text-sidebar-foreground/40'}`} />
                      </>
                    )}
                  </button>
                </SidebarTooltipWrap>

                {isOpen && !collapsed && (
                  <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 max-h-[280px] overflow-y-auto">
                    {group.tools.map((tool) => {
                      const Icon = tool.icon;
                      const isLocked = isToolLockedForPlan(tool.id, userPlan);
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
                          {isLocked && <ToolLockBadge userPlan={userPlan} toolId={tool.id} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 1.4 — Bíblia */}
          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'PT' ? 'Bíblia' : lang === 'EN' ? 'Bible' : 'Biblia'}>
            <Link
              to="/bible"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/bible'
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              {!collapsed && (lang === 'PT' ? 'Bíblia' : lang === 'EN' ? 'Bible' : 'Biblia')}
            </Link>
          </SidebarTooltipWrap>

          {/* ─── Separator ─── */}
          <div className={`${collapsed ? 'mx-1' : 'mx-0'} border-t border-sidebar-border my-2`} />

          {/* ─── SECTION 2: RECURSOS ─── */}
          {!collapsed && (
            <div className="px-3 pb-1">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/50">
                {lang === 'PT' ? 'RECURSOS' : lang === 'EN' ? 'RESOURCES' : 'RECURSOS'}
              </span>
            </div>
          )}

          {/* 2.1 — Mentes Brilhantes */}
          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'EN' ? 'Brilliant Minds' : lang === 'ES' ? 'Mentes Brillantes' : 'Mentes Brilhantes'}>
            <Link
              to="/dashboard/mentes"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith('/dashboard/mentes')
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Brain className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  {lang === 'EN' ? '🧠 Brilliant Minds' : lang === 'ES' ? '🧠 Mentes Brillantes' : '🧠 Mentes Brilhantes'}
                  <Badge variant="outline" className="ml-auto text-[9px] border-sidebar-foreground/40 text-sidebar-foreground px-1.5 py-0">
                    Premium
                  </Badge>
                </>
              )}
            </Link>
          </SidebarTooltipWrap>

          {/* 2.2 — Biblioteca */}
          <SidebarTooltipWrap collapsed={collapsed} label={t('nav.library') || 'Biblioteca'}>
            <Link
              to="/biblioteca"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/biblioteca'
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Library className="h-4 w-4 shrink-0" />
              {!collapsed && t('nav.library')}
            </Link>
          </SidebarTooltipWrap>

          {/* 2.3 — Calendário */}
          <SidebarTooltipWrap collapsed={collapsed} label={lang === 'PT' ? 'Calendário' : lang === 'EN' ? 'Calendar' : 'Calendario'}>
            <Link
              to="/calendario"
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/calendario'
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              {!collapsed && (lang === 'PT' ? 'Calendário' : lang === 'EN' ? 'Calendar' : 'Calendario')}
            </Link>
          </SidebarTooltipWrap>
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
                  <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground shrink-0">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sidebar-foreground">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-[11px] text-sidebar-foreground/60 capitalize">
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
          <MobileInstallBanner />
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
