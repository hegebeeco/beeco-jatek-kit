// ============================================================
//  Részletesség-próba 3D: SAJTSZELET három szinten → sajt_a.glb · sajt_b.glb · sajt_c.glb
//  node modell.js   (a ../glb.js készletre épül; színek: ART.MAT)
//
//  A szelet: csúcs az origóban, elöl (+Z felé néző) vágott lap az X tengely mentén, hátsó vágott lap TH fokkal hátrafordítva,
//  jobbra a kéreg-ív (sugár L). Logikai-kivonás (boolean) nincs, ezért a lyukas lapokat magunk háromszögeljük:
//  a lap körvonala + a lyukak körei → fülvágás (ear clipping) hidakkal, a lyukba pedig üreg kerül (B: kúp, C: kétszínű tál).
//  A szélen vágott lyuk negyedgömb-üreg, amelynek pereme pontosan a két szomszédos lap körvonal-ívére illeszkedik (nincs rés).
// ============================================================
const G = require('../../../../tools/modell-kit.js');
const OUT = process.argv[2] || require('os').tmpdir();   // a GLB-k ide kerülnek: node <fájl> <mappa>
const L = 0.12, H = 0.072, TH = 46 * Math.PI / 180;                 // 12 cm hosszú, 7,2 cm magas, 46°-os szelet
const dB = [Math.cos(TH), 0, -Math.sin(TH)];                          // a hátsó vágott lap iránya a csúcsból
const nBack = [-Math.sin(TH), 0, -Math.cos(TH)];                      // … és kifelé mutató normálja

// ---- vektor-segédek ----
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
// háromszög kifelé fordítása: a normál a „hint” irányába nézzen (hint: vektor vagy pont → vektor függvény)
const orient = (tri, hint) => { const n = cross(sub(tri[1], tri[0]), sub(tri[2], tri[0])), h = typeof hint === 'function' ? hint(tri) : hint; return dot(n, h) < 0 ? [tri[0], tri[2], tri[1]] : tri; };
const quad = (a, b, c, d, hint) => [orient([a, b, c], hint), orient([a, c, d], hint)];
const centroid = t => mul(add(add(t[0], t[1]), t[2]), 1 / 3);

// ---- 2D: sokszög lyukakkal → háromszögek (fülvágás; a lyukakat híddal fűzzük a külső körvonalba) ----
const area2 = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
function segCross(a, b, c, d){   // valódi metszés (közös végpont nem számít)
  const same = (p, q) => Math.abs(p[0] - q[0]) < 1e-12 && Math.abs(p[1] - q[1]) < 1e-12;
  if(same(a, c) || same(a, d) || same(b, c) || same(b, d)) return false;
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}
function triangulate(outer, holes = []){
  let poly = area2(outer) < 0 ? [...outer].reverse() : [...outer];
  const hs = holes.map(h => area2(h) > 0 ? [...h].reverse() : [...h]).sort((a, b) => Math.max(...b.map(p => p[0])) - Math.max(...a.map(p => p[0])));
  hs.forEach((h, hi) => {
    const mi = h.reduce((best, p, i) => p[0] > h[best][0] ? i : best, 0), M = h[mi], ring = [...h.slice(mi), ...h.slice(0, mi)];
    const others = hs.slice(hi + 1);
    const edges = P => P.map((p, i) => [p, P[(i + 1) % P.length]]);
    const blockers = [...edges(poly), ...edges(h), ...others.flatMap(edges)];
    const cand = poly.map((p, i) => [Math.hypot(p[0] - M[0], p[1] - M[1]), i]).sort((a, b) => a[0] - b[0]);
    const pick = cand.find(([, i]) => !blockers.some(([a, b]) => segCross(M, poly[i], a, b)));
    if(!pick) throw new Error('nincs híd a lyukhoz');
    const vi = pick[1];
    poly = [...poly.slice(0, vi + 1), ...ring, M, poly[vi], ...poly.slice(vi + 1)];
  });
  const out = [], idx = poly.map((_, i) => i);
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inside = (p, a, b, c) => cr(a, b, p) > 1e-14 && cr(b, c, p) > 1e-14 && cr(c, a, p) > 1e-14;
  const eq = (p, q) => p[0] === q[0] && p[1] === q[1];
  let guard = 0;
  while(idx.length > 3 && guard++ < 20000){
    let found = false;
    for(let k = 0; k < idx.length; k++){
      const ia = idx[(k + idx.length - 1) % idx.length], ib = idx[k], ic = idx[(k + 1) % idx.length], a = poly[ia], b = poly[ib], c = poly[ic];
      if(cr(a, b, c) <= 1e-14) continue;
      if(idx.some(j => j !== ia && j !== ib && j !== ic && !eq(poly[j], a) && !eq(poly[j], b) && !eq(poly[j], c) && inside(poly[j], a, b, c))) continue;
      out.push([a, b, c]); idx.splice(k, 1); found = true; break;
    }
    if(!found){ const k = idx.findIndex((ib, q) => { const a = poly[idx[(q + idx.length - 1) % idx.length]], c = poly[idx[(q + 1) % idx.length]]; return cr(a, poly[ib], c) <= 1e-14; });
      idx.splice(k < 0 ? 0 : k, 1); }      // elfajult (egyenesbe eső) csúcs eldobása
  }
  if(idx.length === 3) out.push(idx.map(i => poly[i]));
  return out;
}

