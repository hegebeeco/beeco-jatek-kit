// ============================================================
//  Design system ellenőrzés — node tests/check-arculat.js   (baseline frissítése: --update)
//
//  1. A JS-paletta (web/js/ds.js) egyezik a CSS-tokenekkel (web/css/tokens.css).
//  2. Olvashatóság: a szöveg–háttér párok kontrasztja eléri a WCAG AA szintet (4,5:1).
//  3. Minden használt var(--név) létezik; minden pic('név') piktogram létezik.
//  4. MINDEN CSS-fájl (és az index.html <head> stílusa) csak tokent használ, nyers színt és régi tokennevet nem
//     (kivétel: tokens.css, fonts.css; névvel deklarált tartalom-szín egyedi tulajdonságban megengedett).
//  (beeco-jatek-kit általános változat: a játék-specifikus részek csak akkor futnak, ha a fájljuk létezik.)
//  5. A játéklista (jatekok.json) szerep-méhecskéi léteznek, a hátterük a palettából való; a hangulat-méhecskék
//     (DS.moods) léteznek; a visszajelzés-recept ikonjai léteznek; a hangok lágyak (nincs „buzzer").
//  6. „Racsni" a régi stílusra: a régi (neo-brutalista) minták száma fájlonként NEM nőhet
//     (tests/arculat-baseline.json). Ha egy modult átállítunk, a szám csökken → --update rögzíti.
// ============================================================
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), WEB = path.join(ROOT, 'web');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const errors = [], notes = [];
const fail = (m) => errors.push(m);

