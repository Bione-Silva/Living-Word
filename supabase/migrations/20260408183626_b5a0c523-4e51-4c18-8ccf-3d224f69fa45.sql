
CREATE TABLE public.reading_plan_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  day_number integer NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id, day_number)
);

ALTER TABLE public.reading_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading progress"
  ON public.reading_plan_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress"
  ON public.reading_plan_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress"
  ON public.reading_plan_progress FOR DELETE
  USING (auth.uid() = user_id);
