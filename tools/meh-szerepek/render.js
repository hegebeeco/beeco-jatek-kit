// Szerepes méhecskék renderelése: node tools/meh-szerepek/render.js [név…]
// HTML → átlátszó PNG (fej nélküli Chrome) → 300×300 WebP a web/assets/brand/roles/ mappába (Pillow, q90, alfa megmarad).
const path = require('path'), fs = require('fs'), os = require('os'), { execFileSync } = require('child_process');
const { shot } = require('../headless.js');
const dir = __dirname, out = path.join(dir, '../../web/assets/brand/roles');
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['polgarmester', 'elo-kert', 'etelmento', 'beporzo', 'korforgo'];
const EXISTING = ['greenwash', 'huto', 'impact', 'jovo', 'kacsint', 'rezsi', 'szelektalj'];
for(const n of names){
  if(EXISTING.includes(n)){ console.log('kihagyva (meglévő, nem írjuk felül):', n); continue; }
  const png = path.join(os.tmpdir(), `meh-${n}.png`);
  shot(path.join(dir, n + '.html'), png, 300, 300, true);
  execFileSync('python3', ['-c', `from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert('RGBA')
im.save(${JSON.stringify(path.join(out, n + '.webp'))}, 'WEBP', quality=90, method=6)`]);
  console.log('kész:', path.relative(process.cwd(), path.join(out, n + '.webp')), fs.statSync(path.join(out, n + '.webp')).size, 'bájt');
}
