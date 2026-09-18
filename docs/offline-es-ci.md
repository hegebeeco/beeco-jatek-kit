# Offline mód és automatikus ellenőrzés (CI)

## Offline mód – mit csinál?

Rendezvényen (Brain Bar stand, kioszk: `?kioszk=rezsi`) leeshet a Wi-Fi. Ezért a játék egy **service workert** használ: ez egy háttérben futó szkript, ami a böngésző és a hálózat közé áll, és a letöltött fájlokat eltárolja a böngészőben.

* **Első betöltéskor** a háttérben letöltődik a **teljes** játékgyűjtemény (kb. 4 MB, mind a hat játék + a Three.js és a QR-könyvtár a cdnjs-ről). Ezután internet nélkül is minden játék indul, nem csak az, amelyiket megnyitották.
* **Tartalom (HTML, `data/*.json`)**: mindig a hálózatról próbálja (max. 4 mp), ha nincs net, a tárolt példányt adja → a friss tartalom azonnal látszik.
* **Kód, képek, betűk**: a tárból jönnek azonnal, a háttérben frissülnek.
* **Ranglista (Supabase) és minden beküldés (POST)**: soha nincs tárolva.
* **Új verzió**: a háttérben települ, és csak a megváltozott fájlokat tölti le. A futó játékot **nem** tölti újra, az új kód a következő oldalbetöltéskor lép életbe.
* A játékos semmit nem lát belőle. Állapot a konzolban: `beecoOffline.cached` (true = minden a tárban).

Fájlok: `web/sw.js` (service worker), `web/js/offline.js` (regisztrálás), `web/sw-files.json` (fájllista, **generált**).

**Rendezvény előtt:** a kioszk-gépen nyisd meg egyszer a játékot **működő** neten, várj ~1 percet, és kész. (Próba: kapcsold ki a Wi-Fit, töltsd újra az oldalt.)

## A fájllista frissítése – minden commit előtt, ha a `web/` mappában bármi változott

```
node tools/sw-lista.js
```

Ez újraírja a `web/sw-files.json`-t és a `web/sw.js` verziószámát (a fájlok tartalmából számolt ujjlenyomat). Mindkettőt commitold.

## Mit ellenőriz a CI minden élesítés előtt?

`.github/workflows/deploy.yml` – minden `main`-push (és pull request) után, **csak ha minden zöld, akkor élesít**:

1. `tests/check-*.js` – arculat, matricák, Greenwashing, Hűtő-mester, Mi van mögötte?, 2075, Ökos-rejtély tartalma.
2. `node tools/sw-lista.js --check` – naprakész-e az offline fájllista.
3. `node tools/smoke.js --offline` – fej nélküli Chrome-ban elindítja **mind a hat játékot** (a Szelektálj! mind a 4 szintjét) a főmenüből és a kioszkból, aztán elvágja a hálózatot, és offline is újra. Bármilyen JS-hiba, `console.error`, 404 vagy CSP-tiltás = piros.

Helyben is futtatható: `node tools/smoke.js` (~1,5 perc) vagy `node tools/smoke.js --offline` (~3,5 perc).

## Ha a CI piros

1. GitHub → **Actions** fül → a piros futás → a piros lépés naplója.
2. Lépésenként:
   * **check-…** hiba: a naplóban ott a hibás tartalom/elem; javítsd, vagy futtasd helyben ugyanazt a parancsot.
   * **sw-lista ELAVULT**: futtasd `node tools/sw-lista.js`, commitold a `web/sw-files.json`-t és a `web/sw.js`-t.
   * **Smoke-teszt HIBA**: az összesítő megmondja, melyik játék indításakor jött a hiba és mi az; futtasd helyben `node tools/smoke.js`, javítsd, push.
3. Amíg piros, az élő oldal a **régi, működő** verzión marad – nincs baj, csak nem frissül.
