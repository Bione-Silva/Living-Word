export interface BiblicalStudyOutput {
  schema_version: string;
  title: string;
  bible_passage: string;
  central_idea: string;
  summary: string;
  depth_level: string;
  doctrine_line: string;
  language: string;
  
  historical_context: {
    text: string;
    source_confidence: 'high' | 'medium' | 'low';
  };
  
  literary_context: {
    genre: string;
    position_in_book: string;
    source_confidence: 'high' | 'medium' | 'low';
  };
  
  text_structure: Array<{
    section: string;
    verses: string;
    description: string;
  }>;
  
  bible_text: Array<{
    reference: string;
    text: string;
    version: string;
  }>;
  
  exegesis: Array<{
    focus: string;
    linguistic_note: string;
    theological_insight: string;
    source_confidence: 'high' | 'medium' | 'low';
  }>;
  
  theological_interpretation: Array<{
    perspective: string;
    interpretation: string;
    is_debated: boolean;
    sources?: string[];
    source_confidence: 'high' | 'medium' | 'low';
  }>;
  
  biblical_connections: Array<{
    passage: string;
    relationship: 'typology' | 'fulfillment' | 'parallel' | 'contrast' | 'echo';
    note: string;
  }>;
  
  application: Array<{
    context: string;
    application: string;
    practical_action: string;
  }>;
  
  reflection_questions: Array<{
    question: string;
    target_audience?: string;
  }>;
  
  conclusion: string;
  pastoral_warning: string;
  rag_sources_used: string[];
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
