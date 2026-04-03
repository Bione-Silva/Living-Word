import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GenerationCounter } from '@/components/GenerationCounter';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Wand2, BookOpen, Library, CalendarDays,
  Settings, Sparkles, LogOut, Menu, X, Crown
} from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { key: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.studio', path: '/estudio', icon: Wand2 },
  { key: 'nav.blog', path: '/blog', icon: BookOpen },
  { key: 'nav.library', path: '/biblioteca', icon: Library },
  { key: 'nav.calendar', path: '/calendario', icon: CalendarDays },
  { key: 'nav.settings', path: '/configuracoes', icon: Settings },
];

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const mobileNavItems = navItems.slice(0, 4);

  if (isMobile) {
    return (
      <div className="theme-app min-h-screen bg-background flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-b-2xl flex items-center justify-between">
          <Link to="/dashboard" className="font-display text-xl font-bold">Living Word</Link>
          <div className="flex items-center gap-2">
            <GenerationCounter />
            <LanguageToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                  active ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="theme-app min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="w-[220px] min-h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0 bottom-0 z-40">
        <div className="p-5">
          <Link to="/dashboard" className="font-display text-2xl font-bold text-sidebar-primary">
            Living Word
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

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

        {/* User / Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuário'}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{profile?.plan || 'free'}</p>
            </div>
            <button onClick={handleSignOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[220px]">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <GenerationCounter />
            <LanguageToggle />
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
