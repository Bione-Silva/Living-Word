# 🛡️ Norma de Segurança — Living Word Platform

> **Status:** ATIVA — Aplicável a todo código gerado neste workspace.
> **Base:** OWASP Top 10 2025 + Proteções de Race Condition + Privacidade (LGPD/GDPR)
> **Stack:** Supabase (Edge Functions/RLS), React (Vite), Lovable AI Gateway

---

## PRINCÍPIOS FUNDAMENTAIS

1. **DEFESA EM PROFUNDIDADE**: Cada camada do sistema deve ser independentemente segura. Se o frontend valida, o backend TAMBÉM valida. Se o banco tem constraints, o código TAMBÉM verifica. Nenhuma camada pode depender de outra para segurança.

2. **NUNCA CONFIE NO FRONTEND**: Toda entrada vinda do cliente é potencialmente maliciosa. Toda validação deve existir no servidor. Toda autorização deve ser verificada no backend. Dados vindos do cliente são sugestões, não verdades.

3. **MENOR PRIVILÉGIO**: Cada componente, usuário, serviço, query e função deve ter apenas as permissões mínimas necessárias. Nada mais. Isso vale para roles de banco, tokens de API, permissões de arquivo, escopos de OAuth e qualquer outro contexto.

4. **FALHE DE FORMA SEGURA (Fail Closed)**: Se algo der errado, o sistema deve negar acesso por padrão. Erros nunca devem abrir brechas. Exceções não tratadas devem resultar em negação, não em concessão.

5. **SEGREDOS FORA DO CÓDIGO — SEMPRE**: NUNCA coloque API keys, tokens, senhas, connection strings, chaves privadas ou qualquer secret no código-fonte, em comentários, em logs, em mensagens de erro ou em respostas de API. Use variáveis de ambiente ou gerenciadores de secrets. Se pedido para fazer diferente, recuse e explique o risco.

6. **SEGURANÇA POR DESIGN, NÃO POR OBSCURIDADE**: Se o sistema deixa de ser seguro porque alguém viu o código, ele nunca foi seguro. O código deve ser seguro mesmo com repositório público. Os únicos segredos devem ser variáveis de ambiente.

---

## A01 — BROKEN ACCESS CONTROL

- Controle de acesso SEMPRE no servidor, nunca apenas no cliente
- Negar por padrão (deny by default) — acesso deve ser explicitamente concedido
- Em TODA operação de leitura, edição e exclusão: verificar se o usuário autenticado é dono ou tem permissão sobre aquele recurso específico
- Proteger contra IDOR: nunca permitir acesso a recursos de outro usuário apenas trocando um ID
- Proteger contra escalação de privilégio vertical (user → admin) e horizontal (user A → user B)
- CORS restritivo — apenas domínios autorizados, nunca wildcard (*) em produção com credenciais
- Tokens/sessões: invalidar no servidor no logout, não apenas no cliente
- Proteger contra SSRF: validar e filtrar todas as URLs fornecidas pelo usuário antes de qualquer requisição server-side
- APIs: validar permissões em CADA endpoint, não apenas nas rotas do frontend

### Padrão Supabase para este projeto:

```typescript
// ✅ CORRETO — Sempre usar getUser() para autenticação
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

// ✅ CORRETO — Sempre filtrar por user_id
const { data } = await supabase
  .from("materials")
  .select("*")
  .eq("user_id", user.id); // NUNCA omitir este filtro

// ❌ PROIBIDO — Nunca usar getClaims() (não existe no SDK)
// ❌ PROIBIDO — Nunca confiar em IDs do body sem verificar ownership
```

---

## A02 — SECURITY MISCONFIGURATION

- Remover funcionalidades, páginas, endpoints e frameworks não utilizados
- Nunca expor stack traces, erros detalhados, nomes de tabela, versões de software ou informações de debug em produção
- Headers de segurança HTTP obrigatórios em toda resposta:
  - Content-Security-Policy (CSP) restritivo
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY (ou SAMEORIGIN se necessário)
  - Strict-Transport-Security (HSTS) com max-age longo
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy (restringir câmera, microfone, geolocalização, etc.)
- Desabilitar métodos HTTP desnecessários
- Nunca usar credenciais, senhas ou configurações padrão em nenhum ambiente
- Banco de dados: permissões mínimas por serviço/conexão
- RLS (Row Level Security) em TODAS as tabelas sem exceção
- Desabilitar listagem de diretórios
- Ambientes de desenvolvimento não devem ser acessíveis publicamente

### Padrão de Erro para Edge Functions:

```typescript
// ✅ CORRETO — Erro genérico para o cliente
return new Response(
  JSON.stringify({ error: "Internal error" }),
  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);

// ❌ PROIBIDO — Nunca expor detalhes internos
return new Response(JSON.stringify({ error: err.message, stack: err.stack }));
```

---

## A03 — SOFTWARE SUPPLY CHAIN FAILURES

