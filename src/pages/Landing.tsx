import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef, useMemo } from 'react';

import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { usePageviewTracker } from '@/hooks/use-pageview-tracker';
import { formatPrice } from '@/utils/geoPricing';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { minds } from '@/data/minds';
import {
  Clock, Languages, Zap, Lock, FileText, Globe, Users, Mic,
  ChevronDown, Check, X as XIcon, Menu, X, BookOpen, PenTool,
  Share2, Layers, Shield, Sparkles, Brain, MessageCircle
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
      PT: 'IA bíblica para pastores e líderes · PT · EN · ES',
      EN: 'Biblical AI for pastors & leaders · PT · EN · ES',
      ES: 'IA bíblica para pastores y líderes · PT · EN · ES',
    },
    h1_line1: {
      PT: 'Crie sermões, estudos e conteúdo cristão',
      EN: 'Create sermons, studies & Christian content',
      ES: 'Crea sermones, estudios y contenido cristiano',
    },
    h1_em: {
      PT: 'com IA treinada nas Escrituras',
      EN: 'with AI trained on Scripture',
      ES: 'con IA entrenada en las Escrituras',
    },
    sub: {
      PT: 'Uma plataforma de inteligência artificial treinada em Bíblias originais e modernas que apoia pastores, líderes e ministérios a criar sermões, devocionais, estudos bíblicos, artigos e muito mais — com fidelidade teológica, em português, inglês e espanhol.',
      EN: 'An artificial intelligence platform trained on original and modern Bibles that supports pastors, leaders and ministries in creating sermons, devotionals, Bible studies, articles and more — with theological fidelity, in Portuguese, English and Spanish.',
      ES: 'Una plataforma de inteligencia artificial entrenada en Biblias originales y modernas que apoya a pastores, líderes y ministerios a crear sermones, devocionales, estudios bíblicos, artículos y más — con fidelidad teológica, en portugués, inglés y español.',
    },
    cta1: { PT: 'Começar grátis →', EN: 'Start free →', ES: 'Empezar gratis →' },
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
    { num: '20+', label: { PT: 'Ferramentas pastorais', EN: 'Pastoral tools', ES: 'Herramientas pastorales' } },
    { num: '7+', label: { PT: 'Formatos por geração', EN: 'Formats per generation', ES: 'Formatos por generación' } },
    { num: '1 clique', label: { PT: 'Pesquisa que levaria horas', EN: 'Research that would take hours', ES: 'Investigación que tomaría horas' } },
    { num: '$0', label: { PT: 'Para começar', EN: 'To get started', ES: 'Para empezar' } },
  ],
  problem: {
    tag: { PT: 'O problema real', EN: 'The real problem', ES: 'El problema real' },
    h2: {
      PT: 'Você passa horas pesquisando. A IA genérica não entende teologia.',
      EN: 'You spend hours researching. Generic AI doesn\'t understand theology.',
      ES: 'Pasas horas investigando. La IA genérica no entiende teología.',
    },
    sub: {
      PT: 'Preparar um sermão, um estudo bíblico profundo ou um devocional exige pesquisa, exegese e tempo. O pastor trabalha a semana toda e não tem horas sobrando para transformar ideias em conteúdo escrito e publicável.',
      EN: 'Preparing a sermon, a deep Bible study or a devotional takes research, exegesis and time. The pastor works all week and doesn\'t have hours to spare turning ideas into written, publishable content.',
      ES: 'Preparar un sermón, un estudio bíblico profundo o un devocional exige investigación, exégesis y tiempo. El pastor trabaja toda la semana y no tiene horas de sobra para transformar ideas en contenido escrito y publicable.',
    },
    cards: [
      {
        icon: Clock,
        title: { PT: 'Horas de pesquisa manual', EN: 'Hours of manual research', ES: 'Horas de investigación manual' },
        desc: {
          PT: 'Consultar comentários, versões bíblicas, contexto histórico e aplicação leva tempo. O Living Word faz isso em segundos, com profundidade real.',
          EN: 'Checking commentaries, Bible versions, historical context and application takes time. Living Word does it in seconds, with real depth.',
          ES: 'Consultar comentarios, versiones bíblicas, contexto histórico y aplicación toma tiempo. Living Word lo hace en segundos, con profundidad real.',
        },
      },
      {
        icon: Languages,
        title: { PT: 'Congregação multilíngue', EN: 'Multilingual congregation', ES: 'Congregación multilingüe' },
        desc: {
          PT: 'Sua igreja fala mais de um idioma. Criar conteúdo em PT, EN e ES manualmente é quase impossível. O Living Word gera nativamente nos três.',
          EN: 'Your church speaks more than one language. Creating content in PT, EN and ES manually is almost impossible. Living Word generates natively in all three.',
          ES: 'Tu iglesia habla más de un idioma. Crear contenido en PT, EN y ES manualmente es casi imposible. Living Word genera nativamente en los tres.',
        },
      },
      {
        icon: Zap,
        title: { PT: 'IA genérica não entende a Bíblia', EN: 'Generic AI doesn\'t understand the Bible', ES: 'La IA genérica no entiende la Biblia' },
        desc: {
          PT: 'ChatGPT gera texto, não conteúdo com exegese real. Não conhece sua doutrina, seu povo, nem a diferença entre texto, interpretação e aplicação.',
          EN: 'ChatGPT generates text, not content with real exegesis. It doesn\'t know your doctrine, your people, or the difference between text, interpretation and application.',
          ES: 'ChatGPT genera texto, no contenido con exégesis real. No conoce tu doctrina, tu pueblo ni la diferencia entre texto, interpretación y aplicación.',
        },
      },
      {
        icon: Lock,
        title: { PT: 'Conteúdo preso no caderno', EN: 'Content stuck in a notebook', ES: 'Contenido atrapado en el cuaderno' },
        desc: {
          PT: 'Seus estudos e sermões merecem circular. Com o Living Word, o que você já estuda vira conteúdo publicável com um clique.',
          EN: 'Your studies and sermons deserve to circulate. With Living Word, what you already study becomes publishable content with one click.',
          ES: 'Tus estudios y sermones merecen circular. Con Living Word, lo que ya estudias se convierte en contenido publicable con un clic.',
        },
      },
    ],
  },
  how: {
    tag: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
    h2: {
      PT: 'Do seu tema ao conteúdo pronto em segundos.',
      EN: 'From your topic to ready content in seconds.',
      ES: 'De tu tema al contenido listo en segundos.',
    },
    steps: [
      {
        title: {
          PT: 'Escolha a passagem, o tema e o público',
          EN: 'Choose the passage, topic and audience',
          ES: 'Elige el pasaje, el tema y el público',
        },
        desc: {
          PT: 'Informe a passagem bíblica, o público da sua congregação e o que você quer criar — sermão, estudo, devocional, artigo. Três campos, sem formulário longo.',
          EN: 'Enter the Bible passage, your congregation\'s audience and what you want to create — sermon, study, devotional, article. Three fields, no long forms.',
          ES: 'Ingresa el pasaje bíblico, el público de tu congregación y lo que quieres crear — sermón, estudio, devocional, artículo. Tres campos, sin formularios largos.',
        },
        badge: {
          PT: 'João 15:1-8 · Jovens · Propósito de vida',
          EN: 'John 15:1-8 · Youth · Life purpose',
          ES: 'Juan 15:1-8 · Jóvenes · Propósito de vida',
        },
      },
      {
        title: {
          PT: 'A IA pesquisa, analisa e gera com exegese real',
          EN: 'AI researches, analyzes and generates with real exegesis',
          ES: 'La IA investiga, analiza y genera con exégesis real',
        },
        desc: {
          PT: 'Treinada em Bíblias originais e modernas, a IA faz a pesquisa profunda que levaria horas — contexto histórico, exegese, aplicação pastoral — e gera conteúdo com sua voz e doutrina.',
          EN: 'Trained on original and modern Bibles, the AI does the deep research that would take hours — historical context, exegesis, pastoral application — and generates content with your voice and doctrine.',
          ES: 'Entrenada en Biblias originales y modernas, la IA hace la investigación profunda que tomaría horas — contexto histórico, exégesis, aplicación pastoral — y genera contenido con tu voz y doctrina.',
        },
        badge: {
          PT: 'Guardrails teológicos · Exegese real · Sua voz',
          EN: 'Theological guardrails · Real exegesis · Your voice',
          ES: 'Guardrails teológicos · Exégesis real · Tu voz',
        },
      },
      {
        title: {
          PT: 'Revise, publique e distribua em qualquer formato',
          EN: 'Review, publish and distribute in any format',
          ES: 'Revisa, publica y distribuye en cualquier formato',
        },
        desc: {
          PT: 'Sermão, devocional, estudo bíblico, artigo, blog, conteúdo para célula, versão em EN e ES — tudo pronto. Publique no blog integrado, exporte para Word/PDF ou compartilhe direto.',
          EN: 'Sermon, devotional, Bible study, article, blog, small group content, EN & ES version — all ready. Publish on the integrated blog, export to Word/PDF or share directly.',
          ES: 'Sermón, devocional, estudio bíblico, artículo, blog, contenido para célula, versión en EN y ES — todo listo. Publica en el blog integrado, exporta a Word/PDF o comparte directo.',
        },
        badge: {
          PT: 'Blog · Word · PDF · 7+ formatos',
          EN: 'Blog · Word · PDF · 7+ formats',
          ES: 'Blog · Word · PDF · 7+ formatos',
        },
      },
    ],
  },
  features: {
    tag: { PT: 'O que está incluído', EN: 'What\'s included', ES: 'Qué está incluido' },
    h2: {
      PT: 'Tudo que um pastor precisa para criar, pesquisar e publicar.',
      EN: 'Everything a pastor needs to create, research and publish.',
      ES: 'Todo lo que un pastor necesita para crear, investigar y publicar.',
    },
    items: [
      { icon: Sparkles, title: { PT: 'IA treinada nas Escrituras', EN: 'AI trained on Scripture', ES: 'IA entrenada en las Escrituras' }, desc: { PT: 'Treinada em Bíblias originais e modernas. Pesquisa profunda, contexto histórico, exegese e aplicação — o que levaria horas, feito em segundos.', EN: 'Trained on original and modern Bibles. Deep research, historical context, exegesis and application — what would take hours, done in seconds.', ES: 'Entrenada en Biblias originales y modernas. Investigación profunda, contexto histórico, exégesis y aplicación — lo que tomaría horas, hecho en segundos.' }, unique: true },
      { icon: Layers, title: { PT: '7+ formatos em 1 geração', EN: '7+ formats in 1 generation', ES: '7+ formatos en 1 generación' }, desc: { PT: 'Sermão, esboço, devocional, estudo bíblico, artigo, célula e conteúdo para redes. Tudo gerado de uma vez.', EN: 'Sermon, outline, devotional, Bible study, article, small group and social content. All generated at once.', ES: 'Sermón, bosquejo, devocional, estudio bíblico, artículo, célula y contenido para redes. Todo generado de una vez.' } },
      { icon: Globe, title: { PT: 'Trilíngue nativo PT · EN · ES', EN: 'Native trilingual PT · EN · ES', ES: 'Trilingüe nativo PT · EN · ES' }, desc: { PT: 'Conteúdo gerado nativamente em cada idioma — não tradução automática. Ideal para ministérios multilíngues.', EN: 'Content generated natively in each language — not automatic translation. Ideal for multilingual ministries.', ES: 'Contenido generado nativamente en cada idioma — no traducción automática. Ideal para ministerios multilingües.' }, unique: true },
      { icon: BookOpen, title: { PT: 'Estudo bíblico profundo', EN: 'Deep Bible study', ES: 'Estudio bíblico profundo' }, desc: { PT: 'Análise exegética completa: contexto, significado original, paralelos, aplicação. Pesquisa que levaria horas, com um clique.', EN: 'Complete exegetical analysis: context, original meaning, parallels, application. Research that would take hours, with one click.', ES: 'Análisis exegético completo: contexto, significado original, paralelos, aplicación. Investigación que tomaría horas, con un clic.' } },
      { icon: Shield, title: { PT: 'Guardrails teológicos reais', EN: 'Real theological guardrails', ES: 'Guardrails teológicos reales' }, desc: { PT: 'Exegese antes de aplicação. Distinção entre texto, interpretação e aplicação. Alerta de eisegese integrado.', EN: 'Exegesis before application. Text, interpretation and application distinction. Built-in eisegesis alert.', ES: 'Exégesis antes de aplicación. Distinción entre texto, interpretación y aplicación. Alerta de eiségesis integrado.' } },
      { icon: Mic, title: { PT: 'Sua voz pastoral preservada', EN: 'Your pastoral voice preserved', ES: 'Tu voz pastoral preservada' }, desc: { PT: 'Expositivo, narrativo, apologético, profético — o conteúdo soa como você ensina, não como template genérico.', EN: 'Expository, narrative, apologetic, prophetic — the content sounds like you teach, not like a generic template.', ES: 'Expositivo, narrativo, apologético, profético — el contenido suena como tú enseñas, no como plantilla genérica.' } },
    ],
  },
  vs: {
    h2: {
      PT: 'Outras IAs geram texto. Living Word gera conteúdo cristão com exegese real.',
      EN: 'Other AIs generate text. Living Word generates Christian content with real exegesis.',
      ES: 'Otras IAs generan texto. Living Word genera contenido cristiano con exégesis real.',
    },
    them: {
      PT: 'IA genérica (ChatGPT, etc.)',
      EN: 'Generic AI (ChatGPT, etc.)',
      ES: 'IA genérica (ChatGPT, etc.)',
    },
    us: { PT: 'Living Word', EN: 'Living Word', ES: 'Living Word' },
    xItems: [
      { PT: 'Não conhece versões bíblicas ou línguas originais', EN: 'Doesn\'t know Bible versions or original languages', ES: 'No conoce versiones bíblicas ni lenguas originales' },
      { PT: 'Sem contexto pastoral ou congregacional', EN: 'No pastoral or congregational context', ES: 'Sin contexto pastoral o congregacional' },
      { PT: 'Sem distinção entre exegese e eisegese', EN: 'No distinction between exegesis and eisegesis', ES: 'Sin distinción entre exégesis y eiségesis' },
      { PT: 'Sem publicação — você copia e cola', EN: 'No publishing — you copy and paste', ES: 'Sin publicación — copias y pegas' },
      { PT: 'Gera texto genérico, não conteúdo teológico', EN: 'Generates generic text, not theological content', ES: 'Genera texto genérico, no contenido teológico' },
      { PT: 'Sem suporte a PT, EN e ES nativos', EN: 'No native PT, EN and ES support', ES: 'Sin soporte nativo a PT, EN y ES' },
    ],
    checkItems: [
      { PT: 'Treinada em Bíblias originais e modernas', EN: 'Trained on original and modern Bibles', ES: 'Entrenada en Biblias originales y modernas' },
      { PT: 'Exegese profunda antes de qualquer geração', EN: 'Deep exegesis before any generation', ES: 'Exégesis profunda antes de cualquier generación' },
      { PT: 'Sermão, estudo, devocional, artigo — 7+ formatos', EN: 'Sermon, study, devotional, article — 7+ formats', ES: 'Sermón, estudio, devocional, artículo — 7+ formatos' },
      { PT: 'Blog e publicação automática integrada', EN: 'Blog and auto-publishing built in', ES: 'Blog y publicación automática integrada' },
      { PT: 'Pesquisa que levaria horas, em segundos', EN: 'Research that would take hours, in seconds', ES: 'Investigación que tomaría horas, en segundos' },
      { PT: 'PT, EN, ES gerados nativamente', EN: 'PT, EN, ES generated natively', ES: 'PT, EN, ES generados nativamente' },
    ],
  },
  testimonials: {
    tag: { PT: 'Quem usa', EN: 'Who uses it', ES: 'Quién lo usa' },
    h2: {
      PT: 'Pastores e líderes que já economizam horas toda semana.',
      EN: 'Pastors and leaders already saving hours every week.',
      ES: 'Pastores y líderes que ya ahorran horas cada semana.',
    },
    itemsByLang: {
      PT: [
        {
          quote: '"Eu passava horas pesquisando comentários e versões bíblicas. Agora tenho exegese profunda, sermão e devocional prontos em segundos. Minha preparação mudou completamente."',
          name: 'Pr. João Silva', flag: '🇧🇷', initials: 'JS',
          role: 'Igreja Evangélica Brasileira · Atlanta, GA',
        },
        {
          quote: '"Sou líder de célula. Antes eu improvisava o estudo. Agora chego com devocional, perguntas de discussão e contexto histórico — tudo com um clique."',
          name: 'Ana Cruz', flag: '🇧🇷', initials: 'AC',
          role: 'Líder de célula · Miami, FL',
        },
        {
          quote: '"Pastoreio uma igreja pequena no interior e faço tudo sozinho. O Living Word me dá sermão, estudo bíblico e devocional com profundidade que eu levaria dias para preparar."',
          name: 'Pr. Marcos Oliveira', flag: '🇧🇷', initials: 'MO',
          role: 'Igreja Batista Renovada · Goiânia, GO',
        },
        {
          quote: '"Uso o Living Word para preparar os estudos da nossa célula de jovens. A exegese é fiel, o conteúdo é relevante e economizo horas toda semana."',
          name: 'Débora Santos', flag: '🇧🇷', initials: 'DS',
          role: 'Líder de jovens · São Paulo, SP',
        },
      ],
      EN: [
        {
          quote: '"I used to spend hours cross-referencing commentaries and Bible versions. Now I get deep exegesis, a full sermon and a devotional in seconds. It changed how I prepare."',
          name: 'Rev. Robert Johnson', flag: '🇺🇸', initials: 'RJ',
          role: 'Baptist Church · Nashville, TN',
        },
        {
          quote: '"I was skeptical about AI for ministry. Living Word is different — it actually does exegesis, understands doctrine, and helps me create content I\'m proud to publish."',
          name: 'Pastor David Miller', flag: '🇺🇸', initials: 'DM',
          role: 'Community Church · Dallas, TX',
        },
        {
          quote: '"As a church planter, I wear every hat. Living Word gives me sermon outlines, Bible studies and devotionals with real depth — saving me 6+ hours a week."',
          name: 'Pastor James Carter', flag: '🇺🇸', initials: 'JC',
          role: 'New Life Fellowship · Phoenix, AZ',
        },
        {
          quote: '"I lead a small group and needed solid material fast. Living Word delivers discussion questions, historical context and application points — all biblically grounded."',
          name: 'Sarah Thompson', flag: '🇺🇸', initials: 'ST',
          role: 'Small Group Leader · Charlotte, NC',
        },
      ],
      ES: [
        {
          quote: '"Mi congregación habla español e inglés. Antes tardaba días en adaptar el contenido. Ahora creo sermón, devocional y estudio bíblico en los dos idiomas en un minuto."',
          name: 'Pastor Miguel Cruz', flag: '🇲🇽', initials: 'MC',
          role: 'Iglesia Evangélica Hispana · Los Angeles, CA',
        },
        {
          quote: '"Soy líder de célula y antes improvisaba cada estudio. Ahora llego preparada con devocional, preguntas de discusión y contexto histórico — todo con un clic."',
          name: 'María González', flag: '🇨🇴', initials: 'MG',
          role: 'Líder de célula · Bogotá, Colombia',
        },
        {
          quote: '"Pastoreo una iglesia pequeña y hago todo solo. Living Word me da sermón, estudio bíblico y devocional con una profundidad que me tomaría días preparar."',
          name: 'Pr. Carlos Herrera', flag: '🇦🇷', initials: 'CH',
          role: 'Iglesia Bautista · Buenos Aires, Argentina',
        },
        {
          quote: '"Era escéptico sobre la IA para el ministerio. Living Word es diferente — realmente hace exégesis, entiende la doctrina y me ayuda a crear contenido que me enorgullece publicar."',
          name: 'Pastor Luis Ramírez', flag: '🇲🇽', initials: 'LR',
          role: 'Iglesia del Camino · Houston, TX',
        },
      ],
    },
  },
  pricing: {
    tag: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
    h2: { PT: 'Comece grátis. Cresça quando precisar.', EN: 'Start free. Grow when you need to.', ES: 'Empieza gratis. Crece cuando necesites.' },
  },
  plans: [] as Array<{
    name: Record<L, string>;
    planKey: string | null;
    price: string;
    period: Record<L, string>;
    features: Record<L, string[]>;
    cta: Record<L, string>;
    featured: boolean;
    capacity: Record<L, string>;
  }>,
  faq: {
    tag: { PT: 'Perguntas frequentes', EN: 'FAQ', ES: 'Preguntas frecuentes' },
    h2: { PT: 'Respostas diretas.', EN: 'Straight answers.', ES: 'Respuestas directas.' },
    items: [
      {
        q: { PT: 'A IA substitui o pastor?', EN: 'Does AI replace the pastor?', ES: '¿La IA reemplaza al pastor?' },
        a: { PT: 'Não. O Living Word é um copiloto de criação bíblica. Você define a passagem, a doutrina e o tom. A IA pesquisa, organiza e gera — mas quem ensina e decide é você.', EN: 'No. Living Word is a biblical creation copilot. You define the passage, doctrine and tone. AI researches, organizes and generates — but you\'re the one who teaches and decides.', ES: 'No. Living Word es un copiloto de creación bíblica. Tú defines el pasaje, la doctrina y el tono. La IA investiga, organiza y genera — pero quien enseña y decide eres tú.' },
      },
      {
        q: { PT: 'Para quem o Living Word foi feito?', EN: 'Who is Living Word made for?', ES: '¿Para quién fue hecho Living Word?' },
        a: { PT: 'Para pastores, líderes de célula, ensinadores bíblicos, criadores de conteúdo cristão e ministérios que querem criar sermões, estudos e conteúdo com profundidade bíblica e agilidade.', EN: 'For pastors, cell leaders, Bible teachers, Christian content creators and ministries that want to create sermons, studies and content with biblical depth and agility.', ES: 'Para pastores, líderes de célula, enseñadores bíblicos, creadores de contenido cristiano y ministerios que quieren crear sermones, estudios y contenido con profundidad bíblica y agilidad.' },
      },
      {
        q: { PT: 'Como a IA é treinada nas Escrituras?', EN: 'How is the AI trained on Scripture?', ES: '¿Cómo se entrena la IA en las Escrituras?' },
        a: { PT: 'O Living Word utiliza IA treinada em uma vasta base de Bíblias originais e modernas, comentários exegéticos e contexto histórico. Isso permite pesquisa profunda e geração de conteúdo com rigor teológico real.', EN: 'Living Word uses AI trained on a vast base of original and modern Bibles, exegetical commentaries and historical context. This enables deep research and content generation with real theological rigor.', ES: 'Living Word utiliza IA entrenada en una vasta base de Biblias originales y modernas, comentarios exegéticos y contexto histórico. Esto permite investigación profunda y generación de contenido con rigor teológico real.' },
      },
      {
        q: { PT: 'Que tipos de conteúdo o Living Word cria?', EN: 'What types of content does Living Word create?', ES: '¿Qué tipos de contenido crea Living Word?' },
        a: { PT: 'Sermão completo, esboço, devocional, estudo bíblico profundo, artigo editorial, blog devocional, conteúdo para célula, conteúdo para redes, e versões em inglês e espanhol. São mais de 7 formatos em uma geração.', EN: 'Full sermon, outline, devotional, deep Bible study, editorial article, devotional blog, small group content, social media content, and English and Spanish versions. Over 7 formats in one generation.', ES: 'Sermón completo, bosquejo, devocional, estudio bíblico profundo, artículo editorial, blog devocional, contenido para célula, contenido para redes, y versiones en inglés y portugués. Más de 7 formatos en una generación.' },
      },
      {
        q: { PT: 'Funciona em português, inglês e espanhol?', EN: 'Does it work in Portuguese, English and Spanish?', ES: '¿Funciona en portugués, inglés y español?' },
        a: { PT: 'Sim. O Living Word é trilíngue nativo — gera conteúdo em PT, EN e ES com voz pastoral nativa em cada idioma, não tradução automática.', EN: 'Yes. Living Word is natively trilingual — generates content in PT, EN and ES with native pastoral voice in each language, not automatic translation.', ES: 'Sí. Living Word es trilingüe nativo — genera contenido en PT, EN y ES con voz pastoral nativa en cada idioma, no traducción automática.' },
      },
      {
        q: { PT: 'Preciso ter site para usar?', EN: 'Do I need a website to use it?', ES: '¿Necesito tener un sitio web?' },
        a: { PT: 'Não. O Living Word inclui um blog cristão integrado. Você também pode exportar para Word, PDF ou WordPress.', EN: 'No. Living Word includes an integrated Christian blog. You can also export to Word, PDF or WordPress.', ES: 'No. Living Word incluye un blog cristiano integrado. También puedes exportar a Word, PDF o WordPress.' },
      },
      {
        q: { PT: 'O conteúdo mantém fidelidade bíblica?', EN: 'Does the content maintain biblical faithfulness?', ES: '¿El contenido mantiene fidelidad bíblica?' },
        a: { PT: 'Sim. O Living Word usa guardrails teológicos reais: exegese antes de aplicação, distinção entre texto, interpretação e aplicação, e alerta de eisegese integrado.', EN: 'Yes. Living Word uses real theological guardrails: exegesis before application, text/interpretation/application distinction, and built-in eisegesis alerts.', ES: 'Sí. Living Word usa guardrails teológicos reales: exégesis antes de aplicación, distinción entre texto, interpretación y aplicación, y alerta de eiségesis integrado.' },
      },
      {
        q: { PT: 'Serve para líderes e ministérios pequenos?', EN: 'Does it work for small leaders and ministries?', ES: '¿Sirve para líderes y ministerios pequeños?' },
        a: { PT: 'Sim. O plano gratuito já inclui 5 gerações por mês. Líderes de célula e ministérios pequenos usam o Living Word para chegar toda semana com conteúdo de ensino bíblico pronto.', EN: 'Yes. The free plan already includes 5 generations per month. Cell leaders and small ministries use Living Word to arrive every week with ready Bible teaching content.', ES: 'Sí. El plan gratuito ya incluye 5 generaciones al mes. Líderes de célula y ministerios pequeños usan Living Word para llegar cada semana con contenido de enseñanza bíblica listo.' },
      },
      {
        q: { PT: 'A IA ajuda na pesquisa bíblica?', EN: 'Does the AI help with Bible research?', ES: '¿La IA ayuda en la investigación bíblica?' },
        a: { PT: 'Sim. O Living Word faz pesquisa profunda em segundos — contexto histórico, paralelos bíblicos, significado original, comentários exegéticos. O que levaria horas de estudo manual, feito com um clique.', EN: 'Yes. Living Word does deep research in seconds — historical context, biblical parallels, original meaning, exegetical commentaries. What would take hours of manual study, done with one click.', ES: 'Sí. Living Word hace investigación profunda en segundos — contexto histórico, paralelos bíblicos, significado original, comentarios exegéticos. Lo que tomaría horas de estudio manual, hecho con un clic.' },
      },
      {
        q: { PT: 'Precisa de cartão para o trial de 7 dias?', EN: 'Do I need a card for the 7-day trial?', ES: '¿Necesito tarjeta para la prueba de 7 días?' },
        a: { PT: 'Não. O trial de 7 dias é sem cartão de crédito. Só solicitamos pagamento no 8º dia se você quiser continuar com acesso completo.', EN: 'No. The 7-day trial requires no credit card. We only ask for payment on day 8 if you want to continue with full access.', ES: 'No. La prueba de 7 días no requiere tarjeta de crédito. Solo solicitamos pago el día 8 si deseas continuar con acceso completo.' },
      },
    ],
  },
  ctaFinal: {
    h2_1: { PT: 'A pesquisa que levaria horas.', EN: 'The research that would take hours.', ES: 'La investigación que tomaría horas.' },
    h2_em: { PT: 'O conteúdo que seu ministério precisa. Em segundos.', EN: 'The content your ministry needs. In seconds.', ES: 'El contenido que tu ministerio necesita. En segundos.' },
    sub: {
      PT: 'Crie sermões, estudos bíblicos, devocionais e muito mais com IA treinada nas Escrituras. Grátis para sempre, sem cartão de crédito.',
      EN: 'Create sermons, Bible studies, devotionals and more with AI trained on Scripture. Free forever, no credit card.',
      ES: 'Crea sermones, estudios bíblicos, devocionales y más con IA entrenada en las Escrituras. Gratis para siempre, sin tarjeta.',
    },
    cta: { PT: 'Começar grátis →', EN: 'Start free →', ES: 'Empezar gratis →' },
    tags: { PT: 'PT · EN · ES · Pastores · Líderes · Ministérios · Criadores cristãos', EN: 'PT · EN · ES · Pastors · Leaders · Ministries · Christian creators', ES: 'PT · EN · ES · Pastores · Líderes · Ministerios · Creadores cristianos' },
    verse: {
      PT: '"Assim será a palavra que sair da minha boca: não voltará para mim vazia." — Isaías 55:11',
      EN: '"So shall my word be that goes out from my mouth; it shall not return to me empty." — Isaiah 55:11',
      ES: '"Así será mi palabra que sale de mi boca: no volverá a mí vacía." — Isaías 55:11',
    },
  },
};

