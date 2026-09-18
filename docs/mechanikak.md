# Játékmechanikák – közös építőelemek

Négy kis, tartalomfüggetlen modul a következő beeco játékokhoz (`docs/jatektervezes.md`). Mindegyik két részből áll:
**logika** (`*-logika.js` – tiszta JavaScript, nincs benne képernyő, Node-ban tesztelhető) és **felület** (`*-ui.js` –
húzás egérrel és ujjal, billentyű-alternatíva, DS-mozgás, „Kevesebb mozgás” tisztelete). Stílus: `web/css/mech.css` (csak tokenek).

* **Élő bemutató:** `web/mechanikak.html` (a minta-adatok absztrakt játékértékek, nem tények).
* **Teszt:** `node tests/check-mech.js` (24 próba) · felület: `node tools/jatek-foto.js <config.json>`.
* **Betöltési sorrend** (a `<body>` végén): `pics.js` → `ds.js` → `art/art.js` (+ a kellő `art-*.js`) → `mech/kozos.js` →
  `mech/<modul>-logika.js` → `mech/<modul>-ui.js`. CSS: fonts → tokens → ds → ds-game → ds-motion → **mech.css** → a játéké.
* Az ikon mezők mindenhol lehetnek emoji (→ B szintű matrica, `artIcon`), piktogram-név (`pic`) vagy szöveg.

## 1. Döntéskártya – `mech/kartya-logika.js` + `kartya-ui.js`
**Kinek:** Polgármester egy napra, Greenwashing-stílusú kártyák. Húzás balra/jobbra dőléssel és pecséttel, gombok, ←/→, kirepülés.
Késleltetett következmény: egy döntés után N kártyával később visszajön egy új kártya.
```js
MechKartya.mount(el, {
  cards:[{ text:'Legyen piac a téren?',
           right:{ label:'Igen', then:{ after:2, card:{ text:'A piac bővítést kér.' } } } }],
  render:(c) => `<p>${c.text}</p>`,
  onDecide:(side, card, kovetkezmeny) => { /* rendszerértékek frissítése */ },
  onEnd:(tortenet) => { /* profil a végén */ },
  labels:{ left:'Nem', right:'Igen' }, threshold:0.3, globalKeys:false });
// csak a logika: const q = MechKartya.queue(pakli, { followUp:(kartya, oldal) => ({ card, after }) });
// q.next() · q.decide(side) · q.schedule(kartya, n) · q.pending() · q.history() · q.done()
```
`after:n` = pontosan n másik kártya jön előtte; ha a pakli elfogy, a függő következmények akkor is sorra kerülnek.

## 2. Rács szomszédsági hatásokkal – `mech/racs-logika.js` + `racs-ui.js`
**Kinek:** Élő kert. Lapka-tálca, koppintás a mezőre (ugyanazzal a lapkával újra = leveszi), Törlés, Vissza (Ctrl+Z),
4 értékmérő (`ds-meter`), mezőnkénti hatás-jelvény és „hőtérkép” a választott értékre. Billentyű: nyilak a rácson, 1–9 lapka, 0 törlés.
```js
MechRacs.mount(el, { w:6, h:5,
  tiles:[{ type:'fa', label:'Fa', icon:'🌳' }, { type:'virag', label:'Virágos', icon:'🌼' }],
  values:[{ id:'elohely', label:'Élőhely', icon:'leaf', min:-5, max:25 }],
  rules:{ metric:'chebyshev', tiles:{
    fa:{ base:{ elohely:2 },                                   // saját érték
         near:[{ type:'virag', radius:1, add:{ elohely:1 }, max:2 }],   // bónusz illő szomszédonként
         aura:{ radius:1, add:{ ho:1 } } } } },                // hatás a környék minden mezőjére (üresre is)
  onChange:(eredmeny) => {} });
// csak a logika: const g = MechRacs.create(6, 5); g.place(x, y, 'fa'); g.neighbors(x, y, 1);
// g.evaluate(rules) → { totals, cells:[{ x, y, tile, values, parts:[{ kind, from, add }] }], cell(x, y) } · g.undo()
```

## 3. Pontok összekötése – `mech/vonal-logika.js` + `vonal-ui.js`
**Kinek:** Beporzó hálózat (zöldfolyosók). Húzás pontról pontra VAGY két koppintás; a vonalra koppintva (vagy Enter/Delete) törlés.
Hatótáv-kör, elérhető pontok kiemelve; **kritikus pont** (ha kiesik, szétszakad a háló) villám-jellel, **kritikus kapcsolat** szaggatott vonallal.
```js
const v = MechVonal.mount(el, { nodes:[{ id:'a', x:10, y:12, type:'ret' }], size:[100, 60],
  types:{ ret:{ label:'Rét', icon:'🌼' } }, maxDist:26, maxLinks:11, maxDegree:4, allow:(a, b) => true, tall:1.5 });
v.remove('a');                 // zavarás: a pont kiesik a kapcsolataival
v.graph.metrics();             // { nodes, links, components, largest, isolated, critical, bridges }
// csak a logika: MechVonal.create(o) → canConnect/connect (reason: tavol · keret · fok · megvan · szabaly),
// components(), isolated(), articulationPoints(), bridges(), shortestPath(a, b) → { hops, length, path }
```

## 4. Kombinálás időzítővel – `mech/kombinal-logika.js` + `kombinal-ui.js`
**Kinek:** Ételmentő, Körforgó háztartás. Tárgyat egy másikra húzva (vagy két koppintással) recept szerint új tárgy lesz – azonnal
vagy t kör múlva (addig időzítő-jelvényes lapka foglal helyet). Korlátozott hely, frissesség-lépcsők (pöttyök), romlás,
receptkönyv, ami felfedezéskor töltődik. „Kamra” sor új tárgyakhoz (opcionális).
```js
MechKombinal.mount(el, { slots:8, turnLabel:'Következő nap',
  items:{ repa:{ label:'Répa', icon:'🥕', fresh:4, spoilsTo:'komposzt' }, komposzt:{ label:'Komposzt', icon:'🪱' } },
  recipes:[{ a:'repa', b:'krumpli', out:'leves', time:2 }], start:['repa'], supply:['repa'],
  onChange:(tabla, esemeny) => {} });   // esemeny.kind: combine · tick · add
// csak a logika: const b = MechKombinal.create(o); b.combine(uidA, uidB) (reason: nincs-recept · folyamatban)
// b.tick() → { turn, events:[{ kind:'kesz' | 'romlik' | 'romlott' }] } · b.book() · b.free()
```
Egy recept egy tárgyat ad (`out`); az elkészült tárgy abban a körben még nem romlik.

## Tudnivalók
* A számok (lépcsők, pontok, korlátok) **játékértékek**; valódi adat csak forrással kerülhet a tartalomba (`docs/jatektervezes.md`).
* Új felület-osztály csak `web/css/mech.css`-be, tokenekkel; ellenőrzés: `node tests/check-arculat.js`.
