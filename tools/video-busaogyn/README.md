# BusãoGyn — filme promocional (fonte)

42 s · 1920×1080 (master 16:9) e 720×720 (loop da home, recorte central 1080×1080) · 30 fps · mudo.
Publicado como `assets/video/busaogyn-loop.av1.mp4` (AV1) e `assets/video/busaogyn-loop.mp4` (H.264), pôster
`assets/video/busaogyn-loop-poster.webp` (frame de 41 s), pelo mesmo `<video data-loop-video>` dos outros produtos
(card 07 da home e topo de `projects/busaogyn/`).

| Caminho | O que é |
|---|---|
| `index.html` | o filme inteiro (HTML/CSS/JS + Canvas 2D); `window.render(t)` é determinístico, `window.DURATION` = 42 |
| `assets/logo.png` | logo oficial do app (`busaogyn/docs/brand/source/logo-master-transparent.png`), sem redesenho |
| `assets/fonts/` | Geist e Geist Mono (OFL), as mesmas do app |
| `render.mjs` | servidor local + captura quadro a quadro (Playwright) + encode (ffmpeg) |
| `ref/` | quadros de referência · `out/` MP4 gerados (fora do git) |

## Assistir e renderizar
```bash
python3 -m http.server 8771 --bind 127.0.0.1     # nesta pasta
# http://127.0.0.1:8771/index.html  (espaço = pausa, ←/→ = ±1 s; ?t=12.5 congela um instante)
export PW_DIR=<pasta com node_modules/playwright> FFMPEG=<ffmpeg com libx264 e libsvtav1>
node render.mjs frames /tmp/f 60 5 && node render.mjs encode /tmp/f out 60
```
Com `prefers-reduced-motion: reduce` fica o quadro final.

## Timeline
"Cadê o busão?" e a marca 0–5,6 · código do ponto e chegadas 5,6–13 · tempo real, programado e não confirmado 13–19,8 ·
acompanhamento no mapa (posição a cada 15 s, trilha calculada, Centralizar, outros ônibus do ponto que envelhecem e somem)
19,2–33 · pontos favoritos 32,4–36,2 · encerramento: a estrada corre para a câmera e o ônibus da marca chega de frente (faróis, linhas de velocidade), "Saiba onde seu ônibus está." 36,2–42.

## O que é verdadeiro (README e docs/MVP_UX.md do app)
Busca pelo código da placa do ponto (30402 é o ponto de teste do app) · chegadas por linha com qualidade do dado
(tempo real, programado, não confirmado) · acompanhar ônibus com GPS informado pela fonte, posição a cada 15 s, câmera
que segue e Centralizar · outros ônibus do ponto no mapa, que somem quando a posição envelhece · favoritos e recentes só no
aparelho · tema sistema/noturno/claro com o mapa acompanhando. O filme não mostra linhas, trajetos, pontos próximos nem
ocupação: o app ainda não tem esses dados. Os minutos e os números de linha dos exemplos são ilustrativos.
