import { useState } from 'react';
import { Smartphone, Download, X, Sparkles, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { usePWAInstall } from '@/hooks/usePWAInstall';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  eyebrow: { PT: 'EXCLUSIVO • APP', EN: 'EXCLUSIVE • APP', ES: 'EXCLUSIVO • APP' },
  title: {
    PT: 'Transforme a Palavra Viva em um App no seu celular',
    EN: 'Turn Living Word into an App on your phone',
    ES: 'Convierte Palabra Viva en una App en tu celular',
  },
  body: {
    PT: 'Acesso instantâneo no ícone da tela inicial, notificações do devocional diário e experiência fluida — sem abrir o navegador.',
    EN: 'Instant access from your home screen, daily devotional notifications, and a smoother experience — no browser needed.',
    ES: 'Acceso instantáneo desde la pantalla de inicio, notificaciones del devocional diario y experiencia fluida — sin abrir el navegador.',
  },
  install: { PT: 'Instalar agora', EN: 'Install now', ES: 'Instalar ahora' },
  iosTitle: { PT: 'Como instalar no iPhone', EN: 'How to install on iPhone', ES: 'Cómo instalar en iPhone' },
  iosStep1: {
    PT: 'Toque no botão Compartilhar',
    EN: 'Tap the Share button',
    ES: 'Toca el botón Compartir',
  },
  iosStep2: {
    PT: 'Escolha “Adicionar à Tela de Início”',
    EN: 'Choose “Add to Home Screen”',
    ES: 'Selecciona “Añadir a pantalla de inicio”',
  },
  later: { PT: 'Agora não', EN: 'Not now', ES: 'Ahora no' },
} as const;

const STORAGE_KEY = 'lw_install_card_dismissed';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function InstallAppCard() {
  const { lang } = useLanguage();
  const l = (lang || 'PT') as L;
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();
  const { isInstallable, install } = usePWAInstall();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Visibility rules: web mobile only, not installed, not previously dismissed.
  if (!isMobile || isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch { /* ignore */ }
  };

  const handleInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) handleDismiss();
      return;
    }
    if (isIOS()) {
      setShowIOSGuide((v) => !v);
      return;
    }
    // Other browsers without prompt support — show guide as fallback.
    setShowIOSGuide((v) => !v);
  };

  return (
    <section
      aria-label={COPY.title[l]}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]"
    >
      {/* decorative aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
      />

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={COPY.later[l]}
        className="absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex items-start gap-4">
        <div className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Smartphone className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-primary">
            <Sparkles className="h-3 w-3" />
            {COPY.eyebrow[l]}
          </p>
          <h3 className="mt-1.5 text-base font-semibold leading-tight text-foreground">
            {COPY.title[l]}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {COPY.body[l]}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <Button
          onClick={handleInstall}
          className="w-full h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
        >
          <Download className="h-4 w-4" />
          {COPY.install[l]}
        </Button>
      </div>

      {showIOSGuide && (
        <div className="relative mt-3 rounded-xl border border-border/60 bg-background/70 p-3 text-xs text-foreground">
          <p className="font-semibold mb-2">{COPY.iosTitle[l]}</p>
          <ol className="space-y-1.5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">1</span>
              <span className="flex items-center gap-1.5">
                {COPY.iosStep1[l]} <Share className="h-3.5 w-3.5 inline-block" />
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">2</span>
              <span>{COPY.iosStep2[l]}</span>
            </li>
          </ol>
        </div>
      )}
    </section>
  );
}
