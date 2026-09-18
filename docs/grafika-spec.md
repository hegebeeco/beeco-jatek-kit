# Rajzolási útmutató — beeco illusztrációk („Méhsejt-diorama” matricák)

> A design system része (`docs/arculat.md`). **Kinek:** aki a játékokba bármilyen tárgy-, étel-, készülék-, jelvény-
> vagy díszletképet rajzol – Claude (kódból), a beeco illusztrátora, vagy aki MI-képgenerátorral készít képet.
> **MÉRCE (2026-09-17, Kristóf): új és átdolgozott matrica B – Kidolgozott, 3D modell B – Közepes szinten → `docs/rajzolas.md`**
> (etalon-táblák, mintakód, rajzoló megbízás-sablon). Az alábbi szabályok ennek az alapjai.
> **Élő bemutató:** `web/arculat.html` → „Illusztrációk” · **Ellenőrzés:** `node tests/check-art.js`
> · **Matrica-ív:** `node tools/art-sheet.js ki.png [könyvtár]`

## 1. Mit akarunk elérni

Minden játékban **ugyanaz a matrica-világ**: egy tárgy = egy vidám, lapos, lapokra tört árnyalású matrica,
vastag fehér kivágott peremmel és puha olívazöld árnyékkal – mint a beeco meglévő hulladék-matricái
(`web/assets/items/`). Az emoji helyére kerül (minden telefonon másképp nézett ki), és a régi kódrajzok helyére.

**Három szó:** *felismerhető · barátságos · egyszerű.* Egy 40 px-es ikonként is ránézésre felismerhető legyen.

## 2. A matrica anatómiája

| Réteg | Érték (100×100-as rácson) | Miért |
|---|---|---|
| **Rács** | 100 × 100, a tárgy a **8–92** tartományban, középre | a perem és az árnyék kiférjen |
| **Árnyék** | **tömör olíva `#5A6337`, jobbra-le** (≈ 2,7 és 2,3 egység) – 2026-09-17-től mindenhol (`ART.style.shadow = 'hard'`, a beeco eredetiken mért érték); a régi halvány változat: `shadow:'soft'` | „matrica a papíron” hatás; soha nem fekete |
| **Perem** | fehér, **8 egység** vastag, lekerekített sarkú, a teljes sziluett körül | a beeco-matricák ismertetőjegye |
| **Kitöltés** | az anyag **alapszíne** | – |
| **Lapok** | világos háromszög **bal-fent**, sötét háromszög **jobb-lent** (henger: függőleges csíkok, lapos tárgy: vízszintes sávok) | „low-poly”, lapokra tört árnyalás – nincs színátmenet |
| **Kontúr** | az anyag **sötét kontúrszíne**, 1,6 egység | kicsiben is olvasható forma; nem fekete |
| **Fénycsík** | fehér, 55% átlátszóság, a világos oldalon | csillogás üvegen, fémen, gyümölcsön |
| **Részletek** | vékony vonal (2–2,5), pötty – legfeljebb ~6 | címke, varrás, kupak; semmi apró zaj |

**Fény mindig bal-fentről.** Nézet: **szemből** vagy enyhe **3/4-es** (dobozszerű tárgy: három látható lap: teteje
világos, eleje alap, oldala sötét). Egy matricán **egy tárgy** (kivéve, ha a tárgy maga csoport, pl. gyógyszeres levél).

## 3. Anyag-paletta (`ART.MAT` – `web/js/art/art.js`)

Minden anyagnak négy tónusa van: **világos · alap · sötét · kontúr**. A felismerhető valós színt választjuk,
de a beeco palettájára hangolva (meleg, kissé tompított; semmi neon, semmi tiszta fekete).

| Anyag | Mire |
|---|---|
| `honey` `gold` | méz, sárga tárgy, nap, villanykörte, banán, érme |
| `leaf` `grass` `sage` `teal` | növény, zöld tárgy, zöld címke |
| `sky` `water` `glass` `blue` | víz, jég, üveg, hűtés, farmer, kék tárgy |
| `red` `tomato` `orange` `ember` `pink` `blossom` `berry` `purple` | gyümölcs, tűz, meleg, piros/rózsaszín tárgy |
| `paper` `cream` `white` `cardboard` | papír, karton, fehér műanyag, porcelán |
| `steel` `dark` | fém, készülék, gumi, képernyő-keret |
| `wood` `soil` `chocolate` `skin` | fa, föld, csokoládé, kenyérhéj, bőr |

Új anyag csak névvel, a `MAT`-ba (négy tónus), és ide a táblázatba.

## 4. Szabályok

