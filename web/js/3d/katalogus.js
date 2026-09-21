// ============================================================
//  3D MODELL-KATALÓGUS – a kit összes kódból épített modellje egy listában, alapértelmezett méretekkel
//
//  Ebből dolgozik a galéria (web/modellek.html) és a teszt (tests/check-3d.js). Egy tétel:
//    { id, group, name, desc, front?, variants:[ { label, call, build } ] }   (front:'-z' = az eleje −Z felé néz, pl. a Hűtő-mester tárgyai)
//  • call  = a másolható hívás, pontosan így írd a játékba (a teszt ellenőrzi, hogy ugyanazt építi, mint a build)
//  • build = () => modell, vagy RÉSZEK objektuma ({ body, heat, … }) – a részeket a galéria külön kapcsolja
//  Új modell: a builder a 3d/ (vagy vilag/) fájlba, ide egy tétel – a galéria és a teszt magától felveszi.
//  Kell hozzá: js/art/model-kit.js + a 3d/*-modellek.js fájlok + vilag/vilag-modellek.js (Node-ban a teszt tölti be őket).
// ============================================================
(function(root){
  const g = n => root[n];                                              // a builder-globálisok (böngészőben window, Node-ban globalThis)
  const hex = c => g('MODEL').hexOf(c);                                // tartalom-szín a palettából (pl. a kuka színe)
  const v = (label, call, build) => ({ label, call, build });
  const GROUPS = ['Szelektálj!', 'Hűtő-mester', 'Ökos-rejtély ház', 'Fenntartható otthon', 'Közös növényzet és kert', 'Égbolt és sziget', 'Élő kert'];

  const SZ = () => g('SZ_MODELS'), HU = () => g('HUTO_MODELS'), RZ = () => g('RZ_MODELS'), OT = () => g('OT_MODELS'), VM = () => g('VILAG_MODELS'), EK = () => g('EK_MODELS'), K = () => g('MODEL');
  const LIST = [
    // ---------------- Szelektálj! ----------------
    { id:'sz-bin', group:'Szelektálj!', name:'Szelektív kuka', desc:'4 valódi forma: kerekes kuka, gyűjtődoboz, olajos hordó, üveggyűjtő harang. Tábla-oszlop hátul, ikon-hely: m.icon.',
      variants:[
        v('Kerekes kuka', "SZ_MODELS.bin(MODEL, 'papir', MODEL.hexOf('blue:1'))", () => SZ().bin(K(), 'papir', hex('blue:1'))),
        v('Gyűjtődoboz', "SZ_MODELS.bin(MODEL, 'elem', MODEL.hexOf('red:1'))", () => SZ().bin(K(), 'elem', hex('red:1'))),
        v('Olajos hordó', "SZ_MODELS.bin(MODEL, 'olaj', MODEL.hexOf('orange:1'))", () => SZ().bin(K(), 'olaj', hex('orange:1'))),
        v('Üvegharang', "SZ_MODELS.bin(MODEL, 'uveg', MODEL.hexOf('leaf:1'))", () => SZ().bin(K(), 'uveg', hex('leaf:1'))) ] },
    { id:'sz-lamp', group:'Szelektálj!', name:'Kandeláber', desc:'Utcai lámpa karral és búrával (Szeles utca).', variants:[ v('Alap', 'SZ_MODELS.lampPost(MODEL)', () => SZ().lampPost(K())) ] },
    { id:'sz-conveyor', group:'Szelektálj!', name:'Futószalag', desc:'Sárga keret, sötét szalag, görgők, lábak (15,6 egység hosszú). A mozgó lécek a játékban külön vannak.', variants:[ v('Alap', 'SZ_MODELS.conveyor(MODEL)', () => SZ().conveyor(K())) ] },
    { id:'sz-machine', group:'Szelektálj!', name:'Válogatógép', desc:'Garat, kijárat a szalag felé, vezérlőpult lámpákkal, figyelmeztető csíkok, kémény.', variants:[ v('Alap', 'SZ_MODELS.machine(MODEL)', () => SZ().machine(K())) ] },
    { id:'sz-halllamp', group:'Szelektálj!', name:'Csarnoklámpa', desc:'Ipari függőlámpa (a gyárcsarnok mennyezetén).', variants:[ v('Alap', 'SZ_MODELS.hallLamp(MODEL)', () => SZ().hallLamp(K())) ] },
    { id:'sz-pipe', group:'Szelektálj!', name:'Cső karimákkal', desc:'Függőleges narancs cső; a magasság paraméter.', variants:[ v('6 egység', 'SZ_MODELS.pipe(MODEL, 6)', () => SZ().pipe(K(), 6)) ] },
    { id:'sz-boat', group:'Szelektálj!', name:'Csónak', desc:'Hajótest, deszkás fedélzet, perem, hegyes orr, kikötőbakok (tengeri pálya).', variants:[ v('Alap', 'SZ_MODELS.boat(MODEL)', () => SZ().boat(K())) ] },
    // ---------------- Hűtő-mester ----------------
    { id:'hu-fridge', group:'Hűtő-mester', front:'-z', name:'Hűtő fagyasztóval', desc:'Nyitott hűtőtér (fiók, alsó és felső polc), zárt fagyasztó. Méretek: HUTO_MODELS.DIM.fridge.', variants:[ v('Alap', 'HUTO_MODELS.fridge(MODEL)', () => HU().fridge(K())) ] },
    { id:'hu-door', group:'Hűtő-mester', front:'-z', name:'Hűtőajtó', desc:'Szélesre tárt ajtó három áttetsző rekesszel; origó az ajtó közepe.', variants:[ v('Alap', 'HUTO_MODELS.door(MODEL)', () => HU().door(K())) ] },
    { id:'hu-shelf', group:'Hűtő-mester', front:'-z', name:'Polcrendszer', desc:'Nyitott fa polc a hűtővel azonos méretben, deszkás hátfal.', variants:[ v('Alap', 'HUTO_MODELS.shelf(MODEL)', () => HU().shelf(K())) ] },
    { id:'hu-counter', group:'Hűtő-mester', front:'-z', name:'Konyhapult', desc:'Fiókok, ajtók, fa munkalap – ezen állnak az ételek.', variants:[ v('Alap', 'HUTO_MODELS.counter(MODEL)', () => HU().counter(K())) ] },
    { id:'hu-wall', group:'Hűtő-mester', front:'-z', name:'Fal a pult fölött', desc:'Csempe, két felső szekrény, ablak függönnyel.', variants:[ v('Alap', 'HUTO_MODELS.wallUnit(MODEL)', () => HU().wallUnit(K())) ] },
    // ---------------- Ökos-rejtély ----------------
    { id:'rz-fridge', group:'Ökos-rejtély ház', name:'Hűtő-fagyasztó', desc:'Régi (krém, mágnesek, dér) vagy új (acél, kijelző). Részek: test, hőcserélő (hőkamera), dér.',
      variants:[ v('Régi', "RZ_MODELS.fridge(MODEL, 1.6, 3.4, 1.2, 'old')", () => RZ().fridge(K(), 1.6, 3.4, 1.2, 'old')),
                 v('Új', "RZ_MODELS.fridge(MODEL, 1.6, 3.4, 1.2, 'new')", () => RZ().fridge(K(), 1.6, 3.4, 1.2, 'new')) ] },
    { id:'rz-washer', group:'Ökos-rejtély ház', name:'Mosó- és szárítógép', desc:'Elöltöltős; a mosógépen víz az ablakban, a szárítón sötét dob és szöszszűrő. Rész: „új gép” levél-címke.',
      variants:[ v('Mosógép', 'RZ_MODELS.washer(MODEL, 1.2, 1.6, 1.2, false)', () => RZ().washer(K(), 1.2, 1.6, 1.2, false)),
                 v('Szárítógép', 'RZ_MODELS.washer(MODEL, 1.2, 1.6, 1.2, true)', () => RZ().washer(K(), 1.2, 1.6, 1.2, true)) ] },
    { id:'rz-dish', group:'Ökos-rejtély ház', name:'Mosogatógép előlap', desc:'Beépített gép előlapja kezelősávval és fogantyúval.', variants:[ v('Alap', 'RZ_MODELS.dishwasher(MODEL, 0.9, 1.2)', () => RZ().dishwasher(K(), 0.9, 1.2)) ] },
    { id:'rz-boiler', group:'Ökos-rejtély ház', name:'Fali gázkazán', desc:'Kezelősáv kék kijelzővel, lefelé 4 cső a padlóig (y = felszerelési magasság).', variants:[ v('Alap', 'RZ_MODELS.boiler(MODEL, 0.8, 1.2, 0.45, 1.6)', () => RZ().boiler(K(), 0.8, 1.2, 0.45, 1.6)) ] },
    { id:'rz-gas', group:'Ökos-rejtély ház', name:'Gázóra', desc:'Sárga ház, be- és kimenő cső; a számlapot a játék felirat-táblája adja.', variants:[ v('Alap', 'RZ_MODELS.gasmeter(MODEL, 0.8, 0.7, 0.4, 1.4)', () => RZ().gasmeter(K(), 0.8, 0.7, 0.4, 1.4)) ] },
    { id:'rz-meter', group:'Ökos-rejtély ház', name:'Villanyóra-szekrény', desc:'Fémdoboz ajtóval, zsanérral, zárral, kábelcsővel.', variants:[ v('Alap', 'RZ_MODELS.meterbox(MODEL, 1.4, 2.2, 0.45)', () => RZ().meterbox(K(), 1.4, 2.2, 0.45)) ] },
    { id:'rz-radiator', group:'Ökos-rejtély ház', name:'Radiátor', desc:'Tagos radiátor termosztatikus szeleppel (a tagok száma a szélességből jön).', variants:[ v('Alap', 'RZ_MODELS.radiator(MODEL, 1.4, 0.9, 0.22)', () => RZ().radiator(K(), 1.4, 0.9, 0.22)) ] },
    { id:'rz-thermo', group:'Ökos-rejtély ház', name:'Fali termosztát', desc:'Négyzetes lap, tekerő acél gyűrűvel, kis kijelző.', variants:[ v('Alap', 'RZ_MODELS.thermostat(MODEL, 0.36, 0.26)', () => RZ().thermostat(K(), 0.36, 0.26)) ] },
    { id:'rz-bath', group:'Ökos-rejtély ház', name:'Fürdőkád', desc:'Perem, víz és hab, csaptelep a kád végén.', variants:[ v('Alap', 'RZ_MODELS.bathtub(MODEL, 3.0, 1.0, 1.6)', () => RZ().bathtub(K(), 3.0, 1.0, 1.6)) ] },
    { id:'rz-toilet', group:'Ökos-rejtély ház', name:'WC', desc:'Csésze, ülőke fedéllel, tartály öblítőgombbal.', variants:[ v('Alap', 'RZ_MODELS.toilet(MODEL)', () => RZ().toilet(K())) ] },
    { id:'rz-shower', group:'Ökos-rejtély ház', name:'Zuhanyzó', desc:'Tálca lefolyóval, esőztető fej; rész: üvegfal (a játékban áttetsző).', variants:[ v('Alap', 'RZ_MODELS.shower(MODEL, 1.2, 0.15, 1.3)', () => RZ().shower(K(), 1.2, 0.15, 1.3)) ] },
    { id:'rz-barrel', group:'Ökos-rejtély ház', name:'Esővízgyűjtő hordó', desc:'Öblös hordó abroncsokkal, fedéllel, csappal.', variants:[ v('Alap', 'RZ_MODELS.barrel(MODEL, 0.9, 1.1)', () => RZ().barrel(K(), 0.9, 1.1)) ] },
    { id:'rz-hose', group:'Ökos-rejtély ház', name:'Tömlődob', desc:'Zöld tömlő a dobon, oldaltárcsák, hajtókar.', variants:[ v('Alap', 'RZ_MODELS.hosereel(MODEL)', () => RZ().hosereel(K())) ] },
    { id:'rz-water', group:'Ökos-rejtély ház', name:'Vízóra', desc:'Kék ház, számlapüveg, két csőcsonk (az aknában).', variants:[ v('Alap', 'RZ_MODELS.watermeter(MODEL)', () => RZ().watermeter(K())) ] },
    // ---------------- Fenntartható otthon ----------------
    { id:'ot-wall', group:'Fenntartható otthon', name:'Hatszög-ház fala', desc:'Lambéria, 3 polc konzollal, felső gerenda, zöldtető-perem (méretek: OT).', variants:[ v('Alap', 'OT_MODELS.wall(MODEL)', () => OT().wall(K())) ] },
    { id:'ot-frame', group:'Fenntartható otthon', name:'Váz és padló', desc:'Sarokoszlopok, tetőgerendák, méhsejt-zárókő, hatszög padló szőnyeggel.', variants:[ v('Alap', 'OT_MODELS.frame(MODEL)', () => OT().frame(K())) ] },
    { id:'ot-table', group:'Fenntartható otthon', name:'Kerek asztal', desc:'A jelvények asztala.', variants:[ v('Alap', 'OT_MODELS.table(MODEL)', () => OT().table(K())) ] },
    { id:'ot-board', group:'Fenntartható otthon', name:'Tábla-állvány', desc:'Állvány a napi küldetés táblájának.', variants:[ v('Alap', 'OT_MODELS.board(MODEL)', () => OT().board(K())) ] },
    { id:'ot-medal', group:'Fenntartható otthon', name:'Jelvény-érme', desc:'Arany, ha megszerezted; acél, ha még nem.',
      variants:[ v('Megszerzett', 'OT_MODELS.medal(MODEL, true)', () => OT().medal(K(), true)), v('Még nincs', 'OT_MODELS.medal(MODEL, false)', () => OT().medal(K(), false)) ] },
    // ---------------- Közös növényzet és kert ----------------
    { id:'nv-tree', group:'Közös növényzet és kert', name:'Almafa', desc:'Gyökeres törzs, négy lombcsomó, almák.', variants:[ v('Alap', 'SZ_MODELS.tree(MODEL)', () => SZ().tree(K())) ] },
    { id:'nv-bush', group:'Közös növényzet és kert', name:'Virágos bokor', desc:'Lombcsomók apró virágokkal.', variants:[ v('Alap', 'SZ_MODELS.bush(MODEL)', () => SZ().bush(K())) ] },
    { id:'nv-bed', group:'Közös növényzet és kert', name:'Magaságyás', desc:'Kerek deszkakeret földdel, rögökkel.', variants:[ v('Alap', 'SZ_MODELS.bed(MODEL)', () => SZ().bed(K())) ] },
    { id:'nv-fence', group:'Közös növényzet és kert', name:'Léckerítés', desc:'Egy oldal az X tengely mentén, hegyes lécek; a hossz paraméter.', variants:[ v('6 egység', 'SZ_MODELS.fence(MODEL, 6)', () => SZ().fence(K(), 6)), v('18 egység', 'SZ_MODELS.fence(MODEL, 18)', () => SZ().fence(K(), 18)) ] },
    { id:'nv-simple', group:'Közös növényzet és kert', name:'Egyszerű fa és bokor', desc:'A vilag rétjének tartaléka, ha a Szelektálj! modellek nincsenek betöltve.',
      variants:[ v('Fa', 'VILAG_MODELS.simpleTree(MODEL)', () => VM().simpleTree(K())), v('Bokor', 'VILAG_MODELS.simpleBush(MODEL)', () => VM().simpleBush(K())) ] },
    // ---------------- Égbolt és sziget (vilag) ----------------
    { id:'vl-cloud', group:'Égbolt és sziget', name:'Felhő', desc:'Pöttyös, lapos aljú 3D felhő (a vilag 14-et sodor az égen).', variants:[ v('Alap', 'VILAG_MODELS.cloud(MODEL, 1)', () => VM().cloud(K(), 1)) ] },
    { id:'vl-float', group:'Égbolt és sziget', name:'Lebegő méhsejt-sziget', desc:'Füves hatszög, két mézszínű földréteg, fák.', variants:[ v('R = 4', 'VILAG_MODELS.floatIsland(MODEL, 4, 21)', () => VM().floatIsland(K(), 4, 21)) ] },
    { id:'vl-turbine', group:'Égbolt és sziget', name:'Szélkerék', desc:'Torony, gondola, három lapát (a lapátok külön is: turbineBlades – a vilag forgatja).', variants:[ v('Alap', 'VILAG_MODELS.turbine(MODEL)', () => VM().turbine(K())) ] },
    { id:'vl-cottage', group:'Égbolt és sziget', name:'Házikó', desc:'Kis ház nyeregtetővel a lebegő szigeten.', variants:[ v('Alap', 'VILAG_MODELS.cottage(MODEL)', () => VM().cottage(K())) ] },
    { id:'vl-birds', group:'Égbolt és sziget', name:'Madárraj', desc:'9 „v” alakú madár.', variants:[ v('Alap', 'VILAG_MODELS.birds(MODEL, 9, 7)', () => VM().birds(K(), 9, 7)) ] },
    { id:'vl-soil', group:'Égbolt és sziget', name:'Sziget földrétegei', desc:'A hatszögletű füves sziget alja (a tetejét a vilag textúrás lapja adja).', variants:[ v('R = 6', 'VILAG_MODELS.islandSoil(MODEL, 6)', () => VM().islandSoil(K(), 6)) ] },
    // ---------------- Élő kert (3d/elokert-modellek.js + elokert-allatok.js; egy mező = 1,4 egység) ----------------
    { id:'ek-tree', group:'Élő kert', name:'Fa (3 fázis, 4 évszak)', desc:'stage 0: csemete karóval · 1: fiatal fa · 2: lombos fa; tavasszal virágpöttyök, ősszel színes lomb és avar, télen kopasz ág hóval.',
      variants:[ v('Csemete, nyár', "EK_MODELS.tree(MODEL, { stage:0, season:'nyar' })", () => EK().tree(K(), { stage:0, season:'nyar' })),
                 v('Fiatal fa, tavasz', "EK_MODELS.tree(MODEL, { stage:1, season:'tavasz' })", () => EK().tree(K(), { stage:1, season:'tavasz' })),
                 v('Lombos, tavasz', "EK_MODELS.tree(MODEL, { stage:2, season:'tavasz' })", () => EK().tree(K(), { stage:2, season:'tavasz' })),
                 v('Lombos, nyár', "EK_MODELS.tree(MODEL, { stage:2, season:'nyar' })", () => EK().tree(K(), { stage:2, season:'nyar' })),
                 v('Lombos, ősz', "EK_MODELS.tree(MODEL, { stage:2, season:'osz' })", () => EK().tree(K(), { stage:2, season:'osz' })),
                 v('Lombos, tél', "EK_MODELS.tree(MODEL, { stage:2, season:'tel' })", () => EK().tree(K(), { stage:2, season:'tel' })) ] },
    { id:'ek-hedge', group:'Élő kert', name:'Őshonos sövény', desc:'Egy mezőnyi az X tengely mentén; stage 0: frissen ültetett, 1: kifejlett. Tavasszal fehér virág, ősszel bogyók, télen ritkás.',
      variants:[ v('Fiatal, nyár', "EK_MODELS.hedge(MODEL, { stage:0, season:'nyar' })", () => EK().hedge(K(), { stage:0, season:'nyar' })),
                 v('Tavasz', "EK_MODELS.hedge(MODEL, { stage:1, season:'tavasz' })", () => EK().hedge(K(), { stage:1, season:'tavasz' })),
                 v('Nyár', "EK_MODELS.hedge(MODEL, { stage:1, season:'nyar' })", () => EK().hedge(K(), { stage:1, season:'nyar' })),
                 v('Ősz (bogyók)', "EK_MODELS.hedge(MODEL, { stage:1, season:'osz' })", () => EK().hedge(K(), { stage:1, season:'osz' })),
                 v('Tél', "EK_MODELS.hedge(MODEL, { stage:1, season:'tel' })", () => EK().hedge(K(), { stage:1, season:'tel' })) ] },
    ...[['ek-meadow', 'meadow', 'Virágos rét-folt', 'Füves korong, fűcsomók, sok kis virág; ősszel magházak, télen száraz szárak és hófoltok.'],
        ['ek-perennials', 'perennials', 'Évelőágyás', 'Fa szegély; levendula-szerű lila tüskék, sárga és fehér tányérvirágok; télen visszavágott tövek.'],
        ['ek-vegbed', 'vegbed', 'Veteményes magaságyás', 'Saláta, répa, paradicsom karóval; tavasszal palánták, télen fátyolfólia-alagút és szalma.']].map(([id, fn, name, desc]) =>
      ({ id, group:'Élő kert', name, desc, variants:[['Tavasz', 'tavasz'], ['Nyár', 'nyar'], ['Ősz', 'osz'], ['Tél', 'tel']].map(([l, s]) =>
        v(l, `EK_MODELS.${fn}(MODEL, { season:'${s}' })`, () => EK()[fn](K(), { season:s }))) })),
    { id:'ek-pond', group:'Élő kert', name:'Kerti tó', desc:'Kőperem, nád, gyékény, tavirózsa. Részek: body + water (a vízfelszín – a játékban áttetsző).', variants:[ v('Alap', 'EK_MODELS.pond(MODEL)', () => EK().pond(K())) ] },
    { id:'ek-barrel', group:'Élő kert', name:'Esővízgyűjtő hordó', desc:'Fa állvány, bordás hordó fedéllel, csap; az ereszcső-darab terelővel a fedélbe vezet.', variants:[ v('Alap', 'EK_MODELS.barrel(MODEL)', () => EK().barrel(K())) ] },
    { id:'ek-compost', group:'Élő kert', name:'Komposztláda', desc:'Hézagos deszkaláda, benne barna halom zöld maradékkal és héjjal.', variants:[ v('Alap', 'EK_MODELS.compost(MODEL)', () => EK().compost(K())) ] },
    { id:'ek-hotel', group:'Élő kert', name:'Rovarhotel', desc:'Oszlopon, nyeregtetővel; üreges nádszálak, fúrt farönk, tobozok, kis rönkök.', variants:[ v('Alap', 'EK_MODELS.insectHotel(MODEL)', () => EK().insectHotel(K())) ] },
    { id:'ek-birdbath', group:'Élő kert', name:'Madáritató', desc:'Kő talp, sekély tál peremmel, moha. Részek: body + water.', variants:[ v('Alap', 'EK_MODELS.birdBath(MODEL)', () => EK().birdBath(K())) ] },
    { id:'ek-bench', group:'Élő kert', name:'Kerti fapad', desc:'Öntöttvas oldallábak, léces ülőke és háttámla, karfa.', variants:[ v('Alap', 'EK_MODELS.bench(MODEL)', () => EK().bench(K())) ] },
    { id:'ek-path', group:'Élő kert', name:'Térkő (1 mező)', desc:'3 × 3 lap két kőárnyalatban, moha a hézagban; a mezők hézagmentesen illeszkednek.', variants:[ v('Alap', 'EK_MODELS.path(MODEL)', () => EK().path(K())) ] },
    { id:'ek-house', group:'Élő kert', name:'A Zöldi család háza', desc:'Kert felőli homlokzat (+Z): zöld ajtó előtetővel, ablak spalettával és virágládával, cseréptető, kémény, eresz + ereszcső. w × h mező.',
      variants:[ v('2 × 2 mező', 'EK_MODELS.house(MODEL, { w:2, h:2 })', () => EK().house(K(), { w:2, h:2 })), v('1 × 1 mező', 'EK_MODELS.house(MODEL, { w:1, h:1 })', () => EK().house(K(), { w:1, h:1 })) ] },
    { id:'ek-terrace', group:'Élő kert', name:'Fa terasz', desc:'Deszkázat gerendakerettel, asztal cseréppel, két szék párnával. w × h mező.', variants:[ v('2 × 1 mező', 'EK_MODELS.terrace(MODEL, { w:2, h:1 })', () => EK().terrace(K(), { w:2, h:1 })) ] },
    { id:'ek-gate', group:'Élő kert', name:'Kiskapu és kerítés', desc:'Kapu két oszloppal (1 mező), Z-merevítő, zsanér, retesz; a kerítés ugyanebben a stílusban, a hossz paraméter.',
      variants:[ v('Kiskapu', 'EK_MODELS.gate(MODEL)', () => EK().gate(K())), v('Kerítés, 3 mező', 'EK_MODELS.fence(MODEL, 4.2)', () => EK().fence(K(), 4.2)) ] },
    { id:'ek-animals-fly', group:'Élő kert', name:'Repülő állatok', desc:'Részek: body, wingL, wingR (+ foot: a legalsó pont). Origó = szárny-zsanér: a szárnyat a Z tengely körül forgatva csapkodtatod.',
      variants:[['Méhecske', 'bee'], ['Pillangó', 'butterfly'], ['Madár (vörösbegy)', 'bird'], ['Denevér', 'bat']].map(([l, fn]) => v(l, `EK_MODELS.${fn}(MODEL)`, () => EK()[fn](K()))) },
    { id:'ek-animals', group:'Élő kert', name:'Földön járó állatok', desc:'Talp y = 0, orr +Z; 0,15–0,5 egység.',
      variants:[['Katica', 'ladybird'], ['Sün', 'hedgehog'], ['Béka', 'frog'], ['Gyík', 'lizard']].map(([l, fn]) => v(l, `EK_MODELS.${fn}(MODEL)`, () => EK()[fn](K()))) },
  ];

  // segéd: modell vagy részek → [[részNév, modell], …]
  const parts = r => (r && typeof r.groups === 'function') ? [['modell', r]] : Object.entries(r || {}).filter(([, m]) => m && typeof m.groups === 'function');
  const MODEL_CATALOG = { GROUPS, LIST, parts };
  if(typeof module !== 'undefined' && module.exports){ module.exports = MODEL_CATALOG; return; }
  root.MODEL_CATALOG = MODEL_CATALOG;
})(typeof window !== 'undefined' ? window : globalThis);
