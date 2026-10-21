# StockPort System — filme promocional (fonte)

"Do estoque à venda. Tudo conectado." Motion design programático (HTML/CSS 3D/SVG/Canvas 2D), sem prints do app,
renderizado quadro a quadro com Playwright e codificado com FFmpeg. Mudo por padrão (autoplay sem som).

| Montagem | Formato | Duração | Arquivo (em `out/`, fora do git) |
|---|---|---|---|
| Master | 1920×1080 · 16:9 · 30 fps · H.264 | 89 s | `stockport-master-1080p.mp4` |
| Loop do site | 1080×1080 · 1:1 · 30 fps · H.264 (e 720×720 H.264/AV1) | 54,8 s | `stockport-loop-1080.mp4`, `stockport-loop-720.mp4`, `stockport-loop-720.av1.mp4`, `stockport-loop-poster.webp` |
| Vertical | 1080×1920 · 9:16 · 30 fps · H.264 | 44,7 s | `stockport-vertical-1080x1920.mp4` |

O quadrado e o vertical não são recortes do master: cada cena tem layout próprio por formato (`pick({wide, sq, tall})`)
e a linha do tempo de cada formato encurta esperas e transições (`map`) sem acelerar a leitura dos títulos.

## Arquivos

| Caminho | O que é |
|---|---|
| `index.html` | página de desenvolvimento e de captura (`?fmt=wide\|sq\|tall`, `?render`, `?t=12.5`) |
| `src/engine.js` | `window.render(t)` determinístico, `window.DURATION`, easings, PRNG com seed, `put()` (pose 3D de cada bloco), títulos por palavra |
| `src/timeline.js` | cenas por formato: duração, sobreposição e mapas de tempo; brilho do fundo por cena |
| `src/bg.js` | fundo em Canvas 2D (navy, brilho cobalto, grade pontilhada, partículas, vinheta, ruído anti-banding); periódico no loop 1:1 |
| `src/kit.js` | ícones, código de barras, produtos 3D (cuboides CSS), caixas de estoque, átomos de interface |
| `src/brand.js` | carrega os SVGs originais da marca (`assets/brand/`) — geometria intacta, animada só por camadas, máscara e câmera |
| `src/scenes/s01–s10.js` | uma cena por arquivo (DOM + CSS próprio + `render(lt)`) |
| `assets/brand/` | cópias de `stockport-system/assets/branding/stockport/` (mark, mark light, wordmark dark, lockups, micro) |
| `assets/fonts/` | Roboto Light/Regular/Medium/Bold (Apache 2.0, a fonte da marca) |
| `render.mjs` | servidor local + captura (Playwright) + encode (FFmpeg) por pipe, sem gravar quadros em disco |
| `storyboard/` | roteiro por cena e contact sheets · `ref/` quadros de conferência |

## Assistir e inspecionar

```bash
python3 -m http.server 8790 --bind 127.0.0.1    # nesta pasta (fetch dos SVGs exige http)
# http://127.0.0.1:8790/index.html?fmt=wide
```
Barra inferior: play/pause (espaço), timeline com as cenas marcadas (clique pula), ±1 s (←/→, shift = 5 s), seletor de
cena e de formato, **inspeção** (tecla `i`: contorno dos blocos + áreas seguras 90 % e 80 %) e **quadro avulso** (abre
`?render&t=…`, o instante exato congelado no tamanho real).

## Renderizar

