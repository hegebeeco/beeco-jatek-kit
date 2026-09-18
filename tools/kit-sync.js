// ============================================================
//  KIT-SYNC — a beeco-jatek-kit közös fájljainak szinkronizálása egy játék-projekttel
//
//  node tools/kit-sync.js <projekt-mappa>            → a kit → projekt: a KIT-FILES.json „sync” fájljait átmásolja
//  node tools/kit-sync.js <projekt-mappa> --check    → csak megmutatja az eltéréseket (1-es kilépési kód, ha van)
//  node tools/kit-sync.js <projekt-mappa> --vissza   → projekt → kit: ha egy játékban fejlesztettük a design systemet
//                                                      (pl. új piktogram, új matrica), itt kerül vissza a kitbe
//  Szabály: a projektben lévő, a kitben nem szereplő fájlokat SOHA nem törli; felülírás előtt kiírja, mi változik.
//  A „sablon” fájlok (tesztek) csak az új projekt létrehozásakor kerülnek át (tools/uj-jatek.js).
// ============================================================
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const KIT = path.join(__dirname, '..');
const [target, mode] = [process.argv[2], process.argv[3] || ''];
if(!target){ console.log('Használat: node tools/kit-sync.js <projekt-mappa> [--check | --vissza]'); process.exit(1); }
const PROJ = path.resolve(target);
if(!fs.existsSync(PROJ)){ console.log('Nincs ilyen mappa:', PROJ); process.exit(1); }
const M = JSON.parse(fs.readFileSync(path.join(KIT, 'KIT-FILES.json'), 'utf8'));

const hash = f => fs.existsSync(f) ? crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex') : null;
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes:true }).flatMap(e => e.name === '.DS_Store' ? [] :
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
// a „sync” lista kibontása relatív fájlútvonalakra (mappa = a teljes tartalma, mindkét oldalról összegyűjtve)
function files(){
  const out = new Set();
  for(const p of M.sync){
    if(p.endsWith('/')) for(const root of [KIT, PROJ]) for(const f of walk(path.join(root, p))) out.add(path.relative(root, f));
    else out.add(p);
  }
  return [...out].sort();
}
const [FROM, TO] = mode === '--vissza' ? [PROJ, KIT] : [KIT, PROJ];
const changes = [];
for(const f of files()){
  const a = path.join(FROM, f), b = path.join(TO, f), ha = hash(a), hb = hash(b);
  if(!ha || ha === hb) continue;                                    // a forrásban nincs meg, vagy egyforma
  changes.push([f, hb ? 'módosul' : 'új']);
  if(mode !== '--check'){ fs.mkdirSync(path.dirname(b), { recursive:true }); fs.copyFileSync(a, b); }
}
const dir = mode === '--vissza' ? 'projekt → kit' : 'kit → projekt';
if(!changes.length){ console.log(`✓ ${dir}: minden közös fájl egyforma (${files().length} fájl)`); process.exit(0); }
console.log(`${mode === '--check' ? 'Eltérés' : 'Frissítve'} (${dir}): ${changes.length} fájl`);
for(const [f, k] of changes) console.log(`  ${k === 'új' ? '+' : '~'} ${f}`);
if(mode === '--check'){ console.log('Frissítés: node tools/kit-sync.js ' + target + '   ·   vissza a kitbe: --vissza'); process.exit(1); }
if(mode === '--vissza') console.log('Ne felejtsd el a kitben commitolni és pusholni (git -C ' + KIT + ' …), majd a többi projektet is frissíteni.');
else console.log('A projektben: node tools/sw-lista.js (offline fájllista), majd a tesztek és a smoke-teszt.');
