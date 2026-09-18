// ============================================================
//  LED-izzó 3D modell – három kidolgozottsági szint (GLB) – ugyanabból a profilból, mint a matricák (profil.js)
//    ledizzo_a.glb  Minimál   – 8 szeletes esztergált testek, 4 szín, 176 háromszög
//    ledizzo_b.glb  Közepes   – 16 szelet, gömbösebb búra, 4 menetgyűrű, 8 hűtőborda, csúcs – 800 háromszög
//    ledizzo_c.glb  Részletes – 24–28 szelet, csavarvonalas menet, 16 kétszakaszos borda, perem, szigetelő, csúcs – 2 424 háromszög
//  Futtatás: node modell.js   (majd: node ../render.js 3d ledizzo_c.glb 3d_c.png 32 18 3.1)
// ============================================================
const G = require('../../../../tools/modell-kit.js'), P = require('./profil.js');
const OUT = process.argv[2] || require('os').tmpdir();   // a GLB-k ide kerülnek: node <fájl> <mappa>
const rad = d => d * Math.PI / 180;

// esztergált test, a sapkák (lapos alj/tető) kérésre – ahol egy másik rész takarja, ott elhagyjuk (kevesebb háromszög)
function lathe(prof, seg, caps = {}){
  const y0 = prof[0][1], y1 = prof[prof.length - 1][1], onAxis = p => Math.abs(p[0]) < 1e-9 && Math.abs(p[2]) < 1e-9;
  return G.lathe(prof, seg).filter(t => {
    const flat = Math.abs(t[0][1] - t[1][1]) < 1e-9 && Math.abs(t[1][1] - t[2][1]) < 1e-9;
    if(!flat || !t.some(onAxis)) return true;                         // palást vagy csúcs-legyező: marad
    if(Math.abs(t[0][1] - y0) < 1e-9 && prof[0][0] > 1e-9) return !!caps.bottom;
    if(Math.abs(t[0][1] - y1) < 1e-9 && prof[prof.length - 1][0] > 1e-9) return !!caps.top;
    return true;
  });
}
// gömbsüveg-profil a búrához: n szakasz a nyak-illesztéstől a tetőpontig
const domeProfile = n => { const D = P.dome, a0 = Math.asin((D.jointY - D.yc) / D.R);
  return Array.from({ length:n + 1 }, (_, i) => { const a = a0 + (Math.PI / 2 - a0) * i / n; return [i === n ? 0 : D.R * Math.cos(a), D.yc + D.R * Math.sin(a)]; }); };
// menetes talp profilja: völgy–gerinc váltakozva, alul a peremgyűrű (alulról látszik)
const threadProfile = (turns, y1) => { const b = P.base, out = [[1.0, b.y0], [b.valley, b.y0 + 0.02]];
  for(let i = 1; i <= turns * 2; i++) out.push([i % 2 ? b.crest : b.valley, b.y0 + 0.02 + (y1 - b.y0 - 0.02) * i / (turns * 2)]);
  return out; };
// hűtőborda: keskeny, a nyak profilját követő lap (szakaszonként egy konvex test) az a szögben
function fin(a, prof, height, thick){
  const tris = [], dir = [Math.sin(a), 0, Math.cos(a)], tan = [Math.cos(a), 0, -Math.sin(a)];
  for(let s = 0; s < prof.length - 1; s++){
    const pts = [];
    for(const q of [s, s + 1]){ const [r, y] = prof[q], hh = Array.isArray(height) ? height[q] : height; for(const rr of [r - 0.06, r + hh]) for(const t of [-thick / 2, thick / 2])
      pts.push([dir[0] * rr + tan[0] * t, y, dir[2] * rr + tan[2] * t]); }
    tris.push(...G.hull(pts));
  }
  return tris;
}
// csavarvonalas menet (C): háromszög-keresztmetszet végigsöpörve, a két végén elvékonyodik → nem kell zárólap
function helix(turns, seg, yStart, yEnd, rCore, rCrest, halfH){
  const steps = turns * seg, pitch = (yEnd - yStart) / turns, tris = [], sec = [];
  for(let u = 0; u <= steps; u++){
    const a = u / seg * 2 * Math.PI, y = yStart + pitch * u / seg, taper = Math.min(1, u / (seg * 0.5), (steps - u) / (seg * 0.5));
    const P3 = (r, yy) => [r * Math.sin(a), yy, r * Math.cos(a)], h = halfH * (0.35 + 0.65 * taper);
    sec.push([P3(rCore - 0.03, y - h), P3(rCore + (rCrest - rCore) * taper, y), P3(rCore - 0.03, y + h)]);
  }
  for(let u = 0; u < steps; u++) for(let f = 0; f < 2; f++){
    const a = sec[u][f], b = sec[u + 1][f], c = sec[u + 1][f + 1], d = sec[u][f + 1];
    for(const t of [[a, b, c], [a, c, d]]){   // kifelé forduló körüljárás (a radiális irányhoz igazítva)
      const n = [0, 1, 2].map(k => { const e1 = t[1].map((v, q) => v - t[0][q]), e2 = t[2].map((v, q) => v - t[0][q]); return [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]][k]; });
      const m = t[0].map((v, q) => (v + t[1][q] + t[2][q]) / 3);
      tris.push(n[0] * m[0] + n[2] * m[2] >= 0 ? t : [t[0], t[2], t[1]]);
    }
  }
  return tris;
}
const neckProf = P.neck.map(([r, y], i) => [r - 0.05, y + (i === 0 ? -0.04 : i === P.neck.length - 1 ? 0.02 : 0)]);