// ---- lap-keret: 2D (s,t) → 3D ----
const frame = (o, u, v, n) => ({ o, u, v, n, P:([s, t]) => add(o, add(mul(u, s), mul(v, t))) });
const FRONT = frame([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const TOP = frame([0, H, 0], [1, 0, 0], [0, 0, -1], [0, 1, 0]);
const BOTTOM = frame([0, 0, 0], [1, 0, 0], [0, 0, -1], [0, -1, 0]);
const BACK = frame([0, 0, 0], dB, [0, 1, 0], nBack);
const circle = (c, r, n) => Array.from({ length:n }, (_, i) => { const a = i / n * 2 * Math.PI; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });

// ---- élen vágott buborék: negyedgömb-üreg; a két lap körvonal-íve ugyanazokból a csúcsokból ----
// edge: élpont a 3D-ben (C), él-irány e, a két lap kifelé normálja n1, n2 (merőlegesek). a ∈ [0, π] az él mentén, b ∈ [0, π/2] a két lap között.
function notch(C, e, n1, n2, r, na, nb){
  const P = (a, b) => add(C, mul(add(mul(e, Math.cos(a)), mul(add(mul(n1, -Math.cos(b)), mul(n2, -Math.sin(b))), Math.sin(a))), r));
  const tris = [];
  for(let i = 0; i < na; i++) for(let j = 0; j < nb; j++){
    const a0 = Math.PI * i / na, a1 = Math.PI * (i + 1) / na, b0 = Math.PI / 2 * j / nb, b1 = Math.PI / 2 * (j + 1) / nb;
    tris.push(...quad(P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1), t => sub(C, centroid(t))));
  }
  // b = 0: az n2 lapján fekvő ív · b = π/2: az n1 lapján fekvő ív (a = 0 … π)
  return { tris, arcOn2:Array.from({ length:na + 1 }, (_, i) => P(Math.PI * i / na, 0)), arcOn1:Array.from({ length:na + 1 }, (_, i) => P(Math.PI * i / na, Math.PI / 2)) };
}
// 3D ív → a lap 2D koordinátái (a lap keretébe vetítve)
const to2D = (F, pts) => pts.map(p => { const d = sub(p, F.o); return [dot(d, F.u), dot(d, F.v)]; });

// ---- lyuk-üreg egy lapon: B kúp, C kétszínű tál; a perem a lap körvonal-lyukával azonos csúcsokból ----
function cavity(F, c, r, n, depth, rings){
  const C0 = F.P(c), rimAt = (k, rr, dd) => { const a = k / n * 2 * Math.PI; return add(F.P([c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)]), mul(F.n, -dd)); };
  const axisHint = t => { const m = centroid(t); const toAxis = sub(add(C0, mul(F.n, -dot(sub(m, C0), F.n))), m); return add(nrm(toAxis), mul(F.n, .6)); };
  const parts = rings.map(() => []);
  let prev = { rr:r, dd:0 };
  rings.map(g => ({ rr:g.f * r, dd:g.k * depth })).forEach((g, gi) => {
    for(let k = 0; k < n; k++){
      if(g.rr === 0){ parts[gi].push(orient([rimAt(k, prev.rr, prev.dd), rimAt(k + 1, prev.rr, prev.dd), sub(C0, mul(F.n, g.dd))], axisHint)); continue; }
      parts[gi].push(...quad(rimAt(k, prev.rr, prev.dd), rimAt(k + 1, prev.rr, prev.dd), rimAt(k + 1, g.rr, g.dd), rimAt(k, g.rr, g.dd), axisHint));
    }
    prev = g;
  });
  return parts;
}

