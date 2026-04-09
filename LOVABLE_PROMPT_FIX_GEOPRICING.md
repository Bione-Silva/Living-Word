# 🚨 FIX CRÍTICO: Falha no Geo-Pricing (Fallback para BRL incorreto)

Lovable, nós temos um problema de arquitetura no frontend. A página está hospedada via SPA (Cloudflare Pages ou similar), e sua lógica atual de deteção de região (`geoPricing.ts`) está falhando ou presa em Real (R$) mesmo quando acessada dos Estados Unidos. Isso acontece porque você provavelmente está confiando apenas em `navigator.language` que pode estar em `pt-BR` no Mac de um usuário morando nos EUA.

## 🎯 SOLUÇÃO OBRIGATÓRIA (Crie ou reescreva o utilitário)
O frontend não consegue ler o header `CF-IPCountry` diretamente. Portanto, a **ÚNICA** forma garantida de descobrir o país no Client-Side é fazendo um fetch ligeiro numa API de IP ou analisando o Fuso Horário de forma estrita.

### 1. Reescreva o utilitário de GeoPricing
Você deve implementar a leitura pela API gratuita do `ipapi.co`, com fallback inteligente para o Fuso Horário (`Intl.DateTimeFormat().resolvedOptions().timeZone`).

```typescript
// Exemplo de implementação que você DEVE adaptar e incluir:
export type Region = 'BRL' | 'USD' | 'LATAM';

export async function detectUserRegion(): Promise<Region> {
  try {
    // Tentativa 1: API de IP (Bulletproof)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.country === 'BR') return 'BRL';
    
    const latamCountries = ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE'];
    if (latamCountries.includes(data.country)) return 'LATAM';
    
    return 'USD';
    
  } catch (err) {
    console.warn("ipapi falhou, usando fallback de Timezone", err);
    // Tentativa 2: Fuso Horário (Fallback local)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Sao_Paulo') || tz.includes('Fortaleza') || tz.includes('Bahia') || tz.includes('Manaus') || tz.includes('Rio_Branco') || tz.includes('Cuiaba')) {
      return 'BRL';
    }
    if (tz.includes('Buenos_Aires') || tz.includes('Santiago') || tz.includes('Bogota') || tz.includes('Lima') || tz.includes('Mexico_City')) {
      return 'LATAM';
    }
    return 'USD';
  }
}
```

### 2. Estado Global no React
Como o `fetch` é assíncrono, a sua página de Pricing e o componente Upgrade DEVEM ter um state (`[region, setRegion] = useState<Region>('USD')`) e um `useEffect` que resolve essa região quando a página carrega. Mostre um pequeno skeleton/loading no preço enquanto o `detectUserRegion()` não devolver a resposta.

### 3. Exibição Dinâmica (Atualização Imediata)
Quando a região for resolvida para `USD`, a página **TEM QUE EXIBIR** o `PRICING_MAP.USD` (ex: `$ 9.90` e não `R$ 19,00`). Garanta que não há nenhum cache persistido incorreto salvando a região velha.

Faça essa refatoração agora para eu testar o fluxo de venda nos EUA!
