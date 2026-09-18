// ============================================================
//  A mechanikak.html bemutató mintái. SEMLEGES minta-adatok: a számok absztrakt játékértékek, nem tények
//  (beeco-szabály: konkrét szám csak forrással). Egy valódi játék a tartalmát JSON-ból tölti.
// ============================================================
(function(){
  const $ = (s) => document.querySelector(s);
  document.querySelectorAll('[data-pic]').forEach(el => { el.outerHTML = pic(el.dataset.pic); });
  // „Kevesebb mozgás” kapcsoló (a játékokban a Beállítások teszi ki a body.reduce-motion osztályt)
  $('#rm').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-checked') !== 'true';
    e.currentTarget.setAttribute('aria-checked', String(on)); document.body.classList.toggle('reduce-motion', on);
  });

  // ---- 1. Döntéskártya: kis város, 4 rendszerérték, két késleltetett következmény ----
  const VALS = [{ id:'zold', icon:'leaf', label:'Zöld' }, { id:'penz', icon:'coin', label:'Kassza' },
    { id:'kedv', icon:'heart', label:'Hangulat' }, { id:'ido', icon:'timer', label:'Idő' }];
  const CARDS = () => [
    { icon:'🌳', text:'Ültessünk fasort a főutcára?', left:{ fx:{ penz:1 } },
      right:{ fx:{ zold:2, penz:-1 }, then:{ after:2, card:{ icon:'🌳', note:'Két döntéssel korábban…', text:'A fasor mellé padokat kérnek a lakók.',
        left:{ fx:{ kedv:-1 } }, right:{ fx:{ kedv:2, penz:-1 } } } } } },
    { icon:'🚲', text:'Legyen kerékpársáv a hídon?', left:{ fx:{ ido:1 } }, right:{ fx:{ zold:1, ido:-1 } } },
    { icon:'🛒', text:'Szombati termelői piac a téren?', left:{ fx:{} },
      right:{ fx:{ kedv:1, penz:1 }, then:{ after:1, card:{ icon:'🛒', note:'A piac folytatása', text:'Bővítsük a piacot vasárnapra is?',
        left:{ fx:{ ido:1 } }, right:{ fx:{ kedv:1, ido:-2 } } } } } },
    { icon:'💡', text:'Cseréljük le a régi utcai lámpákat?', left:{ fx:{ penz:1 } }, right:{ fx:{ zold:1, penz:-2 } } },
    { icon:'🚗', text:'Több parkolóhely a belvárosba?', left:{ fx:{ zold:1, kedv:-1 } }, right:{ fx:{ zold:-2, kedv:1 } } },
    { icon:'🗑', text:'Új szelektív gyűjtők a parkba?', left:{ fx:{ penz:1 } }, right:{ fx:{ zold:1, penz:-1, kedv:1 } } },
  ];
  let val = {};
  const paint = () => { $('#kVals').innerHTML = VALS.map(v => `<div title="${v.label}">${pic(v.icon)}
    <div class="ds-meter" role="meter" aria-label="${v.label}" aria-valuemin="-6" aria-valuemax="6" aria-valuenow="${val[v.id]}"><i style="--v:${50 + val[v.id] * 8}%"></i></div></div>`).join(''); };
  function startKartya(){
    val = { zold:0, penz:0, kedv:0, ido:0 }; paint(); $('#kAgain').hidden = true;
    window.demoKartya = MechKartya.mount($('#kDemo'), {
      cards:CARDS(), labels:{ left:'Nem', right:'Igen' },
      render:(c) => `<span class="card-art">${artIcon(c.icon)}</span>${c.note ? `<p class="card-note">${c.note}</p>` : ''}<p class="card-text">${c.text}</p>`,
      onDecide:(side, c) => {
        for(const [k, d] of Object.entries((c[side] || {}).fx || {})) val[k] = Math.max(-6, Math.min(6, val[k] + d));
        paint(); if(typeof dsSound === 'function') dsSound('tap');
      },
      onEnd:() => { $('#kAgain').hidden = false; },
    });
  }
  $('#kAgain').addEventListener('click', () => { window.demoKartya.destroy(); startKartya(); });
  startKartya();

  // ---- 2. Rács: kert 6 × 5 mezőn, 4 érték (absztrakt pontok) ----
  window.demoRacs = MechRacs.mount($('#rDemo'), {
    w:6, h:5,
    tiles:[{ type:'fa', label:'Fa', icon:'🌳' }, { type:'virag', label:'Virágos', icon:'🌼' }, { type:'to', label:'Tavacska', icon:'💧' },
      { type:'pad', label:'Pad', icon:'🪑' }, { type:'burkolat', label:'Burkolat', icon:'🧱' }],
    values:[{ id:'elohely', label:'Élőhely', icon:'leaf', min:-5, max:25 }, { id:'viz', label:'Víz', icon:'drop', min:-10, max:15 },
      { id:'ho', label:'Hűvös', icon:'thermo', min:-15, max:20 }, { id:'haszn', label:'Használható', icon:'people', min:0, max:20 }],
    rules:{ values:['elohely', 'viz', 'ho', 'haszn'], tiles:{
      fa:{ base:{ elohely:2 }, aura:{ radius:1, add:{ ho:1 } }, near:[{ type:'virag', add:{ elohely:1 }, max:2 }] },
      virag:{ base:{ elohely:1 }, near:[{ type:['fa', 'to'], add:{ elohely:1 }, max:2 }, { type:'burkolat', add:{ elohely:-1 } }] },
      to:{ base:{ viz:3, elohely:1 }, aura:{ radius:1, add:{ ho:1 } } },
      pad:{ base:{ haszn:1 }, near:[{ type:'fa', add:{ haszn:2 }, max:1 }, { type:'burkolat', add:{ haszn:1 }, max:1 }] },
      burkolat:{ base:{ haszn:2, viz:-1 }, aura:{ radius:1, add:{ ho:-1 } } },
    } },
  });

  // ---- 3. Összekötés: 10 élőhely-folt, korlátozott kapcsolatszám ----
  const NODES = [
    { id:'r1', x:10, y:12, type:'ret' }, { id:'f1', x:30, y:8, type:'fa' }, { id:'k1', x:22, y:30, type:'kert' }, { id:'r2', x:46, y:24, type:'ret' },
    { id:'n1', x:62, y:10, type:'sav' }, { id:'f2', x:80, y:18, type:'fa' }, { id:'k2', x:70, y:38, type:'kert' }, { id:'r3', x:90, y:48, type:'ret' },
    { id:'n2', x:40, y:48, type:'sav' }, { id:'k3', x:18, y:50, type:'kert' },
  ];
  const TYPES = { ret:{ label:'Rét', icon:'🌼' }, fa:{ label:'Fa', icon:'🌳' }, kert:{ label:'Kert', icon:'🪴' }, sav:{ label:'Virágsáv', icon:'🌻' } };
  const startVonal = () => { window.demoVonal = MechVonal.mount($('#vDemo'), { nodes:NODES, types:TYPES, size:[100, 60], maxDist:26, maxLinks:11, maxDegree:4 }); };
  startVonal();
  $('#vZavar').addEventListener('click', () => {
    const v = window.demoVonal, m = v.graph.metrics();
    const pool = m.critical.length ? m.critical : v.graph.nodes().map(n => n.id);     // a bemutatóban a kritikus pont esik ki, hogy látszódjon a hatása
    if(pool.length) v.remove(pool[Math.floor(Math.random() * pool.length)]);
  });
  $('#vUjra').addEventListener('click', () => { window.demoVonal.destroy(); startVonal(); });

  // ---- 4. Kombinálás: konyha 8 hellyel, frissesség-lépcsők (absztrakt) ----
  window.demoKombinal = MechKombinal.mount($('#cDemo'), {
    slots:8, turnLabel:'Következő nap',
    items:{ repa:{ label:'Répa', icon:'🥕', fresh:4, spoilsTo:'komposzt' }, krumpli:{ label:'Krumpli', icon:'🥔', fresh:5, spoilsTo:'komposzt' },
      kenyer:{ label:'Kenyér', icon:'🍞', fresh:3, spoilsTo:'komposzt' }, tojas:{ label:'Tojás', icon:'🥚', fresh:4 },
      tej:{ label:'Tej', icon:'🥛', fresh:3 }, banan:{ label:'Banán', icon:'🍌', fresh:3, spoilsTo:'komposzt' },
      leves:{ label:'Leves', icon:'🍲', fresh:3 }, bundas:{ label:'Bundás kenyér', icon:'🍳', fresh:2 }, turmix:{ label:'Turmix', icon:'🥤', fresh:2 },
      komposzt:{ label:'Komposzt', icon:'🪱' } },
    recipes:[{ a:'repa', b:'krumpli', out:'leves', time:2 }, { a:'kenyer', b:'tojas', out:'bundas', time:1 }, { a:'banan', b:'tej', out:'turmix', time:0 }],
    start:['repa', 'krumpli', 'kenyer', 'tojas', 'banan'],
    supply:['repa', 'krumpli', 'kenyer', 'tojas', 'tej', 'banan'],
  });
})();
