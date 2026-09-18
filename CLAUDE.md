# beeco-jatek-kit – a beeco webjátékok közös alapja

Ez a tároló a **közös** rész: design system, matricák, 3D készlet, eszközök, szabálykönyvek, skillek és az új játék sablonja.
A játékok külön tárolókban élnek (első: `~/CLAUDE/beeco-szelektalj`, élő: https://beeco-szelektalj.netlify.app), és a
`tools/kit-sync.js` másolja beléjük a közös fájlokat (lista: `KIT-FILES.json`). Magyar nyelv, tegezés, Kristóf a gazda
(ügyvezető, nem programozó – magyarázz). Ugyanazok a szabályok, mint a játékokban: `sablon/CLAUDE.md`.

## Szabályok a kit fejlesztéséhez
* **Visszafelé kompatibilitás:** a közös fájlok minden játékban futnak. Tokent, `ds-` osztályt, piktogramot, matrica-nevet,
  globális függvényt (DS, pic, artIcon, ART, MODEL, dsResultHTML, dsFeedback, DS.motion…) **ne nevezz át és ne törölj** –
  csak bővíts. Ha mégis kell, előbb nézd meg minden ismert projektben (`grep`), és frissítsd őket is.
* **Minőség:** B szintű rajz (`docs/rajzolas.md`), csak tokenek; `node tests/check-arculat.js && node tests/check-art.js` zöld.
* **Új közös fájl:** vedd fel a `KIT-FILES.json`-ba („sync”: a kit a gazdája · „sablon”: csak új projektbe kerül).
* **A sablon** (`sablon/`) mindig futó játék legyen: változás után `node tools/uj-jatek.js /tmp/proba "Próba"` és
  `node /tmp/proba/tools/smoke.js`.
* **Terjesztés:** commit + push után a projektekben `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .` (ezt szólj Kristófnak / a projekt Claude-jának).
* A skillek (`.claude/skills/`) a felhasználói szinten is telepítve vannak (`~/.claude/skills/beeco-arculat`, `beeco-jatek` →
  szimbolikus link ide), így minden Claude Code projekt látja őket.
* A beeco méhecskék (`web/assets/brand/`) belső használatúak; külső partner anyagban a beeco jóváhagyása kell. A tároló privát.

## Ismert játék-projektek
* `~/CLAUDE/beeco-szelektalj` – Szelektálj!, Hűtő-mester, Greenwashing-vadász, Mi van mögötte?, 2075, Ökos-rejtély, párbaj, Fenntartható otthon.
