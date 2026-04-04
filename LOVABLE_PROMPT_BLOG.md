# Instruções para o Lovable: Motor de Blog (Padrão "Automarticles")

Olá, Lovable. Precisamos implementar o módulo de "Blog" dentro da nossa aplicação. O objetivo é criar a experiência de "Aha! Moment" perfeita, gerando um portal funcional de publicações para o usuário assim que ele entra na plataforma pela primeira vez.

Instruções críticas de arquitetura e design:

## 1. Experiência de Onboarding (Geração Automática)
- **O Trigger:** Quando a pessoa criar uma conta no sistema, a aplicação deve **automaticamente** criar o ambiente de blog dela e populá-lo com 2 ou 3 artigos iniciais como demonstração de valor.
- **Mock de Subdomínio:** A pessoa deve possuir um link roteável para o seu portal, idealmente através da lógica de subdomínio (`[nome-do-usuario].seudominio.com`). Desenvolva a UI para exibir essa URL de forma realista (exibindo um aviso "Acessar Portal do Blog").

## 2. Padrão de Estilo da Interface (UI Design)
Replique rigidamente o estilo visual da captura de tela base:
- **Cores & Tema:** Use um fundo bege bem claro/pálido (ex: `#f7f5f0`).
- **Tipografia:** Títulos devem usar uma fonte *Serif* grossa na cor marrom escura (`#3c2f21` ou similar), passando um ar editorial, maduro e clássico.
- **Header:** O título gigante "Blog" centralizado, com uma barra de busca (com botão de lupa) imediatamente abaixo.
- **Subtítulo:** "Últimos Artigos Publicados" abaixo da busca.
- **Layout dos Cards (Posts):** Um Grid responsivo de cards minimalistas (branco puro, sem bordas pesadas, leve sombra suave). Cada card deve ter um Placeholder gigante para a Capa/Imagem no topo, seguido do **Título**, **Data**, um **resumo de 3 linhas** e o **tempo de leitura** (ex: "3 min de leitura") no rodapé. 

## 3. Parâmetros Críticos do Motor de IA (Instruções para o backend local)
Embora a IA não vá rodar diretamente no navegador, você, Lovable, deve preparar a interface e os stubs/Edge Functions de API usando as seguintes **Restrições Absolutas**:

* **Modelo de Texto:** Configurar os endpoints para utilizar obrigatoriamente a inteligência do **GPT-4o**, pela sua perfeição extrema na escrita.
* **Modelo de Imagens:** As imagens serão geradas paralelamente usando a inteligência do **Gemini 1.5 Flash**. 
* **Regra de Tamanho do Artigo:** Todo artigo deve ter **no mínimo 400 e no máximo 700 palavras**. O artigo deve ser um material bem estruturado (estilo sermão, com seções fáceis de escanear).
* **Regra das Imagens:** Cada artigo deve ter **no máximo 4 imagens**. 
* **Regra de Contexto Visual:** As imagens geradas precisam ter "representatividade da época". *Atenção aos Prompts:* Se o artigo for sobre Gênesis, os parâmetros da imagem para o LLM devem exigir rigidamente a Arca de Noé, os animais e estética antiga. 

## 4. Funcionalidades de Gestão (Painel do Usuário)
* **Customizáveis e Editáveis:** O dashboard (como na tela "Meus Artigos") deve permitir que o usuário abra cada um desses artigos recém-gerados em um editor de rich-text para mexer no texto e publicar/salvar.
* **Compartilháveis:** O artigo finalizado dentro do Portal ("Subdomínio") deve ter botões de compartilhamento visíveis e uma URL pública perfeita para ser distribuída aos fiéis ou leitores.

---
Por favor, construa o código das rotas (NextJS App Router), a tela de Onboarding que finge gerar a conta, e a interface centralizadora do Blog (Dashboard e Visão Pública) respeitando essa paleta de cor pálida/editorial.
