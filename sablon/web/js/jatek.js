// ============================================================
//  {{NEV}} — mintajáték a beeco-jatek-kit sablonjából: döntés-kártyák + rendszerértékek + szöveges profil a végén
//
//  A beeco játéktervezési elvei (docs/jatektervezes.md): 30 mp alatt érthető · a rendszer tanít, nem a szöveg ·
//  több szempont ütközik · rövid, újrajátszható · a végén PROFIL, nem egyetlen „zöld pontszám”.
//  Tartalom: web/data/tartalom.json (a beeco szerkeszti). Közös keret: keretEredmeny, keretBeallitasok, beecoBridge, beecoProfil,
//  beecoHang, keretKioszk (docs/keret.md). Design system: ds-panel, ds-card, ds-meter, ds-btn, dsResultHTML,
//  DS.motion (mozgás), dsFeedback (hang + rezgés), artIcon (matricák). Ezt a fájlt nyugodtan írd át a saját játékodra!
// ============================================================
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const jatekEl = document.getElementById('jatek');
let T = null, allapot = null;

const tartalomKesz = fetch('data/tartalom.json', { cache:'no-cache' }).then(r => r.json()).then(d => (T = d));
const JATEK_ID = '{{AZONOSITO}}';
// a közös keret bekötése: azonosító a kifelé menő csatornának és a közös profilnak (album, napi küldetés, jelvények)
beecoBridge.jatek(JATEK_ID);
beecoProfil.jatek({ id:JATEK_ID, nev:'{{NEV}}', ikon:'lombfa', kuldetesek:[{ id:JATEK_ID + '_5', cel:5, szoveg:'Hozz 5 döntést a(z) {{NEV}} játékban' }] });

