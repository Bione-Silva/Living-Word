import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Bell, Download, Sparkles, X, Wifi } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: {
    PT: 'Baixe o Living Word',
    EN: 'Get the Living Word app',
    ES: 'Descarga Living Word',
  },
  desc: {
    PT: 'Notificações diárias, acesso offline e Palavra do Dia direto no seu celular.',
    EN: 'Daily notifications, offline access, and Daily Word right on your phone.',
    ES: 'Notificaciones diarias, acceso offline y Palabra del Día en tu móvil.',
  },
  cta: { PT: 'Instalar app', EN: 'Install app', ES: 'Instalar app' },
  iosHint: {
    PT: 'No iPhone: toque em Compartilhar e em "Adicionar à Tela de Início".',
    EN: 'On iPhone: tap Share, then "Add to Home Screen".',
    ES: 'En iPhone: toca Compartir y "Añadir a pantalla de inicio".',
  },
  iosCta: { PT: 'Como instalar', EN: 'How to install', ES: 'Cómo instalar' },
  benefits: {
    notif: { PT: 'Notificações', EN: 'Push alerts', ES: 'Notificaciones' },
    offline: { PT: 'Acesso offline', EN: 'Works offline', ES: 'Sin conexión' },
    fast: { PT: 'Mais rápido', EN: 'Faster', ES: 'Más rápido' },
  },
} as const;

const STORAGE_KEY = 'lw_mobile_install_dismissed_at';
const SUPPRESS_DAYS = 7;

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function MobileInstallBanner() {
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();
  const { isInstallable, install, dismiss } = usePWAInstall();
  const { lang } = useLanguage();
  const l = lang as L;

  const [showIosSheet, setShowIosSheet] = useState(false);
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      const ts = localStorage.getItem(STORAGE_KEY);
      if (!ts) return false;
      const dismissedAt = Number(ts);
      const now = Date.now();
      return now - dismissedAt < SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  // Banner is persistent: it only disappears when the user dismisses it,
  // installs the app, or the app is launched in standalone mode.
  // No auto-hide timer — that interrupts the install nudge.

  if (isStandalone || hidden) return null;

  const ios = isIos();
  // On iOS we always show manual instructions when not standalone.
  // On Android/desktop Chrome we need the beforeinstallprompt event.
  // If we have neither, hide.
  if (!isInstallable && !(ios && isMobile)) return null;

  const handleDismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    dismiss();
  };

  const handleInstall = async () => {
    if (ios) {
      setShowIosSheet(true);
      return;
    }
    const accepted = await install();
    if (accepted) handleDismiss();
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500"
      role="region"
      aria-label={COPY.title[l]}
    >
      <button
        onClick={handleDismiss}
        aria-label="Dispensar"
        className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="p-3.5 pr-8">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground leading-tight">{COPY.title[l]}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{COPY.desc[l]}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Bell className="h-3 w-3 text-primary" />{COPY.benefits.notif[l]}</span>
          <span className="inline-flex items-center gap-1"><Wifi className="h-3 w-3 text-primary" />{COPY.benefits.offline[l]}</span>
          <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" />{COPY.benefits.fast[l]}</span>
        </div>

        <div className="mt-3">
          <Button size="sm" className="w-full h-9 gap-1.5 font-semibold" onClick={handleInstall}>
            <Download className="h-3.5 w-3.5" />
            {ios ? COPY.iosCta[l] : COPY.cta[l]}
          </Button>
        </div>

        {showIosSheet && (
          <div className="mt-3 rounded-xl bg-background/70 border border-border/50 p-3 text-xs text-foreground/90 leading-relaxed">
            {COPY.iosHint[l]}
          </div>
        )}
      </div>
    </div>
  );
}
