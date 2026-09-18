// ============================================================
//  beeco VILÁG – a háttér kódból épített 3D elemei (B szint: docs/rajzolas.md), a hatter.js / rezsi-kulso.js mintájára
//
//  Ugyanúgy működnek, mint a többi modell-builder (3d/szelektalj-modellek.js stb.): (K, …) => modell, ahol K = MODEL
//  (js/art/model-kit.js). A vilag.js ezekből rakja össze az eget és a szigetet; a galéria (modellek.html) és a teszt
//  (tests/check-3d.js) is ezeket hívja. Színek csak az ART.MAT palettából ('honey:1' …).
//  Helyi tengelyek: Y fel, talp / sziget-tető y = 0. A „véletlen” mindig ismételhető (mag = seed), így minden betöltéskor ugyanaz a kép.
//  Globális név: VILAG_MODELS (Node-ban module.exports).
// ============================================================
(function(root){
  // ismételhető álvéletlen (Park–Miller): rng(5)() mindig ugyanazt a sort adja
  function rng(seed){ let s = Math.max(1, Math.floor(seed || 1)) % 2147483647; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  // ---- FELHŐ: öt pöttyös gömb + lapos alj (egy szín: white:0) ----
  function cloud(K, s){
    const m = K.model(); s = s || 1;
    for(const [dx, dy, dz, r] of [[0, 0, 0, 2.2], [2.1, -0.4, 0.3, 1.6], [-2.1, -0.5, -0.2, 1.5], [0.8, 0.9, 0, 1.4], [-0.9, 0.6, 0.3, 1.2]])
      m.add(K.sphere(r * s, 8, 6), { color:'white:0', t:[dx * s, dy * s, dz * s] });
    m.add(K.sphere(2.6 * s, 8, 4), { color:'white:0', t:[0, -0.8 * s, 0], s:[1.5, 0.3, 0.9] });
    return m;
  }

  // ---- LEBEGŐ MÉHSEJT-SZIGET: füves hatszög-tető, két mézszínű földréteg, néhány fenyőszerű fa (a tető y = 0) ----
  function floatIsland(K, R, seed){
    const m = K.model(), rnd = rng(seed || 21); R = R || 4;
    m.add(K.cylinder(R, R, 0.5, 6), { color:'grass:1', t:[0, 0, 0], r:[0, 30, 0] });
    m.add(K.cylinder(R, R * 0.8, 1.4, 6), { color:'honey:1', t:[0, -0.95, 0], r:[0, 30, 0] });
    m.add(K.cylinder(R * 0.8, R * 0.45, 1.2, 6), { color:'honey:2', t:[0, -2.25, 0], r:[0, 30, 0] });
    for(let i = 0; i < 3; i++){ const a = rnd() * 6.28, rr = rnd() * R * 0.6, tx = Math.sin(a) * rr, tz = Math.cos(a) * rr;
      m.add(K.cylinder(0.12, 0.16, 0.8, 6), { color:'wood:2', t:[tx, 0.65, tz] });
      m.add(K.cylinder(0.001, 0.9, 1.8, 7), { color:i % 2 ? 'leaf:1' : 'grass:2', t:[tx, 1.9, tz] }); }
    return m;
  }

  // ---- SZÉLKERÉK: karcsú torony, három lapát (a talp y = 0; a lapátok külön is kérhetők a forgatáshoz) ----
  function turbineBlades(K){
    const m = K.model(), bl = K.box(0.16, 1.8, 0.06).map(tri => tri.map(p => [p[0], p[1] + 0.9, p[2]]));   // a lapát a tengelyből indul
    for(const a of [0, 120, 240]) m.add(bl, { color:'white:0', r:[0, 0, a] });
    m.add(K.cylinder(0.12, 0.12, 0.2, 8), { color:'steel:1', r:[90, 0, 0] });                              // agy
    return m;
  }
  function turbine(K, withBlades){
    const m = K.model();
    m.add(K.cylinder(0.08, 0.14, 4.2, 6), { color:'white:1', t:[0, 2.1, 0] });
    m.add(K.chamferBox(0.26, 0.24, 0.5, 0.05), { color:'white:1', t:[0, 4.3, 0.05] });                    // gondola
    if(withBlades !== false) m.merge(turbineBlades(K), { t:[0, 4.3, 0.36] });
    return m;
  }

  // ---- KIS HÁZIKÓ (a lebegő szigeten): krém fal, piros nyeregtető, ajtó, ablak ----
  function cottage(K){
    const m = K.model();
    m.add(K.chamferBox(1.4, 1.0, 1.2, 0.04), { color:'cream:1', t:[0, 0.5, 0] });
    m.add(K.hull([[-0.8, 0, -0.7], [0.8, 0, -0.7], [-0.8, 0, 0.7], [0.8, 0, 0.7], [0, 0.8, -0.7], [0, 0.8, 0.7]]), { color:'red:1', t:[0, 1.0, 0] });
    m.add(K.box(0.3, 0.55, 0.04), { color:'wood:2', t:[-0.3, 0.28, 0.61] });                              // ajtó
    m.add(K.box(0.34, 0.3, 0.04), { color:'sky:1', t:[0.32, 0.58, 0.61] });                               // ablak
    m.add(K.box(0.2, 0.5, 0.2), { color:'red:2', t:[0.4, 1.45, -0.2] });                                  // kémény
    return m;
  }

  // ---- MADÁRRAJ: n db „v” alakú madár egy kis felhőben (lapos, sötét) ----
  function birds(K, n, seed){
    const m = K.model(), rnd = rng(seed || 7);
    for(let i = 0; i < (n || 9); i++){ const bx = rnd() * 10 - 5, by = rnd() * 4, bz = rnd() * 6;
      for(const sx of [-1, 1]) m.add(K.box(0.7, 0.07, 0.07), { color:'dark:1', t:[bx + sx * 0.3, by, bz], r:[0, 0, sx * 25] }); }
    return m;
  }

  // ---- HATSZÖGLETŰ FÖLDSZIGET (a füves tető alatt): mézszínű földrétegek + gyepszél, a csúcs +X felé (mint a CircleGeometry(R, 6)) ----
  function islandSoil(K, R){
    const m = K.model(); R = R || 15;
    m.add(K.cylinder(R, R * 0.9, 2.2, 6), { color:'honey:1', t:[0, -1.12, 0], r:[0, 90, 0] });
    m.add(K.cylinder(R * 0.9, R * 0.55, 3.2, 6), { color:'honey:2', t:[0, -3.8, 0], r:[0, 90, 0] });
    m.add(K.cylinder(R * 0.55, R * 0.2, 3, 6), { color:'honey:3', t:[0, -6.9, 0], r:[0, 90, 0] });
    m.add(K.cylinder(R + 0.15, R + 0.15, 0.3, 6), { color:'grass:2', t:[0, -0.16, 0], r:[0, 90, 0] });   // gyepszél
    return m;
  }

  // ---- egyszerű fa és bokor (tartalék a réthez, ha a 3d/szelektalj-modellek.js nincs betöltve) ----
  function simpleTree(K){
    const m = K.model();
    m.add(K.lathe([[0.3, 0], [0.2, 0.3], [0.15, 2.2]], 8), { color:'wood:2' });
    for(const [x, y, z, r, c] of [[0, 2.6, 0, 1.1, 'leaf:1'], [0.6, 2.3, 0.3, 0.75, 'grass:1'], [-0.5, 2.4, -0.2, 0.8, 'leaf:1'], [0.1, 3.3, 0.1, 0.7, 'grass:1']])
      m.add(K.sphere(r, 8, 6), { color:c, t:[x, y, z] });
    return m;
  }
  function simpleBush(K){
    const m = K.model();
    for(const [x, y, z, r, c] of [[0, 0.42, 0, 0.55, 'grass:2'], [0.45, 0.32, 0.12, 0.4, 'grass:1'], [-0.4, 0.34, -0.1, 0.44, 'grass:2']])
      m.add(K.sphere(r, 7, 5), { color:c, t:[x, y, z] });
    for(const [x, y, z] of [[0.25, 0.75, 0.35], [-0.35, 0.65, 0.3]]) m.add(K.sphere(0.07, 6, 4), { color:'blossom:1', t:[x, y, z] });
    return m;
  }

  const VILAG_MODELS = { rng, cloud, floatIsland, turbine, turbineBlades, cottage, birds, islandSoil, simpleTree, simpleBush };
  if(typeof module !== 'undefined' && module.exports){ module.exports = VILAG_MODELS; return; }
  root.VILAG_MODELS = VILAG_MODELS;
})(typeof window !== 'undefined' ? window : globalThis);
