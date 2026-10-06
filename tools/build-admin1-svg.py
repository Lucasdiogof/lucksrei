"""Gera assets/img/visitors/admin1/<PAÍS>.svg (divisas de estados/províncias) a partir do Natural Earth (domínio público).
Uso: python tools/build-admin1-svg.py <ne_110m_admin_0_countries.geojson> <ne_10m_admin_1_states_provinces.geojson>

O primeiro arquivo é o mesmo que gera o world.svg: serve só para recalcular a MESMA transformação (Equal Earth,
largura 1000, mesmos limites), para os estados encaixarem exatamente no mapa-múndi. O script confere o viewBox.
Um arquivo por país: <svg viewBox igual ao world.svg><path data-r="GO" data-n="Goiás" data-pt data-es data-en d=…/>…</svg>.
data-r = parte da subdivisão ISO 3166-2 (o mesmo formato de request.cf.regionCode). Sem cor fixa: a escala vem do CSS.
"""
import json, math, os, re, sys

A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
W = 1000.0
EPS = 0.04        # simplificação (unidades do viewBox; o país é ampliado no zoom, então bem mais fino que o world.svg)
MIN_AREA = 0.004  # ilhas menores que isso somem (exceto o maior polígono de cada estado)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'img', 'visitors', 'admin1')


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
    # iterativo (anéis do 1:10m têm dezenas de milhares de pontos)
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


# --- estados por país
admin = json.load(open(sys.argv[2], encoding='utf-8'))
by = {}
for f in admin['features']:
    p = f['properties']
    cc = (p.get('iso_a2') or '').upper()
    if not re.fullmatch(r'[A-Z]{2}', cc) or cc == 'AQ':
        continue
    iso = p.get('iso_3166_2') or ''
    m = re.fullmatch(r'([A-Z]{2})-([A-Z0-9]{1,3})', iso)
    code = m.group(2) if m and m.group(1) == cc else ''
    rings = []
    for poly in rings_of(f['geometry']):
        rings.append([tx(lo, la) for lo, la in poly[0]])
    if rings:
        by.setdefault(cc, []).append((code, p, rings))

os.makedirs(OUT, exist_ok=True)
for name in os.listdir(OUT):
    if name.endswith('.svg'):
        os.remove(os.path.join(OUT, name))

total = 0
for cc in sorted(by):
    paths = []
    for code, p, rings in sorted(by[cc], key=lambda t: (t[0], t[1].get('name') or '')):
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
                # anel fechado (1º = último): divide no ponto mais distante, como no world.svg
                k = max(range(len(clean)), key=lambda i: math.hypot(clean[i][0] - clean[0][0], clean[i][1] - clean[0][1]))
                clean = rdp(clean[:k + 1], EPS)[:-1] + rdp(clean[k:], EPS)
            if len(clean) < 3:
                continue
            d.append('M' + 'L'.join(f'{a:g} {b:g}' for a, b in clean) + 'Z')
        if not d:
            continue
        attrs = f' data-r="{code}"' if code else ''
        attrs += f' data-n="{esc(p.get("name"))}"'
        for k in ('pt', 'es', 'en'):
            v = p.get('name_' + k)
            if v and v != p.get('name'):
                attrs += f' data-{k}="{esc(v)}"'
        paths.append(f'<path{attrs} d="{"".join(d)}"/>')
    if not paths:
        continue
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {int(W)} {H:g}" data-c="{cc}">' + ''.join(paths) + '</svg>'
    open(os.path.join(OUT, cc + '.svg'), 'w', encoding='utf-8', newline='').write(svg)
    total += len(svg.encode('utf-8'))

print(len(os.listdir(OUT)), 'países;', total // 1024, 'KB no total; viewBox', int(W), H)
