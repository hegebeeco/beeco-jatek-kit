# beeco játéktervezési elvek (minden új játékra)

Forrás: Kristóf koncepció-dokumentuma („beeco webjátékok – az első 5 prototípus”, 2026-09-18) + a beeco-szelektalj projekt tanulságai.

## A közös mondat
**Ne azt kérdezzük a játékostól, hogy tudja-e a helyes választ. Adjunk neki egy rendszert, amibe belenyúlhat, majd mutassuk meg, mi változott.**

## Hat alapelv
1. **30 másodperc alatt érthető** – az első fél percben már csinál valamit; szabály csak annyi, amennyi feltétlenül kell.
2. **A rendszer tanítson** – az összefüggés a következményből derüljön ki; nincs hosszú magyarázat, nincs „jó/rossz ember”.
3. **Több szempont egyszerre** – víz, élőhely, kényelem, költség, idő ütközik; ettől érdekes a döntés.
4. **Rövid menet, újrajátszható helyzet** – 5–20 perc; az új menet más helyzetet adjon, ne ugyanazt a megoldást kérje.
5. **Nem baj, ha nincs tökéletes végállapot** – a végén **profil** (3–4 mondat a játékos rendszeréről), nem egyetlen „zöld %”.
6. **Mobilon is működő mozdulatok** – koppintás, húzás, lerakás, vonalhúzás, kétirányú döntés; billentyűzet nem kell.

## Amit a beeco-szelektalj projektből tanultunk
* **Kevés olvasás játék közben:** legfeljebb 3 szó visszajelzés; a magyarázat a kör végén vagy lenyitható részben, forrással.
* **Hitelesség:** konkrét szám csak hiteles forrással (lehetőleg 2 egyező); a „rendszerértékek” jelzőcsíkok, nem mért adatok.
* **Kompromisszum, nem propaganda:** egyik gomb se legyen mindig az erkölcsösebb; valódi céget forrás nélkül nem minősítünk.
* **Mozgás és visszajelzés:** minden döntés után látható hatás (DS mozgás-készlet: felszálló pont, csipesz-pattanás, darabkák).
* **Rendezvényre is:** kioszk-mód, offline működés, gyors kör, kétjátékos lehetőség.
* **A tartalom adat:** JSON-ban, a beeco szerkeszti; tesztek ellenőrzik (hossz, forrás, matrica).

## Az 5 koncepció röviden (javasolt sorrend)
1. **Polgármester egy napra** – kétirányú döntéskártyák, 4 rendszerérték, késleltetett következmények, városprofil (gyors MVP).
2. **Élő kert** – lapkalerakás + szomszédsági hatások (élőhely, víz, hő, használhatóság), időjárás-események, kertprofil.
3. **Ételmentő** – hűtőrendezés, frissesség-lépcsők, receptek, 5 nap (a Hűtő-mester tartalmára építhető).
4. **Beporzó hálózat** – élőhelyek összekötése korlátozott kapcsolatszámmal, zavarások, redundancia.
5. **Körforgó háztartás** – kártya-kombinációk, anyagáramlás, hely/idő/pénz, receptkönyv.
