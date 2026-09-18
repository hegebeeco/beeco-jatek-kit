# Adatskálák – színek hőtérképhez, élőhelyhez, hálózati terheléshez

A beeco játékokban egyre több helyen mutatunk **mennyiséget színnel**: hőtérkép a rácson, élőhely-érték a kertben,
terhelés egy hálózaton. Erre egységes, a beeco palettájához hangolt **adatskála** van a design systemben
(`web/css/tokens.css` 10. szakasz, JS-párja: `DS.color` + `DS.scale` a `web/js/ds.js`-ben).

## Három szabály
1. **A szín soha nem egyedül beszél.** Mellé mindig szám, jel (+ / −) vagy ikon kerül – a színtévesztő, a napfényben
   tükröző telefon és a fekete-fehér nyomat miatt. (A rács-hőtérképen minden mezőn ott a `+2` / `−1` jelvény.)
2. **Szöveg bármelyik fokozaton ülhet:** az olíva szöveg (`--on-data`) mind a 20 színen eléri a 4,5:1 kontrasztot –
   ezt a `node tests/check-arculat.js` ellenőrzi.
3. **A felület a szerep-tokent használja** (`--data-seq-*`, `--data-neg-*`, `--data-0`, `--data-pos-*`), nem a nyers
   skálát. Így a színtévesztő-barát változat egy osztállyal átkapcsolható.

## Melyiket mikor?
| Skála | Tokenek | Mikor | Példa |
|---|---|---|---|
| **Egyirányú** (szekvenciális), 5 fokozat: halvány zsálya → mély levél | `--scale-1` … `--scale-5` → szerep: `--data-seq-1…5` | Egy érték, amelynek csak „kevés–sok” iránya van, nincs rossz oldala | élőhely-pont, hány méh jár a mezőre, forgalom egy úton |
| **Kétirányú** (divergáló), 5 fokozat: rózsa ← krém → levél | `--div-neg-2`, `--div-neg-1`, `--div-0`, `--div-pos-1`, `--div-pos-2` → szerep: `--data-neg-2 … --data-pos-2` | Előjeles érték, van „jó” és „rossz” irány és egy semleges közép | hűt/melegít, javít/ront, bevétel/kiadás |
| **Színtévesztő-barát** egyirányú: halvány ég → kék | `--scale-cb-1` … `--scale-cb-5` | automatikusan, ha a `.ds-cb` osztály be van kapcsolva | |
| **Színtévesztő-barát** kétirányú: narancs ← krém → kék | `--div-cb-neg-2` … `--div-cb-pos-2` | automatikusan, `.ds-cb` alatt | |

A kétirányú skála pozitív oldala szándékosan ugyanaz a szín, mint az egyirányú 2. és 4. fokozata – így a kettő egy
képernyőn is összeillik (a rácson a plusz értékek az egyirányú skálát, a mínuszok a kétirányú negatív oldalát kapják).

Hogy miért nem piros–zöld: a leggyakoribb színtévesztés (vörös–zöld) mellett a rózsa és a levél is hasonló szürkének
látszhat. A kék ↔ narancs pár ilyenkor is szétválik, és világosságban is eltér.

## Színtévesztő-barát változat bekapcsolása
```html
<html class="ds-cb">   <!-- vagy: document.body.classList.toggle('ds-cb', be) -->
```
A `.ds-cb` csak a `--data-*` szerepeket írja át; a paletta, a gombok és a többi felület változatlan. Beállítás-kapcsolóba
kötése a játék (vagy a közös `keret/beallitasok.js`) dolga – javasolt felirat: „Színtévesztő-barát színek”.

## Használat
**CSS (HTML-felület):**
```css
.cella.is-s3{ background:var(--data-seq-3); color:var(--on-data); }
.cella.is-n2{ background:var(--data-neg-2); }
```
**Érték → fokozat (JS):**
```js
DS.scale.step(7, 10)          // → 4   (1…5; 0, ha az érték 0)
DS.scale.divStep(-3, 10)      // → −1  (−2…+2; a csúcs felénél vált erősebbre)
DS.scale.color(7, 10)                          // → '#A6BF7B'  (vászonra, 3D-be)
DS.scale.color(-8, 10, { signed:true })        // → '#E88FA6'
DS.scale.color(7, 10, { cb:true })             // → színtévesztő-barát párja
```
A vászon és a 3D nem látja a CSS-osztályt – ott a `cb` kapcsolót a játék adja át (pl. `document.documentElement.classList.contains('ds-cb')`).

**Ahol már használjuk:** a Rács mechanika hőtérképe (`web/js/mech/racs-ui.js`, `web/css/mech.css`): plusz → `is-s1…is-s5`,
mínusz → `is-n1` / `is-n2`, a fokozat az aktuális térkép legnagyobb abszolút értékéhez mért.

## Ellenőrzés
`node tests/check-arculat.js` – a tokens.css és a ds.js egyezése, valamint az `on-data` szöveg kontrasztja mind a 20 színen.
