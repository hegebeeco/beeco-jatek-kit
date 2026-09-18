// ============================================================
//  web/hatterek.html bemutató-vezérlése (NEM része a játékoknak – csak a kalauz-oldal használja)
// ============================================================
(function(){
  const $ = (s) => document.querySelector(s), H = window.beecoHatter2D;
  document.querySelectorAll('[data-pic]').forEach(e => { e.innerHTML = pic(e.dataset.pic); });
  const sw = (el, fn) => el.addEventListener('click', () => { const on = el.getAttribute('aria-checked') !== 'true'; el.setAttribute('aria-checked', String(on)); fn(on); });
  const seg = (el, fn) => el.addEventListener('click', (e) => { const b = e.target.closest('button'); if(!b) return;
    el.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b))); fn(b.dataset); });

  // a lap háttere: méhsejt-vászon
  H.mehsejt($('#pageBg'), { density:0.45, opacity:0.1, fill:0.03 });
  sw($('#rm'), (on) => document.body.classList.toggle('reduce-motion', on));

  // 1. város + jövő-mérő
  let vSeed = 2075;
  const city = H.varosJovo($('#vStage'), { seed:vSeed, value:0 }), mix = $('#vMix');
  const setMix = (v) => { mix.value = v; city.set(v / 100);
    $('#vSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String((v >= 50) === (b.dataset.v === '1')))); };
  mix.addEventListener('input', () => setMix(+mix.value));
  seg($('#vSeg'), (d) => setMix(d.v === '1' ? 100 : 0));
  $('#vNew').addEventListener('click', () => city.redraw({ seed:++vSeed }));
  window.demoVaros = city;

  // 2. konyha
  let kSeed = 7; const kitchen = H.konyha($('#kCanvas'), { seed:kSeed });
  sw($('#kFridge'), (on) => kitchen.redraw({ fridge:on }));
  sw($('#kLamp'), (on) => kitchen.redraw({ lamp:on }));
  $('#kNew').addEventListener('click', () => kitchen.redraw({ seed:++kSeed }));

  // 3. kert
  let gSeed = 3; const garden = H.kert($('#gCanvas'), { seed:gSeed });
  sw($('#gHive'), (on) => garden.redraw({ hive:on }));
  $('#gBees').addEventListener('input', (e) => garden.redraw({ bees:+e.target.value }));
  $('#gNew').addEventListener('click', () => garden.redraw({ seed:++gSeed }));

  // 4. méhsejt: vászon + CSS ugyanazokkal a beállításokkal
  const mo = { density:0.5, opacity:0.12, fill:0.06, color:'honey-deep' };
  const comb = H.mehsejt($('#mCanvas'), mo);
  const upd = () => { comb.redraw(mo); const css = H.mehsejtCSS({ density:mo.density, opacity:mo.opacity, color:mo.color });
    $('#mCss').style.background = css; $('#mCode').textContent = 'background: ' + css.slice(0, 180) + '…'; };
  $('#mDen').addEventListener('input', (e) => { mo.density = e.target.value / 100; upd(); });
  $('#mOp').addEventListener('input', (e) => { mo.opacity = e.target.value / 100; upd(); });
  $('#mFill').addEventListener('input', (e) => { mo.fill = e.target.value / 100; upd(); });
  seg($('#mSeg'), (d) => { mo.color = d.c; upd(); });
  upd();

  // 5. áramlás – SVG
  DS_FLOW.along($('#p1'), { color:'honey', dots:4, both:true });
  DS_FLOW.along($('#p2'), { color:'sky', dots:5, speed:70 });
  DS_FLOW.along($('#p3'), { color:'ember', dots:3, speed:90 });
  DS_FLOW.along($('#p4'), { color:'honey', dots:3, reverse:true, size:7 });
  // pontok összekötése beporzókkal (a mechanika opcionális áramlása)
  const NODES = [{ id:'r1', x:12, y:14, type:'ret' }, { id:'r2', x:40, y:44, type:'ret' }, { id:'k', x:52, y:18, type:'kaptar' },
    { id:'v', x:84, y:40, type:'viz' }, { id:'n', x:86, y:12, type:'nap' }];
  const mv = MechVonal.mount($('#mvDemo'), { nodes:NODES, size:[100, 60], maxDist:45, flow:true,
    types:{ ret:{ label:'Rét', icon:'leaf' }, kaptar:{ label:'Kaptár', icon:'bee' }, viz:{ label:'Kút', icon:'drop' }, nap:{ label:'Napelem', icon:'sun' } } });
  [['r1', 'k'], ['r2', 'k'], ['r1', 'r2'], ['k', 'n'], ['k', 'v'], ['n', 'v']].forEach(([a, b]) => mv.graph.connect(a, b));
  mv.refresh();
  window.demoVonal = mv;

  // 5/b. áramlás – vászon: egy kanyargós cső, a játék rajzolja
  const fc = $('#fCanvas'); let pts = [], W = 0, Hh = 0;
  const fctx = fc.getContext('2d');
  function sizeCanvas(){ const r = fc.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; Hh = r.height; fc.width = W * dpr; fc.height = Hh * dpr; fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = Array.from({ length:13 }, (_, i) => [W * (0.05 + i * 0.075), Hh * (0.5 + 0.3 * Math.sin(i * 0.9))]); }
  sizeCanvas();
  const pipe = () => { const M = ART.MAT; fctx.fillStyle = M.sage[0]; fctx.fillRect(0, 0, W, Hh);
    fctx.lineCap = fctx.lineJoin = 'round';
    for(const [w, c] of [[16, DS.color.olive], [11, M.sky[0]]]){ fctx.lineWidth = w; fctx.strokeStyle = c; fctx.beginPath(); pts.forEach((p, i) => i ? fctx.lineTo(...p) : fctx.moveTo(...p)); fctx.stroke(); } };
  let flow = DS_FLOW.canvas(fctx, pts, { auto:true, before:pipe, color:'sky', dots:7, speed:90, size:8 });
  new ResizeObserver(() => { sizeCanvas(); flow.stop(); flow = DS_FLOW.canvas(fctx, pts, { auto:true, before:pipe, color:'sky', dots:7, speed:90, size:8 }); }).observe(fc);
})();
