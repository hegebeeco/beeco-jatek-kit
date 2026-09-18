// ============================================================
//  Matricák PNG-be (átlátszó háttérrel) — referenciaképek a kép- és 3D-generátorokhoz
//
//  node tools/art-png.js <kimeneti-mappa> [szűrő] [--flat] [--size 512] [--names a,b,c]
//    szűrő      : könyvtár-név részlete, mint a matrica-ívnél (pl. devices, waste)
//    --flat     : perem és árnyék NÉLKÜL – „vázlat” a 3D-generátornak (a fehér peremet különben testként modellezné)
//    --size     : képméret (alap 512)
//    --names    : csak ezek a matricák (vesszővel)
//  Egy fej nélküli Chrome egyszerre 64 matricát rajzol ki (8×8-as rács), a Pillow vágja fájlokra: <név>.png
// ============================================================
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const { shot } = require('./headless');
const ROOT = path.join(__dirname, '..'), ART_DIR = path.join(ROOT, 'web/js/art');

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const outDir = args[0];
if(!outDir || outDir.startsWith('--')){ console.log('Használat: node tools/art-png.js <kimeneti-mappa> [szűrő] [--flat] [--size 512] [--names a,b,c]'); process.exit(1); }
const filter = args[1] && !args[1].startsWith('--') ? args[1] : '';
const flat = args.includes('--flat'), size = +opt('--size', 512), only = opt('--names', '');

const ART = require(path.join(ART_DIR, 'art.js'));
global.ART = ART;
const libOf = {};
for(const f of fs.readdirSync(ART_DIR).filter(f => /^art-.+\.js$/.test(f)).sort()){
  const before = new Set(ART.names());
  require(path.join(ART_DIR, f));
  for(const n of ART.names()) if(!before.has(n)) libOf[n] = f.replace(/^art-|\.js$/g, '');
}
let names = ART.names().filter(n => (libOf[n] || '').includes(filter));
if(only) names = only.split(',').map(s => s.trim()).filter(n => { if(!ART.LIB[n]) console.log('⚠ nincs ilyen matrica:', n); return !!ART.LIB[n]; });
if(!names.length){ console.log('Nincs matrica a szűrőre.'); process.exit(1); }

fs.mkdirSync(outDir, { recursive:true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'beeco-art-png-'));
const COLS = 8, PER = COLS * COLS;
for(let p = 0; p * PER < names.length; p++){
  const part = names.slice(p * PER, (p + 1) * PER), rows = Math.ceil(part.length / COLS);
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}
    .g{display:grid;grid-template-columns:repeat(${COLS},${size}px);grid-auto-rows:${size}px}.g svg{display:block}</style>
    <div class="g">${part.map(n => ART.svg(n, { size, flat })).join('')}</div>`;
  const htmlFile = path.join(tmp, `lap${p}.html`), png = path.join(tmp, `lap${p}.png`);
  fs.writeFileSync(htmlFile, html);
  shot(htmlFile, png, COLS * size, rows * size, true);
  // a lap feldarabolása matricánként
  execFileSync('python3', ['-c', `
import json, sys
from PIL import Image
names = json.loads(sys.argv[1]); im = Image.open(sys.argv[2]).convert('RGBA'); S = ${size}
for i, n in enumerate(names):
    x, y = (i % ${COLS}) * S, (i // ${COLS}) * S
    im.crop((x, y, x + S, y + S)).save(sys.argv[3] + '/' + n + '.png', optimize=True)
`, JSON.stringify(part), png, path.resolve(outDir)], { stdio:'inherit' });
}
fs.rmSync(tmp, { recursive:true, force:true });
console.log(`${names.length} PNG (${size} px${flat ? ', perem és árnyék nélkül' : ''}) → ${outDir}`);
