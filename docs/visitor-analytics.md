# Visitantes — estatísticas agregadas por país e por estado/região

Nota de manutenção da feature de visitantes (mapa na home e em `/visitors/`). Documento interno: `docs/` está no `.assetsignore` e não é servido pelo site.

## 1. Arquitetura

- O Worker `lucksrei-site` (`worker/index.mjs`) só roda em `/api/*` (`run_worker_first` em `wrangler.jsonc`); o resto é servido direto pelos assets.
- `POST /api/visit` — conta uma visita no mês UTC e país atuais e, em separado, no mês/país/estado. Responde sempre `204`; falha de banco nunca afeta a página. Só conta chamada com `Origin` do próprio site e user-agent que não pareça robô (filtro de ruído, não segurança).
- `GET /api/visitors` — agregados dos últimos 12 meses: `total_visits`, `countries_count`, `updated_at`, `since`, `window_months`, `countries[{code, visits}]`, `regions_since` e `regions[{country, visits, unknown, items[{code, name, visits}]}]`.
- `GET /api/whoami` — `{ country, region, region_name }` do próprio visitante (cada um pode ser `null`).
- Banco: D1 `lucksrei-visits` (binding `DB`), tabela `visits_monthly` (`ym`, `country`, `n`, `updated_at`), chave `(ym, country)`. Upsert incrementa o contador; meses com mais de 13 meses são apagados ocasionalmente.
- Tabela `visits_region_monthly` (`ym`, `country`, `region`, `name`, `n`, `updated_at`), chave `(ym, country, region)` — migration `0002`. Começou vazia no deploy da feature (sem histórico retroativo). A gravação é independente da de país: se a tabela faltar ou a escrita falhar, a contagem por país segue e `/api/visitors` devolve `regions: []`.

## 2. Contagem

- "Visita" = no máximo **uma por sessão de aba** do navegador.
- Quem decide é o cliente (`assets/js/main.js`): marcador `lk.v` em `sessionStorage`, que nunca é enviado ao servidor.
- Sem cookie, sem fingerprint, sem identificador. **Não é contagem de visitantes únicos.**

## 3. Geo

- O país vem **apenas** de `request.cf.country`. Nada enviado pelo cliente (query, header, corpo) é lido.
- Normalização para ISO 3166-1 alfa-2 maiúsculo (`normalizeCountry`).
- Ausente, inválido, Tor (`T1`), `XX` ou `ZZ` → `XX`.
- `XX` entra em `total_visits`, mas fica fora do mapa, do ranking e de `countries_count`.
- Estado/região vem **apenas** de `request.cf.regionCode` (parte da subdivisão ISO 3166-2, 1–3 letras/dígitos, ex.: `GO`, `CA`, `ENG`) — `normalizeRegion`. Ausente ou inválido → `XX` ("sem estado identificado", fora do ranking de estados). Sem país, não se grava região.
- O nome (`request.cf.region`) é guardado só para exibição, saneado (`cleanRegionName`, até 80 caracteres). No site, estados do Brasil usam a tabela `BR_STATES` de `visitors.js` (grafia oficial; DF traduzido); outros países usam o nome da Cloudflare ou `PAÍS-CÓDIGO`.
- O estado é deduzido do IP pela Cloudflare: pode errar com VPN e algumas operadoras móveis.

## 4. Privacidade

Nunca armazenar: IP, user-agent, headers, cidade, CEP, latitude, longitude ou qualquer identificador pessoal. Só se grava `(mês, país, contador, timestamp)` e `(mês, país, estado/região, nome do estado, contador, timestamp)`. Estado/região é o nível mais fino permitido; cidade nunca.

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
  - **`/visitors/`**: mapa completo, indicadores (incl. "Você está em" com estado e país), top 10 de países (só a partir do 2º país), "Dados desde…", seção "Por estado ou região" (só a partir do 2º estado registrado; botões com até 8 países quando há mais de um, top 10 estados do país escolhido, nota com "dados por estado desde…" e visitas sem estado), notas sobre a métrica.
  - A home **não** mostra estados.
