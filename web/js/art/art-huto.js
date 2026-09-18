// ============================================================
//  Matricák — Hűtő-mester ételei (f_ + étel-azonosító), B szint (docs/rajzolas.md): a hűtő belseje és ajtaja
//  – felső polc, alsó polc, hűtőajtó + a sajt. A zöldségfiók és a konyhapolc ételei: art-huto-kamra.js
//  Valódi méretből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék. Render: node tools/art-render.js 2d …
// ============================================================
(function(){
  const { r1, rad, camera, band } = ART.geo;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));

  // ---------------- 2D segédek ----------------
  const RR = pts => pts.map(p => [r1(p[0]), r1(p[1])]);
  const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => 'M' + RR(p).map(q => q.join(' ')).join(' ') + 'Z').join('');
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // Douglas–Peucker ritkítás (zárt sokszög) – hogy az SVG kicsi maradjon
  function simplify(poly, eps = .25){
    const dp = (pts) => {
      if(pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let best = 0, bi = 0;
      for(let i = 1; i < pts.length - 1; i++){ const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if(d > best){ best = d; bi = i; } }
      return best > eps ? [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))] : [a, b];
    };
    const half = Math.floor(poly.length / 2);
    return [...dp(poly.slice(0, half + 1)).slice(0, -1), ...dp([...poly.slice(half), poly[0]]).slice(0, -1)];
  }
  // függőlegesen konvex, egymást átfedő konvex sokszögek uniójának körvonala (forgástest sziluettje)
  function envelope(polys, step = .45){
    const xs = polys.flat().map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), N = Math.max(8, Math.ceil((x1 - x0) / step));
    const top = [], bot = [];
    for(let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * Math.min(Math.max(i / N, .0005), .9995);
      let lo = Infinity, hi = -Infinity;
      for(const poly of polys) for(let j = 0; j < poly.length; j++){
        const a = poly[j], b = poly[(j + 1) % poly.length];
        if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0){ const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      }
      if(lo < Infinity){ top.push([x, lo]); bot.push([x, hi]); }
    }
    return simplify([...top, ...bot.reverse()], .18);
  }
  // a sziluett közelében lévő pontok behúzása (a tónus-lapok ne takarják le a kontúrt) – minta: ledizzo/matrica.js
  function inset(pts, sil, d = .85){
    const s = Math.sign(area(sil)) || 1, n = sil.length;
    return pts.map(p => {
      let best = null, bd = Infinity;
      for(let i = 0; i < n; i++){
        const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey;
        if(L2 < 1e-9) continue;
        const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, dd = Math.hypot(p[0] - qx, p[1] - qy);
        if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:Math.sqrt(L2) }; }
      }
      if(!best || bd >= d) return p;
      return [best.qx - best.ey / best.L * s * d, best.qy + best.ex / best.L * s * d];
    });
  }
  // konvex vágás (Sutherland–Hodgman), bármilyen körüljárású vágó-sokszöggel
  function clip(subject, cp){
    const sg = Math.sign(area(cp)), inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){
      const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); }
    }
    return out;
  }
  const circ = (cx, cy, r, n = 12, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => { const a = rad(a0 + 360 * i / n); return [cx + r * Math.cos(a), cy + ry * Math.sin(a)]; });


  // ellipszoid a vetítésben (párhuzamos vetítésnél a képe pontosan ellipszis): c középpont, ax = [[irány, fél-tengely], …] (3 db)
  //   sil(n) körvonal · cres(dx, dy, m) árnyék-sarló a (dx,dy) képernyő-iránnyal ellentétes oldalon · cap(k, dx, dy) fény-folt · on(u, v) egység-kör → képernyő
  function ell3(P, c, ax){
    const o = P([0, 0, 0]), Pi = v => { const q = P(v.map(x => x * 100)); return [(q[0] - o[0]) / 100, (q[1] - o[1]) / 100]; };
    const cols = ax.map(([d, r]) => { const l = Math.hypot(...d); return Pi(d.map(x => x / l * r)); });
    const S = [0, 1].map(i => [0, 1].map(j => cols.reduce((a, q) => a + q[i] * q[j], 0)));
    const tr = S[0][0] + S[1][1], det = S[0][0] * S[1][1] - S[0][1] ** 2, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const v1 = Math.abs(S[0][1]) > 1e-9 ? (() => { const x = S[0][1], y = l1 - S[0][0], n = Math.hypot(x, y); return [x / n, y / n]; })() : (S[0][0] >= S[1][1] ? [1, 0] : [0, 1]);
    const L = [[v1[0] * Math.sqrt(l1), -v1[1] * Math.sqrt(l2)], [v1[1] * Math.sqrt(l1), v1[0] * Math.sqrt(l2)]], c2 = P(c);
    const on = (u, v) => [c2[0] + L[0][0] * u + L[0][1] * v, c2[1] + L[1][0] * u + L[1][1] * v];
    const dt = L[0][0] * L[1][1] - L[0][1] * L[1][0], toU = (x, y) => [(L[1][1] * x - L[0][1] * y) / dt, (-L[1][0] * x + L[0][0] * y) / dt];
    const dirU = (dx, dy, m) => { const q = toU(dx, dy), n = Math.hypot(...q) || 1; return [q[0] / n * m, q[1] / n * m]; };
    const arcU = (cx, cy, a0, a1, n) => Array.from({ length:n + 1 }, (_, i) => { const a = rad(a0 + (a1 - a0) * i / n); return [cx + Math.cos(a), cy + Math.sin(a)]; });
    return {
      c2, on, L,
      sil:(n = 16) => arcU(0, 0, 0, 360, n).slice(0, n).map(p => on(...p)),
      cres:(dx = -1, dy = -1.1, m = .45, n = 10) => { const [sx, sy] = dirU(dx, dy, m), ts = Math.atan2(sy, sx) * 180 / Math.PI, g = Math.acos(Math.min(1, m / 2)) * 180 / Math.PI;
        return [...arcU(0, 0, ts + g, ts + 360 - g, n), ...arcU(sx, sy, ts + 180 + g, ts + 180 - g, n)].map(p => on(...p)); },
      cap:(k = .45, dx = -1, dy = -1.2, m = .4, n = 10) => { const [sx, sy] = dirU(dx, dy, m); return arcU(0, 0, 0, 360, n).slice(0, n).map(([x, y]) => on(sx + (x - 0) * k, sy + y * k)); },
    };
  }
  // lekerekített sarkú tálca (hab-tálca): külső perem fent, szűkebb talp lent; fal (alap) · jobb fal (sötét) · perem (világos) · alja (sötét)
  function tray(P, W, D, Hh, ins, rc = 1.6){
    const rr = (w, d, y, r) => [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]]
      .flatMap(([x, z, a0]) => [0, 45, 90].map(t => [x + r * cos(a0 + t), y, z + r * sin(a0 + t)]));
    const top = rr(W, D, Hh, rc), bot = rr(W - 2 * ins, D - 2 * ins, 0, rc * .8), fl = rr(W - 2 * ins - 1.2, D - 2 * ins - 1.2, Hh * .25, rc * .7), rim = rr(W - 1.6, D - 1.6, Hh, rc * .8);
    const sil = hull([...top, ...bot].map(P)), right = hull([...top, ...bot].filter(p => p[0] > W / 2 - ins - rc - .1 || p[2] > D / 2 - ins - .1 && p[0] > 0).map(P));
    return { sil, right:inset(right, sil), top:top.map(P), rim:rim.map(P), floor:hull([...fl, ...rim.map(([x, , z]) => [x * .96, Hh * .25, z * .96])].map(P)) };
  }

  // alakzat-gyártók: fő lap (kontúrral, peremet kap) · dísz-lap (kontúr nélkül) · útvonal
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts:RR(pts) }, o);
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts:RR(pts) }, o);
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, p:pathOf(polys) }, o);
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, p:pathOf(polys) }, o);
  const shineP = (pts, o = .6) => det('paper', 'light', pts, { o });

  // doboz lapjai a vetítésben (az > 0: az eleje balra, a +X oldala jobbra látszik)
  function box(P, x0, x1, y0, y1, z0, z1){
    const c = (x, y, z) => P([x, y, z]);
    const all = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) all.push(c(x, y, z));
    return {
      top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)],
      front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
      right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)],
      sil:hull(all),
    };
  }
  // forgástest: prof = [[r, y], …] alulról felfelé; ez = a keresztmetszet mélységi aránya (1 = kör). Szög: 0 = elöl, −90 = bal szél, +90 = jobb szél
  function lathe(P, prof, ez = 1){
    const at = (r, y, a) => P([r * sin(a), y, r * ez * cos(a)]);
    const rAt = y => { for(let i = 1; i < prof.length; i++) if(y <= prof[i][1] || i === prof.length - 1){ const [ra, ya] = prof[i - 1], [rb, yb] = prof[i]; return yb === ya ? rb : ra + (rb - ra) * (y - ya) / (yb - ya); } return prof[0][0]; };
    const ring = (r, y, a0 = 0, a1 = 360, n = 20) => Array.from({ length:n + 1 }, (_, i) => at(r, y, a0 + (a1 - a0) * i / n));
    const full = (r, y, n = 24) => ring(r, y, 0, 360, n).slice(0, n);
    const rings = prof.map(([r, y]) => full(r, y, 28));
    const sil = envelope(rings.slice(1).map((rg, i) => hull([...rings[i], ...rg])));
    const on = (a, y, dr = 0) => at(rAt(y) + dr, y, a);                                  // felületi pont (szög, magasság)
    // függőleges tónus-csík a0…a1 szögek között, y0…y1 magasságban (a profil töréspontjain át)
    const strip = (a0, a1, y0 = prof[0][1], y1 = prof[prof.length - 1][1], n = 6) => {
      const ys = [y0, ...prof.map(p => p[1]).filter(y => y > y0 && y < y1), y1];
      return inset([...ring(rAt(y0), y0, a0, a1, n), ...ys.slice(1, -1).map(y => on(a1, y)), ...ring(rAt(y1), y1, a1, a0, n), ...ys.slice(1, -1).reverse().map(y => on(a0, y))], sil);
    };
    // 2D minta (u = szög, v = magasság) a felületre vetítve
    const wrap = pts => pts.map(([a, y]) => on(a, y));
    return { at, rAt, ring, full, sil, on, strip, wrap };
  }

  // =====================================================================
  //  1. Főtt maradék – üveg ételtároló, teal fedővel; a pörkölt krumplival és borsóval az üvegen át látszik
  // =====================================================================
  {
    const X = 9, Z = 6.5, H = 7, OV = .45, LT = 1.7, TILT = -12;   // 18 × 13 × 7 cm üveg + 1,7 cm fedő
    const fit = []; for(const x of [-X - OV, X + OV]) for(const y of [0, H + LT]) for(const z of [-Z - OV, Z + OV]) fit.push([x, y, z]);
    const P = camera({ az:30, el:24, F:70, tilt:TILT, span:80, fit });
    const g = box(P, -X, X, 0, H, -Z, Z), l = box(P, -X - OV, X + OV, H, H + LT, -Z - OV, Z + OV), sil = hull([...g.sil, ...l.sil]);
    const F = ([u, v], dz = 0) => P([u, v, Z + dz]), SD = ([w, v]) => P([X, v, w]);
    const lvlF = u => 4.7 + .32 * Math.sin(u * 1.25 + .4), lvlS = w => 4.7 + .32 * Math.sin((X + (Z - w)) * 1.25 + .4);
    const wav = (f, a, b, n = 10) => Array.from({ length:n + 1 }, (_, i) => { const t = a + (b - a) * i / n; return [t, f(t)]; });
    const stewF = [[-X + .7, .75], [X - .6, .75], ...wav(lvlF, X - .6, -X + .7)].map(p => F(p));
    const stewS = [[Z - .5, .75], [-Z + .7, .75], ...wav(lvlS, -Z + .7, Z - .5, 7)].map(SD);
    const cube = (u, v, s, a) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([p, q]) => F([u + s * (p * cos(a) - q * sin(a)), v + s * (p * sin(a) + q * cos(a))]));
    const pea = (u, v, r = .55) => circ(u, v, r, 8).map(p => F(p));
    ART.add('f_maradek', { emoji:[], hu:'Főtt maradék', en:'leftover stew in a lidded glass food container', shadow:'hard', tilt:TILT, shapes:[
      face('glass', 'dark', g.right),                                                          // üveg oldala (sötét)
      face('glass', 'base', g.front),                                                          // üveg eleje (alap)
      det('orange', 'dark', stewS),                                                            // pörkölt az oldalüvegen át
      det('orange', 'base', stewF),                                                            // pörkölt elöl
      det('orange', 'light', [...wav(lvlF, -X + .7, X - .6).map(p => F(p)), ...wav(u => lvlF(u) - .45, X - .6, -X + .7).map(p => F(p))]),   // fényes szaft-felszín
      dpth('honey', 'light', [cube(-5.6, 4.1, .85, 12), cube(1.2, 3.1, .8, -18), cube(5.6, 4.25, .8, 30), cube(-2.4, 1.9, .7, 40)]),   // krumplikockák
      dpth('chocolate', 'light', [circ(-4.2, 2.3, .9, 7, .75).map(p => F(p)), circ(3.4, 3.9, .95, 7, .8).map(p => F(p)), circ(7.2, 1.6, .7, 7).map(p => F(p))]),   // húsdarabok
      dpth('leaf', 'base', [pea(-3.1, 3.7), pea(3.5, 2.0), pea(-6.6, 1.8), pea(-.6, 4.7, .5), pea(7.3, 2.3, .5)]),                    // borsó
      det('glass', 'line', inset([F([-X, 0]), F([X, 0]), SD([-Z, 0]), SD([-Z, .75]), F([X, .75]), F([-X, .75])], sil), { o:.4 }),  // vastag üvegtalp (élsáv)
      det('glass', 'light', inset([F([-X, .75]), F([-X + .55, .75]), F([-X + .55, H]), F([-X, H])], sil), { o:.9 }),               // üvegfal vastagsága
      shineP([F([-6.8, 1.2]), F([-5.6, 1.2]), F([-3.4, 6.2]), F([-4.6, 6.2])], .5),                                               // tükröződés az üvegen
      face('teal', 'dark', l.right),                                                           // fedő oldala
      face('teal', 'base', l.front),                                                           // fedő eleje
      face('teal', 'light', l.top),                                                            // fedő teteje
      det('teal', 'base', [[-X + 2, -Z + 2], [X - 2, -Z + 2], [X - 2, Z - 2], [-X + 2, Z - 2]].map(([x, z]) => P([x, H + LT, z])), { o:.8 }),   // fedőlap mélyedése
      face('teal', 'dark', [[-2.4, H - 1.1], [2.4, H - 1.1], [2.4, H + LT - .2], [-2.4, H + LT - .2]].map(p => F(p, OV + .12))),   // csat
      shineP([P([-X + .2, H + LT, Z + OV - .5]), P([-1, H + LT, Z + OV - .5]), P([-1.4, H + LT, Z + OV - 1.3]), P([-X + .2, H + LT, Z + OV - 1.3])], .7),
    ]});
  }

  // =====================================================================
  //  2. Tej – nyeregtetős tejes doboz (NEM palack): tető-lap, gerinc-fül, csavaros kupak, kék „tej-hullám” sáv
  // =====================================================================
  {
    const X = 3.5, Z = 3.5, H = 19, G = 3.4, FIN = 1.3, TILT = -10;
    const fit = []; for(const x of [-X, X]) { for(const y of [0, H]) for(const z of [-Z, Z]) fit.push([x, y, z]); fit.push([x, H + G + FIN, 0]); }
    const P = camera({ az:32, el:22, F:90, tilt:TILT, span:80, fit });
    const b = box(P, -X, X, 0, H, -Z, Z), sil = hull([...b.sil, P([-X, H + G + FIN, 0]), P([X, H + G + FIN, 0])]);
    const F = ([u, v]) => P([u, v, Z]), SD = ([w, v]) => P([X, v, w]);
    const wave = s => 6.6 + .75 * Math.sin(s * 1.35 + .6);
    const bandF = [F([-X, 0]), F([X, 0]), ...Array.from({ length:9 }, (_, i) => { const u = X - 2 * X * i / 8; return F([u, wave(u + X)]); })];
    const bandS = [SD([Z, 0]), SD([-Z, 0]), ...Array.from({ length:9 }, (_, i) => { const w = -Z + 2 * Z * i / 8; return SD([w, wave(2 * X + Z - w)]); })];
    // csavaros kupak a tető-lapon (a lap normálisa mentén kiemelve)
    const len = Math.hypot(G, Z), ey = [0, G / len, -Z / len], nn = [0, Z / len, G / len], c0 = [.35, H + G * .42, Z * .58];
    const capRing = h => Array.from({ length:14 }, (_, i) => { const a = rad(360 * i / 14), r = 1.1; return P([0, 1, 2].map(k => c0[k] + r * Math.cos(a) * [1, 0, 0][k] + r * Math.sin(a) * ey[k] + h * nn[k])); });
    const drop = (cx, cy, r) => [[cx, cy + 2.3 * r], ...Array.from({ length:9 }, (_, i) => { const a = rad(45 - 270 * i / 8); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; })].map(F);
    ART.add('f_tej', { emoji:[], hu:'Tej', en:'milk carton', shadow:'hard', tilt:TILT, shapes:[
      face('white', 'dark', [[X, 0, Z], [X, 0, -Z], [X, H, -Z], [X, H + G, 0], [X, H, Z]].map(P)),        // oldala a nyeregvéggel (sötét)
      det('white', 'line', inset([[X, H, Z], [X, H + G, 0], [X, H, -Z]].map(P), sil, 1), { o:.28 }),       // behajtott nyeregvég
      det('white', 'line', inset([[X, 0, -Z + .7], [X, 0, -Z], [X, H, -Z], [X, H, -Z + .7]].map(P), sil), { o:.35 }),   // hátsó élsáv
      det('blue', 'dark', inset(bandS, sil)),                                                             // kék sáv az oldalon
      face('white', 'base', b.front),                                                                     // eleje (alap)
      det('blue', 'base', inset(bandF, sil)),                                                             // kék „tej-hullám” elöl
      face('white', 'light', [[-X, H, Z], [X, H, Z], [X, H + G, 0], [-X, H + G, 0]].map(P)),              // tető-lap (világos)
      face('white', 'base', [[-X, H + G, .2], [X, H + G, .2], [X, H + G + FIN, .2], [-X, H + G + FIN, .2]].map(P)),   // gerinc-fül
      face('sky', 'dark', hull([...capRing(0), ...capRing(.8)])),                                         // kupak oldala
      face('sky', 'light', capRing(.8), { line:false }),                                                  // kupak teteje
      det('sky', 'base', drop(-.9, 11.6, 1.35)),                                                          // tejcsepp-kép
      shineP([F([-2.9, 8.6]), F([-2.25, 8.6]), F([-2.25, 17.6]), F([-2.9, 17.6])], .75),
    ]});
  }

  // =====================================================================
  //  3. Joghurt – MAGAS, keskeny eper-joghurtos pohár, félig lehúzott alufólia-tetővel
  // =====================================================================
  {
    const TILT = 10, R0 = 3.72, TOP = 11.85, prof = [[2.5, 0], [2.6, .35], [3.3, 11.3], [R0, 11.3], [R0, TOP]];
    // fólia: a zsanér a tető síkjában (A pont, PHI irány); a bal-elülső rész TH fokkal felhajtva, a csúcsán húzófül
    const A = [.1, -.25], PHI = 18, TH = 146, U = [cos(PHI), sin(PHI)], N = [-sin(PHI), cos(PHI)];
    const tabA = Math.atan2(N[0], N[1]) * 180 / Math.PI;
    const disc = (r, tab) => Array.from({ length:48 }, (_, i) => { const a = i * 7.5, da = Math.abs(((a - tabA + 540) % 360) - 180);
      const rr = r + (tab ? .95 * Math.min(1, 2.4 * Math.sqrt(Math.max(0, 1 - (da / 24) ** 2))) : 0); return [rr * sin(a), rr * cos(a)]; });
    const half = sg => [[-20, -20], [20, -20], [20, 20], [-20, 20]].map(([p, q]) => [A[0] + p * U[0] + (q + 20) * sg * N[0], A[1] + p * U[1] + (q + 20) * sg * N[1]]);
    const lift = ([x, z], th = TH, y0 = TOP) => { const s = (x - A[0]) * U[0] + (z - A[1]) * U[1], d = (x - A[0]) * N[0] + (z - A[1]) * N[1];
      return [A[0] + s * U[0] + d * cos(th) * N[0], y0 + d * sin(th), A[1] + s * U[1] + d * cos(th) * N[1]]; };
    const flapXZ = clip(disc(3.7, true), half(1)), flap3 = flapXZ.map(p => lift(p));
    const SD = (s, d) => [A[0] + s * U[0] + d * N[0], A[1] + s * U[1] + d * N[1]];                     // fólia-koordináta → (x, z)
    const fit = [...Array.from({ length:12 }, (_, i) => [R0 * sin(i * 30), 0, R0 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, TOP, z]]), ...flap3];
    const P = camera({ az:0, el:28, tilt:TILT, span:80, fit }), L = lathe(P, prof);
    const sil = envelope([L.sil, hull(flap3.map(P))]);
    const dripY = a => 8.9 - Math.max(0, ...[[-64, 1.5], [-22, 2.1], [20, 1.2], [60, 1.8]].map(([c, h]) => h * Math.sqrt(Math.max(0, 1 - ((a - c) / 13) ** 2))));
    const drip = L.wrap([[-90, 11.3], [90, 11.3], ...Array.from({ length:31 }, (_, i) => { const a = 90 - i * 6; return [a, dripY(a)]; })]);
    const berry = L.wrap([[-4, 6.4], [10, 6.1], [22, 5.1], [22, 3.4], [14, 2.0], [0, 1.0], [-14, 1.9], [-24, 3.4], [-24, 5.1], [-14, 6.1]]);
    const leaf = L.wrap([[-4, 6.2], [-16, 7.2], [-8, 6.0], [-4, 7.4], [0, 6.0], [9, 7.2], [-3, 5.6]]);
    const seeds = [[-12, 4.7], [3, 4.8], [14, 4.2], [-8, 3.0], [6, 2.8], [-1, 1.7]].map(([a, y]) => circ(...L.on(a, y), .5, 6, .7));
    const onFlap = pts => pts.map(([s, d]) => P(lift(SD(s, d))));
    ART.add('f_joghurt', { emoji:[], hu:'Joghurt', en:'tall strawberry yogurt cup with a peeled foil lid', shadow:'hard', tilt:TILT, shapes:[
      pth('blossom', 'base', [L.sil]),                                                    // pohár (alap)
      det('blossom', 'light', L.strip(-90, -52, 0, 11.3)),                                // fény felőli csík
      det('blossom', 'dark', L.strip(34, 90, 0, 11.3)),                                   // árnyékos oldal
      det('blossom', 'line', L.strip(70, 90, 0, 11.3), { o:.35 }),                        // legsötétebb élsáv
      det('white', 'base', inset(simplify(drip, .12), sil)),                              // fehér „joghurt-csorgás” a pohár tetején
      face('red', 'base', berry),                                                         // eper
      dpth('honey', 'light', seeds),                                                      // magok
      face('leaf', 'base', leaf),                                                         // eper-levél
      face('white', 'light', L.full(R0, TOP, 24)),                                        // pohár pereme
      det('steel', 'base', clip(disc(3.62), half(-1)).map(([x, z]) => P([x, TOP, z]))),   // a helyén maradt fólia
      det('blossom', 'light', clip(disc(3.3), half(1)).map(([x, z]) => P([x, TOP, z]))),  // eper-joghurt a nyílásban
      face('steel', 'light', flap3.map(P)),                                               // felhajtott fólia, húzófüllel
      det('blossom', 'base', onFlap([[-2.6, .5], [-1.2, .25], [.4, .45], [2.2, .3], [2.7, 1.2], [2.0, 2.3], [.6, 2.9], [-1.0, 2.6], [-2.3, 1.9]]), { o:.9 }),   // joghurt-maradék a fólia belső oldalán
      shineP(onFlap([[-1.6, 3.35], [1.2, 3.35], [1.0, 3.7], [-1.4, 3.7]]), .9),
      shineP(inset([L.on(-58, 1.5), L.on(-48, 1.5), L.on(-48, 6.2), L.on(-58, 6.2)], sil), .5),
    ]});
  }

  // =====================================================================
  //  4. Tejföl – SZÉLES, ALACSONY nyitott doboz kék sávval, tejföl-pamaccsal
  // =====================================================================
  {
    const TILT = -8, prof = [[4.0, 0], [4.1, .3], [4.8, 5.1], [5.15, 5.1], [5.15, 5.7]], TOP = 5.7;
    const fit = Array.from({ length:12 }, (_, i) => [5.15 * sin(i * 30), 0, 5.15 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, TOP, z], [x * .3, TOP + 2.6, z * .3]]);
    const P = camera({ az:0, el:30, tilt:TILT, span:80, fit }), L = lathe(P, prof);
    const open = L.full(4.75, TOP, 24);
    const cream = [...L.ring(4.72, TOP - .5, 90, 270, 10), ...L.ring(4.75, TOP, -90, 90, 10)];
    // pamacs: kupac a közepén, csavart csúccsal (a tető síkjában mért pontokból, kézzel formázva)
    const c = P([.2, TOP - .3, .3]), k = P.k, M = (dx, dy) => [c[0] + dx * k, c[1] + dy * k];
    const swirl = [[-3.1, .3], [-3.2, -.3], [-2.8, -.9], [-2.0, -1.1], [-2.1, -1.6], [-1.7, -2.1], [-1.0, -2.3], [-.9, -2.8], [-1.5, -3.5], [-.4, -3.2], [.3, -2.6], [.6, -2.1],
      [1.5, -1.9], [1.9, -1.4], [1.8, -1.0], [2.7, -.8], [3.2, -.2], [3.0, .5], [1.8, 1.0], [0, 1.2], [-2.0, 1.0]].map(p => M(...p));
    const groove = [M(-2.0, -1.05), M(-.8, -.7), M(.8, -.75), M(1.8, -1.0)], groove2 = [M(-1.0, -2.25), M(-.2, -1.95), M(.6, -2.05)];
    ART.add('f_tejfol', { emoji:[], hu:'Tejföl', en:'wide low open tub of sour cream with a blue band', shadow:'hard', tilt:TILT, shapes:[
      pth('white', 'base', [L.sil]),                                                      // doboz (alap)
      det('white', 'light', L.strip(-90, -50, 0, 5.1)),
      det('white', 'dark', L.strip(30, 90, 0, 5.1)),
      det('white', 'line', L.strip(68, 90, 0, 5.1), { o:.3 }),
      det('blue', 'base', inset([...L.ring(L.rAt(1.3), 1.3, -90, 90, 10), ...L.ring(L.rAt(3.7), 3.7, 90, -90, 10)], L.sil)),   // kék sáv
      det('blue', 'dark', inset([...L.ring(L.rAt(1.3), 1.3, 34, 90, 5), ...L.ring(L.rAt(3.7), 3.7, 90, 34, 5)], L.sil)),
      det('white', 'light', inset([...L.ring(L.rAt(2.3), 2.3, -90, 90, 10), ...L.ring(L.rAt(2.75), 2.75, 90, -90, 10)], L.sil), { o:.9 }),   // vékony fehér csík a sávban
      face('white', 'light', L.full(5.15, TOP, 24)),                                     // perem
      face('white', 'dark', open, { line:false }),                                       // belső fal
      det('paper', 'base', cream),                                                        // tejföl felszíne
      face('white', 'light', swirl),                                                      // pamacs
      det('paper', 'dark', [[1.8, -1.0], [2.7, -.8], [3.2, -.2], [3.0, .5], [1.8, 1.0], [0, 1.2], [-2.0, 1.0], [-.5, .55], [1.3, .3], [2.3, -.3]].map(p => M(...p))),  // pamacs árnyékos alja
      { t:'line', m:'cream', tone:'dark', w:1.1, pts:RR(groove) },
      { t:'line', m:'cream', tone:'dark', w:1.1, pts:RR(groove2) },
      shineP(inset([L.on(-62, .9), L.on(-52, .9), L.on(-50, 4.6), L.on(-60, 4.6)], L.sil), .8),
    ]});
  }

  // =====================================================================
  //  5. Felvágott – szalámirúd (kötözött véggel), a vágott lapon márványos zsírpöttyök, előtte két szelet
  // =====================================================================
  {
    const R = 2.75, X0 = -8.5, X1 = 8.5, TILT = -16, TH = .36;
    const cyl = (x, a, r = R) => [x, R + r * cos(a), r * sin(a)];               // a = 0 fent, 90 elöl
    const ringX = (x, r = R, n = 16) => Array.from({ length:n }, (_, i) => cyl(x, i * 360 / n, r));
    // szelet: közép + normális → saját bázis (e1, e2, N); pt(u, v, h) = pont a szelet síkjában
    const slice = (c, n) => { const N = n.map(v => v / Math.hypot(...n)), a = [N[2], 0, -N[0]], l = Math.hypot(...a), e1 = a.map(v => v / l);
      const e2 = [N[1] * e1[2] - N[2] * e1[1], N[2] * e1[0] - N[0] * e1[2], N[0] * e1[1] - N[1] * e1[0]];
      const pt = (u, v, h = 0) => [0, 1, 2].map(k => c[k] + u * e1[k] + v * e2[k] + h * N[k]);
      return { pt, disc:(r, h = 0, n = 16) => Array.from({ length:n }, (_, i) => pt(r * cos(i * 360 / n), r * sin(i * 360 / n), h)) }; };
    const s1 = slice([-2.2, 2.45, 4.6], [.22, .5, .84]), s2 = slice([2.6, 1.8, 5.6], [.42, .66, .62]);
    const fit = [...ringX(X0 - 1.2, R * .5), ...ringX(X1), ...s1.disc(R), ...s2.disc(R)];
    const P = camera({ az:34, el:24, tilt:TILT, span:80, fit });
    const sil = simplify(hull([...ringX(X0 - .1, R * .5, 24), ...ringX(X0 + .35, R * .86, 24), ...ringX(X0 + 1.1, R, 24), ...ringX(X1, R, 24)].map(P)), .15);
    const along = (a0, a1, n = 5) => [...Array.from({ length:n + 1 }, (_, i) => cyl(X0 + 1.1, a0 + (a1 - a0) * i / n)), ...Array.from({ length:n + 1 }, (_, i) => cyl(X1, a1 + (a0 - a1) * i / n))].map(P);
    const fat = [[.9, .5, .42], [-1.0, 1.1, .38], [-.3, -1.2, .45], [1.3, -.9, .33], [-1.6, -.4, .3], [.2, 1.8, .3], [.1, .1, .26]];
    const dotsEnd = fat.map(([u, v, r]) => circ(u, v, r, 7).map(([a, b]) => P([X1, R + b, a])));
    const dotsSl = (sl, list) => list.map(([u, v, r]) => circ(u, v, r, 7).map(([a, b]) => P(sl.pt(a, b, TH))));
    const e = P([X0 - .2, R + .3, .4]), kk = P.k, string = [band([[e[0] + .2 * kk, e[1]], [e[0] - .6 * kk, e[1] - .3 * kk], [e[0] - 1.3 * kk, e[1] + .1 * kk], [e[0] - 1.35 * kk, e[1] + .8 * kk], [e[0] - .95 * kk, e[1] + 1.3 * kk]], 1.4, true), circ(e[0] - .5 * kk, e[1] - .25 * kk, .42 * kk, 8)];
    ART.add('f_felvagott', { emoji:[], hu:'Felvágott, sonka', en:'salami log with round slices', shadow:'hard', tilt:TILT, shapes:[
      pth('berry', 'base', [sil]),                                                                        // szalámirúd (alap)
      pth('cardboard', 'base', string),                                                                   // kötöző zsineg csomóval
      det('red', 'dark', inset(along(-28, 32), sil), { o:.85 }),                                                     // fény felőli sáv (teteje)
      det('berry', 'dark', inset(along(104, 152), sil)),                                                   // árnyékos alja
      det('berry', 'line', inset(along(134, 152), sil), { o:.5 }),                                        // legsötétebb élsáv
      face('berry', 'dark', ringX(X1, R, 18).map(P)),                                                     // a vágott lap bőr-pereme
      det('red', 'base', ringX(X1, R - .4, 18).map(P)),                                                   // vágott lap
      dpth('cream', 'light', dotsEnd),                                                                    // márványos zsír
      face('berry', 'dark', hull([...s1.disc(R), ...s1.disc(R, TH)].map(P))),                             // 1. szelet (bőr + vastagság)
      det('red', 'base', s1.disc(R - .4, TH).map(P)),
      face('berry', 'dark', hull([...s2.disc(R), ...s2.disc(R, TH)].map(P))),                             // 2. szelet
      det('red', 'base', s2.disc(R - .4, TH).map(P)),
      dpth('cream', 'light', [...dotsSl(s1, fat.slice(0, 6)), ...dotsSl(s2, fat.slice(1).map(([u, v, r]) => [-v, u, r]))]),
      shineP(inset([cyl(X0 + 2.5, -8), cyl(X1 - 3.5, -8), cyl(X1 - 3.5, 6), cyl(X0 + 2.5, 6)].map(P), sil), .45),
    ]});
  }

  // =====================================================================
  //  6. Tojás – nyitott tojástartó (2 × 3 mélyedés, hátul hátradöntött fedél), benne 6 tojás
  // =====================================================================
  {
    const X = 8, Z = 5.25, H = 3.4, LID = 9.4, LA = 58, DEP = 1.8, EY = 2.0, TILT = -10;
    const eggProf = [[0, 0], [1.25, .45], [1.9, 1.15], [2.2, 2.15], [2.15, 3.1], [1.8, 4.1], [1.25, 4.9], [.65, 5.45], [0, 5.75]];
    const nL = [0, sin(LA), cos(LA)], lidAt = (x, t, d = 0, w = 0) => [x, H + t * LID * cos(LA) + d * nL[1], -Z - t * LID * sin(LA) + d * nL[2] + w];
    const fit = [...[-X, X].flatMap(x => [[x, 0, Z], [x, 0, -Z], [x, H, Z], lidAt(x, 1), lidAt(x, 1, DEP)]), [0, EY + 5.75, -2.6]];
    const P = camera({ az:24, el:36, tilt:TILT, span:80, fit });
    const eggs = [-2.6, 2.6].map(z => [-5.2, 0, 5.2].map(x => {
      const L = lathe(v => P([v[0] + x, v[1] + EY, v[2] + z]), eggProf);
      const cut = [P([x - 4, H + .2, z + 1.5]), P([x + 4, H + .2, z + 1.5]), P([x + 4, H + 14, z + 1.5]), P([x - 4, H + 14, z + 1.5])];   // a mélyedés pereme alatt nem látszik
      return { sil:clip(L.sil, cut), cres:clip(L.strip(44, 90, 0, 5.75, 5), cut), shine:circ(...L.on(-34, 4.4), .55, 8, 1.0) };
    }));
    const scal = (bumps, map) => bumps.flatMap(c => Array.from({ length:7 }, (_, i) => { const t = 180 * i / 6; return map([c + 2.5 * cos(t), .9 - .9 * sin(t)]); }));
    const front = [...[[-X, H], [X, H], [X, .9]].map(([u, v]) => P([u, v, Z])), ...scal([5.2, 0, -5.2], ([u, v]) => P([u, v, Z])), P([-X, .9, Z])];
    const side = [...[[Z, H], [-Z, H]].map(([w, v]) => P([X, v, w])), P([X, .9, -Z]), ...scal([-2.6, 2.6], ([w, v]) => P([X, v, -w])).reverse(), P([X, .9, Z])];
    const lidOut = hull([-X, X].flatMap(x => [lidAt(x, 0), lidAt(x, 1), lidAt(x, 0, DEP), lidAt(x, 1, DEP)]).map(P));
    ART.add('f_tojas', { emoji:[], hu:'Tojás', en:'eggs in an open cardboard egg carton', shadow:'hard', tilt:TILT, scale:.92, shapes:[
      face('cardboard', 'dark', lidOut),                                                                       // hátradöntött fedél (pereme)
      det('cardboard', 'base', inset([[-X + .7, .08], [X - .7, .08], [X - .7, .92], [-X + .7, .92]].map(([x, t]) => P(lidAt(x, t, DEP))), lidOut, 1.1)),   // fedél belseje
      face('cardboard', 'light', [[-X, H, Z], [X, H, Z], [X, H, -Z], [-X, H, -Z]].map(P)),                     // tálca pereme
      det('cardboard', 'dark', [[-X + .7, H, Z - .7], [X - .7, H, Z - .7], [X - .7, H, -Z + .7], [-X + .7, H, -Z + .7]].map(P)),   // mélyedések
      ...eggs[0].map(e => face('cream', 'base', e.sil)),                                                      // hátsó sor
      dpth('cream', 'dark', eggs[0].map(e => e.cres)),
      ...eggs[1].map(e => face('cream', 'base', e.sil)),                                                      // első sor
      dpth('cream', 'dark', eggs[1].map(e => e.cres)),
      face('cardboard', 'base', front),                                                                       // tálca eleje, kidomborodó mélyedésekkel
      face('cardboard', 'dark', side),                                                                        // tálca oldala
      dpth('cardboard', 'line', [-2.6, 2.6].map(u => band([P([u, H - .3, Z]), P([u, 1.2, Z])], .8, false)), { o:.4 }),   // hajtásvonalak
      dpth('paper', 'light', [...eggs[0], ...eggs[1]].map(e => e.shine), { o:.9 }),                           // csillanás a tojásokon
    ]});
  }

  // =====================================================================
  //  7. Nyers csirke – egész csirke fehér hab-tálcán: halvány barackos-rózsaszín, két felálló comb csontvéggel
  // =====================================================================
  {
    const TILT = -10, TW = 24, TD = 17, TH = 2.4;
    const n3 = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const perp = d => { const a = n3([-d[2], 0, d[0]]); return [a, n3([d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]])]; };
    const legDef = [[[4.6, 6.1, 3.3], [1, .55, .12], 4.4, 2.3], [[4.0, 7.9, -2.9], [1, .85, -.05], 4.0, 2.0]];
    const tips = legDef.map(([c, d, len]) => { const D = n3(d); return c.map((v, i) => v + D[i] * (len + .5)); });
    const fit = [[-TW / 2, 0, TD / 2], [TW / 2, 0, TD / 2], [-TW / 2, 0, -TD / 2], [TW / 2, 0, -TD / 2], [-TW / 2, TH, -TD / 2], [TW / 2, TH, -TD / 2], [0, 10.4, 0], ...tips.map(t => [t[0] + 1, t[1] + 1, t[2]])];
    const P = camera({ az:22, el:32, tilt:TILT, span:80, fit }), T = tray(P, TW, TD, TH, 1.3, 2.2), k = P.k;
    const legs = legDef.map(([c, d, len, w], i) => { const D = n3(d), [a, b] = perp(D); return { e:ell3(P, c, [[D, len], [a, w], [b, w * .9]]), tip:tips[i], base:c }; });
    const body = ell3(P, [-.8, 5.6, 0], [[[1, 0, 0], 7.6], [[0, 1, 0], 4.5], [[0, 0, 1], 6.0]]);
    // csontvég: két kis gömb a comb végén, a comb irányára merőlegesen
    const knob = g => { const q = P(g.tip), c = P(g.base), dx = q[0] - c[0], dy = q[1] - c[1], l = Math.hypot(dx, dy), px = -dy / l, py = dx / l;
      const c1 = [q[0] + px * .48 * k, q[1] + py * .48 * k], c2 = [q[0] - px * .48 * k, q[1] - py * .48 * k], r = .72 * k;
      const keep = (c, o) => circ(c[0], c[1], r, 18).filter(p => Math.hypot(p[0] - o[0], p[1] - o[1]) >= r * .98);
      return [[...keep(c1, c2), ...keep(c2, c1)].sort((a, b) => Math.atan2(a[1] - q[1], a[0] - q[0]) - Math.atan2(b[1] - q[1], b[0] - q[0]))]; };
    const ridge = Array.from({ length:6 }, (_, i) => { const x = -6 + i * 1.9; return P([x, 5.6 + 4.5 * Math.sqrt(Math.max(0, 1 - ((x + .8) / 7.6) ** 2)) * .99, -.8 + .2 * i]); });
    ART.add('f_csirke', { emoji:[], hu:'Nyers csirke', en:'raw whole chicken on a white tray', shadow:'hard', tilt:TILT, shapes:[
      pth('white', 'base', [T.sil]),                                                           // tálca fala
      det('white', 'dark', T.right),                                                           // tálca jobb fala (sötét)
      face('white', 'light', T.top),                                                           // tálca pereme (világos)
      det('steel', 'light', T.floor),                                                          // tálca alja
      face('skin', 'light', legs[1].e.sil(14)),                                                // hátsó comb
      pth('cream', 'base', knob(legs[1])),                                                     // csontvég (hátsó)
      face('skin', 'light', body.sil(20)),                                                     // test (alap)
      det('blossom', 'base', body.cres(-1, -1.1, .5), { o:.6 }),                               // árnyékos oldal (rózsás)
      det('skin', 'dark', body.cres(-1, -1.1, .2), { o:.5 }),                                  // legsötétebb élsáv
      det('paper', 'light', body.cap(.4, -1, -1.3, .42), { o:.6 }),                            // fény a mellén
      { t:'line', m:'skin', tone:'base', w:1.3, pts:RR(ridge) },                               // mellcsont vonala
      face('skin', 'light', legs[0].e.sil(14)),                                                // első comb
      det('blossom', 'base', legs[0].e.cres(-1, -1.2, .6), { o:.7 }),
      pth('cream', 'base', knob(legs[0])),                                                     // csontvég (első)
      shineP(legs[0].e.cap(.28, -1, -1.4, .45), .7),
    ]});
  }

  // =====================================================================
  //  8. Darált hús – lapos, göröngyös halom tálcán, sűrű „kukacos” darálás-mintával
  // =====================================================================
  {
    const TILT = -10, TW = 17, TD = 13, TH = 2.2, FY = .55, A = 6.3, B = 4.6, C = 4.8;
    const fit = [[-TW / 2, 0, TD / 2], [TW / 2, 0, TD / 2], [-TW / 2, 0, -TD / 2], [TW / 2, 0, -TD / 2], [-TW / 2, TH, -TD / 2], [TW / 2, TH, -TD / 2], [0, FY + B + .8, 0]];
    const P = camera({ az:22, el:36, tilt:TILT, span:80, fit }), T = tray(P, TW, TD, TH, 1.2, 2.0), k = P.k;
    const dome = (la, lo, dr = 0) => [(A + dr) * cos(la) * sin(lo), FY + (B + dr) * sin(la), (C + dr) * cos(la) * cos(lo)];   // la: 0 = talp, 90 = csúcs; lo: 0 = elöl
    const domeSil = hull([0, 20, 40, 60, 80].flatMap(la => Array.from({ length:24 }, (_, i) => P(dome(la, i * 15)))));
    const lumps = [[35, -70, 1.7], [58, -30, 1.8], [62, 25, 1.9], [40, 70, 1.6], [70, 150, 1.8], [45, 200, 1.7], [48, 250, 1.6], [25, -100, 1.3], [22, 100, 1.4]]
      .map(([la, lo, r]) => ell3(P, dome(la, lo, -.6), [[[1, 0, 0], r * 1.25], [[0, 1, 0], r], [[0, 0, 1], r * 1.25]]).sil(12));
    const mound = envelope([domeSil, ...lumps], .5);
    const full = ell3(P, [0, FY + B * .3, 0], [[[1, 0, 0], A], [[0, 1, 0], B * .72], [[0, 0, 1], C]]);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // darálás-csíkok: kis C-ívek a halom látható felületén
    const worms = (n, w) => Array.from({ length:n }, () => { const la = 10 + rnd() * 72, lo = -78 + rnd() * 156, c = P(dome(la, lo, .05)), a0 = rnd() * 360, r = (.6 + rnd() * .25) * k;
      return band(Array.from({ length:4 }, (_, i) => [c[0] + r * cos(a0 + i * 55), c[1] + r * .8 * sin(a0 + i * 55)]), w, false); });
    const edge = [...Array.from({ length:9 }, (_, i) => P(dome(0, -80 + i * 20))), ...Array.from({ length:9 }, (_, i) => P(dome(14, 80 - i * 20, -.1)))];
    ART.add('f_darlathus', { emoji:[], hu:'Darált hús', en:'lumpy raw minced meat on a tray', shadow:'hard', tilt:TILT, shapes:[
      pth('white', 'base', [T.sil]),
      det('white', 'dark', T.right),
      face('white', 'light', T.top),
      det('steel', 'light', T.floor),
      pth('red', 'base', [mound]),                                                             // halom (alap)
      det('red', 'light', clip(full.cap(.55, -1, -1.2, .3, 12), domeSil), { o:.7 }),           // fény felőli teteje
      det('red', 'dark', clip(full.cres(-1, -1.3, .55, 12), domeSil)),                         // árnyékos oldala
      det('red', 'line', inset(edge, mound, 1), { o:.4 }),                                     // legsötétebb élsáv a talpánál
      dpth('tomato', 'light', worms(14, 1.6)),                                                // világos darálás-csíkok
      dpth('red', 'line', worms(13, 1.4), { o:.5 }),                                          // sötét darálás-csíkok
      dpth('blossom', 'light', Array.from({ length:7 }, () => { const c = P(dome(20 + rnd() * 60, -60 + rnd() * 120, .05)); return circ(c[0], c[1], .45, 6); })),   // zsír-pöttyök
      shineP(full.cap(.1, -1, -.8, .74, 8), .35),
    ]});
  }
  // lap-tárgy (szelet, hús): körvonal (u, v) a saját síkjában, map(u, v, h) → 3D; teteje + a néző felé forduló oldalfal-sávok
  function slab(P, O, map, h0, h1){
    const T = O.map(([u, v]) => P(map(u, v, h1))), B = O.map(([u, v]) => P(map(u, v, h0))), sA = Math.sign(area(T)), n = O.length;
    const vis = O.map((_, i) => { const j = (i + 1) % n; return Math.sign(area([T[i], T[j], B[j], B[i]])) === -sA; });
    const start = vis.findIndex(v => !v), runs = [];
    let cur = null;
    for(let s = 1; s <= n; s++){ const i = (start + s) % n;
      if(vis[i]){ if(!cur) cur = [i]; else cur.push(i); } else if(cur){ runs.push(cur); cur = null; } }
    if(cur) runs.push(cur);
    const sides = runs.map(r => { const idx = [...r, (r[r.length - 1] + 1) % n]; return [...idx.map(i => T[i]), ...idx.reverse().map(i => B[i])]; });
    return { top:T, sides, at:(u, v, h = h1) => P(map(u, v, h)) };
  }

  // =====================================================================
  //  9. Friss hal – ezüstkék hal oldalnézetben, enyhén elforgatva: kék hát, ezüst oldal, fehér has, csillogó szem
  // =====================================================================
  {
    const TILT = -12;
    const top = [[13, .3], [11.2, 2.3], [7.5, 3.9], [2, 4.5], [-4, 3.7], [-8.5, 2.0], [-11, .95]];
    const bot = [[12.7, -.5], [11, -1.9], [7, -3.4], [1, -4.0], [-5, -3.2], [-9, -1.6], [-11, -.85]];
    const tail = [[-10.4, .9], [-14.7, 4.5], [-13.4, .05], [-14.7, -4.1], [-10.4, -.8]];
    const dorsal = [[-3.8, 3.7], [-1.4, 6.6], [3.9, 5.9], [3.8, 4.35]], anal = [[-4.2, -3.3], [-7.8, -5.3], [-2.4, -4.9], [-1.4, -3.9]];
    const P = camera({ az:-18, el:10, tilt:TILT, span:84, fit:[...top, ...bot, ...tail, ...dorsal, ...anal].map(([x, y]) => [x, y, 0]) });
    const F = pts => pts.map(([x, y]) => P([x, y, 0])), k = P.k;
    const thick = (x, a, b) => a * (1 - (x / 13) ** 2) + b;
    const back = F([...top.slice(1), ...top.slice(1).reverse().map(([x, y]) => [x, y - thick(x, 1.9, .25)])]);
    const belly = F([...bot.slice(1), ...bot.slice(1).reverse().map(([x, y]) => [x, y + thick(x, 1.5, .2)])]);
    const bellyEdge = F([...bot.slice(1), ...bot.slice(1).reverse().map(([x, y]) => [x, y + .6])]);
    const body = F([...top, ...bot.slice().reverse()]);
    const scales = [[-4, .9], [-1, 1.6], [2, .9], [-2.5, -1.0], [.5, -.4], [3.5, -1.1], [-6.5, -.2]].map(([x, y]) => band(F([[x - .7, y + .9], [x, y], [x - .7, y - .9]]), 1.1, false));
    const rays = [[[-11, .4], [-13.9, 3.4]], [[-11, 0], [-13.1, .05]], [[-11, -.4], [-13.9, -3.1]]].map(p => band(F(p), 1.1, false));
    const eye = P([10.4, .75, 0]);
    ART.add('f_hal', { emoji:[], hu:'Friss hal', en:'fresh whole fish', shadow:'hard', tilt:TILT, shapes:[
      face('sky', 'base', F(tail)),                                                         // farokúszó
      face('sky', 'base', F(dorsal)),                                                       // hátúszó
      face('sky', 'base', F(anal)),                                                         // farok alatti úszó
      face('sky', 'light', body),                                                           // test: ezüstös oldal (alap)
      det('water', 'dark', inset(back, body)),                                              // kék hát (sötét)
      det('white', 'light', inset(belly, body)),                                            // fehér has (világos)
      det('steel', 'dark', inset(bellyEdge, body), { o:.55 }),                              // legsötétebb élsáv a hason
      dpth('sky', 'dark', scales, { o:.8 }),                                                // pikkely-ívek
      dpth('sky', 'dark', rays),                                                            // úszósugarak
      { t:'line', m:'water', tone:'dark', w:1.5, pts:RR(F([[8.0, 3.8], [8.9, 1.2], [8.8, -1.4], [7.8, -3.3]])) },   // kopoltyúfedő
      face('sky', 'dark', F([[6.0, -1.1], [2.0, -3.0], [2.6, -1.3], [3.0, -.1]])),          // mellúszó
      { t:'circle', cx:r1(eye[0]), cy:r1(eye[1]), r:r1(1.0 * k), m:'white', tone:'light', d:true },   // szem
      { t:'circle', cx:r1(eye[0] + .12 * k), cy:r1(eye[1]), r:r1(.58 * k), m:'dark', tone:'base', d:true, line:false },
      { t:'shine', cx:r1(eye[0] - .1 * k), cy:r1(eye[1] - .3 * k), rx:r1(.25 * k), ry:r1(.2 * k), o:.95 },
      shineP(F([[-3, 2.6], [5.5, 3.1], [5.5, 2.5], [-3, 2.0]]), .5),
    ]});
  }

  // =====================================================================
  //  10. Sertéskaraj – nyers karaj: rózsaszín hús, fehér zsírszegély a külső íven, borda-csont a szélén, látszó vastagság
  // =====================================================================
  {
    const TILT = -14, HT = 1.3;
    const O = [[-5.2, 3.6], [-2.6, 5.8], [1.2, 6.3], [4.8, 5.2], [6.9, 2.4], [7.1, -1.2], [5.2, -4.2], [1.6, -5.6], [-2.2, -5.4], [-4.4, -4.6], [-5.6, -5.9], [-7.0, -5.4], [-6.8, -3.8], [-6.2, -2.4], [-6.4, 1.0]];
    const map = (u, v, h) => [u, h, -v];
    const P = camera({ az:18, el:50, tilt:TILT, span:80, fit:O.flatMap(([u, v]) => [map(u, v, 0), map(u, v, HT)]) });
    const S = slab(P, O, map, 0, HT), on = pts => pts.map(([u, v]) => S.at(u, v)), side = (i0, i1) => [...O.slice(i0, i1 + 1).map(([u, v]) => S.at(u, v)), ...O.slice(i0, i1 + 1).reverse().map(([u, v]) => S.at(u, v, 0))];
    const inner = O.slice(0, 7).map(([u, v]) => { const dx = .8 - u, dy = .2 - v, l = Math.hypot(dx, dy); return [u + dx / l * 1.55, v + dy / l * 1.55]; });
    const meat = [...inner, O[7], O[8], O[9], [-4.3, -4.4], [-4.4, -2.0], [-4.2, 2.2], [-3.7, 3.4]];
    const marb = [[[-3.0, 2.8], [-.6, 3.5], [1.8, 2.9]], [[.8, -.2], [3.0, .5], [4.8, -.3]], [[-3.4, -1.6], [-1.6, -.9], [-.1, -1.5]]].map(p => band(on(p), 1.1, true));
    ART.add('f_sertes', { emoji:[], hu:'Sertéskaraj', en:'raw pork chop with bone and white fat rim', shadow:'hard', tilt:TILT, shapes:[
      pth('blossom', 'dark', S.sides),                                                      // hús vastagsága (oldalfal)
      det('cream', 'dark', inset(side(3, 6), hull(S.sides.flat().concat(S.top)))),          // zsír oldalfala
      face('paper', 'base', S.top),                                                         // teteje – a zsírszegély színe
      face('red', 'light', on(meat), { line:false }),                                       // hús (alap)
      det('blossom', 'light', on([[-3.5, 3.2], [-2.0, 4.3], [.8, 4.7], [-1.0, 1.8], [-4.1, 1.2]])),   // fény felőli rész
      det('blossom', 'dark', on([[5.9, .5], [5.0, -2.9], [1.6, -4.6], [-2.2, -4.6], [.2, -2.6], [3.8, -1.0]]), { o:.75 }),   // árnyékos rész
      det('red', 'base', on([[5.0, -2.9], [1.6, -4.6], [-2.2, -4.6], [-1.6, -4.0], [1.8, -3.8]]), { o:.55 }),   // legsötétebb élsáv
      dpth('paper', 'light', marb, { o:.65 }),                                              // márványozottság
      face('paper', 'light', on([[-7.2, -5.6], [-5.8, -6.3], [-4.6, -5.3], [-4.3, -4.4], [-4.4, -2.0], [-4.2, 2.2], [-3.4, 3.6], [-3.9, 4.8], [-5.4, 4.9], [-6.1, 3.6], [-6.3, 1.0], [-6.2, -2.4], [-6.9, -3.9]])),   // borda-csont gömbölyű végekkel
      det('cream', 'dark', on([[-4.6, -5.3], [-4.3, -4.4], [-4.4, -2.0], [-4.2, 2.2], [-3.4, 3.6], [-3.9, 4.0], [-4.9, 2.2], [-5.0, -2.0], [-5.2, -4.9]])),   // csont árnyéka
      shineP(on([[-2.8, 3.0], [-.8, 3.8], [-.6, 3.3], [-2.7, 2.5]]), .7),
    ]});
  }

  // =====================================================================
  //  11. Fagyasztott hús – deres steak (jégkristályok) üvegtálban, alatta olvadék víz
  // =====================================================================
  {
    const TILT = 8, TOP = 6.3, prof = [[4.4, 0], [4.6, .25], [6.8, 1.6], [8.6, 4.0], [9.3, 5.9], [9.3, TOP]];
    const n3 = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const C = [.4, 6.4, -1.4], E1 = n3([1, .06, 0]), N = n3([0, .85, .55]), E2 = [N[1] * E1[2] - N[2] * E1[1], N[2] * E1[0] - N[0] * E1[2], N[0] * E1[1] - N[1] * E1[0]];
    const map = (u, v, h) => [0, 1, 2].map(i => C[i] + u * E1[i] + v * E2[i] + h * N[i]);
    const SK = [[-6.4, .6], [-5.6, 3.2], [-2.8, 4.3], [.6, 3.6], [3.4, 4.2], [6.0, 3.0], [6.6, .2], [5.4, -2.8], [1.8, -4.1], [-2.2, -3.6], [-5.2, -2.7]];
    const fit = [...Array.from({ length:12 }, (_, i) => [9.3 * sin(i * 30), 0, 9.3 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, TOP, z]]), ...SK.map(([u, v]) => map(u, v, 1))];
    const P = camera({ az:0, el:30, tilt:TILT, span:82, fit }), L = lathe(P, prof);
    const S = slab(P, SK, map, -1, 1), on = pts => pts.map(([u, v]) => S.at(u, v));
    const all = envelope([L.sil, hull(S.top), ...S.sides.map(hull)]);
    const frost = on([[-5.6, 3.2], [-2.8, 4.3], [.6, 3.6], [3.4, 4.2], [6.0, 3.0], [6.6, .2], [5.9, -1.4], [5.0, .4], [4.1, -.4], [4.2, 1.6], [2.6, 2.1], [1.6, 1.0], [.3, 2.4], [-1.6, 1.5], [-2.6, 2.8], [-4.2, 1.6], [-5.8, 1.4]]);
    const flake = (u, v, r) => [0, 60, 120].map(a => band(on([[u + r * cos(a), v + r * sin(a)], [u - r * cos(a), v - r * sin(a)]]), 1.2, true));
    const drop = (x, y, s) => { const q = P([x, y, 9.3 * cos(Math.asin(x / 9.3))]), kk = P.k * s; return [[q[0], q[1] - 1.8 * kk], ...Array.from({ length:7 }, (_, i) => { const a = -30 + 240 * i / 6; return [q[0] + kk * .8 * cos(a), q[1] + kk * .8 * sin(a)]; })]; };
    ART.add('f_felenged', { emoji:[], hu:'Fagyasztott hús', en:'frozen steak with white frost crystals thawing in a bowl', shadow:'hard', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                        // tál (alap)
      face('glass', 'dark', L.full(9.0, TOP, 28), { line:false }),                          // tál belseje
      det('water', 'light', L.full(6.4, 2.2, 20)),                                          // olvadék víz a tál alján
      pth('red', 'dark', S.sides),                                                          // steak vastagsága
      face('red', 'base', S.top),                                                           // steak teteje
      dpth('cream', 'light', [band(on([[-4.4, -1.6], [-2.0, -2.6], [1.0, -2.2], [4.0, -2.8]]), 1.2, true)], { o:.9 }),   // zsír-erezet
      det('sky', 'light', frost, { o:.95 }),                                                // dér a steak szélén
      dpth('white', 'light', [...flake(-2.0, .2, 1.35), ...flake(2.5, -.5, 1.0)]),          // jégkristályok
      face('glass', 'base', L.strip(-90, 90, 0, TOP)),                                      // tál eleje
      det('glass', 'light', L.strip(-90, -54, .3, 5.9)),                                    // fény felőli csík
      det('glass', 'dark', L.strip(36, 90, .3, 5.9)),                                       // árnyékos oldal
      det('glass', 'line', L.strip(70, 90, .3, 5.9), { o:.35 }),                            // legsötétebb élsáv
      det('glass', 'light', inset([...L.ring(9.3, TOP, -90, 90, 14), ...L.ring(8.85, TOP, 90, -90, 14)], all)),   // perem
      dpth('water', 'base', [drop(-3.2, 4.4, 1), drop(1.8, 3.4, .8)]),                     // olvadó cseppek
      shineP(inset([L.on(-66, 1.4), L.on(-58, 1.4), L.on(-58, 5.2), L.on(-66, 5.2)], L.sil), .7),
    ]});
  }

  // =====================================================================
  //  12. Üdítő – átlátszó műanyag palack narancssárga üdítővel, piros kupakkal, üres címkesávval
  // =====================================================================
  {
    const TILT = 12, LVL = 20.8;
    const prof = [[3.9, 0], [4.3, .6], [4.4, 1.6], [4.4, 17.5], [4.15, 19.6], [3.3, 22.2], [2.2, 24.4], [1.5, 25.7], [1.5, 26.2], [1.9, 26.2], [1.9, 26.6], [1.55, 26.6], [1.55, 26.9], [1.8, 26.9], [1.8, 29.2]];
    const fit = Array.from({ length:12 }, (_, i) => [4.4 * sin(i * 30), 0, 4.4 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .4, 29.2, z * .4]]);
    const P = camera({ az:0, el:14, tilt:TILT, span:82, fit }), L = lathe(P, prof), k = P.k;
    const bubbles = [[-30, 3.5, .5], [20, 5.2, .38], [-8, 16.6, .45], [32, 18.2, .35], [5, 19.4, .3], [-40, 18.8, .3]].map(([a, y, r]) => circ(...L.on(a, y), r * k, 7));
    const ribs = [-60, -35, -10, 15, 40, 65].map(a => band([L.on(a, 27.1), L.on(a, 29.0)], .8, false));
    ART.add('f_udito', { emoji:[], hu:'Üdítő', en:'plastic bottle of orange soda with a cap and a blank label', shadow:'hard', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                        // átlátszó palack (alap)
      det('glass', 'dark', L.strip(38, 90, LVL, 26.2)),                                       // palack-váll árnyékos oldala
      det('orange', 'light', L.full(L.rAt(LVL) - .25, LVL, 20)),                            // üdítő felszíne a műanyagon át
      det('orange', 'base', L.strip(-90, 90, .35, LVL, 12)),                                // narancssárga üdítő
      det('orange', 'light', L.strip(-90, -56, .35, LVL)),
      det('orange', 'dark', L.strip(34, 90, .35, LVL)),
      det('orange', 'line', L.strip(70, 90, .35, LVL), { o:.35 }),                          // legsötétebb élsáv
      det('teal', 'base', L.strip(-90, 90, 7.4, 14.6, 12)),                                 // üres címkesáv
      det('teal', 'light', L.strip(-90, -58, 7.4, 14.6)),
      det('teal', 'dark', L.strip(34, 90, 7.4, 14.6)),
      dpth('orange', 'light', bubbles, { o:.9 }),                                           // buborékok
      det('glass', 'dark', L.strip(-90, 90, 26.2, 26.6, 8)),                                // nyakgyűrű
      det('red', 'base', L.strip(-90, 90, 26.9, 29.2, 8)),                                  // kupak
      dpth('red', 'dark', ribs),                                                            // kupak recézése
      face('red', 'light', L.full(1.8, 29.2, 16)),                                         // kupak teteje
      shineP(L.strip(-66, -58, 2.2, 24.2, 2), .6),
    ]});
  }

  // =====================================================================
  //  13. Ketchup – ZÖMÖK, piros, lapított flakon széles krémszínű pattintós kupakkal; a címkén paradicsom
  // =====================================================================
  {
    const TILT = -12, EZ = .62, CAP = 15.8, TOP = 19.0;
    const prof = [[3.0, 0], [3.4, .5], [3.55, 1.5], [3.55, 11.6], [3.3, 13.6], [2.55, 15.2], [2.0, CAP], [2.3, CAP], [2.3, 18.0], [2.0, 18.6], [1.2, TOP]];
    const fit = Array.from({ length:12 }, (_, i) => [3.55 * sin(i * 30), 0, 3.55 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .6, TOP, z * .6]]);
    const P = camera({ az:0, el:18, tilt:TILT, span:78, fit }), L = lathe(P, prof, EZ), k = P.k;
    const tom = L.wrap(Array.from({ length:16 }, (_, i) => { const a = i * 22.5, notch = Math.abs(((a + 90) % 360) - 180) < 20 ? .35 : 0; return [24 * cos(a), 6.9 - (2.0 - notch) * sin(a)]; }));
    const leaf = L.wrap([[-1, 8.7], [-12, 9.5], [-4, 8.6], [0, 9.9], [4, 8.6], [12, 9.5], [2, 8.2]]);
    ART.add('f_ketchup', { emoji:[], hu:'Ketchup', en:'red ketchup squeeze bottle with a tomato on a blank label', shadow:'hard', tilt:TILT, shapes:[
      pth('red', 'base', [L.sil]),                                                          // flakon (alap)
      det('red', 'light', L.strip(-90, -54, 0, CAP)),                                       // fény felőli csík
      det('red', 'dark', L.strip(36, 90, 0, CAP)),                                          // árnyékos oldal
      det('red', 'line', L.strip(70, 90, 0, CAP), { o:.35 }),                               // legsötétebb élsáv
      det('cream', 'base', L.strip(-62, 62, 3.6, 10.4, 10)),                                // üres címke
      det('cream', 'dark', L.strip(34, 62, 3.6, 10.4, 4)),
      face('tomato', 'base', tom),                                                          // paradicsom
      face('leaf', 'base', leaf),                                                           // kocsány
      { t:'shine', cx:r1(L.on(-12, 7.6)[0]), cy:r1(L.on(-12, 7.6)[1]), rx:r1(.35 * k), ry:r1(.55 * k), rot:-20, o:.8 },
      det('cream', 'base', L.strip(-90, 90, CAP, TOP, 10)),                                 // pattintós kupak
      det('cream', 'light', L.strip(-90, -40, CAP, TOP, 4)),
      det('cream', 'dark', L.strip(40, 90, CAP, TOP, 4)),
      dpth('cream', 'line', [band([L.on(-80, 17.7, .02), L.on(-30, 17.55, .02), L.on(30, 17.55, .02), L.on(80, 17.7, .02)], .9, false), circ(...P([0, TOP - .05, -.1]), .42 * k, 8, .25 * k)], { o:.55 }),   // fedél-vonal és kifolyónyílás
      shineP(L.strip(-70, -60, 1.6, 12.4, 2), .55),
    ]});
  }

  // =====================================================================
  //  14. Mustár – KARCSÚ sárga flakon hegyes, zöld kifolyócsőrrel; zöld címkén mustármagok
  // =====================================================================
  {
    const TILT = 12, EZ = .72, COL = 15.6, NOZ = 16.9, TOP = 20.6;
    const prof = [[2.85, 0], [3.2, .5], [3.3, 1.4], [3.3, 12.2], [3.0, 14.0], [2.2, 15.2], [1.7, COL], [1.9, COL], [1.9, NOZ], [1.3, NOZ], [.32, TOP - .3], [.2, TOP]];
    const fit = Array.from({ length:12 }, (_, i) => [3.3 * sin(i * 30), 0, 3.3 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .1, TOP, z * .1]]);
    const P = camera({ az:0, el:16, tilt:TILT, span:80, fit }), L = lathe(P, prof, EZ), k = P.k;
    const seeds = [[-40, 8.3], [-18, 9.4], [6, 8.2], [28, 9.3], [-28, 6.2], [-4, 6.6], [18, 6.0], [40, 7.2], [-12, 4.9], [10, 4.4]].map(([a, y]) => circ(...L.on(a, y), .33 * k, 6));
    const tip = P([0, TOP, 0]);
    ART.add('f_mustar', { emoji:[], hu:'Mustár', en:'yellow mustard squeeze bottle with a pointed nozzle', shadow:'hard', tilt:TILT, shapes:[
      pth('gold', 'base', [L.sil]),                                                         // flakon (alap)
      det('gold', 'light', L.strip(-90, -52, 0, COL)),
      det('gold', 'dark', L.strip(36, 90, 0, COL)),
      det('gold', 'line', L.strip(70, 90, 0, COL), { o:.35 }),                              // legsötétebb élsáv
      det('leaf', 'base', L.strip(-90, 90, 3.4, 10.6, 10)),                                 // címke
      det('leaf', 'dark', L.strip(36, 90, 3.4, 10.6, 4)),
      dpth('honey', 'light', seeds),                                                        // mustármagok
      det('leaf', 'base', L.strip(-90, 90, COL, NOZ, 8)),                                   // kupak-gallér
      det('leaf', 'light', L.strip(-90, 90, NOZ, TOP, 8)),                                  // hegyes kifolyócsőr
      det('leaf', 'dark', L.strip(20, 90, COL, TOP, 3)),                                    // csőr árnyékos oldala
      face('gold', 'base', [[tip[0], tip[1] - .2 * k], [tip[0] - .55 * k, tip[1] - 1.2 * k], [tip[0] - .15 * k, tip[1] - 1.75 * k], [tip[0] + .45 * k, tip[1] - 1.45 * k], [tip[0] + .55 * k, tip[1] - .9 * k]].map(([x, y]) => [x - .2 * k, y + 1.9 * k])),   // mustárcsepp a csőr hegyén
      shineP(L.strip(-70, -60, 1.6, 15.0, 2), .55),
    ]});
  }

  // =====================================================================
  //  15. Lekvár – üvegben sötétpiros lekvár, tetején piros-fehér kockás kendő zsineggel és masnival
  // =====================================================================
  {
    const TILT = -10, JAM = 6.9, HEM = 6.8, TIE = 8.3;
    const jar = [[3.3, 0], [3.6, .4], [3.7, 1.2], [3.7, 7.2], [3.3, 8.1], [3.1, 8.3]];
    const cloth = [[4.35, HEM], [3.35, TIE], [3.95, 9.2], [3.75, 10.0], [2.3, 10.55], [0, 10.7]];
    const fit = Array.from({ length:12 }, (_, i) => [4.4 * sin(i * 30), 0, 4.4 * cos(i * 30)]).flatMap(([x, , z]) => [[x * .84, 0, z * .84], [x, HEM - .4, z], [x * .3, 10.7, z * .3]]);
    const P = camera({ az:0, el:24, tilt:TILT, span:78, fit }), J = lathe(P, jar), C = lathe(P, cloth), k = P.k;
    const hemY = a => HEM - .38 + .38 * Math.cos(rad(a * 7));
    const skirt = [...Array.from({ length:25 }, (_, i) => { const a = -90 + 7.5 * i; return C.at(4.35, hemY(a), a); }), ...C.ring(3.35, TIE, 90, -90, 10)];
    const topPart = envelope([hull([...C.full(3.35, TIE, 16), ...C.full(3.95, 9.2, 16)]), hull([...C.full(3.95, 9.2, 16), ...C.full(3.75, 10.0, 16), ...C.full(2.3, 10.55, 12)])]);
    // kockák: a szoknyán (szög × magasság) és a kupola tetején (x × z)
    const checks = [];
    for(let i = 0; i < 12; i++) for(let j = 0; j < 2; j++) if((i + j) % 2 === 0){ const a0 = -90 + i * 15, y0 = TIE - .1 - (j + 1) * .6;
      checks.push([[a0, y0], [a0 + 15, y0], [a0 + 15, y0 + .6], [a0, y0 + .6]].map(([a, y]) => C.at(3.35 + (4.35 - 3.35) * (TIE - y) / (TIE - HEM) + .02, y, a))); }
    const domeY = (u, w) => { const r = Math.hypot(u, w); return r < 2.3 ? 10.55 + .15 * (1 - r / 2.3) : 10.55 - (r - 2.3) * .6; };
    for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++) if((i + j) % 2 === 0){ const x = -3.6 + i * .9, z = -3.6 + j * .9;
      if(Math.hypot(x + .45, z + .45) > 3.55) continue;
      checks.push([[x, z], [x + .9, z], [x + .9, z + .9], [x, z + .9]].map(([u, w]) => P([u, domeY(u, w), w]))); }
    const bow = [band([C.at(3.4, TIE, -8), P([-1.6, TIE + .9, 3.9]), P([-2.4, TIE + .1, 4.0]), P([-1.4, TIE - .4, 3.8]), C.at(3.4, TIE, -4)], 1.1, false),
      band([C.at(3.4, TIE, 4), P([.9, TIE - 1.3, 3.8]), P([.4, TIE - 2.0, 3.9])], 1.1, false), band([C.at(3.4, TIE, -2), P([-.8, TIE - 1.4, 3.8]), P([-1.5, TIE - 1.9, 3.9])], 1.1, false)];
    ART.add('f_lekvar', { emoji:[], hu:'Lekvár', en:'jam jar with a checkered cloth lid tied with string', shadow:'hard', tilt:TILT, shapes:[
      pth('glass', 'base', [J.sil]),                                                        // befőttesüveg
      det('glass', 'dark', J.strip(-90, 90, 0, .55, 10)),                                   // vastag üvegtalp
      det('berry', 'base', J.strip(-90, 90, .55, JAM, 12)),                                 // lekvár (alap)
      det('berry', 'light', J.strip(-90, -56, .55, JAM)),
      det('berry', 'dark', J.strip(34, 90, .55, JAM)),
      det('berry', 'line', J.strip(68, 90, .55, JAM), { o:.5 }),                            // legsötétebb élsáv
      face('red', 'base', topPart),                                                         // kendő a fedőn
      face('red', 'dark', skirt),                                                           // lelógó kendő-szél, hullámos szegéllyel (árnyékban)
      det('red', 'light', inset(clip(topPart, [P([-6, 12, 0]), P([1.2, 12, 0]), P([-6, 6, 0])]), topPart, .9), { o:.55 }),   // fény a kendő bal-felső részén
      dpth('paper', 'light', checks, { o:.92 }),                                            // fehér kockák (kockás minta)
      pth('cardboard', 'base', [band(C.ring(3.4, TIE, -90, 90, 12), 1.0, false)]),          // zsineg
      pth('cardboard', 'base', bow),                                                        // masni
      shineP(J.strip(-70, -60, 1.2, 6.2, 2), .6),
    ]});
  }

  // =====================================================================
  //  16. Vaj – vajtömb a kibontott, gyűrött aranyfólián; a tetején vajfürt és késnyom
  // =====================================================================
  {
    const TILT = -12, BX = 5.0, BZ = 2.9, BH = 4.1, FX = 10.2, FZ = 7.2;
    const fit = [[-FX, 0, FZ], [FX, 0, FZ], [FX, 0, -FZ], [-FX, 0, -FZ], [-BX, BH + 1.2, -BZ], [BX, BH, BZ]];
    const P = camera({ az:28, el:28, F:80, tilt:TILT, span:84, fit });
    const fy = (x, z) => (Math.abs(x) > BX + .4 || Math.abs(z) > BZ + .4) ? .35 * (Math.abs(x) / FX + Math.abs(z) / FZ) : 0;   // a fólia szélei kissé felhajlanak
    const F = pts => pts.map(([x, z]) => P([x, fy(x, z), z]));
    const foil = F([[-FX, -FZ + 1.2], [-2, -FZ], [FX - 1.4, -FZ + .3], [FX, -1.0], [FX - .6, FZ - .8], [2.5, FZ], [-FX + 2.2, FZ - .2], [-FX - .3, 2.0]]);
    const b = box(P, -BX, BX, 0, BH, -BZ, BZ);
    const curl = (() => { const c = P([-1.6, BH + .75, -.3]), kk = P.k; return band(Array.from({ length:9 }, (_, i) => { const a = 200 + 38 * i, r = (1.75 - .11 * i) * kk; return [c[0] + r * cos(a), c[1] + r * .7 * sin(a)]; }), .9 * kk, true); })();
    ART.add('f_vaj', { emoji:[], hu:'Vaj', en:'block of butter on unwrapped gold foil', shadow:'hard', tilt:TILT, shapes:[
      face('gold', 'base', foil),                                                           // kibontott aranyfólia (alap)
      det('gold', 'light', F([[-FX, -FZ + 1.2], [-2, -FZ], [FX - 1.4, -FZ + .3], [BX + .4, -BZ - .4], [-BX - .4, -BZ - .4], [-FX + .2, 2.0]])),   // hátsó/bal fül (világos)
      det('gold', 'dark', F([[FX, -1.0], [FX - .6, FZ - .8], [2.5, FZ], [BX + .4, BZ + .4], [BX + .4, -BZ - .4]])),   // jobb-elülső fül (sötét)
      det('gold', 'line', F([[FX - .6, FZ - .8], [2.5, FZ], [4.6, FZ - 2.2]]), { o:.4 }),   // legsötétebb gyűrődés
      dpth('gold', 'dark', [[[-FX + .5, -3.4], [-BX - .4, -BZ - .4]], [[BX + .4, -BZ - .4], [FX - .5, -3.8]], [[-BX - .4, BZ + .4], [-5.8, FZ - .2]], [[BX + .4, BZ + .4], [FX - 1, 3.6]]].map(p => band(F(p), .9, false)), { o:.7 }),   // hajtásvonalak
      det('paper', 'base', F([[-FX - .3, 2.0], [-FX + 2.2, FZ - .2], [-FX + 3.4, 3.6]])),   // visszahajtott sarok (fehér belső oldal)
      face('honey', 'base', b.right),                                                       // vaj oldala (sötét)
      face('honey', 'light', b.front),                                                      // vaj eleje (alap)
      face('cream', 'base', b.top),                                                         // vaj teteje (világos)
      det('honey', 'dark', inset([P([-BX, 0, BZ]), P([BX, 0, BZ]), P([BX, 0, -BZ]), P([BX, .45, -BZ]), P([BX, .45, BZ]), P([-BX, .45, BZ])], b.sil), { o:.35 }),   // alsó élsáv
      { t:'line', m:'cream', tone:'dark', w:1.5, pts:RR([P([1.2, BH, -2.1]), P([2.2, BH, -.6]), P([2.8, BH, 1.1]), P([3.9, BH, 2.1])]) },   // késnyom
      face('cream', 'base', curl),                                                          // felcsavarodott vajfürt
      shineP([P([-BX + .6, 3.2, BZ]), P([-.8, 3.2, BZ]), P([-.8, 2.7, BZ]), P([-BX + .6, 2.7, BZ])], .8),
    ]});
  }

  // ---- a megdöntött matrica férjen a 8–92 tartományba (perem nélkül mérve): scale ----
  for(const n of ['f_maradek', 'f_tej', 'f_joghurt', 'f_tejfol', 'f_felvagott', 'f_tojas', 'f_csirke', 'f_darlathus', 'f_hal', 'f_sertes', 'f_felenged', 'f_udito', 'f_ketchup', 'f_mustar', 'f_lekvar', 'f_vaj']){
    const A = ART.LIB[n], c = cos(A.tilt || 0), sn = sin(A.tilt || 0); let dev = 0;
    for(const sh of A.shapes){ if(sh.d || sh.t === 'line' || sh.t === 'shine') continue;
      const pts = sh.t === 'poly' ? sh.pts : (() => { const [x, y, w, h] = ART.bbox(sh); return [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]; })();
      for(const [px, py] of pts){ const dx = px - 50, dy = py - 50; dev = Math.max(dev, Math.abs(dx * c - dy * sn), Math.abs(dx * sn + dy * c)); } }
    const k = Math.min(1, Math.floor(42 / dev * 100) / 100); if(k < 1) A.scale = k;
  }
})();

