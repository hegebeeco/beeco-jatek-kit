// ============================================================
//  Matricák — Greenwashing-vadász (Ítéld el!) termékei, 3. csoport (gw_ + azonosító), B szint (docs/rajzolas.md)
//  bevásárlószatyor · webshop-csomag · tusfürdő · papírpohár · farmer · mosópor · növényi ital · proteinszelet ·
//  szappan · mogyoróvaj · öblítő · hamburger · chipses zacskó · gyümölcstálca.
//  Csak a termék: szöveg, márka, logó nélkül (a hamis márkát és az öko-pecsétet a HTML adja).
//  Valódi méretből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A kész rajzot a fin() illeszti a vászonra (perem + árnyék mellett is befér) – minta: csoport2/matrica.js
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


  // ---------------- közös apró segédek ----------------
  // levél-forma: hossz L, szélesség W, középpont (cx, cy), fok – rajzolt matricákhoz (nyomat, dísz)
  const leafShape = (cx, cy, L, W, deg) => place(simplify(smooth([[-L / 2, 0], [-L * .22, -W / 2], [L * .26, -W * .42], [L / 2, 0], [L * .26, W * .42], [-L * .22, W / 2]], 4), .18), cx, cy, deg);

  // ============================================================================================
  //  1. Bevásárlószatyor: álló, 34 × 40 cm-es kraft/zöld textilszatyor 13 cm mély talppal – két szalagfül,
  //     az oldalán levél-nyomat, felül nyitott száj (sötét belső) és varrás-öltések
  // ============================================================================================
  {
    const TILT = -12, X = 17, Z = 6.5, H = 40;
    const hf = [[-8.4, H - .6, 3.2], [-8.0, H + 8.4, 3.2], [0, H + 12.2, 3.2], [8.0, H + 8.4, 3.2], [8.4, H - .6, 3.2]];
    const hb = [[-8.4, H - .6, -3.2], [-8.0, H + 7.2, -3.2], [0, H + 10.6, -3.2], [8.0, H + 7.2, -3.2], [8.4, H - .6, -3.2]];
    const P = cam({ az:30, el:26, F:220, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), ...hf, ...hb] });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), k = P.k;
    const inner = [[-X + 1.5, H, Z - 1.3], [X - 1.5, H, Z - 1.3], [X - 1.5, H, -Z + 1.3], [-X + 1.5, H, -Z + 1.3]].map(P);
    const HF = smooth(hf.map(P), 4), HB = smooth(hb.map(P), 4);
    const lc = F([-1.5, 20]);
    const big = leafShape(lc[0], lc[1], 17 * k, 8.4 * k, -34);
    const rib = tube([[lc[0] - 8.0 * k * cos(-34), lc[1] - 8.0 * k * sin(-34)], [lc[0] + 8.0 * k * cos(-34), lc[1] + 8.0 * k * sin(-34)]], .45 * k, false);
    const vein = [-.42, -.1, .24].map(t => { const a = [lc[0] + t * 15 * k * cos(-34), lc[1] + t * 15 * k * sin(-34)];
      return tube([a, [a[0] + 3.6 * k * cos(24), a[1] + 3.6 * k * sin(24)]], .34 * k, false); });
    const sm1 = F([7.4, 13.2]), sm2 = F([5.6, 26.4]);
    fin('gw_szatyor', { hu:'Bevásárlószatyor', en:'reusable kraft-green shopping tote bag standing upright with two strap handles and a leaf print', tilt:TILT, shapes:[
      face('cardboard', 'dark', tube(HB, 1.5 * k, false)),                                  // hátsó fül
      face('cardboard', 'dark', b.right),                                                   // oldala
      det('cardboard', 'line', inset([P([X, 0, -Z + 1.1]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + 1.1])], b.sil), { o:.42 }),   // hátsó élsáv
      face('cardboard', 'base', b.front),                                                   // eleje
      det('cardboard', 'light', inset([F([-X, .4]), F([-X + 2.4, .4]), F([-X + 2.4, H]), F([-X, H])], b.sil)),   // fény felőli sáv
      face('cardboard', 'light', b.top),                                                    // felső perem
      det('cardboard', 'line', inner),                                                      // nyitott száj (sötét belső)
      det('leaf', 'base', big),                                                             // levél-nyomat
      det('leaf', 'dark', clip(big, halfPlane([lc[0] - 9 * k * cos(-34), lc[1] - 9 * k * sin(-34)], [lc[0] + 9 * k * cos(-34), lc[1] + 9 * k * sin(-34)])), { o:.6 }),
      dpth('leaf', 'light', [rib, ...vein], { o:.75 }),                                     // erezet
      det('leaf', 'base', leafShape(sm1[0], sm1[1], 7.2 * k, 3.4 * k, 22)),                 // kis levelek
      det('leaf', 'base', leafShape(sm2[0], sm2[1], 6.0 * k, 2.9 * k, -62)),
      face('cardboard', 'base', tube(HF, 1.6 * k, false)),                                  // elülső fül
      det('cardboard', 'light', tube(HF.slice(0, 7), 1.0 * k, false), { o:.5 }),
      dpth('cardboard', 'line', [[-8.4, .9], [8.4, .9]].map(([u, w]) => tube([P([u, H - 3.0, 3.2 + w - .9]), P([u, H - .8, 3.2 + w - .9])], .8, false)), { o:.5 }),   // fül-felvarrás
      dpth('cardboard', 'line', Array.from({ length:9 }, (_, i) => tube([F([-X + 1.6 + i * 3.9, H - 2.2]), F([-X + 3.4 + i * 3.9, H - 2.2])], .5, false)), { o:.45 }),   // öltések
      shine([F([-X + 3.2, 30]), F([-X + 4.6, 30]), F([-X + 4.6, 37]), F([-X + 3.2, 37])], .5),
    ]});
  }

  // ============================================================================================
  //  2. Webshop-csomag: 34 × 26 × 20 cm-es hullámkarton doboz – a tetején és elöl ragasztószalag,
  //     üres szállítócímke, a jobb felső sarka behorpadva (törékeny), a szalag vége felhajlik
  // ============================================================================================
  {
    const TILT = -12, X = 17, Z = 13, H = 20;
    const P = cam({ az:28, el:28, F:200, tilt:TILT, fit:corners(-X, X, 0, H, -Z, Z) });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), k = P.k;
    const tTop = [P([-X, H, 2.4]), P([X, H, 2.4]), P([X, H, -2.4]), P([-X, H, -2.4])];
    const tFront = [F([-2.4, H]), F([2.4, H]), F([2.4, 0]), F([-2.4, 0])];
    const lab = rrect(4.6, 5.4, 14.6, 13.6, .7, F);
    const dent = [P([X - 7.0, H, Z]), P([X, H, Z - 6.0]), P([X - 1.6, H, Z - 1.4])];
    const dentC = P([X - 3.4, H, Z - 3.0]);
    fin('gw_csomag', { hu:'Webshop-csomag', en:'closed cardboard parcel box sealed with packing tape and a blank shipping label', tilt:TILT, shapes:[
      face('cardboard', 'dark', b.right),                                                   // oldala
      det('cardboard', 'line', inset([P([X, 0, -Z + 1.4]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + 1.4])], b.sil), { o:.42 }),   // hátsó élsáv
      face('cardboard', 'base', b.front),                                                   // eleje
      det('cardboard', 'light', inset([F([-X, .3]), F([-X + 2.6, .3]), F([-X + 2.6, H]), F([-X, H])], b.sil)),
      det('cardboard', 'line', inset([F([-X, 0]), F([X, 0]), F([X, 1.1]), F([-X, 1.1])], b.sil), { o:.3 }),   // hullámkarton alsó él
      face('cardboard', 'light', b.top),                                                    // teteje
      det('cardboard', 'dark', dent, { o:.85 }),                                            // behorpadt sarok
      dpth('cardboard', 'line', [tube([P([X - 7.0, H, Z]), dentC, P([X, H, Z - 6.0])], .6, false),
        tube([dentC, P([X - 1.4, H, Z - 1.2])], .5, false)], { o:.5 }),                      // horpadás gyűrődései
      det('cream', 'base', tTop),                                                           // szalag a tetején
      det('cream', 'base', tFront),                                                         // szalag elöl
      dpth('cream', 'dark', [tube([P([-X, H, 2.4]), P([X, H, 2.4])], .45, false), tube([P([-X, H, -2.4]), P([X, H, -2.4])], .45, false),
        tube([F([-2.4, H]), F([-2.4, 0])], .45, false), tube([F([2.4, H]), F([2.4, 0])], .45, false)], { o:.5 }),   // szalag széle
      det('paper', 'base', lab),                                                            // üres szállítócímke
      det('paper', 'dark', [F([5.4, 10.6]), F([13.8, 10.6]), F([13.8, 11.6]), F([5.4, 11.6])], { o:.45 }),   // címke osztóvonala
      shine([P([-X + 4.4, H, 8.2]), P([-X + 12.4, H, 8.2]), P([-X + 10.0, H, 4.6]), P([-X + 2.0, H, 4.6])], .45),
      shine([F([-X + 3.4, 14.4]), F([-X + 4.4, 14.4]), F([-X + 4.4, 18.4]), F([-X + 3.4, 18.4])], .5),
    ]});
  }

  // ============================================================================================
  //  3. Tusfürdő: FEJJEL LEFELÉ álló, lapos ovális flakon (Ø 7,6 × 4,4 × 21 cm) a széles pattintós kupakján –
  //     a kék zselé a kupak felé gyűlt, fent üres légrés, a nyak bevágott, mellette vízcseppek
  // ============================================================================================
  {
    const TILT = -10, LVL = 14.6;
    const prof = [[3.7, 0], [4.25, .5], [4.25, 3.0], [3.9, 3.4], [1.8, 3.5], [1.7, 4.3], [2.8, 5.4], [3.5, 7.0], [3.65, 8.8], [3.65, 15.5], [3.5, 18.0], [3.05, 20.0], [2.85, 20.6]];
    const P = cam({ az:0, el:15, tilt:TILT, fit:[...corners(-4.25, 4.25, 0, 20.6, -2.5, 2.5), [6.8, 15.5, 0], [-6.6, 11.0, 0]] });
    const L = lathe(P, prof, .58), k = P.k;
    const ribs = [-64, -32, 0, 32, 64].map(a => tube([L.on(a, .8), L.on(a, 2.6)], .62, false));
    const drops = [[6.4, 15.0, 1.15], [-6.1, 10.4, .95], [5.6, 7.2, .8]].map(([x, y, r]) => {
      const c = P([x, y, 0]), R = r * k;
      return { sil:simplify(smooth([[0, -1.55 * R], [.72 * R, -.1 * R], [.95 * R, .55 * R], [0, 1.05 * R], [-.95 * R, .55 * R], [-.72 * R, -.1 * R]].map(([a, d]) => [c[0] + a, c[1] + d]), 4), .15),
        lit:circ(c[0] - .34 * R, c[1] - .2 * R, .3 * R, 8, .42 * R) };
    });
    fin('gw_tusfurdo', { hu:'Tusfürdő', en:'upside-down oval shower gel bottle standing on its wide flip cap, blue gel inside', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                        // átlátszó flakon
      det('glass', 'light', L.strip(-90, -54, LVL, 20.2)),                                  // üres légrés fénye
      det('glass', 'dark', L.strip(36, 90, LVL, 20.2)),
      det('water', 'base', L.strip(-90, 90, 3.55, LVL, 12)),                                // kék zselé
      det('water', 'light', L.strip(-90, -52, 3.55, LVL)),
      det('water', 'dark', L.strip(34, 90, 3.55, LVL)),
      det('water', 'line', L.strip(72, 90, 3.55, LVL), { o:.45 }),                          // legsötétebb élsáv
      det('water', 'light', L.full(L.rAt(LVL) - .25, LVL, 18), { o:.85 }),                  // a zselé felszíne
      det('glass', 'dark', L.strip(-90, 90, 3.4, 4.3, 8)),                                  // bevágott nyak
      det('white', 'base', L.strip(-90, 90, 0, 3.0, 12)),                                   // pattintós kupak
      det('white', 'light', L.strip(-90, -50, 0, 3.0)),
      det('white', 'dark', L.strip(34, 90, 0, 3.0)),
      dpth('white', 'dark', ribs, { o:.55 }),                                               // kupak bordái
      det('steel', 'base', L.strip(-90, 90, 3.0, 3.4, 8), { o:.8 }),                       // kupak pereme
      pth('glass', 'light', drops.map(d => d.sil)),                                         // vízcseppek
      dpth('paper', 'light', drops.map(d => d.lit), { o:.9 }),
      shine(L.strip(-70, -60, 4.6, 19.0, 3), .6),
    ]});
  }

  // ============================================================================================
  //  4. Papírpohár: 9 × 13 cm-es elvitelre való pohár – hullámkarton fogógyűrű, sötét műanyag tető
  //     ivónyílással és kis szellőzőlyukkal, fölötte gőzpára
  // ============================================================================================
  {
    const TILT = -10;
    const prof = [[2.9, 0], [3.1, .4], [3.2, 1.0], [4.35, 11.3]];
    const lid = [[4.5, 11.3], [4.65, 11.9], [4.3, 12.3], [3.9, 12.6], [3.55, 13.3], [3.1, 13.7]];
    const steam = [[-1.2, 14.6], [1.0, 16.2], [-.8, 17.8], [1.2, 19.4]];
    const P = cam({ az:0, el:16, tilt:TILT, fit:[...corners(-4.65, 4.65, 0, 13.7, -4.65, 4.65), ...steam.map(([x, y]) => [x, y, 0])] });
    const L = lathe(P, prof), D = lathe(P, lid), k = P.k;
    const corr = Array.from({ length:11 }, (_, i) => tube([L.on(-84 + i * 16.8, 4.0), L.on(-84 + i * 16.8, 7.8)], .5, false));
    const hc = D.on(-26, 13.3), hole = circ(hc[0], hc[1], 1.15 * k, 10, .62 * k);
    const vent = circ(...D.on(48, 13.1), .34 * k, 7, .24 * k);
    const ST = smooth(steam.map(([x, y]) => P([x, y, 0])), 4);
    fin('gw_papirpohar', { hu:'Papírpohár', en:'takeaway paper coffee cup with a plastic lid and a corrugated sleeve, steam above', tilt:TILT, shapes:[
      pth('paper', 'base', [L.sil]),                                                        // papírpohár
      det('paper', 'light', L.strip(-90, -50, .3, 11.3)),
      det('paper', 'dark', L.strip(34, 90, .3, 11.3)),
      det('paper', 'line', L.strip(72, 90, .3, 11.3), { o:.4 }),                            // legsötétebb élsáv
      det('cardboard', 'base', L.strip(-90, 90, 3.8, 8.0, 12)),                             // hullámkarton fogógyűrű
      det('cardboard', 'light', L.strip(-90, -52, 3.8, 8.0)),
      det('cardboard', 'dark', L.strip(34, 90, 3.8, 8.0)),
      dpth('cardboard', 'line', corr, { o:.4 }),                                            // hullámok
      pth('dark', 'base', [D.sil]),                                                         // műanyag tető
      det('dark', 'light', D.strip(-90, -46, 11.3, 13.7, 4)),
      det('dark', 'line', D.strip(38, 90, 11.3, 13.7, 4), { o:.65 }),
      det('steel', 'dark', D.strip(-90, 90, 11.3, 11.9, 10), { o:.6 }),                     // tető pereme
      det('steel', 'dark', circ(hc[0], hc[1], 1.45 * k, 10, .86 * k), { o:.5 }),             // ivónyílás pereme
      det('dark', 'line', hole),                                                            // ivónyílás
      det('dark', 'line', vent, { o:.8 }),                                                  // szellőzőlyuk
      pth('paper', 'light', [tube(ST, 1.5 * k, true)], { o:.55 }),                          // gőzpára
      shine(L.strip(-68, -58, 1.0, 10.8, 3), .55),
    ]});
  }

  // ============================================================================================
  //  5. Farmer: kiterített, felhajtott szárú kék farmernadrág (kb. 100 × 44 cm) – derékpászta bújtatókkal,
  //     középen fémgomb, sárga tűzés (slicc, zsebívek), jobbra bőrhatású (üres) folt, alul felhajtott szárvégek
  // ============================================================================================
  {
    const TILT = -8;
    const S = [[-17, -31], [17, -31], [19.2, -20], [18, -6], [15.0, 12], [12.6, 32], [12.6, 38], [2.7, 38], [2.0, 12], [1.4, -3],
      [0, -5.2], [-1.4, -3], [-2.0, 12], [-2.7, 38], [-12.6, 38], [-12.6, 32], [-15.0, 12], [-18, -6], [-19.2, -20]];
    const rectC = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const band = (x0, y0, x1, y1) => inset(clip(S, rectC(x0, y0, x1, y1)), S, .8);
    const loops = [-15, -5.5, 15.5].map(x => rectC(x - 1.9, -34.2, x + 1.9, -26));
    const patch = [[4.6, -30.2], [12.4, -30.2], [12.4, -25.4], [4.6, -25.4]];
    fin('gw_farmer', { hu:'Farmer', en:'pair of blue jeans laid out flat with turned-up cuffs, belt loops, a metal button and yellow stitching', tilt:TILT, shapes:[
      pth('blue', 'base', [loops[0], loops[1], loops[2]]),                                  // bújtatók (a sziluett fölé állnak)
      pth('blue', 'base', [S]),                                                             // a nadrág
      det('blue', 'light', band(-40, -40, -7.5, 40)),                                       // fény felőli fele
      det('blue', 'dark', band(7.5, -40, 40, 40)),                                          // árnyékos fele
      det('blue', 'line', band(15.5, -40, 40, 40), { o:.4 }),                               // legsötétebb élsáv
      det('blue', 'dark', band(-40, -31.5, 40, -23.6)),                                     // derékpászta
      dpth('blue', 'line', [tube([[-17.6, -23.8], [17.6, -23.8]], .9, false)], { o:.45 }),
      dpth('honey', 'base', [tube([[-17.2, -29.6], [17.2, -29.6]], .9, false), tube([[-17.2, -25.4], [17.2, -25.4]], .9, false)], { o:.95 }),   // derék-tűzés
      det('wood', 'base', patch),                                                           // bőrhatású folt
      det('wood', 'dark', [[4.6, -27.4], [12.4, -27.4], [12.4, -25.4], [4.6, -25.4]], { o:.6 }),
      det('steel', 'base', circ(0, -27.6, 2.6, 12)),                                        // fémgomb
      det('steel', 'line', circ(0, -27.6, 1.1, 8), { o:.7 }),
      dpth('honey', 'base', [tube([[2.4, -23.2], [3.6, -16], [3.0, -9.4]], .9, false),
        tube([[-17.6, -22.4], [-12.6, -18.4], [-7.6, -17.2]], .9, false), tube([[17.6, -22.4], [12.6, -18.4], [7.6, -17.2]], .9, false)], { o:.9 }),   // slicc és zsebívek
      pth('blue', 'light', [band(-40, 26.8, -1, 38.4), band(1, 26.8, 40, 38.4)]),           // felhajtott szárvégek
      dpth('blue', 'line', [tube([[-13.2, 27.1], [-2.5, 27.1]], .9, false), tube([[2.5, 27.1], [13.2, 27.1]], .9, false)], { o:.5 }),
      dpth('blue', 'line', [tube([[-12.9, 32.6], [-2.6, 32.6]], .7, false), tube([[2.6, 32.6], [12.9, 32.6]], .7, false)], { o:.3 }),
      shine([[-16.4, -20.6], [-13.6, -20.6], [-11.8, 14], [-14.4, 14]], .45),
      shine([[-11.0, 29.0], [-4.6, 29.0], [-4.6, 30.8], [-11.0, 30.8]], .4),
    ]});
  }

  // ============================================================================================
  //  6. Mosópor: 25 × 18 × 30 cm-es kartondoboz – a tetején kivágott fogantyú-nyílás, rajta pihenő
  //     adagolókanál, mellette kiszóródott por; elöl világos mező két csillanással
  // ============================================================================================
  {
    const TILT = -12, X = 12.5, Z = 9, H = 30, SX = 6.4, SZ = 3.4;
    const P = cam({ az:30, el:28, F:190, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), [SX, H + 4.0, SZ], [SX - 8.4, H + 4.6, SZ - 4.0]] });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), T = ([u, w]) => P([u, H, w]), k = P.k;
    const slot = rrect(-9.6, -6.6, -1.6, -2.4, 2.0, T);
    const ring = (y, r) => Array.from({ length:16 }, (_, i) => P([SX + r * cos(360 * i / 16), y, SZ + r * sin(360 * i / 16) * .95]));
    const cup = hull([...ring(H + .1, 3.1), ...ring(H + 4.9, 4.5)]), rim = ring(H + 4.9, 4.5), inR = ring(H + 4.6, 3.9);
    const hnd = tube(smooth([P([SX - 3.6, H + 4.4, SZ - 1.9]), P([SX - 6.8, H + 5.4, SZ - 3.6]), P([SX - 9.4, H + 4.2, SZ - 5.0])], 3), 2.0 * k, true);
    const spill = [[2.4, 7.2, 1.5], [6.2, 7.8, 1.0], [-.6, 5.2, .8], [10.6, 5.6, .9]].map(([x, z, r]) => circ(...T([x, z]), r * k, 9, r * k * .72));
    const spark = (cx, cy, r) => [[0, -1], [.24, -.24], [1, 0], [.24, .24], [0, 1], [-.24, .24], [-1, 0], [-.24, -.24]].map(([a, c]) => [cx + a * r, cy + c * r]);
    fin('gw_mosopor', { hu:'Mosópor', en:'cardboard laundry powder box with a cut-out carry handle and a measuring scoop on top', tilt:TILT, shapes:[
      face('teal', 'dark', b.right),                                                        // oldala
      det('teal', 'line', inset([P([X, 0, -Z + 1.2]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + 1.2])], b.sil), { o:.42 }),
      face('teal', 'base', b.front),                                                        // eleje
      det('teal', 'light', inset([F([-X, .3]), F([-X + 2.2, .3]), F([-X + 2.2, H]), F([-X, H])], b.sil)),
      det('cream', 'base', rrect(-9.6, 7.0, 9.6, 21.0, 1.4, F)),                            // világos mező
      dpth('white', 'light', [spark(...F([-4.6, 16.6]), 2.6 * k), spark(...F([3.0, 12.0]), 1.7 * k)], { o:.85 }),   // csillanások
      face('teal', 'light', b.top),                                                         // teteje
      det('teal', 'line', slot),                                                            // kivágott fogantyú
      det('teal', 'dark', [...rrect(-10.1, -7.1, -1.1, -1.9, 2.4, T), ...slot.slice().reverse()], { o:.55 }),
      dpth('paper', 'base', spill, { o:.9 }),                                               // kiszóródott por
      face('white', 'base', hnd),                                                           // kanál nyele
      face('white', 'base', cup),                                                           // adagolókanál
      det('white', 'light', inset(hull([...ring(H + .2, 3.1).slice(9), ...ring(H + 4.8, 4.5).slice(9)]), cup)),
      det('white', 'dark', inset(hull([...ring(H + .2, 3.1).slice(1, 7), ...ring(H + 4.8, 4.5).slice(1, 7)]), cup)),
      det('steel', 'base', rim),                                                            // kanál pereme
      det('cream', 'base', inR),                                                            // benne mosópor
      shine([T([-11.2, 3.6]), T([-7.0, 3.6]), T([-8.6, .4]), T([-12.0, .4])], .4),
      shine([F([-X + 3.0, 23.0]), F([-X + 4.2, 23.0]), F([-X + 4.2, 28.4]), F([-X + 3.0, 28.4])], .5),
    ]});
  }

  // ============================================================================================
  //  7. Növényi ital: 1 literes zabital-karton (9,5 × 6,3 × 23,5 cm) – csavaros kupak a tetőlap sarkán,
  //     ferde hegesztési gerinc, alul zsálya-mező, elöl zabkéve (szálak, szemek, két levél)
  // ============================================================================================
  {
    const TILT = -11, X = 4.75, Z = 3.15, H = 23.5, CX = 1.9, CZ = .8;
    const P = cam({ az:29, el:24, F:120, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), [CX + 1.5, H + 2.6, CZ + 1.5]] });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), k = P.k;
    const cring = (y, r) => Array.from({ length:12 }, (_, i) => P([CX + r * cos(360 * i / 12), y, CZ + r * sin(360 * i / 12)]));
    const cap = hull([...cring(H, 1.8), ...cring(H + 2.9, 1.7)]);
    const ST = [[-2.9, 15.6, -16], [0, 17.0, 0], [2.9, 15.6, 16]];
    const stalks = ST.map(([tx, ty]) => tube([F([0, 6.4]), F([tx * .45, (6.4 + ty) * .5]), F([tx, ty])], .34 * k, false));
    const grain = ST.flatMap(([tx, ty, dg]) => [.4, .58, .76, .93].flatMap(t => { const p = F([tx * t, 6.4 + (ty - 6.4) * t]);
      return [-1, 1].map(sd => place(circ(0, 0, .62 * k, 8, .3 * k), p[0] + sd * .55 * k, p[1] - .1 * k, dg + sd * 22)); }));
    const lc1 = F([-2.2, 8.0]), lc2 = F([2.3, 9.2]);
    fin('gw_novenyiital', { hu:'Növényi ital', en:'tall oat drink carton with a screw cap and a sheaf of oats pictured', tilt:TILT, shapes:[
      face('cream', 'dark', b.right),                                                       // oldala
      det('cream', 'line', inset([P([X, 0, -Z + .7]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + .7])], b.sil), { o:.42 }),
      face('cream', 'base', b.front),                                                       // eleje
      det('cream', 'light', inset([F([-X, .2]), F([-X + 1.1, .2]), F([-X + 1.1, H]), F([-X, H])], b.sil)),
      det('sage', 'base', [F([-X, 0]), F([X, 0]), F([X, 5.0]), F([-X, 5.0])]),               // zsálya-mező
      det('sage', 'dark', [P([X, 0, Z]), P([X, 0, -Z]), P([X, 5.0, -Z]), P([X, 5.0, Z])]),
      dpth('honey', 'dark', stalks, { o:.9 }),                                              // zabszálak
      pth('honey', 'base', grain),                                                          // zabszemek
      det('leaf', 'base', leafShape(lc1[0], lc1[1], 4.6 * k, 1.9 * k, -34)),                 // levelek
      det('leaf', 'base', leafShape(lc2[0], lc2[1], 4.0 * k, 1.7 * k, 30)),
      face('cream', 'light', b.top),                                                        // tetőlap
      det('cream', 'dark', [P([-X + .1, H, .3]), P([X - .1, H, .3]), P([X - .1, H, -.3]), P([-X + .1, H, -.3])], { o:.7 }),   // hegesztési gerinc
      face('white', 'base', cap),                                                           // csavaros kupak
      det('white', 'dark', inset(hull([...cring(H + .1, 1.8).slice(1, 5), ...cring(H + 2.8, 1.7).slice(1, 5)]), cap)),
      dpth('white', 'dark', [-45, -15, 15, 45].map(a => tube([P([CX + 1.75 * cos(a), H + .5, CZ + 1.75 * sin(a)]), P([CX + 1.7 * cos(a), H + 2.6, CZ + 1.7 * sin(a)])], .5, false)), { o:.5 }),
      face('white', 'light', cring(H + 2.9, 1.7)),                                          // kupak teteje
      shine([F([-3.8, 18.2]), F([-3.0, 18.2]), F([-3.0, 22.2]), F([-3.8, 22.2])], .5),
    ]});
  }

  // ============================================================================================
  //  8. Proteinszelet: 12 × 3,5 × 2,2 cm-es szelet félig kibontva – balra gyűrött fóliacsomagolás
  //     sodrott véggel és fogazott szakadási éllel, jobbra a csokis test, a végén mogyorós vágásfelület
  // ============================================================================================
  {
    const TILT = -18, BX = 8.5, BY = 2.0, BZ = 1.6, FX0 = -9.2, FX1 = -.4, FY = 2.35, FZ = 2.0;
    const P = cam({ az:32, el:26, F:80, tilt:TILT, fit:[...corners(-BX, BX, 0, BY, -BZ, BZ), ...corners(FX0, FX1, -.3, FY, -FZ, FZ), [-11.4, 1.0, 0]] });
    const bar = box(P, -BX, BX, 0, BY, -BZ, BZ), foil = box(P, FX0, FX1, -.3, FY, -FZ, FZ), k = P.k;
    const nuts = [[1.4, .7], [3.4, -.5], [5.3, .6], [7.0, -.4], [4.6, .9]].map(([x, z]) => circ(...P([x, BY, z]), .62 * k, 9, .44 * k));
    const cut = [[.6, .5], [-.45, 1.1], [.15, -.5], [-.8, -.2]].map(([y, z]) => circ(...P([BX, BY * .5 + y * .5, z]), .34 * k, 7, .3 * k));
    const zig = Array.from({ length:9 }, (_, i) => P([FX1 + (i % 2 ? .7 : -.2), FY - .08, -FZ + 2 * FZ * i / 8]));
    const twist = [P([FX0, .05, -1.3]), P([-11.4, 1.0, -.5]), P([FX0, 2.1, -1.0])];
    const twist2 = [P([FX0, .05, 1.3]), P([-11.4, 1.0, .5]), P([FX0, 2.1, 1.0])];
    fin('gw_proteinszelet', { hu:'Proteinszelet', en:'protein bar half unwrapped from foil, showing a nutty chocolate cross-section', tilt:TILT, shapes:[
      face('wood', 'light', bar.right),                                                     // vágásfelület (nugát)
      det('chocolate', 'base', [...bar.right, ...inset(bar.right, bar.sil, 1.1).slice().reverse()], { o:.95 }),   // csokibevonat pereme
      dpth('chocolate', 'dark', cut, { o:.8 }),                                             // mogyoródarabok a vágásban
      face('chocolate', 'base', bar.front),                                                 // a szelet eleje
      face('chocolate', 'light', bar.top),                                                  // teteje
      dpth('chocolate', 'dark', nuts, { o:.55 }),                                           // mogyorós dudorok
      face('steel', 'dark', twist),                                                         // sodrott fóliavég
      face('steel', 'dark', twist2),
      face('steel', 'dark', foil.right),                                                    // a bontás pereme
      face('steel', 'base', foil.front),                                                    // fólia eleje
      face('steel', 'light', foil.top),                                                     // fólia teteje
      det('steel', 'light', tube(zig, .7, false), { o:.95 }),                              // fogazott szakadási él
      dpth('steel', 'dark', [[-7.6, -6.2], [-5.4, -4.0], [-3.2, -1.8], [-1.6, -.6]].map(([a, c]) => tube([P([a, FY - .05, -FZ + .3]), P([c, FY - .05, FZ - .3])], .5, false)), { o:.45 }),   // gyűrődések
      dpth('steel', 'dark', [tube([P([FX0 + .3, .2, FZ]), P([FX1 - .3, .2, FZ])], .5, false)], { o:.4 }),
      shine([P([-7.6, FY, 1.1]), P([-3.0, FY, .9]), P([-3.2, FY, .1]), P([-7.8, FY, .3])], .6),
      shine([P([.6, BY, 1.25]), P([7.2, BY, 1.15]), P([7.2, BY, .8]), P([.6, BY, .9])], .4),
    ]});
  }

  // ============================================================================================
  //  9. Szappan: 9 × 6 × 2,8 cm-es, lekerekített szappanrúd – a tetején domború levél-préselés,
  //     derekán papírszalag (a tetőn és az elején is átfut), mellette néhány buborék
  // ============================================================================================
  {
    const TILT = -13, W = 9, D = 6, TH = 2.8, B0 = -3.8, B1 = -1.1;
    const rr = (w, d, y, r) => [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]]
      .flatMap(([x, z, a0]) => [0, 30, 60, 90].map(t => [x + r * cos(a0 + t), y, z + r * sin(a0 + t)]));
    const P = cam({ az:28, el:34, F:60, tilt:TILT, fit:[...rr(W, D, 0, 1.5), ...rr(W, D, TH, 1.5), [-8.4, TH + 3.2, 0], [7.6, TH + 4.4, 0]] });
    const top = rr(W - .7, D - .7, TH, 1.9).map(P), bot = rr(W, D, .5, 1.5).map(P), sil = hull([...top, ...bot]), k = P.k;
    const lc = P([1.3, TH, .1]);
    const lf = leafShape(lc[0], lc[1], 5.8 * k, 2.9 * k, -26);
    const ax = (t) => [lc[0] + t * k * cos(-26), lc[1] + t * k * sin(-26)];
    const bTop = [P([B0, TH, -2.6]), P([B1, TH, -2.6]), P([B1, TH, 2.62]), P([B0, TH, 2.62])];
    const bFr = [P([B0, TH, 2.62]), P([B1, TH, 2.62]), P([B1, .55, 2.97]), P([B0, .55, 2.97])];
    const bub = [[-8.2, TH + 2.6, .2, 1.35], [7.4, TH + 3.6, -.4, 1.0], [-6.2, TH + 5.0, .5, .75]].map(([x, y, z, r]) => ({ c:P([x, y, z]), r:r * k }));
    fin('gw_szappan', { hu:'Szappan', en:'bar of soap with a pressed leaf pattern, a paper band around it and a few bubbles', tilt:TILT, shapes:[
      face('grass', 'dark', sil),                                                            // a rúd oldala
      det('grass', 'base', inset(hull([...top.slice(6, 14), ...bot.slice(6, 14)]), sil), { o:.8 }),   // fény felőli oldal
      face('grass', 'light', top),                                                           // teteje
      det('grass', 'dark', lf),                                                              // préselt levél
      det('grass', 'base', clip(lf, halfPlane(ax(3.4), ax(-3.4))), { o:.85 }),                // a levél megvilágított fele
      dpth('grass', 'line', [tube([ax(-2.9), ax(2.9)], .3 * k, false),
        tube([ax(-.8), [ax(-.8)[0] + 1.5 * k * cos(36), ax(-.8)[1] + 1.5 * k * sin(36)]], .22 * k, false),
        tube([ax(.9), [ax(.9)[0] - 1.5 * k * cos(36), ax(.9)[1] - 1.5 * k * sin(36)]], .22 * k, false)], { o:.7 }),   // erezet
      pth('cream', 'base', [bTop, bFr]),                                                    // papírszalag
      det('cream', 'light', bTop),
      det('cream', 'dark', [P([B0, 1.5, 2.83]), P([B1, 1.5, 2.83]), P([B1, .55, 2.97]), P([B0, .55, 2.97])], { o:.5 }),
      dpth('cream', 'line', [tube([P([B0, TH, -2.6]), P([B0, TH, 2.62]), P([B0, .55, 2.97])], .4, false),
        tube([P([B1, TH, -2.6]), P([B1, TH, 2.62]), P([B1, .55, 2.97])], .4, false)], { o:.45 }),   // szalag széle
      pth('glass', 'light', bub.map(b => circ(b.c[0], b.c[1], b.r, 14))),                   // buborékok
      dpth('glass', 'base', bub.map(b => [...circ(b.c[0], b.c[1], b.r * .82, 10, b.r * .82, 20).slice(0, 5), ...circ(b.c[0] + b.r * .16, b.c[1] + b.r * .12, b.r * .6, 10, b.r * .6, 20).slice(0, 5).reverse()])),
      dpth('paper', 'light', bub.map(b => circ(b.c[0] - b.r * .36, b.c[1] - b.r * .36, b.r * .24, 8)), { o:.95 }),
      shine([P([-.4, TH, -2.0]), P([1.6, TH, -2.1]), P([1.4, TH, -2.6]), P([-.6, TH, -2.5])], .55),
      shine([P([-4.3, .7, 2.5]), P([-3.6, .6, 2.7]), P([-3.6, TH - .4, 2.72]), P([-4.3, TH - .3, 2.52])], .4),
    ]});
  }

  // ============================================================================================
  //  10. Mogyoróvaj: Ø 8,5 × 11 cm-es üvegtégely sötét csavaros fedéllel – a krémes tartalom a nyakig ér,
  //      látszik a felszíne, elöl két héjas földimogyoró
  // ============================================================================================
  {
    const TILT = -10, LVL = 9.6;
    const prof = [[3.9, 0], [4.25, .5], [4.25, 8.6], [3.9, 9.6], [3.4, 10.2], [3.35, 11.0], [3.7, 11.2], [3.7, 13.4]];
    const P = cam({ az:0, el:16, tilt:TILT, fit:[...corners(-4.25, 4.25, 0, 13.4, -4.25, 4.25), [-6.6, 0, 4.4], [6.8, 0, 4.4]] });
    const L = lathe(P, prof), k = P.k;
    const ribs = [-62, -30, 0, 30, 62].map(a => tube([L.on(a, 11.4), L.on(a, 13.2)], .62, false));
    const pnut = (x, z, len, deg) => { const c = P([x, .9, z]), r = len * k * .28;
      return { sil:place(envelope([circ(-len * k * .24, 0, r, 14), circ(len * k * .24, 0, r * 1.06, 14)]), c[0], c[1], deg),
        wr:place(tube([[-r * .28, -r * .95], [0, -r * .2], [-r * .2, r * .3], [0, r * .95]], r * .16, false), c[0], c[1], deg),
        lit:place(circ(-len * k * .24, -r * .34, r * .34, 8, r * .2), c[0], c[1], deg) }; };
    const PN = [pnut(-6.4, 4.6, 3.4, -14), pnut(6.2, 4.2, 3.2, 20)];
    fin('gw_mogyorovaj', { hu:'Mogyoróvaj', en:'glass peanut butter jar with a dark screw lid and two peanuts in front', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                        // üvegtégely
      det('glass', 'light', L.strip(-90, -54, LVL, 11.0)),                                  // üres nyak
      det('glass', 'dark', L.strip(36, 90, LVL, 11.0)),
      det('wood', 'base', L.strip(-90, 90, .35, LVL, 12)),                                  // mogyoróvaj
      det('wood', 'light', L.strip(-90, -52, .35, LVL)),
      det('wood', 'dark', L.strip(34, 90, .35, LVL)),
      det('wood', 'line', L.strip(72, 90, .35, LVL), { o:.4 }),                             // legsötétebb élsáv
      det('wood', 'light', L.full(L.rAt(LVL) - .3, LVL, 18), { o:.85 }),                    // a krém felszíne
      det('steel', 'base', L.strip(-90, 90, 10.2, 11.0, 10), { o:.55 }),                    // menetes nyak
      det('dark', 'base', L.strip(-90, 90, 11.0, 13.4, 12)),                                // csavaros fedél
      det('dark', 'light', L.strip(-90, -50, 11.0, 13.4)),
      det('dark', 'line', L.strip(38, 90, 11.0, 13.4), { o:.7 }),
      dpth('dark', 'line', ribs, { o:.5 }),                                                 // fedél bordái
      face('dark', 'light', L.full(3.7, 13.4, 16)),                                         // fedél teteje
      pth('cardboard', 'base', PN.map(p => p.sil)),                                         // héjas földimogyoró
      dpth('cardboard', 'dark', PN.map(p => p.wr), { o:.75 }),                              // héj-barázdák
      dpth('paper', 'light', PN.map(p => p.lit), { o:.5 }),
      shine(L.strip(-70, -60, 1.0, 9.0, 3), .5),
    ]});
  }

  // ============================================================================================
  //  11. Öblítő: 13 × 9 × 26 cm-es kanna OLDALSÓ FOGANTYÚVAL – áttetsző test, rózsaszín-lila öblítő
  //      a szintvonalig, elöl világos mező virág-motívummal, fent adagolópohár-kupak
  // ============================================================================================
  {
    const TILT = -11, X = 6.5, Z = 4.5, H = 26, LVL = 18.5, NX = -1.6;
    const HD = [[X - .6, 21.0, 0], [X + 6.2, 15.6, 0], [X - .6, 9.8, 0]];
    const P = cam({ az:26, el:20, F:150, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), ...HD, [NX + 3.1, H + 5.4, 3.1]] });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v]) => P([u, v, Z]), k = P.k;
    const hb = tube(smooth(HD.map(P), 8), 2.3 * k, false);
    const nring = (y, r) => Array.from({ length:14 }, (_, i) => P([NX + r * cos(360 * i / 14), y, r * sin(360 * i / 14)]));
    const cup = hull([...nring(H + .2, 2.4), ...nring(H + 5.0, 3.1)]);
    const fc = F([-.6, 10.6]);
    const petal = [0, 72, 144, 216, 288].map(a => place(circ(0, -2.5 * k, 1.5 * k, 10, 2.1 * k), fc[0], fc[1], a));
    fin('gw_oblito', { hu:'Öblítő', en:'fabric softener jug with a side handle, pink-lilac liquid and a measuring cap', tilt:TILT, shapes:[
      face('glass', 'dark', b.right),                                                       // oldala
      det('glass', 'line', inset([P([X, 0, -Z + .9]), P([X, 0, -Z]), P([X, H, -Z]), P([X, H, -Z + .9])], b.sil), { o:.42 }),
      face('glass', 'base', b.front),                                                       // eleje
      det('pink', 'base', [F([-X, 0]), F([X, 0]), F([X, LVL]), F([-X, LVL])]),               // rózsaszín-lila öblítő
      det('pink', 'dark', [P([X, 0, Z]), P([X, 0, -Z]), P([X, LVL, -Z]), P([X, LVL, Z])]),
      det('pink', 'light', [F([-X, LVL - 1.1]), F([X, LVL - 1.1]), F([X, LVL]), F([-X, LVL])], { o:.8 }),   // a folyadék felszíne
      det('glass', 'light', inset([F([-X, .3]), F([-X + 1.3, .3]), F([-X + 1.3, H]), F([-X, H])], b.sil)),
      face('glass', 'light', b.top),                                                        // válla
      det('cream', 'base', rrect(-4.4, 5.6, 4.4, 14.8, 1.2, F)),                            // világos mező
      pth('blossom', 'base', petal),                                                        // virág-motívum
      det('honey', 'base', circ(fc[0], fc[1], 1.25 * k, 10)),
      face('glass', 'base', hb),                                                            // oldalsó fogantyú
      det('glass', 'dark', inset(tube(smooth(HD.map(P), 8).slice(6), 2.1 * k, false), hb, .6), { o:.7 }),
      face('white', 'base', cup),                                                           // adagolópohár-kupak
      det('white', 'dark', inset(hull([...nring(H + .3, 2.4).slice(1, 6), ...nring(H + 4.9, 3.1).slice(1, 6)]), cup)),
      dpth('white', 'dark', [-50, -18, 18, 50].map(a => tube([P([NX + 2.5 * cos(a), H + .6, 2.5 * sin(a)]), P([NX + 3.0 * cos(a), H + 4.6, 3.0 * sin(a)])], .6, false)), { o:.5 }),
      face('white', 'light', nring(H + 5.0, 3.1)),                                          // kupak teteje
      det('white', 'dark', nring(H + 4.8, 2.4), { o:.55 }),                                 // a mérőpohár öble
      shine([F([-4.4, 19.4]), F([-3.4, 19.4]), F([-3.4, 24.2]), F([-4.4, 24.2])], .55),
    ]});
  }

  // ============================================================================================
  //  12. Hamburger: szezámmagos zsemlében húspogácsa, sajt, paradicsom és saláta, alatta papírtálca.
  //      Oldalnézet: minden réteg kilóg az alatta lévő alól – a legjellegzetesebb a domború, magos felső zsemle
  // ============================================================================================
  {
    const TILT = -6;
    const wrap = [[-44, 19], [-36, 11], [-25, 16], [-10, 11], [10, 12], [26, 15], [38, 10], [46, 20], [38, 27], [-38, 27]];
    const bun = [[-26, -10], [-24.5, -20], [-17, -28.5], [-5, -32], [8, -30.5], [19, -25], [25, -16], [26, -10]];
    const lett = [[-32, -12.6], [32, -12.6], [32, -6.4], [25, -4.4], [18, -7.0], [10, -4.0], [1, -6.8], [-8, -3.8], [-17, -6.6], [-25, -4.2], [-32, -6.6]];
    const tom = [[-28, -6.6], [28, -6.6], [30.4, -4.8], [30.4, -1.6], [28, .4], [-28, .4], [-30.4, -1.6], [-30.4, -4.8]];
    const cheese = [[-30, -1.6], [30, -1.6], [30, 3.6], [24, 3.4], [19.5, 10.6], [15, 3.2], [-14, 3.4], [-18.5, 10.8], [-23, 3.1], [-30, 3.4]];
    const patty = [[-29, 3.4], [-23, 1.0], [-8, 2.0], [10, .6], [26, 1.8], [29.5, 4.6], [28, 13.2], [-28, 13.2]];
    const bot = [[-26, 11.8], [26, 11.8], [24.5, 20], [18, 23.5], [-18, 23.5], [-24.5, 20]];
    const sesame = [[-17, -23.5], [-6, -27.0], [5, -25.6], [14, -20.6], [-21.5, -16.6], [1, -19.6], [19, -14.2]]
      .map(([x, y], i) => place(circ(0, 0, 2.4, 8, 1.35), x, y, [-22, 8, -14, 26, -40, 10, 40][i]));
    fin('gw_hamburger', { hu:'Hamburger', en:'burger in a sesame seed bun with patty, cheese, tomato and lettuce on a paper wrapper', tilt:TILT, shapes:[
      face('cream', 'base', wrap),                                                          // papírtálca
      dpth('cream', 'dark', [tube([[-32, 13.5], [-21, 18.5], [-3, 14.5]], .9, false), tube([[15, 15.0], [29, 18.0], [38, 13.5]], .9, false)], { o:.5 }),
      face('wood', 'base', bot),                                                            // alsó zsemle
      det('wood', 'light', [[-24, 13.0], [-3, 13.0], [-5, 16.4], [-23, 16.8]], { o:.6 }),
      face('chocolate', 'base', patty),                                                     // húspogácsa
      det('chocolate', 'light', [[-27, 3.2], [-8, 2.2], [10, .9], [25, 2.0], [25, 4.6], [10, 3.4], [-8, 4.6], [-27, 5.4]], { o:.5 }),
      dpth('chocolate', 'dark', [[-18, 9.4, 2.2], [-2, 10.2, 1.8], [14, 9.2, 2.0], [22, 10.4, 1.4]].map(([x, y, r]) => circ(x, y, r, 8, r * .6)), { o:.5 }),
      face('gold', 'base', cheese),                                                         // sajt
      det('gold', 'light', [[-28, -.8], [28, -.8], [28, 1.0], [-28, 1.0]], { o:.7 }),
      face('tomato', 'base', tom),                                                          // paradicsomszelet
      det('tomato', 'light', [[-25, -4.8], [25, -4.8], [25, -1.8], [-25, -1.8]], { o:.6 }),
      dpth('tomato', 'dark', [[-16, -3.2, 2.2], [4, -3.4, 2.0], [17, -3.0, 1.8]].map(([x, y, r]) => circ(x, y, r, 8, r * .5)), { o:.45 }),
      face('leaf', 'base', lett),                                                           // saláta
      det('leaf', 'light', [[-30, -11.6], [30, -11.6], [30, -9.2], [-30, -9.2]], { o:.5 }),
      face('wood', 'base', bun),                                                            // felső zsemle
      det('wood', 'light', inset([[-23, -12.4], [-20.5, -21.4], [-13, -27.0], [-2, -29.8], [-4, -24.6], [-12, -20.2], [-17, -12.2]], bun, .9), { o:.7 }),
      det('wood', 'dark', inset([[16, -25.4], [23, -17.6], [25, -10.2], [16.5, -10.2], [15, -16.8], [9.5, -22.6]], bun, .9), { o:.5 }),
      pth('cream', 'base', sesame),                                                         // szezámmagok
      shine([[-19, -24.6], [-9, -27.6], [-8, -25.2], [-18, -22.4]], .5),
    ]});
  }

  // ============================================================================================
  //  13. Chipses zacskó: felfújt fóliazacskó – fent és lent fogazott hegesztés, középen világos mező
  //      két rajzolt chipsszel, erős fém-csillanás; elöl két kiszóródott chips
  // ============================================================================================
  {
    const TILT = -10, HB = 16.5, SEAL = 3.4;
    const rgt = Array.from({ length:11 }, (_, i) => { const t = i / 10; return [8.6 + 6.4 * sin(180 * t), -HB + 2 * HB * t]; });
    const body = [...rgt, ...rgt.slice().reverse().map(([x, y]) => [-x, y])];
    const seal = sg => { const n = 9, y0 = sg * (HB + SEAL), y1 = sg * (HB - .5);
      const zz = Array.from({ length:n }, (_, i) => [-9.4 + 18.8 * i / (n - 1), i % 2 ? y0 : y0 + (y1 - y0) * .34]);
      return sg > 0 ? [...zz, [9.4, y1], [-9.4, y1]] : [[-9.4, y1], [9.4, y1], ...zz.slice().reverse()]; };
    const crimp = (y0, y1) => Array.from({ length:7 }, (_, i) => tube([[-7.8 + 15.6 * i / 6, y0], [-7.8 + 15.6 * i / 6, y1]], .85, false));
    const chip = (cx, cy, r, deg) => place(simplify(smooth([[-r, -r * .5], [-r * .25, -r * .88], [r * .55, -r * .55], [r, .05 * r], [r * .3, r * .82], [-r * .5, r * .72]], 3), .3), cx, cy, deg);
    const IN = [chip(-3.6, -.8, 4.4, 12), chip(3.4, 3.0, 3.8, -26)];
    const OUT = [chip(-9.6, 19.4, 5.6, 16), chip(6.4, 21.0, 5.0, -20)];
    fin('gw_chips', { hu:'Chipses zacskó', en:'puffed shiny foil bag of crisps with crimped seals and two crisps spilled in front', tilt:TILT, shapes:[
      face('red', 'base', body),                                                            // felfújt zacskó
      det('red', 'light', inset(clip(body, [[-40, -40], [-5.5, -40], [-5.5, 40], [-40, 40]]), body, .9)),   // fény felőli oldal
      det('red', 'dark', inset(clip(body, [[6.5, -40], [40, -40], [40, 40], [6.5, 40]]), body, .9)),
      det('red', 'line', inset(clip(body, [[11.8, -40], [40, -40], [40, 40], [11.8, 40]]), body, .9), { o:.45 }),
      det('cream', 'base', circ(0, 1.0, 9.4, 18, 7.2)),                                     // világos mező
      pth('honey', 'base', IN),                                                             // rajzolt chipsek a zacskón
      dpth('honey', 'dark', [tube([[-7.2, -1.6], [-3.8, .2], [-.2, -1.8]], .7, false), tube([[.6, 2.4], [3.6, 4.2], [6.4, 2.2]], .6, false)], { o:.6 }),
      face('red', 'dark', seal(-1)),                                                        // felső hegesztés
      face('red', 'dark', seal(1)),                                                         // alsó hegesztés
      dpth('red', 'line', crimp(-HB - 2.8, -HB + .1), { o:.45 }),                           // fogazás
      dpth('red', 'line', crimp(HB - .1, HB + 2.8), { o:.45 }),
      pth('honey', 'base', OUT),                                                            // kiszóródott chipsek
      dpth('honey', 'dark', [tube([[-13.4, 18.6], [-9.6, 20.6], [-5.8, 18.4]], .8, false), tube([[2.8, 20.4], [6.4, 22.4], [10.0, 20.2]], .7, false)], { o:.6 }),
      dpth('paper', 'light', [circ(-11.6, 17.6, 1.9, 8, 1.0), circ(4.6, 19.4, 1.6, 8, .9)], { o:.5 }),
      shine([[-6.4, -12.0], [-3.2, -12.0], [-4.8, -6.0], [-8.0, -6.0]], .55),
      shine([[-9.8, -4.0], [-7.4, -4.0], [-9.0, 8.0], [-11.4, 8.0]], .45),
      shine([[7.6, -8.5], [9.6, -8.5], [10.8, 6.0], [8.8, 6.0]], .3),
    ]});
  }

  // ============================================================================================
  //  14. Gyümölcstálca: 18 × 13 × 7 cm-es átlátszó műanyag tálcában eper, a tetején fólia félig
  //      visszahajtva – a hajtás felkunkorodik, alatta látszanak a szemek
  // ============================================================================================
  {
    const TILT = -12, W = 18, D = 13, HT = 7;
    const P = cam({ az:26, el:32, F:90, tilt:TILT, fit:[[-W / 2, 0, -D / 2], [W / 2, 0, D / 2], [-W / 2, HT + 4, -D / 2], [W / 2, HT + 4, D / 2], [W / 2 + 2, HT + 7, D / 2 + 2]] });
    const T = tray(P, W, D, HT, 1.5, 1.8), k = P.k;
    const berry = (x, z, s, deg) => { const c = P([x, HT + .2, z]), r = s * k;
      return { sil:place(simplify(smooth([[0, -1.12 * r], [.74 * r, -.62 * r], [.94 * r, .16 * r], [.5 * r, .94 * r], [0, 1.2 * r], [-.5 * r, .94 * r], [-.94 * r, .16 * r], [-.74 * r, -.62 * r]], 3), .4), c[0], c[1], deg),
        dk:place(simplify(smooth([[.3 * r, -.94 * r], [.9 * r, -.2 * r], [.5 * r, .92 * r], [0, 1.18 * r], [.2 * r, .5 * r], [.42 * r, -.3 * r]], 2), .4), c[0], c[1], deg),
        seed:[[-.34, -.46], [.32, -.4], [.4, .2], [-.4, .24], [.02, .58]].map(([a, b]) => place(circ(a * r, b * r, .11 * r, 5, .15 * r), c[0], c[1], deg)),
        cal:[-40, 0, 40].map(a => place(simplify(leafShape(0, -1.02 * r, .8 * r, .36 * r, a - 90), .35), c[0], c[1], deg)) }; };
    const B = [berry(-5.6, 3.0, 2.7, -14), berry(1.2, 3.8, 2.9, 12), berry(6.2, .6, 2.6, -26), berry(-2.0, -1.8, 2.5, 22)];
    const film = [P([-W / 2 + .8, HT + .4, -D / 2 + .7]), P([W / 2 - .8, HT + .4, -D / 2 + .7]), P([W / 2 - .8, HT + .4, -1.6]), P([-W / 2 + .8, HT + .4, -1.6])];
    const curl = [P([.6, HT + .4, -1.6]), P([W / 2 - .8, HT + .4, -1.6]), P([W / 2 - .9, HT + 2.3, -3.6]), P([.7, HT + 2.3, -3.6])];
    fin('gw_gyumolcstalca', { hu:'Gyümölcstálca', en:'clear plastic punnet of strawberries with a film lid partly peeled back', tilt:TILT, shapes:[
      face('glass', 'base', T.sil),                                                         // átlátszó tálca
      det('glass', 'dark', T.right),                                                        // árnyékos oldala
      det('glass', 'light', T.floor, { o:.8 }),                                             // alja
      det('glass', 'light', T.rim, { o:.7 }),                                               // pereme
      pth('red', 'base', B.map(b => b.sil)),                                                // eper
      dpth('red', 'dark', B.map(b => b.dk), { o:.55 }),
      dpth('honey', 'light', B.flatMap(b => b.seed), { o:.85 }),                            // magok
      pth('leaf', 'base', B.flatMap(b => b.cal)),                                           // kocsányok
      dpth('paper', 'light', B.map(b => circ(b.sil[0][0] - 1.0 * k, b.sil[0][1] + 1.4 * k, .55 * k, 8, .38 * k)), { o:.45 }),
      det('glass', 'light', film, { o:.42 }),                                               // rásimuló fólia
      dpth('glass', 'dark', [tube([film[3], film[0], film[1], film[2]], .45, false)], { o:.35 }),
      face('glass', 'light', curl, { o:.82 }),                                              // visszahajtott fóliasarok
      det('glass', 'base', [curl[3], curl[2], P([W / 2 - 1.0, HT + 3.0, -3.0]), P([.8, HT + 3.0, -3.0])], { o:.75 }),
      dpth('glass', 'dark', [tube([curl[3], curl[2]], .5, false), tube([curl[0], curl[3]], .45, false)], { o:.5 }),
      shine([P([-7.4, HT + .45, -4.4]), P([-2.6, HT + .45, -4.8]), P([-3.0, HT + .45, -5.6]), P([-7.8, HT + .45, -5.2])], .45),
      shine([P([-W / 2 + .4, 1.2, D / 2 - .6]), P([-W / 2 + 1.4, 1.0, D / 2 - .4]), P([-W / 2 + 1.4, HT - 1.2, D / 2 - .4]), P([-W / 2 + .4, HT - 1.0, D / 2 - .6])], .4),
    ]});
  }
})();
