// ============================================================
//  Matricák — otthon: készülékek, szerelvények, eszközök, bútorok  ·  stílus: docs/grafika-spec.md
// ============================================================
ART.add('jegkocka', { emoji:['🧊'], hu:'jégkocka', en:'ice cube', shapes:[
  { t:'poly', m:'sky', fc:'none', tone:'light', pts:[[18, 30], [52, 14], [86, 30], [52, 46]] },
  { t:'poly', m:'sky', fc:'none', tone:'base', pts:[[18, 30], [52, 46], [52, 90], [18, 72]] },
  { t:'poly', m:'sky', fc:'none', tone:'dark', pts:[[52, 46], [86, 30], [86, 72], [52, 90]] },
  { t:'shine', x:26, y:44, w:5, h:20, rot:-12, ox:50, oy:50 },
]});

// ---- fürdő, konyha, szerelvények ----
ART.add('teritek', { emoji:['🍽'], hu:'teríték', en:'plate with fork and knife', shapes:[
  { t:'circle', cx:50, cy:50, r:27, m:'white' },
  { t:'circle', cx:50, cy:50, r:17, m:'white', fc:'none', tone:'light' },
  { t:'path', m:'steel', p:'M9 10 H11.5 V26 H14 V10 H16.5 V26 H19 V10 H21.5 V32 C21.5 38 19 41 15.2 41 C11.5 41 9 38 9 32 Z', fc:'none', tone:'base' },
  { t:'rect', x:12.5, y:38, w:6, h:52, r:3, m:'steel', fc:'v' },
  { t:'path', m:'steel', p:'M82 10 C88 12 91 24 91 46 H82 Z', fc:'v' },
  { t:'rect', x:81.5, y:44, w:9, h:46, r:3, m:'wood', fc:'v' },
  { t:'shine', cx:40, cy:36, rx:7, ry:3, rot:-35, ox:50, oy:50 },
]});

// ---- idő, ház, zár ----
ART.add('idozito', { emoji:['⏲'], hu:'időzítő', en:'round kitchen timer', shapes:[
  { t:'rect', x:20, y:78, w:14, h:12, r:3, m:'dark', fc:'none', tone:'base' },
  { t:'rect', x:66, y:78, w:14, h:12, r:3, m:'dark', fc:'none', tone:'base' },
  { t:'rect', x:42, y:8, w:16, h:12, r:3, m:'dark', fc:'v' },
  { t:'circle', cx:50, cy:52, r:38, m:'orange' },
  { t:'circle', cx:50, cy:53, r:27, m:'cream' },
  { t:'path', m:'honey', fc:'none', tone:'base', line:false, d:true, box:[50, 31, 22, 34], p:'M50 53 L50 31 A22 22 0 0 1 69 64 Z' },
  { t:'line', pts:[[50, 29], [50, 34]], m:'dark', w:2.5 }, { t:'line', pts:[[74, 53], [69, 53]], m:'dark', w:2.5 },
  { t:'line', pts:[[50, 77], [50, 72]], m:'dark', w:2.5 }, { t:'line', pts:[[26, 53], [31, 53]], m:'dark', w:2.5 },
  { t:'line', pts:[[50, 53], [67, 63]], m:'dark', w:3 },
  { t:'circle', cx:50, cy:53, r:4, m:'dark', fc:'none', tone:'base', line:false, d:true },
  { t:'shine', cx:28, cy:32, rx:4, ry:9, rot:40, ox:50, oy:50 },
]});
ART.add('stopper', { emoji:['⏱'], hu:'stopperóra', en:'stopwatch', shapes:[
  { t:'rect', x:37, y:8, w:26, h:9, r:4, m:'steel', fc:'h' },
  { t:'rect', x:45, y:15, w:10, h:10, m:'steel', fc:'v' },
  { t:'rect', x:73, y:22, w:12, h:8, r:2, m:'steel', fc:'h', rot:45 },
  { t:'circle', cx:50, cy:57, r:34, m:'teal' },
  { t:'circle', cx:50, cy:57, r:25, m:'white' },
  { t:'line', pts:[[50, 35], [50, 40]], m:'dark', w:2.5 }, { t:'line', pts:[[72, 57], [67, 57]], m:'dark', w:2.5 },
  { t:'line', pts:[[50, 79], [50, 74]], m:'dark', w:2.5 }, { t:'line', pts:[[28, 57], [33, 57]], m:'dark', w:2.5 },
  { t:'line', pts:[[50, 57], [60, 40]], m:'red', tone:'base', w:3 },
  { t:'circle', cx:50, cy:57, r:3.5, m:'red', fc:'none', tone:'base', line:false, d:true },
  { t:'shine', cx:28, cy:40, rx:4, ry:9, rot:35, ox:50, oy:50 },
]});
ART.add('haz', { emoji:['🏠'], hu:'ház', en:'cute little house with red roof', shapes:[
  { t:'rect', x:64, y:14, w:11, h:24, r:1, m:'tomato', fc:'v' },
  { t:'rect', x:18, y:44, w:64, h:46, r:2, m:'cream' },
  { t:'poly', m:'tomato', pts:[[6, 50], [50, 10], [94, 50]] },
  { t:'circle', cx:50, cy:36, r:6, m:'sky', fc:'none', tone:'base' },
  { t:'rect', x:42, y:62, w:16, h:28, r:2, m:'wood', fc:'v' },
  { t:'rect', x:24, y:58, w:13, h:13, r:1.5, m:'sky' },
  { t:'rect', x:63, y:58, w:13, h:13, r:1.5, m:'sky' },
  { t:'line', pts:[[30.5, 58], [30.5, 71]], m:'sky', w:1.6 }, { t:'line', pts:[[69.5, 58], [69.5, 71]], m:'sky', w:1.6 },
  { t:'circle', cx:54, cy:77, r:1.6, m:'dark', fc:'none', tone:'base', line:false, d:true },
]});
ART.add('haz_kert', { emoji:['🏡'], hu:'ház kerttel', en:'little house with a garden tree', shapes:[
  { t:'rect', x:8, y:80, w:84, h:12, r:6, m:'grass', fc:'h' },
  { t:'rect', x:72, y:22, w:9, h:20, r:1, m:'tomato', fc:'v' },
  { t:'rect', x:40, y:50, w:46, h:34, r:2, m:'cream' },
  { t:'poly', m:'tomato', pts:[[32, 54], [63, 22], [94, 54]] },
  { t:'rect', x:57, y:64, w:12, h:20, r:2, m:'wood', fc:'v' },
  { t:'rect', x:45, y:59, w:9, h:9, r:1.5, m:'sky', fc:'none', tone:'base' },
  { t:'rect', x:73, y:59, w:9, h:9, r:1.5, m:'sky', fc:'none', tone:'base' },
  { t:'rect', x:18, y:56, w:7, h:28, r:2, m:'wood', fc:'v' },
  { t:'circle', cx:22, cy:44, r:15, m:'leaf' },
]});
ART.add('regi_haz', { emoji:['🏚'], hu:'öreg ház', en:'old weathered wooden house', shapes:[
  { t:'rect', x:62, y:12, w:11, h:24, r:1, m:'soil', fc:'v', rot:8 },
  { t:'rect', x:18, y:44, w:64, h:46, r:2, m:'cardboard' },
  { t:'poly', m:'wood', pts:[[6, 52], [50, 10], [94, 48]] },
  { t:'rect', x:26, y:28, w:14, h:10, r:1, m:'cardboard', fc:'none', tone:'light', rot:-12 },
  { t:'rect', x:42, y:62, w:16, h:28, r:2, m:'soil', fc:'v' },
  { t:'rect', x:24, y:57, w:13, h:14, r:1.5, m:'glass', fc:'none', tone:'dark' },
  { t:'rect', x:62, y:55, w:18, h:5, r:1, m:'wood', fc:'none', tone:'base', rot:22 },
  { t:'rect', x:62, y:65, w:18, h:5, r:1, m:'wood', fc:'none', tone:'base', rot:-18 },
  { t:'line', pts:[[22, 80], [28, 76], [26, 72], [32, 68]], m:'cardboard', w:1.8 },
  { t:'line', pts:[[29, 31], [37, 29]], m:'cardboard', w:1.6, rot:-12, ox:33, oy:33 },
]});
ART.add('lakat', { emoji:['🔒'], hu:'lakat', en:'closed padlock', shapes:[
  { t:'path', m:'steel', fc:'v', p:'M27 48 V32 C27 18 37 8 50 8 C63 8 73 18 73 32 V48 H62 V32 C62 24 57 19 50 19 C43 19 38 24 38 32 V48 Z' },
  { t:'rect', x:16, y:42, w:68, h:50, r:9, m:'gold' },
  { t:'circle', cx:50, cy:62, r:7, m:'dark', fc:'none', tone:'base', line:false, d:true },
  { t:'poly', m:'dark', fc:'none', tone:'base', line:false, d:true, pts:[[46.5, 64], [53.5, 64], [56, 80], [44, 80]] },
  { t:'shine', x:23, y:50, w:5, h:22 },
]});

