# Lucksrei — design system

Portfólio de engenharia mobile. Site estático (HTML + CSS + JS, sem build, sem framework), servido por um Cloudflare Worker.
Fonte única de tokens: `assets/css/style.css` (`:root`). Textos: `assets/i18n/{en,pt-BR,es}.js`. Screenshots por idioma: `assets/js/screenshots-data.js`.

## Direção

**Ficha técnica editorial.** Parece um documento de engenharia bem diagramado, não uma landing page.

- Estrutura por **linhas finas (1px), tipografia e índices**, não por caixas.
- O **produto real** (screenshots) é o protagonista; o resto da interface é discreto.
- Texto curto e factual. Sem promessa de marketing, sem número inventado.
- Variar a **composição** entre seções (tamanho, orientação, recorte), mantendo os mesmos tokens.

## Cores

Base escura, um único acento. Cores de produto só aparecem como **tom** (nunca como fundo saturado).

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#06080d` | fundo da página |
| `--bg-soft` | `#0a0d14` | fundo de placas, terminal |
| `--panel` / `--panel-2` / `--panel-hover` | `#0e131c` / `#121826` / `#151c2c` | superfícies (cards só quando clicáveis) |
| `--border` / `--border-strong` | `#1d2532` / `#2a3446` | linhas finas / ênfase |
| `--text` / `--text-dim` / `--text-faint` | `#eef1f7` / `#a7b1c4` / `#6d778c` | texto primário / corpo / metadados |
| `--accent` | `#6ea8fe` | links, rótulos de seção, foco |
| `--accent-2` | `#58d3a5` | cargo atual, status positivo |
| `--accent-warn` | `#f2b56b` | avaliação, "em desenvolvimento" |
| `--danger` | `#f2837c` | somente erro (404) |
| `--p` (por projeto) | Fan Hub `#6fcf97` · Match Queue `#2ee88a` · La Pelve `#d59ab4` · Aprovaura `#7fbfe0` | tom da placa, número, link e hover do projeto |

Regras: no máximo **um** acento por tela; cor de projeto só dentro do card daquele projeto; contraste mínimo AA para texto de corpo.

## Tipografia

Sans do sistema (`--font`) para texto; mono do sistema (`--font-mono`) para **rótulos, metadados, números e código**. Sem webfont (zero requisição, zero CLS).

| Papel | Tamanho | Peso / ajuste |
|---|---|---|
| Display (h1 da home) | `clamp(42px, 6vw, 76px)` | 650 · tracking −.035em · line-height .99 |
| Título de CTA / 404 | `clamp(32px, 5vw, 60px)` / `clamp(34px, 5vw, 56px)` | 650 · −.03em |
| H2 de seção | `clamp(26px, 3.6vw, 38px)` | 650 · −.02em |
| H3 de projeto | 28 (par) · 40–42 (faixa) · 56 (destaque) | 650 |
| Corpo | 15.5–16.5px / 1.65–1.75 | 400, cor `--text-dim`, largura máx. 440–620px |
| Metadado / rótulo (mono) | 11.5–13px | 400–600, maiúsculas com tracking .06em quando for rótulo de seção |

Nunca usar peso 700+ em texto corrido. Parágrafos nunca passam de ~65 caracteres por linha.

## Espaçamento

Escala 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 88.
- Seção: `88px` vertical (`64px` ≤ 700px). Hero: 72/80. CTA final: 96/104.
- Dentro de cards/placas: 44 (desktop) · 24–28 (mobile).
- Entre itens de lista: 10–14px; linhas finas separam, não espaço extra.

## Grid

`--container: 1180px`, gutter 24px. Colunas em frações (não 12-col rígido):
hero `1.3fr / .7fr` · sobre `1.3fr / .7fr` · destaque `.95fr / 1.05fr` · faixa espelhada `1.05fr / .95fr` · par `1fr / 1fr` · CTA `1.2fr / .8fr`.
Breakpoints: **980** (hero empilha) · **900** (vitrine empilha) · **860** (nav → menu, sobre/CTA empilham) · **700** · **560** (2 recortes por placa) · **480**.

## Raios e bordas

| Raio | Uso |
|---|---|
| `6px` | retrato, linhas de dado |
| `10px` (`--radius-sm`) | botões, terminal |
| `16px` (`--radius`) | placas de projeto |
| `18px` (só cantos superiores) | screenshot recortada na placa |
| `999px` | **apenas** seletor de idioma, chips de filtro e badge |

