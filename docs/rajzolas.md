# Rajzolási mérce – „B szint” (2D matrica és 3D modell)

> **Döntés (2026-09-17, Kristóf):** minden új vagy átdolgozott illusztráció **2D-ben a B – Kidolgozott**, **3D-ben a B – Közepes**
> szinten készül. Ez a mérce minden design-fájlra érvényes, amit Claude (vagy egy rajzoló ügynök) készít.
> **Etalon:** `docs/rajzolas/etalon-mosogep.jpg`, `etalon-ledizzo.jpg`, `etalon-sajt.jpg` (A / B / C összevetés, a B a jóváhagyott) ·
> **mintakód:** `docs/rajzolas/minta/` · **megbízás-sablon:** `docs/rajzolas/rajzolo-brief.md` ·
> stílus-szabályok: `docs/grafika-spec.md` · a mért beeco-stílus: `docs/promptolas.md` 1. pont.

## 1. 2D matrica – B „Kidolgozott”

| Szempont | B szint |
|---|---|
| Alakzatok | **10–20** (a díszjelekkel együtt) |
| Tónusok | a fő felületeken **4 éles tónus**: világos (teteje, fény felőli lap) · alap (eleje) · sötét (oldala) · legsötétebb élsáv – színátmenet nincs |
| Nézet | **3/4-es**: látszik a teteje vagy az oldala; a tárgy **megdöntve 10–30°** (`tilt`) – dobozszerű tárgy **balra** (negatív fok), mert jobbra „eldőlőnek” hat; hengeres tárgy bármerre |
| Perem és árnyék | fehér kivágott perem + **tömör olíva árnyék jobbra-le**: `shadow:'hard'` (a beeco eredetiken mért érték) |
| Részletek | a **jellegzetes** részletek rajzolva – amiről ránézésre megismerni és **megkülönböztetni** (mosógép: ablak vízzel és ruhával, gomb, fiók · LED-izzó: tejfehér búra, bordás nyak, menet · sajt: árnyékolt lyukak, a szélen „harapott” lyuk); **1–2 fénycsík** |
| Módszer | a tárgyat **valódi méretekben** írjuk le, és **vetítjük** (`ART.geo.camera`) – így a 3/4-es nézet pontos; a 2D és a 3D **ugyanabból a méretlistából** épül (minta: `minta/ledizzo/profil.js`) |
| Olvashatóság | **48 px-en is tiszta** (a `node tools/art-render.js 2d` kiteszi 48 és 32 px-en is) |
| Méret | **≤ 10 KB** SVG matricánként (koordináta 1 tizedes, a sűrű mintavételt kerüld – a `check-art` jelzi) |
| Beépítve | **2075** mind a 77 repülő matricája (`art-nature-b.js`, `art-things-b.js`, `art-food.js`, `art-extra.js`, `art-office.js`, `art-home.js` + a korábbi B készülékek) |
| Beépítve | **Ökos-rejtély** matricái: a 20 készülék (`art-devices.js`) és 17 háztartási tárgy (`art-home.js`: izzó, tv, zuhany, kád, wc, csap, sál, ablak, zseblámpa, kulcs, papírtekercs · `art-nature.js`: hőmérő, elem, villásdugó · `art-office.js`: füzet, kódzár, számla) |
| Beépítve | **Mi van mögötte? termékei** (`art-imp.js` + a Greenwashing készletéből – mind a 12 termék) |
| Beépítve | **Greenwashing-vadász termékei** (`art-gw.js`, `art-gw-b.js`, `art-gw-c.js`, `art-gw-d.js`: ~59 bolti termék) és az **öko-pecsét keretek** (`art-pecset.js`, 12 féle – a kitalált márkák pecsétje és az engedélyköteles hivatalos jelek helykitöltője) |
| Beépítve | **Szelektálj! mind a 60 kódmatricája** (`art-waste.js` papír, műanyag-fém, üveg · `art-waste-b.js` kommunális, bio, olaj · `art-waste-special.js` elem, textil, veszélyes · `art-waste-special-b.js` e-hulladék, gyógyszer, zöldhulladék); a beeco saját képei (66 hulladék) változatlanok |
| Beépítve | **Hűtő-mester mind a 33 étele** (`web/js/art/art-huto.js`: hűtős ételek + sajt, `art-huto-kamra.js`: zöldség, gyümölcs, kamra) – a `check-art` a döntést (`tilt`) és a nagyítást (`scale`) is figyelembe veszi a kilógás-ellenőrzésnél |

Nem B szint (csak külön kérésre): **A – Tiszta ikon** (4–8 alakzat, szemből) kifejezetten 24–32 px-es lista-ikonhoz; **C – Gazdag**
(20–45 alakzat, lapokra tört felületek) egy-egy nagy, „hős” képhez.

## 2. 3D modell – B „Közepes”

