# Rajzoló megbízás – sablon (B szint)

> Ezt a szöveget kapja minden rajzoló ügynök (Claude al-ügynök), amikor matricát és/vagy 3D modellt készít.
> A `{…}` helyeket ki kell tölteni. A mérce: `docs/rajzolas.md` · etalon: `docs/rajzolas/etalon-*.jpg` · mintakód: `docs/rajzolas/minta/`.
> Az ügynöknek angolul adjuk (pontosabban követi), a jegyzetét magyarul írja.

---

You are drawing art for beeco's Hungarian browser games at the approved **"B" detail level**. Quality must match the approved
reference boards exactly (level B column).

**Work only in:** `{MUNKAMAPPA}` {ÉS/VAGY: the repo file `{REPO-FÁJL}`}. Do not edit any other file.

## Object(s)
{TÁRGYANKÉNT: magyar név · angol név · valódi méret (cm vagy m) · mi látszik rajta · MI KÜLÖNBÖZTETI MEG a hasonló tárgytól ·
a matrica neve (pl. i_tukor / f_sajt / emoji-név) · kell-e 3D (igen/nem)}
No text, letters, numbers, brand names or logos.

## Read first
1. The standard: `docs/rajzolas.md` (B level for 2D and 3D, light lessons, workflow).
2. Reference boards (Read the images; match the **B** column): `docs/rajzolas/etalon-mosogep.jpg`, `etalon-ledizzo.jpg`, `etalon-sajt.jpg`.
3. Example code at B level: `docs/rajzolas/minta/mosogep/matrica.js` (`mosogep_b`) and `modell.js` (level B block), `minta/ledizzo/` (shared size profile `profil.js`), `minta/sajt/`.
4. 2D kit: `web/js/art/art.js` (shapes, `tilt`, `shadow:'hard'`, `scale`, `ART.geo` incl. `camera` projection) and the rules in `docs/grafika-spec.md`. Materials only from `ART.MAT`.
5. 3D kit (if 3D is requested): `tools/modell-kit.js`.

## Level B – 2D sticker
10–20 shapes · 4 hard-edged tones on main surfaces (light / base / dark / darkest edge band), no gradients · three-quarter view, tilt 10–30° (box-like objects lean left = negative degrees) · `shadow:'hard'` · the characteristic, distinguishing details drawn · 1–2 shine strips · build it from real dimensions with `ART.geo.camera` (and share the size list with the 3D model) · clean at 48 px · SVG ≤ 10 KB (1-decimal coordinates, no dense sampling) · everything inside 8–92 (use `scale`).

## Level B – 3D model (if requested)
300–1200 triangles · main body chamfered (`chamferBox`), round parts 12–16 segments · characteristic details as separate parts · 4–6 flat colors from `ART.MAT` · real size in meters, Y up, +Z front, base at y = 0 · apply the light lessons (white body → `white:2` + `white:1` top, yellow food → `gold:1` + `honey:2` top) · must pass `node tools/model-check.js`.

## Process (mandatory)
1. Build → render: `node tools/art-render.js 2d <file.js> <out.png>` and `node tools/art-render.js 3d <model.glb> <out.png> 32 18 <dist>` → **Read the PNGs**.
2. Critique honestly against the B column of the reference boards: recognizable at 48 px? distinguishable from similar objects? proportions? floating/intersecting parts? consistent palette?
3. Fix and re-render – at most 3 rounds per object.
4. Run `node tests/check-art.js` (if you edited a repo art file) and `node tools/model-check.js` for GLBs.

## Report
Short Hungarian note (`jegyzet.md` in the work folder): shape and triangle counts, what makes each object recognizable, honest weaknesses.
Reply with a concise summary: file paths, counts, weaknesses.
