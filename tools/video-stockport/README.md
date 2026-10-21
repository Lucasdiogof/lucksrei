# StockPort System — filme promocional (fonte)

"Do estoque à venda. Tudo conectado." Motion design programático (HTML/CSS 3D/SVG/Canvas 2D), sem prints do app,
renderizado quadro a quadro com Playwright e codificado com FFmpeg. Funciona mudo (autoplay sem som); as versões com
trilha usam uma música original gerada em código (`audio/make-music.mjs`).

## Entregáveis (em `out/final/`, fora do git)

| Arquivo | Uso | Formato |
|---|---|---|
| `stockport-master-1920x1080.mp4` | apresentação comercial, institucional | 16:9 · 90 s · 30 fps · H.264 High CRF 18 · mudo |
| `stockport-master-1920x1080-web.mp4` | site, campanhas, upload em redes | igual, CRF 22 com teto de 6 Mb/s |
| `stockport-master-1920x1080-trilha.mp4` | apresentação com som | igual ao master + AAC 192 kb/s, −16 LUFS |
| `stockport-vertical-1080x1920.mp4` | marketplaces (Mercado Livre Clips e similares), stories | 9:16 · 54,9 s · H.264 High 4.1 · teto 8 Mb/s · mudo |
| `stockport-vertical-1080x1920-trilha.mp4` | o mesmo com a trilha original | + AAC |
| `stockport-loop-720.mp4` / `.av1.mp4` | loop do card no site Lucksrei | 1:1 · 43,9 s · mudo, emenda suave |
| `stockport-loop-poster.webp` | pôster do loop | 720×720 |

Os intermediários de captura (H.264 CRF 12) ficam em `out/mezz/` e não são arquivos de entrega.

## Montagens

O quadrado e o vertical não são recortes do master: cada cena tem layout próprio por formato (`pick({wide, sq, tall})`),
e fora do 16:9 a câmera se aproxima da coluna da interface que importa (produtos → carrinho → pagamento; movimentos do
caixa → fechamento), esmaecendo a outra. A linha do tempo de cada formato (`src/timeline.js`) encurta esperas e
transições com mapas de tempo, sem acelerar a leitura dos títulos.

| # | Cena | Master 16:9 | Vertical | Loop 1:1 | Título |
|---|---|---|---|---|---|
| 1 | Abertura | 0,0 | 0,0 | 0,0 | Estoque, vendas e caixa. Tudo em um só lugar. |
| 2 | Produtos | 7,6 | 5,5 | 5,5 | Cadastre e organize seus produtos. |
| 3 | Estoque | 16,6 | 11,8 | 11,8 | Acompanhe entradas, saídas e estoque baixo. |
| 4 | PDV | 26,2 | 18,5 | 18,5 | Registre vendas com mais agilidade. |
| 5 | Caixa | 38,2 | 27,4 | — | Controle cada movimentação do caixa. |
| 6 | Clientes e fornecedores | 47,6 | — | — | Clientes e fornecedores com todo o histórico. |
| — | Gestão (clientes, fornecedores, equipe) | — | 43,6 | — | Clientes, fornecedores e equipe organizados. |
| 7 | Dashboard e relatório | 55,0 | 34,7 | 27,4 | Entenda seus resultados. |
| 8 | Equipe | 68,0 | — | — | Sua equipe, cada um com o acesso certo. |
| 9 | Exportações | 74,8 | — | — | Informações onde você precisa (PDF e CSV). |
| 10 | Encerramento | 81,8 | 48,5 | 36,3 | StockPort System · Do estoque à venda. Tudo conectado. · Licença de uso do software · Um produto Lucksrei |

## Dados demonstrativos (`src/data.js`)

Uma única base em **centavos inteiros** alimenta todas as cenas; nada é digitado duas vezes nem calculado com ponto
flutuante. A mesma história atravessa o filme: o café tem 62 un. no catálogo, recebe a entrada de 24 (→ 86), sai 2 na
venda #1048 (→ 84); a venda (subtotal R$ 73,70 − desconto R$ 3,70 = R$ 70,00, Pix R$ 40,00 + Dinheiro R$ 30,00) entra no
caixa só com a parte em dinheiro; o esperado na gaveta (R$ 432,60) é o mesmo valor que o dashboard mostra em "Gaveta do
caixa"; o faturamento do dia (R$ 1.284,60) é a soma das formas de pagamento e é a última barra do gráfico. Totais,
saldos e o esperado na gaveta mudam em degraus exatos (nunca passam por valores intermediários).
`node test/validate.mjs` confere tudo isso (40+ regras) e falha se algum número deixar de bater.

## Verificações

```bash
node test/validate.mjs                    # aritmética e coerência dos dados demonstrativos
node render.mjs check wide                # fontes carregadas, erros JS, duração, títulos na área segura (5 %),
node render.mjs check tall                #   nunca dois títulos de cenas diferentes visíveis ao mesmo tempo
node render.mjs check sq
FFPROBE=<ffprobe> sh qa.sh out/final/stockport-master-1920x1080.mp4   # ffprobe, pretos/congelados, emenda, contact sheet
```

