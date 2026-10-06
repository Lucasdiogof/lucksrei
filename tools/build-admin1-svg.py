"""Gera assets/img/visitors/admin1/<PAÍS>.svg (divisas de 1º nível ISO 3166-2 = o nível do request.cf.regionCode).
Uso: python tools/build-admin1-svg.py <ne_110m_admin_0_countries.geojson> <ne_10m_admin_1_states_provinces.geojson> <iso_3166-2.json>

Fontes (nenhuma fica no repo):
- Natural Earth 1:110m países — só para recalcular a MESMA transformação do world.svg (Equal Earth, largura 1000);
  o script confere o viewBox, então os estados encaixam exatamente no mapa-múndi.
- Natural Earth 1:10m admin-1 — a geometria.
- iso_3166-2.json do projeto iso-codes (Debian) — a hierarquia oficial. A Cloudflare informa o código de 1º nível
  (ex.: França → região "IDF", Reino Unido → "ENG"), e o Natural Earth às vezes desenha um nível abaixo
  (departamentos, condados, províncias). Cada divisão sobe até o 1º nível; as que caem na mesma região são FUNDIDAS
  (as bordas internas somem). Código desatualizado no Natural Earth → tenta casar pelo nome.
Saída: <svg viewBox igual ao world.svg data-c="BR"><path data-r="GO" data-n="Goiás" data-pt data-es data-en d=…/>…</svg>.
No fim imprime a cobertura por país (quantos códigos de 1º nível existem no ISO e quantos o mapa desenha).
"""
import json, math, os, re, sys, unicodedata
from collections import defaultdict

A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
W = 1000.0
EPS = 0.04        # simplificação (unidades do viewBox)
MIN_AREA = 0.004  # ilhas menores que isso somem (exceto o maior anel de cada região)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'img', 'visitors', 'admin1')

# Nomes de regiões fundidas que não são nomes próprios iguais nos 3 idiomas (o resto usa o nome oficial ISO).
TRANSLATE = {
    'GB-ENG': {'pt': 'Inglaterra', 'es': 'Inglaterra', 'en': 'England'},
    'GB-SCT': {'pt': 'Escócia', 'es': 'Escocia', 'en': 'Scotland'},
    'GB-WLS': {'pt': 'País de Gales', 'es': 'Gales', 'en': 'Wales'},
    'GB-NIR': {'pt': 'Irlanda do Norte', 'es': 'Irlanda del Norte', 'en': 'Northern Ireland'},
    'BE-BRU': {'pt': 'Bruxelas-Capital', 'es': 'Bruselas-Capital', 'en': 'Brussels-Capital'},
    'BE-VLG': {'pt': 'Flandres', 'es': 'Flandes', 'en': 'Flanders'},
    'BE-WAL': {'pt': 'Valônia', 'es': 'Valonia', 'en': 'Wallonia'},
    'IE-C': {'pt': 'Connacht', 'es': 'Connacht', 'en': 'Connacht'},
    'IE-L': {'pt': 'Leinster', 'es': 'Leinster', 'en': 'Leinster'},
    'IE-M': {'pt': 'Munster', 'es': 'Munster', 'en': 'Munster'},
    'IE-U': {'pt': 'Ulster', 'es': 'Úlster', 'en': 'Ulster'},
}


# Natural Earth com código antigo/errado → código ISO atual (chave: adm1_code, estável no Natural Earth).
NE_FIX = {
    'MEX-2727': 'MX-CMX',  # Distrito Federal → Ciudad de México
    'COL-1399': 'CO-DC',   # Bogotá marcada como Cundinamarca
    'CZE-1595': 'CZ-10',   # Praga (letras → números)
    'POL-3170': 'PL-12',   # Pequena Polônia (MA → 12)
    'POL-3147': 'PL-10',   # Łódź (LD → 10)
    'EST-1661': 'EE-56',   # Lääne (57 → 56)
    'HRV-1604': 'HR-11',   # Požega-Eslavônia rotulada como HR-12
    'PER-587': 'PE-LMA',   # Lima Metropolitana (a outra "PE-LIM" é a região)
}

# Códigos alternativos conhecidos (grafias que a Cloudflare/MaxMind podem usar além do código ISO atual).
EXTRA_ALIASES = {'FR-20R': {'COR'}}  # Córsega: coletividade 20R (ISO desde 2018); antes, região COR

