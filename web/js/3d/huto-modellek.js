// ============================================================
//  HŰTŐ-MESTER – a konyha 3D tárgyai B szinten (docs/rajzolas.md): letört élek, 12–16 szegmens, 4–6 szín tárgyanként
//
//  Elrendezés (Kristóf, 2026-09-17): egy sorban a fal tövében, balról jobbra ASZTAL · HŰTŐ FAGYASZTÓVAL · POLCRENDSZER
//  (a polc akkora, mint a hűtő). A méreteket a DIM adja – a huto.js ebből számolja a zónákat és a lerakási helyeket.
//  Helyi tengelyek minden tárgynál: origó a talpa közepe a FAL síkjában (z = 0), az eleje −Z felé (a játékos felé) áll.
//  Builderek: (K) => modell, ahol K a modell-készlet – a játékban window.MODEL (→ .toThree), Node-ban tools/modell-kit.js (→ .save GLB).
//  Fény-tanulság: tiszta fehér helyett white:2 test + white:1 kiemelés (különben kiég a cel-fényben); világos tárgyon sötét keret.
//  KIT-MÁSOLAT (beeco-jatek-kit, web/js/3d/): a globális név és a builderek aláírása VÁLTOZATLAN, így a játék a kit
//  példányát is betöltheti. Kell hozzá: js/ds.js, js/art/art.js, js/art/model-kit.js. Katalógus: 3d/katalogus.js, galéria: modellek.html.
// ============================================================
(function(root){
  const DIM = {
    fridge:{ w:3.4, d:1.9, h:6.9, freezer:2.0, shelves:[3.45, 4.95], door:{ w:1.8, bins:[-1.9, -0.55, 0.8] } },
    shelf:{ w:3.4, d:1.7, h:6.9, boards:[0.35, 1.95, 3.55, 5.15] },
    counter:{ w:7.8, d:2.6, h:2.4 },
  };

  // ---- HŰTŐ FAGYASZTÓVAL: felül a nyitott hűtőtér (fiók, alsó és felső polc), alul a zárt fagyasztó ----
  function fridge(K){
    const m = K.model(), cb = K.chamferBox, { w:W, d:D, h:H, freezer:FZ, shelves } = DIM.fridge;
    const body = H - 0.34, cy = 0.34 + body / 2;
    for(const sx of [-1, 1]) m.add(cb(0.22, body, D, 0.06), { color:'white:2', t:[sx * (W / 2 - 0.11), cy, -D / 2] });   // oldalfalak
    m.add(cb(W, 0.3, D + 0.04, 0.07), { color:'white:1', t:[0, H - 0.15, -D / 2] });            // teteje (világosabb)
    m.add(K.box(W - 0.2, 0.34, D - 0.3), { color:'steel:2', t:[0, 0.17, -D / 2 + 0.1] });       // lábazat (beljebb)
    m.add(K.box(W - 0.44, body, 0.12), { color:'white:2', t:[0, cy, -0.06] });                 // hátfal
    // — FAGYASZTÓ (zárt ajtó): fehér front, fém fogantyú, jégkristály-jel; felette sötét rés választja el a hűtőtértől —
    m.add(cb(W, FZ - 0.4, 0.22, 0.07), { color:'white:2', t:[0, 0.34 + (FZ - 0.4) / 2, -D - 0.04] });
    m.add(cb(W, 0.12, 0.24, 0.03), { color:'dark:1', t:[0, FZ - 0.02, -D + 0.02] });
    m.add(cb(1.7, 0.14, 0.16, 0.05), { color:'steel:1', t:[0, FZ - 0.3, -D - 0.22] });
    for(const a of [0, 60, 120]) m.add(K.box(0.07, 0.66, 0.04), { color:'sky:1', t:[0, 0.95, -D - 0.17], r:[0, 0, a] });
    // — hűtőtér belül —
    m.add(K.box(W - 0.44, 0.08, D - 0.2), { color:'white:2', t:[0, FZ + 0.1, -D / 2] });        // belső alj
    for(const sx of [-1, 1]) m.add(K.box(0.04, H - FZ - 0.4, D - 0.3), { color:'steel:0', t:[sx * (W / 2 - 0.26), (H + FZ) / 2 - 0.1, -D / 2] });
    for(const x of [-0.9, 0, 0.9]) m.add(K.box(0.05, H - FZ - 0.7, 0.04), { color:'steel:1', t:[x, (H + FZ) / 2, -0.14] });   // hátfal-bordák
    // sötét tömítéskeret a nyílás körül – ez adja a hűtő kontúrját a világos konyhában
    m.add(cb(W - 0.12, 0.2, 0.2, 0.06), { color:'dark:1', t:[0, H - 0.4, -D + 0.08] });
    m.add(cb(W - 0.12, 0.16, 0.2, 0.05), { color:'dark:1', t:[0, FZ + 0.1, -D + 0.08] });
    for(const sx of [-1, 1]) m.add(cb(0.2, H - FZ - 0.4, 0.2, 0.06), { color:'dark:1', t:[sx * (W / 2 - 0.12), (H + FZ) / 2 - 0.15, -D + 0.08] });
    // üvegpolcok fém elülső éllel (a fiók / alsó polc és az alsó / felső polc határa)
    for(const y of shelves){
      m.add(K.box(W - 0.5, 0.06, D - 0.4), { color:'glass:1', t:[0, y, -D / 2 + 0.05] });
      m.add(cb(W - 0.46, 0.12, 0.1, 0.03), { color:'steel:1', t:[0, y + 0.01, -D + 0.32] });
    }
    // zöldségfiók: áttetsző elülső lap, fogantyú-mélyedés, oldalsó sínek
    m.add(cb(W - 0.76, 1.14, 0.14, 0.05), { color:'glass:1', t:[0, FZ + 0.72, -D + 0.3] });
    m.add(cb(1.1, 0.14, 0.14, 0.05), { color:'steel:1', t:[0, FZ + 1.2, -D + 0.2] });
    for(const sx of [-1, 1]) m.add(K.box(0.06, 0.08, D - 0.5), { color:'steel:1', t:[sx * (W / 2 - 0.4), FZ + 1.3, -D / 2] });
    m.add(cb(1.2, 0.08, 0.14, 0.03), { color:'honey:0', t:[0, H - 0.62, -D / 2] });             // belső LED-fény a tetején
    return m;
  }

  // ---- HŰTŐAJTÓ (a hűtőtér ajtaja, szélesre tárva): origó az ajtó közepe; a belső oldala (a rekeszek) −Z felé néz ----
  function door(K){
    const m = K.model(), cb = K.chamferBox, { w:DW, bins } = DIM.fridge.door, DH = DIM.fridge.h - DIM.fridge.freezer - 0.1;
    m.add(cb(DW, DH, 0.2, 0.07), { color:'white:2', t:[0, 0, 0] });                             // ajtólap
    m.add(cb(DW + 0.12, DH + 0.12, 0.08, 0.04), { color:'dark:1', t:[0, 0, 0.13] });             // külső perem (sötét kontúr)
    m.add(cb(DW - 0.16, DH - 0.18, 0.06, 0.03), { color:'white:1', t:[0, 0, -0.12] });           // belső bélés
    for(const y of bins){                                                                         // 3 áttetsző rekesz
      m.add(cb(DW - 0.18, 0.7, 0.08, 0.03), { color:'glass:1', t:[0, y, -0.28] });
      m.add(K.box(DW - 0.22, 0.08, 0.42), { color:'glass:1', t:[0, y - 0.34, -0.13] });
      m.add(cb(DW - 0.14, 0.08, 0.1, 0.02), { color:'steel:1', t:[0, y + 0.36, -0.28] });
    }
    m.add(cb(0.14, 2.8, 0.14, 0.05), { color:'steel:1', t:[-DW / 2 + 0.28, 0, 0.24] });           // fogantyú (kívül, a nyitható szélen)
    for(const y of [-1.35, 1.35]) m.add(K.box(0.08, 0.08, 0.1), { color:'steel:2', t:[-DW / 2 + 0.28, y, 0.17] });
    return m;
  }

  // ---- POLCRENDSZER: nyitott fa polc, a hűtővel azonos méretben ----
  function shelf(K){
    const m = K.model(), cb = K.chamferBox, { w:W, d:D, h:H, boards } = DIM.shelf;
    for(const sx of [-1, 1]) m.add(cb(0.2, H - 0.2, D, 0.05), { color:'wood:2', t:[sx * (W / 2 - 0.1), (H - 0.2) / 2, -D / 2] });   // oldaloszlopok
    for(const y of boards){
      m.add(cb(W - 0.36, 0.14, D - 0.12, 0.04), { color:'wood:1', t:[0, y, -D / 2 - 0.02] });   // polclap
      m.add(K.box(W - 0.36, 0.05, 0.04), { color:'wood:2', t:[0, y - 0.05, -D + 0.08] });        // élárnyék
    }
    for(let i = 0; i < 5; i++) m.add(K.box((W - 0.4) / 5 - 0.02, H - 0.3, 0.1), { color:i % 2 ? 'wood:0' : 'cardboard:0', t:[-(W - 0.4) / 2 + (W - 0.4) / 10 + i * (W - 0.4) / 5, (H - 0.3) / 2, -0.05] });   // deszkás hátfal
    m.add(cb(W + 0.2, 0.22, D + 0.12, 0.05), { color:'wood:2', t:[0, H - 0.11, -D / 2 - 0.02] });   // tetőléc
    return m;
  }

  // ---- ASZTAL (konyhapult a fal mellett): fiókok és ajtók, fa lap – a lapon állnak az ételek ----
  function counter(K){
    const m = K.model(), cb = K.chamferBox, { w:W, d:D, h:H } = DIM.counter, bodyH = H - 0.5;
    m.add(cb(W, bodyH, D - 0.2, 0.06), { color:'cream:1', t:[0, 0.3 + bodyH / 2, -(D - 0.2) / 2] });   // szekrénytest
    m.add(K.box(W - 0.2, 0.3, D - 0.5), { color:'dark:1', t:[0, 0.15, -(D - 0.5) / 2] });             // lábazat (beljebb)
    m.add(cb(W + 0.2, 0.2, D + 0.05, 0.07), { color:'wood:1', t:[0, H - 0.1, -D / 2] });                // munkalap
    m.add(cb(W + 0.24, 0.1, 0.12, 0.03), { color:'wood:2', t:[0, H - 0.23, -D - 0.02] });               // lap élsáv
    for(const x of [-2.6, 0, 2.6]){                                                                     // 3 fiók + 3 ajtó, fogantyúval
      m.add(cb(2.44, 0.42, 0.06, 0.02), { color:'cream:0', t:[x, H - 0.52, -D + 0.17] });
      m.add(cb(0.8, 0.09, 0.09, 0.03), { color:'steel:1', t:[x, H - 0.52, -D + 0.1] });
      m.add(cb(2.44, bodyH - 0.62, 0.06, 0.02), { color:'cream:0', t:[x, 0.3 + (bodyH - 0.62) / 2 + 0.04, -D + 0.17] });
      m.add(cb(0.1, 0.5, 0.09, 0.03), { color:'steel:1', t:[x + 0.95, 1.2, -D + 0.1] });
    }
    return m;
  }

  // ---- FAL AZ ASZTAL FÖLÖTT: csempézett hátfal, két felső szekrény, köztük ablak függönnyel ----
  function wallUnit(K){
    const m = K.model(), cb = K.chamferBox, { w:W, h:H } = DIM.counter;
    m.add(K.box(W, 1.6, 0.06), { color:'white:1', t:[0, H + 0.8, -0.03] });                          // csempe
    for(const y of [H + 0.4, H + 0.8, H + 1.2]) m.add(K.box(W, 0.03, 0.02), { color:'white:2', t:[0, y, -0.07] });
    for(const x of [-2.7, -1.35, 0, 1.35, 2.7]) m.add(K.box(0.03, 1.6, 0.02), { color:'white:2', t:[x, H + 0.8, -0.07] });
    for(const sx of [-1, 1]){                                                                           // felső szekrények
      const cx = sx * 2.5;
      m.add(cb(2.8, 1.9, 1.1, 0.05), { color:'cream:1', t:[cx, H + 3.05, -0.55] });
      m.add(cb(2.94, 0.14, 1.22, 0.04), { color:'wood:2', t:[cx, H + 2.07, -0.58] });                 // alsó takaróléc
      for(const dx of [-0.7, 0.7]){
        m.add(cb(1.3, 1.7, 0.06, 0.02), { color:'cream:0', t:[cx + dx, H + 3.05, -1.13] });
        m.add(cb(0.1, 0.46, 0.1, 0.035), { color:'steel:1', t:[cx + dx - Math.sign(dx) * 0.48, H + 2.5, -1.19] });
      }
      m.add(cb(2.4, 0.06, 0.12, 0.02), { color:'honey:0', t:[cx, H + 1.97, -0.9] });                  // pult-világítás
    }
    m.add(K.box(1.8, 1.7, 0.06), { color:'sky:1', t:[0, H + 3.0, -0.04] });                            // ablak (az ég)
    for(const y of [H + 2.1, H + 3.9]) m.add(cb(2.2, 0.16, 0.2, 0.04), { color:'white:1', t:[0, y, -0.1] });
    for(const sx of [-1, 1]) m.add(cb(0.16, 1.96, 0.2, 0.04), { color:'white:1', t:[sx * 1.02, H + 3.0, -0.1] });
    m.add(K.box(0.07, 1.7, 0.1), { color:'white:2', t:[0, H + 3.0, -0.08] });                          // osztóléc
    m.add(cb(2.4, 0.1, 0.36, 0.03), { color:'white:2', t:[0, H + 2.0, -0.2] });                        // párkány
    for(const sx of [-1, 1]) m.add(cb(0.34, 1.9, 0.08, 0.03), { color:'blossom:1', t:[sx * 0.98, H + 3.05, -0.24] });   // függöny
    return m;
  }

  const HUTO_MODELS = { fridge, door, shelf, counter, wallUnit, DIM };
  if(typeof module !== 'undefined' && module.exports){ module.exports = HUTO_MODELS; return; }
  root.HUTO_MODELS = HUTO_MODELS;
})(typeof window !== 'undefined' ? window : globalThis);
