import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

export function PWAInstallBanner() {
  const { isInstallable, install, dismiss } = usePWAInstall();
  const { t } = useLanguage();

  if (!isInstallable) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-xs">{t('pwa.install_title')}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t('pwa.install_desc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => void install()}>
            {t('pwa.install_cta')}
          </Button>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
