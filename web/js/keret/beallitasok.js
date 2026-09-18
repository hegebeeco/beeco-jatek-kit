// ============================================================
//  KERET – beállítások: hang, háttérzene, rezgés, kevesebb mozgás, vezérlés (érintés / egér)
//  Ugyanazok a mentési kulcsok, mint a beeco-szelektalj játékokban → a közös címen futó játékok beállítása közös.
//  keretBeallitasok.panelHTML() → a panel tartalma (ds-switch, ds-seg); keretBeallitasok.bekot(el) → a kattintások kezelése.
//  keretBeallitasok.kevesebbMozgas → igaz, ha a játékos kérte (vagy a rendszer): ilyenkor a DS mozgás-készlet is áll.
// ============================================================
const keretBeallitasok = (function(){
  const ls = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };
  let reduce = ls('beeco_reduce', '0') === '1', cb = ls('beeco_cb', '0') === '1';
  // kevesebb mozgás + színtévesztő-barát adatszínek (.ds-cb: a --data-* tokenek kék–narancs skálára váltanak – docs/adatskala.md)
  const alkalmaz = () => { if(document.body) document.body.classList.toggle('reduce-motion', reduce); document.documentElement.classList.toggle('ds-cb', cb); };
  if(document.body) alkalmaz(); else document.addEventListener('DOMContentLoaded', alkalmaz);
  const input = () => ls('beeco_input', 'auto');
  const erintes = () => input() === 'erintes' || (input() === 'auto' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window));
  const sor = (key, ikon, cim, alcim, on) => `<div class="kerSor"><div><b>${pic(ikon)} ${cim}</b><small>${alcim}</small></div>
    <button class="ds-switch" role="switch" aria-checked="${!!on}" aria-label="${cim}" data-ker="${key}"></button></div>`;
  function panelHTML(){
    const H = typeof beecoHang !== 'undefined' ? beecoHang : null;
    return (H ? sor('hang', 'sound', 'Hang', 'Minden hangeffekt és a zene be/ki.', !H.muted)
      + sor('zene', 'music', 'Háttérzene', 'Halk háttérzene játék közben.', H.music && !H.muted)
      + sor('rezges', 'vibrate', 'Rezgés', 'Rövid rezgés a visszajelzésnél (mobilon).', H.haptic) : '')
      + sor('mozgas', 'motion', 'Kevesebb mozgás', 'Visszafogottabb animációk.', reduce)
      + (DS && DS.big ? sor('nagy', 'text', 'Nagyobb betűk', 'Nagyobb szöveg és gombok minden képernyőn.', DS.big.get()) : '')
      + sor('cb', 'eye', 'Színtévesztő-barát színek', 'A térképek és ábrák kék–narancs színskálát használnak.', cb)
      + `<div class="kerSor"><div><b>${pic('games')} Vezérlés</b><small>Érintőképernyőn az „Érintés” a jó. Váltáskor az oldal újratölt.</small></div>
        <div class="ds-seg" role="radiogroup" aria-label="Vezérlés">${[['auto', 'Automatikus'], ['erintes', 'Érintés'], ['eger', 'Egér']].map(([v, l]) =>
          `<button role="radio" aria-checked="${input() === v}" class="${input() === v ? 'on' : ''}" data-ker="input" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  }
  function bekot(el){
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-ker]'); if(!b) return; e.stopPropagation();
      const k = b.dataset.ker, H = typeof beecoHang !== 'undefined' ? beecoHang : null;
      if(k === 'hang' && H) H.setMuted(!H.muted);
      else if(k === 'zene' && H) H.setMusic(!H.music);
      else if(k === 'rezges' && H) H.setHaptic(!H.haptic);
      else if(k === 'mozgas'){ reduce = !reduce; lsSet('beeco_reduce', reduce ? '1' : '0'); alkalmaz(); }
      else if(k === 'nagy' && DS.big) DS.big.set(!DS.big.get());
      else if(k === 'cb'){ cb = !cb; lsSet('beeco_cb', cb ? '1' : '0'); alkalmaz(); }
      else if(k === 'input'){ if(b.dataset.v !== input()){ lsSet('beeco_input', b.dataset.v); location.reload(); } return; }
      el.innerHTML = panelHTML();
    });
  }
  return { panelHTML, bekot, get szintevesztoBarat(){ return cb; }, get kevesebbMozgas(){ return reduce || matchMedia('(prefers-reduced-motion: reduce)').matches; }, get erintes(){ return erintes(); } };
})();
