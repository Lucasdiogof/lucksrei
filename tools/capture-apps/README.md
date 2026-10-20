# Capturas dos apps para as páginas de case (Bebômetro e OrbiJob)

As telas de `assets/img/bebometro/screens/` e `assets/img/orbijob/screens/` (pt-BR, en, es) são do app real, com dados fictícios
(pessoa inventada, e-mails example.com) e nenhum dado pessoal. Nada disso é commitado nos repositórios dos apps.

## OrbiJob (teste de widget do próprio app, fontes reais, dados em memória)
1. Copiar `orbijob/capture_site_test.dart` para `orbijob/app/test/tool/` (arquivo temporário, não commitar).
2. `cd orbijob/app && FLUTTER_ROOT=<flutter> CAPTURE=1 CAPTURE_OUT=<pasta> <flutter>/bin/flutter test test/tool/capture_site_test.dart`
   — gera `<tela>-<pt|en|es>.png` (780×1688, 2x, tema claro, 23 telas × 3 idiomas).
3. Reduzir para 738 px de largura e salvar como WebP em `assets/img/orbijob/screens/<pt-BR|en|es>/<tela>.webp`.

## Bebômetro (build web com entrada local, navegação por Playwright)
O app exige conta e sincroniza com o Supabase; para a captura ele roda só local, com dados fictícios semeados:
1. Copiar `bebometro/main_capture.dart` para `bebometro/lib/` (temporário) e, em `lib/core/di/injector.dart`, trocar
   `_cloudEnabled = true;` por `_cloudEnabled = !const bool.fromEnvironment('CAPTURE_LOCAL');` (temporário; `git checkout` depois).
2. `flutter build web --release --target lib/main_capture.dart --dart-define=CAPTURE_LOCAL=true --output <A>` e,
   sem o define, `--output <B>` (a tela de login precisa do modo com nuvem para não mostrar o aviso de conexão).
3. Servir `<A>` na porta 8775 e `<B>` na 8776 (`python3 -m http.server`).
4. `PW_DIR=<pasta com node_modules/playwright> BB_REPO=<repo do bebometro> BB_OUT=<saida> node capture.cjs <pt|en|es>`
   (Chromium 390×844 @2x; os toques usam a árvore de semântica do Flutter e os rótulos vêm do ARB do app).
5. Converter como no OrbiJob para `assets/img/bebometro/screens/`.
Parâmetros de URL da entrada de captura: `lang`, `out=1` (sem sessão), `idle=1` (sem rolê em andamento).
