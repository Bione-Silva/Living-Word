import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import loginBg from '@/assets/login-bg.jpg';

const PURPLE_THEME = {
  '--primary': '263 70% 50%',
  '--primary-foreground': '0 0% 100%',
  '--ring': '263 70% 50%',
} as React.CSSProperties;

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Senha atualizada!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="theme-app min-h-screen relative flex items-center justify-center p-4"
      style={{
        ...PURPLE_THEME,
        backgroundColor: '#F1ECFA',
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(245, 243, 255, 0.92)',
        }}
      />
      <Card className="relative z-10 w-full max-w-md border-border bg-card text-card-foreground shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-center" style={{ color: 'hsl(263 70% 35%)' }}>Nova senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {false && (
              <Alert>
                <AlertDescription>
                  A tela de recuperação está pronta, mas a troca real de senha será ativada quando o backend estiver configurado.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background border-border" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? '...' : 'Atualizar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
