// ============================================================
//  SW-LISTA – az offline mód fájllistája (web/sw-files.json) + a gyorsítótár verziója
//
//  node tools/sw-lista.js          → újraírja a web/sw-files.json-t és a web/sw.js VERSION sorát
//  node tools/sw-lista.js --check  → csak ellenőriz: 1-es kóddal kilép, ha a lista vagy a verzió elavult (CI)
//
//  Mi kerül a listába: minden fájl a web/ alatt, amire a játéknak szüksége lehet (html, js, css, json, képek,
//  betűk, 3D modellek). Kimarad: rejtett fájlok (.DS_Store, .gitkeep), maga a sw.js és sw-files.json,
//  a fejlesztői arculat.html és a csak megosztáshoz használt og-kep.png.
//  Verzió: az összes listázott fájl (+ a sw.js) tartalmának hash-éből – bármely fájl változik → új verzió,
//  a böngésző új service workert telepít, és csak a ténylegesen változott fájlokat tölti le újra.
// ============================================================
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const WEB = path.join(__dirname, '..', 'web');
const OUT = path.join(WEB, 'sw-files.json'), SW = path.join(WEB, 'sw.js');
const EXT = new Set(['.html', '.js', '.css', '.json', '.webp', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.woff2', '.woff', '.glb', '.mp3', '.ogg', '.wav', '.ico', '.txt']);
const SKIP = new Set(['sw.js', 'sw-files.json', 'arculat.html', 'assets/brand/og-kep.png',
  'kit.html', 'keret.html', 'modellek.html', 'vilag.html', 'mechanikak.html', 'hatterek.html', 'kit-tartalom.json']);   // a kit fejlesztői kalauz-oldalai (nem kell offline)
const VERSION_RE = /^const VERSION = '[^']*';.*$/m;

function walk(dir, rel = ''){
  let out = [];
  for(const name of fs.readdirSync(dir).sort()){
    if(name.startsWith('.')) continue;                                   // .DS_Store, .gitkeep, rejtett mappák
    const abs = path.join(dir, name), r = rel ? rel + '/' + name : name;
    if(fs.statSync(abs).isDirectory()) out = out.concat(walk(abs, r));
    else if(EXT.has(path.extname(name).toLowerCase()) && !SKIP.has(r)) out.push(r);
  }
  return out;
}
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');

function build(){
  const files = {}, all = crypto.createHash('sha256');
  for(const f of walk(WEB)){ const h = sha(fs.readFileSync(path.join(WEB, f))).slice(0, 12); files[f] = h; all.update(f + ':' + h + '\n'); }
  // a sw.js saját logikája is része a verziónak (a VERSION sort kivéve, különben önmagára hivatkozna)
  all.update(fs.readFileSync(SW, 'utf8').replace(VERSION_RE, ''));
  const version = all.digest('hex').slice(0, 12);
  return { version, count: Object.keys(files).length, files };
}

const data = build();
const json = JSON.stringify(data, null, 1) + '\n';
const swSrc = fs.readFileSync(SW, 'utf8');
if(!VERSION_RE.test(swSrc)){ console.error('HIBA: a web/sw.js-ben nincs „const VERSION = \'…\';” sor.'); process.exit(1); }
const swNew = swSrc.replace(VERSION_RE, m => m.replace(/'[^']*'/, `'${data.version}'`));

if(process.argv.includes('--check')){
  const okList = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === json, okSw = swSrc === swNew;
  if(okList && okSw){ console.log(`sw-lista: naprakész (${data.count} fájl, verzió ${data.version})`); process.exit(0); }
  console.error('sw-lista: ELAVULT – ' + [!okList && 'web/sw-files.json', !okSw && 'web/sw.js VERSION'].filter(Boolean).join(' + ') +
    '\n  Javítás: node tools/sw-lista.js, majd commitold a két fájlt.');
  process.exit(1);
}
fs.writeFileSync(OUT, json); fs.writeFileSync(SW, swNew);
const kb = Object.keys(data.files).reduce((s, f) => s + fs.statSync(path.join(WEB, f)).size, 0) / 1024;
console.log(`sw-lista: ${data.count} fájl (${(kb / 1024).toFixed(2)} MB), verzió ${data.version} → web/sw-files.json + web/sw.js`);
