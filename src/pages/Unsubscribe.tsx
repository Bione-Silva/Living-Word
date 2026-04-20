import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = 'validating' | 'valid' | 'already' | 'invalid' | 'submitting' | 'success' | 'error';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
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
        {state === 'validating' && <><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /><p className="text-muted-foreground">Validando…</p></>}
        {state === 'valid' && <>
          <p className="text-foreground">Tem certeza que deseja parar de receber e-mails da Living Word?</p>
          <Button onClick={confirm} className="w-full">Confirmar descadastro</Button>
        </>}
        {state === 'submitting' && <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />}
        {state === 'success' && <><CheckCircle2 className="w-12 h-12 mx-auto text-primary" /><p className="text-foreground">Pronto. Você não receberá mais nossos e-mails.</p></>}
        {state === 'already' && <><CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground" /><p className="text-muted-foreground">Você já está descadastrado.</p></>}
        {state === 'invalid' && <><AlertCircle className="w-12 h-12 mx-auto text-destructive" /><p className="text-muted-foreground">Link inválido ou expirado.</p></>}
        {state === 'error' && <><AlertCircle className="w-12 h-12 mx-auto text-destructive" /><p className="text-muted-foreground">Algo deu errado. Tente novamente.</p></>}
      </Card>
    </div>
  );
}
