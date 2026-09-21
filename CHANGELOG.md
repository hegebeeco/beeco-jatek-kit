# A beeco-jatek-kit változásai

A kit verziószáma a `VERSION` fájlban van, **szemantikus verziózással** (FŐ.MELLÉK.JAVÍTÁS):

* **JAVÍTÁS** (1.0.**1**) – hibajavítás, új matrica/piktogram, szövegjavítás a szabálykönyvekben; semmi nem változik, amire egy játék épít.
* **MELLÉK** (1.**1**.0) – új lehetőség (új eszköz, új `ds-` elem, új token), ami a meglévő játékokat nem érinti.
* **FŐ** (**2**.0.0) – olyan változás, ami miatt a játékokban is módosítani kell (átnevezés, törlés, más viselkedés). Ezt kerüljük
  (lásd `CLAUDE.md`: csak bővítünk), és ha mégis kell, itt írjuk le, mit kell a játékokban átírni.

**Kiadás menete:** a lenti „Készül” rész tételei kerülnek az új verzió alá → `VERSION` átírása → commit + push a kitben →
a játékokban `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .` (ez beírja a projekt `KIT-VERZIO` fájljába az új verziót).
Hol tart egy játék? `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js <projekt> --check` – kiírja a projekt és a kit verzióját.

## Készül (következő verzió)

*(még nincs)*

## 1.5.1 – 2026-09-22
* `orbit.js` (dioráma-kamera): érintésnél ~10 px holtzóna (a koppintás nem billenti el a nézetet), nagy kijelzőn lassabb forgatás – táblagép-teszt után.

## 1.5.0 – 2026-09-21 (Méhesd: város és poszméh)
* **Város-modellek** (`web/js/3d/varos-modellek.js`, `VAROS_MODELS`, B szint): házsor, panelház, iskola, templom, bolt, parkoló,
  út, patak (külön vízfelszínnel), híd, vasúti töltés, temető, gyümölcsös, park, zöldfolyosó-szakaszok hosszra nyújtva
  (virágsáv, sövény, fasor – évszakosan), kaszált rét, élőhely-pont talapzat (`node({ kind })`, álnevekkel).
* **Poszméh** (`varos-poszmeh.js`): királynő és dolgozó csapkodó szárny-részekkel, fészek (rágcsálójárat fűcsomóban), permetezés-jelzés.
* Galéria: új „Méhesd” csoport (39 változat).

## 1.4.0 – 2026-09-21 (kerti 3D készlet)
* **Élő kert modellek** (`web/js/3d/elokert-modellek.js` + `elokert-allatok.js`, `EK_MODELS`, B szint, 43 változat a galériában):
  fa 3 fázisban és 4 évszakban, őshonos sövény, virágos rét, évelőágyás, veteményes (évszakosan), kerti tó és madáritató
  (külön vízfelszín-résszel), esővízgyűjtő, komposztláda, rovarhotel, pad, térkő, ház, terasz, kiskapu, kerítés; állatok:
  vadméh, pillangó, madár, denevér (csapkodó szárny-részekkel), katica, sün, béka, gyík.
* `check-i18n`: a `source2`/`source3` forráscímet sem veti össze.

## 1.3.2 – 2026-09-21
* `check-i18n`: az ezres elválasztót (85 000 ↔ 85,000) nem jelzi eltérő számnak, és a változatlanul hagyott szöveget (pl. eredeti nyelvű forráscím) nem veti össze.

## 1.3.1 – 2026-09-21
* Döntéskártya: új `onLean(oldal, 0–1, kártya)` visszahívás húzás közben – pl. a mérőkön előre mutatható, merre mozdulnak (az „Egy ökos polgármester élete” használja).

## 1.3.0 – 2026-09-18 (nyelvek)
* **Kétnyelvű felület (magyar / angol):** `web/js/i18n.js` – `tr('magyar szöveg')` (a magyar a kulcs, hiányzó fordításnál
  a magyar jelenik meg), szótárak `web/js/i18n/en-*.js`, angol tartalom `web/data/en/*.json` (azonos szerkezet),
  `I18N.fetchJSON`, `data-i18n`, nyelvválasztó `I18N.selectorHTML()`; nyelv: `?lang=en` > mentett választás > böngésző.
  Ellenőrzés: `tests/check-i18n.js` (hiányzó fordítás, eltérő szám/azonosító az angol tartalomban). Szabályok: `docs/nyelvek.md`.
* A közös modulok fordíthatók: kör vége, kioszk, beállítások (**új Nyelv sor**), közös profil (küldetések, jelvények),
  szereplők neve, ds-ext felolvasott szövegei, mechanikák üzenetei; angol szótár: `web/js/i18n/en-kit.js`.
  A `ds.js`-ben tartalék `tr()` – az i18n.js nélkül minden magyarul megy tovább.