// ---- Sajt (a jóváhagyott etalon B változata: docs/rajzolas/minta/sajt) ----
(function(){
  const { R, rad, arc } = ART.geo;
  const L = 12, H = 7.2, TH = 46;            // szelet: sugár (hossz), magasság, nyílásszög (fok) – kb. 12 × 7 × 9 cm
  const cos = Math.cos, sin = Math.sin;

  // ---- vetítés: Y körüli forgatás (phi) + felülnézet (el) → a 100-as rács közepére, a hosszabbik méret = size ----
  function camera(phi, el, size){
    const p = rad(phi), e = rad(el);
    const raw = ([x, y, z]) => { const xr = x * cos(p) + z * sin(p), zr = -x * sin(p) + z * cos(p); return [xr, -y * cos(e) + zr * sin(e)]; };
    const hull = []; for(const y of [0, H]){ hull.push(raw([0, y, 0])); for(const q of arc(0, 0, L, 0, -TH, 12)) hull.push(raw([q[0], y, q[1]])); }
    const xs = hull.map(q => q[0]), ys = hull.map(q => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = size / Math.max(x1 - x0, y1 - y0);
    const P = q => { const [a, b] = raw(q); return [50 + (a - (x0 + x1) / 2) * k, 50 + (b - (y0 + y1) / 2) * k]; };
    let aVis = 0; while(aVis > -TH && -cos(rad(aVis - 1)) * sin(p) + sin(rad(aVis - 1)) * cos(p) > 0) aVis--;   // a kéreg-ív látható része
    return { P, aVis };
  }
  // lapok: helyi 2D koordináta → 3D
  const FRONT = ([u, v]) => [u, v, 0];                                         // vágott lap (u: csúcstól a kéregig, v: fel)
  const TOP = ([x, z]) => [x, H, z];                                           // felső lap (z < 0: hátrafelé)
  const BOT = ([x, z]) => [x, 0, z];                                           // alsó lap (csak a lyukak pereméhez)
  const RIND = ([a, y]) => [L * cos(rad(a)), y, L * sin(rad(a))];              // kéreg (a: szög fokban)
  const on = (cam, face, pts) => R(pts.map(q => cam.P(face(q))));
  // kéreg-lap a0…a1 fok között: alsó és felső ív mintavételezve (húr helyett – a részsávok így nem lógnak ki)
  const rindStrip = (a0, a1, n = 6) => [...Array.from({ length:n + 1 }, (_, i) => [a0 + (a1 - a0) * i / n, 0]), ...Array.from({ length:n + 1 }, (_, i) => [a1 + (a0 - a1) * i / n, H])];

  // ---- 2D segédek a lap síkjában ----
  const ring = (c, r, n = 22) => arc(c[0], c[1], r, 0, 360, n).slice(0, n);
  function clip(poly, box){                                                    // konvex vágás (Sutherland–Hodgman)
    let out = poly;
    for(let i = 0; i < box.length; i++){
      const A = box[i], B = box[(i + 1) % box.length], side = p => (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]);
      const src = out; out = [];
      for(let j = 0; j < src.length; j++){ const p = src[j], q = src[(j + 1) % src.length], sp = side(p), sq = side(q);
        const cut = () => { const t = sp / (sp - sq); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
        if(sq >= 0){ if(sp < 0) out.push(cut()); out.push(q); } else if(sp >= 0) out.push(cut()); }
    }
    return out;
  }
  function crescent(c, r, sx, sy, n = 14){      // a kör azon része, amely kilóg a (sx,sy)-nal eltolt körből
    const d = Math.hypot(sx, sy), ts = Math.atan2(sy, sx) * 180 / Math.PI, g = Math.acos(Math.min(1, d / (2 * r))) * 180 / Math.PI;
    return [...arc(c[0], c[1], r, ts + g, ts + 360 - g, n), ...arc(c[0] + sx, c[1] + sy, r, ts + 180 + g, ts + 180 - g, n)];
  }
  const FRONT_BOX = [[0, 0], [L, 0], [L, H], [0, H]];
  const SECTOR = [[0, 0], ...arc(0, 0, L, 0, -TH, 12)];
  const topClip = pts => clip(pts.map(([x, z]) => [x, -z]), SECTOR.map(([x, z]) => [x, -z])).map(([x, z]) => [x, -z]);
  // lyuk a lap síkjában: alap + (fényes alsó perem) + árnyékos belső fal bal-fent. A „fent” a vágott lapon +v, a tetején -z.
  function hole(cam, face, c, r, o = {}){
    const up = face === TOP ? -1 : 1, cl = o.clip || (p => p), out = [];
    const S = (m, tone, pts, extra) => out.push(Object.assign({ t:'poly', m, tone, d:true, line:false, pts:on(cam, face, cl(pts)) }, extra));
    S(o.floorM || 'honey', o.floor || 'dark', ring(c, r));
    if(o.lit) S('gold', 'base', crescent(c, r, -.2 * r, .22 * r * up));            // alsó-jobb belső fal: fényt kap
    S(o.shadeM || 'honey', o.shade || 'line', crescent(c, r, .36 * r, -.46 * r * up), { o:o.shadeO != null ? o.shadeO : .5 });
    return out;
  }

  // ==================== B – kidolgozott: 4 éles tónus, sarlós lyukak, szélen vágott lyukak, fénycsík ====================
  {
    const cam = camera(-38, 32, 74), rb = .75;
    ART.add('f_sajt', { emoji:[], hu:'Sajt', en:'wedge of yellow cheese with holes', shadow:'hard', tilt:-20, scale:.97, shapes:[
      { t:'poly', m:'honey', tone:'dark', pts:on(cam, RIND, rindStrip(0, cam.aVis)) },         // kéreg-oldal (sötét)
      { t:'poly', m:'honey', tone:'base', pts:on(cam, FRONT, FRONT_BOX) },                                              // vágott lap (alap)
      { t:'poly', m:'honey', tone:'light', pts:on(cam, TOP, SECTOR) },                                                  // teteje (világos)
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:[...on(cam, TOP, arc(0, 0, L, -TH, 0, 10)),           // kéreg-sáv (legsötétebb)
          ...on(cam, FRONT, [[L, 0], [L - rb, 0]]), ...on(cam, TOP, arc(0, 0, L - rb, 0, -TH, 10))] },
      ...hole(cam, FRONT, [3.9, 3.3], 1.5),
      ...hole(cam, FRONT, [8.0, 4.8], 1.0),
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, ring([6.8, 1.6], .7)) },
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, clip(ring([10.0, H], 1.05), FRONT_BOX)) },   // élen vágott lyuk – elöl
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:on(cam, TOP, topClip(ring([10.0, 0], 1.05))) },            // … és felül (mélye)
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, clip(ring([1.9, 0], .95), FRONT_BOX)) },   // alsó élen
      ...hole(cam, TOP, [6.4, -2.7], .95, { floor:'base', shade:'dark', shadeO:1 }),
      { t:'poly', m:'paper', tone:'light', d:true, line:false, o:.6, pts:on(cam, FRONT, [[.9, H - .55], [5.8, H - .55], [5.6, H - 1.05], [.9, H - 1.05]]) },
    ]});
  }

})();
