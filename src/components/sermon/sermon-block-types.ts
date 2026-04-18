/**
 * Tipos do Studio de Blocos do Púlpito.
 * Cada tipo de bloco tem cor, ícone, label trilíngue e sugestão de placeholder.
 */

export type SermonBlockType =
  | 'hook'           // Gancho / Introdução
  | 'passage'        // Passagem Bíblica
  | 'original'       // Escavação Original (Hebraico/Grego)
  | 'big_idea'       // Grande Ideia
  | 'main_point'     // Ponto Principal
  | 'explanation'    // Explicação (texto em contexto histórico/teológico)
  | 'illustration'   // Ilustração / História
  | 'application'    // Aplicação Prática
  | 'transition'     // Transição entre pontos
  | 'quote'          // Citação (autor/livro)
  | 'conclusion';    // Conclusão / Oração

export interface SermonBlockData {
  id: string;
  type: SermonBlockType;
  /** Título curto opcional do bloco (ex: "Ponto 1 — A Graça que Salva") */
  title?: string;
  /** Conteúdo principal em markdown/texto */
  content: string;
  /** Para bloco "passage": referência bíblica selecionada */
  passageRef?: string;
}

export interface SermonBlockTypeMeta {
  type: SermonBlockType;
  /** Classe Tailwind para borda esquerda colorida */
  borderClass: string;
  /** Classe Tailwind para fundo do header (tom suave da cor) */
  headerBgClass: string;
  /** Classe Tailwind para a cor do ícone/título */
  accentClass: string;
  /** Emoji indicativo */
  emoji: string;
  /** Labels trilíngues */
  label: { PT: string; EN: string; ES: string };
  /** Placeholder trilíngue */
  placeholder: { PT: string; EN: string; ES: string };
}

/**
 * Paleta dos tipos de bloco — usa tokens semânticos do design system.
 * Mapeamento de cores conforme PRD:
 *  - Gancho: laranja
 *  - Passagem: azul secundário
 *  - Original: marrom
 *  - Grande Ideia: roxo
 *  - Ponto Principal: azul principal
 *  - Ilustração: verde
 *  - Aplicação: laranja escuro
 *  - Conclusão: rosa/teal
 */
