// Full i18n copy for Landing Page — PT / EN / ES
export type L = 'PT' | 'EN' | 'ES';

export const nav = {
  howItWorks: { PT: 'Como funciona', EN: 'How it works', ES: 'Cómo funciona' },
  formats: { PT: 'Formatos', EN: 'Formats', ES: 'Formatos' },
  publish: { PT: 'Publicação', EN: 'Publishing', ES: 'Publicación' },
  plans: { PT: 'Planos', EN: 'Plans', ES: 'Planes' },
  faq: { PT: 'FAQ', EN: 'FAQ', ES: 'FAQ' },
  cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
};

export const hero = {
  headline: {
    PT: 'Crie sermões, estudos e conteúdo cristão com IA treinada nas Escrituras',
    EN: 'Create sermons, studies & Christian content with AI trained on Scripture',
    ES: 'Crea sermones, estudios y contenido cristiano con IA entrenada en las Escrituras',
  },
  sub: {
    PT: 'Uma plataforma de inteligência artificial treinada em Bíblias originais e modernas que apoia pastores, líderes e ministérios a criar sermões, devocionais, estudos bíblicos, artigos e mais — com fidelidade teológica, em PT, EN e ES.',
    EN: 'An AI platform trained on original and modern Bibles that supports pastors, leaders and ministries in creating sermons, devotionals, Bible studies, articles and more — with theological fidelity, in PT, EN and ES.',
    ES: 'Una plataforma de IA entrenada en Biblias originales y modernas que apoya a pastores, líderes y ministerios a crear sermones, devocionales, estudios bíblicos, artículos y más — con fidelidad teológica, en PT, EN y ES.',
  },
  cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
  cta2: { PT: 'Ver como funciona', EN: 'See how it works', ES: 'Ver cómo funciona' },
};

export const proofBar = {
  items: {
    PT: ['3 idiomas', '7+ formatos', '1 mensagem → vários canais', 'Fidelidade bíblica', 'Publicação automática'],
    EN: ['3 languages', '7+ formats', '1 message → multiple channels', 'Biblical fidelity', 'Auto publishing'],
    ES: ['3 idiomas', '7+ formatos', '1 mensaje → varios canales', 'Fidelidad bíblica', 'Publicación automática'],
  },
};

export const problem = {
  title: {
    PT: 'O problema que todo pastor conhece',
    EN: 'The problem every pastor knows',
    ES: 'El problema que todo pastor conoce',
  },
  cards: {
    PT: [
      { icon: '📅', text: 'A mensagem morre no domingo' },
      { icon: '⏳', text: 'Falta tempo para reaproveitar sermões e estudos' },
      { icon: '📉', text: 'Manter constância editorial é difícil' },
      { icon: '🌍', text: 'Adaptar para idiomas e públicos diferentes parece impossível' },
      { icon: '🤖', text: 'IA genérica não entende contexto cristão' },
    ],
    EN: [
      { icon: '📅', text: 'The message dies on Sunday' },
      { icon: '⏳', text: "There's no time to repurpose sermons and studies" },
      { icon: '📉', text: 'Keeping editorial consistency is hard' },
      { icon: '🌍', text: 'Adapting for different languages and audiences feels impossible' },
      { icon: '🤖', text: "Generic AI doesn't understand Christian context" },
    ],
    ES: [
      { icon: '📅', text: 'El mensaje muere el domingo' },
      { icon: '⏳', text: 'No hay tiempo para reutilizar sermones y estudios' },
      { icon: '📉', text: 'Mantener constancia editorial es difícil' },
      { icon: '🌍', text: 'Adaptar a idiomas y públicos diferentes parece imposible' },
      { icon: '🤖', text: 'La IA genérica no entiende el contexto cristiano' },
    ],
  },
};

