import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { usePageviewTracker } from '@/hooks/use-pageview-tracker';
import { formatPrice } from '@/utils/geoPricing';
import { useGeoRegion } from '@/hooks/useGeoRegion';

import { minds } from '@/data/minds';
import {
  Clock, Languages, Zap, Lock, FileText, Globe, Users, Mic, Calendar,
  ChevronDown, Check, X as XIcon, Menu, X, BookOpen, PenTool,
  Share2, Layers, Shield, Sparkles, Brain, MessageCircle, ArrowRight, Search
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

/* ── PWA install button (always visible in footer) ── */
function PWAFooterInstallButton({ lang }: { lang: L }) {
  const { isInstallable, install } = usePWAInstall();
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  useEffect(() => { setIsStandalone(window.matchMedia('(display-mode: standalone)').matches); }, []);
  if (isStandalone) return null;

  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const label = { PT: '📱 Baixe o nosso App', EN: '📱 Download our App', ES: '📱 Descarga nuestra App' };
  const iosHint = {
    PT: 'No iPhone: toque em Compartilhar e em "Adicionar à Tela de Início" para instalar.',
    EN: 'On iPhone: tap Share, then "Add to Home Screen" to install.',
    ES: 'En iPhone: toca Compartir y "Añadir a pantalla de inicio" para instalar.',
  };

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (isIos) {
      setShowIosHint(true);
      return;
    }
    // Desktop browser without install prompt — guide to use browser menu
    setShowIosHint(true);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-all hover:scale-[1.03]"
        style={{ background: '#6D28D9', color: '#FFFFFF' }}
      >
        {label[lang]}
      </button>
      {showIosHint && (
        <p className="text-[11px] max-w-xs text-center leading-relaxed" style={{ color: 'rgba(232,224,245,0.55)' }}>
          {isIos ? iosHint[lang] : (lang === 'PT' ? 'Use o menu do seu navegador para instalar como aplicativo.' : lang === 'EN' ? 'Use your browser menu to install as an app.' : 'Usa el menú de tu navegador para instalar como aplicación.')}
        </p>
      )}
    </div>
  );
}

