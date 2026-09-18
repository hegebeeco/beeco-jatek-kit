# Közös játékkeret (beeco-jatek-kit)

Amit minden beeco játék használ, és ezért nem kell újraírni. Betöltés (a design system után, a játék előtt):
```html
<link rel="stylesheet" href="css/keret.css">
<script src="js/hang.js"></script>
<script src="js/keret/beallitasok.js"></script>
<script src="js/keret/bridge.js"></script>
<script src="js/keret/eredmeny.js"></script>
<script src="js/profil.js"></script>
<script src="js/qr.js"></script>
<script src="js/keret/kioszk.js"></script>
<script src="js/szereplok.js"></script>   <!-- ha kellenek a szereplők -->
```
A sablon (`sablon/web/js/jatek.js`) mindet használja – onnan érdemes kiindulni.

| Modul | Mire jó | Fő hívások |
|---|---|---|
| `hang.js` | némítás, halk háttérzene, hangjelzés, rezgés (a `dsSound`/`dsFeedback` is ezen megy át) | `beecoHang.zeneStart()`, `.beep(f, mp)`, `.setMuted(b)`, `.setMusic(b)`, `.setHaptic(b)` |
| `keret/beallitasok.js` | beállítás-panel: hang, zene, rezgés, kevesebb mozgás, vezérlés (érintés/egér) | `keretBeallitasok.panelHTML()`, `.bekot(el)`, `.kevesebbMozgas`, `.erintes` |
| `keret/bridge.js` | minden, ami kimegy (iframe / Flutter), + névtelen mérés | `beecoBridge.jatek(id)`, `.eredmeny({…})`, `.meres('start'|'end'|'quit')` |
| `keret/eredmeny.js` | kör vége panel (csillagok, felfutó pont, lenyitható részek, kioszkban QR) – magától hívja a profilt és a mérést | `keretEredmeny.mutat({ title, lead, stars, score, stats, more, ujra, kilep })` |
| `profil.js` | közös album, napi küldetés + sorozat, jelvények – minden játékon át | `beecoProfil.jatek({ id, nev, ikon, kuldetesek })`, `.gyujt(játék, id, név, matrica)`, `.kor({ stars })` |
| `qr.js` | QR-kód (az app letöltéséhez) – a könyvtár csak kérésre töltődik (cdnjs, SRI) | `qrHTML(url, px)`, `qrFill(gyökér)` |
| `keret/kioszk.js` | rendezvényi mód `?kioszk=1`: kezdőképernyő, védelem, tétlenségi alaphelyzet, képernyővédő, nagyítás | `keretKioszk.indit({ cim, alcim, kep, kartyak, inditas(id), alaphelyzet() })` |
| `szereplok.js` | a Zöldi család rajzolt szereplői + a méhecske | `szereploHTML('anya', 'talk')`, `szereploHozzaad(id, kinézet, név)` |

## A befogadónak (weboldal / beeco app – @Bence)
Minden üzenet `window.parent.postMessage` (iframe) vagy `BeecoBridge.postMessage(JSON)` (Flutter `webview_flutter` JS-csatorna).
- **Eredmény:** `{ type:'beeco-jatek', game:'<azonosító>', event:'runEnd' | 'levelEnd', …játékfüggő mezők (score, correct, tries, level, stars)… }`
- **Mérés (névtelen):** `{ type:'beeco-meres', game, event:'start' | 'end' | 'quit', seconds?, stars? }` – nincs név, azonosító, eszközadat.
  Ha a befogadó eltárolja, az adatkezelési tájékoztatót igazítani kell (a beeco döntése).
- A játék soha nem hív beeco API-t, és nem kezel tokent/jelszót. A Nektár-jóváírás a befogadó dolga.