// ============================================================
//  A – minimál: egy kihúzott szelet (kéreg-lapok külön színnel) + 3 sötét lyuk-korong
// ============================================================
function buildA(){
  const m = G.model(), seg = 6;
  const prof = [[0, 0], ...Array.from({ length:seg + 1 }, (_, i) => { const a = TH * i / seg; return [L * Math.cos(a), L * Math.sin(a)]; })];
  // extrude: (x, y) profil Z mentén → X körül -90°: (x, y, z) → (x, z, -y) – a profil felülnézet, a kihúzás a magasság
  const tris = G.extrude(prof, H);
  const rot = p => [p[0], p[2] + H / 2, -p[1]];
  const paste = [], rind = [], top = [];
  for(const t of tris){ const q = t.map(rot), n = nrm(cross(sub(q[1], q[0]), sub(q[2], q[0])));
    (n[1] > .9 ? top : Math.abs(n[1]) < .5 && dot(n, [0, 0, 1]) < .9 && dot(n, nBack) < .9 ? rind : paste).push(q); }
  m.add(paste, { color:'gold:1' }); m.add(top, { color:'honey:2' }); m.add(rind, { color:'gold:2' });
  // lyuk-korongok: legyező a lap előtt 0,4 mm-rel
  const disc = (F, c, r, n = 10) => { const C0 = add(F.P(c), mul(F.n, .0004)), out = [];
    for(let k = 0; k < n; k++){ const a0 = k / n * 2 * Math.PI, a1 = (k + 1) / n * 2 * Math.PI;
      const p0 = add(C0, add(mul(F.u, r * Math.cos(a0)), mul(F.v, r * Math.sin(a0)))), p1 = add(C0, add(mul(F.u, r * Math.cos(a1)), mul(F.v, r * Math.sin(a1))));
      out.push(orient([C0, p0, p1], F.n)); }
    return out; };
  m.add([...disc(FRONT, [.038, .034], .0145), ...disc(FRONT, [.084, .047], .010), ...disc(TOP, [.072, .030], .0095)], { color:'gold:2' });
  return m;
}

