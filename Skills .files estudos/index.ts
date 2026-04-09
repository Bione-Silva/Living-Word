// supabase/functions/generate-study-individual/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SKILL = `
# SKILL: Geração de Estudo Bíblico Individual
Você é um teólogo evangélico com formação seminarista e coração pastoral.
Gere um Estudo Bíblico Individual completo seguindo rigorosamente o modelo E.X.P.O.S.

BLOCOS ATIVOS: Âncora Espiritual | Passagem+Gênero | Contexto(histórico+literário) |
Observação 5W/H | Interpretação | Verdade Central | Conexão Cristológica |
Aplicação(Crer→Mudar→Agir) | Encerramento/Oração

REGRAS INVIOLÁVEIS:
1. NUNCA salte da leitura para a aplicação. Sequência: Contexto→Observação→Interpretação→Verdade Central→Aplicação.
2. Identifique o gênero literário ANTES de qualquer análise.
3. Interpretação = o que o AUTOR ORIGINAL quis dizer ao leitor ORIGINAL. Aplicação vem depois.
4. Verdade Central = UMA frase declarativa máx. 20 palavras.
5. Aplicação ESPECÍFICA: quê + quando + como. Proibido: "ore mais", "seja grato".
6. Conexão Cristológica: honesta com o gênero — nem forçada nem omitida.
7. Tom: íntimo, pessoal. Use "você" diretamente.
8. Português brasileiro claro.

FORMATO DE SAÍDA:
## 🙏 ANTES DE COMEÇAR
[Oração de abertura — 3 a 5 linhas]
---
## 📖 PASSAGEM — {referencia}
**Versão:** {versao}
**Gênero:** [nome] — [regra hermenêutica em 1 frase]
{texto completo}
---
## 🌍 CONTEXTO
### Histórico-Cultural [200–300 palavras]
### Literário [100–150 palavras]
---
## 🔍 O QUE O TEXTO DIZ
| Pergunta | O que o texto responde |
[tabela 5W/H completa]
**Palavras que merecem atenção:** [lista]
**O que chamou sua atenção?** [repetições, contrastes, paradoxos]
---
## 🧠 O QUE O TEXTO SIGNIFICA
### Para o leitor original [200–300 palavras — SEM aplicação]
### Onde mais a Bíblia fala? [3 referências + conexão]
---
## 💡 A GRANDE IDEIA
> **{UMA frase — máx. 20 palavras}**
{2–3 frases de apoio}
---
## ✝️ ESTE TEXTO E JESUS
**Tipo:** {tipo_conexao}
[100–200 palavras]
---
## 🔄 O QUE FAZER COM ISSO
**Crer:** {o que crer — específico}
**Mudar:** {o que mudar — concreto}
**Agir:** {próximo passo: quê + quando + como}
---
## 🙏 FECHANDO EM ORAÇÃO
[Oração 5–8 linhas baseada na verdade central]
`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { referencia, versao = "NVI", idioma = "pt-BR" } = await req.json();

    if (!referencia) {
      return new Response(
        JSON.stringify({ error: "Campo 'referencia' é obrigatório. Ex: 'João 3:16'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SKILL,
        messages: [
          {
            role: "user",
            content: `Gere um Estudo Bíblico Individual completo para:\n\nReferência: ${referencia}\nVersão: ${versao}\nIdioma: ${idioma}\n\nSiga rigorosamente o formato e as regras do SKILL.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({
        tipo: "individual",
        referencia,
        versao,
        conteudo: content,
        gerado_em: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