// ---- mérőeszközök, szerszámok ----
ART.add('iranytu', { emoji:['🧭'], hu:'iránytű', en:'magnetic compass', shapes:[
  { t:'rect', x:43, y:6, w:14, h:12, r:5, m:'gold', fc:'h' },
  { t:'circle', cx:50, cy:52, r:38, m:'gold' },
  { t:'circle', cx:50, cy:52, r:29, m:'cream' },
  { t:'line', pts:[[50, 26], [50, 31]], m:'cream', w:2.5 }, { t:'line', pts:[[76, 52], [71, 52]], m:'cream', w:2.5 },
  { t:'line', pts:[[50, 78], [50, 73]], m:'cream', w:2.5 }, { t:'line', pts:[[24, 52], [29, 52]], m:'cream', w:2.5 },
  { t:'poly', m:'red', fc:'none', tone:'base', pts:[[43, 52], [50, 25], [57, 52]], rot:35, ox:50, oy:52 },
  { t:'poly', m:'steel', fc:'none', tone:'dark', pts:[[43, 52], [50, 79], [57, 52]], rot:35, ox:50, oy:52 },
  { t:'circle', cx:50, cy:52, r:3.5, m:'gold', fc:'none', tone:'dark', d:true },
  { t:'shine', cx:28, cy:32, rx:4, ry:9, rot:40, ox:50, oy:50 },
]});
ART.add('vonalzo', { emoji:['📏'], hu:'vonalzó', en:'wooden ruler', shapes:[
  { t:'rect', x:5, y:38, w:90, h:26, r:3, m:'honey', fc:'h', rot:-38, ox:50, oy:51 },
  { t:'line', m:'honey', w:1.8, rot:-38, ox:50, oy:51,
    pts:[14, 23, 32, 41, 50, 59, 68, 77, 86].flatMap((x, i) => [[x, 38], [x, i % 2 ? 45 : 51], [x, 38]]) },
  { t:'shine', x:12, y:56, w:70, h:3.5, rot:-38, ox:50, oy:51 },
]});
ART.add('szogmero', { emoji:['📐'], hu:'háromszög vonalzó', en:'triangle ruler set square', shapes:[
  { t:'path', m:'sky', p:'M12 8 L90 88 H12 Z M26 45 V74 H55 Z' },
  { t:'line', m:'sky', w:1.8, pts:[20, 30, 40, 50, 60, 70, 80].flatMap((y, i) => [[12, y], [i % 2 ? 17 : 21, y], [12, y]]) },
  { t:'line', m:'sky', w:1.8, pts:[22, 32, 42, 52, 62, 72, 82].flatMap((x, i) => [[x, 88], [x, i % 2 ? 83 : 79], [x, 88]]) },
  { t:'shine', x:15, y:18, w:3, h:24 },
]});
ART.add('ollo', { emoji:['✂'], hu:'olló', en:'pair of scissors', shapes:[
  { t:'path', m:'steel', fc:'v', rot:28, ox:50, oy:50, p:'M45 62 C44 40 46 22 50 8 C55 22 56 40 55 62 Z' },
  { t:'path', m:'red', rot:28, ox:50, oy:50, box:[37, 59, 26, 30], p:'M50 59 A13 15 0 1 1 50 89 A13 15 0 1 1 50 59 Z M50 65 A7.5 9 0 1 0 50 83 A7.5 9 0 1 0 50 65 Z' },
  { t:'path', m:'steel', fc:'v', rot:-28, ox:50, oy:50, p:'M45 62 C44 40 46 22 50 8 C55 22 56 40 55 62 Z' },
  { t:'path', m:'red', rot:-28, ox:50, oy:50, box:[37, 59, 26, 30], p:'M50 59 A13 15 0 1 1 50 89 A13 15 0 1 1 50 59 Z M50 65 A7.5 9 0 1 0 50 83 A7.5 9 0 1 0 50 65 Z' },
  { t:'circle', cx:50, cy:50, r:4, m:'dark', fc:'none', tone:'base', d:true },
]});

