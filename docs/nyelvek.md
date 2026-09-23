# Nyelvek (magyar / angol) – így fordítunk

Modul: `web/js/i18n.js` (`I18N`, `tr`) · ellenőrzés: `node tests/check-i18n.js` · a nyelvválasztó: `I18N.selectorHTML()` + `I18N.bind(el)`.

## Technika
* **Kód:** a magyar szöveg marad a kulcs: `tr('Kezdés')`, változóval `tr('{n} pont', { n })` – soha ne `tr(\`…${x}\`)`.
  Az angol a szótárban: `web/js/i18n/en-<modul>.js` → `I18N.add('en', { 'Kezdés':'Start', '{n} pont':'{n} points' })`.
  Modulonként külön szótárfájl (nem ütköznek a párhuzamos munkák). Hiányzó fordításnál a magyar jelenik meg.
* **HTML:** `<span data-i18n>Kezdés</span>`, attribútum: `data-i18n-attr="aria-label,title,placeholder"` – az `I18N.applyDom()` fordítja.
* **Tartalom (JSON):** `web/data/x.json` → angol pár: `web/data/en/x.json`, **ugyanazzal a szerkezettel**; betöltés: `I18N.fetchJSON('data/x.json')`.
  A teszt ellenőrzi, hogy az azonosítók, számok, linkek, források PONTOSAN egyeznek.
* **Számok, dátumok:** `I18N.locale` ('hu-HU' | 'en-GB') az `Intl` formázóknak; `I18N.num(v, tizedes)`.
* **Nyelv:** `?lang=en|hu` > mentett választás (`beeco_lang`) > böngésző nyelve (ha van köztük magyar → magyar, különben angol).

## Fordítási szabályok (angol)
1. **Tartalom és számok nem változnak.** Csak fordítunk: szám, mértékegység-érték, forrás, link, azonosító marad. Nem teszünk hozzá új tényt,
   nem „javítunk” statisztikát. A magyar sajátosságokat megtartjuk és jelöljük: „in Hungary”, „Hungarian …”, Ft (HUF) marad (pl. „12 000 Ft (HUF)”).
2. **Hangnem:** barátságos, tegező („you”), rövid, bátorító, nem moralizáló – ugyanaz a beeco-hang. Brit angol helyesírás (colour, recycling bin).
3. **Nevek:** a játékok angol neve: Szelektálj! → *Sort It!*, Hűtő-mester → *Fridge Master*, Greenwashing-vadász / Ítéld el! → *Greenwash Hunter* /
   *Judge it!*, Mi van mögötte? → *What's Behind It?*, 2075 – Vágod a zöld jövőt? → *2075 – Slice to a Green Future*, Ökos-rejtély → *Eco Mystery*,
   Fenntartható otthon → *Sustainable Home*, Greenwashing-párbaj → *Greenwash Duel*. A beeco, a Zöldi család (*the Zöldi family*) és a kitalált márkák neve marad.
4. **Magyar szabályok:** a szelektálás, a rezsi (tarifák, MVM-sávok), a KSH/Nébih adatok magyar kontextusúak – angolul is annak mondjuk
   („Hungarian households”, „in Hungary this goes in the…”), nem cseréljük más ország szabályára.
5. **Hivatalos címkék neve** (EU Ecolabel, FSC, Fairtrade…) a hivatalos angol nevükön; a magyar hatósági jelek angol leírással.
6. **Hossz:** az angol ne legyen jóval hosszabb (gombok, csipeszek!) – ha kell, rövidíts.
7. **Az angol fordítás első változat** – a beeco (vagy anyanyelvi lektor) jóváhagyása kell; a tartalom táblázatban is átnézhető (`tools/tartalom.js`).

## Állapot (2026-09-23)

**Kész angolul:** a keret (menü, beállítások, Rólunk, kör vége, kioszk, album/küldetések, tanári lap, beágyazás) és a tartalom
**18/19 fájlban** – köztük a hat korábban hiányzó játék: Greenwashing-vadász, Hűtő-mester, Mi van mögötte?, 2075, Ökos-rejtély,
valamint a polgármester, Élő kert, Méhesd hálózat, közlekedés, múzeum, Méhesd 2050.
A `data/en/jatek-db.json` szándékosan nincs (adatbázis-export, csak számok).

**Amire figyelni kell:**
* A fordítás **első változat**, anyanyelvi/beeco-lektorálásra vár (a `docs/jovahagyas.md` táblái).
* A **forráscímek és kiadó-nevek magyarul maradnak** (tulajdonnév) – a `check-i18n` ezért ír „fordítatlannak tűnik” figyelmeztetéseket, ez rendben van.
* Az Ökos-rejtély **kódzár-rejtvényei** angolul is ugyanazokra a számokra épülnek (házszám, lámpák, radiátorok) – a szöveg alkalmazkodott, a számok nem változtak.
* Ha egy játék felületi szövege be van égetve, előbb `tr()`-be kell csomagolni, és csak utána van értelme a szótárnak.
