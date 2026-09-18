// ============================================================
//  Matricák — természet, B szint (docs/rajzolas.md): a „2075 – Vágod a zöld jövőt?” repülő matricái és tartalom-ikonok.
//  Szerves formák (láng, felhő, lomb, állatok): kontúr + a közepéből sugárirányban mért, élesen elvágott tónus-sarlók
//  (világos bal-fent, sötét és legsötétebb élsáv jobb-lent). Forgástestek és dobozok (cserép, fenyő, rönk): valódi
//  méretekből vetítve (ART.geo.camera). Semmi nem árulja el, hogy a dolog káros vagy „ökos” (nincs pipa, nincs X).
//  Render: node tools/art-render.js 2d web/js/art/art-nature-b.js ki.png --skip nature
// ============================================================
(function(){
  const { r1, rad, band, arc, camera } = ART.geo;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const RR = pts => pts.map(p => [r1(p[0]), r1(p[1])]);
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const orient = p => (area(p) >= 0 ? p : [...p].reverse());
  // sokszögek → egy útvonal, azonos körüljárással (az átfedő részek ne lyukadjanak ki)
  const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => {
    const q = RR(orient(p.length > 8 ? simplify(p, .18) : p)).filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]);
    return 'M' + q.map(v => v.join(' ')).join(' ') + 'Z'; }).join('');
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // Douglas–Peucker ritkítás (zárt sokszög) – kicsi SVG
  function simplify(poly, eps = .25){
    const dp = pts => { if(pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; let best = 0, bi = 0;
      for(let i = 1; i < pts.length - 1; i++){ const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if(d > best){ best = d; bi = i; } }
      return best > eps ? [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))] : [a, b]; };
    const half = Math.floor(poly.length / 2);
    return [...dp(poly.slice(0, half + 1)).slice(0, -1), ...dp([...poly.slice(half), poly[0]]).slice(0, -1)];
  }
  // átfedő konvex sokszögek uniójának körvonala (forgástest sziluettje)
  function envelope(polys, step = .45){
    const xs = polys.flat().map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), N = Math.max(8, Math.ceil((x1 - x0) / step)), top = [], bot = [];
    for(let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * Math.min(Math.max(i / N, .0005), .9995); let lo = Infinity, hi = -Infinity;
      for(const poly of polys) for(let j = 0; j < poly.length; j++){ const a = poly[j], b = poly[(j + 1) % poly.length];
        if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0){ const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
      if(lo < Infinity){ top.push([x, lo]); bot.push([x, hi]); }
    }
    return simplify([...top, ...bot.reverse()], .25);
  }
  // a sziluett közelében lévő pontok behúzása, hogy a tónus-lapok ne takarják le a kontúrt
  function inset(pts, sil, d = .85){
    const s = Math.sign(area(sil)) || 1, n = sil.length;
    return pts.map(p => { let best = null, bd = Infinity;
      for(let i = 0; i < n; i++){ const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey; if(L2 < 1e-9) continue;
        const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, dd = Math.hypot(p[0] - qx, p[1] - qy);
        if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:Math.sqrt(L2) }; } }
      return !best || bd >= d ? p : [best.qx - best.ey / best.L * s * d, best.qy + best.ex / best.L * s * d]; });
  }
  // konvex vágás (Sutherland–Hodgman): a subject azon része, ami a konvex cp-n belül van
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
  const circ = (cx, cy, r, n = 12, ry = r, rot = 0) => Array.from({ length:n }, (_, i) => { const t = rad(360 * i / n), x = r * Math.cos(t), y = ry * Math.sin(t);
    return [cx + x * cos(rot) - y * sin(rot), cy + x * sin(rot) + y * cos(rot)]; });
  const shrink = (poly, c, d) => poly.map(p => { const dx = c[0] - p[0], dy = c[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * d, p[1] + dy / l * d]; });
  // sima görbe a pontokon át (Catmull–Rom): zárt (smC) és nyitott (smO)
  const cr = (p0, p1, p2, p3, t) => [0, 1].map(k => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t));
  const smC = (pts, n = 5, eps = .2) => { const N = pts.length, out = [];
    for(let i = 0; i < N; i++) for(let j = 0; j < n; j++) out.push(cr(pts[(i - 1 + N) % N], pts[i], pts[(i + 1) % N], pts[(i + 2) % N], j / n));
    return simplify(out, eps); };
  const smO = (pts, n = 6) => { const out = [];
    for(let i = 0; i < pts.length - 1; i++) for(let j = 0; j < n; j++) out.push(cr(pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1], j / n));
    out.push(pts[pts.length - 1]); return out; };

  // ---- alakzat-gyártók: fő lap (kontúrral, peremet kap) · dísz-lap · útvonal · dísz-útvonal · fénycsík ----
  const thin = pts => (pts.length > 8 ? simplify(pts, .18) : pts);
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts:RR(thin(pts)) }, o);
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts:RR(thin(pts)) }, o);
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, p:pathOf(polys) }, o);
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, p:pathOf(polys) }, o);
  const shineP = (pts, o = .6) => det('paper', 'light', pts, { o });

  // ---- tónus-sarlók szerves formára: a fény bal-fentről jön (LA), a matrica megdöntését (tilt) visszaforgatjuk ----
  const LA = -135;
  function rayR(sil, c, a){   // a középpontból a szög irányába: az első metszés a körvonallal
    const ux = cos(a), uy = sin(a); let best = Infinity;
    for(let i = 0; i < sil.length; i++){ const p = sil[i], q = sil[(i + 1) % sil.length], ex = q[0] - p[0], ey = q[1] - p[1], den = ux * ey - uy * ex;
      if(Math.abs(den) < 1e-9) continue; const dx = p[0] - c[0], dy = p[1] - c[1], t = (dx * ey - dy * ex) / den, s = (dx * uy - dy * ux) / den;
      if(t > 0 && s >= 0 && s <= 1 && t < best) best = t; }
    return best === Infinity ? 0 : best;
  }
  function crescent(sil, c, mid, half, depth, pad = .9, n = 16){
    const o = [], i = [];
    for(let k = 0; k <= n; k++){ const t = k / n, a = mid - half + 2 * half * t, r = rayR(sil, c, a), d = Math.min(depth * Math.pow(Math.sin(Math.PI * t), .7), Math.max(0, r - pad) * .9);
      o.push([c[0] + (r - pad) * cos(a), c[1] + (r - pad) * sin(a)]); i.push([c[0] + (r - pad - d) * cos(a), c[1] + (r - pad - d) * sin(a)]); }
    return simplify([...o, ...i.reverse()], .15);
  }
  // szerves test 4 tónusban: alap + világos sarló + sötét sarló + legsötétebb élsáv
  function blob(m, sil, c, o = {}){
    const T = o.tilt || 0, L = LA - T + (o.lshift || 0), D = 45 - T + (o.dshift || 0), out = [pth(m, 'base', [sil], o.line === false ? { line:false } : {})];
    if(o.ld !== 0) out.push(det(o.lm || m, 'light', crescent(sil, c, L, o.lh || 80, o.ld || 7)));
    if(o.dd !== 0) out.push(det(o.dm || m, 'dark', crescent(sil, c, D, o.dh || 78, o.dd || 6)));
    if(o.ed !== 0) out.push(det(o.dm || m, 'line', crescent(sil, c, D, o.eh || 58, o.ed || 2), { o:.35 }));
    return out;
  }
  // körök uniója (felhő, lomb) a c pontból sugárirányban mintavételezve; c minden irányban legalább egy körbe essen
  const union = (C, c) => simplify(Array.from({ length:120 }, (_, i) => { const a = i * 3, u = [cos(a), sin(a)]; let r = 0;
    for(const [x, y, R] of C){ const dx = x - c[0], dy = y - c[1], b = u[0] * dx + u[1] * dy, q = b * b - (dx * dx + dy * dy - R * R); if(q >= 0) r = Math.max(r, b + Math.sqrt(q)); }
    return [c[0] + r * u[0], c[1] + r * u[1]]; }), .2);
  // egy elöl lévő kör körvonalának az a része, amely a többi körön belül fut – „gyűrődés” a felhőn / lombon
  const creases = (C, j, w = 1.5, a0 = 185, a1 = 355) => { const [x, y, R] = C[j], runs = [[]];
    for(let a = a0; a <= a1; a += 10){ const p = [x + R * cos(a), y + R * sin(a)], inn = C.some((q, k) => k !== j && Math.hypot(p[0] - q[0], p[1] - q[1]) < q[2] - 2);
      if(inn) runs[runs.length - 1].push(p); else if(runs[runs.length - 1].length) runs.push([]); }
    return runs.filter(r => r.length > 2).map(r => band(r, w)); };
  // cső / szár / test gerincvonal mentén: sziluett + a fény felőli világos csík + a túloldali sötét csík és élsáv
  function tube(sp, w, o = {}){
    const W = typeof w === 'function' ? w : () => w, n = sp.length, tt = i => i / (n - 1), T = o.tilt || 0, Lv = [cos(LA - T), sin(LA - T)];
    const nr = i => { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    const sg = o.side || Math.sign(sp.reduce((s, _, i) => { const q = nr(i); return s + q[0] * Lv[0] + q[1] * Lv[1]; }, 0)) || 1;
    const off = k => sp.map((p, i) => { const q = nr(i), d = sg * k * W(tt(i)); return [p[0] + q[0] * d, p[1] + q[1] * d]; });
    return { sil:band(sp, W, o.cap !== false), light:band(off(.22), t => W(t) * .3), dark:band(off(-.25), t => W(t) * .28), edge:band(off(-.4), t => W(t) * .1) };
  }
  // levél egyik fele (tő → hegy, side: +1 / −1) és hogy a fény felé néz-e
  function leafHalf(x, y, deg, len, wid, side){
    const dx = cos(deg), dy = sin(deg), h = side * wid / 1.5, P = (t, o) => [x + dx * len * t - dy * o, y + dy * len * t + dx * o], b = [P(0, 0), P(.2, h), P(.7, h), P(1, 0)];
    return Array.from({ length:9 }, (_, i) => { const t = i / 8, u = 1 - t; return [0, 1].map(j => u * u * u * b[0][j] + 3 * u * u * t * b[1][j] + 3 * u * t * t * b[2][j] + t * t * t * b[3][j]); });
  }
  const leafFull = (x, y, deg, len, wid) => [...leafHalf(x, y, deg, len, wid, 1), ...leafHalf(x, y, deg, len, wid, -1).reverse().slice(1, -1)];
  const litSide = (deg, side, T = 0) => (-sin(deg) * side) * cos(LA - T) + (cos(deg) * side) * sin(LA - T) > 0;
  // levelek kéttónusú hajtással: { lit: fény felőli felek, shade: árnyékos felek, deep: sötét sáv az árnyékos fél erén }
  function leaves(list, T = 0){
    const out = { lit:[], shade:[], deep:[] };
    for(const [x, y, deg, len, wid] of list) for(const s of [1, -1]){
      if(litSide(deg, s, T)) out.lit.push(leafHalf(x, y, deg, len, wid, s));
      else { out.shade.push(leafHalf(x, y, deg, len, wid, s)); out.deep.push(leafHalf(x + cos(deg) * len * .08, y + sin(deg) * len * .08, deg, len * .8, wid * .38, s)); }
    }
    return out;
  }

  // ---- vetítés: forgástest és doboz (ugyanaz a készlet, mint az art-nature.js B részében) ----
  function lathe(P, prof, xf = p => p){
    const at = (r, y, a) => P(xf([r * sin(a), y, r * cos(a)]));
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
    return { at, rAt, ring, full, sil, on, strip };
  }
  const ring4 = prof => prof.flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]);

  // a matrica felvétele: tömör árnyék, és ha a perem kilógna, automatikus kicsinyítés (scale) a 8–92 tartományba
  function add(name, meta){
    const T = rad(meta.tilt || 0), pts = meta.shapes.filter(s => !(s.d || s.t === 'line' || s.t === 'shine')).flatMap(s => ART.points(s))
      .map(([x, y]) => [50 + (x - 50) * Math.cos(T) - (y - 50) * Math.sin(T), 50 + (x - 50) * Math.sin(T) + (y - 50) * Math.cos(T)]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const k = Math.min(1, 38 / (50 - Math.min(...xs)), 38 / (Math.max(...xs) - 50), 38 / (50 - Math.min(...ys)), 35.5 / (Math.max(...ys) - 50));
    ART.add(name, Object.assign({ shadow:'hard' }, meta, k < .995 ? { scale:Math.floor(k * 100) / 100 } : {}));
  }

  // =====================================================================
  //  Láng – tábortűz: háromszintű láng (parázsnarancs, méz nyelv, világos mag) két keresztbe tett hasábon, szikrák
  // =====================================================================
  {
    const fl = smC([[50, 8], [57, 20], [66, 30], [73, 42], [76, 55], [72, 67], [62, 75], [50, 78], [37, 75], [28, 67], [24, 55], [26, 42], [31, 30], [36, 40], [41, 32], [45, 21]]);
    const tg = smC([[50, 33], [56, 45], [62, 55], [63, 66], [57, 73], [50, 75], [43, 73], [37, 66], [38, 56], [44, 47]]);
    const core = smC([[50, 51], [55, 59], [57, 67], [50, 72], [43, 67], [45, 59]]);
    const A = tube([[17, 80], [76, 89]], 9), B = tube([[83, 79], [25, 90]], 9);
    const spark = (x, y, r) => [[x, y - r], [x + r * .5, y], [x, y + r], [x - r * .5, y]];
    add('tuz', { emoji:['🔥'], hu:'láng', en:'flame', look:'campfire flame on two crossed logs, ember orange outer flame, honey inner tongue, sparks', shapes:[
      ...blob('ember', fl, [50, 58], { ld:9, lshift:-20, dd:7 }),
      pth('honey', 'base', [tg]), det('honey', 'light', core),
      pth('wood', 'base', [A.sil]), det('wood', 'light', A.light),
      pth('wood', 'base', [B.sil]), det('wood', 'light', B.light), det('wood', 'dark', B.dark),
      face('cardboard', 'light', circ(17, 80, 3.4, 10)), face('cardboard', 'light', circ(83, 79, 3.4, 10)),
      pth('honey', 'base', [spark(21, 26, 5), spark(79, 20, 4)]),
      shineP(band([[36, 60], [34, 50], [37, 41]], 2.4), .7),
    ]});
  }

  // =====================================================================
  //  Füstpamacs – gomolygó felhő (öt egymásba futó gomoly, gyűrődésekkel), mögötte suhanás-csíkok
  // =====================================================================
  {
    const C = [[40, 56, 17], [58, 44, 20], [75, 57, 14], [57, 66, 15], [27, 65, 11]], c = [54, 56], sil = union(C, c);
    add('pamacs', { emoji:['💨'], hu:'füstpamacs', en:'dash puff of air', look:'rounded puff of grey-white smoke with speed streaks', shapes:[
      pth('steel', 'base', [band([[7, 42], [28, 42]], 5), band([[11, 79], [30, 79]], 5), band([[4, 61], [18, 61]], 4)]),
      det('steel', 'light', band([[8, 41], [27, 41]], 1.8)),
      ...blob('white', sil, c, { lm:'white', ld:6, dm:'steel', dd:10, dshift:5, ed:2.6 }),
      det('steel', 'base', crescent(sil, c, 60, 70, 5.5, 5)),
      dpth('steel', 'dark', [...creases(C, 3, 1.6), ...creases(C, 0, 1.6), ...creases(C, 4, 1.6)]),
      shineP(band(arc(58, 44, 14, 200, 250, 5), 2.6), .9),
    ]});
  }

  // =====================================================================
  //  Pillangó – 3/4-es nézet: a közeli szárnypár nagy, a távoli rövidülve mögötte; szárnyerek, pöttyök, csápok bunkóval
  // =====================================================================
  {
    const T = 10, fw = [[52, 44], [57, 28], [69, 16], [83, 14], [90, 23], [85, 38], [70, 47], [55, 50]], hw = [[53, 52], [68, 51], [80, 59], [81, 71], [71, 82], [60, 80], [54, 68]];
    const far = p => p.map(([x, y]) => [50 - (x - 50) * .68, y + 2]);
    const FW = smC(fw), HW = smC(hw), fFW = smC(far(fw)), fHW = smC(far(hw));
    const body = tube(smO([[50, 37], [50.5, 54], [50, 75]]), t => 7.5 - 3.5 * t, { tilt:T });
    const veins = [[70, 18], [84, 18], [86, 32], [72, 44]].map(q => band([[54, 47], q], 1)), veinsH = [[74, 60], [76, 74], [64, 79]].map(q => band([[55, 55], q], 1));
    add('pillango', { emoji:['🦋'], hu:'pillangó', en:'blue butterfly', tilt:T, look:'blue butterfly in three-quarter view, near wings large, far wings foreshortened, honey spots', shapes:[
      pth('blue', 'base', [fHW]), pth('blue', 'dark', [fFW]),
      pth('chocolate', 'base', [body.sil]), det('chocolate', 'light', body.light),
      pth('chocolate', 'base', [circ(50, 31.5, 5.6, 14)]), det('chocolate', 'light', crescent(circ(50, 31.5, 5.6, 14), [50, 31.5], LA - T, 70, 2.2)),
      ...blob('sky', HW, [64, 66], { tilt:T, ld:5, dd:5, ed:0 }),
      ...blob('water', FW, [70, 32], { tilt:T, ld:6, dd:6, dm:'blue' }),
      dpth('water', 'line', [...veins, ...veinsH], { o:.45 }),
      dpth('honey', 'base', [circ(81, 23, 3.6, 10), circ(73, 36, 2.4, 8), circ(71, 71, 3, 10), circ(far([[81, 23]])[0][0], 25, 2.4, 8)]),
      { t:'line', m:'chocolate', tone:'base', w:1.8, pts:[[48.5, 27], [41, 13]] }, { t:'line', m:'chocolate', tone:'base', w:1.8, pts:[[51.5, 27], [59, 13]] },
      dpth('chocolate', 'base', [circ(41, 13, 2.4, 8), circ(59, 13, 2.4, 8)]),
      shineP(band([[62, 25], [72, 19]], 2.2), .8),
    ]});
  }

  // =====================================================================
  //  Kis növény – terrakotta cserép peremmel, földdel; a földből kétszikű csíra és egy új levélke bújik ki
  // =====================================================================
  {
    const potP = [[3.1, 0], [3.5, 2], [4.3, 6.3]], rimP = [[4.7, 6.1], [4.8, 7.8]];
    const fit = [...ring4(potP), ...ring4(rimP), [-6.8, 14.4, 0], [6.8, 14.8, 0]];
    const P = camera({ az:0, el:24, fit, span:80 }), k = P.k, B = lathe(P, potP), Rm = lathe(P, rimP);
    const st = [[0, 7.7, 0], [.15, 9.3, .1], [-.1, 10.8, .2], [0, 11.8, .2]].map(P), top = st[3];
    const stem = tube(smO(st), .75 * k);
    const L = leaves([[top[0] - .6, top[1], -158, 6.3 * k, 3.1 * k], [top[0] + .6, top[1], -24, 6.6 * k, 3.2 * k], [top[0], top[1] - .5, -96, 2.2 * k, 1.3 * k]]);
    const crumbs = [[-2, 7.8, 1.5], [1.6, 7.8, 2.2], [2.6, 7.8, -.4], [-2.8, 7.8, -.6], [.6, 7.8, 3.2]].map(p => circ(...P(p), .28 * k, 6, .18 * k));
    add('noveny', { emoji:['🌱', '🪴'], hu:'kis növény', en:'young plant sprout', look:'two-leaf seedling in a terracotta pot with soil', shapes:[
      pth('orange', 'base', [B.sil]), det('orange', 'light', B.strip(-90, -52)), det('orange', 'dark', B.strip(38, 90)), det('orange', 'line', B.strip(72, 90), { o:.35 }),
      pth('orange', 'base', [Rm.sil]), det('orange', 'dark', Rm.strip(38, 90)),
      face('orange', 'light', Rm.full(4.8, 7.8, 28)),
      face('soil', 'base', Rm.full(4.25, 7.8, 28)), dpth('soil', 'dark', crumbs),
      pth('leaf', 'base', [stem.sil]), det('leaf', 'light', stem.light),
      pth('grass', 'base', L.lit), pth('leaf', 'base', L.shade), dpth('leaf', 'dark', L.deep),
      shineP(B.strip(-74, -62, .6, 5.6), .8),
    ]});
  }

  // =====================================================================
  //  Lombos fa – gomolyos korona (hat egymásba futó lombgömb, gyűrődésekkel, fénylő levélkékkel), elágazó törzs, fűfolt
  // =====================================================================
  {
    const C = [[50, 30, 21], [31, 43, 15], [69, 43, 15], [39, 57, 14], [61, 57, 14], [50, 50, 17]], c = [50, 44], sil = union(C, c);
    const dabs = [[36, 30, -40], [44, 20, -20], [26, 42, -60], [58, 18, 10]].map(([x, y, a]) => circ(x, y, 3.2, 8, 1.7, a));
    add('lombfa', { emoji:['🌳'], hu:'lombos fa', en:'round leafy deciduous tree', look:'round leafy tree with clustered crown, forked trunk, grass patch', shapes:[
      pth('leaf', 'base', [circ(50, 87, 23, 20, 5)]), det('leaf', 'dark', crescent(circ(50, 87, 23, 20, 5), [50, 86], 90, 80, 3)),
      { t:'poly', m:'wood', fc:'v', pts:[[44, 88], [45.5, 66], [38, 56], [41.5, 53.5], [48, 61], [50, 50], [52, 61], [58.5, 53.5], [62, 56], [54.5, 66], [56, 88]] },
      ...blob('grass', sil, c, { ld:9, dd:8, ed:3 }),
      dpth('grass', 'dark', [...creases(C, 3, 1.8), ...creases(C, 4, 1.8), ...creases(C, 1, 1.8), ...creases(C, 2, 1.8)]),
      dpth('grass', 'light', dabs),
      shineP(band(arc(50, 30, 15, 205, 245, 5), 2.6), .85),
    ]});
  }

  // =====================================================================
  //  Háló – elhagyott halászháló-kupac („szellemháló”): gubancos szem-rács, kötél, két narancs úszó
  // =====================================================================
  {
    const net = smC([[14, 64], [19, 44], [33, 30], [52, 27], [72, 32], [86, 48], [84, 68], [66, 80], [42, 83], [22, 78]]), c = [50, 56];
    const cp = hull(shrink(net, c, 1.6)), mesh = [];
    for(const a of [36, -36]) for(let s = -60; s <= 60; s += 9){ const dx = cos(a), dy = sin(a), nx = -dy, ny = dx, p = [c[0] + nx * s, c[1] + ny * s];
      const seg = band([[p[0] - dx * 60, p[1] - dy * 60], [p[0] + dx * 60, p[1] + dy * 60]], 1.3, false), q = clip(seg, cp); if(q.length > 2) mesh.push(q); }
    const rope = tube(smO([[12, 54], [26, 36], [48, 29], [68, 31], [84, 42]]), 3.4), tail = tube(smO([[80, 72], [88, 78], [86, 88]]), 3);
    const F1 = circ(28, 35, 7.5, 16), F2 = circ(71, 31, 6.5, 16);
    add('halo', { emoji:['🕸️'], hu:'háló', en:'spider web net', look:'tangled abandoned fishing net heap with rope and two orange floats', shapes:[
      ...blob('teal', net, c, { ld:8, dd:8, ed:2.5 }),
      dpth('teal', 'line', mesh, { o:.8 }),
      pth('cardboard', 'base', [rope.sil, tail.sil]), dpth('cardboard', 'light', [rope.light, tail.light]),
      ...blob('orange', F1, [28, 35], { ld:3, dd:2.6, ed:0 }),
      ...blob('orange', F2, [71, 31], { ld:2.8, dd:2.4, ed:0 }),
      shineP(band([[24, 52], [30, 42], [38, 36]], 2.2), .6),
    ]});
  }

  // =====================================================================
  //  Virág – méhlegelő-virágfej 3/4-ben (hátrabillent tányér): két sor szirom, magos korong, szár levéllel
  // =====================================================================
  {
    const M = ([x, y]) => [50 + x, 38 + y * .7], petal = (a, r0, len, wid) => simplify(leafFull(r0 * cos(a), r0 * sin(a), a, len, wid), .45).map(M);
    const back = Array.from({ length:8 }, (_, i) => petal(22.5 + 45 * i, 6, 35, 12)), front = Array.from({ length:8 }, (_, i) => petal(45 * i, 6, 37, 13));
    const sheen = [180, 225, 270, 135].map(a => petal(a, 12, 22, 6)), crease = Array.from({ length:8 }, (_, i) => band([M([16 * cos(45 * i), 16 * sin(45 * i)]), M([36 * cos(45 * i), 36 * sin(45 * i)])], .9));
    const disc = circ(50, 38, 12.5, 20, 9.5), seeds = [[-5, -2], [0, -5], [5, -2], [-3, 3], [3, 3], [0, 0], [7, 2.5], [-7, 2.5]].map(([x, y]) => circ(50 + x, 38 + y, 1.2, 6));
    const stem = tube(smO([[50, 46], [51.5, 68], [53, 90]]), 4), L = leaves([[52, 76, -38, 20, 9]]);
    add('viragfej', { emoji:['🌼'], hu:'virág', en:'yellow blossom flower head', look:'yellow daisy-like bee pasture flower head tilted back, orange seed disc, stem with leaf', shapes:[
      pth('leaf', 'base', [stem.sil]), det('leaf', 'light', stem.light),
      pth('grass', 'base', L.lit), pth('leaf', 'base', L.shade),
      pth('honey', 'dark', back), pth('honey', 'base', front),
      dpth('honey', 'light', sheen), dpth('honey', 'line', crease, { o:.35 }),
      ...blob('orange', disc, [50, 38], { ld:3.2, dd:3, ed:1.2 }),
      dpth('orange', 'dark', seeds),
      shineP(band([[40, 34], [44, 31]], 2), .8),
    ]});
  }

  // =====================================================================
  //  Zöld ág – sövény-hajtás: íves szár váltakozó állású, kéttónusú levelekkel, csúcslevéllel
  // =====================================================================
  {
    const S = smO([[25, 90], [33, 73], [45, 55], [58, 38], [71, 21]], 6), dir = i => Math.atan2(S[i + 1][1] - S[i - 1][1], S[i + 1][0] - S[i - 1][0]) * 180 / Math.PI;
    const spec = [[5, -1, 25, 12], [8, 1, 25, 12], [12, -1, 23, 11], [15, 1, 22, 11], [18, -1, 19, 10], [21, 1, 17, 9]].map(([i, s, len, wid]) => [...S[i], dir(i) + s * 50, len, wid]);
    const all = [...spec, [...S[23], dir(23), 18, 10]], L = leaves(all), stem = tube(S.slice(0, 24), t => 4.5 - 2 * t);
    const veins = all.flatMap(([x, y, a, len]) => [.35, .6].flatMap(t => [1, -1].map(sd => { const p = [x + cos(a) * len * t, y + sin(a) * len * t];
      return band([p, [p[0] + cos(a + sd * 42) * len * .2, p[1] + sin(a + sd * 42) * len * .2]], .8); })));
    add('zoldag', { emoji:['🌿'], hu:'zöld ág', en:'green herb sprig', look:'leafy green hedge sprig with alternating two-tone leaves', shapes:[
      pth('leaf', 'base', [stem.sil]), det('leaf', 'light', stem.light),
      pth('grass', 'light', L.lit), pth('leaf', 'base', L.shade), dpth('leaf', 'dark', L.deep),
      dpth('leaf', 'line', veins, { o:.35 }),
      pth('grass', 'base', [circ(...S[10], 2.6, 8), circ(...S[16], 2.2, 8)]), dpth('grass', 'light', [circ(S[10][0] - .8, S[10][1] - .8, 1, 6), circ(S[16][0] - .7, S[16][1] - .7, .8, 6)]),
      shineP(band([[40, 44], [45, 38]], 1.8), .7),
    ]});
  }

  // =====================================================================
  //  Trópusi hal – bohóchal-forma: narancs test két fehér sávval, sötét szegélyű uszonyok, nagy szem
  // =====================================================================
  {
    const body = smC([[13, 50], [19, 38], [33, 28], [51, 26], [65, 32], [73, 42], [75, 50], [73, 58], [65, 68], [51, 74], [33, 72], [19, 62]]), c = [46, 50];
    const cp = hull(shrink(body, c, 1)), stripe = (x0, w) => { const pts = [];
      for(let y = 18; y <= 82; y += 8) pts.push([x0 - w / 2 - 5 * (1 - ((y - 50) / 32) ** 2), y]);
      for(let y = 82; y >= 18; y -= 8) pts.push([x0 + w / 2 - 5 * (1 - ((y - 50) / 32) ** 2), y]);
      return clip(pts, cp); };
    const tail = smC([[71, 50], [83, 35], [91, 36], [89, 50], [91, 64], [83, 65]]), dorsal = smC([[33, 31], [39, 18], [53, 13], [65, 21], [66, 32]]), low = smC([[43, 70], [45, 82], [55, 85], [60, 71]]);
    add('tropusi_hal', { emoji:['🐠'], hu:'trópusi hal', en:'orange striped tropical fish', look:'clownfish-like orange fish with two white bands, dark-edged fins, big eye', shapes:[
      pth('orange', 'base', [tail]), det('dark', 'base', band([[84, 36.5], [89.5, 37.5], [88, 50], [89.5, 62.5], [84, 63.5]], 2)),
      pth('orange', 'base', [dorsal, low]), dpth('dark', 'base', [band([[40, 19.5], [53, 15], [63.5, 21.5]], 1.8), band([[46.5, 82], [55, 83.5]], 1.8)]),
      ...blob('orange', body, c, { ld:7, dd:6 }),
      dpth('dark', 'base', [stripe(38, 10.5), stripe(59, 9.5)]), det('white', 'light', stripe(38, 7)), det('white', 'light', stripe(59, 6)),
      face('orange', 'light', leafFull(40, 56, 118, 13, 8)),
      dpth('orange', 'dark', [band(arc(34, 50, 15, 140, 220, 6), 1.3)]),
      face('white', 'light', circ(25, 45, 5, 14)), dpth('dark', 'base', [circ(24.2, 45.5, 3, 10)]), dpth('paper', 'light', [circ(23.2, 44.2, 1.1, 6)]),
      shineP(band([[42, 33], [52, 31]], 2.2), .8),
    ]});
  }

  // =====================================================================
  //  Fenyőfa – három egymásra ülő kúp-emelet (vetítve, ívelt alsó éllel), rövid törzs
  // =====================================================================
  {
    const tr = [[.6, 0], [.55, 1.8]], tiers = [[[4.4, 1.4], [1.2, 5.2]], [[3.5, 4], [.9, 7.7]], [[2.6, 6.5], [.05, 10.3]]];
    const P = camera({ az:0, el:14, fit:[...ring4(tr), ...tiers.flatMap(ring4)], span:80 }), Tr = lathe(P, tr), Ls = tiers.map(t => lathe(P, t));
    add('fenyofa', { emoji:['🌲'], hu:'fenyőfa', en:'evergreen pine tree', look:'three-tier conifer seen slightly from above, curved tier edges, short trunk', shapes:[
      pth('wood', 'base', [Tr.sil]), det('wood', 'dark', Tr.strip(30, 90)),
      ...Ls.flatMap(L => [pth('leaf', 'base', [L.sil]), det('leaf', 'light', L.strip(-90, -42)), det('leaf', 'dark', L.strip(34, 90)), det('leaf', 'line', L.strip(70, 90), { o:.35 })]),
      shineP(Ls[2].strip(-74, -62, 6.8, 9.6), .7),
    ]});
  }

  // =====================================================================
  //  Csillámok – három négyágú csillám, élesen lapokra törve (bal-fent világos, jobb-lent sötét lapok)
  // =====================================================================
  {
    const spk = (cx, cy, R) => { const P = Array.from({ length:8 }, (_, i) => { const a = -90 + 45 * i, q = i % 2 ? R * .27 : R; return [cx + q * cos(a), cy + q * sin(a)]; });
      const lit = [], dark = [];
      for(let i = 0; i < 8; i++){ const a = P[i], b = P[(i + 1) % 8], mid = Math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx) * 180 / Math.PI, d = cos(mid - LA);
        const tri = inset([[cx, cy], a, b], P, .8); if(d > .3) lit.push(tri); else if(d < -.3) dark.push(tri); }
      return [pth('honey', 'base', [P]), dpth('honey', 'light', lit), dpth('gold', 'dark', dark)]; };
    add('csillamok', { emoji:['✨'], hu:'csillámok', en:'sparkles', look:'three faceted four-point honey sparkles', shapes:[
      ...spk(57, 57, 33), ...spk(24, 27, 15), ...spk(81, 20, 11),
      pth('honey', 'base', [circ(22, 78, 3.2, 10), circ(86, 48, 2.6, 10)]),
      shineP(band([[50, 44], [55, 36]], 1.8), .8),
    ]});
  }

  // =====================================================================
  //  Kezdő jelvény – a 🔰 ék-alakú jelvény vastag lapként 3/4-ben: méz és zöld fél, világos felső él, sötét oldallap
  // =====================================================================
  {
    const T = -10, D = .8, O = [[-4, -5.5], [0, -2.2], [4, -5.5], [4, 2.2], [0, 5.5], [-4, 2.2]], V = ([x, y], z) => [x, -y, z];
    const P = camera({ az:24, el:18, tilt:T, span:76, fit:O.flatMap(p => [V(p, 0), V(p, -D)]) }), F = p => P(V(p, 0)), Bk = p => P(V(p, -D));
    const sF = Math.sign(area(O.map(F))), sides = [];
    O.forEach((a, i) => { const b = O[(i + 1) % O.length], q = [F(a), F(b), Bk(b), Bk(a)]; if(Math.sign(area(q)) !== sF) return;
      let n = [b[1] - a[1], a[0] - b[0]]; if(n[0] * (a[0] + b[0]) / 2 + n[1] * ((a[1] + b[1]) / 2 - .3) < 0) n = [-n[0], -n[1]];   // kifelé mutató normál
      const ny = n[1] / Math.hypot(...n);   // fölfelé néző él = világos tető-lap, a többi sötét oldallap
      sides.push(face((a[0] + b[0]) / 2 < 0 ? 'honey' : 'leaf', ny < -.5 ? 'light' : 'dark', q)); });
    const Lh = [[-4, -5.5], [0, -2.2], [0, 5.5], [-4, 2.2]], Rh = [[0, -2.2], [4, -5.5], [4, 2.2], [0, 5.5]];
    const strip = (a, b, w) => { const n = [0, w]; return [a, b, [b[0] + n[0], b[1] + n[1]], [a[0] + n[0], a[1] + n[1]]].map(F); };
    const inner = O.map(p => [p[0] * .8, p[1] * .8 + .1]).map(F);
    add('kezdo_jelveny', { emoji:['🔰'], hu:'kezdő jelvény', en:'yellow and green chevron badge', tilt:T, look:'thick chevron-shaped beginner badge, honey left half, green right half, no text', shapes:[
      ...sides,
      face('honey', 'base', Lh.map(F)), face('leaf', 'base', Rh.map(F)),
      det('honey', 'light', strip([-3.75, -5.05], [-.2, -2.05], .75)), det('leaf', 'light', strip([.2, -2.05], [3.75, -5.05], .75)),
      det('leaf', 'dark', [[3.2, -4.4], [3.75, -4.8], [3.75, 2.05], [3.2, 2.45]].map(F)),
      dpth('cream', 'light', [band([...inner, inner[0]], .9, false)], { o:.55 }),
      shineP([[-3.4, -3], [-2.8, -2.6], [-2.8, 1.4], [-3.4, 1.1]].map(F), .7),
    ]});
  }

  // =====================================================================
  //  Szálló levelek – három szélben forduló levél kéttónusú hajtással, rövid ágacska, suhanás-ívek
  // =====================================================================
  {
    const L = leaves([[24, 76, -8, 60, 26], [22, 74, -64, 56, 28], [66, 28, 28, 20, 11]]);
    const veins = [[24, 76, -8, 60], [22, 74, -64, 56]].flatMap(([x, y, a, len]) => [.3, .55].flatMap(t => [1, -1].map(s => {
      const p = [x + cos(a) * len * t, y + sin(a) * len * t]; return band([p, [p[0] + cos(a + s * 40) * len * .16, p[1] + sin(a + s * 40) * len * .16]], .9); })));
    const twig = tube(smO([[11, 89], [15, 81], [23, 76]]), 3.6);
    add('levelek', { emoji:['🍃'], hu:'szálló levelek', en:'green leaves fluttering in the wind', look:'three green leaves tumbling in the wind with a small twig and wind arcs', shapes:[
      pth('sage', 'base', [band(smO([[46, 92], [68, 90], [84, 80]]), 3), band(smO([[80, 50], [88, 40], [86, 30]]), 3)]),
      pth('leaf', 'base', [twig.sil]),
      pth('grass', 'light', L.lit), pth('leaf', 'base', L.shade), dpth('leaf', 'dark', L.deep),
      dpth('leaf', 'line', veins, { o:.4 }),
      shineP(band([[36, 64], [44, 50]], 2), .7),
    ]});
  }

  // =====================================================================
  //  Örvény – vastagodó spirál-szalag: világos külső él, sötét belső él, két kicsapódó csepp
  // =====================================================================
  {
    const S = Array.from({ length:48 }, (_, i) => { const th = 1.4 + i * (13 / 47), r = 5 + 2.25 * th; return [50 + r * Math.cos(th), 50 + r * Math.sin(th)]; });
    const sp = tube(S, t => 5 + 6.5 * t, { side:-1 });
    const drop = (cx, cy, s, a) => circ(0, 0, 1, 14).map(([x, y]) => { const yy = y < 0 ? y * 1.7 : y, xx = x * (y < 0 ? 1 + y * .75 : 1); return [cx + s * (xx * cos(a) - yy * sin(a)), cy + s * (xx * sin(a) + yy * cos(a))]; });
    const d1 = drop(84, 18, 4.5, 40), d2 = drop(14, 84, 3.6, -140);
    add('orveny', { emoji:['🌀'], hu:'örvény', en:'blue swirl spiral', look:'thick blue spiral ribbon with light outer edge, two flung droplets', shapes:[
      pth('water', 'base', [sp.sil]), det('water', 'light', sp.light), det('water', 'dark', sp.dark), det('water', 'line', sp.edge, { o:.4 }),
      face('water', 'light', circ(S[0][0], S[0][1], 3.4, 10)),
      pth('water', 'base', [d1, d2]), dpth('water', 'light', [shrink(d1, [84, 18], 1.6).slice(0, 5), shrink(d2, [14, 84], 1.3).slice(0, 5)]),
      shineP(band(arc(50, 50, 33, 200, 235, 5), 2.2), .8),
    ]});
  }

  // =====================================================================
  //  Teknős – oldalról, 3/4-ben: domború páncél hatszöges pajzsokkal és szegély-lemezekkel, lábak, barátságos fej
  // =====================================================================
  {
    const shell = smC([[12, 60], [15, 43], [27, 29], [45, 23], [61, 28], [72, 42], [75, 60]]), c = [44, 48];
    const rim = smC([[8, 58], [44, 57], [79, 58], [77, 65.5], [44, 66.5], [10, 65.5]], 4);
    const hex = circ(44, 40, 9, 6, 7, 0), hexO = hex.map(p => band([p, [44 + (p[0] - 44) * 2.6, 40 + (p[1] - 40) * 2.6]], 1.6));
    const head = union([[83, 47, 8.5], [76, 55, 6]], [80, 51]);
    const near = [tube([[62, 61], [65, 77]], 9).sil, tube([[24, 61], [20, 77]], 9).sil], farL = [tube([[52, 61], [54, 73]], 7).sil, tube([[34, 61], [33, 73]], 7).sil];
    add('teknos', { emoji:['🐢'], hu:'teknős', en:'cute green turtle', look:'friendly green turtle in side three-quarter view, domed shell with hexagon scutes', shapes:[
      pth('grass', 'dark', [...farL, [[9, 61], [2.5, 67], [13, 66]]]),
      pth('grass', 'base', [...near]), dpth('grass', 'light', [band([[60.5, 64], [62.5, 74]], 2.2), band([[22.5, 64], [19.5, 74]], 2.2)]),
      ...blob('grass', head, [81, 50], { ld:3, dd:2.6, ed:0 }),
      dpth('dark', 'base', [circ(85, 45.5, 2.3, 10)]), dpth('paper', 'light', [circ(84.3, 44.8, .8, 6)]),
      dpth('grass', 'line', [band([[84, 53], [87, 54.5], [90, 53]], 1.2)]),
      ...blob('leaf', shell, c, { ld:7, dd:6 }),
      dpth('leaf', 'line', hexO.map(h => clip(h, hull(shrink(shell, c, 1.2)))), { o:.55 }),
      face('grass', 'base', hex),
      pth('grass', 'base', [rim]), dpth('grass', 'dark', [18, 30, 44, 58, 70].map(x => band([[x, 59], [x - .6, 64.5]], 1.2))),
      shineP(band(arc(44, 50, 22, 205, 240, 5), 2.4), .75),
    ]});
  }

  // =====================================================================
  //  Denevér – barátságos, kiterjesztett szárnyakkal (a távoli szárny rövidülve), szárnycsontok, világos has, nagy szemek
  // =====================================================================
  {
    const T = -6, wg = [[55, 44], [64, 31], [78, 25], [91, 29], [90, 41], [89, 53], [83, 50], [77, 57], [71, 52], [65, 59], [58, 55]];
    const far = p => p.map(([x, y]) => [50 - (x - 50) * .74, y + 1]), W = smC(wg, 4), fW = smC(far(wg), 4);
    const bones = [[91, 29], [89, 52], [77, 56], [65, 58]].map(q => band([[57, 44], q], 1.1)), fBones = far([[91, 29], [89, 52], [77, 56]]).map(q => band([far([[57, 44]])[0], q], 1));
    const bodyS = circ(50, 60, 12, 20, 16), headS = circ(50, 39, 12.5, 20, 11.5);
    add('denever', { emoji:['🦇'], hu:'denevér', en:'cute friendly bat', tilt:T, look:'friendly purple bat with spread scalloped wings, pale belly, big round eyes', shapes:[
      pth('purple', 'dark', [fW]), dpth('purple', 'line', fBones, { o:.5 }),
      ...blob('purple', W, [70, 42], { tilt:T, ld:5, dd:0, ed:0 }), dpth('purple', 'line', bones, { o:.5 }),
      ...blob('purple', bodyS, [50, 60], { tilt:T, ld:3, dd:3.5, ed:1.4 }),
      det('purple', 'light', circ(51, 63, 6.5, 14, 9.5)),
      pth('purple', 'base', [[[39, 36], [36, 20], [47, 29]], [[61, 36], [64, 20], [53, 29]]]), dpth('pink', 'base', [[[40, 32], [38.5, 24], [44, 29]], [[60, 32], [61.5, 24], [56, 29]]]),
      ...blob('purple', headS, [50, 39], { tilt:T, ld:3, dd:2.6, ed:0 }),
      dpth('white', 'light', [circ(44.5, 39, 3.8, 12), circ(55.5, 39, 3.8, 12)]), dpth('dark', 'base', [circ(45.3, 39.6, 2.2, 10), circ(56.3, 39.6, 2.2, 10)]),
      dpth('purple', 'line', [band([[47, 46], [50, 47.8], [53, 46]], 1.2)]),
    ]});
  }

  // =====================================================================
  //  Giliszta – S-alakban a földkupacon: gyűrűs test, világosabb nyereg (clitellum), barátságos szemek; a farka a földbe bújik
  // =====================================================================
  {
    const soil = smC([[8, 82], [18, 72], [38, 68], [62, 70], [84, 72], [93, 82], [80, 89], [20, 89]]), S = smO([[18, 76], [26, 58], [42, 62], [56, 70], [70, 62], [76, 44], [71, 30]], 6), n = S.length;
    const w = t => 8.5 + 3 * t, body = tube(S, w), nrm = i => { const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
    const across = (i, k = .42) => { const [nx, ny] = nrm(i), h = w(i / (n - 1)) * k; return [[S[i][0] + nx * h, S[i][1] + ny * h], [S[i][0] - nx * h, S[i][1] - ny * h]]; };
    const rings = [3, 6, 9, 12, 15, 18, 21, 24].map(i => band(across(i), 1.1)), sad = [...across(26, .46), ...across(29, .46).reverse()];
    const [hx, hy] = S[n - 4], [nx, ny] = nrm(n - 4);
    add('giliszta', { emoji:['🪱'], hu:'giliszta', en:'cute earthworm', look:'friendly pink earthworm curving out of a soil mound, ringed body, saddle band', shapes:[
      ...blob('soil', soil, [50, 82], { ld:3, dd:3, ed:0 }),
      ...blob('pink', body.sil, [0, 0], { ld:0, dd:0, ed:0 }), det('pink', 'light', body.light), det('pink', 'dark', body.dark), det('pink', 'line', body.edge, { o:.4 }),
      dpth('pink', 'dark', rings), det('blossom', 'dark', [sad[0], sad[1], sad[3], sad[2]]),
      dpth('dark', 'base', [circ(hx + nx * 2.6, hy + ny * 2.6, 1.7, 8), circ(hx - nx * 2.6, hy - ny * 2.6, 1.7, 8)]),
      pth('soil', 'base', [smC([[12, 80], [16, 74], [24, 74], [27, 80]], 3)]),
      shineP(band(S.slice(8, 16).map(([x, y], j) => { const [ax, ay] = nrm(8 + j); return [x + ax * 2.6, y + ay * 2.6]; }), 1.8), .8),
    ]});
  }

  // =====================================================================
  //  Farönk – fekvő rönk 3/4-ben: kéreg barázdákkal, a vágott végén évgyűrűk és repedés, oldalt egy levágott ágcsonk
  // =====================================================================
  {
    const T = -6, prof = [[3, 0], [3.1, 4.5], [3, 9]], xf = ([x, y, z]) => [y, -x, z], stubP = [[.9, 0], [.75, 1.4]], sxf = ([x, y, z]) => [x + 3.6, y + 2.3, z + 1];
    const fit = [...ring4(prof).map(xf), [3.6, 4.1, 1]], P = camera({ az:32, el:22, tilt:T, span:82, fit });
    const Lg = lathe(P, prof, xf), St = lathe(P, stubP, sxf), E = r => Lg.full(r, 9, 22);
    const grooves = [-35, -5, 25, 55].map((a, j) => band([.6, 2.4, 4.4, 6.5, 8.4].map((y, i) => Lg.on(a + (i % 2 ? 6 : -3) + j, y)), 1.1, false));
    const endRings = [2.1, 1.3].map(r => { const q = E(r); return band([...q, q[0]], .9, false); });
    add('faronk', { emoji:['🪵'], hu:'farönk', en:'wooden log', tilt:T, look:'lying log in three-quarter view, grooved bark, cut end with growth rings and a crack, branch stub', shapes:[
      pth('wood', 'base', [Lg.sil]), det('wood', 'light', Lg.strip(-90, -48)), det('wood', 'dark', Lg.strip(36, 90)), det('wood', 'line', Lg.strip(70, 90), { o:.35 }),
      dpth('wood', 'dark', grooves),
      pth('wood', 'base', [St.sil]), face('cardboard', 'light', St.full(.75, 1.4, 14)),
      face('cardboard', 'light', E(2.95)), dpth('cardboard', 'dark', endRings),
      dpth('wood', 'dark', [circ(...P(xf([0, 9, 0])), .7, 8), band([P(xf([0, 9, 0])), P(xf([1.4, 9, 1])), P(xf([2.6, 9, 1.4]))], 1, false)]),
      shineP(Lg.strip(-74, -64, 1, 8), .8),
    ]});
  }

  // =====================================================================
  //  Kalász – három búzakalász legyezőben: két sorban álló, kéttónusú szemek, szálkák, szárak, egy levél
  // =====================================================================
  {
    const ear = (bx, by, lean, sc) => { const R = ([x, y]) => [bx + x * cos(lean) - y * sin(lean), by + x * sin(lean) + y * cos(lean)], a = d => d + lean;
      const lit = [], sh = [], dk = [], aw = [];
      for(const y of [-6, -12, -18, -24]) for(const s of [-1, 1]){ const [x0, y0] = R([0, y * sc]), d = a(-90 + s * 28);
        const mid = t => [x0 + cos(d) * 10 * sc * t, y0 + sin(d) * 10 * sc * t];
        (s < 0 ? lit : sh).push(circ(...mid(.5), 5.2 * sc, 7, 3.6 * sc, d)); if(s > 0) dk.push(circ(...mid(.58), 3.6 * sc, 5, 1.5 * sc, d + 12));
        const tip = [x0 + cos(d) * 10 * sc, y0 + sin(d) * 10 * sc]; aw.push(band([tip, [tip[0] + cos(a(-90 + s * 12)) * 13 * sc, tip[1] + sin(a(-90 + s * 12)) * 13 * sc]], .9, false)); }
      const [tx, ty] = R([0, -28 * sc]); lit.push(circ(tx + cos(a(-90)) * 4.5 * sc, ty + sin(a(-90)) * 4.5 * sc, 4.8 * sc, 7, 3.2 * sc, a(-90))); aw.push(band([[tx + cos(a(-90)) * 9 * sc, ty + sin(a(-90)) * 9 * sc], [tx + cos(a(-90)) * 22 * sc, ty + sin(a(-90)) * 22 * sc]], .9, false));
      return [pth('gold', 'light', lit), pth('gold', 'base', sh), dpth('gold', 'dark', dk), dpth('gold', 'line', aw, { o:.7 })]; };
    const stems = [[[50, 90], [48, 68], [37, 48]], [[50, 90], [50, 66], [50, 44]], [[50, 90], [53, 68], [63, 49]]].map(p => band(smO(p, 4), 2.8, false));
    const L = leaves([[50, 82, -58, 26, 6]]);
    add('kalasz', { emoji:['🌾'], hu:'kalász', en:'golden wheat ears', look:'three golden wheat ears fanned out, two-tone kernels, long awns, one blade', shapes:[
      pth('gold', 'base', stems), dpth('gold', 'light', [band(smO([[49, 88], [49, 66], [49, 46]]), 1)]),
      pth('honey', 'light', L.lit), pth('honey', 'dark', L.shade),
      ...ear(37, 48, -24, .82), ...ear(63, 49, 22, .82), ...ear(50, 44, 0, 1),
      shineP(band([[47.5, 36], [47.5, 26]], 1.6), .8),
    ]});
  }
})();
