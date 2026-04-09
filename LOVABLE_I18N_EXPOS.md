# INTERNACIONALIZAÇÃO (i18n) E REFINAMENTOS FINAIS DO E.X.P.O.S.

Olá Lovable! O nosso build está limpo e a tipagem foi integrada perfeitamente no *StudyViewer.tsx*, *StudyActions.tsx* e *EstudoBiblicoPage.tsx*. Agora precisamos fazer o "acabamento fino" nas labels. 

Atualmente, todos os títulos dos Accordions, labels do PDF/DOCX e textos da tela estão fixos em português (PT). Precisamos aplicar o suporte para Inglês (EN) e Espanhol (ES) para os usuários globais utilizando a hook `useLanguage` ou operadores ternários baseados em `lang`.

Por favor, faça as seguintes atualizações nos 3 arquivos principais de estudo bíblico:

## 1. Internacionalizar Labels no `StudyViewer.tsx`
Passe a variável `lang` de onde estiver disponível (ou chame a hook `const { lang } = useLanguage()`) e troque as strings fixas por um dicionário ou validações condicionais. Segue o mapa de traduções obrigatórias:

*   **Contexto:** Contexto (PT/ES), Context (EN)
    *   Histórico: Histórico (PT), Histórico (ES), Historical (EN)
    *   Literário: Literário (PT), Literario (ES), Literary (EN)
    *   Canônico: Canônico (PT), Canónico (ES), Canonical (EN)
*   **Observação:** Observação (PT), Observación (ES), Observation (EN)
    *   Perguntas 5W+H: Perguntas 5W+H (PT/ES), 5W+H Questions (EN)
    *   Palavras-Chave: Palavras-Chave (PT), Palabras Clave (ES), Keywords (EN)
    *   Elementos Notáveis: Elementos Notáveis (PT), Elementos Notables (ES), Notable Elements (EN)
*   **Interpretação:** Interpretação (PT), Interpretación (ES), Interpretation (EN)
    *   Significado Original: Significado Original (PT/ES), Original Meaning (EN)
    *   Estudo de Palavras: Estudo de Palavras (PT), Estudio de Palabras (ES), Word Study (EN)
    *   Cruzamento de Escrituras: Cruzamento de Escrituras (PT), Referencias Cruzadas (ES), Cross References (EN)
    *   Lógica Interna: Lógica Interna (PT/ES), Internal Logic (EN)
*   **Abertura e Verdade Central:**
    *   Oração de Abertura: Oração de Abertura (PT), Oración de Apertura (ES), Opening Prayer (EN)
    *   Verdade Central: Verdade Central (PT), Verdad Central (ES), Central Truth (EN)
*   **Conexão Cristológica:**
    *   Conexão Cristológica: Conexão Cristológica (PT), Conexión Cristológica (ES), Christological Connection (EN)
*   **Aplicação:** 
    *   Aplicação (PT), Aplicación (ES), Application (EN)
    *   Crer: Crer (PT), Creer (ES), Believe (EN)
    *   Mudar: Mudar (PT), Cambiar (ES), Change (EN)
    *   Agir: Agir (PT), Actuar (ES), Act (EN)
    *   Reflexão Pessoal: Reflexão Pessoal (PT), Reflexión Personal (ES), Personal Reflection (EN)
*   **Perguntas para Discussão:** Perguntas para Discussão (PT), Preguntas de Discusión (ES), Discussion Questions (EN)
*   **Encerramento & Bônus:**
    *   Encerramento: Encerramento (PT), Cierre (ES), Closing (EN)
    *   Oração Sugerida: Oração Sugerida (PT), Oración Sugerida (ES), Suggested Prayer (EN)
    *   Instrução ao Líder: Instrução ao Líder (PT), Instrucción al Líder (ES), Leader Instruction (EN)
    *   Bônus: Bônus (PT), Bono (ES), Bonus (EN)
*   **Notas do Líder (Bastidores):**
    *   Título: 📝 Dicas para o Líder da Célula (PT) / 📝 Consejos para el Líder Celular (ES) / 📝 Cell Leader Tips (EN)
    *   Como Introduzir: Como Introduzir (PT), Cómo Introducir (ES), How to Introduce (EN)
    *   Pontos de Atenção: ⚠️ Pontos de Atenção (PT), ⚠️ Puntos de Atención (ES), ⚠️ Points of Attention (EN)
    *   Erros Comuns: ❌ Erros Comuns (PT), ❌ Errores Comunes (ES), ❌ Common Mistakes (EN)
    *   Recursos Adicionais: 📚 Recursos Adicionais (PT), 📚 Recursos Adicionales (ES), 📚 Additional Resources (EN)

## 2. Internacionalizar Labels no `StudyActions.tsx` (Exports: Docx/PDF e Transform)
Você já notou que existe um pouco de suporte ao idioma (ex: `lang === 'PT' ? 'DOCX exportado com sucesso!' : ...`). Expanda isso para a geração do HTML (`buildHTMLContent`) e para os arrays lógicos do docx builder (`handleExportDOCX`), traduzindo blocos como "Texto Bíblico", "Contexto Histórico", "Encerramento", etc, substituindo os coringas fixos em Português pelas palavras mapeadas acima.

## 3. Teste End-to-End
Após internacionalizar as strings, ative e realize o teste visual do E.X.P.O.S localmente:
1. Gere um novo estudo de Colossenses 1 (por exemplo) em Inglês, e verifique se as seções trocam o idioma para `Leader Tips`, `Central Truth`, `Observation`.
2. Baixe o PDF/DOCX do arquivo gerado e valide se as fontes históricas e os 10 blocos estão embutidos com os títulos internacionalizados. 

Pode prosseguir com a atualização dos componentes!
