// ============================================================
//  beeco JÁTÉK-ARCULAT — a design system JavaScript-oldala
//
//  A CSS-tokenek (css/tokens.css) a HTML-felületeknek szólnak; a 3D világ (Three.js) és a vászonra
//  (canvas) rajzolt táblák viszont JS-ből kérnek színt. Ezért itt UGYANAZOK a tokenek vannak számként is,
//  plusz a 3D világ saját palettája és a közös tábla-rajzolók.
//  A tests/check-arculat.js ellenőrzi, hogy a DS.color egyezik a tokens.css-szel.
//  Böngészőben: globális DS; Node-ban (tesztek): require('../web/js/ds.js').
// ============================================================
(function(root){
  // ---- 1. Paletta (= tokens.css 1. szakasza) ----
  const color = {
    honey:'#FECF39', 'honey-deep':'#D8A500', butter:'#FEEEBB',
    olive:'#2F371E', 'olive-soft':'#596B39', leaf:'#6E8947', sage:'#D3DDBB', 'sage-bg':'#E3ECCD',
    cream:'#FFF8E7', paper:'#FFFDF6',
    blossom:'#F5B4C7', 'blossom-bg':'#FDE2E8', berry:'#7A2E3F', sky:'#B1DEFF', 'sky-bg':'#D6E8F7', ember:'#EA580C',
    focus:'#2656D9', night:'#1F2615', 'night-surface':'#353F25',
  };
  const toNum = (hex) => parseInt(String(hex).replace('#', ''), 16);
  const toCss = (num) => '#' + Number(num).toString(16).padStart(6, '0').toUpperCase();

  // ---- 2. A 3D világ palettája: meleg, földközeli tónusok a beeco színeiből ----
  // Szabály: új díszlet ezekből színez; ha új szín kell, ide vedd fel (név = MIRE való).
  const world = {
    background:0xFBEFD2, fog:0xF6EBD0, skyTop:0x7FC0EE, skyBottom:0xFFF1D0,
    grass:0x9DB577, grassPaint:0x8FA868, grassTuft:0x6E8947,
    islandSide:0xFECF39, islandBase:0xD8A500,                 // méhsejt-sziget a kert alatt
    soil:0x8B5A2B, woodRim:0xA8743A, fence:0xE2C48A, trunk:0x824217,
    foliage:0x596B39, foliageLight:0x8FA868, bush:0x7C9559, stem:0x596B39,
    leafPile:0x9A6A2E,
    outline:0x2F371E,
    flowers:[0xF5B4C7, 0xFFFDF6, 0xB1DEFF, 0xF28BB3, 0xEA580C],
  };

  // ---- 2/b. Beltéri paletta (konyha, ház): meleg fa, zsályás fal, olívás acél – a beeco színeihez hangolva ----
  const interior = {
    wall:0xE3ECCD, tile:0xD3DDBB, window:0xB1DEFF, glass:0xD6E8F7,
    floorLight:0xD9C4A0, floorDark:0xC2A87E, floorLine:0xA88C62,
    applianceShell:0xFFFDF6, applianceInner:0xE9EFE4, steel:0xC7CFC4, steelDark:0x3B4436,
    wood:0xB4854A, woodDark:0x8C6636, woodLight:0xCBB086, cabinet:0xF3E6C8,
    counter:0xEAE2D0, counterBase:0x6D6455, tableTop:0x9C7A4E, tableEdge:0x6B5330,
    lampShade:0xFECF39, cord:0x2F371E, shadow:0x2F371E,
  };

  // ---- 3. Fények ----
  const light = {
    outdoor:{ sunColor:0xFFF1D6, sun:1.05, hemiSky:0xFFF8E7, hemiGround:0x6E8947, hemi:0.62 },   // napos kert
    indoor:{ sun:0.45, hemi:0.72, hemiGround:0xBFAE90 },                                          // konyha: lágy, meleg beltéri fény
  };

  // ---- 4. Betűk vászonra (a CSS --display / --body párja) ----
  const font = {
    display:'Lalezar, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif',
    body:'"Open Sans", "Segoe UI", system-ui, sans-serif',
  };

  // ---- 5. Közös tábla-rajzolók (vászon → Three.js CanvasTexture) ----
  function roundRect(x, px, py, w, h, r){
    x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
  }
  // a szöveg akkora, amekkora még kifér (a „hány betű" becslés helyett mérünk)
  function fitFont(x, text, maxW, size, min){
    let s = size; x.font = s + 'px ' + font.display;
    while(s > min && x.measureText(text).width > maxW){ s -= 2; x.font = s + 'px ' + font.display; }
    return s;
  }
  // Tábla (pl. kuka felett): méz alap, olíva keret, Lalezar felirat
  function signCanvas(text, o = {}){
    const w = o.w || 360, h = o.h || 150, line = o.line || 12, r = o.radius != null ? o.radius : 22;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    roundRect(x, line / 2, line / 2, w - line, h - line, r);
    x.fillStyle = o.bg || color.honey; x.fill(); x.lineWidth = line; x.strokeStyle = o.ink || color.olive; x.stroke();
    x.fillStyle = o.ink || color.olive; x.textAlign = 'center'; x.textBaseline = 'middle';
    fitFont(x, text, w - line * 2 - 24, o.size || 50, 22);
    x.fillText(text, w / 2, h / 2 + (o.baseline != null ? o.baseline : 6));   // a Lalezar alapvonala magasan ül → kicsit lejjebb
    return c;
  }
  // Pirula-címke (pl. hulladék neve a futószalagon)
  function pillCanvas(text, o = {}){
    return signCanvas(text, { w:o.w || 260, h:o.h || 66, line:o.line || 7, radius:(o.h || 66) / 2 - 4, size:o.size || 34, bg:o.bg, ink:o.ink, baseline:3 });
  }

  // ---- 6. Méhecske-hangulatok: melyik helyzetben melyik figura (a beeco app illusztrációi) ----
  // Szabály: a játékost soha nem szidjuk – rossz válasznál a GONDOLKODÓ méhecske jön, nem a mérges.
  // A „harm" (beteg, zöld méhecske) csak a környezeti kárt mutatja (szmog, zöldre festett állítás), nem a játékost.
  const moods = {
    hello:'assets/brand/roles/kacsint.webp',   // köszönés, menü, bemutató eleje
    good:'assets/brand/bee-cheer.webp',        // jó válasz
    great:'assets/brand/bee-super.webp',       // rekord, sorozat, 3 csillag
    think:'assets/brand/moods/think.webp',     // rossz válasz: „hmm, gondoljuk át!"
    harm:'assets/brand/bee-sad.webp',          // környezeti kár a TARTALOMBAN
    love:'assets/brand/moods/love.webp',       // köszönet, gyűjtemény, jó cselekedet
    rank:'assets/brand/moods/rank.webp',       // rangemelés, új jelvény
    rest:'assets/brand/moods/rest.webp',       // szünet, üres állapot
    help:'assets/brand/moods/help.webp',       // tipp, útmutatás, térkép
    action:'assets/brand/moods/action.webp',   // valódi tett, „csináld otthon"
    app:'assets/brand/bee-phone.webp',         // beeco app letöltése
  };

  // ---- 7. Visszajelzés-recept: minden játékban UGYANÚGY szól és rezeg a jó és a rossz válasz ----
  // hang: [frekvencia Hz, hossz mp, hullámforma, hangerő, késleltetés ms] – lágy, sosem bántó (nincs „buzzer")
  const sound = {
    tap:  [[1400, 0.03, 'square', 0.03, 0]],
    good: [[660, 0.12, 'triangle', 0.09, 0], [990, 0.14, 'triangle', 0.09, 90]],
    great:[[660, 0.1, 'triangle', 0.08, 0], [880, 0.1, 'triangle', 0.08, 90], [1320, 0.18, 'triangle', 0.08, 180]],
    try:  [[392, 0.14, 'sine', 0.07, 0], [311, 0.2, 'sine', 0.06, 120]],
    pop:  [[880, 0.05, 'triangle', 0.05, 0]],
    unlock:[[523, 0.08, 'triangle', 0.07, 0], [784, 0.08, 'triangle', 0.07, 80], [1047, 0.16, 'triangle', 0.07, 160]],
  };
  const haptic = { tap:8, good:15, great:[15, 40, 15, 40, 30], try:[25, 50, 25] };
  // kind: 'good' | 'great' | 'try'  →  mood a méhecskének
  const feedback = { good:{ mood:'good', icon:'check', tone:'is-good' }, great:{ mood:'great', icon:'star', tone:'is-good' }, try:{ mood:'think', icon:'refresh', tone:'is-bad' } };

  const DS = { color, world, interior, light, font, moods, sound, haptic, feedback, toNum, toCss, roundRect, signCanvas, pillCanvas };
  if(typeof module !== 'undefined' && module.exports){ module.exports = DS; return; }
  root.DS = DS;

  // ================= Böngésző-segédek (a játékok és az arculat.html használja) =================
  const escT = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  // a pic(), beep(), haptic(), reactBee() más fájlok script-szintű nevei (nem window-tulajdonságok) → híváskor, typeof-fal keressük
  const P = (n) => (typeof pic === 'function' ? pic(n) : '');
  // hang: a játék beep()-jét használja (ott a némítás is érvényes); önálló oldalon saját, halk szintetizátor
  let ctx = null;
  function tone(f, d, type, vol){
    if(typeof beep === 'function') return beep(f, d, type, vol);
    try{ ctx = ctx || new (root.AudioContext || root.webkitAudioContext)(); const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.stop(t + d); }catch(e){}
  }
  root.dsSound = (name) => (sound[name] || []).forEach(([f, d, type, vol, delay]) => setTimeout(() => tone(f, d, type, vol), delay));
  root.dsHaptic = (name) => { if(typeof window.haptic === 'function') window.haptic(haptic[name]); };   // a DS.haptic neve eltakarja a játék haptic()-ját
  // egy hívás = hang + rezgés + méhecske (ha a játékban van reakció-méhecske)
  root.dsFeedback = (kind) => { const k = feedback[kind] ? kind : 'good';
    root.dsSound(k); root.dsHaptic(k); if(typeof reactBee === 'function') reactBee(feedback[k].mood); };
  root.dsMood = (name) => moods[name] || moods.hello;

  // ---- Mozgás-segédek (a készlet: web/css/ds-motion.css) – a „Kevesebb mozgás" beállítást tiszteletben tartják ----
  const stillSite = () => root.document && (document.body.classList.contains('reduce-motion')
    || (root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));
  const motion = {
    // animáció (újra)indítása egy elemen: DS.motion.play(el, 'stamp')
    play(el, name){ if(!el) return el; const cls = 'ds-anim-' + name;
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); return el; },
    // felszálló pontszám a képernyő egy pontján: DS.motion.rise('+120', x, y)
    rise(text, x, y, tone){ if(stillSite() || !root.document) return;
      const el = document.createElement('div'); el.className = 'ds-chip ds-anim-rise' + (tone ? ' ' + tone : '');
      el.textContent = text; el.style.cssText = `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);z-index:var(--z-alert);pointer-events:none`;
      document.body.appendChild(el); setTimeout(() => el.remove(), 900);
    },
    // röppenő hatszög-darabkák egy elem (vagy pont) körül: DS.motion.burst(el)
    burst(target, n = 10){ if(stillSite() || !root.document) return;
      const r = target && target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      const x = r ? r.left + r.width / 2 : (target && target.x) || innerWidth / 2, y = r ? r.top + r.height / 2 : (target && target.y) || innerHeight / 2;
      const kinds = ['', 'is-leaf', 'is-blossom', 'is-sky'];
      for(let i = 0; i < n; i++){ const el = document.createElement('i'), a = (i / n) * Math.PI * 2 + Math.random(), d = 40 + Math.random() * 70;
        el.className = 'ds-piece ' + kinds[i % kinds.length];
        el.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px;--rot:${Math.round(Math.random() * 540 - 270)}deg`;
        document.body.appendChild(el); setTimeout(() => el.remove(), 900); }
    },
    // számláló felfutása (pontszám, forint, kWh): DS.motion.countUp(el, 1240)
    countUp(el, to, dur = 700, fmt = v => String(v)){ if(!el) return;
      const from = parseFloat(String(el.textContent).replace(/[^0-9.-]/g, '')) || 0;
      if(stillSite() || !root.requestAnimationFrame){ el.textContent = fmt(to); return; }
      const t0 = performance.now();
      (function step(t){ const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(from + (to - from) * e)); if(k < 1) requestAnimationFrame(step); })(t0);
    },
  };
  DS.motion = motion; root.dsBurst = motion.burst; root.dsRise = motion.rise;
  // tartalom-ikon egy helyen: piktogram-név → pic() · emoji vagy matrica-név → illusztráció (js/art) · egyébként a szöveg marad
  root.dsIcon = (k) => (typeof PIC_DEFS !== 'undefined' && PIC_DEFS[k]) ? P(k) : (typeof artIcon === 'function' ? artIcon(k || '') : escT(k));
  // csillagok: dsStarsHTML(2) → ★★☆ (piktogramokkal, képernyőolvasónak „3-ból 2 csillag")
  root.dsStarsHTML = (n, max = 3, big = false) => `<span class="ds-stars${big ? ' is-big' : ''}" role="img" aria-label="${max}-ból ${n} csillag">`
    + Array.from({ length:max }, (_, i) => P(i < n ? 'star' : 'nostar')).join('') + '</span>';
  // eredmény-panel belseje: dsResultHTML({ mood, title, lead, stars, score, scoreLabel, stats:[{icon,value,label,tone}], actions })
  // az actions HTML-t a játék adja (egy ds-btn + kis gombok); a szövegeket itt escape-eljük
  root.dsResultHTML = (o = {}) => `<div class="ds-result">
      ${o.mood ? `<img class="ds-result-bee" src="${root.dsMood(o.mood)}" alt="">` : ''}
      <h2 class="ds-result-title">${escT(o.title)}</h2>
      ${o.stars != null ? root.dsStarsHTML(o.stars, o.maxStars || 3, true) : ''}
      ${o.score != null ? `<div class="ds-result-score"><span class="ds-result-num">${escT(o.score)}</span>${o.scoreLabel ? `<small>${escT(o.scoreLabel)}</small>` : ''}</div>` : ''}
      ${o.lead ? `<p class="ds-result-lead">${escT(o.lead)}</p>` : ''}
      ${(o.stats || []).length ? `<div class="ds-result-stats">${o.stats.map(st => `<span class="ds-chip ${st.tone || ''}" title="${escT(st.label)}">${P(st.icon)}${escT(st.value)}</span>`).join('')}</div>` : ''}
      ${o.extra || ''}
      ${o.actions ? `<div class="ds-result-actions">${o.actions}</div>` : ''}
    </div>`;

  // ---- Párbeszéd-őr: billentyűzettel (Tab) a fókusz a legfelső nyitott panelen belül marad, Esc a „Bezárás” gombot nyomja,
  //      bezárás után a fókusz visszakerül oda, ahonnan jött. Minden [aria-modal="true"] elemre él – a moduloknak nem kell tenniük semmit.
  //      Csak billentyű- és fókusz-eseménykor fut (nincs képkockánkénti figyelés), így a 3D-s játékot nem lassítja.
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const zOf = (el) => { for(let e = el; e && e.nodeType === 1; e = e.parentElement){ const z = parseInt(getComputedStyle(e).zIndex, 10); if(!isNaN(z)) return z; } return 0; };
  const topModal = () => [...document.querySelectorAll('[aria-modal="true"]')].filter(shown)
    .map((el, i) => ({ el, z:zOf(el), i })).sort((a, b) => b.z - a.z || b.i - a.i).map(m => m.el)[0] || null;
  const focusables = (m) => [...m.querySelectorAll(FOCUSABLE)].filter(shown);
  let guarded = null, returnTo = null;
  function sync(){
    const m = topModal();
    if(guarded && guarded !== m && !shown(guarded)){   // az őrzött panel bezárult → fókusz vissza
      const back = returnTo; guarded = null; returnTo = null;
      if(!m && back && back.isConnected && shown(back) && (!document.activeElement || document.activeElement === document.body)) back.focus();
    }
    return m;
  }
  function enter(m, last){
    if(guarded !== m){ const a = document.activeElement; if(!guarded && a && !m.contains(a) && a !== document.body) returnTo = a; guarded = m; }
    const f = focusables(m), t = f.length ? f[last ? f.length - 1 : 0] : m;
    if(t === m && !m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
    t.focus();
  }
  document.addEventListener('keydown', (e) => {
    const m = sync(); if(!m) return;
    if(e.key === 'Tab'){
      const f = focusables(m), a = document.activeElement;
      if(!m.contains(a)){ e.preventDefault(); enter(m, e.shiftKey); return; }
      if(!f.length || (e.shiftKey ? a === f[0] || a === m : a === f[f.length - 1])){ e.preventDefault(); enter(m, e.shiftKey); }   // a végéről az elejére, és fordítva
      else guarded = m;
    }
  }, true);
  // Esc: ha a modul maga nem kezelte, a panel „Bezárás” gombja
  root.addEventListener('keydown', (e) => {
    if(e.key !== 'Escape' || e.defaultPrevented) return;
    const m = sync(), c = m && m.querySelector('[data-ds-close], [aria-label="Bezárás"]');
    if(c && shown(c)){ e.preventDefault(); c.click(); setTimeout(sync, 0); }
  });
  document.addEventListener('focusin', (e) => { const m = sync(); if(m && !m.contains(e.target) && guarded === m) enter(m); });
  document.addEventListener('click', () => setTimeout(sync, 0), true);
  root.dsModalSync = sync;   // teszteléshez
})(typeof window !== 'undefined' ? window : globalThis);