**Így:**
- Egyszerű, nagy formák; a sziluett önmagában is elárulja, mi a tárgy.
- **B szint:** 10–20 alakzat, 4 éles tónus, 3/4-es nézet, megdöntve, jellegzetes részletekkel (`docs/rajzolas.md`); a lekerekítés barátságos (rx 2–6).
- A tárgy a keret közepén, nagyjából kitölti a 8–92 tartományt (lapos tárgy lehet alacsonyabb).
- Élelmiszernél étvágygerjesztő, meleg tónus; hulladéknál is „tiszta, rendes” tárgy (nem undorító).
- Ami hiteles jel (öko-címke, tanúsító logó), azt **nem rajzoljuk meg** – azok valódi logók (`docs/greenwashing-logok.csv`).

**Ne így:**
- Semmi **szöveg, betű, szám, márkanév, valódi logó** a matricán (kivétel: egy-egy semleges jel, pl. „+” az elemen).
- Semmi fotórealizmus, színátmenet, textúra, tükröződés; semmi tiszta fekete (`dark` anyag van helyette).
- Emberi arc a matricán csak ott, ahol a tartalom szereplő (a szereplők külön SVG-k: `rezsi-chars.js`).
- Ijesztő, szomorú vagy bántó kép (rossz választásnál sem) – a „kár” tárgya is semleges (füstölgő kémény, nem halott állat).
- A beeco méhecskét nem rajzoljuk újra: az app illusztrációi vannak (`web/assets/brand/`, `DS.moods`).

## 5. Méretek a felhasználás szerint

| Hol | Méret | Megjegyzés |
|---|---|---|
| 3D matrica (Szelektálj!, Hűtő-mester) | 256 px vászon | a perem miatt a 3D-ben sincs szükség kontúrra |
| 2D kártya, tábla, pakli | 72–120 px | Greenwashing-kártya, Mi van mögötte? termék, 2075 matrica |
| Lista, címke, gomb melletti ikon | 24–40 px | ugyanaz a matrica – ezért kell a nagy, egyszerű forma |
| Jelvény-érem | a `ds-hex` hatszögben ~60% | a hatszög színe a jelvény színe |

## 6. Elnevezés és helyek

- Emojit helyettesítő matrica: rövid magyar név ékezet nélkül (`jegkocka`), `emoji:['🧊']` – **egy matrica több emojit is
  lefedhet** (`📒 📓 📔` → `fuzet`). A játékok az `artIcon('🧊')` / `ART.image('🧊')` segéddel kérik; ha nincs matrica,
  marad az emoji (semmi nem törik el).
- **Célzott matrica** (ha az emoji csak „kölcsön” jel, pl. a Szélturbina 🌬️-je): saját név `emoji:[]`-vel, és a tartalomban
  az elem `sticker` mezője mutat rá (`"icon": "🌬️", "sticker": "szelturbina"`). Így az emoji máshol a saját matricáját kapja.
- Szelektálj! hulladék, amelynek még nincs képe: `i_<hulladék-azonosító>` (pl. `i_szorolap`).
- Hűtő-mester étel: `f_<étel-azonosító>` (pl. `f_maradek`).
- Fájlok: `web/js/art/art-nature.js` (természet, időjárás, energia, állatok, jelek) · `art-home.js` (otthon, szerelvények,
  bútorok, mérőeszközök) · `art-food.js` (ételek, italok) · `art-huto.js` (Hűtő-mester ételei) · `art-things.js` (ruha, közlekedés, vásárlás, díjak) ·
  `art-office.js` (iroda, írószer, technika, jelek) · `art-devices.js` (háztartási gépek, mérőórák, fűtés-hűtés) ·
  `art-extra.js` (célzott matricák, egyéb) · `art-waste.js` + `art-waste-special.js` (Szelektálj! hulladékok).

## 7. Új matrica kódból (Claude)

```js
ART.add('jegkocka', { emoji:['🧊'], hu:'jégkocka', en:'ice cube', shapes:[
  { t:'poly', m:'sky', tone:'light', pts:[[18,30],[52,14],[86,30],[52,46]] },   // teteje
  { t:'poly', m:'sky', tone:'base',  pts:[[18,30],[52,46],[52,90],[18,72]] },   // eleje
  { t:'poly', m:'sky', tone:'dark',  pts:[[52,46],[86,30],[86,72],[52,90]] },   // oldala
  { t:'shine', x:26, y:44, w:5, h:20, rot:-12 },
]});
```
Alakzatok: `rect` (x,y,w,h,r) · `circle` (cx,cy,r) · `ellipse` (cx,cy,rx,ry) · `poly` (pts) · `path` (p – SVG útvonal,
ívvel és görbével is; a készlet a görbéken mér) · `line` (pts, w) · `shine`. Beállítások: `m` anyag, `fc` lap-mód
(`d` átlós · `v` henger · `h` lapos · `none`), `tone` (egy tónus, lapok nélkül), `rot` (fok) + `ox`/`oy` forgatási pont
(alapból az alakzat közepe), `d:true` (dísz: nem kap peremet), `line:false` (nincs kontúr), `o` átlátszóság, `box:[x,y,w,h]`
(kézi befoglaló doboz – ritkán kell). Matrica-szinten: `scale` (pl. `.92` – az egész matrica kicsinyítése, ha a perem kilógna).

