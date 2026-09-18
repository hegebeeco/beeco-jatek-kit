// ============================================================
//  ÚJ JÁTÉK — új beeco játék-projekt létrehozása a kit sablonjából
//
//  node ~/CLAUDE/beeco-jatek-kit/tools/uj-jatek.js <célmappa> "<Játék neve>" ["egy mondatos leírás"] [azonosító]
//  pl.: node ~/CLAUDE/beeco-jatek-kit/tools/uj-jatek.js ~/CLAUDE/beeco-polgarmester "Polgármester egy napra" "Gyors városi döntések…"
//  Az azonosító ({{AZONOSITO}}, pl. mentési kulcsokban) alapból a célmappa nevéből készül: kisbetű, ékezet nélkül,
//  a „beeco-” előtag nélkül (~/CLAUDE/beeco-polgarmester → polgarmester); a 4. paraméterrel felülírható.
//
//  Mit csinál: 1) átmásolja a sablont (sablon/) a névvel és leírással kitöltve; 2) átmásolja a kit közös fájljait
//  (KIT-FILES.json „sync” + „sablon”); 3) elkészíti az offline fájllistát; 4) beírja a KIT-VERZIO fájlt (melyik kit-verzióból
//  indult – a kit-sync --check ezzel veti össze); 5) git init + első commit.
//  GitHub-tárolót NEM hoz létre – azt kérd a Claude Code-tól (gh repo create … --private), vagy a GitHub felületén.
// ============================================================
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const KIT = path.join(__dirname, '..');
const [dest, name, desc, idArg] = process.argv.slice(2);
if(!dest || !name){ console.log('Használat: node tools/uj-jatek.js <célmappa> "<Játék neve>" ["leírás"] [azonosító]'); process.exit(1); }
const DEST = path.resolve(dest.replace(/^~/, process.env.HOME));
// Azonosító (slug): kisbetű, ékezet nélkül, [a-z0-9] és kötőjel, „beeco-” előtag nélkül
const slug = s => String(s).toLowerCase().replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
  .replace(/[óòôöő]/g, 'o').replace(/[úùûüű]/g, 'u').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^beeco-/, '');
const ID = slug(idArg || path.basename(DEST));
if(!ID){ console.log('Nem sikerült azonosítót képezni a mappanévből – add meg 4. paraméterként (pl. polgarmester).'); process.exit(1); }
if(fs.existsSync(DEST) && fs.readdirSync(DEST).length){ console.log('A célmappa már létezik és nem üres:', DEST); process.exit(1); }
const M = JSON.parse(fs.readFileSync(path.join(KIT, 'KIT-FILES.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const fill = s => s.replace(/\{\{NEV\}\}/g, name).replace(/\{\{LEIRAS\}\}/g, desc || name).replace(/\{\{DATUM\}\}/g, today).replace(/\{\{AZONOSITO\}\}/g, ID);
const TEXT = /\.(md|html|js|css|json|toml|yml|yaml|txt|gitignore)$|^\.gitignore$/;
function copy(from, to, fillIt){
  const st = fs.statSync(from);
  if(st.isDirectory()){ for(const e of fs.readdirSync(from)) if(e !== '.DS_Store') copy(path.join(from, e), path.join(to, e), fillIt); return; }
  fs.mkdirSync(path.dirname(to), { recursive:true });
  if(fillIt && TEXT.test(path.basename(from))) fs.writeFileSync(to, fill(fs.readFileSync(from, 'utf8'))); else fs.copyFileSync(from, to);
}
copy(path.join(KIT, 'sablon'), DEST, true);                                      // 1) sablon
for(const p of M.sync.concat(M.sablon)){                                        // 2) a kit közös fájljai
  const src = path.join(KIT, p); if(fs.existsSync(src)) copy(src, path.join(DEST, p), false);
}
execFileSync('node', [path.join(DEST, 'tools/sw-lista.js')], { stdio:'inherit' });   // 3) offline fájllista
for(const f of fs.readdirSync(path.join(DEST, 'tests')).filter(f => /^check-.*\.js$/.test(f)))   // gyors önellenőrzés
  execFileSync('node', [path.join(DEST, 'tests', f)], { stdio:'inherit' });
// 4) KIT-VERZIO: melyik kit-verzióból indult a projekt (ugyanaz a formátum, mint a tools/kit-sync.js-é)
const git = a => { try{ return execFileSync('git', ['-C', KIT, ...a], { encoding:'utf8', stdio:['ignore', 'pipe', 'ignore'] }).trim(); }catch(e){ return ''; } };
const kv = { verzio: fs.existsSync(path.join(KIT, 'VERSION')) ? fs.readFileSync(path.join(KIT, 'VERSION'), 'utf8').trim() : '0.0.0',
  commit: git(['rev-parse', '--short', 'HEAD']) || null, datum: today };
if(git(['status', '--porcelain'])) kv.kitNemCommitolt = true;                   // a kit akkor nem commitolt változásokat is tartalmazott
fs.writeFileSync(path.join(DEST, 'KIT-VERZIO'), JSON.stringify(kv, null, 1) + '\n');
try{                                                                             // 5) git
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd:DEST });
  execFileSync('git', ['add', '-A'], { cwd:DEST });
  execFileSync('git', ['commit', '-q', '-m', `${name}: új projekt a beeco-jatek-kit sablonjából\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>`], { cwd:DEST });
}catch(e){ console.log('git: ' + e.message.split('\n')[0]); }
console.log(`\n✓ Kész: ${DEST} (azonosító: ${ID}, kit ${kv.verzio}${kv.commit ? ' · ' + kv.commit : ''})\n  Következő: nyisd meg a mappát a Claude Code-ban (a CLAUDE.md eligazítja), és kérd meg, hogy hozza létre a GitHub-tárolót és a Netlify-oldalt.`);