# Noruega: o Natural Earth tem os condados anteriores a 2020, que coincidem com os de 2024. Código principal = 2024;
# aliases = 2020 e o antigo, para casar com qualquer versão que a Cloudflare/MaxMind use.
NO_REFORM = {  # antigo: (2024, 2020)
    '01': ('31', '30'), '02': ('32', '30'), '03': ('03', '03'), '04': ('34', '34'), '05': ('34', '34'),
    '06': ('33', '30'), '07': ('39', '38'), '08': ('40', '38'), '09': ('42', '42'), '10': ('42', '42'),
    '11': ('11', '11'), '12': ('46', '46'), '14': ('46', '46'), '15': ('15', '15'), '16': ('50', '50'),
    '17': ('50', '50'), '18': ('18', '18'), '19': ('55', '54'), '20': ('56', '54'),
}
NO_NAMES = {'31': 'Østfold', '32': 'Akershus', '33': 'Buskerud', '34': 'Innlandet', '39': 'Vestfold', '40': 'Telemark',
            '42': 'Agder', '46': 'Vestland', '50': 'Trøndelag', '55': 'Troms', '56': 'Finnmark'}


def project(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    th = math.asin(math.sqrt(3) / 2 * math.sin(phi))
    t2, t6 = th * th, th ** 6
    x = 2 * math.sqrt(3) * lam * math.cos(th) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x, y


def rings_of(geom):
    if geom is None:
        return []
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    return geom['coordinates']


def area(ring):
    return abs(sum(ring[i][0] * ring[(i + 1) % len(ring)][1] - ring[(i + 1) % len(ring)][0] * ring[i][1] for i in range(len(ring)))) / 2


def rdp(pts, eps):
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i0, i1 = stack.pop()
        (x1, y1), (x2, y2) = pts[i0], pts[i1]
        dx, dy = x2 - x1, y2 - y1
        n = math.hypot(dx, dy) or 1e-9
        idx, dmax = 0, 0
        for i in range(i0 + 1, i1):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
            if d > dmax:
                idx, dmax = i, d
        if dmax > eps:
            keep[idx] = True
            stack.append((i0, idx))
            stack.append((idx, i1))
    return [p for p, k in zip(pts, keep) if k]


def esc(s):
    return (s or '').replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


def clean_iso_name(s):
    """'Catalunya [Cataluña]' → 'Catalunya'; "Valle d'Aosta, Val d'Aoste" → "Valle d'Aosta"."""
    s = re.sub(r'\s*\[[^\]]*\]', '', s or '').strip()
    first, sep, _ = s.partition(', ')
    return first if sep and first[:1].isupper() else s


def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"[^a-z ]+", ' ', s)
    stop = {'region', 'province', 'provincia', 'county', 'kraj', 'oblast', 'department', 'departamento', 'departement',
            'state', 'estado', 'governorate', 'prefecture', 'district', 'municipality', 'voivodeship', 'the', 'of', 'de',
            'del', 'la', 'le', 'autonomous', 'city', 'capital', 'special', 'administrative', 'area', 'territory', 'canton',
            'parish', 'division', 'zone', 'republic', 'atoll', 'island', 'islands', 'ilha', 'ilhas', 'okrug', 'krai',
            'respublika', 'judetul', 'gouvernorat', 'wilaya', 'muhafazah', 'ostan', 'vilayeti', 'ili', 'provinsi', 'mkoa'}
    return ' '.join(t for t in s.split() if t not in stop)


# --- dissolve: junta polígonos vizinhos cancelando as arestas em comum (o Natural Earth compartilha os vértices)
def dissolve(rings):
    key = lambda p: (round(p[0], 6), round(p[1], 6))
    cnt = defaultdict(int)
    edges = []
    for r in rings:
        pts = [key(p) for p in r]
        if pts[0] != pts[-1]:
            pts.append(pts[0])
        for a, b in zip(pts, pts[1:]):
            if a == b:
                continue
            edges.append((a, b))
            cnt[(a, b) if a < b else (b, a)] += 1
    out_edges = defaultdict(list)
    for a, b in edges:
        if cnt[(a, b) if a < b else (b, a)] == 1:
            out_edges[a].append(b)
    res = []
    while out_edges:
        start = next(iter(out_edges))
        ring = [start]
        cur = start
        ok = False
        for _ in range(2_000_000):
            nxt = out_edges[cur].pop()
            if not out_edges[cur]:
                del out_edges[cur]
            ring.append(nxt)
            cur = nxt
            if cur == start:
                ok = True
                break
            if cur not in out_edges:
                break
        if not ok or len(ring) < 4:
            return None  # topologia não fechou: o chamador desenha os pedaços sem fundir
        res.append(ring)
    return res


