

# Diagnóstico: Devocional "Sendo Preparado"

## Causa Raiz
A tabela `devotionals` está **completamente vazia** — 0 registros. O cron job `generate-devotional-batch` nunca populou a tabela (ou não existe/não está configurado).

A edge function `get-devotional-today` funciona corretamente — ela faz `SELECT * FROM devotionals WHERE scheduled_date = today` e retorna o fallback "está sendo preparado" quando não encontra dados.

## Solução Imediata (sem alterar frontend)

### Passo 1 — Inserir devocionais de teste para hoje (2026-04-08)
Inserir 3 registros na tabela `devotionals` (PT, EN, ES) usando `psql`:

```sql
INSERT INTO devotionals (title, category, anchor_verse, anchor_verse_text, body_text, daily_practice, reflection_question, closing_prayer, scheduled_date, language)
VALUES
(
  'A Paz que Excede Todo Entendimento',
  'Paz Interior',
  'Filipenses 4:6-7',
  'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.',
  'Vivemos em um mundo que nos convida à ansiedade...[corpo completo do devocional]',
  'Hoje, quando sentir ansiedade, pare por 60 segundos e entregue a situação a Deus em oração.',
  'Em que áreas da sua vida você tem lutado para confiar plenamente em Deus?',
  'Senhor, entrego nas Tuas mãos tudo aquilo que me causa ansiedade...',
  '2026-04-08',
  'PT'
),
-- EN and ES versions with same structure
(...);
```

### Passo 2 — Verificar via edge function
Chamar `get-devotional-today` para confirmar que retorna o devocional inserido.

### Passo 3 — Solução permanente (próximo passo)
Criar ou configurar o cron job `generate-devotional-batch` para rodar diariamente de madrugada e popular a tabela automaticamente. Sem isso, o problema se repetirá amanhã.

## Nenhuma alteração de frontend
Conforme solicitado, zero mudanças em componentes. Apenas dados no banco.