// ============================================================
//  B/C közös építő: letört kéreg-él, valódi lyukak a lapokon, élen vágott buborékok
// ============================================================
function buildWedge(o){
  const m = G.model(), T = [], put = (color, tris) => { if(!T[color]) T[color] = []; T[color].push(...tris); };
  const { seg, c, rind, tipB } = o;                     // ív-szegmens, élletörés, kéreg-vastagság (C), csúcs-letörés (C)
  const Lp = L - rind;                                  // a sajt-bél sugara (a kéreg ezen kívül)
  const Lin = rind ? Lp : L - c;                        // a bél lapjainak külső széle
  // --- élen vágott buborékok (negyedgömb): a körvonalba ugyanazok a pontok kerülnek ---
  const N = o.notch;
  const nTF = N.topFront && notch([N.topFront.x, H, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0], N.topFront.r, N.na, N.nb);    // n1 = elöl, n2 = teteje
  const nBF = N.botFront && notch([N.botFront.x, 0, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], N.botFront.r, N.na, N.nb);   // n1 = elöl, n2 = alja
  const nTB = N.topBack && notch(add(mul(dB, N.topBack.s), [0, H, 0]), dB, nBack, [0, 1, 0], N.topBack.r, N.na, N.nb); // n1 = hátul, n2 = teteje
  // --- körvonalak (2D, pozitív körüljárás) ---
  const t0 = tipB || 0;
  // elöl: a lyuk-ív a b = π/2 oldalon (n1 = elöl) fekszik; a körvonal balról jobbra halad alul, jobbról balra felül
  const frontOut = [[t0, 0],
    ...(nBF ? to2D(FRONT, nBF.arcOn1).reverse() : []),
    [Lin, 0], ...(rind ? [] : [[L, c], [L, H - c]]), [Lin, H],
    ...(nTF ? to2D(FRONT, nTF.arcOn1) : []),
    [t0, H]];
  const sector = (y) => [...(t0 ? [[t0, 0]] : [[0, 0]]), ...(y === 'top' && nTF ? to2D(TOP, nTF.arcOn2).reverse() : []),
    ...(y === 'bot' && nBF ? to2D(BOTTOM, nBF.arcOn2).reverse() : []),
    ...Array.from({ length:seg + 1 }, (_, i) => { const a = TH * i / seg; return [Lin * Math.cos(a), Lin * Math.sin(a)]; }),
    ...(y === 'top' && nTB ? to2D(TOP, nTB.arcOn2) : []),
    ...(t0 ? [[t0 * Math.cos(TH), t0 * Math.sin(TH)]] : [])];
  const backOut = [[t0, 0], [Lin, 0], ...(rind ? [] : [[L, c], [L, H - c]]), [Lin, H], ...(nTB ? to2D(BACK, nTB.arcOn1) : []), [t0, H]];
  // --- lapok lyukakkal ---
  const face = (F, outline, holes, color) => {
    const hp = (holes || []).map(h => circle(h.c, h.r, h.n || o.holeSeg));
    put(color || o.paste, triangulate(outline, hp).map(t => orient(t.map(F.P), F.n)));
    for(const h of holes || []){ const parts = cavity(F, h.c, h.r, h.n || o.holeSeg, h.r * o.depth, o.rings);
      parts.forEach((p, i) => put(o.ringColors[i], p)); }
  };
  face(FRONT, frontOut, o.holes.front);
  face(TOP, sector('top'), o.holes.top, o.top);          // a tető a játék napfényében amúgy is a legvilágosabb → mélyebb alapszín, hogy ne legyen citromsárga
  face(BOTTOM, sector('bot'), o.holes.bottom);
  face(BACK, backOut, o.holes.back);
  for(const n of [nTF, nBF, nTB].filter(Boolean)) put(o.notchColor, n.tris);
  // --- csúcs-letörés (C) ---
  if(t0){ const a = [t0, 0, 0], b = mul(dB, t0); put(o.paste, quad(a, b, add(b, [0, H, 0]), add(a, [0, H, 0]), [-1, 0, 0])); }
  // --- kéreg ---
  const at = (i, rho, y) => { const a = -TH * i / seg; return [rho * Math.cos(a), y, rho * Math.sin(a)]; };
  const radial = i => { const a = -TH * (i + .5) / seg; return [Math.cos(a), 0, Math.sin(a)]; };
  for(let i = 0; i < seg; i++){
    put(o.rindSide, quad(at(i, L, c), at(i + 1, L, c), at(i + 1, L, H - c), at(i, L, H - c), radial(i)));
    put(o.rindEdge, quad(at(i, L, H - c), at(i + 1, L, H - c), at(i + 1, L - c, H), at(i, L - c, H), add(radial(i), [0, 1, 0])));
    put(o.rindEdge, quad(at(i, L, c), at(i + 1, L, c), at(i + 1, L - c, 0), at(i, L - c, 0), add(radial(i), [0, -1, 0])));
    if(rind){   // külön kéreg-réteg: felső és alsó gyűrű a bél és a letört él között
      put(o.rindTop, quad(at(i, Lp, H), at(i + 1, Lp, H), at(i + 1, L - c, H), at(i, L - c, H), [0, 1, 0]));
      put(o.rindTop, quad(at(i, Lp, 0), at(i + 1, Lp, 0), at(i + 1, L - c, 0), at(i, L - c, 0), [0, -1, 0]));
    }
  }
  if(rind){   // a kéreg két vége (elöl és hátul): hatszög a vágott lap síkjában
    for(const [F, i] of [[FRONT, 0], [BACK, seg]]){
      const ring = [at(i, Lp, 0), at(i, L - c, 0), at(i, L, c), at(i, L, H - c), at(i, L - c, H), at(i, Lp, H)];
      const tris = []; for(let k = 1; k < ring.length - 1; k++) tris.push(orient([ring[0], ring[k], ring[k + 1]], F.n));
      put(o.rindCap, tris);
    }
  }
  for(const color in T) m.add(T[color], { color });
  return m;
}