function RevealOnScroll({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const { lang, setLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  usePageviewTracker('/');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { pricing, loading: regionLoading } = useGeoRegion();

  const pricingPlans = useMemo(() => {
    if (!pricing) return copy.plans;
    const fmt = (amt: number) => formatPrice(amt, pricing.symbol, pricing.currency);
    return [
      {
        name: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' } as Record<L, string>,
        planKey: null as string | null,
        price: `${pricing.symbol}0`,
        period: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
        features: {
          PT: ['5 gerações/mês', 'Sermão + esboço básico', '1 artigo devocional/mês', 'Blog cristão no ar', 'PT, EN ou ES'],
          EN: ['5 generations/month', 'Sermon + basic outline', '1 devotional article/month', 'Christian blog live', 'PT, EN or ES'],
          ES: ['5 generaciones/mes', 'Sermón + bosquejo básico', '1 artículo devocional/mes', 'Blog cristiano en línea', 'PT, EN o ES'],
        } as Record<L, string[]>,
        cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' } as Record<L, string>,
        featured: false,
        capacity: { PT: 'Uso básico', EN: 'Basic usage', ES: 'Uso básico' } as Record<L, string>,
      },
      {
        name: { PT: 'Starter', EN: 'Starter', ES: 'Starter' } as Record<L, string>,
        planKey: 'starter' as string | null,
        price: fmt(pricing.plans.starter.amount),
        period: { PT: '/mês · 7 dias grátis', EN: '/month · 7 days free', ES: '/mes · 7 días gratis' } as Record<L, string>,
        features: {
          PT: ['Até 15 sermões/mês', 'Até 50 conteúdos totais', 'Todos os 7+ formatos', 'Blog com publicação automática', 'Sem watermark', '7 dias grátis sem cartão'],
          EN: ['Up to 15 sermons/month', 'Up to 50 total contents', 'All 7+ formats', 'Blog with auto-publishing', 'No watermark', '7 days free, no card'],
          ES: ['Hasta 15 sermones/mes', 'Hasta 50 contenidos totales', 'Los 7+ formatos', 'Blog con publicación automática', 'Sin marca de agua', '7 días gratis sin tarjeta'],
        } as Record<L, string[]>,
        cta: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' } as Record<L, string>,
        featured: false,
        capacity: { PT: 'Produção semanal', EN: 'Weekly production', ES: 'Producción semanal' } as Record<L, string>,
      },
      {
        name: { PT: 'Pro', EN: 'Pro', ES: 'Pro' } as Record<L, string>,
        planKey: 'pro' as string | null,
        price: fmt(pricing.plans.pro.amount),
        period: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
        features: {
          PT: ['Até 60 sermões/mês', 'Produção completa semanal', 'Acesso a Mentes Brilhantes', 'Estudo bíblico profundo', 'Séries devocionais automáticas', 'Voz pastoral personalizada', 'Calendário editorial'],
          EN: ['Up to 60 sermons/month', 'Full weekly production', 'Brilliant Minds access', 'Deep Bible study', 'Automatic devotional series', 'Custom pastoral voice', 'Editorial calendar'],
          ES: ['Hasta 60 sermones/mes', 'Producción completa semanal', 'Acceso a Mentes Brillantes', 'Estudio bíblico profundo', 'Series devocionales automáticas', 'Voz pastoral personalizada', 'Calendario editorial'],
        } as Record<L, string[]>,
        cta: { PT: 'Começar agora →', EN: 'Get started →', ES: 'Empezar ahora →' } as Record<L, string>,
        featured: true,
        capacity: { PT: 'Produção completa', EN: 'Full production', ES: 'Producción completa' } as Record<L, string>,
      },
      {
        name: { PT: 'Igreja', EN: 'Church', ES: 'Iglesia' } as Record<L, string>,
        planKey: 'church' as string | null,
        price: fmt(pricing.plans.church.amount),
        period: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
        features: {
          PT: ['Até 10 usuários incluídos', 'Produção compartilhada ilimitada', 'Fluxo editorial completo', 'Múltiplos blogs conectados', 'Analytics da equipe', `+${fmt(pricing.addon.amount)} por usuário extra`, 'Capacidade escala com a equipe'],
          EN: ['Up to 10 users included', 'Unlimited shared production', 'Full editorial workflow', 'Multiple connected blogs', 'Team analytics', `+${fmt(pricing.addon.amount)} per extra user`, 'Capacity scales with team'],
          ES: ['Hasta 10 usuarios incluidos', 'Producción compartida ilimitada', 'Flujo editorial completo', 'Múltiples blogs conectados', 'Analytics del equipo', `+${fmt(pricing.addon.amount)} por usuario extra`, 'Capacidad escala con el equipo'],
        } as Record<L, string[]>,
        cta: { PT: 'Começar', EN: 'Get started', ES: 'Empezar' } as Record<L, string>,
        featured: false,
        capacity: { PT: 'Escala ministerial', EN: 'Ministry scale', ES: 'Escala ministerial' } as Record<L, string>,
      },
    ];
  }, [pricing]);

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
      <section className="pt-16" style={{ background: '#3D2B1F' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-[12px] font-semibold tracking-[0.14em] uppercase mb-5 animate-[fadeSlideUp_0.6s_ease-out_0.1s_both]" style={{ color: '#C4956A' }}>{copy.hero.eyebrow[lang]}</p>
              <h1 className="font-display text-[34px] sm:text-[48px] font-semibold leading-[1.12] mb-5 animate-[fadeSlideUp_0.7s_ease-out_0.25s_both]" style={{ color: '#F5F0E8' }}>
                {copy.hero.h1_line1[lang]}
                <br /><em style={{ color: '#C4956A' }}>{copy.hero.h1_em[lang]}</em>
              </h1>
              <p className="text-[16px] sm:text-[17px] leading-[1.7] max-w-[540px] mx-auto lg:mx-0 mb-8 animate-[fadeSlideUp_0.7s_ease-out_0.45s_both]" style={{ color: 'rgba(245,240,232,0.75)' }}>{copy.hero.sub[lang]}</p>

              {/* Audience badges */}
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start mb-8 animate-[fadeSlideUp_0.6s_ease-out_0.6s_both]">
                {copy.badges.map((b, i) => (
                  <span key={i} className="text-[12px] font-medium px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(196,149,106,0.15)', color: '#C4956A', border: '1px solid rgba(196,149,106,0.25)' }}>{b[lang]}</span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6 animate-[fadeSlideUp_0.6s_ease-out_0.75s_both]">
                <Link to="/cadastro" className="inline-block text-[16px] font-semibold px-8 py-4 rounded-xl transition-transform hover:scale-[1.02]" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.hero.cta1[lang]}</Link>
                <button onClick={() => scrollTo('how')} className="inline-block text-[15px] font-medium px-7 py-3.5 rounded-xl transition-colors" style={{ border: '1px solid rgba(196,149,106,0.4)', color: 'rgba(245,240,232,0.8)' }}>{copy.hero.cta2[lang]}</button>
              </div>

              <p className="font-display text-[14px] italic animate-[fadeSlideUp_0.6s_ease-out_0.9s_both]" style={{ color: 'rgba(245,240,232,0.35)' }}>{copy.hero.verse[lang]}</p>
            </div>

            {/* Right — iPhone Mockup */}
            <div className="shrink-0" style={{ animation: 'mockupEntrance 1.2s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>
              <div className="relative" style={{ animation: 'heroFloat 5s ease-in-out 1.7s infinite' }}>
                <style>{`
                  @keyframes mockupEntrance {
                    0% { opacity: 0; transform: translateY(40px) scale(0.92); }
                    60% { opacity: 1; transform: translateY(-6px) scale(1.01); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  @keyframes heroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
                `}</style>
                <div className="relative" style={{ width: '300px' }}>
                  {/* Phone frame */}
                  <div className="rounded-[44px] p-[2.5px]" style={{ background: 'linear-gradient(145deg, #6B6B6B 0%, #3A3A3A 30%, #1A1A1A 70%, #3A3A3A 100%)' }}>
                    <div className="rounded-[42px] overflow-hidden" style={{ background: '#111' }}>
                      {/* Dynamic Island */}
                      <div className="flex justify-center pt-2.5 pb-1.5" style={{ background: '#111' }}>
                        <div className="w-[90px] h-[24px] rounded-full" style={{ background: '#000' }} />
                      </div>

                      {/* Screen content */}
                      <div className="mx-[6px] mb-[6px] rounded-b-[36px] overflow-hidden" style={{ background: '#F5F0E8' }}>
                        <div className="px-4 pt-3 pb-5" style={{ minHeight: '520px' }}>
                          {/* Status header */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-[13px] font-bold" style={{ color: '#3D2B1F' }}>Living Word</p>
                              <p className="text-[9px] mt-0.5" style={{ color: '#8B7355' }}>{lang === 'PT' ? 'Olá, Pastor Rafael' : lang === 'EN' ? 'Hello, Pastor Rafael' : 'Hola, Pastor Rafael'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #C4956A, #D4A853)', color: '#fff' }}>PR</div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                              { n: '12', l: lang === 'PT' ? 'Sermões' : lang === 'EN' ? 'Sermons' : 'Sermones', color: '#C4956A' },
                              { n: '8', l: lang === 'PT' ? 'Estudos' : lang === 'EN' ? 'Studies' : 'Estudios', color: '#7B9E6B' },
                              { n: '24', l: lang === 'PT' ? 'Artigos' : lang === 'EN' ? 'Articles' : 'Artículos', color: '#6B8BBE' },
                            ].map((s, i) => (
                              <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(107,79,58,0.08)' }}>
                                <p className="text-[16px] font-bold" style={{ color: s.color }}>{s.n}</p>
                                <p className="text-[8px] font-medium mt-0.5" style={{ color: '#8B7355' }}>{s.l}</p>
                              </div>
                            ))}
                          </div>

                          {/* Tools section */}
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6B4F3A' }}>{lang === 'PT' ? 'Ferramentas' : lang === 'EN' ? 'Tools' : 'Herramientas'}</p>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {[
                              { icon: '📖', l: lang === 'PT' ? 'Estúdio Pastoral' : lang === 'EN' ? 'Pastoral Studio' : 'Estudio Pastoral', accent: '#C4956A' },
                              { icon: '📚', l: lang === 'PT' ? 'Estudo Bíblico' : lang === 'EN' ? 'Bible Study' : 'Estudio Bíblico', accent: '#7B9E6B' },
                              { icon: '✍️', l: lang === 'PT' ? 'Blog & Artigos' : lang === 'EN' ? 'Blog & Articles' : 'Blog y Artículos', accent: '#6B8BBE' },
                              { icon: '🧠', l: lang === 'PT' ? 'Mentes Brilhantes' : lang === 'EN' ? 'Brilliant Minds' : 'Mentes Brillantes', accent: '#9B7EC8' },
                            ].map((t, i) => (
                              <div key={i} className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(107,79,58,0.08)' }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px]" style={{ background: `${t.accent}15` }}>{t.icon}</div>
                                <span className="text-[8px] font-semibold leading-tight" style={{ color: '#3D2B1F' }}>{t.l}</span>
                              </div>
                            ))}
                          </div>

                          {/* AI Generation preview */}
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6B4F3A' }}>{lang === 'PT' ? 'Geração recente' : lang === 'EN' ? 'Recent generation' : 'Generación reciente'}</p>
                          <div className="rounded-xl p-3" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(107,79,58,0.08)' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#C4956A20' }}>
                                <span className="text-[10px]">✨</span>
                              </div>
                              <p className="text-[9px] font-bold" style={{ color: '#3D2B1F' }}>{lang === 'PT' ? 'Sermão: João 15:1-8' : lang === 'EN' ? 'Sermon: John 15:1-8' : 'Sermón: Juan 15:1-8'}</p>
                            </div>
                            <div className="space-y-1.5">
                              <div className="h-[6px] rounded-full" style={{ background: '#E8E0D4', width: '100%' }} />
                              <div className="h-[6px] rounded-full" style={{ background: '#E8E0D4', width: '85%' }} />
                              <div className="h-[6px] rounded-full" style={{ background: '#E8E0D4', width: '70%' }} />
                            </div>
                            <div className="flex gap-1.5 mt-2.5">
                              <span className="text-[7px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#C4956A20', color: '#C4956A' }}>{lang === 'PT' ? 'Sermão' : lang === 'EN' ? 'Sermon' : 'Sermón'}</span>
                              <span className="text-[7px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#7B9E6B20', color: '#7B9E6B' }}>PT</span>
                              <span className="text-[7px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#6B8BBE20', color: '#6B8BBE' }}>{lang === 'PT' ? 'Concluído' : lang === 'EN' ? 'Completed' : 'Completado'}</span>
                            </div>
                          </div>

                          {/* Second recent item */}
                          <div className="rounded-xl p-3 mt-2" style={{ background: '#fff', boxShadow: '0 1px 3px rgba(107,79,58,0.08)' }}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#7B9E6B20' }}>
                                <span className="text-[10px]">📖</span>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold" style={{ color: '#3D2B1F' }}>{lang === 'PT' ? 'Estudo: Romanos 8' : lang === 'EN' ? 'Study: Romans 8' : 'Estudio: Romanos 8'}</p>
                                <p className="text-[7px]" style={{ color: '#8B7355' }}>{lang === 'PT' ? 'Estudo bíblico · PT/EN' : lang === 'EN' ? 'Bible study · PT/EN' : 'Estudio bíblico · PT/EN'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Glow effect */}
                  <div className="absolute -inset-8 -z-10 rounded-[60px] blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #C4956A 0%, transparent 70%)' }} />
                  {/* Reflection */}
                  <div className="absolute -inset-2 -z-10 rounded-[50px] blur-xl opacity-10" style={{ background: '#C4956A' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF BAR ===== */}
      <section className="py-8 px-5" style={{ background: '#F5F0E8' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {copy.stats.map((s, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <div className="hidden sm:block w-px h-12 mx-6 sm:mx-8" style={{ background: 'rgba(107,79,58,0.18)' }} />}
                <div className="text-center px-3 py-2">
                  <div className="font-display text-[34px] sm:text-[38px] font-bold tracking-tight" style={{ color: '#3D2B1F' }}>{s.num}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mt-0.5" style={{ color: '#8B7355' }}>{s.label[lang]}</div>
                </div>
              </div>
            ))}
          </div>
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
                <RevealOnScroll key={i} delay={i * 0.12}>
                  <div className="rounded-xl p-5 h-full" style={{ background: '#F5F0E8', border: '1px solid rgba(107,79,58,0.12)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: '#EDD9C8' }}>
                      <Icon className="h-4 w-4" style={{ color: '#6B4F3A' }} />
                    </div>
                    <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>{c.title[lang]}</h3>
                    <p className="text-[14px] leading-[1.6]" style={{ color: '#6B4F3A' }}>{c.desc[lang]}</p>
                  </div>
                </RevealOnScroll>
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
          <div className="space-y-0 mb-10">
            {copy.how.steps.map((step, i) => (
              <RevealOnScroll key={i} delay={i * 0.18}>
                <div className="flex gap-5 py-5" style={{ borderBottom: i < 2 ? '1px solid rgba(107,79,58,0.1)' : 'none' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display text-xl font-semibold" style={{ background: '#6B4F3A', color: '#F5F0E8' }}>{i + 1}</div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>{step.title[lang]}</h3>
                    <p className="text-[14px] leading-[1.65] mb-2" style={{ color: '#6B4F3A' }}>{step.desc[lang]}</p>
                    <span className="inline-block text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{step.badge[lang]}</span>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* MacBook Mockup */}
          <RevealOnScroll delay={0.3}>
            <div className="max-w-2xl mx-auto">
              <div className="rounded-t-xl overflow-hidden" style={{ background: '#E8E0D4', border: '2px solid rgba(107,79,58,0.15)' }}>
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: '#E8E0D4' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF6B5F' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F5BD4F' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#61C554' }} />
                  <div className="flex-1 text-center">
                    <span className="text-[10px] font-medium px-4 py-0.5 rounded" style={{ background: 'rgba(107,79,58,0.08)', color: '#8B7355' }}>app.livingword.com</span>
                  </div>
                </div>
                <div className="px-4 py-4" style={{ background: '#F5F0E8', minHeight: '260px' }}>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2.5">
                      <p className="text-[11px] font-bold" style={{ color: '#3D2B1F' }}>
                        📖 {lang === 'PT' ? 'Estúdio Pastoral' : lang === 'EN' ? 'Pastoral Studio' : 'Estudio Pastoral'}
                      </p>
                      {[
                        { l: lang === 'PT' ? 'Passagem bíblica' : lang === 'EN' ? 'Bible passage' : 'Pasaje bíblico', v: lang === 'PT' ? 'João 15:1-8' : lang === 'EN' ? 'John 15:1-8' : 'Juan 15:1-8' },
                        { l: lang === 'PT' ? 'Público' : lang === 'EN' ? 'Audience' : 'Público', v: lang === 'PT' ? 'Jovens adultos' : lang === 'EN' ? 'Young adults' : 'Jóvenes adultos' },
                        { l: lang === 'PT' ? 'Tema / Dor' : lang === 'EN' ? 'Topic / Pain' : 'Tema / Dolor', v: lang === 'PT' ? 'Propósito de vida' : lang === 'EN' ? 'Life purpose' : 'Propósito de vida' },
                      ].map((f, i) => (
                        <div key={i}>
                          <p className="text-[7px] font-semibold mb-0.5" style={{ color: '#8B7355' }}>{f.l}</p>
                          <div className="rounded px-2 py-1 text-[8px]" style={{ background: '#fff', border: '1px solid rgba(107,79,58,0.12)', color: '#3D2B1F' }}>{f.v}</div>
                        </div>
                      ))}
                      <div className="flex gap-1.5 pt-1">
                        {['PT', 'EN', 'ES'].map((l) => (
                          <span key={l} className="text-[7px] font-semibold px-2 py-0.5 rounded" style={{ background: l === 'PT' ? '#6B4F3A' : 'rgba(107,79,58,0.1)', color: l === 'PT' ? '#F5F0E8' : '#6B4F3A' }}>{l}</span>
                        ))}
                      </div>
                      <div className="rounded px-3 py-1.5 text-center text-[9px] font-semibold" style={{ background: '#C4956A', color: '#3D2B1F' }}>
                        {lang === 'PT' ? 'Gerar conteúdo →' : lang === 'EN' ? 'Generate content →' : 'Generar contenido →'}
                      </div>
                    </div>
                    <div className="flex-1 hidden sm:block">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[
                          lang === 'PT' ? 'Sermão' : lang === 'EN' ? 'Sermon' : 'Sermón',
                          lang === 'PT' ? 'Devocional' : 'Devotional',
                          lang === 'PT' ? 'Estudo' : lang === 'EN' ? 'Study' : 'Estudio',
                          lang === 'PT' ? 'Artigo' : lang === 'EN' ? 'Article' : 'Artículo',
                          'Blog', lang === 'PT' ? 'Célula' : lang === 'EN' ? 'Small Group' : 'Célula',
                          'EN', 'ES',
                        ].map((tab, i) => (
                          <span key={i} className="text-[7px] font-semibold px-1.5 py-0.5 rounded" style={{ background: i === 0 ? '#6B4F3A' : 'rgba(107,79,58,0.08)', color: i === 0 ? '#F5F0E8' : '#8B7355' }}>{tab}</span>
                        ))}
                      </div>
                      <div className="rounded-lg p-2.5 space-y-1.5" style={{ background: '#fff', border: '1px solid rgba(107,79,58,0.08)' }}>
                        <div className="h-2 rounded w-3/4" style={{ background: '#EDD9C8' }} />
                        <div className="h-1.5 rounded w-full" style={{ background: '#F5F0E8' }} />
                        <div className="h-1.5 rounded w-full" style={{ background: '#F5F0E8' }} />
                        <div className="h-1.5 rounded w-5/6" style={{ background: '#F5F0E8' }} />
                        <div className="h-1.5 rounded w-full" style={{ background: '#F5F0E8' }} />
                        <div className="h-1.5 rounded w-2/3" style={{ background: '#F5F0E8' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-3 rounded-b-lg mx-8" style={{ background: '#D5CCBE', borderTop: '1px solid rgba(107,79,58,0.1)' }} />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.features.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#3D2B1F' }}>{copy.features.h2[lang]}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: { PT: 'Sermão Completo', EN: 'Full Sermon', ES: 'Sermón Completo' }, desc: { PT: 'Estrutura completa com introdução, desenvolvimento, aplicação e fechamento — a partir de qualquer passagem bíblica.', EN: 'Complete structure with introduction, development, application and closing — from any Bible passage.', ES: 'Estructura completa con introducción, desarrollo, aplicación y cierre — a partir de cualquier pasaje bíblico.' } },
              { icon: BookOpen, title: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' }, desc: { PT: 'Reflexão pastoral profunda com aplicação prática para a vida diária. Ideal para blogs, boletins e redes.', EN: 'Deep pastoral reflection with practical daily application. Ideal for blogs, bulletins and social media.', ES: 'Reflexión pastoral profunda con aplicación práctica para la vida diaria. Ideal para blogs, boletines y redes.' } },
              { icon: BookOpen, title: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, desc: { PT: 'Análise exegética completa: contexto histórico, significado original, paralelos e aplicação pastoral.', EN: 'Complete exegetical analysis: historical context, original meaning, parallels and pastoral application.', ES: 'Análisis exegético completo: contexto histórico, significado original, paralelos y aplicación pastoral.' } },
              { icon: PenTool, title: { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' }, desc: { PT: 'Artigo devocional completo pronto para publicar no blog integrado ou exportar para WordPress.', EN: 'Complete devotional article ready to publish on the integrated blog or export to WordPress.', ES: 'Artículo devocional completo listo para publicar en el blog integrado o exportar a WordPress.' } },
              { icon: Users, title: { PT: 'Material de Célula', EN: 'Small Group Material', ES: 'Material de Célula' }, desc: { PT: 'Roteiro completo com perguntas de discussão, dinâmica de grupo e aplicação prática.', EN: 'Complete script with discussion questions, group dynamics and practical application.', ES: 'Guión completo con preguntas de discusión, dinámica de grupo y aplicación práctica.' } },
              { icon: Globe, title: { PT: 'Versão em Inglês', EN: 'English Version', ES: 'Versión en Inglés' }, desc: { PT: 'Conteúdo gerado nativamente em inglês — não tradução automática. Ideal para ministérios bilíngues.', EN: 'Content natively generated in English — not automatic translation. Ideal for bilingual ministries.', ES: 'Contenido generado nativamente en inglés — no traducción automática. Ideal para ministerios bilingües.' } },
              { icon: Globe, title: { PT: 'Versión Español', EN: 'Spanish Version', ES: 'Versión en Español' }, desc: { PT: 'Conteúdo gerado nativamente em espanhol — com voz pastoral autêntica e contexto cultural hispânico.', EN: 'Content natively generated in Spanish — with authentic pastoral voice and Hispanic cultural context.', ES: 'Contenido generado nativamente en español — con voz pastoral auténtica y contexto cultural hispánico.' } },
              { icon: Layers, title: { PT: 'Esboço de Sermão', EN: 'Sermon Outline', ES: 'Bosquejo de Sermón' }, desc: { PT: '3 pontos estruturados com aplicação, ilustrações e fechamento — prontos para personalizar.', EN: '3 structured points with application, illustrations and closing — ready to customize.', ES: '3 puntos estructurados con aplicación, ilustraciones y cierre — listos para personalizar.' } },
              { icon: Share2, title: { PT: 'Conteúdo para Redes', EN: 'Social Media Content', ES: 'Contenido para Redes' }, desc: { PT: 'Legendas, roteiros de Reels e posts com hashtags e CTAs — prontos para Instagram e Facebook.', EN: 'Captions, Reels scripts and posts with hashtags and CTAs — ready for Instagram and Facebook.', ES: 'Leyendas, guiones de Reels y posts con hashtags y CTAs — listos para Instagram y Facebook.' } },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <RevealOnScroll key={i} delay={i * 0.06}>
                  <div className="rounded-xl p-5 h-full transition-transform hover:scale-[1.02] hover:shadow-md" style={{ border: '1px solid rgba(107,79,58,0.1)', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(61,43,31,0.06)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F5F0E8' }}>
                      <Icon className="h-[18px] w-[18px]" style={{ color: '#6B4F3A' }} />
                    </div>
                    <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>{card.title[lang]}</h3>
                    <p className="text-[14px] leading-[1.6]" style={{ color: '#6B4F3A' }}>{card.desc[lang]}</p>
                  </div>
                </RevealOnScroll>
              );
            })}

            {copy.features.items.map((f, i) => {
              const Icon = f.icon;
              return (
                <RevealOnScroll key={`feat-${i}`} delay={(8 + i) * 0.06}>
                  <div className="rounded-xl p-5 h-full" style={{ border: '1px solid rgba(107,79,58,0.1)', background: '#FFFFFF' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F5F0E8' }}>
                      <Icon className="h-[18px] w-[18px]" style={{ color: '#6B4F3A' }} />
                    </div>
                    <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#3D2B1F' }}>
                      {f.title[lang]}
                      {f.unique && <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{lang === 'PT' ? 'único' : lang === 'EN' ? 'unique' : 'único'}</span>}
                    </h3>
                    <p className="text-[14px] leading-[1.6]" style={{ color: '#6B4F3A' }}>{f.desc[lang]}</p>
                  </div>
                </RevealOnScroll>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {copy.testimonials.itemsByLang[lang].map((t, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(107,79,58,0.08)', boxShadow: '0 1px 4px rgba(107,79,58,0.04)' }}>
                <p className="text-[15px] italic leading-[1.7] mb-5 font-light" style={{ color: '#3D2B1F', fontFamily: "'Cormorant Garamond', serif", fontSize: '17px' }}>{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 tracking-wide" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{t.initials}</div>
                  <div>
                    <p className="text-[13.5px] font-semibold" style={{ color: '#3D2B1F' }}>{t.name} {t.flag}</p>
                    <p className="text-[11.5px] font-medium tracking-wide" style={{ color: '#8B7355' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MENTES BRILHANTES ===== */}
      <section className="py-16 sm:py-24 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,149,106,0.15)' }}>
                <Brain className="w-5 h-5" style={{ color: '#C4956A' }} />
              </div>
              <Sparkles className="w-4 h-4" style={{ color: '#C4956A' }} />
            </div>
            <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>
              {lang === 'PT' ? 'Mentes Brilhantes' : lang === 'EN' ? 'Brilliant Minds' : 'Mentes Brillantes'}
            </p>
            <h2 className="font-display text-[30px] sm:text-[40px] font-semibold leading-tight mb-4" style={{ color: '#3D2B1F' }}>
              {lang === 'PT' ? 'Converse com as maiores mentes da pregação cristã.' : lang === 'EN' ? 'Chat with the greatest minds in Christian preaching.' : 'Conversa con las mayores mentes de la predicación cristiana.'}
            </h2>
            <p className="text-[16px] sm:text-[17px] leading-relaxed max-w-2xl mx-auto" style={{ color: '#6B4F3A' }}>
              {lang === 'PT'
                ? 'Cada mentor foi treinado com centenas de horas de material original — sermões, livros, cartas e teologia. Pergunte, aprenda e crie conteúdo inspirado pela voz dos gigantes da fé.'
                : lang === 'EN'
                  ? 'Each mentor was trained on hundreds of hours of original material — sermons, books, letters, and theology. Ask, learn, and create content inspired by the voice of the giants of faith.'
                  : 'Cada mentor fue entrenado con cientos de horas de material original — sermones, libros, cartas y teología. Pregunta, aprende y crea contenido inspirado por la voz de los gigantes de la fe.'}
            </p>
          </div>

          {/* Stats bar */}
          <div className="rounded-2xl p-5 sm:p-6 mb-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10" style={{ background: '#F5F0E8', border: '1px solid rgba(107,79,58,0.08)' }}>
            {[
              { value: '168M+', label: { PT: 'Tokens de Contexto', EN: 'Context Tokens', ES: 'Tokens de Contexto' } },
              { value: '30,000+', label: { PT: 'Páginas Processadas', EN: 'Pages Processed', ES: 'Páginas Procesadas' } },
              { value: '4', label: { PT: 'Agentes Ativos', EN: 'Active Agents', ES: 'Agentes Activos' } },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-[22px] sm:text-[26px] font-bold" style={{ color: '#3D2B1F' }}>{stat.value}</p>
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: '#8B7355' }}>{stat.label[lang]}</p>
              </div>
            ))}
          </div>

          {/* Mind Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {minds.filter(m => m.id !== 'marco-feliciano' && m.id !== 'tiago-brunet' && m.id !== 'martyn-lloyd-jones').map((mind) => (
              <div
                key={mind.id}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                style={{ background: '#FFFFFF', border: '1px solid rgba(107,79,58,0.1)' }}
              >
                {/* Card Header */}
                <div className="pt-6 pb-4 px-6 text-center" style={{ background: 'linear-gradient(to bottom, rgba(237,217,200,0.3), transparent)' }}>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <img
                      src={mind.image}
                      alt={mind.name}
                      className="w-20 h-20 rounded-full object-cover border-2"
                      style={{ borderColor: 'rgba(196,149,106,0.3)' }}
                      loading="lazy"
                    />
                    <span className="absolute -bottom-1 -right-1 text-base">{mind.flag}</span>
                  </div>
                  <h3 className="text-[18px] font-bold" style={{ color: '#3D2B1F' }}>{mind.name}</h3>
                  <p className="font-display text-[14px] italic mt-0.5" style={{ color: '#C4956A' }}>{mind.subtitle[lang]}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#4CAF50' }} />
                    <span className="text-[12px] font-medium" style={{ color: '#4CAF50' }}>Online</span>
                  </div>
                </div>

                {/* Badge */}
                <div className="px-6 pb-3 text-center">
                  <span className="inline-block text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(196,149,106,0.1)', color: '#6B4F3A', border: '1px solid rgba(196,149,106,0.2)' }}>
                    {mind.role[lang]}
                  </span>
                </div>

                {/* Bio excerpt */}
                <div className="px-6 pb-4">
                  <p className="text-[13.5px] leading-[1.65] line-clamp-3" style={{ color: '#6B4F3A' }}>
                    {mind.bio[lang]}
                  </p>
                </div>

                {/* Specialties */}
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {mind.specialties.slice(0, 3).map((s, si) => (
                      <span key={si} className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,240,232,0.8)', color: '#8B7355' }}>
                        {s[lang]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats footer */}
                <div className="px-6 pb-5 flex items-center gap-4 text-[11px]" style={{ color: '#8B7355' }}>
                  {mind.badges.slice(0, 2).map((b, bi) => (
                    <span key={bi} className="flex items-center gap-1">
                      {bi === 0 ? <BookOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {b[lang]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <p className="text-[14px] mb-4" style={{ color: '#6B4F3A' }}>
              {lang === 'PT'
                ? 'Converse com os gigantes da fé e crie conteúdo inspirado na tradição cristã.'
                : lang === 'EN'
                  ? 'Chat with the giants of faith and create content inspired by Christian tradition.'
                  : 'Conversa con los gigantes de la fe y crea contenido inspirado en la tradición cristiana.'}
            </p>
            <Link to="/cadastro">
              <button
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-[15px] font-semibold text-white transition-all duration-200 hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #6B4F3A, #3D2B1F)' }}
              >
                <MessageCircle className="w-4 h-4" />
                {lang === 'PT' ? 'Experimentar Mentes Brilhantes' : lang === 'EN' ? 'Try Brilliant Minds' : 'Probar Mentes Brillantes'}
              </button>
            </Link>
          </div>
        </div>
      </section>


      <section id="pricing" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.pricing.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#3D2B1F' }}>{copy.pricing.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionLoading ? (
              [0,1,2,3].map(i => (
                <div key={i} className="rounded-xl p-5 flex flex-col gap-3 animate-pulse" style={{ background: '#FFFFFF', border: '1px solid rgba(107,79,58,0.12)' }}>
                  <div className="h-4 w-16 rounded" style={{ background: '#EDD9C8' }} />
                  <div className="h-9 w-24 rounded" style={{ background: '#EDD9C8' }} />
                  <div className="h-3 w-20 rounded" style={{ background: '#EDD9C8' }} />
                  <div className="space-y-2 mt-4">
                    {[0,1,2,3].map(j => <div key={j} className="h-3 w-full rounded" style={{ background: '#EDD9C8' }} />)}
                  </div>
                  <div className="h-10 w-full rounded-lg mt-auto" style={{ background: '#EDD9C8' }} />
                </div>
              ))
            ) : (
              pricingPlans.map((plan, i) => (
              <div key={i} className="rounded-xl p-5 flex flex-col" style={{
                background: plan.featured ? '#F5F0E8' : '#FFFFFF',
                border: plan.featured ? '2px solid #6B4F3A' : '1px solid rgba(107,79,58,0.12)',
              }}>
                {plan.featured && (
                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2 self-start" style={{ background: '#6B4F3A', color: '#F5F0E8' }}>
                    {lang === 'PT' ? 'Mais escolhido' : lang === 'EN' ? 'Most popular' : 'Más elegido'}
                  </span>
                )}
                <p className="text-[15px] font-semibold mb-1" style={{ color: '#3D2B1F' }}>{plan.name[lang]}</p>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="font-display text-[32px] font-semibold" style={{ color: '#3D2B1F' }}>{plan.price}</span>
                </div>
                <p className="text-[13px] mb-2 font-medium" style={{ color: '#6B4F3A' }}>{plan.period[lang]}</p>
                <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4 self-start" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>
                  {plan.capacity[lang]}
                </span>
                <div className="space-y-2 mb-4 flex-1 pt-3" style={{ borderTop: '1px solid rgba(107,79,58,0.1)' }}>
                  {plan.features[lang].map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-[14px]" style={{ color: '#3D2B1F' }}>
                      <span className="shrink-0 font-semibold" style={{ color: '#6B4F3A' }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to={plan.planKey ? `/cadastro?plan=${plan.planKey}` : '/cadastro'} className="block text-center text-[14px] font-semibold py-3 rounded-lg transition-transform hover:scale-[1.02]" style={{
                  background: plan.featured ? '#6B4F3A' : '#EDD9C8',
                  color: plan.featured ? '#FFFFFF' : '#6B4F3A',
                }}>{plan.cta[lang]}</Link>
              </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#F5F0E8' }} itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-5xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.faq.tag[lang]}</p>
          <h2 className="font-display text-[30px] sm:text-[36px] font-semibold leading-tight mb-6" style={{ color: '#3D2B1F' }}>{copy.faq.h2[lang]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {copy.faq.items.map((item, i) => (
              <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-xl p-5 transition-shadow hover:shadow-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(107,79,58,0.1)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold" itemProp="name" style={{ color: '#3D2B1F' }}>{item.q[lang]}</h3>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: '#6B4F3A' }} />
                  </div>
                  {openFaq === i && (
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p className="text-[15px] leading-[1.65] mt-3" itemProp="text" style={{ color: '#6B4F3A' }}>{item.a[lang]}</p>
                    </div>
                  )}
                </button>
              </div>
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
            <span className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.4)' }}>{lang === 'PT' ? 'Termos' : lang === 'EN' ? 'Terms' : 'Términos'}</span>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(245,240,232,0.4)' }}>{lang === 'PT' ? 'Contato' : lang === 'EN' ? 'Contact' : 'Contacto'}</span>
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