export const whatItDoes = {
  title: {
    PT: 'O que o Living Word realmente faz',
    EN: 'What Living Word really does',
    ES: 'Lo que Living Word realmente hace',
  },
  steps: {
    PT: [
      { num: '1', title: 'Você ensina', desc: 'Sua passagem, seu tema, sua voz. O ponto de partida é sempre o que você já prega e estuda.' },
      { num: '2', title: 'O Living Word transforma', desc: 'Sermão vira artigo. Estudo vira devocional. Mensagem vira conteúdo para célula, blog e redes.' },
      { num: '3', title: 'O Living Word adapta', desc: 'Seu conteúdo sai em português, inglês e espanhol — com fidelidade bíblica e estilo pastoral.' },
      { num: '4', title: 'O Living Word publica', desc: 'Blog cristão, WordPress, calendário editorial. Do rascunho à publicação sem esforço.' },
    ],
    EN: [
      { num: '1', title: 'You teach', desc: 'Your passage, your topic, your voice. The starting point is always what you already preach and study.' },
      { num: '2', title: 'Living Word transforms', desc: 'Sermon becomes article. Study becomes devotional. Message becomes content for small groups, blog and social.' },
      { num: '3', title: 'Living Word adapts', desc: 'Your content goes out in Portuguese, English and Spanish — with biblical fidelity and pastoral style.' },
      { num: '4', title: 'Living Word publishes', desc: 'Christian blog, WordPress, editorial calendar. From draft to published effortlessly.' },
    ],
    ES: [
      { num: '1', title: 'Tú enseñas', desc: 'Tu pasaje, tu tema, tu voz. El punto de partida siempre es lo que ya predicas y estudias.' },
      { num: '2', title: 'Living Word transforma', desc: 'Sermón se convierte en artículo. Estudio en devocional. Mensaje en contenido para célula, blog y redes.' },
      { num: '3', title: 'Living Word adapta', desc: 'Tu contenido sale en portugués, inglés y español — con fidelidad bíblica y estilo pastoral.' },
      { num: '4', title: 'Living Word publica', desc: 'Blog cristiano, WordPress, calendario editorial. Del borrador a la publicación sin esfuerzo.' },
    ],
  },
};

export const howItWorks = {
  title: {
    PT: 'Simples como deve ser',
    EN: 'Simple as it should be',
    ES: 'Simple como debe ser',
  },
  steps: {
    PT: [
      { num: '01', title: 'Entre com a base', desc: 'Passagem bíblica, público-alvo, tema ou dor. O sistema precisa apenas da semente.' },
      { num: '02', title: 'O sistema organiza e gera', desc: 'Exegese, aplicação, formatação. Vários formatos de saída em segundos.' },
      { num: '03', title: 'Revise, publique e distribua', desc: 'Edite com sua voz, publique no blog ou exporte. Sua mensagem alcança mais pessoas.' },
    ],
    EN: [
      { num: '01', title: 'Enter the foundation', desc: 'Bible passage, target audience, topic or pain point. The system only needs the seed.' },
      { num: '02', title: 'The system organizes and generates', desc: 'Exegesis, application, formatting. Multiple output formats in seconds.' },
      { num: '03', title: 'Review, publish and distribute', desc: 'Edit with your voice, publish on the blog or export. Your message reaches more people.' },
    ],
    ES: [
      { num: '01', title: 'Ingresa la base', desc: 'Pasaje bíblico, público objetivo, tema o dolor. El sistema solo necesita la semilla.' },
      { num: '02', title: 'El sistema organiza y genera', desc: 'Exégesis, aplicación, formateo. Múltiples formatos de salida en segundos.' },
      { num: '03', title: 'Revisa, publica y distribuye', desc: 'Edita con tu voz, publica en el blog o exporta. Tu mensaje alcanza a más personas.' },
    ],
  },
};

