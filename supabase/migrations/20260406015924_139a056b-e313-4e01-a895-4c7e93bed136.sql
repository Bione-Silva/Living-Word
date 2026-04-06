CREATE OR REPLACE FUNCTION public.get_public_blog_articles(p_handle text)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  cover_image_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  language text,
  passage text,
  article_images jsonb,
  published_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.title,
    m.content,
    m.cover_image_url,
    m.created_at,
    m.updated_at,
    m.language,
    m.passage,
    m.article_images,
    eq.published_at
  FROM public.profiles p
  JOIN public.materials m
    ON m.user_id = p.id
   AND m.type = 'blog_article'
  JOIN public.editorial_queue eq
    ON eq.material_id = m.id
   AND eq.user_id = p.id
   AND eq.status = 'published'
  WHERE p.blog_handle = p_handle
  ORDER BY COALESCE(eq.published_at, m.created_at) DESC, m.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_public_blog_article(p_article_id uuid)
RETURNS TABLE(
  id uuid,
  type text,
  title text,
  content text,
  bible_version text,
  language text,
  passage text,
  article_images jsonb,
  cover_image_url text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone,
  favorite boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.type,
    m.title,
    m.content,
    m.bible_version,
    m.language,
    m.passage,
    m.article_images,
    m.cover_image_url,
    m.updated_at,
    m.created_at,
    m.favorite
  FROM public.materials m
  JOIN public.editorial_queue eq
    ON eq.material_id = m.id
   AND eq.user_id = m.user_id
   AND eq.status = 'published'
  WHERE m.id = p_article_id
    AND m.type = 'blog_article'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_blog_siblings(p_article_id uuid)
RETURNS TABLE(
  id uuid,
  language text,
  title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target_article AS (
    SELECT m.id, m.user_id, m.passage
    FROM public.materials m
    JOIN public.editorial_queue eq
      ON eq.material_id = m.id
     AND eq.user_id = m.user_id
     AND eq.status = 'published'
    WHERE m.id = p_article_id
      AND m.type = 'blog_article'
    LIMIT 1
  )
  SELECT
    m.id,
    m.language,
    m.title
  FROM target_article ta
  JOIN public.materials m
    ON m.user_id = ta.user_id
   AND m.type = 'blog_article'
   AND m.id <> ta.id
   AND COALESCE(m.passage, '') = COALESCE(ta.passage, '')
  JOIN public.editorial_queue eq
    ON eq.material_id = m.id
   AND eq.user_id = m.user_id
   AND eq.status = 'published'
  ORDER BY m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_blog_articles(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_blog_article(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_blog_siblings(uuid) TO anon, authenticated;