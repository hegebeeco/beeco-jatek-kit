// ============================================================
//  Matricák — célzott matricák a 2075 és a jelenetek tárgyaihoz, és a még hiányzó emojik  ·  stílus: docs/grafika-spec.md
//  A célzott matricák emoji nélküliek (emoji:[]): a tartalom a nevükkel hivatkozik rájuk.
// ============================================================
(function(){
  const { r1, R, rad, arc, band, leaf } = ART.geo;   // közös segédek: web/js/art/art.js

  // ================= A) célzott matricák (2075 – Vágod a zöld jövőt?, jelenetek): B szinten, a fájl végén =================

  // ================= B) hiányzó emojik =================
  ART.add('bevasarlokocsi', { emoji:['🛒'], hu:'bevásárlókocsi', en:'shopping cart', shapes:[
    { t:'poly', m:'steel', pts:band([[24, 30], [12, 17]], 5) },
    { t:'rect', x:6, y:11, w:14, h:7, r:3.5, m:'red', fc:'h', rot:45, ox:13, oy:14.5 },
    { t:'poly', m:'steel', tone:'dark', pts:band([[33, 62], [29, 74], [82, 74]], 4.5) },
    { t:'poly', m:'steel', pts:[[21, 28], [91, 28], [81, 64], [31, 64]] },
    { t:'line', m:'steel', tone:'line', w:2, pts:[[26, 42], [87, 42]] }, { t:'line', m:'steel', tone:'line', w:2, pts:[[29, 53], [84, 53]] },
    { t:'line', m:'steel', tone:'line', w:2, pts:[[42, 29], [45, 63]] }, { t:'line', m:'steel', tone:'line', w:2, pts:[[58, 29], [58, 63]] },
    { t:'line', m:'steel', tone:'line', w:2, pts:[[74, 29], [70, 63]] },
    { t:'circle', cx:37, cy:83, r:7, m:'dark' }, { t:'circle', cx:75, cy:83, r:7, m:'dark' },
  ]});

  ART.add('borond', { emoji:['🧳'], hu:'bőrönd', en:'travel suitcase with handle and straps', shapes:[
    { t:'path', m:'dark', fc:'h', p:'M36 32 V22 C36 16 40 13 46 13 H54 C60 13 64 16 64 22 V32 H57.5 V23 C57.5 21 56.5 20 54.5 20 H45.5 C43.5 20 42.5 21 42.5 23 V32 Z' },
    { t:'circle', cx:22, cy:87, r:4.5, m:'dark', fc:'none' }, { t:'circle', cx:78, cy:87, r:4.5, m:'dark', fc:'none' },
    { t:'rect', x:9, y:30, w:82, h:56, r:8, m:'orange' },
    { t:'rect', x:24, y:30, w:9, h:56, m:'wood', fc:'v' }, { t:'rect', x:67, y:30, w:9, h:56, m:'wood', fc:'v' },
    { t:'rect', x:23, y:48, w:11, h:9, r:2, m:'gold', fc:'none' }, { t:'rect', x:66, y:48, w:11, h:9, r:2, m:'gold', fc:'none' },
    { t:'line', m:'orange', tone:'dark', w:2, pts:[[33, 40], [67, 40]] },
    { t:'shine', x:13, y:36, w:4, h:22 },
  ]});

  // hullám: jobbra átbukó, befelé tekeredő hullám; a tekercs belseje sötétebb víz, a gerincén hullámos szélű tajték
  const bez = (a, b, c, d, n = 10) => Array.from({ length:n + 1 }, (_, i) => { const t = i / n, u = 1 - t;
    return [0, 1].map(k => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); });
  const crest = [...bez([8, 60], [8, 32], [30, 12], [56, 12]).slice(4), ...bez([56, 12], [76, 12], [90, 26], [90, 42]).slice(1), ...bez([90, 42], [90, 52], [84, 58], [76, 58]).slice(1)];
  // a tajték a gerinc-vonalnál kicsit beljebb fut (jobb kéz felőli normális mentén), hogy kék víz vegye körül
  const foam = R(crest.map((p, i) => { const a = crest[Math.max(0, i - 1)], b = crest[Math.min(crest.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] - dy / l * 5, p[1] + dx / l * 5]; }));
  ART.add('hullam', { emoji:['🌊'], hu:'hullám', en:'curling ocean wave with white foam', shapes:[
    { t:'circle', cx:62, cy:52, r:17, m:'water', fc:'none', tone:'dark' },
    { t:'path', m:'water', p:'M8 92 V60 C8 32 30 12 56 12 C76 12 90 26 90 42 C90 52 84 58 76 58 C68 58 62 52 62 46 C62 40 67 36 72 37 C66 30 50 32 44 44 C38 56 42 72 58 76 C70 79 82 78 92 72 V92 Z' },
    { t:'poly', m:'white', fc:'none', tone:'light', pts:band(foam, t => 6 + 5 * Math.abs(Math.sin(t * Math.PI * 4.5))) },
    { t:'line', m:'water', tone:'light', w:2.5, pts:[[16, 82], [26, 78], [36, 82]] },
  ]});
  ART.add('vitorlas', { emoji:['⛵'], hu:'vitorlás', en:'small sailboat with white sails', shapes:[
    { t:'rect', x:48, y:10, w:5, h:64, r:2, m:'wood', fc:'v' },
    { t:'poly', m:'red', tone:'base', pts:[[53, 9], [64, 13], [53, 17]] },
    { t:'poly', m:'white', pts:[[55, 18], [88, 64], [55, 64]] },
    { t:'poly', m:'cream', pts:[[46, 24], [46, 64], [16, 64]] },
    { t:'path', m:'red', fc:'h', p:'M8 68 H92 L82 84 C81 86 79 87 76 87 H24 C21 87 19 86 18 84 Z' },
    { t:'line', m:'cream', tone:'light', w:2.5, pts:[[14, 74], [86, 74]] },
    { t:'poly', m:'water', fc:'h', pts:band([[12, 89], [22, 86], [32, 89], [42, 86], [52, 89], [62, 86], [72, 89], [82, 86], [88, 88]], 5) },
  ]});

  // napraforgó: két szirom-sor (a hátsó sötétebb), barna tányér magokkal, szár két levéllel
  const petal = (cx, cy, deg, rIn, rOut, w) => { const dx = Math.cos(rad(deg)), dy = Math.sin(rad(deg)), L = rOut - rIn;
    const P = (t, o) => `${r1(cx + dx * (rIn + L * t) - dy * o)} ${r1(cy + dy * (rIn + L * t) + dx * o)}`;
    return `M${P(0, 0)} C${P(.35, w)} ${P(1, w * .5)} ${P(1, 0)} C${P(1, -w * .5)} ${P(.35, -w)} ${P(0, 0)} Z`; };
  ART.add('napraforgo', { emoji:['🌻'], hu:'napraforgó', en:'sunflower', shapes:[
    { t:'poly', m:'leaf', pts:band([[50, 50], [50, 89]], 6) },
    { t:'path', m:'leaf', p:leaf(50, 78, 200, 28, 13) },
    { t:'path', m:'leaf', p:leaf(50, 70, -25, 26, 12) },
    ...Array.from({ length:12 }, (_, i) => ({ t:'path', m:'gold', tone:'dark', p:petal(50, 36, i * 30 + 15, 10, 28, 7) })),
    ...Array.from({ length:12 }, (_, i) => ({ t:'path', m:'honey', p:petal(50, 36, i * 30, 10, 26, 7) })),
    { t:'circle', cx:50, cy:36, r:13, m:'chocolate' },
    ...[[45, 32], [53, 31], [47, 40], [55, 39]].map(([x, y]) => ({ t:'circle', cx:x, cy:y, r:1.6, m:'chocolate', tone:'light', line:false, d:true })),
  ]});

  // nyitott lakat: mint a zárt 'lakat' (art-home.js), de a kengyel felemelve, a bal szára kint
  ART.add('nyitott_lakat', { emoji:['🔓'], hu:'nyitott lakat', en:'open golden padlock', shapes:[
    { t:'path', m:'steel', fc:'v', p:'M27 38 V31 C27 17 37 8 50 8 C63 8 73 17 73 31 V54 H62 V31 C62 23 57 19 50 19 C43 19 38 23 38 31 V38 Z' },
    { t:'rect', x:16, y:48, w:68, h:44, r:9, m:'gold' },
    { t:'circle', cx:50, cy:66, r:6.5, m:'dark', fc:'none', tone:'base', line:false, d:true },
    { t:'poly', m:'dark', fc:'none', tone:'base', line:false, d:true, pts:[[46.5, 68], [53.5, 68], [56, 82], [44, 82]] },
    { t:'shine', x:23, y:55, w:5, h:20 },
  ]});

  // konfetti: parti-durrantó (csíkos tölcsér) szerpentinnel és színes papírdarabkákkal
  const cone = (t0, t1) => { const A = [12, 88], B = [30, 46], C = [54, 70], at = (P, t) => [A[0] + (P[0] - A[0]) * t, A[1] + (P[1] - A[1]) * t];
    return R([at(B, t0), at(C, t0), at(C, t1), at(B, t1)]); };
  ART.add('konfetti', { emoji:['🎉'], hu:'konfetti', en:'party popper with confetti and streamers', shapes:[
    { t:'poly', m:'pink', pts:band([[46, 52], [52, 40], [48, 30], [56, 20], [66, 16]], 4.5) },
    { t:'poly', m:'teal', pts:band([[52, 60], [64, 56], [70, 46], [80, 44], [88, 50]], 4.5) },
    { t:'rect', x:62, y:28, w:8, h:5, r:1.5, m:'honey', rot:30 },
    { t:'rect', x:78, y:20, w:8, h:5, r:1.5, m:'blue', rot:-25 },
    { t:'circle', cx:82, cy:34, r:3.5, m:'red' },
    { t:'poly', m:'leaf', pts:[[36, 14], [44, 18], [36, 22]] },
    { t:'circle', cx:74, cy:66, r:3.5, m:'honey' },
    { t:'rect', x:26, y:30, w:7, h:4.5, r:1.5, m:'purple', rot:-40 },
    { t:'poly', m:'honey', pts:[[12, 88], [30, 46], [54, 70]] },
    { t:'poly', m:'red', tone:'base', d:true, pts:cone(.32, .46) },
    { t:'poly', m:'red', tone:'base', d:true, pts:cone(.64, .78) },
    { t:'ellipse', cx:42, cy:58, rx:17, ry:5.5, rot:45, m:'orange', fc:'none', tone:'dark' },
  ]});

  // serpenyő tükörtojással (felülnézet, nyél jobbra fel)
  ART.add('serpenyo', { emoji:['🍳'], hu:'serpenyő', en:'frying pan with a fried egg', shapes:[
    { t:'poly', m:'dark', pts:band([[64, 42], [88, 20]], 9) },
    { t:'circle', cx:42, cy:58, r:34, m:'dark' },
    { t:'circle', cx:42, cy:58, r:27, m:'steel', fc:'none', tone:'dark' },
    { t:'path', m:'white', p:'M22 56 C20 42 32 36 42 38 C52 34 64 42 62 54 C66 64 58 76 46 76 C34 80 22 72 24 64 C20 62 20 58 22 56 Z' },
    { t:'circle', cx:43, cy:57, r:9, m:'honey' },
    { t:'shine', cx:40, cy:53.5, rx:3, ry:2, rot:-30, ox:40, oy:53.5, o:.7 },
  ]});
})();

