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
    'SO-WO': {'pt': 'Somalilândia', 'es': 'Somalilandia', 'en': 'Somaliland'},
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
    'SLB-3507': 'SB-WE',   # Western rotulada como Choiseul (SB-CH)
    'AZE-1735': 'AZ-LAC',  # Laçın rotulado como "Lankaran" (LAN) no Natural Earth
    'AZE-1707': 'AZ-LAN',  # Lənkəran distrito (o município é LA)
    'AZE-1727': 'AZ-SAK',  # Şəki distrito (o município é SA)
    'MKD-2901': 'MK-810',  # "Skopje" do Natural Earth é o polígono de Petrovec
    'VNM-451': 'VN-53', 'VNM-461': 'VN-66', 'VNM-497': 'VN-39',  # código certo, nome da região no lugar do da província
    'COL+99?': 'CO-VAC',   # Ilha de Malpelo (Valle del Cauca)
    'VEN+99?': 'VE-W',     # Isla de Aves (Dependencias Federales)
    'MEX+99?': 'MX-YUC',   # Arrecife Alacranes (Yucatán)
    'RUS+99?': 'RU-YAN',   # ilha da baía de Baidaratskaia (Iamália-Nenétsia)
    'KIR+00?': 'KI-G',     # Gilbert + Line (um só polígono no 1:10m)
    'KIR+99?': 'KI-P',     # Phoenix
    'AZE-5566': 'AZ-YE',   # Yevlax cidade (o distrito é YEV)
}

