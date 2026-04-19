import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
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
  markAll: { PT: 'Marcar todas como lidas', EN: 'Mark all as read', ES: 'Marcar todas como leídas' },
  newDot: { PT: 'Nova', EN: 'New', ES: 'Nueva' },
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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPop = () => {
    setPop(true);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    popTimerRef.current = setTimeout(() => setPop(false), 650);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const isRecent = (n: { scheduled_for: string }) =>
      new Date(n.scheduled_for).getTime() >= Date.now() - 24 * 60 * 60 * 1000;

    const load = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [notifRes, readsRes] = await Promise.all([
        supabase
          .from('notification_queue')
          .select('id, message, type, scheduled_for, sent')
          .eq('user_id', user.id)
          .eq('sent', false)
          .gte('scheduled_for', since)
          .order('scheduled_for', { ascending: true })
          .limit(8),
        supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', user.id),
      ]);
      if (cancelled) return;
      if (notifRes.data) {
        const cleaned = notifRes.data.map(({ sent: _s, ...rest }) => rest) as NotificationItem[];
        setItems(cleaned);
        // Seed seen-ids on initial load so we don't pop for pre-existing items.
        cleaned.forEach((n) => seenIdsRef.current.add(n.id));
      }
      if (readsRes.data) {
        setReadIds(new Set(readsRes.data.map((r) => r.notification_id as string)));
      }
    };

    load();
    // Light fallback poll in case realtime drops.
    const interval = setInterval(load, 120_000);

    // Realtime subscription — listen only to this user's notifications + reads.
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_queue', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as NotificationItem & { sent: boolean };
          if (n.sent || !isRecent(n)) return;
          const isNewToUs = !seenIdsRef.current.has(n.id);
          seenIdsRef.current.add(n.id);
          setItems((prev) => {
            if (prev.some((p) => p.id === n.id)) return prev;
            const next = [...prev, { id: n.id, message: n.message, type: n.type, scheduled_for: n.scheduled_for }];
            return next
              .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
              .slice(0, 8);
          });
          if (isNewToUs) triggerPop();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notification_queue', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as NotificationItem & { sent: boolean };
          if (n.sent || !isRecent(n)) {
            setItems((prev) => prev.filter((p) => p.id !== n.id));
            return;
          }
          setItems((prev) => prev.map((p) => (p.id === n.id ? { id: n.id, message: n.message, type: n.type, scheduled_for: n.scheduled_for } : p)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notification_queue', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const old = payload.old as { id: string };
          setItems((prev) => prev.filter((p) => p.id !== old.id));
          setReadIds((prev) => {
            if (!prev.has(old.id)) return prev;
            const next = new Set(prev);
            next.delete(old.id);
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_reads', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const r = payload.new as { notification_id: string };
          setReadIds((prev) => {
            if (prev.has(r.notification_id)) return prev;
            const next = new Set(prev);
            next.add(r.notification_id);
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notification_reads', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const r = payload.old as { notification_id: string };
          setReadIds((prev) => {
            if (!prev.has(r.notification_id)) return prev;
            const next = new Set(prev);
            next.delete(r.notification_id);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (popTimerRef.current) clearTimeout(popTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = useMemo(
    () => items.filter((n) => !readIds.has(n.id)).length,
    [items, readIds],
  );

  const markOneRead = async (notificationId: string) => {
    if (!user || readIds.has(notificationId)) return;
    // Optimistic.
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });
    const { error } = await supabase
      .from('notification_reads')
      .upsert(
        { user_id: user.id, notification_id: notificationId },
        { onConflict: 'user_id,notification_id', ignoreDuplicates: true },
      );
    if (error) {
      // Roll back if it failed (network, RLS, etc.).
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    const unread = items.filter((n) => !readIds.has(n.id));
    if (unread.length === 0) return;
    // Optimistic.
    const previous = readIds;
    setReadIds((prev) => {
      const next = new Set(prev);
      unread.forEach((n) => next.add(n.id));
      return next;
    });
    const rows = unread.map((n) => ({ user_id: user.id, notification_id: n.id }));
    const { error } = await supabase
      .from('notification_reads')
      .upsert(rows, { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
    if (error) setReadIds(previous);
  };

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
              key={`${unreadCount}-${pop ? 'pop' : 'idle'}`}
              className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center bg-destructive text-destructive-foreground border-0 ${
                pop ? 'animate-badge-pop' : ''
              }`}
              aria-label={`${unreadCount} ${COPY.title[l].toLowerCase()}`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {COPY.title[l]}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
              aria-label={COPY.markAll[l]}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {COPY.markAll[l]}
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">{COPY.empty[l]}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const isUnread = !readIds.has(n.id);
                return (
                  <li
                    key={n.id}
                    onClick={() => markOneRead(n.id)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <span
                          className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                          aria-label={COPY.newDot[l]}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatRelative(n.scheduled_for, l)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
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
