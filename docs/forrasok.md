# Források – szám csak forrással

A beeco játékok tanítanak, ezért minden tényünknek hitelesnek kell lennie. Az alapszabály (anti-hallucinációs szabály):

> **Konkrét számot, arányt, statisztikát soha nem írunk hiteles forrás nélkül.** Ha nincs forrás, a mondat szám nélkül
> megy, vagy `TODO: forrás kell` jelölést kap – kitalált szám soha.

Ezt egy automatikus ellenőrzés is őrzi: `node tests/check-forras.js` (a GitHub minden élesítés előtt lefuttatja, és hiba
esetén nem élesít).

## 1. Hol vannak a források?

Minden játékban egy **forrásjegyzék**: `web/data/forrasok.json`. Egy forrás így néz ki:

```json
{ "id":"ksh-hulladek-2023", "cim":"A települési hulladék mennyisége", "url":"https://www.ksh.hu/…",
  "kiado":"KSH", "ev":2023, "megjegyzes":"3.2. táblázat; az 1 főre jutó mennyiséghez használjuk" }
```

| Mező | Mit írj bele |
|---|---|
| `id` | rövid, egyedi azonosító, szóköz és ékezet nélkül – ajánlott forma: `kiadó-téma-év` (pl. `eurostat-csomagolas-2024`) |
| `cim` | a dokumentum / oldal / táblázat címe |
| `url` | **a konkrét oldal** linkje, ahol a szám szerepel (nem a kiadó főoldala), `https://`-sel |
| `kiado` | ki adta ki (KSH, Eurostat, NÉBIH, EFSA, egyetem, folyóirat…) |
| `ev` | az adat / kiadás éve (szám) – a 10 évnél régebbire a teszt figyelmeztet |
| `megjegyzes` | hol van a szám a forrásban (oldal, táblázat), mire használjuk, milyen hatókörre igaz (hol, mikor, mire) |

A tartalomban a szöveg mellé a `forras` mező kerül: egy forrás-id, több id listában (`["ksh-2023", "eurostat-2024"]`),
vagy – ha egyszeri – közvetlenül egy `https://` link. A forrás a szöveg objektumán vagy valamelyik „szülőjén” lehet
(pl. egy kártya `forras` mezője a kártya összes szövegére érvényes).

## 2. Új forrás felvétele (lépésről lépésre, táblázattal)

1. `node tools/tartalom.js export forrasok` → megnyitod a `docs/tartalom/forrasok.csv`-t (útmutató: `docs/tartalom-szerkesztes.md`).
2. Új sor: **típus** = `forrás`, **id** = az új azonosító, kitöltöd a *cím*, *url*, *kiadó*, *év*, *megjegyzés* oszlopot.
   Az *ellenőrző kód* üresen marad.
3. A tartalom táblázatában (`export tartalom`) a számot tartalmazó sor **forrás** oszlopába beírod az új id-t.
4. `node tools/tartalom.js import --dry` (próba – a két táblázat együtt is mehet), majd `node tools/tartalom.js import`.
5. `node tests/check-forras.js` – „rendben” kell legyen.

(Fejlesztőként ugyanez kézzel: új elem a `web/data/forrasok.json` `forrasok` listájába.)

## 3. Mi számít hiteles forrásnak?

**Elfogadjuk** (ebben a sorrendben keresünk):
1. **Hivatalos és statisztikai forrás:** KSH, Eurostat, EU-jogszabály (EUR-Lex), magyar jogszabály (njt.hu), minisztérium,
   hatóság (NÉBIH, OKF, energiahivatal), EU-ügynökség (EEA, EFSA), ENSZ-szervezetek (UNEP, FAO, IPCC).
2. **Tudományos forrás:** lektorált folyóiratcikk, egyetemi vagy kutatóintézeti kiadvány (lehetőleg DOI-val).
3. **Szakmai szervezet** jól dokumentált módszertannal (pl. szabványügyi testület, tanúsító szervezet a saját jeléről).

**Nem elég önmagában:** hírportál, blog, Wikipédia (legfeljebb arra jó, hogy megtaláld az eredeti forrást), cégek
marketinganyaga, közösségi média, MI-vel generált szöveg.

**Számhoz lehetőleg 2 egymástól független, egyező forrás** kell. Ha a források eltérnek, írd le a `megjegyzes`-ben, és
válaszd az óvatosabb megfogalmazást (tartomány, „körülbelül”, vagy szám nélkül). Vitatott témánál (ahol a hiteles források
sem értenek egyet) inkább hagyjuk ki a számot.

Mindig írd ki a **hatókört**: mire, hol és mikor igaz a szám (pl. „Magyarországon, 2023-ban, a háztartásokban”).
A magyar szabályok (pl. szelektálás) településenként eltérhetnek – ahol ez számít, a szöveg is mondja ki.

## 4. Mit csinálj, ha nincs forrás?

* Írd meg a mondatot **szám nélkül** – gyakran így is tanít („a legtöbb…”, „jóval több…” – de csak ha ezt is alátámasztja valami).
* Vagy tedd bele: `TODO: forrás kell` – a teszt ezt figyelmeztetésként kiírja, hogy ne kerüljön ki így élesbe.
* Soha ne becsülj, ne kerekíts „nagyjából jó” számra, és ne vegyél át számot forrásmegjelölés nélküli helyről.

## 5. Mit ellenőriz a teszt? (`node tests/check-forras.js`, vagy `node tools/forras.js --lista`)

* ✖ **hiba** (élesítés megáll): számjegy vagy `%` van egy szövegben, de se a szövegnél, se felette nincs `forras`;
  a `forras` ismeretlen id-re mutat; a link nem `http(s)://`; a jegyzékben hiányzik az id, a cím vagy a link, kétszer
  szerepel egy id, vagy az év nem évszám.
* ⚠ **figyelmeztetés**: szóval írt szám („kétszer”, „ezer”, „fele”, „százalék”…) forrás nélkül; `TODO: forrás kell` a
  szövegben; 10 évnél régebbi forrás; hiányzó kiadó vagy év.
* ℹ tájékoztatás: a jegyzékben olyan forrás, amire semmi nem hivatkozik.

**Kivételek** (fejlesztőnek, a `tartalom.config.json` `"forras"` részében):
* `szamKivetelek`: szövegminták, amik nem tények (pl. a játék neve: `"\\b2075\\b"`, vagy `"\\d+\\. szint"`).
* Egy objektumra (pl. játékszabály: „3 életed van”): `"_forrasNemKell": "játékszabály, nem tény"` – indoklással.
* `fajlok` (melyik JSON-okat nézze; alapból a táblázat-készletek fájljai), `forrasMezok`, `kihagyottMezok`,
  `szamSzavak` (`"hiba"` | `"figyelmeztetes"` | `false`), `regiForrasEv` (alap: 10), `ketForrasSzamhoz` (`true`: 2 forrás
  nélkül figyelmeztet).
