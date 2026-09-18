// ============================================================
//  Matricák — „Mi van mögötte?" termékei (imp_ + azonosító), B szint (docs/rajzolas.md)
//  kávé · avokádó · okostelefon · vezeték nélküli fülhallgató · elektromos autó · rövid repülőút · 1 óra Facebookozás
//  Csak a tárgy: szöveg, szám, márka, logó és arc nélkül. A táblán ~90–130 px, mobilon ~48 px.
//  Valódi méretből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A kész rajzot a fin() illeszti a vászonra (perem + árnyék mellett is befér).
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

  // poláris „körte-forma” (avokádó): szélesség-modulált ellipszis – at(fok, sugár-szorzó) → pont
  const pear = (cx, cy, rx, ry, k, deg) => (th, r = 1) => {
    const a = rad(th), s = Math.sin(a), w = (s < 0 ? 1 - k * Math.pow(-s, 1.3) : 1) * r;
    const x = rx * w * Math.cos(a), y = ry * s * r;
    return [cx + x * cos(deg) - y * sin(deg), cy + x * sin(deg) + y * cos(deg)];
  };
  const ring2 = (at, a0, a1, r0, r1, n = 10) => [...Array.from({ length:n + 1 }, (_, i) => at(a0 + (a1 - a0) * i / n, r0)),
    ...Array.from({ length:n + 1 }, (_, i) => at(a1 - (a1 - a0) * i / n, r1))];
  const loop = (at, r = 1, n = 40) => Array.from({ length:n }, (_, i) => at(360 * i / n, r));

  // ============================================================================================
  //  1. Kávé – csészealjon álló, teli porcelán csésze: barna kávéfelszín világosabb cremával,
  //     fül jobbra, kiskanál az aljon, két gőzpamacs. (átm. 8 cm, m. 8,4 cm; csészealj 15,2 cm)
  // ============================================================================================
  {
    const TILT = 12, SR = 7.6, CR = 4.0, CY = 8.4;
    const sauc = [[3.4, 0], [6.2, .35], [7.2, 1.1], [SR, 1.8], [6.4, 1.9], [5.0, 1.3], [3.8, 1.0]];
    const cup = [[2.6, 1.6], [2.8, 2.1], [3.1, 3.4], [3.7, 6.2], [CR, CY], [3.75, CY]];
    const hd = t => [3.3 + 2.45 * cos(t), 5.3 + 2.45 * sin(t), 0];                       // fül: ív az x–y síkban
    const hdl = Array.from({ length:11 }, (_, i) => hd(-104 + 208 * i / 10));
    const steamPts = (dx, dz, h, w0, sg, n = 10) => { const up = [], dn = [];   // szalag: a középvonal két oldalra eltolva (a tube a kanyarban hurkolna)
      for(let i = 0; i <= n; i++){ const t = i / n, y = CY + .2 + h * t, x = dx + sg * .95 * Math.sin(rad(340 * t)), w = w0 * (1 - .12 * t) / 2;
        up.push(P([x - w, y, dz])); dn.push(P([x + w, y, dz])); }
      return [...up, ...dn.reverse()]; };
    const steam = (dx, dz) => [[dx - 1.4, CY + .6, dz], [dx + 1.4, CY + .6, dz], [dx - 1.4, CY + .6 + 5, dz], [dx + 1.4, CY + .6 + 5, dz]];
    const sp = [[-6.2, 2.0, 3.4], [-3.6, 2.1, 1.0], [-1.0, 2.2, -1.4]];                  // kiskanál nyele
    const P = cam({ az:14, el:30, F:170, tilt:TILT, fit:[...hdl, ...steam(1, 0), ...steam(-1.4, 1.4), ...sp,
      ...[0, 60, 120, 180, 240, 300].flatMap(a => [[SR * sin(a), 0, SR * cos(a)], [CR * sin(a), CY, CR * cos(a)]]) ] });
    const S = lathe(P, sauc), C = lathe(P, cup), k = P.k;
    const flat = (cx, cz, rx, rz, y, rot = 0, n = 12) => Array.from({ length:n }, (_, i) => { const a = 360 * i / n;
      const u = rx * cos(a), v = rz * sin(a); return P([cx + u * cos(rot) - v * sin(rot), y, cz + u * sin(rot) + v * cos(rot)]); });
    fin('imp_kave', { hu:'Egy csésze kávé', en:'full ceramic coffee cup on a saucer with a spoon and rising steam', tilt:TILT, shapes:[
      face('white', 'light', steamPts(1.9, .4, 5.4, 1.5, 1, 14)),                          // gőz: lágy S-szalag
      face('white', 'light', steamPts(-1.5, 1.6, 3.6, 1.3, 1, 12)),
      face('white', 'base', S.sil),                                                       // csészealj
      det('white', 'light', S.full(SR - .5, 1.8, 20), { o:.9 }),
      det('white', 'dark', S.strip(30, 96, 0, 1.8), { o:.8 }),
      face('steel', 'base', tube(smooth(sp.map(P), 3), 1.25 * k)),                        // kiskanál nyele
      face('steel', 'base', flat(-7.0, 4.4, 2.0, 1.35, 2.05, 42)),                        // kanálfej
      det('steel', 'light', flat(-7.0, 4.4, 1.35, .85, 2.15, 42), { o:.85 }),
      face('white', 'base', tube(hdl.map(P), 1.25 * k)),                                  // fül
      face('white', 'base', C.sil),                                                       // csésze
      det('white', 'light', C.strip(-100, -44, 1.6, CY)),
      det('white', 'dark', C.strip(34, 72, 1.6, CY), { o:.95 }),
      det('white', 'line', C.strip(72, 86, 1.6, CY), { o:.55 }),
      det('white', 'light', C.full(CR, CY, 18)),                                          // perem
      det('chocolate', 'base', C.full(3.55, CY - .45, 18)),                                // kávé
      det('wood', 'light', ring2((th, r) => { const p = C.at(3.55 * r, CY - .45, th); return p; }, -150, 120, .95, .62, 12), { o:.75 }),
      shine([C.on(-78, 2.6), C.on(-78, 6.6), C.on(-64, 6.9), C.on(-64, 2.9)], .45),
    ] });
  }

  // ============================================================================================
  //  2. Avokádó – egy egész (sötétzöld héj) és egy fél: halványzöld hús, sötét héjperem,
  //     nagy gömbölyű barna mag csillanással
  // ============================================================================================
  {
    const TILT = 10;
    const W = pear(31, 52, 17.5, 25, .46, -16), H = pear(68, 50, 18.5, 26, .44, 12);
    const st = (th, r = 1) => { const a = rad(th); return [67.5 + 9.8 * r * Math.cos(a), 61 + 9.8 * r * Math.sin(a)]; };
    fin('imp_avokado', { hu:'Avokádó', en:'one whole dark green avocado and one halved avocado showing the pale flesh and the round pit', tilt:TILT, shapes:[
      face('leaf', 'base', loop(W)),                                                      // egész avokádó
      det('leaf', 'light', ring2(W, -168, -38, .99, .66), { o:.95 }),
      det('leaf', 'dark', ring2(W, 8, 118, .99, .72), { o:.9 }),
      det('leaf', 'line', ring2(W, 22, 86, .99, .86), { o:.45 }),
      shine([...ring2(W, -146, -104, .84, .66, 6)], .5),
      face('leaf', 'base', loop(H)),                                                      // félbevágott: héj
      det('leaf', 'light', ring2(H, -170, -50, .99, .84), { o:.9 }),
      det('leaf', 'dark', ring2(H, 10, 120, .99, .84), { o:.85 }),
      det('grass', 'base', loop(H, .84)),                                                 // hús széle (sötétebb zöld)
      det('grass', 'light', loop(H, .74)),                                                // hús
      det('cream', 'base', loop(H, .62), { o:.75 }),                                      // a mag körüli halványabb hús
      face('wood', 'base', loop(st)),                                                     // mag
      det('wood', 'light', ring2(st, -172, -46, .96, .38), { o:.85 }),
      det('wood', 'dark', ring2(st, 4, 126, .96, .58), { o:.7 }),
      shine([...ring2(st, -150, -112, .78, .44, 6)], .55),
    ] });
  }

  // ============================================================================================
  //  3. Okostelefon – álló, elfordított telefon: vékony káva, színes ikonrács a képernyőn (betű nélkül),
  //     pirula-alakú kamerakivágás, oldalgombok, a hátlap kameradudora a hátsó él mentén
  // ============================================================================================
  {
    const TILT = -24, X = 3.6, Y1 = 14.6, Z = .42, BZ = -Z - .38;
    const P = cam({ az:32, el:12, F:150, tilt:TILT, fit:corners(-X, X, 0, Y1, BZ, Z) });
    const b = box(P, -X, X, 0, Y1, -Z, Z), F = (x, y) => P([x, y, Z]);
    const app = (c, r) => rrect(-2.62 + c * 1.78, 11.5 - r * 2.0, -1.38 + c * 1.78, 12.74 - r * 2.0, .36, ([u, v]) => F(u, v));
    const grp = list => list.map(([c, r]) => app(c, r));
    const side = (y0, y1) => [P([X, y0, -Z + .06]), P([X, y0, Z - .14]), P([X, y1, Z - .14]), P([X, y1, -Z + .06])];
    const dock = [0, 1, 2, 3].map(c => rrect(-2.62 + c * 1.78, 1.4, -1.38 + c * 1.78, 2.64, .36, ([u, v]) => F(u, v)));
    fin('imp_okostelefon', { hu:'Okostelefon', en:'modern smartphone standing tilted, thin bezel, colourful app grid on the screen', tilt:TILT, shapes:[
      face('steel', 'dark', [P([.9, Y1 - 1.1, BZ]), P([X, Y1 - 1.1, BZ]), P([X, Y1 - 4.6, BZ]), P([.9, Y1 - 4.6, BZ])]),   // kameradudor a hátlapon
      face('dark', 'dark', b.right),                                                      // váz
      face('dark', 'base', b.front),
      face('dark', 'light', b.top),
      det('dark', 'line', inset([P([X, 0, -Z]), P([X, 0, -Z + .5]), P([X, Y1, -Z + .5]), P([X, Y1, -Z])], b.sil, .5), { o:.5 }),
      det('sky', 'base', rrect(-3.12, .5, 3.12, Y1 - .5, .85, ([u, v]) => F(u, v), 3)),   // képernyő
      det('sky', 'light', rrect(-3.12, 8.6, 3.12, Y1 - .5, .85, ([u, v]) => F(u, v), 3), { o:.6 }),
      dpth('honey', 'base', grp([[0, 0], [2, 1], [1, 2], [3, 3], [0, 4]])),                // ikonrács (betű és felirat nélkül)
      dpth('leaf', 'base', grp([[1, 0], [3, 1], [0, 2], [2, 3], [1, 4]])),
      dpth('pink', 'base', grp([[2, 0], [0, 1], [3, 2], [1, 3], [2, 4]])),
      dpth('purple', 'base', grp([[3, 0], [1, 1], [2, 2], [0, 3], [3, 4]])),
      dpth('white', 'light', [rrect(-2.95, 1.0, 2.95, 3.05, .8, ([u, v]) => F(u, v), 3)], { o:.4 }),   // dokk
      dpth('steel', 'base', dock, { o:.85 }),
      det('dark', 'line', rrect(-.9, Y1 - 1.9, .9, Y1 - 1.25, .32, ([u, v]) => F(u, v), 3)),   // kamerakivágás
      dpth('steel', 'base', [side(9.4, 11.3), side(6.8, 8.7), side(4.9, 5.9)]),           // oldalgombok
      shine([F(-2.9, 4.0), F(-1.4, 4.0), F(.9, Y1 - 1.0), F(-.6, Y1 - 1.0)], .22),
    ] });
  }

  // ============================================================================================
  //  4. Vezeték nélküli fülhallgató – két pálcikás fülhallgató (tojásdad fej + rövid szár, sötét fülgumi)
  //     és mellettük a nyitott töltőtok két mélyedéssel. NEM fejhallgató: nincs fejpánt, kagyló, kábel.
  // ============================================================================================
  {
    const TILT = -10, CW = 3.1, CH = 2.7, CD = 2.4, LH = 2.3, LT = .55, A = 56;
    const up = [0, cos(A), -sin(A)], nr = [0, sin(A), cos(A)];
    const lid = (x, v, n) => [x, CH + up[1] * v + nr[1] * n, -CD + up[2] * v + nr[2] * n];
    const B1 = { c:[5.9, 3.1, 1.2], a:14 }, B2 = { c:[9.3, 2.9, -1.1], a:-5 };            // fej középpontja, szár dőlése
    const SL = 3.0, HR = .88;
    const P = cam({ az:24, el:22, F:160, tilt:TILT, fit:[...corners(-CW, CW, 0, CH, -CD, CD), lid(-CW, LH, LT), lid(CW, LH, LT),
      [B2.c[0] + 1.6, 0, B2.c[2]], [B1.c[0] - 1.2, 4.4, B1.c[2]] ] });
    const L3 = (x, v, n = LT) => P(lid(x, v, n)), b = box(P, -CW, CW, 0, CH, -CD, CD), T = (x, z) => P([x, CH, z]);
    const well = (cx, cz) => Array.from({ length:12 }, (_, i) => { const a = 360 * i / 12; return T(cx + .6 * cos(a), cz + .48 * sin(a)); });
    // egy fülhallgató: kiálló fülcső + tojásdad fej + lefelé futó szár (három külön lap, köztük látszik a kontúr)
    const one = B => { const d = [sin(B.a), -cos(B.a), 0], nz = [-.52, .70, .49];
      const st = acyl(P, [0, 1, 2].map(k => B.c[k] + d[k] * .35), d, .46, SL, 8);
      const nose = acyl(P, [0, 1, 2].map(k => B.c[k] + nz[k] * .2), nz, .5, 1.0, 10);
      const head = Array.from({ length:16 }, (_, i) => { const a = 360 * i / 16, u = HR * cos(a), v = HR * 1.05 * sin(a);
        return P([B.c[0] + u * cos(B.a) - v * sin(B.a), B.c[1] + u * sin(B.a) + v * cos(B.a), B.c[2] + .1]); });
      return { head, stem:st.sil, nose:nose.sil, mesh:nose.ring(1.0), tip:st.ring(SL * .96),
        lit:Array.from({ length:12 }, (_, i) => { const a = 360 * i / 12;
          return P([B.c[0] - .3 + .38 * cos(a), B.c[1] + .1 + .34 * sin(a), B.c[2] + .8]); }) }; };
    const b1 = one(B1), b2 = one(B2);
    fin('imp_fulhallgato', { hu:'Vezeték nélküli fülhallgató', en:'pair of true-wireless earbuds with short stems next to their small open charging case', tilt:TILT, shapes:[
      face('white', 'base', [L3(-CW, 0, 0), L3(CW, 0, 0), L3(CW, LH, 0), L3(-CW, LH, 0)]),   // tokfedél (hátlap)
      face('white', 'light', [L3(-CW, LH, 0), L3(CW, LH, 0), L3(CW, LH), L3(-CW, LH)]),      // fedél éle
      face('white', 'dark', [L3(CW, 0, 0), L3(CW, 0), L3(CW, LH), L3(CW, LH, 0)]),           // fedél oldala
      det('steel', 'base', [L3(-CW + .25, .35), L3(CW - .25, .35), L3(CW - .25, LH - .3), L3(-CW + .25, LH - .3)]),   // fedél belseje
      face('white', 'dark', b.right),                                                    // tok teste
      face('white', 'base', b.front),
      face('white', 'light', b.top),
      det('white', 'line', inset([P([CW, 0, -CD]), P([CW, 0, -CD + .5]), P([CW, CH, -CD + .5]), P([CW, CH, -CD])], b.sil, .5), { o:.5 }),
      dpth('steel', 'dark', [well(-1.3, .05), well(1.3, .05)]),                           // két mélyedés a tokban
      det('leaf', 'light', circ(...T(0, -1.45), .2 * P.k, 8)),                            // töltésjelző
      face('white', 'base', b1.stem), face('white', 'base', b1.nose), face('white', 'base', b1.head),   // 1. fülhallgató: szár, fülcső, fej
      face('white', 'base', b2.stem), face('white', 'base', b2.nose), face('white', 'base', b2.head),   // 2. fülhallgató
      dpth('steel', 'dark', [b1.mesh, b2.mesh], { o:.95 }),                                // szűrő a fülcső végén
      dpth('white', 'light', [b1.lit, b2.lit], { o:.8 }),
      dpth('steel', 'line', [b1.tip, b2.tip], { o:.5 }),                                  // érintkezők a szár végén
      shine([P([-CW + .4, .5, CD]), P([-CW + 1.2, .5, CD]), P([-CW + 1.2, CH - .4, CD]), P([-CW + .4, CH - .4, CD])], .3),
    ] });
  }
  // ============================================================================================
  //  5. Elektromos autó – kis városi villanyautó 3/4-es elölnézetben: zárt (rács nélküli) orr,
  //     kerékjárati ívek, a bal első sárvédőn töltőnyílás dugó-jellel, bedugott töltőkábel
  // ============================================================================================
  {
    const TILT = -8, ZW = 72;                                                             // 3,8 m hosszú, 1,72 m széles, 1,52 m magas
    const arch = (cx, R, a0, a1, n = 8) => Array.from({ length:n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + R * cos(a), 16 + R * sin(a)]; });
    const prof = [[-180, 16], [-160, 16], ...arch(-118, 42, 180, 0), [-76, 16], [76, 16], ...arch(118, 42, 180, 0), [160, 16], [180, 24],
      [188, 44], [186, 70], [176, 82], [146, 88], [96, 96], [58, 124], [24, 148], [-44, 152], [-98, 146], [-128, 116], [-152, 98], [-174, 88], [-184, 62], [-186, 30]];
    const cab = [[-44, 66, ZW + 6], [-72, 34, ZW + 26], [-46, 12, ZW + 54], [12, 8, ZW + 62]];
    const P = cam({ az:19, el:17, F:900, tilt:TILT, fit:[...prof.map(([x, y]) => [x, y, ZW]), ...prof.map(([x, y]) => [x, y, -ZW]),
      ...cab, [118, 0, ZW], [-118, 0, ZW], [118, 78, ZW] ] });
    const E = extrude(P, prof, -ZW, ZW), k = P.k, F = (x, y) => P([x, y, ZW]);
    const disc = (cx, cy, r, z, n = 16) => Array.from({ length:n }, (_, i) => { const a = 360 * i / n; return P([cx + r * cos(a), cy + r * sin(a), z]); });
    const wf = disc(118, 36, 36, ZW + 2), wr = disc(-118, 36, 36, ZW + 2);
    const glass = [[54, 122], [24, 143], [-42, 147], [-94, 142], [-120, 116], [-16, 112], [40, 112]];
    const port = rrect(-86, 56, -54, 86, 6, ([u, v]) => F(u, v), 3);
    const plug = [rrect(-78, 62, -62, 74, 3, ([u, v]) => F(u, v), 2), rrect(-76, 74, -72, 80, 1.5, ([u, v]) => F(u, v), 1), rrect(-68, 74, -64, 80, 1.5, ([u, v]) => F(u, v), 1)];
    fin('imp_eauto', { hu:'Elektromos autó', en:'small modern electric car in three-quarter front view with a charging cable plugged into the side', tilt:TILT, shapes:[
      face('dark', 'base', wr), face('dark', 'base', wf),                                  // kerekek
      dpth('steel', 'base', [disc(-118, 36, 15, ZW + 3, 10), disc(118, 36, 15, ZW + 3, 10)]),
      face('teal', 'base', E.front),                                                       // oldal
      pth('teal', 'light', E.tone('light')),                                               // tető, motorháztető
      pth('teal', 'dark', E.tone('dark')),                                                 // orr és hátfal
      dpth('teal', 'line', E.tone('line'), { o:.5 }),
      det('dark', 'base', glass.map(([x, y]) => F(x, y))),                                 // üvegfelület
      dpth('sky', 'light', [[F(30, 140), F(-4, 140), F(-46, 114), F(-12, 114)]], { o:.35 }),
      det('cream', 'light', [F(152, 86), F(180, 76), F(184, 60), F(156, 68)]),             // fényszóró
      det('dark', 'base', port),                                                           // töltőnyílás
      dpth('cream', 'light', plug, { o:.95 }),                                             // dugó-jel (betű nélkül)
      face('steel', 'base', tube(smooth(cab.map(P), 4), 7 * k)),                           // töltőkábel
      face('steel', 'base', rrect(-14, -6, 22, 20, 5, ([u, v]) => P([u, 8 + v, ZW + 62]), 3)),   // csatlakozó a kábel végén
      shine([F(-150, 96), F(-120, 112), F(80, 108), F(96, 96)], .28),
    ] });
  }

  // ============================================================================================
  //  6. Rövid repülőút – utasszállító felülről, kissé 3/4-ben: hegyes orr, nyilazott szárnyak alattuk
  //     hajtóművekkel, vízszintes vezérsíkok, mézsárga függőleges vezérsík, ablaksor, rövid kondenzcsík
  // ============================================================================================
  {
    const TILT = 18, Y = -3;                                                               // 35 m hosszú, 34 m fesztávú gép
    const half = [[176, 0], [152, 11], [92, 20], [-100, 21], [-158, 13], [-176, 6]];        // a törzs félkörvonala felülnézetben
    const fus = [...half.map(([x, z]) => [x, 0, z]), ...half.slice(1, -1).reverse().map(([x, z]) => [x, 0, -z]), [-176, 0, -6]];
    const wing = sg => [[32, Y, sg * 18], [-38, Y, sg * 18], [-112, Y, sg * 166], [-70, Y, sg * 166]];
    const stab = sg => [[-140, Y, sg * 10], [-172, Y, sg * 10], [-184, Y, sg * 64], [-154, Y, sg * 64]];
    const vfin = [[-138, 4], [-110, 4], [-148, 66], [-170, 66]];                            // függőleges vezérsík (x–y sík)
    const pod = sg => Array.from({ length:14 }, (_, i) => { const a = 360 * i / 14; return [-18 + 28 * cos(a), Y - 7, sg * 90 + 10 * sin(a)]; });
    const trail = sg => [[-182, 2, sg * 7], [-258, 4, sg * 13], [-332, 6, sg * 20]];
    const P = cam({ az:24, el:60, F:2400, tilt:TILT, fit:[...fus, ...wing(1), ...wing(-1), ...stab(1), ...stab(-1), ...pod(1), ...pod(-1),
      ...trail(1), ...trail(-1), ...vfin.map(([x, y]) => [x, y, 0]) ] });
    const k = P.k, S = p => P(p);
    const strip = (z0, z1) => [...half.map(([x, z]) => P([x, .6, Math.max(-z, Math.min(z, z0))])), ...half.slice().reverse().map(([x, z]) => P([x, .6, Math.max(-z, Math.min(z, z1))]))];
    fin('imp_repulo', { hu:'Rövid repülőút', en:'passenger aeroplane seen from above in three-quarter view with swept wings, engines, tail fin and a short vapour trail', tilt:TILT, shapes:[
      face('white', 'light', [...trail(1).map(S), ...trail(-1).map(S).reverse()]),          // kondenzcsík
      face('white', 'dark', stab(-1).map(S)), face('white', 'dark', wing(-1).map(S)),       // túlsó vezérsík és szárny
      face('steel', 'dark', pod(-1).map(S)),                                                // túlsó hajtómű
      face('white', 'base', fus.map(S)),                                                    // törzs felülnézetben
      det('white', 'light', strip(-9, 5), { o:.95 }),                                        // megvilágított gerinc
      det('white', 'dark', strip(13, 24), { o:.85 }),                                        // árnyékos oldal
      dpth('dark', 'base', Array.from({ length:9 }, (_, i) => circ(...P([104 - i * 30, .8, 16]), 3.2 * k, 8)), { o:.85 }),   // ablaksor
      det('sky', 'dark', [P([164, .8, 4]), P([140, .8, 15]), P([118, .8, 13]), P([142, .8, -2]), P([160, .8, -6])]),          // pilótafülke ablaka
      face('white', 'base', wing(1).map(S)),                                                // közeli szárny
      det('white', 'dark', [P([-38, Y, 18]), P([-112, Y, 166]), P([-100, Y, 166]), P([-28, Y, 18])], { o:.6 }),
      face('steel', 'base', pod(1).map(S)),                                                 // közeli hajtómű
      det('dark', 'base', [P([2, Y - 7, 80]), P([10, Y - 7, 90]), P([2, Y - 7, 100]), P([-6, Y - 7, 90])], { o:.9 }),          // beömlő
      face('white', 'base', stab(1).map(S)),                                                // közeli vízszintes vezérsík
      face('honey', 'base', vfin.map(([x, y]) => P([x, y, 0]))),                             // függőleges vezérsík
      det('honey', 'light', [P([-136, 8, 0]), P([-122, 8, 0]), P([-154, 60, 0]), P([-164, 60, 0])], { o:.8 }),
      shine([P([60, 1, -14]), P([-40, 1, -16]), P([-40, 1, -8]), P([60, 1, -6])], .3),
    ] });
  }


  // ============================================================================================
  //  7. 1 óra Facebookozás – álló telefon közösségi hírfolyammal (profilkör, szövegsávok, képkocka,
  //     reakciósor) és egy lebegő szív-buborék a képernyő fölött. Se betű, se márkajel, se arc.
  // ============================================================================================
  {
    const TILT = -14, X = 3.6, Y1 = 14.6, Z = .42;
    const P = cam({ az:17, el:10, F:170, tilt:TILT, fit:[...corners(-X, X, 0, Y1, -Z, Z), [1.2, Y1 + 4.4, Z], [5.6, Y1 + 1.2, Z]] });
    const b = box(P, -X, X, 0, Y1, -Z, Z), F = (x, y) => P([x, y, Z]);
    const RR = (u0, v0, u1, v1, r) => rrect(u0, v0, u1, v1, r, ([u, v]) => F(u, v), 3);
    const bar = (v, w) => RR(-1.35, v, -1.35 + w, v + .3, .15);
    const heart = (cx, cy, sc, n = 20) => Array.from({ length:n }, (_, i) => { const t = rad(360 * i / n);
      return [cx + sc * Math.pow(Math.sin(t), 3), cy - sc * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]; });
    const bub = hull([...rrect(1.4, Y1 + .5, 5.6, Y1 + 4.2, 1.1, ([u, v]) => F(u, v), 4), F(1.7, Y1 + .2), F(2.5, Y1 + .1)]);
    fin('imp_facebook', { hu:'1 óra Facebookozás', en:'smartphone held upright showing a social feed with a floating like-heart bubble', tilt:TILT, shapes:[
      face('white', 'base', bub),                                                          // lebegő buborék
      det('pink', 'base', heart(3.5, Y1 + 2.35, 1.05).map(([u, v]) => F(u, v))),            // szív
      face('dark', 'dark', b.right),                                                       // váz
      face('dark', 'base', b.front),
      face('dark', 'light', b.top),
      det('dark', 'line', inset([P([X, 0, -Z]), P([X, 0, -Z + .5]), P([X, Y1, -Z + .5]), P([X, Y1, -Z])], b.sil, .5), { o:.5 }),
      det('paper', 'base', RR(-3.12, .5, 3.12, Y1 - .5, .85)),                              // képernyő
      det('sage', 'base', RR(-3.12, Y1 - 2.3, 3.12, Y1 - .5, .85), { o:.9 }),               // fejléc
      dpth('steel', 'base', [circ(...F(-2.1, Y1 - 1.4), .52 * P.k, 10), circ(...F(-2.1, 8.15), .52 * P.k, 10), circ(...F(-2.1, 2.5), .52 * P.k, 10)]),   // profilkörök
      dpth('steel', 'light', [bar(Y1 - 1.55, 2.6), bar(Y1 - 2.0, 1.7), bar(8.0, 2.7), bar(7.55, 1.8), bar(2.35, 2.6), bar(1.9, 1.6)]),   // szövegsávok
      det('sky', 'base', RR(-2.7, 3.6, 2.7, 7.1, .35)),                                     // képkocka a bejegyzésben
      dpth('leaf', 'base', [[F(-2.7, 5.0), F(-1.0, 6.5), F(.8, 4.9), F(2.7, 6.4), F(2.7, 3.6), F(-2.7, 3.6)]], { o:.95 }),
      det('honey', 'base', circ(...F(1.5, 6.4), .5 * P.k, 10), { o:.95 }),
      dpth('pink', 'base', [heart(-2.2, 3.05, .34).map(([u, v]) => F(u, v)), heart(-1.2, 3.05, .34).map(([u, v]) => F(u, v))], { o:.9 }),   // reakciósor
      dpth('steel', 'base', [[P([X, 9.4, -Z + .06]), P([X, 9.4, Z - .14]), P([X, 11.3, Z - .14]), P([X, 11.3, -Z + .06])]]),   // oldalgomb
      shine([F(-2.9, 4.4), F(-1.9, 4.4), F(-.2, Y1 - 3.0), F(-1.2, Y1 - 3.0)], .3),
    ] });
  }
})();
