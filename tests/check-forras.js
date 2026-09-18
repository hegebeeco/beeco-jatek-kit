// ============================================================
//  Forrás-ellenőrzés — node tests/check-forras.js
//  Anti-hallucinációs szabály: a tartalomban szám (számjegy, %) csak forrással állhat, a forrás a web/data/forrasok.json
//  jegyzékben szerepel (vagy http(s) link), a jegyzék rendben van. A logika a tools/forras.js-ben (a kitből jön);
//  beállítás: tartalom.config.json → „forras”. Szabály: docs/forrasok.md
// ============================================================
const fs = require('fs'), path = require('path');
let root = path.join(__dirname, '..');
// A kitben futtatva a sablont nézi (a kitnek magának nincs tartalma)
if(!fs.existsSync(path.join(root, 'tartalom.config.json')) && fs.existsSync(path.join(root, 'sablon', 'tartalom.config.json'))) root = path.join(root, 'sablon');
const tool = [path.join(__dirname, '..', 'tools', 'forras.js')].find(f => fs.existsSync(f));
if(!tool){ console.log('❌ hiányzik a tools/forras.js – frissítsd a projektet a kitből: node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .'); process.exit(1); }
const r = require(tool).report(root);
process.exit(r.errors.length ? 1 : 0);
