import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import {
  Clock, Languages, Zap, Lock, FileText, Globe, Users, Mic,
  ChevronDown, Check, X as XIcon, Menu, X, BookOpen, PenTool,
  Share2, Layers, Shield, Sparkles
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const copy = {
  nav: {
    how: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
    features: { PT: 'Funcionalidades', EN: 'Features', ES: 'Funcionalidades' },
    plans: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
    cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
    login: { PT: 'Entrar', EN: 'Sign in', ES: 'Iniciar sesión' },
  },
  hero: {
    eyebrow: {
      PT: 'Sermões, devocionais e blogs cristãos · PT · EN · ES',
      EN: 'Sermons, devotionals & Christian blogs · PT · EN · ES',
      ES: 'Sermones, devocionales y blogs cristianos · PT · EN · ES',
    },
    h1_line1: {
      PT: 'A Palavra que você ensina no domingo',
      EN: 'The Word you teach on Sunday',
      ES: 'La Palabra que enseñas el domingo',
    },
    h1_em: {
      PT: 'precisa alcançar pessoas a semana inteira',
      EN: 'should reach people all week long',
      ES: 'necesita alcanzar personas toda la semana',
    },
    sub: {
      PT: 'Transforme sermões, estudos e mensagens em devocionais, artigos e blogs publicados automaticamente — com fidelidade bíblica, sua voz de ensino e alcance real em português, inglês e espanhol.',
      EN: 'Transform sermons, studies and messages into devotionals, articles and blogs published automatically — with biblical faithfulness, your teaching voice and real reach in Portuguese, English and Spanish.',
      ES: 'Transforma sermones, estudios y mensajes en devocionales, artículos y blogs publicados automáticamente — con fidelidad bíblica, tu voz de enseñanza y alcance real en portugués, inglés y español.',
    },
    cta1: { PT: 'Criar meu blog grátis →', EN: 'Create my free blog →', ES: 'Crear mi blog gratis →' },
    cta2: { PT: 'Ver como funciona', EN: 'See how it works', ES: 'Ver cómo funciona' },
    verse: {
      PT: '"A Palavra de Deus não está acorrentada." — 2 Timóteo 2:9',
      EN: '"God\'s word is not chained." — 2 Timothy 2:9',
      ES: '"La Palabra de Dios no está encadenada." — 2 Timoteo 2:9',
    },
  },
  badges: [
    { PT: 'Pastores', EN: 'Pastors', ES: 'Pastores' },
    { PT: 'Evangélicos', EN: 'Evangelicals', ES: 'Evangélicos' },
    { PT: 'Líderes', EN: 'Leaders', ES: 'Líderes' },
    { PT: 'Ministérios', EN: 'Ministries', ES: 'Ministerios' },
    { PT: 'Ensino bíblico', EN: 'Bible teaching', ES: 'Enseñanza bíblica' },
    { PT: 'Criadores cristãos', EN: 'Christian creators', ES: 'Creadores cristianos' },
  ],
  stats: [
    { num: '3', label: { PT: 'Idiomas nativos', EN: 'Native languages', ES: 'Idiomas nativos' } },
    { num: '7+', label: { PT: 'Formatos por geração', EN: 'Formats per generation', ES: 'Formatos por generación' } },
    { num: '60s', label: { PT: 'Do input ao blog publicado', EN: 'From input to published blog', ES: 'Del input al blog publicado' } },
    { num: '$0', label: { PT: 'Para começar', EN: 'To get started', ES: 'Para empezar' } },
  ],
  problem: {
    tag: { PT: 'O problema real', EN: 'The real problem', ES: 'El problema real' },
    h2: {
      PT: 'Você prepara horas. A mensagem morre no domingo.',
      EN: 'You prepare for hours. The message dies on Sunday.',
      ES: 'Preparas durante horas. El mensaje muere el domingo.',
    },
    sub: {
      PT: 'Cada sermão exigiu pesquisa, oração e dedicação. Mas ao terminar o culto, toda aquela riqueza desaparece. Seu povo precisa dela durante a semana — e você não tem tempo de transformar tudo em conteúdo escrito.',
      EN: 'Every sermon took research, prayer, and dedication. But when service ends, all that richness disappears. Your people need it during the week — and you don\'t have time to turn it all into written content.',
      ES: 'Cada sermón requirió investigación, oración y dedicación. Pero al terminar el culto, toda esa riqueza desaparece. Tu pueblo la necesita durante la semana — y no tienes tiempo para transformarla en contenido escrito.',
    },
    cards: [
      {
        icon: Clock,
        title: { PT: 'Sem tempo para escrever', EN: 'No time to write', ES: 'Sin tiempo para escribir' },
        desc: {
          PT: 'Pastor bivocacional trabalha a semana toda. No domingo prega. Não sobra tempo para blog, devocional ou artigos.',
          EN: 'Bivocational pastor works all week. Preaches Sunday. No time left for blog, devotional or articles.',
          ES: 'Pastor bivocacional trabaja toda la semana. El domingo predica. No le queda tiempo para blog o artículos.',
        },
      },
      {
        icon: Languages,
        title: { PT: 'Ensino bilíngue é desafio real', EN: 'Bilingual teaching is a real challenge', ES: 'La enseñanza bilingüe es un desafío real' },
        desc: {
          PT: 'Sua congregação fala português e inglês. O imigrante hispânico ao lado não tem nada em espanhol. Seu ensino precisa circular em três idiomas.',
          EN: 'Your congregation speaks Portuguese and English. The Hispanic immigrant next door has nothing in Spanish. Your teaching needs to circulate in three languages.',
          ES: 'Tu congregación habla portugués e inglés. El inmigrante hispano no tiene nada en español. Tu enseñanza necesita circular en tres idiomas.',
        },
      },
      {
        icon: Zap,
        title: { PT: 'IA genérica não serve para ensino', EN: 'Generic AI doesn\'t work for teaching', ES: 'La IA genérica no sirve para enseñanza' },
        desc: {
          PT: 'ChatGPT gera texto, não conteúdo cristão. Não conhece seu povo, sua doutrina, nem o contexto da sua congregação.',
          EN: 'ChatGPT generates text, not Christian content. It doesn\'t know your people, your doctrine, or your congregation\'s context.',
          ES: 'ChatGPT genera texto, no contenido cristiano. No conoce a tu pueblo, tu doctrina ni el contexto de tu congregación.',
        },
      },
      {
        icon: Lock,
        title: { PT: 'Sem site, sem presença digital', EN: 'No website, no digital presence', ES: 'Sin sitio, sin presencia digital' },
        desc: {
          PT: 'Você não tem WordPress nem sabe criar um. Seu ministério não aparece quando alguém busca no Google. Seu ensino não circula além do culto.',
          EN: 'You don\'t have WordPress and don\'t know how to set one up. Your ministry doesn\'t appear on Google. Your teaching doesn\'t circulate beyond the service.',
          ES: 'No tienes WordPress ni sabes crear uno. Tu ministerio no aparece en Google. Tu enseñanza no circula más allá del culto.',
        },
      },
    ],
  },
  how: {
    tag: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
    h2: {
      PT: 'Do seu ensino ao conteúdo publicado em 60 segundos.',
      EN: 'From your teaching to published content in 60 seconds.',
      ES: 'De tu enseñanza al contenido publicado en 60 segundos.',
    },
    steps: [
      {
        title: {
          PT: 'Comece com uma passagem, sermão, tema ou dor do seu povo',
          EN: 'Start with a passage, sermon, topic or your people\'s need',
          ES: 'Comienza con un pasaje, sermón, tema o necesidad de tu pueblo',
        },
        desc: {
          PT: 'Informe a passagem bíblica, o público da sua congregação e o tema do momento — solidão, propósito, família, identidade. Três campos. Sem formulário longo.',
          EN: 'Enter the Bible passage, your congregation\'s audience, and the pressing topic — loneliness, purpose, family, identity. Three fields. No long forms.',
          ES: 'Ingresa el pasaje bíblico, tu audiencia y el tema del momento — soledad, propósito, familia, identidad. Tres campos. Sin formularios largos.',
        },
        badge: {
          PT: 'João 15:1-8 · Jovens · Propósito de vida',
          EN: 'John 15:1-8 · Youth · Life purpose',
          ES: 'Juan 15:1-8 · Jóvenes · Propósito de vida',
        },
      },
      {
        title: {
          PT: 'A plataforma gera com fidelidade bíblica e sua voz',
          EN: 'The platform generates with biblical faithfulness and your voice',
          ES: 'La plataforma genera con fidelidad bíblica y tu voz',
        },
        desc: {
          PT: 'Escolha sua voz de ensino (expositivo, narrativo, acolhedor), sua versão bíblica e sua linha doutrinária. O conteúdo soa como você — não como template de IA.',
          EN: 'Choose your teaching voice (expository, narrative, welcoming), your Bible version and your doctrinal line. The content sounds like you — not like an AI template.',
          ES: 'Elige tu voz de enseñanza (expositivo, narrativo, acogedor), tu versión bíblica y tu línea doctrinal. El contenido suena como tú — no como plantilla de IA.',
        },
        badge: {
          PT: 'Guardrails teológicos · Fidelidade bíblica · Sua voz',
          EN: 'Theological guardrails · Biblical faithfulness · Your voice',
          ES: 'Guardrails teológicos · Fidelidad bíblica · Tu voz',
        },
      },
      {
        title: {
          PT: 'Devocional, artigo, blog, reels — tudo pronto para publicar',
          EN: 'Devotional, article, blog, reels — all ready to publish',
          ES: 'Devocional, artículo, blog, reels — todo listo para publicar',
        },
        desc: {
          PT: 'Sermão, esboço, devocional, pontos para Reels, versão bilíngue, adaptação para célula e artigo de blog — tudo gerado de uma vez. Publique no seu blog com um clique.',
          EN: 'Sermon, outline, devotional, Reels points, bilingual version, cell group adaptation, and blog article — all generated at once. Publish to your blog with one click.',
          ES: 'Sermón, bosquejo, devocional, puntos para Reels, versión bilingüe, adaptación para célula y artículo de blog — todo generado de una vez. Publica con un clic.',
        },
        badge: {
          PT: 'Blog publicado automaticamente · joao.livingword.app',
          EN: 'Blog published automatically · john.livingword.app',
          ES: 'Blog publicado automáticamente · juan.livingword.app',
        },
      },
    ],
  },
  features: {
    tag: { PT: 'O que está incluído', EN: 'What\'s included', ES: 'Qué está incluido' },
    h2: {
      PT: 'Ensine, escreva e publique a Palavra — com alcance real.',
      EN: 'Teach, write and publish the Word — with real reach.',
      ES: 'Enseña, escribe y publica la Palabra — con alcance real.',
    },
    items: [
      { icon: Layers, title: { PT: '7+ formatos em 1 geração', EN: '7+ formats in 1 generation', ES: '7+ formatos en 1 generación' }, desc: { PT: 'Sermão, esboço, devocional, reels, bilíngue, célula e artigo de blog. Tudo de uma vez, pronto para circular.', EN: 'Sermon, outline, devotional, reels, bilingual, cell group and blog article. All at once, ready to circulate.', ES: 'Sermón, bosquejo, devocional, reels, bilingüe, célula y artículo de blog. Todo de una vez, listo para circular.' } },
      { icon: Globe, title: { PT: 'Trilíngue nativo PT · EN · ES', EN: 'Native trilingual PT · EN · ES', ES: 'Trilingüe nativo PT · EN · ES' }, desc: { PT: 'Conteúdo gerado nativamente em cada idioma — não tradução automática. Ideal para o ecossistema evangélico global.', EN: 'Content generated natively in each language — not automatic translation. Ideal for the global evangelical ecosystem.', ES: 'Contenido generado nativamente en cada idioma — no traducción automática. Ideal para el ecosistema evangélico global.' }, unique: true },
      { icon: BookOpen, title: { PT: 'Blog devocional publicado automaticamente', EN: 'Devotional blog published automatically', ES: 'Blog devocional publicado automáticamente' }, desc: { PT: 'Seu subdomínio pessoal criado no cadastro. Artigos e devocionais publicados com seu nome, prontos para compartilhar.', EN: 'Your personal subdomain created at signup. Articles and devotionals published with your name, ready to share.', ES: 'Tu subdominio personal creado al registrarte. Artículos y devocionales publicados con tu nombre, listos para compartir.' } },
      { icon: Users, title: { PT: 'Contexto imigrante e global', EN: 'Immigrant & global context', ES: 'Contexto inmigrante y global' }, desc: { PT: '12 temas pré-configurados: saudade, documentos, família dividida, identidade bicultural e muito mais.', EN: '12 pre-configured themes: homesickness, documents, divided family, bicultural identity and more.', ES: '12 temas preconfigurados: nostalgia, documentos, familia dividida, identidad bicultural y más.' }, unique: true },
      { icon: Shield, title: { PT: 'Guardrails teológicos reais', EN: 'Real theological guardrails', ES: 'Guardrails teológicos reales' }, desc: { PT: 'Exegese antes de aplicação. Distinção entre texto, interpretação e aplicação. Alerta de eisegese integrado.', EN: 'Exegesis before application. Text, interpretation and application distinction. Built-in eisegesis alert.', ES: 'Exégesis antes de aplicación. Distinción entre texto, interpretación y aplicación. Alerta de eiségesis integrado.' } },
      { icon: Mic, title: { PT: 'Sua voz pastoral e de ensino', EN: 'Your pastoral & teaching voice', ES: 'Tu voz pastoral y de enseñanza' }, desc: { PT: 'Expositivo, narrativo, apologético, profético — o conteúdo soa como você ensina, não como template genérico.', EN: 'Expository, narrative, apologetic, prophetic — the content sounds like you teach, not like a generic template.', ES: 'Expositivo, narrativo, apologético, profético — el contenido suena como tú enseñas, no como plantilla genérica.' } },
    ],
  },
  vs: {
    h2: {
      PT: 'Outras ferramentas geram texto. Living Word gera conteúdo cristão publicado.',
      EN: 'Other tools generate text. Living Word generates published Christian content.',
      ES: 'Otras herramientas generan texto. Living Word genera contenido cristiano publicado.',
    },
    them: {
      PT: 'Ferramentas genéricas de IA',
      EN: 'Generic AI tools',
      ES: 'Herramientas genéricas de IA',
    },
    us: { PT: 'Living Word', EN: 'Living Word', ES: 'Living Word' },
    xItems: [
      { PT: 'Apenas inglês — PT e ES inexistentes', EN: 'English only — PT and ES non-existent', ES: 'Solo inglés — PT y ES inexistentes' },
      { PT: 'Sem contexto pastoral ou congregacional', EN: 'No pastoral or congregational context', ES: 'Sin contexto pastoral o congregacional' },
      { PT: 'Sem publicação — você copia e cola', EN: 'No publishing — you copy and paste', ES: 'Sin publicación — copias y pegas' },
      { PT: 'Sem fidelidade bíblica garantida', EN: 'No guaranteed biblical faithfulness', ES: 'Sin fidelidad bíblica garantizada' },
      { PT: 'Guardrails teológicos são só disclaimers', EN: 'Theological guardrails are just disclaimers', ES: 'Guardrails teológicos son solo disclaimers' },
      { PT: 'Gera texto, não conteúdo de ensino', EN: 'Generates text, not teaching content', ES: 'Genera texto, no contenido de enseñanza' },
    ],
    checkItems: [
      { PT: 'PT, EN, ES gerados nativamente', EN: 'PT, EN, ES generated natively', ES: 'PT, EN, ES generados nativamente' },
      { PT: 'Contexto imigrante e evangélico global', EN: 'Immigrant & global evangelical context', ES: 'Contexto inmigrante y evangélico global' },
      { PT: 'Blog e devocional publicados automaticamente', EN: 'Blog and devotional published automatically', ES: 'Blog y devocional publicados automáticamente' },
      { PT: '7+ formatos em 1 clique, 60 segundos', EN: '7+ formats in 1 click, 60 seconds', ES: '7+ formatos en 1 clic, 60 segundos' },
      { PT: 'Exegese real + alerta de eisegese', EN: 'Real exegesis + eisegesis alert', ES: 'Exégesis real + alerta de eiségesis' },
      { PT: 'Feito para o ecossistema evangélico global', EN: 'Made for the global evangelical ecosystem', ES: 'Hecho para el ecosistema evangélico global' },
    ],
  },
  testimonials: {
    tag: { PT: 'Quem usa', EN: 'Who uses it', ES: 'Quién lo usa' },
    h2: {
      PT: 'De pastores e líderes que ensinam toda semana.',
      EN: 'From pastors and leaders who teach every week.',
      ES: 'De pastores y líderes que enseñan cada semana.',
    },
    items: [
      {
        quote: {
          PT: '"Finalmente uma ferramenta que entende que minha congregação é brasileira em Atlanta. O conteúdo soa como eu prego, não como tradução do Google."',
          EN: '"Finally a tool that understands my congregation is Brazilian in Atlanta. The content sounds like I preach, not like Google Translate."',
          ES: '"Finalmente una herramienta que entiende que mi congregación es brasileña en Atlanta. El contenido suena como yo predico."',
        },
        name: 'Pr. João Silva', flag: '🇧🇷',
        role: { PT: 'Igreja Evangélica Brasileira · Atlanta, GA', EN: 'Brazilian Evangelical Church · Atlanta, GA', ES: 'Iglesia Evangélica Brasileña · Atlanta, GA' },
        initials: 'JS',
      },
      {
        quote: {
          PT: '"Mi congregación habla español e inglés. Ahora publico el devocional en los dos idiomas cada semana, con mi voz, en menos de un minuto."',
          EN: '"My congregation speaks Spanish and English. Now I publish the devotional in both languages every week, with my voice, in under a minute."',
          ES: '"Mi congregación habla español e inglés. Ahora publico el devocional en los dos idiomas cada semana, con mi voz, en menos de un minuto."',
        },
        name: 'Pastor Miguel Cruz', flag: '🇲🇽',
        role: { PT: 'Iglesia Evangélica Hispana · Los Angeles, CA', EN: 'Hispanic Evangelical Church · Los Angeles, CA', ES: 'Iglesia Evangélica Hispana · Los Angeles, CA' },
        initials: 'MC',
      },
      {
        quote: {
          PT: '"I was skeptical about AI for sermons. Living Word is different — it actually understands theology, not just generates text. The exegesis layer is real."',
          EN: '"I was skeptical about AI for sermons. Living Word is different — it actually understands theology, not just generates text. The exegesis layer is real."',
          ES: '"Era escéptico sobre la IA para sermones. Living Word es diferente — realmente entiende teología, no solo genera texto."',
        },
        name: 'Rev. Robert Johnson', flag: '🇺🇸',
        role: { PT: 'Baptist Church · Nashville, TN', EN: 'Baptist Church · Nashville, TN', ES: 'Iglesia Bautista · Nashville, TN' },
        initials: 'RJ',
      },
      {
        quote: {
          PT: '"Sou líder de célula, não pastor. Nunca teria tempo de preparar material assim. Agora cada semana chego com devocional, perguntas e reels prontos."',
          EN: '"I\'m a cell leader, not a pastor. I would never have time to prepare material like this. Now every week I arrive with devotional, questions and reels ready."',
          ES: '"Soy líder de célula, no pastor. Nunca tendría tiempo para preparar este material. Ahora cada semana llego con devocional y reels listos."',
        },
        name: 'Ana Cruz', flag: '🇧🇷',
        role: { PT: 'Líder de célula · Miami, FL', EN: 'Cell leader · Miami, FL', ES: 'Líder de célula · Miami, FL' },
        initials: 'AC',
      },
    ],
  },
  pricing: {
    tag: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
    h2: { PT: 'Comece grátis. Cresça quando precisar.', EN: 'Start free. Grow when you need to.', ES: 'Empieza gratis. Crece cuando necesites.' },
  },
  plans: [
    { name: 'Free', price: '$0', period: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' }, features: { PT: ['5 gerações/mês', 'Sermão + esboço', '1 artigo/mês', 'Blog no ar'], EN: ['5 generations/month', 'Sermon + outline', '1 article/month', 'Blog live'], ES: ['5 generaciones/mes', 'Sermón + bosquejo', '1 artículo/mes', 'Blog en línea'] }, cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' }, featured: false },
    { name: 'Pastoral', price: '$9', period: { PT: '/mês · 7 dias grátis', EN: '/month · 7 days free', ES: '/mes · 7 días gratis' }, features: { PT: ['40 gerações/mês', 'Todos os 7+ formatos', '20 artigos/mês', 'Sem watermark', 'Todas as vozes pastorais'], EN: ['40 generations/month', 'All 7+ formats', '20 articles/month', 'No watermark', 'All pastoral voices'], ES: ['40 generaciones/mes', 'Los 7+ formatos', '20 artículos/mes', 'Sin marca de agua', 'Todas las voces pastorales'] }, cta: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' }, featured: true },
    { name: 'Church', price: '$29', period: { PT: '/mês', EN: '/month', ES: '/mes' }, features: { PT: ['200 gerações/mês', 'Equipe (3 usuários)', '3 blogs conectados', 'Agendamento'], EN: ['200 generations/month', 'Team (3 users)', '3 connected blogs', 'Scheduling'], ES: ['200 generaciones/mes', 'Equipo (3 usuarios)', '3 blogs conectados', 'Agendamiento'] }, cta: { PT: 'Começar', EN: 'Get started', ES: 'Empezar' }, featured: false },
    { name: 'Ministry', price: '$79', period: { PT: '/mês', EN: '/month', ES: '/mes' }, features: { PT: ['500 gerações/mês', 'Equipe (10 usuários)', '10 blogs conectados', 'Analytics completo'], EN: ['500 generations/month', 'Team (10 users)', '10 connected blogs', 'Full analytics'], ES: ['500 generaciones/mes', 'Equipo (10 usuarios)', '10 blogs conectados', 'Analytics completo'] }, cta: { PT: 'Falar com equipe', EN: 'Contact team', ES: 'Contactar equipo' }, featured: false },
  ],
  faq: {
    tag: { PT: 'Perguntas frequentes', EN: 'FAQ', ES: 'Preguntas frecuentes' },
    h2: { PT: 'Respostas diretas.', EN: 'Straight answers.', ES: 'Respuestas directas.' },
    items: [
      {
        q: { PT: 'A IA substitui o pastor?', EN: 'Does AI replace the pastor?', ES: '¿La IA reemplaza al pastor?' },
        a: { PT: 'Não. O Living Word é um copiloto — como um comentário bíblico digital. Você ensina. A IA ajuda a preparar, escrever e publicar.', EN: 'No. Living Word is a copilot — like a digital Bible commentary. You teach. AI helps prepare, write and publish.', ES: 'No. Living Word es un copiloto — como un comentario bíblico digital. Tú enseñas. La IA ayuda a preparar, escribir y publicar.' },
      },
      {
        q: { PT: 'É feito para qual público?', EN: 'Who is it made for?', ES: '¿Para quién está hecho?' },
        a: { PT: 'Para pastores, líderes, ensinadores bíblicos e criadores de conteúdo do ecossistema evangélico global. Suporta diferentes tradições: batista, pentecostal, carismática, reformada e outras.', EN: 'For pastors, leaders, Bible teachers and content creators in the global evangelical ecosystem. Supports different traditions: Baptist, Pentecostal, charismatic, Reformed and others.', ES: 'Para pastores, líderes, enseñadores bíblicos y creadores de contenido del ecosistema evangélico global. Soporta diferentes tradiciones: bautista, pentecostal, carismática, reformada y otras.' },
      },
      {
        q: { PT: 'Posso usar mesmo sem equipe ou sem site?', EN: 'Can I use it without a team or a website?', ES: '¿Puedo usarlo sin equipo o sin sitio web?' },
        a: { PT: 'Sim! No cadastro seu blog (seu-nome.livingword.app) já está no ar. Não precisa de WordPress, designer ou equipe de mídia.', EN: 'Yes! At signup your blog (your-name.livingword.app) is already live. No need for WordPress, a designer or a media team.', ES: '¡Sí! Al registrarte tu blog (tu-nombre.livingword.app) ya está en línea. No necesitas WordPress, diseñador o equipo de medios.' },
      },
      {
        q: { PT: 'O que acontece no cadastro?', EN: 'What happens at signup?', ES: '¿Qué pasa al registrarse?' },
        a: { PT: 'Em menos de 2 minutos seu blog está no ar com artigos publicados com seu nome. Grátis, sem cartão de crédito.', EN: 'In less than 2 minutes your blog is live with articles published under your name. Free, no credit card.', ES: 'En menos de 2 minutos tu blog está en línea con artículos publicados con tu nombre. Gratis, sin tarjeta.' },
      },
      {
        q: { PT: 'Precisa de cartão para o trial de 7 dias?', EN: 'Do I need a card for the 7-day trial?', ES: '¿Necesito tarjeta para la prueba de 7 días?' },
        a: { PT: 'Não. Só solicitamos cartão no 8º dia se quiser continuar no plano Pastoral.', EN: 'No. We only ask for a card on day 8 if you want to continue on the Pastoral plan.', ES: 'No. Solo solicitamos tarjeta el día 8 si deseas continuar en el plan Pastoral.' },
      },
    ],
  },
  ctaFinal: {
    h2_1: { PT: 'A Palavra que você ensina', EN: 'The Word you teach', ES: 'La Palabra que enseñas' },
    h2_em: { PT: 'merece circular além do domingo.', EN: 'deserves to reach beyond Sunday.', ES: 'merece circular más allá del domingo.' },
    sub: {
      PT: 'Crie seu blog devocional hoje. Publique seu primeiro artigo cristão em 60 segundos. Grátis para sempre, sem cartão de crédito.',
      EN: 'Create your devotional blog today. Publish your first Christian article in 60 seconds. Free forever, no credit card.',
      ES: 'Crea tu blog devocional hoy. Publica tu primer artículo cristiano en 60 segundos. Gratis para siempre, sin tarjeta.',
    },
    cta: { PT: 'Criar minha conta grátis →', EN: 'Create my free account →', ES: 'Crear mi cuenta gratis →' },
    tags: { PT: 'PT · EN · ES · Pastores · Evangélicos · Líderes · Ministérios', EN: 'PT · EN · ES · Pastors · Evangelicals · Leaders · Ministries', ES: 'PT · EN · ES · Pastores · Evangélicos · Líderes · Ministerios' },
    verse: {
      PT: '"Assim será a palavra que sair da minha boca: não voltará para mim vazia." — Isaías 55:11',
      EN: '"So shall my word be that goes out from my mouth; it shall not return to me empty." — Isaiah 55:11',
      ES: '"Así será mi palabra que sale de mi boca: no volverá a mí vacía." — Isaías 55:11',
    },
  },
};

export default function Landing() {
  const { lang, setLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", color: '#3D2B1F' }}>

      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#3D2B1F' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <span className="font-display text-xl font-medium" style={{ color: '#F5F0E8' }}>
            Living <span className="italic" style={{ color: '#C4956A' }}>Word</span>
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('how')} className="text-[13px] font-medium transition-colors hover:opacity-100" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.how[lang]}</button>
            <button onClick={() => scrollTo('features')} className="text-[13px] font-medium transition-colors hover:opacity-100" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.features[lang]}</button>
            <button onClick={() => scrollTo('pricing')} className="text-[13px] font-medium transition-colors hover:opacity-100" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.plans[lang]}</button>
            <div className="flex gap-2 ml-2">
              {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className="text-[13px] font-semibold transition-colors" style={{ color: l === lang ? '#C4956A' : 'rgba(245,240,232,0.4)' }}>{l}</button>
              ))}
            </div>
            <Link to="/login" className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.login[lang]}</Link>
            <Link to="/cadastro" className="text-[15px] font-semibold px-5 py-2 rounded-full transition-transform hover:scale-[1.02]" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.nav.cta[lang]}</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" style={{ color: '#F5F0E8' }} /> : <Menu className="h-6 w-6" style={{ color: '#F5F0E8' }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-5 pb-5 space-y-4" style={{ background: '#3D2B1F' }}>
            <button onClick={() => scrollTo('how')} className="block text-[15px] font-medium w-full text-left" style={{ color: 'rgba(245,240,232,0.8)' }}>{copy.nav.how[lang]}</button>
            <button onClick={() => scrollTo('features')} className="block text-[15px] font-medium w-full text-left" style={{ color: 'rgba(245,240,232,0.8)' }}>{copy.nav.features[lang]}</button>
            <button onClick={() => scrollTo('pricing')} className="block text-[15px] font-medium w-full text-left" style={{ color: 'rgba(245,240,232,0.8)' }}>{copy.nav.plans[lang]}</button>
            <div className="flex gap-4 pt-1">
              {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                <button key={l} onClick={() => { setLang(l); setMobileMenuOpen(false); }} className="text-[15px] font-semibold" style={{ color: l === lang ? '#C4956A' : 'rgba(245,240,232,0.4)' }}>{l}</button>
              ))}
            </div>
            <Link to="/login" className="block text-[15px] font-medium" style={{ color: '#C4956A' }}>{copy.nav.login[lang]}</Link>
            <Link to="/cadastro" className="block text-center text-[15px] font-semibold px-5 py-3 rounded-xl" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.nav.cta[lang]}</Link>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="pt-16 text-center" style={{ background: '#3D2B1F' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <p className="text-[12px] font-semibold tracking-[0.14em] uppercase mb-5 animate-[fadeSlideUp_0.6s_ease-out_0.1s_both]" style={{ color: '#C4956A' }}>{copy.hero.eyebrow[lang]}</p>
          <h1 className="font-display text-[34px] sm:text-[48px] font-semibold leading-[1.12] mb-5 animate-[fadeSlideUp_0.7s_ease-out_0.25s_both]" style={{ color: '#F5F0E8' }}>
            {copy.hero.h1_line1[lang]}
            <br /><em style={{ color: '#C4956A' }}>{copy.hero.h1_em[lang]}</em>
          </h1>
          <p className="text-[16px] sm:text-[17px] leading-[1.7] max-w-[600px] mx-auto mb-8 animate-[fadeSlideUp_0.7s_ease-out_0.45s_both]" style={{ color: 'rgba(245,240,232,0.75)' }}>{copy.hero.sub[lang]}</p>

          {/* Audience badges */}
          <div className="flex flex-wrap gap-2.5 justify-center mb-8 animate-[fadeSlideUp_0.6s_ease-out_0.6s_both]">
            {copy.badges.map((b, i) => (
              <span key={i} className="text-[12px] font-medium px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(196,149,106,0.15)', color: '#C4956A', border: '1px solid rgba(196,149,106,0.25)' }}>{b[lang]}</span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 animate-[fadeSlideUp_0.6s_ease-out_0.75s_both]">
            <Link to="/cadastro" className="inline-block text-[16px] font-semibold px-8 py-4 rounded-xl transition-transform hover:scale-[1.02]" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.hero.cta1[lang]}</Link>
            <button onClick={() => scrollTo('how')} className="inline-block text-[15px] font-medium px-7 py-3.5 rounded-xl transition-colors" style={{ border: '1px solid rgba(196,149,106,0.4)', color: 'rgba(245,240,232,0.8)' }}>{copy.hero.cta2[lang]}</button>
          </div>

          <p className="font-display text-[14px] italic animate-[fadeSlideUp_0.6s_ease-out_0.9s_both]" style={{ color: 'rgba(245,240,232,0.4)' }}>{copy.hero.verse[lang]}</p>
        </div>
      </section>

      {/* ===== SOCIAL PROOF BAR ===== */}
      <section className="py-6 px-5" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          {copy.stats.map((s, i) => (
            <div key={i} className="flex items-center gap-8 sm:gap-12">
              {i > 0 && <div className="hidden sm:block w-px h-10" style={{ background: 'rgba(107,79,58,0.2)' }} />}
              <div className="text-center">
                <div className="font-display text-[32px] font-semibold" style={{ color: '#3D2B1F' }}>{s.num}</div>
                <div className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: '#6B4F3A' }}>{s.label[lang]}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.problem.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-4" style={{ color: '#3D2B1F' }}>{copy.problem.h2[lang]}</h2>
          <p className="text-[16px] leading-[1.7] mb-8 max-w-[600px]" style={{ color: '#6B4F3A' }}>{copy.problem.sub[lang]}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {copy.problem.cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="rounded-xl p-5" style={{ background: '#F5F0E8', border: '1px solid rgba(107,79,58,0.12)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: '#EDD9C8' }}>
                    <Icon className="h-4 w-4" style={{ color: '#6B4F3A' }} />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>{c.title[lang]}</h3>
                  <p className="text-[14px] leading-[1.6]" style={{ color: '#6B4F3A' }}>{c.desc[lang]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.how.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#3D2B1F' }}>{copy.how.h2[lang]}</h2>
          <div className="space-y-0">
            {copy.how.steps.map((step, i) => (
              <div key={i} className="flex gap-5 py-5" style={{ borderBottom: i < 2 ? '1px solid rgba(107,79,58,0.1)' : 'none' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display text-xl font-semibold" style={{ background: '#6B4F3A', color: '#F5F0E8' }}>{i + 1}</div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>{step.title[lang]}</h3>
                  <p className="text-[14px] leading-[1.65] mb-2" style={{ color: '#6B4F3A' }}>{step.desc[lang]}</p>
                  <span className="inline-block text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{step.badge[lang]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.features.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#3D2B1F' }}>{copy.features.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {copy.features.items.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-xl p-5" style={{ border: '1px solid rgba(107,79,58,0.1)', background: '#FFFFFF' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F5F0E8' }}>
                    <Icon className="h-[18px] w-[18px]" style={{ color: '#6B4F3A' }} />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>
                    {f.title[lang]}
                    {f.unique && <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>único</span>}
                  </h3>
                  <p className="text-[14px] leading-[1.6]" style={{ color: '#6B4F3A' }}>{f.desc[lang]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== VS COMPETITORS ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#3D2B1F' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[26px] sm:text-[32px] font-semibold text-center mb-8 leading-tight" style={{ color: '#F5F0E8' }}>{copy.vs.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Them */}
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: 'rgba(245,240,232,0.45)' }}>{copy.vs.them[lang]}</p>
              <div className="space-y-2.5">
                {copy.vs.xItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[14px]">
                    <span className="text-base shrink-0 mt-0.5" style={{ color: 'rgba(245,240,232,0.3)' }}>✗</span>
                    <span style={{ color: 'rgba(245,240,232,0.55)' }}>{item[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Us */}
            <div className="rounded-xl p-5" style={{ background: 'rgba(196,149,106,0.15)', border: '1px solid rgba(196,149,106,0.3)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: '#C4956A' }}>{copy.vs.us[lang]}</p>
              <div className="space-y-2.5">
                {copy.vs.checkItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[14px]">
                    <span className="text-base shrink-0 mt-0.5" style={{ color: '#C4956A' }}>✓</span>
                    <span className="font-medium" style={{ color: 'rgba(245,240,232,0.9)' }}>{item[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.testimonials.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#3D2B1F' }}>{copy.testimonials.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {copy.testimonials.items.map((t, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(107,79,58,0.1)' }}>
                <p className="font-display text-[16px] italic leading-[1.55] mb-4" style={{ color: '#3D2B1F' }}>{t.quote[lang]}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{t.initials}</div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: '#3D2B1F' }}>{t.name} {t.flag}</p>
                    <p className="text-[12px] font-medium" style={{ color: '#6B4F3A' }}>{t.role[lang]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.pricing.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#3D2B1F' }}>{copy.pricing.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {copy.plans.map((plan, i) => (
              <div key={i} className="rounded-xl p-5 flex flex-col" style={{
                background: plan.featured ? '#F5F0E8' : '#FFFFFF',
                border: plan.featured ? '2px solid #6B4F3A' : '1px solid rgba(107,79,58,0.12)',
              }}>
                {plan.featured && (
                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2 self-start" style={{ background: '#6B4F3A', color: '#F5F0E8' }}>
                    {lang === 'PT' ? 'Mais escolhido' : lang === 'EN' ? 'Most popular' : 'Más elegido'}
                  </span>
                )}
                <p className="text-[15px] font-semibold mb-1" style={{ color: '#3D2B1F' }}>{plan.name}</p>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="font-display text-[32px] font-semibold" style={{ color: '#3D2B1F' }}>{plan.price}</span>
                </div>
                <p className="text-[13px] mb-4 pb-4 font-medium" style={{ color: '#6B4F3A', borderBottom: '1px solid rgba(107,79,58,0.1)' }}>{plan.period[lang]}</p>
                <div className="space-y-2 mb-4 flex-1">
                  {plan.features[lang].map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-[14px]" style={{ color: '#3D2B1F' }}>
                      <span className="shrink-0 font-semibold" style={{ color: '#6B4F3A' }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/cadastro" className="block text-center text-[14px] font-semibold py-3 rounded-lg transition-transform hover:scale-[1.02]" style={{
                  background: plan.featured ? '#6B4F3A' : '#EDD9C8',
                  color: plan.featured ? '#FFFFFF' : '#6B4F3A',
                }}>{plan.cta[lang]}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.faq.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-6" style={{ color: '#3D2B1F' }}>{copy.faq.h2[lang]}</h2>
          <div className="space-y-3">
            {copy.faq.items.map((item, i) => (
              <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-xl p-5 transition-shadow hover:shadow-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(107,79,58,0.1)' }}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[15px] font-semibold" style={{ color: '#3D2B1F' }}>{item.q[lang]}</h3>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: '#6B4F3A' }} />
                </div>
                {openFaq === i && (
                  <p className="text-[15px] leading-[1.65] mt-3" style={{ color: '#6B4F3A' }}>{item.a[lang]}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-16 sm:py-20 px-5 text-center safe-area-bottom" style={{ background: '#6B4F3A' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-[30px] sm:text-[38px] font-semibold leading-tight mb-4" style={{ color: '#F5F0E8' }}>
            {copy.ctaFinal.h2_1[lang]}<br /><em>{copy.ctaFinal.h2_em[lang]}</em>
          </h2>
          <p className="text-[16px] leading-[1.7] mb-8" style={{ color: 'rgba(245,240,232,0.75)' }}>{copy.ctaFinal.sub[lang]}</p>
          <Link to="/cadastro" className="inline-block text-[16px] font-semibold px-9 py-4 rounded-xl mb-4 transition-transform hover:scale-[1.02]" style={{ background: '#F5F0E8', color: '#3D2B1F' }}>{copy.ctaFinal.cta[lang]}</Link>
          <br />
          <span className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.5)' }}>{copy.ctaFinal.tags[lang]}</span>
          <p className="font-display text-[14px] italic mt-6" style={{ color: 'rgba(245,240,232,0.35)' }}>{copy.ctaFinal.verse[lang]}</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-5 sm:px-8" style={{ background: '#1E1510' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg" style={{ color: 'rgba(245,240,232,0.7)' }}>
            Living <span style={{ color: '#C4956A' }}>Word</span> · Palavra Viva · Palabra Viva
          </span>
          <div className="flex items-center gap-5">
            <span className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.4)' }}>{lang === 'PT' ? 'Privacidade' : lang === 'EN' ? 'Privacy' : 'Privacidad'}</span>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.4)' }}>{lang === 'PT' ? 'Termos' : 'Terms'}</span>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.4)' }}>{lang === 'PT' ? 'Contato' : 'Contact'}</span>
          </div>
          <div className="flex gap-3">
            {(['PT', 'EN', 'ES'] as L[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className="text-[13px] font-semibold" style={{ color: l === lang ? '#C4956A' : 'rgba(245,240,232,0.35)' }}>{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