/* ── Scroll reveal wrapper ── */
function RevealOnScroll({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*                      COPY                       */
/* ═══════════════════════════════════════════════ */

const copy = {
  nav: {
    how: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
    features: { PT: 'Funcionalidades', EN: 'Features', ES: 'Funcionalidades' },
    plans: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
    cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
    login: { PT: 'Entrar', EN: 'Sign in', ES: 'Iniciar sesión' },
  },

  /* ── HERO (reescrito) ── */
  hero: {
    eyebrow: {
      PT: 'IA bíblica para pastores e líderes · PT · EN · ES',
      EN: 'Biblical AI for pastors & leaders · PT · EN · ES',
      ES: 'IA bíblica para pastores y líderes · PT · EN · ES',
    },
    h1: {
      PT: 'Prepare sermões, estudos e conteúdos bíblicos com profundidade',
      EN: 'Prepare sermons, Bible studies, and biblical content with depth',
      ES: 'Prepara sermones, estudios y contenidos bíblicos con profundidad',
    },
    h1_em: {
      PT: '— sem perder horas em pesquisa.',
      EN: '— without losing hours to research.',
      ES: '— sin perder horas en investigación.',
    },
    sub: {
      PT: 'Living Word é a plataforma de IA treinada nas Escrituras que ajuda pastores, líderes e estudiosos da Bíblia a pesquisar com profundidade, estruturar mensagens e transformar estudo em conteúdo publicável — em minutos, em português, inglês e espanhol.',
      EN: 'Living Word is the AI platform trained on Scripture that helps pastors, leaders and Bible scholars research in depth, structure messages and transform study into publishable content — in minutes, in Portuguese, English and Spanish.',
      ES: 'Living Word es la plataforma de IA entrenada en las Escrituras que ayuda a pastores, líderes y estudiosos de la Biblia a investigar con profundidad, estructurar mensajes y transformar estudio en contenido publicable — en minutos, en portugués, inglés y español.',
    },
    cta1: { PT: 'Começar grátis →', EN: 'Start free →', ES: 'Empezar gratis →' },
    cta2: { PT: 'Ver como funciona', EN: 'See how it works', ES: 'Ver cómo funciona' },
    verse: {
      PT: '"A Palavra de Deus não está acorrentada." — 2 Timóteo 2:9',
      EN: '"God\'s word is not chained." — 2 Timothy 2:9',
      ES: '"La Palabra de Dios no está encadenada." — 2 Timoteo 2:9',
    },
  },

  /* ── PROOF BAR (ajustada — foco em resultado) ── */
  stats: [
    { num: '3', label: { PT: 'Idiomas nativos', EN: 'Native languages', ES: 'Idiomas nativos' } },
    { num: '7+', label: { PT: 'Formatos por geração', EN: 'Formats per generation', ES: 'Formatos por generación' } },
    { num: '∞', label: { PT: 'Pesquisa bíblica com contexto', EN: 'Biblical research with context', ES: 'Investigación bíblica con contexto' } },
    { num: '~3 min', label: { PT: 'Do texto ao conteúdo', EN: 'From text to content', ES: 'Del texto al contenido' } },
    { num: '$0', label: { PT: 'Para começar', EN: 'To get started', ES: 'Para empezar' } },
  ],

  /* ── PROBLEM (refinado) ── */
  problem: {
    tag: { PT: 'O problema real', EN: 'The real problem', ES: 'El problema real' },
    h2: {
      PT: 'Você não precisa gastar horas pesquisando para preparar uma mensagem fiel e clara.',
      EN: 'You don\'t need to spend hours researching to prepare a faithful and clear message.',
      ES: 'No necesitas gastar horas investigando para preparar un mensaje fiel y claro.',
    },
    sub: {
      PT: 'Preparar um sermão ou estudo bíblico exige pesquisa, exegese e tempo. A maioria dos pastores trabalha a semana toda e não tem horas sobrando. A IA genérica não entende teologia. Seu conteúdo morre no domingo.',
      EN: 'Preparing a sermon or Bible study takes research, exegesis and time. Most pastors work all week with no hours to spare. Generic AI doesn\'t understand theology. Your content dies on Sunday.',
      ES: 'Preparar un sermón o estudio bíblico exige investigación, exégesis y tiempo. La mayoría de los pastores trabaja toda la semana sin horas de sobra. La IA genérica no entiende teología. Tu contenido muere el domingo.',
    },
    cards: [
      {
        icon: Clock,
        title: { PT: 'Falta de tempo', EN: 'Lack of time', ES: 'Falta de tiempo' },
        desc: {
          PT: 'Consultar comentários, versões bíblicas, contexto histórico e aplicação leva horas. O Living Word faz isso em minutos, com profundidade real.',
          EN: 'Checking commentaries, Bible versions, historical context and application takes hours. Living Word does it in minutes, with real depth.',
          ES: 'Consultar comentarios, versiones bíblicas, contexto histórico y aplicación toma horas. Living Word lo hace en minutos, con profundidad real.',
        },
      },
      {
        icon: Search,
        title: { PT: 'Pesquisa espalhada', EN: 'Scattered research', ES: 'Investigación dispersa' },
        desc: {
          PT: 'Cadernos, abas abertas, PDFs, Strong\'s, concordâncias. O Living Word centraliza tudo: exegese, paralelos e contexto em um lugar.',
          EN: 'Notebooks, open tabs, PDFs, Strong\'s, concordances. Living Word centralizes everything: exegesis, parallels and context in one place.',
          ES: 'Cuadernos, pestañas abiertas, PDFs, Strong\'s, concordancias. Living Word centraliza todo: exégesis, paralelos y contexto en un lugar.',
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
        title: { PT: 'A mensagem morre no domingo', EN: 'The message dies on Sunday', ES: 'El mensaje muere el domingo' },
        desc: {
          PT: 'Seu estudo e sermão merecem circular. Com o Living Word, o que você já estuda vira conteúdo publicável e distribuível em múltiplos formatos.',
          EN: 'Your study and sermon deserve to circulate. With Living Word, what you already study becomes publishable, distributable content in multiple formats.',
          ES: 'Tu estudio y sermón merecen circular. Con Living Word, lo que ya estudias se convierte en contenido publicable y distribuible en múltiples formatos.',
        },
      },
    ],
  },

  /* ── HOW IT WORKS (fortalecido — 3 passos) ── */
  how: {
    tag: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
    h2: {
      PT: 'Da sua passagem ao conteúdo pronto em 3 passos.',
      EN: 'From your passage to ready content in 3 steps.',
      ES: 'De tu pasaje al contenido listo en 3 pasos.',
    },
    steps: [
      {
        title: {
          PT: 'Escolha a passagem, o tema ou a necessidade',
          EN: 'Choose the passage, topic or need',
          ES: 'Elige el pasaje, el tema o la necesidad',
        },
        desc: {
          PT: 'Informe a passagem bíblica, o público da sua congregação e o que quer criar. Três campos, sem formulário longo.',
          EN: 'Enter the Bible passage, your audience and what you want to create. Three fields, no long forms.',
          ES: 'Ingresa el pasaje bíblico, tu público y lo que quieres crear. Tres campos, sin formularios largos.',
        },
        badge: {
          PT: 'João 15:1-8 · Jovens · Propósito de vida',
          EN: 'John 15:1-8 · Youth · Life purpose',
          ES: 'Juan 15:1-8 · Jóvenes · Propósito de vida',
        },
      },
      {
        title: {
          PT: 'A IA pesquisa, organiza e gera com contexto real',
          EN: 'AI researches, organizes and generates with real context',
          ES: 'La IA investiga, organiza y genera con contexto real',
        },
        desc: {
          PT: 'Treinada em Bíblias originais e modernas, a IA faz a pesquisa profunda que levaria horas — contexto histórico, exegese, paralelos bíblicos — e gera conteúdo com sua voz e doutrina.',
          EN: 'Trained on original and modern Bibles, the AI does deep research that would take hours — historical context, exegesis, biblical parallels — and generates content with your voice and doctrine.',
          ES: 'Entrenada en Biblias originales y modernas, la IA hace la investigación profunda que tomaría horas — contexto histórico, exégesis, paralelos bíblicos — y genera contenido con tu voz y doctrina.',
        },
        badge: {
          PT: 'Guardrails teológicos · Exegese real · Sua voz',
          EN: 'Theological guardrails · Real exegesis · Your voice',
          ES: 'Guardrails teológicos · Exégesis real · Tu voz',
        },
      },
      {
        title: {
          PT: 'Revise, adapte e publique',
          EN: 'Review, adapt and publish',
          ES: 'Revisa, adapta y publica',
        },
        desc: {
          PT: 'Sermão, devocional, estudo, artigo, célula, versão em EN e ES — tudo pronto. Publique no blog integrado, exporte para Word/PDF ou compartilhe.',
          EN: 'Sermon, devotional, study, article, small group, EN & ES version — all ready. Publish on the blog, export to Word/PDF or share.',
          ES: 'Sermón, devocional, estudio, artículo, célula, versión en EN y ES — todo listo. Publica en el blog, exporta a Word/PDF o comparte.',
        },
        badge: {
          PT: 'Blog · Word · PDF · 7+ formatos',
          EN: 'Blog · Word · PDF · 7+ formats',
          ES: 'Blog · Word · PDF · 7+ formatos',
        },
      },
    ],
  },

  /* ── NOVA SEÇÃO: Uma passagem → vários formatos ── */
  multiformat: {
    tag: { PT: 'O poder da transformação', EN: 'The power of transformation', ES: 'El poder de la transformación' },
    h2: {
      PT: 'Uma passagem. Vários formatos. Mais alcance.',
      EN: 'One passage. Multiple formats. More reach.',
      ES: 'Un pasaje. Varios formatos. Más alcance.',
    },
    sub: {
      PT: 'A partir de uma única passagem bíblica, o Living Word gera conteúdo pronto em múltiplos formatos — cada um otimizado para um público e canal diferente.',
      EN: 'From a single Bible passage, Living Word generates ready content in multiple formats — each optimized for a different audience and channel.',
      ES: 'A partir de un único pasaje bíblico, Living Word genera contenido listo en múltiples formatos — cada uno optimizado para un público y canal diferente.',
    },
    input: {
      passage: { PT: 'João 15:1-8', EN: 'John 15:1-8', ES: 'Juan 15:1-8' },
      theme: { PT: 'Permanecer em Cristo', EN: 'Abiding in Christ', ES: 'Permanecer en Cristo' },
    },
    outputs: [
      { icon: '📖', label: { PT: 'Sermão completo', EN: 'Full sermon', ES: 'Sermón completo' } },
      { icon: '📚', label: { PT: 'Estudo bíblico', EN: 'Bible study', ES: 'Estudio bíblico' } },
      { icon: '🕊️', label: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' } },
      { icon: '✍️', label: { PT: 'Artigo de blog', EN: 'Blog article', ES: 'Artículo de blog' } },
      { icon: '👥', label: { PT: 'Material de célula', EN: 'Small group material', ES: 'Material de célula' } },
      { icon: '📱', label: { PT: 'Pontos para Reels', EN: 'Reels talking points', ES: 'Puntos para Reels' } },
      { icon: '🇬🇧', label: { PT: 'Versão em inglês', EN: 'English version', ES: 'Versión en inglés' } },
      { icon: '🇪🇸', label: { PT: 'Versão em espanhol', EN: 'Spanish version', ES: 'Versión en español' } },
    ],
  },

  /* ── FEATURES (6 principais com prioridade) ── */
  features: {
    tag: { PT: 'Funcionalidades', EN: 'Features', ES: 'Funcionalidades' },
    h2: {
      PT: 'Tudo o que você precisa para estudar, preparar e publicar a Palavra.',
      EN: 'Everything you need to study, prepare and publish the Word.',
      ES: 'Todo lo que necesitas para estudiar, preparar y publicar la Palabra.',
    },
    primary: [
      { icon: FileText, title: { PT: 'Sermão Completo', EN: 'Full Sermon', ES: 'Sermón Completo' }, desc: { PT: 'Estrutura completa com introdução, desenvolvimento, aplicação e fechamento — a partir de qualquer passagem bíblica.', EN: 'Complete structure with introduction, development, application and closing — from any Bible passage.', ES: 'Estructura completa con introducción, desarrollo, aplicación y cierre — a partir de cualquier pasaje bíblico.' } },
      { icon: BookOpen, title: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, desc: { PT: 'Análise exegética completa: contexto histórico, significado original, paralelos e aplicação pastoral.', EN: 'Complete exegetical analysis: historical context, original meaning, parallels and pastoral application.', ES: 'Análisis exegético completo: contexto histórico, significado original, paralelos y aplicación pastoral.' } },
      { icon: PenTool, title: { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' }, desc: { PT: 'Artigo devocional completo pronto para publicar no blog integrado ou exportar para WordPress.', EN: 'Complete devotional article ready to publish on the integrated blog or export to WordPress.', ES: 'Artículo devocional completo listo para publicar en el blog integrado o exportar a WordPress.' } },
      { icon: BookOpen, title: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' }, desc: { PT: 'Reflexão pastoral profunda com aplicação prática para a vida diária. Ideal para blogs, boletins e redes.', EN: 'Deep pastoral reflection with practical daily application. Ideal for blogs, bulletins and social media.', ES: 'Reflexión pastoral profunda con aplicación práctica para la vida diaria. Ideal para blogs, boletines y redes.' } },
      { icon: Users, title: { PT: 'Material de Célula', EN: 'Small Group Material', ES: 'Material de Célula' }, desc: { PT: 'Roteiro completo com perguntas de discussão, dinâmica de grupo e aplicação prática.', EN: 'Complete script with discussion questions, group dynamics and practical application.', ES: 'Guión completo con preguntas de discusión, dinámica de grupo y aplicación práctica.' } },
      { icon: Globe, title: { PT: 'PT · EN · ES Nativo', EN: 'PT · EN · ES Native', ES: 'PT · EN · ES Nativo' }, desc: { PT: 'Conteúdo nativo em cada idioma — não tradução automática. Ideal para ministérios multilíngues.', EN: 'Native content in each language — not auto-translation. Ideal for multilingual ministries.', ES: 'Contenido nativo en cada idioma — no traducción automática. Ideal para ministerios multilingües.' } },
    ],
    secondary: [
      { icon: Layers, title: { PT: 'Esboço de Sermão', EN: 'Sermon Outline', ES: 'Bosquejo de Sermón' }, desc: { PT: '3 pontos estruturados com aplicação e fechamento — prontos para personalizar.', EN: '3 structured points with application and closing — ready to customize.', ES: '3 puntos estructurados con aplicación y cierre — listos para personalizar.' } },
      { icon: Share2, title: { PT: 'Conteúdo para Redes', EN: 'Social Media Content', ES: 'Contenido para Redes' }, desc: { PT: 'Legendas, roteiros de Reels e posts prontos para Instagram e Facebook.', EN: 'Captions, Reels scripts and posts ready for Instagram and Facebook.', ES: 'Leyendas, guiones de Reels y posts listos para Instagram y Facebook.' } },
      { icon: Sparkles, title: { PT: 'IA treinada nas Escrituras', EN: 'AI trained on Scripture', ES: 'IA entrenada en las Escrituras' }, desc: { PT: 'Pesquisa profunda em Bíblias originais e modernas — exegese e contexto em segundos.', EN: 'Deep research on original and modern Bibles — exegesis and context in seconds.', ES: 'Investigación profunda en Biblias originales y modernas — exégesis y contexto en segundos.' } },
      { icon: Shield, title: { PT: 'Guardrails teológicos', EN: 'Theological guardrails', ES: 'Guardrails teológicos' }, desc: { PT: 'Exegese antes de aplicação. Distinção entre texto, interpretação e aplicação prática.', EN: 'Exegesis before application. Text, interpretation and application distinction.', ES: 'Exégesis antes de aplicación. Distinción entre texto, interpretación y aplicación.' } },
      { icon: Mic, title: { PT: 'Sua voz pastoral', EN: 'Your pastoral voice', ES: 'Tu voz pastoral' }, desc: { PT: 'Expositivo, narrativo, apologético — o conteúdo soa como você ensina.', EN: 'Expository, narrative, apologetic — content sounds like you teach.', ES: 'Expositivo, narrativo, apologético — el contenido suena como tú enseñas.' } },
      { icon: Calendar, title: { PT: 'Calendário Editorial', EN: 'Editorial Calendar', ES: 'Calendario Editorial' }, desc: { PT: 'Planeje e organize suas publicações semanais com agendamento integrado ao blog.', EN: 'Plan and organize your weekly publications with scheduling integrated to your blog.', ES: 'Planifica y organiza tus publicaciones semanales con programación integrada al blog.' } },
    ],
  },

  /* ── VS COMPETITORS (mais objetiva) ── */
  vs: {
    h2: {
      PT: 'Outras IAs geram texto. Living Word gera conteúdo bíblico com exegese real.',
      EN: 'Other AIs generate text. Living Word generates biblical content with real exegesis.',
      ES: 'Otras IAs generan texto. Living Word genera contenido bíblico con exégesis real.',
    },
    them: { PT: 'IA genérica (ChatGPT, etc.)', EN: 'Generic AI (ChatGPT, etc.)', ES: 'IA genérica (ChatGPT, etc.)' },
    us: { PT: 'Living Word', EN: 'Living Word', ES: 'Living Word' },
    xItems: [
      { PT: 'Texto genérico sem profundidade bíblica', EN: 'Generic text without biblical depth', ES: 'Texto genérico sin profundidad bíblica' },
      { PT: 'Sem linha doutrinária clara', EN: 'No clear doctrinal line', ES: 'Sin línea doctrinal clara' },
      { PT: 'Sem fluxo pastoral integrado', EN: 'No integrated pastoral workflow', ES: 'Sin flujo pastoral integrado' },
      { PT: 'Sem publicação — você copia e cola', EN: 'No publishing — you copy and paste', ES: 'Sin publicación — copias y pegas' },
      { PT: 'Sem suporte a PT, EN e ES nativos', EN: 'No native PT, EN and ES support', ES: 'Sin soporte nativo a PT, EN y ES' },
    ],
    checkItems: [
      { PT: 'Contexto bíblico e exegese profunda', EN: 'Biblical context and deep exegesis', ES: 'Contexto bíblico y exégesis profunda' },
      { PT: 'Estrutura pastoral e doutrinária', EN: 'Pastoral and doctrinal structure', ES: 'Estructura pastoral y doctrinal' },
      { PT: '7+ formatos em uma geração', EN: '7+ formats in one generation', ES: '7+ formatos en una generación' },
      { PT: 'Trilíngue nativo: PT · EN · ES', EN: 'Native trilingual: PT · EN · ES', ES: 'Trilingüe nativo: PT · EN · ES' },
      { PT: 'Blog e publicação automática integrada', EN: 'Blog and auto-publishing built in', ES: 'Blog y publicación automática integrada' },
    ],
  },

  /* ── TESTIMONIALS (reforçados) ── */
  testimonials: {
    tag: { PT: 'Quem usa', EN: 'Who uses it', ES: 'Quién lo usa' },
    h2: {
      PT: 'Pastores e líderes que já economizam horas toda semana.',
      EN: 'Pastors and leaders already saving hours every week.',
      ES: 'Pastores y líderes que ya ahorran horas cada semana.',
    },
    itemsByLang: {
      PT: [
        { quote: '"Eu passava 6 horas por semana pesquisando comentários e versões bíblicas. Com o Living Word, faço a mesma pesquisa em 10 minutos — com mais profundidade."', name: 'Pr. João Silva', flag: '🇧🇷', initials: 'JS', role: 'Pastor titular · Igreja Evangélica Brasileira · Atlanta, GA' },
        { quote: '"Sou líder de célula e antes improvisava. Agora chego toda semana com devocional, perguntas de discussão e contexto histórico — tudo com um clique."', name: 'Ana Cruz', flag: '🇧🇷', initials: 'AC', role: 'Líder de célula de jovens · Miami, FL' },
        { quote: '"Pastoreio uma igreja pequena e faço tudo sozinho. O Living Word me dá sermão, estudo bíblico e devocional com profundidade que levaria dias. Transformei o sermão de domingo em conteúdo da semana toda."', name: 'Pr. Marcos Oliveira', flag: '🇧🇷', initials: 'MO', role: 'Pastor · Igreja Batista Renovada · Goiânia, GO' },
        { quote: '"Consegui estruturar minha mensagem mais rápido e ainda transformar em artigo, devocional e material de célula. Economizo pelo menos 5 horas por semana."', name: 'Débora Santos', flag: '🇧🇷', initials: 'DS', role: 'Pastora de ensino · São Paulo, SP' },
      ],
      EN: [
        { quote: '"I used to spend 6+ hours cross-referencing commentaries. Now I get deep exegesis, a full sermon and a devotional in minutes. It changed how I prepare completely."', name: 'Rev. Robert Johnson', flag: '🇺🇸', initials: 'RJ', role: 'Senior Pastor · Baptist Church · Nashville, TN' },
        { quote: '"I was skeptical about AI for ministry. Living Word is different — it actually does exegesis, understands doctrine, and saves me 5 hours every week."', name: 'Pastor David Miller', flag: '🇺🇸', initials: 'DM', role: 'Lead Pastor · Community Church · Dallas, TX' },
        { quote: '"As a church planter, I wear every hat. Living Word gives me sermon, Bible study and devotional with real depth — and I turn one sermon into content for the entire week."', name: 'Pastor James Carter', flag: '🇺🇸', initials: 'JC', role: 'Church Planter · New Life Fellowship · Phoenix, AZ' },
        { quote: '"I lead a small group and needed solid material fast. Living Word delivers discussion questions, historical context and application — all biblically grounded."', name: 'Sarah Thompson', flag: '🇺🇸', initials: 'ST', role: 'Small Group Leader · Charlotte, NC' },
      ],
      ES: [
        { quote: '"Mi congregación habla español e inglés. Antes tardaba días en adaptar el contenido. Ahora creo sermón, devocional y estudio bíblico en los dos idiomas en minutos."', name: 'Pastor Miguel Cruz', flag: '🇲🇽', initials: 'MC', role: 'Pastor principal · Iglesia Evangélica Hispana · Los Angeles, CA' },
        { quote: '"Soy líder de célula y ahora llego preparada con devocional, preguntas de discusión y contexto histórico — ahorro más de 4 horas cada semana."', name: 'María González', flag: '🇨🇴', initials: 'MG', role: 'Líder de célula · Bogotá, Colombia' },
        { quote: '"Pastoreo una iglesia pequeña y hago todo solo. Living Word me da sermón, estudio bíblico y devocional con profundidad que tomaría días. Transformé el sermón del domingo en contenido de toda la semana."', name: 'Pr. Carlos Herrera', flag: '🇦🇷', initials: 'CH', role: 'Pastor · Iglesia Bautista · Buenos Aires, Argentina' },
        { quote: '"Conseguí estructurar mi mensaje más rápido y transformarlo en artículo, devocional y material de célula. Era escéptico, pero Living Word realmente hace exégesis."', name: 'Pastor Luis Ramírez', flag: '🇲🇽', initials: 'LR', role: 'Pastor de enseñanza · Iglesia del Camino · Houston, TX' },
      ],
    },
  },

  /* ── PRICING ── */
  pricing: {
    tag: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
    h2: { PT: 'Comece grátis. Cresça quando precisar.', EN: 'Start free. Grow when you need to.', ES: 'Empieza gratis. Crece cuando necesites.' },
  },

  /* ── FAQ (objeções reais) ── */
  faq: {
    tag: { PT: 'Perguntas frequentes', EN: 'FAQ', ES: 'Preguntas frecuentes' },
    h2: { PT: 'Respostas diretas.', EN: 'Straight answers.', ES: 'Respuestas directas.' },
    items: [
      {
        q: { PT: 'A IA substitui o pastor?', EN: 'Does AI replace the pastor?', ES: '¿La IA reemplaza al pastor?' },
        a: { PT: 'Não. O Living Word é um copiloto de criação bíblica. Você define a passagem, a doutrina e o tom. A IA pesquisa, organiza e gera — mas quem ensina e decide é você.', EN: 'No. Living Word is a biblical creation copilot. You define the passage, doctrine and tone. AI researches, organizes and generates — but you\'re the one who teaches and decides.', ES: 'No. Living Word es un copiloto de creación bíblica. Tú defines el pasaje, la doctrina y el tono. La IA investiga, organiza y genera — pero quien enseña y decide eres tú.' },
      },
      {
        q: { PT: 'Funciona em português, inglês e espanhol?', EN: 'Does it work in Portuguese, English and Spanish?', ES: '¿Funciona en portugués, inglés y español?' },
        a: { PT: 'Sim. O Living Word é trilíngue nativo — gera conteúdo em PT, EN e ES com voz pastoral nativa em cada idioma, não tradução automática.', EN: 'Yes. Living Word is natively trilingual — generates content in PT, EN and ES with native pastoral voice in each language, not automatic translation.', ES: 'Sí. Living Word es trilingüe nativo — genera contenido en PT, EN y ES con voz pastoral nativa en cada idioma, no traducción automática.' },
      },
      {
        q: { PT: 'Posso transformar sermão em artigo?', EN: 'Can I turn a sermon into an article?', ES: '¿Puedo transformar un sermón en artículo?' },
        a: { PT: 'Sim. A partir de uma passagem e tema, o sistema gera sermão completo, artigo, devocional, conteúdo para célula e mais — tudo com fidelidade bíblica e em 7+ formatos.', EN: 'Yes. From a passage and topic, the system generates full sermon, article, devotional, small group content and more — all with biblical fidelity in 7+ formats.', ES: 'Sí. A partir de un pasaje y tema, el sistema genera sermón completo, artículo, devocional, contenido para célula y más — todo con fidelidad bíblica en 7+ formatos.' },
      },
      {
        q: { PT: 'O conteúdo mantém fidelidade bíblica?', EN: 'Does the content maintain biblical faithfulness?', ES: '¿El contenido mantiene fidelidad bíblica?' },
        a: { PT: 'Sim. O Living Word usa guardrails teológicos reais: exegese antes de aplicação, distinção entre texto, interpretação e aplicação, e alerta de eisegese integrado.', EN: 'Yes. Living Word uses real theological guardrails: exegesis before application, text/interpretation/application distinction, and built-in eisegesis alerts.', ES: 'Sí. Living Word usa guardrails teológicos reales: exégesis antes de aplicación, distinción entre texto, interpretación y aplicación, y alerta de eiségesis integrado.' },
      },
      {
        q: { PT: 'Preciso ter site para usar?', EN: 'Do I need a website to use it?', ES: '¿Necesito tener un sitio web?' },
        a: { PT: 'Não. O Living Word inclui um blog cristão integrado. Você também pode exportar para Word, PDF ou WordPress.', EN: 'No. Living Word includes an integrated Christian blog. You can also export to Word, PDF or WordPress.', ES: 'No. Living Word incluye un blog cristiano integrado. También puedes exportar a Word, PDF o WordPress.' },
      },
      {
        q: { PT: 'Serve para líderes e igrejas pequenas?', EN: 'Does it work for leaders and small churches?', ES: '¿Sirve para líderes e iglesias pequeñas?' },
        a: { PT: 'Sim. O plano gratuito já inclui 5 gerações por mês. Líderes de célula e ministérios pequenos usam o Living Word para chegar toda semana com conteúdo de ensino bíblico pronto.', EN: 'Yes. The free plan already includes 5 generations per month. Cell leaders and small ministries use Living Word to arrive every week with ready Bible teaching content.', ES: 'Sí. El plan gratuito ya incluye 5 generaciones al mes. Líderes de célula y ministerios pequeños usan Living Word para llegar cada semana con contenido de enseñanza bíblica listo.' },
      },
      {
        q: { PT: 'A IA ajuda na pesquisa bíblica?', EN: 'Does the AI help with Bible research?', ES: '¿La IA ayuda en la investigación bíblica?' },
        a: { PT: 'Sim. O Living Word faz pesquisa profunda em segundos — contexto histórico, paralelos bíblicos, significado original, comentários exegéticos. O que levaria horas, feito em minutos.', EN: 'Yes. Living Word does deep research in seconds — historical context, biblical parallels, original meaning, exegetical commentaries. What would take hours, done in minutes.', ES: 'Sí. Living Word hace investigación profunda en segundos — contexto histórico, paralelos bíblicos, significado original, comentarios exegéticos. Lo que tomaría horas, hecho en minutos.' },
      },
      {
        q: { PT: 'Precisa de cartão para o trial de 7 dias?', EN: 'Do I need a card for the 7-day trial?', ES: '¿Necesito tarjeta para la prueba de 7 días?' },
        a: { PT: 'Não. O trial de 7 dias é sem cartão de crédito. Só solicitamos pagamento no 8º dia se você quiser continuar com acesso completo.', EN: 'No. The 7-day trial requires no credit card. We only ask for payment on day 8 if you want to continue with full access.', ES: 'No. La prueba de 7 días no requiere tarjeta de crédito. Solo solicitamos pago el día 8 si deseas continuar con acceso completo.' },
      },
    ],
  },

  /* ── CTA FINAL (fortalecido) ── */
  ctaFinal: {
    h2_1: { PT: 'A pesquisa que levaria horas.', EN: 'The research that would take hours.', ES: 'La investigación que tomaría horas.' },
    h2_em: { PT: 'O conteúdo que seu ministério precisa. Em minutos.', EN: 'The content your ministry needs. In minutes.', ES: 'El contenido que tu ministerio necesita. En minutos.' },
    sub: {
      PT: 'Prepare melhor. Pesquise com profundidade. Publique com constância. Grátis para sempre, sem cartão de crédito.',
      EN: 'Prepare better. Research with depth. Publish with consistency. Free forever, no credit card.',
      ES: 'Prepara mejor. Investiga con profundidad. Publica con constancia. Gratis para siempre, sin tarjeta.',
    },
    cta: { PT: 'Começar grátis →', EN: 'Start free →', ES: 'Empezar gratis →' },
    tags: { PT: 'PT · EN · ES · Pastores · Líderes · Ministérios · Estudiosos', EN: 'PT · EN · ES · Pastors · Leaders · Ministries · Scholars', ES: 'PT · EN · ES · Pastores · Líderes · Ministerios · Estudiosos' },
    verse: {
      PT: '"Assim será a palavra que sair da minha boca: não voltará para mim vazia." — Isaías 55:11',
      EN: '"So shall my word be that goes out from my mouth; it shall not return to me empty." — Isaiah 55:11',
      ES: '"Así será mi palabra que sale de mi boca: no volverá a mí vacía." — Isaías 55:11',
    },
  },
};

/* ═══════════════════════════════════════════════ */
/*                    COMPONENT                    */
/* ═══════════════════════════════════════════════ */

export default function Landing() {
  const { lang, setLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  usePageviewTracker('/');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { pricing, loading: regionLoading } = useGeoRegion();

  const pricingPlans = useMemo(() => {
    if (!pricing) return [];
    const fmt = (amt: number) => formatPrice(amt, pricing.symbol, pricing.currency);
    return [
      {
        name: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' } as Record<L, string>,
        planKey: null as string | null,
        price: `${pricing.symbol}0`,
        period: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' } as Record<L, string>,
        features: {
          PT: ['500 créditos/mês', '~25 sermões ou 50 artigos', '4 formatos pastorais', '1 artigo de blog/mês', 'Blog no livingword.app', 'Watermark visível'],
          EN: ['500 credits/month', '~25 sermons or 50 articles', '4 pastoral formats', '1 blog article/month', 'Blog on livingword.app', 'Visible watermark'],
          ES: ['500 créditos/mes', '~25 sermones o 50 artículos', '4 formatos pastorales', '1 artículo de blog/mes', 'Blog en livingword.app', 'Marca de agua visible'],
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
          PT: ['4.000 créditos/mês', '~200 sermões ou 400 artigos', 'Todos os 6 formatos pastorais', 'Fila editorial básica', 'Sem watermark', 'Blog no livingword.app'],
          EN: ['4,000 credits/month', '~200 sermons or 400 articles', 'All 6 pastoral formats', 'Basic editorial queue', 'No watermark', 'Blog on livingword.app'],
          ES: ['4.000 créditos/mes', '~200 sermones o 400 artículos', 'Los 6 formatos pastorales', 'Fila editorial básica', 'Sin marca de agua', 'Blog en livingword.app'],
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
          PT: ['8.000 créditos/mês', '~400 sermões ou 800 artigos', 'Mentes Pastorais (Billy Graham…)', 'Domínio próprio conectado', 'Calendário editorial cristão', 'Séries automatizadas', 'Analytics de publicação'],
          EN: ['8,000 credits/month', '~400 sermons or 800 articles', 'Pastoral Minds (Billy Graham…)', 'Custom domain connected', 'Christian editorial calendar', 'Automated series', 'Publishing analytics'],
          ES: ['8.000 créditos/mes', '~400 sermones o 800 artículos', 'Mentes Pastorales (Billy Graham…)', 'Dominio propio conectado', 'Calendario editorial cristiano', 'Series automatizadas', 'Analytics de publicación'],
        } as Record<L, string[]>,
        cta: { PT: 'Começar agora →', EN: 'Get started →', ES: 'Empezar ahora →' } as Record<L, string>,
        featured: true,
        capacity: { PT: 'Evangelista · Avançado', EN: 'Evangelist · Advanced', ES: 'Evangelista · Avanzado' } as Record<L, string>,
      },
      {
        name: { PT: 'Igreja', EN: 'Ministry', ES: 'Ministerio' } as Record<L, string>,
        planKey: 'igreja' as string | null,
        price: fmt(pricing.plans.igreja.amount),
        period: { PT: '/mês', EN: '/month', ES: '/mes' } as Record<L, string>,
        features: {
          PT: ['20.000 créditos/mês', '10 usuários incluídos', 'Tudo do Pro', '10 domínios próprios', 'Workspaces ilimitados', 'Painel admin da equipe', 'Suporte prioritário'],
          EN: ['20,000 credits/month', '10 users included', 'Everything in Pro', '10 custom domains', 'Unlimited workspaces', 'Team admin panel', 'Priority support'],
          ES: ['20.000 créditos/mes', '10 usuarios incluidos', 'Todo del Pro', '10 dominios propios', 'Workspaces ilimitados', 'Panel admin del equipo', 'Soporte prioritario'],
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
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif", color: '#0F0A18' }}>

      {/* ===== NAV ===== */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{
          background: 'rgba(15,10,24,0.92)',
          borderBottom: '1px solid rgba(109,40,217,0.15)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
          <span className="font-display text-lg tracking-tight" style={{ color: '#E8E0F5' }}>Living <span style={{ color: '#6D28D9' }}>Word</span></span>
          <div className="hidden md:flex items-center gap-7">
            <button onClick={() => scrollTo('how')} className="text-[13px] font-medium transition-colors hover:text-[#6D28D9]" style={{ color: 'rgba(232,224,245,0.65)' }}>{copy.nav.how[lang]}</button>
            <button onClick={() => scrollTo('features')} className="text-[13px] font-medium transition-colors hover:text-[#6D28D9]" style={{ color: 'rgba(232,224,245,0.65)' }}>{copy.nav.features[lang]}</button>
            <button onClick={() => scrollTo('pricing')} className="text-[13px] font-medium transition-colors hover:text-[#6D28D9]" style={{ color: 'rgba(232,224,245,0.65)' }}>{copy.nav.plans[lang]}</button>
            <Link to="/login" className="text-[13px] font-medium" style={{ color: 'rgba(232,224,245,0.65)' }}>{copy.nav.login[lang]}</Link>
            <Link to="/cadastro" className="text-[13px] font-semibold px-4 py-2 rounded-lg transition-transform hover:scale-[1.02]" style={{ background: '#6D28D9', color: '#0F0A18' }}>{copy.nav.cta[lang]}</Link>
            {/* Language toggle */}
            <div className="flex items-center rounded-lg overflow-hidden" style={{ background: 'rgba(232,224,245,0.1)', border: '1px solid rgba(232,224,245,0.15)' }}>
              {(['PT', 'EN', 'ES'] as L[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className="text-[12px] font-semibold px-3 py-1.5 transition-all"
                  style={{
                    background: lang === code ? 'rgba(232,224,245,0.9)' : 'transparent',
                    color: lang === code ? '#0F0A18' : 'rgba(232,224,245,0.5)',
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <button className="md:hidden p-1.5" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" style={{ color: '#E8E0F5' }} /> : <Menu className="h-5 w-5" style={{ color: '#E8E0F5' }} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-5 pb-5 space-y-3" style={{ background: 'rgba(15,10,24,0.98)' }}>
            <button onClick={() => scrollTo('how')} className="block w-full text-left text-[14px] py-2" style={{ color: 'rgba(232,224,245,0.7)' }}>{copy.nav.how[lang]}</button>
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-[14px] py-2" style={{ color: 'rgba(232,224,245,0.7)' }}>{copy.nav.features[lang]}</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-[14px] py-2" style={{ color: 'rgba(232,224,245,0.7)' }}>{copy.nav.plans[lang]}</button>
            <Link to="/login" className="block text-[14px] py-2" style={{ color: 'rgba(232,224,245,0.7)' }}>{copy.nav.login[lang]}</Link>
            <Link to="/cadastro" className="block text-center text-[14px] font-semibold px-4 py-2.5 rounded-lg" style={{ background: '#6D28D9', color: '#0F0A18' }}>{copy.nav.cta[lang]}</Link>
            {/* Mobile language toggle */}
            <div className="flex items-center rounded-lg overflow-hidden w-fit" style={{ background: 'rgba(232,224,245,0.1)', border: '1px solid rgba(232,224,245,0.15)' }}>
              {(['PT', 'EN', 'ES'] as L[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className="text-[13px] font-semibold px-4 py-2 transition-all"
                  style={{
                    background: lang === code ? 'rgba(232,224,245,0.9)' : 'transparent',
                    color: lang === code ? '#0F0A18' : 'rgba(232,224,245,0.5)',
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ===== 1. HERO ===== */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-5 sm:px-8 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0F0A18 0%, #0F0A18 60%, #0F0A18 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #6D28D9 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <span className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase px-3.5 py-1.5 rounded-full mb-6" style={{ background: 'rgba(109,40,217,0.15)', color: '#6D28D9', border: '1px solid rgba(109,40,217,0.2)' }}>{copy.hero.eyebrow[lang]}</span>
              <h1 className="font-display text-[28px] sm:text-[42px] font-bold leading-[1.15] tracking-tight mb-5" style={{ color: '#E8E0F5' }}>
                {copy.hero.h1[lang]}
                <br />
                <em className="not-italic" style={{ color: '#6D28D9' }}>{copy.hero.h1_em[lang]}</em>
              </h1>
              <p className="text-[15px] sm:text-[16px] leading-[1.7] mb-7 max-w-[520px]" style={{ color: 'rgba(232,224,245,0.7)' }}>{copy.hero.sub[lang]}</p>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Link to="/cadastro" className="inline-flex items-center gap-2 text-[15px] font-semibold px-7 py-3.5 rounded-xl transition-all hover:scale-[1.03]" style={{ background: '#6D28D9', color: '#0F0A18' }}>{copy.hero.cta1[lang]}</Link>
                <button onClick={() => scrollTo('how')} className="inline-flex items-center gap-2 text-[14px] font-medium px-5 py-3 rounded-xl transition-all hover:bg-white/5" style={{ color: '#6D28D9', border: '1px solid rgba(109,40,217,0.3)' }}>{copy.hero.cta2[lang]}</button>
              </div>
              <p className="font-display text-[13px] italic" style={{ color: 'rgba(232,224,245,0.3)' }}>{copy.hero.verse[lang]}</p>
            </div>

            {/* Right: Product Mockup — CSS-based, no embedded background */}
            <div className="hidden lg:flex relative justify-center items-center">
              {/* Phone frame */}
              <div className="relative z-10 w-[280px]" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))' }}>
                <div className="rounded-[32px] overflow-hidden" style={{ background: '#0F0A18', border: '3px solid rgba(109,40,217,0.3)', boxShadow: 'inset 0 0 0 1px rgba(232,224,245,0.08)' }}>
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 pt-3 pb-1" style={{ background: '#0F0A18' }}>
                    <span className="text-[9px] font-semibold" style={{ color: 'rgba(232,224,245,0.5)' }}>9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-2 rounded-sm" style={{ background: 'rgba(232,224,245,0.4)' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(232,224,245,0.4)' }} />
                    </div>
                  </div>
                  {/* App content */}
                  <div className="px-4 pb-5 pt-2 space-y-3" style={{ background: '#E8E0F5', minHeight: '400px' }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-bold" style={{ color: '#0F0A18' }}>
                        📖 {lang === 'PT' ? 'Estúdio Pastoral' : lang === 'EN' ? 'Pastoral Studio' : 'Estudio Pastoral'}
                      </p>
                      <div className="flex gap-1">
                        {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                          <span key={l} className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{ background: l === lang ? '#0F0A18' : 'rgba(15,10,24,0.1)', color: l === lang ? '#E8E0F5' : '#0F0A18' }}>{l}</span>
                        ))}
                      </div>
                    </div>
                    {/* Form fields */}
                    {[
                      { l: lang === 'PT' ? 'Passagem bíblica' : lang === 'EN' ? 'Bible passage' : 'Pasaje bíblico', v: lang === 'PT' ? 'João 15:1-8' : lang === 'EN' ? 'John 15:1-8' : 'Juan 15:1-8' },
                      { l: lang === 'PT' ? 'Público' : lang === 'EN' ? 'Audience' : 'Público', v: lang === 'PT' ? 'Jovens adultos' : lang === 'EN' ? 'Young adults' : 'Jóvenes adultos' },
                      { l: lang === 'PT' ? 'Tema' : lang === 'EN' ? 'Topic' : 'Tema', v: lang === 'PT' ? 'Propósito de vida' : lang === 'EN' ? 'Life purpose' : 'Propósito de vida' },
                    ].map((f, i) => (
                      <div key={i}>
                        <p className="text-[8px] font-semibold mb-0.5" style={{ color: '#1E1240' }}>{f.l}</p>
                        <div className="rounded-lg px-2.5 py-1.5 text-[9px]" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.12)', color: '#0F0A18' }}>{f.v}</div>
                      </div>
                    ))}
                    {/* Generate button */}
                    <div className="rounded-lg px-3 py-2 text-center text-[10px] font-semibold" style={{ background: '#6D28D9', color: '#FFFFFF' }}>
                      {lang === 'PT' ? 'Gerar conteúdo →' : lang === 'EN' ? 'Generate content →' : 'Generar contenido →'}
                    </div>
                    {/* Output chips */}
                    <div>
                      <p className="text-[8px] font-bold mb-1.5" style={{ color: '#1E1240' }}>
                        {lang === 'PT' ? 'FORMATOS DE SAÍDA' : lang === 'EN' ? 'OUTPUT FORMATS' : 'FORMATOS DE SALIDA'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { icon: '📖', label: lang === 'PT' ? 'Sermão' : lang === 'EN' ? 'Sermon' : 'Sermón' },
                          { icon: '🕊️', label: lang === 'PT' ? 'Devocional' : lang === 'EN' ? 'Devotional' : 'Devocional' },
                          { icon: '✍️', label: lang === 'PT' ? 'Artigo' : lang === 'EN' ? 'Article' : 'Artículo' },
                          { icon: '📚', label: lang === 'PT' ? 'Estudo' : lang === 'EN' ? 'Study' : 'Estudio' },
                          { icon: '👥', label: lang === 'PT' ? 'Célula' : lang === 'EN' ? 'Small Group' : 'Célula' },
                          { icon: '📱', label: 'Reels' },
                        ].map((chip, i) => (
                          <span key={i} className="text-[7px] font-semibold px-2 py-1 rounded-md flex items-center gap-1" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.1)', color: '#0F0A18' }}>
                            <span>{chip.icon}</span> {chip.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Recent generation preview */}
                    <div className="rounded-lg p-2.5" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.08)' }}>
                      <p className="text-[7px] font-bold mb-1" style={{ color: '#1E1240' }}>
                        {lang === 'PT' ? 'GERAÇÃO RECENTE' : lang === 'EN' ? 'RECENT GENERATION' : 'GENERACIÓN RECIENTE'}
                      </p>
                      <div className="space-y-1">
                        <div className="h-1.5 rounded w-full" style={{ background: '#F8F6FF' }} />
                        <div className="h-1.5 rounded w-5/6" style={{ background: '#E8E0F5' }} />
                        <div className="h-1.5 rounded w-4/5" style={{ background: '#E8E0F5' }} />
                        <div className="h-1.5 rounded w-2/3" style={{ background: '#E8E0F5' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating output cards */}
              <div className="absolute right-0 top-8 z-20 space-y-2">
                {[
                  { icon: '📖', label: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' } },
                  { icon: '🕊️', label: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' } },
                  { icon: '✍️', label: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' } },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm" style={{ background: 'rgba(232,224,245,0.92)', border: '1px solid rgba(109,40,217,0.2)', animationDelay: `${i * 0.2}s` }}>
                    <span className="text-[16px]">{item.icon}</span>
                    <span className="text-[12px] font-semibold" style={{ color: '#0F0A18' }}>{item.label[lang]}</span>
                    <Check className="w-3.5 h-3.5" style={{ color: '#4CAF50' }} />
                  </div>
                ))}
              </div>
              {/* Floating language badge */}
              <div className="absolute left-0 bottom-12 z-20 flex gap-1.5 rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm" style={{ background: 'rgba(232,224,245,0.92)', border: '1px solid rgba(109,40,217,0.2)' }}>
                {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                  <span key={l} className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: l === lang ? '#0F0A18' : 'rgba(15,10,24,0.1)', color: l === lang ? '#E8E0F5' : '#0F0A18' }}>{l}</span>
                ))}
              </div>
              {/* Glow */}
              <div className="absolute -inset-8 -z-10 rounded-[40px] blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #6D28D9 0%, transparent 70%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. PROOF BAR ===== */}
      <section className="py-8 px-5" style={{ background: '#E8E0F5' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-0 items-center">
            {copy.stats.map((s, i) => (
              <div key={i} className="flex items-center justify-center">
                {i > 0 && <div className="hidden sm:block w-px h-12 mr-6 sm:mr-8" style={{ background: 'rgba(15,10,24,0.18)' }} />}
                <div className="text-center px-1 sm:px-3 py-2">
                  <div className="font-display text-[26px] sm:text-[38px] font-bold tracking-tight" style={{ color: '#0F0A18' }}>{s.num}</div>
                  <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.14em] mt-0.5" style={{ color: '#1E1240' }}>{s.label[lang]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. PROBLEM ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.problem.tag[lang]}</p>
          <h2 className="font-display text-[24px] sm:text-[36px] font-semibold leading-tight mb-4" style={{ color: '#0F0A18' }}>{copy.problem.h2[lang]}</h2>
          <p className="text-[16px] leading-[1.7] mb-8 max-w-[600px]" style={{ color: '#0F0A18' }}>{copy.problem.sub[lang]}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {copy.problem.cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <RevealOnScroll key={i} delay={i * 0.12}>
                  <div className="rounded-xl p-5 h-full" style={{ background: '#E8E0F5', border: '1px solid rgba(15,10,24,0.12)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F8F6FF' }}>
                      <Icon className="h-4 w-4" style={{ color: '#0F0A18' }} />
                    </div>
                    <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#0F0A18' }}>{c.title[lang]}</h3>
                    <p className="text-[14px] leading-[1.6]" style={{ color: '#0F0A18' }}>{c.desc[lang]}</p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 4. HOW IT WORKS ===== */}
      <section id="how" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#E8E0F5' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.how.tag[lang]}</p>
          <h2 className="font-display text-[24px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#0F0A18' }}>{copy.how.h2[lang]}</h2>
          <div className="space-y-0 mb-10">
            {copy.how.steps.map((step, i) => (
              <RevealOnScroll key={i} delay={i * 0.18}>
                <div className="flex gap-5 py-5" style={{ borderBottom: i < 2 ? '1px solid rgba(15,10,24,0.1)' : 'none' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display text-xl font-semibold" style={{ background: '#0F0A18', color: '#E8E0F5' }}>{i + 1}</div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: '#0F0A18' }}>{step.title[lang]}</h3>
                    <p className="text-[14px] leading-[1.65] mb-2" style={{ color: '#0F0A18' }}>{step.desc[lang]}</p>
                    <span className="inline-block text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: '#F8F6FF', color: '#0F0A18' }}>{step.badge[lang]}</span>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Desktop Mockup — larger, with annotations */}
          <RevealOnScroll delay={0.3}>
            <div className="max-w-2xl mx-auto">
              <div className="rounded-t-xl overflow-hidden" style={{ background: '#F8F6FF', border: '2px solid rgba(15,10,24,0.15)' }}>
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: '#F8F6FF' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF6B5F' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D4A017' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#61C554' }} />
                  <div className="flex-1 text-center">
                    <span className="text-[10px] font-medium px-4 py-0.5 rounded" style={{ background: 'rgba(15,10,24,0.08)', color: '#1E1240' }}>app.livingword.com</span>
                  </div>
                </div>
                <div className="px-5 py-5" style={{ background: '#E8E0F5', minHeight: '280px' }}>
                  <div className="flex gap-5">
                    <div className="flex-1 space-y-2.5">
                      <p className="text-[11px] font-bold" style={{ color: '#0F0A18' }}>
                        📖 {lang === 'PT' ? 'Estúdio Pastoral' : lang === 'EN' ? 'Pastoral Studio' : 'Estudio Pastoral'}
                      </p>
                      {[
                        { l: lang === 'PT' ? 'Passagem bíblica' : lang === 'EN' ? 'Bible passage' : 'Pasaje bíblico', v: lang === 'PT' ? 'João 15:1-8' : lang === 'EN' ? 'John 15:1-8' : 'Juan 15:1-8' },
                        { l: lang === 'PT' ? 'Público' : lang === 'EN' ? 'Audience' : 'Público', v: lang === 'PT' ? 'Jovens adultos' : lang === 'EN' ? 'Young adults' : 'Jóvenes adultos' },
                        { l: lang === 'PT' ? 'Tema' : lang === 'EN' ? 'Topic' : 'Tema', v: lang === 'PT' ? 'Propósito de vida' : lang === 'EN' ? 'Life purpose' : 'Propósito de vida' },
                      ].map((f, i) => (
                        <div key={i}>
                          <p className="text-[7px] font-semibold mb-0.5" style={{ color: '#1E1240' }}>{f.l}</p>
                          <div className="rounded px-2 py-1 text-[8px]" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.12)', color: '#0F0A18' }}>{f.v}</div>
                        </div>
                      ))}
                      <div className="flex gap-1.5 pt-1">
                        {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                          <span key={l} className="text-[7px] font-semibold px-2 py-0.5 rounded" style={{ background: l === lang ? '#0F0A18' : 'rgba(15,10,24,0.1)', color: l === lang ? '#E8E0F5' : '#0F0A18' }}>{l}</span>
                        ))}
                      </div>
                      <div className="rounded px-3 py-1.5 text-center text-[9px] font-semibold" style={{ background: '#6D28D9', color: '#FFFFFF' }}>
                        {lang === 'PT' ? 'Gerar conteúdo →' : lang === 'EN' ? 'Generate content →' : 'Generar contenido →'}
                      </div>
                    </div>
                    <div className="flex-1 hidden sm:block">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[
                          lang === 'PT' ? 'Sermão' : lang === 'EN' ? 'Sermon' : 'Sermón',
                          lang === 'PT' ? 'Devocional' : lang === 'EN' ? 'Devotional' : 'Devocional',
                          lang === 'PT' ? 'Estudo' : lang === 'EN' ? 'Study' : 'Estudio',
                          lang === 'PT' ? 'Artigo' : lang === 'EN' ? 'Article' : 'Artículo',
                          'Blog', lang === 'PT' ? 'Célula' : lang === 'EN' ? 'Small Group' : 'Célula',
                          'EN', 'ES',
                        ].map((tab, i) => (
                          <span key={i} className="text-[7px] font-semibold px-1.5 py-0.5 rounded" style={{ background: i === 0 ? '#0F0A18' : 'rgba(15,10,24,0.08)', color: i === 0 ? '#E8E0F5' : '#1E1240' }}>{tab}</span>
                        ))}
                      </div>
                      <div className="rounded-lg p-2.5 space-y-1.5" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.08)' }}>
                        <div className="h-2 rounded w-3/4" style={{ background: '#F8F6FF' }} />
                        <div className="h-1.5 rounded w-full" style={{ background: '#E8E0F5' }} />
                        <div className="h-1.5 rounded w-full" style={{ background: '#E8E0F5' }} />
                        <div className="h-1.5 rounded w-5/6" style={{ background: '#E8E0F5' }} />
                        <div className="h-1.5 rounded w-full" style={{ background: '#E8E0F5' }} />
                        <div className="h-1.5 rounded w-2/3" style={{ background: '#E8E0F5' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-3 rounded-b-lg mx-8" style={{ background: '#1E1240', borderTop: '1px solid rgba(15,10,24,0.1)' }} />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== 5. NOVA SEÇÃO: Uma passagem → vários formatos ===== */}
      <section className="py-14 sm:py-20 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.multiformat.tag[lang]}</p>
            <h2 className="font-display text-[24px] sm:text-[38px] font-semibold leading-tight mb-4" style={{ color: '#0F0A18' }}>{copy.multiformat.h2[lang]}</h2>
            <p className="text-[16px] leading-[1.7] max-w-2xl mx-auto" style={{ color: '#0F0A18' }}>{copy.multiformat.sub[lang]}</p>
          </div>

          <RevealOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
              {/* Input card */}
              <div className="rounded-2xl p-6 text-center" style={{ background: '#E8E0F5', border: '1px solid rgba(15,10,24,0.12)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: '#1E1240' }}>
                  {lang === 'PT' ? 'Entrada' : lang === 'EN' ? 'Input' : 'Entrada'}
                </p>
                <div className="inline-block rounded-xl px-5 py-3 mb-3" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.1)' }}>
                  <p className="text-[18px] font-display font-bold" style={{ color: '#0F0A18' }}>📖 {copy.multiformat.input.passage[lang]}</p>
                </div>
                <p className="text-[13px] font-medium" style={{ color: '#0F0A18' }}>
                  {lang === 'PT' ? 'Tema:' : lang === 'EN' ? 'Theme:' : 'Tema:'} <em>{copy.multiformat.input.theme[lang]}</em>
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex flex-col items-center gap-1">
                <ArrowRight className="w-8 h-8" style={{ color: '#6D28D9' }} />
              </div>
              <div className="md:hidden flex justify-center">
                <ChevronDown className="w-6 h-6" style={{ color: '#6D28D9' }} />
              </div>

              {/* Output cards grid */}
              <div className="grid grid-cols-2 gap-2">
                {copy.multiformat.outputs.map((out, i) => (
                  <div key={i} className="rounded-xl px-3 py-3 flex items-center gap-2 transition-all hover:scale-[1.02]" style={{ background: '#E8E0F5', border: '1px solid rgba(15,10,24,0.08)' }}>
                    <span className="text-[18px]">{out.icon}</span>
                    <span className="text-[12px] font-semibold leading-tight" style={{ color: '#0F0A18' }}>{out.label[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== 6. FEATURES (6 principais + secundários menores) ===== */}
      <section id="features" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#E8E0F5' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.features.tag[lang]}</p>
          <h2 className="font-display text-[24px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#0F0A18' }}>{copy.features.h2[lang]}</h2>

          {/* Primary 6 — tall cards matching reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {copy.features.primary.map((card, i) => {
              const Icon = card.icon;
              return (
                <RevealOnScroll key={i} delay={i * 0.06}>
                  <div className="rounded-2xl p-6 h-full flex flex-col" style={{ background: '#FFFFFF', border: '1px solid rgba(15,10,24,0.1)', boxShadow: '0 2px 12px rgba(15,10,24,0.05)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: '#F8F6FF' }}>
                      <Icon className="h-5 w-5" style={{ color: '#0F0A18' }} />
                    </div>
                    <h3 className="text-[16px] font-bold mb-2" style={{ color: '#0F0A18' }}>{card.title[lang]}</h3>
                    <p className="text-[13px] leading-[1.65]" style={{ color: '#0F0A18' }}>{card.desc[lang]}</p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          {/* Secondary — same size as primary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {copy.features.secondary.map((card, i) => {
              const Icon = card.icon;
              return (
                <RevealOnScroll key={i} delay={i * 0.06}>
                  <div className="rounded-2xl p-6 h-full flex flex-col" style={{ background: '#FFFFFF', border: '1px solid rgba(15,10,24,0.1)', boxShadow: '0 2px 12px rgba(15,10,24,0.05)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: '#F8F6FF' }}>
                      <Icon className="h-5 w-5" style={{ color: '#0F0A18' }} />
                    </div>
                    <h3 className="text-[16px] font-bold mb-2" style={{ color: '#0F0A18' }}>{card.title[lang]}</h3>
                    <p className="text-[13px] leading-[1.65]" style={{ color: '#0F0A18' }}>{card.desc[lang]}</p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 7. VS COMPETITORS ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#0F0A18' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[22px] sm:text-[32px] font-semibold text-center mb-8 leading-tight" style={{ color: '#E8E0F5' }}>{copy.vs.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: 'rgba(232,224,245,0.45)' }}>{copy.vs.them[lang]}</p>
              <div className="space-y-2.5">
                {copy.vs.xItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[14px]">
                    <span className="text-base shrink-0 mt-0.5" style={{ color: 'rgba(232,224,245,0.3)' }}>✗</span>
                    <span style={{ color: 'rgba(232,224,245,0.55)' }}>{item[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: '#6D28D9' }}>{copy.vs.us[lang]}</p>
              <div className="space-y-2.5">
                {copy.vs.checkItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[14px]">
                    <span className="text-base shrink-0 mt-0.5" style={{ color: '#6D28D9' }}>✓</span>
                    <span className="font-medium" style={{ color: 'rgba(232,224,245,0.9)' }}>{item[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. TESTIMONIALS ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#E8E0F5' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.testimonials.tag[lang]}</p>
          <h2 className="font-display text-[24px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#0F0A18' }}>{copy.testimonials.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {copy.testimonials.itemsByLang[lang].map((t, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid rgba(15,10,24,0.08)', boxShadow: '0 1px 4px rgba(15,10,24,0.04)' }}>
                <p className="text-[15px] italic leading-[1.7] mb-5 font-light" style={{ color: '#0F0A18', fontFamily: "'Cormorant Garamond', serif", fontSize: '17px' }}>{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 tracking-wide" style={{ background: '#F8F6FF', color: '#0F0A18' }}>{t.initials}</div>
                  <div>
                    <p className="text-[13.5px] font-semibold" style={{ color: '#0F0A18' }}>{t.name} {t.flag}</p>
                    <p className="text-[11.5px] font-medium tracking-wide" style={{ color: '#1E1240' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. MENTES BRILHANTES (compacta — diferencial premium) ===== */}
      <section className="py-14 sm:py-16 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-6 sm:p-10" style={{ background: '#E8E0F5', border: '1px solid rgba(15,10,24,0.1)' }}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Left: Copy */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(109,40,217,0.15)' }}>
                    <Brain className="w-4 h-4" style={{ color: '#6D28D9' }} />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: '#6D28D9' }}>
                    {lang === 'PT' ? 'Diferencial Premium' : lang === 'EN' ? 'Premium Feature' : 'Diferencial Premium'}
                  </span>
                </div>
                <h3 className="font-display text-[22px] sm:text-[28px] font-semibold leading-tight mb-3" style={{ color: '#0F0A18' }}>
                  {lang === 'PT' ? 'Mentes Brilhantes' : lang === 'EN' ? 'Brilliant Minds' : 'Mentes Brillantes'}
                </h3>
                <p className="text-[14px] sm:text-[15px] leading-[1.65] mb-4" style={{ color: '#0F0A18' }}>
                  {lang === 'PT'
                    ? 'Converse com as maiores mentes da pregação cristã. Cada mentor foi treinado com centenas de horas de sermões, livros e teologia original. Pergunte, aprenda e crie conteúdo inspirado pela tradição.'
                    : lang === 'EN'
                      ? 'Chat with the greatest minds in Christian preaching. Each mentor was trained on hundreds of hours of sermons, books and original theology. Ask, learn and create content inspired by tradition.'
                      : 'Conversa con las mayores mentes de la predicación cristiana. Cada mentor fue entrenado con cientos de horas de sermones, libros y teología original. Pregunta, aprende y crea contenido inspirado en la tradición.'}
                </p>
                <div className="flex flex-wrap gap-3 mb-5 text-[12px] font-medium" style={{ color: '#1E1240' }}>
                  <span>168M+ tokens</span>
                  <span>·</span>
                  <span>30,000+ {lang === 'PT' ? 'páginas' : lang === 'EN' ? 'pages' : 'páginas'}</span>
                </div>
                <Link to="/cadastro" className="inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 rounded-lg transition-all hover:scale-[1.02]" style={{ background: '#0F0A18', color: '#E8E0F5' }}>
                  <MessageCircle className="w-4 h-4" />
                  {lang === 'PT' ? 'Experimentar' : lang === 'EN' ? 'Try it' : 'Probar'}
                </Link>
              </div>

              {/* Right: Mini mind cards (2-3) */}
              <div className="flex-shrink-0 w-full sm:w-[280px] space-y-3">
                {minds.filter(m => m.id !== 'marco-feliciano' && m.id !== 'tiago-brunet' && m.id !== 'martyn-lloyd-jones').slice(0, 3).map((mind) => (
                  <div key={mind.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: '#fff', border: '1px solid rgba(15,10,24,0.08)' }}>
                    <img src={mind.image} alt={mind.name} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: 'rgba(109,40,217,0.2)' }} loading="lazy" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#0F0A18' }}>{mind.name} {mind.flag}</p>
                      <p className="text-[11px] truncate" style={{ color: '#1E1240' }}>{mind.subtitle[lang]}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#4CAF50' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 10. PRICING ===== */}
      <section id="pricing" className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.pricing.tag[lang]}</p>
          <h2 className="font-display text-[24px] sm:text-[36px] font-semibold leading-tight mb-8" style={{ color: '#0F0A18' }}>{copy.pricing.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-full overflow-x-hidden">
            {regionLoading ? (
              [0,1,2,3].map(i => (
                <div key={i} className="rounded-xl p-5 flex flex-col gap-3 animate-pulse" style={{ background: '#FFFFFF', border: '1px solid rgba(15,10,24,0.12)' }}>
                  <div className="h-4 w-16 rounded" style={{ background: '#F8F6FF' }} />
                  <div className="h-9 w-24 rounded" style={{ background: '#F8F6FF' }} />
                  <div className="h-3 w-20 rounded" style={{ background: '#F8F6FF' }} />
                  <div className="space-y-2 mt-4">
                    {[0,1,2,3].map(j => <div key={j} className="h-3 w-full rounded" style={{ background: '#F8F6FF' }} />)}
                  </div>
                  <div className="h-10 w-full rounded-lg mt-auto" style={{ background: '#F8F6FF' }} />
                </div>
              ))
            ) : (
              pricingPlans.map((plan, i) => (
                <RevealOnScroll key={i} delay={i * 0.1}>
                  <div className="rounded-xl p-5 flex flex-col h-full" style={{
                    background: plan.featured ? '#E8E0F5' : '#FFFFFF',
                    border: plan.featured ? '2px solid #0F0A18' : '1px solid rgba(15,10,24,0.12)',
                  }}>
                    {plan.featured && (
                      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2 self-start" style={{ background: '#0F0A18', color: '#E8E0F5' }}>
                        {lang === 'PT' ? 'Mais escolhido' : lang === 'EN' ? 'Most popular' : 'Más elegido'}
                      </span>
                    )}
                    <p className="text-[15px] font-semibold mb-1" style={{ color: '#0F0A18' }}>{plan.name[lang]}</p>
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span className="font-display text-[32px] font-semibold" style={{ color: '#0F0A18' }}>{plan.price}</span>
                    </div>
                    <p className="text-[13px] mb-2 font-medium" style={{ color: '#0F0A18' }}>{plan.period[lang]}</p>
                    <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4 self-start" style={{ background: '#F8F6FF', color: '#0F0A18' }}>
                      {plan.capacity[lang]}
                    </span>
                    <div className="space-y-2 mb-4 flex-1 pt-3" style={{ borderTop: '1px solid rgba(15,10,24,0.1)' }}>
                      {plan.features[lang].map((f, j) => (
                        <div key={j} className="flex items-start gap-2 text-[14px]" style={{ color: '#0F0A18' }}>
                          <span className="shrink-0 font-semibold" style={{ color: '#0F0A18' }}>✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <Link to={plan.planKey ? `/cadastro?plan=${plan.planKey}` : '/cadastro'} className="block text-center text-[14px] font-semibold py-3 rounded-lg transition-transform hover:scale-[1.02]" style={{
                      background: plan.featured ? '#0F0A18' : '#F8F6FF',
                      color: plan.featured ? '#FFFFFF' : '#0F0A18',
                    }}>{plan.cta[lang]}</Link>
                  </div>
                </RevealOnScroll>
              ))
            )}
          </div>
          <p className="text-[12px] text-center mt-6 leading-6" style={{ color: '#1E1240' }}>
            {lang === 'PT' && <>Todos os planos incluem <strong style={{ color: '#0F0A18' }}>PT · EN · ES</strong> nativos · 7 dias grátis no Starter e Pro, sem cartão · <strong style={{ color: '#0F0A18' }}>Domínio próprio</strong> a partir do Pro</>}
            {lang === 'EN' && <>All plans include native <strong style={{ color: '#0F0A18' }}>PT · EN · ES</strong> · 7 days free on Starter & Pro, no card · <strong style={{ color: '#0F0A18' }}>Custom domain</strong> from Pro plan</>}
            {lang === 'ES' && <>Todos los planes incluyen <strong style={{ color: '#0F0A18' }}>PT · EN · ES</strong> nativos · 7 días gratis en Starter y Pro, sin tarjeta · <strong style={{ color: '#0F0A18' }}>Dominio propio</strong> desde el Pro</>}
          </p>
        </div>
      </section>

      {/* ===== 11. FAQ ===== */}
      <section className="py-14 sm:py-18 px-5 sm:px-8" style={{ background: '#E8E0F5' }} itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-5xl mx-auto">
          <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: '#6D28D9' }}>{copy.faq.tag[lang]}</p>
          <h2 className="font-display text-[24px] sm:text-[36px] font-semibold leading-tight mb-6" style={{ color: '#0F0A18' }}>{copy.faq.h2[lang]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {copy.faq.items.map((item, i) => (
              <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-xl p-5 transition-shadow hover:shadow-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(15,10,24,0.1)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold" itemProp="name" style={{ color: '#0F0A18' }}>{item.q[lang]}</h3>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: '#0F0A18' }} />
                  </div>
                  {openFaq === i && (
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p className="text-[15px] leading-[1.65] mt-3" itemProp="text" style={{ color: '#0F0A18' }}>{item.a[lang]}</p>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 12. CTA FINAL ===== */}
      <section className="py-16 sm:py-20 px-5 text-center safe-area-bottom" style={{ background: '#0F0A18' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-[24px] sm:text-[38px] font-semibold leading-tight mb-4" style={{ color: '#E8E0F5' }}>
            {copy.ctaFinal.h2_1[lang]}<br /><em>{copy.ctaFinal.h2_em[lang]}</em>
          </h2>
          <p className="text-[16px] leading-[1.7] mb-8" style={{ color: 'rgba(232,224,245,0.75)' }}>{copy.ctaFinal.sub[lang]}</p>
          <Link to="/cadastro" className="inline-block text-[16px] font-semibold px-9 py-4 rounded-xl mb-4 transition-transform hover:scale-[1.02]" style={{ background: '#E8E0F5', color: '#0F0A18' }}>{copy.ctaFinal.cta[lang]}</Link>
          <br />
          <span className="text-[13px] font-medium" style={{ color: 'rgba(232,224,245,0.5)' }}>{copy.ctaFinal.tags[lang]}</span>
          <p className="font-display text-[14px] italic mt-6" style={{ color: 'rgba(232,224,245,0.35)' }}>{copy.ctaFinal.verse[lang]}</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-5 sm:px-8" style={{ background: '#0F0A18' }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display text-lg" style={{ color: 'rgba(232,224,245,0.7)' }}>
              Living <span style={{ color: '#6D28D9' }}>Word</span>
            </span>
            <div className="flex items-center gap-5">
              <span className="text-[13px] font-medium" style={{ color: 'rgba(232,224,245,0.4)' }}>{lang === 'PT' ? 'Privacidade' : lang === 'EN' ? 'Privacy' : 'Privacidad'}</span>
              <span className="text-[13px] font-medium" style={{ color: 'rgba(232,224,245,0.4)' }}>{lang === 'PT' ? 'Termos' : lang === 'EN' ? 'Terms' : 'Términos'}</span>
              <span className="text-[13px] font-medium" style={{ color: 'rgba(232,224,245,0.4)' }}>{lang === 'PT' ? 'Contato' : lang === 'EN' ? 'Contact' : 'Contacto'}</span>
            </div>
            <div className="flex gap-3">
              {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className="text-[13px] font-semibold" style={{ color: l === lang ? '#6D28D9' : 'rgba(232,224,245,0.35)' }}>{l}</button>
              ))}
            </div>
          </div>
          <PWAFooterInstallButton lang={lang} />
        </div>
      </footer>
    </div>
  );
}
