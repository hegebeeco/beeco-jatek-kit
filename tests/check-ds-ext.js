// ============================================================
//  Design system 1.2 bővítés ellenőrzése — node tests/check-ds-ext.js
//  A web/js/ds-ext.js tiszta (HTML-t adó) segédeit próbálja ki böngésző nélkül:
//  jól formált HTML (zárt címkék), escape-elés, a változásjelző előjele és hangneme, a radar pontjai a képen belül,
//  a gyűrű és a csúszka alapértékei, a forrás-link biztonsága. A böngészős rész: tools/jatek-foto.js + arculat.html.
// ============================================================
const path = require('path'), fs = require('fs'), assert = require('assert');
const X = require(path.join(__dirname, '..', 'web/js/ds-ext.js'));
let n = 0; const fails = [];
const t = (name, fn) => { n++; try{ fn(); }catch(e){ fails.push(`${name}: ${e.message}`); } };

// ---- egyszerű HTML-ellenőrző: minden nyitott címke bezárul, jó sorrendben ----
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function balanced(html){
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let m, last = 0, text = '';
  while((m = re.exec(html))){
    text += html.slice(last, m.index); last = re.lastIndex;
    const [, close, tagRaw, , self] = m, tag = tagRaw.toLowerCase();
    if(close){ const top = stack.pop(); if(top !== tag) throw new Error(`</${tag}> jött, de <${top}> volt nyitva`); }
    else if(!self && !VOID.has(tag)) stack.push(tag);
  }
  text += html.slice(last);
  if(stack.length) throw new Error('bezáratlan: ' + stack.join(', '));
  if(/[<>]/.test(text)) throw new Error('escape-eletlen < vagy > a szövegben');
  return true;
}
const ok = (html) => assert(balanced(html));

// ---- 1. változásjelző ----
t('delta: hangnem – több a jobb', () => {
  assert.strictEqual(X.dsDeltaTone(2), 'good'); assert.strictEqual(X.dsDeltaTone(-1), 'bad'); assert.strictEqual(X.dsDeltaTone(0), 'zero');
});
t('delta: hangnem – kevesebb a jobb (CO₂, Ft)', () => {
  assert.strictEqual(X.dsDeltaTone(-3, 'down'), 'good'); assert.strictEqual(X.dsDeltaTone(3, 'down'), 'bad'); assert.strictEqual(X.dsDeltaTone(0, 'down'), 'zero');
});
t('delta: előjel és magyar számírás', () => {
  assert.strictEqual(X.dsDeltaSign(2).text, '+2');
  assert.strictEqual(X.dsDeltaSign(-1.5).text, '−1,5');
  assert.strictEqual(X.dsDeltaSign(0).dir, 'zero');
  assert.strictEqual(X.dsDeltaSign('nem szám').dir, 'zero');
});
t('delta: HTML – osztály, nyíl, felolvasott szöveg', () => {
  const up = X.dsDeltaHTML({ label:'Természet', icon:'leaf', value:2 });
  ok(up); assert(/class="ds-delta is-good"/.test(up)); assert(up.includes('↑')); assert(/aria-label="Természet: nőtt, plusz 2"/.test(up));
  const dn = X.dsDeltaHTML({ label:'Pénz', value:-3, unit:'Ft', better:'up', small:true });
  ok(dn); assert(/is-bad is-small/.test(dn)); assert(dn.includes('↓')); assert(/mínusz 3 Ft/.test(dn));
  const z = X.dsDeltaHTML({ label:'Béke', value:0 }); ok(z); assert(/is-zero/.test(z)); assert(/nem változott/.test(z));
});
t('delta: a szöveg escape-elve', () => { const h = X.dsDeltaHTML({ label:'<script>"x"</script>', value:1 }); ok(h); assert(!h.includes('<script>')); });
t('mérő: szellem-szakasz a régi és az új szint között', () => {
  const h = X.dsMeterHTML({ label:'Természet', icon:'leaf', value01:0.6, delta:0.2 }); ok(h);
  assert(/--v:60%/.test(h)); assert(/--a:40%;--w:20%/.test(h)); assert(/ds-meter-ghost is-good/.test(h)); assert(/aria-valuenow="60"/.test(h));
  const d = X.dsMeterHTML({ label:'Pénz', value01:0.3, delta:-0.1 }); ok(d); assert(/--a:30%;--w:10%/.test(d)); assert(/is-bad/.test(d));
  const c = X.dsMeterHTML({ label:'x', value01:1.4, delta:0.9 }); ok(c); assert(/--v:100%/.test(c)); assert(/--a:10%;--w:90%/.test(c));   // 0–1 közé szorítva
});

