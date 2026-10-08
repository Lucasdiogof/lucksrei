# Match Queue — filme do produto (fonte da versão final)

Versão publicada: **V8** → `assets/video/match-queue-loop.av1.mp4` (AV1, 1,3 MB, servido a quem toca AV1)
e `assets/video/match-queue-loop.mp4` (H.264 High, ~250 kbps, 1,5 MB, fallback);
ambos 47,3 s · 720×720 · 30 fps · yuv420p · mudo · loop; pôster
`assets/video/match-queue-loop-poster.webp` (frame de 7,8 s: MATCH FOUND com a fila).
Usado na home (card do Match Queue) e no topo de `projects/match-queue/`, pelo mesmo
`<video data-loop-video>` + `assets/js/loop-video.js` do Goiás App e do La Pelve.

## Arquivos

| Caminho | O que é |
|---|---|
| `index.html` | o filme inteiro (HTML/CSS/JS); `window.render(t)` é determinístico, `window.DURATION` = 47.3 |
| `chem.js` | química do squad pela regra FC (33/33) |
| `cards/` | cartas recortadas do print do squad + escudo do Team Falcons (`team_logo.png`, `TEAM_LOGO_SRC`) |
| `card_mask.png`, `card_tex.png` | máscara e textura das cartas |
| `render.cjs` | captura de frames via Playwright (porta 8770) |
| `sheet.sh` | contact sheet de conferência (`OUT=dir ./sheet.sh nome t1,t2,… colunas`) |
| `ref/` | print do squad FUTBIN 294239 e logo original do Team Falcons |
| `scripts/` | recorte das cartas a partir do print (`cut_cards.py`, rodar desta pasta) |

## Renderizar (a partir desta pasta)

```bash
python3 -m http.server 8770 --bind 127.0.0.1 &      # imagens/máscaras exigem http, não file://
export NODE_PATH=/opt/node22/lib/node_modules        # playwright global
node render.cjs sheet <dir> 1.5,7.6,17.6             # frames avulsos para conferência
node render.cjs frames <dir> 120 8 1.5               # 120 fps, 8 workers, DPR 1.5
ffmpeg -framerate 120 -i <dir>/f%05d.jpg \
  -vf "tmix=frames=2,select='not(mod(n\,4))',setpts=N/(30*TB),scale=720:720:flags=lanczos,format=yuv420p" \
  -r 30 -c:v libx264 -profile:v high -preset slow -crf 19 -movflags +faststart -an master.mp4
```
O arquivo publicado sai dos mesmos frames em 2 passes, ~250 kbps (≈1,5 MB; Goiás App e La Pelve ficam em ~1–1,25 MB):
`… -c:v libx264 -profile:v high -preset veryslow -b:v 248k -maxrate 560k -bufsize 1120k -pass 1|2 …`
AV1 (mesmos frames, via um intermediário sem perdas `-c:v libx264 -qp 0`):
`ffmpeg -i master-lossless.mkv -c:v libsvtav1 -preset 4 -crf 38 -g 300 -svtav1-params tune=0 -pix_fmt yuv420p -movflags +faststart -an match-queue-loop.av1.mp4`
120 fps + tmix + decimação = motion blur leve. Fonte: Inter / Inter Display instaladas no sistema.
Por volta de 19,1 s (foco da carta na Database) o Chromium às vezes compõe um único quadro
de transição de forma diferente entre renders; não é mudança de conteúdo.

## Timeline
abertura 0–3 · matchmaking 3–11.8 · time/convite 11.8–18.3 · database+market 18.3–25.9 ·
squad 25.9–32.5 · skills 32.5–38.7 · desempenho (histórico → Champions⇄Rivals → perfil) 38.7–43.55 ·
final (wordmark MATCH QUEUE + "One at a time in the queue.") 43.55–47.3

## Dados (aprovados — não mudar)
- Fila: Vejrgang, Msdossary, **Lucksrei [YOU]** (usuário atual), AbuMakkah.
- **Team Falcons**: Lucksrei Owner, Msdossary Manager, Vejrgang Player, AbuMakkah entra pelo convite.
- Squad real FUTBIN 294239, 4-1-2-1-2, manager J. Prêcheur; química **33/33**, overall **86**.
- **Raphinha** 88 ST (PAC 91 · SHO 86 · PAS 85 · DRI 87 · DEF 54 · PHY 76), Market PC **460K**.
- Champions **14–1**, Rivals **Div 2 · 7–2–1** (dados demonstrativos, marcados "Sample data").
- Public Profile: Lucksrei · PC · PlayStation · `[escudo] Team Falcons`.
