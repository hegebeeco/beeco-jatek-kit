# Szerepes méhecskék

A beeco méhecskét **nem rajzoljuk újra** (Kristóf, 2026-09-18: „csinálhatsz új méhecskéket a mostani alapján”): az eredeti
képre (`web/assets/brand/bee-happy.webp`) kódból rajzolt kellékek (SVG) kerülnek mögé és elé.

| fájl (`web/assets/brand/roles/`) | szerep | kellékek |
|---|---|---|
| `polgarmester.webp` | Polgármester egy napra | szalag hatszög-jelvénnyel, jegyzettábla |
| `elo-kert.webp` | élő kert, városi zöld | szalmakalap, locsolókanna |
| `etelmento.webp` | ételmentés | kendő, befőttesüveg |
| `beporzo.webp` | beporzók | pilótaszemüveg, virág |
| `korforgo.webp` | körforgás, javítás | sapka körforgás-jellel, csavarkulcs |

Szabály: márka, logó, felirat, arc a kellékeken nincs; B szint (10–20 alakzat, 4 tónus, tömör olíva árnyék).
**Új szerep:** másolj egy `tools/meh-szerepek/*.html` fájlt, írd át a `window.MEH = { back, front }` SVG-részleteket, majd
`node tools/meh-szerepek/render.js <név>` → 300×300 WebP. Egyben nézed: `python3 tools/meh-szerepek/sheet.py`.