* **5 új szerepes méhecske** (`web/assets/brand/roles/`): polgármester, élő kert, ételmentő, beporzó, körforgó –
  az eredeti méhecske + kódból rajzolt kellékek (`tools/meh-szerepek/`, `docs/meh-szerepek.md`).

## 1.2.1 – 2026-09-18
* A 2D hátterek bemutató-oldala (hatterek.html) sem kerül az offline fájllistába.

## 1.2.0 – 2026-09-18 (design system 1.2)
* **10 új `ds-` elem** (`web/css/ds-ext.css`, `web/js/ds-ext.js`, bemutató: `arculat.html` → Új elemek): változásjelző
  (`dsDeltaHTML`, `DS.delta.show`, `dsMeterHTML` szellem-szakasszal), profil-ábra (`dsProfileHTML` radar/sávok), forrás-sor és
  feltételezés-címke (`dsSourceHTML`, `dsAssumeHTML`), első lépés tanító (`DS.coach`), visszaszámláló gyűrű (`DS.ring`),
  csúszka (`dsRangeHTML`), magyarázó buborék (`DS.tip`), alsó lap (`DS.sheet`), képernyő-váz (`.ds-screen`), nagy betű mód (`DS.big`).
* **19 új piktogram** (79 összesen): up, down, plus, minus, undo, hand, alert, eye, city, road, recycle, ring, chart, sheet,
  swipe, grid, network, flow, source.
* **Adatskála-tokenek** (hőtérkép, élőhely): egyirányú és kétirányú skála + színtévesztő-barát változat (`.ds-cb`),
  `DS.scale` – `docs/adatskala.md`; a rács-modul hőtérképe erre állt át (color-mix nélkül).
* **8 új szereplő** (kitalált városlakók: polgármester, boltos, diák, nyugdíjas, kertész, buszsofőr, orvos, tanár) + új
  haj-, fejfedő- és ruha-részlet opciók a `szereplok.js`-ben.
* **Áramlás-mozgás** (`web/js/aramlas.js`, `DS_FLOW`): pöttyök SVG-vonalon és vásznon; a vonal-modulban opcionális.
* **2D háttér-jelenetek** (`web/js/hatter2d/`: város ma/2075 jövő-mérővel, konyha, kert, méhsejt-minta) – bemutató: `web/hatterek.html`.
* **Keret:** a beállítások között „Nagyobb betűk” és „Színtévesztő-barát színek”.
* **Sablon:** a mintajáték változásjelzővel, tanítóval és profil-ábrával.

## 1.1.1 – 2026-09-18
* A kalauz fejlesztői oldalai (kit.html, keret.html, modellek.html, vilag.html, mechanikak.html) nem kerülnek az offline fájllistába.

## 1.1.0 – 2026-09-18

### Új
* **Tartalom ⇄ táblázat (CSV) eszköz, bármelyik játékhoz** – `tools/tartalom.js`. A beeco csapat Excelben vagy Google
  Táblázatban szerkesztheti a szövegeket: `export` → szerkesztés → `import --dry` (próba) → `import`. Hogy mi szerkeszthető,
  azt a projekt `tartalom.config.json` fájlja írja le (JSON-fájl, tömb, id, szerkeszthető / csak olvasható / kötelező mezők,
  max. hossz, lehetséges értékek, link- és forrásmezők, új sor felvétele). A JSON-ban csak a megváltozott értékek bájtjai
  cserélődnek (kicsi git-diff), írás előtt önellenőrzés; magyar Excel-barát CSV (UTF-8 BOM, `;`), képlet-védelem,
  ütközés-védelem (ellenőrző kód). Útmutató: `docs/tartalom-szerkesztes.md`. (Alapja a Szelektálj! projekt saját eszköze.)
* **Forrásjegyzék + forrás-ellenőrzés** („szám csak forrással”) – `web/data/forrasok.json` a sablonban,
  `tools/forras.js` + `tests/check-forras.js`: minden számot tartalmazó szövegnek forrás kell (a jegyzékből vagy http(s) link),
  a jegyzék elemei hiánytalanok, a régi forrásra figyelmeztet; a CI minden élesítés előtt futtatja. Szabály: `docs/forrasok.md`.
* **Kit-verzió:** `VERSION` + ez a `CHANGELOG.md`; a `tools/kit-sync.js` frissítés után `KIT-VERZIO` fájlt ír a projektbe
  (verzió, kit-commit, dátum), a `--check` kiírja, melyik verzión van a projekt. Az `uj-jatek.js` is beírja.
* **Sablon:** `tartalom.config.json` (a mintajáték kártyái, értékei, profiljai + a forrásjegyzék); az `uj-jatek.js`
  `{{AZONOSITO}}` helyőrzőt is kitölt (a mappanévből: kisbetű, ékezet nélkül, „beeco-” nélkül; 4. paraméterrel felülírható).

