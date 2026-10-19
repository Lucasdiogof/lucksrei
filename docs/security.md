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
| `/api/turnstile-config` | GET | devolve `{ enabled, sitekey }` (sitekey pública do Turnstile, da variável do Worker) | nenhum | barato; uma chamada por visita em que o formulário chega perto da tela | no-store | só GET (405), sem D1, sem secret nem estado de enforcement, mesmos cabeçalhos da API |
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
| `Strict-Transport-Security` | `max-age=2592000` (30 dias) | só HTTPS; **sem `includeSubDomains` e sem `preload`** de propósito |
| `Content-Security-Policy` (aplicada) | política completa (abaixo) | bloqueia recursos fora da allowlist |
| `Content-Security-Policy-Report-Only` | removida | a política completa foi promovida para enforcement |

### CSP completa (enforced)

```
default-src 'self'; script-src 'self' https://challenges.cloudflare.com;
style-src 'self' 'sha256-…' 'sha256-…'; style-src-attr 'unsafe-inline';
img-src 'self' data:; media-src 'self'; font-src 'self';
connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;
worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'
```

Por quê: o inventário das 20 páginas publicadas mostrou **zero** recursos externos, **zero** `<script>` inline executável, **zero** handlers `on*=`, nenhum iframe próprio. Existem 2 blocos `<style>` inline (liberados por hash) e atributos `style=""` (liberados só em `style-src-attr`). `data:` só em imagens. O único host externo necessário é o Turnstile. Sem `unsafe-eval`, sem curinga, sem `unsafe-inline` em script ou `<style>`.

Se você editar um `<style>` inline, o hash muda: `node tests/security.test.js` avisa e mostra qual.

**Produção confirmada em `https://lucksrei.com`.** Depois de desativar o Cloudflare Web Analytics/RUM (que injetava `static.cloudflareinsights.com`), foram verificados `/`, `/apps/`, `/contact/`, `/visitors/` e páginas de projetos em navegador real, sem violação CSP originada pelo site. Os avisos observados dentro do iframe do próprio Turnstile pertencem à política interna de `challenges.cloudflare.com`, não à CSP de Lucksrei. A política completa foi então promovida para `Content-Security-Policy` no commit `458bf53e8d3976fd22686fc2c0eab12e9199d2e8`.

Uma verificação externa posterior confirmou o cabeçalho completo em produção e nota **A** no SecurityHeaders. O Web Analytics permanece desativado; o site usa o contador próprio em D1.

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

Fluxo: o formulário (marcador `data-turnstile-contact`, **sem chave no HTML**) pede a sitekey a `GET /api/turnstile-config` quando se aproxima da tela → carrega o widget (modo **Managed**, `appearance: interaction-only`: sem CAPTCHA visual na maioria dos casos) → token → `POST /api/contact` → o Worker valida na Siteverify (`success`, hostname, action `contact`, timeout 5 s) → só então envia.

**Quem decide é só o servidor.** O front apenas tenta obter um token: se a rota de config falhar ou disser `enabled: false`, se o script não carregar (adblock, rede), o widget falhar ou o token não vier em ~4,5 s, o POST sai **sem token** e o servidor responde conforme estiver configurado. O front nunca bloqueia o envio por causa do Turnstile; enquanto espera, o botão fica em "Sending…" (`aria-busy`). Cada token vale uma tentativa: é consumido ao enviar e o widget é reiniciado depois (sucesso ou erro).

### Configuração (tudo no Worker; o HTML não leva chave)

| nome | tipo | valor | função |
|---|---|---|---|
| `TURNSTILE_SITE_KEY` | variável **pública** (Text) | a sitekey do widget | servida em `/api/turnstile-config`; sem ela o front nem carrega o widget |
| `TURNSTILE_SECRET_KEY` | **secret** | a secret key | só o servidor, para o Siteverify; nunca em HTML, JS, repositório, log ou resposta |
| `TURNSTILE_ENFORCE` | variável (Text) | `on` | torna o Turnstile obrigatório |
| `TURNSTILE_HOSTNAMES` | variável (opcional) | lista separada por vírgula | substitui `lucksrei.com,www.lucksrei.com`; `workers.dev`, `localhost`, `127.0.0.1` e `::1` são sempre ignorados |

