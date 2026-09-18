// ============================================================
//  Részletesség-próba: SAJTSZELET három szinten (A tiszta ikon · B kidolgozott · C gazdag)
//  node tools/art-render.js 2d docs/rajzolas/minta/sajt/matrica.js ki.png
//
//  Hogyan? A szeletet valódi méretben (cm) írjuk le 3D-ben – csúcs a bal oldalon, elöl a vágott lap, jobbra a kéreg-ív –,
//  és egy kis vetítéssel (forgatás + felülnézet) számoljuk ki a lapok 2D pontjait. Így a lyukak a lap síkjában
//  torzulnak (ellipszisek), a szélen vágott lyukak valódi „harapások”, és mindhárom szint ugyanabból a nézetből épül –
//  csak a kidolgozottság más. Anyagok: honey (sajt-bél), gold (kéreg, mély árnyék), paper (fény).
// ============================================================
(function(){
  const { R, rad, arc } = ART.geo;
  const L = 12, H = 7.2, TH = 46;            // szelet: sugár (hossz), magasság, nyílásszög (fok) – kb. 12 × 7 × 9 cm
  const cos = Math.cos, sin = Math.sin;

  // ---- vetítés: Y körüli forgatás (phi) + felülnézet (el) → a 100-as rács közepére, a hosszabbik méret = size ----
  function camera(phi, el, size){
    const p = rad(phi), e = rad(el);
    const raw = ([x, y, z]) => { const xr = x * cos(p) + z * sin(p), zr = -x * sin(p) + z * cos(p); return [xr, -y * cos(e) + zr * sin(e)]; };
    const hull = []; for(const y of [0, H]){ hull.push(raw([0, y, 0])); for(const q of arc(0, 0, L, 0, -TH, 12)) hull.push(raw([q[0], y, q[1]])); }
    const xs = hull.map(q => q[0]), ys = hull.map(q => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = size / Math.max(x1 - x0, y1 - y0);
    const P = q => { const [a, b] = raw(q); return [50 + (a - (x0 + x1) / 2) * k, 50 + (b - (y0 + y1) / 2) * k]; };
    let aVis = 0; while(aVis > -TH && -cos(rad(aVis - 1)) * sin(p) + sin(rad(aVis - 1)) * cos(p) > 0) aVis--;   // a kéreg-ív látható része
    return { P, aVis };
  }
  // lapok: helyi 2D koordináta → 3D
  const FRONT = ([u, v]) => [u, v, 0];                                         // vágott lap (u: csúcstól a kéregig, v: fel)
  const TOP = ([x, z]) => [x, H, z];                                           // felső lap (z < 0: hátrafelé)
  const BOT = ([x, z]) => [x, 0, z];                                           // alsó lap (csak a lyukak pereméhez)
  const RIND = ([a, y]) => [L * cos(rad(a)), y, L * sin(rad(a))];              // kéreg (a: szög fokban)
  const on = (cam, face, pts) => R(pts.map(q => cam.P(face(q))));
  // kéreg-lap a0…a1 fok között: alsó és felső ív mintavételezve (húr helyett – a részsávok így nem lógnak ki)
  const rindStrip = (a0, a1, n = 6) => [...Array.from({ length:n + 1 }, (_, i) => [a0 + (a1 - a0) * i / n, 0]), ...Array.from({ length:n + 1 }, (_, i) => [a1 + (a0 - a1) * i / n, H])];

  // ---- 2D segédek a lap síkjában ----
  const ring = (c, r, n = 22) => arc(c[0], c[1], r, 0, 360, n).slice(0, n);
  function clip(poly, box){                                                    // konvex vágás (Sutherland–Hodgman)
    let out = poly;
    for(let i = 0; i < box.length; i++){
      const A = box[i], B = box[(i + 1) % box.length], side = p => (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]);
      const src = out; out = [];
      for(let j = 0; j < src.length; j++){ const p = src[j], q = src[(j + 1) % src.length], sp = side(p), sq = side(q);
        const cut = () => { const t = sp / (sp - sq); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
        if(sq >= 0){ if(sp < 0) out.push(cut()); out.push(q); } else if(sp >= 0) out.push(cut()); }
    }
    return out;
  }
  function crescent(c, r, sx, sy, n = 14){      // a kör azon része, amely kilóg a (sx,sy)-nal eltolt körből
    const d = Math.hypot(sx, sy), ts = Math.atan2(sy, sx) * 180 / Math.PI, g = Math.acos(Math.min(1, d / (2 * r))) * 180 / Math.PI;
    return [...arc(c[0], c[1], r, ts + g, ts + 360 - g, n), ...arc(c[0] + sx, c[1] + sy, r, ts + 180 + g, ts + 180 - g, n)];
  }
  const FRONT_BOX = [[0, 0], [L, 0], [L, H], [0, H]];
  const SECTOR = [[0, 0], ...arc(0, 0, L, 0, -TH, 12)];
  const topClip = pts => clip(pts.map(([x, z]) => [x, -z]), SECTOR.map(([x, z]) => [x, -z])).map(([x, z]) => [x, -z]);
  // lyuk a lap síkjában: alap + (fényes alsó perem) + árnyékos belső fal bal-fent. A „fent” a vágott lapon +v, a tetején -z.
  function hole(cam, face, c, r, o = {}){
    const up = face === TOP ? -1 : 1, cl = o.clip || (p => p), out = [];
    const S = (m, tone, pts, extra) => out.push(Object.assign({ t:'poly', m, tone, d:true, line:false, pts:on(cam, face, cl(pts)) }, extra));
    S(o.floorM || 'honey', o.floor || 'dark', ring(c, r));
    if(o.lit) S('gold', 'base', crescent(c, r, -.2 * r, .22 * r * up));            // alsó-jobb belső fal: fényt kap
    S(o.shadeM || 'honey', o.shade || 'line', crescent(c, r, .36 * r, -.46 * r * up), { o:o.shadeO != null ? o.shadeO : .5 });
    return out;
  }

  // ==================== A – tiszta ikon: 6 alakzat, 2 anyag (honey + gold), alap-lapozás, 3 lyuk ====================
  {
    const cam = camera(-36, 34, 72);
    ART.add('sajt_a', { emoji:[], hu:'Sajt (A – tiszta ikon)', en:'wedge of yellow cheese with holes', shadow:'hard', tilt:-8, scale:.98, shapes:[
      { t:'poly', m:'gold', pts:on(cam, RIND, [[0, 0], [cam.aVis, 0], [cam.aVis, H], [0, H]]) },                        // kéreg
      { t:'poly', m:'honey', pts:on(cam, FRONT, FRONT_BOX) },                                                            // vágott lap
      { t:'poly', m:'honey', tone:'light', pts:on(cam, TOP, [[0, 0], [L, 0], [L * cos(rad(-TH)), L * sin(rad(-TH))]]) },  // teteje
      { t:'poly', m:'honey', tone:'dark', d:true, pts:on(cam, FRONT, ring([3.8, 3.4], 1.45)) },
      { t:'poly', m:'honey', tone:'dark', d:true, pts:on(cam, FRONT, ring([8.4, 4.9], 1.0)) },
      { t:'poly', m:'honey', tone:'dark', d:true, pts:on(cam, TOP, ring([7.4, -3.2], 1.0)) },
    ]});
  }

  // ==================== B – kidolgozott: 4 éles tónus, sarlós lyukak, szélen vágott lyukak, fénycsík ====================
  {
    const cam = camera(-38, 32, 74), rb = .75;
    ART.add('sajt_b', { emoji:[], hu:'Sajt (B – kidolgozott)', en:'wedge of yellow cheese with holes', shadow:'hard', tilt:-20, scale:.97, shapes:[
      { t:'poly', m:'honey', tone:'dark', pts:on(cam, RIND, rindStrip(0, cam.aVis)) },         // kéreg-oldal (sötét)
      { t:'poly', m:'honey', tone:'base', pts:on(cam, FRONT, FRONT_BOX) },                                              // vágott lap (alap)
      { t:'poly', m:'honey', tone:'light', pts:on(cam, TOP, SECTOR) },                                                  // teteje (világos)
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:[...on(cam, TOP, arc(0, 0, L, -TH, 0, 10)),           // kéreg-sáv (legsötétebb)
          ...on(cam, FRONT, [[L, 0], [L - rb, 0]]), ...on(cam, TOP, arc(0, 0, L - rb, 0, -TH, 10))] },
      ...hole(cam, FRONT, [3.9, 3.3], 1.5),
      ...hole(cam, FRONT, [8.0, 4.8], 1.0),
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, ring([6.8, 1.6], .7)) },
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, clip(ring([10.0, H], 1.05), FRONT_BOX)) },   // élen vágott lyuk – elöl
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:on(cam, TOP, topClip(ring([10.0, 0], 1.05))) },            // … és felül (mélye)
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, clip(ring([1.9, 0], .95), FRONT_BOX)) },   // alsó élen
      ...hole(cam, TOP, [6.4, -2.7], .95, { floor:'base', shade:'dark', shadeO:1 }),
      { t:'poly', m:'paper', tone:'light', d:true, line:false, o:.6, pts:on(cam, FRONT, [[.9, H - .55], [5.8, H - .55], [5.6, H - 1.05], [.9, H - 1.05]]) },
    ]});
  }

  // ==================== C – gazdag: lapokra tört felületek, harapások a sziluettben, kétárnyalatú lyukak, szabálytalan kéreg ====================
  {
    const cam = camera(-38, 32, 76), rb = .8;
    const ct = 9.3, rt = 1.15;                 // felső első élen átvágott buborék
    const cn = 2.7, rn = 1.05;                 // alsó élen (sziluett-harapás)
    const db = 6.4, rk = .95, dir = [cos(rad(-TH)), sin(rad(-TH))], Nc = [db * dir[0], db * dir[1]];   // hátsó felső élen
    const frontOutline = [[0, 0], ...arc(cn, 0, rn, 180, 0, 12), [L, 0], [L, H], [0, H]];
    const topOutline = [[0, 0], ...arc(0, 0, L, 0, -TH, 12), ...arc(Nc[0], Nc[1], rk, -TH, -TH + 180, 12)];
    const wavy = (r0, a0, a1, n) => arc(0, 0, 1, a0, a1, n).map(([x, z], i) => { const rr = r0 + .07 * sin(i * 1.7) + .04 * sin(i * 4.3); return [x * rr, z * rr]; });
    const strip = (a0, a1) => rindStrip(a0, a1);
    const inFront = p => clip(p, FRONT_BOX), inTop = topClip;
    const av = cam.aVis;
    ART.add('sajt_c', { emoji:[], hu:'Sajt (C – gazdag)', en:'wedge of yellow cheese with holes', shadow:'hard', tilt:-22, scale:.95, shapes:[
      // kéreg-ív: egy lap + mélyebb hátsó sáv + fényesebb első sáv (kontúr nélkül, hogy ne legyen „deszka”)
      { t:'poly', m:'honey', tone:'dark', pts:on(cam, RIND, strip(0, av)) },
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:on(cam, RIND, strip(av * .62, av)) },
      { t:'poly', m:'gold', tone:'base', d:true, line:false, pts:on(cam, RIND, strip(0, av * .22)) },
      // lyukak üregei a harapások mögött (a lapok alá rajzolva)
      { t:'poly', m:'gold', tone:'dark', line:false, pts:[...on(cam, FRONT, arc(cn, 0, rn, 180, 0, 12)), ...on(cam, BOT, arc(cn, 0, rn, 0, -180, 12))] },
      { t:'poly', m:'gold', tone:'dark', line:false, pts:[...on(cam, TOP, arc(Nc[0], Nc[1], rk, -TH, -TH + 180, 10)), ...on(cam, TOP, arc(Nc[0], Nc[1], rk * .55, -TH + 180, -TH, 8))] },
      // vágott lap: alap + két lap-tónus
      { t:'poly', m:'honey', tone:'base', pts:on(cam, FRONT, frontOutline) },
      { t:'poly', m:'honey', tone:'light', d:true, line:false, o:.55, pts:on(cam, FRONT, [[0, H], [5.2, H], [0, 2.6]]) },
      { t:'poly', m:'gold', tone:'base', d:true, line:false, pts:on(cam, FRONT, [[L, 0], [L, 4.2], [6.2, 0]]) },
      // teteje: világos + fényes csúcs-lap + mélyebb hátsó lap
      { t:'poly', m:'honey', tone:'light', pts:on(cam, TOP, topOutline) },
      { t:'poly', m:'paper', tone:'light', d:true, line:false, o:.45, pts:on(cam, TOP, inTop([[0, 0], [6.2, 0], [2.8, -2.2]])) },
      { t:'poly', m:'honey', tone:'base', d:true, line:false, o:.3, pts:on(cam, TOP, inTop([[3.9, -4.0], [L * dir[0], L * dir[1]], [10.6, -5.0]])) },
      // kéreg-sáv: szabálytalan belső széllel a tetején, egyenes sáv a vágott lapon
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:[...on(cam, TOP, arc(0, 0, L, -TH, 0, 12)), ...on(cam, FRONT, [[L, 0], [L - rb, 0]]),
          ...on(cam, TOP, wavy(L - rb, 0, -TH, 12))] },
      { t:'line', m:'gold', tone:'line', o:.35, w:.9, pts:on(cam, FRONT, [[L - rb, .2], [L - rb, H - .1]]) },
      // lyukak a vágott lapon (a nagyok kétárnyalatú belső fallal)
      ...hole(cam, FRONT, [4.3, 3.6], 1.55, { lit:true }),
      ...hole(cam, FRONT, [8.4, 4.3], 1.05, { lit:true }),
      ...hole(cam, FRONT, [6.9, 1.55], .75, { lit:true }),
      ...hole(cam, FRONT, [1.45, 5.5], .55),
      ...hole(cam, FRONT, [10.1, 1.9], .6, { clip:inFront }),
      ...hole(cam, FRONT, [6.2, 6.1], .42),
      // élen átvágott buborék: a felső és az első lapba is belemar, a vágásél megszakad
      { t:'poly', m:'gold', tone:'dark', d:true, line:false, pts:[...on(cam, FRONT, arc(ct, H, rt, 0, -180, 12)), ...on(cam, TOP, arc(ct, 0, rt, 180, 360, 12))] },
      { t:'poly', m:'honey', tone:'dark', d:true, line:false, pts:on(cam, FRONT, inFront(crescent([ct, H], rt, 0, .55 * rt))) },
      { t:'poly', m:'honey', tone:'line', d:true, line:false, o:.45, pts:on(cam, TOP, inTop(crescent([ct, 0], rt, .2 * rt, .55 * rt))) },
      // lyukak a tetején
      ...hole(cam, TOP, [6.1, -2.7], .95, { floor:'base', shade:'dark', shadeO:1 }),
      ...hole(cam, TOP, [8.4, -5.3], .6, { floor:'base', shade:'dark', shadeO:1 }),
      { t:'poly', m:'honey', tone:'base', d:true, line:false, pts:on(cam, TOP, ring([3.3, -1.45], .38, 14)) },
      // vágásél-fény a felső első élen + fénycsík
      { t:'line', m:'paper', tone:'light', o:.85, w:1.1, pts:on(cam, FRONT, [[.5, H - .22], [ct - rt - .35, H - .22]]) },
      { t:'line', m:'paper', tone:'light', o:.85, w:1.1, pts:on(cam, FRONT, [[ct + rt + .3, H - .22], [L - rb - .3, H - .22]]) },
      { t:'poly', m:'paper', tone:'light', d:true, line:false, o:.55, pts:on(cam, FRONT, [[.8, H - .75], [2.9, H - .75], [2.6, H - 1.2], [.8, H - 1.2]]) },
    ]});
  }
})();