- Mapa: `assets/img/visitors/world.svg` local (Natural Earth, gerado por `tools/build-world-svg.py`), sem cor fixa; cores vêm de `--map-0…--map-5`, escala logarítmica.
- **Mapa interativo (só `/visitors/`, `#v-map[data-zoom]`)**: zoom pelos botões (+, −, ver tudo), Ctrl/⌘ + rolagem (rolagem simples continua rolando a página), pinça, duplo clique e teclado (Enter no país/estado, + / − / 0, setas). Arraste só quando ampliado (`touch-action: pan-y` sem zoom, `none` com zoom). Clique num país aproxima nele; já ampliado, clique num estado aproxima no estado. Animação de ~320 ms no viewBox, instantânea com `prefers-reduced-motion` ou aba oculta, com timer de garantia se o navegador não rodar quadros. No celular (≤ 560 px) os botões ficam numa linha abaixo do mapa.
- **Divisas de estados**: `assets/img/visitors/admin1/<PAÍS>.svg` (Natural Earth 1:10m, ~240 países, mesma projeção/viewBox do world.svg; gerados por `tools/build-admin1-svg.py`). Carregadas sob demanda só para países com visitas (os 12 com mais visitas de saída; os outros ao aproximar). Sem zoom, os estados herdam a cor do país; ampliado (≥ 2×), cada estado tem a própria cor pelas visitas dele (escala relativa ao estado mais visitado do país). Estados com visitas são focáveis e têm tooltip/aria com nome no idioma (`data-pt/es/en`) e visitas.
- **Nível das divisas = 1º nível ISO 3166-2**, o mesmo do `regionCode` da Cloudflare. O gerador usa a hierarquia do `iso_3166-2.json` (projeto iso-codes) e funde as divisões menores do Natural Earth na região de 1º nível (bordas internas somem): França em 13 regiões + ultramar (não departamentos), Reino Unido em 4 nações, Itália em 20 regiões, Espanha em comunidades autônomas, Irlanda em províncias, Bélgica em 3 regiões.
- **Códigos alternativos (`data-a`)**: cada estado vale pelo código principal (`data-r`) e pelos alternativos (código antigo, reforma anterior), e o cliente soma as visitas de todos (`codesOf`). Ex.: Córsega `20R` + `COR`, Cidade do México `CMX` + `DIF`, Noruega condado de 2024 + códigos de 2020 e anteriores, departamentos franceses como alternativos da região.
- Correções pontuais ficam no gerador: `NE_FIX` (código errado no Natural Earth, pela chave `adm1_code`), `EXTRA_ALIASES`, `NO_REFORM`, `TRANSLATE` (nomes de regiões fundidas nos 3 idiomas). A Crimeia (`UA-43`, rotulada como Rússia no Natural Earth) vai para o arquivo da Ucrânia, como a Cloudflare classifica; territórios que são país próprio no mapa (Porto Rico, Sint Maarten) ficam no próprio arquivo.
- **Onde o código do Natural Earth não serve, o código sai do nome** (`BY_NAME`): Irã e Marrocos (numeração antiga que colide com a atual — ex.: o antigo IR-02 era o Azerbaijão Ocidental, hoje IR-02 é Mazandaran), Letônia (reforma de 2021), Cazaquistão, Costa do Marfim, Nepal, RDC, Quênia e outras reformas. O casamento por nome usa só os nomes da própria divisão: o campo `region` do Natural Earth juntava municípios do interior da Letônia a Riga e foi tirado.
- **Subdivisão criada depois do Natural Earth** (`EXTRA_ALIASES`): entra como alternativo da região de onde saiu (ex.: os 47 condados do Quênia nas 8 províncias antigas, as 10 wilayas argelinas de 2019, os municípios eslovenos novos). A visita do estado novo pinta o polígono que o contém.
- **Checagem obrigatória depois de gerar**: `python tools/check-admin1-coverage.py <iso_3166-2.json> --strict` — falha se algum código de 1º nível ISO não cair em nenhum estado do mapa ou se sobrar divisão desenhada sem código. Exceções (territórios que a Cloudflare trata como país, ilhas sem polígono no 1:10m, zonas sem código ISO) ficam listadas no script, cada uma com o motivo. Hoje: ok.
- Heurística por fronteira foi testada e descartada (atribuía errado na Bósnia e na Letônia).
- **Zoom no território principal** (`mainBox`): ao clicar num país, a caixa do zoom parte do maior grupo de pedaços que se encostam (por área real), então a França não inclui a Guiana, os EUA não incluem o Alasca e a Noruega não inclui Svalbard.
- Países sem forma no SVG (microestados como SG, MT, MC) entram nos totais e no ranking; o mapa simplesmente não os pinta.
- Nomes de país via `Intl.DisplayNames` no idioma atual (`makeCountryNamer`). Sem a API, com erro ou com código desconhecido: nome em inglês do SVG (quando há) e por último o código ISO.

