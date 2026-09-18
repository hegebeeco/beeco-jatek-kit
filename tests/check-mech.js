// ============================================================
//  Játékmechanikák ellenőrzése — node tests/check-mech.js
//  A négy mechanika TISZTA logikáját próbálja ki (böngésző nélkül): kártyasor + késleltetett következmények,
//  rács + szomszédsági hatások, pont-háló (részek, kritikus pontok, legrövidebb út), kombinálás időzítővel.
//  A felület böngészős ellenőrzése: node tools/jatek-foto.js (lásd docs/mechanikak.md).
// ============================================================
const path = require('path'), assert = require('assert');
const M = (f) => require(path.join(__dirname, '..', 'web/js/mech', f));
const K = M('kartya-logika.js'), R = M('racs-logika.js'), V = M('vonal-logika.js'), C = M('kombinal-logika.js');
let n = 0; const fails = [];
const t = (name, fn) => { n++; try{ fn(); }catch(e){ fails.push(`${name}: ${e.message}`); } };
const eq = assert.deepStrictEqual;
const ids = (q) => { const out = []; let c; while((c = q.next())) out.push(c.id); return out; };

// ---- 1. Kártyasor ----
t('kártya: sorrend ütemezés nélkül', () => eq(ids(K.queue([{ id:1 }, { id:2 }, { id:3 }])), [1, 2, 3]));
t('kártya: következmény n=2 → pontosan 2 kártya jön előtte', () => {
  const q = K.queue([{ id:'a' }, { id:'b' }, { id:'c' }, { id:'d' }]);
  q.next(); q.schedule({ id:'X' }, 2);
  eq(ids(q), ['b', 'c', 'X', 'd']);
});
t('kártya: n=0 → rögtön a következő', () => { const q = K.queue([{ id:'a' }, { id:'b' }]); q.next(); q.schedule({ id:'X' }, 0); eq(ids(q), ['X', 'b']); });
t('kártya: azonos időpont → ütemezési sorrend (FIFO)', () => {
  const q = K.queue([{ id:'a' }, { id:'b' }, { id:'c' }]); q.next(); q.schedule({ id:'X' }, 1).schedule({ id:'Y' }, 1);
  eq(ids(q), ['b', 'X', 'Y', 'c']);
});
t('kártya: a pakli vége után a függő következmények is kijönnek', () => {
  const q = K.queue([{ id:'a' }]); q.next(); q.schedule({ id:'Z' }, 5).schedule({ id:'Y' }, 3);
  eq(ids(q), ['Y', 'Z']); assert(q.done());
});
t('kártya: decide a kártya saját "then" mezőjéből ütemez', () => {
  const q = K.queue([{ id:'a', right:{ then:{ card:{ id:'kov' }, after:1 } } }, { id:'b' }, { id:'c' }]);
  q.next(); const f = q.decide('right'); assert(f && f.card.id === 'kov');
  eq(q.pending(), [{ card:{ id:'kov' }, in:1 }]);
  eq(ids(q), ['b', 'kov', 'c']);
});
t('kártya: decide a followUp beállításból + history', () => {
  const q = K.queue([{ id:'a' }, { id:'b' }], { followUp:(c, s) => s === 'left' ? { card:{ id:c.id + '!' }, after:0 } : null });
  q.next(); q.decide('left'); const c = q.next(); q.decide('right', c);
  eq(c.id, 'a!'); eq(q.history().map(h => h.card.id + ':' + h.side), ['a:left', 'a!:right']);
});
t('kártya: másik oldalon nincs következmény', () => {
  const q = K.queue([{ id:'a', right:{ then:{ card:{ id:'k' }, after:0 } } }, { id:'b' }]); q.next(); eq(q.decide('left'), null); eq(ids(q), ['b']);
});

