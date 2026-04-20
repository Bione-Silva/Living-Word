import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { normalizePlan } from '@/lib/plan-normalization';
import { hasAccess } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'AutoFeed', EN: 'AutoFeed', ES: 'AutoFeed' },
  badge: { PT: 'Plano Pro', EN: 'Pro plan', ES: 'Plan Pro' },
  desc: {
    PT: 'Ao criar um sermão, gere automaticamente 1 carrossel de 5 slides + 1 citação curta como rascunho no Calendário.',
    EN: 'When you create a sermon, automatically generate 1 carousel of 5 slides + 1 short quote as drafts in the Calendar.',
    ES: 'Al crear un sermón, genera automáticamente 1 carrusel de 5 diapositivas + 1 cita corta como borradores en el Calendario.',
  },
  enabled: { PT: 'Ativado', EN: 'Enabled', ES: 'Activado' },
  disabled: { PT: 'Desativado', EN: 'Disabled', ES: 'Desactivado' },
  upgrade: { PT: 'Disponível no plano Pro', EN: 'Available on the Pro plan', ES: 'Disponible en el plan Pro' },
  upgradeCta: { PT: 'Fazer upgrade', EN: 'Upgrade', ES: 'Mejorar' },
  saved: { PT: 'Preferência salva', EN: 'Preference saved', ES: 'Preferencia guardada' },
  error: { PT: 'Erro ao salvar', EN: 'Error saving', ES: 'Error al guardar' },
} satisfies Record<string, Record<L, string>>;

export function AutoFeedSettingsCard() {
  const { user, profile, refreshProfile } = useAuth() as any;
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const t = (k: keyof typeof COPY) => COPY[k][lang];

  const userPlan = normalizePlan(profile?.plan);
  const canUse = hasAccess(userPlan, 'autofeed');
  const [enabled, setEnabled] = useState<boolean>(profile?.autofeed_enabled === true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(profile?.autofeed_enabled === true);
  }, [profile?.autofeed_enabled]);

  const toggle = async (next: boolean) => {
    if (!user || !canUse) return;
    setSaving(true);
    setEnabled(next);
    const { error } = await supabase
      .from('profiles')
      .update({ autofeed_enabled: next })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setEnabled(!next);
      toast.error(t('error'));
      return;
    }
    toast.success(t('saved'));
    refreshProfile?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('title')}
          <Badge variant="outline" className="text-[10px]">
            <Crown className="h-2.5 w-2.5 mr-1" />
            {t('badge')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{t('desc')}</p>
            {!canUse && (
              <Link
                to="/upgrade?feature=autofeed"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline"
              >
                <Crown className="h-3 w-3" />
                {t('upgrade')} — {t('upgradeCta')}
              </Link>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Switch checked={enabled && canUse} onCheckedChange={toggle} disabled={!canUse || saving} />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {enabled && canUse ? t('enabled') : t('disabled')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
