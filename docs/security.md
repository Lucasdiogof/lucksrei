# Segurança do lucksrei.com

Escopo: só infraestrutura e segurança. Nada aqui muda visual, textos, SEO ou URLs públicas. Tudo usa recursos gratuitos.

## Superfície pública (`/api/*`)

Arquivos estáticos (HTML, CSS, JS, imagens, vídeos) são servidos pelo Workers Static Assets e **não consomem requisições do Worker**. Só `/api/*` roda o Worker (`run_worker_first`), então é onde a quota do Worker é gasta e onde os recursos a jusante (D1, Resend, GitHub) são tocados.

| endpoint | método | operação | recurso externo | custo/risco | cache | proteção |
|---|---|---|---|---|---|---|
| `/api/visit` | POST | grava 1–2 linhas no D1 (mês/país/região) | D1 | escrita; é o alvo mais óbvio de abuso | no-store | mesma origem, filtro de bot (UA), de datacenter (ASN e nome da rede), **limite de aplicação 30/min por IP e 300/min compartilhado por localização (colo, não global) antes do D1**; acima do limite responde 204 sem gravar |
| `/api/visitors` | GET | lê agregados do D1 | D1 | leitura | borda 5 min | cache de borda de 5 min (sem limite próprio) |
| `/api/whoami` | GET | devolve país/região do próprio `request.cf` | nenhum | barato | no-store | nenhuma além do custo mínimo (sem limite próprio) |
| `/api/contact` | POST | valida e envia e-mail | Resend (+ Turnstile Siteverify) | e-mail e reputação do domínio | no-store | **limite de aplicação 10/min por IP** (só rajadas), mesma origem, JSON, ≤ 8 KB, honeypot, tempo mínimo, 3/10 min e 10/dia por IP, 40/h global, validação, Turnstile (quando ativado) |
| `/api/github-contributions` | GET | calendário do GitHub | GitHub (API/HTML) | quota externa | borda 6 h, falha 60 s | rota ativa como antes (a seção está oculta na home e o script comentado); o cache absorve as chamadas, sem limite próprio |
| qualquer outro `/api/*` | todos | 404 JSON | nenhum | nenhum | no-store | cabeçalhos de segurança |

Toda resposta da API leva: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Cross-Origin-Resource-Policy: same-origin`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` (`worker/security.mjs`).

## Cabeçalhos das páginas (`_headers`)

| cabeçalho | valor | efeito |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | o navegador não adivinha tipos |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | links externos recebem só a origem |
| `X-Frame-Options` + CSP `frame-ancestors 'none'` | `DENY` | o site não pode ser embutido (clickjacking) |
| `Permissions-Policy` | câmera, microfone, localização, pagamento, USB, captura de tela e sensores desligados | o site não usa nenhum |
| `Cross-Origin-Opener-Policy` | `same-origin` | isola a janela de outras origens |
| `Strict-Transport-Security` | `max-age=604800` (7 dias) | só HTTPS; **sem `includeSubDomains` e sem `preload`** de propósito |
| `Content-Security-Policy` (aplicada) | `base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'` | diretivas que não afetam o carregamento |
| `Content-Security-Policy-Report-Only` | política completa (abaixo) | só observa, não bloqueia |

### CSP completa (em Report-Only)

```
default-src 'self'; script-src 'self' https://challenges.cloudflare.com;
style-src 'self' 'sha256-…' 'sha256-…'; style-src-attr 'unsafe-inline';
img-src 'self' data:; media-src 'self'; font-src 'self';
connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;
worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'
```

Por quê: o inventário das 20 páginas publicadas mostrou **zero** recursos externos, **zero** `<script>` inline executável, **zero** handlers `on*=`, nenhum iframe. Existem 2 blocos `<style>` inline (liberados por hash) e atributos `style=""` (liberados só em `style-src-attr`). `data:` só em imagens (um fundo SVG no CSS). O único host externo é o do Turnstile. Sem `unsafe-eval`, sem curinga, sem `unsafe-inline` em script ou `<style>`.

Se você editar um `<style>` inline, o hash muda: `node tests/security.test.js` avisa e mostra qual.

**Por que Report-Only:** validei com a política aplicada em Chromium (20 páginas × PT/EN/ES + modais, formulário, mapa): zero violações. Mas não consigo ver a produção nem o Turnstile real daqui, e a Cloudflare pode injetar scripts por conta própria (ex.: Web Analytics). Por isso a política completa só observa. **Para promover:** abra o site com o DevTools (Console) em `/`, `/apps/`, `/contact/`, `/visitors/`; se não aparecer nenhum `Content Security Policy`/`Report Only`, troque o nome do cabeçalho `Content-Security-Policy-Report-Only` por `Content-Security-Policy` (unindo com a linha aplicada) e faça push.

