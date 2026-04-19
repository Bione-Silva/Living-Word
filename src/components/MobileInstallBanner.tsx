import { useEffect, useRef, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Bell, Download, Sparkles, X, Wifi } from 'lucide-react';
import { trackInstallEvent, type InstallVariant } from '@/lib/pwa-analytics';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  initial: {
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
  },
  soft: {
    title: {
      PT: 'Que tal levar o Living Word com você?',
      EN: 'Care to take Living Word with you?',
      ES: '¿Y si llevas Living Word contigo?',
    },
    desc: {
      PT: 'Quando estiver pronto, instalar leva poucos segundos — e sua Palavra do Dia chega ainda mais rápido.',
      EN: 'Whenever you’re ready, installing takes seconds — and your Daily Word arrives even faster.',
      ES: 'Cuando quieras, instalarlo toma segundos — y tu Palabra del Día llega aún más rápido.',
    },
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
const FIRST_VISIT_KEY = 'lw_first_visit_at';
const SUPPRESS_DAYS = 7;
const REENGAGE_AFTER_DAYS = 14; // re-show with softer copy after this many days
const SHOW_WINDOW_DAYS = 7; // initial banner only shows during first 7 days

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getOrSetFirstVisit(): number {
  try {
    const existing = localStorage.getItem(FIRST_VISIT_KEY);
    if (existing) return Number(existing);
    const now = Date.now();
    localStorage.setItem(FIRST_VISIT_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export function MobileInstallBanner() {
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();
  const { isInstallable, install, dismiss } = usePWAInstall();
  const { lang } = useLanguage();
  const l = lang as L;

  const [showIosSheet, setShowIosSheet] = useState(false);

  // Determine if banner is currently suppressed by a recent dismissal,
  // and which copy variant we should show ("initial" or "soft_reengagement").
  const { hidden: initiallyHidden, variant: initialVariant } = (() => {
    try {
      const ts = localStorage.getItem(STORAGE_KEY);
      if (!ts) return { hidden: false, variant: 'initial' as InstallVariant };
      const dismissedAt = Number(ts);
      const ageMs = Date.now() - dismissedAt;
      if (ageMs < SUPPRESS_DAYS * 24 * 60 * 60 * 1000) {
        return { hidden: true, variant: 'initial' as InstallVariant };
      }
      if (ageMs >= REENGAGE_AFTER_DAYS * 24 * 60 * 60 * 1000) {
        return { hidden: false, variant: 'soft_reengagement' as InstallVariant };
      }
      // Between SUPPRESS_DAYS and REENGAGE_AFTER_DAYS: stay quiet.
      return { hidden: true, variant: 'initial' as InstallVariant };
    } catch {
      return { hidden: false, variant: 'initial' as InstallVariant };
    }
  })();

  const [hidden, setHidden] = useState<boolean>(initiallyHidden);
  const [variant] = useState<InstallVariant>(initialVariant);

  // 7-day welcome window: only gates the INITIAL banner. Soft re-engagement
  // intentionally bypasses this so we can win back users who declined early on.
  const firstVisit = getOrSetFirstVisit();
  const withinWelcomeWindow = Date.now() - firstVisit < SHOW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const ios = isIos();
  const canShow =
    !isStandalone &&
    !hidden &&
    (isInstallable || (ios && isMobile)) &&
    (variant === 'soft_reengagement' || withinWelcomeWindow);

  // Fire "shown" once per mount when the banner becomes visible.
  const trackedShownRef = useRef(false);
  useEffect(() => {
    if (canShow && !trackedShownRef.current) {
      trackedShownRef.current = true;
      void trackInstallEvent('shown', variant);
    }
  }, [canShow, variant]);

  if (!canShow) return null;

  const copy = variant === 'soft_reengagement' ? COPY.soft : COPY.initial;

  const handleDismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    void trackInstallEvent('dismissed', variant);
    dismiss();
  };

  const handleInstall = async () => {
    void trackInstallEvent('clicked', variant);
    if (ios) {
      setShowIosSheet(true);
      return;
    }
    const accepted = await install();
    if (accepted) {
      void trackInstallEvent('installed', variant);
      handleDismiss();
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500"
      role="region"
      aria-label={copy.title[l]}
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
            <p className="text-sm font-semibold text-foreground leading-tight">{copy.title[l]}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{copy.desc[l]}</p>
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

