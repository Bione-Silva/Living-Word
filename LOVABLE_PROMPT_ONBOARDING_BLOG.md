# Instruções para o Lovable: Onboarding Dinâmico do Blog

Olá, Lovable. Estamos avançando com o nosso portal de Blogs automáticos. Com base no design de painel lateral que acabamos de definir, implemente agora o **Fluxo de Onboarding e Personalização do Blog**.

Construa uma interface de ativação rica guiada pelas regras abaixo:

## 1. Tela "Deixe seu blog com sua cara!" (Setup Inicial)
- **Banner de Ativação:** O usuário deve ver uma mensagem entusiástica (ex: *"Você ganhou um blog profissional! Criamos um blog incrível para você de presente..."*).
- **Escolha do Link (Subdomínio):** Crie um form com um campo de input onde o usuário digita o nome desejado. O campo deve prefixar o domínio principal (ex: `input-do-usuario .meublog.net`). Mostre que esse link será o endereço exclusivo dele.
- **Paleta de Cores:** Disponibilize pequenos blocos clicáveis (swatches) para que a pessoa escolha a cor temática do portal dela (ex: tons de azul, verde, rosa).
- **Preview em Tempo Real:** No lado direito da tela, exiba a "casca" de um celular ou navegador de mentira que vai refletindo a cor que o usuário escolher e o nome do blog no cabeçalho em tempo real. Padrão "Automarticles".
- **Botão Final:** Um botão roxo escuro, longo, dizendo "Concluir Onboarding ->", que roteará o usuário para o Dashboard.

## 2. A Identidade Visual do Sistema (Marca d'água / Assinatura)
### REGRA ABSOLUTA DE DESIGN:
* **Assinatura Obrigatória:** Você deve ancorar uma assinatura no rodapé (Footer) de **TODOS** os blogs e de todos os artigos publicados. 
* **Design da Assinatura:** Deve ser minimalista, algo como: `Feito com ❤️ pela base das Mentes Brilhantes` ou `Powered by Living Word`. Ninguém pode remover isso, é uma trava de marketing viral do nosso sistema.

## 3. SEO e Metadados (Atenção ao Roteamento)
- No momento de construir os componentes React/Next.js para a exibição pública do blog, certifique-se de prever o uso de tags semânticas html (`<article>`, `<h1>`, `<h2>`) e preparar componentes injetáveis para `Meta Tags` no `head`.
- As URLs dos artigos devem suportar *slugs* limpas (ex: `/blog/o-valor-da-alma`).

Por favor, gere esses modais com React e Tailwind, garantindo que o Preview de cores da direita seja totalmente reativo ao clique no seletor de paletas da esquerda.