# --- mesma transformação do world.svg
world = json.load(open(sys.argv[1], encoding='utf-8'))
xs, ys = [], []
for f in world['features']:
    code = f['properties'].get('ISO_A2_EH')
    if code in (None, '-99') or code == 'AQ':
        continue
    for poly in rings_of(f['geometry']):
        for lo, la in poly[0]:
            x, y = project(lo, la)
            xs.append(x)
            ys.append(y)
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
scale = W / (maxx - minx)
H = round((maxy - miny) * scale, 1)
vb = open(os.path.join(ROOT, 'assets', 'img', 'visitors', 'world.svg'), encoding='utf-8').read(300)
assert f'viewBox="0 0 {int(W)} {H:g}"' in vb, 'transformação diferente do world.svg'


def tx(lon, lat):
    x, y = project(lon, lat)
    return round((x - minx) * scale, 2), round((maxy - y) * scale, 2)


# --- hierarquia ISO 3166-2
iso = {e['code']: e for e in json.load(open(sys.argv[3], encoding='utf-8'))['3166-2']}


def iso_top(code):
    for _ in range(6):
        e = iso.get(code)
        if not e or 'parent' not in e:
            return code
        p = e['parent']
        code = p if '-' in p else code[:2] + '-' + p
    return code


tops = defaultdict(dict)       # país → {código de 1º nível: nome}
by_name = defaultdict(dict)    # país → {nome normalizado: código de 1º nível}
for c, e in iso.items():
    cc = c[:2]
    if 'parent' not in e:
        tops[cc][c] = e['name']
    n = norm(e['name'])
    if n:
        by_name[cc].setdefault(n, iso_top(c))


def resolve(cc, p):
    """Código de 1º nível ISO para uma feição do Natural Earth (ou None)."""
    fix = NE_FIX.get(p.get('adm1_code'))
    if fix:
        return iso_top(fix) if iso_top(fix) in tops[cc] else fix
    code = (p.get('iso_3166_2') or '').upper()
    if cc == 'GB' and 'GB-' + (p.get('gu_a3') or '') in tops[cc]:  # nação explícita no Natural Earth (ENG/SCT/WLS/NIR)
        return 'GB-' + p['gu_a3']
    if cc == 'NO' and code[3:] in NO_REFORM:
        return 'NO-' + NO_REFORM[code[3:]][0]
    if re.fullmatch(cc + r'-[A-Z0-9]{1,3}', code):
        t = iso_top(code)
        if t in tops[cc]:
            return t
    rc = (p.get('region_cod') or '').replace('.', '-').upper()
    if re.fullmatch(cc + r'-[A-Z0-9]{1,3}', rc) and rc in tops[cc]:
        return rc
    for k in ('name', 'name_en', 'woe_name', 'gn_name', 'name_alt', 'region'):  # 'region' = região-mãe (ex.: Republika Srpska)
        n = norm(p.get(k))
        if n and n in by_name[cc] and by_name[cc][n] in tops[cc]:
            return by_name[cc][n]
    return None


# --- agrupa as feições do Natural Earth por região de 1º nível
admin = json.load(open(sys.argv[2], encoding='utf-8'))
groups = defaultdict(lambda: defaultdict(list))  # país → código (ou "?n") → [(props, anéis lon/lat)]
aliases = defaultdict(lambda: defaultdict(set))  # país → código → outros códigos que também valem (antigos, 2020…)
for i, f in enumerate(admin['features']):
    p = f['properties']
    cc = (p.get('iso_a2') or '').upper()
    own = (p.get('iso_3166_2') or '').upper()
    # divisão rotulada com o código ISO de outro país (ex.: Crimeia "UA-43" no arquivo da Rússia) vai para esse país;
    # território que é país próprio no mapa (Porto Rico "US-PR", Sint Maarten "NL-SX") fica no próprio arquivo
    if own in iso and own[:2] != cc and own[3:] != cc:
        cc = own[:2]
    if not re.fullmatch(r'[A-Z]{2}', cc) or cc == 'AQ':
        continue
    rings = [poly[0] for poly in rings_of(f['geometry'])]
    if not rings:
        continue
    top = resolve(cc, p)
    key = top or ('?%d' % i)
    groups[cc][key].append((p, rings))
    if top:
        if re.fullmatch(cc + r'-[A-Z0-9]{1,3}', own):
            aliases[cc][key].add(own[3:])
        if cc == 'NO' and own[3:] in NO_REFORM:
            aliases[cc][key].add(NO_REFORM[own[3:]][1])


