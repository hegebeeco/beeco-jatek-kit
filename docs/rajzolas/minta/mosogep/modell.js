// ============================================================
//  Mosógép 3D – három kidolgozottsági szint (A minimál · B közepes · C részletes) → mosogep_a/b/c.glb
//  Méret: 0,60 m széles × 0,85 m magas (+ láb) × 0,60 m mély. Y fel, +Z az eleje, a test eleje z = 0,30-nál.
//  Futtatás: node modell.js   (a mappában) · ellenőrzés: node tools/model-check.js mosogep_*.glb
// ============================================================
const G = require('../../../../tools/modell-kit.js'), path = require('path');
const OUT = process.argv[2] || require('os').tmpdir();   // a GLB-k ide kerülnek: node <fájl> <mappa>
const out = f => path.join(OUT, f);
const W = .60, H = .85, D = .60, FZ = D / 2;          // FZ: az előlap síkja
const FH = .03, y = v => FH + v;                      // lábmagasság; v = magasság az előlap aljától
const DOOR = [0, .40];                                // ajtó közepe (x, v)
const LID = .024;                                     // munkalap vastagsága (a test teteje)
// színek: a játék cel-fényében a tiszta fehér teteje és oldala egyforma fehérré ég ki → a test szürkésfehér (white:2),
// a munkalap világosabb (white:1), így a tető és az oldal elválik; a fém részek sötétebb acélok (steel:2)
const flat = { r:[90, 0, 0] };                        // Y tengelyű forgástest → előre (Z) néz

