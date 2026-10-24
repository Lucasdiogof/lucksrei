# Hero v3 — evolução da cena do quarto em pixel art

**Princípio:** a arte que já está no lucksrei.com é a referência principal. A v3 é um **aprimoramento** da mesma cena —
mesmo personagem (moletom azul-marinho, calça escura, tênis brancos, óculos, barba), mesmo escritório noturno, mesma
paleta, mesmo enquadramento e mesmo tamanho no site — com muito mais detalhe, luz, profundidade, fluidez e duração.
Quem conhece a versão atual deve reconhecê-la de imediato.

Status: auditoria concluída; personagem v3 (rig) reancorado na arte atual; estudo de resolução concluído. A cena v2
continua em produção, intacta. O cenário espera as fotos do quarto, que servem para **trazer características reais
para o cenário atual**, não para trocá-lo.

---

## 1. Auditoria da implementação atual (v2)

### Arquivos

| Papel | Arquivo |
|---|---|
| Marcação, pôster, falas (HTML traduzível) | `index.html` (linhas 108–113, script na 519) |
| Runtime da cena | `assets/js/hero-scene.js` (304 linhas, IIFE, sem dependências) |
| Estilos, recorte mobile, tema claro | `assets/css/style.css` (`.hero-grid`, `.hero-scene`, `.hs-*`, ~286–350, 1164, 1288–1381, 1708–1749) |
| Textos PT/EN/ES | `assets/i18n/{pt-BR,en,es}.js` → `home.hero.scene_alt`, `hello_1`, `hello_2`, `hello_2s`, `hello_3` |
| Assets gerados | `assets/img/hero/scene.png`, `desk.png`, `monitors.png`, `sprites.png`, `poster-empty.png`, `poster-final.png` |
| Gerador do cenário + injeção do bloco `FRAMES` no JS | `tools/make-hero-scene.py` |
| Personagem de frente/sentado (grades de texto + formas) | `tools/hero_char.py`, `tools/hero_frames.py` |
| Personagem de perfil (outra grade, desenhada à parte) | `tools/hero_side.py` |
| Caminhada (arte de referência reduzida e quantizada) | `tools/hero_ref.py` + `tools/ref/lucas-walk-ref.webp` |

### Como funciona
- **Tecnologia:** Canvas 2D + `requestAnimationFrame`, mundo de **240×150 px** lógicos em escala inteira (2× no desktop
  = 480×300; no celular, recorte fixo de 160×136 a 2×). Sem biblioteca, sem WebGL, sem vídeo.
- **Camadas fixas:** `scene.png` → corpo → `desk.png` → caneca (código) → braços (metade de baixo da folha) →
  `monitors.png` → filete aceso das telas. Falas em HTML por cima.
- **Personagem:** folha 10×7 células de 72×72 (64 quadros úteis), âncora nos pés. `front_idle`, `stand_r/l`,
  `walk_r/l` (8), `turn_r/l` (**1 quadro**), `sit_down` (8), `seated_idle`, `typing` (4), `typing_down`,
  `scratch_head`, `scratch_neck`, `celebrate`, `coffee_*`, `stand_up`.
- **Timeline:** determinística (`STEPS`). **Intro 13,9 s** uma vez por carregamento (entra, vira para o visitante, fala,
  vai à mesa, senta); depois **loop sentado de 38,2 s** (digita → comemora → digita → café → digita → coça a cabeça).
  Relógio só anda com a cena visível e a aba ativa; ~25 fps.
- **Luz/sombra/profundidade:** pintadas no cenário; no runtime só estrelas, vapor da caneca e um filete de 1 px nas
  bordas dos monitores. Câmera fixa, sem parallax.
- **Acessibilidade/carga:** `prefers-reduced-motion` e `<noscript>` → pôster final; carga só perto da viewport; pausa
  fora da tela. ~51 KB de PNG; sem erros de console (medido com Playwright em 1440×900 e 390×844).

### Diagnóstico

**Personagem**
1. **Três fontes, três rostos.** Frente (`hero_char.py`), perfil (`hero_side.py`) e caminhada (`hero_ref.py`) são
   desenhos independentes: cabeça, óculos e barba mudam entre eles — é a deformação percebida ao virar.
2. **Giro em 1 quadro** (`turn_r/l`): salto entre perfil e frente.
3. **Perfil magro demais** em relação à frente (17 px contra 31 px de largura): a silhueta “troca de corpo” ao virar.
4. Ciclos curtos (digitar = 4 quadros), poses reaproveitadas.

**Cenário**
5. Objetos simples (mesa como bloco, monitores de 2 tons, estante e cadeira sem volume), perspectiva ajustada à mão
   objeto a objeto.
6. Iluminação toda pintada: os monitores não iluminam rosto, mãos, mesa ou parede.

**Cinemática**
7. Câmera fixa, nenhuma variação de luz, 14 s de história e um loop de gestos curtos.

**Preservar:** a identidade visual inteira (paleta, proporções, roupa, rosto, composição, enquadramento, tamanho no
site); o runtime em Canvas 2D sem dependências, relógio pausável, carga preguiçosa, falas em HTML, pôster para
movimento reduzido/sem JS, âncora nos pés com passo fixo; os geradores de assets por código.

**Evoluir:** personagem (consistência, giros, novos movimentos), qualidade dos objetos, iluminação dinâmica,
profundidade, duração e variedade da timeline.

---

## 2. Tecnologia

| Opção | Veredito |
|---|---|
| **Canvas 2D (atual), runtime evoluído** | **Recomendado.** Controle total do pixel, 0 KB de biblioteca; `lighter`/`multiply`/`source-atop` bastam para luz em camadas |
| PixiJS | Não compensa: centenas de KB na home para uma cena de dezenas de sprites; filtros tendem a borrar pixel art |
| WebGL próprio (normal maps) | Não agora; as máscaras de luz do rig dão a maior parte do efeito |
| Vídeo pré-renderizado | Só como fallback eventual (pesado, sem falas sincronizadas) |

