// ============================================================
//  MÉHESD – FÖLDI POSZMÉH (Bombus terrestris), FÉSZEK, PERMETEZÉS-JELZÉS (B szint). A VAROS_MODELS-be kerülnek.
//
//  A földi poszméh jellegzetes rajzolata (docs/beporzo-poszmeh-forrasok.md): fekete, szőrös test, a tor ELEJÉN sötétsárga
//  gallér, a potroh 2. szelvényén sötétsárga öv, a potroh vége fehér (a királynőnél sárgásfehér). Faj-azonosításhoz ez elég,
//  a „cuki” forma (kerek tor, tojásdad potroh, rövid szárny) a játék stílusa – arc (szem-pupilla, mosoly) szándékosan nincs.
//
//  bumblebeeQueen / bumblebeeWorker: RÉSZEK { body, wingL, wingR, foot } – mint az EK_MODELS.bee: az origó a SZÁRNY-ZSANÉR
//    (a tor teteje), az orr +Z; a szárnyakat a Z tengely körül forgatva csapkodtatod (wingL: +, wingR: − irányba nyílik);
//    foot = a legalsó pont magassága (negatív) – leültetéskor y − foot. Méret (dioráma-lépték, jól látható jelölő):
//    dolgozó ≈ 0,2 hosszú, királynő ≈ 1,35× (≈ 0,27). A dolgozó hátsó lábán narancs virágporcsomó (virágporkosár).
//  nest: apró (Ø ≈ 0,4) földkupac fűcsomóval, elöl (+Z) a régi rágcsálójárat sötét bejárata. Talp y = 0.
//  sprayWarn: háromszögletű „Figyelem!” tábla (piros szegély, fehér lap, felkiáltójel) karón – vegyszer, flakon, márka nélkül.
//  Betöltési sorrend: 3d/elokert-modellek.js és 3d/varos-modellek.js UTÁN. Node-ban require is elég.
// ============================================================
(function(root){
  const EK = root.EK_MODELS || (typeof require === 'function' ? require('./elokert-modellek.js') : null);
  const VM = root.VAROS_MODELS || (typeof require === 'function' ? require('./varos-modellek.js') : null);
  const { rng, blob, rod, flat } = EK._h, { tuft } = VM._h;
  const ell = (cx, cz, a, b, n) => { const p = []; for(let i = 0; i < n; i++){ const t = i / n * Math.PI * 2; p.push([cx + Math.cos(t) * a, cz + Math.sin(t) * b]); } return p; };
  // forgástest a Z tengely mentén: prof = [[sugár, z], …] NÖVEKVŐ z-vel; a lathe Y-tengelyét +90° X-forgatás viszi Z-be
  const latheZ = (K, prof, seg) => K.lathe(prof, seg);
  const ZROT = [90, 0, 0];
  // színes övekre bontott forgástest: f(t) → [sugár, z] (t = 0 … 1, hátulról előre), bands = [[t0, t1, szín], …]
  function banded(m, K, f, bands, seg, y){
    for(const [t0, t1, color] of bands){ const P = [], n = Math.max(2, Math.round((t1 - t0) / 0.1) + 1);
      for(let i = 0; i < n; i++) P.push(f(t0 + (t1 - t0) * i / (n - 1)));
      m.add(latheZ(K, P, seg), { color, r:ZROT, t:[0, y, 0] }); }
  }

  // POSZMÉH – s = nagyítás, queen = királynő (sárgásfehér farok, pollen nélkül; a dolgozónál virágporcsomó)
  function bumblebee(K, queen){
    const s = queen ? 1.35 : 1, body = K.model(), tail = queen ? 'cream:2' : 'white:1', Y = -0.034 * s;
    // TOR: hátul fekete, elöl sötétsárga gallér, legelöl fekete nyak
    const rT = 0.036 * s;
    banded(body, K, t => { const z = -rT + t * 2 * rT; return [Math.sqrt(Math.max(0, rT * rT - z * z)) * (t > 0 && t < 1 ? 1 : 0), z]; },
      [[0, 0.5, 'dark:3'], [0.5, 0.85, 'honey:2'], [0.85, 1, 'dark:3']], 12, Y);
    // POTROH: tojásdad, a tor mögött; hátulról: fehér farok · fekete · sárga öv (2. szelvény) · fekete (1. szelvény)
    const L = 0.105 * s, Rm = 0.042 * s, z0 = -rT - L + 0.012 * s;
    banded(body, K, t => [Rm * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.88 + 0.001)), 0.62) * (t === 0 ? 0 : 1), z0 + t * L],
      [[0, 0.27, tail], [0.27, 0.47, 'dark:3'], [0.47, 0.68, 'honey:2'], [0.68, 1, 'dark:3']], 12, Y - 0.008 * s);
    // szőrös hatás: néhány sötét „pamacs” a tor oldalán és a potroh alján
    for(const [x, z] of [[1, 0.004], [-1, 0.004]]) body.add(blob(K, 0.016 * s, 40 + x, 6, 0.25), { color:'dark:3', t:[x * 0.03 * s, Y - 0.006 * s, z * s] });
    // FEJ + összetett szem (sötétebb ovális, fénypont és pupilla nélkül) + könyökös csáp
    const hz = rT + 0.014 * s, hy = Y - 0.01 * s;
    body.add(K.sphere(0.025 * s, 10, 6), { color:'dark:3', t:[0, hy, hz], s:[1, 1.05, 0.9] });
    for(const sx of [-1, 1]){
      body.add(K.sphere(0.013 * s, 6, 4), { color:'dark:1', t:[sx * 0.018 * s, hy + 0.004 * s, hz + 0.006 * s], s:[0.55, 1.3, 1] });
      const a = [sx * 0.008 * s, hy + 0.016 * s, hz + 0.014 * s], b = [sx * 0.018 * s, hy + 0.04 * s, hz + 0.022 * s], c = [sx * 0.034 * s, hy + 0.036 * s, hz + 0.058 * s];
      rod(body, K, a, b, 0.0035 * s, 0.003 * s, 4, 'dark:3'); rod(body, K, b, c, 0.003 * s, 0.0025 * s, 4, 'dark:3');
    }
    // LÁBAK: 3 pár, combbal és lábszárral; a dolgozó hátsó lábán virágporcsomó
    let foot = 0;
    [[0.018, 0.022], [0, 0], [-0.018, -0.03]].forEach(([z, dz], k) => { for(const sx of [-1, 1]){
      const a = [sx * 0.018 * s, Y - 0.026 * s, z * s], b = [sx * 0.04 * s, Y - 0.036 * s, (z + dz * 0.3) * s], c = [sx * 0.047 * s, Y - 0.06 * s, (z + dz * 0.8) * s];
      rod(body, K, a, b, 0.0065 * s, 0.0055 * s, 4, 'dark:3');                                                    // comb (szőrös, vaskos)
      rod(body, K, b, c, 0.0055 * s, k === 2 ? 0.008 * s : 0.004 * s, 4, 'dark:3');                               // lábszár
      foot = Math.min(foot, c[1] - 0.004 * s);
      if(k === 2 && !queen) body.add(blob(K, 0.012, 60 + sx, 7, 0.15), { color:'orange:1', t:[b[0] * 0.55 + c[0] * 0.45, b[1] * 0.45 + c[1] * 0.55, b[2] * 0.5 + c[2] * 0.5], s:[1, 1.25, 1] });
    } });
    // SZÁRNYAK: füstös-áttetsző elülső + kisebb hátulsó szárny, a tor tetején (origó), kissé megemelve
    const out = { body, foot };
    for(const [name, sx] of [['wingL', 1], ['wingR', -1]]){ const w = K.model();
      w.add(flat(K, ell(sx * 0.058 * s, -0.022 * s, 0.056 * s, 0.021 * s, 12), 0.003 * s), { color:'glass:0', t:[0, 0.001, 0], r:[-90, 0, sx * 12] });
      w.add(flat(K, ell(sx * 0.042 * s, -0.052 * s, 0.036 * s, 0.014 * s, 10), 0.003 * s), { color:'glass:0', t:[0, -0.001, 0], r:[-90, 0, sx * 12] });
      out[name] = w; }
    return out;
  }
  const bumblebeeQueen = K => bumblebee(K, true);
  const bumblebeeWorker = K => bumblebee(K, false);

  // POSZMÉH-FÉSZEK: kis földkupac, körben és hátul sűrű fűcsomók, elöl (+Z) a régi rágcsálójárat sötét, peremes bejárata,
  // mellette moha és egy kavics. Ø ≈ 0,4, magasság ≈ 0,2.
  function nest(K){
    const m = K.model(), R = rng(71);
    m.add(K.lathe([[0.2, 0], [0.17, 0.035], [0.1, 0.07], [0, 0.08]], 12), { color:'soil:1' });
    for(let i = 0; i < 9; i++){ const a = Math.PI * (0.25 + i / 8 * 1.5), r = 0.13 + (i % 2) * 0.04;             // fűcsomók (elöl nyitva)
      tuft(m, K, Math.sin(a) * r, Math.cos(a) * r, 0.11 + R() * 0.06, i % 3 ? 'leaf:1' : 'grass:2', R, 4); }
    m.add(K.cylinder(0.042, 0.042, 0.012, 12), { color:'dark:3', t:[0, 0.045, 0.14], r:[62, 0, 0], s:[1.25, 1, 1] });   // járat-bejárat
    m.add(K.torus(0.048, 0.01, 12, 3), { color:'soil:2', t:[0, 0.047, 0.137], r:[62, 0, 0], s:[1.25, 1, 1] });           // kitaposott perem
    for(const [x, z, r] of [[0.13, 0.12, 0.03], [-0.15, 0.08, 0.025]]) m.add(blob(K, r, 90 + x * 10, 7), { color:'grass:1', t:[x, 0.02, z], s:[1.4, 0.5, 1] });   // moha
    m.add(blob(K, 0.025, 95, 7), { color:'steel:2', t:[-0.08, 0.02, 0.19], s:[1.3, 0.7, 1] });                          // kavics
    return m;
  }

  // PERMETEZÉS-JELZÉS: lekerekített háromszög-tábla (piros szegély, fehér lap, fekete felkiáltójel) fém karón, csavarokkal,
  // a tövében fűcsomó és két kő. Kb. 0,55 magas, a tábla +Z felé néz.
  function sprayWarn(K){
    const m = K.model(), R = rng(83), cy = 0.4;
    m.add(K.cylinder(0.014, 0.014, cy + 0.08, 8), { color:'steel:2', t:[0, (cy + 0.08) / 2, -0.012] });              // karó
    m.add(K.cylinder(0.018, 0.014, 0.012, 8), { color:'steel:2', t:[0, cy + 0.086, -0.012] });                      // karósapka
    const tri = (r, cr) => { const P = []; for(let k = 0; k < 3; k++){ const a = Math.PI / 2 + k * 2 * Math.PI / 3;     // lekerekített háromszög
      for(let j = -1; j <= 1; j++){ const b = a + j * 0.5; P.push([Math.cos(a) * (r - cr) + Math.cos(b) * cr, Math.sin(a) * (r - cr) + Math.sin(b) * cr]); } } return P; };
    m.add(K.extrude(tri(0.16, 0.025), 0.016), { color:'red:1', t:[0, cy, 0.004] });
    m.add(K.extrude(tri(0.105, 0.012), 0.02), { color:'white:1', t:[0, cy - 0.006, 0.006] });
    m.add(K.extrude([[-0.011, 0], [0.011, 0], [0.006, -0.062], [-0.006, -0.062]], 0.006), { color:'dark:3', t:[0, cy + 0.036, 0.017] });   // felkiáltójel
    m.add(K.cylinder(0.009, 0.009, 0.006, 8), { color:'dark:3', t:[0, cy - 0.047, 0.017], r:[90, 0, 0] });
    for(const y of [cy + 0.06, cy - 0.06]) m.add(K.cylinder(0.008, 0.008, 0.012, 6), { color:'steel:2', t:[0, y, -0.004], r:[90, 0, 0] });   // csavarok (hátul)
    tuft(m, K, 0, 0.01, 0.12, 'leaf:1', R, 5); tuft(m, K, 0.05, -0.03, 0.09, 'leaf:1', R, 4); tuft(m, K, -0.05, -0.02, 0.08, 'leaf:1', R, 3);
    for(const [x, z] of [[-0.05, 0.03], [0.04, 0.04]]) m.add(blob(K, 0.022, 100 + x * 100, 7), { color:'steel:1', t:[x, 0.012, z], s:[1.3, 0.7, 1] });
    return m;
  }

  Object.assign(VM, { bumblebeeQueen, bumblebeeWorker, nest, sprayWarn });
  root.VAROS_MODELS = VM;
  if(typeof module !== 'undefined' && module.exports) module.exports = VM;
})(typeof window !== 'undefined' ? window : globalThis);
