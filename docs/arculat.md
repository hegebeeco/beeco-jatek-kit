# beeco játékok – design system („Méhsejt-diorama”)

> **Élő stílus-kalauz:** `web/arculat.html` – élesben: https://beeco-szelektalj.netlify.app/arculat.html
> (keresőben nem jelenik meg). Minden elem a valódi fájlokból épül, tehát mindig naprakész.
> **Ellenőrzés:** `node tests/check-arculat.js`

## 1. Döntés és cél

**Döntés (2026-09-16, Kristóf):** az arculati javaslatból (artifact: https://claude.ai/artifact/Pmjmbamm2QLosffwErBNGu)
az **A + B keverék**: *A – Méhsejt-diorama* (low-poly világ, hatszög) + *B – papír-melegség* (krém alap, puha árnyék).
Ez váltja a korábbi neo-brutalista skint (harsány citromsárga, fekete, kemény eltolt árnyék, Bricolage Grotesque).
Még aznap Kristóf kérésére ebből **design system** lett: egy helyen tárolt tokenek, közös elemkészlet, szabályok és
automatikus ellenőrzés – hogy minden játék egységes maradjon, akárki (vagy Claude) is dolgozik rajta.

**Cél:** felismerhetően beeco, kicsit indie/művészi, cuki; **minden korosztálynak** (iskola, nagyvállalat); nem szövegközpontú.

**Öt alapelv**
1. **Felismerhetően beeco** – az app színei, betűi, méhecskéi.
2. **Cuki és barátságos** – kerek formák, puha árnyék; a játék soha nem szid.
3. **3 másodperc** – képernyőnként egy mondat, a többi lenyitható részben.
4. **Méhsejt-diorama** – hatszög-motívum, low-poly világ, meleg napfény.
5. **Mindenkinek** – olvasható kontraszt, legalább 44 px koppintási felület, jelentés színnel ÉS ikonnal.

## 2. A rendszer rétegei (hol mi van)

| Réteg | Fájl | Mi van benne |
|---|---|---|
| Betűk | `web/css/fonts.css` + `web/assets/fonts/` | Lalezar, Open Sans – saját szerverről (OFL 1.1; a CSP nem enged külső betűt, és így nem megy IP-cím a Google-höz) |
| **Tokenek** | `web/css/tokens.css` | színek, szerep-színek, betűméretek, térköz, sarok, árnyék, mozgás, érintési méret – **az egyetlen igazságforrás** |
| **Elemkészlet** | `web/css/ds.css` | `ds-` alapelemek: gombok, csipesz, kártya, panel, hatszög, lenyitható, kapcsoló, fülek, szegmens, visszajelzés, mérő, sáv |
| **Játék-minták** | `web/css/ds-game.css` | buborék + arckép, csillagok, eredmény-panel, beviteli mező, jelvény, betöltés, lapozó, címke, pipálós lista, értesítés, adat-oszlop, sötét környezet, mozgás-készlet |
| **Mozgás** | `web/css/ds-motion.css` | érkezés (`drop`, `slide-l/r`, `out`), ítélet és jutalom (`stamp`, `tick`, `rise`), élet és figyelem (`buzz`, `glow`, `pulse`, `sweep`), lapozás (`flip`), lépcsőzés (`ds-delay-1…4`), röppenő darabkák (`.ds-piece`); JS-segédek: `DS.motion.play/rise/burst/countUp` – mind megáll a „Kevesebb mozgás” beállítással |
| **Bővítés 1.2** | `web/css/ds-ext.css` + `web/js/ds-ext.js` | változásjelző, profil-ábra, forrás-sor, feltételezés-címke, tanító (coachmark), visszaszámláló gyűrű, csúszka, magyarázó buborék, alsó lap, képernyő-váz, nagy betű mód – lásd 4/b; betöltés a `ds-motion.css` / `ds.js` UTÁN |
| Piktogramok | `web/js/pics.js` | 60 saját ikon a **vezérlőkre**, `pic('név')` |
| **Illusztrációk** | `web/js/art/art.js` + `art-*.js` | matricák a **tartalomra** (tárgy, étel, készülék, hulladék) emoji és régi kódrajz helyett: `artIcon('🧊')`, `ART.image('i_tukor')`; csere kész képre: `web/data/art-override.json` – lásd 5/d és `docs/grafika-spec.md` |
| JS-oldal | `web/js/ds.js` | `DS.color` (= tokenek), `DS.world` (3D paletta), `DS.light`, `DS.moods` (méhecske-hangulatok), `DS.sound` / `DS.haptic` / `DS.feedback` (visszajelzés-recept), táblák (`DS.signCanvas`, `DS.pillCanvas`); böngésző-segédek: `dsFeedback`, `dsSound`, `dsStarsHTML`, `dsResultHTML`, `dsMood`, **párbeszéd-őr** (5/e) |
| Márka-képek | `tools/og-kep.html`, `tools/ikon.html` → `node tools/brand-kepek.js` | megosztási előkép (`og-kep.png`) és ikonok (`ikon-32/180/512.png`) – lásd 5/f |
| Közös kör vége | `web/js/result.js` | `showResult({...})` – minden játék szint/kör vége panelje (eredmény-minta, ranglista, megosztás, app-sáv) |
| Ellenőrzés | `tests/check-arculat.js` + `tests/arculat-baseline.json`, `tests/check-art.js` | lásd 8. pont |
| Eszköz-teszt | `docs/eszkoz-teszt.md` | kézi ellenőrzőlista valódi telefonra, tabletre és a beeco app WebView-jára |

**Betöltési sorrend** (`index.html`): a `<head>` saját stílusa (a játék alapja + Szelektálj! HUD, tokenekkel) → `fonts` → `tokens` → `ds` → `ds-game` → modulok CSS-e.
A modulok a design systemre építenek (utána jönnek). (A korábbi `theme.css` „átöltöztető” réteg 2026-09-16-án megszűnt: a HUD stílusa közvetlenül tokenekre épül.)

## 3. Tokenek

**Paletta** (a beeco app színei): méz `--honey #FECF39` · nyomott méz `--honey-deep #D8A500` · vaj `--butter #FEEEBB` ·
olíva `--olive #2F371E` · halvány olíva `--olive-soft #596B39` · levél `--leaf #6E8947` · zsálya `--sage #D3DDBB` /
`--sage-bg #E3ECCD` · krém `--cream #FFF8E7` · papír `--paper #FFFDF6` · rózsa `--blossom #F5B4C7` / `--blossom-bg #FDE2E8` ·
bogyó `--berry #7A2E3F` · égkék `--sky #B1DEFF` / `--sky-bg #D6E8F7` · parázs `--ember #EA580C` · fókusz `--focus #2656D9`.

**Szerepek – a felületen EZEKET használd:**

| Token | Mire |
|---|---|
| `--bg` | oldalháttér (krém) |
| `--surface` | kártya, panel, másodlagos gomb (papír) |
| `--ink` / `--ink-soft` | szöveg / másodlagos szöveg |
| `--line` | minden körvonal (olíva, `--line-w` = 3 px) |
| `--accent` | fő gomb, kiemelés (méz) |
| `--good-bg`, `--good-ink`, `--good` | jó válasz háttere, szövege; bekapcsolt állapot |
| `--bad-bg`, `--bad-ink` | „próbáld újra” háttere, szövege |
| `--scrim` | sötétítés felugró ablak mögött |
| `--focus` | billentyűzet-fókusz, link |

**Betű:** `--display` (Lalezar: cím, szám, fő gomb) · `--body` (Open Sans: minden szöveg) ·
méretek `--fs-xs 12` · `--fs-s 14` · `--fs-m 16` · `--fs-l 20` · `--fs-xl 26` · `--fs-2xl 34` · `--fs-3xl 46` px.
**Térköz** (4 px-es rács): `--sp-1…6` = 4, 8, 12, 16, 24, 32 px.
**Forma:** `--r-s 12` · `--r-m 18` · `--r-l 24` · `--r-xl 32` · `--r-pill` · `--hex` (hatszög).
**Árnyék:** `--soft` (kártya, panel) · `--soft-sm` (kis elem) · `--press` (nagy gomb „vastagsága”). Kemény, eltolt fekete árnyék: **soha**.
**Mozgás:** `--t-fast .12s` · `--t-base .2s` · `--t-slow .4s` · `--ease` (lágy megállás) · `--bounce` (kis rugózás). **Érintés:** `--tap 44px`.
**Szöveg a méz színen:** `--on-accent` (sötét környezetben is olíva marad). **Adat:** `--data-before` (rózsa), `--data-after` (levél).
**Éjszaka:** `--night`, `--night-surface` – a `.ds-dark` használja.

**Rétegek** (mi takar mit, alulról felfelé) – nyers `z-index` szám helyett:

| Token | Érték | Mire |
|---|---|---|
| `--z-world` | 8 | 3D fölötti jelölők: célkereszt, névcímke, hőkamera-szűrő |
| `--z-hud` | 10 | játék közbeni kijelzők, 2D játéktábla |
| `--z-controls` | 12 | rendszergombok, vezérlők, játékbeli értesítés |
| `--z-bubble` | 16 | méhecske-buborék, bemutató, részletek |
| `--z-panel` | 20 | szint vége, főmenü, nyomozótábla |
| `--z-popup` | 22 | panel fölötti ablak (játékleíró) |
| `--z-scene` | 30 | teljes képernyős jelenet, húzott elem |
| `--z-alert` | 40 | felvillanás, betöltés |
| `--z-top` | 46 | megosztás, új jelvény |

Köztes réteg: `calc(var(--z-panel) - 1)`.

Régi nevek (`--sarga`, `--fekete`, `--krem`) átirányítva az újakra – új kódban tilos, az ellenőrző számolja.

## 4. Elemkészlet

| Elem | Osztály | Mikor |
|---|---|---|
| Nagy gomb | `ds-btn` (+ `is-secondary`, `is-small`, `is-block`) | a képernyő fő cselekvése – **képernyőnként egy** |
| Kis gomb | `ds-btn-sm` (+ `is-primary`) | szint, beállítás, „Mégse”; `<small>` alcímmel |
| Ikon-gomb | `ds-icon-btn` (+ `is-accent`) | menü, hang, bezárás – **mindig `aria-label`** |
| Csipesz | `ds-chip` (+ `is-big`, `is-small`, `is-honey`, `is-blossom`, `is-good`, `is-bad`) | pont, sorozat, élet, rekord: piktogram + szám |
| Kártya | `ds-card` (+ `is-interactive`, `is-flat`) | csoportosított tartalom, választható elem |
| Panel | `ds-scrim` + `ds-panel` | felugró ablak: cím, egy mondat, egy nagy gomb |
| Hatszög | `ds-hex` (`--acc` háttér, `--size`) | játék-, szerep-, jelvényikon |
| Lenyitható | `ds-details` | minden, ami nem fér az egy mondatba |
| Kapcsoló | `ds-switch` (`role="switch"`, `aria-checked`) | be/ki beállítás |
| Fülek | `ds-tabs` + `ds-tab` (`.on` / `aria-selected`) | nézetváltás |
| Szegmens | `ds-seg` (`role="radiogroup"`) | egy a több közül (pl. nehézség) |
| Visszajelzés | `ds-feedback` (+ `is-good`, `is-bad`) | jó / próbáld újra – **ikon + szín** |
| Mérő | `ds-meter` (`--v`, + `is-good`) | haladás, jövő-mérő |
| Sáv | `ds-banner` | kiemelt felhívás (app letöltése) |
| Billentyű | `ds-key` | billentyű-jel a súgóban |
| Szöveg | `ds-title`, `ds-h3`, `ds-lead`, `ds-muted`, `ds-num` | cím, egymondatos bevezető, halvány szöveg, szám |

**Játék-minták** (`ds-game.css`):

| Elem | Osztály / segéd | Mikor |
|---|---|---|
| Beszéd | `ds-say` (+ `is-me`) + `ds-avatar` (`is-bee`, `--acc`, `--size`) + `ds-bubble` (`ds-who`) | méhecske, család-chat, bemutató-tipp |
| Csillagok | `dsStarsHTML(n, max, big)` → `ds-stars` (+ `is-big`) | értékelés 0–3 |
| Eredmény | `ds-panel` + `dsResultHTML({ mood, title, stars, score, scoreLabel, lead, stats, actions })` | **minden** szint/kör vége ugyanígy: méhecske, cím, csillag, pont, egy mondat, csipeszek, egy nagy gomb + kis gombok |
| Beviteli mező | `ds-input`, `ds-code` | név a ranglistán, kódzár |
| Jelvény | `ds-badge` (+ `is-new`, `is-locked`) + `ds-hex` | gyűjthető jelvény |
| Betöltés | `ds-loader`, `ds-skeleton` | várakozás |
| Lapozó | `ds-dots` (`i.on`) | jelenet, bemutató lépései |
| Címke | `ds-tag` (+ `is-accent`, `is-good`, `is-bad`, `is-dark`) | névcímke, „feltételezés”, hely |
| Pipálós lista | `ds-checklist` (`li.is-done` + `pic('done')` / `pic('todo')`) | feladatok, nyomok |
| Értesítés | `ds-toast` (+ `show`) + `ds-feedback` | rövid, magától eltűnő üzenet |
| Adat-oszlop | `ds-bars` / `ds-bar` (+ `is-after`, `--v`) | előtte / utána összevetés |
| Sötét környezet | `ds-dark` a tartalmazó elemen | éjszakai nézet, hőkamera, mozi-jelenet |
| Mozgás | `ds-anim-pop`, `-shake`, `-float`, `-spin`, `-in` | felugró pont, „majdnem”, lebegés; a „Kevesebb mozgás” mindet leállítja |

### 4/b. Bővítés 1.2 (`ds-ext.css` + `ds-ext.js`)

Betöltés: `<link rel="stylesheet" href="css/ds-ext.css">` a `ds-motion.css` után, `<script src="js/ds-ext.js">` a `pics.js` és a `ds.js` után.
A HTML-t adó segédek Node-ban is futnak (`node tests/check-ds-ext.js`). Élő minta: `arculat.html` → „Új elemek (1.2)”.

| Elem | Osztály / segéd | Szabály |
|---|---|---|
| Változásjelző | `dsDeltaHTML({ label, icon, value, unit, better, small })` → `ds-delta` (`is-good` / `is-bad` / `is-zero`, `is-small`) | nyíl + előjel + szín együtt; `better:'down'`, ahol a kevesebb a jobb (CO₂, forint) – ilyenkor a mínusz a zöld |
| Változás-köteg | `DS.delta.show(horgony, [{ label, icon, value }])` | döntés után a mérő fölött felszáll; `aria-live`, mozgás nélkül is olvasható ideig ott marad |
| Mérő változással | `dsMeterHTML({ label, icon, value01, delta, deltaValue })` → `ds-mrow` + `ds-meter is-delta` + `ds-meter-ghost` | `value01` az ÚJ érték; a változás csíkozott „szellem” szakasz (a csík a jel, nem csak a szín) |
| Profil-ábra | `dsProfileHTML({ values:[{ label, icon, value01 }], mode:'radar'\|'bars', title })` → `ds-profile` | futam végi „rendszerprofil”; 3–6 tengely, 3 alatt magától sáv; a címkék HTML-ben (telefonon is olvashatók), képernyőolvasónak a számok is |
| Forrás-sor | `dsSourceHTML({ title, url, publisher, year, note })` → `ds-source` | **minden szám mellé**; a link új lapon nyílik (`rel="noopener"`), csak `http(s)` link lesz kattintható |
| Feltételezés | `dsAssumeHTML(szöveg)` → `ds-assume` (szaggatott keret) | kitalált / becsült kiindulás (pl. „4 fős család”) – sosem mért adatként |
| Tanító | `DS.coach.show(cél, { text, key, mood })`, `DS.coach.hide()`, `DS.coach.reset(kulcs?)` | első lépésnél EGY tipp egyszerre; kulcsonként egyszer (`beeco_coach_<kulcs>`); koppintásra / a cél használatára / Esc-re eltűnik; a „Bemutatók újra” beállítás hívja a `reset()`-et |
| Visszaszámláló | `dsRingHTML({ seconds, size, label })` + `DS.ring.start(el, mp, onEnd)` / `DS.ring.stop(el)` | a szám mindig középen; az utolsó negyedben bogyószín + lüktetés; háttérbe tett lapon megáll |
| Csúszka (tippelés) | `dsRangeHTML({ id, label, min, max, step, value, unit, labels })` + `DS.range.bind(input)`; egyszerű: `input.ds-range` | natív csúszka (nyilak, Home/End); méz hatszög fogantyú, lebegő érték-buborék, a képernyőolvasó az egységet is mondja |
| Magyarázó buborék | `DS.tip.attach(el, szöveg)`, jelölővel `data-ds-tip="…"` (`DS.tip.scan()`), gomb: `dsTipBtnHTML(szöveg, szó)` → `ds-tip` | egy fogalom rövid magyarázata; rámutatás / fókusz / koppintás; Esc és mellékoppintás zárja; a képernyő szélén átfordul |
| Alsó lap | `DS.sheet.open(html, { title, onClose })`, `DS.sheet.close()` → `ds-sheet` | 700 px alatt alulról, fül + lehúzás; fölötte középre nyíló panel; `role="dialog"` + `aria-modal`, a párbeszéd-őr (5/e) intézi a Tab/Esc-et |
| Képernyő-váz | `ds-screen` › `ds-screen-top` (+ `ds-hud`, `ds-hud-group`, `ds-hud-spacer`), `ds-screen-main`, `ds-screen-tray`; `is-contained` | HUD fent, tábla középen, tálca lent; **töréspont: fekvő tájolás + legfeljebb 500 px magas kijelző** → a tálca oldalra kerül; a notch-sávokat figyeli |
| Nagy betű mód | `<html class="ds-big">`, `DS.big.set(on)` / `DS.big.get()` | minden `--fs-*` és a `--tap` ~1,2×; tárolva `beeco_big` (a régi `beeco_rz_big`-et is olvassa) |

Minden új elem tiszteli a „Kevesebb mozgás” beállítást (`.reduce-motion` / rendszer).
Piktogramok, amelyeket a bővítés használ, ha léteznek (különben szöveges tartalék): `up`, `down`, `alert`, `link`, `info`, `close`.

**Álnevek** – a régi osztályok már most a design system kinézetét kapják, átírásuk ráér:
`.btn` → `ds-btn` · `.mnBtn` (+`.primary`) → `ds-btn-sm` (+`is-primary`) · `.mnSwitch` → `ds-switch` ·
`.overlay .box` → `ds-panel` · `.key` → `ds-key`.

## 5. Piktogramok

`pic('név')` – 24×24-es, lekerekített, olívavonalas rajzok a palettából. Emoji helyett ezeket használjuk a **felület
vezérlőin** (gombok, fülek, beállítások, csipeszek), mert az emoji minden telefonon másképp néz ki.
Készlet (60): home, sound, mute, tip, full, star, nostar, flame, heart, timer, box, wind, leaf, info, trophy, medal, gear,
games, people, play, close, bee, music, vibrate, motion, compass, text, palette, slow, refresh, trash, pause, back, next,
check, done, todo, lock, unlock, menu, bag, phone, board, thermo, map, tools, share, link, diary, calendar, moon, sun,
pin, drop, bolt, fire, coin, photo, search, cut.
Új ikon: ugyanebben a stílusban a `pics.js`-be (2–2,2 px vonal, `PIC_INK`, legfeljebb két palettaszín).
*Tartalomban* (pl. a 2075 matricái, a beeco által szerkesztett szövegek) az emoji egyelőre marad – később illusztráció.

## 5/b. Méhecske-hangulatok (`DS.moods`)

| Hangulat | Figura | Mikor |
|---|---|---|
| `hello` | kacsintó | köszönés, menü, bemutató eleje |
| `good` | ujjongó | jó válasz |
| `great` | szuperhős | rekord, hosszú sorozat, 3 csillag |
| `think` | kérdőjeles | **rossz válasz** – „hmm, gondoljuk át!” |
| `harm` | beteg, zöld | környezeti kár a **tartalomban** (szmog, zöldre festett állítás) – soha nem a játékosra |
| `love` | szívecskés | köszönet, gyűjtemény, jó cselekedet |
| `rank` | koronás | rangemelés, új jelvény |
| `rest` | alvó | szünet, üres állapot |
| `help` | iránytűs | tipp, útmutatás, térkép |
| `action` | locsoló | valódi tett otthon |
| `app` | telefonos | beeco app letöltése |

A **mérges** méhecske nincs a készletben: a játékosra soha nem reagálunk dühvel. (2026-09-16-ig a rossz válasznál ez jelent meg – javítva.)

## 5/c. Visszajelzés-recept (`dsFeedback`)

Egy hívás = hang + rezgés + méhecske, minden játékban ugyanúgy; a felirat mellé `ds-feedback` (szín **és** ikon).

| Eset | Hívás | Ikon, szín | Méhecske | Hang | Rezgés |
|---|---|---|---|---|---|
| Jó válasz | `dsFeedback('good')` | `check`, `is-good` | good | két emelkedő hang | rövid |
| Rekord, sorozat | `dsFeedback('great')` | `star`, `is-good` | great | háromhangú emelkedő | kettős |
| Rossz válasz | `dsFeedback('try')` | `refresh`, `is-bad` | think | lágy, lefelé ívelő (nem „buzzer”) | finom kettős |

A régi `sndGood()` / `sndBad()` / `reactBee()` már ezt a receptet követi, így minden játék egyszerre állt át.
Egyéb hangok: `dsSound('tap' | 'pop' | 'unlock')`. A teszt tiltja a harsány hangot (fűrészfog-hullám, túl mély vagy túl hangos).

## 5/d. Illusztrációk (`ART`, `artIcon`)

**Piktogram vagy illusztráció?** A `pic()` a **vezérlőké** (gomb, fül, állapot): egyszínű, vonalas. Az illusztráció a
**tartalomé** (mit látsz: hulladék, étel, készülék, termék, nyom): színes matrica fehér peremmel és puha árnyékkal.

* Egy stílus mindenhol: 100×100-as rács, `ART.MAT` anyagok (világos · alap · sötét · kontúr), lapokra tört árnyalás
  bal-fentről, 1,6-os kontúr, 8-as fehér perem, olívazöld árnyék 22%-kal. Szabálykönyv: **`docs/grafika-spec.md`**.
* HTML-ben: `artIcon(emojiVagyNév, alt)` – ha van matrica, `<img class="art">` (a szöveg méretéhez igazodik), ha nincs,
  marad az emoji, így semmi nem törik el. Vásznon és 3D-ben: `ART.image(név)` / `ART.src(név)`.
* Nevek: emoji-matrica rövid ékezet nélküli névvel és `emoji:[…]` listával; Szelektálj! hulladék `i_<id>`; Hűtő-mester étel `f_<id>`.
* **Célzott matrica:** ahol az emoji csak kölcsön-jel (a Szélturbina 🌬️-je, a mosógép 🫧-je), a tartalomban az elem
  `sticker` mezője a saját matricára mutat (`"icon": "🌬️", "sticker": "szelturbina"`); a szövegben továbbra is az `icon` áll.
  A kód mindenhol `x.sticker || x.icon`-t rajzol; a `check-art` ellenőrzi, hogy a név létezik.
* **Csere szebb képre** kódmódosítás nélkül: promptok `docs/illusztracio-promptok.csv` (`node tools/art-prompts.js`),
  kész PNG-k → `python3 tools/art-import.py <mappa>` (minőség-ellenőrzéssel) → `web/assets/art/*.webp` + `web/data/art-override.json`.
  **Promptolási útmutató** a beeco eredetijein mért stílus-szerződéssel, eszközönkénti tippekkel és a 3D (GLB) úttal: `docs/promptolas.md`.
* A beeco méhecskét és a szereplőket **nem** rajzoljuk matricának (app-illusztrációk, `rezsi-chars.js`); valódi logót és tanúsító jelet sem.

## 5/e. Párbeszédablak és billentyűzet

Minden felugró panel: `role="dialog"` + `aria-modal="true"` (+ `aria-labelledby` a címre). A `ds.js` párbeszéd-őre ezekre
magától működik, a moduloknak nem kell kódot írniuk:
* **Tab / Shift+Tab** a legfelső nyitott panelen belül körbejár; ha a fókusz kint volt, a panel első (utolsó) elemére ugrik.
* **Esc** – ha a modul maga nem kezelte – megnyomja a panel `data-ds-close` (vagy `aria-label="Bezárás"`) gombját.
* **Bezárás után** a fókusz visszakerül arra az elemre, ahonnan a panel nyílt.
* Csak billentyű- és fókusz-eseményre fut (nincs képkockánkénti figyelés), a 3D-t nem lassítja.

## 5/f. Márka-képek

| Kép | Méret | Hol látszik | Forrás |
|---|---|---|---|
| `assets/brand/og-kep.png` | 1200 × 630 | link megosztásakor (Facebook, Messenger, LinkedIn, Viber) | `tools/og-kep.html` |
| `assets/brand/ikon-32.png` | 32 × 32 | böngészőfül | `tools/ikon.html` |
| `assets/brand/ikon-180.png` | 180 × 180 | iPhone kezdőképernyő (krém háttér, az iOS nem enged átlátszót) | `tools/ikon.html` |
| `assets/brand/ikon-512.png` | 512 × 512 | nagy felbontású ikon | `tools/ikon.html` |

Mindkét forrás a design system fájljaiból épül (betűk, tokenek, `ds-hex`, szerepes méhecskék). Ha változik a paletta vagy
új játék jön: a HTML-t frissítjük, majd `node tools/brand-kepek.js` újrakészíti a képeket (fej nélküli Chrome + Pillow).
Az ikon levélzöld hatszögben a kacsintó méhecske: 32 px-en ez adta a legjobb kontrasztot (méz alapon a sárga méhecske beleolvadt).

## 6. 3D világ

* Színek a `DS.world` palettából (ég, köd, fű, föld, fa, lomb, sziget…); új szín névvel oda kerül, nem a kódba.
* Fény: `DS.light.outdoor` (meleg napfény, olívazöld talaj-visszfény) · `DS.light.indoor` (konyha: lágy, meleg beltéri fény).
* Beltér: `DS.interior` – fal, csempe, ablak, üveg, padló, háztartási gép, acél, fa, szekrény, pult, asztal, lámpa (a Hűtő-mester konyhája; az Ökos-rejtély háza ide kerül át).
* Formák: low-poly (kevés oldalú henger, ikozaéder), cel-árnyalás 3 fokozattal; a kert egy hatszögletű méhsejt-szigeten.
  Az r128-as toon anyag nem ismeri a `flatShading`-et – ne kapcsold be (figyelmeztetés-áradat).
* Táblák és címkék: `DS.signCanvas(szöveg)` / `DS.pillCanvas(szöveg)` – méz alap, olívakeret, Lalezar, a szöveg
  méretét méri és illeszti. Anyaga `transparent:true` (lekerekített sarok).
* Tilos: fotórealista textúra, erős tükröződés, tiszta fekete, a régi citromsárga.

## 7. Szöveg és hangnem

* Tegeződünk, röviden, bátorítóan; rossz válasznál tanítunk, nem szidunk („Majdnem! A tükör nem üveg – próbáld a kommunálist.”).
* Képernyőnként egy mondat; a többi `ds-details`-be. Játékleíróban automatikusan csak az első mondat látszik.
* Számot csak hiteles forrással (CLAUDE.md 6. pont); ha nincs: „megtakarít, de nincs rá igazolt szám”.

## 8. Automatikus ellenőrzés – `node tests/check-arculat.js`

1. A `ds.js` színei egyeznek a `tokens.css`-szel.
2. Kontraszt (WCAG AA): minden használt szöveg–háttér pár legalább 4,5:1 (a sötét környezetben is), a nem-szöveges jelek (fókusz, körvonal, kapcsoló) 3:1.
3. Minden `var(--név)` és `pic('név')` létezik.
4. **Minden** CSS (a design system és az összes játékmodul, valamint az `index.html` `<head>` stílusa) csak tokent használ: nyers szín és régi tokennév tilos. Kivétel: **névvel deklarált tartalom-szín** egyedi tulajdonságban (pl. `--gw-leaf:#7bc86c` utánzott öko-címke, `--rz-lcd:#9dff8a` villanyóra-kijelző, `--rz-sky:linear-gradient(…)` jelenet-ég) – a szabályokban ekkor is csak `var(--…)` állhat.
5. A játéklista szerep-méhecskéi és a hangulat-méhecskék léteznek; a visszajelzés-recept teljes (hangulat, ikon, hang, rezgés); nincs harsány hang; a mérges méhecske nem reagál a játékosra.
6. **Illusztrációk** (`node tests/check-art.js`): minden matrica betölthető, egyedi nevű, van `hu` és `en` neve, csak létező
   anyagot használ, nem lóg ki a vászonról, jól formált SVG; minden kép nélküli hulladéknak és minden Hűtő-mester ételnek van
   matricája; a csere-lista csak létező képre mutat. Tájékoztatóként kiírja, mely tartalom-emojiknak nincs még matricája.
7. **Racsni:** a régi stílus mintái (régi tokennév, régi sárga, kemény árnyék, régi betű) fájlonként **nem nőhetnek**.
   Kiinduló állapot (2026-09-16): **363 régi minta**, legtöbb: `rezsi.css`, `index.html`, `rezsi-gami.css`, `impact.css`.
   Ha egy modult átállítunk, a szám csökken → `node tests/check-arculat.js --update` rögzíti az új, alacsonyabb szintet.

## 9. Ellenőrzőlista új vagy átdolgozott képernyőhöz

- [ ] Csak tokenek és `ds-` elemek; új szín/méret a `tokens.css`-be **és** a `ds.js`-be.
- [ ] Egy mondat látszik, a többi lenyitható; egy nagy gomb.
- [ ] Emoji helyett `pic()` a vezérlőkön; ikon-gombon `aria-label`.
- [ ] Jó/rossz: szín **és** ikon; koppintási felület ≥ 44 px.
- [ ] Megnézve: asztali, 375×812 álló és 812×375 fekvő telefon; „Kevesebb mozgás” mellett is; konzol hibamentes.
- [ ] Felugró panel: `role="dialog"` + `aria-modal="true"`, a bezáró gombon `data-ds-close` (5/e).
- [ ] Tartalom képe (tárgy, étel, készülék): `artIcon()` matrica, nem emoji (5/d).
- [ ] `node tests/check-arculat.js` és `node tests/check-art.js` zöld (és a többi `tests/check-*.js`).
- [ ] Új elemnél: bekerül a `ds.css`-be **és** az `arculat.html`-be, és ide a 4. pontba.
- [ ] Szám mellett forrás-sor (`dsSourceHTML`), becsült kiindulás mellett feltételezés-címke (`dsAssumeHTML`); változás nyíllal és előjellel is (`dsDeltaHTML`).
- [ ] Első lépésnél legfeljebb egy tanító (`DS.coach`); a Beállítások „Nagy betű” kapcsolója a `DS.big.set()`-et hívja; `node tests/check-ds-ext.js` zöld.

## 10. Átállás – mi van már a design systemen

**Kész (2026-09-16):**
- főmenü (fülek, játékkártyák, beállítások piktogramokkal, játékleíró panel);
- **minden játék kör vége** a közös eredmény-panellel (`js/result.js`: méhecske, cím, csillag, pont, egy mondat, csipeszek, lenyitható részletek, ranglista, megosztás);
- **visszajelzés** minden játékban a recept szerint (gondolkodó méhecske rossz válasznál, lágy hang);
- **Szelektálj!** teljesen: kert (3D paletta, fények, táblák), HUD (súgó-kártya, rendszergombok, pontszám-csipeszek), bemutató-buborék, értesítés ikonnal, info-panel, érintős vezérlés, „fordítsd el” sáv – az `index.html` régi mintái: 71 → 0;
- **Hűtő-mester** teljesen: konyha színei a `DS.interior` palettából, beltéri fény `DS.light.indoor`, mozgás-sáv ikon-gombokkal, tárolási tény panel (egy mondat + méhecske-buborék „Tudtad?” + lenyitható részletek és forrás), mobilon alsó lap;
- **Greenwashing-vadász** teljesen: csipeszes fejléc (pont, élet, sorozat, kártya), mérő, kártya és hátlap tokenekkel, „Majdnem!” hangnem, a „Hol találod?” méhecske-buborékban, Bűnös/Ártatlan gombok a jó/rossz szerep-színekkel; a kitalált öko-pecsétek színei névvel deklarált TARTALOM-színek (`--gw-*`);
- **Mi van mögötte?** teljesen: csipeszes fejléc és mérő, termék-lapok `ds-card`-ként, hatás-típus piktogrammal ÉS színnel (környezeti: levél + zsálya, társadalmi: emberek + égkék), visszajelző sor ikonnal, „Majdnem!”, kör vége kártya, megforduló részletek tokenekkel;
- **2075** teljesen: matricák papír-körrel, olívakontúrral és méz-névcímkével (Lalezar), a zöld város a beeco palettájából (a szmogos város szürkéi tartalom-színek), élet/pont csipeszben, jövő-mérő `ds-meter`, felvillanó szöveg ikonnal, szintindító és szünet kártya `ds-panel`, új `cut` (olló) piktogram;
- **Ökos-rejtély** teljesen: HUD és jobb oldali gombsor piktogramokkal, panelek `ds-panel` mintán (mobilon alsó lap), nyomozófal hatszög-érmekkel és lakatos fotókkal, készülék-kártya, villanyóra, kódzár, chat és napló, térkép, album, mini-játékok, éjszakai teszt és hőkamera, képregény-jelenet, betöltés; a megosztható jelentés-kép Lalezar + Open Sans betűvel, méz–olíva–krém színekkel; a 3D táblák, jelölők és a vezető-gyűrű a DS színeivel. A CSS szét lett bontva: `rezsi.css`, `rezsi-cards.css`, `rezsi-chat.css`, `rezsi-ux.css`, `rezsi-gami.css` (mind 200 sor alatt). Tartalom-színek névvel: villanyóra LCD, mérőtárcsa, hőkamera-kijelző, parafatábla, gombostű, jelenet-egek;
- minden `.btn` / `.mnBtn` / kapcsoló / szegmens az álneveken keresztül.

**Az átállás kész (2026-09-17): a régi stílus mintái az egész kódban 363 → 0.** A racsni ezt a szintet őrzi.

**Illusztrációk (2026-09-17):** a tartalom emojijai és a régi kódrajzok helyén matricák (5/d) – Greenwashing, Mi van mögötte?,
2075, Ökos-rejtély (panelek, 3D jelölők, térkép, jelentés-kép, jelenetek, HUD), Szelektálj! és Hűtő-mester 3D matricái, menü;
célzott matricák a háztartási gépekhez, mérőórákhoz és a 2075 kölcsön-emojijaihoz (`sticker` mező).
**B szint (2026-09-17, `docs/rajzolas.md`):** tömör olíva árnyék minden matricán; a Hűtő-mester mind a 33 étele kidolgozott
(B) matrica, a konyha tárgyai (hűtő, ajtó, polc, pult, szekrények, ablak, lámpa) kódból épített 3D modellek (`web/js/huto-modellek.js`).

**Ami tudatosan maradt:** emoji a folyó szövegben (a család chat-üzenetei, tippek, bátorító mondatok – az szöveg), a beeco
méhecske (app-illusztrációk) és a szereplők (`rezsi-chars.js`); a valódi kuka-színek és az utánzott öko-címkék színei (a felismerést szolgálják).

## 11. Nyitott döntések

* **Ki rajzolja az új méhecske-szerepeket** (pl. kertész, vízvezeték-szerelő)? A beeco illusztrátora (egységes, de idő)
  vagy prompt alapján készült, utólag átrajzolt vázlat. Addig a meglévő app-méhecskék.
* A beeco app-méhecskék a játékban belső használatúak – külső (partner) anyagban a beeco jóváhagyása kell.
* Opcionális: a design system feltölthető a claude.ai Design felületére is (a Claude Code `/design-sync` parancsával),
  így az ott készülő prezentációk és anyagok (pl. cégeknek, iskoláknak) is ezt a stílust kapják.
