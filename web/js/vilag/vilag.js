// ============================================================
//  beeco VILÁG – önálló, paraméterezhető 3D háttér bármelyik Three.js-játékhoz (a Szelektálj! C szintű hátterének kit-változata)
//
//  Betöltés (sorrendben): three.min.js (r128) · js/ds.js · js/art/art.js · js/art/model-kit.js ·
//    js/vilag/vilag-modellek.js · js/vilag/vilag-fold.js · js/vilag/vilag.js  (+ ha a rétre almafa kell: js/3d/szelektalj-modellek.js)
//
//  const V = beecoVilag(THREE, scene, { island:true, meadow:true });      // minden opció elhagyható
//  a képkocka-ciklusban: V.tick(dt, camera);   minőség: V.setQuality('B'|'C');   napszak: V.setTime('nap'|'alkony'|'este');   V.dispose()
//
//  Opciók: quality 'auto' (C + minőség-őr) | 'B' | 'C' · onQuality(q, fps) · sky · sun · clouds (db) · islands (lebegő szigetek) · birds ·
//    ground (füves sík; alapból akkor, ha nincs sziget) · groundSize · island (true | { R, x, z }) · meadow (true | { inner, outer, trees,
//    bushes, tufts, flowers, free(x,z) }) · lights (napfény + égbolt-fény a DS.light.outdoor szerint) · shadowBox · fog · time · seed · skyR
//  Szintek (docs/rajzolas.md 4.): B = ég, nap, felhők, 3 lebegő sziget, talaj, fák · C = B + madarak, szélkerék, házikó, még 2 sziget,
//    nap-udvar, 3D fűszálak, kövek, virágok. Minőség-őr: 2 mp bemelegedés után 5 mp-ig mér, 40 kép/mp alatt B-re vált.
//  Színek: DS.world, DS.light, ART.MAT – nincs saját nyers szín.
// ============================================================
function beecoVilag(THREE, scene, opts){
  const M = ART.MAT, W = DS.world, L = DS.light.outdoor, K = MODEL, VM = VILAG_MODELS;
  const o = Object.assign({ quality:'auto', sky:true, sun:true, clouds:14, islands:true, birds:true, lights:true, fog:true,
    time:'nap', seed:1, skyR:90, groundSize:260, shadowBox:14, island:false, meadow:false }, opts || {});
  if(o.ground === undefined) o.ground = !o.island;
  if(o.island === true) o.island = {}; if(o.island) o.island = Object.assign({ R:15, x:0, z:0 }, o.island);
  if(o.meadow === true) o.meadow = {}; if(o.meadow) o.meadow = Object.assign({ inner:5, outer:24, trees:8, bushes:10, tufts:900, flowers:150 }, o.meadow);

  const root = new THREE.Group(); root.name = 'beecoVilag'; scene.add(root);
  const groups = {}, extras = [], spin = [], prev = { fog:scene.fog, bg:scene.background };
  const GRAD = o.gradientMap || (() => { const c = document.createElement('canvas'); c.width = 3; c.height = 1; const x = c.getContext('2d');
    [0.54, 0.81, 1].forEach((v, i) => { x.fillStyle = `rgb(${v * 255},${v * 255},${v * 255})`; x.fillRect(i, 0, 1, 1); });   // 3 fokozatú cel-árnyalás
    const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.NearestFilter; return t; })();
  const toon = (color, extra) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap:GRAD }, extra || {}));
  const model3 = (m, shadow) => { const g = m.toThree(THREE, { material:h => toon(h) }); g.traverse(n => { if(n.isMesh){ n.castShadow = !!shadow; n.receiveShadow = true; } }); return g; };
  let quality = o.quality === 'B' ? 'B' : 'C';
  const extra = obj => { extras.push(obj); obj.visible = quality === 'C'; return obj; };
  const group = name => { const g = new THREE.Group(); g.name = name; root.add(g); groups[name] = g; return g; };
  const rnd = VM.rng(o.seed * 33);

  // ---- fények: meleg napfény + olívás talaj-visszfény (DS.light.outdoor) ----
  let hemi = null, sun = null;
  if(o.lights){ const G = group('lights');
    hemi = new THREE.HemisphereLight(L.hemiSky, L.hemiGround, L.hemi); G.add(hemi);
    sun = new THREE.DirectionalLight(L.sunColor, L.sun); sun.position.set(9, 16, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const b = o.shadowBox; Object.assign(sun.shadow.camera, { left:-b, right:b, top:b, bottom:-b, near:1, far:60 }); sun.shadow.bias = -0.0004; G.add(sun); }
  if(o.fog) scene.fog = new THREE.Fog(W.fog, 45, 130);

  // ---- ég: háromsávos színátmenet (mézes horizont → világos ég → égkék) ----
  const skyU = { top:{ value:new THREE.Color(W.skyTop) }, mid:{ value:new THREE.Color(M.sky[0]) }, bot:{ value:new THREE.Color(M.honey[0]) }, R:{ value:o.skyR } };
  if(o.sky){ const G = group('sky');
    const dome = new THREE.Mesh(new THREE.SphereGeometry(o.skyR, 24, 16), new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, fog:false, uniforms:skyU,
      vertexShader:'varying float vY; void main(){ vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform float R; varying float vY; void main(){ float h=clamp(vY/R,0.0,1.0);'
        + ' vec3 c = h<0.16 ? mix(bot,mid,h/0.16) : mix(mid,top,(h-0.16)/0.84); gl_FragColor=vec4(c,1.0); }' }));
    dome.renderOrder = -1; G.add(dome); }

  // ---- nap (lapos korong) + lépcsős udvar (C) – a napfény irányában ----
  const billboards = []; let sunDisc = null;
  if(o.sun){ const G = group('sun'), dir = new THREE.Vector3(9, 16, 5).normalize().multiplyScalar(o.skyR * 0.8);
    sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 10), new THREE.MeshBasicMaterial({ color:M.honey[0], fog:false }));
    sunDisc.position.copy(dir); G.add(sunDisc); billboards.push(sunDisc);
    [5, 7, 9.5].forEach((r, k) => { const h = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color:M.honey[0], transparent:true, opacity:0.2, depthWrite:false, fog:false }));
      h.position.copy(dir).multiplyScalar(1.004 + k * 0.002); G.add(extra(h)); billboards.push(h); }); }

  // ---- 3D felhők: körben, a kamera-pálya (≤ 40) és az égbolt között, lassan sodródnak (+X) ----
  const clouds = [];
  if(o.clouds){ const G = group('clouds');
    for(let i = 0; i < o.clouds; i++){ const g = model3(VM.cloud(K, 0.8 + rnd() * 0.8)), a = rnd() * Math.PI * 2, r = o.skyR * (0.5 + rnd() * 0.28);
      g.position.set(Math.cos(a) * r, 14 + rnd() * 16, Math.sin(a) * r); g.userData.sp = 0.12 + rnd() * 0.28; G.add(g); clouds.push(g); } }

  // ---- lebegő méhsejt-szigetek (3 a B szinten is), szélkerék és házikó (C) ----
  if(o.islands){ const G = group('islands'), far = o.skyR * 0.55;
    const spots = [[20, 11, 4], [140, 14, 3.2], [255, 9, 5], [85, 17, 2.6], [200, 8, 3.6]].map(([deg, y, R], i) => {
      const a = deg * Math.PI / 180, d = far * (0.85 + 0.1 * (i % 3)); return [Math.cos(a) * d, y, Math.sin(a) * d, R]; });
    const base = K.model(), more = K.model();
    spots.forEach(([x, y, z, R], i) => (i < 3 ? base : more).merge(VM.floatIsland(K, R, o.seed * 21 + i), { t:[x, y, z] }));
    const [tx, ty, tz] = spots[0], [hx, hy, hz] = spots[2];
    more.merge(VM.turbine(K, false), { t:[tx + 1.2, ty + 0.25, tz] }); more.merge(VM.cottage(K), { t:[hx - 1.5, hy + 0.25, hz], r:[0, 30, 0] });
    G.add(model3(base)); G.add(extra(model3(more)));
    const blades = extra(model3(VM.turbineBlades(K))); blades.position.set(tx + 1.2, ty + 0.25 + 4.3, tz + 0.36); G.add(blades); spin.push(blades); }

  // ---- madárraj (C): lassan átrepül az égen ----
  let flock = null;
  if(o.birds){ flock = extra(model3(VM.birds(K, 9, o.seed * 7))); flock.position.set(11, 15, 30); group('birds').add(flock); }

  // ---- talaj: füves sík / hatszögletű sziget / rét (vilag-fold.js) ----
  const fold = VILAG_FOLD.build(THREE, { K, toon, model3, extra }, o);
  for(const k of ['ground', 'island', 'meadow']) if(fold[k]){ fold[k].name = k; root.add(fold[k]); groups[k] = fold[k]; }

  // ---- napszak: az ég, a köd és a fények színe (csak palettaszínek) ----
  const TIMES = {
    nap:{ top:W.skyTop, mid:M.sky[0], bot:M.honey[0], fog:W.fog, sunC:L.sunColor, sun:L.sun, hemi:L.hemi, disc:M.honey[0], cloud:M.white[0], halo:true },
    alkony:{ top:M.blue[1], mid:M.blossom[0], bot:M.orange[0], fog:M.blossom[0], sunC:M.orange[0], sun:0.8, hemi:0.5, disc:M.orange[0], cloud:M.blossom[0], halo:true },
    este:{ top:M.blue[3], mid:M.blue[2], bot:M.purple[2], fog:M.blue[3], sunC:M.sky[0], sun:0.3, hemi:0.35, disc:M.cream[0], cloud:M.steel[2], halo:false },
  };
  let time = 'nap';
  function setTime(t){ const p = TIMES[t]; if(!p) return; time = t;
    skyU.top.value.set(p.top); skyU.mid.value.set(p.mid); skyU.bot.value.set(p.bot);
    if(o.fog && scene.fog) scene.fog.color.set(p.fog);
    if(sun){ sun.color.set(p.sunC); sun.intensity = p.sun; } if(hemi) hemi.intensity = p.hemi;
    if(sunDisc){ sunDisc.material.color.set(p.disc); billboards.forEach(b => { if(b !== sunDisc) b.material.opacity = p.halo ? 0.2 : 0; }); }
    for(const c of clouds) c.traverse(n => { if(n.isMesh) n.material.color.set(p.cloud); }); }

  // ---- minőség és minőség-őr ----
  function setQuality(q){ quality = q === 'B' ? 'B' : 'C'; auto = false; for(const x of extras) x.visible = quality === 'C'; }   // kézi váltás: az őr leáll
  let auto = o.quality === 'auto', t0 = 0, frames = 0, last = 0;
  function watch(){ if(!auto) return; const now = performance.now();
    if(!last || now - last > 500){ last = now; t0 = 0; frames = 0; return; }            // szünet (rejtett lap) után újrakezdi
    last = now; if(!t0){ t0 = now + 2000; return; }                                      // 2 mp bemelegedés
    if(now < t0) return; frames++;
    if(now - t0 >= 5000){ const fps = frames / ((now - t0) / 1000); auto = false;
      if(fps < 40){ setQuality('B'); console.info('A háttér B szintre váltott (' + fps.toFixed(0) + ' kép/mp).'); }
      if(o.onQuality) o.onQuality(quality, fps); } }

  // ---- képkockánként ----
  function tick(dt, camera){
    dt = Math.min(dt || 0, 0.1); watch();
    for(const c of clouds){ c.position.x += c.userData.sp * dt; if(c.position.x > o.skyR * 0.75) c.position.x = -o.skyR * 0.75; }
    if(flock){ flock.position.x -= dt * 0.9; if(flock.position.x < -50) flock.position.x = 50; }
    for(const s of spin) s.rotation.z += dt * 1.2;
    if(camera) for(const b of billboards) b.quaternion.copy(camera.quaternion);
  }
  function dispose(){
    root.traverse(n => { if(n.geometry) n.geometry.dispose(); const ms = n.material ? [].concat(n.material) : [];
      for(const m of ms){ if(m.map) m.map.dispose(); m.dispose(); } });
    scene.remove(root); if(o.fog){ scene.fog = prev.fog; } scene.background = prev.bg;
  }
  for(const x of extras) x.visible = quality === 'C'; setTime(o.time);
  return { root, groups, lights:{ hemi, sun }, clouds, setQuality, setTime, tick, dispose, toon, model3, extra, gradientMap:GRAD,
    get quality(){ return quality; }, get time(){ return time; }, get auto(){ return auto; } };
}
if(typeof window !== 'undefined') window.beecoVilag = beecoVilag;