export const formats = {
  title: {
    PT: 'Uma mensagem. Vários formatos. Mais alcance.',
    EN: 'One message. Multiple formats. More reach.',
    ES: 'Un mensaje. Varios formatos. Más alcance.',
  },
  items: {
    PT: [
      { icon: '📖', name: 'Sermão completo', desc: 'Estruturado com exegese, aplicação e fechamento' },
      { icon: '📝', name: 'Esboço', desc: 'Pontos-chave para pregação rápida' },
      { icon: '🕊️', name: 'Devocional', desc: 'Reflexão pessoal com aplicação prática' },
      { icon: '✍️', name: 'Artigo cristão', desc: 'Conteúdo editorial profundo e publicável' },
      { icon: '📰', name: 'Blog devocional', desc: 'Post otimizado para leitura online' },
      { icon: '👥', name: 'Conteúdo para célula', desc: 'Roteiro com perguntas e dinâmicas' },
      { icon: '📱', name: 'Conteúdo para redes', desc: 'Cards curtos e impactantes' },
      { icon: '🇬🇧', name: 'Versão em inglês', desc: 'Mesmo conteúdo adaptado para inglês' },
      { icon: '🇪🇸', name: 'Versão em espanhol', desc: 'Mesmo conteúdo adaptado para espanhol' },
    ],
    EN: [
      { icon: '📖', name: 'Full sermon', desc: 'Structured with exegesis, application and closing' },
      { icon: '📝', name: 'Outline', desc: 'Key points for quick preaching' },
      { icon: '🕊️', name: 'Devotional', desc: 'Personal reflection with practical application' },
      { icon: '✍️', name: 'Christian article', desc: 'Deep, publishable editorial content' },
      { icon: '📰', name: 'Blog devotional', desc: 'Post optimized for online reading' },
      { icon: '👥', name: 'Small group content', desc: 'Script with questions and dynamics' },
      { icon: '📱', name: 'Social media content', desc: 'Short and impactful cards' },
      { icon: '🇧🇷', name: 'Portuguese version', desc: 'Same content adapted to Portuguese' },
      { icon: '🇪🇸', name: 'Spanish version', desc: 'Same content adapted to Spanish' },
    ],
    ES: [
      { icon: '📖', name: 'Sermón completo', desc: 'Estructurado con exégesis, aplicación y cierre' },
      { icon: '📝', name: 'Bosquejo', desc: 'Puntos clave para predicación rápida' },
      { icon: '🕊️', name: 'Devocional', desc: 'Reflexión personal con aplicación práctica' },
      { icon: '✍️', name: 'Artículo cristiano', desc: 'Contenido editorial profundo y publicable' },
      { icon: '📰', name: 'Blog devocional', desc: 'Post optimizado para lectura online' },
      { icon: '👥', name: 'Contenido para célula', desc: 'Guión con preguntas y dinámicas' },
      { icon: '📱', name: 'Contenido para redes', desc: 'Cards cortos e impactantes' },
      { icon: '🇧🇷', name: 'Versión en portugués', desc: 'Mismo contenido adaptado al portugués' },
      { icon: '🇬🇧', name: 'Versión en inglés', desc: 'Mismo contenido adaptado al inglés' },
    ],
  },
};

export const fidelity = {
  title: {
    PT: 'Fidelidade bíblica e sua voz',
    EN: 'Biblical fidelity and your voice',
    ES: 'Fidelidad bíblica y tu voz',
  },
  sub: {
    PT: 'O Living Word não substitui o pastor. Ele amplifica o que você já ensina — com rigor teológico e respeito à sua voz.',
    EN: "Living Word doesn't replace the pastor. It amplifies what you already teach — with theological rigor and respect for your voice.",
    ES: 'Living Word no sustituye al pastor. Amplifica lo que ya enseñas — con rigor teológico y respeto a tu voz.',
  },
  points: {
    PT: [
      { title: 'Exegese antes de aplicação', desc: 'O texto bíblico é analisado em profundidade antes de qualquer geração.' },
      { title: 'Texto · Interpretação · Aplicação', desc: 'Separação clara entre o que o texto diz, o que significa e como se aplica.' },
      { title: 'Linha de ensino', desc: 'Você define a doutrina — reformada, pentecostal, batista, e mais.' },
      { title: 'Voz pastoral preservada', desc: 'O conteúdo reflete seu estilo, não um template genérico.' },
      { title: 'IA como apoio, não substituição', desc: 'O pastor decide. A ferramenta organiza, formata e adapta.' },
    ],
    EN: [
      { title: 'Exegesis before application', desc: 'The biblical text is deeply analyzed before any generation.' },
      { title: 'Text · Interpretation · Application', desc: 'Clear separation between what the text says, means and how it applies.' },
      { title: 'Teaching line', desc: 'You define the doctrine — reformed, pentecostal, baptist, and more.' },
      { title: 'Pastoral voice preserved', desc: 'Content reflects your style, not a generic template.' },
      { title: 'AI as support, not replacement', desc: 'The pastor decides. The tool organizes, formats and adapts.' },
    ],
    ES: [
      { title: 'Exégesis antes de aplicación', desc: 'El texto bíblico se analiza en profundidad antes de cualquier generación.' },
      { title: 'Texto · Interpretación · Aplicación', desc: 'Separación clara entre lo que dice el texto, su significado y cómo se aplica.' },
      { title: 'Línea de enseñanza', desc: 'Tú defines la doctrina — reformada, pentecostal, bautista, y más.' },
      { title: 'Voz pastoral preservada', desc: 'El contenido refleja tu estilo, no un template genérico.' },
      { title: 'IA como apoyo, no sustitución', desc: 'El pastor decide. La herramienta organiza, formatea y adapta.' },
    ],
  },
};