`wrangler.jsonc` tem `"keep_vars": true`: sem isso o Wrangler trata o arquivo como fonte da verdade e **apaga** variáveis criadas só no painel no próximo deploy (comportamento descrito no esquema do próprio Wrangler). Com `keep_vars`, `TURNSTILE_SITE_KEY` e `TURNSTILE_ENFORCE` sobrevivem aos deploys automáticos. Secrets nunca são afetados. A sitekey é pública; nada além dela é servido pelo endpoint.

`GET /api/turnstile-config` responde `{ "enabled": true, "sitekey": "…" }` ou `{ "enabled": false, "sitekey": null }`. Só GET (405 nos outros), `no-store`, sem D1, sem rate limit próprio (barato), mesmos cabeçalhos de segurança da API. Uma sitekey fora do formato `[A-Za-z0-9_-]{8,100}` (depois do `trim`) nunca é servida e conta como ausente também para o enforcement; a válida é devolvida já normalizada. Custo: uma requisição do Worker por visita em que o formulário chega perto da tela (a rota **não** é chamada no carregamento da página).

### Condição exata de enforcement (servidor)

```js
turnstileRequired =
  env.TURNSTILE_ENFORCE === "on" &&
  getTurnstileSiteKey(env) !== null &&   // string, trim, /^[A-Za-z0-9_-]{8,100}$/
  getTurnstileSecret(env) !== null       // string, trim, não vazio
```

**Uma única regra para a sitekey:** `getTurnstileSiteKey` decide tanto o que `/api/turnstile-config` entrega ao front quanto se a sitekey conta como presente para o enforcement. Assim, uma sitekey que o front não consegue usar (ausente, vazia, só espaços, curta como `abc`, com caracteres inválidos ou longa demais) **nunca** ativa a exigência (há teste ponta a ponta no `/api/contact` e um teste que compara as duas decisões para uma lista de valores). O secret só precisa ser string não vazia depois do `trim` (espaço puro não é secret configurado); o formato dele não é validado porque não há especificação oficial confiável, e o valor normalizado é o enviado ao Siteverify. Nenhum valor é logado.

