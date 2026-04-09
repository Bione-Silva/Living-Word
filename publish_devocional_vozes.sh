#!/bin/bash
echo "🚀 Publicando atualização das 3 Vozes do Devocional na plataforma..."

export SUPABASE_ACCESS_TOKEN="sbp_bd979c82ed5d77faeefe54d4f830aa20788bb76e"
export PROJECT_REF="priumwdestycikzfcysg"

echo "1. Empurrando a nova migration de banco de dados..."
supabase db push

echo "2. Realizando o Deploy da Edge Function (generate-devotional-batch)..."
supabase functions deploy generate-devotional-batch --project-ref $PROJECT_REF --no-verify-jwt

echo "✅ Atualização concluída com sucesso no Backend!"
echo "➡️ Agora copie o conteúdo de LOVABLE_PROMPT_DEVOCIONAL.md e adicione ao Lovable para atualizar o player de áudio na interface!"
