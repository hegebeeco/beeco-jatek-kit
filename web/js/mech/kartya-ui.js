// ============================================================
//  MECHANIKA 1 – DÖNTÉSKÁRTYA: a felület (húzás balra/jobbra, gombok, ←/→ billentyű, kirepülés)
//
//  const k = MechKartya.mount(el, {
//    cards:[…] (vagy queue: MechKartya.queue(…)),       // a pakli
//    render:(card) => '<p>…</p>',                           // a kártya belseje (HTML) – a tartalom a játéké
//    onDecide:(side, card, kovetkezmeny) => {…},            // side: 'left' | 'right'
//    onEnd:(history) => {…},                                // elfogyott a pakli (és a következmények)
//    onLean:(side|null, 0–1, card) => {…},                  // húzás közben: merre és mennyire dől (null = középen)
//    threshold:0.3,                                         // a kártyaszélesség ennyi részéig kell húzni
//    labels:{ left:'Nem', right:'Igen' },                   // pecsét + gomb (kártyánként felülírható: card.left.label)
//    globalKeys:false })                                    // true: a nyilak akkor is működnek, ha a fókusz máshol van
//  Vissza: { queue, decide(side), card(), destroy() }. Stílus: css/mech.css (.mk-…). Logika: kartya-logika.js
// ============================================================
(function(root){
  const { esc, still, ic, say, play, burst, drag } = root.MechUI;

  function mount(el, opts = {}){
    const q = opts.queue || root.MechKartya.queue(opts.cards || []);
    const L = Object.assign({ left:'Nem', right:'Igen' }, opts.labels);
    const thr = opts.threshold || 0.3;
    let card = null, busy = false, cardEl = null;

    el.classList.add('mk');
    el.innerHTML = `<div class="mk-stage"></div>
      <div class="mk-buttons">
        <button type="button" class="ds-btn-sm mk-btn" data-side="left">${ic('back')}<span></span></button>
        <button type="button" class="ds-btn-sm mk-btn" data-side="right"><span></span>${ic('next')}</button>
      </div>`;
    const stage = el.querySelector('.mk-stage');
    const btn = { left:el.querySelector('[data-side="left"]'), right:el.querySelector('[data-side="right"]') };
    const label = (side, c) => (c && c[side] && c[side].label) || L[side];

    function show(keepFocus){
      card = q.next(); busy = false;
      if(!card){
        stage.innerHTML = `<div class="mk-empty ds-muted">${ic('done')} Elfogyott a pakli.</div>`;
        btn.left.disabled = btn.right.disabled = true; cardEl = null;
        if(opts.onEnd) opts.onEnd(q.history());
        return;
      }
      stage.innerHTML = `<article class="mk-card ds-card" tabindex="0" aria-roledescription="döntéskártya"
          aria-keyshortcuts="ArrowLeft ArrowRight">
          <span class="mk-stamp is-left" aria-hidden="true">${esc(label('left', card))}</span>
          <span class="mk-stamp is-right" aria-hidden="true">${esc(label('right', card))}</span>
          <div class="mk-body">${opts.render ? opts.render(card) : esc(card.text || '')}</div></article>`;
      cardEl = stage.firstElementChild;
      for(const s of ['left', 'right']){ btn[s].disabled = false; btn[s].querySelector('span').textContent = label(s, card); }
      play(cardEl, 'drop'); bindDrag(cardEl);
      if(keepFocus) cardEl.focus();                         // billentyűvel döntött → a fókusz az új kártyára kerül
    }

    // húzás közben: a kártya követi az ujjat, dől, és a megfelelő pecsét egyre jobban látszik
    function lean(dx){
      if(!cardEl) return;
      cardEl.style.transform = dx ? `translateX(${dx}px) rotate(${dx * 0.06}deg)` : '';
      const k = Math.min(1, Math.abs(dx) / (cardEl.offsetWidth * thr || 1));
      cardEl.querySelector('.is-left').style.opacity = dx < 0 ? k : 0;
      cardEl.querySelector('.is-right').style.opacity = dx > 0 ? k : 0;
      if(opts.onLean) opts.onLean(dx < 0 ? 'left' : dx > 0 ? 'right' : null, k, card);   // pl. a mérőkön előre mutatni a hatás irányát
    }
    function bindDrag(c){
      drag(c, {
        start:() => !busy,
        move:(e, dx) => { c.classList.add('is-dragging'); lean(dx); },
        end:(e, dx, dy, ms, cancel) => {
          c.classList.remove('is-dragging');
          const fast = Math.abs(dx) / Math.max(1, ms) > 0.6 && Math.abs(dx) > 40;   // gyors „pöccintés” is dönt
          if(!cancel && (Math.abs(dx) > c.offsetWidth * thr || fast)) decide(dx > 0 ? 'right' : 'left');
          else lean(0);
        },
      });
    }

    function decide(side){
      if(busy || !card || (side !== 'left' && side !== 'right')) return;
      busy = true;                                            // a gombokat nem tiltjuk le, hogy a fókusz rajtuk maradjon
      const hadFocus = cardEl && cardEl.contains(document.activeElement);
      const c = card, cEl = cardEl, stamp = cEl.querySelector(side === 'left' ? '.is-left' : '.is-right');
      cEl.querySelectorAll('.mk-stamp').forEach(s => { s.style.opacity = s === stamp ? 1 : 0; });
      play(stamp, 'stamp');
      const f = q.decide(side, c);
      if(opts.onDecide) opts.onDecide(side, c, f);
      say(el, label(side, c) + (f ? tr(' – ennek még lesz következménye') : ''));
      if(f) burst(cEl, 6);
      const dir = side === 'right' ? 1 : -1, t = still() ? 0 : 380;
      setTimeout(() => {                                      // a pecsét egy pillanatig látszik, aztán kirepül
        cEl.classList.add('is-leaving');
        cEl.style.transform = `translateX(${dir * 130}%) rotate(${dir * 18}deg)`; cEl.style.opacity = '0';
        setTimeout(() => show(hadFocus), t ? 300 : 0);
      }, t);
    }

    btn.left.addEventListener('click', () => decide('left'));
    btn.right.addEventListener('click', () => decide('right'));
    const onKey = (e) => {
      if(!el.isConnected || e.altKey || e.ctrlKey || e.metaKey) return;
      if(!opts.globalKeys && !el.contains(document.activeElement)) return;
      if(/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName)) return;
      if(e.key === 'ArrowLeft'){ e.preventDefault(); decide('left'); }
      if(e.key === 'ArrowRight'){ e.preventDefault(); decide('right'); }
    };
    document.addEventListener('keydown', onKey);
    show();
    return { queue:q, decide, card:() => card, destroy(){ document.removeEventListener('keydown', onKey); el.innerHTML = ''; el.classList.remove('mk'); } };
  }

  root.MechKartya = Object.assign(root.MechKartya || {}, { mount });
})(window);
