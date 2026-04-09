# CORREÇÃO DA BIBLIOTECA (PERSISTÊNCIA) E INJEÇÃO DE MENTES NO E.X.P.O.S.

Olá Lovable! Temos duas falhas estruturais de fluxo que precisam ser contornadas na interface e salvar a produtividade do pastor:

## 1. Salvar os Estudos Bíblicos (Problema Crítico de Persistência)
Atualmente a página `EstudoBiblicoPage.tsx` ou o componente de visualização não está salvando os Estudos Bíblicos Gerados no Supabase, enquanto os Sermões e Artigos estão sendo salvos normalmente. O usuário está pendendo seus estudos!
*   **Correção:** Após a geração com sucesso de um Estudo E.X.P.O.S. no endpoint `generate-biblical-study`, você deve imediatamente inserir esse payload na tabela `materials` (vinculado ao `user_id`, com o tipo/categoria apropriada como `biblical_study`), da mesma forma robusta que os materiais pastorais são salvos.

## 2. Organização por Pastas Reais (Biblioteca)
Na aba "Biblioteca", as coisas estão misturadas numa grande lista única e desorganizada. O usuário precisa de um "gestor de arquivos".
*   **Ação:** Refatore o layout da Biblioteca para criar um sistema de **"Pastas Virtuais" ou Abas Visuais Fortes**:
    *   📁 **Estudos Bíblicos** (E.X.P.O.S.)
    *   📁 **Estudos Pastorais** (Que engloba Sermões, Devocionais e Aulas)
    *   📁 **Blog e Artigos**
*   Organize exibindo itens agrupados pela natureza, formato de data, assunto principal e o "Tom Pastoral" usado.

## 3. Integração Oficial das "Mentes Brilhantes" no E.X.P.O.S.
Sim, o nosso backend Edge Function (`generate-biblical-study`) já é programado nativamente para aceitar o "DNA da Mente" no parâmetro `pastoral_voice`. No momento, o frontend não está permitindo ao usuário selecionar uma mente poderosa (ex: Thiago Brunet) para tunar o "Estudo Bíblico Completo".
*   **Ação:** No painel esquerdo de "Configurar Estudo" dentro do `EstudoBiblicoPage.tsx`, no lugar do (ou adjacente ao) dropdown genérico de "Tom Pastoral", construa o Seletor da "Mente" (Pastoral Voice) exatamente como você já faz para Roteiros de Sermão/Devocional. 
*   **Impacto:** Permita que o usuário escolha qual Mente vai aplicar a visão exegética para aquele estudo e passe o ID correto no parâmetro do payload JSON da function.

Implemente a persistência imediata, a ui das pastas na biblioteca e a integração da persona no E.X.P.O.S.
