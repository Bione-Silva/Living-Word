import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── 50 PROMPTS CAMPEÕES — Framework Living Word ─────────────────────────────
// Cada entrada é um prompt completo pronto para injetar no Gemini.
// Rotacionam pelo dia do ano (dayOfYear % 50) para nunca repetir no mesmo dia.
const CHAMPION_THEMES = [
  // 1
  { tema: 'Ansiedade', publico: 'igreja em geral', tom: 'consolo e confiança', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém com mente acelerada, excesso de preocupação e dificuldade de descansar em Deus.' },
  // 2
  { tema: 'Medo do futuro', publico: 'igreja em geral', tom: 'esperança e direção', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém inseguro com o amanhã.' },
  // 3
  { tema: 'Cansaço emocional', publico: 'igreja em geral', tom: 'renovo e descanso', versao: 'NVT',
    contexto: 'O texto deve falar com alguém exausto por dentro.' },
  // 4
  { tema: 'Recomeço', publico: 'igreja em geral', tom: 'esperança e restauração', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém que sente que falhou e precisa começar de novo.' },
  // 5
  { tema: 'Perdão', publico: 'igreja em geral', tom: 'cura e libertação', versao: 'ARA',
    contexto: 'O texto deve falar com alguém ferido e resistente a perdoar.' },
  // 6
  { tema: 'Paz em meio ao caos', publico: 'igreja em geral', tom: 'serenidade e fé', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém que vive em turbulência interna e busca equilíbrio espiritual.' },
  // 7
  { tema: 'Espera em Deus', publico: 'igreja em geral', tom: 'paciência e confiança', versao: 'NAA',
    contexto: 'O texto deve falar com alguém que está aguardando uma resposta ou promessa de Deus.' },
  // 8
  { tema: 'Propósito', publico: 'jovens e adultos', tom: 'direção e identidade', versao: 'NVT',
    contexto: 'O texto deve ajudar alguém que sente vazio e questiona para que veio ao mundo.' },
  // 9
  { tema: 'Identidade em Cristo', publico: 'jovens', tom: 'fortalecimento e segurança', versao: 'NVI',
    contexto: 'O texto deve ajudar jovens que sofrem com comparação e baixa autoestima.' },
  // 10
  { tema: 'Fé em tempos difíceis', publico: 'igreja em geral', tom: 'encorajamento', versao: 'ARA',
    contexto: 'O texto deve falar com alguém em crise, luta ou desânimo espiritual.' },
  // 11
  { tema: 'Deus no vale', publico: 'igreja em geral', tom: 'consolo e perseverança', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém que passa por sofrimento, dor ou fase sombria da vida.' },
  // 12
  { tema: 'Solidão', publico: 'igreja em geral', tom: 'acolhimento e presença de Deus', versao: 'NVT',
    contexto: 'O texto deve falar com alguém que sente abandono ou isolamento.' },
  // 13
  { tema: 'Cura interior', publico: 'igreja em geral', tom: 'restauração', versao: 'ARA',
    contexto: 'O texto deve alcançar alguém carregando traumas e memórias dolorosas.' },
  // 14
  { tema: 'Confiar no controle de Deus', publico: 'igreja em geral', tom: 'entrega e descanso', versao: 'NVI',
    contexto: 'O texto deve falar com alguém que tem necessidade de controlar tudo e dificuldade de soltar.' },
  // 15
  { tema: 'Dependência de Deus', publico: 'igreja em geral', tom: 'humildade e fé', versao: 'NAA',
    contexto: 'O texto deve falar com alguém autossuficiente que precisa reconhecer sua necessidade de Deus.' },
  // 16
  { tema: 'Silêncio de Deus', publico: 'igreja em geral', tom: 'espera e maturidade', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém que ora e não sente resposta visível de Deus.' },
  // 17
  { tema: 'Gratidão', publico: 'igreja em geral', tom: 'alegria e percepção espiritual', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém na ingratidão e comparação a enxergar as bênçãos já recebidas.' },
  // 18
  { tema: 'Santidade no cotidiano', publico: 'líderes e igreja em geral', tom: 'correção amorosa', versao: 'ARA',
    contexto: 'O texto deve falar com alguém de vida espiritual morna ou inconsistente no dia a dia.' },
  // 19
  { tema: 'Oração persistente', publico: 'igreja em geral', tom: 'perseverança', versao: 'NVT',
    contexto: 'O texto deve ajudar alguém desanimado na vida de oração.' },
  // 20
  { tema: 'Obediência', publico: 'igreja em geral', tom: 'direção e rendição', versao: 'NVI',
    contexto: 'O texto deve falar com alguém que resiste à vontade de Deus por medo ou orgulho.' },
  // 21
  { tema: 'Coragem', publico: 'jovens e adultos', tom: 'fortalecimento', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém paralisado pelo medo de agir ou dar o próximo passo.' },
  // 22
  { tema: 'Humildade', publico: 'igreja em geral', tom: 'quebrantamento e sabedoria', versao: 'NAA',
    contexto: 'O texto deve falar com alguém marcado pelo orgulho ou dureza de coração.' },
  // 23
  { tema: 'Paciência', publico: 'igreja em geral', tom: 'amadurecimento', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém impulsivo e com pressa que não consegue esperar.' },
  // 24
  { tema: 'Esperança após perdas', publico: 'igreja em geral', tom: 'consolo e reconstrução', versao: 'NVT',
    contexto: 'O texto deve falar com alguém em luto, ruptura ou decepção profunda.' },
  // 25
  { tema: 'Família', publico: 'pais e casais', tom: 'sabedoria e amor', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém que enfrenta conflitos familiares e desgaste nos vínculos.' },
  // 26
  { tema: 'Casamento', publico: 'casais', tom: 'aliança e restauração', versao: 'NVI',
    contexto: 'O texto deve falar com casais em desgaste relacional ou crise no relacionamento.' },
  // 27
  { tema: 'Filhos', publico: 'pais', tom: 'direção e dependência de Deus', versao: 'NVT',
    contexto: 'O texto deve ajudar pais com preocupação e desafios na criação dos filhos.' },
  // 28
  { tema: 'Juventude e pureza', publico: 'jovens', tom: 'identidade e firmeza', versao: 'NAA',
    contexto: 'O texto deve falar com jovens sobre tentações, identidade e pureza de vida.' },
  // 29
  { tema: 'Liderança serva', publico: 'líderes', tom: 'humildade e responsabilidade', versao: 'ARA',
    contexto: 'O texto deve ajudar líderes sobrecarregados com o peso de liderar e a tentação de servir por ego.' },
  // 30
  { tema: 'Crise financeira', publico: 'igreja em geral', tom: 'fé e provisão', versao: 'NVI',
    contexto: 'O texto deve falar com alguém com medo, escassez ou falta de provisão.' },
  // 31
  { tema: 'Trabalho e propósito', publico: 'adultos', tom: 'dignidade e direção', versao: 'NVT',
    contexto: 'O texto deve ajudar alguém com pressão profissional, falta de sentido no trabalho ou insatisfação.' },
  // 32
  { tema: 'Decisões difíceis', publico: 'igreja em geral', tom: 'discernimento e paz', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém em uma encruzilhada sem saber qual caminho tomar.' },
  // 33
  { tema: 'Comparação', publico: 'jovens e mulheres', tom: 'identidade e contentamento', versao: 'NVI',
    contexto: 'O texto deve falar com alguém que se sente inferior ao comparar sua vida com a dos outros.' },
  // 34
  { tema: 'Contentamento', publico: 'igreja em geral', tom: 'gratidão e maturidade', versao: 'NAA',
    contexto: 'O texto deve ajudar alguém em insatisfação constante que não consegue apreciar o presente.' },
  // 35
  { tema: 'Disciplina espiritual', publico: 'igreja em geral', tom: 'constância e crescimento', versao: 'ARA',
    contexto: 'O texto deve falar com alguém inconstante na fé, que começa e para na vida espiritual.' },
  // 36
  { tema: 'Perseverança', publico: 'igreja em geral', tom: 'fortaleza e esperança', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém com vontade de desistir diante das dificuldades.' },
  // 37
  { tema: 'Renovo espiritual', publico: 'igreja em geral', tom: 'avivamento e retorno', versao: 'NVT',
    contexto: 'O texto deve falar com alguém de fé fria e rotina espiritual seca.' },
  // 38
  { tema: 'Intimidade com Deus', publico: 'igreja em geral', tom: 'proximidade e amor', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém com vida espiritual superficial que deseja se aprofundar.' },
  // 39
  { tema: 'Justiça e misericórdia', publico: 'líderes e igreja em geral', tom: 'equilíbrio e compaixão', versao: 'NAA',
    contexto: 'O texto deve falar com alguém duro no trato com pessoas que falham ou precisam de graça.' },
  // 40
  { tema: 'Deus nas segundas-feiras', publico: 'adultos', tom: 'encorajamento para a rotina', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém com dificuldade de encontrar Deus na rotina pesada do trabalho.' },
  // 41
  { tema: 'Dormir em paz', publico: 'igreja em geral', tom: 'descanso e confiança', versao: 'NVT',
    contexto: 'O texto deve falar com alguém que sofre de insônia pela preocupação e não consegue descansar.' },
  // 42
  { tema: 'Manhã com Deus', publico: 'igreja em geral', tom: 'direção e alinhamento', versao: 'ARA',
    contexto: 'O texto deve ajudar alguém a começar o dia focado em Deus antes das tarefas do mundo.' },
  // 43
  { tema: 'Fim de ano e avaliação espiritual', publico: 'igreja em geral', tom: 'reflexão e recomeço', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém a fazer uma revisão honesta da vida espiritual no fim do ciclo.' },
  // 44
  { tema: 'Novo mês, nova esperança', publico: 'igreja em geral', tom: 'renovação e fé', versao: 'NAA',
    contexto: 'O texto deve ajudar alguém a receber um novo mês com fé e disposição espiritual.' },
  // 45
  { tema: 'Quando tudo parece atrasado', publico: 'jovens e adultos', tom: 'confiança no tempo de Deus', versao: 'NVT',
    contexto: 'O texto deve falar com alguém que sente que está atrasado nas conquistas da vida.' },
  // 46
  { tema: 'Amizades e influência', publico: 'jovens', tom: 'sabedoria e vigilância', versao: 'ARA',
    contexto: 'O texto deve ajudar jovens a avaliar as relações que os cercam e escolher bem suas amizades.' },
  // 47
  { tema: 'Culpa e graça', publico: 'igreja em geral', tom: 'libertação e restauração', versao: 'NVI',
    contexto: 'O texto deve falar com alguém preso na condenação interior e que precisa receber a graça.' },
  // 48
  { tema: 'Alegria no Senhor', publico: 'igreja em geral', tom: 'ânimo e celebração', versao: 'NVT',
    contexto: 'O texto deve ajudar alguém pesado e triste a recuperar a alegria que vem de Deus.' },
  // 49
  { tema: 'Servir com o coração certo', publico: 'líderes e voluntários da igreja', tom: 'correção amorosa e pureza de intenção', versao: 'ARA',
    contexto: 'O texto deve falar com alguém que serve na igreja mas perdeu a motivação correta.' },
  // 50
  { tema: 'O amor de Deus em dias comuns', publico: 'igreja em geral', tom: 'afeto, presença e simplicidade', versao: 'NVI',
    contexto: 'O texto deve ajudar alguém a perceber o amor de Deus nos momentos simples e rotineiros da vida.' },
]


// ─── PROMPT MESTRE — DEVOCIONAL DIÁRIO LIVING WORD ───────────────────────────
const SYSTEM_PROMPT = `Você é um redator cristão pastoral especializado em devocionais diários curtos, bíblicos, claros, acolhedores e altamente aplicáveis à vida real.

Sua missão é criar um devocional que ajude a pessoa a sentir que Deus falou com ela hoje de forma:
bíblica, simples, emocionalmente relevante, prática, pastoral, encorajadora e fiel às Escrituras.

OBJETIVO DO DEVOCIONAL:
1. Começar com uma dor, tensão, necessidade ou pergunta real da vida cotidiana
2. Conectar essa situação a uma verdade bíblica central
3. Trazer consolo, correção, esperança ou direção
4. Terminar com uma aplicação prática para o dia
5. Incluir uma oração curta
6. Ser agradável de ler em 1 a 2 minutos

REGRAS DE ESTILO:
- Linguagem simples, calorosa e pastoral (português brasileiro natural)
- Evitar tom acadêmico e jargão teológico pesado
- Evitar frases genéricas de autoajuda
- Não soar como texto robótico ou exagerar no floreio
- Ser profundo sem ser complicado
- Manter tom cristão evangélico equilibrado
- Sempre demonstrar respeito ao texto bíblico
- O texto deve ser inspirador, mas ancorado na Bíblia

ESTRUTURA INTERNA DO BODY_TEXT (120 a 220 palavras — nunca mais):
1. Abertura conectando com uma dor, sensação ou situação real do cotidiano
2. Explicação simples da verdade bíblica do versículo escolhido
3. Encorajamento, correção amorosa ou direção espiritual
4. Fechamento com uma frase forte e memorável

DIRETRIZES DE CONTEÚDO:
- O versículo precisa sustentar a mensagem — não inventar sentido para o texto
- Não usar versículos fora de contexto de forma irresponsável
- A aplicação deve ser realista para o cotidiano
- Falar com pessoas comuns: cansadas, ansiosas, feridas ou em busca de direção
- Conectar ao tema: fé, paz, identidade, esperança, perdão, propósito, recomeço, família, liderança, santidade ou perseverança

RESTRIÇÕES ABSOLUTAS:
- NÃO escrever sermão
- NÃO escrever estudo longo ou comentário técnico
- NÃO usar listas dentro do devocional
- NÃO fazer texto frio
- NÃO omitir a versão bíblica
- NÃO deixar sem aplicação prática

REGRA DE OURO: Se for longo, acadêmico, genérico ou abstrato — ele morre. Se for bíblico, curto, caloroso e prático — ele cresce.

───────────────────────────────────────────────────────────────
EXEMPLOS DE REFERÊNCIA (few-shot) — Este é o padrão de qualidade exigido:
───────────────────────────────────────────────────────────────

EXEMPLO 1 — Cansaço emocional
{
  "title": "Quando o coração está sobrecarregado",
  "anchor_verse": "Mateus 11:28 (NVI)",
  "anchor_verse_text": "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.",
  "body_text": "Há cansaços que não aparecem no rosto, mas pesam por dentro. Às vezes, você continua funcionando, respondendo mensagens, cumprindo tarefas e sorrindo quando precisa, mas a alma está exausta. É como se o coração tivesse chegado no limite, mesmo quando o corpo ainda insiste em continuar.\n\nJesus conhece esse tipo de peso. Por isso, Ele não faz um convite para os fortes, mas para os cansados. Ele não exige que você se recomponha antes de se aproximar. Ele chama você exatamente no estado em que está. O descanso que Cristo oferece não é apenas uma pausa física; é alívio para a alma, silêncio para a mente e abrigo para o coração.\n\nTalvez hoje você não precise de mais força para suportar sozinho. Talvez precise apenas parar e voltar ao lugar seguro: a presença de Jesus. O mundo manda você aguentar. Cristo manda você vir.",
  "today_action": "Aplicação de hoje: Separe alguns minutos em silêncio e diga a Jesus, com sinceridade, o que mais tem pesado sua alma.",
  "closing_prayer": "Oração: Senhor Jesus, eu estou cansado e preciso do Teu descanso. Recebe meu peso, acalma meu coração e renova minhas forças. Amém.",
  "supplementary_reading": "Leitura complementar: Salmo 23; Isaías 40:29-31"
}

EXEMPLO 2 — Ansiedade / Paz
{
  "title": "Paz para a mente acelerada",
  "anchor_verse": "Filipenses 4:6-7 (NVI)",
  "anchor_verse_text": "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.",
  "body_text": "A ansiedade tem o poder de ocupar o coração antes mesmo que as coisas aconteçam. Ela antecipa dor, cria cenários, aumenta medos e rouba a paz do presente. A mente acelerada quer resolver hoje tudo o que pertence ao amanhã.\n\nMas a Palavra nos mostra outro caminho: transformar preocupação em oração. Paulo não diz que os problemas desaparecem automaticamente. Ele ensina que, quando levamos tudo a Deus, a paz do Senhor começa a guardar aquilo que está vulnerável em nós. Deus não promete apenas resposta; promete guarda.\n\nTalvez hoje você ainda não tenha todas as soluções que gostaria, mas já pode receber a paz que precisa. A paz de Deus não nasce do controle; nasce da confiança. Quando você entrega em oração, o coração deixa de ser comandado pelo medo e passa a ser sustentado pela presença de Deus.",
  "today_action": "Aplicação de hoje: Anote sua maior preocupação e transforme isso em uma oração objetiva.",
  "closing_prayer": "Oração: Senhor, minha mente está inquieta. Eu entrego a Ti meus medos e recebo, pela fé, a Tua paz sobre meu coração. Amém.",
  "supplementary_reading": "Leitura complementar: Mateus 6:25-34; Salmo 46:1-2"
}

EXEMPLO 3 — Perdão
{
  "title": "O perdão que liberta você",
  "anchor_verse": "Colossenses 3:13 (NVI)",
  "anchor_verse_text": "Suportem-se uns aos outros e perdoem as queixas que tiverem uns contra os outros. Perdoem como o Senhor lhes perdoou.",
  "body_text": "Perdoar não é fingir que a dor não existiu. Não é chamar injustiça de 'coisa pequena'. E também não é sentir tudo resolvido de uma vez. Perdoar é uma decisão espiritual de não deixar a ferida continuar governando sua vida.\n\nGuardar ressentimento dá a sensação de proteção, mas na prática aprisiona o coração. A ofensa fica se repetindo por dentro, e aquilo que outra pessoa fez continua ocupando espaço demais na alma. O perdão não muda o passado, mas muda o poder que o passado tem sobre você.\n\nQuando a Bíblia diz para perdoar como o Senhor nos perdoou, ela nos lembra que graça recebida também precisa se transformar em graça liberada. Às vezes, você perdoa e ainda precisa de distância. Mas significa que você deixa Deus tratar a justiça enquanto seu coração deixa de carregar veneno.\n\nO perdão é um milagre silencioso: primeiro ele cura por dentro.",
  "today_action": "Aplicação de hoje: Ore o nome da pessoa que mais pesa no seu coração e entregue essa dor a Deus.",
  "closing_prayer": "Oração: Pai, eu não quero continuar prisioneiro dessa ferida. Cura meu coração e ensina-me a perdoar com a graça que recebi de Ti. Amém.",
  "supplementary_reading": "Leitura complementar: Mateus 6:14-15; Efésios 4:31-32"
}

───────────────────────────────────────────────────────────────
Esses 3 exemplos definem o padrão de qualidade. Reproduza exatamente esse nível de profundidade, calor e estrutura nos devocionais que você gerar.
───────────────────────────────────────────────────────────────

Responda EXCLUSIVAMENTE em JSON válido.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY não configurada')

    // Data de amanha
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const scheduledDate = tomorrow.toISOString().split('T')[0]

    // Check se ja existe
    const { data: existing } = await supabase
      .from('devotionals')
      .select('id')
      .eq('scheduled_date', scheduledDate)
      .single()
    if (existing) {
      return new Response(JSON.stringify({ success: true, message: 'Já existe' }), { headers: corsHeaders })
    }

    // Seleciona o tema do dia: rotaciona pelos 50 campeões usando o número do dia do ano
    const startOfYear = new Date(tomorrow.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((tomorrow.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
    const topic = CHAMPION_THEMES[dayOfYear % CHAMPION_THEMES.length]

    const userPrompt = `Crie um devocional diário completo seguindo o Prompt Mestre Living Word.

DADOS DE ENTRADA:
- Tema: ${topic.tema}
- Público-alvo: ${topic.publico}
- Tom desejado: ${topic.tom}
- Versão bíblica: ${topic.versao}
- Contexto: ${topic.contexto}

ESTRUTURA OBRIGATÓRIA DO JSON DE SAÍDA:
{
  "title": "titulo curto, humano e forte (max 6 palavras, parece conversa entre amigos)",
  "category": "${topic.tema}",
  "anchor_verse": "Livro capitulo:versiculo (${topic.versao})",
  "anchor_verse_text": "texto completo e fiel do versiculo na versao ${topic.versao}",
  "body_text": "reflexao de 120 a 220 palavras. Estrutura interna: 1) abertura com cena cotidiana real que conecta com a dor do leitor, 2) explicacao simples do versiculo, 3) encorrajamento correcao ou direcao espiritual, 4) frase de fechamento forte e memoravel",
  "today_action": "Aplicacao de hoje: uma acao pratica clara e especifica iniciando com verbo no imperativo",
  "reflection_question": "uma pergunta pessoal aberta que convida a reflexao interna",
  "closing_prayer": "Oracao: 2 a 4 linhas em tom de conversa com Deus, nao de cerimonia",
  "supplementary_reading": "Leitura complementar: 1 ou 2 referencias biblicas relacionadas",
  "image_prompt": "cinematic devotional photography, warm golden natural light, ${topic.tema} theme, spiritual contemplative atmosphere, no text, no faces"
}

Retorne EXCLUSIVAMENTE o JSON acima, sem markdown, sem explicacao do processo.`

    // 1. CHAMA O GEMINI PARA GERAR O TEXTO
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json' }
        }),
      }
    )
    if (!geminiResponse.ok) throw new Error(`Gemini erro: ${await geminiResponse.text()}`)
    
    const geminiData = await geminiResponse.json()
    const rawContent = geminiData.candidates[0].content.parts[0].text
    const devotional = JSON.parse(rawContent)

    // 2. GERAÇÃO DE ÁUDIO VIA GEMINI TTS (UNIFICADO)
    const audioUrls: Record<string, string | null> = { nova: null, alloy: null, onyx: null }

    /** Helper: Converte PCM 16-bit 24kHz para WAV */
    const pcmToWav = (pcmBuffer: Uint8Array) => {
      const sampleRate = 24000
      const numChannels = 1
      const bitsPerSample = 16
      const byteRate = sampleRate * numChannels * bitsPerSample / 8
      const blockAlign = numChannels * bitsPerSample / 8
      const dataSize = pcmBuffer.length
      const totalSize = 36 + dataSize
      const wav = new Uint8Array(44 + dataSize)
      const view = new DataView(wav.buffer)

      // RIFF header
      wav.set([82, 73, 70, 70], 0) // "RIFF"
      view.setUint32(4, totalSize, true)
      wav.set([87, 65, 86, 69], 8) // "WAVE"
      wav.set([102, 109, 116, 32], 12) // "fmt "
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, numChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, byteRate, true)
      view.setUint16(32, blockAlign, true)
      view.setUint16(34, bitsPerSample, true)
      wav.set([100, 97, 116, 97], 36) // "data"
      view.setUint32(40, dataSize, true)
      wav.set(pcmBuffer, 44)
      return wav
    }

    const voiceMap = [
      { key: 'nova', geminiVoice: 'Aoede' },
      { key: 'alloy', geminiVoice: 'Charon' },
      { key: 'onyx', geminiVoice: 'Fenrir' },
    ]

    const audioScript = `${devotional.title}. ${devotional.body_text}. Versículo do dia: ${devotional.anchor_verse_text}. Oração final: ${devotional.closing_prayer}`

    for (const { key, geminiVoice } of voiceMap) {
      try {
        console.log(`🎙️ Gerando áudio Gemini (voz: ${geminiVoice})...`)
        const ttsResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: audioScript }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } }
                }
              }
            })
          }
        )

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json()
          const b64Audio = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
          
          if (b64Audio) {
            const pcmBuffer = Uint8Array.from(atob(b64Audio), c => c.charCodeAt(0))
            const wavBuffer = pcmToWav(pcmBuffer)
            const audioFileName = `devocional_${scheduledDate}_${key}.wav`

            const { error: uploadError } = await supabase.storage
              .from('devotionals-audio')
              .upload(audioFileName, wavBuffer, { contentType: 'audio/wav', upsert: true })

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage.from('devotionals-audio').getPublicUrl(audioFileName)
              audioUrls[key] = publicUrlData.publicUrl
              console.log(`✅ Áudio Gemini ${key} pronto.`)
            }
          }
        } else {
          console.error(`❌ Erro Gemini TTS (${geminiVoice}):`, await ttsResponse.text())
        }
      } catch (err) {
        console.error(`⚠️ Falha ao gerar áudio Gemini ${key}:`, err)
      }
    }

    // 5. GERA IMAGEM DE CAPA VIA IMAGEN 3 (GEMINI API)
    let coverImageUrl = null
    try {
      const imagePrompt = devotional.image_prompt ||
        `Cinematic devotional scene representing: ${devotional.title}. Contemplative, warm light, spiritual atmosphere, no text.`

      const imgResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: imagePrompt }],
            parameters: { sampleCount: 1, aspectRatio: '16:9' }
          })
        }
      )

      if (imgResponse.ok) {
        const imgData = await imgResponse.json()
        const b64Image = imgData.predictions?.[0]?.bytesBase64Encoded
        if (b64Image) {
          const imgBuffer = Uint8Array.from(atob(b64Image), c => c.charCodeAt(0))
          const imgFileName = `devocional_${scheduledDate}.png`

          const { error: imgUploadError } = await supabase.storage
            .from('devotionals-images')
            .upload(imgFileName, imgBuffer, { contentType: 'image/png', upsert: true })

          if (!imgUploadError) {
            const { data: imgPublicUrl } = supabase.storage.from('devotionals-images').getPublicUrl(imgFileName)
            coverImageUrl = imgPublicUrl.publicUrl
          }
        }
      }
    } catch (imgErr: unknown) {
      console.warn('⚠️ Imagem de capa falhou:', imgErr)
    }

    // 6. SALVA NO DB TUDO PRONTO
    const { data: inserted, error: insertError } = await supabase
      .from('devotionals')
      .insert({
        title: devotional.title,
        category: devotional.category,
        scheduled_date: scheduledDate,
        anchor_verse: devotional.anchor_verse,
        anchor_verse_text: devotional.anchor_verse_text,
        body_text: devotional.body_text,
        reflection_question: devotional.reflection_question,
        closing_prayer: devotional.closing_prayer,
        tts_voice: 'nova',
        audio_url: audioUrls['nova'],
        audio_url_nova: audioUrls['nova'],
        audio_url_alloy: audioUrls['alloy'],
        audio_url_onyx: audioUrls['onyx'],
        cover_image_url: coverImageUrl,
        is_published: true,
      })
      .select()
      .single()

    if (insertError) throw insertError

    console.log(`✅ Devocional completo para ${scheduledDate}: Texto + 3 Áudios + Imagem`)
    return new Response(JSON.stringify({
      success: true,
      audio_nova: audioUrls['nova'],
      audio_alloy: audioUrls['alloy'],
      audio_onyx: audioUrls['onyx'],
      cover_image: coverImageUrl,
      title: devotional.title
    }), { headers: corsHeaders })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('generate-devotional-batch error:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
})
