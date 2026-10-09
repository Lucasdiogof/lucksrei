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
- **Provedor em produção: Resend.** O Worker `lucksrei-site` lê o secret `RESEND_API_KEY` (`npx wrangler secret put RESEND_API_KEY`; nunca no repositório, em `vars` ou no front). Envio: `From: Lucksrei <marketing@lucksrei.com>`, `To: marketing@lucksrei.com`, `Reply-To:` e-mail do visitante, texto puro. Sem o secret o endpoint responde 503. O binding `send_email` do Cloudflare continua suportado como alternativa, mas só é usado se `RESEND_API_KEY` não existir (e não está em `wrangler.jsonc`).
- **Email Routing preservado:** nada no repositório altera o Email Routing. O e-mail do formulário chega a `marketing@lucksrei.com` pelo MX do domínio e o Routing o encaminha ao Gmail como qualquer outro. Não ative "Receiving" do Resend no domínio raiz (conflitaria com o MX do Cloudflare).
- Entregabilidade: o remetente precisa estar no domínio verificado (DKIM/SPF do Resend) e convém ter DMARC no DNS; o visitante vai em `Reply-To`, nunca em `From`. Como remetente e destinatário são o mesmo endereço, o Gmail pode filtrar a mensagem: faça um envio real pelo formulário depois do deploy, confira caixa de entrada e spam e crie um filtro "nunca enviar para spam" para `marketing@lucksrei.com` se precisar.
- Limites conhecidos: o contador de rate limit usa `caches.default` (por data center, não atômico: rajadas simultâneas podem passar de 3). Funciona no domínio lucksrei.com, não em `*.workers.dev`. Para limite global estrito, usar o binding de Rate Limiting da Cloudflare.
- Opcionais (`vars`, sem segredo): `CONTACT_TO` e `CONTACT_FROM` (só o endereço; padrão marketing@lucksrei.com nos dois; valor inválido volta ao padrão).

## Testes
`for t in tests/*.test.js; do node $t; done`
