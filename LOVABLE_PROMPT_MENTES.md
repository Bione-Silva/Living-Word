# Instruções para o Lovable: Módulo "Mentes Brilhantes" (Premium)

Olá, Lovable. Nós temos um backend complexo de orquestração de IA onde cada Agente ("Mente") possui uma biografia gigante, matrizes teológicas e assinaturas de raciocínio. A sua interface gerada anteriormente ficou muito rasa. 

Refaça a Interface de Usuário (UI) obedecendo **estritamente** à profundidade técnica descrita abaixo:

## 1. Sidebar (Menu Lateral)
Crie uma seção dedicada na Sidebar chamada **"🧠 Mentes Brilhantes"** (marcada com um badge dourado "Premium"). Roteia para `/dashboard/mentes`.

## 2. A Tela Principal (Vitrine)
Ao entrar em `/dashboard/mentes`, exiba o Grid luxuoso (cores `slate-950` com destaques dourados).
**Mockups Iniciais:**
1. **Billy Graham** (Liberado/Free) - *O Evangelista da América*
2. **Charles Spurgeon** (Bloqueado 🔒) - *O Príncipe dos Pregadores*
3. **Martyn Lloyd-Jones** (Bloqueado 🔒) - *O Doutor*

*Paywall:* Clique nos bloqueados = Banner: "Desbloqueie a Sabedoria Histórica - $100/mês".

---

## 3. A Central da Mente (O Layout Rico ao Clicar na Mente)
Esta é a parte principal onde você errou antes. Quando o usuário clica no **Billy Graham** (ou numa mente desbloqueada), você **DEVE** abrir uma página inteira ou um modal/drawer (gigante e com scroll) rica em informações. O usuário precisa ver todo o banco de dados que compõe a personalidade desta IA antes de conversar.

O layout desta tela deve lembrar uma página elegante do Notion ou uma Wikipedia de luxo, dividida nas seguintes sessões:

### A. Header (Hero Section)
- Foto circular gigante no topo, nome da Mente e um Subtítulo.
- Badges abaixo do nome exibindo o peso dos dados: *(Ex: "350+ Horas de Vídeo", "5.000 Páginas Processadas", "32 Milhões de Tokens de Contexto")*.

### B. Biografia e Perfil Psicológico (Seção de Texto Longo)
* "Esta IA absorveu o contexto de vida, o tom de urgência apocalíptica da Guerra Fria e a paixão evangelística das grandes cruzadas do Século XX. O tom de voz é encorajador, porém com senso de urgência sobre o perdão e foco absoluto na cruz."

### C. Assinaturas Homiléticas e Matriz Teológica (Lista Customizada)
Exiba componentes brilhantes ou ícones (Cards ou Checklists) detalhando a estrutura desta IA:
- **Especialidades:** Apelo Evangelístico Militar, Metáforas Simples, Consolo em Massa.
- **Assinaturas:** O uso constante da frase *"A Bíblia diz..."*.
- **Matriz Teológica:** Visão conservadora focada na necessidade soberana do Espírito Santo e Autoridade Bíblica.

### D. Obras de Referência na "Cabeça" da IA (Acervo)
Liste os livros carregados na IA (com ícone de livro 📚):
- *Paz com Deus (1953)*
- *O Valor de uma Alma (Transcrição Oficial)*
- *A Cruzada de Los Angeles (1949)*

### E. O Módulo de Engate (O que você quer fazer?)
Somente **no final dessa longa e rica página de especificações**, exiba os "Botões de Engrenagem" (Cards grandes) para ligar a IA em uma modalidade específica:
1. 📖 **Devocional Diário** (Encorajamento matinal)
2. 📝 **Preparação de Sermão** (Ajuda com esboço expositivo)
3. 🗣️ **Aconselhamento Pastoral** (Cura para crises)
4. 📚 **Estudo Teológico** (Deep dive em doutrinas)

**Ao clicar em um destes 4 botões finais**, o sistema roteia o usuário para a interface de Chat (`/dashboard/mentes/chat`).

Construa isso com riqueza de detalhes, tipografia legível (ex: Inter), uso de seções bem delimitadas e ícones (`lucide-react`). A tela não pode passar a impressão de um "bot simples", mas sim de um **Complexo Ecossistema de Inteligência**. Construa agora!
