// ============================================================
//  3D-MODELL KÉSZLET – kódból épített low-poly tárgyak (B szint: docs/rajzolas.md), lapos normálok, beeco-paletta (ART.MAT)
//
//  Ugyanaz a modell-leírás két helyen fut:
//   • a JÁTÉKBAN: MODEL.model() … .toThree(THREE, { gradientMap }) → THREE.Group (színenként egy háló, cel-árnyalás) – GLB-betöltő nem kell
//   • fejlesztéskor Node-ban: tools/modell-kit.js → .save('x.glb') megtekintéshez (tools/modell-nezo.html) és ellenőrzéshez
//
//  const m = MODEL.model();
//  m.add(MODEL.chamferBox(w,h,d,c), { color:'steel:1', t:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz] })   // r fokban (X→Y→Z), majd eltolás
//  primitívek: box · chamferBox · hull · cylinder(rTop,rBottom,h,seg) · lathe([[r,y]…],seg) · extrude([[x,y]…],mélység) · sphere · torus
//  szín: 'anyag:tónus' (0 világos · 1 alap · 2 sötét · 3 kontúr – ART.MAT) vagy 0xRRGGBB
// ============================================================
(function(root){
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2], norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };

  // ---- primitívek: háromszöglisták [[a,b,c], …], óramutatóval ellentétes körüljárás kívülről nézve ----
  function hull(P){   // konvex burok kis ponthalmazra: síkonként 2D-burok + legyező-háromszögelés
    const faces = [], seen = new Set(), n = P.length, eps = 1e-7;
    for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++) for(let k = j + 1; k < n; k++){
      let nrm = cross(sub(P[j], P[i]), sub(P[k], P[i])); if(Math.hypot(...nrm) < 1e-12) continue; nrm = norm(nrm);
      let d = dot(nrm, P[i]), pos = 0, neg = 0;
      for(const p of P){ const s = dot(nrm, p) - d; if(s > eps) pos++; else if(s < -eps) neg++; if(pos && neg) break; }
      if(pos && neg) continue;
      if(pos){ nrm = nrm.map(x => -x); d = -d; }                                      // kifelé mutasson
      const key = nrm.map(x => Math.round(x * 1e4)).join(',') + '|' + Math.round(d * 1e4); if(seen.has(key)) continue; seen.add(key);
      const on = P.filter(p => Math.abs(dot(nrm, p) - d) < 1e-6);
      const u = norm(sub(on[1], on[0])), v = cross(nrm, u), c = on.reduce((a, p) => a.map((x, q) => x + p[q] / on.length), [0, 0, 0]);
      const ang = p => { const w = sub(p, c); return Math.atan2(dot(w, v), dot(w, u)); };
      const ring = [...new Map(on.map(p => [p.map(x => x.toFixed(6)).join(), p])).values()].sort((a, b) => ang(a) - ang(b));
      for(let q = 1; q < ring.length - 1; q++) faces.push([ring[0], ring[q], ring[q + 1]]);
    }
    return faces;
  }
  const box = (w, h, d) => { const P = []; for(const x of [-w/2, w/2]) for(const y of [-h/2, h/2]) for(const z of [-d/2, d/2]) P.push([x, y, z]); return hull(P); };
  function chamferBox(w, h, d, c){   // letört élű doboz (1 lépcsős élletörés)
    const P = [], X = w/2, Y = h/2, Z = d/2;
    for(const sx of [-1, 1]) for(const sy of [-1, 1]) for(const sz of [-1, 1])
      P.push([sx*X, sy*(Y-c), sz*(Z-c)], [sx*(X-c), sy*Y, sz*(Z-c)], [sx*(X-c), sy*(Y-c), sz*Z]);
    return hull(P);
  }
  function lathe(profile, seg){   // forgástest Y körül: profile = [[sugár, y], …] alulról felfelé
    const t = [], ring = (r, y, i) => { const a = i / seg * 2 * Math.PI; return [r * Math.sin(a), y, r * Math.cos(a)]; };
    for(let p = 0; p < profile.length - 1; p++) for(let i = 0; i < seg; i++){
      const [r0, y0] = profile[p], [r1, y1] = profile[p + 1];
      const a = ring(r0, y0, i), b = ring(r0, y0, i + 1), c = ring(r1, y1, i + 1), d = ring(r1, y1, i);
      if(r0 > 1e-9) t.push([a, b, c]); if(r1 > 1e-9) t.push([a, c, d]);
    }
    const first = profile[0], last = profile[profile.length - 1];
    if(first[0] > 1e-9) for(let i = 0; i < seg; i++) t.push([[0, first[1], 0], ring(first[0], first[1], i + 1), ring(first[0], first[1], i)]);
    if(last[0] > 1e-9) for(let i = 0; i < seg; i++) t.push([[0, last[1], 0], ring(last[0], last[1], i), ring(last[0], last[1], i + 1)]);
    return t;
  }
  const cylinder = (rTop, rBottom, h, seg) => lathe([[rBottom, -h/2], [rTop, h/2]], seg);
  function sphere(r, wSeg, hSeg){ const prof = []; for(let i = 0; i <= hSeg; i++){ const a = -Math.PI/2 + i / hSeg * Math.PI; prof.push([r * Math.cos(a), r * Math.sin(a)]); } return lathe(prof, wSeg); }
  function torus(R, r, seg, tube){   // Y tengely körül fekvő gyűrű
    const t = [], P = (i, j) => { const a = i / seg * 2 * Math.PI, b = j / tube * 2 * Math.PI, rr = R + r * Math.cos(b); return [rr * Math.sin(a), r * Math.sin(b), rr * Math.cos(a)]; };
    for(let i = 0; i < seg; i++) for(let j = 0; j < tube; j++){ const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); t.push([a, c, b], [a, d, c]); }
    return t;
  }
  function extrude(poly, depth){   // 2D sokszög (x,y) kihúzása Z mentén, -depth/2 … +depth/2; homorú sokszögre is (fülvágás)
    const n = poly.length, t = [], z0 = -depth/2, z1 = depth/2;
    const area = poly.reduce((a, p, i) => { const q = poly[(i + 1) % n]; return a + p[0]*q[1] - q[0]*p[1]; }, 0);
    const pts = area < 0 ? [...poly].reverse() : poly, idx = pts.map((_, i) => i), tris = [];
    const isEar = (a, b, c) => { const A = pts[a], B = pts[b], C = pts[c]; if((B[0]-A[0])*(C[1]-A[1]) - (B[1]-A[1])*(C[0]-A[0]) <= 0) return false;
      return !idx.some(i => { if(i === a || i === b || i === c) return false; const P = pts[i];
        const s1 = (B[0]-A[0])*(P[1]-A[1]) - (B[1]-A[1])*(P[0]-A[0]), s2 = (C[0]-B[0])*(P[1]-B[1]) - (C[1]-B[1])*(P[0]-B[0]), s3 = (A[0]-C[0])*(P[1]-C[1]) - (A[1]-C[1])*(P[0]-C[0]);
        return s1 >= 0 && s2 >= 0 && s3 >= 0; }); };
    let guard = 0;
    while(idx.length > 3 && guard++ < 1000){ for(let k = 0; k < idx.length; k++){ const a = idx[(k + idx.length - 1) % idx.length], b = idx[k], c = idx[(k + 1) % idx.length];
      if(isEar(a, b, c)){ tris.push([a, b, c]); idx.splice(k, 1); break; } } }
    tris.push([idx[0], idx[1], idx[2]]);
    const V = (i, z) => [pts[i][0], pts[i][1], z];
    for(const [a, b, c] of tris){ t.push([V(a, z1), V(b, z1), V(c, z1)]); t.push([V(a, z0), V(c, z0), V(b, z0)]); }
    for(let i = 0; i < pts.length; i++){ const j = (i + 1) % pts.length; t.push([V(i, z0), V(j, z0), V(j, z1)], [V(i, z0), V(j, z1), V(i, z1)]); }
    return t;
  }

  // ---- színek (sRGB hex; a GLB-mentés a Node-os eszközben lineárisra vált) ----
  const art = () => (typeof ART !== 'undefined' ? ART : (typeof require === 'function' ? require('./art.js') : null));
  function hexOf(c){
    if(typeof c === 'number') return c;
    if(/^\d+$/.test(c)) return +c;                                  // szám-szín a csoport kulcsában (String(0xRRGGBB))
    const [m, tone] = String(c).split(':'), A = art();
    if(!A || !A.MAT[m]) throw new Error('model-kit: ismeretlen anyag: ' + m);
    return parseInt(A.MAT[m][+(tone || 1)].slice(1), 16);
  }

  function model(){
    const groups = new Map();   // szín → háromszögek (egy szín = egy anyag = egy háló)
    const api = {
      add(tris, o = {}){
        const r = (o.r || [0, 0, 0]).map(v => v * Math.PI / 180), s = o.s || [1, 1, 1], t = o.t || [0, 0, 0];
        const tf = p => { let [x, y, z] = [p[0]*s[0], p[1]*s[1], p[2]*s[2]];
          [y, z] = [y*Math.cos(r[0]) - z*Math.sin(r[0]), y*Math.sin(r[0]) + z*Math.cos(r[0])];
          [x, z] = [x*Math.cos(r[1]) + z*Math.sin(r[1]), -x*Math.sin(r[1]) + z*Math.cos(r[1])];
          [x, y] = [x*Math.cos(r[2]) - y*Math.sin(r[2]), x*Math.sin(r[2]) + y*Math.cos(r[2])];
          return [x + t[0], y + t[1], z + t[2]]; };
        const flip = s[0] * s[1] * s[2] < 0, key = String(o.color || 'white:1');
        if(!groups.has(key)) groups.set(key, []);
        for(const tri of tris){ const q = tri.map(tf); groups.get(key).push(flip ? [q[0], q[2], q[1]] : q); }
        return api;
      },
      // egy másik modell (pl. közös alkatrész) beillesztése eltolással/forgatással
      merge(other, o = {}){ for(const [color, tris] of other.groups()) api.add(tris, Object.assign({}, o, { color })); return api; },
      groups(){ return groups; },
      stats(){ let tris = 0; for(const g of groups.values()) tris += g.length; return { tris, materials:groups.size }; },
      // Three.js csoport: színenként egy BufferGeometry lapos normálokkal; anyag: opts.material(hex) vagy toon + gradientMap
      toThree(THREE, opts = {}){
        const G = new THREE.Group();
        for(const [color, tris] of groups){
          const P = new Float32Array(tris.length * 9), N = new Float32Array(tris.length * 9);
          tris.forEach((tri, i) => { const n = norm(cross(sub(tri[1], tri[0]), sub(tri[2], tri[0])));
            for(let k = 0; k < 3; k++){ P.set(tri[k], i * 9 + k * 3); N.set(n, i * 9 + k * 3); } });
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
          g.computeBoundingSphere();
          const hex = hexOf(color);
          const mat = opts.material ? opts.material(hex, color) : new THREE.MeshToonMaterial({ color:hex, gradientMap:opts.gradientMap || null });
          const mesh = new THREE.Mesh(g, mat); mesh.castShadow = !!opts.castShadow; mesh.receiveShadow = !!opts.receiveShadow;
          mesh.userData.color = color; G.add(mesh);
        }
        return G;
      },
    };
    return api;
  }

  const MODEL = { model, hull, box, chamferBox, cylinder, lathe, sphere, torus, extrude, hexOf };
  if(typeof module !== 'undefined' && module.exports){ module.exports = MODEL; return; }
  root.MODEL = MODEL;
})(typeof window !== 'undefined' ? window : globalThis);
