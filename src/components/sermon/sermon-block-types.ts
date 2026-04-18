/**
 * Tipos do Studio de Blocos do Púlpito.
 * Cada tipo de bloco tem cor, ícone, label trilíngue e sugestão de placeholder.
 */

export type SermonBlockType =
  | 'hook'           // Gancho / Introdução
  | 'passage'        // Passagem Bíblica
  | 'original'       // Escavação Original (Hebraico/Grego)
  | 'big_idea'       // Grande Ideia
  | 'doctrine'       // Doutrina (verdade teológica raiz)
  | 'objection'      // Objeção / Refutação (antecipa a dúvida do ouvinte)
  | 'main_point'     // Ponto Principal
  | 'explanation'    // Explicação (texto em contexto histórico/teológico)
  | 'illustration'   // Ilustração / História
  | 'application'    // Aplicação Prática
  | 'transition'     // Transição entre pontos
  | 'quote'          // Citação (autor/livro)
  | 'appeal'         // Apelo / Altar Call (chamado para decisão)
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
  /** Classe Tailwind para a bolinha sólida no seletor (bg-{cor}) */
  dotClass: string;
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
    dotClass: 'bg-orange-500',
    emoji: '🎯',
    label: { PT: 'Gancho / Introdução', EN: 'Hook / Introduction', ES: 'Gancho / Introducción' },
    placeholder: {
      PT: 'Qual pergunta ou dilema vai capturar a atenção nos primeiros 30 segundos? (Ex: Timothy Keller usava dilemas da cultura moderna como isca para o Evangelho.)',
      EN: 'What question or dilemma will capture attention in the first 30 seconds? (E.g.: Timothy Keller used modern cultural dilemmas as bait for the Gospel.)',
      ES: '¿Qué pregunta o dilema captará la atención en los primeros 30 segundos? (Ej: Timothy Keller usaba dilemas de la cultura moderna como anzuelo para el Evangelio.)',
    },
  },
  passage: {
    type: 'passage',
    borderClass: 'border-l-sky-500',
    headerBgClass: 'bg-sky-500/10',
    accentClass: 'text-sky-600 dark:text-sky-400',
    dotClass: 'bg-sky-500',
    emoji: '📖',
    label: { PT: 'Passagem Bíblica', EN: 'Bible Passage', ES: 'Pasaje Bíblico' },
    placeholder: {
      PT: 'Cole o texto bíblico completo. (Ex: Os Puritanos sempre abriam discursos proclamando a Palavra pura antes de qualquer argumento humano.)',
      EN: 'Paste the full biblical text. (E.g.: The Puritans always opened discourses by proclaiming the pure Word before any human argument.)',
      ES: 'Pegue el texto bíblico completo. (Ej: Los Puritanos siempre abrían discursos proclamando la Palabra pura antes de cualquier argumento humano.)',
    },
  },
  original: {
    type: 'original',
    borderClass: 'border-l-amber-800',
    headerBgClass: 'bg-amber-800/10',
    accentClass: 'text-amber-800 dark:text-amber-600',
    dotClass: 'bg-amber-800',
    emoji: '🔍',
    label: { PT: 'Hebraico / Grego', EN: 'Hebrew / Greek', ES: 'Hebreo / Griego' },
    placeholder: {
      PT: 'Qual a raiz da palavra original? (Ex: Pregadores expositivos usam o idioma original — como ἀγάπη (agapē) — para revelar mistérios perdidos na tradução.)',
      EN: 'What is the root of the original word? (E.g.: Expository preachers use the original language — like ἀγάπη (agapē) — to reveal mysteries lost in translation.)',
      ES: '¿Cuál es la raíz de la palabra original? (Ej: Los predicadores expositivos usan el idioma original — como ἀγάπη (agapē) — para revelar misterios perdidos en la traducción.)',
    },
  },
  doctrine: {
    type: 'doctrine',
    borderClass: 'border-l-slate-700',
    headerBgClass: 'bg-slate-700/10',
    accentClass: 'text-slate-700 dark:text-slate-300',
    dotClass: 'bg-slate-700',
    emoji: '⚓',
    label: { PT: 'Doutrina', EN: 'Doctrine', ES: 'Doctrina' },
    placeholder: {
      PT: 'Qual a verdade teológica absoluta por trás deste texto? (Ex: John Wesley ancorava toda a mensagem em doutrina pura antes de aplicá-la à vida — sem doutrina, não há sermão.)',
      EN: 'What is the absolute theological truth behind this text? (E.g.: John Wesley anchored every message in pure doctrine before applying it to life — no doctrine, no sermon.)',
      ES: '¿Cuál es la verdad teológica absoluta detrás de este texto? (Ej: John Wesley anclaba todo mensaje en doctrina pura antes de aplicarlo a la vida — sin doctrina, no hay sermón.)',
    },
  },
  objection: {
    type: 'objection',
    borderClass: 'border-l-amber-600',
    headerBgClass: 'bg-amber-600/10',
    accentClass: 'text-amber-700 dark:text-amber-500',
    dotClass: 'bg-amber-600',
    emoji: '🛡️',
    label: { PT: 'Objeção / Refutação', EN: 'Objection / Refutation', ES: 'Objeción / Refutación' },
    placeholder: {
      PT: 'Qual dúvida cética seu ouvinte pode estar pensando agora? (Ex: Charles Spurgeon antecipava as objeções da plateia para desarmá-las antes que virassem barreira ao Evangelho.)',
      EN: 'What skeptical doubt might your listener be thinking right now? (E.g.: Charles Spurgeon would anticipate audience objections to disarm them before they became barriers to the Gospel.)',
      ES: '¿Qué duda escéptica podría estar pensando su oyente ahora? (Ej: Charles Spurgeon anticipaba las objeciones de la audiencia para desarmarlas antes que se volvieran barreras al Evangelio.)',
    },
  },
  big_idea: {
    type: 'big_idea',
    borderClass: 'border-l-purple-600',
    headerBgClass: 'bg-purple-600/10',
    accentClass: 'text-purple-600 dark:text-purple-400',
    dotClass: 'bg-purple-600',
    emoji: '💡',
    label: { PT: 'Grande Ideia', EN: 'Big Idea', ES: 'Gran Idea' },
    placeholder: {
      PT: 'Resuma a mensagem inteira em UMA frase. (Ex: Haddon Robinson revolucionou a pregação focando todo o sermão em uma única "Big Idea" memorável.)',
      EN: 'Sum up the entire message in ONE sentence. (E.g.: Haddon Robinson revolutionized preaching by focusing the whole sermon on a single memorable "Big Idea".)',
      ES: 'Resuma el mensaje entero en UNA frase. (Ej: Haddon Robinson revolucionó la predicación enfocando todo el sermón en una única "Gran Idea" memorable.)',
    },
  },
  main_point: {
    type: 'main_point',
    borderClass: 'border-l-blue-600',
    headerBgClass: 'bg-blue-600/10',
    accentClass: 'text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-600',
    emoji: '🔷',
    label: { PT: 'Ponto Principal', EN: 'Main Point', ES: 'Punto Principal' },
    placeholder: {
      PT: 'Crie um título lógico e memorável para este ponto. (Ex: Pregadores clássicos usavam divisões numeradas e simétricas para que a igreja conseguisse anotar e lembrar.)',
      EN: 'Create a logical, memorable title for this point. (E.g.: Classic preachers used numbered, symmetrical divisions so the church could take notes and remember.)',
      ES: 'Cree un título lógico y memorable para este punto. (Ej: Los predicadores clásicos usaban divisiones numeradas y simétricas para que la iglesia pudiera anotar y recordar.)',
    },
  },
  explanation: {
    type: 'explanation',
    borderClass: 'border-l-violet-500',
    headerBgClass: 'bg-violet-500/10',
    accentClass: 'text-violet-600 dark:text-violet-400',
    dotClass: 'bg-violet-500',
    emoji: '📜',
    label: { PT: 'Explicação', EN: 'Explanation', ES: 'Explicación' },
    placeholder: {
      PT: 'Explique o contexto histórico e literário. O que o autor original queria dizer à igreja da época? (Esta é a base da pregação expositiva — Calvino, Lloyd-Jones e MacArthur começavam por aqui.)',
      EN: 'Explain the historical and literary context. What did the original author mean to the church of his time? (This is the foundation of expository preaching — Calvin, Lloyd-Jones and MacArthur all started here.)',
      ES: 'Explique el contexto histórico y literario. ¿Qué quería decir el autor original a la iglesia de su época? (Esta es la base de la predicación expositiva — Calvino, Lloyd-Jones y MacArthur comenzaban aquí.)',
    },
  },
  illustration: {
    type: 'illustration',
    borderClass: 'border-l-emerald-600',
    headerBgClass: 'bg-emerald-600/10',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-600',
    emoji: '🎬',
    label: { PT: 'Ilustração', EN: 'Illustration', ES: 'Ilustración' },
    placeholder: {
      PT: 'Conte uma história, metáfora ou testemunho que ilumine a verdade. (Ex: Spurgeon era chamado de "Príncipe dos Pregadores" justamente por suas ilustrações vívidas e inesquecíveis.)',
      EN: 'Tell a story, metaphor or testimony that illuminates the truth. (E.g.: Spurgeon was called the "Prince of Preachers" precisely because of his vivid, unforgettable illustrations.)',
      ES: 'Cuente una historia, metáfora o testimonio que ilumine la verdad. (Ej: Spurgeon era llamado el "Príncipe de los Predicadores" precisamente por sus ilustraciones vívidas e inolvidables.)',
    },
  },
  application: {
    type: 'application',
    borderClass: 'border-l-orange-700',
    headerBgClass: 'bg-orange-700/10',
    accentClass: 'text-orange-700 dark:text-orange-500',
    dotClass: 'bg-orange-700',
    emoji: '✨',
    label: { PT: 'Aplicação Prática', EN: 'Practical Application', ES: 'Aplicación Práctica' },
    placeholder: {
      PT: 'O que a igreja deve fazer na segunda-feira de manhã? (Ex: Os Puritanos chamavam isso de "Os Usos" — o dever prático e concreto que nasce da doutrina.)',
      EN: 'What should the church actually do on Monday morning? (E.g.: The Puritans called this "The Uses" — the practical, concrete duty born out of doctrine.)',
      ES: '¿Qué debe hacer la iglesia el lunes por la mañana? (Ej: Los Puritanos llamaban a esto "Los Usos" — el deber práctico y concreto que nace de la doctrina.)',
    },
  },
  transition: {
    type: 'transition',
    borderClass: 'border-l-slate-500',
    headerBgClass: 'bg-slate-500/10',
    accentClass: 'text-slate-600 dark:text-slate-400',
    dotClass: 'bg-slate-500',
    emoji: '➰',
    label: { PT: 'Transição', EN: 'Transition', ES: 'Transición' },
    placeholder: {
      PT: 'Frase-ponte que conecta o ponto anterior ao próximo. (Ex: "Mas se isso é verdade, então..." — Wesley dizia que boas transições mantêm o ouvinte respirando junto com o pregador.)',
      EN: 'A bridge sentence connecting the previous point to the next. (E.g.: "But if this is true, then..." — Wesley said good transitions keep the listener breathing along with the preacher.)',
      ES: 'Frase-puente que conecta el punto anterior con el siguiente. (Ej: "Pero si esto es verdad, entonces..." — Wesley decía que las buenas transiciones mantienen al oyente respirando con el predicador.)',
    },
  },
  quote: {
    type: 'quote',
    borderClass: 'border-l-yellow-600',
    headerBgClass: 'bg-yellow-600/10',
    accentClass: 'text-yellow-700 dark:text-yellow-500',
    dotClass: 'bg-yellow-600',
    emoji: '📚',
    label: { PT: 'Citação', EN: 'Quote', ES: 'Cita' },
    placeholder: {
      PT: 'Traga o peso de um gigante da fé para reforçar sua tese. (Ex: C.S. Lewis, Agostinho, Lutero, Tozer — uma boa citação é um martelo que crava a verdade.)',
      EN: 'Bring the weight of a giant of the faith to reinforce your thesis. (E.g.: C.S. Lewis, Augustine, Luther, Tozer — a good quote is a hammer that drives truth home.)',
      ES: 'Traiga el peso de un gigante de la fe para reforzar su tesis. (Ej: C.S. Lewis, Agustín, Lutero, Tozer — una buena cita es un martillo que clava la verdad.)',
    },
  },
  appeal: {
    type: 'appeal',
    borderClass: 'border-l-red-600',
    headerBgClass: 'bg-red-600/10',
    accentClass: 'text-red-600 dark:text-red-400',
    dotClass: 'bg-red-600',
    emoji: '🔥',
    label: { PT: 'Apelo / Altar Call', EN: 'Appeal / Altar Call', ES: 'Llamado / Altar Call' },
    placeholder: {
      PT: 'Ouvintes à beira da decisão. O que eles precisam fazer AGORA? (Ex: Billy Graham desenhava todo o sermão apontando para este momento de decisão diante do altar — sem apelo, a verdade fica solta no ar.)',
      EN: 'Listeners on the edge of decision. What do they need to do RIGHT NOW? (E.g.: Billy Graham designed every sermon to point toward this moment of decision before the altar — without an appeal, truth is left dangling in the air.)',
      ES: 'Oyentes al borde de la decisión. ¿Qué necesitan hacer AHORA? (Ej: Billy Graham diseñaba todo el sermón apuntando a este momento de decisión ante el altar — sin llamado, la verdad queda suelta en el aire.)',
    },
  },
  conclusion: {
    type: 'conclusion',
    borderClass: 'border-l-rose-500',
    headerBgClass: 'bg-rose-500/10',
    accentClass: 'text-rose-600 dark:text-rose-400',
    dotClass: 'bg-rose-500',
    emoji: '🙏',
    label: { PT: 'Conclusão / Oração', EN: 'Conclusion / Prayer', ES: 'Conclusión / Oración' },
    placeholder: {
      PT: 'Como pousar o avião? Resuma a Grande Ideia com foco e esperança, e termine com uma oração que guie a igreja. (Ex: Billy Graham desenhava todo o sermão apontando para este momento de decisão diante do altar.)',
      EN: 'How do you land the plane? Restate the Big Idea with focus and hope, and end with a prayer that guides the church. (E.g.: Billy Graham designed every sermon to point toward this moment of decision before the altar.)',
      ES: '¿Cómo aterrizar el avión? Resuma la Gran Idea con foco y esperanza, y termine con una oración que guíe a la iglesia. (Ej: Billy Graham diseñaba todo el sermón apuntando a este momento de decisión ante el altar.)',
    },
  },
};

/**
 * Ordem oficial do Modelo Spurgeon (Expositivo) — esqueleto padrão da plataforma.
 * Esta é a sequência homilética raiz que guia tanto a UI (auto-seed) quanto a IA (bulk-generate).
 */
export const SPURGEON_MODEL_ORDER: SermonBlockType[] = [
  'hook',
  'passage',
  'doctrine',
  'objection',
  'main_point',
  'explanation',
  'illustration',
  'application',
  'appeal',
  'conclusion',
];

export const SERMON_BLOCK_ORDER: SermonBlockType[] = [
  'hook',
  'passage',
  'doctrine',
  'objection',
  'main_point',
  'explanation',
  'illustration',
  'application',
  'transition',
  'quote',
  'appeal',
  'conclusion',
  'big_idea',
  'original',
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
