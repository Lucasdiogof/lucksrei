# OrbiJob — filme promocional (fonte)

43 s · 1920×1080 (master 16:9) e 720×720 (loop da home, recorte central 1080×1080) · 30 fps · mudo.
Publicado como `assets/video/orbijob-loop.av1.mp4` (AV1) e `assets/video/orbijob-loop.mp4` (H.264), pôster
`assets/video/orbijob-loop-poster.webp` (frame de 41,2 s), pelo mesmo `<video data-loop-video>` dos outros produtos
(card 06 da home e topo de `projects/orbijob/`).

## Arquivos
| Caminho | O que é |
|---|---|
| `index.html` | o filme inteiro (HTML/CSS/JS + SVG + Canvas 2D); `window.render(t)` é determinístico, `window.DURATION` = 43 |
| `assets/logo-horizontal-dark.svg` | logotipo oficial (a geometria dos arcos e do wordmark é a do arquivo, animada por partes) |
| `assets/world.svg` | mapa do mundo (Natural Earth, domínio público) amostrado em pontos para o globo |
| `assets/fonts/` | Space Grotesk, Inter e JetBrains Mono (OFL), embutidas |
| `render.mjs` | servidor local + captura quadro a quadro (Playwright) + encode (ffmpeg) |
| `ref/` | quadros de referência (JPG 960×540) |
| `out/` | MP4 gerados (fora do git) |

## Assistir
```bash
python3 -m http.server 8771 --bind 127.0.0.1     # nesta pasta (imagens/máscaras exigem http)
# http://127.0.0.1:8771/index.html  (espaço = pausa, ←/→ = ±1 s; ?t=12.5 congela um instante)
```
Com `prefers-reduced-motion: reduce` fica o quadro final.

## Renderizar
```bash
export PW_DIR=<pasta com node_modules/playwright> FFMPEG=<ffmpeg com libx264 e libsvtav1>
node render.mjs frames /tmp/f 60 5      # 60 fps, 5 workers
node render.mjs encode /tmp/f out 60    # 1080p, loop H.264 e AV1
```

## Timeline
abertura 0–5,6 · globo "Vagas do mundo inteiro" 5,6–12,6 · profissão em sete idiomas 12,6–19,6 · recomendação com motivo
19,6–25,4 · alertas (a cada hora, diário, semanal) 25,4–30,4 · candidatura etapa por etapa 30,4–36,4 ·
encerramento 36,4–43 ("Oportunidades no mundo inteiro. Sua carreira organizada.").

## O que é verdadeiro (conferido no README, l10n e dados do app `orbijob`)
Busca mundial por profissão, país e modalidade (presencial, híbrido, remoto) em fontes públicas com atribuição ·
busca multilíngue por profissão (pt, en, es, de, sv, nl, fr; ESCO © União Europeia, CC BY 4.0; rótulos reais de
"software developer") · recomendações explicadas com compatibilidade e confiança (frases do app) · pesquisas salvas com
alertas a cada hora, diários ou semanais, só para vagas abertas e verificadas recentemente · pipeline de candidaturas
(Interessado, Inscrito, Triagem, Entrevista, Proposta, Contratado), lembretes de entrevista, o usuário decide a etapa
e o app nunca contata o empregador. Sem contagem de vagas (muda todo dia) e sem afirmar disponibilidade nas lojas.
