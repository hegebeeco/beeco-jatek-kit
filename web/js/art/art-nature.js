// ============================================================
//  Matricák — természet, időjárás, energia, állatok, jelek  ·  stílus: docs/grafika-spec.md
//  A 2075-játék természet-matricái (láng, pamacs, pillangó, fák, levelek, állatok…) B szinten: art-nature-b.js
// ============================================================
ART.add('nap', { emoji:['☀️', '🔆', '🌞'], hu:'nap', en:'bright sun', shapes:[
  ...[0, 45, 90, 135, 180, 225, 270, 315].map(a => ({ t:'poly', m:'honey', fc:'none', tone:'dark', rot:a, ox:50, oy:50, pts:[[45, 17], [55, 17], [50, 9]] })),
  { t:'circle', cx:50, cy:50, r:29, m:'honey' },
  { t:'shine', cx:40, cy:39, rx:9, ry:5, rot:-30, ox:40, oy:39, o:.6 },
]});
ART.add('vizcsepp', { emoji:['💧'], hu:'vízcsepp', en:'water drop', shapes:[
  { t:'path', m:'water', p:'M50 8 C62 28 78 44 78 62 C78 80 65 92 50 92 C35 92 22 80 22 62 C22 44 38 28 50 8 Z' },
  { t:'shine', cx:38, cy:62, rx:6, ry:13, rot:-15, ox:38, oy:62, o:.65 },
]});
ART.add('villam', { emoji:['⚡'], hu:'villám', en:'lightning bolt', shapes:[
  { t:'poly', m:'honey', pts:[[57, 10], [24, 55], [46, 55], [40, 90], [76, 41], [54, 41]] },
]});