// ---- 2D segédek a víz formájához (kör alsó része hullámos felszínnel) ----
const circ = (cx, cy, r, n) => Array.from({ length:n }, (_, i) => { const a = 2 * Math.PI * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
function clip(subject, cp){   // Sutherland–Hodgman: sokszög vágása konvex sokszögre
  const inside = (p, a, b) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
  const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
    return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
  let o = subject;
  for(let i = 0; i < cp.length; i++){ const a = cp[i], b = cp[(i + 1) % cp.length], inp = o; o = [];
    for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
      if(inside(q, a, b)){ if(!inside(p, a, b)) o.push(cut(p, q, a, b)); o.push(q); } else if(inside(p, a, b)) o.push(cut(p, q, a, b)); } }
  return o;
}
const waterShape = (r, lvl, amp, n) => clip([...Array.from({ length:n + 1 }, (_, i) => { const u = -r - .02 + (2 * r + .04) * i / n; return [u, lvl + amp * Math.sin(u / .1 * 2 * Math.PI)]; }), [r + .02, -r - .02], [-r - .02, -r - .02]], circ(0, 0, r, 28));
// ívdarab (vastag körív) 2D sokszögként – az üveg csillanásához
const arcBand = (r0, r1, a0, a1, n) => { const P = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
  return [...Array.from({ length:n + 1 }, (_, i) => P(r1, a0 + (a1 - a0) * i / n)), ...Array.from({ length:n + 1 }, (_, i) => P(r0, a1 - (a1 - a0) * i / n))]; };
// lekerekített doboz: a sarkok gömbnyolcadain mintavételezett pontok konvex burka (steps = ívlépések száma)
function roundBox(w, h, d, r, steps){
  const P = [], seen = new Set();
  for(const sx of [-1, 1]) for(const sy of [-1, 1]) for(const sz of [-1, 1])
    for(let i = 0; i <= steps; i++) for(let j = 0; j <= steps; j++){
      const a = Math.PI / 2 * i / steps, b = Math.PI / 2 * j / steps;
      const p = [sx * (w / 2 - r + r * Math.sin(a) * Math.cos(b)), sy * (h / 2 - r + r * Math.cos(a)), sz * (d / 2 - r + r * Math.sin(a) * Math.sin(b))];
      const k = p.map(v => v.toFixed(5)).join(); if(!seen.has(k)){ seen.add(k); P.push(p); }
    }
  return G.hull(P);
}
const report = (name, m) => { const r = m.save(out(name)); console.log(`${name}: ${r.tris} háromszög, ${r.materials} anyag, ${(r.bytes / 1024).toFixed(1)} KB`); };

// =====================================================================
//  A – MINIMÁL: dobozok + 8 szögű hengerek, 4 szín (test, munkalap, acél, víz), élletörés nélkül
// =====================================================================
{
  const m = G.model();
  m.add(G.box(W, H - LID, D), { color:'white:2', t:[0, y((H - LID) / 2), 0] });                            // test
  m.add(G.box(W, LID, D), { color:'white:1', t:[0, y(H - LID / 2), 0] });                                   // munkalap
  for(const [x, z] of [[-.24, -.24], [.24, -.24], [-.24, .24], [.24, .24]]) m.add(G.box(.06, FH, .06), { color:'steel:2', t:[x, FH / 2, z] });   // lábak
  m.add(G.box(.18, .065, .02), { color:'steel:2', t:[-.16, y(.77), FZ + .01] });                          // fiók
  m.add(G.cylinder(.045, .045, .03, 8), { color:'steel:2', r:[90, 0, 22.5], t:[.19, y(.77), FZ + .015] }); // programkapcsoló
  m.add(G.cylinder(.215, .215, .04, 8), { color:'steel:2', r:[90, 0, 22.5], t:[DOOR[0], y(DOOR[1]), FZ + .02] });   // ajtókeret
  m.add(G.cylinder(.155, .155, .02, 8), { color:'water:1', r:[90, 0, 22.5], t:[DOOR[0], y(DOOR[1]), FZ + .045] });  // ablak (víz)
  report('mosogep_a.glb', m);
}

// =====================================================================
//  B – KÖZEPES: letört élű test, 16 szögű részek, külön ajtókeret (tórusz), üveg, gomb, fiók, lábak; 6 szín
// =====================================================================
{
  const m = G.model(), S = 16;
  m.add(G.chamferBox(W, H - LID, D, .03), { color:'white:2', t:[0, y((H - LID) / 2), 0] });                  // test
  m.add(G.chamferBox(W + .006, LID, D + .006, .008), { color:'white:1', t:[0, y(H - LID / 2), 0] });        // munkalap
  for(const [x, z] of [[-.24, -.24], [.24, -.24], [-.24, .24], [.24, .24]]) m.add(G.cylinder(.03, .036, FH, 12), { color:'dark:1', t:[x, FH / 2, z] });
  m.add(G.box(.56, .008, .006), { color:'dark:1', t:[0, y(.715), FZ] });                                   // kezelősáv horonya
  m.add(G.chamferBox(.18, .065, .03, .008), { color:'white:1', t:[-.16, y(.77), FZ + .005] });              // fiók
  m.add(G.cylinder(.015, .015, .012, 12), { color:'honey:1', ...flat, t:[-.005, y(.77), FZ + .004] });     // jelzőfények
  m.add(G.cylinder(.015, .015, .012, 12), { color:'water:1', ...flat, t:[.045, y(.77), FZ + .004] });
  m.add(G.cylinder(.048, .05, .03, S), { color:'steel:2', ...flat, t:[.19, y(.77), FZ + .015] });          // programkapcsoló
  m.add(G.box(.008, .034, .008), { color:'dark:1', r:[0, 0, 30], t:[.182, y(.783), FZ + .032] });          // mutató
  m.add(G.cylinder(.215, .215, .012, S), { color:'steel:2', ...flat, t:[DOOR[0], y(DOOR[1]), FZ + .006] }); // ajtólap
  m.add(G.torus(.19, .032, S, 8), { color:'steel:2', r:[90, 0, 0], t:[DOOR[0], y(DOOR[1]), FZ + .03] });    // ajtókeret
  m.add(G.lathe([[.16, 0], [.12, .018], [0, .024]], S), { color:'water:1', ...flat, t:[DOOR[0], y(DOOR[1]), FZ + .012] });   // domború üveg (vízzel)
  report('mosogep_b.glb', m);
}

// =====================================================================
//  C – RÉSZLETES: lekerekített test, 24–32 szögű részek, fiók fogantyúval, gombok, fények, zsanér, ajtókilincs,
//  víz + ruhák az üveg mögött, üveg-csillanás, lábazat; 8 szín
// =====================================================================
{
  const m = G.model(), S = 32, s = 24, dx = DOOR[0], dy = y(DOOR[1]);
  m.add(roundBox(W, H - LID, D, .035, 2), { color:'white:2', t:[0, y((H - LID) / 2), 0] });                  // test
  m.add(roundBox(W + .006, LID, D + .006, .01, 1), { color:'white:1', t:[0, y(H - LID / 2), 0] });           // munkalap
  for(const [x, z] of [[-.235, -.235], [.235, -.235], [-.235, .235], [.235, .235]])
    m.add(G.lathe([[.036, 0], [.03, FH * .6], [.026, FH]], s), { color:'dark:1', t:[x, 0, z] });            // lábak
  m.add(G.box(.54, .05, .006), { color:'steel:2', t:[0, y(.035), FZ] });                                   // lábazat-lemez
  // kezelősáv
  m.add(G.box(.56, .006, .006), { color:'dark:1', t:[0, y(.715), FZ] });                                   // horony
  m.add(G.chamferBox(.19, .068, .03, .01), { color:'white:1', t:[-.155, y(.772), FZ + .004] });             // fiók
  m.add(G.chamferBox(.08, .014, .01, .003), { color:'dark:1', t:[-.155, y(.75), FZ + .02] });               // fiók-fogantyú mélyedése
  m.add(G.cylinder(.013, .013, .012, 16), { color:'honey:1', ...flat, t:[-.01, y(.795), FZ + .004] });     // jelzőfények
  m.add(G.cylinder(.013, .013, .012, 16), { color:'water:1', ...flat, t:[.045, y(.795), FZ + .004] });
  m.add(G.chamferBox(.034, .018, .012, .004), { color:'steel:2', t:[-.01, y(.745), FZ + .004] });           // gombok
  m.add(G.chamferBox(.034, .018, .012, .004), { color:'steel:2', t:[.045, y(.745), FZ + .004] });
  m.add(G.lathe([[.052, 0], [.052, .018], [.046, .032], [.03, .036], [0, .036]], s), { color:'white:1', ...flat, t:[.19, y(.77), FZ] });   // programkapcsoló
  m.add(G.box(.009, .034, .008), { color:'dark:1', r:[0, 0, 30], t:[.182, y(.783), FZ + .038] });          // mutató
  // ajtó
  m.add(G.cylinder(.222, .222, .012, S), { color:'steel:2', ...flat, t:[dx, dy, FZ + .006] });              // ajtólap
  m.add(G.torus(.19, .034, S, 12), { color:'steel:2', r:[90, 0, 0], t:[dx, dy, FZ + .034] });               // ajtókeret
  m.add(G.torus(.153, .013, 28, 6), { color:'dark:1', r:[90, 0, 0], t:[dx, dy, FZ + .03] });                // gumitömítés
  m.add(G.cylinder(.156, .156, .008, 28), { color:'glass:1', ...flat, t:[dx, dy, FZ + .016] });             // dob hátfala (üvegen át)
  m.add(G.extrude(waterShape(.152, .005, .012, 24), .016), { color:'water:1', t:[dx, dy, FZ + .026] });     // víz
  m.add(G.sphere(.06, 12, 8), { color:'pink:1', s:[1.45, .75, .28], r:[0, 0, -25], t:[dx - .045, dy + .02, FZ + .024] });   // ruhák
  m.add(G.sphere(.05, 12, 8), { color:'honey:1', s:[1.3, .7, .28], r:[0, 0, 30], t:[dx + .07, dy - .005, FZ + .024] });
  m.add(G.extrude(arcBand(.122, .138, 108, 162, 8), .004), { color:'white:1', t:[dx, dy, FZ + .038] });     // üveg-csillanás
  for(const v of [-.08, .08]) m.add(G.cylinder(.016, .016, .05, 16), { color:'steel:2', t:[dx - .232, dy + v, FZ + .02] });   // zsanér
  m.add(G.chamferBox(.03, .12, .03, .008), { color:'steel:2', t:[dx + .225, dy, FZ + .05] });                // kilincs
  report('mosogep_c.glb', m);
}
