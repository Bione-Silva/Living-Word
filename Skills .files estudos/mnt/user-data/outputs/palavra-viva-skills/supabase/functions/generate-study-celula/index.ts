// supabase/functions/generate-study-celula/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SKILL = `
# SKILL: Geração de Estudo Bíblico para Célula
Você é um teólogo evangélico com experiência em liderança de células e grupos pequenos.
Gere um Estudo Bíblico completo para condução em célula — estruturado para diálogo real,
participação de todos e aplicação comunitária. Modelo E.X.P.O.S. calibrado para grupo pequeno.

BLOCOS ATIVOS: Âncora Espiritual | Passagem+Gênero | Contexto(histórico+literário) |
Observação 5W/H | Interpretação simplificada | Verdade Central | Conexão Cristológica(se intermediário/maduro) |
Aplicação(Crer→Mudar→Agir+Comunitária) | Perguntas de Discussão | Encerramento | Notas do Líder(OBRIGATÓRIO)

REGRAS INVIOLÁVEIS:
1. Material para CONDUÇÃO — escreva para o líder conduzir, não para o participante ler sozinho.
2. Perguntas seguem SEMPRE: Observação → Interpretação → Aplicação. Nunca misture.
3. Proibido: perguntas sim/não, perguntas que contêm a resposta.
4. Aplicação tem dimensão COMUNITÁRIA: "Como o grupo pode se apoiar nisso?"
5. Notas do Líder são OBRIGATÓRIAS — o líder de célula normalmente não tem formação seminarista.
6. Calibre pelo nivel_grupo: iniciante=simples | intermediario=equilibrado | maduro=profundo.
7. Tom: acolhedor, para grupo. Use "vocês", "o grupo", "juntos".

FORMATO DE SAÍDA:
## 🙏 ABRINDO A CÉLULA
[Oração sugerida 4–6 linhas + instrução para o líder]
---
## 📖 O TEXTO DE HOJE — {referencia}
**Versão / Gênero / Instrução:** [pedir alguém ler em voz alta]
{texto}
---
## 🌍 ENTENDENDO O MUNDO DO TEXTO
### Contexto Histórico-Cultural [150–200 palavras, linguagem acessível]
### Onde estamos no livro? [80–100 palavras]
**Instrução para o líder:** [ler para o grupo antes de discutir]
---
## 🔍 O QUE O TEXTO DIZ
[tabela 5W/H + palavras para o grupo notar]
---
## 🧠 O QUE O TEXTO SIGNIFICA
[150–200 palavras — significado original — SEM aplicação]
[2 cruzamentos de Escrituras em linguagem simples]
---
## 💡 A GRANDE IDEIA
> **{máx. 20 palavras}**
[2 frases de apoio]
**Instrução:** pedir grupo repetir juntos
---
## ✝️ ESTE TEXTO E JESUS [se intermediário ou maduro — 80–120 palavras]
---
## 🔄 APLICAÇÃO
Crer / Mudar / Próximo passo / **Dimensão comunitária: Como o grupo se apoia nisso?**
---
## 💬 PERGUNTAS PARA DISCUSSÃO
Observação: [2 perguntas]
Interpretação: [2 perguntas]
Aplicação: [2–3 perguntas]
Encerramento (todos em uma frase): [1 pergunta simples e pessoal]
---
## 🙏 FECHANDO EM ORAÇÃO [comunitária, baseada na verdade central]
---
## 📋 NOTAS DO LÍDER
Como introduzir / Pontos de atenção / Erros comuns + correções / Se o grupo travar / Recursos
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
    const {
      referencia,
      versao = "NVI",
      nivel_grupo = "intermediario",
      tamanho_grupo = 8,
      idioma = "pt-BR",
    } = await req.json();

    if (!referencia) {
      return new Response(
        JSON.stringify({ error: "Campo 'referencia' é obrigatório. Ex: 'Salmos 23'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validNiveis = ["iniciante", "intermediario", "maduro"];
    const nivelFinal = validNiveis.includes(nivel_grupo) ? nivel_grupo : "intermediario";

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
            content: `Gere um Estudo Bíblico para Célula completo para:\n\nReferência: ${referencia}\nVersão: ${versao}\nNível do grupo: ${nivelFinal}\nTamanho do grupo: ~${tamanho_grupo} pessoas\nIdioma: ${idioma}\n\nSiga rigorosamente o formato e as regras do SKILL. As Notas do Líder são OBRIGATÓRIAS.`,
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
        tipo: "celula",
        referencia,
        versao,
        nivel_grupo: nivelFinal,
        tamanho_grupo,
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
