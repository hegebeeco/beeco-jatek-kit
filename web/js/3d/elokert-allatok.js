// ============================================================
//  ÉLŐ KERT – ÁLLATOK (B szint, kicsik: 0,15–0,5 egység; cukik, egyszerű pötty-szemmel). Az EK_MODELS-be kerülnek.
//
//  Földön járók (ladybird, hedgehog, frog, lizard): talp y = 0, az orr +Z felé.
//  Repülők (bee, butterfly, bird, bat): RÉSZEK { body, wingL, wingR, foot } – az origó a SZÁRNY-ZSANÉR (a test hossztengelye),
//    így a játék a szárnyakat egyszerűen a Z tengely körül forgatva csapkodtatja (wingL: +, wingR: − irányba nyílik).
//    foot = a legalsó pont magassága (negatív): ha a játék leülteti az állatot, y − foot magasra teszi.
//    A madár szárnya nyugalomban a testére simul; kb. 80°-os Z-forgatással tárul ki.
//  Betöltési sorrend: 3d/elokert-modellek.js UTÁN (a segédeit használja: EK_MODELS._h). Node-ban require is elég.
// ============================================================
(function(root){
  const EK = root.EK_MODELS || (typeof require === 'function' ? require('./elokert-modellek.js') : null);
  const { blob, rod, flat } = EK._h;
  const ell = (cx, cz, a, b, n) => { const p = []; for(let i = 0; i < n; i++){ const t = i / n * Math.PI * 2; p.push([cx + Math.cos(t) * a, cz + Math.sin(t) * b]); } return p; };
  // pötty-szem: fehér + sötét pupilla (sx = oldal), dir = a nézés iránya (+Z)
  function eyes(m, K, x, y, z, r, white){
    for(const sx of [-1, 1]){
      if(white) m.add(K.sphere(r, 8, 5), { color:'white:1', t:[sx * x, y, z] });
      m.add(K.sphere(white ? r * 0.55 : r, 6, 4), { color:'dark:3', t:[sx * (x + (white ? r * 0.25 : 0)), y + (white ? r * 0.15 : 0), z + (white ? r * 0.6 : 0)] });
    }
  }
  // szárnypár: a sokszöget (x ≥ 0 oldalra rajzolva) tükrözi, lapra fekteti, tilt fokkal megemeli; layers = [[pontok, szín, y-eltolás, nagyítás], …]
  function wings(K, layers, tilt, thick){
    const out = {};
    for(const [name, sx] of [['wingL', 1], ['wingR', -1]]){
      const w = K.model();
      for(const [pts, color, dy, k] of layers) w.add(flat(K, pts.map(([x, z]) => [sx * x * (k || 1), z * (k || 1)]), thick), { color, t:[0, dy || 0, 0], r:[-90, 0, sx * tilt] });
      out[name] = w;
    }
    return out;
  }

  // MÉHECSKE: csíkos, pihés test, sötét fej nagy szemekkel, csáp, fullánk, áttetsző szárnyak
  function bee(K){
    const body = K.model(), cy = -0.035, cz = -0.01, a = 0.0675;
    body.add(K.sphere(0.05, 10, 6), { color:'honey:1', t:[0, cy, cz], s:[1, 0.95, 1.35] });
    for(const dz of [0.005, -0.03]){ const r = 0.05 * Math.sqrt(1 - (dz / a) ** 2);                               // csíkok
      body.add(K.torus(r * 0.97, 0.012, 12, 3), { color:'dark:1', t:[0, cy, cz + dz], r:[90, 0, 0], s:[1, 1, 0.95] }); }
    body.add(K.cylinder(0, 0.012, 0.03, 5), { color:'dark:1', t:[0, cy, cz - a - 0.012], r:[-90, 0, 0] });       // fullánk
    body.add(K.sphere(0.036, 8, 6), { color:'dark:1', t:[0, cy + 0.008, 0.07] });                                  // fej
    eyes(body, K, 0.018, cy + 0.016, 0.095, 0.013, true);
    for(const sx of [-1, 1]){ rod(body, K, [sx * 0.012, cy + 0.04, 0.08], [sx * 0.03, cy + 0.075, 0.11], 0.004, 0.003, 3, 'dark:1');
      body.add(K.sphere(0.007, 5, 3), { color:'dark:1', t:[sx * 0.03, cy + 0.077, 0.112] }); }
    for(const z of [0.02, -0.02]) for(const sx of [-1, 1]) rod(body, K, [sx * 0.02, cy - 0.035, cz + z], [sx * 0.035, cy - 0.065, cz + z], 0.004, 0.003, 3, 'dark:1');   // lábak
    return Object.assign({ body, foot:cy - 0.066 }, wings(K, [[ell(0.05, -0.012, 0.05, 0.028, 10), 'glass:0'], [ell(0.035, -0.045, 0.032, 0.018, 8), 'glass:1', -0.002]], 14, 0.004));
  }

  // PILLANGÓ (pl. nappali pávaszem-szerű, narancs szárny sötét szegéllyel, fehér pöttyökkel)
  function butterfly(K){
    const body = K.model();
    body.add(K.sphere(0.014, 6, 5), { color:'dark:1', t:[0, 0, -0.01], s:[1, 1, 5] });
    body.add(K.sphere(0.017, 8, 5), { color:'dark:1', t:[0, 0.004, 0.068] });
    for(const sx of [-1, 1]){ rod(body, K, [sx * 0.006, 0.012, 0.075], [sx * 0.03, 0.04, 0.13], 0.003, 0.002, 3, 'dark:1');
      body.add(K.sphere(0.007, 5, 3), { color:'dark:1', t:[sx * 0.03, 0.041, 0.132] }); }
    eyes(body, K, 0.012, 0.008, 0.078, 0.006, true);
    const fore = [[0.008, 0.025], [0.05, 0.085], [0.115, 0.085], [0.135, 0.035], [0.1, -0.005], [0.008, -0.005]];
    const hind = [[0.008, -0.005], [0.075, -0.015], [0.095, -0.06], [0.065, -0.105], [0.02, -0.075]];
    const spots = [...ell(0.105, 0.055, 0.012, 0.012, 6)], spot2 = ell(0.07, -0.05, 0.01, 0.01, 6);
    return Object.assign({ body, foot:-0.02 }, wings(K, [
      [fore, 'dark:1', -0.002, 1.07], [hind, 'dark:1', -0.002, 1.07],                                              // sötét szegély (nagyobb, alatta)
      [fore, 'orange:1', 0], [hind, 'orange:1', 0], [ell(0.045, 0.02, 0.03, 0.02, 7), 'honey:0', 0.002],
      [spots, 'white:1', 0.003], [spot2, 'white:1', 0.003] ], 22, 0.003));
  }

  // KATICA: piros kupola hét fekete pöttyel, fekete fej fehér szemfolttal, hat láb
  function ladybird(K){
    const m = K.model(), R = 0.056, zs = 1.15, y0 = 0.014;
    m.add(K.cylinder(0.05, 0.045, 0.014, 10), { color:'dark:3', t:[0, 0.009, 0], s:[1, 1, zs] });
    m.add(K.lathe([[0.056, y0], [0.052, y0 + 0.022], [0.04, y0 + 0.04], [0.022, y0 + 0.052], [0, y0 + 0.056]], 12), { color:'red:1', s:[1, 1, zs] });
    for(const [x, z, r] of [[0, 0.035, 0.012], [0.028, 0.02, 0.01], [-0.028, 0.02, 0.01], [0.032, -0.02, 0.011], [-0.032, -0.02, 0.011], [0.014, -0.045, 0.009], [-0.014, -0.045, 0.009]]){
      const zz = z / zs, h = Math.sqrt(Math.max(0, R * R - x * x - zz * zz)), n = [x / R, h / R, zz / R];              // pötty a kupola normálisa mentén
      const th = Math.acos(n[1]) * 180 / Math.PI, ph = Math.atan2(n[0], n[2]) * 180 / Math.PI;
      m.add(K.sphere(r, 8, 4), { color:'dark:3', t:[x - n[0] * r * 0.1, y0 + h - n[1] * r * 0.1, z - n[2] * r * 0.1], s:[1, 0.4, 1], r:[th, ph, 0] }); }
    m.add(blob(K, 0.012, 1010, 6), { color:'red:0', t:[0.015, y0 + 0.05, 0.02], s:[1.4, 0.3, 0.8] });              // fényfolt
    m.add(K.sphere(0.026, 8, 5), { color:'dark:3', t:[0, 0.024, 0.066], s:[1, 0.8, 0.9] });                       // fej
    eyes(m, K, 0.013, 0.032, 0.083, 0.007, true);
    for(const z of [-0.025, 0, 0.025]) for(const sx of [-1, 1]) rod(m, K, [sx * 0.04, 0.01, z], [sx * 0.065, 0.001, z + 0.008], 0.004, 0.003, 3, 'dark:3');   // lábak
    return m;
  }

  // MADÁR (vörösbegy): barna hát, narancs mell és arc, fehéres has, sötét csőr, fölfelé álló farok, vékony lábak
  function bird(K){
    const body = K.model(), by = -0.03;
    body.add(K.sphere(0.075, 10, 7), { color:'wood:2', t:[0, by, 0], s:[0.9, 0.85, 1.2] });
    body.add(K.sphere(0.058, 8, 6), { color:'orange:1', t:[0, by - 0.004, 0.045], s:[0.95, 1, 0.8] });           // mell
    body.add(K.sphere(0.045, 8, 5), { color:'cream:1', t:[0, by - 0.035, 0.005], s:[1, 0.7, 1.2] });             // has
    body.add(K.sphere(0.048, 10, 6), { color:'wood:2', t:[0, 0.03, 0.07] });                                       // fej
    body.add(K.sphere(0.04, 8, 5), { color:'orange:1', t:[0, 0.018, 0.09], s:[1, 1, 0.9] });                     // arc
    body.add(K.cylinder(0, 0.012, 0.036, 6), { color:'dark:1', t:[0, 0.024, 0.138], r:[90, 0, 0] });             // csőr
    eyes(body, K, 0.032, 0.042, 0.1, 0.009, false);
    body.add(flat(K, [[-0.028, 0], [0.028, 0], [0.042, -0.1], [0, -0.09], [-0.042, -0.1]], 0.008), { color:'chocolate:0', t:[0, by + 0.01, -0.075], r:[-68, 0, 0] });   // farok
    for(const sx of [-1, 1]){ rod(body, K, [sx * 0.022, by - 0.055, 0], [sx * 0.024, -0.125, 0.008], 0.005, 0.004, 4, 'dark:1');
      body.add(K.box(0.01, 0.006, 0.035), { color:'dark:1', t:[sx * 0.024, -0.127, 0.02] }); }
    const w = [[0, 0.04], [0.05, 0.055], [0.1, 0.03], [0.12, -0.02], [0.09, -0.06], [0.04, -0.07], [0, -0.04]];
    const out = { body, foot:-0.13 };
    for(const [name, sx] of [['wingL', 1], ['wingR', -1]]){ const g = K.model();
      g.add(flat(K, w.map(([x, z]) => [sx * x, z]), 0.01), { color:'chocolate:0', t:[sx * 0.04, -0.005, -0.01], r:[-90, 0, -sx * 80] });
      g.add(flat(K, w.slice(0, 4).map(([x, z]) => [sx * x * 0.7, z * 0.8 + 0.01]), 0.012), { color:'wood:2', t:[sx * 0.045, -0.004, -0.008], r:[-90, 0, -sx * 80] });   // fedőtollak
      out[name] = g; }
    return out;
  }

  // SÜN: tüskés hát (sötét tüskék világos véggel váltakozva), világos arc hegyes orral, fekete orr és szem, kis lábak
  function hedgehog(K){
    const m = K.model(), c = [0, 0.1, -0.02], rx = 0.13, ry = 0.094, rz = 0.175;
    m.add(K.sphere(0.13, 10, 7), { color:'chocolate:0', t:c, s:[1, 0.72, 1.35] });
    let n = 0;
    for(const [e, cnt] of [[0.2, 16], [0.62, 14], [1.0, 10], [1.35, 5]]) for(let i = 0; i < cnt; i++){          // tüskék sorokban
      const a = i / cnt * Math.PI * 2 + e, cx = Math.cos(e) * Math.sin(a), cz = Math.cos(e) * Math.cos(a), sy = Math.sin(e);
      if(cz > 0.55 && e < 1.2) continue;                                                                           // az arc szabadon marad
      const p = [c[0] + cx * rx * 0.92, c[1] + sy * ry * 0.92, c[2] + cz * rz * 0.92], d = [cx, sy + 0.25, cz - 0.55], L = Math.hypot(...d);
      rod(m, K, p, [p[0] + d[0] / L * 0.085, p[1] + d[1] / L * 0.085, p[2] + d[2] / L * 0.085], 0.02, 0, 4, n++ % 3 ? 'chocolate:1' : 'cream:2');
    }
    m.add(K.sphere(0.07, 8, 6), { color:'cream:2', t:[0, 0.085, 0.12], s:[0.95, 0.85, 1] });                     // arc
    m.add(K.cylinder(0.014, 0.048, 0.09, 8), { color:'cream:2', t:[0, 0.075, 0.2], r:[90, 0, 0] });              // orr
    m.add(K.sphere(0.017, 6, 4), { color:'dark:3', t:[0, 0.076, 0.25] });
    eyes(m, K, 0.036, 0.105, 0.17, 0.012, false);
    for(const sx of [-1, 1]) m.add(blob(K, 0.022, 1100 + sx, 6), { color:'cream:2', t:[sx * 0.055, 0.14, 0.11], s:[1, 1, 0.6] });   // fülek
    for(const [x, z] of [[0.07, 0.09], [-0.07, 0.09], [0.08, -0.12], [-0.08, -0.12]]) m.add(blob(K, 0.024, 1110 + x * 100 + z * 10, 6), { color:'skin:2', t:[x, 0.012, z], s:[1, 0.5, 1.3] });
    return m;
  }

  // BÉKA: zöld, lapos test, világos torok, kidülledő szemek, behajlított hátsó láb úszóhártyás talppal
  function frog(K){
    const m = K.model();
    m.add(K.sphere(0.07, 10, 6), { color:'leaf:1', t:[0, 0.05, -0.01], s:[1.05, 0.62, 1.1] });
    m.add(K.sphere(0.05, 10, 6), { color:'leaf:1', t:[0, 0.06, 0.055], s:[1.2, 0.7, 1] });                      // fej
    m.add(K.sphere(0.05, 8, 5), { color:'leaf:0', t:[0, 0.036, 0.045], s:[1.05, 0.55, 1] });                    // torok
    for(const sx of [-1, 1]) m.add(K.sphere(0.022, 8, 5), { color:'leaf:1', t:[sx * 0.035, 0.095, 0.07] });      // szemdudor
    eyes(m, K, 0.037, 0.103, 0.078, 0.016, true);
    for(const [x, z] of [[0.02, -0.03], [-0.03, -0.01], [0.0, 0.01]]) m.add(blob(K, 0.012, 1200 + x * 100 + z * 10, 6), { color:'leaf:2', t:[x, 0.088, z], s:[1, 0.35, 1] });   // hátfoltok
    const foot = [[0, 0], [0.03, 0.035], [0.012, 0.012], [0, 0.045], [-0.012, 0.012], [-0.03, 0.035]];
    for(const sx of [-1, 1]){
      m.add(K.sphere(0.036, 8, 5), { color:'leaf:1', t:[sx * 0.065, 0.034, -0.035], s:[0.75, 0.6, 1.4], r:[0, sx * 20, 0] });   // comb
      rod(m, K, [sx * 0.075, 0.02, 0.005], [sx * 0.07, 0.008, -0.07], 0.012, 0.009, 5, 'leaf:1');                         // lábszár
      m.add(flat(K, foot, 0.006), { color:'leaf:2', t:[sx * 0.07, 0.004, -0.02], r:[-90, 0, 0] });
      rod(m, K, [sx * 0.04, 0.035, 0.05], [sx * 0.05, 0.006, 0.075], 0.009, 0.007, 5, 'leaf:1');                          // mellső láb
      m.add(flat(K, foot, 0.005), { color:'leaf:2', t:[sx * 0.05, 0.003, 0.07], r:[-90, 0, 0], s:[0.7, 0.7, 1] });
    }
    return m;
  }

  // GYÍK (fürge gyík): zöld oldal, barna hátcsík, hosszú, elvékonyodó, enyhén kanyarodó farok, négy terpesztett láb
  function lizard(K){
    const m = K.model(), y = 0.028;
    const seg = [[0.21, 0.004], [0.18, 0.02], [0.14, 0.024], [0.1, 0.02], [0.05, 0.028], [0, 0.031], [-0.05, 0.026], [-0.1, 0.018], [-0.16, 0.012], [-0.22, 0.007], [-0.28, 0.003]];
    const cx = z => Math.sin(z * 14) * 0.018 * Math.max(0, -z * 4 + 0.3);                                           // farok-kanyar
    const ring = (z, r, k, dy) => { const p = []; for(let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; p.push([cx(z) + Math.cos(a) * r, y + (dy || 0) + Math.sin(a) * r * k, z]); } return p; };
    for(let i = 0; i < seg.length - 1; i++) m.add(K.hull([...ring(seg[i][0], seg[i][1], 0.7), ...ring(seg[i + 1][0], seg[i + 1][1], 0.7)]), { color:'leaf:1' });
    for(let i = 3; i < 8; i++) m.add(K.hull([...ring(seg[i][0], seg[i][1] * 0.45, 0.5, seg[i][1] * 0.52), ...ring(seg[i + 1][0], seg[i + 1][1] * 0.45, 0.5, seg[i + 1][1] * 0.52)]), { color:'wood:1' });   // hátcsík
    eyes(m, K, 0.016, y + 0.01, 0.175, 0.006, false);
    for(const [z, sx] of [[0.1, 1], [0.1, -1], [-0.05, 1], [-0.05, -1]]){                                            // lábak: felkar ki, alkar le, talp
      const hip = [cx(z) + sx * 0.02, y, z], knee = [cx(z) + sx * 0.06, y + 0.012, z + 0.01], foot = [cx(z) + sx * 0.07, 0.003, z + (z > 0 ? 0.03 : -0.015)];
      rod(m, K, hip, knee, 0.009, 0.007, 5, 'leaf:2'); rod(m, K, knee, foot, 0.007, 0.005, 5, 'leaf:2');
      m.add(flat(K, [[0, 0], [0.018, 0.02], [0, 0.028], [-0.018, 0.02]], 0.004), { color:'leaf:2', t:foot, r:[-90, z > 0 ? 0 : 180, 0] });
    }
    return m;
  }

  // DENEVÉR: szőrös barna test, hegyes fülek, csipkés szélű hártyaszárny ujjcsontokkal (repülő póz)
  function bat(K){
    const body = K.model();
    body.add(K.sphere(0.045, 8, 6), { color:'chocolate:1', t:[0, -0.012, -0.005], s:[0.9, 1, 1.3] });
    body.add(K.sphere(0.034, 8, 6), { color:'chocolate:1', t:[0, 0.008, 0.058] });
    body.add(blob(K, 0.015, 1300, 6), { color:'chocolate:0', t:[0, 0.0, 0.088] });                                  // pofa
    for(const sx of [-1, 1]) body.add(K.cylinder(0, 0.017, 0.05, 4), { color:'chocolate:2', t:[sx * 0.02, 0.05, 0.055], r:[0, 45, -sx * 22] });   // fülek
    eyes(body, K, 0.015, 0.018, 0.084, 0.008, true);
    for(const sx of [-1, 1]) rod(body, K, [sx * 0.015, -0.05, -0.04], [sx * 0.018, -0.065, -0.07], 0.005, 0.003, 3, 'chocolate:2');   // hátsó láb
    const mem = [[0.02, 0.03], [0.08, 0.05], [0.14, 0.06], [0.2, 0.04], [0.18, 0.0], [0.15, -0.02], [0.13, 0.01], [0.1, -0.04], [0.08, -0.01], [0.05, -0.05], [0.02, -0.035]];
    const out = { body, foot:-0.07 };
    for(const [name, sx] of [['wingL', 1], ['wingR', -1]]){ const g = K.model();
      g.add(flat(K, mem.map(([x, z]) => [sx * x, z]), 0.005), { color:'chocolate:2', r:[-90, 0, 0] });
      for(const tip of [[0.2, 0.04], [0.15, -0.02], [0.1, -0.04]]){                                                   // ujjcsontok
        rod(g, K, [sx * 0.08, 0.004, 0.045], [sx * tip[0], 0.004, tip[1]], 0.005, 0.003, 3, 'chocolate:0'); }
      rod(g, K, [sx * 0.02, 0.004, 0.03], [sx * 0.08, 0.004, 0.05], 0.007, 0.005, 4, 'chocolate:0');                   // kar
      out[name] = g; }
    return out;
  }

  Object.assign(EK, { bee, butterfly, ladybird, bird, hedgehog, frog, lizard, bat });
  root.EK_MODELS = EK;
  if(typeof module !== 'undefined' && module.exports) module.exports = EK;
})(typeof window !== 'undefined' ? window : globalThis);
