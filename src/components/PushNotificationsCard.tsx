import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'Notificações diárias', EN: 'Daily notifications', ES: 'Notificaciones diarias' },
  desc: {
    PT: 'Receba o devocional do dia direto no celular, Mac ou Windows. Sem app store.',
    EN: 'Get today’s devotional straight to your phone, Mac or Windows. No app store.',
    ES: 'Recibe el devocional del día directo en tu móvil, Mac o Windows. Sin app store.',
  },
  enable: { PT: 'Ativar notificações', EN: 'Enable notifications', ES: 'Activar notificaciones' },
  disable: { PT: 'Desativar', EN: 'Disable', ES: 'Desactivar' },
  hour: { PT: 'Horário', EN: 'Time', ES: 'Hora' },
  tz: { PT: 'Fuso horário', EN: 'Timezone', ES: 'Zona horaria' },
  test: { PT: 'Enviar 3 testes agora', EN: 'Send 3 test notifications', ES: 'Enviar 3 pruebas ahora' },
  unsupported: {
    PT: 'Seu navegador não suporta notificações push. Tente em outro dispositivo.',
    EN: 'Your browser does not support push notifications. Try another device.',
    ES: 'Tu navegador no admite notificaciones push. Prueba en otro dispositivo.',
  },
  deniedHint: {
    PT: 'Se as notificações estiverem bloqueadas, libere nas configurações do navegador (ícone de cadeado na barra de endereço → Notificações → Permitir) e clique em "Tentar novamente".',
    EN: 'If notifications appear blocked, allow them in browser settings (lock icon → Notifications → Allow) and click "Try again".',
    ES: 'Si están bloqueadas, permítelas en los ajustes del navegador (icono de candado → Notificaciones → Permitir) y pulsa "Reintentar".',
  },
  retry: { PT: 'Tentar novamente', EN: 'Try again', ES: 'Reintentar' },
  active: { PT: 'Ativo', EN: 'Active', ES: 'Activo' },
  saved: { PT: 'Preferências salvas', EN: 'Preferences saved', ES: 'Preferencias guardadas' },
  testSent: { PT: '3 notificações enviadas! Verifique sua tela.', EN: '3 notifications sent! Check your screen.', ES: '¡3 notificaciones enviadas! Verifica tu pantalla.' },
} as const;

const TIMEZONES = [
  'America/Sao_Paulo', 'America/New_York', 'America/Los_Angeles', 'America/Mexico_City',
  'America/Bogota', 'America/Buenos_Aires', 'Europe/Lisbon', 'Europe/Madrid', 'Europe/London',
  'Africa/Luanda', 'Africa/Maputo',
];

function detectTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'; }
  catch { return 'America/Sao_Paulo'; }
}

export function PushNotificationsCard() {
  const { profile, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const l = lang as L;
  const { supported, permission, subscribed, busy, subscribe, unsubscribe, sendTest, refresh } = usePushNotifications();

  const [hour, setHour] = useState<number>((profile as any)?.push_hour ?? 6);
  const [tz, setTz] = useState<string>((profile as any)?.push_timezone || detectTz());
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (profile) {
      setHour((profile as any).push_hour ?? 6);
      setTz((profile as any).push_timezone || detectTz());
    }
  }, [profile]);

  // Re-checa o estado real no mount (evita estado preso após mudar nas configs do browser)
  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = async (patch: Record<string, unknown>) => {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() } as any).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error('Error'); return; }
    await refreshProfile();
    toast.success(COPY.saved[l]);
  };

  const handleToggle = async (next: boolean) => {
    if (next) {
      const res = await subscribe();
      if (!res.ok) {
        toast.error(res.error === 'denied' ? COPY.deniedHint[l] : res.error || 'Error');
        return;
      }
      await persist({ push_enabled: true, push_hour: hour, push_timezone: tz });
    } else {
      await unsubscribe();
      await persist({ push_enabled: false });
    }
  };

  const handleTryAgain = async () => {
    // Re-tenta subscribe — se o usuário já liberou nas configs do browser, vai funcionar
    const res = await subscribe();
    if (!res.ok) {
      toast.error(res.error === 'denied' ? COPY.deniedHint[l] : res.error || 'Error');
      await refresh();
      return;
    }
    await persist({ push_enabled: true, push_hour: hour, push_timezone: tz });
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await sendTest();
    setTesting(false);
    if (res.ok) toast.success(COPY.testSent[l]);
    else toast.error(res.error || 'Error');
  };

  const enabled = !!(profile as any)?.push_enabled && subscribed;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {COPY.title[l]}
          </CardTitle>
          {enabled && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">{COPY.active[l]}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{COPY.desc[l]}</p>

        {!supported ? (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">{COPY.unsupported[l]}</p>
        ) : (
          <>
            {permission === 'denied' && !subscribed && (
              <div className="space-y-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-foreground">{COPY.deniedHint[l]}</p>
                <Button size="sm" variant="outline" onClick={handleTryAgain} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {COPY.retry[l]}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label className="cursor-pointer">{enabled ? COPY.disable[l] : COPY.enable[l]}</Label>
              <Switch checked={enabled} onCheckedChange={handleToggle} disabled={busy} />
            </div>

            {enabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{COPY.hour[l]}</Label>
                    <Select value={String(hour)} onValueChange={(v) => { const h = Number(v); setHour(h); persist({ push_hour: h }); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{COPY.tz[l]}</Label>
                    <Select value={tz} onValueChange={(v) => { setTz(v); persist({ push_timezone: v }); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((z) => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="outline" onClick={handleTest} disabled={testing} className="w-full">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {COPY.test[l]}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
          <>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label className="cursor-pointer">{enabled ? COPY.disable[l] : COPY.enable[l]}</Label>
              <Switch checked={enabled} onCheckedChange={handleToggle} disabled={busy} />
            </div>

            {enabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{COPY.hour[l]}</Label>
                    <Select value={String(hour)} onValueChange={(v) => { const h = Number(v); setHour(h); persist({ push_hour: h }); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{COPY.tz[l]}</Label>
                    <Select value={tz} onValueChange={(v) => { setTz(v); persist({ push_timezone: v }); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((z) => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="outline" onClick={handleTest} disabled={testing} className="w-full">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {COPY.test[l]}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
