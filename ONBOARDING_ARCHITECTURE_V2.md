# ARQUITETURA DE ONBOARDING PROGRESSIVO (V2)

Conforme a estratégia de redução de fricção e personalização baseada em comportamento, aqui está a nova fundação arquitetural da plataforma Living Word.

## 1. Como ficou o Onboarding Inicial
Tornou-se extremamente veloz e com fricção quase zero. Agora possui apenas 3 Passos Essenciais que garantem que o "motor ligue":
*   **Passo 1:** Básico (Nome, Email, Senha, Idioma).
*   **Passo 2:** A Encruzilhada (Nome da Igreja, Denominação, Liderança [Sim ou Não]).
*   **Passo 3:** O Delineador Teológico (Linha teológica ou Visão Doutrinária padrão a ser respeitada).
O Stepper inicial de 7 passos foi definitivamente morto e substituído por este fluxo expresso.

## 2. Quais dados são coletados AGORA (Camada 1)
O Payload inicial ao final do Passo 3 registrará na base de dados apenas o esqueleto necessário:
`[nome]`, `[email]`, `[idioma]`, `[igreja_nome]`, `[denominacao]`, `[is_leader]`, `[linha_teologica_base]`.
*Nota do Banco de Dados:* Isso já garante o score automático de `4 de 10` ou `40%` do perfil completo.

## 3. Quais dados ficam para DEPOIS (Camada 2)
As minúcias do DNA pastoral foram movidas para a Camada 2 (Onboarding Interno Progressivo). Elas são:
*   Maturidade exata do público (rebanho).
*   Tom de voz detalhado da escrita e pregação (inspirador, acadêmico, firme).
*   Objetivo principal na plataforma.
*   Formatos que o usuário mais vai consumir.
*   Profundidade exata (acessível vs teológico profundo).

## 4. Lógica Condicional (Líder vs Membro)
A pergunta "Exerce alguma liderança?" atua como um divisor de águas permanente:
*   **Se Líder:** A plataforma passa a incentivar posteriormente a definição de *Estilo de Pregação* e composição do *Rebanho* em cards no dashboard.
*   **Se Membro/Estudioso:** A interface omite 100% de qualquer nomenclatura que remeta a homilética ou pastoreio. As perguntas no dashboard vão incentivá-lo a definir se quer focos em crescimento pessoal ou contexto histórico, personalizando o "estudo", e não a "pregação".

## 5. Como ficou o Card Interno de Progresso
Desenhado como um Módulo de Gamificação Discreto, persistido na home (Dashboard):
*   **Visual:** Uma barra colorida preenchida em 40% acompanhada de um texto empático.
*   **Copyway:** *"Você completou 4 de 10 itens do seu perfil. Complete o restante para receber resultados mais precisos e personalizados das Mentes Brilhantes."*
*   **UX:** Contém um botão claro ["Melhorar Minha IA"] e opções de "fechar/lembrar depois". A captura das peruntas ocorre de forma modal ou na própria tela do card a medida em que faltam pontos.

## 6. Persistência no Supabase
Criada a migration `010_progressive_onboarding_persistence.sql` que engloba as duas camadas logicamente na tabela pai `profiles`:
*   *Camada 1 (Essential):* Campos já existentes populados via trigger ou insert do Onboarding Mínimo.
*   *Camada 2 (Enriched):* Novos campos `theological_line_detail`, `primary_goal`, `teaching_style`, `audience_profile`, `desired_tone`, `preferred_formats`, `desired_depth`.
*   *Scores (Math):* `profile_completion_total` (10), `profile_completion_done` (incremental), `profile_completion_percent` (0-100 calculados no frontend e populados aqui).

## 7. Como o Sistema poderá Aprender pelo Uso (Camada 3)
A fundação arquitetural passa a suportar uma matriz preditiva no backend gerando metadados atrelados ao `user_id`:
*   **Telemetria:** Cada disparo da function `generate-pastoral-material` agora terá seus metadados analisados assincronamente. Exemplo: Se o `user X` gera sermões com *output_mode = sermon* em 80% das chamadas, o campo `preferred_formats` é preenchido organicamente, aumentando a barra de progresso dele passivamente sem que ele informe nada num formulário.
*   As Edge Functions passarão a priorizar respostas que façam "match" com o *Token Count* médio que o usuário mais aceita, criando uma real fusão entre Feedback Explícito (Forms) e Implícito (Behavior).
