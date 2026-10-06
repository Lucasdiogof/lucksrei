"""Confere se todo código de 1º nível ISO 3166-2 (o nível do request.cf.regionCode) cai em algum estado do mapa.
Uso: python tools/check-admin1-coverage.py <iso_3166-2.json> [--strict]

Para cada país com divisas em assets/img/visitors/admin1/, lista:
- códigos ISO de 1º nível que nenhum <path> cobre (nem em data-r nem em data-a): visita desse estado não pinta nada;
- divisões desenhadas sem código (data-r ausente): nunca ganham cor.
Fica de fora o que não é falha: subdivisão que é país próprio para a Cloudflare (TERRITORIES: US-PR, NL-AW, FR-NC…)
e as exceções explicadas em ALLOWED_MISSING / ALLOWED_UNCODED. Com --strict, sai com código 1 se sobrar algo.
"""
import json, os, re, sys
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ADM = os.path.join(ROOT, 'assets', 'img', 'visitors', 'admin1')

# Divisões desenhadas sem código que não são falha (não existe código ISO de 1º nível para elas).
ALLOWED_UNCODED = {
    'AE': 'Zona Neutra (disputa com a Arábia Saudita)', 'AU': 'ilhas externas (Macquarie, Ashmore e Cartier)',
    'CN': 'Ilhas Paracel (disputa)', 'GL': 'Parque Nacional e Pituffik (fora dos municípios)',
    'NO': 'Ilha Bouvet (território próprio, BV)', 'NZ': 'ilhas subantárticas e externas',
    'SC': 'Ilhas Exteriores (sem distrito)', 'SY': 'zona da UNDOF (Golã)',
}


# Subdivisão ISO que é país próprio para a Cloudflare (o visitante chega com esse país, não com o estado).
TERRITORIES = {
    'US': {'AS', 'GU', 'MP', 'PR', 'UM', 'VI'}, 'NL': {'AW', 'CW', 'SX'},
    'FR': {'BL', 'MF', 'NC', 'PF', 'PM', 'TF', 'WF', 'CP'},  # CP = Clipperton, desabitada
    'CN': {'HK', 'MO', 'TW'}, 'FI': {'01'},  # Åland = AX
    'NO': {'21', '22'},  # Svalbard e Jan Mayen = SJ
}
# Código ISO sem forma própria no mapa que não é falha (desabitado, ou ilhota sem polígono no Natural Earth 1:10m).
ALLOWED_MISSING = {
    'MU': {'CC'},  # Cargados Carajos: ilhotas sem população fixa
    'SC': {'26', '27'},  # Ile Perseverance I e II: ilha artificial sem polígono no 1:10m
    'UM': {'89'},  # Kingman Reef: desabitado
    'CY': {'06'},  # Keryneia: norte ocupado; o Natural Earth não desenha o distrito
    'RS': {'KM'},  # Kosovo-Metohija: Kosovo é país próprio no mapa (XK)
    'TW': {'LIE'},  # Lienchiang (ilhas Matsu): sem polígono no Natural Earth 1:10m
}


def main():
    iso = {e['code']: e for e in json.load(open(sys.argv[1], encoding='utf-8'))['3166-2']}
    tops = defaultdict(dict)
    for c, e in iso.items():
        if 'parent' not in e:
            tops[c[:2]][c[3:]] = e['name']
    problems = 0
    for f in sorted(os.listdir(ADM)):
        cc = f[:2]
        s = open(os.path.join(ADM, f), encoding='utf-8').read()
        covered, uncoded = set(), []
        for attrs in re.findall(r'<path([^>]*?) d="', s):
            r = re.search(r'data-r="([^"]*)"', attrs)
            a = re.search(r'data-a="([^"]*)"', attrs)
            n = re.search(r'data-n="([^"]*)"', attrs)
            if r:
                covered.add(r.group(1))
            else:
                uncoded.append(n.group(1) if n else '?')
            if a:
                covered.update(a.group(1).split())
        skip = TERRITORIES.get(cc, set()) | ALLOWED_MISSING.get(cc, set())
        missing = {k: v for k, v in tops[cc].items() if k not in covered and k not in skip}
        unc = uncoded if cc not in ALLOWED_UNCODED and tops[cc] else []
        if missing or unc:
            problems += 1
            print(f'{cc}: sem estado no mapa: ' + (', '.join(f'{k} {v}' for k, v in sorted(missing.items())) or '—'))
            if unc:
                print(f'    desenhado sem código: {", ".join(unc)}')
    print(f'\n{problems} país(es) com falha.' if problems else '\nok — todo código de 1º nível ISO cai em algum estado do mapa.')
    if problems and '--strict' in sys.argv:
        sys.exit(1)


main()
