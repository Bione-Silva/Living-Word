# Living Word — Guia de Integração para o Lovable

## 🔑 Credenciais Completas

### Supabase (Cole em Settings > Supabase no Lovable)

| Campo | Valor |
|---|---|
| **Project ID** | `priumwdestycikzfcysg` |
| **Project URL** | `https://priumwdestycikzfcysg.supabase.co` |
| **Anon Key (publishable)** | `sb_publishable_4rbffmxsDVKYaJDiA85K3Q_1QBzi3gI` |
| **Service Role Key** | `cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw==` |
| **Access Token** | `sbp_731e6b92e13d0842c91aca79821b39489a176e93` |

> ⚠️ **NUNCA exponha a Service Role Key** no frontend. Use apenas a Anon Key no Lovable.
> A Service Role Key é usada APENAS nas Edge Functions (server-side).

### GitHub

| Campo | Valor |
|---|---|
| **Repositório** | `https://github.com/Bione-Silva/Living-Word.git` |
| **Conta** | `bionicaosilva@gmail.com` |
| **Branch principal** | `main` |

No Lovable, vá em **Settings > GitHub** e conecte ao repositório `Bione-Silva/Living-Word`.

### No Lovable, configure:
1. **Settings > Supabase** → Cole a **Project URL** e a **Anon Key**
2. **Settings > GitHub** → Conecte ao repositório `Bione-Silva/Living-Word`

---

## Tabelas Disponíveis no Banco

| Tabela | Função | RLS |
|---|---|---|
| `users` | Perfil do usuário + plano + contador de gerações | ✅ auth.uid() = id |
| `user_editorial_profile` | Preferências editoriais e sites WordPress | ✅ auth.uid() = user_id |
| `materials` | Conteúdo gerado (sermões, esboços, artigos) | ✅ auth.uid() = user_id |
| `editorial_queue` | Fila de publicação WordPress | ✅ auth.uid() = user_id |
| `series` | Séries de pregação | ✅ auth.uid() = user_id |
| `library_tags` | Tags e favoritos | ✅ auth.uid() = user_id |
| `generation_logs` | Logs de custo e tokens (billing) | ✅ auth.uid() = user_id |
| `conversion_events` | Eventos de conversão Free → Pago | ✅ select by user_id |
| `admin_cost_snapshot` | Snapshots diários (admin only) | 🔒 service_role |

---

## Edge Functions (Endpoints para o Lovable Chamar)

### 1. Gerar Material Pastoral (Frente A)
```
POST https://priumwdestycikzfcysg.supabase.co/functions/v1/generate-pastoral-material
Authorization: Bearer <user_jwt>

Body:
{
  "bible_passage": "João 15:1-8",
  "audience": "Imigrantes brasileiros",
  "pain_point": "Solidão, saudade de casa",
  "language": "PT",
  "bible_version": "ARA",
  "output_modes": ["sermon", "outline", "devotional"]
}
```

**Response inclui:**
- `outputs` (objeto com cada formato)
- `blocked_formats` (formatos bloqueados pra usuário free)
- `generations_remaining` (quantas gerações restam)
- `upgrade_hint` (mensagem de upgrade se geração ≥ 4/5)

### 2. Gerar Artigo de Blog (Frente B)
```
POST https://priumwdestycikzfcysg.supabase.co/functions/v1/generate-blog-article
Authorization: Bearer <user_jwt>

Body:
{
  "bible_passage": "Mateus 5:13-16",
  "audience": "Imigrantes brasileiros",
  "category": "immigrant",
  "language": "PT",
  "bible_version": "ARA",
  "target_length": "medium"
}
```

### 3. Buscar Versículo (interno, para teste)
```
POST https://priumwdestycikzfcysg.supabase.co/functions/v1/fetch-bible-verse

Body:
{
  "passage": "João 3:16",
  "version": "ARA",
  "language": "PT"
}
```

---

## Componentes Lovable que Precisam Ser Criados

Esses componentes estão definidos na Conversion Strategy:

### `<GenerationCounter />`
- Barra de progresso no header do Estúdio
- Lê `user.generation_count_month` e compara com `PLAN_LIMITS[plan]`
- Verde → Amarelo → Vermelho (threshold: 4/5 pra free)
- Na geração 4/5: exibir copy do Gatilho 1

### `<LockedTab />`
- Tabs de Reels, Bilíngue e Célula com ícone de cadeado
- `blocked_formats` da response indica quais travar
- Ao clicar: drawer lateral com preview + CTA trial

### `<VoiceSelector />`
- Select com vozes pastorais
- Free: apenas "Acolhedor" (welcoming)
- Demais com badge "Pastoral 🔒"
- Ao selecionar bloqueado: mini-card + CTA

### `<UpgradeModal />`
- Props: `trigger` (qual gatilho ativou), `userType`
- CTA principal: "7 dias grátis, sem cartão"
- Guardar em sessionStorage qual gatilho já foi exibido (Regra 3: um por sessão)

### `<LibraryItem locked />`
- Card desfocado + overlay com cadeado
- Ativa quando library > 10 itens para free

---

## Regras de UX para o Lovable (Regras de Ouro da Conversion Strategy)

1. **Nunca bloquear a geração — bloquear o formato**
2. **Mostrar o bloqueado, nunca esconder** (tabs com cadeado)
3. **Um gatilho por sessão — nunca empilhar**
4. **Nunca usar culpa — usar contexto pastoral**
5. **Trial de 7 dias sem cartão como CTA principal**
6. **Pitch personalizado por perfil** (pastor/influencer/líder)
