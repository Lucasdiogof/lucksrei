# Etapa 3 — vídeos finais e troca de idioma contínua (relatório)

Estado: **pronto para revisão local. Nada publicado** (sem push/deploy). Os 24 MP4 originais publicados e seus pôsteres continuam intactos em `assets/video/` (rollback).

## A. Arquivos finais (72 = 24 H.264 + 24 AV1 + 24 pôsteres) — `assets/video/`
Padrão `{produto}-loop.{locale}.mp4`, `…av1.mp4`, `{produto}-loop-poster.{locale}.webp`; 720×720, 30 fps, sem áudio.
Gerados por `tools/video-i18n/build-finals.sh` a partir dos loops da Etapa 2; conferidos por `python tools/video-i18n/verify-finals.py` (72 arquivos, 0 problemas).

| Filme | Idioma | H.264 (KB) | AV1 (KB) | Pôster (KB) | Quadros | GOP máx. |
|---|---|---:|---:|---:|---:|---:|
| goias-app | pt-BR | 919 | 669 | 20.7 | 810 | 60 |
| goias-app | en | 914 | 667 | 20.9 | 810 | 60 |
| goias-app | es | 919 | 673 | 20.9 | 810 | 60 |
| aprovaura | pt-BR | 1722 | 1265 | 21.5 | 1500 | 60 |
| aprovaura | en | 1704 | 1244 | 21.2 | 1500 | 60 |
| aprovaura | es | 1722 | 1259 | 21.6 | 1500 | 60 |
| la-pelve | pt-BR | 528 | 471 | 9.7 | 1067 | 60 |
| la-pelve | en | 520 | 468 | 9.9 | 1067 | 60 |
| la-pelve | es | 529 | 473 | 9.6 | 1067 | 60 |
| match-queue | pt-BR | 1633 | 1175 | 27.1 | 1419 | 60 |
| match-queue | en | 1621 | 1161 | 25.7 | 1419 | 60 |
| match-queue | es | 1637 | 1175 | 26.8 | 1419 | 60 |
| bebometro | pt-BR | 1880 | 1358 | 34.1 | 1059 | 60 |
| bebometro | en | 1883 | 1357 | 35.3 | 1059 | 60 |
| bebometro | es | 1902 | 1382 | 39.3 | 1059 | 60 |
| orbijob | pt-BR | 2097 | 1571 | 19.1 | 1290 | 60 |
| orbijob | en | 2071 | 1553 | 17.8 | 1290 | 60 |
| orbijob | es | 2092 | 1575 | 18.7 | 1290 | 60 |
| busaogyn | pt-BR | 2068 | 1376 | 25.5 | 1260 | 60 |
| busaogyn | en | 2039 | 1332 | 24.0 | 1260 | 60 |
| busaogyn | es | 2086 | 1400 | 25.7 | 1260 | 60 |
| stockport | pt-BR | 1372 | 947 | 17.2 | 1317 | 60 |
| stockport | en | 1365 | 926 | 17.3 | 1317 | 60 |
| stockport | es | 1384 | 944 | 17.8 | 1317 | 60 |
| **total** | | **35.8 MB** | **25.8 MB** | **527 KB** | | |

Durações: Goiás 27,000 s · Aprovaura 50,000 s · La Pelve 35,567 s · Match Queue 47,300 s · Bebômetro 35,300 s · OrbiJob 43,000 s · BusãoGyn 42,000 s · StockPort 43,900 s (iguais nos 3 idiomas e nos 2 codecs).

