// ============================================================
//  Matricák — Szelektálj! különleges gyűjtésű hulladékok, B szint (docs/rajzolas.md) – 1. rész:
//  elemek, akkumulátorok · textil · veszélyes hulladék (i_ + azonosító). A 2. rész (e-hulladék, gyógyszer, zöldhulladék): art-waste-special-b.js
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
  // prizma: konvex szelvény sec = [[a, b], …] (az óramutatóval ellentétes körüljárás), A, B = a szelvény síkja, T = a hossz-tengely (t0…t1)
  // → runs[tónus] = összefüggő, azonos tónusú oldal-sávok · cap = a látható véglap · sil = körvonal
  function prism(P, sec, o){
    const A = o.A || [0, 0, 1], B = o.B || [0, 1, 0], T = o.T || [1, 0, 0], O = o.o || [0, 0, 0], t0 = o.t0, t1 = o.t1, tone = o.tone || toneOf;
    const pos = ([a, b], t) => [0, 1, 2].map(i => O[i] + a * A[i] + b * B[i] + t * T[i]);
    const n = sec.length, segs = sec.map((p, i) => { const q = sec[(i + 1) % n], da = q[0] - p[0], db = q[1] - p[1], l = hypot(da, db) || 1;
      const nn = [0, 1, 2].map(k => db / l * A[k] - da / l * B[k]); return dot(nn, P.V) > .01 ? tone(nn) : null; });
    const runs = {};
    let s0 = segs.findIndex((k, i) => k !== segs[(i - 1 + n) % n]); if(s0 < 0) s0 = 0;
    for(let j = 0; j < n;){
      const i = (s0 + j) % n, k = segs[i]; let len = 1;
      while(len < n && segs[(i + len) % n] === k) len++;
      if(k){ const idx = Array.from({ length:len + 1 }, (_, m) => (i + m) % n);
        (runs[k] = runs[k] || []).push([...idx.map(m => P(pos(sec[m], t0))), ...idx.slice().reverse().map(m => P(pos(sec[m], t1)))]); }
      j += len;
    }
    const c0 = sec.map(p => P(pos(p, t0))), c1 = sec.map(p => P(pos(p, t1))), front = dot(T, P.V) > 0;
    return { runs, cap:front ? c1 : c0, capTone:tone(front ? T : T.map(x => -x)), sil:hull([...c0, ...c1]), pos, segs };
  }
  // lekerekített téglalap szelvény (óramutatóval ellentétes)
  const rrect = (w, h, r, n = 3) => [[w / 2 - r, -h / 2 + r, -90], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180]]
    .flatMap(([x, y, a0]) => Array.from({ length:n + 1 }, (_, i) => [x + r * cos(a0 + 90 * i / n), y + r * sin(a0 + 90 * i / n)]));
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
  const rotZ = deg => v => [v[0] * cos(deg) - v[1] * sin(deg), v[0] * sin(deg) + v[1] * cos(deg), v[2]];
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
  // veszély-rombusz: fehér lap, piros keret (vonal), fekete piktogram-forma
  const diamond = (c, r) => [[c[0], c[1] - r], [c[0] + r, c[1]], [c[0], c[1] + r], [c[0] - r, c[1]]];

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
  //  ELEMEK, AKKUMULÁTOROK – öt, egymástól jól elváló forma és szín:
  //  9V (magas, keskeny, fekete + réz sáv, két patent a tetején) · autó-akku (széles doboz, piros/fekete saru, fogantyú) ·
  //  powerbank (kék, lapos lap kábellel, 4 pötty) · szerszám-akku (sárga + sötétszürke, csúszósín) · bicikli-akku (hosszú, lekerekített rúd, zár)
  // ============================================================================================

  // ---- 1. 9V-os elem: 2,65 × 1,75 × 4,85 cm; a tetején hatszögletű (anya) és kerek (apa) patent, peremezett fém gallér ----
  {
    const TILT = -12, X = 1.325, Z = .875, H = 4.85, BAND = 2.05, CR = .3;
    const P = cam({ az:30, el:30, F:40, tilt:TILT, fit:corners(-X, X, 0, H + .45, -Z, Z) });
    const b = box(P, -X, X, 0, H, -Z, Z);
    const fr = (y0, y1, x0 = -X, x1 = X) => [[x0, y0, Z], [x1, y0, Z], [x1, y1, Z], [x0, y1, Z]].map(P);
    const sd = (y0, y1, z0 = -Z, z1 = Z) => [[X, y0, z1], [X, y0, z0], [X, y1, z0], [X, y1, z1]].map(P);
    const hex = cyl(P, -.62, 0, .46, H, H + .38, 6, 30), stud = cyl(P, .64, 0, .3, H, H + .42, 12);
    fin('i_elem9v', { hu:'9V-os elem', en:'rectangular 9 volt battery with two snap terminals', tilt:TILT, shapes:[
      face('dark', 'dark', b.right),                                                        // oldala
      face('dark', 'base', b.front),                                                        // eleje
      det('orange', 'base', inset(fr(0, BAND), b.sil)),                                     // réz sáv elöl
      det('orange', 'dark', inset(sd(0, BAND), b.sil)),                                     // réz sáv oldalt
      det('orange', 'light', inset(fr(BAND - .2, BAND), b.sil)),                            // a sáv fény felőli pereme
      det('dark', 'line', inset(sd(0, H, -Z, -Z + .3), b.sil), { o:.6 }),                   // hátsó élsáv
      det('steel', 'base', inset(fr(H - CR, H), b.sil)),                                    // peremezett fém gallér
      det('steel', 'dark', inset(sd(H - CR, H), b.sil)),
      face('steel', 'light', b.top),                                                        // teteje (fém perem)
      det('dark', 'light', [[-X + .2, H, Z - .18], [X - .2, H, Z - .18], [X - .2, H, -Z + .18], [-X + .2, H, -Z + .18]].map(P)),   // szigetelő lap
      face('steel', 'dark', hex.sil),                                                       // hatszögletű patent
      det('steel', 'light', hex.top),
      det('dark', 'base', cyl(P, -.62, 0, .22, H + .38, H + .38, 10).top),                  // a patent nyílása
      face('steel', 'base', stud.sil),                                                      // kerek patent
      det('steel', 'light', stud.top),
      shine(fr(2.45, 4.35, -1.02, -.8), .5),
      shine(fr(.35, 1.6, -1.02, -.8), .45),
    ]});
  }

  // ---- 2. Autó-akkumulátor: 27,5 × 17,5 × 19 cm; ráhúzott fedél, piros és fekete saru, felhajtott hordfül, talp-perem, töltöttség-szem ----
  {
    const TILT = -10, X = 13.75, Z = 8.75, HC = 16.2, HL = 19, LO = .4, LE = .7;
    const hA = Array.from({ length:9 }, (_, i) => { const u = i / 8; return [-8.5 + 17 * u, HL + .2 + 3.6 * Math.pow(Math.sin(PI * u), .5), -3.2]; });
    const P = cam({ az:28, el:30, F:120, tilt:TILT, fit:[...corners(-X - LE, X + LE, 0, HL + 2.8, -Z - LE, Z + LE), ...hA] });
    const c = box(P, -X, X, 0, HC, -Z, Z), l = box(P, -X - LO, X + LO, HC, HL, -Z - LO, Z + LO);
    const q = (x, y, z) => P([x, y, z]), XE = X + LE, ZE = Z + LE, YE = 1.3;
    const red = cyl(P, -9.2, 4.4, 2.0, HL, HL + 2.8), blk = cyl(P, 9.2, 4.4, 2.0, HL, HL + 2.8);
    fin('i_autoakku', { hu:'Autó-akkumulátor', en:'car battery with red and black terminal caps and a carry handle', tilt:TILT, shapes:[
      face('dark', 'dark', c.right),                                                        // ház oldala
      face('dark', 'base', c.front),                                                        // ház eleje
      det('dark', 'line', inset([q(X, 0, -Z + 1.2), q(X, 0, -Z), q(X, HC, -Z), q(X, HC, -Z + 1.2)], c.sil), { o:.55 }),   // hátsó élsáv
      det('sky', 'base', [q(-11, 4.2, Z), q(11, 4.2, Z), q(11, 12.6, Z), q(-11, 12.6, Z)]),  // címke (üres)
      det('blue', 'base', [q(-11, 9.6, Z), q(11, 9.6, Z), q(11, 11.2, Z), q(-11, 11.2, Z)]),
      face('dark', 'dark', [q(-XE, 0, ZE), q(XE, 0, ZE), q(XE, 0, -ZE), q(XE, YE, -ZE), q(XE, YE, ZE), q(-XE, YE, ZE)]),   // talp-perem
      dpth('dark', 'light', [[q(-XE, YE, ZE), q(XE, YE, ZE), q(X, YE, Z), q(-X, YE, Z)], [q(XE, YE, ZE), q(XE, YE, -ZE), q(X, YE, -Z), q(X, YE, Z)]]),
      face('dark', 'dark', l.right),                                                        // fedél
      face('dark', 'base', l.front),
      face('dark', 'light', l.top),
      face('dark', 'base', tube(hA.map(P), 3.0)),                                           // felhajtott hordfül
      det('leaf', 'light', circ(...P([0, HL, 4.2]), 1.1 * P.k, 10, .75 * P.k)),             // töltöttség-szem
      face('red', 'base', red.sil), det('red', 'light', red.top),                           // piros (+) saru
      face('dark', 'dark', blk.sil), det('dark', 'base', blk.top),                          // fekete (−) saru
      shine([q(-12.4, 2, Z), q(-11.6, 2, Z), q(-11.6, 13.8, Z), q(-12.4, 13.8, Z)], .35),
      shine([q(-12.6, HC + .8, Z + LO), q(3, HC + .8, Z + LO), q(3, HC + 1.4, Z + LO), q(-12.6, HC + 1.4, Z + LO)], .4),
    ]});
  }

  // ---- 3. Powerbank: 13,6 × 6,8 × 2 cm lapos, lekerekített lap; a bal végén bedugott kábel, a tetején 4 jelző pötty (3 világít) ----
  {
    const TILT = -10, LX = 6.8, LZ = 3.4, HT = 2.0;
    const sec = rrect(2 * LX, 2 * LZ, 1.2, 3);
    const cab = [[-LX - 2.3, 1, 0], [-LX - 3.9, .9, .3], [-LX - 4.3, .8, 2.0], [-LX - 3.2, .8, 3.8], [-LX - 1.0, .8, 4.4]];
    const P = cam({ az:-36, el:50, F:60, tilt:TILT, fit:[...corners(-LX - 4.3, LX, 0, HT, -LZ, 4.4)] });
    const pr = prism(P, sec, { A:[1, 0, 0], B:[0, 0, -1], T:[0, 1, 0], t0:0, t1:HT });
    const pl = box(P, -LX - 2.3, -LX, .45, 1.55, -.7, .7);
    const dot3 = (x, z, r) => circ(0, 0, r, 8).map(([u, v]) => P([x + u, HT, z + v]));
    const low = sec.filter(p => p[1] < -LZ + 1.3 || p[0] < -LX + 1.3);
    fin('i_powerbank', { hu:'Powerbank', en:'slim power bank with a plugged-in cable and indicator dots', tilt:TILT, shapes:[
      face('blue', 'base', pr.sil),                                                         // test (eleje, bal vége)
      dpth('blue', 'dark', (pr.runs.dark || []).map(p => inset(p, pr.sil))),
      det('blue', 'line', inset([...sec.filter(p => p[1] < -LZ + 1.3).map(([a, b]) => P([a, 0, -b])), ...sec.filter(p => p[1] < -LZ + 1.3).reverse().map(([a, b]) => P([a, .45, -b]))], pr.sil), { o:.35 }),   // alsó élsáv
      face('blue', 'light', pr.cap),                                                        // teteje
      face('steel', 'base', pl.sil),                                                        // dugó
      det('steel', 'light', pl.top), det('steel', 'dark', pl.front),
      face('white', 'base', tube(smooth(cab.map(P), 3), 2.3)),                              // kábel
      dpth('leaf', 'light', [dot3(-LX + 1.7, -1.8, .5), dot3(-LX + 1.7, -.6, .5), dot3(-LX + 1.7, .6, .5)]),   // világító pöttyök
      det('blue', 'dark', dot3(-LX + 1.7, 1.8, .5)),                                        // nem világító pötty
      shine([[-3.6, 2.0], [4.8, 2.0], [4.8, 2.6], [-3.6, 2.6]].map(([x, z]) => P([x, HT, z])), .45),
      shine([[-5.2, 2.0], [-4.3, 2.0], [-4.3, 2.6], [-5.2, 2.6]].map(([x, z]) => P([x, HT, z])), .45),
    ]});
  }

  // ---- 4. Szerszám-akku: 7,8 × 6,6 × 11,2 cm; sötétszürke, bordázott cellatest, sárga felső ház, T-profilú csúszósín, bordás kioldógomb ----
  {
    const TILT = -14, X = 3.9, Z = 5.6, YL = 2.9, YU = 5.2, XT = 1.2, YT = 5.75, XR = 1.95, YR = 6.2, ZR = 2.2;
    const P = cam({ az:34, el:30, F:60, tilt:TILT, fit:corners(-X, X, 0, YR, -Z, Z) });
    const lo = box(P, -X, X, 0, YL, -Z, Z), up = box(P, -X, X, YL, YU, -Z, Z), tw = box(P, -XT, XT, YU, YT, -Z, ZR), rl = box(P, -XR, XR, YT, YR, -Z, ZR);
    const bt = box(P, -1.5, 1.5, YU, YU + .6, ZR + .5, Z - .4);
    const q = (x, y, z) => P([x, y, z]);
    const ribsF = [.7, 1.35, 2.0].map(y => tube([q(-3.3, y, Z), q(3.3, y, Z)], 1.0, false));
    const ribsS = [.7, 1.35, 2.0].map(y => tube([q(X, y, Z - .6), q(X, y, -Z + .8)], .9, false));
    fin('i_szerszamakku', { hu:'Szerszám-akku', en:'yellow and dark grey slide-on power tool battery pack', tilt:TILT, shapes:[
      face('dark', 'dark', lo.right),                                                       // cellatest
      face('dark', 'base', lo.front),
      dpth('dark', 'light', [...ribsF, ...ribsS]),                                          // bordázott fogófelület
      face('gold', 'dark', up.right),                                                       // sárga felső ház
      face('gold', 'base', up.front),
      face('gold', 'light', up.top),
      det('gold', 'line', inset([q(X, YL, -Z + .9), q(X, YL, -Z), q(X, YU, -Z), q(X, YU, -Z + .9)], up.sil), { o:.45 }),   // hátsó élsáv
      face('dark', 'dark', tw.right),                                                       // sín-gerinc
      face('dark', 'base', tw.front),
      face('dark', 'dark', rl.right),                                                       // T-sín (kétoldalt túlnyúló perem)
      face('dark', 'base', rl.front),
      face('dark', 'light', rl.top),
      det('dark', 'line', [q(-.8, YU + .12, ZR), q(.8, YU + .12, ZR), q(.8, YT - .1, ZR), q(-.8, YT - .1, ZR)]),   // csatlakozó-rés
      face('dark', 'base', bt.sil),                                                         // kioldógomb
      dpth('dark', 'light', [ZR + 1.1, ZR + 1.8, ZR + 2.5].map(z => tube([q(-1.1, YU + .6, z), q(1.1, YU + .6, z)], .75, false))),
      shine([q(-3.5, YL + .3, Z), q(-3.0, YL + .3, Z), q(-3.0, YU - .3, Z), q(-3.5, YU - .3, Z)], .65),
    ]});
  }

  // ---- 5. Roller/bicikli akku: 34 × 9 × 8,4 cm hosszú, lekerekített rúd; fém rögzítősín, nagy zár kulcslyukkal, töltőaljzat fedővel, töltöttség-jelző ----
  {
    const TILT = -18, L = 17, RA = 18, T3 = [cos(RA), sin(RA), 0], B3 = [-sin(RA), cos(RA), 0];
    const sec = [[4.5, 0], [4.6, 1.7], [4.6, 3.6], [4.3, 5.5], [3.3, 7.1], [1.8, 8.1], [0, 8.4], [-1.8, 8.1], [-3.3, 7.1], [-4.3, 5.5], [-4.6, 3.6], [-4.6, 1.7], [-4.5, 0]];
    const fit = [-L, L].flatMap(t => [0, 8.4].flatMap(b => [-4.6, 4.6].map(a => [0, 1, 2].map(i => a * [0, 0, 1][i] + b * B3[i] + t * T3[i]))));
    const P = cam({ az:24, el:26, F:120, tilt:TILT, fit });
    const pr = prism(P, sec, { A:[0, 0, 1], B:B3, T:T3, t0:-L, t1:L });
    const pos = pr.pos, S = (a, b, t) => P(pos([a, b], t));
    const disc = (t, b, r, n = 12, a = 4.7) => circ(0, 0, r, n).map(([u, v]) => S(a, b + v, t + u));
    const bars = [0, 1, 2, 3].map(i => { const t = -L + 3 + i * 1.5; return [S(1.2, 8.2, t), S(1.2, 8.2, t + .95), S(3.0, 7.3, t + .95), S(3.0, 7.3, t)]; });
    fin('i_ebikeakku', { hu:'Roller/bicikli akku', en:'long rounded e-bike frame battery with a key lock and charging port', tilt:TILT, shapes:[
      face('dark', 'base', pr.sil),                                                         // test
      dpth('dark', 'light', (pr.runs.light || []).map(p => inset(p, pr.sil))),             // lekerekített teteje
      dpth('dark', 'dark', (pr.runs.dark || []).map(p => inset(p, pr.sil))),
      face('dark', 'dark', pr.cap),                                                         // véglap
      det('steel', 'base', inset([S(4.5, 0, -L), S(4.5, 0, L), S(4.6, 1.7, L), S(4.6, 1.7, -L)], pr.sil)),   // rögzítősín
      det('steel', 'dark', inset([S(4.5, 0, L), S(-4.5, 0, L), S(-4.6, 1.7, L), S(4.6, 1.7, L)], pr.sil)),
      det('dark', 'line', inset([S(4.6, 1.7, -L), S(4.6, 1.7, L), S(4.6, 2.3, L), S(4.6, 2.3, -L)], pr.sil), { o:.6 }),   // árnyék a sín fölött
      dpth('leaf', 'light', bars.slice(0, 3)),                                              // töltöttség-jelző (3 világít)
      det('dark', 'light', bars[3]),
      face('steel', 'base', disc(L - 4.6, 4.1, 1.9, 14)),                                   // zár
      det('steel', 'light', disc(L - 4.85, 4.35, 1.2, 10, 4.8)),
      det('dark', 'base', [S(4.8, 3.4, L - 4.9), S(4.8, 3.4, L - 4.3), S(4.8, 4.8, L - 4.3), S(4.8, 4.8, L - 4.9)]),   // kulcslyuk
      face('dark', 'dark', disc(-L + 9.5, 3.9, 1.35, 12)),                                  // töltőaljzat fedele
      det('dark', 'light', disc(-L + 9.3, 4.1, .7, 8, 4.8)),
      shine([S(3.6, 6.8, -L + 9), S(3.6, 6.8, 7), S(4.2, 5.8, 7), S(4.2, 5.8, -L + 9)], .45),
    ]});
  }

  // ============================================================================================
  //  TEXTIL – kabát (kék parka szőrmés kapucnival) · zokni (csíkos pár, lyukas orr) · sál + bojtos sapka · redőzött függöny karikákkal · foltozott plüssmaci
  // ============================================================================================

  // ---- 6. Kabát: téli parka – kapucni szőrmeszegéllyel, cipzár, zsebfedők, mandzsetta, derékpánt ----
  {
    const TILT = -10, L = lightFor(TILT);
    const torso = [[37, 30], [63, 30], [71, 36], [74, 88], [26, 88], [29, 36]];
    const sl = Tube(resample(spineOf([[31, 35], [23, 52], [18, 70], [16, 86]]), 12), t => 15.5 - 2.5 * t);
    const sr = Tube(resample(spineOf([[69, 35], [77, 52], [82, 70], [84, 86]]), 12), t => 15.5 - 2.5 * t);
    const hood = Blob({ cx:50, cy:21, rx:20.5, ry:18.5 }), fur = Blob({ cx:50, cy:20.5, rx:15.8, ry:13.8, f:th => 1 + .06 * sin(th * 12) });
    const tq = q => inset(clip(torso, q), torso);
    fin('i_kabat', { hu:'Kabát', en:'blue winter parka with a fur-trimmed hood, zipper and pockets', tilt:TILT, shapes:[
      face('blue', 'base', hood.sil(24)),                                                   // kapucni
      pth('blue', 'base', [sl.sil(false, false), sr.sil(false, false)]),                   // ujjak
      dpth('blue', 'light', sl.tone(L, TONE.light)),
      dpth('blue', 'dark', [...sl.tone(L, TONE.dark, true), ...sr.tone(L, d => d < .5, true)]),
      dpth('blue', 'line', [sl.across(9, 11, -.9, .9), sr.across(9, 11, -.9, .9)], { o:.55 }),   // mandzsetta
      face('blue', 'base', torso),                                                          // törzs
      det('blue', 'light', tq([[0, 0], [41, 0], [38, 100], [0, 100]])),
      det('blue', 'dark', tq([[62, 0], [100, 0], [100, 100], [65, 100]])),
      det('blue', 'line', tq([[69.5, 0], [100, 0], [100, 100], [72.5, 100]]), { o:.5 }),   // legsötétebb élsáv
      det('blue', 'dark', tq([[0, 81], [100, 81], [100, 100], [0, 100]]), { o:.75 }),      // derékpánt
      dpth('blue', 'line', [[[30.5, 61], [45, 59.5], [45.4, 64.5], [31, 66.5]], [[55, 59.5], [69.5, 61], [69.8, 66.5], [55.2, 64.5]]], { o:.6 }),   // zsebfedők
      det('steel', 'base', tube([[50, 31], [50, 86]], 2.4, false)),                         // cipzár
      det('honey', 'base', [[49.4, 35], [52.8, 35], [53.4, 42.5], [48.8, 42.5]]),           // cipzár-húzó
      face('cream', 'base', fur.sil(48)),                                                   // szőrmeszegély
      dpth('cream', 'dark', fur.tone(L, TONE.dark)),
      face('blue', 'line', circ(50, 21.5, 9.6, 16, 8.6)),                                   // kapucni nyílása
      dpth('paper', 'light', [tube([sl.at(2, .45), sl.at(6, .4)], 1.8), [[32.5, 42], [35, 42], [34.2, 56], [31.7, 56]]], { o:.5 }),
    ]});
  }

  // ---- 7. Zokni: csíkos pár (krém alap, piros csíkok, sarok és orr), az elsőnek lyukas az orra ----
  {
    const TILT = 10, L = lightFor(TILT), N = 22;
    const mk = (dx, dy) => Tube(resample(spineOf([[34 + dx, 8 + dy], [34 + dx, 40 + dy], [35 + dx, 58 + dy], [43 + dx, 70 + dy], [57 + dx, 75 + dy], [70 + dx, 77 + dy]]), N), 19);
    const sock = T => {
      const sil = T.sil(false, true), p = T.at(N - 4, 0), q = T.at(N - 4, 1);
      const toe = inset(clip(sil, halfPlane(p, q)), sil);
      const red = [T.across(3, 4, -.95, .95), T.across(7, 8, -.95, .95), T.across(11, 15, .15, .95), toe];
      return { sil, red, light:T.tone(L, TONE.light), dark:T.tone(L, TONE.dark, true), edge:T.tone(L, TONE.edge, true),
        ribs:[-.55, -.1, .35].map(u => tube([T.at(0, u), T.at(2, u)], 1.1, false)) };
    };
    const B = mk(15, -6), F = mk(0, 0), b = sock(B), f = sock(F), tip = F.at(N - 1, -.1), D = F.N[N - 1];
    const hc = [tip[0] + D[1] * 1.5, tip[1] - D[0] * 1.5];
    fin('i_zokni', { hu:'Zokni', en:'pair of red striped socks, one with a hole in the toe', tilt:TILT, shapes:[
      face('cream', 'base', b.sil),                                                         // hátsó zokni
      dpth('cream', 'light', b.light),
      dpth('red', 'base', b.red),
      dpth('dark', 'dark', [...b.dark], { o:.2 }),
      face('cream', 'base', f.sil),                                                         // első zokni
      dpth('cream', 'light', f.light),
      dpth('red', 'base', f.red),
      dpth('dark', 'dark', f.dark, { o:.2 }),
      dpth('dark', 'dark', f.edge, { o:.22 }),                                              // legsötétebb élsáv
      dpth('cream', 'dark', [...b.ribs, ...f.ribs]),                                        // bordás szár
      det('dark', 'base', circ(hc[0], hc[1], 3.6, 10, 2.7)),                                // lyuk az orrán
      dpth('cream', 'base', [tube([[hc[0] - 3.2, hc[1] - 1.2], [hc[0] - .6, hc[1] + .3]], 1, false), tube([[hc[0] + 1.2, hc[1] - 2.2], [hc[0] + 2.2, hc[1] + .4]], 1, false)]),   // kilógó szálak
      shine(tube([F.at(1, .55), F.at(9, .5)], 1.8), .55),
    ]});
  }

  // ---- 8. Sál, sapka: rojtos kötött sál (türkiz, krém csíkok) és rajta bojtos kötött sapka (rózsaszín, bordó hajtóka) ----
  {
    const TILT = -10, L = lightFor(TILT), N = 22;
    const sc = Tube(resample(spineOf([[7, 79], [24, 69], [42, 76], [60, 85], [78, 80], [93, 65]]), N), 16.5);
    const fringe = (i, sg) => { const D = sc.N[i], dir = [-D[1] * sg, D[0] * sg];
      return [.72, .36, 0, -.36, -.72].map(u => { const a = sc.at(i, u), w = 1.1; return [[a[0] + D[0] * w, a[1] + D[1] * w], [a[0] - D[0] * w, a[1] - D[1] * w], [a[0] - D[0] * .7 + dir[0] * 6.5, a[1] - D[1] * .7 + dir[1] * 6.5], [a[0] + D[0] * .7 + dir[0] * 6.5, a[1] + D[1] * .7 + dir[1] * 6.5]]; }); };
    const dome = Blob({ cx:56, cy:54, rx:23, ry:32, f:th => 1 - .04 * sin(th) }), top = [[0, 0], [100, 0], [100, 58], [0, 58]];
    const cuff = Tube(resample(spineOf([[31, 52.5], [56, 58.5], [81, 52.5]]), 11), 13.5);
    const pom = Blob({ cx:56, cy:17, rx:10.5, ry:10, f:th => 1 + .07 * sin(th * 9) });
    const chev = y => { const w = 19 - abs(y - 44) * .25, xs = Array.from({ length:9 }, (_, i) => 56 - w + 2 * w * i / 8); return tube(xs.map((x, i) => [x, y + (i % 2 ? 2.4 : 0)]), 1.4, false); };
    fin('i_sal', { hu:'Sál, sapka', en:'knitted striped scarf with fringe and a pink bobble hat', tilt:TILT, shapes:[
      pth('teal', 'dark', [...fringe(0, -1), ...fringe(N - 1, 1)]),                         // rojt
      face('teal', 'base', sc.sil(false, false)),                                           // sál
      dpth('teal', 'light', sc.tone(L, TONE.light)),
      dpth('cream', 'base', [sc.across(2, 3), sc.across(6, 7), sc.across(14, 15), sc.across(18, 19)]),   // csíkok
      dpth('dark', 'dark', sc.tone(L, TONE.dark, true), { o:.22 }),
      face('pink', 'base', clip(dome.sil(28), top)),                                        // sapka
      dpth('pink', 'light', dome.tone(L, TONE.light).map(p => clip(p, top))),
      dpth('pink', 'dark', dome.tone(L, TONE.dark).map(p => clip(p, top))),
      dpth('pink', 'dark', [chev(30), chev(39), chev(48)]),                                 // kötésminta
      face('berry', 'base', cuff.sil(false, false)),                                        // hajtóka
      dpth('berry', 'light', [cuff.across(0, 10, .35, .9)]),
      dpth('berry', 'dark', [1, 3, 5, 7, 9].map(i => tube([cuff.at(i, -.75), cuff.at(i, .75)], 1.3, false))),   // bordák
      face('cream', 'base', pom.sil(36)),                                                   // bojt
      dpth('cream', 'dark', pom.tone(L, TONE.dark)),
      shine(tube([[40, 30], [44, 24]], 2.2), .55),
    ]});
  }

  // ---- 9. Függöny: redőzött, mintás függönyszárny, a tetején függönykarikák csipesszel, hullámos alja ----
  {
    const TILT = 10, K = 10, xt = i => 27 + 46 * i / K, xb = i => 15 + 70 * i / K, yb = i => 89 + (i % 2 ? -1.8 : 1.8), Y0 = 17;
    const at = (i, t) => [xt(i) + (xb(i) - xt(i)) * t, Y0 + (yb(i) - Y0) * t];
    const sil = [[xt(0), Y0], [xt(K), Y0], ...Array.from({ length:K + 1 }, (_, j) => at(K - j, 1))];
    const facet = i => inset([at(i, .06), at(i + 1, .06), at(i + 1, 1), at(i, 1)], sil);
    const light = [1, 3, 5, 7, 9].map(facet), dark = [0, 2, 4, 6, 8].map(facet);
    const dots = [];
    for(let r = 0; r < 7; r++) for(let c = 0; c < 8; c++){ const t = .13 + r * .125, u = (c + (r % 2 ? .5 : 0) + .5) / 8.2, x0 = xt(0) + (xb(0) - xt(0)) * t, x1 = xt(K) + (xb(K) - xt(K)) * t;
      const x = x0 + (x1 - x0) * u, y = Y0 + (89 - Y0) * t; if(u < .97) dots.push([[x, y - 1.9], [x + 1.6, y], [x, y + 1.9], [x - 1.6, y]]); }
    const rings = [0, 2, 4, 6, 8, 10].map(i => [circ(xt(i), 11, 4.2, 12), circ(xt(i), 11, 2.7, 10).reverse()]).flat();
    fin('i_fuggony', { hu:'Függöny', en:'pleated purple patterned curtain panel with curtain rings on top', tilt:TILT, shapes:[
      pth('steel', 'base', rings),                                                          // függönykarikák
      face('purple', 'base', sil),                                                          // függöny
      dpth('purple', 'light', light),                                                       // fény felé forduló redők
      dpth('purple', 'dark', dark),
      dpth('cream', 'base', dots),                                                          // minta
      dpth('purple', 'line', dark, { o:.28 }),                                              // a minta is árnyékba kerül
      det('purple', 'line', inset([at(9, .06), at(10, .06), at(10, 1), at(9, 1)], sil), { o:.45 }),   // legsötétebb élsáv
      det('purple', 'dark', inset([[xt(0), Y0], [xt(K), Y0], at(K, .09), at(0, .09)], sil)),   // felső szegély
      dpth('purple', 'line', [2, 4, 6, 8].map(i => tube([at(i, .12), at(i, .9)], .8, false)), { o:.55 }),                  // redő-völgyek
      det('purple', 'dark', inset([...Array.from({ length:K + 1 }, (_, i) => at(i, .94)), ...Array.from({ length:K + 1 }, (_, i) => at(K - i, 1))], sil), { o:.8 }),   // alsó szegély
      dpth('steel', 'dark', [0, 2, 4, 6, 8, 10].map(i => [[xt(i) - 1.3, 14], [xt(i) + 1.3, 14], [xt(i) + 1.3, 19.5], [xt(i) - 1.3, 19.5]])),   // csipeszek
      dpth('steel', 'light', [0, 2, 4, 6, 8, 10].map(i => tube([[xt(i) - 3.1, 9.6], [xt(i) - 1.6, 7.6]], 1.1))),
      shine(inset([at(1, .2), at(1.6, .2), at(1.6, .7), at(1, .7)], sil), .35),
    ]});
  }

  // ---- 10. Plüssjáték: kopott, ülő plüssmaci foltokkal és öltésekkel (pont szemek, orr) ----
  {
    const TILT = 10, L = lightFor(TILT);
    const head = Blob({ cx:50, cy:32, rx:23, ry:20 }), bodyB = Blob({ cx:50, cy:66, rx:21, ry:20 });
    const al = Tube(resample([[34, 50], [26, 60], [22, 71]], 7), 11.5), ar = Tube(resample([[66, 50], [75, 58], [80, 68]], 7), 11.5);
    const legL = Blob({ cx:34, cy:85, rx:12.5, ry:8.5, rot:-12 }), legR = Blob({ cx:66, cy:85, rx:12.5, ry:8.5, rot:12 });
    const patch = [[51, 63], [64, 61], [66, 74], [53, 76]].map(p => p);
    const st = (a, b) => { const n = 4, out = []; for(let i = 0; i < n; i++){ const p = lerp(a, b, (i + .5) / n), dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy);
      out.push(tube([[p[0] - dy / l * 1.6, p[1] + dx / l * 1.6], [p[0] + dy / l * 1.6, p[1] - dx / l * 1.6]], .9, false)); } return out; };
    fin('i_pluss', { hu:'Plüssjáték', en:'worn plush teddy bear with a sewn-on patch', tilt:TILT, shapes:[
      pth('wood', 'base', [circ(30, 15, 9, 12), circ(70, 15, 9, 12)]),                       // fülek
      dpth('cream', 'dark', [circ(30.5, 15.5, 4.8, 10), circ(69.5, 15.5, 4.8, 10)]),
      pth('wood', 'base', [al.sil(false, true), ar.sil(false, true)]),                     // mancsok
      pth('wood', 'base', [legL.sil(20), legR.sil(20)]),                                   // lábak
      dpth('cream', 'base', [circ(31, 86.5, 6, 12, 5.4), circ(69, 86.5, 6, 12, 5.4)]),     // talppárnák
      face('wood', 'base', bodyB.sil(28)),                                                  // test
      dpth('wood', 'light', [...bodyB.tone(L, TONE.light), ...al.tone(L, TONE.light)]),
      dpth('wood', 'dark', [...bodyB.tone(L, TONE.dark), ...ar.tone(L, TONE.dark, true)]),
      face('sky', 'base', patch),                                                           // felvarrt folt
      dpth('sky', 'line', [...st(patch[0], patch[1]), ...st(patch[1], patch[2]), ...st(patch[2], patch[3]), ...st(patch[3], patch[0])]),   // öltések
      face('wood', 'base', head.sil(28)),                                                   // fej
      dpth('wood', 'light', head.tone(L, TONE.light)),
      dpth('wood', 'dark', head.tone(L, TONE.dark)),
      dpth('wood', 'line', [...head.tone(L, TONE.edge), ...bodyB.tone(L, TONE.edge)], { o:.4 }),
      face('cream', 'base', circ(53, 40, 10, 14, 7.5)),                                     // pofa
      dpth('dark', 'base', [circ(42.5, 29.5, 2.4, 8), circ(60.5, 28.5, 2.4, 8), circ(54, 36.8, 3.3, 10, 2.4)]),   // szemek, orr
      dpth('red', 'line', [tube([[46.5, 13.5], [49.5, 18.5]], 1, false), tube([[50.5, 13.5], [47.5, 18.5]], 1, false)]),   // öltés-kereszt a fején
    ]});
  }

  // ============================================================================================
  //  VESZÉLYES HULLADÉK – körömlakk (piros, fekete kupak) · szilikon-kartus + ragasztótubus · higanyos hőmérő (ezüst higanyszál, gömb) ·
  //  klóros tisztítószer (kék, ferde nyakú flakon, rombusz) · fagyálló (fehér kanna fogantyúval, türkiz folyadék-ablak, rombusz)
  // ============================================================================================

  // ---- 11. Körömlakk: 3,7 cm széles, zömök üvegcse vastag üvegfenékkel, benne piros lakk; magas fekete kupak ----
  {
    const TILT = 10;
    const glassP = [[1.6, 0], [1.85, .25], [1.9, 2.95], [1.6, 3.4], [.8, 3.6], [.8, 4.0]];
    const lacqP = [[1.4, .6], [1.62, .8], [1.66, 2.8], [1.35, 3.15], [.6, 3.32]];
    const capP = [[.98, 3.95], [.98, 8.1]];
    const fit = Array.from({ length:12 }, (_, i) => [1.9 * sin(i * 30), 0, 1.9 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .52, 8.1, z * .52]]);
    const P = cam({ az:0, el:20, tilt:TILT, fit }), G = lathe(P, glassP), Q = lathe(P, lacqP), C = lathe(P, capP);
    fin('i_koromlakk', { hu:'Körömlakk', en:'small glass bottle of red nail polish with a tall black cap', tilt:TILT, shapes:[
      pth('glass', 'base', [G.sil]),                                                        // üvegcse
      det('glass', 'dark', G.strip(40, 90, .3, 3.4)),
      det('red', 'base', inset(Q.sil, G.sil, 1.2)),                                         // lakk
      det('red', 'light', Q.strip(-90, -48, .6, 3.15)),
      det('red', 'dark', Q.strip(28, 90, .6, 3.15)),
      det('red', 'line', Q.strip(66, 90, .6, 3.15), { o:.45 }),
      det('glass', 'light', G.strip(-90, 90, 0, .52, 8), { o:.9 }),                         // vastag üvegfenék
      pth('dark', 'base', [C.sil]),                                                         // kupak
      det('dark', 'light', C.strip(-90, -44, 3.95, 8.1)),
      det('dark', 'line', C.strip(38, 90, 3.95, 8.1), { o:.8 }),
      face('dark', 'light', C.full(.98, 8.1, 16)),                                          // kupak teteje
      shine(G.strip(-66, -52, .7, 2.7, 2), .75),
      shine(C.strip(-72, -63, 4.4, 7.6, 2), .3),
    ]});
  }

  // ---- 12. Ragasztó, szilikon: szilikon-kartus (fehér, narancs címkesáv, hosszú kúpos csőr, a hegyén szilikon) + kinyomott ragasztótubus ----
  {
    const TILT = 10, PH = -50;
    const bodyP = [[2.3, 0], [2.5, .3], [2.5, 15.2], [2.3, 15.9], [1.45, 16.8], [.85, 17.6], [.75, 18.0]];
    const nozP = [[.78, 17.9], [.66, 18.8], [.3, 24.8]];
    const pose = rotZ(PH), fit = [...bodyP, ...nozP].flatMap(([r, y]) => [0, 90, 180, 270].map(a => pose([r * sin(a), y, r * cos(a)])));
    const P0 = cam({ az:14, el:18, tilt:TILT, fit }), P = posed(P0, pose);
    const B = lathe(P, bodyP), N = lathe(P, nozP), k = P.k;
    // ragasztótubus a kartus előtt (2D, a vetítés rácsán): kinyomott test, recés hajtott vég, piros kupak
    const TB = (pts) => place(pts, 56, 70, -22, 1.25);
    const tb = TB([[-4, -3.6], [4, -4.4], [10, -2.9], [17, -4.8], [17, 4.8], [10, 3.3], [4, 4.5], [-4, 3.6]]);
    const crimp = TB([[16.5, -5.3], [21.4, -5.3], [22.4, -3.6], [21.4, -1.8], [22.4, 0], [21.4, 1.8], [22.4, 3.6], [21.4, 5.3], [16.5, 5.3]]);
    const neck = TB([[-7.6, -2.1], [-4, -3.6], [-4, 3.6], [-7.6, 2.1]]), capT = TB([[-15.5, -2.9], [-7.4, -2.9], [-7.4, 2.9], [-15.5, 2.9]]);
    fin('i_ragaszto', { hu:'Ragasztó, szilikon', en:'white silicone sealant cartridge with a long nozzle and a squeezed glue tube', tilt:TILT, shapes:[
      pth('glass', 'base', [N.sil]),                                                        // áttetsző csőr
      det('glass', 'dark', N.strip(20, 90, 17.9, 24.8, 3)),
      pth('white', 'base', [B.sil]),                                                        // kartus
      det('white', 'dark', B.strip(34, 90, 0, 17.6)),
      det('white', 'line', B.strip(70, 90, 0, 17.6), { o:.35 }),
      det('white', 'dark', B.strip(-90, 90, .3, 1.0, 8)),                                   // hátsó perem
      det('orange', 'base', B.strip(-90, 90, 3.2, 12.2, 8)),                                // címkesáv
      det('orange', 'light', B.strip(-90, -50, 3.2, 12.2)),
      det('orange', 'dark', B.strip(34, 90, 3.2, 12.2)),
      shine(B.strip(-66, -56, 12.8, 15.4, 2), .8),
      pth('steel', 'base', [tb, crimp, neck]),                                              // ragasztótubus
      dpth('steel', 'light', [TB([[-3.5, -3.2], [4, -3.9], [9.5, -2.4], [16.5, -4.2], [16.5, -2.2], [9.5, -.9], [4, -1.9], [-3.5, -1.5]])]),
      dpth('steel', 'dark', [TB([[-3.5, 2.2], [4, 2.8], [9.5, 1.8], [16.5, 2.8], [16.5, 4.3], [9.5, 3.0], [4, 4.1], [-3.5, 3.3]]), tube(TB([[10, -2.2], [9.3, 0], [10, 2.3]]), 1.1, false)]),   // árnyék és gyűrődés
      face('red', 'base', capT),                                                            // kupak
      dpth('red', 'dark', [-13.5, -11.5, -9.5].map(x => tube(TB([[x, -2.2], [x, 2.2]]), .9, false))),
    ]});
  }

  // ---- 13. Higanyos hőmérő: 12 cm-es üvegpálca (vastagítva), ezüst higanygömb és -szál, beosztás, piros jel; mellette kiömlött higanycseppek ----
  {
    const TILT = 10, PH = -46;
    const glassP = [[.72, -.15], [.9, .25], [.9, 11.4], [.72, 11.85], [.35, 12.05], [.05, 12.1]];
    const bulbP = [[.05, -1.95], [.34, -1.86], [.56, -1.45], [.6, -.4], [.52, .15]];
    const pose = rotZ(PH), fit = [...glassP, ...bulbP].flatMap(([r, y]) => [0, 90, 180, 270].map(a => pose([r * sin(a), y, r * cos(a)])));
    const P0 = cam({ az:0, el:16, tilt:TILT, fit:[...fit, pose([2.2, -1.2, 0])] }), P = posed(P0, pose), k = P.k;
    const G = lathe(P, glassP), Bb = lathe(P, bulbP);
    const col = [P([-.2, .1, .7]), P([.2, .1, .7]), P([.2, 7.0, .7]), P([-.2, 7.0, .7])];
    const ticks = [2.2, 3.0, 3.8, 4.6, 5.4, 6.2, 7.8, 8.6, 9.4, 10.2].map((y, i) => tube([P([-.72, y, .5]), P([i % 2 ? -.4 : -.25, y, .5])], .75, false));
    const d1 = P0([2.4, -2.6, .5]), d2 = P0([3.6, -1.2, .5]);
    fin('i_homero', { hu:'Higanyos hőmérő', en:'old glass mercury fever thermometer with a silver bulb and mercury beads', tilt:TILT, shapes:[
      pth('glass', 'base', [G.sil]),                                                        // üvegpálca
      det('glass', 'light', G.strip(-90, -58, .25, 11.4)),
      det('glass', 'dark', G.strip(36, 90, .25, 11.4)),
      det('glass', 'line', G.strip(70, 90, .25, 11.4), { o:.4 }),
      dpth('glass', 'line', ticks, { o:.8 }),                                               // beosztás
      det('red', 'base', tube([P([-.72, 7.0, .5]), P([-.2, 7.0, .5])], 1.0, false)),      // piros jel
      det('steel', 'dark', col),                                                            // higanyszál
      det('steel', 'light', [P([-.16, .1, .72]), P([-.03, .1, .72]), P([-.03, 7.0, .72]), P([-.16, 7.0, .72])]),
      pth('steel', 'base', [Bb.sil]),                                                       // higanygömb
      det('steel', 'light', Bb.strip(-90, -40, -1.8, .1)),
      det('steel', 'dark', Bb.strip(35, 90, -1.8, .1)),
      shine(G.strip(-70, -62, 1.0, 11.0, 2), .85),
      pth('steel', 'base', [circ(d1[0], d1[1], .62 * k, 10, .5 * k), circ(d2[0], d2[1], .42 * k, 8, .34 * k)]),   // higanycseppek
      dpth('paper', 'light', [circ(d1[0] - .22 * k, d1[1] - .16 * k, .2 * k, 6), circ(d2[0] - .14 * k, d2[1] - .1 * k, .14 * k, 6)], { o:.9 }),
    ]});
  }

  // ---- 14. Klóros tisztítószer: vastag, ovális kék flakon (16,8 cm magas, 8,8 cm széles), ferdén előredőlő nyak, fehér gyerekzáras bordás kupak, címke veszély-rombusszal ----
  {
    const TILT = -10, EZ = .7, AX = [sin(40), cos(40), 0], B0 = [.8, 15.9, 0];
    const prof = [[3.9, 0], [4.3, .4], [4.4, 1.6], [4.4, 11.4], [4.15, 13.5], [3.3, 15.3], [2.1, 16.4], [1.3, 16.8]];
    const fit = Array.from({ length:12 }, (_, i) => [4.4 * sin(i * 30), 0, 4.4 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .3, 16.8, z * .3]]);
    const P = cam({ az:0, el:16, tilt:TILT, fit:[...fit, [B0[0] + AX[0] * 5.6 + 2, B0[1] + AX[1] * 5.6 + 1.2, 0]] });
    const L = lathe(P, prof, EZ), nk = acyl(P, B0, AX, 1.35, 2.5), cp = acyl(P, [B0[0] + AX[0] * 2.3, B0[1] + AX[1] * 2.3, 0], AX, 1.95, 3.1, 16);
    const dc = L.on(10, 6.6), R = 2.7 * P.k, K = P.k * .9;
    const pic = [[0, -1.25], [.7, -.05], [.62, .55], [0, .85], [-.62, .55], [-.7, -.05]].map(([x, y]) => [dc[0] + x * K, dc[1] + y * K - .3 * K]);
    fin('i_tisztitoszer', { hu:'Klóros tisztítószer', en:'thick blue bleach bottle with an angled neck, child-safe cap and hazard diamond', tilt:TILT, shapes:[
      pth('blue', 'base', [L.sil]),                                                         // flakon
      det('blue', 'light', L.strip(-90, -50, .4, 13.5)),
      det('blue', 'dark', L.strip(32, 90, .4, 13.5)),
      det('blue', 'line', L.strip(68, 90, .4, 13.5), { o:.4 }),
      det('white', 'base', L.strip(-60, 74, 2.4, 10.8, 10)),                               // címke
      det('white', 'dark', L.strip(42, 74, 2.4, 10.8, 4)),
      face('blue', 'base', nk.sil),                                                         // ferde nyak
      face('white', 'base', cp.sil),                                                        // gyerekzáras kupak
      dpth('white', 'dark', [30, 70, 110, 150].map(a => tube([cp.at(.3, a), cp.at(2.8, a)], 1.0, false))),
      face('white', 'light', cp.top),
      det('white', 'light', diamond(dc, R)),                                                // veszély-rombusz
      { t:'line', m:'red', tone:'base', w:1.5, pts:[...diamond(dc, R * .92), diamond(dc, R * .92)[0]] },
      det('dark', 'base', pic),                                                             // piktogram: csepp…
      det('dark', 'base', [[-1.1, 1.05], [1.1, 1.05], [1.1, 1.5], [-1.1, 1.5]].map(([x, y]) => [dc[0] + x * K, dc[1] + y * K])),   // …és marott felület
      shine(L.strip(-72, -63, 1.4, 12.2, 2), .6),
    ]});
  }

  // ---- 15. Fagyálló: 17 × 9 × 20 cm-es fehér kanna felső fogantyúval, piros bordás kupakkal, türkiz folyadék-ablakkal, kék címke hópehellyel és rombusszal ----
  {
    const TILT = -10, X = 8.5, Z = 4.5, H = 20, HZ = 1.8;
    const P = cam({ az:30, el:24, F:80, tilt:TILT, fit:corners(-X, X, 0, 25.5, -Z, Z) });
    const b = box(P, -X, X, 0, H, -Z, Z), q = (x, y, z = Z) => P([x, y, z]);
    const hOut = [[-8, H], [-7.1, 25.5], [1.1, 25.5], [2.1, H]], hIn = [[-5.3, H + .6], [-5.0, 23.5], [-.6, 23.5], [-.3, H + .6]];
    const hTop = hull([...hOut.map(([x, y]) => P([x, y, -HZ])), ...hOut.slice(1).map(([x, y]) => P([x, y, HZ]))]);
    const cap = cyl(P, 5.6, 0, 2.0, H, H + 2.6, 14);
    const sf = [0, 60, 120].map(a => tube([q(-4.4 + 1.8 * cos(a), 9.6 + 1.8 * sin(a)), q(-4.4 - 1.8 * cos(a), 9.6 - 1.8 * sin(a))], .9, false));
    const dc = q(1.2, 9.6), R = 2.5 * P.k;
    fin('i_fagyallo', { hu:'Fagyálló', en:'white antifreeze jug with a handle, blue-green liquid window and hazard diamond', tilt:TILT, shapes:[
      face('white', 'light', hTop),                                                         // fogantyú teteje és oldala
      face('white', 'dark', b.right),                                                       // kanna
      face('white', 'base', b.front),
      face('white', 'light', b.top),
      det('white', 'line', inset([P([X, 0, -Z + 1.1]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + 1.1])], b.sil), { o:.45 }),
      pth('white', 'base', [hOut.map(([x, y]) => P([x, y, HZ])), hIn.map(([x, y]) => P([x, y, HZ])).reverse()]),   // fogantyú eleje
      face('red', 'base', cap.sil), det('red', 'light', cap.top),                           // kupak
      dpth('red', 'dark', [-60, -20, 20, 60].map(a => tube([P([5.6 + 2.0 * sin(a), H + .3, 2.0 * cos(a)]), P([5.6 + 2.0 * sin(a), H + 2.3, 2.0 * cos(a)])], .8, false))),
      det('blue', 'base', [q(-7.4, 4.6), q(3.9, 4.6), q(3.9, 14.6), q(-7.4, 14.6)]),        // címke
      dpth('white', 'light', sf),                                                           // hópehely
      det('glass', 'base', [q(5.5, 2.4), q(7.5, 2.4), q(7.5, 18.2), q(5.5, 18.2)]),         // folyadék-ablak
      det('teal', 'base', [q(5.5, 2.4), q(7.5, 2.4), q(7.5, 12.6), q(5.5, 12.6)]),          // türkiz fagyálló
      det('white', 'light', diamond(dc, R)),                                                // veszély-rombusz
      { t:'line', m:'red', tone:'base', w:1.3, pts:[...diamond(dc, R * .92), diamond(dc, R * .92)[0]] },
      det('dark', 'base', ART.geo.star(dc[0], dc[1], 1.25 * P.k, .55 * P.k, 6)),            // piktogram (csillag-forma)
      shine([q(-8, 3), q(-7.5, 3), q(-7.5, 17.5), q(-8, 17.5)], .7),
    ]});
  }
})();
