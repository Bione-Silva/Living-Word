-- 1. Habilitar extensões necessárias para CRON e chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Agendar a geração diária automática do devocional
-- O agendamento roda todos os dias à meia-noite e cinco (UTC)
SELECT cron.schedule(
  'generate-daily-devotional',
  '5 0 * * *',
  $$
  SELECT net.http_post(
      url:='https://priumwdestycikzfcysg.supabase.co/functions/v1/generate-devotional-batch',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
