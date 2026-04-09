# Palavra Viva — Skills + Edge Functions
## Deploy Guide para Antigravity + Supabase

---

## ESTRUTURA DE ARQUIVOS

```
palavra-viva-skills/
├── individual/
│   └── SKILL.md              ← skill para Antigravity (devocional individual)
├── celula/
│   └── SKILL.md              ← skill para Antigravity (grupo pequeno)
├── classe/
│   └── SKILL.md              ← skill para Antigravity (classe bíblica)
├── discipulado/
│   └── SKILL.md              ← skill para Antigravity (discipulado 1-a-1)
├── sermao/
│   └── SKILL.md              ← skill para Antigravity (base de sermão)
└── supabase/functions/
    ├── generate-study-individual/index.ts
    ├── generate-study-celula/index.ts
    ├── generate-study-classe/index.ts
    ├── generate-study-discipulado/index.ts
    └── generate-study-sermao/index.ts
```

---

## 1. DEPLOY DAS EDGE FUNCTIONS NO SUPABASE

### Pré-requisito: Supabase CLI instalado
```bash
npm install -g supabase
supabase login
```

### Deploy de todas as funções de uma vez
```bash
# Na raiz do projeto
supabase functions deploy generate-study-individual
supabase functions deploy generate-study-celula
supabase functions deploy generate-study-classe
supabase functions deploy generate-study-discipulado
supabase functions deploy generate-study-sermao
```

### Configurar a ANTHROPIC_API_KEY como secret
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

---

## 2. ENDPOINTS APÓS DEPLOY

| Função | Endpoint |
|---|---|
| Individual | `POST https://{project}.supabase.co/functions/v1/generate-study-individual` |
| Célula | `POST https://{project}.supabase.co/functions/v1/generate-study-celula` |
| Classe | `POST https://{project}.supabase.co/functions/v1/generate-study-classe` |
| Discipulado | `POST https://{project}.supabase.co/functions/v1/generate-study-discipulado` |
| Sermão | `POST https://{project}.supabase.co/functions/v1/generate-study-sermao` |

---

## 3. PAYLOADS DE EXEMPLO

### Individual
```json
POST /generate-study-individual
{
  "referencia": "João 3:1-21",
  "versao": "NVI",
  "idioma": "pt-BR"
}
```

### Célula
```json
POST /generate-study-celula
{
  "referencia": "Salmos 23",
  "versao": "NVI",
  "nivel_grupo": "intermediario",
  "tamanho_grupo": 10
}
```
`nivel_grupo`: `iniciante` | `intermediario` | `maduro`

### Classe
```json
POST /generate-study-classe
{
  "referencia": "Romanos 8:1-17",
  "versao": "ARA",
  "serie": "Vida no Espírito",
  "numero_aula": 3
}
```

### Discipulado
```json
POST /generate-study-discipulado
{
  "referencia": "Tiago 1:2-18",
  "versao": "NVI",
  "nome_discipulo": "Carlos",
  "estagio": "crescendo",
  "area_foco": "fé nas tribulações"
}
```
`estagio`: `novo_crente` | `crescendo` | `maduro`
`nome_discipulo` e `area_foco` são opcionais.

### Sermão
```json
POST /generate-study-sermao
{
  "referencia": "Efésios 2:1-10",
  "versao": "ARA",
  "tema_central": "graça soberana",
  "audiencia": "congregação adulta",
  "duracao_sermao_min": 40
}
```
`tema_central` e `audiencia` são opcionais.

---

## 4. RESPONSE PADRÃO

Todas as funções retornam:
```json
{
  "tipo": "individual | celula | classe | discipulado | sermao",
  "referencia": "João 3:1-21",
  "versao": "NVI",
  "conteudo": "## 🙏 ANTES DE COMEÇAR\n...",
  "gerado_em": "2026-04-05T14:00:00.000Z"
}
```

O campo `conteudo` é Markdown formatado, pronto para renderizar no frontend.

---

## 5. USO NO ANTIGRAVITY

Cada `SKILL.md` é carregado como contexto de sistema para o Antigravity.
O Antigravity injeta o conteúdo do SKILL no início de cada sessão de geração.

### Exemplo de uso no Antigravity:
```
[Carrega individual/SKILL.md como system prompt]
Usuário: Gere estudo de João 3:1-21, versão NVI
```

### Alternativa: chamar a Edge Function diretamente do Antigravity
```
POST https://{project}.supabase.co/functions/v1/generate-study-individual
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/json
{"referencia": "João 3:1-21", "versao": "NVI"}
```

---

## 6. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

| Variável | Onde configurar | Valor |
|---|---|---|
| `ANTHROPIC_API_KEY` | Supabase Secrets | `sk-ant-...` |

---

## 7. SCHEMA SQL OPCIONAL — salvar estudos gerados

Execute no Supabase SQL Editor se quiser persistir os estudos:

```sql
CREATE TABLE IF NOT EXISTS generated_studies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('individual','celula','classe','discipulado','sermao')),
  referencia TEXT NOT NULL,
  versao TEXT NOT NULL DEFAULT 'NVI',
  parametros JSONB,
  conteudo TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  favorito BOOLEAN DEFAULT FALSE
);

-- RLS básico
ALTER TABLE generated_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuário vê seus próprios estudos"
  ON generated_studies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuário cria seus próprios estudos"
  ON generated_studies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_studies_user_tipo ON generated_studies(user_id, tipo);
CREATE INDEX idx_studies_referencia ON generated_studies(referencia);
```

Para salvar após gerar, adicione ao final de cada Edge Function:
```typescript
// Após obter `content`, salve no Supabase se user_id disponível
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// INSERT INTO generated_studies ...
```

---

## 8. NOTAS DE SEGURANÇA

- `ANTHROPIC_API_KEY` via Supabase Secrets — NUNCA no código
- `SUPABASE_SERVICE_ROLE_KEY` NUNCA exposta no frontend
- As functions usam `SUPABASE_ANON_KEY` para chamadas autenticadas via JWT
- RLS garante isolamento entre usuários se persistência for ativada
