export interface BiblicalStudyOutput {
  metadata: {
    versao_template: '1.0';
    tipo_uso: string;
    duracao_estimada_min?: number;
    criado_em: string;
  };
  ancora_espiritual: { oracao_abertura?: string };
  passagem: {
    referencia: string;
    texto: string;
    versao: string;
    genero: string;
  };
  contexto: {
    historico: string;
    literario: string;
    canonico?: string;
  };
  observacao: {
    perguntas_5wh: Array<{ pergunta: string; resposta: string }>;
    palavras_chave: Array<{ palavra: string; explicacao: string }>;
    elementos_notaveis?: string;
  };
  interpretacao: {
    estudo_palavras?: Array<{ palavra: string; original?: string; significado: string }>;
    cruzamento_escrituras?: string[];
    logica_interna?: string;
    significado_original: string;
  };
  verdade_central: {
    frase_central: string;
    proposicao_expandida?: string;
  };
  conexao_cristologica?: {
    como_aponta_para_cristo: string;
    tipo_conexao: string;
  };
  aplicacao: {
    crer: string;
    mudar: string;
    agir: string;
    reflexao_pessoal?: string;
  };
  perguntas_discussao: {
    observacao: string[];
    interpretacao: string[];
    aplicacao: string[];
    bonus?: string;
  };
  encerramento: {
    oracao_sugerida: string;
    instrucao_lider?: string;
  };
  notas_lider?: {
    como_introduzir?: string;
    pontos_atencao?: string[];
    erros_comuns?: string[];
    recursos_adicionais?: string[];
  };
  caution_mode?: boolean;
  sensitive_topic_detected?: string | null;
  rag_sources_used?: string[];
}

export interface BiblicalStudyResponse {
  success: boolean;
  material_id: string;
  caution_mode: boolean;
  sensitive_topic_detected: string | null;
  study: BiblicalStudyOutput;
}

export interface BiblicalStudyFormData {
  bible_passage: string;
  theme: string;
  language: string;
  bible_version: string;
  doctrine_line: string;
  pastoral_voice: string;
  depth_level: string;
}
