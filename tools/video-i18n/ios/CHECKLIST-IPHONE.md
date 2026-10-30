# Validação no iPhone real — vídeos multilíngues (Etapa 3.1)

**Status: NÃO validado em iPhone.** O WebKit do Playwright (Windows) não substitui o Safari do iOS. Este roteiro gera a evidência que falta.

## O que você precisa
- 1 iPhone (idealmente iOS 17+; se tiver um segundo, mais antigo, melhor) e o PC na mesma rede Wi-Fi.
- Não precisa de Mac. Com Mac + cabo, dá para abrir o Web Inspector (Ajustes › Safari › Avançado › Inspetor Web) e ver Rede/Console.

## Caminho A — rede local (não publica nada, sem autorização extra)
1. No PC: `node tools/video-i18n/ios/serve.mjs 8080` (opcional: `node tools/video-i18n/ios/serve.mjs 8080 300` simula ~300 kB/s por MP4).
2. Libere a porta no firewall do Windows se o iPhone não abrir a página.
3. No iPhone (Safari): abra o endereço `http://<IP>:8080/tools/video-i18n/ios/diag.html` que o comando imprime.
4. Limites deste caminho: HTTP (não HTTPS) e servidor próprio — valida o **player e o Safari**, não o Worker/borda da Cloudflare.

## Caminho B — pré-visualização isolada em HTTPS (PRECISA DE AUTORIZAÇÃO ANTES)
Worker separado `lucksrei-video-preview`; não altera `lucksrei.com`, D1 nem rate limits. Custo zero (plano gratuito). Sem `wrangler deploy` na produção.
```
node tools/video-i18n/ios/prepare-preview.mjs
npx wrangler deploy -c wrangler.preview.jsonc        # só após o OK do dono; devolve https://lucksrei-video-preview.<conta>.workers.dev
```
Abrir `…/diag/diag.html` (diagnóstico) e as páginas reais (`/`, `/projects/orbijob/`).
**Remoção:** `npx wrangler delete -c wrangler.preview.jsonc` (apaga só o Worker de teste). Os vídeos ficam ~87 MB no preview; nada vai para o repositório.
Observação: o `workers.dev` é uma origem pública (sem `noindex`); apague ao terminar.

## Roteiro (marque cada item; copie o relatório com **Copiar relatório** e cole no chat)
Em cada item anote: aprovado/reprovado, versão do iOS, modelo, e o que viu.

| # | Cenário | Como | Aprova se |
|---|---|---|---|
| 1 | Primeiro carregamento | Abrir a página em aba nova (cache limpo: Ajustes › Safari › Limpar histórico) | Pôster aparece, vídeo começa sozinho em ≤ 3 s, sem tela preta nem ícone de play |
| 2 | Autoplay silencioso inline | Não tocar em nada | Toca sem tela cheia, sem som, em loop |
| 3 | H.264 | Relatório mostra `H.264: probably/maybe`; coluna "codec" do painel | Toca; se `AV1` aparecer e travar, deve cair sozinho para H.264 (sem erro persistente) |
| 4 | PT → EN → ES → PT | Botão **PT→EN→ES→PT** (ou tocar em cada idioma) | Troca em ≈ 1–3 s; a animação **não reinicia**; sem tela preta/spinner |
| 5 | Continuidade da linha do tempo | Olhar o tempo no painel antes/depois de cada troca | Tempo segue de onde estava (salto ≤ ~0,1 s) e o último `swap` mostra `driftMs` ≤ ~40 |
| 6 | Trocas rápidas | **Trocas rápidas** | O idioma final é o **último** pedido (log: "o ÚLTIMO foi …") e o arquivo exibido é o desse idioma |
| 7 | Perto do fim do loop | **Trocar perto do fim do loop**, repetir 3× | Sem reinício visível; sem congelamento > 400 ms |
| 8 | Rede lenta | Caminho A com `serve.mjs 8080 150`, ou Ajustes › Desenvolvedor › Condicionador de rede | O vídeo atual continua tocando no idioma antigo; a troca acontece depois; nunca fica preto |
| 9 | Voltar após trocar de app | Trocar de idioma, ir para outro app por 30 s, voltar | Volta tocando, no idioma certo, do ponto aproximado, sem erro (log mostra `visibilitychange`) |
| 10 | Modo de baixo consumo | Ajustes › Bateria › Modo de Baixo Consumo, recarregar a página | Ou toca normalmente, ou mostra só o pôster sem quebrar (o iOS pode bloquear autoplay); trocar de idioma atualiza o pôster. **Anote qual dos dois** |
| 11 | Páginas reais | Caminho B (ou o site publicado depois): `/` e `/projects/orbijob/`, trocar o idioma pelo botão do site | Mesmo comportamento da página de diagnóstico |

## Evidência de HTTP Range no aparelho
- Caminho A: o terminal do PC lista cada requisição (`206 bytes=0- …`). Safari deve pedir `bytes=0-1` e depois faixas; **qualquer `200` para MP4 com Range = reprovado**.
- Caminho B: Web Inspector (Mac) › Rede › cabeçalho de resposta do `.mp4` deve ter `Status 206`, `Content-Range`, `Accept-Ranges: bytes`.

## Critério para liberar a publicação
Itens 1–9 aprovados em pelo menos **um iPhone real**; item 10 anotado; nenhum `ERRO MÍDIA` persistente no relatório.
