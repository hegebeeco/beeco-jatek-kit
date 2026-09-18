# Tartalom szerkesztése táblázatban (Excel / Google Táblázat)

A beeco játékok szövegei (kártyák, gombfeliratok, tények, források) JSON-fájlokban vannak a játék `web/data/` mappájában.
Ezeket nem kell kézzel szerkesztened: egy paranccsal **táblázatba (CSV) mented**, Excelben vagy Google Táblázatban
átírod, egy másik paranccsal pedig **visszatöltöd**. Az eszköz csak a szerkeszthető mezőket írja át, azonosító (id) alapján,
és minden mást – számokat, azonosítókat, sorrendet, formázást – érintetlenül hagy.

* Eszköz: `tools/tartalom.js` (minden beeco játékban ugyanaz, a közös kitből jön)
* Hogy egy játékban **mi** szerkeszthető, azt a játék gyökérmappájában lévő `tartalom.config.json` írja le.
* A táblázatok helye: `docs/tartalom/<készlet>.csv` (egy **készlet** = egy tartalom-fájl, pl. `tartalom`, `forrasok`)

> **Terminál:** a Mac „Terminál” alkalmazása. Minden parancsot **a játék mappájában** futtass, pl.:
> `cd ~/CLAUDE/beeco-polgarmester`
> Mit lehet ebben a játékban szerkeszteni? `node tools/tartalom.js lista` – kiírja a készleteket és az oszlopaikat.

---

## 1. Friss táblázat készítése (export)

Mindig **frissen exportált** táblázatból dolgozz – egy régi CSV-vel mások azóta tett módosításait írnád vissza.

```
node tools/tartalom.js export tartalom
```

(Készlet nélkül – `node tools/tartalom.js export` – az összes táblázat elkészül.) Eredmény: `docs/tartalom/tartalom.csv`.

## 2. Megnyitás

**Google Táblázat (ajánlott, ez nem alakít át semmit magától):**
Fájl → Importálás → Feltöltés → válaszd ki a CSV-t → Elválasztó: *Egyéni*, `;` →
„Szöveg átalakítása számmá, dátummá” **kikapcsolva** → Importálás.

**Excel:** dupla kattintás a fájlra – a magyar Excel a `;` elválasztót és az ékezeteket (UTF-8) felismeri.
Vigyázz: az Excel néha „okoskodik” (pl. `3/5`-ből dátum, `1 200`-ból szám lesz). Ha ilyet látsz, inkább
Google Táblázatot használj, vagy Excelben: Adatok → Szövegből/CSV-ből → az oszlopok típusa *Szöveg*.

## 3. Mit jelentenek az oszlopok?

* **típus** és **id** – melyik elem sora ez. **Ne írd át**, ezek alapján talál vissza az eszköz.
* **… (csak olvasható)** – tájékoztató oszlop (pl. matrica neve, a döntések hatása). Átírhatod, de visszatöltéskor
  **nem kerül át** (az eszköz figyelmeztet). Ezekhez fejlesztő kell.
* **ellenőrző kód** – az export pillanatának „ujjlenyomata”. Ne írd át. Ebből veszi észre az eszköz, ha közben valaki más
  is módosította ugyanazt a sort.
* Minden más oszlop **szerkeszthető**. Egy sornak csak a saját típusához tartozó oszlopai számítanak, a többi cella üres
  (pl. az „érték” soroknál csak a *név*).
* A `lista` parancs `°` jellel mutatja, mi hagyható üresen; a többi kötelező.
* Ha egy cella `'`-tal kezdődik (pl. `'-10 fok`), az csak azért van, hogy az Excel ne vegye képletnek – hagyd rajta,
  visszatöltéskor levesszük.
* Több érték egy cellában (pl. két forrás): vesszővel elválasztva – `ksh-2023, eurostat-2024`.
* A cellán belüli sortörés megmarad (Excel: Alt+Enter, Mac: Ctrl+Option+Enter).

## 4. Mentés CSV-ként

* **Google Táblázat:** Fájl → Letöltés → *Vesszővel elválasztott értékek (.csv)*. (Vesszővel ment – ez is jó, az eszköz
  felismeri.) Tedd a letöltött fájlt a `docs/tartalom/` mappába pontosan a régi néven, vagy add meg a helyét a `--csv`
  kapcsolóval (lásd lent).
* **Excel:** Fájl → Mentés másként → Formátum: **CSV UTF-8 (pontosvesszővel tagolt) (.csv)**.
  Ne „CSV (Macintosh)” vagy sima „CSV” legyen, mert azok elrontják az ékezeteket.

## 5. Próba-visszatöltés (semmit nem ír)

```
node tools/tartalom.js import tartalom --dry
```

Máshol lévő fájlnál: `node tools/tartalom.js import tartalom --dry --csv ~/Downloads/tartalom.csv`

Az eszköz kiírja, mi változna:

* `~` módosítás (régi → új szöveg), `+ új mező` (eddig üres volt), `− mező törlése` (kiürítetted – csak a `°` mezőknél lehet),
  `+ új sor` (csak ahol a `lista` azt írja: „új sor felvehető” – pl. a forrásjegyzék);
* `✖ HIBA` – ilyenkor **semmi nem íródik**: kötelező mező üres; a link nem `http`-vel kezdődik; ismeretlen érték (pl. nem
  létező forrás-id); eltűnt `{n}` helyőrző; **új szám forrás nélkül**; a sort közben valaki más is módosította (ilyenkor
  exportálj újra, és vidd át bele a változtatásodat);
