// ============================================================
//  beeco design system — BŐVÍTÉS 1.2: JS-segédek a web/css/ds-ext.css elemeihez
//
//  HTML-t adó (tiszta) segédek – Node-ban is futnak, a tests/check-ds-ext.js ellenőrzi őket:
//    dsDeltaHTML, dsMeterHTML, dsProfileHTML, dsSourceHTML, dsAssumeHTML, dsRingHTML, dsRangeHTML, dsTipBtnHTML
//  Böngészős viselkedés (a DS objektumra kerül):
//    DS.delta.show · DS.coach.show/hide/reset · DS.ring.start/stop · DS.range.bind · DS.tip.attach/scan/hide
//    DS.sheet.open/close · DS.big.set/get
//  Betöltés: pics.js → ds.js → ds-ext.js (a ds.js nélkül is fut, akkor saját DS-t hoz létre).
//  Minden szöveg escape-elve; a „Kevesebb mozgás” (body.reduce-motion vagy rendszer) mellett nincs animáció.
// ============================================================
(function(root){
  // ---------- közös apróságok ----------
  const tr = (s, v) => typeof root.tr === 'function' ? root.tr(s, v) : (!v ? s : String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m));   // nyelv (i18n.js), különben magyar
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  // piktogram, ha létezik (a pics.js-be később érkező nevekhez is – pl. 'up', 'down', 'alert', 'hand'); különben ''
  const hasPic = (n) => typeof PIC_DEFS !== 'undefined' && !!PIC_DEFS[n];
  const ic = (n) => (hasPic(n) && typeof pic === 'function') ? pic(n) : '';
  // tartalom-ikon: piktogram-név, matrica/emoji (dsIcon), vagy semmi
  const icon = (k) => !k ? '' : hasPic(k) ? ic(k) : (typeof root.dsIcon === 'function' ? root.dsIcon(k) : `<span aria-hidden="true">${esc(k)}</span>`);
  const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
  const pct = (v) => Math.round(clamp01(v) * 1000) / 10 + '%';
  // magyar számírás: tizedesvessző, valódi mínuszjel
  const num = (v) => String(Math.round(Math.abs(Number(v) || 0) * 100) / 100).replace('.', ',');
  const MINUS = '−';
  let uid = 0; const nextId = (p) => `${p}-${(++uid).toString(36)}`;
  const still = () => !!(root.document && document.body && (document.body.classList.contains('reduce-motion')
    || document.documentElement.classList.contains('reduce-motion')
    || (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)));

  // =================================================================================================
  // 1. VÁLTOZÁSJELZŐ
  // =================================================================================================
  // hangnem: a változás iránya ÉS hogy melyik irány a jó (better:'up' – több a jobb; 'down' – kevesebb a jobb, pl. CO₂, Ft)
  function dsDeltaTone(value, better = 'up'){
    const v = Number(value) || 0;
    if(v === 0) return 'zero';
    return (v > 0) === (better !== 'down') ? 'good' : 'bad';
  }
  // előjel-jel: szöveges nyíl, vagy ha van, piktogram (a nyíl a jel – a szín csak megerősít)
  function dsDeltaSign(value){
    const v = Number(value) || 0;
    if(v > 0) return { dir:'up', text:'+' + num(v), arrow:'↑' };
    if(v < 0) return { dir:'down', text:MINUS + num(v), arrow:'↓' };
    return { dir:'zero', text:'±0', arrow:'=' };
  }
  // dsDeltaHTML({ label:'Természet', icon:'leaf', value:+2, unit:'', better:'up', small:false })
  function dsDeltaHTML(o = {}){
    const s = dsDeltaSign(o.value), tone = dsDeltaTone(o.value, o.better);
    const say = { up:tr('nőtt'), down:tr('csökkent'), zero:tr('nem változott') }[s.dir];
    const aria = `${o.label ? o.label + ': ' : ''}${s.dir === 'zero' ? say : `${say}, ${s.text.replace(MINUS, 'mínusz ').replace('+', 'plusz ')}${o.unit ? ' ' + o.unit : ''}`}`;
    const arrow = ic(s.dir === 'zero' ? '' : s.dir) || esc(s.arrow);
    return `<span class="ds-delta is-${tone}${o.small ? ' is-small' : ''}" role="img" aria-label="${esc(aria)}">`
      + `<span class="ds-delta-sign" aria-hidden="true">${arrow}</span>`
      + `<b class="ds-delta-num" aria-hidden="true">${esc(s.text)}${o.unit ? ' ' + esc(o.unit) : ''}</b>`
      + `${icon(o.icon || o.art)}${o.label ? `<span aria-hidden="true">${esc(o.label)}</span>` : ''}</span>`;
  }
  // mérő a változással: dsMeterHTML({ label, icon, value01:.62, delta:+.1, deltaValue:+2, better:'up' })
  // value01 = az ÚJ érték (0–1); delta = a változás ugyanazon a skálán → csíkozott „szellem” szakasz a régi és az új szint között
  function dsMeterHTML(o = {}){
    const now = clamp01(o.value01), d = Number(o.delta) || 0, before = clamp01(now - d);
    const a = Math.min(now, before), w = Math.abs(now - before);
    const tone = dsDeltaTone(d, o.better);
    const shown = o.deltaValue != null ? o.deltaValue : Math.round(d * 100);
    return `<div class="ds-mrow">`
      + `<div class="ds-mrow-head">${icon(o.icon)}<span>${esc(o.label)}</span>${d !== 0 || o.deltaValue != null ? dsDeltaHTML({ value:shown, unit:o.unit, better:o.better, small:true, label:'' }) : ''}</div>`
      + `<div class="ds-meter is-delta${o.good ? ' is-good' : ''}" role="meter" aria-label="${esc(o.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(now * 100)}">`
      + `<i style="--v:${pct(now)}"></i><s class="ds-meter-ghost is-${tone}" style="--a:${pct(a)};--w:${pct(w)}"></s></div></div>`;
  }

  // =================================================================================================
  // 2. PROFIL-ÁBRA (radar / sávok)
  // =================================================================================================
  const RADAR = { w:440, h:290, cx:220, cy:147, r:92, lbl:16 };   // a címkék a körön kívül, HTML-ben (bármekkora kijelzőn olvashatók)
  // n tengely pontjai: az első felfelé mutat, óramutató szerint; values: 0–1
  function dsRadarPoints(values, g = RADAR){
    const n = values.length;
    return values.map((v, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, k = clamp01(v);
      return { x:+(g.cx + Math.cos(a) * g.r * k).toFixed(2), y:+(g.cy + Math.sin(a) * g.r * k).toFixed(2), a }; });
  }
  const poly = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ');
  // dsProfileHTML({ values:[{ label, icon, value01 }], mode:'radar'|'bars', title:'Rendszerprofil', showValue:true })
  function dsProfileHTML(o = {}){
    const vals = (o.values || []).slice(0, 6);
    const title = o.title || tr('Profil');
    const sr = `<ul class="ds-sr">${vals.map(v => `<li>${esc(v.label)}: ${Math.round(clamp01(v.value01) * 100)}%</li>`).join('')}</ul>`;
    // 3-nál kevesebb tengelyből nem lesz radar → sávok
    if(o.mode === 'bars' || vals.length < 3){
      return `<div class="ds-profile is-bars" role="group" aria-label="${esc(title)}">` + vals.map(v =>
        `<div class="ds-profile-bar"><span>${icon(v.icon)}<span>${esc(v.label)}</span></span>`
        + `<div class="ds-meter" role="meter" aria-label="${esc(v.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clamp01(v.value01) * 100)}"><i style="--v:${pct(v.value01)}"></i></div>`
        + `<b>${Math.round(clamp01(v.value01) * 100)}%</b></div>`).join('') + `</div>`;
    }
    const g = RADAR, ones = vals.map(() => 1);
    const rings = [1 / 3, 2 / 3].map(k => `<polygon class="ds-rg-ring" points="${poly(dsRadarPoints(ones.map(() => k)))}"/>`).join('');
    const outer = dsRadarPoints(ones), shape = dsRadarPoints(vals.map(v => v.value01));
    const lab = dsRadarPoints(ones, Object.assign({}, g, { r:g.r + g.lbl }));
    const labels = vals.map((v, i) => { const p = lab[i], c = Math.cos(p.a), s = Math.sin(p.a);
      // oldal szerint horgonyzunk: jobb oldalon balra zárt, bal oldalon jobbra zárt, fent/lent középre
      const side = c > 0.3 ? 'r' : c < -0.3 ? 'l' : 'c';
      const tx = side === 'r' ? '0%' : side === 'l' ? '-100%' : '-50%', ty = s < -0.5 ? '-100%' : s > 0.5 ? '0%' : '-50%';
      return `<span class="ds-profile-lbl is-${side}" style="--x:${(p.x / g.w * 100).toFixed(2)}%;--y:${(p.y / g.h * 100).toFixed(2)}%;--tx:${tx};--ty:${ty}" aria-hidden="true">`
        + `${icon(v.icon)}<span>${esc(v.label)}${o.showValue === false ? '' : ` <b>${Math.round(clamp01(v.value01) * 100)}</b>`}</span></span>`; }).join('');
    return `<div class="ds-profile is-radar" role="img" aria-label="${esc(title)}: ${esc(vals.map(v => `${v.label} ${Math.round(clamp01(v.value01) * 100)}%`).join(', '))}" style="--ar:${g.w} / ${g.h}">`
      + `<svg viewBox="0 0 ${g.w} ${g.h}" aria-hidden="true" focusable="false">`
      + `<polygon class="ds-rg-ring is-outer" points="${poly(outer)}"/>${rings}`
      + outer.map(p => `<line class="ds-rg-axis" x1="${g.cx}" y1="${g.cy}" x2="${p.x}" y2="${p.y}"/>`).join('')
      + `<polygon class="ds-rg-shape" points="${poly(shape)}"/>`
      + shape.map(p => `<circle class="ds-rg-dot" cx="${p.x}" cy="${p.y}" r="4.5"/>`).join('')
      + `</svg>${labels}${sr}</div>`;
  }

  // =================================================================================================
  // 3. FORRÁS-SOR, FELTÉTELEZÉS-CÍMKE
  // =================================================================================================
  const safeUrl = (u) => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '';
  // dsSourceHTML({ title, url, publisher, year, note }) – a link új lapon nyílik, a játék nem veszíti el az állását
  function dsSourceHTML(o = {}){
    const url = safeUrl(o.url), meta = [o.publisher, o.year].filter(x => x != null && x !== '').map(esc).join(', ');
    const t = esc(o.title || o.publisher || tr('Forrás'));
    const link = url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${t}<span class="ds-sr"> (új lapon nyílik)</span></a>` : `<b>${t}</b>`;
    return `<p class="ds-source">${ic('link')}<span><span class="ds-sr">Forrás: </span>${link}${meta && o.title ? ' · ' + meta : ''}`
      + `${o.note ? ` <span class="ds-source-note">– ${esc(o.note)}</span>` : ''}</span></p>`;
  }
  // dsAssumeHTML('4 fős család') – szaggatott keretes „feltételezés” címke: nem mért adat, hanem kitalált/becsült kiindulás
  const dsAssumeHTML = (text) => `<span class="ds-assume">${ic('alert') || ic('info')}<b>${tr('feltételezés')}</b>${text ? `<span>${esc(text)}</span>` : ''}</span>`;

  // =================================================================================================
  // 5. VISSZASZÁMLÁLÓ GYŰRŰ (HTML)
  // =================================================================================================
  const RING_R = 20, RING_C = +(2 * Math.PI * RING_R).toFixed(3);
  // dsRingHTML({ seconds:10, size:64, label:'Hátralévő idő' })
  const dsRingHTML = (o = {}) => `<div class="ds-ring" role="timer" aria-label="${esc(o.label || tr('Hátralévő idő'))}"${o.size ? ` style="--size:${Number(o.size) || 64}px"` : ''} data-seconds="${Math.max(0, Number(o.seconds) || 0)}">`
    + `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle class="ds-ring-track" cx="24" cy="24" r="${RING_R}"/>`
    + `<circle class="ds-ring-bar" cx="24" cy="24" r="${RING_R}" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/></svg>`
    + `<b class="ds-ring-num">${Math.ceil(Math.max(0, Number(o.seconds) || 0))}</b></div>`;

  // =================================================================================================
  // 6. CSÚSZKA (HTML)
  // =================================================================================================
  // dsRangeHTML({ id, label, min, max, step, value, unit, labels:['kevés','sok'] }) – után: DS.range.bind(document.getElementById(id))
  function dsRangeHTML(o = {}){
    const id = o.id || nextId('ds-range'), min = Number(o.min ?? 0), max = Number(o.max ?? 100), step = o.step ?? 1;
    const val = Math.min(max, Math.max(min, Number(o.value ?? (min + max) / 2)));
    const k = max > min ? (val - min) / (max - min) : 0;
    const vt = `${String(val).replace('.', ',')}${o.unit ? ' ' + o.unit : ''}`;
    const ends = o.labels && o.labels.length ? `<div class="ds-range-ends" aria-hidden="true"><span>${esc(o.labels[0])}</span><span>${esc(o.labels[1] || '')}</span></div>` : '';
    return `<div class="ds-range-field" style="--k:${k.toFixed(4)}">`
      + (o.label ? `<label class="ds-range-label" for="${esc(id)}">${esc(o.label)}</label>` : '')
      + `<div class="ds-range-box"><output class="ds-range-val" for="${esc(id)}" aria-hidden="true">${esc(vt)}</output>`
      + `<input class="ds-range" type="range" id="${esc(id)}" min="${min}" max="${max}" step="${esc(step)}" value="${val}" aria-valuetext="${esc(vt)}" data-unit="${esc(o.unit || '')}"${o.label ? '' : ' aria-label="Tipp"'}>`
      + `<span class="ds-range-hex" aria-hidden="true"></span></div>${ends}</div>`;
  }

  // tipp-gomb (kis „i” egy szó mellett): dsTipBtnHTML('Mit jelent a kWh?', 'kWh')
  const dsTipBtnHTML = (text, label) => `<button class="ds-tip-btn" type="button" data-ds-tip="${esc(text)}" aria-label="${esc(label ? tr('Mit jelent: {x}', { x:label }) : tr('Magyarázat'))}">${ic('info')}</button>`;

  const API = { dsDeltaTone, dsDeltaSign, dsDeltaHTML, dsMeterHTML, dsRadarPoints, dsProfileHTML, dsSourceHTML, dsAssumeHTML,
    dsRingHTML, dsRangeHTML, dsTipBtnHTML, RADAR, RING_C };
  if(typeof module !== 'undefined' && module.exports){ module.exports = API; return; }
  Object.assign(root, { dsDeltaHTML, dsMeterHTML, dsProfileHTML, dsSourceHTML, dsAssumeHTML, dsRingHTML, dsRangeHTML, dsTipBtnHTML });
  const DS = root.DS = root.DS || {};
  DS.ext = API;

  // ================= Böngészős viselkedés =================
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
  const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }, keys(){ try{ return Object.keys(localStorage); }catch(e){ return []; } } };

  // ---------- 1. DS.delta.show(horgony, [{ label, icon, value, better }]) – változás-köteg a horgony fölött ----------
  DS.delta = {
    show(anchor, deltas = [], o = {}){
      if(!anchor || !deltas.length) return null;
      const r = anchor.getBoundingClientRect();
      const box = mk('div', 'ds-delta-pop', deltas.map(d => dsDeltaHTML(d)).join(''));
      box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
      box.style.left = Math.min(innerWidth - 60, Math.max(60, r.left + r.width / 2)) + 'px';
      box.style.top = Math.max(8 + deltas.length * 34, r.top - 6) + 'px';
      document.body.appendChild(box);
      setTimeout(() => box.remove(), o.ms || (still() ? 2400 : 2000));   // mozgás nélkül is ott marad olvasásra
      return box;
    },
  };

  // ---------- 4. DS.coach – első lépés tanító ----------
  let coachCur = null;
  DS.coach = {
    seen:(key) => !!key && store.get('beeco_coach_' + key) === '1',
    // DS.coach.show(célElem, { text, key, mood:'help', button:'Értem', onClose }) → false, ha ezt a tippet már látta
    show(target, o = {}){
      if(!target || (o.key && DS.coach.seen(o.key))) return false;
      DS.coach.hide();
      if(o.key) store.set('beeco_coach_' + o.key, '1');
      try{ target.scrollIntoView({ block:'center', inline:'nearest' }); }catch(e){}
      const wrap = mk('div', 'ds-coach'); wrap.dataset.key = o.key || '';
      const ring = mk('div', 'ds-coach-ring');
      const bee = typeof root.dsMood === 'function' ? root.dsMood(o.mood || 'help') : 'assets/brand/moods/help.webp';
      const say = mk('div', 'ds-say ds-coach-say', `<span class="ds-avatar is-bee" style="--size:56px"><img src="${esc(bee)}" alt=""></span>`
        + `<div class="ds-bubble" role="status" aria-live="polite"><b class="ds-who">Tipp</b>${esc(o.text)}`
        + `<button class="ds-btn-sm is-primary" type="button">${esc(o.button || tr('Értem'))}</button></div>`);
      wrap.append(ring, say); document.body.appendChild(wrap);
      const place = () => {
        const r = target.getBoundingClientRect(), pad = 6;
        Object.assign(ring.style, { left:r.left - pad + 'px', top:r.top - pad + 'px', width:r.width + pad * 2 + 'px', height:r.height + pad * 2 + 'px' });
        const sw = say.offsetWidth, sh = say.offsetHeight, below = r.bottom + 14 + sh < innerHeight - 8;
        say.style.left = Math.max(12, Math.min(innerWidth - sw - 12, r.left + r.width / 2 - sw / 2)) + 'px';
        say.style.top = (below ? r.bottom + 14 : Math.max(8, r.top - 14 - sh)) + 'px';
      };
      place();
      // koppintás: a lyukon belül a célra „átengedjük” (a cél megkapja a kattintást), bárhol máshol csak bezár
      const onTap = (e) => {
        if(e.target.closest('.ds-coach-say button')) return close();
        const r = target.getBoundingClientRect(), inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        close(); if(inside){ e.preventDefault(); target.focus && target.focus({ preventScroll:true }); target.click(); }
      };
      const onKey = (e) => { if(e.key === 'Escape'){ e.preventDefault(); close(); } };
      const onTarget = () => close();   // billentyűzettel/programból használta a célt
      wrap.addEventListener('click', onTap);
      document.addEventListener('keydown', onKey, true);
      ['input', 'keydown', 'change'].forEach(ev => target.addEventListener(ev, onTarget));
      addEventListener('resize', place); addEventListener('scroll', place, true);
      function close(){
        if(!wrap.isConnected) return;
        wrap.remove(); coachCur = null;
        document.removeEventListener('keydown', onKey, true);
        ['input', 'keydown', 'change'].forEach(ev => target.removeEventListener(ev, onTarget));
        removeEventListener('resize', place); removeEventListener('scroll', place, true);
        o.onClose && o.onClose();
      }
      coachCur = { close };
      return true;
    },
    hide(){ coachCur && coachCur.close(); },
    // DS.coach.reset() – minden tipp újra megjelenik (Beállítások → „Bemutatók újra”); reset('kulcs') csak azt az egyet
    reset(key){ if(key) store.del('beeco_coach_' + key); else store.keys().filter(k => k.startsWith('beeco_coach_')).forEach(k => store.del(k)); },
  };

  // ---------- 5. DS.ring – visszaszámláló (a háttérbe tett lapon megáll) ----------
  const rings = new Map();
  function ringDraw(el, left, total){
    const k = total > 0 ? Math.max(0, left) / total : 0;
    const bar = el.querySelector('.ds-ring-bar'), n = el.querySelector('.ds-ring-num');
    if(bar) bar.setAttribute('stroke-dashoffset', (RING_C * (1 - k)).toFixed(2));
    const s = String(Math.ceil(Math.max(0, left - 1e-6)));
    if(n && n.textContent !== s) n.textContent = s;
    el.classList.toggle('is-low', left > 0 && k <= 0.25);
  }
  DS.ring = {
    // DS.ring.start(el, 10, () => …) → { stop, pause, resume, left() }
    start(el, seconds, onEnd){
      if(!el) return null; DS.ring.stop(el);
      const total = Math.max(0.1, Number(seconds) || Number(el.dataset.seconds) || 10);
      let used = 0, last = performance.now(), paused = false, raf = 0;
      el.classList.remove('is-done', 'is-paused');
      const tick = (t) => {
        if(!paused){ used += (t - last) / 1000; } last = t;
        const left = total - used; ringDraw(el, left, total);
        if(left <= 0){ el.classList.add('is-done'); el.classList.remove('is-low'); cleanup(); onEnd && onEnd(); return; }
        raf = requestAnimationFrame(tick);
      };
      const vis = () => { if(document.hidden){ paused = true; el.classList.add('is-paused'); } else if(!ctl.userPaused){ paused = false; el.classList.remove('is-paused'); last = performance.now(); } };
      document.addEventListener('visibilitychange', vis);
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); rings.delete(el); };
      const ctl = { userPaused:false,
        stop(){ cleanup(); }, pause(){ ctl.userPaused = paused = true; el.classList.add('is-paused'); },
        resume(){ ctl.userPaused = paused = false; el.classList.remove('is-paused'); last = performance.now(); },
        left:() => Math.max(0, total - used) };
      rings.set(el, ctl); ringDraw(el, total, total); raf = requestAnimationFrame(tick);
      return ctl;
    },
    stop(el){ const c = rings.get(el); if(c) c.stop(); },
  };

  // ---------- 6. DS.range.bind – az érték-buborék és a hatszög követi a csúszkát ----------
  DS.range = {
    bind(input, onChange){
      if(!input || input.dataset.dsBound) return input; input.dataset.dsBound = '1';
      const field = input.closest('.ds-range-field') || input, out = field.querySelector && field.querySelector('.ds-range-val');
      const upd = () => { const min = +input.min || 0, max = +input.max || 100, v = +input.value;
        const vt = `${String(v).replace('.', ',')}${input.dataset.unit ? ' ' + input.dataset.unit : ''}`;
        field.style.setProperty('--k', max > min ? ((v - min) / (max - min)).toFixed(4) : 0);
        input.setAttribute('aria-valuetext', vt); if(out) out.textContent = vt; onChange && onChange(v); };
      input.addEventListener('input', upd); upd(); return input;
    },
    bindAll(scope = document){ scope.querySelectorAll('.ds-range').forEach(i => DS.range.bind(i)); },
  };

  // ---------- 7. DS.tip – magyarázó buborék ----------
  let tipEl = null, tipFor = null;
  function tipShow(el){
    const text = el.dataset.dsTip || el.getAttribute('data-ds-tip'); if(!text) return;
    if(tipFor === el && tipEl) return;
    tipHide();
    tipEl = mk('div', 'ds-tip'); tipEl.id = nextId('ds-tip'); tipEl.setAttribute('role', 'tooltip'); tipEl.textContent = text;
    document.body.appendChild(tipEl); tipFor = el; el.setAttribute('aria-describedby', tipEl.id);
    tipPlace();
  }
  // elhelyezés: fölötte, ha elfér, különben alatta; vízszintesen a képernyőn belül; a nyíl a célra mutat
  function tipPlace(){
    if(!tipEl || !tipFor) return;
    const el = tipFor, r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight, gap = 10;
    if(r.bottom < 0 || r.top > innerHeight){ tipHide(); return; }   // a cél kigördült a képből
    tipEl.classList.remove('is-above', 'is-below');
    const above = r.top - h - gap >= 8 || r.bottom + h + gap > innerHeight - 8;   // fent, ha elfér; különben alul (átfordul)
    const left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    tipEl.classList.add(above ? 'is-above' : 'is-below');
    tipEl.style.left = left + 'px';
    tipEl.style.top = (above ? Math.max(8, r.top - h - gap) : r.bottom + gap) + 'px';
    tipEl.style.setProperty('--ax', Math.max(12, Math.min(w - 12, r.left + r.width / 2 - left)) + 'px');
  }
  function tipHide(){ if(tipFor) tipFor.removeAttribute('aria-describedby'); if(tipEl) tipEl.remove(); tipEl = tipFor = null; }
  DS.tip = {
    // DS.tip.attach(elem, 'szöveg') – rámutatás, fókusz, koppintás
    attach(el, text){
      if(!el) return el; if(text != null) el.dataset.dsTip = text;
      if(el.dataset.dsTipBound) return el; el.dataset.dsTipBound = '1';
      if(!el.matches('button, a[href], input, select, textarea, [tabindex]')) el.tabIndex = 0;   // billentyűzettel is elérhető
      let touch = false, wasOpen = false;   // érintésnél a koppintás váltogat (a fókusz már megnyitná, ezért előtte nézzük)
      el.addEventListener('pointerdown', e => { touch = e.pointerType !== 'mouse'; wasOpen = tipFor === el; });
      el.addEventListener('mouseenter', () => { if(!touch) tipShow(el); });
      el.addEventListener('mouseleave', () => { if(!touch && tipFor === el) tipHide(); });
      el.addEventListener('focus', () => tipShow(el));
      el.addEventListener('blur', () => { if(tipFor === el) tipHide(); });
      el.addEventListener('click', () => { if(touch){ if(wasOpen) tipHide(); else tipShow(el); } });
      return el;
    },
    // minden [data-ds-tip] elem egy hívással (pl. betöltéskor és új tartalom után)
    scan(scope = document){ scope.querySelectorAll('[data-ds-tip]').forEach(el => DS.tip.attach(el)); },
    hide:tipHide,
  };
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && tipEl){ e.preventDefault(); tipHide(); } }, true);   // előbb a buborék zárul, a panel csak a következő Esc-re
  document.addEventListener('pointerdown', e => { if(tipEl && tipFor && !tipFor.contains(e.target)) tipHide(); }, true);
  addEventListener('scroll', () => tipPlace(), true); addEventListener('resize', () => tipPlace());

  // ---------- 8. DS.sheet – alsó lap / középre nyíló panel ----------
  let sheetCur = null;
  DS.sheet = {
    // DS.sheet.open('<p>…</p>', { title:'Mit jelent?', onClose }) → a lap eleme
    open(html, o = {}){
      DS.sheet.close(true);
      const back = document.activeElement, tid = nextId('ds-sheet-t');
      const scrim = mk('div', 'ds-scrim ds-sheet-scrim');
      scrim.innerHTML = `<div class="ds-sheet" role="dialog" aria-modal="true" ${o.title ? `aria-labelledby="${tid}"` : `aria-label="${tr('Részletek')}"`} tabindex="-1">`
        + `<div class="ds-sheet-handle" aria-hidden="true"></div>`
        + `<div class="ds-sheet-head">${o.title ? `<h2 class="ds-sheet-title" id="${tid}">${esc(o.title)}</h2>` : '<span style="flex:1"></span>'}`
        + `<button class="ds-icon-btn" type="button" data-ds-close aria-label="${tr('Bezárás')}">${ic('close') || '×'}</button></div>`
        + `<div class="ds-sheet-body"></div></div>`;
      const sheet = scrim.firstElementChild, body = sheet.querySelector('.ds-sheet-body');
      if(typeof html === 'string') body.innerHTML = html; else if(html) body.appendChild(html);
      document.body.appendChild(scrim);
      scrim.addEventListener('click', e => { if(e.target === scrim || e.target.closest('[data-ds-close]')) DS.sheet.close(); });
      // lehúzás (telefonon): a fülön vagy a fejlécen
      let y0 = null, dy = 0, t0 = 0;
      const down = (e) => { if(e.target.closest('button') || innerWidth >= 700) return; y0 = e.clientY; dy = 0; t0 = performance.now();
        sheet.classList.add('is-dragging'); e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); };
      const move = (e) => { if(y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; };
      const up = () => { if(y0 == null) return; const fast = dy / Math.max(1, performance.now() - t0) > 0.6; y0 = null;
        sheet.classList.remove('is-dragging');
        if(dy > Math.min(120, sheet.offsetHeight * 0.3) || (fast && dy > 30)) DS.sheet.close(); else sheet.style.transform = ''; };
      sheet.querySelectorAll('.ds-sheet-handle, .ds-sheet-head').forEach(h => { h.addEventListener('pointerdown', down);
        h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up); });
      sheetCur = { scrim, sheet, back, onClose:o.onClose };
      (sheet.querySelector('[data-ds-close]') || sheet).focus({ preventScroll:true });
      return sheet;
    },
    close(now){
      const c = sheetCur; if(!c) return; sheetCur = null;
      const done = () => { c.scrim.remove(); if(c.back && c.back.isConnected && c.back.focus) c.back.focus({ preventScroll:true }); c.onClose && c.onClose(); };
      if(now === true || still()){ done(); return; }
      c.sheet.style.transform = ''; c.sheet.classList.add('is-closing'); c.scrim.classList.add('is-closing');
      setTimeout(done, 200);
    },
    isOpen:() => !!sheetCur,
  };

  // ---------- 10. DS.big – nagy betű mód (tárolva: beeco_big; a régi Ökos-rejtély kulcsát, beeco_rz_big, is olvassa) ----------
  DS.big = {
    get(){ const v = store.get('beeco_big'); return v != null ? v === '1' : store.get('beeco_rz_big') === '1'; },
    set(on){ on = !!on; document.documentElement.classList.toggle('ds-big', on); store.set('beeco_big', on ? '1' : '0'); return on; },
    apply(){ document.documentElement.classList.toggle('ds-big', DS.big.get()); },
  };
  DS.big.apply();

  // betöltéskor: a jelölővel ellátott tippek és csúszkák maguktól élnek
  const boot = () => { DS.tip.scan(); DS.range.bindAll(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);
