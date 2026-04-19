import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Trophy, AlertCircle, Mic, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Notificações', EN: 'Notifications', ES: 'Notificaciones' },
  emptyTitle: {
    PT: 'Nada agendado para domingo',
    EN: 'Nothing scheduled for Sunday',
    ES: 'Nada programado para el domingo',
  },
  emptySub: {
    PT: 'Que tal preparar seu próximo sermão agora?',
    EN: 'How about preparing your next sermon now?',
    ES: '¿Qué tal preparar tu próximo sermón ahora?',
  },
  emptyCta: { PT: 'Criar sermão', EN: 'Create sermon', ES: 'Crear sermón' },
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
  const { lang: currentLang } = useLanguage();
  const lang = (currentLang || 'PT') as L;
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
          <Link
            to="/sermoes"
            className="block rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-3"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Mic className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-snug">
                  📅 {labels.emptyTitle[lang]}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {labels.emptySub[lang]}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  {labels.emptyCta[lang]} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
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