// ---- 2. Rács ----
t('rács: lerakás, határ, visszavonás', () => {
  const g = R.create(3, 2);
  assert(g.place(0, 0, 'fa')); assert(!g.place(3, 0, 'fa')); assert(!g.place(0, 0, 'fa'));   // rácson kívül / nincs változás
  g.place(0, 0, 'to'); eq(g.get(0, 0), 'to'); g.undo(); eq(g.get(0, 0), 'fa'); g.undo(); eq(g.get(0, 0), null); eq(g.undo(), null);
});
t('rács: szomszédok (sarok, közép, manhattan, sugár 2)', () => {
  const g = R.create(5, 5);
  eq(g.neighbors(0, 0).length, 3); eq(g.neighbors(2, 2).length, 8);
  eq(g.neighbors(2, 2, 1, 'manhattan').length, 4); eq(g.neighbors(2, 2, 2).length, 24);
  eq(g.neighbors(2, 2, 2, 'manhattan').length, 12);
});
const RULES = { values:['elohely', 'viz', 'ho'], tiles:{
  fa:{ base:{ elohely:2 }, aura:{ radius:1, add:{ ho:-1 } }, near:[{ type:'virag', add:{ elohely:1 }, max:2 }] },
  virag:{ base:{ elohely:1 }, near:[{ type:'fa', add:{ elohely:1 } }] },
  beton:{ base:{ ho:2, viz:-1 }, near:[{ type:'*', radius:1, add:{ viz:-1 } }] },
} };
t('rács: alapérték + szomszéd-bónusz + max korlát', () => {
  const g = R.create(3, 3); g.place(1, 1, 'fa'); g.place(0, 0, 'virag'); g.place(2, 0, 'virag'); g.place(0, 2, 'virag');
  const r = g.evaluate(RULES);
  eq(r.cell(1, 1).values.elohely, 2 + 2);                  // 3 virág, de max:2
  eq(r.cell(0, 0).values.elohely, 1 + 1);
  eq(r.totals.elohely, 4 + 3 * 2);
});
t('rács: aura az üres mezőkre is hat (hőtérkép), a saját mezőre nem', () => {
  const g = R.create(3, 3); g.place(1, 1, 'fa');
  const r = g.evaluate(RULES);
  eq(r.cell(0, 0).values.ho, -1); eq(r.cell(1, 1).values.ho, undefined); eq(r.totals.ho, -8); eq(r.totals.viz, 0);
  eq(r.cell(0, 0).parts[0], { kind:'aura', from:{ x:1, y:1 }, add:{ ho:-1 } });
});
t('rács: "*" szomszéd + sarok-lapka + két fa aurája összeadódik', () => {
  const g = R.create(3, 1); g.place(0, 0, 'fa'); g.place(2, 0, 'fa'); g.place(1, 0, 'beton');
  const r = g.evaluate(RULES);
  eq(r.cell(1, 0).values, { ho:2 - 2, viz:-1 - 2 });
});
t('rács: tárgy-lapka {type} és toJSON/load', () => {
  const g = R.create(2, 2); g.place(1, 1, { type:'virag', id:7 }); eq(g.evaluate(RULES).totals.elohely, 1);
  const h = R.create(2, 2).load(g.toJSON()); eq(h.count('virag'), 1);
});

// ---- 3. Pont-háló ----
const NODES = [{ id:'a', x:0, y:0 }, { id:'b', x:10, y:0 }, { id:'c', x:20, y:0 }, { id:'d', x:10, y:10 }, { id:'e', x:60, y:0 }];
t('háló: korlátok (távolság, keret, fok, dupla, szabály)', () => {
  const g = V.create({ nodes:NODES, maxDist:15, maxLinks:3, maxDegree:2, allow:(p, q) => !(p.id === 'd' && q.id === 'c') });
  eq(g.connect('a', 'c').reason, 'tavol'); eq(g.connect('a', 'a').reason, 'ugyanaz'); eq(g.connect('a', 'x').reason, 'nincs');
  assert(g.connect('a', 'b').ok); eq(g.connect('b', 'a').reason, 'megvan');
  assert(g.connect('b', 'c').ok); eq(g.connect('b', 'd').reason, 'fok'); eq(g.connect('d', 'c').reason, 'szabaly');
  assert(g.connect('a', 'd').ok); eq(g.connect('c', 'd').reason, 'keret');
});
t('háló: részek + elszigetelt pontok', () => {
  const g = V.create({ nodes:NODES }); g.connect('a', 'b'); g.connect('c', 'd');
  eq(g.components().map(p => p.sort()), [['a', 'b'], ['c', 'd'], ['e']]); eq(g.isolated(), ['e']);
});
t('háló: kritikus pontok és kapcsolatok (lánc és kör)', () => {
  const g = V.create({ nodes:NODES }); g.connect('a', 'b'); g.connect('b', 'c'); g.connect('b', 'd');
  eq(g.articulationPoints(), ['b']); eq(g.bridges().length, 3);
  g.connect('c', 'd');                                    // b–c–d kör: c és d már nem függ b egyetlen élétől
  eq(g.articulationPoints(), ['b']); eq(g.bridges(), [['a', 'b']]);
  g.connect('a', 'd');                                    // mindenki körben → nincs kritikus pont
  eq(g.articulationPoints(), []); eq(g.bridges(), []);
});
t('háló: kritikus pont a gyökérnél (két ág)', () => {
  const g = V.create({ nodes:NODES }); g.connect('b', 'a'); g.connect('b', 'c');
  eq(g.articulationPoints(), ['b']);
});
t('háló: legrövidebb út (lépések + hossz) és zavarás', () => {
  const g = V.create({ nodes:NODES }); g.connect('a', 'b'); g.connect('b', 'c'); g.connect('a', 'd'); g.connect('d', 'c');
  const p = g.shortestPath('a', 'c'); eq(p.hops, 2); eq(p.path, ['a', 'b', 'c']); eq(p.length, 20);
  eq(g.shortestPath('a', 'e'), null);
  const r = g.remove('b'); eq(r.edges.length, 2); eq(g.node('b'), null);
  eq(g.shortestPath('a', 'c').path, ['a', 'd', 'c']);
  assert(g.remove(['a', 'd'])); eq(g.shortestPath('a', 'c'), null); eq(g.remove('zzz'), null);
  const m = g.metrics(); eq([m.nodes, m.links, m.components], [4, 1, 3]);
});