* **Közös játékkeret** (`web/js/keret/`, `web/css/keret.css`, leírás: `docs/keret.md`): kör vége panel (`keretEredmeny`),
  beállítások (`keretBeallitasok`: hang, zene, rezgés, kevesebb mozgás, vezérlés), kifelé menő csatorna + névtelen mérés
  (`beecoBridge`), általános kioszk-mód (`keretKioszk`, `?kioszk=1`). A sablon már ezt használja (fogaskerék, kör vége, kioszk).
* **Közös játékosprofil („beeco playground”)** – `web/js/profil.js` (`beecoProfil`): album, napi küldetés + sorozat, jelvények
  minden játékon át, a Szelektálj! mentési formátumával. A **központ** (közös cím, alútvonalak, Netlify-proxy): `docs/kozos-profil.md`.
* **3D világ-készlet:** a játékok kódból épített modelljei a kitben (`web/js/3d/`: Szelektálj!, Hűtő-mester, Ökos-rejtély ház,
  Fenntartható otthon – 42 tárgy, 50 változat, katalógus), `beecoVilag()` egy hívással: ég, nap, felhők, lebegő méhsejt-szigetek,
  madarak, fű, hatszög-sziget, rét, napszakok, B/C minőség őrrel (`web/js/vilag/`). Galéria: `web/modellek.html`, bemutató:
  `web/vilag.html`, leírás: `docs/3d-vilag.md`, teszt: `tests/check-3d.js`.
* **Játék-mechanika modulok** (`web/js/mech/`, `web/css/mech.css`): húzós döntéskártya késleltetett következményekkel,
  rácsos lerakás szomszédsági hatásokkal és hőtérképpel, vonalhúzás pontok között (kritikus pontok, elszigetelődés),
  húzd-és-kombináld időzítővel és frissességgel. Bemutató: `web/mechanikak.html`, leírás: `docs/mechanikak.md`, teszt: `tests/check-mech.js`.
* **Hang és szereplők:** `web/js/hang.js` (`beecoHang`: háttérzene, némítás, rezgés; a DS-hangok is ezen mennek),
  `web/js/szereplok.js` (a Zöldi család SVG-szereplői + méhecske, bővíthető).
* **Kalauz 2.0:** `web/kit.html` – kereshető áttekintés mindenről (adat: `web/kit-tartalom.json`, `node tools/kit-index.js`),
  `web/keret.html` – a keret élő bemutatója.

## 1.0.0 – 2026-09-18 (első kiadás, commit `9003e52`)

A beeco webjátékok közös alapja, a Szelektálj! projektből kiemelve.

* **Design system („Méhsejt-diorama”)** – tokenek (`web/css/tokens.css` + `web/js/ds.js`), `ds-` elemek (`ds.css`),
  játék-minták (`ds-game.css`: buborék, csillag, eredmény-panel, jelvény…), mozgás-készlet (`ds-motion.css`, `DS.motion`),
  piktogramok (`web/js/pics.js`), saját betűk (Lalezar + Open Sans, `web/assets/fonts/`), élő kalauz (`web/arculat.html`).
* **Méhecskék és márkaképek** (`web/assets/brand/`, belső használatra).
* **374 B szintű matrica kódból + 3D modell-készlet** (`web/js/art/`: `art.js`, `model-kit.js`, `art-*.js`),
  képcsere kódmódosítás nélkül (`web/data/art-override.json`).
* **QR-kód és offline mód** – `web/js/qr.js`, `web/js/offline.js`, `web/sw.js`, fájllista: `tools/sw-lista.js`.
* **Eszközök** – ablak nélküli böngészős ellenőrzés (`tools/jatek-foto.js`, `tools/headless.js`), konfigurálható
  smoke-teszt (`tools/smoke.js` + `smoke.config.json`), matrica-render/ív/PNG/prompt/import (`tools/art-*`),
  3D-ellenőrzés és modell-néző (`tools/model-check.js`, `tools/modell-kit.js`, `tools/modell-nezo.html`).
* **Szabálykönyvek** – arculat, rajzolási mérce (B szint), grafika-spec, promptolás (+ források), offline + CI,
  játéktervezési elvek (`docs/`).
* **Claude-skillek** – `beeco-arculat`, `beeco-jatek` (`.claude/skills/`).
* **Tesztek** – `tests/check-arculat.js` (tokenek, kontraszt, racsni: `tests/arculat-baseline.json`), `tests/check-art.js`.
* **Új játék sablon** (`sablon/`) – futó mintajáték (döntés-kártyák + rendszerértékek + profil), tartalom-teszt, CI
  (GitHub Actions: tesztek, offline fájllista, smoke-teszt, Netlify-élesítés), offline mód, `CLAUDE.md`.
* **Terjesztés** – `tools/uj-jatek.js` (új projekt a sablonból), `tools/kit-sync.js` (kit ⇄ projekt szinkron, `--check`,
  `--vissza`), leltár: `KIT-FILES.json`.
