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
  'dashboard.greeting': { PT: 'Olá', EN: 'Hello', ES: 'Hola' },
  'dashboard.subtitle': {
    PT: 'Aqui estão todas as ferramentas para ajudar você a preparar, criar e compartilhar conteúdo. Escolha uma categoria e comece.',
    EN: 'Here are all the tools to help you prepare, create and share content. Pick a category and get started.',
    ES: 'Aquí tienes todas las herramientas para ayudarte a preparar, crear y compartir contenido. Elige una categoría y comienza.',
  },
  'dashboard.blog_live': { PT: 'Seu blog está no ar!', EN: 'Your blog is live!', ES: '¡Tu blog está en línea!' },
  'dashboard.generate_new': { PT: 'Gerar novo conteúdo', EN: 'Generate new content', ES: 'Generar nuevo contenido' },
  'dashboard.generations': { PT: 'Gerações este mês', EN: 'Generations this month', ES: 'Generaciones este mes' },
  'dashboard.unlock_tools': { PT: 'Desbloqueie todas as ferramentas', EN: 'Unlock all tools', ES: 'Desbloquea todas las herramientas' },
  'dashboard.trial_hint': { PT: 'Teste grátis por 7 dias, sem cartão de crédito.', EN: 'Free 7-day trial, no credit card needed.', ES: 'Prueba gratis 7 días, sin tarjeta.' },
  'dashboard.blog_portal': { PT: 'Seu Portal do Blog', EN: 'Your Blog Portal', ES: 'Tu Portal del Blog' },
  'dashboard.copy': { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  'dashboard.visit_portal': { PT: 'Acessar Portal', EN: 'Visit Portal', ES: 'Acceder al Portal' },
  'dashboard.link_copied': { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  'dashboard.pastoral_hint': { PT: 'Itens com este ícone estão disponíveis no plano Pastoral', EN: 'Items with this icon are available on the Pastoral plan', ES: 'Los ítems con este ícono están disponibles en el plan Pastoral' },
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
  'landing.install_benefit': {
    PT: '📲 Instale no celular — acesse offline, sem depender de navegador',
    EN: '📲 Install on your phone — access offline, no browser needed',
    ES: '📲 Instala en tu celular — accede sin conexión, sin navegador',
  },
  // Settings extras
  'settings.save': { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  'settings.delete_account': { PT: 'Excluir conta', EN: 'Delete account', ES: 'Eliminar cuenta' },
  'settings.generations_used': { PT: 'gerações usadas', EN: 'generations used', ES: 'generaciones usadas' },
  'settings.doctrine_label': { PT: 'Doutrina / Tradição', EN: 'Doctrine / Tradition', ES: 'Doctrina / Tradición' },
  // Blog page
  'blog.title': { PT: 'Meus Artigos', EN: 'My Articles', ES: 'Mis Artículos' },
  'blog.subtitle': { PT: 'Gerencie todos os seus artigos em um só lugar', EN: 'Manage all your articles in one place', ES: 'Gestiona todos tus artículos en un solo lugar' },
  'blog.create_new': { PT: 'Criar Novo', EN: 'Create New', ES: 'Crear Nuevo' },
  'blog.tab_all': { PT: 'Todos', EN: 'All', ES: 'Todos' },
  'blog.tab_published': { PT: 'Publicados', EN: 'Published', ES: 'Publicados' },
  'blog.tab_draft': { PT: 'Rascunhos', EN: 'Drafts', ES: 'Borradores' },
  'blog.tab_archived': { PT: 'Arquivados', EN: 'Archived', ES: 'Archivados' },
  'blog.search_placeholder': { PT: 'Buscar por título...', EN: 'Search by title...', ES: 'Buscar por título...' },
  'blog.article_count': { PT: 'artigo(s)', EN: 'article(s)', ES: 'artículo(s)' },
  'blog.status_published': { PT: 'Publicado', EN: 'Published', ES: 'Publicado' },
  'blog.status_archived': { PT: 'Arquivado', EN: 'Archived', ES: 'Archivado' },
  'blog.status_draft': { PT: 'Rascunho', EN: 'Draft', ES: 'Borrador' },
  'blog.open': { PT: 'Abrir', EN: 'Open', ES: 'Abrir' },
  'blog.edit': { PT: 'Editar', EN: 'Edit', ES: 'Editar' },
  'blog.copy_link': { PT: 'Copiar link', EN: 'Copy link', ES: 'Copiar enlace' },
  'blog.share_whatsapp': { PT: 'Compartilhar no WhatsApp', EN: 'Share on WhatsApp', ES: 'Compartir en WhatsApp' },
  'blog.archive': { PT: 'Arquivar', EN: 'Archive', ES: 'Archivar' },
  'blog.restore': { PT: 'Restaurar', EN: 'Restore', ES: 'Restaurar' },
  'blog.delete': { PT: 'Excluir', EN: 'Delete', ES: 'Eliminar' },
  'blog.no_results': { PT: 'Nenhum artigo encontrado', EN: 'No articles found', ES: 'No se encontraron artículos' },
  'blog.no_articles': { PT: 'Nenhum artigo ainda', EN: 'No articles yet', ES: 'Sin artículos aún' },
  'blog.no_results_hint': { PT: 'Tente buscar com outros termos.', EN: 'Try searching with other terms.', ES: 'Intenta buscar con otros términos.' },
  'blog.no_articles_hint': { PT: 'Crie seu primeiro artigo no Estúdio Pastoral.', EN: 'Create your first article in the Pastoral Studio.', ES: 'Crea tu primer artículo en el Estudio Pastoral.' },
  'blog.create_first': { PT: 'Criar Primeiro Artigo', EN: 'Create First Article', ES: 'Crear Primer Artículo' },
  'blog.free_notice': { PT: 'Plano Free: 1 artigo de blog por mês', EN: 'Free Plan: 1 blog article per month', ES: 'Plan Free: 1 artículo de blog por mes' },
  'blog.free_hint': { PT: 'Desbloqueie publicação ilimitada com o Pastoral', EN: 'Unlock unlimited publishing with Pastoral', ES: 'Desbloquea publicación ilimitada con Pastoral' },
  'blog.edit_title': { PT: 'Editar Artigo', EN: 'Edit Article', ES: 'Editar Artículo' },
  'blog.field_title': { PT: 'Título', EN: 'Title', ES: 'Título' },
  'blog.preview': { PT: 'Pré-visualizar', EN: 'Preview', ES: 'Vista previa' },
  'blog.content_placeholder': { PT: 'Conteúdo em Markdown...', EN: 'Content in Markdown...', ES: 'Contenido en Markdown...' },
  'blog.cancel': { PT: 'Cancelar', EN: 'Cancel', ES: 'Cancelar' },
  'blog.save': { PT: 'Salvar', EN: 'Save', ES: 'Guardar' },
  'blog.saving': { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  'blog.delete_confirm_title': { PT: 'Excluir artigo?', EN: 'Delete article?', ES: '¿Eliminar artículo?' },
  'blog.delete_confirm_desc': { PT: 'Essa ação não pode ser desfeita. O artigo será removido permanentemente.', EN: 'This action cannot be undone. The article will be permanently removed.', ES: 'Esta acción no se puede deshacer. El artículo se eliminará permanentemente.' },
  'blog.deleting': { PT: 'Excluindo...', EN: 'Deleting...', ES: 'Eliminando...' },
  'blog.saved_ok': { PT: 'Artigo salvo com sucesso!', EN: 'Article saved successfully!', ES: '¡Artículo guardado con éxito!' },
  'blog.save_error': { PT: 'Erro ao salvar artigo.', EN: 'Error saving article.', ES: 'Error al guardar artículo.' },
  'blog.archived_ok': { PT: 'Artigo arquivado.', EN: 'Article archived.', ES: 'Artículo archivado.' },
  'blog.restored_ok': { PT: 'Artigo restaurado.', EN: 'Article restored.', ES: 'Artículo restaurado.' },
  'blog.status_error': { PT: 'Erro ao atualizar status.', EN: 'Error updating status.', ES: 'Error al actualizar estado.' },
  'blog.deleted_ok': { PT: 'Artigo excluído com sucesso.', EN: 'Article deleted successfully.', ES: 'Artículo eliminado con éxito.' },
  'blog.delete_error': { PT: 'Erro ao excluir artigo.', EN: 'Error deleting article.', ES: 'Error al eliminar artículo.' },
  'blog.link_copied': { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  'blog.handle_missing': { PT: 'Configure seu blog handle nas Configurações.', EN: 'Set up your blog handle in Settings.', ES: 'Configura tu blog handle en Configuración.' },
  // Study form
  'study.configure': { PT: 'Configurar Estudo', EN: 'Configure Study', ES: 'Configurar Estudio' },
  'study.passage': { PT: 'Passagem Bíblica', EN: 'Bible Passage', ES: 'Pasaje Bíblico' },
  'study.passage_placeholder': { PT: 'Ex: João 3:16 ou Romanos 8:1-11', EN: 'E.g.: John 3:16 or Romans 8:1-11', ES: 'Ej: Juan 3:16 o Romanos 8:1-11' },
  'study.theme': { PT: 'Tema ou Foco (opcional)', EN: 'Theme or Focus (optional)', ES: 'Tema o Enfoque (opcional)' },
  'study.theme_placeholder': { PT: 'Ex: graça, fé, cura, salvação', EN: 'E.g.: grace, faith, healing, salvation', ES: 'Ej: gracia, fe, sanación, salvación' },
  'study.doctrine': { PT: 'Linha Doutrinária', EN: 'Doctrinal Line', ES: 'Línea Doctrinal' },
  'study.voice': { PT: 'Tom Pastoral', EN: 'Pastoral Tone', ES: 'Tono Pastoral' },
  'study.version': { PT: 'Versão Bíblica', EN: 'Bible Version', ES: 'Versión Bíblica' },
  'study.depth': { PT: 'Profundidade', EN: 'Depth', ES: 'Profundidad' },
  'study.language': { PT: 'Idioma do Estudo', EN: 'Study Language', ES: 'Idioma del Estudio' },
  'study.generate': { PT: 'Gerar Estudo Bíblico', EN: 'Generate Bible Study', ES: 'Generar Estudio Bíblico' },
  'study.generating': { PT: 'Gerando estudo teológico...', EN: 'Generating theological study...', ES: 'Generando estudio teológico...' },
  'study.empty': { PT: 'Configure os parâmetros e gere seu estudo teológico', EN: 'Set the parameters and generate your theological study', ES: 'Configura los parámetros y genera tu estudio teológico' },
  'study.result_title': { PT: 'Resultado do Estudo', EN: 'Study Result', ES: 'Resultado del Estudio' },
  'study.sensitive_title': { PT: 'Tópico Pastoral Sensível Detectado', EN: 'Sensitive Pastoral Topic Detected', ES: 'Tema Pastoral Sensible Detectado' },
  'study.sensitive_desc': { PT: 'Este estudo aborda um tema delicado. O conteúdo foi gerado com linguagem cuidadosa e acolhedora. Sempre consulte um pastor ou conselheiro cristão qualificado ao usar este material.', EN: 'This study addresses a sensitive topic. Content was generated with careful and welcoming language. Always consult a qualified Christian pastor or counselor when using this material.', ES: 'Este estudio aborda un tema delicado. El contenido fue generado con lenguaje cuidadoso y acogedor. Siempre consulte a un pastor o consejero cristiano calificado al usar este material.' },
  'study.limit_reached': { PT: 'Você atingiu o limite do seu plano.', EN: 'You reached your plan limit.', ES: 'Has alcanzado el límite de tu plan.' },
  'study.error': { PT: 'Erro inesperado. Contate o suporte.', EN: 'Unexpected error. Contact support.', ES: 'Error inesperado. Contacte soporte.' },
  'study.schema_error': { PT: 'Erro na geração. Tente novamente.', EN: 'Generation error. Try again.', ES: 'Error en la generación. Intente nuevamente.' },
  // Study tabs
  'study.tab.resumo': { PT: 'Resumo', EN: 'Summary', ES: 'Resumen' },
  'study.tab.contexto': { PT: 'Contexto', EN: 'Context', ES: 'Contexto' },
  'study.tab.exegese': { PT: 'Exegese', EN: 'Exegesis', ES: 'Exégesis' },
  'study.tab.teologia': { PT: 'Teologia', EN: 'Theology', ES: 'Teología' },
  'study.tab.aplicacao': { PT: 'Aplicação', EN: 'Application', ES: 'Aplicación' },
  'study.tab.perguntas': { PT: 'Perguntas', EN: 'Questions', ES: 'Preguntas' },
  'study.tab.conclusao': { PT: 'Conclusão', EN: 'Conclusion', ES: 'Conclusión' },
  'study.tab.avisos': { PT: 'Avisos', EN: 'Warnings', ES: 'Avisos' },
  // Study doctrine options
  'study.doctrine.evangelical_general': { PT: 'Evangélico Geral', EN: 'General Evangelical', ES: 'Evangélico General' },
  'study.doctrine.reformed': { PT: 'Reformada / Calvinista', EN: 'Reformed / Calvinist', ES: 'Reformada / Calvinista' },
  'study.doctrine.pentecostal': { PT: 'Pentecostal / Carismática', EN: 'Pentecostal / Charismatic', ES: 'Pentecostal / Carismática' },
  'study.doctrine.baptist': { PT: 'Batista', EN: 'Baptist', ES: 'Bautista' },
  'study.doctrine.methodist': { PT: 'Metodista', EN: 'Methodist', ES: 'Metodista' },
  'study.doctrine.catholic': { PT: 'Católica', EN: 'Catholic', ES: 'Católica' },
  'study.doctrine.lutheran': { PT: 'Luterana', EN: 'Lutheran', ES: 'Luterana' },
  'study.doctrine.interdenominational': { PT: 'Interdenominacional', EN: 'Interdenominational', ES: 'Interdenominacional' },
  // Study voice options
  'study.voice.welcoming': { PT: 'Acolhedor', EN: 'Welcoming', ES: 'Acogedor' },
  'study.voice.prophetic': { PT: 'Profético', EN: 'Prophetic', ES: 'Profético' },
  'study.voice.didactic': { PT: 'Didático', EN: 'Didactic', ES: 'Didáctico' },
  'study.voice.evangelistic': { PT: 'Evangelístico', EN: 'Evangelistic', ES: 'Evangelístico' },
  'study.voice.contemplative': { PT: 'Contemplativo', EN: 'Contemplative', ES: 'Contemplativo' },
  // Study depth options
  'study.depth.basic': { PT: 'Básico (grupos, células, iniciantes)', EN: 'Basic (groups, cells, beginners)', ES: 'Básico (grupos, células, principiantes)' },
  'study.depth.intermediate': { PT: 'Intermediário (líderes, professores)', EN: 'Intermediate (leaders, teachers)', ES: 'Intermedio (líderes, profesores)' },
  'study.depth.advanced': { PT: 'Avançado (pastores, teólogos)', EN: 'Advanced (pastors, theologians)', ES: 'Avanzado (pastores, teólogos)' },
  // PWA
  'landing.install_benefit': { PT: '📲 Instale como app · Acesse offline, sem depender de navegador', EN: '📲 Install as app · Access offline, no browser needed', ES: '📲 Instala como app · Accede sin conexión, sin navegador' },
  'pwa.install_title': { PT: '📲 Instale o Living Word', EN: '📲 Install Living Word', ES: '📲 Instala Living Word' },
  'pwa.install_desc': { PT: 'Acesse offline, direto da tela inicial do celular.', EN: 'Access offline, right from your home screen.', ES: 'Accede sin conexión, directo desde tu pantalla de inicio.' },
  'pwa.install_cta': { PT: 'Instalar agora', EN: 'Install now', ES: 'Instalar ahora' },
  'pwa.dismiss': { PT: 'Agora não', EN: 'Not now', ES: 'Ahora no' },
  // AI model badge
  'ai.powered_pro': { PT: '⚡ Powered by GPT-4o (Alta Exegese)', EN: '⚡ Powered by GPT-4o (Deep Exegesis)', ES: '⚡ Powered by GPT-4o (Exégesis Profunda)' },
  // Minds
  'minds.loading': { PT: 'Carregando mentes...', EN: 'Loading minds...', ES: 'Cargando mentes...' },
  'minds.empty': { PT: 'Nenhuma mente disponível no momento.', EN: 'No minds available at the moment.', ES: 'No hay mentes disponibles por el momento.' },
};

/**
 * Get a translated string.
 * Fallback chain: requested lang → EN → key
 */
export function t(key: string, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['EN'] || key;
}