// ============================================================
//  B – közepes: letört kéreg-él, 14 szegmenses kúp-lyukak, egy élen vágott buborék
// ============================================================
const buildB = () => buildWedge({
  seg:12, c:.004, rind:0, tipB:0, holeSeg:14, depth:.7,
  rings:[{ f:0, k:1 }],                                   // kúp: perem → csúcs
  paste:'gold:1', top:'honey:2', ringColors:['gold:2'], notchColor:'gold:2', rindSide:'gold:2', rindEdge:'honey:3',
  notch:{ na:10, nb:3, topFront:{ x:.098, r:.0105 } },
  holes:{
    front:[{ c:[.040, .033], r:.0145 }, { c:[.083, .048], r:.0100 }, { c:[.068, .016], r:.0068 }, { c:[.016, .052], r:.0055 }],
    top:[{ c:[.063, .027], r:.0092 }, { c:[.090, .048], r:.0060 }],
    back:[{ c:[.060, .036], r:.0110 }],
  },
});

// ============================================================
//  C – részletes: külön kéreg-réteg letört élekkel, csúcs-letörés, 24 szegmenses kétszínű tál-lyukak, 3 élen vágott buborék
// ============================================================
const buildC = () => buildWedge({
  seg:24, c:.003, rind:.004, tipB:.004, holeSeg:24, depth:.75,
  rings:[{ f:.9, k:.42 }, { f:.55, k:.85 }, { f:0, k:1 }],   // tál: meredek fal → lapos fenék
  paste:'gold:1', top:'honey:2', ringColors:['honey:3', 'gold:2', 'gold:2'], notchColor:'gold:2',
  rindSide:'gold:2', rindEdge:'honey:3', rindTop:'gold:2', rindCap:'gold:2',
  notch:{ na:18, nb:5, topFront:{ x:.093, r:.0115 }, botFront:{ x:.027, r:.0105 }, topBack:{ s:.064, r:.0095 } },
  holes:{
    front:[{ c:[.043, .036], r:.0155 }, { c:[.084, .043], r:.0105 }, { c:[.069, .0155], r:.0075 }, { c:[.0145, .055], r:.0055, n:20 },
           { c:[.101, .019], r:.0060, n:20 }, { c:[.062, .061], r:.0042, n:20 }],
    top:[{ c:[.061, .027], r:.0095 }, { c:[.084, .053], r:.0060, n:20 }, { c:[.033, .0145], r:.0040, n:20 }],
    bottom:[{ c:[.060, .030], r:.0090, n:16 }],
    back:[{ c:[.050, .034], r:.0120 }, { c:[.088, .020], r:.0070, n:20 }],
  },
});

for(const [name, build] of [['sajt_a', buildA], ['sajt_b', buildB], ['sajt_c', buildC]]){
  const r = build().save(OUT + '/' + name + '.glb');
  console.log(name, r);
}
