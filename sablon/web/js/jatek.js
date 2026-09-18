// ============================================================
//  {{NEV}} — mintajáték a beeco-jatek-kit sablonjából: döntés-kártyák + rendszerértékek + szöveges profil a végén
//
//  A beeco játéktervezési elvei (docs/jatektervezes.md): 30 mp alatt érthető · a rendszer tanít, nem a szöveg ·
//  több szempont ütközik · rövid, újrajátszható · a végén PROFIL, nem egyetlen „zöld pontszám”.
//  Tartalom: web/data/tartalom.json (a beeco szerkeszti). Design system: ds-panel, ds-card, ds-meter, ds-btn, dsResultHTML,
//  DS.motion (mozgás), dsFeedback (hang + rezgés), artIcon (matricák). Ezt a fájlt nyugodtan írd át a saját játékodra!
// ============================================================
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const jatekEl = document.getElementById('jatek');
let T = null, allapot = null;

const tartalomKesz = fetch('data/tartalom.json', { cache:'no-cache' }).then(r => r.json()).then(d => (T = d));

// Indítás (a tools/smoke.js is ezt hívja – smoke.config.json)
async function jatekStart(){
  if(!T) await tartalomKesz;
  allapot = { i:0, ertek:Object.fromEntries(T.ertekek.map(e => [e.id, 0])), sorrend:T.kartyak.slice().sort(() => Math.random() - 0.5) };
  rajzol();
}
function kezdolap(){
  jatekEl.innerHTML = `<div class="ds-panel jtKartya ds-anim-in"><h1 class="ds-title">${esc(T ? T.cim : '')}</h1>
    <p class="ds-lead">${esc(T ? T.bevezeto : '')}</p><button class="ds-btn is-block" data-j="start">Kezdés ${pic('play')}</button></div>`;
}
function ertekekHTML(){
  return `<div class="ds-card jtErtekek">${T.ertekek.map(e => `<div class="jtErtek" title="${esc(e.nev)}">${artIcon(e.matrica)}
    <div class="ds-meter" role="img" aria-label="${esc(e.nev)}"><i style="--v:${50 + allapot.ertek[e.id]*8}%"></i></div></div>`).join('')}</div>`;
}
function rajzol(){
  const k = allapot.sorrend[allapot.i];
  if(!k){ vege(); return; }
  jatekEl.innerHTML = ertekekHTML() + `<div class="ds-panel jtKartya ds-anim-drop">${artIcon(k.matrica)}<p>${esc(k.szoveg)}</p></div>
    <div class="jtGombok"><button class="ds-btn" data-j="bal">${pic('back')} ${esc(k.bal.felirat)}</button>
      <button class="ds-btn" data-j="jobb">${esc(k.jobb.felirat)} ${pic('next')}</button></div>
    <p class="ds-muted">${allapot.i + 1}/${allapot.sorrend.length}</p>`;
}
function dont(oldal){
  const k = allapot.sorrend[allapot.i], hatas = k[oldal].hatas || {};
  for(const [id, v] of Object.entries(hatas)) allapot.ertek[id] = Math.max(-6, Math.min(6, (allapot.ertek[id] || 0) + v));
  dsFeedback('good');                                              // nincs „rossz” válasz – minden döntés hat valamire
  allapot.i++; rajzol();
  jatekEl.querySelectorAll('.ds-meter').forEach(m => DS.motion.play(m, 'pulse'));
}
// A menet vége: szöveges profil (a két legerősebben elmozdult értékből) – nem pontszám, nem „jó/rossz” pecsét
function vege(){
  const rend = Object.entries(allapot.ertek).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2);
  const profil = rend.map(([id, v]) => T.profilok[id] ? T.profilok[id][v >= 0 ? 'fel' : 'le'] : '').filter(Boolean).join(' ');
  jatekEl.innerHTML = ertekekHTML() + `<div class="ds-panel">${dsResultHTML({ mood:'good', title:'Így alakult a városod', lead:profil,
    actions:`<button class="ds-btn is-block" data-j="start">Új menet ${pic('refresh')}</button>` })}</div>`;
}
jatekEl.addEventListener('click', e => {
  const b = e.target.closest('[data-j]'); if(!b) return;
  if(b.dataset.j === 'start') jatekStart(); else dont(b.dataset.j);
});
tartalomKesz.then(kezdolap);
