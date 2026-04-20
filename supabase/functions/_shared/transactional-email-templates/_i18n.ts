// i18n strings for Living Word transactional + auth emails (PT/EN/ES)
export type Lang = 'PT' | 'EN' | 'ES'

export function normalizeLang(input?: string | null): Lang {
  if (!input) return 'PT'
  const s = input.toString().trim().toUpperCase()
  if (s.startsWith('EN')) return 'EN'
  if (s.startsWith('ES')) return 'ES'
  return 'PT'
}

export function htmlLang(lang: Lang): string {
  return lang === 'EN' ? 'en' : lang === 'ES' ? 'es' : 'pt-BR'
}

export const FOOTER_BRAND: Record<Lang, string> = {
  PT: 'Feito com ❤ por Living Word',
  EN: 'Made with ❤ by Living Word',
  ES: 'Hecho con ❤ por Living Word',
}

// ============ TRANSACTIONAL: welcome-confirmed ============
export const WELCOME_CONFIRMED = {
  PT: {
    subject: 'Bem-vindo à Living Word',
    preview: 'Bem-vindo à Living Word — sua jornada pastoral começa agora',
    h1WithName: (n: string) => `Bem-vindo, ${n}`,
    h1NoName: 'Bem-vindo à Living Word',
    p1: 'Que alegria ter você conosco. Sua conta está confirmada e a plataforma pastoral mais completa para líderes cristãos já está pronta para uso.',
    p2Prefix: 'Em instantes, vamos preparar seu ',
    p2Strong: 'Altar Digital',
    p2Suffix: ' — seu blog próprio com três artigos bíblicos exclusivos para começar.',
    cta: 'Acessar meu painel',
    verse: '"Pregue a Palavra, esteja preparado a tempo e fora de tempo." — 2 Timóteo 4:2',
  },
  EN: {
    subject: 'Welcome to Living Word',
    preview: 'Welcome to Living Word — your pastoral journey starts now',
    h1WithName: (n: string) => `Welcome, ${n}`,
    h1NoName: 'Welcome to Living Word',
    p1: "We're so glad you're here. Your account is confirmed and the most complete pastoral platform for Christian leaders is ready for you.",
    p2Prefix: "In a moment, we'll prepare your ",
    p2Strong: 'Digital Altar',
    p2Suffix: ' — your own blog with three exclusive biblical articles to get you started.',
    cta: 'Open my dashboard',
    verse: '"Preach the Word; be prepared in season and out of season." — 2 Timothy 4:2',
  },
  ES: {
    subject: 'Bienvenido a Living Word',
    preview: 'Bienvenido a Living Word — tu jornada pastoral comienza ahora',
    h1WithName: (n: string) => `Bienvenido, ${n}`,
    h1NoName: 'Bienvenido a Living Word',
    p1: 'Qué alegría tenerte con nosotros. Tu cuenta está confirmada y la plataforma pastoral más completa para líderes cristianos ya está lista para usar.',
    p2Prefix: 'En instantes, prepararemos tu ',
    p2Strong: 'Altar Digital',
    p2Suffix: ' — tu propio blog con tres artículos bíblicos exclusivos para comenzar.',
    cta: 'Acceder a mi panel',
    verse: '"Predica la Palabra; insiste a tiempo y fuera de tiempo." — 2 Timoteo 4:2',
  },
}