Só o valor exato `on` ativa (`ON`, `true`, `1` não). **Nada vindo do cliente decide se o Turnstile é obrigatório.** `TURNSTILE_ENFORCE=on` com qualquer chave ausente **ou inválida** é configuração incompleta: **não ativa** e registra um aviso sanitizado uma vez por isolate, citando só os **nomes** (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`), nunca valores. Isso é fail-open de **configuração**; com tudo completo, o Siteverify continua **fail-closed**: token ausente, inválido, expirado, reutilizado, hostname ou action errados → 400 `captcha`; Siteverify indisponível ou lento (> 5 s) → 503 `captcha_unavailable`. Nunca vira bypass. A presença da sitekey é só *readiness*; a segurança real é o token + Siteverify (`success === true`, hostname, action `contact`, uso único, validade). Token: string, não vazia, ≤ 2048 caracteres, validado antes de chamar a Cloudflare. O `remoteip` **não** é enviado ao Siteverify (opcional; o IP só continua como hash nos contadores).

### Matriz de estados

| | sitekey (Worker) | secret | enforce | resultado |
|---|---|---|---|---|
| A | não | não | off | fluxo antigo; nenhum widget nem script de terceiros |
| B | sim | não | off | widget aparece; token pode ser gerado; servidor ignora; widget falho **não** bloqueia o envio |
| C | sim | sim | off | preparação completa; formulário envia mesmo se o Turnstile falhar; ainda não obrigatório |
| D | sim | sim | **on** | **obrigatório**: token validado no servidor; sem token/inválido → nada é enviado |
| E | não | sim | off | fluxo antigo |
| F | não | sim | on | configuração incompleta: aviso, **não exige**, formulário funciona |
| G | sim | não | on | configuração incompleta: aviso, **não exige**, formulário funciona |
| H | não | não | on | idem F/G |

Não existe combinação de configuração incompleta que derrube o formulário. Única situação em que o formulário recusa é o estado D de verdade (tudo configurado e ligado) quando o visitante não consegue um token (script bloqueado, rota de config indisponível, widget mudo): aí a recusa é o comportamento pretendido (falha fechada) e a mensagem pede para tentar de novo.

### Tema e idioma
O widget é renderizado com o tema real do site (`data-theme` de `<html>`, o mesmo que `theme-boot.js` define) e com o idioma atual (PT/EN/ES). Quando o botão de tema alterna (`data-theme` muda) ou o evento `lucksrei:locale` dispara, o widget é removido e renderizado de novo (o Turnstile não tem troca de tema/idioma "in place"); o token é refeito sozinho.

### Ativação (ordem; nenhum deploy de HTML é necessário)
1. **Criar o widget** em Cloudflare → Turnstile: tipo **Managed** (não Invisible), hostnames `lucksrei.com` e `www.lucksrei.com` (nada de `workers.dev`).
2. No Worker `lucksrei-site` → *Settings → Variables and Secrets*, criar a variável de texto `TURNSTILE_SITE_KEY` com a Site Key. `TURNSTILE_ENFORCE` continua ausente/`off`.
3. Verificar no site publicado: o widget aparece; celular; PT/EN/ES; tema claro/escuro; console sem violação CSP originada pelo site.
4. Criar o secret `TURNSTILE_SECRET_KEY` (tipo *Secret*). `TURNSTILE_ENFORCE` ainda ausente/`off`.
5. Enviar uma mensagem real ainda com enforcement desligado e conferir que chega.
6. **Só depois**, definir `TURNSTILE_ENFORCE` = `on`. Conferir Siteverify, Resend, caixa de entrada e o Turnstile Analytics.

### Rollback (imediato, sem deploy)
- **Principal:** `TURNSTILE_ENFORCE=off` (ou remover a variável): a exigência some na hora.
- Remover o secret **ou** a sitekey também deixa o Turnstile não obrigatório.
- Para tirar o widget da tela: remover `TURNSTILE_SITE_KEY` (o front para de carregá-lo na próxima visita).

### Limitações conhecidas
- Mudança de idioma ou tema recria o widget (ver acima); não há troca "in place".
- A CSP completa está em enforcement. O Turnstile real, Siteverify e o envio real por Resend foram validados no domínio customizado.
- No estado D, o formulário depende da disponibilidade da rota de config, da Cloudflare (script e Siteverify) e do navegador permitir o widget.

## Cloudflare: estado do painel

Estado conferido manualmente no painel em 17/10/2026:

| item | estado | observação / reversão |
|---|---|---|
| Free Managed Ruleset | **Sempre ativo** | proteção gerenciada da Cloudflare; não alterar |
| Proteção contra DDoS | **automática** | camada da Cloudflare antes do Worker |
| Rate limiting de borda | **ativo**: `rate-limit-contact` | `http.request.uri.path eq "/api/contact"`; 5 req / 10 s; chave por IP/colo; **Block** por 10 s. Atua antes do Worker. Reverter: desativar a regra |
| Monitoramento contínuo de script | **ON** | monitora mudanças/injeções de JavaScript |
| Obfuscação de endereço de e-mail | **ON** | mantida |
| Bot Fight Mode | **OFF** | mantido desligado para não arriscar App Links, previews e tráfego legítimo |
| AI Labyrinth | **OFF** | mantido |
| Precursor | **OFF** | mantido |
| Detecção de credenciais vazadas | **OFF** | não há login no site |
| Hotlink Protection | **OFF** | evita quebrar OG/previews e uso legítimo das imagens |
| Web Analytics / RUM | **OFF** | desativado para remover a injeção de `static.cloudflareinsights.com` e manter a CSP fechada |
| Under Attack Mode | **OFF normalmente** | usar só em ataque ativo e desligar depois |

### Bot Fight Mode: por que continua desligado
No plano gratuito ele oferece pouca margem para exceções e trata como bot o tráfego não verificado. O site publica `/.well-known/apple-app-site-association` e `assetlinks.json`, buscados por servidores da Apple e do Google, e recebe prévias de link (WhatsApp, Slack, LinkedIn). Esses clientes podem ser bloqueados e quebrar os App Links dos apps.

### workers.dev e URLs de preview
Existem: o check do GitHub (Workers Builds) e o comentário do PR #5 mostraram `*.workers.dev` e *Preview URLs* ativos para este Worker. Riscos: uma cópia pública do site e da API sem as regras do domínio, **sem o Cache API** (o limite por cache do contato não funciona em `workers.dev`), compartilhando D1 e o secret do Resend. O que sustenta desligar: nada no repositório referencia `workers.dev` (apps, App Links e SEO usam `lucksrei.com`).

Não alterei a configuração porque não consigo confirmar o domínio personalizado. **Antes de desligar, confirme:** Worker `lucksrei-site` → *Settings → Domains & Routes* mostra `lucksrei.com` como **Custom Domain**. Então desligue ali *workers.dev* e *Preview URLs*. Para que o próximo build não reative, fixe no `wrangler.jsonc`:

```jsonc
"workers_dev": false,
"preview_urls": false
```

Efeito colateral: PRs deixam de ter URL de preview. Reverter: `true` (ou religar no painel).

## GitHub

Estado conferido em 17/10/2026:

- repositório público;
- **Dependency graph: ON**;
- **Dependabot alerts: ON**;
- **Dependabot security updates: ON**;
- **Grouped security updates: ON**;
- Dependabot version updates: não configurado (não há manifest de dependências útil hoje);
- **CodeQL: Default setup ativo**, com scan concluído;
- **Copilot Autofix: ON**;
- AI Scan for pull requests: OFF;
- Agentic autofix: OFF;
- **Secret Protection / Secret Scanning: ON**;
- **Push Protection: ON**;
- Private vulnerability reporting: OFF;
- a UI atual não expôs controles separados para *Validity checks* nem *Non-provider patterns*;
- **nenhum ruleset** por decisão do proprietário; push direto na `main` continua permitido.

Não há `package.json` nem GitHub Actions no projeto, então o Dependabot tem pouco a escanear hoje.

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
| Cabeçalhos / CSP | apagar a linha do cabeçalho em `_headers` e fazer push (deploy automático); a CSP completa é aplicada (bloqueia o que não está na política), então reverter é apagar a linha `Content-Security-Policy` |
| Limites de aplicação | remover o bloco `ratelimits` do `wrangler.jsonc` (o código já passa sem binding) |
| Turnstile | `TURNSTILE_ENFORCE=off` (imediato, sem deploy); remover o secret ou `TURNSTILE_SITE_KEY` também desativa a exigência |
| Regras da Cloudflare | desativar a regra no painel |
| Ruleset do GitHub | desativar/apagar o ruleset |

## Status de validação

### Local
- 10 arquivos de teste passando (`for t in tests/*.test.js; do node $t; done`).
- 71 checks em `tests/turnstile.test.js`.
- 71 verificações em Chromium local, com a CSP aplicada.
- `wrangler deploy --dry-run` e `wrangler dev --local` (Wrangler 4.151.1).

### Produção — `https://lucksrei.com`
- `/`, `/apps/`, `/contact/`, `/visitors/` e páginas de projetos respondendo 200 em smoke tests externos.
- `GET /api/turnstile-config` responde 200 com `enabled:true` e apenas a sitekey pública.
- Turnstile real validado em PT-BR, EN, ES e mobile; widget Managed com `appearance: interaction-only`.
- Enforcement real validado: POST válido sem token → 400 `captcha`; token inválido → 400 `captcha`.
- Fluxo positivo real validado: token válido → Siteverify → Resend → e-mail recebido.
- Cloudflare Web Analytics/RUM desativado; `static.cloudflareinsights.com/beacon.min.js` não é mais injetado.
- CSP completa promovida para enforcement no commit `458bf53e8d3976fd22686fc2c0eab12e9199d2e8`.
- Verificação externa do cabeçalho em produção confirmou a CSP completa, HSTS, `X-Frame-Options`, `Permissions-Policy`, COOP, nosniff e `Referrer-Policy`; nota A no SecurityHeaders. Depois disso, o HSTS foi aumentado no repositório para `max-age=2592000` (30 dias), sem `includeSubDomains` nem `preload`.
- **Headers das APIs confirmados**: CSP `default-src 'none'; frame-ancestors 'none'`, `X-Frame-Options: DENY`, nosniff e `Referrer-Policy: no-referrer`.

### Estado final / opcionais
- Rate limiting de borda da Cloudflare ativo em `/api/contact`: 5 requisições / 10 s, bloqueio de 10 s, além das camadas internas do Worker.
- GitHub security hardening concluído: Dependabot alerts/security updates/grouped updates, CodeQL Default setup, Copilot Autofix, Secret Protection e Push Protection ativos.
- HSTS configurado em `max-age=2592000` (30 dias). Próxima elevação para 6–12 meses é opcional e deve ser feita só após período estável.
- Ruleset de proteção da `main` permanece opcional e **não foi implementado por decisão do proprietário**.
- Teste de estresse deliberado dos rate limits não foi executado para evitar bloqueio desnecessário e tráfego artificial em produção.

## Verificação

- Código: `for t in tests/*.test.js; do node $t; done`
- Site publicado: `node tools/check-security.mjs https://lucksrei.com` (opcional `--workers-dev <url>`).
