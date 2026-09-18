// ============================================================
//  Matricák — Szelektálj! hulladékok (i_ + azonosító), B szint (docs/rajzolas.md): kommunális, bio, sütőolaj és zsiradék
//  (papír, műanyag-fém, üveg: art-waste.js)
//  Valódi méretből (cm) vetítve (ART.geo.camera) vagy szerves formák (poláris folt + sarló-tónus), 4 éles tónus, 3/4-es nézet,
//  tömör olíva árnyék. A put() a végén középre teszi és a vászonra illeszti (a döntéssel együtt).
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

  const lathFit = (prof, n = 12) => prof.flatMap(([r, y]) => Array.from({ length:n }, (_, i) => [r * sin(360 * i / n), y, r * cos(360 * i / n)]));
  const ringBand = (L, r, y, w, n = 20) => { const p = L.full(r, y, n); return band([...p, p[0], p[1]], w, false); };   // zárt ellipszis-vonal
  // szerves formák: poláris folt (középpont, sugarak, f(fok) sugár-szorzó, forgatás) és „holdsarló” tónus-lap a körvonalán belül
  const blob = (cx, cy, rx, ry, f = () => 1, n = 36, rot = 0) => Array.from({ length:n }, (_, i) => { const t = 360 * i / n, k = f(t), x = rx * k * cos(t), y = ry * k * sin(t);
    return [cx + x * cos(rot) - y * sin(rot), cy + x * sin(rot) + y * cos(rot)]; });
  function polarR(sil, c, th){
    const dx = cos(th), dy = sin(th); let best = 0;
    for(let i = 0; i < sil.length; i++){ const a = sil[i], b = sil[(i + 1) % sil.length], ex = b[0] - a[0], ey = b[1] - a[1], den = ex * dy - dx * ey;
      if(abs(den) < 1e-9) continue; const ax = a[0] - c[0], ay = a[1] - c[1], t = (ex * ay - ax * ey) / den, u = (dx * ay - dy * ax) / den;
      if(t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = max(best, t); }
    return best;
  }
  // th0…th1 (fok, képernyőn: 0 = jobbra, 90 = le) között a körvonal fo(u)-szoros és fi(u)-szoros sugara közti sáv
  const lune = (sil, c, th0, th1, fo, fi, n = 14) => { const P = (u, f) => { const th = th0 + (th1 - th0) * u, R = polarR(sil, c, th) * f(u); return [c[0] + R * cos(th), c[1] + R * sin(th)]; };
    return [...Array.from({ length:n + 1 }, (_, i) => P(i / n, fo)), ...Array.from({ length:n + 1 }, (_, i) => P(1 - i / n, fi))]; };
  const arcIn = (w, base = .95) => [() => base, u => base - w * Math.sin(Math.PI * u)];   // sarló: kint a körvonal mentén, bent kiöblösödő

  // =====================================================================
  //  KOMMUNÁLIS (VEGYES)
  // =====================================================================

  //  16. Használt pelenka – klasszikus, kiterített eldobható pelenka 3/4-es nézetben: homokóra-forma, fehér, puha párnázott
  //      közép pöttyözéssel, halványkék derékpánt, két oldalsó ragasztófül, fodros gumis szegély a lábkivágásoknál, csillag-minta
  {
    const TILT = -10, EL = 48, LEN = 30;
    const Wd = v => 4.9 + 6.4 * ((v - 15.5) / 15.5) ** 2 - .6 * (v / LEN);              // fél-szélesség a hossz mentén (hátul szélesebb)
    const S = (x, v) => [x, .9 * min(1, abs(x) / Wd(v)) ** 4, v - LEN / 2];                   // a szélek kissé felhajlanak
    const vs = Array.from({ length:21 }, (_, i) => LEN * i / 20);
    const outline = [...vs.map(v => S(-Wd(v), v)), ...vs.slice().reverse().map(v => S(Wd(v), v))];
    const tabs = [-1, 1].map(s => [[s * (Wd(.8) - .8), .8], [s * 13.6, 1.0], [s * 15.4, 1.8], [s * 16.0, 3.8], [s * 15.4, 6.0], [s * 13.4, 6.8], [s * (Wd(7.4) - .8), 7.4]]);
    const P = camera({ az:0, el:EL, F:95, tilt:TILT, span:80, fit:[...outline, ...tabs.flat().map(([x, v]) => S(x, v))] });
    const M = pts => pts.map(([x, v]) => P(S(x, v)));
    const sil = M([...vs.map(v => [-Wd(v), v]), ...vs.slice().reverse().map(v => [Wd(v), v])]);
    const pv = vs.filter(v => v > 3.8 && v < 27.5), pad = M([...pv.map(v => [-(Wd(v) - 2.2), v]), ...pv.slice().reverse().map(v => [Wd(v) - 2.2, v])]);
    const ruffle = s => band(M(Array.from({ length:17 }, (_, i) => { const v = 8 + 15 * i / 16; return [s * (Wd(v) - 1.0 - (i % 2 ? .5 : 0)), v]; })), 1.5, false);
    const ribs = Array.from({ length:9 }, (_, i) => { const x = -8.8 + 2.2 * i; return band(M([[x, .9], [x, 3.0]]), .7, false); });
    const dots = [[-2, 8], [1.6, 10], [-1.2, 13.5], [1.4, 16], [-1.4, 18.5], [.8, 21.5], [-1, 24.5], [2.4, 6.6], [-2.4, 11.2], [1.4, 25.6]].map(([x, v]) => M(circ(x, v, .42, 6)));
    const stars = [[-8.4, 5.4], [8.2, 4.6], [-8.8, 26.4], [8.6, 27.2], [-5.4, 28.2], [5.2, 28.4], [0, 28.6]].map(([x, v]) => star(...P(S(x, v)), 2.1, .95, 5));
    put('i_pelenka', { hu:'Használt pelenka', en:'unrolled white disposable diaper with pale blue waistband, side tape tabs and ruffled leg cuffs', tilt:TILT }, [
      pth('sky', 'base', tabs.map(M)),                                                       // oldalsó ragasztófülek
      dpth('sky', 'dark', tabs.map(t => M([t[3], t[4], t[5], t[6], [t[0][0], 4.2]]))),                 // a fülek árnyékos fele
      dpth('white', 'light', [-1, 1].map(s => M([[s * 13.4, 2.4], [s * 15.0, 2.6], [s * 15.0, 5.2], [s * 13.4, 5.6]]))),   // tépőzár-csík
      face('white', 'base', sil),                                                            // homokóra-formájú pelenka
      det('white', 'dark', inset(M([...vs.map(v => [Wd(v) * .72, v]), ...vs.slice().reverse().map(v => [Wd(v), v])]), sil)),   // felhajló jobb szél (árnyék)
      det('white', 'line', inset(M([...vs.slice(12).map(v => [Wd(v) * .9, v]), ...vs.slice(12).reverse().map(v => [Wd(v), v]), [Wd(LEN) * .2, LEN], [Wd(LEN) * .9, LEN]]), sil), { o:.3 }),   // legsötétebb élsáv
      det('white', 'light', pad),                                                            // puha, párnázott közép
      dpth('sky', 'light', dots),                                                            // steppelt pöttyök a párnán
      dpth('sky', 'base', stars),                                                            // halványkék csillag-minta
      dpth('steel', 'dark', [ruffle(-1), ruffle(1)], { o:.75 }),                             // fodros gumis lábszegély
      det('sky', 'base', inset(M([[-Wd(.4), .4], [Wd(.4), .4], [Wd(3.4), 3.4], [-Wd(3.4), 3.4]]), sil)),   // halványkék derékpánt (hátul)
      dpth('sky', 'dark', ribs, { o:.6 }),                                                   // a derékpánt bordái
      det('sky', 'light', inset(M([[-Wd(27.8) + .6, 27.8], [Wd(27.8) - .6, 27.8], [Wd(29.6), 29.6], [-Wd(29.6), 29.6]]), sil)),   // elülső pánt
      shine([band(M([[-9.2, 8], [-7.6, 11.6], [-6.4, 14.2]]), 1.6, true)], .9),
    ]);
  }

  //  17. Porszívózsák – teli, domborodó szürke papírzsák: kartonlap-gallér gumis lyukkal, hajtott alsó varrat, poros foltok
  {
    const TILT = -8;
    const C4 = [[18, 20], [80, 13], [86, 82], [22, 89]], bulge = [6.5, 6, 6.5, 6];
    const edge = (a, b, bl, n = 8) => { const m = lerp(a, b, .5), dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy), q = [m[0] + dy / l * bl, m[1] - dx / l * bl];
      return Array.from({ length:n }, (_, i) => { const t = i / n; return lerp(lerp(a, q, t), lerp(q, b, t), t); }); };
    const pillow = C4.flatMap((a, i) => edge(a, C4[(i + 1) % 4], -bulge[i]));
    const c = [52, 52];
    const collar = [[34, 22], [68, 18], [70, 47], [36, 51]], side = collar.map(([x, y]) => [x + 2.4, y + 2.2]);
    const hc = [52.2, 35], ring = blob(hc[0], hc[1], 9.2, 8.6, () => 1, 18), holeIn = blob(hc[0] + .6, hc[1] + .5, 5.6, 5.2, () => 1, 14);
    const seamTop = edge([22, 89], [86, 82], 6, 10).slice(1).reverse(), seam = [...edge([23, 83], [85, 76], 6.2, 10), [85, 76], ...seamTop, [22, 89]];
    const rnd = rng(9);
    put('i_porszivozsak', { hu:'Porszívózsák', en:'full bulging grey paper vacuum cleaner bag with a cardboard collar and hole', tilt:TILT }, [
      pth('steel', 'base', [pillow]),                                                        // teli zsák (alap)
      det('steel', 'light', lune(pillow, c, 150, 290, ...arcIn(.34))),                       // fény felőli domború rész
      det('steel', 'dark', lune(pillow, c, -40, 110, ...arcIn(.26))),                        // árnyékos domborulat
      det('steel', 'line', lune(pillow, c, -10, 95, ...arcIn(.08, .96)), { o:.35 }),         // legsötétebb élsáv
      det('steel', 'light', inset(seam, pillow)),                                            // visszahajtott alsó varrat
      dpth('steel', 'dark', Array.from({ length:9 }, (_, i) => { const p = lerp([26, 85.5], [82, 79], (i + .5) / 9); return band([[p[0] - 1, p[1] - 2], [p[0] + 1, p[1] + 2]], .9, false); })),   // préselt varrat-bordák
      dpth('steel', 'dark', Array.from({ length:11 }, () => blob(26 + rnd() * 52, 56 + rnd() * 20, .9 + rnd() * .8, .8 + rnd() * .5, () => 1, 7)), { o:.5 }),   // porfoltok
      face('cardboard', 'dark', hull([...collar, ...side])),                                 // kartonlap vastagsága
      face('cardboard', 'base', collar),                                                     // kartonlap-gallér
      det('cardboard', 'light', inset([[34, 22], [68, 18], [67.6, 22], [38, 25.6], [39.4, 48], [36, 51]], collar)),   // a lap fényes pereme
      mk('poly', 'dark', 'base', [ring], { d:true }),                                        // gumi-tömítés
      det('dark', 'dark', holeIn),                                                           // a lyuk
      dpth('dark', 'light', [0, 60, 120].map(a => band([[hc[0] + 4.6 * cos(a), hc[1] + 4.3 * sin(a)], [hc[0] - 4.6 * cos(a), hc[1] - 4.3 * sin(a)]], .9, false))),   // bevágott gumi-membrán
      det('steel', 'dark', blob(hc[0] + 2, hc[1] + 16, 7, 2.8, t => 1 + .15 * sin(3 * t), 12), { o:.45 }),   // por a gallér alatt
      shine([band([[27, 30], [25.6, 46], [26.6, 60]], 2.2, true)], .6),
    ]);
  }

  //  18. Rágógumi – rózsaszín, megrágott gumi-pamacs fognyomokkal egy kis, szakadt szélű csomagolópapíron (fólia-belsővel)
  {
    const TILT = 10, AZ = 12, EL = 48;
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit:[[-7, 0, -3], [7, 0, -3], [7, 0, 3], [-7, 0, 3], [0, 4, 0]] }), k = P.k;
    const torn = Array.from({ length:9 }, (_, i) => [6.2 + (i % 2 ? .75 : 0) - (i % 3 === 0 ? .3 : 0), 2.6 - 5.2 * i / 8]);
    const wrap = [[-6.2, 2.6], ...torn, [-6.2, -2.6]].map(([x, z]) => P([x, 0, -z]));
    const fold = [[-6.2, 2.6], [-2.6, 2.6], [-6.2, -.8]].map(([x, z]) => P([x, .15, -z])), foldIn = [[-6.2, 2.6], [-2.6, 2.6], [-6.2, -.8]].map(([x, z]) => P([x, 0, -z]));
    const stripe = [[-6.2, .5], [6.1, .5], [6.3, -.9], [-6.2, -.9]].map(([x, z]) => P([x, .01, -z]));
    const gc = P([1.2, 1.4, 0]), GR = 3.1 * k;
    const gum = blob(gc[0], gc[1], GR * 1.15, GR * .92, t => 1 + .08 * sin(3 * t + 20) + .05 * sin(5 * t + 60), 30);
    const dent = (x, y, r, a) => { const q = [gc[0] + x * k, gc[1] + y * k]; return [...Array.from({ length:7 }, (_, i) => [q[0] + r * k * cos(a + 180 * i / 6), q[1] + r * k * .6 * sin(a + 180 * i / 6)]),
      ...Array.from({ length:7 }, (_, i) => [q[0] + r * k * .8 * cos(a + 180 - 180 * i / 6), q[1] + r * k * .3 * sin(a + 180 - 180 * i / 6) - .25 * k])]; };
    put('i_ragogumi', { hu:'Rágógumi', en:'pink chewed gum blob on a small torn wrapper', tilt:TILT }, [
      face('paper', 'base', wrap),                                                           // csomagolópapír, szakadt széllel
      det('teal', 'light', inset(clip(stripe, hull(wrap)), wrap)),                           // mentolos csík a papíron
      det('paper', 'dark', inset(torn.map(([x, z]) => P([x - .9, 0, -z])).concat(torn.slice().reverse().map(([x, z]) => P([x, 0, -z]))), wrap), { o:.7 }),   // szakadt perem
      det('paper', 'dark', foldIn),                                                          // a visszahajtott sarok helye
      face('steel', 'light', fold.map(([x, y], i) => i === 2 ? [x + 2.2 * k, y - 3.6 * k] : [x, y])),   // felhajtott sarok: fólia-belső
      det('paper', 'line', blob(gc[0] + .8 * k, gc[1] + 2.2 * k, GR * 1.05, GR * .5, () => 1, 16), { o:.22 }),   // a gumi árnyéka a papíron
      face('pink', 'base', gum),                                                             // megrágott gumi
      det('pink', 'light', lune(gum, gc, 160, 300, ...arcIn(.42))),
      det('pink', 'dark', lune(gum, gc, -30, 120, ...arcIn(.32))),
      det('pink', 'line', lune(gum, gc, 10, 110, ...arcIn(.1, .97)), { o:.35 }),
      dpth('pink', 'line', [dent(-1.3, -.5, 1.05, 200), dent(.6, -1.2, .95, 190), dent(2.0, .3, .85, 215)], { o:.55 }),   // fognyomok
      dpth('pink', 'light', [[-1.2, .2], [.6, -.3], [1.9, .9]].map(([x, y]) => band([[gc[0] + (x - .6) * k, gc[1] + y * k], [gc[0] + (x + .6) * k, gc[1] + (y - .1) * k]], .7, true)), { o:.9 }),
      shine([blob(gc[0] - 1.8 * k, gc[1] - 1.4 * k, .7 * k, .45 * k, () => 1, 10, -25)], .9),
    ]);
  }

  //  19. Tükör – ovális, fakeretes fali tükör akasztózsinórral: sík, égkék tükörlap átlós fénycsíkokkal és egy
  //      átlósan végigfutó repedéssel (a keret mélysége és a sík fénycsíkok miatt nem ablak és nem palack)
  {
    const TILT = -8, AZ = 26, EL = 8, RX = 6.6, RY = 9.4, FW = 1.55, D = .6;
    const fit = [...Array.from({ length:16 }, (_, i) => [RX * cos(22.5 * i), RY * sin(22.5 * i), D]), [0, 12.4, -.4]];
    const P = camera({ az:AZ, el:EL, F:70, tilt:TILT, span:80, fit });
    const ov = (rx, ry, z, t0 = 0, t1 = 360, n = 24) => Array.from({ length:n }, (_, i) => P([rx * cos(t0 + (t1 - t0) * i / (t1 - t0 === 360 ? n : n - 1)), ry * sin(t0 + (t1 - t0) * i / (t1 - t0 === 360 ? n : n - 1)), z]));
    const GX = RX - FW, GY = RY - FW, G = pts => pts.map(([x, y]) => P([x, y, .35]));
    const ringSeg = (t0, t1, f0, f1) => [...ov(RX - f0, RY - f0, D, t0, t1, 10), ...ov(RX - f1, RY - f1, D, t1, t0, 10)];
    const glass = ov(GX, GY, .35, 0, 360, 24);
    const main = [[-3.9, -5.4], [-2.6, -3.6], [-.9, -2.2], [.3, .6], [2.0, 3.0], [2.9, 4.4], [3.6, 5.6]];
    const br = [[[2.0, 3.0], [.4, 4.5], [-1.1, 5.9]], [[2.0, 3.0], [3.6, 2.4], [4.6, 1.0]], [[-.9, -2.2], [-2.9, -1.4], [-4.3, -2.0]]];
    const crack = [main, ...br].map(G), hi = [main, ...br].map(p => G(p.map(([x, y]) => [x + .22, y + .22])));
    const glare = [[[-4.6, 1.2], [-3.2, 1.2], [.6, 7.8], [-.8, 7.8]], [[-4.2, -1.4], [-3.6, -1.4], [-.4, 4.2], [-1.0, 4.2]], [[1.6, -7.2], [2.4, -7.2], [4.8, -3.0], [4.0, -3.0]]].map(G).map(p => clip(p, glass));
    put('i_tukor', { hu:'Tükör', en:'oval wooden framed wall mirror with a crack across the glass', tilt:TILT }, [
      lin('cardboard', 'dark', [P([-4.6, 5.8, -.5]), P([0, 12.2, -.5]), P([4.6, 5.8, -.5])], 1.1),   // akasztózsinór
      face('steel', 'base', circ(...P([0, 12.2, -.2]), .9, 10)),                             // szög
      pth('wood', 'dark', [hull([...ov(RX, RY, D), ...ov(RX, RY, -D)])]),                    // keret oldala (mélység)
      face('wood', 'base', ov(RX, RY, D, 0, 360, 28)),                                       // keret eleje
      det('wood', 'light', ringSeg(110, 235, .5, FW - .2)),                                  // keret fény felőli íve
      det('wood', 'dark', ringSeg(-70, 60, .5, FW - .2)),                                    // keret árnyékos íve
      face('sky', 'base', glass),                                                            // tükörlap
      det('sky', 'light', lune(glass, P([0, 0, .35]), 150, 300, ...arcIn(.4))),              // fény felőli tükröződés
      det('sky', 'dark', lune(glass, P([0, 0, .35]), -30, 110, ...arcIn(.28))),              // árnyékos tükröződés
      dpth('paper', 'light', glare.filter(p => p.length > 2), { o:.8 }),                     // sík, átlós fénycsíkok
      det('sky', 'light', clip(G([[2.0, 3.0], [.3, .6], [3.4, .9], [3.6, 2.4]]), glass), { o:.9 }),   // elmozdult szilánk
      dpth('water', 'line', crack.map(p => band(p, 1.0, false))),                            // repedés
      dpth('paper', 'light', hi.map(p => band(p, .5, false)), { o:.9 }),                     // a repedés fényes éle
    ]);
  }

  //  20. Nedves törlőkendő – puha, párnás tasak felnyitott fehér pattintós fedéllel és egy kihúzott, steppelt kendővel
  {
    const TILT = -10, AZ = 24, EL = 30;
    const rrp = (w, d, r, y) => [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]]
      .flatMap(([x, z, a]) => [0, 30, 60, 90].map(t => [x + r * cos(a + t), y, z + r * sin(a + t)]));
    const R0 = rrp(14.6, 8.2, 3, 0), R1 = rrp(16, 9.4, 3.8, 2.6), R2 = rrp(14.2, 7.8, 3.2, 5.2);
    const HZ = -1.9, LA = 72, TY = 5.25, lid = (x, s) => [x, TY + s * sin(LA), HZ - s * cos(LA)];
    const wipe = [[-2.6, 5.2], [-3.3, 6.8], [-2.6, 8.4], [-1.3, 9.6], [.2, 8.9], [1.5, 10.2], [3.0, 9.1], [3.4, 7.4], [2.7, 6.0], [2.3, 5.2]];
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit:[...R0, ...R1, ...R2, lid(-3.6, 4.6), lid(3.6, 4.6), [1.5, 10.2, 0]] });
    const sil = hull([...R0, ...R1, ...R2].map(P)), top = R2.map(P);
    const right = inset(hull([...R0, ...R1, ...R2].filter(p => p[0] > 4.4 || p[2] > 3.6 && p[0] > 1.5).map(P)), sil);
    const bottom = inset(hull([...R0, ...R1.filter(p => p[2] > 3.4 || p[0] > 6)].map(P)), sil);
    const frame = rrp(8.4, 4.4, 1.2, TY + .05).map(P), slot = rrp(6, 1.8, .8, TY + .1).map(P);
    const lidP = [[-4.2, 0], [4.2, 0], [4.2, 4.4], [-4.2, 4.4]].map(([x, s]) => P(lid(x, s)));
    const W = pts => pts.map(([x, y]) => P([x, y, .1])), Fr = pts => pts.map(([x, y]) => P([x, y, 4.62 - .25 * abs(y - 2.6)]));
    const drop = [[-4.6, 4.0], ...Array.from({ length:9 }, (_, i) => [-4.6 + 1.05 * cos(-30 - 240 * i / 8 + 180), 2.5 + 1.05 * sin(-30 - 240 * i / 8 + 180) * -1])];
    put('i_torlokendo', { hu:'Nedves törlőkendő', en:'soft pack of wet wipes with an open flip lid and one wipe pulled out', tilt:TILT }, [
      pth('sky', 'base', [sil]),                                                             // puha tasak (alap)
      det('sky', 'dark', right),                                                             // árnyékos oldal
      det('sky', 'line', bottom, { o:.3 }),                                                  // legsötétebb alsó sáv
      face('sky', 'light', top),                                                             // párnás teteje
      det('white', 'light', Fr(drop)),                                                       // vízcsepp-jel az elején
      dpth('sky', 'dark', [band(Fr([[-2.4, 3.4], [1.0, 3.9], [4.4, 3.2]]), 1.1, true), band(Fr([[-2.4, 1.9], [.4, 2.3], [2.8, 1.8]]), 1.1, true)], { o:.5 }),   // díszcsíkok (felirat helyett)
      face('white', 'base', lidP),                                                           // felnyitott fedél (belső oldala)
      det('white', 'dark', inset([[-3.5, .5], [3.5, .5], [3.5, 3.8], [-3.5, 3.8]].map(([x, s]) => P(lid(x, s))), lidP, 1)),   // fedél belső pereme
      face('white', 'light', frame),                                                         // fedél-keret
      det('steel', 'dark', slot),                                                            // nyílás
      face('white', 'light', W(wipe)),                                                       // kihúzott kendő
      dpth('white', 'dark', [W([[-.2, 5.3], [.6, 8.8], [.2, 8.9], [-1.1, 5.8]]), W([[2.3, 5.2], [2.7, 6.0], [3.4, 7.4], [2.0, 6.6]])]),   // kendő-hajtások
      dpth('sky', 'base', [[-1.9, 7.2], [-.9, 8.1], [1.2, 6.8], [2.2, 8.0], [-2.2, 5.8], [.4, 6.0]].map(([x, y]) => W(circ(x, y, .28, 6)))),   // steppelt kendő-minta
      shine([inset([[-7, 3.0, 4.2], [-3, 3.0, 4.6], [-3, 3.8, 4.5], [-7, 3.8, 4.1]].map(P), sil)], .6),
    ]);
  }

  // =====================================================================
  //  BIO (KOMPOSZTÁLHATÓ)
  // =====================================================================
  // gerincvonalas levél: spine pontsor, w(t) fél-szélesség, wave(t) fodor → körvonal, két fél, barnult szegély-sávok
  function leafy(spine, w, wave = () => 0, brown = .78, from = .3){
    const n = spine.length, N = spine.map((p, i) => { const a = spine[max(0, i - 1)], b = spine[min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    const at = (i, s, f = 1) => { const t = i / (n - 1), h = w(t) * (1 + wave(t, s)) * f; return [spine[i][0] + N[i][0] * h * s, spine[i][1] + N[i][1] * h * s]; };
    const idx = [...Array(n).keys()], L = idx.map(i => at(i, 1)), Rt = idx.map(i => at(i, -1));
    const marg = s => { const ii = idx.filter(i => i / (n - 1) >= from); return [...ii.map(i => at(i, s)), ...ii.reverse().map(i => at(i, s, brown))]; };
    return { poly:[...L, ...Rt.reverse()], half:s => [...idx.map(i => at(i, s)), ...idx.slice().reverse().map(i => spine[i])], margins:[marg(1), marg(-1)],
      vein:(t0 = .05, t1 = .85, wd = 1.4) => band(idx.filter(i => i / (n - 1) >= t0 && i / (n - 1) <= t1).map(i => spine[i]), wd, false), at };
  }
  const smoothPts = (pts, n = 4) => pts.slice(0, -1).flatMap((p, i) => { const q = pts[i + 1], a = pts[max(0, i - 1)], b = pts[min(pts.length - 1, i + 2)];
    return Array.from({ length:n }, (_, j) => { const t = j / n, t2 = t * t, t3 = t2 * t;                         // Catmull–Rom
      return [0, 1].map(k => .5 * (2 * p[k] + (-a[k] + q[k]) * t + (2 * a[k] - 5 * p[k] + 4 * q[k] - b[k]) * t2 + (-a[k] + 3 * p[k] - 3 * q[k] + b[k]) * t3)); }); }).concat([pts[pts.length - 1]]);

  //  21. Almacsutka – lerágott alma: piros héjú tető a szárral és alsó rész, a két oldalán harapásnyomos, barnuló szélű
  //      krémszínű hús, középen a magház barna magokkal; az alsó rész vágott lapja felülről látszik
  {
    const TILT = 12;
    const w = y => 11.5 + 11.5 * ((y - 51) / 21) ** 2 - 2.2 * abs(sin((y - 31) * 180 / 6.8));
    const ys = Array.from({ length:21 }, (_, i) => 31 + 42 * i / 20), core = [...ys.map(y => [50 - w(y), y]), ...ys.slice().reverse().map(y => [50 + w(y), y])];
    const topCap = [[25, 33], [24.2, 25], [29, 17.6], [40, 13.4], [47.5, 15.4], [50, 17], [52.5, 15.4], [60, 13.4], [71, 17.6], [75.8, 25], [75, 33], ...blob(50, 32, 25, 4.5, () => 1, 16).slice(1, 8)];
    const botCap = [...blob(50, 72, 24.5, 5.6, () => 1, 20).slice(10, 20), [74.5, 72], [73.6, 80], [66, 87], [50, 89.6], [34, 87], [26.4, 80]];
    const seeds = [[46.6, 47, -20], [53.4, 49, 20], [49.5, 56, 0]].map(([x, y, r]) => blob(x, y, 2.3, 3.6, t => 1 - .35 * max(0, -sin(t)) ** 2, 12, r));
    const edgeL = [...ys.slice(2, -2).map(y => [50 - w(y) + .6, y]), ...ys.slice(2, -2).reverse().map(y => [50 - w(y) + 3.4, y])];
    const edgeR = [...ys.slice(2, -2).map(y => [50 + w(y) - .6, y]), ...ys.slice(2, -2).reverse().map(y => [50 + w(y) - 3.4, y])];
    put('i_almacsutka', { hu:'Almacsutka', en:'eaten apple core with stem and seeds', tilt:TILT }, [
      pth('wood', 'base', [band([[50.2, 17], [51, 10], [54.5, 4.5]], 3.2, true)]),          // szár
      face('red', 'base', botCap),                                                           // alsó héjas rész
      det('red', 'dark', inset([[60, 78], [73.6, 76], [73.6, 80], [66, 87], [50, 89.6], [40, 88.6], [56, 84]], botCap)),
      det('red', 'base', blob(50, 72, 24.5, 5.6, () => 1, 20)),                              // vágott lap héj-pereme
      det('cream', 'light', blob(50, 71.8, 22.6, 4.4, () => 1, 18)),                         // vágott lap (felülről)
      face('cream', 'base', core),                                                           // lerágott hús, harapásnyomokkal
      det('cream', 'light', [...ys.slice(1, -1).map(y => [50 - w(y) + 2, y]), ...ys.slice(1, -1).reverse().map(y => [50 - w(y) * .25, y])]),   // fény felőli hús
      det('cream', 'dark', [...ys.slice(1, -1).map(y => [50 + w(y) * .45, y]), ...ys.slice(1, -1).reverse().map(y => [50 + w(y) - 1.4, y])]),   // árnyékos hús
      dpth('cardboard', 'light', [edgeL, edgeR], { o:.75 }),                                 // barnuló harapás-szél
      det('cardboard', 'light', blob(50, 51.5, 5.8, 11, t => 1 - .25 * abs(cos(t)), 16)),    // magház
      dpth('chocolate', 'base', seeds),                                                      // magok
      face('red', 'base', topCap),                                                           // héjas tető
      det('red', 'light', inset([[24.2, 25], [29, 17.6], [40, 13.4], [44, 14.6], [34, 20], [28, 28]], topCap)),   // fény felőli rész
      det('red', 'dark', inset([[75.8, 25], [75, 33], [64, 34.5], [70, 27], [71, 17.6]], topCap)),
      shine([blob(33, 21, 3.4, 1.7, () => 1, 10, -30), blob(38, 84, 2.6, 1.2, () => 1, 8, 20), blob(46.5, 45.5, .7, 1.1, () => 1, 6)], .85),
    ]);
  }

  //  22. Száraz kenyér – két kiszáradt, repedezett kenyérszelet (nem friss vekni!), a felsőn zöld penészfoltok, körülötte morzsa
  {
    const TILT = -12, AZ = 30, EL = 16, T = .75;
    const prof = [[-5, 0], [5, 0], [5.3, 7.5], [6.2, 9.0], [6.0, 10.8], [4.6, 12.0], [2.0, 12.3], [0, 11.8], [-2.0, 12.3], [-4.6, 12.0], [-6.0, 10.8], [-6.2, 9.0], [-5.3, 7.5]];
    const off = ([x, y]) => [x + 2.6, y + 1.3];
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit:[...prof.flatMap(([x, y]) => [[x, y, T], [x, y, -T]]), ...prof.map(p => [...off(p), -2.6])] });
    const Fs = extrude(P, prof, -T, T, AZ, EL), Bs = extrude(v => P([v[0] + 2.6, v[1] + 1.3, v[2] - 3.1]), prof, -T, T, AZ, EL);
    const cen = [0, 5.6], crumbP = prof.map(([x, y]) => [cen[0] + (x - cen[0]) * .84, cen[1] + (y - cen[1]) * .84]);
    const F = pts => pts.map(([x, y]) => P([x, y, T + .01]));
    const mold = (x, y, r) => F(blob(x, y, r, r, t => 1 + .14 * sin(7 * t), 14));
    put('i_kenyer', { hu:'Száraz kenyér', en:'two stale dry bread slices with cracks and small green mold spots', tilt:TILT }, [
      pth('wood', 'dark', [Bs.sil]),                                                         // hátsó szelet
      det('cardboard', 'light', inset(Bs.front.map(p => p), Bs.sil, 1.6), { o:.9 }),         // hátsó szelet bele (a szélénél kilátszik)
      pth('wood', 'base', [Fs.sil]),                                                         // első szelet (héj)
      dpth('wood', 'light', Fs.tone(s => s > .15)),                                          // héj teteje (fény)
      dpth('wood', 'dark', Fs.tone(s => s <= .15)),                                          // héj oldala (árnyék)
      face('wood', 'base', Fs.front),                                                        // vágott lap héj-pereme
      det('cream', 'dark', F(crumbP)),                                                       // kiszáradt, sötétebb bél
      det('cream', 'base', F([...crumbP.slice(8), crumbP[0], [-2.5, 3.5], [.5, 8.2], [2.2, 10.4]])),   // fény felőli bél
      dpth('cardboard', 'base', [[-3.2, 7.4], [1.6, 8.8], [2.8, 4.4], [-1.2, 2.6], [-3.6, 4.0], [3.4, 2.0]].map(([x, y]) => F(blob(x, y, .55, .42, () => 1, 7))), { o:.8 }),   // likacsok
      dpth('cardboard', 'dark', [band(F([[-4.3, 5.8], [-2.4, 6.6], [-1.6, 5.4], [.4, 6.2]]), 1.0, false), band(F([[3.8, 9.6], [2.6, 8.0], [3.4, 6.8]]), .9, false)]),   // száradási repedések
      dpth('grass', 'base', [mold(1.2, 4.0, 1.25), mold(-3.2, 9.4, .95), mold(3.9, 1.6, .7)]),   // penészfoltok
      dpth('sage', 'light', [F(blob(1.0, 4.2, .5, .5, () => 1, 7)), F(blob(-3.35, 9.55, .38, .38, () => 1, 6))]),
      dpth('wood', 'light', [[-7.6, -.4, 2], [-8.8, .2, 1.4], [7.2, -.2, 1.8], [8.4, .6, .8]].map(([x, z, r]) => blob(...P([x, 0, z]), r * .8, r * .6, () => 1, 6))),   // morzsák
      shine([band(Fs.tone(s => s > .15).slice(0, 1)[0] ? [P([-5.8, 10.6, 0]), P([-4.4, 11.8, 0]), P([-2.2, 12.2, 0])] : [], 1.2, true)], .6),
    ]);
  }

  //  23. Narancshéj – spirálisan hámozott narancshéj-szalag: kívül narancs (pórusokkal), belül fehér; felül a szár-csonk
  {
    const TILT = -10, EL = 22, N = 49;
    const pt = i => { const t = i / (N - 1), th = -40 + 800 * t, R = 5.2 - 1.4 * t, y = 12.5 - 12 * t, h = 1.35 * min(1, .75 + t * 4, (1 - t) * 5 + .15);
      return { th, c:[R * sin(th), y, R * cos(th)], h, R, y }; };
    const S = Array.from({ length:N }, (_, i) => pt(i));
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:S.flatMap(s => [[s.c[0], s.y + s.h, s.c[2]], [s.c[0], s.y - s.h, s.c[2]]]) });
    const edge = (s, k) => P([s.c[0], s.y + s.h * k, s.c[2]]);
    const runs = []; let cur = null;
    S.forEach((s, i) => { const front = cos(s.th) >= 0; if(!cur || cur.front !== front){ if(cur) cur.ids.push(i); cur = { front, ids:cur ? [i - 1, i] : [i] }; runs.push(cur); } else cur.ids.push(i); });
    const poly = (ids, k0 = -1, k1 = 1) => [...ids.map(i => edge(S[i], k1)), ...ids.slice().reverse().map(i => edge(S[i], k0))];
    const sub = (ids, test) => { const out = []; let c = []; ids.forEach(i => { if(test(S[i].th)) c.push(i); else { if(c.length > 1) out.push(c); c = []; } }); if(c.length > 1) out.push(c); return out; };
    const F = runs.filter(r => r.front), B = runs.filter(r => !r.front);
    const pores = F.flatMap(r => r.ids.filter((_, j) => j % 2).map(i => { const s = S[i], q = P([s.c[0] * 1.01, s.y + s.h * .15 * ((i % 3) - 1), s.c[2] * 1.01]); return circ(q[0], q[1], .5, 5); }));
    const top = S[1], stem = P([top.c[0] * 1.03, top.y + .2, top.c[2] * 1.03]);
    put('i_naranchej', { hu:'Narancshéj', en:'spiral of orange peel, orange outside and white pith inside', tilt:TILT }, [
      pth('cream', 'base', B.map(r => poly(r.ids))),                                         // a szalag belső, fehér oldala (hátul)
      dpth('cream', 'dark', B.flatMap(r => sub(r.ids, th => sin(th) < -.2).map(ids => poly(ids, -.9, .9)))),   // a belső oldal árnyékos fele
      pth('orange', 'base', F.map(r => poly(r.ids))),                                        // narancs héj (elöl)
      dpth('orange', 'light', F.flatMap(r => sub(r.ids, th => sin(th) < -.3).map(ids => poly(ids, -.55, .85)))),   // fény felőli rész
      dpth('orange', 'dark', F.flatMap(r => sub(r.ids, th => sin(th) > .35).map(ids => poly(ids, -.85, .85)))),     // árnyékos rész
      dpth('orange', 'line', F.flatMap(r => sub(r.ids, th => sin(th) > .7).map(ids => poly(ids, -.85, -.35))), { o:.4 }),   // legsötétebb élsáv
      dpth('cream', 'light', F.map(r => poly(r.ids, .72, .98))),                             // a vágott szélen kilátszó fehér réteg
      dpth('orange', 'dark', pores, { o:.7 }),                                               // pórusok
      mk('poly', 'leaf', 'base', [star(stem[0], stem[1], 2.4, 1.1, 5)], { d:true }),           // szár-csonk
      det('wood', 'base', circ(stem[0], stem[1], .9, 6)),
      shine(F.flatMap(r => sub(r.ids, th => sin(th) < -.45 && sin(th) > -.85).map(ids => poly(ids, .1, .5))), .55),
    ]);
  }

  //  24. Fonnyadt saláta – laza kupac lekókadt, olívás-sárgás salátalevél: barnuló, fodros szél, kifelé lehajló csúcsok,
  //      barna foltok (a friss, zöld, kerek salátafejtől eltérően)
  {
    const TILT = -6;
    const W = (a, b) => t => 3 + a * Math.sin(Math.PI * min(1, t * b)) ** .7;
    const A = leafy(smoothPts([[45, 90], [36, 68], [27, 46], [21, 28], [12, 22], [7, 32]]), W(13, 1.1), (t, s) => .15 * Math.sin(t * 52 + s), .72, .25);
    const Bl = leafy(smoothPts([[56, 90], [67, 68], [76, 46], [82, 28], [91, 22], [95, 32]]), W(12, 1.1), (t, s) => .15 * Math.sin(t * 50 + 2 * s), .72, .25);
    const C = leafy(smoothPts([[50, 96], [47, 76], [48, 56], [53, 38], [63, 30], [71, 38]]), W(15, 1.08), (t, s) => .13 * Math.sin(t * 56 + s), .74, .3);
    const n = C.poly.length / 2, tipC = C.poly.filter((_, i) => i > n * .78 && i < n * 1.22);
    const side = [.3, .45, .6].flatMap(t => { const i = Math.round(t * (n - 1)), m = C.at(i, 0), l = C.at(i + 3, .8), r = C.at(i + 3, -.8); return [band([m, l], 1.1, false), band([m, r], 1.1, false)]; });
    put('i_salata', { hu:'Fonnyadt saláta', en:'wilted limp lettuce leaves with brown drooping edges', tilt:TILT }, [
      face('leaf', 'base', A.poly),                                                          // hátsó bal levél
      dpth('cardboard', 'base', A.margins),                                                  // barnuló szél
      face('grass', 'dark', Bl.poly),                                                        // hátsó jobb levél
      dpth('cardboard', 'base', Bl.margins),
      dpth('sage', 'dark', [A.vein(.05, .8, 1.8), Bl.vein(.05, .8, 1.8)], { o:.8 }),         // erek
      face('grass', 'base', C.poly),                                                         // első, lekókadt levél
      det('grass', 'light', C.half(1)),                                                      // fény felőli fél
      det('leaf', 'base', inset(tipC, C.poly, .9), { o:.6 }),                                // a lehajló csúcs árnyékos alja
      dpth('cardboard', 'light', C.margins),                                                 // barnuló, fodros szél
      dpth('sage', 'light', [C.vein(.02, .82, 2.2), ...side]),                               // középér és oldalerek
      dpth('cardboard', 'dark', [blob(38, 70, 2.2, 1.6, () => 1, 8), blob(58, 60, 1.6, 1.2, () => 1, 7), blob(24, 40, 1.8, 1.3, () => 1, 7), blob(80, 40, 1.5, 1.1, () => 1, 7), blob(54, 80, 1.3, 1.0, () => 1, 7)], { o:.8 }),   // barna foltok
      shine([band([[42, 80], [41, 66], [43, 56]], 1.8, true)], .45),
    ]);
  }

  //  25. Dióhéj – két üres, ráncos barna fél dióhéj: az egyik háttal (varrat-gerinccel), a másik nyitott, belül a válaszfallal
  {
    const TILT = -6;
    const bC = [62, 40], bB = blob(62, 40, 26, 21, t => 1 + .16 * Math.exp(-((((t + 180) % 360 - 180) / 26) ** 2)) - .03 * sin(9 * t), 34, -18);
    const seam = smoothPts([[37, 49], [48, 43], [62, 39], [76, 34], [87, 30]], 3);
    const wr = (pts, w = 1.1) => band(smoothPts(pts, 3), w, false);
    const aC = [40, 64], rim = blob(40, 62, 27, 12.5, () => 1, 28, -6), cav = blob(40.6, 62, 23.5, 9.8, t => 1 - .05 * sin(2 * t), 24, -6);
    const bowl = [...blob(40, 62, 27, 12.5, () => 1, 28, -6).filter((_, i) => i >= 14), ...blob(40, 62, 27, 25, t => 1 - .025 * abs(sin(6 * t)), 28, -6).filter((_, i) => i <= 14)];
    put('i_diohej', { hu:'Dióhéj', en:'two cracked empty walnut shell halves, wrinkled brown', tilt:TILT }, [
      face('wood', 'base', bB),                                                              // hátsó fél, háttal (domború)
      det('wood', 'light', lune(bB, bC, 170, 290, ...arcIn(.45))),
      det('wood', 'dark', lune(bB, bC, -30, 110, ...arcIn(.32))),
      dpth('wood', 'dark', [wr([[46, 30], [50, 36], [48, 42]]), wr([[58, 24], [60, 31], [56, 37]]), wr([[70, 22], [72, 29], [68, 35]]), wr([[48, 50], [54, 54], [52, 59]]), wr([[64, 46], [68, 51], [66, 57]]), wr([[78, 40], [80, 46]])], { o:.85 }),   // ráncok
      dpth('wood', 'light', [band(seam, 2.6, true)]),                                        // varrat-gerinc
      lin('wood', 'line', seam.map(([x, y]) => [x + .5, y + 1.5]), .8, { o:.6 }),
      pth('wood', 'base', [bowl]),                                                           // első fél: tál
      det('wood', 'light', inset([...blob(40, 62, 27, 25, () => 1, 28, -6).filter((_, i) => i >= 9 && i <= 14), [30, 70]], bowl)),
      det('wood', 'dark', inset([...blob(40, 62, 27, 25, () => 1, 28, -6).filter((_, i) => i <= 7), [52, 78], [58, 66]], bowl)),
      dpth('wood', 'dark', [wr([[22, 72], [28, 78], [34, 80]]), wr([[38, 76], [42, 82], [46, 86]]), wr([[52, 74], [56, 80]]), wr([[18, 64], [22, 70]])], { o:.85 }),
      face('cardboard', 'light', rim),                                                       // törött perem
      det('chocolate', 'light', cav),                                                        // üreg
      dpth('chocolate', 'base', [blob(28, 62.5, 8, 5.4, () => 1, 12, -6), blob(52, 60, 8.4, 5.6, () => 1, 12, -6)]),   // a két fél-rekesz mélye
      det('cardboard', 'base', band([[18, 64.5], [30, 63.6], [40, 61.4], [50, 60], [62, 58]], 2.8, true)),   // válaszfal
      shine([band([[46, 26], [52, 23]], 1.6, true), band([[20, 56], [26, 53]], 1.4, true)], .6),
    ]);
  }

  // =====================================================================
  //  SÜTŐOLAJ ÉS ZSIRADÉK
  // =====================================================================
  // lekerekített téglalap-gyűrű 3D-ben (kád, doboz): w × d, sarok r, magasság y
  const rrRing = (w, d, r, y, m = 3) => [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]]
    .flatMap(([x, z, a]) => Array.from({ length:m + 1 }, (_, i) => [x + r * cos(a + 90 * i / m), y, z + r * sin(a + 90 * i / m)]));
  // két azonos pontszámú gyűrű közti fal-lapok, a nézőnek látható lapok fényértékkel
  function wall(P, lo, hi, az, el){
    const C = viewDir(az, el), L = lightDir(az, el), out = [];
    for(let i = 0; i < lo.length; i++){ const j = (i + 1) % lo.length, a = lo[i], b = lo[j], c = hi[j];
      let n = n3(cross(b.map((v, k) => v - a[k]), c.map((v, k) => v - a[k]))); const mid = [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2]; if(dot(n, mid) < 0) n = n.map(v => -v);
      if(dot(n, C) > .01) out.push({ pts:[a, b, hi[j], hi[i]].map(P), s:dot(n, L) }); }
    return { faces:out, tone:test => out.filter(f => test(f.s)).map(f => f.pts) };
  }

  //  26. Fritőrolaj – lezárt, fogantyús átlátszó műanyag kanna félig sötét borostyánszínű, használt olajjal (morzsákkal),
  //      mellette egy kis drót sütőkosár
  {
    const TILT = 8, OIL = 8, EL = 16;
    const prof = [[3.6, 0], [3.9, .4], [4.0, 1.2], [4.0, 12.5], [3.6, 14.5], [2.6, 16.6], [1.8, 18], [1.6, 19.2]], capP = [[1.8, 19.0], [1.8, 21.0], [1.62, 21.3]];
    const BC = [-5.6, 0, 3.4], bprof = [[2.3, 0], [2.7, .3], [2.9, 3.4]];
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:[...lathFit([...prof, ...capP]), ...lathFit(bprof).map(([x, y, z]) => [x + BC[0], y, z + BC[2]]), [-13, 4.6, 3.4], [5.6, 17, 0]] });
    const L = lathe(P, prof), K = lathe(P, capP), B = lathe(([x, y, z]) => P([x + BC[0], y, z + BC[2]]), bprof), k = P.k;
    const handle = band([[1.5, 18.6], [4.0, 18.8], [5.4, 17.2], [5.1, 15.2], [3.7, 14.1]].map(([x, y]) => P([x, y, -.4])), 1.2 * k, false);
    const crumbs = [[-40, 2.2], [10, 1.4], [40, 3.0], [-10, 4.6], [-60, 6.4], [25, 7.2]].map(([a, y], i) => blob(...L.on(a, y, -.3), .6 + (i % 2) * .25, .45, () => 1, 6, i * 40));
    const mesh = [...[-70, -40, -10, 20, 50, 80].map(a => band([B.on(a, .35), B.on(a, 3.2)], .6, false)), ...[1.2, 2.3].map(y => band(B.ring(B.rAt(y), y, -88, 88, 10), .6, false))];
    put('i_fritur', { hu:'Fritőrolaj', en:'closed plastic jug half filled with dark used frying oil, small wire fryer basket beside', tilt:TILT }, [
      pth('glass', 'base', [handle]),                                                        // fogantyú (a nyakból a vállra)
      pth('glass', 'base', [L.sil]),                                                         // átlátszó kanna (alap)
      det('glass', 'light', L.strip(-90, -52, OIL, 18)),                                     // üres rész: fény felőli csík
      det('glass', 'dark', L.strip(34, 90, OIL, 18)),
      det('ember', 'dark', L.strip(-90, 90, .5, OIL, 12)),                                   // használt, sötét borostyán olaj
      det('gold', 'dark', L.strip(-90, -50, .5, OIL - .3)),                                  // fény felőli olaj
      det('wood', 'dark', L.strip(30, 90, .5, OIL)),                                         // árnyékos olaj
      det('wood', 'line', L.strip(66, 90, .5, OIL), { o:.6 }),                               // legsötétebb élsáv
      det('gold', 'dark', inset(L.full(3.75, OIL, 20), L.sil)),                              // olaj felszíne
      dpth('wood', 'line', crumbs, { o:.75 }),                                               // sütés utáni morzsák az olajban
      pth('red', 'base', [K.sil]),                                                           // kupak
      face('red', 'light', K.full(1.62, 21.3, 14)),
      shine([L.strip(-66, -58, 9, 13.6, 2)], .75),
      face('steel', 'base', B.sil),                                                          // drót sütőkosár
      dpth('steel', 'dark', mesh),                                                           // drótháló
      face('steel', 'light', B.full(2.9, 3.4, 18)),                                          // kosár pereme
      det('steel', 'dark', B.full(2.55, 3.4, 16)),                                           // kosár belseje
      pth('dark', 'base', [band([B.on(-86, 3.1), P([-9.4, 3.9, 3.4]), P([-12.6, 4.6, 3.4])], 1.5, true)]),   // nyél
    ]);
  }

  //  27. Avas étolaj – kerek üvegpalack zavaros, besötétedett olajjal: lebegő szemcsék, az alján sötét üledék-réteg,
  //      a nyakán lecsorgott ragacsos csepp, fém csavaros kupak
  {
    const TILT = -12, OIL = 12, EL = 14;
    const prof = [[3.1, 0], [3.35, .4], [3.4, 1.2], [3.4, 13.5], [3.1, 15.6], [2.0, 17.6], [1.15, 18.8], [1.1, 21.6], [1.3, 21.8]], capP = [[1.35, 21.6], [1.35, 23.8], [1.2, 24.0]];
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:lathFit([...prof, ...capP]) }), L = lathe(P, prof), K = lathe(P, capP), k = P.k;
    const sedTop = a => 2.3 + .35 * Math.sin(rad(a * 4)) + .2 * Math.sin(rad(a * 9 + 30));
    const sed = inset([...L.ring(L.rAt(.5), .5, -90, 90, 10), ...Array.from({ length:13 }, (_, i) => { const a = 90 - 15 * i; return L.on(a, sedTop(a)); })], L.sil);
    const haze = [[-60, 9.6, -10, 10.4, 30, 9.2], [-20, 6.4, 20, 7.2, 60, 6.0], [-70, 4.2, -30, 4.8, 10, 4.0]].map(([a0, y0, a1, y1, a2, y2]) => band(L.wrap([[a0, y0], [a1, y1], [a2, y2]]), 1.4, true));
    const specks = [[-50, 3.6], [-20, 5.4], [15, 4.2], [40, 6.6], [-35, 8.2], [5, 9.4], [30, 10.6], [-60, 11.0], [55, 3.2]].map(([a, y]) => blob(...L.on(a, y, -.4), .45, .45, () => 1, 5));
    const drip = [L.on(-30, 21.6, .05), L.on(-26, 21.6, .05), L.on(-24, 19.4, .1), L.on(-26, 17.2, .15), ...blob(...L.on(-28, 15.9, .2), .85 * k, 1.1 * k, () => 1, 8).slice(0, 7).reverse(), L.on(-33, 17.6, .15), L.on(-34, 19.6, .1)];
    put('i_avasolaj', { hu:'Avas étolaj', en:'glass bottle of cloudy darkened rancid cooking oil with sediment at the bottom', tilt:TILT }, [
      pth('glass', 'base', [L.sil]),                                                         // üvegpalack (alap)
      det('glass', 'light', L.strip(-90, -50, OIL, 21.6)),                                   // üres rész: fény felőli csík
      det('glass', 'dark', L.strip(34, 90, OIL, 21.6)),
      det('gold', 'dark', L.strip(-90, 90, .5, OIL, 12)),                                    // zavaros, besötétedett olaj
      det('gold', 'base', L.strip(-90, -54, .5, OIL - .3), { o:.7 }),                        // fény felőli rész
      det('grass', 'dark', L.strip(30, 90, .5, OIL), { o:.75 }),                             // olívásra sötétedett árnyékos rész
      det('soil', 'base', L.strip(68, 90, .5, OIL), { o:.5 }),                               // legsötétebb élsáv
      dpth('cream', 'light', haze, { o:.6 }),                                                // tejes-zavaros felhők
      det('grass', 'base', inset(L.full(3.25, OIL, 20), L.sil)),                             // olaj felszíne (hártya)
      dpth('chocolate', 'light', specks, { o:.8 }),                                          // lebegő szemcsék
      det('chocolate', 'light', sed),                                                        // üledék-réteg az alján
      dpth('chocolate', 'base', [band(Array.from({ length:11 }, (_, i) => { const a = 80 - 16 * i; return L.on(a, sedTop(a) - .35); }), .9, false)]),   // az üledék sötétebb alja
      pth('steel', 'base', [K.sil]),                                                         // csavaros fém kupak
      dpth('steel', 'dark', [-60, -30, 0, 30, 60].map(a => band([K.on(a, 21.9), K.on(a, 23.6)], .6, false))),
      face('steel', 'light', K.full(1.2, 24.0, 14)),
      det('gold', 'dark', drip, { o:.9 }),                                                   // lecsorgott ragacsos olaj
      shine([L.strip(-66, -58, 13, 16, 2), L.strip(-68, -60, 2.8, 10.6, 2)], .6),
    ]);
  }

  //  28. Margarin maradék – nyitott, lekerekített szögletes zöld margarinos doboz: az alján és a falán kikapart, halványsárga
  //      margarin-maradék késnyomokkal; a sárga fedele mögötte (a kerek, fehér, üres tejfölös doboztól eltérően)
  {
    const TILT = -10, AZ = 24, EL = 54, HT = 5.2;
    const lidC = [1.4, 5.4, -6.4], lidN = n3([-.1, .5, .86]), E1 = n3(cross([0, 1, 0], lidN)), E2 = cross(lidN, E1);
    const lidPt = ([u, v], h = 0) => [0, 1, 2].map(i => lidC[i] + u * E1[i] + v * E2[i] + h * lidN[i]);
    const lidRR = (w, d, r, h) => rrRing(w, d, r, 0).map(([u, , v]) => lidPt([u, v], h));
    const lo = rrRing(11.4, 8.0, 2.4, 0), hi = rrRing(12.8, 9.2, 2.9, HT), rim = rrRing(13.4, 9.8, 3.1, HT), open = rrRing(12.0, 8.4, 2.6, HT), fl = rrRing(10.6, 7.2, 2.2, .6);
    const P = camera({ az:AZ, el:EL, tilt:TILT, span:80, fit:[...lo, ...rim, ...lidRR(13.6, 10, 3.1, .5)] });
    const Wl = wall(P, lo, hi, AZ, EL), sil = hull([...lo, ...rim].map(P)), opP = open.map(P);
    const FL = pts => pts.map(([x, z]) => P([x, .62, z]));                                 // a doboz alja
    put('i_margarin', { hu:'Margarin maradék', en:'open green margarine tub with scraped pale yellow leftover and knife marks', tilt:TILT }, [
      face('gold', 'dark', hull([...lidRR(13.6, 10, 3.1, -.5), ...lidRR(13.6, 10, 3.1, .5)].map(P))),   // a fedél pereme
      face('gold', 'base', lidRR(13.0, 9.4, 2.9, .5).map(P)),                                // sárga fedél
      det('gold', 'light', lidRR(10.4, 6.8, 2.2, .52).map(P), { o:.8 }),
      pth('leaf', 'base', [sil]),                                                            // doboz (alap)
      dpth('leaf', 'dark', Wl.tone(s => s <= .12)),                                          // árnyékos fal
      det('leaf', 'line', inset(hull(lo.filter(p => p[2] > 1 || p[0] > 3).map(P).concat(hi.filter(p => p[2] > 3.6 || p[0] > 5.2).map((p, i) => P([p[0] * .96, 1.1, p[2] * .96])))), sil), { o:.35 }),   // talp élsáv
      face('leaf', 'light', rim.map(P)),                                                     // perem
      det('gold', 'light', opP),                                                             // a falakra kent margarin-maradék
      det('honey', 'light', clip([P([-6.4, HT, 4.2]), P([-6.4, HT, -4.2]), P([-4.4, 1.4, -3.6]), P([-4.4, .6, 3.6])], opP)),   // a bal belső fal árnyékos része
      det('sage', 'base', clip(FL([[-3.0, -2.6], [-.6, -3.0], [2.8, -2.8], [4.4, -1.6], [4.0, .6], [1.6, 1.2], [-1.8, 1.0], [-3.6, -.4]]), opP)),   // kikapart közepe: látszik a doboz alja
      dpth('honey', 'light', [band(FL([[-3.6, -.4], [-1.8, 1.0], [1.6, 1.2], [4.0, .6]]), 1.2, false), band(FL([[-3.0, -2.6], [-.6, -3.0], [2.8, -2.8], [4.4, -1.6]]), 1.0, false)].map(p => clip(p, opP))),   // a kaparás pereme
      dpth('gold', 'base', [[[-5.0, 2.8], [-4.6, .2], [-5.0, -2.6]], [[5.4, 2.4], [5.1, -.2], [5.4, -2.8]], [[-2.4, 2.4], [.6, 2.6], [3.6, 2.2]], [[-1.6, -3.6], [1.2, -3.8], [3.8, -3.5]]].map(p => clip(band(FL(p), 1.7, false), opP)), { m:'honey' }),   // késnyomok a maradékban
      det('honey', 'light', clip(blob(...P([4.2, 1.2, -2.2]), 4.6, 2.6, t => 1 + .12 * Math.sin(rad(3 * t)), 12), opP)),   // kupacnyi maradék a sarokban
      dpth('paper', 'light', [clip(band([P([2.8, 1.6, -2.0]), P([4.2, 2.1, -2.2]), P([5.6, 1.7, -2.2])], .8, true), opP), clip(band(FL([[-2.2, 1.9], [.6, 2.1]]), .7, true), opP)], { o:.9 }),   // fényes margarin-gerincek
      shine([inset([P([-6.3, 3.8, 4.4]), P([-3.2, 3.8, 4.8]), P([-3.2, 3.2, 4.7]), P([-6.2, 3.2, 4.3])], sil)], .5),
    ]);
  }

  //  29. Sertészsír – hagyományos, barna mázas cserépbödön (krém népies csíkkal, piros pöttyökkel, két kis füllel),
  //      tele megdermedt, fehér zsírral; a tetején kanálnyom
  {
    const TILT = 10, EL = 30, TOP = 8.2;
    const prof = [[3.4, 0], [3.9, .4], [4.5, 2.2], [4.7, 4.0], [4.5, 6.0], [4.1, 7.2], [4.3, 7.5], [4.35, 8.0], [4.1, TOP]];
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:[...lathFit(prof), [-6, 6, 0], [6, 6, 0]] }), L = lathe(P, prof), k = P.k;
    const ear = s => band([P([s * 4.5, 6.6, .3]), P([s * 5.8, 6.4, .3]), P([s * 5.8, 5.0, .3]), P([s * 4.6, 4.6, .3])], 1.3 * k, false);
    const lard = L.full(3.95, 7.7, 22), lc = P([0, 7.7, 0]);
    const scoop = [...Array.from({ length:9 }, (_, i) => P([-1.2 + 2.8 * cos(200 + 140 * i / 8), 7.7, .6 + 1.4 * sin(200 + 140 * i / 8)])), ...Array.from({ length:9 }, (_, i) => P([-1.0 + 2.5 * cos(340 - 140 * i / 8), 7.45, 1.0 + 1.0 * sin(340 - 140 * i / 8)]))];
    const dots = [-70, -45, -20, 5, 30, 55, 80].map(a => blob(...L.on(a, 4.0, .05), .55 * k, .55 * k, () => 1, 7));
    put('i_disznozsir', { hu:'Sertészsír', en:'solidified white lard in a small brown glazed ceramic crock', tilt:TILT }, [
      pth('wood', 'base', [ear(-1), ear(1)]),                                                // két kis fül
      pth('wood', 'base', [L.sil]),                                                          // mázas cserépbödön (alap)
      det('wood', 'light', L.strip(-90, -50, .2, 7.2)),
      det('wood', 'dark', L.strip(30, 90, .2, 7.2)),
      det('wood', 'line', L.strip(66, 90, .2, 7.2), { o:.4 }),                               // legsötétebb élsáv
      det('cream', 'base', L.strip(-86, 86, 3.2, 4.8, 10)),                                  // népies krém csík
      dpth('red', 'base', dots),                                                             // piros pöttyök
      face('wood', 'light', L.full(4.35, 8.0, 24)),                                          // perem
      face('paper', 'base', lard, { line:false }),                                           // megdermedt zsír
      det('paper', 'dark', lune(lard, lc, 180, 340, ...arcIn(.3, .98))),                     // a perem árnyéka a zsíron
      det('paper', 'light', lune(lard, lc, -10, 170, () => .9, u => .9 - .55 * Math.sin(Math.PI * u))),   // fény felőli zsír
      det('paper', 'dark', scoop),                                                           // kanálnyom
      dpth('paper', 'line', [band(scoop.slice(0, 9), .7, false)], { o:.35 }),
      shine([L.strip(-66, -58, 1.0, 6.4, 2), blob(...P([1.6, 7.72, 1.8]), 1.4, .6, () => 1, 8)], .7),
    ]);
  }

  //  30. Kókuszzsír – üvegtégely tömör, fehér kókuszzsírral (az üvegen át látszik), zöld csavaros tető; mellette fél kókuszdió-héj
  {
    const TILT = -10, EL = 22, FAT = 6.4;
    const prof = [[3.2, 0], [3.45, .4], [3.5, 1.0], [3.5, 7.0], [3.2, 7.6], [3.0, 7.8], [3.0, 8.4]], lidP = [[3.25, 8.3], [3.3, 8.5], [3.3, 9.9], [3.1, 10.1]];
    const CC = [4.6, 2.2, 3.2], CN = n3([-.25, .8, .55]), E1 = n3(cross([0, 1, 0], CN)), E2 = cross(CN, E1), CR = 3.1;
    const cPt = (a, b, r = CR) => [0, 1, 2].map(i => CC[i] + r * cos(b) * (cos(a) * E1[i] + sin(a) * E2[i]) - r * sin(b) * CN[i]);
    const P = camera({ az:0, el:EL, tilt:TILT, span:80, fit:[...lathFit([...prof, ...lidP]), ...Array.from({ length:12 }, (_, i) => cPt(30 * i, 0)), cPt(0, 90)] });
    const L = lathe(P, prof), Ld = lathe(P, lidP), k = P.k;
    const shell = hull([0, 30, 60, 90].flatMap(b => Array.from({ length:16 }, (_, i) => P(cPt(22.5 * i, b)))));
    const rimC = Array.from({ length:20 }, (_, i) => P(cPt(18 * i, 0))), flesh = Array.from({ length:18 }, (_, i) => P(cPt(20 * i, 0, CR * .9)));
    const cavity = Array.from({ length:16 }, (_, i) => P(cPt(22.5 * i, 0, CR * .66)).map((v, j) => v + (j ? .5 * k : 0)));
    const fibers = [[200, 40], [230, 55], [260, 35], [290, 60], [320, 42], [250, 75], [300, 20], [215, 20]].map(([a, b]) => band([P(cPt(a, b, CR * 1.01)), P(cPt(a + 10, b + 12, CR * 1.01))], .7, false));
    put('i_kokuszzsir', { hu:'Kókuszzsír', en:'glass jar of solid white coconut fat with half a coconut shell beside it', tilt:TILT }, [
      pth('glass', 'base', [L.sil]),                                                         // üvegtégely (alap)
      det('paper', 'light', inset(L.strip(-90, 90, .7, FAT, 12), L.sil, 1.6)),               // tömör, fehér kókuszzsír
      det('paper', 'dark', inset(L.strip(30, 90, .7, FAT), L.sil, 1.6)),
      dpth('paper', 'dark', [band(L.ring(L.rAt(FAT) - .45, FAT, -84, 84, 10), .8, false)]),  // a zsír teteje
      det('glass', 'light', L.strip(-90, -52, 0, 7.8)),                                      // üvegfény
      det('glass', 'dark', L.strip(40, 90, 0, 7.8), { o:.7 }),
      det('glass', 'dark', L.strip(-90, 90, 0, .7, 10)),                                     // vastag üvegtalp
      pth('leaf', 'base', [Ld.sil]),                                                         // zöld csavaros tető
      det('leaf', 'dark', Ld.strip(30, 90)),
      dpth('leaf', 'dark', [-66, -40, -14, 12, 38, 64].map(a => band([Ld.on(a, 8.7), Ld.on(a, 9.7)], .7, false)), { o:.7 }),   // recézés
      face('leaf', 'light', Ld.full(3.1, 10.1, 20)),
      face('chocolate', 'base', shell),                                                      // fél kókuszdió-héj
      det('chocolate', 'light', inset(shell.filter((p, i, a) => p[0] < P(CC)[0]).concat([P(cPt(0, 60))]), shell)),
      dpth('wood', 'base', fibers, { o:.9 }),                                                // szőrös rostok
      face('chocolate', 'dark', rimC),                                                       // héj pereme
      det('paper', 'light', flesh),                                                          // fehér kókuszhús
      det('cream', 'dark', cavity),                                                          // a héj belső ürege
      shine([L.strip(-68, -60, 1.0, 6.8, 2), Ld.strip(-72, -62, 8.6, 9.8, 2)], .8),
    ]);
  }
})();
