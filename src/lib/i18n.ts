export type Language = 'PT' | 'EN' | 'ES';

export function detectLanguage(): Language {
  const lang = navigator.language?.substring(0, 2).toLowerCase();
  if (lang === 'es') return 'ES';
  if (lang === 'en') return 'EN';
  return 'PT';
}

const translations: Record<string, Record<Language, string>> = {
  // Landing
  'hero.title': {
    PT: 'Sua pregação merece ir além do púlpito',
    EN: 'Your sermon deserves to go beyond the pulpit',
    ES: 'Tu sermón merece ir más allá del púlpito',
  },
  'hero.subtitle': {
    PT: 'Gere sermões, devocionais e artigos de blog com IA pastoral e publique automaticamente no seu blog cristão profissional',
    EN: 'Generate sermons, devotionals, and blog articles with pastoral AI and auto-publish to your professional Christian blog',
    ES: 'Genera sermones, devocionales y artículos de blog con IA pastoral y publica automáticamente en tu blog cristiano profesional',
  },
  'hero.cta': {
    PT: 'Criar meu blog grátis',
    EN: 'Create my free blog',
    ES: 'Crear mi blog gratis',
  },
  'hero.cta2': {
    PT: 'Ver exemplo ao vivo',
    EN: 'See live example',
    ES: 'Ver ejemplo en vivo',
  },
  // How it works
  'how.title': {
    PT: 'Como funciona',
    EN: 'How it works',
    ES: 'Cómo funciona',
  },
  'how.step1.title': { PT: 'Crie sua conta', EN: 'Create your account', ES: 'Crea tu cuenta' },
  'how.step1.desc': { PT: 'Blog no ar em 30 segundos', EN: 'Blog live in 30 seconds', ES: 'Blog en línea en 30 segundos' },
  'how.step2.title': { PT: 'Escolha uma passagem', EN: 'Choose a passage', ES: 'Elige un pasaje' },
  'how.step2.desc': { PT: 'A IA gera seu conteúdo', EN: 'AI generates your content', ES: 'La IA genera tu contenido' },
  'how.step3.title': { PT: 'Publique com um clique', EN: 'Publish with one click', ES: 'Publica con un clic' },
  'how.step3.desc': { PT: 'Ou agende para a semana', EN: 'Or schedule for the week', ES: 'O programa para la semana' },
  // Formats
  'formats.title': { PT: 'Formatos disponíveis', EN: 'Available formats', ES: 'Formatos disponibles' },
  // Pricing
  'pricing.title': { PT: 'Planos e preços', EN: 'Plans & pricing', ES: 'Planes y precios' },
  'pricing.free': { PT: 'Grátis', EN: 'Free', ES: 'Gratis' },
  'pricing.month': { PT: '/mês', EN: '/month', ES: '/mes' },
  // Nav
  'nav.dashboard': { PT: 'Dashboard', EN: 'Dashboard', ES: 'Panel' },
  'nav.studio': { PT: 'Estúdio', EN: 'Studio', ES: 'Estudio' },
  'nav.blog': { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  'nav.library': { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' },
  'nav.calendar': { PT: 'Calendário', EN: 'Calendar', ES: 'Calendario' },
  'nav.settings': { PT: 'Configurações', EN: 'Settings', ES: 'Configuración' },
  'nav.minds': { PT: 'Mentes', EN: 'Minds', ES: 'Mentes' },
  'nav.upgrade': { PT: 'Fazer upgrade', EN: 'Upgrade', ES: 'Mejorar plan' },
  'nav.login': { PT: 'Entrar', EN: 'Login', ES: 'Iniciar sesión' },
  'nav.signup': { PT: 'Criar conta', EN: 'Sign up', ES: 'Registrarse' },
  'nav.logout': { PT: 'Sair', EN: 'Logout', ES: 'Cerrar sesión' },
  // Auth
  'auth.name': { PT: 'Nome completo', EN: 'Full name', ES: 'Nombre completo' },
  'auth.email': { PT: 'Email', EN: 'Email', ES: 'Correo' },
  'auth.password': { PT: 'Senha', EN: 'Password', ES: 'Contraseña' },
  'auth.language': { PT: 'Idioma', EN: 'Language', ES: 'Idioma' },
  'auth.next': { PT: 'Próximo', EN: 'Next', ES: 'Siguiente' },
  'auth.back': { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  'auth.create': { PT: 'Criar conta', EN: 'Create account', ES: 'Crear cuenta' },
  'auth.login': { PT: 'Entrar', EN: 'Sign in', ES: 'Iniciar sesión' },
  'auth.forgot': { PT: 'Esqueci minha senha', EN: 'Forgot password', ES: 'Olvidé mi contraseña' },
  'auth.blog_handle': { PT: 'Escolha o endereço do seu blog', EN: 'Choose your blog address', ES: 'Elige la dirección de tu blog' },
  'auth.handle_preview': { PT: 'Seu blog será:', EN: 'Your blog will be:', ES: 'Tu blog será:' },
  'auth.step1': { PT: 'Dados básicos', EN: 'Basic info', ES: 'Datos básicos' },
  'auth.step2': { PT: 'Seu Blog', EN: 'Your Blog', ES: 'Tu Blog' },
  'auth.step3': { PT: 'Perfil pastoral', EN: 'Pastoral profile', ES: 'Perfil pastoral' },
  // Studio
  'studio.title': { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' },
  'studio.passage': { PT: 'Passagem Bíblica', EN: 'Bible Passage', ES: 'Pasaje Bíblico' },
  'studio.audience': { PT: 'Público-alvo', EN: 'Target audience', ES: 'Público objetivo' },
  'studio.context': { PT: 'Contexto / Dor', EN: 'Context / Pain point', ES: 'Contexto / Dolor' },
  'studio.version': { PT: 'Versão Bíblica', EN: 'Bible Version', ES: 'Versión Bíblica' },
  'studio.voice': { PT: 'Voz Pastoral', EN: 'Pastoral Voice', ES: 'Voz Pastoral' },
  'studio.generate': { PT: 'Gerar Material', EN: 'Generate Material', ES: 'Generar Material' },
  'studio.copy': { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  'studio.save': { PT: 'Salvar na Biblioteca', EN: 'Save to Library', ES: 'Guardar en Biblioteca' },
  'studio.publish': { PT: 'Publicar no Blog', EN: 'Publish to Blog', ES: 'Publicar en Blog' },
  // Dashboard
  'dashboard.title': { PT: 'Dashboard', EN: 'Dashboard', ES: 'Panel' },
  'dashboard.blog_live': { PT: 'Seu blog está no ar!', EN: 'Your blog is live!', ES: '¡Tu blog está en línea!' },
  'dashboard.generate_new': { PT: 'Gerar novo conteúdo', EN: 'Generate new content', ES: 'Generar nuevo contenido' },
  'dashboard.generations': { PT: 'Gerações este mês', EN: 'Generations this month', ES: 'Generaciones este mes' },
  // Footer
  'footer.tagline': { PT: 'Feito com fé e tecnologia', EN: 'Made with faith and technology', ES: 'Hecho con fe y tecnología' },
  // Upgrade
  'upgrade.title': { PT: 'Desbloqueie todo o potencial', EN: 'Unlock full potential', ES: 'Desbloquea todo el potencial' },
  'upgrade.trial': { PT: '7 dias grátis, sem cartão', EN: '7 days free, no card required', ES: '7 días gratis, sin tarjeta' },
  'upgrade.cta': { PT: 'Começar teste grátis', EN: 'Start free trial', ES: 'Iniciar prueba gratis' },
  // Library
  'library.title': { PT: 'Biblioteca', EN: 'Library', ES: 'Biblioteca' },
  'library.archived': { PT: 'Arquivado — desbloqueie no Pastoral', EN: 'Archived — unlock with Pastoral', ES: 'Archivado — desbloquea con Pastoral' },
  // Calendar
  'calendar.title': { PT: 'Calendário Editorial', EN: 'Editorial Calendar', ES: 'Calendario Editorial' },
  // Settings
  'settings.title': { PT: 'Configurações', EN: 'Settings', ES: 'Configuración' },
  'settings.profile': { PT: 'Perfil', EN: 'Profile', ES: 'Perfil' },
  'settings.blog': { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  'settings.plan': { PT: 'Plano', EN: 'Plan', ES: 'Plan' },
  'settings.doctrine': { PT: 'Doutrina', EN: 'Doctrine', ES: 'Doctrina' },
  'settings.language': { PT: 'Idioma', EN: 'Language', ES: 'Idioma' },
  'settings.account': { PT: 'Conta', EN: 'Account', ES: 'Cuenta' },
  // Nav extras
  'nav.tools': { PT: 'FERRAMENTAS', EN: 'TOOLS', ES: 'HERRAMIENTAS' },
  // Landing extras
  'landing.already_have_account': { PT: 'Já tem conta?', EN: 'Already have an account?', ES: '¿Ya tienes cuenta?' },
  'landing.forgot_password': { PT: 'Esqueceu sua senha?', EN: 'Forgot your password?', ES: '¿Olvidaste tu contraseña?' },
  'landing.recover_here': { PT: 'Recupere aqui', EN: 'Recover here', ES: 'Recupérala aquí' },
  // Settings extras
  'settings.save': { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  'settings.delete_account': { PT: 'Excluir conta', EN: 'Delete account', ES: 'Eliminar cuenta' },
  'settings.generations_used': { PT: 'gerações usadas', EN: 'generations used', ES: 'generaciones usadas' },
  'settings.doctrine_label': { PT: 'Doutrina / Tradição', EN: 'Doctrine / Tradition', ES: 'Doctrina / Tradición' },
};

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] || key;
}