// ---- 2. profil-ábra ----
const G = X.RADAR;
for(const k of [3, 4, 5, 6]){
  t(`radar: ${k} tengely – minden pont a képen belül`, () => {
    for(const vals of [Array(k).fill(1), Array(k).fill(0), Array.from({ length:k }, (_, i) => i / k), Array(k).fill(7), Array(k).fill(-2)]){
      const pts = X.dsRadarPoints(vals);
      assert.strictEqual(pts.length, k);
      for(const p of pts) assert(p.x >= 0 && p.x <= G.w && p.y >= 0 && p.y <= G.h, `kilóg: ${p.x},${p.y}`);
    }
    // a címkék horgonypontjai is a képen belül vannak
    for(const p of X.dsRadarPoints(Array(k).fill(1), Object.assign({}, G, { r:G.r + G.lbl }))) assert(p.x >= 0 && p.x <= G.w && p.y >= 0 && p.y <= G.h);
  });
}
t('radar: az első tengely felfelé mutat, a pontok szimmetrikusak', () => {
  const p = X.dsRadarPoints([1, 1, 1, 1]);
  assert.strictEqual(p[0].x, G.cx); assert.strictEqual(p[0].y, G.cy - G.r);
  assert(Math.abs(p[1].x - (G.cx + G.r)) < 0.01); assert(Math.abs(p[2].y - (G.cy + G.r)) < 0.01);
  assert.deepStrictEqual(X.dsRadarPoints([0, 0, 0]).map(q => [q.x, q.y]), [[G.cx, G.cy], [G.cx, G.cy], [G.cx, G.cy]]);
});
const VALS = [{ label:'Természet', icon:'leaf', value01:.8 }, { label:'Pénz', icon:'coin', value01:.4 }, { label:'Emberek', icon:'people', value01:.65 },
  { label:'Energia', icon:'bolt', value01:.3 }, { label:'Víz', icon:'drop', value01:.9 }];
