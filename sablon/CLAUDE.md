# {{NEV}} – beeco webjáték

Ez a fájl a projekt állandó kontextusa (a Claude Code minden munkamenet elején beolvassa). A projekt a
**beeco-jatek-kit** sablonjából indult (`~/CLAUDE/beeco-jatek-kit`, GitHub: `hegebeeco/beeco-jatek-kit`, privát).

## 1. Kikkel dolgozol
* **Kristóf** – a beeco ügyvezetője, mechatronikai mérnöki háttérrel. Érti a rendszereket és a tesztelést, de nem hivatásos
  programozó. **Magyarul, tegezve** kommunikálj vele, és magyarázd el, mit miért csinálsz (új fogalomnál 1–2 mondat).
  Ő nem szerkeszt kódot: a böngészőben játszik, tesztel és visszajelez. Amit neki kézzel kell, azt lépésről lépésre írd le.
* **Bence** – beeco belsős fejlesztő, a Flutter mobilapp gazdája; neki specifikációt írunk, nem kódot.
* Üzleti vagy tartalmi következményű döntésnél kérdezz, ne találgass. Ha van egyszerűbb-rosszabb és bonyolultabb-jobb út, mondd el mindkettőt, és javasolj.

## 2. Mit építünk
{{LEIRAS}}
Játékterv: `docs/jatekterv.md`. Tervezési elvek (kötelező): `docs/jatektervezes.md` – 30 mp alatt érthető, a rendszer tanít
(nem a szöveg), több szempont ütközik, rövid és újrajátszható, a végén **profil** és nem egyetlen „zöld pontszám”, mobilon is megy.

## 3. Technikai keretek
* Statikus webjáték, telepítés és build nélkül: HTML + CSS + JavaScript; 3D-hez Three.js r128 a cdnjs-ről. Külső könyvtár csak a
  cdnjs-ről (a CSP ezt engedi) – új függőségnél mondd meg az árát, licencét és a lock-in kockázatát.
* A tartalom **adat** (`web/data/*.json`), nem kód – a beeco csapat szerkeszti.
* Ha egy fájl 200 sor fölé nő, bontsd fel (kivétel: rajz-adatfájlok, azoknál ~800 sor).
* Kifelé küldött adat (eredmény, események) egy helyen: `window.parent.postMessage` (iframe) és `BeecoBridge` (Flutter).
  A játék soha nem hív közvetlenül beeco API-t, és nem kezel tokent vagy jelszót.

## 4. Arculat és rajz – a kitből (kötelező)
* **Design system:** szabálykönyv `docs/arculat.md`, élő bemutató `web/arculat.html`, skill: `beeco-arculat` (felhasználói szinten
  is telepítve). Tokenek: `web/css/tokens.css` (+ `web/js/ds.js`), elemek: `ds.css`, `ds-game.css`, mozgás: `ds-motion.css`,
  piktogramok: `pic('név')` (`web/js/pics.js`). Nyers szín, kemény eltolt árnyék, régi tokennév tilos – a `node tests/check-arculat.js` ellenőrzi.
* **Rajzolási mérce: B szint** – 2D matrica: 10–20 alakzat, 4 tónus, 3/4-es nézet, tömör olíva árnyék; 3D: 300–1200 háromszög,
  letört élek, kódból (`MODEL`, GLB-betöltő nélkül). `docs/rajzolas.md`, rajzoló megbízás: `docs/rajzolas/rajzolo-brief.md`.
  Matricák: `artIcon('név')` / `ART.draw()` – előbb nézd meg, van-e már (`node tools/art-sheet.js`); 370+ kész.
* Stickeren/rajzon nincs márka, logó, felirat vagy arc. Valódi logó csak szabad forrásból (licenccel) vagy írásos engedéllyel.
* A beeco méhecskét nem rajzoljuk újra (`web/assets/brand/`).
* **Kész építőkockák a kitből – előbb nézd meg, van-e már:** közös keret (`docs/keret.md`: kör vége panel, beállítások, kioszk,
  kifelé menő csatorna + mérés, hang, szereplők), közös profil (`docs/kozos-profil.md`), játék-mechanikák (`docs/mechanikak.md`:
  döntéskártya, rácsos lerakás, vonalhúzás, kombinálás), 3D világ és modellek (`docs/3d-vilag.md`), 2D hátterek és áramlás
  (`docs/hatterek-2d.md`), új DS-elemek (`ds-ext.js`: változásjelző, profil-ábra, tanító, gyűrű, csúszka, lap, képernyő-váz; adatskála:
  `docs/adatskala.md`), szereplők (városlakók is). Kalauz: `web/kit.html`.
* **A kit közös fájljait ne itt fejleszd csendben:** ha a design systemen javítasz (új piktogram, új matrica, token), utána
  `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js . --vissza`, majd a kitben commit + push, hogy a többi játék is megkapja.
  Frissítés a kitből: `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .`

## 5. Adat és tények – szigorú szabály
* **Soha ne találj ki konkrét számot, arányt vagy statisztikát.** Ha egy tényhez szám kell: `TODO: forrás kell`, és a szöveg váza szám nélkül.
  Minden számhoz hiteles forrás (hivatalos, lehetőleg 2 egyező). Valódi céget forrás nélkül nem minősítünk.
* A számok forrása a `web/data/forrasok.json` jegyzékben; a `node tests/check-forras.js` minden forrás nélküli számot megfog.
  Tartalom-szerkesztés táblázatban (a beeco csapatnak): `node tools/tartalom.js export|import` – `docs/tartalom-szerkesztes.md`.
* Magyar szöveg: tegező, rövid, bátorító, nem moralizáló – rossz döntésnél is tanítunk, nem szidunk. Képernyőnként egy mondat, a többi lenyitható.

## 6. Munkamódszer
* Kis lépések. Felületi változás előtt a `beeco-arculat` skill.
* **Ellenőrzés böngészőablak nélkül:** `node tools/jatek-foto.js <config.json>` (fej nélküli Chrome: JS-lépések, képernyőkép, konzol-hibák) –
  asztali, 390×844 álló és 844×390 fekvő méreten. Kristóf gyakran bezárja a böngészőpanelt, ezért ezt használd.
* Mielőtt késznek mondod: `for f in tests/check-*.js; do node $f; done`, `node tools/sw-lista.js`, `node tools/smoke.js`.
* Git: commit üzenet magyarul, a végén: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. API-kulcsot chatben ne kérj.
* Képeket mindig WebP-re tömöríts.

## 7. Élesítés
* A `main` ágra push után a GitHub Actions lefuttatja az ellenőrzéseket, és csak ha minden zöld, élesít a Netlify-ra
  (`.github/workflows/deploy.yml`; kell hozzá a `NETLIFY_AUTH_TOKEN` és `NETLIFY_SITE_ID` repo-titok).
* **Minden `web/` változás után `node tools/sw-lista.js`** (offline fájllista) – különben a CI megállítja az élesítést.

## 8. Aktuális állapot
* {{DATUM}}: a projekt létrejött a beeco-jatek-kit sablonjából (mintajáték: döntés-kártyák + rendszerértékek + profil).
