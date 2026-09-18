// ============================================================
//  MECHANIKA 4 – KOMBINÁLÁS: a felület (tárgy húzása egy másikra, időzítő-jelvény, frissesség-lépcső, receptkönyv)
//
//  const k = MechKombinal.mount(el, {
//    slots:8, items:{ alma:{ label:'Alma', icon:'🍎', fresh:4, spoilsTo:'maradek' }, … },
//    recipes:[{ a:'alma', b:'cukor', out:'lekvar', time:2 }, …], start:['alma'],
//    supply:['alma', 'cukor'],               // „kamra”: ezekből lehet új tárgyat tenni a táblára (üres: nincs kamra)
//    turnLabel:'Következő kör',
//    onChange:(tabla, esemeny) => {…} })     // esemeny: { kind:'combine' | 'tick' | 'add', … }
//  Vissza: { board, combine(uidA, uidB), tick(), add(type), render(), destroy() }
//  Kezelés: húzd rá egyik tárgyat a másikra · VAGY koppints az egyikre, majd a másikra (billentyűvel: Tab + Enter).
// ============================================================
(function(root){
  const { esc, icon, ic, say, play, burst, drag } = root.MechUI;
  const WHY = { 'nincs-recept':tr('Ez a kettő nem áll össze'), folyamatban:tr('Ez még készül – várj egy kört'), ugyanaz:'', nincs:'' };

  function mount(el, o){
    const board = root.MechKombinal.create(o), defs = o.items || {};
    const name = (t) => board.label(t), ico = (t) => icon((defs[t] || {}).icon || t);
    let sel = null;
    el.classList.add('mc');
    el.innerHTML = `<div class="mc-top">
        <span class="ds-chip is-small" title="Kör">${ic('calendar')}<span class="ds-sr">Kör: </span><span class="mc-turn">0</span></span>
        <span class="ds-chip is-small" title="Szabad hely">${ic('box')}<span class="ds-sr">Szabad hely: </span><span class="mc-free"></span></span>
        <button type="button" class="ds-btn is-small mc-tick">${esc(o.turnLabel || tr('Következő kör'))} ${ic('next')}</button></div>
      <div class="mc-board" role="list" aria-label="Tábla"></div>
      ${(o.supply || []).length ? `<div class="mc-supply"><span class="ds-muted">Kamra:</span>${o.supply.map(t =>
        `<button type="button" class="ds-btn-sm mc-add" data-type="${esc(t)}" aria-label="${esc(name(t))} a táblára">${ico(t)}</button>`).join('')}</div>` : ''}
      <p class="mc-msg ds-muted" aria-live="polite"></p>
      <details class="ds-details mc-book"><summary>${ic('diary')}Receptkönyv <span class="mc-count"></span></summary><ul class="mc-recipes"></ul></details>`;
    const boardEl = el.querySelector('.mc-board'), msg = el.querySelector('.mc-msg');

    function itemHTML(it){
      if(it.process) return `<span class="mc-ico is-waiting">${ico(it.out)}</span><span class="mc-name">${esc(name(it.out))}</span>
        <span class="ds-tag is-accent mc-timer" title="Ennyi kör múlva kész">${ic('timer')}${it.left}</span>`;
      const pips = it.maxFresh ? `<span class="mc-fresh" aria-hidden="true">${Array.from({ length:it.maxFresh }, (_, i) => `<i${i < it.fresh ? ' class="on"' : ''}></i>`).join('')}</span>` : '';
      return `<span class="mc-ico">${ico(it.type)}</span><span class="mc-name">${esc(name(it.type))}</span>${pips}`;
    }
    function render(pop = []){
      const list = board.list();
      boardEl.innerHTML = Array.from({ length:board.slots }, (_, i) => {
        const it = list[i];
        if(!it) return `<div class="mc-slot is-empty" role="listitem"></div>`;
        const lab = it.process ? `${name(it.out)} készül, ${it.left} kör` : `${name(it.type)}${it.maxFresh ? `, frissesség ${it.fresh}/${it.maxFresh}` : ''}`;
        return `<div class="mc-slot" role="listitem"><button type="button" class="mc-item ds-card${it.process ? ' is-process' : ''}${it.fresh === 1 ? ' is-late' : ''}${sel === it.uid ? ' is-selected' : ''}"
          data-uid="${it.uid}" aria-label="${esc(lab)}" aria-pressed="${sel === it.uid}">${itemHTML(it)}</button></div>`;
      }).join('');
      boardEl.querySelectorAll('.mc-item').forEach(b => { bind(b, +b.dataset.uid); if(pop.includes(+b.dataset.uid)) play(b, 'pop'); });
      el.querySelector('.mc-turn').textContent = board.turn();
      el.querySelector('.mc-free').textContent = board.free();
      el.querySelectorAll('.mc-add').forEach(b => { b.disabled = board.free() <= 0; });
      const book = board.book();
      el.querySelector('.mc-count').textContent = `${book.filter(r => r.found).length}/${book.length}`;
      el.querySelector('.mc-recipes').innerHTML = book.map(r => r.found
        ? `<li class="is-found" data-r="${esc(r.id)}">${ico(r.a)} + ${ico(r.b)} → ${ico(r.out)} <b>${esc(name(r.out))}</b>${r.time ? ` <span class="ds-tag">${ic('timer')}${r.time}</span>` : ''}</li>`
        : `<li class="is-hidden">? + ? → ?</li>`).join('');
    }
    const uiOf = (u) => boardEl.querySelector(`.mc-item[data-uid="${u}"]`);

    function combine(a, b){
      const kf = el.contains(document.activeElement), r = board.combine(a, b); sel = null;
      if(!r.ok){ render(); if(kf && uiOf(b)) uiOf(b).focus(); if(WHY[r.reason]){ msg.textContent = WHY[r.reason]; play(uiOf(b), 'shake'); say(el, WHY[r.reason]); } return r; }
      msg.textContent = r.discovered ? 'Új recept!' : '';
      render([r.item.uid]);
      const t = uiOf(r.item.uid); burst(t, r.discovered ? 12 : 6); if(kf && t) t.focus();   // billentyűnél a fókusz az eredményen marad
      if(r.discovered){ el.querySelector('.mc-book').open = true; play(el.querySelector(`[data-r="${CSS.escape(r.recipe.id)}"]`), 'pop'); }
      say(el, (r.discovered ? 'Új recept: ' : '') + name(r.recipe.out) + (r.recipe.time ? `, ${r.recipe.time} kör múlva kész` : ''));
      if(o.onChange) o.onChange(board, Object.assign({ kind:'combine' }, r));
      return r;
    }
    function tick(){
      const r = board.tick(); sel = null;
      const done = r.events.filter(e => e.kind === 'kesz'), bad = r.events.filter(e => e.kind === 'romlott');
      render(done.map(e => e.item.uid).concat(bad.filter(e => e.to).map(e => e.to.uid)));
      msg.textContent = [done.length ? `Elkészült: ${done.map(e => name(e.item.type)).join(', ')}` : '',
        bad.length ? `Megromlott: ${bad.map(e => name(e.item.type)).join(', ')}` : ''].filter(Boolean).join(' · ');
      say(el, `${r.turn}. kör. ${msg.textContent}`);
      if(o.onChange) o.onChange(board, Object.assign({ kind:'tick' }, r));
      return r;
    }
    function add(type){
      const it = board.add(type);
      if(!it){ msg.textContent = tr('Nincs több hely a táblán'); play(boardEl, 'shake'); return null; }
      render([it.uid]); if(o.onChange) o.onChange(board, { kind:'add', item:it }); return it;
    }
    function tap(u){
      if(sel && sel !== u) return combine(sel, u);
      const kf = el.contains(document.activeElement);
      sel = sel === u ? null : u; render();
      msg.textContent = sel ? tr('Most koppints arra, amivel összeraknád') : '';
      if(kf && uiOf(u)) uiOf(u).focus();
    }
    // húzás: egy „szellem” másolat követi az ujjat; elengedéskor az alatta lévő tárgyra dobjuk
    function bind(b, u){
      let ghost = null, over = null;
      const under = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest('.mc-item'); };
      drag(b, {
        move:(e, dx, dy) => {
          if(!ghost && Math.hypot(dx, dy) < 8) return;
          if(!ghost){ ghost = b.cloneNode(true); ghost.classList.add('mc-ghost'); ghost.removeAttribute('data-uid'); document.body.appendChild(ghost); b.classList.add('is-lifted'); }
          ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
          const t = under(e); if(over && over !== t) over.classList.remove('is-over');
          over = t && t !== b ? t : null; if(over) over.classList.add('is-over');
        },
        end:(e, dx, dy, ms, cancel) => {
          const wasDrag = !!ghost; if(ghost){ ghost.remove(); ghost = null; } b.classList.remove('is-lifted');
          if(over){ over.classList.remove('is-over'); }
          const target = over; over = null;
          if(cancel) return;
          if(!wasDrag) return tap(u);
          if(target) combine(u, +target.dataset.uid);
        },
      });
      b.addEventListener('click', (e) => { if(e.detail === 0) tap(u); });   // billentyűzet (Enter/Szóköz)
    }
    el.querySelector('.mc-tick').addEventListener('click', tick);
    el.querySelectorAll('.mc-add').forEach(b => b.addEventListener('click', () => add(b.dataset.type)));
    render();
    return { board, combine, tick, add, render:() => render(), destroy(){ el.innerHTML = ''; el.classList.remove('mc'); } };
  }

  root.MechKombinal = Object.assign(root.MechKombinal || {}, { mount });
})(window);
