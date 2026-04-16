import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, Sparkles, Sun } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: {
    PT: 'Receba a Palavra todas as manhãs',
    EN: 'Receive the Word every morning',
    ES: 'Recibe la Palabra cada mañana',
  },
  desc: {
    PT: 'Permita que o Living Word te avise no celular ou computador às 6h, com o devocional do dia, versículo âncora e link direto para meditar.',
    EN: 'Let Living Word reach you on your phone or computer at 6am with today’s devotional, anchor verse and a direct link to meditate.',
    ES: 'Permite que Living Word te avise en tu celular o computador a las 6h, con el devocional del día, versículo ancla y un enlace directo para meditar.',
  },
  bullet1: {
    PT: 'Funciona no celular, Mac e Windows — sem app store.',
    EN: 'Works on phone, Mac and Windows — no app store needed.',
    ES: 'Funciona en celular, Mac y Windows — sin app store.',
  },
  bullet2: {
    PT: 'Você escolhe o horário e pode pausar quando quiser.',
    EN: 'You choose the time and can pause anytime.',
    ES: 'Tú eliges la hora y puedes pausar cuando quieras.',
  },
  bullet3: {
    PT: 'Nada de spam — só uma chamada gentil para meditar.',
    EN: 'No spam — just a gentle call to meditate.',
    ES: 'Sin spam — solo un llamado gentil a meditar.',
  },
  accept: {
    PT: 'Permitir notificações',
    EN: 'Allow notifications',
    ES: 'Permitir notificaciones',
  },
  later: { PT: 'Agora não', EN: 'Not now', ES: 'Ahora no' },
  success: { PT: 'Pronto! Você receberá a Palavra todas as manhãs.', EN: 'Done! You will receive the Word every morning.', ES: '¡Listo! Recibirás la Palabra cada mañana.' },
  denied: { PT: 'Permissão negada. Ative nas configurações do navegador.', EN: 'Permission denied. Enable in browser settings.', ES: 'Permiso denegado. Actívalo en los ajustes del navegador.' },
} as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubscribed?: () => void;
}

export function PushPermissionModal({ open, onOpenChange, onSubscribed }: Props) {
  const { lang } = useLanguage();
  const l = lang as L;
  const { subscribe, busy } = usePushNotifications();

  const handleAccept = async () => {
    const res = await subscribe();
    if (res.ok) {
      toast.success(COPY.success[l]);
      onSubscribed?.();
      onOpenChange(false);
    } else if (res.error === 'denied') {
      toast.error(COPY.denied[l]);
      onOpenChange(false);
    } else {
      toast.error(res.error || 'Error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2">
            <Bell className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">{COPY.title[l]}</DialogTitle>
          <DialogDescription className="text-center leading-relaxed pt-1">
            {COPY.desc[l]}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-2">
          <li className="flex items-start gap-2.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/80">{COPY.bullet1[l]}</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <Sun className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/80">{COPY.bullet2[l]}</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/80">{COPY.bullet3[l]}</span>
          </li>
        </ul>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleAccept} disabled={busy} className="w-full">
            {COPY.accept[l]}
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {COPY.later[l]}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