**2.5D:** planos do cenário com profundidade `z` e parallax de poucos pixels, sem 3D no navegador. O 3D fica só na
produção (rig do personagem).

---

## 3. Resolução e tamanho de exibição

**Decisão: manter 480×300 no desktop e o mundo de 240×150 a 2×.** O estudo (`tools/hero3/res_study.py` →
`tools/hero3/out/res-study.png`) comparou, no mesmo tamanho de tela:

| Variante | Resultado |
|---|---|
| A — 240×150 a 2× (atual) com o personagem v3 | Coeso; mesma identidade |
| B — só o personagem refeito a 2× sobre o cenário atual | Dois tamanhos de pixel na mesma cena: o personagem parece colado de outro jogo; os carimbos do rosto a 2× ficam “olhos grandes” |
| C — 320×200 a 1,5× | Escala não inteira: colunas de 1 e 2 px alternadas (veja as bordas do tapete); tremula em movimento |
| D — tudo redesenhado a 480×300 | Pixel com metade do tamanho: deixa de ler como a arte atual |

Peso não é o limitante (um quadro a 1× ≈ 1,1 KB, a 2× ≈ 1,9 KB). O ganho de qualidade vem de **refinar dentro da mesma
grade**: mais quadros, giros intermediários, objetos com mais volume/material, luz dinâmica e efeitos.

Margem para câmera sem mudar o tamanho do pixel: um mundo um pouco maior que a janela (ex.: 272×160 visto por
240×150) permite panorâmicas e parallax de poucos pixels sem alterar a composição. Zoom muda o tamanho do pixel
(2× → 3×); fica como experimento pontual, a ser avaliado visualmente, não como base.

No celular continua o recorte adaptado (enquadramento próprio por cena, não um corte fixo).

---

## 4. Personagem v3 — Fase C (concluída em protótipo, aguardando validação visual)

Tudo sai de um único modelo do Lucas **no estilo dos sprites atuais** (mesma paleta de `tools/hero_char.py`, ≈65 px,
cabeça 16×16, moletom azul-marinho com cordões/bolso/punhos, calça escura, tênis brancos, óculos, barba).

### Arquivos
| Arquivo | Papel |
|---|---|
| `tools/hero3/rig.py` | Modelo (SDFs sobre esqueleto) → pixel art: materiais, luz em faixas, contorno, separação braço/tronco, carimbos do rosto no desenho da v2, camada “sobre a mesa”, deslocamento subpixel e projeção oblíqua das pernas |
| `tools/hero3/poses.py` | Biblioteca de poses: parado (respira, pisca, olha), andar, começar/parar, giros, puxar a cadeira, sentar, levantar, digitar, mouse, olhar os monitores, café, coçar cabeça e nuca, comemorar, recostar |
| `tools/hero3/anims.py` | Roteiro da intro e do loop, solver de raiz (pé apoiado parado no mundo), atlas recortado, trilhas → `assets/img/hero/v3/` |
| `tools/hero3/scene3.py` | Camadas do quarto atual (idênticas à v2, 0 px de diferença), com a cadeira separada |
| `tools/hero3/preview.py`, `inspect_ticks.py` | Prévias MP4/GIF (real e ampliado) e folhas quadro a quadro |
| `tools/hero3/capture.cjs`, `sidebyside.py` | Captura no navegador (relógio controlado) e v2 × v3 lado a lado |
| `assets/js/hero-v3.js` | Runtime experimental (só com `?hero=v3`); `hero-scene.js` ganhou um gancho de 2 linhas, inerte sem o parâmetro |

### O que foi feito
- **Acabamento:** filete escuro entre braço e tronco (como na v2); mangas mais cheias (ombro e cotovelo) afinando até
  o punho canelado; mãos maiores com polegar e punho fechado; cabelo quase todo no tom base com um fio de brilho (v2);
  lente de perfil dentro do rosto com o nariz passando 1 px; boca some quando a caneca está na boca.
- **Rotação:** 16 ângulos a cada 22,5° do mesmo modelo; nos giros a cabeça vai à frente do corpo e um pé sobe 1 px.
- **Caminhada:** 8 quadros (contato, apoio, impulso, recuperação), apoio = 5/8 do ciclo, 2 px por quadro → o pé de
  apoio cai sempre no mesmo pixel; para os dois lados (cada lado renderizado, não espelhado, então a luz continua vindo
  da direita); em perspectiva (3/4 de costas, indo para o fundo) com projeção oblíqua só das pernas.
- **Começar e parar:** primeiro passo a partir de parado; parada com o pé de trás vindo junto e o quadril assentando.
- **Cadeira:** a cadeira virou camada; ele estende as mãos até o encosto, puxa 5 px inclinando o tronco para trás,
  solta, anda até a frente dela, vira e senta. Levantar inclina à frente e empurra a mesa antes de subir.
- **Sentado (loop de 38,8 s):** digitar (normal, rápido, olhando o teclado), olhar de um monitor para o outro (cabeça +
  pupilas), mouse, comemorar discreto, café completo (olha, pega pela alça, leva à boca, bebe com a cabeça para trás e
  olhos fechados, desce, devolve no mesmo pixel da caneca da mesa), coçar a cabeça, coçar a nuca, recostar e respirar,
  piscadas.
- **Intro (18,5 s):** entra andando, para, vira para o visitante (1ª fala), vira para a mesa, anda em diagonal para o
  fundo, endireita andando, puxa a cadeira, dois passos, vira e senta (2ª fala). Mesmas falas e textos da v2.
