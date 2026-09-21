// ============================================================
//  MÉHESD – a dioráma-város 3D tárgyai B szinten (docs/rajzolas.md): 300–1200 △, letört élek, 4–6 szín az ART.MAT palettából
//  Játékterv: docs/beporzo-jatekterv.md („Méhesd élő hálózata”).
//
//  Builderek: VAROS_MODELS.<név>(K, opts) → modell (K = MODEL, js/art/model-kit.js), vagy RÉSZEK objektuma ({ body, water }).
//  LÉPTÉK: 1 egység ≈ 25 m, de „diorámásan” kicsinyítve – a házak a valóságosnál nagyobbak (családi ház ≈ 0,9 × 0,9 alap,
//  0,8 magas; autó ≈ 0,3 hosszú); Méhesd teljes mérete 22 × 16 egység.
//  Helyi tengelyek: Y fel, talp y = 0, az origó a tárgy KÖZEPE, az eleje (utcafront, bejárat) +Z.
//  Hosszú elemek (út, patak, vasút, folyosó-szakaszok) az X tengely mentén, len hosszal, középre igazítva (−len/2 … +len/2):
//  a játék két pont közé nyújtja/forgatja őket. Évszak: opts.season = 'tavasz' | 'nyar' | 'osz' | 'tel' (alap 'nyar').
//  A poszméh, a fészek és a permetezés-jel: 3d/varos-poszmeh.js (ugyanebbe a VAROS_MODELS-be).
//  Kell hozzá: js/art/art.js, js/art/model-kit.js, 3d/elokert-modellek.js (a segédeit használja: EK_MODELS._h).
//  Katalógus: 3d/katalogus.js („Méhesd”), galéria: modellek.html. Felirat, logó, arc nincs a tárgyakon.
// ============================================================
(function(root){
  const EK = root.EK_MODELS || (typeof require === 'function' ? require('./elokert-modellek.js') : null);
  const { rng, blob, rod, flat, spread, seasonOf } = EK._h;
  const SEASONS = ['tavasz', 'nyar', 'osz', 'tel'];
  const num = (v, d, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(+v) && +v > 0 ? +v : d));
  // lomb-színek évszakonként: [világos, alap, sötét belső]; télen kopasz
  const LITE = ['leaf:0', 'leaf:1', 'leaf:1'];                                  // két tónusú lomb a színgazdag épületek mellé
  const FOL = { tavasz:['grass:0', 'leaf:0', 'leaf:1'], nyar:['leaf:0', 'leaf:1', 'leaf:2'], osz:['honey:1', 'orange:1', 'orange:2'], tel:null };
  // kihúzott keresztmetszet az X tengely mentén: pts = [[z, y], …] (az extrude Z-irányú, 90°-os Y-forgatás teszi X-be)
  const alongX = (K, pts, len) => K.extrude(pts.map(([z, y]) => [-z, y]), len);
  const AX = { r:[0, 90, 0] };
  // fűcsomó: n levél egy tőből, sugárirányban dőlve
  function tuft(m, K, x, z, h, color, R, n){
    for(let k = 0; k < (n || 3); k++){ const a = k * 2.1 + R() * 0.8;
      rod(m, K, [x, 0.02, z], [x + Math.sin(a) * h * 0.35, h, z + Math.cos(a) * h * 0.35], h * 0.14, 0, 3, color); }
  }
  // kis dioráma-fa (törzs + 2–3 lombcsomó); s = nagyítás; télen kopasz ágak
  // tones: a lomb három tónusa helyett saját lista (pl. ['leaf:1','leaf:1','leaf:1'] – kevesebb szín a sok elemű tárgyakon)
  function smallTree(m, K, x, z, s, se, seed, extra, tones){
    const fol = FOL[se] && (tones || FOL[se]), R = rng(seed);
    m.add(K.cylinder(0.028 * s, 0.042 * s, 0.34 * s, 6), { color:'wood:2', t:[x, 0.17 * s, z] });
    if(!fol){
      for(let k = 0; k < 4; k++){ const a = k * 1.57 + R(), tip = [x + Math.sin(a) * 0.17 * s, (0.5 + R() * 0.1) * s, z + Math.cos(a) * 0.17 * s];
        rod(m, K, [x, 0.3 * s, z], tip, 0.02 * s, 0.006 * s, 4, 'wood:2'); }
      return;
    }
    m.add(blob(K, 0.2 * s, seed, 14), { color:fol[1], t:[x, 0.5 * s, z] });
    m.add(blob(K, 0.14 * s, seed + 1, 10), { color:fol[0], t:[x + 0.1 * s, 0.62 * s, z + 0.05 * s] });
    m.add(blob(K, 0.13 * s, seed + 2, 10), { color:fol[2], t:[x - 0.12 * s, 0.42 * s, z - 0.04 * s] });
    if(extra) for(let k = 0; k < 5; k++){ const a = k * 1.3 + R(), e = 0.2 + R() * 0.9;                  // virág- vagy termés-pöttyök
      m.add(blob(K, 0.03 * s, seed + 10 + k, 5), { color:extra, t:[x + Math.cos(a) * Math.cos(e) * 0.2 * s, 0.5 * s + Math.sin(e) * 0.2 * s, z + Math.sin(a) * Math.cos(e) * 0.2 * s] }); }
  }

  // ================= ÉPÜLETEK =================
  // egy családi ház (origó a közép, eleje +Z): fal ötszög-hasábból, nyeregtető két letört lappal, gerinc, kémény, ajtó, ablakok
  function oneHouse(K, roof){
    const m = K.model(), W = 0.72, D = 0.62, Hw = 0.4, rise = 0.3, eave = 0.07, th = 0.05, a = Math.atan2(rise, D / 2);
    m.add(alongX(K, [[-D / 2, 0], [D / 2, 0], [D / 2, Hw], [0, Hw + rise - 0.02], [-D / 2, Hw]], W), { color:'cream:1', ...AX });
    const run = D / 2 + eave, L = run / Math.cos(a);
    for(const sz of [-1, 1]) m.add(K.chamferBox(W + 0.1, th, L, 0.015), { color:roof, r:[sz * a * 180 / Math.PI, 0, 0],
      t:[0, Hw + rise - (run / 2) * Math.tan(a) + Math.cos(a) * th / 2, sz * run / 2 + sz * Math.sin(a) * th / 2] });
    m.add(K.box(W + 0.12, 0.045, 0.045), { color:roof, t:[0, Hw + rise + 0.03, 0], r:[45, 0, 0] });                  // gerinc
    m.add(K.chamferBox(0.08, 0.2, 0.08, 0.015), { color:'cream:1', t:[W * 0.26, Hw + rise * 0.72, -D * 0.2] });      // kémény
    m.add(K.box(0.13, 0.22, 0.02), { color:'wood:2', t:[-W * 0.24, 0.11, D / 2 + 0.005] });                          // ajtó
    for(const x of [0.06, 0.24]) m.add(K.box(0.13, 0.12, 0.02), { color:'glass:2', t:[x, 0.25, D / 2 + 0.005] });   // ablakok elöl
    for(const sx of [-1, 1]) m.add(K.box(0.02, 0.12, 0.14), { color:'glass:2', t:[sx * (W / 2 + 0.005), 0.3, 0] }); // oromfali ablak
    return m;
  }
  // HÁZSOR: n családi ház egymás mellett (X), előttük (+Z) kert fával, bokorral, kerítéssel, kertkapu-úttal; minden 2. ház
  // oromzata az utcára néz. Egy telek 1,1 × 1,4 egység.
  function houses(K, o){
    o = o || {};
    const n = Math.round(num(o.n, 3, 1, 8)), LOT = 1.1, D = 1.4, W = n * LOT, m = K.model(), se = seasonOf(o), R = rng(101 + n);
    const ROOFS = ['tomato:2', 'chocolate:1', 'blue:2'];
    m.add(K.chamferBox(W - 0.02, 0.04, D - 0.02, 0.015), { color:'grass:1', t:[0, 0.02, 0] });                       // telkek
    for(let i = 0; i < n; i++){
      const x = -W / 2 + LOT * (i + 0.5), side = i % 2 ? -1 : 1;
      m.merge(oneHouse(K, ROOFS[i % 3]), { t:[x, 0.04, -0.28], r:[0, i % 2 ? 90 : 0, 0] });
      m.add(K.box(0.14, 0.012, 0.5), { color:'cream:1', t:[x + (i % 2 ? 0 : -0.17), 0.045, 0.37] });                 // kerti út
      smallTree(m, K, x + side * 0.3, 0.35, 0.8, se, 200 + i * 7, se === 'tavasz' ? 'white:1' : null, se === 'nyar' ? ['leaf:1', 'leaf:1', 'leaf:1'] : null);
      m.add(blob(K, 0.1, 230 + i, 10), { color:'leaf:1', t:[x - side * 0.34, 0.1, 0.5], s:[1.3, 0.8, 1] });           // bokor
      for(const y of [0.08, 0.15]) m.add(K.box(LOT - 0.26, 0.022, 0.02), { color:'wood:2', t:[x + (i % 2 ? 0.1 : 0.06), y, D / 2 - 0.05] });   // kerítés
      for(const dx of [-0.53, 0.53]) m.add(K.box(0.04, 0.2, 0.04), { color:'wood:2', t:[x + dx, 0.12, D / 2 - 0.05] });
      if(i) m.add(K.box(0.07, 0.16, D - 0.3), { color:'leaf:1', t:[x - LOT / 2, 0.1, 0] });                            // telekhatár-sövény
    }
    return m;
  }

  // LAKÓTELEPI PANELHÁZ (felújított, pasztell): 8 szint, szintenként ablaksáv elöl-hátul, panelhézagok, sárga erkélyoszlopok,
  // lépcsőház-ablaksor, bejárati előtető, lapos tető attikával és gépházzal, két kis fa. w × d (alap 2,4 × 0,9).
  function blocks(K, o){
    o = o || {};
    const w = num(o.w, 2.4, 1, 5), d = num(o.d, 0.9, 0.6, 1.4), F = 8, fh = 0.16, H = F * fh + 0.06, m = K.model(), cb = K.chamferBox;
    m.add(cb(w + 0.3, 0.03, d + 0.5, 0.01), { color:'steel:2', t:[0, 0.015, 0] });                                   // járda körben
    m.add(cb(w, H, d, 0.03), { color:'white:2', t:[0, H / 2, 0] });
    const nc = Math.max(3, Math.round(w / 0.22));
    for(const sz of [-1, 1]){
      for(let f = 0; f < F; f++) m.add(K.box(w - 0.12, 0.065, 0.012), { color:'glass:2', t:[0, 0.12 + f * fh, sz * (d / 2 + 0.004)] });   // ablaksávok
      for(let c = 1; c < nc; c++) m.add(K.box(0.018, H - 0.1, 0.02), { color:'white:1', t:[-w / 2 + c * w / nc, H / 2, sz * (d / 2 + 0.008)] });   // panelhézag
    }
    const bx = [-w * 0.3, w * 0.3];                                                                                   // erkélyoszlopok elöl
    for(const x of bx) for(let f = 1; f < F; f++) m.add(K.box(0.2, 0.055, 0.07), { color:'honey:1', t:[x, 0.08 + f * fh, d / 2 + 0.035] });
    m.add(K.box(0.1, H - 0.2, 0.014), { color:'glass:2', t:[0, H / 2 + 0.05, d / 2 + 0.012] });                     // lépcsőház
    m.add(cb(0.28, 0.03, 0.16, 0.01), { color:'honey:1', t:[0, 0.17, d / 2 + 0.08] });                               // előtető
    m.add(K.box(0.12, 0.13, 0.02), { color:'glass:2', t:[0, 0.08, d / 2 + 0.01] });                                  // bejárat
    for(const [x, z, ww, dd] of [[0, d / 2 - 0.02, w, 0.04], [0, -d / 2 + 0.02, w, 0.04], [w / 2 - 0.02, 0, 0.04, d], [-w / 2 + 0.02, 0, 0.04, d]])
      m.add(K.box(ww, 0.06, dd), { color:'steel:2', t:[x, H + 0.03, z] });                                          // attika
    m.add(cb(0.36, 0.14, 0.3, 0.02), { color:'steel:2', t:[w * 0.2, H + 0.07, 0] });                                 // gépház
    for(const sx of [-1, 1]) smallTree(m, K, sx * (w / 2 + 0.02), d / 2 + 0.16, 0.8, 'nyar', 260 + sx, null, LITE);
    return m;
  }

  // ISKOLA: kétszintes, „iskolasárga” épület kontyolt tetővel, fehér középrizalit oromzattal, lépcsős bejárat, ablaksorok;
  // előtte (+Z) aszfaltos udvar kis kapuval és egy fával. Kb. 2,1 × 1,5 egység.
  function school(K){
    const m = K.model(), cb = K.chamferBox, W = 2.0, D = 0.72, Hw = 0.56, rise = 0.28, z0 = -0.36, F = z0 + D / 2;
    m.add(cb(W + 0.1, 0.03, 1.5, 0.01), { color:'steel:2', t:[0, 0.015, 0] });                                       // udvar + járda
    m.add(cb(W, Hw, D, 0.03), { color:'honey:0', t:[0, Hw / 2, z0] });
    const e = 0.06, rx = W / 2 - D / 2 + 0.05;
    m.add(K.hull([[-W / 2 - e, Hw, z0 - D / 2 - e], [W / 2 + e, Hw, z0 - D / 2 - e], [W / 2 + e, Hw, z0 + D / 2 + e], [-W / 2 - e, Hw, z0 + D / 2 + e],
      [-rx, Hw + rise, z0], [rx, Hw + rise, z0]]), { color:'tomato:2' });                                             // kontyolt tető
    m.add(cb(0.46, Hw + 0.04, D + 0.1, 0.02), { color:'white:1', t:[0, (Hw + 0.04) / 2, z0] });                      // rizalit
    m.add(K.extrude([[-0.25, 0], [0.25, 0], [0, 0.18]], 0.06), { color:'white:1', t:[0, Hw + 0.03, F + 0.03] });      // oromzat
    m.add(K.box(0.16, 0.24, 0.02), { color:'wood:2', t:[0, 0.14, F + 0.055] });                                      // kapu
    for(let i = 0; i < 2; i++) m.add(cb(0.34 - i * 0.08, 0.03, 0.08, 0.008), { color:'steel:2', t:[0, 0.035 + i * 0.03, F + 0.1 - i * 0.03] });   // lépcső
    m.add(K.box(0.12, 0.13, 0.02), { color:'glass:2', t:[0, 0.42, F + 0.055] });                                      // rizalit-ablak
    for(const y of [0.17, 0.42]){                                                                                     // ablaksorok (elöl és hátul)
      for(let i = 0; i < 4; i++) for(const sx of [-1, 1]){ const x = sx * (0.36 + i * 0.18);
        m.add(K.box(0.11, 0.15, 0.02), { color:'glass:2', t:[x, y, F + 0.005] });
        m.add(K.box(0.11, 0.15, 0.02), { color:'glass:2', t:[x, y, z0 - D / 2 - 0.005] }); }
    }
    for(let i = 0; i < 5; i++) m.add(blob(K, 0.08, 320 + i, 11), { color:'leaf:1', t:[-0.45 + i * 0.22, 0.09, 0.7], s:[1.2, 1, 1] });   // cserjesor az udvar szélén
    smallTree(m, K, 0.72, 0.5, 0.95, 'nyar', 300, null, LITE);
    smallTree(m, K, -0.8, 0.52, 0.8, 'nyar', 310, null, LITE);
    return m;
  }

  // KIS TEMPLOM: fehér hajó (X mentén) meredek cseréptetővel, a nyugati (−X) végén torony harangablakokkal és patinás
  // gúlasisakkal (gömb + kis kereszt), a keleti végén félköríves szentély; kőlábazat, magas ablakok. Kb. 1,6 × 0,6.
  function church(K){
    const m = K.model(), cb = K.chamferBox, W = 0.9, D = 0.48, Hw = 0.4, rise = 0.32, a = Math.atan2(rise, D / 2), th = 0.05, run = D / 2 + 0.05;
    m.add(cb(W + 0.6, 0.05, D + 0.14, 0.015), { color:'steel:2', t:[0.05, 0.025, 0] });                              // lábazat
    m.add(alongX(K, [[-D / 2, 0], [D / 2, 0], [D / 2, Hw], [0, Hw + rise - 0.02], [-D / 2, Hw]], W), { color:'white:2', ...AX });
    for(const sz of [-1, 1]) m.add(cb(W + 0.06, th, run / Math.cos(a), 0.015), { color:'tomato:2', r:[sz * a * 180 / Math.PI, 0, 0],
      t:[0.03, Hw + rise - (run / 2) * Math.tan(a) + Math.cos(a) * th / 2, sz * run / 2 + sz * Math.sin(a) * th / 2] });
    m.add(K.cylinder(0.2, 0.2, Hw, 10), { color:'white:2', t:[W / 2, Hw / 2, 0] });                                  // szentély
    m.add(K.cylinder(0, 0.24, 0.2, 10), { color:'tomato:2', t:[W / 2 + 0.01, Hw + 0.1, 0] });
    for(const x of [-0.22, 0.05, 0.3]) for(const sz of [-1, 1]) m.add(K.box(0.07, 0.2, 0.02), { color:'glass:2', t:[x, 0.24, sz * (D / 2 + 0.005)] });
    m.add(K.box(0.02, 0.18, 0.07), { color:'glass:2', t:[W / 2 + 0.2, 0.24, 0] });
    const tx = -W / 2 - 0.12, TH = 1.0;                                                                               // torony
    m.add(cb(0.32, TH, 0.32, 0.02), { color:'white:2', t:[tx, TH / 2, 0] });
    m.add(cb(0.36, 0.04, 0.36, 0.01), { color:'steel:2', t:[tx, TH - 0.25, 0] });                                    // párkány
    for(const [dx, dz, w, d] of [[0, 0.162, 0.08, 0.01], [0, -0.162, 0.08, 0.01], [0.162, 0, 0.01, 0.08], [-0.162, 0, 0.01, 0.08]]){
      m.add(K.box(w, 0.13, d), { color:'dark:2', t:[tx + dx, TH - 0.1, dz] });                                        // harangablak
      m.add(K.box(w, 0.1, d), { color:'glass:2', t:[tx + dx, 0.5, dz] }); }                                          // toronyablak
    m.add(K.box(0.02, 0.2, 0.12), { color:'dark:2', t:[tx - 0.162, 0.1, 0] });                                       // kapu
    m.add(cb(0.36, 0.035, 0.36, 0.01), { color:'teal:1', t:[tx, TH + 0.015, 0] });
    m.add(K.cylinder(0, 0.25, 0.46, 4), { color:'teal:1', t:[tx, TH + 0.26, 0], r:[0, 45, 0] });                     // gúlasisak
    m.add(K.sphere(0.03, 8, 5), { color:'gold:1', t:[tx, TH + 0.5, 0] });
    m.add(K.box(0.015, 0.12, 0.015), { color:'gold:1', t:[tx, TH + 0.58, 0] });
    m.add(K.box(0.06, 0.015, 0.015), { color:'gold:1', t:[tx, TH + 0.6, 0] });
    return m;
  }

  // BOLT: földszintes, lapos tetős; nagy kirakat, üvegajtó, csíkos napellenző, felirat nélküli tábla, előtte gyümölcsös ládák
  // és virágcserepek. Kb. 1,0 × 0,9.
  function shop(K){
    const m = K.model(), cb = K.chamferBox, W = 0.9, D = 0.56, H = 0.38, F = -0.12 + D / 2;
    m.add(cb(W + 0.12, 0.03, 0.9, 0.01), { color:'steel:2', t:[0, 0.015, 0] });                                      // járda
    m.add(cb(W, H, D, 0.025), { color:'sage:1', t:[0, H / 2, -0.12] });
    m.add(cb(W + 0.04, 0.04, D + 0.04, 0.01), { color:'steel:2', t:[0, H + 0.02, -0.12] });                           // tetőperem
    for(const x of [-0.26, 0.2]) m.add(cb(0.3, 0.2, 0.02, 0.006), { color:'glass:1', t:[x, 0.15, F + 0.005] });     // kirakat
    m.add(K.box(0.12, 0.24, 0.02), { color:'glass:1', t:[-0.03, 0.14, F + 0.006] });                               // ajtó
    m.add(K.box(0.54, 0.07, 0.02), { color:'leaf:1', t:[0, H - 0.035, F + 0.01] });                                  // üres tábla
    const n = 7;                                                                                                      // napellenző
    for(let i = 0; i < n; i++) m.add(K.box(W / n, 0.012, 0.18), { color:i % 2 ? 'white:1' : 'honey:1', t:[-W / 2 + (i + 0.5) * W / n, 0.28, F + 0.08], r:[22, 0, 0] });
    for(let i = 0; i < n; i++) m.add(K.box(W / n, 0.04, 0.008), { color:i % 2 ? 'white:1' : 'honey:1', t:[-W / 2 + (i + 0.5) * W / n, 0.23, F + 0.165] });
    for(const [x, c] of [[-0.3, 'tomato:1'], [-0.14, 'leaf:1']]){                                                    // gyümölcsös ládák
      m.add(cb(0.13, 0.06, 0.09, 0.008), { color:'honey:1', t:[x, 0.06, F + 0.14] });
      for(let k = 0; k < 4; k++) m.add(blob(K, 0.025, 330 + k + x * 10, 6), { color:c, t:[x - 0.04 + (k % 2) * 0.05 + (k > 1 ? 0.03 : 0), 0.1, F + 0.12 + (k > 1 ? 0.035 : 0)] }); }
    for(const x of [0.2, 0.38]){ m.add(K.lathe([[0.03, 0.03], [0.042, 0.1]], 8), { color:'honey:1', t:[x, 0, F + 0.14] });   // cserepek
      m.add(blob(K, 0.06, 350 + x * 10, 8), { color:'leaf:1', t:[x, 0.14, F + 0.14] }); }
    return m;
  }

  // PARKOLÓ merőleges beállókkal a középső sáv két oldalán; felfestés, dobozautók (3 szín), a beállók kb. fele foglalt.
  function parking(K, o){
    o = o || {};
    const w = num(o.w, 2, 0.8, 5), d = num(o.d, 1.2, 0.9, 2), m = K.model(), R = rng(Math.round(w * 13 + d * 7)), SW = 0.24;
    const CARS = ['red:1', 'blue:1', 'honey:1'], ns = Math.max(2, Math.floor((w - 0.1) / SW));
    m.add(K.chamferBox(w, 0.03, d, 0.01), { color:'dark:0', t:[0, 0.015, 0] });
    let k = 0;
    for(const sz of [-1, 1]){ const zc = sz * (d / 2 - 0.22);
      for(let i = 0; i <= ns; i++) m.add(K.box(0.014, 0.004, 0.34), { color:'white:1', t:[-ns * SW / 2 + i * SW, 0.032, zc] });   // felfestés
      for(let i = 0; i < ns; i++){ if(R() < 0.45) continue;
        const x = -ns * SW / 2 + (i + 0.5) * SW, c = CARS[k++ % 3];
        m.add(K.chamferBox(0.15, 0.06, 0.3, 0.02), { color:c, t:[x, 0.06, zc] });                                     // karosszéria
        m.add(K.hull([[-0.065, 0, -0.09], [0.065, 0, -0.09], [0.065, 0, 0.08], [-0.065, 0, 0.08], [-0.055, 0.05, -0.06], [0.055, 0.05, -0.06], [0.055, 0.05, 0.03], [-0.055, 0.05, 0.03]]),
          { color:'glass:1', t:[x, 0.09, zc - sz * 0.01], r:[0, sz > 0 ? 180 : 0, 0] });                                // utastér
        m.add(K.box(0.11, 0.012, 0.09), { color:c, t:[x, 0.146, zc - sz * 0.02] });                                    // tető
        for(const dz of [-0.09, 0.09]) m.add(K.cylinder(0.03, 0.03, 0.16, 6), { color:'dark:2', t:[x, 0.032, zc + dz], r:[0, 0, 90] });   // kerekek
      } }
    return m;
  }

  // ================= ÚT, VÍZ, VASÚT =================
  // ÚT az X mentén: aszfalt szaggatott felező- és folytonos szélvonallal, két oldalt járda szegéllyel, kandeláberek váltakozva.
  function road(K, o){
    o = o || {};
    const len = num(o.len, 4, 0.5, 30), m = K.model();
    m.add(K.box(len, 0.03, 0.44), { color:'dark:0', t:[0, 0.015, 0] });
    for(const sz of [-1, 1]){
      m.add(K.chamferBox(len, 0.05, 0.15, 0.012), { color:'steel:1', t:[0, 0.025, sz * 0.295] });                      // járda
      m.add(K.box(len, 0.004, 0.014), { color:'white:1', t:[0, 0.031, sz * 0.19] });                                  // szélvonal
    }
    const nd = Math.max(1, Math.floor(len / 0.3));
    for(let i = 0; i < nd; i++) m.add(K.box(0.14, 0.004, 0.022), { color:'white:1', t:[-len / 2 + (i + 0.5) * len / nd, 0.031, 0] });   // felező
    const nl = Math.max(1, Math.round(len / 1.6));
    for(let i = 0; i < nl; i++){ const x = -len / 2 + (i + 0.5) * len / nl, sz = i % 2 ? -1 : 1, z = sz * 0.33;
      m.add(K.cylinder(0.012, 0.018, 0.42, 6), { color:'steel:2', t:[x, 0.26, z] });
      m.add(K.box(0.018, 0.018, 0.1), { color:'steel:2', t:[x, 0.46, z - sz * 0.045] });
      m.add(K.chamferBox(0.05, 0.03, 0.07, 0.008), { color:'honey:0', t:[x, 0.445, z - sz * 0.09] }); }
    return m;
  }

  // PATAK az X mentén – RÉSZEK: body (meder, füves partok, kövek, nád, gyékény) + water (vízfelszín fodrokkal: a játék áttetszővé teszi)
  function stream(K, o){
    o = o || {};
    const len = num(o.len, 4, 0.5, 30), body = K.model(), water = K.model(), R = rng(Math.round(len * 17) + 3);
    body.add(K.box(len, 0.02, 0.46), { color:'water:3', t:[0, 0.01, 0] });                                          // meder
    for(const sz of [-1, 1]) body.add(alongX(K, [[0.17, 0], [0.42, 0], [0.42, 0.04], [0.3, 0.07], [0.2, 0.05]].map(([z, y]) => [sz * z, y]), len), { color:'grass:1', ...AX });   // füves partok
    const ns = Math.max(2, Math.round(len / 0.35));
    for(let i = 0; i < ns; i++){ const x = -len / 2 + (i + 0.5) * len / ns + (R() - 0.5) * 0.1, sz = i % 2 ? -1 : 1, r = 0.035 + R() * 0.025;   // partkövek
      body.add(blob(K, r, 400 + i, 8), { color:'steel:2', t:[x, 0.035, sz * (0.19 + R() * 0.03)], s:[1.3, 0.7, 1] }); }
    const nr = Math.max(1, Math.round(len / 0.8));
    for(let i = 0; i < nr; i++){ const x = -len / 2 + (i + 0.5) * len / nr, sz = i % 2 ? 1 : -1, z = sz * 0.23;       // nádcsomók
      for(let k = 0; k < 4; k++){ const bx = x + (k - 1.5) * 0.025, h = 0.2 + R() * 0.1;
        rod(body, K, [bx, 0.04, z], [bx + (R() - 0.5) * 0.05, h, z + sz * 0.02], 0.008, 0.002, 3, 'leaf:1'); }
      body.add(K.cylinder(0.011, 0.011, 0.05, 6), { color:'chocolate:1', t:[x, 0.2, z + sz * 0.01] }); }
    water.add(K.box(len, 0.012, 0.4), { color:'water:1', t:[0, 0.036, 0] });
    const nf = Math.max(1, Math.round(len / 0.5));
    for(let i = 0; i < nf; i++) water.add(K.box(0.12 + R() * 0.08, 0.004, 0.018), { color:'water:0', t:[-len / 2 + (i + 0.5) * len / nf, 0.044, (R() - 0.5) * 0.24] });   // fodrok
    return { body, water };
  }

  // KIS KŐHÍD: az átkelés iránya X (a patak alatta Z irányban folyik); boltív kváderkövekkel, púpos úttest, mellvéd oszlopokkal.
  // Fesztáv 0,68 (a patak 0,46 széles), teljes hossz 1,3, szélesség 0,46.
  function bridge(K){
    const m = K.model(), cb = K.chamferBox, A = 0.34, B = 0.17, arch = [];
    for(let i = 0; i <= 8; i++){ const t = Math.PI - i / 8 * Math.PI; arch.push([Math.cos(t) * A, Math.sin(t) * B]); }
    const top = [[0.65, 0.2], [0.32, 0.25], [0, 0.26], [-0.32, 0.25], [-0.65, 0.2]];
    m.add(K.extrude([[-0.65, 0], ...arch, [0.65, 0], ...top], 0.4), { color:'steel:1' });                               // híd teste
    for(const sz of [-1, 1]) for(let i = 0; i < 7; i++){ const t = Math.PI - (i + 0.5) / 7 * Math.PI, rr = 1.12;       // kváderív
      m.add(K.box(0.045, 0.07, 0.02), { color:'steel:2', t:[Math.cos(t) * A * rr, Math.sin(t) * B * rr + 0.02, sz * 0.205], r:[0, 0, (t - Math.PI / 2) * 180 / Math.PI] }); }
    for(const sx of [-1, 1]){ const a = Math.atan2(0.06, 0.65) * 180 / Math.PI * sx;
      m.add(cb(0.66, 0.02, 0.3, 0.006), { color:'dark:0', t:[sx * 0.33, 0.24, 0], r:[0, 0, -a] });                     // úttest
      for(const sz of [-1, 1]) m.add(cb(0.66, 0.08, 0.05, 0.012), { color:'steel:2', t:[sx * 0.33, 0.28, sz * 0.2], r:[0, 0, -a] });   // mellvéd
    }
    for(const x of [-0.66, 0.66]) for(const sz of [-1, 1]) m.add(cb(0.08, 0.3, 0.08, 0.015), { color:'steel:2', t:[x, 0.15, sz * 0.2] });   // végoszlopok
    for(const x of [-0.66, 0.66]) for(const sz of [-1, 1]) m.add(K.cylinder(0.03, 0.045, 0.03, 6), { color:'steel:1', t:[x, 0.315, sz * 0.2] });
    for(const [x, z] of [[-0.45, 0.25], [0.48, -0.25], [-0.5, -0.24], [0.42, 0.26]]) m.add(blob(K, 0.06, 450 + x * 10 + z, 8), { color:'leaf:1', t:[x, 0.03, z], s:[1.3, 0.7, 1] });
    return m;
  }

  // VASÚTI TÖLTÉS az X mentén: füves rézsű (vadvirágokkal – élőhely!), zúzottkő ágyazat, talpfák, sínpár, felsővezeték-oszlopok.
  function railway(K, o){
    o = o || {};
    const len = num(o.len, 4, 0.5, 30), m = K.model(), R = rng(Math.round(len * 11) + 5);
    m.add(alongX(K, [[-0.5, 0], [0.5, 0], [0.2, 0.18], [-0.2, 0.18]], len), { color:'grass:2', ...AX });              // rézsű
    m.add(alongX(K, [[-0.21, 0.175], [0.21, 0.175], [0.15, 0.225], [-0.15, 0.225]], len), { color:'steel:2', ...AX }); // ágyazat
    const nt = Math.max(2, Math.round(len / 0.14));
    for(let i = 0; i < nt; i++) m.add(K.box(0.04, 0.02, 0.24), { color:'wood:2', t:[-len / 2 + (i + 0.5) * len / nt, 0.232, 0] });   // talpfák
    for(const sz of [-1, 1]) m.add(K.box(len, 0.022, 0.016), { color:'steel:3', t:[0, 0.25, sz * 0.07] });           // sínek
    const nf = Math.max(2, Math.round(len * 4));
    for(let i = 0; i < nf; i++){ const x = -len / 2 + (i + 0.5) * len / nf + (R() - 0.5) * 0.1, sz = i % 2 ? 1 : -1, t = 0.25 + R() * 0.5;   // rézsű-virágok
      const z = sz * (0.2 + t * 0.3), y = 0.18 * (1 - (Math.abs(z) - 0.2) / 0.3);
      m.add(blob(K, 0.03, 470 + i, 5), { color:i % 3 ? 'honey:1' : 'purple:1', t:[x, y + 0.03, z], s:[1, 0.6, 1] }); }
    const np = Math.max(1, Math.round(len / 2));
    for(let i = 0; i < np; i++){ const x = -len / 2 + (i + 0.5) * len / np;                                          // felsővezeték
      m.add(K.cylinder(0.014, 0.02, 0.5, 6), { color:'steel:3', t:[x, 0.45, -0.19] });
      m.add(K.box(0.016, 0.016, 0.2), { color:'steel:3', t:[x, 0.66, -0.1] }); }
    return m;
  }

  // ================= ZÖLD TERÜLETEK =================
  // TEMETŐ (nyugodt, pasztell, nem komor): alacsony sövény körben kapunyílással, kavicsos kereszt-sétány, négy parcellában
  // lekerekített kövek sorokban, előttük virág, a sarkokon oszlopos tuják. w × d (alap 2 × 1,4).
  function cemetery(K, o){
    o = o || {};
    const w = num(o.w, 2, 1, 4), d = num(o.d, 1.4, 0.8, 3), m = K.model(), cb = K.chamferBox, R = rng(Math.round(w * 5 + d * 3));
    m.add(cb(w, 0.04, d, 0.012), { color:'grass:1', t:[0, 0.02, 0] });
    const hw = 0.07, hh = 0.14, gap = 0.3;
    m.add(cb(w, hh, hw, 0.025), { color:'leaf:2', t:[0, hh / 2, -d / 2 + hw / 2] });                                // sövény
    for(const sx of [-1, 1]){ m.add(cb(hw, hh, d - 2 * hw, 0.025), { color:'leaf:2', t:[sx * (w / 2 - hw / 2), hh / 2, 0] });
      m.add(cb((w - gap) / 2, hh, hw, 0.025), { color:'leaf:2', t:[sx * (w + gap) / 4, hh / 2, d / 2 - hw / 2] }); }
    m.add(K.box(w - 0.16, 0.012, 0.12), { color:'cream:2', t:[0, 0.045, 0] });                                       // sétányok
    m.add(K.box(0.12, 0.012, d - 0.1), { color:'cream:2', t:[0, 0.045, 0.02] });
    const stone = K.extrude([[-0.045, 0], [0.045, 0], [0.045, 0.08], [0.03, 0.105], [0, 0.115], [-0.03, 0.105], [-0.045, 0.08]], 0.03);
    const qw = (w - 0.3) / 2, qd = (d - 0.3) / 2, nx = Math.max(1, Math.floor(qw / 0.24)), nz = Math.max(1, Math.floor(qd / 0.26));
    let k = 0;
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) for(let i = 0; i < nx; i++) for(let j = 0; j < nz; j++){
      const x = sx * (0.12 + (i + 0.5) * qw / nx), z = sz * (0.12 + (j + 0.5) * qd / nz) - 0.03;
      m.add(stone, { color:'steel:1', t:[x, 0.04, z], r:[0, (R() - 0.5) * 8, 0] });
      if(k++ % 2 === 0) m.add(blob(K, 0.03, 480 + k, 5), { color:k % 4 === 1 ? 'blossom:1' : 'honey:1', t:[x, 0.06, z + 0.06], s:[1.3, 0.7, 1] });   // virág
    }
    for(const sx of [-1, 1]) for(const sz of [-1, 1])                                                                 // oszlopos tuják a sarkokon
      m.add(blob(K, 0.09, 520 + sx + sz * 3, 12), { color:'leaf:2', t:[sx * (w / 2 - 0.16), 0.22, sz * (d / 2 - 0.16)], s:[1, 2.4, 1] });
    return m;
  }

  // GYÜMÖLCSÖS: fasorok az X mentén, köztük kaszált sávok; évszak szerint: tavasszal fehér-rózsaszín virág (kora tavaszi
  // táplálék!), nyáron piros alma, ősszel színes lomb, télen kopasz ágak. w × d (alap 2 × 1,4).
  function orchard(K, o){
    o = o || {};
    const w = num(o.w, 2, 0.8, 5), d = num(o.d, 1.4, 0.6, 4), se = seasonOf(o), m = K.model();
    m.add(K.chamferBox(w, 0.04, d, 0.012), { color:'grass:1', t:[0, 0.02, 0] });
    const nr = Math.max(1, Math.round((d - 0.1) / 0.45)), nt = Math.max(1, Math.round((w - 0.1) / 0.55));
    const extra = { tavasz:'blossom:0', nyar:'red:1', osz:'red:1', tel:null }[se];
    for(let r = 0; r < nr; r++){ const z = -d / 2 + (r + 0.5) * d / nr;
      if(r) m.add(K.box(w - 0.1, 0.008, 0.12), { color:'grass:0', t:[0, 0.044, z - d / nr / 2] });                  // kaszált sáv
      for(let i = 0; i < nt; i++) smallTree(m, K, -w / 2 + (i + 0.5) * w / nt + (r % 2 ? 0.08 : -0.08), z, 0.72, se, 540 + r * 20 + i * 3, extra); }
    return m;
  }

  // PARK: kör alakú sétány négy bevezetővel, középen virágágy, három nagy fa, két pad. w × d (alap 2 × 1,4).
  function park(K, o){
    o = o || {};
    const w = num(o.w, 2, 1.2, 5), d = num(o.d, 1.4, 1, 4), se = seasonOf(o), m = K.model(), cb = K.chamferBox, rr = Math.min(w, d) * 0.3;
    m.add(cb(w, 0.04, d, 0.012), { color:'grass:1', t:[0, 0.02, 0] });
    m.add(K.torus(rr, 0.065, 16, 4), { color:'cream:2', t:[0, 0.045, 0], s:[1, 0.25, 1] });                              // körsétány
    m.add(K.box(w - 0.02, 0.012, 0.1), { color:'cream:2', t:[0, 0.045, 0] });
    m.add(K.box(0.1, 0.012, d - 0.02), { color:'cream:2', t:[0, 0.045, 0] });
    m.add(K.cylinder(rr * 0.5, rr * 0.55, 0.06, 12), { color:'leaf:2', t:[0, 0.06, 0] });                             // virágágy
    for(let i = 0; i < 9; i++){ const [x, z] = spread(i, 9, rr * 0.42, 0.3);
      m.add(blob(K, 0.035, 560 + i, 5), { color:se === 'tel' ? 'white:1' : (i % 3 ? 'blossom:1' : 'honey:1'), t:[x, 0.1, z] }); }
    for(const [x, z, s] of [[-w * 0.33, -d * 0.3, 1.2], [w * 0.34, -d * 0.28, 1.05], [w * 0.32, d * 0.3, 1.1]]) smallTree(m, K, x, z, s, se, 580 + Math.round(x * 10));
    for(const [x, z, ry] of [[-rr - 0.14, d * 0.28, 90], [rr * 0.2, -rr - 0.12, 0]]){                                 // padok
      const b = K.model();
      b.add(cb(0.26, 0.025, 0.08, 0.008), { color:'wood:2', t:[0, 0.07, 0] });
      b.add(cb(0.26, 0.06, 0.02, 0.006), { color:'wood:2', t:[0, 0.12, -0.04], r:[-10, 0, 0] });
      for(const sx of [-1, 1]) b.add(K.box(0.02, 0.07, 0.08), { color:'wood:2', t:[sx * 0.1, 0.035, 0] });
      m.merge(b, { t:[x, 0.04, z], r:[0, ry, 0] }); }
    return m;
  }

  // ================= FOLYOSÓ-SZAKASZOK (az X mentén, len hosszal; a játék két pont közé nyújtja/forgatja) =================
  // VIRÁGSÁV: 0,3 széles füves sáv fűcsomókkal és vadvirágokkal (tavasszal kevés sárga-fehér, nyáron dús tarka, ősszel lila-
  // sárga, télen száraz szárak magházzal)
  function flowerStrip(K, o){
    o = o || {};
    const len = num(o.len, 2, 0.3, 20), se = seasonOf(o), m = K.model(), R = rng(Math.round(len * 23) + 7);
    m.add(K.chamferBox(len, 0.04, 0.3, 0.012), { color:se === 'tel' ? 'sage:2' : 'grass:1', t:[0, 0.02, 0] });
    const leaf = { tavasz:'leaf:0', nyar:'leaf:1', osz:'grass:2', tel:'cardboard:1' }[se];
    const cols = { tavasz:['honey:1', 'white:1'], nyar:['blossom:1', 'honey:1', 'white:1', 'purple:1'], osz:['purple:1', 'honey:2'], tel:['cardboard:2'] }[se];
    // lombos bokrocskák a sáv mentén (két sorban, eltolva) – ettől látszik a sáv felülnézetből is
    const nb = Math.max(2, Math.round(len / 0.16)), big = se === 'tavasz' ? 0.75 : se === 'tel' ? 0.6 : 1;
    for(let i = 0; i < nb; i++) m.add(blob(K, 0.075 * big, 600 + i, 8), { color:leaf, t:[-len / 2 + (i + 0.5) * len / nb, 0.04, (i % 2 ? 0.07 : -0.07) + (R() - 0.5) * 0.03], s:[1.2, 0.7, 1] });
    const N = Math.max(2, Math.round(len * { tavasz:6, nyar:12, osz:8, tel:5 }[se]));
    for(let i = 0; i < N; i++){ const x = -len / 2 + (i + 0.5) * len / N + (R() - 0.5) * 0.05, z = (R() - 0.5) * 0.22, h = (se === 'tavasz' ? 0.09 : 0.13) + R() * 0.06;
      rod(m, K, [x, 0.04, z], [x + (R() - 0.5) * 0.03, h, z], 0.008, 0.006, 3, se === 'tel' ? 'cardboard:1' : 'leaf:1');
      m.add(blob(K, se === 'tel' ? 0.02 : 0.036, 640 + i, 6, 0.1), { color:cols[i % cols.length], t:[x, h + 0.01, z], s:[1, se === 'tel' ? 1.4 : 0.6, 1] }); }
    return m;
  }

  // SÖVÉNY-SZAKASZ: 0,3 széles ültetősáv, sötét mag, rajta lombcsomók (tavasszal fehér virág, ősszel piros bogyó, télen kopasz
  // vesszők hósapkával, néhány bogyóval a madaraknak)
  function hedgeStrip(K, o){
    o = o || {};
    const len = num(o.len, 2, 0.3, 20), se = seasonOf(o), fol = FOL[se], m = K.model(), R = rng(Math.round(len * 29) + 11);
    m.add(K.chamferBox(len, 0.03, 0.3, 0.01), { color:'soil:1', t:[0, 0.015, 0] });
    if(!fol){
      const n = Math.max(3, Math.round(len / 0.1));
      for(let i = 0; i < n; i++){ const x = -len / 2 + (i + 0.5) * len / n, t = [x + (R() - 0.5) * 0.08, 0.26 + R() * 0.08, (R() - 0.5) * 0.16];
        rod(m, K, [x, 0.03, 0], t, 0.014, 0.005, 4, 'wood:2');
        if(i % 3 === 0) m.add(blob(K, 0.02, 640 + i, 5), { color:'red:1', t }); }
      m.add(K.chamferBox(len - 0.04, 0.02, 0.22, 0.008), { color:'white:1', t:[0, 0.04, 0] });                        // hó a tövön
      return m;
    }
    m.add(K.chamferBox(len - 0.06, 0.2, 0.18, 0.05), { color:fol[2], t:[0, 0.13, 0] });                               // sötét mag
    const nt = Math.max(2, Math.round(len / 0.18)), tops = [];
    for(let i = 0; i < nt; i++) tops.push([-len / 2 + (i + 0.5) * len / nt, 0.26 + (i % 2) * 0.03, (R() - 0.5) * 0.04, 0.11]);
    const ns = Math.max(1, Math.round(len / 0.28));
    for(const sz of [-1, 1]) for(let i = 0; i < ns; i++) tops.push([-len / 2 + (i + 0.5) * len / ns, 0.14, sz * 0.08, 0.1]);
    tops.forEach((c, i) => m.add(blob(K, c[3], 660 + i, 10), { color:fol[i % 2], t:c.slice(0, 3) }));
    const dots = { tavasz:'white:1', osz:'red:1' }[se];
    if(dots) for(let i = 0; i < Math.round(len * 6); i++){ const c = tops[(i * 3) % tops.length], a = R() * 6.28, e = R() * 1.1;
      m.add(blob(K, 0.022, 700 + i, 5), { color:dots, t:[c[0] + Math.cos(a) * Math.cos(e) * c[3], c[1] + Math.sin(e) * c[3], c[2] + Math.sin(a) * Math.cos(e) * c[3]] }); }
    return m;
  }

  // FASOR-SZAKASZ (pl. hárs): füves sáv, fák ~0,6-onként; nyáron apró sárgás virágzat, ősszel sárga lomb, télen kopasz
  function treeRow(K, o){
    o = o || {};
    const len = num(o.len, 3, 0.4, 20), se = seasonOf(o), m = K.model(), n = Math.max(1, Math.round(len / 0.6));
    m.add(K.chamferBox(len, 0.03, 0.22, 0.01), { color:'grass:1', t:[0, 0.015, 0] });
    for(let i = 0; i < n; i++) smallTree(m, K, -len / 2 + (i + 0.5) * len / n, 0, 1.05, se, 740 + i * 5, se === 'nyar' ? 'honey:0' : null);
    return m;
  }

  // FRISSEN KASZÁLT RÉT: nyírás-csíkok két zöldben, rendre gereblyézett széna, a szélén néhány meghagyott fűcsomó – virág nincs
  function mowed(K, o){
    o = o || {};
    const w = num(o.w, 2, 0.5, 6), d = num(o.d, 1.4, 0.5, 4), m = K.model(), R = rng(Math.round(w * 7 + d * 5) + 13);
    const ns = Math.max(2, Math.round(d / 0.2));
    for(let i = 0; i < ns; i++) m.add(K.box(w, 0.03, d / ns), { color:i % 2 ? 'grass:0' : 'grass:1', t:[0, 0.015, -d / 2 + (i + 0.5) * d / ns] });
    const nr = Math.max(1, Math.round(d / 0.5)), nb = Math.max(1, Math.round(w / 0.35));
    for(let r = 0; r < nr; r++) for(let i = 0; i < nb; i++)                                                        // széna-rendek
      m.add(blob(K, 0.07, 780 + r * 10 + i, 9), { color:(r + i) % 3 ? 'grass:2' : 'honey:2', t:[-w / 2 + (i + 0.5) * w / nb + (R() - 0.5) * 0.04, 0.04, -d / 2 + (r + 0.5) * d / nr], s:[2.6, 0.55, 1] });
    for(let i = 0; i < Math.round(w * 4); i++) tuft(m, K, -w / 2 + 0.04 + R() * (w - 0.08), (R() < 0.5 ? -1 : 1) * (d / 2 - 0.04), 0.08, 'grass:2', R);
    return m;
  }

  // ================= ÉLŐHELY-PONT =================
  // Hatszögletű füves talapzat (Ø ≈ 0,94 – belefér egy mezőbe), körben fűcsomók, a kind szerinti EGY jellegzetes elemmel:
  // kert (lécke­rítés-darab, bokor, virágok) · ret (magas vadvirágok) · rezsu (napos, ferde földhát kővel) · patakpart (tavacska,
  // nád, kövek) · udvar (térkő + ládás cserje) · agyas (magaságyás virágokkal). Álnevek: NODE_ALIAS.
  const NODE_KINDS = ['kert', 'ret', 'rezsu', 'patakpart', 'udvar', 'agyas'];
  const NODE_ALIAS = { park:'ret', parlag:'ret', temeto:'kert', gyumolcsos:'kert', hars:'kert', iskolakert:'agyas', foter:'agyas', lakotelep:'udvar', patak:'patakpart', vasut:'rezsu' };
  function node(K, o){
    o = o || {};
    const kind = NODE_KINDS.includes(o.kind) ? o.kind : (NODE_ALIAS[o.kind] || 'ret'), m = K.model(), R = rng(NODE_KINDS.indexOf(kind) * 31 + 17);
    m.add(K.lathe([[0.44, 0], [0.47, 0.03], [0.47, 0.05]], 6), { color:'soil:1' });
    m.add(K.lathe([[0.47, 0.05], [0.43, 0.09], [0, 0.09]], 6), { color:'grass:1' });
    for(let i = 0; i < 6; i++){ const a = (i + 0.5) / 6 * Math.PI * 2; tuft(m, K, Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0.16, 'leaf:1', R); }
    const Y = 0.09;
    if(kind === 'kert'){
      for(let i = 0; i < 4; i++) m.add(K.extrude([[-0.025, 0], [0.025, 0], [0.025, 0.16], [0, 0.19], [-0.025, 0.16]], 0.015), { color:'wood:1', t:[-0.2 + i * 0.07, Y, -0.18] });
      m.add(K.box(0.28, 0.025, 0.012), { color:'wood:1', t:[-0.1, Y + 0.1, -0.19] });
      m.add(blob(K, 0.14, 820, 12), { color:'leaf:1', t:[0.12, Y + 0.11, -0.05] });
      for(let i = 0; i < 6; i++){ const [x, z] = spread(i, 6, 0.12, 0.5); m.add(blob(K, 0.03, 830 + i, 5), { color:i % 2 ? 'blossom:1' : 'honey:1', t:[x - 0.08, Y + 0.05, z + 0.14] }); }
    }else if(kind === 'ret'){
      for(let i = 0; i < 10; i++){ const [x, z] = spread(i, 10, 0.26, 0.9), h = Y + 0.16 + R() * 0.1;
        rod(m, K, [x, Y, z], [x, h, z], 0.008, 0.006, 3, 'leaf:1');
        m.add(blob(K, 0.03, 850 + i, 6, 0.1), { color:['blossom:1', 'honey:1', 'purple:1', 'white:1'][i % 4], t:[x, h, z], s:[1, 0.6, 1] }); }
    }else if(kind === 'rezsu'){
      m.add(K.hull([[-0.3, 0, -0.22], [0.3, 0, -0.22], [-0.3, 0, 0.22], [0.3, 0, 0.22], [-0.26, 0.18, -0.2], [0.26, 0.18, -0.2], [-0.24, 0.02, 0.2], [0.24, 0.02, 0.2]]), { color:'grass:2', t:[0, Y, 0] });
      m.add(blob(K, 0.08, 870, 10), { color:'steel:2', t:[0.18, Y + 0.12, -0.05], s:[1.2, 0.7, 1] });
      m.add(blob(K, 0.035, 871, 8), { color:'soil:2', t:[-0.1, Y + 0.08, 0.02], s:[1.4, 0.5, 1] });                    // csupasz folt (napos, laza talaj)
      for(let i = 0; i < 7; i++){ const x = -0.22 + i * 0.07, z = -0.14 + (i % 3) * 0.1, y = Y + 0.17 * (1 - (z + 0.2) / 0.4) + 0.01;   // napos lejtő virágai
        rod(m, K, [x, y - 0.02, z], [x, y + 0.05, z], 0.006, 0.005, 3, 'leaf:1');
        m.add(blob(K, 0.024, 875 + i, 5), { color:i % 2 ? 'honey:1' : 'purple:1', t:[x, y + 0.055, z], s:[1, 0.6, 1] }); }
    }else if(kind === 'patakpart'){
      m.add(K.cylinder(0.2, 0.2, 0.012, 10), { color:'water:1', t:[0.05, Y + 0.003, 0.05], s:[1.3, 1, 1] });
      for(let i = 0; i < 6; i++){ const x = -0.26 + (i % 3) * 0.04, z = -0.14 - Math.floor(i / 3) * 0.05, h = Y + 0.24 + R() * 0.1;
        rod(m, K, [x, Y, z], [x + (R() - 0.5) * 0.06, h, z], 0.01, 0.003, 3, 'leaf:1');
        if(i % 3 === 0) m.add(K.cylinder(0.013, 0.013, 0.06, 6), { color:'chocolate:1', t:[x, h - 0.06, z] }); }
      for(const [x, z] of [[0.3, 0.12], [-0.12, 0.26]]) m.add(blob(K, 0.05, 880 + x * 10, 8), { color:'steel:2', t:[x, Y + 0.02, z], s:[1.3, 0.7, 1] });
    }else if(kind === 'udvar'){
      for(let i = 0; i < 4; i++) m.add(K.chamferBox(0.16, 0.02, 0.16, 0.006), { color:'steel:1', t:[-0.09 + (i % 2) * 0.18, Y + 0.01, -0.09 + Math.floor(i / 2) * 0.18] });
      m.add(K.chamferBox(0.2, 0.1, 0.2, 0.012), { color:'wood:1', t:[0.2, Y + 0.05, -0.18] });
      m.add(blob(K, 0.13, 890, 12), { color:'leaf:1', t:[0.2, Y + 0.2, -0.18] });
    }else{                                                                                                            // agyas
      m.add(K.chamferBox(0.44, 0.1, 0.28, 0.015), { color:'wood:1', t:[0, Y + 0.05, 0] });
      m.add(K.box(0.4, 0.02, 0.24), { color:'soil:1', t:[0, Y + 0.1, 0] });
      for(let i = 0; i < 8; i++){ const x = -0.15 + (i % 4) * 0.1, z = i < 4 ? -0.06 : 0.06, h = Y + 0.18 + (i % 3) * 0.03;
        rod(m, K, [x, Y + 0.1, z], [x, h, z], 0.008, 0.006, 3, 'leaf:1');
        m.add(blob(K, 0.032, 900 + i, 6, 0.1), { color:['purple:1', 'honey:1', 'blossom:1'][i % 3], t:[x, h, z], s:[1, 0.6, 1] }); }
    }
    return m;
  }

  const VAROS_MODELS = Object.assign(root.VAROS_MODELS || {}, { SEASONS, NODE_KINDS, NODE_ALIAS, houses, blocks, school, church, shop, parking,
    road, stream, bridge, railway, cemetery, orchard, park, flowerStrip, hedgeStrip, treeRow, mowed, node, _h:{ tuft, smallTree, alongX, num } });
  root.VAROS_MODELS = VAROS_MODELS;                                            // böngészőben (és Node-ban is) globális
  if(typeof module !== 'undefined' && module.exports) module.exports = VAROS_MODELS;
})(typeof window !== 'undefined' ? window : globalThis);