// ============ TRANSACTIONAL: altar-digital-ready ============
export const ALTAR_DIGITAL = {
  PT: {
    subject: 'Seu Altar Digital está no ar 🎉',
    preview: 'Seu Altar Digital está no ar — 3 artigos bíblicos prontos',
    h1WithName: (n: string) => `${n}, seu Altar Digital está no ar`,
    h1NoName: 'Seu Altar Digital está no ar',
    p1Prefix: 'Já provisionamos seu blog com ',
    p1Strong: '3 artigos bíblicos exclusivos',
    p1Suffix: ' para que você comece a edificar sua audiência hoje mesmo.',
    p2: 'Cada artigo foi cuidadosamente preparado para refletir profundidade pastoral, fidelidade às Escrituras e clareza para leitores em busca de Cristo.',
    cta: 'Ver meu blog',
    dashboard: 'Acessar meu painel',
    verse: '"Pastoreiem o rebanho de Deus que está aos seus cuidados." — 1 Pedro 5:2',
  },
  EN: {
    subject: 'Your Digital Altar is live 🎉',
    preview: 'Your Digital Altar is live — 3 biblical articles ready',
    h1WithName: (n: string) => `${n}, your Digital Altar is live`,
    h1NoName: 'Your Digital Altar is live',
    p1Prefix: "We've provisioned your blog with ",
    p1Strong: '3 exclusive biblical articles',
    p1Suffix: ' so you can start building your audience today.',
    p2: 'Each article was carefully crafted to reflect pastoral depth, fidelity to Scripture and clarity for readers seeking Christ.',
    cta: 'See my blog',
    dashboard: 'Open my dashboard',
    verse: '"Shepherd the flock of God that is among you." — 1 Peter 5:2',
  },
  ES: {
    subject: 'Tu Altar Digital ya está en vivo 🎉',
    preview: 'Tu Altar Digital ya está en vivo — 3 artículos bíblicos listos',
    h1WithName: (n: string) => `${n}, tu Altar Digital ya está en vivo`,
    h1NoName: 'Tu Altar Digital ya está en vivo',
    p1Prefix: 'Ya aprovisionamos tu blog con ',
    p1Strong: '3 artículos bíblicos exclusivos',
    p1Suffix: ' para que comiences a edificar tu audiencia hoy mismo.',
    p2: 'Cada artículo fue cuidadosamente preparado para reflejar profundidad pastoral, fidelidad a las Escrituras y claridad para lectores que buscan a Cristo.',
    cta: 'Ver mi blog',
    dashboard: 'Acceder a mi panel',
    verse: '"Pastoreen el rebaño de Dios que está a su cuidado." — 1 Pedro 5:2',
  },
}

// ============ TRANSACTIONAL: drip-day-1 ============
export const DRIP_DAY_1 = {
  PT: {
    subject: 'Crie seu próximo sermão em minutos',
    preview: 'Crie seu próximo sermão em minutos com a IA pastoral',
    h1WithName: (n: string) => `${n}, vamos criar seu próximo sermão?`,
    h1NoName: 'Vamos criar seu próximo sermão?',
    p1: 'A Living Word foi treinada nas Escrituras e em corpus de grandes pregadores (Spurgeon, Wesley, Calvino, Billy Graham). Em poucos minutos você pode:',
    bullets: ['Esboçar um sermão expositivo a partir de uma passagem', 'Gerar ilustrações fiéis ao contexto bíblico', 'Adaptar tom para igreja local, juventude ou estudo de grupo'],
    cta: 'Abrir o Púlpito',
    verse: '"Toda a Escritura é inspirada por Deus e útil para o ensino." — 2 Timóteo 3:16',
  },
  EN: {
    subject: 'Create your next sermon in minutes',
    preview: 'Create your next sermon in minutes with pastoral AI',
    h1WithName: (n: string) => `${n}, shall we craft your next sermon?`,
    h1NoName: 'Shall we craft your next sermon?',
    p1: 'Living Word was trained on Scripture and the corpus of great preachers (Spurgeon, Wesley, Calvin, Billy Graham). In just minutes you can:',
    bullets: ['Outline an expository sermon from a passage', 'Generate illustrations faithful to the biblical context', 'Adapt tone for local church, youth or group study'],
    cta: 'Open the Pulpit',
    verse: '"All Scripture is breathed out by God and profitable for teaching." — 2 Timothy 3:16',
  },
  ES: {
    subject: 'Crea tu próximo sermón en minutos',
    preview: 'Crea tu próximo sermón en minutos con IA pastoral',
    h1WithName: (n: string) => `${n}, ¿creamos tu próximo sermón?`,
    h1NoName: '¿Creamos tu próximo sermón?',
    p1: 'Living Word fue entrenada en las Escrituras y en el corpus de grandes predicadores (Spurgeon, Wesley, Calvino, Billy Graham). En pocos minutos puedes:',
    bullets: ['Esbozar un sermón expositivo a partir de un pasaje', 'Generar ilustraciones fieles al contexto bíblico', 'Adaptar el tono para iglesia local, juventud o estudio de grupo'],
    cta: 'Abrir el Púlpito',
    verse: '"Toda la Escritura es inspirada por Dios y útil para enseñar." — 2 Timoteo 3:16',
  },
}