- **Cena:** mesma ordem de camadas da v2 (corpo atrás da mesa; antebraços, mãos e caneca por cima; monitores na
  frente). Pôster estático v3 para movimento reduzido.
- **Peso:** 216 quadros únicos, atlas de 85 KB + trilhas 19 KB + camadas do quarto ~19 KB (v2: 51 KB no total).

### Como ver
```
python3 -m http.server 8765        # na raiz do site
```
e abrir `http://localhost:8765/?hero=v3` (sem o parâmetro, a v2 de sempre). Prévias em `tools/hero3/out/preview/`.
Regerar: `python3 tools/hero3/anims.py` (≈2 min na primeira vez; depois usa o cache), `python3 tools/hero3/preview.py`.

### Correção dos braços sentado (2ª rodada)
Defeito: o braço do lado direito da tela (esquerdo do Lucas) formava uma “ponta” triangular no moletom ao digitar.
Causa (medida, não suposta): os alvos das mãos eram pontos de TELA do teclado, mas a cena tem profundidade oblíqua
(o tampo recua a 45°): o teclado, à frente dele, aparece mais baixo do que a altura real das mãos. Para chegar lá o IK
esticava os dois braços (cotovelo a 179°), a mão direita ficava 22,8 px do ombro com alcance de 18,4 (errava 4,4 px) e o
cotovelo entrava no tronco — a manga atravessava o peito. Correção na origem:
- **perspectiva dos braços** (`rig.apply_arm_shear`, `poses.arm_shear_local`): o que vai para a frente desce/vai à
  direita na tela, como a mesa; alvos de mão são VISUAIS (ponto na tela + profundidade real) e viram 3D real;
- **IK com limites** (`poses.arm_to`): flexão do cotovelo entre 25° e 165°, cotovelo sempre fora do tronco (testa
  polos para fora/baixo), relatório de QA no build (`anims.arm_report`: 0 problemas em 452 poses);
- **pose de digitar** escolhida por varredura: tronco 9° à frente, mãos 6 px à frente dos ombros, cotovelos ~111°
  dos dois lados; a mão direita digita atrás do monitor (como no teclado real) e a trajetória do braço continua visível;
- **caneca sem braço elástico:** o corpo inclina para a caneca (lateral, à frente, escápula avança até 2 px), a mão
  vai em arco até a alça, o tronco endireita para beber; a cabeça fica nivelada quando o tronco inclina;
- sentar e levantar usam a mesma perspectiva, entrando aos poucos (sem salto quando as mãos chegam ao teclado).

Prévias: `out/preview/bracos-antes-depois-*.mp4` (antes | depois | sem monitores | sem mesa).

### Perfil e auditoria artística v2 × v3 (3ª rodada)
O perfil da v2 (desenhado à mão) estava melhor que o da v3. Diferenças medidas e corrigidas no rig (contínuas no
ângulo, sem trocar o formato da cabeça entre quadros):
- **pouco rosto de perfil** (cabelo cobria ~70% da lateral, “capacete”): a cabeça vira até 18° para a câmera nas vistas
  laterais (`rig.cheat_head`, proporcional a sen²: 0 de frente/costas) e o cabelo fica acima da orelha, com costeleta
  fina, bochecha e orelha à mostra; atrás da orelha o cabelo desce até a nuca;
- **óculos**: lente de perto com 4 px de perfil (olho branco + pupila, como “gweg” da v2) e haste até a orelha;
- **sorriso de perfil**: “m” + dois dentes na frente; **nariz** menos projetado; **barba** abaixo da maçã do rosto;
- **pescoço**: o capuz virou só uma dobra na nuca (v2), o pescoço aparece entre a barba e a gola;
- **sombreamento**: como na v2, quase tudo no tom base (claro só na borda iluminada); pele, barba e orelha com
  faixas próprias; membros do lado de longe um tom abaixo (perna/braço de trás da v2);
- **contornos**: braço na frente do tronco com contorno quase preto; de frente, manga contornada contra o tronco e linha
  escura entre as pernas (v2); parado de perfil, pés levemente desencontrados (as duas pernas aparecem, como na v2);
- **sentado**: rosto mais de frente (como a v2), olhar o teclado com os olhos (a cabeça baixa pouco), comemorar com o
  punho ao lado da cabeça (antes ficava na frente da barba).

Ferramentas: `tools/hero3/audit_v2.py` (cada pose da v2 ao lado da v3, em pé e sentado no quarto) e a página de QA
`tools/hero3/qa/perfil.html` (v2 | v3 anterior | v3 corrigida no quarto atual, 480×300; modos parado, andar, giro e
rotação completa), capturada por `qa_capture.cjs`.

### Ainda a melhorar
- o mouse e a mão direita ficam atrás do monitor da esquerda (a cena não tem mouse visível): o gesto se lê pelo braço e pelo olhar;
- de perfil exato (90°) a boca não aparece (na v2 aparecem 2 px de dente);
- mãos ainda são “luvas” de 3–4 px (sem dedos legíveis), como na v2;
- não há camada de retoque manual por quadro: todos os ajustes até aqui foram feitos no modelo/poses (o que corrige
  todos os quadros de uma vez); se a revisão pedir acabamento pontual, entra um PNG de retoque por quadro;
- velocidade da caminhada 24 px/s (v2: 30 px/s);
- luz do monitor no rosto/óculos ainda não está ligada (fica para a Fase E, junto com a cinemática).

## 4b. Nova direção da Fase C: personagem HÍBRIDO (arte da v2 + intermediários)

Depois de três rodadas, o rig puro continuou inferior à v2 de perfil. Nova regra: **os sprites da v2 são a base do
personagem**; o rig só ajuda a posicionar intermediários e movimentos.

