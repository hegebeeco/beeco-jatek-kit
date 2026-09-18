// ============================================================
//  FENNTARTHATÓ OTTHON – a matrica-album 3D háza B szinten (docs/rajzolas.md): hatszögletű, nyitott tetejű fa ház
//
//  Méretek (játékegység; a szemmagasság 2,35): a hatszög csúcs-sugara R, a falak belső távolsága r = R·cos30°.
//  A 6 fal = a 6 játék (fal-index = szög: 30° + i·60°). Minden falon: lambéria, 3 polc, felül névtábla-hely.
//  Builder-függvények (K = MODEL): a helyi tengelyek a ház közepén, Y fel. A matricákat és a táblákat az otthon.js teszi rá.
//  KIT-MÁSOLAT (beeco-jatek-kit, web/js/3d/): a globális név és a builderek aláírása VÁLTOZATLAN, így a játék a kit
//  példányát is betöltheti. Kell hozzá: js/ds.js, js/art/art.js, js/art/model-kit.js. Katalógus: 3d/katalogus.js, galéria: modellek.html.
// ============================================================
(function(root){
  const OT = { R:9, H:4.4, shelves:[0.7, 1.65, 2.6], shelfW:5.6, shelfD:0.42 };
  OT.r = OT.R*Math.cos(Math.PI/6);
  OT.wallAng = i => Math.PI/6 + i*Math.PI/3;                                  // a fal közepének iránya (radián)

  // Egy fal a ház közepétől r távolságra, befelé néz: lambéria, polcok konzollal, sarokoszlopok, felső gerenda
  function wall(K){
    const m = K.model(), cb = K.chamferBox, W = 2*OT.R*Math.sin(Math.PI/6);   // a hatszög oldalhossza = R
    m.add(K.box(W, OT.H, 0.3), { color:'cream:1', t:[0, OT.H/2, 0.15] });                  // fal
    m.add(K.box(W, 0.9, 0.08), { color:'wood:1', t:[0, 0.45, -0.02] });                   // lambéria
    m.add(K.box(W, 0.1, 0.12), { color:'wood:2', t:[0, 0.92, -0.04] });                   // lambéria-léc
    for(const y of OT.shelves){
      m.add(cb(OT.shelfW, 0.1, OT.shelfD, 0.03), { color:'wood:1', t:[0, y, -OT.shelfD/2] });
      m.add(K.box(OT.shelfW, 0.04, 0.05), { color:'wood:2', t:[0, y - 0.06, -OT.shelfD + 0.02] });   // élárnyék
      for(const x of [-OT.shelfW/2 + 0.3, OT.shelfW/2 - 0.3]) m.add(K.box(0.08, 0.28, OT.shelfD*0.8), { color:'wood:2', t:[x, y - 0.18, -OT.shelfD/2] });   // konzol
    }
    m.add(K.box(W + 0.1, 0.28, 0.4), { color:'wood:2', t:[0, OT.H - 0.14, -0.05] });         // felső gerenda
    m.add(K.box(W + 0.12, 0.16, 0.5), { color:'leaf:1', t:[0, OT.H + 0.08, 0.05] });         // zöldtető-perem
    for(let k = -2; k <= 2; k++) m.add(K.sphere(0.2, 6, 4), { color:k % 2 ? 'leaf:0' : 'grass:1', t:[k*1.7, OT.H + 0.2, 0.1], s:[1.6, 0.7, 1] });   // növény a peremen
    return m;
  }
  // Sarokoszlop (a hatszög csúcsain) és a tető gerendái a közép felé
  function frame(K){
    const m = K.model();
    for(let i = 0; i < 6; i++){ const a = i*Math.PI/3, x = Math.cos(a)*OT.R, z = Math.sin(a)*OT.R;
      m.add(K.chamferBox(0.36, OT.H + 0.3, 0.36, 0.06), { color:'wood:2', t:[x, (OT.H + 0.3)/2, z], r:[0, -a*180/Math.PI, 0] });
      const len = OT.R - 1.2, mx = Math.cos(a)*(1.2 + len/2), mz = Math.sin(a)*(1.2 + len/2);
      m.add(K.box(len, 0.2, 0.2), { color:'wood:1', t:[mx, OT.H + 0.9, mz], r:[0, -a*180/Math.PI, 0] }); }
    m.add(K.cylinder(1.2, 1.2, 0.3, 6), { color:'honey:1', t:[0, OT.H + 0.9, 0] });            // méhsejt-zárókő
    // padló: hatszög, mézszínű méhsejt-deszkázat helyett nyugodt fa
    m.add(K.cylinder(OT.R + 0.1, OT.R + 0.1, 0.16, 6), { color:'wood:1', t:[0, 0.02, 0], r:[0, 90, 0] });
    m.add(K.cylinder(3.2, 3.2, 0.03, 6), { color:'sage:2', t:[0, 0.11, 0], r:[0, 90, 0] });   // szőnyeg
    return m;
  }
  // Kerek asztal a jelvényeknek + napi küldetés tábla állvánnyal
  function table(K){
    const m = K.model();
    m.add(K.cylinder(1.25, 1.25, 0.12, 16), { color:'wood:1', t:[0, 1.0, 0] });
    m.add(K.cylinder(1.3, 1.3, 0.05, 16), { color:'wood:2', t:[0, 0.93, 0] });
    m.add(K.cylinder(0.14, 0.22, 0.9, 10), { color:'wood:2', t:[0, 0.47, 0] });
    m.add(K.cylinder(0.6, 0.7, 0.08, 12), { color:'wood:2', t:[0, 0.06, 0] });
    return m;
  }
  function board(K){                                                         // állvány a küldetés-táblának
    const m = K.model();
    // kit: B szintre emelve (letört élű lábak, talpak, gombok) – a méretek és a helyek a játékéval azonosak
    for(const x of [-0.8, 0.8]){
      m.add(K.chamferBox(0.1, 2.4, 0.1, 0.02), { color:'wood:2', t:[x, 1.2, 0] });
      m.add(K.chamferBox(0.16, 0.08, 0.5, 0.02), { color:'wood:2', t:[x, 0.04, 0] });                // talp
      m.add(K.sphere(0.07, 8, 4), { color:'wood:1', t:[x, 2.44, 0] });                                // gomb a láb tetején
    }
    m.add(K.chamferBox(1.9, 0.1, 0.14, 0.02), { color:'wood:2', t:[0, 0.9, 0] });
    return m;
  }
  function medal(K, got){                                                    // jelvény-érme talppal
    const m = K.model();
    m.add(K.cylinder(0.2, 0.2, 0.05, 14), { color:got ? 'gold:1' : 'steel:2', t:[0, 0.26, 0], r:[90, 0, 0] });
    m.add(K.cylinder(0.14, 0.14, 0.06, 14), { color:got ? 'honey:0' : 'steel:1', t:[0, 0.26, 0.01], r:[90, 0, 0] });
    m.add(K.box(0.18, 0.06, 0.12), { color:'wood:2', t:[0, 0.03, 0] });
    m.add(K.box(0.04, 0.06, 0.04), { color:'wood:2', t:[0, 0.09, 0] });
    return m;
  }
  const OT_MODELS = { wall, frame, table, board, medal };
  root.OT = OT; root.OT_MODELS = OT_MODELS;                                 // böngészőben (és Node-ban is) globális – mint a játékban
  if(typeof module !== 'undefined' && module.exports) module.exports = { OT, OT_MODELS };   // Node: require('…/otthon-modellek.js')
})(typeof window !== 'undefined' ? window : globalThis);