// ============ TRANSACTIONAL: drip-day-3 ============
export const DRIP_DAY_3 = {
  PT: {
    subject: 'Converse com os grandes pregadores da história',
    preview: 'Converse com Spurgeon, Wesley, Calvino e Billy Graham',
    h1WithName: (n: string) => `${n}, você já conheceu as Mentes Brilhantes?`,
    h1NoName: 'Já conheceu as Mentes Brilhantes?',
    p1: 'Quatro agentes de IA modelados a partir do corpus histórico de grandes pregadores cristãos, prontos para te ajudar com profundidade teológica:',
    bullets: [
      ['Spurgeon', ' — exposição expositiva e ilustrações memoráveis'],
      ['Wesley', ' — santificação prática e clareza lógica'],
      ['Calvino', ' — exegese sistemática e rigor reformado'],
      ['Billy Graham', ' — apelo evangelístico direto'],
    ] as [string, string][],
    cta: 'Conhecer Mentes Brilhantes',
    verse: '"Lembrem-se dos seus líderes que lhes falaram a palavra de Deus." — Hebreus 13:7',
  },
  EN: {
    subject: 'Talk with the great preachers of history',
    preview: 'Talk with Spurgeon, Wesley, Calvin and Billy Graham',
    h1WithName: (n: string) => `${n}, have you met the Brilliant Minds?`,
    h1NoName: 'Have you met the Brilliant Minds?',
    p1: 'Four AI agents modeled on the historic corpus of great Christian preachers, ready to help you with theological depth:',
    bullets: [
      ['Spurgeon', ' — expository preaching and memorable illustrations'],
      ['Wesley', ' — practical sanctification and logical clarity'],
      ['Calvin', ' — systematic exegesis and Reformed rigor'],
      ['Billy Graham', ' — direct evangelistic appeal'],
    ] as [string, string][],
    cta: 'Meet the Brilliant Minds',
    verse: '"Remember your leaders, those who spoke to you the word of God." — Hebrews 13:7',
  },
  ES: {
    subject: 'Conversa con los grandes predicadores de la historia',
    preview: 'Conversa con Spurgeon, Wesley, Calvino y Billy Graham',
    h1WithName: (n: string) => `${n}, ¿ya conociste a las Mentes Brillantes?`,
    h1NoName: '¿Ya conociste a las Mentes Brillantes?',
    p1: 'Cuatro agentes de IA modelados a partir del corpus histórico de grandes predicadores cristianos, listos para ayudarte con profundidad teológica:',
    bullets: [
      ['Spurgeon', ' — exposición expositiva e ilustraciones memorables'],
      ['Wesley', ' — santificación práctica y claridad lógica'],
      ['Calvino', ' — exégesis sistemática y rigor reformado'],
      ['Billy Graham', ' — apelo evangelístico directo'],
    ] as [string, string][],
    cta: 'Conocer Mentes Brillantes',
    verse: '"Acuérdense de sus líderes, que les hablaron la palabra de Dios." — Hebreos 13:7',
  },
}

// ============ TRANSACTIONAL: drip-day-7 ============
export const DRIP_DAY_7 = {
  PT: {
    subject: 'Sua primeira semana — o que vem agora',
    preview: 'Sua primeira semana com a Living Word — o que vem agora',
    h1WithName: (n: string) => `${n}, sua primeira semana foi só o começo`,
    h1NoName: 'Sua primeira semana foi só o começo',
    p1Prefix: 'Em sete dias você já pode ter um ',
    p1Strong: 'Altar Digital ativo',
    p1Suffix: ', sermões estruturados e estudos bíblicos prontos para sua igreja. Que tal manter o ritmo?',
    p2Strong: 'Sugestão para esta semana:',
    p2: ' publique mais um artigo no seu blog usando a IA. Conteúdo recorrente fortalece autoridade pastoral e alcança quem precisa ouvir.',
    cta: 'Criar próximo artigo',
    verse: '"Não nos cansemos de fazer o bem, pois no tempo próprio colheremos." — Gálatas 6:9',
  },
  EN: {
    subject: 'Your first week — what comes next',
    preview: 'Your first week with Living Word — what comes next',
    h1WithName: (n: string) => `${n}, your first week was just the beginning`,
    h1NoName: 'Your first week was just the beginning',
    p1Prefix: 'In seven days you can already have an ',
    p1Strong: 'active Digital Altar',
    p1Suffix: ', structured sermons and Bible studies ready for your church. How about keeping the pace?',
    p2Strong: 'Tip for this week:',
    p2: ' publish another article on your blog using AI. Recurring content strengthens pastoral authority and reaches those who need to hear.',
    cta: 'Create next article',
    verse: '"Let us not grow weary of doing good, for in due season we will reap." — Galatians 6:9',
  },
  ES: {
    subject: 'Tu primera semana — lo que viene ahora',
    preview: 'Tu primera semana con Living Word — lo que viene ahora',
    h1WithName: (n: string) => `${n}, tu primera semana fue solo el comienzo`,
    h1NoName: 'Tu primera semana fue solo el comienzo',
    p1Prefix: 'En siete días ya puedes tener un ',
    p1Strong: 'Altar Digital activo',
    p1Suffix: ', sermones estructurados y estudios bíblicos listos para tu iglesia. ¿Qué tal mantener el ritmo?',
    p2Strong: 'Sugerencia para esta semana:',
    p2: ' publica otro artículo en tu blog usando la IA. El contenido recurrente fortalece la autoridad pastoral y alcanza a quienes necesitan escuchar.',
    cta: 'Crear próximo artículo',
    verse: '"No nos cansemos de hacer el bien, pues a su tiempo segaremos." — Gálatas 6:9',
  },
}

