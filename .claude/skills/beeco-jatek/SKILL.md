---
name: beeco-jatek
description: Új beeco webjáték indítása vagy fejlesztése a beeco-jatek-kit alapján (design system, B szintű matricák és 3D, sablon, kioszk/offline/CI, tervezési elvek). Használd, ha a felhasználó új beeco játékot kér, beeco játék-projektben dolgozol, vagy a közös kitet (design system, matricák) kell frissíteni.
---

# beeco játék – így dolgozz a kittel

A közös alap: **`~/CLAUDE/beeco-jatek-kit`** (GitHub: `hegebeeco/beeco-jatek-kit`, privát). Benne: design system (tokenek, `ds-` elemek,
mozgás, piktogramok, betűk), méhecskék és márkaképek, 370+ B szintű matrica és a 3D modell-készlet, élő kalauz (`web/arculat.html`),
eszközök (jatek-foto, smoke, sw-lista, art-*), szabálykönyvek (`docs/`), és egy **új játék sablon** (`sablon/`).
Az első, élő játékgyűjtemény: `~/CLAUDE/beeco-szelektalj` (https://beeco-szelektalj.netlify.app) – mintának jó.

## Új játék indítása
1. Olvasd el: `~/CLAUDE/beeco-jatek-kit/docs/jatektervezes.md` (elvek) és a felhasználó koncepcióját.
2. `node ~/CLAUDE/beeco-jatek-kit/tools/uj-jatek.js ~/CLAUDE/<mappa> "<Játék neve>" "<egy mondat>"`
   → kész, futó projekt (mintajáték, tesztek, offline, CI, CLAUDE.md), git init + első commit.
3. A felhasználó jóváhagyásával: `gh repo create hegebeeco/<név> --private --source <mappa> --push`, Netlify-oldal, és a
   `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` repo-titok (a tokent a felhasználó adja meg a GitHub felületén – chatben ne kérd).
4. Ezután a projekt saját `CLAUDE.md`-je a szabálykönyv.

## Munka egy beeco játék-projektben
- Felületi munka előtt a `beeco-arculat` skill (tokenek, ds- elemek, B szintű rajz).
- A kit közös fájljai (lista: `KIT-FILES.json` → `sync`) a projektben is ott vannak, ugyanazon az útvonalon.
  - **Frissítés a kitből:** `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .` (előtte `--check` megmutatja az eltérést).
  - **Ha a projektben javítottál egy közös fájlon** (új piktogram, új matrica, token): `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js . --vissza`,
    utána a kitben `node tests/check-arculat.js && node tests/check-art.js`, commit + push – és szólj, hogy a többi projekt is frissíthető.
- Ellenőrzés ablak nélkül: `node tools/jatek-foto.js <config.json>`; élesítés előtt: tesztek, `node tools/sw-lista.js`, `node tools/smoke.js`.

## Nem alkudható (minden beeco játékban)
- Konkrét szám/statisztika csak hiteles forrással; különben `TODO: forrás kell`. Valódi céget forrás nélkül nem minősítünk.
- Magyar, tegező, rövid, bátorító szöveg; játék közben kevés olvasás, a magyarázat a kör végén / lenyitható részben.
- Csak tokenek és ds- elemek; B szintű rajz (2D: 10–20 alakzat, 4 tónus, tömör olíva árnyék; 3D: 300–1200 háromszög, kódból).
- Stickeren nincs márka/logó/felirat/arc; a beeco méhecskét nem rajzoljuk újra; képek WebP-ben.
- A játék nem hív beeco API-t, nem kezel tokent/jelszót; kifelé csak postMessage / BeecoBridge.
- Commit: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
