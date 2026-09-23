// ============================================================
//  OFFLINE MÓD – a service worker (sw.js) regisztrálása
//
//  A játékos semmit nem lát belőle: az első betöltés után a háttérben letöltődik a teljes játékgyűjtemény,
//  és ha később leesik a Wi-Fi (rendezvény, kioszk), a játék a tárolt példányból indul és fut tovább.
//  Új verzió: a háttérben települ, a már futó játékot NEM töltjük újra – az új kód a következő
//  oldalbetöltéskor lép életbe (kioszkban a vezérlés-váltás úgyis újratölt).
//
//  Kívülről (teszt, kioszk-felület) olvasható állapot:
//    window.beecoOffline.ready  → Promise, ami akkor teljesül, ha a tárolás lezajlott: { cached, version } (sosem hibázik)
//    window.beecoOffline.cached → true, ha a teljes lista a tárban van (addig false)
//  Leírás: docs/offline-es-ci.md
// ============================================================
(function(){
  const state = window.beecoOffline = { cached:false, version:null, ready:null };
  const supported = 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);   // file:// alatt nem működik

  // a SW-től kérdezzük meg, kész-e a tárolás (üzenet-csatornán, időkorláttal)
  function ask(sw){
    return new Promise(res => {
      const ch = new MessageChannel(), t = setTimeout(() => res(null), 3000);
      ch.port1.onmessage = e => { clearTimeout(t); res(e.data); };
      sw.postMessage({ type:'beeco-status' }, [ch.port2]);
    });
  }

  state.ready = !supported ? Promise.resolve({ cached:false, version:null }) : new Promise(resolve => {
    const start = () => navigator.serviceWorker.register('sw.js', { updateViaCache:'none' })
      .then(() => navigator.serviceWorker.ready)
      .then(reg => reg.active ? ask(reg.active) : null)
      .then(st => {
        if(st){ state.cached = !!st.complete; state.version = st.version; }
        resolve({ cached:state.cached, version:state.version });
      })
      .catch(() => resolve({ cached:false, version:null }));          // pl. iframe tiltott tárolóval, iOS WebView: csendben kimarad
    // A regisztráció ne versenyezzen a játék első betöltésével: a `load` UTÁN még várunk 8 másodpercet,
    // hogy a menü és az első játék adatai előbb jöjjenek meg. (2026-09-23: mobilneten a teljes gyűjtemény
    // letöltése – ~6 MB – közvetlenül a betöltés után elvette a sávot az első játéktól.)
    const kesleltetve = () => setTimeout(start, 8000);
    if(document.readyState === 'complete') kesleltetve(); else addEventListener('load', kesleltetve, { once:true });
  });
})();