// ============ AUTH: signup ============
export const AUTH_SIGNUP = {
  PT: {
    subject: 'Confirme seu e-mail',
    preview: 'Confirme seu e-mail para acessar a Living Word',
    h1: 'Falta pouco!',
    text: 'Clique no botão abaixo para confirmar seu e-mail e ativar sua plataforma pastoral.',
    cta: 'Confirmar e-mail',
    accountFor: 'Conta criada para',
    verse: '"A tua palavra é lâmpada para os meus pés e luz para o meu caminho." — Salmos 119:105',
    ignore: 'Se você não criou esta conta, pode ignorar este e-mail com segurança.',
  },
  EN: {
    subject: 'Confirm your email',
    preview: 'Confirm your email to access Living Word',
    h1: 'Almost there!',
    text: 'Click the button below to confirm your email and activate your pastoral platform.',
    cta: 'Confirm email',
    accountFor: 'Account created for',
    verse: '"Your word is a lamp to my feet and a light to my path." — Psalm 119:105',
    ignore: "If you didn't create this account, you can safely ignore this email.",
  },
  ES: {
    subject: 'Confirma tu correo',
    preview: 'Confirma tu correo para acceder a Living Word',
    h1: '¡Falta poco!',
    text: 'Haz clic en el botón de abajo para confirmar tu correo y activar tu plataforma pastoral.',
    cta: 'Confirmar correo',
    accountFor: 'Cuenta creada para',
    verse: '"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." — Salmos 119:105',
    ignore: 'Si no creaste esta cuenta, puedes ignorar este correo con seguridad.',
  },
}

// ============ AUTH: recovery ============
export const AUTH_RECOVERY = {
  PT: {
    subject: 'Redefina sua senha',
    preview: 'Redefina sua senha da Living Word',
    h1: 'Vamos cuidar disso juntos 🙏',
    text: 'Recebemos seu pedido para redefinir a senha do seu Altar Digital. Acontece com todos nós — clique no botão abaixo e em poucos segundos você estará de volta criando conteúdo pastoral com a Living Word.',
    cta: 'Criar nova senha',
    validity: 'Este link é válido por 1 hora — por sua segurança.',
    ignore: 'Se você não pediu para redefinir sua senha, fique tranquilo: basta ignorar este e-mail e sua conta continuará protegida.',
  },
  EN: {
    subject: 'Reset your password',
    preview: 'Reset your Living Word password',
    h1: "Let's take care of this together 🙏",
    text: "We received your request to reset the password for your Digital Altar. It happens to all of us — click the button below and in a few seconds you'll be back creating pastoral content with Living Word.",
    cta: 'Create new password',
    validity: 'This link is valid for 1 hour — for your security.',
    ignore: "If you didn't ask to reset your password, no worries: just ignore this email and your account stays protected.",
  },
  ES: {
    subject: 'Restablece tu contraseña',
    preview: 'Restablece tu contraseña de Living Word',
    h1: 'Vamos a resolverlo juntos 🙏',
    text: 'Recibimos tu solicitud para restablecer la contraseña de tu Altar Digital. Le pasa a todos — haz clic en el botón de abajo y en pocos segundos estarás de vuelta creando contenido pastoral con Living Word.',
    cta: 'Crear nueva contraseña',
    validity: 'Este enlace es válido por 1 hora — por tu seguridad.',
    ignore: 'Si no pediste restablecer tu contraseña, tranquilo: solo ignora este correo y tu cuenta seguirá protegida.',
  },
}

