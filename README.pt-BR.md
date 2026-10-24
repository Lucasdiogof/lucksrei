<p align="center">
  <img src="assets/img/brand/lucksrei-md.webp" width="160" alt="Lucksrei">
</p>

<h1 align="center">lucksrei.com</h1>

<p align="center">
  Portfólio de Lucas Diogo França, engenheiro mobile, e casa dos apps e sistemas da Lucksrei.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML-E34F26?logo=html5&logoColor=white" alt="HTML">
  <img src="https://img.shields.io/badge/CSS-1572B6?logo=css3&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/Cloudflare_D1-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare D1">
</p>

<p align="center">
  <a href="README.md">English</a> · <b>Português</b> · <a href="README.es.md">Español</a>
</p>

---

Site estático, sem etapa de build e sem framework: HTML, CSS e JavaScript puros servidos pelo Cloudflare Workers Static Assets. Um Worker pequeno responde só `/api/*` (estatística de visitas, formulário de contato, calendário do GitHub). No ar em **[lucksrei.com](https://lucksrei.com)**.

## O que tem no site

| Página | Conteúdo |
| --- | --- |
| `/` | Início: cena em pixel art no hero, cases, habilidades técnicas com evidências, mapa de visitantes e contato |
| `/apps/` | Todos os apps e sistemas da Lucksrei, com abas, links das lojas e dos apps web |
| `/projects/<app>/` | Case de cada app (Aprovaura, Bebômetro, BusãoGyn, Fan Hub, La Pelve, Match Queue, OrbiJob, StockPort) e as páginas de privacidade, suporte e exclusão de dados |
| `/privacy/`, `/terms/`, `/support/` | Páginas gerais de privacidade, termos e suporte dos sistemas licenciados |
| `/contact/` | Formulário de contato (Resend, Turnstile opcional) |
| `/visitors/` | Visitas agregadas por país e estado/região |

O site inteiro está em **inglês, português e espanhol** (`assets/i18n/{en,pt-BR,es}.js`), com screenshots por idioma (`assets/js/screenshots-data.js`) e temas claro e escuro.

## Arquitetura

```text
index.html, apps/, projects/, ...   páginas estáticas (servidas direto, sem custo de Worker)
assets/css/style.css                tokens de design (:root) e todos os estilos
assets/js/                          scripts das páginas: i18n, hero, apps, skills, visitantes, contato
assets/i18n/                        dicionários en, pt-BR e es
worker/                             Worker só para /api/* (run_worker_first)
migrations/                         schema do D1 (lucksrei-visits)
tests/                              testes em Node, sem dependências
tools/                              geradores de assets (marca, hero, mapas, vídeos dos apps, capturas)
docs/                               notas internas (não são servidas)
```

### API

| Endpoint | O que faz |
| --- | --- |
| `POST /api/visit` | conta uma visita por mês, país e região no D1 (filtra robôs e datacenters, com limite de taxa) |
| `GET /api/visitors` | agregados dos últimos 12 meses (cache de borda de 5 min) |
| `GET /api/whoami` | país e região do próprio visitante |
| `POST /api/contact` | valida e envia o e-mail de contato (limites, honeypot, Turnstile quando ativado) |
| `GET /api/turnstile-config` | sitekey pública do Turnstile e se ele está ligado |
| `GET /api/github-contributions` | calendário de contribuições do GitHub (cache de borda de 6 h) |

Toda resposta da API leva cabeçalhos de segurança rígidos (`worker/security.mjs`); as páginas estáticas recebem os delas pelo `_headers`. Modelo de ameaças completo e rollbacks: [docs/security.md](docs/security.md).

## Rodar localmente

Requer Node.js 22 e Wrangler.

```bash
npx wrangler dev --local          # site + API em http://localhost:8787
npx wrangler d1 migrations apply lucksrei-visits --local
```

As páginas também abrem num servidor estático qualquer; só `/api/*` precisa do Worker.

### Configuração

Definida no Worker (`Settings → Variables and Secrets`), nunca no repositório. O `wrangler.jsonc` usa `keep_vars` para as variáveis do painel sobreviverem aos deploys.

| Nome | Tipo | Para quê |
| --- | --- | --- |
| `RESEND_API_KEY` | secret | envia o e-mail de contato pelo Resend |
| `CONTACT_TO` / `CONTACT_FROM` | variável (opcional) | substitui os endereços padrão do contato |
| `TURNSTILE_SITE_KEY` | variável (pública) | widget do Turnstile |
| `TURNSTILE_SECRET_KEY` | secret | Siteverify do Turnstile |
| `TURNSTILE_ENFORCE` | variável | `on` torna o Turnstile obrigatório |
| `GITHUB_TOKEN` | secret (opcional) | GraphQL do GitHub para o calendário (sem ele, a página pública do perfil é lida) |

## Testes

```bash
for f in tests/*.test.js; do node "$f"; done
```

O mesmo laço roda no CI (`.github/workflows/site-tests.yml`) a cada push. Os testes cobrem paridade de i18n, screenshots por idioma, o dataset de apps, layout das páginas legais, cabeçalhos de segurança, o formulário de contato, o Turnstile e a API de visitantes.

## Deploy

Push na `main` publica pelo Cloudflare Workers Builds. O `.assetsignore` deixa o código do Worker, testes, ferramentas, docs e estes READMEs fora dos assets públicos.

## Documentação

- [DESIGN.md](DESIGN.md): design system "Royal Tech": cores, tipografia, espaçamento, componentes
- [docs/security.md](docs/security.md): superfície da API, limites, cabeçalhos, Turnstile, rollback
- [docs/visitor-analytics.md](docs/visitor-analytics.md): contagem de visitas e o mapa
- [docs/hero-v3.md](docs/hero-v3.md): a cena em pixel art do hero

## Licença

Nenhuma licença open source é concedida. O código é público como parte de um portfólio; todos os direitos reservados. A logo e os assets da marca Lucksrei não podem ser reutilizados.

---

Criado por Lucas Diogo França.
