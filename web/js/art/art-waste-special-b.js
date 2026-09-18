// ============================================================
//  Matricák — Szelektálj! különleges gyűjtésű hulladékok, B szint (docs/rajzolas.md) – 2. rész:
//  e-hulladék · gyógyszer · zöldhulladék (i_ + azonosító). Az 1. rész (elemek, textil, veszélyes hulladék): art-waste-special.js
//  Valódi méretből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A kész rajzot a fin() tölti ki a vászonra (a megdöntött tárgy perem + árnyék mellett is 8–92 közé fér) – így nem kell scale.
// ============================================================
(function(){
  const { rad, camera, band } = ART.geo;
  const { hypot, max, min, abs, sqrt, PI } = Math;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const r1 = n => Math.round(n * 10) / 10;
  const norm = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const LIGHT = norm([-0.5, 0.65, 0.55]);                                   // fény: bal-fent-elöl (X jobbra, Y fel, Z a néző felé)
  const L2D = norm([-0.52, -0.62, 0.59]);                                   // ugyanez a képernyőn (y lefelé) a 2D foltokhoz

  // ---------------- 2D segédek ----------------
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // Douglas–Peucker ritkítás (zárt sokszög) – kis SVG
  function simplify(poly, eps = .25){
    const dp = pts => {
      if(pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1], L = hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let best = 0, bi = 0;
      for(let i = 1; i < pts.length - 1; i++){ const d = abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if(d > best){ best = d; bi = i; } }
      return best > eps ? [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))] : [a, b];
    };
    const half = Math.floor(poly.length / 2);
    return [...dp(poly.slice(0, half + 1)).slice(0, -1), ...dp([...poly.slice(half), poly[0]]).slice(0, -1)];
  }
  // függőlegesen konvex sokszögek uniójának körvonala (forgástest sziluettje)
  function envelope(polys, step = .5){
    const xs = polys.flat().map(p => p[0]), x0 = min(...xs), x1 = max(...xs), N = max(8, Math.ceil((x1 - x0) / step));
    const top = [], bot = [];
    for(let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * min(max(i / N, .0005), .9995);
      let lo = Infinity, hi = -Infinity;
      for(const poly of polys) for(let j = 0; j < poly.length; j++){
        const a = poly[j], b = poly[(j + 1) % poly.length];
        if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0){ const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = min(lo, y); hi = max(hi, y); }
      }
      if(lo < Infinity){ top.push([x, lo]); bot.push([x, hi]); }
    }
    return simplify([...top, ...bot.reverse()], .2);
  }
  // a sziluett közelében lévő pontok behúzása (a tónus-lapok ne takarják le a kontúrt)
  function inset(pts, sil, d = .85){
    const s = Math.sign(area(sil)) || 1, n = sil.length;
    return pts.map(p => {
      let best = null, bd = Infinity;
      for(let i = 0; i < n; i++){
        const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey;
        if(L2 < 1e-9) continue;
        const t = max(0, min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, dd = hypot(p[0] - qx, p[1] - qy);
        if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:sqrt(L2) }; }
      }
      if(!best || bd >= d) return p;
      return [best.qx - best.ey / best.L * s * d, best.qy + best.ex / best.L * s * d];
    });
  }
  // konvex vágás (Sutherland–Hodgman)
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
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // töröttvonal simítása (másodfokú görbék a felezőpontokon át)
  const smooth = (pts, n = 4) => pts.length < 3 ? pts : pts.slice(0, -2).flatMap((_, i) => {
    const a = i ? lerp(pts[i], pts[i + 1], .5) : pts[0], c = i === pts.length - 3 ? pts[i + 2] : lerp(pts[i + 1], pts[i + 2], .5);
    return Array.from({ length:n + 1 }, (_, j) => { const t = j / n; return lerp(lerp(a, pts[i + 1], t), lerp(pts[i + 1], c, t), t); }).slice(i ? 1 : 0);
  });

  // ---------------- 3D segédek ----------------
  // kamera: az ART.geo.camera + V (a néző felé mutató irány, a hátsó lapok elhagyásához)
  function cam(o){ const P = camera(Object.assign({ span:80 }, o)), a = rad(o.az || 0), e = rad(o.el || 0);
    P.V = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; return P; }
  const corners = (x0, x1, y0, y1, z0, z1) => { const o = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) o.push([x, y, z]); return o; };
  // tónus a felület normálisából: teteje világos · eleje alap · jobb oldala sötét · alja/háta legsötétebb
  const toneOf = n => { const s = dot(norm(n), LIGHT); return s > .6 ? 'light' : s > .15 ? 'base' : s > -.6 ? 'dark' : 'line'; };
  // doboz látható lapjai (az > 0: eleje és jobb oldala látszik)
  function box(P, x0, x1, y0, y1, z0, z1){
    const c = (x, y, z) => P([x, y, z]);
    return {
      top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)],
      front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
      right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)],
      left:[c(x0, y0, z0), c(x0, y0, z1), c(x0, y1, z1), c(x0, y1, z0)],
      sil:hull(corners(x0, x1, y0, y1, z0, z1).map(P)),
    };
  }
  // függőleges henger / hasáb (n = 6: hatszög): sziluett + teteje
  function cyl(P, cx, cz, r, y0, y1, n = 14, a0 = 0){
    const ring = (y, rr = r) => Array.from({ length:n }, (_, i) => P([cx + rr * sin(a0 + 360 * i / n), y, cz + rr * cos(a0 + 360 * i / n)]));
    return { sil:hull([...ring(y0), ...ring(y1)]), top:ring(y1), ring };
  }
  // forgástest: prof = [[r, y], …] alulról; ez = a keresztmetszet mélységi aránya. Szög: 0 = elöl, −90 = bal szél, +90 = jobb szél
  function lathe(P, prof, ez = 1){
    const at = (r, y, a) => P([r * sin(a), y, r * ez * cos(a)]);
    const rAt = y => { for(let i = 1; i < prof.length; i++) if(y <= prof[i][1] || i === prof.length - 1){ const [ra, ya] = prof[i - 1], [rb, yb] = prof[i]; return yb === ya ? rb : ra + (rb - ra) * (y - ya) / (yb - ya); } return prof[0][0]; };
    const ring = (r, y, a0 = 0, a1 = 360, n = 20) => Array.from({ length:n + 1 }, (_, i) => at(r, y, a0 + (a1 - a0) * i / n));
    const full = (r, y, n = 16) => ring(r, y, 0, 360, n).slice(0, n);
    const rings = prof.map(([r, y]) => full(r, y, 24));
    const sil = envelope(rings.slice(1).map((rg, i) => hull([...rings[i], ...rg])));
    const on = (a, y, dr = 0) => at(rAt(y) + dr, y, a);
    const strip = (a0, a1, y0 = prof[0][1], y1 = prof[prof.length - 1][1], n = 5) => {
      const ys = [y0, ...prof.map(p => p[1]).filter(y => y > y0 && y < y1), y1];
      return inset([...ring(rAt(y0), y0, a0, a1, n), ...ys.slice(1, -1).map(y => on(a1, y)), ...ring(rAt(y1), y1, a1, a0, n), ...ys.slice(1, -1).reverse().map(y => on(a0, y))], sil);
    };
    return { at, rAt, ring, full, sil, on, strip };
  }

  // ---------------- 2D szerves formák (textil, plüss): gömb- és henger-álnormálisból számolt tónus – minta: art-huto-kamra.js ----------------
  const lightFor = tilt => { const a = rad(-tilt), c = Math.cos(a), s = Math.sin(a); return [L2D[0] * c - L2D[1] * s, L2D[0] * s + L2D[1] * c, L2D[2]]; };
  const TONE = { light:d => d > .72, dark:d => d < .25, edge:d => d < -.25 };
  function interval(f, test, a, b, n = 24){
    const xs = Array.from({ length:n + 1 }, (_, k) => a + (b - a) * k / n), ok = xs.map(x => test(f(x)));
    const first = ok.indexOf(true); if(first < 0) return null;
    const last = ok.lastIndexOf(true);
    const refine = (p, q) => { const v = test(f(p)); for(let i = 0; i < 14; i++){ const m = (p + q) / 2; if(test(f(m)) === v) p = m; else q = m; } return (p + q) / 2; };
    return [first === 0 ? a : refine(xs[first - 1], xs[first]), last === n ? b : refine(xs[last], xs[last + 1])];
  }
  function regionPolys(ints, pt, cyclic){
    const n = ints.length, out = [];
    if(cyclic && ints.every(Boolean)){ const idx = ints.map((_, i) => i);
      out.push(idx.every(k => ints[k][0] < 1e-6) ? idx.map(k => pt(k, ints[k][1])) : [...idx.map(k => pt(k, ints[k][1])), ...idx.reverse().map(k => pt(k, ints[k][0]))]); return out; }
    for(let i = 0; i < n; i++){
      const prev = cyclic ? ints[(i - 1 + n) % n] : (i ? ints[i - 1] : null);
      if(!ints[i] || prev) continue;
      const idx = []; for(let k = i; ints[k]; k = cyclic ? (k + 1) % n : k + 1){ idx.push(k); if(!cyclic && k === n - 1) break; if(idx.length > n) break; }
      out.push([...idx.map(k => pt(k, ints[k][1])), ...idx.slice().reverse().map(k => pt(k, ints[k][0]))]);
    }
    return out;
  }
  // folt: közép, sugarak, forgatás, f(fok) sugár-szorzó
  function Blob(o){
    const a = rad(o.rot || 0), ca = Math.cos(a), sa = Math.sin(a), f = o.f || (() => 1);
    const at = (th, rho = 1) => { const k = f(th) * rho, x = o.rx * k * cos(th), y = o.ry * k * sin(th); return [o.cx + x * ca - y * sa, o.cy + x * sa + y * ca]; };
    const sil = (n = 28, off = 0) => Array.from({ length:n }, (_, i) => at(off + 360 * i / n));
    const tone = (L, test, n = 28, pad = .85) => {
      const ths = Array.from({ length:n }, (_, i) => 360 * i / n);
      const ints = ths.map(th => { const e = at(th), dx = e[0] - o.cx, dy = e[1] - o.cy, Rr = hypot(dx, dy), al = (dx * L[0] + dy * L[1]) / Rr;
        return interval(r => r * al + sqrt(max(0, 1 - r * r)) * L[2], test, 0, max(0, 1 - pad / Rr)); });
      return regionPolys(ints, (k, r) => at(ths[k], r), true);
    };
    return { at, sil, tone };
  }
  // cső: gerincvonal + szélesség (szám vagy t → szélesség); sil(kezdő sapka, vég sapka)
  function Tube(spine, w){
    const n = spine.length, hw = i => (typeof w === 'function' ? w(i / (n - 1)) : w) / 2;
    const N = spine.map((p, i) => { const a = spine[max(0, i - 1)], b = spine[min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    const at = (i, u) => [spine[i][0] + N[i][0] * u * hw(i), spine[i][1] + N[i][1] * u * hw(i)];
    const capArc = (i, a0, a1) => Array.from({ length:7 }, (_, j) => { const a = rad(a0 + (a1 - a0) * (j + 1) / 8); return [spine[i][0] + hw(i) * Math.cos(a), spine[i][1] + hw(i) * Math.sin(a)]; });
    const aN = i => Math.atan2(N[i][1], N[i][0]) * 180 / PI;
    const sil = (c0 = false, c1 = true) => [...spine.map((_, i) => at(i, 1)), ...(c1 ? capArc(n - 1, aN(n - 1), aN(n - 1) - 180) : []),
      ...spine.map((_, i) => at(n - 1 - i, -1)), ...(c0 ? capArc(0, aN(0) + 180, aN(0)) : [])];
    const tone = (L, test, dark, pad = .85) => {
      const ints = spine.map((p, i) => { const h = hw(i); if(h <= pad * 1.3) return null;
        const um = 1 - pad / h, al = N[i][0] * L[0] + N[i][1] * L[1], f = u => u * al + sqrt(max(0, 1 - u * u)) * L[2];
        return dark ? interval(f, test, al > 0 ? -um : 0, al > 0 ? 0 : um) : interval(f, test, -um, um); });
      return regionPolys(ints, (k, u) => at(k, u), false);
    };
    // keresztcsík a gerinc i0…i1 szakaszán (u: −1…1)
    const across = (i0, i1, u0 = -1, u1 = 1) => { const ids = Array.from({ length:i1 - i0 + 1 }, (_, j) => i0 + j); return [...ids.map(i => at(i, u1)), ...ids.reverse().map(i => at(i, u0))]; };
    return { at, sil, tone, across, N, hw, n };
  }
  // sűrű, sima gerinc (a töréspontok között m pont)
  const spineOf = (pts, m = 4) => smooth(pts, m);
  // töröttvonal egyenletes újramintázása ívhossz szerint (n pont)
  function resample(pts, n){
    const d = [0]; for(let i = 1; i < pts.length; i++) d.push(d[i - 1] + hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return Array.from({ length:n }, (_, k) => { const t = d[d.length - 1] * k / (n - 1); let j = 1; while(j < d.length - 1 && d[j] < t) j++;
      return lerp(pts[j - 1], pts[j], (t - d[j - 1]) / ((d[j] - d[j - 1]) || 1)); });
  }
  const halfPlane = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = hypot(dx, dy), nx = dy / l * 200, ny = -dx / l * 200, ex = dx / l * 200, ey = dy / l * 200;
    return [[p[0] - ex, p[1] - ey], [p[0] + ex, p[1] + ey], [p[0] + ex + nx, p[1] + ey + ny], [p[0] - ex + nx, p[1] - ey + ny]]; };   // félsík a p→q iránytól balra (képernyőn, lefelé nő y)

  // ---------------- tetszőleges állású testek ----------------
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const posed = (P, f) => { const Q = v => P(f(v)); Q.k = P.k; Q.V = P.V; return Q; };
  // henger tetszőleges tengellyel: base = a tengely kezdőpontja, dir = irány; at(t, szög, r) a palást pontja (szög 0 = a néző felé)
  function acyl(P, base, dir, r, len, n = 14){
    const d = norm(dir), u = norm(cross(d, [0, 0, 1])), w = cross(u, d);
    const pt = (t, a, rr = r) => P([0, 1, 2].map(k => base[k] + d[k] * t + rr * (Math.cos(rad(a)) * w[k] - Math.sin(rad(a)) * u[k])));
    const ring = (t, rr = r) => Array.from({ length:n }, (_, i) => pt(t, 360 * i / n, rr));
    return { sil:hull([...ring(0), ...ring(len)]), top:ring(len), ring, at:pt, end:[0, 1, 2].map(k => base[k] + d[k] * len) };
  }
  // 2D elhelyezés: eltolás, forgatás (fok), nagyítás a (0,0) körül
  const place = (pts, dx, dy, deg = 0, k = 1) => pts.map(([x, y]) => [dx + k * (x * cos(deg) - y * sin(deg)), dy + k * (x * sin(deg) + y * cos(deg))]);

  // ---------------- alakzat-gyártók ----------------
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts }, o);                    // fő lap: kontúr + fehér perem
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts }, o);  // tónus-lap / dísz
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, polys }, o);                 // több részből álló fő lap
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, polys }, o);
  const shine = (pts, o = .6) => det('paper', 'light', pts, { o });
  const tube = (pts, w, cap = true) => band(pts, w, cap);                                           // vastag vonal sokszögként

  // ---------------- beillesztés a vászonra ----------------
  // a megdöntött sziluett befoglalóját a perem- és árnyék-tartalékkal a vászonra illeszti (egyenletes nagyítás + eltolás a rajzon)
  function fin(name, meta){
    const t = rad(meta.tilt || 0), c = Math.cos(t), s = Math.sin(t), shapes = meta.shapes.filter(Boolean);
    const ptsOf = sh => sh.pts || (sh.polys ? sh.polys.filter(p => p && p.length > 2).flat() : []);
    const rot = ([x, y]) => [50 + (x - 50) * c - (y - 50) * s, 50 + (x - 50) * s + (y - 50) * c];
    const Q = shapes.filter(sh => !sh.d && sh.t !== 'line').flatMap(sh => ptsOf(sh).map(rot)), xs = Q.map(q => q[0]), ys = Q.map(q => q[1]);
    const X0 = 4.6, X1 = 95.4, Y0 = 4.6, Y1 = 91.8, g = meta.grow || 1;
    const k = min((X1 - X0) / (max(...xs) - min(...xs)), (Y1 - Y0) / (max(...ys) - min(...ys))) * g;
    const qm = [(max(...xs) + min(...xs)) / 2, (max(...ys) + min(...ys)) / 2], tg = [(X0 + X1) / 2, (Y0 + Y1) / 2];
    const d = [k * (50 - qm[0]) + tg[0] - 50, k * (50 - qm[1]) + tg[1] - 50], dI = [d[0] * c + d[1] * s, -d[0] * s + d[1] * c];
    const T = ([x, y]) => [r1(50 + k * (x - 50) + dI[0]), r1(50 + k * (y - 50) + dI[1])];
    const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => { const q = p.map(T).filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]);
      return q.length > 2 ? 'M' + q.map(v => v.join(' ')).join(' ') + 'Z' : ''; }).join('');
    const out = [];
    for(const sh of shapes){
      const o = Object.assign({}, sh);
      if(o.pts && o.t === 'poly'){ o.pts = o.pts.map(T); if(o.pts.length < 3) continue; }
      else if(o.polys){ o.p = pathOf(o.polys); delete o.polys; if(!/\S/.test(o.p)) continue; }
      else if(o.t === 'line'){ o.pts = o.pts.map(T); o.w = r1((o.w || 2) * k); }
      out.push(o);
    }
    delete meta.grow;
    ART.add(name, Object.assign({ emoji:[], shadow:'hard' }, meta, { shapes:out }));
  }


  // ============================================================================================
  //  E-HULLADÉK – laptop (ezüst, nyitott, sötét kijelző) · billentyűzet (fekete test, szürke billentyűk, kábel) ·
  //  fejhallgató (piros kagylók, fejpánt, kábel) · LED-izzó (tejfehér búra, bordás nyak – a jóváhagyott ledizzo_b) · porszívó (piros test, gégecső, szívófej)
  // ============================================================================================

  // ---- 16. Laptop: 34 × 24 × 2,2 cm-es ezüst alap, hátradöntött fedél sötét kijelzővel; billentyűsorok, érintőpad, bekapcsolt-jelző ----
  {
    const TILT = -10, X = 17, Z = 12, HB = 2.2, LA = 14, LT = .9, LH = 22;
    const up = [0, cos(LA), -sin(LA)], nr = [0, sin(LA), cos(LA)];
    const lid = (x, v, n) => [x, HB + up[1] * v + nr[1] * n, -Z + up[2] * v + nr[2] * n];
    const P = cam({ az:28, el:28, F:120, tilt:TILT, fit:[...corners(-X, X, 0, HB, -Z, Z), lid(-X, LH, LT), lid(X, LH, LT), lid(X, LH, 0), lid(-X, LH, 0)] });
    const L3 = (x, v, n = LT) => P(lid(x, v, n)), b = box(P, -X, X, 0, HB, -Z, Z), T = (x, z) => P([x, HB, z]);
    const keys = [];
    for(let r = 0; r < 5; r++){ const z0 = -10.6 + r * 1.95, z1 = z0 + 1.5;
      const cols = r === 4 ? [[-14.8, -12.8], [-12.4, -10.4], [-10.0, 6.0], [6.4, 8.4], [8.8, 10.8], [11.2, 13.2], [13.6, 14.8]] : Array.from({ length:13 }, (_, c) => [-14.8 + c * 2.3, -14.8 + c * 2.3 + 1.85]);
      for(const [x0, x1] of cols) keys.push([T(x0, z1), T(x1, z1), T(x1, z0), T(x0, z0)]); }
    fin('i_laptop', { hu:'Laptop', en:'old open silver laptop with a dark screen, keyboard and trackpad', tilt:TILT, shapes:[
      face('steel', 'light', [L3(-X, LH, 0), L3(X, LH, 0), L3(X, LH), L3(-X, LH)]),        // fedél felső éle
      face('steel', 'dark', [L3(X, 0, 0), L3(X, 0), L3(X, LH), L3(X, LH, 0)]),             // fedél oldala
      face('steel', 'base', [L3(-X, 0), L3(X, 0), L3(X, LH), L3(-X, LH)]),                 // keret
      det('dark', 'base', [L3(-X + 1.4, 1.5), L3(X - 1.4, 1.5), L3(X - 1.4, LH - 1.4), L3(-X + 1.4, LH - 1.4)]),   // kijelző
      det('dark', 'dark', [L3(X - 5.5, 1.5), L3(X - 1.4, 1.5), L3(X - 1.4, LH - 1.4), L3(X - 2.5, LH - 1.4)]),
      det('dark', 'light', [L3(-X + 3.5, LH - 1.4), L3(-X + 8.5, LH - 1.4), L3(-X + 3.5, 8.5), L3(-X + 1.4, 11.5), L3(-X + 1.4, LH - 3)], { o:.65 }),   // tükröződés
      face('steel', 'dark', b.right),                                                       // alap
      face('steel', 'base', b.front),
      face('steel', 'light', b.top),
      det('steel', 'line', inset([P([X, 0, -Z + 1.4]), P([X, 0, -Z]), P([X, HB, -Z]), P([X, HB, -Z + 1.4])], b.sil), { o:.4 }),
      det('dark', 'base', [T(-15.4, -.9), T(15.4, -.9), T(15.4, -11.2), T(-15.4, -11.2)]),  // billentyűzet-mélyedés
      dpth('dark', 'light', keys),                                                          // billentyűk
      det('steel', 'dark', [T(-5.2, 9.2), T(5.2, 9.2), T(5.2, 1.6), T(-5.2, 1.6)]),         // érintőpad
      det('leaf', 'light', circ(...P([12.5, 1.1, Z]), .45 * P.k, 8)),                       // bekapcsolt-jelző
      shine([T(-15.8, 10.8), T(-3, 10.8), T(-3, 10.1), T(-15.8, 10.1)], .7),
    ]});
  }

  // ---- 17. Billentyűzet: 44 × 15 × 2,2 cm fekete test, 5 sor világosszürke billentyű (szóköz), jelzőfények, hátul kábel USB-dugóval ----
  {
    const TILT = -18, X = 19, Z = 7.5, H = 2.2, KH = .6;
    const cab = [[0, 1.1, -Z], [0, 1.1, -Z - 3.2], [-2.4, 1.1, -Z - 6.2], [-8, 1.1, -Z - 7.6], [-13, 1.1, -Z - 7.2]];
    const P = cam({ az:22, el:56, F:150, tilt:TILT, fit:[...corners(-X, X, 0, H + KH, -Z, Z), ...cab, [-16.5, 1, -Z - 7.8]] });
    const b = box(P, -X, X, 0, H, -Z, Z), K = (x, z) => P([x, H + KH, z]), tops = [], fronts = [];
    for(let r = 0; r < 5; r++){ const z1 = 5.9 - r * 2.45, z0 = z1 - 1.95;
      const cols = r === 0 ? [[-17.8, -15.4], [-15.0, -12.6], [-12.2, -9.8], [-9.4, 6.4], [6.8, 9.2], [9.6, 12.0], [12.4, 14.8]] : Array.from({ length:12 }, (_, c) => [-17.8 + c * 2.8, -17.8 + c * 2.8 + 2.35]);
      for(const [x0, x1] of cols) tops.push([K(x0, z1), K(x1, z1), K(x1, z0), K(x0, z0)]);
      fronts.push([P([-17.8, H, z1 + .15]), P([cols[cols.length - 1][1], H, z1 + .15]), K(cols[cols.length - 1][1], z1), K(-17.8, z1)]); }
    const pl = box(P, -16.5, -13, .4, 1.8, -Z - 7.9, -Z - 6.5);
    fin('i_billentyuzet', { hu:'Billentyűzet', en:'black computer keyboard with grey keys and a USB cable', tilt:TILT, shapes:[
      face('dark', 'base', tube(smooth(cab.map(P), 3), 1.9)),                               // kábel
      face('steel', 'base', pl.sil), det('steel', 'light', pl.top),                         // USB-dugó
      face('dark', 'dark', b.right),                                                        // test
      face('dark', 'base', b.front),
      face('dark', 'light', b.top),
      det('dark', 'line', inset([P([X, 0, -Z + 1.4]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + 1.4])], b.sil), { o:.6 }),
      dpth('steel', 'dark', fronts),                                                        // billentyűk eleje
      dpth('steel', 'base', tops),                                                         // billentyűk teteje
      dpth('leaf', 'light', [15.4, 16.6, 17.8].map(x => circ(0, 0, .42, 8).map(([u, v]) => P([x + u, H, 6.4 + v])))),   // jelzőfények
      shine([P([-18.5, .5, Z]), P([8, .5, Z]), P([8, 1.1, Z]), P([-18.5, 1.1, Z])], .35),
      dpth('paper', 'light', [0, 1, 2].map(c => [K(-17.8 + c * 2.8 + .3, 5.6), K(-17.8 + c * 2.8 + 1.3, 5.6), K(-17.8 + c * 2.8 + 1.3, 5.2), K(-17.8 + c * 2.8 + .3, 5.2)]), { o:.8 }),
    ]});
  }

  // ---- 18. Fejhallgató: párnázott fejpánt ezüst csúszkákkal, két piros kagyló (bal: fekete párna látszik, jobb: külső héj), kábel jack-dugóval ----
  {
    const TILT = 10, RB = 9, YC = 9, HW = 1.7;
    const arcP = (r, z, n = 14) => Array.from({ length:n + 1 }, (_, i) => { const t = -90 + 180 * i / n; return [r * sin(t), YC + r * cos(t), z]; });
    const cab = [[-9, .6, .4], [-8.8, -2.6, 1.4], [-5.8, -5.2, 2.6], [-.8, -6.0, 3.2], [3.6, -5.2, 3.6]];
    const fitP = [...arcP(RB, -HW), ...arcP(RB, HW), ...cab, ...corners(-11, 11, 0, 10, -4.5, 4.5)];
    const P = cam({ az:34, el:18, F:90, tilt:TILT, fit:fitP });
    const pr = pts => pts.map(P), rev = a => a.slice().reverse();
    const cupL = acyl(P, [-11.2, 5, 0], [1, 0, 0], 4.3, 2.9, 16), cupR = acyl(P, [8.3, 5, 0], [1, 0, 0], 4.3, 2.9, 16);
    const padL = acyl(P, [-8.3, 5, 0], [1, 0, 0], 3.9, 1.2, 16);
    const strip = (c, a0, a1, t0, t1, n = 6) => [...Array.from({ length:n + 1 }, (_, i) => c.at(t0, a0 + (a1 - a0) * i / n)), ...Array.from({ length:n + 1 }, (_, i) => c.at(t1, a1 - (a1 - a0) * i / n))];
    const jack = acyl(P, [3.6, -5.2, 3.6], [1, .15, .1], .45, 2.6, 8);
    fin('i_fulhallgato', { hu:'Fülhallgató', en:'red over-ear headphones with a padded headband and a cable', tilt:TILT, shapes:[
      face('dark', 'base', tube(smooth(cab.map(P), 3), 1.5)),                               // kábel
      face('steel', 'base', jack.sil),                                                      // jack-dugó
      face('dark', 'base', [...pr(arcP(RB, -HW)), ...rev(pr(arcP(RB - .9, HW)))]),          // fejpánt
      det('dark', 'light', inset([...pr(arcP(RB, -HW)), ...rev(pr(arcP(RB, HW)))], [...pr(arcP(RB, -HW)), ...rev(pr(arcP(RB - .9, HW)))])),
      dpth('steel', 'base', [[-90, -74], [74, 90]].map(([a, c]) => [P([RB * sin(a), YC + RB * cos(a), HW]), P([RB * sin(c), YC + RB * cos(c), HW]), P([(RB - .9) * sin(c), YC + (RB - .9) * cos(c), HW]), P([(RB - .9) * sin(a), YC + (RB - .9) * cos(a), HW])])),   // csúszkák
      face('red', 'base', cupL.sil),                                                        // bal kagyló
      det('red', 'light', strip(cupL, 50, 140, 0, 2.9)),
      face('dark', 'base', padL.sil),                                                       // fülpárna
      det('dark', 'light', padL.top),
      det('dark', 'line', circ(...P([-7.1, 5, 0]), 2.1 * P.k, 14, 2.1 * P.k), { o:.9 }),
      face('red', 'base', cupR.sil),                                                        // jobb kagyló
      det('red', 'light', strip(cupR, 50, 140, 0, 2.9)),
      det('red', 'dark', strip(cupR, -140, -40, 0, 2.9)),
      face('red', 'dark', cupR.top),                                                        // külső héj
      det('red', 'line', cupR.ring(2.9, 2.2), { o:.5 }),
      shine(strip(cupR, 70, 100, .4, 2.5, 2), .7),
    ]});
  }

  // ---- 19. LED-izzó: a jóváhagyott ledizzo_b (docs/rajzolas/minta/ledizzo) ritkított mintavétellel – tejfehér búra, bordás nyak, menetes talp ----
  {
    const PR = { tip:[[.30, 0], [.45, .34]], ins:[[.72, .34], [.95, .95]], base:{ y0:.95, y1:3.40, valley:1.28, crest:1.43 },
      neck:[[1.55, 3.62], [1.74, 4.30], [2.06, 5.15], [2.42, 5.90]], dome:{ R:3.0, jointR:2.42, jointY:5.9 } };
    PR.dome.yc = PR.dome.jointY + sqrt(PR.dome.R ** 2 - PR.dome.jointR ** 2);
    const orient = (poly, sign) => (Math.sign(area(poly)) === sign ? poly : [...poly].reverse());
    const region = (test, n = 40) => { let sx = 0, sy = 0, k = 0;
      for(let x = 0; x <= 100; x += 1.25) for(let y = 0; y <= 100; y += 1.25) if(test(x, y)){ sx += x; sy += y; k++; }
      if(!k) return null; const cx = sx / k, cy = sy / k;
      return Array.from({ length:n }, (_, i) => { const a = 2 * PI * i / n, dx = Math.cos(a), dy = Math.sin(a); let lo = 0, hi = 70;
        for(let j = 0; j < 24; j++){ const m = (lo + hi) / 2; if(test(cx + dx * m, cy + dy * m)) lo = m; else hi = m; } return [cx + dx * lo, cy + dy * lo]; }); };
    const f = rad(16), c = Math.cos(f), s = Math.sin(f), top = PR.dome.yc * c + PR.dome.R, bot = -PR.tip[0][0] * s, S = 84 / (top - bot), mid = (top + bot) / 2;
    const v = { S, c, s, mid, pr:(X, Y, Z) => [50 + S * X, 50 - S * (Y * c - Z * s - mid)] };
    v.ring = (r, Y, th) => v.pr(r * Math.sin(th), Y, r * Math.cos(th));
    const smoothLathe = (rings, tone, step = 9) => {
      const sil = [];
      for(let i = rings.length - 1; i >= 0; i--) sil.push(v.ring(rings[i][0], rings[i][1], rad(-90)));
      for(let t = -90; t <= 90; t += 12) sil.push(v.ring(rings[0][0], rings[0][1], rad(t)));
      for(let i = 0; i < rings.length; i++) sil.push(v.ring(rings[i][0], rings[i][1], rad(90)));
      for(let t = 108; t <= 252; t += 24) sil.push(v.ring(rings[rings.length - 1][0], rings[rings.length - 1][1], rad(t)));
      const bands = {};
      for(let i = 0; i < rings.length - 1; i++){
        const [ra, ya] = rings[i], [rb, yb] = rings[i + 1], [nr, ny] = norm([yb - ya, -(rb - ra)]);
        const key = t => tone(nr * Math.sin(rad(t)) * LIGHT[0] + ny * LIGHT[1] + nr * Math.cos(rad(t)) * LIGHT[2]);
        let start = -90, cur = key(-90 + step / 2);
        for(let t = -90 + step; t <= 90; t += step){
          const k = t < 90 ? key(t + step / 2) : '__end';
          if(k !== cur){ if(cur){ const poly = [];
              for(let u = start; u <= t; u += step) poly.push(v.ring(rb, yb, rad(u)));
              for(let u = t; u >= start; u -= step) poly.push(v.ring(ra, ya, rad(u)));
              (bands[cur] = bands[cur] || []).push(poly); }
            start = t; cur = k; }
        }
      }
      return { sil:simplify(sil, .12), bands };
    };
    const layers = (bands, pal, sil) => Object.keys(pal).filter(k => bands[k]).map(k => dpth(pal[k][0], pal[k][1], bands[k].map(p => simplify(inset(p, sil), .12)), pal[k][2] != null ? { o:pal[k][2] } : {}));
    const TILT = 22, shapes = [];
    shapes.push(pth('steel', 'base', [smoothLathe(PR.tip, () => null).sil]));
    const ins = smoothLathe(PR.ins, x => (x > .35 ? 'light' : null));
    shapes.push(pth('dark', 'base', [ins.sil]), ...layers(ins.bands, { light:['dark', 'light'] }, ins.sil));
    const b = PR.base, rings = [];
    for(let i = 0; i <= 8; i++) rings.push([i % 2 ? b.crest : b.valley, b.y0 + (b.y1 + .22 - b.y0) * i / 8]);
    const T4 = x => (x > .62 ? 'light' : x > .12 ? null : x > -.3 ? 'dark' : 'edge');
    const base = smoothLathe(rings, x => (x > .84 ? 'light' : x > .36 ? null : x > -.1 ? 'dark' : 'edge'));
    shapes.push(pth('steel', 'base', [base.sil]), ...layers(base.bands, { light:['steel', 'light'], dark:['steel', 'dark'], edge:['steel', 'line', .55] }, base.sil));
    const neck = smoothLathe(PR.neck, T4);
    shapes.push(pth('white', 'dark', [neck.sil]), ...layers(neck.bands, { light:['white', 'base'], dark:['steel', 'dark', .55], edge:['white', 'line', .45] }, neck.sil));
    const ribs = [-58, -28, 2, 32, 62].map(t => { const pts = PR.neck.map(([r, y]) => v.ring(r, y, rad(t))); pts[3] = v.ring(PR.neck[3][0], PR.neck[3][1] - .18, rad(t)); return band(inset(pts, neck.sil, 2.4), 1.9, true); });
    shapes.push(dpth('steel', 'dark', ribs));
    const D = PR.dome, domeN = (x, y, pad = 0) => {
      const X = (x - 50) / v.S, yv = v.mid - (y - 50) / v.S, dy = yv - D.yc * v.c, rho2 = X * X + dy * dy, RR = D.R - pad / v.S;
      if(rho2 >= RR * RR) return null;
      const z = sqrt(D.R * D.R - rho2), Yr = dy * v.c + z * v.s, Zr = -dy * v.s + z * v.c;
      if(Yr < D.jointY - D.yc + pad / v.S * 1.4) return null;
      return [X / D.R, Yr / D.R, Zr / D.R];
    };
    const dsil = region((x, y) => !!domeN(x, y), 32), din = region((x, y) => !!domeN(x, y, .85), 32);
    const cap = t => region((x, y) => { const n = domeN(x, y, .85); return !!n && dot(n, LIGHT) > t; }, 22);
    const cres = t => [orient(din, 1), orient(cap(t), -1)];
    shapes.push(pth('white', 'base', [dsil]), dpth('white', 'light', [cap(.8)]), dpth('white', 'dark', cres(.28)), dpth('white', 'line', cres(-.12), { o:.35 }));
    const sh = [.3, .55, .8].map(q => v.ring(b.crest - .02, b.y0 + (b.y1 - b.y0) * q, rad(-52)));
    shapes.push(dpth('white', 'light', [band(sh, 1.8, true)], { o:.8 }));
    fin('i_ledizzo', { hu:'LED-izzó', en:'white LED light bulb with a milky dome, ribbed neck and screw base', tilt:TILT, shapes });
  }

  // ---- 20. Porszívó: piros porzsák-test nagy hátsó kerékkel és fogantyúval, bordás gégecső, fém szívócső, lapos szívófej kefesávval ----
  {
    const TILT = -10, L = lightFor(TILT);
    const body = Blob({ cx:33, cy:62, rx:27, ry:19, f:th => 1 - .08 * sin(th) }), under = [[0, 66], [100, 66], [100, 100], [0, 100]];
    const hose = Tube(resample(spineOf([[57, 60], [64, 40], [74, 25], [86, 23], [90, 30]]), 18), 7.2);
    const wand = Tube([[89, 33], [86, 58], [83, 80]], 4.4);
    const handle = tube(smooth([[21, 46], [26, 36], [40, 35], [45, 44]], 3), 4.2, false);
    const nozzle = [[64, 82], [96, 79], [98, 87], [66, 91]];
    fin('i_porszivo', { hu:'Porszívó', en:'red canister vacuum cleaner with a ribbed hose, metal wand and floor nozzle', tilt:TILT, shapes:[
      face('dark', 'base', nozzle),                                                         // szívófej
      det('dark', 'light', inset([[64, 82], [96, 79], [96.6, 81.6], [64.6, 84.8]], nozzle)),
      det('honey', 'base', inset([[66, 88.6], [97.6, 85.2], [98, 87], [66, 91]], nozzle, 1.1)),   // kefesáv
      face('steel', 'base', wand.sil(false, false)),                                        // szívócső
      dpth('steel', 'light', wand.tone(L, TONE.light)),
      dpth('steel', 'dark', wand.tone(L, TONE.dark, true)),
      face('dark', 'base', hose.sil(false, false)),                                         // gégecső
      dpth('steel', 'dark', Array.from({ length:8 }, (_, i) => tube([hose.at(2 * i + 1, -.78), hose.at(2 * i + 1, .78)], 1.5, false)), { o:.85 }),   // bordák
      face('red', 'dark', tube([[85, 22], [91, 35]], 6.2, true)),                           // markolat
      face('dark', 'base', handle),                                                         // fogantyú
      face('red', 'base', body.sil(30)),                                                    // test
      dpth('red', 'light', body.tone(L, TONE.light)),
      dpth('red', 'dark', body.tone(L, TONE.dark).map(p => clip(p, [[0, 0], [100, 0], [100, 67], [0, 67]]))),
      det('dark', 'base', inset(clip(body.sil(30), under), body.sil(30))),                  // ütköző
      face('dark', 'base', circ(21, 73, 10, 16)),                                           // kerék
      det('steel', 'light', circ(20, 72, 4, 10)),
      det('dark', 'line', circ(58.5, 59.5, 4.8, 12, 5.6)),                                  // csatlakozó
      shine(tube([[16, 56], [22, 49], [30, 46]], 2.2), .6),
    ]});
  }

  // ============================================================================================
  //  GYÓGYSZER – szemcsepp (kicsi, hegyes cseppentő + doboz szem-jellel) · orrspray (magas, ujjtámaszos pumpa, mellette a kupak) ·
  //  buborékfólia (kerek fehér tabletták, kinyomott üres zsebek) · antibiotikum (doboz, kihúzott levél kétszínű kapszulákkal) · porgyógyszer (tasakok, kiszóródott por)
  // ============================================================================================

  // ---- 21. Szemcsepp: 7,6 cm-es fehér flakon hegyes cseppentővel, égkék címke; mögötte kis doboz kék sávval és szem-jellel ----
  {
    const TILT = -10, OX = -2.3, OZ = .9;
    const bodyP = [[1.3, 0], [1.45, .2], [1.5, .5], [1.5, 4.0], [1.3, 4.6], [.78, 5.0], [.72, 5.4]], tipP = [[.74, 5.3], [.62, 5.9], [.24, 7.3], [.07, 7.6]];
    const bx = [.6, 4.4, 0, 7.0, -2.4, -.2];
    const P = cam({ az:26, el:16, F:60, tilt:TILT, fit:[...corners(OX - 1.5, 4.4, 0, 7.6, -2.4, OZ + 1.5)] });
    const Q = posed(P, v => [v[0] + OX, v[1], v[2] + OZ]), B = lathe(Q, bodyP), T = lathe(Q, tipP), b = box(P, ...bx);
    const F = (x, y) => P([x, y, bx[5]]), ec = F(2.5, 3.6), k = P.k;
    const eye = [[-1.25, 0], [-.6, -.55], [0, -.72], [.6, -.55], [1.25, 0], [.6, .55], [0, .72], [-.6, .55]].map(([x, y]) => [ec[0] + x * k, ec[1] + y * k]);
    fin('i_szemcsepp', { hu:'Szemcsepp', en:'small white eye drops bottle with a pointed dropper tip and its box', tilt:TILT, shapes:[
      face('white', 'dark', b.right),                                                       // doboz
      face('white', 'base', b.front),
      face('white', 'light', b.top),
      det('sky', 'base', [F(bx[0], 2.3), F(bx[1], 2.3), F(bx[1], 4.9), F(bx[0], 4.9)]),     // kék sáv
      det('sky', 'dark', [P([bx[1], 2.3, bx[5]]), P([bx[1], 2.3, bx[4]]), P([bx[1], 4.9, bx[4]]), P([bx[1], 4.9, bx[5]])]),
      det('white', 'light', eye), det('blue', 'base', circ(ec[0], ec[1], .5 * k, 8)),       // szem-jel
      pth('white', 'base', [B.sil]),                                                        // flakon
      det('white', 'dark', B.strip(30, 90, .2, 4.6)),
      det('white', 'line', B.strip(68, 90, .2, 4.6), { o:.35 }),
      det('sky', 'base', B.strip(-90, 90, 1.1, 3.5, 8)),                                    // címke
      det('sky', 'dark', B.strip(30, 90, 1.1, 3.5)),
      pth('white', 'base', [T.sil]),                                                        // hegyes cseppentő
      det('white', 'dark', T.strip(20, 90, 5.3, 7.5, 3)),
      shine(B.strip(-68, -58, .6, 4.2, 2), .9),
    ]});
  }

  // ---- 22. Orrspray: 10 cm-es fehér flakon ujjtámaszos pumpafejjel és hosszú, lekerekített orrcsővel; mellette a levett türkiz kupak ----
  {
    const TILT = 10;
    const bodyP = [[1.55, 0], [1.75, .3], [1.75, 5.2], [1.5, 5.8], [.9, 6.1]], nozP = [[.72, 6.6], [.72, 7.3], [.6, 9.0], [.38, 9.9], [.1, 10.15]];
    const P = cam({ az:24, el:18, F:70, tilt:TILT, fit:[...corners(-2.5, 7.8, 0, 10.2, -2, 2.8)] });
    const B = lathe(P, bodyP), N = lathe(P, nozP), col = cyl(P, 0, 0, 2.35, 6.0, 6.55, 18);
    const cap = acyl(P, [3.0, 1.05, 1.7], [1, 0, -.28], 1.05, 4.0, 14);
    const cs = (a0, a1) => [...Array.from({ length:5 }, (_, i) => cap.at(0, a0 + (a1 - a0) * i / 4)), ...Array.from({ length:5 }, (_, i) => cap.at(4, a1 - (a1 - a0) * i / 4))];
    fin('i_orrspray', { hu:'Orrspray', en:'white nasal spray bottle with a finger collar and long nozzle, cap off beside it', tilt:TILT, shapes:[
      pth('white', 'base', [B.sil]),                                                        // flakon
      det('white', 'dark', B.strip(30, 90, .3, 5.8)),
      det('white', 'line', B.strip(68, 90, .3, 5.8), { o:.35 }),
      det('teal', 'base', B.strip(-90, 90, 1.2, 4.4, 8)),                                   // címke
      det('teal', 'dark', B.strip(30, 90, 1.2, 4.4)),
      face('white', 'dark', col.sil),                                                       // ujjtámasz
      det('white', 'light', col.top),
      pth('white', 'base', [N.sil]),                                                        // orrcső
      det('white', 'dark', N.strip(24, 90, 6.6, 10.0, 3)),
      face('teal', 'base', cap.sil),                                                        // levett kupak
      det('teal', 'light', cs(60, 130)),
      face('teal', 'light', cap.top),
      det('teal', 'line', cap.ring(4, .75), { o:.85 }),                                     // a kupak belseje
      shine(B.strip(-68, -58, .7, 4.9, 2), .9),
      shine(N.strip(-70, -50, 7.2, 9.2, 2), .8),
    ]});
  }

  // ---- 23. Gyógyszeres buborékfólia: 4,6 × 9,6 cm-es alufólia lap, 2 × 5 átlátszó zseb kerek fehér tablettákkal; 3 zseb kinyomva (szakadt fólia), egy tabletta mellette ----
  {
    const TILT = -18, W = 2.3, Dp = 4.8, HT = .12;
    const P = cam({ az:22, el:52, F:60, tilt:TILT, fit:corners(-W, W + 2.4, 0, HT + .5, -Dp, Dp) });
    const b = box(P, -W, W, 0, HT, -Dp, Dp);
    const ring = (x, z, r, y, n = 12) => Array.from({ length:n }, (_, i) => P([x + r * sin(360 * i / n), y, z + r * cos(360 * i / n)]));
    const cells = []; for(let r = 0; r < 5; r++) for(let c = 0; c < 2; c++) cells.push({ x:c ? 1.1 : -1.1, z:-3.8 + r * 1.9, empty:[1, 4, 9].includes(r * 2 + c) });
    const full = cells.filter(q => !q.empty), empty = cells.filter(q => q.empty);
    const dome = q => hull([...ring(q.x, q.z, .8, HT), ...ring(q.x, q.z, .5, HT + .46)]);
    const pill = circ(0, 0, .62, 12).map(([u, v]) => P([3.4 + u, 0, 2.2 + v])), pillT = circ(0, 0, .62, 12).map(([u, v]) => P([3.4 + u, .32, 2.2 + v]));
    fin('i_buborekfolia', { hu:'Gyógyszeres buborékfólia', en:'pill blister strip with round white tablets, some pockets pressed out and empty', tilt:TILT, shapes:[
      face('steel', 'dark', b.right),                                                       // fólialap
      face('steel', 'base', b.front),
      face('steel', 'light', b.top),
      det('steel', 'dark', [P([-W + .2, HT, .92]), P([W - .2, HT, .92]), P([W - .2, HT, .86]), P([-W + .2, HT, .86])], { o:.7 }),   // perforáció
      dpth('dark', 'base', empty.map(q => ring(q.x, q.z, .72, HT, 10))),                    // kinyomott zsebek: szakadt fólia, üres lyuk
      dpth('steel', 'light', empty.map(q => [P([q.x - .72, HT, q.z + .05]), P([q.x - .1, HT, q.z + .25]), P([q.x - .55, HT + .25, q.z + .75])])),   // felhajló fólia-darab
      dpth('steel', 'dark', empty.map(q => [P([q.x + .7, HT, q.z - .2]), P([q.x + .15, HT, q.z - .5]), P([q.x + .45, HT + .2, q.z - .85])])),
      { t:'path', m:'glass', tone:'base', d:true, o:.8, polys:full.map(dome) },             // átlátszó zsebek
      { t:'path', m:'white', tone:'base', d:true, polys:full.map(q => ring(q.x + .04, q.z + .06, .58, HT + .32, 12)) },   // tabletták
      dpth('white', 'dark', full.map(q => ring(q.x + .2, q.z + .18, .38, HT + .32, 8)), { o:.9 }),
      dpth('paper', 'light', full.map(q => ring(q.x - .36, q.z - .22, .17, HT + .46, 6)), { o:.95 }),   // csillanás
      face('white', 'dark', hull([...pill, ...pillT])),                                     // kinyomott tabletta
      det('white', 'light', pillT),
    ]});
  }

  // ---- 24. Lejárt antibiotikum: álló gyógyszeres doboz (5,8 × 9 × 2,6 cm) nyitott fedéllel, kihúzott buborékfólia kétszínű (piros–sárga) kapszulákkal ----
  {
    const TILT = -10, X = 2.9, H = 9, Z = 1.3, CT = 13.6;
    const P = cam({ az:30, el:22, F:60, tilt:TILT, fit:[...corners(-X, X, 0, CT, -Z, Z), [0, H + 2.6, -Z - 1.6]] });
    const b = box(P, -X, X, 0, H, -Z, Z), k = P.k;
    const flap = [P([-X, H, -Z]), P([X, H, -Z]), P([X, H + 2.4, -Z - 1.4]), P([-X, H + 2.4, -Z - 1.4])];
    const card = [P([-2.55, 6, 0]), P([2.55, 6, 0]), P([2.55, CT, 0]), P([-2.55, CT, 0])];
    const stad = (c, L, r, sc = k) => [...Array.from({ length:7 }, (_, i) => [c[0] + (L + r * cos(-90 + 30 * i)) * sc, c[1] + r * sin(-90 + 30 * i) * sc]),
      ...Array.from({ length:7 }, (_, i) => [c[0] + (-L + r * cos(90 + 30 * i)) * sc, c[1] + r * sin(90 + 30 * i) * sc])];
    const halves = (st, c) => [clip(st, [[c[0] - 50, c[1] - 50], [c[0], c[1] - 50], [c[0], c[1] + 50], [c[0] - 50, c[1] + 50]]), clip(st, [[c[0], c[1] - 50], [c[0] + 50, c[1] - 50], [c[0] + 50, c[1] + 50], [c[0], c[1] + 50]])];
    const caps = [[-1.25, 10.2], [1.3, 10.4], [-1.25, 12.4], [1.3, 12.6]].map(([x, y]) => { const c = P([x, y, .3]), st = stad(c, .62, .5); const [left, right] = halves(st, c); return { left, right, c }; });
    const F = (x, y) => P([x, y, Z]), ic = F(-.2, 3.2), icon = stad(ic, .95, .72), [iconL, iconR] = halves(icon, ic);
    fin('i_antibiotikum', { hu:'Lejárt antibiotikum', en:'medicine box with a blister of red and yellow capsules half pulled out', tilt:TILT, shapes:[
      face('white', 'light', flap),                                                         // felnyitott fedél
      face('white', 'dark', b.right),                                                       // doboz
      det('dark', 'dark', [P([-X, H, -Z]), P([X, H, -Z]), P([X, H, 0]), P([-X, H, 0])]),    // a doboz nyílása (hátsó fele)
      face('steel', 'light', card),                                                         // kihúzott buborékfólia
      dpth('red', 'base', caps.map(q => q.left)),                                           // kapszulák
      dpth('honey', 'base', caps.map(q => q.right)),
      dpth('paper', 'light', caps.map(q => [[q.c[0] - .8 * k, q.c[1] - .25 * k], [q.c[0] + .6 * k, q.c[1] - .25 * k], [q.c[0] + .6 * k, q.c[1] - .1 * k], [q.c[0] - .8 * k, q.c[1] - .1 * k]]), { o:.8 }),
      det('dark', 'base', [P([-X, H, 0]), P([X, H, 0]), P([X, H, Z]), P([-X, H, Z])]),      // nyílás (első fele)
      face('white', 'base', b.front),
      det('red', 'base', [F(-X, 5.6), F(X, 5.6), F(X, 7.0), F(-X, 7.0)]),                   // piros sáv
      det('red', 'dark', [P([X, 5.6, Z]), P([X, 5.6, -Z]), P([X, 7.0, -Z]), P([X, 7.0, Z])]),
      det('red', 'base', iconL),         // kapszula-jel
      det('honey', 'base', iconR),
      det('white', 'line', inset([P([X, 0, -Z + .5]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + .5])], b.sil), { o:.35 }),
      shine([F(-2.6, .6), F(-2.2, .6), F(-2.2, 5.0), F(-2.6, 5.0)], .8),
    ]});
  }

  // ---- 25. Gyógyszeres tasak: három porgyógyszeres tasak (hegesztett, recés végek, tépőbevágás), az elsőt feltépték, kiszóródott por ----
  {
    const TILT = 10;
    const zig = (x0, x1, y, dy, n = 7) => Array.from({ length:2 * n + 1 }, (_, i) => [x0 + (x1 - x0) * i / (2 * n), y + (i % 2 ? dy : 0)]);
    const outline = torn => [...(torn ? [[-8, -6.5], [-6.6, -8.4], [-5.8, -8.0], [-4.6, -10.3], [-3.2, -10.6], [-2.6, -12]] : zig(-8, 8, -12, -1).slice(0, 1).concat([[-8, -12]])),
      ...zig(torn ? -2.6 : -8, 8, -12, -1, torn ? 5 : 7).slice(1), [8, -9.3], [6.7, -8.5], [8, -7.7], [8.4, 0], ...zig(8, -8, 12, 1), [-8.4, 0]];
    const sachet = (cx, cy, rot, torn) => {
      const loc = outline(torn).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]), pl = pts => place(pts, cx, cy, rot);
      const sil = pl(loc), cut = (x0, y0, x1, y1) => inset(clip(sil, pl([[x0, y0], [x1, y0], [x1, y1], [x0, y1]])), sil);
      return { sil, pl, cut, seals:[cut(-9, -14, 9, -9.6), cut(-9, 9.6, 9, 14)], light:cut(-9, -9.6, -4.8, 9.6), dark:cut(4.6, -14, 9, 14), edge:cut(6.8, -14, 9, 14), band:cut(-9, -3.2, 9, 3.8), bandD:cut(4.6, -3.2, 9, 3.8) };
    };
    const A = sachet(33, 36, -20, false), B = sachet(64, 33, 16, false), C = sachet(56, 66, -76, true);
    const pile = smooth([[14, 80], [18, 74.5], [25, 71.5], [32, 73.5], [37, 77.5], [41, 80.5], [30, 82.5], [18, 82.2]], 2);
    fin('i_porgyogyszer', { hu:'Gyógyszeres tasak', en:'three small powder medicine sachets with tear notches, one torn open with spilled powder', tilt:TILT, shapes:[
      face('white', 'base', A.sil), dpth('white', 'dark', [...A.seals, A.dark]), det('honey', 'base', A.band),   // hátsó tasakok
      face('white', 'base', B.sil), dpth('white', 'dark', [...B.seals, B.dark]), det('honey', 'base', B.band),
      face('white', 'light', pile),                                                         // kiszóródott por
      dpth('white', 'dark', [[[27, 77.2], [33, 76.5], [38.5, 79.5], [40.2, 80.8], [30, 82]]]),
      face('white', 'base', C.sil),                                                         // feltépett tasak
      det('white', 'light', C.light),
      dpth('white', 'dark', [...C.seals, C.dark]),
      det('white', 'line', C.edge, { o:.3 }),
      det('honey', 'base', C.band), det('honey', 'dark', C.bandD),
      dpth('white', 'dark', [circ(42.5, 70.5, 1.1, 6), circ(17, 85, .9, 6), circ(45, 80.5, .8, 6), circ(21, 69, .7, 6), circ(37.5, 67.5, .6, 6)]),   // porszemek
    ]});
  }

  // ============================================================================================
  //  ZÖLDHULLADÉK – karácsonyfa (díszítetlen, lépcsős ágszintek, fűrészelt tönk) · sövénynyesedék (kötegelt ágak levelekkel) ·
  //  toboz + makk + gesztenye · szalmabála (zsineggel, kilógó szálakkal) · lehullott alma és szilva barna foltokkal, sárga levélen
  // ============================================================================================
  const gauss = (d, w) => Math.exp(-(d / w) * (d / w)), dAng = (a, b) => ((a - b + 540) % 360) - 180;
  // hegyes levél sokszögként: tő (x, y), irány (fok), hossz, szélesség; half: +1 / −1 = csak az egyik fele
  const leafPoly = (x, y, deg, len, wid, half = 0, n = 5) => {
    const P = (t, o) => [x + cos(deg) * len * t - sin(deg) * o, y + sin(deg) * len * t + cos(deg) * o], w = t => wid / 2 * Math.pow(Math.sin(PI * t), .75);
    const ts = Array.from({ length:n + 1 }, (_, i) => i / n);
    if(half) return [...ts.map(t => P(t, half * w(t))), P(1, 0), P(0, 0)];
    return [...ts.map(t => P(t, w(t))), ...ts.slice(1, -1).reverse().map(t => P(t, -w(t)))];
  };

  // ---- 26. Karácsonyfa: kivágott, díszítetlen luc – négy ágszint fűrészfogas alsó éllel, fény felőli és árnyékos oldal, fűrészelt tönk ----
  {
    const TILT = 10;
    const tiers = [[6, 30, 13, 3], [17, 46, 21.5, 4], [31, 62, 29.5, 5], [45, 77, 37.5, 6]];
    const tierPoly = ([yt, yb, w, n]) => { const pts = [[50, yt], [50 + w * .42, yt + (yb - yt) * .58], [50 + w, yb + 1.2]];
      for(let i = 1; i < 2 * n; i++) pts.push([50 + w - 2 * w * i / (2 * n), yb + (i % 2 ? -3.4 : .6)]);
      return [...pts, [50 - w, yb + 1.2], [50 - w * .42, yt + (yb - yt) * .58]]; };
    const polys = tiers.map(tierPoly);
    const band = (i, q) => { const t = polys[i], below = i ? tiers[i - 1][1] + 1.2 : 0; return inset(clip(clip(t, q), [[0, below], [100, below], [100, 100], [0, 100]]), t); };
    const light = tiers.map((t, i) => band(i, halfPlane([50 - t[2] * .32, t[1] + 6], [50, t[0]])));
    const dark = tiers.map((t, i) => band(i, halfPlane([50, t[0]], [50 + t[2] * .3, t[1] + 6])));
    const edge = tiers.map((t, i) => band(i, [[0, t[1] - 3.2], [100, t[1] - 3.2], [100, 100], [0, 100]]));
    fin('i_karacsonyfa', { hu:'Karácsonyfa', en:'small cut undecorated fir tree with a sawn trunk stump', tilt:TILT, shapes:[
      face('wood', 'base', [[45.5, 70], [54.5, 70], [55, 90], [45, 92]]),                   // tönk
      det('wood', 'dark', [[51.5, 76], [54.4, 76], [54.8, 89.8], [51.6, 90.5]]),
      face('wood', 'light', circ(50, 91, 5.2, 12, 2.3, -8)),                               // fűrészelt vágáslap
      det('wood', 'base', circ(50, 91, 2.6, 8, 1.1, -8)),
      ...polys.slice().reverse().map(p => face('leaf', 'base', p)),                         // ágszintek (alulról)
      dpth('leaf', 'light', light),
      dpth('leaf', 'dark', dark),
      dpth('leaf', 'line', edge, { o:.45 }),
      shine(tube([[45, 14], [42, 24]], 2), .45),
    ]});
  }

  // ---- 27. Sövénynyesedék: zsineggel átkötött köteg nyesett ágból – vágott végek, legyezőszerűen szétálló, elágazó, leveles ágvégek ----
  {
    const TILT = -10, A = [14, 80], dir = [cos(-38), sin(-38)], nrm = [-dir[1], dir[0]], LEN = 88;
    const at = (t, o) => [A[0] + dir[0] * LEN * t + nrm[0] * o, A[1] + dir[1] * LEN * t + nrm[1] * o];
    const offs = [-4.4, -1.5, 1.5, 4.4], spread = [-19, -6, 7, 19];
    const tw = offs.map((o, i) => [at(0, o * 1.1), at(.3, o * .55), at(.46, o * .5), at(.72, o * .5 + spread[i] * .45), at(1, o * .5 + spread[i])]);
    const tubes = tw.map(s => Tube(resample(s, 6), t => 3.4 - 1.6 * t));
    const br = tw.map((s, i) => { const p = lerp(s[3], s[4], .15), q = [p[0] + dir[0] * 12 + nrm[0] * (i < 2 ? -7 : 7), p[1] + dir[1] * 12 + nrm[1] * (i < 2 ? -7 : 7)]; return { p, q }; });
    const leaves = [], backs = [];
    const addLeaf = (p, a, big, back) => (back ? backs : leaves).push({ lf:leafPoly(p[0], p[1], a, big ? 12 : 10, big ? 7 : 6, 0, 4), p, a, big });
    tw.forEach((s, i) => { const a = Math.atan2(s[4][1] - s[3][1], s[4][0] - s[3][0]) * 180 / PI;
      addLeaf(s[4], a, true, false); addLeaf(lerp(s[3], s[4], .45), a + 50, false, i % 2 === 0); addLeaf(lerp(s[3], s[4], .6), a - 50, false, i % 2 === 1);
      const b = br[i], ab = Math.atan2(b.q[1] - b.p[1], b.q[0] - b.p[0]) * 180 / PI; addLeaf(b.q, ab, false, false); addLeaf(lerp(b.p, b.q, .5), ab + (i < 2 ? -55 : 55), false, true); });
    const tc = at(.36, 0), H = 9.8, TW = 3.2;
    const twine = [[tc[0] - dir[0] * TW + nrm[0] * H, tc[1] - dir[1] * TW + nrm[1] * H], [tc[0] + dir[0] * TW + nrm[0] * H, tc[1] + dir[1] * TW + nrm[1] * H],
      [tc[0] + dir[0] * TW - nrm[0] * H, tc[1] + dir[1] * TW - nrm[1] * H], [tc[0] - dir[0] * TW - nrm[0] * H, tc[1] - dir[1] * TW - nrm[1] * H]];
    const kn = [tc[0] - nrm[0] * H, tc[1] - nrm[1] * H];
    fin('i_sovenynyeses', { hu:'Sövénynyesedék', en:'tied bundle of clipped hedge twigs with small leaves', tilt:TILT, shapes:[
      pth('leaf', 'dark', backs.map(q => q.lf)),                                            // hátsó levelek
      pth('wood', 'base', [...tubes.map(T => T.sil(false, false)), ...br.map(b => tube([b.p, b.q], 1.8, false))]),   // ágak
      dpth('wood', 'dark', tubes.map(T => T.across(0, 5, -.85, -.05))),
      dpth('wood', 'light', tubes.map(T => T.across(0, 3, .25, .75))),
      pth('leaf', 'base', leaves.map(q => q.lf)),                                           // levelek
      dpth('leaf', 'light', leaves.map(q => leafPoly(q.p[0], q.p[1], q.a, q.big ? 12 : 10, (q.big ? 7 : 6) * .85, -1, 3))),
      dpth('cream', 'base', tw.map(s => circ(s[0][0] - dir[0] * .3, s[0][1] - dir[1] * .3, 1.55, 7))),   // vágott végek
      face('honey', 'base', twine),                                                     // zsineg
      det('honey', 'dark', inset([twine[1], twine[2], lerp(twine[2], twine[3], .45), lerp(twine[1], twine[0], .45)], twine)),
      face('honey', 'base', [[kn[0] + 1, kn[1] - 1], [kn[0] + 5.5, kn[1] + 3.5], [kn[0] + 2.5, kn[1] + 7], [kn[0] - .6, kn[1] + 2.2], [kn[0] - 5.8, kn[1] + 5.2], [kn[0] - 5.2, kn[1] + .6]]),   // csomó, zsinegvégek
      det('honey', 'dark', circ(kn[0], kn[1] + 1.4, 1.3, 6)),
    ]});
  }

  // ---- 28. Toboz, termés: tobozpikkelyek sorokban (világos felső, sötétebb alsó lap), mellette makk kupacskával és fényes gesztenye ----
  {
    const TILT = -10, L = lightFor(TILT);
    const cone = Blob({ cx:39, cy:42, rx:20, ry:33, rot:18, f:th => 1 - .1 * sin(th) }), csil = cone.sil(24);
    const toS = ([u, v]) => [39 + u * cos(18) - v * sin(18), 42 + u * sin(18) + v * cos(18)];
    const up = [], lo = [], cin = inset(csil, csil, 1.2);
    for(let i = 9; i >= 0; i--) for(let j = -2; j <= 2; j++){ const u = (j + (i % 2 ? .5 : 0)) * 10, v = -29 + i * 6.4;
      const tg = [[u - 4.8, v - 2.6], [u + 4.8, v - 2.6], [u + 4.3, v + 1.6], [u + 2.2, v + 3.8], [u, v + 4.4], [u - 2.2, v + 3.8], [u - 4.3, v + 1.6]].map(toS);
      const tp = [[u - 3.2, v + 2.3], [u + 3.2, v + 2.3], [u + 1.9, v + 3.5], [u, v + 3.9], [u - 1.9, v + 3.5]].map(toS);
      const a = clip(tg, cin), b = clip(tp, cin); if(a.length > 2) up.push(a); if(b.length > 2) lo.push(b); }
    const acorn = pts => place(pts, 75, 58, 26), chest = Blob({ cx:56, cy:80, rx:15, ry:11.5, f:th => 1 + .16 * gauss(dAng(th, -100), 16) - .04 * sin(th) });
    const nut = Blob({ cx:79.8, cy:67.9, rx:8, ry:10.5, rot:26 });
    const cup = acorn([...Array.from({ length:9 }, (_, i) => [9.2 * cos(180 + 180 * i / 8), -1 + 6.2 * sin(180 + 180 * i / 8)]), [9.4, 1.8], [0, 3.6], [-9.4, 1.8]]);
    const scar = clip(chest.sil(24), [[0, 84.5], [100, 88.5], [100, 100], [0, 100]]);
    fin('i_toboz', { hu:'Toboz, termés', en:'brown pine cone with an acorn and a shiny chestnut', tilt:TILT, shapes:[
      face('wood', 'dark', place([[-1.6, -2], [1.6, -2], [1.2, 6], [-1.2, 6]], 50.2, 9.5, 198)),   // toboz szára
      face('chocolate', 'base', csil),                                                      // toboz
      dpth('wood', 'base', up),                                                             // pikkelyek (lefelé álló nyelvek)
      dpth('wood', 'light', lo),                                                            // világos pikkely-hegyek
      dpth('chocolate', 'dark', cone.tone(L, TONE.dark, 18), { o:.55 }),
      face('cardboard', 'base', nut.sil(20)),                                               // makk
      dpth('cardboard', 'light', nut.tone(L, TONE.light)),
      dpth('cardboard', 'dark', nut.tone(L, TONE.dark)),
      face('soil', 'base', cup),                                                            // kupacs
      dpth('soil', 'dark', [[-5, -3], [-1.5, -4.6], [2.5, -4.2], [6, -2.2], [-6.5, .2], [-2.5, -.8], [1.5, -.6], [5.5, .6]].map(([x, y]) => acorn(circ(x, y, .9, 5)))),
      face('wood', 'dark', acorn([[-1, -6.4], [1, -6.4], [1.3, -9.6], [-.6, -9.8]])),       // kocsány
      face('chocolate', 'light', chest.sil(28)),                                            // gesztenye
      dpth('chocolate', 'base', chest.tone(L, TONE.dark)),
      det('cream', 'base', inset(scar, chest.sil(24), 1)),
      dpth('paper', 'light', [tube([[46, 74], [51, 71.5], [57, 71]], 2.4), circ(62.5, 72.2, 1, 6)], { o:.75 }),
    ]});
  }

  // ---- 29. Széna, szalma: kis aranysárga szalmabála (18 × 9,5 × 11 cm) két zsineggel, szálas felülettel, kiálló és leesett szálakkal ----
  {
    const TILT = -10, X = 9, Y = 9.5, Z = 5.5;
    const P = cam({ az:30, el:26, F:80, tilt:TILT, fit:corners(-X - 1, X + 1.2, 0, Y + 1.4, -Z, Z + 1) });
    const b = box(P, -X, X, 0, Y, -Z, Z), q = (x, y, z) => P([x, y, z]);
    let sd = 11; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const spike = (p, d, w = .35) => { const a = P(p), e = P([p[0] + d[0], p[1] + d[1], p[2] + d[2]]), dx = e[0] - a[0], dy = e[1] - a[1], l = hypot(dx, dy) || 1;
      return [[a[0] - dy / l * w * 3, a[1] + dx / l * w * 3], e, [a[0] + dy / l * w * 3, a[1] - dx / l * w * 3]]; };
    const spikes = [...[-8, -5.5, -2.5, .5, 3, 6, 8.2].map((x, i) => spike([x, Y, Z * (i % 2 ? .3 : -.5)], [(rnd() - .5) * 2.4, 1.5 + rnd() * 1.2, (rnd() - .3) * 1.5])),
      ...[-3.5, 0, 3].map((z, i) => spike([X, Y * (.3 + .25 * i), z], [1.9, .5, .3])), spike([X, Y, Z], [1.3, 1.3, 1]), spike([-X, Y * .7, Z], [-1.7, .6, .4]), spike([2, .6, Z], [.8, -.2, 1.8])];
    const strokes = (face, n, len) => Array.from({ length:n }, () => { const u = rnd(), v = rnd(), a = (rnd() - .5) * .8;
      const p0 = face(u, v), p1 = face(u + len * Math.sin(a), v + len * Math.cos(a)); return tube([p0, p1], .8, false); });
    const onF = (u, v) => q(-X + .6 + (2 * X - 1.2) * min(1, max(0, u)), .6 + (Y - 1.2) * min(1, max(0, v)), Z);
    const onS = (u, v) => q(X, .6 + (Y - 1.2) * min(1, max(0, v)), Z - .6 - (2 * Z - 1.2) * min(1, max(0, u)));
    const onT = (u, v) => q(-X + .6 + (2 * X - 1.2) * min(1, max(0, u)), Y, -Z + .6 + (2 * Z - 1.2) * min(1, max(0, v)));
    const twF = x => [q(x - .45, 0, Z), q(x + .45, 0, Z), q(x + .45, Y, Z), q(x - .45, Y, Z)], twT = x => [q(x - .45, Y, Z), q(x + .45, Y, Z), q(x + .45, Y, -Z), q(x - .45, Y, -Z)];
    fin('i_szalma', { hu:'Széna, szalma', en:'small golden square straw bale tied with twine', tilt:TILT, shapes:[
      pth('gold', 'light', spikes),                                                         // kiálló szálak
      face('gold', 'dark', b.right),                                                        // bála
      face('gold', 'base', b.front),
      face('gold', 'light', b.top),
      det('gold', 'line', inset([q(X, 0, -Z + 1), q(X, 0, -Z), q(X, Y, -Z), q(X, Y, -Z + 1)], b.sil), { o:.45 }),
      dpth('gold', 'base', strokes(onT, 12, .25), { o:.9 }),                                // szálas felület
      dpth('gold', 'dark', strokes(onF, 16, .3)),
      dpth('gold', 'line', strokes(onS, 10, .3), { o:.4 }),
      dpth('wood', 'base', [twF(-4.6), twF(4.6)]),                                          // zsineg
      dpth('wood', 'light', [twT(-4.6), twT(4.6)]),
      shine([q(-8.4, 1, Z), q(-7.8, 1, Z), q(-7.8, 8.4, Z), q(-8.4, 8.4, Z)], .5),
    ]});
  }

  // ---- 30. Lehullott gyümölcs: piros alma és lila szilva barna, puha foltokkal, egy sárguló levélen ----
  {
    const TILT = 10, L = lightFor(TILT);
    const leaf = leafPoly(46, 84, -22, 52, 24, 0, 6), leafH = leafPoly(46, 84, -22, 52, 21, -1, 5);
    const veins = [.3, .5, .7].flatMap(t => { const c = [46 + cos(-22) * 52 * t, 84 + sin(-22) * 52 * t]; return [tube([c, [c[0] + cos(-62) * 7, c[1] + sin(-62) * 7]], .9, false), tube([c, [c[0] + cos(18) * 7, c[1] + sin(18) * 7]], .9, false)]; });
    const plum = Blob({ cx:68, cy:56, rx:17, ry:21, rot:22, f:th => 1 - .05 * sin(th) });
    const apple = Blob({ cx:39, cy:56, rx:24, ry:22, f:th => 1 - .06 * sin(th) - .17 * gauss(dAng(th, -90), 18) - .06 * gauss(dAng(th, 90), 22) });
    const spot = (cx, cy, r, s = 3) => circ(cx, cy, r, 9).map(([x, y], i) => [cx + (x - cx) * (1 + .12 * sin(i * 137 + s)), cy + (y - cy) * (1 + .12 * sin(i * 91 + s))]);
    fin('i_hullottgyumolcs', { hu:'Lehullott gyümölcs', en:'fallen red apple and purple plum with brown bruises on a yellowed leaf', tilt:TILT, shapes:[
      face('gold', 'base', leaf),                                                           // sárguló levél
      det('gold', 'light', inset(leafH, leaf)),
      dpth('gold', 'dark', [tube([[40, 87], [46, 84], [93.5, 64.7]], 1.2, false), ...veins]),   // levélnyél, erek
      face('purple', 'base', plum.sil(28)),                                                 // szilva
      dpth('purple', 'light', plum.tone(L, TONE.light)),
      dpth('purple', 'dark', plum.tone(L, TONE.dark)),
      det('purple', 'line', tube(smooth([plum.at(-70, .95), plum.at(-10, .78), plum.at(60, .9)], 3), 1.3, false), { o:.7 }),   // barázda
      det('soil', 'base', spot(76, 66, 4.2)),                                               // puha folt
      face('red', 'base', apple.sil(32)),                                                   // alma
      dpth('red', 'light', apple.tone(L, TONE.light)),
      dpth('red', 'dark', apple.tone(L, TONE.dark)),
      det('soil', 'base', spot(47, 63, 6, 7), { o:.9 }),                                    // barna foltok
      det('soil', 'dark', spot(48, 64, 2.8, 2)),
      det('soil', 'base', spot(29, 67, 3.2, 5), { o:.85 }),
      face('wood', 'base', tube([[39.5, 37], [40.5, 30], [43.5, 25]], 2.6, false)),         // szár
      shine(tube([[24, 47], [27, 42], [32, 39.5]], 2.6), .7),
    ]});
  }
})();