```bash
export PW_DIR=<pasta com node_modules/playwright>   # ex.: npm i playwright ffmpeg-static (fora do repo)
export FFMPEG=<ffmpeg com libx264, libsvtav1 e libwebp>
node render.mjs video wide out/stockport-master-1080p.mp4 --fps-in 60 --workers 5 --crf 18
node render.mjs video sq   out/stockport-loop-1080.mp4       --fps-in 60 --workers 5 --crf 18
node render.mjs video tall out/stockport-vertical-1080x1920.mp4 --fps-in 60 --workers 5 --crf 18
node render.mjs derive out/stockport-loop-1080.mp4 out/stockport-loop          # 720×720 H.264 + AV1
$FFMPEG -ss 53.4 -i out/stockport-loop-1080.mp4 -frames:v 1 -vf scale=720:720 -c:v libwebp -quality 82 out/stockport-loop-poster.webp
node render.mjs sheet wide ref s07+3.5,s10+6                                   # quadros avulsos (absolutos ou "cena+segundos")
FFPROBE=<ffprobe> sh qa.sh out/stockport-master-1080p.mp4                     # ffprobe, pretos/congelados, emenda, contact sheet
```
`--fps-in 60` captura a 60 quadros/s e mistura cada par (2m, 2m+1) num quadro de saída (motion blur leve, 30 fps); números que mudam a cada quadro usam tempo quantizado em 1/30 s (`qt`) para não aparecerem duplicados. H.264 High, `yuv420p`,
BT.709, `+faststart`, sem áudio. A captura bloqueia qualquer requisição fora do servidor local.

## Timeline (master 16:9, sobreposição de 1 s entre cenas)

| # | Cena | Início | O que mostra |
|---|---|---|---|
| 1 | Marca | 0,0 | linhas de uma operação comercial em isométrico; SP montado por camadas com extrusão; wordmark por máscara; "Seu negócio. Sob controle." |
| 2 | Produtos | 6,6 | produtos 3D no piso → linhas do catálogo (o próprio produto vira miniatura); feixe lê o código e encontra o item |
| 3 | Estoque | 15,8 | estante 3D; caixa de entrada pousa na vaga; movimentação, saldo 62 → 86 com mínimo; sabão abaixo do mínimo em âmbar |
| 4 | PDV | 25,6 | busca, carrinho, quantidades, desconto, cliente, pagamento Pix + dinheiro, "Venda registrada." com recibo em PDF |
| 5 | Caixa | 37,2 | abertura, venda (parte em dinheiro), suprimento, sangria, esperado na gaveta, contado, diferença, fechamento |
| 6 | Clientes e fornecedores | 46,0 | fornecedor → produto → cliente com históricos de entradas e compras |
| 7 | Dashboard e relatórios | 53,8 | câmera recua do faturamento do dia para o painel (tema claro); cards se reorganizam num relatório PDF com a marca |
| 8 | Equipe | 66,4 | matriz de permissões por papel |
| 9 | Exportações e plataformas | 73,2 | CSV e PDF; molduras de navegador e celular; idiomas e temas |
| 10 | Encerramento | 80,6 | linhas convergem e desenham o contorno do SP; marca, wordmark, "Do estoque à venda. Tudo conectado.", "Um produto Lucksrei" (≥ 3 s) |

## O que é verdadeiro (conferido no código do StockPort em 21/10/2026)

README, `docs/status.md`, `lib/features/*`, `lib/app/app_strings.dart` e `supabase/migrations/`:
produtos e categorias, código de barras (câmera e leitor), estoque com entradas, ajustes com motivo, movimentações, estoque
mínimo e "Produtos para repor"; PDV com busca, carrinho, quantidades, desconto, cliente, pagamentos combinados
(Dinheiro, Pix, Débito, Crédito, Outro), troco, histórico e recibo em PDF; caixa com abertura, suprimento, sangria,
esperado na gaveta, contado, diferença e caixas fechados; clientes (histórico de compras) e fornecedores (histórico de
entradas); dashboard (vendas, faturamento e lucro do dia, estoque baixo, gaveta do caixa, valor do estoque ao custo
médio); relatórios (faturamento por dia, por forma de pagamento, mais vendidos, lucro estimado, margem); exportação CSV e
PDF; equipe com papéis — a matriz da cena 8 segue `role_permissions`: proprietário tudo; gerente opera e vê custos, sem
gestão de equipe; caixa/atendente vende e opera o caixa, só consulta estoque, não vê relatórios nem custos; somente
consulta. PT/EN/ES, temas claro e escuro, Android/iOS/Web, dados separados por empresa.

O filme **não** mostra: NF-e, integrações (Mercado Livre, bancos, conciliação), IA, offline, multimoeda, cobrança
recorrente, preços de licença, URLs, QR Code, selos ou publicação em lojas. "Pix" aparece só como forma de pagamento
registrada na venda. Nomes, empresas, valores e indicadores são demonstrativos.