## Arquivos

| Caminho | O que é |
|---|---|
| `index.html` | página de desenvolvimento e de captura (`?fmt=wide\|sq\|tall`, `?render`, `?t=12.5`) |
| `src/data.js` | base demonstrativa comum (centavos) + formatação BRL |
| `src/engine.js` | `window.render(t)` determinístico, `window.DURATION`, easings, PRNG com seed, `put()` (pose 3D), títulos por palavra |
| `src/timeline.js` | cenas por formato: duração, sobreposição e mapas de tempo; brilho do fundo por cena |
| `src/bg.js` | fundo em Canvas 2D (navy, brilho cobalto, grade, partículas, vinheta, dither fixo); periódico no loop 1:1 |
| `src/kit.js` | ícones, código de barras, produtos 3D (cuboides CSS), caixas de estoque, átomos de interface |
| `src/brand.js` | carrega os SVGs originais da marca (`assets/brand/`) — geometria intacta, animada só por camadas, máscara e câmera |
| `src/scenes/s01–s10.js`, `sg.js` | uma cena por arquivo (DOM + CSS próprio + `render(lt)`) |
| `audio/make-music.mjs` | trilha original sintetizada (pad, baixo, arpejo, percussão discreta, reverb), por formato |
| `assets/brand/`, `assets/fonts/` | cópias dos SVGs da marca; Roboto (Apache 2.0, a fonte da marca) |
| `render.mjs` | servidor local + captura (Playwright) + encode (FFmpeg) por pipe + versões finais |
| `test/validate.mjs`, `qa.sh` | testes dos dados e verificação dos MP4 |
| `storyboard/` | roteiro e contact sheets · `ref/` quadros de conferência |

## Assistir e inspecionar

```bash
python3 -m http.server 8790 --bind 127.0.0.1    # nesta pasta (fetch dos SVGs exige http)
# http://127.0.0.1:8790/index.html?fmt=wide
```
Barra inferior: play/pause (espaço), timeline com as cenas marcadas (clique pula), ±1 s (←/→, shift = 5 s), cena,
formato, **inspeção** (tecla `i`: contorno dos blocos + áreas seguras 90 % e 80 %) e **quadro avulso** (`?render&t=…`).

## Renderizar

```bash
export PW_DIR=<pasta com node_modules/playwright>   # ex.: npm i playwright ffmpeg-static (fora do repo)
export FFMPEG=<ffmpeg com libx264, libsvtav1 e libwebp>
node audio/make-music.mjs wide out/audio/stockport-wide.wav
node audio/make-music.mjs tall out/audio/stockport-tall.wav
node render.mjs video wide out/mezz/stockport-wide.mp4     # ~5 min cada, 30 fps, quadros PNG por pipe
node render.mjs video tall out/mezz/stockport-tall.mp4
node render.mjs video sq   out/mezz/stockport-sq.mp4
node render.mjs finals out/mezz out/final                  # versões de entrega (+ trilha, AV1, pôster)
node render.mjs sheet wide ref s07+3.5,s10+6               # quadros avulsos (absolutos ou "cena+segundos")
```
Sem motion blur por mistura de quadros: cada quadro é um instante exato (a mistura duplicava textos em movimento).

## O que é verdadeiro (conferido no código do StockPort)

README, `docs/status.md`, `lib/features/*`, `lib/app/app_strings.dart` e `supabase/migrations/`: produtos e categorias,
código de barras, entradas, ajustes com motivo, movimentações, estoque mínimo e "Produtos para repor"; PDV com busca,
carrinho, quantidades, desconto, cliente, pagamentos combinados (Dinheiro, Pix, Débito, Crédito, Outro), troco,
histórico e recibo em PDF; caixa com abertura, suprimento, sangria, esperado na gaveta, contado, diferença e caixas
fechados; clientes (histórico de compras) e fornecedores (histórico de entradas); dashboard (vendas, faturamento e lucro
do dia, estoque baixo, gaveta do caixa, valor do estoque ao custo médio); relatórios (faturamento por dia, por forma de
pagamento, mais vendidos, lucro estimado, margem); CSV e PDF; equipe por papel conforme `role_permissions`
(proprietário tudo; gerente opera e vê custos, sem gestão de equipe; caixa/atendente vende e opera o caixa, só consulta
estoque; somente consulta). PT/EN/ES, temas claro e escuro, Android/iOS/Web, dados separados por empresa.

O filme **não** mostra: NF-e, integrações (Mercado Livre, bancos, conciliação), IA, offline, multimoeda, cobrança
recorrente, preços de licença, descontos/ofertas, URLs, QR Code, WhatsApp, telefone, selos ou publicação em lojas. "Pix"
aparece só como forma de pagamento registrada na venda. Nomes, empresas, valores e indicadores são demonstrativos.
