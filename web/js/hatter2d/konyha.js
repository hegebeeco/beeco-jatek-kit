// ============================================================
//  2D HÁTTÉR – KONYHA (étel- és hűtős játékokhoz): csempés fal, ablak éggel és függönnyel, polcok befőttes üvegekkel,
//  pult szekrényekkel, hűtő-sziluett mágnesekkel, lógó lámpa, cserepes növények, fapadló.
//
//  beecoHatter2D.konyha(canvas, { seed:7, fridge:true, lamp:true })   → { redraw(o), destroy() }
//  beecoHatter2D.konyhaLayout(W, H, seed) – tiszta függvény (Node-teszt): hol mi áll; álló képen keskenyebb ablak, kisebb hűtő.
//  A pult teteje: layout.counter – a 2D játék ide teheti az ételeket (a játék elemei a vászon FÖLÖTT vannak).
// ============================================================
(function(root){
  const A = root.beecoHatter2D || (typeof require === 'function' ? require('./alap.js') : null);

  function konyhaLayout(W, H, seed = 7){
    const r = A.rng(seed), u = A.unitOf(W, H, 0.07, 20), portrait = W < H * 0.9;
    const floor = H * 0.9, counter = H * (portrait ? 0.7 : 0.66);
    const fw = A.clamp(W * 0.2, u * 3, u * 4.6), fx = W - fw * (portrait ? 0.82 : 0.95), ftop = floor - Math.min(H * 0.72, (floor - counter) * 2.05);
    const win = { x:W * 0.07, y:H * 0.13, w:Math.min(W * (portrait ? 0.46 : 0.36), u * 9), h:Math.max(u * 3, counter - u * 1.3 - H * 0.13) };
    const sx0 = win.x + win.w + u * 0.9, sx1 = fx - u * 0.7;
    const shelves = sx1 - sx0 > u * 2.4 ? [0.3, 0.58].map(k => ({ x:sx0, w:sx1 - sx0, y:H * 0.1 + (counter - H * 0.1) * k })) : [];
    const JARS = ['honey', 'tomato', 'leaf', 'orange', 'berry', 'cream'];
    const items = shelves.map(s => { const out = []; for(let x = s.x + u * 0.3; x < s.x + s.w - u * 0.9;){
      const kind = r() < 0.6 ? 'jar' : r() < 0.5 ? 'pot' : 'bowl', w = u * (kind === 'bowl' ? 1.1 : 0.7 + r() * 0.25);
      out.push({ kind, x, w, h:u * (kind === 'bowl' ? 0.45 : 0.8 + r() * 0.5), m:JARS[Math.floor(r() * JARS.length)] }); x += w + u * (0.2 + r() * 0.35); }
      return out; });
    const plants = [0.2, 0.5, 0.8].map(k => ({ x:win.x + win.w * k, s:u * (0.55 + r() * 0.3), tall:r() > 0.5 }));
    const magnets = Array.from({ length:4 }, () => ({ x:0.2 + r() * 0.6, y:0.1 + r() * 0.8, m:['honey', 'blossom', 'sky', 'leaf'][Math.floor(r() * 4)] }));
    return { u, portrait, floor, counter, fridge:{ x:fx, w:fw, top:ftop }, win, shelves, items, plants, magnets };
  }
  if(typeof module !== 'undefined' && module.exports && !root.document){ module.exports = { konyhaLayout }; return; }

  function paint(x, W, H, o){
    const M = A.M(), L = konyhaLayout(W, H, o.seed), u = L.u, ink = A.ink(), lw = Math.max(1.4, u * 0.06);
    // fal + csempés hátfal a pult fölött (két tónusú csempe, fugával)
    x.fillStyle = M.sage[0]; x.fillRect(0, 0, W, L.counter);
    x.fillStyle = M.sage[1]; x.fillRect(0, 0, W, u * 0.35);                               // felső szegély
    const tile = u * 0.62, ty0 = L.counter - tile * 3;
    for(let row = 0; row < 3; row++) for(let c = 0; c * tile < W; c++){
      x.fillStyle = (row + c) % 2 ? M.white[0] : M.sky[0]; x.fillRect(c * tile + 1, ty0 + row * tile + 1, tile - 2, tile - 2); }
    x.fillStyle = M.sage[2]; x.fillRect(0, ty0 - 2, W, 3);
    window_(x, M, L, ink, lw);
    L.shelves.forEach((s, i) => shelf(x, M, s, L.items[i], u, ink, lw));
    // padló: deszkák két tónusban
    x.fillStyle = M.wood[1]; x.fillRect(0, L.floor, W, H - L.floor);
    x.strokeStyle = M.wood[2]; x.lineWidth = 1.5;
    for(let px = -u; px < W; px += u * 2.2){ x.beginPath(); x.moveTo(px, L.floor); x.lineTo(px - u * 0.8, H); x.stroke(); }
    // pult: munkalap (világos teteje + élsáv) és szekrényajtók fogantyúval
    const ch = L.floor - L.counter, cw = o.fridge === false ? W : L.fridge.x;
    A.rect(x, 0, L.counter + u * 0.35, cw, ch - u * 0.35, M.cream[1], ink, lw);
    const doors = Math.max(2, Math.round(cw / (u * 2.6))), dw = cw / doors;
    for(let i = 0; i < doors; i++){ const dx = i * dw;
      A.rect(x, dx + u * 0.18, L.counter + u * 0.6, dw - u * 0.36, ch - u * 0.85, M.cream[0], ink, lw * 0.8, u * 0.12);
      A.rect(x, dx + dw / 2 - u * 0.3, L.counter + u * 0.85, u * 0.6, u * 0.14, M.steel[2], ink, lw * 0.7, u * 0.07); }
    x.fillStyle = M.dark[1]; x.fillRect(0, L.floor - u * 0.2, cw, u * 0.2);                // lábazat
    A.rect(x, -lw, L.counter, cw + lw, u * 0.35, M.wood[1], ink, lw);                      // munkalap
    x.fillStyle = M.wood[0]; x.fillRect(0, L.counter + lw / 2, cw - lw / 2, u * 0.08);
    // a pulton: vágódeszka és egy nagy cserepes fűszernövény
    A.rect(x, cw * 0.1, L.counter - u * 0.14, u * 1.8, u * 0.14, M.wood[0], ink, lw * 0.8, u * 0.07);
    pottedPlant(x, M, cw * 0.62, L.counter, u * 0.9, true, ink, lw);
    if(o.fridge !== false) fridge(x, M, L, ink, lw);
    if(o.lamp !== false){                                                                  // lógó lámpa méz-búrával
      const lx = L.win.x + L.win.w + (L.fridge.x - L.win.x - L.win.w) * 0.5, ly = H * 0.1;
      x.strokeStyle = ink; x.lineWidth = 2; x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx, ly); x.stroke();
      A.poly(x, [[lx - u * 0.25, ly], [lx + u * 0.25, ly], [lx + u * 0.6, ly + u * 0.55], [lx - u * 0.6, ly + u * 0.55]], M.honey[1], ink, lw);
      A.poly(x, [[lx - u * 0.25, ly], [lx - u * 0.05, ly], [lx - u * 0.25, ly + u * 0.55], [lx - u * 0.6, ly + u * 0.55]], M.honey[0]);
      x.beginPath(); x.arc(lx, ly + u * 0.55, u * 0.18, 0, Math.PI); A.shape(x, M.cream[0], ink, lw * 0.8);
    }
  }

  function window_(x, M, L, ink, lw){
    const w = L.win, u = L.u, f = u * 0.22;
    A.rect(x, w.x - f, w.y - f, w.w + f * 2, w.h + f * 2, M.white[1], ink, lw, u * 0.12);   // keret
    x.save(); x.beginPath(); x.rect(w.x, w.y, w.w, w.h); x.clip();
    A.skyBands(x, w.x + w.w, w.y, w.y + w.h * 0.75, [M.sky[1], M.sky[0], M.white[0]]);
    x.fillStyle = M.grass[0]; x.fillRect(w.x, w.y + w.h * 0.75, w.w, w.h * 0.25);
    A.puff(x, w.x + w.w * 0.3, w.y + w.h * 0.8, w.w * 0.12, M.leaf[0]); A.puff(x, w.x + w.w * 0.75, w.y + w.h * 0.78, w.w * 0.1, M.grass[2]);
    A.sun(x, w.x + w.w * 0.78, w.y + w.h * 0.22, u * 0.45);
    A.cloud(x, w.x + w.w * 0.3, w.y + w.h * 0.3, u * 0.45);
    x.restore();
    x.fillStyle = M.white[1]; x.fillRect(w.x + w.w / 2 - f / 2, w.y, f, w.h); x.fillRect(w.x, w.y + w.h * 0.45, w.w, f * 0.8);   // osztók
    x.strokeStyle = ink; x.lineWidth = lw * 0.6; x.strokeRect(w.x, w.y, w.w, w.h);
    for(const side of [0, 1]){                                                          // függöny két oldalt, redőkkel
      const cx = side ? w.x + w.w + f : w.x - f, dir = side ? -1 : 1, cwid = w.w * 0.2;
      A.poly(x, [[cx - dir * u * 0.15, w.y - f * 1.8], [cx + dir * cwid, w.y - f * 1.8], [cx + dir * cwid * 0.45, w.y + w.h * 0.55], [cx + dir * cwid * 0.7, w.y + w.h + f], [cx - dir * u * 0.15, w.y + w.h + f]], M.blossom[1], ink, lw);
      x.strokeStyle = M.blossom[2]; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + dir * cwid * 0.35, w.y); x.lineTo(cx + dir * cwid * 0.25, w.y + w.h * 0.5); x.stroke();
    }
    x.fillStyle = M.wood[2]; x.fillRect(w.x - f * 2, w.y - f * 2.2, w.w + f * 4, f * 0.6);   // karnis
    A.rect(x, w.x - f * 1.5, w.y + w.h + f * 0.4, w.w + f * 3, u * 0.22, M.white[0], ink, lw); // párkány
    for(const p of L.plants) pottedPlant(x, M, p.x, w.y + w.h + f * 0.4, p.s, p.tall, ink, lw);
  }

  function pottedPlant(x, M, cx, base, s, tall, ink, lw){
    const ph = s * 0.55, pw = s * 0.7;
    for(let i = 0; i < (tall ? 5 : 4); i++){ const a = -Math.PI / 2 + (i - (tall ? 2 : 1.5)) * 0.45, len = s * (tall ? 1.1 : 0.75);
      x.save(); x.translate(cx, base - ph); x.rotate(a + Math.PI / 2);
      x.beginPath(); x.ellipse(0, -len / 2, s * 0.17, len / 2, 0, 0, Math.PI * 2); A.shape(x, i % 2 ? M.leaf[1] : M.leaf[0], ink, lw * 0.7); x.restore(); }
    A.poly(x, [[cx - pw / 2, base - ph], [cx + pw / 2, base - ph], [cx + pw * 0.38, base], [cx - pw * 0.38, base]], M.orange[1], ink, lw);
    x.fillStyle = M.orange[2]; x.fillRect(cx + pw * 0.15, base - ph + 2, pw * 0.25, ph - 3);
    A.rect(x, cx - pw / 2 - 2, base - ph - s * 0.12, pw + 4, s * 0.14, M.orange[0], ink, lw * 0.8);
  }

  function shelf(x, M, s, items, u, ink, lw){
    for(const it of items){ const m = M[it.m], bx = it.x, by = s.y;
      if(it.kind === 'jar'){                                                            // befőttes üveg: üveg, tartalom, fedő
        A.rect(x, bx, by - it.h, it.w, it.h, M.glass[0], ink, lw * 0.8, u * 0.12);
        A.rect(x, bx + 2, by - it.h * 0.7, it.w - 4, it.h * 0.7 - 2, m[1], null, 0, u * 0.1);
        x.fillStyle = m[2]; x.fillRect(bx + it.w * 0.65, by - it.h * 0.7, it.w * 0.3 - 2, it.h * 0.7 - 3);
        A.rect(x, bx - 2, by - it.h - u * 0.2, it.w + 4, u * 0.22, M.red[1], ink, lw * 0.8, 3);
        x.fillStyle = M.white[0]; x.fillRect(bx + it.w * 0.18, by - it.h * 0.85, it.w * 0.1, it.h * 0.5);   // fénycsík
      } else if(it.kind === 'pot'){                                                     // fazék füllel
        A.rect(x, bx, by - it.h * 0.7, it.w, it.h * 0.7, M.steel[1], ink, lw * 0.8, u * 0.08);
        x.fillStyle = M.steel[2]; x.fillRect(bx + it.w * 0.7, by - it.h * 0.7 + 2, it.w * 0.28, it.h * 0.7 - 4);
        A.rect(x, bx - u * 0.1, by - it.h * 0.78, it.w + u * 0.2, u * 0.14, M.steel[0], ink, lw * 0.8, 3);
      } else {                                                                          // tál gyümölccsel
        A.circle(x, bx + it.w * 0.35, by - it.h * 0.9, it.h * 0.4, M.red[1], ink, lw * 0.7); A.circle(x, bx + it.w * 0.65, by - it.h * 0.95, it.h * 0.4, M.honey[1], ink, lw * 0.7);
        x.beginPath(); x.moveTo(bx, by - it.h * 0.7); x.lineTo(bx + it.w, by - it.h * 0.7); x.quadraticCurveTo(bx + it.w * 0.9, by, bx + it.w / 2, by); x.quadraticCurveTo(bx + it.w * 0.1, by, bx, by - it.h * 0.7);
        A.shape(x, M.sky[1], ink, lw * 0.8); }
    }
    A.rect(x, s.x, s.y, s.w, u * 0.22, M.wood[1], ink, lw);                               // polc-deszka + konzolok
    for(const k of [0.12, 0.88]) A.poly(x, [[s.x + s.w * k - u * 0.1, s.y + u * 0.22], [s.x + s.w * k + u * 0.1, s.y + u * 0.22], [s.x + s.w * k, s.y + u * 0.6]], M.wood[2], ink, lw * 0.8);
  }

  function fridge(x, M, L, ink, lw){
    const f = L.fridge, u = L.u, h = L.floor - f.top, d = f.w * 0.12, split = f.top + h * 0.3;
    A.box(x, f.x, f.top, f.w, h, d, [M.white[0], M.white[1], M.white[2]], ink, lw);
    x.strokeStyle = ink; x.lineWidth = lw; x.beginPath(); x.moveTo(f.x, split); x.lineTo(f.x + f.w, split); x.stroke();
    for(const [y0, y1] of [[f.top + h * 0.08, split - h * 0.06], [split + h * 0.06, split + h * 0.3]])
      A.rect(x, f.x + u * 0.25, y0, u * 0.18, y1 - y0, M.steel[2], ink, lw * 0.8, u * 0.09);            // fogantyúk
    for(const m of L.magnets){ const mx = f.x + f.w * (0.3 + m.x * 0.42), my = split + (L.floor - split - u) * m.y;
      A.hexPath(x, mx, my, u * 0.2); A.shape(x, M[m.m][1], ink, lw * 0.7); }
    A.rect(x, f.x + f.w * 0.36, split + h * 0.1, f.w * 0.34, u * 0.9, M.paper[0], ink, lw * 0.7);      // cetli
    x.strokeStyle = M.sage[2]; x.lineWidth = 1.5;
    for(let i = 1; i <= 3; i++){ x.beginPath(); x.moveTo(f.x + f.w * 0.41, split + h * 0.1 + i * u * 0.2); x.lineTo(f.x + f.w * 0.65, split + h * 0.1 + i * u * 0.2); x.stroke(); }
  }

  const konyha = (canvas, o = {}) => A.mount(canvas, paint, Object.assign({ seed:7, fridge:true, lamp:true }, o));
  Object.assign(A, { konyha, konyhaLayout });
})(typeof window !== 'undefined' ? window : globalThis);
