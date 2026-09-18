# Promptolás – jobb képek és 3D modellek a beeco stílusban

> **Kinek:** aki MI-képgenerátorral vagy 3D-generátorral matricát / modellt készít a játékokhoz (Kristóf, beeco csapat, illusztrátor).
> **Mit kapsz:** kész promptot minden matricához, referenciaképeket, és két ellenőrző eszközt, ami megmondja, jó-e az eredmény.
> Kapcsolódó: rajzolási szabályok `docs/grafika-spec.md` · design system `docs/arculat.md`.

## 1. A „stílus-szerződés” – mit mértünk a beeco eredeti matricáin

A promptok nem ízlésből, hanem **mérésből** írják le a stílust: a `web/assets/items/` 66 eredeti MI-matricáját pixelre megmértük
(512 × 512 px-es képeken). Ezt kérjük minden új képtől:

| Jellemző | Mért érték | A promptban |
|---|---|---|
| Fehér kivágott perem | ≈ 15 px (a kép **~3%-a**) | *thick white die-cut border, about 3% of the image width* |
| Árnyék | **tömör** olívazöld ≈ `#5A6337`, **elmosás nélkül**, ≈ 14 px jobbra és 12 px le (**~2,7% / ~2,3%**) | *solid olive-green (#5A6337) drop shadow … lower right … no blur* |
| Kitöltés | a tárgy hosszabbik mérete a kép **80–96%-a** (medián 91%) | *filling about 90% of a square canvas* |
| Nézet | enyhe 3/4-es, gyakran **megdöntve** | *slight three-quarter view, tilted up to about 25 degrees* |
| Árnyalás | lapokra tört (low-poly), 3–4 éles tónus, fény bal-fentről, fehér fényfoltok | *faceted … 3 to 4 hard-edged tones … light from the top left* |
| Kontúr | vékony, a szín sötétebb árnyalata (nem fekete) | *thin outline in a darker shade of each color (never black)* |

**Tanulság a mérésből:** a 66 eredetiből 64 követi a szerződést; az **avar** és a **gyom** pereme fehér helyett sötét – ezek
újragenerálhatók az új promptokkal (sok eredetin a fehér perem körül még egy vékony olíva szegély is fut – ez rendben van).
A kódból rajzolt matricák árnyéka viszont eltér (halvány, egyenesen lefelé) – összevetés: `docs/promptolas/arnyek-osszevetes.jpg`.

## 2. A prompt négy rétege – egy példán (mosógép)

| Réteg | Honnan jön | Példa |
|---|---|---|
| **1. Tárgy** | a matrica angol neve (`en`) + kötelező jellemzők (`look`, ha a név kevés a megkülönböztetéshez) | *front loading washing machine with laundry in water, round glass door in the front, control strip with a dial on top* |
| **2. Színek** | automatikusan a kódmatrica anyagaiból – így a kép a játékban lévő matricához illik | *Main colors: white, light steel grey and clear pale-blue glass.* |
| **3. Kompozíció** | közös | *Exactly one object, slight three-quarter view … filling about 90% … Transparent background.* |
| **4. Stílus + tiltások** | a mért stílus-szerződés; a tiltólista tárgyfüggő (a hüvelykujjnál nincs „hands”, állatnál nincs „faces”) | *Flat vector sticker … Do not include: text, letters, numbers, logos …* |

Miért így? A generátorok a **konkrét, látható** jellemzőt követik jól („round glass door”), az elvont minősítést rosszul („nice, clean”).
A színnevet jobban értik, mint a hex kódot – az árnyéknál mégis megadjuk a hexet, mert ott a pontos szín a lényeg.
A tiltásokat a végén, egy listában adjuk; ahol az eszköznek külön „negatív” mezője van, oda a CSV „Tiltások” oszlopa kerül.

## 3. Lépésről lépésre – 2D matrica

### 3.1 Egyszeri előkészítés (terminálban, a projekt mappájában)

```bash
node tools/art-prompts.js
```
→ `docs/illusztracio-promptok.csv` (296 matrica × teljes prompt, rövid prompt, tiltások) és `docs/modell-promptok.csv` (3D).

```bash
node tools/art-png.js ~/Desktop/beeco-kepek/vazlat devices
```
→ a kódmatricák PNG-ben (itt: a gépek). Kompozíció-vázlatnak csatolható a generátorhoz („ezt rajzold újra szebben”).

**Stílus-referencia** (csatolni kell): `docs/promptolas/stilus-referencia.jpg` – 9 eredeti beeco-matrica egy képen;
ugyanezek egyenként, átlátszó háttérrel: `docs/promptolas/stilus-kepek/` (a Recraft saját stílusához, vagy ahol több referenciakép adható).

### 3.2 Egy matrica elkészítése

1. Nyisd meg a CSV-t (Excel / Numbers), keresd meg a sort (pl. *mosógép*). Jegyezd fel a **Fájlnév** oszlopot: `mosogep.png`.
2. A generátorban **csatold a stílus-referenciát**, és ha van ilyen lehetőség, a vázlatot is (`vazlat/mosogep.png`).
3. Másold be az eszközhöz tartozó oszlopot (5. pont): **Teljes prompt** (ChatGPT / OpenAI, Gemini), **Rövid prompt** + a **Tiltások**
   a negatív mezőbe (Recraft, Ideogram, Firefly), vagy a **Midjourney** oszlop (a `STILUS_KEP` helyére a stílus-referencia képe).
4. Kérj **4 változatot**, és válaszd ki a legjobbat a 3.3 ellenőrzőlista alapján.
5. Ha egy részlet rossz, **ne generálj újra mindent** – javítsd szerkesztéssel a 3.4 javító promptokkal.
6. Mentsd PNG-ként, **átlátszó háttérrel**, a Fájlnév szerinti névvel egy mappába (pl. `~/Desktop/beeco-kepek/kesz/`).
7. Ellenőrzés beemelés nélkül:
   ```bash
   python3 tools/art-import.py ~/Desktop/beeco-kepek/kesz --dry
   ```
   `✓` = rendben · `~` + `⚠` sor = figyelmeztetés (átlátszó háttér, egy darabban van, középen, kitöltés, fehér perem, olíva árnyék).
8. Ha jó, beemelés (a játék kódja nem változik, a matrica helyén a kép jelenik meg):
   ```bash
   python3 tools/art-import.py ~/Desktop/beeco-kepek/kesz
   ```
   Visszaállítás a kódrajzra: `python3 tools/art-import.py --remove mosogep`. Végül: `node tests/check-art.js`,
   és nézd meg a `web/arculat.html` „Illusztrációk” galériájában.

### 3.3 Ellenőrzőlista – melyik változatot válaszd?

- [ ] **Egy** tárgy, középen, a képet nagyjából kitölti; nincs háttér, talaj, második tárgy.
- [ ] Ránézésre (40 px-en is) felismerhető, és **megkülönböztethető** a hasonló matricáktól (mosógép ↔ szárítógép, LED ↔ hagyományos izzó).
- [ ] Nincs rajta **szöveg, betű, szám, logó, márka** – a „majdnem betű” firkát is javíttasd ki.
- [ ] Fehér perem körben, egyenletes; **tömör olíva árnyék jobbra-le**, nem elmosott szürke.
- [ ] Lapokra tört, 3–4 tónusú árnyalás – nem fotó, nem színátmenetes 3D-render.
- [ ] A színek a CSV „Main colors” szerintiek (ne legyen piros a zöld kuka).

### 3.4 Javító promptok (szerkesztéshez, angolul)

| Hiba | Javító prompt |
|---|---|
| Szöveg vagy „betű-firka” | *Remove all text, letters, numbers and logos. Keep everything else exactly the same.* |
| Vékony vagy hiányzó perem | *Add an even, thick white die-cut border around the whole silhouette, about 3% of the image width.* |
| Szürke, elmosott árnyék | *Replace the shadow with a solid olive-green (#5A6337) shadow offset slightly to the lower right, with no blur.* |
| Színátmenetes / „3D-render” | *Redraw it as a flat vector illustration with faceted low-poly shading: 3 to 4 flat hard-edged tones per color, no gradients.* |
| Háttér vagy talaj | *Remove the background and the ground; keep only the object on a transparent background.* |
| Kicsi a tárgy | *Make the object larger so that it fills about 90% of the square image, centered.* |
| Fekete kontúr | *Change the black outlines to thin outlines in a darker shade of each fill color.* |
| Két tárgy | *Show only one {tárgy}; remove the others.* |

## 4. 3D modellek (GLB)

### 4.1 Mikor érdemes?

A játékok **tudatosan 2D matricákat** használnak a 3D világban (a hulladékok, ételek „kártyaként” fordulnak a kamera felé): ez gyors,
mobilon is könnyű, és egységes. 3D modell akkor éri meg, ha a tárgyat **körbe kell járni**, vagy **a díszlet része**
(kuka a kertben, gép a Zöldi-házban). Ajánlás: először **néhány „főszereplő” tárgy** (pl. a kukák), mérve, hogy mobilon is folyamatos
maradjon a játék – nem az összes matrica 3D-ben.

### 4.2 A legjobb út: kép → 3D

1. **Bemenet:** a jóváhagyott matrica perem és árnyék nélkül („vázlat”) – különben a fehér peremet és az árnyékot is testként modellezi:
   ```bash
   node tools/art-png.js ~/Desktop/beeco-kepek/vazlat devices --flat
   ```
   (Ha már van szebb MI-kép, még jobb bemenet annak perem és árnyék nélküli változata – szerkesztéssel kérve:
   *Remove the white die-cut border and the drop shadow; keep only the object on a plain white background, evenly lit.*)
2. A 3D-generátorban **kép → 3D**, a `docs/modell-promptok.csv` 3D promptját a kép mellé (ha van szöveges mező).
3. **Exportálás:** `.glb`, beágyazott textúrával, **tömörítés nélkül** (Draco / meshopt ki), alacsony poligonszám
   (eszközönkénti beállítás: 5.2). Ha a textúra nagyobb 1024 px-nél, kérj kisebbet az exportnál (Tripo: `texture_size`), vagy csökkentsd utólag.
4. **Ellenőrzés:** `node tools/model-check.js ~/Desktop/beeco-kepek/modellek` – háromszög, textúra, anyag, fájlméret a keret szerint.
5. **Megnézés a játék stílusában:** nyisd meg a `tools/modell-nezo.html`-t (dupla kattintás), és húzd rá a GLB-t – a játék fényeivel,
   cel-árnyalással, méhsejt-szigeten látszik, és ha a fájlnév matrica-név (pl. `mosogep.glb`), mellette a kódmatrica is.
   Minta: `tools/minta/mosogep.glb` · kép: `docs/promptolas/modell-nezo-minta.jpg`.

### 4.3 A keret (a mi döntésünk: mobilon 30 fps, gyors betöltés)

| | Normál tárgy | Főszereplő (`--hos`) |
|---|---|---|
| Háromszög | ≤ 5 000 | ≤ 12 000 |
| Textúra | ≤ 2 db, ≤ 1024 px | ≤ 3 db, ≤ 1024 px |
| Anyag | ≤ 8 | ≤ 12 |
| Fájlméret | ≤ 400 KB | ≤ 900 KB |
| Tömörítés | nincs (a Three.js r128 betöltője a Draco/meshopt/Basis-hoz külön dekódert kér) | ugyanaz |

A keret nem külső szabvány, hanem kiinduló cél – az első élő modellek után valódi eszközön mérjük (`docs/eszkoz-teszt.md`), és igazítjuk.

### 4.4 Beépítés a játékba – még nincs kész

A betöltéshez a Three.js r128 GLB-betöltője (`examples/js/loaders/GLTFLoader.js`, MIT-licenc, ~97 KB) kell. A cdnjs-en **nincs meg**
(ott az r128-ból csak a 4 alapfájl van), a jsDelivr-en igen. Két út: **saját szerverről** (`web/js/vendor/` – javasolt, a biztonsági szabály
változatlan marad, nincs új külső függés), vagy a jsDelivr engedélyezése a Netlify CSP-ben. A modell anyagait a játék cel-árnyalására
cseréljük – ahogy a modell-néző is teszi. Ez külön lépés, amikor eldől, melyik tárgyak legyenek 3D-ben.

## 5. Eszközök – mit tudnak most (ellenőrizve: 2026-09-17)

> Forrás minden sorhoz a gyártó dokumentációja / árlapja; ahol a hivatalos oldal nem volt elérhető, keresési kivonat vagy harmadik fél
> (jelölve). Árak és feltételek gyorsan változnak – **előfizetés előtt nézd meg az árlapot és a felhasználási feltételeket**.
> Részletes jegyzet minden állítás forrásával: **`docs/promptolas-forrasok.md`**; a nem ellenőrizhető pontokat „?” jelöli.

### 5.1 2D képgenerátorok

| Eszköz | Átlátszó háttér | Stílus-egység | Szerkesztés | Kereskedelmi használat | Mikor válaszd |
|---|---|---|---|---|---|
| **Recraft** (V4.1) | háttér-eltávolító eszköz (utólag); Vector modell SVG-t ad | **saját stílus 1–10 referenciaképből** (mentve, újrahasználható) | inpaint, képből kép | **csak fizetős** csomagban (a Free képei a Recrafté) – Basic $12/hó vagy $10/hó éves | **nagy, egységes készlethez** – a legjobb választás a matricákhoz |
| **ChatGPT / OpenAI** (gpt-image) | API: `background: "transparent"` + png/webp; a ChatGPT felületén nem mindig valódi – ellenőrizd (`--dry`) | referenciakép a promptban; nincs stílus-paraméter | maszkos szerkesztés, „Select” eszköz | az ÁSZF szerint a kimenet a felhasználóé | **javításhoz, nehéz tárgyhoz** (jól követi a „change only X” utasítást) |
| **Ideogram** (3.0 / 4.0) | 3.0 API-ban külön átlátszó végpont; UI: Remove BG | ≤3 referenciakép, 8 jegyű stílus-kód | edit, remix, magic fill | az ÁSZF nem korlátozza (kereskedelmi is) | ha a Recraft nem adja vissza a formát; ár: ? |
| **Midjourney** (V8.x) | **nincs** – az Editorban „Erase Background” → átlátszó PNG | **`--sref`** (+ `--sw` 0–1000), moodboard | V8.2 edit modell | **1 millió USD feletti éves bevételű cégnek Pro vagy Mega csomag kell** | szép stílus-egység, de több kézi lépés; nincs API |
| **Adobe Firefly** | natívan ?; utólagos háttér-eltávolítás | stílus-referenciakép (erősség 1–100) | generative fill | a Firefly-modellek kimenete kereskedelmileg használható (partner-modellekre nem ugyanez) | ha a beeco már Adobe-előfizető |
| **Gemini / Nano Banana** | **nincs** (a hivatalos matrica-példa is fehér hátteret kér) → utólag vágni | Pro: ≤3 stílus-referencia | képszerkesztés utasítással | API: a Google nem tart igényt; az appban látható vízjel (kivéve Ultra / AI Studio) | olcsó tömeges próbákhoz API-ból |

**Eszközönkénti fogások:**
- **Recraft:** hozz létre egy „beeco matrica” saját stílust a 9 eredetiből – egyenként feltöltve: `docs/promptolas/stilus-kepek/` –, és azzal generálj.
  A **negatív mezőbe főneveket** írj („text, letters”), ne „no text”-et – a CSV Tiltások oszlopa már így van.
- **ChatGPT / OpenAI:** egyszerre egy javítást kérj, és ismételd meg, mi maradjon változatlan („change only the shadow, keep everything else the same”).
- **Midjourney:** a rövid, konkrét prompt működik jól; kizárásra `--no` (rövid lista); a `--sref` után a stílus-referencia kép URL-je
  vagy stílus-kódja áll (a CSV-ben `STILUS_KEP` a helye).
- **Gemini:** a tiltásokat pozitívan fogalmazd („plain light grey background”), mert nincs negatív mező.

### 5.2 3D generátorok (GLB)

| Eszköz | Low-poly beállítás | Kép → 3D | Kereskedelmi használat | Megjegyzés |
|---|---|---|---|---|
| **Meshy** | Model type: **Smart Topology**, cél-poligonszám 100–15 000 (nálunk **3 000–5 000**), Triangle | 1–4 kép | Free: CC BY 4.0 (a Meshyt fel kell tüntetni, havi 10 letöltés); fizetős: saját tulajdon – Pro $20/hó (API is) | az API-ban a textúra-felbontás 2K / 4K / 8K lehet → a keretünkhöz (≤ 1024 px) utólag kicsinyíteni kell |
| **Tripo** | **P1** (low-poly) modell, `smart_low_poly`, `face_limit`; negatív prompt ≤255 karakter | 1 kép, vagy 4 nézet [elöl, bal, hát, jobb] | kereskedelmi célra **fizetős** csomag (a Free feltételei ellentmondásosak) | a `quad` kapcsoló FBX-et kényszerít → hagyd ki; konvertálásnál `texture_size` 1024 |
| **Hyper3D Rodin** | Quad / Raw mód, `quality_override` | 1–5 kép | Creator $30/hó: „any use”; API csak Business $120/hó | tipp: egyenletes fény a bemeneti képen, kemény árnyék nélkül |
| **Sloyd** | low-poly preset, LOD-csúszka | igen | Plus $15/hó: kereskedelmi licenc | parametrikus sablonok (egyszerű tárgyakhoz) |

Megszűnt / nem ajánlott most: **Luma Genie** (2026-01-01-jén leállt); **Spline AI 3D** kereskedelmi licence nem ellenőrizhető.

**3D prompt fogások (Meshy, Tripo hivatalos tanácsai):** a legfontosabb szavak elöl; **egy tárgy, egyes számban**; kerüld a füstöt,
csillogást, „varázserőt” (lebegő hálódarabokat szül); legfeljebb kb. 6 kulcsrészlet; kép → 3D-nél egyenletes megvilágítású bemenet
(ezért a perem és árnyék nélküli vázlat). A `docs/modell-promptok.csv` promptjai ezt követik (≤ 800 karakter, a Meshy korlátja).

## 6. Gyors ellenőrzőlista

- [ ] A promptot a CSV-ből vettem (nem kézzel írtam), és csatoltam a stílus-referenciát.
- [ ] 4 változatból választottam, a hibát szerkesztéssel javítottam.
- [ ] Átlátszó hátterű PNG, a fájlnév = a matrica neve.
- [ ] `art-import.py --dry` figyelmeztetés nélkül (vagy tudatosan elfogadva), utána beemelés, `check-art` zöld.
- [ ] 3D: kép → 3D a vázlatból, GLB tömörítés nélkül, `model-check` zöld, a modell-nézőben rendben van.
- [ ] Licenc: a használt eszköz csomagja kereskedelmi felhasználást enged (5. pont) – Midjourney-nél a beeco bevétele dönti el a csomagot.
