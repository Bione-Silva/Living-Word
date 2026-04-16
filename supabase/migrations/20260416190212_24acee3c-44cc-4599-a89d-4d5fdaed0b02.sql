-- RPC pública (em public, exposta ao PostgREST) que insere no schema `knowledge`
-- usando SECURITY DEFINER. Isso evita ter que expor o schema `knowledge` à API.
--
-- Acesso: a edge function chama essa RPC com a service_role_key, então
-- garantimos que apenas service_role pode executá-la.

CREATE OR REPLACE FUNCTION public.kb_ingest_document(
  p_document jsonb,
  p_chunks   jsonb,
  p_upsert   boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, knowledge
AS $$
DECLARE
  v_document_id   uuid;
  v_inserted      integer := 0;
  v_title         text;
  v_source        text;
  v_mind          text;
  v_language      text;
  v_bible_refs    text[];
  v_themes        text[];
  v_metadata      jsonb;
BEGIN
  -- Extrai campos do documento
  v_title      := p_document->>'title';
  v_source     := p_document->>'source';
  v_mind       := p_document->>'mind';
  v_language   := p_document->>'language';
  v_metadata   := p_document->'metadata';

  IF p_document ? 'bible_refs' AND jsonb_typeof(p_document->'bible_refs') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_bible_refs
    FROM jsonb_array_elements_text(p_document->'bible_refs');
  END IF;

  IF p_document ? 'themes' AND jsonb_typeof(p_document->'themes') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_themes
    FROM jsonb_array_elements_text(p_document->'themes');
  END IF;

  -- Upsert opcional: remove documento existente com mesmo (source, title)
  IF p_upsert THEN
    IF v_source IS NOT NULL THEN
      DELETE FROM knowledge.documents
      WHERE title = v_title AND source = v_source;
    ELSE
      DELETE FROM knowledge.documents
      WHERE title = v_title AND source IS NULL;
    END IF;
  END IF;

  -- Insere documento
  INSERT INTO knowledge.documents (
    title, source, mind, language, bible_refs, themes, metadata
  )
  VALUES (
    v_title, v_source, v_mind, v_language, v_bible_refs, v_themes, v_metadata
  )
  RETURNING id INTO v_document_id;

  -- Insere chunks (cast do array JSON pra vector(768))
  WITH inserted AS (
    INSERT INTO knowledge.chunks (
      document_id,
      chunk_index,
      chunk_text,
      embedding,
      token_count,
      metadata,
      embedding_model
    )
    SELECT
      v_document_id,
      (c->>'chunk_index')::int,
      c->>'chunk_text',
      (c->>'embedding')::vector(768),
      NULLIF(c->>'token_count', '')::int,
      c->'metadata',
      'text-embedding-004'
    FROM jsonb_array_elements(p_chunks) AS c
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM inserted;

  RETURN jsonb_build_object(
    'document_id', v_document_id,
    'chunks_inserted', v_inserted
  );
EXCEPTION WHEN OTHERS THEN
  -- Garante rollback do documento se chunks falharem (a transação já faz isso,
  -- mas re-raise pra edge function ver a mensagem).
  RAISE;
END;
$$;

-- Restringe execução a service_role (a edge function usa service_role key)
REVOKE ALL ON FUNCTION public.kb_ingest_document(jsonb, jsonb, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kb_ingest_document(jsonb, jsonb, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kb_ingest_document(jsonb, jsonb, boolean) TO service_role;