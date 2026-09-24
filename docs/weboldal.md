# A design system a weboldalon (beeco.hu, Webflow): `[WEB]` réteg

A beeco.hu Webflow-ban épül, nem ebből a tárolóból. A **tokenek és a formanyelv** ugyanazok, mint a játékokban
(`web/css/tokens.css`), de néhány dolog csak a weboldalon létezik, vagy ott másképp működik. Ezeket ebben a
tárolóban **`[WEB]`** jelöli: ahol ezt a jelet látod, az a weboldalra vonatkozik, a játékokra nem.

* `[WEB]` = csak a weboldalon használt minta vagy szabály (a játékokba nem kerül, a `kit-sync` nem viszi át).
* Jelölés nélkül = közös (játék és weboldal is), vagy csak játék.

Első ilyen oldal: az új főoldal piszkozata (Webflow: „Főoldal 2026 (draft)”, `/fooldal-2026-draft`, 2026-09-18).

## 1. Tokenek a Webflow-ban

A Webflow Designer osztálypaneljében nem lehet `var(--…)`-t írni, ezért a Webflow-osztályok a tokenek **pontos
értékét** kapják (ugyanaz a hex, ugyanaz az árnyék). Az oldal saját kódja (Page settings → Custom code → Head) a
tokeneket CSS-változóként is felveszi a `.h26-page` burkolón, és a hover / kattintás / fókusz állapotok már
`var(--…)`-t használnak. Ha egy token értéke változik a `tokens.css`-ben, a Webflow-ban is át kell írni.

| Token | Érték | Webflow-ban |
|---|---|---|
| `--bg` (`--cream`) | `#FFF8E7` | oldalháttér (`h26-page`) |
| `--surface` (`--paper`) | `#FFFDF6` | kártya, csipesz, kérdés-sor |
| `--ink` / `--line` (`--olive`) | `#2F371E` | szöveg, minden körvonal |
| `--ink-soft` (`--olive-soft`) | `#596B39` | címke (eyebrow), évszám, másodlagos szöveg |
| `--accent` (`--honey`) | `#FECF39` | fő gomb, aktív elem, kiemelt kártya, webshop sáv |
| `--sage` | `#D3DDBB` | hero és záró blokk háttere |
| `--sage-bg` | `#E3ECCD` | váltakozó szekció, városok, „Hangok a rajból” |
| `--leaf` | `#6E8947` | nagy hatszög a hero mögött, felsorolás-sejt (szövegre nem: krémen csak 3,9:1) |
| `--night` | `#1F2615` | sötét kártya: kampány, hírlevél, ragadós sáv |
| `--focus` | `#2656D9` | billentyűzet-fókusz |
| `--line-w` | `3px` | minden körvonal |
| `--r-s / m / l / xl / pill` | 12 / 18 / 24 / 32 / 999 px | QR · csipesz, stat · kártya, kép · nagy kártya · gomb |
| `--soft` | `0 4px 0 rgba(47,55,30,.18), 0 10px 22px rgba(47,55,30,.10)` | kártya, panel |
| `--soft-sm` | `0 3px 0 rgba(47,55,30,.18)` | csipesz, kis gomb, matrica |
| `--press` | `0 4px 0 #2F371E` | nagy gomb „vastagsága” |
| `--display` / `--body` | Lalezar / Open Sans | a Webflow saját tárhelyről tölti (Site settings → Fonts) |

**Tilos a weboldalon is:** kemény, eltolt fekete árnyék (`4px 4px 0 #000`), nyers fekete (`#000`, `#1b1b18`),
a régi citromsárga, 2 px-es körvonal, harmadik betűcsalád (a Montserrat és az Exo 2026-09-18-án kikerült).

## 2. `[WEB]` minták: csak a weboldalon