* `⚠` figyelmeztetés – nem akadályoz, de nézd meg: a javasoltnál hosszabb szöveg (a játékban rövidítünk); új szám a
  szövegben (a forrás tényleg ezt mondja?); csak szóköz változott vagy dátumnak tűnik (az Excel alakíthatta át); csak
  olvasható oszlop átírva; ismeretlen vagy hiányzó sor.

Új elemet (új kártya) és elem törlését a táblázat **nem** végzi el – kivéve, ahol a config megengedi (pl. új forrás). Az
ismeretlen id-jű sort kihagyja, a hiányzó sort változatlanul hagyja, és mindkettőt kiírja. Ezekhez szólj egy fejlesztőnek.

## 6. Szám csak forrással (anti-hallucinációs szabály)

* **Soha ne írj be számot, arányt, statisztikát hiteles forrás nélkül.** Ha egy tényhez szám kellene, de nincs forrás,
  írd meg a mondatot szám nélkül, vagy jelöld így: `TODO: forrás kell` (ezt a teszt figyelmeztetésként kiírja, mert a
  játékos is látná).
* Ha számot írsz, töltsd ki a sor **forrás** oszlopát: a forrásjegyzék egy id-je (pl. `ksh-hulladek-2023`) vagy egy
  `https://` link. Az eszköz forrás nélkül nem tölti vissza.
* Új forrást a `forrasok` táblázatba veszel fel (új sor: típus `forrás`, új id, cím, url, kiadó, év) – a teendők és hogy
  mi számít hiteles forrásnak: **`docs/forrasok.md`**.
* A magyar szelektálási és egyéb szabályok településenként eltérhetnek – ahol ez számít, írd ki (pl. „helyenként külön”).
* Hangnem: tegező, rövid, bátorító; rossz döntésnél is tanítunk, nem szidunk.

## 7. Élesítés és ellenőrzés

Ha a próba rendben volt:

```
node tools/tartalom.js import tartalom
```

Utána futtasd a játék ellenőrzéseit – mindnek „rendben” üzenettel kell végződnie:

```
for f in tests/check-*.js; do node $f; done
```

(Ebben benne van a forrás-ellenőrzés is: `node tests/check-forras.js`.) Végül nézd meg a játékot a böngészőben, és szólj
a fejlesztőnek (vagy a Claude Code-nak), hogy mehet a feltöltés (git). A GitHub minden feltöltés után újra lefuttatja az
ellenőrzéseket, és csak akkor élesít, ha minden zöld. Ha valami elromlott: a fájl a git-ben visszaállítható – ezt a
fejlesztő megcsinálja.

---

### Fejlesztőknek

* **A config** (`tartalom.config.json`, a projekt gyökerében) – készletenként:
  ```json
  "keszletek": {
    "tartalom": { "cim": "…", "fajl": "web/data/tartalom.json", "tipusok": [
      { "tipus": "kártya", "tomb": "kartyak", "id": "id",
        "szerkesztheto": { "szoveg": "szöveg", "bal.felirat": "bal gomb", "forras": "forrás" },
        "csakOlvashato": { "matrica": "matrica" },
        "kotelezo": ["szoveg", "bal.felirat"], "maxHossz": { "szoveg": 160 },
        "forrasMezok": ["forras"], "urlMezok": [], "szamMezok": [], "listaMezok": [],
        "lehetsegesErtekek": { "kuka": "kukak[].id" }, "egyuttKell": { "szam": ["szamForras"] }, "ujSor": false } ] } }
  ```
  * A sorok forrása pontosan egy: `"tomb"` (tömb; beágyazva is: `"szintek[].kartyak"`), `"szotar"` (objektum, a kulcs az
    id), vagy `"kulcsok"` (egyedi szövegek, pl. `["cim", "bevezeto"]`, mezőjük a `"."`).
  * Mezőút ponttal (`bal.felirat`). A `szerkesztheto`/`csakOlvashato` lehet lista is (akkor az oszlopnév maga az út).
  * `lehetsegesErtekek`: lista (`["a","b"]`), út ugyanabban a fájlban (`"kukak[].id"`) vagy másik fájlban
    (`"web/data/x.json#kukak[].id"`). `forrasMezok`: a forrásjegyzék id-je vagy http(s) link. `szamMezok`: szám.
    `listaMezok`: szöveglista (a cellában vesszővel). `egyuttKell`: ha a kulcs ki van töltve, ezek is kellenek.
    `ujSor: true`: új sor felvehető (csak egyszerű `tomb`-nél; a tömb végére, az utolsó elem formájában).
  * JS-fájlban lévő objektum is mehet: `"fajl": "web/js/adat.js", "jsValtozo": "GAME_DATA"`.
  * A `"forras"` rész a forrás-ellenőrzésé (`tools/forras.js`) – lásd `docs/forrasok.md`.
* Az eszköz nem írja újra a fájlokat (`JSON.stringify`), hanem saját elemzővel megjegyzi minden érték helyét, és csak a
  megváltozott értékek bájtjait cseréli – a kézi formázás és a git-diff minimális marad. Új mező a testvér-objektumokban
  szokásos helyére kerül. Minden írás előtt: a saját elemző eredménye = `JSON.parse` / `vm` eredménye, és az új fájl
  pontosan a tervezett változásokat tartalmazza; ha nem, nem ír.
* Ellenőrzés módosítás nélkül: `export` → `import` → `git diff --stat` üres.
* `--force`: ütközés esetén is ír (a CSV-beli érték nyer) – csak tudatosan.
* Az eszköz a **futtatási mappát** tekinti a projekt gyökerének (a `tools/` mappa a kitből másolódik).
