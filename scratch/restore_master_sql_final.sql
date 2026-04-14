-- Execute from Supabase Dashboard -> SQL Editor

-- 1. Resetar a senha na tabela de autenticação
UPDATE auth.users
SET encrypted_password = crypt('LivingWord2026!', gen_salt('bf'))
WHERE email LIKE '%severinobione%' OR email LIKE '%bx%' OR email LIKE '%bionic%';

-- 2. Garantir o Plano Pastor Pro na tabela 'users' (pública)
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email LIKE '%severinobione%' OR email LIKE '%bx%' OR email LIKE '%bionic%'
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        UPDATE public.users 
        SET plan = 'pastor_pro' 
        WHERE id = target_user_id;

        IF NOT FOUND THEN
            INSERT INTO public.users (id, email, plan, language_preference)
            VALUES (
                target_user_id, 
                (SELECT email FROM auth.users WHERE id = target_user_id), 
                'pastor_pro', 
                'PT'
            );
        END IF;
    END IF;
END $$;
