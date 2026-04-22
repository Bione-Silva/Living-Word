import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Loader2, AlertCircle, Smartphone } from 'lucide-react';
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
  iosNeedsPwa: {
    PT: 'No iPhone/iPad, primeiro instale o app: toque em "Compartilhar" ↑ no Safari → "Adicionar à Tela de Início". Depois abra pelo ícone na tela inicial e ative aqui novamente.',
    EN: 'On iPhone/iPad, first install the app: tap Share ↑ in Safari → "Add to Home Screen". Then open from the home-screen icon and enable here again.',
    ES: 'En iPhone/iPad primero instala la app: toca Compartir ↑ en Safari → "Añadir a pantalla de inicio". Luego ábrela desde el ícono y activa aquí de nuevo.',
  },
  deniedTitle: {
    PT: 'Notificações bloqueadas neste navegador',
    EN: 'Notifications blocked in this browser',
    ES: 'Notificaciones bloqueadas en este navegador',
  },
  deniedSteps: {
    PT: [
      'Clique no ícone de cadeado 🔒 ao lado do endereço (acima).',
      'Procure "Notificações" e mude para Permitir.',
      'Recarregue a página e clique em "Tentar novamente" abaixo.',
    ],
    EN: [
      'Click the lock icon 🔒 next to the URL (above).',
      'Find "Notifications" and switch it to Allow.',
      'Reload the page and click "Try again" below.',
    ],
    ES: [
      'Haz clic en el icono de candado 🔒 junto a la URL (arriba).',
      'Busca "Notificaciones" y cámbialas a Permitir.',
      'Recarga la página y pulsa "Reintentar" abajo.',
    ],
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

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari only
    window.navigator.standalone === true
  );
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
  // Local override so the toggle stays ON even if DB persist temporarily fails
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);
  // Only show the "blocked" banner after the user actively tried to enable
  // notifications in this session. Otherwise a stale browser-level "denied"
  // state hijacks the card and hides the main toggle.
  const [showDeniedHelp, setShowDeniedHelp] = useState(false);

  const iosNoPwa = useMemo(() => isIOS() && !isStandalonePWA(), []);

  useEffect(() => {
    if (profile) {
      setHour((profile as any).push_hour ?? 6);
      setTz((profile as any).push_timezone || detectTz());
    }
  }, [profile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = async (patch: Record<string, unknown>) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() } as any).eq('id', profile.id);
      setSaving(false);
      if (error) {
        console.warn('[push] persist error (columns may be missing):', error.message);
        // Don't show error toast — the push itself worked, DB is optional for UX
        return;
      }
      await refreshProfile();
      toast.success(COPY.saved[l]);
    } catch (e) {
      setSaving(false);
      console.warn('[push] persist exception', e);
    }
  };

  const handleToggle = async (next: boolean) => {
    if (next) {
      const res = await subscribe();
      if (!res.ok) {
        if (res.error === 'denied') {
          setShowDeniedHelp(true);
          toast.error(COPY.deniedTitle[l], { duration: 6000 });
        } else {
          toast.error(res.error || 'Error');
        }
        await refresh();
        return;
      }
      setShowDeniedHelp(false);
      setLocalEnabled(true);
      await persist({ push_enabled: true, push_hour: hour, push_timezone: tz });
    } else {
      await unsubscribe();
      setLocalEnabled(false);
      await persist({ push_enabled: false });
    }
  };

  const handleTryAgain = async () => {
    const res = await subscribe();
    if (!res.ok) {
      toast.error(res.error === 'denied' ? COPY.deniedTitle[l] : res.error || 'Error');
      await refresh();
      return;
    }
    setShowDeniedHelp(false);
    await persist({ push_enabled: true, push_hour: hour, push_timezone: tz });
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await sendTest();
    setTesting(false);
    if (res.ok) toast.success(COPY.testSent[l]);
    else toast.error(res.error || 'Error');
  };

  // Use localEnabled (set on successful subscribe/unsubscribe) as primary source,
  // fall back to DB value + browser subscription state.
  const enabled = localEnabled !== null
    ? localEnabled
    : (!!(profile as any)?.push_enabled && subscribed);

  const handleToggleClick = () => {
    if (busy) return;
    void handleToggle(!enabled);
  };

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
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{COPY.unsupported[l]}</p>
          </div>
        ) : iosNoPwa ? (
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{COPY.iosNeedsPwa[l]}</p>
          </div>
        ) : (
          <>
            {showDeniedHelp && permission === 'denied' && !subscribed && (
              <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm font-semibold text-foreground">{COPY.deniedTitle[l]}</p>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground/90">
                  {COPY.deniedSteps[l].map((step, i) => (
                    <li key={i} className="leading-snug">{step}</li>
                  ))}
                </ol>
                <Button size="sm" variant="outline" onClick={handleTryAgain} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {COPY.retry[l]}
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              className={`w-full justify-between h-14 px-4 shadow-sm transition-all border-2 ${enabled ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'}`}
              onClick={() => handleToggleClick()}
              disabled={busy}
            >
              <div className="flex items-center gap-3">
                <Bell className={`h-5 w-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-sm">
                  {enabled ? COPY.disable[l] : COPY.enable[l]}
                </span>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={() => handleToggleClick()}
                disabled={busy}
                className="pointer-events-none"
              />
            </Button>

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