Como a v2 é feita: não é imagem fixa, é código com primitivas 2D (tools/hero_char.py `Cell`: cápsulas com os tons da
manga/calça, mãos, tênis, contorno e realce do `finish()`) e três cabeças em grade desenhadas à mão numa série coerente:
`FRONT_HEAD` (0°), `SIDE_HEAD` (3/4) e `SIDE_PROFILE` (perfil “trapaceado”, com o rosto em 3/4).

Pipeline híbrido (`tools/hero3/hybrid.py`, `tools/hero3/v2art.py`):
- **quadros-chave = v2 literal** (mesmo código de sprites.png): frente, perfil parado e os 8 quadros da caminhada —
  verificado: 0 px de diferença;
- **cabeças intermediárias desenhadas à mão** no estilo da v2: 22,5° e 67,5° (série de 5: 0 / 22,5 / 45 / 67,5 / 90),
  com a cabeça um passo à frente do corpo no giro;
- **corpos intermediários com as primitivas da v2**: tronco com largura de elipse entre o moletom de frente e o de
  perfil da v2, bolso/cordões/gola/barra deslizando com o giro, braço de perto varrendo até o meio do tronco (onde a
  v2 o desenha de perfil), braço de longe saindo de vista pelo giro real, pernas e tênis da v2.

**Prova de conceito** (parado de frente → gira → perfil → anda de perfil → volta): página
`tools/hero3/qa/perfil.html?mode=poc` (v2 | v3 rig | híbrido no quarto, 480×300); prévias
`out/preview/poc-hibrido-*.mp4` e `out/poc-giro-comparacao.png`. O `?hero=v3` ainda roda a versão do rig: só passa
para o híbrido depois da aprovação da prova.

Expansão (depois da aprovação): intermediários de começar/parar de andar (a v2 corta direto), andar para a esquerda e
em 3/4 de costas (cabeça e corpo de trás a desenhar), puxar a cadeira, sentar/levantar e as ações sentado a partir dos
quadros sentados da v2 (`hero_frames.seated`) com a geometria corrigida dos braços (cotovelo fora do tronco, mão no
teclado pela perspectiva).

### Expansão híbrida (concluída, aguardando aprovação)
O `?hero=v3` agora roda o personagem híbrido (`tools/hero3/hybrid_frames.py` + `hybrid_anims.py`, mesmo formato de
atlas/trilha que `assets/js/hero-v3.js` já lia). A versão só-rig ficou guardada em `tools/hero3/out/v3rig/`.
- **v2 literal:** de frente (parado, respiração, piscada), perfil parado, caminhada de perfil (8 quadros), sentar
  (8), levantar (7), poses sentado da v2 (digitar, coçar a cabeça/nuca, comemorar, café) — braços da v2, sem a
  “ponta” no ombro que o rig criava;
- **novo no traço da v2:** cabeças 22,5°/67,5°/135°/180° e variações de olhar/piscar; corpo em qualquer ângulo de 0° a
  180° (moletom de costas com o capuz caído); giros nos dois sentidos (esquerda = espelho, como a v2); começar e parar
  de andar; andar em 3/4 de costas (pé de apoio parado na tela); puxar a cadeira (braços de perfil da v2 até o
  encosto); intermediários entre as poses sentado da v2; olhar os monitores (cabeça 0° → 22,5° → 3/4); mouse;
- **intro (16,9 s):** entra andando, para, vira para o visitante, fala, vira para o fundo passando pelo perfil, anda
  de costas até o fundo, endireita, anda até a cadeira, puxa, passo lateral, vira e senta; **loop (35,2 s)** sentado;
- **peso:** 107 quadros, atlas de 30 KB (a v2 tinha 31 KB); gera em menos de 1 s.

Validação: gravações reais do navegador (`capture_video.cjs`) e clipes v2 × híbrido por tema
(`compare_clips.py` → `out/preview/v2-x-hibrido-*.mp4`), prévias extras (`hybrid_preview.py`: rotação completa,
andar nos dois lados, sentar/digitar/levantar).

Pontos fracos conhecidos: o mouse acontece atrás do monitor (lê pouco); o espelho do lado esquerdo inverte a luz (como
na v2); andar de costas é novo (a v2 não tinha) e merece um olhar seu em movimento.

## 5. Cenário — Fase D (aprovada, aguardando commit)

Fase C (personagem híbrido) aprovada para desktop; validação mobile feita (gravação corrigida: o site rola suave e o
recorte era medido no meio da rolagem; agora rola instantâneo, mede depois de estabilizar, confere que a cena inteira
está na tela e corta o vídeo a partir daí). Clipes `out/preview/v2-x-hibrido-mob-*.mp4`.

**Regra:** o quarto da v2 é a referência. Mesma composição, perspectiva (parede/mesa 1:6, profundidade a 45°), tamanho
(240×150) e paleta (`C` de make-hero-scene.py + tons derivados dela). Só acabamento; detalhes reais virão das fotos.

### Arquitetura em camadas (`tools/hero3/scene_v3.py` → `assets/img/hero/v3/scene/` + `scene.json`)
| Camada | Conteúdo | Por que separada |
|---|---|---|
| sky | céu, lua, estrelas, cidade (2 planos) | animar luzes da cidade/estrelas, parallax futuro |
| room | parede, rodapé, piso, tapete, moldura da janela (vidro vazado), quadro, estante, luz da tela na parede | fundo estático |
| chair | cadeira | é puxada |
| [corpo] | personagem | — |
| desk | mesa + teclado + luz da tela no tampo | cobre o corpo |
| mug | caneca | some quando está na mão |
| [braços] | braços/caneca sobre a mesa | — |
| monitors | monitores (de costas) + cabo | na frente das mãos |
| moon | luar no chão (aditivo, sutil) | intensidade animável |

