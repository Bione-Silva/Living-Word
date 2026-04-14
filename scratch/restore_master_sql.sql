-- Execute from Supabase Dashboard -> SQL Editor

-- 1. Reset user password (garante que consiga logar)
UPDATE auth.users
SET encrypted_password = crypt('LivingWord2026!', gen_salt('bf'))
WHERE email LIKE '%severinobione%' OR email LIKE '%bx%' OR email LIKE '%bionic%';

-- 2. Garantir o Plano Pastor Pro (Corrigido para coluna 'plan' e removido full_name)
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Procurar o ID do usuário
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email LIKE '%severinobione%' OR email LIKE '%bx%' OR email LIKE '%bionic%'
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Atualizar o plano se o perfil já existir
        UPDATE public.profiles 
        SET plan = 'pastor_pro' 
        WHERE id = target_user_id;

        -- Se por acaso não existir, ele faz um insert seguro apenas com o plano
        IF NOT FOUND THEN
            INSERT INTO public.profiles (id, plan)
            VALUES (target_user_id, 'pastor_pro');
        END IF;

        RAISE NOTICE 'SUCCESS: Profile updated to Pastor Pro for user %', target_user_id;
    ELSE
        RAISE NOTICE 'USER NOT FOUND: Could not find user with matching email.';
    END IF;
END $$;