os.makedirs(OUT, exist_ok=True)
for name in os.listdir(OUT):
    if name.endswith('.svg'):
        os.remove(os.path.join(OUT, name))

total = 0
report = []
unfused = []
for cc in sorted(groups):
    paths = []
    for code in sorted(groups[cc]):
        members = groups[cc][code]
        all_rings = [r for _, rs in members for r in rs]
        if len(members) > 1:
            fused = dissolve(all_rings)
            if fused is None:
                unfused.append(code)
            else:
                all_rings = fused
        rings = [[tx(lo, la) for lo, la in r] for r in all_rings]
        big = max(rings, key=area)
        d = []
        for r in rings:
            if r is not big and area(r) < MIN_AREA:
                continue
            clean = [r[0]]
            for q in r[1:]:
                if q != clean[-1]:
                    clean.append(q)
            if len(clean) > 3:
                k = max(range(len(clean)), key=lambda j: math.hypot(clean[j][0] - clean[0][0], clean[j][1] - clean[0][1]))
                clean = rdp(clean[:k + 1], EPS)[:-1] + rdp(clean[k:], EPS)
            if len(clean) < 3:
                continue
            d.append('M' + 'L'.join(f'{a:g} {b:g}' for a, b in clean) + 'Z')
        if not d:
            continue
        p0 = members[0][0]
        if code.startswith('?'):
            attrs = f' data-n="{esc(p0.get("name"))}"'
            names = {k: p0.get('name_' + k) for k in ('pt', 'es', 'en')}
        else:
            mine = code.split("-", 1)[1]
            attrs = f' data-r="{mine}"'
            # aliases que não colidem com o código principal de outra região do mesmo país
            taken = {c.split("-", 1)[1] for c in groups[cc] if not c.startswith('?')} | {c.split("-", 1)[1] for c in tops[cc]}
            extra = sorted(a for a in (aliases[cc][code] | EXTRA_ALIASES.get(code, set())) if a != mine and a not in taken - {mine})
            if cc == 'NO':  # aliases da reforma (2020) podem coincidir entre regiões irmãs: é o esperado
                extra = sorted(a for a in aliases[cc][code] if a != mine)
            if extra:
                attrs += f' data-a="{" ".join(extra)}"'
            if len(members) == 1 and p0.get('adm1_code') in NE_FIX:
                base = tops[cc].get(code) or p0.get('name') or mine  # código corrigido: nome oficial atual
                names = {}
            elif len(members) == 1:
                base = p0.get('name') or tops[cc].get(code) or mine
                names = {k: p0.get('name_' + k) for k in ('pt', 'es', 'en')}
            else:
                base = tops[cc].get(code) or (NO_NAMES.get(mine) if cc == 'NO' else None) or p0.get('name') or mine
                names = TRANSLATE.get(code, {})
            if code in TRANSLATE:  # nomes revisados à mão valem mais que os do ISO/Natural Earth
                names = TRANSLATE[code]
                base = names['en']
            elif base == tops[cc].get(code):
                base = clean_iso_name(base)
            attrs += f' data-n="{esc(base)}"'
        for k in ('pt', 'es', 'en'):
            v = names.get(k)
            if v and v != (p0.get('name') if len(members) == 1 else None):
                attrs += f' data-{k}="{esc(v)}"'
        paths.append(f'<path{attrs} d="{"".join(d)}"/>')
    if not paths:
        continue
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {int(W)} {H:g}" data-c="{cc}">' + ''.join(paths) + '</svg>'
    open(os.path.join(OUT, cc + '.svg'), 'w', encoding='utf-8', newline='').write(svg)
    total += len(svg.encode('utf-8'))
    drawn = {c for c in groups[cc] if not c.startswith('?')}
    report.append((cc, len(drawn & set(tops[cc])), len(tops[cc]), sum(1 for c in groups[cc] if c.startswith('?'))))

full = [r for r in report if r[2] == 0 or r[1] == r[2]]
print(len(report), 'países;', total // 1024, 'KB no total; viewBox', int(W), H)
print('cobertura 100% do 1º nível ISO (ou país sem subdivisões):', len(full))
if unfused:
    print('não fundiu (desenhado em pedaços):', ' '.join(unfused))
print('incompletos (país: desenhados/ISO, sem código):')
print('  ' + '  '.join(f'{c}:{a}/{b}' + (f'+{u}?' if u else '') for c, a, b, u in report if b and a < b))
