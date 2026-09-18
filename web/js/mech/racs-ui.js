// ============================================================
//  MECHANIKA 2 – RÁCS: a felület (lapka-tálca, koppintásos lerakás, hatás-jelvények, 4 értékmérő, hőtérkép, visszavonás)
//
//  const r = MechRacs.mount(el, {
//    w:6, h:5,
//    tiles:[{ type:'fa', label:'Fa', icon:'🌳' }, …],            // icon: emoji → matrica (artIcon), vagy pic-név
//    values:[{ id:'elohely', label:'Élőhely', icon:'🦋', min:-10, max:20 }, …],   // min/max: a mérő két vége
//    rules:{ … },                                                // lásd racs-logika.js
//    onChange:(eredmeny, racs) => {…} })
//  Vissza: { grid, evaluate(), select(type), place(x, y), undo(), destroy() }. Billentyű: nyilak a rácson, 1–9 lapka, Ctrl+Z.
// ============================================================
(function(root){
  const { esc, icon, ic, say, play } = root.MechUI;

  function mount(el, o){
    const grid = root.MechRacs.create(o.w, o.h), tiles = o.tiles || [], values = o.values || [];
    const byType = Object.fromEntries(tiles.map(t => [t.type, t]));
    let sel = tiles.length ? tiles[0].type : null, show = values.length ? values[0].id : null, last = null, focus = 0;

    el.classList.add('mr');
    el.innerHTML = `
      <div class="mr-meters">${values.map(v => `<div class="mr-meter" data-v="${esc(v.id)}">
        <span class="mr-mlabel">${icon(v.icon)}<span>${esc(v.label)}</span></span>
        <div class="ds-meter" role="meter" aria-label="${esc(v.label)}" aria-valuemin="${v.min ?? 0}" aria-valuemax="${v.max ?? 20}"><i></i></div>
        <b class="ds-num mr-mnum">0</b></div>`).join('')}</div>
      <div class="mr-view"><span class="ds-muted">Térkép:</span><div class="ds-seg" role="radiogroup" aria-label="Melyik érték látszódjon a mezőkön">
        ${values.map(v => `<button type="button" role="radio" data-show="${esc(v.id)}">${esc(v.label)}</button>`).join('')}
        <button type="button" role="radio" data-show="">Egyik sem</button></div></div>
      <div class="mr-grid" role="grid" aria-label="Rács, ${o.w} × ${o.h} mező" style="--cols:${o.w}">
        ${Array.from({ length:o.h }, (_, y) => `<div role="row" class="mr-row">${Array.from({ length:o.w }, (_, x) =>
          `<button type="button" role="gridcell" class="mr-cell" data-x="${x}" data-y="${y}" tabindex="-1">
            <span class="mr-tile"></span><span class="mr-badge"></span></button>`).join('')}</div>`).join('')}
      </div>
      <div class="mr-tray">
        <div class="mr-tiles" role="radiogroup" aria-label="Lapkák">${tiles.map((t, i) => `<button type="button" role="radio" class="mr-pick" data-type="${esc(t.type)}"
          title="${i + 1}">${icon(t.icon)}<span>${esc(t.label)}</span></button>`).join('')}
          <button type="button" role="radio" class="mr-pick" data-type="" title="0">${ic('trash')}<span>Törlés</span></button></div>
        <button type="button" class="ds-btn-sm mr-undo" disabled>${ic('back')} Vissza</button>
      </div>`;
    const cellEls = [...el.querySelectorAll('.mr-cell')];
    const cellAt = (x, y) => cellEls[y * o.w + x];
    const undoBtn = el.querySelector('.mr-undo');

    function paintTray(){
      el.querySelectorAll('.mr-pick').forEach(b => b.setAttribute('aria-checked', String((b.dataset.type || null) === sel)));
      el.querySelectorAll('[data-show]').forEach(b => b.setAttribute('aria-checked', String((b.dataset.show || null) === show)));
    }
    function render(changed){
      const res = grid.evaluate(o.rules);
      // mezők: lapka, a kiválasztott érték jelvénye és „hőtérkép” háttér (plusz/mínusz: jel ÉS szín)
      const peak = Math.max(1, ...res.cells.map(c => Math.abs(show ? c.values[show] || 0 : 0)));
      for(const c of res.cells){
        const b = cellAt(c.x, c.y), t = byType[root.MechRacs.typeOf(c.tile)], v = show ? Math.round((c.values[show] || 0) * 10) / 10 : 0;
        const tileEl = b.querySelector('.mr-tile'), badge = b.querySelector('.mr-badge');
        const key = t ? t.type : '';
        if(tileEl.dataset.k !== key){ tileEl.dataset.k = key; tileEl.innerHTML = t ? icon(t.icon) : ''; if(t && changed) play(tileEl, 'drop'); }
        const txt = v ? (v > 0 ? '+' : '−') + Math.abs(v) : '';
        if(badge.textContent !== txt){ badge.textContent = txt; if(txt && changed) play(badge, 'pop'); }
        b.classList.toggle('is-plus', v > 0); b.classList.toggle('is-minus', v < 0); b.classList.toggle('is-filled', !!t);
        b.style.setProperty('--heat', (Math.abs(v) / peak).toFixed(2));
        b.setAttribute('aria-label', `${c.x + 1}. oszlop, ${c.y + 1}. sor: ${t ? t.label : 'üres'}${txt ? ', ' + txt : ''}`);
      }
      for(const v of values){
        const m = el.querySelector(`.mr-meter[data-v="${CSS.escape(v.id)}"]`), n = Math.round((res.totals[v.id] || 0) * 10) / 10;
        const lo = v.min ?? 0, hi = v.max ?? 20, p = Math.max(0, Math.min(100, (n - lo) / (hi - lo) * 100));
        m.querySelector('i').style.setProperty('--v', p + '%');
        m.querySelector('[role="meter"]').setAttribute('aria-valuenow', n);
        const num = m.querySelector('.mr-mnum'); if(num.textContent !== String(n)){ num.textContent = n; if(changed) play(num, 'pop'); }
      }
      undoBtn.disabled = !grid.canUndo();
      cellEls.forEach((b, i) => b.tabIndex = i === focus ? 0 : -1);
      last = res; if(changed && o.onChange) o.onChange(res, grid);
      return res;
    }

    function place(x, y){
      const cur = root.MechRacs.typeOf(grid.get(x, y));
      const t = (sel && cur === sel) ? null : sel;         // ugyanazt a lapkát újra koppintva: leveszi
      if(!grid.place(x, y, t)) return false;
      render(true); say(el, t ? byType[t].label + ' lerakva' : 'Mező üres');
      return true;
    }
    el.querySelector('.mr-grid').addEventListener('click', (e) => {
      const b = e.target.closest('.mr-cell'); if(!b) return;
      focus = cellEls.indexOf(b); place(+b.dataset.x, +b.dataset.y);
    });
    el.querySelector('.mr-grid').addEventListener('keydown', (e) => {   // nyilakkal lépkedés a mezők között
      const d = { ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1] }[e.key]; if(!d) return;
      e.preventDefault();
      const x = Math.max(0, Math.min(o.w - 1, focus % o.w + d[0])), y = Math.max(0, Math.min(o.h - 1, Math.floor(focus / o.w) + d[1]));
      focus = y * o.w + x; cellEls.forEach((b, i) => b.tabIndex = i === focus ? 0 : -1); cellEls[focus].focus();
    });
    el.querySelector('.mr-tiles').addEventListener('click', (e) => { const b = e.target.closest('.mr-pick'); if(b) select(b.dataset.type || null); });
    el.querySelector('.mr-view').addEventListener('click', (e) => { const b = e.target.closest('[data-show]'); if(b){ show = b.dataset.show || null; paintTray(); render(false); } });
    undoBtn.addEventListener('click', undo);
    el.addEventListener('keydown', (e) => {
      if((e.ctrlKey || e.metaKey) && e.key === 'z'){ e.preventDefault(); undo(); return; }
      if(/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey){ const i = +e.key; select(i === 0 ? null : (tiles[i - 1] || {}).type || sel); }
    });
    function select(type){ sel = type; paintTray(); }
    function undo(){ if(grid.undo()){ render(true); say(el, 'Visszavonva'); } }

    paintTray(); render(false);
    return { grid, evaluate:() => last, select, place, undo, destroy(){ el.innerHTML = ''; el.classList.remove('mr'); } };
  }

  root.MechRacs = Object.assign(root.MechRacs || {}, { mount });
})(window);
