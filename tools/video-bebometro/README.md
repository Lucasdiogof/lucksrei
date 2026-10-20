# Bebômetro — filme promocional (fonte)

35,3 s · 1920×1080 (master 16:9) e 720×720 (loop da home, recorte central 1080×1080) · 30 fps · mudo.
Publicado na home como `assets/video/bebometro-loop.av1.mp4` (AV1, 2,3 MB) e `assets/video/bebometro-loop.mp4`
(H.264, 3,2 MB), pôster `assets/video/bebometro-loop-poster.webp` (frame de 32,9 s), pelo mesmo
`<video data-loop-video>` + `assets/js/loop-video.js` dos outros produtos.

## Arquivos

| Caminho | O que é |
|---|---|
| `index.html` | o filme inteiro (HTML/CSS/JS + SVG + Canvas 2D); `window.render(t)` é determinístico, `window.DURATION` = 35,3 |
| `assets/logo_cap.png`, `assets/logo_wordmark.png` | logo oficial (cópia de `bebometro/assets/branding/`) — nunca redesenhada |
| `assets/fonts/` | Anton e Inter (OFL), embutidas; nenhuma chamada externa |
| `render.mjs` | servidor estático local + captura quadro a quadro (Playwright) + encode (ffmpeg) |
| `ref/` | quadros de referência de cada cena (JPG 960×540) |
| `out/` | MP4 gerados (fora do git): `bebometro-1080p.mp4` (master 16:9, ~32 MB), `bebometro-loop.mp4`, `bebometro-loop.av1.mp4` |

## Assistir

```bash
python3 -m http.server 8771 --bind 127.0.0.1     # nesta pasta; imagens/máscaras exigem http, não file://
# abrir http://127.0.0.1:8771/index.html   (espaço = pausa, ←/→ = ±1 s, barra aparece ao passar o mouse; ?t=12.5 congela um instante)
```
Com `prefers-reduced-motion: reduce` o filme não toca: fica o quadro final (32,9 s).

## Renderizar

```bash
export PW_DIR=<pasta com node_modules/playwright> FFMPEG=<ffmpeg com libx264 e libsvtav1>
node render.mjs sheet  /tmp/s 2.2,8.8,33.6        # frames avulsos 1920×1080 PNG
node render.mjs frames /tmp/f 60 5                # 60 fps, 5 workers (~2,5 min)
node render.mjs encode /tmp/f out 60              # 60→30 fps com tmix (motion blur leve): 1080p, loop H.264 e AV1
```

## Timeline
abertura 0–5,4 (tampa 3D, impacto, marca) · A resenha 5,4–14,4 (tampa vira o botão "Mais uma", 4 chopes, variedade de drinks — cerveja, chope, sem álcool, destilados, prontos, coquetéis —, 6 cenários) ·
Organização 14,4–21,8 (garrafa 600 ml → 3 × 200 ml; comanda → R$ 258,50 ÷ 3) · Diversão 21,8–31,0 (copo inclinável,
3 jogos, bafômetro) · Encerramento 31,0–38,6 (convergência, tampa, "Chope, cachaça e resenha.").

## O que é verdadeiro (conferido no README/l10n/assets do app `bebometro`)
Mais uma repete o último pedido · mesa ilustrada com 6 cenários (bar, churrasco, praia, balada, casa, restaurante) ·
garrafa compartilhada com porções iguais ou personalizadas · comanda: itens agrupados, serviço 10%, divisão por pessoa
com centavos que fecham, pagamento por pessoa · copo inclinável (visual, não registra nada) · 3 jogos offline sem placar
e sem punição · bafômetro (sem número, sem veredito) · catálogo com cervejas, chopes, sem álcool, destilados, prontos para beber e receitas de coquetel, além de drinks próprios. Valores e apelidos (João, Gleidson, Rodrigo) são ilustrativos
e o filme diz isso. O app está em desenvolvimento, sem lançamento nas lojas: a home mostra "Em desenvolvimento".
