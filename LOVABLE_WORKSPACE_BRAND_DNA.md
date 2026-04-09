# NOVO RECURSO: ONBOARDING DO "DNA DA MARCA" NO WORKSPACE

Olá Lovable! Vamos elevar a Living Word (este é o nome sagrado e inegociável da nossa plataforma, não use Palavra Viva!). 
Nós construímos 3 Templates Premium incríveis no Canvas do Estúdio Social. Mas gasta muito tempo fazer o usuário escolher cores e temas a cada post. A plataforma carece de uma "Memória de Marca".

Por favor, refatore o fluxo de criação/configuração de **Workspaces** (Ministérios/Séries).
Adicione uma aba ou fluxo de Onboarding chamado **"Mapear DNA da Marca"**. Ele deve ter 2 grandes passos perfeitamente desenhados em UI minimalista.

## PASSO 1: DNA do Conteúdo (Para injetar nas IAs de Geração)
Um formulário limpo `shadcn/ui` que salvará o contexto global deste Workspace:
*   **Público-Alvo:** Um campo Textarea (Ex: "Jovens universitários buscando discipulado", "Liderança de células").
*   **Tom de Comunicação:** Um select ou Textarea (Ex: "Teológico e formal", "Leve, humorado", "Pastoral e curativo").
*   **O que sua igreja/público ama consumir:** (Ex: "Devocionais em lista, Salmos de encorajamento").

> **Objetivo de Banco:** Grave esses dados. Nosso Agente de AI consumirá isso invisivelmente depois para redigir o corpo das postagens de redes sociais com a voz idêntica ao que a igreja do cliente já escreve.

## PASSO 2: Identidade Visual (Para o Estúdio Social)
Uma tela deslumbrante baseada na premissa do Posttar. O usuário não deve ver "Hex Codes" confusos, mas sim opções visuais maravilhosas.
*   **Cor Principal do Ministério:** Crie uma UI com uma sequência de 12 a 16 círculos (`rounded-full h-10 w-10 btn-ghost hover:scale-110 transição`) com cores lindas de Paletas (Marsala, Navy Blue, Forest Green, Mustard, Violet, etc.). O usuário clica e uma marca de *check* aparece. Deixe também uma opção final `+` para o input livre de HEX `color`.
*   **Padrão de Design Principal:** Uma grade `grid-cols-2 lg:grid-cols-3` contendo grandes "Cards de Vitrine" clicáveis mostrando os nossos 3 temas atuais do Canvas para que a igreja adote um como "O Seu Favorito".
    1.  O **Editorial Minimalista**
    2.  A **Tipografia Suíça**
    3.  A **Cinematic Overlay**

> **A Mágica:** Ao salvar a Identidade Visual do passo 2, este Workspace agora tem uma Alma! 
> Sempre que o cliente clicar no Menu "Estúdio Social", o Canvas deve abrir **já populado** com a Cor Default que ele escolheu e setado no Tema Padrão do Ministério dele. Ele não parte mais do zero, ele parte de 90% pronto!

Construa essa UX impecável nos componentes de Settings do Workspace agora! E lembre-se: o rodapé, a watermark do estúdio e qualquer logo do sistema não devem mais trazer "Palavra Viva", deve transpirar **Living Word**. Mãos à obra.