| Szempont | B szint |
|---|---|
| Háromszög | **300–1 200** (keret: `node tools/model-check.js`) |
| Forma | fő test **letört élekkel** (`chamferBox`), körök **12–16 szegmensből**; a jellegzetes részletek **külön elemként** (ajtókeret, gomb, fiók, bordák, menet, lyukak) |
| Színek | **4–6** lapos szín az `ART.MAT` palettából (`'steel:1'`), textúra nincs |
| Méret, irány | valódi méret méterben · Y fel · +Z = eleje · talp y = 0 |
| Eszközök | `web/js/art/model-kit.js` (box, chamferBox, hull, cylinder, lathe, sphere, torus, extrude) – **a játékban** `MODEL.model()…toThree(THREE, { material })` építi fel (GLB-betöltő nem kell); Node-ban `tools/modell-kit.js` → `.save('x.glb')`; megtekintés: `tools/modell-nezo.html`; kép: `node tools/art-render.js 3d` |
| Beépítve | **Hűtő-mester konyhája** (`web/js/huto-modellek.js`: asztal, hűtő fagyasztóval, ajtó, polcrendszer, fal csempével, szekrényekkel és ablakkal – egy sorban a fal tövében; a méreteket a `DIM` adja, ebből számol a `huto-konyha.js`; az üveg részek áttetszők) |
| Beépítve | **Ökos-rejtély háza** (`web/js/rezsi-modellek.js`: hűtő régi/új, mosó- és szárítógép, mosogatógép, kazán, gázóra, villanyóra-szekrény, radiátor, termosztát, kád, WC, zuhany, esővízgyűjtő, tömlődob, vízóra – a haz.json méreteiből; beillesztés: `rezsi-gepek.js`) |
| Beépítve | **Szelektálj! pályái** (`web/js/szelektalj-modellek.js`: 4 féle kuka – kerekes kuka, gyűjtődoboz, olajgyűjtő hordó tölcsérrel, üveggyűjtő harang –, léckerítés, almafa, bokor, magaságyás, kandeláber, futószalag, válogatógép, csarnoklámpa, cső, csónak; a játékban `mkModel()` teszi Three-csoporttá, az azonos tárgyak egy modellbe vonva) |

**Fény-tanulságok (a játék cel-árnyalásában):**
- Tiszta **fehér** test „kiég” (teteje és oldala egy sávba esik): testnek `white:2`, a kiemelt felső lapnak `white:1`, a fémnek `steel:2`.
- **Méz-sárga** étel citromsárgává válik: testnek `gold:1`, a felső lapnak `honey:2`.
- Fehér búra/gömb teteje tisztán fehér lesz – ha zavaró, törtfehér (`cream`, `white:2`).
- Átlátszó üveg: a modell-nézőben nincs; **a játékban** a `toThree` `material` visszahívásával a `glass:*` színek áttetszők lehetnek (Hűtő-mester fiók, ajtórekesz).
- Világos konyhában a világos tárgynak **sötét kontúr-keret** kell (`dark:1` tömítés, peremek) – különben beleolvad a háttérbe.

## 3. Munkafolyamat – így készül minden új design-fájl

1. **Méretlista és jellegzetes részletek:** mekkora a tárgy, mi különbözteti meg a hozzá hasonlótól (pl. LED ↔ hagyományos izzó).
2. **Rajzoló megbízás** a `docs/rajzolas/rajzolo-brief.md` sablonból – tárgyanként vagy kis csoportonként, párhuzamosan
   (egyszerre legfeljebb 2–3 rajzoló, hogy a munkamenet használati kerete ne fogyjon ki).
3. **Render és önellenőrzés:** `node tools/art-render.js 2d …` / `3d …` → a képet megnézni, **legfeljebb 3 javító kör** szintenként.
4. **Ellenőrzés:** `node tests/check-art.js`, `node tools/model-check.js`; Claude átnézi a képeket, és **előtte/utána táblát** küld Kristófnak.
5. **Beépítés, böngészős teszt, élesítés** (a játékok a matricát `artIcon()` / `ART.image()` útján kérik – a kód nem változik).

## 4. Hátterek – A / B / C minták (döntésre vár, 2026-09-17)

A matricák és 3D tárgyak után a hátterek maradtak (talaj, ég, épületek, falak, víz). Öt helyszínre készült minta három
kidolgozottsági szinten, a játék valódi nézetében fotózva: `node tools/hatter-minta/fotoz.js <mappa>` → `hatter-mintak.png`.

| Szint | Mit jelent a háttérnél | Költség |
|---|---|---|
| **A – Tiszta** | 1–2 közeli tónus, nagy nyugodt foltok, sima színek | a legkönnyebb |
| **B – Kidolgozott** | 3–4 éles tónus, apró ismétlődő motívumok (fűcsomó, virág, hullám, ablakkeret), néhány 3D elem (felhők, lebegő méhsejt-szigetek, napellenzők) | +0–30 rajzolási hívás pályánként |
| **C – Gazdag** | B + élet és 3D részletek (3D fű, madarak, szélkerék, erkélyek, fák, bálák, világítótorony, vitorlások) | +10–40 rajzolási hívás; mobilon figyelni kell |

Helyszínek és mintakód: fű + égbolt `tools/hatter-minta/kert.js` · utcakép `utca.js` · gyárcsarnok + tenger `gyar-tenger.js`
(közös segédek: `kozos.js`). **Kristóf döntése (2026-09-17): a C megy mindenhová**, és ha a teljesítmény megkívánja, vissza lehet venni – ezért a játékban
`web/js/hatter.js` (közös segédek, minőség-őr, fű, égbolt) és `web/js/hatter-palyak.js` (utca, gyár, tenger). A C-szintű ráadás-elemek a
`HATTER.extra()` listába kerülnek: a minőség-őr 2 mp bemelegedés után 5 mp-ig méri a képfrissítést, és 40 kép/mp alatt elrejti őket (= B szint).
Kézi váltás: `?hatter=B` vagy `?hatter=C` (megjegyzi, és kikapcsolja az őrt).
A fotózó: `tools/jatek-foto.js` – láthatatlan böngésző, nem kell hozzá dev-szerver, a WebGL-kép is friss.
