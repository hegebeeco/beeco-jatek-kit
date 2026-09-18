// ============================================================
//  Rajz-renderelő ellenőrzéshez (2D matrica és 3D modell) – a B szintű munkafolyamat része: docs/rajzolas.md
//  2D: node tools/art-render.js 2d <matrica.js> <ki.png> [név1,név2,… | --skip <könyvtár>]   – a fájl ART.add-dal definiál; 220 px + 48 px, tömör olíva árnyékkal
//  3D: node tools/art-render.js 3d <modell.glb> <ki.png> [az el dist]      – a tools/modell-nezo.html felvétele (játék-fények, cel-árnyalás)
// ============================================================
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const REPO = path.join(__dirname, '..');
const { findChrome } = require(REPO + '/tools/headless.js');
const [mode, input, out, extra, ...rest] = process.argv.slice(2);

if(mode === '2d'){
  global.ART = require(REPO + '/web/js/art/art.js');
  // --skip <könyvtár>: ezt a matrica-könyvtárat NEM töltjük be (átrajzoláskor a végleges nevek így nem ütköznek a régiekkel)
  const skipI = rest.indexOf('--skip'), skip = skipI >= 0 ? rest[skipI + 1] : (extra === '--skip' ? rest[0] : null);
  for(const f of fs.readdirSync(REPO + '/web/js/art').filter(f => /^art-.+\.js$/.test(f) && !(skip && f.startsWith(`art-${skip}`)))) require(REPO + '/web/js/art/' + f);
  const before = new Set(ART.names());
  require(path.resolve(input));
  const names = extra && extra !== '--skip' ? extra.split(',') : ART.names().filter(n => !before.has(n));
  const cell = names.map(n => `<td><div class="big">${ART.svg(n, { size:220, shadow:'hard' })}</div>
    <div class="small">${ART.svg(n, { size:48, shadow:'hard' })}${ART.svg(n, { size:32, shadow:'hard' })}</div><b>${n}</b><br><i>${ART.LIB[n].shapes.length} alakzat</i></td>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#FFF8E7;font:600 14px Helvetica;color:#2F371E}
    td{width:240px;text-align:center;vertical-align:top;padding:8px}.small{display:flex;gap:10px;justify-content:center;align-items:center;margin:4px 0 6px;height:52px}
    i{font-weight:400;font-size:12px}</style><table><tr>${cell}</tr></table>`;
  const tmp = out.replace(/\.png$/, '.html'); fs.writeFileSync(tmp, html);
  execFileSync(findChrome(), ['--headless', '--hide-scrollbars', '--allow-file-access-from-files', `--window-size=${names.length * 256},${360}`,
    '--virtual-time-budget=2000', `--screenshot=${path.resolve(out)}`, 'file://' + path.resolve(tmp)], { stdio:'pipe' });
  console.log(`2D: ${names.join(', ')} → ${out}`);
}else if(mode === '3d'){
  const [az, el, dist] = [extra || 32, rest[0] || 18, rest[1] || 3.6];
  const url = `file://${REPO}/tools/modell-nezo.html?url=file://${path.resolve(input)}&ui=0&spin=0&az=${az}&el=${el}&dist=${dist}`;
  execFileSync(findChrome(), ['--headless', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--hide-scrollbars',
    '--window-size=560,560', '--virtual-time-budget=4000', `--screenshot=${path.resolve(out)}`, url], { stdio:'pipe' });
  console.log(`3D: ${input} → ${out}`);
}else console.log('Használat: node tools/art-render.js 2d <matrica.js> <ki.png> [nevek] | 3d <modell.glb> <ki.png> [az el dist]');
