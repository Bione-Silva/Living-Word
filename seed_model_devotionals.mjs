import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)


// 10 devocionais-modelo originais — padrão de qualidade Living Word
const MODEL_DEVOTIONALS = [
  {
    title: 'Quando o coração está sobrecarregado',
    category: 'Cansaço emocional',
    anchor_verse: 'Mateus 11:28 (NVI)',
    anchor_verse_text: 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.',
    body_text: `Há cansaços que não aparecem no rosto, mas pesam por dentro. Às vezes, você continua funcionando, respondendo mensagens, cumprindo tarefas e sorrindo quando precisa, mas a alma está exausta. É como se o coração tivesse chegado no limite, mesmo quando o corpo ainda insiste em continuar.

Jesus conhece esse tipo de peso. Por isso, Ele não faz um convite para os fortes, mas para os cansados. Ele não exige que você se recomponha antes de se aproximar. Ele chama você exatamente no estado em que está. O descanso que Cristo oferece não é apenas uma pausa física; é alívio para a alma, silêncio para a mente e abrigo para o coração.

Talvez hoje você não precise de mais força para suportar sozinho. Talvez precise apenas parar e voltar ao lugar seguro: a presença de Jesus. O mundo manda você aguentar. Cristo manda você vir.`,
    today_action: 'Separe alguns minutos em silêncio e diga a Jesus, com sinceridade, o que mais tem pesado sua alma.',
    reflection_question: 'O que você tem carregado sozinho que precisava ter entregado a Jesus?',
    closing_prayer: 'Senhor Jesus, eu estou cansado e preciso do Teu descanso. Recebe meu peso, acalma meu coração e renova minhas forças. Amém.',
    supplementary_reading: 'Salmo 23; Isaías 40:29-31',
    scheduled_date: '2026-04-01',
  },
  {
    title: 'Deus não se atrasa',
    category: 'Espera em Deus',
    anchor_verse: 'Habacuque 2:3 (ARA)',
    anchor_verse_text: 'Porque a visão ainda está para cumprir-se no tempo determinado, mas se apressa para o fim e não falhará; se tardar, espera-o, porque, certamente, virá, não tardará.',
    body_text: `Uma das partes mais difíceis da fé é esperar sem ver. Quando algo demora, a alma começa a criar perguntas: "Será que Deus me ouviu?" "Será que perdi o tempo?" "Será que ficou tarde demais?" A demora mexe com a confiança, porque nós gostamos de respostas rápidas. Mas Deus trabalha em tempos diferentes dos nossos.

Habacuque nos lembra que aquilo que Deus prometeu tem tempo determinado. Isso significa que o céu não vive em atraso, mesmo quando nossa agenda parece parada. O que para nós parece demora pode ser preparo. O que parece silêncio pode ser alinhamento. O que parece ausência pode ser cuidado invisível.

Nem tudo que é rápido vem de Deus, e nem tudo que é lento está fora da vontade dEle. Às vezes, a espera é o lugar onde Ele amadurece nosso coração para receber o que pedimos.

Não corra na frente de Deus. O tempo certo ainda é um milagre.`,
    today_action: 'Entregue a Deus uma área em que você tem brigado com o tempo e diga: "Eu escolho confiar no Teu relógio."',
    reflection_question: 'Em qual área da sua vida você precisa aprender a descansar no tempo de Deus?',
    closing_prayer: 'Pai, eu te entrego minha ansiedade pelos prazos da vida. Ensina-me a esperar com fé, sem endurecer o coração. Amém.',
    supplementary_reading: 'Salmo 27:14; Eclesiastes 3:1',
    scheduled_date: '2026-04-02',
  },
  {
    title: 'Paz para a mente acelerada',
    category: 'Ansiedade',
    anchor_verse: 'Filipenses 4:6-7 (NVI)',
    anchor_verse_text: 'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.',
    body_text: `A ansiedade tem o poder de ocupar o coração antes mesmo que as coisas aconteçam. Ela antecipa dor, cria cenários, aumenta medos e rouba a paz do presente. A mente acelerada quer resolver hoje tudo o que pertence ao amanhã.

Mas a Palavra nos mostra outro caminho: transformar preocupação em oração. Paulo não diz que os problemas desaparecem automaticamente. Ele ensina que, quando levamos tudo a Deus, a paz do Senhor começa a guardar aquilo que está vulnerável em nós. E isso é profundo: Deus não promete apenas resposta; promete guarda.

Talvez hoje você ainda não tenha todas as soluções que gostaria, mas já pode receber a paz que precisa. A paz de Deus não nasce do controle; nasce da confiança. Quando você entrega em oração, o coração deixa de ser comandado pelo medo e passa a ser sustentado pela presença de Deus.`,
    today_action: 'Anote sua maior preocupação e transforme isso em uma oração objetiva.',
    reflection_question: 'O que você tem tentado controlar que deveria estar nas mãos de Deus?',
    closing_prayer: 'Senhor, minha mente está inquieta. Eu entrego a Ti meus medos e recebo, pela fé, a Tua paz sobre meu coração. Amém.',
    supplementary_reading: 'Mateus 6:25-34; Salmo 46:1-2',
    scheduled_date: '2026-04-03',
  },
  {
    title: 'Recomeçar não é fracassar',
    category: 'Recomeço',
    anchor_verse: 'Lamentações 3:22-23 (NVI)',
    anchor_verse_text: 'Graças ao grande amor do Senhor é que não somos consumidos, pois as suas misericórdias são inesgotáveis. Renovam-se cada manhã; grande é a tua fidelidade!',
    body_text: `Algumas pessoas têm dificuldade de recomeçar porque confundem novo começo com prova de fracasso. Mas, na verdade, recomeçar pode ser sinal de humildade, coragem e fé. Há momentos em que Deus não nos chama para fingir que está tudo bem. Ele nos chama para levantar e continuar com Ele.

Jeremias escreveu essas palavras em meio à dor, à ruína e ao lamento. Ainda assim, ele escolheu enxergar a fidelidade de Deus acima do cenário. Isso nos ensina que o recomeço não depende de circunstâncias perfeitas; depende da certeza de que a misericórdia do Senhor amanheceu mais uma vez.

Talvez você esteja precisando de um novo começo na fé, na família, na disciplina espiritual ou na maneira de enxergar a si mesmo. Não tenha medo de voltar para Deus. Ele não recebe você com reprovação fria, mas com misericórdia renovada.

Onde a culpa diz "acabou", a graça diz "vamos de novo".`,
    today_action: 'Defina uma área da sua vida onde você precisa recomeçar e dê um passo simples hoje.',
    reflection_question: 'O que a sua culpa tem impedido que a graça de Deus já liberou?',
    closing_prayer: 'Pai, obrigado porque Tua misericórdia se renova sobre mim. Dá-me coragem para recomeçar contigo, sem medo e sem vergonha. Amém.',
    supplementary_reading: 'Isaías 43:18-19; Filipenses 3:13-14',
    scheduled_date: '2026-04-04',
  },
  {
    title: 'O valor que você esqueceu',
    category: 'Identidade em Cristo',
    anchor_verse: '1 Pedro 2:9 (NVI)',
    anchor_verse_text: 'Vocês, porém, são geração eleita, sacerdócio real, nação santa, povo exclusivo de Deus…',
    body_text: `A comparação distorce a identidade. Quando você passa tempo demais olhando para a vida dos outros, começa a esquecer quem é. E quando esquece quem é em Deus, qualquer opinião ganha peso demais, qualquer rejeição machuca além do necessário e qualquer falha parece prova de que você vale menos.

Mas a Bíblia fala de você em outra linguagem. Em Cristo, você não é um acaso. Não é um resto. Não é alguém tentando ser notado por Deus. Você é povo exclusivo, chamado, separado e amado. Sua identidade não é construída pela comparação com os outros, mas pelo chamado de Deus sobre sua vida.

Isso não significa orgulho. Significa segurança. Quando sabemos quem somos no Senhor, deixamos de mendigar validação em lugares errados. O coração encontra firmeza, porque já não precisa viver girando em torno do olhar das pessoas.

Quem sabe quem é em Deus não vive perfeito, mas vive mais inteiro.`,
    today_action: 'Troque uma frase negativa sobre si mesmo por uma verdade bíblica.',
    reflection_question: 'De quem ou de quê você tem buscado validação que só Deus pode dar?',
    closing_prayer: 'Senhor, cura minha visão sobre mim mesmo. Ajuda-me a viver firmado no que Tu dizes, e não na comparação ou na rejeição. Amém.',
    supplementary_reading: 'Efésios 1:4-7; 2 Coríntios 5:17',
    scheduled_date: '2026-04-05',
  },
  {
    title: 'O perdão que liberta você',
    category: 'Perdão',
    anchor_verse: 'Colossenses 3:13 (NVI)',
    anchor_verse_text: 'Suportem-se uns aos outros e perdoem as queixas que tiverem uns contra os outros. Perdoem como o Senhor lhes perdoou.',
    body_text: `Perdoar não é fingir que a dor não existiu. Não é chamar injustiça de "coisa pequena". E também não é sentir tudo resolvido de uma vez. Perdoar é uma decisão espiritual de não deixar a ferida continuar governando sua vida.

Guardar ressentimento dá a sensação de proteção, mas na prática aprisiona o coração. A ofensa fica se repetindo por dentro, e aquilo que outra pessoa fez continua ocupando espaço demais na alma. O perdão não muda o passado, mas muda o poder que o passado tem sobre você.

Quando a Bíblia diz para perdoar como o Senhor nos perdoou, ela nos lembra que graça recebida também precisa se transformar em graça liberada. Isso não significa ausência de limites. Às vezes, você perdoa e ainda precisa de distância. Mas significa que você deixa Deus tratar a justiça enquanto seu coração deixa de carregar veneno.

O perdão é um milagre silencioso: primeiro ele cura por dentro.`,
    today_action: 'Ore o nome da pessoa que mais pesa no seu coração e entregue essa dor a Deus.',
    reflection_question: 'Qual ferida você ainda está deixando controlar seu coração por falta de perdão?',
    closing_prayer: 'Pai, eu não quero continuar prisioneiro dessa ferida. Cura meu coração e ensina-me a perdoar com a graça que recebi de Ti. Amém.',
    supplementary_reading: 'Mateus 6:14-15; Efésios 4:31-32',
    scheduled_date: '2026-04-06',
  },
  {
    title: 'Deus também está na rotina',
    category: 'Trabalho e propósito',
    anchor_verse: 'Colossenses 3:23 (ARA)',
    anchor_verse_text: 'Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens.',
    body_text: `Existe um perigo silencioso na rotina: achar que Deus só está presente nos momentos "mais espirituais". O culto parece sagrado. A oração parece sagrada. Mas o trabalho, os afazeres e a repetição do dia a dia acabam sendo vistos como simples obrigação. A Bíblia, porém, nos mostra outra realidade: até o comum pode ser vivido para o Senhor.

Quando Paulo diz para fazer tudo de coração como para Deus, ele está nos ensinando que o ordinário também pode ser altar. Isso muda a forma como enxergamos nossa rotina. A tarefa de hoje, o trabalho de hoje, o esforço de hoje podem ser expressão de fidelidade, integridade e adoração.

Talvez seu dia não pareça extraordinário. Mas Deus continua presente nele. O Reino também se manifesta em constância, responsabilidade e excelência quando ninguém está aplaudindo.

Não despreze os dias comuns. Muitas vezes, é neles que Deus forma os corações mais firmes.`,
    today_action: 'Consagre seu trabalho e sua rotina a Deus antes de começar o dia.',
    reflection_question: 'Que parte da sua rotina você ainda não entregou a Deus como oferta?',
    closing_prayer: 'Senhor, entrego a Ti o meu dia, meu trabalho e minhas responsabilidades. Dá-me um coração fiel em tudo o que eu fizer. Amém.',
    supplementary_reading: 'Provérbios 16:3; Eclesiastes 9:10',
    scheduled_date: '2026-04-07',
  },
  {
    title: 'A casa também precisa de paz',
    category: 'Família',
    anchor_verse: 'Josué 24:15 (NVI)',
    anchor_verse_text: 'Eu e a minha família serviremos ao Senhor.',
    body_text: `Família é um lugar de amor, mas também pode ser um lugar de desgaste, ruído e feridas. E, justamente por ser tão importante, é também uma área que o inimigo tenta atingir com frequência: comunicação quebrada, impaciência, distanciamento, mágoas acumuladas.

Quando Josué declara que ele e sua casa serviriam ao Senhor, isso não parece uma frase decorativa. Parece uma decisão. Há famílias que precisam de mais do que organização; precisam de direção espiritual. Precisam de alguém que diga: "Nós vamos colocar Deus no centro desta casa."

Às vezes, a paz no lar não começa com grandes mudanças, mas com pequenos atos de rendição: uma oração sincera, um pedido de perdão, uma palavra mais mansa, uma escolha de não responder no impulso. Deus gosta de visitar casas que se abrem para Ele.

Não espere a perfeição da sua família para buscar a presença de Deus nela. Comece com o coração disponível.`,
    today_action: 'Faça hoje um gesto concreto de reconciliação, honra ou oração dentro da sua casa.',
    reflection_question: 'Que decisão você precisa tomar para colocar Deus no centro do seu lar?',
    closing_prayer: 'Pai, visita minha casa e reina em meu lar. Traz cura, paz e direção para minha família. Em nome de Jesus, amém.',
    supplementary_reading: 'Salmo 128; Efésios 4:2-3',
    scheduled_date: '2026-04-08',
  },
  {
    title: 'Pureza em um mundo confuso',
    category: 'Juventude e pureza',
    anchor_verse: 'Salmo 119:9 (NVI)',
    anchor_verse_text: 'Como pode o jovem manter pura a sua conduta? Vivendo de acordo com a tua palavra.',
    body_text: `Vivemos em um tempo em que quase tudo empurra para a pressa, para o excesso e para a distração. A pureza parece antiga para alguns, exagerada para outros e impossível para muitos. Mas, na Bíblia, pureza não é uma prisão; é proteção do coração.

O salmista mostra que a pureza não nasce apenas da força de vontade, mas de uma vida alinhada à Palavra de Deus. Isso significa que a luta não é só contra comportamentos errados, mas a favor de um coração guardado, de uma mente renovada e de escolhas que honrem o Senhor.

Deus não chama você para uma vida vazia, mas para uma vida limpa. E o que o mundo trata como limitação, a graça transforma em liberdade. Pureza é lembrar que sua vida não precisa seguir o fluxo para ter valor. Em Deus, firmeza é mais bonita do que aprovação passageira.`,
    today_action: 'Estabeleça um limite claro em uma área que tem enfraquecido sua vida espiritual.',
    reflection_question: 'Que conteúdo, relação ou hábito você precisa deixar de lado para guardar seu coração?',
    closing_prayer: 'Senhor, guarda meu coração e renova minha mente. Ajuda-me a viver em pureza e fidelidade diante de Ti. Amém.',
    supplementary_reading: 'Romanos 12:2; 1 Timóteo 4:12',
    scheduled_date: '2026-04-09',
  },
  {
    title: 'Você pode terminar o dia em paz',
    category: 'Dormir em paz',
    anchor_verse: 'Salmo 4:8 (ARA)',
    anchor_verse_text: 'Em paz me deito e logo pego no sono, porque, Senhor, só tu me fazes repousar seguro.',
    body_text: `Quando a noite chega, muitas vezes os pensamentos aumentam. O dia termina, mas a mente continua trabalhando. E aquilo que parecia controlado durante a correria reaparece no silêncio do quarto. Há noites em que o corpo quer dormir, mas o coração ainda está em guerra.

O salmista nos ensina uma verdade preciosa: descanso verdadeiro não vem apenas do cansaço físico, mas da segurança em Deus. Dormir em paz é um ato de confiança. É dizer: "Senhor, eu fiz o que podia hoje. O restante continua em Tuas mãos."

Nem tudo será resolvido antes de você deitar. Nem toda resposta virá antes da noite. Mas a presença de Deus continua firme, mesmo quando o dia termina sem todas as soluções. Você pode descansar porque o Senhor não descansa no cuidado por você.

A noite não precisa ser governada pela preocupação. Ela pode ser entregue em paz.`,
    today_action: 'Antes de dormir, transforme sua maior preocupação em uma oração curta e entregue isso a Deus.',
    reflection_question: 'O que vous precisa conscientemente soltar antes de fechar os olhos esta noite?',
    closing_prayer: 'Pai, eu entrego a Ti meu coração, meus pensamentos e tudo o que me preocupa. Dá-me um sono de paz e segurança na Tua presença. Amém.',
    supplementary_reading: 'Salmo 121; Mateus 6:34',
    scheduled_date: '2026-04-10',
  },
]