## Camadas de limitação: o que cada uma faz e o que não faz

**Workers Rate Limiting Binding** (`ratelimits` em `wrangler.jsonc`, usado em `worker/security.mjs`)
- roda **dentro do Worker**, depois que ele já foi invocado;
- protege recursos a jusante (D1, Resend), não evita a invocação do Worker;
- **não poupa** requisições do Worker nem é anti-DDoS;
- o contador é **local a cada localização (colo) da Cloudflare**; nada é global no mundo todo;
- a chave por IP é o hash do IP (nunca gravado). IP não é a chave ideal onde vários visitantes legítimos compartilham o endereço (NAT, operadora móvel, empresa, universidade, VPN), por isso os limites por IP são folgados;
- **falha aberta**: sem o binding (build antigo, `wrangler dev`, testes) ou se ele falhar, a requisição passa. Escolhido porque um defeito do limitador nunca deve derrubar o site nem o formulário.

**Cloudflare WAF / Rate Limiting Rules** (no painel, na zona)
- camada futura a avaliar;
- pode agir **antes** do Worker, então é a que protegeria a quota de requisições;
- depende dos recursos realmente disponíveis no plano atual: **não confirmei** o que o plano gratuito oferece, e nada foi configurado. O item do checklist abaixo é uma proposta a validar no painel.

### Bindings e limites em uso

| binding | limite | período | chave | onde | ao exceder | justificativa |
|---|---|---|---|---|---|---|
| `RL_VISIT` | 30 | 60 s | hash do IP | `/api/visit` | 204, nada gravado no D1 | o beacon dispara 1 vez por página; 30/min cobre NAT de escritório/campus. Falso positivo só deixa de contar visitas |
| `RL_VISIT_COLO` | 300 | 60 s | chave única compartilhada por localização (**não global**) | `/api/visit` | 204, nada gravado no D1 | teto de rajada de escritas no D1 por localização, mesmo com muitos IPs |
| `RL_CONTACT` | 10 | 60 s | hash do IP | `/api/contact` | 429 + `Retry-After: 60` | só rajadas, antes de ler o corpo, validar, Turnstile ou chamar o Resend |

Limites deliberadamente **sem** binding:
- `/api/visitors`: já tem cache de borda de 300 s, que protege o D1; limitar por IP só geraria falso positivo.
- `/api/whoami`: usa apenas `request.cf`, não toca D1 nem serviço externo.
- `/api/github-contributions`: o cache absorve praticamente tudo (ver abaixo).

**O que `RL_VISIT_COLO` não é** (mantido em 300/60 s por decisão do dono do site):
- não é global: o contador é de uma localização Cloudflare;
- não protege a quota de requisições do Worker (roda depois da invocação);
- não garante proteção contra ataque distribuído;
- não impede o esgotamento sustentado do D1 em vários colos: 300/min mantidos por um dia são cerca de 432 mil escritas por localização, muito acima do orçamento diário gratuito do D1 (a cota exata não foi confirmada aqui);
- serve apenas como contenção de rajadas dentro de uma localização. O mesmo vale, em escala menor, para `RL_VISIT` (30/min por IP). Para isso é preciso a camada de WAF acima.

### `/api/contact`: quais requisições incrementam cada camada

Na ordem em que são avaliadas:

| ordem | camada | incrementa quando | não incrementa |
|---|---|---|---|
| 1 | filtros sem contador: método POST, mesma origem, `Content-Type` JSON, `Content-Length` ≤ 8 KB, provedor configurado | n/a | n/a |
| 2 | `RL_CONTACT` (10/min por IP) | **toda** requisição que passou da camada 1, inclusive corpo inválido, honeypot e tempo mínimo | requisições barradas na camada 1 |
| 3 | corpo ≤ 8 KB, JSON, honeypot, tempo mínimo, validação, Turnstile (se ativo) | n/a | n/a |
| 4 | 3 / 10 min por IP (cache) | só envios que passaram da camada 3 | tentativas inválidas, honeypot, Turnstile recusado |
| 5 | 10 / dia por IP (cache) | idem, e só se a camada 4 passou | idem |
| 6 | 40 / hora global (cache; por localização) | idem, e só se as camadas 4 e 5 passaram | idem |