Verificações (ffprobe, pacote a pacote): primeiro pts = 0; passo de pts constante 1/30 s sem lacunas; nº de quadros e duração **idênticos nos 3 idiomas e entre H.264 e AV1** (a mesma linha do tempo); começa em keyframe; **GOP fechado de 60 quadros (2 s), mínimo 30** (o publicado tinha intervalo de ~8 s: o seek exato custa ~0,1 s em vez de ~1 s); `yuv420p`, BT.709, faixa limitada, tags explícitas (VUI) em H.264 e AV1; `+faststart`; H.264 High@3.1 (compatível com iOS/Android); AV1 Main 8 bits.
Qualidade: H.264 CRF 29 e AV1 CRF 44 (SSIM ≈ 0,99 contra a origem nos dois). Tamanho por arquivo 0,5–2,1 MB (H.264) e 0,5–1,6 MB (AV1): em geral **menor que os publicados**, apesar do GOP curto. Só o arquivo do idioma ativo é baixado.
Cor: as origens da Etapa 2 eram BT.601 e, em 5 filmes, `yuvj420p` (faixa total). Foram convertidas explicitamente para BT.709 limitado. Comparado no Chrome com os vídeos publicados no mesmo instante: diferença média de 2–3,7 níveis (de 255); o tom muda até ±4 em StockPort/Goiás, porque o publicado tinha matriz inconsistente; os novos são fiéis ao render.
Pôsteres: mesmo instante do pôster publicado de cada filme (achado por comparação de quadros), WebP q84, ≈ 10–40 KB.

## B. Integração (centralizada em `assets/js/loop-video.js`)
- As 9 páginas (home com 7 vídeos e as 8 páginas de projeto; StockPort só na sua página) usam apenas `<video data-loop-video="nome" …>`: sem `src`/`poster` fixos. O idioma vem de `LucksreiLocale.current`/`LucksreiI18n` (preferência salva → navigator → en), então **o primeiro arquivo e o pôster já saem no idioma certo**, sem carregar pt e trocar depois.
- **Troca** (evento `lucksrei:locale`): o vídeo visível continua tocando; um 2º `<video>` é criado POR BAIXO dele, no idioma novo, levado ao mesmo ponto (seek + ajuste fino de `playbackRate`, medido quadro a quadro com `requestVideoFrameCallback`, ou `rAF` sem ele) e só substitui o atual quando está alinhado por 8 quadros seguidos e com ≥ 1,5 s de buffer. A troca é remover o que cobre o novo (sem pôster, spinner, preto ou seek visível). O antigo é descarregado. O alvo de sincronia é sempre a posição ATUAL do vídeo visível, não a do instante do clique.
- **Corridas**: contador de geração por vídeo; cada pedido cancela o anterior; voltar ao idioma já visível cancela a preparação; o último idioma escolhido vence (testado também em rede lenta).
- **Falha/rede lenta**: o vídeo atual segue no idioma anterior; erro, timeout (20 s) ou AV1 sem decoder (cai para H.264) abortam a preparação, que é tentada de novo (2×, após 8 s, e quando o vídeo reaparece).
- **Fora da tela / aba oculta**: sem player extra; descarrega o arquivo, mostra o pôster do idioma novo e retoma do mesmo tempo ao voltar. **Movimento reduzido / economia de dados**: sem vídeo; só o pôster, também trocado de idioma.
- Mantidos: carregamento só depois do `load`, IntersectionObserver (margem de 200 px), pausa fora da tela e com a aba oculta, AV1→H.264 automático, autoplay mudo, loop.
- Observabilidade: evento `lucksrei:video-swap` (`ok`, `driftMs`, `tookMs`, `attempts`, `reason`).