// Indítás (a tools/smoke.js is ezt hívja – smoke.config.json)
async function jatekStart(){
  if(!T) await tartalomKesz;
  keretEredmeny.elrejt(); beecoHang.zeneStart(); beecoBridge.meres('start');
  allapot = { i:0, utolso:{}, ertek:Object.fromEntries(T.ertekek.map(e => [e.id, 0])), sorrend:T.kartyak.slice().sort(() => Math.random() - 0.5) };
  rajzol();
}
function kezdolap(){
  jatekEl.innerHTML = `<div class="ds-panel jtKartya ds-anim-in"><h1 class="ds-title">${esc(T ? T.cim : '')}</h1>
    <p class="ds-lead">${esc(T ? T.bevezeto : '')}</p><button class="ds-btn is-block" data-j="start">Kezdés ${pic('play')}</button></div>`;
}
// jelzőcsíkok a legutóbbi változással (ds-ext: dsMeterHTML – „szellem” szakasz + ↑/↓ jelzés); érték −6…+6 → 0…1
const ertek01 = v => 0.5 + v/12;
function ertekekHTML(){
  return `<div class="ds-card jtErtekek">${T.ertekek.map(e => dsMeterHTML({ label:e.nev, icon:e.matrica, value01:ertek01(allapot.ertek[e.id]),
    delta:(allapot.utolso[e.id] || 0)/12, deltaValue:allapot.utolso[e.id] || null })).join('')}</div>`;   // változás nélkül nincs jelzés
}
function rajzol(){
  const k = allapot.sorrend[allapot.i];
  if(!k){ vege(); return; }
  jatekEl.innerHTML = ertekekHTML() + `<div class="ds-panel jtKartya ds-anim-drop">${artIcon(k.matrica)}<p>${esc(k.szoveg)}</p></div>
    <div class="jtGombok"><button class="ds-btn" data-j="bal">${pic('back')} ${esc(k.bal.felirat)}</button>
      <button class="ds-btn" data-j="jobb">${esc(k.jobb.felirat)} ${pic('next')}</button></div>
    <p class="ds-muted">${allapot.i + 1}/${allapot.sorrend.length}</p>`;
  // első alkalommal a tanító megmutatja, mit kell csinálni (egyszer, eszközönként)
  if(allapot.i === 0) setTimeout(() => DS.coach.show(jatekEl.querySelector('.jtGombok'), { key:JATEK_ID + '_elso', text:'Válassz a két lehetőség közül – figyeld, mi változik a csíkokon!' }), 400);
}
function dont(oldal){
  const k = allapot.sorrend[allapot.i], hatas = k[oldal].hatas || {};
  allapot.utolso = {};
  for(const [id, v] of Object.entries(hatas)){ const elotte = allapot.ertek[id] || 0; allapot.ertek[id] = Math.max(-6, Math.min(6, elotte + v)); allapot.utolso[id] = allapot.ertek[id] - elotte; }
  dsFeedback('good');                                              // nincs „rossz” válasz – minden döntés hat valamire
  beecoProfil.gyujt(JATEK_ID, k.id + '_' + oldal, k[oldal].felirat, k.matrica);   // a döntés matricája az albumba
  allapot.i++; rajzol();
  // mi változott? felugró változásjelzők a csíkok fölött („+2 Természet ↑”)
  const d = T.ertekek.filter(e => allapot.utolso[e.id]).map(e => ({ label:e.nev, value:allapot.utolso[e.id] }));
  if(d.length) DS.delta.show(jatekEl.querySelector('.jtErtekek'), d);
}
// A menet vége: szöveges profil (a két legerősebben elmozdult értékből) – nem pontszám, nem „jó/rossz” pecsét
function vege(){
  const rend = Object.entries(allapot.ertek).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2);
  const profil = rend.map(([id, v]) => T.profilok[id] ? T.profilok[id][v >= 0 ? 'fel' : 'le'] : '').filter(Boolean).join(' ');
  jatekEl.innerHTML = ertekekHTML();
  keretEredmeny.mutat({ mood:'good', title:'Így alakult a városod', lead:profil, ujraFelirat:'Új menet', ujra:jatekStart,
    more:[{ icon:'chart', title:'A városod profilja', html:dsProfileHTML({ title:'A városod', mode:'radar',
      values:T.ertekek.map(e => ({ label:e.nev, icon:e.matrica, value01:ertek01(allapot.ertek[e.id]) })) }) }],
    kilep:() => (keretKioszk.aktiv ? keretKioszk.kezdolap() : kezdolap()) });
}
jatekEl.addEventListener('click', e => {
  const b = e.target.closest('[data-j]'); if(!b) return;
  if(b.dataset.j === 'start') jatekStart(); else dont(b.dataset.j);
});
// kioszk-mód (?kioszk=1): kezdőképernyő, tétlenségi alaphelyzet, képernyővédő, QR – különben a sima kezdőlap
tartalomKesz.then(() => {
  kezdolap();
  keretKioszk.indit({ cim:T.cim, alcim:T.bevezeto, kep:'assets/brand/roles/kacsint.webp',
    kartyak:[{ id:'start', cim:'Indulhat a játék', alcim:T.bevezeto, ikon:'lombfa', kiemelt:true, cimke:'Rövid' }],
    inditas:() => jatekStart(), alaphelyzet:() => { keretEredmeny.elrejt(); kezdolap(); } });
});
// beállítások (fogaskerék): hang, zene, rezgés, kevesebb mozgás, vezérlés
{ const g = document.getElementById('beallGomb'), p = document.getElementById('beallPanel'), sorok = p.querySelector('.jtBeallSorok');
  g.innerHTML = pic('gear'); p.querySelector('.jtBeallX').innerHTML = pic('close');
  keretBeallitasok.bekot(sorok);
  g.addEventListener('click', () => { sorok.innerHTML = keretBeallitasok.panelHTML(); p.classList.remove('hidden'); });
  p.addEventListener('click', e => { if(e.target === p || e.target.closest('[data-ds-close]')) p.classList.add('hidden'); }); }
