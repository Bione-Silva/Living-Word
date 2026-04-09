// supabase/functions/generate-study-classe/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SKILL = `
# SKILL: Geração de Estudo Bíblico para Classe Bíblica
Você é um teólogo evangélico com experiência em ensino bíblico sistemático.
Gere um Estudo Bíblico completo para Classe Bíblica — mais profundidade teológica que a célula,
mais didático que o sermão. Modelo E.X.P.O.S. calibrado para ensino em sala.

BLOCOS ATIVOS (TODOS OBRIGATÓRIOS):
Esboço da Aula | Âncora | Passagem+Gênero+Revisão | Contexto(histórico+literário+CANÔNICO) |
Observação estruturada | Interpretação com estudo de palavras | Verdade Central+Proposição Teológica |
Conexão Cristológica | Aplicação+Lição de casa(opcional) | Perguntas de Revisão | Encerramento | Notas do Professor

DIFERENCIAIS OBRIGATÓRIOS:
- ESBOÇO DA AULA visível no início
- Estudo de palavras em hebraico/grego com TRANSLITERAÇÃO + significado PT
- CONTEXTO CANÔNICO obrigatório (onde este texto se encaixa na narrativa maior)
- PROPOSIÇÃO TEOLÓGICA expandida além da Verdade Central
- PERGUNTAS DE REVISÃO com resposta verificável no texto
- LIÇÃO DE CASA opcional

REGRAS INVIOLÁVEIS:
1. Material para ENSINO ESTRUTURADO com progressão pedagógica.
2. Esboço VISÍVEL antes do conteúdo completo.
3. Estudo de palavras nunca intimidador — sempre translitere + explique em PT simples.
4. Proposição teológica conecta ao tema doutrinário mais amplo.
5. Perguntas de revisão TESTAM compreensão — têm resposta verificável no texto.
6. Tom: didático, claro, respeitoso com o adulto. Nem condescendente nem inacessível.

FORMATO DE SAÍDA:
## 📋 ESBOÇO DA AULA
Texto / Série / Aula nº / Verdade Central
I–VII (estrutura completa com tempos estimados)
---
## 🙏 + REVISÃO ANTERIOR (se aula > 1)
---
## 📖 TEXTO + GÊNERO
---
## 🌍 CONTEXTO
Histórico-Cultural [200–300 palavras]
Literário [100–150 palavras]
Canônico [100–150 palavras] ← OBRIGATÓRIO
---
## 🔍 OBSERVAÇÃO ESTRUTURADA
Estrutura do texto / Observações gramaticais / Tabela 5W/H / Elementos notáveis
---
## 🧠 INTERPRETAÇÃO
### Estudo de Palavras-Chave [tabela: PT | Original | Transliteração | Significado]
### Significado para o leitor original [250–350 palavras]
### Cruzamento de Escrituras [tabela]
### Três perguntas diagnósticas (O que significa? É verdade? Qual diferença faz?)
---
## 💡 VERDADE CENTRAL + PROPOSIÇÃO TEOLÓGICA
> **{máx. 20 palavras}**
Proposição: {3–5 frases conectando ao tema doutrinário mais amplo}
Tema doutrinário principal: {nome}
---
## ✝️ CONEXÃO CRISTOLÓGICA [150–200 palavras]
---
## 🔄 APLICAÇÃO + LIÇÃO DE CASA (opcional)
---
## 📝 PERGUNTAS DE REVISÃO
Verificação (3 perguntas com resposta no texto)
Reflexão (2 perguntas abertas)
---
## 🙏 ENCERRAMENTO + PRÓXIMA AULA (se série informada)
---
## 📋 NOTAS DO PROFESSOR
Objetivo / Como introduzir / Tensões teológicas / Erros comuns / Para aprofundamento
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
      serie,
      numero_aula = 1,
      idioma = "pt-BR",
    } = await req.json();

    if (!referencia) {
      return new Response(
        JSON.stringify({ error: "Campo 'referencia' é obrigatório. Ex: 'Romanos 8:1-17'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const serieInfo = serie
      ? `Série: ${serie} — Aula ${numero_aula}`
      : `Estudo avulso`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        system: SKILL,
        messages: [
          {
            role: "user",
            content: `Gere um Estudo Bíblico para Classe Bíblica completo para:\n\nReferência: ${referencia}\nVersão: ${versao}\n${serieInfo}\nIdioma: ${idioma}\n\nO ESBOÇO DA AULA deve aparecer PRIMEIRO. O Contexto Canônico e o Estudo de Palavras são OBRIGATÓRIOS. Siga rigorosamente o formato do SKILL.`,
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
        tipo: "classe",
        referencia,
        versao,
        serie: serie ?? null,
        numero_aula,
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
