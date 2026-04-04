/**
 * shared/types/biblicalStudy.ts
 *
 * Contrato TypeScript compartilhado entre Backend (Edge Function) e Frontend (Lovable).
 * BACKEND e FRONTEND devem importar deste arquivo — nunca duplicar os tipos.
 *
 * Versão do schema: 1.0
 */

// ─────────────────────────────────────────────────────────────
// Tipos de suporte
// ─────────────────────────────────────────────────────────────

/** Nível de confiança da fonte usada (RAG / Comentários históricos) */
export type SourceConfidence = 'high' | 'medium' | 'low';

/** Nível de profundidade do estudo */
export type DepthLevel = 'basic' | 'intermediate' | 'advanced';

/** Estado do pipeline de geração */
export type GenerationStatus =
  | 'pending'
  | 'generated'
  | 'failed_schema'
  | 'failed_validation'
  | 'saved';

/** Linhas doutrinárias suportadas */
export type DoctrineLine =
  | 'evangelical_general'
  | 'reformed'
  | 'pentecostal'
  | 'baptist'
  | 'methodist'
  | 'catholic'
  | 'lutheran'
  | 'interdenominational';

/** Tons pastorais suportados */
export type PastoralVoice =
  | 'welcoming'
  | 'prophetic'
  | 'didactic'
  | 'evangelistic'
  | 'contemplative';

// ─────────────────────────────────────────────────────────────
// Input da geração (enviado pelo frontend)
// ─────────────────────────────────────────────────────────────

export interface BiblicalStudyInput {
  /** Passagem bíblica (ex: "João 3:16", "Mateus 5:1-12") */
  bible_passage: string;
  /** Tema opcional para direcionar a exegese */
  theme?: string;
  /** Idioma do estudo */
  language: 'PT' | 'EN' | 'ES';
  /** Versão bíblica preferida do usuário */
  bible_version: string;
  /** Linha doutrinária do usuário */
  doctrine_line: DoctrineLine;
  /** Tom pastoral desejado */
  pastoral_voice: PastoralVoice;
  /** Profundidade teológica do estudo */
  depth_level: DepthLevel;
}

// ─────────────────────────────────────────────────────────────
// Seções do Output (renderizadas por tab no frontend)
// ─────────────────────────────────────────────────────────────

/** Um versículo/trecho do texto base */
export interface BibleTextSegment {
  reference: string;
  text: string;
  version: string;
}

/** Um ponto de exegese individual */
export interface ExegesisPoint {
  /** Versículo ou frase em foco */
  focus: string;
  /** Análise linguística/gramatical */
  linguistic_note: string;
  /** Contribuição teológica do ponto */
  theological_insight: string;
  /** Nível de confiança do insight (especialmente se RAG) */
  source_confidence: SourceConfidence;
}

/** Uma interpretação teológica do texto */
export interface TheologicalInterpretation {
  /** Nome da perspectiva ou escola */
  perspective: string;
  /** Descrição da interpretação */
  interpretation: string;
  /** Se há debate entre scholars, deve ser explicitado aqui */
  is_debated: boolean;
  /** Fontes/comentaristas referenciados */
  sources?: string[];
  source_confidence: SourceConfidence;
}

/** Uma conexão bíblica (cross-reference) */
export interface BiblicalConnection {
  reference: string;
  relationship: 'typology' | 'fulfillment' | 'parallel' | 'contrast' | 'echo';
  note: string;
}

/** Um ponto de aplicação pastoral */
export interface ApplicationPoint {
  context: string; // ex: "vida pessoal", "liderança", "família"
  application: string;
  practical_action: string;
}

/** Uma pergunta de reflexão */
export interface ReflectionQuestion {
  question: string;
  target_audience?: string; // ex: "pastor", "líder jovem", "congregante"
}

// ─────────────────────────────────────────────────────────────
// Output completo (persistido em output_biblical_study JSONB)
// ─────────────────────────────────────────────────────────────

export interface BiblicalStudyOutput {
  /** Versão do schema — OBRIGATÓRIO para versionamento */
  schema_version: '1.0';

  // ── Metadados do estudo ──
  title: string;
  bible_passage: string;
  central_idea: string;
  depth_level: DepthLevel;
  doctrine_line: DoctrineLine;
  language: 'PT' | 'EN' | 'ES';

  // ── Cautela pastoral ──
  /** Indica se o Caution Mode foi ativado */
  caution_mode: boolean;
  /** Tópico sensível detectado (se houver) */
  sensitive_topic_detected?: string;

  // ── Tab 1: Resumo ──
  summary: string;

  // ── Tab 2: Contexto ──
  historical_context: {
    text: string;
    source_confidence: SourceConfidence;
  };
  literary_context: {
    genre: string; // ex: "narrativa", "profecia", "epístola"
    position_in_book: string;
    source_confidence: SourceConfidence;
  };

  // ── Estrutura do texto ──
  text_structure: Array<{
    section: string;
    verses: string;
    description: string;
  }>;

  // ── Texto Base ──
  bible_text: BibleTextSegment[];

  // ── Tab 3: Exegese ──
  exegesis: ExegesisPoint[]; // mínimo 1 item

  // ── Tab 4: Teologia ──
  theological_interpretation: TheologicalInterpretation[];
  biblical_connections: BiblicalConnection[];

  // ── Tab 5: Aplicação ──
  application: ApplicationPoint[];

  // ── Tab 6: Perguntas ──
  reflection_questions: ReflectionQuestion[]; // mínimo 3 items

  // ── Tab 7: Conclusão ──
  conclusion: string;

  // ── Tab 8: Avisos ──
  pastoral_warning: string;

  // ── Metadados de geração ──
  generated_at: string; // ISO 8601
  rag_sources_used?: string[]; // comentaristas usados via RAG
}

// ─────────────────────────────────────────────────────────────
// Campos obrigatórios para validação (usado pelo backend e frontend)
// ─────────────────────────────────────────────────────────────

export const BIBLICAL_STUDY_REQUIRED_KEYS: (keyof BiblicalStudyOutput)[] = [
  'schema_version',
  'title',
  'bible_passage',
  'central_idea',
  'historical_context',
  'literary_context',
  'text_structure',
  'exegesis',
  'theological_interpretation',
  'biblical_connections',
  'application',
  'reflection_questions',
  'conclusion',
  'pastoral_warning',
  'caution_mode',
];

/** Valida o output do LLM antes de persistir */
export function validateBiblicalStudyOutput(data: unknown): data is BiblicalStudyOutput {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  for (const key of BIBLICAL_STUDY_REQUIRED_KEYS) {
    if (obj[key] === undefined || obj[key] === null) return false;
  }

  if (!Array.isArray(obj.exegesis) || (obj.exegesis as unknown[]).length < 1) return false;
  if (!Array.isArray(obj.reflection_questions) || (obj.reflection_questions as unknown[]).length < 3) return false;
  if (typeof obj.title !== 'string' || obj.title.trim() === '') return false;
  if (typeof obj.central_idea !== 'string' || obj.central_idea.trim() === '') return false;

  return true;
}