export const publishing = {
  title: {
    PT: 'Publicação e distribuição',
    EN: 'Publishing and distribution',
    ES: 'Publicación y distribución',
  },
  sub: {
    PT: 'Seu conteúdo merece sair do documento e chegar às pessoas. O Living Word cuida dessa ponte.',
    EN: 'Your content deserves to leave the document and reach people. Living Word takes care of that bridge.',
    ES: 'Tu contenido merece salir del documento y llegar a las personas. Living Word se encarga de ese puente.',
  },
  features: {
    PT: ['Blog cristão próprio', 'Publicação automática', 'Integração WordPress', 'Calendário editorial', 'Múltiplos sites', 'Agendamento', 'Rascunho → Publicado'],
    EN: ['Your own Christian blog', 'Auto publishing', 'WordPress integration', 'Editorial calendar', 'Multiple sites', 'Scheduling', 'Draft → Published'],
    ES: ['Blog cristiano propio', 'Publicación automática', 'Integración WordPress', 'Calendario editorial', 'Múltiples sitios', 'Programación', 'Borrador → Publicado'],
  },
};

export const beforeAfter = {
  title: {
    PT: 'Antes e depois do Living Word',
    EN: 'Before and after Living Word',
    ES: 'Antes y después de Living Word',
  },
  before: {
    title: { PT: 'Sem Living Word', EN: 'Without Living Word', ES: 'Sin Living Word' },
    items: {
      PT: ['Sermão pregado e esquecido', 'Conteúdo parado no caderno', 'Sem adaptação para outros públicos', 'Sem consistência editorial', 'Um idioma, um formato'],
      EN: ['Sermon preached and forgotten', 'Content stuck in a notebook', 'No adaptation for other audiences', 'No editorial consistency', 'One language, one format'],
      ES: ['Sermón predicado y olvidado', 'Contenido estancado en el cuaderno', 'Sin adaptación para otros públicos', 'Sin consistencia editorial', 'Un idioma, un formato'],
    },
  },
  after: {
    title: { PT: 'Com Living Word', EN: 'With Living Word', ES: 'Con Living Word' },
    items: {
      PT: ['Sermão → artigo, devocional, blog', 'Conteúdo publicado e distribuído', 'Adaptado para célula, redes, blog', 'Calendário editorial consistente', 'PT, EN e ES com fidelidade'],
      EN: ['Sermon → article, devotional, blog', 'Content published and distributed', 'Adapted for small groups, social, blog', 'Consistent editorial calendar', 'PT, EN and ES with fidelity'],
      ES: ['Sermón → artículo, devocional, blog', 'Contenido publicado y distribuido', 'Adaptado para célula, redes, blog', 'Calendario editorial consistente', 'PT, EN y ES con fidelidad'],
    },
  },
};

