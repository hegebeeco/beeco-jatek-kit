// ============================================================
//  Matricák — Greenwashing-vadász (Ítéld el!) bolti termékek, 1. csoport, B szint (docs/rajzolas.md)
//  15 termék: mosogatógép-tabletta, tönkölyliszt, füzet, papírtörlő, tonhalkonzerv, kézkrém, szemeteszsák,
//  fürdőszoba-tisztító, kávékapszula, sampon, ásványvíz, póló, mosogatószer, vágódeszka, tisztítókendő.
//  Valódi méretekből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  Bolti termékek a kártyákhoz; a többi csoport: art-gw-b.js, art-gw-c.js, art-gw-d.js
//  A kártyán csak a TERMÉK látszik – felirat, betű, szám, márkajel nincs (azt a HTML teszi rá).
//  Render: node tools/art-render.js 2d <ez a fájl> ki.png
// ============================================================
(function(){
  const { rad, camera, band } = ART.geo;
  const { hypot, max, min, abs, sqrt, PI } = Math;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const r1 = n => Math.round(n * 10) / 10;
  const norm = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const LIGHT = norm([-0.5, 0.65, 0.55]);                                   // fény: bal-fent-elöl (X jobbra, Y fel, Z a néző felé)

  // ---------------- 2D segédek ----------------
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function simplify(poly, eps = .25){                                       // Douglas–Peucker (zárt sokszög) – kis SVG
    const dp = pts => { if(pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1], L = hypot(b[0] - a[0], b[1] - a[1]) || 1; let best = 0, bi = 0;
      for(let i = 1; i < pts.length - 1; i++){ const d = abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if(d > best){ best = d; bi = i; } }
      return best > eps ? [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))] : [a, b]; };
    const h = Math.floor(poly.length / 2);
    return [...dp(poly.slice(0, h + 1)).slice(0, -1), ...dp([...poly.slice(h), poly[0]]).slice(0, -1)];
  }
  function envelope(polys, step = .5){                                      // függőlegesen konvex sokszögek uniójának körvonala
    const xs = polys.flat().map(p => p[0]), x0 = min(...xs), x1 = max(...xs), N = max(8, Math.ceil((x1 - x0) / step)), top = [], bot = [];
    for(let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * min(max(i / N, .0005), .9995); let lo = Infinity, hi = -Infinity;
      for(const poly of polys) for(let j = 0; j < poly.length; j++){ const a = poly[j], b = poly[(j + 1) % poly.length];
        if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0){ const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = min(lo, y); hi = max(hi, y); } }
      if(lo < Infinity){ top.push([x, lo]); bot.push([x, hi]); }
    }
    return simplify([...top, ...bot.reverse()], .2);
  }
  function inset(pts, sil, d = .85){                                        // a kontúr közelében lévő pontok behúzása
    const s = Math.sign(area(sil)) || 1, n = sil.length;
    return pts.map(p => { let best = null, bd = Infinity;
      for(let i = 0; i < n; i++){ const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey; if(L2 < 1e-9) continue;
        const t = max(0, min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, dd = hypot(p[0] - qx, p[1] - qy);
        if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:sqrt(L2) }; } }
      return (!best || bd >= d) ? p : [best.qx - best.ey / best.L * s * d, best.qy + best.ex / best.L * s * d]; });
  }
  function clip(subject, cp){                                               // konvex vágás (Sutherland–Hodgman)
    const sg = Math.sign(area(cp)), inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){ const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); } }
    return out;
  }
  const circ = (cx, cy, r, n = 12, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => [cx + r * cos(a0 + 360 * i / n), cy + ry * sin(a0 + 360 * i / n)]);
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const star4 = (cx, cy, R) => Array.from({ length:8 }, (_, i) => { const a = 90 - i * 45, r = i % 2 ? R * .3 : R; return [cx + r * cos(a), cy + r * sin(a)]; });
  const rrect = (x0, y0, x1, y1, r) => [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]]
    .flatMap(([x, y, a]) => [0, 30, 60, 90].map(d => [x + r * cos(a + d), y + r * sin(a + d)]));
  const leafPts = (x, y, deg, len, wid) => { const dx = cos(deg), dy = sin(deg), h = wid / 2;
    return Array.from({ length:13 }, (_, i) => { const t = i / 6, u = t <= 1 ? t : 2 - t, s = t <= 1 ? 1 : -1;
      return [x + dx * len * u - dy * s * h * Math.sin(PI * u), y + dy * len * u + dx * s * h * Math.sin(PI * u)]; }); };

  // ---------------- 3D segédek ----------------
  function cam(o){ const P = camera(Object.assign({ span:80 }, o)), a = rad(o.az || 0), e = rad(o.el || 0);
    P.V = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; return P; }
  const corners = (x0, x1, y0, y1, z0, z1) => { const o = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) o.push([x, y, z]); return o; };
  const toneOf = n => { const s = dot(norm(n), LIGHT); return s > .6 ? 'light' : s > .15 ? 'base' : s > -.52 ? 'dark' : 'line'; };
  function box(P, x0, x1, y0, y1, z0, z1){                                  // doboz látható lapjai (az > 0: eleje és jobb oldala)
    const c = (x, y, z) => P([x, y, z]);
    return { top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)],
      front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
      right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)],
      sil:hull(corners(x0, x1, y0, y1, z0, z1).map(P)) };
  }
  // forgástest tetszőleges tengellyel: prof = [[r, t], …] a tengely mentén; ez = a keresztmetszet mélységi aránya
  // szög: 0 = a néző felé, +90 = a képernyőn jobbra, −90 = balra (mint a többi matrica-fájlban)
  function rev(P, base, dir, prof, o = {}){
    const ez = o.ez == null ? 1 : o.ez, V = o.V || P.V;
    const d = norm(dir), vv = norm(V.map((x, i) => x - d[i] * dot(V, d))), sd = cross(d, vv);
    const at = (r, t, a) => P([0, 1, 2].map(i => base[i] + d[i] * t + r * (sin(a) * sd[i] + ez * cos(a) * vv[i])));
    const rAt = t => { for(let i = 1; i < prof.length; i++) if(t <= prof[i][1] || i === prof.length - 1){ const [ra, ta] = prof[i - 1], [rb, tb] = prof[i];
      return tb === ta ? rb : ra + (rb - ra) * (t - ta) / (tb - ta); } return prof[0][0]; };
    const ring = (r, t, a0 = 0, a1 = 360, n = 20) => Array.from({ length:n + 1 }, (_, i) => at(r, t, a0 + (a1 - a0) * i / n));
    const full = (r, t, n = 16) => ring(r, t, 0, 360, n).slice(0, n);
    const rings = prof.map(([r, t]) => full(r, t, 24));
    const sil = o.hull ? hull(rings.flat()) : envelope(rings.slice(1).map((rg, i) => hull([...rings[i], ...rg])));
    const on = (a, t, dr = 0) => at(rAt(t) + dr, t, a);
    const strip = (a0, a1, t0 = prof[0][1], t1 = prof[prof.length - 1][1], n = 5) => {
      const ts = [t0, ...prof.map(p => p[1]).filter(t => t > t0 && t < t1), t1];
      return inset([...ring(rAt(t0), t0, a0, a1, n), ...ts.slice(1, -1).map(t => on(a1, t)), ...ring(rAt(t1), t1, a1, a0, n), ...ts.slice(1, -1).reverse().map(t => on(a0, t))], sil);
    };
    const aL = Math.atan2(dot(LIGHT, sd), dot(LIGHT, vv)) * 180 / PI;   // merről süt a fény (fok) – ferde tengelynél is
    return { at, rAt, ring, full, sil, on, strip, aL, wrap:pts => pts.map(([a, t]) => on(a, t)) };
  }
  // kihúzott profil (x, y sík, z0…z1 mélység): front = elülső lap · tone(t) = az adott tónusú oldallapok · sil = körvonal
  function extrude(P, prof0, z0, z1){
    const prof = area(prof0) > 0 ? prof0 : [...prof0].reverse(), n = prof.length, front = prof.map(([x, y]) => P([x, y, z1])), sides = [];
    for(let i = 0; i < n; i++){ const a = prof[i], b = prof[(i + 1) % n], nn = norm([b[1] - a[1], a[0] - b[0], 0]);
      if(dot(nn, P.V) > .02) sides.push({ pts:[P([a[0], a[1], z1]), P([b[0], b[1], z1]), P([b[0], b[1], z0]), P([a[0], a[1], z0])], tone:toneOf(nn) }); }
    return { front, sides, tone:t => sides.filter(s => s.tone === t).map(s => s.pts), sil:envelope([front, ...sides.map(s => s.pts)], .5) };
  }

  // ---------------- alakzat-gyártók ----------------
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts }, o);                     // fő lap: kontúr + fehér perem
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts }, o);  // tónus-lap / dísz
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, polys }, o);                  // több részből álló fő lap
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, polys }, o);
  const shine = (pts, o = .6) => det('paper', 'light', pts, { o });
  const lin = (m, tone, pts, w, o) => Object.assign({ t:'line', m, tone, pts, w }, o);
  const tube = (pts, w, cap = true) => band(pts, w, cap);

  // ---------------- beillesztés a vászonra (a megdöntött sziluett perem + árnyék mellett is elfér) ----------------
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
  //  1. Mosogatógép-tabletta – nyitott kartondoboz (14 × 10 × 9 cm) hátrahajtott fedéllel,
  //     benne sorban álló tabletták, előtte 3 kétrétegű tabletta (fehér alsó + kék felső réteg, zöld gömb)
  // ============================================================================================
  {
    const TILT = -10, X = 6.2, Z = 4.3, H = 8.2, LID = 112, WT = .4, TW = 2.6, TD = 1.9, TH = 2.4, TL = 1.1;
    const lid = (x, s) => [x, H + s * sin(LID), -Z + s * cos(LID)];
    const tabs = [[-5.2, 6.8, 14], [.4, 8.8, -10], [6.0, 6.6, 22]];
    const P = cam({ az:26, el:28, F:110, tilt:TILT, fit:[...corners(-X, X, 0, H, -Z, Z), lid(-X, 2 * Z), lid(X, 2 * Z), [-8.2, 0, 10.4], [8.8, 0, 10.4]] });
    const b = box(P, -X, X, 0, H, -Z, Z), q = (x, y, z) => P([x, y, z]), F = (u, v) => P([u, v, Z]);
    const open = [q(-X, H, Z), q(X, H, Z), q(X, H, -Z), q(-X, H, -Z)];
    const lidF = [lid(-X, 0), lid(X, 0), lid(X, 2 * Z), lid(-X, 2 * Z)].map(P);
    const inside = [];
    for(const cx of [-3.6, .2, 4.0]) for(const cz of [-2.0, 1.4])
      inside.push(clip([[cx - 1.6, H - .9, cz - 1.1], [cx + 1.6, H - .9, cz - 1.1], [cx + 1.6, H - .9, cz + 1.1], [cx - 1.6, H - .9, cz + 1.1]].map(P), open));
    const tb = ([cx, cz, yw], y0, y1) => { const Q = v => P([cx + v[0] * cos(yw) + v[2] * sin(yw), v[1], cz - v[0] * sin(yw) + v[2] * cos(yw)]); Q.V = P.V;
      return box(Q, -TW, TW, y0, y1, -TD, TD); };
    const low = tabs.map(t => tb(t, 0, TL)), up = tabs.map(t => tb(t, TL, TH));
    const balls = tabs.map(([cx, cz]) => circ(0, 0, 1.0, 10).map(([dx, dz]) => P([cx + dx, TH + .12, cz + dz])));
    const wav = Array.from({ length:9 }, (_, i) => { const u = -X + 2 * X * i / 8; return F(u, 3.3 + .5 * Math.sin(i * 1.15)); });
    const glass = [[-2.1, 7.6], [2.1, 7.6], [1.5, 5.4], [.42, 4.6], [.42, 4.1], [1.7, 3.85], [1.7, 3.4], [-1.7, 3.4], [-1.7, 3.85], [-.42, 4.1], [-.42, 4.6], [-1.5, 5.4]].map(p => F(p[0] - .5, p[1]));
    fin('gw_mosogatotabletta', { hu:'Mosogatógép-tabletta', en:'open cardboard box of dishwasher tablets with two-layer tablets', tilt:TILT, shapes:[
      face('cardboard', 'light', lidF),                                                      // hátrahajtott fedél (kraft belső oldal)
      det('cardboard', 'dark', open),                                                        // a doboz belseje
      dpth('blue', 'base', inside),                                                          // tabletták a dobozban
      face('teal', 'dark', b.right),                                                         // doboz oldala
      face('teal', 'base', b.front),                                                         // doboz eleje
      det('teal', 'line', inset([q(X, 0, -Z + 1.1), q(X, 0, -Z), q(X, H, -Z), q(X, H, -Z + 1.1)], b.sil), { o:.5 }),   // hátsó élsáv
      det('cardboard', 'light', [q(-X, H, Z), q(X, H, Z), q(X, H, -Z), q(X - WT, H, -Z), q(X - WT, H, Z - WT), q(-X, H, Z - WT)]),   // vágott kartonperem
      det('white', 'base', inset([F(-X, .5), F(X, .5), ...wav.reverse()], b.sil)),           // fehér hullám-sáv
      det('paper', 'light', glass),                                                          // csillogó pohár képe
      dpth('honey', 'light', [star4(...F(3.0, 7.4), 2.4), star4(...F(-3.6, 6.2), 1.8), star4(...F(3.4, 4.6), 1.4)]),   // csillanások
      pth('white', 'base', low.map((l, i) => hull([...l.sil, ...up[i].sil]))),               // tabletták (fehér alsó réteg)
      dpth('white', 'dark', low.map(l => l.right)),
      pth('blue', 'base', up.map(u => u.front)),                                             // kék felső réteg
      dpth('blue', 'dark', up.map(u => u.right)),
      dpth('blue', 'light', up.map(u => u.top)),
      dpth('leaf', 'base', balls),                                                           // zöld gömb a tabletta tetején
      shine([F(-5.6, 1.0), F(-5.0, 1.0), F(-5.0, 6.9), F(-5.6, 6.9)], .45),
    ] });
  }

  // ============================================================================================
  //  2. Tönkölyliszt – 1 kg-os kraftpapír zacskó behajtott, gyűrt felső peremmel; a címkén búzakalász, alatta kiszóródott liszt
  // ============================================================================================
  {
    const TILT = -10, X = 5.5, Z = 3.5, H = 16.4, BX = X + .3, BZ = Z + .5, B0 = 15.2, B1 = 19.0;
    const P = cam({ az:28, el:22, F:90, tilt:TILT, fit:[...corners(-BX, BX, 0, B1, -BZ, BZ), [-10.4, 0, Z + 5.2]] });
    const b = box(P, -X, X, 0, H, -Z, Z), c = box(P, -BX, BX, B0, B1, -BZ, BZ);
    const F = (u, v) => P([u, v, Z]), S = (w, v) => P([X, v, w]);
    const gr = (u, v, deg) => circ(0, 0, .8, 8, 1.25).map(([x, y]) => [u + x * cos(deg) - y * sin(deg), v + x * sin(deg) + y * cos(deg)]).map(p => F(p[0], p[1]));
    const grains = [[-.85, 8.2, 62], [1.05, 8.7, 118], [-1.0, 9.8, 62], [.9, 10.3, 118], [-1.0, 11.4, 62], [.75, 11.8, 118], [-.3, 12.8, 80]].map(g => gr(...g));
    const awns = [[-1.3, 12.4, 122], [-.2, 13.6, 96], [1.1, 12.6, 66], [-1.5, 10.8, 128], [1.3, 11.2, 60]].map(([u, v, a]) => tube([F(u, v), F(u + 2.4 * cos(a), v + 2.4 * sin(a))], .33 * P.k, false));
    const pile = circ(-5.8, Z + 2.6, 4.2, 16, 2.4).map(([x, z]) => P([x, 0, z]));
    const apex = P([-6.2, 2.6, Z + 2.0]);
    fin('gw_liszt', { hu:'Tönkölyliszt', en:'kraft paper flour bag with a folded top and a wheat ear picture', tilt:TILT, shapes:[
      face('cardboard', 'dark', b.right),                                                    // zacskó oldala
      face('cardboard', 'base', b.front),                                                    // zacskó eleje
      det('cardboard', 'line', inset([S(-Z, 0), S(-Z + 1.0, 0), S(-Z + 1.0, H), S(-Z, H)], b.sil), { o:.5 }),   // hátsó élsáv
      lin('cardboard', 'line', [S(0, 1.2), S(0, 14.2), S(-Z + .3, B0)], .55 * P.k, { o:.55 }),   // oldalhajtás (gusset)
      face('cardboard', 'dark', c.right),                                                    // behajtott perem oldala
      face('cardboard', 'base', c.front),                                                    // behajtott perem eleje
      face('cardboard', 'light', c.top),                                                     // a perem teteje
      det('cardboard', 'dark', inset([P([-BX, B0 + 1.5, BZ]), P([BX, B0 + 1.5, BZ]), P([BX, B0 + 1.9, BZ]), P([-BX, B0 + 1.9, BZ])], c.sil), { o:.8 }),   // hajtásvonal
      det('cream', 'base', rrect(-3.7, 3.0, 3.7, 13.4, 1.3).map(p => F(p[0], p[1]))),        // üres címke
      lin('wood', 'dark', [F(1.0, 3.9), F(.4, 7.4), F(-.2, 10.4), F(-.4, 12.6)], .55 * P.k),  // kalász szára
      dpth('honey', 'base', grains),                                                         // búzaszemek
      dpth('honey', 'dark', awns),                                                           // szálkák
      det('leaf', 'base', leafPts(.9, 6.0, -20, 3.4, 1.5).map(p => F(p[0], p[1]))),          // levél a száron
      face('paper', 'base', hull([...pile, apex])),                                          // kiszóródott liszt
      det('paper', 'dark', inset([apex, ...pile.slice(0, 6)], hull([...pile, apex]), .6)),
      dpth('paper', 'light', [circ(...F(-3.9, 1.5), .5 * P.k, 7), circ(...F(3.4, 2.2), .34 * P.k, 7), circ(...F(2.4, 14.4), .32 * P.k, 7)], { o:.9 }),   // lisztpor
      shine([F(-4.9, 2.0), F(-4.3, 2.0), F(-4.3, 13.0), F(-4.9, 13.0)], .35),
    ] });
  }

  // ============================================================================================
  //  3. Füzet – spirálfüzet fekve, enyhén felnyitott borítóval; alatta a vonalas lap, a bal élén spirál
  // ============================================================================================
  {
    const TILT = -12, X = 7.5, Z = 10.5, T = 1.1, BC = .2, OP = 26, CT = .22, HX = -X + 1.0, SL = X - HX;
    const cov = (s, h, z) => [HX + s * cos(OP) - h * sin(OP), BC + T + s * sin(OP) + h * cos(OP), z];
    const P = cam({ az:20, el:44, F:110, tilt:TILT, fit:[...corners(-X - 1.6, X, 0, BC + T, -Z, Z), cov(SL, CT, Z), cov(SL, CT, -Z)] });
    const pg = box(P, -X, X, BC, BC + T, -Z, Z), bk = box(P, -X - .1, X + .15, 0, BC, -Z - .15, Z + .15);
    const YT = BC + T, coverTop = [[-X, -Z], [HX, -Z]].map(([x, z]) => P([x, YT + CT, z]))
      .concat([cov(SL, CT, -Z), cov(SL, CT, Z)].map(P), [[HX, Z], [-X, Z]].map(([x, z]) => P([x, YT + CT, z])));
    const coverEdge = [P([-X, YT, Z]), P([HX, YT, Z]), P(cov(SL, 0, Z)), P(cov(SL, CT, Z)), P([HX, YT + CT, Z]), P([-X, YT + CT, Z])];
    const lines = Array.from({ length:15 }, (_, i) => tube([P([-X + 2.2, YT, -Z + 2.4 + i * 1.15]), P([X - .5, YT, -Z + 2.4 + i * 1.15])], .22 * P.k, false));
    const coil = z => tube(Array.from({ length:9 }, (_, i) => { const a = 58 + i * 23;
      return P([-X + .8 + 1.75 * cos(a), BC + T * .5 + 1.75 * sin(a), z + (a - 160) / 180 * .7]); }), .52 * P.k, true);
    const zs = Array.from({ length:11 }, (_, i) => -Z + 1.3 + i * 1.86);
    fin('gw_fuzet', { hu:'Füzet', en:'spiral notebook with a slightly lifted cover and a lined page', tilt:TILT, shapes:[
      face('red', 'dark', bk.front),                                                         // hátsó borító éle
      face('white', 'base', pg.front),                                                       // lapok eleje
      face('white', 'dark', pg.right),                                                       // lapok oldala
      dpth('white', 'line', [tube([P([-X, BC + .4, Z]), P([X, BC + .4, Z])], .2 * P.k, false), tube([P([-X, BC + .78, Z]), P([X, BC + .78, Z])], .2 * P.k, false),
        tube([P([X, BC + .55, Z]), P([X, BC + .55, -Z])], .2 * P.k, false)], { o:.55 }),      // lapélek
      face('paper', 'light', pg.top),                                                        // a legfelső lap
      dpth('sky', 'base', lines),                                                            // vonalak
      det('red', 'base', tube([P([-X + 3.2, YT, -Z + 1.4]), P([-X + 3.2, YT, Z - .6])], .3 * P.k, false), { o:.8 }),   // margó-vonal
      dpth('steel', 'dark', zs.map(coil)),                                                   // spirál
      dpth('steel', 'light', zs.map(z => tube([P([-X - .55, BC + T * .5 + 1.35, z - .2]), P([-X - .95, BC + T * .5 + .1, z - .2])], .34 * P.k, false)), { o:.9 }),
      face('red', 'base', coverTop),                                                         // borító (megemelve)
      det('red', 'light', inset([P(cov(.6, CT, -Z + .6)), P(cov(SL - .2, CT, -Z + .6)), P(cov(SL - .2, CT, 1.0)), P(cov(.6, CT, 1.0))], coverTop, .7)),   // fény felőli lap
      face('red', 'dark', coverEdge),                                                        // a borító vastagsága elöl
      det('cream', 'base', [P(cov(3.4, CT + .02, -3.4)), P(cov(10.6, CT + .02, -3.4)), P(cov(10.6, CT + .02, 4.2)), P(cov(3.4, CT + .02, 4.2))]),   // üres címke
      dpth('dark', 'base', zs.map(z => circ(...P([HX - .1, YT + CT, z]), .32 * P.k, 7, .24 * P.k)), { o:.45 }),   // lyukak
      shine([P(cov(1.6, CT, -Z + 1.4)), P(cov(2.4, CT, -Z + 1.4)), P(cov(2.4, CT, Z - 2.0)), P(cov(1.6, CT, Z - 2.0))], .45),
    ] });
  }

  // ============================================================================================
  //  4. Papírtörlő – két konyhai papírtörlő-tekercs vékony fóliába csomagolva; a tekercsek magja (lyuk) látszik
  // ============================================================================================
  {
    const TILT = -8, R = 5.6, H = 22, CX = R + .1;
    const P = cam({ az:0, el:24, F:150, tilt:TILT, fit:[-1, 1].flatMap(s => [0, 90, 180, 270].flatMap(a => [[s * CX + (R + .6) * sin(a), -.4, (R + .6) * cos(a)], [s * CX + (R + .6) * sin(a), H + .9, (R + .6) * cos(a)]])) });
    const rolls = [-CX, CX].map(cx => rev(P, [cx, 0, 0], [0, 1, 0], [[R, 0], [R, H]]));
    const film = hull([-CX, CX].flatMap(cx => [-.35, H + 1.75].flatMap(y =>
      Array.from({ length:20 }, (_, i) => P([cx + (R + .5) * sin(i * 18), y, (R + .5) * cos(i * 18)])))));
    const crimp = [-CX - R - .5, CX + R + .5].map((x, i) => x), gather = Array.from({ length:9 }, (_, i) =>
      P([-CX - R - .5 + (2 * CX + 2 * R + 1.0) * i / 8, H + 1.75 + (i % 2 ? .55 : 0), 0]));
    const hole = rolls.map((L, i) => L.full(1.95, H, 14)), core = rolls.map(L => L.full(2.45, H, 14));
    const deep = rolls.map((L, i) => clip(L.full(1.95, H - 2.4, 14), hole[i]));
    const leafIcon = (cx) => leafPts(cx, 11.4, -62, 2.8, 1.6).map(([x, y]) => P([x, y, R + .15]));
    fin('gw_papirtorlo', { hu:'Papírtörlő', en:'two kitchen paper towel rolls in a thin plastic wrap', tilt:TILT, shapes:[
      face('glass', 'base', film, { o:.5 }),                                                 // fólia-csomagolás
      pth('white', 'base', rolls.map(L => L.sil)),                                           // tekercsek
      dpth('white', 'light', rolls.map(L => L.strip(-90, -50, 0, H))),
      dpth('white', 'dark', rolls.map(L => L.strip(38, 90, 0, H))),
      dpth('white', 'line', rolls.map(L => L.strip(72, 90, 0, H)), { o:.3 }),                // legsötétebb élsáv
      dpth('leaf', 'base', rolls.map(L => L.strip(-90, 90, 8.2, 13.6, 10))),                 // nyomott sáv a fólián
      dpth('leaf', 'dark', rolls.map(L => L.strip(36, 90, 8.2, 13.6))),
      dpth('leaf', 'light', rolls.map(L => L.strip(-90, -56, 8.2, 13.6))),
      dpth('cream', 'base', [-CX, CX].map(leafIcon)),                                        // levélke a sávon
      pth('white', 'light', rolls.map(L => L.full(R, H, 22))),                               // a tekercsek teteje
      dpth('white', 'dark', rolls.map(L => tube([...L.full(3.5, H, 18), L.full(3.5, H, 18)[0]], .22 * P.k, false)), { o:.7 }),   // papírréteg-gyűrű
      dpth('white', 'dark', rolls.map(L => tube([L.on(-34, 1.2), L.on(-34, H - .6)], .18 * P.k, false)), { o:.5 }),   // perforáció
      dpth('cardboard', 'base', core),                                                       // kartonmag
      dpth('cardboard', 'dark', hole),
      dpth('dark', 'base', deep),                                                            // a mag lyuka
      face('glass', 'base', [...gather, P([CX + R + .5, H + .5, 0]), P([-CX - R - .5, H + .5, 0])], { o:.75 }),   // hegesztett fólia-perem a tetején
      dpth('glass', 'dark', [tube(gather.filter((_, i) => i < 9), .3 * P.k, false), tube([P([0, -.35, R + .5]), P([0, H + 1.6, R + .5])], .32 * P.k, false),
        ...[-CX, CX].map(cx => tube([P([cx - 2.6, 18.6, R + .2]), P([cx - .6, 20.4, R + .2])], .3 * P.k, false))], { o:.45 }),   // fólia-varrat és gyűrődés
      shine([P([-CX - 2.0, 20.4, R + .5]), P([CX + 1.0, 16.4, R + .5]), P([CX + 1.0, 14.6, R + .5]), P([-CX - 2.0, 18.6, R + .5])], .4),   // fólia-csillanás
      shine([P([-CX - 4.2, 2.4, 3.6]), P([-CX - 3.3, 2.4, 3.6]), P([-CX - 3.3, 19.6, 3.6]), P([-CX - 4.2, 19.6, 3.6])], .55),
    ] });
  }

  // ============================================================================================
  //  5. Tonhalkonzerv – lapos, kerek konzervdoboz felnyitható gyűrűs tetővel; az üres címkesávon hal-kép
  // ============================================================================================
  {
    const TILT = 12, R = 4.2, H = 3.6;
    const P = cam({ az:0, el:38, F:90, tilt:TILT, fit:[0, 60, 120, 180, 240, 300].flatMap(a => [[(R + .1) * sin(a), 0, (R + .1) * cos(a)], [(R + .1) * sin(a), H, (R + .1) * cos(a)]]) });
    const C = rev(P, [0, 0, 0], [0, 1, 0], [[R - .25, 0], [R, .35], [R, H - .3], [R + .1, H]]), k = P.k;
    const fish = [...Array.from({ length:13 }, (_, i) => { const a = 180 - i * 15; return C.on(-4 + 16 * cos(a), 1.8 + .82 * sin(a)); }),
      C.on(11, 2.5), C.on(22, 3.05), C.on(19.5, 1.8), C.on(22, .55), C.on(11, 1.1)];
    const waves = tube(Array.from({ length:9 }, (_, i) => { const a = -46 + i * 11.5; return C.on(a, 1.0 + .13 * Math.sin(i * 1.5)); }), .22 * k, false);
    const ring = circ(0, 2.05, 1.3, 14, .95), inner = circ(0, 2.05, .82, 12, .5).reverse();
    const RP = ([x, z]) => P([x, H - .16, z]);
    fin('gw_tonhal', { hu:'Tonhalkonzerv', en:'flat round tuna can with a ring-pull lid and a fish picture', tilt:TILT, shapes:[
      pth('steel', 'base', [C.sil]),                                                         // konzervdoboz
      det('steel', 'light', C.strip(-90, -54, 0, H - .3)),
      det('steel', 'dark', C.strip(36, 90, 0, H - .3)),
      det('blue', 'base', C.strip(-90, 90, .6, 3.0, 10)),                                    // üres címkesáv
      det('blue', 'light', C.strip(-90, -52, .6, 3.0)),
      det('blue', 'dark', C.strip(34, 90, .6, 3.0)),
      det('blue', 'line', C.strip(70, 90, .6, 3.0), { o:.4 }),                               // legsötétebb élsáv
      det('honey', 'base', fish),                                                            // hal-kép
      dpth('honey', 'light', [[C.on(-18, 1.6), C.on(-4, 1.25), C.on(8, 1.35), C.on(8, 1.65), C.on(-6, 1.6)]], { o:.9 }),   // világos has
      dpth('dark', 'base', [circ(...C.on(-13, 2.1), .3 * k, 8)], { o:.9 }),                  // szem
      dpth('sky', 'light', [waves], { o:.85 }),                                              // hullám a hal alatt
      face('steel', 'light', C.full(R + .08, H, 22)),                                        // peremes tető
      det('steel', 'dark', C.full(R - .45, H, 20)),
      det('steel', 'base', clip(C.full(R - .45, H - .55, 20), C.full(R - .45, H, 20))),      // mélyített fedéllap
      dpth('steel', 'dark', [3.05, 2.1].map(r => tube([...C.full(r, H - .4, 18), C.full(r, H - .4, 18)[0]], .2 * k, false)), { o:.7 }),   // bordák a fedélen
      face('steel', 'base', [[-.85, -.5], [.85, -.5], [1.15, 1.5], [-1.15, 1.5]].map(RP)),   // nyitófül
      pth('steel', 'light', [ring.map(RP), inner.map(RP)]),                                  // húzógyűrű
      det('steel', 'dark', circ(0, -.25, .42, 10, .3).map(RP)),                              // szegecs
      shine([C.at(2.6, H - .4, -70), C.at(2.6, H - .4, -55), C.at(1.4, H - .4, -55), C.at(1.4, H - .4, -70)], .8),
    ] });
  }

  // ============================================================================================
  //  6. Kézkrém – kis, átlósan fekvő, összenyomható tubus (lapított, bordázott véggel) és kerek pattintós kupak
  // ============================================================================================
  {
    const TILT = 8, AX = 30, LN = 11.6, A = [cos(AX), 0, -sin(AX)], B = [sin(AX), 0, cos(AX)], O = [-4.6, 0, 3.0];
    const cl = u => min(1, max(0, (u - .68) / .32));
    const aOf = u => 1.85 + .38 * Math.pow(cl(u), 1.1), bOf = u => 1.85 - 1.6 * Math.pow(cl(u), 1.15);
    const pt = (u, ph) => { const a = aOf(u), b = bOf(u);
      return [0, 1, 2].map(i => O[i] + A[i] * (LN * u) + B[i] * a * cos(ph) + (i === 1 ? b + b * sin(ph) : 0)); };
    const US = Array.from({ length:9 }, (_, i) => i / 8);
    const capBase = [O[0], 1.85, O[2]], capDir = [-A[0], 0, -A[2]], capProf = [[1.55, 0], [2.05, .3], [2.05, 3.0], [1.85, 3.4]];
    const P = cam({ az:0, el:22, F:110, tilt:TILT, fit:[...US.flatMap(u => [0, 90, 180, 270].map(ph => pt(u, ph))),
      ...[0, 90, 180, 270].map(a => [capBase[0] + capDir[0] * 3.4 + 2.05 * cos(a), 1.85 + 2.05 * sin(a), capBase[2] + capDir[2] * 3.4]) ] });
    const secs = US.map(u => Array.from({ length:20 }, (_, j) => P(pt(u, j * 18))));
    const sil = envelope(secs.slice(1).map((sc, i) => hull([...secs[i], ...sc])), .4);
    const phL = Math.atan2(LIGHT[1], dot(B, LIGHT)) * 180 / PI, phV = Math.atan2(P.V[1], dot(B, P.V)) * 180 / PI;
    const ts = (p0, p1, u0 = 0, u1 = 1, n = 8) => inset([...Array.from({ length:n + 1 }, (_, i) => P(pt(u0 + (u1 - u0) * i / n, p0))),
      ...Array.from({ length:n + 1 }, (_, i) => P(pt(u1 - (u1 - u0) * i / n, p1)))], sil);
    const C = rev(P, capBase, capDir, capProf);
    const LS = (R, w = 44) => [max(-86, R.aL - w), min(86, R.aL + w)], DS = (R, w = 46) => R.aL < 0 ? [min(86, R.aL + w), 86] : [-86, max(-86, R.aL - w)];
    const top = (u, d = 0) => P(pt(u, phL + d));
    fin('gw_kezkrem', { hu:'Kézkrém', en:'small hand cream tube lying diagonally with a round flip cap', tilt:TILT, shapes:[
      pth('cream', 'base', [sil]),                                                           // tubus
      dpth('cream', 'light', [ts(phL - 18, min(phV + 86, phL + 42))]),                         // fény felőli (felső) felszín
      dpth('cream', 'dark', [ts(phV - 86, phV - 6)]),                                         // árnyékos alsó oldal
      dpth('cream', 'line', [ts(phV - 86, phV - 52)], { o:.45 }),                              // legsötétebb élsáv
      det('purple', 'base', ts(phV - 86, phV + 86, .56, .74)),                                 // színes nyomott sáv
      det('cream', 'dark', ts(phV - 86, phV + 86, .93, 1), { o:.85 }),                          // lapított, bordázott vég
      dpth('cream', 'line', [.945, .97, .995].map(u => band([P(pt(u, phV - 80)), P(pt(u, phV)), P(pt(u, phV + 80))], .3 * P.k, false)), { o:.6 }),
      lin('leaf', 'dark', [top(.14), top(.28), top(.42)], .42 * P.k),                            // levendula szára
      dpth('purple', 'base', [[.26, 24], [.33, -18], [.4, 22], [.45, -16], [.5, 4]].map(([u, d]) => circ(...top(u, d), .55 * P.k, 8, .38 * P.k))),   // levendula-virágok
      face('purple', 'base', C.sil),                                                          // kerek pattintós kupak
      det('purple', 'light', C.strip(...LS(C), 0, 3.4)),
      det('purple', 'dark', C.strip(...DS(C), 0, 3.4)),
      dpth('purple', 'line', [band(C.ring(2.05, 1.5, -84, 84, 10), .35 * P.k, false)], { o:.6 }),   // pattintás vonala
      face('purple', 'light', C.full(1.85, 3.4, 16)),                                         // a kupak lapja
      shine(ts(phL + 6, phL + 22, .1, .54), .5),
    ] });
  }

  // ============================================================================================
  //  7. Szemeteszsák – sötétzöld zsáktekercs, előtte egy letekert zsák behúzó-zsinórral
  // ============================================================================================
  {
    const TILT = -10, R = 4.2, HX = 8.0, ZF = 15.6;
    const P = cam({ az:22, el:26, F:140, tilt:TILT, fit:[...[-HX, HX].flatMap(x => [0, 90, 180, 270].map(a => [x, R + R * sin(a), R * cos(a)])), [-9.2, 0, ZF + 2.6], [9.2, 0, ZF + 2.6]] });
    const RL = rev(P, [-HX, R, 0], [1, 0, 0], [[R, 0], [R, 2 * HX]]);
    const LS = (Q, w = 42) => [max(-86, Q.aL - w), min(86, Q.aL + w)], DS = (Q, w = 44) => Q.aL < 0 ? [min(86, Q.aL + w), 86] : [-86, max(-86, Q.aL - w)];
    const G = (x, z) => P([x, 0, z]);
    const sheet = [G(-8.2, 1.0), G(-8.8, 8.0), G(-8.4, ZF - .4), ...Array.from({ length:9 }, (_, i) => G(-8.4 + 16.8 * i / 8, ZF + .55 * Math.sin(i * 1.3))),
      G(8.6, 8.0), G(8.2, 1.0)];
    const hem = [G(-8.5, ZF - 1.7), ...Array.from({ length:9 }, (_, i) => G(-8.4 + 16.8 * i / 8, ZF + .55 * Math.sin(i * 1.3))), G(8.4, ZF - 1.7)];
    const loop = [...circ(.8, ZF + 2.4, 1.7, 14, .95).map(([x, z]) => G(x, z)), G(.8 + 1.7, ZF + 2.4)];
    const spiral = band(Array.from({ length:34 }, (_, i) => RL.at(.8 + 3.1 * i / 33, 2 * HX, i * 24)), .26 * P.k, false);
    fin('gw_szemeteszsak', { hu:'Szemeteszsák', en:'roll of dark green garbage bags with one bag unrolled and a drawstring', tilt:TILT, shapes:[
      face('leaf', 'dark', sheet),                                                            // letekert zsák
      det('leaf', 'base', inset([G(-6.8, 3.0), G(-3.0, 3.6), G(-3.8, ZF - 1.4), G(-7.4, ZF - 1.6)], sheet, .7), { o:.8 }),   // fény a fólián
      dpth('leaf', 'line', [band([G(1.0, 2.6), G(2.2, 7.4), G(1.4, ZF - 1.8)], .45 * P.k, false), band([G(5.4, 3.4), G(6.2, 8.6), G(5.2, ZF - 1.8)], .4 * P.k, false)], { o:.5 }),   // gyűrődések
      det('leaf', 'base', inset(hem, sheet, .5), { o:.75 }),                                   // behajtott szegély
      dpth('honey', 'base', [band(Array.from({ length:9 }, (_, i) => G(-7.8 + 15.6 * i / 8, ZF - .8 + .4 * Math.sin(i * 1.3))), .62 * P.k, false), band([G(.3, ZF - .5), G(.6, ZF + 1.5)], .5 * P.k, false)]),   // behúzó-zsinór a szegélyben
      pth('honey', 'base', [band(loop, .55 * P.k, true)]),                                     // kihúzott zsinór-hurok
      pth('leaf', 'dark', [RL.sil]),                                                           // zsáktekercs
      det('leaf', 'base', RL.strip(...LS(RL), 0, 2 * HX)),
      det('leaf', 'line', RL.strip(...DS(RL), 0, 2 * HX), { o:.6 }),
      face('leaf', 'base', RL.full(R, 2 * HX, 20)),                                            // a tekercs vágott vége
      dpth('leaf', 'line', [spiral], { o:.7 }),                                                // feltekert rétegek
      det('dark', 'base', RL.full(.75, 2 * HX + .05, 10)),                                      // a tekercs lyuka
      shine([RL.at(R + .02, 2.2, -62), RL.at(R + .02, 2.2, -50), RL.at(R + .02, 13.4, -50), RL.at(R + .02, 13.4, -62)], .45),
      shine(inset([G(-6.6, 4.2), G(-5.4, 4.4), G(-6.0, 9.8), G(-7.0, 9.6)], sheet, .8), .3),
    ] });
  }

  // ============================================================================================
  //  8. Fürdőszoba-tisztító – pisztolyos szórófejes flakon rózsaszín-magenta folyadékkal, a fúvókánál habbuborékok
  // ============================================================================================
  {
    const TILT = 10, EZ = .62, LVL = 12.8, NK = 19.4;
    const prof = [[3.9, 0], [4.3, .5], [4.4, 1.7], [4.3, 6.6], [3.55, 9.2], [3.7, 11.0], [4.25, 13.2], [4.0, 15.6], [3.0, 17.4], [1.75, 18.6], [1.7, NK]];
    const head = [[-7.0, 22.4], [-6.4, 20.7], [-2.4, 19.9], [1.7, 19.7], [2.5, 20.8], [2.7, 25.0], [1.4, 25.6], [-5.6, 25.4], [-7.1, 24.6]];
    const trig = [[-2.0, 21.4], [-5.0, 21.2], [-5.3, 17.2], [-4.2, 16.0], [-3.0, 16.5], [-3.2, 20.1], [-2.0, 20.3]];
    const noz = [[-9.6, 22.7], [-7.0, 22.9], [-7.0, 24.3], [-9.6, 24.1]];
    const P = cam({ az:14, el:16, F:130, tilt:TILT, fit:[...Array.from({ length:12 }, (_, i) => [4.4 * sin(i * 30), 0, 4.4 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .4, NK, z * .4]]),
      [-13.8, 29.6, 0], [2.7, 25.6, 0], [-9.6, 16.0, 0]] });
    const L = rev(P, [0, 0, 0], [0, 1, 0], prof, { ez:EZ }), k = P.k;
    const E = extrude(P, head, -1.6, 1.6), N = extrude(P, noz, -1.0, 1.0), cl = rev(P, [0, 18.2, 0], [0, 1, 0], [[2.0, 0], [2.0, 1.6]]);
    const bub = [[-11.4, 27.0, 1.7], [-13.6, 24.6, 1.15], [-10.2, 30.4, 1.0], [-14.4, 28.6, .75], [-8.4, 27.8, .7]].map(([x, y, r]) => circ(0, 0, r, 12).map(([dx, dy]) => P([x + dx, y + dy, 0])));
    fin('gw_furdotisztito', { hu:'Fürdőszoba-tisztító', en:'trigger spray bottle with pink cleaner and foam bubbles', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                           // áttetsző flakon
      det('glass', 'dark', L.strip(34, 88, LVL, 17.4)),
      det('pink', 'base', L.strip(-88, 88, .5, LVL, 12)),                                       // rózsaszín tisztítószer
      det('pink', 'light', L.strip(-88, -50, .5, LVL)),
      det('pink', 'dark', L.strip(34, 88, .5, LVL)),
      det('pink', 'line', L.strip(70, 88, .5, LVL), { o:.35 }),                                 // legsötétebb élsáv
      det('pink', 'light', L.full(L.rAt(LVL) - .25, LVL, 18), { o:.9 }),                        // a folyadék felszíne
      lin('glass', 'line', [P([.2, 1.4, 0]), P([.2, 17.6, 0])], .5 * k, { o:.5 }),              // felszívó cső
      face('white', 'base', cl.sil),                                                            // gallér
      pth('white', 'base', [E.sil]),                                                            // szórófej
      det('white', 'base', E.front),
      dpth('white', 'light', E.tone('light')),
      dpth('white', 'dark', [...E.tone('dark'), ...E.tone('line')]),
      face('pink', 'dark', trig.map(([x, y]) => P([x, y, 1.1]))),                               // ravasz
      pth('pink', 'dark', [N.sil]),                                                             // fúvóka
      pth('white', 'light', bub.slice(0, 3)),                                                   // habbuborékok
      dpth('glass', 'base', bub.slice(3), { o:.85 }),
      shine([L.on(-66, 2.0), L.on(-58, 2.0), L.on(-58, 15.0), L.on(-66, 15.0)], .55),
    ] });
  }

  // ============================================================================================
  //  9. Kávékapszula – három színes alumínium kapszula (kúpos pohár, széles peremmel); az elülső a fólia-tetejét mutatja
  // ============================================================================================
  {
    const TILT = 10, prof = [[1.5, 0], [1.85, .12], [1.85, .36], [1.62, .52], [1.2, 1.7], [1.0, 2.25], [.62, 2.66], [.3, 2.8]];
    const TIP = [0, -.3, -.95], RIM = [.1, 2.3, 4.3];
    const P = cam({ az:0, el:30, F:90, tilt:TILT, fit:[[-3.2, 0, -1.6], [3.2, 0, -2.4]].flatMap(([cx, , cz]) => [0, 90, 180, 270].flatMap(a => [[cx + 1.85 * sin(a), 0, cz + 1.85 * cos(a)], [cx + .5 * sin(a), 2.8, cz + .5 * cos(a)]]))
      .concat([0, 90, 180, 270].map(a => [RIM[0] + 1.9 * sin(a), RIM[1] + 1.9 * cos(a) * .35, RIM[2] + 1.9 * cos(a) * .94])) });
    const A = rev(P, [-3.2, 0, -1.6], [0, 1, 0], prof), Bc = rev(P, [3.2, 0, -2.4], [0, 1, 0], prof);
    const Cc = rev(P, RIM, TIP, prof, { hull:true });
    const LS = (Q, w = 44) => [max(-86, Q.aL - w), min(86, Q.aL + w)], DS = (Q, w = 46) => Q.aL < 0 ? [min(86, Q.aL + w), 86] : [-86, max(-86, Q.aL - w)];
    fin('gw_kavekapszula', { hu:'Kávékapszula', en:'three colourful aluminium coffee capsules, one showing its foil top', tilt:TILT, shapes:[
      pth('purple', 'base', [A.sil]),                                                           // lila kapszula
      det('purple', 'light', A.strip(...LS(A), 0, 2.8)),
      det('purple', 'dark', A.strip(...DS(A), 0, 2.8)),
      det('purple', 'line', A.strip(-88, 88, 0, .36, 10), { o:.5 }),                             // a perem sávja
      face('purple', 'light', A.full(.3, 2.8, 12)),                                             // a kapszula zárt teteje
      pth('gold', 'base', [Bc.sil]),                                                             // arany kapszula
      det('gold', 'light', Bc.strip(...LS(Bc), 0, 2.8)),
      det('gold', 'dark', Bc.strip(...DS(Bc), 0, 2.8)),
      det('gold', 'line', Bc.strip(-88, 88, 0, .36, 10), { o:.5 }),
      face('gold', 'light', Bc.full(.3, 2.8, 12)),
      pth('berry', 'base', [Cc.sil]),                                                            // eldőlt kapszula
      det('berry', 'dark', Cc.strip(...DS(Cc), 0, 2.8)),
      det('berry', 'light', Cc.strip(...LS(Cc, 36), .36, 2.8)),
      face('steel', 'light', Cc.full(1.55, .1, 18)),                                            // alufólia-tető
      dpth('steel', 'dark', [1.15, .65].map(r => band([...Cc.full(r, .08, 14), Cc.full(r, .08, 14)[0]], .2 * P.k, false)), { o:.6 }),   // domborított gyűrűk
      shine([A.at(1.7, .6, -66), A.at(1.7, .6, -50), A.at(1.1, 2.1, -50), A.at(1.1, 2.1, -66)], .5),
      shine([Cc.at(1.6, .5, Cc.aL - 8), Cc.at(1.6, .5, Cc.aL + 8), Cc.at(.9, 2.2, Cc.aL + 8), Cc.at(.9, 2.2, Cc.aL - 8)], .35),
    ] });
  }

  // ============================================================================================
  //  10. Sampon – magas, ovális flakon álló pattintós (flip-top) kupakkal, gyógynövényes zöld, levél-képpel
  // ============================================================================================
  {
    const TILT = 10, EZ = .52, TOP = 18.4, CAP = 22.0;
    const prof = [[3.2, 0], [3.5, .5], [3.55, 1.6], [3.55, 13.2], [3.35, 15.4], [2.85, 17.3], [2.45, TOP]];
    const capP = [[2.5, TOP], [2.6, TOP + .35], [2.6, CAP - .5], [2.3, CAP]];
    const P = cam({ az:0, el:16, F:120, tilt:TILT, fit:Array.from({ length:12 }, (_, i) => [3.55 * sin(i * 30), 0, 3.55 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .7, CAP, z * .7]]) });
    const L = rev(P, [0, 0, 0], [0, 1, 0], prof, { ez:EZ }), C = rev(P, [0, 0, 0], [0, 1, 0], capP, { ez:EZ }), k = P.k;
    const lf1 = leafPts(-.6, 6.4, 64, 4.6, 2.6), lf2 = leafPts(.4, 6.0, 30, 3.8, 2.0);
    const W = pts => pts.map(([u, v]) => L.on(u * 9.5, v));
    fin('gw_sampon', { hu:'Sampon', en:'tall oval shampoo bottle with a flip-top cap and a leaf picture', tilt:TILT, shapes:[
      pth('leaf', 'base', [L.sil]),                                                             // flakon
      det('leaf', 'light', L.strip(-88, -50, 0, TOP)),
      det('leaf', 'dark', L.strip(34, 88, 0, TOP)),
      det('leaf', 'line', L.strip(70, 88, 0, TOP), { o:.35 }),                                   // legsötétebb élsáv
      det('cream', 'base', L.strip(-88, 88, 3.6, 11.6, 10)),                                      // üres címke
      det('cream', 'light', L.strip(-88, -52, 3.6, 11.6)),
      det('cream', 'dark', L.strip(36, 88, 3.6, 11.6)),
      det('leaf', 'base', W(lf1)),                                                               // levél-kép
      det('leaf', 'dark', W(lf2)),
      lin('leaf', 'line', [L.on(-6, 6.4), L.on(-1, 8.0), L.on(3, 9.8)], .28 * k, { o:.7 }),       // levél-ér
      det('white', 'base', C.strip(-88, 88, TOP, CAP, 10)),                                       // pattintós kupak
      det('white', 'light', C.strip(-88, -46, TOP, CAP)),
      det('white', 'dark', C.strip(36, 88, TOP, CAP)),
      dpth('white', 'line', [band(C.ring(2.6, TOP + 2.0, -84, 84, 10), .3 * k, false)], { o:.55 }),   // a fedél nyílásvonala
      det('white', 'dark', [C.on(-16, TOP + 1.2), C.on(16, TOP + 1.2), C.on(16, TOP + 2.0), C.on(-16, TOP + 2.0)], { o:.8 }),   // hüvelykujj-horony
      face('white', 'light', C.full(2.3, CAP, 18)),                                              // a kupak teteje
      shine([L.on(-66, 1.8), L.on(-58, 1.8), L.on(-58, 15.6), L.on(-66, 15.6)], .55),
    ] });
  }

  // ============================================================================================
  //  11. Ásványvíz – átlátszó, kékes PET palack bordás fogósávokkal, kék kupakkal; a címkén hegy és vízcsepp
  // ============================================================================================
  {
    const TILT = 12, LVL = 25.6, NK = 29.4, CAP = 32.4;
    const prof = [[3.5, 0], [4.1, .5], [4.35, 1.5], [4.35, 3.2], [3.85, 4.0], [4.35, 4.8], [3.85, 5.6], [4.35, 6.4], [4.35, 19.6], [3.9, 20.5],
      [4.35, 21.4], [4.35, 23.2], [4.0, 25.0], [3.1, 27.0], [1.9, 28.4], [1.6, NK], [1.95, NK], [1.95, NK + .5], [1.6, NK + .5], [1.6, NK + .9], [1.85, NK + .9], [1.85, CAP]];
    const P = cam({ az:0, el:14, F:150, tilt:TILT, fit:Array.from({ length:12 }, (_, i) => [4.35 * sin(i * 30), 0, 4.35 * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .42, CAP, z * .42]]) });
    const L = rev(P, [0, 0, 0], [0, 1, 0], prof), k = P.k;
    const mount = L.wrap([[-30, 10.4], [-19, 14.8], [-11, 12.4], [-2, 16.4], [8, 12.6], [18, 15.2], [30, 10.4]]);
    const snow = L.wrap([[-22.4, 13.0], [-19, 14.8], [-15.4, 13.0], [-17.2, 13.6], [-19.4, 12.8], [-20.8, 13.5]]);
    const snow2 = L.wrap([[-6.2, 14.4], [-2, 16.4], [2.2, 14.4], [-.2, 15.2], [-2.6, 14.2], [-4.2, 15.0]]);
    const drop = L.wrap([[0, 11.9], [3.4, 10.6], [3.0, 9.4], [0, 8.8], [-3.0, 9.4], [-3.4, 10.6]]);
    const ribs = [4.0, 5.6, 20.5].map(y => band(L.ring(L.rAt(y), y, -86, 86, 10), .32 * k, false));
    fin('gw_asvanyviz', { hu:'Ásványvíz', en:'clear PET water bottle with ribbed grip bands and a blue cap', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                           // átlátszó palack
      det('glass', 'dark', L.strip(34, 88, LVL, 28.4)),
      det('water', 'base', L.strip(-88, 88, .5, LVL, 14)),                                      // víz
      det('water', 'light', L.strip(-88, -52, .5, LVL)),
      det('water', 'dark', L.strip(34, 88, .5, LVL)),
      det('water', 'line', L.strip(70, 88, .5, LVL), { o:.3 }),                                 // legsötétebb élsáv
      det('water', 'light', L.full(L.rAt(LVL) - .3, LVL, 18), { o:.85 }),                        // a víz felszíne
      dpth('glass', 'dark', ribs, { o:.55 }),                                                   // bordás fogósávok
      det('white', 'base', L.strip(-88, 88, 8.4, 17.6, 12)),                                     // üres címke
      det('white', 'dark', L.strip(38, 88, 8.4, 17.6)),
      det('blue', 'base', [...mount, L.on(30, 10.2), L.on(-30, 10.2)]),                          // hegy-kép
      dpth('white', 'light', [snow, snow2], { o:.95 }),                                          // hósapkák
      det('water', 'base', drop),                                                                // vízcsepp
      det('glass', 'dark', L.strip(-88, 88, NK, NK + .5, 8)),                                     // nyakgyűrű
      det('blue', 'base', L.strip(-88, 88, NK + .9, CAP, 10)),                                    // kupak
      dpth('blue', 'dark', [-64, -38, -12, 14, 40, 66].map(a => band([L.on(a, NK + 1.1), L.on(a, CAP - .2)], .34 * k, false))),   // recézés
      face('blue', 'light', L.full(1.85, CAP, 16)),                                              // a kupak teteje
      shine([L.on(-68, 2.0), L.on(-60, 2.0), L.on(-60, 24.4), L.on(-68, 24.4)], .5),
    ] });
  }

  // ============================================================================================
  //  12. Póló – gondosan összehajtott póló (bordás nyakkal, hajtásokkal), a mellrészén kis levél-nyomat
  // ============================================================================================
  {
    const TILT = -12, X = 10, Z = 13, H = 3.4, SH = 3.9;
    const P = cam({ az:22, el:52, F:150, tilt:TILT, fit:corners(-X, X, 0, H, -Z, Z) });
    const T = (x, z) => P([x, H, z]), q = (x, y, z) => P([x, y, z]);
    const top = [T(-X + 3.4, -Z), T(X - 3.4, -Z), T(X, -Z + 3.2), T(X, Z), T(-X, Z), T(-X, -Z + 3.2)];
    const front = [q(-X, 0, Z), q(X, 0, Z), q(X, H, Z), q(-X, H, Z)], right = [q(X, 0, Z), q(X, 0, -Z + 3.2), q(X, H, -Z + 3.2), q(X, H, Z)];
    const neck = Array.from({ length:13 }, (_, i) => { const a = i * 15; return T(3.6 * cos(a), -Z + 3.6 * sin(a)); });
    const rib = band([...neck], 1.5 * P.k, false);
    const hem = Array.from({ length:7 }, (_, i) => band([T(-7.4 + 2.5 * i, Z - 1.6), T(-6.2 + 2.5 * i, Z - 1.6)], .32 * P.k, false));
    const lf = leafPts(-4.2, -3.2, -44, 4.4, 2.4).map(([x, z]) => T(x, z));
    fin('gw_polo', { hu:'Póló', en:'neatly folded T-shirt with a small leaf print', tilt:TILT, shapes:[
      face('grass', 'base', front),                                                             // a hajtogatott csomag eleje
      face('grass', 'dark', right),                                                             // oldala
      det('grass', 'line', inset([q(X, 0, Z), q(X, .9, Z), q(X, .9, -Z + 3.2), q(X, 0, -Z + 3.2)], right, .4), { o:.5 }),   // legsötétebb élsáv
      dpth('grass', 'dark', [band([q(-X, 1.2, Z), q(X, 1.2, Z)], .3 * P.k, false), band([q(-X, 2.3, Z), q(X, 2.3, Z)], .3 * P.k, false),
        band([q(X, 1.7, Z), q(X, 1.7, -Z + 3.2)], .3 * P.k, false)], { o:.55 }),                 // a hajtott rétegek éle
      face('grass', 'light', top),                                                              // a póló felső lapja
      dpth('grass', 'base', [band([T(-5.6, -Z + 2.4), T(-5.8, Z - .6)], .45 * P.k, false), band([T(5.4, -Z + 2.4), T(5.6, Z - .6)], .45 * P.k, false)], { o:.7 }),   // behajtott ujjak vonala
      dpth('grass', 'base', [band([T(-X + 3.4, -Z), T(-X, -Z + 3.2)], .5 * P.k, false), band([T(X - 3.4, -Z), T(X, -Z + 3.2)], .5 * P.k, false)], { o:.8 }),   // vállhajtás
      det('grass', 'line', [...neck, T(3.6, -Z)], { o:.85 }),                                    // a nyakkivágás belseje
      pth('grass', 'base', [rib]),                                                               // bordás nyakpánt
      dpth('grass', 'dark', Array.from({ length:9 }, (_, i) => { const a = 12 + i * 19;
        return band([T(3.0 * cos(a), -Z + 3.0 * sin(a)), T(4.2 * cos(a), -Z + 4.2 * sin(a))], .24 * P.k, false); }), { o:.6 }),   // bordák
      face('leaf', 'base', lf),                                                                  // levél-nyomat
      lin('leaf', 'line', [T(-4.0, -3.4), T(-2.4, -4.9), T(-1.2, -6.1)], .26 * P.k, { o:.7 }),
      dpth('grass', 'dark', hem, { o:.5 }),                                                      // szegés-öltések
      shine([T(-7.6, -6.0), T(-6.4, -6.2), T(-4.4, 7.0), T(-5.6, 7.2)], .35),
    ] });
  }

  // ============================================================================================
  //  13. Mosogatószer – karcsú, magas flakon húzható-nyomható (push-pull) kupakkal, citromsárga folyadékkal, tányér-képpel
  // ============================================================================================
  {
    const TILT = 10, EZ = .58, LVL = 16.6, TOP = 20.4, COL = 22.0, SP = 24.4;
    const prof = [[2.6, 0], [2.95, .4], [3.0, 1.5], [3.0, 9.6], [2.75, 12.6], [3.0, 15.4], [2.85, 17.8], [2.3, 19.4], [1.7, TOP]];
    const capP = [[1.75, TOP], [1.8, TOP + .3], [1.8, COL - .3], [1.6, COL]], spP = [[1.1, COL], [1.15, COL + .3], [1.15, SP - .35], [.95, SP]];
    const P = cam({ az:0, el:15, F:130, tilt:TILT, fit:Array.from({ length:12 }, (_, i) => [3.0 * sin(i * 30), 0, 3.0 * EZ * cos(i * 30)]).flatMap(([x, , z]) => [[x, 0, z], [x * .4, SP, z * .4]]) });
    const L = rev(P, [0, 0, 0], [0, 1, 0], prof, { ez:EZ }), C = rev(P, [0, 0, 0], [0, 1, 0], capP, { ez:EZ }), S = rev(P, [0, 0, 0], [0, 1, 0], spP, { ez:EZ }), k = P.k;
    const plate = Array.from({ length:16 }, (_, i) => { const a = i * 22.5; return L.on(34 * cos(a), 7.6 + 1.5 * sin(a)); });
    const plate2 = Array.from({ length:14 }, (_, i) => { const a = i * 25.7; return L.on(24 * cos(a), 7.6 + .95 * sin(a)); });
    const bub = [[-18, 11.0, .9], [-3, 12.4, .65], [10, 11.2, .5]].map(([a, y, r]) => circ(...L.on(a, y), r * k, 9));
    fin('gw_mosogatoszer', { hu:'Mosogatószer', en:'slim tall dish soap bottle with a push-pull cap and lemon-yellow liquid', tilt:TILT, shapes:[
      pth('glass', 'base', [L.sil]),                                                            // karcsú flakon
      det('glass', 'dark', L.strip(34, 88, LVL, 19.4)),
      det('gold', 'base', L.strip(-88, 88, .4, LVL, 12)),                                        // citromsárga mosogatószer
      det('gold', 'light', L.strip(-88, -52, .4, LVL)),
      det('gold', 'dark', L.strip(34, 88, .4, LVL)),
      det('gold', 'line', L.strip(70, 88, .4, LVL), { o:.35 }),                                  // legsötétebb élsáv
      det('gold', 'light', L.full(L.rAt(LVL) - .2, LVL, 16), { o:.9 }),                           // a folyadék felszíne
      det('white', 'base', plate),                                                               // tányér-kép
      det('white', 'light', plate2),
      dpth('sky', 'light', bub, { o:.95 }),                                                      // buborékok
      det('white', 'base', C.strip(-88, 88, TOP, COL, 10)),                                       // kupak-gallér
      det('white', 'light', C.strip(-88, -46, TOP, COL)),
      det('white', 'dark', C.strip(36, 88, TOP, COL)),
      det('white', 'base', S.strip(-88, 88, COL, SP, 10)),                                         // kihúzott adagoló csőr
      det('white', 'dark', S.strip(34, 88, COL, SP)),
      dpth('white', 'line', [band(S.ring(1.15, COL + .9, -84, 84, 8), .3 * k, false)], { o:.6 }),   // a kihúzás vonala
      face('white', 'light', S.full(.95, SP, 14)),                                               // a csőr teteje
      shine([L.on(-66, 1.6), L.on(-58, 1.6), L.on(-58, 17.6), L.on(-66, 17.6)], .55),
    ] });
  }

  // ============================================================================================
  //  14. Vágódeszka – fanyelű vágódeszka akasztólyukkal, látható erezettel és csorgató-horonnyal
  // ============================================================================================
  {
    const TILT = -12, ZB = .95;
    const prof = [[-9.6, 0], [9.6, 0], [11, 1.6], [11, 23.6], [10.2, 25.4], [7.4, 26.4], [4.0, 27.0], [3.2, 28.6], [2.6, 32.4], [1.2, 34.0],
      [-1.2, 34.0], [-2.6, 32.4], [-3.2, 28.6], [-4.0, 27.0], [-7.4, 26.4], [-10.2, 25.4], [-11, 23.6], [-11, 1.6]];
    const P = cam({ az:26, el:14, F:160, tilt:TILT, fit:prof.flatMap(([x, y]) => [[x, y, ZB], [x, y, -ZB]]) });
    const E = extrude(P, prof, -ZB, ZB), F = (x, y) => P([x, y, ZB]), k = P.k;
    const grain = [-8.2, -5.0, -1.6, 2.2, 6.0, 8.8].map((x, j) => band(Array.from({ length:9 }, (_, i) => { const y = 2.4 + 21.4 * i / 8;
      return F(x + .75 * Math.sin(y * .32 + j), y); }), (j % 2 ? .3 : .45) * k, false));
    const groove = band([...rrect(-9.2, 2.0, 9.2, 23.4, 1.6).map(([x, y]) => F(x, y)), rrect(-9.2, 2.0, 9.2, 23.4, 1.6).map(([x, y]) => F(x, y))[0]], .38 * k, false);
    const hole = circ(0, 30.6, 1.55, 14).map(([x, y]) => F(x, y)), holeB = circ(0, 30.6, 1.55, 14).map(([x, y]) => P([x, y, -ZB]));
    fin('gw_vagodeszka', { hu:'Vágódeszka', en:'wooden cutting board with a handle hole and wood grain', tilt:TILT, shapes:[
      pth('wood', 'base', [E.sil]),                                                             // deszka
      dpth('wood', 'light', E.tone('light')),                                                   // felső élek
      dpth('wood', 'dark', [...E.tone('dark'), ...E.tone('line')]),                              // jobb oldali él
      det('wood', 'base', E.front),                                                             // a lap eleje
      det('wood', 'light', inset([F(-10.4, 3.0), F(-3.2, 2.6), F(-4.6, 24.4), F(-10.0, 23.8)], E.front, .8), { o:.5 }),   // fény felőli lap
      dpth('wood', 'dark', grain, { o:.5 }),                                                    // erezet
      dpth('wood', 'dark', [circ(...F(4.6, 12.4), .85 * k, 10, .62 * k)], { o:.65 }),            // göcsörtök
      dpth('wood', 'line', [band(circ(...F(4.6, 12.4), 1.5 * k, 14, 1.1 * k).concat([circ(...F(4.6, 12.4), 1.5 * k, 14, 1.1 * k)[0]]), .3 * k, false)], { o:.4 }),
      dpth('wood', 'dark', [groove], { o:.6 }),                                                 // csorgató-horony
      det('wood', 'line', hole),                                                                // az akasztólyuk fala
      det('cream', 'light', clip(holeB, hole)),                                                 // átlátni a lyukon
      det('wood', 'line', inset([P([11, 1.6, -ZB]), P([11, 23.6, -ZB]), P([11, 23.6, -ZB + .5]), P([11, 1.6, -ZB + .5])], E.sil, .4), { o:.5 }),
      shine([F(-9.6, 5.0), F(-8.8, 5.0), F(-8.8, 21.0), F(-9.6, 21.0)], .35),
    ] });
  }

  // ============================================================================================
  //  15. Tisztítókendő – három összehajtott mikroszálas kendő (sárga, kék, zöld) egymáson, papírszalaggal átkötve
  // ============================================================================================
  {
    const TILT = -12, W = 6.5, D = 6.5, T = 2.0;
    const cl = [{ m:'leaf', cx:0, cz:0, y0:0 }, { m:'sky', cx:.8, cz:-.7, y0:T }, { m:'honey', cx:-.5, cz:.7, y0:2 * T }];
    const P = cam({ az:24, el:36, F:150, tilt:TILT, fit:cl.flatMap(c => corners(c.cx - W, c.cx + W, c.y0, c.y0 + T, c.cz - D, c.cz + D)) });
    const B = cl.map(c => box(P, c.cx - W, c.cx + W, c.y0, c.y0 + T, c.cz - D, c.cz + D));
    const top = cl[2], BX0 = -1.8, BX1 = 1.9;
    const bandTop = [[BX0, top.cz - D], [BX1, top.cz - D], [BX1, top.cz + D], [BX0, top.cz + D]].map(([x, z]) => P([x, top.y0 + T, z]));
    const bandFr = cl.map(c => [[BX0, c.y0], [BX1, c.y0], [BX1, c.y0 + T], [BX0, c.y0 + T]].map(([x, y]) => P([x, y, c.cz + D])));
    const folds = cl.map((c, i) => band([P([c.cx - W, c.y0 + T * .5, c.cz + D]), P([c.cx + W, c.y0 + T * .5, c.cz + D])], .26 * P.k, false));
    const dots = [];
    for(let r = 0; r < 4; r++) for(let j = 0; j < 4; j++) dots.push(circ(...P([top.cx - 4.4 + j * 3.0 + (r % 2 ? 1.5 : 0), top.y0 + T, top.cz - 4.4 + r * 3.0]), .3 * P.k, 6, .22 * P.k));
    fin('gw_tisztitokendo', { hu:'Tisztítókendő', en:'stack of three folded microfibre cloths with a paper band', tilt:TILT, shapes:[
      face('leaf', 'dark', B[0].right),                                                          // alsó (zöld) kendő
      face('leaf', 'base', B[0].front),
      face('sky', 'dark', B[1].right),                                                           // középső (kék) kendő
      face('sky', 'base', B[1].front),
      face('honey', 'dark', B[2].right),                                                         // felső (sárga) kendő
      face('honey', 'base', B[2].front),
      face('honey', 'light', B[2].top),
      dpth('dark', 'base', folds, { o:.18 }),                                                    // a hajtott élek
      dpth('honey', 'dark', dots, { o:.32 }),                                                    // mikroszálas szövet
      dpth('honey', 'dark', Array.from({ length:6 }, (_, i) => band([P([top.cx - 5.2 + i * 2.1, top.y0 + T, top.cz + D - 1.1]), P([top.cx - 4.2 + i * 2.1, top.y0 + T, top.cz + D - 1.1])], .28 * P.k, false)), { o:.55 }),   // szegés
      face('cardboard', 'light', bandTop),                                                       // papírszalag a tetején
      pth('cardboard', 'base', bandFr),                                                          // a szalag elöl
      dpth('cardboard', 'dark', [band([P([BX1, cl[0].y0, cl[0].cz + D]), P([BX1, cl[2].y0 + T, cl[2].cz + D])], .3 * P.k, false)], { o:.5 }),
      shine([P([top.cx - 5.0, top.y0 + T, top.cz - 3.4]), P([top.cx - 3.6, top.y0 + T, top.cz - 3.8]), P([top.cx - 2.2, top.y0 + T, top.cz + 3.4]), P([top.cx - 3.6, top.y0 + T, top.cz + 3.8])], .35),
    ] });
  }
})();
