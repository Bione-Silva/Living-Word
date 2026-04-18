import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  scheduled_for: string;
}

const COPY = {
  title: { PT: 'Notificações', EN: 'Notifications', ES: 'Notificaciones' },
  empty: {
    PT: 'Tudo em dia. Você não tem notificações novas.',
    EN: "You're all caught up. No new notifications.",
    ES: 'Todo al día. No tienes notificaciones nuevas.',
  },
  viewAll: { PT: 'Ver tudo', EN: 'View all', ES: 'Ver todo' },
  ariaLabel: { PT: 'Abrir notificações', EN: 'Open notifications', ES: 'Abrir notificaciones' },
} as const;

function formatRelative(dateStr: string, lang: L): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return lang === 'PT' ? 'Agora' : lang === 'ES' ? 'Ahora' : 'Now';
  if (diffDays === 1) return lang === 'PT' ? 'Amanhã' : lang === 'ES' ? 'Mañana' : 'Tomorrow';
  if (diffDays < 7) {
    return lang === 'PT' ? `Em ${diffDays}d` : lang === 'ES' ? `En ${diffDays}d` : `In ${diffDays}d`;
  }
  return date.toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', {
    day: 'numeric', month: 'short',
  });
}

interface Props {
  variant?: 'desktop' | 'mobile';
}

export function NotificationBell({ variant = 'desktop' }: Props) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const l = (lang || 'PT') as L;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const isRecent = (n: { scheduled_for: string }) =>
      new Date(n.scheduled_for).getTime() >= Date.now() - 24 * 60 * 60 * 1000;

    const load = async () => {
      const { data } = await supabase
        .from('notification_queue')
        .select('id, message, type, scheduled_for, sent')
        .eq('user_id', user.id)
        .eq('sent', false)
        .gte('scheduled_for', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(8);
      if (!cancelled && data) {
        setItems(data.map(({ sent: _s, ...rest }) => rest) as NotificationItem[]);
      }
    };

    load();
    // Light fallback poll in case realtime drops.
    const interval = setInterval(load, 120_000);

    // Realtime subscription — listen only to this user's notifications.
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as NotificationItem & { sent: boolean };
          if (n.sent || !isRecent(n)) return;
          setItems((prev) => {
            if (prev.some((p) => p.id === n.id)) return prev;
            const next = [...prev, { id: n.id, message: n.message, type: n.type, scheduled_for: n.scheduled_for }];
            return next
              .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
              .slice(0, 8);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as NotificationItem & { sent: boolean };
          // If marked as sent or no longer recent, drop it from the list.
          if (n.sent || !isRecent(n)) {
            setItems((prev) => prev.filter((p) => p.id !== n.id));
            return;
          }
          setItems((prev) => prev.map((p) => (p.id === n.id ? { id: n.id, message: n.message, type: n.type, scheduled_for: n.scheduled_for } : p)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const old = payload.old as { id: string };
          setItems((prev) => prev.filter((p) => p.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = items.length;
  const sizeClass = variant === 'mobile' ? 'h-10 w-10' : 'h-9 w-9';
  const iconClass = variant === 'mobile' ? 'h-5 w-5' : 'h-[18px] w-[18px]';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={COPY.ariaLabel[l]}
          className={`relative ${sizeClass} rounded-full flex items-center justify-center text-foreground hover:bg-primary/10 active:bg-primary/15 transition-colors`}
        >
          <Bell className={iconClass} />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center bg-destructive text-destructive-foreground border-0"
              aria-label={`${unreadCount} ${COPY.title[l].toLowerCase()}`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {COPY.title[l]}
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">{COPY.empty[l]}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                  <p className="text-sm text-foreground leading-snug">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatRelative(n.scheduled_for, l)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border bg-muted/30">
            <Link
              to="/configuracoes"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-xs font-semibold text-primary py-2.5 hover:bg-muted/50 transition-colors"
            >
              {COPY.viewAll[l]}
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
