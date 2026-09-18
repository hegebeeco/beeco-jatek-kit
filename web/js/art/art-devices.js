// ============================================================
//  Matricák — háztartási gépek, mérőórák, fűtés és hűtés (célzott matricák az Ökos-rejtélyhez)  ·  B szint: docs/rajzolas.md
//  Célzott matricák: emoji:[] – a tartalom név szerint hivatkozik rájuk (pl. "mosogep"), az emoji a saját általános matricáját kapja.
//  Minden tárgy valódi méretből (méter) vetítve (ART.geo.camera): 3/4-es nézet, 4 éles tónus (teteje világos · eleje alap ·
//  oldala sötét · hátsó élsáv legsötétebb), megdöntve, tömör olíva árnyék. Render: node tools/art-render.js 2d … (mintakód: docs/rajzolas/minta)
// ============================================================
(function(){
  const { r1, rad, camera, band, star } = ART.geo;   // közös segédek: web/js/art/art.js

  // ---------------- 2D segédek ----------------
  const circ = (cx, cy, r, n = 20, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => { const a = rad(a0 + 360 * i / n); return [cx + r * Math.cos(a), cy + ry * Math.sin(a)]; });
  const RR = pts => pts.map(p => [r1(p[0]), r1(p[1])]);
  const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => 'M' + RR(p).map(q => q.join(' ')).join(' ') + 'Z').join('');
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // konvex vágás (Sutherland–Hodgman) – víz és ruha az ajtóüvegben, csillanás a kijelzőn
  function clip(subject, cp){
    const area = cp.reduce((s, p, i) => { const q = cp[(i + 1) % cp.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0), sg = Math.sign(area);
    const inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){
      const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); }
    }
    return out;
  }
  // lekerekített téglalap (előlap-koordinátában)
  const rrect = (u0, v0, u1, v1, r) => [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]]
    .flatMap(([cx, cy, a]) => [0, 1, 2].map(k => { const t = rad(a + 45 * k); return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; }));
  // hullámos víztömeg a körben (mosógép) és hullámos szélű ruhadarab
  const wave = (x0, x1, lvl, amp, per, n = 14) => Array.from({ length:n + 1 }, (_, i) => { const u = x0 + (x1 - x0) * i / n; return [u, lvl + amp * Math.sin((u - x0) / per * 2 * Math.PI)]; });
  const water = (cx, cy, r, lvl, amp, per) => clip([...wave(cx - r - .02, cx + r + .02, lvl, amp, per), [cx + r + .02, cy - r - .02], [cx - r - .02, cy - r - .02]], circ(cx, cy, r, 28));
  const blob = (cx, cy, rx, ry, deg, wob, ph, n = 14) => Array.from({ length:n }, (_, i) => {
    const a = 2 * Math.PI * i / n, k = 1 + wob * Math.sin(3 * a + ph) + wob * .5 * Math.sin(5 * a + ph * 2), x = rx * k * Math.cos(a), y = ry * k * Math.sin(a), t = rad(deg);
    return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]; });
  const shineAt = (c, rx, ry, rot = 0, o) => ({ t:'shine', cx:c[0], cy:c[1], rx, ry, rot, o });
  const dot = (c, r, m, tone = 'base') => ({ t:'circle', cx:c[0], cy:c[1], r, m, fc:'none', tone, line:false, d:true });
  // láng (egység-koordináta, fölfelé): lángablak, gáz-jel
  const FLAME = [[0, 1], [.2, .62], [.42, .3], [.46, -.05], [.34, -.36], [.14, -.5], [-.14, -.5], [-.34, -.36], [-.46, -.05], [-.38, .26], [-.2, .12], [-.16, .44]];
  const flame = (cx, cy, k) => FLAME.map(([x, y]) => [cx + x * k, cy + y * k]);

  // ---------------- 3D-vetítés: a tárgy méterben (x jobbra, y fel, z előre), a kamera 3/4-ből nézi ----------------
  // rig({ W, H, D }) – doboz a talpán (y = 0), középen · fit: saját illesztő pontok · extra: kilógó részek (cső, láb, fül)
  function rig(o){
    const W = o.W || 0, H = o.H || 0, D = o.D || 0, X = W / 2, Z = D / 2, tilt = o.tilt != null ? o.tilt : -14, fit = o.fit ? [...o.fit] : [];
    if(!o.fit) for(const x of [-X, X]) for(const y of [0, H]) for(const z of [-Z, Z]) fit.push([x, y, z]);
    const size = Math.max(...fit.map(p => Math.abs(p[0]) + Math.abs(p[1]) + Math.abs(p[2])));
    const P = camera({ az:o.az != null ? o.az : 22, el:o.el != null ? o.el : 16, F:o.F || 5 * size, tilt, span:o.span || 80, fit:[...fit, ...(o.extra || [])] });
    const F = (pts, dz = 0) => pts.map(([u, v]) => P([u, v, Z + dz]));   // előlap (u, v)
    const T = (pts, dy = 0) => pts.map(([u, w]) => P([u, H + dy, w]));   // teteje (u, z)
    const box = (x0, x1, y0, y1, z0, z1) => { const q = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) q.push(P([x, y, z])); return hull(q); };
    // kör a térben: c középpont, a és b egységirány
    const ring = (c, a, b, r, n = 18, rb = r) => Array.from({ length:n }, (_, i) => { const t = 2 * Math.PI * i / n; return P([0, 1, 2].map(k => c[k] + r * Math.cos(t) * a[k] + rb * Math.sin(t) * b[k])); });
    const hring = (x, y, z, r, n) => ring([x, y, z], [1, 0, 0], [0, 0, 1], r, n);   // vízszintes kör (álló henger)
    // tömör test 4 tónussal: oldala (sötét) · hátsó élsáv (legsötétebb) · teteje (világos) · eleje (alap + lapok)
    const cube = (m, x0 = -X, x1 = X, y0 = 0, y1 = H, z0 = -Z, z1 = Z, eb = .14) => [
      { t:'poly', m, fc:'none', tone:'dark', pts:[[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]].map(P) },
      { t:'poly', m, fc:'none', tone:'line', o:.45, line:false, d:true, pts:[[x1, y0, z0 + (z1 - z0) * eb], [x1, y0, z0], [x1, y1, z0], [x1, y1, z0 + (z1 - z0) * eb]].map(P) },
      { t:'poly', m, fc:'none', tone:'light', pts:[[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]].map(P) },
      { t:'poly', m, pts:[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(P) },
    ];
    // az előlapból kiálló henger (gomb, ajtókeret): palást (sötét) + homloklap
    const knob = (u, v, r, dz, m, n = 16, z0 = 0) => [
      { t:'poly', m, fc:'none', tone:'dark', d:true, pts:hull([...F(circ(u, v, r, n), z0), ...F(circ(u, v, r, n), z0 + dz)]) },
      { t:'poly', m, d:true, pts:F(circ(u, v, r, n), z0 + dz) }];
    return { P, F, T, box, ring, hring, cube, knob, tilt, X, Z, W, H, D };
  }

  // ================= nagy háztartási gépek =================
  (() => {   // hűtő-fagyasztó: magas, két ajtó (fent a kis fagyasztó), függőleges fogantyúk
    const K = rig({ W:.6, H:1.8, D:.65, az:26, el:12, tilt:-10 }), { F, P, X, Z } = K, hx = X - .08;
    const handle = (v0, v1) => ({ t:'poly', m:'steel', fc:'v', d:true, pts:hull([...F([[hx - .02, v0], [hx + .02, v0], [hx + .02, v1], [hx - .02, v1]]),
      ...F([[hx - .02, v0], [hx + .02, v0], [hx + .02, v1], [hx - .02, v1]], .05)]) });
    const flake = a => ({ t:'line', pts:F([[-.06 + .09 * Math.cos(rad(a)), 1.56 + .09 * Math.sin(rad(a))], [-.06 - .09 * Math.cos(rad(a)), 1.56 - .09 * Math.sin(rad(a))]], .002), m:'sky', tone:'dark', w:2 });
    ART.add('hutogep', { emoji:[], hu:'hűtő-fagyasztó', en:'tall two-door fridge freezer with handles', look:'the small freezer door on top and the larger fridge door below, vertical handles', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('white'),
      { t:'poly', m:'dark', fc:'none', tone:'base', d:true, pts:F([[-X, 0], [X, 0], [X, .07], [-X, .07]]) },                  // lábazat
      { t:'line', pts:F([[-X + .01, 1.3], [X - .01, 1.3]]), m:'steel', tone:'dark', w:2.2 },                                 // ajtórés
      handle(1.34, 1.52), handle(.9, 1.24),                                                                                 // fogantyúk
      flake(90), flake(30), flake(150),                                                                                     // hópehely a fagyasztón
      { t:'poly', m:'honey', d:true, pts:F(circ(-.1, .98, .07, 6, .07, 30), .004) },                                        // hatszög-mágnes
      shineAt(P([-.22, .72, Z]), 1.5, 11, 4),
    ]});
  })();

  // mosógép, szárítógép, mosogatógép: ugyanaz a géptest (0,60 × 0,85 × 0,60 m) – a különbség az előlapon van
  const machine = () => rig({ W:.6, H:.85, D:.6, az:20, el:15, tilt:-15, fit:(() => { const q = []; for(const x of [-.3, .3]) for(const y of [-.03, .85]) for(const z of [-.3, .3]) q.push([x, y, z]); return q; })() });
  (() => {   // mosógép – a jóváhagyott B minta (docs/rajzolas/minta/mosogep/matrica.js, mosogep_b)
    const K = machine(), { F, P, X, H } = K, dc = [0, .39], RD = .035, glass = circ(dc[0], dc[1], .162, 28);
    ART.add('mosogep', { emoji:[], hu:'mosógép', en:'front loading washing machine with laundry in water', look:'round glass door in the front, control strip with a dial on top', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('white'),
      { t:'line', pts:F([[-X + .015, .715], [X - .015, .715]]), m:'white', w:1.6 },                                          // kezelősáv
      { t:'poly', m:'steel', fc:'h', d:true, pts:F([[-.25, .745], [-.07, .745], [-.07, .815], [-.25, .815]], .01) },       // mosószer-fiók
      { t:'poly', m:'leaf', fc:'none', tone:'light', line:false, d:true, pts:F(circ(-.005, .78, .018, 10), .005) },           // jelzőfények
      { t:'poly', m:'honey', fc:'none', tone:'base', line:false, d:true, pts:F(circ(.045, .78, .018, 10), .005) },
      { t:'poly', m:'steel', d:true, pts:F(circ(.19, .78, .05, 18), .015) },                                               // programkapcsoló
      { t:'line', pts:F([[.19, .78], [.163, .816]], .015), m:'steel', w:1.8 },
      ...K.knob(dc[0], dc[1], .23, RD, 'steel', 28),                                                                       // ajtókeret
      { t:'poly', m:'glass', fc:'none', tone:'base', d:true, pts:F(glass, RD) },                                           // üveg
      { t:'poly', m:'water', fc:'h', line:false, d:true, pts:F(water(dc[0], dc[1], .162, .37, .014, .11), RD) },            // víz
      { t:'poly', m:'pink', d:true, pts:F(clip(blob(-.055, .375, .092, .052, -28, .12, 1), glass), RD) },                  // ruhák a vízben
      { t:'poly', m:'honey', d:true, pts:F(clip(blob(.085, .3, .05, .034, 35, .12, 2.5), glass), RD) },
      shineAt(P([-.085, .47, .3 + RD]), 2.4, 6.5, 35),
      shineAt(P([-.16, .55, .3 + RD]), 1.5, 3.4, 35, .75),
    ]});
  })();
  (() => {   // szárítógép: sötét ajtó VÍZ NÉLKÜL, benne kavargó ruha és meleg levegő; széles víztartály-fiók, szellőzőrács lent
    const K = machine(), { F, P, X } = K, dc = [0, .4], RD = .04, glass = circ(dc[0], dc[1], .17, 24);
    const swirl = Array.from({ length:15 }, (_, i) => { const t = i / 14, a = rad(-100 + 400 * t), r = .13 - .1 * t; return [dc[0] + r * Math.cos(a), dc[1] + r * Math.sin(a)]; });
    ART.add('szaritogep', { emoji:[], hu:'szárítógép', en:'tumble dryer with warm air swirling behind the dark door', look:'dark round door without water, vent slots at the bottom, clearly different from a washing machine', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('white'),
      { t:'line', pts:F([[-X + .015, .715], [X - .015, .715]]), m:'white', w:1.6 },
      { t:'poly', m:'steel', fc:'h', d:true, pts:F([[-.27, .74], [.03, .74], [.03, .82], [-.27, .82]], .012) },            // víztartály-fiók
      { t:'poly', m:'dark', fc:'none', tone:'base', line:false, d:true, pts:F([[-.2, .76], [-.04, .76], [-.05, .785], [-.19, .785]], .012) },   // fogantyú-mélyedés
      { t:'poly', m:'orange', fc:'none', tone:'base', line:false, d:true, pts:F(circ(.09, .78, .02, 10), .005) },           // meleg-jelző
      { t:'poly', m:'steel', d:true, pts:F(circ(.2, .78, .05, 18), .015) },                                                // programkapcsoló
      { t:'line', pts:F([[.2, .78], [.228, .815]], .015), m:'steel', tone:'line', w:1.8 },
      ...K.knob(dc[0], dc[1], .245, RD, 'dark', 26),                                                                       // sötét ajtókeret
      { t:'poly', m:'dark', fc:'none', tone:'light', d:true, pts:F(glass, RD) },                                           // sötét üveg, víz nincs
      { t:'poly', m:'sky', d:true, pts:F(clip(blob(-.06, .47, .085, .05, 20, .14, 1), glass), RD) },                       // kavargó ruhák
      { t:'poly', m:'pink', d:true, pts:F(clip(blob(.07, .33, .07, .045, -30, .14, 2), glass), RD) },
      { t:'line', pts:F(swirl, RD), m:'orange', tone:'light', w:2.2 },                                                     // meleg levegő
      { t:'poly', m:'steel', fc:'none', tone:'base', d:true, pts:F([[-X + .02, .02], [X - .02, .02], [X - .02, .1], [-X + .02, .1]], .004) },   // szellőzőrács
      { t:'path', m:'steel', fc:'none', tone:'line', line:false, d:true, p:pathOf([-.2, -.1, 0, .1, .2].map(u => F([[u - .035, .045], [u + .035, .045], [u + .035, .075], [u - .035, .075]], .005))) },
      shineAt(P([-.1, .5, .3 + RD]), 2, 5, 35, .5),
    ]});
  })();
  (() => {   // mosogatógép: lenyitott ajtó (belső lapja felfelé néz, a végén fogantyú), fent tányérok a kosárban, kezelősáv
    const K = rig({ W:.6, H:.85, D:.6, az:24, el:26, tilt:-12, extra:[[-.3, .04, .98], [.3, .04, .98]] }), { F, P, X, Z, H } = K;
    const L = .66, ang = rad(88), dy = L * Math.cos(ang), dzz = L * Math.sin(ang), top = [[-.28, .08 + dy, Z + dzz], [.28, .08 + dy, Z + dzz]];
    const door = (off = 0) => [[-.29, .08 + off, Z + .01], [.29, .08 + off, Z + .01], [.29, .08 + dy + off, Z + dzz], [-.29, .08 + dy + off, Z + dzz]].map(P);
    ART.add('mosogatogep', { emoji:[], hu:'mosogatógép', en:'open dishwasher with clean plates in the rack', look:'fold-down door lying open with a handle bar at its end, plates standing in the rack, control strip on top – no round window', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('steel'),
      { t:'poly', m:'steel', fc:'none', tone:'line', o:.8, d:true, pts:F([[-.26, .08], [.26, .08], [.26, .72], [-.26, .72]]) },   // belső tér
      ...[-.15, 0, .15].map(u => ({ t:'poly', m:'white', d:true, pts:K.ring([u, .44, -.05], [1, 0, 0], [0, 1, 0], .12, 18) })),   // tányérok
      { t:'poly', m:'sky', fc:'none', tone:'light', line:false, d:true, pts:K.ring([0, .44, -.04], [1, 0, 0], [0, 1, 0], .065, 14) },
      { t:'poly', m:'glass', fc:'v', d:true, pts:K.box(.17, .23, .5, .66, .0, .06) },                                      // pohár a felső kosárban
      { t:'poly', m:'steel', fc:'h', d:true, pts:K.box(-.25, .25, .28, .38, .02, .24) },                                    // alsó kosár
      { t:'line', pts:[[-.25, .38, .24], [.25, .38, .24]].map(P), m:'steel', tone:'light', w:1.6 },
      { t:'poly', m:'steel', fc:'none', tone:'dark', d:true, pts:hull([...door(), ...door(-.04)]) },                        // ajtó vastagsága
      { t:'poly', m:'steel', fc:'none', tone:'light', d:true, pts:door() },                                                // ajtó belső lapja
      { t:'poly', m:'steel', fc:'none', tone:'base', line:false, d:true, pts:[[-.22, .1, Z + .06], [.22, .1, Z + .06], [.22, .08 + dy * .8, Z + dzz * .8], [-.22, .08 + dy * .8, Z + dzz * .8]].map(P) },
      { t:'poly', m:'dark', fc:'h', d:true, pts:hull([...top.map(p => P([p[0], p[1] - .01, p[2] + .01])), ...top.map(p => P([p[0], p[1] - .06, p[2] + .03]))]) },   // fogantyú
      { t:'poly', m:'dark', fc:'h', d:true, pts:F([[-X, .74], [X, .74], [X, H - .02], [-X, H - .02]], .004) },              // kezelősáv
      dot(P([.16, .795, Z + .006]), 1.6, 'leaf', 'light'), dot(P([.23, .795, Z + .006]), 1.6, 'honey'),
      shineAt(P([-.22, .6, Z]), 1.2, 6, 0, .5),
    ]});
  })();
  (() => {   // beépíthető sütő: izzó üvegajtó, fogantyú-rúd, két gomb, kis kijelző
    const K = rig({ W:.6, H:.6, D:.55, az:22, el:16, tilt:-14 }), { F, P, X, Z, H } = K, win = rrect(-.22, .08, .22, .38, .03);
    ART.add('suto', { emoji:[], hu:'sütő', en:'kitchen oven with glowing glass door and knobs', look:'dark glass door glowing orange inside, handle bar across the top of the door, two knobs', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('cream'),
      { t:'poly', m:'dark', fc:'h', d:true, pts:F([[-X, .48], [X, .48], [X, H], [-X, H]], .003) },                         // kezelősáv
      ...K.knob(-.2, .54, .035, .03, 'steel', 14), ...K.knob(.2, .54, .035, .03, 'steel', 14),                              // gombok
      { t:'poly', m:'ember', fc:'none', tone:'light', line:false, d:true, pts:F([[-.07, .52], [.07, .52], [.07, .56], [-.07, .56]], .004) },   // kijelző
      { t:'poly', m:'dark', d:true, pts:F(win, .004) },                                                                    // üvegablak
      { t:'poly', m:'orange', fc:'none', tone:'base', line:false, d:true, o:.9, pts:F(clip(circ(0, .12, .24, 18, .13), win), .004) },   // izzás
      { t:'line', pts:F([[-.18, .34], [-.12, .31], [-.06, .34], [0, .31], [.06, .34], [.12, .31], [.18, .34]], .004), m:'ember', tone:'light', w:2 },   // fűtőszál
      { t:'line', pts:F([[-.19, .17], [.19, .17]], .004), m:'dark', tone:'light', w:2 },                                    // tepsi-rács
      { t:'poly', m:'steel', fc:'h', d:true, pts:hull([...F([[-.24, .42], [.24, .42], [.24, .45], [-.24, .45]], .04), ...F([[-.24, .42], [.24, .42], [.24, .45], [-.24, .45]], .06)]) },   // fogantyú
      { t:'line', pts:F([[-.2, .435], [-.2, .435]], .0).concat(F([[-.2, .435]], .04)), m:'steel', tone:'dark', w:2 },
      { t:'line', pts:F([[.2, .435]], .0).concat(F([[.2, .435]], .04)), m:'steel', tone:'dark', w:2 },
      shineAt(P([-.13, .3, Z]), 1.3, 5, 30, .45),
    ]});
  })();

  // ================= fűtés =================
  (() => {   // termosztát: kerek tárcsa négyzetes fali lapon
    const K = rig({ W:.09, H:.09, D:.018, az:22, el:14, tilt:-10, extra:[[0, .045, .04]] }), { F, P } = K, c = [0, .045];
    const arcP = (r, a0, a1, n) => Array.from({ length:n + 1 }, (_, i) => { const a = rad(a0 + (a1 - a0) * i / n); return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });
    const scale = (a0, a1, n) => F([...arcP(.027, a0, a1, n), ...arcP(.021, a1, a0, n)], .024);
    ART.add('termosztat', { emoji:[], hu:'termosztát', en:'round wall thermostat on a square wall plate', look:'round dial with a coloured scale ring on a square wall plate', tilt:K.tilt, shadow:'hard', shapes:[
      ...K.cube('sage'),
      dot(P([-.036, .081, .006]), 1.3, 'sage', 'line'), dot(P([.036, .009, .006]), 1.3, 'sage', 'line'),                     // csavarok
      ...K.knob(c[0], c[1], .036, .018, 'steel', 22, .006),                                                                  // tárcsa
      { t:'poly', m:'white', d:true, pts:F(circ(c[0], c[1], .03, 20), .0245) },                                              // számlap
      { t:'poly', m:'sage', fc:'none', tone:'dark', line:false, d:true, pts:scale(-225, 45, 14) },                           // skála
      { t:'poly', m:'ember', fc:'none', tone:'base', line:false, d:true, pts:scale(-225, -20, 10) },                          // beállított rész
      dot(P([c[0] + .0235 * Math.cos(rad(-20)), c[1] + .0235 * Math.sin(rad(-20)), .03]), 2.6, 'ember', 'dark'),              // jelölő
      { t:'poly', m:'leaf', d:true, pts:F([[-.004, .034], [.002, .039], [.007, .048], [-.001, .045], [-.005, .04]], .0245) },   // levél (öko-mód)
      shineAt(P([-.018, .062, .03]), 1.6, 4, 40, .7),
    ]});
  })();
  (() => {   // tagos radiátor: hat tag hullámos tetővel, bal oldalt piros szelepfej, alatta cső a padlóba, fölötte meleg
    const K = rig({ W:.78, H:.52, D:.1, az:24, el:18, tilt:-8, extra:[[-.5, .54, 0], [0, -.06, 0], [0, .78, 0]] }), { F, P, X, Z } = K;
    const n = 6, cw = .78 / n, yT = .47;
    const outline = [[-X, .05], ...Array.from({ length:n }, (_, i) => Array.from({ length:5 }, (_, k) => { const a = Math.PI - Math.PI * k / 4, cx = -X + cw * (i + .5);
      return [cx + cw / 2 * Math.cos(a), yT + .05 * Math.sin(a)]; })).flat(), [X, .05]];
    ART.add('radiator', { emoji:[], hu:'radiátor', en:'white column heating radiator with a red valve knob', look:'row of rounded white columns, red valve knob on the side, warm wavy lines above', tilt:K.tilt, shadow:'hard', shapes:[
      ...[-.24, 0, .24].map(u => ({ t:'line', pts:[0, 1, 2, 3, 4].map(k => P([u + (k % 2 ? .025 : -.025), .6 + k * .045, 0])), m:'ember', tone:'base', w:2.4 })),   // meleg
      { t:'poly', m:'steel', fc:'v', pts:K.box(-X - .085, -X - .05, -.06, .36, -.017, .017) },                              // cső a padlóba
      { t:'poly', m:'white', fc:'none', tone:'light', pts:outline.map(([u, v]) => P([u, v, -Z])) },                          // tagok teteje
      { t:'poly', m:'white', fc:'none', tone:'dark', pts:[[X, .05, Z], [X, .05, -Z], [X, yT, -Z], [X, yT, Z]].map(P) },       // oldala
      { t:'poly', m:'white', fc:'v', pts:F(outline) },                                                                       // eleje
      { t:'path', m:'steel', fc:'none', tone:'dark', line:false, d:true, p:pathOf(Array.from({ length:n - 1 }, (_, i) => F([[-X + cw * (i + 1) - .007, .08], [-X + cw * (i + 1) + .007, .08], [-X + cw * (i + 1) + .007, yT - .005], [-X + cw * (i + 1) - .007, yT - .005]], .002))) },
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:K.box(-.28, -.245, -.035, .05, -.025, .025) },                             // lábak
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:K.box(.245, .28, -.035, .05, -.025, .025) },
      { t:'poly', m:'steel', fc:'h', pts:K.box(-X - .07, -X + .01, .32, .37, -.017, .017) },                                 // szelepcsonk
      { t:'poly', m:'red', fc:'v', pts:hull([...K.hring(-X - .068, .37, 0, .042, 16), ...K.hring(-X - .068, .51, 0, .042, 16)]) },   // szelepfej
      { t:'poly', m:'red', fc:'none', tone:'light', pts:K.hring(-X - .068, .51, 0, .042, 16) },
      shineAt(P([-X + cw * .35, .3, Z]), 1.1, 7, 3, .6),
    ]});
  })();
  (() => {   // fali gázkazán: fehér szekrény, kerek lángablak, lent kezelősáv kijelzővel, alul színes elzárós csövek, fent füstcső
    const K = rig({ W:.4, H:.7, D:.3, az:24, el:14, tilt:-12, extra:[[0, -.22, .05], [0, .8, 0]] }), { F, P, X, Z, H } = K;
    const pipe = (x, m) => [{ t:'poly', m:'steel', fc:'v', pts:hull([...K.hring(x, -.21, .04, .018, 8), ...K.hring(x, .01, .04, .018, 8)]) },
      { t:'poly', m, fc:'v', pts:hull([...K.hring(x, -.13, .04, .03, 8), ...K.hring(x, -.07, .04, .03, 8)]) }];
    ART.add('gazkazan', { emoji:[], hu:'gázkazán', en:'wall-hung gas boiler with a blue and orange flame window and pipes below', look:'white wall box with a round flame window, small display strip, coloured pipes and valves below', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'steel', fc:'v', pts:hull([...K.hring(0, H - .01, -.02, .05, 10), ...K.hring(0, H + .09, -.02, .05, 10)]) },   // füstcső
      ...pipe(-.12, 'blue'), ...pipe(0, 'honey'), ...pipe(.12, 'red'),                                                       // csövek + elzárók
      ...K.cube('white'),
      { t:'poly', m:'dark', fc:'h', d:true, pts:F([[-X + .03, .04], [X - .03, .04], [X - .03, .17], [-X + .03, .17]], .004) },   // kezelősáv
      { t:'poly', m:'teal', fc:'none', tone:'light', line:false, d:true, pts:F([[-.14, .075], [.02, .075], [.02, .135], [-.14, .135]], .006) },   // kijelző
      dot(P([.11, .105, Z + .006]), 2, 'steel', 'light'),
      ...K.knob(0, .44, .09, .015, 'steel', 14),                                                                           // lángablak kerete
      { t:'poly', m:'dark', d:true, pts:F(circ(0, .44, .07, 14), .016) },
      { t:'poly', m:'blue', d:true, pts:F(flame(0, .43, .085), .016) },                                                    // kék gázláng
      { t:'poly', m:'orange', fc:'none', tone:'light', line:false, d:true, pts:F(flame(0, .405, .04), .016) },
      shineAt(P([-.13, .5, Z]), 1.3, 8, 2, .55),
    ]});
  })();

  // ================= mérőórák =================
  (() => {   // gázóra: szürke doboz, sárga gázcsövek fent, számlálóablak üres cellákkal, láng-jel
    const K = rig({ W:.34, H:.26, D:.2, az:22, el:18, tilt:-12, extra:[[-.25, .43, 0], [.25, .43, 0]] }), { F, P, X, Z, H } = K;
    const pipe = s => ({ t:'poly', m:'honey', pts:band([[s * .1, H + .02, 0], [s * .1, H + .11, 0], [s * .15, H + .16, 0], [s * .25, H + .16, 0]].map(P), 7.5, false) });
    const cells = [-.1, -.056, -.012, .032].map(u => F([[u, .15], [u + .034, .15], [u + .034, .2], [u, .2]], .004));
    ART.add('gazora', { emoji:[], hu:'gázóra', en:'gas meter box with a blank counter window and yellow pipes', look:'row of blank counter cells and a small blue-orange flame symbol, yellow gas pipes on top', tilt:K.tilt, shadow:'hard', shapes:[
      pipe(-1), pipe(1),                                                                                                   // gázcsövek
      { t:'poly', m:'steel', fc:'h', pts:K.box(-.135, -.065, H - .01, H + .04, -.035, .035) },                              // csavarzat
      { t:'poly', m:'steel', fc:'h', pts:K.box(.065, .135, H - .01, H + .04, -.035, .035) },
      ...K.cube('steel'),
      { t:'poly', m:'dark', fc:'none', tone:'base', d:true, pts:F([[-.12, .13], [.12, .13], [.12, .22], [-.12, .22]], .003) },   // számlálóablak
      { t:'path', m:'white', fc:'none', tone:'light', line:false, d:true, p:pathOf(cells) },                                // üres számlálócellák
      { t:'poly', m:'red', fc:'none', tone:'base', line:false, d:true, pts:F([[.076, .15], [.11, .15], [.11, .2], [.076, .2]], .004) },
      { t:'poly', m:'paper', fc:'none', tone:'base', d:true, pts:F([[-.12, .03], [-.02, .03], [-.02, .1], [-.12, .1]], .003) },   // adattábla
      { t:'poly', m:'blue', d:true, pts:F(flame(.07, .068, .04), .004) },                                                  // láng-jel
      shineAt(P([-.09, .205, Z + .005]), 1, 3, 40, .7),
    ]});
  })();
  (() => {   // villanyóra: fehér, álló, átlátszó fedél alatt LCD-kijelző és piros LED, lent sorkapocs-fedél villámmal, kábel
    const K = rig({ W:.19, H:.3, D:.08, az:24, el:14, tilt:-10, extra:[[.16, -.1, .04]] }), { F, P, X, Z } = K;
    ART.add('villanyora', { emoji:[], hu:'villanyóra', en:'electricity meter with a small display and cables', look:'small display, a red indicator light and a lightning-bolt symbol, cable coming out at the bottom', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'dark', pts:band([[0, .02, .01], [0, -.05, .02], [.05, -.09, .03], [.15, -.09, .04]].map(P), 6, false) },   // kábel
      ...K.cube('white'),
      { t:'poly', m:'glass', fc:'d', d:true, pts:F(rrect(-.08, .12, .08, .285, .012), .005) },                              // átlátszó fedél
      { t:'poly', m:'sage', fc:'none', tone:'base', d:true, pts:F([[-.06, .2], [.06, .2], [.06, .26], [-.06, .26]], .006) },  // LCD
      { t:'path', m:'sage', fc:'none', tone:'dark', line:false, d:true, p:pathOf([-.05, -.022, .006, .034].map(u => F([[u, .21], [u + .02, .21], [u + .02, .25], [u, .25]], .007))) },
      dot(P([-.045, .155, Z + .007]), 2.4, 'red'),                                                                          // piros LED
      { t:'poly', m:'steel', fc:'h', d:true, pts:F([[-.01, .145], [.06, .145], [.06, .165], [-.01, .165]], .007) },          // mérő-jel sáv
      { t:'poly', m:'steel', d:true, pts:F(rrect(-.09, .005, .09, .1, .012), .006) },                                       // sorkapocs-fedél
      { t:'poly', m:'honey', d:true, pts:F([[.012, .09], [-.022, .048], [-.002, .048], [-.012, .015], [.024, .06], [.004, .06]], .007) },   // villám-jel
      dot(P([-.07, .025, Z + .007]), 1.2, 'steel', 'dark'), dot(P([.07, .025, Z + .007]), 1.2, 'steel', 'dark'),
      shineAt(P([-.06, .245, Z + .006]), 1.1, 4.5, 20, .8),
    ]});
  })();
  (() => {   // vízóra: álló sárgaréz test, kék gyűrű, üveg számlap (üres számláló, piros csillagkerék), két oldalt csőcsonk
    const R0 = .045, pipeFit = [[-.1, .04, 0], [.1, .04, 0], [0, .075, .05], [0, 0, -.05]];
    const K = rig({ fit:pipeFit, az:24, el:50, tilt:-10, span:82 }), { P } = K;
    const xpipe = (x0, x1, r) => hull([...K.ring([x0, .022, 0], [0, 1, 0], [0, 0, 1], r, 12), ...K.ring([x1, .022, 0], [0, 1, 0], [0, 0, 1], r, 12)]);
    const top = (u, w) => P([u, .069, w]);
    ART.add('vizora', { emoji:[], hu:'vízóra', en:'brass water meter with a blue ring, glass dial and pipe stubs', look:'round brass body with a blue ring and a glass dial on top, pipe stubs on both sides', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'gold', fc:'h', pts:xpipe(-.1, -.03, .016) },                                                          // bal csőcsonk
      { t:'poly', m:'gold', fc:'none', tone:'dark', pts:xpipe(-.085, -.062, .024) },                                         // hollandi anya
      { t:'poly', m:'gold', fc:'h', pts:xpipe(.03, .1, .016) },                                                            // jobb csőcsonk
      { t:'poly', m:'gold', fc:'none', tone:'light', pts:K.ring([.1, .022, 0], [0, 1, 0], [0, 0, 1], .016, 12) },
      { t:'poly', m:'gold', fc:'none', tone:'dark', pts:xpipe(.062, .085, .024) },
      { t:'poly', m:'gold', fc:'v', pts:hull([...K.hring(0, 0, 0, R0, 20), ...K.hring(0, .05, 0, R0, 20)]) },              // sárgaréz ház
      { t:'poly', m:'blue', fc:'v', pts:hull([...K.hring(0, .048, 0, R0 + .003, 20), ...K.hring(0, .068, 0, R0 + .003, 20)]) },   // kék gyűrű
      { t:'poly', m:'blue', fc:'none', tone:'light', pts:K.hring(0, .068, 0, R0 + .003, 20) },
      { t:'poly', m:'glass', d:true, pts:K.hring(0, .069, 0, .036, 20) },                                                   // számlap
      { t:'poly', m:'dark', fc:'none', tone:'base', d:true, pts:[top(-.02, -.02), top(.02, -.02), top(.02, -.008), top(-.02, -.008)] },   // számláló (üres)
      { t:'path', m:'white', fc:'none', tone:'light', line:false, d:true, p:pathOf([-.017, -.007, .003, .013].map(u => [top(u, -.018), top(u + .007, -.018), top(u + .007, -.01), top(u, -.01)])) },
      { t:'poly', m:'red', fc:'none', tone:'base', d:true, pts:star(0, 0, 1, .45, 6).map(([x, y]) => top(.012 * x, .014 + .012 * y)) },   // csillagkerék
      shineAt(top(-.02, .01), 1.4, 4, 40, .75),
    ]});
  })();

  // ================= hűtés, hőszivattyú =================
  (() => {   // mobil klíma: fehér, kerekes, hátul felkanyarodó gégecső, fent légterelő, elöl hideg levegő
    const hose = [[.08, .5, -.2], [.16, .6, -.3], [.26, .84, -.32], [.4, .95, -.3]];
    const K = rig({ W:.45, H:.72, D:.38, az:24, el:16, tilt:-12, extra:[...hose, [-.5, .6, .2], [0, -.05, .2]] }), { F, P, X, Z, H } = K;
    const hp = hose.map(P), rib = t => { const i = Math.min(2, Math.floor(t * 3)), f = t * 3 - i, a = hp[i], b = hp[i + 1], c = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
      dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [[c[0] - dy / l * 5.2, c[1] + dx / l * 5.2], [c[0] + dy / l * 5.2, c[1] - dx / l * 4.2]].map(p => p.map(r1)); };
    ART.add('mobil_klima', { emoji:[], hu:'mobil klíma', en:'portable air conditioner on wheels with an exhaust hose', look:'white box on small wheels, louvres on top, a ribbed exhaust hose curving up from the back', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'steel', fc:'none', tone:'base', pts:band(hp, 11, false) },                                              // gégecső
      ...[.3, .45, .6, .75, .9].map(t => ({ t:'line', pts:rib(t), m:'steel', tone:'line', w:1.4 })),
      { t:'poly', m:'dark', pts:K.ring([-X + .06, -.02, Z - .05], [0, 0, 1], [0, 1, 0], .035, 12) },                         // kerekek
      { t:'poly', m:'dark', pts:K.ring([X - .02, -.02, Z - .05], [0, 0, 1], [0, 1, 0], .035, 12) },
      ...K.cube('white'),
      { t:'poly', m:'steel', fc:'none', tone:'base', d:true, pts:F([[-.17, .54], [.17, .54], [.17, .66], [-.17, .66]], .004) },   // légterelő
      { t:'path', m:'steel', fc:'none', tone:'dark', line:false, d:true, p:pathOf([.565, .6, .635].map(v => F([[-.15, v - .008], [.15, v - .008], [.15, v + .008], [-.15, v + .008]], .005))) },
      dot(P([-.12, .45, Z + .004]), 1.8, 'sky', 'dark'), dot(P([-.06, .45, Z + .004]), 1.8, 'leaf'),                        // jelzőfények
      { t:'path', m:'white', fc:'none', tone:'dark', line:false, d:true, p:pathOf([.1, .16, .22, .28].map(v => F([[.02, v - .007], [.18, v - .007], [.18, v + .007], [.02, v + .007]], .003))) },   // levegő-beszívó rács
      ...[.6, .5].map((v, i) => ({ t:'line', pts:[0, 1, 2, 3].map(k => P([-X - .04 - k * .045, v + (k % 2 ? .025 : -.01) + i * 0, Z])), m:'sky', tone:'dark', w:2.4 })),   // hideg levegő
      shineAt(P([-.17, .3, Z]), 1.2, 7, 4, .6),
    ]});
  })();
  (() => {   // kültéri klímaegység: SZÜRKE doboz, nagy kerek ventilátor vízszintes rácsokkal, jobb oldalt szervizfedél, fali konzolok
    const K = rig({ W:.8, H:.55, D:.28, az:22, el:14, tilt:-10, extra:[[-.3, -.14, .14], [.3, -.14, .14]] }), { F, P, X, Z } = K, fc = [-.1, .275], fan = circ(fc[0], fc[1], .21, 22);
    const bracket = x => ({ t:'poly', m:'dark', fc:'none', tone:'base', pts:band([[x, .0, .14], [x, .0, -.16], [x, -.14, -.16], [x, .0, .1]].map(P), 3.2, false) });
    ART.add('klima_kulteri', { emoji:[], hu:'kültéri klímaegység', en:'outdoor air conditioner unit with a big fan grille on wall brackets', look:'grey box with a big round fan behind horizontal bars, mounted on wall brackets', tilt:K.tilt, shadow:'hard', shapes:[
      bracket(-.28), bracket(.28),                                                                                         // fali konzolok
      ...K.cube('steel'),
      { t:'poly', m:'steel', fc:'none', tone:'light', d:true, pts:F(circ(fc[0], fc[1], .235, 22), .002) },                  // ventilátor kerete
      { t:'poly', m:'dark', d:true, pts:F(fan, .004) },                                                                    // ventilátor
      { t:'path', m:'steel', fc:'none', tone:'dark', line:false, d:true, p:pathOf([0, 120, 240].map(a => F([[0, 0], [.05, .16], [.13, .13]].map(([x, y]) => {
        const t = rad(a); return [fc[0] + x * Math.cos(t) - y * Math.sin(t), fc[1] + x * Math.sin(t) + y * Math.cos(t)]; }), .005))) },   // lapátok
      { t:'path', m:'steel', fc:'none', tone:'base', line:false, d:true, p:pathOf([-.14, -.07, 0, .07, .14].map(dv => F(clip([[-.4, fc[1] + dv - .009], [.2, fc[1] + dv - .009], [.2, fc[1] + dv + .009], [-.4, fc[1] + dv + .009]], fan), .007))) },   // vízszintes rács
      { t:'poly', m:'steel', fc:'none', tone:'light', d:true, pts:F(circ(fc[0], fc[1], .03, 10), .008) },                    // agy
      { t:'poly', m:'steel', fc:'none', tone:'base', d:true, pts:F([[.22, .06], [.36, .06], [.36, .49], [.22, .49]], .003) },   // szervizfedél
      { t:'path', m:'steel', fc:'none', tone:'dark', line:false, d:true, p:pathOf([.12, .17, .22, .27, .32].map(v => F([[.245, v], [.335, v], [.335, v + .018], [.245, v + .018]], .004))) },   // szellőzőrés
      shineAt(P([-.34, .44, Z]), 1.1, 5, 2, .6),
    ]});
  })();
  (() => {   // hőszivattyú: SZÉLESEBB, zsályazöld, levélzöld fedőlap, kerek rács koncentrikus körökkel, jobbra szervizpanel adattáblával, rézcsövek, lábak
    const K = rig({ W:1.0, H:.72, D:.38, az:24, el:14, tilt:-10, extra:[[.62, -.08, 0], [0, -.08, .19]] }), { F, P, X, Z, H } = K, fc = [-.14, .34];
    const ringL = r => ({ t:'line', pts:[...F(circ(fc[0], fc[1], r, 20), .005), F(circ(fc[0], fc[1], r, 20), .005)[0]], m:'sage', tone:'dark', w:1.6 });
    const cu = (z, y) => ({ t:'poly', m:'orange', pts:band([[X, y, z], [X + .08, y, z], [X + .1, y - .05, z], [X + .1, -.06, z]].map(P), 3.8, false) });
    ART.add('hoszivattyu', { emoji:[], hu:'hőszivattyú', en:'air source heat pump outdoor unit with a big round fan on small feet', look:'wide sage-green casing, one big round fan, small feet and copper pipes on the side', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:K.box(-.44, -.3, -.07, .01, -.14, .14) },                            // lábak
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:K.box(.3, .44, -.07, .01, -.14, .14) },
      cu(-.06, .2), cu(.06, .12),                                                                                          // rézcsövek
      ...K.cube('sage'),
      { t:'poly', m:'leaf', fc:'h', d:true, pts:[[-X, H - .06, Z + .003], [X, H - .06, Z + .003], [X, H, Z + .003], [-X, H, Z + .003]].map(P) },   // fedőlap éle
      { t:'poly', m:'dark', d:true, pts:F(circ(fc[0], fc[1], .26, 22), .004) },                                            // ventilátor
      ringL(.26), ringL(.18), ringL(.1),
      { t:'path', m:'sage', fc:'none', tone:'dark', line:false, d:true, p:pathOf([[[-.26, -.008], [.26, -.008], [.26, .008], [-.26, .008]], [[-.008, -.26], [.008, -.26], [.008, .26], [-.008, .26]]].map(q => F(q.map(([x, y]) => [fc[0] + x, fc[1] + y]), .006))) },   // küllők
      { t:'poly', m:'sage', fc:'none', tone:'light', d:true, pts:F(circ(fc[0], fc[1], .035, 10), .007) },                   // agy
      { t:'poly', m:'sage', fc:'none', tone:'dark', d:true, pts:F([[.2, .05], [.44, .05], [.44, .6], [.2, .6]], .003) },     // szervizpanel
      { t:'poly', m:'paper', fc:'none', tone:'base', d:true, pts:F([[.24, .4], [.4, .4], [.4, .52], [.24, .52]], .005) },     // adattábla
      { t:'poly', m:'honey', d:true, pts:F(circ(.32, .24, .065, 6, .065, 30), .005) },                                      // hatszög-jel
      { t:'poly', m:'leaf', fc:'none', tone:'base', line:false, d:true, pts:F([[.3, .2], [.345, .245], [.34, .29], [.305, .26]], .006) },
    ]});
  })();

  // ================= eszközök a nyomozáshoz, a házhoz és a kerthez =================
  (() => {   // hőkamera: mézsárga pisztoly-forma, hátul (felénk) szivárvány-színű hőkép, fent objektív, fekete markolat
    const K = rig({ W:.11, H:.19, D:.14, az:20, el:18, tilt:-12, extra:[[0, .185, -.12]] }), { F, P, X, Z } = K, scr = rrect(-.037, .118, .037, .176, .006);
    const heat = (m, rx, ry, dy) => ({ t:'poly', m, fc:'none', tone:'base', line:false, d:true, pts:F(clip(circ(.006, .143 + dy, rx, 16, ry), scr), .003) });
    ART.add('hokamera', { emoji:[], hu:'hőkamera', en:'handheld thermal imaging camera with a colourful heat map screen', look:'yellow pistol-grip camera, the screen shows a rainbow heat map from blue to red and yellow', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'dark', fc:'v', pts:hull([...K.ring([0, .15, -.07], [1, 0, 0], [0, 1, 0], .032, 14), ...K.ring([0, .15, -.12], [1, 0, 0], [0, 1, 0], .032, 14)]) },   // objektív
      { t:'poly', m:'dark', fc:'v', pts:hull([[-.022, .1, -.01], [.022, .1, -.01], [-.022, .1, .045], [.022, .1, .045], [-.022, 0, .02], [.022, 0, .02], [-.022, 0, .07], [.022, 0, .07]].map(P)) },   // markolat
      { t:'poly', m:'honey', fc:'none', tone:'dark', d:true, pts:[[-.018, .1, -.03], [.018, .1, -.03], [.018, .065, -.018], [-.018, .07, -.022]].map(P) },   // ravasz
      ...K.cube('honey', -X, X, .1, .19),
      { t:'poly', m:'dark', d:true, pts:F(rrect(-.043, .112, .043, .182, .008), .002) },                                   // keret
      { t:'poly', m:'blue', fc:'none', tone:'base', line:false, d:true, pts:F(scr, .003) },                                // hideg (kék)
      heat('purple', .03, .024, 0), heat('red', .02, .016, -.002), heat('honey', .01, .008, -.004),                        // meleg folt
      { t:'line', pts:F([[-.03, .143], [-.018, .143]], .004), m:'white', tone:'light', w:1.6 },                            // célkereszt
      { t:'line', pts:F([[.006, .122], [.006, .128]], .004), m:'white', tone:'light', w:1.6 },
      dot(P([-.025, .19, 0]), 1.8, 'dark'), dot(P([.015, .19, 0]), 1.8, 'dark'),                                            // gombok
      shineAt(P([-.03, .17, Z + .004]), .9, 3, 40, .6),
    ]});
  })();
  (() => {   // napelem: döntött tábla kék cellákkal és fehér rácsvonalakkal, fém állványon
    const al = rad(28), L = .66, Q = (u, s, dn = 0) => [u, .32 + s * Math.sin(al) + dn * Math.cos(al), .28 - s * Math.cos(al) + dn * Math.sin(al)];
    const fit = []; for(const u of [-.5, .5]) for(const s of [0, L]) fit.push(Q(u, s)); fit.push([-.45, 0, .3], [.45, 0, -.3]);
    const K = rig({ fit, az:22, el:24, tilt:-10 }), { P } = K;
    const q = (u0, s0, u1, s1, dn = 0) => [Q(u0, s0, dn), Q(u1, s0, dn), Q(u1, s1, dn), Q(u0, s1, dn)].map(P);
    const leg = u => ({ t:'poly', m:'steel', fc:'none', tone:'dark', pts:band([Q(u, .6, -.03), [u, 0, Q(u, .6)[2]], [u, 0, Q(u, .06)[2]], Q(u, .06, -.03)].map(P), 3, false) });
    ART.add('napelem', { emoji:[], hu:'napelem', en:'single tilted solar panel with blue cells on a metal stand', look:'tilted panel of blue cells divided by light grid lines, on a metal stand', tilt:K.tilt, shadow:'hard', shapes:[
      leg(-.4), leg(.4),                                                                                                   // állvány
      { t:'poly', m:'steel', fc:'none', tone:'dark', pts:hull([...q(-.5, 0, .5, L), ...q(-.5, 0, .5, L, -.04)]) },          // keret vastagsága
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:q(-.5, 0, .5, L) },                                               // keret
      { t:'poly', m:'blue', d:true, pts:q(-.465, .035, .465, L - .035) },                                                  // cellák
      ...[-.2325, 0, .2325].map(u => ({ t:'line', pts:[P(Q(u, .035)), P(Q(u, L - .035))], m:'blue', tone:'light', w:1.5 })),   // rácsvonalak
      ...[.23, .43].map(s => ({ t:'line', pts:[P(Q(-.465, s)), P(Q(.465, s))], m:'blue', tone:'light', w:1.5 })),
      { t:'poly', m:'white', fc:'none', tone:'light', line:false, d:true, o:.4, pts:[Q(-.34, L - .035), Q(-.22, L - .035), Q(-.36, .035), Q(-.465, .035)].map(P) },   // csillanás
    ]});
  })();
  (() => {   // mérőpohár: áttetsző csonkakúp füllel és kiöntővel, benne víz, skálajelek (szám nélkül)
    const rAt = y => .052 + .018 * y / .15, fit = [[-.09, .16, 0], [.12, .15, 0], [0, 0, .07], [0, .15, -.07], [0, 0, -.052]];
    const K = rig({ fit, az:0, el:22, tilt:8, span:78 }), { P } = K;
    const ringY = (y, r, n = 20) => K.hring(0, y, 0, r, n), arcY = (y, a0, a1, n = 4) => Array.from({ length:n + 1 }, (_, i) => { const a = rad(a0 + (a1 - a0) * i / n); return P([rAt(y) * Math.cos(a), y, rAt(y) * Math.sin(a)]); });
    ART.add('meropohar', { emoji:[], hu:'mérőpohár', en:'clear plastic measuring jug with water and blank scale marks', look:'clear jug with a handle and a spout, water inside and blank scale marks', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'glass', fc:'none', tone:'dark', pts:band([[.066, .13, 0], [.115, .125, 0], [.118, .05, 0], [.06, .035, 0]].map(P), 5.5, false) },   // fül
      { t:'poly', m:'glass', fc:'v', o:.95, pts:hull([...ringY(0, rAt(0)), ...ringY(.15, rAt(.15))]) },                     // test
      { t:'poly', m:'glass', fc:'none', tone:'light', line:false, d:true, pts:ringY(.15, rAt(.15) - .004) },                // a pohár szája belülről
      { t:'poly', m:'water', fc:'v', line:false, d:true, o:.9, pts:hull([...ringY(.003, rAt(0) - .003), ...ringY(.09, rAt(.09) - .003)]) },   // víz
      { t:'poly', m:'water', fc:'none', tone:'light', d:true, pts:ringY(.09, rAt(.09) - .003) },                            // vízfelszín
      { t:'poly', m:'glass', fc:'none', tone:'base', d:true, pts:[[-.064, .15, .026], [-.105, .172, 0], [-.064, .15, -.026], [-.07, .122, 0]].map(P) },   // kiöntő
      ...[.04, .07, .1, .13].map((y, i) => ({ t:'line', pts:arcY(y, i % 2 ? 110 : 95, 130), m:'glass', tone:'line', w:1.8 })),   // skálajelek
      shineAt(P([-.038, .075, .04]), 1.3, 8, 4, .7),
      shineAt(P([.03, .1, .05]), .7, 3.5, -4, .5),
    ]});
  })();
  (() => {   // tömítőszalag: fekete habszalag-tekercs kartonhüvellyel, egy darab kitekerve
    const R0 = .05, h = .025, a0 = rad(112), d = [Math.sin(a0), 0, -Math.cos(a0)], s0 = [R0 * Math.cos(a0), 0, R0 * Math.sin(a0)], e = [s0[0] + .11 * d[0], 0, s0[2] + .11 * d[2]];
    const fit = [[-R0, 0, 0], [R0, h, 0], [0, 0, R0], [0, h, -R0], e, [e[0], h, e[2]]];
    const K = rig({ fit, az:10, el:42, tilt:-8, span:80 }), { P } = K, n = [Math.cos(a0), 0, Math.sin(a0)];
    const top = r => K.hring(0, h, 0, r, 20), strip = (y, k = 0) => [[s0[0] + n[0] * k, y, s0[2] + n[2] * k], [e[0] + n[0] * k, y, e[2] + n[2] * k]];
    ART.add('tomitoszalag', { emoji:[], hu:'tömítőszalag', en:'roll of black foam sealing tape with a short unrolled strip', look:'flat black foam roll with a cardboard core, a short strip unrolled on the ground', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'dark', fc:'v', pts:hull([...K.hring(0, 0, 0, R0, 20), ...top(R0)]) },                                  // tekercs palástja
      { t:'poly', m:'dark', fc:'none', tone:'light', pts:top(R0) },                                                         // teteje
      { t:'line', pts:[...top(.041), top(.041)[0]], m:'dark', tone:'base', w:1.4 },                                         // rétegek
      { t:'line', pts:[...top(.032), top(.032)[0]], m:'dark', tone:'base', w:1.4 },
      { t:'poly', m:'cardboard', pts:top(.024) },                                                                           // kartonhüvely
      { t:'poly', m:'cardboard', fc:'none', tone:'line', d:true, pts:top(.018) },   // üreg
      { t:'poly', m:'dark', fc:'none', tone:'base', pts:[...strip(0), ...strip(h).reverse()].map(P) },                      // kitekert csík
      { t:'poly', m:'dark', fc:'none', tone:'light', d:true, pts:[...strip(h), ...strip(h, -.007).reverse()].map(P) },       // csík teteje
      ...[.3, .55, .8].map(t => dot(P([s0[0] + (e[0] - s0[0]) * t, h * .5, s0[2] + (e[2] - s0[2]) * t]), 1.2, 'dark', 'light')),   // habpórusok
      dot(P([-.03, h, -.01]), 1.1, 'dark', 'base'), dot(P([.02, h, .032]), 1.1, 'dark', 'base'),
      shineAt(P([-.042, h * .5, .026]), .8, 3, -10, .35),
    ]});
  })();
  (() => {   // locsolótömlő-kocsi: zöld tömlő a dobon, mézsárga keret és tárcsák, kurbli, a tömlő vége szórófejjel
    const cy = .28, yz = (x, r, n = 16) => ring3([x, cy, 0], r, n);
    const hose = [[.02, .14, .14], [.03, .04, .25], [-.06, .005, .34], [-.24, .005, .4]];
    const fit = [[-.22, 0, .2], [.22, .6, -.2], [-.37, -.015, .43], [.24, 0, .2], [.24, .48, 0], [.03, .04, .25]];
    const K = rig({ fit, az:32, el:18, tilt:-8 }), { P } = K;
    function ring3(c, r, n){ return K.ring(c, [0, 1, 0], [0, 0, 1], r, n); }
    const frame = x => ({ t:'poly', m:'honey', fc:'none', tone:'dark', pts:band([[x, 0, .18], [x, .58, 0], [x, 0, -.18]].map(P), 3.4, false) });
    const coil = x => ({ t:'line', pts:Array.from({ length:9 }, (_, i) => { const a = rad(-100 + 200 * i / 8); return P([x, cy + .152 * Math.sin(a), .152 * Math.cos(a) * 1]); }), m:'leaf', tone:'dark', w:1.6 });
    ART.add('locsolotomlo', { emoji:[], hu:'locsolótömlő', en:'coiled green garden hose with a spray nozzle', look:'green hose wound on a reel with a yellow frame and crank, the free end with a spray nozzle', tilt:K.tilt, shadow:'hard', shapes:[
      frame(-.21),                                                                                                         // hátsó keret
      { t:'poly', m:'honey', fc:'none', tone:'dark', pts:yz(-.18, .2) },                                                    // hátsó tárcsa
      { t:'poly', m:'leaf', fc:'v', pts:hull([...yz(-.17, .15), ...yz(.17, .15)]) },                                        // feltekert tömlő
      coil(-.09), coil(0), coil(.09),
      { t:'poly', m:'leaf', pts:band(hose.map(P), 5.4, false) },                                                            // a tömlő vége
      { t:'poly', m:'honey', pts:yz(.18, .2) },                                                                            // első tárcsa
      { t:'poly', m:'honey', fc:'none', tone:'dark', line:false, d:true, pts:yz(.185, .14) },
      { t:'poly', m:'steel', d:true, pts:yz(.19, .04, 10) },                                                               // agy
      { t:'poly', m:'steel', fc:'none', tone:'base', pts:band([[.19, cy, 0], [.24, cy, 0], [.24, cy + .12, .04]].map(P), 3, true) },   // kurbli
      frame(.21),                                                                                                          // első keret
      { t:'poly', m:'honey', pts:band([[-.21, .58, 0], [.21, .58, 0]].map(P), 4.4, true) },                                 // fogantyú
      { t:'poly', m:'orange', fc:'h', pts:K.box(-.33, -.23, -.015, .035, .38, .43) },                                        // szórófej
      { t:'poly', m:'steel', fc:'none', tone:'base', pts:K.box(-.36, -.33, -.01, .03, .385, .425) },
    ]});
  })();
  (() => {   // esővízgyűjtő hordó: zöld, domború hordó abroncsokkal, fedél, fölötte lefolyócső, lent réz csap vízcseppel
    const rAt = y => .27 + .04 * Math.sin(Math.PI * y / .9), pipe = [[.13, 1.26, -.12], [.13, 1.06, -.12], [.11, .93, -.03]];
    const fit = [[-.31, 0, 0], [.31, .9, 0], [0, 0, .31], [0, .9, -.31], ...pipe, [-.08, .06, .45]];
    const K = rig({ fit, az:18, el:16, tilt:6 }), { P } = K;
    const hoop = y => ({ t:'line', pts:Array.from({ length:11 }, (_, i) => { const a = rad(-10 + 200 * i / 10); return P([rAt(y) * Math.cos(a), y, rAt(y) * Math.sin(a)]); }), m:'leaf', tone:'dark', w:2.4 });
    const ta = rad(104), nn = [Math.cos(ta), 0, Math.sin(ta)], tp = (k, y) => [rAt(y) * nn[0] + k * nn[0], y, rAt(y) * nn[2] + k * nn[2]];
    ART.add('esovizgyujto', { emoji:[], hu:'esővízgyűjtő hordó', en:'green rain water barrel with a downpipe and a small tap', look:'round green barrel with hoops and a lid, a downpipe entering from above, brass tap near the bottom', tilt:K.tilt, shadow:'hard', shapes:[
      { t:'poly', m:'steel', fc:'v', pts:band(pipe.map(P), 7, false) },                                                     // lefolyócső
      { t:'poly', m:'steel', fc:'none', tone:'light', pts:hull([...K.hring(.13, 1.14, -.12, .045, 12), ...K.hring(.13, 1.19, -.12, .045, 12)]) },   // csőbilincs
      { t:'poly', m:'leaf', fc:'v', pts:hull([0, .225, .45, .675, .9].flatMap(y => K.hring(0, y, 0, rAt(y), 20))) },       // hordó
      { t:'poly', m:'leaf', fc:'none', tone:'light', pts:K.hring(0, .9, 0, rAt(.9), 20) },                                  // fedél
      { t:'poly', m:'leaf', fc:'none', tone:'base', d:true, pts:K.hring(0, .905, 0, .2, 18) },
      { t:'poly', m:'dark', fc:'none', tone:'base', line:false, d:true, pts:K.hring(.11, .91, -.03, .05, 12) },            // beömlő nyílás
      hoop(.22), hoop(.68),                                                                                                // abroncsok
      { t:'poly', m:'gold', fc:'h', pts:hull([...K.ring(tp(0, .16), [0, 1, 0], [-nn[2], 0, nn[0]], .036, 10), ...K.ring(tp(.1, .16), [0, 1, 0], [-nn[2], 0, nn[0]], .036, 10)]) },   // csap
      { t:'poly', m:'gold', fc:'v', pts:hull([...K.hring(...tp(.09, .15), .02, 8), ...K.hring(...tp(.09, .08), .02, 8)]) },
      { t:'poly', m:'gold', fc:'none', tone:'dark', pts:band([tp(.07, .2), tp(.07, .25)].map(P), 3.6, true) },               // csap-fogantyú
      { t:'poly', m:'water', pts:circ(0, 0, 1, 10).map(([x, y]) => [x, y < 0 ? y * (1 + 1.2 * (1 + y)) : y]).map(([x, y]) => { const c = P(tp(.09, .02)); return [r1(c[0] + 2.3 * x), r1(c[1] + 2.6 * y)]; }) },   // vízcsepp
      shineAt(P([-.2, .5, .2]), 1.6, 12, 0, .45),
    ]});
  })();
})();
