# Sajtszelet – részletesség-próba (A / B / C)

Fájlok: `matrica.js` (2D: `sajt_a`, `sajt_b`, `sajt_c`) · `modell.js` → `sajt_a.glb`, `sajt_b.glb`, `sajt_c.glb` ·
képek: `2d.png`, `3d_a.png`, `3d_b.png`, `3d_c.png`, `3d_all.png` (a három 3D egymás mellett, kivágva).
Kamera mindhárom 3D-nél: `az 32 · el 22 · dist 5`.

## Módszer

* **2D:** a szeletet valódi méretben (12 × 7,2 cm, 46°-os ív) 3D-ben írtam le, és egy kis vetítéssel számoltam a lapok pontjait.
  Így a lyukak a lap síkjában torzulnak, az élen vágott lyukak valódi „harapások”, és mindhárom szint ugyanabból a nézetből épül.
* **3D:** logikai kivonás nincs, ezért a lyukas lapokat saját fülvágó háromszögelő bontja (a lyukakat híddal fűzi a körvonalba),
  a lyukba üreg kerül. Az élen vágott buborék negyedgömb, amelynek pereme ugyanazokból a csúcsokból áll, mint a két szomszédos lap
  körvonal-íve, így nincs rés. A háromszögek körüljárását minden lapnál a kifelé mutató irányhoz igazítottam, mert a nézegető
  csak az elülső oldalt rajzolja.

## 2D matricák

| | Alakzat | Anyag | Döntés | Mitől más |
|---|---|---|---|---|
| **A – tiszta ikon** | 6 (3 lap + 3 lyuk) | honey + gold | −8° | alap-lapozás (a készlet saját fény/árnyék-háromszögei), egyenes kéreg-lap, kontúros lyukak. 32 px-en is azonnal sajt. |
| **B – kidolgozott** | 15 | honey, gold, paper (fény) | −20° | 4 éles tónus (világos teteje, alap eleje, sötét kéreg-oldal, legsötétebb kéreg-sáv a két vágott lapon), íves kéreg, lyukak árnyékos belső sarlóval, 2 élen vágott lyuk, fénycsík. |
| **C – gazdag** | 39 | honey, gold, paper | −22° | lapokra tört felületek (eleje 3 tónus, teteje 3, kéreg 3 sáv), 3 harapás (2 a sziluettben: alsó és hátsó felső él; 1 a felső élen átvágott buborék), 9 lyuk, a nagyok kétárnyalatú belső fallal (árnyék + fényes perem), enyhén szabálytalan kéreg-sáv, fénycsík a vágásélen. |

## 3D modellek (model-check: mind ✓)

| | Háromszög | Anyag | Mitől más |
|---|---|---|---|
| **A – minimál** | 58 | 3 (gold:1 bél, honey:2 teteje, gold:2 kéreg + lyukak) | egyetlen kihúzott szelet (6 ív-szegmens), 3 lapos, 10 szegmenses sötét korong 0,4 mm-rel a lap előtt. Élletörés nincs. |
| **B – közepes** | 396 | 4 (+ honey:3 él) | letört kéreg-él (4 mm), valódi lyukak 14 szegmenses kúp-üreggel (4 elöl, 2 felül, 1 hátul), 1 élen vágott buborék a felső első élen, 12 ív-szegmens. |
| **C – részletes** | 2 518 | 4 (gold:1, honey:2, gold:2, honey:3) | külön kéreg-réteg (4 mm, letört külső élekkel, elöl-hátul látszó kéreg-sávval), csúcs-letörés, 24 szegmenses kétszínű tál-lyukak (sötét felső fal, aranyszínű fenék: 6 elöl, 3 felül, 2 hátul, 1 alul), 3 élen vágott buborék (felső első, alsó első, hátsó felső él), 24 ív-szegmens. Méret: 179 KB. |

Színek: a játék napfénye (cel-árnyalás) a `honey:1`-et citromsárgára égeti, ezért a bél `gold:1`, a teteje `honey:2`
(két változatot próbáltam: a `gold:2` teteje sötétebb lett az elejénél, és elnyelte a lyukakat).

## Gyengeségek (őszintén)

* **2D C:** a felső élen átvágott buborék 48 px-en csak sötét folt. A tető három tónusa nagyban kissé zajos. 32 px-en a B és a C
  alig különbözik, a többletmunka csak nagy méretben (72 px felett) térül meg.
* **2D A:** egyenes a kéreg-lap, és a lyukak kontúrosak, ezért kicsit „rajzfilmesebb”, mint a B/C. Ikonnak viszont ez a legtisztább.
* **3D A:** a 10 szegmenses korongok nagyban sokszögletűek, és lapos foltnak látszanak, nem mélyedésnek.
* **3D B:** a kúp-lyukak lapozottsága (facetek) közelről látszik. A sötét letört kéreg-él kissé „égett szélnek” hat.
* **3D C:** 4 anyag – a kiírás 6–8-as felső határán belül, de kevesebb. Több szín nem javított, a fény már ad elég tónust.
  A csúcs-letörés ebből a szögből nem látszik. A vágott élek szándékosan élesek (késsel vágott sajt, és így tiszták a harapások).
  A `modell.js` 229 sor: ha a készletbe kerül, a háromszögelőt és az üreg-építőt érdemes külön modulba tenni.
* A 3D-ben nincs fehér perem és kontúr, így a C ugyanúgy olvasható, mint a 2D matrica, a B viszont „műanyagosabb”.

## Vélemény

* **3D-ben a C a legjobb:** a mély, kétszínű lyukak és a harapások miatt ez az egyetlen, ami valódi, étvágygerjesztő sajtnak hat
  (nem sárga doboz pöttyökkel). 2,5 ezer háromszögével és 179 KB-jával kényelmesen belefér a keretbe.
* **2D-ben a B a legjobb egyensúly:** az íves kéreg, a 4 tónus és a sarlós lyukak 48 px-en is gazdag hatást adnak, zaj nélkül.
  A C csak nagy kártyán (Hűtő-mester 256 px-es vászna, 2D kártyák) éri meg.