// ---- 1. tokenek beolvasása ----
const tokensCss = read('web/css/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = {};
for(const m of tokensCss.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) tokens[m[1]] = m[2].trim();
const resolve = (v, depth = 0) => {
  const m = /^var\(--([a-z0-9-]+)\)$/i.exec(v);
  return m && depth < 8 ? resolve(tokens[m[1]] || '', depth + 1) : v;
};
const DS = require(path.join(WEB, 'js/ds.js'));
for(const [k, v] of Object.entries(DS.color)){
  if(!tokens[k]) fail(`ds.js: DS.color.${k} nincs a tokens.css-ben`);
  else if(resolve(tokens[k]).toUpperCase() !== v.toUpperCase()) fail(`ds.js ↔ tokens.css eltér: ${k} = ${v} vs ${tokens[k]}`);
}
for(const [k, v] of Object.entries(tokens)) if(/^#[0-9a-f]{6}$/i.test(v) && !DS.color[k]) fail(`tokens.css: --${k} (${v}) hiányzik a ds.js DS.color-ból`);

// ---- 2. kontraszt (WCAG 2.x relatív fénysűrűség) ----
const lum = (hex) => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const tok = (n) => resolve(`var(--${n})`);
// [szöveg, háttér, minimum] – minden pár, amit az elemkészlet ténylegesen használ
const PAIRS = [
  ['ink', 'bg', 4.5], ['ink', 'surface', 4.5], ['ink', 'accent', 4.5], ['ink', 'butter', 4.5], ['ink', 'sage', 4.5],
  ['ink', 'sage-bg', 4.5], ['ink', 'blossom', 4.5], ['ink', 'sky', 4.5], ['ink', 'sky-bg', 4.5],
  ['ink-soft', 'bg', 4.5], ['ink-soft', 'surface', 4.5], ['ink-soft', 'butter', 4.5],
  ['good-ink', 'good-bg', 4.5], ['bad-ink', 'bad-bg', 4.5], ['bg', 'ink', 4.5],
  ['on-accent', 'accent', 4.5],
  // sötét környezet (.ds-dark a ds-game.css-ben): krém szöveg éjszakai alapon, zsálya másodlagos szöveg és körvonal
  ['cream', 'night', 4.5], ['cream', 'night-surface', 4.5], ['sage', 'night-surface', 4.5], ['sage', 'night', 3],
  ['focus', 'bg', 3], ['line', 'bg', 3], ['good', 'surface', 3],   // nem szöveg (3:1): fókuszkeret, körvonal, bekapcsolt kapcsoló a sor hátterén (az állapotot a gomb helye is mutatja)
];
const contrastRows = [];
for(const [fg, bg, min] of PAIRS){
  const r = contrast(tok(fg), tok(bg));
  contrastRows.push(`${fg} / ${bg}: ${r.toFixed(2)}`);
  if(r < min) fail(`kontraszt túl kicsi: --${fg} a --${bg} háttéren ${r.toFixed(2)}:1 (min. ${min}:1)`);
}

// ---- 3. fájlok bejárása ----
const walk = (dir, ext) => fs.readdirSync(dir, { withFileTypes:true }).flatMap(d =>
  d.isDirectory() ? walk(path.join(dir, d.name), ext) : ext.includes(path.extname(d.name)) ? [path.join(dir, d.name)] : []);
const files = [...walk(path.join(WEB, 'css'), ['.css']), ...walk(path.join(WEB, 'js'), ['.js']), path.join(WEB, 'index.html'), path.join(WEB, 'arculat.html')]
  .filter(f => fs.existsSync(f));
const rel = (f) => path.relative(WEB, f);
const src = Object.fromEntries(files.map(f => [rel(f), fs.readFileSync(f, 'utf8')]));

// var(--x) → létezik-e (tokens.css, bármely CSS/HTML-definíció, vagy JS-ből beállított)
const defined = new Set(Object.keys(tokens));
for(const s of Object.values(src)){
  for(const m of s.matchAll(/--([a-z][a-z0-9-]*)\s*:/gi)) defined.add(m[1]);
  for(const m of s.matchAll(/setProperty\(\s*['"]--([a-z0-9-]+)/gi)) defined.add(m[1]);
}
for(const [f, s] of Object.entries(src)){
  for(const m of s.matchAll(/var\(--([a-z0-9-]+)\s*([,)])/gi)){
    if(!defined.has(m[1]) && m[2] !== ',') fail(`${f}: ismeretlen token var(--${m[1]}) (és nincs tartalék érték)`);
  }
}
// pic('név')
const picSrc = src['js/pics.js'];
const PICS = new Set([...picSrc.matchAll(/^\s*([a-z]+)\s*:\s*`/gm)].map(m => m[1]));
for(const [f, s] of Object.entries(src)){
  for(const m of s.matchAll(/\bpic\(\s*'([a-z]+)'/g)) if(!PICS.has(m[1])) fail(`${f}: ismeretlen piktogram pic('${m[1]}')`);
}

// ---- 4. a design system saját fájljai: csak tokenek ----
// az index.html <head> stílusa (ha van) + MINDEN CSS-fájl, a tokenek és a betűk fájlja kivételével (ott deklaráljuk az értékeket)
if(src['index.html']) src['index.html <style>'] = (src['index.html'].split('</head>')[0].match(/<style>[\s\S]*?<\/style>/g) || []).join('\n');
const DS_FILES = Object.keys(src).filter(f => (/^css\/.*\.css$/.test(f) && !['css/tokens.css', 'css/fonts.css'].includes(f)) || f === 'index.html <style>');
for(const f of DS_FILES){
  if(src[f] == null){ fail(`${f}: nincs meg`); continue; }
  // modul-szintű TARTALOM-színek (utánzott öko-címke, parafatábla, hőkamera, jelenet-ég) NÉVVEL deklarálhatók:
  // --gw-leaf:#7bc86c;  --rz-sky-este:linear-gradient(#2b3560, …);  a szabályokban viszont csak var(--…) állhat –
  // ezért az egyedi tulajdonság-deklarációkat („--név: …;") kivesszük az ellenőrzésből
  const s = src[f].replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '').replace(/<link[^>]*>/g, '')
    .replace(/--[a-z0-9-]+\s*:[^;{}]*;?/gi, '');
  const raw = s.match(/#[0-9a-f]{3,8}\b/gi); if(raw) fail(`${f}: nyers szín token helyett: ${[...new Set(raw)].join(', ')}`);
  const legacy = s.match(/var\(--(sarga|fekete|krem)\)/g); if(legacy) fail(`${f}: régi tokennév: ${[...new Set(legacy)].join(', ')}`);
}

// ---- 5. játéklista ----
const games = fs.existsSync(path.join(WEB, 'data/jatekok.json')) ? JSON.parse(read('web/data/jatekok.json')).games : [];
const PALETTE = new Set(Object.values(DS.color).map(v => v.toUpperCase()));
for(const g of games){
  if(g.role && !fs.existsSync(path.join(WEB, g.role))) fail(`jatekok.json: ${g.id} szerep-képe hiányzik: ${g.role}`);
  if(g.accent && !PALETTE.has(g.accent.toUpperCase())) fail(`jatekok.json: ${g.id} háttérszíne (${g.accent}) nincs a palettában`);
}

for(const [k, src] of Object.entries(DS.moods)) if(!fs.existsSync(path.join(WEB, src))) fail(`ds.js: DS.moods.${k} képe hiányzik: ${src}`);
for(const [k, f] of Object.entries(DS.feedback)){
  if(!DS.moods[f.mood]) fail(`ds.js: DS.feedback.${k} ismeretlen hangulat: ${f.mood}`);
  if(!PICS.has(f.icon)) fail(`ds.js: DS.feedback.${k} ismeretlen ikon: ${f.icon}`);
  if(!DS.sound[k] || DS.haptic[k] == null) fail(`ds.js: DS.feedback.${k}-hoz hiányzik a hang vagy a rezgés`);
}
for(const [k, notes] of Object.entries(DS.sound)) for(const [f, d, type, vol] of notes){
  if(type === 'sawtooth' || vol > 0.1 || (k !== 'tap' && f < 250)) fail(`ds.js: DS.sound.${k} túl harsány (${type}, ${f} Hz, hangerő ${vol}) – a visszajelzés lágy legyen`);
}
// a játék magja 2026-09-18 óta a js/jatek-*.js fájlokban (korábban az index.html inline szkriptje)
const core = Object.keys(src).filter(f => f === 'index.html' || (/^js\/[^/]+\.js$/.test(f) && f !== 'js/ds.js')).map(f => src[f]).join('\n');
if(/sawtooth/.test(core.match(/function sndBad[^\n]*/)?.[0] || '')) fail('a sndBad még „buzzer" hangot ad');
if(/BEE\.angry|bee-angry/.test(core)) fail('a mérges méhecske ne reagáljon a játékosra (DS.moods.think)');

// ---- 6. régi stílus – racsni ----
const LEGACY = {
  'régi token (--sarga/--fekete/--krem)': /var\(--(sarga|fekete|krem)\)/g,
  'régi sárga #FFD600': /#FFD600|0xFFD600/gi,
  'kemény eltolt árnyék': /box-shadow\s*:\s*-?\d+px\s+-?\d+px\s+0(?:px)?\s/gi,
  'régi betű (Bricolage / Trebuchet elsőként)': /Bricolage|(?:font-family\s*:\s*|px\s+)["']?Trebuchet/gi,
};
const counts = {};
for(const [f, s] of Object.entries(src)){
  if(['css/tokens.css', 'js/ds.js'].includes(f)) continue;
  for(const [name, re] of Object.entries(LEGACY)){
    const n = (s.match(re) || []).length; if(n) (counts[f] ||= {})[name] = n;
  }
}
const BASE = path.join(__dirname, 'arculat-baseline.json');
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null;
const total = (o) => Object.values(o || {}).reduce((a, x) => a + Object.values(x).reduce((p, q) => p + q, 0), 0);
if(process.argv.includes('--update') || !base){
  fs.writeFileSync(BASE, JSON.stringify(counts, null, 1) + '\n');
  notes.push(`baseline ${base ? 'frissítve' : 'létrehozva'}: ${total(counts)} régi minta`);
} else {
  for(const [f, o] of Object.entries(counts)) for(const [name, n] of Object.entries(o)){
    const was = (base[f] || {})[name] || 0;
    if(n > was) fail(`${f}: több régi minta, mint eddig – ${name}: ${was} → ${n}. Új kód a design systemet használja (docs/arculat.md).`);
  }
  if(total(counts) < total(base)) notes.push(`a régi minták száma csökkent (${total(base)} → ${total(counts)}) – rögzítsd: node tests/check-arculat.js --update`);
}

// ---- összesítés ----
console.log(`Tokenek: ${Object.keys(tokens).length} · piktogramok: ${PICS.size} · kontraszt-párok: ${PAIRS.length}`);
console.log('Kontraszt: ' + contrastRows.join(' · '));
const byFile = Object.entries(counts).map(([f, o]) => [f, Object.values(o).reduce((a, b) => a + b, 0)]).sort((a, b) => b[1] - a[1]);
console.log(`Átállás hátra (régi minták): ${total(counts)} db — ` + byFile.map(([f, n]) => `${f} ${n}`).join(', '));
notes.forEach(n => console.log('ℹ️  ' + n));
if(errors.length){ errors.forEach(e => console.log('❌ ' + e)); process.exit(1); }
console.log('✓ minden rendben');
