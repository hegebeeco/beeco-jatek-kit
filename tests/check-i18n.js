// ============================================================
//  Nyelv-ellenőrzés — node tests/check-i18n.js   (részletes lista: --lista)
//
//  1. Minden tr('…') / tr("…") szövegnek (a web/js fájlokban, a szótárakon kívül) van angol fordítása a web/js/i18n/en-*.js
//     szótárakban. (Csak szöveg-literált tudunk ellenőrizni; a változós tr(`…${x}`) hibának számít – használj {név}-et.)
//  2. A HTML data-i18n elemeinek is van fordítása.
//  3. Az angol tartalom (web/data/en/**.json) szerkezete egyezik a magyarral: ugyanazok a kulcsok és tömbhosszak, és minden
//     NEM-szöveg érték (szám, igaz/hamis) és az azonosító/link/forrás-jellegű szöveg (id, url, forras, src, sticker, icon, img,
//     logo, emoji, zone, bin, product, dim, group…) PONTOSAN ugyanaz → fordításkor egy szám sem változhat meg véletlenül.
//  4. Figyelmeztetés: angol szövegben magyar ékezet (fordítatlanul maradt?), hiányzó angol tartalomfájl.
// ============================================================
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), WEB = path.join(ROOT, 'web');
const errors = [], warns = [], LISTA = process.argv.includes('--lista');
const walk = (d, re) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes:true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name), re) : re.test(e.name) ? [path.join(d, e.name)] : []) : [];
const rel = f => path.relative(ROOT, f);

// ---- szótárak betöltése ----
global.window = undefined;
const I18N = require(path.join(WEB, 'js/i18n.js'));
const dictFiles = walk(path.join(WEB, 'js/i18n'), /^en-.*\.js$/);
const EN = {};
global.I18N = { add:(l, o) => { if(l === 'en') Object.assign(EN, o); } };
for(const f of dictFiles){ try{ require(f); }catch(e){ errors.push(`${rel(f)}: nem tölthető be – ${e.message}`); } }

