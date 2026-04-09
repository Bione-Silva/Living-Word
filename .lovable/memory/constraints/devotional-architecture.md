---
name: Devotional backend architecture
description: Devotionals come from `devotionals` table, NOT materials. Edge function is read-only. Audio set to null — future AWS team handles TTS.
type: constraint
---
1. Devocionais usam a tabela `devotionals`, **NÃO** `materials`.
2. A edge function `get-devotional-today` é **read-only** — apenas `SELECT * FROM devotionals WHERE scheduled_date = today`.
3. Geração de texto e imagem acontece via cron job `generate-devotional-batch`. **Nunca** gerar imagem no frontend.
4. O frontend apenas **consome** os dados já prontos da tabela `devotionals`.
5. **Áudio TTS foi removido** da edge function. As colunas `audio_url_nova`, `audio_url_alloy`, `audio_url_onyx` são inseridas como `null`. Áudio será implementado no futuro por outro time na AWS.
6. **Nunca** usar Google Cloud TTS, Lovable AI Gateway para áudio, ou qualquer integração de TTS.
