// ============================================================
//  KERET – kör vége panel (design system eredmény-minta: dsResultHTML)
//  keretEredmeny.mutat({ mood, title, lead, stars, score, scoreLabel, stats, more:[{ icon, title, html }], ujra(), kilep(), kilepFelirat })
//  Egy hívás mindent elintéz: panel (csillagok egyenként, felfutó pont), közös profil (beecoProfil.kor), mérés (beecoBridge),
//  kioszkban QR-kód az app letöltéséhez. A „profil” játékoknál (tervezési elv: nincs egyetlen zöld pontszám) a score elhagyható,
//  és a lead a 3–4 mondatos rendszerprofil.
// ============================================================
const keretEredmeny = (function(){
  const el = document.createElement('div');
  el.id = 'kerEredmeny'; el.className = 'hidden'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  const add = () => document.body.appendChild(el); document.body ? add() : document.addEventListener('DOMContentLoaded', add);
  let cb = {};
  const mozog = () => !(typeof keretBeallitasok !== 'undefined' && keretBeallitasok.kevesebbMozgas);
  function mutat(o){
    o = o || {}; cb = o;
    if(typeof beecoProfil !== 'undefined') beecoProfil.kor({ stars:o.stars });
    if(typeof beecoBridge !== 'undefined' && beecoBridge.fut()) beecoBridge.meres('end', { stars:o.stars != null ? o.stars : null });
    const more = (o.more || []).map(m => `<details class="ds-details"><summary>${pic(m.icon || 'info')}${m.title}</summary><div>${m.html}</div></details>`).join('');
    const app = window.KIOSZK && typeof qrHTML === 'function' && o.appUrl !== false
      ? `<div class="kerApp">${qrHTML(o.appUrl || 'https://beeco.hu', 96)}<div><b>${tr('Töltsd le a beeco appot')}</b><small>${tr('Olvasd be a telefonod kamerájával!')}</small></div></div>` : '';
    el.innerHTML = `<div class="ds-panel kerBox">${dsResultHTML({ mood:o.mood || (o.stars === 3 ? 'great' : 'good'), title:o.title, lead:o.lead, stars:o.stars,
      score:o.score, scoreLabel:o.scoreLabel || (o.score != null ? tr('pont') : null), stats:o.stats, extra:more,
      actions:`<button class="ds-btn is-block" type="button" data-ker="ujra">${o.ujraFelirat || tr('Újra')} ${pic('refresh')}</button>
        ${o.kilep ? `<div class="ds-row"><button class="ds-btn-sm" type="button" data-ker="kilep">${pic('home')} ${o.kilepFelirat || tr('Kilépés')}</button></div>` : ''}` })}${app}</div>`;
    el.classList.remove('hidden');
    if(typeof qrFill === 'function') qrFill(el);
    if(mozog()){
      DS.motion.play(el.querySelector('.kerBox'), 'in');
      el.querySelectorAll('.ds-stars .pic').forEach((p, i) => p.classList.add('ds-anim-drop', 'ds-delay-' + Math.min(4, i + 2)));
      const num = el.querySelector('.ds-result-num'); if(num){ const to = Number(num.textContent) || 0; num.textContent = '0'; DS.motion.countUp(num, to); }
    }
    const f = el.querySelector('[data-ker="ujra"]'); if(f) f.focus();
  }
  function elrejt(){ el.classList.add('hidden'); el.innerHTML = ''; }
  el.addEventListener('click', e => { const b = e.target.closest('[data-ker]'); if(!b) return; e.stopPropagation();
    elrejt(); if(b.dataset.ker === 'ujra' && cb.ujra) cb.ujra(); else if(b.dataset.ker === 'kilep' && cb.kilep) cb.kilep(); });
  return { mutat, elrejt, get nyitva(){ return !el.classList.contains('hidden'); } };
})();
