// ============================================================
//  Matricák — ételek, italok  ·  stílus: docs/grafika-spec.md
ART.add('hamburger', { emoji:['🍔'], hu:'hamburger', en:'cheeseburger', shapes:[
  { t:'path', m:'orange', p:'M12 46 C12 22 30 12 50 12 C70 12 88 22 88 46 Z' },
  { t:'rect', x:10, y:48, w:80, h:8, r:4, m:'leaf', fc:'h' },
  { t:'poly', m:'honey', pts:[[12, 56], [88, 56], [80, 66], [64, 60], [50, 68], [36, 60], [20, 66]] },
  { t:'rect', x:12, y:60, w:76, h:12, r:6, m:'chocolate', fc:'h' },
  { t:'path', m:'orange', p:'M12 74 H88 C88 86 76 90 50 90 C24 90 12 86 12 74 Z', fc:'h' },
  ...[[34, 24], [52, 20], [66, 28], [44, 32]].map(([x, y]) => ({ t:'ellipse', cx:x, cy:y, rx:3, ry:1.6, m:'cream', fc:'none', tone:'light', line:false, d:true })),
]});
ART.add('eper', { emoji:['🍓'], hu:'eper', en:'ripe strawberry', shapes:[
  { t:'path', m:'red', p:'M50 92 C30 84 14 62 16 44 C18 30 32 24 50 28 C68 24 82 30 84 44 C86 62 70 84 50 92 Z' },
  { t:'poly', m:'leaf', pts:[[24, 32], [38, 26], [34, 16], [50, 22], [66, 16], [62, 26], [76, 32], [60, 38], [50, 32], [40, 38]] },
  { t:'rect', x:48, y:8, w:5, h:16, r:2, m:'leaf', rot:12 },
  ...[[34, 48], [50, 46], [66, 48], [42, 62], [58, 62], [50, 76]].map(([x, y]) => ({ t:'ellipse', cx:x, cy:y, rx:1.8, ry:2.8, m:'honey', tone:'light', line:false, d:true })),
  { t:'shine', cx:28, cy:52, rx:4, ry:9, rot:20, ox:50, oy:50 },
]});
ART.add('sushi', { emoji:['🍣'], hu:'szusi', en:'salmon nigiri sushi', shapes:[
  { t:'rect', x:14, y:46, w:72, h:40, r:18, m:'white', fc:'h' },
  { t:'path', m:'orange', p:'M8 52 C10 34 30 24 54 26 C76 28 92 36 92 50 C92 58 86 60 78 58 C60 52 40 52 22 60 C14 64 8 60 8 52 Z' },
  ...[[[28, 32], [22, 52]], [[44, 28], [38, 50]], [[60, 29], [56, 49]], [[76, 34], [74, 52]]].map(pts => ({ t:'line', pts, m:'orange', tone:'light', w:3 })),
  { t:'ellipse', cx:30, cy:74, rx:3, ry:1.8, m:'white', tone:'dark', line:false, d:true },
  { t:'ellipse', cx:66, cy:78, rx:3, ry:1.8, m:'white', tone:'dark', line:false, d:true },
]});
ART.add('csokolade', { emoji:['🍫'], hu:'csokoládé', en:'chocolate bar in a wrapper', shapes:[
  { t:'rect', x:28, y:14, w:44, h:58, r:4, m:'chocolate', rot:-12, ox:50, oy:50 },
  ...[[32, 18], [52, 18], [32, 36], [52, 36]].map(([x, y]) => ({ t:'rect', x, y, w:16, h:15, r:2, m:'chocolate', d:true, rot:-12, ox:50, oy:50 })),
  { t:'poly', m:'steel', rot:-12, ox:50, oy:50, pts:[[24, 56], [30, 52], [36, 57], [42, 52], [48, 57], [54, 52], [60, 57], [66, 52], [72, 57], [76, 53], [76, 64], [24, 64]] },
  { t:'rect', x:24, y:60, w:52, h:26, r:3, m:'red', rot:-12, ox:50, oy:50 },
  { t:'rect', x:24, y:69, w:52, h:6, m:'gold', tone:'base', d:true, rot:-12, ox:50, oy:50 },
]});
ART.add('cukorka', { emoji:['🍬'], hu:'cukorka', en:'wrapped hard candy', shapes:[
  { t:'poly', m:'pink', rot:-30, ox:50, oy:50, pts:[[34, 46], [14, 33], [19, 50], [14, 67], [34, 54]] },
  { t:'poly', m:'pink', rot:-30, ox:50, oy:50, pts:[[66, 46], [86, 33], [81, 50], [86, 67], [66, 54]] },
  { t:'ellipse', cx:50, cy:50, rx:22, ry:18, m:'pink', rot:-30, ox:50, oy:50 },
  ...[[[41, 37], [45, 63]], [[53, 36], [57, 64]]].map(pts => ({ t:'line', pts, m:'pink', tone:'light', w:3.5, rot:-30, ox:50, oy:50 })),
  ...[[[18, 41], [29, 48]], [[18, 59], [29, 52]], [[82, 41], [71, 48]], [[82, 59], [71, 52]]].map(pts => ({ t:'line', pts, m:'pink', tone:'dark', w:2, rot:-30, ox:50, oy:50 })),
]});
ART.add('krumpli', { scale:0.87, emoji:['🥔'], hu:'krumpli', en:'raw potato', shapes:[
  { t:'path', m:'cardboard', rot:-20, ox:50, oy:50, p:'M16 40 C20 22 44 16 62 20 C84 24 92 40 88 58 C84 78 62 86 42 84 C20 82 10 62 16 40 Z' },
  ...[[[32, 38], [35, 36], [38, 38]], [[60, 32], [63, 30], [66, 32]], [[46, 58], [49, 56], [52, 58]], [[72, 60], [75, 58], [78, 60]], [[26, 64], [29, 62], [32, 64]]].map(pts => ({ t:'line', pts, m:'soil', tone:'base', w:2.2, rot:-20, ox:50, oy:50 })),
  { t:'shine', cx:30, cy:30, rx:8, ry:4, rot:-30, ox:50, oy:50 },
]});
ART.add('tojas', { emoji:['🥚'], hu:'tojás', en:'white egg', shapes:[
  { t:'path', m:'cream', p:'M50 8 C70 8 84 40 84 60 C84 80 70 92 50 92 C30 92 16 80 16 60 C16 40 30 8 50 8 Z' },
  { t:'shine', cx:36, cy:36, rx:6, ry:13, rot:25, ox:50, oy:50 },
]});
ART.add('tej', { emoji:['🥛'], hu:'pohár tej', en:'glass of milk', shapes:[
  { t:'path', m:'glass', p:'M20 14 H80 L73 86 C72 90 70 92 66 92 H34 C30 92 28 90 27 86 Z', fc:'v' },
  { t:'path', m:'white', p:'M23 30 H77 L71.5 84 C71 86 70 87 68 87 H32 C30 87 29 86 28.5 84 Z', fc:'v' },
  { t:'ellipse', cx:50, cy:30, rx:27, ry:5, m:'white', fc:'none', tone:'light' },
  { t:'ellipse', cx:50, cy:14, rx:30, ry:5, m:'glass', fc:'none', tone:'light' },
  { t:'shine', x:30, y:36, w:5, h:42, rot:-4, ox:50, oy:50 },
]});
ART.add('mogyoro', { scale:0.92, emoji:['🥜'], hu:'földimogyoró', en:'peanut in the shell', shapes:[
  { t:'path', m:'cardboard', rot:-35, ox:50, oy:50, p:'M50 8 C66 8 72 22 69 34 C67 42 63 46 65 54 C72 70 67 92 50 92 C33 92 28 70 35 54 C37 46 33 42 31 34 C28 22 34 8 50 8 Z' },
  ...[[[43, 16], [41, 32]], [[57, 16], [59, 32]], [[42, 60], [41, 80]], [[58, 60], [59, 80]], [[36, 24], [64, 24]], [[36, 70], [64, 70]]].map(pts => ({ t:'line', pts, m:'cardboard', tone:'dark', w:2, rot:-35, ox:50, oy:50 })),
  { t:'shine', cx:40, cy:26, rx:3, ry:6, rot:-35, ox:50, oy:50 },
]});
ART.add('gyumolcsle', { emoji:['🧃'], hu:'dobozos gyümölcslé', en:'juice box with a straw', shapes:[
  { t:'poly', m:'pink', pts:[[45, 26], [45, 13], [56, 6.5], [58, 10], [49.5, 15.5], [49.5, 26]] },
  { t:'poly', m:'orange', fc:'none', tone:'light', pts:[[18, 30], [62, 30], [80, 20], [36, 20]] },
  { t:'poly', m:'orange', fc:'none', tone:'base', pts:[[18, 30], [62, 30], [62, 92], [18, 92]] },
  { t:'poly', m:'orange', fc:'none', tone:'dark', pts:[[62, 30], [80, 20], [80, 82], [62, 92]] },
  { t:'rect', x:24, y:46, w:32, h:30, r:5, m:'cream', fc:'none', tone:'base', d:true },
  { t:'circle', cx:40, cy:63, r:9, m:'orange', fc:'none', tone:'base', d:true },
  { t:'path', m:'leaf', fc:'none', tone:'base', d:true, p:'M41 54 C44 48 50 47 53 49 C50 54 45 55 41 54 Z' },
  { t:'shine', x:22, y:36, w:4, h:48, o:.35 },
]});
ART.add('csirkecomb', { emoji:['🍗'], hu:'sült csirkecomb', en:'roasted chicken drumstick', shapes:[
  { t:'poly', m:'cream', pts:[[40, 56], [50, 66], [34, 82], [24, 72]] },
  { t:'circle', cx:22, cy:76, r:7, m:'cream' },
  { t:'circle', cx:30, cy:84, r:7, m:'cream' },
  { t:'path', m:'orange', p:'M38 62 C26 46 34 14 60 10 C84 8 94 30 88 50 C82 68 62 74 50 72 C44 70 40 66 38 62 Z' },
  { t:'shine', cx:52, cy:24, rx:10, ry:5, rot:-25, ox:50, oy:50 },
]});
ART.add('avokado', { emoji:['🥑'], hu:'avokádó', en:'halved avocado with pit', shapes:[
  { t:'path', m:'leaf', p:'M50 8 C63 8 69 20 73 33 C79 49 88 59 88 71 C88 85 72 92 50 92 C28 92 12 85 12 71 C12 59 21 49 27 33 C31 20 37 8 50 8 Z' },
  { t:'path', m:'grass', fc:'none', tone:'light', p:'M50 16 C59 16 63 25 66 36 C71 51 80 60 80 70 C80 81 67 85 50 85 C33 85 20 81 20 70 C20 60 29 51 34 36 C37 25 41 16 50 16 Z' },
  { t:'circle', cx:50, cy:64, r:15, m:'wood' },
  { t:'shine', cx:44, cy:58, rx:4, ry:6, rot:30, ox:50, oy:50 },
]});
ART.add('narancs', { emoji:['🍊'], hu:'mandarin', en:'tangerine with a leaf', shapes:[
  { t:'circle', cx:50, cy:54, r:37, m:'orange' },
  { t:'rect', x:47, y:12, w:6, h:10, r:2, m:'soil', fc:'none', tone:'base' },
  { t:'path', m:'leaf', p:'M52 18 C60 6 78 6 86 12 C80 24 64 26 52 18 Z' },
  { t:'line', pts:[[56, 18], [78, 12]], m:'leaf', tone:'dark', w:1.8 },
  ...[[64, 40], [72, 56], [60, 74], [40, 76], [70, 70]].map(([x, y]) => ({ t:'circle', cx:x, cy:y, r:1.4, m:'orange', tone:'dark', line:false, d:true })),
  { t:'shine', cx:34, cy:38, rx:7, ry:11, rot:35, ox:50, oy:50 },
]});
ART.add('mez', { emoji:['🍯'], hu:'mézesbödön', en:'jar of golden honey', shapes:[
  { t:'path', m:'honey', p:'M22 32 H78 C88 42 90 76 80 86 C74 92 26 92 20 86 C10 76 12 42 22 32 Z' },
  { t:'rect', x:20, y:14, w:60, h:20, r:5, m:'wood', fc:'h' },
  { t:'path', m:'gold', fc:'none', tone:'dark', d:true, p:'M24 34 H76 C76 40 72 42 70 40 C68 46 62 46 62 40 C58 42 52 42 50 38 C46 44 38 44 38 38 C34 42 26 42 24 34 Z' },
  { t:'poly', m:'cream', fc:'none', tone:'base', d:true, pts:[[50, 50], [63, 57.5], [63, 72.5], [50, 80], [37, 72.5], [37, 57.5]] },
  { t:'shine', x:24, y:48, w:5, h:28, rot:-6, ox:50, oy:50 },
]});

