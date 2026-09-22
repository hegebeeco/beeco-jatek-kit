// ============================================================
//  MÉHESD – A VÁROSKÖZPONT ÉS A ZÖLD INFRASTRUKTÚRA 3D TÁRGYAI (B szint: docs/rajzolas.md). A VAROS_MODELS-be kerülnek.
//
//  townHall      Városháza: kétszintes, szimmetrikus, középrizalit oromzattal, rajta kis torony (óralap nélkül), előtte
//                kis tér lépcsővel, két paddal, egy fával és egy zászlórúddal (sima mézsárga szalagzászló, jelkép nélkül).
//                Alap 1,8 × 1,3, a torony csúcsa ≈ 1,2.
//  library       Könyvtár: másfél szintes homokkő épület nagy, íves ablakokkal, palatetővel, tetőablakkal, oromfali
//                kerek ablakkal; előtte könyvleadó doboz, kerékpártámasz egy biciklivel. Alap 1,3 × 1,0, gerinc ≈ 0,7.
//  busStop       Buszmegálló: járda, fedett váró zöldtetővel és paddal, megállótábla-oszlop (felirat nélkül), mézsárga
//                felfestésű buszöböl, benne egy busz (+X felé néz). opts.bus = false → busz nélkül; opts.busColor
//                ('gold:1' mézsárga, alap | 'sage:1'). Alap 1,6 × 0,8, a busz teteje ≈ 0,33.
//  market        Piaccsarnok: nyitott csarnok oszlopokon, nyeregtető szellőző gerinccel, 4 standon ládákban zöldség és
//                gyümölcs. Alap 1,6 × 1,1, gerinc ≈ 0,74.
//  recyclingYard Hulladékudvar: betonplacc korláttal körben, elöl (+Z) nyitott kétszárnyú kapu, 5 színes konténer
//                (papír kék, műanyag sárga, üveg zöld, vegyes sötét, fém/egyéb narancs), mézsárga irodakonténer.
//                Alap 1,6 × 1,2.
//  solarRoof     Napelem-mező: {w, d} (alap 0,8 × 0,5) – sötétkék panelsorok világos kerettel, 25°-ban +Z felé döntve,
//                lábakon; talp y = 0 (a játék emeli a tetőre). Kis tárgy (< 300 △).
//  bikeLane      Kerékpársáv az X mentén: {len} (alap 4), 0,12 széles, 0,006 vastag zöld sáv mézsárga szélvonallal,
//                ~1 egységenként festett kerékpár-jel (felirat nélkül). Kis tárgy.
//  windTurbine   Kis szélkerék: RÉSZEK { body, blades, hub } – body = torony, gondola, alap; blades = a háromágú lapát
//                az agy-kúppal, MÁR A HELYÉN (a hub pontban). hub = [0, 1.3, 0.11] – ez a forgáspont, a lapátok a
//                Z tengely körül forognak (a rotor +Z felé néz). Pörgetés Three.js-ben:
//                  const piv = new THREE.Group(); piv.position.set(...hub);
//                  const b = parts.blades.toThree(THREE, …); b.position.set(-hub[0], -hub[1], -hub[2]); piv.add(b);
//                  // animációban: piv.rotation.z -= dt * 1.5;
//                Teljes magasság ≈ 1,84 (a felső lapát csúcsa), a rotor átmérője ≈ 1,1, az alap Ø 0,28.
//  museum        Méhesdi Helytörténeti Múzeum: egyszintes klasszicista/eklektikus épület kőlábazaton, halvány mézszínű
//                vakolattal, oszlopcsarnokkal (4 oszlop, háromszög-oromzat felirat nélkül), széles lépcsővel, magas íves
//                ablakokkal, patinás kontyolt tetővel; előtte kövezett tér régi nyomós kúttal és itatóvályúval, két paddal
//                és egy zászlótartóval (sima mézsárga fecskefarkú szalag, jelkép nélkül). Alap 1,6 × 1,2, tető ≈ 0,95.
//
//  Tengelyek, lépték: mint a varos-modellek.js-ben (Y fel, talp y = 0, origó = közép, eleje +Z; 1 egység ≈ 25 m, dioráma-léptékben).
//  Betöltési sorrend: 3d/elokert-modellek.js és 3d/varos-modellek.js UTÁN (a segédeiket használja). Node-ban require is elég.
//  Felirat, logó, arc, politikai jelkép nincs a tárgyakon.
// ============================================================
(function(root){
  const EK = root.EK_MODELS || (typeof require === 'function' ? require('./elokert-modellek.js') : null);
  const VM = root.VAROS_MODELS || (typeof require === 'function' ? require('./varos-modellek.js') : null);
  const { blob, rod } = EK._h, { smallTree, alongX, num } = VM._h;
  const AX = { r:[0, 90, 0] }, DEG = 180 / Math.PI;
  const LITE = ['leaf:1', 'leaf:1', 'leaf:1'];                                    // egytónusú lomb: kevesebb szín a sok elemű tárgyakon

  // íves (félköríves záródású) ablak/ajtó körvonala az XY síkban, alul középen az origó: szélesség w, teljes magasság h
  function arch(w, h, n){
    const r = w / 2, P = [[-r, 0], [r, 0]];
    for(let i = 0; i <= (n || 6); i++){ const a = i / (n || 6) * Math.PI; P.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
    return P;
  }
  // nyeregtető két letört élű lappal (a gerinc az X mentén, z0 = az épület közepe) – mint a varos-modellek.js családi házán
  function gableRoof(m, K, W, D, Hw, rise, eave, color, z0, th){
    th = th || 0.05;
    const a = Math.atan2(rise, D / 2), run = D / 2 + eave, L = run / Math.cos(a);
    for(const sz of [-1, 1]) m.add(K.chamferBox(W, th, L, 0.015), { color, r:[sz * a * DEG, 0, 0],
      t:[0, Hw + rise - (run / 2) * Math.tan(a) + Math.cos(a) * th / 2, z0 + sz * run / 2 + sz * Math.sin(a) * th / 2] });
    m.add(K.box(W + 0.02, 0.045, 0.045), { color, t:[0, Hw + rise + 0.03, z0], r:[45, 0, 0] });                    // gerinc
  }
  // köztéri pad (háttámla −Z felé, az ülő +Z felé néz), dobozokból – kevés háromszög; y = a talaj magassága
  function bench(m, K, x, z, ry, color, y){
    const b = K.model();
    b.add(K.box(0.24, 0.022, 0.07), { color, t:[0, 0.065, 0] });
    b.add(K.box(0.24, 0.05, 0.016), { color, t:[0, 0.11, -0.035], r:[-10, 0, 0] });
    for(const sx of [-1, 1]) b.add(K.box(0.018, 0.065, 0.07), { color, t:[sx * 0.1, 0.033, 0] });
    m.merge(b, { t:[x, y || 0, z], r:[0, ry || 0, 0] });
  }

  // ================= VÁROSHÁZA =================
  function townHall(K){
    const m = K.model(), cb = K.chamferBox, W = 1.5, D = 0.6, Hw = 0.56, rise = 0.26, z0 = -0.3, F = z0 + D / 2;
    m.add(cb(1.8, 0.03, 1.3, 0.01), { color:'white:1', t:[0, 0.015, 0] });                                            // tér + járda (kőburkolat)
    m.add(cb(W, Hw, D, 0.03), { color:'cream:1', t:[0, Hw / 2 + 0.03, z0] });                                         // főtömeg
    const e = 0.06, rx = W / 2 - D / 2 + 0.05;
    m.add(K.hull([[-W / 2 - e, Hw + 0.03, z0 - D / 2 - e], [W / 2 + e, Hw + 0.03, z0 - D / 2 - e], [W / 2 + e, Hw + 0.03, z0 + D / 2 + e],
      [-W / 2 - e, Hw + 0.03, z0 + D / 2 + e], [-rx, Hw + rise, z0], [rx, Hw + rise, z0]]), { color:'tomato:2' });    // kontyolt tető
    m.add(K.box(W + 0.02, 0.03, 0.02), { color:'white:1', t:[0, 0.31, F + 0.01] });                                   // emeleti párkány
    m.add(K.box(W + 0.02, 0.05, 0.02), { color:'white:1', t:[0, 0.1, F + 0.01] });                                    // lábazati sáv
    // középrizalit: előreugró, magasabb, mézsárga; fehér lizénák a sarkain, háromszög-oromzat
    const RW = 0.44, RD = 0.34, RH = Hw + 0.08, RF = F + 0.05;                    // csak elöl ugrik ki (hátul a tető alatt marad)
    m.add(cb(RW, RH, RD, 0.02), { color:'honey:1', t:[0, RH / 2 + 0.03, RF - RD / 2] });
    for(const sx of [-1, 1]) m.add(K.box(0.04, RH, 0.02), { color:'white:1', t:[sx * (RW / 2 - 0.02), RH / 2 + 0.03, RF + 0.005] });
    m.add(K.extrude([[-RW / 2 - 0.02, 0], [RW / 2 + 0.02, 0], [0, 0.17]], 0.06), { color:'white:1', t:[0, RH + 0.03, RF - 0.02] });
    m.add(K.extrude([[-0.08, 0], [0.08, 0], [0, 0.07]], 0.02), { color:'honey:1', t:[0, RH + 0.06, RF + 0.012] });   // oromzat belső mezője
    m.add(K.extrude(arch(0.13, 0.22), 0.02), { color:'wood:2', t:[0, 0.04, RF + 0.005] });                             // kapu
    for(const x of [-0.12, 0, 0.12]) m.add(K.extrude(arch(0.075, 0.17), 0.02), { color:'glass:2', t:[x, 0.36, RF + 0.005] });   // díszterem-ablakok
    // ablaksorok a két szárnyon (elöl és hátul)
    for(const y of [0.2, 0.46]) for(const sx of [-1, 1]) for(let i = 0; i < 3; i++){ const x = sx * (0.34 + i * 0.15);
      m.add(K.box(0.09, 0.14, 0.02), { color:'glass:2', t:[x, y, F + 0.005] });
      m.add(K.box(0.09, 0.14, 0.02), { color:'glass:2', t:[x, y, z0 - D / 2 - 0.005] }); }
    // kis torony a rizalit fölött: négyzetes test zsalus hangablakokkal, patinás gúlasisak – óralap nincs
    const TY = Hw + rise - 0.06, TH = 0.26;
    m.add(cb(0.2, TH, 0.2, 0.015), { color:'white:1', t:[0, TY + TH / 2, z0] });
    for(const [dx, dz, w, d] of [[0, 0.101, 0.07, 0.01], [0, -0.101, 0.07, 0.01], [0.101, 0, 0.01, 0.07], [-0.101, 0, 0.01, 0.07]])
      m.add(K.box(w, 0.1, d), { color:'wood:2', t:[dx, TY + TH - 0.09, z0 + dz] });
    m.add(K.cylinder(0, 0.17, 0.24, 4), { color:'teal:1', t:[0, TY + TH + 0.12, z0], r:[0, 45, 0] });
    // lépcső a kapu előtt
    for(let i = 0; i < 2; i++) m.add(K.box(0.34 - i * 0.07, 0.025, 0.08), { color:'white:1', t:[0, 0.04 + i * 0.025, RF + 0.07 - i * 0.03] });
    // a tér: két pad, egy fa, két nyírt bokor a lépcső mellett, zászlórúd sima mézsárga szalagzászlóval
    bench(m, K, -0.45, 0.46, 0, 'wood:2', 0.03);
    bench(m, K, 0.3, 0.5, 0, 'wood:2', 0.03);
    smallTree(m, K, 0.66, 0.36, 1.0, 'nyar', 940, null, LITE);
    for(const sx of [-1, 1]) m.add(blob(K, 0.07, 945 + sx, 10), { color:'leaf:1', t:[sx * 0.28, 0.08, RF + 0.07], s:[1.3, 0.8, 1] });
    m.add(K.cylinder(0.008, 0.012, 0.72, 6), { color:'white:1', t:[-0.76, 0.39, 0.22] });
    m.add(K.extrude([[0, 0], [0.16, -0.035], [0, -0.07]], 0.008), { color:'honey:1', t:[-0.752, 0.72, 0.22] });
    return m;
  }

  // ================= KÖNYVTÁR =================
  function library(K){
    const m = K.model(), cb = K.chamferBox, W = 1.05, D = 0.55, Hw = 0.46, rise = 0.2, z0 = -0.18, F = z0 + D / 2;
    m.add(cb(1.3, 0.03, 1.0, 0.01), { color:'steel:1', t:[0, 0.015, 0] });                                            // járda, előkert
    m.add(alongX(K, [[z0 - D / 2, 0], [z0 + D / 2, 0], [z0 + D / 2, Hw], [z0, Hw + rise - 0.02], [z0 - D / 2, Hw]], W), { color:'cardboard:0', ...AX });
    gableRoof(m, K, W + 0.08, D, Hw, rise, 0.05, 'steel:3', z0);
    m.add(K.box(W + 0.01, 0.04, D + 0.01), { color:'white:1', t:[0, 0.05, z0] });                                    // lábazat
    // nagy íves ablakok (fehér keret mögöttük) és íves üvegajtó középen
    for(const x of [-0.4, -0.2, 0.2, 0.4]){
      m.add(K.extrude(arch(0.15, 0.3), 0.012), { color:'white:1', t:[x, 0.07, F + 0.004] });
      m.add(K.extrude(arch(0.12, 0.27), 0.012), { color:'glass:2', t:[x, 0.085, F + 0.01] }); }
    m.add(K.extrude(arch(0.15, 0.31), 0.012), { color:'white:1', t:[0, 0.035, F + 0.004] });
    m.add(K.extrude(arch(0.11, 0.28), 0.012), { color:'glass:2', t:[0, 0.04, F + 0.01] });
    for(let i = 0; i < 2; i++) m.add(K.box(0.24 - i * 0.06, 0.02, 0.07), { color:'white:1', t:[0, 0.04 + i * 0.02, F + 0.045 - i * 0.02] });   // lépcső
    // a „fél szint”: oromfali kerek ablakok és egy tetőablak elöl
    for(const sx of [-1, 1]) m.add(K.cylinder(0.05, 0.05, 0.012, 10), { color:'glass:2', t:[sx * (W / 2 + 0.005), Hw + 0.08, z0], r:[0, 0, 90] });
    const dz = z0 + D / 4, dy = Hw + rise / 2;
    m.add(cb(0.18, 0.14, 0.12, 0.01), { color:'cardboard:0', t:[0, dy + 0.05, dz + 0.02] });
    m.add(K.hull([[-0.11, dy + 0.12, dz + 0.09], [0.11, dy + 0.12, dz + 0.09], [-0.11, dy + 0.12, dz - 0.06], [0.11, dy + 0.12, dz - 0.06],
      [-0.11, dy + 0.2, dz - 0.06], [0.11, dy + 0.2, dz - 0.06]]), { color:'steel:3' });                               // tetőablak fedele
    m.add(K.box(0.11, 0.08, 0.012), { color:'glass:2', t:[0, dy + 0.05, dz + 0.082] });
    // könyvleadó doboz (lábon, ferde fedéllel, sötét bedobó nyílással)
    const bx = 0.44, bz = 0.26;
    m.add(cb(0.14, 0.14, 0.1, 0.012), { color:'steel:3', t:[bx, 0.12, bz] });
    m.add(K.box(0.15, 0.02, 0.11), { color:'steel:3', t:[bx, 0.195, bz], r:[-12, 0, 0] });
    m.add(K.box(0.09, 0.015, 0.012), { color:'honey:1', t:[bx, 0.16, bz + 0.052] });   // bedobó nyílás mézsárga kerettel
    m.add(K.box(0.03, 0.05, 0.03), { color:'dark:2', t:[bx, 0.045, bz] });
    // kerékpártámasz: három fordított U-ív, mellettük egy bicikli
    for(const x of [-0.52, -0.4, -0.28]){ const a = [x, 0.03, 0.24], b = [x, 0.15, 0.24], c = [x, 0.15, 0.36], d = [x, 0.03, 0.36];
      rod(m, K, a, b, 0.008, 0.008, 4, 'dark:2'); rod(m, K, b, c, 0.008, 0.008, 4, 'dark:2'); rod(m, K, d, c, 0.008, 0.008, 4, 'dark:2'); }
    const kx = -0.46, wy = 0.075;
    for(const z of [0.23, 0.37]) m.add(K.torus(0.045, 0.008, 10, 3), { color:'dark:2', t:[kx, wy, z], r:[0, 0, 90] });   // kerekek
    const P = { hr:[kx, wy, 0.23], fr:[kx, wy, 0.37], ped:[kx, 0.07, 0.29], seat:[kx, 0.15, 0.27], bar:[kx, 0.16, 0.35] };
    rod(m, K, P.hr, P.ped, 0.006, 0.006, 4, 'honey:1'); rod(m, K, P.ped, P.seat, 0.006, 0.006, 4, 'honey:1');
    rod(m, K, P.seat, P.bar, 0.006, 0.006, 4, 'honey:1'); rod(m, K, P.ped, P.bar, 0.006, 0.006, 4, 'honey:1');
    rod(m, K, P.bar, P.fr, 0.006, 0.006, 4, 'honey:1'); rod(m, K, P.hr, P.seat, 0.005, 0.005, 4, 'honey:1');
    m.add(K.box(0.018, 0.012, 0.045), { color:'dark:2', t:[kx, 0.162, 0.265] });                                     // nyereg
    m.add(K.box(0.09, 0.01, 0.01), { color:'dark:2', t:[kx, 0.175, 0.355] });                                        // kormány
    return m;
  }

  // ================= BUSZMEGÁLLÓ =================
  function busStop(K, o){
    o = o || {};
    const m = K.model(), cb = K.chamferBox, BC = o.busColor === 'sage:1' ? 'sage:1' : 'gold:1';   // a méz-sárga cel-fényben citromsárga lenne → gold:1
    m.add(cb(1.6, 0.05, 0.35, 0.012), { color:'steel:1', t:[0, 0.025, -0.225] });                                     // járda (magasított peron)
    m.add(K.box(1.6, 0.03, 0.45), { color:'dark:0', t:[0, 0.015, 0.175] });                                          // buszöböl aszfaltja
    // öböl-felfestés: külső vonal, két ferde kifutó, szaggatott vonal a peron mentén
    m.add(K.box(1.16, 0.004, 0.02), { color:'gold:1', t:[0, 0.032, 0.37] });
    for(const sx of [-1, 1]) m.add(K.box(0.3, 0.004, 0.02), { color:'gold:1', t:[sx * 0.7, 0.032, 0.21], r:[0, sx * 58, 0] });
    for(let i = 0; i < 5; i++) m.add(K.box(0.14, 0.004, 0.016), { color:'gold:1', t:[-0.52 + i * 0.26, 0.032, -0.02] });
    // fedett váró: acélkeret, üveg hátfal és oldalfal, zöldtető (szedum), pad
    const sx0 = -0.42, sz0 = -0.26;
    for(const [dx, dz] of [[-0.24, -0.08], [0.24, -0.08], [-0.24, 0.09], [0.24, 0.09]]) m.add(K.box(0.02, 0.3, 0.02), { color:'steel:2', t:[sx0 + dx, 0.2, sz0 + dz] });
    m.add(cb(0.56, 0.035, 0.26, 0.01), { color:'steel:2', t:[sx0, 0.365, sz0 + 0.01] });
    m.add(K.box(0.5, 0.02, 0.2), { color:'grass:1', t:[sx0, 0.39, sz0 + 0.01] });
    m.add(K.box(0.46, 0.22, 0.008), { color:'glass:2', t:[sx0, 0.19, sz0 - 0.08] });
    m.add(K.box(0.008, 0.22, 0.14), { color:'glass:2', t:[sx0 - 0.24, 0.19, sz0] });
    bench(m, K, sx0, sz0 - 0.01, 0, 'wood:2', 0.05);
    // megállótábla: oszlop, kerek (üres) tábla
    m.add(K.cylinder(0.008, 0.01, 0.42, 6), { color:'steel:2', t:[0.1, 0.26, -0.1] });
    m.add(K.cylinder(0.05, 0.05, 0.012, 12), { color:'gold:1', t:[0.1, 0.45, -0.1], r:[90, 0, 0] });
    if(o.bus !== false){
      // busz (+X felé néz): letört élű test, körbefutó ablaksáv, két ajtó a peron (−Z) felőli oldalon, kerekek, lökhárítók
      const bz = 0.17, L = 0.96, Wb = 0.26, H = 0.26, y0 = 0.06, bxc = 0.12;
      m.add(cb(L, H, Wb, 0.03), { color:BC, t:[bxc, y0 + H / 2, bz] });
      for(const sz of [-1, 1]) m.add(K.box(L - 0.14, 0.08, 0.01), { color:'glass:2', t:[bxc - 0.02, y0 + 0.17, bz + sz * (Wb / 2 + 0.002)] });
      m.add(K.box(0.01, 0.12, Wb - 0.05), { color:'glass:2', t:[bxc + L / 2 + 0.002, y0 + 0.16, bz] });              // szélvédő
      m.add(K.box(0.01, 0.07, Wb - 0.07), { color:'glass:2', t:[bxc - L / 2 - 0.002, y0 + 0.17, bz] });              // hátsó ablak
      for(const x of [bxc + 0.36, bxc - 0.06]) m.add(K.box(0.1, 0.2, 0.01), { color:'glass:2', t:[x, y0 + 0.11, bz - Wb / 2 - 0.004] });   // ajtók
      for(const sx of [-1, 1]) m.add(K.box(0.012, 0.03, Wb - 0.02), { color:'dark:2', t:[bxc + sx * (L / 2 + 0.004), y0 + 0.02, bz] });  // lökhárítók
      for(const x of [bxc + 0.3, bxc - 0.28]) for(const sz of [-1, 1])
        m.add(K.cylinder(0.045, 0.045, 0.03, 10), { color:'dark:2', t:[x, 0.075, bz + sz * (Wb / 2 - 0.01)], r:[90, 0, 0] });
    }
    return m;
  }

  // ================= PIACCSARNOK =================
  function market(K){
    const m = K.model(), cb = K.chamferBox, W = 1.44, D = 0.94, He = 0.5, rise = 0.18;
    m.add(cb(1.6, 0.03, 1.1, 0.01), { color:'cream:2', t:[0, 0.015, 0] });
    for(const x of [-0.66, -0.22, 0.22, 0.66]) for(const sz of [-1, 1]) m.add(cb(0.04, He, 0.04, 0.008), { color:'wood:2', t:[x, He / 2 + 0.03, sz * 0.42] });   // oszlopok
    for(const sz of [-1, 1]) m.add(K.box(W - 0.06, 0.04, 0.035), { color:'wood:2', t:[0, He + 0.01, sz * 0.42] });            // koszorúgerenda
    gableRoof(m, K, W + 0.06, D - 0.1, He + 0.03, rise, 0.03, 'teal:1', 0);
    for(const sx of [-1, 1]) m.add(K.extrude([[-0.43, 0], [0.43, 0], [0, rise - 0.01]], 0.02), { color:'wood:2', t:[sx * (W / 2 - 0.02), He + 0.03, 0], r:[0, 90, 0] });   // oromfalak
    m.add(cb(0.9, 0.06, 0.12, 0.01), { color:'teal:1', t:[0, He + rise + 0.09, 0] });                              // szellőző gerinc-felépítmény
    // 4 stand a csarnok két hosszanti szélén (felülnézetből is kilátszanak): pult, rajta 3 láda termény (zöldség, paradicsom,
  // narancs/sárgarépa, sárga körte – gold:1, mert a méz-sárga a cel-fényben citromos)
    const CROP = [['leaf:1', 'tomato:1', 'orange:1'], ['gold:1', 'leaf:1', 'tomato:1'], ['orange:1', 'gold:1', 'leaf:1'], ['tomato:1', 'orange:1', 'gold:1']];
    [[-0.36, -0.3], [0.36, -0.3], [-0.36, 0.3], [0.36, 0.3]].forEach(([x, z], s) => {
      m.add(cb(0.38, 0.13, 0.17, 0.012), { color:'wood:1', t:[x, 0.095, z] });
      for(let k = 0; k < 3; k++){ const cx = x - 0.12 + k * 0.12;
        m.add(K.box(0.105, 0.035, 0.13), { color:'wood:2', t:[cx, 0.178, z] });
        for(let j = 0; j < 2; j++) m.add(blob(K, 0.03, 960 + s * 10 + k * 3 + j, 6, 0.15), { color:CROP[s][k], t:[cx - 0.015 + j * 0.03, 0.21, z - 0.03 + j * 0.06] }); }
    });
    // két láda a földön a csarnok előtt, egy rakás tök/dinnye
    for(const [x, c] of [[-0.62, 'leaf:1'], [0.6, 'orange:1']]){ m.add(K.box(0.12, 0.05, 0.1), { color:'wood:2', t:[x, 0.055, 0.5] });
      for(let j = 0; j < 2; j++) m.add(blob(K, 0.034, 990 + j + x * 10, 7, 0.15), { color:c, t:[x - 0.025 + j * 0.05, 0.1, 0.5] }); }
    return m;
  }

  // ================= HULLADÉKUDVAR =================
  function recyclingYard(K){
    const m = K.model(), cb = K.chamferBox, W = 1.6, D = 1.2, gate = 0.46;
    m.add(cb(W, 0.03, D, 0.01), { color:'steel:1', t:[0, 0.015, 0] });                                              // betonplacc
    // korlát: oszlopok + két vízszintes cső körben, elöl kapunyílás
    const posts = [];
    for(let i = 0; i <= 4; i++) posts.push([-W / 2 + 0.03 + i * (W - 0.06) / 4, -D / 2 + 0.03]);
    for(let i = 1; i <= 2; i++) for(const sx of [-1, 1]) posts.push([sx * (W / 2 - 0.03), -D / 2 + 0.03 + i * (D - 0.06) / 3]);
    for(const sx of [-1, 1]) posts.push([sx * (W / 2 - 0.03), D / 2 - 0.03], [sx * gate / 2, D / 2 - 0.03]);
    for(const [x, z] of posts) m.add(K.box(0.025, 0.22, 0.025), { color:'steel:2', t:[x, 0.14, z] });
    const fw = (W - gate) / 2;
    for(const y of [0.12, 0.23]){
      m.add(K.box(W - 0.04, 0.014, 0.014), { color:'steel:2', t:[0, y, -D / 2 + 0.03] });
      for(const sx of [-1, 1]){ m.add(K.box(0.014, 0.014, D - 0.04), { color:'steel:2', t:[sx * (W / 2 - 0.03), y, 0] });
        m.add(K.box(fw - 0.02, 0.014, 0.014), { color:'steel:2', t:[sx * (gate / 2 + fw / 2 - 0.02), y, D / 2 - 0.03] }); } }
    // kétszárnyú kapu, befelé kinyitva (mézsárga keret, átló)
    for(const sx of [-1, 1]){ const g = K.model(), L = gate / 2 - 0.02;
      for(const y of [0.06, 0.22]) g.add(K.box(L, 0.018, 0.014), { color:'honey:1', t:[sx * L / 2, y, 0] });
      g.add(K.box(0.018, 0.18, 0.014), { color:'honey:1', t:[sx * (L - 0.009), 0.14, 0] });
      g.add(K.box(Math.hypot(L, 0.16), 0.014, 0.012), { color:'honey:1', t:[sx * L / 2, 0.14, 0], r:[0, 0, -sx * Math.atan2(0.16, L) * DEG] });
      m.merge(g, { t:[sx * gate / 2, 0, D / 2 - 0.03], r:[0, sx * 70, 0] }); }
    // öt konténer (ferde végű, nyitott tetejű „teknő”: sötét belső lap, peremcső, bordák) – a játék kukaszínei
    const skip = (x, z, color) => {
      const L = 0.2, Wc = 0.34, H = 0.15, y0 = 0.03;                                  // hossza Z irányú (egymás mellett X mentén)
      m.add(K.hull([[-L / 2, y0, -Wc / 2 + 0.05], [L / 2, y0, -Wc / 2 + 0.05], [-L / 2, y0, Wc / 2 - 0.05], [L / 2, y0, Wc / 2 - 0.05],
        [-L / 2, y0 + H, -Wc / 2], [L / 2, y0 + H, -Wc / 2], [-L / 2, y0 + H, Wc / 2], [L / 2, y0 + H, Wc / 2]]), { color, t:[x, 0, z] });
      m.add(K.box(L - 0.07, 0.004, Wc - 0.08), { color:'dark:2', t:[x, y0 + H + 0.002, z] });                         // nyitott teteje
      for(const dz of [-0.07, 0.07]) m.add(K.box(L + 0.012, H - 0.02, 0.02), { color, t:[x, y0 + H / 2 + 0.005, z + dz] });   // bordák
    };
    [[-0.52, 'blue:1'], [-0.26, 'honey:1'], [0, 'leaf:1'], [0.26, 'dark:2'], [0.52, 'orange:1']].forEach(([x, c]) => skip(x * 1.05, -0.26, c));
    // irodakonténer a kapu mellett: mézsárga test, lapos acéltető, ablak, ajtó
    const ox = 0.5, oz = 0.24;
    m.add(cb(0.4, 0.22, 0.22, 0.015), { color:'honey:1', t:[ox, 0.14, oz] });
    m.add(cb(0.44, 0.025, 0.26, 0.008), { color:'steel:2', t:[ox, 0.262, oz] });
    m.add(K.box(0.14, 0.08, 0.01), { color:'glass:2', t:[ox + 0.08, 0.16, oz + 0.112] });
    m.add(K.box(0.07, 0.17, 0.01), { color:'steel:2', t:[ox - 0.1, 0.115, oz + 0.112] });
    m.add(K.box(0.2, 0.02, 0.1), { color:'steel:2', t:[ox - 0.1, 0.04, oz + 0.16] });                                  // lépcsőfok
    return m;
  }

  // ================= NAPELEM-MEZŐ =================
  // w × d alapterület; a panelsorok az X mentén, 25°-ban +Z felé döntve (a déli irányt a játék forgatással adja meg)
  function solarRoof(K, o){
    o = o || {};
    const w = num(o.w, 0.8, 0.2, 4), d = num(o.d, 0.5, 0.2, 3), m = K.model(), tilt = 25, a = tilt / DEG;
    const nr = Math.max(1, Math.round(d / 0.26)), rowD = d / nr, pd = rowD * 0.82 / Math.cos(a), nc = Math.max(1, Math.round(w / 0.2));
    const lo = 0.035, hi = lo + Math.sin(a) * pd;                                                                     // a panel alsó/felső éle
    for(let r = 0; r < nr; r++){ const zc = -d / 2 + (r + 0.5) * rowD, yc = (lo + hi) / 2 + 0.01;
      m.add(K.box(w, 0.012, pd), { color:'steel:1', t:[0, yc, zc], r:[tilt, 0, 0] });                                // világos keret
      m.add(K.box(w - 0.02, 0.014, pd - 0.02), { color:'blue:2', t:[0, yc, zc], r:[tilt, 0, 0] });                  // cellák
      for(let c = 1; c < nc; c++) m.add(K.box(0.006, 0.016, pd - 0.02), { color:'steel:1', t:[-w / 2 + c * w / nc, yc, zc], r:[tilt, 0, 0] });
      m.add(K.box(w - 0.02, 0.016, 0.006), { color:'steel:1', t:[0, yc, zc], r:[tilt, 0, 0] });                     // osztóléc hosszában
      const hz = Math.cos(a) * pd / 2 - 0.02;
      for(const sx of [-1, 1]){ const x = sx * (w / 2 - 0.04);                                                        // lábak: elöl alacsony, hátul magas
        m.add(K.box(0.014, lo + 0.02, 0.014), { color:'steel:2', t:[x, (lo + 0.02) / 2, zc + hz] });
        m.add(K.box(0.014, hi + 0.02, 0.014), { color:'steel:2', t:[x, (hi + 0.02) / 2, zc - hz] }); }
      m.add(K.box(w - 0.06, 0.012, 0.012), { color:'steel:2', t:[0, 0.006, zc - hz] });                              // talpsín
    }
    return m;
  }

  // ================= KERÉKPÁRSÁV =================
  // az X mentén, len hosszal, középre igazítva; festett kerékpár-jel ~1 egységenként (menetirány +X)
  function bikeLane(K, o){
    o = o || {};
    const len = num(o.len, 4, 0.3, 30), m = K.model(), T = 0.006;
    m.add(K.box(len, T, 0.12), { color:'leaf:1', t:[0, T / 2, 0] });
    for(const sz of [-1, 1]) m.add(K.box(len, 0.002, 0.008), { color:'honey:1', t:[0, T + 0.001, sz * 0.056] });   // szélvonal
    const n = Math.max(1, Math.round(len)), y = T + 0.001;
    for(let i = 0; i < n; i++){ const x = -len / 2 + (i + 0.5) * len / n;
      for(const dx of [-0.028, 0.028]) m.add(K.torus(0.017, 0.0035, 8, 3), { color:'white:1', t:[x + dx, y, 0], s:[1, 0.3, 1] });   // kerekek
      const P = [[x - 0.028, 0], [x - 0.004, 0], [x + 0.012, -0.018], [x - 0.012, -0.022], [x + 0.028, 0]];
      for(const [a, b] of [[0, 1], [1, 2], [2, 4], [0, 3], [3, 2], [1, 3]]){ const [x0, z0] = P[a], [x1, z1] = P[b], L = Math.hypot(x1 - x0, z1 - z0);
        m.add(K.box(L + 0.003, 0.002, 0.004), { color:'white:1', t:[(x0 + x1) / 2, y, (z0 + z1) / 2], r:[0, -Math.atan2(z1 - z0, x1 - x0) * DEG, 0] }); }
      m.add(K.box(0.012, 0.002, 0.004), { color:'white:1', t:[x - 0.012, y, -0.026] });                                // nyereg
      m.add(K.box(0.004, 0.002, 0.012), { color:'white:1', t:[x + 0.012, y, -0.024] });                                // kormány
    }
    return m;
  }

  // ================= SZÉLKERÉK =================
  const TURBINE_HUB = [0, 1.3, 0.11];
  function windTurbine(K){
    const body = K.model(), blades = K.model(), [hx, hy, hz] = TURBINE_HUB;
    body.add(K.cylinder(0.12, 0.14, 0.05, 12), { color:'steel:2', t:[0, 0.025, 0] });                                 // betonalap
    body.add(K.lathe([[0.055, 0.05], [0.042, 0.6], [0.03, hy - 0.03]], 12), { color:'white:2' });                     // karcsú, elvékonyodó torony
    body.add(K.box(0.03, 0.06, 0.012), { color:'steel:2', t:[0, 0.1, 0.054] });                                       // szervizajtó
    body.add(K.torus(0.05, 0.006, 12, 3), { color:'honey:1', t:[0, 0.5, 0] });                                         // mézsárga díszgyűrű
    body.add(K.chamferBox(0.08, 0.08, 0.2, 0.02), { color:'white:1', t:[0, hy, -0.02] });                              // gondola
    body.add(K.box(0.03, 0.015, 0.05), { color:'steel:2', t:[0, hy + 0.047, -0.08] });                                // hűtő a tetején
    // rotor (a blades részben, a hub pontban): agy-kúp + 3 lapát enyhe dőlésszöggel, mézsárga csúccsal
    blades.add(K.lathe([[0.04, -0.03], [0.036, 0.01], [0.02, 0.04], [0, 0.055]], 12), { color:'white:1', t:[hx, hy, hz], r:[90, 0, 0] });
    const blade = [[-0.014, 0.03], [0.028, 0.05], [0.026, 0.2], [0.012, 0.44], [-0.004, 0.44], [-0.02, 0.12]];
    const tip = [[-0.004, 0.44], [0.012, 0.44], [0.006, 0.54], [0, 0.54]];
    for(let k = 0; k < 3; k++){ const rr = [0, 12, k * 120];
      blades.add(K.extrude(blade, 0.01), { color:'white:1', t:[hx, hy, hz], r:rr });
      blades.add(K.extrude(tip, 0.01), { color:'honey:1', t:[hx, hy, hz], r:rr }); }
    return { body, blades, hub:TURBINE_HUB.slice() };
  }

  // ================= HELYTÖRTÉNETI MÚZEUM =================
  function museum(K){
    const m = K.model(), cb = K.chamferBox, W = 1.3, D = 0.55, z0 = -0.29, F = z0 + D / 2;
    const B0 = 0.11, Hw = 0.57, Ey = B0 + Hw + 0.06, rise = 0.2;                  // B0 = a lábazat teteje, Ey = a párkány teteje
    m.add(cb(1.6, 0.03, 1.2, 0.01), { color:'steel:1', t:[0, 0.015, 0] });                                              // kövezett tér
    m.add(K.cylinder(0.13, 0.13, 0.006, 8), { color:'white:1', t:[0.56, 0.032, 0.33] });                              // kőkör a kút körül
    // lábazat (magasított kőtalapzat) + főtömeg halvány mézszínű vakolattal, fehér sarok-lizénák, főpárkány
    m.add(cb(W + 0.06, B0 - 0.03, D + 0.06, 0.012), { color:'white:1', t:[0, 0.03 + (B0 - 0.03) / 2, z0] });
    m.add(cb(W, Hw, D, 0.02), { color:'honey:0', t:[0, B0 + Hw / 2, z0] });
    for(const sx of [-1, 1]) m.add(K.box(0.05, Hw, 0.02), { color:'white:1', t:[sx * (W / 2 - 0.025), B0 + Hw / 2, F + 0.006] });
    m.add(K.box(W + 0.05, 0.06, D + 0.05), { color:'white:1', t:[0, Ey - 0.03, z0] });
    // alacsony kontyolt tető (patinás rézfedés)
    const e = 0.03, rx = W / 2 - D / 2;
    m.add(K.hull([[-W / 2 - e, Ey, z0 - D / 2 - e], [W / 2 + e, Ey, z0 - D / 2 - e], [W / 2 + e, Ey, z0 + D / 2 + e],
      [-W / 2 - e, Ey, z0 + D / 2 + e], [-rx, Ey + rise, z0], [rx, Ey + rise, z0]]), { color:'teal:1' });
    // oszlopcsarnok (portikusz): 4 oszlop lábazattal és fejezettel, gerendázat, háromszög-oromzat – felirat nélkül
    const PW = 0.62, PD = 0.26, PZ = F + PD / 2, cz = F + PD - 0.04;
    m.add(K.box(PW + 0.1, B0 - 0.03, PD + 0.02), { color:'white:1', t:[0, 0.03 + (B0 - 0.03) / 2, PZ] });           // a portikusz padlója
    for(const x of [-0.24, -0.08, 0.08, 0.24]) m.add(K.lathe([[0.036, B0], [0.036, B0 + 0.025], [0.024, B0 + 0.035], [0.02, Ey - 0.09],
      [0.034, Ey - 0.065]], 6), { color:'white:1', t:[x, 0, cz] });
    m.add(K.box(PW + 0.04, 0.065, PD + 0.02), { color:'white:1', t:[0, Ey - 0.065 / 2, PZ + 0.005] });                 // gerendázat
    const ph = 0.19, hw = PW / 2 + 0.03, pz0 = z0, pz1 = F + PD + 0.015;
    m.add(K.hull([[-hw, Ey, pz0], [hw, Ey, pz0], [0, Ey + ph, pz0], [-hw, Ey, pz1], [hw, Ey, pz1], [0, Ey + ph, pz1]]), { color:'white:1' });
    m.add(K.extrude([[-hw + 0.06, 0], [hw - 0.06, 0], [0, ph - 0.045]], 0.01), { color:'honey:0', t:[0, Ey + 0.02, pz1 + 0.001] });   // oromzatmező
    const pa = Math.atan2(ph, hw), pl = Math.hypot(ph, hw) + 0.02;                                                   // rézfedés az oromzaton
    for(const sx of [-1, 1]) m.add(K.box(pl, 0.022, pz1 - pz0 + 0.03), { color:'teal:1',
      t:[sx * hw / 2, Ey + ph / 2 + 0.014, (pz0 + pz1) / 2 + 0.015], r:[0, 0, -sx * pa * DEG] });
    // bejárat: íves kapu fehér kerettel a csarnok mélyén
    m.add(K.extrude(arch(0.18, 0.38, 4), 0.012), { color:'white:1', t:[0, B0, F + 0.004] });
    m.add(K.extrude(arch(0.14, 0.35, 4), 0.012), { color:'wood:2', t:[0, B0, F + 0.01] });
    // magas íves ablakok a két szárnyon (elöl) és az oldalfalakon, hátul két egyszerű ablak
    for(const x of [0.42, 0.56]) for(const sx of [-1, 1]){
      m.add(K.extrude(arch(0.12, 0.38, 4), 0.012), { color:'white:1', t:[sx * x, B0 + 0.07, F + 0.004] });
      m.add(K.extrude(arch(0.09, 0.35, 4), 0.012), { color:'glass:2', t:[sx * x, B0 + 0.085, F + 0.01] }); }
    for(const z of [z0 - 0.12, z0 + 0.12]) for(const sx of [-1, 1])
      m.add(K.extrude(arch(0.09, 0.35, 4), 0.012), { color:'glass:2', t:[sx * (W / 2 + 0.004), B0 + 0.085, z], r:[0, 90, 0] });
    for(const sx of [-1, 1]) m.add(K.box(0.1, 0.3, 0.012), { color:'glass:2', t:[sx * 0.3, B0 + 0.22, z0 - D / 2 - 0.004] });   // hátsó ablakok
    // széles lépcső a portikusz előtt (3 fok a térig)
    for(let i = 0; i < 3; i++) m.add(K.box(0.8 - i * 0.04, 0.027, 0.06), { color:'white:1', t:[0, 0.03 + 0.0135 + i * 0.027, F + PD + 0.14 - i * 0.05] });
    // zászlótartó a tér bal szélén: oszlop, keresztrúd, lelógó sima mézsárga fecskefarkú szalag (jelkép, felirat nélkül)
    const fx = -0.68, fz = 0.3;
    m.add(K.cylinder(0.008, 0.012, 0.8, 6), { color:'dark:2', t:[fx, 0.43, fz] });
    m.add(K.box(0.16, 0.01, 0.01), { color:'dark:2', t:[fx + 0.07, 0.8, fz] });
    m.add(K.extrude([[0, 0], [0.12, 0], [0.12, -0.3], [0.06, -0.25], [0, -0.3]], 0.008), { color:'gold:1', t:[fx + 0.015, 0.795, fz] });
    // régi nyomós kút (öntöttvas, patinás zöld): kőtalp, karcsú test gombos tetővel, kifolyó, kar, kő itatóvályú
    const kx = 0.56, kz = 0.3;
    m.add(K.cylinder(0.045, 0.05, 0.03, 6), { color:'white:1', t:[kx, 0.045, kz] });
    m.add(K.lathe([[0.032, 0.06], [0.02, 0.1], [0.02, 0.25], [0.03, 0.27], [0, 0.31]], 6), { color:'teal:1', t:[kx, 0, kz] });
    m.add(K.box(0.018, 0.018, 0.07), { color:'teal:1', t:[kx, 0.2, kz + 0.045] });                                   // kifolyó
    m.add(K.box(0.012, 0.02, 0.012), { color:'teal:1', t:[kx, 0.19, kz + 0.078] });
    rod(m, K, [kx, 0.26, kz - 0.02], [kx, 0.2, kz - 0.16], 0.007, 0.006, 4, 'dark:2');                                 // pumpáló kar
    m.add(K.box(0.13, 0.045, 0.08), { color:'white:1', t:[kx, 0.055, kz + 0.1] });                               // itatóvályú
    m.add(K.box(0.1, 0.004, 0.05), { color:'glass:2', t:[kx, 0.078, kz + 0.1] });
    // két pad a tér elején, a múzeum felé fordulva
    bench(m, K, -0.34, 0.5, 180, 'wood:2', 0.03);
    bench(m, K, 0.3, 0.5, 180, 'wood:2', 0.03);
    return m;
  }

  Object.assign(VM, { townHall, library, busStop, market, recyclingYard, solarRoof, bikeLane, windTurbine, museum, TURBINE_HUB });
  root.VAROS_MODELS = VM;
  if(typeof module !== 'undefined' && module.exports) module.exports = VM;
})(typeof window !== 'undefined' ? window : globalThis);
