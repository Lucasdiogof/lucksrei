# Lucksrei — design system (Royal Tech)

Portfólio de engenharia mobile. Site estático (HTML + CSS + JS, sem build, sem framework), servido por um Cloudflare Worker.
Fonte única de tokens: `assets/css/style.css` (`:root`). Textos: `assets/i18n/{en,pt-BR,es}.js`. Screenshots por idioma: `assets/js/screenshots-data.js`.

## Direção

**Ficha técnica editorial, com assinatura Royal Tech.** Parece um documento de engenharia bem diagramado, não uma landing page. A realeza aparece de forma moderna e controlada: o **dourado é a identidade da marca Lucksrei** (logo, coroa, CTA, rótulos, foco); o **azul é tecnologia** (código, stack, GitHub, uma luz distante no fundo). Proporção alvo: 70% escuro, 20% marfim/cinza, 8% dourado, 2% azul.

Não pode parecer cassino, joalheria, RPG medieval, NFT, cyberpunk exagerado nem template de IA. A logo é sempre o **asset original** (`assets/img/brand/lucksrei-royal-*.webp`, derivados do arquivo original); nunca recriada em CSS/SVG. A coroa (`lucksrei-crown.webp`) é um recorte da própria logo e marca **só** produtos próprios (nº do case e cartão em /apps).

- Estrutura por **linhas finas (1px), tipografia e índices**, não por caixas.
- O **produto real** (screenshots) é o protagonista; o resto da interface é discreto.
- Texto curto e factual. Sem promessa de marketing, sem número inventado.
- Variar a **composição** entre seções (tamanho, orientação, recorte), mantendo os mesmos tokens.

## Cores

Base escura, dourado como acento da interface e azul só para tecnologia. Cores de produto só aparecem como **tom** (nunca como fundo saturado).

| Token | Valor | Uso |
|---|---|---|
| `--bg-void` / `--bg` | `#050607` / `#080a0e` | fundo da página (a atmosfera é `body::after`, fixa) |
| `--bg-soft` / `--bg-elevated` | `#0d1016` / `#121620` | fundo de placas, terminal, elevações |
| `--panel` / `--panel-2` / `--panel-hover` | `#0f131b` / `#121620` / `#171c28` | superfícies (cards só quando clicáveis) |
| `--border` / `--border-strong` / `--border-subtle` | `#1b212c` / `#2a3140` / `rgba(255,255,255,.07)` | linhas finas / ênfase / borda de card |
| `--border-gold` / `--border-gold-hover` | `rgba(214,167,44,.32)` / `rgba(255,215,106,.70)` | detalhe dourado e hover |
| `--text` / `--ivory` / `--text-dim` / `--text-faint` | `#f5f5f2` / `#f8f4ea` / `#aeb4bf` / `#7b8290` | texto primário / marfim / corpo / metadados |
| `--gold` (= `--accent`) | `#d6a72c` | links, rótulos de seção, foco, identidade |
| `--gold-bright` / `--gold-soft` / `--gold-deep` / `--gold-dark` | `#ffd76a` / `#e6c56a` / `#9a6814` / `#5e3b08` | hover, rótulos, barra de rolagem |
| `--btn-gold` / `--metal` | gradiente `#f0d27b → #d6a72c → #a87318` / gradiente metálico | CTA primário; **só** linhas, ícones e badges (nunca áreas grandes) |
| `--tech` / `--tech-bright` / `--tech-cyan` | `#3c82ff` / `#63b3ff` / `#46d9ff` | tecnologia: pontos da stack, hover do GitHub, luz de fundo |
| `--accent-2` | `#58d3a5` | cargo atual, status positivo |
| `--accent-warn` | `#f2b56b` | avaliação, "em desenvolvimento" |
| `--danger` | `#f2837c` | somente erro (404) |
| `--p` (por projeto) | Fan Hub `#6fcf97` · Match Queue `#2ee88a` · La Pelve `#d59ab4` · Aprovaura `#7fbfe0` | tom da placa, número, link e hover do projeto |

Regras: o dourado é o acento da interface e o azul é pontual (nunca competem); o mapa de visitas é uma escala de dourado (`--map-*`); cor de projeto só dentro do card daquele projeto; contraste mínimo AA para texto de corpo.

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

Borda é sempre `1px`. Sombra só nos cards Obsidian (profunda e escura, com reflexo quente de 1px no topo) e no palco do hero.

## Regras de card

1. Card só existe quando o bloco inteiro é **um link ou tem estado** (projeto, app, filtro). Listas informativas usam **linhas finas**.
2. Nunca quatro cards idênticos. Projetos têm três composições: **destaque** (placa à direita, 3 recortes), **faixa espelhada** (placa à esquerda, recortes invertidos) e **par compacto** (placa em cima).
3. Sem ícone grande em círculo. Cartões usam `--card-bg` (gradiente escuro quase imperceptível) e borda `--border-subtle`; hover = borda dourada + `--shadow-lift`. Sem `backdrop-filter` nos cartões (sobre fundo opaco não mostra nada e custa no celular); o blur fica só no header.
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
- Royal Tech acrescenta: brilho do CTA primário (varredura 0,7s), cantos em "L" dourados que crescem no hover (retrato, cartões de produto), poeira dourada quase invisível no hero (opacidade 20–60%, 9s) e deriva lenta do halo (26s). Tudo em `opacity`/`transform`, desligado em reduced motion; no celular some o que for caro (halo, poeira, filtros).
- Sem biblioteca de animação. Sem cursor customizado. Sem parallax, tilt, magnet ou scroll-jacking. O "light follow" dos cards é só um brilho quente (≤5%) que acompanha o ponteiro fino, sem mover nada.

