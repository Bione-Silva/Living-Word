---
name: AI models permitidos — apenas Gemini e GPT
description: Proibido usar qualquer modelo de IA que não seja Google Gemini ou OpenAI GPT (incluindo gpt-4o-mini). Nunca usar Claude, Llama, Mistral, DeepSeek, Hugging Face, etc.
type: constraint
---
**REGRA ABSOLUTA**: Em todo o projeto Living Word, apenas modelos das famílias **Gemini (Google)** e **GPT (OpenAI)** podem ser usados.

## Permitidos
- `google/gemini-2.5-pro`
- `google/gemini-2.5-flash`
- `google/gemini-2.5-flash-lite`
- `google/gemini-2.5-flash-image` (Nano Banana)
- `google/gemini-3-flash-preview`
- `google/gemini-3.1-pro-preview`
- `google/gemini-3-pro-image-preview`
- `google/gemini-3.1-flash-image-preview`
- `openai/gpt-5`, `openai/gpt-5-mini`, `openai/gpt-5-nano`, `openai/gpt-5.2`
- `gpt-4o-mini` (mencionado pelo usuário como aceito)

## Proibidos (nunca usar)
- Anthropic Claude (qualquer versão)
- Meta Llama
- Mistral
- DeepSeek
- Hugging Face models
- Qualquer outro provedor

## Como aplicar
- Em todas as edge functions que usam Lovable AI Gateway, sempre escolher modelo Gemini ou GPT.
- Default recomendado: `google/gemini-2.5-flash` (texto) e `google/gemini-2.5-flash-image` (imagem).
- Ao migrar/refatorar funções existentes, validar que o `model` no payload é da lista permitida.
- Nunca instalar SDKs de outros provedores (`@anthropic-ai/sdk`, etc.).
