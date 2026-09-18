// ============================================================
//  Illusztrációk ellenőrzése — node tests/check-art.js
//
//  1. Minden matrica betölthető, a neve egyedi, van magyar (hu) és angol (en) neve (az angol a képgenerátor-prompthoz kell).
//  2. Minden alakzat ismert típusú, a kötelező méretei számok, az anyaga létezik az ART.MAT-ban (a készlet különben
//     csendben papírra cserélné), és a tárgy nem lóg ki a vászonról (a perem 4, az árnyék +3,5 egységgel nagyobb).
//  3. A kész SVG jól formált (nincs NaN / undefined, a címkék párban vannak).
//  4. (játék-specifikus rész helye – a kit általános változatában üres)
//  5. A csere-lista (web/data/art-override.json) csak létező matricára mutat, és a WebP-fájl megvan.
//  6. A tartalom célzott matricái ("sticker": "név" a web/data JSON-okban) létező matricára mutatnak.
//  Tájékoztató (nem hiba): a tartalomban használt emojik közül melyiknek nincs még matricája.
// ============================================================
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), WEB = path.join(ROOT, 'web'), ART_DIR = path.join(WEB, 'js/art');
const errors = [], notes = [];
const fail = (m) => errors.push(m);

// ---- 1. betöltés ----
const ART = require(path.join(ART_DIR, 'art.js'));
global.ART = ART;
const libOf = {};
for(const f of fs.readdirSync(ART_DIR).filter(f => /^art-.+\.js$/.test(f)).sort()){
  const before = new Set(ART.names());
  try{ require(path.join(ART_DIR, f)); }catch(e){ fail(`${f}: nem tölthető be – ${e.message}`); continue; }
  for(const n of ART.names()) if(!before.has(n)) libOf[n] = f;
}
const names = ART.names();
if(names.length === 0) fail('nincs egyetlen matrica sem');

