// ============================================================
//  Tartalom-ellenőrzés — node tests/check-tartalom.js
//  A web/data/tartalom.json szerkezete: minden kártyának van szövege, két oldala, a hatások létező értékre mutatnak,
//  a matricák léteznek. A szöveg rövid (a „3 másodperces szabály”), és nincs benne forrás nélküli szám.
//  Bővítsd a saját játékod szabályaival!
// ============================================================
const fs = require('fs'), path = require('path');
const WEB = path.join(__dirname, '..', 'web');
const T = JSON.parse(fs.readFileSync(path.join(WEB, 'data/tartalom.json'), 'utf8'));
global.ART = require(path.join(WEB, 'js/art/art.js'));
for(const f of fs.readdirSync(path.join(WEB, 'js/art')).filter(f => /^art-.+\.js$/.test(f))) require(path.join(WEB, 'js/art', f));
const errors = [], fail = m => errors.push(m);
const ids = new Set(T.ertekek.map(e => e.id));
for(const e of T.ertekek) if(!ART.has(e.matrica)) fail(`érték ${e.id}: nincs ilyen matrica: ${e.matrica}`);
for(const k of T.kartyak){
  if(!k.szoveg) fail(`${k.id}: hiányzik a szöveg`);
  if(k.szoveg && k.szoveg.length > 160) fail(`${k.id}: túl hosszú szöveg (${k.szoveg.length} karakter, max. 160)`);
  if(/\d/.test(k.szoveg || '') && !k.forras) fail(`${k.id}: szám van a szövegben, de nincs "forras" mező`);
  if(!ART.has(k.matrica)) fail(`${k.id}: nincs ilyen matrica: ${k.matrica}`);
  for(const o of ['bal', 'jobb']){
    if(!k[o] || !k[o].felirat) { fail(`${k.id}: hiányzik a(z) ${o} oldal felirata`); continue; }
    for(const id of Object.keys(k[o].hatas || {})) if(!ids.has(id)) fail(`${k.id}.${o}: ismeretlen érték: ${id}`);
  }
}
if(errors.length){ errors.forEach(e => console.log('❌ ' + e)); process.exit(1); }
console.log(`✓ tartalom rendben (${T.kartyak.length} kártya, ${T.ertekek.length} érték)`);