## 7. i18n

- PT-BR, EN e ES. Textos em `assets/i18n/{en,pt-BR,es}.js`, chaves `visitors.*`, `home.visitors.*`, `seo.visitors.*`.
- `/privacy/` também é localizada (`privacy.site.*`, `seo.privacy.*`). O aviso "só em português" (`privacy.notice`) vale apenas para as políticas dos apps.

## 8. Acessibilidade

- Países com visitas são focáveis (`tabindex="0"`, `role="img"`, `aria-label` com nome e visitas); ordem de Tab = ordem do ranking. O `<svg>` raiz não é parada de Tab.
- Tab / Shift+Tab sem focus trap; Esc fecha o tooltip mantendo o foco.
- Botões de país dos estados: `<button aria-pressed>` num grupo com `aria-label`; ao trocar, o foco volta para o botão escolhido; a nota usa `role="status"`.
- `:focus-visible` com contorno de 3px; o país do visitante (`.is-you`) focado fica tracejado para se diferenciar do contorno contínuo.
- Foco/hover no ranking destaca o país no mapa e mostra o tooltip.
- `prefers-reduced-motion`: a regra global zera transições; o mapa não depende de animação.

## 9. Arquivos importantes

- `worker/index.mjs` — endpoints, normalização, filtro de robôs, cache.
- `assets/js/visitors.js` — mapa, indicadores, ranking, tooltip, nomes de país.
- `assets/js/main.js` — beacon de visita (uma por sessão de aba).
- `visitors/index.html` e a seção `.home-visitors` de `index.html`.
- `assets/img/visitors/world.svg` (+ `tools/build-world-svg.py`) e `assets/img/visitors/admin1/` (+ `tools/build-admin1-svg.py <ne_110m_admin_0_countries.geojson> <ne_10m_admin_1_states_provinces.geojson> <iso_3166-2.json>`; os GeoJSON brutos não ficam no repo).
- `migrations/0001_visits.sql` e `migrations/0002_visits_region.sql` — schema do D1 (aplicar com `wrangler d1 migrations apply lucksrei-visits --remote`; 0002 só cria a tabela nova).
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
- por estado/região: top 5 países, top 10 estados de cada um, % dentro do país e "sem estado identificado";
- top 10 e % por país;
- evolução mês a mês, comparação com o mês anterior (só quando há dados dos dois meses), primeiro mês e último update.

- **Somente leitura:** consulta o D1 **remoto** `lucksrei-visits` com dois SELECTs simples — `SELECT ym, country, n, updated_at FROM visits_monthly` e `SELECT ym, country, region, name, n, updated_at FROM visits_region_monthly` (o script recusa qualquer outra instrução). Se a tabela de regiões não existir, a seção avisa e o resto do relatório sai normal. Não altera produção, não cria arquivos e não publica nada (`tools/` não é servido).
- Só existem agregados; erros do Wrangler são mostrados com ids/tokens mascarados.
- Cálculo e formatação têm testes com dados fictícios: `node tests/visitor-report.test.js`.

## 10. Não alterar sem revisão

- Não trocar D1 por KV.
- Não chamar visitas de "visitantes únicos".
- Não adicionar fingerprint, cookie ou identificador.
- Não armazenar IP (nem user-agent, headers ou localização precisa).
- Não aceitar país nem estado enviado pelo cliente.
- Não descer abaixo de estado/região (nada de cidade, CEP ou coordenadas).
- Não criar rate limiting agressivo sem observar tráfego real.
- Não expor `worker/`, `migrations/`, `tests/`, `tools/`, `docs/` nem `DESIGN.md` no site (`.assetsignore`).