Notas:
- as camadas 4 a 6 incrementam **antes** de o Resend ser chamado, então uma falha de entrega (502) também consome o contador;
- se a camada 6 barrar, os contadores 4 e 5 já foram incrementados;
- como `RL_CONTACT` é bem mais frouxo que as camadas 4 a 6 e só observa rajadas, não há comportamento contraditório: quem envia a mensagem uma vez nunca chega perto dos 10/min.

### `/api/github-contributions`: por que sem limite próprio

Com resposta em cache, 60 chamadas seguidas fazem 1 ida ao GitHub (teste em `tests/github.test.js`). O cache de borda dura 6 h, há cópia antiga por até 7 dias, e uma falha fica 60 s em cache. Ressalva real: o cache é por localização, então duas requisições simultâneas num cache vazio podem ir ambas ao GitHub (o fragmento é público e leve), e em `*.workers.dev` não há Cache API (ver a seção de workers.dev). Não criei limitador porque o ganho seria só para a invocação já feita.

## Turnstile no contato

Fluxo: navegador → widget Turnstile (sem CAPTCHA visual na maioria dos casos) → token → `POST /api/contact` → o Worker valida na Siteverify (`success`, hostname, action `contact`, timeout 5 s) → só então envia. Qualquer falha rejeita (falha fechada). Honeypot, tempo mínimo, limites e validação continuam.

**Estado: código pronto e DESLIGADO.** Para ativar, **nesta ordem** (invertida, o formulário recusa todos os envios):

1. Cloudflare → **Turnstile** → *Add widget*: nome `lucksrei-contact`, hostnames `lucksrei.com` e `www.lucksrei.com` (não inclua `workers.dev`), modo *Managed*. Copie a **Site Key** (pública) e a **Secret Key**.
2. Coloque a Site Key em `data-turnstile-sitekey=""` nos dois formulários (`index.html` e `contact/index.html`), commit e push. O widget passa a carregar perto do formulário. Confira no DevTools que não há violações de CSP.
3. Só depois, no Worker `lucksrei-site` → *Settings → Variables and Secrets* → *Add* tipo **Secret** `TURNSTILE_SECRET_KEY` (ou `npx wrangler secret put TURNSTILE_SECRET_KEY`). Opcional: `TURNSTILE_HOSTNAMES` (lista separada por vírgula; padrão `lucksrei.com,www.lucksrei.com`).
4. Envie uma mensagem real pelo site e confira que chegou.

**Reverter:** apagar o secret `TURNSTILE_SECRET_KEY` desliga a verificação na hora, sem deploy. Para tirar o widget, deixe o `data-turnstile-sitekey` em branco.

## Cloudflare: o que fica no painel (o repositório não alcança)

Não tive acesso autenticado à Cloudflare nesta sessão, então **nada abaixo foi alterado nem lido**: o estado "antes" precisa ser conferido por você. Sempre anote ANTES → DEPOIS.

| item | onde | recomendação | observação / reversão |
|---|---|---|---|
| SSL/TLS | SSL/TLS → Overview | modo **Full (strict)**; *Always Use HTTPS* ligado; *Minimum TLS* 1.2 | Reverter: voltar ao valor anterior. Full (strict) exige certificado válido na origem (Workers já tem) |
| DNSSEC | DNS → Settings | ativar e copiar o **DS** para o registrador | só vale quando o DS estiver no registrador; reverter: remover o DS no registrador **antes** de desativar |
| WAF / managed rules | Security → WAF | Free Managed Ruleset (já automático no plano gratuito) | conferir se está ativo |
| Regra de rate limiting (a avaliar) | Security → WAF → Rate limiting rules | proposta: `starts_with(http.request.uri.path, "/api/")` → 40 req / 10 s por IP → Block por 10 s | única camada que atua antes do Worker (os bindings do código não atuam). **Não confirmei** quantas regras nem quais opções o plano gratuito permite. Reverter: desativar a regra |
| Regra personalizada (opcional) | Security → WAF → Custom rules | *Block* para `/.env`, `/.git`, `/wp-login.php`, `/xmlrpc.php`, `/wp-admin` | reduz ruído de scanners; nenhuma dessas rotas existe no site |
| Bot Fight Mode | Security → Bots | **deixar desligado por enquanto** | veja abaixo |
| Under Attack Mode | Security → Settings | **só em ataque ativo**, depois desligar | desafia todo visitante |
| Alertas de quota | Workers & Pages → Plans/Usage + Notifications | notificação de uso do Worker/D1 | evita surpresa; a quota gratuita é 100 mil requisições/dia |

