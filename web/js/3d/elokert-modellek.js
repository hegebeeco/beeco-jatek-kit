// ============================================================
//  ÉLŐ KERT – a kert 3D tárgyai B szinten (docs/rajzolas.md): 300–1200 △, letört élek, 4–6 szín az ART.MAT palettából
//
//  Builderek: EK_MODELS.<név>(K, opts) → modell (K = MODEL, js/art/model-kit.js), vagy RÉSZEK objektuma ({ body, water }).
//  Helyi tengelyek: Y fel, talp y = 0, a MEZŐ közepe az origó, az eleje +Z. EGY MEZŐ = EK_MODELS.TILE = 1,4 egység
//  (a szemmagasság 2,35 egység ≈ 1,7 m, tehát 1 m ≈ 1,38 egység). Minden tárgy alapja elfér a mezőn (a fa lombja ≤ 1,2 sugár).
//  Évszak: opts.season = 'tavasz' | 'nyar' | 'osz' | 'tel' (alapból 'nyar') – ahol számít (fa, sövény, rét, évelőágyás, veteményes).
//  Az állatok külön fájlban: 3d/elokert-allatok.js (ugyanebbe az EK_MODELS-be kerülnek).
//  Kell hozzá: js/art/art.js, js/art/model-kit.js. Katalógus: 3d/katalogus.js („Élő kert”), galéria: modellek.html.
// ============================================================
(function(root){
  const TILE = 1.4, SEASONS = ['tavasz', 'nyar', 'osz', 'tel'];
  const seasonOf = o => SEASONS.includes(o && o.season) ? o.season : 'nyar';

  // ---- segédek (az állatok fájlja is ezeket használja: EK_MODELS._h) ----
  // ismételhető álvéletlen (Park–Miller): ugyanaz a mag mindig ugyanazt a kertet adja
  function rng(seed){ let s = Math.max(1, Math.floor(seed || 1)) % 2147483647; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  // „lombcsomó”: kicsit szabálytalan, lapjaira tört gömb – n pont a gömbön (aranymetszés-spirál) + konvex burok ≈ 2n − 4 háromszög
  function blob(K, r, seed, n, jit){
    const R = rng(seed || 1), P = [], ga = Math.PI * (3 - Math.sqrt(5)); n = n || 14; jit = jit == null ? 0.18 : jit;
    for(let i = 0; i < n; i++){ const y = 1 - (i + 0.5) / n * 2, rad = Math.sqrt(1 - y * y), a = i * ga + R() * 0.6, k = r * (1 - jit / 2 + R() * jit);
      P.push([Math.cos(a) * rad * k, y * k, Math.sin(a) * rad * k]); }
    return K.hull(P);
  }
  // henger két pont között (ág, szár, láb): r0 az „a” végén, r1 a „b” végén
  function rod(m, K, a, b, r0, r1, seg, color){
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) || 1e-6;
    const th = Math.acos(Math.max(-1, Math.min(1, d[1] / L))) * 180 / Math.PI, ph = Math.atan2(d[0], d[2]) * 180 / Math.PI;
    m.add(K.cylinder(r1, r0, L, seg), { color, t:[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], r:[th, ph, 0] });
  }
  // lapos sokszög a vízszintes (XZ) síkban: pts = [[x, z], …]; hozzáadáskor r:[-90, 0, 0] fekteti le (vastagság Y irányú)
  const flat = (K, pts, th) => K.extrude(pts.map(([x, z]) => [x, -z]), th);
  // egyenletes szórás korongon (napraforgó-minta): i. pont N-ből, sugár R
  const spread = (i, N, R, rot) => { const d = Math.sqrt((i + 0.5) / N) * R, a = i * 2.39996 + (rot || 0); return [Math.sin(a) * d, Math.cos(a) * d]; };
  // pont egy gömb felszínén (a felső féltekén) – virág, bogyó a lombon
  const onBall = (c, r, u, v) => { const a = u * Math.PI * 2, e = 0.15 + v * 1.1; return [c[0] + Math.cos(a) * Math.cos(e) * r, c[1] + Math.sin(e) * r, c[2] + Math.sin(a) * Math.cos(e) * r]; };
  const H = { rng, blob, rod, flat, spread, onBall, seasonOf };

  // ================= NÖVÉNYEK =================
  // lomb-színek évszakonként: [világos, alap, sötét belső]
  const FOL = { tavasz:['grass:0', 'leaf:0', 'leaf:1'], nyar:['leaf:0', 'leaf:1', 'leaf:2'], osz:['honey:1', 'orange:1', 'orange:2'], tel:null };

  // FA – stage 0: csemete karóval · 1: fiatal fa (még karó mellett) · 2: lombos fa. Tavasszal virágpöttyök, ősszel színes lomb
  // és lehullott levelek, télen kopasz ágak hósapkával.
  function tree(K, o){
    o = o || {};
    const m = K.model(), st = Math.max(0, Math.min(2, o.stage == null ? 2 : o.stage | 0)), se = seasonOf(o), fol = FOL[se], R = rng(11 + st * 7);
    m.add(K.lathe([[0.46, 0], [0.4, 0.04], [0.16, 0.09], [0, 0.1]], 12), { color:'soil:1' });                      // tányér (földkupac)
    if(se === 'tel') m.add(K.lathe([[0.34, 0.05], [0.12, 0.1], [0, 0.11]], 10), { color:'white:1' });              // hó a kupacon
    // törzs + ágvégek (a lombcsomók közepe) szakaszonként
    const S = [
      { trunk:[[0.05, 0], [0.035, 0.1], [0.02, 0.95]], top:0.95, crowns:[[0.02, 1.0, 0.03, 0.2], [-0.13, 0.82, 0.05, 0.15], [0.14, 0.86, -0.02, 0.14], [0.03, 0.7, -0.12, 0.12], [-0.02, 1.2, 0, 0.13]] },
      { trunk:[[0.12, 0], [0.08, 0.1], [0.06, 1.2], [0.045, 1.5]], top:1.5, crowns:[[0, 1.8, 0, 0.5], [0.36, 1.56, 0.12, 0.36], [-0.34, 1.6, -0.1, 0.38], [0.05, 2.15, 0.05, 0.34], [-0.05, 1.5, 0.38, 0.3]] },
      { trunk:[[0.26, 0], [0.17, 0.12], [0.13, 0.5], [0.11, 1.5], [0.08, 1.95]], top:1.95, crowns:[[0, 2.35, 0, 0.72], [0.56, 2.05, 0.2, 0.54], [-0.52, 2.1, -0.16, 0.56], [0.12, 2.05, -0.55, 0.5], [-0.16, 2.12, 0.54, 0.5], [0.08, 2.9, 0.06, 0.52]] },
    ][st];
    m.add(K.lathe(S.trunk, st ? 10 : 6), { color:'wood:2' });
    if(st < 2){                                                                                                  // karó + kötés
      const hk = st ? 1.35 : 1.2;
      m.add(K.chamferBox(0.07, hk, 0.07, 0.015), { color:'wood:1', t:[0.16 + st * 0.06, hk / 2, -0.05] });
      m.add(K.box(0.2 + st * 0.06, 0.035, 0.04), { color:'wood:2', t:[0.08 + st * 0.03, hk * 0.62, -0.02], r:[0, -16, 0] });
    }
    if(fol){
      // ágak a lombba, aztán lombcsomók két-három tónusban (az alsók sötétebbek → térhatás)
      S.crowns.slice(1).forEach(c => st && rod(m, K, [0, S.top * 0.72, 0], [c[0] * 0.7, c[1] - 0.1, c[2] * 0.7], 0.05 + st * 0.02, 0.025, 6, 'wood:2'));
      S.crowns.forEach((c, i) => m.add(blob(K, c[3], 31 + i + st * 10, st ? 20 : 16), { color:i === 0 || i === 5 ? fol[1] : (i % 2 ? fol[0] : fol[st === 2 ? 2 : 1]), t:c.slice(0, 3) }));
      if(se === 'tavasz' && st) for(let i = 0; i < (st === 2 ? 22 : 12); i++){                                 // virágpöttyök
        const c = S.crowns[i % S.crowns.length]; m.add(blob(K, 0.055 + st * 0.01, 90 + i, 6), { color:'blossom:1', t:onBall(c, c[3] * 0.97, R(), R()) }); }
      if(se === 'osz') for(let i = 0; i < 9; i++){ const [x, z] = spread(i, 9, 0.62 + st * 0.12, 0.7);             // lehullott levelek
        m.add(blob(K, 0.07, 60 + i, 6), { color:i % 3 ? 'orange:2' : 'honey:1', t:[x, 0.03, z], s:[1, 0.22, 1] }); }
    }else{
      // TÉL: kopasz ágak – ág a lombcsomó irányába, a végén két gally, a villákban hó
      S.crowns.forEach((c, i) => {
        const base = [0, S.top * (0.6 + 0.08 * (i % 3)), 0], tip = [c[0] * 1.15, c[1] + c[3] * 0.3, c[2] * 1.15];
        if(i) rod(m, K, base, tip, 0.03 + st * 0.02, 0.012, 5, 'wood:2');
        const from = i ? tip : [0, S.top, 0];
        for(const k of [-1, 1]){ const tw = [from[0] + k * 0.18 * (st + 1) * 0.5 + (R() - 0.5) * 0.1, from[1] + 0.18 + st * 0.08, from[2] - k * 0.12 * (st * 0.5 + 0.5)];
          rod(m, K, from, tw, 0.014 + st * 0.004, 0.005, 4, 'wood:3'); }
        if(i && st) m.add(blob(K, 0.05 + st * 0.015, 70 + i, 6), { color:'white:1', t:[tip[0], tip[1] + 0.02, tip[2]], s:[1.3, 0.5, 1.3] });
      });
    }
    return m;
  }

  // SÖVÉNY (őshonos, pl. galagonya/kökény) az X tengely mentén egy mezőnyi hosszan – stage 0: frissen ültetett cserjék, 1: kifejlett.
  // Tavasszal fehér virág, ősszel sárguló lomb piros bogyókkal, télen ritkás ágak (néhány bogyó a madaraknak).
  function hedge(K, o){
    o = o || {};
    const m = K.model(), st = o.stage === 0 ? 0 : 1, se = seasonOf(o), fol = FOL[se], R = rng(17 + st);
    m.add(K.chamferBox(TILE - 0.02, 0.08, 0.72, 0.03), { color:'soil:1', t:[0, 0.04, 0] });                   // ültetősáv
    const plants = st ? [] : [[-0.45, 0.02], [0, -0.04], [0.45, 0.03]];
    if(st === 0) plants.forEach(([x, z], i) => {                                                               // fiatal cserjék
      rod(m, K, [x, 0.06, z], [x + 0.03, 0.34, z], 0.03, 0.02, 5, 'wood:2');
      if(fol) for(const [dx, dy, dz, r, c] of [[0, 0.42, 0, 0.22, 1], [0.1, 0.3, 0.06, 0.15, 0], [-0.1, 0.32, -0.05, 0.15, 2], [0, 0.6, 0, 0.13, 0]])
        m.add(blob(K, r, 40 + i * 5 + c, 12), { color:fol[c], t:[x + dx, dy, z + dz] });
      else for(const k of [-1, 0, 1]) rod(m, K, [x, 0.2, z], [x + k * 0.14, 0.52 + (k ? 0 : 0.1), z + k * 0.05], 0.018, 0.006, 4, 'wood:3');
    });
    if(st === 1){
      for(const x of [-0.5, -0.17, 0.17, 0.5]) rod(m, K, [x, 0.06, 0], [x * 0.8, 0.42, (R() - 0.5) * 0.1], 0.04, 0.03, 6, 'wood:2');   // tövek
      if(fol){
        m.add(K.chamferBox(1.24, 0.62, 0.46, 0.14), { color:fol[2], t:[0, 0.62, 0] });                          // sötét mag
        const tops = [];
        for(let i = 0; i < 5; i++) tops.push([-0.52 + i * 0.26, 0.98 + (i % 2) * 0.06, (R() - 0.5) * 0.08, 0.27]);
        for(const sz of [-1, 1]) for(let i = 0; i < 4; i++) tops.push([-0.47 + i * 0.31, 0.6, sz * 0.2, 0.25]);
        tops.forEach((c, i) => m.add(blob(K, c[3], 50 + i, 14), { color:i < 5 ? fol[i % 2] : fol[(i + 1) % 2], t:c.slice(0, 3) }));
        if(se === 'tavasz') for(let i = 0; i < 24; i++){ const c = tops[i % tops.length];                        // fehér virágok
          m.add(blob(K, 0.065, 80 + i, 6), { color:'white:1', t:onBall(c, c[3] * 0.98, R(), R() * 0.7), s:[1, 0.6, 1] }); }
        if(se === 'osz') for(let i = 0; i < 9; i++){ const c = tops[(i * 2) % tops.length], p = onBall(c, c[3], R(), R() * 0.6);   // bogyófürtök
          for(let k = 0; k < 3; k++) m.add(blob(K, 0.035, 120 + i * 3 + k, 6), { color:'red:1', t:[p[0] + (k - 1) * 0.04, p[1] - (k % 2) * 0.04, p[2] + 0.02] }); }
      }else{
        // TÉL: ritkás, kopasz vesszők legyezőszerűen, oldalgallyakkal; a végükön maradék bogyók (a madaraknak)
        for(let i = 0; i < 7; i++){ const x = -0.54 + i * 0.18, b = [x * 0.6, 0.08, (R() - 0.5) * 0.12], t = [x * 1.05 + (R() - 0.5) * 0.12, 0.95 + R() * 0.25, (R() - 0.5) * 0.36];
          rod(m, K, b, t, 0.026, 0.01, 4, 'wood:2');
          for(const f of [0.45, 0.7]){ const p = b.map((v, k) => v + (t[k] - v) * f), sd = i % 2 ? 1 : -1, q = [p[0] + sd * 0.16, p[1] + 0.18, p[2] + (R() - 0.5) * 0.2];
            rod(m, K, p, q, 0.012, 0.005, 3, 'wood:3'); if(f > 0.5 && i % 2) m.add(blob(K, 0.035, 140 + i, 6), { color:'red:1', t:q }); }
          if(i % 3 === 0) m.add(blob(K, 0.035, 160 + i, 6), { color:'red:1', t });
        }
        m.add(K.chamferBox(TILE - 0.06, 0.04, 0.66, 0.02), { color:'white:1', t:[0, 0.1, 0] });               // hóréteg a tövön
      }
    }
    return m;
  }

  // VIRÁGOS RÉT-FOLT: füves korong, fűcsomók, sok kis virág (tavasszal kevesebb, nyáron dús, ősszel magházak, télen száraz szárak)
  function meadow(K, o){
    const se = seasonOf(o), m = K.model(), R = rng(23);
    const base = { tavasz:'grass:1', nyar:'grass:1', osz:'grass:2', tel:'sage:1' }[se];
    const blade = { tavasz:'leaf:1', nyar:'leaf:1', osz:'honey:2', tel:'cardboard:1' }[se];
    m.add(K.cylinder(0.64, 0.67, 0.05, 10), { color:base, t:[0, 0.025, 0] });
    for(let i = 0; i < 11; i++){ const [x, z] = spread(i, 11, 0.56, 0.4);                                   // fűcsomók: 4 levél
      for(let k = 0; k < 4; k++){ const a = k * 1.57 + R(), h = 0.2 + R() * 0.14;
        rod(m, K, [x, 0.04, z], [x + Math.sin(a) * 0.09, 0.04 + h, z + Math.cos(a) * 0.09], 0.03, 0, 3, blade); } }
    const cols = { tavasz:['honey:1', 'white:1', 'honey:1', 'white:1'], nyar:['blossom:1', 'honey:1', 'white:1', 'purple:1'],
                   osz:['cardboard:0', 'purple:1', 'cardboard:0', 'honey:1'], tel:['cardboard:2', 'cardboard:2'] }[se];
    const N = { tavasz:10, nyar:20, osz:12, tel:9 }[se];
    for(let i = 0; i < N; i++){ const [x, z] = spread(i, N, 0.58, 1.9), h = 0.26 + R() * 0.22;             // virágok: szár + fej
      rod(m, K, [x, 0.04, z], [x + (R() - 0.5) * 0.06, h, z], 0.012, 0.009, 3, se === 'tel' ? 'cardboard:1' : 'leaf:1');
      m.add(blob(K, se === 'tel' ? 0.03 : 0.045, 200 + i, 6, 0.1), { color:cols[i % cols.length], t:[x, h + 0.02, z], s:[1, se === 'osz' || se === 'tel' ? 1.3 : 0.55, 1] });
    }
    if(se === 'tel') for(let i = 0; i < 4; i++){ const [x, z] = spread(i, 4, 0.45, 0.8);                  // hófoltok
      m.add(blob(K, 0.2, 230 + i, 10), { color:'white:1', t:[x, 0.05, z], s:[1.2, 0.2, 1] }); }
    return m;
  }

  // ÉVELŐÁGYÁS fa szegéllyel: levendula-szerű lila tüskék, sárga és fehér virágcsoportok (télen visszavágott tövek, hó)
  function perennials(K, o){
    const se = seasonOf(o), m = K.model(), R = rng(29), cb = K.chamferBox, S = 1.28;
    for(const [x, z, w, d] of [[0, S / 2, S + 0.08, 0.08], [0, -S / 2, S + 0.08, 0.08], [S / 2, 0, 0.08, S - 0.08], [-S / 2, 0, 0.08, S - 0.08]])
      m.add(cb(w, 0.16, d, 0.02), { color:'wood:1', t:[x, 0.08, z] });                                            // szegély
    m.add(K.box(S - 0.08, 0.1, S - 0.08), { color:'soil:1', t:[0, 0.05, 0] });
    const fol = { tavasz:'leaf:0', nyar:'leaf:1', osz:'leaf:2', tel:'cardboard:1' }[se], big = se === 'tavasz' ? 0.75 : 1;
    const groups = [ { c:[-0.34, -0.3], kind:'lav' }, { c:[0.3, -0.32], kind:'yel' }, { c:[-0.3, 0.3], kind:'wht' }, { c:[0.32, 0.3], kind:'lav' }, { c:[0.02, 0.02], kind:'yel' } ];
    groups.forEach((g, gi) => {
      const [gx, gz] = g.c;
      if(se === 'tel'){                                                                                          // visszavágott tövek
        for(let k = 0; k < 5; k++){ const a = k * 1.26; rod(m, K, [gx, 0.1, gz], [gx + Math.sin(a) * 0.08, 0.26, gz + Math.cos(a) * 0.08], 0.014, 0.01, 3, 'cardboard:1'); }
        m.add(blob(K, 0.16, 300 + gi, 8), { color:'white:1', t:[gx, 0.1, gz], s:[1.2, 0.3, 1.2] }); return;
      }
      m.add(blob(K, (g.kind === 'lav' ? 0.2 : 0.22) * big, 310 + gi, 12), { color:fol, t:[gx, 0.18 * big, gz], s:[1, 0.75, 1] });
      const n = se === 'tavasz' ? 3 : 6;
      for(let k = 0; k < n; k++){ const a = k * 2.4 + gi, d = 0.05 + (k % 3) * 0.05, x = gx + Math.sin(a) * d, z = gz + Math.cos(a) * d;
        if(g.kind === 'lav'){ const h = (0.42 + R() * 0.14) * big;                                               // levendula-tüske
          rod(m, K, [x, 0.2, z], [x + Math.sin(a) * 0.05, h, z + Math.cos(a) * 0.05], 0.008, 0.008, 3, fol);
          m.add(blob(K, 0.035, 330 + k, 6, 0.05), { color:se === 'osz' ? 'purple:2' : 'purple:1', t:[x + Math.sin(a) * 0.05, h + 0.02, z + Math.cos(a) * 0.05], s:[1, 2.4, 1] });
        }else{ const h = (0.34 + R() * 0.12) * big;                                                              // sárga / fehér tányérvirág
          rod(m, K, [x, 0.2, z], [x, h, z], 0.01, 0.008, 3, fol);
          const head = g.kind === 'yel' ? (se === 'osz' ? 'orange:1' : 'honey:1') : 'white:1';
          m.add(blob(K, 0.06, 350 + k, 7, 0.08), { color:head, t:[x, h, z], s:[1, 0.35, 1] });
          if(g.kind === 'wht') m.add(blob(K, 0.022, 370 + k, 6), { color:se === 'osz' ? 'orange:1' : 'honey:1', t:[x, h + 0.02, z] }); }
      }
    });
    return m;
  }

  // ================= VÍZ =================
  // KERTI TÓ kövekkel, náddal, gyékénnyel, tavirózsával – RÉSZEK: body (tömör) + water (a vízfelszín: a játék áttetszővé teszi)
  function pond(K){
    const body = K.model(), water = K.model(), R = rng(37);
    body.add(K.cylinder(0.5, 0.52, 0.03, 14), { color:'water:3', t:[0, 0.015, 0] });                          // mély meder (a víz alatt)
    for(let i = 0; i < 13; i++){ const a = i / 13 * Math.PI * 2, rr = 0.53 + (i % 2) * 0.03, r = 0.09 + R() * 0.04;   // kőperem
      body.add(blob(K, r, 400 + i, 10), { color:'steel:2', t:[Math.sin(a) * rr, r * 0.64, Math.cos(a) * rr], s:[1.2, 0.75, 1] }); }
    water.add(K.cylinder(0.5, 0.5, 0.02, 14), { color:'water:1', t:[0, 0.1, 0] });
    const pad = flat(K, [[0, 0], [0.06, 0.1], [0.11, 0.04], [0.12, -0.04], [0.08, -0.1], [0, -0.12], [-0.08, -0.1], [-0.12, -0.03], [-0.1, 0.06], [-0.05, 0.1]], 0.012);
    for(const [x, z, a, s] of [[0.14, 0.18, 20, 1], [-0.2, 0.08, 140, 0.85], [0.02, -0.12, 250, 1.1]])            // tavirózsa-levelek
      body.add(pad, { color:'leaf:0', t:[x, 0.118, z], r:[-90, a, 0], s:[s, s, 1] });
    for(let k = 0; k < 6; k++){ const a = k / 6 * Math.PI * 2;                                                   // tavirózsa-virág
      body.add(blob(K, 0.04, 420 + k, 6, 0.05), { color:'blossom:0', t:[0.14 + Math.sin(a) * 0.035, 0.15, 0.18 + Math.cos(a) * 0.035], s:[0.7, 0.6, 1.4], r:[0, a * 57.3, 0] }); }
    for(let i = 0; i < 9; i++){ const x = -0.38 + (i % 3) * 0.08 + R() * 0.04, z = -0.3 - Math.floor(i / 3) * 0.06, h = 0.55 + R() * 0.4;   // nád
      rod(body, K, [x, 0.08, z], [x - 0.04 + R() * 0.08, h, z - 0.03], 0.016, 0.004, 3, 'leaf:1');
      if(i % 3 === 0) body.add(K.cylinder(0.024, 0.024, 0.13, 6), { color:'chocolate:1', t:[x - 0.01, h - 0.14, z - 0.02] });   // gyékény-buzogány
    }
    return { body, water };
  }

  // ESŐVÍZGYŰJTŐ HORDÓ fa állványon, fedéllel, bordákkal, csappal, az ereszcső-darab a fedélhez vezet (terelővel)
  function barrel(K){
    const m = K.model(), cb = K.chamferBox;
    m.add(cb(0.72, 0.22, 0.72, 0.03), { color:'wood:1', t:[0, 0.11, 0] });                                      // állvány
    for(const x of [-0.2, 0, 0.2]) m.add(K.box(0.04, 0.02, 0.74), { color:'wood:2', t:[x, 0.225, 0] });
    m.add(K.lathe([[0.27, 0.23], [0.31, 0.3], [0.34, 0.7], [0.33, 1.1], [0.3, 1.22]], 14), { color:'leaf:1' });
    for(const y of [0.46, 0.96]) m.add(K.torus(0.345, 0.022, 14, 3), { color:'leaf:2', t:[0, y, 0] });           // bordák
    m.add(K.cylinder(0.33, 0.33, 0.06, 14), { color:'leaf:2', t:[0, 1.25, 0] });                                // fedél
    m.add(cb(0.2, 0.04, 0.05, 0.01), { color:'leaf:1', t:[0.05, 1.3, 0.12] });                                  // fedél-fogantyú
    m.add(K.cylinder(0.035, 0.035, 0.14, 8), { color:'steel:1', t:[0, 0.4, 0.37], r:[90, 0, 0] });              // csap
    m.add(K.cylinder(0.02, 0.02, 0.08, 6), { color:'steel:1', t:[0, 0.35, 0.43] });
    m.add(cb(0.1, 0.025, 0.03, 0.008), { color:'steel:1', t:[0, 0.46, 0.4] });                                 // csapfogantyú
    // ereszcső: függőlegesen fentről, terelődoboz, ferde könyök a fedélbe
    m.add(K.cylinder(0.055, 0.055, 0.8, 10), { color:'steel:2', t:[-0.28, 1.95, -0.3] });
    m.add(cb(0.15, 0.2, 0.15, 0.03), { color:'steel:2', t:[-0.28, 1.46, -0.3] });                               // terelő
    rod(m, K, [-0.28, 1.4, -0.3], [-0.1, 1.3, -0.1], 0.04, 0.04, 8, 'steel:2');
    m.add(K.cylinder(0.065, 0.065, 0.05, 10), { color:'steel:1', t:[-0.28, 2.1, -0.3] });                        // bilincs
    return m;
  }

  // KOMPOSZTLÁDA: deszkaláda sarokoszlopokkal, elöl alacsonyabb, benne barna halom friss zöld maradékkal és héjjal
  function compost(K){
    const m = K.model(), cb = K.chamferBox, W = 1.1, D = 1.0, R = rng(41);
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) m.add(cb(0.1, 0.9, 0.1, 0.02), { color:'wood:2', t:[sx * (W / 2 - 0.05), 0.45, sz * (D / 2 - 0.05)] });
    for(let i = 0; i < 4; i++){ const y = 0.12 + i * 0.2;                                                         // deszkák (hézaggal – szellőzik)
      m.add(K.box(W - 0.14, 0.13, 0.04), { color:'wood:1', t:[0, y, -D / 2 + 0.03] });
      for(const sx of [-1, 1]) m.add(K.box(0.04, 0.13, D - 0.14), { color:'wood:1', t:[sx * (W / 2 - 0.03), y, 0] });
      if(i < 2) m.add(K.box(W - 0.14, 0.13, 0.04), { color:'wood:1', t:[0, y, D / 2 - 0.03] });
    }
    m.add(K.box(W - 0.2, 0.3, D - 0.2), { color:'soil:1', t:[0, 0.15, 0] });                                   // halom alja
    for(const [x, z, r] of [[0, 0, 0.42], [0.22, -0.18, 0.3], [-0.22, 0.12, 0.3], [0.1, 0.24, 0.26]])
      m.add(blob(K, r, 500 + x * 10, 14), { color:'soil:1', t:[x, 0.42, z], s:[1.1, 0.62, 1.1] });
    for(let i = 0; i < 7; i++){ const [x, z] = spread(i, 7, 0.3, 0.5), y = 0.62 - Math.hypot(x, z) * 0.35;   // zöld maradék és narancshéj
      m.add(blob(K, 0.06 + R() * 0.03, 520 + i, 6), { color:i % 3 === 2 ? 'orange:1' : 'leaf:1', t:[x, y, z], s:[1.3, 0.35, 1], r:[0, R() * 180, 0] }); }
    return m;
  }

  // VETEMÉNYES magaságyás: elöl salátasor, középen répalevél, hátul paradicsom karóval. Tavasszal palánták, ősszel beérő termés,
  // télen takart (fátyolfólia-alagút és szalmatakarás).
  function vegbed(K, o){
    const se = seasonOf(o), m = K.model(), cb = K.chamferBox, W = 1.3, D = 0.9, R = rng(47);
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) m.add(cb(0.09, 0.5, 0.09, 0.02), { color:'wood:2', t:[sx * (W / 2 - 0.04), 0.25, sz * (D / 2 - 0.04)] });
    for(const y of [0.12, 0.34]){                                                                                // két deszkasor
      for(const sz of [-1, 1]) m.add(K.box(W - 0.1, 0.2, 0.05), { color:'wood:1', t:[0, y, sz * (D / 2 - 0.03)] });
      for(const sx of [-1, 1]) m.add(K.box(0.05, 0.2, D - 0.1), { color:'wood:1', t:[sx * (W / 2 - 0.03), y, 0] });
    }
    m.add(K.box(W - 0.12, 0.05, D - 0.12), { color:'soil:1', t:[0, 0.42, 0] });
    for(const x of [-0.4, 0, 0.4]) m.add(K.box(0.04, 1.0, 0.04), { color:'wood:2', t:[x, 0.9, -0.24] });        // paradicsomkarók
    if(se === 'tel'){
      const arch = []; for(let i = 0; i <= 8; i++){ const a = i / 8 * Math.PI; arch.push([Math.cos(a) * 0.38, Math.sin(a) * 0.3]); }
      m.add(K.extrude(arch, W - 0.16), { color:'white:2', t:[0, 0.44, 0.05], r:[0, 90, 0] });                   // fátyolfólia-alagút
      for(const x of [-0.45, 0, 0.45]) m.add(K.torus(0.39, 0.012, 10, 3), { color:'leaf:2', t:[x, 0.44, 0.05], r:[90, 90, 0], s:[1, 1, 0.8] });
      for(let i = 0; i < 5; i++) m.add(blob(K, 0.12, 600 + i, 8), { color:'cardboard:0', t:[-0.5 + i * 0.25, 0.46, -0.34], s:[1.2, 0.4, 0.6] });   // szalma
      return m;
    }
    const sm = se === 'tavasz' ? 0.45 : 1;
    for(let i = 0; i < 3; i++){ const x = -0.4 + i * 0.4;                                                         // saláta-rozetták
      m.add(blob(K, 0.15 * sm, 610 + i, 12), { color:se === 'osz' ? 'leaf:1' : 'leaf:0', t:[x, 0.48, 0.25], s:[1.2, 0.6, 1.2] });
      m.add(blob(K, 0.08 * sm, 620 + i, 8), { color:'leaf:1', t:[x, 0.52 + 0.04 * sm, 0.25] }); }
    for(let i = 0; i < 5; i++){ const x = -0.48 + i * 0.24;                                                      // répalevél-csokrok
      for(const k of [-1, 0, 1]) rod(m, K, [x, 0.44, 0], [x + k * 0.05, 0.44 + 0.2 * sm, k * 0.03], 0.018, 0, 3, 'leaf:1'); }
    for(let i = 0; i < 3; i++){ const x = -0.4 + i * 0.4;                                                         // paradicsom-tövek
      for(const [dy, r] of [[0.62, 0.16], [0.9, 0.14], [1.14, 0.1]]) if(se !== 'tavasz' || dy < 0.7)
        m.add(blob(K, r * sm, 630 + i * 3 + dy * 10, 10), { color:'leaf:1', t:[x + 0.06, (dy - 0.1) * (se === 'tavasz' ? 0.8 : 1), -0.2] });
      if(se !== 'tavasz') for(let k = 0; k < 3; k++)
        m.add(blob(K, 0.05, 660 + i * 3 + k, 8), { color:se === 'osz' && k === 1 ? 'orange:1' : 'tomato:1', t:[x + 0.12 - k * 0.06, 0.62 + k * 0.17, -0.1 + (k % 2) * 0.02] });
    }
    return m;
  }

  // ================= KERTI TÁRGYAK =================
  // ROVARHOTEL oszlopon: fa keret nyeregtetővel, 4 rekesz – üreges nádszálak, fúrt farönk-szelet, tobozok, kis rönkök
  function insectHotel(K){
    const m = K.model(), cb = K.chamferBox, W = 0.7, Hh = 0.72, y0 = 0.72, D = 0.3;
    m.add(cb(0.1, y0 + 0.02, 0.1, 0.02), { color:'wood:2', t:[0, (y0 + 0.02) / 2, -0.02] });                        // oszlop
    for(const [x, y, w, h] of [[0, y0, W, 0.05], [0, y0 + Hh, W, 0.05], [-W / 2, y0 + Hh / 2, 0.05, Hh + 0.05], [W / 2, y0 + Hh / 2, 0.05, Hh + 0.05], [0, y0 + Hh / 2, W, 0.04], [0, y0 + Hh / 2, 0.04, Hh]])
      m.add(cb(w, h, D, 0.012), { color:'wood:1', t:[x, y, 0] });                                                   // keret + osztók
    m.add(K.box(W, Hh, 0.03), { color:'wood:2', t:[0, y0 + Hh / 2, -D / 2 + 0.015] });                              // hátfal
    const a = 32, L = (W / 2 + 0.1) / Math.cos(a * Math.PI / 180);                                                   // nyeregtető
    for(const sx of [-1, 1]) m.add(cb(L, 0.05, D + 0.12, 0.012), { color:'wood:2', t:[sx * (W / 4 + 0.03), y0 + Hh + 0.02 + (W / 4) * Math.tan(a * Math.PI / 180), 0.02], r:[0, 0, -sx * a] });
    const zf = D / 2 - 0.01, q = [[-W / 4, y0 + Hh * 0.75], [W / 4, y0 + Hh * 0.75], [-W / 4, y0 + Hh * 0.25], [W / 4, y0 + Hh * 0.25]];
    // bal fent: nádszálak (3×3), sötét üreg a végükön
    for(let i = 0; i < 9; i++){ const x = q[0][0] + ((i % 3) - 1) * 0.1, y = q[0][1] + (Math.floor(i / 3) - 1) * 0.1;
      m.add(K.cylinder(0.045, 0.045, D - 0.04, 6), { color:'cardboard:1', t:[x, y, 0], r:[90, 0, 0] });
      m.add(K.cylinder(0.025, 0.025, 0.012, 6), { color:'dark:2', t:[x, y, zf - 0.01], r:[90, 0, 0] }); }
    // jobb fent: farönk-szelet fúrt lyukakkal
    m.add(K.cylinder(0.15, 0.15, D - 0.04, 10), { color:'wood:0', t:[q[1][0], q[1][1], 0], r:[90, 0, 0] });
    for(let i = 0; i < 5; i++){ const [dx, dy] = spread(i, 5, 0.1, 0.3);
      m.add(K.cylinder(0.018, 0.018, 0.012, 6), { color:'dark:2', t:[q[1][0] + dx, q[1][1] + dy, zf - 0.01], r:[90, 0, 0] }); }
    // bal lent: tobozok
    for(const [dx, dy] of [[-0.08, -0.07], [0.07, -0.07], [0, 0.07]]) m.add(blob(K, 0.075, 700 + dx * 100, 8), { color:'chocolate:1', t:[q[2][0] + dx, q[2][1] + dy, 0.02], s:[0.9, 0.9, 1.3] });
    // jobb lent: kis rönkök
    for(const [dx, dy] of [[-0.08, -0.08], [0.08, -0.08], [0, 0.06]]){
      m.add(K.cylinder(0.075, 0.075, D - 0.06, 6), { color:'wood:0', t:[q[3][0] + dx, q[3][1] + dy, 0], r:[90, 0, 0] });
      m.add(K.cylinder(0.02, 0.02, 0.012, 6), { color:'dark:2', t:[q[3][0] + dx, q[3][1] + dy, zf - 0.02], r:[90, 0, 0] }); }
    return m;
  }

  // MADÁRITATÓ: kő talp, karcsú láb, sekély tál peremmel, moha a tövén – RÉSZEK: body + water (a játék áttetszővé teheti)
  function birdBath(K){
    const body = K.model(), water = K.model();
    body.add(K.lathe([[0.24, 0], [0.24, 0.06], [0.16, 0.12], [0.08, 0.2], [0.065, 0.62], [0.09, 0.7], [0.13, 0.74]], 12), { color:'steel:2' });
    body.add(K.lathe([[0.13, 0.72], [0.28, 0.8], [0.38, 0.9], [0.4, 0.95]], 14), { color:'steel:2' });              // tál kívül
    body.add(K.lathe([[0.37, 0.95], [0.26, 0.87], [0.001, 0.84]], 14), { color:'steel:3', s:[-1, 1, 1] });           // tál belül (befelé néz)
    body.add(K.torus(0.39, 0.03, 14, 4), { color:'steel:1', t:[0, 0.95, 0] });                                      // perem
    body.add(K.torus(0.24, 0.02, 12, 3), { color:'steel:1', t:[0, 0.06, 0] });
    for(const [x, z, r] of [[0.2, 0.12, 0.08], [-0.16, 0.18, 0.07], [0.05, -0.23, 0.07]]) body.add(blob(K, r, 750 + x * 10, 8), { color:'grass:1', t:[x, 0.04, z], s:[1.3, 0.5, 1.3] });
    water.add(K.cylinder(0.34, 0.34, 0.015, 14), { color:'water:1', t:[0, 0.915, 0] });
    return { body, water };
  }

  // KERTI FAPAD: öntöttvas oldallábak, léces ülőke és háttámla, karfa
  function bench(K){
    const m = K.model(), cb = K.chamferBox, L = 1.3, y = 0.6;
    const side = K.extrude([[0.24, 0], [0.16, 0], [0.12, 0.3], [-0.16, 0.3], [-0.2, 0], [-0.28, 0], [-0.22, 0.34], [-0.3, 0.98], [-0.24, 0.98], [-0.16, 0.6], [0.2, 0.6], [0.2, 0.52], [0.16, 0.38]], 0.06);
    for(const sx of [-1, 1]){
      m.add(side, { color:'dark:1', t:[sx * (L / 2 - 0.06), 0, 0], r:[0, -90, 0] });                                  // oldalláb (profil Z mentén)
      m.add(cb(0.08, 0.05, 0.5, 0.015), { color:'wood:1', t:[sx * (L / 2 - 0.06), 0.8, -0.01] });                    // karfa
      m.add(K.box(0.05, 0.2, 0.05), { color:'dark:1', t:[sx * (L / 2 - 0.06), 0.7, 0.18] });
    }
    for(let i = 0; i < 4; i++) m.add(cb(L, 0.05, 0.1, 0.015), { color:i % 2 ? 'wood:0' : 'wood:1', t:[0, y + 0.02, 0.17 - i * 0.12] });   // ülőlécek
    for(let i = 0; i < 3; i++) m.add(cb(L, 0.1, 0.045, 0.015), { color:i % 2 ? 'wood:0' : 'wood:1', t:[0, 0.74 + i * 0.13, -0.2 - i * 0.025], r:[-12, 0, 0] });   // háttámla
    for(const sx of [-1, 1]) for(const yy of [0.62, 0.9]) m.add(K.cylinder(0.018, 0.018, 0.02, 6), { color:'steel:1', t:[sx * (L / 2 - 0.02), yy, -0.1 + (yy > 0.7 ? -0.12 : 0.1)], r:[0, 0, 90] });   // csavarfejek
    return m;
  }

  // TÉRKŐ egy mezőnyi: 3 × 3 kissé elcsúszott lap két kőárnyalatban, a hézagban moha
  function path(K){
    const m = K.model(), R = rng(53), n = 3, c = TILE / n;
    m.add(K.box(TILE, 0.02, TILE), { color:'soil:0', t:[0, 0.01, 0] });                                           // hézag-homok
    for(let i = 0; i < n * n; i++){ const x = -TILE / 2 + c * ((i % n) + 0.5), z = -TILE / 2 + c * (Math.floor(i / n) + 0.5);
      m.add(K.chamferBox(c - 0.05 - R() * 0.03, 0.06, c - 0.05 - R() * 0.03, 0.02), { color:(i * 5) % 3 ? 'cream:2' : 'steel:1', t:[x + (R() - 0.5) * 0.02, 0.04, z + (R() - 0.5) * 0.02], r:[0, (R() - 0.5) * 5, 0] }); }
    for(let i = 0; i < 6; i++){ const x = -TILE / 2 + c * (1 + (i % 2)), z = -TILE / 2 + c * (0.4 + i * 0.4);        // moha a hézagokban
      m.add(blob(K, 0.05, 800 + i, 6), { color:'grass:1', t:[i < 3 ? x : z, 0.04, i < 3 ? z : x], s:[1.4, 0.5, 1] }); }
    return m;
  }

  // A ZÖLDI CSALÁD HÁZA – kert felőli homlokzat (+Z): lábazat, falak, oromfalak, cseréptető gerinccel, kémény, zöld ajtó előtetővel,
  // ablakok spalettával és virágládával, eresz és ereszcső. opts.w × opts.h mező (alap 2 × 2).
  function house(K, o){
    o = o || {};
    const w = Math.max(1, o.w | 0 || 2), h = Math.max(1, o.h | 0 || 2), W = w * TILE - 0.04, D = h * TILE - 0.04, Hw = 3.6, cb = K.chamferBox, m = K.model();
    const rise = Math.min(2.2, D * 0.55), eave = 0.32, F = D / 2, a = Math.atan2(rise, D / 2);
    m.add(cb(W, 0.34, D, 0.04), { color:'steel:2', t:[0, 0.17, 0] });                                             // lábazat
    m.add(cb(W - 0.08, Hw - 0.3, D - 0.08, 0.06), { color:'cream:1', t:[0, 0.3 + (Hw - 0.3) / 2, 0] });            // falak
    const gable = K.extrude([[-D / 2 + 0.06, 0], [D / 2 - 0.06, 0], [0, rise - 0.08]], 0.12);
    for(const sx of [-1, 1]) m.add(gable, { color:'cream:1', t:[sx * (W / 2 - 0.12), Hw - 0.02, 0], r:[0, 90, 0] });   // oromfalak
    const run = D / 2 + eave, L = run / Math.cos(a) + 0.04, th = 0.16;
    for(const sz of [-1, 1]){                                                                                         // tetősíkok + cserépsorok
      const cz = sz * run / 2 + sz * Math.sin(a) * th / 2, cy = Hw + rise - (run / 2) * Math.tan(a) + Math.cos(a) * th / 2;
      m.add(cb(W + 0.5, th, L, 0.04), { color:'tomato:2', t:[0, cy, cz], r:[sz * a * 180 / Math.PI, 0, 0] });
      for(let k = 1; k <= 3; k++){ const s = run * k / 4, y = Hw + rise - s * Math.tan(a) + Math.cos(a) * (th + 0.02), z = sz * (s + Math.sin(a) * (th + 0.02));
        m.add(K.box(W + 0.5, 0.05, 0.08), { color:'tomato:2', t:[0, y, z], r:[sz * a * 180 / Math.PI, 0, 0] }); }
    }
    m.add(K.box(W + 0.56, 0.17, 0.17), { color:'tomato:2', t:[0, Hw + rise + 0.1, 0], r:[45, 0, 0] });              // gerinc
    const chX = W * 0.28, chZ = -D * 0.2, chY = Hw + rise - Math.abs(chZ) * Math.tan(a);                               // kémény
    m.add(cb(0.42, 1.1, 0.42, 0.03), { color:'steel:2', t:[chX, chY + 0.25, chZ] });
    m.add(cb(0.52, 0.1, 0.52, 0.02), { color:'steel:2', t:[chX, chY + 0.82, chZ] });
    // ajtó (egy mezős háznál középen), mellette az ablakok
    const dX = w === 1 ? 0 : -W / 2 + 0.85, nWin = Math.max(0, w - 1);
    m.add(cb(1.12, 2.66, 0.1, 0.03), { color:'wood:1', t:[dX, 0.3 + 1.33, F] });                                     // ajtótok
    m.add(cb(0.92, 2.48, 0.08, 0.02), { color:'leaf:1', t:[dX, 0.3 + 1.24, F + 0.04] });                              // ajtólap
    for(const y of [0.95, 2.0]) m.add(cb(0.66, 0.66, 0.04, 0.02), { color:'leaf:1', t:[dX, 0.3 + y, F + 0.09] });   // betétek
    m.add(K.sphere(0.05, 8, 4), { color:'steel:2', t:[dX + 0.32, 1.5, F + 0.13] });                                   // kilincsgomb
    m.add(cb(1.3, 0.14, 0.5, 0.03), { color:'steel:2', t:[dX, 0.07, F + 0.22] });                                     // lépcső
    m.add(cb(1.36, 0.08, 0.5, 0.02), { color:'tomato:2', t:[dX, 3.14, F + 0.22], r:[14, 0, 0] });                     // előtető
    for(const sx of [-1, 1]) m.add(K.box(0.06, 0.26, 0.4), { color:'wood:1', t:[dX + sx * 0.6, 2.98, F + 0.18] });
    const x0 = dX + 1.27, x1 = W / 2 - 0.7;
    for(let i = 0; i < nWin; i++){ const x = nWin === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (nWin - 1), y = 1.95;
      m.add(cb(0.84, 1.04, 0.1, 0.03), { color:'wood:1', t:[x, y, F] });                                                // ablakkeret
      m.add(K.box(0.66, 0.86, 0.04), { color:'glass:1', t:[x, y, F + 0.04] });                                           // üveg
      m.add(K.box(0.05, 0.86, 0.05), { color:'wood:1', t:[x, y, F + 0.06] }); m.add(K.box(0.66, 0.05, 0.05), { color:'wood:1', t:[x, y + 0.08, F + 0.06] });
      for(const sx of [-1, 1]) m.add(cb(0.28, 1.04, 0.05, 0.015), { color:'leaf:1', t:[x + sx * 0.58, y, F + 0.02] });   // spaletta
      m.add(cb(0.96, 0.06, 0.16, 0.02), { color:'steel:2', t:[x, y - 0.56, F + 0.07] });                                 // párkány
      m.add(cb(0.8, 0.18, 0.2, 0.03), { color:'wood:1', t:[x, y - 0.68, F + 0.14] });                                    // virágláda
      for(let k = 0; k < 4; k++){ m.add(blob(K, 0.11, 850 + i * 4 + k, 8), { color:'leaf:1', t:[x - 0.28 + k * 0.19, y - 0.54, F + 0.15] });
        m.add(blob(K, 0.045, 870 + i * 4 + k, 6), { color:'tomato:2', t:[x - 0.25 + k * 0.19, y - 0.44, F + 0.2] }); }
    }
    // eresz a homlokzat előtt + ereszcső a jobb sarkon (ide jöhet az esővízgyűjtő hordó)
    const gy = Hw - eave * Math.tan(a) - 0.04, gz = F + eave - 0.04;
    m.add(K.cylinder(0.07, 0.07, W + 0.46, 8), { color:'steel:2', t:[0, gy, gz], r:[0, 0, 90] });
    rod(m, K, [W / 2 - 0.12, gy, gz], [W / 2 - 0.12, gy - 0.3, F + 0.1], 0.045, 0.045, 8, 'steel:2');
    m.add(K.cylinder(0.045, 0.045, gy - 0.5, 8), { color:'steel:2', t:[W / 2 - 0.12, (gy - 0.3 + 0.2) / 2, F + 0.1] });
    rod(m, K, [W / 2 - 0.12, 0.22, F + 0.1], [W / 2 - 0.12, 0.08, F + 0.28], 0.045, 0.05, 8, 'steel:2');
    return m;
  }

  // FA TERASZ asztallal, két székkel (párnával) – opts.w × opts.h mező (alap 2 × 1); a deszkák X irányúak
  function terrace(K, o){
    o = o || {};
    const w = Math.max(1, o.w | 0 || 2), h = Math.max(1, o.h | 0 || 1), W = w * TILE - 0.04, D = h * TILE - 0.04, cb = K.chamferBox, m = K.model(), y0 = 0.18;
    m.add(cb(W, 0.12, D, 0.03), { color:'wood:2', t:[0, 0.06, 0] });                                             // gerendakeret
    const n = Math.max(3, Math.round(D / 0.2)), pw = D / n;
    for(let i = 0; i < n; i++) m.add(K.box(W - 0.02, 0.06, pw - 0.03), { color:i % 2 ? 'wood:0' : 'wood:1', t:[0, 0.15, -D / 2 + pw * (i + 0.5)] });
    m.add(K.cylinder(0.4, 0.4, 0.05, 14), { color:'sage:2', t:[0, y0 + 1.0, 0] });                                // asztal
    m.add(K.cylinder(0.045, 0.06, 0.98, 8), { color:'sage:2', t:[0, y0 + 0.5, 0] });
    for(const r of [0, 90]) m.add(cb(0.6, 0.05, 0.08, 0.015), { color:'sage:2', t:[0, y0 + 0.03, 0], r:[0, r + 45, 0] });
    m.add(K.lathe([[0.07, y0 + 1.03], [0.09, y0 + 1.17]], 10), { color:'honey:1' });                               // cserép az asztalon
    m.add(blob(K, 0.12, 900, 10), { color:'leaf:1', t:[0, y0 + 1.25, 0] });
    const cx = Math.min(W / 2 - 0.3, 0.72);
    for(const sx of [-1, 1]){                                                                                         // székek az asztal felé nézve
      const x = sx * cx;
      m.add(cb(0.44, 0.06, 0.44, 0.015), { color:'sage:2', t:[x, y0 + 0.6, 0] });
      m.add(cb(0.38, 0.06, 0.38, 0.03), { color:'honey:1', t:[x, y0 + 0.66, 0] });                                   // párna
      for(const dx of [-1, 1]) for(const dz of [-1, 1]) m.add(K.box(0.05, 0.6, 0.05), { color:'sage:2', t:[x + dx * 0.18, y0 + 0.3, dz * 0.18] });
      m.add(cb(0.05, 0.56, 0.44, 0.015), { color:'sage:2', t:[x + sx * 0.21, y0 + 0.92, 0], r:[0, 0, -sx * 8] });   // háttámla
    }
    return m;
  }

  // KERÍTÉS a kiskapu stílusában (natúr fa, hegyes lécek, oszlopsapka) az X tengely mentén; len = hossz (alap 1 mező)
  const picket = K => K.extrude([[-0.07, 0], [0.07, 0], [0.07, 0.86], [0, 0.98], [-0.07, 0.86]], 0.04);
  function fence(K, len){
    len = len || TILE;
    const m = K.model(), np = Math.max(1, Math.round(len / TILE)), n = Math.max(2, Math.round(len / 0.24)), pk = picket(K);
    for(let i = 0; i <= np; i++){ const x = -len / 2 + i * len / np;
      m.add(K.chamferBox(0.14, 1.2, 0.14, 0.03), { color:'wood:2', t:[x, 0.6, -0.02] });
      m.add(K.cylinder(0, 0.11, 0.1, 4), { color:'wood:0', t:[x, 1.25, -0.02], r:[0, 45, 0] }); }
    for(const y of [0.28, 0.8]) m.add(K.chamferBox(len, 0.08, 0.05, 0.015), { color:'wood:2', t:[0, y, -0.06] });
    for(let i = 0; i < n; i++) m.add(pk, { color:'wood:1', t:[-len / 2 + (i + 0.5) * len / n, 0.04, 0] });
    return m;
  }
  // KISKAPU két oszloppal: léces kapuszárny Z-merevítővel, zsanér, retesz (a nyílás 1 mező széles)
  function gate(K){
    const m = K.model(), cb = K.chamferBox, half = 0.62, pk = picket(K);
    for(const sx of [-1, 1]){
      m.add(cb(0.18, 1.42, 0.18, 0.04), { color:'wood:2', t:[sx * half, 0.71, 0] });
      m.add(K.cylinder(0, 0.14, 0.13, 4), { color:'wood:0', t:[sx * half, 1.485, 0], r:[0, 45, 0] });
      m.add(cb(0.22, 0.05, 0.22, 0.015), { color:'wood:0', t:[sx * half, 1.43, 0] });
    }
    for(const y of [0.3, 0.86]) m.add(cb(1.0, 0.1, 0.05, 0.02), { color:'wood:2', t:[0, y, -0.05] });                // kapuszárny keresztlécei
    rod(m, K, [-0.45, 0.33, -0.05], [0.45, 0.83, -0.05], 0.035, 0.035, 4, 'wood:2');                                // merevítő
    for(let i = 0; i < 5; i++) m.add(pk, { color:'wood:1', t:[-0.4 + i * 0.2, 0.08, 0] });
    for(const y of [0.3, 0.86]) m.add(K.box(0.16, 0.06, 0.07), { color:'dark:1', t:[-0.5, y, -0.03] });              // zsanér
    m.add(cb(0.14, 0.05, 0.05, 0.01), { color:'steel:1', t:[0.5, 0.78, 0.04] });                                    // retesz
    m.add(K.torus(0.04, 0.012, 8, 3), { color:'steel:1', t:[0.46, 0.72, 0.07], r:[90, 0, 0] });
    return m;
  }

  const EK_MODELS = Object.assign(root.EK_MODELS || {}, { TILE, SEASONS, tree, hedge, meadow, perennials, pond, barrel, compost, vegbed, insectHotel, birdBath, bench, path, house, terrace, fence, gate, _h:H });
  root.EK_MODELS = EK_MODELS;                                                  // böngészőben (és Node-ban is) globális
  if(typeof module !== 'undefined' && module.exports) module.exports = EK_MODELS;
})(typeof window !== 'undefined' ? window : globalThis);
