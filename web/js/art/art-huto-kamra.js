// ============================================================
//  Matricák — Hűtő-mester ételei (f_ + étel-azonosító), B szint (docs/rajzolas.md): zöldségfiók, konyhapolc (kamra)
//  és a citromlé. A hűtő belseje és ajtaja: art-huto.js
//  Kerek ételek középpont + sugárból, hosszúkások gerincvonalból, üvegek és kenyér valódi méretből vetítve; tömör olíva árnyék.
// ============================================================
(function(){
  const { R, rad, band, arc, camera } = ART.geo;
  const { cos, sin, sqrt, hypot, max, min, abs, exp, floor, PI } = Math;
  const norm3 = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const L0 = norm3([-0.52, -0.62, 0.59]);                                   // fény a képernyőn: bal-fent-elöl (y lefelé nő)
  const lightFor = tilt => { const a = rad(-tilt), c = cos(a), s = sin(a); return [L0[0] * c - L0[1] * s, L0[0] * s + L0[1] * c, L0[2]]; };
  const PAD = 0.85;                                                          // a tónus-lapok ennyivel húzódnak be a kontúrtól
  const gauss = (d, w) => exp(-(d / w) * (d / w)), dAng = (a, b) => ((a - b + 540) % 360) - 180;
  const TONE = { light:d => d > 0.72, dark:d => d < 0.25, edge:d => d < -0.25 };

  // ---- 2D segédek ----
  const area = p => p.reduce((a, q, i) => { const r = p[(i + 1) % p.length]; return a + q[0] * r[1] - r[0] * q[1]; }, 0) / 2;
  const orient = p => (area(p) >= 0 ? p : [...p].reverse());
  // sokszögek → egy útvonal (azonos körüljárással, hogy az átfedések ne lyukadjanak ki; ismétlődő pontok nélkül)
  function pathOf(polys, keepDir){
    return polys.filter(p => p && p.length > 2).map(p => {
      const q = R(keepDir ? p : orient(p)).filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]);
      return 'M' + q.map(v => v[0] + ' ' + v[1]).join(' ') + 'Z';
    }).join('');
  }
  const ellipse = (cx, cy, rx, ry, n = 8, rot = 0) => { const a = rad(rot); return Array.from({ length:n }, (_, i) => { const t = 2 * PI * i / n, x = rx * cos(t), y = ry * sin(t); return [cx + x * cos(a) - y * sin(a), cy + x * sin(a) + y * cos(a)]; }); };
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const bez = (p0, p1, p2, n = 8) => Array.from({ length:n + 1 }, (_, i) => { const t = i / n; return lerp(lerp(p0, p1, t), lerp(p1, p2, t), t); });   // másodfokú görbe pontjai
  // levél egyik fele (a középér és az egyik ív között) – a levél kéttónusú hajtásához; side: +1 / −1
  function leafHalf(x, y, deg, len, wid, side){
    const dx = cos(rad(deg)), dy = sin(rad(deg)), h = side * wid / 1.5, P = (t, o) => `${R([[x + dx * len * t - dy * o, y + dy * len * t + dx * o]])[0].join(' ')}`;
    return `M${P(0, 0)} C${P(0.2, h)} ${P(0.7, h)} ${P(1, 0)}Z`;
  }

  // 1D: a [a,b] szakasz azon része, ahol test(f(x)) igaz (egy intervallumot feltételez), felezéssel finomítva
  function interval(f, test, a, b, n = 28){
    const xs = Array.from({ length:n + 1 }, (_, k) => a + (b - a) * k / n), ok = xs.map(x => test(f(x)));
    const first = ok.indexOf(true); if(first < 0) return null;
    const last = ok.lastIndexOf(true);
    const refine = (p, q) => { const v = test(f(p)); for(let i = 0; i < 16; i++){ const m = (p + q) / 2; if(test(f(m)) === v) p = m; else q = m; } return (p + q) / 2; };
    return [first === 0 ? a : refine(xs[first - 1], xs[first]), last === n ? b : refine(xs[last], xs[last + 1])];
  }
  // mintánkénti intervallumokból sokszögek (összefüggő szakaszonként): felső határ előre, alsó vissza
  function regionPolys(ints, pt, cyclic){
    const n = ints.length, out = [];
    if(cyclic && ints.every(Boolean)){
      const idx = ints.map((_, i) => i);
      out.push(idx.every(k => ints[k][0] < 1e-6) ? idx.map(k => pt(k, ints[k][1])) : [...idx.map(k => pt(k, ints[k][1])), ...idx.reverse().map(k => pt(k, ints[k][0]))]);
      return out;
    }
    for(let i = 0; i < n; i++){
      const prev = cyclic ? ints[(i - 1 + n) % n] : (i ? ints[i - 1] : null);
      if(!ints[i] || prev) continue;
      const idx = []; for(let k = i; ints[k]; k = cyclic ? (k + 1) % n : k + 1){ idx.push(k); if(!cyclic && k === n - 1) break; if(idx.length > n) break; }
      out.push([...idx.map(k => pt(k, ints[k][1])), ...idx.slice().reverse().map(k => pt(k, ints[k][0]))]);
    }
    return out;
  }

  // ---- poláris folt: közép, sugarak, forgatás, f(fok) sugár-szorzó; tone() gömbszerű álnormálissal ----
  function Blob(o){
    const a = rad(o.rot || 0), ca = cos(a), sa = sin(a), f = o.f || (() => 1);
    const at = (th, rho = 1) => { const k = f(th) * rho, x = o.rx * k * cos(rad(th)), y = o.ry * k * sin(rad(th)); return [o.cx + x * ca - y * sa, o.cy + x * sa + y * ca]; };
    const sil = (n = 36, off = 0) => R(Array.from({ length:n }, (_, i) => at(off + 360 * i / n)));
    const tone = (L, test, n = 40, pad = PAD) => {
      const ths = Array.from({ length:n }, (_, i) => 360 * i / n);
      const ints = ths.map(th => { const e = at(th), dx = e[0] - o.cx, dy = e[1] - o.cy, Rr = hypot(dx, dy), al = (dx * L[0] + dy * L[1]) / Rr;
        return interval(r => r * al + sqrt(max(0, 1 - r * r)) * L[2], test, 0, max(0, 1 - pad / Rr)); });
      return regionPolys(ints, (k, r) => at(ths[k], r), true);
    };
    return { at, sil, tone, o };
  }
  // ---- cső: gerincvonal + teljes szélesség (szám vagy t→szélesség); tone() hengeres álnormálissal ----
  function Tube(spine, w){
    const n = spine.length, hw = i => (typeof w === 'function' ? w(i / (n - 1)) : w) / 2;
    const N = spine.map((p, i) => { const a = spine[max(0, i - 1)], b = spine[min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    const at = (i, u) => [spine[i][0] + N[i][0] * u * hw(i), spine[i][1] + N[i][1] * u * hw(i)];
    // dark: csak a fénytől elforduló oldalon keresünk (hosszában futó sáv)
    const tone = (L, test, dark, pad = PAD) => {
      const ints = spine.map((p, i) => { const h = hw(i); if(h <= pad * 1.3) return null;
        const um = 1 - pad / h, al = N[i][0] * L[0] + N[i][1] * L[1], f = u => u * al + sqrt(max(0, 1 - u * u)) * L[2];
        return dark ? interval(f, test, al > 0 ? -um : 0, al > 0 ? 0 : um) : interval(f, test, -um, um); });
      return regionPolys(ints, (k, u) => at(k, u), false);
    };
    return { at, sil:(cap = true) => band(spine, w, cap), tone, N, hw, n };
  }
  const smooth = (pts, n = 6) => pts.length < 3 ? pts : pts.slice(0, -2).flatMap((_, i) => {   // töröttvonal simítása (másodfokú görbék a felezőpontokon át)
    const a = i ? lerp(pts[i], pts[i + 1], 0.5) : pts[0], c = i === pts.length - 3 ? pts[i + 2] : lerp(pts[i + 1], pts[i + 2], 0.5);
    return bez(a, pts[i + 1], c, n).slice(i ? 1 : 0);
  });


  // vízszintes metszet: a sokszög bal és jobb széle y magasságban (hagyma-, fokhagyma-„délkörökhöz”)
  function spanAt(poly, y){
    let xl = 1e9, xr = -1e9;
    for(let i = 0; i < poly.length; i++){ const a = poly[i], b = poly[(i + 1) % poly.length];
      if((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]){ const x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); xl = min(xl, x); xr = max(xr, x); } }
    return [xl, xr];
  }
  // délkör-sáv: k1…k2 (−1 bal szél … +1 jobb szél) között, y0…y1 magasságban
  function meridian(poly, k1, k2, y0, y1, n = 9, pad = PAD){
    const ys = Array.from({ length:n + 1 }, (_, i) => y0 + (y1 - y0) * i / n), P = (y, k) => { const [xl, xr] = spanAt(poly, y), m = (xl + xr) / 2, h = max(0, (xr - xl) / 2 - pad); return [m + k * h, y]; };
    return [...ys.map(y => P(y, k1)), ...ys.slice().reverse().map(y => P(y, k2))];
  }
  const meridianLine = (poly, k, y0, y1, w, n = 9) => { const ys = Array.from({ length:n + 1 }, (_, i) => y0 + (y1 - y0) * i / n);
    return band(ys.map(y => { const [xl, xr] = spanAt(poly, y); return [(xl + xr) / 2 + k * ((xr - xl) / 2 - 1.2), y]; }), t => w * sin(PI * (0.04 + 0.92 * t)), false); };
  // csepp-forma felső fele (hagyma, fokhagyma): szuperellipszis a csúcs felé
  const dropTop = (th, tip, p) => { const s = sin(rad(th)), c = abs(cos(rad(th))); return (c ** p + (abs(s) / tip) ** p) ** (-1 / p); };

  // gyökérszakáll: cikkcakkos rojt egy sokszögben (x, y: a tő közepe; w: fél-szélesség; n: szálak)
  const fringe = (x, y, w, n) => { const out = [[x - w * 0.7, y], [x + w * 0.7, y]];
    for(let i = n; i >= 0; i--){ const u = -1 + 2 * i / n; out.push([x + u * w * 1.15, y + 6.5 - abs(u) * 1.5]); if(i) out.push([x + (u - 1 / n) * w * 0.8, y + 2.6]); }
    return out; };

  // ---- vetített forgástest (üveg, palack, kupak): rings = [[r, y], …] alulról (cm); P = ART.geo.camera(…) ----
  //   th fokban: 0 = szemből, −90 = bal szél, +90 = jobb szél
  function Lathe(P, rings){
    const n = rings.length, k = P.k, ring = (r, y, th) => P([r * sin(rad(th)), y, r * cos(rad(th))]);
    const at = (i, th, pad = 0) => ring(max(0, rings[i][0] - pad / k), rings[i][1], th);
    const sil = (m = 10) => [...rings.map((_, i) => at(i, -90)), ...Array.from({ length:m - 1 }, (_, j) => at(n - 1, -90 - 180 * (j + 1) / m)),
      ...rings.map((_, i) => at(n - 1 - i, 90)), ...Array.from({ length:m - 1 }, (_, j) => at(0, 90 - 180 * (j + 1) / m))];
    // függőleges tónus-sáv th0…th1 között, az i0…i1 gyűrűk mentén (a kontúrtól behúzva)
    const strip = (th0, th1, i0 = 0, i1 = n - 1, pad = PAD, m = 5) => {
      const arcAt = (i, a, b) => Array.from({ length:m + 1 }, (_, j) => at(i, a + (b - a) * j / m, pad));
      const ids = Array.from({ length:i1 - i0 + 1 }, (_, j) => i0 + j);
      return [...ids.map(i => at(i, th0, pad)), ...arcAt(i1, th0, th1), ...ids.slice().reverse().map(i => at(i, th1, pad)), ...arcAt(i0, th1, th0)];
    };
    const top = (i = n - 1, m = 16, pad = 0) => Array.from({ length:m }, (_, j) => at(i, 360 * j / m, pad));   // felső ellipszis
    return { at, sil, strip, top, ring, k };
  }
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  // ---- alakzat-gyártók ----
  const body = (m, tone, pts, x) => Object.assign({ t:'poly', m, tone, pts:R(pts) }, x);                        // peremet kapó test
  const bodyP = (m, tone, polys, x) => Object.assign({ t:'path', m, tone, p:pathOf(polys) }, x);                 // több részből álló test
  const fill = (m, tone, polys, x) => Object.assign({ t:'path', m, tone, line:false, d:true, p:pathOf(polys) }, x);   // tónus-lap / dísz
  const shine = (polys, o = 0.7) => fill('paper', 'light', polys, { o });
  const dots = (list, r = 0.8) => list.map(([x, y, rr]) => ellipse(x, y, rr || r, (rr || r) * 0.8, 6));

  // ---- beillesztés: középre tolás (a megdöntött befoglaló alapján) + kicsinyítés, hogy a döntve is 8–92-be férjen ----
  const ptsOf = s => s.pts ? s.pts : s.t === 'path' ? (s.p.match(/-?\d*\.?\d+/g) || []).map(Number).reduce((o, v, i, a) => (i % 2 ? o : o.concat([[v, a[i + 1]]])), [])
    : s.t === 'circle' ? arc(s.cx, s.cy, s.r, 0, 360, 16) : s.t === 'ellipse' ? ellipse(s.cx, s.cy, s.rx, s.ry, 16) : s.t === 'rect' ? [[s.x, s.y], [s.x + s.w, s.y + s.h]] : [];
  function shift(s, dx, dy){
    const mv = p => [Math.round((p[0] + dx) * 10) / 10, Math.round((p[1] + dy) * 10) / 10];
    if(s.pts) s.pts = s.pts.map(mv);
    else if(s.t === 'path'){ let i = 0; s.p = s.p.replace(/-?\d*\.?\d+/g, v => { const r = Math.round((Number(v) + (i++ % 2 ? dy : dx)) * 10) / 10; return String(r); }); }
    else if(s.cx != null){ s.cx = Math.round((s.cx + dx) * 10) / 10; s.cy = Math.round((s.cy + dy) * 10) / 10; }
    else if(s.x != null){ s.x = Math.round((s.x + dx) * 10) / 10; s.y = Math.round((s.y + dy) * 10) / 10; }
  }
  function add(name, meta){
    const t = rad(meta.tilt || 0), c = cos(t), s = sin(t), sil = meta.shapes.filter(sh => !(sh.d || sh.t === 'shine'));
    const rot = ([x, y]) => [(x - 50) * c - (y - 50) * s, (x - 50) * s + (y - 50) * c];
    let U = sil.flatMap(sh => ptsOf(sh).map(rot)), us = U.map(u => u[0]), vs = U.map(u => u[1]);
    const mu = (max(...us) + min(...us)) / 2, mv = (max(...vs) + min(...vs)) / 2;
    const dx = -(mu * c + mv * s), dy = -(-mu * s + mv * c);                  // a megdöntött középpont visszaforgatva
    if(meta.center !== false) for(const sh of meta.shapes) shift(sh, dx, dy);
    U = sil.flatMap(sh => ptsOf(sh).map(rot)); let dev = max(...U.map(u => max(abs(u[0]), abs(u[1]))));
    let bx = [1e9, 1e9, -1e9, -1e9];
    for(const sh of sil){ const p = sh.t === 'line' ? (sh.w || 2) / 2 : 0, b = sh.t === 'line' ? (q => [min(...q.map(v => v[0])), min(...q.map(v => v[1])), max(...q.map(v => v[0])) - min(...q.map(v => v[0])), max(...q.map(v => v[1])) - min(...q.map(v => v[1]))])(sh.pts) : ART.bbox(sh); bx = [min(bx[0], b[0] - p), min(bx[1], b[1] - p), max(bx[2], b[0] + b[2] + p), max(bx[3], b[1] + b[3] + p)]; }
    // (a vonal befoglalóját a pontjaiból számoljuk – az ART.bbox a 'line' típust nem ismeri)
    const k = min(1, 42 / dev, 46 / max(50 - bx[0], bx[2] - 50, 50 - bx[1]), 42.5 / (bx[3] - 50));
    delete meta.center;
    meta.shapes = meta.shapes.filter(sh => sh.t !== 'path' || /\S/.test(sh.p));   // üres (láthatatlan) útvonal ne kerüljön be
    ART.add(name, Object.assign({ emoji:[], shadow:'hard' }, meta, { scale:floor(k * 100) / 100 }));
  }

  // ======================================================================
  //  ALMA – piros alma szárral és levéllel; szív-szerű váll, felül mélyedés, apró világos pöttyök (paraszemölcs)
  // ======================================================================
  {
    const TILT = 10, L = lightFor(TILT);
    const B = Blob({ cx:50, cy:57, rx:35, ry:31, f:th => 1 - 0.06 * sin(rad(th)) - 0.2 * gauss(dAng(th, -90), 18) - 0.07 * gauss(dAng(th, 90), 22) });
    const lx = 52.5, ly = 22;
    add('f_alma', { hu:'Alma', en:'red apple with stem and leaf', tilt:TILT, shapes:[
      body('red', 'base', B.sil(40)),
      fill('red', 'light', B.tone(L, TONE.light)),
      fill('red', 'dark', B.tone(L, TONE.dark)),
      fill('red', 'line', B.tone(L, TONE.edge), { o:0.45 }),
      fill('honey', 'light', dots([B.at(-35, 0.55), B.at(-5, 0.3), B.at(25, 0.62), B.at(50, 0.38), B.at(115, 0.62), B.at(160, 0.45), B.at(80, 0.78)], 0.75), { o:0.85 }),
      fill('red', 'dark', [ellipse(50.5, 30.5, 7.5, 2.8, 10)]),                                   // mélyedés a szár körül
      shine([band([B.at(-168, 0.72), B.at(-150, 0.76), B.at(-132, 0.77)], t => 1 + 3 * sin(PI * t)), ellipse(...B.at(-116, 0.8), 1.5, 1.2, 6)], 0.75),
      { t:'path', m:'wood', tone:'base', p:pathOf([band([[50.3, 31], [50.8, 24], [53, 16]], t => 3.8 - 1.2 * t)]) },   // szár
      { t:'path', m:'leaf', tone:'base', p:ART.geo.leaf(lx, ly, -22, 25, 12.5) },                  // levél
      { t:'path', m:'leaf', tone:'light', line:false, d:true, p:leafHalf(lx + 0.6, ly - 0.3, -22, 23.6, 10.8, -1) },
      { t:'line', m:'leaf', tone:'dark', w:1.1, pts:R([[lx + 1.5, ly - 0.5], [lx + 20, ly - 7.6]]) },
    ]});
  }

  // ======================================================================
  //  PARADICSOM – lapított, enyhén cikkes gömb, felül zöld csillag-kocsány (5–6 csészelevél) árnyékkal, fényes csillanás
  // ======================================================================
  {
    const TILT = -10, L = lightFor(TILT);
    const B = Blob({ cx:50, cy:57, rx:39, ry:31, f:th => 1 + 0.018 * cos(rad(5 * (th + 90))) - 0.06 * gauss(dAng(th, -90), 40) });
    const C = [50, 37], sep = (off) => [0, 1, 2, 3, 4, 5].map(i => {
      const a = rad(i * 60 + 12), tip = [C[0] + cos(a) * 18 + off[0], C[1] + sin(a) * 8.5 + off[1] + 1.5], pr = [-sin(a) * 3.8, cos(a) * 1.9];
      const mid = lerp([C[0] + off[0], C[1] + off[1]], tip, 0.42);
      return [[C[0] + off[0] + pr[0], C[1] + off[1] + pr[1]], [mid[0] + pr[0] * 0.9, mid[1] + pr[1] * 0.9], tip, [mid[0] - pr[0] * 0.9, mid[1] - pr[1] * 0.9], [C[0] + off[0] - pr[0], C[1] + off[1] - pr[1]]];
    });
    const halves = sep([0, 0]).map(p => [lerp(p[0], p[4], 0.5), p[1], p[2]]);
    add('f_paradicsom', { hu:'Paradicsom', en:'ripe red tomato with green star-shaped calyx', tilt:TILT, shapes:[
      body('tomato', 'base', B.sil(40)),
      fill('tomato', 'light', B.tone(L, TONE.light)),
      fill('tomato', 'dark', B.tone(L, TONE.dark)),
      fill('tomato', 'line', B.tone(L, TONE.edge), { o:0.45 }),
      shine([band([B.at(-172, 0.74), B.at(-155, 0.78), B.at(-138, 0.78)], t => 1 + 3.2 * sin(PI * t)), ellipse(...B.at(-122, 0.8), 1.8, 1.3, 6)], 0.8),
      fill('tomato', 'line', sep([1.4, 2]), { o:0.5 }),                                           // a csészelevelek árnyéka
      bodyP('leaf', 'base', sep([0, 0])),
      fill('leaf', 'light', halves.filter((_, i) => i >= 2 && i <= 4)),
      fill('leaf', 'dark', sep([0, 0]).map(p => [lerp(p[0], p[4], 0.5), p[3], p[2]]).filter((_, i) => i <= 1 || i === 5)),
      { t:'path', m:'leaf', tone:'base', p:pathOf([band([[C[0], C[1] + 1], [C[0] + 0.6, C[1] - 5], [C[0] + 2.6, C[1] - 9]], t => 3.6 - 0.8 * t)]) },
    ]});
  }

  // ======================================================================
  //  EPER – két szem (egy hátul), kúpos „szív” forma, sárga magocskák sorokban, zöld csészelevél-csillag, szár
  // ======================================================================
  {
    const TILT = 14, L = lightFor(TILT);
    // kúpos szem: felül lapos váll, alul egyenes oldalak a csúcs felé (a kúp-egyenes poláris alakja, a vállnál körrel keverve)
    // kerekített kúp: felül lapos váll; alul „szuperellipszis” (p = 1,25) a csúcs felé – se tojás, se szív
    const berryF = th => { const s = sin(rad(th)), c = abs(cos(rad(th)));
      if(s <= 0) return 1 - 0.12 * s * s - 0.05 * gauss(dAng(th, -90), 22);
      return (c ** 1.25 + (s / 1.4) ** 1.25) ** (-1 / 1.25); };
    const F = Blob({ cx:42, cy:46, rx:26, ry:26, f:berryF });
    const K = Blob({ cx:69, cy:42, rx:18, ry:18, rot:-58, f:berryF });
    const seeds = (B, list, rr) => list.map(([th, rho]) => { const p = B.at(th, rho), q = B.at(90, 1), a = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / PI;
      return ellipse(p[0], p[1], rr, rr * 0.62, 5, a + 90); });
    const calyx = (cx, cy, sx, sy, rot, n) => Array.from({ length:n }, (_, i) => {
      const a = rad(rot + 180 * i / (n - 1) - 180 + 180 / n * 0), tip = [cx + cos(a) * sx, cy + sin(a) * sy * -1 + sy * 0.55], pr = [-sin(a) * 2.6, cos(a) * 1.3];
      const mid = lerp([cx, cy], tip, 0.5);
      return [[cx + pr[0], cy + pr[1]], [mid[0] + pr[0], mid[1] + pr[1]], tip, [mid[0] - pr[0], mid[1] - pr[1]], [cx - pr[0], cy - pr[1]]];
    });
    const fc = calyx(42, 25.5, 20, 7.5, 0, 7), kc = calyx(58, 32, 13, 5, -58, 5);
    add('f_eper', { hu:'Eper', en:'two ripe strawberries with green calyx and seeds', tilt:TILT, shapes:[
      body('red', 'base', K.sil(36)),
      fill('red', 'light', K.tone(L, TONE.light)),
      fill('red', 'dark', K.tone(L, d => d < 0.3)),
      fill('honey', 'light', seeds(K, [[-10, 0.45], [30, 0.5], [70, 0.55], [110, 0.5], [150, 0.5], [50, 0.85], [0, 0.82], [90, 0.8], [130, 0.82]], 1.1)),
      bodyP('leaf', 'dark', kc),
      body('red', 'base', F.sil(36)),
      fill('red', 'light', F.tone(L, TONE.light)),
      fill('red', 'dark', F.tone(L, TONE.dark)),
      fill('berry', 'base', F.tone(L, TONE.edge), { o:0.45 }),
      fill('honey', 'light', seeds(F, [[-160, 0.5], [-20, 0.5], [180, 0.8], [0, 0.82], [20, 0.35], [60, 0.4], [100, 0.42], [140, 0.36], [40, 0.72], [75, 0.72], [110, 0.74], [150, 0.7], [90, 0.9], [-160, 0.86], [-20, 0.86], [-120, 0.35], [-60, 0.35]], 1.25)),
      shine([band([F.at(-172, 0.62), F.at(-160, 0.7), F.at(-148, 0.72)], t => 0.8 + 2.6 * sin(PI * t))], 0.75),
      bodyP('leaf', 'base', fc),
      fill('leaf', 'light', fc.slice(0, 3).map(p => [lerp(p[0], p[4], 0.5), p[1], p[2]])),
      { t:'path', m:'leaf', tone:'base', p:pathOf([band([[42, 26.5], [42.6, 19.5], [45.2, 13.5]], t => 2.8 - 0.7 * t)]) },
    ]});
  }

  // ======================================================================
  //  BURGONYA – két göröngyös, homokbarna gumó, sötét „szemek” (kis sarlók), földes pöttyök
  // ======================================================================
  {
    const TILT = -10, L = lightFor(TILT);
    const lump = (p1, p2, p3) => th => { const a = rad(th); return 1 + 0.05 * sin(2 * a + p1) + 0.035 * sin(3 * a + p2) + 0.02 * sin(5 * a + p3); };
    const A = Blob({ cx:43, cy:43, rx:34, ry:21, rot:-22, f:lump(1, 2, 0.5) });
    const Bf = Blob({ cx:60, cy:64, rx:27, ry:18, rot:12, f:lump(2.5, 0.3, 1.7) });
    const eye = (B, th, rho, sz, rot) => { const [x, y] = B.at(th, rho), a = rad(rot); const P = (u, v) => [x + u * cos(a) - v * sin(a), y + u * sin(a) + v * cos(a)];
      return [P(-sz, 0), P(-sz * 0.4, sz * 0.55), P(sz * 0.4, sz * 0.55), P(sz, 0), P(sz * 0.3, sz * 0.2), P(-sz * 0.3, sz * 0.2)]; };
    add('f_burgonya', { hu:'Burgonya', en:'two raw brown potatoes', tilt:TILT, shapes:[
      body('cardboard', 'base', A.sil(34)),
      fill('cardboard', 'light', A.tone(L, TONE.light)),
      fill('cardboard', 'dark', A.tone(L, TONE.dark)),
      fill('cardboard', 'line', A.tone(L, TONE.edge), { o:0.4 }),
      body('cardboard', 'base', Bf.sil(32)),
      fill('cardboard', 'light', Bf.tone(L, TONE.light)),
      fill('cardboard', 'dark', Bf.tone(L, TONE.dark)),
      fill('cardboard', 'line', Bf.tone(L, TONE.edge), { o:0.4 }),
      fill('soil', 'dark', [eye(A, -150, 0.55, 2.6, -30), eye(A, -60, 0.5, 2.2, -15), eye(A, 170, 0.35, 2.2, -20), eye(Bf, -40, 0.45, 2.6, 10), eye(Bf, 150, 0.55, 2.3, 20), eye(Bf, 60, 0.35, 2, 5)]),
      fill('soil', 'base', dots([A.at(-110, 0.35), A.at(-20, 0.7), A.at(-175, 0.75), A.at(-80, 0.8), Bf.at(-10, 0.75), Bf.at(100, 0.6), Bf.at(-120, 0.55), Bf.at(20, 0.25)], 0.7), { o:0.6 }),
      shine([band([A.at(-170, 0.62), A.at(-145, 0.72), A.at(-120, 0.72)], t => 0.6 + 2 * sin(PI * t))], 0.45),
    ]});
  }

  // ======================================================================
  //  VÖRÖSHAGYMA – aranybarna csepp-forma, száraz csavart csúcs, papírszerű héj-erek (délkörök), gyökérszakáll
  // ======================================================================
  {
    const TILT = 12, L = lightFor(TILT);
    const B = Blob({ cx:50, cy:58, rx:33, ry:29, f:th => sin(rad(th)) < 0 ? dropTop(th, 1.32, 1.35) : 1 - 0.08 * sin(rad(th)) ** 2 });
    const sil = B.sil(40, 90), top = 58 - 29 * 1.32, bot = 58 + 29 * 0.92;
    const neck = Tube([[50, top + 5], [50.4, top - 2], [49, top - 8], [51.5, top - 13]], t => 7.5 * (1 - t) + 1.6);
    add('f_hagyma', { hu:'Vöröshagyma', en:'golden-brown onion with papery skin and a dry tip', tilt:TILT, shapes:[
      body('cardboard', 'light', fringe(50, bot - 1.5, 7, 5)),                                            // gyökérszakáll
      body('orange', 'base', sil),
      fill('orange', 'light', B.tone(L, TONE.light)),
      fill('orange', 'dark', B.tone(L, TONE.dark)),
      fill('orange', 'line', B.tone(L, TONE.edge), { o:0.4 }),
      fill('orange', 'line', [-0.7, -0.3, 0.12, 0.52, 0.85].map(k => meridianLine(sil, k, top + 7, bot - 3, 1.2)), { o:0.35 }),   // héj-erek
      fill('cardboard', 'light', [meridian(sil, -0.86, -0.62, 58, bot - 5, 5)], { o:0.8 }),              // leváló papírhéj-csík
      body('cardboard', 'base', neck.sil()),
      fill('cardboard', 'light', neck.tone(L, TONE.light)),
      fill('wood', 'dark', [band([[50.2, top + 3], [49.8, top - 3], [50.2, top - 8]], 1)], { o:0.6 }),
      body('wood', 'base', [ellipse(50, bot - 0.5, 5.5, 2, 8)].flat()),                                 // gyökértányér
      shine([band([B.at(-165, 0.7), B.at(-148, 0.74), B.at(-130, 0.72)], t => 0.8 + 2.6 * sin(PI * t))], 0.6),
    ]});
  }

  // ======================================================================
  //  FOKHAGYMA – krémfehér gerezdes fej (bordák: világos és sötét sávok), lila erezet, száraz szár, gyökér + egy különálló gerezd
  // ======================================================================
  {
    const TILT = -14, L = lightFor(TILT);
    const B = Blob({ cx:46, cy:52, rx:30, ry:27, f:th => { const s = sin(rad(th));
      if(s < 0) return dropTop(th, 1.38, 1.2);
      return 1 - 0.1 * s * s + 0.045 * s * s * (-cos(rad(360 * (th - 90) / 33))); } });
    const sil = B.sil(44, 90), top = 52 - 27 * 1.38, bot = 52 + 27 * 0.9, y0 = top + 7, y1 = bot - 3;
    const neck = Tube([[46, top + 5], [46.3, top - 2], [45, top - 8]], t => 7 * (1 - t) + 2.4);
    const cl = [...bez([60, 78], [72, 68], [88, 70], 6), ...bez([88, 70], [82, 90], [63, 89], 6)];   // gerezd: hát + has
    add('f_fokhagyma', { hu:'Fokhagyma', en:'white garlic bulb with cloves and a dry stem', tilt:TILT, shapes:[
      body('cardboard', 'light', fringe(46, bot - 1.5, 6.5, 4)),
      body('cream', 'base', sil),
      fill('paper', 'light', [[-0.97, -0.8], [-0.55, -0.36], [0, 0.18], [0.55, 0.68]].map(([a, b]) => meridian(sil, a, b, y0, y1, 8))),
      fill('cream', 'dark', [[-0.72, -0.55], [-0.17, 0], [0.36, 0.55], [0.8, 0.97]].map(([a, b]) => meridian(sil, a, b, y0, y1, 8))),
      fill('cream', 'line', B.tone(L, TONE.edge), { o:0.35 }),
      fill('cream', 'line', [-0.55, 0, 0.55].map(k => meridianLine(sil, k, y0 - 2, y1 + 2, 1.3)), { o:0.55 }),
      fill('purple', 'light', [meridianLine(sil, -0.3, 58, y1, 1.6, 5), meridianLine(sil, 0.3, 62, y1, 1.4, 4)], { o:0.7 }),
      body('cardboard', 'light', neck.sil()),
      fill('cardboard', 'base', neck.tone(L, TONE.dark, true)),
      body('cream', 'base', cl),
      fill('cream', 'dark', [[...bez([88, 70], [82, 90], [63, 89], 6), ...bez([63, 89], [76, 84], [86, 73], 5)]]),
      fill('paper', 'light', [[...bez([61, 79], [72, 70], [86, 71], 5), ...bez([86, 71], [72, 74], [62, 81], 5)]]),
      fill('cardboard', 'base', [[[60, 78], [65, 80], [65.5, 88], [62.5, 89], [59.5, 84]]]),
      shine([band([B.at(-168, 0.62), B.at(-150, 0.7), B.at(-132, 0.68)], t => 0.6 + 2.4 * sin(PI * t))], 0.9),
    ]});
  }

  // ======================================================================
  //  SALÁTA (fejes vajsaláta) – kerek fej: hátul sötétebb levelek, felül halvány szív, elöl három nagy, legyező-szerű
  //  külső levél hullámos-fodros peremmel; a levelek a középérnél „hajlanak” (világos és sötétebb fél), a tőből induló
  //  világos erekkel. (Káposzta ellen: laza, fodros sziluett, világos sárgászöld, nincs sima, zárt gömb.)
  // ======================================================================
  {
    const TILT = -10, L = lightFor(TILT);
    const Hd = Blob({ cx:50, cy:47, rx:37, ry:32, f:th => { const a = rad(th); return 1 + (0.045 + 0.03 * max(0, -sin(a))) * sin(9 * a + 0.4) + 0.022 * sin(19 * a + 1); } });
    const T = Blob({ cx:50, cy:26.5, rx:17, ry:7, f:th => 1 + 0.14 * sin(7 * rad(th) + 1) });
    const Bp = [50, 90], dir = (ps, r) => [Bp[0] + r * sin(rad(ps)), Bp[1] - r * cos(rad(ps))];
    // levél-legyező a tőből: phi irány (fok, függőlegestől), D fél-nyílás, l hossz, hullámos perem
    function fan(phi, D, l, bumps, amp, n = 22){
      const edgeR = u => l * (0.5 + 0.5 * sqrt(max(0, 1 - u * u))) + amp * sin(PI * bumps * (u + 1)) * (1 - u * u) ** 0.3;
      const arcPts = Array.from({ length:n + 1 }, (_, i) => { const u = -1 + 2 * i / n; return dir(phi + D * u, edgeR(u)); });
      const side = (u, back) => { const e = dir(phi + D * u, edgeR(u)), c = dir(phi + D * u * 1.35, l * 0.42); const b = bez(Bp, c, e, 5); return back ? b.reverse() : b; };
      const mid = dir(phi, edgeR(0));
      return { poly:[...side(-1), ...arcPts.slice(1, -1), ...side(1, true).slice(0, -1)],
        half:sgn => sgn < 0 ? [...side(-1), ...arcPts.slice(1, n / 2 + 1), Bp] : [Bp, ...arcPts.slice(n / 2, -1), ...side(1, true).slice(0, -1)],
        vein:band(bez(lerp(Bp, mid, 0.08), dir(phi * 1.1, l * 0.5), lerp(Bp, mid, 0.86), 6), t => 2.6 * (1 - t) + 0.5, false) };
    }
    const Lf = fan(-42, 27, 50, 5, 2.2), Cf = fan(0, 30, 44, 6, 2), Rf = fan(42, 27, 50, 5, 2.2);
    add('f_salata', { hu:'Saláta', en:'fresh head of butter lettuce with ruffled leaves', tilt:TILT, shapes:[
      body('leaf', 'base', Hd.sil(60, 3)),
      fill('leaf', 'light', Hd.tone(L, d => d > 0.62, 48)),
      fill('leaf', 'dark', Hd.tone(L, TONE.dark, 48)),
      { t:'poly', m:'grass', tone:'light', d:true, pts:R(T.sil(28)) },                                   // halvány szív
      fill('sage', 'light', T.tone(L, d => d > 0.55, 28)),
      body('grass', 'light', Lf.poly),
      fill('sage', 'base', [Lf.half(-1)]),
      body('grass', 'base', Rf.poly),
      fill('grass', 'dark', [Rf.half(1)]),
      body('grass', 'light', Cf.poly),
      fill('grass', 'base', [Cf.half(1)]),
      fill('sage', 'light', [Lf.vein, Cf.vein, Rf.vein]),
      fill('leaf', 'dark', [band(bez([37, 82], [50, 94], [63, 82], 6), t => 3.2 * sin(PI * t), false)], { o:0.55 }),   // árnyék a tőnél
    ]});
  }

  // ======================================================================
  //  BROKKOLI – rózsás, göröngyös virágfej (körök uniója, rózsánként árnyalt dombok és völgyek), vastag halványzöld szár ágakkal, vágott tő
  // ======================================================================
  {
    const TILT = 12, L = lightFor(TILT);
    // rózsák (hátulról előre): x, y, r
    const FL = [[38, 26, 10], [60, 24, 11], [26, 40, 10], [74, 38, 10.5], [49, 32, 12.5], [35, 47, 11], [64, 47, 11.5], [49, 50, 10]];
    const cx = 50, cy = 38;
    const reach = th => { const d = [cos(rad(th)), sin(rad(th))]; let best = 0;       // a sugár legtávolabbi metszése a körök uniójával
      for(const [x, y, r] of FL){ const ox = cx - x, oy = cy - y, b = ox * d[0] + oy * d[1], c = ox * ox + oy * oy - r * r, D = b * b - c; if(D >= 0) best = max(best, -b + sqrt(D)); }
      return best; };
    const Hd = Blob({ cx, cy, rx:1, ry:1, f:reach });
    const inFront = (i, p) => FL.some(([x, y, r], j) => j > i && hypot(p[0] - x, p[1] - y) < r - 0.4);
    const crev = FL.map(([x, y, r], i) => i < 4 ? null : arc(x, y, r - 0.8, 200, 340, 8).filter(p => !inFront(i, p)));   // elülső rózsák felső íve = völgy
    const caps = FL.map(([x, y, r], i) => { const c = [x - r * 0.3, y - r * 0.32]; return inFront(i, c) ? null : ellipse(c[0], c[1], r * 0.36, r * 0.26, 7, -30); });
    const buds = [[30, 30], [44, 22], [56, 18], [70, 31], [22, 44], [42, 38], [58, 38], [30, 52], [55, 44], [78, 44], [46, 56], [66, 54]].map(([x, y]) => ellipse(x, y, 1.1, 0.9, 5));
    const stem = Tube([[50, 52], [50, 70], [49.5, 88]], t => 15 + 5 * t);
    const branches = [Tube([[46, 66], [38, 56], [33, 49]], t => 7 - 2 * t), Tube([[54, 64], [62, 56], [66, 50]], t => 7.5 - 2 * t)];
    add('f_brokkoli', { hu:'Brokkoli', en:'broccoli head with florets and a thick stalk', tilt:TILT, shapes:[
      bodyP('grass', 'base', branches.map(b => b.sil())),
      body('grass', 'base', stem.sil(false)),
      fill('grass', 'light', stem.tone(L, TONE.light)),
      fill('grass', 'dark', stem.tone(L, TONE.dark, true)),
      body('sage', 'light', ellipse(49.5, 88, 10, 3.4, 12)),                                                  // vágott tő
      fill('leaf', 'dark', [ellipse(50, 53, 17, 4.5, 10)], { o:0.6 }),                                       // árnyék a fej alatt
      body('leaf', 'base', Hd.sil(64)),
      fill('leaf', 'dark', Hd.tone(L, d => d < 0.3, 56)),
      fill('leaf', 'line', Hd.tone(L, TONE.edge, 56), { o:0.45 }),
      fill('leaf', 'dark', crev.filter(a => a && a.length > 2).map(a => band(a, t => 1.8 * sin(PI * (0.1 + 0.8 * t)), true))),
      fill('leaf', 'light', caps.filter(Boolean)),
      fill('grass', 'light', buds, { o:0.7 }),
    ]});
  }

  // ======================================================================
  //  SÁRGARÉPA – hosszú, elvékonyodó narancs gyökér gyűrűs barázdákkal, felül vágott váll, dús, tollas zöld lombbal
  // ======================================================================
  {
    // a répát 18°-kal megdöntve rajzoljuk, és a matrica további 12°-ot dől (együtt 30°) – így a döntetlen befoglaló is kicsi marad
    const TILT = 12, L = lightFor(TILT), PRE = rad(18), Q = ([x, y]) => [50 + (x - 50) * cos(PRE) - (y - 58) * sin(PRE), 58 + (x - 50) * sin(PRE) + (y - 58) * cos(PRE)];
    const spine = [[50, 42], [50.6, 52], [50.8, 62], [50.2, 72], [49, 82], [47.4, 93]].map(Q);
    const C = Tube(spine, t => 26 * (1 - t) ** 0.85 + 1.6);
    // leveles szár: kerek karéjos szélű, elnyújtott levél egy görbe mentén (petrezselyem-szerű)
    const frond = (p0, c, p1, w, n = 14) => { const P = bez(p0, c, p1, n), Lh = [], Rh = [];
      P.forEach((p, i) => { const q = P[min(n, i + 1)], o = P[max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = hypot(dx, dy) || 1, t = i / n;
        const env = t < 0.25 ? t / 0.25 * 0.45 : 0.45 + 0.55 * sin(PI * (t - 0.25) / 0.75) ** 0.6, h = w * env * (0.62 + 0.38 * abs(sin(PI * 3.5 * t)));
        Lh.push([p[0] - dy / l * h, p[1] + dx / l * h]); Rh.push([p[0] + dy / l * h, p[1] - dx / l * h]); });
      return [...Lh, ...Rh.reverse()]; };
    const back = [frond(Q([47, 42]), Q([34, 32]), Q([22, 16]), 6.5), frond(Q([53, 42]), Q([66, 32]), Q([78, 18]), 6.5)];
    const front = frond(Q([50, 42]), Q([47, 26]), Q([52, 7]), 7.5);
    const grooves = [0.16, 0.3, 0.44, 0.58, 0.72].map(t => { const i = min(4, floor(t * 5)), f = t * 5 - i, p = lerp(spine[i], spine[i + 1], f), hw = C.hw(i) * (1 - f) + C.hw(i + 1) * f, N = C.N[i];
      return band([[p[0] - N[0] * hw * 0.8, p[1] - 0.8], [p[0] - N[0] * hw * 0.25, p[1] + 0.6], [p[0] + N[0] * hw * 0.3, p[1] + 0.2]], t2 => 1.6 * sin(PI * (0.1 + 0.8 * t2)), false); });
    add('f_sargarepa', { hu:'Sárgarépa', en:'fresh carrot with a green leafy top', tilt:TILT, shapes:[
      bodyP('leaf', 'base', back),
      fill('leaf', 'dark', back.map(f => f.slice(0, 15).concat([lerp(f[0], f[14], 0.5)]))),
      body('grass', 'base', front),
      fill('grass', 'light', [front.slice(0, 15)]),
      body('orange', 'base', C.sil()),
      fill('orange', 'light', C.tone(L, TONE.light)),
      fill('orange', 'dark', C.tone(L, TONE.dark, true)),
      fill('orange', 'line', C.tone(L, TONE.edge, true), { o:0.4 }),
      fill('orange', 'dark', grooves),
      fill('leaf', 'dark', [ellipse(...Q([50, 39.5]), 6.5, 2.2, 8, 18)]),                                           // a lomb töve a répa tetején
      shine([band([C.at(1, -0.55), C.at(2, -0.6), C.at(3, -0.55)], t => 0.6 + 2.4 * sin(PI * t), false)], 0.7),
    ]});
  }

  // ======================================================================
  //  UBORKA – hosszú zöld henger világos hosszanti csíkokkal és pöttyös-dudoros héjjal; a bal vége levágva:
  //  sötét héj-perem, halványzöld hús, magház magokkal; a jobb végén kis szár-csonk
  // ======================================================================
  {
    const TILT = -24, L = lightFor(TILT);
    const spine = Array.from({ length:9 }, (_, i) => { const t = i / 8; return [16 + 70 * t, 52 - 7 * sin(PI * t) + 2 * t]; });
    const U = Tube(spine, t => 23 * (t < 0.8 ? 1 : sqrt(max(0, 1 - ((t - 0.8) / 0.2) ** 2)) * 0.8 + 0.2 * (t < 0.8 ? 0 : 1) * (1 - (t - 0.8) / 0.2)));
    const ang = Math.atan2(spine[1][1] - spine[0][1], spine[1][0] - spine[0][0]) * 180 / PI, e0 = spine[0];
    const face = (k, n = 12) => ellipse(e0[0], e0[1], 11.5 * 0.52 * k, 11.5 * k, n, ang);
    const bumps = [[1, -0.5], [2, 0.3], [2, -0.75], [3, -0.2], [3, 0.6], [4, -0.6], [4, 0.2], [5, 0.7], [5, -0.3], [6, -0.7], [6, 0.35], [7, -0.2], [1, 0.6]].map(([i, u]) => U.at(i, u));
    const seeds = [0, 60, 120, 180, 240, 300].map(a => { const r = rad(a), x = 0.52 * 4.4 * cos(r), y = 4.4 * sin(r), g = rad(ang);
      return ellipse(e0[0] + x * cos(g) - y * sin(g), e0[1] + x * sin(g) + y * cos(g), 0.7, 1.4, 5, a + ang); });
    const stripe = u => band([2, 3, 4, 5, 6, 7].map(i => U.at(i, u)), t => 2.4 * sin(PI * t), false);
    add('f_uborka', { hu:'Uborka', en:'fresh cucumber with bumpy skin, one end cut', tilt:TILT, shapes:[
      body('leaf', 'base', band(spine, t => 23 * (t < 0.8 ? 1 : sqrt(max(0, 1 - ((t - 0.8) / 0.2) ** 2)) * 0.9 + 0.1), false)),
      fill('leaf', 'light', U.tone(L, TONE.light)),
      fill('leaf', 'dark', U.tone(L, TONE.dark, true)),
      fill('leaf', 'line', U.tone(L, TONE.edge, true), { o:0.4 }),
      fill('grass', 'light', [stripe(-0.15), stripe(0.45)], { o:0.55 }),
      fill('sage', 'light', dots(bumps, 0.9), { o:0.9 }),
      body('leaf', 'dark', face(1)),                                                                     // vágott lap: héj-perem
      fill('grass', 'light', [face(0.84)]),
      fill('sage', 'light', [face(0.56, 10)]),
      fill('leaf', 'light', seeds),
      body('leaf', 'dark', band([spine[8], [spine[8][0] + 4, spine[8][1] - 0.5]], 3.2)),                  // szár-csonk
      shine([band([U.at(2, -0.55), U.at(4, -0.62), U.at(6, -0.55)], t => 0.6 + 2 * sin(PI * t), false)], 0.6),
    ]});
  }

  // ======================================================================
  //  BANÁN – háromágú fürt: a közös, barna csutkából íves, élben törő (világos felső él) sárga ujjak, barna hegyek
  // ======================================================================
  {
    const TILT = 12, L = lightFor(TILT);
    const bw = t => 4 + 13 * sin(PI * min(1, 0.08 + t * 1.02)) ** 0.65;
    const mk = (p0, c, p1) => { const sp = bez(p0, c, p1, 10); return { sp, T:Tube(sp, bw) }; };
    const B1 = mk([29, 25], [42, 60], [88, 42]), B2 = mk([27, 27], [34, 76], [85, 64]), B3 = mk([25, 29], [22, 90], [74, 86]);
    const all = [B1, B2, B3];
    const tip = b => { const n = b.sp.length, a = b.sp[n - 1], q = b.sp[n - 2], dx = a[0] - q[0], dy = a[1] - q[1], l = hypot(dx, dy); return band([lerp(q, a, 0.55), [a[0] + dx / l * 1.5, a[1] + dy / l * 1.5]], 3.8); };
    const ridge = b => band(b.sp.slice(2, 9).map((p, i) => b.T.at(i + 2, -0.3)), t => 1.3 * sin(PI * t), false);
    const shapes = [];
    for(const b of all){
      shapes.push(body('honey', 'base', b.T.sil()), fill('honey', 'light', b.T.tone(L, d => d > 0.66)), fill('honey', 'dark', b.T.tone(L, TONE.dark, true)));
    }
    shapes.splice(9, 0, fill('gold', 'dark', B3.T.tone(L, TONE.edge, true), { o:0.55 }));
    add('f_banan', { hu:'Banán', en:'bunch of three ripe bananas', tilt:TILT, shapes:[
      ...shapes,
      fill('gold', 'base', all.map(ridge), { o:0.55 }),
      bodyP('chocolate', 'base', all.map(tip)),
      fill('leaf', 'light', all.map(b => band(b.sp.slice(0, 3).map((p, i) => b.T.at(i, 0)), t => 3.4 * (1 - t) + 0.4, false)), { o:0.8 }),   // zöldes nyak
      body('wood', 'base', band([[25, 30], [26.5, 23], [29.5, 16]], t => 7 - 2.5 * t)),                 // közös csutka
      fill('wood', 'light', [band([[23.8, 29], [25, 23], [27.6, 17]], t => 2.2 - t, false)]),
      shine([band([B2.T.at(3, -0.55), B2.T.at(5, -0.62), B2.T.at(7, -0.5)], t => 0.6 + 2 * sin(PI * t), false)], 0.65),
    ]});
  }

  // ======================================================================
  //  GOMBA (barna csiperke) – egy egész gomba (kalap alatt a lemezek, vaskos tönk) és elöl egy félbevágott:
  //  a vágott lapon krémszínű hús, barna kalap-bőr és sötét lemezek – ettől gomba és nem más barna gumó
  // ======================================================================
  {
    const TILT = -12, L = lightFor(TILT);
    const cx = 40, rim = 42, e = 6.5 / 27;
    const Cap = Blob({ cx, cy:rim, rx:27, ry:24, f:th => { const s = sin(rad(th)), c = cos(rad(th)); return s <= 0 ? 1 : 1 / sqrt(c * c + (s * s) / (e * e)); } });
    const St = Tube([[cx, rim], [cx + 0.4, rim + 12], [cx + 0.8, rim + 24]], t => 15 + 5 * t * t);
    const gills = Array.from({ length:8 }, (_, i) => { const a = 18 + i * 20.5; return band([[cx + 27 * cos(rad(a)) * 0.3, rim + 6.4 * sin(rad(a)) * 0.3], [cx + 26.2 * cos(rad(a)), rim + 6.2 * sin(rad(a))]], t => 0.4 + 0.9 * t, false); });
    const capTop = Cap.sil(40, 0).filter(p => p[1] <= rim + 0.01);
    // félbevágott gomba: profil (kalap-ív + tönk), a vágott lap felénk néz
    const hx = 68, hy = 66, dome = arc(hx, hy, 20, 180, 360, 14).map(([x, y]) => [x, hy - (hy - y) * 0.8]);
    const face = [...dome, [hx + 20, hy + 4.2], [hx + 7, hy + 7.8], [hx + 7.5, hy + 21], [hx + 5, hy + 23.5], [hx - 5, hy + 23.5], [hx - 7.5, hy + 21], [hx - 6.5, hy + 7.8], [hx - 20, hy + 4.2]];
    const skin = [...dome, ...arc(hx, hy + 0.4, 17, 360, 180, 12).map(([x, y]) => [x, hy + 0.4 - (hy + 0.4 - y) * 0.78])];
    const gill2 = sx => [[hx + sx * 19.4, hy + 0.9], [hx + sx * 6.7, hy + 3.4], [hx + sx * 6.7, hy + 7.6], [hx + sx * 19.4, hy + 4.1]];
    add('f_gomba', { hu:'Gomba', en:'brown champignon mushrooms, one cut in half', tilt:TILT, shapes:[
      body('wood', 'light', ellipse(cx, rim, 26.6, 6.6, 18)),                                          // kalap alja: lemezek
      fill('wood', 'dark', gills),
      body('cream', 'base', St.sil()),
      fill('paper', 'light', St.tone(L, TONE.light)),
      fill('cream', 'dark', St.tone(L, TONE.dark, true)),
      body('wood', 'base', capTop),
      fill('wood', 'light', Cap.tone(L, d => d > 0.7).map(p => p.map(q => [q[0], min(q[1], rim - 1)]))),
      fill('wood', 'dark', Cap.tone(L, TONE.dark).map(p => p.map(q => [q[0], min(q[1], rim - 1)]))),
      fill('cardboard', 'light', dots([[29, 28], [37, 22.5], [47, 25], [25, 36], [54, 32], [41, 33]], 0.95), { o:0.85 }),
      body('cream', 'light', face),
      fill('wood', 'base', [skin]),
      fill('wood', 'dark', [gill2(-1), gill2(1)]),
      fill('cream', 'base', [[[hx + 2.6, hy + 8.2], [hx + 6.6, hy + 8.2], [hx + 7.1, hy + 21], [hx + 4.8, hy + 23], [hx + 3, hy + 23]]]),
      shine([band([Cap.at(-165, 0.72), Cap.at(-145, 0.8), Cap.at(-125, 0.82)], t => 0.6 + 2.4 * sin(PI * t), false)], 0.7),
    ]});
  }

  // ======================================================================
  //  CITROMLÉ – citrom alakú, sárga nyomkodós műanyag flakon: zöld, bordázott csavaros kupak, fehér csőr egy csepp lével,
  //  erős műanyag-csillanás, kis ovális címke citromkarika-jellel (ettől flakon, nem friss citrom)
  // ======================================================================
  {
    const TILT = 16, L = lightFor(TILT);
    const B = Blob({ cx:50, cy:60, rx:25, ry:28.5, f:th => 1 + 0.16 * gauss(dAng(th, 90), 11) + 0.05 * gauss(dAng(th, -90), 30) });
    const topY = 60 - 28.5 * 1.05;
    // kupak: kis hengerek 2D-ben (bal-alsó ív előre, felső ellipszis)
    const cyl = (cx, y0, y1, r, ry, m = 8) => [[cx - r, y0], [cx - r, y1], ...arc(cx, y1, r, 180, 360, m).map(([x, y]) => [x, y1 - (y1 - y) * ry / r]).slice(1, -1), [cx + r, y1], [cx + r, y0],
      ...arc(cx, y0, r, 0, 180, m).map(([x, y]) => [x, y0 + (y - y0) * ry / r]).slice(1, -1)];
    const capY0 = topY + 3.5, capY1 = topY - 8, capR = 7.8;
    const ridges = [-5, -2.5, 0, 2.5, 5].map(x => band([[50 + x, capY0 + 1.2 - abs(x) * 0.1], [50 + x, capY1 + 2.3]], 0.9, false));
    const lab = [50 - 3, 64], labR = 7.5;
    add('f_citromle', { hu:'Citromlé', en:'lemon-shaped squeeze bottle of lemon juice with a green cap', tilt:TILT, shapes:[
      body('honey', 'base', B.sil(40, 90)),
      fill('honey', 'light', B.tone(L, TONE.light)),
      fill('honey', 'dark', B.tone(L, TONE.dark)),
      fill('gold', 'dark', B.tone(L, TONE.edge), { o:0.6 }),
      fill('gold', 'base', [ellipse(50, topY + 3.2, 8.8, 2.8, 12)]),                                    // nyak-perem
      body('leaf', 'base', cyl(50, capY0, capY1, capR, 2.4)),                                             // bordázott kupak
      fill('leaf', 'dark', [[[50 + capR * 0.35, capY0 + 2], [50 + capR - 0.8, capY0 + 1], [50 + capR - 0.8, capY1], [50 + capR * 0.35, capY1 + 0.8]]]),
      fill('leaf', 'dark', ridges, { o:0.55 }),
      fill('leaf', 'light', [ellipse(50, capY1, capR - 0.9, 1.7, 12)]),
      body('white', 'base', [[46.6, capY1 + 0.3], [48.8, capY1 - 8.5], [51.2, capY1 - 8.5], [53.4, capY1 + 0.3]]),   // csőr
      fill('white', 'dark', [[[50.4, capY1 + 0.2], [51.1, capY1 - 8], [53, capY1 - 0.2]]]),
      { t:'poly', m:'cream', tone:'light', d:true, pts:R(ellipse(lab[0], lab[1], labR, labR * 0.92, 14)) },   // címke
      fill('honey', 'base', [ellipse(lab[0], lab[1], 4.6, 4.3, 12)]),
      fill('gold', 'dark', [0, 60, 120].map(a => band([arc(lab[0], lab[1], 3.6, a, a, 1)[0], arc(lab[0], lab[1], 3.6, a + 180, a + 180, 1)[0]], 0.8, false))),
      shine([band([B.at(-170, 0.62), B.at(-150, 0.7), B.at(-128, 0.72)], t => 0.8 + 3 * sin(PI * t), false), band([B.at(150, 0.6), B.at(165, 0.72)], t => 0.4 + 1.6 * sin(PI * t), false)], 0.8),
    ]});
  }

  // ======================================================================
  //  MÉZ – vállas üvegtégely mézzel, a zöld fedőn lecsorgó méz (egy csepp az üvegre is), méz-sárga hatszög-címke
  //  krém kerettel és lépsejt-rajzolattal (beeco-motívum), üvegfény-csíkok
  // ======================================================================
  {
    const TILT = -12, L = lightFor(TILT);
    const JR = 4.2, JH = 8.2, NR = 3.4, LR = 3.75, L0y = 8.8, L1y = 10.6;
    const P = camera({ az:0, el:22, F:70, tilt:TILT, span:78, fit:[[-JR, 0, -JR], [JR, 0, JR], [-JR, L1y, -JR], [JR, L1y, JR], [0, L1y + 0.4, 0]] });
    const jar = Lathe(P, [[3.8, 0], [4.15, 0.35], [JR, 0.9], [JR, 7.2], [4.05, 7.8], [3.6, JH], [NR, 8.5], [NR, L0y]]);
    const lid = Lathe(P, [[LR, L0y], [LR, L1y]]);
    const drip = (th) => { const D = [[-48, 1.1, 16], [-11, 1.6, 7], [30, 1.35, 14], [62, 0.9, 12]]; let d = 0.35;
      for(const [c, depth, w] of D){ const u = (th - c) / w; if(abs(u) < 1) d = max(d, 0.35 + depth * sqrt(1 - u * u)); } return d; };
    const honeyTop = [...Array.from({ length:13 }, (_, j) => lid.ring(LR + 0.08, L1y + 0.05, -90 - 180 * j / 12)),
      ...Array.from({ length:37 }, (_, j) => { const th = 90 - 180 * j / 36; return lid.ring(LR + 0.08, L1y - drip(th), th); })];
    const hex = (c, sw, sh, pad = 0) => { const V = [[0, 1], [0.87, 0.5], [0.87, -0.5], [0, -1], [-0.87, -0.5], [-0.87, 0.5]], out = [];
      V.forEach((v, i) => { const w = V[(i + 1) % 6]; for(let j = 0; j < 2; j++){ const t = j / 2, u = v[0] + (w[0] - v[0]) * t, vv = v[1] + (w[1] - v[1]) * t; out.push(jar.ring(JR + 0.02, c[1] + vv * sh, c[0] + u * sw)); } });
      return out; };
    const cells = [[-8, 4.4], [-8 - 12, 3.3], [-8 + 12, 3.3], [-8, 2.2]].slice(0, 3).map(([th, y]) => hex([th, y], 7.5, 0.95));
    add('f_mez', { hu:'Méz', en:'glass honey jar with honey dripping over the lid and a hexagon label', tilt:TILT, shapes:[
      body('honey', 'dark', jar.sil(12)),
      fill('honey', 'base', [jar.strip(-74, -30, 0, 5)]),
      fill('gold', 'dark', [jar.strip(26, 90, 0, 5)]),
      fill('orange', 'dark', [jar.strip(62, 90, 0, 5)], { o:0.55 }),
      fill('glass', 'light', [jar.strip(-90, 90, 5, 7, 0.4)], { o:0.9 }),                              // üres üvegnyak
      body('leaf', 'base', lid.sil(12)),
      fill('leaf', 'dark', [lid.strip(30, 90)]),
      fill('leaf', 'dark', [-60, -35, -10, 15].map(th => band([lid.at(0, th, 0.2), lid.at(1, th, 0.2)], 0.7, false)), { o:0.6 }),
      { t:'poly', m:'honey', tone:'base', d:true, pts:R(honeyTop) },                                     // lecsorgó méz a fedőn
      fill('honey', 'light', [lid.top(1, 14, 1.4)]),
      { t:'poly', m:'honey', tone:'base', d:true, pts:R([...Array.from({ length:5 }, (_, j) => lid.ring(LR + 0.1, L0y + 0.2 - 1.6 * j / 4, -16)), ...arc(0, 0, 1, 0, 180, 6).map(([x, y]) => { const q = lid.ring(LR + 0.1, L0y - 1.4, -11 - x * 5); return [q[0], q[1] + y * 1.6]; }), ...Array.from({ length:5 }, (_, j) => lid.ring(LR + 0.1, L0y - 1.4 + 1.6 * j / 4, -6))]) },   // a csepp a nyakra folyik
      { t:'poly', m:'cream', tone:'light', d:true, pts:R(hex([-8, 3.3], 34, 2.25)) },                    // címke: krém hatszög…
      { t:'poly', m:'honey', tone:'base', d:true, pts:R(hex([-8, 3.3], 25.5, 1.68)) },                   // …benne méz-sárga hatszög
      fill('honey', 'dark', cells.map(c => band([...c, c[0]], 0.8, false))),
      shine([jar.strip(-60, -52, 1, 4, 0), jar.strip(-44, -40, 1, 3, 0)], 0.75),
    ]});
  }

  // ======================================================================
  //  OLÍVAOLAJ – szögletes (marasca) üvegpalack aranyzöld olajjal, üres üvegváll és nyak, parafadugó,
  //  krém címke olívaággal (két levél, két fekete bogyó)
  // ======================================================================
  {
    const TILT = -14, L = lightFor(TILT);
    const W = 3.1, H = 16.5, S1 = 18.8, NR = 1.3, N1 = 23.2, LP = 23.8, CK = 26.4, OIL = 15.2;
    const P = camera({ az:34, el:16, F:90, tilt:TILT, span:84, fit:[[-W, 0, -W], [W, 0, W], [W, 0, -W], [-W, 0, W], [0, CK, 0], [-W, H, W], [W, H, -W]] });
    const V = (x, y, z) => P([x, y, z]);
    const front = (y0, y1, x0 = -W, x1 = W) => [V(x0, y0, W), V(x1, y0, W), V(x1, y1, W), V(x0, y1, W)];
    const side = (y0, y1, z0 = W, z1 = -W) => [V(W, y0, z0), V(W, y0, z1), V(W, y1, z1), V(W, y1, z0)];
    const shF = [V(-W, H, W), V(W, H, W), V(NR, S1, NR * 0.7), V(-NR, S1, NR * 0.7)], shR = [V(W, H, W), V(W, H, -W), V(NR, S1, -NR * 0.7), V(NR, S1, NR * 0.7)];
    const neck = Lathe(P, [[NR, S1 - 0.3], [NR, N1]]), lip = Lathe(P, [[NR + 0.3, N1], [NR + 0.3, LP]]), cork = Lathe(P, [[NR - 0.1, LP], [NR - 0.05, CK]]);
    const all = [...front(0, H), ...side(0, H), ...shF, ...shR, ...neck.sil(8), ...lip.sil(8), ...cork.sil(8)];
    const labF = (x, y) => V(x, y, W + 0.02);
    const lab = (x, y, rx, ry, rot) => ellipse(x, y, rx, ry, 8, rot).map(([u, v]) => labF(u, v));      // ellipszis a címke síkjában
    const olive = (x, y) => lab(x, y, 0.8, 0.95, 0);
    add('f_olivaolaj', { hu:'Olívaolaj', en:'square glass bottle of olive oil with a cork and an olive-branch label', tilt:TILT, shapes:[
      body('leaf', 'light', hull([...front(0, H), ...side(0, H), ...shF, ...shR])),
      fill('grass', 'light', [[V(-W, 0.3, W), V(-W * 0.55, 0.3, W), V(-W * 0.55, OIL, W), V(-W, OIL, W)].map((p, i) => [p[0] + (i < 1 || i > 2 ? 0.9 : 0), p[1]])]),
      fill('leaf', 'base', [side(0, OIL)]),
      fill('leaf', 'dark', [side(0, OIL, -W * 0.45, -W).map((p, i) => [p[0] - (i === 1 || i === 2 ? 0.9 : 0), p[1] - (i < 2 ? 0.8 : 0)])]),
      fill('glass', 'light', [front(OIL, H), shF]),
      fill('glass', 'dark', [side(OIL, H), shR]),
      body('glass', 'base', neck.sil(8)),
      fill('glass', 'light', [neck.strip(-80, -30)]),
      body('glass', 'dark', lip.sil(8)),
      body('cardboard', 'base', cork.sil(8)),
      fill('cardboard', 'light', [cork.top(1, 12, 0.5), cork.strip(-85, -40, 0, 1)]),
      { t:'poly', m:'cream', tone:'light', d:true, pts:R([labF(-2.5, 4), labF(2.5, 4), labF(2.5, 11.2), labF(-2.5, 11.2)]) },   // címke
      fill('leaf', 'dark', [band([labF(-1.7, 5.4), labF(-0.3, 7.3), labF(1.6, 9.7)], 0.8, false)]),       // olívaág
      fill('leaf', 'base', [lab(-1.25, 7.9, 1.65, 0.6, 58), lab(1.35, 7.9, 1.65, 0.6, 122 - 180 + 180), lab(0.2, 10, 1.4, 0.5, 70)]),
      fill('dark', 'base', [lab(0.7, 6.1, 0.8, 0.95, 0), lab(-0.8, 5.0, 0.75, 0.9, 0)]),
      shine([[V(-W * 0.75, 1.2, W), V(-W * 0.55, 1.2, W), V(-W * 0.55, OIL - 0.8, W), V(-W * 0.75, OIL - 0.8, W)], neck.strip(-62, -48, 0, 1, 0.3, 1)], 0.65),
    ]});
  }

  // ======================================================================
  //  KENYÉR – kerek tetejű vekni valódi méretekből vetítve: aranybarna, bevágott (irdalt) héj, elöl levágott vég
  //  a lyukacsos krémszínű béllel és a héj-peremmel
  // ======================================================================
  {
    const TILT = -16, L = lightFor(TILT);
    const WX = 6.2, SH = 5.2, TOP = 10, ZF = 8.5, ZB = -8.5;
    // keresztmetszet (x, y): lapos alj, enyhén domború oldal, kupolás tető
    const prof = [[-WX + 0.6, 0], [WX - 0.6, 0], [WX, 0.9], [WX + 0.2, SH * 0.6], ...Array.from({ length:9 }, (_, i) => { const a = rad(i * 180 / 8);
      return [(WX + 0.1) * cos(a), SH + (TOP - SH) * sin(a) ** 0.8]; }), [-WX - 0.2, SH * 0.6], [-WX, 0.9]];
    const P = camera({ az:38, el:24, F:80, tilt:TILT, span:84, fit:[...prof.map(([x, y]) => [x, y, ZF]), ...prof.map(([x, y]) => [x, y, ZB])] });
    const Fr = prof.map(([x, y]) => P([x, y, ZF])), Bk = prof.map(([x, y]) => P([x, y, ZB]));
    const dome = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];                                                        // a profil tető-pontjai jobbról balra
    const topS = [...dome.map(i => Fr[i]), ...dome.slice().reverse().map(i => Bk[i])];
    const shoulder = [...[2, 3, 4, 5].map(i => Fr[i]), ...[5, 4, 3, 2].map(i => Bk[i])];
    const sideS = [Fr[1], Fr[2], Fr[3], Bk[3], Bk[2], Bk[1]];
    const cen = [0, 5.2], crumb = prof.map(([x, y]) => P([cen[0] + (x - cen[0]) * 0.83, cen[1] + (y - cen[1]) * 0.8, ZF + 0.01]));
    const onTop = (x, z) => { const u = x / (WX + 0.1), y = SH + (TOP - SH) * max(0, 1 - u * u) ** 0.4; return P([x, y + 0.05, z]); };
    const slash = (z, w) => { const A = [-3.6, z + 1.8], B = [3.2, z - 1.8], pts = [];
      for(let i = 0; i <= 4; i++){ const t = i / 4, x = A[0] + (B[0] - A[0]) * t, zz = A[1] + (B[1] - A[1]) * t; pts.push(onTop(x - w * sin(PI * t) * 0.3, zz - w * sin(PI * t))); }
      for(let i = 4; i >= 0; i--){ const t = i / 4, x = A[0] + (B[0] - A[0]) * t, zz = A[1] + (B[1] - A[1]) * t; pts.push(onTop(x + w * sin(PI * t) * 0.3, zz + w * sin(PI * t))); }
      return pts; };
    const holes = [[-2.8, 5.6, 0.75], [1.2, 7, 0.6], [2.8, 3.8, 0.8], [-0.8, 2.4, 0.55], [-3.6, 2.8, 0.45], [0.2, 4.8, 0.4]].map(([x, y, r]) => ellipse(...P([x, y, ZF + 0.02]), r * P.k, r * P.k * 0.8, 7));
    add('f_kenyer', { hu:'Kenyér', en:'loaf of bread with the end sliced off', tilt:TILT, shapes:[
      body('wood', 'base', hull([...Fr, ...Bk])),
      fill('wood', 'light', [topS]),
      fill('wood', 'base', [shoulder]),
      fill('wood', 'dark', [sideS]),
      fill('wood', 'line', [[Fr[1], Bk[1], Bk[2], Fr[2]]], { o:0.45 }),
      fill('cardboard', 'light', [slash(4.6, 1.0), slash(-0.4, 1.0), slash(-5.4, 1.0)]),                        // irdalás: világosabb, felnyílt héj
      fill('wood', 'dark', [4.6, -0.4, -5.4].map(z => band([onTop(-3.2, z + 1.4), onTop(0, z + 0.3), onTop(3, z - 1.2)], t => 0.9 * sin(PI * t), false)), { o:0.8 }),
      { t:'poly', m:'wood', tone:'base', d:true, pts:R(Fr) },                                              // vágott vég: héj-perem…
      fill('cream', 'base', [crumb]),                                                                      // …és a bél
      fill('cream', 'light', [crumb.slice(8, 15).concat([P([-1.5, 4.5, ZF]), P([-4.8, 2.8, ZF])])]),
      fill('cream', 'dark', holes),
      shine([band([onTop(-2.6, 7.6), onTop(-3.8, 3), onTop(-4.4, -2)], t => 0.5 + 1.6 * sin(PI * t), false)], 0.55),
    ]});
  }
})();
