// ============================================================
//  Matricák — hiányzó tartalom-tárgyak B szinten (docs/rajzolas.md): pizza, alma, díszített karácsonyfa,
//  hervadt virág, fogaskerék és a méhesdi Helytörténeti Múzeum épülete. Ezekre eddig a nyers emoji maradt
//  a tartalomban (🍕 🍎 🎄 🥀 ⚙️ 🏛️), ezért mindegyik emoji-álnevet is kap.
//  A dobozszerű és kerek tárgyak valódi méretből vetítve (ART.geo.camera), a növények 2D-ben rajzolva (y lefelé);
//  4 éles tónus, 3/4-es nézet, tömör olíva árnyék, szöveg és márkajel nélkül.
//  A fin() a kész rajzot a vászonra illeszti (perem + árnyék tartalékkal).
//  A segédek (vetítés, vágás, fin() illesztés) az art-tortenelem.js készletének másolata – így a fájl önálló.
//  Render: node tools/art-render.js 2d web/js/art/art-extra2.js ki.png --skip extra2
// ============================================================
(function(){
  const { rad, camera, band, star } = ART.geo;
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

  // ---------------- saját segédek (csak ebben a fájlban) ----------------
  // zárt töröttvonal simítása (a smooth zárt változata)
  const smoothC = (pts, n = 3) => { const m = lerp(pts[pts.length - 1], pts[0], .5); return smooth([m, ...pts, m], n).slice(0, -1); };
  // levél-forma sokszögként (két hegyes vég): tő (x, y), irány (fok, y lefelé), hossz, szélesség
  const leafPts = (x, y, deg, len, wid, n = 6) => { const dx = cos(deg), dy = sin(deg);
    const side = s => Array.from({ length:n + 1 }, (_, i) => { const t = i / n, o = s * wid / 2 * Math.sin(Math.PI * t) * (1 - .3 * t); return [x + dx * len * t - dy * o, y + dy * len * t + dx * o]; });
    return [...side(1), ...side(-1).reverse().slice(1, -1)]; };
  // hullámos szélű folt (tehénfolt, füstpamacs)
  const blob = (cx, cy, rx, ry, deg, wob, ph, n = 12) => Array.from({ length:n }, (_, i) => {
    const a = 2 * Math.PI * i / n, q = 1 + wob * Math.sin(3 * a + ph) + wob * .5 * Math.sin(5 * a + ph * 2), x = rx * q * Math.cos(a), y = ry * q * Math.sin(a);
    return [cx + x * cos(deg) - y * sin(deg), cy + x * sin(deg) + y * cos(deg)]; });
  // elvékonyodó sáv (ág, levél, tömlő): vastagság w0 → w1 a vonal mentén
  const taper = (pts, w0, w1, cap = true) => band(pts, t => w0 + (w1 - w0) * t, cap);
  // vetített kör egy vízszintes síkon (y = magasság) – kupak, dugó, pocsolya
  const disc = (P, cx, y, cz, rx, rz = rx, n = 14) => circ(0, 0, 1, n).map(([a, b]) => P([cx + rx * a, y, cz + rz * b]));
  // félsík konvex sokszögként: a p → q irány BAL oldala (a tónus-lapok kivágásához)
  const halfPlane = (p, q, D = 400) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    return [[p[0] - ux * D, p[1] - uy * D], [q[0] + ux * D, q[1] + uy * D], [q[0] + ux * D + nx * D, q[1] + uy * D + ny * D], [p[0] - ux * D + nx * D, p[1] - uy * D + ny * D]]; };
  // egy tónus-lap: a sziluett félsíkkal vágott darabja, a kontúrtól behúzva
  const tone = (sil, p, q) => inset(clip(sil, halfPlane(p, q)), sil);

  const LI = [[100, 12], [0, 88]], DA = [[0, 88], [100, 12]];   // fény felőli (bal-fent) és árnyékos (jobb-lent) félsík

  // ============================================================================================
  //  1. Pizza – egész pizza enyhén ferde felülnézetben: vastag, dudoros kéregperem, paradicsomos alap,
  //     hullámos szélű olvadt sajt, három vágásnyom (hat szelet), bazsalikomlevelek és paradicsomkarikák.
  //     (átmérő 32 cm, vastagság 2,2 cm; méterben)
  // ============================================================================================
  {
    const TILT = -6, R = .16, TH = .022;
    const P = cam({ az:10, el:52, F:1.6, tilt:TILT, fit:corners(-R, R, 0, TH, -R, R) });
    const k = P.k;
    const top = disc(P, 0, TH, 0, R, R, 26), bot = disc(P, 0, 0, 0, R, R, 26), sil = hull([...top, ...bot]);
    const D = (r, y, n = 22) => disc(P, 0, y, 0, r, r, n);
    const at = (r, a, y = TH + .002) => P([r * cos(a), y, r * sin(a)]);
    const sajt = blob(0, 0, .126, .126, 0, .04, 1.2, 16).map(([x, z]) => P([x, TH + .003, z]));   // olvadt sajt hullámos pereme
    const vagas = a => ln('cardboard', 'dark', [at(.01, a), at(.124, a)], .008 * k);              // szeletnyom
    const level = (r, a, deg, len) => { const c = at(r, a, TH + .006); return leafPts(c[0], c[1], deg, len, len * .58); };
    const K = [[.072, -52], [.082, 78], [.07, 186]];                                              // paradicsomkarikák helye
    const karika = ([r, a], rr) => { const c = at(r, a, TH + .005); return circ(c[0], c[1], rr, 12, rr * .78); };
    fin('pizza', { emoji:['🍕'], hu:'pizza', en:'whole pizza seen from above at a slight angle', look:'whole round pizza seen from above at a slight angle: thick puffy baked crust rim, red tomato sauce, melted cheese with a wavy edge, three cut lines marking six slices, a few tomato rounds and fresh basil leaves', tilt:TILT, shapes:[
      face('cardboard', 'base', sil),                                                   // kéreg: perem és oldal
      det('cardboard', 'light', inset(top, sil)),                                       // a perem napos teteje
      det('cardboard', 'dark', tone(sil, DA[0], DA[1]), { o:.5 }),                       // árnyékos oldal
      face('tomato', 'base', D(.134, TH + .001)),                                       // paradicsomos alap
      det('gold', 'base', sajt),                                                        // olvadt sajt
      det('gold', 'light', inset(clip(sajt, halfPlane(LI[0], LI[1])), sajt), { o:.85 }),
      det('honey', 'dark', inset(clip(sajt, halfPlane(DA[0], DA[1])), sajt), { o:.4 }),
      dpth('tomato', 'dark', K.map(q => karika(q, 4.6))),                                 // paradicsomkarikák
      dpth('red', 'base', K.map(q => karika(q, 3.1))),
      vagas(-84), vagas(-24), vagas(36),
      dpth('leaf', 'base', [level(.055, 14, -26, 9), level(.095, 128, 36, 8), level(.06, -132, -150, 8.5)]),   // bazsalikom
      dpth('leaf', 'light', [level(.055, 14, -26, 6), level(.095, 128, 36, 5.4), level(.06, -132, -150, 5.6)], { o:.7 }),
      shine(tube([at(.152, -164), at(.158, -140), at(.152, -116)], 3.4, false), .5),
    ] });
  }

  // ============================================================================================
  //  2. Alma – piros alma 3/4-es nézetben: szív-szerű váll, a szár körül mélyedés, fás szár, egy levél
  //     középérrel, apró világos pöttyök (paraszemölcs) és fénycsík. (átmérő 8 cm)
  // ============================================================================================
  {
    const TILT = 10;
    const g = (th, a, w) => { const q = (((th - a + 540) % 360) - 180) / w; return Math.exp(-q * q); };   // harang-görbe a sziluett hangolásához
    const rf = th => 1 - .2 * g(th, -90, 15) - .06 * g(th, 90, 26) + .05 * g(th, -32, 26) + .05 * g(th, -148, 26);
    const sil = Array.from({ length:30 }, (_, i) => { const th = 360 * i / 30, r = rf(th); return [50 + 33 * r * cos(th), 58 + 31 * r * sin(th)]; });
    const LX = 55, LY = 20;
    fin('alma', { emoji:['🍎'], hu:'alma', en:'red apple with a stem and a leaf', look:'shiny red apple in three-quarter view with a heart-shaped shoulder, a dip around the woody stem, one green leaf with a midrib, tiny pale speckles on the skin and a bright highlight', tilt:TILT, shapes:[
      face('red', 'base', sil),
      det('red', 'light', tone(sil, LI[0], LI[1])),
      det('red', 'dark', tone(sil, DA[0], DA[1])),
      det('red', 'line', tone(sil, [10, 96], [96, 40]), { o:.4 }),                        // legsötétebb élsáv
      det('red', 'dark', circ(50.5, 34.5, 8.5, 12, 3.2), { o:.8 }),                       // mélyedés a szár körül
      det('red', 'line', circ(50, 85, 7, 12, 2.6), { o:.3 }),                             // alsó mélyedés
      dpth('honey', 'light', [[34, 50], [42, 70], [60, 78], [66, 54], [52, 62], [38, 62]].map(([x, y]) => circ(x, y, 1.5, 6, 1.4)), { o:.8 }),
      face('wood', 'base', taper([[50.5, 33], [51.6, 25], [54, 17]], 3.8, 2.4, false)),     // szár
      det('wood', 'light', taper([[50.8, 31], [52.6, 21]], 1.4, 1, false), { o:.7 }),
      face('leaf', 'base', leafPts(LX, LY, -24, 26, 13)),                                 // levél
      det('leaf', 'light', leafPts(LX + .8, LY - .6, -24, 23, 7.5), { o:.8 }),
      ln('leaf', 'dark', [[LX + 1.5, LY - .4], [LX + 22, LY - 9.4]], 1.2),                 // középér
      shine(tube([[30, 42], [26, 54], [29, 66]], 4.6, false), .6),
    ] });
  }

  // ============================================================================================
  //  3. Karácsonyfa – feldíszített, álló fenyő: három ágszint fűrészfogas alsó éllel, fás törzs,
  //     a csúcson csillag, az ágakon gömbdíszek. (2 m magas; a matricán arányosan)
  // ============================================================================================
  {
    const TILT = 8;
    const tiers = [[13, 37, 15, 3], [27, 59, 23, 4], [47, 83, 31, 5]];
    const tierPoly = ([yt, yb, w, n]) => { const pts = [[50, yt], [50 + w * .42, yt + (yb - yt) * .58], [50 + w, yb + 1.2]];
      for(let i = 1; i < 2 * n; i++) pts.push([50 + w - 2 * w * i / (2 * n), yb + (i % 2 ? -3.4 : .6)]);
      return [...pts, [50 - w, yb + 1.2], [50 - w * .42, yt + (yb - yt) * .58]]; };
    const polys = tiers.map(tierPoly);
    // az ágszint látható része (a fölötte lévő szint takar): félsíkkal vágva, a kontúrtól behúzva
    const resz = (i, q) => { const t = polys[i], felette = i ? tiers[i - 1][1] + 1 : 0;
      return inset(clip(clip(t, q), [[0, felette], [100, felette], [100, 100], [0, 100]]), t); };
    const gomb = ([x, y], r = 3.4) => circ(x, y, r, 12);
    const RED = [[41, 33], [59, 55]], BLUE = [[59, 31], [37, 56]], GOLD = [[50, 45], [63, 76], [38, 75]];
    fin('karacsonyfa', { emoji:['🎄'], hu:'karácsonyfa', en:'decorated fir christmas tree', look:'decorated fir christmas tree standing on its trunk: three layered branch tiers with jagged lower edges, a gold star on the top, red, blue and gold baubles hanging on the branches', tilt:TILT, shapes:[
      face('wood', 'base', [[45.5, 84], [54.5, 84], [55.5, 94], [44.5, 94]]),              // törzs (csak az alsó ágszint alatt látszik)
      det('wood', 'dark', [[51.6, 85], [54.6, 85], [55.3, 93.6], [52, 93.6]]),
      ...polys.slice().reverse().map(p => face('leaf', 'base', p)),                        // ágszintek alulról
      dpth('leaf', 'light', polys.map((_, i) => resz(i, halfPlane(LI[0], LI[1])))),
      dpth('leaf', 'dark', polys.map((_, i) => resz(i, halfPlane(DA[0], DA[1])))),
      dpth('leaf', 'line', polys.map((_, i) => resz(i, [[0, tiers[i][1] - 3.4], [100, tiers[i][1] - 3.4], [100, 100], [0, 100]])), { o:.45 }),
      pth('gold', 'base', [star(50, 10, 11, 4.6, 5)]),                                     // csúcsdísz
      dpth('honey', 'light', [star(50, 10, 6.4, 2.8, 5)], { o:.85 }),
      pth('red', 'base', RED.map(p => gomb(p))),                                           // gömbdíszek
      pth('blue', 'base', BLUE.map(p => gomb(p))),
      pth('gold', 'base', GOLD.map(p => gomb(p, 3))),
      dpth('paper', 'light', [...RED, ...BLUE, ...GOLD].map(([x, y]) => circ(x - 1.1, y - 1.2, 1.1, 6)), { o:.7 }),
      shine(tube([[40, 22], [36, 32]], 2.6, false), .5),
    ] });
  }

  // ============================================================================================
  //  4. Hervadt virág – a tartalomban a „kár” jele: a szár felül megtörik, a virágfej lelóg, a szirmok
  //     lefelé csüngenek, két levél ernyedten lekonyul, egy szirom már leesett. (kb. 40 cm magas)
  // ============================================================================================
  {
    const TILT = -6;
    const szar = smooth([[45, 95], [43, 78], [42, 60], [44, 46], [51, 37], [59, 39], [62, 47]], 5);
    const FEJ = [62, 48];
    const szirom = (deg, len, wid) => leafPts(FEJ[0], FEJ[1], deg, len, wid);
    const hatso = [szirom(56, 19, 9), szirom(124, 19, 9)], elso = [szirom(74, 22, 10), szirom(96, 21, 10), szirom(112, 16, 8)];
    const lev1 = leafPts(42.5, 61, 126, 25, 11), lev2 = leafPts(43.6, 76, 46, 23, 10);
    fin('hervadt_virag', { emoji:['🥀'], hu:'hervadt virág', en:'wilting flower with a drooping head', look:'wilting flower: the stalk bends over near the top so the dark red flower head hangs upside down with limp drooping petals, two leaves droop down the stalk and one fallen petal lies on the ground', tilt:TILT, shapes:[
      face('leaf', 'dark', taper(szar, 4.4, 2.8, false)),                                 // szár
      det('leaf', 'line', taper(szar.slice(0, 12), 1.6, 1.2, false), { o:.5 }),
      face('leaf', 'dark', lev1),                                                         // lekonyuló levelek
      det('leaf', 'line', leafPts(43.2, 62, 126, 21, 6), { o:.55 }),
      face('leaf', 'dark', lev2),
      det('leaf', 'line', leafPts(44.2, 77, 46, 19, 5.5), { o:.55 }),
      pth('berry', 'base', hatso),                                                        // hátsó, sötétebb szirmok
      pth('red', 'dark', elso),                                                           // csüngő szirmok
      dpth('berry', 'base', elso.map(p => p.map(([x, y]) => [FEJ[0] + (x - FEJ[0]) * .42, FEJ[1] + (y - FEJ[1]) * .42])), { o:.5 }),
      face('soil', 'base', circ(FEJ[0], FEJ[1] - 1, 6.5, 12, 4.4, -14)),                    // vacok
      det('soil', 'dark', circ(FEJ[0] + .6, FEJ[1] + .8, 4.6, 10, 2.6, -14), { o:.7 }),
      face('berry', 'base', leafPts(24, 90, 12, 15, 6.5)),                                  // lehullott szirom
      shine(tube([[40.5, 58], [39.8, 74]], 2.2, false), .45),
    ] });
  }

  // ============================================================================================
  //  5. Fogaskerék – nyolcfogú acél fogaskerék enyhe 3/4-es döntésben: kihúzott (vastagságos) test,
  //     kiemelt agy és tengelyfurat, a fogak tetején fénysáv. (átmérő 20 cm, vastagság 2,2 cm; méterben)
  // ============================================================================================
  {
    const TILT = 12, RT = .1, RR = .077, TZ = .014, HR = .04, BR = .018;
    const P = cam({ az:34, el:20, F:1.4, tilt:TILT, fit:corners(-RT, RT, -RT, RT, -TZ, TZ) });
    const k = P.k, AT = (r, a) => [r * cos(a), r * sin(a)];
    // fogazat: fogankénti 4 pont (tő – fogfej – fogfej – tő) és egy tőívpont a fogak között
    const prof = Array.from({ length:8 }, (_, i) => { const a = 45 * i;
      return [AT(RR, a - 18), AT(RT, a - 8), AT(RT, a + 8), AT(RR, a + 18), AT(RR, a + 22.5)]; }).flat();
    const E = extrude(P, prof, -TZ, TZ);
    const gyuru = (r, z, n = 20) => Array.from({ length:n }, (_, i) => { const a = 360 * i / n; return P([r * cos(a), r * sin(a), z]); });
    fin('fogaskerek', { emoji:['⚙️'], hu:'fogaskerék', en:'metal gear wheel', look:'steel gear wheel with eight teeth seen slightly from the side so its thickness shows, a raised round hub and a dark axle bore in the middle, with a highlight on the upper teeth', tilt:TILT, shapes:[
      pth('steel', 'dark', E.tone('dark')),                                               // oldallapok tónusonként
      pth('steel', 'base', E.tone('base')),
      pth('steel', 'light', E.tone('light')),
      pth('steel', 'line', E.tone('line')),
      det('dark', 'base', gyuru(BR, -TZ + .002)),                                          // a furat belseje (hátrébb)
      face('steel', 'base', E.front),                                                     // elülső lap
      det('steel', 'light', tone(gyuru(RR * .99, TZ), LI[0], LI[1]), { o:.85 }),          // a tárcsa fény felőli és árnyékos fele
      det('steel', 'dark', tone(gyuru(RR * .99, TZ), DA[0], DA[1]), { o:.55 }),
      pth('steel', 'light', [pos(gyuru(HR, TZ + .001)), neg(gyuru(BR * 1.3, TZ + .001))]),     // kiemelt agy
      face('dark', 'base', gyuru(BR, TZ - .003)),                                          // tengelyfurat
      dpth('steel', 'light', [-70, -25].map(a => tube([P([RR * cos(a), RR * sin(a), TZ]), P([RT * .97 * cos(a), RT * .97 * sin(a), TZ])], 2.2, false)), { o:.6 }),
      shine(tube([P([RT * .82 * cos(-118), RT * .82 * sin(-118), TZ]), P([RT * .82 * cos(-84), RT * .82 * sin(-84), TZ])], 3, false), .55),
    ] });
  }

  // ============================================================================================
  //  6. Múzeum – a méhesdi Helytörténeti Múzeum: klasszicista templomhomlokzat 3/4-es nézetben,
  //     négy oszlop, oromzat (timpanon), párkány és széles lépcsősor. (12 m széles; méterben)
  // ============================================================================================
  {
    const TILT = -8, W = 6, D = 2.6, H = 4.6, ST = .9, CZ = D + .75, FZ = D + 1.25, PY = 7.7, LZ = FZ + .95;
    const P = cam({ az:24, el:11, F:80, tilt:TILT, fit:[...corners(-W - .7, W + .7, 0, PY, -D - .2, LZ), [0, PY, 0]] });
    const k = P.k, c = (x, y, z) => P([x, y, z]);
    const fal = box(P, -W, W, ST, H, -D, D);
    const par = box(P, -W - .35, W + .35, H, H + .75, -D - .2, FZ);                        // párkány (architráv)
    const OX = [-4.2, -1.4, 1.4, 4.2], CR = .52;
    const oszlop = (x, y0, y1, r, z = CZ) => [c(x - r, y0, z), c(x + r, y0, z), c(x + r, y1, z), c(x - r, y1, z)];
    const orom = [c(-W - .35, H + .75, FZ), c(W + .35, H + .75, FZ), c(0, PY, FZ)];
    const teto = [c(W + .35, H + .75, FZ), c(W + .35, H + .75, -D - .2), c(0, PY, -D - .2), c(0, PY, FZ)];
    const lepcso = [0, 1, 2].map(j => { const y0 = j * ST / 3, y1 = (j + 1) * ST / 3, z = LZ - j * .4, x = W + .5 - j * .16;
      return { el:[c(-x, y0, z), c(x, y0, z), c(x, y1, z), c(-x, y1, z)], fent:[c(-x, y1, z), c(x, y1, z), c(x, y1, z - .4), c(-x, y1, z - .4)] }; });
    fin('muzeum', { emoji:['🏛️'], hu:'múzeum', en:'small classical museum building', look:'small classical museum in three-quarter view: cream stone temple front with four round columns, a triangular pediment over a plain entablature, a dark doorway behind the columns and a wide flight of steps in front', tilt:TILT, shapes:[
      face('cream', 'dark', fal.right),                                                   // oldalfal
      face('cream', 'dark', fal.front, { o:.95 }),                                        // az oszlopok mögötti fal
      det('dark', 'base', rrect(-1.15, ST, 1.15, ST + 2.9, .12, ([u, v]) => c(u, v, D), 2), { line:true }),   // bejárat
      pth('cream', 'base', OX.map(x => oszlop(x, ST, H, CR))),                             // oszlopok
      dpth('cream', 'light', OX.map(x => oszlop(x - CR * .5, ST + .1, H - .1, CR * .22)), { o:.85 }),
      dpth('cream', 'dark', OX.map(x => oszlop(x + CR * .55, ST + .1, H - .1, CR * .28)), { o:.6 }),
      dpth('cream', 'light', OX.flatMap(x => [oszlop(x, H - .3, H, CR * 1.3), oszlop(x, ST, ST + .22, CR * 1.3)]), { o:.9 }),   // fejezet és lábazat
      face('cream', 'base', par.front),                                                   // párkány
      face('cream', 'dark', par.right),
      face('steel', 'dark', teto),                                                        // hátrafelé lejtő tető
      face('cream', 'base', orom),                                                        // oromzat
      det('sage', 'dark', [c(-W * .74, H + 1.1, FZ + .01), c(W * .74, H + 1.1, FZ + .01), c(0, PY - .55, FZ + .01)], { line:true }),   // timpanon-mező
      pth('steel', 'base', lepcso.map(s => s.el)),                                        // lépcsősor
      dpth('steel', 'light', lepcso.map(s => s.fent)),
      shine([c(-W - .3, H + .6, FZ - .02), c(-W * .45, H + .6, FZ - .02), c(-W * .45, H + .72, FZ - .02), c(-W - .3, H + .72, FZ - .02)], .5),
    ] });
  }

})();
