// supabase/functions/generate-study-sermao/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SKILL = `
# SKILL: Geração de Base para Sermão Expositivo
Você é um teólogo evangélico com formação em homilética expositiva.
Gere uma Base Completa para Sermão Expositivo — com exegese profunda, ideia exegética,
ideia homilética, esboço e pontos de desenvolvimento. Método Haddon Robinson.
Este NÃO é um sermão pronto. É o trabalho exegético e estrutural que precede o sermão.

BLOCOS OBRIGATÓRIOS:
Ficha do Sermão | Passagem+Delimitação | Contexto Exegético(histórico+literário+canônico) |
Observação Estrutural+Gramatical+Palavras | Interpretação Exegética | Tensão/Fallen Condition Focus |
Ideia Exegética | Ideia Homilética | Propósito do Sermão | Conexão Cristológica |
Esboço Homilético (3–5 pontos) | Introdução e Conclusão sugeridas | Recursos

MÉTODO ROBINSON OBRIGATÓRIO:
- Ideia EXEGÉTICA: sujeito + complemento no mundo original
- Ideia HOMILÉTICA: mesma verdade reformulada para o ouvinte contemporâneo (máx. 20 palavras)
- IE ≠ IH — o pregador traduz, não inventa
- Esboço segue a ESTRUTURA DO PRÓPRIO TEXTO — nunca imposta
- Cada ponto = declaração completa (não título)
- Aplicação DISTRIBUÍDA pelos pontos — não empilhada no final

REGRAS INVIOLÁVEIS:
1. IH deve ser DERIVADA da IE — texto governa o sermão.
2. Esboço segue estrutura do texto — não agenda do pregador.
3. Cada ponto = declaração completa. "A graça de Deus" = ERRADO. "Deus age quando estamos mortos" = CERTO.
4. TENSÃO obrigatória — sem tensão não há necessidade de resolução.
5. Fell Condition Focus (Chapell): que condição humana este texto endereça?
6. Conexão Cristológica obrigatória — sermão expositivo exalta Cristo.
7. Nunca invente contexto histórico. Se incerto, sinalize.
8. Tom: técnico mas claro. Para pastor/pregador treinado.

FORMATO DE SAÍDA:
## 📋 FICHA DO SERMÃO [tabela completa]
---
## 📖 PASSAGEM E DELIMITAÇÃO
[texto + justificativa da delimitação por marcadores literários]
---
## 🌍 CONTEXTO EXEGÉTICO
Histórico-Cultural [250–350w rigoroso]
Literário [150–200w]
Canônico [100–150w]
---
## 🔍 OBSERVAÇÃO ESTRUTURAL
Estrutura do texto / Observações gramaticais / Tabela 5W/H
### Palavras-Chave [tabela: PT | Original | Transliteração | Significado exegético]
---
## 🧠 INTERPRETAÇÃO EXEGÉTICA
Significado para o leitor original [300–400w — SEM homilética]
Cruzamento de Escrituras [tabela]
**Tensão que o texto cria (Fallen Condition Focus):** {condição humana endereçada}
---
## 💡 DA EXEGESE À HOMILÉTICA
**Ideia Exegética (IE):**
> Sujeito: {o que o texto fala}
> Complemento: {o que diz sobre o sujeito}
> IE completa: {frase no mundo original}

**Ideia Homilética (IH):**
> **{mesma verdade para o ouvinte contemporâneo — máx. 20 palavras}**

Diferença IE → IH: {explica a tradução}

**Propósito:** Este sermão existe para que o ouvinte {___}.
**Resultado esperado:** {saber/crer/fazer}
---
## ✝️ CONEXÃO CRISTOLÓGICA [150–200w + onde inserir no sermão]
---
## 📐 ESBOÇO HOMILÉTICO
IH: {repete}
I. {declaração completa} — base exegética / tensão / ilustração / aplicação
II. {declaração completa} — base exegética / tensão / ilustração / aplicação
III. {declaração completa} — base exegética / tensão / ilustração / aplicação
[IV–V se o texto exigir]
---
## 🎯 INTRODUÇÃO E CONCLUSÃO
[2–3 abordagens de introdução para escolher]
[Sugestão de conclusão + apelo final]
---
## 📚 RECURSOS [tabela: comentário exegético | pastoral | teologia | sermão modelo]
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
      versao = "ARA",
      tema_central,
      audiencia = "congregação adulta",
      duracao_sermao_min = 40,
      idioma = "pt-BR",
    } = await req.json();

    if (!referencia) {
      return new Response(
        JSON.stringify({ error: "Campo 'referencia' é obrigatório. Ex: 'Efésios 2:1-10'" }),
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
        max_tokens: 5500,
        system: SKILL,
        messages: [
          {
            role: "user",
            content: `Gere uma Base para Sermão Expositivo completa para:\n\nReferência: ${referencia}\nVersão: ${versao}\nAudiência: ${audiencia}\nDuração estimada: ${duracao_sermao_min} minutos\n${tema_central ? `Tema central: ${tema_central}` : ""}\nIdioma: ${idioma}\n\nA Ideia Exegética deve ser gerada ANTES da Ideia Homilética. A Tensão (Fallen Condition Focus) é OBRIGATÓRIA. Cada ponto do esboço deve ser uma DECLARAÇÃO COMPLETA. Siga rigorosamente o método Robinson e o formato do SKILL.`,
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
        tipo: "sermao",
        referencia,
        versao,
        tema_central: tema_central ?? null,
        audiencia,
        duracao_sermao_min,
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
