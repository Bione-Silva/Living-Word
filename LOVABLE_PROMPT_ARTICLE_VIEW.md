# Instruções para o Lovable: Layout do Artigo (Reader View)

Olá, Lovable. Agora precisamos construir a tela mais importante do Blog: **A Visão do Artigo (Reader View)**.

Use o seu rigor arquitetônico máximo para criar um layout focado em *leitura imersiva, elegância e engajamento*. O código React/Tailwind gerado deve respeitar estritamente as regras de design e de engenharia de dados listadas abaixo:

## 1. Identidade Visual e Layout Base (Editorial Clássico)
- **Cores Básicas:** Mantenha o fundo pastel/bege (`#f7f5f0`). É vital para não cansar a vista.
- **Tipografia:** 
  - **Título (H1):** Fonte Serifada (ex: *Playfair Display* ou *Merriweather*), marrom escuro pesado (`#3c2f21`), centralizado ou alinhado à esquerda.
  - **Corpo do Texto:** Fonte Sans-Serif limpa e fácil de ler (ex: *Inter*, *Roboto*), tamanho 18px a 20px, com altura de linha alta (`leading-relaxed` / 1.7 ou 1.8) para respiro da alma.
- **Largura da Leitura (Max-Width):** O texto do artigo **não pode** ocupar a tela toda. Use `max-w-2xl` ou `max-w-3xl` e centralize a coluna (margens auto).

## 2. O Header do Artigo & Meta Dados
Acima do título principal, ou logo abaixo dele, crie uma fina barra de meta-dados contendo:
- Ícone de calendário com a **Data**.
- Ícone de relógio indicando o **Tempo de Leitura**.
- **[NOVO] Seletor de Idioma (Language Switcher):** Inclua um *dropdown* elegante ou *pills* permitindo a seleção entre três idiomas: **PT-BR**, **EN** e **ES**.

### ⚠️ REGRA DO MULTI-IDIOMA:
Não instale bibliotecas de tradução automática "on-the-fly" (ex: Google Translate). O nosso backend de IA já foi programado para redigir o artigo **nativamente** nos três idiomas. O seletor de idioma na sua interface deve, do ponto de vista do estado (State), puxar a versão do texto salva no banco no respectivo idioma, ou alterar para a rota `/en/slug-do-artigo`.

## 3. Regra Absoluta: Distribuição Semântica de Imagens
O sistema de backend vai te passar o conteúdo em formato Markdown (ou similar) contendo o Texto (organizado em H1, H2, H3) e até 4 Imagens.

**Instruções Críticas de Renderização:**
- Você **NÃO PODE DE FORMA ALGUMA** pegar as 4 imagens e jogar soltas no rodapé do artigo ou empilhar todas no topo.
- O componente que renderizar o artigo deve **intercalar as imagens semanticamente dentro do texto**. 
- As imagens devem aparecer organicamente como divisórias ou ilustrações posicionadas logo após os subtítulos (H2 ou H3) ou entre parágrafos densos, para "quebrar" a parede de texto e oferecer leveza visual ao leitor.
- As imagens devem ocupar o `width: 100%` da coluna de leitura, com bordas levemente arredondadas (`rounded-xl` ou `md`) e sombras discretas (`shadow-sm`).

## 4. O Sistema de Compartilhamento e Assinatura
- No final do texto da leitura, antes do footer raiz, adicione uma faixa sutil: *"Compartilhe esta mensagem"* com botões discretos (WhatsApp, X / Twitter, Copiar Link).
- **Rodapé Viral:** Assim como exigido no onboarding, a assinatura intransferível `Feito com ❤️ pela Living Word` deve ancorar a página.

Por favor, gere os componentes React desta página de leitura agora. Concentre-se em fazer o Markdown Parser renderizar as imagens lindamente intercaladas ao longo da leitura.
