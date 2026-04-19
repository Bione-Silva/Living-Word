import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Smartphone, Download, Apple, Monitor, Share2, Plus, Check } from 'lucide-react';
import { trackInstallEvent } from '@/lib/pwa-analytics';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: {
    PT: 'Instale o Living Word no seu dispositivo',
    EN: 'Install Living Word on your device',
    ES: 'Instala Living Word en tu dispositivo',
  },
  subtitle: {
    PT: 'Acesso rápido e experiência completa — celular, Mac e Windows.',
    EN: 'Quick access and full experience — phone, Mac and Windows.',
    ES: 'Acceso rápido y experiencia completa — móvil, Mac y Windows.',
  },
  cta: { PT: 'Instalar agora', EN: 'Install now', ES: 'Instalar ahora' },
  howTo: { PT: 'Como instalar', EN: 'How to install', ES: 'Cómo instalar' },
  installed: {
    PT: 'App instalado ✓',
    EN: 'App installed ✓',
    ES: 'App instalada ✓',
  },
  installedSub: {
    PT: 'Você está usando a versão instalada do Living Word.',
    EN: 'You are using the installed version of Living Word.',
    ES: 'Estás usando la versión instalada de Living Word.',
  },
  modalTitle: {
    PT: 'Instale o Living Word',
    EN: 'Install Living Word',
    ES: 'Instala Living Word',
  },
  modalDesc: {
    PT: 'Siga as instruções para o seu dispositivo:',
    EN: 'Follow the instructions for your device:',
    ES: 'Sigue las instrucciones para tu dispositivo:',
  },
  ios: { PT: 'iPhone / iPad', EN: 'iPhone / iPad', ES: 'iPhone / iPad' },
  iosStep: {
    PT: 'Toque em Compartilhar (▢↑) na barra do Safari → "Adicionar à Tela de Início" → Adicionar.',
    EN: 'Tap Share (▢↑) in Safari → "Add to Home Screen" → Add.',
    ES: 'Toca Compartir (▢↑) en Safari → "Añadir a pantalla de inicio" → Añadir.',
  },
  android: { PT: 'Android', EN: 'Android', ES: 'Android' },
  androidStep: {
    PT: 'Use o botão "Instalar agora" acima ou abra o menu (⋮) do Chrome → "Instalar app".',
    EN: 'Use the "Install now" button above or open Chrome menu (⋮) → "Install app".',
    ES: 'Usa el botón "Instalar ahora" arriba o abre el menú (⋮) de Chrome → "Instalar app".',
  },
  desktop: { PT: 'Mac / Windows', EN: 'Mac / Windows', ES: 'Mac / Windows' },
  desktopStep: {
    PT: 'No Chrome ou Edge, clique no ícone de instalação (⊕) na barra de endereço.',
    EN: 'In Chrome or Edge, click the install icon (⊕) in the address bar.',
    ES: 'En Chrome o Edge, haz clic en el ícono de instalar (⊕) en la barra de direcciones.',
  },
} as const;

export function InstallAppCard() {
  const { lang } = useLanguage();
  const l = lang as L;
  const { isInstallable, install } = usePWAInstall();
  const isStandalone = useIsStandalone();
  const [open, setOpen] = useState(false);

  // Já instalado: mostrar confirmação discreta.
  if (isStandalone) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Check className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{COPY.installed[l]}</p>
          <p className="text-xs text-muted-foreground truncate">{COPY.installedSub[l]}</p>
        </div>
      </div>
    );
  }

  const handlePrimary = async () => {
    void trackInstallEvent('clicked');
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) setOpen(true);
    } else {
      // Sem prompt nativo (iOS, Safari, iframe do preview, navegador não suportado):
      // abrir modal com instruções por plataforma.
      setOpen(true);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                {COPY.title[l]}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">
                {COPY.subtitle[l]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:ml-3">
            <Button size="sm" className="h-9 gap-1.5" onClick={handlePrimary}>
              <Download className="h-3.5 w-3.5" />
              {COPY.cta[l]}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 text-xs"
              onClick={() => setOpen(true)}
            >
              {COPY.howTo[l]}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{COPY.modalTitle[l]}</DialogTitle>
            <DialogDescription>{COPY.modalDesc[l]}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <PlatformBlock
              icon={<Apple className="h-4 w-4" />}
              title={COPY.ios[l]}
              steps={COPY.iosStep[l]}
              hint={
                <span className="inline-flex items-center gap-1">
                  <Share2 className="h-3 w-3" /> + <Plus className="h-3 w-3" />
                </span>
              }
            />
            <PlatformBlock
              icon={<Smartphone className="h-4 w-4" />}
              title={COPY.android[l]}
              steps={COPY.androidStep[l]}
            />
            <PlatformBlock
              icon={<Monitor className="h-4 w-4" />}
              title={COPY.desktop[l]}
              steps={COPY.desktopStep[l]}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlatformBlock({
  icon,
  title,
  steps,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  steps: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{steps}</p>
    </div>
  );
}