Borda é sempre `1px`. Sombra: **nenhuma** (profundidade vem de tom e linha).

## Regras de card

1. Card só existe quando o bloco inteiro é **um link ou tem estado** (projeto, app, filtro). Listas informativas usam **linhas finas**.
2. Nunca quatro cards idênticos. Projetos têm três composições: **destaque** (placa à direita, 3 recortes), **faixa espelhada** (placa à esquerda, recortes invertidos) e **par compacto** (placa em cima).
3. Sem ícone grande em círculo, sem gradiente de fundo, sem brilho.
4. Hierarquia de tamanho comunica prioridade: 01 > 02 > 03/04.

## Screenshots

- Telas reais e artes de marketing entram **recortadas na base da placa** (a tela "sobe" de baixo e é cortada), em colunas **escalonadas** (`--dy`), nunca num grid uniforme.
- Cantos superiores `18px`, borda `1px` na cor do projeto a 18%, fundo da moldura = tom do projeto (`--p` a `--mix`%) enquanto carrega.
- `width`/`height` sempre no `<img>` (sem CLS), `loading="lazy"` e `decoding="async"` (exceto o retrato do hero, `fetchpriority="high"`).
- Imagem só aparece no idioma em que existe (`screenshots-data.js`); sem fallback entre idiomas. Placa sem nenhuma imagem no idioma some e o card vira tipográfico (`.no-visual`).
- No mobile: no máximo **2** recortes por placa.
- Nunca mostrar dado pessoal real (e-mail, nome completo de terceiros). Nunca usar IP de terceiros como protagonista.

## Movimento

- Só `transform` e `opacity`. Durações: 200–250ms (hover), 300–350ms (indicador, seletor), 600–800ms (entrada).
- Easing único: `--ease: cubic-bezier(.16,.8,.24,1)`.
- Permitido: revelação curta dos blocos (`[data-reveal]`), entrada escalonada dos recortes, hover do projeto (recortes sobem 8px, seta anda 4px), indicador deslizante do menu, thumb do seletor de idioma, contadores das métricas, sublinhado do e-mail, linhas do terminal da 404.
- `prefers-reduced-motion: reduce`: todas as transições/animações viram instantâneas, reveals ficam visíveis, hover não translada.
- Sem biblioteca de animação. Sem cursor customizado. Sem parallax, tilt, magnet ou scroll-jacking.

## Responsivo

Mobile é projeto próprio, não desktop encolhido: texto **antes** da foto; placas empilham (texto, depois recortes); 2 recortes; rodapé em 2 colunas (1 em ≤480); tabelas viram listas; alvo de toque ≥ 40px; nunca overflow horizontal.

## Navbar e rodapé

- Navbar sticky, borda e blur (`10px`) só depois do scroll; altura constante. Um único indicador sublinhado desliza para o link ativo/hover/foco. Seletor EN/PT/ES é um controle segmentado com thumb deslizante (`:has`, com fallback).
- Rodapé: marca, descrição, **3 colunas úteis** (projetos, navegação, contato), dados da empresa (razão social, CNPJ), país e uma linha factual de infraestrutura.

## Acessibilidade

Skip link, `aria-label` traduzido, foco visível (`--accent`, offset 3px), `aria-current` no menu, `alt` por idioma, decorativos com `aria-hidden`, links externos com `rel="noopener"`.

## Proibido

Glassmorphism fora do header · gradientes e brilhos decorativos · blobs/partículas · neon · sombras grandes · `rounded-2xl` em tudo · grids de cards idênticos · zigue-zague repetido · ícone Lucide dentro de círculo · selo piscando · cursor customizado · parallax/tilt · webfont pesada · biblioteca de animação · texto de marketing vago · números, avaliações ou clientes inventados · screenshot de outro idioma como fallback · dado pessoal real em screenshot.

## Como mudar

- Texto: edite os 3 dicionários em `assets/i18n/` (chaves iguais nos 3) e rode `node tests/i18n.test.js`.
- Screenshot nova: arquivo em `assets/img/<projeto>/screens/<idioma>/`, slot em `screenshots-data.js`, textos em `shots.<projeto>.<slot>` nos dicionários.
- Novo projeto na vitrine: um `.work-item` com `data-product`, cor em `--p`, e `.work-plate` com `<img class="plate-shot" data-shot-img="projeto:slot">`.