export const SERMON_BLOCK_META: Record<SermonBlockType, SermonBlockTypeMeta> = {
  hook: {
    type: 'hook',
    borderClass: 'border-l-orange-500',
    headerBgClass: 'bg-orange-500/10',
    accentClass: 'text-orange-600 dark:text-orange-400',
    emoji: '🎯',
    label: { PT: 'Gancho / Introdução', EN: 'Hook / Introduction', ES: 'Gancho / Introducción' },
    placeholder: {
      PT: 'Comece com uma pergunta provocadora, uma história curta ou uma estatística que prenda a atenção...',
      EN: 'Open with a provocative question, a short story or a striking statistic...',
      ES: 'Comience con una pregunta provocadora, una historia corta o una estadística...',
    },
  },
  passage: {
    type: 'passage',
    borderClass: 'border-l-sky-500',
    headerBgClass: 'bg-sky-500/10',
    accentClass: 'text-sky-600 dark:text-sky-400',
    emoji: '📖',
    label: { PT: 'Passagem Bíblica', EN: 'Bible Passage', ES: 'Pasaje Bíblico' },
    placeholder: {
      PT: 'Cole o texto bíblico completo (ex: João 3:16-21)...',
      EN: 'Paste the full biblical text (e.g. John 3:16-21)...',
      ES: 'Pegue el texto bíblico completo (ej: Juan 3:16-21)...',
    },
  },
  original: {
    type: 'original',
    borderClass: 'border-l-amber-800',
    headerBgClass: 'bg-amber-800/10',
    accentClass: 'text-amber-800 dark:text-amber-600',
    emoji: '🔍',
    label: { PT: 'Hebraico / Grego', EN: 'Hebrew / Greek', ES: 'Hebreo / Griego' },
    placeholder: {
      PT: 'Análise da palavra original. Ex: ἀγάπη (agapē) — amor sacrificial e voluntário...',
      EN: 'Original word analysis. E.g.: ἀγάπη (agapē) — sacrificial, willful love...',
      ES: 'Análisis de la palabra original. Ej: ἀγάπη (agapē) — amor sacrificial y voluntario...',
    },
  },
  big_idea: {
    type: 'big_idea',
    borderClass: 'border-l-purple-600',
    headerBgClass: 'bg-purple-600/10',
    accentClass: 'text-purple-600 dark:text-purple-400',
    emoji: '💡',
    label: { PT: 'Grande Ideia', EN: 'Big Idea', ES: 'Gran Idea' },
    placeholder: {
      PT: 'A frase única que resume todo o sermão. Ex: "Deus salva quem não merece para mostrar quem Ele é."',
      EN: 'The single sentence that summarizes the whole sermon. E.g.: "God saves the undeserving to reveal who He is."',
      ES: 'La frase única que resume todo el sermón. Ej: "Dios salva al inmerecido para mostrar quién es."',
    },
  },
  main_point: {
    type: 'main_point',
    borderClass: 'border-l-blue-600',
    headerBgClass: 'bg-blue-600/10',
    accentClass: 'text-blue-600 dark:text-blue-400',
    emoji: '🔷',
    label: { PT: 'Ponto Principal', EN: 'Main Point', ES: 'Punto Principal' },
    placeholder: {
      PT: 'Desenvolva o ponto: tese + exposição do texto + argumento teológico + transição para o próximo ponto...',
      EN: 'Develop the point: thesis + text exposition + theological argument + transition to next point...',
      ES: 'Desarrolle el punto: tesis + exposición del texto + argumento teológico + transición...',
    },
  },
  illustration: {
    type: 'illustration',
    borderClass: 'border-l-emerald-600',
    headerBgClass: 'bg-emerald-600/10',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    emoji: '🎬',
    label: { PT: 'Ilustração Histórica', EN: 'Historical Illustration', ES: 'Ilustración Histórica' },
    placeholder: {
      PT: 'Conte uma história real (histórica, biográfica ou contemporânea) que ilumine o ponto...',
      EN: 'Tell a real story (historical, biographical or contemporary) that illuminates the point...',
      ES: 'Cuente una historia real (histórica, biográfica o contemporánea) que ilumine el punto...',
    },
  },
  application: {
    type: 'application',
    borderClass: 'border-l-orange-700',
    headerBgClass: 'bg-orange-700/10',
    accentClass: 'text-orange-700 dark:text-orange-500',
    emoji: '✨',
    label: { PT: 'Aplicação Prática', EN: 'Practical Application', ES: 'Aplicación Práctica' },
    placeholder: {
      PT: 'Como o ouvinte vive isso na segunda-feira? Seja específico, concreto e acionável...',
      EN: 'How does the listener live this out on Monday? Be specific, concrete and actionable...',
      ES: '¿Cómo lo vive el oyente el lunes? Sea específico, concreto y accionable...',
    },
  },
  conclusion: {
    type: 'conclusion',
    borderClass: 'border-l-rose-500',
    headerBgClass: 'bg-rose-500/10',
    accentClass: 'text-rose-600 dark:text-rose-400',
    emoji: '🙏',
    label: { PT: 'Conclusão / Oração', EN: 'Conclusion / Prayer', ES: 'Conclusión / Oración' },
    placeholder: {
      PT: 'Recapitulação curta + apelo + oração final. Termine apontando para Cristo...',
      EN: 'Short recap + appeal + closing prayer. End by pointing to Christ...',
      ES: 'Recapitulación corta + llamado + oración final. Termine apuntando a Cristo...',
    },
  },
};

export const SERMON_BLOCK_ORDER: SermonBlockType[] = [
  'hook',
  'passage',
  'original',
  'big_idea',
  'main_point',
  'illustration',
  'application',
  'conclusion',
];

/** Conta palavras de uma string (suporta múltiplos idiomas) */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Gera ID único para bloco novo */
export function newBlockId(): string {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Cria bloco vazio do tipo */
export function createEmptyBlock(type: SermonBlockType): SermonBlockData {
  return { id: newBlockId(), type, title: '', content: '' };
}

/**
 * Converte blocos em Markdown unificado (para salvar/exportar/Modo Púlpito).
 */
export function blocksToMarkdown(blocks: SermonBlockData[], lang: 'PT' | 'EN' | 'ES' = 'PT'): string {
  const out: string[] = [];
  for (const b of blocks) {
    const meta = SERMON_BLOCK_META[b.type];
    const heading = b.title?.trim() || meta.label[lang];
    out.push(`## ${meta.emoji} ${heading}`);
    if (b.type === 'passage' && b.passageRef) {
      out.push(`**${b.passageRef}**`);
    }
    if (b.content?.trim()) {
      if (b.type === 'passage') {
        out.push(b.content.split('\n').map((l) => `> ${l}`).join('\n'));
      } else {
        out.push(b.content);
      }
    }
    out.push('');
  }
  return out.join('\n').trim();
}
