# Laboratório do catálogo /apps (não publicado)

Três propostas funcionais sobre os dados reais de `assets/js/apps-data.js` (35 apps), com o mesmo header, hero, rodapé, i18n e tema da página oficial. `_lab` está no `.assetsignore`: não vai para o Worker.

- **A · Editorial App Directory** — índice numerado, linhas finas, metadados em colunas (`a.js`, `a.css`).
- **B · Product Gallery** — bento dos produtos próprios com palco tonal do logo; cards horizontais; vitrine Cooper (`b.js`, `b.css`).
- **C · Signature Lucksrei** — seletor com abas (teclado: setas, Home, End) e palco; linha do tempo dos profissionais; painel-registro Cooper (`c.js`, `c.css`).

Gerar as páginas: `node _lab/apps-catalog/build.mjs` (cria `a.html`, `b.html`, `c.html` a partir de `apps/index.html`).
Ver localmente: sirva a raiz do repositório (ex.: `npx serve .` ou qualquer servidor estático) e abra `/_lab/apps-catalog/a.html`, `b.html`, `c.html`. A barra inferior troca entre A, B, C e a página atual.
Cada página roda uma auditoria no console (`window.__labAudit`): 35 apps renderizados, nenhum link de loja/case perdido, nenhum link aninhado.
Textos novos do laboratório estão em `LAB_TEXT` (`lab-common.js`); ao integrar a proposta escolhida, vão para os 3 dicionários de `assets/i18n`.
