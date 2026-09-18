# 3D készlet és világ – modellek + háttér bármelyik beeco-játékhoz

> Mi ez? A Szelektálj!, a Hűtő-mester, az Ökos-rejtély és a Fenntartható otthon **kódból épített 3D tárgyai** (B szint),
> plusz a játék **C szintű háttere** (ég, felhők, lebegő szigetek, fű, rét) önálló, paraméterezhető modulként.
> Nincs GLB-fájl és nincs betöltő: minden tárgy néhány sor JavaScript, ami a böngészőben épül fel – kicsi, gyors, és
> a színei a design systemből jönnek.
> Élő bemutató: **`web/modellek.html`** (galéria) és **`web/vilag.html`** (háttér kapcsolókkal).

## 1. Mi van benne?

| Fájl | Globális név | Mit ad |
|---|---|---|
| `web/js/3d/szelektalj-modellek.js` | `SZ_MODELS` | kuka (4 valódi forma: kerekes, gyűjtődoboz, olajos hordó, üvegharang), léckerítés, almafa, bokor, magaságyás, kandeláber, futószalag, válogatógép, csarnoklámpa, cső, csónak |
| `web/js/3d/huto-modellek.js` | `HUTO_MODELS` (+ `.DIM`) | hűtő fagyasztóval, hűtőajtó, polcrendszer, konyhapult, fal szekrényekkel és ablakkal |
| `web/js/3d/rezsi-modellek.js` | `RZ_MODELS` | hűtő (régi/új), mosó- és szárítógép, mosogatógép, kazán, gázóra, villanyóra-szekrény, radiátor, termosztát, kád, WC, zuhany, esővízgyűjtő, tömlődob, vízóra – **részeket** ad vissza (`{ body, heat, … }`) |
| `web/js/3d/otthon-modellek.js` | `OT`, `OT_MODELS` | a hatszögletű fa ház fala, váza, asztala, tábla-állványa, jelvény-érme |
| `web/js/vilag/vilag-modellek.js` | `VILAG_MODELS` | felhő, lebegő méhsejt-sziget, szélkerék, házikó, madárraj, a sziget földrétegei, egyszerű fa és bokor |
| `web/js/vilag/vilag-fold.js` | `VILAG_FOLD` | füves textúra (nyírás-csíkok, virágok, lóhere), füves sík, hatszögletű sziget, virágos rét |
| `web/js/vilag/vilag.js` | `beecoVilag()` | az egész háttér egy hívással (lásd 3.) |
| `web/js/3d/katalogus.js` | `MODEL_CATALOG` | minden modell listája alap méretekkel és a **másolható hívással** – ebből dolgozik a galéria és a teszt |
| `web/js/3d/orbit.js` | `beecoOrbit()` | kis körbeforgató kamera (egér, ujj, görgő, billentyű), külső könyvtár nélkül |

A négy modell-fájl a játék (`beeco-szelektalj/web/js/*-modellek.js`) másolata **változatlan névvel és aláírással**, így
a játék később a kit példányát töltheti be. Két eltérés: a `szelektalj-modellek.js` Node-ban a kitben is megtalálja a
`ds.js`-t, és az `otthon-modellek.js` tábla-állványa B szintre került (letört élű lábak, talpak – a méretek azonosak).