Runtime: `?hero=v3&scene=v3` usa essas camadas; `?hero=v3` continua com o quarto da v2 (comparação lado a lado).

### Primeira passada (experimento reversível)
- **luz em faixas sólidas** (técnica de pixel art: cada anel da elipse é um tom; só a fronteira entre faixas tem 1 px
  pontilhado) — a 1ª tentativa com camada aditiva pontilhada por cima de tudo ficou suja (pontos azuis sobre o
  personagem e as bordas) e foi descartada;
- **janela**: o céu e os prédios da v2 + silhueta distante da cidade e topo dos prédios pegando a luz do céu; batente
  com sombra interna (vidro recuado), travessa com chanfro, sombra do parapeito;
- **piso**: tom por tábua, chanfro claro discreto, veio, oclusão junto ao rodapé; **parede**: canto do teto mais escuro,
  rodapé com chanfro e sombra;
- **tapete**: borda dupla (dourada + interna escura) e trama; **sombra de contato** da mesa no chão;
- **mesa**: luz da tela no tampo (faixas), veio contínuo, sombra sob o tampo, painel com veio vertical, base mais
  escura, pé com aresta iluminada; **teclado**: 3 fileiras de teclas de 2 px e barra de espaço;
- **monitores**: cabo atrás do pé, meia-luz na base da traseira; **quadro**: chanfro, sombra na parede, brilho do vidro;
  **cadeira**: estrela de 5 pés com rodízios, volume na almofada, borda do assento iluminada.

Avaliação honesta: é um ganho de acabamento real, mas MODESTO — a cena ainda tem a mesma riqueza de objetos da v2. O
salto grande depende das fotos (modelo dos monitores e do teclado, mesa real, cadeira real, objetos da estante, o que
se vê pela janela, cor da parede, iluminação real à noite).

### Segunda passada: detalhes reais das fotos (6 fotos do quarto)
Trazidos para os elementos que já existiam, sem mudar composição, perspectiva nem tamanho:
- **janela**: cortinas de renda creme (translúcidas, à noite) abertas nas laterais até o chão, varão escuro com
  ponteiras, e o split de ar-condicionado acima da janela (foto 1);
- **piso**: tábuas → porcelanato em placas grandes, rejunte nas duas direções da cena, brilho esmaltado da luz das
  telas no chão (fotos 1–2);
- **mesa**: madeira tabaco escura (foto 2) com o mesmo desenho; mousepad preto grande sob os teclados, mousepad
  cinza com padrão à esquerda (sob a caneca), headset preto/vermelho na ponta esquerda, gabinete preto na ponta direita;
- **monitores**: traseiras pretas (um tom acima do preto para não virarem buracos na parede noturna), webcam em cima
  do da direita;
- **estante** (fotos 3–6): luvas de boxe + bola no topo; almofada do Goiás, pêndulo de Newton, cubo de polaroides;
  Funko com coroa, Bulbasaur, quadrinho, troféu dourado com asa; placa do G, Pikachu, Deadpool, Squirtle, troféus
  KGeN Cup e Rissel League; faixa azul do cartão na parede atrás.

Mantidos da v2 de propósito: parede azul-noite (a real é creme — mudaria a identidade noturna), quadro da coroa,
tapete azul com borda dourada, cadeira (não aparece nas fotos), janela com a cidade.

Avaliação crítica (tamanho real): o quarto ficou mais rico e reconhecível; cortinas ainda leem como faixas
pontilhadas (precisam de pregas mais volumosas e menos trama), e os objetos da estante (3–5 px) viram pontos de cor —
talvez menos objetos, maiores. Comparações: `out/preview/cenario-v2-x-v3*.mp4`, `out/cenario-v2-x-v3*.png`.

Decisões em aberto na época (fechadas no fim desta seção): parede creme × azul-noite; cortina preta atrás da mesa (foto 2); cabideiro com o
cachecol do Napoli (foto 1); frente da mesa aberta (real) × fechada (v2, esconde as pernas sentado); monitor da
direita maior (real) — exige mover os filetes de luz do runtime; mouse visível perto da mão.

### Terceira passada: foco na estante e no setup (decisão do usuário: o resto pode ser genérico)
- removidos cortinas e split (ambientação que ficou fraca); janela volta a ser a da v2 com moldura mais profunda;
  porcelanato, parede e tapete ficam genéricos como estão;
- **estante**: nichos de 12 px (antes 10), mesma estrutura/lugar; menos objetos, maiores, com contorno e em pé (linha
  de base única, não acompanham a inclinação da tábua): luvas com friso branco + bola no topo; almofada do Goiás,
  pêndulo de Newton, cubo de polaroides; Funko com coroa, quadrinho, troféu dourado com asa; placa do G, Pikachu,
  troféus KGeN Cup e Rissel League; faixa azul do cartão menor, quase escondida;
- **setup**: monitor da direita maior (como na foto) com webcam; Mac mini prateado ao lado do pé do monitor da
  esquerda; mousepad preto longo + cinza; headset; gabinete mais baixo (não encosta na estante); os filetes acesos das
  telas vêm do manifesto do cenário (`scene.json` → `monitors`), então acompanham o monitor maior no runtime.

### Quarta passada: luz, efeitos e gesto do mouse
- **estados de luz no roteiro**: cada registro da trilha ganhou `fx` (0 neutro, 1 digitando, 2 build/verde, 3 tela
  em espera, 4 pausa/café). O runtime deriva a intensidade de forma determinística (`lightAt`, compatível com
  `seek()`): rampa de 1,4 s ao acordar a tela, 0,45 s nas outras trocas, leve tremulação enquanto digita e brilho
  verde na comemoração;
