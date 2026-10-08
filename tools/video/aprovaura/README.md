# Aprovaura — filme do produto (fonte da versão final)

Versão publicada: **V8** → `assets/video/aprovaura-loop.av1.mp4` (AV1, 1,2 MB, servido a quem toca AV1)
e `assets/video/aprovaura-loop.mp4` (H.264, 1,9 MB, fallback);
ambos 50 s · 720×720 · 30 fps · mudo · loop; pôster `assets/video/aprovaura-loop-poster.webp`
(frame final: logo + slogan + Aurudo).
Usado na home (card do Aprovaura) e no topo de `projects/aura/`, pelo mesmo
`<video data-loop-video>` + `assets/js/loop-video.js` dos outros produtos.

## Arquivos

| Caminho | O que é |
|---|---|
| `aprovaura-promo-v8.html` | o filme inteiro (HTML/CSS/JS); `window.render(t)` é determinístico |
| `assets/` | logo, wordmark e poses do Aurudo |
| `assets/rig/` | camadas do rig do Aurudo (corpo, mangas, mãos, punhos, partículas) |
| `render.mjs` | captura frame a frame via Playwright e gera o MP4 master |
| `sheet.mjs`, `mont.sh` | frames avulsos e contact sheet para conferência |
| `tools_build_farm_body.py` | reconstrói `assets/rig/farm_body.png` a partir do kit `neutral_wave` do app Aprovaura |

`out/`, `frames/` e `sheet/` são saídas de render e ficam fora do git (`.gitignore`).

## Renderizar (a partir desta pasta)

```bash
node render.mjs out/aprovaura-v8.mp4                  # filme inteiro (50 s), master H.264 CRF 20
node render.mjs out/trecho.mp4 --from 46.9 --to 50    # só um trecho
node sheet.mjs 3 15 30 45 48.5                        # frames avulsos em sheet/
./mont.sh conferencia 3 15 30 45 48.5                 # contact sheet em sheet/conferencia.png
```
Playwright vem de `/opt/node22/lib/node_modules/playwright` e o Chromium precisa das fontes Inter instaladas.
Os arquivos publicados em `assets/video/` foram reencodados a partir desse master (AV1 e H.264 mais leve).

## Rig do Aurudo (final do filme)
- `farm_body.png` é o corpo sem os dois braços; `farm_sleeve_r.png` é uma manga contínua;
  `farm_hand.png` + `farm_cuff.png` são a mão aberta, girada 180° e achatada (.64) = palma para cima.
- Os dois braços usam os mesmos sprites; o esquerdo fica dentro de um wrapper com `scaleX(-1)`.
- `farmPose(t, side)` dá o parâmetro do braço (a: 60 = baixo … 5 = alto, r: 0..1): oscilação em cosseno de
  `FARM.per` (0,9 s), `FARM.n` (3) subidas por braço; `farmStart` deixa o braço direito meio período depois
  do esquerdo (contrafase). O corpo balança e inclina ~1° para a palma que está no alto.
- As esferas de Aura (`FORBS`) nascem sobre cada palma no alto de cada subida e são puxadas para a órbita.
- HUD de AURA: estrela travada em pé e centrada no anel, sem rotação contínua, pulso de chegada 1,05×.
  `render.mjs` espera dois animation frames antes de cada captura; sem isso, a camada do HUD às vezes
  não era pintada a tempo e piscava no vídeo.
