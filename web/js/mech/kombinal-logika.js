// ============================================================
//  MECHANIKA 4 – KOMBINÁLÁS IDŐZÍTŐVEL: a logika (Ételmentő, Körforgó háztartás)
//
//  Egy tábla korlátozott HELLYEL (slots). Két tárgyat egymásra húzva, ha van rá RECEPT, új tárgy lesz belőle –
//  azonnal, vagy t KÖR múlva (addig egy „folyamatban” lapka foglal egy helyet). Minden kör (tick) végén
//  a romlandó tárgyak frissessége egy lépcsővel csökken; 0-nál megromlanak (spoilsTo) vagy eltűnnek.
//  A lépcsők és körök absztrakt játékértékek, nem valódi eltarthatósági adatok.
//
//  create({ slots:8,
//    items:{ alma:{ label:'Alma', fresh:4, spoilsTo:'maradek' }, … },   – fresh: hány lépcső (nincs = nem romlik)
//    recipes:[{ id:'lekvar', a:'alma', b:'cukor', out:'lekvar', time:2 }, …],
//    start:['alma', 'cukor'] })
//  Tiszta logika → tests/check-mech.js. Böngészőben: MechKombinal.create · Node-ban: require(…).create
// ============================================================
(function(root){
  function create(o = {}){
    const defs = o.items || {}, slots = o.slots || 8;
    const recipes = (o.recipes || []).map(r => Object.assign({ time:0 }, r, { id:r.id || r.a + '+' + r.b }));
    const items = [], found = new Set();
    let uid = 0, turn = 0;
    const make = (type, extra = {}) => {
      const d = defs[type] || {};
      return Object.assign({ uid:++uid, type, fresh:d.fresh ?? null, maxFresh:d.fresh ?? null }, extra);
    };
    const byUid = (u) => items.find(i => i.uid === u) || null;

    const b = {
      slots, turn:() => turn,
      list:() => items.map(i => Object.assign({}, i)),
      get:(u) => { const i = byUid(u); return i ? Object.assign({}, i) : null; },
      free:() => slots - items.length,
      // új tárgy a táblára (null, ha nincs hely)
      add(type, extra = {}){ if(items.length >= slots) return null; const it = make(type, extra); items.push(it); return Object.assign({}, it); },
      take(u){ const k = items.findIndex(i => i.uid === u); return k < 0 ? null : items.splice(k, 1)[0]; },
      // recept keresése két típushoz (a sorrend mindegy)
      recipeFor:(ta, tb) => recipes.find(r => (r.a === ta && r.b === tb) || (r.a === tb && r.b === ta)) || null,
      // A-t rádobod B-re → { ok, reason, recipe, item }   reason: ugyanaz · nincs · folyamatban · nincs-recept
      combine(ua, ub){
        if(ua === ub) return { ok:false, reason:'ugyanaz' };
        const A = byUid(ua), B = byUid(ub);
        if(!A || !B) return { ok:false, reason:'nincs' };
        if(A.process || B.process) return { ok:false, reason:'folyamatban' };
        const r = b.recipeFor(A.type, B.type);
        if(!r) return { ok:false, reason:'nincs-recept' };
        const isNew = !found.has(r.id); found.add(r.id);
        const out = r.time > 0
          ? make('@folyamat', { process:true, out:r.out, left:r.time, total:r.time, recipe:r.id, fresh:null, maxFresh:null })
          : make(r.out);
        items.splice(items.indexOf(B), 1, out);                 // az eredmény oda kerül, ahová dobtad
        items.splice(items.indexOf(A), 1);
        return { ok:true, reason:null, recipe:r, item:Object.assign({}, out), discovered:isNew };
      },
      // egy kör: 1) a folyamatok haladnak (0-nál kész), 2) a romlandók frissessége csökken
      tick(){
        turn++;
        const events = [], born = new Set();
        for(let k = 0; k < items.length; k++){
          const it = items[k]; if(!it.process) continue;
          it.left--;
          if(it.left <= 0){ const done = make(it.out); items[k] = done; born.add(done.uid); events.push({ kind:'kesz', item:Object.assign({}, done), recipe:it.recipe }); }
        }
        for(let k = items.length - 1; k >= 0; k--){
          const it = items[k]; if(it.process || it.fresh == null || born.has(it.uid)) continue;
          it.fresh--;
          if(it.fresh > 0){ events.push({ kind:'romlik', item:Object.assign({}, it) }); continue; }
          const to = (defs[it.type] || {}).spoilsTo;
          if(to){ items[k] = make(to); events.push({ kind:'romlott', item:Object.assign({}, it), to:Object.assign({}, items[k]) }); }
          else { items.splice(k, 1); events.push({ kind:'romlott', item:Object.assign({}, it), to:null }); }
        }
        return { turn, events };
      },
      discovered:() => [...found],
      book:() => recipes.map(r => Object.assign({}, r, { found:found.has(r.id) })),
      label:(type) => (defs[type] || {}).label || type,
    };
    for(const t of o.start || []) b.add(t);
    return b;
  }

  const api = { create };
  if(typeof module !== 'undefined' && module.exports){ module.exports = api; return; }
  root.MechKombinal = Object.assign(root.MechKombinal || {}, api);
})(typeof window !== 'undefined' ? window : globalThis);
