// ============================================================
//  2D HÁTTÉR – VÁROS két változatban, ugyanazon a várostérképen: szmogos ma ('szmog') és zöld 2075 ('zold')
//  (a 2075 – Vágod a zöld jövőt? játék jovo-city.js-ének általánosított változata)
//
//  beecoHatter2D.varos(canvas, { variant:'szmog'|'zold', seed:2075 })   → { redraw(o), destroy() }
//  beecoHatter2D.varosJovo(host, { seed, value:0 })                     → { set(0–1), redraw(o), destroy() }
//     két egymásra tett vászon: alul a szmogos, fölötte a zöld – a „jövő-mérő” (0–1) a zöld réteg átlátszóságát állítja,
//     így a keverés képkockánként semmibe sem kerül (mindkét kép egyszer rajzolódik).
//  beecoHatter2D.varosLayout(W, H, seed) – tiszta függvény: ugyanaz a seed → ugyanaz az elrendezés (Node-teszt).
// ============================================================
(function(root){
  const A = root.beecoHatter2D || (typeof require === 'function' ? require('./alap.js') : null);

  // TARTALOM-színek: a szmogos város szürkéi és barnái a szennyezett levegőt ábrázolják, ezért nincsenek a palettában.
  // [világos, alap, sötét] házszínek; a zöld város mindent az ART.MAT-ból vesz.
  const SZIN = { sky:['#8D8A80', '#A39D8B', '#B7AE96'], haze:'rgba(120,108,80,.20)', far:'#8E8B83',
    house:[['#8A8882', '#77756F', '#5F5D59'], ['#9A958A', '#85806F', '#6A665A'], ['#7C7E80', '#6A6C6F', '#545659']],
    win:'#4E4C47', winLit:'#C9B77A', line:'#3D3B36', smoke:['rgba(84,82,76,.62)', 'rgba(110,106,96,.5)'], ground:'#56544D',
    road:'#3D3B36', dash:'#C9C3AE', tyre:'#26241F', sunSmog:'rgba(230,214,170,.45)', sill:'rgba(255,255,255,.12)',
    curb:'rgba(255,255,255,.08)', veil:'rgba(120,110,80,.26)' };

  // ---- elrendezés: EGYSZER sorsolva, mindkét változat ebből fest ----
  function varosLayout(W, H, seed = 2075){
    const r = A.rng(seed), ground = H * 0.84, unit = Math.max(24, Math.min(H * 0.06, W * 0.09));
    const back = [], front = [], trees = [], cars = [], hills = [], birds = [];
    for(let x = -20; x < W + 20; x += unit * (1.1 + r() * 1.3)) back.push({ x, w:unit * (1 + r() * 1.2), h:H * (0.3 + r() * 0.28) });
    for(let x = -10; x < W + 10;){ const w = unit * (1.3 + r() * 1.5), h = H * (0.16 + r() * 0.26);
      front.push({ x, w, h, tone:Math.floor(r() * 4), roof:r(), cols:Math.max(2, Math.round(w / (unit * 0.42))), lit:r() }); x += w + unit * (0.25 + r() * 0.3); }
    for(let x = unit * 0.4; x < W; x += unit * (1.3 + r() * 1.1)) trees.push({ x, s:0.8 + r() * 0.5, kind:r() });
    for(let x = r() * unit; x < W; x += unit * (2.2 + r() * 2.4)) cars.push({ x, c:Math.floor(r() * 3) });
    for(let i = 0; i < 4; i++) hills.push({ x:W * (i / 3) + (r() - 0.5) * W * 0.2, r:W * (0.22 + r() * 0.12), h:H * (0.1 + r() * 0.08) });
    for(let i = 0; i < 5; i++) birds.push({ x:W * (0.2 + r() * 0.5), y:H * (0.12 + r() * 0.14), s:unit * (0.12 + r() * 0.08) });
    return { ground, unit, back, front, trees, cars, hills, birds };
  }
  if(typeof module !== 'undefined' && module.exports && !root.document){ module.exports = { varosLayout, SZIN }; return; }

  // ---- festés ----
  function paint(x, W, H, o){
    const M = A.M(), green = o.variant === 'zold', L = varosLayout(W, H, o.seed), G = L.ground, u = L.unit;
    const line = green ? A.ink() : SZIN.line, lw = 1.4;
    // ég: zöldben sávos kék → mézes horizont, szmogban barnás pára-sávok
    A.skyBands(x, W, 0, G, green ? [M.sky[1], M.sky[0], M.white[0], M.honey[0]] : SZIN.sky);
    if(green){
      A.sun(x, W * 0.82, H * 0.15, Math.min(W, H) * 0.06);
      for(const [cx, cy, s] of [[0.14, 0.12, 1], [0.46, 0.08, 0.8], [0.64, 0.24, 0.7]]) A.cloud(x, W * cx, H * cy, u * 0.5 * s);
      x.strokeStyle = A.ink(); x.lineWidth = 1.6;                                           // madarak (C-szintű élet)
      for(const b of L.birds){ x.beginPath(); x.moveTo(b.x - b.s, b.y - b.s * 0.5); x.quadraticCurveTo(b.x - b.s * 0.4, b.y - b.s * 0.7, b.x, b.y);
        x.quadraticCurveTo(b.x + b.s * 0.4, b.y - b.s * 0.7, b.x + b.s, b.y - b.s * 0.5); x.stroke(); }
      for(const hl of L.hills){ x.beginPath(); x.ellipse(hl.x, G - L.back[0].h * 0.35, hl.r, hl.h, 0, Math.PI, 0); A.shape(x, M.grass[0]); }
      for(let i = 0; i < 4; i++){ const tx = W * (0.08 + i * 0.27), ty = G - H * 0.5;         // szélkerekek a dombokon
        x.strokeStyle = M.white[2]; x.lineWidth = 3; x.beginPath(); x.moveTo(tx, G - H * 0.18); x.lineTo(tx, ty); x.stroke();
        x.strokeStyle = M.white[0]; x.lineWidth = 3.5;
        for(let k = 0; k < 3; k++){ const a = k * 2.094 + i; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + Math.cos(a) * u * 0.9, ty + Math.sin(a) * u * 0.9); x.stroke(); }
        A.circle(x, tx, ty, 3.5, M.white[2]); }
    } else A.circle(x, W * 0.82, H * 0.15, Math.min(W, H) * 0.05, SZIN.sunSmog);
    for(const b of L.back){ x.fillStyle = green ? M.sage[0] : SZIN.far; x.fillRect(b.x, G - b.h, b.w, b.h);   // távoli sziluett
      if(!green && b.w > u * 1.6){ x.fillRect(b.x + b.w * 0.6, G - b.h - u * 0.9, u * 0.2, u * 0.9); A.puff(x, b.x + b.w * 0.6 + u * 0.1, G - b.h - u * 1.2, u * 0.35, SZIN.smoke[1]); } }
    if(!green) for(let i = 0; i < 3; i++){ x.fillStyle = SZIN.haze; x.fillRect(0, H * (0.3 + i * 0.16), W, H * 0.07); }
    for(const b of L.front) house(x, M, b, G, u, green, line, lw);
    ground(x, M, L, W, H, green);
    if(!green){ x.fillStyle = SZIN.veil; x.fillRect(0, 0, W, H); }                          // barnás szmog-pára mindenen
  }

  // első házsor: térhatású doboz ablakráccsal + tetődísz (zöld: napelem / zöldtető / tetőkert · szmog: kémény / klíma + antenna)
  function house(x, M, b, G, u, green, line, lw){
    const top = G - b.h, d = b.w * 0.16;
    const tones = green ? [M.cream, M.sage, M.sky, M.blossom][b.tone] : SZIN.house[b.tone % 3];
    A.box(x, b.x, top, b.w, b.h, d, tones, line, lw);
    const cw = b.w / b.cols, rows = Math.max(1, Math.floor((b.h - u * 0.5) / (u * 0.55)));
    for(let rr = 0; rr < rows; rr++) for(let cc = 0; cc < b.cols; cc++){
      const wx = b.x + cc * cw + cw * 0.24, wy = top + u * 0.28 + rr * u * 0.55, ww = cw * 0.52, wh = u * 0.32, on = ((rr * 7 + cc * 3 + Math.round(b.lit * 10)) % 5) === 0;
      x.fillStyle = green ? (on ? M.honey[0] : M.sky[1]) : (on ? SZIN.winLit : SZIN.win); x.fillRect(wx, wy, ww, wh);
      x.fillStyle = green ? M.white[0] : SZIN.sill; x.fillRect(wx, wy + wh, ww, 2);                                   // párkány
      if(green && (rr + cc + b.tone) % 4 === 0){ A.circle(x, wx + ww * 0.3, wy + wh, 3, M.leaf[1]); A.circle(x, wx + ww * 0.7, wy + wh, 3, M.blossom[1]); }   // virágláda
    }
    if(green){
      if(b.roof < 0.4){
        for(let px = b.x + 4; px < b.x + b.w - u * 0.3; px += u * 0.42){
          A.poly(x, [[px, top - 2], [px + u * 0.12, top - u * 0.26], [px + u * 0.46, top - u * 0.26], [px + u * 0.34, top - 2]], M.blue[2], M.blue[3], 1.2);
          x.strokeStyle = M.sky[1]; x.lineWidth = 1; x.beginPath(); x.moveTo(px + u * 0.06, top - u * 0.13); x.lineTo(px + u * 0.4, top - u * 0.13); x.stroke(); }
      } else if(b.roof < 0.75){
        x.fillStyle = M.leaf[1]; x.fillRect(b.x, top - 5, b.w, 6);
        for(let px = b.x + 6; px < b.x + b.w; px += 11){ x.beginPath(); x.arc(px, top - 5, 5.5, Math.PI, 0); A.shape(x, (px / 11 | 0) % 2 ? M.leaf[0] : M.grass[1]); }
      } else { x.fillStyle = M.wood[2]; x.fillRect(b.x + b.w * 0.5, top - u * 0.35, 4, u * 0.35); A.puff(x, b.x + b.w * 0.5 + 2, top - u * 0.5, u * 0.24, M.leaf[1]); }
    } else if(b.roof < 0.5){
      const cx = b.x + b.w * 0.62; A.rect(x, cx, top - u * 0.8, u * 0.24, u * 0.8, SZIN.house[2][2], line, lw);
      for(let k = 0; k < 4; k++) A.puff(x, cx + u * 0.12 + k * u * 0.28, top - u * (1.05 + k * 0.38), u * (0.2 + k * 0.08), SZIN.smoke[k % 2]);
    } else {
      x.fillStyle = SZIN.house[2][1]; x.fillRect(b.x + b.w * 0.2, top - u * 0.22, u * 0.36, u * 0.22);
      x.strokeStyle = line; x.lineWidth = lw; x.beginPath(); x.moveTo(b.x + b.w * 0.75, top); x.lineTo(b.x + b.w * 0.75, top - u * 0.6);
      x.moveTo(b.x + b.w * 0.68, top - u * 0.45); x.lineTo(b.x + b.w * 0.82, top - u * 0.45); x.stroke();
    }
  }

  // talaj: zöldben fű, bicikliút, fák, virágok · szmogban aszfalt, autósor kipufogófüsttel
  function ground(x, M, L, W, H, green){
    const G = L.ground, u = L.unit, gh = H - G;
    x.fillStyle = green ? M.grass[1] : SZIN.ground; x.fillRect(0, G, W, gh);
    x.fillStyle = green ? M.grass[0] : SZIN.curb; x.fillRect(0, G, W, 4);
    if(green){
      x.fillStyle = M.sage[1]; x.fillRect(0, G + gh * 0.45, W, gh * 0.24);
      x.fillStyle = M.white[0]; for(let px = 0; px < W; px += 26) x.fillRect(px, G + gh * 0.56, 13, 2.5);
      for(const t of L.trees){ const s = t.s * u, bx = t.x, by = G + 3;
        x.fillStyle = M.wood[2]; x.fillRect(bx - 3, by - s * 0.55, 6, s * 0.58);
        if(t.kind < 0.5){ A.puff(x, bx, by - s * 0.75, s * 0.34, M.leaf[1]); A.puff(x, bx - s * 0.08, by - s * 0.84, s * 0.2, M.leaf[0]); }
        else { A.poly(x, [[bx, by - s * 1.25], [bx + s * 0.3, by - s * 0.45], [bx - s * 0.3, by - s * 0.45]], M.leaf[2]);
          A.poly(x, [[bx, by - s * 1.25], [bx - s * 0.3, by - s * 0.45], [bx - s * 0.02, by - s * 0.45]], M.leaf[1]); }
        const fc = [M.blossom[1], M.honey[1], M.white[0]][Math.floor(t.kind * 3)];
        for(const dx of [-8, 5, 12]) A.circle(x, bx + dx, G + gh * 0.3, 2.4, fc); }
    } else {
      x.fillStyle = SZIN.road; x.fillRect(0, G + gh * 0.32, W, gh * 0.4);
      x.fillStyle = SZIN.dash; for(let px = 0; px < W; px += 34) x.fillRect(px, G + gh * 0.5, 16, 2.5);
      for(const c of L.cars){ const cy = G + gh * 0.36, cw = u * 1.1, ch = u * 0.32, col = SZIN.house[c.c];
        x.fillStyle = col[1]; x.fillRect(c.x, cy, cw, ch); x.fillStyle = col[0]; x.fillRect(c.x + cw * 0.2, cy - ch * 0.55, cw * 0.55, ch * 0.6);
        x.fillStyle = SZIN.win; x.fillRect(c.x + cw * 0.26, cy - ch * 0.45, cw * 0.2, ch * 0.4); x.fillRect(c.x + cw * 0.5, cy - ch * 0.45, cw * 0.2, ch * 0.4);
        for(const wx of [0.22, 0.78]) A.circle(x, c.x + cw * wx, cy + ch, ch * 0.36, SZIN.tyre);
        A.puff(x, c.x - u * 0.2, cy + ch * 0.7, u * 0.12, SZIN.smoke[1]); }
    }
  }

  // ---- nyilvános API ----
  const varos = (canvas, o = {}) => A.mount(canvas, paint, Object.assign({ variant:'szmog', seed:2075 }, o));
  function varosJovo(host, o = {}){
    if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const mk = (v) => { const c = document.createElement('canvas'); c.className = 'h2d-layer is-' + v; c.setAttribute('aria-hidden', 'true');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;transition:opacity var(--t-slow, .4s) ease';
      host.appendChild(c); return c; };
    const cs = mk('szmog'), cz = mk('zold');
    const a = varos(cs, { variant:'szmog', seed:o.seed }), b = varos(cz, { variant:'zold', seed:o.seed });
    const set = (k) => { cz.style.opacity = String(A.clamp(Number(k) || 0, 0, 1)); };
    set(o.value || 0);
    return { set, redraw(n){ a.redraw(n && { seed:n.seed }); b.redraw(n && { seed:n.seed }); }, destroy(){ a.destroy(); b.destroy(); cs.remove(); cz.remove(); } };
  }
  Object.assign(A, { varos, varosJovo, varosLayout });
})(typeof window !== 'undefined' ? window : globalThis);
