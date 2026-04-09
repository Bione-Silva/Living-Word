# 🚨 FIX CRÍTICO: Fluxo de Criação de Conta (Cadastro) Falhando

O fluxo de Onboarding/Cadastro da aplicação não está permitindo a criação de novas contas. Precisamos blindar o componente de Auth e expor os erros reais para diagnosticar o problema.

## 🎯 SOLUÇÃO OBRIGATÓRIA (Componente Auth / Supabase)

### 1. Intercepte e Exiba os Erros de Autenticação
No seu arquivo onde o Login/Cadastro é feito (provavelmente `Cadastro.tsx`, `Auth.tsx` ou `Index.tsx`), garanta que qualquer erro retornado pelo `supabase.auth.signUp` ou pelo componente `<Auth />` seja tratado e exibido em um `toast` na tela. 
Se você estiver usando o componente pronto da UI do Supabase (`@supabase/auth-ui-react`), verifique se o tema ou o redirecionamento não estão quebrando silenciosamente.

### 2. Verifique o Redirecionamento após o Auth
Muitas vezes a conta é criada no banco `auth.users`, mas o front-end não redireciona o usuário. 
Adicione um listener global ou no topo da página de login:
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Importante: preservar o parâmetro ?plan= se existir!
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan');
      
      if (plan) {
         navigate(`/upgrade?autoCheckout=${plan}`);
      } else {
         navigate('/dashboard');
      }
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

### 3. Tratamento para Email Confirmation (Verificação Silenciosa)
Se a conta não loga após o cadastro, é provável que o Supabase acuse o erro "Email não confirmado". 
Modifique a interface de Signup para mostrar claramente a mensagem: **"Conta criada! Verifique sua caixa de e-mail para confirmar o acesso."** caso o erro de login imediato seja de confirmação pendente.
