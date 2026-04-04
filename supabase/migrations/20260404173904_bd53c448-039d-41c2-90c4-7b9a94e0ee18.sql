
CREATE TABLE public.material_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  material_type TEXT NOT NULL,
  material_title TEXT,
  tool_id TEXT,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.material_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
ON public.material_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON public.material_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Master can view all feedback"
ON public.material_feedback
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'bionicaosilva@gmail.com');
