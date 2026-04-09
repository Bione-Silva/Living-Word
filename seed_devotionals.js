#!/usr/bin/env node
/**
 * seed_devotionals.js
 * Gera e insere 30 devocionais iniciais no banco Supabase
 * usando GPT-4o-mini. Aproximadamente $0.015 para rodar.
 *
 * Uso: node seed_devotionals.js
 */

const SUPABASE_URL = 'https://priumwdestycikzfcysg.supabase.co'
const SUPABASE_SERVICE_KEY = 'cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw=='
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('❌ Defina a variável OPENAI_API_KEY antes de rodar o script.')
  console.error('   export OPENAI_API_KEY="sk-..."')
  process.exit(1)
}

const TOPICS = [
  // Semana 1
  'recomeço e propósito numa segunda-feira — nova semana, nova chance com Deus',
  'perseverança quando o caminho é longo e os resultados demoram',
  'fé quando os resultados ainda não apareceram — confiar no invisível',
  'amor, família e relacionamentos à luz do Evangelho',
  'gratidão — enxergar as bênçãos escondidas no cotidiano',
  'presença — estar de verdade com quem amamos, sem distrações',
  'adoração comunitária — o poder de estar junto com outros crentes',
  // Semana 2
  'identidade em Cristo — quem você é quando ninguém está olhando',
  'perdão — liberar o que nos prende no passado',
  'esperança — quando tudo parece estagnado, Deus ainda age',
  'provisão — confiar que Deus cuida mesmo nas finanças difíceis',
  'batalha espiritual — enfrentar os medos com fé',
  'descanso — aprender a parar sem culpa',
  'missão — a propósito maior que o seu próprio conforto',
  // Semana 3
  'cura — seja emocional, física ou relacional, Deus restaura',
  'humildade — o paradoxo do servo que se torna grande',
  'paciência — a virtude que transforma o tempo de espera',
  'comunidade — o valor de ter pessoas ao seu lado na jornada',
  'oração — conversar com Deus de forma real, não religiosa',
  'salvação — o que significa ser salvo na vida prática',
  'santidade — viver diferente num mundo barulhento',
  // Semana 4
  'generosidade — dar quando você sente que não tem o suficiente',
  'renovação — encontrar forças quando você está esgotado',
  'coragem — dar o próximo passo mesmo com medo',
  'alegria — a felicidade que o mundo não pode tirar',
  'fidelidade — ser confiável mesmo quando ninguém está vendo',
  'reconciliação — construir pontes onde havia muros',
  'chamado — descobrir para que você foi criado',
  'graça — receber o que você não merece com gratidão',
  'vitória — celebrar o que Deus já fez e ainda vai fazer',
]

const SYSTEM_PROMPT = `Você é um escritor pastoral cristão com 20 anos de experiência em devocionais diários para o público evangélico brasileiro.

Seu estilo é próximo, humano e profundo — como uma conversa íntima entre pai e filho, não uma aula teológica.

REGRAS OBRIGATÓRIAS:
1. Nunca comece com "Hoje", "Hoje vamos" ou similares
2. Use "você" diretamente  
3. A abertura deve criar curiosidade nos primeiros 2 parágrafos
4. O versículo âncora entra no MEIO do texto
5. A reflexão final é UMA pergunta — aberta, pessoal
6. A oração é conversa, não sermão — máx 4 linhas
7. COMPRIMENTO: 250-350 palavras no body_text

Responda EXCLUSIVAMENTE em JSON válido.`

async function generateDevotional(topic, date) {
  const userPrompt = `Escreva um devocional sobre: ${topic}

Retorne em JSON:
{
  "title": "título criativo (máx 8 palavras, sem ponto final)",
  "category": "Fé | Graça | Família | Propósito | Batalha | Cura | Identidade | Missão | Descanso | Gratidão",
  "anchor_verse": "Livro capítulo:versículo",
  "anchor_verse_text": "texto completo (NVI)",
  "body_text": "corpo (250-350 palavras)",
  "reflection_question": "1 pergunta aberta e pessoal",
  "closing_prayer": "oração conversacional (máx 4 linhas)"
}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw new Error(`OpenAI: ${await res.text()}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

async function insertDevotional(devotional, scheduledDate) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/devotionals`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      title: devotional.title,
      category: devotional.category,
      scheduled_date: scheduledDate,
      anchor_verse: devotional.anchor_verse,
      anchor_verse_text: devotional.anchor_verse_text,
      body_text: devotional.body_text,
      reflection_question: devotional.reflection_question,
      tts_voice: 'nova',
      is_published: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    if (err.includes('unique') || err.includes('duplicate')) {
      return { skipped: true }
    }
    throw new Error(`Supabase insert error: ${err}`)
  }
  return { success: true }
}

async function main() {
  console.log('🙏 Living Word — Seed de 30 Devocionais Iniciais')
  console.log('================================================')
  console.log(`📅 Iniciando de amanhã (${new Date().toLocaleDateString('pt-BR')})\n`)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 1) // começa de amanhã

  let success = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const topic = TOPICS[i]

    process.stdout.write(`[${i + 1}/30] ${dateStr} — Gerando "${topic.substring(0, 40)}..."`)

    try {
      const devotional = await generateDevotional(topic, dateStr)
      const result = await insertDevotional(devotional, dateStr)

      if (result.skipped) {
        console.log(' ⏭️  Já existe')
        skipped++
      } else {
        console.log(` ✅ "${devotional.title}"`)
        success++
      }

      // Pequena pausa para não estourar rate limit
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.log(` ❌ Erro: ${err.message}`)
      errors++
    }
  }

  console.log('\n================================================')
  console.log(`✅ Gerados com sucesso: ${success}`)
  console.log(`⏭️  Já existiam:        ${skipped}`)
  console.log(`❌ Erros:               ${errors}`)
  console.log('\n🎉 Seed completo! O Living Word tem conteúdo para os próximos 30 dias.')
  console.log('   Cron job generate-devotional-batch vai manter o pipeline automático a partir de agora.')
}

main().catch(console.error)
