# LIVING WORD — Estratégia de Conversão Free → Pago
## Documento de produto · Abril 2026

---

## PRINCÍPIO CENTRAL

O plano Free entrega valor real suficiente para criar hábito.
Mas as três dores que o usuário mais quer resolver ficam deliberadamente no pago:
- **Publicar mais** (volume e agendamento)
- **Qualidade superior** (todos os formatos, todas as versões bíblicas)
- **Voz personalizada** (estilo pastoral que é dele, não genérico)

O free não é uma versão ruim do produto. É uma versão incompleta de propósito.

---

## O QUE FICA NO FREE

| Feature | Limite | Por que este limite |
|---|---|---|
| Gerações/mês | 5 | 1 por domingo — chega à 4ª semana sem geração |
| Formatos pastorais | Sermão + esboço + devocional | Reels, bilíngue, célula bloqueados mas visíveis |
| Artigos de blog | 1/mês | Suficiente para provar o valor, insuficiente para consistência |
| Voz pastoral | Apenas "Acolhedor" | Pastor expositivo fica frustrado — gatilho de identidade |
| Versão bíblica | ARA (PT) · KJV (EN) · RVR60 (ES) | NVI, ESV, NVI-ES bloqueadas |
| Biblioteca | Últimos 10 materiais | 11º arquiva o mais antigo (visível mas bloqueado) |
| Watermark | "Gerado com Living Word" em todo conteúdo publicado | Incômodo profissional real |
| Sites WordPress | Nenhum — apenas subdomínio livingword.app | Não pode conectar domínio próprio |
| Agendamento | Não disponível | Vê o calendário editorial mas não agenda |

---

## O QUE ABRE NO PASTORAL ($9/MÊS)

| Feature | O que muda |
|---|---|
| 40 gerações/mês | Cadência semanal confortável — 1/dia |
| Todos os 7 formatos | Reels, bilíngue, célula destravados |
| 20 artigos de blog/mês | Consistência editorial real |
| Agendamento | Calendário editorial ativo |
| Todas as vozes pastorais | Expositivo, narrativo, apologético, profético |
| Todas as versões bíblicas | NVI-PT, NVI-ES, ESV, NLT, NIV |
| Biblioteca ilimitada | Todo histórico acessível |
| Sem watermark | Conteúdo 100% assinado pelo usuário |
| 1 site WordPress conectado | Subdomínio personalizado ou domínio próprio |

---

## 7 GATILHOS DE UPGRADE — QUANDO E COMO MOSTRAR

### Gatilho 1 — Geração 4 de 5 (urgência temporal)
**Quando:** usuário usa a 4ª geração do mês
**Onde:** barra de progresso inline no topo do Estúdio — não modal
**Tom:** contexto pastoral, não comercial
**Copy:**
> "Você usou 4 das suas 5 gerações este mês. Ainda tem um domingo pela frente? Pastoral por $9/mês garante 40 gerações."

**Por que funciona:** a escassez não é artificial — é o ciclo real de pregação. O pastor sabe que prega toda semana.

---

### Gatilho 2 — Clique em formato bloqueado (desejo)
**Quando:** usuário clica nos tabs de Reels, Bilíngue ou Célula
**Onde:** drawer lateral que abre com preview do que seria gerado
**Tom:** "veja o que você teria"
**Copy:**
> "Este seria o conteúdo para Reels gerado a partir da sua passagem. Desbloqueie no Pastoral — $9/mês."

**Implementação:** os tabs aparecem na interface com ícone de cadeado. Nunca esconder — sempre mostrar e bloquear. Ver o conteúdo que quase teve aumenta 3× o desejo de pagar.

---

### Gatilho 3 — Tentativa de mudar a voz pastoral (identidade)
**Quando:** usuário abre configurações avançadas e tenta selecionar "Expositivo", "Narrativo" ou outro estilo
**Onde:** select com badges "Pastoral" nas options bloqueadas — ao clicar, mini-card explicativo aparece abaixo
**Tom:** personalização e identidade, não produto
**Copy:**
> "No Pastoral, seu conteúdo é gerado com sua voz expositiva — não um template genérico. É sua pregação, no seu estilo."

