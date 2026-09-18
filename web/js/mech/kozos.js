// ============================================================
//  MECHANIKÁK – közös felület-segédek (csak böngészőben; a logika-fájlok NEM függnek tőle)
//  Betöltési sorrend: pics.js → ds.js → (art/art.js) → mech/kozos.js → mech/*-logika.js → mech/*-ui.js
//  Leírás: docs/mechanikak.md
// ============================================================
(function(root){
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  // „Kevesebb mozgás”: a játék beállítása (body.reduce-motion) vagy a rendszer kérése
  const still = () => document.body.classList.contains('reduce-motion') || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const icon = (k) => (typeof dsIcon === 'function') ? dsIcon(k) : esc(k);   // piktogram-név, emoji → matrica, vagy szöveg
  const ic = (name) => (typeof pic === 'function') ? pic(name) : '';
  // képernyőolvasónak szóló rövid bejelentés (egy rejtett aria-live sorban)
  function say(host, text){
    let l = host.querySelector(':scope > .mech-live');
    if(!l){ l = document.createElement('div'); l.className = 'ds-sr mech-live'; l.setAttribute('aria-live', 'polite'); host.appendChild(l); }
    l.textContent = ''; setTimeout(() => { l.textContent = text; }, 30);
  }
  // animáció a DS mozgás-készletből (ha be van töltve); a „Kevesebb mozgás” mellett a CSS úgyis leállítja
  const play = (el, name) => { if(el && root.DS && DS.motion) DS.motion.play(el, name); };
  const burst = (el, n) => { if(root.DS && DS.motion) DS.motion.burst(el, n); };
  // egy húzás (Pointer Events: egér, érintés, toll egyben). h = { start(e) → false: nem indul, move(e, dx, dy), end(e, dx, dy, ms) }
  function drag(el, h){
    let id = null, x0 = 0, y0 = 0, t0 = 0;
    el.addEventListener('pointerdown', (e) => {
      if(id !== null || (e.button != null && e.button > 0)) return;
      if(h.start && h.start(e) === false) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = performance.now();
      try{ el.setPointerCapture(id); }catch(err){}
    });
    el.addEventListener('pointermove', (e) => { if(e.pointerId === id && h.move) h.move(e, e.clientX - x0, e.clientY - y0); });
    const up = (e) => { if(e.pointerId !== id) return; id = null;
      if(h.end) h.end(e, e.clientX - x0, e.clientY - y0, performance.now() - t0, e.type === 'pointercancel'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  root.MechUI = { esc, still, icon, ic, say, play, burst, drag };
})(window);
