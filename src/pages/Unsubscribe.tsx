import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = 'validating' | 'valid' | 'already' | 'invalid' | 'submitting' | 'success' | 'error';
type Lang = 'PT' | 'EN' | 'ES';

const COPY: Record<Lang, {
  validating: string;
  question: string;
  confirmBtn: string;
  success: string;
  already: string;
  invalid: string;
  errorMsg: string;
}> = {
  PT: {
    validating: 'Validando…',
    question: 'Tem certeza que deseja parar de receber e-mails da Living Word?',
    confirmBtn: 'Confirmar descadastro',
    success: 'Pronto. Você não receberá mais nossos e-mails.',
    already: 'Você já está descadastrado.',
    invalid: 'Link inválido ou expirado.',
    errorMsg: 'Algo deu errado. Tente novamente.',
  },
  EN: {
    validating: 'Validating…',
    question: 'Are you sure you want to stop receiving emails from Living Word?',
    confirmBtn: 'Confirm unsubscribe',
    success: "Done. You won't receive our emails anymore.",
    already: 'You are already unsubscribed.',
    invalid: 'Invalid or expired link.',
    errorMsg: 'Something went wrong. Please try again.',
  },
  ES: {
    validating: 'Validando…',
    question: '¿Está seguro de que desea dejar de recibir correos de Living Word?',
    confirmBtn: 'Confirmar baja',
    success: 'Listo. Ya no recibirá nuestros correos.',
    already: 'Ya está dado de baja.',
    invalid: 'Enlace inválido o caducado.',
    errorMsg: 'Algo salió mal. Inténtelo de nuevo.',
  },
};

function detectLang(qsLang: string | null): Lang {
  const v = (qsLang || '').toUpperCase();
  if (v === 'PT' || v === 'EN' || v === 'ES') return v as Lang;
  const nav = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
  if (nav.startsWith('es')) return 'ES';
  if (nav.startsWith('en')) return 'EN';
  return 'PT';
}

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const lang = useMemo(() => detectLang(params.get('lang')), [params]);
  const t = COPY[lang];
  const [state, setState] = useState<State>('validating');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON },
        });
        const data = await r.json();
        if (data.valid) setState('valid');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch { setState('invalid'); }
    })();
  }, [token]);

  const confirm = async () => {
    setState('submitting');
    const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
    if (error || !data?.success) setState('error');
    else setState('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Living Word</h1>
        {state === 'validating' && <><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /><p className="text-muted-foreground">{t.validating}</p></>}
        {state === 'valid' && <>
          <p className="text-foreground">{t.question}</p>
          <Button onClick={confirm} className="w-full">{t.confirmBtn}</Button>
        </>}
        {state === 'submitting' && <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />}
        {state === 'success' && <><CheckCircle2 className="w-12 h-12 mx-auto text-primary" /><p className="text-foreground">{t.success}</p></>}
        {state === 'already' && <><CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground" /><p className="text-muted-foreground">{t.already}</p></>}
        {state === 'invalid' && <><AlertCircle className="w-12 h-12 mx-auto text-destructive" /><p className="text-muted-foreground">{t.invalid}</p></>}
        {state === 'error' && <><AlertCircle className="w-12 h-12 mx-auto text-destructive" /><p className="text-muted-foreground">{t.errorMsg}</p></>}
      </Card>
    </div>
  );
}