**Por que este é o mais forte dos três:** mexe com identidade pastoral. O pastor que prega de forma expositiva desde sempre não quer parecer que pregou com voz de outro.

---

### Gatilho 4 — 2º artigo de blog no mês (volume)
**Quando:** tenta gerar o 2º artigo do mês
**Onde:** o sistema deixa completar a geração, mas exibe banner no topo do artigo
**Tom:** valor entregue + o que vem depois
**Copy:**
> "Seu artigo foi gerado e salvo como rascunho. Para publicar e gerar os próximos 19, o Pastoral libera 20 artigos/mês com agendamento."

**Importante:** nunca bloquear a geração em si — sempre entregar o conteúdo, depois mostrar o limite.

---

### Gatilho 5 — Watermark no blog ao vivo (vergonha profissional)
**Quando:** usuário visita o próprio blog e volta ao dashboard (detectar via referrer ou comportamento)
**Onde:** card sutil no dashboard — não notificação push
**Tom:** profissionalismo, não culpa
**Copy:**
> "Seus leitores estão vendo o rodapé 'Gerado com Living Word' nos seus artigos. No Pastoral, o conteúdo é 100% assinado por você."

---

### Gatilho 6 — 11º material na biblioteca (perda)
**Quando:** usuário salva o 11º material
**Onde:** notificação inline na biblioteca, material mais antigo aparece desfocado com cadeado
**Tom:** perda de algo que já foi dele
**Copy:**
> "Seu sermão de 3 semanas atrás foi arquivado. No Pastoral, sua biblioteca é ilimitada — você nunca perde um material gerado."

**Por que funciona:** gatilho de perda é mais forte que gatilho de ganho. O usuário já investiu tempo naquele conteúdo.

---

### Gatilho 7 — Email dia 25 do mês (reativação)
**Quando:** dia 25 de cada mês, para usuários free que usaram ≥ 3 gerações
**Canal:** email (Resend/SendGrid)
**Tom:** resumo do ministério + o que ficou na mesa
**Estrutura do email:**
```
Assunto: Você pregou 3 vezes este mês com Living Word

Corpo:
[Nome], este mês você usou o Living Word para preparar 3 pregações.

O que você gerou:
✓ 3 sermões
✓ 3 esboços
✓ 2 devocionais

O que ficou bloqueado:
✗ 9 formatos de Reels (você tem 180 seguidores esperando)
✗ Versão bilíngue — sua congregação fala inglês também
✗ 4 artigos de blog que você poderia ter publicado

Você ainda tem mais de 1 domingo este mês.
Por $9 você garante os próximos 35 gerações.

[Começar Pastoral — 7 dias grátis]
```

---

## REGRAS DE UX — NÃO PARECER AGRESSIVO

**Regra 1: Nunca bloquear a geração — bloquear o formato**
O usuário sempre consegue gerar sermão e esboço. O que bloqueia são os formatos extras. Ele sai com valor, mas querendo mais.

**Regra 2: Mostrar o bloqueado, nunca esconder**
Tabs de Reels e Bilíngue aparecem na interface com cadeado. O usuário vê o que existe — não descobre só depois de pagar.

**Regra 3: Um gatilho por sessão — nunca empilhar**
Se o usuário já viu o aviso de limite nesta sessão, não mostrar o de biblioteca. Guardar no estado local qual gatilho foi exibido na sessão atual.

**Regra 4: Nunca usar culpa — usar contexto pastoral**
Não: "Você ainda não assinou."
Sim: "Você ainda tem 2 domingos este mês."
O frame é sempre a missão e o ministério, nunca o produto.

**Regra 5: Trial de 7 dias sem cartão como CTA principal**
O botão principal de upgrade sempre oferece "7 dias grátis, sem cartão de crédito". Remove o atrito máximo. Coleta cartão só no 8º dia via Stripe. Taxa de ativação de trial é 3–5× maior que upgrade direto.

**Regra 6: Pitch personalizado por perfil**
O modal de upgrade muda o texto por tipo de usuário (detectado pelo padrão de uso):
- **Pastor (gera sermões):** "Gere seu sermão expositivo de domingo — do jeito que você prega."
- **Influencer (usa Reels/blog):** "Publique 5 devocionais por semana no seu blog com sua voz."
- **Líder de célula:** "Prepare sua célula toda semana com uma adaptação personalizada."