| Minta | Webflow-osztály | Játék megfelelője | Szabály |
|---|---|---|---|
| `[WEB]` **Szekció-ritmus** | `h26-sec` + `h26-bg-mist` / `-yellow` / `-sage` | nincs | krém az alap, minden második blokk színes; teljes méz sáv oldalanként egyszer |
| `[WEB]` **Méhsejt-perem** | `h26-divider` (+ oldal-CSS) | nincs | csak háttérszín-váltásnál; a felső szekció színe „csöppen” a következőbe, 3 px olíva kontúrral |
| `[WEB]` **Méhsejt-háló a heróban** | `h26-hero` háttérképe | `hatter2d` méhsejt | 8% olíva vonal, csak a heróban |
| `[WEB]` **Áruház-gombpár** | `h26-store` | `ds-btn` | méz pill, `--press`; két gomb egymás mellett + QR asztalon; mobilon QR nélkül |
| `[WEB]` **Megnyugtató sor a gomb alatt** | `h26-micro` | nincs | csak igaz állítás: „Ingyenes · magyar · 3 perc alatt kiderül a lábnyomod” |
| `[WEB]` **Bizonyíték-sor** | `h26-proof-row` / `h26-proof-item` | `ds-chip` | legfeljebb 3 szám, mindegyik a beeco saját adata (forrás: beeco, 2026-09) |
| `[WEB]` **Funkció-fülek** | `h26-feat` (+ oldal-JS) | `ds-tabs` + `ds-card` | egyszerre egy nyitva; mellette a valódi app-képernyő nagy hatszögön, matrica-jelvénnyel |
| `[WEB]` **Matrica-jelvény** | `h26-sticker` | `ds-chip is-honey` | 4°-kal elforgatva, blokkonként egy |
| `[WEB]` **Városgombok** | `h26-chip` | `ds-chip` | belső link a `/zold-terkep/<város>` oldalakra |
| `[WEB]` **Hangok a rajból** | `h26-voice` (+ `h26-voice-hl`) | `ds-say` | alapító, felhasználó, önkéntes; csak valódi, engedélyezett idézet |
| `[WEB]` **Cégeknek sáv** | `h26-b2b` / `h26-b2b-card` | nincs | három szolgáltatás, mindegyik a saját oldalára visz |
| `[WEB]` **Beágyazott hírlevél** | `h26-news` + `sender-form-field` | nincs | a Sender űrlapja (ugyanaz a lista, mint a láblécben) |
| `[WEB]` **GYIK lenyitás** | `h26-faq` (+ oldal-JS) | `ds-details` | a válasz a HTML-ben is benne van (FAQPage schema) |
| `[WEB]` **Ragadós letöltősáv (mobil)** | `#h26-sticky` (oldal-JS) | `ds-banner` | 30% görgetés után, a lábléc közelében eltűnik |
| `[WEB]` **Apple Smart App Banner** | `<meta name="apple-itunes-app">` | nincs | iPhone Safari natív letöltési sávja |

## 3. Ami a játékokban kötelező, de a weboldalon nem kell

* HUD, `--z-*` rétegek, `ds-screen` váz, 3D (`DS.world`, `DS.light`), `dsFeedback` hang és rezgés, kioszk, offline.
* „Képernyőnként egy nagy gomb” helyett a weboldalon: **szekciónként egy méz gomb**, a többi kis gomb vagy szöveges link.
* A játék nem hív külső szolgáltatást; a weboldal igen (Sender hírlevél, GA4 mérés, Clarity).

## 4. Ellenőrzés weboldali munka után

* Nincs nyers fekete, kemény árnyék, 2 px-es keret az új osztályokon.
* Minden szín a fenti táblázatból; új szín előbb a `tokens.css`-be kerül, csak utána a Webflow-ba.
* Szám csak a beeco saját, ellenőrzött adatával vagy forrással (lásd `CLAUDE.md`, 6. pont).
* Kontraszt: olíva szöveg krémen, papíron, mézen és zsályán rendben (≥ 4,5:1); krém szöveg csak `--night`-on.
