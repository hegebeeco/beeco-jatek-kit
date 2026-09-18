// ============================================================
//  Matricák — tárgyak B szinten (docs/rajzolas.md): közlekedés, ruha, szabadidő, termékek
//  A „2075 – Vágod a zöld jövőt?" repülő matricái (fehér körben ~90–140 px) és tartalom-ikonok (48 px).
//  A rajz NEM árulja el, hogy a dolog káros vagy ökos: nincs piros X, zöld pipa, szöveg, szám, márka, logó, arc.
//  Valódi méretből (cm / m) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A kész rajzot a fin() illeszti a vászonra (perem + árnyék mellett is befér).
//  Render: node tools/art-render.js 2d web/js/art/art-things-b.js ki.png --skip things
//  A régi (A szintű) rajzok az art-things.js-ben voltak – onnan törölve, a név, emoji, hu, en változatlan.
// ============================================================
(function(){
  const { rad, camera, band } = ART.geo;
  const { hypot, max, min, abs, sqrt } = Math;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const r1 = n => Math.round(n * 10) / 10;

  // ---------------- 2D segédek (ugyanaz a készlet, mint az art-imp.js-ben) ----------------
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const pos = p => area(p) >= 0 ? p : [...p].reverse(), neg = p => area(p) < 0 ? p : [...p].reverse();   // körüljárás: lyukhoz ellentétes
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
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
  // konvex vágás (Sutherland–Hodgman): a subject sokszög cp-n belüli része
  function clip(subject, cp){
    const sg = Math.sign(area(cp)), inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){ const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); } }
    return out;
  }
  const circ = (cx, cy, r, n = 12, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => { const a = rad(a0 + 360 * i / n); return [cx + r * Math.cos(a), cy + ry * Math.sin(a)]; });
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // töröttvonal simítása (másodfokú görbék a felezőpontokon át)
  const smooth = (pts, n = 4) => pts.length < 3 ? pts : pts.slice(0, -2).flatMap((_, i) => {
    const a = i ? lerp(pts[i], pts[i + 1], .5) : pts[0], c = i === pts.length - 3 ? pts[i + 2] : lerp(pts[i + 1], pts[i + 2], .5);
    return Array.from({ length:n + 1 }, (_, j) => { const t = j / n; return lerp(lerp(a, pts[i + 1], t), lerp(pts[i + 1], c, t), t); }).slice(i ? 1 : 0);
  });
  // lekerekített téglalap (u, v síkban); a map vetíti a felületre
  const rrect = (u0, v0, u1, v1, r, map = p => p, n = 3) => [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]]
    .flatMap(([cu, cv, a0]) => Array.from({ length:n + 1 }, (_, i) => map([cu + r * cos(a0 + 90 * i / n), cv + r * sin(a0 + 90 * i / n)])));

  // ---------------- 3D segédek ----------------
  const norm = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function cam(o){ const P = camera(Object.assign({ span:80 }, o)), a = rad(o.az || 0), e = rad(o.el || 0);
    P.V = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; return P; }
  const corners = (x0, x1, y0, y1, z0, z1) => { const o = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) o.push([x, y, z]); return o; };
  // doboz látható lapjai (az > 0: eleje és jobb oldala látszik)
  function box(P, x0, x1, y0, y1, z0, z1){
    const c = (x, y, z) => P([x, y, z]);
    return { top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)], front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
      right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)], sil:hull(corners(x0, x1, y0, y1, z0, z1).map(P)) };
  }
  // forgástest: prof = [[r, y], …] alulról. Szög: 0 = elöl, −90 = bal szél, +90 = jobb szél
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
  // henger tetszőleges tengellyel: at(t, szög, r) a palást pontja; strip(t0, t1, a0, a1) = palást-sáv (tónushoz)
  function acyl(P, base, dir, r, len, n = 14){
    const d = norm(dir), u = norm(cross(d, abs(d[2]) > .9 ? [0, 1, 0] : [0, 0, 1])), w = cross(u, d);
    const pt = (t, a, rr = r) => P([0, 1, 2].map(k => base[k] + d[k] * t + rr * (Math.cos(rad(a)) * w[k] - Math.sin(rad(a)) * u[k])));
    const ring = (t, rr = r) => Array.from({ length:n }, (_, i) => pt(t, 360 * i / n, rr));
    const arcAt = (t, a0, a1, m = 5) => Array.from({ length:m + 1 }, (_, i) => pt(t, a0 + (a1 - a0) * i / m));
    const sil = hull([...ring(0), ...ring(len)]);
    const strip = (t0, t1, a0, a1) => inset([...arcAt(t0, a0, a1), ...arcAt(t1, a1, a0)], sil, .5);
    return { sil, top:ring(len), ring, at:pt, strip };
  }
  const LIGHT = norm([-0.5, 0.65, 0.55]);                 // fény: bal-fent-elöl (X jobbra, Y fel, Z a néző felé)
  const toneOf = n => { const s = dot(norm(n), LIGHT); return s > .6 ? 'light' : s > .15 ? 'base' : s > -.52 ? 'dark' : 'line'; };
  // kihúzott profil (x, y sík, z0…z1 mélység): front = elülső lap · tone(t) = az adott tónusú oldallapok
  function extrude(P, prof0, z0, z1){
    const prof = area(prof0) > 0 ? prof0 : [...prof0].reverse(), n = prof.length, front = prof.map(([x, y]) => P([x, y, z1])), sides = [];
    for(let i = 0; i < n; i++){ const a = prof[i], b = prof[(i + 1) % n], nn = norm([b[1] - a[1], a[0] - b[0], 0]);
      if(dot(nn, P.V) > .02) sides.push({ pts:[P([a[0], a[1], z1]), P([b[0], b[1], z1]), P([b[0], b[1], z0]), P([a[0], a[1], z0])], tone:toneOf(nn) }); }
    return { front, sides, tone:t => sides.filter(s => s.tone === t).map(s => s.pts), all:[front, ...sides.map(s => s.pts)] };
  }

  // ---------------- alakzat-gyártók ----------------
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts }, o);                    // fő lap: kontúr + fehér perem
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts }, o);  // tónus-lap / dísz
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, polys }, o);                 // több részből álló fő lap
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, polys }, o);
  const shine = (pts, o = .6) => det('paper', 'light', pts, { o });
  const tube = (pts, w, cap = true) => band(pts, w, cap);
  const ln = (m, tone, pts, w, o) => Object.assign({ t:'line', m, tone, w, pts }, o);                 // vonal (w: a vászon-egységben, fin nagyítja)

  // ---------------- beillesztés a vászonra ----------------
  // a megdöntött sziluett befoglalóját a perem- és árnyék-tartalékkal a vászonra illeszti (egyenletes nagyítás + eltolás)
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
      if(o.pts && o.t === 'poly'){ o.pts = o.pts.map(T).filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]); if(o.pts.length < 3) continue; }
      else if(o.polys){ o.p = pathOf(o.polys); delete o.polys; if(!/\S/.test(o.p)) continue; }
      else if(o.t === 'line'){ o.pts = o.pts.map(T); o.w = r1((o.w || 2) * k); }
      out.push(o);
    }
    delete meta.grow;
    ART.add(name, Object.assign({ emoji:[], shadow:'hard' }, meta, { shapes:out }));
  }

  // ============================================================================================
  //  1. Cigaretta – eldobott csikk a földön: narancs, pöttyös füstszűrő, fehér papír, hamus, parázsló vég,
  //     fölötte vékony füstkarika. (hossz 5,6 cm, átm. 0,9 cm – a matricán vaskosítva)
  // ============================================================================================
  {
    const TILT = -24, R = .62, L1 = 2.5, L2 = 5.0, L3 = 5.7, d = [1, 0, -.25];
    const smk = [[L3 + .2, .5, -1.3], [L3 + .9, 1.6, -1.3], [L3 - .1, 2.6, -1.3], [L3 + .6, 3.7, -1.3], [L3 + 1.4, 4.3, -1.3]];
    const P = cam({ az:24, el:34, F:60, tilt:TILT, fit:[...corners(-.2, L3 + .2, -R, R, -R - 1.4, R), ...smk] });
    const k = P.k, C = (t0, t1) => acyl(P, [t0, 0, -.25 * t0], d, R, t1 - t0, 16);
    const flt = C(0, L1), pap = C(L1, L2), ash = acyl(P, [L2, 0, -.25 * L2], d, R * .93, L3 - L2, 16);
    const spk = [[.5, 30], [1.1, 70], [1.7, 20], [.9, 0], [2.0, 60], [.3, 75], [1.5, -15]].map(([t, a]) => circ(...flt.at(t, a), .1 * k, 6));
    fin('cigaretta', { emoji:['🚬'], hu:'cigaretta', en:'cigarette with a little smoke curl', look:'discarded cigarette butt lying on the ground: speckled orange filter, white paper, grey ash tip with a glowing ember and a thin curl of smoke', tilt:TILT, shapes:[
      face('steel', 'light', band(smooth(smk.map(P), 4), i => (.55 - .3 * i) * k * 1.2, true)),     // füstcsík
      face('orange', 'base', flt.sil),                                                    // füstszűrő
      det('orange', 'light', flt.strip(.05, L1 - .05, 55, 125)),
      det('orange', 'dark', flt.strip(.05, L1 - .05, -25, -75)),
      dpth('honey', 'light', spk, { o:.9 }),                                              // pöttyök a szűrőn
      face('paper', 'base', pap.sil),                                                     // papír
      det('paper', 'dark', pap.strip(.05, L2 - L1 - .05, -20, -75)),
      det('cream', 'dark', pap.strip(.02, .28, -80, 150), { o:.7 }),                       // ragasztócsík a szűrő mellett
      face('steel', 'dark', ash.sil),                                                     // hamu
      det('steel', 'light', ash.strip(.05, L3 - L2 - .1, 50, 120), { o:.9 }),
      det('dark', 'base', ash.strip(.3, .5, -60, 130), { o:.5 }),                          // égés széle
      det('ember', 'base', ash.ring(L3 - L2, R * .72)),                                    // parázs a végén
      det('honey', 'base', ash.ring(L3 - L2 + .02, R * .36)),
      shine(pap.strip(.2, L2 - L1 - .3, 80, 108), .7),
    ] });
  }

  // ============================================================================================
  //  2. Sátor – háromszög-hasábos kempingsátor nyitott bejárattal, feszítőkötelekkel, előtte kis tábortűz
  //     (két keresztbe tett hasáb, lobogó láng). 2,2 × 2,4 m, 1,3 m magas.
  // ============================================================================================
  {
    const TILT = -8, W = 1.1, H = 1.3, Z = 1.2;
    const prof = [[-W, 0], [W, 0], [.02, H], [-.02, H]];
    const fire = [1.75, 0, 1.35];                                                          // a tűz helye
    const P = cam({ az:28, el:22, F:14, tilt:TILT, fit:[...prof.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), [fire[0] + .45, 0, fire[2] + .3], [fire[0], 1.0, fire[2]], [-W - .5, 0, Z + .2]] });
    const E = extrude(P, prof, -Z, Z), k = P.k, F = (x, y) => P([x, y, Z]);
    const log = (a) => { const dx = .42 * cos(a), dz = .42 * sin(a); return tube([P([fire[0] - dx, .07, fire[2] - dz]), P([fire[0] + dx, .07, fire[2] + dz])], .15 * k); };
    const flame = (s, lift = 0) => { const [x, , z] = fire, Q = (u, v) => P([x + u * s, lift + v * s, z]);
      return [Q(0, 0), Q(.3, .06), Q(.36, .28), Q(.22, .5), Q(.26, .72), Q(.08, .6), Q(0, .98), Q(-.12, .64), Q(-.28, .7), Q(-.3, .38), Q(-.24, .1)]; };
    fin('sator', { emoji:['🏕️'], hu:'sátor', en:'camping tent with a small campfire', look:'teal A-frame camping tent with an open door flap and guy ropes, a small campfire with crossed logs in front', tilt:TILT, shapes:[
      face('wood', 'dark', tube([F(-.02, H - .02), P([-W - .45, 0, Z + .15])], .035 * k)),   // feszítőkötelek
      face('wood', 'dark', tube([P([.02, H - .02, -Z]), P([W + .35, 0, -Z - .15])], .035 * k)),
      face('teal', 'base', E.front),                                                       // homlokfal
      pth('teal', 'light', E.tone('light')),                                               // bal tetősík
      pth('teal', 'dark', [...E.tone('dark'), ...E.tone('line')]),                          // jobb tetősík
      det('teal', 'line', [F(-.02, H), F(.02, H), P([.02, H, -Z]), P([-.02, H, -Z])], { o:.6 }),   // gerinc
      det('dark', 'base', [F(-.55, 0), F(.55, 0), F(.04, 1.02), F(-.04, 1.02)]),            // bejárat
      det('teal', 'light', [F(-.04, 1.02), F(-.55, 0), F(-.78, 0), F(-.1, 1.1)], { o:.95 }), // visszahajtott ajtólap
      det('honey', 'base', [F(.02, 1.0), F(.52, 0), F(.3, 0)], { o:.35 }),                  // a tűz fénye a sátorban
      face('wood', 'base', log(35)), face('wood', 'dark', log(-40)),                       // hasábok
      face('ember', 'base', flame(.95)),                                                   // láng
      det('honey', 'base', flame(.6, .05)),
      det('gold', 'light', flame(.3, .08)),
      shine([E.tone('light')[0][0], E.tone('light')[0][1], lerp(E.tone('light')[0][1], E.tone('light')[0][2], .12), lerp(E.tone('light')[0][0], E.tone('light')[0][3], .12)], .45),
    ] });
  }

  // ============================================================================================
  //  3. Szatyor – vékony, egyszer használatos „trikós" nejlonzacskó: két fül kivágással, oldalt behajtott
  //     redő, gyűrődések. (30 × 50 cm)
  // ============================================================================================
  {
    const TILT = -10, W = 1.5, B = 2.3, T = 3.9, Z = .35;
    // a zacskó eleje (u, v): az alja kicsit szélesebb, a fülek között U-kivágás
    const front = [[-W, 0], [W, 0], [W - .05, B], [W - .2, T], [W - .75, T], [W - .7, B + .35], [-W + .7, B + .35], [-W + .75, T], [-W + .2, T], [-W + .05, B]];
    const hole = sg => [[sg * (W - .55), T - .25], [sg * (W - .38), T - .25], [sg * (W - .42), B + .95], [sg * (W - .55), B + .95]];
    const P = cam({ az:26, el:14, F:24, tilt:TILT, fit:[...front.map(([u, v]) => [u, v, Z]), [W, 0, -Z], [W, B, -Z], [W - .2, T, -Z]] });
    const F = (u, v, dz = 0) => P([u, v + (u * u) * .02, Z + dz - u * u * .06]);
    const k = P.k;
    const cut = (sg) => [F(sg * (W - .7), B + .35), F(sg * (W - .72), T)];
    fin('szatyor', { emoji:['🛍️'], hu:'bevásárlószatyor', en:'shopping bag with handles', look:'thin white single-use plastic carrier bag (T-shirt style) with two cut-out handles, a side gusset and crinkles', tilt:TILT, shapes:[
      face('white', 'dark', [P([W - .05, 0, Z]), P([W, 0, -Z]), P([W - .05, B, -Z]), P([W - .2, T, -Z]), P([W - .2, T, Z - .1]), F(W - .05, B)]),   // oldalredő
      det('steel', 'base', [P([W - .02, .15, 0]), P([W - .05, B - .1, 0]), P([W - .1, B, -.05]), P([W - .03, .2, .05])], { o:.6 }),
      pth('white', 'base', [pos(front.map(([u, v]) => F(u, v))), neg(hole(-1).map(([u, v]) => F(u, v))), neg(hole(1).map(([u, v]) => F(u, v)))]),   // eleje, lyukas fülekkel
      det('white', 'light', [F(-W + .08, .1), F(-.2, .1), F(-.9, B - .2), F(-W + .1, B - .2)], { o:.95 }),
      det('white', 'dark', [F(.5, .06), F(W - .08, .06), F(W - .1, 1.3), F(1.0, .8)], { o:.8 }),
      ln('steel', 'base', [F(-.9, .5), F(-.3, 1.4), F(.2, 1.1)], .07 * k, { o:.9 }),         // gyűrődések
      ln('steel', 'base', [F(.3, 2.0), F(.7, 1.5), F(1.1, 1.7)], .07 * k, { o:.9 }),
      ln('steel', 'base', [F(-1.2, 1.9), F(-.8, 2.2)], .06 * k, { o:.8 }),
      ln('steel', 'dark', [F(-W + .1, .12), F(W - .1, .12)], .06 * k, { o:.6 }),              // hegesztett alsó varrat
      det('white', 'dark', [...cut(-1), F(-W + .5, B + .5)], { o:.6 }),                     // a fülek árnyéka a kivágásnál
      det('white', 'dark', [...cut(1), F(W - .5, B + .5)], { o:.6 }),
      shine([F(-1.15, .6), F(-.95, .6), F(-1.02, 2.0), F(-1.2, 2.0)], .8),
      shine([F(-W + .38, B + .4), F(-W + .5, B + .4), F(-W + .44, T - .3), F(-W + .34, T - .3)], .7),
    ] });
  }

  // ============================================================================================
  //  4. Gyár – fűrészfogas tetejű csarnok ablaksorral és kapuval, magas, csíkos kémény szürke füstpamacsokkal,
  //     előtte kis szénkupac. (csarnok 30 × 20 m, kémény 32 m)
  // ============================================================================================
  {
    const TILT = -8, Z = 1.0, HW = 1.05;
    const prof = [[-2, 0], [1.8, 0], [1.8, HW], [1.8, HW + .55], [1.15, HW], [1.15, HW + .55], [.5, HW], [.5, HW + .55], [-.15, HW], [-.15, HW + .55], [-.8, HW], [-.8, HW + .55], [-1.45, HW], [-2, HW]];
    const CH = [-1.45, 0, -.45], CR = .24, CT = 3.2;                                        // kémény: talppont, sugár, magasság
    const puff = (x, y, r) => ({ c:[CH[0] + x, CT + y, CH[2]], r });
    const puffs = [puff(.05, .35, .34), puff(.45, .7, .42), puff(1.0, .95, .48), puff(1.55, 1.05, .4)];
    const P = cam({ az:24, el:16, F:26, tilt:TILT, fit:[...prof.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), [CH[0], CT, CH[2]], ...puffs.map(p => [p.c[0] + p.r, p.c[1] + p.r, p.c[2]]), [-.9, 1.4 + CT, CH[2]]] });
    const E = extrude(P, prof, -Z, Z), k = P.k, F = (x, y) => P([x, y, Z]);
    const at = (a, y, r) => P([CH[0] + r * sin(a), y, CH[2] + r * cos(a)]);
    const chimSil = hull([...Array.from({ length:12 }, (_, i) => at(i * 30, 0, CR * 1.15)), ...Array.from({ length:12 }, (_, i) => at(i * 30, CT, CR * 1.12))]);
    const cband = (y0, y1) => inset([...Array.from({ length:7 }, (_, i) => at(-90 + 30 * i, y0, CR * 1.1)), ...Array.from({ length:7 }, (_, i) => at(90 - 30 * i, y1, CR * 1.1))], chimSil, .4);
    const win = i => rrect(-1.75 + i * .62, .5, -1.35 + i * .62, .85, .04, ([u, v]) => F(u, v), 1);
    fin('gyar', { emoji:['🏭'], hu:'gyár', en:'factory with chimney and grey smoke', look:'brick-coloured factory hall with a saw-tooth roof, window row and gate, a tall striped chimney with grey smoke puffs and a small coal heap', tilt:TILT, shapes:[
      pth('steel', 'light', puffs.map(p => circ(...P(p.c), p.r * k, 14))),                // füst
      dpth('steel', 'base', puffs.map(p => circ(...P([p.c[0] + p.r * .35, p.c[1] - p.r * .3, p.c[2]]), p.r * .55 * k, 10)), { o:.8 }),
      face('red', 'base', chimSil),                                                        // kémény
      dpth('white', 'base', [cband(CT - .75, CT - .45), cband(CT - 1.5, CT - 1.2)]),       // fehér csíkok
      det('red', 'dark', inset([at(40, 0, CR * 1.15), at(40, CT, CR * 1.12), at(90, CT, CR * 1.12), at(90, 0, CR * 1.15)], chimSil, .4), { o:.8 }),
      face('cardboard', 'base', E.front),                                                  // csarnok homlokfala
      pth('cardboard', 'light', E.tone('light')),                                          // tetősíkok
      pth('cardboard', 'dark', [...E.tone('dark'), ...E.tone('line')]),                     // oldalfal és a fogak üveges függőleges lapja
      dpth('sky', 'base', [0, 1, 2, 3].map(win)),                                          // ablaksor
      det('dark', 'base', rrect(.55, 0, 1.3, .7, .06, ([u, v]) => F(u, v), 1)),             // kapu
      dpth('steel', 'dark', [.2, .35, .5].map(v => [F(.6, v), F(1.25, v), F(1.25, v + .05), F(.6, v + .05)])),
      det('dark', 'light', [P([-1.2, 0, Z + .55]), P([-.2, 0, Z + .55]), P([-.55, .32, Z + .4]), P([-.85, .34, Z + .45])]),   // szénkupac
      shine([F(-1.95, HW - .08), F(-1.45, HW - .08), F(-1.8, .15), F(-1.95, .15)], .3),
    ] });
  }

  // ============================================================================================
  //  5. Bicikli – városi kerékpár 3/4-es oldalnézetben: két küllős kerék, mézsárga váz, nyereg, kormány,
  //     lánckerék pedállal. (kerék átm. 68 cm, tengelytáv 104 cm)
  // ============================================================================================
  {
    const TILT = -6, RW = .34, RX = -.52, FX = .52, WY = .34;
    const P = cam({ az:22, el:14, F:9, tilt:TILT, fit:[[RX - RW, 0, 0], [FX + RW, 0, 0], [RX, WY + RW, 0], [-.2, .9, 0], [.36, .92, .26], [.36, .92, -.26]] });
    const k = P.k, S = (x, y, z = 0) => P([x, y, z]);
    const wheel = (cx, r, n = 16) => Array.from({ length:n }, (_, i) => S(cx + r * cos(360 * i / n), WY + r * sin(360 * i / n)));
    const ringP = (cx, r0, r1) => [pos(wheel(cx, r1)), neg(wheel(cx, r0))];
    const BB = [-.04, .3], SEAT = [-.2, .78], HEAD = [.33, .76], HB = [.38, .6];
    const tb = (a, b, w) => pos(tube([S(...a), S(...b)], w * k, false));   // vég-kerekítés nélkül: kisebb SVG
    const spokes = cx => [0, 60, 120].map(a => pos(tube([S(cx + RW * .8 * cos(a), WY + RW * .8 * sin(a)), S(cx - RW * .8 * cos(a), WY - RW * .8 * sin(a))], .012 * k, false)));
    fin('bicikli', { emoji:['🚲'], hu:'bicikli', en:'bicycle', look:'honey-yellow city bicycle in three-quarter side view: spoked wheels, dark saddle, handlebar, chainring with pedal', tilt:TILT, shapes:[
      pth('dark', 'base', [...ringP(RX, RW - .06, RW), ...ringP(FX, RW - .06, RW)]),        // gumik
      dpth('steel', 'base', [...ringP(RX, RW - .09, RW - .06), ...ringP(FX, RW - .09, RW - .06)]),   // felnik
      dpth('steel', 'dark', [...spokes(RX), ...spokes(FX)], { o:.9 }),                      // küllők
      pth('honey', 'base', [tb(BB, [RX, WY], .035), tb([SEAT[0] + .02, SEAT[1] - .06], [RX, WY], .03)]),   // hátsó villa
      pth('honey', 'base', [tb(BB, [SEAT[0] + .01, SEAT[1] - .02], .045), tb(BB, HB, .05), tb([SEAT[0] + .03, SEAT[1] - .1], HEAD, .042), tb(HEAD, HB, .055), tb(HB, [FX, WY], .035)]),   // váz + első villa
      dpth('honey', 'light', [tb([BB[0] + .05, BB[1] + .06], [HB[0] - .06, HB[1] - .02], .016), tb([SEAT[0] + .06, SEAT[1] - .09], [HEAD[0] - .05, HEAD[1] - .02], .014)], { o:.9 }),
      face('steel', 'base', tube([S(HEAD[0], HEAD[1]), S(HEAD[0] + .02, .9), S(HEAD[0] + .02, .9, .24)], .03 * k)),   // kormányszár + kormány (közeli fél)
      face('dark', 'base', tube([S(HEAD[0] + .02, .9, .16), S(HEAD[0] + .02, .9, .28)], .045 * k)),   // markolat
      face('steel', 'base', tube([S(SEAT[0], SEAT[1] - .05), S(SEAT[0] - .01, .86)], .025 * k)),   // nyeregcső
      face('dark', 'base', [S(-.32, .88, .02), S(-.1, .9, .02), S(-.02, .88), S(-.1, .86, -.03), S(-.3, .84, -.03)]),   // nyereg
      face('steel', 'base', circ(...S(...BB, .04), .08 * k, 12)),                            // lánckerék
      det('steel', 'dark', circ(...S(...BB, .045), .035 * k, 8)),
      face('dark', 'base', tube([S(BB[0], BB[1], .06), S(BB[0] + .12, BB[1] - .13, .1)], .025 * k)),   // hajtókar + pedál
      face('dark', 'base', rrect(-.05, -.02, .05, .02, .01, ([u, v]) => S(BB[0] + .12 + u, BB[1] - .13 + v, .14), 1)),
      dpth('steel', 'light', [circ(...S(RX, WY, .01), .025 * k, 8), circ(...S(FX, WY, .01), .025 * k, 8)]),   // agyak
    ] });
  }
  // bilineáris térkép egy vetített négyszögre (q = [s0t0, s1t0, s1t1, s0t1]) – ablak, lámpa ferde lapra
  const quad = q => ([s, t]) => lerp(lerp(q[0], q[1], s), lerp(q[3], q[2], s), t);

  // ============================================================================================
  //  6. Gyalogos – lépő ember oldalról, kicsit 3/4-ben, arc nélkül (a fej hátsó felét haj fedi):
  //     narancs pulóver, farmer, fehér cipő; a túlsó kar és láb sötétebb. (1,7 m)
  // ============================================================================================
  {
    const TILT = 0, NZ = .09;
    const P = cam({ az:20, el:6, F:12, tilt:TILT, fit:[[-.42, 0, 0], [.45, 0, 0], [0, 1.72, 0]] });
    const k = P.k, S = (x, y, z = 0) => P([x, y, z]);
    const limb = (pts, z, w0, w1) => pos(band(smooth(pts.map(([x, y]) => S(x, y, z)), 3), t => (w0 + (w1 - w0) * t) * k));
    const shoe = (x, y, z, a) => pos([[-.07, -.02], [.15, -.02], [.17, .03], [.1, .07], [-.02, .1], [-.08, .06]].map(([u, v]) => S(x + u * cos(a) - v * sin(a), y + u * sin(a) + v * cos(a), z)));
    const legN = [[.02, .96], [.16, .54], [.28, .12]], legF = [[-.02, .96], [-.12, .54], [-.32, .18]];
    const armN = [[.0, 1.4], [-.16, 1.16], [-.28, .98]], armF = [[.02, 1.4], [.17, 1.18], [.3, 1.02]];
    const head = circ(...S(.03, 1.58, 0), .12 * k, 16);
    fin('gyalogos', { emoji:['🚶'], hu:'gyalogos', en:'person walking', look:'faceless person walking to the right in side view: orange sweater, blue jeans, white trainers, brown hair covering the back of the head', tilt:TILT, shapes:[
      face('blue', 'dark', limb(legF, -NZ, .15, .12)),                                    // túlsó láb
      face('white', 'dark', shoe(-.32, .1, -NZ, 16)),
      face('orange', 'dark', limb(armF, -NZ, .1, .085)),                                  // túlsó kar
      face('skin', 'dark', circ(...S(.31, .99, -NZ), .045 * k, 10)),
      face('blue', 'base', limb(legN, NZ, .16, .12)),                                     // közeli láb
      det('blue', 'light', limb([[-.0, .9], [.09, .54]], NZ + .02, .05, .04), { o:.8 }),
      face('white', 'base', shoe(.28, .05, NZ, -4)),
      det('dark', 'base', [S(.21, .03, NZ + .01), S(.44, .03, NZ + .01), S(.45, .06, NZ + .01), S(.21, .06, NZ + .01)], { o:.8 }),   // talp
      face('orange', 'base', pos([S(-.15, 1.44), S(.13, 1.46), S(.16, 1.2), S(.14, .92), S(-.14, .92), S(-.17, 1.2)])),   // törzs
      det('orange', 'light', [S(-.12, 1.4), S(.0, 1.42), S(-.04, .96), S(-.12, .96)], { o:.9 }),
      det('orange', 'dark', [S(.08, 1.3), S(.13, 1.3), S(.12, .96), S(.06, .96)], { o:.8 }),
      face('skin', 'base', circ(...S(.02, 1.46, 0), .05 * k, 8)),                          // nyak
      face('skin', 'base', head),                                                         // fej (arc nélkül)
      det('chocolate', 'base', pos([...Array.from({ length:11 }, (_, i) => S(.03 + .128 * cos(45 + 21 * i), 1.58 + .128 * sin(45 + 21 * i))), S(-.05, 1.5), S(.0, 1.58), S(.07, 1.64)])),   // haj
      face('orange', 'base', limb(armN, NZ + .02, .105, .09)),                             // közeli kar
      face('skin', 'base', circ(...S(-.29, .96, NZ + .02), .048 * k, 10)),
      shine([S(-.1, 1.38, .05), S(-.06, 1.38, .05), S(-.1, 1.06, .05), S(-.13, 1.06, .05)], .5),
    ] });
  }

  // ============================================================================================
  //  7. Kézitáska – többször használható vászon bevásárlótáska: két hosszú fül, felvarrt zseb öltésekkel,
  //     kilógó bagett. (38 × 42 cm, 8 cm redő)
  // ============================================================================================
  {
    const TILT = -10, W = .19, H = .42, Z = .04;
    const P = cam({ az:24, el:12, F:4, tilt:TILT, fit:[...corners(-W, W, 0, H, -Z, Z), [0, H + .3, 0], [.2, H + .2, -.01]] });
    const k = P.k, F = (u, v, dz = 0) => P([u, v, Z + dz]), b = box(P, -W, W, 0, H, -Z, Z);
    const strap = (x0, x1, z) => pos(band(smooth([P([x0, H - .02, z]), P([x0 + .01, H + .2, z]), P([(x0 + x1) / 2, H + .29, z]), P([x1 - .01, H + .2, z]), P([x1, H - .02, z])], 4), .026 * k, false));
    const bread = [[-.02, .3, -.01], [.2, .62, -.01]];
    fin('kezitaska', { emoji:['👜'], hu:'kézitáska', en:'reusable cloth tote bag', look:'reusable cream canvas tote bag with two long straps, a stitched front pocket and a baguette sticking out of the top', tilt:TILT, shapes:[
      face('cream', 'dark', strap(-.1, .1, -Z)),                                          // hátsó fül
      face('wood', 'light', tube([P(bread[0]), P(bread[1])], .07 * k)),                     // bagett
      dpth('wood', 'base', [.45, .52, .59].map(t => { const c = lerp(P(bread[0]), P(bread[1]), t); return circ(c[0], c[1], .016 * k, 6, .008 * k, -50); })),
      face('cream', 'dark', b.right),                                                     // oldalredő
      face('cream', 'light', b.top),                                                      // nyílás
      det('cardboard', 'dark', [F(-W + .01, H, -.005), F(W - .01, H, -.005), P([W - .01, H, -Z + .01]), P([-W + .01, H, -Z + .01])], { o:.7 }),
      face('cream', 'base', b.front),                                                     // eleje
      det('cream', 'light', [F(-W, H), F(-.04, H), F(-.12, .05), F(-W, .05)], { o:.9 }),
      det('honey', 'base', rrect(-.1, .07, .1, .22, .012, ([u, v]) => F(u, v, .002), 2)),    // zseb
      ln('honey', 'dark', rrect(-.09, .08, .09, .21, .008, ([u, v]) => F(u, v, .003), 1).concat([F(.08, .08, .003)]), .006 * k, { o:.9 }),   // öltés
      face('cream', 'base', strap(-.1, .1, Z + .003)),                                     // elülső fül
      dpth('cream', 'dark', [[-.1, H - .05], [.1, H - .05]].map(([u, v]) => rrect(u - .018, v - .02, u + .018, v + .05, .006, ([a, c]) => F(a, c, .004), 1))),   // fülvarrás
      shine([F(-W + .03, H - .06), F(-W + .06, H - .06), F(-W + .06, .1), F(-W + .03, .1)], .55),
    ] });
  }

  // ============================================================================================
  //  8. Vonat – modern elővárosi motorvonat 3/4-es elölnézetben: lejtős orr nagy szélvédővel, két fényszóró,
  //     ablaksor, sárga ajtó, türkiz csík, forgóvázak, áramszedő a tetőn. (szélesség 2,9 m, magasság 3,9 m)
  // ============================================================================================
  {
    const TILT = -8, Z = 1.45;
    const prof = [[-9, .55], [1.2, .55], [1.95, .8], [2.3, 1.7], [2.15, 2.55], [1.5, 3.4], [.6, 3.9], [-9, 3.9]];
    const P = cam({ az:38, el:12, F:40, tilt:TILT, fit:[...prof.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), [-2.5, 4.7, 0], [-9, -.1, Z + .4], [2.6, -.1, Z + .4]] });
    const E = extrude(P, prof, -Z, Z), k = P.k, F = (x, y, dz = 0) => P([x, y, Z + dz]);
    const nose = (a, b) => (s, t) => quad([P([...prof[a], Z]), P([...prof[a], -Z]), P([...prof[b], -Z]), P([...prof[b], Z])])([s, t]);
    const wind = nose(4, 5), lamp = nose(3, 4);
    const winds = [-8.6, -7.2, -5.8, -4.4, -.9, .2].map(x => rrect(x, 2.3, x + 1.2, 3.25, .15, ([u, v]) => F(u, v), 2));
    const wheel = x => circ(...F(x, .45, -.2), .36 * k, 12);
    fin('vonat', { emoji:['🚆'], hu:'vonat', en:'modern passenger train, front view', look:'modern white commuter train in three-quarter front view: sloped nose with a big windscreen, two headlights, window row, yellow door, teal stripe, bogies and a pantograph on the roof', tilt:TILT, shapes:[
      face('steel', 'dark', tube([P([-3.5, 3.9, 0]), P([-2.6, 4.7, 0]), P([-1.6, 3.9, 0])], .08 * k, false)),   // áramszedő
      face('steel', 'base', tube([P([-2.6, 4.7, -.7]), P([-2.6, 4.7, .7])], .1 * k)),
      face('steel', 'dark', [F(-9, -.02, .4), F(2.6, -.02, .4), F(2.6, -.1, .4), F(-9, -.1, .4)]),   // sín
      face('dark', 'base', [F(-8.4, .7), F(-6.7, .7), F(-6.7, .1), F(-8.4, .1)]),          // forgóvázak
      face('dark', 'base', [F(-.6, .7), F(1.1, .7), F(1.1, .1), F(-.6, .1)]),
      pth('dark', 'dark', [wheel(-7.9), wheel(-7.1), wheel(-.2), wheel(.7)]),
      face('white', 'base', E.front),                                                     // oldal
      pth('white', 'light', E.tone('light')),                                             // tető
      pth('white', 'dark', [...E.tone('base'), ...E.tone('dark'), ...E.tone('line')]),     // orr
      det('teal', 'base', [F(-9, .95), F(1.4, .95), F(2.05, 1.1), P([2.08, 1.15, -Z]), P([2.14, 1.4, -Z]), F(2.12, 1.4), F(1.5, 1.4), F(-9, 1.4)]),   // csík
      dpth('dark', 'base', winds),                                                        // ablaksor
      det('honey', 'base', rrect(-2.9, .7, -1.9, 3.3, .1, ([u, v]) => F(u, v), 2)),         // ajtó
      det('dark', 'base', rrect(-2.75, 2.3, -2.05, 3.1, .08, ([u, v]) => F(u, v), 1), { o:.9 }),
      det('dark', 'base', [wind(.06, .08), wind(.94, .08), wind(.9, .92), wind(.1, .92)]),  // szélvédő
      dpth('cream', 'light', [[.1, .22], [.9, .78]].map(([s0, s1]) => [lamp(s0, .25), lamp(s1, .25), lamp(s1, .6), lamp(s0, .6)])),   // fényszórók
      shine([wind(.18, .2), wind(.3, .2), wind(.46, .82), wind(.34, .82)], .45),
      shine([F(-8.5, 3.1), F(-7.7, 3.1), F(-7.9, 2.45), F(-8.5, 2.45)], .3),
    ] });
  }

  // ============================================================================================
  //  9. Autó – kis családi ferdehátú 3/4-es elölnézetben: kék karosszéria, hűtőrács, fényszóró,
  //     visszapillantó, ajtóvonal, dísztárcsás kerekek. (3,9 m hosszú, 1,7 m széles, 1,5 m magas; cm-ben)
  // ============================================================================================
  {
    const TILT = -8, ZW = 72;
    const arch = (cx, R, a0, a1, n = 8) => Array.from({ length:n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + R * cos(a), 16 + R * sin(a)]; });
    const prof = [[-180, 16], [-160, 16], ...arch(-118, 42, 180, 0), [-76, 16], [76, 16], ...arch(118, 42, 180, 0), [160, 16], [182, 22],
      [190, 44], [188, 70], [176, 82], [146, 90], [100, 98], [58, 128], [24, 150], [-44, 154], [-98, 148], [-132, 118], [-156, 100], [-176, 90], [-186, 62], [-188, 30]];
    const P = cam({ az:46, el:18, F:900, tilt:TILT, fit:[...prof.map(([x, y]) => [x, y, ZW]), ...prof.map(([x, y]) => [x, y, -ZW]), [118, 0, ZW], [-118, 0, ZW], [70, 110, ZW + 14]] });
    const E = extrude(P, prof, -ZW, ZW), k = P.k, F = (x, y, dz = 0) => P([x, y, ZW + dz]);
    const disc = (cx, cy, r, z, n = 16) => Array.from({ length:n }, (_, i) => { const a = 360 * i / n; return P([cx + r * cos(a), cy + r * sin(a), z]); });
    const glass = [[54, 124], [22, 145], [-42, 149], [-96, 144], [-124, 116], [-16, 112], [40, 112]];
    const nq = quad([P([182, 22, ZW]), P([182, 22, -ZW]), P([190, 44, -ZW]), P([190, 44, ZW])]), lq = quad([P([190, 44, ZW]), P([190, 44, -ZW]), P([188, 70, -ZW]), P([188, 70, ZW])]);
    const ws = quad([P([100, 98, ZW]), P([100, 98, -ZW]), P([58, 128, -ZW]), P([58, 128, ZW])]);
    fin('auto', { emoji:['🚗'], hu:'autó', en:'small family car', look:'small blue family hatchback in three-quarter front view with grille, headlights, side mirror, door line and hubcaps', tilt:TILT, shapes:[
      face('dark', 'base', disc(-118, 36, 36, ZW + 2)), face('dark', 'base', disc(118, 36, 36, ZW + 2)),   // kerekek
      dpth('steel', 'base', [disc(-118, 36, 20, ZW + 3, 12), disc(118, 36, 20, ZW + 3, 12)]),
      dpth('steel', 'dark', [disc(-118, 36, 7, ZW + 4, 8), disc(118, 36, 7, ZW + 4, 8)]),
      face('blue', 'base', E.front),                                                      // oldal
      pth('blue', 'light', E.tone('light')),                                              // tető, motorháztető
      pth('blue', 'dark', [...E.tone('base'), ...E.tone('dark')]),                         // orr, hátfal
      dpth('blue', 'line', E.tone('line'), { o:.5 }),
      det('dark', 'base', glass.map(([x, y]) => F(x, y))),                                // oldalablakok
      ln('blue', 'base', [F(-38, 150), F(-40, 112)], 4 * k),                               // B-oszlop
      ln('blue', 'line', [F(-40, 110), F(-44, 40), F(-30, 24)], 1.3 * k, { o:.7 }),         // ajtóvonal
      det('steel', 'dark', [nq([.28, .15]), nq([.72, .15]), nq([.72, .9]), nq([.28, .9])]),  // hűtőrács
      dpth('dark', 'base', [.35, .6].map(t => [nq([.3, t]), nq([.7, t]), nq([.7, t + .12]), nq([.3, t + .12])])),
      dpth('cream', 'light', [[lq([.03, .05]), lq([.28, .05]), lq([.28, .55]), lq([.03, .55])], [lq([.72, .05]), lq([.97, .05]), lq([.97, .55]), lq([.72, .55])]]),   // fényszórók
      det('dark', 'base', [ws([.06, .1]), ws([.94, .1]), ws([.9, .9]), ws([.1, .9])]),       // szélvédő
      shine([ws([.2, .2]), ws([.32, .2]), ws([.3, .8]), ws([.2, .8])], .35),
      face('blue', 'dark', [F(56, 112, 2), F(76, 116, 16), F(80, 106, 16), F(62, 104, 2)]),   // visszapillantó
      shine([F(-150, 98), F(-120, 114), F(80, 108), F(96, 98)], .28),
    ] });
  }

  // ============================================================================================
  //  10. Ruha – ujjatlan nyári ruha fa vállfán: pántok, szűk derék mézsárga övvel, bővülő, rakott szoknya
  //      hullámos szegéllyel. (hossz 100 cm)
  // ============================================================================================
  {
    const TILT = -6;
    const hem = Array.from({ length:13 }, (_, i) => { const u = .36 - .72 * i / 12; return [u, .02 * Math.cos(i * Math.PI) + .02]; });
    const dress = [[.07, .98], [.1, .98], [.16, .84], [.13, .66], [.36, .04], ...hem, [-.36, .04], [-.13, .66], [-.16, .84], [-.1, .98], [-.07, .98], [-.05, .88], [0, .84], [.05, .88]];
    const bulge = ([u, v]) => .06 * (1 - (u / .4) ** 2) * (v < .66 ? 1 : .5);
    const P = cam({ az:18, el:6, F:6, tilt:TILT, fit:[[-.36, 0, 0], [.36, 0, 0], [0, 1.2, 0], [-.24, 1.0, 0], [.24, 1.0, 0]] });
    const k = P.k, F = (u, v, dz = 0) => P([u, v, bulge([u, v]) + dz]);
    const pleat = (u0, u1, s) => [F(u0 * .13 / .36, .64), F(u1, .06), F(u1 + s * .05, .06), F(u0 * .13 / .36 + s * .005, .64)];
    fin('ruha', { emoji:['👗'], hu:'ruha', en:'summer dress', look:'sleeveless pink summer dress on a wooden hanger with a honey-yellow belt and a flared pleated skirt', tilt:TILT, shapes:[
      face('steel', 'base', tube(smooth([F(0, 1.02), F(0, 1.12), F(.03, 1.17), F(.07, 1.14), F(.065, 1.1)], 3), .018 * k, true)),   // akasztó-kampó
      face('wood', 'base', tube(smooth([F(-.24, .95), F(-.12, 1.0), F(0, 1.04), F(.12, 1.0), F(.24, .95)], 3), .045 * k)),   // vállfa
      face('pink', 'base', dress.map(([u, v]) => F(u, v))),                                // ruha
      det('pink', 'light', [F(-.16, .84), F(-.02, .86), F(-.06, .66), F(-.13, .66)], { o:.95 }),
      det('pink', 'light', [F(-.13, .6), F(-.02, .6), F(-.2, .06), F(-.34, .06)], { o:.95 }),
      dpth('pink', 'dark', [pleat(.0, .08, 1), pleat(.2, .22, 1), pleat(.34, .31, 1)], { o:.9 }),   // rakások
      det('pink', 'dark', [F(.1, .84), F(.16, .84), F(.13, .66), F(.08, .66)], { o:.85 }),
      det('pink', 'line', [F(.24, .3), F(.36, .04), F(.25, .05)], { o:.35 }),
      face('honey', 'base', [F(-.14, .69, .005), F(.14, .69, .005), F(.135, .62, .005), F(-.135, .62, .005)]),   // öv
      det('honey', 'light', [F(-.13, .69, .006), F(0, .69, .006), F(0, .665, .006), F(-.13, .665, .006)]),
      face('honey', 'dark', rrect(-.03, .61, .03, .7, .01, ([u, v]) => F(u, v, .008), 1)),   // csat
      shine([F(-.12, .8), F(-.09, .8), F(-.1, .7), F(-.12, .7)], .6),
      shine([F(-.14, .5), F(-.11, .5), F(-.22, .14), F(-.26, .14)], .5),
    ] });
  }

  // ============================================================================================
  //  11. Traktor – piros mezőgazdasági traktor oldalról, 3/4-ben: nagy hátsó és kis első kerék bordás
  //      gumival, üvegezett fülke, motorháztető rácsos oldallal, kipufogócső. (hossz 3,8 m, magasság 2,6 m)
  // ============================================================================================
  {
    const TILT = -6, Z = .45;
    const hood = [[-1.0, .75], [1.55, .75], [1.7, .95], [1.62, 1.32], [.25, 1.42], [-1.0, 1.42]];
    const P = cam({ az:22, el:14, F:18, tilt:TILT, fit:[...hood.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), [-.45 - .78, 0, .7], [-.45 + .78, 0, .7], [-.45, 1.56, .7], [1.3 + .48, 0, .6], [-.95, 2.6, .6], [.3, 2.6, -.6], [.9, 2.0, 0]] });
    const E = extrude(P, hood, -Z, Z), k = P.k, F = (x, y, dz = 0) => P([x, y, Z + dz]);
    const cab = box(P, -1.0, .2, 1.42, 2.5, -.6, .6), roof = box(P, -1.08, .3, 2.5, 2.62, -.68, .68);
    const disc = (cx, cy, r, z, n = 20, a0 = 0) => Array.from({ length:n }, (_, i) => P([cx + r * cos(a0 + 360 * i / n), cy + r * sin(a0 + 360 * i / n), z]));
    const tread = (cx, cy, r, z, n) => Array.from({ length:n }, (_, i) => { const a = 360 * i / n; return [P([cx + r * cos(a - 4), cy + r * sin(a - 4), z]), P([cx + r * 1.07 * cos(a - 2), cy + r * 1.07 * sin(a - 2), z]),
      P([cx + r * 1.07 * cos(a + 6), cy + r * 1.07 * sin(a + 6), z]), P([cx + r * cos(a + 8), cy + r * sin(a + 8), z])]; });
    const glassF = quad(cab.front), glassR = quad(cab.right);
    fin('traktor', { emoji:['🚜'], hu:'traktor', en:'farm tractor', look:'red farm tractor in three-quarter side view: big ribbed rear wheel, small front wheel, glazed cab, hood with grille slots and an exhaust pipe', tilt:TILT, shapes:[
      face('dark', 'base', tube([F(.9, 1.35, -.2), F(.9, 2.05, -.2)], .07 * k)),          // kipufogó
      face('red', 'dark', cab.right), face('red', 'base', cab.front),                      // fülke
      det('sky', 'base', [glassF([.08, .06]), glassF([.92, .06]), glassF([.92, .94]), glassF([.08, .94])]),
      det('sky', 'dark', [glassR([.1, .06]), glassR([.9, .06]), glassR([.9, .94]), glassR([.1, .94])]),
      shine([glassF([.2, .5]), glassF([.34, .5]), glassF([.5, .9]), glassF([.36, .9])], .5),
      face('red', 'light', roof.top), face('red', 'base', roof.front),                      // tető
      face('red', 'base', E.front),                                                       // motorháztető
      pth('red', 'light', E.tone('light')), pth('red', 'dark', [...E.tone('base'), ...E.tone('dark'), ...E.tone('line')]),
      dpth('dark', 'base', [.45, .75, 1.05, 1.35].map(x => [F(x, .95), F(x + .16, .95), F(x + .16, 1.2), F(x, 1.2)])),   // rácsos oldal
      pth('dark', 'base', [disc(1.3, .45, .48, .6), disc(-.45, .78, .78, .7)]),            // kerekek
      dpth('dark', 'line', [...tread(1.3, .45, .45, .6, 12), ...tread(-.45, .78, .74, .7, 16)], { o:.9 }),   // bordázat
      dpth('honey', 'base', [disc(1.3, .45, .24, .62, 12), disc(-.45, .78, .4, .72, 14)]),   // felnik
      dpth('honey', 'dark', [disc(1.3, .45, .08, .63, 8), disc(-.45, .78, .12, .73, 8)]),
      shine([F(-.9, 1.38), F(.1, 1.38), F(.1, 1.32), F(-.9, 1.32)], .5),
    ] });
  }

  // ============================================================================================
  //  12. Flakon – pumpás kozmetikai flakon (testradír/testápoló): égkék test, fehér pumpafej kifolyóval,
  //      címke betű nélkül, rajta apró szemcsék. (átm. 6 cm, magasság 19 cm)
  // ============================================================================================
  {
    const TILT = 10;
    const prof = [[2.6, 0], [3.0, .4], [3.0, 11.6], [2.6, 12.8], [1.5, 13.4], [1.5, 14.4]];
    const pump = [[1.6, 14.3], [1.6, 15.4], [.55, 15.4], [.55, 16.8], [1.3, 16.8], [1.3, 18.2], [0, 18.3]];
    const P = cam({ az:20, el:16, F:70, tilt:TILT, fit:[[3, 0, 3], [-3, 0, -3], [3, 0, -3], [-3, 0, 3], [0, 18.3, 0], [4.2, 17.9, 0], [-1.3, 18.2, 0]] });
    const B = lathe(P, prof), U = lathe(P, pump), k = P.k;
    const nz = [[1.1, 17.3, 0], [4.0, 17.3, 0], [4.0, 17.8, 0], [1.1, 17.9, 0]].map(P);
    const lbl = B.strip(-62, 50, 3.0, 9.4);
    const bead = [[-40, 4.2], [-20, 5.6], [0, 4.0], [18, 6.0], [-30, 7.8], [8, 8.0], [32, 4.8], [-8, 7.0], [26, 8.2]].map(([a, y]) => circ(...B.on(a, y, .05), .26 * k, 6));
    fin('flakon', { emoji:['🧴'], hu:'pumpás flakon', en:'pump bottle of lotion', look:'sky-blue cosmetic pump bottle with a white pump head and nozzle and a blank white label dotted with tiny scrub beads', tilt:TILT, shapes:[
      face('white', 'base', U.sil),                                                       // pumpa
      det('white', 'dark', U.strip(30, 90, 14.3, 18.2), { o:.9 }),
      face('white', 'base', nz),                                                          // kifolyó
      det('white', 'light', U.full(1.3, 18.2, 16)),
      face('sky', 'base', B.sil),                                                         // flakon
      det('sky', 'light', B.strip(-92, -40, .4, 12.6)),
      det('sky', 'dark', B.strip(38, 88, .4, 12.6)),
      det('sky', 'line', B.strip(76, 92, .4, 12.4), { o:.45 }),
      det('sky', 'light', B.full(1.5, 14.4, 14)),
      det('white', 'base', lbl),                                                          // címke
      det('white', 'dark', B.strip(20, 50, 3.0, 9.4), { o:.7 }),
      dpth('purple', 'light', bead),                                                      // szemcsék
      shine(B.strip(-66, -54, 1.2, 11.2), .7),
    ] });
  }

  // ============================================================================================
  //  13. Repülő – utasszállító felülről, 3/4-ben, orral jobbra-fel: nyilazott szárnyak alattuk
  //      hajtóművekkel, vízszintes vezérsíkok, kék függőleges vezérsík, ablaksor. (35 m hosszú)
  // ============================================================================================
  {
    const TILT = -34, Y = -3;
    const half = [[176, 0], [152, 11], [92, 20], [-100, 21], [-158, 13], [-176, 6]];
    const fus = [...half.map(([x, z]) => [x, 0, z]), ...half.slice(1, -1).reverse().map(([x, z]) => [x, 0, -z]), [-176, 0, -6]];
    const wing = sg => [[32, Y, sg * 18], [-38, Y, sg * 18], [-112, Y, sg * 166], [-72, Y, sg * 166]];
    const stab = sg => [[-140, Y, sg * 10], [-172, Y, sg * 10], [-186, Y, sg * 64], [-156, Y, sg * 64]];
    const vfin = [[-136, 4], [-106, 4], [-150, 70], [-174, 70]];
    const pod = sg => Array.from({ length:14 }, (_, i) => { const a = 360 * i / 14; return [-16 + 28 * cos(a), Y - 7, sg * 88 + 11 * sin(a)]; });
    const P = cam({ az:22, el:58, F:2400, tilt:TILT, fit:[...fus, ...wing(1), ...wing(-1), ...stab(1), ...stab(-1), ...pod(1), ...pod(-1), ...vfin.map(([x, y]) => [x, y, 0])] });
    const k = P.k, S = p => P(p);
    const strip = (z0, z1) => [...half.map(([x, z]) => P([x, .6, Math.max(-z, Math.min(z, z0))])), ...half.slice().reverse().map(([x, z]) => P([x, .6, Math.max(-z, Math.min(z, z1))]))];
    fin('repulo', { emoji:['✈️'], hu:'repülő', en:'passenger airplane seen from above', look:'white passenger airliner seen from above in three-quarter view, nose pointing up-right, swept wings with engines, blue tail fin, window row', tilt:TILT, shapes:[
      face('white', 'dark', stab(-1).map(S)), face('white', 'dark', wing(-1).map(S)),       // túlsó vezérsík és szárny
      face('steel', 'dark', pod(-1).map(S)),
      face('white', 'base', fus.map(S)),                                                    // törzs
      det('white', 'light', strip(-9, 5), { o:.95 }),
      det('white', 'dark', strip(13, 24), { o:.85 }),
      dpth('dark', 'base', Array.from({ length:9 }, (_, i) => circ(...P([104 - i * 30, .8, 16]), 3.2 * k, 8)), { o:.85 }),   // ablaksor
      det('dark', 'base', [P([164, .8, 4]), P([140, .8, 15]), P([118, .8, 13]), P([142, .8, -2]), P([160, .8, -6])]),     // pilótafülke
      face('white', 'base', wing(1).map(S)),                                                // közeli szárny
      det('white', 'dark', [P([-38, Y, 18]), P([-112, Y, 166]), P([-100, Y, 166]), P([-28, Y, 18])], { o:.6 }),
      det('blue', 'base', [P([-112, Y, 166]), P([-72, Y, 166]), P([-76, Y, 156]), P([-106, Y, 156])]),   // szárnyvég
      face('steel', 'base', pod(1).map(S)),                                                 // hajtómű
      det('dark', 'base', [P([4, Y - 7, 78]), P([12, Y - 7, 88]), P([4, Y - 7, 98]), P([-4, Y - 7, 88])], { o:.9 }),
      face('white', 'base', stab(1).map(S)),
      face('blue', 'base', vfin.map(([x, y]) => P([x, y, 0]))),                             // függőleges vezérsík
      det('blue', 'light', [P([-134, 8, 0]), P([-120, 8, 0]), P([-156, 64, 0]), P([-166, 64, 0])], { o:.8 }),
      shine([P([60, 1, -14]), P([-40, 1, -16]), P([-40, 1, -8]), P([60, 1, -6])], .35),
    ] });
  }

  // ============================================================================================
  //  14. Horgászbot – parafa nyelű bot orsóval, meghajló spiccel; a zsinór végén horogra akadt hal.
  // ============================================================================================
  {
    const TILT = 0;
    const P = cam({ az:14, el:10, F:30, tilt:TILT, fit:[[-.06, -.02, 0], [1.02, 1.12, 0], [.84, -.02, 0], [.3, .02, 0]] });
    const k = P.k, S = (x, y, z = 0) => P([x, y, z]);
    const rod = smooth([S(.02, .06), S(.4, .5), S(.78, .9), S(.97, 1.02), S(1.02, .98)], 4);
    const fx = .9, fy = .44;                                                              // a hal szája
    const fish = [[0, 0], [.05, -.03], [.075, -.12], [.07, -.24], [.04, -.32], [.085, -.4], [.0, -.37], [-.085, -.4], [-.04, -.32], [-.07, -.24], [-.075, -.12], [-.05, -.03]].map(([u, v]) => S(fx + u, fy + v, .02));
    fin('horgaszbot', { emoji:['🎣'], hu:'horgászbot', en:'fishing rod with a fish on the line', look:'fishing rod with a cork handle and a steel reel, bent tip, and a silver-blue fish hanging on the line from its hook', tilt:TILT, shapes:[
      ln('dark', 'base', [S(1.02, .98), S(fx, fy + .02)], .006 * k),                       // zsinór
      face('dark', 'base', band(rod, t => (.03 - .02 * t) * k)),                            // bot
      det('dark', 'light', band(rod.slice(2, 10), .007 * k), { o:.7 }),
      face('cardboard', 'base', tube([S(-.04, -.02), S(.2, .25)], .055 * k)),               // parafa nyél
      det('cardboard', 'light', tube([S(-.03, .0), S(.18, .24)], .018 * k), { o:.8 }),
      face('steel', 'dark', tube([S(.26, .31), S(.26, .2)], .025 * k, false)),              // orsótartó
      face('steel', 'base', circ(...S(.27, .17, .03), .075 * k, 16)),                         // orsó
      det('steel', 'light', circ(...S(.26, .18, .05), .045 * k, 12)),
      face('dark', 'base', tube([S(.27, .17, .06), S(.36, .12, .06)], .018 * k)),            // hajtókar
      face('water', 'base', fish),                                                          // hal
      det('water', 'light', [fish[1], fish[2], fish[3], S(fx, fy - .24), S(fx, fy - .03)], { o:.95 }),
      det('water', 'dark', [fish[11], fish[10], fish[9], S(fx - .02, fy - .24), S(fx - .01, fy - .04)], { o:.8 }),
      det('dark', 'base', circ(...S(fx + .03, fy - .06, .03), .012 * k, 6)),                  // szem
      det('water', 'dark', [S(fx - .07, fy - .15, .03), S(fx - .12, fy - .1, .03), S(fx - .075, fy - .2, .03)]),   // úszó
      shine([S(fx + .02, fy - .08), S(fx + .045, fy - .08), S(fx + .04, fy - .22), S(fx + .02, fy - .22)], .6),
    ] });
  }

  // ============================================================================================
  //  15. Busz – mézsárga városi csuklós nélküli busz 3/4-es elölnézetben: nagy szélvédő kijelzősávval
  //      (felirat nélkül), két fényszóró, ablaksor, lengőajtók, tetőklíma, kerekek. (12 m, 2,55 m széles)
  // ============================================================================================
  {
    const TILT = -8, Z = 1.27;
    const prof = [[-6.5, .35], [1.3, .35], [1.45, .55], [1.5, 2.7], [1.35, 3.0], [-6.5, 3.0]];
    const P = cam({ az:36, el:12, F:40, tilt:TILT, fit:[...prof.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), [-6.5, 0, Z], [.6, 0, Z], [-3, 3.35, 0]] });
    const E = extrude(P, prof, -Z, Z), k = P.k, F = (x, y, dz = 0) => P([x, y, Z + dz]);
    const fr = quad([P([1.45, .55, Z]), P([1.45, .55, -Z]), P([1.5, 2.7, -Z]), P([1.5, 2.7, Z])]);
    const disc = (cx, r) => circ(...F(cx, .5, .02), r * k, 14);
    const wins = [-6.2, -4.9, -2.3, -1.0].map(x => rrect(x, 1.55, x + 1.1, 2.7, .1, ([u, v]) => F(u, v), 2));
    const door = x => rrect(x, .45, x + 1.0, 2.75, .06, ([u, v]) => F(u, v), 1);
    fin('busz', { emoji:['🚌'], hu:'busz', en:'city bus', look:'honey-yellow city bus in three-quarter front view: big windscreen with a blank destination display, headlights, window row, glass doors, roof unit and wheels', tilt:TILT, shapes:[
      face('steel', 'base', box(P, -4.2, -1.8, 3.0, 3.35, -.8, .8).sil),                     // tetőklíma
      face('honey', 'base', E.front),                                                     // oldal
      pth('honey', 'light', E.tone('light')),
      pth('honey', 'dark', [...E.tone('base'), ...E.tone('dark'), ...E.tone('line')]),     // eleje
      det('dark', 'base', [F(-6.5, .35), F(1.3, .35), F(1.3, .75), F(-6.5, .75)], { o:.35 }),
      dpth('dark', 'base', wins),                                                         // ablaksor
      dpth('sky', 'dark', [door(-3.6), door(.05)]),                                       // ajtók
      dpth('steel', 'dark', [-3.1, .55].map(x => [F(x, .45), F(x + .06, .45), F(x + .06, 2.75), F(x, 2.75)])),
      det('dark', 'base', [fr([.05, .42]), fr([.95, .42]), fr([.95, .97]), fr([.05, .97])]),   // szélvédő
      det('dark', 'line', [fr([.08, .85]), fr([.92, .85]), fr([.92, .96]), fr([.08, .96])], { o:.8 }),   // kijelzősáv
      dpth('cream', 'light', [[fr([.06, .1]), fr([.2, .1]), fr([.2, .2]), fr([.06, .2])], [fr([.8, .1]), fr([.94, .1]), fr([.94, .2]), fr([.8, .2])]]),   // fényszórók
      pth('dark', 'base', [disc(-4.6, .52), disc(-.2, .52)]),                              // kerekek
      dpth('steel', 'base', [disc(-4.6, .24), disc(-.2, .24)]),
      shine([fr([.14, .5]), fr([.24, .5]), fr([.4, .9]), fr([.3, .9])], .4),
    ] });
  }

  // ============================================================================================
  //  16. Lámpás – égi (kívánság-) lámpás alulról nézve: felfelé bővülő papírballon bordákkal,
  //      alul drótkeret, közepén égő láng, a papír alja áttetszően világít. (átm. 60 cm, magasság 90 cm)
  // ============================================================================================
  {
    const TILT = 8;
    const prof = [[2.5, 0], [3.0, 2.2], [3.6, 5.2], [3.95, 7.4], [3.9, 8.6], [3.3, 9.8], [2.0, 10.6], [.1, 10.9]];
    const P = cam({ az:10, el:-12, F:60, tilt:TILT, fit:[[4, 0, 4], [-4, 0, -4], [4, 0, -4], [-4, 0, 4], [0, 10.9, 0], [4, 8, 0], [-4, 8, 0], [0, -1.9, 0]] });
    const L = lathe(P, prof), k = P.k;
    const rib = a => L.strip(a - 2.5, a + 2.5, .1, 10.4);
    const flame = [[0, -.2], [.5, .3], [.45, 1.0], [.15, 1.7], [0, 2.2], [-.15, 1.7], [-.45, 1.0], [-.5, .3]].map(([u, v]) => P([u * 1.4, v * 1.3 - 1.6, 0]));
    const inner = flame.map(p => lerp(p, P([0, -.6, 0]), .5));
    fin('lampas', { emoji:['🏮'], hu:'lámpás', en:'red paper lantern', look:'sky lantern seen from slightly below: tall orange paper balloon widening upwards with ribs, a wire ring at the open bottom and a small flame glowing inside', tilt:TILT, shapes:[
      face('orange', 'base', L.sil),                                                      // papírballon
      det('orange', 'light', L.strip(-88, -30, .2, 10.4)),
      det('orange', 'dark', L.strip(34, 88, .2, 10.4)),
      det('orange', 'line', L.strip(70, 90, .2, 10.2), { o:.4 }),
      det('honey', 'base', L.strip(-40, 40, .1, 4.2), { o:.85 }),                          // a láng fénye a papíron
      det('gold', 'light', L.strip(-22, 22, .1, 2.0), { o:.8 }),
      dpth('ember', 'dark', [-60, -20, 20, 60].map(rib), { o:.7 }),                        // bordák
      face('dark', 'base', L.ring(2.5, 0, 0, 360, 18).slice(0, 18)),                       // nyitott alja
      det('ember', 'dark', L.ring(2.3, 0, 0, 360, 18).slice(0, 18), { o:.9 }),
      face('steel', 'dark', tube([L.at(2.5, 0, -90), P([0, -1.3, 0]), L.at(2.5, 0, 90)], .1 * k, false)),   // drótkeret
      face('ember', 'base', flame),                                                       // láng
      det('honey', 'light', inner),
      shine(L.strip(-72, -60, 3.0, 9.0), .55),
    ] });
  }

  // ============================================================================================
  //  17. Címke – kartonból vágott árcédula felirat nélkül: ötszög forma, fém fűzőkarika, tekergő zsineg,
  //      körben szaggatott díszvonal. (7 × 4 cm)
  // ============================================================================================
  {
    const TILT = -22, T = .06;
    const prof = [[-1.25, -.72], [.72, -.72], [1.42, 0], [.72, .72], [-1.25, .72]];
    const P = cam({ az:-20, el:22, F:20, tilt:TILT, fit:[...prof.flatMap(([x, y]) => [[x, y, T], [x, y, -T]]), [2.5, 1.0, 0], [2.2, -.2, 0]] });
    const E = extrude(P, prof, -T, T), k = P.k, F = (x, y, dz = 0) => P([x, y, T + dz]);
    const hole = circ(.95, 0, .13, 12).map(([x, y]) => F(x, y)), grom = circ(.95, 0, .24, 16).map(([x, y]) => F(x, y, .01));
    const dash = [[-1.1, -.58], [.66, -.58], [1.24, 0], [.66, .58], [-1.1, .58], [-1.1, -.58]];
    const dashes = dash.slice(0, -1).flatMap((p, i) => { const q = dash[i + 1], n = Math.max(2, Math.round(hypot(q[0] - p[0], q[1] - p[1]) / .26));
      return Array.from({ length:n }, (_, j) => pos(tube([F(...lerp(p, q, j / n)), F(...lerp(p, q, (j + .55) / n))], .035 * k, false))); });
    const str = smooth([F(.95, .1), F(1.35, .55), F(1.9, .7), F(2.3, .35), F(2.05, -.1), F(1.75, .3), F(2.2, .9), F(2.5, 1.0)], 4);
    fin('cimke', { emoji:['🏷️'], hu:'címke', en:'price tag with string', look:'blank kraft-paper price tag with a metal eyelet, a dashed decorative border and a curly string, no text', tilt:TILT, shapes:[
      pth('cardboard', 'dark', [...E.tone('base'), ...E.tone('dark'), ...E.tone('line'), ...E.tone('light')]),   // karton éle
      pth('cardboard', 'base', [pos(E.front), neg(hole)]),                                  // cédula, lyukkal
      det('cardboard', 'light', [F(-1.2, .68), F(.2, .68), F(-.5, -.1), F(-1.2, -.3)], { o:.9 }),
      det('cardboard', 'dark', [F(.2, -.68), F(.72, -.68), F(1.36, -.02), F(.9, -.3)], { o:.6 }),
      dpth('cardboard', 'dark', dashes, { o:.85 }),                                         // szaggatott díszvonal
      pth('steel', 'base', [pos(grom), neg(hole)]),                                          // fűzőkarika
      det('steel', 'light', [grom[9], grom[10], grom[11], grom[12], hole[7], hole[6]]),
      face('cream', 'base', band(str, .06 * k)),                                            // zsineg
      det('cream', 'light', band(str.slice(6, 16), .02 * k), { o:.9 }),
      face('cream', 'dark', circ(...lerp(str[2], str[3], .5), .075 * k, 8)),                // csomó
      shine([F(-1.1, .5), F(-.7, .5), F(-.95, .15), F(-1.1, .15)], .6),
      shine([F(-.6, .5), F(-.5, .5), F(-.7, .3), F(-.8, .3)], .45),
    ] });
  }

  // ============================================================================================
  //  18. Lufi – piros, fényes gumi léggömb: tojásdad forma, alul megkötött csücsök, kunkorodó zsinór.
  // ============================================================================================
  {
    const TILT = 12;
    const prof = [[.07, 0], [.3, .1], [.5, .32], [.6, .62], [.59, .92], [.48, 1.16], [.28, 1.3], [.02, 1.35]];
    const P = cam({ az:0, el:8, F:10, tilt:TILT, fit:[[.6, .6, 0], [-.6, .6, 0], [0, 1.35, 0], [0, -1.1, 0], [.2, -.6, 0], [-.2, -.6, 0]] });
    const L = lathe(P, prof), k = P.k;
    const knot = [[-.1, -.12], [.1, -.12], [.05, -.02], [.07, .03], [-.07, .03], [-.05, -.02]].map(([x, y]) => P([x, y, 0]));
    const str = smooth([[0, -.1], [.1, -.3], [-.12, -.5], [.12, -.72], [-.05, -.92], [.05, -1.08]].map(([x, y]) => P([x, y, 0])), 4);
    fin('lufi', { emoji:['🎈'], hu:'lufi', en:'red party balloon', look:'shiny red rubber party balloon with a tied knot and a curly string', tilt:TILT, shapes:[
      face('steel', 'dark', band(str, .022 * k)),                                         // zsinór
      face('red', 'base', knot),                                                          // csücsök
      face('red', 'base', L.sil),                                                         // léggömb
      det('red', 'light', L.strip(-90, -30, .12, 1.3)),
      det('red', 'dark', L.strip(30, 90, .05, 1.3)),
      det('red', 'line', L.strip(62, 92, .05, 1.2), { o:.4 }),
      det('red', 'dark', [L.on(-30, .05), L.on(30, .05), L.on(15, .18), L.on(-15, .18)], { o:.8 }),
      shine([L.on(-50, .78), L.on(-38, .78), L.on(-30, 1.08), L.on(-44, 1.12)], .75),
      shine([L.on(-58, .5), L.on(-52, .5), L.on(-50, .6), L.on(-57, .6)], .6),
      det('pink', 'base', L.strip(48, 70, .3, .8), { o:.45 }),                             // visszavert fény a túloldalon
      det('red', 'line', [P([-.08, -.04, 0]), P([.08, -.04, 0]), P([.07, -.07, 0]), P([-.07, -.07, 0])], { o:.6 }),   // kötés
    ] });
  }

  // ============================================================================================
  //  19. Érem – arany érem vastag peremmel, domború csillaggal, V alakú csíkos szalaggal.
  //      (átm. 6 cm, szalag 3 cm széles)
  // ============================================================================================
  {
    const TILT = -8, R = 3, T = .45;
    const P = cam({ az:24, el:14, F:60, tilt:TILT, fit:[[-R, -R, 0], [R, -R, 0], [0, R, 0], [-4.4, 7.6, 0], [3.2, 7.6, 0], [R + .4, 0, 0]] });
    const D = acyl(P, [0, 0, -T], [0, 0, 1], R, T, 28), k = P.k, F = (x, y, dz = 0) => P([x, y, dz]);
    const rib = (x0, x1) => [F(x0, 7.6, -.2), F(x0 + 2.4, 7.6, -.2), F(x1 + 1.3, 1.6, -.2), F(x1, 2.2, -.2)];
    const stripe = (x0, x1) => [F(x0 + .9, 7.6, -.19), F(x0 + 1.5, 7.6, -.19), F(x1 + .9, 1.9, -.19), F(x1 + .5, 2.0, -.19)];
    const st = ART.geo.star(0, 0, 1.6, .7, 5).map(([x, y]) => F(x, -y, .02));
    fin('erem', { emoji:['🏅'], hu:'érem', en:'gold medal with ribbon', look:'gold medal with a thick rim and an embossed star, hanging from a striped blue V-shaped ribbon', tilt:TILT, shapes:[
      face('blue', 'dark', rib(2.0, -1.0)),                                               // szalag (hátsó szár)
      det('white', 'dark', stripe(2.0, -1.0), { o:.8 }),
      face('blue', 'base', rib(-4.4, -.3)),                                               // szalag (első szár)
      det('white', 'base', stripe(-4.4, -.3)),
      face('gold', 'dark', D.sil),                                                        // érem pereme
      face('gold', 'base', D.top),                                                        // előlap
      det('gold', 'light', circ(...F(0, 0, .01), 2.3 * k, 24)),                            // domború belső mező
      det('gold', 'dark', clip(circ(...F(0, 0, .01), 2.3 * k, 24), [F(-R, -.2, 0), F(R, -1.6, 0), F(R, -R, 0), F(-R, -R, 0)]), { o:.6 }),
      face('gold', 'base', st),                                                           // csillag
      det('gold', 'light', [st[9], st[0], st[1], F(0, 0, .03)]),
      det('gold', 'dark', [st[3], st[4], st[5], F(0, 0, .03)], { o:.8 }),
      face('gold', 'dark', tube([F(-.5, R + .1, 0), F(0, R + .55, 0), F(.5, R + .1, 0)], .28 * k, false)),   // akasztó-fül
      shine([F(-2.3, 1.1, .02), F(-1.8, 1.7, .02), F(-2.35, .1, .02), F(-2.6, -.5, .02)], .6),
    ] });
  }

  // ============================================================================================
  //  20. Póló – kiterített rövid ujjú póló, kicsit 3/4-ben: bordás nyakkivágás, ujjszegés öltéssel,
  //      lágy gyűrődés, mellzseb. (szélesség 52 cm)
  // ============================================================================================
  {
    const TILT = -8;
    const shirt = [[.09, .72], [.26, .66], [.46, .5], [.38, .36], [.26, .42], [.26, 0], [-.26, 0], [-.26, .42], [-.38, .36], [-.46, .5], [-.26, .66], [-.09, .72], [-.05, .66], [.0, .64], [.05, .66]];
    const bulge = ([u, v]) => .05 * (1 - (u / .5) ** 2);
    const P = cam({ az:16, el:22, F:5, tilt:TILT, fit:shirt.map(([u, v]) => [u, v, 0]) });
    const k = P.k, F = (u, v, dz = 0) => P([u, v, bulge([u, v]) + dz]);
    const cuff = sg => [[sg * .38, .36], [sg * .46, .5], [sg * .43, .52], [sg * .355, .385]].map(([u, v]) => F(u, v, .002));
    fin('polo', { emoji:['👕'], hu:'póló', en:'t-shirt', look:'purple short-sleeved T-shirt laid flat in slight three-quarter view with ribbed neckline, stitched sleeve hems, a chest pocket and soft folds', tilt:TILT, shapes:[
      face('purple', 'base', shirt.map(([u, v]) => F(u, v))),                               // póló
      det('purple', 'light', [F(-.25, .62), F(-.04, .64), F(-.1, .04), F(-.25, .04)], { o:.9 }),
      det('purple', 'light', [F(-.44, .5), F(-.27, .64), F(-.28, .46), F(-.37, .38)], { o:.9 }),
      det('purple', 'dark', [F(.14, .5), F(.25, .56), F(.25, .02), F(.06, .02)], { o:.85 }),
      det('purple', 'dark', [F(.28, .62), F(.44, .5), F(.38, .38), F(.27, .44)], { o:.9 }),
      det('purple', 'line', [F(.2, .02), F(.25, .02), F(.25, .3)], { o:.4 }),
      dpth('purple', 'dark', [cuff(1), cuff(-1)]),                                          // ujjszegés
      det('purple', 'dark', [F(-.25, .08), F(.25, .08), F(.25, .02), F(-.25, .02)], { o:.7 }),   // alsó szegés
      face('purple', 'dark', pos([F(-.11, .73, .003), F(-.06, .66, .003), F(0, .63, .003), F(.06, .66, .003), F(.11, .73, .003), F(.08, .74), F(.04, .69), F(0, .675), F(-.04, .69), F(-.08, .74)])),   // bordás nyak
      det('purple', 'dark', rrect(-.18, .38, -.08, .5, .01, ([u, v]) => F(u, v, .004), 1), { o:.8 }),   // mellzseb
      ln('purple', 'line', [F(-.02, .3), F(.06, .2), F(.02, .1)], .006 * k, { o:.5 }),        // gyűrődés
      shine([F(-.22, .56), F(-.18, .56), F(-.2, .12), F(-.23, .12)], .5),
    ] });
  }

})();
