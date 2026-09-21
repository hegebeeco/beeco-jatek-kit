// ============================================================
//  KIS KÖRBEFORGATÓ KAMERA (orbit) – külső könyvtár nélkül (a galéria és a vilag-bemutató használja)
//
//  const orb = beecoOrbit(THREE, camera, canvas, { target:[0, 1, 0], dist:6, az:35, el:20, auto:true });
//  a képkocka-ciklusban: orb.update(dt)
//  Egér / ujj: húzás = forgatás · görgő / két ujj = közelítés · nyilak és +/− a billentyűzeten (fókuszban a vászon).
//  Az automatikus forgás elengedés után 3 mp-cel visszajön (orb.auto = false kikapcsolja).
// ============================================================
function beecoOrbit(THREE, camera, dom, o){
  o = Object.assign({ target:[0, 1, 0], dist:6, az:35, el:20, auto:true, minDist:1, maxDist:120, minEl:-5, maxEl:85, speed:12 }, o || {});
  const target = new THREE.Vector3(...o.target), st = { az:o.az, el:o.el, dist:o.dist, idle:99 };
  const ptr = new Map(); let pinch = 0;
  const clamp = () => { st.el = Math.max(o.minEl, Math.min(o.maxEl, st.el)); st.dist = Math.max(o.minDist, Math.min(o.maxDist, st.dist)); };
  dom.style.touchAction = 'none';
  if(!dom.hasAttribute('tabindex')) dom.setAttribute('tabindex', '0');
  // holtzóna: egy ujjal csak ~10 px elmozdulás után forgat – így a koppintás (pont kiválasztása) nem billenti el a nézetet
  const start = new Map();
  dom.addEventListener('pointerdown', e => { ptr.set(e.pointerId, [e.clientX, e.clientY]); start.set(e.pointerId, [e.clientX, e.clientY, false]); dom.setPointerCapture(e.pointerId); st.idle = 0; });
  dom.addEventListener('pointermove', e => {
    if(!ptr.has(e.pointerId)) return; const [px, py] = ptr.get(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); st.idle = 0;
    const s0 = start.get(e.pointerId);
    if(s0 && !s0[2]){ if(Math.hypot(e.clientX - s0[0], e.clientY - s0[1]) < (e.pointerType === 'mouse' ? 4 : 10)) return; s0[2] = true; return; }
    if(ptr.size === 1){ const k = e.pointerType === 'mouse' ? 1 : Math.max(0.5, Math.min(1, 600 / Math.max(1, innerWidth)));   // nagy kijelzőn lassabban forog
      st.az -= (e.clientX - px) * 0.35 * k; st.el += (e.clientY - py) * 0.3 * k; }
    else if(ptr.size === 2){ const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if(pinch) st.dist *= pinch / d; pinch = d; }
    clamp();
  });
  const up = e => { ptr.delete(e.pointerId); start.delete(e.pointerId); if(ptr.size < 2) pinch = 0; };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);
  dom.addEventListener('wheel', e => { e.preventDefault(); st.dist *= Math.exp(e.deltaY * 0.0012); st.idle = 0; clamp(); }, { passive:false });
  dom.addEventListener('keydown', e => {
    const k = { ArrowLeft:[-8, 0, 1], ArrowRight:[8, 0, 1], ArrowUp:[0, 6, 1], ArrowDown:[0, -6, 1], '+':[0, 0, 0.9], '-':[0, 0, 1.1] }[e.key];
    if(!k) return; e.preventDefault(); st.az += k[0]; st.el += k[1]; st.dist *= k[2]; st.idle = 0; clamp(); });
  const api = {
    target, get auto(){ return o.auto; }, set auto(v){ o.auto = !!v; },
    set(v){ if(v.target) target.set(...v.target); for(const k of ['az', 'el', 'dist']) if(v[k] != null) st[k] = v[k];
      if(v.minDist != null) o.minDist = v.minDist; if(v.maxDist != null) o.maxDist = v.maxDist; clamp(); api.update(0); },
    update(dt){
      st.idle += dt || 0;
      if(o.auto && st.idle > 3 && !ptr.size) st.az += (dt || 0) * o.speed;
      const a = st.az * Math.PI / 180, e = st.el * Math.PI / 180;
      camera.position.set(target.x + Math.sin(a) * Math.cos(e) * st.dist, target.y + Math.sin(e) * st.dist, target.z + Math.cos(a) * Math.cos(e) * st.dist);
      camera.lookAt(target);
    },
  };
  api.update(0);
  return api;
}
if(typeof window !== 'undefined') window.beecoOrbit = beecoOrbit;
