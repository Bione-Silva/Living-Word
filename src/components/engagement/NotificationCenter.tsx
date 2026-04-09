import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Notificações', EN: 'Notifications', ES: 'Notificaciones' },
  noNotifications: { PT: 'Nenhuma notificação agendada', EN: 'No scheduled notifications', ES: 'Sin notificaciones programadas' },
  upcoming: { PT: 'Próximas', EN: 'Upcoming', ES: 'Próximas' },
} satisfies Record<string, Record<L, string>>;

const typeIcons: Record<string, React.ReactNode> = {
  new_devotional: <Calendar className="h-4 w-4 text-blue-500" />,
  series_milestone: <Trophy className="h-4 w-4 text-yellow-500" />,
  engagement_reminder: <AlertCircle className="h-4 w-4 text-orange-500" />,
};

interface Notification {
  id: string;
  message: string;
  type: string;
  scheduled_for: string;
  sent: boolean;
}

function formatRelativeDate(dateStr: string, lang: L): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return lang === 'PT' ? 'Hoje' : lang === 'ES' ? 'Hoy' : 'Today';
  if (diffDays === 1) return lang === 'PT' ? 'Amanhã' : lang === 'ES' ? 'Mañana' : 'Tomorrow';
  if (diffDays < 7) {
    return lang === 'PT' ? `Em ${diffDays} dias` : lang === 'ES' ? `En ${diffDays} días` : `In ${diffDays} days`;
  }
  return date.toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', {
    day: 'numeric', month: 'short',
  });
}

export function NotificationCenter() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lang = (language || 'PT') as L;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('sent', false)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(10);

      if (data) setNotifications(data as Notification[]);
    };

    load();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          {labels.title[lang]}
          {notifications.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            {labels.noNotifications[lang]}
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/30">
                <div className="mt-0.5">{typeIcons[n.type] || <Bell className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeDate(n.scheduled_for, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
