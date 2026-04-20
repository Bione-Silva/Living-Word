CREATE TABLE IF NOT EXISTS public.drip_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  template_name text NOT NULL,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_drip_schedule_pending
  ON public.drip_schedule (send_at)
  WHERE status = 'pending';

ALTER TABLE public.drip_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drip schedule"
  ON public.drip_schedule FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.welcome_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_type)
);

ALTER TABLE public.welcome_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own welcome log"
  ON public.welcome_email_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());