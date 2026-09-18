// ============================================================
//  2D hátterek + áramlás ellenőrzése — node tests/check-hatter2d.js
//  1. Minden fájl szintaktikailag helyes (node --check) és legfeljebb 200 soros.
//  2. Nincs nyers szín (#hex, rgb/rgba) a kódban – kivétel: a névvel deklarált TARTALOM-szín blokk (const SZIN = { … };),
//     amely valódi, palettán kívüli dolgot ábrázol (pl. a szmogos város szürkéi). Minden más szín ART.MAT / DS / token.
//  3. A tiszta segédek Node-ban: ugyanaz a seed → ugyanaz az elrendezés, más seed → más; méretarányos elrendezés;
//     áramlás-geometria (töröttvonal hossza, pont a vonalon, pötty-fázisok, álló pöttyök); méhsejt CSS-generátor.
//  A böngészős kép: node tools/jatek-foto.js (lásd docs/hatterek-2d.md).
// ============================================================
const fs = require('fs'), path = require('path'), assert = require('assert'), { execFileSync } = require('child_process');
const WEB = path.join(__dirname, '..', 'web');
const DIR = path.join(WEB, 'js/hatter2d');
const FILES = [...fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => path.join(DIR, f)), path.join(WEB, 'js/aramlas.js')];
let n = 0; const fails = [];
const t = (name, fn) => { n++; try{ fn(); }catch(e){ fails.push(`${name}: ${e.message}`); } };
const rel = (f) => path.relative(WEB, f);

// ---- 1–2. fájlok ----
for(const f of FILES){
  const src = fs.readFileSync(f, 'utf8');
  t(`${rel(f)}: node --check`, () => execFileSync(process.execPath, ['--check', f], { stdio:'pipe' }));
  t(`${rel(f)}: ≤ 200 sor`, () => { const lines = src.split('\n').length - (src.endsWith('\n') ? 1 : 0); assert(lines <= 200, `${lines} sor – bontsd fel`); });
  t(`${rel(f)}: nincs nyers szín a SZIN blokkon kívül`, () => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')   // megjegyzések ki
      .replace(/const SZIN = \{[\s\S]*?\};/g, '');                                            // a tartalom-szín blokk ki
    const raw = code.match(/#[0-9a-f]{3,8}\b|rgba?\(\s*\d/gi);
    assert(!raw, 'nyers szín: ' + [...new Set(raw || [])].join(', '));
  });
}
const cssPath = path.join(WEB, 'css/aramlas.css');
t('css/aramlas.css: csak tokenek', () => {
  const s = fs.readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[a-z0-9-]+\s*:[^;{}]*;?/gi, '');
  assert(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(s), 'nyers szín a CSS-ben');
});

// ---- 3. tiszta segédek ----
const A = require(path.join(DIR, 'alap.js'));
const { varosLayout, SZIN } = require(path.join(DIR, 'varos.js'));
const { konyhaLayout } = require(path.join(DIR, 'konyha.js'));
const { kertLayout } = require(path.join(DIR, 'kert.js'));
const MS = require(path.join(DIR, 'mehsejt.js'));
const F = require(path.join(WEB, 'js/aramlas.js'));