- Usar lockfiles e commitá-los no repositório
- Preferir dependências com grande base de usuários, manutenção ativa e boa reputação
- Nunca importar bibliotecas obscuras, abandonadas ou sem verificação
- Verificar se as dependências não possuem vulnerabilidades conhecidas antes de usar
- Não executar scripts de pós-instalação de pacotes sem revisar
- Quando sugerir uma dependência, informar se há alternativas mais seguras ou nativas

---

## A04 — CRYPTOGRAPHIC FAILURES

- Senhas: SEMPRE Argon2id, bcrypt ou scrypt. NUNCA MD5, SHA-1, SHA-256 simples
- Dados em trânsito: HTTPS/TLS obrigatório. Desabilitar TLS 1.0 e 1.1
- Dados sensíveis em repouso: criptografia com algoritmo forte (AES-256-GCM ou equivalente)
- Nunca criar algoritmos criptográficos próprios — usar bibliotecas consolidadas
- Tokens, IDs de sessão, códigos de verificação: gerar com CSPRNG (crypto.randomUUID())
- Comparação de tokens e hashes: usar comparação em tempo constante (constant-time)
- Nunca logar senhas, tokens, chaves, dados de cartão ou dados pessoais sensíveis
- Chaves de criptografia em gerenciadores de secrets, nunca no código

---

## A05 — INJECTION

- **SQL Injection**: SEMPRE queries parametrizadas. NUNCA concatenar input do usuário em SQL
- **XSS (Cross-Site Scripting)**:
  - Sanitizar TODA entrada do usuário antes de renderizar
  - Usar encoding de saída apropriado ao contexto (HTML, JS, URL, CSS)
  - CSP restritivo como camada adicional
  - Nunca usar innerHTML, dangerouslySetInnerHTML, v-html com dados do usuário sem sanitização
- **Command Injection**: nunca executar comandos do SO com input do usuário
- **NoSQL Injection**: validar e tipificar queries
- **Template Injection**: nunca inserir input do usuário diretamente em templates server-side

### Padrão para este projeto:

```typescript
// ✅ CORRETO — Supabase usa parametrização automática
const { data } = await supabase.from("materials").select("*").eq("id", userInput);

// ❌ PROIBIDO — Nunca usar rpc com SQL concatenado
// ❌ PROIBIDO — Nunca usar innerHTML com dados do usuário não sanitizados
```

---

## A06 — INSECURE DESIGN

- Definir e implementar TODAS as regras de negócio no backend:
  - "Somente o dono pode editar/deletar seu recurso"
  - "Somente quem pagou pode acessar o conteúdo premium"
  - "Saldo/créditos não pode ficar negativo"
  - "Cupom/código só pode ser usado uma vez por usuário"
- Toda regra de negócio que envolve dinheiro, permissão ou acesso DEVE ter validação server-side explícita
- Pensar em cenários de abuso em cada feature: "o que acontece se um usuário mal-intencionado explorar isso?"

### Padrão de Créditos para este projeto:

```typescript
// ✅ CORRETO — Check atômico de créditos
if ((generationsLimit - generationsUsed) < creditCost) {
  return new Response(
    JSON.stringify({ error: "insufficient_credits" }),
    { status: 402 }
  );
}

// Deduct atomicamente APÓS o uso bem-sucedido
await supabase.from("profiles")
  .update({ generations_used: generationsUsed + creditCost })
  .eq("id", userId);
```

---

## A07 — IDENTIFICATION AND AUTHENTICATION FAILURES

- Usar Supabase Auth (provedor maduro e mantido)
- Rate limiting em login: lockout progressivo após tentativas falhas
- Mensagens de erro genéricas: "credenciais inválidas" (nunca separar email/senha)
- Tokens JWT:
  - Access tokens com expiração curta (15-30 min)
  - Refresh tokens com rotação
  - Validar em TODA requisição via `supabase.auth.getUser()`
  - Invalidar no servidor no logout
- MFA quando viável

---

## A08 — SOFTWARE AND DATA INTEGRITY FAILURES

- Nunca desserializar dados de fontes não confiáveis sem validação
- Verificar integridade de dependências (checksums, assinaturas)
- Usar Subresource Integrity (SRI) para scripts de CDNs
- Proteger pipelines CI/CD contra modificações não autorizadas
- Não confiar cegamente em webhooks — validar assinatura/origem

---

## A09 — SECURITY LOGGING AND ALERTING FAILURES

- Logar eventos de segurança: login, logout, falhas de auth, acessos negados, operações financeiras
- Formato estruturado (JSON) com: timestamp, userId, action, resource, result
- NUNCA logar: senhas, tokens, dados de cartão, dados pessoais sensíveis
- Logs protegidos contra alteração e exclusão

---

## A10 — MISHANDLING OF EXCEPTIONAL CONDITIONS

- Capturar e tratar TODAS as exceções
- Nunca expor detalhes internos em respostas de erro
- Retornar mensagens genéricas e seguras para o cliente
- Exceção não tratada = negação de acesso (fail closed)

---

## RACE CONDITIONS — PROTEÇÃO OBRIGATÓRIA

Para QUALQUER operação check-then-act:

- Usar transações atômicas no banco
- Para operações financeiras: SELECT FOR UPDATE ou equivalente
- Incrementos/decrementos: operações atômicas (`UPDATE x = x - 1 WHERE x >= 1`)
- UNIQUE CONSTRAINTS como defesa adicional
- Idempotency keys para operações críticas
- Rate limiting como camada adicional

**Cenários que DEVEM ser protegidos:**
- Compras, pagamentos, transferências
- Cupons e promoções de uso único
- Reembolsos e estornos
- Curtidas, votos, contadores
- Criação de recursos únicos (username, slug)
- Upgrades e downgrades de plano
- Links e convites de uso único

---

## VALIDAÇÃO DE INPUT — TODOS OS CAMPOS, TODOS OS ENDPOINTS

- TAMANHO MÁXIMO em todos os campos de texto
- TAMANHO MÁXIMO no body inteiro da requisição
- Validação de TIPO: número=número, email=email, UUID=UUID
- Validação de FORMATO com schemas tipados
- Sanitização contra HTML e scripts maliciosos
- Paginação: limitar page_size máximo
- Upload de arquivos:
  - Validar MIME type no header E nos magic bytes
  - Limitar tamanho máximo
  - Tipos permitidos via allowlist
  - Renomear com UUID, nunca usar nome original
  - Armazenar em storage externo (Supabase Storage)
  - Nunca executar arquivos do usuário

### Padrão de Validação para Edge Functions:

```typescript
// ✅ CORRETO — Validar e limitar input
const body = await req.json();
const passage = typeof body.passage === "string" ? body.passage.trim().slice(0, 500) : "";
const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";

if (!passage) {
  return new Response(JSON.stringify({ error: "passage is required" }), { status: 400 });
}
```

---

## PROTEÇÃO CONTRA ENUMERAÇÃO DE USUÁRIOS

- Login: "credenciais inválidas" (nunca diferenciar email/senha)
- Cadastro: "Se este e-mail não estiver cadastrado, você receberá um link"
- Recuperação de senha: "Se este e-mail estiver cadastrado, enviaremos instruções"
- Tempo de resposta consistente (timing-safe) em todas essas rotas
- Rate limiting agressivo em rotas de busca de usuários

---

## PROTEÇÃO DE DADOS E PRIVACIDADE (LGPD/GDPR)

- Coletar APENAS dados estritamente necessários (minimização)
- Implementar endpoints para o usuário: ver, corrigir, solicitar exclusão, exportar dados
- Dados sensíveis (religião, saúde) têm proteção reforçada
- Informar claramente quais dados são coletados (Política de Privacidade)
- Não compartilhar dados com terceiros sem consentimento
- Logs e backups incluídos na política de retenção e exclusão

---

## DEPLOY E INFRAESTRUTURA

- HTTPS obrigatório em produção
- Variáveis de ambiente para TODOS os secrets
- `.env` NUNCA commitado — sempre no `.gitignore`
- Incluir `.env.example` com valores fictícios
- CORS restritivo
- Rate limiting global e por endpoint
- Backups automáticos e testados
- Separação de ambientes (dev/staging/prod) com secrets distintos
- Containers: não rodar como root
- Manter dependências atualizadas

---

## REGRAS INEGOCIÁVEIS

1. Se pedido algo que comprometa segurança (hardcodar secrets, desabilitar validação, pular auth, expor dados), **RECUSAR** e explicar o risco.

2. Se pedido para "simplificar" removendo proteções, **RECUSAR** e sugerir simplificação que mantenha segurança.

3. Na dúvida se algo é seguro, **assumir que NÃO é** e implementar proteção.

4. **Auto-revisão mental** antes de entregar código: IDOR, injection, XSS, race conditions, dados expostos, secrets hardcoded, falta de validação, falta de autorização.

5. Ao corrigir bugs, **NUNCA remover ou enfraquecer** proteções existentes.

6. Para decisões de segurança: **biblioteca madura > implementação do zero**. Não reinventar auth, crypto ou sanitização.

7. Todo código deve sobreviver a estas perguntas:
   - E se eu trocar o ID por um de outro usuário?
   - E se eu mandar 100 requisições iguais ao mesmo tempo?
   - E se eu mandar 1 milhão de caracteres em qualquer campo?
   - E se eu colocar `<script>alert(1)</script>` em qualquer campo?
   - E se eu mandar `' OR 1=1 --` em qualquer campo?
   - E se eu acessar sem estar logado?
   - E se eu forjar ou manipular o token?
   - E se eu mandar uma URL externa onde deveria ser interna?
   - E se eu tentar a mesma operação financeira duas vezes ao mesmo tempo?
   - E se eu acessar/editar/deletar um recurso que não é meu?
   - E se eu enviar um `.exe` renomeado para `.jpg`?
   - E se eu inspecionar o response e encontrar dados de outros usuários?

8. Quando gerar testes, incluir SEMPRE testes de segurança além dos funcionais.

9. Ao sugerir dependências, preferir as mais utilizadas, mantidas e auditadas.

10. Aplicar TODAS estas regras silenciosamente. Se perguntado "por que fez assim?", explicar a motivação de segurança.