(function(){
  // ---- rajz-segédek (csak ebben a fájlban) ----
  const { r1, R, rad, arc, band, leaf } = ART.geo, r1f = r1;   // közös segédek: web/js/art/art.js
  // pontok elforgatása (fok, óramutató szerint) egy középpont körül – a lapok így a közös, bal-felső fényt kapják
  const turn = (pts, deg, cx = 50, cy = 50) => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
    return R(pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c])); };
  // sima görbe a megadott pontokon át (Catmull–Rom)
  const smooth = (pts, n = 6) => { const out = [];
    for(let i = 0; i < pts.length - 1; i++){
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for(let j = 0; j < n; j++){ const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(k => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3))); }
    }
    out.push(pts[pts.length - 1]); return out; };
  // esőcsepp-forma (hegyével felfelé)
  const drop = (cx, cy, s) => { const P = (x, y) => `${r1(cx + x * s)} ${r1(cy + y * s)}`;
    return `M${P(0, -10)} C${P(3, -5)} ${P(6, -1)} ${P(6, 3)} C${P(6, 7)} ${P(3, 10)} ${P(0, 10)} C${P(-3, 10)} ${P(-6, 7)} ${P(-6, 3)} C${P(-6, -1)} ${P(-3, -5)} ${P(0, -10)} Z`; };

  // ================= időjárás, levegő =================
  ART.add('hopehely', { emoji:['❄️'], hu:'hópehely', en:'snowflake', shapes:[
    // hat ág, mindegyiken egy V-alakú mellékág; a felfelé/balra néző ágak világosabbak (fény bal-fentről)
    ...[[0, 'light'], [60, 'base'], [120, 'dark'], [180, 'dark'], [240, 'base'], [300, 'light']].map(([a, tone]) => ({ t:'poly', m:'sky', tone,
      pts:turn([[46, 50], [46, 36], [36, 26], [40.2, 21.8], [46, 27.6], [46, 13], [50, 9], [54, 13], [54, 27.6], [59.8, 21.8], [64, 26], [54, 36], [54, 50]], a) })),
    { t:'poly', m:'sky', pts:turn([[50, 39], [59.5, 44.5], [59.5, 55.5], [50, 61], [40.5, 55.5], [40.5, 44.5]], 0) },
  ]});
  ART.add('szel', { emoji:['🌬️'], hu:'szél', en:'gust of wind swirls', shapes:[
    { t:'poly', m:'sky', pts:band([[14, 33], [50, 33], ...arc(56, 23, 10, 90, -200, 14)], 7.5) },
    { t:'poly', m:'sky', pts:band([[10, 50], [86, 50]], 7.5) },
    { t:'poly', m:'sky', pts:band([[18, 67], [50, 67], ...arc(56, 77, 10, -90, 200, 14)], 7.5) },
  ]});
  ART.add('esofelho', { emoji:['🌧️'], hu:'esőfelhő', en:'rain cloud', shapes:[
    { t:'path', m:'water', p:drop(28, 76, 1.1), rot:15, ox:28, oy:76 },
    { t:'path', m:'water', p:drop(50, 80, 1.1), rot:15, ox:50, oy:80 },
    { t:'path', m:'water', p:drop(72, 76, 1.1), rot:15, ox:72, oy:76 },
    { t:'path', m:'steel', p:'M22 62 C8 62 6 42 20 40 C20 24 36 14 48 22 C56 8 80 12 80 32 C94 32 96 62 80 62 Z' },
    { t:'shine', cx:34, cy:34, rx:7, ry:3.5, rot:-25, ox:34, oy:34 },
  ]});
  ART.add('kod', { emoji:['🌫️'], hu:'köd', en:'fog cloud', shapes:[
    { t:'path', m:'steel', p:'M22 56 C8 56 6 36 20 34 C20 18 36 8 48 16 C56 2 80 6 80 26 C94 26 96 56 80 56 Z' },
    { t:'rect', x:12, y:46, w:66, h:10, r:5, m:'white', fc:'h' },
    { t:'rect', x:24, y:62, w:66, h:10, r:5, m:'white', fc:'h' },
    { t:'rect', x:10, y:78, w:60, h:10, r:5, m:'white', fc:'h' },
  ]});

  // ================= növények =================
  ART.add('oszi_level', { emoji:['🍂'], hu:'őszi levél', en:'fallen autumn maple leaf', shapes:[
    { t:'path', m:'cardboard', p:leaf(36, 86, -18, 56, 26) },
    { t:'line', pts:[[40, 85], [86, 69]], m:'cardboard', tone:'dark', w:2.2, d:true },
    { t:'poly', m:'orange', pts:band(turn([[50, 64], [50, 90]], -15), 4.5) },
    { t:'poly', m:'orange', pts:turn([[50, 8], [57, 24], [68, 18], [66, 34], [86, 30], [78, 46], [90, 54], [70, 62], [74, 74], [54, 68], [50, 72],
      [46, 68], [26, 74], [30, 62], [10, 54], [22, 46], [14, 30], [34, 34], [32, 18], [43, 24]], -15) },
    { t:'line', pts:turn([[50, 68], [50, 22]], -15), m:'orange', tone:'dark', w:2.2 },
    { t:'line', pts:turn([[50, 56], [76, 40]], -15), m:'orange', tone:'dark', w:2.2 },
    { t:'line', pts:turn([[50, 56], [24, 40]], -15), m:'orange', tone:'dark', w:2.2 },
  ]});

  // ================= energia, otthon =================
  ART.add('buborekok', { emoji:['🫧'], hu:'buborékok', en:'soap bubbles', shapes:[
    { t:'circle', cx:24, cy:72, r:9, m:'glass' },
    { t:'circle', cx:58, cy:57, r:30, m:'glass' },
    { t:'circle', cx:25, cy:29, r:15, m:'glass' },
    { t:'circle', cx:83, cy:19, r:8, m:'glass' },
    { t:'shine', cx:45, cy:43, rx:9, ry:5, rot:-40, ox:45, oy:43, o:.8 },
    { t:'line', pts:R(arc(58, 57, 22, 15, 75, 6)), m:'white', tone:'light', w:3 },
    { t:'shine', cx:20, cy:24, rx:4.5, ry:2.5, rot:-40, ox:20, oy:24, o:.8 },
    { t:'shine', cx:80, cy:16, rx:2.5, ry:1.5, rot:-40, ox:80, oy:16, o:.8 },
  ]});
  ART.add('gozolgo', { emoji:['♨️'], hu:'gőzölgő meleg', en:'steaming hot bowl', look:'wavy steam lines rising', shapes:[
    // hullámzó, felfelé elvékonyodó gőzcsíkok egy meleg tál fölött
    ...[31, 50, 69].map((x0, i) => ({ t:'poly', m:'tomato', tone:'light', pts:band(Array.from({ length:13 }, (_, k) => {
      const y = 64 - k * (i === 1 ? 52 : 44) / 12; return [x0 + 4 * Math.sin(k / 12 * Math.PI * 2.4), y]; }), t => 9 - 4 * t) })),
    { t:'path', m:'tomato', fc:'h', p:'M12 64 H88 C88 80 72 90 50 90 C28 90 12 80 12 64 Z' },
    { t:'ellipse', cx:50, cy:64, rx:38, ry:8, m:'tomato', tone:'dark' },
  ]});
  ART.add('foldgolyo', { emoji:['🌍'], hu:'Föld', en:'planet earth globe', shapes:[
    { t:'circle', cx:50, cy:50, r:41, m:'water' },
    { t:'path', m:'grass', p:'M36 18 C44 14 56 14 62 20 C66 26 60 32 52 34 C46 36 40 36 34 32 C30 28 30 22 36 18 Z' },
    { t:'path', m:'grass', p:'M44 44 C52 40 62 42 68 50 C72 58 66 64 64 72 C62 80 58 86 54 84 C52 76 50 70 44 66 C36 62 34 50 44 44 Z' },
    { t:'path', m:'grass', p:'M70 38 C76 38 82 44 80 52 C76 52 72 46 70 38 Z' },
    { t:'path', m:'grass', p:'M15 40 C20 36 26 42 24 50 C22 58 19 63 15 63 C13 56 13 46 15 40 Z' },
    { t:'shine', cx:26, cy:36, rx:4, ry:9, rot:25, ox:26, oy:36, o:.5 },
  ]});
  // ================= égbolt, jelek =================
  ART.add('holdsarlo', { emoji:['🌙'], hu:'holdsarló', en:'crescent moon', shapes:[
    { t:'path', m:'honey', box:[10, 10, 78, 80], p:'M46.5 10.2 A40 40 0 1 0 87.3 64.5 A34 34 0 1 1 46.5 10.2 Z' },
    { t:'shine', cx:22, cy:48, rx:3.5, ry:13, rot:8, ox:22, oy:48 },
  ]});
  // ötágú csillag lapokra tört éllel: minden ág két fele a fény irányától függően világos / sötét
  const starPts = (cx, cy, Ro, Ri) => R(Array.from({ length:10 }, (_, i) => { const a = rad(-90 + i * 36), q = i % 2 ? Ri : Ro;
    return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  const bevelStar = (cx, cy, Ro, Ri, m) => { const P = starPts(cx, cy, Ro, Ri), out = [{ t:'poly', m, tone:'base', line:false, pts:P }];
    for(let i = 0; i < 10; i++){ const a = P[i], b = P[(i + 1) % 10], mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy;
      const lit = (-mx - my) / Math.hypot(mx, my) / Math.SQRT2;
      if(Math.abs(lit) > .3) out.push({ t:'poly', m, tone:lit > 0 ? 'light' : 'dark', line:false, pts:[[cx, cy], a, b] }); }
    out.push({ t:'poly', m, fc:'none', o:0, pts:P });   // csak a kontúr
    return out; };
  ART.add('csillag', { emoji:['⭐', '★'], hu:'csillag', en:'golden star', shapes:bevelStar(50, 53, 42, 19, 'honey') });
  ART.add('ragyo_csillag', { emoji:['🌟'], hu:'ragyogó csillag', en:'glowing star with light rays', shapes:[
    ...[-54, 18, 90, 162, 234].map(a => ({ t:'poly', m:'gold', tone:'dark', pts:band([[50 + 30 * Math.cos(rad(a)), 50 + 30 * Math.sin(rad(a))], [50 + 39 * Math.cos(rad(a)), 50 + 39 * Math.sin(rad(a))]], 5.5) })),
    ...bevelStar(50, 50, 34, 15.5, 'honey'),
  ]});
  ART.add('ujrahasznositas', { emoji:['♻️'], hu:'újrahasznosítás', en:'recycling arrows badge', shapes:[
    { t:'circle', cx:50, cy:50, r:42, m:'leaf' },
    // három körbe futó nyíl: ív + nyílhegy
    ...[0, 120, 240].flatMap(k => { const a0 = -80 + k, a1 = a0 + 66, rr = 25, at = (r, a) => [50 + r * Math.cos(rad(a)), 50 + r * Math.sin(rad(a))];
      return [{ t:'poly', m:'cream', tone:'light', pts:band(arc(50, 50, rr, a0, a1, 10), 10) },
        { t:'poly', m:'cream', tone:'light', pts:R([at(rr + 12.5, a1), at(rr, a1 + 30), at(rr - 12.5, a1)]) }]; }),
  ]});
  ART.add('zold_gomb', { emoji:['🟢'], hu:'zöld pötty', en:'glossy green round button', shapes:[
    { t:'circle', cx:50, cy:50, r:40, m:'leaf' },
    { t:'circle', cx:50, cy:50, r:30, m:'grass' },
    { t:'shine', cx:40, cy:38, rx:10, ry:5, rot:-35, ox:40, oy:38 },
  ]});
  ART.add('pipa_jelveny', { emoji:['✅'], hu:'pipa jelvény', en:'green check mark badge', shapes:[
    { t:'rect', x:10, y:10, w:80, h:80, r:18, m:'leaf' },
    { t:'poly', m:'cream', tone:'light', pts:band([[28, 51], [43, 66], [72, 34]], 12) },
    { t:'shine', x:17, y:16, w:22, h:5, rot:-4, ox:28, oy:18 },
  ]});
  ART.add('pipa', { emoji:['✔️'], hu:'pipa', en:'bold green check mark', shapes:[
    { t:'poly', m:'leaf', pts:band([[17, 52], [39, 74], [83, 24]], 17) },
  ]});
  ART.add('jegcsapok', { emoji:['🥶'], hu:'jégcsapok', en:'icicles hanging from a snowy ledge', shapes:[
    { t:'poly', m:'sky', pts:[[14, 26], [30, 26], [22, 70]] },
    { t:'poly', m:'sky', pts:[[32, 26], [50, 26], [41, 88]] },
    { t:'poly', m:'sky', pts:[[52, 26], [66, 26], [59, 62]] },
    { t:'poly', m:'sky', pts:[[67, 26], [85, 26], [76, 80]] },
    { t:'path', m:'white', fc:'h', p:'M8 20 C8 13 13 10 20 10 H80 C87 10 92 13 92 20 C92 28 87 31 82 28 C78 34 70 34 67 29 C62 33 55 33 52 29 C47 34 38 34 35 29 C30 33 22 34 18 29 C12 31 8 27 8 20 Z' },
    { t:'shine', x:37, y:40, w:3, h:22, rot:-8, ox:38, oy:50 },
  ]});
  ART.add('celtabla', { emoji:['🎯'], hu:'céltábla', en:'target with a dart in the bullseye', shapes:[
    { t:'circle', cx:46, cy:54, r:38, m:'red' },
    { t:'circle', cx:46, cy:54, r:28, m:'cream', tone:'light' },
    { t:'circle', cx:46, cy:54, r:18, m:'red', tone:'base' },
    { t:'circle', cx:46, cy:54, r:8, m:'cream', tone:'light' },
    { t:'poly', m:'wood', pts:band([[46, 54], [75, 25]], 4.5) },
    { t:'poly', m:'honey', pts:[[72.6, 26.4], [88.2, 23.2], [83.9, 16.1], [76.8, 11.8]] },
  ]});

  // ================= állatok (barátságos, egyszerű) =================
  const eye = (cx, cy, r) => [
    { t:'circle', cx, cy, r, m:'dark', tone:'base', line:false, d:true },
    { t:'circle', cx:r1(cx - r * .35), cy:r1(cy - r * .35), r:r1(r * .35), m:'white', tone:'light', line:false, d:true },
  ];
  ART.add('nyul', { emoji:['🐇'], hu:'nyúl', en:'cute bunny rabbit', shapes:[
    { t:'circle', cx:15, cy:56, r:9, m:'cream' },
    { t:'ellipse', cx:61, cy:27, rx:6, ry:18, rot:-18, ox:61, oy:27, m:'cardboard' },
    { t:'ellipse', cx:62, cy:85, rx:11, ry:6, m:'cardboard', fc:'h' },
    { t:'ellipse', cx:44, cy:66, rx:30, ry:22, m:'cardboard' },
    { t:'circle', cx:70, cy:50, r:16, m:'cardboard' },
    { t:'ellipse', cx:73, cy:25, rx:6.5, ry:19, rot:12, ox:73, oy:25, m:'cardboard' },
    { t:'ellipse', cx:73, cy:26, rx:3, ry:13, rot:12, ox:73, oy:26, m:'blossom', tone:'base', line:false, d:true },
    ...eye(76, 47, 2.8),
    { t:'circle', cx:85.5, cy:54, r:2.3, m:'pink', tone:'dark', line:false, d:true },
    { t:'circle', cx:76, cy:57, r:3.5, m:'blossom', tone:'base', line:false, d:true, o:.8 },
  ]});
  ART.add('tyuk', { emoji:['🐔'], hu:'tyúk', en:'cute white hen', shapes:[
    { t:'line', pts:[[44, 82], [42, 91]], m:'honey', tone:'dark', w:3 }, { t:'line', pts:[[58, 82], [60, 91]], m:'honey', tone:'dark', w:3 },
    { t:'path', m:'cream', p:'M30 58 C20 48 12 32 18 20 C27 23 34 34 42 46 Z' },
    { t:'ellipse', cx:50, cy:62, rx:30, ry:23, m:'cream' },
    { t:'path', m:'red', p:'M60 24 C57 14 64 10 68 16 C70 8 79 10 77 18 C84 16 87 23 80 27 Z' },
    { t:'circle', cx:70, cy:34, r:14, m:'cream' },
    { t:'poly', m:'honey', pts:[[82, 31], [92, 36], [82, 41]] },
    { t:'ellipse', cx:80, cy:45, rx:3.5, ry:5, m:'red' },
    { t:'path', m:'cream', tone:'dark', p:'M34 60 C42 52 58 54 64 64 C58 74 44 74 34 60 Z' },
    ...eye(74, 31, 2.4),
  ]});
  ART.add('hal', { emoji:['🐟'], hu:'hal', en:'blue fish', shapes:[
    { t:'poly', m:'blue', pts:[[66, 50], [90, 32], [85, 50], [90, 68]] },
    { t:'path', m:'blue', p:'M34 36 C40 20 58 20 64 38 Z' },
    { t:'path', m:'blue', p:'M40 62 C44 76 54 76 56 62 Z' },
    { t:'path', m:'water', p:'M12 50 C22 30 48 24 72 44 C74 48 74 52 72 56 C48 76 22 70 12 50 Z' },
    { t:'line', pts:R(arc(24, 50, 12, -45, 45, 6)), m:'water', w:2 },
    { t:'circle', cx:25, cy:46, r:4.5, m:'cream', tone:'light', d:true },
    ...eye(24.5, 46.5, 2.3),
    { t:'shine', cx:46, cy:38, rx:8, ry:2.5, rot:-12, ox:46, oy:38 },
  ]});
  ART.add('beka', { emoji:['🐸'], hu:'béka', en:'cute green frog', shapes:[
    { t:'circle', cx:30, cy:33, r:15, m:'grass' },
    { t:'circle', cx:70, cy:33, r:15, m:'grass' },
    { t:'ellipse', cx:50, cy:61, rx:40, ry:27, m:'grass' },
    { t:'circle', cx:30, cy:32, r:9.5, m:'cream', tone:'light' },
    { t:'circle', cx:70, cy:32, r:9.5, m:'cream', tone:'light' },
    ...eye(31, 33, 4.8), ...eye(71, 33, 4.8),
    { t:'line', pts:R(smooth([[28, 62], [39, 69], [50, 70], [61, 69], [72, 62]], 4)), m:'grass', w:2.4 },
    { t:'ellipse', cx:22, cy:66, rx:5, ry:3, m:'blossom', tone:'base', line:false, d:true, o:.8 },
    { t:'ellipse', cx:78, cy:66, rx:5, ry:3, m:'blossom', tone:'base', line:false, d:true, o:.8 },
    { t:'circle', cx:46, cy:53, r:1.3, m:'grass', tone:'line', line:false, d:true },
    { t:'circle', cx:54, cy:53, r:1.3, m:'grass', tone:'line', line:false, d:true },
  ]});
})();

// ============================================================
//  B szint (docs/rajzolas.md): valódi méretekből (cm) vetítve (ART.geo.camera), 4 éles tónus, 3/4-es nézet, tömör olíva árnyék.
//  Az Ökos-rejtély tartalom-ikonjai – 48 px-en is olvashatók. Render: node tools/art-render.js 2d <fájl> ki.png <nevek>
// ============================================================
(function(){
  // ---- B szintű rajz-segédek (docs/rajzolas.md; ugyanaz a készlet, mint az art-huto.js-ben, tömörítve) ----
  const { r1, rad, camera, band } = ART.geo;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const RR = pts => pts.map(p => [r1(p[0]), r1(p[1])]);
  const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => 'M' + RR(p).map(q => q.join(' ')).join(' ') + 'Z').join('');
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
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
  // függőlegesen konvex, átfedő konvex sokszögek uniójának körvonala (forgástest sziluettje)
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
  // konvex vágás (Sutherland–Hodgman)
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
  // alakzat-gyártók: fő lap (kontúrral, peremet kap) · dísz-lap · útvonal · dísz-útvonal · fénycsík
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts:RR(pts) }, o);
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts:RR(pts) }, o);
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, p:pathOf(polys) }, o);
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, p:pathOf(polys) }, o);
  const shineP = (pts, o = .6) => det('paper', 'light', pts, { o });
  const lineP = (m, tone, pts, w, o) => Object.assign({ t:'line', m, tone, w, pts:RR(pts) }, o);
  // doboz lapjai a vetítésben (az > 0: az eleje (+Z) és a jobb (+X) oldala látszik)
  function box(P, x0, x1, y0, y1, z0, z1){
    const c = (x, y, z) => P([x, y, z]), all = [];
    for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) all.push(c(x, y, z));
    return { top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)], bottom:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y0, z0), c(x0, y0, z0)],
      front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)], right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)],
      left:[c(x0, y0, z1), c(x0, y0, z0), c(x0, y1, z0), c(x0, y1, z1)], sil:hull(all) };
  }
  // forgástest: prof = [[r, y], …] a tengely mentén; xf = a helyi (x, y, z) pont elhelyezése a térben (forgatás, nyújtás)
  //   szög: 0 = elöl (+Z), −90 = bal (−X), +90 = jobb (+X)
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
    const wrap = pts => pts.map(([a, y]) => on(a, y));
    return { at, rAt, ring, full, sil, on, strip, wrap };
  }
  // cső / zsinór: 3D középvonal → vastag sáv (sil) és a fény felőli (bal-fenti) keskeny csík (hi)
  function pipe(P, pts3, r, hiK = .45){
    const c = pts3.map(P), w = 2 * r * P.k, sil = band(c, w);
    const hi = c.map((p, i) => { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      let nx = -dy / l, ny = dx / l; if(nx + ny > 0){ nx = -nx; ny = -ny; } return [p[0] + nx * w * .28, p[1] + ny * w * .28]; });
    return { c, w, sil, hi:band(hi, w * hiK) };
  }
  const rotX = d => ([x, y, z]) => [x, y * cos(d) - z * sin(d), y * sin(d) + z * cos(d)];
  const rotZ = d => ([x, y, z]) => [x * cos(d) - y * sin(d), x * sin(d) + y * cos(d), z];
  const rotY = d => ([x, y, z]) => [x * cos(d) + z * sin(d), y, -x * sin(d) + z * cos(d)];
  const chain = (...fs) => p => fs.reduce((q, f) => f(q), p);


  // =====================================================================
  //  Hőmérő – üvegcső gömbölyű tartállyal; benne piros folyadékoszlop, a csövön beosztás-rovátkák (számok nélkül)
  // =====================================================================
  {
    const TILT = 16, glassP = [[.5, .05], [1.3, .4], [1.9, 1.2], [2.05, 2.0], [1.9, 2.9], [1.35, 3.6], [1.2, 4.2], [1.2, 17], [.95, 17.7], [.3, 18]];
    const redB = [[.4, .45], [1.25, .95], [1.48, 1.95], [1.25, 2.9], [.5, 3.5]], col = [[.5, 3.3], [.5, 12.2]];
    const fit = glassP.flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]);
    const P = camera({ az:0, el:16, tilt:TILT, span:84, fit }), G = lathe(P, glassP), Rb = lathe(P, redB), C = lathe(P, col);
    const ticks = Array.from({ length:9 }, (_, i) => { const y = 5.2 + i * 1.35; return band(G.ring(1.21, y, i % 2 ? 30 : 8, 58, 4), 1.1, false); });
    ART.add('homero', { emoji:['🌡️'], hu:'hőmérő', en:'thermometer', shadow:'hard', tilt:TILT, shapes:[
      pth('glass', 'base', [G.sil]),                                                           // üvegcső (alap)
      det('glass', 'light', G.strip(-90, -50, 3.6, 17.6)),
      det('glass', 'dark', G.strip(45, 90, .3, 17.6)),
      det('glass', 'line', G.strip(72, 90, 4.2, 17), { o:.3 }),
      pth('red', 'base', [Rb.sil], { line:false }), pth('red', 'base', [C.sil], { line:false }),   // folyadék a tartályban és a csőben
      det('red', 'light', Rb.strip(-90, -40)), det('red', 'light', C.strip(-90, -30)),
      det('red', 'dark', Rb.strip(35, 90)),
      dpth('blue', 'dark', ticks),                                                  // beosztás
      shineP(G.strip(-72, -58, 5, 16), .9),
      shineP(circ(...G.on(-45, 2.6), .45 * P.k, 8, .7 * P.k), .9),                            // csillanás a tartályon
    ]});
  }

  // =====================================================================
  //  Elem – zöld ceruzaelem (AA, 1,45 × 5 cm): fém plusz-pólus bütyökkel, fém talp, méz színű sáv villám-jellel
  // =====================================================================
  {
    const TILT = -14, body = [[1.42, .45], [1.45, .6], [1.45, 4.45], [1.4, 4.6]];
    const bot = [[1.3, 0], [1.42, .1], [1.42, .6]], top = [[1.38, 4.55], [1.38, 4.95], [1.1, 5.05]], nub = [[.52, 4.95], [.52, 5.4]];
    const fit = [...body, ...bot, ...top, ...nub].flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]);
    const P = camera({ az:0, el:22, tilt:TILT, span:78, fit });
    const B = lathe(P, body), Bt = lathe(P, bot), Tp = lathe(P, top), N = lathe(P, nub);
    const bolt = B.wrap([[8, 3.85], [-22, 2.5], [-4, 2.5], [-14, 1.05], [20, 2.75], [2, 2.75], [14, 3.85]]);
    ART.add('elem', { emoji:['🔋'], hu:'elem', en:'green battery', shadow:'hard', tilt:TILT, shapes:[
      pth('steel', 'base', [Bt.sil]), det('steel', 'dark', Bt.strip(40, 90)),                 // fém talp
      pth('leaf', 'base', [B.sil]),                                                            // test (alap)
      det('honey', 'base', inset([...B.ring(1.45, 3.3, -90, 90, 10), ...B.ring(1.45, 4.3, 90, -90, 10)], B.sil)),   // méz sáv
      det('leaf', 'light', B.strip(-90, -50)),
      det('leaf', 'dark', B.strip(40, 90)),
      det('leaf', 'line', B.strip(72, 90), { o:.35 }),
      face('honey', 'base', bolt),                                                             // villám-jel
      pth('steel', 'base', [Tp.sil]), det('steel', 'dark', Tp.strip(40, 90)),                 // felső fémsapka
      face('steel', 'light', Tp.full(1.1, 5.05, 24), { line:false }),
      pth('steel', 'base', [N.sil]), face('steel', 'light', N.full(.52, 5.4, 16), { line:false }),   // plusz-pólus bütyök
      shineP(B.strip(-72, -60, .9, 4.2), .8),
    ]});
  }

  // =====================================================================
  //  Villásdugó – európai (Schuko) dugó: kerek fehér test két kerek érintkező tüskével és oldalsó földelő-fülekkel,
  //  hátul törésgátló, rajta sötét kábel
  // =====================================================================
  {
    const TILT = 0, xf = chain(rotZ(-45), rotY(-26));
    const bodyP = [[.62, -4.7], [.72, -3.7], [1.45, -2.5], [1.95, -.7], [2.0, 0]], pinP = [[.25, 0], [.25, 1.85], [.17, 2.0]];
    const pinX = u => chain(([x, y, z]) => [x + u, y, z], xf);
    const cab = [xf([0, -4.6, 0]), xf([0, -5.6, 0]), [-4.6, -4.6, 0], [-5.4, -5.6, .5], [-5.6, -6.8, 1], [-4.9, -7.7, 1.4], [-3.9, -8.1, 1.6]];
    const fit = [...bodyP.flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]).map(xf), xf([1, 2, 0]), xf([-1, 2, 0]), ...cab];
    const P = camera({ az:0, el:10, tilt:TILT, span:80, fit });
    const B = lathe(P, bodyP, xf), p1 = lathe(P, pinP, pinX(-.95)), p2 = lathe(P, pinP, pinX(.95)), cb = pipe(P, cab, .33);
    const clipQ = s => [[-.6, s * 1.3], [.6, s * 1.3], [.6, s * 1.96], [-.6, s * 1.96]].map(([x, z]) => P(xf([x, .06, z])));
    const ribs = [-70, -40, -10, 20].map(a => band([B.on(a, -2.2), B.on(a, -1.0)], .9, false));
    ART.add('dugvilla', { emoji:['🔌'], hu:'villásdugó', en:'electric plug with cable', shadow:'hard', tilt:TILT, shapes:[
      pth('dark', 'base', [cb.sil]), det('dark', 'light', cb.hi),                              // kábel
      pth('white', 'base', [B.sil]),                                                           // dugó-test (alap)
      det('white', 'light', B.strip(-90, -45, -4.6, -.1)),
      det('white', 'dark', B.strip(40, 90, -4.6, -.1)),
      dpth('white', 'dark', ribs),                                                             // recés fogófelület
      face('white', 'light', B.full(2.0, 0, 28)),                                              // homloklap
      pth('steel', 'base', [clipQ(1), clipQ(-1)]),                                            // földelő-fülek
      pth('steel', 'base', [p1.sil]), det('steel', 'dark', p1.strip(30, 90)),                  // érintkező tüskék
      pth('steel', 'base', [p2.sil]), det('steel', 'dark', p2.strip(30, 90)),
      det('steel', 'light', p1.strip(-90, -40, .1, 1.8)), det('steel', 'light', p2.strip(-90, -40, .1, 1.8)),
      shineP(B.strip(-72, -60, -2.4, -.4), .85),
    ]});
  }
})();
