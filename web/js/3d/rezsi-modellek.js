// ============================================================
//  ÖKOS-REJTÉLY – a ház gépei és vizes berendezései B szinten (docs/rajzolas.md): letört élek, 12–16 szegmens, 4–6 szín
//
//  Minden builder a haz.json méreteiből dolgozik (w = szélesség elölről, h = magasság, d = mélység – játékegységben),
//  így a modell pontosan kitölti a tárgy helyét, és az ütközés, a jelölők, a hőkamera változatlan marad.
//  Helyi tengelyek: origó a talp közepe, Y fel, az ELEJE +Z felé néz. A beillesztést (forgatás, hőkamera, változat)
//  a rezsi-gepek.js végzi. Egy builder RÉSZEKET ad vissza ({ body, heat, … }), mert a részeknek más a szerepe:
//  a `heat` rész a hőkamerán a készülék hőjét mutatja, a többi (pl. `frost`, `eco`) csak egy választásnál látszik.
//  Fény-tanulság: tiszta fehér helyett white:2 test + white:1 kiemelés; világos tárgyon sötét keret (dark:1).
//  KIT-MÁSOLAT (beeco-jatek-kit, web/js/3d/): a globális név és a builderek aláírása VÁLTOZATLAN, így a játék a kit
//  példányát is betöltheti. Kell hozzá: js/ds.js, js/art/art.js, js/art/model-kit.js. Katalógus: 3d/katalogus.js, galéria: modellek.html.
// ============================================================
(function(root){
  const X90 = [90, 0, 0];                                                    // hengert/gyűrűt előre (+Z) fordít

  // ---- HŰTŐ-FAGYASZTÓ: felül fagyasztó, alul hűtőtér; régi (krémszínű, mágnesekkel) vagy új (acél, kijelzővel) ----
  function fridge(K, w, h, d, kind){
    const cb = K.chamferBox, body = K.model(), heat = K.model(), frost = K.model();
    const isNew = kind === 'new', col = isNew ? 'steel:1' : 'cream:1', top = isNew ? 'steel:0' : 'cream:0', edge = isNew ? 'steel:2' : 'cream:2';
    const pl = 0.12, fz = (h - pl)*0.3, split = h - fz - 0.02, fz0 = d/2 - 0.02;
    body.add(K.box(w - 0.12, pl, d - 0.2), { color:'dark:1', t:[0, pl/2, -0.05] });                    // lábazat (beljebb)
    body.add(cb(w, h - pl - 0.05, d - 0.1, 0.05), { color:edge, t:[0, pl + (h - pl - 0.05)/2, -0.06] });  // szekrény
    body.add(cb(w - 0.02, 0.06, d - 0.12, 0.02), { color:top, t:[0, h - 0.03, -0.06] });                 // világos teteje
    body.add(cb(w - 0.04, split - pl - 0.04, 0.1, 0.03), { color:col, t:[0, pl + (split - pl)/2, fz0] }); // hűtőajtó
    body.add(cb(w - 0.04, fz - 0.06, 0.1, 0.03), { color:col, t:[0, split + fz/2, fz0] });                // fagyasztóajtó
    body.add(K.box(w - 0.02, 0.05, 0.08), { color:'dark:1', t:[0, split, fz0 - 0.02] });                  // ajtórés (kontúr)
    const hx = -w/2 + 0.13;                                                                              // fogantyúk a nyitható szélen
    body.add(cb(0.07, 1.0, 0.1, 0.02), { color:isNew ? 'steel:3' : 'cream:3', t:[hx, split - 0.75, fz0 + 0.1] });
    body.add(cb(0.07, 0.5, 0.1, 0.02), { color:isNew ? 'steel:3' : 'cream:3', t:[hx, split + 0.35, fz0 + 0.1] });
    body.add(K.box(0.05, h - pl - 0.2, 0.03), { color:'white:0', t:[w/2 - 0.1, pl + (h - pl)/2, fz0 + 0.06] });   // fénycsík
    if(isNew){                                                                                           // kijelző és energiacímke-zöld jelzés
      body.add(cb(0.44, 0.24, 0.05, 0.02), { color:'dark:1', t:[0.1, split - 0.4, fz0 + 0.06] });
      body.add(K.box(0.26, 0.06, 0.03), { color:'leaf:0', t:[0.1, split - 0.37, fz0 + 0.09] });
      body.add(K.box(0.1, 0.05, 0.03), { color:'sky:1', t:[0.1, split - 0.46, fz0 + 0.09] });
    } else {                                                                                             // gyerekrajz és mágnesek
      body.add(K.box(0.5, 0.4, 0.02), { color:'paper:0', t:[0.08, split - 1.1, fz0 + 0.06] });
      body.add(K.box(0.3, 0.12, 0.02), { color:'leaf:1', t:[0.08, split - 1.2, fz0 + 0.075] });
      body.add(K.box(0.1, 0.1, 0.05), { color:'red:1', t:[0.08, split - 0.88, fz0 + 0.08] });
      body.add(K.box(0.09, 0.09, 0.05), { color:'sky:2', t:[0.28, split - 1.7, fz0 + 0.08] });
    }
    // dér és jégcsap a régi, jegesre állított gép fagyasztóján
    frost.add(cb(w - 0.3, fz*0.55, 0.05, 0.02), { color:'sky:0', t:[0.08, split + fz*0.52, fz0 + 0.07] });
    for(const [x, l] of [[-0.18, 0.22], [0.05, 0.32], [0.28, 0.18]]) frost.add(K.cylinder(0.005, 0.045, l, 6), { color:'glass:0', t:[x, split + 0.05 - l/2 + 0.02, fz0 + 0.1] });
    // hőcserélő a két oldalon és hátul: ez melegszik (a hőkamera ezt „látja"), rendes nézetben a szekrény színe
    for(const sx of [-1, 1]) heat.add(K.box(0.03, h - 0.7, d - 0.4), { color:edge, t:[sx*(w/2 + 0.015), h/2, -0.06] });
    for(let i = 0; i < 5; i++) heat.add(K.box(w - 0.3, 0.04, 0.04), { color:'dark:2', t:[0, 0.6 + i*(h - 1.2)/4, -d/2 - 0.05] });
    return { body, heat, frost };
  }

  // ---- ELÖLTÖLTŐS MOSÓGÉP / SZÁRÍTÓGÉP: kerek ajtó, kezelősáv tekerőgombbal; a mosógépen mosószer-fiók és víz az ablakban,
  //      a szárítón sötét dob, szöszszűrő-rács és víztartály-fiók (így ránézésre is megkülönböztethetők) ----
  function washer(K, w, h, d, dryer){
    const cb = K.chamferBox, body = K.model(), heat = K.model(), eco = K.model();
    const f = d/2, R = w*0.3, cy = h*0.43, strip = h*0.15;
    body.add(K.box(w - 0.1, 0.08, d - 0.12), { color:'dark:1', t:[0, 0.04, 0] });                        // lábazat
    body.add(cb(w, h - 0.08, d, 0.05), { color:'white:2', t:[0, 0.08 + (h - 0.08)/2, 0] });             // szekrény
    body.add(cb(w - 0.04, 0.05, d - 0.04, 0.02), { color:'white:1', t:[0, h - 0.02, 0] });              // teteje
    body.add(cb(w - 0.06, strip, 0.05, 0.02), { color:'white:1', t:[0, h - strip/2 - 0.05, f + 0.01] }); // kezelősáv
    body.add(K.cylinder(0.075, 0.08, 0.06, 14), { color:'steel:2', t:[w*0.28, h - strip/2 - 0.05, f + 0.05], r:X90 });   // programgomb
    body.add(cb(0.2, 0.09, 0.03, 0.01), { color:'dark:1', t:[w*0.02, h - strip/2 - 0.05, f + 0.045] });   // kijelző
    body.add(K.box(w - 0.1, 0.03, 0.04), { color:'dark:1', t:[0, h - strip - 0.07, f + 0.01] });         // sáv alja (kontúr)
    if(!dryer) body.add(cb(0.32, strip*0.6, 0.05, 0.02), { color:'steel:0', t:[-w*0.28, h - strip/2 - 0.05, f + 0.04] });   // mosószer-fiók
    else {
      body.add(cb(0.36, strip*0.6, 0.05, 0.02), { color:'sky:0', t:[-w*0.27, h - strip/2 - 0.05, f + 0.04] });              // víztartály-fiók
      for(let i = 0; i < 4; i++) body.add(K.box(w*0.5, 0.025, 0.03), { color:'steel:2', t:[0, 0.2 + i*0.045, f + 0.01] });    // szöszszűrő-rács
    }
    // ajtó: acél gyűrű + ablak; a mosógépben víz és ruha, a szárítóban sötét dob
    heat.add(K.torus(R, 0.055, 16, 6), { color:'steel:2', t:[0, cy, f + 0.04], r:X90 });
    heat.add(K.cylinder(R - 0.02, R - 0.02, 0.03, 16), { color:dryer ? 'dark:1' : 'glass:2', t:[0, cy, f + 0.03], r:X90 });
    if(!dryer){
      heat.add(K.box(R*1.4, R*0.55, 0.02), { color:'water:1', t:[0, cy - R*0.4, f + 0.05] });
      heat.add(K.cylinder(R*0.3, R*0.3, 0.02, 10), { color:'blossom:1', t:[-R*0.25, cy - R*0.25, f + 0.06], r:X90 });
    } else heat.add(K.cylinder(R*0.5, R*0.5, 0.02, 12), { color:'dark:2', t:[0, cy, f + 0.05], r:X90 });
    heat.add(K.box(0.06, 0.16, 0.05), { color:'steel:3', t:[R + 0.03, cy, f + 0.06] });                  // ajtókilincs
    // „új gép" jelzés: zöld levél-címke a kezelősávon
    eco.add(cb(0.16, 0.1, 0.03, 0.01), { color:'leaf:1', t:[-w*0.02, h - strip - 0.16, f + 0.02] });
    return { body, heat, eco };
  }

  // ---- BEÉPÍTETT MOSOGATÓGÉP előlapja: felül kezelősáv, alatta vízszintes fogantyú; nincs kerek ablak ----
  function dishwasher(K, w, h){
    const cb = K.chamferBox, body = K.model();
    body.add(cb(w, h, 0.06, 0.02), { color:'steel:1', t:[0, h/2, 0] });
    body.add(cb(w - 0.02, 0.16, 0.07, 0.02), { color:'steel:2', t:[0, h - 0.08, 0.005] });
    body.add(K.cylinder(0.025, 0.025, w - 0.24, 10), { color:'steel:3', t:[0, h - 0.26, 0.09], r:[0, 0, 90] });
    for(const x of [-(w - 0.3)/2, (w - 0.3)/2]) body.add(K.box(0.04, 0.04, 0.07), { color:'steel:3', t:[x, h - 0.26, 0.05] });
    body.add(K.box(0.04, h - 0.4, 0.02), { color:'white:0', t:[-w/2 + 0.12, (h - 0.3)/2, 0.04] });      // fénycsík
    return { body };
  }

  // ---- FALI GÁZKAZÁN: fehér doboz, alul kezelősáv kék kijelzővel, lefelé 4 cső (2 réz), felül füstcső ----
  function boiler(K, w, h, d, y){
    const cb = K.chamferBox, body = K.model(), f = d/2;
    body.add(cb(w, h, d, 0.05), { color:'white:2', t:[0, h/2, 0] });
    body.add(cb(w - 0.1, h*0.62, 0.04, 0.02), { color:'white:1', t:[0, h*0.6, f + 0.01] });            // előlap
    body.add(cb(w - 0.04, h*0.2, 0.06, 0.02), { color:'steel:1', t:[0, h*0.14, f + 0.01] });            // kezelősáv
    body.add(cb(0.22, 0.1, 0.03, 0.01), { color:'sky:2', t:[-w*0.12, h*0.14, f + 0.045] });             // kijelző
    for(const x of [w*0.18, w*0.32]) body.add(K.cylinder(0.04, 0.04, 0.04, 12), { color:'dark:1', t:[x, h*0.14, f + 0.05], r:X90 });
    body.add(K.cylinder(0.03, 0.03, 0.03, 10), { color:'ember:1', t:[-w*0.35, h*0.14, f + 0.05], r:X90 });   // láng-jelzőfény
    body.add(K.cylinder(0.11, 0.11, 0.35, 14), { color:'steel:1', t:[0, h + 0.17, -d*0.1] });             // füstcső
    body.add(K.torus(0.11, 0.02, 14, 4), { color:'steel:2', t:[0, h + 0.05, -d*0.1] });
    [['orange:2', -0.3], ['orange:2', -0.1], ['steel:2', 0.1], ['steel:2', 0.3]].forEach(([c, x]) => {   // csövek a padlóig
      body.add(K.cylinder(0.035, 0.035, y, 8), { color:c, t:[x*w, -y/2, 0] });
      body.add(K.cylinder(0.05, 0.05, 0.06, 8), { color:'steel:3', t:[x*w, -0.12, 0] });                // szelep
    });
    return { body };
  }

  // ---- GÁZÓRA: sárga ház, számlálóablak (a számokat a rá tett felirat-tábla adja), sárga gázcső ----
  function gasmeter(K, w, h, d, y){
    const cb = K.chamferBox, body = K.model(), f = d/2;
    body.add(cb(w, h, d, 0.05), { color:'gold:1', t:[0, h/2, 0] });
    body.add(cb(w - 0.04, 0.05, d - 0.04, 0.02), { color:'gold:0', t:[0, h - 0.02, 0] });
    body.add(cb(w - 0.08, 0.1, d + 0.04, 0.02), { color:'gold:2', t:[0, 0.08, 0] });                    // alsó perem
    for(const x of [-w*0.3, w*0.3]){                                                                  // be- és kimenő cső
      body.add(K.cylinder(0.05, 0.05, 0.3, 10), { color:'gold:2', t:[x, h + 0.15, 0] });
      body.add(K.cylinder(0.07, 0.07, 0.06, 10), { color:'steel:2', t:[x, h + 0.04, 0] });
    }
    body.add(K.cylinder(0.05, 0.05, y, 10), { color:'gold:2', t:[w*0.3, -y/2, 0] });
    body.add(K.box(w*0.7, 0.04, 0.03), { color:'gold:3', t:[0, h*0.28, f + 0.01] });                    // kontúr a tábla alatt
    return { body };
  }

  // ---- VILLANYÓRA-SZEKRÉNY: szürke fémdoboz kerettel, zsanérral, alul kábelcső (a számlap külön felirat-tábla) ----
  function meterbox(K, w, h, d){
    const cb = K.chamferBox, body = K.model(), f = d/2;
    body.add(cb(w, h, d, 0.05), { color:'steel:2', t:[0, h/2, 0] });
    body.add(cb(w - 0.12, h - 0.12, 0.04, 0.02), { color:'steel:1', t:[0, h/2, f + 0.01] });            // ajtólap (keret marad körbe)
    for(const yy of [h*0.2, h*0.8]) body.add(K.cylinder(0.025, 0.025, 0.12, 8), { color:'steel:3', t:[-w/2 + 0.02, yy, f + 0.02] });   // zsanér
    body.add(cb(0.05, 0.2, 0.05, 0.015), { color:'dark:1', t:[w/2 - 0.12, h/2, f + 0.04] });            // zár
    body.add(K.cylinder(0.06, 0.06, 0.5, 10), { color:'dark:1', t:[0, -0.25, 0] });                     // kábelcső
    body.add(K.box(0.04, h - 0.3, 0.02), { color:'white:0', t:[w/2 - 0.22, h/2, f + 0.035] });          // fénycsík
    return { body };
  }

  // ---- RADIÁTOR: tagos, letört élű tagok, alul-felül gyűjtőcső, az egyik végén termosztatikus szelep ----
  function radiator(K, w, h, d){
    const cb = K.chamferBox, body = K.model(), n = Math.max(4, Math.round(w/0.14)), step = (w - 0.1)/n;
    for(let i = 0; i < n; i++) body.add(cb(step*0.72, h, d, Math.min(0.03, step*0.2)), { color:'white:2', t:[-w/2 + 0.05 + step*(i + 0.5), h/2, 0] });
    for(const yy of [0.1, h - 0.1]) body.add(K.cylinder(0.05, 0.05, w, 10), { color:'white:1', t:[0, yy, 0], r:[0, 0, 90] });
    body.add(K.cylinder(0.04, 0.04, 0.16, 10), { color:'steel:2', t:[w/2 + 0.08, 0.15, 0], r:[0, 0, 90] });   // szelep
    body.add(K.cylinder(0.075, 0.075, 0.14, 12), { color:'white:1', t:[w/2 + 0.12, 0.3, 0] });            // termosztatikus fej
    body.add(K.cylinder(0.078, 0.078, 0.03, 12), { color:'sky:2', t:[w/2 + 0.12, 0.38, 0] });
    body.add(K.cylinder(0.03, 0.03, 0.35, 8), { color:'steel:2', t:[w/2 + 0.08, -0.1, 0] });              // bekötőcső
    return { body };
  }

  // ---- FALI TERMOSZTÁT: négyzetes lap, kerek tekerő acél gyűrűvel és kis kék kijelzővel ----
  function thermostat(K, w, h){
    const cb = K.chamferBox, body = K.model();
    body.add(cb(w, h, 0.05, 0.02), { color:'white:1', t:[0, h/2, 0.025] });
    body.add(K.cylinder(h*0.38, h*0.4, 0.06, 16), { color:'white:2', t:[0, h/2, 0.07], r:X90 });
    body.add(K.torus(h*0.39, 0.012, 16, 4), { color:'steel:2', t:[0, h/2, 0.1], r:X90 });
    body.add(K.box(h*0.34, h*0.14, 0.02), { color:'sky:2', t:[0, h/2 + 0.01, 0.105] });
    body.add(K.box(0.012, h*0.12, 0.02), { color:'ember:1', t:[0, h/2 + h*0.3, 0.1] });                 // állásjel
    return { body };
  }

  // ---- FÜRDŐKÁD: fehér kád lekerekített peremmel, benne víz és hab, a végén csaptelep ----
  function bathtub(K, w, h, d){
    const cb = K.chamferBox, body = K.model();
    body.add(cb(w, h - 0.1, d, 0.06), { color:'white:2', t:[0, (h - 0.1)/2, 0] });
    const rim = 0.16;                                                                                  // perem: négy léc, köztük a víz
    for(const sz of [-1, 1]) body.add(cb(w + 0.04, 0.12, rim, 0.04), { color:'white:1', t:[0, h - 0.06, sz*(d/2 - rim/2 + 0.02)] });
    for(const sx of [-1, 1]) body.add(cb(rim, 0.12, d - 2*rim + 0.04, 0.04), { color:'white:1', t:[sx*(w/2 - rim/2 + 0.02), h - 0.06, 0] });
    body.add(K.box(w - 2*rim, 0.04, d - 2*rim), { color:'water:1', t:[0, h - 0.1, 0] });               // víz
    body.add(K.box(w - 2*rim, 0.02, 0.05), { color:'water:2', t:[0, h - 0.08, d/2 - rim - 0.02] });    // víz széle (árnyék)
    for(const [x, z, r] of [[-0.2, -0.1, 0.16], [0.1, 0.12, 0.12], [0.45, -0.15, 0.14]]) body.add(K.sphere(r, 8, 4), { color:'white:0', t:[x, h - 0.08, z], s:[1, 0.45, 1] });   // hab
    body.add(K.box(w - 0.1, 0.04, 0.03), { color:'white:3', t:[0, h - 0.14, d/2 + 0.01] });            // kontúr a perem alatt
    body.add(K.box(w - 0.1, 0.06, 0.03), { color:'white:3', t:[0, 0.05, d/2 + 0.005] });               // lábazati rés
    const tx = -w/2 + 0.25;                                                                            // csaptelep a kád végén
    body.add(K.cylinder(0.035, 0.035, 0.45, 10), { color:'steel:2', t:[tx, h + 0.22, 0] });
    body.add(K.cylinder(0.03, 0.03, 0.3, 10), { color:'steel:2', t:[tx + 0.14, h + 0.43, 0], r:[0, 0, 90] });
    for(const z of [-0.14, 0.14]) body.add(K.cylinder(0.05, 0.05, 0.05, 10), { color:'steel:1', t:[tx, h + 0.2, z], r:X90 });
    return { body };
  }

  // ---- WC: talp, csésze, ülőke fedéllel, hátul (−Z) a tartály öblítőgombbal ----
  function toilet(K){
    const cb = K.chamferBox, body = K.model();
    body.add(K.lathe([[0.2, 0], [0.18, 0.3], [0.26, 0.55], [0.3, 0.72]], 14), { color:'white:2', t:[0, 0, 0.05], s:[1, 1, 1.25] });
    body.add(K.torus(0.25, 0.04, 14, 5), { color:'white:1', t:[0, 0.76, 0.05], s:[1, 1, 1.25] });       // ülőke
    body.add(cb(0.54, 0.05, 0.62, 0.02), { color:'white:1', t:[0, 0.8, 0.02], r:[-8, 0, 0] });         // fedél
    body.add(cb(0.66, 0.76, 0.26, 0.05), { color:'white:2', t:[0, 1.12, -0.36] });                     // tartály
    body.add(cb(0.7, 0.06, 0.3, 0.02), { color:'white:1', t:[0, 1.52, -0.36] });
    body.add(K.cylinder(0.07, 0.07, 0.03, 12), { color:'steel:2', t:[0, 1.56, -0.36] });                // öblítőgomb
    body.add(K.box(0.5, 0.03, 0.04), { color:'white:3', t:[0, 0.74, -0.24] });                          // kontúr
    return { body };
  }

  // ---- ZUHANYZÓ: tálca lefolyóval, üvegfal (áttetsző), fali csővel és esőztető fejjel ----
  function shower(K, w, h, d){
    const cb = K.chamferBox, body = K.model(), glass = K.model();
    body.add(cb(w, h, d, 0.04), { color:'white:2', t:[0, h/2, 0] });
    body.add(K.box(w - 0.16, 0.02, d - 0.16), { color:'white:1', t:[0, h + 0.005, 0] });
    body.add(K.cylinder(0.07, 0.07, 0.02, 12), { color:'steel:2', t:[0, h + 0.02, 0] });                // lefolyó
    const px = w/2 - 0.12, pz = -d/2 + 0.12;
    body.add(K.cylinder(0.03, 0.03, 2.4, 10), { color:'steel:2', t:[px, 1.35, pz] });
    body.add(K.cylinder(0.025, 0.025, 0.28, 8), { color:'steel:2', t:[px - 0.1, 2.55, pz + 0.1], r:[90, 0, 45] });
    body.add(K.cylinder(0.17, 0.13, 0.05, 14), { color:'steel:1', t:[px - 0.2, 2.5, pz + 0.2] });        // esőztető fej
    body.add(K.cylinder(0.05, 0.05, 0.08, 10), { color:'steel:3', t:[px, 1.2, pz + 0.04], r:X90 });      // keverő
    glass.add(K.box(w, 2.9, 0.04), { color:'glass:1', t:[0, 1.6, d/2 - 0.02] });
    glass.add(K.box(0.04, 2.9, d), { color:'glass:1', t:[-w/2 + 0.02, 1.6, 0] });
    body.add(K.box(0.05, 2.95, 0.06), { color:'steel:2', t:[-w/2 + 0.02, 1.62, d/2 - 0.02] });          // üvegfal éle
    return { body, glass };
  }

  // ---- ESŐVÍZGYŰJTŐ HORDÓ: öblös, abroncsokkal, fedéllel, elöl csap ----
  function barrel(K, w, h){
    const body = K.model(), r = w/2;
    body.add(K.lathe([[r*0.86, 0], [r, h*0.3], [r, h*0.7], [r*0.9, h]], 16), { color:'teal:2', t:[0, 0, 0] });
    for(const y of [h*0.22, h*0.78]) body.add(K.torus(r*0.99, 0.035, 16, 4), { color:'teal:3', t:[0, y, 0] });
    body.add(K.cylinder(r*0.92, r*0.92, 0.06, 16), { color:'teal:1', t:[0, h + 0.02, 0] });              // fedél
    body.add(K.cylinder(0.08, 0.08, 0.05, 10), { color:'teal:3', t:[0, h + 0.07, 0] });
    body.add(K.box(0.06, h*0.9, 0.04), { color:'teal:0', t:[-r*0.55, h*0.5, r*0.83] });                  // fénycsík
    body.add(K.cylinder(0.04, 0.04, 0.16, 10), { color:'gold:2', t:[0, 0.3, r + 0.06], r:X90 });         // csap
    body.add(K.box(0.14, 0.04, 0.04), { color:'gold:1', t:[0, 0.36, r + 0.12] });
    return { body };
  }

  // ---- LOCSOLÓTÖMLŐ-DOB: zöld tömlő a dobon, két oldaltárcsa, állvány fogantyúval ----
  function hosereel(K){
    const body = K.model();
    body.add(K.cylinder(0.26, 0.26, 0.34, 14), { color:'leaf:1', t:[0, 0.45, 0], r:[0, 0, 90] });
    for(const x of [-0.19, 0.19]) body.add(K.cylinder(0.36, 0.36, 0.04, 14), { color:'dark:1', t:[x, 0.45, 0], r:[0, 0, 90] });
    for(const x of [-0.24, 0.24]) body.add(K.box(0.05, 0.5, 0.06), { color:'dark:2', t:[x, 0.25, 0] });
    body.add(K.cylinder(0.03, 0.03, 0.6, 8), { color:'dark:2', t:[0, 0.02, 0], r:[0, 0, 90] });
    body.add(K.cylinder(0.04, 0.04, 0.16, 8), { color:'honey:1', t:[0.33, 0.45, 0.14], r:[0, 0, 90] });  // hajtókar
    body.add(K.cylinder(0.035, 0.035, 0.5, 8), { color:'leaf:2', t:[0, 0.2, 0.3], r:[70, 0, 0] });       // lelógó tömlővég
    return { body };
  }

  // ---- VÍZÓRA az aknában: kék ház, számlapüveg, két csőcsonk ----
  function watermeter(K){
    const body = K.model();
    body.add(K.cylinder(0.24, 0.27, 0.2, 14), { color:'blue:1', t:[0, 0.12, 0] });
    body.add(K.cylinder(0.2, 0.2, 0.03, 14), { color:'glass:0', t:[0, 0.235, 0] });
    body.add(K.box(0.2, 0.02, 0.03), { color:'dark:1', t:[0, 0.255, 0] });
    body.add(K.cylinder(0.06, 0.06, 0.03, 8), { color:'red:1', t:[0.09, 0.26, 0.06] });                // mutató-kerék
    for(const s of [-1, 1]) body.add(K.cylinder(0.07, 0.07, 0.3, 10), { color:'steel:2', t:[s*0.36, 0.12, 0], r:[0, 0, 90] });
    return { body };
  }

  const RZ_MODELS = { fridge, washer, dishwasher, boiler, gasmeter, meterbox, radiator, thermostat, bathtub, toilet, shower, barrel, hosereel, watermeter };
  if(typeof module !== 'undefined' && module.exports){ module.exports = RZ_MODELS; return; }
  root.RZ_MODELS = RZ_MODELS;
})(typeof window !== 'undefined' ? window : globalThis);
