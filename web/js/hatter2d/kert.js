// ============================================================
//  2D HÁTTÉR – KERT (kerti, beporzós, komposztos játékokhoz): sávos ég nappal, felhők, két domb-sor, fák,
//  léckerítés, méhkaptár, virágos rét fűcsomókkal és méhecskékkel.
//
//  beecoHatter2D.kert(canvas, { seed:3, hive:true, bees:3 })   → { redraw(o), destroy() }
//  beecoHatter2D.kertLayout(W, H, seed) – tiszta függvény (Node-teszt). layout.lawn = a rét teteje (ide jöhetnek a játék elemei).
// ============================================================
(function(root){
  const A = root.beecoHatter2D || (typeof require === 'function' ? require('./alap.js') : null);

  function kertLayout(W, H, seed = 3){
    const r = A.rng(seed), u = A.unitOf(W, H, 0.06, 20), horizon = H * 0.5, fence = H * 0.66, lawn = H * 0.72;
    const hill = (base, amp, n) => { const ph = r() * 6, pts = [];
      for(let i = 0; i <= 24; i++){ const t = i / 24; pts.push([t * W, base - amp * (0.55 + 0.45 * Math.sin(t * n * Math.PI + ph))]); } return pts; };
    const trees = []; for(let x = u * 0.5 + r() * u; x < W; x += u * (3 + r() * 3)) trees.push({ x, s:u * (1.4 + r() * 0.8), cone:r() < 0.3, apples:r() < 0.5 });
    const flowers = []; const n = Math.round(W * (H - lawn) / (u * u * 3));
    for(let i = 0; i < n; i++) flowers.push({ x:r() * W, y:lawn + u * 0.4 + r() * (H - lawn - u * 0.5), s:u * (0.13 + r() * 0.1), c:Math.floor(r() * 4) });
    flowers.sort((a, b) => a.y - b.y);                                                  // hátulról előre
    const tufts = Array.from({ length:Math.round(W / (u * 0.9)) }, () => ({ x:r() * W, y:lawn + r() * (H - lawn), s:u * (0.25 + r() * 0.2) }));
    const clouds = Array.from({ length:3 }, (_, i) => ({ x:W * (0.34 + i * 0.24 + r() * 0.08), y:H * (0.1 + r() * 0.16), s:u * (0.6 + r() * 0.5) }));
    const bees = Array.from({ length:6 }, () => ({ x:W * (0.15 + r() * 0.7), y:H * (0.3 + r() * 0.3), a:(r() - 0.5) * 0.6 }));
    return { u, horizon, fence, lawn, far:hill(horizon + u * 0.3, u * 1.6, 2.2), near:hill(horizon + u * 1.6, u * 1.1, 3.1),
      trees, flowers, tufts, clouds, bees, hive:{ x:W * (W < H ? 0.72 : 0.8), y:lawn + u * 1.2 }, sun:{ x:W * 0.14, y:H * 0.16 } };
  }
  if(typeof module !== 'undefined' && module.exports && !root.document){ module.exports = { kertLayout }; return; }

  function paint(x, W, H, o){
    const M = A.M(), L = kertLayout(W, H, o.seed), u = L.u, ink = A.ink(), lw = Math.max(1.4, u * 0.06);
    A.skyBands(x, W, 0, L.horizon + u * 2, [M.sky[2], M.sky[1], M.sky[0], M.cream[0]]);
    A.sun(x, L.sun.x, L.sun.y, Math.min(W, H) * 0.065);
    for(const c of L.clouds) A.cloud(x, c.x, c.y, c.s);
    const band = (pts, fill, bottom) => { x.beginPath(); x.moveTo(0, bottom); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(W, bottom); x.closePath(); A.shape(x, fill); };
    band(L.far, M.sage[1], H); band(L.near, M.grass[0], H);
    // a közeli dombon apró fasor (pöttyök) – távolság-érzet
    for(let i = 1; i < L.near.length - 1; i += 2){ const p = L.near[i]; A.circle(x, p[0], p[1] - u * 0.18, u * 0.22, M.leaf[0]); }
    x.fillStyle = M.grass[1]; x.fillRect(0, L.fence - u * 0.5, W, H);                  // kert talaja a kerítés mögött
    for(const t of L.trees) tree(x, M, t, L.fence + u * 0.2, ink, lw);
    fence(x, M, L, W, ink, lw);
    x.fillStyle = M.grass[1]; x.fillRect(0, L.lawn, W, H - L.lawn);                    // rét: sávos nyírás két tónusban
    x.fillStyle = M.grass[0];
    for(let i = 0; i * u * 1.6 < W + H; i += 2){ x.beginPath(); const a = i * u * 1.6;
      x.moveTo(a, L.lawn); x.lineTo(a + u * 1.6, L.lawn); x.lineTo(a + u * 1.6 - (H - L.lawn) * 0.5, H); x.lineTo(a - (H - L.lawn) * 0.5, H); x.closePath(); x.fill(); }
    x.fillStyle = M.grass[2]; x.fillRect(0, L.lawn, W, 3);
    const petals = [M.blossom[1], M.white[0], M.sky[1], M.purple[0]];
    const hv = o.hive !== false ? L.hive : null;
    for(const t of L.tufts) tuft(x, M, t.x, t.y, t.s);
    for(const f of L.flowers){
      if(hv && Math.abs(f.x - hv.x) < u * 1.9 && f.y < hv.y + u * 0.2) continue;       // ne nőjön a kaptár alá
      x.strokeStyle = M.leaf[2]; x.lineWidth = 1.6; x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x, f.y + f.s * 3); x.stroke();
      A.flower(x, f.x, f.y, f.s, petals[f.c], M.honey[1]);
    }
    if(hv) hive(x, M, hv.x, hv.y, u, ink, lw);
    for(const b of L.bees.slice(0, o.bees == null ? 3 : o.bees)) bee(x, M, b, u, ink);
  }

  function tree(x, M, t, base, ink, lw){
    const s = t.s;
    A.rect(x, t.x - s * 0.1, base - s * 1.1, s * 0.2, s * 1.1, M.wood[1], ink, lw);
    x.fillStyle = M.wood[2]; x.fillRect(t.x + s * 0.02, base - s * 1.1, s * 0.07, s * 1.1);
    if(t.cone){
      A.poly(x, [[t.x, base - s * 2.6], [t.x + s * 0.6, base - s * 0.9], [t.x - s * 0.6, base - s * 0.9]], M.leaf[1], ink, lw);
      A.poly(x, [[t.x, base - s * 2.6], [t.x - s * 0.6, base - s * 0.9], [t.x - s * 0.1, base - s * 0.9]], M.leaf[0]);
    } else {
      A.puff(x, t.x, base - s * 1.55, s * 0.55, M.leaf[2], ink, lw);                      // sötét hátsó lomb
      A.puff(x, t.x - s * 0.08, base - s * 1.65, s * 0.45, M.leaf[1]);
      A.circle(x, t.x - s * 0.25, base - s * 1.85, s * 0.2, M.leaf[0]);                    // napos oldal
      if(t.apples) for(const [dx, dy] of [[-0.3, -1.4], [0.25, -1.55], [0.05, -1.25], [0.4, -1.3]]) A.circle(x, t.x + s * dx, base + s * dy, s * 0.07, M.red[1], ink, 1);
    }
  }

  function fence(x, M, L, W, ink, lw){
    const u = L.u, top = L.fence - u * 0.9, bot = L.lawn + u * 0.1, pw = u * 0.42, gap = u * 0.2;
    for(const k of [0.3, 0.72]) A.rect(x, -lw, top + (bot - top) * k, W + lw * 2, u * 0.16, M.wood[2], ink, lw);   // hevederek
    for(let px = u * 0.1; px < W; px += pw + gap){
      A.poly(x, [[px, bot], [px, top + pw * 0.4], [px + pw / 2, top], [px + pw, top + pw * 0.4], [px + pw, bot]], M.cream[1], ink, lw);
      x.fillStyle = M.cream[2]; x.fillRect(px + pw * 0.66, top + pw * 0.5, pw * 0.28, bot - top - pw * 0.55);
    }
  }

  function tuft(x, M, cx, cy, s){
    x.fillStyle = M.grass[2]; x.beginPath();
    for(const [dx, h] of [[-0.5, 0.8], [-0.15, 1.2], [0.2, 0.95], [0.5, 0.7]]){ x.moveTo(cx + dx * s - s * 0.12, cy); x.lineTo(cx + dx * s + dx * s * 0.3, cy - h * s); x.lineTo(cx + dx * s + s * 0.12, cy); }
    x.fill();
  }

  // méhkaptár: tető, három fiók-doboz (méz-tónusok), röpnyílás, lábak – letört sarkokkal, 3 tónusban
  function hive(x, M, cx, base, u, ink, lw){
    const w = u * 2.9, bh = u * 0.8, d = w * 0.14;
    for(const k of [-0.38, 0.38]) A.rect(x, cx + k * w - u * 0.08, base - u * 0.35, u * 0.16, u * 0.35, M.wood[2], ink, lw * 0.8);
    for(let i = 0; i < 3; i++){ const top = base - u * 0.35 - bh * (i + 1);
      A.box(x, cx - w / 2, top, w, bh, d, [M.honey[0], i === 1 ? M.gold[1] : M.honey[1], M.honey[2]], ink, lw);
      A.rect(x, cx - u * 0.35, top + bh * 0.3, u * 0.7, u * 0.1, M.honey[2], null); }
    const rt = base - u * 0.35 - bh * 3;
    A.poly(x, [[cx - w * 0.6, rt], [cx - w * 0.45, rt - u * 0.45], [cx + w * 0.45 + d, rt - u * 0.45 - d * 0.6], [cx + w * 0.6 + d, rt - d * 0.4]], M.sage[2], ink, lw);
    A.rect(x, cx - w * 0.62, rt - u * 0.05, w * 1.24 + d, u * 0.14, M.sage[3], ink, lw);
    A.rect(x, cx - u * 0.45, base - u * 0.35 - u * 0.18, u * 0.9, u * 0.1, M.dark[1], null);   // röpnyílás
    A.hexPath(x, cx, base - u * 0.35 - bh * 1.5, u * 0.18); A.shape(x, M.paper[0], ink, lw * 0.7);
  }

  function bee(x, M, b, u, ink){
    const s = u * 0.22; x.save(); x.translate(b.x, b.y); x.rotate(b.a);
    x.globalAlpha = 0.85; A.circle(x, -s * 0.2, -s * 0.8, s * 0.55, M.white[0], ink, 1); A.circle(x, s * 0.35, -s * 0.75, s * 0.45, M.white[0], ink, 1); x.globalAlpha = 1;
    x.beginPath(); x.ellipse(0, 0, s, s * 0.7, 0, 0, Math.PI * 2); A.shape(x, M.honey[1], ink, 1.4);
    x.fillStyle = ink; x.fillRect(-s * 0.2, -s * 0.66, s * 0.22, s * 1.32); x.fillRect(s * 0.35, -s * 0.5, s * 0.18, s);
    x.restore();
    x.strokeStyle = ink; x.lineWidth = 1; x.setLineDash([2, 4]); x.beginPath();                        // röppálya
    x.moveTo(b.x - s * 1.4, b.y + s * 0.3); x.quadraticCurveTo(b.x - s * 4, b.y + s * 2.5, b.x - s * 6.5, b.y + s * 0.5); x.stroke(); x.setLineDash([]);
  }

  const kert = (canvas, o = {}) => A.mount(canvas, paint, Object.assign({ seed:3, hive:true, bees:3 }, o));
  Object.assign(A, { kert, kertLayout });
})(typeof window !== 'undefined' ? window : globalThis);
