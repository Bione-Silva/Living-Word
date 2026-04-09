# Auditoria de Conexão Frontend-Backend (QA Lovable)

**Olá Lovable,**

Nosso backend foi totalmente blindado e refatorado com o sistema das "Mentes Brilhantes" e a Conversão de Planos. No entanto, precisamos de uma auditoria rigorosa (pente-fino) no seu código frontend para garantir que nenhum parâmetro importante esteja sendo esquecido na hora de fazer o POST para as Edge Functions (generate-pastoral-material e generate-biblical-study).

Por favor, faça um escaneamento no seu código e confirme que os seguintes pontos críticos de integração estão 100% alinhados:

### 1. Chamada à API e Parâmetro pastoral_voice
- **Validação:** Verifique a função que faz o fetch para o Supabase (provavelmente algo como supabase.functions.invoke("generate-pastoral-material")).
- **Problema em Potencial:** O frontend permite selecionar uma Mente (ex: "Tiago Brunet" ou "João Calvino") na interface, mas se não colocar no corpo (body) da requisição JSON, o backend vai resetar para a voz padrão.
- **Requisição:** O seu payload JSON enviado no corpo deve obrigatoriamente incluir:
  { "pastoral_voice": "tiago brunet" } (String exata, normalizada preferencialmente em minúsculo ou maiúsculo padrão, sem caracteres especiais).
- **Tarefa:** Mostre onde exatamente o parâmetro da Voz (Mente) selecionada pelo usuário no formulário/vitrine está sendo capturado e inserido na propriedade pastoral_voice da chamada da API.

### 2. Validação da Linguagem (language)
- **Validação:** O sistema é multilíngue. Se o usuário escolher Inglês (EN) na plataforma, a saída gerada pela Mente obrigatoriamente deve vir em Inglês.
- **Requisição:** O payload enviado para o backend DEVE conter também a variável:
  { "language": "EN" } (ou "PT", "ES").
- **Tarefa:** Verifique no estado global do app (contexto de usuário ou localStorage) de onde a preferência de linguagem do usuário está sendo lida. Certifique-se de que ela está sendo mapeada para a propriedade language em TODOS os endpoints de geração (generate-pastoral-material e generate-biblical-study). Se eu me cadastrar em Inglês, preciso que os inputs dos modais batam nesse parâmetro.

### 3. Modos de Geração em Checkboxes (output_modes)
- **Validação:** Quando eu marco a checkbox de gerar um "Devocional", o payload precisa espelhar exatamente essa seleção de array.
- **Requisição:**
  { "output_modes": ["devotional", "sermon", ...] }
- **Tarefa:** Audite o formulário e prove que os *checkboxes* que o usuário seleciona e desmarca refletem perfeitamente uma lista gerada em tempo real para a chave output_modes antes do disparo da API. O devocional tem que ser a key "devotional". 

Após fazer esse pente-fino, documente onde no seu código isso está, ou caso note a ausência de um desses parâmetros no builder do fetch, por favor, aplique a correção instantaneamente e me avise.
