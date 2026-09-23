// ============================================================
//  KERET – kioszk-mód rendezvényi érintőképernyőhöz (pl. Brain Bar stand) – ?kioszk=1 az URL-ben
//  (a beeco-szelektalj kioszkjából általánosítva)
//
//  keretKioszk.indit({ cim, alcim, kep, kartyak:[{ id, cim, alcim, ikon, cimke, kiemelt }], inditas(id), alaphelyzet(), appUrl, appCta })
//  • Nyitóképernyő kártyákkal (a játék módjai / szintjei), alul QR-kód az app letöltéséhez és vezérlés-váltó (személyzetnek).
//  • Védelem: teljes képernyő az első érintésre, a kijelző ébren marad, nincs jobb klikk / kijelölés / lehúzás, külső link nem nyílik.
//  • Tétlenség: 2 perc → „Még itt vagy?” (20 mp) → alaphelyzet: a látogató nyomai (mentés, album, név) törlődnek, a beállítások maradnak.
//  • Képernyővédő: a nyitóképernyőn 45 mp érintés nélkül → mozgó csalogató (méhecskék, „Érintsd meg!”, QR).
//  • Nagy képernyőn a felület arányosan nagyobb: --kz-zoom (a játék a saját elemeire alkalmazhatja: zoom:var(--kz-zoom)).
//  Ha az URL-ben nincs ?kioszk, a modul nem csinál semmit (keretKioszk.aktiv === false).
// ============================================================
const keretKioszk = (function(){
  const MODE = new URLSearchParams(location.search).get('kioszk');
  if(MODE == null) return { aktiv:false, indit(){} };
  window.KIOSZK = MODE; document.documentElement.classList.add('kiosk-lock');
  const IDLE = 120000, WARN = 20, SAVER = 45000;
  // marad: CSAK a gép beállításai. Minden látogatói adat törlődik (rekordok és helyi ranglisták is), 2026-09-23.
  const KEEP = /^beeco_(rz_(big|help|captions|palette)|input|hatter|haptic|music|muted|reduce|calm|tips|lang)$/;
  let cfg = null, last = Date.now(), warnT = null, left = 0, lock = null, saverT = null, slide = 0;
  const $ = (h, id, cls) => { const d = document.createElement('div'); d.id = id; d.className = cls || 'hidden'; d.innerHTML = h || ''; document.body.appendChild(d); return d; };
  let home, idle, saver;
  const wake = async () => { try{ if('wakeLock' in navigator && !lock){ lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } }catch(e){} };
  const full = () => { const d = document.documentElement; if(!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {}); wake(); };
  const clearVisitor = () => { try{ for(const k of Object.keys(localStorage)) if(/^beeco_/.test(k) && !KEEP.test(k)) localStorage.removeItem(k); }catch(e){} };
  const poke = () => { last = Date.now(); if(warnT){ clearInterval(warnT); warnT = null; idle.classList.add('hidden'); } };
  const onHome = () => home && !home.classList.contains('hidden');
  const qr = size => typeof qrHTML === 'function' ? qrHTML(cfg.appUrl || 'https://beeco.hu', size) : '';
  const app = size => `<div class="kzApp">${qr(size)}<div><b>${cfg.appCta || tr('Töltsd le a beeco appot')}</b><small>${tr('Olvasd be a telefonod kamerájával!')}</small></div></div>`;
  const erint = () => typeof keretBeallitasok !== 'undefined' ? keretBeallitasok.erintes : matchMedia('(pointer: coarse)').matches;

  function showHome(){
    saver.classList.add('hidden'); home.classList.remove('hidden');
    home.innerHTML = `<div class="kzBox"><div class="kzHead">${cfg.kep ? `<img class="kzRole" src="${cfg.kep}" alt="">` : ''}
        <div><h1>${cfg.cim}</h1>${cfg.alcim ? `<p>${cfg.alcim}</p>` : ''}</div></div>
      <div class="kzStories">${(cfg.kartyak || []).map((k, i) => `<button type="button" class="kzStory ${k.kiemelt ? 'is-quick' : ''} ds-anim-in ds-delay-${Math.min(4, i + 1)}" data-kz="${k.id}">
        <span class="kzIco" aria-hidden="true">${dsIcon(k.ikon || 'star')}</span><span class="kzTxt">${k.cimke ? `<span class="ds-tag ${k.kiemelt ? 'is-accent' : ''}">${k.cimke}</span>` : ''}
        <b>${k.cim}</b>${k.alcim ? `<small>${k.alcim}</small>` : ''}</span><span class="kzGo">${pic('next')}</span></button>`).join('')}</div>
      <div class="kzFoot"><p class="kzTap ds-anim-pulse">${pic('tip')} ${cfg.felhivas || tr('Válassz, és indulhat a játék!')}</p>${app(104)}</div>
      <div class="kzInput"><span>${pic('games')} ${tr('Vezérlés:')}</span><div class="ds-seg" role="radiogroup" aria-label="${tr('Vezérlés')}">${[['erintes', tr('Érintés')], ['eger', tr('Egér + billentyű')]].map(([v, l]) =>
        `<button type="button" role="radio" aria-checked="${erint() === (v === 'erintes')}" class="${erint() === (v === 'erintes') ? 'on' : ''}" data-kz-input="${v}">${l}</button>`).join('')}</div></div></div>`;
    if(typeof qrFill === 'function') qrFill(home);
  }
  function showSaver(){
    const bees = [dsMood('hello'), dsMood('good'), dsMood('great'), dsMood('think')];
    saver.innerHTML = `<div class="kzBees">${bees.concat(bees).map((b, i) => `<img src="${b}" alt="" style="--i:${i}">`).join('')}</div>
      <div class="kzSaverBox">${cfg.kep ? `<img class="kzRole" src="${cfg.kep}" alt="">` : ''}<h1>${cfg.cim}</h1>
        <div class="kzSlides">${(cfg.kartyak || []).map((k, i) => `<p class="kzSlide${i ? '' : ' on'}">${dsIcon(k.ikon || 'star')} <span>${k.alcim || k.cim}</span></p>`).join('')}</div>
        <p class="kzTap ds-anim-pulse">${tr('Érintsd meg a képernyőt!')}</p></div><div class="kzSaverApp">${app(120)}</div>`;
    if(typeof qrFill === 'function') qrFill(saver); saver.classList.remove('hidden'); slide = 0;
    clearInterval(saverT); saverT = setInterval(() => { const all = saver.querySelectorAll('.kzSlide'); if(!all.length) return;
      all[slide].classList.remove('on'); slide = (slide + 1) % all.length; all[slide].classList.add('on'); }, 4000);
  }
  function reset(){ if(cfg.alaphelyzet) cfg.alaphelyzet(); clearVisitor(); showHome(); last = Date.now(); }

  function indit(o){
    cfg = o || {};
    home = $('', 'kioszk', ''); home.setAttribute('role', 'dialog'); home.setAttribute('aria-modal', 'true');
    saver = $('', 'kzSaver'); saver.setAttribute('aria-hidden', 'true');
    idle = $(`<div class="ds-panel kzIdleBox"><img src="${dsMood('think')}" alt=""><h2>${tr('Még itt vagy?')}</h2>
      <p>${tr('Ha nem, {mp} mp múlva kezdődik elölről a következő játékosnak.', { mp:`<b class="kzNum">${WARN}</b>` })}</p>
      <button class="ds-btn" type="button" data-kz-stay>${tr('Itt vagyok, folytatom')} ${pic('next')}</button></div>`, 'kzIdle');
    idle.setAttribute('role', 'alertdialog'); idle.setAttribute('aria-modal', 'true');
    // védelem
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if(!a || a.getAttribute('href').startsWith('#')) return; e.preventDefault(); e.stopPropagation(); }, true);
    document.addEventListener('pointerdown', full, true);
    document.addEventListener('visibilitychange', () => { if(!document.hidden) wake(); });
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => document.addEventListener(t, poke, true));
    const zoom = () => document.documentElement.style.setProperty('--kz-zoom', Math.max(1, Math.min(1.8, innerWidth/1180, innerHeight/780)).toFixed(2));
    zoom(); addEventListener('resize', zoom);
    // kezdőképernyő, tétlenség, képernyővédő
    home.addEventListener('pointerdown', e => e.stopPropagation());
    home.addEventListener('click', e => {
      const inp = e.target.closest('[data-kz-input]');
      if(inp){ try{ localStorage.setItem('beeco_input', inp.dataset.kzInput); }catch(err){} location.reload(); return; }
      const b = e.target.closest('[data-kz]'); if(!b) return; e.stopPropagation(); full(); clearVisitor(); home.classList.add('hidden'); if(cfg.inditas) cfg.inditas(b.dataset.kz); });
    idle.addEventListener('click', e => { if(e.target.closest('[data-kz-stay]')) poke(); });
    saver.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); clearInterval(saverT); showHome(); });
    setInterval(() => {
      if(onHome()){ if(saver.classList.contains('hidden') && Date.now() - last > SAVER) showSaver(); return; }
      if(warnT || Date.now() - last < IDLE) return;
      left = WARN; idle.querySelector('.kzNum').textContent = left; idle.classList.remove('hidden');
      warnT = setInterval(() => { left--; idle.querySelector('.kzNum').textContent = left;
        if(left <= 0){ clearInterval(warnT); warnT = null; idle.classList.add('hidden'); reset(); } }, 1000);
    }, 1000);
    showHome();
  }
  return { aktiv:true, indit, kezdolap:() => { if(cfg) showHome(); }, alaphelyzet:() => { if(cfg) reset(); } };
})();
