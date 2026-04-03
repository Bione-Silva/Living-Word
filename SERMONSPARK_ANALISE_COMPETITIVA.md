# 🔍 Análise Competitiva: SermonSpark.ai
**Data:** Abril 2026 | **Analista:** Antigravity para Living Word

---

## 1. VISÃO GERAL DO PRODUTO

**SermonSpark.ai** é uma plataforma SaaS web de preparação de sermões com IA, desenvolvida pela **Missional Marketing / Missional Software** (agência cristã de marketing). Focada 100% no pastor evangélico, sem presença mobile nativa.

**Headline:** *"Every Sermon Needs a Spark — Sermon preparation support in the palm of your hand"*  
**Promessa:** Devolver ao pastor seu recurso mais escasso: **Tempo**.

---

## 2. ARQUITETURA DO DASHBOARD (O QUE VER NA IMAGEM)

### Design Visual
- **Sidebar roxa** (#4C1D95 aprox.) com logo amarelo/dourado — contraste forte
- **Fundo branco** no conteúdo principal — contraste máximo
- **Grid de cards** por categoria — fácil escaneamento
- Sistema de **créditos visível** na sidebar (ex: "1000 créditos")
- Ícones customizados por ferramenta
- Badge de cadeado 🔒 em features Premium (ex: "Minhas Ideias")

### Navegação (Sidebar)
```
FERRAMENTAS:
  ├── Pesquisar  ▾
  ├── Escrita    ▾
  ├── Alcançar   ▾
  └── Diversão   ▾

MINHA CONTA:
  ├── 1000 créditos (badge)
  ├── História
  ├── Perfil e assinatura
  └── Apoiar

  [Meus projetos]
  [Meus históricos escolares]
  [Minhas Ideias 🔒]
```

---

## 3. FERRAMENTAS MAPEADAS

### 🔎 PESQUISA (8 ferramentas)
| Ferramenta | Descrição |
|---|---|
| Explorador de Tópicos | Aprofunda temas bíblicos e de sermão |
| Encontre versículos sobre o tema | Busca por relevância temática |
| Contexto histórico do verso | Exegese histórico-cultural |
| Localizador de Cotações | Citações de teólogos/pregadores famosos |
| Localizador de músicas temáticas | Sugestão de hinos/louvores para o sermão |
| Localizador de Cenas de Filmes | Ilustrações cinematográficas |
| Explorador de texto original | Grego/Hebraico — análise lexical |
| Localizador de palavras em língua original | Concordância lexical |

### ✍️ ESCRITA (5+ ferramentas)
| Ferramenta | Descrição |
|---|---|
| Títulos criativos para sermões | Gerador de headlines impactantes |
| Gerador de Esboço de Sermão | Outline com estrutura pastoral |
| Criador de Metáforas | Ilustrações e analogias |
| Ilustrações para sermões | Histórias ilustrativas |
| Modernizador de Histórias Bíblicas | Contextualiza narrativas para hoje |

### 📱 ALCANÇAR (Reach)
- Gerador de posts para redes sociais
- Gerador de artigo de blog
- Perguntas para grupo pequeno/célula
- Transcrição de sermão (YouTube, MP4, MP3, M4A)

### 🎉 DIVERSÃO
- Trivias bíblicas
- Poemas e músicas
- Reescrita criativa de passagens

---

## 4. MODELO DE NEGÓCIO

### Pricing (Sistema de Créditos)
| Plano | Preço | Créditos/mês | Diferencial |
|---|---|---|---|
| **Free** | $0 | 500 créditos | Acesso básico a todas ferramentas |
| **Starter** | $7.95/mês | 3.000 créditos | +500 créditos via opt-in email |

> **Preço único muito agressivo**: apenas $7.95/mês — muito abaixo do mercado. Provavelmente tem planos superiores não listados ou planeja aumentar.

### Sistema de Créditos
- Cada ferramenta custa X créditos por uso
- Créditos **não acumulam** — resetam mensalmente
- Acabou? Aguarda renovação ou faz upgrade
- Créditos bônus por aceitar emails promocionais (growth hack inteligente)

---

## 5. PONTOS FORTES DO SERMONSPARK

| Ponto | Detalhe |
|---|---|
| ✅ **Especialização profunda** | 20+ ferramentas todas voltadas ao sermão |
| ✅ **Texto original** | Grego e Hebraico — diferencial teológico real |
| ✅ **Transcrição** | Upload de MP4/MP3 do sermão e reutilização |
| ✅ **Sistema de projetos** | Organização por sermão semanal |
| ✅ **Histórico** | Salva todas as gerações anteriores |
| ✅ **Preço muito acessível** | $7.95 é barreira baixíssima |
| ✅ **Ferramenta única** | Cenas de filmes, locutor de músicas — criativo |
| ✅ **UX clean** | Sidebar + grid de cards é escaneável e didático |

---

## 6. PONTOS FRACOS / LACUNAS (OPORTUNIDADES PARA O LIVING WORD)

| Lacuna SermonSpark | Oportunidade Living Word |
|---|---|
| ❌ **Sem blog do pastor** | ✅ Living Word provisiona blog automático no cadastro |
| ❌ **Sem publicação WordPress** | ✅ Publicação direta no WP do pastor |
| ❌ **Sem calendário editorial** | ✅ Calendário com domingo destacados + agendamento |
| ❌ **Apenas inglês** | ✅ PT + EN + ES trilíngue |
| ❌ **Sem suporte a imigrantes** | ✅ Público específico: pastores brasileiros na diáspora |
| ❌ **Sem estratégia de conversão ativa** | ✅ 7 gatilhos de upgrade da Conversion Strategy |
| ❌ **Sem RAG bíblico** | ✅ pgvector + commentários exegéticos reais |
| ❌ **Sem voz pastoral personalizada** | ✅ 5 vozes: Acolhedor, Expositivo, Narrativo... |
| ❌ **Sem série de pregação** | ✅ Tabela `series` com sequência temática |
| ❌ **Web only, sem mobile feel** | ✅ PWA responsivo com UX mobile-first |
| ❌ **Sem monetização de conteúdo** | ✅ Blog com SEO gera presença digital ao pastor |

---

## 7. O QUE MODELAR DO SERMONSPARK NO LIVING WORD

### 🟢 ADOTAR (copiar a ideia, melhorar a execução)

**1. Sistema de Créditos Visual**
- Mostrar créditos restantes de forma proeminente na sidebar/header
- Badge colorido: verde → amarelo → vermelho conforme uso
- *No Living Word:* substituir "créditos" por **"gerações"** — mais pastoral

**2. Organização por ferramentas em Grid**
- Dashboard principal como hub de ferramentas em cards
- Categorias claras: Pesquisa | Escrita | Alcançar | +
- Cards com ícone + nome + badge 🔒 quando bloqueado

**3. Sistema de Projetos**
- Cada sermão = um projeto
- Agrupa: passagem, esboço, devocional, artigo, reels em um só lugar
- *No Living Word:* projeto = sessão de geração salva na tabela `materials`

**4. Histórico de Gerações**
- Lista de tudo que foi gerado (como a Biblioteca do Living Word)
- Filtros por data, tipo, passagem

**5. Transcrição de Sermão**
- Upload de áudio/vídeo do pregador
- IA transcreve e já gera artigo/blog/redes sociais
- **GRANDE DIFERENCIAL**: muitos pastores pregam mas não escrevem
- *Adicionar ao Sprint 3 do Living Word*

**6. Localizador de Cenas de Filmes**
- Ferramenta criativa e divertida
- Gera engagement e word-of-mouth
- *Living Word pode ter: "Encontrar ilustração contemporânea"*

**7. Brainstorm por Voz (Premium)**
- Pastor fala livremente → IA estrutura em esboço
- *Living Word pode ter versão integrada ao app mobile*

---

## 8. ESTRUTURA DE SIDEBAR INSPIRADA NO SERMONSPARK

Modelar a sidebar do Estúdio Living Word assim:

```
🌟 LIVING WORD

━━━━ CRIAR ━━━━
  📖  Estúdio Pastoral
  📝  Gerar Artigo
  🎙️  Transcrever Sermão (Sprint 3)

━━━━ FERRAMENTAS ━━━━
  🔍  Pesquisar Versículo
  📚  Texto Original (Grego/Heb)
  🎬  Ilustração Contemporânea
  🎵  Sugestão de Louvor

━━━━ PUBLICAR ━━━━
  📅  Calendário Editorial
  🌐  Meu Blog
  📊  Histórico

━━━━ MINHA CONTA ━━━━
  [■■■□□] 4/5 gerações  ← GAUGE
  ⚙️  Configurações
  ⬆️  Upgrade para Pastoral
```

---

## 9. ANÁLISE DE PREÇO × POSICIONAMENTO

| Produto | Free | Básico | Avançado |
|---|---|---|---|
| **SermonSpark** | 500 créditos | $7.95/mês | N/A |
| **Living Word** | 5 gerações | $9/mês (Pastoral) | $29/mês (Church) |

**Estratégia:** Living Word cobra ligeiramente mais ($9 vs $7.95) mas **entrega muito mais**:
- Blog automático incluído
- Publicação WordPress
- 3 idiomas
- Formatos exclusivos (Reels, Bilíngue, Célula)
- Voz pastoral personalizada

**O preço mais alto é justificado pelo valor entregue.** O pastor do SermonSpark ainda precisa ir ao WordPress publicar. No Living Word, é automático.

---

## 10. FUNCIONALIDADES PRIORITÁRIAS A MODELAR NO LOVABLE

Em ordem de impacto no usuário:

1. **Dashboard tipo hub** — grid de ferramentas por categoria (copiar layout SermonSpark)
2. **Gauge de gerações** na sidebar — igual ao badge de créditos
3. **Sistema de projetos** — cada sermão é um projeto com todos os outputs
4. **Ferramenta de transcrição** — diferencial para pastor que só prega
5. **Explorador de texto original** — Grego/Hebraico via `bible_commentary_embeddings` (RAG)
6. **Localizador de ilustrações** — contemporâneas, cinematográficas, do cotidiano

---

*Análise concluída. SermonSpark é o concorrente mais direto do Living Word no segmento pastoral. A diferença fundamental: SermonSpark é uma caixa de ferramentas. O Living Word é uma plataforma completa de ministério digital.*