// ============ AUTH: invite ============
export const AUTH_INVITE = {
  PT: {
    subject: 'Você foi convidado',
    preview: 'Você foi convidado para a equipe Living Word',
    h1: 'Você foi convidado',
    text: 'Você recebeu um convite para fazer parte de uma equipe na Living Word — a plataforma bíblica inteligente para pastores e líderes cristãos.',
    cta: 'Aceitar convite',
    ignore: 'Se você não esperava este convite, pode ignorar este e-mail com segurança.',
  },
  EN: {
    subject: "You've been invited",
    preview: "You've been invited to a Living Word team",
    h1: "You've been invited",
    text: "You've been invited to join a team on Living Word — the intelligent Bible platform for pastors and Christian leaders.",
    cta: 'Accept invite',
    ignore: "If you weren't expecting this invitation, you can safely ignore this email.",
  },
  ES: {
    subject: 'Has sido invitado',
    preview: 'Has sido invitado al equipo Living Word',
    h1: 'Has sido invitado',
    text: 'Recibiste una invitación para formar parte de un equipo en Living Word — la plataforma bíblica inteligente para pastores y líderes cristianos.',
    cta: 'Aceptar invitación',
    ignore: 'Si no esperabas esta invitación, puedes ignorar este correo con seguridad.',
  },
}

// ============ AUTH: magic-link ============
export const AUTH_MAGIC_LINK = {
  PT: {
    subject: 'Seu link de acesso',
    preview: 'Seu link de acesso à Living Word',
    h1: 'Seu link de acesso',
    text: 'Clique no botão abaixo para entrar na sua conta Living Word. Este link expira em alguns minutos.',
    cta: 'Entrar agora',
    ignore: 'Se você não solicitou este link, pode ignorar este e-mail com segurança.',
  },
  EN: {
    subject: 'Your login link',
    preview: 'Your Living Word login link',
    h1: 'Your login link',
    text: 'Click the button below to sign in to your Living Word account. This link expires in a few minutes.',
    cta: 'Sign in now',
    ignore: "If you didn't request this link, you can safely ignore this email.",
  },
  ES: {
    subject: 'Tu enlace de acceso',
    preview: 'Tu enlace de acceso a Living Word',
    h1: 'Tu enlace de acceso',
    text: 'Haz clic en el botón de abajo para entrar en tu cuenta Living Word. Este enlace expira en pocos minutos.',
    cta: 'Entrar ahora',
    ignore: 'Si no solicitaste este enlace, puedes ignorar este correo con seguridad.',
  },
}

// ============ AUTH: email-change ============
export const AUTH_EMAIL_CHANGE = {
  PT: {
    subject: 'Confirme seu novo e-mail',
    preview: 'Confirme a alteração do seu e-mail na Living Word',
    h1: 'Confirmar alteração de e-mail',
    intro: 'Recebemos uma solicitação para alterar o e-mail da sua conta Living Word de',
    to: 'para',
    text2: 'Clique no botão abaixo para confirmar esta alteração:',
    cta: 'Confirmar alteração',
    ignore: 'Se você não solicitou esta alteração, proteja sua conta imediatamente redefinindo sua senha.',
  },
  EN: {
    subject: 'Confirm your new email',
    preview: 'Confirm the email change on your Living Word account',
    h1: 'Confirm email change',
    intro: 'We received a request to change the email on your Living Word account from',
    to: 'to',
    text2: 'Click the button below to confirm this change:',
    cta: 'Confirm change',
    ignore: "If you didn't request this change, protect your account immediately by resetting your password.",
  },
  ES: {
    subject: 'Confirma tu nuevo correo',
    preview: 'Confirma el cambio de correo en tu cuenta Living Word',
    h1: 'Confirmar cambio de correo',
    intro: 'Recibimos una solicitud para cambiar el correo de tu cuenta Living Word de',
    to: 'a',
    text2: 'Haz clic en el botón de abajo para confirmar este cambio:',
    cta: 'Confirmar cambio',
    ignore: 'Si no solicitaste este cambio, protege tu cuenta inmediatamente restableciendo tu contraseña.',
  },
}

// ============ AUTH: reauthentication ============
export const AUTH_REAUTH = {
  PT: {
    subject: 'Seu código de verificação',
    preview: 'Seu código de verificação Living Word',
    h1: 'Código de verificação',
    text: 'Use o código abaixo para confirmar sua identidade:',
    footer: 'Este código expira em alguns minutos. Se você não solicitou, pode ignorar este e-mail com segurança.',
  },
  EN: {
    subject: 'Your verification code',
    preview: 'Your Living Word verification code',
    h1: 'Verification code',
    text: 'Use the code below to confirm your identity:',
    footer: "This code expires in a few minutes. If you didn't request it, you can safely ignore this email.",
  },
  ES: {
    subject: 'Tu código de verificación',
    preview: 'Tu código de verificación Living Word',
    h1: 'Código de verificación',
    text: 'Usa el código de abajo para confirmar tu identidad:',
    footer: 'Este código expira en pocos minutos. Si no lo solicitaste, puedes ignorar este correo con seguridad.',
  },
}