// ============================================================
//  B szint (docs/rajzolas.md) – a 2075 „Vágod a zöld jövőt?” étel- és csomagolás-matricái:
//  elviteles_doboz, evoeszkoz, udito, kenyer, fazek, konzerv, kave, banan, repa, keksz.
//  Valódi méretből (méter) vetítve (ART.geo.camera) vagy gerincvonalból (banán, répa, evőeszköz); 4 éles tónus, 3/4-es nézet,
//  megdöntve, tömör olíva árnyék. A rajz nem árulja el, hogy a tárgy „káros” vagy „ökos” (nincs pipa, nincs X).
//  Render: node tools/art-render.js 2d web/js/art/art-food.js ki.png elviteles_doboz,… --skip food
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

  (() => {   // hab ételdoboz (kagyló): alsó tálca, kiálló perem, domború fedél benyomott mezővel, elöl zárófül
    const fit = []; for(const x of [-.118, .118]) for(const y of [0, .118]) for(const z of [-.092, .1]) fit.push([x, y, z]);
    const K = rig({ fit, az:28, el:32, tilt:-12, span:86 }), { PP, P } = K;
    ART.add('elviteles_doboz', { emoji:['🥡'], hu:'elviteles ételdoboz', en:'foam take-away clamshell food box', look:'white foam clamshell take-away box, closed: a tray, a jutting seam flange, a domed lid with a pressed panel and a front latch tab', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('white', [-.1, .1, 0, .056, -.075, .075], { sx:-.01, sz:-.01, top:false }),                                 // tálca (felfelé szélesedik)
      ...K.cube('white', [-.118, .118, .056, .064, -.092, .092]),                                                            // perem
      ...K.cube('white', [-.11, .11, .064, .124, -.085, .085], { sx:.016, sz:.014 }),                                        // fedél
      { t:'poly', m:'white', fc:'none', tone:'base', d:true, pts:PP([[-.066, .125, .048], [.066, .125, .048], [.066, .125, -.048], [-.066, .125, -.048]]) },   // benyomott mező
      { t:'path', m:'white', fc:'none', tone:'dark', line:false, d:true, p:pathOf([-.06, -.02, .02, .06].map(x => PP([[x - .004, .008, .077], [x + .004, .008, .077], [x + .004, .048, .082], [x - .004, .048, .082]]))) },   // bordák a tálcán
      { t:'poly', m:'white', fc:'none', tone:'base', pts:K.box(-.018, .018, .042, .07, .092, .1) },                          // zárófül
      shineAt(P([-.07, .094, .08]), 1.2, 5.5, 70, .75),
    ]});
  })();

  (() => {   // műanyag villa és kés: lapos tárgyak vastagsággal (a jobb-alsó sötét él), világos csík a bal oldalon
    const FORK = [[-7.9, 1], [-6.6, 0], [-5.3, 1], [-5.3, 14], [-3.5, 14], [-3.5, 1], [-2.2, 0], [-.9, 1], [-.9, 14], [.9, 14], [.9, 1], [2.2, 0], [3.5, 1], [3.5, 14], [5.3, 14],
      [5.3, 1], [6.6, 0], [7.9, 1], [7.9, 22], [6.5, 28], [2.2, 36], [2.4, 44], [4, 56], [4.2, 78], [3, 83], [0, 84], [-3, 83], [-4.2, 78], [-4, 56], [-2.4, 44], [-2.2, 36], [-6.5, 28], [-7.9, 22]];
    const KNIFE = [[2, 0], [4, 4], [4.2, 42], [4.4, 45], [4.2, 78], [3, 83], [0, 84], [-3, 83], [-4.2, 78], [-4, 47], [-3, 45], [-5.6, 40], [-6.4, 28], [-5.8, 16], [-3.8, 7], [-1, 2]];
    const at = (pts, x, deg) => turn(pts.map(([u, v]) => [x + u, 8 + v]), deg, x, 50), sh = (pts, d) => pts.map(([x, y]) => [r1(x + d), r1(y + d * .8)]);
    const fork = at(FORK, 33, -9), knife = at(KNIFE, 66, 9);
    const fk = pts => at(pts, 33, -9), kn = pts => at(pts, 66, 9);
    ART.add('evoeszkoz', { emoji:['🍴'], hu:'evőeszköz', en:'fork and knife', look:'white disposable plastic fork and knife side by side, with thickness, a groove on the handles and a serrated knife edge', tilt:-8, scale:.97, shadow:'hard', shapes:[
      { t:'poly', m:'white', fc:'none', tone:'dark', pts:sh(fork, 1.6) },                                                    // villa: vastagság
      { t:'poly', m:'white', fc:'none', tone:'base', pts:fork },
      { t:'poly', m:'white', fc:'none', tone:'light', line:false, d:true, pts:fk([[-6.9, 16], [-3, 16], [-3, 24], [-5.4, 28], [-1.6, 37], [-2.6, 44], [-3.1, 56], [-3.2, 78], [-2, 80], [-1.4, 56], [-1.1, 44], [-1, 37], [-6.3, 26]]) },
      { t:'line', m:'white', tone:'line', w:1.3, pts:fk([[0, 50], [0, 76]]) },                                                // nyél-horony
      { t:'poly', m:'white', fc:'none', tone:'dark', pts:sh(knife, 1.6) },                                                   // kés: vastagság
      { t:'poly', m:'white', fc:'none', tone:'base', pts:knife },
      { t:'poly', m:'white', fc:'none', tone:'light', line:false, d:true, pts:kn([[-3.6, 9], [-5, 17], [-5.4, 28], [-4.8, 39], [-3, 42], [-3.1, 30], [-3, 16]]) },   // fazetta az élen
      { t:'line', m:'white', tone:'dark', w:1.2, pts:kn([[-5.2, 16], [-4.1, 18], [-5.5, 21], [-4.3, 23], [-5.7, 26], [-4.4, 28], [-5.7, 31], [-4.3, 33], [-5.4, 36], [-4, 38]]) },   // fogazás
      { t:'line', m:'white', tone:'line', w:1.3, pts:kn([[0, 52], [0, 76]]) },
      shineAt(kn([[1.2, 24]])[0], 1.1, 9, 9, .8),
    ]});
  })();

  (() => {   // üdítős pohár: csonkakúp pohár fehér sávval, áttetsző domború fedél, csíkos szívószál
    const s0 = [0, .13, 0], s1 = [.024, .2, -.01];
    const fit = [[-.044, 0, 0], [.044, .12, 0], [0, .12, .044], [0, .12, -.044], [0, 0, .03], s1, [s1[0] + .006, s1[1], s1[2]]];
    const K = rig({ fit, az:0, el:22, tilt:-8, span:84 }), { P, PP, hring, drum, wrap } = K;
    const along = (a, b) => [0, 1, 2].map(k => s0[k] + (s1[k] - s0[k]) * a), seg = (a, b) => band(PP([along(a), along(b)]), 4.6, false);
    ART.add('udito', { emoji:['🥤'], hu:'üdítő szívószállal', en:'soda cup with lid and straw', look:'tall paper soda cup with a white band, a clear domed lid and a striped straw', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'red', fc:'v', pts:drum(0, .03, .12, .043) },                                                             // pohár
      { t:'poly', m:'white', fc:'v', d:true, pts:wrap(.048, .0355, .082, .0385) },                                           // fehér sáv
      { t:'poly', m:'red', fc:'none', tone:'line', o:.35, line:false, d:true, pts:wrap(.001, .0301, .01, .0312, 0, 180, 10) },   // talp-élsáv
      { t:'poly', m:'glass', fc:'v', pts:drum(.117, .046, .128, .047) },                                                     // fedél pereme
      { t:'poly', m:'glass', fc:'none', tone:'light', pts:hring(0, .128, 0, .047) },
      { t:'poly', m:'glass', fc:'v', pts:drum(.128, .037, .142, .03) },                                                      // kupola
      { t:'poly', m:'glass', fc:'none', tone:'light', pts:hring(0, .142, 0, .03) },
      { t:'poly', m:'white', fc:'v', pts:band(PP([s0, s1]), 4.6, false) },                                                   // szívószál
      { t:'poly', m:'red', fc:'none', tone:'base', line:false, d:true, pts:seg(.35, .5) },
      { t:'poly', m:'red', fc:'none', tone:'base', line:false, d:true, pts:seg(.7, .85) },
      shineAt(P([-.028, .085, .03]), 1.3, 7, -4, .6),
    ]});
  })();

  (() => {   // kenyér: hosszúkás cipó (x irányban), a jobb vége levágva – héj-gyűrű és bélzet lyukakkal, bevágások a tetején
    const SEC = [[.065, 0], [.07, .035], [.066, .062], [.055, .083], [.038, .097], [.018, .105], [0, .107], [-.018, .105], [-.038, .097], [-.055, .083], [-.066, .062], [-.07, .035], [-.065, 0]];
    const X = .1, end = (x, i0 = 0, i1 = SEC.length - 1) => SEC.slice(i0, i1 + 1).map(([z, y]) => [x, y, z]);
    const K = rig({ fit:[...end(-X), ...end(X)], az:48, el:28, tilt:-14, span:84 }), { P, PP } = K;
    const patch = (i0, i1) => PP([...end(-X, i0, i1), ...end(X, i0, i1).reverse()]);
    const cut = SEC.map(([z, y]) => [X, .05 + (y - .05) * .8, z * .82]);
    const slash = x => band(PP([[x - .026, .096, .038], [x, .106, .004], [x + .018, .104, -.024]]), 3.2, true);
    ART.add('kenyer', { emoji:['🍞'], hu:'kenyér', en:'loaf of bread', look:'long crusty loaf with diagonal scores on top, one end cut off showing the soft crumb with small holes', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'wood', fc:'none', tone:'base', pts:hull([...PP(end(-X)), ...PP(end(X))]) },                             // héj
      { t:'poly', m:'wood', fc:'none', tone:'light', line:false, d:true, pts:patch(4, 10) },                                  // teteje
      { t:'poly', m:'wood', fc:'none', tone:'dark', line:false, d:true, pts:patch(0, 2) },                                    // alsó oldal
      { t:'poly', m:'wood', fc:'none', tone:'line', o:.4, line:false, d:true, pts:patch(0, 1) },
      { t:'path', m:'cream', fc:'none', tone:'base', line:false, d:true, p:pathOf([-.06, -.01, .04].map(slash)) },   // bevágások
      { t:'poly', m:'wood', fc:'none', tone:'base', pts:PP(end(X)) },                                                         // vágott vég: héj-gyűrű
      { t:'poly', m:'cream', fc:'d', pts:PP(cut) },                                                                            // bélzet
      { t:'line', m:'wood', tone:'dark', w:1.4, pts:PP(cut.slice(0, 5).map(([x, y, z]) => [x, y, z])) },                       // héj belső széle
      { t:'path', m:'cream', fc:'none', tone:'dark', line:false, d:true, p:pathOf([[.022, .045], [-.024, .058], [.0, .03], [-.036, .034], [.034, .068], [-.004, .078]].map(([z, y]) =>
        [0, 72, 144, 216, 288].map(a => P([X, y + .0045 * sin(rad(a)), z + .006 * cos(rad(a))])))) },                          // lyukak
      shineAt(P([-.07, .092, .045]), 1.1, 6, 60, .6),
    ]});
  })();

  (() => {   // fazék maradékkal: zománcozott test, acélperem, két fül, benne sűrű étel darabokkal
    const fit = [[-.15, .08, 0], [.15, .08, 0], [0, 0, .11], [0, .107, -.115], [-.11, 0, 0], [.11, .107, 0]];
    const K = rig({ fit, az:0, el:30, tilt:-10, span:84 }), { P, PP, hring, drum, wrap } = K;
    const lip = hring(0, .107, 0, .104, 24);
    const bit = (x, z, r, n = 6) => hring(x, .086, z, r, n);
    const handle = s => ({ t:'poly', m:'dark', fc:'h', pts:hull([...hring(s * .128, .084, 0, .022, 10), ...hring(s * .128, .094, 0, .022, 10)]) });
    ART.add('fazek', { emoji:['🍲'], hu:'fazék étel', en:'pot of warm stew', look:'red enamel pot with a steel rim and two side handles, half full of leftover stew with carrot, potato and peas', tilt:K.tilt, shadow:'hard', shapes:[
      handle(-1), handle(1),
      { t:'poly', m:'red', fc:'v', pts:drum(0, .104, .1, .11) },                                                             // test
      { t:'poly', m:'red', fc:'none', tone:'line', o:.35, line:false, d:true, pts:wrap(.001, .104, .014, .105, 0, 180, 14) },   // talp-élsáv
      { t:'poly', m:'steel', fc:'v', pts:drum(.1, .11, .107, .115) },                                                         // perem
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:hring(0, .107, 0, .115, 24) },
      { t:'poly', m:'red', fc:'none', tone:'dark', d:true, pts:lip },                                                         // belső fal
      { t:'poly', m:'orange', fc:'none', tone:'base', d:true, pts:clip(hring(0, .086, 0, .104, 24), lip) },                   // étel
      { t:'poly', m:'orange', fc:'none', tone:'light', line:false, d:true, pts:clip(hring(-.02, .087, -.01, .05, 12), lip) },
      { t:'path', m:'cream', fc:'none', tone:'light', d:true, p:pathOf([bit(-.04, .03, .014, 4), bit(.045, -.01, .013, 4)]) },   // krumpli
      { t:'path', m:'orange', fc:'none', tone:'dark', d:true, p:pathOf([bit(.01, .045, .013, 8), bit(-.055, -.03, .012, 8), bit(.06, .04, .011, 8)]) },   // répa
      { t:'path', m:'leaf', fc:'none', tone:'light', d:true, p:pathOf([bit(-.012, .005, .007), bit(.022, .015, .007), bit(-.03, .06, .007), bit(.03, -.045, .007)]) },   // borsó
      shineAt(P([-.078, .05, .07]), 1.6, 8, -4, .6),
    ]});
  })();

  (() => {   // konzervdoboz: acél henger peremekkel, piros címke krém sávval, a tetején nyitófül gyűrűvel
    const fit = [[-.042, 0, 0], [.042, .11, 0], [0, 0, .042], [0, .11, -.042]];
    const K = rig({ fit, az:0, el:26, tilt:10, span:74 }), { P, PP, hring, drum, wrap } = K;
    const bead = y => ({ t:'line', m:'steel', tone:'dark', w:1.5, pts:hring(0, y, 0, .0425, 12, 0, 180) });
    ART.add('konzerv', { emoji:['🥫'], hu:'konzervdoboz', en:'tin can of food with a plain label', look:'steel tin can with rims, a red label with a cream band, a ring-pull on the lid', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'steel', fc:'v', pts:drum(0, .042, .11, .042) },                                                         // doboz
      { t:'poly', m:'red', fc:'v', pts:drum(.016, .0425, .092, .0425) },                                                     // címke
      { t:'poly', m:'cream', fc:'v', d:true, pts:wrap(.043, .0426, .066, .0426) },                                           // krém sáv
      { t:'poly', m:'red', fc:'none', tone:'line', o:.35, line:false, d:true, pts:wrap(.017, .0426, .091, .0426, 0, 22, 4) },   // jobb élsáv
      bead(.008), bead(.101),                                                                                                // peremek
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:hring(0, .11, 0, .042) },                                          // fedél
      { t:'poly', m:'steel', fc:'none', tone:'base', d:true, pts:hring(0, .11, 0, .035) },
      { t:'line', m:'steel', tone:'dark', w:1.2, pts:[...hring(0, .11, 0, .027, 16), hring(0, .11, 0, .027, 16)[0]] },       // fedél-bordák
      { t:'poly', m:'steel', fc:'none', tone:'light', d:true, pts:hring(.004, .111, .015, .012, 14) },                       // nyitógyűrű
      { t:'poly', m:'steel', fc:'none', tone:'dark', line:false, d:true, pts:hring(.004, .111, .015, .006, 10) },
      dot(P([0, .111, 0]), 1.4, 'steel', 'dark'),                                                                            // szegecs
      shineAt(P([-.028, .055, .03]), 1.4, 9, -10, .55),
    ]});
  })();

  (() => {   // újrahasználható kávéspohár: türkiz test, parafa markolat-sáv, sötét fedél ivónyílással, egy csík gőz
    const fit = [[-.044, 0, 0], [.044, .13, 0], [0, 0, .033], [0, .13, -.044], [0, .175, .02]];
    const K = rig({ fit, az:0, el:24, tilt:-10, span:80 }), { P, PP, hring, drum, wrap } = K;
    const st = P([0, .132, .024]);
    ART.add('kave', { emoji:['☕'], hu:'kávé', en:'reusable coffee cup with lid', look:'reusable take-away coffee cup: teal body, cork grip band, dark lid with a sip hole and a wisp of steam', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'path', m:'white', o:.95, p:`M${r1(st[0])} ${r1(st[1] - 2)} C${r1(st[0] - 8)} ${r1(st[1] - 9)} ${r1(st[0] + 6)} ${r1(st[1] - 14)} ${r1(st[0] - 1)} ${r1(st[1] - 23)} C${r1(st[0] + 11)} ${r1(st[1] - 15)} ${r1(st[0] + 3)} ${r1(st[1] - 8)} ${r1(st[0] + 4)} ${r1(st[1] - 2)} Z` },   // gőz
      { t:'poly', m:'teal', fc:'v', pts:drum(0, .033, .115, .041) },                                                         // pohár
      { t:'poly', m:'teal', fc:'none', tone:'line', o:.35, line:false, d:true, pts:wrap(.001, .0331, .011, .0342, 0, 180, 10) },
      { t:'poly', m:'cardboard', fc:'v', pts:drum(.036, .0368, .08, .0405) },                                                // parafa sáv
      { t:'path', m:'cardboard', fc:'none', tone:'dark', line:false, d:true, p:pathOf([[-.02, .05], [.012, .045], [.004, .066], [-.03, .07], [.025, .063]].map(([x, y]) => PP([0, 90, 180, 270].map(a => [x + .0022 * cos(rad(a)), y + .0022 * sin(rad(a)), .04]))) ) },   // parafa pöttyök
      { t:'poly', m:'dark', fc:'v', pts:drum(.113, .043, .124, .044) },                                                      // fedél
      { t:'poly', m:'dark', fc:'none', tone:'light', pts:hring(0, .124, 0, .044) },
      { t:'poly', m:'dark', fc:'v', pts:drum(.124, .036, .13, .034) },                                                       // ivóperem
      { t:'poly', m:'dark', fc:'none', tone:'light', pts:hring(0, .13, 0, .034) },
      { t:'poly', m:'dark', fc:'none', tone:'line', line:false, d:true, pts:hring(0, .1305, .024, .008, 10) },               // ivónyílás
      shineAt(P([-.027, .095, .03]), 1.2, 4, -6, .6), shineAt(P([-.025, .024, .026]), 1.2, 4, -6, .5),
    ]});
  })();

  (() => {   // foltos banán: ív alakú test (gerincből), világos felső és sötét alsó csík, él-borda, barna foltok, szár és hegy
    const sp = bez([24, 24], [22, 76], [84, 70], 14), w = t => t < .06 ? 6 : 6 + 12 * Math.pow(sin(PI * min(1, (t - .06) / .9)), .6);
    const at = (t, o = 0) => { const i = Math.round(t * (sp.length - 1)); return offs(sp, o)[i]; };
    const spots = [[.3, -2], [.42, 3], [.55, -3], [.62, 2], [.72, -1], [.5, 0], [.36, 4]].map(([t, o]) => { const c = at(t, o); return circ(c[0], c[1], 2.2 + (t * 10 % 1.2), 7, 1.7); });
    ART.add('banan', { emoji:['🍌'], hu:'banán', en:'ripe banana', look:'single ripe curved banana with brown spots, a green-brown stem and a dark tip', tilt:-8, shadow:'hard', shapes:[
      { t:'poly', m:'grass', fc:'none', tone:'dark', pts:band([[25, 26], [21, 13]], 6, false) },                             // szár
      { t:'rect', x:16.5, y:9.5, w:8, h:5, r:1.5, m:'soil', rot:-17, ox:20.5, oy:12 },
      { t:'poly', m:'honey', fc:'none', tone:'base', pts:band(sp, w) },                                                      // test
      { t:'poly', m:'honey', fc:'none', tone:'light', line:false, d:true, pts:band(offs(sp, t => -w(t) * .2).slice(2, 13), t => w(.15 + t * .75) * .3) },   // felső csík
      { t:'poly', m:'honey', fc:'none', tone:'dark', line:false, d:true, pts:band(offs(sp, t => w(t) * .3).slice(2, 13), t => w(.15 + t * .75) * .26) },    // alsó csík
      { t:'line', m:'honey', tone:'line', o:.45, w:1.2, pts:RR(offs(sp, t => w(t) * .41).slice(2, 13)) },                    // él-borda
      { t:'line', m:'gold', tone:'dark', w:1.3, pts:RR(offs(sp, t => w(t) * .06).slice(2, 12)) },                            // borda
      { t:'path', m:'chocolate', fc:'none', tone:'light', line:false, d:true, p:pathOf(spots) },                             // barna foltok
      { t:'poly', m:'chocolate', fc:'none', tone:'base', pts:band([sp[13], [87.5, 70.5]], 5, true) },                        // hegy
      shineAt(at(.4, -4.5), 1.2, 5, 30, .65),
    ]});
  })();

  (() => {   // görbe sárgarépa: kétszer megtörő gerinc, gyűrű-barázdák, hajszálgyökerek, lombkorona (arc nélkül)
    const sp = [[42, 31], [46.5, 41], [48.5, 51], [45.5, 60], [43.5, 68], [46.5, 77], [53, 85], [60, 90.5]], w = t => max(1.8, 25 * Math.pow(1 - t, .9));
    const edge = (i, k) => offs(sp, t => w(t) * k)[i];
    const groove = (i, k0, k1) => band([edge(i, k0), edge(i, k1)], 1.4, true);
    ART.add('repa', { emoji:['🥕'], hu:'sárgarépa', en:'fresh carrot with green top', look:'crooked, twice-bent carrot with ring grooves, tiny root hairs and a leafy green top', tilt:12, scale:.87, shadow:'hard', shapes:[
      { t:'path', m:'grass', p:leaf(42, 28, -52, 25, 9) },                                                                  // levelek
      { t:'path', m:'leaf', p:leaf(42, 28, -130, 23, 9) },
      { t:'path', m:'leaf', p:leaf(42, 28, -90, 28, 10) },
      { t:'line', m:'leaf', tone:'dark', w:1.2, pts:[[42, 27], [42.6, 10]] },
      { t:'line', m:'orange', tone:'line', w:1.2, pts:[edge(4, -.45), [58, 66]] },                                           // hajszálgyökerek
      { t:'line', m:'orange', tone:'line', w:1.2, pts:[edge(3, .45), [33, 62]] },
      { t:'poly', m:'orange', fc:'none', tone:'base', pts:band(sp, w) },                                                     // test
      { t:'poly', m:'orange', fc:'none', tone:'light', line:false, d:true, pts:band(offs(sp, t => w(t) * .24).slice(0, 7), t => w(t * .85) * .26, false) },   // világos oldal
      { t:'poly', m:'orange', fc:'none', tone:'dark', line:false, d:true, pts:band(offs(sp, t => -w(t) * .3).slice(0, 7), t => w(t * .85) * .22, false) },   // árnyékos oldal
      { t:'path', m:'orange', fc:'none', tone:'line', o:.55, line:false, d:true, p:pathOf([groove(2, .36, .1), groove(3, -.36, -.02), groove(4, .34, .06), groove(5, -.3, .02)]) },   // barázdák
      { t:'poly', m:'orange', fc:'none', tone:'light', line:false, d:true, pts:RR(circ(42.3, 32.2, 9.5, 12, 2.6)) },                // váll
      shineAt(edge(2, .25), 1.2, 5, -8, .6),
    ]});
  })();

  (() => {   // keksz: két egymáson fekvő, kissé hullámos szélű csokidarabos keksz, fent világos, oldala sötét, repedéssel
    const wob = a => 1 + .035 * sin(rad(5 * a)) + .02 * sin(rad(3 * a + 60));
    const fit = [[-.064, -.015, -.01], [.062, .013, .04], [.062, -.015, .048], [0, -.015, .054], [0, .013, -.054], [-.064, -.015, -.064], [.054, .013, -.03]];
    const K = rig({ fit, az:0, el:44, tilt:-12, span:80 }), { P, PP } = K;
    const ring = (y, r, dx = 0, dz = 0, a0 = 0, a1 = 360, n = 18) => PP(Array.from({ length:a1 - a0 >= 360 ? n : n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [dx + r * wob(a) * cos(rad(a)), y, dz + r * wob(a) * sin(rad(a))]; }));
    const side = (y0, y1, dx, dz) => [...ring(y0, .05, dx, dz, 0, 180), ...ring(y1, .05, dx, dz, 180, 360)];
    const chip = (x, z, s) => PP([[x - .006 * s, .0135, z], [x, .0135, z - .005 * s], [x + .007 * s, .0135, z + .001], [x + .002, .0135, z + .006 * s], [x - .005 * s, .0135, z + .004]]);
    ART.add('keksz', { emoji:['🍪'], hu:'keksz', en:'chocolate chip cookie', look:'two stacked round biscuits with slightly wavy edges, chocolate chips and a small crack', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'wood', fc:'none', tone:'dark', pts:side(-.015, -.002, -.012, -.01) },                                  // alsó keksz
      { t:'poly', m:'wood', fc:'none', tone:'dark', pts:side(0, .013, 0, 0) },                                              // felső keksz oldala
      { t:'poly', m:'wood', fc:'none', tone:'line', o:.35, line:false, d:true, pts:[...ring(.001, .05, 0, 0, 0, 40, 5), ...ring(.012, .05, 0, 0, 0, 40, 5).reverse()] },
      { t:'poly', m:'wood', fc:'none', tone:'light', pts:ring(.013, .05) },                                                 // teteje
      { t:'poly', m:'wood', fc:'none', tone:'base', line:false, d:true, pts:[...ring(.013, .0485, 0, 0, -80, 70, 10), ...ring(.013, .04, .006, .003, 70, -80, 10)] },   // árnyékos perem
      { t:'line', m:'wood', tone:'dark', w:1.4, pts:PP([[-.035, .0135, -.012], [-.022, .0135, -.004], [-.018, .0135, .01], [-.006, .0135, .016]]) },   // repedés
      { t:'path', m:'chocolate', fc:'none', tone:'base', d:true, p:pathOf([chip(-.022, -.022, 1), chip(.012, -.03, .9), chip(.028, .0, 1.1), chip(-.004, .006, 1), chip(-.03, .018, .9), chip(.016, .03, 1)]) },   // csokidarabok
      { t:'path', m:'chocolate', fc:'none', tone:'light', line:false, d:true, p:pathOf([[-.024, -.024], [.01, -.032], [.026, -.002], [-.006, .004]].map(([x, z]) => PP([[x - .003, .014, z], [x, .014, z - .0015], [x + .001, .014, z + .0015]]))) },   // csillanás a csokin
      shineAt(P([-.028, .014, -.02]), 1.2, 5, 60, .6), shineAt(P([-.036, .006, .034]), 1, 3.5, 30, .45),
    ]});
  })();
})();
