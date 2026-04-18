-- Per-user "read" state for notifications shown in the in-app bell.
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES public.notification_queue(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS notification_reads_user_idx
  ON public.notification_reads (user_id, notification_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reads"
  ON public.notification_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reads"
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reads"
  ON public.notification_reads FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime so the unread badge updates instantly across devices.
ALTER TABLE public.notification_reads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_reads;