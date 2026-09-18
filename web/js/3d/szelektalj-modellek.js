// ============================================================
//  SZELEKTÁLJ! – a pályák 3D tárgyai B szinten (docs/rajzolas.md): letört élek, 8–16 szegmens, jellegzetes részletek
//
//  Kukák (4 fajta – a valóságban is így néznek ki): kerekes kuka · gyűjtődoboz (elem, gyógyszer, veszélyes, e-hulladék) ·
//  hordó tölcsérrel (használt olaj) · harang (üveg). Kert: léckerítés, fa almákkal, bokor, magaságyás.
//  Utca: kandeláber. Gyár: futószalag-váz, gép, lámpa, cső. Tenger: csónak.
//  Builderek: (K, …) => modell, K = modell-készlet (a játékban window.MODEL → .toThree, Node-ban tools/modell-kit.js → .save GLB).
//  Helyi tengelyek: talp y = 0, a tárgy ELEJE +Z felé (a kukát a játék megfordítja, hogy a játékos felé nézzen).
//  A kukák a modellen jelzik, hova kerül a kategória-ikon: m.icon = { y, z, s } (magasság, előrenyúlás, méret-szorzó).
//  KIT-MÁSOLAT (beeco-jatek-kit, web/js/3d/): a globális név és a builderek aláírása VÁLTOZATLAN, így a játék a kit
//  példányát is betöltheti. Kell hozzá: js/ds.js, js/art/art.js, js/art/model-kit.js. Katalógus: 3d/katalogus.js, galéria: modellek.html.
// ============================================================
(function(root){
  // a 3D paletta (DS.world): böngészőben a globális DS, Node-ban a ds.js – a kitben egy mappával feljebb (js/ds.js), a játékban mellette
  const dsNode = () => { try{ return require('../ds.js'); }catch(e){ return require('./ds.js'); } };
  const DSW = () => (typeof DS !== 'undefined' ? DS : dsNode()).world;
  // szín sötétítése/világosítása (k < 1 sötétebb) – a kukák a tartalomból kapják az alapszínt
  const shade = (hex, k) => { const c = s => Math.max(0, Math.min(255, Math.round(((hex >> s) & 255) * k))); return (c(16) << 16) | (c(8) << 8) | c(0); };
  // letört sarkú téglalap pontjai egy magasságban (hull-hoz)
  const rr = (hw, hd, c, y) => [[hw - c, y, hd], [hw, y, hd - c], [hw, y, -hd + c], [hw - c, y, -hd], [-hw + c, y, -hd], [-hw, y, -hd + c], [-hw, y, hd - c], [-hw + c, y, hd]];

  // ================= KUKÁK =================
  const BIN_KIND = { elem:'box', gyogyszer:'box', veszelyes:'box', ehulladek:'box', olaj:'barrel', uveg:'bell' };

  // közös: tábla-oszlop hátul, konzollal a tábla felé (a tábla maga a játékban készül, y ≈ 2,16)
  function signPost(m, K){
    m.add(K.cylinder(0.05, 0.06, 2.1, 8), { color:'dark:1', t:[0, 1.05, -0.8] });
    m.add(K.box(0.07, 0.07, 0.78), { color:'dark:1', t:[0, 1.98, -0.42] });
  }

  // kerekes kuka: kúposodó test, perem, fedél fogantyúval, hátul zsanér + tolókar + két kerék, bordák az oldalán
  function wheelieBin(K, color){
    const m = K.model(), cb = K.chamferBox, dark = shade(color, 0.72), lid = shade(color, 0.84);
    m.add(K.hull([...rr(0.46, 0.46, 0.08, 0.2), ...rr(0.6, 0.58, 0.1, 1.52)]), { color });
    m.add(K.hull([...rr(0.64, 0.62, 0.1, 1.44), ...rr(0.64, 0.62, 0.1, 1.58)]), { color:dark });           // perem
    m.add(K.hull([...rr(0.67, 0.66, 0.1, 1.6), ...rr(0.62, 0.6, 0.12, 1.74)]), { color:lid });             // fedél
    m.add(cb(0.46, 0.09, 0.12, 0.03), { color:dark, t:[0, 1.63, 0.7] });                                    // fedél-fogantyú
    m.add(cb(0.98, 0.98, 0.05, 0.02), { color:shade(color, 1.1), t:[0, 0.98, 0.555], r:[5, 0, 0] });        // ikon-lap elöl
    for(const sx of [-1, 1]) for(const z of [-0.24, 0.24]) m.add(K.box(0.05, 0.95, 0.09), { color:dark, t:[sx * 0.55, 0.88, z], r:[0, 0, sx * 5] });   // oldalbordák
    m.add(K.cylinder(0.05, 0.05, 1.04, 8), { color:'dark:1', t:[0, 1.42, -0.7], r:[0, 0, 90] });            // tolókar
    for(const sx of [-1, 1]){
      m.add(K.box(0.14, 0.12, 0.12), { color:'dark:1', t:[sx * 0.4, 1.58, -0.66] });                       // zsanér
      m.add(K.cylinder(0.22, 0.22, 0.14, 12), { color:'dark:1', t:[sx * 0.52, 0.22, -0.44], r:[0, 0, 90] }); // kerék
      m.add(K.cylinder(0.08, 0.08, 0.16, 8), { color:'steel:1', t:[sx * 0.52, 0.22, -0.44], r:[0, 0, 90] });
    }
    m.add(cb(0.5, 0.14, 0.12, 0.03), { color:dark, t:[0, 0.08, 0.42] });                                    // első talp
    m.icon = { y:0.98, z:0.61, s:1 };
    return m;
  }

  // gyűjtődoboz (boltban, patikában, gyűjtőponton): lábakon álló szekrény, ferde tető, bedobónyílás, zár
  function boxBin(K, color){
    const m = K.model(), cb = K.chamferBox, dark = shade(color, 0.7);
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) m.add(K.box(0.1, 0.24, 0.1), { color:'dark:1', t:[sx * 0.5, 0.12, sz * 0.36] });
    m.add(cb(1.22, 1.24, 0.96, 0.06), { color, t:[0, 0.84, 0] });
    m.add(K.hull([[-0.66, 1.44, 0.54], [0.66, 1.44, 0.54], [-0.66, 1.44, -0.54], [0.66, 1.44, -0.54],
                  [-0.66, 1.58, 0.54], [0.66, 1.58, 0.54], [-0.66, 1.76, -0.54], [0.66, 1.76, -0.54]]), { color:dark });   // ferde tető
    m.add(cb(0.8, 0.2, 0.05, 0.02), { color:dark, t:[0, 1.3, 0.49] });                                      // nyílás kerete
    m.add(K.box(0.64, 0.07, 0.04), { color:'dark:1', t:[0, 1.3, 0.52] });                                   // bedobónyílás
    m.add(cb(1.0, 0.86, 0.03, 0.02), { color:shade(color, 1.1), t:[0, 0.72, 0.49] });                       // ajtó
    m.add(cb(0.08, 0.14, 0.06, 0.02), { color:'steel:1', t:[0.42, 0.72, 0.52] });                           // zár
    m.icon = { y:0.74, z:0.53, s:0.78 };
    return m;
  }

  // olajgyűjtő hordó: domború test két abronccsal, tetején tölcsér
  function barrelBin(K, color){
    const m = K.model(), dark = shade(color, 0.7);
    m.add(K.lathe([[0.54, 0], [0.6, 0.06], [0.64, 0.45], [0.66, 0.8], [0.64, 1.15], [0.6, 1.52], [0.54, 1.58]], 16), { color });
    for(const y of [0.42, 1.18]) m.add(K.torus(0.655, 0.035, 16, 4), { color:dark, t:[0, y, 0] });
    m.add(K.lathe([[0.1, 1.58], [0.14, 1.64], [0.38, 1.86], [0.4, 1.9]], 12), { color:'steel:1' });          // tölcsér kívül
    m.add(K.lathe([[0.36, 1.89], [0.12, 1.66]], 12), { color:'steel:2' });                                   // tölcsér belül
    m.add(K.cylinder(0.08, 0.08, 0.06, 8), { color:dark, t:[0.36, 1.6, -0.2] });                            // dugó
    m.icon = { y:0.82, z:0.69, s:0.82 };
    return m;
  }

  // üveggyűjtő harang: kupolás test, bedobó lyukak, emelőfül a tetején
  function bellBin(K, color){
    const m = K.model(), dark = shade(color, 0.7);
    m.add(K.lathe([[0.72, 0], [0.74, 0.1], [0.7, 0.2], [0.68, 0.92], [0.62, 1.18], [0.46, 1.44], [0.22, 1.58], [0.001, 1.62]], 16), { color });
    m.add(K.torus(0.72, 0.05, 16, 4), { color:dark, t:[0, 0.12, 0] });                                      // talpgyűrű
    for(const a of [-38, 38]){ const R = 0.57, rd = a * Math.PI / 180;
      m.add(K.cylinder(0.14, 0.14, 0.08, 12), { color:'dark:1', t:[R * Math.sin(rd), 1.3, R * Math.cos(rd)], r:[45, a, 0] }); }   // bedobó lyukak
    m.add(K.cylinder(0.08, 0.1, 0.14, 8), { color:'steel:1', t:[0, 1.68, 0] });
    m.add(K.torus(0.14, 0.04, 12, 4), { color:'steel:1', t:[0, 1.88, 0], r:[90, 0, 0] });                  // emelőfül
    m.icon = { y:0.72, z:0.72, s:0.78 };
    return m;
  }

  function bin(K, id, color){
    const kind = BIN_KIND[id] || 'wheelie';
    const m = kind === 'box' ? boxBin(K, color) : kind === 'barrel' ? barrelBin(K, color) : kind === 'bell' ? bellBin(K, color) : wheelieBin(K, color);
    signPost(m, K); m.kind = kind; return m;
  }

  // ================= KERT =================
  // léckerítés egy oldala az X tengely mentén (hossz: len), a lécek hegyes tetejűek
  function fence(K, len){
    const m = K.model(), W = DSW(), n = Math.round(len / 0.36), post = Math.round(len / 2.25);
    for(let i = 0; i <= post; i++) m.add(K.chamferBox(0.2, 1.45, 0.2, 0.05), { color:shade(W.fence, 0.78), t:[-len / 2 + i * len / post, 0.72, 0] });
    for(const y of [0.4, 1.0]) m.add(K.box(len, 0.12, 0.08), { color:shade(W.fence, 0.86), t:[0, y, -0.1] });
    const picket = K.extrude([[-0.09, 0], [0.09, 0], [0.09, 1.1], [0, 1.24], [-0.09, 1.1]], 0.05);
    for(let i = 0; i < n; i++) m.add(picket, { color:W.fence, t:[-len / 2 + (i + 0.5) * len / n, 0.04, 0] });
    return m;
  }

  // fa: gyökeres törzs, négy lombcsomó két zöldben, néhány alma
  function tree(K){
    const m = K.model(), W = DSW();
    m.add(K.lathe([[0.34, 0], [0.24, 0.25], [0.19, 1.2], [0.14, 2.3]], 8), { color:W.trunk });
    m.add(K.box(0.1, 0.1, 0.9), { color:shade(W.trunk, 0.8), t:[0.22, 1.7, 0.2], r:[-50, 30, 0] });         // ág
    const crowns = [[0, 2.75, 0, 1.25, W.foliage], [0.75, 2.45, 0.35, 0.85, W.foliageLight], [-0.7, 2.55, -0.25, 0.9, W.foliage], [0.15, 3.45, 0.2, 0.82, W.foliageLight]];
    for(const [x, y, z, r, c] of crowns) m.add(K.sphere(r, 8, 6), { color:c, t:[x, y, z] });
    for(const [x, y, z] of [[0.9, 2.2, 0.9], [-0.6, 2.1, 0.8], [0.3, 2.6, 1.2], [-1.2, 2.8, 0.4], [1.3, 2.9, -0.2]]) m.add(K.sphere(0.13, 6, 4), { color:'red:1', t:[x, y, z] });
    return m;
  }

  // bokor: lombcsomók és apró virágok
  function bush(K){
    const m = K.model(), W = DSW();
    for(const [x, y, z, r, c] of [[0, 0.45, 0, 0.6, W.bush], [0.5, 0.35, 0.15, 0.45, W.foliageLight], [-0.45, 0.38, -0.1, 0.48, W.bush], [0.05, 0.75, -0.2, 0.42, W.foliageLight]])
      m.add(K.sphere(r, 7, 5), { color:c, t:[x, y, z] });
    for(const [x, y, z] of [[0.3, 0.8, 0.45], [-0.4, 0.7, 0.35], [0.6, 0.6, -0.3], [-0.1, 1.05, 0.1]]) m.add(K.sphere(0.07, 6, 4), { color:'blossom:1', t:[x, y, z] });
    return m;
  }

  // magaságyás (ide kerül a szemétkupac): deszkakeret körben, föld, néhány rög
  function bed(K){
    const m = K.model(), W = DSW(), N = 16, R = 2.72;
    m.add(K.cylinder(2.64, 2.64, 0.16, 20), { color:W.soil, t:[0, 0.08, 0] });
    for(let i = 0; i < N; i++){ const a = i / N * 360, rd = a * Math.PI / 180;
      m.add(K.chamferBox(1.1, 0.26, 0.2, 0.05), { color:i % 2 ? W.woodRim : shade(W.woodRim, 0.88), t:[R * Math.sin(rd), 0.13, R * Math.cos(rd)], r:[0, a, 0] }); }   // érintő irányú deszkák
    for(const [x, z] of [[1.9, 0.6], [-1.6, 1.3], [0.4, -2.1], [-2.0, -0.9]]) m.add(K.sphere(0.16, 6, 4), { color:shade(W.soil, 0.8), t:[x, 0.16, z], s:[1, 0.5, 1] });
    return m;
  }

  // ================= UTCA =================
  // kandeláber: talp, karcsú oszlop, kar, lámpabúra
  function lampPost(K){
    const m = K.model();
    m.add(K.chamferBox(0.36, 0.24, 0.36, 0.05), { color:'dark:1', t:[0, 0.12, 0] });
    m.add(K.lathe([[0.1, 0.24], [0.08, 0.9], [0.06, 3.1]], 8), { color:'dark:1' });
    m.add(K.box(0.9, 0.06, 0.06), { color:'dark:1', t:[0.42, 3.05, 0] });
    m.add(K.lathe([[0.001, 3.14], [0.12, 3.1], [0.3, 2.9], [0.32, 2.86]], 10), { color:'steel:2', t:[0.84, 0, 0] });   // búra
    m.add(K.sphere(0.14, 8, 4), { color:'honey:0', t:[0.84, 2.88, 0] });
    return m;
  }

  // ================= GYÁR =================
  // futószalag váza (a mozgó lécek a játékban külön vannak): sárga keret, sötét szalag, végeken görgők, lábak
  function conveyor(K){
    const m = K.model(), L = 15.6, cb = K.chamferBox;
    m.add(K.box(L, 0.14, 3.3), { color:'dark:1', t:[0, 0.84, 0] });                                        // szalag
    for(const sz of [-1, 1]){
      m.add(cb(L + 0.4, 0.36, 0.2, 0.05), { color:'honey:1', t:[0, 0.84, sz * 1.8] });                     // oldalkeret
      m.add(K.box(L + 0.3, 0.06, 0.06), { color:'dark:1', t:[0, 1.04, sz * 1.8] });
      for(let i = 0; i < 5; i++) m.add(K.box(0.16, 0.7, 0.16), { color:'steel:2', t:[-L / 2 + 0.3 + i * (L - 0.6) / 4, 0.33, sz * 1.55] });   // lábak
    }
    for(const sx of [-1, 1]) m.add(K.cylinder(0.26, 0.26, 3.4, 12), { color:'steel:1', t:[sx * L / 2, 0.8, 0], r:[90, 0, 0] });   // görgők
    for(let i = 0; i < 5; i++) m.add(K.box(0.1, 0.1, 3.1), { color:'steel:2', t:[-L / 2 + 0.3 + i * (L - 0.6) / 4, 0.2, 0] });     // merevítők
    return m;
  }

  // válogatógép: test, garat a tetején, kijárat a szalag felé, vezérlőpult lámpákkal, figyelmeztető csíkok
  function machine(K){
    const m = K.model(), cb = K.chamferBox;
    m.add(cb(2.6, 2.6, 2.6, 0.1), { color:'steel:2', t:[0, 1.3, 0] });
    m.add(K.hull([...rr(0.9, 0.9, 0.1, 2.6), ...rr(1.3, 1.3, 0.12, 3.5)]), { color:'steel:1', t:[0.2, 0, 0] });   // garat
    m.add(K.box(0.2, 1.1, 2.0), { color:'dark:1', t:[1.3, 0.95, 0] });                                      // kijárat
    m.add(cb(0.9, 0.7, 0.2, 0.04), { color:'dark:1', t:[0.4, 1.7, -1.36] });                                // vezérlőpult
    for(const [x, c] of [[0.15, 'red:1'], [0.4, 'leaf:1'], [0.65, 'honey:0']]) m.add(K.cylinder(0.07, 0.07, 0.08, 8), { color:c, t:[x, 1.8, -1.48], r:[90, 0, 0] });
    for(let i = 0; i < 6; i++) m.add(K.box(0.4, 0.2, 0.04), { color:i % 2 ? 'dark:1' : 'honey:1', t:[-1.05 + i * 0.42, 0.14, -1.32] });   // csíkok
    m.add(K.cylinder(0.2, 0.2, 1.2, 10), { color:'steel:2', t:[-0.8, 4.0, -0.6] });                         // kémény
    return m;
  }

  // ipari függőlámpa
  function hallLamp(K){
    const m = K.model();
    m.add(K.lathe([[0.5, -0.2], [0.36, 0.05], [0.12, 0.2], [0.001, 0.22]], 12), { color:'steel:2' });
    m.add(K.lathe([[0.46, -0.19], [0.33, 0.04]], 12), { color:'honey:0', s:[-1, 1, 1] });
    m.add(K.sphere(0.14, 8, 4), { color:'honey:0', t:[0, -0.12, 0] });
    m.add(K.cylinder(0.03, 0.03, 1.1, 6), { color:'dark:1', t:[0, 0.75, 0] });
    return m;
  }

  // függőleges cső karimákkal
  function pipe(K, h){
    const m = K.model();
    m.add(K.cylinder(0.22, 0.22, h, 12), { color:'orange:1', t:[0, h / 2, 0] });
    for(const y of [0.4, h / 2, h - 0.4]) m.add(K.cylinder(0.3, 0.3, 0.12, 12), { color:'orange:2', t:[0, y, 0] });
    return m;
  }

  // ================= TENGER =================
  // csónak (a mostani méretben: fedélzet 6,6 × 4,8, közepe z = −2): hajótest, deszkás fedélzet, perem, hegyes orr, kikötőbakok
  function boat(K){
    const m = K.model(), cb = K.chamferBox;
    m.add(K.hull([[-3.3, 0.6, -4.4], [3.3, 0.6, -4.4], [-2.7, -0.2, -4.4], [2.7, -0.2, -4.4], [-3.3, 0.6, 0.6], [3.3, 0.6, 0.6],
                  [-2.7, -0.2, 0.6], [2.7, -0.2, 0.6], [0, 0.62, 2.9], [0, 0.05, 2.6]]), { color:'wood:2' });   // hajótest
    m.add(K.box(6.3, 0.06, 4.9), { color:'wood:1', t:[0, 0.62, -1.9] });                                     // fedélzet
    for(let i = 0; i < 7; i++) m.add(K.box(0.04, 0.02, 4.9), { color:'wood:2', t:[-2.7 + i * 0.9, 0.66, -1.9] });
    for(const sx of [-1, 1]){
      m.add(cb(0.3, 0.62, 5.1, 0.06), { color:'wood:0', t:[sx * 3.2, 0.92, -1.9] });                          // oldalperem
      const dx = -sx * 3.2, dz = 2.35, len = Math.hypot(dx, dz), a = Math.atan2(dx, dz) * 180 / Math.PI;
      m.add(cb(0.3, 0.62, len, 0.06), { color:'wood:0', t:[sx * 3.2 + dx / 2, 0.92, 0.6 + dz / 2], r:[0, a, 0] });   // orr-perem
    }
    m.add(cb(6.7, 0.62, 0.3, 0.06), { color:'wood:0', t:[0, 0.92, -4.35] });                                // hátsó perem
    for(const x of [-2.2, 2.2]) m.add(K.cylinder(0.1, 0.12, 0.3, 8), { color:'dark:1', t:[x, 1.37, -4.35] });   // kikötőbakok a hátsó peremen
    return m;
  }

  const SZ_MODELS = { bin, fence, tree, bush, bed, lampPost, conveyor, machine, hallLamp, pipe, boat, shade, BIN_KIND };
  if(typeof module !== 'undefined' && module.exports){ module.exports = SZ_MODELS; return; }
  root.SZ_MODELS = SZ_MODELS;
})(typeof window !== 'undefined' ? window : globalThis);
