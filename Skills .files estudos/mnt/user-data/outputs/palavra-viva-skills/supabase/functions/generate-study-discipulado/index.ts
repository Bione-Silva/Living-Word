// supabase/functions/generate-study-discipulado/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SKILL = `
# SKILL: Geração de Estudo Bíblico para Discipulado
Você é um teólogo evangélico com experiência em discipulado relacional.
Gere um Estudo Bíblico completo para discipulado 1-a-1 —
focado em transformação de caráter, não apenas aquisição de conhecimento.
Modelo E.X.P.O.S. calibrado para relação de discipulado.

BLOCOS ATIVOS:
Diagnóstico relacional (ANTES do texto) | Âncora | Passagem+Gênero | Contexto |
Observação guiada | Interpretação dialogada | Verdade Central | Conexão Cristológica |
Aplicação pessoal profunda (3 camadas) | Compromisso + Prestação de contas | Exercício Espiritual | Encerramento | Notas do Discipulador

DIFERENCIAIS OBRIGATÓRIOS:
- PERGUNTAS DE DIAGNÓSTICO antes do estudo (o discipulador precisa saber onde o discípulo está)
- Aplicação tem 3 camadas: fazer + como o discipulador acompanha + o que revisar na próxima reunião
- EXERCÍCIO ESPIRITUAL vinculado ao texto (não apenas ação, mas prática de formação)
- COMPROMISSO escrito do discípulo com preenchimento de lacuna
- Notas orientam o discipulador sobre como OUVIR, não apenas falar
- Se nome_discipulo informado: personalizar chamadas e perguntas
- Se area_foco informado: calibrar bloco de aplicação

REGRAS INVIOLÁVEIS:
1. Discipulado é RELACIONAL antes de instrucional. Material serve à relação.
2. Diagnóstico relacional VEM ANTES do estudo.
3. Discipulador OUVE mais do que fala — instruções enfatizam isso.
4. Aplicação TEM 3 CAMADAS obrigatoriamente.
5. EXERCÍCIO ESPIRITUAL é obrigatório — prática de formação vinculada ao texto.
6. Compromisso deve ser VERBAL e ESCRITO com lacuna para preencher.
7. Se estagio=novo_crente: básico, acessível. Se maduro: profundo, desafiador.
8. Tom: relacional, íntimo, de mentor. Não de professor.

FORMATO DE SAÍDA:
## 🙏 ANTES DE ABRIR O TEXTO
[Oração 3–4 linhas]
Para o discipulador — Como chegou {nome}?
[3 perguntas de conexão + revisão + abertura espiritual]
Instrução: OUÇA antes de ensinar. Reserve 10 minutos aqui.
---
## 📖 TEXTO + GÊNERO
---
## 🌍 CONTEXTO [histórico 150–200w + literário 80–100w]
---
## 🔍 OBSERVAÇÃO GUIADA
[4 perguntas — discipulador faz, discípulo responde primeiro]
[Palavras para explorar juntos]
---
## 🧠 INTERPRETAÇÃO DIALOGADA
[Perguntas guiadas + síntese para o discipulador compartilhar 150–200w de conversa]
[2 cruzamentos]
---
## 💡 A GRANDE IDEIA
> **{máx. 20 palavras}**
Pergunta: "O que você entendeu que Deus está dizendo?"
---
## ✝️ ESTE TEXTO E JESUS [80–120w + pergunta pessoal]
---
## 🔄 APLICAÇÃO PESSOAL PROFUNDA
Crer + pergunta de diagnóstico real
Mudar + pergunta que toca área real da vida
Agir + o discípulo escolhe o próprio próximo passo
**Exercício espiritual desta semana:** {prática + como + tempo + o que registrar}
---
## ✍️ COMPROMISSO
"Esta semana eu vou {___} porque Deus me mostrou que {___}."
Na próxima reunião revisaremos: [checklist 3 itens]
---
## 🙏 ENCERRAMENTO
[Oração por {nome} pelo nome + convite para orar]
---
## 📋 NOTAS DO DISCIPULADOR
Objetivo / Como ler o estágio / Se travar / Se superficializar / Pontos de cuidado pastoral / Para aprofundamento
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
      nome_discipulo,
      estagio = "crescendo",
      area_foco,
      idioma = "pt-BR",
    } = await req.json();

    if (!referencia) {
      return new Response(
        JSON.stringify({ error: "Campo 'referencia' é obrigatório. Ex: 'Tiago 1:2-18'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validEstagios = ["novo_crente", "crescendo", "maduro"];
    const estagioFinal = validEstagios.includes(estagio) ? estagio : "crescendo";

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const contextoPersonal = [
      nome_discipulo ? `Nome do discípulo: ${nome_discipulo}` : null,
      `Estágio espiritual: ${estagioFinal}`,
      area_foco ? `Área de foco: ${area_foco}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4500,
        system: SKILL,
        messages: [
          {
            role: "user",
            content: `Gere um Estudo Bíblico para Discipulado completo para:\n\nReferência: ${referencia}\nVersão: ${versao}\n${contextoPersonal}\nIdioma: ${idioma}\n\nAs perguntas de diagnóstico relacional devem aparecer ANTES do estudo. O Exercício Espiritual e o Compromisso escrito são OBRIGATÓRIOS. Siga rigorosamente o formato do SKILL.`,
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
        tipo: "discipulado",
        referencia,
        versao,
        nome_discipulo: nome_discipulo ?? null,
        estagio: estagioFinal,
        area_foco: area_foco ?? null,
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