export const pricing = {
  title: {
    PT: 'Planos pensados para cada fase do ministério',
    EN: 'Plans designed for every ministry stage',
    ES: 'Planes pensados para cada fase del ministerio',
  },
  monthly: { PT: '/mês', EN: '/mo', ES: '/mes' },
  cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
  ctaPaid: { PT: 'Assinar agora', EN: 'Subscribe now', ES: 'Suscribirse ahora' },
  featured: { PT: 'Mais popular', EN: 'Most popular', ES: 'Más popular' },
  plans: {
    PT: [
      {
        name: 'Free', price: '0', features: [
          '5 gerações por mês', '3 formatos de saída', '1 artigo de blog', 'Marca d\u2019água no conteúdo',
          'Idioma principal apenas', 'Sem calendário editorial', 'Sem exportação Word/PDF',
        ],
      },
      {
        name: 'Pastoral', price: null, featured: true, features: [
          '50 gerações por mês', 'Todos os 7+ formatos', 'Blog cristão completo', 'Sem marca d\u2019água',
          'PT, EN e ES', 'Calendário editorial', 'Exportação Word e PDF', 'Voz pastoral personalizada',
        ],
      },
      {
        name: 'Church', price: null, features: [
          '150 gerações por mês', 'Tudo do Pastoral', 'Até 3 assentos de equipe', 'Integração WordPress',
          'Múltiplos blogs', 'Conteúdo para células', 'Prioridade no suporte', 'Assentos adicionais disponíveis',
        ],
      },
      {
        name: 'Ministry', price: null, features: [
          '500 gerações/mês', 'Tudo do Church', 'Assentos para toda equipe', 'API de conteúdo',
          'White-label disponível', 'Suporte dedicado', 'Onboarding personalizado', 'SLA garantido',
        ],
      },
    ],
    EN: [
      {
        name: 'Free', price: '0', features: [
          '5 generations/month', '3 output formats', '1 blog article', 'Watermarked content',
          'Main language only', 'No editorial calendar', 'No Word/PDF export',
        ],
      },
      {
        name: 'Pastoral', price: null, featured: true, features: [
          '50 generations/month', 'All 7+ formats', 'Full Christian blog', 'No watermark',
          'PT, EN & ES', 'Editorial calendar', 'Word & PDF export', 'Custom pastoral voice',
        ],
      },
      {
        name: 'Church', price: null, features: [
          '150 generations/month', 'Everything in Pastoral', 'Up to 3 team seats', 'WordPress integration',
          'Multiple blogs', 'Small group content', 'Priority support', 'Extra seats available',
        ],
      },
      {
        name: 'Ministry', price: null, features: [
          '500 generations/month', 'Everything in Church', 'Full team seats', 'Content API',
          'White-label available', 'Dedicated support', 'Custom onboarding', 'Guaranteed SLA',
        ],
      },
    ],
    ES: [
      {
        name: 'Free', price: '0', features: [
          '5 generaciones/mes', '3 formatos de salida', '1 artículo de blog', 'Contenido con marca de agua',
          'Idioma principal únicamente', 'Sin calendario editorial', 'Sin exportación Word/PDF',
        ],
      },
      {
        name: 'Pastoral', price: null, featured: true, features: [
          '50 generaciones/mes', 'Todos los 7+ formatos', 'Blog cristiano completo', 'Sin marca de agua',
          'PT, EN y ES', 'Calendario editorial', 'Exportación Word y PDF', 'Voz pastoral personalizada',
        ],
      },
      {
        name: 'Church', price: null, features: [
          '150 generaciones/mes', 'Todo lo de Pastoral', 'Hasta 3 asientos de equipo', 'Integración WordPress',
          'Múltiples blogs', 'Contenido para células', 'Soporte prioritario', 'Asientos adicionales disponibles',
        ],
      },
      {
        name: 'Ministry', price: null, features: [
          '500 generaciones/mes', 'Todo lo de Church', 'Asientos para todo el equipo', 'API de contenido',
          'White-label disponible', 'Soporte dedicado', 'Onboarding personalizado', 'SLA garantizado',
        ],
      },
    ],
  },
};

