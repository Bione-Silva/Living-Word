-- Analytics table for PWA install card lifecycle
CREATE TABLE IF NOT EXISTS public.pwa_install_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  session_id TEXT NULL,
  event TEXT NOT NULL CHECK (event IN ('shown','clicked','installed','dismissed')),
  variant TEXT NOT NULL DEFAULT 'initial' CHECK (variant IN ('initial','soft_reengagement')),
  platform TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pwa_install_events_event ON public.pwa_install_events(event);
CREATE INDEX IF NOT EXISTS idx_pwa_install_events_user ON public.pwa_install_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pwa_install_events_created_at ON public.pwa_install_events(created_at DESC);

ALTER TABLE public.pwa_install_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) may insert their own event row.
CREATE POLICY "Anyone can log install events"
  ON public.pwa_install_events
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- Users can read their own events.
CREATE POLICY "Users can read own install events"
  ON public.pwa_install_events
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

-- Admins can read everything.
CREATE POLICY "Admins can read all install events"
  ON public.pwa_install_events
  FOR SELECT
  USING (public.is_admin());