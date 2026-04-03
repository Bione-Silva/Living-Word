import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import {
  Clock, Languages, Zap, Lock, FileText, Globe, Users, Mic,
  ChevronDown, Check, X as XIcon, Menu, X
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
    eyebrow: { PT: 'Copiloto pastoral trilíngue · PT · EN · ES', EN: 'Trilingual pastoral copilot · PT · EN · ES', ES: 'Copiloto pastoral trilingüe · PT · EN · ES' },
    h1_1: { PT: 'A Palavra que você prega', EN: 'The Word you preach on Sunday', ES: 'La Palabra que predicas el domingo' },
    h1_2: { PT: 'no domingo', EN: '', ES: '' },
    h1_em: { PT: 'precisa circular na semana', EN: 'needs to reach people all week long', ES: 'necesita circular toda la semana' },
    sub: {
      PT: 'Do sermão ao blog publicado em minutos. Com fidelidade bíblica, sua voz pastoral e alcance real — em português, inglês e espanhol.',
      EN: 'From sermon to published blog in minutes. With biblical faithfulness, your pastoral voice, and real reach — in Portuguese, English and Spanish.',
      ES: 'Del sermón al blog publicado en minutos. Con fidelidad bíblica, tu voz pastoral y alcance real — en portugués, inglés y español.',
    },
    cta1: { PT: 'Criar meu blog grátis →', EN: 'Create my free blog →', ES: 'Crear mi blog gratis →' },
    cta2: { PT: 'Ver como funciona', EN: 'See how it works', ES: 'Ver cómo funciona' },
    verse: { PT: '"A Palavra de Deus não está acorrentada." — 2 Timóteo 2:9', EN: '"God\'s word is not chained." — 2 Timothy 2:9', ES: '"La Palabra de Dios no está encadenada." — 2 Timoteo 2:9' },
  },
  badges: [
    { PT: 'Evangélicos', EN: 'Evangelicals', ES: 'Evangélicos' },
    { PT: 'Católicos', EN: 'Catholics', ES: 'Católicos' },
    { PT: 'Líderes', EN: 'Leaders', ES: 'Líderes' },
    { PT: 'Influencers de fé', EN: 'Faith influencers', ES: 'Influencers de fe' },
  ],
  stats: [
    { num: '3', label: { PT: 'Idiomas nativos', EN: 'Native languages', ES: 'Idiomas nativos' } },
    { num: '7', label: { PT: 'Formatos por geração', EN: 'Formats per generation', ES: 'Formatos por generación' } },
    { num: '60s', label: { PT: 'Do input ao blog publicado', EN: 'From input to published blog', ES: 'Del input al blog publicado' } },
    { num: '$0', label: { PT: 'Para começar', EN: 'To get started', ES: 'Para empezar' } },
  ],
  problem: {
    tag: { PT: 'O problema real', EN: 'The real problem', ES: 'El problema real' },
    h2: { PT: 'Você prepara horas. A mensagem some em minutos.', EN: 'You prepare for hours. The message vanishes in minutes.', ES: 'Preparas durante horas. El mensaje desaparece en minutos.' },
    sub: {
      PT: 'Cada sermão levou pesquisa, oração e dedicação. Mas ao terminar o culto, toda aquela riqueza desaparece. Seu povo precisa dela durante a semana — e você não tem tempo de transformar tudo isso em conteúdo.',
      EN: 'Every sermon took research, prayer, and dedication. But when service ends, all that richness disappears. Your people need it during the week — and you don\'t have time to turn it all into content.',
      ES: 'Cada sermón requirió investigación, oración y dedicación. Pero al terminar el culto, toda esa riqueza desaparece. Tu pueblo la necesita durante la semana — y no tienes tiempo para transformarlo en contenido.',
    },
    cards: [
      { icon: Clock, title: { PT: 'Sem tempo para escrever', EN: 'No time to write', ES: 'Sin tiempo para escribir' }, desc: { PT: 'Pastor bivocacional trabalha a semana toda. No domingo prega. Não sobra hora para blog, devocional ou redes.', EN: 'Bivocational pastor works all week. Preaches Sunday. No time left for blog, devotional or social media.', ES: 'Pastor bivocacional trabaja toda la semana. El domingo predica. No le queda tiempo para blog o redes.' } },
      { icon: Languages, title: { PT: 'Bilíngue é desafio real', EN: 'Bilingual is a real challenge', ES: 'Bilingüe es un desafío real' }, desc: { PT: 'Sua congregação fala português e inglês. O imigrante hispânico ao lado não tem nada em espanhol.', EN: 'Your congregation speaks Portuguese and English. The Hispanic immigrant next door has nothing in Spanish.', ES: 'Tu congregación habla portugués e inglés. El inmigrante hispano no tiene nada en español.' } },
      { icon: Zap, title: { PT: 'IA genérica não serve', EN: 'Generic AI doesn\'t work', ES: 'La IA genérica no sirve' }, desc: { PT: 'ChatGPT não conhece seu povo. Não sabe da saudade de casa, dos documentos, da família dividida.', EN: 'ChatGPT doesn\'t know your people. It doesn\'t know about homesickness, documents, or divided families.', ES: 'ChatGPT no conoce a tu pueblo. No sabe de la nostalgia, los documentos ni la familia dividida.' } },
      { icon: Lock, title: { PT: 'Sem site, sem presença', EN: 'No website, no presence', ES: 'Sin sitio, sin presencia' }, desc: { PT: 'Você não tem WordPress nem sabe criar um. Seu ministério não aparece quando alguém busca no Google.', EN: 'You don\'t have WordPress and don\'t know how to set one up. Your ministry doesn\'t appear when someone searches Google.', ES: 'No tienes WordPress ni sabes crear uno. Tu ministerio no aparece cuando alguien busca en Google.' } },
    ],
  },
  how: {
    tag: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
    h2: { PT: 'Três campos. Sete formatos. Sessenta segundos.', EN: 'Three fields. Seven formats. Sixty seconds.', ES: 'Tres campos. Siete formatos. Sesenta segundos.' },
    steps: [
      {
        title: { PT: 'Você traz a passagem e a dor do seu povo', EN: 'You bring the passage and your people\'s pain', ES: 'Tú traes el pasaje y el dolor de tu pueblo' },
        desc: { PT: 'Informe a passagem bíblica, o público da sua congregação e o tema do momento — solidão, documentos, família, propósito. Três campos. Sem formulário longo.', EN: 'Enter the Bible passage, your congregation\'s audience, and the pressing topic — loneliness, documents, family, purpose. Three fields. No long forms.', ES: 'Ingresa el pasaje bíblico, tu audiencia y el tema del momento — soledad, documentos, familia, propósito. Tres campos. Sin formularios largos.' },
        badge: { PT: 'João 15:1-8 · Imigrantes · Saudade de casa', EN: 'John 15:1-8 · Immigrants · Homesickness', ES: 'Juan 15:1-8 · Inmigrantes · Nostalgia' },
      },
      {
        title: { PT: 'A plataforma gera com sua voz pastoral', EN: 'The platform generates with your pastoral voice', ES: 'La plataforma genera con tu voz pastoral' },
        desc: { PT: 'Você escolhe seu estilo (expositivo, narrativo, acolhedor), sua versão bíblica e sua linha doutrinária. O conteúdo soa como você — não como template de IA.', EN: 'You choose your style (expository, narrative, welcoming), your Bible version and your doctrinal line. The content sounds like you — not like an AI template.', ES: 'Eliges tu estilo (expositivo, narrativo, acogedor), tu versión bíblica y tu línea doctrinal. El contenido suena como tú — no como plantilla de IA.' },
        badge: { PT: 'Guardrails teológicos · Fidelidade bíblica · Sua voz', EN: 'Theological guardrails · Biblical faithfulness · Your voice', ES: 'Guardrails teológicos · Fidelidad bíblica · Tu voz' },
      },
      {
        title: { PT: 'Sete formatos prontos para circular', EN: 'Seven formats ready to circulate', ES: 'Siete formatos listos para circular' },
        desc: { PT: 'Sermão, esboço, devocional, pontos para Reels, versão bilíngue, adaptação para célula e artigo de blog — tudo gerado de uma vez. Publique no seu blog com um clique.', EN: 'Sermon, outline, devotional, Reels points, bilingual version, cell group adaptation, and blog article — all generated at once. Publish to your blog with one click.', ES: 'Sermón, bosquejo, devocional, puntos para Reels, versión bilingüe, adaptación para célula y artículo de blog — todo generado de una vez. Publica con un clic.' },
        badge: { PT: 'Blog publicado automaticamente · joao.livingword.app', EN: 'Blog published automatically · john.livingword.app', ES: 'Blog publicado automáticamente · juan.livingword.app' },
      },
    ],
  },
  features: {
    tag: { PT: 'O que está incluído', EN: 'What\'s included', ES: 'Qué está incluido' },
    h2: { PT: 'Do púlpito ao leitor. Fiel, claro, com alcance.', EN: 'From pulpit to reader. Faithful, clear, with reach.', ES: 'Del púlpito al lector. Fiel, claro, con alcance.' },
    items: [
      { icon: FileText, title: { PT: '7 formatos em 1 geração', EN: '7 formats in 1 generation', ES: '7 formatos en 1 generación' }, desc: { PT: 'Sermão, esboço, devocional, reels, bilíngue, célula e artigo de blog. Tudo de uma vez.', EN: 'Sermon, outline, devotional, reels, bilingual, cell group and blog article. All at once.', ES: 'Sermón, bosquejo, devocional, reels, bilingüe, célula y artículo de blog. Todo de una vez.' } },
      { icon: Globe, title: { PT: 'Trilíngue nativo', EN: 'Native trilingual', ES: 'Trilingüe nativo' }, desc: { PT: 'PT, EN e ES gerados com voz pastoral nativa — não tradução automática.', EN: 'PT, EN and ES generated with native pastoral voice — not automatic translation.', ES: 'PT, EN y ES generados con voz pastoral nativa — no traducción automática.' }, unique: true },
      { icon: FileText, title: { PT: 'Blog publicado automaticamente', EN: 'Blog published automatically', ES: 'Blog publicado automáticamente' }, desc: { PT: 'Seu subdomínio pessoal criado no cadastro. Artigos publicados com seu nome.', EN: 'Your personal subdomain created at signup. Articles published with your name.', ES: 'Tu subdominio personal creado al registrarte. Artículos publicados con tu nombre.' } },
      { icon: Users, title: { PT: 'Contexto imigrante', EN: 'Immigrant context', ES: 'Contexto inmigrante' }, desc: { PT: '12 temas pré-configurados: saudade, documentos, família dividida, identidade.', EN: '12 pre-configured themes: homesickness, documents, divided family, identity.', ES: '12 temas preconfigurados: nostalgia, documentos, familia dividida, identidad.' }, unique: true },
      { icon: FileText, title: { PT: 'Guardrails teológicos reais', EN: 'Real theological guardrails', ES: 'Guardrails teológicos reales' }, desc: { PT: 'Exegese antes de aplicação. Distinção texto/interpretação/aplicação. Alerta de eisegese.', EN: 'Exegesis before application. Text/interpretation/application distinction. Eisegesis alert.', ES: 'Exégesis antes de aplicación. Distinción texto/interpretación/aplicación. Alerta de eiségesis.' } },
      { icon: Mic, title: { PT: 'Sua voz pastoral', EN: 'Your pastoral voice', ES: 'Tu voz pastoral' }, desc: { PT: 'Expositivo, narrativo, apologético, profético — o conteúdo soa como você, não como template.', EN: 'Expository, narrative, apologetic, prophetic — the content sounds like you, not like a template.', ES: 'Expositivo, narrativo, apologético, profético — el contenido suena como tú, no como plantilla.' } },
    ],
  },
  vs: {
    h2: { PT: 'Por que não o SermonSpark?', EN: 'Why not SermonSpark?', ES: '¿Por qué no SermonSpark?' },
    them: { PT: 'Outros tools (SermonSpark, etc.)', EN: 'Other tools (SermonSpark, etc.)', ES: 'Otras herramientas (SermonSpark, etc.)' },
    us: { PT: 'Living Word', EN: 'Living Word', ES: 'Living Word' },
    xItems: [
      { PT: 'Apenas inglês — PT e ES inexistentes', EN: 'English only — PT and ES non-existent', ES: 'Solo inglés — PT y ES inexistentes' },
      { PT: 'Sem contexto imigrante ou cultural', EN: 'No immigrant or cultural context', ES: 'Sin contexto inmigrante o cultural' },
      { PT: 'Sem publicação — você copia e cola', EN: 'No publishing — you copy and paste', ES: 'Sin publicación — copias y pegas' },
      { PT: 'Ferramentas separadas, sem fluxo', EN: 'Separate tools, no workflow', ES: 'Herramientas separadas, sin flujo' },
      { PT: 'Guardrails teológicos são só disclaimers', EN: 'Theological guardrails are just disclaimers', ES: 'Guardrails teológicos son solo disclaimers' },
      { PT: 'Web-only, sem app mobile nativo', EN: 'Web-only, no native mobile app', ES: 'Solo web, sin app móvil nativa' },
    ],
    checkItems: [
      { PT: 'PT, EN, ES gerados nativamente', EN: 'PT, EN, ES generated natively', ES: 'PT, EN, ES generados nativamente' },
      { PT: '12 temas imigrantes embutidos', EN: '12 immigrant themes built-in', ES: '12 temas inmigrantes integrados' },
      { PT: 'Blog publicado automaticamente', EN: 'Blog published automatically', ES: 'Blog publicado automáticamente' },
      { PT: '7 formatos em 1 clique, 60 segundos', EN: '7 formats in 1 click, 60 seconds', ES: '7 formatos en 1 clic, 60 segundos' },
      { PT: 'Exegese + camadas + alerta de eisegese', EN: 'Exegesis + layers + eisegesis alert', ES: 'Exégesis + capas + alerta de eiségesis' },
      { PT: 'Mobile-first · PT · EN · ES', EN: 'Mobile-first · PT · EN · ES', ES: 'Mobile-first · PT · EN · ES' },
    ],
  },
  testimonials: {
    tag: { PT: 'Quem usa', EN: 'Who uses it', ES: 'Quién lo usa' },
    h2: { PT: 'De pastores que pregam toda semana.', EN: 'From pastors who preach every week.', ES: 'De pastores que predican cada semana.' },
    items: [
      { quote: { PT: '"Finalmente uma ferramenta que entende que minha congregação é brasileira em Atlanta. O conteúdo soa como eu prego, não como tradução de Google."', EN: '"Finally a tool that understands my congregation is Brazilian in Atlanta. The content sounds like I preach, not like Google Translate."', ES: '"Finalmente una herramienta que entiende que mi congregación es brasileña en Atlanta."' }, name: 'Pr. João Silva', flag: '🇧🇷', role: { PT: 'Igreja Brasileira · Atlanta, GA', EN: 'Brazilian Church · Atlanta, GA', ES: 'Iglesia Brasileña · Atlanta, GA' }, initials: 'JS' },
      { quote: { PT: '"Mi congregación habla español e inglés. Ahora publico el devocional en los dos idiomas cada semana, con mi voz, en menos de un minuto."', EN: '"My congregation speaks Spanish and English. Now I publish the devotional in both languages every week, with my voice, in under a minute."', ES: '"Mi congregación habla español e inglés. Ahora publico el devocional en los dos idiomas cada semana, con mi voz, en menos de un minuto."' }, name: 'Pastor Miguel Cruz', flag: '🇲🇽', role: { PT: 'Iglesia Hispana · Los Angeles, CA', EN: 'Hispanic Church · Los Angeles, CA', ES: 'Iglesia Hispana · Los Angeles, CA' }, initials: 'MC' },
      { quote: { PT: '"I was skeptical about AI for sermons. Living Word is different — it actually understands theology, not just generates text. The exegesis layer is real."', EN: '"I was skeptical about AI for sermons. Living Word is different — it actually understands theology, not just generates text. The exegesis layer is real."', ES: '"Era escéptico sobre la IA para sermones. Living Word es diferente — realmente entiende teología."' }, name: 'Rev. Robert Johnson', flag: '🇺🇸', role: { PT: 'Baptist Church · Nashville, TN', EN: 'Baptist Church · Nashville, TN', ES: 'Iglesia Bautista · Nashville, TN' }, initials: 'RJ' },
      { quote: { PT: '"Sou líder de célula, não pastor. Nunca teria tempo de preparar material assim. Agora cada semana chego com devocional, perguntas e reels prontos."', EN: '"I\'m a cell leader, not a pastor. I would never have time to prepare material like this. Now every week I arrive with devotional, questions and reels ready."', ES: '"Soy líder de célula, no pastor. Nunca tendría tiempo para preparar este material. Ahora cada semana llego con devocional y reels listos."' }, name: 'Ana Cruz', flag: '🇧🇷', role: { PT: 'Líder de célula · Miami, FL', EN: 'Cell leader · Miami, FL', ES: 'Líder de célula · Miami, FL' }, initials: 'AC' },
    ],
  },
  pricing: {
    tag: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
    h2: { PT: 'Comece grátis. Cresça quando precisar.', EN: 'Start free. Grow when you need to.', ES: 'Empieza gratis. Crece cuando necesites.' },
  },
  plans: [
    { name: 'Free', price: '$0', period: { PT: 'Para sempre', EN: 'Forever', ES: 'Para siempre' }, features: { PT: ['5 gerações/mês', 'Sermão + esboço', '1 artigo/mês', 'Blog no ar'], EN: ['5 generations/month', 'Sermon + outline', '1 article/month', 'Blog live'], ES: ['5 generaciones/mes', 'Sermón + bosquejo', '1 artículo/mes', 'Blog en línea'] }, cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' }, featured: false },
    { name: 'Pastoral', price: '$9', period: { PT: '/mês · 7 dias grátis', EN: '/month · 7 days free', ES: '/mes · 7 días gratis' }, features: { PT: ['40 gerações/mês', 'Todos os 7 formatos', '20 artigos/mês', 'Sem watermark', 'Todas as vozes pastorais'], EN: ['40 generations/month', 'All 7 formats', '20 articles/month', 'No watermark', 'All pastoral voices'], ES: ['40 generaciones/mes', 'Los 7 formatos', '20 artículos/mes', 'Sin marca de agua', 'Todas las voces pastorales'] }, cta: { PT: '7 dias grátis →', EN: '7 days free →', ES: '7 días gratis →' }, featured: true },
    { name: 'Church', price: '$29', period: { PT: '/mês', EN: '/month', ES: '/mes' }, features: { PT: ['200 gerações/mês', 'Equipe (3 usuários)', '3 sites WordPress', 'Agendamento'], EN: ['200 generations/month', 'Team (3 users)', '3 WordPress sites', 'Scheduling'], ES: ['200 generaciones/mes', 'Equipo (3 usuarios)', '3 sitios WordPress', 'Agendamiento'] }, cta: { PT: 'Começar', EN: 'Get started', ES: 'Empezar' }, featured: false },
    { name: 'Ministry', price: '$79', period: { PT: '/mês', EN: '/month', ES: '/mes' }, features: { PT: ['500 gerações/mês', 'Equipe (10 usuários)', '10 sites WordPress', 'Analytics completo'], EN: ['500 generations/month', 'Team (10 users)', '10 WordPress sites', 'Full analytics'], ES: ['500 generaciones/mes', 'Equipo (10 usuarios)', '10 sitios WordPress', 'Analytics completo'] }, cta: { PT: 'Falar com equipe', EN: 'Contact team', ES: 'Contactar equipo' }, featured: false },
  ],
  faq: {
    tag: { PT: 'Perguntas frequentes', EN: 'FAQ', ES: 'Preguntas frecuentes' },
    h2: { PT: 'Respostas diretas.', EN: 'Straight answers.', ES: 'Respuestas directas.' },
    items: [
      { q: { PT: 'A IA substitui o pastor?', EN: 'Does AI replace the pastor?', ES: '¿La IA reemplaza al pastor?' }, a: { PT: 'Não. O Living Word é um copiloto — como um comentário bíblico. Você prega. A IA prepara.', EN: 'No. Living Word is a copilot — like a commentary. You preach. AI prepares.', ES: 'No. Living Word es un copiloto — como un comentario bíblico. Tú predicas. La IA prepara.' } },
      { q: { PT: 'Funciona para católicos também?', EN: 'Does it work for Catholics too?', ES: '¿Funciona para católicos también?' }, a: { PT: 'Sim. Suporta diferentes tradições: evangélica, batista, pentecostal, carismática, reformada e católica.', EN: 'Yes. It supports different traditions: evangelical, Baptist, Pentecostal, charismatic, Reformed, and Catholic.', ES: 'Sí. Soporta diferentes tradiciones: evangélica, bautista, pentecostal, carismática, reformada y católica.' } },
      { q: { PT: 'O que acontece no cadastro?', EN: 'What happens at signup?', ES: '¿Qué pasa al registrarse?' }, a: { PT: 'Em menos de 2 minutos seu blog (seu-nome.livingword.app) está no ar com 2 artigos publicados com seu nome.', EN: 'In less than 2 minutes your blog (your-name.livingword.app) is live with 2 articles published under your name.', ES: 'En menos de 2 minutos tu blog (tu-nombre.livingword.app) está en línea con 2 artículos publicados con tu nombre.' } },
      { q: { PT: 'Precisa de cartão para o trial de 7 dias?', EN: 'Do I need a card for the 7-day trial?', ES: '¿Necesito tarjeta para la prueba de 7 días?' }, a: { PT: 'Não. Só solicitamos cartão no 8º dia se quiser continuar.', EN: 'No. We only ask for a card on day 8 if you want to continue.', ES: 'No. Solo solicitamos tarjeta el día 8 si deseas continuar.' } },
    ],
  },
  ctaFinal: {
    h2_1: { PT: 'A Palavra que você prega', EN: 'The Word you preach', ES: 'La Palabra que predicas' },
    h2_em: { PT: 'merece circular além do domingo.', EN: 'deserves to reach beyond Sunday.', ES: 'merece circular más allá del domingo.' },
    sub: { PT: 'Crie seu blog pastoral hoje. Publique seu primeiro devocional em 60 segundos. Grátis para sempre, sem cartão de crédito.', EN: 'Create your pastoral blog today. Publish your first devotional in 60 seconds. Free forever, no credit card.', ES: 'Crea tu blog pastoral hoy. Publica tu primer devocional en 60 segundos. Gratis para siempre, sin tarjeta.' },
    cta: { PT: 'Criar minha conta grátis →', EN: 'Create my free account →', ES: 'Crear mi cuenta gratis →' },
    tags: { PT: 'PT · EN · ES · Evangélicos · Católicos · Líderes · Influencers de fé', EN: 'PT · EN · ES · Evangelicals · Catholics · Leaders · Faith influencers', ES: 'PT · EN · ES · Evangélicos · Católicos · Líderes · Influencers de fe' },
    verse: { PT: '"Assim será a palavra que sair da minha boca: não voltará para mim vazia." — Isaías 55:11', EN: '"So shall my word be that goes out from my mouth; it shall not return to me empty." — Isaiah 55:11', ES: '"Así será mi palabra que sale de mi boca: no volverá a mí vacía." — Isaías 55:11' },
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
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif", color: '#3D2B1F' }}>

      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#3D2B1F' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <span className="font-display text-xl font-medium" style={{ color: '#F5F0E8' }}>
            Living <span className="italic" style={{ color: '#C4956A' }}>Word</span>
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <button onClick={() => scrollTo('how')} className="text-xs" style={{ color: 'rgba(245,240,232,0.6)' }}>{copy.nav.how[lang]}</button>
            <button onClick={() => scrollTo('features')} className="text-xs" style={{ color: 'rgba(245,240,232,0.6)' }}>{copy.nav.features[lang]}</button>
            <button onClick={() => scrollTo('pricing')} className="text-xs" style={{ color: 'rgba(245,240,232,0.6)' }}>{copy.nav.plans[lang]}</button>
            <div className="flex gap-1.5">
              {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className="text-[10px] font-medium" style={{ color: l === lang ? '#C4956A' : 'rgba(245,240,232,0.4)' }}>{l}</button>
              ))}
            </div>
            <Link to="/login" className="text-xs" style={{ color: 'rgba(245,240,232,0.6)' }}>{copy.nav.login[lang]}</Link>
            <Link to="/cadastro" className="text-xs font-medium px-4 py-1.5 rounded-full" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.nav.cta[lang]}</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" style={{ color: '#F5F0E8' }} /> : <Menu className="h-5 w-5" style={{ color: '#F5F0E8' }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-3" style={{ background: '#3D2B1F' }}>
            <button onClick={() => scrollTo('how')} className="block text-sm w-full text-left" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.how[lang]}</button>
            <button onClick={() => scrollTo('features')} className="block text-sm w-full text-left" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.features[lang]}</button>
            <button onClick={() => scrollTo('pricing')} className="block text-sm w-full text-left" style={{ color: 'rgba(245,240,232,0.7)' }}>{copy.nav.plans[lang]}</button>
            <div className="flex gap-3 pt-1">
              {(['PT', 'EN', 'ES'] as L[]).map((l) => (
                <button key={l} onClick={() => { setLang(l); setMobileMenuOpen(false); }} className="text-sm font-medium" style={{ color: l === lang ? '#C4956A' : 'rgba(245,240,232,0.4)' }}>{l}</button>
              ))}
            </div>
            <Link to="/login" className="block text-sm" style={{ color: '#C4956A' }}>{copy.nav.login[lang]}</Link>
            <Link to="/cadastro" className="block text-center text-sm font-medium px-4 py-2.5 rounded-xl" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.nav.cta[lang]}</Link>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="pt-14 text-center" style={{ background: '#3D2B1F' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase mb-4" style={{ color: '#C4956A' }}>{copy.hero.eyebrow[lang]}</p>
          <h1 className="font-display text-[32px] sm:text-[44px] font-medium leading-[1.15] mb-4" style={{ color: '#F5F0E8' }}>
            {copy.hero.h1_1[lang]}
            {copy.hero.h1_2[lang] && <><br />{copy.hero.h1_2[lang]}</>}
            <br /><em style={{ color: '#C4956A' }}>{copy.hero.h1_em[lang]}</em>
          </h1>
          <p className="text-[14px] sm:text-[15px] leading-relaxed max-w-[520px] mx-auto mb-7" style={{ color: 'rgba(245,240,232,0.65)' }}>{copy.hero.sub[lang]}</p>

          {/* Audience badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {copy.badges.map((b, i) => (
              <span key={i} className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(196,149,106,0.15)', color: '#C4956A', border: '0.5px solid rgba(196,149,106,0.3)' }}>{b[lang]}</span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/cadastro" className="inline-block text-sm font-medium px-7 py-3.5 rounded-xl" style={{ background: '#C4956A', color: '#3D2B1F' }}>{copy.hero.cta1[lang]}</Link>
            <button onClick={() => scrollTo('how')} className="inline-block text-[13px] px-6 py-3 rounded-xl" style={{ border: '1px solid rgba(196,149,106,0.4)', color: 'rgba(245,240,232,0.7)' }}>{copy.hero.cta2[lang]}</button>
          </div>

          <p className="font-display text-[13px] italic" style={{ color: 'rgba(245,240,232,0.35)' }}>{copy.hero.verse[lang]}</p>
        </div>
      </section>

      {/* ===== SOCIAL PROOF BAR ===== */}
      <section className="py-5 px-4" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
          {copy.stats.map((s, i) => (
            <div key={i} className="flex items-center gap-6 sm:gap-10">
              {i > 0 && <div className="hidden sm:block w-px h-8" style={{ background: 'rgba(107,79,58,0.2)' }} />}
              <div className="text-center">
                <div className="font-display text-[28px] font-medium" style={{ color: '#3D2B1F' }}>{s.num}</div>
                <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#8B6B54' }}>{s.label[lang]}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.problem.tag[lang]}</p>
          <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight mb-3.5" style={{ color: '#3D2B1F' }}>{copy.problem.h2[lang]}</h2>
          <p className="text-sm leading-relaxed mb-6 max-w-[560px]" style={{ color: '#8B6B54' }}>{copy.problem.sub[lang]}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {copy.problem.cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="rounded-xl p-4" style={{ background: '#F5F0E8', border: '0.5px solid rgba(107,79,58,0.15)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: '#EDD9C8' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: '#6B4F3A' }} />
                  </div>
                  <h3 className="text-[13px] font-medium mb-1" style={{ color: '#3D2B1F' }}>{c.title[lang]}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#8B6B54' }}>{c.desc[lang]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.how.tag[lang]}</p>
          <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight mb-6" style={{ color: '#3D2B1F' }}>{copy.how.h2[lang]}</h2>
          <div className="space-y-0">
            {copy.how.steps.map((step, i) => (
              <div key={i} className="flex gap-4 py-4" style={{ borderBottom: i < 2 ? '0.5px solid rgba(107,79,58,0.1)' : 'none' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-display text-lg font-medium" style={{ background: '#6B4F3A', color: '#F5F0E8' }}>{i + 1}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1" style={{ color: '#3D2B1F' }}>{step.title[lang]}</h3>
                  <p className="text-xs leading-relaxed mb-1.5" style={{ color: '#8B6B54' }}>{step.desc[lang]}</p>
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{step.badge[lang]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.features.tag[lang]}</p>
          <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight mb-6" style={{ color: '#3D2B1F' }}>{copy.features.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {copy.features.items.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-xl p-4" style={{ border: '0.5px solid rgba(107,79,58,0.12)', background: '#FFFFFF' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5" style={{ background: '#F5F0E8' }}>
                    <Icon className="h-4 w-4" style={{ color: '#6B4F3A' }} />
                  </div>
                  <h3 className="text-[13px] font-medium mb-1" style={{ color: '#3D2B1F' }}>
                    {f.title[lang]}
                    {f.unique && <span className="ml-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>único</span>}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#8B6B54' }}>{f.desc[lang]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== VS COMPETITORS ===== */}
      <section className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#3D2B1F' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[28px] sm:text-[30px] font-medium text-center mb-6" style={{ color: '#F5F0E8' }}>{copy.vs.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Them */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-3" style={{ color: 'rgba(245,240,232,0.4)' }}>{copy.vs.them[lang]}</p>
              <div className="space-y-2">
                {copy.vs.xItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-sm shrink-0" style={{ color: 'rgba(245,240,232,0.3)' }}>✗</span>
                    <span style={{ color: 'rgba(245,240,232,0.5)' }}>{item[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Us */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(196,149,106,0.15)', border: '0.5px solid rgba(196,149,106,0.3)' }}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-3" style={{ color: '#C4956A' }}>{copy.vs.us[lang]}</p>
              <div className="space-y-2">
                {copy.vs.checkItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-sm shrink-0" style={{ color: '#C4956A' }}>✓</span>
                    <span style={{ color: 'rgba(245,240,232,0.85)' }}>{item[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.testimonials.tag[lang]}</p>
          <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight mb-6" style={{ color: '#3D2B1F' }}>{copy.testimonials.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {copy.testimonials.items.map((t, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '0.5px solid rgba(107,79,58,0.12)' }}>
                <p className="font-display text-[15px] italic leading-relaxed mb-3" style={{ color: '#3D2B1F' }}>{t.quote[lang]}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0" style={{ background: '#EDD9C8', color: '#6B4F3A' }}>{t.initials}</div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#3D2B1F' }}>{t.name} {t.flag}</p>
                    <p className="text-[10px]" style={{ color: '#8B6B54' }}>{t.role[lang]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.pricing.tag[lang]}</p>
          <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight mb-6" style={{ color: '#3D2B1F' }}>{copy.pricing.h2[lang]}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {copy.plans.map((plan, i) => (
              <div key={i} className="rounded-xl p-4" style={{
                background: plan.featured ? '#F5F0E8' : '#FFFFFF',
                border: plan.featured ? '2px solid #6B4F3A' : '0.5px solid rgba(107,79,58,0.15)',
              }}>
                {plan.featured && (
                  <span className="inline-block text-[9px] font-medium px-2 py-0.5 rounded-full mb-1.5" style={{ background: '#6B4F3A', color: '#F5F0E8' }}>
                    {lang === 'PT' ? 'Mais escolhido' : lang === 'EN' ? 'Most popular' : 'Más elegido'}
                  </span>
                )}
                <p className="text-[13px] font-medium mb-1" style={{ color: '#3D2B1F' }}>{plan.name}</p>
                <div className="flex items-baseline gap-0.5 mb-0.5">
                  <span className="font-display text-[28px] font-medium" style={{ color: '#3D2B1F' }}>{plan.price}</span>
                </div>
                <p className="text-[11px] mb-3 pb-3" style={{ color: '#8B6B54', borderBottom: '0.5px solid rgba(107,79,58,0.1)' }}>{plan.period[lang]}</p>
                <div className="space-y-1.5 mb-3">
                  {plan.features[lang].map((f, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#3D2B1F' }}>
                      <span className="shrink-0 font-medium" style={{ color: '#6B4F3A' }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/cadastro" className="block text-center text-xs font-medium py-2.5 rounded-lg" style={{
                  background: plan.featured ? '#6B4F3A' : '#EDD9C8',
                  color: plan.featured ? '#FFFFFF' : '#6B4F3A',
                }}>{plan.cta[lang]}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-10 sm:py-14 px-4 sm:px-8" style={{ background: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase mb-3" style={{ color: '#C4956A' }}>{copy.faq.tag[lang]}</p>
          <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight mb-5" style={{ color: '#3D2B1F' }}>{copy.faq.h2[lang]}</h2>
          <div className="space-y-2">
            {copy.faq.items.map((item, i) => (
              <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-xl p-4" style={{ background: '#FFFFFF', border: '0.5px solid rgba(107,79,58,0.12)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-medium" style={{ color: '#3D2B1F' }}>{item.q[lang]}</h3>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: '#8B6B54' }} />
                </div>
                {openFaq === i && (
                  <p className="text-xs leading-relaxed mt-2" style={{ color: '#8B6B54' }}>{item.a[lang]}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-12 sm:py-16 px-4 text-center safe-area-bottom" style={{ background: '#6B4F3A' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-[28px] sm:text-[34px] font-medium leading-tight mb-3" style={{ color: '#F5F0E8' }}>
            {copy.ctaFinal.h2_1[lang]}<br /><em>{copy.ctaFinal.h2_em[lang]}</em>
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(245,240,232,0.65)' }}>{copy.ctaFinal.sub[lang]}</p>
          <Link to="/cadastro" className="inline-block text-sm font-medium px-8 py-3.5 rounded-xl mb-2.5" style={{ background: '#F5F0E8', color: '#3D2B1F' }}>{copy.ctaFinal.cta[lang]}</Link>
          <br />
          <span className="text-[11px]" style={{ color: 'rgba(245,240,232,0.4)' }}>{copy.ctaFinal.tags[lang]}</span>
          <p className="font-display text-[13px] italic mt-5" style={{ color: 'rgba(245,240,232,0.3)' }}>{copy.ctaFinal.verse[lang]}</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-6 px-4 sm:px-8" style={{ background: '#1E1510' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display text-base" style={{ color: 'rgba(245,240,232,0.6)' }}>
            Living <span style={{ color: '#C4956A' }}>Word</span> · Palavra Viva · Palabra Viva
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[11px]" style={{ color: 'rgba(245,240,232,0.3)' }}>{lang === 'PT' ? 'Privacidade' : lang === 'EN' ? 'Privacy' : 'Privacidad'}</span>
            <span className="text-[11px]" style={{ color: 'rgba(245,240,232,0.3)' }}>{lang === 'PT' ? 'Termos' : 'Terms'}</span>
            <span className="text-[11px]" style={{ color: 'rgba(245,240,232,0.3)' }}>{lang === 'PT' ? 'Contato' : 'Contact'}</span>
          </div>
          <div className="flex gap-2">
            {(['PT', 'EN', 'ES'] as L[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className="text-[10px]" style={{ color: l === lang ? '#C4956A' : 'rgba(245,240,232,0.3)' }}>{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