### Bot Fight Mode: por que não ativei nem recomendo agora
No plano gratuito ele oferece pouca margem para exceções e trata como bot o tráfego não verificado. O site publica `/.well-known/apple-app-site-association` e `assetlinks.json`, buscados por servidores da Apple e do Google, e recebe prévias de link (WhatsApp, Slack, LinkedIn). Esses clientes podem ser bloqueados e quebrar os App Links dos apps. Se quiser testar: ative, olhe *Security → Events* por alguns dias, valide `https://app-site-association.cdn-apple.com/a/v1/lucksrei.com` e as prévias de link, e desative se aparecer bloqueio.

### workers.dev e URLs de preview
Existem: o check do GitHub (Workers Builds) e o comentário do PR #5 mostraram `*.workers.dev` e *Preview URLs* ativos para este Worker. Riscos: uma cópia pública do site e da API sem as regras do domínio, **sem o Cache API** (o limite por cache do contato não funciona em `workers.dev`), compartilhando D1 e o secret do Resend. O que sustenta desligar: nada no repositório referencia `workers.dev` (apps, App Links e SEO usam `lucksrei.com`).

Não alterei a configuração porque não consigo confirmar o domínio personalizado. **Antes de desligar, confirme:** Worker `lucksrei-site` → *Settings → Domains & Routes* mostra `lucksrei.com` como **Custom Domain**. Então desligue ali *workers.dev* e *Preview URLs*. Para que o próximo build não reative, fixe no `wrangler.jsonc`:

```jsonc
"workers_dev": false,
"preview_urls": false
```

Efeito colateral: PRs deixam de ter URL de preview. Reverter: `true` (ou religar no painel).

## GitHub

Estado confirmado por leitura (API do repositório): repo público; **Secret Scanning ligado; Push Protection ligado**; Dependabot security updates **desligado**; Secret Scanning *non-provider patterns* e *validity checks* desligados; **nenhum ruleset e nenhuma proteção de branch**. Não há `package.json` nem GitHub Actions, então o Dependabot tem pouco a escanear.

A sessão não pode escrever nessas configurações. Para proteger a `main` contra acidentes **sem exigir PR e sem bloquear push normal nem o deploy da Cloudflare**:

1. Settings → Rules → Rulesets → *New ruleset* → *Import a ruleset* → envie `docs/ruleset-main.json`.
2. Ele aplica na branch padrão: **bloquear exclusão** e **bloquear force-push** (`non_fast_forward`). Sem *Require pull request*, sem aprovações, sem commits assinados.
3. Reverter: apagar o ruleset ou colocar *Enforcement* em *Disabled*.

Extras gratuitos recomendados: Settings → Code security → *Dependabot alerts* e *security updates*, *Secret scanning → Validity checks* e *Non-provider patterns*, *Private vulnerability reporting*.

## Segredos

Auditoria por padrões (GitHub, AWS, Resend, Turnstile, Slack, Google, Stripe, chaves privadas, JWT, atribuições genéricas) na árvore e em todo o histórico, e por nomes de arquivo sensíveis: **nenhum segredo real**. Os únicos achados são strings fictícias em `tests/`. `.gitignore` agora também cobre `.dev.vars*`, `*.pem` e `*.key`. Segredos usados só pelo nome: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` (quando ativado), `GITHUB_TOKEN` (opcional). Todos vivem apenas no Worker.

## Checklist manual de contas e domínio

- **GitHub:** 2FA (de preferência passkey), recovery codes guardados, sessões e tokens pessoais revisados.
- **Cloudflare:** 2FA/passkey, membros e sessões ativas, **tokens de API com menor privilégio** e validade, nenhum *Global API Key*.
- **Registrador do domínio:** 2FA, *Registrar Lock* ligado, DS do DNSSEC publicado, e-mail de contato do domínio monitorado.
- **Resend:** 2FA e chave de API restrita a envio.

## Rollback rápido

| mudança | como voltar |
|---|---|
| Cabeçalhos / CSP | apagar a linha do cabeçalho em `_headers` e fazer push (deploy automático); a CSP completa está em Report-Only e não bloqueia |
| Limites de aplicação | remover o bloco `ratelimits` do `wrangler.jsonc` (o código já passa sem binding) |
| Turnstile | apagar o secret `TURNSTILE_SECRET_KEY` (imediato) |
| Regras da Cloudflare | desativar a regra no painel |
| Ruleset do GitHub | desativar/apagar o ruleset |

## Verificação

- Código: `for t in tests/*.test.js; do node $t; done`
- Produção: `node tools/check-security.mjs https://lucksrei.com` (opcional `--workers-dev <url>`).
