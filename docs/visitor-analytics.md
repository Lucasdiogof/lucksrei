# Visitantes — estatísticas agregadas por país

Nota de manutenção da feature de visitantes (mapa na home e em `/visitors/`). Documento interno: `docs/` está no `.assetsignore` e não é servido pelo site.

## 1. Arquitetura

- O Worker `lucksrei-site` (`worker/index.mjs`) só roda em `/api/*` (`run_worker_first` em `wrangler.jsonc`); o resto é servido direto pelos assets.
- `POST /api/visit` — conta uma visita no mês UTC e país atuais. Responde sempre `204`; falha de banco nunca afeta a página. Só conta chamada com `Origin` do próprio site e user-agent que não pareça robô (filtro de ruído, não segurança).
- `GET /api/visitors` — agregados dos últimos 12 meses: `total_visits`, `countries_count`, `updated_at`, `since`, `window_months`, `countries[{code, visits}]`.
- `GET /api/whoami` — `{ country }` do próprio visitante (ou `null`).
- Banco: D1 `lucksrei-visits` (binding `DB`), tabela `visits_monthly` (`ym`, `country`, `n`, `updated_at`), chave `(ym, country)`. Upsert incrementa o contador; meses com mais de 13 meses são apagados ocasionalmente.

## 2. Contagem

- "Visita" = no máximo **uma por sessão de aba** do navegador.
- Quem decide é o cliente (`assets/js/main.js`): marcador `lk.v` em `sessionStorage`, que nunca é enviado ao servidor.
- Sem cookie, sem fingerprint, sem identificador. **Não é contagem de visitantes únicos.**

## 3. Geo

- O país vem **apenas** de `request.cf.country`. Nada enviado pelo cliente (query, header, corpo) é lido.
- Normalização para ISO 3166-1 alfa-2 maiúsculo (`normalizeCountry`).
- Ausente, inválido, Tor (`T1`), `XX` ou `ZZ` → `XX`.
- `XX` entra em `total_visits`, mas fica fora do mapa, do ranking e de `countries_count`.

## 4. Privacidade

Nunca armazenar: IP, user-agent, headers, cidade, região, latitude, longitude ou qualquer identificador pessoal. Só se grava `(mês, país, contador, timestamp)`.

O user-agent pode ser lido **só em memória**, para filtrar robôs, e é descartado. A política em `/privacy/` (seção 3) descreve isso; se a coleta mudar, a política muda junto.

## 5. Cache

| Rota | Cache |
|---|---|
| `GET /api/visitors` | borda (`caches.default`) ~5 min: `public, max-age=300, s-maxage=300` |
| cliente (`visitors.js`) | `fetch(..., { cache: "no-cache" })` — revalida sempre |
| `GET /api/whoami` | `no-store` |
| `POST /api/visit` | `no-store` (inclusive respostas ignoradas) |

Comportamento aceito: no HIT da borda a Cloudflare reescreve o `max-age` para `14400` (Browser Cache TTL da zona); o `s-maxage=300` fica. Não afeta o site porque o cliente usa `no-cache`; só quem abre o endpoint direto no navegador pode ver um JSON de até 4 h. Não "corrigir" isso.

Rate limiting pode ser adicionado futuramente se houver abuso real.

## 6. Frontend

- `assets/js/visitors.js` atende as duas páginas:
  - **home**: versão resumida (visitas, países, mapa com o país atual destacado, link "Ver mapa completo"), sem ranking; `#v-map[data-lazy]` só busca SVG e API quando a seção chega perto do viewport.
  - **`/visitors/`**: mapa completo, indicadores (incl. "Você está em"), top 10, "Dados desde…", notas sobre a métrica.
- Mapa: `assets/img/visitors/world.svg` local (Natural Earth, gerado por `tools/build-world-svg.py`), sem cor fixa; cores vêm de `--map-0…--map-5`, escala logarítmica.
- Países sem forma no SVG (microestados como SG, MT, MC) entram nos totais e no ranking; o mapa simplesmente não os pinta.
- Nomes de país via `Intl.DisplayNames` no idioma atual (`makeCountryNamer`). Sem a API, com erro ou com código desconhecido: nome em inglês do SVG (quando há) e por último o código ISO.

## 7. i18n

- PT-BR, EN e ES. Textos em `assets/i18n/{en,pt-BR,es}.js`, chaves `visitors.*`, `home.visitors.*`, `seo.visitors.*`.
- `/privacy/` também é localizada (`privacy.site.*`, `seo.privacy.*`). O aviso "só em português" (`privacy.notice`) vale apenas para as políticas dos apps.

## 8. Acessibilidade

- Países com visitas são focáveis (`tabindex="0"`, `role="img"`, `aria-label` com nome e visitas); ordem de Tab = ordem do ranking. O `<svg>` raiz não é parada de Tab.
- Tab / Shift+Tab sem focus trap; Esc fecha o tooltip mantendo o foco.
- `:focus-visible` com contorno de 3px; o país do visitante (`.is-you`) focado fica tracejado para se diferenciar do contorno contínuo.
- Foco/hover no ranking destaca o país no mapa e mostra o tooltip.
- `prefers-reduced-motion`: a regra global zera transições; o mapa não depende de animação.

## 9. Arquivos importantes

- `worker/index.mjs` — endpoints, normalização, filtro de robôs, cache.
- `assets/js/visitors.js` — mapa, indicadores, ranking, tooltip, nomes de país.
- `assets/js/main.js` — beacon de visita (uma por sessão de aba).
- `visitors/index.html` e a seção `.home-visitors` de `index.html`.
- `assets/img/visitors/world.svg` (+ `tools/build-world-svg.py`).
- `migrations/0001_visits.sql` — schema do D1.
- `tools/visitor-report.mjs` — relatório manual somente leitura (ver "Relatório manual").
- `tests/visitors.test.js` — Worker, privacidade, microestados, fallback de nomes, privacy i18n. Rodar com `node tests/visitors.test.js` (junto com `tests/i18n.test.js` e `tests/apps-data.test.js`).
- `privacy/index.html` — política do site.

Testes com dados: usar D1 local (`wrangler d1 ... --local --persist-to <dir temporário>`). Nunca inserir, alterar ou apagar dados em produção.

## Relatório manual

```
node tools/visitor-report.mjs
```

Rodar na raiz do repo, com o Wrangler já logado. Mostra:
- total de visitas e mês atual;
- países e "Desconhecido/Tor" à parte;
- top 10 e % por país;
- evolução mês a mês, comparação com o mês anterior (só quando há dados dos dois meses), primeiro mês e último update.

- **Somente leitura:** consulta o D1 **remoto** `lucksrei-visits` com um único `SELECT ym, country, n, updated_at FROM visits_monthly` (o script recusa qualquer outra instrução). Não altera produção, não cria arquivos e não publica nada (`tools/` não é servido).
- Só existem agregados; erros do Wrangler são mostrados com ids/tokens mascarados.
- Cálculo e formatação têm testes com dados fictícios: `node tests/visitor-report.test.js`.

## 10. Não alterar sem revisão

- Não trocar D1 por KV.
- Não chamar visitas de "visitantes únicos".
- Não adicionar fingerprint, cookie ou identificador.
- Não armazenar IP (nem user-agent, headers ou localização precisa).
- Não aceitar país enviado pelo cliente.
- Não criar rate limiting agressivo sem observar tráfego real.
- Não expor `worker/`, `migrations/`, `tests/`, `tools/`, `docs/` nem `DESIGN.md` no site (`.assetsignore`).