// ---- bútorok ----
ART.add('kanape', { emoji:['🛋'], hu:'kanapé', en:'cosy sofa', shapes:[
  { t:'rect', x:18, y:76, w:7, h:14, r:2, m:'wood', fc:'none', tone:'dark' },
  { t:'rect', x:75, y:76, w:7, h:14, r:2, m:'wood', fc:'none', tone:'dark' },
  { t:'rect', x:16, y:24, w:68, h:36, r:9, m:'teal' },
  { t:'rect', x:14, y:64, w:72, h:16, r:4, m:'teal', fc:'h' },
  { t:'rect', x:21, y:54, w:29, h:15, r:5, m:'teal', fc:'h' },
  { t:'rect', x:50, y:54, w:29, h:15, r:5, m:'teal', fc:'h' },
  { t:'rect', x:6, y:42, w:18, h:38, r:8, m:'teal' },
  { t:'rect', x:76, y:42, w:18, h:38, r:8, m:'teal' },
  { t:'line', pts:[[50, 30], [50, 50]], m:'teal', w:1.8 },
]});
ART.add('ajto', { emoji:['🚪'], hu:'ajtó', en:'wooden front door', shapes:[
  { t:'rect', x:16, y:8, w:68, h:84, r:3, m:'cream', fc:'v' },
  { t:'rect', x:23, y:15, w:54, h:77, r:2, m:'wood' },
  { t:'rect', x:31, y:23, w:38, h:26, r:2, m:'wood', fc:'none', tone:'dark' },
  { t:'rect', x:31, y:57, w:38, h:27, r:2, m:'wood', fc:'none', tone:'dark' },
  { t:'circle', cx:67, cy:53, r:4, m:'gold', fc:'none', tone:'base' },
  { t:'shine', x:27, y:20, w:3, h:22 },
]});
ART.add('szek', { emoji:['🪑'], hu:'szék', en:'wooden chair', shapes:[
  { t:'rect', x:29, y:58, w:6, h:26, r:2, m:'wood', fc:'none', tone:'dark' },
  { t:'rect', x:65, y:58, w:6, h:26, r:2, m:'wood', fc:'none', tone:'dark' },
  { t:'rect', x:26, y:12, w:7, h:46, r:2, m:'wood', fc:'v' },
  { t:'rect', x:67, y:12, w:7, h:46, r:2, m:'wood', fc:'v' },
  { t:'rect', x:22, y:8, w:56, h:28, r:6, m:'wood', fc:'h' },
  { t:'line', pts:[[30, 22], [70, 22]], m:'wood', tone:'dark', w:2 },
  { t:'poly', m:'wood', fc:'none', tone:'light', pts:[[24, 52], [76, 52], [88, 64], [12, 64]] },
  { t:'rect', x:12, y:63, w:76, h:9, r:2, m:'wood', fc:'h' },
  { t:'rect', x:14, y:70, w:8, h:22, r:2, m:'wood', fc:'v' },
  { t:'rect', x:78, y:70, w:8, h:22, r:2, m:'wood', fc:'v' },
]});
ART.add('kosar', { emoji:['🧺'], hu:'kosár', en:'woven laundry basket with a towel', shapes:[
  { t:'path', m:'sky', p:'M18 36 C18 22 30 14 42 20 C52 10 72 12 80 26 C83 30 83 34 82 36 Z' },
  { t:'path', m:'cardboard', p:'M13 36 H87 L80 82 C79 87 76 90 71 90 H29 C24 90 21 87 20 82 Z' },
  { t:'rect', x:8, y:30, w:84, h:13, r:5, m:'wood', fc:'h' },
  { t:'line', pts:[[16, 57], [84, 57]], m:'cardboard', w:2 },
  { t:'line', pts:[[19, 73], [81, 73]], m:'cardboard', w:2 },
  { t:'line', pts:[[35, 43], [37, 89]], m:'cardboard', w:2 },
  { t:'line', pts:[[50, 43], [50, 89]], m:'cardboard', w:2 },
  { t:'line', pts:[[65, 43], [63, 89]], m:'cardboard', w:2 },
  { t:'shine', x:14, y:33, w:26, h:3.5 },
]});

