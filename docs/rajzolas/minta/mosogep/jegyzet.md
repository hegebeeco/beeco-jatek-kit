# Mosógép – kidolgozottsági próba (A / B / C)

Fájlok: `matrica.js` (2D: `mosogep_a/_b/_c`), `modell.js` → `mosogep_a/_b/_c.glb`, képek: `2d.png`, `3d_a.png`, `3d_b.png`, `3d_c.png`
(3D kamera mindháromnál: az 32 · el 18 · dist 3,9). Segédek: `ellenoriz.js` (alakzatszám + megdöntött befoglaló), `nagy.js` (nagy nézet).

## 2D matricák

| Szint | Alakzat | Anyag | Dőlés | Befoglaló (megdöntve) | Mitől ez a szint |
|---|---|---|---|---|---|
| **A – Tiszta ikon** | 7 (2 díszjel: kezelősáv-vonal, csillanás) | fehér + acél + víz (kiemelő) | −6° | x 18–82, y 10–91 | szemből; alap `d` lapok; kerek kék ablak + keret + fiók + gomb |
| **B – Kidolgozott** | 19 | fehér, acél, üveg, víz, rózsa, méz, levél | −15° | x 16–83, y 10–88 | 3/4-es nézet (teteje + jobb oldala), 4 tónus (tető világos · eleje alap + lapok · oldala sötét + acél-szilánk · hátsó élsáv legsötétebb), keret vastagsága, üveg, víz, 2 ruha, 2 jelzőfény, gomb mutatóval, 2 csillanás |
| **C – Gazdag** | 44 | + sötét (lábak), papír (buborék) | −14° | x 15–84, y 10–89 | erősebb perspektíva; lapokra tört felületek (oldal-, tető- és előlap-szilánkok, élsáv, lábazat); letört élek fénycsíkkal; 3 láb; fiók vastagsággal és fogantyú-mélyedéssel; gomb vastagsággal; kétféle tónusú fémkeret (világos/sötét cikk); árnyékos belső perem; víz hullámvonallal, ruha gyűrődésvonallal, áttetsző (`o`) hullámfodor, 2 buborék, áttetsző üveglap + 2 tükröződés; ajtókilincs |

A B és C egy kis 3D-vetítésből épül (méterben leírt gép, közös kamera), ezért az ajtó ellipszise, a fiók és a gomb pontosan az előlapon ül.

## 3D modellek (model-check: mind ✓)

| Szint | Háromszög | Anyag | Méret | Mitől ez a szint |
|---|---|---|---|---|
| **A – Minimál** | 180 | 4 (test, munkalap, acél, víz) | 15 KB | dobozok + 8 szögű hengerek: test, munkalap, fiók, gomb, keret, kék ablak, 4 láb |
| **B – Közepes** | 892 | 6 | 66 KB | letört élű test + munkalap, 16 szögű részek: ajtólap, tórusz-keret, domború kék üveg, gomb mutatóval, fiók, 2 jelzőfény, horony, 4 hengeres láb |
| **C – Részletes** | 3 328 | 8 | 239 KB | lekerekített test, 24–32 szögű részek; B-n felül: gumitömítés, dob hátfala, hullámos víz, rózsaszín és sárga ruha, üveg-csillanás, zsanér, kilincs, 2 gomb, fiók fogantyú-mélyedéssel, lábazat-lemez, esztergált gomb |

**Szín-tanulság (3D):** a játék cel-fényében a tiszta fehér test teteje és oldala ugyanabba a legvilágosabb sávba esik, és „kiég” (az égbolt előtt eltűnik az éle). Megoldás: szürkésfehér test (`white:2`) + világosabb munkalap (`white:1`) + sötétebb acél (`steel:2`). Ez a többi fehér géptárgynál is kelleni fog.

## Gyengeségek (őszintén)

- **2D B és C 48 px-en alig különbözik** – a C többlete (lábak, élek, buborék, fogantyú) csak 120 px fölött látszik; 32 px-en mindkettő kissé zsúfolt, az A a legtisztább.
- **Fehér test a fehér peremen:** a sziluettet csak a vékony kontúr és az olíva árnyék tartja – a B/C oldallapja nagy, lapos szürke felület.
- **2D C:** a 44 alakzatból 38 részlet; a ruhák inkább „foltok”, mint ruhadarabok; az áttetsző fodor miatt a sárga ruha halványabb.
- **Dőlés:** az óramutató irányú dőlés a 3/4-es dobozt „eldőlőnek” mutatta, ezért −14…−15° lett; ez eltér az elem/konzerv eredetiktől (azok jobbra dőlnek).
- **3D:** átlátszó üveg nincs (a néző átlátszatlan toon-anyagot tesz rá) – a C a vizet és a ruhákat a keret mögé ültetve mutatja; a ruhák lapított gömbök (tojás/pirula hatás). A-n a lábak ebből a távolságból nem látszanak.
- Munkaidő-korlát miatt szintenként legfeljebb 3 javító kör volt.

## Vélemény

- **2D:** a **B** a legjobb egyensúly – a 3/4-es nézet és a látható ruha miatt élő, „beeco-matrica” hatású, és 48 px-en még tiszta. Az A a legjobban olvasható kicsiben (lista-ikonnak ideális), a C nagy méretben a leggazdagabb, de kicsiben nem hoz többet a B-nél.
- **3D:** a **C** a legjobb – a víz + ruha + tömítés az ablakban azonnal „mosógépet” mond, és 3 328 háromszöggel bőven a keretben marad; a B szépen tiszta, de üres kék ablakkal, az A csak távoli díszletnek elég.