- **brilho das telas**: camadas `glow`/`glowdesk` em faixas sólidas (dither só nas bordas), somadas por "lighter" e
  atrás do personagem; filetes dos monitores acompanham cor e intensidade;
- **luz no personagem**: tinta azul recortada pela silhueta do quadro (`source-in`), 6–16 % conforme a intensidade;
- **efeitos discretos**: janelas da cidade que apagam/acendem, LED do gabinete pulsando, 7 grãos de poeira no feixe
  do luar. Custo medido ≈ 0,04 ms por quadro, sem erros no console;
- **gesto do mouse**: o mouse agora fica visível sob o monitor da esquerda (com LED azul); a mão direita vai até ele
  em 3 quadros, faz um pequeno trajeto de 8 quadros com o olhar acompanhando e volta ao teclado;
- vídeos: `tools/hero3/out/preview/cenario-v2-x-v3{,-mob}{,-2x}.mp4` (gravação real no navegador, 60 s).

### Quinta passada: estante cheia, luz mais suave, sentar sem puxar a cadeira (pedidos do usuário)
- **estante**: os vãos ganharam objetos das fotos — Deadpool (Funko) e uma pilha de livros no topo, Bulbasaur no
  nicho 2, Squirtle ao lado do Pikachu no nicho 3;
- **luz**: brilho das telas na parede e na mesa pela metade (`GLOW = 0.5` no runtime), luz no personagem de
  6–16 % para 3–8 %, filetes dos monitores mais baixos;
- **intro**: removido o gesto de puxar a cadeira (ficou duro); ele para, dá o passo lateral, vira e senta com os
  quadros da v2. Intro passa de 16,9 s para 15,8 s; atlas com 101 quadros (28,9 KB).

### Sexta passada: refinamento (estante mais vivida, luz discreta, intro sem cadeira)
- **estante**: nicho 2 redistribuído (Funko, Bulbasaur, quadrinho, troféu com asa e um **porta-retrato** prateado
  com foto, na ponta direita); **taça dourada** pequena no fim da tábua do topo. Cada nicho agora tem 4–5 objetos de
  silhueta forte e contorno, sem vãos grandes, e continua legível em 480×300;
- **luz** (tudo mais sutil, mesmas reações):
  - área menor: brilho da parede de 52×31 para 40×24 px de raio, mesa de 36×9 para 28×8;
  - menos contraste entre faixas: parede [24, 40, 56] → [18, 26, 32], mesa [30, 55] → [22, 34]; força geral 0,6;
  - níveis mais próximos entre si: espera 0,25, calmo 0,55, digitando 0,7, build 0,78 (antes 0,16 → 1,0);
  - telas acordando: rampa de 1,4 s para 2,4 s; demais trocas 0,6 s;
  - tremular da digitação: ±0,06 → ±0,025 e mais lento;
  - verde do build: 45 % do anterior (só um toque nos filetes e no personagem);
  - luz no personagem: 2–5,5 % (antes 6–16 %); filetes dos monitores 25–70 %;
- **intro**: o gesto de puxar a cadeira saiu. Ele chega de perfil, para, dá o passo lateral, vira e senta com os
  quadros da v2 (intro 16,9 s → 15,8 s; atlas 101 quadros, 28,9 KB);
- entregas: vídeos `out/preview/cenario-v2-x-v3{,-mob}{,-2x}.mp4`; imagens `out/preview/r5-cena-completa.png`,
  `r5-estante.png`, `r5-mesa-luz.png`, `r5-luz-antes-depois.png`, `r5-intro-sentar.png`.

### Sétima passada: parede (pedidos do usuário)
- removida a faixa azul do cartão atrás da estante;
- quadro da coroa 8 px mais alto (`QT` 48 → 40), com sombra e chanfro acompanhando;
- lua cheia no lugar da crescente (8×8, crateras, borda inferior direita um tom abaixo, sem halo pontilhado); as
  duas estrelas coladas nela saíram e as que piscam no runtime foram para o céu livre (só no cenário v3);
- imagens: `out/preview/r6-cena-completa.png`, `r6-parede.png`; vídeos `cenario-v2-x-v3{,-mob}{,-2x}.mp4`.

### Oitava passada: estante maior, quadro mais alto (pedidos do usuário)
- estante: nichos de 14 px (antes 12) e tábuas 12 % mais largas para a direita (`SX = 1.12`, as posições dos objetos
  escalam junto, os objetos mantêm o tamanho e ganham respiro); cresce para cima, com a base onde estava para não
  encostar no gabinete;
- quadro da coroa mais 6 px acima (`QT` 40 → 34; 14 px acima da v2);
- imagens: `out/preview/r7-cena-completa.png`, `r7-parede.png`; vídeos `cenario-v2-x-v3{,-mob}{,-2x}.mp4`.

### Decisões do usuário (fechadas) e aprovação
Cenário aprovado pelo usuário depois da oitava passada. Decisões em aberto respondidas:
- parede: **azul-noite** da v2 (não o creme real);
- cortina preta atrás da mesa: **não**;
- cabideiro com o cachecol do Napoli: **não**;
- frente da mesa: **fechada** como na v2 (esconde as pernas sentado; os quadros aprovados continuam valendo);
- já resolvidas antes: monitor da direita maior com webcam, mouse visível sob o monitor da esquerda.

### Próximos passos
1. Fase E (cinemática) sobre o cenário aprovado.
2. Opcionais, só se o usuário pedir: cadeira real; telas com conteúdo visto de frente.

## 5b. Cinemática — Fase E (protótipo, aguardando validação)

