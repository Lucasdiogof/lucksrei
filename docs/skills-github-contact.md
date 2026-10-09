# Technical Skills, GitHub Contributions e Contact Form

## Technical Skills
- Ordem da grade, vínculos (experiências, projetos, relacionadas): `assets/js/skills-data.js`.
- Textos do modal nos 3 idiomas: `assets/js/skills-details.js` (carregado só quando o primeiro modal abre ou a grade chega perto da tela).
- Strings de interface: `skills.*` em `assets/i18n/*.js`. Nomes de tecnologias não são traduzidos.
- Só vincule empresa/projeto com evidência (linha do tempo da home, `/apps/`). `tests/skills.test.js` confere.
- Logos em `assets/img/skills/<id>.svg`, locais e sem fundo:
  - Marcas: [Simple Icons](https://simpleicons.org) 16.34.0 (CC0), preenchidas com a cor da marca (versão clara onde a oficial é escura: GitHub, iOS) — Flutter, Dart, Android, iOS, Supabase, PostgreSQL, Firebase, Codemagic, Fastlane, GitHub Actions, Git, GitHub, MySQL, JavaScript, TypeScript, JWT.
  - [Devicon](https://devicon.dev) 2.17.0 (MIT), versão colorida original: Java, Azure DevOps.
  - Logos oficiais copiados dos repositórios dos projetos: BLoC (`felangel/bloc`, `docs/src/assets/bloc.svg`, MIT, recortado no cubo) e Hive (`isar/hive`, `.github/logo_transparent.svg`, Apache-2.0, só o símbolo). Fastlane usa o SVG colorido do conjunto SVG Logos (CC0).
  - ZK Framework: PNG original `assets/images/zklogo.png` do repositório oficial de documentação `zkoss/zkdoc` (449×449, "zk" branco sobre azul), sem vetorização nem edição (`ext: "png"` em `skills-data.js`). O logo é marca registrada do ZK.
  - DB2: ícone "Db2" do IBM Carbon Design System (`@carbon/icons`, `ibm-db2-alt`, Apache-2.0), apenas recolorido para o fundo escuro. É o ícone de produto publicado pela IBM, não o material de marketing.
  - Flutter Flavors e Provider: composições fornecidas pelo proprietário (marca do Flutter + "Flutter Flavor"; marca do Dart + "Provider"), em PNG com fundo transparente e texto em marfim para o fundo escuro, sem redesenho (`ext: "png"`, `wide: true`: mantêm a altura de 40 px do ícone e a largura do cartão). Não são logos oficiais do recurso/pacote, que não têm identidade visual própria: o repositório `rrousselGit/provider` só traz o selo "Flutter Favorite" e um ícone do Flutter.
  - Conceitos sem logo oficial verificável (Clean Architecture, SOLID, TDD, Dependency Injection, Automated Testing, REST APIs, Sembast, ObjectDB, SQL): glifos de traço próprios, em dourado, mantidos até aparecer um asset verificável. Pesquisa: `tekartik/sembast.dart` (0 imagens), pub.dev, Maven Central, 245 conjuntos do Iconify e buscas web não retornaram logo oficial de Sembast nem de ObjectDB (as imagens de "ObjectDB" encontradas são do Db4o). Os ícones "solid" e "hive" do Simple Icons pertencem a outros produtos (SolidJS, Hive blockchain/Apache Hive) e não foram usados.
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
