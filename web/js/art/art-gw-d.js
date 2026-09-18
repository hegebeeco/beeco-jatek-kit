// ============================================================
//  Matricák — Greenwashing-vadász (Ítéld el!) termékei, 4. csoport (gw_ + azonosító), B szint (docs/rajzolas.md)
//  törölköző · rágógumi · csokoládé · hűtőszekrény · ablaktisztító · dezodor · repülőjegy · naptej · monitor ·
//  halas fogás · rúzs · keksz · túrahátizsák · sportdzseki · általános tisztítószer.
//  Csak a termék: szöveg, márka, logó nélkül (a hamis márkát és az öko-pecsétet a HTML adja).
//  Valódi méretből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A kész rajzot a fin() illeszti a vászonra (perem + árnyék mellett is befér) – minta: csoport1–3/matrica.js
//  Render: node tools/art-render.js 2d <ez a fájl> ki.png
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
  function cam(o){ const P = camera(Object.assign({ span:80 }, o)), a = rad(o.az || 0), e = rad(o.el || 0);
    P.V = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; return P; }
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

  const LIGHT = norm([-0.5, 0.65, 0.55]);                 // fény: bal-fent-elöl (X jobbra, Y fel, Z a néző felé)
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const toneOf = n => { const s = dot(norm(n), LIGHT); return s > .6 ? 'light' : s > .15 ? 'base' : s > -.52 ? 'dark' : 'line'; };
  // kihúzott profil (x, y sík, z0…z1 mélység): front = elülső lap · tone(t) = az adott tónusú oldallapok · sil = körvonal
  function extrude(P, prof0, z0, z1){
    const prof = area(prof0) > 0 ? prof0 : [...prof0].reverse(), n = prof.length, front = prof.map(([x, y]) => P([x, y, z1])), sides = [];
    for(let i = 0; i < n; i++){ const a = prof[i], b = prof[(i + 1) % n], nn = norm([b[1] - a[1], a[0] - b[0], 0]);
      if(dot(nn, P.V) > .02) sides.push({ pts:[P([a[0], a[1], z1]), P([b[0], b[1], z1]), P([b[0], b[1], z0]), P([a[0], a[1], z0])], tone:toneOf(nn) }); }
    return { front, sides, tone:t => sides.filter(s => s.tone === t).map(s => s.pts), sil:envelope([front, ...sides.map(s => s.pts)], .5) };
  }
  // levél-forma pontjai (tő, irány fokban, hossz, szélesség)
  const leafPts = (x, y, deg, len, wid) => { const dx = cos(deg), dy = sin(deg), h = wid / 2;
    return Array.from({ length:13 }, (_, i) => { const t = i / 6, u = t <= 1 ? t : 2 - t, s = t <= 1 ? 1 : -1;
      return [x + dx * len * u - dy * s * h * Math.sin(Math.PI * u), y + dy * len * u + dx * s * h * Math.sin(Math.PI * u)]; }); };
  const star4 = (cx, cy, R) => Array.from({ length:8 }, (_, i) => { const a = 90 - i * 45, r = i % 2 ? R * .3 : R; return [cx + r * cos(a), cy + r * sin(a)]; });

  // ---------------- alakzat-gyártók ----------------
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts }, o);                    // fő lap: kontúr + fehér perem
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts }, o);  // tónus-lap / dísz
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, polys }, o);                 // több részből álló fő lap
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, polys }, o);
  const shine = (pts, o = .6) => det('paper', 'light', pts, { o });
  const lin = (m, tone, pts, w, o) => Object.assign({ t:'line', m, tone, pts, w }, o);               // vékony vonal
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
  //  1. Törölköző – három összehajtott frottír fürdőlepedő egymáson: lekerekített puha élek,
  //     világos szőtt bordűr-sáv, bolyhos felső lap, pasztell színek
  // ============================================================================================
  {
    const TILT = -12, W = 15, D = 11, T = 4.4, R = 1.7;
    const cl = [{ m:'sage', cx:0 }, { m:'sky', cx:1.2 }, { m:'blossom', cx:-.8 }];
    const prof = (cx, y0) => rrect(cx - W, y0 + .1, cx + W, y0 + T - .1, R);
    const P = cam({ az:24, el:34, F:150, tilt:TILT, fit:cl.flatMap((c, i) => corners(c.cx - W, c.cx + W, i * T, (i + 1) * T, -D, D)) });
    const E = cl.map((c, i) => extrude(P, prof(c.cx, i * T), -D, D));
    const top = cl[2], TY = 3 * T - .1;
    const bord = cl.map((c, i) => [[-W + .6, i * T + T * .30], [W - .6, i * T + T * .30], [W - .6, i * T + T * .66], [-W + .6, i * T + T * .66]]
      .map(([x, y]) => P([c.cx + x, y, D])));
    const bordTop = [[-W + 1.4, -3.4], [W - 1.4, -3.4], [W - 1.4, .6], [-W + 1.4, .6]].map(([x, z]) => P([top.cx + x, TY, z]));
    const loops = [];                                                   // frottír bolyhok a felső lapon
    for(let r = 0; r < 5; r++) for(let j = 0; j < 8; j++)
      loops.push(circ(...P([top.cx - 12.6 + j * 3.6 + (r % 2 ? 1.8 : 0), TY, -8 + r * 4]), .62 * P.k, 7, .42 * P.k));
    const hem = Array.from({ length:9 }, (_, i) => tube([P([top.cx - 12.4 + i * 3.1, TY, D - 1.5]), P([top.cx - 10.9 + i * 3.1, TY, D - 1.5])], .34 * P.k, false));
    fin('gw_torolkozo', { hu:'Törölköző', en:'stack of three folded pastel bath towels with a woven border band', tilt:TILT, shapes:[
      pth('sage', 'base', [E[0].sil]),                                  // alsó (zsálya) törölköző
      dpth('sage', 'dark', E[0].tone('dark')),
      pth('sky', 'base', [E[1].sil]),                                   // középső (égkék)
      dpth('sky', 'dark', E[1].tone('dark')),
      pth('blossom', 'base', [E[2].sil]),                               // felső (rózsa)
      dpth('blossom', 'dark', E[2].tone('dark')),
      dpth('blossom', 'light', E[2].tone('light')),                     // a felső törölköző lapja
      dpth('white', 'base', bord, { o:.9 }),                            // világos szőtt bordűr elöl
      dpth('white', 'base', [bordTop], { o:.78 }),                       // a bordűr a tetején is átfut
      dpth('blossom', 'dark', loops, { o:.46 }),                        // frottír bolyhok
      dpth('blossom', 'dark', hem, { o:.5 }),                           // szegés-öltések
      dpth('dark', 'base', cl.map((c, i) => tube([P([c.cx - W + R, i * T + .15, D]), P([c.cx + W - R, i * T + .15, D])], .34 * P.k, false)), { o:.2 }),   // a rétegek közötti rés
      shine([P([top.cx - 11.4, TY, -7]), P([top.cx - 8.6, TY, -7.6]), P([top.cx - 5.6, TY, 6.4]), P([top.cx - 8.4, TY, 7])], .35),
    ] });
  }

  // ============================================================================================
  //  2. Rágógumi – kartonhüvelyes buborékcsomag: bevont drazsék a fólia alatt, egy szem kiesve elöl
  // ============================================================================================
  {
    const TILT = -14, W = 3.6, D = 1.35, H = .8, PW = 1.2, PD = .82, PH = .88;
    const LX = 1.2, LZ = D + 2.3;
    const P = cam({ az:26, el:46, F:130, tilt:TILT, fit:[...corners(-W, W, 0, H + PH, -D, D), [LX - 1.6, 0, LZ + 1.2], [LX + 1.6, 0, LZ + 1.2]] });
    const b = box(P, -W, W, 0, H, -D, D), T = (x, z) => P([x, H, z]);
    const cap = (cx, cz, y, k = 1) => rrect(cx - PW * k, cz - PD * k, cx + PW * k, cz + PD * k, .46 * k, ([u, v]) => P([u, y, v]), 3);
    const xs = [-2.55, -.85, .85, 2.55];
    const pill = xs.map(x => cap(x, 0, H + PH, .86)), root = xs.map(x => cap(x, 0, H + .04));
    const body = xs.map((x, i) => hull([...root[i], ...pill[i]]));
    const lo = box(P, LX - PW, LX + PW, 0, PH, LZ - PD, LZ + PD);
    fin('gw_ragogumi', { hu:'Rágógumi', en:'blister strip of coated chewing gum pellets in a small carton sleeve, one pellet out', tilt:TILT, shapes:[
      face('teal', 'dark', b.right),                                    // kartonhüvely oldala
      face('teal', 'base', b.front),                                    // a hüvely eleje
      det('teal', 'line', inset([P([-W, 0, D]), P([W, 0, D]), P([W, .28, D]), P([-W, .28, D])], b.sil, .35), { o:.45 }),   // legsötétebb élsáv
      face('paper', 'light', b.top),                                    // a hüvely teteje (a fólia alapja)
      pth('white', 'base', body),                                       // bevont drazsék (oldal)
      dpth('white', 'dark', body.map(p => p.slice(0, Math.ceil(p.length / 2))), { o:.6 }),
      dpth('white', 'light', pill),                                     // a drazsék világos teteje
      dpth('glass', 'base', xs.map(x => cap(x, 0, H + PH + .06, 1.16)), { o:.22 }),   // az áttetsző buborékfólia pereme
      dpth('glass', 'line', xs.map(x => tube([...cap(x, 0, H + PH + .06, 1.16), cap(x, 0, H + PH + .06, 1.16)[0]], .16 * P.k, false)), { o:.35 }),
      dpth('teal', 'dark', [tube([T(-W + .25, -D + .32), T(W - .25, -D + .32)], .3 * P.k, false),
        tube([T(-W + .25, D - .32), T(W - .25, D - .32)], .3 * P.k, false)], { o:.5 }),   // a fólia hegesztett pereme
      face('white', 'dark', lo.right),                                  // kiesett drazsé
      face('white', 'base', lo.front),
      face('white', 'light', cap(LX, LZ, PH)),
      shine([T(-2.9, -.55), T(-2.3, -.85), T(3.0, -.85), T(3.0, -.3)], .3),
    ] });
  }

  // ============================================================================================
  //  3. Csokoládé – félig kicsomagolt tábla: ezüstfólia a bal felén, öntött kockák, egy kocka letörve
  // ============================================================================================
  {
    const TILT = -10, X = 8, Z = 4, H = .9, FY = H + .12, GX = -1.5;
    const P = cam({ az:24, el:42, F:200, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), [-13.2, 0, 5.6], [-13.4, 0, -5.0], [3.4, 0, Z + 5.2]] });
    const b = box(P, -X, X, 0, H, -Z, Z), T = (x, z) => P([x, H + .02, z]);
    const jag = Array.from({ length:9 }, (_, i) => P([(i % 2 ? GX + .5 : GX - .5), FY, Z - i]));   // szakadt fólia-él
    const wave = Array.from({ length:7 }, (_, i) => P([-13.4 + .5 * Math.sin(i * 1.7), .08, -4.6 + 1.7 * i]));
    const foil = [...jag, P([-X, FY, -Z]), P([-10.2, .7, -4.6]), ...wave, P([-10.0, .72, 5.0]), P([-X, FY, Z])];
    const cols = [GX, GX + 2.4, GX + 4.8, GX + 7.2, X], rows = [-Z, 0, Z];
    const grid = [...cols.slice(1, -1).map(x => tube([T(x, -Z), T(x, Z)], .34 * P.k, false)), tube([T(GX, 0), T(X, 0)], .34 * P.k, false)];
    const gap = [T(cols[3], 0), T(X, 0), T(X, Z), T(cols[3], Z)];                                  // a letört kocka helye
    const tiles = [0, 1, 2].flatMap(i => [[cols[i] + .35, -Z + .35, cols[i + 1] - .35, -.3], [cols[i] + .35, .3, cols[i + 1] - .35, Z - .35]])
      .concat([[cols[3] + .35, -Z + .35, X - .35, -.3]]).map(([a, c, d, e]) => [T(a, c), T(d, c), T(d, e), T(a, e)]);
    const BR = 1.3, BX = 4.4, BZ = Z + 3.0, br = box(P, BX - BR, BX + BR, 0, .9, BZ - BR, BZ + BR);
    fin('gw_csokolade', { hu:'Csokoládé', en:'chocolate bar half unwrapped in foil with moulded squares and one square broken off', tilt:TILT, shapes:[
      face('chocolate', 'dark', b.right),                                // a tábla oldala
      face('chocolate', 'base', b.front),                                // a tábla eleje
      face('chocolate', 'light', b.top),                                 // a tábla öntött lapja
      dpth('chocolate', 'base', tiles, { o:.55 }),                       // a kockák enyhén domború lapja
      dpth('chocolate', 'dark', grid, { o:.85 }),                        // az öntött hornyok
      det('chocolate', 'line', gap, { o:.75 }),                          // a letört kocka üres helye
      face('steel', 'base', foil),                                       // ezüstfólia
      dpth('steel', 'light', [[P([-X + .4, FY, Z - .6]), P([GX - 1.4, FY, Z - .6]), P([GX - 1.6, FY, .8]), P([-X + .4, FY, .6])],
        [P([-12.6, .1, 3.6]), P([-10.4, .68, 4.2]), P([-10.6, .68, -.4]), P([-12.8, .1, -.8])]], { o:.85 }),   // fény a fólián
      dpth('steel', 'dark', [tube([P([-X, FY, Z - .2]), P([-X, FY, -Z + .2])], .4 * P.k, false),
        tube([P([-11.6, .4, 4.6]), P([-11.2, .42, -3.4])], .34 * P.k, false),
        tube([P([-12.8, .12, 1.4]), P([-10.2, .7, 2.2])], .3 * P.k, false)], { o:.6 }),   // fólia-gyűrődések és a hajtás éle
      face('chocolate', 'dark', br.right),                               // a letört kocka
      face('chocolate', 'base', br.front),
      face('chocolate', 'light', br.top),
      shine([T(-.4, -3.2), T(1.2, -3.4), T(1.6, -1.2), T(0, -1.0)], .3),
    ] });
  }

  // ============================================================================================
  //  4. Hűtőszekrény – kétajtós, alul fagyasztós hűtő 3/4-es nézetben: vékony fogantyúk, üres energiacímke
  // ============================================================================================
  {
    const TILT = -12, X = 34, Z = 30, H = 158, SP = 56, IN = 1.8;
    const P = cam({ az:27, el:13, F:420, tilt:TILT, fit:corners(-X, X, 0, H, -Z, Z) });
    const b = box(P, -X, X, 0, H, -Z, Z), F = (x, y) => P([x, y, Z]);
    const door = (y0, y1) => [F(-X + IN, y0 + IN), F(X - IN, y0 + IN), F(X - IN, y1 - IN), F(-X + IN, y1 - IN)];
    const hand = (y0, y1) => tube([F(-X + 8, y0), F(-X + 8, y1)], 3.0 * P.k, true);
    const lab = rrect(8, 92, 25, 132, 1.8, ([u, v]) => F(u, v));
    const bars = [[10.5, 100, 16.4], [10.5, 108, 19.6], [10.5, 116, 17.4], [10.5, 124, 21.4]].map(([x0, y, x1]) => tube([F(x0, y), F(x1, y)], 2.4 * P.k, false));
    fin('gw_hutoszekreny', { hu:'Hűtőszekrény', en:'modern two-door fridge freezer in three-quarter view with thin handles and a blank energy label', tilt:TILT, shapes:[
      face('steel', 'dark', b.right),                                    // a hűtő oldala
      face('steel', 'base', b.front),                                    // a hűtő eleje
      face('steel', 'light', b.top),                                     // a teteje
      det('steel', 'light', door(SP + 2.4, H), { o:.75 }),                 // felső (hűtő) ajtó
      det('steel', 'light', door(6.5, SP - 2.4), { o:.55 }),                 // alsó (fagyasztó) ajtó
      det('steel', 'line', [F(-X, SP - 2.4), F(X, SP - 2.4), F(X, SP + 2.4), F(-X, SP + 2.4)], { o:.85 }),   // az ajtók közötti rés
      det('dark', 'base', [F(-X, 0), F(X, 0), F(X, 6.5), F(-X, 6.5)], { o:.5 }),   // lábazat
      det('steel', 'line', inset([P([X, 0, -Z]), P([X, 0, -Z + 4]), P([X, H, -Z + 4]), P([X, H, -Z])], b.sil, .8), { o:.45 }),   // legsötétebb élsáv
      pth('steel', 'dark', [hand(86, 140), hand(14, 44)]),               // fogantyúk
      dpth('white', 'light', [tube([F(-X + 7.1, 88), F(-X + 7.1, 138)], 1.0 * P.k, false),
        tube([F(-X + 7.1, 16), F(-X + 7.1, 42)], 1.0 * P.k, false)], { o:.8 }),   // csillanás a fogantyúkon
      det('cream', 'base', lab),                                         // üres energiacímke
      dpth('leaf', 'base', bars.slice(0, 2), { o:.95 }),                 // színsávok a címkén
      dpth('honey', 'base', bars.slice(2), { o:.95 }),
      shine([F(-23, 14), F(-17.5, 14), F(-17.5, 144), F(-23, 144)], .3),
    ] });
  }

  // ============================================================================================
  //  5. Ablaktisztító – pisztolyos szórófejes flakon világoskék folyadékkal, mellette nekitámasztott ablaklehúzó
  // ============================================================================================
  {
    const TILT = 10, EZ = .6, LVL = 12.4, NK = 19.2;
    const prof = [[3.8, 0], [4.2, .5], [4.3, 1.6], [4.25, 7.2], [3.5, 9.6], [3.7, 11.2], [4.25, 13.4], [4.0, 15.8], [3.0, 17.6], [1.75, 18.8], [1.7, NK]];
    const head = [[-7.0, 22.2], [-6.4, 20.6], [-2.4, 19.8], [1.7, 19.6], [2.5, 20.7], [2.7, 24.8], [1.4, 25.4], [-5.6, 25.2], [-7.1, 24.4]];
    const trig = [[-2.0, 21.2], [-5.0, 21.0], [-5.3, 17.0], [-4.2, 15.8], [-3.0, 16.3], [-3.2, 19.9], [-2.0, 20.1]];
    const noz = [[-9.6, 22.5], [-7.0, 22.7], [-7.0, 24.1], [-9.6, 23.9]];
    const A = [-13.4, 5.6], Bp = [-17.8, 23.0], dh = [(Bp[0] - A[0]) / 18.2, (Bp[1] - A[1]) / 18.2], pd = [-dh[1], dh[0]];
    const hd = (t, s) => [A[0] + dh[0] * t + pd[0] * s, A[1] + dh[1] * t + pd[1] * s];
    const P = cam({ az:14, el:16, F:150, tilt:TILT, fit:[...Array.from({ length:12 }, (_, i) => [4.3 * sin(i * 30), 0, 4.3 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .4, NK, z * .4]]),
      [2.7, 25.4, 0], [-9.6, 15.8, 0], [...hd(0, -5.4), 0], [...hd(0, 5.0), 0], [...hd(19.4, 0), 0]] });
    const L = lathe(P, prof, EZ), k = P.k;
    const E = extrude(P, head, -1.6, 1.6), N = extrude(P, noz, -1.0, 1.0), cl = lathe(P, [[2.0, 18.0], [2.0, 19.6]], EZ);
    const Q = (t, s) => P([...hd(t, s), 0]);
    const blade = [Q(-1.5, -5.2), Q(-1.5, 4.8), Q(-2.9, 4.8), Q(-2.9, -5.2)];
    const headBar = [Q(-1.4, -5.6), Q(-1.4, 5.2), Q(1.6, 5.2), Q(1.6, -5.6)];
    const handle = [Q(1.4, -1.0), Q(1.4, 1.0), Q(18.8, .85), Q(18.8, -.85)];
    fin('gw_ablaktisztito', { hu:'Ablaktisztító', en:'trigger spray bottle with light blue window cleaner and a small squeegee leaning on it', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                     // áttetsző flakon
      det('glass', 'dark', L.strip(34, 88, LVL, 17.6)),
      det('sky', 'base', L.strip(-88, 88, .5, LVL, 12)),                 // világoskék tisztítószer
      det('sky', 'light', L.strip(-88, -50, .5, LVL)),
      det('sky', 'dark', L.strip(34, 88, .5, LVL)),
      det('sky', 'line', L.strip(70, 88, .5, LVL), { o:.35 }),           // legsötétebb élsáv
      det('sky', 'light', L.full(L.rAt(LVL) - .25, LVL, 18), { o:.9 }),  // a folyadék felszíne
      lin('glass', 'line', [P([.2, 1.4, 0]), P([.2, 17.4, 0])], .5 * k, { o:.5 }),   // felszívó cső
      face('white', 'base', cl.sil),                                     // gallér
      pth('white', 'base', [E.sil]),                                     // szórófej
      dpth('white', 'light', E.tone('light')),
      dpth('white', 'dark', [...E.tone('dark'), ...E.tone('line')]),
      face('sky', 'dark', trig.map(([x, y]) => P([x, y, 1.1]))),         // ravasz
      pth('sky', 'dark', [N.sil]),                                       // fúvóka
      face('steel', 'base', headBar),                                    // az ablaklehúzó feje
      face('dark', 'base', blade),                                       // gumiél
      face('steel', 'base', handle),                                     // nyél
      det('sky', 'base', [Q(10.4, -.9), Q(10.4, .9), Q(17.6, .8), Q(17.6, -.8)], { o:.95 }),   // színes markolat
      shine([L.on(-66, 2.0), L.on(-58, 2.0), L.on(-58, 14.6), L.on(-66, 14.6)], .55),
    ] });
  }

  // ============================================================================================
  //  6. Dezodor spray – ezüst-kék aeroszolos flakon domború kupakkal (a kupak fent van), finom permetfelhővel
  // ============================================================================================
  {
    const TILT = 10, EZ = .95, TOP = 10.6, CAP = 15.4;
    const prof = [[2.8, 0], [3.2, .4], [3.25, 1.1], [3.2, 8.8], [2.9, 9.9], [3.15, 10.2], [3.15, TOP]];
    const capP = [[3.25, TOP], [3.3, TOP + .4], [3.3, CAP - 2.0], [3.1, CAP - 1.1], [2.3, CAP - .35], [1.3, CAP]];
    const P = cam({ az:0, el:17, F:120, tilt:TILT, fit:Array.from({ length:12 }, (_, i) => [3.3 * sin(i * 30), 0, 3.3 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .4, CAP, z * .4]])
      .concat([[-7.0, CAP - 3.0, 0], [-2.2, CAP, 0]]) });
    const L = lathe(P, prof, EZ), C = lathe(P, capP, EZ), k = P.k;
    const drop = [[0, 7.0], [24, 6.0], [28, 4.6], [16, 3.6], [0, 3.3], [-16, 3.6], [-28, 4.6], [-24, 6.0]].map(([a, y]) => L.on(a, y));
    const mist = [[-4.5, CAP - 1.6, .95], [-5.9, CAP - 3.1, .7], [-4.2, CAP - 4.4, .5], [-6.3, CAP - .5, .5]]
      .map(([x, y, r]) => circ(0, 0, r, 10).map(([dx, dy]) => P([x + dx, y + dy, 0])));
    fin('gw_dezodor', { hu:'Dezodor spray', en:'silver blue aerosol deodorant can with a domed cap and a small mist puff', tilt:TILT, shapes:[
      pth('steel', 'base', [L.sil]),                                     // alumínium flakon
      det('steel', 'light', L.strip(-88, -48, 0, TOP)),
      det('steel', 'dark', L.strip(34, 88, 0, TOP)),
      det('steel', 'line', L.strip(70, 88, 0, TOP), { o:.4 }),           // legsötétebb élsáv
      det('blue', 'base', L.strip(-88, 88, 2.2, 8.4, 12)),               // kék címkesáv
      det('blue', 'light', L.strip(-88, -50, 2.2, 8.4)),
      det('blue', 'dark', L.strip(36, 88, 2.2, 8.4)),
      det('glass', 'light', drop, { o:.9 }),                             // csepp-motívum a címkén
      dpth('steel', 'dark', [tube([...L.full(2.9, 9.9, 18), L.full(2.9, 9.9, 18)[0]], .34 * k, false)], { o:.6 }),   // a peremezett nyak
      pth('white', 'base', [C.sil]),                                     // domború kupak
      det('white', 'light', C.strip(-88, -46, TOP, CAP - .4)),
      det('white', 'dark', C.strip(36, 88, TOP, CAP - .4)),
      dpth('white', 'line', [-62, -34, -6, 22, 50, 74].map(a => tube([C.on(a, TOP + .5), C.on(a, TOP + 2.6)], .26 * k, false)), { o:.45 }),   // recézés a kupakon
      dpth('sky', 'light', mist, { o:.9 }),                            // permetfelhő
      shine([L.on(-66, 1.3), L.on(-57, 1.3), L.on(-57, 9.2), L.on(-66, 9.2)], .5),
    ] });
  }

  // ============================================================================================
  //  7. Repülőjegy – beszállókártya letépett perforált éllel, rányomtatott repülő-sziluettel; fölötte apró gép
  // ============================================================================================
  {
    const TILT = -13, W = 9.6, H = 4.6, PX = 3.4, TH = .12;
    const tear = Array.from({ length:11 }, (_, i) => [-W + (i % 2 ? .5 : -.5) * .7, H - i * (2 * H / 10)]);
    const prof = [...rrect(-W + 1.0, -H, W, H, .9).filter(([x]) => x > -W + .6), ...tear];
    const P = cam({ az:17, el:11, F:220, tilt:TILT, fit:[...prof.map(([x, y]) => [x, y, TH]), ...prof.map(([x, y]) => [x, y, -TH]), [3.0, H + 5.4, 0], [8.6, H + 2.4, 0]] });
    const E = extrude(P, prof, -TH, TH), F = (x, y) => P([x, y, TH]), k = P.k;
    const perf = Array.from({ length:9 }, (_, i) => circ(...F(PX, -H + .55 + i * (2 * H - 1.1) / 8), .22 * k, 7));
    const band = [F(-W + .6, H - 1.5), F(W, H - 1.5), F(W, H), F(-W + .9, H)];
    const up = [[4.4, 0], [2.2, .5], [.4, .62], [-1.4, 2.7], [-2.2, 2.7], [-.8, .6], [-2.7, .55], [-3.7, 1.6], [-4.2, 1.6], [-3.7, .4], [-4.3, .35]];
    const planePts = (cx, cy, k2, deg) => place([...up, ...[...up].reverse().map(([x, y]) => [x, -y])], cx, cy, deg, k2);
    const plane = planePts(0, 0, .62, -18).map(([x, y]) => F(x - 2.4, y - .4));
    const bars = [1.6, 2.5, 3.4].map(y => tube([F(-W + 1.4, -H + y), F(PX - 1.0, -H + y)], .26 * k, false));
    const tiny = planePts(3.6, H + 3.3, .42, -26).map(([x, y]) => P([x, y, 0]));
    fin('gw_repulojegy', { hu:'Repülőjegy', en:'boarding pass card with a torn perforated edge and a printed aeroplane silhouette', tilt:TILT, shapes:[
      pth('paper', 'base', [E.sil]),                                     // a kártya
      dpth('paper', 'dark', [...E.tone('dark'), ...E.tone('line')]),     // a kártya vastagsága
      dpth('paper', 'light', E.tone('light')),
      det('sky', 'base', band),                                          // színes fejsáv
      det('sky', 'dark', [F(-W + .9, H - 1.5), F(W, H - 1.5), F(W, H - 1.15), F(-W + .85, H - 1.15)], { o:.8 }),
      det('cream', 'base', [F(PX + .4, -H + .5), F(W - .5, -H + .5), F(W - .5, H - 2.0), F(PX + .4, H - 2.0)], { o:.9 }),   // a letéphető szelvény mezője
      dpth('steel', 'dark', perf, { o:.55 }),                            // perforáció
      det('blue', 'base', plane),                                        // rányomtatott repülő-sziluett
      dpth('steel', 'dark', bars, { o:.45 }),                            // nyomtatott sávok
      det('sky', 'light', [F(-W + 1.2, -H + .6), F(PX - 1.0, -H + .6), F(PX - 1.0, -H + 1.1), F(-W + 1.3, -H + 1.1)], { o:.7 }),
      face('steel', 'light', tiny),                                      // apró repülő a jegy fölött
      dpth('steel', 'dark', [tiny.slice(3, 6)], { o:.45 }),
      shine([F(-W + 1.8, -H + 1.6), F(-W + 3.0, -H + 1.6), F(-W + 1.4, H - 1.9), F(-W + 2.6, H - 1.9)], .35),
    ] });
  }

  // ============================================================================================
  //  8. Naptej – lapított naptej-tubus lezárt alsó peremmel és csavaros kupakkal, napocska-motívummal, krémpaca
  // ============================================================================================
  {
    const TILT = 9, EZ = .42, CR = 1.5, NK = 11.6, CAP = 15.0;
    const prof = [[3.0, CR], [3.05, 2.2], [3.0, 8.4], [2.6, 9.8], [1.55, 11.0], [1.5, NK]];
    const capP = [[1.75, NK], [1.8, NK + .3], [1.8, CAP - .6], [1.55, CAP]];
    const P = cam({ az:0, el:15, F:130, tilt:TILT, fit:[...Array.from({ length:12 }, (_, i) => [3.05 * sin(i * 30), 0, 3.05 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .5, CAP, z * .5]]),
      [-8.6, 0, 3.0], [-3.2, 0, 4.6]] });
    const L = lathe(P, prof, EZ), C = lathe(P, capP, EZ), k = P.k;
    const crimp = [P([-3.5, 0, .25]), P([3.5, 0, .25]), P([3.5, CR, .25]), P([-3.5, CR, .25])];
    const sun = circ(0, 0, 1.5, 14).map(([x, y]) => L.on(x * 12, 5.4 + y));
    const rays = Array.from({ length:8 }, (_, i) => { const a = i * 45;
      return tube([L.on(cos(a) * 15.5, 5.4 + sin(a) * 1.95), L.on(cos(a) * 21, 5.4 + sin(a) * 2.7)], .34 * k, true); });
    const blob = smooth([[-4.8, 2.6], [-6.6, 3.8], [-8.4, 2.6], [-8.0, .6], [-6.0, -.4], [-3.8, .3], [-3.2, 1.8], [-4.2, 2.9], [-4.8, 2.6]], 3).map(([x, z]) => P([x + 1.0, 0, z + 2.4]));
    fin('gw_naptej', { hu:'Naptej', en:'flattened sunscreen tube with a screw cap, a sun motif and a dab of white cream', tilt:TILT, shapes:[
      pth('orange', 'base', [L.sil]),                                    // naptej-tubus
      det('orange', 'light', L.strip(-88, -48, CR, NK)),
      det('orange', 'dark', L.strip(34, 88, CR, NK)),
      det('orange', 'line', L.strip(70, 88, CR, NK), { o:.4 }),          // legsötétebb élsáv
      face('orange', 'dark', crimp),                                     // lezárt, préselt alsó perem
      dpth('orange', 'line', [.35, .75, 1.15].map(y => tube([P([-3.3, y, .27]), P([3.3, y, .27])], .24 * k, false)), { o:.6 }),
      det('cream', 'base', L.strip(-88, 88, 2.9, 8.0, 10)),              // világos címkesáv
      det('cream', 'dark', L.strip(38, 88, 2.9, 8.0)),
      dpth('honey', 'base', rays),                                       // napsugarak
      det('honey', 'base', sun),                                         // napkorong
      det('white', 'base', C.strip(-88, 88, NK, CAP, 8)),                // csavaros kupak
      det('white', 'light', C.strip(-88, -46, NK, CAP)),
      det('white', 'dark', C.strip(36, 88, NK, CAP)),
      dpth('white', 'line', [-60, -30, 0, 30, 60].map(a => tube([C.on(a, NK + .5), C.on(a, CAP - .7)], .24 * k, false)), { o:.5 }),   // recézés
      face('white', 'light', C.full(1.55, CAP, 14)),                     // a kupak teteje
      face('white', 'base', blob),                                       // krémpaca
      dpth('white', 'light', [smooth([[-5.2, 2.4], [-6.6, 3.1], [-7.4, 2.0], [-6.2, 1.1], [-4.8, 1.5], [-5.2, 2.4]], 3).map(([x, z]) => P([x + 1.0, .02, z + 2.4]))], { o:.85 }),
      shine([L.on(-64, CR + .6), L.on(-55, CR + .6), L.on(-55, 9.0), L.on(-64, 9.0)], .5),
    ] });
  }

  // ============================================================================================
  //  9. Számítógép-monitor – lapos monitor talpon, 3/4-es nézetben, keskeny kávával és világító képernyővel
  // ============================================================================================
  {
    const TILT = -11, X = 29, Z = 2.4, Y0 = 16.5, Y1 = 51, BZ = 8.5;
    const P = cam({ az:25, el:15, F:320, tilt:TILT, fit:[...corners(-X, X, Y0, Y1, -Z, Z), ...corners(-13, 13, 0, 1.8, -BZ, BZ)] });
    const b = box(P, -X, X, Y0, Y1, -Z, Z), nk = box(P, -3.6, 3.6, 1.6, Y0 + 1.2, -2.0, 2.0), ba = box(P, -13, 13, 0, 1.8, -BZ, BZ);
    const F = (x, y) => P([x, y, Z]), scr = (a, b2, c, d) => [F(a, b2), F(c, b2), F(c, d), F(a, d)];
    fin('gw_monitor', { hu:'Számítógép-monitor', en:'flat desktop monitor on a stand in three-quarter view with a thin bezel and a glowing screen', tilt:TILT, shapes:[
      face('steel', 'dark', ba.right),                                   // talp
      face('steel', 'base', ba.front),
      face('steel', 'light', ba.top),
      face('steel', 'dark', nk.right),                                   // tartóoszlop
      face('steel', 'base', nk.front),
      face('dark', 'dark', b.right),                                     // a panel oldala
      face('dark', 'base', b.front),                                     // káva
      face('dark', 'light', b.top),                                      // a panel teteje
      det('blue', 'dark', scr(-X + 1.3, Y0 + 1.3, X - 1.3, Y1 - 1.3)),   // képernyő
      det('sky', 'base', scr(-X + 1.3, Y0 + 1.3, X - 1.3, Y0 + 13), { o:.85 }),   // alsó derengés
      dpth('sky', 'light', [[F(-X + 2.6, Y0 + 2.2), F(-X + 12.4, Y0 + 2.2), F(-X + 24.0, Y1 - 2.4), F(-X + 14.2, Y1 - 2.4)]], { o:.3 }),   // ferde fénycsík
      det('dark', 'line', inset([P([X, Y0, -Z]), P([X, Y0, -Z + .8]), P([X, Y1, -Z + .8]), P([X, Y1, -Z])], b.sil, .5), { o:.5 }),
      dpth('steel', 'light', [tube([P([-12, 1.8, BZ - 1.2]), P([12, 1.8, BZ - 1.2])], .9 * P.k, false)], { o:.7 }),   // fény a talpon
      shine([F(-X + 2.0, Y0 + 2.4), F(-X + 4.2, Y0 + 2.4), F(-X + 4.2, Y1 - 2.4), F(-X + 2.0, Y1 - 2.4)], .3),
    ] });
  }

  // ============================================================================================
  //  10. Halas fogás – fehér tányéron két sushi-falat (rizs + lazacszelet), citromkarika és zöld levelek
  // ============================================================================================
  {
    const TILT = 8, PR = 12;
    const plate = [[7.5, 0], [10.2, .4], [11.6, 1.5], [PR, 2.3], [11.2, 2.4], [10.0, 1.7], [8.4, 1.3]];
    const nig = [{ cx:-3.4, cz:-.6, rot:-12 }, { cx:2.6, cz:1.8, rot:9 }];
    const P = cam({ az:0, el:47, F:180, tilt:TILT, fit:[0, 45, 90, 135, 180, 225, 270, 315].flatMap(a => [[PR * sin(a), 0, PR * cos(a)], [PR * sin(a), 2.4, PR * cos(a)]]).concat([[0, 5.4, 0]]) });
    const L = lathe(P, plate), k = P.k;
    const R = (c, u, v) => [c.cx + u * cos(c.rot) - v * sin(c.rot), c.cz + u * sin(c.rot) + v * cos(c.rot)];
    const pad = (c, hw, hd, r, y) => rrect(-hw, -hd, hw, hd, r, ([u, v]) => { const [x, z] = R(c, u, v); return P([x, y, z]); }, 3);
    const rice = nig.map(c => hull([...pad(c, 2.5, 1.35, .85, 1.3), ...pad(c, 2.35, 1.2, .9, 3.1)]));
    const fish = nig.map(c => pad(c, 2.75, 1.5, .7, 3.35)), fishSide = nig.map((c, i) => hull([...fish[i], ...pad(c, 2.7, 1.45, .7, 2.9)]));
    const stripes = nig.flatMap(c => [-1.3, 0, 1.3].map(u => { const a = R(c, u, -1.25), b2 = R(c, u, 1.25);
      return tube([P([a[0], 3.38, a[1]]), P([b2[0], 3.38, b2[1]])], .3 * k, false); }));
    const lem = circ(0, 0, 2.3, 16).map(([x, z]) => P([-5.8 + x, 1.5, 3.6 + z * .95]));
    const seg = Array.from({ length:7 }, (_, i) => { const a = i * 51.4;
      return tube([P([-5.8 + .35 * cos(a), 1.56, 3.6 + .33 * sin(a)]), P([-5.8 + 1.95 * cos(a), 1.56, 3.6 + 1.85 * sin(a)])], .22 * k, false); });
    const grn = [[5.8, -5.2, 145, 5.4, 2.6], [7.4, -3.0, 172, 4.6, 2.2], [4.4, -6.4, 118, 4.2, 2.0]]
      .map(([x, z, a, l, w]) => leafPts(x, z, a, l, w).map(([u, v]) => P([u, 1.4, v])));
    fin('gw_sushi', { hu:'Halas fogás', en:'white plate with two nigiri sushi pieces, a lemon slice and green leaves', tilt:TILT, shapes:[
      pth('white', 'base', [L.sil]),                                     // fehér tányér
      det('white', 'light', L.strip(-88, -46, 0, 2.3)),
      det('white', 'dark', L.strip(36, 88, 0, 2.3)),
      face('white', 'light', L.full(9.6, 1.35, 22)),                     // a tányér mélyedése
      dpth('white', 'dark', [tube([...L.full(9.6, 1.35, 22), L.full(9.6, 1.35, 22)[0]], .28 * k, false)], { o:.45 }),
      dpth('leaf', 'base', grn),                                         // zöld levelek
      dpth('leaf', 'dark', grn.map(g => g.slice(7)), { o:.6 }),
      face('gold', 'base', lem),                                         // citromkarika
      dpth('gold', 'light', seg, { o:.9 }),
      pth('cream', 'base', rice),                                        // rizs
      dpth('cream', 'dark', rice.map(r => r.slice(0, 8)), { o:.45 }),
      pth('tomato', 'base', fishSide),                                   // lazacszelet
      dpth('tomato', 'light', fish),
      dpth('white', 'light', stripes, { o:.55 }),                        // a lazac zsírcsíkjai
      shine([L.on(-62, .6), L.on(-52, .6), L.on(-52, 1.9), L.on(-62, 1.9)], .45),
    ] });
  }

  // ============================================================================================
  //  11. Rúzs – nyitott rúzs: arany hüvely kitolt piros, ferdére vágott betéttel, mellette álló kupak
  // ============================================================================================
  {
    const TILT = 9, TOP = 5.6, BT = 7.0;
    const off = (Q, dx, dz) => { const R2 = pp => Q([pp[0] + dx, pp[1], pp[2] + dz]); R2.V = Q.V; return R2; };
    const caseP = [[1.02, 0], [1.08, .35], [1.08, 5.1], [1.0, 5.35], [.92, TOP]];
    const capP = [[1.14, 0], [1.2, .3], [1.2, 4.0], [1.1, 4.4], [.85, 4.6]];
    const CX = 3.5, CZ = 1.6;
    const P = cam({ az:0, el:19, F:90, tilt:TILT, fit:[...Array.from({ length:12 }, (_, i) => [1.2 * sin(i * 30), 0, 1.2 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, BT + 2.4, z]]),
      ...Array.from({ length:12 }, (_, i) => [CX + 1.25 * sin(i * 30), 0, CZ + 1.25 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x, 4.6, z]])] });
    const L = lathe(P, caseP), C = lathe(off(P, CX, CZ), capP), k = P.k;
    const B = lathe(P, [[.86, TOP], [.86, BT]]);
    const rim = Array.from({ length:22 }, (_, i) => { const a = -180 + i * 360 / 21; return B.at(.86, BT + 2.3 * (1 + cos(a)) / 2, a); });
    const bsil = hull([...B.full(.86, TOP, 20), ...rim]);
    fin('gw_ruzs', { hu:'Rúzs', en:'open lipstick: golden case with the red bullet out and the cap standing beside it', tilt:TILT, shapes:[
      pth('gold', 'base', [L.sil]),                                      // arany hüvely
      det('gold', 'light', L.strip(-88, -46, 0, TOP)),
      det('gold', 'dark', L.strip(34, 88, 0, TOP)),
      det('gold', 'line', L.strip(70, 88, 0, TOP), { o:.4 }),            // legsötétebb élsáv
      dpth('gold', 'dark', [tube([...L.full(1.0, 5.35, 18), L.full(1.0, 5.35, 18)[0]], .22 * k, false),
        tube([...L.full(1.08, 1.3, 18), L.full(1.08, 1.3, 18)[0]], .2 * k, false)], { o:.6 }),   // a hüvely gyűrűi
      pth('red', 'base', [bsil]),                                        // kitolt piros betét
      det('red', 'dark', inset(B.strip(36, 88, TOP, BT + .1), bsil, .5), { o:.85 }),
      det('red', 'light', rim),                                          // a ferdére vágott lap
      det('red', 'light', inset(B.strip(-88, -50, TOP, BT + 1.6), bsil, .5), { o:.55 }),
      pth('gold', 'base', [C.sil]),                                      // álló kupak
      det('gold', 'light', C.strip(-88, -46, 0, 4.4)),
      det('gold', 'dark', C.strip(34, 88, 0, 4.4)),
      dpth('gold', 'line', [tube([...C.full(1.2, 3.1, 18), C.full(1.2, 3.1, 18)[0]], .2 * k, false)], { o:.55 }),
      face('gold', 'light', C.full(.85, 4.6, 16)),                       // a kupak teteje
      shine([L.on(-62, .6), L.on(-52, .6), L.on(-52, 4.9), L.on(-62, 4.9)], .5),
      shine([C.on(-60, .5), C.on(-50, .5), C.on(-50, 3.9), C.on(-60, 3.9)], .4),
    ] });
  }

  // ============================================================================================
  //  12. Keksz – három kerek keksz: kettő lapon fekve, egy elöl állva, harapásnyommal; körben morzsák
  // ============================================================================================
  {
    const TILT = -9, R = 2.7, TT = .85;
    const off = (Q, dx, dz) => { const R2 = pp => Q([pp[0] + dx, pp[1], pp[2] + dz]); R2.V = Q.V; return R2; };
    const bcx = R * cos(126), bcy = R * sin(126), brr = 1.55;
    const keep = [], m = 44;
    for(let i = 0; i < m; i++){ const a = 360 * i / m; keep.push([R * cos(a), R * sin(a), hypot(R * cos(a) - bcx, R * sin(a) - bcy) > brr]); }
    let st = 0; for(let i = 0; i < m; i++) if(keep[i][2] && !keep[(i + m - 1) % m][2]) st = i;
    const outer = []; for(let i = 0; i < m; i++){ const q = keep[(st + i) % m]; if(!q[2]) break; outer.push([q[0], q[1]]); }
    let barc = []; for(let i = 0; i <= 18; i++){ const a = 360 * i / 18, q = [bcx + brr * cos(a), bcy + brr * sin(a)]; if(hypot(q[0], q[1]) < R) barc.push(q); }
    const last = outer[outer.length - 1];
    if(hypot(barc[0][0] - last[0], barc[0][1] - last[1]) > hypot(barc[barc.length - 1][0] - last[0], barc[barc.length - 1][1] - last[1])) barc = barc.reverse();
    const bitten = [...outer, ...barc];
    const pos = [[-3.5, -3.6], [3.4, -4.2]];
    const P = cam({ az:19, el:31, F:150, tilt:TILT, fit:[...pos.flatMap(([x, z]) => [0, 90, 180, 270].flatMap(a => [[x + R * cos(a), 0, z + R * sin(a)], [x + R * cos(a), TT, z + R * sin(a)]])),
      ...bitten.map(([x, y]) => [x + .8, y + R + .2, 3.6]), ...bitten.map(([x, y]) => [x + .8, y + R + .2, 2.7]), [-6.6, 0, 6.0], [6.8, 0, 6.2]] });
    const D = pos.map(([x, z]) => lathe(off(P, x, z), [[R - .12, 0], [R, .2], [R, TT - .2], [R - .12, TT]]));
    const E = extrude(P, bitten.map(([x, y]) => [x + .8, y + R + .2]), 2.7, 3.6), k = P.k;
    const holes = D.flatMap((Dd, j) => [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].map(([u, v]) =>
      circ(...P([pos[j][0] + u, TT, pos[j][1] + v]), .22 * k, 7, .17 * k)));
    const fh = [[-.9, -1.3], [.8, -1.3], [.9, .3], [-.8, .3], [.1, 1.5]].map(([u, v]) => circ(...P([u + .8, v + R + .2, 3.62]), .2 * k, 7));
    const crumbs = [[-5.0, 1.2, .48], [-3.8, 2.4, .3], [4.8, 1.0, .4], [5.4, -.2, .26], [3.4, 2.8, .28]]
      .map(([x, z, r]) => circ(0, 0, r, 7).map(([dx, dz]) => P([x + dx, 0, z + dz])));
    fin('gw_keksz', { hu:'Keksz', en:'three round biscuits, one standing with a bite taken out, and a few crumbs', tilt:TILT, shapes:[
      pth('cardboard', 'base', [D[0].sil]),                              // hátsó keksz
      det('cardboard', 'dark', D[0].strip(34, 88, 0, TT)),
      face('cardboard', 'light', D[0].full(R - .12, TT, 20)),
      pth('cardboard', 'base', [D[1].sil]),                              // második keksz
      det('cardboard', 'dark', D[1].strip(34, 88, 0, TT)),
      face('cardboard', 'light', D[1].full(R - .12, TT, 20)),
      dpth('cardboard', 'line', holes, { o:.5 }),                        // szúrt lyukak
      pth('cardboard', 'base', [E.sil]),                                 // álló, megharapott keksz
      dpth('cardboard', 'dark', [...E.tone('dark'), ...E.tone('line')]),
      dpth('cardboard', 'light', E.tone('light')),
      det('cardboard', 'base', E.front, { o:.85 }),
      dpth('cardboard', 'line', fh, { o:.55 }),
      dpth('cardboard', 'dark', crumbs),                                 // morzsák
      shine([P([-4.6, TT + .02, -5.2]), P([-3.4, TT + .02, -5.4]), P([-2.2, TT + .02, -2.6]), P([-3.4, TT + .02, -2.4])], .3),
    ] });
  }

  // ============================================================================================
  //  13. Túrahátizsák – pántos, csatos hátizsák oldalzsebbel és a tetejére kötött feltekert matraccal
  // ============================================================================================
  {
    const TILT = -11, ZD = 7.5;
    const body = smooth([[-15.5, 2], [-17, 10], [-16.4, 34], [-13, 43], [-5, 46], [5, 46], [13, 43], [16.4, 34], [17, 10], [15.5, 2], [-15.5, 2]], 4);
    const pocket = smooth([[-17.4, 8], [-22.4, 14], [-21.8, 26], [-16.4, 29], [-16.4, 8], [-17.4, 8]], 3);
    const P = cam({ az:16, el:12, F:260, tilt:TILT, fit:[...body.flatMap(([x, y]) => [[x, y, ZD], [x, y, -ZD]]), ...pocket.map(([x, y]) => [x, y, 4]),
      [-8, 55.5, 0], [8, 55.5, 0], [-13, 49, 6]] });
    const E = extrude(P, body, -ZD, ZD), Pk = extrude(P, pocket, -2, 4), k = P.k;
    const F = (x, y) => P([x, y, ZD]);
    const flap = smooth([[-13.6, 40], [-6, 47.6], [6, 47.6], [13.6, 40], [12.4, 33], [-12.4, 33], [-13.6, 40]], 4).map(([x, y]) => P([x, y, ZD - .3]));
    const frontP = rrect(-10.5, 8.5, 10.5, 25, 2.2, ([u, v]) => F(u, v));
    const web = [-5.4, 5.4].map(x => tube([P([x, 44.5, ZD - .4]), P([x, 26.5, ZD + .1])], 1.5 * k, false));
    const buck = [-5.4, 5.4].map(x => rrect(x - 1.5, 25.0, x + 1.5, 28.4, .5, ([u, v]) => F(u, v), 2));
    const mat = lathe(P, [[0, -11], [3.4, -11], [3.4, 11], [0, 11]], 1);
    const matR = Array.from({ length:16 }, (_, i) => P([-11 + 22 * i / 15, 51.4 + 3.4 * sin(i * 24), ZD - 1]));
    const strap = tube([P([-12.6, 44, -1]), P([-15.4, 30, -3]), P([-14.2, 16, -2])], 2.6 * k, true);
    fin('gw_hatizsak', { hu:'Túrahátizsák', en:'hiking backpack with straps, buckles, a side pocket and a rolled mat on top', tilt:TILT, shapes:[
      pth('leaf', 'dark', [strap]),                                      // vállpánt (hátul kilátszik)
      pth('sky', 'base', [hull(Array.from({ length:20 }, (_, i) => P([-11 + 22 * (i % 2), 51.4 + 3.6 * cos(i * 18), ZD - 1 - 3.6 * sin(i * 18)])))]),   // feltekert matrac
      dpth('sky', 'dark', [matR], { o:.55 }),
      pth('leaf', 'base', [Pk.sil]),                                     // oldalzseb
      dpth('leaf', 'dark', Pk.tone('dark')),
      pth('leaf', 'base', [E.sil]),                                      // a hátizsák teste
      dpth('leaf', 'dark', [...E.tone('dark'), ...E.tone('line')]),
      dpth('leaf', 'light', [inset([F(-14.4, 6), F(-6.4, 4.6), F(-7.6, 40), F(-13.6, 41)], E.sil, 1.0)], { o:.4 }),   // fény felőli oldal
      face('leaf', 'dark', flap),                                        // fedélap
      det('cream', 'base', frontP, { o:.85 }),                           // elülső zseb
      dpth('dark', 'base', [tube([F(-9.6, 23.2), F(9.6, 23.2)], .5 * k, false)], { o:.5 }),   // cipzár
      dpth('honey', 'base', web),                                        // hevederek
      dpth('dark', 'base', buck, { o:.85 }),                             // csatok
      shine([F(-12.4, 8), F(-10.4, 7.6), F(-8.6, 39.6), F(-10.6, 40.2)], .3),
    ] });
  }

  // ============================================================================================
  //  14. Sportdzseki – könnyű, cipzáras sportdzseki vállfán: kapucni, húzózsinór, zöld gallér- és kézelősáv
  // ============================================================================================
  {
    const TILT = 8;
    const jak = [[-17, 48], [-23, 42], [-25.5, 17], [-19, 15], [-17, 38], [-16, 2], [16, 2], [17, 38], [19, 15], [25.5, 17], [23, 42], [17, 48], [8, 50], [4, 47], [-4, 47], [-8, 50], [-17, 48]];
    const hood = smooth([[-10, 47], [-11, 56], [-5, 60], [5, 60], [11, 56], [10, 47], [-10, 47]], 4);
    const P = cam({ az:11, el:8, F:320, tilt:TILT, fit:[...jak.flatMap(([x, y]) => [[x, y, 1.6], [x, y, -1.6]]), ...hood.map(([x, y]) => [x, y, -1]), [0, 74, 0], [-13, 62, 0], [13, 62, 0]] });
    const E = extrude(P, jak, -1.6, 1.6), k = P.k, F = (x, y) => P([x, y, 1.7]);
    const hg = hood.map(([x, y]) => P([x, y, -1]));
    const bar = tube([P([-12.6, 58.6, 0]), P([0, 68.4, 0]), P([12.6, 58.6, 0]), P([-12.6, 58.6, 0])], 1.5 * k, false);
    const hook = tube(Array.from({ length:11 }, (_, i) => { const a = -90 + i * 26; return P([2.6 + 2.6 * cos(a), 71.4 + 2.6 * sin(a), 0]); }).concat([P([0, 68.4, 0])]), 1.3 * k, true);
    const zip = tube([F(0, 4), F(0, 46.4)], .55 * k, false);
    const cuffs = [[-25.2, 16.4, -19.2, 15.4], [19.2, 15.4, 25.2, 16.4]].map(([a, b2, c, d]) => [F(a, b2), F(c, d), F(c, d + 3.4), F(a, b2 + 3.4)]);
    const collar = [F(-8.4, 47.4), F(-4, 44.6), F(4, 44.6), F(8.4, 47.4), F(8.2, 49.8), F(4, 47), F(-4, 47), F(-8.2, 49.8)];
    const draw = [tube([F(-2.6, 45.6), F(-3.4, 38)], .5 * k, true), tube([F(2.6, 45.6), F(3.6, 37.2)], .5 * k, true)];
    fin('gw_sportdzseki', { hu:'Sportdzseki', en:'lightweight zip-up sports jacket on a hanger with a hood and drawstrings', tilt:TILT, shapes:[
      pth('steel', 'base', [bar, hook]),                                 // vállfa
      face('blue', 'dark', hg),                                          // kapucni
      pth('blue', 'base', [E.sil]),                                      // dzseki
      dpth('blue', 'dark', [...E.tone('dark'), ...E.tone('line')]),
      dpth('blue', 'light', [inset([F(-14.6, 6), F(-2.4, 5), F(-2.4, 45), F(-13.4, 45.6)], E.sil, 1.0)], { o:.42 }),   // fény felőli elő
      dpth('blue', 'dark', [inset([F(3.4, 5), F(14.6, 6), F(13.4, 45.6), F(3.4, 45)], E.sil, 1.0)], { o:.3 }),
      dpth('blue', 'line', [tube([F(-16.4, 37.4), F(-17.4, 6)], .45 * k, false), tube([F(16.4, 37.4), F(17.4, 6)], .45 * k, false)], { o:.5 }),   // oldalvarrások
      dpth('dark', 'base', [zip], { o:.75 }),                            // cipzár
      face('steel', 'light', [F(-1.1, 30.4), F(1.1, 30.4), F(1.1, 33.8), F(-1.1, 33.8)]),   // cipzárhúzó
      det('leaf', 'base', collar),                                       // gallérsáv
      dpth('leaf', 'base', cuffs),                                       // kézelősávok
      dpth('leaf', 'base', [tube([F(-15.8, 2.6), F(15.8, 2.6)], 1.6 * k, false)], { o:.95 }),   // aljsáv
      dpth('cream', 'base', draw),                                       // húzózsinór
      shine([F(-12.4, 10), F(-9.4, 9.6), F(-7.4, 42), F(-10.4, 42.6)], .3),
    ] });
  }

  // ============================================================================================
  //  15. Általános tisztítószer – NÉGYSZÖGLETES flakon pattintós kupakkal, citromsárga folyadékkal, citromkarikával
  // ============================================================================================
  {
    const TILT = -10, X = 4.8, Z = 4.5, H = 17.0, SH = 18.7, NR = 2.55, CAP = 23.0, LVL = 13.4;
    const P = cam({ az:25, el:15, F:200, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), ...corners(-NR, NR, SH, CAP, -NR, NR)] });
    const b = box(P, -X, X, 0, H, -Z, Z), lq = box(P, -X + .25, X - .25, .3, LVL, -Z + .25, Z - .25);
    const sh = box(P, -NR, NR, SH - .2, SH, -NR, NR), C = lathe(P, [[NR + .15, SH], [NR + .25, SH + .4], [NR + .25, CAP - .7], [NR - .15, CAP]]);
    const F = (x, y) => P([x, y, Z]);
    const shF = [P([-X, H, Z]), P([X, H, Z]), P([NR, SH, NR]), P([-NR, SH, NR])];
    const shR = [P([X, H, Z]), P([X, H, -Z]), P([NR, SH, -NR]), P([NR, SH, NR])];
    const lem = circ(0, 0, 2.6, 16).map(([x, y]) => F(-.2 + x, 7.4 + y));
    const seg = Array.from({ length:7 }, (_, i) => { const a = i * 51.4;
      return tube([F(-.2 + .4 * cos(a), 7.4 + .38 * sin(a)), F(-.2 + 2.2 * cos(a), 7.4 + 2.1 * sin(a))], .26 * P.k, false); });
    fin('gw_tisztitoszer', { hu:'Általános tisztítószer', en:'square all-purpose cleaner bottle with a flip cap, lemon-yellow liquid and a lemon slice motif', tilt:TILT, shapes:[
      pth('glass', 'base', [b.sil]),                                     // négyszögletes flakon
      det('gold', 'base', lq.front),                                     // citromsárga folyadék
      det('gold', 'dark', lq.right),
      det('gold', 'light', lq.top, { o:.9 }),                            // a folyadék felszíne
      det('glass', 'dark', inset([P([X, LVL, Z]), P([X, LVL, -Z]), P([X, H, -Z]), P([X, H, Z])], b.sil, .4), { o:.7 }),   // üres, árnyékos oldal
      det('glass', 'line', inset([P([X, 0, -Z]), P([X, 0, -Z + .8]), P([X, H, -Z + .8]), P([X, H, -Z])], b.sil, .4), { o:.45 }),   // legsötétebb élsáv
      face('glass', 'base', shF),                                        // váll elöl
      face('glass', 'dark', shR),                                        // váll oldalt
      face('white', 'base', sh.front),                                   // nyak
      det('cream', 'base', [F(-X + .6, 3.0), F(X - .6, 3.0), F(X - .6, 12.2), F(-X + .6, 12.2)], { o:.95 }),   // üres címke
      det('honey', 'base', lem),                                         // citromkarika
      dpth('honey', 'light', seg, { o:.95 }),
      det('white', 'base', C.strip(-88, 88, SH, CAP, 10)),               // pattintós kupak
      det('white', 'light', C.strip(-88, -46, SH, CAP)),
      det('white', 'dark', C.strip(36, 88, SH, CAP)),
      dpth('white', 'line', [tube(C.ring(NR + .25, SH + 2.6, -84, 84, 10), .32 * P.k, false)], { o:.6 }),   // a fedél nyílásvonala
      face('white', 'light', C.full(NR - .15, CAP, 16)),                 // a kupak teteje
      shine([F(-X + 1.0, 1.2), F(-X + 2.2, 1.2), F(-X + 2.2, 15.2), F(-X + 1.0, 15.2)], .45),
    ] });
  }
})();
