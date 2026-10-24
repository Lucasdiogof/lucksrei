<p align="center">
  <img src="assets/img/brand/lucksrei-md.webp" width="160" alt="Lucksrei">
</p>

<h1 align="center">lucksrei.com</h1>

<p align="center">
  Portafolio de Lucas Diogo França, ingeniero mobile, y casa de las apps y sistemas de Lucksrei.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML-E34F26?logo=html5&logoColor=white" alt="HTML">
  <img src="https://img.shields.io/badge/CSS-1572B6?logo=css3&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/Cloudflare_D1-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare D1">
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.pt-BR.md">Português</a> · <b>Español</b>
</p>

---

Sitio estático, sin paso de build y sin framework: HTML, CSS y JavaScript puros servidos por Cloudflare Workers Static Assets. Un Worker pequeño responde solo `/api/*` (estadísticas de visitas, formulario de contacto, calendario de GitHub). En línea en **[lucksrei.com](https://lucksrei.com)**.

## Qué hay en el sitio

| Página | Contenido |
| --- | --- |
| `/` | Inicio: escena en pixel art en el hero, casos, habilidades técnicas con evidencias, mapa de visitantes y contacto |
| `/apps/` | Todas las apps y sistemas de Lucksrei, con pestañas, enlaces a las tiendas y a las apps web |
| `/projects/<app>/` | Caso de cada app (Aprovaura, Bebômetro, BusãoGyn, Fan Hub, La Pelve, Match Queue, OrbiJob, StockPort) y sus páginas de privacidad, soporte y eliminación de datos |
| `/privacy/`, `/terms/`, `/support/` | Páginas generales de privacidad, términos y soporte de los sistemas licenciados |
| `/contact/` | Formulario de contacto (Resend, Turnstile opcional) |
| `/visitors/` | Visitas agregadas por país y estado/región |

Todo el sitio está en **inglés, portugués y español** (`assets/i18n/{en,pt-BR,es}.js`), con capturas por idioma (`assets/js/screenshots-data.js`) y temas claro y oscuro.

## Arquitectura

```text
index.html, apps/, projects/, ...   páginas estáticas (servidas directamente, sin costo de Worker)
assets/css/style.css                tokens de diseño (:root) y todos los estilos
assets/js/                          scripts de las páginas: i18n, hero, apps, skills, visitantes, contacto
assets/i18n/                        diccionarios en, pt-BR y es
worker/                             Worker solo para /api/* (run_worker_first)
migrations/                         esquema de D1 (lucksrei-visits)
tests/                              pruebas en Node, sin dependencias
tools/                              generadores de assets (marca, hero, mapas, videos de las apps, capturas)
docs/                               notas internas (no se sirven)
```

### API

| Endpoint | Qué hace |
| --- | --- |
| `POST /api/visit` | cuenta una visita por mes, país y región en D1 (filtra bots y datacenters, con límite de tasa) |
| `GET /api/visitors` | agregados de los últimos 12 meses (caché de borde de 5 min) |
| `GET /api/whoami` | país y región del propio visitante |
| `POST /api/contact` | valida y envía el e-mail de contacto (límites, honeypot, Turnstile cuando está activado) |
| `GET /api/turnstile-config` | sitekey pública de Turnstile y si está activo |
| `GET /api/github-contributions` | calendario de contribuciones de GitHub (caché de borde de 6 h) |

Toda respuesta de la API lleva cabeceras de seguridad estrictas (`worker/security.mjs`); las páginas estáticas reciben las suyas desde `_headers`. Modelo de amenazas completo y rollbacks: [docs/security.md](docs/security.md).

## Ejecutar en local

Requiere Node.js 22 y Wrangler.

```bash
npx wrangler dev --local          # sitio + API en http://localhost:8787
npx wrangler d1 migrations apply lucksrei-visits --local
```

Las páginas también abren en cualquier servidor estático; solo `/api/*` necesita el Worker.

### Configuración

Se define en el Worker (`Settings → Variables and Secrets`), nunca en el repositorio. `wrangler.jsonc` usa `keep_vars` para que las variables del panel sobrevivan a los deploys.

| Nombre | Tipo | Para qué |
| --- | --- | --- |
| `RESEND_API_KEY` | secret | envía el e-mail de contacto con Resend |
| `CONTACT_TO` / `CONTACT_FROM` | variable (opcional) | reemplaza las direcciones de contacto por defecto |
| `TURNSTILE_SITE_KEY` | variable (pública) | widget de Turnstile |
| `TURNSTILE_SECRET_KEY` | secret | Siteverify de Turnstile |
| `TURNSTILE_ENFORCE` | variable | `on` hace obligatorio Turnstile |
| `GITHUB_TOKEN` | secret (opcional) | GraphQL de GitHub para el calendario (sin él, se lee la página pública del perfil) |

## Pruebas

```bash
for f in tests/*.test.js; do node "$f"; done
```

El mismo bucle corre en CI (`.github/workflows/site-tests.yml`) en cada push. Las pruebas cubren la paridad de i18n, capturas por idioma, el dataset de apps, el diseño de las páginas legales, las cabeceras de seguridad, el formulario de contacto, Turnstile y la API de visitantes.

## Deploy

Un push a `main` publica mediante Cloudflare Workers Builds. `.assetsignore` deja el código del Worker, las pruebas, las herramientas, los docs y estos READMEs fuera de los assets públicos.

## Documentación

Notas internas, en portugués:

- [DESIGN.md](DESIGN.md): design system "Royal Tech": colores, tipografía, espaciado, componentes
- [docs/security.md](docs/security.md): superficie de la API, límites, cabeceras, Turnstile, rollback
- [docs/visitor-analytics.md](docs/visitor-analytics.md): conteo de visitas y el mapa
- [docs/hero-v3.md](docs/hero-v3.md): la escena en pixel art del hero

## Licencia

No se concede ninguna licencia open source. El código es público como parte de un portafolio; todos los derechos reservados. El logo y los assets de la marca Lucksrei no pueden reutilizarse.

---

Creado por Lucas Diogo França.
