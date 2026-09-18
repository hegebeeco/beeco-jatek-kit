# 2D háttér-jelenetek és áramlás-mozgás

> Élő bemutató: `web/hatterek.html` · ellenőrzés: `node tests/check-hatter2d.js` · böngészős kép: `node tools/jatek-foto.js <cfg.json>`
> (`"root":".../beeco-jatek-kit/web"`, `"path":"/hatterek.html"`).

A 2D (DOM- vagy vászon-alapú) játékok háttere eddig sima szín vagy CSS-minta volt; a 3D játékok C szintű díszletet kaptak
(`docs/rajzolas.md` 4. pont). Ez a készlet a 2D játékoknak ad **C-gazdagságú, de könnyű** háttereket: minden jelenet **egyszer**
rajzolódik egy `<canvas>`-ra, és csak átméretezéskor újra – játék közben nem kerül semmibe. A játék a vászon FÖLÉ teszi a saját elemeit.

## 1. Betöltés

```html
<script src="js/pics.js"></script><script src="js/ds.js"></script><script src="js/art/art.js"></script>   <!-- színek: DS + ART.MAT -->
<script src="js/hatter2d/alap.js"></script>     <!-- MINDIG elsőként -->
<script src="js/hatter2d/varos.js"></script>    <!-- csak amelyik kell -->
<canvas id="bg" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
```
A vászonnak **CSS-méret** kell – a rajz ehhez igazodik, a képpontsűrűséggel (legfeljebb 2×) együtt. Az átméretezést egy
`ResizeObserver` figyeli, képkockára összevonva.

## 2. Jelenetek – `beecoHatter2D`

Mindegyik visszaad egy kezelőt: `{ redraw(újBeállítás), destroy() }`. A `seed` (egész szám) dönti el az elrendezést:
**ugyanaz a seed → ugyanaz a kép** (a tesztek ezt ellenőrzik).

| Hívás | Mit rajzol | Beállítások |
|---|---|---|
| `varos(canvas, o)` | város: házsor térhatású dobozokkal, ablakrács, távoli sziluett, talaj | `variant:'szmog'` (ma: kémény füsttel, klíma, autósor, barnás pára) · `'zold'` (2075: napelem, zöldtető, tetőkert, szélkerék, fák, bicikliút, madarak) · `seed:2075` |
| `varosJovo(host, o)` | a két városváltozat egymáson, egy elemben | `seed`, `value:0` → `set(0–1)`: a **jövő-mérő** a zöld réteg átlátszóságát állítja (a keverés ingyen van) |
| `konyha(canvas, o)` | csempés fal, ablak éggel és függönnyel, polcok befőttes üvegekkel, pult szekrényekkel, hűtő mágnesekkel, lámpa, cserepes növények, fapadló | `seed:7`, `fridge:true`, `lamp:true` |
| `kert(canvas, o)` | sávos ég, nap, felhők, két domb-sor, almafák és tuják, léckerítés, méhkaptár, nyírt rét virágokkal, méhecskék röppályával | `seed:3`, `hive:true`, `bees:3` (0–6) |
| `mehsejt(canvas, o)` | a főmenü méhsejt-mintája, paraméterezve, színfoltokkal és halványan kitöltött sejtekkel | `density` (0 ritka – 1 sűrű) vagy `size` (px) · `opacity:.1` · `color:'honey-deep'` · `bg:'cream'` · `fill:.06` · `spots:[{ x, y, r, color, a }]` |
| `mehsejtCSS(o)` | ugyanaz vászon nélkül: CSS `background` érték (SVG-csempe + foltok + token-alap) | mint fent; statikus oldalra ez a könnyebb |

**Tiszta segédek (Node-ban is):** `varosLayout(W, H, seed)`, `konyhaLayout(…)`, `kertLayout(…)` – hol mi áll (pl. `konyhaLayout().counter`
a pult teteje, `kertLayout().lawn` a rét teteje: ide teheti a játék az elemeit) · `hexCenters(W, H, r)` · `rng(seed)`.

**Álló képernyőn** (telefon) az elrendezés alkalmazkodik: az alapegység a kisebbik oldalhoz mérődik, a konyhában keskenyebb
az ablak és a hűtő a szélre csúszik, a kertben a kaptár beljebb kerül.

