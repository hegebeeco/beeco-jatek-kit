# LED-izzó – kidolgozottsági szintek (2D matrica + 3D modell)

Ugyanaz a tárgy három szinten. Mindkét műfaj **egy közös profilból** készül (`profil.js`, cm-ben: 6 cm széles × ~10,8 cm magas),
így az arányok szintenként és a 2D ↔ 3D között is egyeznek. A „csapda” miatt a hagyományos izzótól ezek különböztetik meg:
átlátszatlan tejfehér búra (nincs izzószál), bordás világosszürke nyak, E27 menetes fém talp, sötét szigetelő + csúcs.

## Fájlok
| Fájl | Mi |
|---|---|
| `profil.js` | közös méretek (csúcs, szigetelő, menet, perem, nyak, búra) |
| `matrica.js` | `ledizzo_a/_b/_c` – `ART.add`, `shadow:'hard'`, automatikus `scale` (megdöntve is 8–92 között) |
| `modell.js` | → `ledizzo_a.glb`, `ledizzo_b.glb`, `ledizzo_c.glb` |
| `2d.png` | a három matrica 220 / 48 / 32 px-en |
| `3d_a.png`, `3d_b.png`, `3d_c.png` (+ `3d_all.png` egymás mellett) | játék-fény, cel-árnyalás; kamera mindháromnál: az 32, el 18, dist 3,1 |
| `zoom.js` | belső ellenőrző: nagy méretű matricák a beeco eredeti izzója mellett |

## 2D matricák
| Szint | Alakzat | Anyag | Döntés / nézet | Mitől ilyen |
|---|---|---|---|---|
| **A – Tiszta ikon** | 7 (5 forma + 2 borda-rovátka) | fehér, acél + sötét kiemelés | 8°, szemből | kézzel megadott formák, alap lapok (`fc d/v`); a menetet a talp hullámos oldala adja (nem dísz-vonal) |
| **B – Kidolgozott** | 16 | ugyanaz | 22°, 3/4 (felülről 16°) | vetítéssel számolt 4 éles tónus: a búrán fénysapka + sötét és legsötétebb sarló, a nyakon és a talpon függőleges sávok; 5 borda-rovátka, 4 menet (a lefelé néző menetlapok maguktól sötétebbek), fénycsík a talpon |
| **C – Gazdag** | 28 | ugyanaz (a csillanás a fehér anyag világos tónusa) | 26°, erősebb 3/4 (24°) | lapokra tört búra (12 × 6 négyszög-lap, enyhén elmozdítva → sokszög-kontúr, mint az MI-eredetiken), 12 egyenkénti borda gerinc-fénnyel és árnyék-vonallal, csavarvonalas (ferde) 5 menet fém-csillanással, perem, szigetelő, csúcs csillanással |

Technika (B, C): a felület normálisából számolt tónus, azonos tónusú lapok egy `path`-ba vonva (kevés alakzat), a tónus-lapok
0,85 egységgel behúzva a sziluettből, hogy a kontúr teljes vastagságban látsszon. Csak `ART.MAT` színek, színátmenet nincs.

## 3D modellek (`node tools/model-check.js`: mind ✓)
| Szint | Háromszög | Anyag | Szelet | Részek |
|---|---|---|---|---|
| **A – Minimál** | 176 | 4 (white:1, white:2, steel:2, dark:1) | 8 | búra (3 profil-szakasz), kúpos nyak, 2 menetes talp, szigetelő, csúcs; nincs letörés |
| **B – Közepes** | 800 | 6 | 16 | gömbösebb búra (6 szakasz), nyak + 8 külön borda, 4 menetgyűrű, szigetelő, csúcs |
| **C – Részletes** | 2 424 | 7 | 20–28 | búra (9 szakasz, 28 szelet), illesztő perem, nyak-mag + 16 kétszakaszos borda, valódi **csavarvonalas** menet sötét menet-maggal, peremezés, lépcsős szigetelő, forraszpötty-csúcs |

Minden rész esztergált profil (`lathe`); a takart sapkákat elhagytam (kevesebb háromszög), a búra alja zárt (különben a nyak és a búra
közti résen átszűrődő fény pöttyös gyűrűt rajzolt az árnyékba – ezt javítottam).

## Értékelés
- **Felismerhetőség:** mindhárom szinten LED-izzó és nem hagyományos: átlátszatlan búra, bordás nyak. A 32 px-es A és B a legtisztább;
  a C 32 px-en is felismerhető, de ott a részletei már összefolynak.
- **Legjobb 2D: B.** Sima, tejszerű búra (a legjobban mondja, hogy „opál, nem üveg”), olvasható menet és bordák, a 32 px-es képe is tiszta.
  A **C** áll legközelebb az MI-eredetik gazdagságához (lapokra tört búra, csavart menet); egymás mellett a beeco `izzo.webp`-vel egy családnak látszik.
- **Legjobb 3D: C** – a csavarvonalas menet és az egyenkénti bordák a játék fényében is látszanak, és még kényelmesen a keretben van (2 424 / 5 000).
  A **B** a jó ár–érték: 800 háromszöggel ugyanazt mondja el, csak a menet gyűrűs.

## Gyengeségek
- **3D búra:** a játék erős, meleg napfényében a fehér búra teteje kiég (tiszta fehér), a lapok csak az alsó sávban látszanak. Ez a fehér tárgyak
  közös gondja a cel-árnyalásban; sötétebb búra-szín már szürkének hatna.
- **A 3D:** a 8 szeletes búra „drágakő”-szerű sokszög – minimál szinten vállalható, de a legkevésbé barátságos.
- **C 2D:** a nyak a sok vonaltól kissé zsúfolt; a sokszög-kontúr kevésbé „cuki”, mint a B kerek búrája; a megdöntés miatt `scale` 0,87 (kisebb a tárgy).
- **B 2D fájlmérete:** ~29 KB SVG (a sima sávok és sapkák sűrű mintavétele) – a többi 4–16 KB. Ritkább mintavétellel (`step` 3→6, `region` 120→64 pont) felezhető.
- **A 2D:** a hullámos talp inkább rajzfilmes, mint pontos menet; a nyak és a búra ugyanaz az anyag (csak a kontúr és a rovátkák választják el).
- A 2D matricák nem mentek át a repó `tests/check-art.js`-én (a repóba nem írhattam); a kilógást és a NaN-t külön ellenőriztem (0 hiba).
