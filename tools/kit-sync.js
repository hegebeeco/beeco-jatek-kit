// ============================================================
//  KIT-SYNC — a beeco-jatek-kit közös fájljainak szinkronizálása egy játék-projekttel
//
//  node tools/kit-sync.js <projekt-mappa>            → a kit → projekt: a KIT-FILES.json „sync” fájljait átmásolja
//  node tools/kit-sync.js <projekt-mappa> --check    → csak megmutatja az eltéréseket (1-es kilépési kód, ha van)
//  node tools/kit-sync.js <projekt-mappa> --vissza   → projekt → kit: ha egy játékban fejlesztettük a design systemet
//                                                      (pl. új piktogram, új matrica), itt kerül vissza a kitbe
//  Szabály: a projektben lévő, a kitben nem szereplő fájlokat SOHA nem törli; felülírás előtt kiírja, mi változik.
//  Kit-verzió: a kit → projekt frissítés után a projekt gyökerébe kerül a KIT-VERZIO fájl (a kit VERSION-je, git-commitja,
//  dátuma); a --check kiírja, melyik kit-verzión van a projekt, és melyik a mostani. Változások: CHANGELOG.md a kitben.
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
// --- Kit-verzió (VERSION + git commit) és a projekt KIT-VERZIO fájlja ---
const git = a => { try{ return require('child_process').execFileSync('git', ['-C', KIT, ...a], { encoding:'utf8', stdio:['ignore', 'pipe', 'ignore'] }).trim(); }catch(e){ return ''; } };
const kitVer = { verzio: fs.existsSync(path.join(KIT, 'VERSION')) ? fs.readFileSync(path.join(KIT, 'VERSION'), 'utf8').trim() : '0.0.0',
  commit: git(['rev-parse', '--short', 'HEAD']) || null };
const KV_FILE = path.join(PROJ, 'KIT-VERZIO');
const projVer = (() => { try{ return JSON.parse(fs.readFileSync(KV_FILE, 'utf8')); }catch(e){ return null; } })();
const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for(let i = 0; i < 3; i++) if((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
const verLabel = v => v.verzio + (v.commit ? ` (${v.commit})` : '');
function versionLine(){
  if(!projVer) return `Kit-verzió: a projektben nincs KIT-VERZIO (még nem frissült verziókövetéssel) – a kit ${verLabel(kitVer)}. Frissítés: node tools/kit-sync.js ${target}`;
  const c = cmpVer(projVer.verzio, kitVer.verzio);
  if(c < 0) return `Kit-verzió: a projekt a ${projVer.verzio} verzión van${projVer.commit ? ` (${projVer.commit})` : ''}, a kit ${verLabel(kitVer)} – frissíts: node tools/kit-sync.js ${target} (változások: CHANGELOG.md a kitben)`;
  if(c > 0) return `Kit-verzió: a projekt ${verLabel(projVer)} ÚJABB, mint ez a kit (${verLabel(kitVer)}) – a kitben: git pull`;
  if(projVer.commit && kitVer.commit && projVer.commit !== kitVer.commit) return `Kit-verzió: ${projVer.verzio} mindkettő, de a kit azóta változott (projekt: ${projVer.commit}, kit: ${kitVer.commit})`;
  return `Kit-verzió: ${verLabel(kitVer)} – a projekt naprakész`;
}
function writeVersion(){                                           // csak akkor írja, ha más (ne legyen fölösleges git-diff)
  const kv = { verzio: kitVer.verzio, commit: kitVer.commit, datum: new Date().toISOString().slice(0, 10) };
  if(git(['status', '--porcelain'])) kv.kitNemCommitolt = true;   // a kit nem commitolt változásai is átmentek
  if(projVer && projVer.verzio === kv.verzio && projVer.commit === kv.commit && !!projVer.kitNemCommitolt === !!kv.kitNemCommitolt) return;
  fs.writeFileSync(KV_FILE, JSON.stringify(kv, null, 1) + '\n');
  console.log(`KIT-VERZIO: ${verLabel(kv)}${kv.kitNemCommitolt ? ' + nem commitolt kit-változások' : ''}`);
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
const syncMode = mode !== '--check' && mode !== '--vissza';
if(!changes.length){ console.log(`✓ ${dir}: minden közös fájl egyforma (${files().length} fájl)`);
  if(mode === '--check') console.log(versionLine()); else if(syncMode) writeVersion(); process.exit(0); }
console.log(`${mode === '--check' ? 'Eltérés' : 'Frissítve'} (${dir}): ${changes.length} fájl`);
for(const [f, k] of changes) console.log(`  ${k === 'új' ? '+' : '~'} ${f}`);
if(mode === '--check'){ console.log(versionLine()); console.log('Frissítés: node tools/kit-sync.js ' + target + '   ·   vissza a kitbe: --vissza'); process.exit(1); }
if(mode === '--vissza') console.log('Ne felejtsd el a kitben commitolni és pusholni (git -C ' + KIT + ' …), majd a többi projektet is frissíteni.');
else { writeVersion(); console.log('A projektben: node tools/sw-lista.js (offline fájllista), majd a tesztek és a smoke-teszt.'); }