// ---- 4. Kombinálás ----
const KOMB = { slots:4, items:{ alma:{ fresh:3, spoilsTo:'maradek' }, cukor:{}, lekvar:{ fresh:5 }, liszt:{}, tojas:{ fresh:2 }, maradek:{} },
  recipes:[{ id:'lekvar', a:'alma', b:'cukor', out:'lekvar', time:2 }, { a:'liszt', b:'tojas', out:'teszta' }] };
t('kombinál: azonnali recept, sorrend mindegy, felfedezés', () => {
  const b = C.create(Object.assign({ start:['tojas', 'liszt'] }, KOMB));
  const [e, l] = b.list(); const r = b.combine(e.uid, l.uid);
  assert(r.ok && r.discovered); eq(r.item.type, 'teszta'); eq(b.list().length, 1); eq(b.discovered(), ['liszt+tojas']);
  eq(b.book().map(x => x.found), [false, true]);
});
t('kombinál: időzített recept → t kör múlva kész, addig foglal egy helyet', () => {
  const b = C.create(Object.assign({ start:['alma', 'cukor'] }, KOMB));
  const [a, c] = b.list(); const r = b.combine(a.uid, c.uid);
  assert(r.item.process); eq(r.item.left, 2); eq(b.free(), 3);
  let ev = b.tick(); eq(ev.events.filter(x => x.kind === 'kesz').length, 0); eq(b.list()[0].left, 1);
  ev = b.tick(); const k = ev.events.find(x => x.kind === 'kesz'); eq(k.item.type, 'lekvar'); eq(b.list()[0].fresh, 5);   // frissen készül, ebben a körben nem romlik
  eq(b.combine(b.list()[0].uid, b.list()[0].uid).reason, 'ugyanaz');
});
t('kombinál: folyamatban lévővel nem kombinálható, recept nélkül sem', () => {
  const b = C.create(Object.assign({ start:['alma', 'cukor', 'liszt'] }, KOMB));
  const [a, c, l] = b.list(); eq(b.combine(a.uid, l.uid).reason, 'nincs-recept');
  const p = b.combine(a.uid, c.uid).item; eq(b.combine(l.uid, p.uid).reason, 'folyamatban');
});
t('kombinál: hely korlát', () => {
  const b = C.create(KOMB); for(let i = 0; i < 4; i++) assert(b.add('liszt')); eq(b.add('liszt'), null); eq(b.free(), 0);
});
t('kombinál: frissesség-lépcsők, romlás spoilsTo-ra vagy eltűnés', () => {
  const b = C.create(Object.assign({ start:['alma', 'tojas', 'cukor'] }, KOMB));
  b.tick(); eq(b.list().map(i => i.fresh), [2, 1, null]);
  const ev = b.tick(); eq(ev.events.filter(e => e.kind === 'romlott').map(e => e.item.type + '>' + (e.to ? e.to.type : '-')), ['tojas>-']);
  b.tick(); eq(b.list().map(i => i.type), ['maradek', 'cukor']); eq(b.turn(), 3);
});

console.log(`Mechanikák: ${n} próba, ${n - fails.length} rendben`);
if(fails.length){ fails.forEach(f => console.log('❌ ' + f)); process.exit(1); }
console.log('✓ minden rendben');
