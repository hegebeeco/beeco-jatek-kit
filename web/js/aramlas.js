// ============================================================
//  ÁRAMLÁS-MOZGÁS (DS_FLOW) – pöttyök, amelyek egy vonal mentén haladnak: beporzó a kapcsolaton, víz a csőben,
//  áram a vezetéken, szállítmány az úton. A design system mozgás-készletének (ds-motion.css) párja.
//
//  SVG:    const h = DS_FLOW.along(vonalVagyPath, { dots:4, speed:60, color:'honey', size:9, reverse:false, both:false })
//          DS_FLOW.stop(h)                    – a pöttyök eltűnnek
//  Vászon: const f = DS_FLOW.canvas(ctx, [[x,y], …], { dots:5, speed:80, color:'leaf', size:8 })
//          f.draw(most)  – a játék saját képkocka-ciklusából hívd (a háttér UTÁN) · vagy auto:true + before(ctx) → saját ciklus
//          f.stop()
//  speed = képernyő-pixel / másodperc (a vonal hosszából számoljuk az egy kör idejét) · dur = egy kör ideje mp-ben (felülírja)
//  color = token-név: honey · leaf · sky · blossom · ember · berry · cream · paper · olive (csak a palettából)
//
//  MIÉRT <animateMotion> (SVG-ben)? A pötty mozgatását a böngésző maga végzi: nincs JS-kód minden képkockán,
//  a háttérbe tett lapon magától megáll, és ha a rajz átméreteződik (viewBox), a pálya vele nyúlik. A requestAnimationFrame
//  ugyanezt JS-ből, képkockánként csinálná (getPointAtLength ~ pöttyönként) – azt csak a vászonnál használjuk, ahol úgyis
//  a játék rajzol. A pötty egy nulla hosszú, kerek végű vonal „vector-effect: non-scaling-stroke”-kal: így torzított
//  (preserveAspectRatio="none") SVG-ben is kerek marad.
//  „Kevesebb mozgás” (.reduce-motion vagy rendszerbeállítás): a pöttyök ÁLLNAK, kicsiről nagyra nőve – ez mutatja az irányt.
// ============================================================
(function(root){
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['honey', 'leaf', 'sky', 'blossom', 'ember', 'berry', 'cream', 'paper', 'olive'];
  const colorName = (c) => COLORS.includes(c) ? c : 'honey';

  // ---- Tiszta segédek (Node-ban is tesztelhetők) ----
  const polyLength = (pts) => pts.reduce((s, p, i) => i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
  // pont a töröttvonalon, a kezdettől d távolságra
  function pointAt(pts, d){
    if(pts.length < 2) return pts[0] ? [pts[0][0], pts[0][1]] : [0, 0];
    let left = Math.max(0, d);
    for(let i = 1; i < pts.length; i++){
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if(left <= L || i === pts.length - 1){ const k = L ? Math.min(1, left / L) : 0; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
      left -= L;
    }
  }
  // n pötty helye (0–1 arány a vonalon) egy adott fázisnál: egyenletes közökkel, körbeérve; both: minden második visszafelé megy
  function phases(n, phase, reverse, both){
    return Array.from({ length:n }, (_, i) => { let p = ((i / n) + phase) % 1; if(reverse !== (both && i % 2 === 1)) p = 1 - p; return p; });
  }
  // „Kevesebb mozgás”: álló pöttyök a vonal 20–80%-án, a méretük a haladás irányába nő (0,55 → 1)
  const staticDots = (n) => Array.from({ length:n }, (_, i) => ({ at:n > 1 ? 0.2 + 0.6 * i / (n - 1) : 0.5, scale:n > 1 ? 0.55 + 0.45 * i / (n - 1) : 1 }));
  const PURE = { polyLength, pointAt, phases, staticDots, COLORS };
  if(typeof module !== 'undefined' && module.exports){ module.exports = PURE; return; }

  // ---- Böngésző ----
  const still = () => document.body.classList.contains('reduce-motion') || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hexOf = (name) => (root.DS && DS.color[name]) || (root.DS && DS.color.honey);
  const live = new Set();

  // az SVG-elem pályája path-adatként (path, line, polyline, polygon)
  function pathData(el){
    const t = el.tagName.toLowerCase(), n = (a) => parseFloat(el.getAttribute(a)) || 0;
    if(t === 'path') return el.getAttribute('d');
    if(t === 'line') return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    if(t === 'polyline' || t === 'polygon'){ const p = el.getAttribute('points').trim().split(/[\s,]+/).map(Number), out = [];
      for(let i = 0; i + 1 < p.length; i += 2) out.push((i ? 'L' : 'M') + p[i] + ' ' + p[i + 1]); return out.join('') + (t === 'polygon' ? 'Z' : ''); }
    return null;
  }
  // a pálya hossza KÉPERNYŐ-pixelben (a viewBox torzítását is beleszámolva) – ebből lesz a sebesség
  function screenLength(el){
    try{ const L = el.getTotalLength(), m = el.getScreenCTM(); if(!m || !L) return 0;
      let s = 0, prev = null;
      for(let i = 0; i <= 16; i++){ const p = el.getPointAtLength(L * i / 16), q = [m.a * p.x + m.c * p.y, m.b * p.x + m.d * p.y];
        if(prev) s += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
      return s;
    }catch(e){ return 0; }
  }
  // egy pötty: olíva perem + színes mag (két nulla hosszú vonal, kerek véggel)
  function dotAt(g, x, y, size){
    for(const [cls, w] of [['dsf-rim', size + 4], ['dsf-core', size]]){
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('class', cls); l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', x + 0.001); l.setAttribute('y2', y);
      l.style.strokeWidth = w + 'px'; g.appendChild(l);
    }
  }
  function render(h){
    const { el, o } = h, g = h.g, n = Math.max(1, Math.min(8, o.dots || 4)), size = o.size || 9;
    g.textContent = '';
    g.setAttribute('class', 'dsf is-' + colorName(o.color) + (h.still ? ' is-still' : ''));
    if(h.still){                                                      // álló pöttyök, a méret mutatja az irányt
      let L = 0; try{ L = el.getTotalLength(); }catch(e){}
      staticDots(n).forEach(({ at, scale }) => { const k = o.reverse ? 1 - at : at, p = el.getPointAtLength(L * k); dotAt(g, p.x, p.y, size * scale); });
      return;
    }
    const d = pathData(el); if(!d) return;
    const px = screenLength(el), dur = o.dur || (px ? Math.max(0.6, px / (o.speed || 60)) : 2.4);
    for(let i = 0; i < n; i++){
      const one = document.createElementNS(NS, 'g'); dotAt(one, 0, 0, size);
      const m = document.createElementNS(NS, 'animateMotion'), back = !!o.reverse !== (!!o.both && i % 2 === 1);
      m.setAttribute('path', d); m.setAttribute('dur', dur.toFixed(2) + 's'); m.setAttribute('repeatCount', 'indefinite');
      m.setAttribute('begin', (-(i / n) * dur).toFixed(2) + 's'); m.setAttribute('calcMode', 'linear');
      if(back){ m.setAttribute('keyPoints', '1;0'); m.setAttribute('keyTimes', '0;1'); }
      one.appendChild(m); g.appendChild(one);
    }
  }
  function along(el, o = {}){
    if(!el || !el.ownerSVGElement) return null;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('aria-hidden', 'true');
    if(el.getAttribute('transform')) g.setAttribute('transform', el.getAttribute('transform'));
    el.parentNode.insertBefore(g, el.nextSibling);                    // közvetlenül a vonal fölé, ugyanabban a koordináta-rendszerben
    const h = { el, o, g, still:still(), kind:'svg' };
    render(h); live.add(h); watch(); return h;
  }

  // ---- Vászon-változat: a játék rajzolja minden képkockán (vagy auto:true → saját ciklus) ----
  function canvas(ctx, pts, o = {}){
    const n = Math.max(1, Math.min(12, o.dots || 5)), size = o.size || 8, L = polyLength(pts);
    const h = { kind:'canvas', o, raf:0, t0:performance.now(), stopped:false };
    function dot(x, y, s){
      ctx.beginPath(); ctx.arc(x, y, s / 2 + 2, 0, Math.PI * 2); ctx.fillStyle = hexOf('olive'); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, s / 2, 0, Math.PI * 2); ctx.fillStyle = hexOf(colorName(o.color)); ctx.fill();
    }
    h.draw = (now = performance.now()) => {
      if(!L) return;
      if(still()){ staticDots(n).forEach(({ at, scale }) => { const p = pointAt(pts, L * (o.reverse ? 1 - at : at)); dot(p[0], p[1], size * scale); }); return; }
      const dur = o.dur ? o.dur * 1000 : L / (o.speed || 80) * 1000, phase = ((now - h.t0) / dur) % 1;
      phases(n, phase, !!o.reverse, !!o.both).forEach(p => { const q = pointAt(pts, L * p); dot(q[0], q[1], size); });
    };
    h.stop = () => { h.stopped = true; cancelAnimationFrame(h.raf); live.delete(h); };
    if(o.auto){
      const loop = (t) => { if(h.stopped) return; if(o.before) o.before(ctx); h.draw(t);
        h.raf = still() ? 0 : requestAnimationFrame(loop); };               // álló módban egyetlen rajz elég
      h.restart = () => { cancelAnimationFrame(h.raf); h.raf = requestAnimationFrame(loop); };
      h.restart(); live.add(h); watch();
    }
    return h;
  }

  function stop(h){ if(!h) return; if(h.kind === 'canvas') return h.stop(); if(h.g) h.g.remove(); live.delete(h); }
  // a „Kevesebb mozgás” futás közbeni váltása: minden élő áramlás újrarajzol (egy figyelő az egész oldalra)
  let watching = false, was = null;
  function refresh(force){
    const s = still(); if(force !== true && s === was) return; was = s;   // csak akkor, ha tényleg változott
    live.forEach(h => { if(h.kind === 'svg'){ if(!h.el.isConnected){ stop(h); return; } h.still = s; render(h); } else if(h.restart) h.restart(); });
  }
  function watch(){
    if(watching || !root.MutationObserver) return; watching = true; was = still();
    new MutationObserver(refresh).observe(document.body, { attributes:true, attributeFilter:['class'] });
    if(root.matchMedia){ const q = matchMedia('(prefers-reduced-motion: reduce)'); if(q.addEventListener) q.addEventListener('change', refresh); }
  }
  root.DS_FLOW = Object.assign({ along, stop, canvas, refresh, watch }, PURE);
})(typeof window !== 'undefined' ? window : globalThis);
