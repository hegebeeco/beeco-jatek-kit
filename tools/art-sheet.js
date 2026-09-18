// ============================================================
//  Matrica-ív: az illusztrációk egy képen, ellenőrzéshez (fejlesztői eszköz, nem kerül ki a webre)
//  node tools/art-sheet.js [kimenet.png] [könyvtár-szűrő, pl. food]   →  SVG + PNG (macOS Quick Look rendereli)
// ============================================================
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), ART_DIR = path.join(ROOT, 'web/js/art');
global.window = undefined;
const ART = require(path.join(ART_DIR, 'art.js'));
global.ART = ART;
const filter = process.argv[3] || '';
for(const f of fs.readdirSync(ART_DIR).filter(f => /^art-.+\.js$/.test(f) && f.includes(filter)).sort()){
  const before = new Set(ART.names());
  require(path.join(ART_DIR, f));
  ART.names().filter(n => !before.has(n)).forEach(n => ART.LIB[n]._lib = f.replace(/^art-|\.js$/g, ''));
}
const names = ART.names().filter(n => !filter || (ART.LIB[n]._lib || '').includes(filter));
const cell = 150, cols = 10, rows = Math.ceil(names.length / cols) || 1, W = cols * cell, H = rows * (cell + 26);
// a Quick Look 2× felbontással renderel → fele akkora méret, teljes viewBox
let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W / 2}" height="${H / 2}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#FFF8E7"/>`;
names.forEach((n, i) => {
  const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 26);
  const inner = ART.svg(n, { size:cell - 16 }).replace('<svg ', `<svg x="${x + 8}" y="${y + 6}" `);
  const A = ART.LIB[n];
  out += inner + `<text x="${x + cell / 2}" y="${y + cell + 12}" font-family="Helvetica, Arial" font-size="12" text-anchor="middle" fill="#2F371E">${n} ${(A.emoji || []).join('')}</text>`;
});
out += '</svg>';
const png = process.argv[2] || path.join(ROOT, 'tools/art-sheet.png'), svgPath = png.replace(/\.png$/, '.svg');
fs.writeFileSync(svgPath, out);
try{ execSync(`qlmanage -t -s ${Math.max(W, H)} -o "${path.dirname(png)}" "${svgPath}" >/dev/null 2>&1`); fs.renameSync(svgPath + '.png', png);
  // a Quick Look négyzetes képet ad → levágjuk a tényleges ív méretére
  execSync(`python3 -c "from PIL import Image; im=Image.open('${png}'); im.crop((0,0,${W},${H})).save('${png}')"`);
}catch(e){ console.log('PNG nem készült (Quick Look):', e.message); }
console.log(`${names.length} matrica → ${png}`);
