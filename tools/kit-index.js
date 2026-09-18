// ============================================================
//  KIT-INDEX — a Kalauz (web/kit.html) tartalomjegyzéke: mi van a kitben, számokkal
//  node tools/kit-index.js   → web/kit-tartalom.json (a kalauz ebből épít kereshető listát)
//  Összegyűjti: matricák (név, magyar név, könyvtár), piktogramok, tokenek, 3D modell-builderek, mechanika-modulok,
//  keret-modulok, eszközök (a fájl első leíró sora), szabálykönyvek (az első címsor), skillek, a kit verziója.
// ============================================================
const fs = require('fs'), path = require('path');
const KIT = path.join(__dirname, '..'), WEB = path.join(KIT, 'web');
const rd = p => fs.readFileSync(path.join(KIT, p), 'utf8');
const exists = p => fs.existsSync(path.join(KIT, p));
const ls = (d, re) => exists(d) ? fs.readdirSync(path.join(KIT, d)).filter(f => re.test(f)).sort() : [];
// egy fájl leírása: a fejléc-komment első tartalmas sora (a „// ====” keret után)
function leiras(p){
  const lines = rd(p).split('\n').slice(0, 12).map(l => l.replace(/^\s*(\/\/|#|\/\*|\*|<!--)\s?/, '').replace(/-->|\*\/$/, '').trim());
  return (lines.find(l => l && !/^[=─—-]{4,}$/.test(l) && !/^#!/.test(l)) || '').replace(/^[A-ZÁÉÍÓÖŐÚÜŰ0-9 \-–—!.:]+ — /, '').slice(0, 160);
}
const out = { verzio:exists('VERSION') ? rd('VERSION').trim() : '?', keszult:new Date().toISOString().slice(0, 10), csoportok:[] };
const add = (cim, ikon, link, elemek) => out.csoportok.push({ cim, ikon, link, elemek });

// matricák
global.window = undefined; const ART = require(path.join(WEB, 'js/art/art.js')); global.ART = ART;
for(const f of ls('web/js/art', /^art-.+\.js$/)) require(path.join(WEB, 'js/art', f));
add('Matricák (B szint)', 'palette', 'arculat.html#illusztraciok', ART.names().map(n => ({ nev:n, info:(ART.LIB[n] || {}).hu || '' })));
// piktogramok és tokenek
const pics = [...rd('web/js/pics.js').matchAll(/^\s*([a-z]+)\s*:\s*`/gm)].map(m => m[1]);
add('Piktogramok', 'star', 'arculat.html#ikonok', pics.map(n => ({ nev:n, info:`pic('${n}')` })));
const tokens = [...rd('web/css/tokens.css').matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => ({ nev:'--' + m[1], info:m[2].trim().slice(0, 40) }));
add('Tokenek', 'palette', 'arculat.html#szinek', tokens);
// 3D modellek (builder-függvények a web/js/3d fájlokban)
const models = [];
for(const f of ls('web/js/3d', /\.js$/)){ const s = rd('web/js/3d/' + f);
  for(const m of s.matchAll(/^\s{2}function ([a-zA-Z]+)\(K\b/gm)) models.push({ nev:m[1], info:f }); }
add('3D modellek', 'box', 'modellek.html', models);
// modulok és oldalak
const mod = (d, re) => ls(d, re).map(f => ({ nev:d.replace('web/', '') + '/' + f, info:leiras(d + '/' + f) }));
add('Játék-mechanikák', 'games', 'mechanikak.html', mod('web/js/mech', /\.js$/));
add('Közös keret', 'home', 'keret.html', mod('web/js/keret', /\.js$/).concat(['profil.js', 'hang.js', 'szereplok.js', 'qr.js', 'offline.js'].filter(f => exists('web/js/' + f)).map(f => ({ nev:'js/' + f, info:leiras('web/js/' + f) }))));
add('3D világ és hátterek', 'sun', 'vilag.html', mod('web/js/vilag', /\.js$/));
add('Eszközök', 'tip', null, ls('tools', /\.(js|py|html)$/).map(f => ({ nev:'tools/' + f, info:leiras('tools/' + f) })));
add('Szabálykönyvek', 'diary', null, ls('docs', /\.md$/).map(f => ({ nev:'docs/' + f, info:(rd('docs/' + f).match(/^#\s+(.+)$/m) || [, ''])[1] })));
add('Claude-skillek', 'bee', null, ls('.claude/skills', /^[a-z-]+$/).map(d => ({ nev:d, info:((rd(`.claude/skills/${d}/SKILL.md`).match(/^description:\s*(.+)$/m) || [, ''])[1]).slice(0, 180) })));
fs.writeFileSync(path.join(WEB, 'kit-tartalom.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`kit-tartalom.json: ${out.csoportok.map(c => `${c.cim} ${c.elemek.length}`).join(' · ')}`);