// ---- 2. alakzatok ----
const NEED = { rect:['x', 'y', 'w', 'h'], circle:['cx', 'cy', 'r'], ellipse:['cx', 'cy', 'rx', 'ry'], poly:['pts'], path:['p'], line:['pts'], shine:[] };
const TONES = ['light', 'base', 'dark', 'line'], FC = ['d', 'v', 'h', 'none'];
const num = v => typeof v === 'number' && isFinite(v);
// befoglaló doboz forgatással együtt (a sarokpontokat forgatjuk)
function box(s){
  let pts;
  switch(s.t){
    case 'rect': pts = [[s.x, s.y], [s.x + s.w, s.y + s.h]]; break;
    case 'circle': pts = [[s.cx - s.r, s.cy - s.r], [s.cx + s.r, s.cy + s.r]]; break;
    case 'ellipse': pts = [[s.cx - s.rx, s.cy - s.ry], [s.cx + s.rx, s.cy + s.ry]]; break;
    case 'poly': case 'line': pts = s.pts; break;
    case 'path': { const b = ART.bbox(s); pts = [[b[0], b[1]], [b[0] + b[2], b[1] + b[3]]]; break; }   // a készlet a görbéken mintavételez
    default: return null;
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  let c = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.min(...ys)], [Math.min(...xs), Math.max(...ys)], [Math.max(...xs), Math.max(...ys)]];
  if(s.rot){
    const ox = s.ox != null ? s.ox : (c[0][0] + c[3][0]) / 2, oy = s.oy != null ? s.oy : (c[0][1] + c[3][1]) / 2, a = s.rot * Math.PI / 180;
    c = c.map(([x, y]) => [ox + (x - ox) * Math.cos(a) - (y - oy) * Math.sin(a), oy + (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)]);
  }
  return [Math.min(...c.map(p => p[0])), Math.min(...c.map(p => p[1])), Math.max(...c.map(p => p[0])), Math.max(...c.map(p => p[1]))];
}
for(const n of names){
  const A = ART.LIB[n], where = `${libOf[n] || 'art.js'} → ${n}`;
  if(!/^[a-z][a-z0-9_]*$/.test(n)) fail(`${where}: a név csak kisbetű, szám és _ lehet (ékezet nélkül)`);
  if(!A.hu || !String(A.hu).trim()) fail(`${where}: hiányzik a magyar név (hu)`);
  if(!A.en || !String(A.en).trim()) fail(`${where}: hiányzik az angol név (en) – a képgenerátor-prompthoz kell`);
  if(!Array.isArray(A.emoji)) fail(`${where}: az emoji mező tömb legyen`);
  if(!Array.isArray(A.shapes) || !A.shapes.length){ fail(`${where}: nincs alakzata`); continue; }
  A.shapes.forEach((s, i) => {
    const at = `${where} #${i + 1} (${s.t})`;
    if(!NEED[s.t]){ fail(`${at}: ismeretlen alakzat-típus`); return; }
    for(const k of NEED[s.t]){
      if(k === 'pts'){ if(!Array.isArray(s.pts) || s.pts.length < 2 || !s.pts.every(p => Array.isArray(p) && num(p[0]) && num(p[1]))) fail(`${at}: hibás pontlista`); }
      else if(k === 'p'){ if(typeof s.p !== 'string' || !/^\s*[Mm]/.test(s.p)) fail(`${at}: az útvonal M-mel kezdődjön`); }
      else if(!num(s[k])) fail(`${at}: a(z) ${k} nem szám`);
    }
    if(s.t === 'shine' && !(num(s.cx) || num(s.x))) fail(`${at}: a fénycsíknak x,y,w,h vagy cx,cy,rx,ry kell`);
    if(s.t !== 'shine' && !ART.MAT[s.m]) fail(`${at}: ismeretlen anyag: ${s.m}`);
    if(s.tone && !TONES.includes(s.tone)) fail(`${at}: ismeretlen tónus: ${s.tone}`);
    if(s.fc && !FC.includes(s.fc)) fail(`${at}: ismeretlen lap-mód: ${s.fc}`);
    if(s.rot != null && !num(s.rot)) fail(`${at}: a forgatás nem szám`);
    if(A.scale != null && !(num(A.scale) && A.scale > 0.5 && A.scale <= 1)) fail(`${where}: a scale 0,5 és 1 közötti szám legyen`);
    // pontosan úgy, ahogy a képen megjelenik: az alakzat pontjai a saját forgatásával, a matrica megdöntésével (tilt, a vászon
    // közepe körül) és kicsinyítésével (scale) együtt
    const t = (A.tilt || 0) * Math.PI / 180, k = A.scale || 1;
    const pts = ART.points(s).map(([x, y]) => [50 + (x - 50) * Math.cos(t) - (y - 50) * Math.sin(t), 50 + (x - 50) * Math.sin(t) + (y - 50) * Math.cos(t)])
      .map(([x, y]) => [50 + (x - 50) * k, 50 + (y - 50) * k]);
    const b = pts.length ? [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))] : null;
    if(b){
      const pad = s.t === 'line' ? (s.w || 2) / 2 : (s.d || s.t === 'shine') ? 0 : 4;   // a perem fele (8/2) kilóg a sziluettből
      if(b[0] - pad < -0.5 || b[1] - pad < -0.5 || b[2] + pad > 100.5 || b[3] + pad + (pad ? 3.5 : 0) > 100.5)
        fail(`${at}: kilóg a vászonról (${b.map(v => Math.round(v)).join(', ')}) – a tárgy a 8–92 tartományba kerüljön`);
    }
  });
  // ---- 3. SVG ----
  const svg = ART.svg(n);
  if(svg.length > 10 * 1024) notes.push(`${where}: nagy matrica (${(svg.length / 1024).toFixed(1)} KB SVG, a mérce ≤ 10 KB – ritkítsd a pontokat)`);
  if(/NaN|undefined/.test(svg)) fail(`${where}: az SVG-ben NaN/undefined van`);
  const open = (svg.match(/<(svg|g|defs|clipPath)[\s>]/g) || []).length, close = (svg.match(/<\/(svg|g|defs|clipPath)>/g) || []).length;
  if(open !== close) fail(`${where}: az SVG címkéi nincsenek párban (${open} nyitó, ${close} záró)`);
}

