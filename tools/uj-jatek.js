// ============================================================
//  ÚJ JÁTÉK — új beeco játék-projekt létrehozása a kit sablonjából
//
//  node ~/CLAUDE/beeco-jatek-kit/tools/uj-jatek.js <célmappa> "<Játék neve>" ["egy mondatos leírás"]
//  pl.: node ~/CLAUDE/beeco-jatek-kit/tools/uj-jatek.js ~/CLAUDE/beeco-polgarmester "Polgármester egy napra" "Gyors városi döntések…"
//
//  Mit csinál: 1) átmásolja a sablont (sablon/) a névvel és leírással kitöltve; 2) átmásolja a kit közös fájljait
//  (KIT-FILES.json „sync” + „sablon”); 3) elkészíti az offline fájllistát; 4) git init + első commit.
//  GitHub-tárolót NEM hoz létre – azt kérd a Claude Code-tól (gh repo create … --private), vagy a GitHub felületén.
// ============================================================
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const KIT = path.join(__dirname, '..');
const [dest, name, desc] = process.argv.slice(2);
if(!dest || !name){ console.log('Használat: node tools/uj-jatek.js <célmappa> "<Játék neve>" ["leírás"]'); process.exit(1); }
const DEST = path.resolve(dest.replace(/^~/, process.env.HOME));
if(fs.existsSync(DEST) && fs.readdirSync(DEST).length){ console.log('A célmappa már létezik és nem üres:', DEST); process.exit(1); }
const M = JSON.parse(fs.readFileSync(path.join(KIT, 'KIT-FILES.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const fill = s => s.replace(/\{\{NEV\}\}/g, name).replace(/\{\{LEIRAS\}\}/g, desc || name).replace(/\{\{DATUM\}\}/g, today);
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
try{                                                                             // 4) git
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd:DEST });
  execFileSync('git', ['add', '-A'], { cwd:DEST });
  execFileSync('git', ['commit', '-q', '-m', `${name}: új projekt a beeco-jatek-kit sablonjából\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>`], { cwd:DEST });
}catch(e){ console.log('git: ' + e.message.split('\n')[0]); }
console.log(`\n✓ Kész: ${DEST}\n  Következő: nyisd meg a mappát a Claude Code-ban (a CLAUDE.md eligazítja), és kérd meg, hogy hozza létre a GitHub-tárolót és a Netlify-oldalt.`);
