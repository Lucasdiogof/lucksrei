"""Gera assets/img/visitors/world.svg a partir do Natural Earth 1:110m (domínio público).
Uso: python tools/build-world-svg.py <ne_110m_admin_0_countries.geojson>
Projeção Equal Earth (Šavrič et al., 2018). Sem Antártida. Um <path> por país com data-c (ISO alfa-2) e data-n (nome em inglês).
O mapa não carrega cor: a escala vem de variáveis CSS (assets/css/style.css)."""
import json, math, sys

A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
W = 1000.0


def project(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    th = math.asin(math.sqrt(3) / 2 * math.sin(phi))
    t2, t6 = th * th, th ** 6
    x = 2 * math.sqrt(3) * lam * math.cos(th) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x, y


def rings_of(geom):
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    return geom['coordinates']


def area(ring):
    return abs(sum(ring[i][0] * ring[(i + 1) % len(ring)][1] - ring[(i + 1) % len(ring)][0] * ring[i][1] for i in range(len(ring)))) / 2


data = json.load(open(sys.argv[1], encoding='utf-8'))
feats = []
for f in data['features']:
    p = f['properties']
    code = p.get('ISO_A2_EH')
    if code in (None, '-99') or code == 'AQ':
        continue
    polys = []
    for poly in rings_of(f['geometry']):
        ring = [project(lo, la) for lo, la in poly[0]]
        polys.append(ring)
    feats.append((code, p['NAME'], polys))

xs = [x for _, _, ps in feats for r in ps for x, _ in r]
ys = [y for _, _, ps in feats for r in ps for _, y in r]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
scale = W / (maxx - minx)
H = round((maxy - miny) * scale, 1)


def tx(x, y):
    return round((x - minx) * scale, 1), round((maxy - y) * scale, 1)


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-9
    idx, dmax = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if d > dmax:
            idx, dmax = i, d
    if dmax <= eps:
        return [pts[0], pts[-1]]
    return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)


out = []
for code, name, polys in sorted(feats):
    big = max(polys, key=lambda r: area(r))
    d = []
    for r in polys:
        pts = [tx(x, y) for x, y in r]
        if r is not big and area(pts) < 0.4:
            continue
        clean = [pts[0]]
        for q in pts[1:]:
            if q != clean[-1]:
                clean.append(q)
        if len(clean) > 3:
            k = max(range(len(clean)), key=lambda i: math.hypot(clean[i][0] - clean[0][0], clean[i][1] - clean[0][1]))
            clean = rdp(clean[:k + 1], 0.6)[:-1] + rdp(clean[k:], 0.6)
        if len(clean) < 3:
            continue
        d.append('M' + 'L'.join(f'{a:g} {b:g}' for a, b in clean) + 'Z')
    out.append(f'<path data-c="{code}" data-n="{name.replace("&", "&amp;")}" d="{"".join(d)}"/>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {int(W)} {H:g}" role="img" focusable="false">' + ''.join(out) + '</svg>'
open('assets/img/visitors/world.svg', 'w', encoding='utf-8', newline='').write(svg)
print(len(out), 'países;', len(svg) // 1024, 'KB; viewBox', int(W), H)