// ---------------- A – Minimál ----------------
(() => {
  const m = G.model(), S = 8;
  m.add(lathe([[0, -0.08], [0.4, 0.34]], S), { color:'steel:2' });                                   // csúcs (legyező)
  m.add(lathe([[0.4, 0.3], [1.0, 0.99]], S), { color:'dark:1' });                                    // szigetelő
  m.add(lathe([[1.0, 0.95], [1.3, 0.97], [1.46, 1.6], [1.3, 2.25], [1.46, 2.95], [1.3, 3.66]], S), { color:'steel:2' });   // talp, 2 menet
  m.add(lathe([[1.5, 3.58], [2.42, 5.92]], S, { bottom:true }), { color:'white:2' });                // nyak
  m.add(lathe(domeProfile(3), S, { bottom:true }), { color:'white:1' });   // zárt alj: ne szűrődjön át fény a nyak és a búra között                                               // búra
  console.log('A', m.save(OUT + '/ledizzo_a.glb'));
})();

// ---------------- B – Közepes ----------------
(() => {
  const m = G.model(), S = 16;
  m.add(lathe([[0, -0.1], [0.3, -0.05], [0.45, 0.34]], S), { color:'steel:1' });
  m.add(lathe([[0.45, 0.3], [0.74, 0.36], [1.0, 0.99]], S), { color:'dark:1' });
  m.add(lathe(threadProfile(4, 3.66), S), { color:'steel:2' });
  m.add(lathe(neckProf, S, { bottom:true }), { color:'white:2' });
  for(let k = 0; k < 8; k++) m.add(fin(rad(k * 45 + 22.5), [neckProf[0], neckProf[3]].map(([r, y], i) => [r + (i ? -0.02 : 0.02), y + (i ? -0.12 : 0.1)]), [0.14, 0.05], 0.12), { color:'white:0' });
  m.add(lathe(domeProfile(6), S, { bottom:true }), { color:'white:1' });
  console.log('B', m.save(OUT + '/ledizzo_b.glb'));
})();

// ---------------- C – Részletes ----------------
(() => {
  const m = G.model(), S = 24, b = P.base;
  m.add(lathe([[0, -0.14], [0.24, -0.1], [0.4, 0.04], [0.47, 0.34]], 20), { color:'steel:1' });      // forraszpötty-csúcs
  m.add(lathe([[0.46, 0.3], [0.74, 0.36], [0.9, 0.7], [0.98, 0.9], [1.04, 0.99]], S), { color:'dark:1' });   // fekete üveg szigetelő
  m.add(lathe([[1.02, 0.95], [1.28, 0.98], [1.28, 3.42]], S), { color:'steel:3' });                  // menet-mag
  m.add(helix(5, S, b.y0 + 0.2, 3.22, 1.28, b.crest + 0.02, 0.19), { color:'steel:2' });            // csavarvonalas menet
  m.add(lathe([[1.28, 3.36], [1.48, 3.4], [1.53, 3.5], [1.53, 3.62], [1.45, 3.68]], S), { color:'steel:1' });   // peremezés
  m.add(lathe(neckProf, S, { bottom:true }), { color:'white:2' });                                   // nyak-mag
  for(let k = 0; k < 16; k++) m.add(fin(rad(k * 22.5), neckProf.map(([r, y], i) => [r, y + (i === 0 ? 0.1 : i === 3 ? -0.2 : 0)]), [0.17, 0.16, 0.12, 0.04], 0.08), { color:'white:0' });   // egyenkénti bordák
  m.add(lathe([[2.3, 5.78], [2.48, 5.84], [2.5, 5.96], [2.36, 6.04]], S), { color:'white:2' });      // illesztő perem a búra alatt
  m.add(lathe(domeProfile(9), 28), { color:'white:1' });                                             // opál búra
  console.log('C', m.save(OUT + '/ledizzo_c.glb'));
})();