// ---- 1. tr() hívások ----
const ACC = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;
let calls = 0; const miss = new Map();
for(const f of walk(path.join(WEB, 'js'), /\.js$/).filter(f => !f.includes(`${path.sep}i18n${path.sep}`) && !f.endsWith('i18n.js'))){
  const s = fs.readFileSync(f, 'utf8');
  for(const m of s.matchAll(/\btr\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\$]|\\.)*)`)/g)){
    const key = (m[1] ?? m[2] ?? m[3]).replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n'); calls++;
    if(EN[key] == null){ if(!miss.has(key)) miss.set(key, rel(f)); }
  }
  for(const m of s.matchAll(/\btr\(\s*`[^`]*\$\{/g)) errors.push(`${rel(f)}: tr(\`…\${…}\`) – változó helyett {név} + tr(szöveg, { név })`);
}
for(const [k, f] of miss) errors.push(`fordítás hiányzik (${f}): ${JSON.stringify(k).slice(0, 110)}`);
// ---- 2. HTML data-i18n ----
for(const f of walk(WEB, /\.html$/)){
  const s = fs.readFileSync(f, 'utf8');
  for(const m of s.matchAll(/<[^>]+data-i18n(?:="([^"]*)")?[^>]*>([^<]*)</g)){ const k = (m[1] || m[2]).trim(); if(k && EN[k] == null) errors.push(`${rel(f)}: data-i18n fordítás hiányzik: ${k.slice(0, 80)}`); }
}
for(const [k, v] of Object.entries(EN)) if(ACC.test(v) && !/[A-Z][a-zé]+i\b|beeco|Zöldi|Ökos|Szelektálj|Hűtő|Nébih|KSH|MVM|Ft\b/.test(v)) warns.push(`magyar ékezet az angol szótárban: ${JSON.stringify(v).slice(0, 80)}`);

// ---- 3. angol tartalom szerkezete ----
const FIX = /^(id|ids|url|forras|src|sources?|sticker|icon|img|logo|emoji|zone|bin|bins|product|dim|group|kind|type|level|n|role|accent|color|shape|flag|device|hotspot|room|requires|answer|alsoOk|alsoFits|mode|season|time|lb|best|game)$/i;
function cmp(a, b, p, f){
  if(Array.isArray(a)){ if(!Array.isArray(b) || a.length !== b.length){ errors.push(`${f}: ${p} tömbhossz eltér (${a.length} ↔ ${Array.isArray(b) ? b.length : typeof b})`); return; } a.forEach((x, i) => cmp(x, b[i], `${p}[${i}]`, f)); return; }
  if(a && typeof a === 'object'){ if(!b || typeof b !== 'object'){ errors.push(`${f}: ${p} nem objektum az angolban`); return; }
    for(const k of Object.keys(a)){ if(k.startsWith('_')) continue; if(!(k in b)){ errors.push(`${f}: ${p}.${k} hiányzik az angolból`); continue; } cmp(a[k], b[k], `${p}.${k}`, f); }
    for(const k of Object.keys(b)) if(!(k in a) && !k.startsWith('_')) errors.push(`${f}: ${p}.${k} csak az angolban van`); return; }
  const key = p.split(/[.[]/).pop().replace(']', '');
  if(typeof a !== 'string'){ if(a !== b) errors.push(`${f}: ${p} értéke eltér (${a} ↔ ${b}) – szám/igaz-hamis nem változhat`); return; }
  if(FIX.test(key) || /^https?:/.test(a)){ if(a !== b) errors.push(`${f}: ${p} azonosító/link eltér („${a}” ↔ „${b}”)`); return; }
  if(typeof b !== 'string') errors.push(`${f}: ${p} nem szöveg az angolban`);
  else{ if(ACC.test(b) && b === a && a.length > 12 && !/\.source\./.test(p)) warns.push(`${f}: ${p} fordítatlannak tűnik: ${a.slice(0, 60)}`);   // forráscím eredeti nyelven maradhat
    // ezres elválasztó: magyarul szóköz (85 000), angolul vessző (85,000) → mindkettő 85000; tizedes: 1,5 ↔ 1.5
    const nums = (t, en) => (String(t).replace(en ? /(\d),(?=\d{3}\b)/g : /(\d)[\s\u00a0\u202f](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.'));
    const na = a === b ? [] : nums(a, false), nb = nums(b, true);                // változatlan (pl. forráscím): nincs mit összevetni
    for(const x of na) if(!nb.includes(x) && !nb.includes(x.replace(/\.0+$/, ''))) warns.push(`${f}: ${p} – a „${x}” szám nincs meg az angolban (ellenőrizd: forrás szerinti szám nem változhat)`); }
}
let pairs = 0;
const huFiles = walk(path.join(WEB, 'data'), /\.json$/).filter(f => !f.includes(`${path.sep}data${path.sep}en${path.sep}`) && !/art-override\.json$/.test(f));   // a képcsere-lista nem szöveg
for(const f of huFiles){
  const r = path.relative(path.join(WEB, 'data'), f), en = path.join(WEB, 'data/en', r);
  if(!fs.existsSync(en)){ warns.push(`nincs angol tartalom: data/en/${r}`); continue; }
  try{ cmp(JSON.parse(fs.readFileSync(f, 'utf8')), JSON.parse(fs.readFileSync(en, 'utf8')), r, 'data/en/' + r); pairs++; }catch(e){ errors.push(`data/en/${r}: ${e.message}`); }
}
console.log(`tr() hívás: ${calls} · angol szótár: ${Object.keys(EN).length} szöveg (${dictFiles.length} fájl) · angol tartalom: ${pairs}/${huFiles.length} fájl`);
if(LISTA || warns.length < 30) warns.forEach(w => console.log('⚠️  ' + w)); else console.log(`⚠️  ${warns.length} figyelmeztetés (részletek: --lista)`);
if(errors.length){ (LISTA ? errors : errors.slice(0, 40)).forEach(e => console.log('❌ ' + e)); if(!LISTA && errors.length > 40) console.log(`… és még ${errors.length - 40} (--lista)`); process.exit(1); }
console.log('✓ nyelvek rendben');
