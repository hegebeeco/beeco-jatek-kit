// ============================================================
//  2D HÁTTÉR – MÉHSEJT-MINTA (a főmenü és a kalauz-oldalak háttere, paraméterezve): halvány hatszög-rács + színfoltok
//
//  Vászon:  beecoHatter2D.mehsejt(canvas, { density:.5, opacity:.1, color:'honey-deep', bg:'cream', fill:.06, seed:1,
//                                            spots:[{ x:.92, y:.06, r:180, color:'honey', a:.3 }, …] })   → { redraw(o), destroy() }
//           fill = a sejtek ekkora hányada halványan kitöltve (méz-cseppek) · spots = lapos színfoltok (x, y: 0–1 arány, r: px)
//  CSS:     el.style.background = beecoHatter2D.mehsejtCSS({ size:28, opacity:.1, color:'honey-deep', bg:'cream', spots:[…] })
//           → ugyanaz a minta vászon nélkül (SVG-csempe + radial-gradient foltok) – statikus oldalakra ez a könnyebb.
//  Színek: token-nevek (DS.color kulcsai: honey, honey-deep, leaf, sage, cream, sky, blossom …) – nyers szín nem kell.
//  density: 0 = ritka, nagy sejtek (r ≈ 56 px) · 1 = sűrű, apró sejtek (r ≈ 12 px) · size (px) felülírja.
// ============================================================
(function(root){
  const A = root.beecoHatter2D || (typeof require === 'function' ? require('./alap.js') : null);
  const DSX = () => root.DS || (typeof require === 'function' ? require('../ds.js') : null);
  const SPOTS = [{ x:0.92, y:0.06, r:180, color:'honey', a:0.3 }, { x:0.04, y:0.96, r:220, color:'leaf', a:0.16 }];   // mint a főmenüben

  // ---- tiszta segédek ----
  const sizeOf = (o) => o.size || Math.round(56 - 44 * A.clamp(o.density == null ? 0.5 : o.density, 0, 1));
  const hexOf = (name) => { const D = DSX(); return (D && D.color[name]) || (D && D.color['honey-deep']); };
  function rgba(hex, a){ const n = parseInt(String(hex).slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  // csúcsos tetejű hatszögek középpontjai egy W×H téglalapban (sorok eltolva) – r = a sejt „sugara”
  function hexCenters(W, H, r){
    const dx = Math.sqrt(3) * r, dy = 1.5 * r, out = [];
    for(let row = -1; row * dy < H + r; row++) for(let col = -1; col * dx < W + dx; col++) out.push([col * dx + (row % 2 ? dx / 2 : 0), row * dy]);
    return out;
  }
  // CSS-háttér: SVG-csempe (a főmenü mintája, méretezve) + lapos színfoltok + alapszín token
  function mehsejtCSS(o = {}){
    const s = sizeOf(o) / 28, w = Math.round(56 * s), h = Math.round(97 * s), col = hexOf(o.color || 'honey-deep');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 56 97'><path d='M28 1 54 16v30L28 61 2 46V16Z M28 61v36 M2 46-2 48 M54 46l4 2' fill='none' stroke='${col}' stroke-opacity='${o.opacity == null ? 0.1 : o.opacity}' stroke-width='${(2 / Math.max(0.5, s)).toFixed(2)}'/></svg>`;
    const spots = (o.spots || SPOTS).map(p => `radial-gradient(circle at ${Math.round(p.x * 100)}% ${Math.round(p.y * 100)}%, ${rgba(hexOf(p.color || 'honey'), p.a == null ? 0.25 : p.a)} 0 ${p.r}px, transparent ${p.r + 1}px)`);
    return [`url("data:image/svg+xml,${encodeURIComponent(svg)}")`, ...spots, `var(--${o.bg || 'bg'})`].join(', ');
  }
  const PURE = { hexCenters, mehsejtCSS, sizeOf, rgba };
  if(typeof module !== 'undefined' && module.exports && !root.document){ module.exports = PURE; return; }

  // ---- vászon ----
  function paint(x, W, H, o){
    const r = sizeOf(o), D = root.DS, col = hexOf(o.color || 'honey-deep'), rnd = A.rng(o.seed || 1);
    x.fillStyle = D.color[o.bg] || D.color.cream; x.fillRect(0, 0, W, H);
    for(const p of (o.spots || SPOTS)){ x.globalAlpha = p.a == null ? 0.25 : p.a; A.circle(x, p.x * W, p.y * H, p.r, hexOf(p.color || 'honey')); }
    x.globalAlpha = 1;
    const cells = hexCenters(W, H, r);
    // kitöltött sejtek: méz-cseppek (méz, vaj és a rács színe), halványan
    const fill = o.fill == null ? 0.06 : o.fill, fillCols = [hexOf('honey'), hexOf('butter'), hexOf(o.color || 'honey-deep')];
    x.globalAlpha = Math.min(0.5, (o.opacity == null ? 0.1 : o.opacity) * 1.6);
    for(const [cx, cy] of cells) if(rnd() < fill){ A.hexPath(x, cx, cy, r * 0.86); A.shape(x, fillCols[Math.floor(rnd() * fillCols.length)] || col); }
    // a rács: egy útvonal, egy vonás (gyors)
    x.globalAlpha = o.opacity == null ? 0.1 : o.opacity; x.beginPath();
    for(const [cx, cy] of cells) for(let i = 0; i < 6; i++){ const a = Math.PI / 3 * i + Math.PI / 6;
      const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a); i ? x.lineTo(px, py) : x.moveTo(px, py); if(i === 5) x.closePath(); }
    x.lineWidth = Math.max(1.2, r * 0.07); x.strokeStyle = col; x.stroke(); x.globalAlpha = 1;
  }
  const mehsejt = (canvas, o = {}) => A.mount(canvas, paint, Object.assign({ density:0.5, opacity:0.1, color:'honey-deep', bg:'cream', seed:1 }, o));
  Object.assign(A, { mehsejt }, PURE);
})(typeof window !== 'undefined' ? window : globalThis);
