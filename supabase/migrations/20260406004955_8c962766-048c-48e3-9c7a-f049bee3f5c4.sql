-- Add INSERT policy so only the owning user can create their profile row
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);