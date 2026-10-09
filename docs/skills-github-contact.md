# Technical Skills, GitHub Contributions e Contact Form

## Technical Skills
- Ordem da grade, vínculos (experiências, projetos, relacionadas): `assets/js/skills-data.js`.
- Textos do modal nos 3 idiomas: `assets/js/skills-details.js` (carregado só quando o primeiro modal abre ou a grade chega perto da tela).
- Strings de interface: `skills.*` em `assets/i18n/*.js`. Nomes de tecnologias não são traduzidos.
- Só vincule empresa/projeto com evidência (linha do tempo da home, `/apps/`). `tests/skills.test.js` confere.
- Logos em `assets/img/skills/<id>.svg`, locais e sem fundo:
  - Marcas: [Simple Icons](https://simpleicons.org) 16.34.0 (CC0), preenchidas com a cor da marca (versão clara onde a oficial é escura: GitHub, iOS) — Flutter, Dart, Android, iOS, Supabase, PostgreSQL, Firebase, Codemagic, Fastlane, GitHub Actions, Git, GitHub, MySQL, JavaScript, TypeScript, JWT.
  - [Devicon](https://devicon.dev) 2.17.0 (MIT), versão colorida original: Java, Azure DevOps.
  - Conceitos sem logo oficial (BLoC, Provider, Clean Architecture, SOLID, TDD, Dependency Injection, Automated Testing, REST APIs, Hive, Sembast, ObjectDB, DB2, SQL, ZK Framework, Flutter Flavors): glifos de traço próprios, em dourado. Não imitam marcas.
  - Marcas registradas pertencem aos seus donos; os logos identificam as tecnologias usadas.

## GitHub Contributions
- Front: `assets/js/github-calendar.js` → `GET /api/github-contributions` (nunca o GitHub direto, sem token no navegador).
- Worker: `worker/github.mjs`. Com o secret `GITHUB_TOKEN` usa a API GraphQL oficial; sem ele, lê o fragmento público `github.com/users/Lucasdiogof/contributions` (não documentado: se mudar, o endpoint responde 503 e a página mostra erro, nunca dado falso).
- Cache de borda de 6 h; a última resposta boa fica 7 dias e é servida (`stale: true`) se o GitHub falhar ou limitar.
- Para usar a API oficial: `npx wrangler secret put GITHUB_TOKEN` (token fine-grained/classic sem escopos extras, leitura pública basta). Nunca commitar.
- **Validar a integração real (depois do deploy, com internet):** `node tools/check-github-calendar.mjs https://lucksrei.com` compara a API com o fragmento público do perfil dia a dia; depois confira o total com github.com/Lucasdiogof e `curl -s https://lucksrei.com/api/github-contributions | head -c 300` (`"source":"graphql"` indica a API oficial). Dados sintéticos existem só em `tests/helpers/github-fixture.js`.
- Só contribuições públicas (e privadas, se o perfil as exibir). Contribuição não é métrica de produtividade.

## Contact Form
- Front: `assets/js/contact-form.js`; marcação na home (`#contato`) e em `/contact/`; strings `contact.form.*`.
- Worker: `worker/contact.mjs` → `POST /api/contact`. Sucesso (200) só depois do provedor aceitar o e-mail; sem provedor responde 503.
- Antiabuso: mesma origem, JSON ≤ 8 KB, honeypot (`website`), tempo mínimo de 2 s, limite por IP (3/10 min, 10/dia) e global (40/h) via `caches.default`, validação e saneamento no servidor, nada do conteúdo em log.
- **Configuração necessária (uma das duas):**
  1. Cloudflare Email: ativar Email Routing em lucksrei.com, verificar `marketing@lucksrei.com` como destino e adicionar em `wrangler.jsonc`:
     `"send_email": [{ "name": "SEND_EMAIL", "destination_address": "marketing@lucksrei.com" }]`
  2. Resend: verificar o domínio lucksrei.com no Resend e `npx wrangler secret put RESEND_API_KEY`.
- Entregabilidade: o remetente (`CONTACT_FROM`) precisa estar no domínio verificado, com SPF e DKIM do provedor publicados e DMARC no DNS de lucksrei.com; o visitante vai em `Reply-To`, nunca em `From`. Teste o fluxo real com um envio seu antes de divulgar e confira caixa de entrada e spam.
- Limites conhecidos: o contador de rate limit usa `caches.default` (por data center, não atômico: rajadas simultâneas podem passar de 3). Funciona no domínio lucksrei.com, não em `*.workers.dev`. Para limite global estrito, usar o binding de Rate Limiting da Cloudflare.
- Opcionais (`vars`): `CONTACT_TO` (padrão marketing@lucksrei.com), `CONTACT_FROM` (padrão contact@lucksrei.com; precisa estar no domínio verificado).

## Testes
`for t in tests/*.test.js; do node $t; done`
