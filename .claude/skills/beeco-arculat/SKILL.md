---
name: beeco-arculat
description: A beeco játékok design systemje („Méhsejt-diorama”). Használd MINDEN olyan munkánál, ami a játékok kinézetét érinti – új vagy átdolgozott képernyő, panel, gomb, HUD, menü, CSS, piktogram, 3D díszlet színe/fénye, vászonra rajzolt tábla, játékon belüli szöveg hangneme –, és amikor egy régi modult át kell állítani az új arculatra.
---

# beeco design system – így dolgozz

A projekt közös arculata tokenekre, egy `ds-` elemkészletre, saját piktogramokra és egy 3D palettára épül.
A teljes szabálykönyv: `docs/arculat.md`. Élő bemutató: `web/arculat.html`.

## Mielőtt hozzányúlsz

1. Olvasd el a `docs/arculat.md` releváns részét (3. tokenek, 4. elemkészlet, 6. 3D világ, 7. szöveg).
2. Nézd meg, van-e már rá elem a `web/css/ds.css`-ben vagy piktogram a `web/js/pics.js`-ben – **előbb használd a meglévőt**.

## Szabályok (nem alkudható)

- **Csak tokenek:** színt, méretet, sarkot, árnyékot `var(--…)`-ként írj (`web/css/tokens.css`). Nyers hex szín, kemény
  eltolt árnyék (`box-shadow: 4px 4px 0 …`), `--sarga` / `--fekete` / `--krem`, `#FFD600`, Bricolage vagy Trebuchet
  elsődleges betűként: **tilos új kódban**.
- **Új token** kell? Vedd fel a `tokens.css`-be ÉS a `web/js/ds.js` `DS.color`-jába (a teszt összeveti őket).
- **Tartalom-szín** (valódi tárgy színe: kuka, öko-címke, LCD-kijelző, parafatábla, jelenet-ég): NÉVVEL deklaráld egyedi
  tulajdonságként az elemen (`--rz-lcd:#9dff8a;`), és a szabályban `var(--rz-lcd)`-t használj. 3D-ben: `DS.world` / `DS.interior`.
- **Új CSS-fájl** a `tests/check-arculat.js` `DS_FILES` listájába kerül (minden CSS ellenőrzött).
- **Elemek** (`ds.css`): `ds-btn` (képernyőnként egy), `ds-btn-sm`, `ds-icon-btn` (+`aria-label`), `ds-chip`, `ds-card`, `ds-panel`,
  `ds-hex`, `ds-details`, `ds-switch`, `ds-tabs`, `ds-seg`, `ds-feedback`, `ds-meter`, `ds-banner`, `ds-key`.
- **Játék-minták** (`ds-game.css`): `ds-say`/`ds-avatar`/`ds-bubble`, `ds-stars` (`dsStarsHTML`), eredmény (`dsResultHTML` –
  MINDEN szint/kör vége ezzel), `ds-input`/`ds-code`, `ds-badge`, `ds-loader`/`ds-skeleton`, `ds-dots`, `ds-tag`, `ds-checklist`,
  `ds-toast`, `ds-bars`, `ds-dark` (éjszaka, hőkamera), `ds-anim-*`. Rétegek: `--z-*` tokenek, nyers z-index szám helyett.
  Új elemtípus: a `ds.css` / `ds-game.css`-be kerül, bemutatóval az `arculat.html`-be, leírással a `docs/arculat.md` 4. pontjába.
- **Visszajelzés:** `dsFeedback('good' | 'great' | 'try')` – hang + rezgés + méhecske egyben. Rossz válasznál a `think`
  (gondolkodó) méhecske, SOHA a mérges; a `harm` csak környezeti kárt mutat a tartalomban. Hangulatok: `DS.moods`.
- **Piktogram emoji helyett** a vezérlőkön: `pic('név')`. Új ikon a `pics.js`-be, ugyanabban a stílusban.
- **Illusztráció a tartalomra** (tárgy, étel, készülék, hulladék – nem vezérlő): `artIcon('🧊')` HTML-ben, `ART.draw()` / `ART.image()`
  vásznon és 3D-ben, vegyesen `dsIcon()`. **Minden új matrica és 3D modell a jóváhagyott B szinten készül: `docs/rajzolas.md`**
  (etalon-táblák, mintakód `docs/rajzolas/minta/`, rajzoló megbízás-sablon `docs/rajzolas/rajzolo-brief.md` – rajzoló ügynöknek ezt add).
  Render: `node tools/art-render.js 2d|3d` → nézd meg a képet (≤ 3 javító kör) → `node tests/check-art.js`, `node tools/model-check.js`.
- **MI-kép vagy 3D modell** a matricák helyére: `docs/promptolas.md` (promptok: `node tools/art-prompts.js`, referencia:
  `node tools/art-png.js`, beemelés minőség-ellenőrzéssel: `tools/art-import.py`, GLB: `tools/model-check.js` + `tools/modell-nezo.html`).
- **Felugró panel:** `role="dialog"` + `aria-modal="true"`, a bezáró gombon `data-ds-close` – a `ds.js` őre intézi a Tab/Esc/fókuszt.
- **3D:** színek `DS.world`-ből, kültéri fény `DS.light.outdoor`, táblák `DS.signCanvas` / `DS.pillCanvas`;
  low-poly, cel-árnyalás; `flatShading` a toon anyagon tilos (r128).
- **Kevés szöveg:** képernyőnként egy mondat, a többi `ds-details`-ben. Tegeződő, bátorító hangnem; szám csak forrással.
- **Hozzáférhetőség:** szín mellé mindig ikon is; koppintási felület ≥ 44 px (`--tap`); fókuszkeret marad.
- **Betöltés:** a `fonts` → `tokens` → `ds` a modulok CSS-e ELŐTT töltődik; a modul CSS-e erre épít.

## Régi modul átállítása

1. Futtasd: `node tests/check-arculat.js` – kiírja, melyik fájlban hány régi minta van.
2. A modul CSS-ében cseréld a régi tokeneket szerepekre (`--fekete` → `--ink`/`--line`, `--sarga` → `--accent`,
   `--krem` → `--bg`), a kemény árnyékot `--soft` / `--soft-sm` / `--press`-re, a saját gombokat `ds-` elemekre.
3. Nézd meg a böngészőben: asztali, 375×812, 812×375; konzol hibamentes.
4. `node tests/check-arculat.js --update` – rögzíti az alacsonyabb régi-minta számot; frissítsd a `docs/arculat.md` 10. pontját.

## Mielőtt késznek mondod

- `node tests/check-arculat.js` és `node tests/check-art.js` zöld (és a többi `tests/check-*.js`).
- Böngészős ellenőrzés a három méreten; új elem esetén az `arculat.html` is mutatja.
- Nincs új régi minta (a racsni ezt kikényszeríti – ha piros, ne a baseline-t emeld, hanem javítsd a kódot).
