// ============================================================
//  Matricák — közlekedés és hétköznapi utak B szinten (docs/rajzolas.md) – a „Nem gáz a pedál” játékhoz
//  (docs/kozlekedes-jatekterv.md): e-bringa, telekocsi, bérlet, esernyő, esőruha, felhők, iskola, rendelő,
//  aktatáska, nagyi, bakancs, jeges út. A stílus és a méretlista a 🚲 🚗 (art-things-b.js) párja.
//  A rajz NEM árulja el, hogy egy mód jó vagy rossz: nincs piros X, zöld pipa, szöveg, szám, márka, logó, arc.
//  Valódi méretből (cm / m) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  A segédek (vetítés, vágás, fin() illesztés) az art-things-b.js készletének másolata – így a fájl önálló.
//  Render: node tools/art-render.js 2d web/js/art/art-kozlekedes.js ki.png --skip kozlekedes
//  A 🌧️ emoji már az esofelho (art-nature.js) matricáé → itt az esos_felho csak névvel érhető el.
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

  // bilineáris térkép egy vetített négyszögre (q = [s0t0, s1t0, s1t1, s0t1]) – ablak, tábla ferde lapra
  const quad = q => ([s, t]) => lerp(lerp(q[0], q[1], s), lerp(q[3], q[2], s), t);
  // esőcsepp (képernyő-koordinátában): hegyes vég felfelé, dőlés fokban
  const drop = (cx, cy, r, a = 12) => { const c = cos(a), s = sin(a), R2 = ([x, y]) => [cx + x * c - y * s, cy + x * s + y * c];
    return [...circ(0, 0, r, 10, r, -20).filter(([, y]) => y > -r * .45), [0, -r * 2.1]].map(R2); };
  // villám-jel: u, v helyi koordináták → map (egy lapra vetít)
  const BOLT = [[-.18, 1], [.38, .12], [.06, .12], [.26, -1], [-.38, -.08], [-.06, -.08]];

  // ============================================================================================
  //  1. Elektromos bringa – városi e-bicikli 3/4-es oldalnézetben: a bicikli (🚲) formája türkiz vázzal,
  //     a ferde vázcsövön akkumulátor villám-jellel, a hátsó kerékben agymotor, a kormányon kis kijelző.
  //     (kerék átm. 68 cm, tengelytáv 104 cm – ugyanaz a méretlista, mint a bicikli)
  // ============================================================================================
  {
    const TILT = -6, RW = .34, RX = -.52, FX = .52, WY = .34;
    const P = cam({ az:22, el:14, F:9, tilt:TILT, fit:[[RX - RW, 0, 0], [FX + RW, 0, 0], [RX, WY + RW, 0], [-.2, .9, 0], [.36, .92, .26], [.36, .92, -.26]] });
    const k = P.k, S = (x, y, z = 0) => P([x, y, z]);
    const wheel = (cx, r, n = 16) => Array.from({ length:n }, (_, i) => S(cx + r * cos(360 * i / n), WY + r * sin(360 * i / n)));
    const ringP = (cx, r0, r1) => [pos(wheel(cx, r1)), neg(wheel(cx, r0))];
    const BB = [-.04, .3], SEAT = [-.2, .78], HEAD = [.33, .76], HB = [.38, .6];
    const tb = (a, b, w) => pos(tube([S(...a), S(...b)], w * k, false));
    const spokes = cx => [0, 60, 120].map(a => pos(tube([S(cx + RW * .8 * cos(a), WY + RW * .8 * sin(a)), S(cx - RW * .8 * cos(a), WY - RW * .8 * sin(a))], .012 * k, false)));
    // akkumulátor a ferde vázcső tetején: u a cső mentén (0…1), v merőlegesen felfelé (m)
    const d = norm([HB[0] - BB[0], HB[1] - BB[1], 0]), nv = [-d[1], d[0]];
    const B = (u, v, z = .02) => { const p = lerp(BB, HB, u); return S(p[0] + nv[0] * v, p[1] + nv[1] * v, z); };
    const bat = (u0, u1, v0, v1, z) => pos(band([B(u0, (v0 + v1) / 2, z), B(u1, (v0 + v1) / 2, z)], (v1 - v0) * k, true));
    fin('e_bringa', { emoji:['🚲⚡'], hu:'elektromos bringa', en:'electric bicycle', look:'teal city e-bike in three-quarter side view: spoked wheels, a dark battery pack on the down tube with a small honey lightning mark, a hub motor in the rear wheel and a small display on the handlebar', tilt:TILT, shapes:[
      pth('dark', 'base', [...ringP(RX, RW - .06, RW), ...ringP(FX, RW - .06, RW)]),        // gumik
      dpth('steel', 'base', [...ringP(RX, RW - .09, RW - .06), ...ringP(FX, RW - .09, RW - .06)]),   // felnik
      dpth('steel', 'dark', [...spokes(RX), ...spokes(FX)], { o:.9 }),                      // küllők
      pth('teal', 'base', [tb(BB, [RX, WY], .035), tb([SEAT[0] + .02, SEAT[1] - .06], [RX, WY], .03)]),   // hátsó villa
      pth('teal', 'base', [tb(BB, [SEAT[0] + .01, SEAT[1] - .02], .045), tb(BB, HB, .06), tb([SEAT[0] + .03, SEAT[1] - .1], HEAD, .042), tb(HEAD, HB, .055), tb(HB, [FX, WY], .035)]),   // váz + első villa
      dpth('teal', 'light', [tb([SEAT[0] + .06, SEAT[1] - .09], [HEAD[0] - .05, HEAD[1] - .02], .014)], { o:.9 }),
      face('dark', 'base', bat(.14, .8, .03, .14, .03)),                                  // akkumulátor
      det('dark', 'light', bat(.2, .74, .11, .13, .035), { o:.9 }),                      // az akku teteje
      det('honey', 'base', BOLT.map(([u, v]) => B(.47 + u * .1, .075 + v * .04, .04))),     // villám-jel
      face('steel', 'dark', circ(...S(RX, WY, .02), .07 * k, 10)),                         // agymotor
      face('steel', 'base', tube([S(HEAD[0], HEAD[1]), S(HEAD[0] + .02, .9), S(HEAD[0] + .02, .9, .24)], .03 * k)),   // kormányszár + kormány
      face('dark', 'base', tube([S(HEAD[0] + .02, .9, .16), S(HEAD[0] + .02, .9, .28)], .045 * k)),   // markolat
      face('dark', 'base', rrect(-.035, -.025, .035, .025, .01, ([u, v]) => S(HEAD[0] + .02 + u, .95 + v, .08), 1)),   // kijelző
      det('sky', 'light', rrect(-.022, -.013, .022, .013, .005, ([u, v]) => S(HEAD[0] + .02 + u, .95 + v, .085), 1)),
      face('steel', 'base', tube([S(SEAT[0], SEAT[1] - .05), S(SEAT[0] - .01, .86)], .025 * k)),   // nyeregcső
      face('dark', 'base', [S(-.32, .88, .02), S(-.1, .9, .02), S(-.02, .88), S(-.1, .86, -.03), S(-.3, .84, -.03)]),   // nyereg
      face('steel', 'base', circ(...S(...BB, .04), .08 * k, 10)),                            // lánckerék
      face('dark', 'base', tube([S(BB[0], BB[1], .06), S(BB[0] + .12, BB[1] - .13, .1)], .025 * k)),   // hajtókar + pedál
    ] });
  }

  // ============================================================================================
  //  2. Telekocsi – kis családi autó (az 🚗 méretlistája) türkizben, az ablakokban három utas feje
  //     (arc nélkül, különböző hajjal) – hárman egy autóban. (3,9 m hosszú, 1,7 m széles, 1,5 m magas; cm-ben)
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
    const G = glass.map(([x, y]) => F(x, y));
    const nq = quad([P([182, 22, ZW]), P([182, 22, -ZW]), P([190, 44, -ZW]), P([190, 44, ZW])]), lq = quad([P([190, 44, ZW]), P([190, 44, -ZW]), P([188, 70, -ZW]), P([188, 70, ZW])]);
    const ws = quad([P([100, 98, ZW]), P([100, 98, -ZW]), P([58, 128, -ZW]), P([58, 128, ZW])]);
    // utas: fej + haj-sapka, az ablak síkjára vágva (x: hossz menti hely, z: az autón belüli mélység)
    const who = (x, z, r, hair) => {
      const c = P([x, 126, z]), rr = r * k;
      return [det('skin', 'base', clip(circ(c[0], c[1], rr, 14), G)),
        det(hair, 'base', clip(circ(c[0] - rr * .05, c[1] - rr * .12, rr * 1.06, 14).filter(([, y]) => y < c[1] - rr * .05), G))];
    };
    fin('telekocsi', { emoji:[], hu:'telekocsi', en:'carpool car with three people inside', look:'small teal family hatchback in three-quarter front view with three faceless passengers visible through the side windows, grille, headlights, side mirror and hubcaps', tilt:TILT, shapes:[
      face('dark', 'base', disc(-118, 36, 36, ZW + 2)), face('dark', 'base', disc(118, 36, 36, ZW + 2)),   // kerekek
      dpth('steel', 'base', [disc(-118, 36, 20, ZW + 3, 12), disc(118, 36, 20, ZW + 3, 12)]),
      face('teal', 'base', E.front),                                                      // oldal
      pth('teal', 'light', E.tone('light')),                                              // tető, motorháztető
      pth('teal', 'dark', [...E.tone('base'), ...E.tone('dark')]),                         // orr, hátfal
      dpth('teal', 'line', E.tone('line'), { o:.5 }),
      det('dark', 'base', G),                                                             // oldalablakok
      ...who(-16, ZW - 8, 15, 'gold'),                                         // első utas
      ...who(22, ZW - 8, 15, 'chocolate'),                                     // sofőr
      ...who(-76, ZW - 8, 15, 'steel'),                                       // hátsó utas
      ln('teal', 'base', [F(-38, 150), F(-40, 112)], 4 * k),                               // B-oszlop
      ln('teal', 'line', [F(-40, 110), F(-44, 40), F(-30, 24)], 1.3 * k, { o:.7 }),         // ajtóvonal
      det('steel', 'dark', [nq([.28, .15]), nq([.72, .15]), nq([.72, .9]), nq([.28, .9])]),  // hűtőrács
      dpth('cream', 'light', [[lq([.03, .05]), lq([.28, .05]), lq([.28, .55]), lq([.03, .55])], [lq([.72, .05]), lq([.97, .05]), lq([.97, .55]), lq([.72, .55])]]),   // fényszórók
      det('dark', 'base', [ws([.06, .1]), ws([.94, .1]), ws([.9, .9]), ws([.1, .9])]),       // szélvédő
      shine([ws([.2, .2]), ws([.32, .2]), ws([.3, .8]), ws([.2, .8])], .35),
      face('teal', 'dark', [F(56, 112, 2), F(76, 116, 16), F(80, 106, 16), F(62, 104, 2)]),   // visszapillantó
      shine([F(-150, 98), F(-120, 114), F(80, 108), F(96, 98)], .28),
    ] });
  }

  // ============================================================================================
  //  3. Bérlet – havi közlekedési bérletkártya (8,6 × 5,4 cm, a matricán vastagítva): türkiz fejléc-csík
  //     mézsárga szegéllyel, fénykép-hely (arc nélküli sziluett), chip, sorok helyett vonalak, hónap-kockák
  //     (az egyik kiemelve). Szöveg, szám, logó nincs.
  // ============================================================================================
  {
    const TILT = -12, W = 4.3, H = 2.7, Z = .22;
    const prof = rrect(-W, -H, W, H, .5, p => p, 3);
    const P = cam({ az:26, el:18, F:40, tilt:TILT, fit:prof.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]) });
    const E = extrude(P, prof, -Z, Z), k = P.k, F = (u, v) => P([u, v, Z]);
    const R = (u0, v0, u1, v1, r = .12) => rrect(u0, v0, u1, v1, r, ([u, v]) => F(u, v), 2);
    fin('berlet', { emoji:['🎫'], hu:'havibérlet', en:'monthly public transport pass card', look:'white plastic monthly transit pass card in three-quarter view: teal header stripe with a honey edge, a photo box with a faceless silhouette, a gold chip, blank lines and a row of month tiles with one highlighted, no text', tilt:TILT, shapes:[
      pth('white', 'dark', [...E.tone('dark'), ...E.tone('line'), ...E.tone('base')]),   // kártya éle
      face('white', 'base', E.front),                                                     // lap
      det('white', 'light', [F(-W + .3, H - .3), F(0, H - .3), F(-W + .3, -.5)], { o:.9 }),
      det('teal', 'base', clip(E.front, [F(-W - 1, 1.15), F(W + 1, 1.15), F(W + 1, H + 1), F(-W - 1, H + 1)])),   // fejléc-csík
      det('honey', 'base', [F(-W + .02, .88), F(W - .02, .88), F(W - .01, 1.15), F(-W + .01, 1.15)]),   // szegély
      det('sky', 'base', R(-3.7, -2.2, -1.4, .45)),                                       // fénykép-hely
      det('steel', 'dark', [...circ(...F(-2.55, -.5), .52 * k, 12)]),                      // sziluett: fej
      det('steel', 'dark', clip(circ(...F(-2.55, -2.05), 1.0 * k, 14, .85 * k), R(-3.7, -2.2, -1.4, .45))),   // váll
      det('gold', 'base', R(-.9, -.35, .5, .6, .15)),                                     // chip
      ln('gold', 'dark', [F(-.9, .12), F(-.4, .12), F(-.4, -.35)], .07 * k, { o:.8 }),
      ln('gold', 'dark', [F(.5, .12), F(0, .12), F(0, .6)], .07 * k, { o:.8 }),
      ln('steel', 'base', [F(1.0, .35), F(3.7, .35)], .22 * k),                             // sorok (szöveg nélkül)
      ln('steel', 'base', [F(1.0, -.25), F(3.0, -.25)], .22 * k),
      dpth('sage', 'base', [0, 1, 3, 4].map(i => R(-.9 + i * .95, -2.2, -.2 + i * .95, -1.35, .1))),   // hónap-kockák
      det('honey', 'base', R(-.9 + 2 * .95, -2.2, -.2 + 2 * .95, -1.35, .1)),               // az aktuális hónap
      shine([F(-W + .5, H - .6), F(-W + 1.3, H - .6), F(-W + .9, -1.8), F(-W + .5, -1.8)], .35),
    ] });
  }

  // ============================================================================================
  //  4. Esernyő – nyitott, nyolc cikkelyes esernyő felülről-oldalról: váltakozó türkiz és krém cikkelyek,
  //     csipkés szél, fém csúcs, hajlított fa fogantyú, mellette esőcseppek. (átm. 100 cm)
  // ============================================================================================
  {
    const TILT = -16, R = .5, HH = .26, N = 8;
    const ya = f => HH * (1 - f * f);                                                        // a kupola profilja
    const at = (f, a, lift = 0) => [f * R * cos(a), ya(f) + lift, f * R * sin(a)];
    const hook = [[0, -.5, .02], [0, -.6, .02], [-.025, -.665, .02], [-.075, -.685, .02], [-.12, -.66, .02], [-.13, -.61, .02]];
    const P = cam({ az:0, el:24, F:8, tilt:TILT, fit:[...Array.from({ length:16 }, (_, i) => at(1, 22.5 * i)), [0, HH + .07, 0], ...hook, [-.5, -.3, .3], [.5, -.4, .3]] });
    const k = P.k;
    const panels = Array.from({ length:N }, (_, i) => {
      const a0 = 22.5 + 360 * i / N, a1 = a0 + 360 / N, am = (a0 + a1) / 2;
      const W3 = [at(0, 0), at(.55, a0), at(1, a0), [.9 * R * cos(am), ya(.9) + .035, .9 * R * sin(am)], at(1, a1), at(.55, a1)];
      const n0 = cross([W3[4][0] - W3[0][0], W3[4][1] - W3[0][1], W3[4][2] - W3[0][2]], [W3[2][0] - W3[0][0], W3[2][1] - W3[0][1], W3[2][2] - W3[0][2]]);
      const n = n0[1] < 0 ? n0.map(v => -v) : n0, c = [R * .6 * cos(am), 0, R * .6 * sin(am)];
      return { pts:W3.map(P), tone:toneOf(n), vis:dot(norm(n), P.V) > 0, m:i % 2 ? 'cream' : 'teal', depth:dot(c, P.V) };
    }).filter(p => p.vis).sort((a, b) => a.depth - b.depth);
    const dr = (x, y, z, r) => { const c = P([x, y, z]); return drop(c[0], c[1], r * k, -TILT + 8); };
    fin('esernyo', { emoji:['☔', '☂️'], hu:'esernyő', en:'open umbrella with raindrops', look:'open eight-panel umbrella seen from above at an angle, alternating teal and cream panels with a scalloped edge, a metal tip, a curved wooden handle and a few raindrops around it', tilt:TILT, shapes:[
      face('steel', 'dark', tube([P([0, .02, 0]), P([0, -.5, .02])], .022 * k, false)),      // rúd
      face('wood', 'base', tube(hook.map(P), .05 * k)),                                    // fogantyú
      det('wood', 'light', tube(hook.slice(0, 3).map(P), .018 * k), { o:.8 }),
      ...panels.map(p => face(p.m, p.tone === 'line' ? 'dark' : p.tone, p.pts)),           // cikkelyek
      face('steel', 'base', tube([P([0, HH - .01, 0]), P([0, HH + .07, 0])], .03 * k)),       // csúcs
      shine(tube([P(at(.22, 200)), P(at(.5, 210)), P(at(.75, 215))], .035 * k), .6),
      face('water', 'base', dr(-.5, -.2, .3, .05)),                                     // esőcseppek
      face('water', 'base', dr(.46, -.36, .3, .045)),
      face('water', 'base', dr(-.3, -.58, .3, .04)),
    ] });
  }

  // ============================================================================================
  //  5. Esőruha – mézsárga esőkabát kapucnival (patentok, cipzár, zsebfedők) és előtte egy pár türkiz
  //     gumicsizma. (kabát 80 cm, csizma 30 cm magas)
  // ============================================================================================
  {
    const TILT = -6;
    const bulge = ([u, v]) => .05 * (1 - (u / .3) ** 2);
    const P = cam({ az:14, el:6, F:8, tilt:TILT, fit:[[-.38, 0, 0], [.62, 0, 0], [0, .88, 0], [-.38, .2, 0], [.62, .32, .2]] });
    const k = P.k, F = (u, v, dz = 0) => P([u, v, max(0, bulge([u, v])) + dz]);
    const body = [[-.24, .04], [.24, .04], [.25, .52], [.15, .62], [-.15, .62], [-.25, .52]];
    const hood = [[-.14, .6], [-.17, .74], [-.1, .84], [0, .87], [.1, .84], [.17, .74], [.14, .6]];
    const sleeve = s => [[s * .22, .6], [s * .31, .52], [s * .37, .2], [s * .29, .17], [s * .25, .44]];
    const boot = (x, z) => { const B = (u, v) => P([x + u, v, z]);
      return { shaft:[B(0, 0), B(.2, 0), B(.21, .045), B(.15, .085), B(.12, .09), B(.12, .3), B(0, .3)].map(r => r),
        top:circ(...B(.06, .3), .06 * k, 12, .02 * k), sole:[B(-.005, 0), B(.21, 0), B(.21, .025), B(-.005, .025)],
        light:[B(.015, .28), B(.04, .28), B(.04, .04), B(.015, .04)] }; };
    const b1 = boot(.2, .22), b2 = boot(.36, .12);
    fin('esoruha', { emoji:[], hu:'esőruha', en:'rain jacket and rubber boots', look:'honey-yellow hooded rain jacket with a zip, press studs and pocket flaps, and a pair of teal rubber wellington boots standing in front of it', tilt:TILT, shapes:[
      face('honey', 'dark', sleeve(1).map(([u, v]) => F(u, v, -.02))),                    // túlsó ujj
      face('honey', 'dark', hood.map(([u, v]) => F(u, v, -.03))),                          // kapucni
      det('honey', 'line', circ(...F(0, .72, -.02), .08 * k, 12, .09 * k), { o:.8 }),        // kapucni belseje
      face('honey', 'base', body.map(([u, v]) => F(u, v))),                                // törzs
      det('honey', 'light', [F(-.22, .52), F(-.08, .6), F(-.1, .06), F(-.22, .06)], { o:.9 }),
      det('honey', 'dark', [F(-.24, .04), F(.24, .04), F(.24, .09), F(-.24, .09)], { o:.8 }),   // alsó szegély
      ln('steel', 'dark', [F(0, .6, .005), F(0, .06, .005)], .012 * k),                    // cipzár
      dpth('honey', 'dark', [[-.2, -.06], [.06, .2]].map(([a, b]) => [F(a, .3), F(b, .3), F(b, .26), F(a, .26)])),   // zsebfedők
      dpth('steel', 'light', [.5, .38, .26, .14].map(v => circ(...F(.035, v, .006), .011 * k, 6))),   // patentok
      face('honey', 'base', sleeve(-1).map(([u, v]) => F(u, v, .02))),                     // közeli ujj
      det('honey', 'dark', [F(-.37, .2, .02), F(-.29, .17, .02), F(-.3, .21, .02), F(-.36, .24, .02)]),   // mandzsetta
      shine([F(-.2, .5), F(-.17, .5), F(-.17, .14), F(-.2, .14)], .55),
      face('teal', 'dark', b2.shaft), det('dark', 'base', b2.sole), det('teal', 'line', b2.top),   // hátsó csizma
      face('teal', 'base', b1.shaft), det('dark', 'base', b1.sole), det('teal', 'line', b1.top),   // első csizma
      shine(b1.light, .5),
    ] });
  }

  // ============================================================================================
  //  6–7. Felhők – pamacsos gomolyfelhő lapos, sötétebb aljjal (3/4-es hatás). Esőfelhő: szürkés-fehér,
  //       ferde esőcseppekkel. Viharfelhő: sötét, mézsárga villámmal és néhány csepp.
  // ============================================================================================
  const cloud = (puffs, base) => {
    const polys = [...puffs.map(([x, y, r]) => circ(x, y, r, 18)), base];
    const sil = envelope(polys, .8), top = min(...puffs.map(([, y, r]) => y - r)), bot = max(...base.map(p => p[1]));
    const band2 = (y0, y1) => clip(sil, [[0, y0], [120, y0], [120, y1], [0, y1]]);
    const hi = puffs.map(([x, y, r]) => clip(circ(x - r * .22, y - r * .25, r * .62, 12), [[0, top], [120, top], [120, y], [0, y]]));
    return { sil, hi, under:band2(bot - (bot - top) * .26, bot + 1), rim:band2(bot - (bot - top) * .09, bot + 1) };
  };
  {
    const C = cloud([[30, 50, 15], [50, 38, 21], [70, 46, 16], [83, 56, 10], [18, 58, 9]], [[14, 58], [90, 58], [90, 66], [14, 66]].map(([x, y], i) => i < 2 ? [x, y] : [x, y]));
    fin('esos_felho', { emoji:[], hu:'esős felhő', en:'rain cloud with falling drops', look:'puffy grey-white rain cloud with a flat darker underside and slanted blue raindrops falling from it', tilt:0, shapes:[
      face('steel', 'base', C.sil),
      dpth('steel', 'light', C.hi),
      det('steel', 'dark', C.under),
      det('steel', 'line', C.rim, { o:.55 }),
      shine(circ(40, 32, 6, 10, 2.6, 0).map(([x, y]) => [x + (y - 32) * -.6, y]), .7),
      face('water', 'base', drop(28, 78, 3.6)), face('water', 'base', drop(46, 86, 3.6)),
      face('water', 'base', drop(64, 78, 3.6)), face('water', 'base', drop(80, 88, 3.2)),
      det('water', 'light', circ(27, 78.5, 1.2, 6)), det('water', 'light', circ(45, 86.5, 1.2, 6)),
    ] });
  }
  {
    const C = cloud([[30, 44, 15], [50, 32, 21], [70, 40, 16], [83, 50, 10], [18, 52, 9]], [[14, 52], [90, 52], [90, 60], [14, 60]]);
    const bolt = BOLT.map(([u, v]) => [54 + u * 16 - v * 3, 76 - v * 20]);
    fin('viharfelho', { emoji:['⛈️', '🌩️'], hu:'viharfelhő', en:'storm cloud with lightning', look:'dark grey storm cloud with a flat darker underside, a honey-yellow lightning bolt and a few raindrops', tilt:0, shapes:[
      face('steel', 'dark', C.sil),
      dpth('steel', 'base', C.hi),
      det('dark', 'light', C.under),
      det('dark', 'base', C.rim, { o:.7 }),
      shine(circ(40, 26, 6, 10, 2.6, 0).map(([x, y]) => [x + (y - 26) * -.6, y]), .45),
      face('honey', 'base', bolt),                                                         // villám
      det('gold', 'light', [bolt[0], bolt[1], lerp(bolt[1], bolt[2], .5), lerp(bolt[0], bolt[5], .5)]),
      face('water', 'base', drop(28, 76, 3.4)), face('water', 'base', drop(76, 80, 3.4)), face('water', 'base', drop(36, 90, 3)),
    ] });
  }

  // ============================================================================================
  //  8. Iskola – kis falusi iskolaépület 3/4-es nézetben: mézsárga fal, piros nyeregtető, középen kiugró
  //     oromzatos bejárat órával és kétszárnyú ajtóval, lépcső, ablaksorok, a gerincen harangláb haranggal.
  //     (6,4 × 3,2 m alapterület – a matricán tömörítve; méterben)
  // ============================================================================================
  {
    const TILT = -8, W = 1.6, D = .8, H = 1.3, RH = .62, O = .12, RX = .55, RZ = D + .18, PH = .55;
    const P = cam({ az:30, el:16, F:22, tilt:TILT, fit:[...corners(-W - O, W + O, 0, H, -D - O, D + O), [0, H + RH + .75, 0], [0, 0, RZ + .3]] });
    const k = P.k, c = (x, y, z) => P([x, y, z]), F = (x, y) => P([x, y, D]), FR = (x, y) => P([x, y, RZ]);
    const win = (x0, y0, x1, y1, f = F) => rrect(x0, y0, x1, y1, .05, ([u, v]) => f(u, v), 1);
    const TY = H + RH - .25, TT = TY + .5, TW = .2;                                             // harangláb
    fin('iskola', { emoji:['🏫'], hu:'iskola', en:'small school building', look:'small honey-yellow village school in three-quarter view: red gable roof, a projecting central entrance with a triangular pediment and a round clock, double wooden door with steps, rows of windows and a small bell tower with a bell on the ridge', tilt:TILT, shapes:[
      face('cream', 'base', [c(-TW, TY, TW), c(TW, TY, TW), c(TW, TT, TW), c(-TW, TT, TW)]),   // harangláb
      face('cream', 'dark', [c(TW, TY, TW), c(TW, TY, -TW), c(TW, TT, -TW), c(TW, TT, TW)]),
      det('dark', 'base', rrect(-.12, TY + .12, .12, TT - .06, .06, ([u, v]) => c(u, v, TW), 2)),
      det('gold', 'base', [c(-.08, TY + .14, TW), c(.08, TY + .14, TW), c(.05, TY + .3, TW), c(-.05, TY + .3, TW)]),   // harang
      face('red', 'base', [c(-TW - .06, TT, TW + .06), c(TW + .06, TT, TW + .06), c(0, TT + .32, 0)]),   // gúla-tető
      face('red', 'dark', [c(TW + .06, TT, TW + .06), c(TW + .06, TT, -TW - .06), c(0, TT + .32, 0)]),
      face('honey', 'dark', [c(W, 0, D), c(W, 0, -D), c(W, H, -D), c(W, H + RH, 0), c(W, H, D)]),   // oromfal
      dpth('sky', 'dark', [win(-.5, .35, -.15, .85, (u, v) => c(W, v, -u)), win(.15, .35, .5, .85, (u, v) => c(W, v, -u))]),
      face('honey', 'base', [F(-W, 0), F(W, 0), F(W, H), F(-W, H)]),                          // homlokzat
      dpth('sky', 'base', [-1.45, -1.0, .75, 1.2].flatMap(x => [win(x, .22, x + .3, .55), win(x, .75, x + .3, 1.08)])),   // ablakok
      face('red', 'base', [c(-W - O, H - .05, D + O), c(W + O, H - .05, D + O), c(W + O, H + RH, 0), c(-W - O, H + RH, 0)]),   // tető
      face('red', 'dark', [c(W + O, H - .05, D + O), c(W + O, H - .1, D + O), c(W + O, H + RH - .05, 0), c(W + O, H + RH, 0)]),
      face('cream', 'base', [FR(-RX, 0), FR(RX, 0), FR(RX, H), FR(0, H + PH), FR(-RX, H)]),     // kiugró bejárat oromzattal
      face('cream', 'dark', [FR(RX, 0), c(RX, 0, D), c(RX, H, D), FR(RX, H)]),
      face('red', 'base', band([FR(-RX - .08, H - .04), FR(0, H + PH + .04), FR(RX + .08, H - .04)], .08 * k, false)),
      face('white', 'base', circ(...FR(0, H + .2), .15 * k, 14)),                           // óra
      ln('dark', 'base', [FR(0, H + .3), FR(0, H + .2), FR(.07, H + .16)], .025 * k),
      det('wood', 'base', win(-.24, 0, .24, .7, FR)),                                       // kétszárnyú ajtó
      ln('wood', 'line', [FR(0, .02), FR(0, .68)], .02 * k),
      face('steel', 'light', [c(-RX - .1, 0, RZ + .25), c(RX + .1, 0, RZ + .25), c(RX + .1, .06, RZ), c(-RX - .1, .06, RZ)]),   // lépcső
      shine([c(-W, H + .02, D + O - .06), c(-W + .7, H + .02, D + O - .06), c(-W + .6, H + .12, D - .1), c(-W, H + .12, D - .1)], .35),
    ] });
  }

  // ============================================================================================
  //  9. Rendelő – kis egészségház 3/4-es nézetben: fehér lapos tetős épület, a tetőn tábla zöld kereszttel
  //     (nem piros – a Vöröskereszt jelét nem használjuk), üveges bejárat türkiz előtetővel, ablaksáv,
  //     türkiz lábazat, bokor. (méterben)
  // ============================================================================================
  {
    const TILT = -8, W = 1.5, D = .8, H = 1.15;
    const P = cam({ az:30, el:18, F:22, tilt:TILT, fit:[...corners(-W, W, 0, H + .06, -D, D + .45), [0, H + .75, .55], [-W - .25, 0, D + .3]] });
    const k = P.k, c = (x, y, z) => P([x, y, z]), F = (x, y, dz = 0) => P([x, y, D + dz]);
    const b = box(P, -W, W, 0, H, -D, D), par = box(P, -W - .04, W + .04, H, H + .08, -D - .04, D + .04);
    const sg = box(P, -.34, .34, H + .08, H + .72, .44, .54), SF = (u, v) => P([u, v, .54]);
    const R = (x0, y0, x1, y1, f = F) => rrect(x0, y0, x1, y1, .04, ([u, v]) => f(u, v), 1);
    fin('rendelo', { emoji:['🏥'], hu:'rendelő', en:'small health clinic', look:'small white flat-roofed health clinic in three-quarter view with a sign on the roof showing a leaf-green cross (not red), a glass entrance under a teal canopy, a band of windows, a teal plinth and a small bush', tilt:TILT, shapes:[
      face('white', 'dark', b.right),                                                     // oldalfal
      dpth('sky', 'dark', [R(-.55, .45, -.1, .85, (u, v) => c(W, v, -u)), R(.1, .45, .55, .85, (u, v) => c(W, v, -u))]),
      face('white', 'base', b.front),                                                     // homlokzat
      det('white', 'light', [F(-W, H), F(-.7, H), F(-W, .3)], { o:.9 }),
      det('teal', 'base', [F(-W, 0), F(W, 0), F(W, .16), F(-W, .16)]),                        // lábazat
      det('teal', 'dark', [c(W, 0, D), c(W, 0, -D), c(W, .16, -D), c(W, .16, D)]),
      dpth('sky', 'base', [R(-1.35, .45, -.6, .9), R(.6, .45, 1.35, .9)]),                   // ablaksáv
      det('glass', 'base', R(-.36, .16, .36, .78)),                                          // üvegajtó
      ln('glass', 'line', [F(0, .17), F(0, .77)], .02 * k),
      face('steel', 'light', par.top), face('steel', 'base', par.front), face('steel', 'dark', par.right),   // attika
      face('steel', 'dark', tube([F(-.46, 0, .38), F(-.46, .86, .38)], .03 * k, false)),     // előtető oszlopai
      face('steel', 'dark', tube([F(.46, 0, .38), F(.46, .86, .38)], .03 * k, false)),
      face('teal', 'light', [F(-.55, .9, .45), F(.55, .9, .45), F(.55, .9, 0), F(-.55, .9, 0)]),   // előtető
      face('teal', 'dark', [F(-.55, .9, .45), F(.55, .9, .45), F(.55, .84, .45), F(-.55, .84, .45)]),
      face('white', 'dark', sg.right), face('white', 'base', sg.front),                      // tábla a tetőn
      det('leaf', 'base', [[-.07, -.22], [.07, -.22], [.07, -.07], [.22, -.07], [.22, .07], [.07, .07], [.07, .22], [-.07, .22], [-.07, .07], [-.22, .07], [-.22, -.07], [-.07, -.07]].map(([u, v]) => SF(u, H + .4 + v)), { line:true }),   // zöld kereszt
      face('leaf', 'base', circ(...F(-W + .18, .16, .3), .22 * k, 12, .17 * k)),              // bokor
      det('leaf', 'light', circ(...F(-W + .12, .22, .32), .1 * k, 8, .07 * k)),
      shine([F(-.3, .72, .01), F(-.18, .72, .01), F(-.28, .22, .01), F(-.33, .22, .01)], .5),
    ] });
  }

  // ============================================================================================
  //  10. Aktatáska – barna bőr aktatáska 3/4-es nézetben: lekerekített doboz, fedőlap varrással,
  //      két arany csat, fogantyú fém rögzítőkkel. (44 × 32 × 11 cm)
  // ============================================================================================
  {
    const TILT = -10, W = .22, H = .32, Z = .055;
    const prof = rrect(-W, 0, W, H, .03, p => p, 2);
    const P = cam({ az:28, el:18, F:4, tilt:TILT, fit:[...corners(-W, W, 0, H + .08, -Z, Z)] });
    const E = extrude(P, prof, -Z, Z), k = P.k, F = (u, v, dz = 0) => P([u, v, Z + dz]);
    const handle = [[-.08, H, 0], [-.075, H + .06, 0], [-.04, H + .085, 0], [.04, H + .085, 0], [.075, H + .06, 0], [.08, H, 0]];
    const clasp = x => rrect(-.022, -.02, .022, .02, .006, ([u, v]) => F(x + u, .215 + v, .004), 1);
    fin('aktataska', { emoji:['💼'], hu:'aktatáska', en:'leather briefcase', look:'brown leather briefcase in three-quarter view with rounded corners, a stitched front flap, two gold clasps and a dark handle with metal mounts', tilt:TILT, shapes:[
      face('chocolate', 'base', tube(handle.map(P), .024 * k)),                              // fogantyú
      det('chocolate', 'light', tube(handle.slice(1, 4).map(P), .008 * k), { o:.7 }),
      pth('wood', 'light', E.tone('light')),                                              // teteje
      pth('wood', 'dark', [...E.tone('base'), ...E.tone('dark'), ...E.tone('line')]),      // oldala
      face('wood', 'base', E.front),                                                      // eleje
      det('wood', 'light', [F(-W + .01, H - .02), F(-.05, H - .02), F(-W + .01, .05)], { o:.8 }),
      det('wood', 'dark', [F(-W + .005, .235), F(W - .005, .235), F(W - .005, .25), F(-W + .005, .25)], { o:.9 }),   // fedőlap alja
      ln('cardboard', 'light', [F(-W + .02, .255), F(W - .02, .255)], .005 * k, { o:.9 }),   // varrás
      ln('cardboard', 'light', [F(-W + .02, .02), F(W - .02, .02)], .005 * k, { o:.7 }),
      face('gold', 'base', clasp(-.12)), face('gold', 'base', clasp(.12)),                  // csatok
      dpth('gold', 'dark', [-.12, .12].map(x => rrect(-.008, -.008, .008, .006, .003, ([u, v]) => F(x + u, .215 + v, .006), 1))),
      dpth('steel', 'base', [-.08, .08].map(x => rrect(-.015, -.006, .015, .006, .003, ([u, v]) => P([x + u, H + .004 + v, 0]), 1))),   // rögzítők
      shine([F(-W + .025, H - .04), F(-W + .045, H - .04), F(-W + .045, .06), F(-W + .025, .06)], .45),
    ] });
  }

  // ============================================================================================
  //  11. Nagyi – kedves nagymama mellképe, szemből kicsit 3/4-ben, arc nélkül (mint a 🚶): ősz haj kontyba
  //      tűzve, kerek szemüveg, pirospozsgás arc, lila kardigán gombokkal, fehér blúzgallér. (cm-ben, y fel)
  // ============================================================================================
  {
    const TILT = 0, Y = ([x, y]) => [x, 90 - y], cs = (x, y, r, n = 14, ry = r) => circ(x, 90 - y, r, n, ry);
    const coat = smooth([[-27, 0], [-26, 13], [-19, 21], [-8, 25], [8, 25], [19, 21], [26, 13], [27, 0]].map(Y), 3).concat([Y([27, 0])]);
    const head = cs(1, 44, 13.5, 18);
    fin('nagyi', { emoji:['👵'], hu:'nagyi', en:'grandma', look:'friendly faceless grandma bust: grey hair in a bun, round glasses, rosy cheeks, purple cardigan with buttons over a white blouse collar', tilt:TILT, shapes:[
      face('steel', 'base', cs(2, 60, 7.5, 14)),                                          // konty
      det('steel', 'light', cs(0.5, 62, 3.5, 8)),
      face('purple', 'base', coat),                                                       // kardigán
      det('purple', 'light', [Y([-25, 2]), Y([-24, 14]), Y([-17, 21]), Y([-9, 23]), Y([-13, 2])], { o:.9 }),
      det('purple', 'dark', [Y([14, 2]), Y([18, 20]), Y([25, 13]), Y([26, 2])], { o:.9 }),
      face('skin', 'base', [Y([-5, 25]), Y([6, 25]), Y([5, 33]), Y([-4, 33])]),              // nyak
      det('white', 'base', [Y([-9, 25]), Y([0, 11]), Y([10, 25]), Y([5, 26]), Y([0, 20]), Y([-4, 26])], { line:true }),   // blúzgallér
      ln('purple', 'line', [Y([0, 11]), Y([0, 1])], 1),
      dpth('cream', 'base', [8, 3].map(y => cs(3, y, 1.3, 8))),                              // gombok
      face('skin', 'base', head),                                                         // fej
      face('steel', 'light', pos(hull([...circ(1, 90 - 46, 14.6, 16).filter(([, y]) => y <= 90 - 43), Y([-13.4, 36]), Y([15.4, 36])]))),   // haj
      det('steel', 'base', [Y([9, 58]), Y([14, 52]), Y([15.4, 37]), Y([12.5, 37]), Y([12.5, 48])], { o:.8 }),
      det('skin', 'base', clip(head, [Y([-10.5, 48.5]), Y([12.5, 48.5]), Y([12.5, 20]), Y([-10.5, 20])])),   // arc (arcvonások nélkül)
      det('skin', 'dark', clip(head, [Y([7.5, 48.5]), Y([12.5, 48.5]), Y([12.5, 20]), Y([7.5, 20])])),
      dpth('blossom', 'base', [cs(-7, 36, 2.8, 8, 2), cs(10, 36, 2.8, 8, 2)], { o:.75 }),  // pirospozsgás arc
      dpth('glass', 'light', [cs(-4, 41, 4, 10), cs(7, 41, 4, 10)], { o:.8 }),            // szemüveg
      ln('steel', 'line', circ(-4, 90 - 41, 4, 12).concat([circ(-4, 90 - 41, 4, 12)[0]]), .9),
      ln('steel', 'line', circ(7, 90 - 41, 4, 12).concat([circ(7, 90 - 41, 4, 12)[0]]), .9),
      ln('steel', 'line', [Y([0, 41.5]), Y([3, 41.5])], .9),
      shine(circ(-5, 90 - 53, 4, 8, 1.6), .7),
    ] });
  }

  // ============================================================================================
  //  12. Bakancs – túrabakancs oldalról, 3/4-ben: barna bőr szár, sötétebb orr-rész, párnázott gallér,
  //      piros fűző kampókkal, recés gumitalp. (hossz 30 cm, magasság 20 cm; méterben)
  // ============================================================================================
  {
    const TILT = -10, Z = .045;
    const up = [[-.12, .035], [.12, .035], [.15, .05], [.155, .075], [.12, .1], [.06, .12], [.02, .165], [-.02, .2], [-.11, .2], [-.125, .14], [-.135, .07]];
    const sole = [[-.14, 0], [.15, 0], [.168, .016], [.16, .036], [-.14, .036]];
    const P = cam({ az:24, el:10, F:3, tilt:TILT, fit:[...up.flatMap(([x, y]) => [[x, y, Z], [x, y, -Z]]), ...sole.flatMap(([x, y]) => [[x, y, Z + .005], [x, y, -Z - .005]])] });
    const EU = extrude(P, up, -Z, Z), ES = extrude(P, sole, -Z - .005, Z + .005), k = P.k, F = (x, y) => P([x, y, Z]);
    const lace = [[.07, .122], [.04, .145], [.015, .17], [-.01, .19]];
    fin('bakancs', { emoji:['🥾'], hu:'túrabakancs', en:'hiking boot', look:'brown leather hiking boot in three-quarter side view: darker toe cap, padded dark collar, red laces with metal hooks and a chunky lugged dark rubber sole', tilt:TILT, shapes:[
      face('dark', 'base', ES.front), pth('dark', 'dark', ES.all.slice(1)),                // talp
      dpth('dark', 'line', [-.12, -.08, -.04, 0, .04, .08, .12].map(x => [F(x, 0), F(x + .022, 0), F(x + .018, .014), F(x + .004, .014)])),   // recék
      pth('wood', 'light', EU.tone('light')),                                             // nyelv és fűzés felülete
      pth('wood', 'dark', [...EU.tone('base'), ...EU.tone('dark'), ...EU.tone('line')]),
      face('wood', 'base', EU.front),                                                     // szár oldala
      det('dark', 'line', [P([-.108, .2, Z - .008]), P([-.022, .2, Z - .008]), P([-.022, .2, -Z + .008]), P([-.108, .2, -Z + .008])]),   // a szár nyílása
      det('wood', 'light', [F(-.11, .19), F(-.06, .19), F(-.1, .06), F(-.125, .07)], { o:.8 }),
      det('chocolate', 'base', [F(.06, .035), F(.12, .035), F(.15, .05), F(.155, .075), F(.12, .1), F(.075, .108), F(.05, .07)]),   // orr-rész
      det('chocolate', 'base', [F(-.135, .035), F(-.07, .035), F(-.08, .09), F(-.13, .1)], { o:.9 }),   // sarok-borítás
      det('dark', 'base', [F(-.11, .2), F(-.02, .2), F(-.015, .185), F(-.115, .18)]),        // párnázott gallér
      ln('cream', 'dark', [F(-.12, .12), F(.02, .12), F(.06, .09)], .003 * k, { o:.8 }),     // varrás
      ...lace.map(([x, y], i) => ln('red', 'base', [F(x, y), P([x - .018, y + .012, -Z + .005])], .007 * k)),   // fűző
      dpth('steel', 'dark', lace.map(([x, y]) => circ(...F(x - .006, y - .006), .006 * k, 6))),   // kampók
      det('steel', 'dark', [F(-.14, .03), F(.16, .03), F(.16, .036), F(-.14, .036)], { o:.7 }),
      shine([F(-.1, .185), F(-.085, .185), F(-.11, .08), F(-.12, .08)], .5),
    ] });
  }

  // ============================================================================================
  //  13. Jeges út – aszfaltdarab felülről-oldalról: szaggatott felezővonal, folytonos szélső vonal,
  //      rajta csillogó, áttetsző jégfolt jégkristályokkal és repedésekkel. (2 × 1,4 m; méterben)
  // ============================================================================================
  {
    const TILT = -8, W = 1, D = .7, T = .12;
    const P = cam({ az:28, el:38, F:10, tilt:TILT, fit:corners(-W, W, -T, 0, -D, D) });
    const k = P.k, b = box(P, -W, W, -T, 0, -D, D), G = (x, z) => P([x, .002, z]);
    const ice = smooth([[-.55, .35], [-.2, .5], [.25, .42], [.6, .5], [.78, .2], [.6, -.12], [.3, -.3], [-.1, -.25], [-.4, -.4], [-.72, -.1], [-.7, .2], [-.55, .35]].map(([x, z]) => G(x, z)), 3);
    const flake = (x, z, r) => { const c = G(x, z); return ART.geo.star(c[0], c[1], r * k, r * k * .38, 6); };
    fin('jeges_ut', { emoji:[], hu:'jeges út', en:'icy road patch', look:'three-quarter view of a slab of dark asphalt road with a dashed centre line and a solid edge line, covered by a shiny translucent patch of ice with little ice crystals and cracks', tilt:TILT, shapes:[
      face('dark', 'base', b.front), face('dark', 'dark', b.right),                        // az aszfalt vastagsága
      face('dark', 'light', b.top),                                                       // útfelület
      dpth('white', 'base', [[-.95, -.55], [-.1, .35]].map(([x0, x1]) => [G(x0, .04), G(x1, .04), G(x1, -.04), G(x0, -.04)]).concat([[G(.35, .04), G(.95, .04), G(.95, -.04), G(.35, -.04)]])),   // felezővonal
      det('white', 'base', [G(-W + .02, .58), G(W - .02, .58), G(W - .02, .52), G(-W + .02, .52)]),   // szélső vonal
      det('glass', 'base', ice, { line:true, o:.85 }),                                      // jégfolt
      det('glass', 'light', smooth([[-.5, .28], [-.15, .4], [.2, .3], [-.1, .1], [-.45, .05], [-.5, .28]].map(([x, z]) => G(x, z)), 2), { o:.9 }),
      ln('sky', 'dark', [G(-.2, -.15), G(.05, .05), G(.3, .02), G(.45, .22)], .012 * k, { o:.8 }),   // repedések
      ln('sky', 'dark', [G(.05, .05), G(.1, -.2)], .01 * k, { o:.8 }),
      det('white', 'light', flake(.5, .25, .11), { line:true }),                           // jégkristályok
      det('white', 'light', flake(-.35, -.15, .09), { line:true }),
      det('white', 'light', flake(.2, -.18, .06), { line:true }),
      shine([G(-.45, .3), G(-.3, .38), G(.1, .1), G(-.05, .03)], .75),
      shine([G(.45, .0), G(.55, .03), G(.62, -.05), G(.52, -.08)], .6),
    ] });
  }

})();
