import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GenerationCounter } from '@/components/GenerationCounter';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Wand2, BookOpen, Library, CalendarDays,
  Settings, LogOut, Crown, ChevronDown, Search, PenTool, Send
} from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface NavGroup {
  label: { PT: string; EN: string; ES: string };
  icon: React.ElementType;
  items: { key: string; path: string; icon: React.ElementType; locked?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: { PT: 'Criar', EN: 'Create', ES: 'Crear' },
    icon: PenTool,
    items: [
      { key: 'nav.studio', path: '/estudio', icon: Wand2 },
    ],
  },
  {
    label: { PT: 'Pesquisar', EN: 'Research', ES: 'Investigar' },
    icon: Search,
    items: [
      { key: 'nav.library', path: '/biblioteca', icon: Library },
    ],
  },
  {
    label: { PT: 'Publicar', EN: 'Publish', ES: 'Publicar' },
    icon: Send,
    items: [
      { key: 'nav.blog', path: '/blog', icon: BookOpen },
      { key: 'nav.calendar', path: '/calendario', icon: CalendarDays },
    ],
  },
];

const mobileNavItems = [
  { key: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.studio', path: '/estudio', icon: Wand2 },
  { key: 'nav.blog', path: '/blog', icon: BookOpen },
  { key: 'nav.library', path: '/biblioteca', icon: Library },
  { key: 'nav.settings', path: '/configuracoes', icon: Settings },
];

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Criar: true, Pesquisar: true, Publicar: true });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  if (isMobile) {
    return (
      <div className="theme-app min-h-screen bg-background flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-sm">
          <Link to="/dashboard" className="font-display text-lg font-bold truncate">Living Word</Link>
          <div className="flex items-center gap-2 shrink-0">
            <GenerationCounter compact />
            <LanguageToggle />
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="flex-1 overflow-auto px-4 py-4 pb-20">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-1 safe-area-bottom">
          <div className="flex justify-around items-center">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px] text-[10px] transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{t(item.key)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="theme-app min-h-screen bg-background flex">
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

          {navGroups.map((group) => {
            const groupLabel = group.label[lang] || group.label.PT;
            const isOpen = openGroups[group.label.PT] ?? true;
            const GroupIcon = group.icon;

            return (
              <div key={group.label.PT}>
                <button
                  onClick={() => toggleGroup(group.label.PT)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                >
                  <GroupIcon className="h-4 w-4" />
                  <span className="flex-1 text-left">{groupLabel}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </button>

                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            active
                              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {t(item.key)}
                          {item.locked && (
                            <Badge variant="outline" className="ml-auto text-[10px] border-sidebar-primary/40 text-sidebar-primary px-1.5 py-0">
                              🔒
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

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

        {/* Bottom section — fixed, never overlaps */}
        <div className="shrink-0 border-t border-sidebar-border">
          {/* Generation counter */}
          <div className="px-3 py-2">
            <GenerationCounter />
          </div>

          {/* Upgrade CTA */}
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

          {/* User info / Logout */}
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
    </div>
  );
}
