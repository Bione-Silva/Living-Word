CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  desired_handle text;
  final_handle text;
BEGIN
  desired_handle := COALESCE(NEW.raw_user_meta_data->>'blog_handle', NULL);
  
  -- If handle is provided, check for uniqueness and append suffix if needed
  IF desired_handle IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE blog_handle = desired_handle) THEN
      final_handle := desired_handle || '-' || substr(NEW.id::text, 1, 6);
    ELSE
      final_handle := desired_handle;
    END IF;
  ELSE
    final_handle := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, blog_handle, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'language', 'PT')
  );
  RETURN NEW;
END;
$function$