// ============================================================
//  B szint (docs/rajzolas.md) – a 2075 „Vágod a zöld jövőt?” célzott matricái: illegalis_lerako, eldobott_szemet, elemgyujto,
//  kulacs, szelektiv_kukak, szelturbina, aeroszol, pet_palack, zold_teto, halogen_izzo, regi_mobil.
//  Valódi méretből (méter) vetítve (ART.geo.camera): 3/4-es nézet, 4 éles tónus (teteje világos · eleje alap · oldala sötét ·
//  élsáv legsötétebb), megdöntve, tömör olíva árnyék. A rajz nem árulja el, hogy a tárgy „káros” vagy „ökos” (nincs pipa, nincs X).
//  Render: node tools/art-render.js 2d web/js/art/art-extra.js ki.png kulacs,… --skip extra
// ============================================================
(function(){
  // ---------------- B szintű segédek (ugyanaz a készlet, mint az art-devices.js-ben) ----------------
  const { r1, rad, band, leaf, camera } = ART.geo;
  const { sin, cos, max, min, hypot, PI } = Math;
  const RR = pts => pts.map(p => [r1(p[0]), r1(p[1])]);
  const circ = (cx, cy, r, n = 20, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => { const a = rad(a0 + 360 * i / n); return [cx + r * cos(a), cy + ry * sin(a)]; });
  const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => 'M' + RR(p).map(q => q.join(' ')).join(' ') + 'Z').join('');
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for(const q of p){ while(lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return RR(lo.slice(0, -1).concat(up.slice(0, -1)));
  }
  function clip(subject, cp){   // konvex vágás (Sutherland–Hodgman)
    const ar = cp.reduce((s, p, i) => { const q = cp[(i + 1) % cp.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), sg = Math.sign(ar);
    const inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){ const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); } }
    return RR(out);
  }
  const shineAt = (c, rx, ry, rot = 0, o) => ({ t:'shine', cx:r1(c[0]), cy:r1(c[1]), rx, ry, rot, o });
  const dot = (c, r, m, tone = 'base') => ({ t:'circle', cx:r1(c[0]), cy:r1(c[1]), r, m, fc:'none', tone, line:false, d:true });
  // pontok elforgatása (fok) egy középpont körül – a kész pontokat forgatjuk, így az ellenőrzés a valódi kiterjedést méri
  const turn = (pts, deg, cx = 50, cy = 50) => { const c = cos(rad(deg)), s = sin(rad(deg)); return RR(pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c])); };
  // gerincvonal eltolása a normális mentén (+ = a haladási irányhoz képest bal kéz felé, képernyőn); d(t) a 0…1 hossz mentén
  function offs(pts, d){
    const n = pts.length;
    return pts.map((p, i) => { const a = pts[max(0, i - 1)], b = pts[min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy) || 1, k = typeof d === 'function' ? d(i / (n - 1)) : d;
      return [p[0] - dy / l * k, p[1] + dx / l * k]; });
  }
  const bez = (a, b, c, n = 12) => Array.from({ length:n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; });

  // 3D-vetítés: a tárgy méterben (x jobbra, y fel, z előre), a kamera 3/4-ből nézi (art-devices.js rig() egyszerűsítve)
  function rig(o){
    const tilt = o.tilt != null ? o.tilt : -14, fit = o.fit;
    const size = max(...fit.map(p => Math.abs(p[0]) + Math.abs(p[1]) + Math.abs(p[2])));
    const P = camera({ az:o.az != null ? o.az : 22, el:o.el != null ? o.el : 18, F:o.F || 5 * size, tilt, span:o.span || 80, fit });
    const PP = pts => RR(pts.map(P));
    const box = (x0, x1, y0, y1, z0, z1) => { const q = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) q.push(P([x, y, z])); return hull(q); };
    // vízszintes kör (álló henger metszete); a: 0 = jobbra (+x), 90 = elöl (+z)
    const hring = (x, y, z, r, n = 20, a0 = 0, a1 = 360) => { const full = a1 - a0 >= 360, N = full ? n : n + 1;
      return RR(Array.from({ length:N }, (_, i) => { const a = rad(a0 + (a1 - a0) * i / n); return P([x + r * cos(a), y, z + r * sin(a)]); })); };
    // forgástest egy szakasza (csonkakúp) és az elülső felének egy sávja (címke, perem, élsáv)
    // kör az előlap síkjában (x–y, álló kerék, rotor) és oldalt (y–z, fekvő henger)
    const vring = (x, y, z, r, n = 20, ry = r) => RR(Array.from({ length:n }, (_, i) => { const a = rad(360 * i / n); return P([x + r * cos(a), y + ry * sin(a), z]); }));
    const xring = (x, y, z, r, n = 20, rz = r) => RR(Array.from({ length:n }, (_, i) => { const a = rad(360 * i / n); return P([x, y + r * sin(a), z + rz * cos(a)]); }));
    const drum = (y0, r0, y1, r1_, n = 20, x = 0, z = 0) => hull([...hring(x, y0, z, r0, n), ...hring(x, y1, z, r1_, n)]);
    const wrap = (y0, r0, y1, r1_, a0 = 0, a1 = 180, n = 12, x = 0, z = 0) => [...hring(x, y0, z, r0, n, a0, a1), ...hring(x, y1, z, r1_, n, a0, a1).reverse()];
    // doboz 4 tónussal: oldala (sötét) · hátsó élsáv (legsötétebb) · teteje (világos) · eleje (alap); a teteje lehet kisebb (csonka gúla)
    const cube = (m, [x0, x1, y0, y1, z0, z1], o2 = {}) => { const sx = o2.sx || 0, sz = o2.sz || 0, eb = o2.eb != null ? o2.eb : .14;
      const T = (x, z) => [x + (x > (x0 + x1) / 2 ? -sx : sx), y1, z + (z > (z0 + z1) / 2 ? -sz : sz)];
      const out = [
        { t:'poly', m, fc:'none', tone:'dark', pts:PP([[x1, y0, z1], [x1, y0, z0], T(x1, z0), T(x1, z1)]) },
        { t:'poly', m, fc:'none', tone:'line', o:.4, line:false, d:true, pts:PP([[x1, y0, z0 + (z1 - z0) * eb], [x1, y0, z0], T(x1, z0), (p => [p[0], y1, p[2] + (z1 - z0) * eb])(T(x1, z0))]) },
        { t:'poly', m, fc:o2.fc || 'none', tone:o2.fc ? undefined : 'base', pts:PP([[x0, y0, z1], [x1, y0, z1], T(x1, z1), T(x0, z1)]) },
      ];
      if(o2.top !== false) out.push({ t:'poly', m, fc:'none', tone:'light', pts:PP([T(x0, z1), T(x1, z1), T(x1, z0), T(x0, z0)]) });
      return out; };
    return { P, PP, box, hring, vring, xring, drum, wrap, cube, tilt };
  }
  // útvonal minden koordináta-párjának átszámolása (kézzel rajzolt forma elhelyezése a vetített jelenetben)
  const xf = (p, f) => p.replace(/(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (_, x, y) => f(+x, +y).map(r1).join(' '));

  (() => {   // illegális lerakó: földkupac, hátul bekötött zsák, elöl álló gumiabroncs, jobbra szétnyílt kartondoboz
    const fit = [[-.44, 0, 0], [.46, 0, 0], [0, 0, .3], [0, 0, -.3], [-.2, .5, -.12], [.34, .3, 0]];
    const K = rig({ fit, az:18, el:24, tilt:-8, span:84 }), { P, PP, vring, cube } = K, k = P.k;
    const mound = (y, s) => PP(Array.from({ length:18 }, (_, i) => { const a = rad(20 * i); return [.44 * s * cos(a), y, .28 * s * sin(a)]; }));
    const b0 = P([-.2, 0, -.1]), bag = (sc, dx = 0, dy = 0) => xf('M22 84 C11 80 11 58 19 47 C25 39 31 35 34 30 C30 26 29 20 32 18 C35 17 38 21 40 25 C41 19 45 14 49 17 C51 20 48 26 45 30 C49 36 57 41 61 51 C66 63 63 80 53 84 Z',
      (x, y) => [b0[0] + dx + (x - 37) * k * .0068 * sc, b0[1] + dy + (y - 84) * k * .0068 * sc]);
    const tc = [-.12, .17, .15], tyre = (r, dz = 0) => vring(tc[0], tc[1], tc[2] + dz, r, 20);
    const bx = [.1, .36, 0, .2, -.06, .16];
    ART.add('illegalis_lerako', { emoji:[], hu:'illegális szemétlerakó', en:'small illegal dump pile of trash bags, an old tire and a broken cardboard box on bare ground', look:'dark soil mound with a tied blue rubbish bag, an upright old tyre and a torn open cardboard box', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'soil', fc:'none', tone:'dark', pts:hull([...mound(-.03, 1), ...mound(.06, .55)]) },                   // kupac oldala
      { t:'poly', m:'soil', fc:'none', tone:'base', pts:hull([...mound(.012, .95), ...mound(.06, .55)]) },                                                      // kupac teteje
      { t:'poly', m:'soil', fc:'none', tone:'light', line:false, d:true, pts:PP(Array.from({ length:10 }, (_, i) => { const a = rad(160 + 22 * i); return [-.08 + .3 * cos(a), .001, -.04 + .16 * sin(a)]; })) },
      { t:'path', m:'blue', fc:'d', p:bag(1) },                                                                              // zsák
      { t:'line', m:'blue', tone:'line', w:1.6, pts:[[b0[0] - .015 * k, b0[1] - .36 * k], [b0[0] + .06 * k, b0[1] - .355 * k]] },   // kötés
      { t:'line', m:'blue', tone:'dark', w:1.4, pts:[[b0[0] - .05 * k, b0[1] - .24 * k], [b0[0] - .02 * k, b0[1] - .1 * k]] },     // ránc
      ...cube('cardboard', bx, { top:false }),                                                                               // doboz
      { t:'poly', m:'cardboard', fc:'none', tone:'line', o:.8, d:true, pts:PP([[bx[0], .2, bx[5]], [bx[1], .2, bx[5]], [bx[1], .2, bx[4]], [bx[0], .2, bx[4]]]) },   // sötét belseje
      { t:'poly', m:'cardboard', fc:'none', tone:'light', pts:PP([[bx[0], .2, bx[5]], [bx[1], .2, bx[5]], [bx[1] - .02, .12, bx[5] + .09], [bx[0] + .03, .13, bx[5] + .1]]) },   // lelógó fül
      { t:'poly', m:'cardboard', fc:'none', tone:'base', pts:PP([[bx[1], .2, bx[4]], [bx[1], .2, bx[5]], [bx[1] + .1, .29, bx[5] - .02], [bx[1] + .09, .3, bx[4] + .02]]) },   // felnyílt fül
      { t:'line', m:'cardboard', tone:'line', w:1.6, pts:PP([[bx[0] + .03, .06, bx[5]], [bx[0] + .08, .1, bx[5]], [bx[0] + .12, .07, bx[5]], [bx[0] + .17, .11, bx[5]]]) },   // szakadás
      { t:'poly', m:'dark', fc:'none', tone:'dark', pts:hull([...tyre(.17, -.09), ...tyre(.17)]) },                          // gumi futófelülete
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:tyre(.17) },                                                         // oldalfal
      { t:'poly', m:'dark', fc:'none', tone:'light', line:false, d:true, pts:tyre(.125) },                                   // perem
      { t:'poly', m:'soil', fc:'none', tone:'dark', d:true, pts:tyre(.085) },                                                // lyuk
      shineAt(P([-.24, .27, .16]), 1, 5, 40, .45),
    ]});
  })();

  (() => {   // eldobott szemét: fűfolt, rajta gyűrött nasis zacskó, összelapított üdítős doboz és egy kupak
    const fit = [[-.25, -.03, 0], [.25, 0, 0], [0, -.03, .17], [0, 0, -.17], [0, .09, 0]];
    const K = rig({ fit, az:14, el:34, tilt:-10, span:84 }), { P, PP, xring } = K;
    const disk = (y, s = 1) => PP(Array.from({ length:18 }, (_, i) => { const a = rad(20 * i); return [.25 * s * cos(a), y, .17 * s * sin(a)]; }));
    // zacskó a talajon (x, z), fogazott végekkel, elforgatva
    const zig = (x, z0, z1, d) => Array.from({ length:7 }, (_, i) => [x + (i % 2 ? d : 0), z0 + (z1 - z0) * i / 6]);
    const wr = (pts, y = .01) => PP(pts.map(([x, z]) => { const a = rad(-62), u = x * cos(a) - z * sin(a), v = x * sin(a) + z * cos(a); return [1.15 * u - .1, y, 1.15 * v - .02]; }));
    const pack = [...zig(-.08, -.045, .045, -.012), [-.02, .055], ...zig(.08, .045, -.045, .012).slice(0), [.02, -.055]];
    // lapított doboz az x tengely mentén: két fél henger, a közepén behorpadva
    const can = [[-.02, .042], [.07, .028], [.16, .04]].map(([x, r]) => xring(x, .042, .075, r, 16, .04));
    ART.add('eldobott_szemet', { emoji:[], hu:'eldobott szemét', en:'litter on a patch of grass: a crumpled snack wrapper and a squashed soda can', look:'oval patch of grass with a crumpled blue snack wrapper, a squashed red can lying on its side and a bottle cap', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'soil', fc:'none', tone:'base', pts:hull([...disk(0), ...disk(-.03)]) },                                  // föld-oldal
      { t:'poly', m:'grass', fc:'none', tone:'base', pts:disk(0) },                                                           // fű
      { t:'poly', m:'grass', fc:'none', tone:'light', line:false, d:true, pts:PP(Array.from({ length:10 }, (_, i) => { const a = rad(170 + 20 * i); return [-.04 + .24 * cos(a), .001, -.02 + .13 * sin(a)]; })) },
      ...[[-.23, .02, -105], [.21, -.07, -70], [.02, -.16, -95]].map(([x, z, a]) => { const c = P([x, 0, z]); return { t:'path', m:'grass', p:leaf(r1(c[0]), r1(c[1]), a, 12, 5) }; }),   // fűcsomók
      { t:'poly', m:'blue', fc:'none', tone:'base', pts:wr(pack) },                                                           // zacskó
      { t:'poly', m:'blue', fc:'none', tone:'light', line:false, d:true, pts:wr([[-.06, -.04], [.0, -.045], [-.03, .03], [-.065, .035]], .011) },   // gyűrődés
      { t:'poly', m:'honey', fc:'none', tone:'base', line:false, d:true, pts:wr([[.01, -.05], [.035, -.05], [.035, .05], [.01, .05]], .011) },   // sáv
      { t:'poly', m:'red', fc:'h', pts:hull([...can[0], ...can[1]]) },                                                        // doboz
      { t:'poly', m:'red', fc:'h', pts:hull([...can[1], ...can[2]]) },
      { t:'line', m:'red', tone:'light', w:2.2, pts:PP([[.0, .07, .09], [.05, .062, .095]]) },
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:can[2] },                                                           // doboz teteje
      { t:'poly', m:'steel', fc:'none', tone:'dark', line:false, d:true, pts:xring(.161, .058, .075, .011, 8, .008) },          // nyílás
      { t:'poly', m:'steel', fc:'v', pts:hull([...K.hring(.11, .002, -.07, .024, 12), ...K.hring(.11, .016, -.07, .024, 12)]) },   // kupak
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:K.hring(.11, .016, -.07, .024, 12) },
    ]});
  })();

  (() => {   // elemgyűjtő doboz: 3/4-es doboz peremmel, a kerek nyílásban félig bedugott elem, elöl elem-jel
    const H = .3, fit = []; for(const x of [-.13, .13]) for(const y of [0, H + .09]) for(const z of [-.1, .1]) fit.push([x, y, z]);
    const K = rig({ fit, az:24, el:22, tilt:-12, span:82 }), { P, PP, hring, drum, cube } = K;
    const Fz = (pts, z = .1) => PP(pts.map(([u, v]) => [u, v, z]));
    const bat = [.0, H + .003, -.005];
    ART.add('elemgyujto', { emoji:[], hu:'elemgyűjtő doboz', en:'battery collection box with a battery half inserted in the round top slot', look:'green collection box with a lid rim, a battery half inserted in the round top slot and a battery sign on the front', tilt:K.tilt, shadow:'hard', shapes:[
      ...cube('leaf', [-.12, .12, 0, H - .03, -.09, .09], { top:false }),                                                     // doboz
      ...cube('leaf', [-.13, .13, H - .03, H, -.1, .1]),                                                                     // fedél
      { t:'poly', m:'dark', fc:'none', tone:'base', d:true, pts:hring(0, H + .001, -.005, .034, 16) },                       // kerek nyílás
      { t:'poly', m:'dark', fc:'v', pts:drum(H - .01, .02, H + .055, .02, 16, bat[0], bat[2]) },                              // elem teste
      { t:'poly', m:'honey', fc:'v', d:true, pts:drum(H + .055, .02, H + .085, .02, 16, bat[0], bat[2]) },                   // elem felső sávja
      { t:'poly', m:'honey', fc:'none', tone:'light', pts:hring(bat[0], H + .085, bat[2], .02, 16) },
      { t:'poly', m:'steel', fc:'v', pts:drum(H + .085, .007, H + .095, .007, 10, bat[0], bat[2]) },                         // pólus
      { t:'poly', m:'cream', fc:'none', tone:'base', d:true, pts:Fz([[-.085, .07], [.085, .07], [.085, .2], [-.085, .2]], .091) },   // címkemező
      { t:'poly', m:'leaf', fc:'none', tone:'base', d:true, pts:Fz([[-.05, .105], [.04, .105], [.04, .165], [-.05, .165]], .092) },   // elem-jel
      { t:'poly', m:'leaf', fc:'none', tone:'base', d:true, pts:Fz([[.04, .122], [.055, .122], [.055, .148], [.04, .148]], .092) },
      { t:'poly', m:'leaf', fc:'none', tone:'light', line:false, d:true, pts:Fz([[-.042, .113], [-.005, .113], [-.005, .157], [-.042, .157]], .092) },
      shineAt(P([-.1, .2, .09]), 1.2, 7, -4, .5),
    ]});
  })();

  (() => {   // kulacs: fém palack vállal és nyakkal, csavaros kupak hurokkal, középen matt sáv
    const fit = [[-.038, 0, 0], [.038, .2, 0], [0, 0, .038], [0, .2, -.038], [0, .275, 0]];
    const K = rig({ fit, az:0, el:20, tilt:12, span:84 }), { P, PP, hring, drum, wrap, vring } = K;
    const loop = PP(Array.from({ length:11 }, (_, i) => { const a = rad(180 + 18 * i); return [.017 * cos(a), .248 - .024 * sin(a), 0]; }));
    ART.add('kulacs', { emoji:[], hu:'kulacs', en:'reusable metal water bottle with a loop cap', look:'teal metal bottle with rounded shoulders, a cream band and a steel screw cap with a carrying loop', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'steel', fc:'v', pts:band(loop, 4.2, false) },                                                          // hurok
      { t:'poly', m:'teal', fc:'v', pts:drum(0, .037, .16, .038) },                                                          // test
      { t:'poly', m:'teal', fc:'v', pts:drum(.16, .038, .197, .021) },                                                       // váll
      { t:'poly', m:'teal', fc:'none', tone:'line', o:.35, line:false, d:true, pts:wrap(.001, .0371, .012, .0372, 0, 180, 10) },   // talp-élsáv
      { t:'poly', m:'cream', fc:'v', d:true, pts:wrap(.06, .0375, .1, .0378) },                                              // matt sáv
      { t:'poly', m:'steel', fc:'v', pts:drum(.195, .019, .205, .019, 16) },                                                 // nyak
      { t:'poly', m:'steel', fc:'v', pts:drum(.203, .022, .242, .02, 16) },                                                  // kupak
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:hring(0, .242, 0, .02, 16) },
      ...[.212, .222, .232].map(y => ({ t:'line', m:'steel', tone:'dark', w:1.1, pts:hring(0, y, 0, .0212, 8, 20, 160) })),   // recék
      shineAt(P([-.024, .125, .028]), 1.3, 8, 0, .6), shineAt(P([-.023, .035, .028]), 1.2, 4, 0, .5),
    ]});
  })();

  (() => {   // szelektív kukák: három kerekes kuka sorban (sárga, kék, zöld), előreugró sötétebb fedéllel, fogantyúval, hátul kerékkel
    const W = .15, D = .16, H = .24, L = .03, xs = [-.195, 0, .195];
    const fit = []; for(const x of [-.195 - W / 2 - .01, .195 + W / 2 + .01]) for(const y of [0, H + L]) for(const z of [-D / 2 - .01, D / 2 + .02]) fit.push([x, y, z]);
    const K = rig({ fit, az:16, el:22, tilt:-10, span:86 }), { P, PP, xring } = K;
    const bin = (x, m) => { const a = x - W / 2, b = x + W / 2, t = .008, la = a - .006, lb = b + .006, lz0 = -D / 2 - .008, lz1 = D / 2 + .018, y1 = H + L;
      return [
        { t:'poly', m, fc:'none', tone:'dark', pts:PP([[b - t, 0, D / 2 - t], [b - t, 0, -D / 2 + t], [b, H, -D / 2], [b, H, D / 2]]) },   // test oldala
        { t:'poly', m, fc:'none', tone:'base', pts:PP([[a + t, 0, D / 2 - t], [b - t, 0, D / 2 - t], [b, H, D / 2], [a, H, D / 2]]) },       // test eleje
        { t:'poly', m, fc:'none', tone:'line', o:.5, pts:PP([[lb, H, lz1], [lb, H, lz0], [lb, y1, lz0], [lb, y1, lz1]]) },                   // fedél oldala
        { t:'poly', m, fc:'none', tone:'dark', pts:PP([[la, H, lz1], [lb, H, lz1], [lb, y1, lz1], [la, y1, lz1]]) },                           // fedél eleje
        { t:'poly', m, fc:'none', tone:'base', pts:PP([[la, y1, lz1], [lb, y1, lz1], [lb, y1, lz0], [la, y1, lz0]]) },                         // fedél teteje
        { t:'poly', m, fc:'none', tone:'dark', d:true, pts:PP([[x - .035, H - .045, D / 2 + .001], [x + .035, H - .045, D / 2 + .001], [x + .035, H - .03, D / 2 + .001], [x - .035, H - .03, D / 2 + .001]]) },   // fogantyú
      ]; };
    ART.add('szelektiv_kukak', { emoji:[], hu:'szelektív kukák', en:'three small recycling bins side by side: yellow, blue and green with darker lids', look:'three wheelie bins in a row with gaps – yellow, blue, green – each with a darker overhanging lid and a front grip, a wheel at the back', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:xring(.195 + W / 2 - .004, .03, -D / 2 + .03, .03, 12) },            // kerék
      ...bin(xs[0], 'honey'), ...bin(xs[1], 'blue'), ...bin(xs[2], 'leaf'),
      shineAt(P([-.255, .13, D / 2]), 1.1, 6, 0, .55),
    ]});
  })();

  (() => {   // szélturbina: kúpos fehér torony, gondola, agy, három lapát a front síkjában, füves dombon
    const HT = .8, R0 = .44, zr = .1, fit = [[-.5, 0, 0], [.5, 0, 0], [0, 0, .3], [0, 0, -.3], [0, HT + R0, zr], [-R0, HT, zr], [R0, HT, zr], [0, HT - R0, zr]];
    const K = rig({ fit, az:26, el:10, tilt:-8, span:86 }), { P, PP, hring, drum, vring, cube } = K;
    // lapát a rotor síkjában: t 0…1 a tő és a hegy között, w a húr; a elforgatás fokban
    const blade = (a, half) => { const c = cos(rad(a)), s = sin(rad(a)), prof = [[.03, .04], [.1, .075], [.28, .055], [.42, .02], [.44, 0]];
      const side = sg => prof.map(([r, w]) => [r, sg * w * (sg > 0 ? 1 : .55)]), pts = half ? [...side(0), ...side(1).reverse()] : [...side(1), ...side(-1).reverse()];
      return PP(pts.map(([r, w]) => [r * c - w * s, HT + r * s + w * c, zr + .005])); };
    const hill = (y, s) => PP(Array.from({ length:16 }, (_, i) => { const a = rad(22.5 * i); return [.42 * s * cos(a), y, .26 * s * sin(a)]; }));
    ART.add('szelturbina', { emoji:[], hu:'szélturbina', en:'white wind turbine on a small grassy hill', look:'slim white tower on a grassy mound, a nacelle and three long tapering blades around a hub', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'grass', fc:'none', tone:'base', pts:hull([...hill(0, 1), ...hill(.1, .5)]) },                          // domb
      { t:'poly', m:'grass', fc:'none', tone:'light', line:false, d:true, pts:hull([...hill(.101, .45), ...PP([[-.34, .02, .06], [-.26, .04, .14]])]) },
      { t:'poly', m:'white', fc:'v', pts:drum(.05, .045, HT, .022, 14) },                                                    // torony
      ...cube('white', [-.04, .04, HT - .035, HT + .035, -.13, zr - .02]),                                                   // gondola
      ...[90, 210, 330].map(a => ({ t:'poly', m:'white', fc:'none', tone:'base', pts:blade(a, false) })),                   // lapátok
      ...[90, 210, 330].map(a => ({ t:'poly', m:'white', fc:'none', tone:'dark', line:false, d:true, pts:blade(a, true) })),
      { t:'poly', m:'steel', fc:'none', tone:'base', pts:vring(0, HT, zr + .01, .042, 14) },                                 // agy
      { t:'poly', m:'steel', fc:'none', tone:'light', line:false, d:true, pts:vring(-.008, HT + .008, zr + .012, .016, 10) },
    ]});
  })();

  (() => {   // aeroszolos flakon: hengeres test krém címkesávval, domború acél váll, szórófej-kupak, oldalt permetfelhő
    const fit = [[-.034, 0, 0], [.034, .2, 0], [0, 0, .034], [0, .2, -.034], [.085, .19, .02]];
    const K = rig({ fit, az:0, el:20, tilt:-10, span:82 }), { P, PP, hring, drum, wrap } = K;
    const nz = P([.012, .192, .006]), puff = [[9, -2, 4.2], [15, -4, 5], [16, 2.5, 4.4], [21, -1, 4]];
    ART.add('aeroszol', { emoji:[], hu:'aeroszolos flakon', en:'aerosol spray can with a small puff of mist', look:'purple spray can with a cream band, a domed steel shoulder, a white actuator cap and a small cloud of mist', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'sky', fc:'none', tone:'light', line:false, pts:RR(Array.from({ length:20 }, (_, i) => { const a = rad(18 * i), q = 1 + .16 * cos(rad(18 * i * 4)); return [nz[0] + 14 + 9 * q * cos(a), nz[1] - 2 + 6.5 * q * sin(a)]; })) },   // permet
      { t:'path', m:'sky', fc:'none', tone:'base', line:false, d:true, p:pathOf(puff.map(([dx, dy, r]) => circ(nz[0] + dx + 1, nz[1] + dy, r * .22, 6))) },
      { t:'poly', m:'purple', fc:'v', pts:drum(0, .033, .148, .034) },                                                       // test
      { t:'poly', m:'purple', fc:'none', tone:'line', o:.35, line:false, d:true, pts:wrap(.001, .0331, .01, .0332, 0, 180, 10) },
      { t:'poly', m:'cream', fc:'v', d:true, pts:wrap(.055, .0342, .1, .0342) },                                             // címkesáv
      { t:'poly', m:'steel', fc:'v', pts:drum(.146, .035, .174, .016, 16) },                                                 // váll
      { t:'poly', m:'steel', fc:'none', tone:'light', line:false, d:true, pts:wrap(.155, .03, .168, .021, 110, 180, 5) },
      { t:'line', m:'steel', tone:'dark', w:1.4, pts:hring(0, .147, 0, .0345, 12, 0, 180) },                                // perem
      { t:'poly', m:'white', fc:'v', pts:drum(.172, .014, .198, .012, 14) },                                                  // szórófej-kupak
      { t:'poly', m:'white', fc:'none', tone:'light', pts:hring(0, .198, 0, .012, 14) },
      { t:'poly', m:'dark', fc:'none', tone:'base', line:false, d:true, pts:RR(circ(nz[0], nz[1], 1.3, 8)) },               // fúvóka
      shineAt(P([-.022, .03, .026]), 1.2, 4, 0, .55), shineAt(P([-.022, .125, .026]), 1.2, 5, 0, .6),
    ]});
  })();

  (() => {   // PET-palack: bordás derék, kék címke hullámmal, szűkülő váll, nyakgyűrű, recés kék kupak
    const fit = [[-.034, 0, 0], [.034, .19, 0], [0, 0, .034], [0, .19, -.034]];
    const K = rig({ fit, az:0, el:18, tilt:-12, span:84 }), { P, PP, hring, drum, wrap } = K;
    const rib = y => ({ t:'line', m:'sky', tone:'dark', w:1.4, pts:hring(0, y, 0, .031, 12, 5, 175) });
    ART.add('pet_palack', { emoji:[], hu:'PET-palack', en:'single-use clear blue plastic water bottle with blue cap', look:'clear light-blue plastic bottle with grip ribs, a blue label with a wave, a tapering shoulder, a neck ring and a ribbed blue cap', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'sky', fc:'v', pts:drum(.004, .033, .118, .033) },                                                        // test
      { t:'poly', m:'sky', fc:'v', pts:drum(.004, .03, 0, .028) },                                                            // talp
      { t:'poly', m:'sky', fc:'v', pts:drum(.116, .033, .16, .012, 16) },                                                     // váll
      { t:'poly', m:'sky', fc:'none', tone:'line', o:.3, line:false, d:true, pts:wrap(.006, .033, .116, .033, 0, 18, 4) },     // élsáv
      rib(.024), rib(.036),                                                                                                  // markolat-bordák
      { t:'poly', m:'blue', fc:'v', d:true, pts:wrap(.058, .0335, .1, .0335) },                                               // címke
      { t:'line', m:'sky', tone:'light', w:2, pts:PP(Array.from({ length:9 }, (_, i) => { const a = rad(20 + 17.5 * i); return [.034 * cos(a), .079 + .006 * sin(rad(i * 90)), .034 * sin(a)]; })) },   // hullám
      { t:'poly', m:'sky', fc:'none', tone:'light', pts:drum(.158, .016, .162, .016, 12) },                                  // nyakgyűrű
      { t:'poly', m:'blue', fc:'v', pts:drum(.162, .0135, .186, .0135, 14) },                                                // kupak
      { t:'poly', m:'blue', fc:'none', tone:'light', pts:hring(0, .186, 0, .0135, 14) },
      ...[-.006, .002, .01].map(x => ({ t:'line', m:'blue', tone:'dark', w:1.1, pts:PP([[x, .165, .0125], [x, .183, .0125]]) })),   // recék
      shineAt(P([-.022, .135, .02]), 1.2, 4.5, 30, .7), shineAt(P([-.022, .04, .026]), 1.2, 5, 0, .6),
    ]});
  })();

  (() => {   // zöldtető: házikó oromzattal előre, a két tetősíkon föld-réteg és fű, rajta növények és egy virág
    const X = .3, Z = .25, H = .34, RH = .6, E = .36, T = .035;
    const fit = [[-E - .01, 0, -Z], [E + .01, 0, Z], [0, RH + T + .12, 0], [-E, H, Z + .03], [E, H, -Z - .03]];
    const K = rig({ fit, az:28, el:18, tilt:-10, span:84 }), { P, PP, cube } = K;
    const Fz = (pts, z = Z) => PP(pts.map(([u, v]) => [u, v, z]));
    const roofL = y => PP([[0, RH + y, Z + .03], [-E, H - .03 + y, Z + .03], [-E, H - .03 + y, -Z - .03], [0, RH + y, -Z - .03]]);
    const roofR = y => PP([[0, RH + y, Z + .03], [E, H - .03 + y, Z + .03], [E, H - .03 + y, -Z - .03], [0, RH + y, -Z - .03]]);
    const tuft = (x, z, a, l, m) => { const on = x < 0 ? -1 : 1, y = RH + T - (RH - H) * Math.abs(x) / E, c = P([x, y, z]); return { t:'path', m, p:leaf(r1(c[0]), r1(c[1]), a, l, l * .42) }; };
    ART.add('zold_teto', { emoji:[], hu:'zöldtető', en:'small house with a green roof covered in grass and little plants', look:'cream cottage with the gable to the front, both roof slopes covered in a soil layer and grass, little plants and a pink flower on top, a door and windows', tilt:K.tilt, shadow:'hard', shapes:[
      ...cube('cream', [-X, X, 0, H, -Z, Z], { top:false }),                                                                // falak
      { t:'poly', m:'cream', fc:'none', tone:'base', pts:Fz([[-X, H - .002], [X, H - .002], [0, RH - .02]]) },               // oromzat
      { t:'poly', m:'soil', fc:'none', tone:'dark', pts:hull([...roofR(0), ...roofR(T)]) },                                  // föld-réteg (jobb)
      { t:'poly', m:'grass', fc:'none', tone:'base', pts:roofR(T) },                                                          // fű (jobb)
      { t:'poly', m:'soil', fc:'none', tone:'base', pts:PP([[0, RH, Z + .03], [-E, H - .03, Z + .03], [-E, H - .03 + T, Z + .03], [0, RH + T, Z + .03]]) },   // föld-réteg eleje
      { t:'poly', m:'grass', fc:'none', tone:'light', pts:roofL(T) },                                                         // fű (bal)
      { t:'poly', m:'wood', fc:'v', d:true, pts:Fz([[-.05, 0], [.05, 0], [.05, .19], [-.05, .19]], Z + .002) },              // ajtó
      { t:'poly', m:'sky', fc:'none', tone:'base', d:true, pts:Fz([[-.22, .15], [-.12, .15], [-.12, .25], [-.22, .25]], Z + .002) },   // ablakok
      { t:'poly', m:'sky', fc:'none', tone:'base', d:true, pts:Fz([[.12, .15], [.22, .15], [.22, .25], [.12, .25]], Z + .002) },
      { t:'poly', m:'sky', fc:'none', tone:'base', d:true, pts:Fz([[-.035, .4], [.035, .4], [.035, .47], [-.035, .47]], Z + .002) },
      tuft(-.12, .12, -110, 12, 'leaf'), tuft(-.1, .12, -70, 11, 'leaf'), tuft(.15, -.05, -80, 12, 'leaf'), tuft(-.2, -.1, -95, 10, 'leaf'),   // növények
      { t:'circle', ...(c => ({ cx:r1(c[0]), cy:r1(c[1]) }))(P([-.02, RH + T + .07, 0])), r:3.8, m:'blossom' },           // virág
      { t:'circle', ...(c => ({ cx:r1(c[0]), cy:r1(c[1]) }))(P([-.02, RH + T + .07, 0])), r:1.5, m:'honey', fc:'none', tone:'base', line:false, d:true },
    ]});
  })();

  (() => {   // halogén spotlámpa (GU10): kerámia talp két gombos tűvel, fém reflektor-kúp, elöl üveg – mögötte lapolt tükör és izzószál-kapszula
    const fit = [[-.026, -.016, 0], [.026, .045, 0], [0, .045, .026], [0, .045, -.026], [-.03, .064, -.02], [.03, .064, -.02], [-.01, -.018, .006], [.01, -.018, .006]];
    const K = rig({ fit, az:0, el:38, tilt:22, span:74 }), { P, PP, hring, drum } = K;
    const face = hring(0, .045, 0, .0235, 18);
    const ray = a => band(PP([[.026 * cos(rad(a)), .051, .026 * sin(rad(a))], [.032 * cos(rad(a)), .062, .032 * sin(rad(a))]]), 3, true);
    ART.add('halogen_izzo', { emoji:[], hu:'halogénizzó', en:'halogen spotlight reflector bulb shining bright rays', look:'GU10 spotlight: a wide steel reflector cone with a faceted golden mirror behind flat glass, a small capsule in the middle, a ceramic base with two button pins', tilt:K.tilt, shadow:'hard', shapes:[
      ...[-.0055, .0055].map(x => ({ t:'poly', m:'steel', fc:'v', pts:drum(-.013, .0026, .002, .0022, 8, x, 0) })),          // tűk
      ...[-.0055, .0055].map(x => ({ t:'poly', m:'steel', fc:'none', tone:'dark', pts:hring(x, -.013, 0, .0042, 8) })),
      { t:'poly', m:'white', fc:'v', pts:drum(0, .0095, .013, .0105, 16) },                                                   // kerámia talp
      { t:'poly', m:'steel', fc:'v', pts:drum(.012, .011, .042, .025, 16) },                                                  // reflektor
      { t:'poly', m:'steel', fc:'v', pts:drum(.04, .0258, .045, .0258, 18) },                                                  // perem
      { t:'poly', m:'gold', fc:'none', tone:'base', pts:face },                                                                // tükör
      { t:'path', m:'gold', fc:'none', tone:'light', line:false, d:true, p:pathOf([0, 60, 120, 180, 240, 300].map(a => PP([[0, .045, 0], ...[a, a + 30].map(b => [.023 * cos(rad(b)), .045, .023 * sin(rad(b))])]))) },   // lapok
      { t:'poly', m:'honey', fc:'none', tone:'light', pts:hring(0, .0455, 0, .007, 12) },                                     // kapszula
      { t:'poly', m:'white', fc:'none', tone:'light', line:false, d:true, pts:hring(-.001, .046, -.001, .0035, 8) },
      ...[210, 270, 330].map(a => ({ t:'poly', m:'honey', fc:'none', tone:'base', pts:ray(a) })),                             // fénysugarak
      shineAt(P([-.012, .0455, .012]), 1, 5, -30, .7),
    ]});
  })();

  (() => {   // régi gombos mobil: kék test, keskeny kijelző zöldes LCD-vel, navigációs gomb, 12 üres gomb, rövid antenna
    const W = .045, H = .11, D = .018, X = W / 2, Z = D / 2;
    const fit = []; for(const x of [-X, X]) for(const y of [0, H + .014]) for(const z of [-Z, Z]) fit.push([x, y, z]);
    const K = rig({ fit, az:24, el:16, tilt:-14, span:84 }), { P, PP, cube, drum, hring } = K;
    const Fz = (pts, dz = 0) => PP(pts.map(([u, v]) => [u, v, Z + dz]));
    const rr = (u0, v0, u1, v1, r) => [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]].flatMap(([cx, cy, a]) => [0, 45, 90].map(d => [cx + r * cos(rad(a + d)), cy + r * sin(rad(a + d))]));
    const keys = []; for(const v of [.038, .027, .016, .005]) for(const u of [-.0135, 0, .0135]) keys.push([u, v + .003]);
    const key = ([u, v], dz, dv = 0) => Fz(rr(u - .0052, v - .0034 + dv, u + .0052, v + .0034 + dv, .0026), dz);
    ART.add('regi_mobil', { emoji:[], hu:'régi mobiltelefon', en:'old button mobile phone with small screen, round blank keys and stubby antenna', look:'chunky blue candybar phone with a stubby antenna, a small greenish screen, a navigation key and twelve blank keys', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'dark', fc:'v', pts:drum(H - .002, .0045, H + .014, .0042, 10, X - .009, -.002) },                         // antenna
      { t:'poly', m:'dark', fc:'none', tone:'light', pts:hring(X - .009, H + .014, -.002, .0042, 10) },
      ...cube('blue', [-X, X, 0, H, -Z, Z]),                                                                                  // test
      { t:'poly', m:'dark', fc:'none', tone:'base', d:true, pts:Fz(rr(-.017, .06, .017, .094, .004), .0005) },                // kijelző-keret
      { t:'poly', m:'grass', fc:'none', tone:'light', d:true, pts:Fz(rr(-.0135, .065, .0135, .089, .0015), .001) },          // LCD
      { t:'poly', m:'grass', fc:'none', tone:'base', line:false, d:true, pts:Fz([[-.0135, .065], [.0135, .065], [.0135, .07], [-.0135, .07]], .0012) },
      { t:'line', m:'blue', tone:'line', w:1.4, pts:Fz([[-.006, .1], [.006, .1]], .0005) },                                    // hangszóró-rés
      { t:'poly', m:'steel', fc:'h', d:true, pts:Fz(rr(-.009, .045, .009, .054, .0045), .001) },                               // navigációs gomb
      { t:'path', m:'steel', fc:'none', tone:'dark', line:false, d:true, p:pathOf(keys.map(k => key(k, .0008, -.0012))) },     // gombok alja
      { t:'path', m:'steel', fc:'none', tone:'light', d:true, p:pathOf(keys.map(k => key(k, .0012))) },                        // gombok
      shineAt(P([-.018, .03, Z]), 1.1, 6, 0, .45),
    ]});
  })();
})();