## C. Testes
- `tests/loop-video.test.js` (novo; roda no CI com os demais): URLs, wrap do loop, existência dos 72 arquivos, originais preservados, markup das 9 páginas. **Os 13 testes do site passam** (`for f in tests/*.test.js; do node $f; done`).
- `tools/video-i18n/e2e/switch.mjs` (Playwright, servidor local com Range e throttle): 12 cenários, **12/12 em Chrome 156 forçando H.264 e 12/12 em Chromium 156 com AV1** (JSON em `tools/video-i18n/e2e/out/`). Cenários: abre em cada idioma (arquivo, pôster e únicas requisições no idioma certo) · troca em reprodução PT→EN→ES→PT · 4 trocas em 120 ms cada (PT→EN→ES→PT→EN: vence EN, 1 player) · troca nos 2 s finais e logo após o reinício do loop · fora da tela · aba oculta · conexão lenta (70 KB/s: o PT segue tocando ~3 s até o EN estar pronto) · falha de download (ES bloqueado: mantém PT; liberado, a nova tentativa troca) · movimento reduzido (0 requisições de vídeo, pôster trocado) · home só baixa o que aparece (0 ao abrir, 7 ao rolar tudo, todos no idioma ativo; desktop e viewport móvel) · idioma final em rede lenta (EN→ES→PT→ES a 90 KB/s: vence ES) · sem quadro vazio (82–143 capturas de tela durante a troca: desvio-padrão mínimo ≥ 12, salto de brilho máximo 1,8/255).
- **Desvio temporal medido** (tempo do 1º quadro do novo − (último quadro do antigo + tempo decorrido), em 6 trocas por motor, incluindo o fim e o reinício do loop): **−37 a +32 ms**, isto é, ≤ 1 quadro (33 ms; a amostragem tem resolução de ~16 ms). Desvio interno no instante da troca ≤ 21 ms; nenhuma troca precisou de mais de 1 seek. Maior intervalo sem avanço do vídeo visível durante as trocas: 10–50 ms (nenhum congelamento). Reinícios em 0: nenhum. A preparação levou 1,7–3,1 s, com o vídeo antigo tocando normalmente.

## D. Limites, diferenças entre navegadores e riscos
- **Não verificado**: Safari/iOS e Firefox (só Chrome/Chromium estão instalados; baixar WebKit/Firefox do Playwright exige um download que não fiz sem autorização). O código não depende de recursos exclusivos do Chrome: sem `requestVideoFrameCallback` (Firefox antigo) cai para `rAF` + `currentTime`, com precisão menor (a tolerância de 1 quadro continua); Safari ≥ 15.4 tem rVFC. Pontos de atenção no Safari/iOS: número limitado de decoders simultâneos (na troca há 2 por vídeo, em 1 vídeo por vez); modo de pouca energia bloqueia o autoplay (fica o pôster, como antes); `canPlayType` de AV1 só devolve "probably" com decoder de hardware. Recomendado teste manual em iPhone/Safari antes de publicar.
- Que a troca seja imperceptível depende de rede e CPU: com rede muito lenta ela demora (o idioma antigo continua); em CPU fraca a preparação concorre com a reprodução por ~2 s. Trocar de idioma custa 1 arquivo novo (0,5–2,1 MB) por vídeo visível.
- Hospedagem: 62 MB de binários novos no repositório (H.264 36 MB, AV1 26 MB). Os `.mp4` não têm cache longo em `_headers`; a troca usa Range requests, vale conferir o cache da Cloudflare.
- Sem JavaScript não há vídeo nem pôster (antes o pôster vinha no HTML). Aceitável: os vídeos são decorativos (`aria-hidden`).

## E. Arquivos modificados / criados
Modificados: `assets/js/loop-video.js` (reescrito), `index.html`, `projects/{aura,bebometro,busaogyn,fan-hub,la-pelve,match-queue,orbijob,stockport}/index.html` (somente a tag `<video>`).
Novos: 72 arquivos em `assets/video/`, `tests/loop-video.test.js`, `tools/video-i18n/build-finals.sh`, `tools/video-i18n/verify-finals.py`, `tools/video-i18n/RELATORIO-ETAPA3.md`, `tools/video-i18n/e2e/switch.mjs` e `e2e/out/*.json`.

## F. Plano seguro de publicação (nada disso foi feito)
1. Revisar o diff e testar manualmente em iPhone/Safari e Firefox (abrir em cada idioma; trocar 5× durante a reprodução; trocar com rede 3G simulada; rolar a home).
2. Mesclar `video/etapa0-fontes` em `main` (já contém o `origin/main` de 29/10) e publicar pelo Workers Build (commit vazio "Trigger Workers build" se não disparar); conferir com `?v=`.
3. Pós-deploy: abrir a home e as 8 páginas em pt/en/es; no Network, conferir 1 MP4 por vídeo visível; trocar de idioma olhando o console (`lucksrei:video-swap`).
4. **Rollback**: `git revert` do commit do player/HTML; os originais e o `loop-video.js` antigo continuam no histórico e em `assets/video/`.
