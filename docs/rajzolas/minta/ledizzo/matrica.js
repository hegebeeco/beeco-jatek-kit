// ============================================================
//  LED-izzó matrica – három kidolgozottsági szint (összehasonlító próba)
//    ledizzo_a  Tiszta ikon  – kézzel megadott egyszerű formák, szemből
//    ledizzo_b  Kidolgozott  – 3/4-es vetítés, 4 éles tónus a fő felületeken (sávok, fénysapka)
//    ledizzo_c  Gazdag       – 3/4-es vetítés, lapokra tört (low-poly) felületek, bordák, menet, csillanások
//  A B és C a közös profilból (profil.js) VETÍTÉSSEL készül: a tárgyat felülről φ fokban nézzük, a fény bal-fent-elölről jön,
//  a lapok tónusa a felület normálisából számolódik, és azonos tónusú lapok egy útvonalba (path) vonódnak össze.
//  Futtatás: node tools/art-render.js 2d docs/rajzolas/minta/ledizzo/matrica.js ki.png
// ============================================================
(function(){
const REPO = require('path').join(__dirname, '../../../../');
if(typeof ART === 'undefined') global.ART = require(REPO + 'web/js/art/art.js');
const P = require(__dirname + '/profil.js');
const { rad, band } = ART.geo;
const r1 = n => Math.round(n * 10) / 10;
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const LIGHT = norm([-0.5, 0.65, 0.55]);   // bal-fent-elöl (modell-tér: X jobbra, Y fel, Z a néző felé)
const EDGE_IN = 0.85;                     // a tónus-lapok ennyivel húzódnak be a sziluettől, hogy a kontúr teljes vastagságban látsszon

// ---------- 2D segédek ----------
const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const orient = (poly, sign) => (Math.sign(area(poly)) === sign ? poly : [...poly].reverse());
const pathOf = polys => polys.filter(p => p && p.length > 2)
  .map(p => 'M' + p.map(q => `${r1(q[0])} ${r1(q[1])}`).join(' L') + ' Z').join(' ');
function hull(pts){
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// a sziluett közelében lévő pontok behúzása a sziluett belsejébe (d egységre) – így a lapok nem takarják le a kontúrt
function inset(pts, sil, d = EDGE_IN){
  const s = Math.sign(area(sil)) || 1, n = sil.length;
  return pts.map(p => {
    let best = null, bd = Infinity;
    for(let i = 0; i < n; i++){
      const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey;
      if(L2 < 1e-9) continue;
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey;
      const dd = Math.hypot(p[0] - qx, p[1] - qy);
      if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:Math.sqrt(L2) }; }
    }
    if(!best || bd >= d) return p;
    const nx = -best.ey / best.L * s, ny = best.ex / best.L * s;   // befelé mutató normális (a körüljárás irányából)
    return [best.qx + nx * d, best.qy + ny * d];
  });
}
// konvex tartomány körvonala sugár-kereséssel: test(x,y) igaz a tartományon belül
function region(test, n = 80){
  let sx = 0, sy = 0, k = 0;
  for(let x = 0; x <= 100; x += 1.25) for(let y = 0; y <= 100; y += 1.25) if(test(x, y)){ sx += x; sy += y; k++; }
  if(!k) return null;
  const cx = sx / k, cy = sy / k, out = [];
  for(let i = 0; i < n; i++){
    const a = 2 * Math.PI * i / n, dx = Math.cos(a), dy = Math.sin(a); let lo = 0, hi = 70;
    for(let j = 0; j < 28; j++){ const m = (lo + hi) / 2; if(test(cx + dx * m, cy + dy * m)) lo = m; else hi = m; }
    out.push([cx + dx * lo, cy + dy * lo]);
  }
  return out;
}

// ---------- vetítés: modell (cm) → matrica-rács (100×100) ----------
function view(phiDeg, H){
  const f = rad(phiDeg), c = Math.cos(f), s = Math.sin(f);
  const top = P.dome.yc * c + P.dome.R, bot = -P.tip[0][0] * s;   // a búra teteje és a csúcs elülső alja a nézetben
  const S = H / (top - bot), mid = (top + bot) / 2, V = [0, s, c];
  const pr = (X, Y, Z) => [50 + S * X, 50 - S * (Y * c - Z * s - mid)];
  const ring = (r, Y, th) => pr(r * Math.sin(th), Y, r * Math.cos(th));
  return { S, c, s, V, mid, pr, ring };
}

// forgástest sima tónus-sávokkal (B): rings = [[r, Y], …] alulról; tone(s) → tónus-kulcs
function smoothLathe(v, rings, tone, step = 3){
  const deg = t => rad(t), sil = [];
  for(let i = rings.length - 1; i >= 0; i--) sil.push(v.ring(rings[i][0], rings[i][1], deg(-90)));
  for(let t = -90; t <= 90; t += 6) sil.push(v.ring(rings[0][0], rings[0][1], deg(t)));
  for(let i = 0; i < rings.length; i++) sil.push(v.ring(rings[i][0], rings[i][1], deg(90)));
  for(let t = 96; t <= 264; t += 12) sil.push(v.ring(rings[rings.length - 1][0], rings[rings.length - 1][1], deg(t)));
  const bands = {};
  for(let i = 0; i < rings.length - 1; i++){
    const [ra, ya] = rings[i], [rb, yb] = rings[i + 1], [nr, ny] = norm([yb - ya, -(rb - ra)]);
    const key = t => tone(nr * Math.sin(deg(t)) * LIGHT[0] + ny * LIGHT[1] + nr * Math.cos(deg(t)) * LIGHT[2]);
    let start = -90, cur = key(-90 + step / 2);
    for(let t = -90 + step; t <= 90; t += step){
      const k = t < 90 ? key(t + step / 2) : '__end';
      if(k !== cur){
        if(cur){ const poly = [];
          for(let u = start; u <= t; u += step) poly.push(v.ring(rb, yb, deg(u)));
          for(let u = t; u >= start; u -= step) poly.push(v.ring(ra, ya, deg(u)));
          (bands[cur] = bands[cur] || []).push(poly); }
        start = t; cur = k;
      }
    }
  }
  return { sil, bands };
}

// háló-lapok (C): faces = [[p3d, …], …] kívülről nézve az óramutatóval ellentétes körüljárással
function shadeFaces(v, faces, tone){
  const out = {};
  for(const f of faces){
    let n = [0, 0, 0];   // Newell-normális (négyszögre is)
    for(let i = 0; i < f.length; i++){ const a = f[i], b = f[(i + 1) % f.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
    n = norm(n);
    if(dot(n, v.V) <= 0.02) continue;          // hátsó lap
    const k = tone(dot(n, LIGHT), n); if(!k) continue;
    (out[k] = out[k] || []).push(f.map(p => v.pr(...p)));
  }
  return out;
}
// esztergált rács → négyszög-lapok; grid[i][k] = [X,Y,Z], k körbe (seg db), i alulról felfelé
function gridFaces(grid){
  const faces = [];
  for(let i = 0; i < grid.length - 1; i++) for(let k = 0; k < grid[i].length; k++){
    const k2 = (k + 1) % grid[i].length;
    faces.push([grid[i][k], grid[i][k2], grid[i + 1][k2], grid[i + 1][k]]);
  }
  return faces;
}
const ringPts = (r, Y, seg, off = 0, fn) => Array.from({ length:seg }, (_, k) => {
  const th = (k + off) / seg * 2 * Math.PI, rr = fn ? fn(k, th) : r;
  return [rr * Math.sin(th), Y, rr * Math.cos(th)];
});
// zegzugos oldalú sziluett (menetes talp): gyűrűnkénti szélső pontok + alsó elülső ív + felső hátsó ív
function ringSil(v, grid){
  const G = grid.map(ring => ring.map(p => ({ q:v.pr(...p), z:p[2] })));
  const L = G.map(r => r.reduce((a, b) => (b.q[0] < a.q[0] ? b : a)).q), R = G.map(r => r.reduce((a, b) => (b.q[0] > a.q[0] ? b : a)).q);
  const front = G[0].filter(o => o.z >= -1e-6).map(o => o.q).sort((a, b) => a[0] - b[0]);
  const back = G[G.length - 1].filter(o => o.z <= 1e-6).map(o => o.q).sort((a, b) => b[0] - a[0]);
  return [...L.reverse(), ...front, ...R, ...back];
}

// tónus-lapokból matrica-alakzatok: pal = { kulcs: [anyag, tónus, átlátszóság] }, a sorrend a pal sorrendje
function layers(polysByTone, pal, sil){
  const out = [];
  for(const key of Object.keys(pal)){
    const polys = polysByTone[key]; if(!polys || !polys.length) continue;
    const [m, tone, o] = pal[key];
    out.push(Object.assign({ t:'path', m, tone, line:false, d:true, p:pathOf(polys.map(p => inset(p, sil))) }, o != null ? { o } : {}));
  }
  return out;
}
const silShape = (sil, m, tone) => ({ t:'path', m, tone, p:pathOf([sil]) });

// automatikus kicsinyítés: a megdöntött tárgy (a perem nélkül) férjen a 8–92 tartományba
function fitScale(shapes, tilt){
  const a = rad(tilt), c = Math.cos(a), s = Math.sin(a); let dev = 0;
  for(const sh of shapes){ if(sh.d || sh.t === 'line' || sh.t === 'shine') continue;
    const [x, y, w, h] = ART.bbox(sh);
    for(const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]){
      const dx = px - 50, dy = py - 50; dev = Math.max(dev, Math.abs(dx * c - dy * s), Math.abs(dx * s + dy * c)); } }
  return Math.min(1, Math.floor(42 / dev * 100) / 100);
}

// =====================================================================
//  A – Tiszta ikon: 7 alakzat, 2 anyag (fehér, acél) + 1 kiemelés (sötét szigetelő), alap lapok, 8° döntés
// =====================================================================
(function(){
  const H = P.dome.yc + P.dome.R, S = 84 / H, Y = y => r1(92 - y * S), X = r => r1(r * S);
  const jy = Y(P.dome.jointY), jx = X(P.dome.jointR), nb = Y(P.neck[0][1]), nx = X(P.neck[0][0]);
  const b0 = Y(P.base.y1) , b1 = Y(P.base.y0), bv = X(P.base.valley), bc = X(P.base.crest + 0.32), bh = (b1 - b0) / 3;
  const wav = (side) => [0, 1, 2].map(i => { const ya = side > 0 ? b1 - i * bh : b0 + i * bh, yb = side > 0 ? ya - bh : ya + bh;
    return `Q${r1(50 + side * bc)} ${r1((ya + yb) / 2)} ${r1(50 + side * bv)} ${r1(yb)}`; }).join(' ');
  const shapes = [
    { t:'rect', x:r1(50 - X(0.42)), y:Y(0.45), w:r1(2 * X(0.42)), h:r1(Y(0) - Y(0.45)), r:2.5, m:'steel', fc:'v' },   // csúcs
    { t:'path', m:'dark', p:`M${r1(50 - X(P.ins[1][0]))} ${Y(P.ins[1][1] + 0.1)} H${r1(50 + X(P.ins[1][0]))} L${r1(50 + X(P.ins[0][0]))} ${Y(P.ins[0][1])} H${r1(50 - X(P.ins[0][0]))} Z` },
    { t:'path', m:'steel', fc:'v', p:`M${r1(50 - bv)} ${b0} ${wav(-1)} H${r1(50 + bv)} ${wav(1)} Z` },            // menetes talp (hullámos oldal)
    { t:'path', m:'white', fc:'v', p:`M${r1(50 - jx)} ${jy} H${r1(50 + jx)} L${r1(50 + nx)} ${nb} Q50 ${r1(nb + 2)} ${r1(50 - nx)} ${nb} Z` },   // nyak
    { t:'path', m:'white', p:`M${r1(50 - jx)} ${jy} A${X(P.dome.R)} ${X(P.dome.R)} 0 1 1 ${r1(50 + jx)} ${jy} Q50 ${r1(jy + 3)} ${r1(50 - jx)} ${jy} Z` },   // opál búra
    { t:'line', m:'white', tone:'line', w:2, pts:[[r1(50 - jx * 0.4), r1(jy + 3)], [r1(50 - nx * 0.4), r1(nb - 1.5)]] },   // borda-rovátkák
    { t:'line', m:'white', tone:'line', w:2, pts:[[r1(50 + jx * 0.4), r1(jy + 3)], [r1(50 + nx * 0.4), r1(nb - 1.5)]] },
  ];
  ART.add('ledizzo_a', { emoji:[], hu:'LED-izzó (A – tiszta ikon)', en:'white LED light bulb', shadow:'hard', tilt:8, scale:fitScale(shapes, 8), shapes });
})();

// =====================================================================
//  B – Kidolgozott: 3/4-es nézet (φ = 16°), 4 éles tónus sávokban / fénysapkákban, menet, bordák, csúcs, 1 fénycsík
// =====================================================================
(function(){
  const TILT = 22, v = view(16, 84), shapes = [];
  // csúcs + szigetelő: egyszerű, tónusos formák
  const simple = (rings, m, tone) => { const L = smoothLathe(v, rings, () => null); return silShape(L.sil, m, tone); };
  shapes.push(simple(P.tip, 'steel', 'base'));
  const ins = smoothLathe(v, P.ins, s => (s > 0.35 ? 'light' : null));
  shapes.push(silShape(ins.sil, 'dark', 'base'), ...layers(ins.bands, { light:['dark', 'light'] }, ins.sil));
  // menetes talp: völgy–gerinc profil (4 menet), a lefelé néző lapok maguktól sötétebbek
  const b = P.base, rings = [], NT = 4;
  for(let i = 0; i <= NT * 2; i++) rings.push([i % 2 ? b.crest : b.valley, b.y0 + (b.y1 + 0.22 - b.y0) * i / (NT * 2)]);
  const T4 = s => (s > 0.62 ? 'light' : s > 0.12 ? null : s > -0.3 ? 'dark' : 'edge');
  const base = smoothLathe(v, rings, s => (s > 0.84 ? 'light' : s > 0.36 ? null : s > -0.1 ? 'dark' : 'edge'));
  shapes.push(silShape(base.sil, 'steel', 'base'),
    ...layers(base.bands, { light:['steel', 'light'], dark:['steel', 'dark'], edge:['steel', 'line', 0.55] }, base.sil));
  // nyak: sima tónus-sávok + 5 borda-rovátka
  const neck = smoothLathe(v, P.neck, T4);
  shapes.push(silShape(neck.sil, 'white', 'dark'),
    ...layers(neck.bands, { light:['white', 'base'], dark:['steel', 'dark', 0.55], edge:['white', 'line', 0.45] }, neck.sil));
  const ribs = [-58, -28, 2, 32, 62].map(t => {
    const pts = P.neck.map(([r, y]) => v.ring(r, y, rad(t))); pts[pts.length - 1] = v.ring(P.neck[3][0], P.neck[3][1] - 0.18, rad(t));
    return band(inset(pts, neck.sil, 2.4), 1.9, true); });
  shapes.push({ t:'path', m:'steel', tone:'dark', line:false, d:true, p:pathOf(ribs) });
  // búra: gömbsüveg a nyakon; a tónusok a fény felőli gömbsapkák (konvex tartományok)
  const D = P.dome, domeN = (x, y, pad = 0) => {
    const X = (x - 50) / v.S, yv = v.mid - (y - 50) / v.S, dy = yv - D.yc * v.c, rho2 = X * X + dy * dy, RR = D.R - pad / v.S;
    if(rho2 >= RR * RR) return null;
    const z = Math.sqrt(D.R * D.R - rho2), Yr = dy * v.c + z * v.s, Zr = -dy * v.s + z * v.c;
    if(Yr < D.jointY - D.yc + pad / v.S * 1.4) return null;
    return [X / D.R, Yr / D.R, Zr / D.R];
  };
  const dsil = region((x, y) => !!domeN(x, y), 120), din = region((x, y) => !!domeN(x, y, EDGE_IN), 120);
  const cap = t => region((x, y) => { const n = domeN(x, y, EDGE_IN); return !!n && dot(n, LIGHT) > t; }, 120);
  const cres = t => { const c = cap(t); return 'M' + orient(din, 1).map(q => `${r1(q[0])} ${r1(q[1])}`).join(' L') + ' Z '
    + (c ? 'M' + orient(c, -1).map(q => `${r1(q[0])} ${r1(q[1])}`).join(' L') + ' Z' : ''); };
  shapes.push(silShape(dsil, 'white', 'base'),
    { t:'path', m:'white', tone:'light', line:false, d:true, p:pathOf([cap(0.8)]) },
    { t:'path', m:'white', tone:'dark', line:false, d:true, p:cres(0.28) },
    { t:'path', m:'white', tone:'line', line:false, d:true, o:0.35, p:cres(-0.12) });
  // fénycsík a fém talpon
  const sh = [0.3, 0.55, 0.8].map(f => v.ring(b.crest - 0.02, b.y0 + (b.y1 - b.y0) * f, rad(-52)));
  shapes.push({ t:'path', m:'white', tone:'light', line:false, d:true, o:0.8, p:pathOf([band(sh, 1.8, true)]) });
  ART.add('ledizzo_b', { emoji:[], hu:'LED-izzó (B – kidolgozott)', en:'white LED light bulb', shadow:'hard', tilt:TILT, scale:fitScale(shapes, TILT), shapes });
})();

// =====================================================================
//  C – Gazdag: erősebb 3/4 (φ = 24°), lapokra tört gömb (12 × 6 négyszög-lap, enyhén elmozdítva), egyenkénti hűtőbordák, csavart menet csillanással, perem, szigetelő, csúcs
// =====================================================================
(function(){
  const TILT = 26, v = view(24, 84), shapes = [];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
  const T5 = (a, b, c, d) => s => (s > a ? 'hi' : s > b ? 'light' : s > c ? null : s > d ? 'dark' : 'edge');
  // --- érintkező csúcs: kis kupola, csillanással
  const tipG = [[0.0, -0.14], [0.24, -0.1], [0.4, 0.04], [0.47, 0.36]].map(([r, y]) => ringPts(r, y, 10, 0.5));
  const tipF = shadeFaces(v, gridFaces(tipG), T5(0.8, 0.45, -0.1, -2)), tipS = hull(tipG.flat().map(p => v.pr(...p)));
  shapes.push(silShape(tipS, 'steel', 'base'), ...layers(tipF, { hi:['white', 'light'], light:['steel', 'light'], dark:['steel', 'dark'] }, tipS));
  const tg = v.pr(-0.2, -0.02, 0.3);
  shapes.push({ t:'shine', cx:r1(tg[0]), cy:r1(tg[1]), rx:1.3, ry:0.8, o:0.9 });   // csillanás a csúcson
  // --- szigetelő (fekete üveg) peremmel
  const insG = [[0.7, 0.32], [0.86, 0.55], [0.95, 0.9], [1.02, 0.98]].map(([r, y]) => ringPts(r, y, 14, 0.5));
  const insF = shadeFaces(v, gridFaces(insG), T5(0.75, 0.35, -0.15, -2)), insS = hull(insG.flat().map(p => v.pr(...p)));
  shapes.push(silShape(insS, 'dark', 'base'), ...layers(insF, { hi:['dark', 'light'], light:['dark', 'light', 0.6], dark:['dark', 'dark'] }, insS));
  // --- menetes talp: 5 menet, csavarvonalban megdöntve (elöl látszik a menetemelkedés)
  const b = P.base, NT = 5, SEG = 16, pitch = (b.y1 - b.y0) / NT, baseG = [];
  for(let i = 0; i <= NT * 2; i++){
    const y = b.y0 + (b.y1 - b.y0) * i / (NT * 2), inner = i > 0 && i < NT * 2;
    baseG.push(ringPts(0, 0, SEG, 0, () => 0).map((_, k) => {
      const th = k / SEG * 2 * Math.PI, a = ((th + Math.PI) % (2 * Math.PI)) - Math.PI;   // −π … π, a hátoldalon ugrik
      const r = i % 2 ? b.crest : b.valley, yy = y + (inner ? pitch * a / (2 * Math.PI) * 0.9 : 0);
      return [r * Math.sin(th), yy, r * Math.cos(th)];
    }));
  }
  const baseF = shadeFaces(v, gridFaces(baseG), T5(0.84, 0.62, 0.3, -0.05)), baseS = ringSil(v, baseG);
  shapes.push(silShape(baseS, 'steel', 'base'),
    ...layers(baseF, { hi:['white', 'light'], light:['steel', 'light'], dark:['steel', 'dark'], edge:['steel', 'line', 0.6] }, baseS));
  // menet-csillanás: a gerincek bal-elülső szakaszán vékony fehér csík
  const glints = [];
  for(let i = 1; i < NT * 2; i += 2){
    const y = b.y0 + (b.y1 - b.y0) * i / (NT * 2), pts = [];
    for(let t = -74; t <= -30; t += 11){ const a = rad(t); pts.push(v.pr(b.crest * Math.sin(a), y + pitch * a / (2 * Math.PI) * 0.9 + 0.05, b.crest * Math.cos(a))); }
    glints.push(band(inset(pts, baseS, 1.6), 1.1, true));
  }
  shapes.push({ t:'path', m:'white', tone:'light', line:false, d:true, o:0.9, p:pathOf(glints) });
  // --- perem (a talp peremezése)
  const colG = [[1.4, 3.36], [1.5, 3.42], [1.52, 3.64]].map(([r, y]) => ringPts(r, y, SEG, 0.5));
  const colF = shadeFaces(v, gridFaces(colG), T5(0.8, 0.45, 0.0, -0.35)), colS = hull(colG.flat().map(p => v.pr(...p)));
  shapes.push(silShape(colS, 'steel', 'base'), ...layers(colF, { hi:['white', 'light'], light:['steel', 'light'], dark:['steel', 'dark'], edge:['steel', 'line', 0.5] }, colS));
  // --- nyak: 14 egyenkénti hűtőborda (csillag-keresztmetszet: gerinc–völgy váltakozik)
  const FINS = 12, fin = 0.3;
  const neckG = P.neck.map(([r, y], i) => ringPts(r, y, FINS * 2, 0, k => (k % 2 ? r : r + fin * (i === P.neck.length - 1 ? 0.3 : 1))));
  const neckF = shadeFaces(v, gridFaces(neckG), T5(0.7, 0.4, 0.05, -0.35)), neckS = hull(neckG.flat().map(p => v.pr(...p)));
  shapes.push(silShape(neckS, 'white', 'dark'),
    ...layers(neckF, { hi:['white', 'light'], light:['white', 'base'], dark:['steel', 'dark', 0.65], edge:['white', 'line', 0.55] }, neckS));
  // bordák gerince: a fény felőli bordákon fehér él, a többin sötét árnyék-vonal a borda mellett
  const crest = [], groove = [];
  for(let k = 0; k < FINS; k++){
    const th = k / FINS * 2 * Math.PI, deg = ((th * 180 / Math.PI + 180) % 360) - 180;
    if(Math.abs(deg) > 80) continue;
    const pts = P.neck.slice(0, 3).map(([r, y]) => v.ring(r + fin, y, th)).concat([v.ring(P.neck[3][0] + fin * 0.3, P.neck[3][1] - 0.15, th)]);
    if(deg < 20) crest.push(band(inset(pts, neckS, 1.6), 1.0, true));
    const g = P.neck.slice(0, 3).map(([r, y]) => v.ring(r, y, th + Math.PI / FINS)).concat([v.ring(P.neck[3][0], P.neck[3][1] - 0.15, th + Math.PI / FINS)]);
    if(deg > -60 && deg < 60) groove.push(band(inset(g, neckS, 1.8), 1.1, true));
  }
  shapes.push({ t:'path', m:'steel', tone:'dark', line:false, d:true, p:pathOf(groove) },
    { t:'path', m:'white', tone:'light', line:false, d:true, p:pathOf(crest) });
  // --- opál búra: lapokra tört gömbsüveg (eltolt gyűrűk, enyhe véletlen elmozdítás), finom tónusokkal
  const D = P.dome, lat = [-36.2, -14, 8, 30, 52, 74, 90].map(rad), SEGD = 12;
  const domeRings = lat.map((a, i) => {
    if(i === lat.length - 1) return [[0, D.yc + D.R, 0]];
    return Array.from({ length:SEGD }, (_, k) => {
      const th = (k + 0.5) / SEGD * 2 * Math.PI, j = i === 0 ? 0 : 0.05, aa = a + rnd() * j, tt = th + rnd() * j * 1.5;
      return [D.R * Math.cos(aa) * Math.sin(tt), D.yc + D.R * Math.sin(aa), D.R * Math.cos(aa) * Math.cos(tt)];
    });
  });
  const domeFaces = [];
  for(let i = 0; i < domeRings.length - 1; i++){
    const A = domeRings[i], B = domeRings[i + 1];
    if(B.length === 1){ for(let k = 0; k < A.length; k++) domeFaces.push([A[k], A[(k + 1) % A.length], B[0]]); continue; }
    for(let k = 0; k < A.length; k++){
      const k2 = (k + 1) % A.length;
      domeFaces.push([A[k], A[k2], B[k2], B[k]]);   // szélességi–hosszúsági négyszög-lapok (a zegzugos háromszögeknél nyugodtabb)
    }
  }
  const domeF = shadeFaces(v, domeFaces, s => (s > 0.74 ? 'light' : s > 0.4 ? null : s > 0.12 ? 'mid' : s > -0.15 ? 'dark' : 'edge'));
  const domeS = hull(domeRings.flat().map(p => v.pr(...p)));
  shapes.push(silShape(domeS, 'white', 'base'),
    ...layers(domeF, { light:['white', 'light'], mid:['white', 'dark', 0.5], dark:['white', 'dark'], edge:['white', 'line', 0.3] }, domeS));
  ART.add('ledizzo_c', { emoji:[], hu:'LED-izzó (C – gazdag)', en:'white LED light bulb', shadow:'hard', tilt:TILT, scale:fitScale(shapes, TILT), shapes });
})();
})();
