# Auditoria dos 8 vídeos publicados (pt-BR / en / es) — 29/10/2026

Produção: https://lucksrei.com, `main` em bbbd013 (contém b6c1a1b). Nada foi alterado, commitado em produção, enviado ou publicado.

## Conclusão

**Nenhum erro encontrado.** Os 72 arquivos estão publicados, são idênticos byte a byte aos locais, os 24 vídeos mostram o idioma correto em todas as cenas com texto, H.264 e AV1 têm o mesmo conteúdo, e a home e as 8 páginas escolhem o arquivo certo. Nenhuma correção precisa ser publicada.

**Aprovaura em inglês: está em inglês.** `aprovaura-loop.en.mp4` e `aprovaura-loop.en.av1.mp4` estão publicados (200, video/mp4, 1.745.231 e 1.274.136 bytes, hash igual ao local). Em todos os quadros examinados (metas, menu de matérias, pergunta de Biologia e alternativas, revisão de erros, simulado, resultado, redação, notas, atualidades, nível, encerramento) o texto está em inglês, sem português residual. A pergunta, as alternativas, as matérias, os textos e os critérios do ENEM estão traduzidos. A página `/projects/aura/` em EN carrega `aprovaura-loop.en.av1.mp4?v=1` (ou `.en.mp4` sem AV1) e mostra "Build the habit." (captura em `site/`).

## 1. Produção (72 URLs, `?v=1`)

Script: `prod.mjs`. Resultado: 72/72 com HTTP 200, `Content-Type` correto (`video/mp4`, `image/webp`), `Cache-Control: public, max-age=31536000, immutable`, nenhum 404 nem arquivo vazio, **SHA-256 igual ao arquivo local nos 72**. Tamanhos: 0,5–2,1 MB (H.264), 0,5–1,6 MB (AV1), 10–40 KB (pôster).

## 2. Auditoria visual

Quadros dos arquivos baixados de produção, lado a lado PT | EN | ES, a cada 1,7–2,8 s (16–20 instantes por filme), mais o quadro final. Folhas em `capturas/<app>-mp4-N.jpg` (H.264), `capturas/aprovaura-av1-N.jpg` (AV1) e `capturas/ends.jpg` (final, H.264 pt/en + AV1 en/es).

Consistência H.264 × AV1: SSIM de cada AV1 contra o H.264 do mesmo idioma = 0,988–0,998 em todos os 24; contra o H.264 de outro idioma é menor (0,925–0,986), então os dois codecs têm o conteúdo do mesmo idioma. Complemento visual do AV1 no Aprovaura (pt/en/es) e no quadro final de todos os filmes.

| Aplicativo | PT-BR | EN | ES | H.264/AV1 | Player | Resultado |
|---|---|---|---|---|---|---|
| Goiás App | OK | OK | OK | OK (SSIM 0,991) | OK | OK |
| Aprovaura | OK | OK | OK | OK (0,992; AV1 visto) | OK | OK |
| La Pelve | OK | OK | OK | OK (0,998) | OK | OK |
| Match Queue | OK | OK | OK | OK (0,991) | OK | OK |
| Bebômetro | OK | OK | OK | OK (0,988) | OK | OK |
| OrbiJob | OK | OK | OK | OK (0,990) | OK | OK |
| BusãoGyn | OK | OK | OK | OK (0,988) | OK | OK |
| StockPort | OK | OK | OK | OK (0,991) | OK | OK |

Termos preservados de propósito (não são erro): Goiás, Avaí, Team Falcons, Match Queue, nomes de jogadores, Pix, R$, CREFITO, "Bafômetro", linhas e pontos de Goiânia, "Programador de software" (dado de vaga do OrbiJob).

Observações menores (não são tradução ausente):
- Bebômetro ES, quadro final: o slogan "Cerveza de barril, cachaça y buenos momentos" quebra em 3 linhas e a última fica rente à borda inferior (visível em `capturas/ends.jpg`, linha 4). Texto aprovado; só a folga do layout.
- Alguns quadros intermediários têm texto desfocado por transição (normal da animação).
- Cobertura: amostragem a cada ~2 s; não foi lido cada um dos ~36 mil quadros.

## 3. Player em produção (Playwright, Chromium 156, `lucksrei.com`)

Script: `site.mjs`; resultados: `site-av1.json` (AV1) e `site-h264.json` (AV1 desativado).
Em cada uma das 9 páginas: PT → EN → ES → PT, confirmando `currentSrc` e `lucksrei:video-swap`:
- 9/9 páginas, 4/4 passos, nos dois codecs: `currentSrc` com o idioma e o codec esperados; `ok:true`, desvio 0–4 ms, sem erros de página; o H.264 nunca caiu em AV1.
- Home: o card do Aprovaura é preguiçoso, então no primeiro passo ainda não tinha carregado (fora da tela, pausado, sem download). Depois de visível, a troca é correta.
- Carregamento inicial (`/projects/aura/`): idioma salvo `es` com navegador pt-BR → pôster e vídeo `es`; sem idioma salvo: en-US → `en`, es-ES → `es`, pt-BR → `pt-BR`. Só 2 requisições de mídia (pôster + vídeo do idioma ativo).
- Capturas de tela da página do Aprovaura em PT/EN/ES e da home em `site/`.

## Não verificado

- Safari/iOS e Firefox em produção (só Chromium instalado). A rede do usuário/CDN pode ter caches antigos de quem já baixou os vídeos sem `?v=1`; os URLs com `?v=1` estão corretos.
- Troca de idioma no site em conexões muito lentas em produção (testada só localmente na Etapa 3).
