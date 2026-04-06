type L = 'PT' | 'EN' | 'ES';
type Dict = Record<string, Record<L, string>>;

export const studyLabels: Dict = {
  // Verdade Central
  centralTruth: { PT: 'Verdade Central', EN: 'Central Truth', ES: 'Verdad Central' },
  openingPrayer: { PT: '🙏 Oração de Abertura', EN: '🙏 Opening Prayer', ES: '🙏 Oración de Apertura' },

  // Contexto
  context: { PT: 'Contexto', EN: 'Context', ES: 'Contexto' },
  historical: { PT: 'Histórico', EN: 'Historical', ES: 'Histórico' },
  literary: { PT: 'Literário', EN: 'Literary', ES: 'Literario' },
  canonical: { PT: 'Canônico', EN: 'Canonical', ES: 'Canónico' },

  // Observação
  observation: { PT: 'Observação', EN: 'Observation', ES: 'Observación' },
  questions5wh: { PT: 'Perguntas 5W+H', EN: '5W+H Questions', ES: 'Preguntas 5W+H' },
  keywords: { PT: 'Palavras-Chave', EN: 'Keywords', ES: 'Palabras Clave' },
  notableElements: { PT: 'Elementos Notáveis', EN: 'Notable Elements', ES: 'Elementos Notables' },

  // Interpretação
  interpretation: { PT: 'Interpretação', EN: 'Interpretation', ES: 'Interpretación' },
  originalMeaning: { PT: 'Significado Original', EN: 'Original Meaning', ES: 'Significado Original' },
  wordStudy: { PT: 'Estudo de Palavras', EN: 'Word Study', ES: 'Estudio de Palabras' },
  crossReferences: { PT: 'Cruzamento de Escrituras', EN: 'Cross References', ES: 'Referencias Cruzadas' },
  internalLogic: { PT: 'Lógica Interna', EN: 'Internal Logic', ES: 'Lógica Interna' },

  // Cristologia
  christologicalConnection: { PT: 'Conexão Cristológica', EN: 'Christological Connection', ES: 'Conexión Cristológica' },

  // Aplicação
  application: { PT: 'Aplicação', EN: 'Application', ES: 'Aplicación' },
  believe: { PT: 'Crer', EN: 'Believe', ES: 'Creer' },
  change: { PT: 'Mudar', EN: 'Change', ES: 'Cambiar' },
  act: { PT: 'Agir', EN: 'Act', ES: 'Actuar' },
  personalReflection: { PT: 'Reflexão Pessoal', EN: 'Personal Reflection', ES: 'Reflexión Personal' },

  // Perguntas
  discussionQuestions: { PT: 'Perguntas para Discussão', EN: 'Discussion Questions', ES: 'Preguntas de Discusión' },
  bonus: { PT: '⭐ Bônus', EN: '⭐ Bonus', ES: '⭐ Bono' },

  // Encerramento
  closing: { PT: 'Encerramento', EN: 'Closing', ES: 'Cierre' },
  suggestedPrayer: { PT: 'Oração Sugerida', EN: 'Suggested Prayer', ES: 'Oración Sugerida' },
  leaderInstruction: { PT: 'Instrução ao Líder', EN: 'Leader Instruction', ES: 'Instrucción al Líder' },

  // Notas do Líder
  leaderTips: { PT: '📝 Dicas para o Líder da Célula', EN: '📝 Cell Leader Tips', ES: '📝 Consejos para el Líder Celular' },
  howToIntroduce: { PT: 'Como Introduzir', EN: 'How to Introduce', ES: 'Cómo Introducir' },
  pointsOfAttention: { PT: '⚠️ Pontos de Atenção', EN: '⚠️ Points of Attention', ES: '⚠️ Puntos de Atención' },
  commonMistakes: { PT: '❌ Erros Comuns', EN: '❌ Common Mistakes', ES: '❌ Errores Comunes' },
  additionalResources: { PT: '📚 Recursos Adicionais', EN: '📚 Additional Resources', ES: '📚 Recursos Adicionales' },

  // Misc
  historicalSources: { PT: 'Fontes históricas', EN: 'Historical sources', ES: 'Fuentes históricas' },

  // Exports
  bibleText: { PT: 'Texto Bíblico', EN: 'Bible Text', ES: 'Texto Bíblico' },
  historicalContext: { PT: 'Contexto Histórico', EN: 'Historical Context', ES: 'Contexto Histórico' },
  literaryContext: { PT: 'Contexto Literário', EN: 'Literary Context', ES: 'Contexto Literario' },
  observation5wh: { PT: 'Observação — Perguntas 5W+H', EN: 'Observation — 5W+H Questions', ES: 'Observación — Preguntas 5W+H' },
  discussionQuestionsExport: { PT: 'Perguntas para Discussão', EN: 'Discussion Questions', ES: 'Preguntas de Discusión' },
  ragSources: { PT: 'Fontes Históricas (RAG)', EN: 'Historical Sources (RAG)', ES: 'Fuentes Históricas (RAG)' },
  prayer: { PT: 'Oração', EN: 'Prayer', ES: 'Oración' },

  // Export toasts
  pdfSuccess: { PT: 'PDF exportado com sucesso!', EN: 'PDF exported successfully!', ES: '¡PDF exportado con éxito!' },
  pdfError: { PT: 'Erro ao exportar PDF.', EN: 'Error exporting PDF.', ES: 'Error al exportar PDF.' },
  docxSuccess: { PT: 'DOCX exportado com sucesso!', EN: 'DOCX exported successfully!', ES: '¡DOCX exportado con éxito!' },
  docxError: { PT: 'Erro ao exportar DOCX.', EN: 'Error exporting DOCX.', ES: 'Error al exportar DOCX.' },
  transforming: { PT: 'Transformando conteúdo...', EN: 'Transforming content...', ES: 'Transformando contenido...' },
  transformSuccess: { PT: 'Conteúdo transformado com sucesso!', EN: 'Content transformed successfully!', ES: '¡Contenido transformado con éxito!' },
  transformError: { PT: 'Erro ao transformar conteúdo.', EN: 'Error transforming content.', ES: 'Error al transformar el contenido.' },
};

export function sl(key: string, lang: L): string {
  return studyLabels[key]?.[lang] ?? studyLabels[key]?.PT ?? key;
}
