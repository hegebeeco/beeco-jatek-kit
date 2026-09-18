# Közös játékosprofil és a „központ” (beeco playground)

**Cél:** a játékos egy albumba gyűjt, egy napi küldetést teljesít és egy sorozatot visz végig – bármelyik beeco játékkal játszik.

## Miért kell közös cím?
A böngésző a mentéseket (localStorage) **címenként (origin)** külön tárolja. Ha minden játék saját Netlify-címen fut, az albumok
nem látnak át egymásba. Megoldás (2026-09-18 döntés): **egy központi cím**, a játékok alútvonalon:
`https://beeco-szelektalj.netlify.app/` (a mostani gyűjtemény) · `…/polgarmester/` · `…/elo-kert/` …
Minden játék **külön tárolóban és külön Netlify-oldalon** marad (önállóan élesíthető), a központ pedig a Netlify
átirányításával (proxy, 200-as státusz) a saját címén szolgálja ki – a böngésző szemében ez ugyanaz a cím.

## Új játék bekötése a központba
1. A játék Netlify-oldala él (pl. `https://beeco-polgarmester.netlify.app`). A játék csak **relatív** útvonalakat használjon
   (`css/…`, `js/…`, `data/…` – a sablon ilyen), így alútvonalon is működik; a service worker hatóköre is az alútvonal lesz.
2. A központ (beeco-szelektalj) `netlify.toml`-jába:
   ```toml
   [[redirects]]
     from = "/polgarmester/*"
     to = "https://beeco-polgarmester.netlify.app/:splat"
     status = 200
     force = true
   ```
3. A központ menüjébe (`web/data/jatekok.json`) egy új kártya `"url": "polgarmester/"` mezővel – a menü ilyenkor oda navigál.
4. A játék a `profil.js`-szel regisztrál (`beecoProfil.jatek({ id, nev, ikon, kuldetesek })`) – a napi küldetések közé
   bekerülnek a feladatai, a matricái az albumba.

## Mi közös, mi nem
- **Közös** (ugyanaz a mentési kulcs): album (`beeco_album`), napi küldetés (`beeco_napi`), jelvények (`beeco_jelveny`),
  regisztrált játékok (`beeco_jatekok`), beállítások (`beeco_muted`, `beeco_music`, `beeco_haptic`, `beeco_reduce`, `beeco_input`).
- **Játékonként külön:** rekordok, ranglisták, mentett állás (a kulcsban a játék azonosítója).
- Kioszkban a látogató nyomai (album, küldetés, mentés) alaphelyzetkor törlődnek, a beállítások maradnak.

## A beeco app mint profil (később)
Ha a játékok a beeco appban futnak, a profil az appban is tárolható (a `bridge` üzeneteiből) – ezt Bencével kell egyeztetni.
