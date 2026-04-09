
-- Fix the security definer view warning by setting security_invoker
DROP VIEW IF EXISTS public.published_queue_public;

CREATE VIEW public.published_queue_public
WITH (security_invoker = true)
AS
SELECT id, material_id, status, published_at, scheduled_at, created_at
FROM public.editorial_queue
WHERE status = 'published';
