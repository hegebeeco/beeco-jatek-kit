// ============================================================
//  Matricák — iroda, írószer, technika, jelek  ·  stílus: docs/grafika-spec.md
// ============================================================
ART.add('doboz', { emoji:['📦'], hu:'kartondoboz', en:'closed cardboard box', shapes:[
  { t:'poly', m:'cardboard', fc:'none', tone:'light', pts:[[10, 32], [48, 18], [90, 30], [52, 46]] },   // teteje
  { t:'poly', m:'cardboard', fc:'none', tone:'base', pts:[[10, 32], [52, 46], [52, 90], [10, 74]] },    // eleje
  { t:'poly', m:'cardboard', fc:'none', tone:'dark', pts:[[52, 46], [90, 30], [90, 72], [52, 90]] },    // oldala
  { t:'poly', m:'cream', fc:'none', tone:'dark', line:false, d:true, pts:[[26.3, 37.4], [64.3, 21.4], [73.8, 24.6], [35.8, 40.6]] }, // ragasztószalag
  { t:'poly', m:'cream', fc:'none', tone:'dark', line:false, d:true, pts:[[26.3, 37.4], [35.8, 40.6], [35.8, 83.8], [26.3, 80.2]] },
  { t:'line', pts:[[42, 72], [48, 74]], m:'cardboard', w:2 },
]});
ART.add('jegyzettabla', { emoji:['📋'], hu:'jegyzettábla', en:'clipboard with a paper sheet', shapes:[
  { t:'rect', x:16, y:12, w:68, h:80, r:6, m:'wood' },
  { t:'rect', x:24, y:24, w:52, h:60, r:2, m:'paper' },
  { t:'path', m:'steel', fc:'h', p:'M36 22 L38 10 C38 7 41 5 44 5 L56 5 C59 5 62 7 62 10 L64 22 Z' },
  { t:'circle', cx:50, cy:12, r:2.6, m:'dark', fc:'none', tone:'base', line:false, d:true },
  ...[38, 50, 62, 74].map(y => ({ t:'line', pts:[[32, y], [y === 74 ? 56 : 68, y]], m:'paper', tone:'line', o:.4, w:2.5 })),
]});
ART.add('zsirkreta', { emoji:['🖍'], hu:'zsírkréta', en:'red wax crayon', shapes:[
  { t:'poly', m:'red', rot:-40, ox:50, oy:50, pts:[[70, 39], [88, 47], [90, 50], [88, 53], [70, 61]] },       // hegye
  { t:'rect', x:8, y:39, w:66, h:22, r:3, m:'red', fc:'h', rot:-40, ox:50, oy:50 },                        // test
  { t:'rect', x:22, y:37, w:38, h:26, r:2, m:'cream', fc:'h', rot:-40, ox:50, oy:50 },                     // papír
  { t:'line', pts:[[29, 38], [29, 62]], m:'red', tone:'base', w:3, rot:-40, ox:50, oy:50 },
  { t:'line', pts:[[53, 38], [53, 62]], m:'red', tone:'base', w:3, rot:-40, ox:50, oy:50 },
  { t:'line', pts:[[36, 50], [46, 50]], m:'red', tone:'base', w:2.5, rot:-40, ox:50, oy:50 },
]});
ART.add('boritek', { emoji:['✉'], hu:'boríték', en:'closed paper envelope', shapes:[
  { t:'rect', x:8, y:22, w:84, h:58, r:5, m:'cream', fc:'h' },
  { t:'line', pts:[[11, 77], [40, 52]], m:'cream', w:2 }, { t:'line', pts:[[89, 77], [60, 52]], m:'cream', w:2 },
  { t:'poly', m:'cream', fc:'none', tone:'light', pts:[[9, 25], [50, 58], [91, 25]] },   // fül
  { t:'poly', m:'honey', pts:[[50, 48], [58, 52.5], [58, 61.5], [50, 66], [42, 61.5], [42, 52.5]] }, // hatszög-pecsét
]});
ART.add('festopaletta', { emoji:['🎨'], hu:'festőpaletta', en:'painter palette with paint blobs', shapes:[
  { t:'path', m:'wood', p:'M50 12 C76 12 94 28 92 50 C90 68 76 86 54 88 C42 89 36 82 38 74 C40 66 34 62 26 66 C16 70 8 62 8 50 C8 26 26 12 50 12 Z' },
  { t:'circle', cx:30, cy:38, r:8, m:'red' },
  { t:'circle', cx:51, cy:28, r:8, m:'honey' },
  { t:'circle', cx:72, cy:36, r:8, m:'leaf' },
  { t:'circle', cx:77, cy:57, r:8, m:'sky' },
  { t:'circle', cx:60, cy:72, r:7, m:'purple' },
  { t:'ellipse', cx:48, cy:52, rx:6, ry:5, m:'wood', fc:'none', tone:'dark', line:false, d:true },
]});
ART.add('szemetes', { emoji:['🗑'], hu:'szemetes', en:'metal waste bin with lid', shapes:[
  { t:'path', m:'steel', fc:'h', p:'M38 24 V18 C38 14 41 11 45 11 H55 C59 11 62 14 62 18 V24 H56 V19 C56 17.5 55.5 17 54 17 H46 C44.5 17 44 17.5 44 19 V24 Z' },
  { t:'path', m:'steel', fc:'v', p:'M22 32 H78 L72 88 C71.6 91 70 92 67 92 H33 C30 92 28.4 91 28 88 Z' },
  { t:'rect', x:14, y:22, w:72, h:12, r:4, m:'steel', fc:'h' },
  { t:'line', pts:[[37, 42], [39, 82]], m:'steel', tone:'dark', w:3 },
  { t:'line', pts:[[50, 42], [50, 82]], m:'steel', tone:'dark', w:3 },
  { t:'line', pts:[[63, 42], [61, 82]], m:'steel', tone:'dark', w:3 },
]});
ART.add('szemetbedobas', { emoji:['🚮'], hu:'szemét a kukába', en:'crumpled paper falling into a bin', shapes:[
  { t:'path', m:'steel', fc:'v', p:'M22 50 H78 L73 88 C72.6 91 71 92 68 92 H32 C29 92 27.4 91 27 88 Z' },
  { t:'rect', x:16, y:42, w:68, h:11, r:4, m:'steel', fc:'h' },
  { t:'line', pts:[[39, 60], [40, 84]], m:'steel', tone:'dark', w:3 },
  { t:'line', pts:[[61, 60], [60, 84]], m:'steel', tone:'dark', w:3 },
  { t:'poly', m:'paper', pts:[[42, 10], [52, 7], [60, 12], [62, 22], [56, 30], [45, 31], [38, 24], [37, 15]] },  // galacsin
  { t:'line', pts:[[42, 17], [49, 20], [52, 27]], m:'paper', tone:'dark', w:2 }, { t:'line', pts:[[49, 20], [56, 14]], m:'paper', tone:'dark', w:2 },
  { t:'line', pts:[[29, 10], [29, 22]], m:'steel', w:2.5 }, { t:'line', pts:[[71, 10], [71, 22]], m:'steel', w:2.5 },
]});
ART.add('naptar', { emoji:['🗓', '📅'], hu:'naptár', en:'wall calendar with blank grid', shapes:[
  { t:'rect', x:10, y:16, w:80, h:76, r:6, m:'paper', fc:'h' },
  { t:'path', m:'honey', fc:'h', p:'M10 38 V22 C10 18.7 12.7 16 16 16 H84 C87.3 16 90 18.7 90 22 V38 Z' },
  { t:'rect', x:26, y:8, w:8, h:18, r:4, m:'steel', fc:'v' }, { t:'rect', x:66, y:8, w:8, h:18, r:4, m:'steel', fc:'v' },
  ...[46, 61, 76].flatMap((y, r) => [19, 43, 67].map((x, c) => ({ t:'rect', x, y, w:14, h:9, r:2, fc:'none', tone:'base', line:false, d:true,
    m:(r === 1 && c === 1) ? 'leaf' : 'sage' }))),
]});
ART.add('szovegbuborek', { emoji:['💬'], hu:'szövegbuborék', en:'speech bubble', shapes:[
  { t:'path', m:'white', p:'M22 12 H78 C86 12 92 18 92 26 V58 C92 66 86 72 78 72 H46 L24 90 L29 72 H22 C14 72 8 66 8 58 V26 C8 18 14 12 22 12 Z' },
  ...[32, 50, 68].map(x => ({ t:'circle', cx:x, cy:42, r:5.5, m:'leaf', fc:'none', tone:'base', line:false, d:true })),
]});
ART.add('kimeno', { emoji:['📤'], hu:'kimenő tálca', en:'outbox tray with upward arrow', shapes:[
  { t:'poly', m:'sky', fc:'none', tone:'dark', pts:[[14, 54], [86, 54], [92, 64], [8, 64]] },          // tálca belseje
  { t:'rect', x:24, y:44, w:52, h:18, r:1, m:'paper', fc:'none' },                                    // papír
  { t:'poly', m:'leaf', pts:[[50, 6], [72, 30], [59, 30], [59, 56], [41, 56], [41, 30], [28, 30]] },  // nyíl
  { t:'path', m:'sky', fc:'h', p:'M8 62 H92 L86 89 C85.5 91 84 92 82 92 H18 C16 92 14.5 91 14 89 Z' },
  { t:'line', pts:[[36, 76], [64, 76]], m:'sky', w:3 },
]});
ART.add('nagyito', { emoji:['🔍', '🔎'], hu:'nagyító', en:'magnifying glass', shapes:[
  { t:'rect', x:54, y:66, w:38, h:14, r:7, m:'dark', fc:'h', rot:45, ox:73, oy:73 },
  { t:'circle', cx:40, cy:40, r:30, m:'honey' },
  { t:'circle', cx:40, cy:40, r:21, m:'sky' },
  { t:'shine', cx:31, cy:31, rx:4.5, ry:9, rot:45, ox:50, oy:50 },
]});
ART.add('mikroszkop', { emoji:['🔬'], hu:'mikroszkóp', en:'laboratory microscope', shapes:[
  { t:'path', m:'teal', fc:'v', p:'M60 82 L60 62 C60 52 55 46 46 42 L50 29 C66 33 76 46 76 60 L76 82 Z' },   // kar
  { t:'rect', x:20, y:80, w:64, h:12, r:5, m:'teal', fc:'h' },                                        // talp
  { t:'rect', x:34, y:64, w:44, h:6, r:2, m:'dark', fc:'h' },                                         // tárgyasztal
  { t:'rect', x:37, y:56, w:10, h:10, r:2, m:'dark', rot:-30, ox:42, oy:36 },                         // objektív
  { t:'rect', x:35, y:11, w:14, h:48, r:3, m:'steel', fc:'v', rot:-30, ox:42, oy:36 },                // tubus
  { t:'rect', x:33, y:9, w:18, h:10, r:3, m:'dark', fc:'h', rot:-30, ox:42, oy:36 },                  // okulár
  { t:'circle', cx:68, cy:58, r:5, m:'dark', fc:'none', tone:'base' },                                // élességállító
]});
ART.add('konyvek', { emoji:['📚'], hu:'könyvek', en:'stack of books', shapes:[
  { t:'rect', x:8, y:68, w:84, h:22, r:3, m:'leaf', fc:'h' },
  { t:'rect', x:20, y:71.5, w:70, h:15, r:1, m:'paper', fc:'none' },
  { t:'rect', x:14, y:45, w:74, h:22, r:3, m:'red', fc:'h' },
  { t:'rect', x:16, y:48.5, w:60, h:15, r:1, m:'paper', fc:'none' },
  { t:'rect', x:12, y:22, w:76, h:22, r:3, m:'honey', fc:'h', rot:-5, ox:50, oy:33 },
  { t:'rect', x:24, y:25.5, w:62, h:15, r:1, m:'paper', fc:'none', rot:-5, ox:50, oy:33 },
  ...[76.5, 81.5].map(y => ({ t:'line', pts:[[24, y], [88, y]], m:'paper', tone:'dark', w:1.5 })),
  ...[53.5, 58.5].map(y => ({ t:'line', pts:[[18, y], [74, y]], m:'paper', tone:'dark', w:1.5 })),
  ...[30.5, 35.5].map(y => ({ t:'line', pts:[[28, y], [84, y]], m:'paper', tone:'dark', w:1.5, rot:-5, ox:50, oy:33 })),
]});
ART.add('toltotoll', { emoji:['🖋'], hu:'töltőtoll', en:'fountain pen', shapes:[
  { t:'path', m:'gold', rot:40, ox:50, oy:50, p:'M43 64 H57 V72 L50 92 L43 72 Z' },                      // penna
  { t:'rect', x:44, y:56, w:12, h:12, r:2, m:'dark', fc:'v', rot:40, ox:50, oy:50 },
  { t:'rect', x:41, y:8, w:18, h:52, r:8, m:'blue', fc:'v', rot:40, ox:50, oy:50 },                    // test
  { t:'rect', x:40, y:46, w:20, h:7, r:2, m:'gold', fc:'v', rot:40, ox:50, oy:50 },                     // gyűrű
  { t:'rect', x:55, y:14, w:5, h:28, r:2.5, m:'gold', fc:'none', tone:'base', rot:40, ox:50, oy:50 },   // klip
  { t:'line', pts:[[50, 76], [50, 88]], m:'gold', w:1.8, rot:40, ox:50, oy:50 },
  { t:'shine', x:45, y:14, w:3.5, h:26, rot:40, ox:50, oy:50 },
]});
ART.add('nyomtato', { emoji:['🖨'], hu:'nyomtató', en:'desktop printer printing a page', shapes:[
  { t:'rect', x:28, y:8, w:44, h:30, r:1, m:'paper', fc:'none' },
  { t:'rect', x:8, y:30, w:84, h:44, r:7, m:'steel', fc:'h' },
  { t:'rect', x:18, y:58, w:64, h:7, r:3.5, m:'dark', fc:'none', tone:'base' },
  { t:'rect', x:26, y:62, w:48, h:30, r:1, m:'paper', fc:'none' },
  { t:'line', pts:[[34, 72], [66, 72]], m:'paper', tone:'line', o:.4, w:2.5 },
  { t:'line', pts:[[34, 80], [58, 80]], m:'paper', tone:'line', o:.4, w:2.5 },
  { t:'circle', cx:78, cy:43, r:4, m:'leaf', fc:'none', tone:'base', d:true },
]});
ART.add('laptop', { emoji:['💻'], hu:'laptop', en:'open laptop computer', shapes:[
  { t:'rect', x:14, y:14, w:72, h:52, r:5, m:'dark' },
  { t:'rect', x:20, y:20, w:60, h:40, r:2, m:'sky' },
  { t:'path', m:'steel', fc:'h', p:'M14 66 H86 L94 80 C94.6 82 93.4 84 91 84 H9 C6.6 84 5.4 82 6 80 Z' },
  { t:'rect', x:40, y:74, w:20, h:5, r:2.5, m:'steel', fc:'none', tone:'dark', line:false, d:true },
  { t:'shine', x:26, y:26, w:22, h:5, rot:-10, ox:50, oy:50 },
]});
ART.add('telefonkagylo', { emoji:['📞'], hu:'telefonkagyló', en:'retro telephone handset', shapes:[
  { t:'path', m:'red', fc:'h', rot:-30, ox:50, oy:50, p:'M16.7 55.7 C22.9 26.6 77 26.6 83.4 55.7 L71.8 55.7 C66.6 41.2 33.4 41.2 28.2 55.7 Z' }, // fogantyú
  { t:'rect', x:8.4, y:51.6, w:27, h:14.6, r:6, m:'red', fc:'h', rot:-30, ox:50, oy:50 },                                       // hallgató
  { t:'rect', x:64.6, y:51.6, w:27, h:14.6, r:6, m:'red', fc:'h', rot:-30, ox:50, oy:50 },                                      // beszélő
  { t:'shine', x:40, y:35.5, w:20, h:3.5, rot:-30, ox:50, oy:50 },
]});
ART.add('jatekvezerlo', { emoji:['🎮'], hu:'játékvezérlő', en:'video game controller', shapes:[
  { t:'path', m:'steel', p:'M29 24 H71 C82 24 89 34 91 48 L93 64 C94 73 88 79 81 75 L69 64 H31 L19 75 C12 79 6 73 7 64 L9 48 C11 34 18 24 29 24 Z' },
  { t:'poly', m:'dark', fc:'none', tone:'base', pts:[[26.5, 34], [33.5, 34], [33.5, 40.5], [40, 40.5], [40, 47.5], [33.5, 47.5], [33.5, 54], [26.5, 54], [26.5, 47.5], [20, 47.5], [20, 40.5], [26.5, 40.5]] },
  { t:'circle', cx:70, cy:35.5, r:4.5, m:'honey', fc:'none', tone:'base' },
  { t:'circle', cx:79, cy:44, r:4.5, m:'red', fc:'none', tone:'base' },
  { t:'circle', cx:70, cy:52.5, r:4.5, m:'leaf', fc:'none', tone:'base' },
  { t:'circle', cx:61, cy:44, r:4.5, m:'blue', fc:'none', tone:'base' },
]});
ART.add('hangszoro', { emoji:['🔊'], hu:'hangszóró', en:'loudspeaker with sound waves', shapes:[
  { t:'rect', x:8, y:36, w:18, h:28, r:3, m:'dark', fc:'h' },
  { t:'poly', m:'steel', pts:[[22, 38], [46, 18], [46, 82], [22, 62]] },
  { t:'path', m:'honey', p:'M55.2 40.8 A13 13 0 0 1 55.2 59.2 L51.7 55.7 A8 8 0 0 0 51.7 44.3 Z', box:[51.7, 40.8, 7.3, 18.4] },
  { t:'path', m:'honey', p:'M65.1 30.9 A27 27 0 0 1 65.1 69.1 L60.8 64.8 A21 21 0 0 0 60.8 35.2 Z', box:[60.8, 30.9, 12.2, 38.2] },
  { t:'path', m:'honey', p:'M75 25 A41 41 0 0 1 75 75 L70.7 70.7 A35 35 0 0 0 70.7 29.3 Z', box:[70.7, 21, 16.3, 58] },
]});
ART.add('fejhallgato', { emoji:['🎧'], hu:'fejhallgató', en:'over-ear headphones', shapes:[
  { t:'path', m:'dark', fc:'h', p:'M12 55 A38 38 0 0 1 88 55 L80 55 A30 30 0 0 0 20 55 Z', box:[12, 17, 76, 38] },
  { t:'rect', x:8, y:47, w:22, h:36, r:9, m:'teal' },
  { t:'rect', x:70, y:47, w:22, h:36, r:9, m:'teal' },
  { t:'rect', x:26, y:51, w:8, h:28, r:4, m:'dark', fc:'v' },
  { t:'rect', x:66, y:51, w:8, h:28, r:4, m:'dark', fc:'v' },
]});

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
  //  Füzet – keményfedeles jegyzetfüzet (15 × 21 cm): zöld borító címkével, fekete gumipánt, lapok éle krém, piros könyvjelző-szalag
  // =====================================================================
  {
    const TILT = -12, X = 7.5, H = 21, D = .95;
    const fit = []; for(const x of [-X, X]) for(const y of [-2.8, H]) for(const z of [-D, D]) fit.push([x, y, z]);
    const P = camera({ az:30, el:14, F:120, tilt:TILT, span:80, fit });
    const pages = box(P, -X + .3, X - .25, .3, H - .3, -.7, .7), cov = box(P, -X, X, 0, H, .7, D), back = box(P, -X, X, 0, H, -D, -.7);
    const F = ([u, v], dz = 0) => P([u, v, D + dz]);
    const leaves = [.2, .4, .6, .8].map(t => { const z = .7 - 1.4 * t; return band([P([X - .25, .6, z]), P([X - .25, H - .6, z])], .45, false); });
    ART.add('fuzet', { emoji:['📒', '📓', '📔'], hu:'füzet', en:'hardcover notebook', shadow:'hard', tilt:TILT, shapes:[
      face('leaf', 'dark', back.right),                                                        // hátsó borító éle
      face('cream', 'base', pages.right), face('cream', 'light', pages.top),                   // lapok éle
      dpth('cream', 'dark', leaves),                                                           // lapok rétegei
      face('leaf', 'dark', cov.right), face('leaf', 'light', cov.top),                         // borító vastagsága
      face('leaf', 'base', cov.front),                                                         // borító (alap)
      det('leaf', 'light', [F([-X, H]), F([2, H]), F([-X, 8])]),                               // fénylap
      det('leaf', 'line', [F([-X, 0]), F([-X + 1.2, 0]), F([-X + 1.2, H]), F([-X, H])], { o:.35 }),   // gerinc-horony
      face('cream', 'light', [[-3.6, 13], [3.2, 13], [3.2, 17], [-3.6, 17]].map(p => F(p, .02))),   // címke
      dpth('steel', 'base', [[-2.6, 15.6, 2.2], [-2.6, 14, 1.2]].map(([u, v, w]) => band([F([u, v], .03), F([u + 3.6 + w, v], .03)], 1, false))),
      face('dark', 'base', [F([4.6, 0], .06), F([5.6, 0], .06), F([5.6, H], .06), F([4.6, H], .06)]),   // gumipánt elöl
      face('dark', 'dark', [F([4.6, H], .06), F([5.6, H], .06), P([5.6, H + .06, -D]), P([4.6, H + .06, -D])]),   // gumipánt a tetején
      face('red', 'base', [P([-3.2, .4, .3]), P([-2.1, .4, .3]), P([-2.1, -2.8, .3]), P([-2.65, -2.1, .3]), P([-3.2, -2.8, .3])]),   // könyvjelző-szalag
      shineP([F([-5.5, 18.5]), F([-4.8, 18.5]), F([-4.8, 4]), F([-5.5, 4])], .45),
    ]});
  }

  // =====================================================================
  //  Kódzár – falra szerelt fém billentyűzet (8 × 12 × 2,2 cm): üres, fekete kijelző, zöld jelzőfény, 3 × 4 kerek, felirat nélküli gomb
  // =====================================================================
  {
    const TILT = -10, X = 4, H = 12, Z = 1.1;
    const fit = []; for(const x of [-X, X]) for(const y of [0, H]) for(const z of [-Z, Z]) fit.push([x, y, z]);
    const P = camera({ az:26, el:14, F:60, tilt:TILT, span:78, fit });
    const b = box(P, -X, X, 0, H, -Z, Z), F = ([u, v], dz = 0) => P([u, v, Z + dz]);
    const keys = []; for(let r = 0; r < 4; r++) for(let c = 0; c < 3; c++) keys.push([(c - 1) * 2.2, 1.7 + r * 1.95]);
    const key = ([u, v], dz, dx = 0, dy = 0) => circ(u + dx, v + dy, .72, 12).map(p => F(p, dz));
    ART.add('kodzar', { emoji:['🔢'], hu:'kódzár', en:'door keypad code lock with blank round buttons', shadow:'hard', tilt:TILT, shapes:[
      face('steel', 'dark', b.right), face('steel', 'light', b.top),                         // ház oldala, teteje
      face('steel', 'base', b.front),                                                          // előlap (alap)
      det('steel', 'light', [F([-X, H]), F([0, H]), F([-X, 6])]),                              // fénylap
      face('dark', 'base', [[-3.3, .7], [3.3, .7], [3.3, 9.3], [-3.3, 9.3]].map(p => F(p, .02))),   // billentyű-mező
      face('dark', 'dark', [[-2.8, 10], [1.4, 10], [1.4, 11.3], [-2.8, 11.3]].map(p => F(p, .02))),   // üres kijelző
      det('dark', 'light', [[-2.6, 10.9], [-1.2, 10.9], [-1.6, 11.15], [-2.6, 11.15]].map(p => F(p, .03)), { o:.8 }),
      face('leaf', 'light', circ(2.5, 10.65, .45, 10).map(p => F(p, .03))),                    // jelzőfény
      dpth('steel', 'dark', keys.map(k => key(k, .05, .12, -.14))),                            // gombok oldala
      pth('steel', 'light', keys.map(k => key(k, .3))),                                        // gombok
      dpth('paper', 'light', keys.map(([u, v]) => circ(u - .25, v + .25, .22, 6).map(p => F(p, .31))), { o:.8 }),   // gomb-csillanás
      shineP([F([-3.7, 11.7]), F([-3.3, 11.7]), F([-3.3, .5]), F([-3.7, .5])], .6),
    ]});
  }

  // =====================================================================
  //  Számla – közüzemi számla-lap (A4): szamárfül, zöld fejléc méhsejt-jellel, sorok és oszlopok (betű helyett vonalak),
  //  fogyasztási oszlopdiagram, kiemelt végösszeg-mező, vonalkód
  // =====================================================================
  {
    const TILT = -8, X = 10.5, H = 29.7, E = 3.2;
    const P = camera({ az:16, el:8, F:120, tilt:TILT, span:80, fit:[[-X, 0, 0], [X, 0, 0], [X, H, 0], [-X, H, 0]] });
    const F = ([u, v], dz = 0) => P([u, v, dz]), Q = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(p => F(p, .02));
    const sheet = [[-X, 0], [X, 0], [X, H - E], [X - E, H], [-X, H]].map(p => F(p));
    const hex = circ(-7.6, 26.4, 1.25, 6, 1.25, 30).map(p => F(p, .03));
    const rowsL = [20.6, 18.8, 17, 15.2].map(v => Q(-8.5, -.5, v, v + .55)), rowsR = [20.6, 18.8, 17, 15.2].map((v, i) => Q(4.2 + (i % 2) * 1.2, 8.5, v, v + .55));
    const bars = [[-8.5, 5.4], [-6.7, 7.2], [-4.9, 4.4], [-3.1, 8.6]].map(([u, h]) => Q(u, u + 1.3, 5, 5 + h));
    const code = [0, .5, .8, 1.5, 1.8, 2.6, 2.9, 3.3, 4.1, 4.4, 5.2, 5.5, 6.1].map((u, i) => Q(-8.5 + u, -8.5 + u + (i % 3 ? .22 : .38), 1.4, 3.4));
    ART.add('szamla', { emoji:['🧾'], hu:'számla', en:'paper receipt', shadow:'hard', tilt:TILT, shapes:[
      face('white', 'base', sheet),                                                            // lap (alap)
      det('white', 'light', inset([[-X, H], [2, H], [-X, 13]].map(p => F(p)), sheet)),        // fénylap
      det('white', 'dark', inset([[X, 0], [X, 12], [0, 0]].map(p => F(p)), sheet), { o:.8 }),   // árnyékos sarok
      face('leaf', 'base', Q(-5.8, 1.5, 25.6, 27.4)),                                          // fejléc-sáv
      face('honey', 'base', hex),                                                              // méhsejt-jel
      dpth('steel', 'base', [Q(-5.8, -1, 23.8, 24.4)]),
      dpth('steel', 'base', rowsL), dpth('steel', 'dark', rowsR),                             // tételsorok
      lineP('steel', 'base', [F([-8.5, 14.2]), F([8.5, 14.2])], .9),
      pth('sky', 'base', bars),                                                                // fogyasztási diagram
      face('honey', 'light', Q(1, 8.6, 6.4, 11)),                                              // végösszeg-mező
      face('honey', 'dark', Q(2.4, 7.2, 8, 9.4), { line:false }),
      dpth('dark', 'base', code),                                                              // vonalkód
      face('white', 'dark', [[X - E, H], [X - E, H - E], [X, H - E]].map(p => F(p, .05))),    // szamárfül
    ]});
  }
  // =====================================================================
  //  B szintű tartalom-ikonok a „2075 – Vágod a zöld jövőt?" játékhoz (okostelefon, kémcső, csavarkulcs, szerszámosláda)
  //  A rajz nem árulja el, hogy a dolog káros vagy ökos; szöveg, szám, márka nélkül.
  // =====================================================================
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const quad = q => ([s, t]) => lerp(lerp(q[0], q[1], s), lerp(q[3], q[2], s), t);            // bilineáris térkép egy vetített négyszögre
  const sarea = p => area(p), pos = p => sarea(p) >= 0 ? p : [...p].reverse(), neg = p => sarea(p) < 0 ? p : [...p].reverse();
  const rrect = (u0, v0, u1, v1, r, map = p => p, n = 3) => [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]]
    .flatMap(([cu, cv, a0]) => Array.from({ length:n + 1 }, (_, i) => map([cu + r * cos(a0 + 90 * i / n), cv + r * sin(a0 + 90 * i / n)])));

  // ---- Okostelefon – álló, elfordított telefon lezárt képernyővel (hullámos háttérkép, betű és szám nélkül),
  //      kamerakivágás, oldalgombok, hátlapi kameradudor. (7,2 × 14,6 × 0,84 cm)
  {
    const TILT = -18, X = 3.6, Y1 = 14.6, Z = .42, BZ = -Z - .38;
    const fit = []; for(const x of [-X, X]) for(const y of [0, Y1]) for(const z of [BZ, Z]) fit.push([x, y, z]);
    const P = camera({ az:30, el:12, F:150, tilt:TILT, span:80, fit });
    const b = box(P, -X, X, 0, Y1, -Z, Z), F = (u, v) => P([u, v, Z]), k = P.k;
    const scr = rrect(-3.12, .5, 3.12, Y1 - .5, .85, ([u, v]) => F(u, v), 3);
    const wave = (v0, a, ph) => clip([...Array.from({ length:13 }, (_, i) => { const u = -3.3 + 6.6 * i / 12; return F(u, v0 + a * Math.sin(i / 12 * 2 * Math.PI + ph)); }), F(3.3, 0), F(-3.3, 0)], scr);
    const side = (y0, y1) => [P([X, y0, -Z + .06]), P([X, y0, Z - .14]), P([X, y1, Z - .14]), P([X, y1, -Z + .06])];
    ART.add('okostelefon', { emoji:['📱'], hu:'okostelefon', en:'generic smartphone', look:'dark smartphone standing tilted in three-quarter view, lock screen with a wavy abstract wallpaper and a sun disc, camera notch, side buttons, camera bump on the back', shadow:'hard', tilt:TILT, shapes:[
      face('steel', 'dark', [P([.9, Y1 - 1.1, BZ]), P([X, Y1 - 1.1, BZ]), P([X, Y1 - 4.6, BZ]), P([.9, Y1 - 4.6, BZ])]),   // kameradudor
      face('dark', 'dark', b.right), face('dark', 'base', b.front), face('dark', 'light', b.top),   // váz
      det('dark', 'line', inset([P([X, 0, -Z]), P([X, 0, -Z + .5]), P([X, Y1, -Z + .5]), P([X, Y1, -Z])], b.sil, .5), { o:.5 }),
      det('sky', 'base', scr),                                                                  // képernyő
      det('honey', 'light', circ(...F(1.2, 10.2), 1.25 * k, 14)),                                // napkorong
      det('blue', 'base', wave(6.4, .6, 0)),                                                    // hullámos háttérkép
      det('purple', 'base', wave(4.2, .5, 2)),
      det('blue', 'dark', wave(2.2, .45, 4)),
      det('dark', 'line', rrect(-.9, Y1 - 1.9, .9, Y1 - 1.25, .32, ([u, v]) => F(u, v), 3)),        // kamerakivágás
      det('white', 'light', rrect(-1.2, 1.0, 1.2, 1.3, .15, ([u, v]) => F(u, v), 2), { o:.8 }),     // kezdőlap-csík
      dpth('steel', 'base', [side(9.4, 11.3), side(6.8, 8.7)]),                                // oldalgombok
      shineP([F(-2.9, 4.4), F(-1.6, 4.4), F(.6, Y1 - 1.0), F(-.7, Y1 - 1.0)], .3),
    ]});
  }

  // ---- Kémcső – megdöntött üveg kémcső parafadugóval, lila folyadékkal, buborékokkal. (átm. 2,4 cm, 11 cm – vaskosítva)
  {
    const TILT = 22, R = 1.25;
    const prof = [[.05, 0], [.7, .18], [1.05, .55], [R, 1.3], [R, 8.9], [R + .2, 9.0], [R + .2, 9.4]];
    const liq = [[.05, .12], [.62, .28], [.95, .6], [R - .12, 1.3], [R - .12, 5.2]];
    const fit = []; for(const a of [0, 90, 180, 270]) fit.push([R * sin(a) * 1.3, 0, R * cos(a) * 1.3], [R * sin(a) * 1.3, 11, R * cos(a) * 1.3]);
    const P = camera({ az:0, el:18, F:60, tilt:TILT, span:80, fit });
    const G = lathe(P, prof), Lq = lathe(P, liq), C = lathe(P, [[R - .15, 8.4], [R + .05, 10.9], [R - .1, 11]]), k = P.k;
    const bub = [[-20, 2.2, .3], [25, 3.3, .22], [-5, 4.3, .26], [40, 1.6, .18]].map(([a, y, r]) => circ(...Lq.on(a, y, -.3), r * k, 8));
    ART.add('kemcso', { emoji:['🧪'], hu:'kémcső', en:'glass test tube with liquid', look:'tilted glass test tube with a cork stopper, half filled with purple liquid with bubbles and a bright meniscus', shadow:'hard', tilt:TILT, shapes:[
      face('glass', 'base', G.sil),                                                             // üveg
      det('glass', 'dark', G.strip(40, 90, .3, 9.3), { o:.8 }),
      face('purple', 'base', Lq.sil, { line:false }),                                           // folyadék
      det('purple', 'dark', Lq.strip(30, 90, .2, 5.2)),
      det('purple', 'light', Lq.strip(-90, -40, .6, 5.2), { o:.9 }),
      det('purple', 'light', Lq.full(R - .12, 5.2, 18)),                                       // folyadékszint
      det('pink', 'light', Lq.full(R - .45, 5.25, 14), { o:.6 }),
      dpth('purple', 'light', bub),                                                              // buborékok
      det('glass', 'light', G.full(R + .2, 9.4, 18)),                                           // perem
      face('cardboard', 'base', C.sil),                                                          // parafadugó
      det('cardboard', 'light', C.strip(-90, -40, 8.8, 10.9)),
      det('cardboard', 'dark', C.strip(40, 90, 8.8, 10.9)),
      det('cardboard', 'light', C.full(R - .1, 11, 16)),
      shineP(G.strip(-72, -58, 1.4, 8.6), .75),
    ]});
  }

  // ---- Csavarkulcs – villás-csillag kombinált kulcs a földön fekve, felülről 3/4-ben: vastag acél lap,
  //      az egyik végén nyitott villa, a másikon 12 szögű csillaglyuk, a nyélen bemélyedés. (hossz 20 cm)
  {
    const TILT = -34, T = .5, JX = 4.2, JR = 1.75, RX = -4.2, RR = 1.55, HW = .7;   // villa és csillagfej közepe, sugara; a nyél fél szélessége
    const ja = [150, 132, 112, 92, 72, 52, 36, 30].map(a => [JX + JR * cos(a), JR * sin(a)]);
    const jb = [-30, -36, -52, -72, -92, -112, -132, -150].map(a => [JX + JR * cos(a), JR * sin(a)]);
    const ring = Array.from({ length:11 }, (_, i) => { const a = -28 - 304 * i / 10; return [RX + RR * cos(a), RR * sin(a)]; });
    const out = [[RX + 1.2, HW], [JX - 1.4, HW], ...ja, [JX + .7, .62], [JX - .1, .62], [JX - .1, -.62], [JX + .7, -.62], ...jb, [JX - 1.4, -HW], [RX + 1.2, -HW], ...ring.slice(1, -1)];
    const hole = Array.from({ length:24 }, (_, i) => { const a = 15 * i, r = i % 2 ? .68 : .85; return [RX + r * cos(a), r * sin(a)]; });
    const arcP = (cx, r, a0, a1, n = 4) => Array.from({ length:n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + r * cos(a), r * sin(a)]; });
    const fit = [[RX - RR, 0, RR], [RX - RR, 0, -RR], [JX + JR, 0, JR], [JX + JR, 0, -JR], [0, T, 0]];
    const P = camera({ az:18, el:48, F:60, tilt:TILT, span:84, fit });
    const at = y => ([u, v]) => P([u, y, -v]), top = at(T), bot = at(0), k = P.k;
    ART.add('csavarkulcs', { emoji:['🔧'], hu:'csavarkulcs', en:'steel wrench', look:'steel combination wrench lying flat, seen from above in three-quarter view: open jaw at one end, twelve-point ring at the other, recessed handle', shadow:'hard', tilt:TILT, shapes:[
      pth('steel', 'dark', [pos(out.map(bot))]),                                                // az alsó él (vastagság)
      pth('steel', 'base', [pos(out.map(top)), neg(hole.map(top))]),                            // felső lap, csillaglyukkal
      det('steel', 'dark', [[RX + 1.5, .2], [JX - 1.7, .24], [JX - 1.7, -.24], [RX + 1.5, -.2]].map(top)),     // bemélyedés a nyélen
      det('steel', 'light', [[RX + 1.4, .62], [JX - 1.5, .62], [JX - 1.6, .32], [RX + 1.5, .28]].map(top)),
      det('steel', 'light', [...Array.from({ length:6 }, (_, i) => { const a = 100 + 16 * i; return [JX + (JR - .12) * cos(a), (JR - .12) * sin(a)]; }), [JX + 1.0 * cos(160), 1.0 * sin(160)], [JX + 1.0 * cos(110), 1.0 * sin(110)]].map(top), { o:.9 }),
      det('steel', 'light', [...Array.from({ length:6 }, (_, i) => { const a = 100 + 22 * i; return [RX + (RR - .12) * cos(a), (RR - .12) * sin(a)]; }), ...Array.from({ length:6 }, (_, i) => { const a = 210 - 22 * i; return [RX + 1.0 * cos(a), 1.0 * sin(a)]; })].map(top), { o:.9 }),
      det('steel', 'line', hole.slice(3, 14).map(bot).concat(hole.slice(3, 14).reverse().map(top)), { o:.5 }),   // a lyuk belső fala
      det('steel', 'line', [[JX - .1, .62], [JX + .7, .62], [JX + .7, .5], [JX - .05, .5]].map(bot), { o:.5 }),
      shineP([[RX + 1.7, .5], [JX - 1.9, .52], [JX - 1.9, .4], [RX + 1.7, .38]].map(top), .8),
      shineP([...arcP(RX, 1.3, 150, 210), ...arcP(RX, 1.12, 210, 150)].map(top), .7),                // fénycsík a csillagfejen
    ]});
  }

  // ---- Szerszámosláda – piros fém szerszámosláda 3/4-ben: ferde élű fedél, fém fogantyú, két csat,
  //      oldalsó fül, alsó sötét perem. (45 × 22 × 21 cm)
  {
    const TILT = -12, X = 2.25, H = 1.5, Z = 1.05, LT = 2.15;
    const fit = []; for(const x of [-X, X]) for(const y of [0, 2.75]) for(const z of [-Z, Z]) fit.push([x, y, z]);
    const P = camera({ az:26, el:18, F:30, tilt:TILT, span:80, fit });
    const b = box(P, -X, X, 0, H, -Z, Z), k = P.k, c = (x, y, z) => P([x, y, z]);
    const lidF = [c(-X - .05, H, Z + .05), c(X + .05, H, Z + .05), c(X - .15, LT, Z - .2), c(-X + .15, LT, Z - .2)];
    const lidR = [c(X + .05, H, Z + .05), c(X + .05, H, -Z - .05), c(X - .15, LT, -Z + .2), c(X - .15, LT, Z - .2)];
    const lidT = [c(-X + .15, LT, Z - .2), c(X - .15, LT, Z - .2), c(X - .15, LT, -Z + .2), c(-X + .15, LT, -Z + .2)];
    const fq = quad(b.front), latch = u => rrect(u - .22, 1.12, u + .22, 1.78, .06, ([x, y]) => c(x, y, Z + .06), 1);
    ART.add('szerszamoslada', { emoji:['🧰'], hu:'szerszámosláda', en:'red metal toolbox', look:'red metal toolbox in three-quarter view with a bevelled lid, a steel carrying handle, two latches, a side grip and a dark base rim', shadow:'hard', tilt:TILT, shapes:[
      face('steel', 'base', band([c(-1.2, LT, 0), c(-1.0, 2.7, 0), c(1.0, 2.7, 0), c(1.2, LT, 0)], .16 * k)),   // fogantyú
      det('steel', 'light', band([c(-.95, 2.73, .02), c(.95, 2.73, .02)], .05 * k), { o:.9 }),
      face('red', 'dark', b.right), face('red', 'base', b.front),                                // láda
      det('red', 'light', inset([fq([0, .02]), fq([.55, .02]), fq([.2, .98]), fq([0, .98])], b.sil), { o:.8 }),
      det('dark', 'base', inset([fq([0, 0]), fq([1, 0]), fq([1, .12]), fq([0, .12])], b.sil)),        // alsó perem
      det('red', 'line', inset([c(X, 0, -Z), c(X, 0, -Z + .25), c(X, H, -Z + .25), c(X, H, -Z)], b.sil, .5), { o:.5 }),
      face('red', 'dark', lidR), face('red', 'base', lidF), face('red', 'light', lidT),          // fedél
      dpth('steel', 'base', [latch(-1.3), latch(1.3)]),                                          // csatok
      dpth('dark', 'base', [-1.3, 1.3].map(u => rrect(u - .1, 1.3, u + .1, 1.45, .03, ([x, y]) => c(x, y, Z + .07), 1))),
      face('dark', 'base', rrect(-.35, .95, .35, 1.2, .08, ([z, y]) => c(X + .02, y, -z), 1)),     // oldalsó fül
      shineP([c(-X + .25, H + .08, Z + .02), c(-X + 1.3, H + .08, Z + .02), c(-X + 1.2, LT - .12, Z - .15), c(-X + .35, LT - .12, Z - .15)], .4),
    ]});
  }
})();