# Países em que o código do Natural Earth não serve (numeração antiga que colide com a atual, ou reforma
# administrativa posterior): o 1º nível ISO sai do NOME da feição. Chave "nome" ou "nome|type_en" quando o nome repete.
BY_NAME = {
    'IR': {  # o ISO renumerou as províncias; o Natural Earth tem a numeração antiga (ex.: IR-02 era Azerbaijão Ocidental)
        'West Azarbaijan': '04', 'East Azarbaijan': '03', 'Ardebil': '24', 'Gilan': '01', 'Kordestan': '12',
        'Kermanshah': '05', 'Ilam': '16', 'Khuzestan': '06', 'North Khorasan': '28', 'Golestan': '27',
        'Razavi Khorasan': '09', 'South Khorasan': '29', 'Sistan and Baluchestan': '11', 'Bushehr': '18',
        'Hormozgan': '22', 'Mazandaran': '02', 'Semnan': '20', 'Zanjan': '19', 'Qazvin': '26', 'Markazi': '00',
        'Esfahan': '10', 'Chahar Mahall and Bakhtiari': '14', 'Kohgiluyeh and Buyer Ahmad': '17', 'Fars': '07',
        'Kerman': '08', 'Hamadan': '13', 'Lorestan': '15', 'Yazd': '21', 'Qom': '25', 'Tehran': '23', 'Alborz': '30'},
    'MA': {  # 16 regiões antigas (2-16) → 12 regiões de 2015; os códigos 01-12 antigos são de outras regiões hoje
        'Tanger - Tétouan': '01', 'Gharb - Chrarda - Béni Hssen': '04', 'Taza - Al Hoceima - Taounate': '03',
        'Oriental': '02', 'Fès - Boulemane': '03', 'Meknès - Tafilalet': '08', 'Rabat - Salé - Zemmour - Zaer': '04',
        'Grand Casablanca': '06', 'Chaouia - Ouardigha': '06', 'Doukkala - Abda': '06',
        'Marrakech - Tensift - Al Haouz': '07', 'Tadla - Azilal': '05', 'Souss - Massa - Draâ': '09',
        'Guelmim - Es-Semara': '10', 'Laâyoune - Boujdour - Sakia El Hamra': '11', 'Oued el Dahab': '12'},
    'LV': {  # 119 municípios anteriores a 2021 → 36 novads + 7 cidades (reforma de 2021)
        'Rujienas': '113', 'Mazsalacas': '113', 'Nauksenu': '113', 'Strencu': '113', 'Beverinas': '113',
        'Burtnieku': '113', 'Kocenu': '113', 'Valmiera|Republican City': '113',
        'Alojas': '054', 'Salacgrivas': '054', 'Limbaži': '054', 'Apes': '007', 'Aluksne': '007', 'Valkas': '101',
        'Vilakas': '015', 'Baltinavas': '015', 'Rugaju': '015', 'Balvu': '015',
        'Karsavas': '058', 'Ciblas': '058', 'Ludzas': '058', 'Zilupes': '058',
        'Neretas': '002', 'Plavinu': '002', 'Kokneses': '002', 'Aizkraukles': '002', 'Skriveru': '002', 'Jaunjelgavas': '002',
        'Viesites': '042', 'Aknistes': '042', 'Krustpils': '042', 'Salas': '042', 'Jekabpils|Municipality': '042',
        'Jekabpils|Republican City': '042',
        'Vecumnieku': '016', 'Bauska': '016', 'Rundales': '016', 'Iecavas': '016',
        'Saldus': '088', 'Brocenu': '088', 'Auces': '026', 'Tervetes': '026', 'Dobele': '026',
        'Rucavas': '112', 'Priekules': '112', 'Vainodes': '112', 'Nicas': '112', 'Grobinas': '112', 'Pavilostas': '112',
        'Aizputes': '112', 'Durbes': '112',
        'Jelgava|Municipality': '041', 'Ozolnieku': '041', 'Jelgava|Republican City': 'JEL',
        'Ilukstes': '111', 'Daugavpils|Municipality': '111', 'Daugavpils|Republican City': 'DGV',
        'Dagdas': '047', 'Kraslavas': '047', 'Liepāja': 'LPX',
        'Ventspils|Municipality': '106', 'Ventspils|Republican City': 'VEN',
        'Dundagas': '097', 'Rojas': '097', 'Talsi': '097', 'Mersraga': '097',
        'Engures': '099', 'Kandavas': '099', 'Tukums': '099', 'Jaunpils': '099',
        'Jurmala': 'JUR', 'Riga': 'RIX', 'Carnikavas': '011', 'Ādaži': '011', 'Saulkrastu': '089', 'Sejas': '089',
        'Smiltenes': '094', 'Raunas': '094',
        'Rezeknes': '077', 'Vilanu': '077', 'Rezekne': 'REZ',
        'Vecpiebalgas': '022', 'Priekulu': '022', 'Pargaujas': '022', 'Jaunpiebalgas': '022', 'Amatas': '022',
        'Cesu': '022', 'Ligatnes': '022',
        'Krimuldas': '091', 'Siguldas': '091', 'Malpils': '091', 'Incukalna': '091', 'Gulbene': '033',
        'Aglonas': '073', 'Riebinu': '073', 'Preilu': '073', 'Varkavas': '073', 'Livanu': '056',
        'Babites': '062', 'Marupes': '062', 'Garkalnes': '080', 'Stopinu': '080', 'Ropazu': '080',
        'Kekavas': '052', 'Baldones': '052', 'Olaines': '068', 'Salaspils': '087',
        'Madona': '059', 'Lubanas': '059', 'Erglu': '059', 'Cesvaines': '059', 'Varaklanu': '102',
        'Ogre': '067', 'Ikskiles': '067', 'Keguma': '067', 'Lielvardes': '067',
        'Kuldigas': '050', 'Alsungas': '050', 'Skrundas': '050'},
    'KZ': {  # códigos de letras antigos → numéricos (2022); "Almaty" é a região, "Almaty City" a cidade
        'Mangghystau': '47', 'Aqtöbe': '15', 'North Kazakhstan': '59', 'South Kazakhstan': '61', 'East Kazakhstan': '63',
        'Almaty': '19', 'Almaty City': '75', 'Astana': '71', 'West Kazakhstan': '27', 'Zhambyl': '31', 'Qyzylorda': '43',
        'Qostanay': '39', 'Pavlodar': '55', 'Atyrau': '23', 'Aqmola': '11', 'Qaraghandy': '35'},
    'CI': {  # 19 regiões antigas → 14 distritos de 2011
        'Denguélé': 'DN', 'Bafing': 'WR', 'Worodougou': 'WR', 'Dix-Huit Montagnes': 'MG', 'Cavally': 'MG',
        'Zanzan': 'ZZ', 'Comoe': 'CM', 'Sud-Comoé': 'CM', 'Savanes': 'SV', 'Bas-Sassandra': 'BS',
        'Sud-Bandama': 'GD', 'Fromager': 'GD', 'Lagunes': 'LG', 'Agnéby': 'LG', 'Haut-Sassandra': 'SM',
        'Marahoué': 'SM', "N'zi-Comoé": 'LC', 'Lacs': 'LC', 'Vallée du Bandama': 'VB'},
    'CD': {  # 11 províncias antigas → 26 de 2015 (as novas entram como alternativos em EXTRA_ALIASES)
        'Bandundu': 'KL', 'Orientale': 'TO', 'Katanga': 'HK', 'Kasaï-Occidental': 'KC'},
    'NP': {  # 14 zonas → 7 províncias (2015); zona dividida fica com a província da maior parte
        'Mahakali': 'P7', 'Seti': 'P7', 'Karnali': 'P6', 'Bheri': 'P6', 'Rapti': 'P5', 'Lumbini': 'P5',
        'Dhawalagiri': 'P4', 'Gandaki': 'P4', 'Bagmati': 'P3', 'Narayani': 'P2', 'Janakpur': 'P2',
        'Sagarmatha': 'P1', 'Bhojpur': 'P1', 'Mechi': 'P1'},
    'LY': {'Ajdabiya': 'WA', "Tajura' wa an Nawahi al Arba": 'TB', 'Ghadamis': 'NL', 'Mizdah': 'JG'},  # distritos de 2007
    'MK': {'Mavrovo and Rostusa': '607', 'Debarca': '304', 'Oslomej': '307', 'Zajas': '307', 'Drugovo': '307',
           'Vraneštica': '307'},  # 3 dígitos desde 2020; os 4 do oeste foram fundidos em Kičevo (2013)
    'BA': {n: 'SRP' for n in ('Banja Luka', 'Doboj', 'Bijeljina', 'Vlasenica', 'Sarajevo-romanija', 'Foča', 'Trebinje')}
          | {'Posavina': 'BIH'},  # regiões da República Sérvia; o cantão de Posavina é da Federação
    'OM': {'Ash Sharqiyah South': 'SJ', 'Ash Sharqiyah North': 'SS', 'Al Batnah North': 'BS', 'Al Batnah South': 'BJ'},
    'MU': {'Beau Bassin-Rose Hill': 'PW', 'Quatre Bornes': 'PW', 'Vacoas-Phoenix': 'PW', 'Curepipe': 'PW',
           'Port Louis city': 'PL', 'Port Louis': 'PL'},  # cidades dentro do distrito de Plaines Wilhems
    'MD': {'Camenca': 'SN', 'Grigoriopol': 'SN'},  # Transnístria
    'LC': {'Praslin': '08', 'Dauphin': '06'},  # bairros extintos: Praslin → Micoud, Dauphin → Gros Islet
    'GH': {'Brong Ahafo': 'BO'}, 'NA': {'Kavango': 'KE'}, 'MR': {'Nouakchott': '14'}, 'TD': {'Ennedi': 'EE'},
    'TJ': {'Tadzhikistan Territories': 'RA'}, 'PK': {'F.A.T.A.': 'KP'}, 'IS': {'Reykjavík': '1'},
    'BH': {'Al Wusţá': '14'}, 'GL': {'Qaasuitsup Kommunia': 'AV'}, 'ST': {'São Tomé': '01'},
    'LA': {'Vientiane [prefecture]': 'VT', 'Vientiane': 'VI'}, 'LU': {'Diekirch': 'DI', 'Grevenmacher': 'GR', 'Luxembourg': 'LU'},
    'MC': {'Monaco': 'MO'}, 'TV': {'Tuvalu': 'FUN'},
    'KE': {  # 8 províncias anteriores a 2013 (os 47 condados entram como alternativos em EXTRA_ALIASES)
        'Central': '36', 'Coast': '28', 'Eastern': '22', 'North-Eastern': '07', 'Nyanza': '17',
        'Rift Valley': '31', 'Western': '11'},
    'PS': {'West Bank': 'RBH'},  # Cisjordânia e Gaza: um polígono cada no Natural Earth
}