async function seedModelDevotionals() {
  console.log('🌱 Semeando 10 devocionais-modelo no banco...\n')

  for (const d of MODEL_DEVOTIONALS) {
    // Verifica se já existe para essa data
    const { data: existing } = await supabase
      .from('devotionals')
      .select('id')
      .eq('scheduled_date', d.scheduled_date)
      .single()

    if (existing) {
      console.log(`⏭️  Já existe devocional em ${d.scheduled_date}: "${d.title}"`)
      continue
    }

    const { error } = await supabase
      .from('devotionals')
      .insert({
        title: d.title,
        category: d.category,
        scheduled_date: d.scheduled_date,
        anchor_verse: d.anchor_verse,
        anchor_verse_text: d.anchor_verse_text,
        body_text: d.body_text,
        today_action: d.today_action,
        reflection_question: d.reflection_question,
        closing_prayer: d.closing_prayer,
        supplementary_reading: d.supplementary_reading,
        tts_voice: 'nova',
        is_published: true,
      })

    if (error) {
      console.error(`❌ Erro ao inserir "${d.title}":`, error.message)
    } else {
      console.log(`✅ Inserido: "${d.title}" (${d.scheduled_date})`)
    }
  }

  console.log('\n🎉 Seeding dos devocionais-modelo concluído!')
}

seedModelDevotionals()
