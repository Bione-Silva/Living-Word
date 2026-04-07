import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TOPUP_CREDITS, TOPUP_PRICE_USD, TOPUP_PRICE_BRL } from '@/lib/plans';
import { formatPrice } from '@/utils/geoPricing';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: {
    PT: `Recarga Imediata: +${TOPUP_CREDITS.toLocaleString('pt-BR')} Créditos`,
    EN: `Instant Top-Up: +${TOPUP_CREDITS.toLocaleString()} Credits`,
    ES: `Recarga Inmediata: +${TOPUP_CREDITS.toLocaleString()} Créditos`,
  } as Record<L, string>,
  subtitle: {
    PT: 'Avulso, sem renovação. Seu pacote socorro.',
    EN: 'One-time, no subscription. Your emergency pack.',
    ES: 'Único, sin renovación. Tu paquete de emergencia.',
  } as Record<L, string>,
};

export function CreditTopUpButton() {
  const { lang } = useLanguage();
  const { pricing } = useGeoRegion();
  const [loading, setLoading] = useState(false);
  const l = lang as L;

  const isBRL = pricing?.currency === 'BRL';
  const price = isBRL ? TOPUP_PRICE_BRL : TOPUP_PRICE_USD;
  const symbol = isBRL ? 'R$' : '$';
  const currency = isBRL ? 'BRL' : 'USD';

  const handleTopUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: isBRL ? pricing?.addon?.id : pricing?.addon?.id,
          successUrl: `${window.location.origin}/dashboard?topup_success=true`,
          cancelUrl: `${window.location.origin}/upgrade`,
          mode: 'payment', // one-time
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast({
        title: lang === 'PT' ? 'Erro' : 'Error',
        description: lang === 'PT' ? 'Não foi possível processar a recarga.' : 'Could not process top-up.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Zap className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{labels.title[l]}</p>
          <p className="text-[10px] text-muted-foreground">{labels.subtitle[l]}</p>
        </div>
      </div>
      <Button
        onClick={handleTopUp}
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Zap className="h-4 w-4" />
            {formatPrice(price, symbol, currency)}
          </>
        )}
      </Button>
    </div>
  );
}