### Színek
Csak `ART.MAT` (anyag-tónusok: világos · alap · sötét · kontúr) és `DS.color` / tokenek. **Kivétel:** a palettán kívüli *tartalom-szín*
(pl. a szmogos város szürkéi és barnái) névvel, egy `const SZIN = { … };` blokkban – a teszt csak ott enged nyers színt.

## 3. Áramlás-mozgás – `DS_FLOW` (`js/aramlas.js` + `css/aramlas.css`)

Pöttyök, amelyek egy vonal mentén haladnak: beporzó a kapcsolaton, víz a csőben, áram a vezetéken.

```js
const h = DS_FLOW.along(svgPathVagyLine, { dots:4, speed:60, color:'honey', size:9, reverse:false, both:false });
DS_FLOW.stop(h);
const f = DS_FLOW.canvas(ctx, [[x, y], …], { dots:5, speed:80, color:'leaf', size:8 });   // a játék ciklusában: f.draw(most)
const g = DS_FLOW.canvas(ctx, pontok, { auto:true, before:(ctx) => rajzoldAHatteret() });  // vagy saját ciklus
```
* `speed` képernyő-pixel/másodperc (a vonal hosszából számol) · `dur` = egy kör ideje mp-ben · `both` = minden második pötty visszafelé megy ·
  `color`: `honey · leaf · sky · blossom · ember · berry · cream · paper · olive` (csak a palettából).
* Az SVG-elem lehet `path`, `line`, `polyline`, `polygon`; a pöttyök közvetlenül mellé kerülnek, ugyanabba a koordináta-rendszerbe.
* **Miért `<animateMotion>`?** A mozgatást a böngésző végzi: nincs JS minden képkockán, a háttérbe tett lapon magától áll, és a
  `viewBox`-szal együtt nyúlik. A `requestAnimationFrame` + `getPointAtLength` pöttyönként, képkockánként futna – ezt csak a
  vászon-változat használja, ahol úgyis a játék rajzol. A pötty egy nulla hosszú, kerek végű vonal `non-scaling-stroke`-kal, így
  torzított (`preserveAspectRatio="none"`) SVG-ben is kerek.
* **Kevesebb mozgás** (`body.reduce-motion` vagy a rendszer beállítása): a pöttyök **állnak**, kicsiről nagyra nőve – ez mutatja az
  irányt. Futás közbeni váltásra magától átrajzol (egy figyelő az egész oldalra).

**A pontok-összekötése mechanikában** (`mech/vonal-ui.js`) nem kötelező kiegészítő: `MechVonal.mount(el, { …, flow:true })` vagy
`flow:{ dots:2, color:'honey', speed:40, both:true }` → beporzók röpködnek a kapcsolatokon. Az `aramlas.js` nélkül nincs hatása.

## 4. Fájlok
| Fájl | Szerep |
|---|---|
| `web/js/hatter2d/alap.js` | vászon + átméretezés (`mount`), sorsoló, rajz-segédek (doboz, pamacs, felhő, nap, hatszög, sávos ég, virág) |
| `web/js/hatter2d/varos.js` · `konyha.js` · `kert.js` · `mehsejt.js` | a jelenetek |
| `web/js/hatter2d/bemutato.js` | csak a `hatterek.html` vezérlése |
| `web/js/aramlas.js`, `web/css/aramlas.css` | áramlás-mozgás |
| `tests/check-hatter2d.js` | szintaxis, ≤ 200 sor, nincs nyers szín a `SZIN` blokkon kívül, seed-determinizmus, geometria |

## 5. Korlátok
* A jelenetek statikusak (a mozgás a játék dolga; a méhecskék, madarak csak rajzolt jelek).
* A városkeverés átúszás két kép között, nem fokozatos „átépülés” (házanként) – ha kell, a `varosLayout` alapján megoldható.
* Az `<animateMotion>` negatív `begin` értéke a dokumentum-időhöz igazodik: a később beszúrt pöttyök is egyenletesen oszlanak el,
  de nem a vonal elejéről indulnak.
