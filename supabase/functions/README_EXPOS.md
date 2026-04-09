# E.X.P.O.S. - Supabase Edge Functions

Este diretório contém a infraestrutura de backend para o gerador de estudos baseados no método indutivo E.X.P.O.S.
As funções são escritas em TypeScript/Deno e se comunicam nativamente via HTTP com a API da Anthropic (Claude 3 Opus) garantindo alto rigor teológico e exegético.

## Módulos Disponíveis
Temos 5 endpoints especialistas, cada um com um system prompt cirurgicamente adaptado para o formato do estudo:
- `/expos-individual`: Devocionais diretos, baseados na primeira pessoa.
- `/expos-celula`: Estudos focados na facilitação e discussão em pequenos grupos.
- `/expos-classe`: Ensino escolar profundo, teologia canônica e palavras originais.
- `/expos-discipulado`: Foco em arrependimento, confissão cruz e prestação de contas 1a1.
- `/expos-sermao`: Esboços homiléticos em tensão e resolução (método Haddon Robinson).

## 🚀 Como Realizar o Deploy

### 1. Configurar o Supabase Secret
Antes do deploy, as funções EXIGEM a chave de API da Anthropic.
\`\`\`bash
supabase secrets set ANTHROPIC_API_KEY="sk-ant-SUA_CHAVE_AQUI"
\`\`\`

### 2. Rodar o Deploy de todas as Funções
\`\`\`bash
supabase functions deploy expos-individual
supabase functions deploy expos-celula
supabase functions deploy expos-classe
supabase functions deploy expos-discipulado
supabase functions deploy expos-sermao
\`\`\`

## 🧪 Payload de Exemplo (Testando via cURL)

\`\`\`bash
curl -i --location --request POST 'https://[SEU_PROJETO].supabase.co/functions/v1/expos-sermao' \
  --header 'Authorization: Bearer [SUA_ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "passagem": "Romanos 8:1-4",
    "idioma": "pt-BR"
  }'
\`\`\`

## 🗄 Persistência Opcional
Se você quiser salvar o resultado da geração, rodar a migration SQL (ex: `009_expos_studies_persistence.sql`) criará a tabela \`expos_studies\` com segurança baseada em Row Level Security (RLS). O próprio frontend poderá gravar a resposta recebida pela função caso o usuário decida favoritar o estudo.
