// ============================================================
//  Matricák — Szelektálj! hulladékok (i_ + azonosító), B szint (docs/rajzolas.md): papír, műanyag-fém, üveg
//  (kommunális, bio, használt olaj: art-waste-b.js · a különleges gyűjtésűek: art-waste-special.js, art-waste-special-b.js)
//  Valódi méretből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A rajzot szabad léptékben építjük, a put() a végén középre teszi és a vászonra illeszti (a döntéssel együtt).
//  Render: node tools/art-render.js 2d <ez a fájl> ki.png --skip waste
// ============================================================
(function(){
  const { r1, rad, camera, band, star } = ART.geo;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const { hypot, max, min, abs, sqrt } = Math;

  // ---------------- 2D segédek ----------------
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;          // ismételhető véletlen
  const area = p => p.reduce((a, q, i) => { const r = p[(i + 1) % p.length]; return a + q[0] * r[1] - r[0] * q[1]; }, 0) / 2;
  const orient = p => (area(p) >= 0 ? p : [...p].reverse());
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const circ = (cx, cy, r, n = 12, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => [cx + r * cos(a0 + 360 * i / n), cy + ry * sin(a0 + 360 * i / n)]);
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function simplify(poly, eps = .25){                                                   // Douglas–Peucker (zárt sokszög)
    const dp = pts => { if(pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1], L = hypot(b[0] - a[0], b[1] - a[1]) || 1; let best = 0, bi = 0;
      for(let i = 1; i < pts.length - 1; i++){ const d = abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if(d > best){ best = d; bi = i; } }
      return best > eps ? [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))] : [a, b]; };
    const h = Math.floor(poly.length / 2);
    return [...dp(poly.slice(0, h + 1)).slice(0, -1), ...dp([...poly.slice(h), poly[0]]).slice(0, -1)];
  }
  function envelope(polys, step = .45){                                                 // függőlegesen konvex sokszögek uniója
    const xs = polys.flat().map(p => p[0]), x0 = min(...xs), x1 = max(...xs), N = max(8, Math.ceil((x1 - x0) / step)), top = [], bot = [];
    for(let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * min(max(i / N, .0005), .9995); let lo = Infinity, hi = -Infinity;
      for(const poly of polys) for(let j = 0; j < poly.length; j++){ const a = poly[j], b = poly[(j + 1) % poly.length];
        if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0){ const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = min(lo, y); hi = max(hi, y); } }
      if(lo < Infinity){ top.push([x, lo]); bot.push([x, hi]); }
    }
    return simplify([...top, ...bot.reverse()], .18);
  }
  function inset(pts, sil, d = .85){                                                    // a kontúr közelében lévő pontok behúzása
    const s = Math.sign(area(sil)) || 1, n = sil.length;
    return pts.map(p => { let best = null, bd = Infinity;
      for(let i = 0; i < n; i++){ const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey; if(L2 < 1e-9) continue;
        const t = max(0, min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, dd = hypot(p[0] - qx, p[1] - qy);
        if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:sqrt(L2) }; } }
      return (!best || bd >= d) ? p : [best.qx - best.ey / best.L * s * d, best.qy + best.ex / best.L * s * d]; });
  }
  function clip(subject, cp){                                                           // konvex vágás (Sutherland–Hodgman)
    const sg = Math.sign(area(cp)), inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){ const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); } }
    return out;
  }
  // csík egy töröttvonal mentén szaggatva (zsineg-minta): minden második szakasz
  function dashes(pts, len, w){
    const out = []; let acc = 0, on = true, cur = [pts[0]];
    for(let i = 1; i < pts.length; i++){ let a = pts[i - 1]; const b = pts[i]; let seg = hypot(b[0] - a[0], b[1] - a[1]);
      while(acc + seg >= len){ const t = (len - acc) / seg, m = lerp(a, b, t); cur.push(m); if(on && cur.length > 1) out.push(band(cur, w, false)); on = !on; cur = [m]; seg -= len - acc; a = m; acc = 0; }
      acc += seg; cur.push(b); }
    return out;
  }
  const rr = (x0, y0, x1, y1, r) => [[x1 - r, y0 + r, 270], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]]   // lekerekített téglalap
    .flatMap(([x, y, a]) => [0, 45, 90].map(d => [x + r * cos(a + d), y + r * sin(a + d)]));

  // ---------------- 3D segédek ----------------
  // forgástest: prof = [[r, y], …] alulról; ez = mélységi arány. Szög: 0 = elöl, −90 = bal szél, +90 = jobb szél
  function lathe(P, prof, ez = 1){
    const at = (r, y, a) => P([r * sin(a), y, r * ez * cos(a)]);
    const rAt = y => { for(let i = 1; i < prof.length; i++) if(y <= prof[i][1] || i === prof.length - 1){ const [ra, ya] = prof[i - 1], [rb, yb] = prof[i]; return yb === ya ? rb : ra + (rb - ra) * (y - ya) / (yb - ya); } return prof[0][0]; };
    const ring = (r, y, a0 = 0, a1 = 360, n = 20) => Array.from({ length:n + 1 }, (_, i) => at(r, y, a0 + (a1 - a0) * i / n));
    const full = (r, y, n = 24) => ring(r, y, 0, 360, n).slice(0, n);
    const rings = prof.map(([r, y]) => full(r, y, 28));
    const sil = envelope(rings.slice(1).map((rg, i) => hull([...rings[i], ...rg])));
    const on = (a, y, dr = 0) => at(rAt(y) + dr, y, a);
    const strip = (a0, a1, y0 = prof[0][1], y1 = prof[prof.length - 1][1], n = 6) => {
      const ys = [y0, ...prof.map(p => p[1]).filter(y => y > y0 && y < y1), y1];
      return inset([...ring(rAt(y0), y0, a0, a1, n), ...ys.slice(1, -1).map(y => on(a1, y)), ...ring(rAt(y1), y1, a1, a0, n), ...ys.slice(1, -1).reverse().map(y => on(a0, y))], sil);
    };
    return { at, rAt, ring, full, sil, on, strip, wrap:pts => pts.map(([a, y]) => on(a, y)) };
  }
  const n3 = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // a kamera iránya (a néző felé) és a fény (bal-fent-elöl) világ-koordinátában
  const viewDir = (az, el) => [sin(az) * cos(el), sin(el), cos(az) * cos(el)];
  const lightDir = (az, el) => { const C = viewDir(az, el), RT = [cos(az), 0, -sin(az)], UP = [-sin(az) * sin(el), cos(el), -cos(az) * sin(el)];
    return n3([0, 1, 2].map(i => -.55 * RT[i] + .62 * UP[i] + .55 * C[i])); };
  // kihúzott (extrudált) profil: prof = [[x, y], …] az óramutatóval ellentétesen (y fel), z0…z1 mélységben →
  //   front (elülső lap), sides (a néző felé forduló oldallapok fényértékkel), sil (körvonal)
  function extrude(P, prof, z0, z1, az, el){
    const C = viewDir(az, el), L = lightDir(az, el), n = prof.length, front = prof.map(([x, y]) => P([x, y, z1])), sides = [];
    for(let i = 0; i < n; i++){ const a = prof[i], b = prof[(i + 1) % n], nn = n3([b[1] - a[1], a[0] - b[0], 0]);
      if(dot(nn, C) > .01) sides.push({ pts:[P([a[0], a[1], z1]), P([b[0], b[1], z1]), P([b[0], b[1], z0]), P([a[0], a[1], z0])], s:dot(nn, L) }); }
    return { front, sides, sil:envelope([front, ...sides.map(s => s.pts)], .5), tone:test => sides.filter(s => test(s.s)).map(s => s.pts) };
  }
  // gyűrött gömb (alufólia, papír): zajos, alacsony poligonszámú ellipszoid → látható háromszögek fényértékkel
  function crumple(P, o){
    const rnd = rng(o.seed || 7), NL = o.nl || 4, NM = o.nm || 7, rings = [];
    const pt = (lat, lon, f) => [o.rx * cos(lat) * sin(lon) * f, o.ry * sin(lat) * f, o.rz * cos(lat) * cos(lon) * f];
    for(let i = 1; i < NL; i++) rings.push(Array.from({ length:NM }, (_, j) => { const f = 1 + (o.amp || .2) * (rnd() * 2 - 1), sp = (o.spikes || []).find(s => s[0] === i && s[1] === j);
      return pt(-90 + 180 * i / NL + (rnd() - .5) * 14, 360 * j / NM + (i % 2) * 180 / NM + (rnd() - .5) * 18, sp ? sp[2] : f); }));
    const S = [0, -o.ry * (1 + (rnd() - .5) * .2), 0], Nn = [0, o.ry * (1 + (rnd() - .5) * .2), 0], F = [];
    for(let j = 0; j < NM; j++){ const k = (j + 1) % NM;
      F.push([S, rings[0][j], rings[0][k]], [Nn, rings[NL - 2][j], rings[NL - 2][k]]);
      for(let i = 0; i < NL - 2; i++){ const kk = i % 2 ? k : j, jj = i % 2 ? j : (j - 1 + NM) % NM;
        F.push([rings[i][j], rings[i][k], rings[i + 1][kk]], [rings[i][j], rings[i + 1][kk], rings[i + 1][jj]]); } }
    const C = viewDir(o.az, o.el), L = lightDir(o.az, o.el);
    const tris = F.map(f => { let n = n3(cross(f[1].map((v, i) => v - f[0][i]), f[2].map((v, i) => v - f[0][i])));
      const c = [0, 1, 2].map(i => (f[0][i] + f[1][i] + f[2][i]) / 3); if(dot(n, c) < 0) n = n.map(v => -v);
      return { f, n, s:dot(n, L), vis:dot(n, C) > .02, pts:f.map(P) }; }).filter(t => t.vis);
    // gyűrődés-élek: két látható lap közös éle, a törés mértéke szerint rendezve
    const edges = {}; tris.forEach(t => [[0, 1], [1, 2], [2, 0]].forEach(([a, b]) => { const key = [t.f[a], t.f[b]].map(v => v.map(r1).join(',')).sort().join('|');
      (edges[key] = edges[key] || []).push({ t, a:t.pts[a], b:t.pts[b] }); }));
    const creases = Object.values(edges).filter(e => e.length === 2).map(e => ({ ang:1 - dot(e[0].t.n, e[1].t.n), pts:[e[0].a, e[0].b], s:max(e[0].t.s, e[1].t.s) })).sort((a, b) => b.ang - a.ang);
    return { tris, creases, sil:envelope(tris.map(t => t.pts), .6), tone:test => tris.filter(t => test(t.s)).map(t => t.pts) };
  }

  // ---------------- alakzat-gyártók (a put() illeszti a vászonra) ----------------
  const mk = (kind, m, tone, polys, o) => Object.assign({ kind, m, tone, polys }, o);
  const face = (m, tone, pts, o) => mk('poly', m, tone, [pts], o);                     // fő lap: peremet és kontúrt kap
  const det = (m, tone, pts, o) => mk('poly', m, tone, [pts], Object.assign({ d:true, line:false }, o));   // tónus-lap / dísz
  const pth = (m, tone, polys, o) => mk('path', m, tone, polys, o);
  const dpth = (m, tone, polys, o) => mk('path', m, tone, polys, Object.assign({ d:true, line:false }, o));
  const shine = (polys, o = .6) => dpth('paper', 'light', polys, { o });
  const lin = (m, tone, pts, w, o) => mk('line', m, tone, [pts], Object.assign({ w }, o));

  // középre tesz, a megdöntött befoglaló alapján span méretre nagyít, és a perem + árnyék férjen a 100-as vászonra
  function put(name, meta, shapes, span = 82){
    shapes = shapes.map(s => Object.assign({}, s, { polys:s.polys.filter(p => p && p.length > (s.kind === 'line' ? 1 : 2)) })).filter(s => s.polys.length);
    const t = rad(meta.tilt || 0), c = Math.cos(t), sn = Math.sin(t);
    const rot = ([x, y]) => [(x - 50) * c - (y - 50) * sn, (x - 50) * sn + (y - 50) * c];
    const isSil = s => !s.d && s.kind !== 'line';
    const U = shapes.filter(isSil).flatMap(s => s.polys.flat()).map(rot);
    const ux0 = min(...U.map(u => u[0])), ux1 = max(...U.map(u => u[0])), uy0 = min(...U.map(u => u[1])), uy1 = max(...U.map(u => u[1]));
    const w = ux1 - ux0, h = uy1 - uy0, cx = (ux0 + ux1) / 2, cy = (uy0 + uy1) / 2;
    let k = min(span / max(w, h), 91.2 / w, 87.6 / h);
    const T = k => [-k * cx, -1.75 - k * cy];
    const D = shapes.filter(s => !isSil(s)).flatMap(s => s.polys.flat().map(p => [rot(p), s.kind === 'line' ? s.w / 2 : 0]));
    for(let it = 0; it < 30; it++){ const [tx, ty] = T(k); if(D.every(([u, pad]) => abs(k * u[0] + tx) + pad * k <= 49.2 && abs(k * u[1] + ty) + pad * k <= 49.2)) break; k *= .97; }
    const [tx, ty] = T(k), dx = tx * c + ty * sn, dy = -tx * sn + ty * c;
    const tf = ([x, y]) => [r1(50 + k * (x - 50) + dx), r1(50 + k * (y - 50) + dy)];
    const clean = p => p.filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]);
    const out = shapes.map(s => {
      const b = { m:s.m, tone:s.tone }; if(s.d) b.d = true; if(s.line === false) b.line = false; if(s.o != null) b.o = s.o;
      if(s.kind === 'line') return Object.assign(b, { t:'line', w:r1(s.w * k), pts:clean(s.polys[0].map(tf)) });
      const Q = s.polys.map(p => clean(p.map(tf))).filter(p => p.length > 2);
      if(s.kind === 'poly') return Object.assign(b, { t:'poly', pts:Q[0] });
      return Object.assign(b, { t:'path', p:Q.map(p => 'M' + orient(p).map(q => q.join(' ')).join(' ') + 'Z').join('') });
    }).filter(s => s.t !== 'path' || /\S/.test(s.p));
    ART.add(name, Object.assign({ emoji:[], shadow:'hard' }, meta, { shapes:out }));
  }

  // =====================================================================
  //  PAPÍR
  // =====================================================================

  //  1. Szórólap – harmonikaszerűen (Z) hajtott fényes reklámlap: fejléc-sáv, fotó-mező, „akció” csillag, szöveg csak csíkként
  {
    const TILT = -10, H = 20, PW = 9.5, A = 32, V = [[0, 0]];
    for(const a of [A, -A, A]){ const p = V[V.length - 1]; V.push([p[0] + PW * cos(a), p[1] + PW * sin(a)]); }
    const xm = V[3][0] / 2;
    const P = camera({ az:0, el:16, F:60, tilt:TILT, span:80, fit:V.flatMap(([x, z]) => [[x - xm, 0, z], [x - xm, H, z]]) });
    const on = (i, s, v) => { const a = V[i], b = V[i + 1], u = s / PW; return P([a[0] + (b[0] - a[0]) * u - xm, v, a[1] + (b[1] - a[1]) * u]); };
    const q = (i, s0, s1, v0, v1) => [on(i, s0, v0), on(i, s1, v0), on(i, s1, v1), on(i, s0, v1)];
    const panel = i => q(i, 0, PW, 0, H);
    const stripes = (i, rows) => rows.map(([v, s0, s1]) => q(i, s0, s1, v, v + .6));
    const hill = [[.9, 8.3], [8.6, 8.3], [8.6, 10.6], [7.2, 11.4], [5.6, 10.4], [3.8, 11.9], [2.2, 11.2], [.9, 10.2]].map(([s, v]) => on(0, s, v));
    const burst = star(0, 0, 3.3, 2.4, 11).map(([x, y]) => on(2, 4.75 + x, 12.6 - y));
    put('i_szorolap', { hu:'Szórólap', en:'folded glossy advertising leaflet', tilt:TILT }, [
      face('paper', 'base', panel(0)),                                                     // 1. lap (fény felé)
      face('paper', 'dark', panel(1)),                                                     // 2. lap (árnyékban)
      face('paper', 'light', panel(2)),                                                    // 3. lap
      det('paper', 'line', q(1, PW - 2.2, PW - .15, .2, H - .2), { o:.3 }),                // völgy-árnyék a hajtásnál
      dpth('tomato', 'base', [q(0, .25, PW - .25, H - 3.4, H - .3), q(2, .25, PW - .25, H - 3.4, H - .3)]),   // fejléc-sáv
      det('tomato', 'dark', q(1, .25, PW - .25, H - 3.4, H - .3)),
      det('sky', 'base', q(0, .9, 8.6, 8.3, 15.3)),                                        // fotó: ég…
      det('honey', 'base', circ(0, 0, 1.2, 10).map(([x, y]) => on(0, 6.6 + x, 13.4 + y))), // …nap…
      det('grass', 'base', hill),                                                          // …domb
      dpth('steel', 'dark', [...stripes(0, [[5.9, .9, 8.4], [4.5, .9, 8.4], [3.1, .9, 5.6]]), ...stripes(2, [[6.2, .9, 8.4], [4.8, .9, 8.4], [3.4, .9, 6.2]]),
        ...stripes(1, [[14.2, .9, 8.4], [12.8, .9, 8.4], [11.4, .9, 6.0]])]),              // szöveg csak csíkként
      det('teal', 'dark', q(1, .9, 8.4, 1.8, 9.2)),                                        // színes blokk a középső lapon
      mk('poly', 'honey', 'base', [burst], { d:true }),                                    // akció-csillag
      det('red', 'base', circ(0, 0, 1.3, 10).map(([x, y]) => on(2, 4.75 + x, 12.6 + y))),
      shine([q(0, 1.2, 2.2, 8.6, 15.0).map((p, i) => i > 1 ? [p[0] + 2.6, p[1]] : p)], .55),   // fényes papír csillanása
    ]);
  }

  //  2. Boríték – ablakos boríték elölről, felnyitott füllel: az átlátszó címzés-ablak mögött a levél sorai, hüvelykujj-bevágás, bélyeg
  {
    const TILT = -10, W = 11, HB = 11, HF = 10, T = .3, FA = 16;
    const flap = ([x, s]) => [x, HB + s * cos(FA), -T - s * sin(FA)];
    const flapO = [[-W, 0], [W, 0], [2.6, 6.1], [1.3, 6.8], [0, 7.0], [-1.3, 6.8], [-2.6, 6.1]];
    const fit = [[-W, 0, T], [W, 0, T], [-W, HB, -T], [W, HB, -T], flap([0, 7])];
    const P = camera({ az:22, el:14, F:70, tilt:TILT, span:80, fit });
    const F = pts => pts.map(([x, y]) => P([x, y, T])), B = pts => pts.map(([x, y]) => P([x, y, -T])), Fl = pts => pts.map(p => P(flap(p)));
    const frontO = [[-W, 0], [W, 0], [W, HF], [1.9, HF], ...Array.from({ length:7 }, (_, i) => [1.9 * cos(30 * i), HF - 1.9 * sin(30 * i)]).slice(1, -1), [-1.9, HF], [-W, HF]];
    const silF = F(frontO);
    const win = rr(-9.2, 1.5, -1.4, 5.6, .7);
    const gumE = [[W - .9, .3], [2.4, 5.8], [0, 6.7], [-2.4, 5.8], [-W + .9, .3]];
    const gumI = gumE.map(p => { const d = n3([0 - p[0], 2.2 - p[1], 0]); return [p[0] + d[0] * 1.3, p[1] + d[1] * 1.3]; }).reverse();
    const stamp = [];
    for(let i = 0; i < 20; i++){ const e = i % 5, side = Math.floor(i / 5), tt = e / 5, o = e % 2 ? .22 : 0;
      const pts = [[6.5, 6.5], [9.6, 6.5], [9.6, 9.3], [6.5, 9.3]], a = pts[side], b = pts[(side + 1) % 4], m = lerp(a, b, tt), nn = [b[1] - a[1], a[0] - b[0]], l = hypot(...nn);
      stamp.push([m[0] - nn[0] / l * o, m[1] - nn[1] / l * o]); }
    put('i_boritek', { hu:'Boríték', en:'paper window envelope with an open flap', tilt:TILT }, [
      face('paper', 'dark', B([[-W, 0], [W, 0], [W, HB], [-W, HB]])),                      // hátlap belseje
      det('sky', 'dark', inset(B([[-W, HF - 3], [W, HF - 3], [W, HB], [-W, HB]]), B([[-W, 0], [W, 0], [W, HB], [-W, HB]])), { o:.45 }),   // biztonsági belső minta
      face('paper', 'light', Fl(flapO)),                                                   // felnyitott fül (belső oldal)
      det('paper', 'dark', inset(Fl([[-W, 0], [W, 0], [W - .6, 1.2], [-W + .6, 1.2]]), Fl(flapO))),   // árnyék a hajtásnál
      det('cream', 'dark', inset(Fl([...gumE, ...gumI]), Fl(flapO), 1.1)),                 // ragasztócsík
      face('paper', 'base', silF),                                                         // eleje, hüvelykujj-bevágással
      det('paper', 'light', inset(F([[-W, HF], [-2.4, HF], [-W, 2.2]]), silF)),            // fény felőli rész
      det('paper', 'line', inset(F([[-W, 0], [W, 0], [W, HF], [W - .45, HF], [W - .45, .45], [-W, .45]]), silF), { o:.35 }),   // élsáv (vastagság)
      mk('poly', 'glass', 'light', [F(win)], { d:true }),                                  // átlátszó címzés-ablak
      dpth('steel', 'dark', [[-8.3, 4.1, -3.2, 4.6], [-8.3, 3.1, -4.2, 3.6], [-8.3, 2.1, -5.2, 2.6]].map(([x0, y0, x1, y1]) => F([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]))),   // a levél sorai az ablak mögött
      shine([F([[-8.6, 1.9], [-7.6, 1.9], [-5.8, 5.2], [-6.8, 5.2]]), F([[-6.9, 1.9], [-6.4, 1.9], [-4.6, 5.2], [-5.1, 5.2]])], .75),   // fólia-csillanás
      mk('poly', 'red', 'base', [F(stamp)], { d:true }),                                   // bélyeg fogazott széllel
      det('honey', 'light', F([[7.2, 7.2], [8.9, 7.2], [8.9, 8.6], [7.2, 8.6]])),
      det('red', 'base', F(circ(8.05, 7.9, .5, 8))),
    ]);
  }

  //  3. Papír tojástartó – ÜRES, szürke préselt papír: nyitott fedél, 6 üres mélyedés, középen kúpos tartók, a papírrost pöttyei
  {
    const X = 8, Z = 5.25, H = 3.6, LID = 9.4, LA = 64, DEP = 1.8, TILT = -10, EL = 34, AZ = 28;
    const nL = [0, sin(LA), cos(LA)], lidAt = (x, t, d = 0) => [x, H + t * LID * cos(LA) + d * nL[1], -Z - t * LID * sin(LA) + d * nL[2]];
    const fit = [...[-X, X].flatMap(x => [[x, 0, Z], [x, 0, -Z], [x, H, Z], lidAt(x, 1), lidAt(x, 1, DEP)])];
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit });
    const cells = [-2.6, 2.6].flatMap(z => [-5.2, 0, 5.2].map(x => [x, z]));
    const cupO = ([x, z]) => circ(x, z, 2.15, 14).map(([u, w]) => P([u, H, w]));
    const cupSh = ([x, z]) => [...Array.from({ length:8 }, (_, i) => [x + 2.15 * cos(95 + 170 * i / 7), z + 2.15 * sin(95 + 170 * i / 7)]),
      ...Array.from({ length:8 }, (_, i) => [x + 1.1 + 1.7 * cos(250 - 140 * i / 7), z + 1.7 * sin(250 - 140 * i / 7)])].map(([u, w]) => P([u, H, w]));
    const cupF = ([x, z]) => circ(x + .35, z + .3, 1.05, 10).map(([u, w]) => P([u, H - 2.3, w]));
    const cone = x => ({ all:hull([...circ(x, 0, 1.35, 10).map(([u, w]) => P([u, H, w])), P([x, H + 2.4, 0])]),
      dark:[P([x, H + 2.4, 0]), P([x + .2, H, 1.35]), P([x + 1.35, H, 0]), P([x + .95, H, -.95])] });
    const scal = (bumps, map) => bumps.flatMap(c => Array.from({ length:7 }, (_, i) => { const t = 180 * i / 6; return map([c + 2.5 * cos(t), .9 - .9 * sin(t)]); }));
    const front = [...[[-X, H], [X, H], [X, .9]].map(([u, v]) => P([u, v, Z])), ...scal([5.2, 0, -5.2], ([u, v]) => P([u, v, Z])), P([-X, .9, Z])];
    const side = [...[[Z, H], [-Z, H]].map(([w, v]) => P([X, v, w])), P([X, .9, -Z]), ...scal([-2.6, 2.6], ([w, v]) => P([X, v, -w])).reverse(), P([X, .9, Z])];
    const lidOut = hull([-X, X].flatMap(x => [lidAt(x, 0), lidAt(x, 1), lidAt(x, 0, DEP), lidAt(x, 1, DEP)]).map(P));
    const rnd = rng(5), specks = Array.from({ length:16 }, (_, i) => { const p = i < 9 ? P([-X + 1 + rnd() * (2 * X - 2), .6 + rnd() * (H - 1.2), Z]) : P(lidAt(-X + 1.5 + rnd() * (2 * X - 3), .15 + rnd() * .7, DEP));
      return circ(p[0], p[1], .45, 5); });
    put('i_tojastarto', { hu:'Papír tojástartó', en:'empty grey molded pulp egg carton with open lid', tilt:TILT }, [
      face('steel', 'dark', lidOut),                                                       // nyitott fedél (pereme)
      det('steel', 'base', inset([[-X + .7, .08], [X - .7, .08], [X - .7, .92], [-X + .7, .92]].map(([x, t]) => P(lidAt(x, t, DEP))), lidOut, 1.1)),   // fedél belseje
      det('steel', 'dark', inset([[-X + .7, .08], [X - .7, .08], [X - .7, .24], [-X + .7, .24]].map(([x, t]) => P(lidAt(x, t, DEP))), lidOut, 1.1), { o:.8 }),   // árnyék a fedél tövénél
      face('steel', 'light', [[-X, H, Z], [X, H, Z], [X, H, -Z], [-X, H, -Z]].map(P)),     // tálca teteje
      dpth('steel', 'dark', cells.map(cupO)),                                              // üres mélyedések
      dpth('steel', 'line', cells.map(cupSh), { o:.45 }),                                  // árnyék a mélyedés bal falán
      dpth('steel', 'base', cells.map(cupF)),                                              // mélyedés alja
      dpth('steel', 'light', [-2.6, 2.6].map(x => cone(x).all)),                           // kúpos tartók
      dpth('steel', 'dark', [-2.6, 2.6].map(x => cone(x).dark)),
      face('steel', 'base', front),                                                        // eleje (kidomborodó mélyedések)
      face('steel', 'dark', side),                                                         // oldala
      dpth('steel', 'line', [-2.6, 2.6].map(u => band([P([u, H - .3, Z]), P([u, 1.2, Z])], .8, false)), { o:.4 }),   // hajtásvonalak
      dpth('steel', 'dark', specks, { o:.55 }),                                            // préselt papírrost pöttyei
      shine([[P([-X + .8, H - .6, Z]), P([-1.5, H - .6, Z]), P([-1.5, H - 1.1, Z]), P([-X + .8, H - 1.1, Z])]], .7),
    ]);
  }

  //  4. WC-papír guriga – üres kartonhenger, spirális ragasztási varrattal; felül a nyíláson a belseje, a varraton papírfoszlány
  {
    const TILT = 16, R0 = 2.3, HT = 10.5, prof = [[R0, 0], [R0, HT]];
    const fit = Array.from({ length:12 }, (_, i) => [R0 * sin(i * 30), 0, R0 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, HT, z]]);
    const P = camera({ az:0, el:28, tilt:TILT, span:80, fit }), L = lathe(P, prof);
    const helix = (y0, dy = 0) => { const pts = []; for(let a = -84; a <= 84; a += 14){ const y = y0 + 9 * a / 360 + dy; if(y > .25 && y < HT - .25) pts.push(L.on(a, y)); } return pts; };
    const seams = [3.6, 8.1].map(y0 => helix(y0)).filter(p => p.length > 1);
    const hi = [3.6, 8.1].map(y0 => helix(y0, -.42)).filter(p => p.length > 1);
    const op = L.full(R0 - .3, HT, 20), rim = L.full(R0, HT, 20);
    const inner = a => P([(R0 - .3) * sin(a), HT, (R0 - .3) * cos(a)]);
    put('i_wcguriga', { hu:'WC-papír guriga', en:'empty cardboard toilet paper tube with a spiral seam', tilt:TILT }, [
      pth('cardboard', 'base', [L.sil]),                                                   // henger (alap)
      det('cardboard', 'light', L.strip(-90, -50, 0, HT)),                                 // fény felőli csík
      det('cardboard', 'dark', L.strip(32, 90, 0, HT)),                                    // árnyékos oldal
      det('cardboard', 'line', L.strip(70, 90, 0, HT), { o:.4 }),                          // legsötétebb élsáv
      dpth('cardboard', 'dark', seams.map(p => band(p, 1.5, false))),                      // spirális varrat
      dpth('cardboard', 'light', hi.map(p => band(p, .7, false))),                         // a varrat világos pereme
      face('paper', 'base', L.wrap([[-62, 8.2], [8, 10.0], [10, 8.9], [2, 8.3], [-6, 8.8], [-14, 7.7], [-24, 8.1], [-34, 7.0], [-44, 7.4], [-54, 6.4], [-62, 6.9]])),   // ráragadt papírfoszlány a varraton
      det('paper', 'dark', L.wrap([[-60, 7.1], [-54, 6.6], [-44, 7.6], [-34, 7.2], [-24, 8.3], [-14, 7.9], [-6, 9.0], [2, 8.5], [9, 9.0], [8, 9.5], [-52, 7.6]]), { o:.9 }),
      face('cardboard', 'light', rim),                                                     // perem
      det('cardboard', 'dark', op),                                                        // nyílás: a belső hátsó fal
      det('cardboard', 'base', [...Array.from({ length:8 }, (_, i) => inner(-40 + 160 * i / 7)), ...Array.from({ length:8 }, (_, i) => { const p = inner(120 - 160 * i / 7); const c = P([0, HT, 0]); return lerp(c, p, .55); })]),   // megvilágított belső fal
      det('cardboard', 'line', [...Array.from({ length:7 }, (_, i) => inner(150 + 90 * i / 6)), ...Array.from({ length:7 }, (_, i) => { const p = inner(240 - 90 * i / 6), c = P([.4, HT, -.2]); return lerp(c, p, .35); })], { o:.5 }),   // árnyék a perem alatt
      shine([L.strip(-66, -58, 1.0, HT - 1.2, 2)], .6),
    ]);
  }

  //  5. Csomagolópapír – összegyűrt, matt barna kraft papír: lapokra tört gombóc két kiálló papírsarokkal, rajta egy piros-fehér zsineg
  {
    const TILT = -8, AZ = 20, EL = 24;
    const cr0 = { rx:7.4, ry:6.2, rz:6.4, amp:.16, seed:21, nl:5, nm:8, az:AZ, el:EL, spikes:[[1, 3, 1.25], [3, 6, 1.28], [4, 1, 1.22]] };
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit:[[-10, -4, 4], [10, 8, 0], [-8, 7, 0], [9, -7, 4], [-8, -7, 4]] });
    const C = crumple(P, cr0);
    const flapA = [[3.6, 5.4, -1], [9.6, 6.6, -1.5], [7.0, 1.0, .5]].map(P), flapAf = [[3.6, 5.4, -1], [9.6, 6.6, -1.5], [6.6, 3.6, 0]].map(P);
    const flapB = [[-6.6, -1.2, 3], [-9.4, -5.8, 3.6], [-2.2, -5.9, 2.6]].map(P), flapBf = [[-9.4, -5.8, 3.6], [-2.2, -5.9, 2.6], [-5.6, -3.4, 3.2]].map(P);
    const surf = (lat, lon, f = 1.06) => P([cr0.rx * cos(lat) * sin(lon) * f, cr0.ry * sin(lat) * f, cr0.rz * cos(lat) * cos(lon) * f]);
    const twine = [P([-7.4, 4.6, 1.5]), P([-7.6, 6.2, .5]), P([-6.0, 6.6, .5]), ...Array.from({ length:9 }, (_, i) => surf(46 - 88 * i / 8, -62 + 118 * i / 8)), P([6.0, -5.2, 3.2]), P([7.4, -6.2, 2.8]), P([8.4, -5.4, 2.2])];
    put('i_csomagolopapir', { hu:'Csomagolópapír', en:'crumpled brown kraft wrapping paper with a piece of string', tilt:TILT }, [
      face('cardboard', 'light', flapA),                                                   // kiálló papírsarok (hátul)
      det('cardboard', 'dark', inset(flapAf, flapA)),
      face('cardboard', 'base', flapB),                                                    // kiálló papírsarok (elöl, lent)
      det('cardboard', 'light', inset(flapBf, flapB)),
      pth('cardboard', 'base', [C.sil]),                                                   // gombóc (alap)
      dpth('cardboard', 'light', C.tone(s => s > .5)),                                     // fény felé forduló lapok
      dpth('cardboard', 'dark', C.tone(s => s <= .08 && s > -.3)),                         // árnyékos lapok
      dpth('cardboard', 'line', C.tone(s => s <= -.3), { o:.55 }),                         // legsötétebb lapok
      dpth('cardboard', 'line', C.creases.slice(0, 8).map(c => band(c.pts, .75, false)), { o:.4 }),   // gyűrődés-élek
      dpth('cardboard', 'dark', Array.from({ length:12 }, (_, i) => { const r = rng(40 + i); r(); const p = surf(-50 + 100 * r(), -60 + 120 * r(), .95); return circ(p[0], p[1], .45, 5); }), { o:.45 }),   // rostszálak
      pth('paper', 'base', [band(twine, 1.7, true)]),                                      // zsineg
      dpth('red', 'base', dashes(twine, 2.4, 1.7)),                                        // piros csíkok a zsinegen
      shine([band([surf(40, -80, .98), surf(55, -50, .98), surf(60, -20, .98)], 1.3, true)], .45),
    ]);
  }

  // =====================================================================
  //  MŰANYAG ÉS FÉM
  // =====================================================================

  //  6. Tejfölös doboz – ÜRES, kiöblített, széles-alacsony fehér pohár kék sávval; belül látszik az üres alja és egy-két vízcsepp;
  //     a kék fedele mögötte a dobozhoz támasztva
  {
    const TILT = -8, TOP = 5.7, EL = 40, prof = [[4.0, 0], [4.1, .3], [4.8, 5.1], [5.15, 5.1], [5.15, TOP]];
    const LC = [4.6, 5.6, -3.2], LN = n3([-.25, .38, .9]), E1 = n3(cross([0, 1, 0], LN)), E2 = cross(LN, E1);
    const lidPt = (r, a, h) => [0, 1, 2].map(i => LC[i] + r * cos(a) * E1[i] + r * sin(a) * E2[i] + h * LN[i]);
    const fit = [...Array.from({ length:12 }, (_, i) => [5.15 * sin(i * 30), 0, 5.15 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, TOP, z]]), ...Array.from({ length:12 }, (_, i) => lidPt(5.4, i * 30, 0))];
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit }), L = lathe(P, prof);
    const lidRing = (r, h, n = 20) => Array.from({ length:n }, (_, i) => P(lidPt(r, 360 * i / n, h)));
    const openR = 4.72, op = L.full(openR, TOP, 24);
    const floor = clip(L.full(4.0, .35, 20), op);
    const shadow = clip([...L.ring(openR, TOP, -150, -10, 10), ...L.ring(openR, TOP - 3.6, -10, -150, 10).map(p => [p[0] + 1.2, p[1]])], op);
    const drop = (a, y, s) => { const q = L.on(a, y, -.5), k = P.k * s; return [[q[0], q[1] - 1.5 * k], ...Array.from({ length:7 }, (_, i) => [q[0] + .6 * k * cos(-20 + 220 * i / 6), q[1] + .6 * k * sin(-20 + 220 * i / 6)])]; };
    const lidRim = lidRing(3.9, .36, 16);
    put('i_tejfolos', { hu:'Tejfölös doboz', en:'empty rinsed wide low sour cream tub with its lid leaning behind', tilt:TILT }, [
      face('sky', 'dark', hull([...lidRing(5.3, -.35), ...lidRing(5.3, .35)])),              // fedél pereme
      face('sky', 'base', lidRing(5.1, .35)),                                                // fedél teteje
      dpth('sky', 'light', [band([...lidRim, lidRim[0]], 1.1, false)]),                      // domború gyűrű a fedélen
      pth('white', 'base', [L.sil]),                                                         // pohár (alap)
      det('white', 'light', L.strip(-90, -50, 0, 5.1)),
      det('white', 'dark', L.strip(30, 90, 0, 5.1)),
      det('white', 'line', L.strip(68, 90, 0, 5.1), { o:.3 }),
      det('blue', 'base', inset([...L.ring(L.rAt(1.2), 1.2, -90, 90, 10), ...L.ring(L.rAt(3.6), 3.6, 90, -90, 10)], L.sil)),   // kék sáv
      det('blue', 'dark', inset([...L.ring(L.rAt(1.2), 1.2, 34, 90, 5), ...L.ring(L.rAt(3.6), 3.6, 90, 34, 5)], L.sil)),
      face('white', 'light', L.full(5.15, TOP, 24)),                                         // perem
      face('white', 'base', op, { line:false }),                                             // üres belső hátfal (fényben)
      det('white', 'light', floor),                                                          // az üres alja
      det('white', 'dark', shadow),                                                          // a perem árnyéka a bal belső falon
      dpth('water', 'light', [drop(150, 3.2, 1), drop(172, 2.2, .75)]),                      // kiöblítés után maradt cseppek
      shine([inset([L.on(-64, .8), L.on(-54, .8), L.on(-52, 4.6), L.on(-62, 4.6)], L.sil)], .8),
    ]);
  }

  //  7. Mosószeres flakon – nagy, zömök türkiz flakon: a vállból kinövő, lyukas fogantyú, széles kék bordázott adagoló kupak,
  //     üres (felirat nélküli) címke hullámmal és buborékokkal
  {
    const TILT = -10, AZ = 30, EL = 20, Z = 5;
    const bodyP = [[-6.2, 0], [6.2, 0], [6.9, .6], [7, 1.2], [7, 17.2], [6.6, 18.4], [5.4, 19], [-5.4, 19], [-6.6, 18.4], [-7, 17.2], [-7, 1.2], [-6.9, .6]];
    const handP = [[.8, 18.2], [6.8, 18.2], [6.9, 22.8], [6.2, 24.6], [4.4, 25.3], [2.2, 25.1], [1.0, 24.0], [.5, 21.8]];
    const hole = rr(2.3, 18.9, 5.4, 23.3, 1.2);
    const P = camera({ az:AZ, el:EL, F:80, tilt:TILT, span:80, fit:[...bodyP.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), [4, 25.3, -2.6], [-3.6, 24, 1]] });
    const B = extrude(P, bodyP, -Z, Z, AZ, EL), Hd = extrude(P, handP, -3.2, .2, AZ, EL);
    const holeF = hole.map(([x, y]) => P([x, y, .2])), holeB = hole.map(([x, y]) => P([x, y, -3.2]));
    const F = pts => pts.map(([x, y]) => P([x, y, Z]));
    const cap = lathe(v => P([v[0] - 3.4, v[1], v[2] + 1]), [[2.9, 18.6], [3.2, 19.2], [3.2, 23.4], [2.95, 23.9]]);
    put('i_mososzer', { hu:'Mosószeres flakon', en:'big turquoise laundry detergent jug with handle and blue measuring cap', tilt:TILT }, [
      pth('teal', 'dark', [Hd.sil]),                                                         // fogantyú (oldala)
      det('teal', 'light', inset(envelope(Hd.tone(s => s > .2), .5), Hd.sil)),               // fogantyú teteje
      face('teal', 'base', Hd.front),                                                        // fogantyú eleje
      det('teal', 'dark', holeF),                                                            // a fogantyú lyukának belső fala
      det('white', 'light', clip(holeF, holeB)),                                             // átlátni a lyukon
      pth('teal', 'base', [B.sil]),                                                          // test
      dpth('teal', 'light', B.tone(s => s > .2)),                                            // váll, teteje (fény)
      dpth('teal', 'dark', B.tone(s => s <= .2)),                                            // jobb oldala (árnyék)
      face('teal', 'base', B.front),                                                         // eleje
      det('teal', 'line', inset(F([[-6.2, 0], [6.2, 0], [6.9, .6], [7, 1.2], [7, 1.6], [-7, 1.6], [-7, 1.2], [-6.9, .6]]), B.sil), { o:.4 }),   // talp élsáv
      det('white', 'light', F(rr(-5.6, 3.4, 5.2, 14.4, 1.3))),                               // üres címke
      det('sky', 'base', F([[-5.2, 3.8], [4.8, 3.8], [5.2, 4.6], [5.2, 7.2], [3.2, 7.9], [1.0, 7.0], [-1.2, 7.9], [-3.4, 7.1], [-5.6, 7.8], [-5.6, 4.6]])),   // hullám a címkén
      dpth('sky', 'dark', [circ(-2.8, 10.8, 1.4, 10), circ(.8, 12.2, .85, 8), circ(2.4, 9.8, .6, 8)].map(F)),   // buborékok
      pth('blue', 'base', [cap.sil]),                                                        // széles adagoló kupak
      det('blue', 'dark', cap.strip(28, 90, 18.6, 23.9)),
      dpth('blue', 'line', [-72, -50, -28, -6, 16, 38, 60].map(a => band([cap.on(a, 19.6), cap.on(a, 23.0)], .8, false)), { o:.45 }),   // bordázás
      face('blue', 'light', cap.full(2.95, 23.9, 18)),                                       // kupak teteje
      shine([F([[-6.5, 2.2], [-6.0, 2.2], [-6.0, 16.6], [-6.5, 16.6]]), cap.strip(-74, -62, 19.4, 23.2, 2)], .6),
    ]);
  }

  //  8. Alufólia – összegyűrt, lapokra tört ezüst gombóc: éles fényes és sötét lapok, égkék tükröződés, csillanások
  {
    const TILT = 10, AZ = 10, EL = 20;
    const cr0 = { rx:5.4, ry:5, rz:5.2, amp:.26, seed:33, nl:5, nm:9, az:AZ, el:EL, spikes:[[2, 1, 1.32], [1, 5, 1.3], [4, 3, 1.26], [3, 7, 1.24]] };
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit:[[-7, 0, 0], [7, 0, 0], [0, 7, 0], [0, -7, 0]] });
    const C = crumple(P, cr0), c0 = P([-2.4, 2.4, 4.4]), c1 = P([2.2, -1.6, 4.6]), o = P([0, 0, 0]);
    const glint = (x, y, r) => [[x, y - r], [x + r * .2, y - r * .2], [x + r, y], [x + r * .2, y + r * .2], [x, y + r], [x - r * .2, y + r * .2], [x - r, y], [x - r * .2, y - r * .2]];
    put('i_alufolia', { hu:'Alufólia', en:'crumpled faceted ball of aluminium foil', tilt:TILT }, [
      pth('steel', 'base', [C.sil]),                                                         // gombóc (alap)
      dpth('steel', 'light', C.tone(s => s > .5 && s <= .74)),                              // világos lapok
      dpth('paper', 'light', C.tone(s => s > .74)),                                          // legfényesebb lapok
      dpth('sky', 'light', C.tone(s => s > .28 && s <= .5)),                       // égkék tükröződés
      dpth('steel', 'dark', C.tone(s => s <= .05 && s > -.35)),                              // sötét lapok
      dpth('steel', 'line', C.tone(s => s <= -.35), { o:.7 }),                               // legsötétebb lapok
      dpth('steel', 'line', C.creases.slice(0, 10).map(c => band(c.pts, .6, false)), { o:.45 }),   // éles gyűrődések
      dpth('paper', 'light', C.creases.filter(c => c.s > .45).slice(0, 6).map(c => band(c.pts, .8, false)), { o:.9 }),   // fényes élek
      shine([glint(c0[0], c0[1], 5.6), glint(c1[0], c1[1], 3.8)], 1),                        // csillanások
      det('steel', 'line', inset(C.sil.filter(p => p[1] > o[1] + 2 && p[0] > o[0] - 6), C.sil, 1.2), { o:.3 }),   // alsó élsáv
    ]);
  }

  //  9. Fém kupak, tető – fogazott szélű ezüst koronazár egy felfordított arany befőttesüveg-tetőnek támasztva:
  //     a tető belsejében a fehér lakk, a szürke tömítőgyűrű és a zár-fülek (így nem pénzérme)
  {
    const TILT = 8, AZ = 14, EL = 36;
    const LC = [-1.4, 0, -1.4], LR = 3.4, LH = 1.5;
    const TH = 44, CC = [2.7, 1.25, 2.3];
    const cw = ([x, y, z]) => [CC[0] + x, CC[1] + y * cos(TH) - z * sin(TH), CC[2] + y * sin(TH) + z * cos(TH)];   // koronazár: helyi → világ
    const fit = [...Array.from({ length:12 }, (_, i) => [LC[0] + LR * sin(i * 30), 0, LC[2] + LR * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, LH, z]]),
      ...Array.from({ length:12 }, (_, i) => cw([1.66 * sin(i * 30), 0, 1.66 * cos(i * 30)]))];
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit });
    const LD = lathe(v => P([v[0] + LC[0], v[1], v[2] + LC[2]]), [[3.2, 0], [LR, .3], [LR, LH]]);
    const lp = (r, a, y) => P([LC[0] + r * sin(a), y, LC[2] + r * cos(a)]), ell = (r, y, n = 24) => Array.from({ length:n }, (_, i) => lp(r, 360 * i / n, y));
    const open = ell(3.05, LH), floor = clip(ell(3.0, .2), open);
    const fshadow = clip([...Array.from({ length:9 }, (_, i) => lp(3.0, 110 + 150 * i / 8, .2)), ...Array.from({ length:9 }, (_, i) => lp(2.2, 260 - 150 * i / 8, .2)).map(p => [p[0] + 1.2, p[1] - .6])], open);
    const lugs = [120, 200, 280, 20].map(a => [lp(3.05, a - 9, LH), lp(3.05, a + 9, LH), lp(2.6, a + 7, LH - .1), lp(2.6, a - 7, LH - .1)]);
    const N = 21, teeth = Array.from({ length:2 * N }, (_, i) => { const a = 360 * i / (2 * N), r = i % 2 ? 1.47 : 1.66; return P(cw([r * sin(a), i % 2 ? .1 : 0, r * cos(a)])); });
    const ctop = Array.from({ length:20 }, (_, i) => P(cw([1.33 * sin(18 * i), .62, 1.33 * cos(18 * i)])));
    const cring = Array.from({ length:17 }, (_, i) => P(cw([1.06 * sin(21.2 * i), .63, 1.06 * cos(21.2 * i)])));
    const flutes = Array.from({ length:N }, (_, i) => { const a = 360 * (i + .5) / N; return band([P(cw([1.36 * sin(a), .58, 1.36 * cos(a)])), P(cw([1.5 * sin(a), .08, 1.5 * cos(a)]))], .55, false); });
    const cdark = Array.from({ length:2 * N }, (_, i) => i).filter(i => { const a = 360 * i / (2 * N); return a > 20 && a < 200; }).map(i => teeth[i]);
    put('i_femkupak', { hu:'Fém kupak, tető', en:'serrated metal crown bottle cap leaning on an upturned golden jar lid', tilt:TILT }, [
      pth('gold', 'base', [LD.sil]),                                                         // tető külső pereme (arany)
      det('gold', 'dark', LD.strip(30, 90, 0, LH)),
      det('gold', 'line', LD.strip(66, 90, 0, LH), { o:.45 }),
      face('gold', 'light', ell(LR, LH)),                                                    // felső, pödört perem
      det('steel', 'base', open),                                                            // belső fal (fehér lakk)
      det('white', 'light', floor),                                                          // a tető belseje
      dpth('cream', 'dark', [band([...ell(2.6, .22, 22), lp(2.6, 0, .22)], 1.4, false)]),     // szürkés tömítőgyűrű
      dpth('steel', 'dark', [band([...ell(1.1, .22, 14), lp(1.1, 0, .22)], .7, false)]),      // „pattanó” gomb pereme
      det('steel', 'dark', fshadow, { o:.6 }),                                               // a perem árnyéka belül
      dpth('gold', 'dark', lugs),                                                            // zár-fülek
      face('steel', 'base', teeth),                                                          // koronazár: fogazott szoknya
      det('steel', 'dark', inset([...cdark, ...ctop.filter((_, i) => i > 1 && i < 11).reverse()], teeth, .6)),   // árnyékos alsó rész
      dpth('steel', 'line', flutes, { o:.5 }),                                               // a fogak közti hajtások
      face('steel', 'light', ctop),                                                          // koronazár teteje
      dpth('steel', 'base', [band([...cring, cring[0]], .7, false)]),                        // domborított perem a tetején
      shine([circ(...P(cw([-.55, .64, .45])), .7, 8, .45, -30), band([lp(LR, 200, LH + .02), lp(LR, 225, LH + .02), lp(LR, 250, LH + .02)], 1.0, true)], .8),
    ]);
  }

  //  10. Műanyag szatyor – vékony, gyűrött, áttetsző „trikós” zacskó két füllel: oldalhajtás, gyűrődések, hátsó fül átdereng
  {
    const TILT = -8;
    const body = [[22, 88], [30, 91.5], [40, 88.5], [50, 92], [60, 89], [70, 92.5], [79, 89.5], [80.5, 70], [84, 62], [80, 48], [82.5, 20], [79, 12.5], [72.5, 12], [69, 18], [67.5, 39], [60, 45.5], [50, 47], [40, 45], [32.5, 39], [31, 17], [27.5, 11.5], [21, 12.5], [18.5, 19], [17.5, 48], [14.5, 60], [19.5, 71]];
    const back = [[24, 60], [26, 16], [31, 8.5], [37, 9], [39.5, 15], [40, 34], [50, 38], [60, 34], [61, 15], [64, 8], [71, 8], [75, 15], [76, 60]];
    const inside = [[32.5, 39], [40, 45], [50, 47], [60, 45.5], [67.5, 39], [61, 33.6], [50, 37.6], [40, 33.6]];
    put('i_szatyor', { hu:'Műanyag szatyor', en:'thin crumpled translucent plastic carrier bag with handles', tilt:TILT }, [
      face('white', 'dark', back),                                                           // hátsó lap a füleivel
      det('sky', 'dark', inset(inside, back), { o:.4 }),                                     // a zacskó belseje
      face('white', 'base', body),                                                           // első lap
      dpth('sky', 'base', [[[18.6, 22], [22.6, 18], [24.2, 48], [22.8, 70], [20, 70], [15.8, 60], [18.6, 48]], [[81.4, 22], [77.4, 17], [76.4, 48], [78.4, 60], [77.6, 86], [79.6, 88], [80.2, 70], [83, 62], [79.2, 48]]], { o:.55 }),   // oldalhajtás (átlátszó kék árnyék)
      dpth('white', 'light', [[[26, 50], [44, 52], [30, 76]], [[48, 56], [66, 50], [58, 70]], [[22.5, 14.5], [27, 13.5], [29.5, 34], [26, 44]]]),   // fény felé forduló gyűrődés-lapok
      dpth('sky', 'dark', [[[44, 52], [48, 56], [58, 70], [52, 86], [30, 76]], [[66, 50], [76, 64], [70, 84], [58, 70]]], { o:.28 }),   // árnyékos gyűrődés-lapok
      dpth('white', 'line', [[[44, 52], [30, 76], [26, 86]], [[48, 56], [58, 70], [70, 84]], [[66, 50], [58, 70], [52, 86]], [[73.5, 16], [70.5, 34]]].map(p => band(p, .9, false)), { o:.4 }),   // gyűrődés-vonalak
      dpth('white', 'dark', [band([[39.5, 44.8], [40, 34.5], [50, 38.5], [60, 34.5], [60.6, 45]], 1.4, false)], { o:.55 }),   // a hátsó lap pereme átdereng
      lin('white', 'line', [[24, 83.5], [40, 84.5], [60, 84], [76, 85]], 1, { o:.45 }),      // hegesztési varrat az alján
      shine([band([[24, 24], [25, 44]], 1.8, true), band([[62, 58], [70, 55]], 1.6, true)], .9),
    ]);
  }

  // =====================================================================
  //  ÜVEG
  // =====================================================================
  // forgástest-üveg illesztése: a gyűrűk pontjai a kamera fit-jéhez
  const lathFit = (prof, n = 12) => prof.flatMap(([r, y]) => Array.from({ length:n }, (_, i) => [r * sin(360 * i / n), y, r * cos(360 * i / n)]));
  const ringBand = (L, r, y, w, n = 20) => { const p = L.full(r, y, n); return band([...p, p[0], p[1]], w, false); };   // zárt ellipszis-vonal

  //  11. Pezsgősüveg – sötétzöld, nehéz, gömbölyű vállú üres palack; a nyakán szakadt arany fólia, a dugó már nincs benne
  {
    const TILT = 12, FO = 24.4, TOP = 29.9;
    const prof = [[4.1, 0], [4.45, .5], [4.5, 1.5], [4.5, 15.2], [4.35, 17.4], [3.8, 19.8], [2.9, 22.0], [2.0, 23.9], [1.55, 25.4], [1.5, 28.4], [1.75, 28.7], [1.8, 29.6], [1.6, TOP]];
    const P = camera({ az:0, el:14, tilt:TILT, span:82, fit:lathFit(prof) }), L = lathe(P, prof), k = P.k;
    const torn = Array.from({ length:17 }, (_, i) => { const a = 90 - 180 * i / 16; return L.on(a, FO + (i % 2 ? .75 : 0) + (i % 4 === 1 ? .35 : 0)); });
    const foil = inset([...L.ring(L.rAt(TOP - .05), TOP - .05, -90, 90, 10), ...L.wrap([[90, 28.7], [90, 26]]), ...torn, ...L.wrap([[-90, 26], [-90, 28.7]])], L.sil);
    put('i_pezsgo', { hu:'Pezsgősüveg', en:'empty dark green champagne bottle with torn gold foil on the neck', tilt:TILT }, [
      pth('leaf', 'dark', [L.sil]),                                                          // sötétzöld üveg (alap)
      det('leaf', 'base', L.strip(-90, -52, .6, FO)),                                        // fény felőli csík
      det('leaf', 'line', L.strip(30, 90, .6, FO)),                                          // árnyékos oldal
      det('dark', 'dark', L.strip(66, 90, .6, FO), { o:.7 }),                                // legsötétebb élsáv
      det('dark', 'base', L.strip(-90, 90, 0, .6, 10), { o:.5 }),                            // vastag üvegtalp
      det('gold', 'base', foil),                                                             // szakadt arany fólia a nyakon
      det('gold', 'light', clip(foil, [L.on(-95, 20), L.on(-40, 20), L.on(-40, 31), L.on(-95, 31)])),
      det('gold', 'dark', clip(foil, [L.on(35, 20), L.on(95, 20), L.on(95, 31), L.on(35, 31)])),
      dpth('gold', 'line', [[[-30, 25.9], [-10, 27.6]], [[10, 25.6], [22, 26.8]], [[-44, 28.1], [-20, 29.2]]].map(p => band(L.wrap(p), .75, false)), { o:.45 }),   // gyűrődések a fólián
      face('gold', 'light', L.full(1.6, TOP, 16)),                                           // a palack szája
      det('dark', 'base', L.full(1.05, TOP, 14)),                                            // üres nyílás (a dugó hiányzik)
      shine([L.strip(-66, -58, 2.0, 16.5, 2), inset(L.wrap([[-60, 18.4], [-48, 18.4], [-40, 21.6], [-50, 21.6]]), L.sil)], .5),   // üvegfény
    ]);
  }

  //  12. Üdítős üveg – kicsi, EGYENES falú, zömök zöldeskék üdítős üveg: kerek váll, rövid nyak, koronazáras perem, kupak nélkül
  //      (nincs derék és nincsenek bordák – semmilyen védett palackformára ne hasonlítson)
  {
    const TILT = -10, TOP = 17.6;
    const prof = [[3.2, 0], [3.5, .4], [3.55, 1.2], [3.55, 9.0], [3.4, 10.6], [2.8, 12.3], [1.9, 13.6], [1.4, 14.5], [1.35, 15.9], [1.8, 16.2], [1.85, 17.2], [1.5, TOP]];
    const P = camera({ az:0, el:16, tilt:TILT, span:82, fit:lathFit(prof) }), L = lathe(P, prof);
    put('i_uditosuveg', { hu:'Üdítős üveg', en:'small empty straight-sided light green glass soda bottle without cap', tilt:TILT }, [
      pth('teal', 'light', [L.sil]),                                                         // világos zöldeskék üveg (alap)
      det('glass', 'light', L.strip(-90, -50, .6, 15.9)),                                    // fény felőli csík
      det('teal', 'base', L.strip(34, 90, .6, 15.9), { o:.75 }),                             // árnyékos oldal
      det('teal', 'dark', L.strip(68, 90, .6, 15.9), { o:.6 }),                              // legsötétebb élsáv
      det('teal', 'base', L.strip(-90, 90, 0, .6, 10), { o:.55 }),                           // vastag üvegtalp
      dpth('teal', 'base', [ringBand(L, 3.3, .7, .9, 18)], { o:.45 }),                      // a talp hátsó pereme átlátszik
      dpth('teal', 'base', [band(L.ring(L.rAt(10.2), 10.2, -84, 84, 10), .8, false)], { o:.5 }),   // öntési varrat a vállon
      det('teal', 'base', L.strip(-90, 90, 15.9, TOP, 8)),                                   // kidomborodó koronazáras perem
      dpth('teal', 'dark', [band(L.ring(1.82, 16.25, -84, 84, 8), .7, false)], { o:.6 }),
      face('teal', 'light', L.full(1.5, TOP, 16)),                                          // száj
      det('teal', 'dark', L.full(.95, TOP, 12)),                                             // üres nyílás
      shine([L.strip(-68, -60, 1.4, 9.8, 2), L.strip(-62, -52, 11.0, 13.0, 2), L.strip(-70, -60, 16.3, 17.2, 2)], .75),
    ]);
  }

  //  13. Bébiételes üveg – kicsi, zömök, üres üvegtégely (menetes nyak, kis sárgarépás címke), mellette a fém teteje
  {
    const TILT = -8, TOP = 7.6, EL = 22;
    const prof = [[2.9, 0], [3.2, .35], [3.3, 1.0], [3.3, 5.4], [3.0, 6.3], [2.7, 6.6], [2.7, TOP]];
    const LC = [4.9, 2.7, 2.2], LN = n3([-.05, .5, .86]), E1 = n3(cross([0, 1, 0], LN)), E2 = cross(LN, E1);
    const lidPt = (r, a, h) => [0, 1, 2].map(i => LC[i] + r * cos(a) * E1[i] + r * sin(a) * E2[i] + h * LN[i]);
    const lidRing = (r, h, n = 18) => Array.from({ length:n }, (_, i) => P(lidPt(r, 360 * i / n, h)));
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:[...lathFit(prof), ...Array.from({ length:12 }, (_, i) => lidPt(3.0, 30 * i, 0))] }), L = lathe(P, prof);
    const lidTop = lidRing(2.7, .45);
    const carrot = L.wrap([[-12, 4.4], [2, 4.2], [-4, 2.1]]), tops = L.wrap([[-9, 4.4], [-14, 5.3], [-6, 4.8], [-4, 5.5], [-2, 4.8], [3, 5.2], [-1, 4.3]]);
    put('i_bebiuveg', { hu:'Bébiételes üveg', en:'small squat empty baby food glass jar with its metal lid beside it', tilt:TILT }, [
      pth('glass', 'base', [L.sil]),                                                         // üveg (alap)
      det('glass', 'light', L.strip(-90, -50, .7, 6.6)),
      det('glass', 'dark', L.strip(32, 90, .7, 6.6)),
      det('glass', 'line', L.strip(68, 90, .7, 6.6), { o:.35 }),
      det('glass', 'dark', L.strip(-90, 90, 0, .7, 10)),                                     // vastag üvegtalp
      det('cream', 'base', L.strip(-58, 58, 1.7, 5.0, 8)),                                   // kis címke
      det('orange', 'base', carrot),                                                         // sárgarépa-kép
      det('leaf', 'base', tops),
      dpth('glass', 'line', [[[-86, 6.75], [-30, 7.0], [30, 7.25], [86, 7.45]], [[-86, 7.2], [-40, 7.4]]].map(p => band(L.wrap(p), .7, false)), { o:.45 }),   // menet a nyakon
      face('glass', 'light', L.full(2.7, TOP, 18)),                                          // perem
      det('glass', 'dark', L.full(2.3, TOP, 16)),                                            // üres nyílás
      shine([L.strip(-68, -60, 1.2, 5.6, 2)], .8),
      face('steel', 'base', hull([...lidRing(2.9, -.45), ...lidRing(2.9, .45)])),             // a tető pereme
      face('steel', 'light', lidTop),                                                        // tető
      det('steel', 'dark', inset([...Array.from({ length:7 }, (_, i) => P(lidPt(2.7, -60 + 25 * i, .45))), ...Array.from({ length:7 }, (_, i) => P(lidPt(2.0, 90 - 25 * i, .45)))], lidTop), { o:.7 }),   // árnyékos perem-rész a tetőn
      dpth('steel', 'dark', [band([...lidRing(1.1, .52, 14), lidRing(1.1, .52, 14)[0]], .8, false)]),   // „pattanó” gomb
    ]);
  }

  //  14. Krémes üvegtégely – kicsi, vastag falú, matt (tejüveg) kozmetikai tégely széles rózsaszín tetővel; a vastag üvegalj átlátszik
  {
    const TILT = -10, JT = 4.2, LT = 6.4, EL = 24;
    const jar = [[3.2, 0], [3.55, .3], [3.7, .9], [3.7, JT]], lid = [[3.95, JT], [4.05, JT + .2], [4.05, LT - .2], [3.85, LT]];
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:lathFit([...jar, ...lid]) }), J = lathe(P, jar), Ld = lathe(P, lid);
    const cav = lathe(P, [[2.7, 1.3], [2.9, 1.8], [2.9, JT]]);
    put('i_kremestegely', { hu:'Krémes üvegtégely', en:'small thick frosted glass cosmetic cream jar with a wide pink lid', tilt:TILT }, [
      pth('white', 'base', [J.sil]),                                                         // tejüveg (alap)
      det('white', 'dark', inset(cav.sil, J.sil, 1.6)),                                     // a vastag fal mögött a belső üreg
      det('white', 'light', J.strip(-90, -54, .3, JT)),
      det('steel', 'base', J.strip(40, 90, .3, JT), { o:.8 }),
      det('white', 'line', J.strip(72, 90, .3, JT), { o:.3 }),
      det('glass', 'base', J.strip(-90, 90, 0, 1.2, 10)),                                    // vastag, átlátszó üvegalj
      det('glass', 'dark', J.strip(34, 90, 0, 1.2, 4)),
      pth('pink', 'base', [Ld.sil]),                                                         // széles rózsaszín tető
      det('pink', 'light', Ld.strip(-90, -50)),
      det('pink', 'dark', Ld.strip(30, 90)),
      det('pink', 'line', Ld.strip(68, 90), { o:.35 }),
      face('pink', 'light', Ld.full(3.85, LT, 24)),                                          // teteje
      dpth('pink', 'base', [ringBand(Ld, 3.1, LT, 1.1)]),                                    // a tető domború gyűrűje
      shine([J.strip(-68, -60, 1.5, 3.8, 2), Ld.strip(-72, -62, JT + .5, LT - .5, 2), circ(...Ld.at(1.4, LT, -60), 1.4, 8, .7)], .8),
    ]);
  }

  //  15. Ecetes üveg – magas, karcsú, átlátszó (halványsárgás) üres üvegpalack hosszú nyakkal és parafa dugóval;
  //      az üres üveg hátsó fala és alja átlátszik
  {
    const TILT = 14, TOP = 28.6;
    const prof = [[2.4, 0], [2.6, .4], [2.65, 1.2], [2.65, 16.5], [2.45, 18.5], [1.6, 20.6], [1.05, 22.0], [1.0, 27.4], [1.2, 27.6], [1.25, 28.4], [1.05, TOP]];
    const cork = [[.92, 27.8], [1.02, 30.6], [.92, 30.9]];
    const P = camera({ az:0, el:14, tilt:TILT, span:82, fit:lathFit([...prof, ...cork]) }), L = lathe(P, prof), K = lathe(P, cork);
    put('i_ecetesuveg', { hu:'Ecetes üveg', en:'tall slim empty clear glass vinegar bottle with a cork stopper', tilt:TILT }, [
      pth('cream', 'base', [L.sil]),                                                         // halványsárgás átlátszó üveg
      det('paper', 'light', L.strip(-90, -54, .8, 27.4)),                                    // fény felőli csík
      det('cream', 'dark', L.strip(32, 90, .8, 27.4)),
      det('cream', 'line', L.strip(70, 90, .8, 27.4), { o:.3 }),
      dpth('cream', 'dark', [band(L.wrap([[48, 1.0], [48, 16.4], [40, 18.6], [30, 20.8]]), .9, false), band(L.wrap([[-44, 1.0], [-44, 16.4]]), .7, false)], { o:.55 }),   // a hátsó fal átdereng
      dpth('cream', 'dark', [ringBand(L, 2.35, .8, .9, 18)], { o:.6 }),                      // vastag üvegalj pereme
      det('cream', 'dark', L.strip(-90, 90, 27.4, TOP, 6)),                                  // száj-perem
      pth('cardboard', 'base', [K.sil]),                                                     // parafa dugó
      det('cardboard', 'dark', K.strip(28, 90, 27.8, 30.9)),
      face('cardboard', 'light', K.full(.92, 30.9, 14)),
      dpth('cardboard', 'dark', [[-40, 29.0], [0, 29.8], [20, 28.6], [-20, 30.3]].map(([a, y]) => circ(...K.on(a, y), .45, 5))),   // parafa pöttyei
      shine([L.strip(-68, -61, 1.6, 16, 2), L.strip(-64, -56, 21.8, 26.8, 2)], .9),
    ]);
  }
})();
