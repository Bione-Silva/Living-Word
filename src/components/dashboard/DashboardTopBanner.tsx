import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, Bell, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PushPermissionModal } from '@/components/PushPermissionModal';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  installTitle: {
    PT: 'Instale o Living Word no seu dispositivo',
    EN: 'Install Living Word on your device',
    ES: 'Instala Living Word en tu dispositivo',
  },
  installSub: {
    PT: 'Acesso rápido pela área de trabalho ou tela inicial — celular, Mac, Windows.',
    EN: 'Quick access from your desktop or home screen — phone, Mac, Windows.',
    ES: 'Acceso rápido desde el escritorio o pantalla de inicio — móvil, Mac, Windows.',
  },
  installCta: { PT: 'Instalar app', EN: 'Install app', ES: 'Instalar app' },
  notifTitle: {
    PT: 'Receba a Palavra Viva toda manhã',
    EN: 'Receive the Living Word every morning',
    ES: 'Recibe la Palabra Viva cada mañana',
  },
  notifSub: {
    PT: 'Devocional diário direto no seu celular ou computador.',
    EN: 'Daily devotional straight to your phone or computer.',
    ES: 'Devocional diario directo en tu móvil o computador.',
  },
  notifCta: { PT: 'Ativar', EN: 'Enable', ES: 'Activar' },
} as const;

export function DashboardTopBanner() {
  const { lang } = useLanguage();
  const l = lang as L;
  const { isInstallable, install, dismiss: dismissInstall } = usePWAInstall();
  const { supported: pushSupported, subscribed, permission } = usePushNotifications();
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(() => {
    try { return sessionStorage.getItem('lw_push_banner_dismissed') === '1'; } catch { return false; }
  });

  // Priority 1: install banner if installable
  if (isInstallable) {
    return (
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{COPY.installTitle[l]}</p>
              <p className="text-xs text-muted-foreground truncate">{COPY.installSub[l]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="h-8 gap-1.5" onClick={() => void install()}>
              <Sparkles className="h-3.5 w-3.5" />
              {COPY.installCta[l]}
            </Button>
            <button
              onClick={dismissInstall}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Priority 2: push opt-in
  // Hide as soon as the user has granted permission OR is already subscribed
  // (avoids the banner sticking around after clicking "Ativar").
  if (
    pushSupported &&
    !subscribed &&
    permission !== 'granted' &&
    permission !== 'denied' &&
    !pushDismissed
  ) {
    return (
      <>
        <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{COPY.notifTitle[l]}</p>
                <p className="text-xs text-muted-foreground truncate">{COPY.notifSub[l]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="h-8" onClick={() => setShowPushModal(true)}>
                {COPY.notifCta[l]}
              </Button>
              <PushPermissionModal
                open={showPushModal}
                onOpenChange={setShowPushModal}
                onSubscribed={() => {
                  setPushDismissed(true);
                  try { sessionStorage.setItem('lw_push_banner_dismissed', '1'); } catch {}
                }}
              />
              <button
                onClick={() => {
                  setPushDismissed(true);
                  try { sessionStorage.setItem('lw_push_banner_dismissed', '1'); } catch {}
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
