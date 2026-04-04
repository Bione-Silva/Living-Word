

# Redesign da Página Interna de Ferramentas (Dashboard)

## Mudanças

### 1. Header — boas-vindas com nome do usuário (não "Pastor")
- Greeting usa `profile?.full_name?.split(' ')[0]` com fallback genérico (não "Pastor")
- Copy explicativa abaixo mais acolhedora e contextual, trilíngue

### 2. Cada seção ganha copy explicativa trilíngue
- Pesquisa: "Aprofunde-se no texto bíblico..." / "Dive deeper into the biblical text..." / "Profundice en el texto bíblico..."
- Escrita: "Transforme seu estudo em conteúdo..." / "Turn your study into ready content..." / "Transforma tu estudio en contenido..."
- Alcance: "Leve sua mensagem além do púlpito..." / "Take your message beyond the pulpit..." / "Lleva tu mensaje más allá del púlpito..."
- Divertidas: "Engaje sua comunidade..." / "Engage your community..." / "Involucra a tu comunidad..."

### 3. ToolCard horizontal
- `src/components/ToolCard.tsx`: flex-col → flex-row, ícone à esquerda, texto à direita
- Card mais largo e baixo

### 4. Grid ajustado
- `src/pages/Dashboard.tsx`: grid de 4-5 cols → 2 cols desktop, 1 col mobile

### Arquivos editados
- `src/components/ToolCard.tsx`
- `src/pages/Dashboard.tsx`

