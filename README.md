# beeco-jatek-kit

A beeco webjátékainak **közös alapja** – hogy minden új játék ugyanabban a stílusban, ugyanazokkal az eszközökkel,
ugyanazzal a minőséggel induljon, és a fejlesztések (új matrica, új piktogram, jobb eszköz) minden játékhoz eljussanak.

## Mi van benne
| Rész | Hol |
|---|---|
| **Design system** – tokenek, `ds-` elemek, játék-minták, mozgás-készlet, piktogramok, betűk | `web/css/`, `web/js/ds.js`, `web/js/pics.js`, `web/assets/fonts/` |
| **Élő kalauz** – minden elem, szín, ikon, matrica egy oldalon | `web/arculat.html` |
| **Méhecskék és márkaképek** (beeco – belső használatra) | `web/assets/brand/` |
| **370+ B szintű matrica** kódból + **3D modell-készlet** | `web/js/art/` (`art.js`, `model-kit.js`, `art-*.js`) |
| **QR-kód, offline mód** (service worker) | `web/js/qr.js`, `web/js/offline.js`, `web/sw.js`, `tools/sw-lista.js` |
| **Eszközök** – ablak nélküli böngészős ellenőrzés, smoke-teszt, matrica-render/ív/prompt/import, 3D-ellenőrzés | `tools/` |
| **Szabálykönyvek** – arculat, rajzolási mérce (B szint), promptolás, offline + CI, **játéktervezési elvek** | `docs/` |
| **Claude-skillek** – `beeco-arculat`, `beeco-jatek` | `.claude/skills/` |
| **Új játék sablon** – futó mintajáték, tesztek, CI, offline, CLAUDE.md | `sablon/` |

## Használat
**Új játék:**
```bash
node ~/CLAUDE/beeco-jatek-kit/tools/uj-jatek.js ~/CLAUDE/beeco-polgarmester "Polgármester egy napra" "Gyors városi döntések, amelyeknek nincs mindig tiszta nyertese."
```
**Meglévő játék frissítése a kitből** (a projekt mappájából): `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .`
(csak megnézni: `--check`) · **egy játékban végzett közös fejlesztés visszaküldése a kitbe:** `--vissza`, majd a kitben commit + push.

**Miért másolás, és nem git submodule?** Minden játék önállóan élesíthető marad (Netlify, offline mód, CI), nem kell privát
almodul-hozzáférést beállítani, és a Claude Code minden projektben ugyanazon az útvonalon találja a fájlokat. A `kit-sync --check`
mutatja meg, ha egy projekt lemaradt.

## A kit fejlesztése
Lásd `CLAUDE.md`. Röviden: minden változás után `node tests/check-arculat.js && node tests/check-art.js`, és ha a sablon
változott, egy próba-projekt: `node tools/uj-jatek.js /tmp/proba "Próba"` + `node /tmp/proba/tools/smoke.js`.
