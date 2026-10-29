# Dicionários de texto dos vídeos (Etapa 1)

Um `<video>.json` por vídeo, com todos os textos visíveis em **pt-BR**, **en** e **es**. O texto do idioma original
é o que está no código do vídeo; os outros dois são propostas. Nada aqui altera os vídeos publicados.

- `strings[]`: `id`, `t` (segundos em que aparece), `pt-BR`, `en`, `es`, `from`, `note`.
  - `from`: `app` = texto oficial do app (l10n do projeto), `app~` = adaptado do oficial, `proposta` = a revisar.
  - `\n` separa as linhas dos títulos animados (a última linha é a destacada); `{x}` é valor que não muda.
- `keep`: o que permanece igual em todos os idiomas. `protected`: nomes que não podem sumir de nenhuma tradução.
- **Regra geral:** nomes de times, clubes, jogadores, marcas e aplicativos nunca são traduzidos; dados demonstrativos
  brasileiros (R$, Pix, Crefito, linhas e cidades) permanecem.
- `REVISAO.md`: tabela única para revisar (gerada dos JSON).
- `node tools/video-i18n/check.mjs`: confere campos, placeholders, número de linhas, nomes protegidos e se o texto original
  ainda existe na fonte do vídeo. Goiás e La Pelve ficam fora deste repositório: `FILMS_DIR=<pasta com fan-hub-launch-film e la-pelve-launch-film>`.
  A conferência é tolerante (ignora maiúsculas e aceita palavras soltas); o aviso de "mais longo" aponta risco de layout.
