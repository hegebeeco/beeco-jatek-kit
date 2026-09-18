// ============================================================
//  beeco MATRICA-KÉSZLET — illusztrációk kódból, egy közös stílusban (design system: „Méhsejt-diorama")
//
//  Miért kód? A tartalomban ~180 emoji és ~90 egyszerű kódrajz volt; az emoji minden telefonon másképp néz ki
//  és nem beeco-stílusú. Itt minden illusztráció UGYANAZOKBÓL az elemekből épül: 100×100-as rács, közös
//  anyag-paletta (MAT), lapokra tört árnyalás (világos és sötét háromszög-lap), vékony sötét kontúr,
//  vastag fehér kivágott perem és puha olívazöld árnyék – mint a beeco meglévő matricáin.
//  Szabálykönyv: docs/grafika-spec.md · bemutató: arculat.html „Illusztrációk" · ellenőrzés: tests/check-art.js
//
//  Egy matrica: ART.add('jegkocka', { emoji:['🧊'], hu:'jégkocka', en:'ice cube', shapes:[ … ] })
//  Matrica-szintű: scale (pl. .92 – kicsinyítés, ha a perem kilógna) · tilt (fok – megdöntés) · shadow ('soft' | 'hard')
//  Rajz-segédek: ART.geo (band, leaf, star, arc, camera = 3D-vetítés) · árnyék-stílus mindenhol: ART.style.shadow
//  Alakzatok (t): rect · circle · ellipse · poly · path  — anyag (m), lap-mód (fc: d | v | h | none), forgatás (rot),
//                 dísz (d:true = nem kap peremet), egy tónus (tone: light | base | dark | line), átlátszóság (o)
//               line (vonal: pts, w) · shine (fénycsík: x,y,w,h vagy cx,cy,rx,ry)
//  Használat: artIcon('🧊') → <img> (ha van matrica), különben az emoji marad · ART.image(név) → <img> vászonhoz/3D-hez
//             ART.draw(ctx, '🧊', x, y, méret, betöltéskor) → vászonra rajzol (false, ha nincs matrica vagy még töltődik)
//  Csere szebb képre: web/data/art-override.json-ba írt név → assets/art/<név>.webp (MI vagy illusztrátor)
// ============================================================
(function(root){
  // ---- Anyagok: [világos, alap, sötét, kontúr] – a beeco palettájára hangolt tartalom-színek ----
  const MAT = {
    honey:['#FFE9A3','#FECF39','#E0A91C','#7A5A06'],   leaf:['#A9C47E','#6E8947','#4F6A32','#2F371E'],
    grass:['#C9DE9F','#9DB577','#7C9559','#3F5226'],   sage:['#EEF3E1','#D3DDBB','#B3C096','#5F6E45'],
    sky:['#DDF2FF','#B1DEFF','#82BCE8','#2F5E86'],     water:['#C4E8FB','#72C3EF','#3F96CA','#1F5577'],
    blossom:['#FBDCE5','#F5B4C7','#E08AA6','#8A3B55'], berry:['#B85A70','#7A2E3F','#561E2B','#2E0F17'],
    red:['#F59A8F','#E0503F','#B7392B','#6E1E15'],     orange:['#FFBE8C','#F28A3C','#D2651E','#7A360B'],
    ember:['#F99A5E','#EA580C','#B8430A','#6A2605'],   purple:['#D2C1EA','#9C7CC9','#7457A3','#3C2A5C'],
    blue:['#9CBBEA','#4F7FC7','#355E9E','#1C3558'],    paper:['#FFFFFF','#FFFDF6','#E9E2CF','#8C8468'],
    cream:['#FFFCF2','#FFF1CF','#EAD9AE','#8C7A52'],   steel:['#EEF2F3','#C7CFD2','#98A3A8','#4A5358'],
    dark:['#5E6858','#3B4436','#262C22','#141810'],    wood:['#DDAE78','#B4854A','#8C6636','#4E3719'],
    cardboard:['#E8C895','#C99B5E','#A67A40','#5C4020'], soil:['#AE8260','#7E5634','#5C3D22','#301E0E'],
    skin:['#FFE0CA','#F2BE9C','#D89A74','#7A4C33'],    white:['#FFFFFF','#F3F6F4','#D6DDD8','#7D877F'],
    glass:['#F0FAFF','#CFEAF7','#A3CFE6','#4F7F99'],   pink:['#FFD3E6','#F7A1C4','#DF6F9C','#7E2D4E'],
    teal:['#A8E3DA','#4FB8AA','#2F8B80','#154A44'],    gold:['#FFE9A0','#F5C542','#C99A1D','#6B4F07'],
    chocolate:['#9A6A4F','#6B4331','#4A2C1F','#26150E'], tomato:['#FF9E8A','#EE5A44','#C23F2C','#6B1C12'],
  };
  const OUTLINE = '#FFFFFF', SHADOW = '#2F371E', EDGE = 8, SHADOW_Y = 3.5, LINE_W = 1.6;
  // árnyék-stílus: 'soft' (eddigi, halvány, lefelé) · 'hard' (a beeco eredeti MI-matricáin mért tömör olíva árnyék jobbra-le –
  // docs/promptolas.md 1. pont). Matricánként (shadow:'hard'), hívásonként (svg(név, { shadow:'hard' })) vagy mindenhol: ART.style.shadow
  const STYLE = { shadow:'hard' }, SHADOW_HARD = '#5A6337', HARD_DX = 2.7, HARD_DY = 2.3;   // 2026-09-17: tömör árnyék mindenhol (Kristóf)
  const LIB = {}, BY_EMOJI = {}, OVERRIDE = {};
  const f1 = n => Math.round(n * 10) / 10;

  // ---- geometria ----
  function geom(s, extra){
    const a = extra || '';
    switch(s.t){
      case 'rect': return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r || 0}"${a}/>`;
      case 'circle': return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"${a}/>`;
      case 'ellipse': return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"${a}/>`;
      case 'poly': return `<polygon points="${s.pts.map(p => p.join(',')).join(' ')}"${a}/>`;
      case 'path': return `<path d="${s.p}"${a}/>`;
    }
    return '';
  }
  function bbox(s){
    switch(s.t){
      case 'rect': return [s.x, s.y, s.w, s.h];
      case 'circle': return [s.cx - s.r, s.cy - s.r, 2 * s.r, 2 * s.r];
      case 'ellipse': return [s.cx - s.rx, s.cy - s.ry, 2 * s.rx, 2 * s.ry];
      case 'poly': { const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
      case 'path': { if(s.box) return s.box; const P = pathPoints(s.p), xs = P.map(q => q[0]), ys = P.map(q => q[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
      case 'shine': return s.cx != null ? [s.cx - s.rx, s.cy - s.ry, 2 * s.rx, 2 * s.ry] : [s.x, s.y, s.w, s.h];
      case 'line': { const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
    }
    return [0, 0, 100, 100];
  }
  // SVG-útvonal pontjai a görbéken mintavételezve (M L H V C S Q T A Z, kis- és nagybetűvel) – pontos befoglaló doboz
  function pathPoints(d){
    const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [], out = [];
    let i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0, cpx = 0, cpy = 0, prev = '';
    const N = () => Number(tok[i++]);
    const curve = (P) => { for(let k = 1; k <= 8; k++){ const t = k / 8; let Q = P;   // de Casteljau
      while(Q.length > 1) Q = Q.slice(1).map((q, j) => [Q[j][0] + (q[0] - Q[j][0]) * t, Q[j][1] + (q[1] - Q[j][1]) * t]);
      out.push(Q[0]); } };
    const arcTo = (rx, ry, phi, fa, fs, x2, y2) => {   // SVG-ív végpontos alakból középpontosba (SVG 1.1, F.6.5)
      rx = Math.abs(rx); ry = Math.abs(ry); if(!rx || !ry){ out.push([x2, y2]); return; }
      const p = phi * Math.PI / 180, c = Math.cos(p), sn = Math.sin(p), dx = (x - x2) / 2, dy = (y - y2) / 2;
      const xp = c * dx + sn * dy, yp = -sn * dx + c * dy, lam = xp * xp / (rx * rx) + yp * yp / (ry * ry);
      if(lam > 1){ rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      const den = rx * rx * yp * yp + ry * ry * xp * xp, k = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, (rx * rx * ry * ry - den) / (den || 1)));
      const cxp = k * rx * yp / ry, cyp = -k * ry * xp / rx, cx = c * cxp - sn * cyp + (x + x2) / 2, cy = sn * cxp + c * cyp + (y + y2) / 2;
      const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry); let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
      if(!fs && dt > 0) dt -= 2 * Math.PI; else if(fs && dt < 0) dt += 2 * Math.PI;
      for(let q = 1; q <= 12; q++){ const t = t1 + dt * q / 12, ex = rx * Math.cos(t), ey = ry * Math.sin(t); out.push([cx + ex * c - ey * sn, cy + ex * sn + ey * c]); }
    };
    while(i < tok.length){
      if(/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
      const C = cmd.toUpperCase(), ox = cmd !== C ? x : 0, oy = cmd !== C ? y : 0, pt = () => [ox + N(), oy + N()];
      switch(C){
        case 'M': [x, y] = pt(); sx = x; sy = y; out.push([x, y]); cmd = cmd === 'm' ? 'l' : 'L'; break;
        case 'L': [x, y] = pt(); out.push([x, y]); break;
        case 'H': x = ox + N(); out.push([x, y]); break;
        case 'V': y = oy + N(); out.push([x, y]); break;
        case 'C': { const a = pt(), b = pt(), e = pt(); curve([[x, y], a, b, e]); [cpx, cpy] = b; [x, y] = e; break; }
        case 'S': { const a = /[CS]/.test(prev) ? [2 * x - cpx, 2 * y - cpy] : [x, y], b = pt(), e = pt(); curve([[x, y], a, b, e]); [cpx, cpy] = b; [x, y] = e; break; }
        case 'Q': { const a = pt(), e = pt(); curve([[x, y], a, e]); [cpx, cpy] = a; [x, y] = e; break; }
        case 'T': { const a = /[QT]/.test(prev) ? [2 * x - cpx, 2 * y - cpy] : [x, y], e = pt(); curve([[x, y], a, e]); [cpx, cpy] = a; [x, y] = e; break; }
        case 'A': { const rx = N(), ry = N(), phi = N(), fa = N(), fs = N(), e = pt(); arcTo(rx, ry, phi, fa, fs, e[0], e[1]); [x, y] = e; break; }
        case 'Z': x = sx; y = sy; if(i < tok.length && !/[a-zA-Z]/.test(tok[i])) i++; break;   // hibás útvonalnál se ragadjon be
        default: i++;
      }
      prev = C;
    }
    return out.length ? out : [[0, 0], [100, 100]];
  }
  // az alakzat körvonal-pontjai a saját forgatásával együtt (ellenőrzéshez: pontos kilógás-mérés megdöntött matricán is)
  function points(s){
    let P;
    switch(s.t){
      case 'rect': P = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]]; break;
      case 'circle': case 'ellipse': { const rx = s.t === 'circle' ? s.r : s.rx, ry = s.t === 'circle' ? s.r : s.ry;
        P = Array.from({ length:24 }, (_, i) => [s.cx + rx * Math.cos(i * Math.PI / 12), s.cy + ry * Math.sin(i * Math.PI / 12)]); break; }
      case 'poly': case 'line': P = s.pts; break;
      case 'path': P = pathPoints(s.p); break;
      default: return [];
    }
    if(!s.rot) return P;
    const b = bbox(s), ox = s.ox != null ? s.ox : b[0] + b[2] / 2, oy = s.oy != null ? s.oy : b[1] + b[3] / 2, a = s.rot * Math.PI / 180;
    return P.map(([x, y]) => [ox + (x - ox) * Math.cos(a) - (y - oy) * Math.sin(a), oy + (x - ox) * Math.sin(a) + (y - oy) * Math.cos(a)]);
  }
  const rotWrap = (s, inner) => s.rot ? `<g transform="rotate(${s.rot} ${s.ox != null ? s.ox : (bbox(s)[0] + bbox(s)[2] / 2)} ${s.oy != null ? s.oy : (bbox(s)[1] + bbox(s)[3] / 2)})">${inner}</g>` : inner;
  const isDetail = s => s.d || s.t === 'line' || s.t === 'shine';

  // lapok: világos háromszög bal-fent, sötét jobb-lent (d) · függőleges csíkok hengernek (v) · vízszintes sávok lapos tárgynak (h)
  function facets(s, M){
    const [x, y, w, h] = bbox(s), L = M[0], D = M[2], X = x - 1, Y = y - 1, W = w + 2, H = h + 2;
    const poly = (pts, c) => `<polygon points="${pts.map(p => p.map(f1).join(',')).join(' ')}" fill="${c}"/>`;
    switch(s.fc || 'd'){
      case 'none': return '';
      case 'v': return poly([[X, Y], [X + W * .3, Y], [X + W * .22, Y + H], [X, Y + H]], L) + poly([[X + W * .74, Y], [X + W, Y], [X + W, Y + H], [X + W * .8, Y + H]], D);
      case 'h': return poly([[X, Y], [X + W, Y], [X + W, Y + H * .3], [X, Y + H * .38]], L) + poly([[X, Y + H * .76], [X + W, Y + H * .7], [X + W, Y + H], [X, Y + H]], D);
      default: return poly([[X, Y], [X + W * .62, Y], [X, Y + H * .58]], L) + poly([[X + W, Y + H * .38], [X + W, Y + H], [X + W * .42, Y + H]], D);
    }
  }

  function shapeSVG(s, k, uid){
    const M = MAT[s.m] || MAT.paper, o = s.o != null ? ` opacity="${s.o}"` : '';
    if(s.t === 'line'){
      const c = M[{ light:0, base:1, dark:2, line:3 }[s.tone || 'line']];
      return rotWrap(s, `<polyline points="${s.pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${s.w || 2}" stroke-linecap="round" stroke-linejoin="round"${o}/>`);
    }
    if(s.t === 'shine'){
      const g = s.cx != null ? `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"` : `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r != null ? s.r : Math.min(s.w, s.h) / 2}"`;
      return rotWrap(s, `${g} fill="#FFFFFF" opacity="${s.o != null ? s.o : .55}"/>`);
    }
    if(s.tone){ const c = M[{ light:0, base:1, dark:2, line:3 }[s.tone]];
      return rotWrap(s, geom(s, ` fill="${c}"${o}${s.line === false ? '' : ` stroke="${M[3]}" stroke-width="${LINE_W}" stroke-linejoin="round"`}`)); }
    const id = `${uid}c${k}`, [x, y, w, h] = bbox(s);
    const body = `<defs><clipPath id="${id}">${geom(s)}</clipPath></defs>`
      + `<g clip-path="url(#${id})"${o}><rect x="${f1(x - 1)}" y="${f1(y - 1)}" width="${f1(w + 2)}" height="${f1(h + 2)}" fill="${M[1]}"/>${facets(s, M)}</g>`
      + (s.line === false ? '' : geom(s, ` fill="none" stroke="${M[3]}" stroke-width="${LINE_W}" stroke-linejoin="round"`));
    return rotWrap(s, body);
  }

  let uidN = 0;
  function svg(name, opt = {}){
    const A = LIB[name]; if(!A) return '';
    const uid = 'a' + (uidN++).toString(36) + '_', size = opt.size || 100, k = A.scale || 1;
    const sil = A.shapes.filter(s => !isDetail(s)).map(s => rotWrap(s, geom(s))).join('');
    // tilt: az egész tárgy megdöntése a közepe körül (fok) – az árnyék eltolása közben a képernyőhöz képest marad jobbra-le
    const turn = inner => A.tilt ? `<g transform="rotate(${A.tilt} 50 50)">${inner}</g>` : inner;
    const hard = (opt.shadow || A.shadow || STYLE.shadow) === 'hard';
    const shadow = hard
      ? `<g transform="translate(${HARD_DX} ${HARD_DY})" fill="${SHADOW_HARD}" stroke="${SHADOW_HARD}" stroke-width="${EDGE}" stroke-linejoin="round">${turn(sil)}</g>`
      : `<g transform="translate(0 ${SHADOW_Y})" fill="${SHADOW}" stroke="${SHADOW}" stroke-width="${EDGE}" stroke-linejoin="round" opacity=".22">${turn(sil)}</g>`;
    const body = (opt.flat ? '' : shadow)
      + turn((opt.flat ? '' : `<g fill="${OUTLINE}" stroke="${OUTLINE}" stroke-width="${EDGE}" stroke-linejoin="round">${sil}</g>`)
      + A.shapes.map((s, j) => shapeSVG(s, j, uid)).join(''));
    // scale: a teljes matrica kicsinyítése a közepe körül (ha a rajz a perem miatt kilógna a vászonról)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">`
      + (k === 1 ? body : `<g transform="translate(50 50) scale(${k}) translate(-50 -50)">${body}</g>`) + '</svg>';
  }

  function add(name, meta){
    if(LIB[name]) throw new Error('art: dupla matrica-név: ' + name);
    LIB[name] = Object.assign({ name, emoji:[], shapes:[] }, meta);
    const cs = typeof document !== 'undefined' && document.currentScript;   // melyik könyvtárból jött (a galériához)
    if(cs && cs.src) LIB[name].lib = cs.src.replace(/^.*\/art-|\.js.*$/g, '');
    for(const e of LIB[name].emoji) BY_EMOJI[norm(e)] = name;
  }
  const norm = e => String(e || '').replace(/[︎️]/g, '');
  const find = key => LIB[key] ? key : BY_EMOJI[norm(key)] || null;
  const uri = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const cacheUri = {};
  function src(key){
    const n = find(key); if(!n) return null;
    if(OVERRIDE[n]) return OVERRIDE[n];
    return cacheUri[n] || (cacheUri[n] = uri(svg(n, { size:256 })));
  }
  const imgCache = {};
  function image(key){ const n = find(key); if(!n) return null;
    if(!imgCache[n] && typeof Image !== 'undefined'){ const im = new Image(); im.decoding = 'async'; im.src = src(n); imgCache[n] = im; }
    return imgCache[n] || null; }

  // vászonra rajzolás középre igazítva; ha a kép még töltődik: false, és betöltéskor hívja az onReady-t (pl. textúra frissítése)
  function draw(ctx, key, cx, cy, size, onReady){
    const im = image(key); if(!im) return false;
    if(im.complete && im.naturalWidth){ ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size); return true; }
    if(onReady) im.addEventListener('load', onReady, { once:true });
    return false;
  }

  // ---- rajz-segédek a matrica-fájloknak (ART.geo) – hogy ne kelljen fájlonként újraírni ----
  const r1 = n => Math.round(n * 10) / 10, R = pts => pts.map(([x, y]) => [r1(x), r1(y)]), rad = d => d * Math.PI / 180;
  // körív pontjai (fok: 0 = jobbra, 90 = lefelé)
  const arc = (cx, cy, r, a0, a1, n = 16) => Array.from({ length:n + 1 }, (_, i) => { const a = rad(a0 + (a1 - a0) * i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  // vastag „ecsetvonás” kitöltött sokszögként (a line dísz, nem kap fehér peremet – ez igen); w: szélesség vagy függvény (0…1 mentén); cap: kerek vég
  function band(pts, w, cap = true){
    const n = pts.length, L = [], Rt = [], Nv = [], hw = i => (typeof w === 'function' ? w(i / (n - 1)) : w) / 2;
    const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    for(let i = 0; i < n; i++){
      let v, k = 1;
      if(i === 0) v = nrm(pts[0], pts[1]); else if(i === n - 1) v = nrm(pts[n - 2], pts[n - 1]);
      else { const a = nrm(pts[i - 1], pts[i]), b = nrm(pts[i], pts[i + 1]); v = [a[0] + b[0], a[1] + b[1]];
        const l = Math.hypot(v[0], v[1]) || 1; v = [v[0] / l, v[1] / l]; k = 1 / Math.max(.4, v[0] * a[0] + v[1] * a[1]); }
      Nv.push(v); L.push([pts[i][0] + v[0] * hw(i) * k, pts[i][1] + v[1] * hw(i) * k]); Rt.push([pts[i][0] - v[0] * hw(i) * k, pts[i][1] - v[1] * hw(i) * k]);
    }
    const capAt = (i, from) => { if(!cap) return []; const a = Math.atan2(Nv[i][1], Nv[i][0]) * 180 / Math.PI; return arc(pts[i][0], pts[i][1], hw(i), a + from, a + from - 180, 10).slice(1, -1); };
    return R([...L, ...capAt(n - 1, 0), ...Rt.reverse(), ...capAt(0, 180)]);
  }
  // levél-forma (két görbe): tő (x,y), irány (fok), hossz, szélesség → útvonal
  function leaf(x, y, deg, len, wid){
    const dx = Math.cos(rad(deg)), dy = Math.sin(rad(deg)), h = wid / 1.5, P = (t, o) => `${r1(x + dx * len * t - dy * o)} ${r1(y + dy * len * t + dx * o)}`;
    return `M${P(0, 0)} C${P(.2, h)} ${P(.7, h)} ${P(1, 0)} C${P(.7, -h)} ${P(.2, -h)} ${P(0, 0)} Z`;
  }
  // csillag-sokszög: n ág, váltakozó külső/belső sugár
  const star = (cx, cy, Ro, Ri, n = 5) => R(Array.from({ length:n * 2 }, (_, i) => { const a = Math.PI * i / n - Math.PI / 2, q = i % 2 ? Ri : Ro; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  // 3D-vetítés a 100×100-as rácsra – a B szintű matricák így kapnak pontos 3/4-es nézetet valódi méretekből (docs/rajzolas.md)
  // camera({ az, el, F, tilt, fit, span }) → P([x, y, z]) = [x, y]
  //   az: jobbra forgatás (fok) · el: felülnézet (fok) · F: kamera-távolság (kisebb = erősebb perspektíva; üres = párhuzamos vetítés)
  //   tilt: a matrica megdöntése (ugyanaz, mint az ART.add tilt-je) · fit: a tárgy jellemző pontjai (pl. a doboz sarkai)
  //   span: a megdöntött tárgy befoglalójának mérete a rácson (alap 80) – a tárgy középre kerül
  function camera(o){
    const a = rad(o.az || 0), e = rad(o.el || 0), F = o.F || 1e9, fit = o.fit, span = o.span || 80, t = rad(o.tilt || 0);
    const mid = [0, 1, 2].map(i => (Math.min(...fit.map(p => p[i])) + Math.max(...fit.map(p => p[i]))) / 2);
    const C = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)], RT = [Math.cos(a), 0, -Math.sin(a)];
    const UP = [-Math.sin(a) * Math.sin(e), Math.cos(e), -Math.cos(a) * Math.sin(e)], dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const raw = p => { const q = [p[0] - mid[0], p[1] - mid[1], p[2] - mid[2]], f = F / (F - dot(q, C)); return [dot(q, RT) * f, -dot(q, UP) * f]; };
    const rot = ([x, y]) => [Math.cos(t) * x - Math.sin(t) * y, Math.sin(t) * x + Math.cos(t) * y], unrot = ([x, y]) => [Math.cos(t) * x + Math.sin(t) * y, -Math.sin(t) * x + Math.cos(t) * y];
    const U = fit.map(p => rot(raw(p))), xs = U.map(u => u[0]), ys = U.map(u => u[1]);
    const k = span / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const T = unrot([-k * (Math.max(...xs) + Math.min(...xs)) / 2, -k * (Math.max(...ys) + Math.min(...ys)) / 2]);
    const P = p => { const r = raw(p); return [r1(50 + T[0] + k * r[0]), r1(50 + T[1] + k * r[1])]; };
    P.k = k; return P;
  }
  const geo = { r1, R, rad, arc, band, leaf, star, camera };

  const ART = { MAT, LIB, BY_EMOJI, add, svg, find, src, image, draw, bbox, points, geo, style:STYLE, has:k => !!find(k), names:() => Object.keys(LIB),
    override:(map) => Object.assign(OVERRIDE, map) };
  if(typeof module !== 'undefined' && module.exports){ module.exports = ART; return; }
  root.ART = ART;
  // HTML-segéd: matrica, ha van; különben az eredeti (emoji) szöveg marad
  const escA = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  root.artIcon = (key, alt, cls) => { const s = src(key);
    return s ? `<img class="art${cls ? ' ' + cls : ''}" src="${s}" alt="${escA(alt || '')}" draggable="false">` : escA(key); };
  // a szebb (MI / illusztrátor) képek listája: web/data/art-override.json → { "nev": "assets/art/nev.webp" } (más mappából: window.ART_DATA)
  if(typeof fetch === 'function') fetch((root.ART_DATA || 'data/') + 'art-override.json', { cache:'no-cache' }).then(r => r.ok ? r.json() : {}).then(m => {
    const base = (root.ART_DATA || 'data/').replace(/data\/$/, '');   // a képek útja a web/ mappához képest
    for(const k in m) if(k[0] !== '_') OVERRIDE[k] = base + m[k];
    for(const k in cacheUri) delete cacheUri[k]; for(const k in imgCache) delete imgCache[k];
  }).catch(() => {});
})(typeof window !== 'undefined' ? window : globalThis);
