#!/usr/bin/env python3
"""Confere os 48 MP4 finais (e os 24 pôsteres) em assets/video: codec, 720x720, 30 fps constante, sem áudio, faixa de cor BT.709
limitada, timestamps (início em 0, passo 1/30 s, sem lacunas), intervalo entre keyframes, número de quadros/duração iguais nos
3 idiomas de cada vídeo e (H.264 x AV1) mesma contagem. Uso: python tools/video-i18n/verify-finals.py [--json saida.json]"""
import json, subprocess, sys, os
from fractions import Fraction

D = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'video')
NAMES = {'goias-app': 27.0, 'aprovaura': 50.0, 'la-pelve': 35.566667, 'match-queue': 47.3, 'bebometro': 35.3, 'orbijob': 43.0, 'busaogyn': 42.0, 'stockport': 43.9}
LOCALES = ['pt-BR', 'en', 'es']

def probe(path):
    j = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))
    pk = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'packet=pts_time,dts_time,flags,duration_time', '-of', 'csv=p=0', path]).decode().split('\n')
    rows = [r.split(',') for r in pk if r.strip()]
    pts = sorted(float(r[0]) for r in rows)
    keys = [i for i, r in enumerate(sorted(rows, key=lambda r: float(r[0]))) if 'K' in r[-1]]
    return j, pts, keys

def check(path, exp_dur):
    j, pts, keys = probe(path)
    v = [s for s in j['streams'] if s['codec_type'] == 'video']
    a = [s for s in j['streams'] if s['codec_type'] != 'video']
    s = v[0]; errs = []
    if a: errs.append('tem faixa de áudio/dados')
    if (s['width'], s['height']) != (720, 720): errs.append('tamanho %sx%s' % (s['width'], s['height']))
    if Fraction(s['avg_frame_rate']) != 30 or Fraction(s['r_frame_rate']) != 30: errs.append('fps %s/%s' % (s['avg_frame_rate'], s['r_frame_rate']))
    if s.get('pix_fmt') != 'yuv420p': errs.append('pix_fmt ' + str(s.get('pix_fmt')))
    if (s.get('color_range'), s.get('color_space'), s.get('color_transfer'), s.get('color_primaries')) != ('tv', 'bt709', 'bt709', 'bt709'): errs.append('cor %s/%s/%s/%s' % (s.get('color_range'), s.get('color_space'), s.get('color_transfer'), s.get('color_primaries')))
    dur = float(j['format']['duration'])
    if abs(dur - exp_dur) > 0.05: errs.append('duração %.3f (esperado %.3f)' % (dur, exp_dur))
    n = len(pts)
    if abs(pts[0]) > 1e-6: errs.append('primeiro pts %.4f' % pts[0])
    gaps = [round(b - a, 4) for a, b in zip(pts, pts[1:])]
    bad = [g for g in gaps if abs(g - 1 / 30) > 0.002]
    if bad: errs.append('%d passos de pts fora de 1/30 (ex. %s)' % (len(bad), bad[:3]))
    if abs(n - round(exp_dur * 30)) > 1: errs.append('%d quadros (esperado %d)' % (n, round(exp_dur * 30)))
    ki = [b - a for a, b in zip(keys, keys[1:])]
    if not keys or keys[0] != 0: errs.append('não começa em keyframe')
    gop = max(ki + [n - keys[-1]]) if keys else 0
    if gop > 64: errs.append('GOP máximo %d quadros' % gop)
    return dict(file=os.path.basename(path), bytes=os.path.getsize(path), codec=s['codec_name'], profile=s.get('profile'), frames=n, duration=round(dur, 3),
                keyframes=len(keys), gop_max=gop, gop_min=min(ki) if ki else None, errors=errs)

def main():
    out, bad = [], 0
    for name, dur in NAMES.items():
        per = {}
        for l in LOCALES:
            for ext in ('mp4', 'av1.mp4'):
                f = os.path.join(D, '%s-loop.%s.%s' % (name, l, ext))
                if not os.path.exists(f): out.append(dict(file=os.path.basename(f), errors=['ausente'])); bad += 1; continue
                r = check(f, dur); out.append(r); per.setdefault(ext, []).append(r)
            p = os.path.join(D, '%s-loop-poster.%s.webp' % (name, l))
            if not os.path.exists(p): out.append(dict(file=os.path.basename(p), errors=['ausente'])); bad += 1
            else: out.append(dict(file=os.path.basename(p), bytes=os.path.getsize(p), errors=[]))
        for ext, rs in per.items():
            if len({(r['frames'], r['duration']) for r in rs}) != 1: out.append(dict(file=name + ' ' + ext, errors=['quadros/duração diferem entre idiomas: %s' % [(r['frames'], r['duration']) for r in rs]]))
        if len({r['frames'] for rs in per.values() for r in rs}) != 1: out.append(dict(file=name, errors=['H.264 e AV1 com contagem de quadros diferente']))
    bad = sum(1 for r in out if r['errors'])
    for r in out:
        print(('FAIL ' if r['errors'] else 'ok   ') + r['file'], '' if 'frames' not in r else '%dB %s %dq %ss gop<=%s' % (r['bytes'], r['codec'], r['frames'], r['duration'], r['gop_max']), '; '.join(r['errors']))
    if '--json' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1, ensure_ascii=False)
    print('\n%d arquivos, %d com problema' % (len(out), bad))
    sys.exit(1 if bad else 0)

main()
