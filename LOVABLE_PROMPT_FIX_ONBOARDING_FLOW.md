# Correção do Fluxo de Onboarding (Conversão Otimizada)

Lovable, precisamos reestruturar a UX do nosso fluxo de criação de contas para maximizar a conversão. No momento atual, quando o usuário clica em "Começar Grátis", ele é levado para um formulário de "Dados Básico" que já exibe a barra de progresso do *wizard* completo de onboarding (com as abas *Sua Igreja, Teologia, Seu Rebanho, etc.*). Isso gera atrito cognitivo e diminui a conversão inicial.

**Objetivo:** Capturar o lead (conta) o mais rápido possível e só fazer as perguntas avançadas de perfilação **depois** que o usuário já estiver dentro do sistema e com o e-mail confirmado.

### O que precisa ser alterado:

1. **Tela Inicial de Cadastro (Sign Up):**
   - O primeiro passo para criar a conta deve ser uma tela simples e limpa, contendo apenas "Nome Completo", "Email", "Senha", "Idioma" e o botão "Continuar com Google".
   - **Remova completamente** a barra de progresso superior (stepper) com as etapas (*Dados básicos, Sua Igreja, Teologia...*) desta tela inicial. O usuário não deve saber ou sentir que há um formulário longo pela frente neste momento.

2. **Fluxo Pós-Cadastro (O Wizard de Perfilação):**
   - Após o usuário criar sua conta com sucesso (e idealmente após confirmar o e-mail ou no primeiro login), aí sim ele deve ser direcionado para a tela do Wizard/Onboarding para preencher os dados de *Sua Igreja, Teologia, Seu Rebanho, Portal & Voz, etc.*
   - A barra de progresso superior só deve aparecer nesta fase pós-cadastro.

Por favor, separe a responsabilidade da tela de **Cadastro (Auth/Signup)** da tela de **Onboarding/Perfil (Wizard)**. O objetivo é garantir que o e-mail do usuário seja capturado no banco de dados antes que ele desista no meio do questionário da igreja.

Implemente essa separação de fluxo para garantirmos a captura do lead. Obrigado!
