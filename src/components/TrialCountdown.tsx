import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function TrialCountdown() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!profile) return null;

  // Paid users don't see trial
  if (profile.plan !== 'free') return null;

  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  if (!trialEnd) return null;

  const diffMs = trialEnd.getTime() - now.getTime();
  const isExpired = diffMs <= 0;
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  const labels = {
    PT: {
      trial: 'Período de Trial',
      expired: 'Trial Expirado',
      daysLeft: `${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`,
      hoursLeft: `e ${hoursLeft}h`,
      expiredMsg: 'Seu período de teste acabou. Faça upgrade para continuar usando todas as funcionalidades.',
      activeMsg: 'Aproveite ao máximo sua experiência gratuita!',
      upgrade: 'Fazer Upgrade',
    },
    EN: {
      trial: 'Trial Period',
      expired: 'Trial Expired',
      daysLeft: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`,
      hoursLeft: `and ${hoursLeft}h`,
      expiredMsg: 'Your trial has ended. Upgrade to keep using all features.',
      activeMsg: 'Make the most of your free experience!',
      upgrade: 'Upgrade Now',
    },
    ES: {
      trial: 'Período de Prueba',
      expired: 'Prueba Expirada',
      daysLeft: `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`,
      hoursLeft: `y ${hoursLeft}h`,
      expiredMsg: 'Tu período de prueba ha terminado. Actualiza para seguir usando todas las funciones.',
      activeMsg: '¡Aprovecha al máximo tu experiencia gratuita!',
      upgrade: 'Actualizar',
    },
  };

  const t = labels[lang] || labels.PT;

  if (isExpired) {
    return (
      <div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-destructive text-sm sm:text-base">{t.expired}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">{t.expiredMsg}</p>
        </div>
        <Link to="/upgrade" className="w-full sm:w-auto">
          <Button size="sm" className="gap-1.5 w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-md">
            <Crown className="h-3.5 w-3.5" />
            {t.upgrade}
          </Button>
        </Link>
      </div>
    );
  }

  const urgency = daysLeft <= 2;

  return (
    <div className={`rounded-xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm ${
      urgency 
        ? 'border-destructive/50 bg-gradient-to-r from-destructive/10 to-destructive/5' 
        : 'border-primary/30 bg-gradient-to-r from-primary/8 to-primary/4'
    }`}>
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
        urgency ? 'bg-destructive/15' : 'bg-primary/15'
      }`}>
        <Sparkles className={`h-5 w-5 sm:h-6 sm:w-6 ${urgency ? 'text-destructive animate-pulse' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-sm sm:text-base ${urgency ? 'text-destructive' : 'text-foreground'}`}>
          {t.trial} — {t.daysLeft} {daysLeft <= 1 ? t.hoursLeft : ''}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">{t.activeMsg}</p>
      </div>
      <Link to="/upgrade" className="w-full sm:w-auto">
        <Button size="sm" className={`gap-1.5 w-full sm:w-auto font-bold shadow-md ${
          urgency 
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}>
          <Crown className="h-3.5 w-3.5" />
          {t.upgrade}
        </Button>
      </Link>
    </div>
  );
}
