// ============================================================
//  3D-ELLENŐRZÉS (böngésző nélkül): node tests/check-3d.js
//
//  1. Betölti a modell-készletet (web/js/art/model-kit.js) és minden modell-fájlt (web/js/3d/*-modellek.js, web/js/vilag/vilag-modellek.js).
//  2. A katalógus (web/js/3d/katalogus.js) minden tételét és változatát megépíti az alap méretekkel:
//     • háromszög modellenként 50–2000 (hiba), a B szint célja 300–1200 (csak figyelmeztetés – docs/rajzolas.md 2.)
//     • részenként legalább 1 háromszög, nincs NaN / végtelen csúcs, nincs elfajult (nulla területű) háromszögekből álló modell
//     • a galériában mutatott, másolható hívás (call) pontosan ugyanazt építi, mint a katalógus
//     • az anyagok (színek) száma: B szinten 4–6 a cél (figyelmeztetés 8 fölött)
//  3. A vilag modul fájljai szintaktikailag rendben vannak (node --check), és ≤ 200 sorosak.
// ============================================================
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const WEB = path.join(__dirname, '..', 'web'), J = p => path.join(WEB, 'js', p);
const errors = [], warns = [];

globalThis.DS = require(J('ds.js'));
globalThis.ART = require(J('art/art.js'));
globalThis.MODEL = require(J('art/model-kit.js'));
globalThis.SZ_MODELS = require(J('3d/szelektalj-modellek.js'));
globalThis.HUTO_MODELS = require(J('3d/huto-modellek.js'));
globalThis.RZ_MODELS = require(J('3d/rezsi-modellek.js'));
const ot = require(J('3d/otthon-modellek.js')); globalThis.OT = ot.OT; globalThis.OT_MODELS = ot.OT_MODELS;
globalThis.VILAG_MODELS = require(J('vilag/vilag-modellek.js'));
const CAT = require(J('3d/katalogus.js'));

// a hívás-szöveg kiértékelése ugyanazokkal a nevekkel, mint a böngészőben
const NAMES = ['MODEL', 'SZ_MODELS', 'HUTO_MODELS', 'RZ_MODELS', 'OT_MODELS', 'OT', 'VILAG_MODELS'];
const evalCall = call => new Function(...NAMES, 'return ' + call)(...NAMES.map(n => globalThis[n]));
const sig = r => CAT.parts(r).map(([n, m]) => n + ':' + m.stats().tris + '/' + m.stats().materials).join(',');

const rows = [];
let models = 0, inB = 0;
for(const it of CAT.LIST){
  if(!CAT.GROUPS.includes(it.group)) errors.push(`${it.id}: ismeretlen csoport „${it.group}”`);
  for(const va of it.variants){
    const tag = `${it.name} – ${va.label}`;
    let res;
    try{ res = va.build(); }catch(e){ errors.push(`${tag}: nem épül meg (${e.message})`); continue; }
    const parts = CAT.parts(res);
    if(!parts.length){ errors.push(`${tag}: nem ad vissza modellt`); continue; }
    let tris = 0; const colors = new Set();
    for(const [pn, m] of parts){
      const st = m.stats(); tris += st.tris;
      if(!st.tris) errors.push(`${tag} / ${pn}: üres rész`);
      let bad = 0, flat = 0;
      for(const [c, list] of m.groups()){ colors.add(c);
        try{ MODEL.hexOf(c); }catch(e){ errors.push(`${tag}: ismeretlen szín „${c}”`); }
        for(const t of list){
          if(t.some(p => p.some(x => !Number.isFinite(x)))) bad++;
          const a = [t[1][0]-t[0][0], t[1][1]-t[0][1], t[1][2]-t[0][2]], b = [t[2][0]-t[0][0], t[2][1]-t[0][1], t[2][2]-t[0][2]];
          if(Math.hypot(a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]) < 1e-12) flat++;
        } }
      if(bad) errors.push(`${tag} / ${pn}: ${bad} háromszögben NaN vagy végtelen csúcs`);
      if(flat > st.tris * 0.1) warns.push(`${tag} / ${pn}: ${flat} elfajult (nulla területű) háromszög`);
    }
    models++;
    if(tris < 50 || tris > 2000) errors.push(`${tag}: ${tris} háromszög – a keret 50–2000`);
    else if(tris < 300 || tris > 1200) warns.push(`${tag}: ${tris} háromszög (B cél: 300–1200)`); else inB++;
    if(colors.size > 8) warns.push(`${tag}: ${colors.size} szín (B cél: 4–6)`);
    try{ const again = evalCall(va.call); if(sig(again) !== sig(res)) errors.push(`${tag}: a másolható hívás (${va.call}) mást épít, mint a katalógus`); }
    catch(e){ errors.push(`${tag}: a másolható hívás hibás: ${va.call} (${e.message})`); }
    rows.push(`${it.group.padEnd(24)} ${tag.padEnd(44)} ${String(tris).padStart(5)} △  ${colors.size} szín${parts.length > 1 ? '  részek: ' + parts.map(p => p[0]).join(', ') : ''}`);
  }
}

// a vilag modul: szintaxis + fájlméret (≤ 200 sor – CLAUDE.md 5.)
for(const f of ['vilag/vilag.js', 'vilag/vilag-fold.js', 'vilag/vilag-modellek.js', '3d/katalogus.js']){
  try{ execFileSync(process.execPath, ['--check', J(f)], { stdio:'pipe' }); }catch(e){ errors.push(`${f}: szintaktikai hiba\n${e.stderr}`); }
  const n = fs.readFileSync(J(f), 'utf8').split('\n').length; if(n > 200) warns.push(`${f}: ${n} sor – bontsd fel (≤ 200)`);
}
// a vilag csak palettát használ: nyers hex szín (0x…, '#…') nem lehet benne
for(const f of ['vilag/vilag.js', 'vilag/vilag-fold.js', 'vilag/vilag-modellek.js']){
  const s = fs.readFileSync(J(f), 'utf8').replace(/\/\/.*$/gm, '');
  const raw = (s.match(/0x[0-9a-f]{6}\b|'#[0-9a-f]{3,6}'/gi) || []).filter(h => h.toLowerCase() !== '0xffffff');   // 0xffffff = „nincs színezés” (textúra / példányszín)
  if(raw.length) errors.push(`${f}: nyers szín a paletta helyett: ${[...new Set(raw)].join(', ')}`);
}

console.log(rows.join('\n'));
console.log(`\n${models} modell-változat · ebből ${inB} a B-sávban (300–1200 △) · ${CAT.LIST.length} katalógus-tétel`);
warns.forEach(w => console.log('⚠️  ' + w));
if(errors.length){ errors.forEach(e => console.log('❌ ' + e)); process.exit(1); }
console.log('✓ minden rendben');
