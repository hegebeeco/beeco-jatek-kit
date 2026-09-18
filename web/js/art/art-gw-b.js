// ============================================================
//  Matricák — Greenwashing-vadász (Ítéld el!) termékei, 2. csoport (gw_ + azonosító), B szint (docs/rajzolas.md)
//  szivacs · gyümölcslé · testápoló · evőeszköz · sportcipő · falfesték · nyomtatópapír · lazac · babaruha · irodaszék ·
//  kekszes doboz · festékkazetta · kávé · szálláshely · üdítő. Csak a termék: szöveg, márka, logó nélkül (azokat a HTML adja).
//  Valódi méretből (cm, a háznál m) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A kész rajzot a fin() tölti ki a vászonra (perem + árnyék mellett is befér) – minta: art-waste-special-b.js
// ============================================================
(function(){
  const { rad, camera, band } = ART.geo;
  const { hypot, max, min, abs, sqrt } = Math;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const r1 = n => Math.round(n * 10) / 10;

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
  // lekerekített téglalap (u, v síkban) – címkékhez, ablakokhoz; a map vetíti a felületre
  const rrect = (u0, v0, u1, v1, r, map = p => p, n = 3) => [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]]
    .flatMap(([cu, cv, a0]) => Array.from({ length:n + 1 }, (_, i) => map([cu + r * cos(a0 + 90 * i / n), cv + r * sin(a0 + 90 * i / n)])));
  // 2D elhelyezés: eltolás, forgatás (fok), nagyítás a (0,0) körül
  const place = (pts, dx, dy, deg = 0, k = 1) => pts.map(([x, y]) => [dx + k * (x * cos(deg) - y * sin(deg)), dy + k * (x * sin(deg) + y * cos(deg))]);
  // félsík a p→q iránytól balra (képernyőn) – vágáshoz
  const halfPlane = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = hypot(dx, dy), nx = dy / l * 300, ny = -dx / l * 300, ex = dx / l * 300, ey = dy / l * 300;
    return [[p[0] - ex, p[1] - ey], [p[0] + ex, p[1] + ey], [p[0] + ex + nx, p[1] + ey + ny], [p[0] - ex + nx, p[1] - ey + ny]]; };

  // ---------------- 3D segédek ----------------
  const norm = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const cam = o => camera(Object.assign({ span:80 }, o));
  const corners = (x0, x1, y0, y1, z0, z1) => { const o = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) o.push([x, y, z]); return o; };
  // doboz látható lapjai (az > 0: eleje és jobb oldala látszik)
  function box(P, x0, x1, y0, y1, z0, z1){
    const c = (x, y, z) => P([x, y, z]);
    return {
      top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)],
      front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
      right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)],
      sil:hull(corners(x0, x1, y0, y1, z0, z1).map(P)),
    };
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
  // henger tetszőleges tengellyel: at(t, szög, r) a palást pontja (szög 0 = a néző felé)
  function acyl(P, base, dir, r, len, n = 14){
    const d = norm(dir), u = norm(cross(d, [0, 0, 1])), w = cross(u, d);
    const pt = (t, a, rr = r) => P([0, 1, 2].map(k => base[k] + d[k] * t + rr * (Math.cos(rad(a)) * w[k] - Math.sin(rad(a)) * u[k])));
    const ring = (t, rr = r) => Array.from({ length:n }, (_, i) => pt(t, 360 * i / n, rr));
    return { sil:hull([...ring(0), ...ring(len)]), top:ring(len), ring, at:pt };
  }

  // lekerekített sarkú tálca: külső perem fent, szűkebb talp lent (minta: art-huto.js)
  function tray(P, W, D, Hh, ins, rc = 1.6){
    const rr = (w, d, y, r) => [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]]
      .flatMap(([x, z, a0]) => [0, 45, 90].map(t => [x + r * cos(a0 + t), y, z + r * sin(a0 + t)]));
    const top = rr(W, D, Hh, rc), bot = rr(W - 2 * ins, D - 2 * ins, 0, rc * .8), fl = rr(W - 2 * ins - 1.2, D - 2 * ins - 1.2, Hh * .25, rc * .7), rim = rr(W - 1.6, D - 1.6, Hh, rc * .8);
    const sil = hull([...top, ...bot].map(P)), right = hull([...top, ...bot].filter(p => p[0] > W / 2 - ins - rc - .1 || p[2] > D / 2 - ins - .1 && p[0] > 0).map(P));
    return { sil, right:inset(right, sil), top:top.map(P), rim:rim.map(P), floor:hull([...fl, ...rim.map(([x, , z]) => [x * .96, Hh * .25, z * .96])].map(P)) };
  }

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
  //  1. Mosogatószivacs: 11 × 7 cm, 3 cm sárga hab + 1,2 cm zöld súrolóréteg; a hosszú oldalak derékban behúzva (fogás),
  //     a habon pórusok, a súrolón szálas minta, a tetején szappanbuborékok
  // ============================================================================================
  {
    const TILT = -12, X = 5.5, Z = 3.5, HY = 3.0, H = 4.2, W = .35;
    const P = cam({ az:30, el:32, F:60, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), [2.6, H + 3.2, -.6]] });
    const zf = x => Z - W * (1 - (x / X) ** 2), XS = Array.from({ length:9 }, (_, i) => -X + 2 * X * i / 8);
    const fr = (y0, y1, x0 = -X, x1 = X) => { const xs = XS.filter(x => x > x0 + 1e-6 && x < x1 - 1e-6); return [x0, ...xs, x1].map(x => P([x, y0, zf(x)])).concat([x1, ...xs.reverse(), x0].map(x => P([x, y1, zf(x)]))); };
    const sd = (y0, y1) => [[X, y0, Z], [X, y0, -Z], [X, y1, -Z], [X, y1, Z]].map(P);
    const top = [...XS.map(x => P([x, H, zf(x)])), ...XS.slice().reverse().map(x => P([x, H, -zf(x)]))];
    const sil = hull([...fr(0, H), ...top, ...sd(0, H)]), k = P.k;
    const pores = [[-4.2, 1.9, .34], [-2.6, .9, .26], [-1.2, 2.2, .3], [.6, 1.1, .36], [2.4, 2.1, .28], [3.9, .9, .3]].map(([x, y, r]) => circ(...P([x, y, zf(x)]), r * k, 8, r * k * .8));
    const scour = [[-3.8, -1.6, 30], [-1.6, .8, -20], [.9, -1.9, 15], [3.2, .9, -35], [-4.0, 1.9, -10], [1.4, 2.1, 40], [-.9, -.4, 60]]
      .map(([x, z, a]) => tube([P([x - .55 * cos(a), H, z - .55 * sin(a)]), P([x + .55 * cos(a), H, z + .55 * sin(a)])], .55, true));
    const bub = [[3.0, H + 2.3, -.2, 1.25], [4.9, H + .9, .5, .85], [1.5, H + 1.1, .4, .7]].map(([x, y, z, r]) => ({ c:P([x, y, z]), r:r * k }));
    fin('gw_szivacs', { hu:'Mosogatószivacs', en:'yellow kitchen sponge with a green scouring layer and soap bubbles', tilt:TILT, shapes:[
      face('honey', 'dark', sd(0, HY)),                                                     // hab oldala
      face('leaf', 'dark', sd(HY, H)),                                                      // súroló oldala
      face('honey', 'base', fr(0, HY)),                                                     // hab eleje (behúzott derék)
      det('honey', 'light', inset(fr(.25, HY, -X, -X + 2.2), sil)),                         // fény felőli vég
      det('honey', 'line', inset(sd(0, HY).map((p, i) => i === 0 || i === 3 ? lerp(p, sd(0, HY)[i === 0 ? 1 : 2], .82) : p), sil), { o:.35 }),   // hátsó élsáv
      dpth('honey', 'dark', pores),                                                         // pórusok
      face('leaf', 'base', fr(HY, H)),                                                      // súroló eleje
      face('leaf', 'light', top),                                                           // súroló teteje
      dpth('leaf', 'base', scour),                                                          // szálas minta
      pth('glass', 'light', bub.map(b => circ(b.c[0], b.c[1], b.r, 14))),                   // szappanbuborékok
      dpth('glass', 'base', bub.map(b => [...circ(b.c[0], b.c[1], b.r * .8, 10, b.r * .8, 20).slice(0, 5), ...circ(b.c[0] + b.r * .15, b.c[1] + b.r * .1, b.r * .62, 10, b.r * .62, 20).slice(0, 5).reverse()])),
      dpth('paper', 'light', bub.map(b => circ(b.c[0] - b.r * .38, b.c[1] - b.r * .38, b.r * .24, 8)), { o:.95 }),
      shine(inset(fr(2.2, 2.6, -X + .4, -.8), sil), .5),
    ]});
  }

  // ============================================================================================
  //  2. Gyümölcslé: 200 ml-es téglatest doboz (6,3 × 4 × 10,5 cm), NINCS nyeregteteje: lapos teteje hegesztett varrattal,
  //     oldalra hajtott háromszög-fül; hajlított szívószál csíkokkal; üres krém címkén narancs levéllel
  // ============================================================================================
  {
    const TILT = -10, X = 3.15, Z = 2.0, H = 10.5, SX = 1.4, SZ = -.5;
    const straw = [[SX, H - .2, SZ], [SX, H + 3.3, SZ], [SX + .25, H + 4.25, SZ], [SX + 1.0, H + 4.9, SZ], [SX + 2.6, H + 5.7, SZ]];
    const P = cam({ az:32, el:22, F:60, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), ...straw] });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), k = P.k;
    const S = straw.map(P), sw = .62 * k;
    const lab = rrect(-2.55, 1.7, 2.55, 8.3, .9, F);
    const org = circ(-.25, 4.7, 1.75, 16).map(F), oc = F([-.25, 4.7]);
    const seg = [0, 60, 120].map(a => tube([F([-.25 + 1.2 * cos(a), 4.7 + 1.2 * sin(a)]), F([-.25 - 1.2 * cos(a), 4.7 - 1.2 * sin(a)])], .32 * k, false));
    const leaf = [[.1, 6.35], [.9, 7.5], [2.2, 7.7], [1.6, 6.7]].map(F);
    const slice = [...circ(1.55, 3.05, 1.0, 10, 1.0, 180).slice(0, 6), F([2.55, 3.05])].map((p, i) => i < 6 ? F(p) : p);
    fin('gw_gyumolcsle', { hu:'Gyümölcslé', en:'small juice box carton with a bendy straw and an orange on a blank label', tilt:TILT, shapes:[
      face('orange', 'dark', b.right),                                                      // oldala
      det('orange', 'base', inset([P([X, H, Z]), P([X, H, -Z]), P([X, H - 1.9, 0])], b.sil), { o:.55 }),   // lehajtott háromszög-fül
      det('orange', 'line', inset([P([X, 0, -Z + .5]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + .5])], b.sil), { o:.4 }),   // hátsó élsáv
      face('orange', 'base', b.front),                                                      // eleje
      det('orange', 'light', inset([F([-X, 0]), F([-X + .7, 0]), F([-X + .7, H]), F([-X, H])], b.sil)),
      face('orange', 'light', b.top),                                                       // teteje
      det('orange', 'dark', [P([-X + .1, H, .22]), P([X - .1, H, .22]), P([X - .1, H, -.22]), P([-X + .1, H, -.22])]),   // hegesztett varrat
      det('cream', 'base', lab),                                                            // üres címke
      face('orange', 'base', org),                                                          // narancs
      dpth('orange', 'light', [...seg, circ(oc[0] - .45 * k, oc[1] - .5 * k, .38 * k, 8)]), // gerezd-vonalak
      face('leaf', 'base', leaf),                                                           // levél
      face('white', 'base', tube(smooth(S, 3), sw)),                                        // szívószál
      dpth('red', 'base', [[.12, .3], [.5, .68]].map(([a, c]) => tube([lerp(S[0], S[1], a), lerp(S[0], S[1], c)], sw * .9, false)).concat([tube([lerp(S[3], S[4], .35), lerp(S[3], S[4], .75)], sw * .9, false)])),
      dpth('steel', 'dark', [.25, .55, .85].map(t => { const p = lerp(S[1], S[3], t), q = lerp(S[1], S[3], t + .01), n = [q[1] - p[1], p[0] - q[0]], l = hypot(...n) || 1;
        return tube([[p[0] + n[0] / l * sw * .45, p[1] + n[1] / l * sw * .45], [p[0] - n[0] / l * sw * .45, p[1] - n[1] / l * sw * .45]], .45, false); })),   // hajlító harmonika
      det('steel', 'dark', circ(...S[0], sw * .9, 10, sw * .55)),                           // szívószál-nyílás fóliája
      shine([F([-2.75, 8.9]), F([-2.3, 8.9]), F([-2.3, 10]), F([-2.75, 10])], .6),
    ]});
  }

  // ============================================================================================
  //  3. Testápoló: pumpás adagolós flakon – krémfehér test (Ø 6,5 × 15 cm), halvány rózsaszín címkesáv cseppel,
  //     rózsaszín menetes gyűrű, pumpaszár, fehér nyomófej oldalra álló kifolyócsővel
  // ============================================================================================
  {
    const TILT = -10;
    const prof = [[2.9, 0], [3.25, .35], [3.3, 1.2], [3.3, 12.6], [3.05, 14.0], [2.2, 15.0], [1.5, 15.4]];
    const col = [[1.8, 15.2], [1.8, 17.0]], stem = [[.45, 17.0], [.45, 18.9]], head = [[1.55, 18.9], [1.6, 20.6], [1.2, 21.2], [.35, 21.35]];
    const P = cam({ az:0, el:16, tilt:TILT, fit:[...corners(-3.3, 3.3, 0, 21.3, -3.3, 3.3), [4.6, 20.5, 1.3]] });
    const L = lathe(P, prof), C = lathe(P, col), S = lathe(P, stem), Hd = lathe(P, head), k = P.k;
    const sp = acyl(P, [.9, 20.0, .4], [1, 0, .42], .52, 3.4, 10), tip = sp.at(3.4, 0, 0);
    const dc = L.on(-8, 8.6), drop = [[0, -1.25], [.72, .05], [.6, .65], [0, .95], [-.6, .65], [-.72, .05]].map(([x, y]) => [dc[0] + x * k, dc[1] + y * k]);
    fin('gw_testapolo', { hu:'Testápoló', en:'creamy white body lotion pump bottle with a soft pink label band', tilt:TILT, shapes:[
      pth('cream', 'base', [L.sil]),                                                        // flakon (alap)
      det('cream', 'light', L.strip(-90, -50, .35, 14)),                                    // fény felőli csík
      det('cream', 'dark', L.strip(34, 90, .35, 14)),                                       // árnyékos oldal
      det('cream', 'line', L.strip(70, 90, .35, 14), { o:.3 }),                             // legsötétebb élsáv
      det('blossom', 'base', L.strip(-90, 90, 6.2, 11.0, 10)),                              // rózsaszín címkesáv
      det('blossom', 'dark', L.strip(34, 90, 6.2, 11.0, 4)),
      det('paper', 'base', drop),                                                           // krémcsepp-jel
      face('steel', 'base', S.sil),                                                         // pumpaszár
      face('white', 'base', sp.sil),                                                        // kifolyócső
      det('white', 'line', circ(...tip, .3 * k, 8, .36 * k), { o:.6 }),                     // kifolyónyílás
      pth('white', 'base', [Hd.sil]),                                                       // nyomófej
      det('white', 'light', Hd.strip(-90, -30, 18.9, 21.3, 4)),
      det('white', 'dark', Hd.strip(40, 90, 18.9, 21.3, 3)),
      pth('blossom', 'base', [C.sil]),                                                      // menetes gyűrű
      dpth('blossom', 'dark', [C.strip(34, 90, 15.2, 17.0, 3), ...[-50, -15, 20].map(a => tube([C.on(a, 15.5), C.on(a, 16.7)], .5, false))]),   // bordázat
      shine(L.strip(-70, -61, 1.4, 12.2, 2), .75),
    ]});
  }

  // ============================================================================================
  //  7. Nyomtatópapír: becsomagolt A4-es csomag (29,7 × 21 × 6 cm), kék csomagolás fehér sávval, a végén hajtás;
  //     elöl felszakítva (látszanak a lapok élei), a tetején három legyezőszerűen szétcsúszott lap, az egyik sarka felhajlik
  // ============================================================================================
  {
    const TILT = -12, X = 14.85, Z = 10.5, H = 6.0, XS = 9.9, ZS = 7.0;
    const sheetXZ = (a, dx, dz) => [[-XS, ZS], [XS, ZS], [XS, -ZS], [-XS, -ZS]].map(([x, z]) => [dx + x * cos(a) - z * sin(a), dz + x * sin(a) + z * cos(a)]);
    const SH = [[-13, -2.2, -1.6], [-2, -1.4, -2.2], [9, -.4, -2.8]].map(([a, dx, dz], i) => sheetXZ(a, dx, dz).map(([x, z]) => [x, H + .14 + i * .14, z]));
    const P = cam({ az:28, el:20, F:160, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), ...SH.flat()] });
    const b = box(P, -X, X, 0, H, -Z, Z), F = (u, v) => P([u, v, Z]), R = (w, v) => P([X, v, w]);
    const l3 = (p, q, t) => p.map((v, i) => v + (q[i] - v) * t);
    const top = SH[2], dog = [top[1], l3(top[1], top[0], .1), l3(top[1], top[2], .14)];
    const torn = [F(-X, .5), F(-X + 4.6, .5), F(-X + 5.8, 1.6), F(-X + 4.9, 2.6), F(-X + 6.6, 3.7), F(-X + 5.5, 5.0), F(-X, 5.0)];
    fin('gw_nyomtatopapir', { hu:'Nyomtatópapír', en:'wrapped ream of printer paper with a few loose sheets fanned on top', tilt:TILT, shapes:[
      face('blue', 'dark', b.right),                                                         // csomag vége
      dpth('blue', 'line', [tube([R(Z - .3, H - .3), R(4, 2.3), R(-4, 2.3), R(-Z + .3, H - .3)], .7, false), tube([R(Z - .3, .3), R(4, 2.3)], .7, false), tube([R(-Z + .3, .3), R(-4, 2.3)], .7, false)], { o:.45 }),   // borítás hajtása
      face('blue', 'base', b.front),                                                         // csomag eleje
      det('blue', 'line', inset([P([X, 0, -Z + .9]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + .9])], b.sil), { o:.4 }),   // hátsó élsáv
      det('paper', 'base', [F(-X + 5, 1.6), F(X, 1.6), F(X, 4.0), F(-X + 5.4, 4.0)]),       // fehér sáv
      det('paper', 'dark', [R(Z, 1.6), R(-Z, 1.6), R(-Z, 4.0), R(Z, 4.0)]),     // sáv a végén
      det('paper', 'base', inset(torn, b.sil)),                                             // felszakított rész: a lapok élei
      dpth('paper', 'dark', [1.3, 2.4, 3.5, 4.5].map(v => tube([F(-X + .6, v), F(-X + 4.2, v)], .4, false))),
      face('blue', 'light', b.top),                                                          // csomag teteje
      face('white', 'base', SH[0].map(P)),                                                  // szétcsúszott lapok
      face('white', 'base', SH[1].map(P)),
      face('white', 'light', top.map(P)),
      det('white', 'dark', dog.map(P)),                                                     // felhajló sarok
      shine([F(-X + 6.4, 4.5), F(X - 2, 4.5), F(X - 2, 5.1), F(-X + 6.4, 5.1)], .55),
    ]});
  }

  // ============================================================================================
  //  4. Eldobható evőeszköz: kanál, villa és kés legyezőben, derekukon papírszalaggal – világos fa,
  //     a nyél végén lekerekítés, a kanálnak mély öble, a villának négy foga, a késnek ferde éle
  // ============================================================================================
  {
    const TILT = 10, arcBot = a => circ(0, -3.8, 4.3, 12, 4.3, a);
    const shaft = [[-4.3, -3.8], [-3.7, -30], [-3.5, -44]], up = [[3.5, -44], [3.7, -30], [4.3, -3.8]];
    const spoon = simplify(smooth([...arcBot(0).slice(0, 7), ...shaft, [-7.6, -52], [-8.4, -62], [-5.8, -72.5], [0, -75.5], [5.8, -72.5], [8.4, -62], [7.6, -52], ...up], 2), .35);
    const tine = (c, w, y0, y1) => [[c - w, y0], [c - w, y1 + 1.4], [c - w * .5, y1], [c + w * .5, y1], [c + w, y1 + 1.4], [c + w, y0]];
    const fork = smooth([...arcBot(0).slice(0, 7), ...shaft, [-7.0, -50], [-7.4, -57], ...[-5.7, -1.9, 1.9, 5.7].flatMap(c => tine(c, 1.35, -57, -73)), [7.4, -57], [7.0, -50], ...up], 2);
    const knife = simplify(smooth([...arcBot(0).slice(0, 7), ...shaft, [-6.2, -50], [-6.4, -67], [-4.2, -75], [1.4, -78], [5.2, -71], [5.4, -50], ...up], 2), .35);
    const put = (p, deg) => place(p, 50, 86, deg, 1);
    const U = [[spoon, -21], [fork, 0], [knife, 21]].map(([p, d]) => put(p, d));
    const off = p => p.map(([x, y]) => [x + 1.2, y + 1.2]);
    const bowl = put(simplify(smooth([[-6.0, -53], [-6.6, -62], [-4.4, -70.5], [0, -73], [4.4, -70.5], [6.6, -62], [6.0, -53], [0, -50]], 2), .3), -21);
    const edge = put(simplify(smooth([[-5.4, -52], [-5.6, -67], [-3.8, -73.5], [1.0, -76], [.2, -72], [-3.2, -68], [-3.4, -52]], 2), .3), 21);
    const bandQ = place([[-31, -6.4], [31, -6.4], [31, 6.4], [-31, 6.4]], 50, 52, -3);
    fin('gw_evoeszkoz', { hu:'Eldobható evőeszköz', en:'disposable wooden fork, knife and spoon tied with a paper band', tilt:TILT, shapes:[
      pth('cardboard', 'base', U.map(off)),                                                 // a lapok vastagsága (alsó réteg)
      face('cardboard', 'light', U[0]),                                                     // kanál
      face('cardboard', 'light', U[1]),                                                     // villa
      face('cardboard', 'light', U[2]),                                                     // kés
      det('cardboard', 'base', bowl),                                                       // a kanál öble
      det('cardboard', 'dark', place(simplify(smooth([[-4.4, -56], [-5.0, -63], [-3.2, -69], [0, -70.5], [-1.4, -66], [-2.0, -58]], 2), .3), 50, 86, -21), { o:.7 }),
      det('cardboard', 'base', edge),                                                       // a kés ferde éle
      dpth('cardboard', 'dark', [put([[-7.0, -57], [-4.4, -57], [-4.4, -52], [-7.0, -52]], 0), put([[-3.2, -57], [-.6, -57], [-.6, -52], [-3.2, -52]], 0),
        put([[.6, -57], [3.2, -57], [3.2, -52], [.6, -52]], 0), put([[4.4, -57], [7.0, -57], [7.0, -52], [4.4, -52]], 0)], { o:.45 }),   // a villa fogtövei
      face('sage', 'base', bandQ),                                                          // papírszalag
      det('sage', 'light', place([[-31, -6.4], [31, -6.4], [31, -3.4], [-31, -3.4]], 50, 52, -3)),
      det('sage', 'dark', place([[-31, 3.6], [31, 3.6], [31, 6.4], [-31, 6.4]], 50, 52, -3)),
      det('sage', 'line', place([[7, -6.4], [10.4, -6.4], [9.0, 6.4], [5.6, 6.4]], 50, 52, -3), { o:.5 }),   // a szalag hajtása
      dpth('cardboard', 'dark', [place([[-31, 6.4], [31, 6.4], [31, 9.4], [-31, 9.4]], 50, 52, -3)], { o:.22 }),   // a szalag árnyéka
      shine(put([[-6.4, -20], [-4.6, -20], [-4.6, -42], [-6.4, -42]], -21), .5),
    ]});
  }

  // ============================================================================================
  //  5. Sportcipő: futócipő oldalról (3/4), fehér felsőrész zöld orr- és sarokrésszel, fűzők, vastag talp mintás gumival
  // ============================================================================================
  {
    const TILT = -8;
    const upper = smooth([[12, 60], [8, 48], [12, 36], [22, 30], [33, 33], [40, 26], [48, 26], [54, 34], [70, 44], [84, 50], [93, 56], [95, 62], [86, 66], [24, 66], [14, 64]], 4);
    const mid = smooth([[8, 58], [7, 68], [12, 74], [40, 76], [70, 74], [92, 70], [96, 62], [94, 56], [84, 62], [40, 66], [16, 64]], 4);
    const sole = smooth([[8, 68], [10, 77], [18, 81], [50, 82], [78, 79], [95, 72], [96, 64], [92, 70], [60, 76], [20, 77], [11, 73]], 4);
    const collar = smooth([[13, 40], [17, 33], [26, 31], [33, 35], [26, 41], [18, 44]], 4);
    const toe = smooth([[74, 46], [88, 52], [95, 59], [93, 64], [80, 62], [72, 54]], 3);
    const heel = smooth([[9, 47], [13, 36], [22, 31], [25, 36], [18, 43], [15, 56], [12, 62], [9, 60]], 3);
    const tongue = smooth([[33, 34], [38, 27], [47, 27], [52, 34], [44, 39], [37, 39]], 3);
    const lace = [0, 1, 2, 3].map(i => tube([[36 + i * 7.4, 38 - i * .6], [45 + i * 7.6, 46 - i * .2]], 3.0, true));
    const lace2 = [0, 1, 2, 3].map(i => tube([[45 + i * 7.6, 38.6 - i * .4], [36 + i * 7.4, 45.4 - i * .4]], 3.0, true));
    const tread = [0, 1, 2, 3, 4, 5].map(i => tube([[16 + i * 13.5, 79.5 - i * 1.1], [19.5 + i * 13.5, 72.4 - i * 1.1]], 3.0, false));
    fin('gw_sportcipo', { hu:'Sportcipő', en:'green and white running shoe seen from the side', tilt:TILT, shapes:[
      face('white', 'base', upper),                                                         // felsőrész
      det('white', 'light', clip(upper, halfPlane([10, 62], [52, 24])), { o:.9 }),           // fény felőli oldal
      det('white', 'dark', clip(upper, halfPlane([96, 60], [58, 34]))),                      // árnyékos rész
      face('leaf', 'base', toe),                                                            // orrmerevítő
      face('leaf', 'base', heel),                                                           // sarokrész
      det('leaf', 'light', clip(heel, halfPlane([10, 52], [24, 32])), { o:.8 }),
      face('dark', 'base', collar),                                                         // szárnyílás (belseje)
      face('white', 'light', tongue),                                                       // nyelv
      det('leaf', 'base', [[34, 35], [39, 41], [66, 48], [70, 43]]),                        // fűzőmező
      dpth('white', 'light', [...lace, ...lace2]),                                          // fűzők
      face('white', 'base', mid),                                                           // középtalp
      det('white', 'dark', clip(mid, halfPlane([96, 66], [10, 70])), { o:.85 }),
      det('leaf', 'light', [[9, 62], [26, 64.5], [70, 62], [95, 57], [96, 61], [70, 66], [26, 68], [9, 66]], { o:.9 }),   // zöld csík a talp fölött
      face('leaf', 'dark', sole),                                                           // futófelület
      dpth('dark', 'dark', tread, { o:.5 }),                                                // talpminta
      shine([[20, 52], [28, 50], [30, 56], [22, 58]], .5),
    ]});
  }

  // ============================================================================================
  //  9. Babaruha: rövid ujjú body elölről – pasztell kék, fehér nyakszegély és mandzsetta, alul patentos betét,
  //     apró sárga csillagminta
  // ============================================================================================
  {
    const TILT = 10;
    const body = smooth([[31, 27], [38, 21], [44, 18], [56, 18], [62, 21], [69, 27], [79, 30], [84, 43], [75, 47], [69, 41],
      [70, 60], [67, 74], [62, 85], [56, 88], [44, 88], [38, 85], [33, 74], [30, 60], [31, 41], [25, 47], [16, 43], [21, 30]], 4);
    const neck = circ(50, 23.6, 8.2, 16, 4.3);
    const cuffL = [[15.4, 40.4], [25.0, 44.6], [23.2, 49.0], [13.6, 44.8]], cuffR = [[84.6, 40.4], [75.0, 44.6], [76.8, 49.0], [86.4, 44.8]];
    const flap = smooth([[32.6, 70], [50, 73], [67.4, 70], [65, 80], [58, 87.5], [42, 87.5], [35, 80]], 3);
    const stars = [[38, 40, 3.4], [62, 46, 2.9], [46, 56, 3.2], [66, 62, 2.7], [35, 60, 2.6]].map(([x, y, r]) => ART.geo.star(x, y, r, r * .45, 5));
    const snaps = [40, 50, 60].map(x => circ(x, 83, 2.4, 10));
    fin('gw_babaruha', { hu:'Babaruha', en:'pastel baby bodysuit with snap buttons and a small star print', tilt:TILT, shapes:[
      face('sky', 'base', body),                                                            // body
      det('sky', 'light', clip(body, halfPlane([26, 62], [56, 17])), { o:.95 }),             // fény felőli oldal
      det('sky', 'dark', clip(body, halfPlane([80, 48], [58, 20]))),                         // árnyékos oldal
      det('sky', 'line', clip(body, halfPlane([78, 52], [67, 24])), { o:.35 }),              // legsötétebb élsáv
      dpth('sky', 'line', [tube([[41, 21.5], [33, 27.5]], 1.4, false), tube([[59, 21.5], [67, 27.5]], 1.4, false)], { o:.5 }),   // átlapolt váll
      dpth('honey', 'base', stars),                                                         // csillagminta
      det('sky', 'dark', flap, { o:.55 }),                                                  // patentos betét
      { t:'line', m:'sky', tone:'line', w:1.4, pts:[[32.6, 70], [50, 73], [67.4, 70]].map(q => q), o:.55 },
      face('white', 'light', [...circ(50, 23.6, 10.0, 16, 5.6), ...neck.slice().reverse()]),   // nyakszegély
      det('sky', 'dark', neck),                                                             // nyakkivágás
      pth('white', 'light', [cuffL, cuffR]),                                                // mandzsetta
      pth('steel', 'base', snaps),                                                          // patentok
      dpth('steel', 'light', [40, 50, 60].map(x => circ(x, 83, 1.0, 8))),
      shine([[27, 42], [32, 40], [35, 58], [30, 60]], .45),
    ]});
  }

  // ============================================================================================
  //  10. Irodaszék: párnázott ülés és háttámla (türkiz), fém gázrugó, ötágú csillagláb görgőkkel
  // ============================================================================================
  {
    const TILT = -8, SW = 24, SD = 23, SH = 45, ST = 7, BW = 22, BH = 26, LEG = 30;
    const legAng = [-140, -68, 0, 68, 140];
    const P = cam({ az:26, el:20, F:220, tilt:TILT, fit:[...corners(-SW, SW, 0, SH + ST, -SD, SD), [-BW, SH + ST + BH, -SD], [BW, SH + ST + BH, -SD], ...legAng.map(a => [LEG * sin(a), 4, LEG * cos(a)])] });
    const k = P.k;
    const rr = (w, d, y, r, cx = 0, cz = 0) => [[w - r, d - r, 0], [-w + r, d - r, 90], [-w + r, -d + r, 180], [w - r, -d + r, 270]]
      .flatMap(([x, z, a0]) => [0, 45, 90].map(t => [cx + x + r * cos(a0 + t), y, cz + z + r * sin(a0 + t)]));
    const seatTop = rr(SW, SD, SH + ST, 5, 0, 2), seatBot = rr(SW - 1.5, SD - 1.5, SH, 5, 0, 2);
    const seat = { sil:hull([...seatTop, ...seatBot].map(P)), top:seatTop.map(P) };
    const bk = (v, n) => [0, SH + ST - 1 + v * cos(12) + n * sin(12), -SD + 5.5 - v * sin(12) - n * cos(12)];
    const bPts = (n) => [[-BW, 0], [BW, 0], [BW, BH], [BW - 5, BH + 3], [-BW + 5, BH + 3], [-BW, BH]].map(([x, v]) => { const b = bk(v, n); return [x, b[1], b[2]]; });
    const back = { front:bPts(0).map(P), sil:hull([...bPts(0), ...bPts(5)].map(P)) };
    const legs = legAng.map(a => [[-4.5, 7], [4.5, 7], [3.2, 0], [-3.2, 0]].map(([w, y]) => P([w * cos(a) + LEG * sin(a) * (y ? .06 : 1) * (y ? 1 : 1), y ? 9 : 4, -w * sin(a) + LEG * cos(a)])));
    const legBand = legAng.map(a => [P([3.0 * cos(a), 11, -3.0 * sin(a)]), P([-3.0 * cos(a), 11, 3.0 * sin(a)]),
      P([-4.2 * cos(a) + LEG * sin(a), 8, 4.2 * sin(a) + LEG * cos(a)]), P([4.2 * cos(a) + LEG * sin(a), 8, -4.2 * sin(a) + LEG * cos(a)])]);
    const wheels = legAng.map(a => circ(...P([LEG * sin(a), 3.4, LEG * cos(a)]), 3.6 * k, 12, 3.2 * k));
    const gas = lathe(P, [[4.6, 9], [4.6, 20], [2.4, 21], [2.4, SH - 4]]);
    const mech = box(P, -7, 7, SH - 5, SH, -6, 8);
    fin('gw_irodaszek', { hu:'Irodaszék', en:'office chair with padded seat, gas lift and five-star wheeled base', tilt:TILT, shapes:[
      face('teal', 'base', back.sil),                                                       // háttámla
      det('teal', 'light', inset(bPts(0).map(P), back.sil, 1.4)),
      dpth('teal', 'dark', [inset([[-BW + 3, 4], [BW - 3, 4], [BW - 3, 6], [-BW + 3, 6]].map(([x, v]) => { const b = bk(v, .2); return P([x, b[1], b[2]]); }), back.sil, 1.4),
        inset([[-BW + 3, BH - 6], [BW - 3, BH - 6], [BW - 3, BH - 4], [-BW + 3, BH - 4]].map(([x, v]) => { const b = bk(v, .2); return P([x, b[1], b[2]]); }), back.sil, 1.4)], { o:.5 }),   // párnavarrások
      pth('dark', 'base', legBand),                                                         // csillagláb ágai
      dpth('dark', 'light', legs, { o:.5 }),
      pth('dark', 'dark', wheels),                                                          // görgők
      dpth('steel', 'base', legAng.map(a => circ(...P([LEG * sin(a), 3.4, LEG * cos(a)]), 1.4 * k, 8))),
      pth('steel', 'base', [gas.sil]),                                                      // gázrugó
      det('steel', 'light', gas.strip(-90, -40, 9, SH - 4, 3)),
      det('steel', 'dark', gas.strip(38, 90, 9, SH - 4, 3)),
      face('dark', 'base', tube([P([0, SH - 1, -SD + 8]), P([0, SH + ST + 2, -SD + 5.5])], 3.4 * k, false)),   // háttámla-tartó
      face('dark', 'base', mech.front),                                                     // mechanika
      face('dark', 'dark', mech.right),
      face('teal', 'base', seat.sil),                                                       // ülés
      det('teal', 'dark', inset(hull([...seatTop, ...seatBot].filter(p => p[0] > SW - 7).map(P)), seat.sil)),
      face('teal', 'light', seat.top),
      dpth('teal', 'base', [inset(rr(SW - 5, SD - 5, SH + ST + .02, 4, 0, 2).map(P), seat.sil, 1.2)], { o:.75 }),   // ülés varrása
      shine([P([-SW + 3, SH + ST + .1, 12]), P([-6, SH + ST + .1, 15]), P([-8, SH + ST + .1, 9]), P([-SW + 4, SH + ST + .1, 6])], .45),
    ]});
  }

  // ============================================================================================
  //  14. Szálláshely: kétszintes, barátságos kis vendégház – krém fal, piros nyeregtető, virágládás ablakok,
  //      napellenzős bejárat, mellette fa (felirat nélkül)
  // ============================================================================================
  {
    const TILT = -8, X = 5.0, Z = 3.4, WH = 6.4, RID = 2.6, OV = .5;
    const P = cam({ az:26, el:12, F:60, tilt:TILT, fit:[...corners(-X - OV, X + OV, 0, WH + RID, -Z - OV, Z + OV), [-8.6, 7.4, 2.2], [-8.6, 0, 2.2]] });
    const F = ([u, v]) => P([u, v, Z]), k = P.k;
    const gable = [P([X, 0, Z]), P([X, 0, -Z]), P([X, WH, -Z]), P([X, WH + RID, 0]), P([X, WH, Z])];
    const roofF = [P([-X - OV, WH, Z + OV]), P([X + OV, WH, Z + OV]), P([X + OV, WH + RID, 0]), P([-X - OV, WH + RID, 0])];
    const roofR = [P([X + OV, WH, Z + OV]), P([X + OV, WH + RID, 0]), P([X + OV, WH, -Z - OV])];
    const win = (u, v, w = .85, h = 1.05) => rrect(u - w, v - h, u + w, v + h, .18, F);
    const wins = [[-2.6, 4.5], [2.4, 4.5], [-2.6, 1.9]].map(([u, v]) => win(u, v));
    const boxes = [[-2.6, 3.25], [2.4, 3.25]].map(([u, v]) => [F([u - 1.0, v]), F([u + 1.0, v]), F([u + .82, v + .62]), F([u - .82, v + .62])]);
    const flowers = [[-2.6, 3.2], [2.4, 3.2]].flatMap(([u, v]) => [-.62, -.2, .22, .64].map(d => circ(...F([u + d, v - .12]), .3 * k, 7)));
    const door = [F([.5, 0]), F([2.5, 0]), F([2.5, 2.35]), F([1.5, 2.75]), F([.5, 2.35])];
    const awn = [F([-.1, 2.85]), F([3.1, 2.85]), P([3.4, 3.55, Z + .2]), P([-.4, 3.55, Z + .2])];
    const tree = { crown:circ(-7.2, 0, 2.5, 18, 2.9), trunk:0 };
    const tc = P([-7.9, 4.7, 2.0]), tk = 2.7 * k;
    fin('gw_szallas', { hu:'Szálláshely', en:'small friendly two-storey guesthouse with flower boxes and a tree', tilt:TILT, shapes:[
      face('wood', 'base', tube([P([-7.9, 0, 2.0]), P([-7.9, 3.4, 2.0])], .55 * k, false)),   // fa törzse
      face('grass', 'base', circ(tc[0], tc[1], tk, 20, tk * 1.06)),                         // lombkorona
      det('grass', 'light', [...circ(tc[0], tc[1], tk * .98, 12, tk * 1.04, 200).slice(0, 7), ...circ(tc[0] + tk * .18, tc[1] + tk * .16, tk * .72, 12, tk * .76, 200).slice(0, 7).reverse()]),
      face('cream', 'dark', gable),                                                         // oromfalas oldal
      face('cream', 'base', [F([-X, 0]), F([X, 0]), F([X, WH]), F([-X, WH])]),              // homlokzat
      det('cream', 'line', inset([P([X, 0, -Z]), P([X, 0, -Z + .5]), P([X, WH, -Z + .5]), P([X, WH, -Z])], hull([...gable, ...roofF])), { o:.4 }),   // hátsó élsáv
      det('cream', 'dark', [F([-X, WH - .55]), F([X, WH - .55]), F([X, WH]), F([-X, WH])], { o:.45 }),   // eresz árnyéka
      pth('sky', 'base', wins),                                                             // ablakok
      dpth('white', 'light', wins.flatMap((w, i) => { const u = [-2.6, 2.4, -2.6][i], v = [4.5, 4.5, 1.9][i];
        return [tube([F([u, v - 1.05]), F([u, v + 1.05])], .16 * k, false), tube([F([u - .85, v]), F([u + .85, v])], .16 * k, false)]; })),   // ablakosztók
      dpth('wood', 'base', boxes),                                                          // virágládák
      dpth('blossom', 'base', flowers),                                                     // virágok
      face('wood', 'dark', door),                                                           // bejárati ajtó
      det('honey', 'light', circ(...F([2.25, 1.25]), .17 * k, 6)),                            // kilincs
      face('leaf', 'base', awn),                                                            // napellenző
      dpth('leaf', 'light', [0, 2, 4].map(i => [P([-.3 + i * .78, 3.55, Z + .2]), P([.15 + i * .78, 3.55, Z + .2]), F([.2 + i * .78, 2.85]), F([-.25 + i * .78, 2.85])])),   // csíkok
      face('red', 'base', roofF),                                                           // tető
      face('red', 'dark', roofR),
      dpth('red', 'dark', [1, 2, 3].map(i => tube([P([-X - OV, WH + RID * i / 4, Z * (1 - i / 4) + OV * (1 - i / 4)]), P([X + OV, WH + RID * i / 4, Z * (1 - i / 4) + OV * (1 - i / 4)])], .28 * k, false)), { o:.45 }),   // cserépsorok
      shine([F([-4.4, 1.2]), F([-3.7, 1.2]), F([-3.7, 5.8]), F([-4.4, 5.8])], .4),
    ]});
  }

  // ============================================================================================
  //  6. Falfesték: 5 literes vödör (Ø 24 × 24 cm) fém fogantyúval, résnyire nyitott fedéllel (látszik a festék),
  //     a peremről lecsorgó festékcsíkkal és a hasán három színmintás mezővel
  // ============================================================================================
  {
    const TILT = -10, TOP = 23.4;
    const prof = [[10.4, 0], [11.0, .5], [11.2, 1.4], [12.0, 20.8], [12.1, 22.2], [11.8, 22.6], [12.3, 23.0], [12.3, TOP]];
    const arc = [[-11.6, 22.4, 0], [-9.6, 30.0, 0], [0, 33.6, 0], [9.6, 30.0, 0], [11.6, 22.4, 0]];
    const P = cam({ az:0, el:18, tilt:TILT, fit:[...corners(-12.3, 12.3, 0, 34.2, -12.3, 12.3)] });
    const L = lathe(P, prof), k = P.k, A = smooth(arc.map(P), 4);
    const lid = acyl(P, [3.2, 22.9, -.6], [-.34, 1, .08], 12.2, 1.1, 20);
    const drip = tube([L.on(-66, 22.6), L.on(-64, 20.2), L.on(-61, 18.2), L.on(-60, 17.0)], t => (1.15 - .35 * t) * k, true);
    const ear = a => circ(...L.on(a, 21.6), .95 * k, 10);
    fin('gw_falfestek', { hu:'Falfesték', en:'paint bucket with a metal handle, lid ajar, a paint drip and colour swatches', tilt:TILT, shapes:[
      face('steel', 'base', tube(A, .95 * k, true)),                                        // fém fogantyú
      det('dark', 'base', tube(A.slice(6, 12), 1.5 * k, true)),                             // markolat
      pth('white', 'base', [L.sil]),                                                        // vödör
      det('white', 'light', L.strip(-90, -50, .4, 22.6)),
      det('white', 'dark', L.strip(34, 90, .4, 22.6)),
      det('white', 'line', L.strip(70, 90, .4, 22.6), { o:.3 }),                            // legsötétebb élsáv
      det('teal', 'light', L.strip(-58, -22, 6.4, 15.4, 5)),                                // színminta-mezők
      det('teal', 'base', L.strip(-18, 18, 6.4, 15.4, 5)),
      det('teal', 'dark', L.strip(22, 58, 6.4, 15.4, 5)),
      det('white', 'light', L.strip(-90, 90, 22.2, TOP, 12)),                               // perem
      det('teal', 'base', L.full(11.4, 22.8, 20)),                                          // festék a vödörben
      face('white', 'base', lid.sil),                                                       // résnyire nyitott fedél
      det('white', 'light', lid.top),
      det('teal', 'dark', [lid.at(0, 200), lid.at(0, 240), lid.at(.9, 240), lid.at(.9, 200)], { o:.8 }),   // festékes fedélperem
      det('teal', 'base', drip),                                                            // lecsorgó festék
      dpth('steel', 'base', [ear(-52), ear(52)]),                                           // fogantyú-fülek
      shine(L.strip(-70, -62, 2.0, 20.4, 2), .6),
    ]});
  }

  // ============================================================================================
  //  8. Tenyésztett lazac: két filé (21 × 8 × 2,5 cm) fekete tálcán, fólia alatt – narancsos hús fehér zsírcsíkokkal,
  //     ezüst bőrszegéllyel
  // ============================================================================================
  {
    const TILT = -10, TW = 24, TD = 17, TH = 2.6, FH = 2.4;
    const fillet = (cx, cz, len, wid, ang) => Array.from({ length:26 }, (_, i) => { const t = i / 13;   // 0…1 oda, 1…2 vissza
      const s = t <= 1 ? t : 2 - t, w = wid * sqrt(max(0, sin(180 * (.06 + .9 * s)))) * (1 - .32 * s) * (t <= 1 ? 1 : -1);
      const u = -len / 2 + len * s;
      return [cx + u * cos(ang) - w * sin(ang), cz + u * sin(ang) + w * cos(ang)]; });
    const F1 = fillet(-4.6, 2.6, 19, 3.6, -8), F2 = fillet(4.4, -3.0, 19, 3.6, -6);
    const P = cam({ az:22, el:34, tilt:TILT, fit:[[-TW / 2, 0, TD / 2], [TW / 2, 0, TD / 2], [-TW / 2, 0, -TD / 2], [TW / 2, 0, -TD / 2], [-TW / 2, TH, -TD / 2], [TW / 2, TH + FH, -TD / 2]] });
    const slab = f => { const top = f.map(([x, z]) => [x, TH + FH, z]), bot = f.map(([x, z]) => [x, TH + .2, z]);
      const sil = hull([...top, ...bot].map(P)), T = top.map(P);
      return { sil, top:inset(T, sil, .5) }; };
    const T = tray(P, TW, TD, TH, 1.3, 2.4), k = P.k, S = [slab(F1), slab(F2)];
    const skin = s => { const ys = s.sil.map(p => p[1]), lo = max(...ys); return clip(s.sil, [[-200, lo - 1.5 * k], [200, lo - 1.5 * k], [200, lo + 9], [-200, lo + 9]]); };
    const fat = (f, cx, cz, ang) => [-6.0, -2.0, 2.2, 6.2].map(d => tube(Array.from({ length:5 }, (_, i) => {
      const s = -1 + i / 2, w = 3.0 * (1 - .3 * abs(s)); return P([cx + (d + .9 * s * s) * cos(ang) - w * s * sin(ang), TH + FH + .02, cz + (d + .9 * s * s) * sin(ang) + w * s * cos(ang)]); }), .5 * k, false));
    fin('gw_lazac', { hu:'Tenyésztett lazac', en:'two salmon fillets on a black tray under film', tilt:TILT, shapes:[
      pth('dark', 'base', [T.sil]),                                                         // tálca fala
      det('dark', 'dark', T.right),
      face('dark', 'light', T.top),                                                         // tálca pereme
      det('dark', 'dark', T.floor),                                                         // tálca alja
      pth('orange', 'dark', [S[0].sil, S[1].sil]),                                          // a filék oldala
      dpth('steel', 'base', [skin(S[0]), skin(S[1])]),                                      // ezüst bőrszegély
      pth('orange', 'base', [S[0].top, S[1].top]),                                          // a filék húsa
      dpth('orange', 'light', S.map(s => clip(s.top, halfPlane(s.top[20], s.top[3])))),     // fény felőli oldal
      dpth('cream', 'light', [...fat(F1, -4.6, 2.6, -8), ...fat(F2, 4.4, -3.0, -6)], { o:.85 }),   // fehér zsírcsíkok
      det('glass', 'light', inset(T.rim, T.sil, .4), { o:.28 }),                            // feszített fólia
      shine([P([-10.4, TH + FH + .6, -6.2]), P([-6.8, TH + FH + .6, -7.0]), P([-2.0, TH + FH + .6, -4.2]), P([-5.0, TH + FH + .6, -3.2])], .5),
      shine([P([2.0, TH + FH + .6, -7.2]), P([4.4, TH + FH + .6, -7.4]), P([9.6, TH + FH + .6, -5.0]), P([7.6, TH + FH + .6, -4.4])], .4),
    ]});
  }

  // ============================================================================================
  //  11. Kekszes doboz: 21 × 6 × 13 cm-es kartondoboz, elöl ablakkal – mögötte három kerek, szúrt keksz;
  //      felül behajtott fül, alul világos hullámsáv
  // ============================================================================================
  {
    const TILT = -12, X = 10.5, Z = 3.0, H = 13;
    const P = cam({ az:30, el:24, F:120, tilt:TILT, fit:corners(-X, X, 0, H, -Z, Z) });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), k = P.k;
    const win = rrect(-7.6, 3.6, 7.6, 9.8, 1.4, F);
    const bisc = [-4.7, 0, 4.7].map(u => ({ c:F([u, 6.6]), u }));
    const dots = bisc.flatMap(({ u }) => [[-.9, .8], [.9, .8], [0, -.9], [-.9, -.8], [.9, -.8]].map(([a, c]) => circ(...F([u + a, 6.6 + c]), .3 * k, 6)));
    const wave = [F([-X + 1.2, 1.2]), F([X - 1.2, 1.2])];
    fin('gw_kekszesdoboz', { hu:'Kekszes doboz', en:'cardboard biscuit box with a window showing round biscuits', tilt:TILT, shapes:[
      face('red', 'dark', b.right),                                                         // oldala
      det('red', 'line', inset([P([X, 0, -Z + .8]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + .8])], b.sil), { o:.45 }),   // hátsó élsáv
      face('red', 'base', b.front),                                                         // eleje
      face('red', 'light', b.top),                                                          // teteje
      det('red', 'dark', [P([-X + .2, H, .3]), P([X - .2, H, .3]), P([X - .2, H, -.3]), P([-X + .2, H, -.3])]),   // behajtott fül
      det('cream', 'base', [...wave, F([X - 1.2, 2.5]), F([-X + 1.2, 2.5])]),               // világos sáv
      det('cream', 'dark', win),                                                            // ablak mélyedése
      pth('wood', 'light', bisc.map(({ c }) => circ(c[0], c[1], 2.55 * k, 18))),            // kekszek
      dpth('wood', 'base', bisc.map(({ c }) => [...circ(c[0], c[1], 2.55 * k, 14, 2.55 * k, 25).slice(0, 8), ...circ(c[0] - .3 * k, c[1] - .25 * k, 2.15 * k, 14, 2.15 * k, 25).slice(0, 8).reverse()])),   // árnyékos perem
      dpth('wood', 'dark', dots),                                                           // szúrt lyukak
      det('red', 'light', [...rrect(-7.9, 3.3, 7.9, 10.1, 1.6, F), ...win.slice().reverse()], { o:.9 }),   // ablakkeret
      shine([F([-6.8, 4.6]), F([-4.0, 4.6]), F([-6.8, 8.4])], .4),
      shine([F([-9.4, 3.2]), F([-8.7, 3.2]), F([-8.7, 11.4]), F([-9.4, 11.4])], .5),
    ]});
  }

  // ============================================================================================
  //  12. Felújított festékkazetta: 33 cm hosszú, sötét műanyag test lépcsős dobkamrával, ezüst dobzárral és méz-sárga
  //      színsávval; felül fogantyú, róla lógó zöld levél-alakú függőcímke (újrahasznosítás-nyíl nélkül)
  // ============================================================================================
  {
    const TILT = -10, X = 16.5;
    const prof = [[-5, 0], [5.6, 0], [5.6, 3.4], [2.4, 3.4], [2.0, 10.4], [-5, 10.4]];   // (z, y) keresztmetszet: elöl a dobkamra
    const P = cam({ az:28, el:26, F:160, tilt:TILT, fit:[...corners(-X, X, 0, 10.4, -5, 5.6), [X, 14.2, 1]] });
    const k = P.k, quad = i => [P([-X, prof[i][1], prof[i][0]]), P([X, prof[i][1], prof[i][0]]), P([X, prof[i + 1][1], prof[i + 1][0]]), P([-X, prof[i + 1][1], prof[i + 1][0]])];
    const cap = prof.map(([z, y]) => P([X, y, z]));
    const sil = hull([...cap, ...prof.map(([z, y]) => P([-X, y, z]))]);
    const hd = smooth([P([-5.0, 10.4, 1.0]), P([-4.6, 13.6, .8]), P([4.4, 13.9, .6]), P([5.2, 10.4, .4])], 4);
    const tagC = P([8.6, 5.0, 6.6]), tag = [[0, -5.4], [4.4, -2.8], [5.0, 2.2], [0, 6.0], [-5.0, 2.2], [-4.4, -2.8]].map(([x, y]) => [tagC[0] + x * 1.25 * k / 3, tagC[1] + y * 1.25 * k / 3]);
    const tr = 1.25 * k / 3;
    fin('gw_festekkazetta', { hu:'Felújított festékkazetta', en:'printer toner cartridge with a coloured band and a green leaf tag', tilt:TILT, shapes:[
      face('dark', 'dark', cap),                                                            // véglap
      face('dark', 'base', quad(1)),                                                        // dobkamra eleje
      det('steel', 'base', inset([P([-X, .4, 5.6]), P([X, .4, 5.6]), P([X, 2.0, 5.6]), P([-X, 2.0, 5.6])], sil)),   // ezüst dobzár
      face('dark', 'light', quad(2)),                                                       // dobkamra teteje
      face('dark', 'base', quad(3)),                                                        // tartály eleje
      det('honey', 'base', inset([P([-X, 4.6, 2.36]), P([X, 4.6, 2.36]), P([X, 7.0, 2.22]), P([-X, 7.0, 2.22])], sil)),   // méz-sárga színsáv
      det('honey', 'dark', inset([P([X, 4.6, 2.36]), P([X, 4.6, -5]), P([X, 7.0, -5]), P([X, 7.0, 2.22])], sil)),
      face('dark', 'light', quad(4)),                                                       // teteje
      det('dark', 'line', inset([P([X, 0, -5]), P([X, 10.4, -5]), P([X - 2.2, 10.4, -5]), P([X - 2.2, 0, -5])], sil), { o:.5 }),   // hátsó élsáv
      det('teal', 'base', circ(...P([X, 1.4, 3.4]), 1.5 * k, 12)),                          // a dob vége a véglapon
      det('steel', 'dark', circ(...P([X, 7.4, -1.6]), 1.2 * k, 10)),                        // hajtó-fogaskerék
      face('dark', 'light', tube(hd, 1.6 * k, false)),                                      // fogantyú
      dpth('dark', 'dark', [2, 4, 6].map(i => tube([hd[i], hd[i + 1]], 1.3 * k, false)), { o:.5 }),   // fogantyú bordái
      { t:'line', m:'cream', tone:'dark', w:r1(.3 * k), pts:[hd[hd.length - 1], [(hd[hd.length - 1][0] + tagC[0]) / 2 + .6, (hd[hd.length - 1][1] + tagC[1]) / 2], [tagC[0], tagC[1] - 5.2 * tr]].map(q => [r1(q[0]), r1(q[1])]) },   // zsinór
      face('leaf', 'base', tag),                                                            // levél-alakú függőcímke
      det('leaf', 'light', [tag[0], tag[1], tag[2], tag[3]], { o:.55 }),
      dpth('leaf', 'line', [tube([[tagC[0], tagC[1] - 4.2 * tr], [tagC[0], tagC[1] + 4.6 * tr]], .6 * tr, false),
        tube([[tagC[0], tagC[1] - .6 * tr], [tagC[0] + 3.0 * tr, tagC[1] - 2.4 * tr]], .5 * tr, false),
        tube([[tagC[0], tagC[1] + 1.4 * tr], [tagC[0] - 3.0 * tr, tagC[1] - .4 * tr]], .5 * tr, false)], { o:.55 }),   // levélerezet
      det('cream', 'light', circ(tagC[0], tagC[1] - 4.7 * tr, 1.0 * tr, 8)),                // fűzőlyuk
      shine([P([-X + 2, 8.2, 2.14]), P([-X + 9, 8.2, 2.14]), P([-X + 9, 9.0, 2.1]), P([-X + 2, 9.0, 2.1])], .4),
    ]});
  }

  // ============================================================================================
  //  13. Kávé: álló, alul kiöblösödő kraft-tasak (12 × 22 cm) – felül lehegesztett perem drótkötegkével, egyirányú szelep,
  //      üres krém címkén kávészem-jel, elöl kiszóródott pörkölt szemek
  // ============================================================================================
  {
    const TILT = -10, X = 6, ZB = 3.6, ZT = .5, H = 21, SEAL = 2.0;
    const zAt = v => ZB + (ZT - ZB) * min(1, v / H);
    const P = cam({ az:26, el:18, F:90, tilt:TILT, fit:[...corners(-X, X, 0, H + SEAL, -ZB, ZB), [-8.5, 0, 7.5], [8.5, 0, 7.5]] });
    const F = ([u, v]) => P([u, v, zAt(v)]), k = P.k;
    const front = [F([-X, 0]), F([X, 0]), F([X, H]), F([-X, H])];
    const side = [P([X, 0, ZB]), P([X, 0, -ZB]), P([X, H, -ZT]), P([X, H, ZT])];
    const seal = [P([-X, H, 0]), P([X, H, 0]), P([X, H + SEAL, 0]), P([-X, H + SEAL, 0])];
    const sil = hull([...front, ...side, ...seal]);
    const lab = rrect(-4.4, 6.0, 4.4, 12.6, .9, F);
    const bc = F([0, 9.3]);
    const bean = (c, r, a, s = 1) => ({ sil:circ(c[0], c[1], r, 14, r * .72, a), crease:tube([[c[0] - r * .78 * cos(a), c[1] - r * .78 * sin(a)], [c[0] - r * .2 * cos(a) + r * .16 * sin(a), c[1] - r * .2 * sin(a) - r * .16 * cos(a)],
      [c[0] + r * .2 * cos(a) - r * .16 * sin(a), c[1] + r * .2 * sin(a) + r * .16 * cos(a)], [c[0] + r * .78 * cos(a), c[1] + r * .78 * sin(a)]], r * .2 * s, false),
      lit:circ(c[0] - r * .3, c[1] - r * .3, r * .38, 8, r * .26, a) });
    const B = [[[-8.0, .9, 6.4], 1.5, 18], [[-5.2, .9, 8.2], 1.4, -24], [[6.4, .9, 7.0], 1.45, 12], [[2.4, .9, 8.6], 1.3, 40]].map(([p, r, a]) => bean(P(p), r * k, a));
    const lb = bean(bc, 2.3 * k, -16, 1.3);
    fin('gw_kave', { hu:'Kávé', en:'kraft coffee bean bag with a one-way valve and roasted beans spilled in front', tilt:TILT, shapes:[
      face('cardboard', 'dark', side),                                                      // oldalhajtás
      det('cardboard', 'line', inset([P([X, 0, 0]), P([X, H, 0]), P([X, H, -.5]), P([X, 0, -.6])], sil), { o:.45 }),   // hajtásél
      face('cardboard', 'base', front),                                                     // eleje
      det('cardboard', 'light', inset([F([-X, .2]), F([-X + 1.5, .2]), F([-X + 1.5, H]), F([-X, H])], sil)),
      face('cardboard', 'light', seal),                                                     // lehegesztett perem
      dpth('cardboard', 'dark', Array.from({ length:9 }, (_, i) => tube([P([-X + .8 + i * 1.3, H + .3, 0]), P([-X + .8 + i * 1.3, H + SEAL - .3, 0])], .5, false)), { o:.6 }),   // hegesztés fogazata
      det('steel', 'base', [P([-X + .4, H + .7, .05]), P([X - .4, H + .7, .05]), P([X - .4, H + 1.4, .05]), P([-X + .4, H + 1.4, .05])]),   // drótkötegke
      det('cream', 'base', lab),                                                            // üres címke
      det('chocolate', 'base', lb.sil),                                                     // kávészem-jel
      dpth('cream', 'base', [lb.crease]),
      face('dark', 'base', circ(...F([2.9, 15.4]), 1.5 * k, 12)),                           // egyirányú szelep
      dpth('steel', 'light', [[-.45, 0], [.45, 0], [0, -.45], [0, .45]].map(([a, c]) => circ(...F([2.9 + a, 15.4 + c]), .26 * k, 6))),
      pth('chocolate', 'base', B.map(b => b.sil)),                                          // kiszóródott kávészemek
      dpth('chocolate', 'light', B.map(b => b.lit), { o:.75 }),
      dpth('cream', 'base', B.map(b => b.crease), { o:.85 }),
      shine([F([-4.0, 16.6]), F([-3.2, 16.6]), F([-3.2, 19.8]), F([-4.0, 19.8])], .5),
    ]});
  }

  // ============================================================================================
  //  15. Üdítő: 0,5 l-es PET palack, EGYENES test (nincs „derék”), sötét kóla-színű ital, piros kupak, üres méz-sárga címkesáv,
  //      egyszerű fogó-bordák, szirmos (öt lábú) talp
  // ============================================================================================
  {
    const TILT = -12, LVL = 18.2;
    const prof = [[2.3, 0], [2.95, .3], [3.3, 1.3], [3.3, 16.4], [3.05, 18.3], [2.2, 20.4], [1.35, 22.0], [1.2, 22.6], [1.6, 22.6], [1.6, 22.9], [1.25, 22.9], [1.25, 23.2], [1.5, 23.2], [1.5, 25.3]];
    const P = cam({ az:0, el:14, tilt:TILT, fit:[...corners(-3.3, 3.3, 0, 25.3, -3.3, 3.3)] });
    const L = lathe(P, prof), k = P.k;
    const rings = [3.4, 5.0, 14.6].map(y => tube(L.ring(3.3, y, -76, 76, 8), .55, false));
    const bubbles = [[-30, 4.2, .42], [22, 7.2, .34], [-10, 15.6, .38], [34, 16.8, .3], [2, 17.4, .26]].map(([a, y, r]) => circ(...L.on(a, y), r * k, 7));
    const feet = [-45, 0, 45].map(a => tube([L.on(a, .15), L.on(a, 1.25)], .7, false));
    const ribs = [-60, -30, 0, 30, 60].map(a => tube([L.on(a, 23.4), L.on(a, 25.1)], .7, false));
    fin('gw_udito', { hu:'Üdítő', en:'straight PET soft drink bottle with cola-coloured drink, red cap and blank yellow label band', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                        // átlátszó palack
      det('glass', 'dark', L.strip(36, 90, LVL, 22.6, 3)),                                  // üres váll árnyékos oldala
      det('chocolate', 'base', L.strip(-90, 90, .35, LVL, 12)),                             // kóla-színű ital
      det('chocolate', 'light', L.strip(-90, -52, .35, LVL)),
      det('chocolate', 'dark', L.strip(34, 90, .35, LVL)),
      det('chocolate', 'line', L.strip(70, 90, .35, LVL), { o:.45 }),                       // legsötétebb élsáv
      det('chocolate', 'light', L.full(L.rAt(LVL) - .3, LVL, 18), { o:.8 }),                // ital felszíne
      dpth('chocolate', 'light', [...rings, ...feet], { o:.75 }),                           // fogó-bordák, talp-lábak
      det('honey', 'base', L.strip(-90, 90, 7.4, 12.6, 12)),                                // üres címkesáv
      det('honey', 'light', L.strip(-90, -54, 7.4, 12.6)),
      det('honey', 'dark', L.strip(34, 90, 7.4, 12.6)),
      dpth('paper', 'light', bubbles, { o:.55 }),                                           // buborékok
      det('glass', 'dark', L.strip(-90, 90, 22.6, 22.9, 8)),                                // nyakgyűrű
      det('red', 'base', L.strip(-90, 90, 23.2, 25.3, 8)),                                  // piros kupak
      dpth('red', 'dark', ribs),
      face('red', 'light', L.full(1.5, 25.3, 16)),                                          // kupak teteje
      shine(L.strip(-68, -59, 1.8, 21.4, 2), .6),
    ]});
  }
})();
