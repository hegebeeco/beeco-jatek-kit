// ============================================================
//  Mosógép – három kidolgozottsági szint (próba): A tiszta ikon · B kidolgozott · C gazdag
//  A B és C szint egy kis 3D-vetítésből épül: a gépet méterben írjuk le (0,60 × 0,85 × 0,60), és minden pontot
//  ugyanaz a kamera vetít a 100×100-as rácsra – így az ajtó ellipszise, a fiók és a gomb pontosan az előlapon ül.
// ============================================================
(function(){
  const { r1, rad } = ART.geo;
  const W = .60, H = .85, D = .60, X = W / 2, Z = D / 2;   // méret (m); X, Z = fél szélesség / fél mélység

  // ---- kamera: az (jobbra, fok), el (felülről, fok), F (távolság m – kisebb = erősebb perspektíva) ----
  // a vetítés úgy illeszti a tárgyat, hogy a MEGDÖNTÖTT (tilt) matrica befoglalója a 100-as rács közepén, span méretben legyen
  function camera(o){
    const a = rad(o.az), e = rad(o.el);
    const C = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
    const RT = [Math.cos(a), 0, -Math.sin(a)], UP = [-Math.sin(a) * Math.sin(e), Math.cos(e), -Math.cos(a) * Math.sin(e)];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const raw = p => { const q = [p[0], p[1] - H / 2, p[2]], f = o.F / (o.F - dot(q, C)); return [dot(q, RT) * f, -dot(q, UP) * f]; };
    const t = rad(o.tilt), ct = Math.cos(t), st = Math.sin(t);
    const rot = ([x, y]) => [ct * x - st * y, st * x + ct * y], unrot = ([x, y]) => [ct * x + st * y, -st * x + ct * y];
    const U = o.fit.map(p => rot(raw(p))), xs = U.map(u => u[0]), ys = U.map(u => u[1]);
    const k = Math.min(o.span / (Math.max(...xs) - Math.min(...xs)), o.span / (Math.max(...ys) - Math.min(...ys)));
    const T = unrot([-k * (Math.max(...xs) + Math.min(...xs)) / 2, -k * (Math.max(...ys) + Math.min(...ys)) / 2]);
    const P = p => { const r = raw(p); return [r1(50 + T[0] + k * r[0]), r1(50 + T[1] + k * r[1])]; };
    P.k = k; return P;
  }
  // a doboz sarkai (+ a lábak alja) az illesztéshez
  const corners = [];
  for(const x of [-X, X]) for(const y of [-.03, H]) for(const z of [-Z, Z]) corners.push([x, y, z]);

  const cornersC = corners.map(([x, y, z]) => [x, y < 0 ? -.05 : y, z]);   // C: magasabb lábak

  // ---- 2D segédek (előlap-koordináta: u vízszintes, v függőleges, méterben) ----
  const circ = (cx, cy, r, n = 28, a0 = 0) => Array.from({ length:n }, (_, i) => { const a = rad(a0) + 2 * Math.PI * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  // körgyűrű-cikk (fok: 0 = jobbra, 90 = fel)
  const sector = (cx, cy, r0, r1_, a0, a1, n = 10) => {
    const arcP = (r, s, e) => Array.from({ length:n + 1 }, (_, i) => { const a = rad(s + (e - s) * i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
    return [...arcP(r1_, a0, a1), ...arcP(r0, a1, a0)];
  };
  // hullámos víztömeg: a hullámvonal alatti rész, a kör (konvex) sokszögére vágva – Sutherland–Hodgman
  function clip(subject, clipPoly){
    const area = clipPoly.reduce((s, p, i) => { const q = clipPoly[(i + 1) % clipPoly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), sg = Math.sign(area);
    const inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < clipPoly.length && out.length; i++){
      const a = clipPoly[i], b = clipPoly[(i + 1) % clipPoly.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); }
    }
    return out;
  }
  const wave = (x0, x1, lvl, amp, per, ph = 0, n = 16) => Array.from({ length:n + 1 }, (_, i) => { const u = x0 + (x1 - x0) * i / n; return [u, lvl + amp * Math.sin((u - x0) / per * 2 * Math.PI + ph)]; });
  const water = (cx, cy, r, lvl, amp, per, ph) => clip([...wave(cx - r - .02, cx + r + .02, lvl, amp, per, ph), [cx + r + .02, cy - r - .02], [cx - r - .02, cy - r - .02]], circ(cx, cy, r, 32));
  // ruhadarab: hullámos szélű folt
  const blob = (cx, cy, rx, ry, deg, wob, ph, n = 16) => Array.from({ length:n }, (_, i) => {
    const a = 2 * Math.PI * i / n, k = 1 + wob * Math.sin(3 * a + ph) + wob * .5 * Math.sin(5 * a + ph * 2), x = rx * k * Math.cos(a), y = ry * k * Math.sin(a), t = rad(deg);
    return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]; });
  // konvex burok (henger-sziluett: az elülső és hátsó ellipszis pontjaiból)
  function hull2(pts){
    const P = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const p of P){ while(lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for(const p of P.reverse()){ while(up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return [...lo.slice(0, -1), ...up.slice(0, -1)];
  }
  // doboz a térben → a vetített sziluettje
  const box3 = (P, x0, x1, y0, y1, z0, z1) => { const q = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) q.push(P([x, y, z])); return hull2(q); };

  // =====================================================================
  //  A – TISZTA IKON: szemből, 7 alakzat, fehér + acél + víz (kiemelő szín), 2 díszjel
  // =====================================================================
  ART.add('mosogep_a', { emoji:[], hu:'mosógép (A – tiszta ikon)', en:'front loading washing machine', tilt:-6, scale:.9, shadow:'hard', shapes:[
    { t:'rect', x:19, y:8, w:62, h:84, r:7, m:'white' },                              // géptest (alap lapokkal)
    { t:'line', pts:[[20, 26], [80, 26]], m:'white', w:2 },                           // kezelősáv vonala (1. díszjel)
    { t:'rect', x:25, y:13.5, w:19, h:8, r:2, m:'steel', fc:'h' },                     // mosószer-fiók
    { t:'circle', cx:70, cy:17.5, r:5, m:'steel' },                                   // programkapcsoló
    { t:'circle', cx:50, cy:58, r:25, m:'steel' },                                    // ajtókeret
    { t:'circle', cx:50, cy:58, r:18, m:'water' },                                    // üvegablak vízzel (kiemelő szín)
    { t:'shine', cx:42.5, cy:49.5, rx:3, ry:7.5, rot:40 },                            // csillanás (2. díszjel)
  ]});
  const shineAt = (c, rx, ry, rot, o) => ({ t:'shine', cx:c[0], cy:c[1], rx, ry, rot, o });

  // =====================================================================
  //  B – KIDOLGOZOTT: 3/4-es nézet (teteje + jobb oldala látszik), 4 tónus, megdöntve
  //  tónusok: teteje világos · eleje alap (+ lapok) · oldala sötét · hátsó élsáv legsötétebb
  // =====================================================================
  (function(){
    const TILT = -15, P = camera({ az:20, el:15, F:5, tilt:TILT, span:80, fit:corners });
    const F = (pts, dz = 0) => pts.map(([u, v]) => P([u, v, Z + dz]));
    const dc = [0, .39], RD = .035, glass = circ(dc[0], dc[1], .162, 28);           // ajtó közepe, a keret kiállása, üveg
    ART.add('mosogep_b', { emoji:[], hu:'mosógép (B – kidolgozott)', en:'front loading washing machine', tilt:TILT, shadow:'hard', shapes:[
      { t:'poly', m:'white', fc:'none', tone:'dark', pts:[[X, 0, Z], [X, 0, -Z], [X, H, -Z], [X, H, Z]].map(P) },           // oldala (sötét)
      { t:'poly', m:'steel', fc:'none', tone:'base', o:.55, line:false, d:true, pts:[[X, 0, Z], [X, 0, -Z], [X, .5, -Z]].map(P) },  // oldal-lap
      { t:'poly', m:'white', tone:'line', o:.5, line:false, d:true, pts:[[X, 0, -Z + .09], [X, 0, -Z], [X, H, -Z], [X, H, -Z + .09]].map(P) },   // legsötétebb élsáv
      { t:'poly', m:'white', fc:'none', tone:'light', pts:[[-X, H, Z], [X, H, Z], [X, H, -Z], [-X, H, -Z]].map(P) },        // teteje (világos)
      { t:'poly', m:'white', pts:F([[-X, 0], [X, 0], [X, H], [-X, H]]) },                                                  // eleje (alap + lapok)
      { t:'line', pts:F([[-X + .015, .715], [X - .015, .715]]), m:'white', w:1.6 },                                         // kezelősáv
      { t:'poly', m:'steel', fc:'h', d:true, pts:F([[-.25, .745], [-.07, .745], [-.07, .815], [-.25, .815]], .01) },      // mosószer-fiók
      { t:'poly', m:'leaf', fc:'none', tone:'light', line:false, d:true, pts:F(circ(-.005, .78, .018, 10), .005) },          // jelzőfények
      { t:'poly', m:'honey', fc:'none', tone:'base', line:false, d:true, pts:F(circ(.045, .78, .018, 10), .005) },
      { t:'poly', m:'steel', d:true, pts:F(circ(.19, .78, .05, 20), .015) },                                              // programkapcsoló
      { t:'line', pts:F([[.19, .78], [.163, .816]], .015), m:'steel', w:1.8 },
      { t:'poly', m:'steel', fc:'none', tone:'dark', d:true, pts:hull2([...F(circ(dc[0], dc[1], .23, 28)), ...F(circ(dc[0], dc[1], .23, 28), RD)]) },   // ajtókeret vastagsága
      { t:'poly', m:'steel', d:true, pts:F(circ(dc[0], dc[1], .23, 28), RD) },                                             // ajtókeret
      { t:'poly', m:'glass', fc:'none', tone:'base', d:true, pts:F(glass, RD) },                                          // üveg
      { t:'poly', m:'water', fc:'h', line:false, d:true, pts:F(water(dc[0], dc[1], .162, .37, .014, .11, 0), RD) },       // víz
      { t:'poly', m:'pink', d:true, pts:F(clip(blob(-.055, .375, .092, .052, -28, .12, 1), glass), RD) },                 // ruhák a vízben
      { t:'poly', m:'honey', d:true, pts:F(clip(blob(.085, .3, .05, .034, 35, .12, 2.5), glass), RD) },
      shineAt(P([-.085, .47, Z + RD]), 2.4, 6.5, 35),                                                                       // üveg-csillanás
      shineAt(P([-.16, .55, Z + RD]), 1.5, 3.4, 35, .75),                                                                  // keret-csillanás
    ]});
  })();

  // =====================================================================
  //  C – GAZDAG: erősebb perspektíva, lapokra tört felületek, letört élek, lábak, fogantyú, vízvonal, buborék, tükröződés
  // =====================================================================
  (function(){
    const TILT = -14, P = camera({ az:24, el:18, F:3.4, tilt:TILT, span:81, fit:cornersC });
    const F = (pts, dz = 0) => pts.map(([u, v]) => P([u, v, Z + dz]));
    const c = .026, dc = [0, .39], RD = .04, glass = circ(dc[0], dc[1], .162, 32);   // élletörés, ajtó közepe, a keret kiállása, üveg
    const drawer = [[-.25, .745], [-.07, .745], [-.07, .815], [-.25, .815]];
    ART.add('mosogep_c', { emoji:[], hu:'mosógép (C – gazdag)', en:'front loading washing machine', tilt:TILT, shadow:'hard', shapes:[
      // lábak (a test előtt, hogy a tetejüket a test takarja)
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:box3(P, .17, .26, -.05, .01, -.26, -.17) },
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:box3(P, -.27, -.18, -.05, .01, .17, .26) },
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:box3(P, .17, .26, -.05, .01, .17, .26) },
      // test: oldala, teteje, eleje
      { t:'poly', m:'white', fc:'none', tone:'dark', pts:[[X, 0, Z], [X, 0, -Z], [X, H, -Z], [X, H, Z]].map(P) },
      { t:'poly', m:'white', fc:'none', tone:'light', pts:[[-X, H, Z], [X, H, Z], [X, H, -Z], [-X, H, -Z]].map(P) },
      { t:'poly', m:'white', fc:'none', tone:'base', pts:F([[-X, 0], [X, 0], [X, H], [-X, H]]) },
      // lapokra tört felületek: oldal-szilánkok, hátsó élsáv, tető-szilánk, előlap világos/sötét szilánkja, lábazat
      { t:'poly', m:'steel', fc:'none', tone:'base', o:.8, line:false, d:true, pts:[[X, 0, Z - c], [X, 0, -Z], [X, .6, -Z]].map(P) },
      { t:'poly', m:'white', tone:'line', o:.5, line:false, d:true, pts:[[X, 0, -Z + .07], [X, 0, -Z], [X, H, -Z], [X, H, -Z + .07]].map(P) },
      { t:'poly', m:'white', fc:'none', tone:'base', line:false, d:true, pts:[[X - c, H, -Z], [X - c, H, 0], [-.1, H, -Z]].map(P) },
      { t:'poly', m:'white', fc:'none', tone:'light', line:false, d:true, pts:F([[-X, H - c], [.12, H - c], [-.08, .6], [-X, .26]]) },
      { t:'poly', m:'white', fc:'none', tone:'dark', o:.85, line:false, d:true, pts:F([[X - c, .5], [X - c, .06], [.02, .06]]) },
      { t:'poly', m:'steel', fc:'none', tone:'base', line:false, d:true, pts:F([[-X, 0], [X - c, 0], [X - c, .06], [-X, .06]]) },
      { t:'line', pts:F([[-X + .01, .06], [X - c, .06]]), m:'steel', tone:'dark', w:1.1 },
      // letört élek: keskeny csíkok az éleken (a felső és a jobb első él fényt kap)
      { t:'poly', m:'white', fc:'none', tone:'light', line:false, d:true, pts:[[-X + .01, H - c, Z], [X - c, H - c, Z], [X, H - c, Z - c], [X - c, H, Z - c], [-X + .01, H, Z - c]].map(P) },
      { t:'poly', m:'steel', fc:'none', tone:'light', line:false, d:true, pts:[[X - c, .01, Z], [X - c, H - c, Z], [X, H - c, Z - c], [X, .01, Z - c]].map(P) },
      // kezelősáv: horony, fiók + fogantyú-mélyedés, jelzőfények, gomb
      { t:'line', pts:F([[-X + .015, .715], [X - c, .715]]), m:'white', w:1.3 },
      { t:'poly', m:'steel', fc:'none', tone:'dark', d:true, pts:hull2([...F(drawer), ...F(drawer, .018)]) },
      { t:'poly', m:'steel', fc:'h', d:true, pts:F(drawer, .018) },
      { t:'poly', m:'dark', fc:'none', tone:'dark', line:false, d:true, pts:F([[-.2, .755], [-.12, .755], [-.13, .772], [-.19, .772]], .018) },
      { t:'poly', m:'leaf', fc:'none', tone:'light', line:false, d:true, pts:F(circ(-.01, .78, .019, 10), .005) },
      { t:'poly', m:'honey', fc:'none', tone:'base', line:false, d:true, pts:F(circ(.045, .78, .019, 10), .005) },
      { t:'poly', m:'steel', fc:'none', tone:'dark', d:true, pts:hull2([...F(circ(.19, .78, .052, 20)), ...F(circ(.19, .78, .052, 20), .032)]) },
      { t:'poly', m:'steel', d:true, pts:F(circ(.19, .78, .052, 20), .032) },
      { t:'line', pts:F([[.19, .78], [.162, .818]], .032), m:'dark', tone:'base', w:1.8 },
      // ajtó: keret vastagsága, fémes lapok, belső perem (árnyékos), üveg
      { t:'poly', m:'steel', fc:'none', tone:'dark', d:true, pts:hull2([...F(circ(dc[0], dc[1], .232, 32)), ...F(circ(dc[0], dc[1], .232, 32), RD)]) },
      { t:'poly', m:'steel', fc:'none', tone:'base', d:true, pts:F(circ(dc[0], dc[1], .232, 32), RD) },
      { t:'poly', m:'steel', fc:'none', tone:'light', line:false, d:true, pts:F(sector(dc[0], dc[1], .176, .229, 100, 200), RD) },
      { t:'poly', m:'steel', fc:'none', tone:'dark', line:false, d:true, pts:F(sector(dc[0], dc[1], .176, .229, -80, 10), RD) },
      { t:'poly', m:'steel', fc:'none', tone:'dark', d:true, pts:F(circ(dc[0], dc[1], .176, 32), RD) },
      { t:'poly', m:'glass', fc:'none', tone:'base', line:false, d:true, pts:F(glass, RD) },
      // víz, benne a mosnivaló; elöl áttetsző hullámfodor (o), buborékok
      { t:'poly', m:'water', fc:'h', line:false, d:true, pts:F(water(dc[0], dc[1], .162, .39, .014, .11, 0), RD) },
      { t:'line', pts:F(wave(-.15, .15, .39, .014, .11, .032 / .11 * 2 * Math.PI, 16), RD), m:'water', tone:'light', w:1.6 },
      { t:'poly', m:'pink', d:true, pts:F(clip(blob(-.055, .38, .095, .054, -28, .12, 1), glass), RD) },
      { t:'line', pts:F([[-.115, .37], [-.06, .395], [-.01, .372]], RD), m:'pink', tone:'dark', w:1.4 },
      { t:'poly', m:'honey', d:true, pts:F(clip(blob(.085, .3, .055, .036, 35, .12, 2.5), glass), RD) },
      { t:'poly', m:'water', fc:'none', tone:'light', o:.55, line:false, d:true, pts:F(clip([...wave(-.2, .2, .33, .012, .09, 1, 16), [.2, .2], [-.2, .2]], glass), RD) },
      { t:'poly', m:'paper', fc:'none', tone:'light', line:false, d:true, o:.95, pts:F(circ(-.03, .28, .016, 8), RD) },
      { t:'poly', m:'paper', fc:'none', tone:'light', line:false, d:true, o:.95, pts:F(circ(.02, .25, .01, 8), RD) },
      // árnyék a keret belsejében (bal-fent) és tükröződés az üvegen
      { t:'poly', m:'steel', fc:'none', tone:'line', o:.35, line:false, d:true, pts:F(sector(dc[0], dc[1], .135, .162, 70, 220, 12), RD) },
      { t:'poly', m:'glass', fc:'none', tone:'light', o:.45, line:false, d:true, pts:F(clip([[-.2, .6], [.06, .6], [-.2, .34]], glass), RD) },
      shineAt(P([-.075, .47, Z + RD]), 2.5, 6.8, 35, .7),
      shineAt(P([.03, .5, Z + RD]), 1.2, 2.8, 35, .55),
      // ajtófogantyú (a keret jobb szélén), fém-csillanás
      { t:'poly', m:'steel', d:true, pts:hull2([...F([[.215, .33], [.255, .345], [.255, .435], [.215, .45]], RD), ...F([[.215, .33], [.255, .345], [.255, .435], [.215, .45]], RD + .018)]) },
      shineAt(P([-.165, .55, Z + RD]), 1.5, 3.6, 38, .8),
    ]});
  })();
})();