export const faqData = {
  title: { PT: 'Perguntas frequentes', EN: 'Frequently asked questions', ES: 'Preguntas frecuentes' },
  items: {
    PT: [
      { q: 'A IA substitui o pastor?', a: 'Não. O Living Word é uma ferramenta de apoio. Você define a passagem, a doutrina, o público e o tom. A IA organiza, formata e adapta — mas quem ensina é você.' },
      { q: 'Para quem o Living Word foi feito?', a: 'Pastores, líderes de célula, ministérios, criadores de conteúdo cristão e igrejas que querem transformar ensino bíblico em conteúdo publicável e distribuível.' },
      { q: 'Cria blog cristão automaticamente?', a: 'Sim. Você pode publicar artigos gerados diretamente no blog integrado do Living Word ou exportar para WordPress.' },
      { q: 'Transforma sermão em artigo?', a: 'Sim. A partir de uma passagem e tema, o sistema gera sermão completo, artigo, devocional, conteúdo para célula e mais — tudo com fidelidade bíblica.' },
      { q: 'Funciona em português, inglês e espanhol?', a: 'Sim. Os três idiomas são parte central do produto. Você pode gerar o mesmo conteúdo adaptado em PT, EN e ES.' },
      { q: 'Preciso ter um site próprio?', a: 'Não. O Living Word já inclui um blog cristão pronto para uso. Se preferir, pode integrar com WordPress.' },
      { q: 'Que tipos de conteúdo o Living Word gera?', a: 'Sermão completo, esboço, devocional, artigo editorial, blog devocional, conteúdo para célula, conteúdo para redes sociais, e versões em inglês e espanhol.' },
      { q: 'Mantém fidelidade bíblica?', a: 'Sim. O sistema analisa o texto bíblico com exegese antes de gerar qualquer conteúdo. Você define a linha de ensino (reformada, pentecostal, batista, etc.).' },
      { q: 'Serve para líderes e ministérios pequenos?', a: 'Com certeza. O plano Free já permite gerar 5 conteúdos por mês. É uma ótima forma de começar sem investimento.' },
      { q: 'O que acontece ao me cadastrar?', a: 'Você cria sua conta gratuitamente, escolhe sua linha de ensino e estilo pastoral, e já pode começar a gerar conteúdo imediatamente. Não precisa de cartão de crédito.' },
    ],
    EN: [
      { q: 'Does AI replace the pastor?', a: "No. Living Word is a support tool. You define the passage, doctrine, audience and tone. AI organizes, formats and adapts — but you're the one who teaches." },
      { q: 'Who is Living Word made for?', a: 'Pastors, cell group leaders, ministries, Christian content creators and churches that want to turn biblical teaching into publishable, distributable content.' },
      { q: 'Does it create a Christian blog automatically?', a: "Yes. You can publish generated articles directly to Living Word's integrated blog or export to WordPress." },
      { q: 'Does it turn a sermon into an article?', a: 'Yes. From a passage and topic, the system generates a full sermon, article, devotional, small group content and more — all with biblical fidelity.' },
      { q: 'Does it work in Portuguese, English and Spanish?', a: 'Yes. All three languages are a core part of the product. You can generate the same content adapted in PT, EN and ES.' },
      { q: 'Do I need my own website?', a: "No. Living Word includes a ready-to-use Christian blog. If you prefer, you can integrate with WordPress." },
      { q: 'What types of content does Living Word generate?', a: 'Full sermon, outline, devotional, editorial article, blog devotional, small group content, social media content, and English and Spanish versions.' },
      { q: 'Does it maintain biblical fidelity?', a: 'Yes. The system analyzes the biblical text with exegesis before generating any content. You define the teaching line (reformed, pentecostal, baptist, etc.).' },
      { q: 'Does it work for small leaders and ministries?', a: "Absolutely. The Free plan already allows 5 generations per month. It's a great way to start with no investment." },
      { q: "What happens when I sign up?", a: "You create your account for free, choose your teaching line and pastoral style, and can start generating content immediately. No credit card required." },
    ],
    ES: [
      { q: '¿La IA sustituye al pastor?', a: 'No. Living Word es una herramienta de apoyo. Tú defines el pasaje, la doctrina, el público y el tono. La IA organiza, formatea y adapta — pero quien enseña eres tú.' },
      { q: '¿Para quién fue hecho Living Word?', a: 'Pastores, líderes de célula, ministerios, creadores de contenido cristiano e iglesias que quieren transformar la enseñanza bíblica en contenido publicable y distribuible.' },
      { q: '¿Crea un blog cristiano automáticamente?', a: 'Sí. Puedes publicar artículos generados directamente en el blog integrado de Living Word o exportar a WordPress.' },
      { q: '¿Transforma sermón en artículo?', a: 'Sí. A partir de un pasaje y tema, el sistema genera sermón completo, artículo, devocional, contenido para célula y más — todo con fidelidad bíblica.' },
      { q: '¿Funciona en portugués, inglés y español?', a: 'Sí. Los tres idiomas son parte central del producto. Puedes generar el mismo contenido adaptado en PT, EN y ES.' },
      { q: '¿Necesito tener un sitio web propio?', a: 'No. Living Word ya incluye un blog cristiano listo para usar. Si prefieres, puedes integrar con WordPress.' },
      { q: '¿Qué tipos de contenido genera Living Word?', a: 'Sermón completo, bosquejo, devocional, artículo editorial, blog devocional, contenido para célula, contenido para redes sociales, y versiones en inglés y portugués.' },
      { q: '¿Mantiene fidelidad bíblica?', a: 'Sí. El sistema analiza el texto bíblico con exégesis antes de generar cualquier contenido. Tú defines la línea de enseñanza (reformada, pentecostal, bautista, etc.).' },
      { q: '¿Sirve para líderes y ministerios pequeños?', a: 'Por supuesto. El plan Free ya permite generar 5 contenidos al mes. Es una excelente forma de comenzar sin inversión.' },
      { q: '¿Qué pasa al registrarme?', a: 'Creas tu cuenta gratuitamente, eliges tu línea de enseñanza y estilo pastoral, y puedes comenzar a generar contenido inmediatamente. No se necesita tarjeta de crédito.' },
    ],
  },
};

export const finalCta = {
  headline: {
    PT: 'A Palavra que você ensina merece circular além do domingo.',
    EN: 'The Word you teach deserves to circulate beyond Sunday.',
    ES: 'La Palabra que enseñas merece circular más allá del domingo.',
  },
  cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
};

export const footer = {
  copy: {
    PT: '© 2025 Living Word. Todos os direitos reservados.',
    EN: '© 2025 Living Word. All rights reserved.',
    ES: '© 2025 Living Word. Todos los derechos reservados.',
  },
};
