const fs = require('fs');
const path = require('path');

const vaultDir = '/Users/severinobione/Documents/Centro de Comando/01_LivingWord';

const tarefasPath = path.join(vaultDir, '01.12_Tarefas.md');
const mktPath = path.join(vaultDir, '01.2_Marketing.md');
const vendasPath = path.join(vaultDir, '01.3_Vendas.md');
const produtoPath = path.join(vaultDir, '01.1_Produto.md');
const tiPath = path.join(vaultDir, '01.6_TI_Infraestrutura.md');

// 01.12 Tarefas
fs.writeFileSync(tarefasPath, `---
tags: [submodulo, tarefas]
---
# 01.12 Tarefas (Living Word)

- Subordinado a: [[01_Projeto_LivingWord]]

> [!todo] Backlog Ativo da Sprint
> - [x] Reestruturar Cérebro Viso-Espacial no Obsidian (Projeto Bione Comando)
> - [ ] Passar QA no Checkout do App Palavra Viva
> - [ ] Concluir briefing visual da Launch Page

## 📌 Alertas Críticos (Prazos)
- Nenhum alerta vermelho hoje.`);

// 01.2 Marketing
fs.writeFileSync(mktPath, `---
tags: [submodulo, marketing]
---
# 01.2 Marketing

- Subordinado a: [[01_Projeto_LivingWord]]

> [!info] Central de Mídia e Audiência
> Aqui consolidamos todas as estratégias de Aquisição e Branding do Living Word.

## 📖 Base de Inteligência (Embedded)
*Ao rolar abaixo, você lerá a pesquisa completa sem sair dessa nota:*
![[Pesquisa_Estrategica_LivingWord.pdf]]

## 🎯 Estratégia Atual
* [LIVINGWORD_LP_BRIEFing] em finalização na IDE.
* Campanha de Captação PWA Híbrido.`);

// 01.3 Vendas
fs.writeFileSync(vendasPath, `---
tags: [submodulo, vendas]
---
# 01.3 Vendas

- Subordinado a: [[01_Projeto_LivingWord]]

> [!info] Estratégia de Captação Institucional e Expansão

## 📖 Dossiê de Mercado (North Atlanta - Embedded)
![[Inteligência_de_Mercado_Estratégia_de_Vendas_North_Atlanta.pdf]]

## 💰 Projeções e Fechamentos
- Meta de Onboarding Mensal: 10 Igrejas
- Receita Recorrente Alvo: $15.000
- [[01.3.1_Pricing_Creditos]]`);

// 01.1 Produto
fs.writeFileSync(produtoPath, `---
tags: [submodulo, produto]
---
# 01.1 Produto

- Subordinado a: [[01_Projeto_LivingWord]]

> [!abstract] Matriz do Palavra Viva
> Hub central da arquitetura das features da plataforma. 

## ⚙️ Mapeamento de Funcionalidades
Acesse os Módulos Independentes:
1. [[01.1.1_Modulo_Sermoes]]
2. [[01.1.2_Modulo_EstudoBiblico]]
3. [[01.1.3_Modulo_Devocional]]
4. [[01.1.4_Modulo_SocialStudio]]
5. [[01.1.5_Modulo_TrilhasDaPalavra]]
6. [[01.1.6_App_Mobile_PWA]]

## 📈 Status Atual
Plataforma 100% verde para Lançamento (Fase de Testes de QA).`);

// 01.6 TI Infraestrutura
fs.writeFileSync(tiPath, `---
tags: [submodulo, ti_infraestrutura]
---
# 01.6 TI Infraestrutura

- Subordinado a: [[01_Projeto_LivingWord]]

> [!note] Tech Stack
> Next.js, Supabase, Tailwind, Gemini AI, Stripe. 

## 🔗 Serviços Ativos
- **Banco de Dados (Supabase)**: Edge Functions otimizadas para IA.
- **Frontend (Vercel)**: PWA híbrido responsivo.
- **Integração Biomax**: Webhooks N8N ativos aguardando disparos.

*Obs: Código fonte protegido na IDE local (VSCode/Cursor). Nenhuma poluição visual será trazida para o Obsidian.*`);

console.log("Nodes populados com conteúdo enriquecido!");
