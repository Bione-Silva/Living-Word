// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de convite inválido.');
      return;
    }

    if (!user) {
      setStatus('login_required');
      return;
    }

    acceptInvite();
  }, [token, user]);

  const acceptInvite = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-team-invite', {
        body: { token },
      });

      if (error || data?.error) {
        setStatus('error');
        setMessage(data?.error || 'Convite não encontrado ou já foi utilizado.');
        return;
      }

      setStatus('success');
      setMessage(`Convite aceito! Você agora tem acesso como "${data.role}".`);
    } catch {
      setStatus('error');
      setMessage('Erro ao aceitar convite.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-display">Convite de Equipe</CardTitle>
          <CardDescription>Living Word — Back-office</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}

          {status === 'login_required' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Você precisa estar logado para aceitar este convite.
              </p>
              <Button asChild>
                <Link to={`/login?redirect=/invite/${token}`}>Fazer Login</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Não tem conta? <Link to="/cadastro" className="text-primary underline">Crie uma aqui</Link>
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <p className="text-sm text-center">{message}</p>
              <Button onClick={() => navigate('/dashboard')}>Ir para o Dashboard</Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm text-center text-muted-foreground">{message}</p>
              <Button variant="outline" onClick={() => navigate('/')}>Voltar ao início</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
