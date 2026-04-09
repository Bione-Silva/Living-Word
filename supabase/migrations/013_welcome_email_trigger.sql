-- 013_welcome_email_trigger.sql
-- Este arquivo configura um Webhook no Banco de Dados para chamar a Edge Function do Brevo
-- Toda vez que um novo registro for inserido na tabela 'profiles', ele manda um POST para a Edge Function.

-- 1. Habilitando a extensão de rede local do Postgres (pg_net) caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Criando o Webhook customizado (uma função do banco)
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS trigger AS $$
DECLARE
  edge_function_url TEXT := current_setting('custom.app_url', true) || '/functions/v1/send-welcome-email';
  anon_key TEXT := current_setting('custom.anon_key', true);
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Montar o payload no formato parecido com o webhook
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  -- Disparar a chamada HTTP POST assíncrona usando pg_net
  SELECT net.http_post(
      url:='https://priumwdestycikzfcysg.supabase.co/functions/v1/send-welcome-email',
      body:=payload,
      headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
      )
  ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar a Trigger na tabela profiles
DROP TRIGGER IF EXISTS on_profile_created_send_email ON public.profiles;
CREATE TRIGGER on_profile_created_send_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_welcome_email();