Roteiro da seção 7 aplicado sobre o personagem e o cenário aprovados, sem mudar composição, tamanho nem identidade.
Tudo em `?hero=v3` (o cenário novo com `&scene=v3`). Trilha: intro 21,1 s + loop 65,2 s (duas tomadas).

| Momento | O que acontece | Onde |
|---|---|---|
| 0–3,5 s | **Abertura**: quarto vazio à noite, telas em espera, vapor na caneca, cidade e poeira no luar | `OPENING` em `hybrid_anims.py` |
| 3,5–19 s | Entra, para, vira para o visitante e fala (falas da v2), vai à mesa e senta direto (sem puxar a cadeira) | intro |
| 19–21 s | **Senta com as telas apagadas, toca o mouse e as telas acordam** (rampa de 2,4 s) | `wake_mouse` |
| loop A | Digita, olha os monitores, mouse; **build rodando** (pulso lento, fx 5) → **passou** (verde leve) + comemora; **café olhando a janela** (cabeça vira para a esquerda) e **uma janela da cidade acende** e apaga devagar | `build_ok`, `coffee_window` |
| loop B | Mesma rotina com variações; **build falha** (âmbar leve nos filetes e no personagem, fx 6) → coça a cabeça; café comum | `build_fail` |
| após a intro | **Botão discreto “rever a cena”** (canto inferior esquerdo; volta ao começo, sem áudio) | `hero-v3.js` |

Detalhes:
- novos estados de luz: 5 build rodando (pulso ±0,04), 6 build falhou (âmbar a 40 % no personagem, mais saturado só
  no filete de 1 px para ser percebido), 7 café na janela (nível calmo + evento da cidade em `scene.json` →
  `fx.cityEvent`, fora do montante da janela);
- cabeça olhando a janela: a cabeça de 22,5° da série espelhada (`HEAD_22L`), olhos para cima à esquerda;
- botão “rever”: fica fora do `.hs-stage` (que é `role="img"`), aparece 1 s depois da intro, some com transição;
  rótulo pelas chaves `home.hero.replay` (EN “Replay the scene”, PT “Rever a cena”, ES “Ver la escena de nuevo”),
  traduzido na troca de idioma; teclado (Tab/Enter) com foco visível; não existe na produção nem com movimento
  reduzido (pôster estático);
- **câmera fixa de propósito**: a cena ocupa exatamente 240×150 sem margem de mundo; pan ou zoom quebrariam o pixel
  exato e a composição da v2;
- atlas 108 quadros (≈ 30 KB); custo de desenho igual (≈ 0,04 ms/quadro); sem erros no console; testes passando;
- material: `out/preview/fase-e-v2-x-v3{,-mob}{,-2x}.mp4` (90 s, produção × v3, gravação real),
  `out/preview/e-momentos.png` (10 momentos-chave).

## 5c. Integração e QA — Fase F (pronta localmente, sem commit)

### O que muda na produção
- `index.html` carrega `assets/js/hero-v3.js` (antes `hero-scene.js`); a cena v3 com o quarto novo é o padrão.
- `hero-scene.js` volta exatamente ao que era (sem o gancho experimental) e vira a **reserva**: `?hero=v2` faz o
  `hero-v3.js` carregar a cena anterior, com os pôsteres `poster-*-v2.png`. `?scene=v2` (quarto antigo com o
  personagem novo) fica só para comparação.
- Pôsteres `assets/img/hero/poster-empty.png` (abertura, quarto vazio) e `poster-final.png` (sentado programando)
  agora saem do próprio canvas da v3 (`tools/hero3/qa/posters.cjs` + `posters_save.py`, paleta exata, ≈ 6 KB cada).
  Mesmos caminhos de antes de propósito: o `<style>` do `<noscript>` tem hash na CSP e não muda.
- Botão “rever”: estilo em `style.css` (`.hs-replay`) — a CSP (`style-src` com hashes) bloquearia o `<style>` que o
  runtime injetava; cores fixas porque a cena é escura também no tema claro.
- Balão das falas na v3 (`.hero-scene.is-v3`): 10 px (como no celular) e 2 px mais alto, para não cobrir o quadro
  da coroa (que subiu) nem a estante — em PT/ES a 1ª fala tem 3 linhas.
- i18n: chave nova `home.hero.replay` em EN/PT/ES.

### QA (servidor local com os cabeçalhos reais do `_headers`: `tools/hero3/qa/csp-server.cjs`)
`tools/hero3/qa/qa_final.cjs` — resultado:
- **viewports** 1440×900, 1280×800, 768×1024, 390×844: sem rolagem horizontal; palco 482×302 (322×274 no
  celular, recorte fixo da v2); botão dentro do palco; sem erros de console nem de CSP;
- **idiomas** PT/EN/ES, desktop e celular: as duas falas dentro do palco; rótulo do botão traduzido na troca;
- **movimento reduzido**: só o pôster final, nenhum asset da cena baixa, sem botão;
- **sem JavaScript**: pôster final pelo `<noscript>` (CSP aceita o hash);
- **pausa**: fora da tela o relógio para (1,49 → 1,49 s) e retoma ao voltar;
- **rever** pelo teclado: volta ao começo;
- **desempenho**: ≈ 0,03 ms de desenho por quadro; heap ≈ 2,7 MB; assets da cena ≈ 82 KB (orçamento: 250 KB);
- **reserva** `?hero=v2`: cena anterior completa, sem erros; `tests/*.test.js` passando;
- tema claro: cena e balão iguais; botão com cores fixas.
- Os únicos 404 no servidor local são `/api/*` (Worker), que não existem nele — nada da cena.

### Material
`out/preview/fase-f-producao-x-v3{,-mob}{,-2x}.mp4` (90 s, produção atual × página nova), `out/preview/f-qa.png`.