## Responsivo

Mobile é projeto próprio, não desktop encolhido: texto **antes** da foto; placas empilham (texto, depois recortes); 2 recortes; rodapé em 2 colunas (1 em ≤480); tabelas viram listas; alvo de toque ≥ 40px; nunca overflow horizontal.

## Navbar e rodapé

- Logo Royal Tech (`lucksrei-royal-sm.webp`) 36px; ao rolar encolhe 14% (transform) e o header ganha fio dourado. Item ativo: sublinhado metálico. Rodapé: logo `-md`, fio dourado no topo e halo dourado discreto na base.

- Navbar sticky, borda e blur (`10px`) só depois do scroll; altura constante. Um único indicador sublinhado desliza para o link ativo/hover/foco. Seletor EN/PT/ES é um controle segmentado com thumb deslizante (`:has`, com fallback).
- Rodapé: marca, descrição, **3 colunas úteis** (projetos, navegação, contato), dados da empresa (razão social, CNPJ), país e uma linha factual de infraestrutura.

## Acessibilidade

Skip link, `aria-label` traduzido, foco visível (`--accent`, offset 3px), `aria-current` no menu, `alt` por idioma, decorativos com `aria-hidden`, links externos com `rel="noopener"`.

## Proibido

Glassmorphism fora do header · gradientes e brilhos fora dos permitidos acima · bolas borradas · neon · glow grande · dourado em texto pequeno sobre claro · metal em área grande · `rounded-2xl` em tudo · grids de cards idênticos · zigue-zague repetido · ícone Lucide dentro de círculo · selo piscando · cursor customizado · parallax/tilt · webfont pesada · biblioteca de animação · texto de marketing vago · números, avaliações ou clientes inventados · screenshot de outro idioma como fallback · dado pessoal real em screenshot.

## Como mudar

- Texto: edite os 3 dicionários em `assets/i18n/` (chaves iguais nos 3) e rode `node tests/i18n.test.js`.
- Screenshot nova: arquivo em `assets/img/<projeto>/screens/<idioma>/`, slot em `screenshots-data.js`, textos em `shots.<projeto>.<slot>` nos dicionários.
- Novo projeto na vitrine: um `.work-item` com `data-product`, cor em `--p`, e `.work-plate` com `<img class="plate-shot" data-shot-img="projeto:slot">`.

## Digital Kingdom (camada da marca)

"Um reino construído por um programador": realeza abstrata + tecnologia, nunca medieval. Paleta tirada da logo: `--royal-gold` #d5911d (corpo das letras), `--royal-gold-soft` #f9d577 (brilho), `--royal-champagne` #fcf4dd (preenchimento), `--royal-gold-deep` #8d3f00 (contorno); `--metal` e `--royal-text` seguem preto → ouro escuro → ouro → champagne → branco quente só no centro.

- **Elementos proprietários**: a coroa recortada da logo (assinatura no rodapé, nos produtos próprios e na logo viva) e o **Ambiente vivo** (`kingdom.js` + bloco "AMBIENTE VIVO" no fim de `style.css`): duas luzes de fundo que derivam devagar, partículas que acendem e reaparecem em outro lugar a cada ciclo, fios com pulsos de luz, divisores `.kd-divider` com um pulso, e nos 4 apps próprios moldura viva + halo da cor do app + poucos pontos na borda (Goiás = energia, Match Queue = conexão, Aprovaura = subida, La Pelve = suavidade). Sem brilho de 4 pontas ("estrela") em lugar nenhum.
- **Regras de performance (medidas)**: (1) nada animado dentro de contêiner com `overflow: clip/hidden` perto do hero — isso obriga a thread principal a refazer o quadro a cada vsync (o halo `.lk-grid::after` custava ~100 ms/s numa tela de 240 Hz; agora é estático); (2) a cena do hero agenda o próximo quadro com `setTimeout` + rAF (25 fps reais, sem acordar a cada vsync); (3) keyframes sem `var()`; (4) só `opacity`/`transform`; (5) efeitos de card e divisores pausam fora da tela (IntersectionObserver); (6) a home tem o mínimo de partículas (9) e nenhuma em volta da cena.
- **Logo viva**: `lucksrei-royal-sm-base.webp` + `-crown.webp` (recortes do asset original, mesmo tamanho de tela). 1x por sessão: a palavra aparece, a coroa assenta no I, um reflexo passa; depois parada. Hover: reflexo único. Easter egg: digitar "rei"/"king"/"rey" faz a coroa saudar.
- **Ritmo**: hero (cena 8-bit + malha técnica fina e luz azul em volta) → métricas (royal dashboard, números em ouro) + painel "Explore o portfólio completo" → produtos (cards Obsidian, cores dos apps intactas, efeitos vivos só nos 4 próprios) → processo (as setas "energizam" ao entrar) → experiência com linha metálica e pontos que acendem → CTA com glow → rodapé com a coroa sobre o fio de ouro. Sem arcos de sala do trono, raios dourados, coroas gigantes de fundo nem circuitos estáticos (rejeitados).
- Celular: ~45% das partículas, sem fios verticais, glow do hero parado, sem sombras grandes nos cards. Reduced motion: a mesma composição parada (partículas visíveis a meia intensidade, sem pulsos, moldura dos apps fixa), logo estática, sem reflexos, sem energização, sem light follow; o vídeo do Goiás App mostra o pôster.