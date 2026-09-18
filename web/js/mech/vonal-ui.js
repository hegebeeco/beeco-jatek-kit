// ============================================================
//  MECHANIKA 3 – PONTOK ÖSSZEKÖTÉSE: a felület (térkép, vonalhúzás pontról pontra, koppintás a vonalra = törlés)
//
//  const v = MechVonal.mount(el, {
//    nodes:[{ id:'a', x:10, y:20, type:'ret' }, …], size:[100, 60],    // koordináták a size téglalapban
//    types:{ ret:{ label:'Rét', icon:'🌼' }, … },
//    maxDist:30, maxLinks:8, maxDegree:3, allow:(a, b) => true,          // korlátok (vonal-logika.js)
//    tall:1.5,                                                           // telefonon ennyivel magasabb a térkép
//    onChange:(metrics, graph) => {…} })
//  Vissza: { graph, connect(a, b), remove(t), select(id), refresh(), destroy() }
//  Kezelés: húzás pontról pontra · VAGY két koppintás (a, majd b) · billentyű: Tab + Enter ugyanígy; vonalon Enter/Delete = törlés.
// ============================================================
(function(root){
  const { esc, icon, ic, say, play, burst, drag } = root.MechUI;
  const NS = 'http://www.w3.org/2000/svg';
  const WHY = { tavol:'Túl messze van', keret:'Elfogyott a kapcsolat-keret', megvan:'Már össze vannak kötve',
    fok:'Ennek a pontnak több kapcsolat nem fér', szabaly:'Ezt a kettőt nem lehet összekötni', ugyanaz:'', nincs:'' };

  function mount(el, o){
    const graph = root.MechVonal.create(o);
    const [W, H] = o.size || [100, 60], types = o.types || {};
    let sel = null;
    el.classList.add('mv');
    el.innerHTML = `<div class="mv-stats"></div>
      <div class="mv-map" style="--ar:${W} / ${H}; --ar-tall:${W} / ${Math.round(H * (o.tall || 1.5))}">
        <svg class="mv-lines" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="false">
          <circle class="mv-range" r="0"></circle><g class="mv-edges"></g><line class="mv-temp"></line></svg>
      </div>
      <p class="mv-msg ds-muted" aria-live="polite"></p>`;
    const map = el.querySelector('.mv-map'), svg = map.querySelector('svg'), edgesG = svg.querySelector('.mv-edges');
    const temp = svg.querySelector('.mv-temp'), range = svg.querySelector('.mv-range'), msg = el.querySelector('.mv-msg');
    const nodeEl = new Map();
    const label = (n) => (types[n.type] || {}).label || n.label || n.id;

    for(const n of graph.nodes()){
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mv-node'; b.dataset.id = n.id;
      b.style.left = (n.x / W * 100) + '%'; b.style.top = (n.y / H * 100) + '%';
      b.innerHTML = `<span class="mv-ico">${icon((types[n.type] || {}).icon || n.icon || '')}</span><span class="mv-flag" aria-hidden="true">${ic('bolt')}</span>`;
      map.appendChild(b); nodeEl.set(n.id, b); bindNode(b, n.id);
    }
    // képernyő-pont → térkép-koordináta
    const toMap = (cx, cy) => { const r = map.getBoundingClientRect(); return [(cx - r.left) / r.width * W, (cy - r.top) / r.height * H]; };
    const nearest = (cx, cy, px = 30) => {          // a húzás végén: melyik pont van az ujj alatt (≤ 30 px)
      const r = map.getBoundingClientRect(); let best = null, bd = px;
      for(const n of graph.nodes()){ const d = Math.hypot(r.left + n.x / W * r.width - cx, r.top + n.y / H * r.height - cy); if(d < bd){ bd = d; best = n.id; } }
      return best;
    };
    function showRange(id){
      const n = graph.node(id);
      if(!n || !isFinite(graph.limits.maxDist)){ range.setAttribute('r', 0); return; }
      range.setAttribute('cx', n.x); range.setAttribute('cy', n.y); range.setAttribute('r', graph.limits.maxDist);
    }
    function preview(id){            // hatótáv-kör + az elérhető pontok kiemelése
      nodeEl.forEach((b, k) => b.classList.toggle('is-selected', k === id)); showRange(id);
      nodeEl.forEach((b, k) => b.classList.toggle('is-reach', !!id && k !== id && graph.canConnect(id, k).ok));
    }
    function select(id){ sel = id; preview(id); }
    function connect(a, b){
      const r = graph.connect(a, b);
      if(r.ok){ msg.textContent = ''; refresh(true, [a, b]); burst(nodeEl.get(b), 6); say(el, `Összekötve: ${label(graph.node(a))} – ${label(graph.node(b))}`); }
      else if(WHY[r.reason]){ msg.textContent = WHY[r.reason]; play(nodeEl.get(b), 'shake'); say(el, WHY[r.reason]); }
      select(null); return r;
    }
    function bindNode(b, id){
      drag(b, {
        start:() => { if(!sel) preview(id); },
        move:(e, dx, dy) => {
          if(Math.hypot(dx, dy) < 8) return;
          const p = graph.node(id), [x, y] = toMap(e.clientX, e.clientY);
          temp.setAttribute('x1', p.x); temp.setAttribute('y1', p.y); temp.setAttribute('x2', x); temp.setAttribute('y2', y);
          temp.classList.add('is-on');
          const t = nearest(e.clientX, e.clientY); nodeEl.forEach((n, k) => n.classList.toggle('is-target', k === t && k !== id));
        },
        end:(e, dx, dy, ms, cancel) => {
          temp.classList.remove('is-on'); nodeEl.forEach(n => n.classList.remove('is-target'));
          if(cancel) return select(null);
          if(Math.hypot(dx, dy) < 8){ tap(id); return; }
          const t = nearest(e.clientX, e.clientY);
          if(t && t !== id) connect(id, t); else select(null);
        },
      });
      b.addEventListener('click', (e) => { if(e.detail === 0) tap(id); });   // billentyűzet (Enter/Szóköz) – az egér a húzás-kezelőben megy
    }
    function tap(id){
      if(sel && sel !== id) connect(sel, id);
      else if(sel === id){ select(null); msg.textContent = ''; }         // második koppintás ugyanarra: kijelölés le
      else { select(id); msg.textContent = 'Most koppints a másik pontra'; }
    }

    function refresh(changed, fresh){
      const m = graph.metrics(), bridge = new Set(m.bridges.map(e => e.join('|'))), crit = new Set(m.critical), iso = new Set(m.isolated);
      edgesG.innerHTML = '';
      for(const [a, b] of graph.edges()){
        const p = graph.node(a), q = graph.node(b), g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'mv-edge' + (bridge.has(a + '|' + b) ? ' is-bridge' : '') + (fresh && fresh.includes(a) && fresh.includes(b) ? ' is-new' : ''));
        g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Kapcsolat: ${label(p)} – ${label(q)}. Törlés: Enter`);
        g.innerHTML = `<line class="mv-hit" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/><line class="mv-link" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;
        const del = () => { graph.disconnect(a, b); refresh(true); say(el, 'Kapcsolat törölve'); };
        g.addEventListener('click', del);
        g.addEventListener('keydown', (e) => { if(['Enter', ' ', 'Delete', 'Backspace'].includes(e.key)){ e.preventDefault(); del(); } });
        edgesG.appendChild(g);
      }
      nodeEl.forEach((b, id) => {
        const n = graph.node(id); if(!n){ b.remove(); nodeEl.delete(id); return; }
        b.classList.toggle('is-critical', crit.has(id)); b.classList.toggle('is-isolated', iso.has(id));
        b.setAttribute('aria-label', `${label(n)}: ${graph.degree(id)} kapcsolat${crit.has(id) ? ', kritikus pont' : ''}${iso.has(id) ? ', elszigetelt' : ''}`);
      });
      const left = isFinite(m.maxLinks) ? m.maxLinks - m.links : null;
      el.querySelector('.mv-stats').innerHTML =
        `<span class="ds-chip is-small" title="Felhasználható kapcsolat">${ic('link')}${left != null ? left : m.links}<span class="ds-sr"> ${left != null ? 'szabad kapcsolat' : 'kapcsolat'}</span></span>
         <span class="ds-chip is-small" title="Különálló részek">${ic('map')}${m.components}<span class="ds-sr"> különálló rész</span></span>
         <span class="ds-chip is-small${m.critical.length ? ' is-bad' : ''}" title="Kritikus pontok">${ic('bolt')}${m.critical.length}<span class="ds-sr"> kritikus pont</span></span>`;
      if(changed && o.onChange) o.onChange(m, graph);
      return m;
    }
    function remove(t){
      const b = typeof t === 'string' ? nodeEl.get(t) : null, r = graph.remove(t);
      if(!r) return null;
      if(b){ b.classList.add('is-gone'); play(b, 'out'); setTimeout(() => b.remove(), 250); nodeEl.delete(t); }
      if(sel === t) select(null);
      refresh(true); return r;
    }
    map.addEventListener('pointerdown', (e) => { if(e.target === map || e.target === svg) select(null); });
    refresh(false);
    return { graph, connect, remove, select, refresh:() => refresh(false), destroy(){ el.innerHTML = ''; el.classList.remove('mv'); } };
  }

  root.MechVonal = Object.assign(root.MechVonal || {}, { mount });
})(window);
