// ============================================================
//  Matricák — történelmi képregény B szinten (docs/rajzolas.md) – a Helytörténeti Múzeum kvízjátékához
//  (docs/tortenelem-jatekterv.md): gőzgép, szénes csille, olajkút (himbás szivattyú), olajhordó, műtrágyás zsák,
//  tehén, hosszúszárnyú bálna, rétisas, kukoricacső, olajpálma, benzinkút, kiszáradt fa, gyárkémény, láncfűrész,
//  ipari varrógép, tüntetőtábla. A képregény-paneleken ~100–200 px-en jelennek meg.
//  A rajz NEM ítélkezik: nincs szöveg, szám, márka, logó, emberi arc; a „kár” tárgya is semleges (füstölgő kémény, száraz fa).
//  A dobozszerű tárgyak valódi méretből (m) vetítve (ART.geo.camera), az élőlények és növények 2D-ben rajzolva (y lefelé);
//  4 éles tónus, 3/4-es nézet, tömör olíva árnyék. A fin() a kész rajzot a vászonra illeszti (perem + árnyék tartalékkal).
//  A segédek (vetítés, vágás, fin() illesztés) az art-kozlekedes.js készletének másolata – így a fájl önálló.
//  Render: node tools/art-render.js 2d web/js/art/art-tortenelem.js ki.png --skip tortenelem
//  Emoji-álnév nincs: a játék névvel kéri (ART.image('gozgep')).
// ============================================================
(function(){
  const { rad, camera, band } = ART.geo;
  const { hypot, max, min, abs, sqrt } = Math;
  const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d));
  const r1 = n => Math.round(n * 10) / 10;

  // ---------------- 2D segédek (ugyanaz a készlet, mint az art-imp.js-ben) ----------------
  const area = poly => poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const pos = p => area(p) >= 0 ? p : [...p].reverse(), neg = p => area(p) < 0 ? p : [...p].reverse();   // körüljárás: lyukhoz ellentétes
  function hull(pts){
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for(const q of p){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for(const q of p.reverse()){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function simplify(poly, eps = .25){
    const dp = pts => {
      if(pts.length < 3) return pts;
      const a = pts[0], b = pts[pts.length - 1], L = hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let best = 0, bi = 0;
      for(let i = 1; i < pts.length - 1; i++){ const d = abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if(d > best){ best = d; bi = i; } }
      return best > eps ? [...dp(pts.slice(0, bi + 1)).slice(0, -1), ...dp(pts.slice(bi))] : [a, b];
    };
    const half = Math.floor(poly.length / 2);
    return [...dp(poly.slice(0, half + 1)).slice(0, -1), ...dp([...poly.slice(half), poly[0]]).slice(0, -1)];
  }
  // függőlegesen konvex sokszögek uniójának körvonala (forgástest sziluettje)
  function envelope(polys, step = .5){
    const xs = polys.flat().map(p => p[0]), x0 = min(...xs), x1 = max(...xs), N = max(8, Math.ceil((x1 - x0) / step));
    const top = [], bot = [];
    for(let i = 0; i <= N; i++){
      const x = x0 + (x1 - x0) * min(max(i / N, .0005), .9995);
      let lo = Infinity, hi = -Infinity;
      for(const poly of polys) for(let j = 0; j < poly.length; j++){
        const a = poly[j], b = poly[(j + 1) % poly.length];
        if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0){ const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = min(lo, y); hi = max(hi, y); }
      }
      if(lo < Infinity){ top.push([x, lo]); bot.push([x, hi]); }
    }
    return simplify([...top, ...bot.reverse()], .2);
  }
  // a sziluett közelében lévő pontok behúzása (a tónus-lapok ne takarják le a kontúrt)
  function inset(pts, sil, d = .85){
    const s = Math.sign(area(sil)) || 1, n = sil.length;
    return pts.map(p => {
      let best = null, bd = Infinity;
      for(let i = 0; i < n; i++){
        const a = sil[i], b = sil[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey;
        if(L2 < 1e-9) continue;
        const t = max(0, min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / L2)), qx = a[0] + t * ex, qy = a[1] + t * ey, dd = hypot(p[0] - qx, p[1] - qy);
        if(dd < bd){ bd = dd; best = { qx, qy, ex, ey, L:sqrt(L2) }; }
      }
      if(!best || bd >= d) return p;
      return [best.qx - best.ey / best.L * s * d, best.qy + best.ex / best.L * s * d];
    });
  }
  // konvex vágás (Sutherland–Hodgman): a subject sokszög cp-n belüli része
  function clip(subject, cp){
    const sg = Math.sign(area(cp)), inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q, a, b) => { const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1], A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1], d = A1 * B2 - A2 * B1;
      return [(B2 * C1 - B1 * C2) / d, (A1 * C2 - A2 * C1) / d]; };
    let out = subject;
    for(let i = 0; i < cp.length && out.length; i++){ const a = cp[i], b = cp[(i + 1) % cp.length], inp = out; out = [];
      for(let j = 0; j < inp.length; j++){ const p = inp[(j + inp.length - 1) % inp.length], q = inp[j];
        if(inside(q, a, b)){ if(!inside(p, a, b)) out.push(cut(p, q, a, b)); out.push(q); } else if(inside(p, a, b)) out.push(cut(p, q, a, b)); } }
    return out;
  }
  const circ = (cx, cy, r, n = 12, ry = r, a0 = 0) => Array.from({ length:n }, (_, i) => { const a = rad(a0 + 360 * i / n); return [cx + r * Math.cos(a), cy + ry * Math.sin(a)]; });
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // töröttvonal simítása (másodfokú görbék a felezőpontokon át)
  const smooth = (pts, n = 4) => pts.length < 3 ? pts : pts.slice(0, -2).flatMap((_, i) => {
    const a = i ? lerp(pts[i], pts[i + 1], .5) : pts[0], c = i === pts.length - 3 ? pts[i + 2] : lerp(pts[i + 1], pts[i + 2], .5);
    return Array.from({ length:n + 1 }, (_, j) => { const t = j / n; return lerp(lerp(a, pts[i + 1], t), lerp(pts[i + 1], c, t), t); }).slice(i ? 1 : 0);
  });
  // lekerekített téglalap (u, v síkban); a map vetíti a felületre
  const rrect = (u0, v0, u1, v1, r, map = p => p, n = 3) => [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]]
    .flatMap(([cu, cv, a0]) => Array.from({ length:n + 1 }, (_, i) => map([cu + r * cos(a0 + 90 * i / n), cv + r * sin(a0 + 90 * i / n)])));

  // ---------------- 3D segédek ----------------
  const norm = v => { const l = hypot(...v) || 1; return v.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function cam(o){ const P = camera(Object.assign({ span:80 }, o)), a = rad(o.az || 0), e = rad(o.el || 0);
    P.V = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; return P; }
  const corners = (x0, x1, y0, y1, z0, z1) => { const o = []; for(const x of [x0, x1]) for(const y of [y0, y1]) for(const z of [z0, z1]) o.push([x, y, z]); return o; };
  // doboz látható lapjai (az > 0: eleje és jobb oldala látszik)
  function box(P, x0, x1, y0, y1, z0, z1){
    const c = (x, y, z) => P([x, y, z]);
    return { top:[c(x0, y1, z1), c(x1, y1, z1), c(x1, y1, z0), c(x0, y1, z0)], front:[c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
      right:[c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)], sil:hull(corners(x0, x1, y0, y1, z0, z1).map(P)) };
  }
  // forgástest: prof = [[r, y], …] alulról. Szög: 0 = elöl, −90 = bal szél, +90 = jobb szél
  function lathe(P, prof, ez = 1){
    const at = (r, y, a) => P([r * sin(a), y, r * ez * cos(a)]);
    const rAt = y => { for(let i = 1; i < prof.length; i++) if(y <= prof[i][1] || i === prof.length - 1){ const [ra, ya] = prof[i - 1], [rb, yb] = prof[i]; return yb === ya ? rb : ra + (rb - ra) * (y - ya) / (yb - ya); } return prof[0][0]; };
    const ring = (r, y, a0 = 0, a1 = 360, n = 20) => Array.from({ length:n + 1 }, (_, i) => at(r, y, a0 + (a1 - a0) * i / n));
    const full = (r, y, n = 16) => ring(r, y, 0, 360, n).slice(0, n);
    const rings = prof.map(([r, y]) => full(r, y, 24));
    const sil = envelope(rings.slice(1).map((rg, i) => hull([...rings[i], ...rg])));
    const on = (a, y, dr = 0) => at(rAt(y) + dr, y, a);
    const strip = (a0, a1, y0 = prof[0][1], y1 = prof[prof.length - 1][1], n = 5) => {
      const ys = [y0, ...prof.map(p => p[1]).filter(y => y > y0 && y < y1), y1];
      return inset([...ring(rAt(y0), y0, a0, a1, n), ...ys.slice(1, -1).map(y => on(a1, y)), ...ring(rAt(y1), y1, a1, a0, n), ...ys.slice(1, -1).reverse().map(y => on(a0, y))], sil);
    };
    return { at, rAt, ring, full, sil, on, strip };
  }
  // henger tetszőleges tengellyel: at(t, szög, r) a palást pontja; strip(t0, t1, a0, a1) = palást-sáv (tónushoz)
  function acyl(P, base, dir, r, len, n = 14){
    const d = norm(dir), u = norm(cross(d, abs(d[2]) > .9 ? [0, 1, 0] : [0, 0, 1])), w = cross(u, d);
    const pt = (t, a, rr = r) => P([0, 1, 2].map(k => base[k] + d[k] * t + rr * (Math.cos(rad(a)) * w[k] - Math.sin(rad(a)) * u[k])));
    const ring = (t, rr = r) => Array.from({ length:n }, (_, i) => pt(t, 360 * i / n, rr));
    const arcAt = (t, a0, a1, m = 5) => Array.from({ length:m + 1 }, (_, i) => pt(t, a0 + (a1 - a0) * i / m));
    const sil = hull([...ring(0), ...ring(len)]);
    const strip = (t0, t1, a0, a1) => inset([...arcAt(t0, a0, a1), ...arcAt(t1, a1, a0)], sil, .5);
    return { sil, top:ring(len), ring, at:pt, strip };
  }
  const LIGHT = norm([-0.5, 0.65, 0.55]);                 // fény: bal-fent-elöl (X jobbra, Y fel, Z a néző felé)
  const toneOf = n => { const s = dot(norm(n), LIGHT); return s > .6 ? 'light' : s > .15 ? 'base' : s > -.52 ? 'dark' : 'line'; };
  // kihúzott profil (x, y sík, z0…z1 mélység): front = elülső lap · tone(t) = az adott tónusú oldallapok
  function extrude(P, prof0, z0, z1){
    const prof = area(prof0) > 0 ? prof0 : [...prof0].reverse(), n = prof.length, front = prof.map(([x, y]) => P([x, y, z1])), sides = [];
    for(let i = 0; i < n; i++){ const a = prof[i], b = prof[(i + 1) % n], nn = norm([b[1] - a[1], a[0] - b[0], 0]);
      if(dot(nn, P.V) > .02) sides.push({ pts:[P([a[0], a[1], z1]), P([b[0], b[1], z1]), P([b[0], b[1], z0]), P([a[0], a[1], z0])], tone:toneOf(nn) }); }
    return { front, sides, tone:t => sides.filter(s => s.tone === t).map(s => s.pts), all:[front, ...sides.map(s => s.pts)] };
  }

  // ---------------- alakzat-gyártók ----------------
  const face = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, pts }, o);                    // fő lap: kontúr + fehér perem
  const det = (m, tone, pts, o) => Object.assign({ t:'poly', m, tone, d:true, line:false, pts }, o);  // tónus-lap / dísz
  const pth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, polys }, o);                 // több részből álló fő lap
  const dpth = (m, tone, polys, o) => Object.assign({ t:'path', m, tone, d:true, line:false, polys }, o);
  const shine = (pts, o = .6) => det('paper', 'light', pts, { o });
  const tube = (pts, w, cap = true) => band(pts, w, cap);
  const ln = (m, tone, pts, w, o) => Object.assign({ t:'line', m, tone, w, pts }, o);                 // vonal (w: a vászon-egységben, fin nagyítja)

  // ---------------- beillesztés a vászonra ----------------
  // a megdöntött sziluett befoglalóját a perem- és árnyék-tartalékkal a vászonra illeszti (egyenletes nagyítás + eltolás)
  function fin(name, meta){
    const t = rad(meta.tilt || 0), c = Math.cos(t), s = Math.sin(t), shapes = meta.shapes.filter(Boolean);
    const ptsOf = sh => sh.pts || (sh.polys ? sh.polys.filter(p => p && p.length > 2).flat() : []);
    const rot = ([x, y]) => [50 + (x - 50) * c - (y - 50) * s, 50 + (x - 50) * s + (y - 50) * c];
    const Q = shapes.filter(sh => !sh.d && sh.t !== 'line').flatMap(sh => ptsOf(sh).map(rot)), xs = Q.map(q => q[0]), ys = Q.map(q => q[1]);
    const X0 = 4.6, X1 = 95.4, Y0 = 4.6, Y1 = 91.8, g = meta.grow || 1;
    const k = min((X1 - X0) / (max(...xs) - min(...xs)), (Y1 - Y0) / (max(...ys) - min(...ys))) * g;
    const qm = [(max(...xs) + min(...xs)) / 2, (max(...ys) + min(...ys)) / 2], tg = [(X0 + X1) / 2, (Y0 + Y1) / 2];
    const d = [k * (50 - qm[0]) + tg[0] - 50, k * (50 - qm[1]) + tg[1] - 50], dI = [d[0] * c + d[1] * s, -d[0] * s + d[1] * c];
    const T = ([x, y]) => [r1(50 + k * (x - 50) + dI[0]), r1(50 + k * (y - 50) + dI[1])];
    const pathOf = polys => polys.filter(p => p && p.length > 2).map(p => { const q = p.map(T).filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]);
      return q.length > 2 ? 'M' + q.map(v => v.join(' ')).join(' ') + 'Z' : ''; }).join('');
    const out = [];
    for(const sh of shapes){
      const o = Object.assign({}, sh);
      if(o.pts && o.t === 'poly'){ o.pts = o.pts.map(T).filter((v, i, a) => !i || v[0] !== a[i - 1][0] || v[1] !== a[i - 1][1]); if(o.pts.length < 3) continue; }
      else if(o.polys){ o.p = pathOf(o.polys); delete o.polys; if(!/\S/.test(o.p)) continue; }
      else if(o.t === 'line'){ o.pts = o.pts.map(T); o.w = r1((o.w || 2) * k); }
      out.push(o);
    }
    delete meta.grow;
    ART.add(name, Object.assign({ emoji:[], shadow:'hard' }, meta, { shapes:out }));
  }

  // bilineáris térkép egy vetített négyszögre (q = [s0t0, s1t0, s1t1, s0t1]) – ablak, tábla ferde lapra
  const quad = q => ([s, t]) => lerp(lerp(q[0], q[1], s), lerp(q[3], q[2], s), t);
  // esőcsepp (képernyő-koordinátában): hegyes vég felfelé, dőlés fokban
  const drop = (cx, cy, r, a = 12) => { const c = cos(a), s = sin(a), R2 = ([x, y]) => [cx + x * c - y * s, cy + x * s + y * c];
    return [...circ(0, 0, r, 10, r, -20).filter(([, y]) => y > -r * .45), [0, -r * 2.1]].map(R2); };

  // ---------------- saját segédek (csak ebben a fájlban) ----------------
  // zárt töröttvonal simítása (a smooth zárt változata)
  const smoothC = (pts, n = 3) => { const m = lerp(pts[pts.length - 1], pts[0], .5); return smooth([m, ...pts, m], n).slice(0, -1); };
  // levél-forma sokszögként (két hegyes vég): tő (x, y), irány (fok, y lefelé), hossz, szélesség
  const leafPts = (x, y, deg, len, wid, n = 6) => { const dx = cos(deg), dy = sin(deg);
    const side = s => Array.from({ length:n + 1 }, (_, i) => { const t = i / n, o = s * wid / 2 * Math.sin(Math.PI * t) * (1 - .3 * t); return [x + dx * len * t - dy * o, y + dy * len * t + dx * o]; });
    return [...side(1), ...side(-1).reverse().slice(1, -1)]; };
  // hullámos szélű folt (tehénfolt, füstpamacs)
  const blob = (cx, cy, rx, ry, deg, wob, ph, n = 12) => Array.from({ length:n }, (_, i) => {
    const a = 2 * Math.PI * i / n, q = 1 + wob * Math.sin(3 * a + ph) + wob * .5 * Math.sin(5 * a + ph * 2), x = rx * q * Math.cos(a), y = ry * q * Math.sin(a);
    return [cx + x * cos(deg) - y * sin(deg), cy + x * sin(deg) + y * cos(deg)]; });
  // elvékonyodó sáv (ág, levél, tömlő): vastagság w0 → w1 a vonal mentén
  const taper = (pts, w0, w1, cap = true) => band(pts, t => w0 + (w1 - w0) * t, cap);
  // füst / pamacs: körök uniója + világos pamacs-tetők + sötétebb alj (mint az art-kozlekedes felhője)
  const puffs = (list) => {
    const polys = list.map(([x, y, r]) => circ(x, y, r, 14)), sil = envelope(polys, .8);
    const hi = list.map(([x, y, r]) => clip(circ(x - r * .25, y - r * .28, r * .58, 10), [[x - 2 * r, y - 2 * r], [x + 2 * r, y - 2 * r], [x + 2 * r, y], [x - 2 * r, y]]));
    return { sil, hi };
  };
  // vetített kör egy vízszintes síkon (y = magasság) – kupak, dugó, pocsolya
  const disc = (P, cx, y, cz, rx, rz = rx, n = 14) => circ(0, 0, 1, n).map(([a, b]) => P([cx + rx * a, y, cz + rz * b]));

  // ============================================================================================
  //  1. Gőzgép – Newcomen-féle „tűzgép” (1712 körül): téglából rakott gépház nyeregtetővel, az oromfalból
  //     kinyúló nagy fa himba ívfejjel és lelógó szivattyúrúddal, mellette réz „szénaboglya” kazán téglatalapzaton,
  //     a ház mögött füstölgő kémény. (ház 3,2 × 2,6 × 5 m, himba ~5 m; méterben)
  // ============================================================================================
  {
    const TILT = -6, HX = 1.6, HZ = 1.3, HH = 5, RH = 1.1, BY = 5.5, yE = BY - .35;
    const P = cam({ az:30, el:12, F:60, tilt:TILT, fit:[...corners(-3.6, 5.8, 0, HH + RH, -HZ, HZ), [-1.1, 10.8, -.8], [1.6, 11.6, -.8]] });
    const k = P.k, F = (u, v) => P([u, v, HZ]);
    const b = box(P, -HX, HX, 0, HH, -HZ, HZ), ch = box(P, -1.5, -.7, 3, 9, -1.2, -.4);
    const gable = [[HX, 0, HZ], [HX, 0, -HZ], [HX, HH, -HZ], [HX, HH + RH, 0], [HX, HH, HZ]].map(P);
    const roof = [[-HX - .15, HH - .1, HZ + .2], [HX + .15, HH - .1, HZ + .2], [HX + .15, HH + RH, 0], [-HX - .15, HH + RH, 0]].map(P);
    // himba: az oromfalból kilépő gerenda, a végén körív-fej (a lánc ennek a felületén fut le a szivattyúhoz)
    const arcH = Array.from({ length:7 }, (_, i) => { const a = -50 + 100 * i / 6; return [4.3 + cos(a), yE + sin(a)]; });
    const EB = extrude(P, [[HX, BY - .24], [4.3, yE - .22], ...arcH, [4.3, yE + .22], [HX, BY + .24]], -.25, .25);
    const tc = P([-1.1, 9, -.8]), sm = puffs([[tc[0] + 1.5, tc[1] - 4, 3.2], [tc[0] + 6, tc[1] - 7.5, 4.2], [tc[0] + 11.5, tc[1] - 9, 3.6]]);
    const Pb = p => P([p[0] - 2.6, p[1], p[2] + .3]), L = lathe(Pb, [[.9, .9], [.95, 1.3], [.8, 1.9], [.45, 2.3], [0, 2.45]]);
    const win = [[-.3, 2.6], [.5, 2.6], ...Array.from({ length:7 }, (_, i) => [.1 + .4 * cos(180 * i / 6), 3.6 + .4 * sin(180 * i / 6)]), [-.3, 2.6]].slice(0, -1);
    fin('gozgep', { hu:'gőzgép (Newcomen-féle)', en:'early Newcomen beam steam engine', look:'early 18th-century Newcomen atmospheric steam engine: red brick engine house with a slate gable roof, a big wooden rocking beam with an arch head sticking out of the gable wall and a pump rod hanging down to a stone well, a copper haystack boiler on a brick base with a glowing fire door, and a smoking brick chimney behind', tilt:TILT, shapes:[
      face('red', 'base', ch.front), face('red', 'dark', ch.right),                         // kémény
      face('steel', 'base', sm.sil), dpth('steel', 'light', sm.hi),                        // füst
      face('steel', 'dark', box(P, 4.9, 5.7, 0, .6, -.4, .4).sil),                        // kútfej
      face('red', 'base', b.front), face('red', 'dark', gable),                            // gépház
      dpth('red', 'dark', [.9, 1.8, 2.7, 3.6, 4.5].flatMap(v => [[F(-HX + .05, v), F(HX - .05, v), F(HX - .05, v + .08), F(-HX + .05, v + .08)],
        [P([HX, v, HZ - .05]), P([HX, v, -HZ + .05]), P([HX, v + .08, -HZ + .05]), P([HX, v + .08, HZ - .05])]])),   // téglasorok
      face('dark', 'light', roof),                                                        // palatető
      det('dark', 'base', win.map(([u, v]) => F(u, v)), { line:true }),                    // íves ablak
      det('wood', 'dark', rrect(-1.2, 0, -.6, 1.7, .08, ([u, v]) => F(u, v), 2), { line:true }),   // ajtó
      pth('wood', 'dark', EB.all.slice(1)), face('wood', 'base', EB.front),                // himba
      ln('dark', 'base', [P([5.3, yE, 0]), P([5.3, .6, 0])], .09 * k),                     // lánc és szivattyúrúd
      face('steel', 'base', box(P, -3.6, -1.6, 0, .9, -.6, 1.2).front),                   // kazán téglatalapzata
      det('ember', 'base', rrect(-2.95, .15, -2.3, .65, .06, ([u, v]) => P([u, v, 1.2]), 2), { line:true }),   // tűzajtó
      face('orange', 'base', L.sil), det('orange', 'light', L.strip(-75, -25)), det('orange', 'dark', L.strip(30, 90)),   // réz kazán
      ln('steel', 'line', [Pb([0, 2.4, 0]), Pb([0, 3, 0]), P([-HX + .05, 3, .3])], .13 * k),   // gőzcső
      shine([P([2, BY + .2, .25]), P([3.6, yE + .12, .25]), P([3.6, yE + .04, .25]), P([2, BY + .12, .25])], .7),
    ] });
  }

  // ============================================================================================
  //  2. Szenes csille – bányacsille síneken: lefelé keskenyedő acél teknő peremsávval, bordákkal és szegecsekkel,
  //     tetején púpozott fekete szénrakás, négy kerék, két sín talpfákon. (hossz 1,2 m, magasság 1,1 m; méterben)
  // ============================================================================================
  {
    const TILT = -8, Z = .34, WR = .18;
    const P = cam({ az:28, el:20, F:6, tilt:TILT, fit:corners(-.95, .95, -.09, 1.3, -Z - .2, Z + .2) });
    const k = P.k, E = extrude(P, [[-.5, .32], [.5, .32], [.62, 1], [-.62, 1]], -Z, Z), F = (u, v) => P([u, v, Z]);
    const wheels = z => [-.36, .36].map(cx => circ(0, 0, 1, 14).map(([a, b]) => P([cx + WR * a, WR + WR * b, z])));
    const rail = z => box(P, -.95, .95, -.05, 0, z - .03, z + .03).sil;
    // szénrakás: a teknő szája fölött púp, a felszínén kerek darabok – a körvonal a darabok uniója
    const hH = (x, z) => .3 * max(0, 1 - (x / .7) ** 2) * sqrt(max(0, 1 - (z / .45) ** 2));
    const lumps = [];
    for(const x of [-.5, -.3, -.1, .1, .3, .5]) for(const z of [-.2, 0, .2]) lumps.push(P([x, .98 + hH(x, z), z]));
    const r = .085 * k, heap = envelope([...lumps.map(c => circ(c[0], c[1], r, 8)), [F(-.62, 1), F(.62, 1), P([.62, 1, -Z]), P([-.62, 1, -Z])]], .6);
    const w = v => .5 + .12 * (v - .32) / .68;
    fin('szencsille', { hu:'szenes csille', en:'coal mine cart on rails', look:'grey steel mine cart on rails, the tub narrower at the bottom with a dark rim band, ribs and rivets, heaped with black coal lumps, four dark wheels on two rails over wooden sleepers', tilt:TILT, shapes:[
      pth('wood', 'base', [-.7, 0, .7].map(x => box(P, x - .09, x + .09, -.09, -.05, -.6, .6).sil)),   // talpfák
      face('steel', 'dark', rail(-Z - .04)), pth('dark', 'dark', wheels(-Z - .04)),        // hátsó sín és kerekek
      pth('steel', 'dark', [...E.tone('base'), ...E.tone('dark'), ...E.tone('line')]),    // teknő oldala
      face('dark', 'base', heap),                                                         // szén
      dpth('dark', 'light', lumps.map(([x, y]) => [[x - r * .6, y - r * .2], [x - r * .1, y - r * .7], [x + r * .5, y - r * .5], [x, y - r * .1]])),
      face('steel', 'base', E.front),                                                     // teknő eleje
      det('dark', 'base', [F(-.62, 1), F(.62, 1), F(.6, .92), F(-.6, .92)]),               // peremsáv
      dpth('steel', 'dark', [-.45, .45].map(s => [F(s * w(.34) - .03, .34), F(s * w(.34) + .03, .34), F(s * w(.9) + .03, .9), F(s * w(.9) - .03, .9)])),   // bordák
      dpth('steel', 'light', [-.5, -.17, .17, .5].map(u => circ(...F(u, .96), .018 * k, 6))),   // szegecsek
      pth('dark', 'base', wheels(Z + .04)), dpth('steel', 'base', [-.36, .36].map(cx => circ(...P([cx, WR, Z + .05]), .06 * k, 8))),   // első kerekek
      face('steel', 'base', rail(Z + .04)),                                               // első sín
      shine([F(-.52, .85), F(-.4, .85), F(-.36, .45), F(-.44, .45)], .6),
    ] });
  }

  // ============================================================================================
  //  3. Olajkút – himbás mélyszivattyú („bólogató ló”): talpgerenda, A-bak, mézsárga himba, a végén íves
  //     „lófej” a lelógó kötéllel és a kútfejjel, a másik végén hajtókar ellensúllyal és hajtórúddal. (hossz ~7 m)
  // ============================================================================================
  {
    const TILT = -4, BH = 4.2;
    const P = cam({ az:24, el:10, F:40, tilt:TILT, fit:corners(-3.5, 3.6, 0, 5.3, -.8, .8) });
    const k = P.k, sk = box(P, -3.5, 3.6, 0, .3, -.7, .7);
    const beam = extrude(P, [[-2.4, BH - .12], [2.2, BH + .06], [2.2, BH + .42], [-2.4, BH + .24]], -.18, .18);
    const arcP = Array.from({ length:7 }, (_, i) => { const a = -22 + 36 * i / 6; return [3.1 * cos(a), BH + .15 + 3.1 * sin(a)]; });
    const head = extrude(P, [[2.05, BH - .45], ...arcP, [2.05, BH + .8]], -.3, .3);
    const leg = (x0, z0) => tube([P([x0, .3, z0]), P([0, BH, z0 * .45])], .2 * k, false);
    const CW = [-2.95, 1.75], SH = [-2.2, 1.05];
    const wt = circ(0, 0, 1, 14).filter(([a]) => a <= .1).map(([a, b]) => P([CW[0] + .62 * a, CW[1] + .62 * b, .55]));
    fin('olajkut', { hu:'olajkút (himbás szivattyú)', en:'oil well pumpjack', look:'classic nodding oil pumpjack: dark steel base skid and A-frame, a honey-yellow walking beam with a curved horse head at one end and a cable hanging down to a small wellhead, a crank with a dark counterweight and a pitman arm at the other end', tilt:TILT, shapes:[
      face('dark', 'light', [sk.top[0], sk.top[1], sk.top[2], sk.top[3]]), face('dark', 'dark', sk.right), face('dark', 'base', sk.front),   // talpgerenda
      pth('dark', 'dark', [leg(-.95, -.45), leg(.95, -.45)]),                             // hátsó lábak
      face('steel', 'dark', box(P, -2.7, -1.7, .3, 1.4, -.4, .4).sil),                    // hajtómű
      pth('honey', 'dark', [...beam.tone('light'), ...beam.tone('base'), ...beam.tone('dark')]), face('honey', 'base', beam.front),   // himba
      pth('honey', 'dark', head.all.slice(1)), face('honey', 'base', head.front),          // lófej
      det('dark', 'base', band(arcP.map(([x, y]) => P([x - .03, y, .3])), .09 * k, false)),   // a lófej íves homloka
      ln('dark', 'line', [P([3.1, BH + .15, .08]), P([3.1, 1.5, .08])], .05 * k), ln('steel', 'dark', [P([3.1, 1.5, .08]), P([3.1, .8, .08])], .09 * k),   // kötél, rúd
      face('steel', 'base', box(P, 2.9, 3.3, .3, .85, -.2, .2).sil),                       // kútfej
      pth('dark', 'base', [leg(-.95, .45), leg(.95, .45), tube([P([-.55, 1.9, .42]), P([.55, 1.9, .42])], .14 * k, false)]),   // első lábak + merevítő
      det('steel', 'base', circ(...P([0, BH + .15, .25]), .24 * k, 10), { line:true }),      // csapágy
      face('dark', 'base', wt), det('dark', 'light', wt.slice(0, 5).concat([P([CW[0], CW[1], .55])])),   // ellensúly
      face('honey', 'dark', tube([P([...SH, .5]), P([...CW, .55])], .2 * k)),             // hajtókar
      face('honey', 'base', tube([P([...CW, .6]), P([-2.35, BH, .25])], .16 * k)),         // hajtórúd
      shine([P([-1.8, BH + .2, .18]), P([1.6, BH + .35, .18]), P([1.6, BH + .28, .18]), P([-1.8, BH + .13, .18])], .7),
    ] });
  }

  // ============================================================================================
  //  4. Olajhordó – 200 literes acélhordó (Ø 58 cm, 88 cm): sötét kék-szürke palást két kiálló gördülőabronccsal,
  //     peremes tető két dugóval, a pereméről lefolyó olajcsepp és egy kis olajfolt a tövében.
  // ============================================================================================
  {
    const TILT = 8, R = .29, H = .88;
    const prof = [[.27, 0], [.29, .025], [.29, .265], [.305, .29], [.29, .315], [.29, .565], [.305, .59], [.29, .615], [.29, .855], [.272, .88]];
    const P = cam({ az:0, el:20, F:5, tilt:TILT, fit:corners(-R - .05, R + .05, 0, H, -R - .05, R + .22) });
    const L = lathe(P, prof), k = P.k;
    const dripL = [L.on(-18, .872, .004), L.on(-18, .8, .004), L.on(-17, .72, .004), L.on(-17, .67, .004)], tip = L.on(-17, .655, .008);
    fin('olajhordo', { hu:'olajhordó', en:'steel oil barrel', look:'dark blue-grey 200-litre steel oil drum with two raised rolling hoops, a rimmed lid with two bungs, a black oil drip running down from the rim and a small oil puddle at its foot', tilt:TILT, shapes:[
      face('dark', 'base', disc(P, -.04, 0, .34, .22, .09)),                               // olajfolt
      face('blue', 'dark', L.sil),                                                        // palást
      det('blue', 'base', L.strip(-80, -32)), det('blue', 'line', L.strip(38, 90), { o:.55 }),
      dpth('blue', 'base', [L.strip(-89, 89, .27, .31), L.strip(-89, 89, .57, .61)]),      // gördülőabroncsok
      dpth('blue', 'line', [L.strip(-89, 89, .258, .27), L.strip(-89, 89, .558, .57)], { o:.6 }),
      face('blue', 'base', L.full(.272, .88, 20)), det('blue', 'dark', disc(P, 0, .881, 0, .245, .245, 20)),   // tető, mélyített lap
      dpth('steel', 'base', [disc(P, .12, .882, -.08, .045, .045, 8), disc(P, -.14, .882, -.1, .03, .03, 8)]),   // dugók
      pth('dark', 'base', [band(dripL, t => (.04 + .02 * t) * k, true), circ(...tip, .045 * k, 8)]),   // olajcsepp
      shine(L.strip(-60, -50, .06, .84), .45),
      det('dark', 'light', disc(P, -.1, .001, .35, .06, .02, 8), { o:.8 }),
    ] });
  }

  // ============================================================================================
  //  5. Műtrágyás zsák – teli, pocakos szőtt zsák (kb. 50 × 80 cm): felül varrott hajtás füles sarkokkal,
  //     elöl zsálya címkefolt levél- és csepp-jellel (felirat nélkül), jobb alul kis szakadás, fehér granulátum kiperegve.
  // ============================================================================================
  {
    const sack = smoothC([[27, 18], [34, 13], [50, 16], [67, 12], [75, 18], [79, 32], [83, 52], [82, 72], [77, 86], [64, 91], [50, 92], [35, 91], [23, 86], [18, 72], [18, 50], [21, 31]], 3);
    const gr = [[81, 80, 1.7], [83, 84, 1.6], [84.5, 87.5, 1.7], [81.5, 90, 1.8], [86, 91, 1.8], [89.5, 90.5, 1.7], [84, 93, 1.7], [88, 94, 1.6], [92, 93.5, 1.5], [79.5, 93, 1.6]];
    fin('mutragyazsak', { hu:'műtrágyás zsák', en:'fertilizer sack', look:'plump cream woven fertilizer sack with a sewn folded top and corner ears, a sage label patch with a green leaf and a blue drop pictogram (no text), a small tear low on the side with white granules spilling into a little pile', tilt:-6, shapes:[
      pth('white', 'light', gr.map(([x, y, r]) => circ(x, y, r, 8))),                      // kiperegett granulátum
      face('cream', 'base', sack),
      det('cream', 'light', inset([[22, 33], [30, 29], [28, 60], [26, 85], [19, 72], [18.5, 50]], sack)),
      det('cream', 'dark', inset([[69, 28], [79, 32], [83, 52], [82, 72], [77, 86], [64, 91], [71, 70], [73, 48]], sack)),
      det('cardboard', 'base', clip(sack, [[0, 86], [100, 86], [100, 100], [0, 100]]), { o:.55 }),
      det('cream', 'dark', [[25, 22], [76, 19], [77, 26], [24, 28]], { o:.9 }),              // varrott hajtás
      dpth('cardboard', 'dark', Array.from({ length:9 }, (_, i) => { const x = 28 + i * 5.4, y = 24.4 - i * .3; return [[x, y], [x + 3, y - .15], [x + 3, y + 1.2], [x, y + 1.35]]; })),
      det('sage', 'base', rrect(33, 41, 65, 71, 4), { line:true }),                        // címkefolt
      det('leaf', 'base', leafPts(41, 64, -58, 21, 11), { line:true }),                    // levél-jel
      ln('leaf', 'dark', [[42, 62.5], [51, 48]], 1.1),
      det('water', 'base', drop(57, 63, 4.3, 0), { line:true }),                          // csepp-jel
      det('cardboard', 'dark', [[76, 73], [80.5, 71.5], [81, 78], [77, 79.5]], { line:true }),   // szakadás
      dpth('white', 'base', [circ(79, 76, 1.2, 6), circ(80, 78.5, 1.1, 6)]),
      shine([[24, 36], [27, 35], [25, 58], [22.5, 58]], .7),
    ] });
  }

  // ============================================================================================
  //  6. Tehén – fekete-fehér tejelő tehén állva, oldalról, a feje 3/4-ben a néző felé: fekete foltok, rózsaszín
  //     orr és tőgy, kis szarvak, bojtos farok, sötét paták. (marmagasság ~1,5 m; 2D rajz, y lefelé)
  // ============================================================================================
  {
    const body = smoothC([[30, 36], [48, 33], [70, 33], [84, 37], [89, 47], [87, 60], [80, 66], [58, 68], [38, 67], [29, 60], [26, 47]], 3);
    const head = smoothC([[12, 23], [25, 22], [30, 30], [28, 42], [25, 52], [13, 53], [9, 42], [9, 30]], 3);
    const hoof = ([x, y]) => [[x - 3.4, y - 3.2], [x + 3.4, y - 3.2], [x + 3.6, y + .6], [x - 3.6, y + .6]];
    const far = [[[41, 60], [41, 76], [40, 88]], [[80, 58], [83, 71], [80, 87]]], near = [[[34, 60], [33, 76], [33, 90]], [[72, 60], [75, 73], [72, 90]]];
    fin('tehen', { hu:'tehén', en:'dairy cow', look:'friendly black-and-white dairy cow standing in side view with the head turned three-quarters to the viewer: black patches, pink muzzle and udder, small cream horns, tufted tail and dark hooves', tilt:0, shapes:[
      pth('white', 'dark', far.map(l => taper(l, 7.6, 6.4))), dpth('dark', 'dark', far.map(l => hoof(l[2]))),   // túlsó lábak
      ln('white', 'line', [[87, 42], [91, 52], [92, 66]], 1.5), face('dark', 'base', blob(92.2, 69.5, 2.4, 3.6, 0, .12, 1, 10)),   // farok
      face('white', 'base', [[17, 30], [34, 35], [37, 58], [24, 52]]),                     // nyak
      face('white', 'base', body),
      det('white', 'dark', clip(body, [[0, 58], [100, 56], [100, 100], [0, 100]])),
      dpth('dark', 'base', [clip(blob(53, 42, 11, 7, 10, .14, 1), body), clip(blob(78, 50, 8, 10, -10, .12, 2), body), clip(blob(35, 55, 6, 5, 0, .15, 3), body)]),   // foltok
      face('blossom', 'base', smoothC([[62, 64], [75, 63], [74, 71], [69, 73], [63, 71]], 2)), dpth('blossom', 'dark', [[64, 71], [68, 72], [72, 71]].map(([x, y]) => circ(x, y + 1.6, 1.1, 6, 1.8))),   // tőgy
      pth('white', 'base', near.map(l => taper(l, 8, 6.6))), dpth('dark', 'base', near.map(l => hoof(l[2]))),   // közelebbi lábak
      pth('white', 'base', [leafPts(11, 30, 195, 11, 6), leafPts(28, 29, -12, 11, 6)]),    // fülek
      pth('cream', 'base', [leafPts(14, 24, -115, 6.5, 3.4), leafPts(23, 24, -65, 6.5, 3.4)]),   // szarvak
      face('white', 'base', head),
      det('dark', 'base', clip(blob(25, 26, 6.5, 6, 20, .12, 2), head)),                  // folt a homlokon
      det('blossom', 'base', smoothC([[10, 44], [27, 43], [28, 50], [24, 55], [13, 55], [9, 50]], 2), { line:true }),   // orr
      dpth('blossom', 'dark', [circ(14.5, 50, 1.5, 6, 1), circ(22, 50, 1.5, 6, 1)]),
      dpth('dark', 'base', [circ(13.5, 36, 1.6, 8), circ(23.5, 36, 1.6, 8)]),                // szemek
      shine([[34, 38], [46, 35.5], [46, 37.5], [35, 40]], .7),
    ] });
  }

  // ============================================================================================
  //  7. Bálna – hosszúszárnyú (púpos) bálna úszás közben oldalról: kék-szürke test, bütykös fej, világos hasoldal
  //     torokredőkkel, nagyon hosszú, fehér mellúszó, kis púpszerű hátúszó, felfelé íves farokúszó. (~14 m; 2D)
  // ============================================================================================
  {
    const body = smoothC([[5, 48], [14, 40], [28, 35], [45, 34], [60, 37], [65, 34.5], [68, 38], [79, 42], [88, 41.5], [88, 46], [78, 52], [62, 60], [45, 68], [30, 71], [17, 68], [8, 58]], 3);
    const pec = smooth([[27, 64], [34, 74], [42, 83], [49, 89]], 3);
    fin('balna', { hu:'hosszúszárnyú bálna', en:'humpback whale', look:'blue-grey humpback whale swimming in side view: knobby head, pale belly with throat grooves, a very long white pectoral fin, a small humped dorsal fin and a raised tail fluke', tilt:-8, shapes:[
      face('blue', 'dark', [[85, 42], [91, 33], [98, 27], [97.5, 34], [93, 42.5], [98, 51], [91.5, 50], [85, 46]]),   // farokúszó
      face('blue', 'dark', body),
      det('blue', 'line', clip(body, [[0, 0], [100, 0], [100, 41], [0, 41.5]]), { o:.7 }),      // sötét hát
      det('blue', 'base', clip(body, [[0, 47], [100, 42], [100, 46], [0, 53]]), { o:.8 }),      // világosabb oldalsáv
      det('white', 'base', clip(body, [[0, 58], [70, 54], [70, 90], [0, 90]])),           // has
      dpth('steel', 'dark', [[[11, 60], [24, 65.5], [42, 65]], [[13, 63], [26, 68.3], [40, 68]], [[18, 66], [31, 70]]].map(l => band(l, .8, false))),   // torokredők
      dpth('blue', 'base', [[10, 44.5], [14, 41.5], [19, 39.5], [24, 38.2], [7.2, 47.5]].map(([x, y]) => circ(x, y, 1.15, 6))),   // bütykök
      ln('blue', 'line', [[6, 49.5], [14, 53], [25, 55]], 1.2),                             // száj
      det('dark', 'base', circ(27.5, 51.5, 1.5, 8)),                                        // szem
      face('white', 'base', taper(pec, 9.5, 3)),                                          // mellúszó
      det('white', 'dark', taper(pec.map(([x, y]) => [x + 1.6, y - 1.6]), 4.5, 1.2)),
      dpth('white', 'light', [[30, 69], [36, 77], [42, 84]].map(([x, y]) => circ(x - 2.6, y + 2.2, 1.3, 6))),   // bütykös él
      shine([[16, 40.5], [30, 36], [30.5, 37.5], [17, 42]], .6),
    ] });
  }

  // ============================================================================================
  //  8. Rétisas – ülő rétisas ágon, oldalról, a feje 3/4-ben: barna test, sötétebb összecsukott szárny tollvégekkel,
  //     halvány krémszínű fej, nagy sárga horgas csőr, fehér ék alakú farok, sárga lábak karmokkal. (~90 cm; 2D)
  // ============================================================================================
  {
    const body = smoothC([[37, 30], [50, 28], [61, 37], [67, 54], [65, 70], [56, 78], [45, 77], [37, 65], [33, 46]], 3);
    const head = smoothC([[27, 25], [33, 15], [44, 13], [51, 19], [51, 32], [44, 38], [34, 35]], 3);
    const wing = smoothC([[45, 34], [60, 39], [68, 56], [75, 84], [64, 76], [51, 61], [43, 47]], 2);
    fin('sas', { hu:'rétisas', en:'white-tailed eagle', look:'perched white-tailed eagle in side view with the head turned: brown body, darker folded wing with feather tips, pale cream head, big hooked yellow beak, white wedge-shaped tail and yellow feet gripping a branch', tilt:0, shapes:[
      face('white', 'base', [[57, 64], [68, 62], [79, 92], [66, 95]]), det('white', 'dark', [[68, 62], [79, 92], [73, 93.5], [64, 64]]),   // farok
      face('wood', 'base', body),
      det('wood', 'light', inset([[37, 38], [45, 36], [44, 60], [47, 76], [38, 66], [34, 48]], body)),
      face('chocolate', 'base', wing),                                                    // szárny
      dpth('chocolate', 'light', [[54, 50], [58, 58], [62, 66], [66, 73]].map(([x, y]) => [[x, y], [x + 5.5, y + 2.5], [x + 6.5, y + 6], [x + .8, y + 3]])),   // tollvégek
      face('wood', 'dark', taper([[10, 82], [50, 81], [92, 77]], 7, 5.5)),                // ág
      det('wood', 'line', [[13, 84], [90, 79], [90, 80.5], [13, 85.5]], { o:.5 }),
      dpth('honey', 'base', [taper([[45, 74], [44, 80]], 4.6, 3.8), taper([[55, 74], [55, 80]], 4.6, 3.8)]),   // lábak
      dpth('dark', 'base', [[41.5, 81], [46.5, 81.5], [52, 81], [57.5, 81.5]].map(([x, y]) => leafPts(x, y, 100, 3.6, 1.8, 4))),   // karmok
      face('cream', 'base', head),                                                        // fej
      det('cream', 'dark', inset([[45, 17], [51, 19], [51, 32], [44, 38], [41, 33], [46, 26]], head)),
      face('honey', 'base', [[29, 21], [21, 21.5], [14, 25], [12, 30], [14.5, 32.5], [16.5, 29.5], [20, 30.5], [26, 32], [30, 29]]),   // horgas csőr
      det('honey', 'dark', [[12, 30], [14.5, 32.5], [16.5, 29.5], [20, 30.5], [26, 32], [25, 29.5], [16, 28]]),
      det('dark', 'base', circ(33, 22, 2, 8), { line:true }), det('honey', 'light', circ(32.4, 21.4, .7, 6)),   // szem
      shine([[36, 16], [42, 14.5], [42.5, 16], [37, 17.5]], .7),
    ] });
  }

  // ============================================================================================
  //  9. Kukoricacső – ferdén álló cső szemsorokkal (a hengeren balra világos, jobbra sötét szemek), félig
  //     lehántott zöld csuhélevelekkel, rövid szárral és a hegyén kukoricahajjal. (~25 cm; 2D)
  // ============================================================================================
  {
    const A = [31, 76], B = [69, 22], Lc = hypot(B[0] - A[0], B[1] - A[1]), d = [(B[0] - A[0]) / Lc, (B[1] - A[1]) / Lc], nv = [-d[1], d[0]];
    const rC = u => 12 - 3.6 * u, at = (u, s) => [A[0] + d[0] * Lc * u + nv[0] * s, A[1] + d[1] * Lc * u + nv[1] * s];
    const cob = taper([A, B], 24, 17);
    const kern = th => { const out = []; for(let i = 0; i < 12; i++){ const u = .06 + i * .078, r = rC(u), s = r * .9 * sin(th), hw = r * .27 * cos(th) + .3, hu = .033;
      out.push([at(u - hu, s - hw), at(u + hu, s - hw * .9), at(u + hu, s + hw * .9), at(u - hu, s + hw)]); } return out; };
    const husk = (pts, w) => taper(smooth(pts, 3), w, .8, false);
    fin('kukorica', { hu:'kukoricacső', en:'maize cob with husk', look:'golden maize cob standing diagonally with neat rows of kernels (lighter on the left, darker on the right), green husk leaves partly peeled back, a short stalk and brown silk at the tip', tilt:0, shapes:[
      face('grass', 'dark', husk([[30, 78], [19, 60], [12, 42], [15, 30]], 11)),           // hátsó csuhélevél
      face('grass', 'dark', husk([[34, 80], [53, 72], [68, 60], [80, 54]], 11)),
      face('gold', 'dark', cob),                                                          // cső
      dpth('honey', 'light', [...kern(-62), ...kern(-31)]), dpth('honey', 'base', kern(0)), dpth('gold', 'dark', [...kern(31), ...kern(62)]),   // szemek
      pth('cardboard', 'base', [[[0, 0], [-4, -8], [-1, -14]], [[0, 0], [5, -7], [6, -13]], [[0, 0], [1, -8], [5, -15]]].map(l => band(l.map(([x, y]) => [B[0] + x + 1, B[1] + y + 5]), 1.5))),   // kukoricahaj
      face('leaf', 'dark', taper([[29, 84], [24, 93]], 7, 6, false)),                     // szár
      face('grass', 'base', husk([[28, 80], [17, 83], [8, 88], [4, 93]], 12)),             // elöl lehajló levelek
      face('grass', 'light', husk([[33, 82], [44, 86], [54, 92], [62, 92]], 11)),
      ln('leaf', 'base', smooth([[28, 80], [17, 83.5], [8, 88.5]], 3), .9), ln('leaf', 'base', smooth([[33, 82], [44, 86.5], [54, 91]], 3), .9),
      shine([at(.2, -9.5), at(.75, -7), at(.75, -5.6), at(.2, -8)], .7),
    ] });
  }

  // ============================================================================================
  //  10. Olajpálma – karcsú, levélnyél-csonkos törzs, a koronában tollas, íves pálmalevelek, alattuk
  //      három vörös-narancs termésfürt apró termésekkel. (~10 m; 2D)
  // ============================================================================================
  {
    const C = [51, 38];
    // tollas levél: a középér mentén váltakozó szélességű (fogazott) sáv, a vége hegyes
    const frond = (ang, len, droop, w = 9, n = 10) => {
      const c = t => [C[0] + cos(ang) * len * t, C[1] + sin(ang) * len * t + droop * t * t];
      const up = [], dn = [];
      for(let i = 0; i <= n; i++){ const t = i / n, p = c(t), q = c(min(1, t + .02)), p0 = c(max(0, t - .02)), dx = q[0] - p0[0], dy = q[1] - p0[1], l = hypot(dx, dy) || 1;
        const hw = w / 2 * (t < .15 ? .4 + 4 * t : (1 - t) / .85) * (i % 2 ? 1 : .55) + .3;
        up.push([p[0] - dy / l * hw, p[1] + dx / l * hw]); dn.push([p[0] + dy / l * hw, p[1] - dx / l * hw]); }
      return [...up, ...dn.reverse()];
    };
    const simp = p => simplify(p, .2);
    const back = [[-100, 32, 5], [-150, 38, 14], [-30, 38, 14], [178, 42, 26], [2, 42, 26]].map(f => simp(frond(...f)));
    const front = [[-122, 36, 10], [-58, 36, 10], [155, 40, 30], [25, 40, 30]].map(f => simp(frond(...f, 10)));
    const trunk = taper(smooth([[50, 94], [48, 76], [49, 58], [51, 42]], 3), 11, 8, false);
    const bunch = (x, y) => circ(x, y, 7, 10, 6);
    const fr = (x, y, dx, dy) => [[-3, -2], [1, -3], [-1, 1.5], [3.5, 1], [0, 4.5], [-4, 2.5]].map(([a, b]) => circ(x + a + dx, y + b + dy, 1.5, 5));
    fin('olajpalma', { hu:'olajpálma', en:'oil palm tree', look:'oil palm tree: slender brown trunk with leaf-base stubs, a crown of arching feathery green fronds, and three red-orange fruit bunches of small round fruits hanging under the crown', tilt:0, shapes:[
      pth('leaf', 'dark', back),                                                          // hátsó levelek
      face('wood', 'base', trunk),                                                        // törzs
      det('wood', 'light', inset(taper(smooth([[47, 92], [45.5, 76], [46.5, 58], [48.5, 44]], 3), 3, 2.5), trunk)),
      dpth('wood', 'dark', [86, 78, 70, 62, 54].map((y, i) => { const x = 49 - (i > 2 ? -.5 : .5); return [[x - 4.5, y - 1], [x, y + 2.5], [x + 4.5, y - 1], [x, y + .8]]; })),   // levélnyél-csonkok
      pth('tomato', 'base', [bunch(42, 48), bunch(60, 48), bunch(51, 53)]),                 // termésfürtök
      dpth('orange', 'light', [...fr(42, 48, -.5, -.5), ...fr(60, 48, 0, 0), ...fr(51, 53, 0, 0)].filter((_, i) => i % 6 < 3)),
      dpth('tomato', 'dark', [...fr(42, 48, 0, 0), ...fr(60, 48, 0, 0), ...fr(51, 53, 0, 0)].filter((_, i) => i % 6 >= 3)),
      pth('leaf', 'base', front),                                                         // elülső levelek
      dpth('grass', 'base', [[-122, 36, 10], [-58, 36, 10]].map(([a, l, dr]) => band(Array.from({ length:5 }, (_, i) => { const t = .1 + i * .2; return [C[0] + cos(a) * l * t, C[1] + sin(a) * l * t + dr * t * t]; }), .9, false))),   // középerek
      pth('grass', 'light', [frond(-88, 30, 3, 7)]),                                       // felső, fényes levél
      shine([[47, 60], [48.5, 60], [48, 80], [46.5, 80]], .5),
    ] });
  }

  // ============================================================================================
  //  11. Benzinkút – régi (retró) üzemanyag-kútoszlop: piros, lekerekített tetejű test krém csíkkal, üvegablakos
  //      mutató-panel (számok nélkül), a tetején krém üveggömb mézsárga sávval, oldalt fekete tömlő a pisztollyal. (1,8 m)
  // ============================================================================================
  {
    const TILT = -8, X = .25, Z = .18;
    const P = cam({ az:28, el:12, F:8, tilt:TILT, fit:corners(-.3, .52, 0, 1.92, -.24, .24) });
    const k = P.k, F = (u, v) => P([u, v, Z]);
    const body = extrude(P, rrect(-X, .1, X, 1.5, .12), -Z, Z), pl = box(P, -.3, .3, 0, .1, -.23, .23);
    const g = P([0, 1.72, 0]), gr = .17 * k, globe = circ(g[0], g[1], gr, 16);
    const hose = smooth([P([X, 1.2, 0]), P([X + .2, 1.08, .02]), P([X + .26, .7, .06]), P([X + .22, .32, .1]), P([X + .12, .28, .12]), P([X + .07, .45, .14]), P([X + .06, .66, .15])], 3);
    fin('benzinkut', { hu:'benzinkút (régi kútoszlop)', en:'retro fuel pump', look:'retro red fuel pump with a rounded top, a cream stripe, a glass display panel with a simple dial (no numbers), a cream glass globe with a honey band on top, and a black hose looping down to a nozzle hung on its side', tilt:TILT, shapes:[
      face('dark', 'light', pl.top), face('dark', 'dark', pl.right), face('dark', 'base', pl.front),   // talapzat
      pth('red', 'dark', body.all.slice(1)), face('red', 'base', body.front),              // test
      det('cream', 'base', [F(-X, .52), F(X, .52), F(X, .66), F(-X, .66)]),                // krém csík
      det('cream', 'base', rrect(-.18, .86, .18, 1.34, .05, ([u, v]) => F(u, v), 2), { line:true }),          // mutató-panel
      det('glass', 'base', rrect(-.14, 1.04, .14, 1.28, .04, ([u, v]) => F(u, v), 2), { line:true }),
      ln('dark', 'base', [F(0, 1.07), F(.07, 1.22)], .018 * k), det('dark', 'base', circ(...F(0, 1.07), .025 * k, 6)),   // mutató
      det('dark', 'base', rrect(-.12, .9, .12, .98, .015, ([u, v]) => F(u, v), 1)),                          // számlálósáv (üres)
      face('red', 'dark', box(P, -.06, .06, 1.5, 1.56, -.06, .06).sil),                   // gömb nyaka
      face('cream', 'base', globe), det('honey', 'base', clip(globe, [[0, g[1] - gr * .25], [200, g[1] - gr * .25], [200, g[1] + gr * .25], [0, g[1] + gr * .25]]), { line:true }),
      det('cream', 'light', circ(g[0] - gr * .35, g[1] - gr * .45, gr * .32, 8)),
      face('dark', 'base', band(hose, .04 * k)),                                          // tömlő
      face('steel', 'base', [P([X + .01, .66, .17]), P([X + .1, .68, .17]), P([X + .09, .9, .17]), P([X + .015, .93, .17])]),   // pisztoly
      ln('steel', 'line', [P([X + .03, .92, .17]), P([X - .01, 1.0, .17])], .025 * k),
      shine([F(-.21, .2), F(-.15, .2), F(-.15, 1.42), F(-.21, 1.38)], .5),
    ] });
  }

  // ============================================================================================
  //  12. Kiszáradt fa – levél nélküli, szürke, repedezett törzsű fa: szétálló ágak, letört ágcsonk világos
  //      törésfelülettel, odú, a tövénél a letört ágdarab egy kis földkupacon. (~5 m; 2D)
  // ============================================================================================
  {
    const BR = [   // [pontok, vastagság a tőnél, a végén, kerek vég?]
      [[[50, 91], [49, 74], [50, 58], [51, 44]], 14, 8],
      [[[50, 86], [41, 91]], 7, 2.5], [[[51, 86], [61, 91]], 7, 2.5],
      [[[50, 53], [40, 41], [30, 31], [22, 20]], 6.5, 1.8], [[[34, 35], [26, 37], [20, 35]], 2.6, 1.2],
      [[[51, 47], [62, 35], [70, 25], [76, 13]], 6, 1.6], [[[64, 33], [72, 33], [80, 29]], 2.6, 1.2],
      [[[51, 45], [52, 31], [49, 19], [50, 10]], 5, 1.4],
      [[[50, 65], [41, 62.5], [35, 60.5]], 5.6, 4.6, false],
    ];
    const outer = BR.map(([p, a, b, cap = true]) => simplify(taper(smooth(p, 2), a, b, cap), .2)), inner = BR.map(([p, a, b, cap = true]) => simplify(taper(smooth(p, 2), a - 1.8, max(.3, b - 1.8), cap), .2));
    fin('halott_fa', { hu:'kiszáradt fa', en:'dead leafless tree', look:'dead leafless grey tree with a cracked trunk, bare spreading branches, a broken-off branch stub showing pale wood, a knot hole, and the fallen branch piece lying on a small soil mound', tilt:0, shapes:[
      face('soil', 'base', circ(50, 91, 24, 16, 4)),                                      // földkupac
      pth('steel', 'dark', outer), dpth('steel', 'dark', inner),                          // törzs és ágak (a belső kitöltés eltakarja az ágtövek kontúrját)
      det('steel', 'base', taper(smooth([[46, 88], [45, 74], [46, 58], [48, 46]], 3), 3.2, 2)),   // fényoldal
      det('steel', 'line', taper(smooth([[54.5, 88], [53, 74], [54, 58], [53.5, 47]], 3), 2.4, 1.4), { o:.45 }),   // árnyékoldal
      ln('steel', 'line', [[49, 86], [51, 80], [48, 74], [50.5, 68]], 1.1), ln('steel', 'line', [[52, 60], [50.5, 55], [52, 50]], 1),   // repedések
      det('dark', 'base', circ(51, 71.5, 2, 10, 3), { line:true }),                        // odú
      det('wood', 'light', [[36, 57.6], [33.5, 58.8], [35.2, 60.2], [33, 61.8], [35.6, 63.2]], { line:true }),   // törésfelület
      face('steel', 'dark', taper([[18, 90], [34, 88.5]], 4.6, 4, false)), det('wood', 'light', circ(34, 88.5, 1.8, 8, 2.2), { line:true }),   // letört ágdarab
      shine([[45, 60], [46.5, 60], [46, 72], [44.6, 72]], .5),
    ] });
  }

  // ============================================================================================
  //  13. Gyárkémény – magas, felfelé keskenyedő téglakémény sötét, kormos koronával és téglasorokkal, mellette kis
  //      fűrészfogas tetejű gyárcsarnok, a kéményből szürke füstpamacsok szállnak jobbra fel. (~30 m, a matricán tömörítve)
  // ============================================================================================
  {
    const TILT = 3;
    const prof = [[2.1, 0], [2.1, 1.4], [1.75, 1.7], [1.4, 12.2], [1.75, 12.5], [1.75, 13.1], [1.5, 13.3]];
    const sm = [[1.2, 14.8, 1.2], [2.6, 16, 1.5], [5, 16.6, 1.8], [7.5, 16.2, 1.5]];
    const P = cam({ az:25, el:10, F:80, tilt:TILT, fit:[...corners(-6.4, 2.1, 0, 13.4, -2.1, 2.1), ...sm.flatMap(([x, y, r]) => [[x - r, y - r, 0], [x + r, y + r, 0]])] });
    const k = P.k, L = lathe(P, prof);
    const shed = extrude(P, [[-6.4, 0], [-2.3, 0], [-2.3, 3.25], [-4.35, 4.4], [-4.35, 3.25], [-6.4, 4.4]], -1.4, 1.4);
    const S = puffs(sm.map(([x, y, r]) => { const c = P([x, y, 0]); return [c[0], c[1], r * k]; }));
    fin('gyarkemeny', { hu:'gyárkémény', en:'factory chimney with smoke', look:'tall tapering red brick factory chimney with a dark sooty crown and brick courses, a small saw-tooth roofed factory hall at its foot, and grey smoke puffs drifting up and to the right', tilt:TILT, shapes:[
      face('steel', 'base', S.sil), dpth('steel', 'light', S.hi),                          // füst
      pth('dark', 'light', shed.tone('light')), pth('cream', 'dark', [...shed.tone('base'), ...shed.tone('dark'), ...shed.tone('line')]), face('cream', 'base', shed.front),   // csarnok
      dpth('glass', 'base', [-6, -5.1, -4.2, -3.3].map(u => rrect(u, 1.4, u + .6, 2.5, .08, ([a, b]) => P([a, b, 1.4]), 1))),   // ablakok
      face('red', 'base', L.sil),                                                         // kémény
      det('red', 'light', L.strip(-80, -35)), det('red', 'dark', L.strip(35, 89)),
      dpth('red', 'dark', [3, 5, 7, 9, 11].map(y => L.strip(-88, 88, y, y + .3))),        // téglasorok
      det('dark', 'base', L.strip(-89, 89, 12.2, 13.3), { line:true }),                    // kormos korona
      det('dark', 'line', L.full(1.4, 13.3, 16)),                                        // a kémény szája
      shine(L.strip(-62, -52, 2, 11.5), .5),
    ] });
  }

  // ============================================================================================
  //  14. Láncfűrész – narancs motortest, fekete hátsó fogantyú és elülső kengyelfogantyú kézvédővel, acélszürke
  //      önindító-fedél szellőzőrésekkel, hosszú acél vezetőlemez körbefutó fekete lánccal és fogakkal. (~80 cm)
  // ============================================================================================
  {
    const TILT = -12, Z = .1;
    const P = cam({ az:22, el:18, F:3, tilt:TILT, fit:corners(-.4, .62, 0, .36, -Z - .03, Z + .03) });
    const k = P.k, F = (u, v, z = Z) => P([u, v, z]);
    const body = extrude(P, [[-.3, .02], [.04, .02], [.09, .07], [.08, .2], [.0, .245], [-.22, .245], [-.3, .19]], -Z, Z);
    const bar = (dd = 0) => rrect(.02 - dd, .07 - dd, .6 + dd, .15 + dd, .04 + dd, ([u, v]) => P([u, v, .01]), 3);
    const teeth = Array.from({ length:8 }, (_, i) => { const u = .1 + i * .062; return [P([u, .163, .01]), P([u + .03, .163, .01]), P([u + .006, .186, .01])]; });
    const wrap = Array.from({ length:9 }, (_, i) => { const a = 180 * i / 8; return P([.03, .245 + .11 * sin(a), .13 * cos(a)]); });
    fin('lancfuresz', { hu:'láncfűrész', en:'chainsaw', look:'orange chainsaw in three-quarter side view: black rear handle and wrap-around front handle with a hand guard, a grey starter cover with vents, and a long steel guide bar with a black cutting chain and teeth', tilt:TILT, shapes:[
      pth('dark', 'base', [bar(.016), ...teeth]),                                         // lánc
      det('steel', 'base', bar(), { line:true }), det('steel', 'dark', circ(...P([.55, .11, .01]), .022 * k, 8)),   // vezetőlemez
      face('dark', 'base', band(smooth([F(-.29, .2, 0), F(-.29, .34, 0), F(-.12, .345, 0), F(-.04, .245, 0)], 3), .035 * k)),   // hátsó fogantyú
      pth('orange', 'dark', [...body.tone('base'), ...body.tone('dark'), ...body.tone('line')]), pth('orange', 'light', body.tone('light')),   // motortest
      face('orange', 'base', body.front),
      det('steel', 'base', rrect(-.25, .05, -.08, .2, .04, ([u, v]) => F(u, v), 2), { line:true }),   // önindító-fedél
      dpth('steel', 'dark', [.09, .12, .15].map(v => rrect(-.22, v, -.11, v + .013, .006, ([u, w]) => F(u, w), 1))),
      det('dark', 'base', rrect(-.33, .12, -.29, .17, .01, ([u, v]) => F(u, v), 1), { line:true }),   // indítófogantyú
      face('dark', 'base', band(wrap, .03 * k)),                                          // elülső kengyelfogantyú
      face('dark', 'dark', [P([.085, .2, -.11]), P([.085, .2, .11]), P([.11, .37, .11]), P([.11, .37, -.11])]),   // kézvédő
      shine([F(-.2, .235), F(-.05, .235), F(-.06, .222), F(-.2, .222)], .7),
    ] });
  }

  // ============================================================================================
  //  15. Ipari varrógép – faasztal fém lábakkal és alatta motorral, rajta zsályazöld C alakú géptest
  //      (kar, oszlop, fej), jobb oldalt acél lendkerék, tetején piros cérnaorsó, a tű alatt kék anyagdarab. (~1 m)
  // ============================================================================================
  {
    const TILT = -8, X = .6, Z = .32, TY = .76;
    const P = cam({ az:30, el:16, F:6, tilt:TILT, fit:corners(-X, X, 0, 1.14, -Z, Z) });
    const k = P.k, top = box(P, -X, X, TY - .04, TY, -Z, Z), G = (x, z) => P([x, TY + .022, z]);
    const legs = [[-X + .04, Z - .04], [X - .04, Z - .04], [X - .04, -Z + .04]].map(([x, z]) => box(P, x - .025, x + .025, 0, TY - .04, z - .025, z + .025).sil);
    const head = extrude(P, [[-.34, .88], [-.2, .88], [-.2, .97], [.14, .97], [.14, .78], [.3, .78], [.3, 1.03], [.26, 1.09], [-.3, 1.09], [-.34, 1.05]], -.075, .075);
    const hw = acyl(P, [.3, .96, 0], [1, 0, 0], .09, .04, 16), sp = acyl(P, [.05, 1.09, -.02], [0, 1, 0], .03, .05, 12);
    fin('varrogep', { hu:'ipari varrógép', en:'industrial sewing machine', look:'industrial sewing machine on a wooden work table with dark metal legs and a motor underneath: sage-green C-shaped machine arm and head, a steel handwheel on the right, a red thread spool on top with thread running to the needle, and a piece of blue fabric under the needle', tilt:TILT, shapes:[
      pth('dark', 'dark', [legs[2]]), face('dark', 'base', box(P, .1, .4, .5, TY - .04, -.12, .12).sil),   // hátsó láb, motor
      pth('dark', 'base', legs.slice(0, 2)),                                              // első lábak
      face('wood', 'light', top.top), face('wood', 'dark', top.right), face('wood', 'base', top.front),   // asztallap
      face('sage', 'light', box(P, -.42, .36, TY, TY + .02, -.17, .17).sil),              // alaplemez
      face('blue', 'base', [G(-.54, -.02), G(-.08, -.08), G(-.02, .3), P([-.04, .66, Z + .006]), P([-.44, .62, Z + .006]), P([-.5, TY + .02, Z + .006])]),   // anyag
      det('blue', 'dark', [P([-.04, TY, Z + .007]), P([-.04, .66, Z + .007]), P([-.44, .62, Z + .007]), P([-.48, TY, Z + .007])]),
      pth('sage', 'dark', head.all.slice(1)), face('sage', 'base', head.front),            // géptest
      ln('steel', 'dark', [P([-.28, .88, .03]), P([-.28, .8, .03])], .014 * k), det('steel', 'dark', [P([-.31, .78, .06]), P([-.24, .78, .06]), P([-.25, .8, .06]), P([-.3, .8, .06])], { line:true }),   // tű, talp
      face('steel', 'dark', hw.sil), det('steel', 'light', hw.top, { line:true }), det('dark', 'base', hw.ring(.04, .025)),   // lendkerék
      face('red', 'base', sp.sil), det('red', 'light', sp.top),                            // cérnaorsó
      ln('red', 'base', [P([.05, 1.12, -.02]), P([-.1, 1.13, .06]), P([-.28, 1.09, .06]), P([-.28, .9, .06])], .006 * k),   // cérna
      shine([P([-.28, 1.08, .075]), P([.1, 1.08, .075]), P([.1, 1.06, .075]), P([-.28, 1.06, .075])], .7),
    ] });
  }

  // ============================================================================================
  //  16. Tüntetőtábla – kézben tartható, üres (felirat nélküli) krém tábla fanyélen, közepén kis zöld levél-jellel,
  //      a nyelet két kapocs fogja. (~1,5 m)
  // ============================================================================================
  {
    const TILT = -8, W = .42, T = .03;
    const P = cam({ az:24, el:8, F:6, tilt:TILT, fit:corners(-W, W, 0, 1.5, -.08, T) });
    const k = P.k, b = box(P, -W, W, .88, 1.5, -T, T), st = box(P, -.028, .028, 0, 1.25, -.085, -T), F = (u, v) => P([u, v, T]);
    const c = F(0, 1.19);
    fin('tabla_tuntetes', { hu:'tüntetőtábla', en:'blank protest placard', look:'hand-held blank cream placard with no text on a wooden stick, a small green leaf symbol in the middle and two staples', tilt:TILT, shapes:[
      face('wood', 'base', st.front), face('wood', 'dark', st.right),                     // nyél
      face('cardboard', 'dark', b.right), face('cardboard', 'light', b.top),               // a tábla vastagsága
      face('cream', 'base', b.front),                                                     // tábla
      det('cream', 'dark', [F(W - .1, .88), F(W, .88), F(W, 1.5), F(W - .03, 1.5)], { o:.8 }),
      det('leaf', 'base', leafPts(c[0] - .1 * k, c[1] + .07 * k, -40, .24 * k, .13 * k), { line:true }),   // levél-jel
      ln('leaf', 'dark', [[c[0] - .08 * k, c[1] + .055 * k], [c[0] + .06 * k, c[1] - .06 * k]], .012 * k),
      dpth('steel', 'dark', [.95, 1.02].map(v => [F(-.02, v), F(.02, v), F(.02, v + .012), F(-.02, v + .012)])),   // kapcsok
      shine([F(-W + .04, 1.46), F(-W + .2, 1.46), F(-W + .04, 1.3)], .7),
    ] });
  }

})();