t('rng: determinisztikus és 0–1 közötti', () => {
  const a = A.rng(42), b = A.rng(42), xs = Array.from({ length:50 }, () => a());
  assert.deepStrictEqual(xs, Array.from({ length:50 }, () => b()));
  assert(xs.every(v => v >= 0 && v < 1)); assert.notDeepStrictEqual(xs.slice(0, 5), Array.from({ length:5 }, A.rng(43)));
});
for(const [name, fn, seed] of [['város', varosLayout, 2075], ['konyha', konyhaLayout, 7], ['kert', kertLayout, 3]]){
  t(`${name}: ugyanaz a seed → ugyanaz az elrendezés`, () => assert.deepStrictEqual(fn(1280, 800, seed), fn(1280, 800, seed)));
  t(`${name}: más seed → más elrendezés`, () => assert.notDeepStrictEqual(fn(1280, 800, seed), fn(1280, 800, seed + 1)));
  t(`${name}: álló telefonon (390×844) is értelmes`, () => { const L = fn(390, 844, seed); assert(L && JSON.stringify(L).length > 50 && !/NaN|null/.test(JSON.stringify(L))); });
}
t('város: a házsor kitölti a szélességet, a talaj a kép alján', () => {
  const L = varosLayout(1280, 800); assert(L.front[0].x <= 0 && L.front.at(-1).x + L.front.at(-1).w >= 1280); assert(L.ground > 600 && L.ground < 800);
});
t('város: a SZIN blokk csak tartalom-szín (a szmog)', () => assert(SZIN.sky.length >= 2 && SZIN.house.length === 3));
t('konyha: a hűtő a képen belül kezdődik, az ablak nem lóg a hűtőbe', () => {
  for(const [W, H] of [[1280, 800], [390, 844], [800, 400]]){ const L = konyhaLayout(W, H);
    assert(L.fridge.x < W && L.fridge.x > W * 0.5, `hűtő ${W}×${H}`); assert(L.win.x + L.win.w < L.fridge.x, `ablak ${W}×${H}`);
    assert(L.counter < L.floor && L.fridge.top < L.counter); }
});
t('kert: a rét a kerítés alatt, a virágok a réten', () => {
  const L = kertLayout(1280, 800); assert(L.lawn > L.fence && L.fence > L.horizon); assert(L.flowers.every(f => f.y >= L.lawn && f.y <= 800));
});
t('méhsejt: sűrűség → sejtméret, középpontok lefedik a képet', () => {
  assert(MS.sizeOf({ density:0 }) > MS.sizeOf({ density:1 })); assert.strictEqual(MS.sizeOf({ size:30 }), 30);
  const c = MS.hexCenters(400, 300, 20); assert(c.length > 50);
  assert(c.some(([x, y]) => x <= 0 && y <= 0) && c.some(([x, y]) => x >= 400 && y >= 300));
});
t('méhsejt CSS: SVG-csempe + foltok + token-alap', () => {
  const css = MS.mehsejtCSS({ size:28, opacity:0.1, color:'leaf', bg:'cream' });
  assert(css.startsWith('url("data:image/svg+xml,')); assert(css.includes('radial-gradient(')); assert(css.endsWith('var(--cream)'));
  assert(decodeURIComponent(css.match(/url\("([^"]+)"\)/)[1]).includes("stroke='#6E8947'"), 'a szín a DS.color.leaf-ből jön');
});
t('áramlás: töröttvonal hossza és pont a vonalon', () => {
  const P = [[0, 0], [30, 0], [30, 40]];
  assert.strictEqual(F.polyLength(P), 70);
  assert.deepStrictEqual(F.pointAt(P, 15), [15, 0]); assert.deepStrictEqual(F.pointAt(P, 50), [30, 20]);
  assert.deepStrictEqual(F.pointAt(P, 999), [30, 40]); assert.deepStrictEqual(F.pointAt(P, -5), [0, 0]);
});
t('áramlás: pötty-fázisok egyenletesek, reverse és both', () => {
  assert.deepStrictEqual(F.phases(4, 0, false, false), [0, 0.25, 0.5, 0.75]);
  assert.deepStrictEqual(F.phases(2, 0.1, true, false).map(v => +v.toFixed(2)), [0.9, 0.4]);
  assert.deepStrictEqual(F.phases(2, 0.1, false, true).map(v => +v.toFixed(2)), [0.1, 0.4]);
});
t('áramlás: álló pöttyök nőnek a haladás irányába', () => {
  const s = F.staticDots(4); assert(s[0].at < s[3].at && s[0].scale < s[3].scale && s[3].scale === 1);
  assert.deepStrictEqual(F.staticDots(1), [{ at:0.5, scale:1 }]);
});

if(fails.length){ fails.forEach(f => console.log('❌ ' + f)); console.log(`2D hátterek: ${n} próba, ${fails.length} hiba`); process.exit(1); }
console.log(`2D hátterek + áramlás: ${n} próba, ${n} rendben (${FILES.length} fájl)`);
console.log('✓ minden rendben');
