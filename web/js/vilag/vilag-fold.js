// ============================================================
//  beeco VILÁG – a talaj: füves textúra, füves sík, hatszögletű méhsejt-sziget földrétegekkel, virágos rét
//  (a játék hatter.js „FŰ” része és a rezsi-kulso.js szigete, paraméterezve). A vilag.js hívja – önállóan nem kell.
//
//  • grassTexture(THREE, seed): 512 px-es, hézagmentesen ismétlődő fű: nyírás-csíkok, foltok, fűcsomók, virágok, lóhere.
//  • build(THREE, ctx, o): { ground, island, meadow } csoportok. A rét apró részei (3D fűszál, kő, virágfej) C-ráadás
//    (ctx.extra) – B szinten eltűnnek; a fák és bokrok B-n is maradnak (összevont modellek, kevés rajzolási hívás).
//  Színek: csak ART.MAT (a köztes tónusokat két palettaszín keverése adja – nincs új nyers szín).
// ============================================================
(function(root){
  // két palettaszín keveréke ('#rrggbb'), t = 0 → a, 1 → b
  function mix(a, b, t){
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  function grassTexture(THREE, seed){
    const M = ART.MAT, rnd = VILAG_MODELS.rng(seed || 11), S = 512;
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.lineCap = x.lineJoin = 'round';
    const wrap = fn => { for(const dx of [-S, 0, S]) for(const dy of [-S, 0, S]) fn(dx, dy); };      // hézagmentes ismétlés
    x.fillStyle = M.grass[1]; x.fillRect(0, 0, S, S);
    x.fillStyle = mix(M.grass[1], M.grass[0], 0.28);                                                   // nyírás-csíkok
    for(let i = 0; i < 8; i += 2) x.fillRect(0, i * S / 8, S, S / 8);
    for(let i = 0; i < 16; i++){                                                                       // éles szélű foltok
      const cx = rnd() * S, cy = rnd() * S, r = 26 + rnd() * 30;
      x.fillStyle = i % 3 ? mix(M.grass[1], M.grass[0], 0.45) : mix(M.grass[1], M.grass[2], 0.6);
      const parts = Array.from({ length:5 }, () => [cx + (rnd() - 0.5) * r * 1.4, cy + (rnd() - 0.5) * r * 0.7, r * (0.4 + rnd() * 0.35)]);
      wrap((dx, dy) => { for(const [px, py, pr] of parts){ x.beginPath(); x.arc(px + dx, py + dy, pr, 0, 7); x.fill(); } });
    }
    const tuft = (px, py, s, col) => { x.strokeStyle = col; x.lineWidth = 2.4 * s; x.beginPath();
      x.moveTo(px - 5 * s, py - 7 * s); x.lineTo(px - s, py + 3 * s); x.moveTo(px, py - 11 * s); x.lineTo(px, py + 3 * s);
      x.moveTo(px + 5 * s, py - 7 * s); x.lineTo(px + s, py + 3 * s); x.stroke(); };
    for(let i = 0; i < 170; i++){ const px = rnd() * S, py = rnd() * S, s = 0.8 + rnd() * 0.6, col = i % 3 ? M.grass[2] : M.leaf[1]; wrap((dx, dy) => tuft(px + dx, py + dy, s, col)); }
    const flower = (px, py, s, petal) => { x.fillStyle = petal;
      for(let i = 0; i < 5; i++){ const a = i / 5 * Math.PI * 2; x.beginPath(); x.arc(px + Math.cos(a) * 3.2 * s, py + Math.sin(a) * 3.2 * s, 2.4 * s, 0, 7); x.fill(); }
      x.fillStyle = M.honey[1]; x.beginPath(); x.arc(px, py, 1.8 * s, 0, 7); x.fill(); };
    const petals = [M.white[0], M.white[0], M.blossom[0], M.sky[0]];
    for(let i = 0; i < 38; i++){ const px = rnd() * S, py = rnd() * S, s = 0.9 + rnd() * 0.4, col = petals[i % 4]; wrap((dx, dy) => flower(px + dx, py + dy, s, col)); }
    for(let i = 0; i < 24; i++){ const px = rnd() * S, py = rnd() * S; x.fillStyle = M.leaf[0];         // lóhere
      for(const [ox, oy] of [[-3, 0], [3, 0], [0, -4]]){ x.beginPath(); x.arc(px + ox, py + oy, 3.4, 0, 7); x.fill(); } }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  function build(THREE, ctx, o){
    const { K, toon, model3, extra } = ctx, M = ART.MAT, VM = VILAG_MODELS, out = {};
    const tex = grassTexture(THREE, o.seed * 11);
    // a textúra egy példánya saját ismétléssel (a vászon közös, csak a beállítás más)
    const retex = (t, n) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(n, n); return c; };
    // ---- füves sík (ha nincs sziget, vagy kérve van) ----
    if(o.ground){
      const size = o.groundSize, g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), toon(0xffffff, { map:retex(tex, size / 6) }));
      g.rotation.x = -Math.PI / 2; g.receiveShadow = true; out.ground = new THREE.Group(); out.ground.add(g);
    }
    // ---- hatszögletű füves sziget mézszínű földrétegekkel ----
    const I = o.island;
    if(I){
      const G = new THREE.Group(); G.position.set(I.x || 0, 0, I.z || 0);
      const top = new THREE.Mesh(new THREE.CircleGeometry(I.R, 6), toon(0xffffff, { map:retex(tex, I.R / 3) }));
      top.rotation.x = -Math.PI / 2; top.receiveShadow = true; G.add(top);
      G.add(model3(VM.islandSoil(K, I.R))); out.island = G;
    }
    // ---- rét: fák, bokrok (B-n is), 3D fűszálak, kövek, virágok (C) ----
    if(o.meadow){
      const R = o.meadow, rnd = VM.rng(o.seed * 77), cx = I ? (I.x || 0) : 0, cz = I ? (I.z || 0) : 0;
      const outer = I ? I.R - 1.2 : R.outer, inner = R.inner;
      const inside = (x, z) => { const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
        return I ? dz < outer * 0.866 && dx * 0.866 + dz * 0.5 < outer * 0.866 : Math.hypot(dx, dz) < outer; };   // hatszög (csúcs ±X) vagy kör
      const free = R.free || ((x, z) => Math.hypot(x - cx, z - cz) > inner);
      const spot = () => { for(let k = 0; k < 80; k++){ const x = cx + (rnd() * 2 - 1) * outer, z = cz + (rnd() * 2 - 1) * outer;
        if(inside(x, z) && free(x, z)) return [x, z]; } return null; };
      const G = new THREE.Group(), SZ = root.SZ_MODELS;
      const tree = SZ ? SZ.tree(K) : VM.simpleTree(K), bush = SZ ? SZ.bush(K) : VM.simpleBush(K), trees = K.model();
      for(let i = 0; i < R.trees; i++){ const p = spot(); if(p){ const s = 0.9 + rnd() * 0.5; trees.merge(tree, { t:[p[0], 0, p[1]], s:[s, s, s], r:[0, rnd() * 360, 0] }); } }
      for(let i = 0; i < R.bushes; i++){ const p = spot(); if(p){ const s = 0.8 + rnd() * 0.6; trees.merge(bush, { t:[p[0], 0, p[1]], s:[s, s, s], r:[0, rnd() * 360, 0] }); } }
      if(trees.stats().tris) G.add(model3(trees, true));
      const d = new THREE.Object3D(), col = new THREE.Color();
      const blade = new THREE.ConeGeometry(0.045, 0.3, 4); blade.translate(0, 0.15, 0);
      const N = R.tufts, grass = new THREE.InstancedMesh(blade, toon(0xffffff), N);
      for(let k = 0; k < N;){ const p = spot() || [cx, cz];
        for(let b = 0; b < 4 && k < N; b++, k++){ d.position.set(p[0] + (rnd() - 0.5) * 0.16, 0, p[1] + (rnd() - 0.5) * 0.16);
          d.rotation.set((rnd() - 0.5) * 0.7, rnd() * 6, (rnd() - 0.5) * 0.7); d.scale.setScalar(0.7 + rnd() * 0.7); d.updateMatrix();
          grass.setMatrixAt(k, d.matrix); grass.setColorAt(k, col.set(b % 2 ? M.grass[2] : M.leaf[1])); } }
      const NS = 18, stone = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.16, 0), toon(0xffffff), NS);
      for(let i = 0; i < NS; i++){ const p = spot() || [cx, cz]; d.position.set(p[0], 0.04, p[1]); d.rotation.set(rnd(), rnd() * 6, rnd()); d.scale.set(1, 0.55, 1); d.updateMatrix();
        stone.setMatrixAt(i, d.matrix); stone.setColorAt(i, col.set(i % 2 ? M.steel[1] : M.steel[2])); }
      const FL = R.flowers, stemG = new THREE.BoxGeometry(0.045, 0.34, 0.045); stemG.translate(0, 0.17, 0);
      const headG = new THREE.IcosahedronGeometry(0.115, 0); headG.translate(0, 0.38, 0);
      const stems = new THREE.InstancedMesh(stemG, toon(M.leaf[2]), FL), heads = new THREE.InstancedMesh(headG, toon(0xffffff), FL);
      const petals = [M.blossom[1], M.honey[1], M.red[0], M.white[0], M.purple[1], M.honey[0]];
      for(let i = 0; i < FL; i++){ const p = spot() || [cx, cz], sc = 0.8 + rnd() * 0.5;
        d.position.set(p[0], 0, p[1]); d.rotation.set((rnd() - 0.5) * 0.25, rnd() * 6, (rnd() - 0.5) * 0.25);
        d.scale.setScalar(sc); d.updateMatrix(); stems.setMatrixAt(i, d.matrix);
        d.scale.set(sc * 1.5, sc * 0.55, sc * 1.5); d.updateMatrix(); heads.setMatrixAt(i, d.matrix);   // a virágfej lapos korong
        heads.setColorAt(i, col.set(petals[i % petals.length])); }
      for(const m of [grass, stone, heads]) m.instanceColor.needsUpdate = true;
      const small = new THREE.Group(); for(const m of [grass, stone, stems, heads]){ m.receiveShadow = true; small.add(m); }
      G.add(extra(small)); out.meadow = G;
    }
    return out;
  }

  root.VILAG_FOLD = { grassTexture, build, mix };
})(typeof window !== 'undefined' ? window : globalThis);
