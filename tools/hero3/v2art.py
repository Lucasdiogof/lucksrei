"""Hero v3 híbrido — a arte da v2 como base do personagem.

As cabeças da v2 são grades de pixel desenhadas à mão numa série coerente (tools/hero_char.py e tools/hero_side.py):
FRONT_HEAD (0°), SIDE_HEAD (3/4, ~45°) e SIDE_PROFILE (perfil “trapaceado”, ~90° com o rosto em 3/4). Aqui ficam as
duas cabeças INTERMEDIÁRIAS desenhadas à mão no mesmo estilo e paleta (22,5° e 67,5°), para a rotação ter quadros
entre as da v2 sem trocar de desenho, e as funções que entregam a cabeça certa para cada ângulo.

Convenção: grades de 16 colunas (o perfil da v2 tem 15; é completado com '.'), paleta FRONT_PAL da v2:
o contorno, h/H cabelo/luz, s/S/k pele/sombra/luz, g armação, w branco do olho, e pupila, l lente clara,
b/B barba/sombra, t dente, m boca. Olhando para a DIREITA da tela; a esquerda é o espelho.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import hero_char as hc  # noqa: E402
import hero_side as hs  # noqa: E402

PAL = hc.FRONT_PAL


def _pad(rows, w=16):
    out = [r + "." * (w - len(r)) for r in rows]
    assert all(len(r) == w for r in out), [len(r) for r in out]
    return out


# 22,5°: a frente da v2 com o rosto deslizando 1 px para a direita (lente da esquerda chega mais perto da orelha,
# nariz e sorriso 1 px à direita), cabelo da esquerda 1 px mais largo; silhueta igual à da frente.
HEAD_22 = _pad([
    ".....oooooo.....",
    "...oohHHHhhoo...",
    "..ohHHhhhhhhho..",
    ".ohhhhhhhhhhhhho",
    ".ohhhssssssssho.",
    "ohhsssssssssssho",
    "oSsgggggsgggggso",
    "oSsgwewgggwewgso",
    "oSsglllgsglllgso",
    ".osgggggkgggggo.",
    ".obsssssskSssbo.",
    ".obbbssbbbbssbo.",
    ".obbbbmttttmbbo.",
    "..obbbbmmmmbbo..",
    "...obbbbbbbbo...",
    ".....obbbbo.....",
])

# 67,5°: entre o 3/4 (SIDE_HEAD) e o perfil (SIDE_PROFILE): orelha 1 px antes da do perfil, cabelo cobrindo a nuca,
# lente de perto com olho branco e pupila, só a borda da lente de longe, nariz dentro do rosto, sorriso de 4 px.
HEAD_67 = _pad([
    "....oooooo......",
    "..oohhHHHhhoo...",
    ".ohhhHHhhhhhhoo.",
    "ohhhhhhhhhhhhhho",
    "ohhhhhhhhssssso.",
    "ohhhhhhhsssssso.",
    "ohhhhSShsggggsso",
    "ohhhSkSgggwegsgo",
    "ohhhSkSssgllgsso",
    "ohhhSSSssggggsko",
    ".ohhhbbsssssskSo",
    "..ohhbbbsssbbbbo",
    "...oobbbbbbmttto",
    ".....obbbbbbmmbo",
    "......obbBBbbbo.",
    "........oobbbo..",
])

# 135° (3/4 de costas, olhando para o fundo-direita): cabelo cobre quase tudo, orelha à direita, só a borda da barba e
# a ponta da haste dos óculos aparecem; nuca com pele embaixo
HEAD_135 = _pad([
    "....oooooo......",
    "..oohhHHHhoo....",
    ".ohhhHHhhhhhoo..",
    "ohhhhhhhhhhhhho.",
    "ohhhhhhhhhhhhho.",
    "ohhhhhhhhhhhhhho",
    "ohhhhhhhhhhhhggo",
    "ohhhhhhhhhhSShso",
    "ohhhhhhhhhhSkSbo",
    "ohhhhhhhhhhSSbbo",
    ".ohhhhhhhhhhbbo.",
    ".ohhhhhhhhhhbo..",
    "..ohhhhhhhhhbo..",
    "...ohhhhhhhho...",
    "....oSSSsssso...",
    ".....oooooo.....",
])

# 180° (de costas): cabelo com o brilho no alto, as duas orelhas, nuca com pele
HEAD_180 = _pad([
    ".....oooooo.....",
    "...oohHHHhhoo...",
    "..ohHHhhhhhhho..",
    ".ohhhhhhhhhhhhho",
    ".ohhhhhhhhhhhhho",
    "ohhhhhhhhhhhhhho",
    "oShhhhhhhhhhhhSo",
    "oSkhhhhhhhhhhkSo",
    "oSShhhhhhhhhhSSo",
    ".ohhhhhhhhhhhho.",
    ".obhhhhhhhhhhbo.",
    "..ohhhhhhhhhho..",
    "...ohhhhhhhho...",
    "....oSsssssSo...",
    "....oSsssssSo...",
    ".....oooooo.....",
])

FRONT = _pad(hc.FRONT_HEAD)
THREEQ = _pad(hc.SIDE_HEAD)
PROFILE = _pad(hs.SIDE_PROFILE)

# série de cabeças por ângulo (graus, olhando para a direita); blink: troca a linha do olho por pálpebra
SERIES = [(0.0, FRONT), (22.5, HEAD_22), (45.0, THREEQ), (67.5, HEAD_67), (90.0, PROFILE)]


def eyes(rows, look=None, closed=False):
    """Miolo das lentes (linhas 7 e 8 em todas as cabeças da série): olhar (x −1..1, y 1 = para baixo) ou olhos
    fechados — mesmo recurso da v2 (FRONT_HEAD_DOWN / FRONT_HEAD_BLINK). look=None mantém o desenho original."""
    if look is None and not closed:
        return list(rows)
    r7, r8 = list(rows[7]), list(rows[8])
    i = 0
    while i < len(r7):
        if r7[i] in "wel" or r8[i] in "wel":
            j = i
            while j < len(r7) and (r7[j] in "wel" or r8[j] in "wel"):
                j += 1
            n = j - i
            if closed:
                top, bot = ["S"] * n, ["s"] * n
            else:
                lx, ly = look if look is not None else (0, 0)
                k = min(n - 1, max(0, int((n - 1) * (lx + 1) / 2 + 0.5)))
                if ly > 0:
                    top, bot = ["l"] * n, ["w"] * n
                    bot[k] = "e"
                else:
                    top, bot = ["w"] * n, ["l"] * n
                    top[k] = "e"
            r7[i:j], r8[i:j] = top, bot
            i = j
        else:
            i += 1
    out = list(rows)
    out[7], out[8] = "".join(r7), "".join(r8)
    return out


def blink(rows):
    """Olhos fechados: dentro das lentes, branco/pupila/lente viram pele (com vinco de sombra embaixo)."""
    out = []
    for i, r in enumerate(rows):
        if i in (7, 8):
            r = "".join("S" if (c in "wel" and i == 8) else ("s" if c in "wel" else c) for c in r)
        out.append(r)
    return out


BACK_SERIES = [(135.0, HEAD_135), (180.0, HEAD_180)]


def head_for(angle, closed=False, look=None):
    """Cabeça da série mais próxima do ângulo (0 = de frente, 90 = perfil à direita, 180 = de costas; negativo =
    espelho). look/closed: olhar ou olhos fechados (só nas vistas com rosto)."""
    a = abs(((angle + 180) % 360) - 180)
    mirror = ((angle + 180) % 360) - 180 < 0
    if a > 100:
        rows = min(BACK_SERIES, key=lambda s: abs(s[0] - a))[1]
    else:
        rows = eyes(min(SERIES, key=lambda s: abs(s[0] - min(a, 90)))[1], look, closed)
    if mirror:
        rows = [r[::-1] for r in rows]
    return rows


def draw_head(cell_px, rows, x, y):
    """Escreve a grade numa célula (dict (x,y) → cor RGB) a partir do canto (x, y)."""
    for ry, row in enumerate(rows):
        for rx, ch in enumerate(row):
            if ch != ".":
                cell_px[(x + rx, y + ry)] = PAL[ch]
