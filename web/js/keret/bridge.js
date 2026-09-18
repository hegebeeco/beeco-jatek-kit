// ============================================================
//  KERET – kifelé menő csatorna (a befogadó weboldal vagy a beeco app felé) + névtelen mérés
//
//  Egy helyen minden, ami a játékból kimegy (beeco szabály): iframe esetén window.parent.postMessage, a Flutter appban a
//  BeecoBridge JS-csatorna. A játék soha nem hív beeco API-t, és nem kezel tokent vagy jelszót.
//  beecoBridge.eredmeny({ score, correct, tries, level, ... })  → { type:'beeco-jatek', game, event:'runEnd', ... }
//  beecoBridge.meres('start' | 'end' | 'quit', { seconds, stars })  → { type:'beeco-meres', ... } (név, azonosító nélkül)
//  A befogadó eredete (origin) beállítható: beecoBridge.origin = 'https://beeco.hu' (alap: '*').
//  Specifikáció a befogadónak (Bence): docs/keret.md.
// ============================================================
const beecoBridge = (function(){
  let game = 'jatek', t0 = null;
  function post(payload){
    try{ if(window.parent && window.parent !== window) window.parent.postMessage(payload, api.origin || '*'); }catch(e){}
    try{ if(window.BeecoBridge && window.BeecoBridge.postMessage) window.BeecoBridge.postMessage(JSON.stringify(payload)); }catch(e){}
  }
  const api = {
    origin:null,
    jatek(id){ game = id; },                                         // a játék azonosítója (pl. 'polgarmester')
    eredmeny(o, event){ post(Object.assign({ type:'beeco-jatek', game, event:event || 'runEnd' }, o || {})); },
    meres(event, extra){
      if(event === 'start') t0 = performance.now();
      const seconds = t0 != null ? Math.round((performance.now() - t0)/1000) : undefined;
      post(Object.assign({ type:'beeco-meres', event, game }, event === 'start' ? {} : { seconds }, extra || {}));
      if(event !== 'start') t0 = null;
    },
    fut(){ return t0 != null; },
  };
  return api;
})();
