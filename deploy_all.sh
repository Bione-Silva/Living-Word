#!/bin/bash
echo "Deploying Supabase Edge Functions for E.X.P.O.S. Theological Framework..."

export SUPABASE_ACCESS_TOKEN="sbp_bd979c82ed5d77faeefe54d4f830aa20788bb76e"

echo "Deploying generate-pastoral-material..."
supabase functions deploy generate-pastoral-material --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "Deploying expos-celula..."
supabase functions deploy expos-celula --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "Deploying expos-classe..."
supabase functions deploy expos-classe --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "Deploying expos-discipulado..."
supabase functions deploy expos-discipulado --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "Deploying expos-individual..."
supabase functions deploy expos-individual --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "Deploying expos-sermao..."
supabase functions deploy expos-sermao --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "Deploying generate-biblical-study..."
supabase functions deploy generate-biblical-study --project-ref priumwdestycikzfcysg --no-verify-jwt

echo "All deployments completed!"
