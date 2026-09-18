#!/usr/bin/env python3
# ============================================================
#  Kész matrica-képek beemelése a kódrajzok helyére — python3 tools/art-import.py <png-mappa> [--dry]
#                                         visszaállítás kódrajzra: python3 tools/art-import.py --remove <név> [<név> …]
#
#  1. A mappában minden <matrica-név>.png-t (docs/illusztracio-promptok.csv „Fájlnév” oszlopa) 512×512-re igazít
#     (arányosan, középre, átlátszó háttérrel), és WebP-be tömörít: web/assets/art/<név>.webp
#  2. Minőség-ellenőrzés (figyelmeztet, nem tilt – kivéve --szigoru): átlátszó háttér, egy darabban van, középen van,
#     kitölti a képet, van fehér perem (bal-fent) és tömör olíva árnyék (jobbra-le) – a küszöbök a beeco eredeti
#     matricáin (web/assets/items) mérve. Csak ellenőrzés, importálás nélkül: --dry
#  3. Beírja a web/data/art-override.json-ba → onnantól a játékok ezt a képet mutatják (a kód nem változik).
#  Ellenőrzés utána: node tests/check-art.js · útmutató: docs/promptolas.md
#  Kell hozzá: Pillow és numpy (pip3 install Pillow numpy)
# ============================================================
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web'
OUT_DIR = WEB / 'assets' / 'art'
OVERRIDE = WEB / 'data' / 'art-override.json'
SIZE = 512


def sticker_names():
    # a matricák listáját maga a készlet adja (Node), hogy ne legyen két lista
    js = ("global.ART=require('./web/js/art/art.js');const fs=require('fs');"
          "fs.readdirSync('web/js/art').filter(f=>/^art-.+\\.js$/.test(f)).forEach(f=>require('./web/js/art/'+f));"
          "console.log(JSON.stringify(ART.names()))")
    return set(json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT)))


def quality(im):
    """Figyelmeztetések listája egy matrica-képre (üres lista = rendben)."""
    import numpy as np
    from PIL import Image
    a = np.array(im.convert('RGBA').resize((256, 256), Image.LANCZOS)).astype(int)
    A = a[..., 3] > 200; H, W = A.shape; warn = []
    if a[..., 3].min() == 255:
        return ['nincs átlátszó háttér – kérj „transparent background” képet, vagy vágd ki a hátteret']
    ys, xs = np.nonzero(A)
    if len(xs) == 0:
        return ['üres kép']
    fill = max(xs.max() - xs.min() + 1, ys.max() - ys.min() + 1) / W
    off = max(abs((xs.min() + xs.max()) / 2 / W - .5), abs((ys.min() + ys.max()) / 2 / H - .5))
    if fill < .75: warn.append(f'a tárgy kicsi (a kép {fill:.0%}-át tölti ki, a beeco-matricák 80–96%-át)')
    if off > .08: warn.append('nincs középen')
    # peremgyűrűk: a sziluett szélétől befelé (256 px-en 1 px ≈ 0,4%) – a fehér perem ~3%, kívül gyakran vékony olíva szegéllyel
    def erode(M):
        return M & np.roll(M, 1, 0) & np.roll(M, -1, 0) & np.roll(M, 1, 1) & np.roll(M, -1, 1)
    inner = A.copy(); rings = []
    for _ in range(9):
        nxt = erode(inner); rings.append(inner & ~nxt); inner = nxt
    outer, band = rings[0] | rings[1] | rings[2], rings[1] | rings[2] | rings[3] | rings[4] | rings[5] | rings[6] | rings[7] | rings[8]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    light = np.minimum(np.minimum(r, g), b) > 205                                  # fehér / nagyon világos krém
    olive = (g >= r - 8) & (g > b + 10) & (np.maximum(np.maximum(r, g), b) < 200) & (np.minimum(np.minimum(r, g), b) > 30)
    yy, xx = np.mgrid[0:H, 0:W]; tl = (xx + yy) < (xs.min() + xs.max() + ys.min() + ys.max()) / 2
    if (band & tl & light).sum() < .35 * max(1, (band & tl).sum()): warn.append('nincs (vagy vékony) fehér kivágott perem')
    if (outer & ~tl & olive).sum() < .25 * max(1, (outer & ~tl).sum()): warn.append('nincs tömör olívazöld árnyék jobbra-le')
    # egy darabban van-e (a legalább 1%-os átlátszatlan foltok száma, 64×64-en)
    small = np.array(Image.fromarray((A * 255).astype('uint8')).resize((64, 64))) > 127
    seen = np.zeros_like(small); parts = 0
    for y0, x0 in zip(*np.nonzero(small)):
        if seen[y0, x0]: continue
        stack = [(y0, x0)]; seen[y0, x0] = True; n = 0
        while stack:
            y, x = stack.pop(); n += 1
            for v, u in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= v < 64 and 0 <= u < 64 and small[v, u] and not seen[v, u]: seen[v, u] = True; stack.append((v, u))
        if n >= 40: parts += 1
    if parts > 1: warn.append(f'{parts} külön darabból áll (több tárgy vagy szétesett matrica?)')
    return warn


def load_override():
    return json.loads(OVERRIDE.read_text(encoding='utf-8')) if OVERRIDE.exists() else {}


def save_override(data):
    meta = {k: v for k, v in data.items() if k.startswith('_')}
    items = {k: data[k] for k in sorted(k for k in data if not k.startswith('_'))}
    OVERRIDE.write_text(json.dumps({**meta, **items}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print('Használat: python3 tools/art-import.py <png-mappa> [--dry] [--szigoru]  ·  python3 tools/art-import.py --remove <név> …'); return 0
    data = load_override()
    if argv[0] == '--remove':
        for name in argv[1:]:
            if data.pop(name, None):
                (OUT_DIR / f'{name}.webp').unlink(missing_ok=True)
                print(f'↩ {name}: vissza a kódrajzra')
            else:
                print(f'– {name}: nem volt lecserélve')
        save_override(data); return 0

    from PIL import Image
    src, dry, strict = Path(argv[0]), '--dry' in argv, '--szigoru' in argv
    if not src.is_dir():
        print(f'Nincs ilyen mappa: {src}'); return 1
    names, done, skipped = sticker_names(), 0, []
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for png in sorted(src.glob('*.png')):
        name = png.stem
        if name not in names:
            skipped.append(png.name); continue
        im = Image.open(png).convert('RGBA')
        warn = quality(im)
        for w in warn: print(f'⚠ {png.name}: {w}')
        if strict and warn:
            skipped.append(png.name + ' (minőség)'); continue
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
        dest = OUT_DIR / f'{name}.webp'
        if not dry:
            canvas.save(dest, 'WEBP', quality=82, method=6)
            data[name] = f'assets/art/{name}.webp'
        kb = dest.stat().st_size / 1024 if dest.exists() else 0
        print(f'{"✓" if not warn else "~"} {name}' + ('' if dry else f' → web/assets/art/{name}.webp ({kb:.0f} KB)'))
        done += 1
    if not dry:
        save_override(data)
    if skipped:
        print(f'\nKihagyva (nincs ilyen nevű matrica – nézd meg a „Fájlnév” oszlopot): {", ".join(skipped)}')
    print(f'\n{done} kép {"ellenőrizve" if dry else "beemelve"}. Utána: node tests/check-art.js')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