// ---- kézimunka ----
(() => {
  // gombolyag-szálak: egy kör íve, csak a gombolyagon belüli része (cx,cy: a kör közepe, R: sugara)
  const strand = (cx, cy, R) => Array.from({ length:72 }, (_, i) => [cx + R * Math.cos(i * Math.PI / 36), cy + R * Math.sin(i * Math.PI / 36)])
    .filter(([x, y]) => Math.hypot(x - 48, y - 48) < 32).sort((a, b) => a[0] - b[0]).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  ART.add('gombolyag', { emoji:['🧶'], hu:'fonalgombolyag', en:'ball of knitting yarn', shapes:[
    { t:'circle', cx:48, cy:48, r:37, m:'pink' },
    { t:'line', pts:strand(8, 96, 48), m:'pink', w:2.2 },
    { t:'line', pts:strand(8, 96, 62), m:'pink', w:2.2 },
    { t:'line', pts:strand(8, 96, 76), m:'pink', w:2.2 },
    { t:'line', pts:strand(98, 20, 40), m:'pink', tone:'dark', w:2.2 },
    { t:'line', pts:strand(98, 20, 56), m:'pink', tone:'dark', w:2.2 },
    { t:'line', pts:[[74, 76], [79, 80], [84, 81], [88, 84], [89, 89]], m:'pink', tone:'dark', w:3 },
    { t:'shine', cx:32, cy:28, rx:5, ry:9, rot:40, ox:50, oy:50 },
  ]});
})();
ART.add('balta', { emoji:['🪓'], hu:'balta', en:'wood axe', shapes:[
  { t:'rect', x:54, y:22, w:9, h:68, r:4, m:'wood', fc:'v', rot:28, ox:58, oy:50 },
  { t:'rect', x:61, y:28, w:10, h:20, r:3, m:'steel', fc:'v', rot:28, ox:58, oy:50 },
  { t:'path', m:'steel', rot:28, ox:58, oy:50, p:'M56 28 L40 31 C36 26 32 23 25 22 C19 36 19 56 25 68 C32 66 36 62 40 57 L56 50 Z' },
  { t:'path', m:'steel', fc:'none', tone:'light', d:true, rot:28, ox:58, oy:50, p:'M25 22 C19 36 19 56 25 68 L31 64 C27 52 27 36 31 26 Z' },
  { t:'rect', x:52, y:82, w:13, h:9, r:3, m:'wood', fc:'none', tone:'dark', rot:28, ox:58, oy:50 },
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
  //  Villanykörte – HAGYOMÁNYOS izzó (nem LED!): átlátszó, izzó-meleg üvegbúra, benne a spirál izzószál tartódrótokon,
  //  üveg-talp; E27 menetes fém talp sötét szigetelővel. A LED-izzó (tejfehér búra, bordás nyak) ettől jól elválik.
  // =====================================================================
  {
    const TILT = 14;
    const glassPr = [[1.3, 2.9], [1.5, 4.0], [2.15, 5.3], [2.75, 6.3], [3.0, 7.4], [2.9, 8.6], [2.4, 9.7], [1.45, 10.4], [.05, 10.62]];
    const basePr = [[1.33, .95], [1.4, 2.95]], insPr = [[.7, .3], [.98, .98]];
    const fit = [...glassPr, ...basePr, ...insPr].flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]);
    const P = camera({ az:0, el:18, tilt:TILT, span:80, fit });
    const G = lathe(P, glassPr), B = lathe(P, basePr), I = lathe(P, insPr);
    const coil = Array.from({ length:15 }, (_, i) => { const t = i / 14, x = -1.15 + 2.3 * t; return P([x, 7.05 - .35 * Math.sin(Math.PI * t) + (i % 2 ? .28 : -.28), .15]); });
    const thread = y => band(Array.from({ length:9 }, (_, i) => { const a = -90 + 22.5 * i; return B.at(1.4, y + .22 * sin(a), a); }), 1.1, false);
    ART.add('izzo', { emoji:['💡'], hu:'villanykörte', en:'glowing light bulb', shadow:'hard', tilt:TILT, shapes:[
      pth('honey', 'base', [G.sil]),                                                     // izzó üvegbúra (alap)
      det('honey', 'light', G.strip(-90, -40, 3.3, 10.5)),                               // fény felőli oldal
      det('honey', 'dark', G.strip(38, 90, 2.9, 10.5)),                                  // árnyékos oldal
      det('honey', 'line', G.strip(72, 90, 2.9, 10.3), { o:.3 }),                        // legsötétebb élsáv
      det('paper', 'light', circ(...P([0, 7, .2]), 1.55 * P.k, 14, 1.25 * P.k), { o:.75 }),   // izzó mag (a szál fénye)
      det('white', 'light', [P([-.55, 3.1, 0]), P([.55, 3.1, 0]), P([.2, 5.7, 0]), P([-.2, 5.7, 0])], { o:.85 }),   // üveg-talp (tartó)
      lineP('steel', 'dark', [P([-.15, 5.6, 0]), P([-1.15, 6.85, .15])], 1.1),          // tartódrótok
      lineP('steel', 'dark', [P([.15, 5.6, 0]), P([1.15, 6.85, .15])], 1.1),
      lineP('orange', 'dark', coil, 1.3),                                                // spirál izzószál
      pth('steel', 'base', [B.sil]),                                                     // menetes talp
      det('steel', 'light', B.strip(-90, -45)),
      det('steel', 'dark', B.strip(40, 90)),
      dpth('steel', 'line', [thread(1.35), thread(1.95), thread(2.55)], { o:.55 }),      // menet
      pth('dark', 'base', [I.sil]),                                                      // szigetelő
      face('honey', 'dark', circ(...P([0, .15, 0]), .42 * P.k, 10, .3 * P.k)),          // érintkező csúcs
      shineP(G.strip(-72, -56, 6.4, 9.4), .85),                                          // csillanás a búrán
      shineP(G.strip(-40, -32, 7.3, 8.6), .6),
    ]});
  }

  // =====================================================================
  //  Televízió – vékony lapos képernyő (80 × 48 × 5 cm) kis talpon; a képen domb és nap (így tévé, nem monitor)
  // =====================================================================
  {
    const TILT = -10, X = 40, H = 48, Z = 2.5;
    const fit = []; for(const x of [-X, X]) for(const y of [-10, H]) for(const z of [-9, 7]) fit.push([x, y, z]);
    const P = camera({ az:28, el:14, F:400, tilt:TILT, span:82, fit });
    const pan = box(P, -X, X, 0, H, -Z, Z), neck = box(P, -4, 4, -8.5, 1, -2.5, -.5), foot = box(P, -18, 18, -10, -8.5, -9, 6);
    const S = ([u, v]) => P([u, v, Z + .1]);
    const scr = [[-37.5, 2.8], [37.5, 2.8], [37.5, 45.5], [-37.5, 45.5]];
    const hill = [[-37.5, 2.8], [37.5, 2.8], [37.5, 16], ...Array.from({ length:9 }, (_, i) => { const u = 37.5 - 75 * i / 8; return [u, 17 + 7 * Math.sin((u + 20) / 22)]; })];
    ART.add('tv', { emoji:['📺', '🖥️'], hu:'televízió', en:'flat screen television', shadow:'hard', tilt:TILT, shapes:[
      face('dark', 'dark', foot.right), face('dark', 'base', foot.front), face('dark', 'light', foot.top),   // talp
      face('dark', 'base', neck.front), face('dark', 'dark', neck.right),                                    // nyak
      face('dark', 'dark', pan.right),                                                                       // oldala (sötét)
      face('dark', 'light', pan.top),                                                                        // teteje (világos)
      face('dark', 'base', pan.front),                                                                       // keret (alap)
      face('sky', 'base', scr.map(S)),                                                                       // képernyő
      det('leaf', 'base', hill.map(S)),                                                                      // domb a képen
      det('honey', 'base', circ(22, 35, 4.2, 12).map(S)),                                                    // nap a képen
      det('glass', 'light', [[-37.5, 45.5], [-20, 45.5], [-37.5, 24]].map(S), { o:.55 }),                   // tükröződés
      det('sky', 'line', [[-37.5, 2.8], [37.5, 2.8], [37.5, 4.2], [-37.5, 4.2]].map(S), { o:.3 }),         // legsötétebb sáv alul
      shineP([[-33, 42.5], [-28, 42.5], [-33, 36]].map(S), .7),
      det('leaf', 'light', circ(34.5, 1.2, .8, 8).map(S)),                                                   // bekapcsolt jelzőfény
    ]});
  }

  // =====================================================================
  //  Zuhanyfej – alulról látjuk a szórófejet (fúvóka-pöttyök), fali karon; a fúvókákból vízsugarak és cseppek hullanak
  // =====================================================================
  {
    const TILT = 8, prof = [[6.5, 0], [6.5, .8], [5.9, 1.6], [2.2, 3.6], [1.1, 4.3], [1.1, 5.5]];
    const arm = [[0, 5, 0], [0, 9.5, 0], [-1.3, 11.3, 0], [-4, 11.8, 0], [-15.5, 11.8, 0]];
    const noz = [[1.6, -40], [1.6, 20], [1.6, 80], [3.4, -60], [3.4, -15], [3.4, 30], [3.4, 75], [5, -70], [5, -35], [5, 0], [5, 35], [5, 70]];
    const jets = [[3.4, -60], [5, -30], [3.4, 0], [5, 30], [3.4, 60]];
    const fit = [...prof.flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]), ...arm, [-17, 15, 0], [-17, 8.5, 0],
      ...jets.map(([r, a]) => [r * sin(a) * 1.5, -15, r * cos(a) * 1.5])];
    const P = camera({ az:18, el:-22, tilt:TILT, span:80, fit }), L = lathe(P, prof), pp = pipe(P, arm, 1.1);
    const W = lathe(P, [[2.9, 0], [2.9, 1.3]], chain(rotZ(-90), ([x, y, z]) => [x - 17.2, y + 11.8, z]));
    const bot = (r, a, y = 0) => P([r * sin(a), y, r * cos(a)]);
    const jet = ([r, a], len) => band([bot(r, a), bot(r * (1 + .5 * len / 15), a, -len)], 1.8, false);
    const drop = ([r, a], len) => { const [x, y] = bot(r * (1 + .5 * len / 15), a, -len); return [[x, y - 4], ...circ(x, y, 1.8, 8, 1.8, -22.5).slice(0, 7)]; };
    const lens = [9, 12, 8.5, 12.5, 9];
    ART.add('zuhany', { emoji:['🚿'], hu:'zuhanyfej', en:'shower head with water drops', shadow:'hard', tilt:TILT, shapes:[
      pth('steel', 'base', [W.sil]), face('steel', 'light', W.full(2.9, 1.3, 20), { line:false }),   // fali rózsa
      pth('steel', 'base', [pp.sil]), det('steel', 'light', pp.hi),                          // fali kar
      pth('steel', 'base', [L.sil]),                                                         // szórófej (alap)
      det('steel', 'light', L.strip(-90, -40, .8, 5.5)),
      det('steel', 'dark', L.strip(40, 90, .8, 5.5)),
      face('steel', 'dark', L.full(6.5, 0, 20)),                                             // szórólap pereme
      face('steel', 'light', L.full(5.6, 0, 20), { line:false }),                            // szórólap
      dpth('steel', 'line', noz.map(([r, a]) => circ(...bot(r, a), .5 * P.k, 6, .32 * P.k))),   // fúvókák
      pth('water', 'base', jets.map((j, i) => jet(j, lens[i])), { line:false }),                           // vízsugarak
      pth('water', 'base', jets.map((j, i) => drop(j, lens[i] + 1.4))),                     // cseppek
      dpth('water', 'light', jets.map((j, i) => { const [x, y] = bot(j[0] * (1 + .5 * (lens[i] + 1.4) / 15), j[1], -lens[i] - 1.4); return circ(x - .5, y - .3, .5, 6); })),
      shineP(L.strip(-70, -55, 1.8, 4.2), .8),
    ]});
  }

  // =====================================================================
  //  Fürdőkád – szabadon álló, oroszlánlábas kád (160 × 75 × 60 cm), a peremen túl habbuborékok, a végén csaptelep
  // =====================================================================
  {
    const TILT = -8, SX = 80, SZ = 37, xf = ([x, y, z]) => [x * SX, y, z * SZ];
    const prof = [[.8, 12], [.9, 20], [.98, 40], [1, 58], [1.03, 60]];
    const tap = [[-84, 48, 0], [-84, 73, 0], [-81, 77, 0], [-72, 77, 0], [-69, 72, 0]];
    const foamC = [[-52, 63, 4, 11], [-36, 66, -10, 13], [-30, 66, 14, 12], [-12, 70, -2, 15], [8, 68, 14, 12], [14, 71, -10, 13], [34, 67, 4, 13], [54, 63, -6, 10], [-24, 79, 2, 10], [2, 82, 0, 11], [24, 78, 2, 9]];
    const fit = [...prof.flatMap(([r, y]) => [[-r * SX, y, 0], [r * SX, y, 0], [0, y, r * SZ], [0, y, -r * SZ]]), [0, 0, 0], ...tap, [2, 94, 0], [-86, 73, 0]];
    const P = camera({ az:18, el:26, tilt:TILT, span:84, fit }), L = lathe(P, prof, xf), pp = pipe(P, tap, 2.2);
    const feet = [[-58, -20], [58, -20], [-58, 22], [58, 22]].map(([x, z]) => hull([...circ(...P([x, 0, z]), 4.4 * P.k, 8, 2.2 * P.k), ...circ(...P([x * 1.02, 14, z]), 3 * P.k, 8, 1.5 * P.k)]));
    const bub = foamC.map(([x, y, z, r]) => circ(...P([x, y, z]), r * P.k, 9));
    ART.add('kad', { emoji:['🛁'], hu:'fürdőkád', en:'bathtub with foam bubbles', shadow:'hard', tilt:TILT, shapes:[
      pth('gold', 'base', feet),                                                               // arany lábak
      pth('steel', 'base', [pp.sil]), det('steel', 'light', pp.hi),                            // csaptelep
      pth('white', 'base', [L.sil]),                                                           // kád teste (alap)
      det('white', 'light', L.strip(-90, -55, 12, 58)),
      det('white', 'dark', L.strip(38, 90, 12, 58)),
      det('white', 'line', L.strip(72, 90, 12, 58), { o:.3 }),
      face('white', 'light', L.full(1.03, 60, 20)),                                            // perem
      det('white', 'dark', L.full(.95, 60, 20)),                                               // belső fal
      det('sky', 'base', clip(L.full(.95, 60, 20), [[0, 0], [100, 0], [100, 100], [0, 100]]).map(([x, y]) => [x, y + 1.2])),   // víz
      pth('white', 'light', bub),                                                              // habbuborékok
      dpth('sky', 'light', foamC.map(([x, y, z, r]) => { const c = P([x, y, z]); return circ(c[0] + r * P.k * .3, c[1] + r * P.k * .35, r * P.k * .45, 7); }), { o:.8 }),
      shineP(L.strip(-70, -60, 30, 52), .85),
      shineP(foamC.slice(9, 10).map(([x, y, z, r]) => circ(P([x, y, z])[0] - r * P.k * .4, P([x, y, z])[1] - r * P.k * .45, r * P.k * .22, 8))[0], .9),
    ]});
  }

  // =====================================================================
  //  Vécé – álló WC-csésze tartállyal (tartály 38 × 38 × 18 cm, öblítőgomb a tetején), kék ülőke, lecsukott fedél
  // =====================================================================
  {
    const TILT = -10, xf = ([x, y, z]) => [x * 18, y, z * 24 + 4];
    const bowl = [[.62, 0], [.58, 2.5], [.46, 12], [.6, 24], [.88, 34], [1, 40]], seat = [[1.03, 40], [1.03, 42.5]], lid = [[.99, 42.5], [.99, 44.5]];
    const fit = [...[-19, 19].flatMap(x => [[x, 80, -30], [x, 83, -12], [x, 42, -30]]), [0, 0, 28], [18, 44, 4], [-18, 44, 4], [0, 44, 28]];
    const P = camera({ az:32, el:20, tilt:TILT, span:80, fit });
    const B = lathe(P, bowl, xf), S = lathe(P, seat, xf), Ld = lathe(P, lid, xf);
    const tk = box(P, -19, 19, 40, 80, -30, -12), cap = box(P, -20, 20, 80, 83.5, -31, -11);
    ART.add('wc', { emoji:['🚽'], hu:'vécé', en:'toilet', shadow:'hard', tilt:TILT, shapes:[
      face('white', 'dark', tk.right), face('white', 'base', tk.front),                        // tartály
      face('white', 'dark', cap.right), face('white', 'base', cap.front), face('white', 'light', cap.top),   // tartályfedél
      face('steel', 'base', circ(...P([0, 83.6, -21]), 3.2 * P.k, 14, 1.3 * P.k)),             // öblítőgomb
      pth('white', 'base', [B.sil]),                                                           // csésze
      det('white', 'light', B.strip(-90, -50, 0, 40)),
      det('white', 'dark', B.strip(38, 90, 0, 40)),
      det('white', 'line', B.strip(70, 90, 0, 38), { o:.3 }),
      pth('sky', 'base', [S.sil]), det('sky', 'dark', S.strip(40, 90)),                      // ülőke
      pth('white', 'base', [Ld.sil]), face('white', 'light', Ld.full(.99, 44.5, 28), { line:false }),   // fedél
      shineP([P([-15, 76, -12]), P([-11, 76, -12]), P([-11, 52, -12]), P([-15, 52, -12])], .8),
      shineP(B.strip(-66, -56, 14, 34), .8),
    ]});
  }

  // =====================================================================
  //  Konyhai csaptelep – kerek talp, álló test, oldalsó kar, magas hattyúnyak-kifolyó; a kifolyóból vízcsepp hull
  // =====================================================================
  {
    const TILT = 8, body = [[3.2, 0], [3.2, .9], [1.8, 1.4], [1.7, 13], [1.3, 13.8]];
    const neck = [[0, 13, 0], [0, 20, 0], [.9, 22.8, 0], [3.4, 24, 0], [6.4, 23.2, 0], [8, 20.6, 0], [8.3, 17.6, 0]];
    const lever = [[-1.4, 10.6, .3], [-4.2, 11.6, .6], [-6.2, 12.4, .8]];
    const fit = [...body.flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]), ...neck, [8.3, 8.5, 0], [-7, 12.4, .8], [0, 25, 0]];
    const P = camera({ az:20, el:18, tilt:TILT, span:80, fit }), L = lathe(P, body), sp = pipe(P, neck, 1.05), lv = pipe(P, lever, .6);
    const tip = P([8.3, 17.5, 0]), d = P([8.3, 10.5, 0]), dr = 2.3 * P.k * .55;
    const drop = [[d[0], d[1] - dr * 2.3], ...circ(d[0], d[1], dr, 12, dr, -40).slice(0, 10)];
    ART.add('csap', { emoji:['🚰'], hu:'vízcsap', en:'water tap with a drop', shadow:'hard', tilt:TILT, shapes:[
      pth('steel', 'base', [lv.sil]), det('steel', 'light', lv.hi),                           // kar
      face('steel', 'dark', circ(...P([-6.3, 12.45, .8]), .85 * P.k, 10)),                    // kar gombja
      pth('steel', 'base', [L.sil]),                                                           // test + talp
      det('steel', 'light', L.strip(-90, -45, 1.4, 13)),
      det('steel', 'dark', L.strip(40, 90, 0, 13)),
      face('steel', 'light', L.full(3.2, .9, 24), { line:false }),                             // talp teteje
      pth('steel', 'base', [sp.sil]),                                                          // hattyúnyak-kifolyó
      det('steel', 'light', sp.hi),
      det('steel', 'dark', band(sp.c.slice(3).map(([x, y]) => [x + sp.w * .25, y + sp.w * .2]), sp.w * .35)),   // alsó árnyék
      face('dark', 'base', circ(tip[0], tip[1] + .2, .8 * P.k, 10, .45 * P.k)),                // kifolyó nyílása
      face('water', 'base', drop),                                                             // vízcsepp
      det('water', 'light', circ(d[0] - dr * .35, d[1] - dr * .2, dr * .32, 8)),
      shineP(L.strip(-70, -58, 3, 11.5), .85),
    ]});
  }

  // =====================================================================
  //  Kötött sál – nyakba tekert hurok (tórusz) két lelógó véggel, krém csíkokkal, kötött bordamintával és rojtokkal
  // =====================================================================
  {
    const TILT = -6, R = 6.2, r = 3.2;
    const fit = [[-R - r, 0, 0], [R + r, 0, 0], [0, 0, R + r], [0, 0, -R - r], [0, r, 0], [-5, -21, R], [6, -19, R]];
    const P = camera({ az:0, el:34, tilt:TILT, span:74, fit });
    const ring = (rr, y, n = 28) => Array.from({ length:n }, (_, i) => P([rr * cos(360 * i / n), y, rr * sin(360 * i / n)]));
    const outer = hull([...ring(R + r, 0), ...ring(R, r), ...ring(R, -r)]), hole = ring(R - r * .8, r * .62);
    // lelógó vég: a hurok elejéről (z = R) lefelé; x0 = a felső közép, dx = kilengés, w = szélesség, len = hossz
    const end = (x0, dx, w, len, z) => { const F = (u, v) => P([x0 + u + dx * (-v / len), v, z]);
      return { sil:[F(-w / 2, 0), F(w / 2, 0), F(w / 2, -len), F(-w / 2, -len)], F,
        stripes:[-len * .55, -len * .72].map(v => [F(-w / 2, v), F(w / 2, v), F(w / 2, v - 1.5), F(-w / 2, v - 1.5)]),
        fringe:[-.36, -.12, .12, .36].map(t => band([F(t * w, -len), F(t * w, -len - 2.2)], 1.3)),
        side:[F(w * .28, 0), F(w / 2, 0), F(w / 2, -len), F(w * .28, -len)], lite:[F(-w / 2, 0), F(-w * .3, 0), F(-w * .3, -len), F(-w / 2, -len)] }; };
    const A = end(2.4, 3.6, 5.6, 17, R + .4), B = end(-3.2, -2.2, 5.6, 19.5, R + 1.4);
    const knit = [150, 128, 106, 84, 62, 40].map(a => P([(R + r * .75) * cos(a), r * .45, (R + r * .75) * sin(a)])).map(c => band([[c[0] - 1.2, c[1] - 1.1], [c[0], c[1] + .5], [c[0] + 1.2, c[1] - 1.1]], .9, false));
    ART.add('sal', { emoji:['🧣'], hu:'sál', en:'knitted winter scarf', shadow:'hard', tilt:TILT, shapes:[
      pth('red', 'base', [outer]),                                                             // hurok (alap)
      det('berry', 'base', inset(hole, outer)),                                                  // a hurok belseje
      det('red', 'light', inset(hull([...ring(R + r * .5, r * .9).slice(11, 21), ...ring(R + r, 0).slice(12, 20)]), outer)),   // hátsó perem teteje (fény)
      det('red', 'dark', inset(hull([...ring(R + r, 0).slice(0, 7), ...ring(R + r * .5, -r * .8).slice(0, 7)]), outer)),        // jobb-elöl árnyék
      dpth('red', 'dark', knit),                                                     // kötött bordaminta
      pth('cream', 'base', A.fringe), face('red', 'base', A.sil), det('red', 'dark', A.side), dpth('cream', 'base', A.stripes),   // hátsó vég
      pth('cream', 'base', B.fringe), face('red', 'base', B.sil), det('red', 'light', B.lite), det('red', 'dark', B.side), dpth('cream', 'base', B.stripes),   // elülső vég
      shineP([B.F(-1.9, -2), B.F(-1.2, -2), B.F(-1.2, -8), B.F(-1.9, -8)], .6),
    ]});
  }

  // =====================================================================
  //  Ablak – négyosztatú fa ablak (60 × 72 × 7 cm), mélyített üvegtáblák (bélés-árnyék), kilincs, kiálló párkány
  // =====================================================================
  {
    const TILT = -8, X = 30, H = 72, Z = 3.5;
    const fit = []; for(const x of [-34, 34]) for(const y of [-5, H]) for(const z of [-Z, 9]) fit.push([x, y, z]);
    const P = camera({ az:24, el:12, F:500, tilt:TILT, span:80, fit });
    const fr = box(P, -X, X, 0, H, -Z, Z), sill = box(P, -34, 34, -5, 0, -Z, 9);
    const panes = [[-25, -2, 5, 34], [2, 25, 5, 34], [-25, -2, 38, 67], [2, 25, 38, 67]];
    const opening = ([x0, x1, y0, y1], z = Z) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => P([x, y, z]));
    const glass = q => clip(opening(q, Z - 3), opening(q));
    const sillIn = ([x0, x1, y0]) => [P([x0, y0, Z]), P([x1, y0, Z]), P([x1, y0, Z - 3]), P([x0, y0, Z - 3])];
    const refl = ([x0, x1, y0, y1]) => clip([[x0 + 3, y1], [x0 + 9, y1], [x0 + 1, y0 + 6], [x0 - 5, y0 + 6]].map(([x, y]) => P([x, y, Z - 3])), glass([x0, x1, y0, y1]));
    ART.add('ablak', { emoji:['🪟'], hu:'ablak', en:'wooden window with four panes', shadow:'hard', tilt:TILT, shapes:[
      face('wood', 'dark', fr.right), face('wood', 'light', fr.top),                          // keret oldala, teteje
      face('wood', 'base', fr.front),                                                          // keret eleje (alap)
      pth('wood', 'dark', panes.map(q => opening(q))),                                        // bélés (árnyékos)
      pth('sky', 'base', panes.map(glass), { line:false }),                                   // üvegtáblák
      dpth('wood', 'light', panes.map(sillIn)),                                               // alsó bélés (fényben)
      dpth('glass', 'light', panes.map(refl), { o:.7 }),                                      // tükröződés
      dpth('sky', 'dark', panes.map(([x0, x1, y0, y1]) => clip([[x1 - 6, y0], [x1, y0], [x1, y0 + 7]].map(([x, y]) => P([x, y, Z - 3])), glass([x0, x1, y0, y1]))), { o:.6 }),
      face('steel', 'base', [[-1.2, 30], [1.2, 30], [1.2, 42], [-1.2, 42]].map(([x, y]) => P([x, y, Z + .8]))),   // kilincs
      face('wood', 'dark', sill.right), face('wood', 'base', sill.front), face('wood', 'light', sill.top),         // párkány
      shineP([P([-X + 1.5, H - 2, Z]), P([-X + 3.2, H - 2, Z]), P([-X + 3.2, 8, Z]), P([-X + 1.5, 8, Z])], .5),
    ]});
  }

  // =====================================================================
  //  Zseblámpa – kék test recés markolattal, fém fej, világító lencse; a fénykúp előre (jobbra fel) világít
  // =====================================================================
  {
    const TILT = 0, xf = chain(rotZ(-62), rotY(-30));
    const bodyP = [[1.45, 0], [1.45, 1.3], [1.32, 1.5], [1.32, 11]], headP = [[1.32, 10.9], [2.3, 13.6], [2.35, 16.4]], tailP = [[1.2, -.5], [1.45, 0]];
    const beamP = [[2.1, 16.4], [5.6, 25]];
    const fit = [...[...bodyP, ...headP, ...tailP, ...beamP].flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]).map(xf)];
    const P = camera({ az:0, el:12, tilt:TILT, span:84, fit });
    const Bd = lathe(P, bodyP, xf), Hd = lathe(P, headP, xf), T = lathe(P, tailP, xf), Bm = lathe(P, beamP, xf);
    const grip = [3, 4.3, 5.6, 6.9].map(y => band(Bd.ring(1.34, y, -85, 85, 8), .9, false));
    ART.add('zseblampa', { emoji:['🔦'], hu:'zseblámpa', en:'flashlight', shadow:'hard', tilt:TILT, shapes:[
      { t:'path', m:'honey', tone:'light', line:false, o:.85, p:pathOf([Bm.sil]) },            // fénykúp
      det('paper', 'light', inset(Bm.strip(-40, 40, 16.4, 25), Bm.sil, 2.2), { o:.6 }),       // a kúp fényes magja
      pth('dark', 'base', [T.sil]),                                                            // hátsó sapka
      pth('blue', 'base', [Bd.sil]),                                                           // test (alap)
      det('blue', 'light', Bd.strip(-90, -45)),
      det('blue', 'dark', Bd.strip(40, 90)),
      dpth('blue', 'line', grip, { o:.55 }),                                                   // recés markolat
      face('honey', 'base', circ(...Bd.on(-90, 8.8), .9 * P.k, 10, .6 * P.k)),                // kapcsoló
      pth('steel', 'base', [Hd.sil]),                                                          // fej
      det('steel', 'light', Hd.strip(-90, -45)),
      det('steel', 'dark', Hd.strip(40, 90)),
      face('steel', 'light', Hd.full(2.35, 16.4, 24)),                                         // lencse-perem
      face('honey', 'light', Hd.full(1.95, 16.45, 24), { line:false }),                        // világító lencse
      det('paper', 'light', Hd.full(1.1, 16.5, 16)),
      shineP(Bd.strip(-75, -62, 2, 10), .7),
    ]});
  }

  // =====================================================================
  //  Kulcs – arany, vastag lemezkulcs (6,8 cm): kerek fej lyukkal és díszgyűrűvel, gallér, szár, fogazott toll
  // =====================================================================
  {
    const TILT = 38, T = .38, bow = circ(0, 0, 1.75, 22);
    const bit = [[4.6, .3], [6.9, .3], [6.9, -1.35], [6.45, -1.35], [6.45, -.95], [6.0, -.95], [6.0, -1.5], [5.55, -1.5], [5.55, -.9], [5.1, -.9], [5.1, -1.35], [4.6, -1.35]];
    const parts = [bow, [[1.5, -.62], [2.4, -.62], [2.4, .62], [1.5, .62]], [[1.5, -.36], [6.9, -.36], [6.9, .36], [1.5, .36]]];
    const fit = [...bow, [6.9, .36], [6.9, -1.5]].flatMap(([u, v]) => [[u, v, 0], [u, v, -T]]);
    const P = camera({ az:22, el:20, tilt:TILT, span:84, fit });
    const Fp = z => ([u, v]) => P([u, v, z]);
    const sil = envelope([...parts.map(q => q.map(Fp(0))), ...parts.map(q => q.map(Fp(-T)))]);
    const front = [...parts.map(q => q.map(Fp(0)))], bitF = bit.map(Fp(0)), bitB = bit.map(Fp(-T));
    ART.add('kulcs', { emoji:['🔑'], hu:'kulcs', en:'golden key', shadow:'hard', tilt:TILT, shapes:[
      pth('gold', 'dark', [sil]),                                                              // a lemez vastagsága (sötét)
      face('gold', 'dark', bitB),
      pth('gold', 'base', front, { line:false }), face('gold', 'base', bitF, { line:false }),   // előlap (alap)
      det('gold', 'light', clip(circ(0, 0, 1.6, 20).map(Fp(0)), [[-3, -3], [2.5, -3], [-3, 1]].map(Fp(0)))),   // fej fénylapja
      det('gold', 'light', [[1.5, .1], [6.8, .1], [6.8, .3], [1.5, .3]].map(Fp(0))),                              // szár fénycsík
      det('gold', 'line', [[1.5, -.36], [4.6, -.36], [4.6, -.2], [1.5, -.2]].map(Fp(0)), { o:.45 }),               // szár alsó élsáv
      lineP('gold', 'dark', [1.95, 1.95].map((u, i) => Fp(0)([u, i ? .58 : -.58])), 1.1),                         // gallér-horony
      lineP('gold', 'dark', circ(0, 0, 1.25, 20).concat([circ(0, 0, 1.25, 20)[0]]).map(Fp(0)), 1),                // díszgyűrű
      face('gold', 'line', circ(-.25, .1, .62, 14).map(Fp(0)), { o:.6 }),                                       // lyuk fala
      face('white', 'light', circ(-.18, .03, .5, 14).map(Fp(0)), { line:false }),                                // lyuk
      shineP(circ(-.9, .9, .28, 8, .5, 40).map(Fp(0)), .85),
      shineP([[3, .16], [5.8, .16], [5.8, .26], [3, .26]].map(Fp(0)), .8),
    ]});
  }

  // =====================================================================
  //  WC-papír tekercs – fekvő tekercs (11 × 10,5 cm) kartonhengerrel; elöl lelóg a lap steppelt mintával és perforációval
  // =====================================================================
  {
    const TILT = -6, xf = rotZ(-90), Rr = 5.6, Lg = 10.5, hang = 9.5;
    const fit = [...[0, Lg].flatMap(x => [[x, Rr, 0], [x, -Rr, 0], [x, 0, Rr], [x, 0, -Rr]]), [.3, -hang, Rr], [Lg - .3, -hang, Rr]];
    const P = camera({ az:32, el:22, tilt:TILT, span:80, fit }), L = lathe(P, [[Rr, 0], [Rr, Lg]], xf);
    const S = (x, y) => P([x, y, Rr + .05]);
    const edge = Array.from({ length:12 }, (_, i) => { const x = Lg - .3 - (Lg - .6) * i / 11; return S(x, -hang + (i % 2 ? .45 : 0)); });
    const sheet = [S(.3, -.4), S(Lg - .3, -.4), ...edge];
    const dots = []; for(let x = 1.7; x < Lg - .8; x += 2.3) for(const y of [-2.6, -4.6, -8.2]) dots.push(circ(...S(x + (y === -4.6 ? 1.15 : 0), y), .28 * P.k, 6));
    ART.add('papirtekercs', { emoji:['🧻'], hu:'papírtekercs', en:'roll of toilet paper', shadow:'hard', tilt:TILT, shapes:[
      pth('white', 'base', [L.sil]),                                                           // tekercs (alap)
      det('white', 'light', L.strip(-90, -40)),
      det('white', 'dark', L.strip(55, 110)),
      face('white', 'light', L.full(Rr, Lg, 28)),                                              // oldallap
      lineP('white', 'dark', L.ring(4, Lg, 0, 360, 24), 1),                                   // rétegek gyűrűje
      face('cardboard', 'base', L.full(2.3, Lg, 20)),                                          // kartonhenger
      face('cardboard', 'dark', L.full(1.75, Lg, 20), { line:false }),                         // a henger belseje
      face('white', 'base', sheet),                                                            // lelógó lap
      det('white', 'dark', [S(.3, -.4), S(Lg - .3, -.4), S(Lg - .3, -1.4), S(.3, -1.4)]),      // a lap hajlata
      dpth('white', 'dark', dots),                                                             // steppelt minta
      lineP('steel', 'base', [S(.6, -6.4), S(Lg - .6, -6.4)], 1, { o:.9 }),                   // perforáció
      shineP(L.strip(-72, -60, .8, Lg - .8), .9),
    ]});
  }

  // =====================================================================
  //  Téglafal – kis falrészlet 3/4-ben: alul két tégla (25 × 6,5 × 12 cm), fölöttük kötésben egy harmadik, köztük habarcs;
  //  a téglák elején apró égetési pöttyök
  // =====================================================================
  {
    const TILT = -8, Z1 = 12, bricks = [[-25, -.5, 0, 6.5], [.5, 25, 0, 6.5], [-12.25, 12.25, 7.5, 14]];
    const fit = bricks.flatMap(([x0, x1, y0, y1]) => [x0, x1].flatMap(x => [y0, y1].flatMap(y => [[x, y, 0], [x, y, Z1]])));
    const P = camera({ az:36, el:28, tilt:TILT, span:84, fit }), [A, B, C] = bricks.map(([x0, x1, y0, y1]) => box(P, x0, x1, y0, y1, 0, Z1));
    const M = box(P, -11.8, 11.8, 6.5, 7.5, .8, 11.2);
    const bl = (q, u, v) => { const a = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u], b = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u];
      return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]; };
    const dots = [A, B, C].flatMap(b => [[.2, .35], [.45, .7], [.7, .3], [.88, .65]].map(([u, v]) => circ(...bl(b.front, u, v), .75, 6)));
    const low = q => [q[0], q[1], bl(q, 1, .16), bl(q, 0, .16)];
    ART.add('tegla', { emoji:['🧱'], hu:'téglafal', en:'stack of red bricks', shadow:'hard', tilt:TILT, look:'small red brick wall piece in three-quarter view, running bond with mortar', shapes:[
      face('tomato', 'dark', A.right), face('tomato', 'base', A.front), face('tomato', 'light', A.top),
      face('tomato', 'dark', B.right), face('tomato', 'base', B.front), face('tomato', 'light', B.top),
      face('cream', 'light', M.top), face('cream', 'base', M.front), face('cream', 'dark', M.right),
      face('tomato', 'dark', C.right), face('tomato', 'base', C.front), face('tomato', 'light', C.top),
      dpth('tomato', 'line', [low(A.front), low(B.front), low(C.front)], { o:.35 }),
      dpth('tomato', 'dark', dots),
      shineP([bl(C.front, .06, .86), bl(C.front, .6, .86), bl(C.front, .6, .76), bl(C.front, .06, .76)], .7),
    ]});
  }

  // =====================================================================
  //  Cérna – fa orsó (két perem, középen lyuk) piros cérnával, rajta a tekercselés sorai; a laza szál egy mellé támasztott
  //  tű fokán fut át
  // =====================================================================
  {
    const ring4 = prof => prof.flatMap(([r, y]) => [[-r, y, 0], [r, y, 0], [0, y, r], [0, y, -r]]);
    const smoothOpen = (pts, n = 6) => { const out = [], cr = (p0, p1, p2, p3, t) => [0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t));
      for(let i = 0; i < pts.length - 1; i++) for(let j = 0; j < n; j++) out.push(cr(pts[i - 1] || pts[i], pts[i], pts[i + 1], pts[i + 2] || pts[i + 1], j / n));
      out.push(pts[pts.length - 1]); return out; };
    const TILT = 12, fl0 = [[2.4, 0], [2.4, .8]], thr = [[1.95, .8], [2.05, 1.3], [2.05, 5.7], [1.95, 6.2]], fl1 = [[2.4, 6.2], [2.4, 7]];
    const N0 = [3.3, 9.4, 1.4], N1 = [2.5, .3, 2.7];
    const P = camera({ az:0, el:22, tilt:TILT, span:80, fit:[...ring4(fl0), ...ring4(fl1), N0, N1, [3.9, 8.4, 2.2], [2.6, 10.1, 1.2]] }), k = P.k;
    const F0 = lathe(P, fl0), T = lathe(P, thr), F1 = lathe(P, fl1);
    const wind = [1.4, 2, 2.6, 3.2, 3.8, 4.4, 5, 5.6].map(y => band(Array.from({ length:9 }, (_, i) => { const a = -80 + 20 * i; return T.on(a, y + .2 * a / 80, .02); }), .8, false));
    const lerp3 = t => N0.map((v, i) => v + (N1[i] - v) * t), ndl = pipe(P, [lerp3(0), lerp3(.9)], .1), tip = [P(lerp3(.88)), P(N1)];
    const eye = circ(...P(lerp3(.05)), .35 * k * .3, 8, .12 * k * .3 + .6, Math.atan2(tip[1][1] - tip[0][1], tip[1][0] - tip[0][0]) * 180 / Math.PI);
    const loose = band(smoothOpen([T.on(40, 4.6), P([3.6, 6.2, 2.8]), P([3.9, 8.4, 2.2]), P(lerp3(.05)), P([2.6, 9.9, 1.2])]), 1.5);
    ART.add('cerna', { emoji:['🧵'], hu:'cérna', en:'spool of thread with a needle', shadow:'hard', tilt:TILT, look:'wooden spool with red thread and winding lines, needle leaning on it with the thread through its eye', shapes:[
      pth('wood', 'base', [F0.sil]), det('wood', 'dark', F0.strip(30, 90)),
      pth('red', 'base', [T.sil]), det('red', 'light', T.strip(-90, -50, .9, 6.1)), det('red', 'dark', T.strip(38, 90, .9, 6.1)), det('red', 'line', T.strip(72, 90, .9, 6.1), { o:.35 }),
      dpth('red', 'dark', wind, { o:.8 }),
      pth('wood', 'base', [F1.sil]), det('wood', 'dark', F1.strip(30, 90)),
      face('wood', 'light', F1.full(2.4, 7, 28)), face('wood', 'line', F1.full(.45, 7, 12)),
      pth('steel', 'base', [ndl.sil, band(tip, t => ndl.w * (1 - t) + .3, false)]), det('steel', 'light', ndl.hi),
      det('dark', 'base', eye),
      pth('red', 'base', [loose]),
      shineP(T.strip(-74, -62, 1.4, 5.4), .8),
    ]});
  }
})();