t('profil: radar HTML', () => { const h = X.dsProfileHTML({ values:VALS, title:'Rendszerprofil' }); ok(h);
  assert(/ds-profile is-radar/.test(h)); assert.strictEqual((h.match(/ds-profile-lbl/g) || []).length, 5);
  assert(/role="img" aria-label="Rendszerprofil: Természet 80%/.test(h)); assert(/viewBox="0 0 440 290"/.test(h)); });
t('profil: sávos HTML és 3-nál kevesebb tengely → sávok', () => {
  const b = X.dsProfileHTML({ values:VALS, mode:'bars' }); ok(b); assert.strictEqual((b.match(/ds-profile-bar"/g) || []).length, 5);
  const two = X.dsProfileHTML({ values:VALS.slice(0, 2) }); ok(two); assert(/is-bars/.test(two));
});
t('profil: legfeljebb 6 tengely', () => { const h = X.dsProfileHTML({ values:[...VALS, ...VALS] }); ok(h); assert.strictEqual((h.match(/ds-profile-lbl/g) || []).length, 6); });

// ---- 3. forrás, feltételezés ----
t('forrás: link új lapon, rel=noopener', () => {
  const h = X.dsSourceHTML({ title:'Háztartási energia', url:'https://www.ksh.hu/', publisher:'KSH', year:2024, note:'országos átlag' }); ok(h);
  assert(/target="_blank" rel="noopener noreferrer"/.test(h)); assert(/KSH, 2024/.test(h)); assert(/országos átlag/.test(h));
});
t('forrás: nem-http link nem lesz kattintható', () => {
  const h = X.dsSourceHTML({ title:'Rossz', url:'javascript:alert(1)' }); ok(h); assert(!/href/.test(h)); assert(!/javascript:/.test(h));
});
t('forrás: link nélkül is jól formált', () => ok(X.dsSourceHTML({ publisher:'Nébih' })));
t('feltételezés-címke', () => { const h = X.dsAssumeHTML('4 fős család'); ok(h); assert(/ds-assume/.test(h)); assert(/feltételezés/.test(h)); ok(X.dsAssumeHTML()); });

// ---- 5–7. gyűrű, csúszka, tipp-gomb ----
t('gyűrű: HTML, kezdő szám, kerület', () => {
  const h = X.dsRingHTML({ seconds:9.2, size:72 }); ok(h); assert(/role="timer"/.test(h)); assert(/>10<\/b>/.test(h)); assert(/--size:72px/.test(h));
  assert(Math.abs(X.RING_C - 2 * Math.PI * 20) < 0.01); assert(new RegExp(`stroke-dasharray="${X.RING_C}"`).test(h));
  ok(X.dsRingHTML());
});
t('csúszka: érték a határok közé szorítva, --k arány, felolvasott egység', () => {
  const h = X.dsRangeHTML({ id:'tipp', label:'Hány kWh?', min:0, max:4000, step:100, value:1000, unit:'kWh', labels:['kevés', 'sok'] }); ok(h);
  assert(/--k:0\.2500/.test(h)); assert(/aria-valuetext="1000 kWh"/.test(h)); assert(/<label class="ds-range-label" for="tipp">/.test(h));
  const c = X.dsRangeHTML({ min:10, max:20, value:99 }); ok(c); assert(/value="20"/.test(c)); assert(/--k:1\.0000/.test(c)); assert(/aria-label="Tipp"/.test(c));
});
t('tipp-gomb', () => { const h = X.dsTipBtnHTML('Kilowattóra: ennyi áramot használ 1 kW egy óra alatt.', 'kWh'); ok(h); assert(/data-ds-tip=/.test(h)); assert(/aria-label="Mit jelent: kWh"/.test(h)); });

// ---- a CSS-ben megvan minden osztály, amit a segédek kiadnak ----
t('minden kiadott ds- osztálynak van stílusa', () => {
  const css = ['ds.css', 'ds-game.css', 'ds-ext.css'].map(f => fs.readFileSync(path.join(__dirname, '..', 'web/css', f), 'utf8')).join('\n');
  const html = [X.dsDeltaHTML({ value:1 }), X.dsMeterHTML({ value01:.5, delta:.1 }), X.dsProfileHTML({ values:VALS }), X.dsProfileHTML({ values:VALS, mode:'bars' }),
    X.dsSourceHTML({ title:'a', url:'https://a.hu', note:'n' }), X.dsAssumeHTML('x'), X.dsRingHTML({ seconds:3 }), X.dsRangeHTML({ label:'a', labels:['a', 'b'] }), X.dsTipBtnHTML('a')].join('');
  const cls = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)).filter(c => c.startsWith('ds-') && !/^ds-(sr)$/.test(c)));
  const missing = [...cls].filter(c => !new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![a-z0-9-])').test(css));
  assert(!missing.length, 'stílus nélkül: ' + missing.join(', '));
});

if(fails.length){ fails.forEach(f => console.log('❌ ' + f)); console.log(`${n - fails.length}/${n} rendben`); process.exit(1); }
console.log(`✓ ds-ext: ${n}/${n} ellenőrzés rendben`);
