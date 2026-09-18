// ============================================================
//  KÖZÖS JÁTÉKOSPROFIL („beeco playground”) — matrica-album, napi küldetés sorozattal, jelvények, MINDEN beeco játékon át
//
//  A mentés formátuma azonos a beeco-szelektalj gyujtes.js-ével (beeco_album, beeco_napi, beeco_jelveny), így ha a játékok
//  ugyanazon a címen futnak (a központ alútvonalain – docs/kozos-profil.md), egy albumba gyűjtenek.
//  Egy játék így kapcsolódik:
//    beecoProfil.jatek({ id:'polgarmester', nev:'Polgármester egy napra', ikon:'haz_kert', kuldetesek:[{ id:'pm8', cel:8, szoveg:'Hozz 8 döntést…' }] });
//    beecoProfil.gyujt('polgarmester', 'kartya_fak', 'Fák a főtéren', 'lombfa');   // jó / fontos döntés → matrica az albumba
//    beecoProfil.kor({ stars:2 });                                                 // kör vége (a keretEredmeny.mutat magától hívja)
//  Adat: beecoProfil.album(), .napi(), .maiKuldetesek(), .jelvenyek(). Értesítés: a játék saját toast()-ja, ha van.
// ============================================================
const beecoProfil = (function(){
  const load = k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } };
  const save = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const day = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const say = (html, ok) => { if(typeof toast === 'function') toast(html, ok, 2600); };
  // az ismert játékok (a beeco-szelektalj hat játéka) + amit az új játékok regisztrálnak (ez is mentődik, hogy a központ lássa)
  const JATEKOK = Object.assign({
    szelektalj:{ nev:'Szelektálj!', ikon:'szelektiv_kukak', kuldetesek:[{ id:'sz10', cel:10, szoveg:'Dobj jó kukába 10 hulladékot' }] },
    huto:{ nev:'Hűtő-mester', ikon:'hutogep', kuldetesek:[{ id:'hu8', cel:8, szoveg:'Pakolj jó helyre 8 ételt a Hűtő-mesterben' }] },
    gw:{ nev:'Greenwashing-vadász', ikon:'nagyito', kuldetesek:[{ id:'gw6', cel:6, szoveg:'Ítélj helyesen 6 kártyát a Greenwashing-vadászban' }] },
    impact:{ nev:'Mi van mögötte?', ikon:'cimke', kuldetesek:[{ id:'im8', cel:8, szoveg:'Párosíts jól 8 hatás-címkét' }] },
    jovo:{ nev:'2075', ikon:'szelturbina', kuldetesek:[{ id:'jv15', cel:15, szoveg:'Dönts jól 15 repülő matricánál a 2075-ben' }] },
    rezsi:{ nev:'Ökos-rejtély', ikon:'villanyora', kuldetesek:[{ id:'rz3', cel:3, szoveg:'Állíts 3 készüléket takarékosra az Ökos-rejtélyben' }] },
  }, load('beeco_jatekok') || {});
  const KOZOS = [{ id:'kor2', ev:'round', cel:2, szoveg:'Fejezz be 2 kört bármelyik játékban' },
    { id:'csillag3', ev:'stars3', cel:1, szoveg:'Szerezz 3 csillagot egy körben' }, { id:'uj5', ev:'new', cel:5, szoveg:'Ragassz be 5 új matricát az albumodba' }];
  let aktualis = null;

  const album = () => load('beeco_album') || { items:{}, good:{}, rounds:{} };
  const osszes = () => KOZOS.concat(...Object.entries(JATEKOK).map(([g, j]) => (j.kuldetesek || []).map(m => Object.assign({ g }, m))));
  function maiKuldetesek(){
    let h = 2166136261; for(const c of day()) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    const pool = osszes(), out = [];
    while(out.length < 3 && pool.length){ h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); }
    return out.map(m => ({ id:m.id, g:m.g, ev:m.ev, goal:m.cel, text:tr(m.szoveg) }));
  }
  function napi(){
    const s = load('beeco_napi') || { day:null, prog:{}, streak:0, lastFull:null, full:false };
    if(s.day !== day()){ s.day = day(); s.prog = {}; s.full = false; }
    const y = new Date(); y.setDate(y.getDate() - 1);
    if(s.lastFull && s.lastFull !== day() && s.lastFull !== day(y)) s.streak = 0;
    return s;
  }
  function jelvenyek(){
    const a = album(), n = napi(), db = Object.keys(a.items).length;
    const J = [['elso', 'erem', 'Első kör', () => Object.keys(a.rounds).length > 0], ['harom', 'kituntetes', 'Háromcsillagos', () => !!a.three],
      ['album10', 'fuzet', 'Gyűjtő', () => db >= 10], ['album30', 'fuzet', 'Nagy gyűjtő', () => db >= 30], ['album75', 'fuzet', 'Albummester', () => db >= 75],
      ['kuldetes', 'naptar', 'Küldetés teljesítve', () => !!n.lastFull], ['sorozat3', 'tuz', '3 napos sorozat', () => n.streak >= 3], ['sorozat7', 'tuz', 'Hetes sorozat', () => n.streak >= 7]]
      .concat(Object.entries(JATEKOK).map(([g, j]) => ['mester_' + g, j.ikon, tr('{nev}-mester', { nev:tr(j.nev) }), () => (a.good[g] || 0) >= 30]));
    return J.map(([id, art, name, f]) => ({ id, art, name:tr(name), got:f() }));
  }
  function esemeny(type, game){
    const s = napi(), ms = maiKuldetesek(), elotte = ms.map(m => (s.prog[m.id] || 0) >= m.goal);
    for(const m of ms) if(m.g ? (type === 'good' && game === m.g) : m.ev === type) s.prog[m.id] = Math.min(m.goal, (s.prog[m.id] || 0) + 1);
    ms.forEach((m, i) => { if((s.prog[m.id] || 0) >= m.goal && !elotte[i]) say(`${pic('check')} ${tr('Napi küldetés kész: {t}', { t:m.text })}`, true); });
    if(ms.every(m => (s.prog[m.id] || 0) >= m.goal) && !s.full){ s.full = true; s.streak = s.lastFull === day() ? s.streak : s.streak + 1; s.lastFull = day();
      setTimeout(() => say(`${pic('flame')} ${tr('Mindhárom napi küldetés kész! Sorozat: {n} nap', { n:s.streak })}`, true), 900); }
    save('beeco_napi', s);
    const latott = load('beeco_jelveny') || {};
    for(const b of jelvenyek()) if(b.got && !latott[b.id]){ latott[b.id] = Date.now(); setTimeout(() => say(`${pic('medal')} ${tr('Új jelvény: {nev}', { nev:b.name })}`, true), 1400); }
    save('beeco_jelveny', latott);
  }
  return {
    jatek(j){ aktualis = j.id; JATEKOK[j.id] = { nev:j.nev, ikon:j.ikon, kuldetesek:j.kuldetesek || [] };
      const reg = load('beeco_jatekok') || {}; reg[j.id] = JATEKOK[j.id]; save('beeco_jatekok', reg); },
    gyujt(game, id, name, art, img){
      if(!id) return; const a = album(), key = game + ':' + id, uj = !a.items[key];
      a.items[key] = Object.assign(a.items[key] || { game, name, art:art || null, img:img || null, t:Date.now(), n:0 }, { name });
      a.items[key].n++; a.good[game] = (a.good[game] || 0) + 1; save('beeco_album', a);
      esemeny('good', game); if(uj) esemeny('new', game);
    },
    kor(o){ const g = (o && o.game) || aktualis || 'jatek', a = album(); a.rounds[g] = (a.rounds[g] || 0) + 1; if(o && o.stars >= 3) a.three = true;
      save('beeco_album', a); esemeny('round', g); if(o && o.stars >= 3) esemeny('stars3', g); },
    album, napi, maiKuldetesek, jelvenyek, jatekok:() => JATEKOK,
  };
})();