# Códigos que valem para uma região além do principal: código antigo (Córsega) ou subdivisão criada DEPOIS do
# Natural Earth, dentro do polígono desenhado (a visita do estado novo pinta o estado de onde ele saiu).
EXTRA_ALIASES = {
    'FR-20R': {'COR'},  # Córsega: coletividade 20R (ISO desde 2018); antes, região COR
    'KZ-63': {'10'}, 'KZ-19': {'33'}, 'KZ-35': {'62'}, 'KZ-61': {'79'},  # Abai, Jetisu, Ulitau (2022); Shymkent
    'CD-EQ': {'MO', 'NU', 'SU', 'TU'}, 'CD-KL': {'KG', 'MN'}, 'CD-TO': {'BU', 'HU', 'IT'},
    'CD-HK': {'HL', 'LU', 'TA'}, 'CD-KC': {'KS'}, 'CD-KE': {'LO', 'SA'},
    'CI-LG': {'AB'}, 'CI-LC': {'YM'},  # distritos autônomos de Abidjan e Yamoussoukro
    'GH-BO': {'BE', 'AF'}, 'GH-TV': {'OT'}, 'GH-WP': {'WN'}, 'GH-NP': {'SV', 'NE'},  # regiões de 2019
    'NA-KE': {'KW'}, 'MR-14': {'13', '15'}, 'TD-EE': {'EO'}, 'MD-SN': {'DU'}, 'LC-01': {'12'}, 'GL-AV': {'QT'},
    'ST-01': {'02', '03', '04', '05', '06'}, 'LA-VI': {'XS'}, 'LB-AS': {'AK'}, 'LB-BA': {'BH'},
    'LU-DI': {'CL', 'RD', 'VD', 'WI'}, 'LU-GR': {'EC', 'RM'}, 'LU-LU': {'CA', 'ES', 'ME'},  # 3 distritos → 12 cantões
    'MC-MO': {'CL', 'CO', 'FO', 'GA', 'JE', 'LA', 'MA', 'MC', 'MG', 'MU', 'PH', 'SD', 'SO', 'SP', 'SR', 'VR'},
    'TV-FUN': {'NIT', 'NKF', 'NKL', 'NMA', 'NMG', 'NUI', 'VAI'}, 'KI-G': {'L'},
    'SO-WO': {'AW', 'TO', 'SA', 'SO'},  # Somalilândia (um polígono só no Natural Earth)
    'DZ-01': {'49', '50'}, 'DZ-07': {'51'}, 'DZ-08': {'52'}, 'DZ-11': {'53', '54'}, 'DZ-30': {'55'},
    'DZ-33': {'56'}, 'DZ-39': {'57'}, 'DZ-47': {'58'},  # 10 wilayas de 2019
    'SI-028': {'196'}, 'SI-054': {'197'}, 'SI-113': {'198', '200'}, 'SI-130': {'199', '211', '212'},
    'SI-084': {'201'}, 'SI-087': {'202', '205'}, 'SI-085': {'203', '206'}, 'SI-058': {'204', '210'},
    'SI-003': {'207'}, 'SI-140': {'208'}, 'SI-079': {'209'}, 'SI-050': {'213'}, 'SI-080': {'010'}, 'SI-048': {'088'},
    'ME-13': {'22'}, 'ME-03': {'23'}, 'ME-16': {'24', '25'}, 'ML-7': {'9'}, 'ML-6': {'10'},
    'AF-URU': {'DAY'}, 'AF-PAR': {'PAN'}, 'SD-DW': {'DC'}, 'SD-KS': {'GK'}, 'PG-SHM': {'HLA'}, 'PG-WHM': {'JWK'},
    'BD-C': {'H'}, 'BI-BR': {'RM'}, 'BS-NO': {'GC'}, 'ET-SN': {'SW', 'SI'}, 'KG-O': {'GO'}, 'KH-3': {'25'},
    'KP-02': {'14'}, 'KP-06': {'15'}, 'MM-04': {'18'}, 'MZ-L': {'MPM'}, 'PA-8': {'10'}, 'PA-1': {'NT'},
    'KE-36': {'13', '15', '29', '35'}, 'KE-28': {'14', '19', '21', '39', '40'},  # Central (Nyeri), Coast (Mombasa)
    'KE-22': {'06', '09', '18', '23', '25', '26', '41'}, 'KE-07': {'24', '46'},  # Eastern (Machakos), North-Eastern
    'KE-17': {'08', '16', '27', '34', '38'}, 'KE-11': {'03', '04', '45'},  # Nyanza (Kisumu), Western (Kakamega)
    'KE-31': {'01', '02', '05', '10', '12', '20', '32', '33', '37', '42', '43', '44', '47'},  # Rift Valley (Nakuru)
    'PS-RBH': {'BTH', 'HBN', 'JEM', 'JEN', 'JRH', 'NBS', 'QQA', 'SLT', 'TBS', 'TKM'}, 'PS-GZA': {'DEB', 'KYS', 'NGZ', 'RFH'},
    'BS-CO': {'HT'}, 'BW-NW': {'CH'}, 'MV-26': {'MLE'},
    'QA-RA': {'SH'}, 'SL-N': {'NW'}, 'TH-20': {'S'}, 'TM-A': {'S'}, 'TZ-14': {'31'}, 'YE-HD': {'SU'}, 'TN-11': {'12'},
}

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
    if cc in BY_NAME:
        t = BY_NAME[cc].get('%s|%s' % (p.get('name'), p.get('type_en'))) or BY_NAME[cc].get(p.get('name'))
        if t:
            return cc + '-' + t
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
    # só nomes da PRÓPRIA divisão: o campo 'region' (região histórica/estatística) casava "Riga" e juntava
    # municípios do interior da Letônia à capital
    for k in ('name', 'name_en', 'woe_name', 'gn_name', 'name_alt'):
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
    if p.get('admin') == 'Somaliland':  # sem país no Natural Earth (iso_a2 -99); a Cloudflare informa Somália
        cc = 'SO'
        p = dict(p, name=p.get('name') or 'Somaliland')
        NE_FIX[p.get('adm1_code')] = 'SO-WO'
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
            drawn = {c.split("-", 1)[1] for c in groups[cc] if not c.startswith('?')}
            # alias do próprio Natural Earth (código antigo) só se não for código atual de outra região;
            # EXTRA_ALIASES (subdivisão criada depois, dentro deste polígono) só não pode ser estado desenhado
            extra = sorted(({a for a in aliases[cc][code] if a not in taken - {mine}}
                            | {a for a in EXTRA_ALIASES.get(code, set()) if a not in drawn}) - {mine})
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
