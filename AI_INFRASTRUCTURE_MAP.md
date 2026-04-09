# MAPA DE TOPOLOGIA E INFRAESTRUTURA DE IA

Este documento mapeia todas as integrações de Inteligência Artificial do ecossistema Living Word. Ele serve como o registro unificado ("Single Source of Truth") para auditoria de custos, roteamento de Edge Functions e configuração do Painel Administrativo.

---

## 1. Módulos Core (Motor Teológico e Pastoral)

### A. generate-pastoral-material (Estúdio Pastoral)
- **Modelos Utilizados:**
  - `gpt-4o` (Premium Users / Assinantes)
  - `gemini-2.5-flash` (Free Tier)
    - *Rationale:* Substituição estratégica do antigo GPT-4o-mini para maximizar lucro. Custos muito menores mantendo velocidade superior.
- **Função:** Geração multimodal de sermões, esboços, devocionais, posts bilingues.
- **RAG (Retrieval-Augmented Generation):** Sim. Consulta comentários bíblicos via banco vetorial nativo do Supabase (`pgvector`).
- **DNA Injection:** Usa o módulo `mentes_dna.ts` para injetar a personalidade de mentores como Tiago Brunet, Marco Feliciano, C.H. Spurgeon e Billy Graham.

### B. generate-biblical-study (Estudo Bíblico Dinâmico)
- **Modelos Utilizados:**
  - `gemini-2.5-flash` (Níveis Básico e Intermediário)
  - `gpt-4o` (Nível Avançado)
- **Função:** Produz estudos bíblicos altamente estruturados (exegese profunda, contexto histórico e aplicações práticas). 
- **RAG:** Sim, integra notas linguísticas e comentários históricos.
- **Formato:** Saída estritamente em JSON (`response_format: json_object`).

---

## 2. Módulos de Operação e Experiência do Usuário

### C. support-agent (Chat / Suporte)
- **Modelo Principal:** `Google Gemini 2.5 Flash`
- **Função:** Responder rápida e eficientemente a usuários sobre a plataforma, ou lidar com contexto rápido. Prioriza latência e custo por token.

### D. generate-admin-analytics (Painel de Métricas)
- **Modelo Utilizado:** `gemini-2.5-flash`
- **Função:** Calcular e apresentar sumarizações textuais sobre dados do banco (Insights para o pastor ou administrador da igreja) com baixo custo.

### E. generate-blog-article & publish-to-wordpress
- **Modelos Utilizados:** 
  - Texto: `gpt-4o` (Alta fidelidade de copy editorial)
  - Imagem: `DALL-E 3` / Modelos fal.ai dependendo da requisição visual.
- **Função:** Esteira de geração de artigos SEO-otimizados e publicação automática diretamente na instância WordPress do usuário.

---

## 3. Topologia de Monitoramento

A tabela `generation_logs` no Supabase registra:
- `llm_model`: Qual IA processou a request.
- `generation_time_ms`: Para acompanhamento de latência.
- `cost_usd`: Cálculo dinâmico ou fixado por token dependendo do modelo chamado.
- `theology_guardrails_triggered`: Indicador se o *Caution Mode* foi esbarrado (tópicos de depressão, luto, divórcio).

## Resumo Estratégico

| Edge Function | Principal LLM | Justificativa | Custo Relativo |
| --- | --- | --- | --- |
| generate-pastoral-material | GPT-4o / Gemini 2.5 Flash | Raciocínio multi-ponto e formatação rigorosa. | Alto / Baixo |
| generate-biblical-study | GPT-4o / Gemini 2.5 Flash | Geração JSON estrita. | Alto / Baixo |
| support-agent | Gemini 2.5 Flash | Latência de resposta ultrarrápida. | Baixo |
| generate-blog-article | GPT-4o + DALL-E | Qualidade redatorial SEO e artes nativas. | Muito Alto |
| generate-admin-analytics| Gemini 2.5 Flash | Análise estruturada de Lógica/Matemática. | Muito Baixo |