**Közös rajz-segédek** (`ART.geo`, ne írd újra fájlonként): `band(pts, w, cap)` vastag, peremet kapó vonal (szár, kábel,
pipa, szélfuvallat) · `leaf(x, y, fok, hossz, szélesség)` levél-útvonal · `star(cx, cy, Rkülső, Rbelső, ágak)` · `arc(cx, cy, r, fok0, fok1)`
körív-pontok · `R`, `r1`, `rad`. Egy fájlon belüli saját segédeket függvénybe (`(function(){ … })();`) zárd, hogy ne legyenek globálisak.

**Vásznon és 3D-ben:** `ART.draw(ctx, '🧊', x, y, méret, betöltéskor)` – középre rajzol; ha a kép még töltődik, `false`-t ad
és betöltéskor meghívja a függvényt (pl. `texture.needsUpdate = true`). HTML-ben `artIcon()`, piktogrammal vegyesen `dsIcon()`.
Utána: `node tools/art-sheet.js ki.png <könyvtár>` → **nézd meg a képet**, és javíts, amíg 40 px-en is felismerhető;
végül `node tests/check-art.js` (a kilógást az útvonalaknál is méri).

> **Fájlméret:** az `art-*.js` fájlok rajz-*adatok*, ezért lehetnek 200 sornál hosszabbak; ha egy könyvtár 800 sor fölé nő (B szinten egy matrica a vetítő segédekkel együtt hosszabb),
> bontsd témák szerint (pl. `art-waste-bio.js`) – a betöltő lista az `index.html`-ben és az `arculat.html`-ben van.

## 8. Csere szebb képre (MI-képgenerátor, illusztrátor) és 3D modellek

Bármelyik kódmatrica lecserélhető kész képre úgy, hogy **a játék kódja nem változik**. A teljes, lépésenkénti útmutató – a beeco
eredeti matricáin **mért** stílus-szerződéssel, eszközönkénti tippekkel, javító promptokkal és a 3D (GLB) úttal: **`docs/promptolas.md`**.

Röviden:
1. Prompt: **`docs/illusztracio-promptok.csv`** (`node tools/art-prompts.js` – tárgy + színek a kódmatricából + kompozíció + stílus + tiltások);
   stílus-referencia a generátorhoz: `docs/promptolas/stilus-referencia.jpg`; vázlat: `node tools/art-png.js <mappa> [könyvtár]`.
2. Kép: **512 × 512 vagy nagyobb PNG, átlátszó háttér**, a perem és az árnyék a képben (lásd a promptolási útmutató 1. pontját),
   fájlnév = a matrica neve.
3. `python3 tools/art-import.py <png-mappa> --dry` → minőség-ellenőrzés; utána ugyanez `--dry` nélkül: WebP-be tömöríti
   (`web/assets/art/`) és beírja a `web/data/art-override.json`-ba.
4. 3D: `docs/modell-promptok.csv`, bemenet `node tools/art-png.js <mappa> --flat`, ellenőrzés `node tools/model-check.js`,
   megtekintés `tools/modell-nezo.html`.

A régi prompt-listák (`docs/matrica-promptok.csv`, `docs/matrica-promptok-huto.csv`, `docs/impact-matrica-promptok.csv`) helyett az új CSV-t használd.

## 9. Ellenőrzőlista új illusztrációhoz

- [ ] Egy tárgy, középen, 8–92 között; fény bal-fentről; perem és árnyék megvan.
- [ ] Csak `ART.MAT` anyagok; nincs szöveg, logó, tiszta fekete, színátmenet.
- [ ] 40 px-en is felismerhető (a matrica-íven kicsiben is megnézve).
- [ ] Emoji-matricánál minden érintett emoji fel van sorolva; hulladék/étel: `i_` / `f_` név.
- [ ] `node tests/check-art.js` zöld; a `arculat.html` „Illusztrációk” galériájában jól mutat.