## 2. Egy tárgy a játékodba

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="js/ds.js"></script>
<script src="js/art/art.js"></script>
<script src="js/art/model-kit.js"></script>
<script src="js/3d/szelektalj-modellek.js"></script>
```
```js
const m = SZ_MODELS.bin(MODEL, 'papir', MODEL.hexOf('blue:1'));          // a hívást a galériából másold
const g = m.toThree(THREE, { material: hex => new THREE.MeshToonMaterial({ color: hex, gradientMap: GRAD }) });
scene.add(g);
// részekre bomló modell (Ökos-rejtély): const p = RZ_MODELS.washer(MODEL, 1.2, 1.6, 1.2, false); scene.add(p.body.toThree(THREE, …));
```
Több egyforma tárgy (pl. 12 fa) → egy modellbe vond: `const T = MODEL.model(); T.merge(fa, { t:[x, 0, z] })…` – így
színenként egyetlen rajzolási hívás lesz, ez kell a mobilos 30 kép/mp-hez.
Üveg áttetszőn: a `material(hex, szín)` második paramétere a színnév – `szín.startsWith('glass')` → `transparent:true, opacity:0.5`.

## 3. A háttér (világ) egy hívással

```html
<!-- a 2. pont szkriptjei után -->
<script src="js/3d/szelektalj-modellek.js"></script>   <!-- nem kötelező: ha itt van, a réten almafák nőnek -->
<script src="js/vilag/vilag-modellek.js"></script>
<script src="js/vilag/vilag-fold.js"></script>
<script src="js/vilag/vilag.js"></script>
```
```js
renderer.outputEncoding = THREE.sRGBEncoding; renderer.shadowMap.enabled = true;   // mint a játékokban
const V = beecoVilag(THREE, scene, { island: true, meadow: { inner: 7 } });
// a képkocka-ciklusban:
V.tick(dt, camera);            // felhők sodródnak, madarak repülnek, szélkerék forog, a nap a kamera felé fordul, minőség-őr mér
V.setTime('alkony');           // 'nap' | 'alkony' | 'este' – ég, köd, fények (csak palettaszínek)
V.setQuality('B');             // 'B' | 'C' – kézi váltás (a minőség-őrt is kikapcsolja: quality:'B' vagy 'C' az opciókban)
V.dispose();                   // mindent eltávolít és felszabadít (pálya-váltáskor)
```

**Opciók** (mind elhagyható): `quality` `'auto'` (alap: C + minőség-őr) | `'B'` | `'C'` · `onQuality(q, fps)` ·
`sky` · `sun` · `clouds` (db, alap 14) · `islands` (lebegő szigetek) · `birds` · `ground` (füves sík – alapból akkor, ha
nincs sziget) · `groundSize` · `island` (`true` vagy `{ R, x, z }`) · `meadow` (`true` vagy `{ inner, outer, trees,
bushes, tufts, flowers, free(x, z) }` – a `free` a játéktér szabadon hagyandó részét adja meg) · `lights` (a
`DS.light.outdoor` nap- és égbolt-fénye; kapcsold ki, ha a játéknak saját fénye van) · `shadowBox` · `fog` · `time` ·
`seed` (más mag = más, de ismételhető elrendezés) · `skyR` (az égbolt sugara; a kamera `far` értéke ennél nagyobb legyen).

**Visszaad:** `root`, `groups` (`sky`, `sun`, `clouds`, `islands`, `birds`, `lights`, `ground`, `island`, `meadow`),
`lights.{hemi, sun}`, `setQuality`, `setTime`, `tick`, `dispose`, és a közös segédek: `toon(szín)`, `model3(modell, árnyék)`
(modell → Three-csoport a világ cel-árnyalásával), `extra(obj)` (saját C-ráadás felvétele).

**Minőség-szintek** (`docs/rajzolas.md` 4.):
* **B** – ég (háromsávos, mézes horizont), nap, 3D felhők, 3 lebegő sziget, füves talaj / sziget, fák és bokrok.
* **C** – B + madárraj, szélkerék, házikó, még 2 sziget, nap-udvar, 3D fűszálak, kövek, virágok.
* **Minőség-őr** (`quality:'auto'`): 2 mp bemelegedés után 5 mp-ig méri a képfrissítést; 40 kép/mp alatt B-re vált.
  A rejtett lap vagy szünet (fél mp-nél hosszabb kihagyás) újraindítja a mérést.

## 4. B szint – emlékeztető (`docs/rajzolas.md` 2.)

* **300–1 200 háromszög** tárgyanként (a teszt 50 alatt és 2 000 felett hibát ad, a sávon kívül figyelmeztet).
* Fő test **letört élekkel** (`chamferBox`), körök **12–16 szegmensből**, jellegzetes részletek külön elemként.
* **4–6 lapos szín** az `ART.MAT` palettából (`'steel:1'`), textúra nincs; tartalom-szín (kuka) is palettából: `MODEL.hexOf('blue:1')`.
* Valódi méret, **Y fel, +Z = eleje, talp y = 0** (a Hűtő-mester tárgyai kivételek: az elejük −Z, a fal síkja z = 0).
* Fény-tanulság: a tiszta fehér a cel-fényben kiég → test `white:2`, kiemelés `white:1`, világos tárgyon sötét keret.
* A világban csak `DS.world`, `DS.light`, `ART.MAT` szín – a teszt a nyers hex színt kiszűri.

## 5. Új modell felvétele

1. A builder a megfelelő `web/js/3d/…-modellek.js` fájlba (vagy új fájlba ugyanazzal a mintával: `(K, …) => modell`).
2. Egy tétel a `web/js/3d/katalogus.js`-be: `id`, `group`, `name`, `desc`, `variants: [ v('címke', 'MÁSOLHATÓ HÍVÁS', () => …) ]`.
3. `node tests/check-3d.js` – megépíti, számol, és ellenőrzi, hogy a másolható hívás ugyanazt adja.
4. Nézd meg a galériában (`web/modellek.html#az-id`), ≤ 3 javító kör.

## 6. Ellenőrzés

* `node tests/check-3d.js` – minden modell és változat: háromszögszám, NaN-mentes csúcsok, színek, a hívás egyezése;
  a `vilag` fájlok szintaxisa, hossza (≤ 200 sor) és a nyers színek tilalma.
* Böngésző ablak nélkül: `node tools/jatek-foto.js cfg.json` (`"path":"/modellek.html#rz-washer/1"` vagy `"/vilag.html"`);
  a lapok `window.GALERIA.show(id, változat)` és `window.VILAG_DEMO` segédet adnak a képernyőképhez.

## 7. Ismert korlátok

* A játék beállítása (sRGB kimenet + nyers palettaszín) a sima színű felületeket erős napfényben kivilágosítja (a méz-sziget
  oldala, a fehér gépek). Ez a játék jelenlegi kinézete – a galéria szándékosan ugyanígy mutatja; csak a galéria saját
  kis szigete kap lineáris színt.
* A `szelektalj-modellek.js` (217 sor) és a `rezsi-modellek.js` (247 sor) 200 sor fölött van – a játék eredetijével
  együtt érdemes kettébontani (pl. kukák / pálya-tárgyak; konyha-fürdő / gépészet).
* Néhány kis tárgy (termosztát, vízóra, érme, lámpa, házikó) a B-sáv alatt van – kicsik, ez rendben van, de a teszt jelzi.
