// ============================================================
//  2D HÁTTÉR-JELENETEK – közös alap (beecoHatter2D): vászon előkészítése, átméretezés, sorsolás, rajz-segédek
//
//  A jelenetek (varos.js, konyha.js, kert.js, mehsejt.js) EGYSZER rajzolnak egy <canvas>-ra, és csak átméretezéskor
//  (vagy a képpontsűrűség változásakor) újra – játék közben nem kerülnek semmibe. A 2D játék a vászon FÖLÉ teszi a saját elemeit.
//  Stílus (docs/rajzolas.md): lapos tónusok (világos teteje · alap eleje · sötét oldala), vékony olívazöld kontúr, színátmenet
//  helyett sávok. Színek: ART.MAT (web/js/art/art.js) és DS (web/js/ds.js) – ezeket a jelenetek ELŐTT kell betölteni.
//  A vászonnak CSS-méret kell (pl. position:absolute; inset:0; width:100%; height:100%) – a rajz ehhez igazodik.
//  Leírás: docs/hatterek-2d.md
// ============================================================
(function(root){
  // ---- Tiszta segédek (Node-ban is) ----
  // determinisztikus sorsoló (mulberry32): ugyanaz a seed → ugyanaz az elrendezés (a két városváltozat ezért fedi egymást)
  function rng(seed){
    let a = (Number(seed) || 1) >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // alapegység: a kisebbik oldalhoz mérve, hogy álló telefonon se legyenek óriásiak a házak/csempék
  const unitOf = (W, H, k = 0.06, min = 22) => Math.max(min, Math.min(W, H) * k);
  const H2 = { rng, clamp, unitOf };
  if(typeof module !== 'undefined' && module.exports){ module.exports = H2; return; }

  // ---- Paletta (böngészőben: ART.MAT + DS) ----
  H2.M = () => root.ART.MAT;
  H2.ink = () => root.DS.color.olive;

  // ---- Vászon: méret × képpontsűrűség, átméretezéskor újrarajzolás (egy ResizeObserver, képkockára összevonva) ----
  function mount(canvas, paint, o = {}){
    let last = '', raf = 0, ro = null;
    const draw = (force) => {
      const r = canvas.getBoundingClientRect();
      const W = Math.round(r.width) || o.width || 300, H = Math.round(r.height) || o.height || 150;
      const dpr = Math.min(o.maxDpr || 2, root.devicePixelRatio || 1), key = W + 'x' + H + '@' + dpr;
      if(!force && key === last) return; last = key;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      paint(ctx, W, H, o);
    };
    draw(true);
    if(root.ResizeObserver){ ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => draw(false)); }); ro.observe(canvas); }
    return { canvas, opts:o, redraw(next){ if(next) Object.assign(o, next); draw(true); }, destroy(){ if(ro) ro.disconnect(); cancelAnimationFrame(raf); } };
  }

  // ---- Rajz-segédek (x = 2D kontextus) ----
  function shape(x, fill, stroke, lw){
    if(fill){ x.fillStyle = fill; x.fill(); }
    if(stroke){ x.lineWidth = lw || 1.4; x.strokeStyle = stroke; x.stroke(); }
  }
  function poly(x, pts, fill, stroke, lw){
    x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); shape(x, fill, stroke, lw);
  }
  function rect(x, rx, ry, w, h, fill, stroke, lw, r){
    x.beginPath(); if(r && x.roundRect) x.roundRect(rx, ry, w, h, r); else x.rect(rx, ry, w, h); shape(x, fill, stroke, lw);
  }
  function circle(x, cx, cy, r, fill, stroke, lw){ x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); shape(x, fill, stroke, lw); }
  // térhatású doboz: eleje (alap), oldala (sötét, jobbra-fel), teteje (világos) – tones = [világos, alap, sötét]
  function box(x, bx, top, w, h, d, tones, line, lw){
    const [lt, base, dk] = tones;
    poly(x, [[bx + w, top], [bx + w + d, top - d * 0.6], [bx + w + d, top + h - d * 0.6], [bx + w, top + h]], dk, line, lw);
    poly(x, [[bx, top], [bx + d, top - d * 0.6], [bx + w + d, top - d * 0.6], [bx + w, top]], lt, line, lw);
    rect(x, bx, top, w, h, base, line, lw);
  }
  // pamacs (felhő, lombkorona, füst): három egymásba érő kör
  function puff(x, cx, cy, r, col, stroke, lw){
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.moveTo(cx + r * 1.5, cy + r * 0.15); x.arc(cx + r * 0.8, cy + r * 0.15, r * 0.7, 0, 7);
    x.moveTo(cx - r * 0.15, cy + r * 0.2); x.arc(cx - r * 0.8, cy + r * 0.2, r * 0.65, 0, 7); shape(x, col, stroke, lw);
  }
  // lapos felhő: fehér pamacs + sötétebb alsó sáv (két tónus, nincs színátmenet)
  function cloud(x, cx, cy, r){
    const M = H2.M(); puff(x, cx, cy + r * 0.12, r, M.white[2]); puff(x, cx, cy, r, M.white[0]);
  }
  // nap udvarral: két halvány gyűrű + tömör korong olíva-méz kontúrral
  function sun(x, cx, cy, r){
    const M = H2.M();
    for(const [k, a] of [[2.3, 0.12], [1.65, 0.2]]){ x.globalAlpha = a; circle(x, cx, cy, r * k, M.honey[0]); }
    x.globalAlpha = 1; circle(x, cx, cy, r, M.honey[1], M.honey[2], 2);
    x.globalAlpha = 0.6; circle(x, cx - r * 0.3, cy - r * 0.3, r * 0.35, M.honey[0]); x.globalAlpha = 1;
  }
  // hatszög (csúcsos teteje: pointy) – méhsejt, díszek
  function hexPath(x, cx, cy, r, flat){
    x.beginPath();
    for(let i = 0; i < 6; i++){ const a = Math.PI / 3 * i + (flat ? 0 : Math.PI / 6); const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a); i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.closePath();
  }
  // ég sávokban (színátmenet helyett 3–4 lapos sáv, a horizont felé világosodva)
  function skyBands(x, W, top, bottom, cols){
    const n = cols.length, h = (bottom - top) / n;
    cols.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, top + i * h - 0.5, W, h + 1); });
  }
  // virág: 5 szirom + közép
  function flower(x, cx, cy, r, petal, mid){
    for(let i = 0; i < 5; i++){ const a = i * 1.2566; circle(x, cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.75, petal); }
    circle(x, cx, cy, r * 0.6, mid);
  }
  Object.assign(H2, { mount, shape, poly, rect, circle, box, puff, cloud, sun, hexPath, skyBands, flower });
  root.beecoHatter2D = Object.assign(root.beecoHatter2D || {}, H2);
})(typeof window !== 'undefined' ? window : globalThis);
