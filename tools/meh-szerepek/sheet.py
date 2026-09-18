# Összehasonlító ív: python3 tools/meh-szerepek/sheet.py <kimenet.png>
# Felül 300 px-en (új 5 + 2 meglévő), alul 64 px-es hatszögben (ahogy a menükártyán látszik).
import sys, math
from PIL import Image, ImageDraw
R = 'web/assets/brand/roles/'
names = ['polgarmester', 'elo-kert', 'etelmento', 'beporzo', 'korforgo', 'huto', 'szelektalj']
W = 220; sheet = Image.new('RGBA', (W * len(names), W + 110), (255, 248, 231, 255))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    im = Image.open(R + n + '.webp').convert('RGBA'); im.thumbnail((W - 10, W - 10))
    sheet.alpha_composite(im, (i * W + (W - im.width) // 2, 5))
    cx, cy, r = i * W + W // 2, W + 50, 40
    hexp = [(cx + r * math.cos(math.radians(60 * k + 30)), cy + r * math.sin(math.radians(60 * k + 30))) for k in range(6)]
    d.polygon(hexp, fill=(211, 221, 187, 255), outline=(47, 55, 30, 255), width=3)
    s = im.copy(); s.thumbnail((64, 64)); sheet.alpha_composite(s, (cx - s.width // 2, cy - s.height // 2))
    d.text((i * W + 8, W + 96), n, fill=(47, 55, 30, 255))
sheet.save(sys.argv[1])