// ---- 4. (játék-specifikus) – a beeco-szelektalj projektben itt ellenőrizzük, hogy az i_/f_ matricák létező hulladékra/ételre
//      mutatnak. Új játékban ide jöhet a saját tartalmad ellenőrzése (pl. minden kártyának van-e matricája).
const hasArt = new Set(names);

// ---- 5. csere-lista ----
const ovPath = path.join(WEB, 'data/art-override.json');
if(fs.existsSync(ovPath)){
  let ov = {};
  try{ ov = JSON.parse(fs.readFileSync(ovPath, 'utf8')); }catch(e){ fail(`art-override.json: nem érvényes JSON – ${e.message}`); }
  for(const [k, v] of Object.entries(ov)){
    if(k[0] === '_') continue;
    if(!hasArt.has(k)) fail(`art-override.json: ismeretlen matrica: ${k}`);
    if(!/^assets\/art\/[a-z0-9_]+\.webp$/.test(v)) fail(`art-override.json: ${k} → „${v}” (assets/art/<név>.webp formában kell)`);
    else if(!fs.existsSync(path.join(WEB, v))) fail(`art-override.json: ${k} → a fájl nincs meg: web/${v}`);
  }
}else notes.push('nincs web/data/art-override.json (nem kötelező)');

// ---- 6. a tartalom célzott matricái: minden "sticker": "név" létező matricára mutat ----
const walkAll = (dir) => fs.readdirSync(dir, { withFileTypes:true }).flatMap(d => d.isDirectory() ? walkAll(path.join(dir, d.name)) : [path.join(dir, d.name)]);
let artRefs = 0;
for(const f of (fs.existsSync(path.join(WEB, 'data')) ? walkAll(path.join(WEB, 'data')) : []).filter(f => f.endsWith('.json'))){
  for(const m of fs.readFileSync(f, 'utf8').matchAll(/"sticker"\s*:\s*"([^"]*)"/g)){
    artRefs++; if(!ART.has(m[1])) fail(`${path.relative(ROOT, f)}: a "sticker": "${m[1]}" nem létező matrica`);
  }
}

// ---- tájékoztató: emoji-lefedettség a tartalomban ----
const EMOJI = /\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}️?)*/gu;
const count = {};
const scan = (file) => { const s = fs.readFileSync(file, 'utf8'); for(const m of s.matchAll(EMOJI)){ const e = m[0].replace(/️/g, ''); count[e] = (count[e] || 0) + 1; } };
const walk = (dir) => fs.readdirSync(dir, { withFileTypes:true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
if(fs.existsSync(path.join(WEB, 'data'))) walk(path.join(WEB, 'data')).filter(f => f.endsWith('.json')).forEach(scan);
walk(path.join(WEB, 'js')).filter(f => f.endsWith('.js') && !f.includes(`${path.sep}art${path.sep}`)).forEach(scan);
const used = Object.keys(count), covered = used.filter(e => ART.has(e));
const missing = used.filter(e => !ART.has(e)).sort((a, b) => count[b] - count[a]);
notes.push(`${names.length} matrica (${Object.keys(ART.BY_EMOJI).length} emojihoz) · a tartalom ${used.length} féle emojijából ${covered.length} kész · célzott matrica-hivatkozás: ${artRefs}`);
if(missing.length) notes.push(`matrica nélküli emojik (gyakoriság szerint; a méhecske és a szereplők szándékosan kimaradnak): ${missing.slice(0, 60).join(' ')}${missing.length > 60 ? ' …' : ''}`);

// ---- eredmény ----
notes.forEach(n => console.log('ℹ', n));
if(errors.length){ console.log(`\n✗ ${errors.length} hiba:`); errors.forEach(e => console.log('  -', e)); process.exit(1); }
console.log('✓ illusztrációk rendben');