### Para publicar (depende do usuário)
Commit dos arquivos da v3 + troca no `index.html`; deploy pelo fluxo de sempre. Reverter = voltar o `<script>` para
`hero-scene.js` e os dois pôsteres para as cópias `-v2`.

### Ajustes depois de publicar (pedidos do usuário)
- **Entrada mais rápida:** abertura de 3,5 s → 0,6 s e caminhada começando logo fora da borda (x = −14, a entrada
  da v2; mesmo ciclo de passos, termina no mesmo pé). Ele aparece aos 0,6 s e fala aos 4,2 s (antes 7,6 s);
  intro 21,1 s → 17,7 s. Os tempos do loop recuam 3,4 s (ex.: café na janela ≈ 42,9 s, build falhou ≈ 67,2 s).
- **Falas embaixo:** no desktop a caixa de diálogo fica no canto inferior direito (como já era no celular), com
  fonte de 10 px e 6 px da borda (cobre o cantoneiro dourado); não cobre o personagem enquanto ele fala, nos três
  idiomas. `HELLO` volta a valer só para o quarto da v2.
- QA refeito (`qa_final.cjs` com os tempos novos): viewports, idiomas, movimento reduzido, sem JS, reserva v2 e
  testes passando. Vídeo: `out/preview/intro-antes-x-depois{,-mob}-2x.mp4`.

## 6. Runtime v3 (proposta)

`assets/js/hero-cine.js` (IIFE, sem dependências), substitui `hero-scene.js` **só quando validado**; até lá, atrás
de `?hero=v3`. Mantém tudo o que funciona hoje (relógio pausável, falas HTML, pôster, carga preguiçosa).

- **Composição:** ambiente → planos por `z` com o personagem intercalado → luz aditiva → partículas → falas.
- **Luz:** cor/intensidade das telas por momento (código, build, espera); luz no rosto/óculos pela máscara do rig;
  luz da janela e das estrelas; transições graduais.
- **Câmera:** fixa por padrão; panorâmicas e parallax de poucos pixels dentro da margem do mundo; posição sempre
  arredondada ao pixel.
- **Loop ambiente** sem corte depois da sequência principal; **botão discreto para rever**; sem áudio.
- **Qualidade adaptativa:** se o quadro passar do orçamento, desliga partículas e parallax antes de reduzir fps; a
  composição nunca muda.
- **Movimento reduzido / sem JS:** pôster estático, como hoje.
- Orçamento: ≤ 250 KB de assets da cena, ≤ 2 ms de CPU por quadro em desktop médio.

---

## 7. Roteiro proposto (~75 s + loop), a partir da história atual

A história atual é a espinha: ele chega, se apresenta, vai à mesa, programa, comemora, toma café, coça a cabeça.
A v3 alonga e enriquece essa mesma história.

| Tempo | Cena | Câmera / luz |
|---|---|---|
| 0–7 s | Escritório vazio à noite: monitores em espera, estrelas, luzes da cidade, vapor ainda na caneca | Fixa; luz de espera pulsando devagar |
| 7–18 s | Lucas entra pela esquerda (caminhada nova), para, **vira para o visitante com quadros intermediários**, 1ª fala | Pan curto acompanhando |
| 18–28 s | 2ª fala; vira para a mesa, caminha, contorna, gira, puxa a cadeira e senta | Volta ao enquadramento atual |
| 28–40 s | Mexe o mouse: telas acendem (rampa de luz no rosto, óculos e mesa); começa a programar | Luz do monitor sobe |
| 40–52 s | Digitação variada, olha de um monitor para o outro, telas mudam de conteúdo | Luz muda com a tela |
| 52–60 s | Toma café; olha pela janela (a cidade ganha um detalhe: uma janela acende) | Parallax sutil |
| 60–68 s | O build roda: barra de progresso → verde → comemoração curta; ou falha → coça a cabeça (alternam a cada volta) | Verde ilumina tudo por um instante |
| 68–75 s | Volta a digitar; a cena se estabiliza | — |
| loop | Digitação com variações, piscadas, olhares, café ocasional; botão “rever” | Variações sutis |

As falas atuais (`home.hero.hello_*`) continuam; falas novas, se houver, ganham chaves em PT/EN/ES.

---

## 8. Fotos do quarto — como serão usadas

Servem para dar características reais aos elementos que **já existem** na cena:
1. Mesa com o setup (monitores, teclado, mouse, mousepad, objetos fixos) — de frente e de lado.
2. Cadeira.
3. Prateleiras e objetos que dizem algo sobre você.
4. Janela e o que se vê por ela à noite.
5. Uma foto com o setup ligado e a luz apagada (como a luz dos monitores cai na mesa e na parede).

---

## 9. QA (antes de qualquer troca em produção)

Capturas automáticas por Playwright nos momentos-chave (`?t=` determinístico no runtime v3) em 1440×900, 1280×800,
768×1024 e 390×844; comparação lado a lado v2 × v3 em cada momento; turnaround com guias; verificação numérica de pé
plantado; gravação local com ffmpeg; tempo de quadro, heap e bytes; revisão visual de mãos, pés, rosto, óculos e
transições. `tests/*.test.js` continuam passando.

---

## 10. Fases

- **A — Auditoria:** concluída.
- **B — Direção artística:** identidade da v2 fixada como referência; resolução mantida (estudo concluído).
- **C — Personagem:** protótipo completo (todas as animações, intro + loop) em `?hero=v3`; aguardando validação visual.
- **D — Cenário:** aprovado (seção 5).
- **E — Cinemática:** aprovada (seção 5b).
- **F — Integração e QA:** integrada e verificada localmente (seção 5c); aguardando aprovação para commit/deploy.
