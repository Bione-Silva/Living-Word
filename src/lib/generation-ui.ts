export type GenerationUILang = 'PT' | 'EN' | 'ES';

export const pastoralLoadingMessages: Record<GenerationUILang, string[]> = {
  PT: [
    '📖 Acessando biblioteca teológica...',
    '🔍 Analisando contexto bíblico...',
    '✍️ Estruturando conteúdo pastoral...',
    '🎯 Aplicando voz pastoral selecionada...',
    '📝 Redigindo sermão completo...',
    '🔬 Validando exegese e referências...',
    '✅ Auditando densidade do conteúdo...',
    '🧠 Refinando aplicações práticas...',
    '📋 Finalizando material...',
  ],
  EN: [
    '📖 Accessing theological library...',
    '🔍 Analyzing biblical context...',
    '✍️ Structuring pastoral content...',
    '🎯 Applying selected pastoral voice...',
    '📝 Writing full sermon...',
    '🔬 Validating exegesis and references...',
    '✅ Auditing content density...',
    '🧠 Refining practical applications...',
    '📋 Finalizing material...',
  ],
  ES: [
    '📖 Accediendo a biblioteca teológica...',
    '🔍 Analizando contexto bíblico...',
    '✍️ Estructurando contenido pastoral...',
    '🎯 Aplicando voz pastoral seleccionada...',
    '📝 Redactando sermón completo...',
    '🔬 Validando exégesis y referencias...',
    '✅ Auditando densidad del contenido...',
    '🧠 Refinando aplicaciones prácticas...',
    '📋 Finalizando material...',
  ],
};

export const studyLoadingMessages: Record<GenerationUILang, string[]> = {
  PT: [
    '📚 Acessando biblioteca teológica...',
    '🧭 Mapeando contexto histórico e literário...',
    '🧱 Estruturando o estudo por seções...',
    '🔎 Refinando exegese e conexões bíblicas...',
    '🛡️ Validando requisitos obrigatórios...',
    '✅ Consolidando o estudo completo...',
  ],
  EN: [
    '📚 Accessing theological library...',
    '🧭 Mapping historical and literary context...',
    '🧱 Structuring the study into sections...',
    '🔎 Refining exegesis and biblical connections...',
    '🛡️ Validating required sections...',
    '✅ Consolidating the complete study...',
  ],
  ES: [
    '📚 Accediendo a biblioteca teológica...',
    '🧭 Mapeando contexto histórico y literario...',
    '🧱 Estructurando el estudio por secciones...',
    '🔎 Refinando exégesis y conexiones bíblicas...',
    '🛡️ Validando secciones obligatorias...',
    '✅ Consolidando el estudio completo...',
  ],
};

export const exposLoadingMessages: Record<GenerationUILang, string[]> = {
  PT: [
    '📖 Acessando biblioteca teológica...',
    '🏛️ Reconstruindo contexto histórico da passagem...',
    '🧩 Estruturando o documento E.X.P.O.S....',
    '🔬 Validando exposição e aplicações...',
    '✅ Finalizando estudo editável...',
  ],
  EN: [
    '📖 Accessing theological library...',
    '🏛️ Rebuilding the passage historical context...',
    '🧩 Structuring the E.X.P.O.S. document...',
    '🔬 Validating exposition and applications...',
    '✅ Finalizing editable study...',
  ],
  ES: [
    '📖 Accediendo a biblioteca teológica...',
    '🏛️ Reconstruyendo el contexto histórico del pasaje...',
    '🧩 Estructurando el documento E.X.P.O.S....',
    '🔬 Validando exposición y aplicaciones...',
    '✅ Finalizando estudio editable...',
  ],
};

export const loadingHints: Record<GenerationUILang, string> = {
  PT: 'A IA está gerando e validando o conteúdo. Isso pode levar alguns segundos.',
  EN: 'The AI is generating and validating the content. This may take a few seconds.',
  ES: 'La IA está generando y validando el contenido. Esto puede tardar algunos segundos.',
};