---

## JORNADA DO USUÁRIO FREE — LINHA DO TEMPO

```
Dia 0    → Cadastro. Blog no ar. 2 artigos publicados. 5 gerações disponíveis.
           [Aha moment — valor antes de qualquer esforço]

Dia 2–5  → Primeira geração própria. Vê tabs bloqueados.
           [Gatilho 2 ativo — desejo semeado]

Dia 7–14 → Tenta mudar voz pastoral para "Expositivo". Bloqueado.
           [Gatilho 3 — maior intenção de upgrade — mexe com identidade]

Dia 20   → Geração 4 de 5. Barra vermelha. Tem mais 1 domingo.
           [Gatilho 1 — conversão mais alta aqui — urgência real]

Dia 25   → Email com resumo do mês e o que ficou na mesa.
           [Gatilho 7 — captura quem resistiu até aqui]

Mês 2    → Se ainda free: biblioteca começa a arquivar materiais.
           [Gatilho 6 — perda de algo já investido — conversão no mês 2]
```

---

## IMPLEMENTAÇÃO — COMPONENTES LOVABLE

### `<GenerationCounter />` (header do Estúdio)
```
Estado: 0/5 → 5/5 (barra verde → amarela → vermelha)
Threshold: vermelho em 4/5
Ao atingir 4/5: exibir inline copy do Gatilho 1
Ao atingir 5/5: botão de geração desabilitado + CTA trial
```

### `<LockedTab />` (nos outputs)
```
Props: label, previewContent (gerado junto mas não exibido)
Comportamento: tab com ícone cadeado + badge "Pastoral"
Ao clicar: drawer lateral com previewContent + CTA
```

### `<VoiceSelector />` (configurações avançadas)
```
Options: welcoming (free) | expository (🔒) | narrative (🔒) | apologetic (🔒) | prophetic (🔒)
Ao selecionar bloqueado: mini-card com explicação + CTA inline
```

### `<UpgradeModal />` (chamado por todos os gatilhos)
```
Props: trigger (string — qual gatilho ativou), userType (pastor|influencer|leader)
Conteúdo: pitch personalizado por userType + CTA "7 dias grátis, sem cartão"
Comportamento: guardar em sessionStorage qual gatilho foi exibido (não empilhar)
```

### `<LibraryItem locked />` (biblioteca)
```
Props: locked (boolean)
Quando locked: card desfocado + overlay com cadeado + "Arquivado — desbloqueie no Pastoral"
```

---

## MÉTRICAS DE CONVERSÃO A MONITORAR

| Métrica | Meta | Fonte |
|---|---|---|
| Taxa conversão Free → Trial | ≥ 8% | Stripe |
| Taxa Trial → Pastoral pago | ≥ 60% | Stripe |
| Taxa conversão Free → Pastoral (geral) | ≥ 5% | Stripe |
| Gatilho com maior conversão | A medir no beta | Supabase events |
| Dia médio de conversão | ≤ 20 dias | Stripe + created_at |
| Churn Pastoral mês 2 | ≤ 15% | Stripe |

---

## EVENTOS A REGISTRAR NO SUPABASE (analytics)

```sql
-- Tabela de eventos de conversão
conversion_events (
  id UUID,
  user_id UUID,
  event_type TEXT, -- 'upgrade_cta_shown' | 'upgrade_cta_clicked' | 'trial_started' | 'plan_upgraded'
  trigger_name TEXT, -- 'generation_4of5' | 'locked_tab_click' | 'voice_blocked' | etc.
  user_type TEXT, -- 'pastor' | 'influencer' | 'leader'
  plan_from TEXT,
  plan_to TEXT,
  created_at TIMESTAMPTZ
)
```

Esses eventos alimentam o painel admin com funil de conversão real: quantos usuários viram cada gatilho, quantos clicaram, quantos converteram.

---

*Estratégia de conversão v1.0 — Living Word · Abril 2026*
*Próximos passos: implementar GenerationCounter e LockedTab no Lovable · configurar emails automáticos via Resend*
