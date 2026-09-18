#!/usr/bin/env node
// ============================================================
//  FORRÁS-ELLENŐRZÉS – anti-hallucinációs szabály: SZÁM CSAK FORRÁSSAL.
//
//  A PROJEKT GYÖKERÉBŐL:  node tools/forras.js            → jelentés (1-es kilépési kód, ha hiba van)
//                         node tools/forras.js --lista    → a forrásjegyzék, és hány helyen hivatkozunk az egyes forrásokra
//  A tesztek közt:        node tests/check-forras.js      (ugyanez; a CI minden élesítés előtt futtatja)
//
//  Mit néz? A tartalom JSON-fájljainak minden szövegét. Ha egy szövegben szám van (számjegy, %, és – figyelmeztetésként –
//  szóval írt szám: „kétszer”, „ezer”, „fele”…), akkor a szöveg objektumán vagy valamelyik szülőjén kell lennie egy
//  forrás-mezőnek („forras”), ami a forrásjegyzékben (web/data/forrasok.json) szereplő id-re vagy egy http(s) linkre mutat.
//  Ellenőrzi a jegyzéket is: egyedi id, cím, http(s) link, év (a régi forrásra figyelmeztet), és hogy minden hivatkozott
//  id létezik. Szabály és teendők: docs/forrasok.md
//
//  Beállítás: a projekt tartalom.config.json „forras” része (ha nincs: ésszerű alapértékek). Kivétel egy objektumra
//  (pl. játékszabály: „3 életed van”): "_forrasNemKell": "indoklás" – ez rá és a gyerekeire is érvényes.
//  A kitből jön (beeco-jatek-kit/tools/forras.js) – a projektben ne írd át, a projekt-specifikus rész a configban van.
// ============================================================
'use strict';
const fs = require('fs'), path = require('path');

const DEFAULTS = {
  forrasFajl: 'web/data/forrasok.json',
  forrasTomb: 'forrasok[].id',
  fajlok: null,                                     // null: a tartalom.config.json készletei, vagy a web/data összes JSON-ja
  forrasMezok: ['forras', 'forrasok'],
  urlMezok: ['url', 'link'],
  kihagyottMezok: ['id', 'matrica', 'ikon', 'szin', 'logo', 'kep'],
  szamKivetelek: [],                                // regex-szövegek: ami illeszkedik, azt nem nézzük számnak (pl. "\\b2075\\b")
  szamSzavak: 'figyelmeztetes',                     // 'hiba' | 'figyelmeztetes' | false
  regiForrasEv: 10,
  ketForrasSzamhoz: false,                          // true: számhoz 2 forrás kell (különben figyelmeztet)
};
const NUM_WORDS = /(?<![\p{L}])(?:ezer|ezres|kétszer(?:es(?:e|én)?)?|háromszor(?:os(?:a|án)?)?|négyszer(?:es(?:e)?)?|ötször(?:ös(?:e)?)?|tízszer(?:es(?:e)?)?|százszor(?:os(?:a)?)?|fele|felére|felével|harmada|harmadára|harmadával|negyede|negyedére|dupla|duplája|duplájára)(?![\p{L}])|(?:százalék|milli[óá]|milliárd|billió)/iu;
const isUrl = v => /^https?:\/\/\S+$/.test(v);
const looksUrl = v => /^(?:[a-z]+:\/\/|www\.)/i.test(v);

function splitArr(p) { return String(p).split('.').flatMap(s => (s.endsWith('[]') ? [s.slice(0, -2), '[]'] : [s])).filter(Boolean); }
function expand(d, parts, base = []) {
  if (!parts.length) return [{ path: base, value: d }];
  const [h, ...rest] = parts;
  if (h === '[]') return Array.isArray(d) ? d.flatMap((x, i) => expand(x, rest, [...base, i])) : [];
  return d && typeof d === 'object' && h in d ? expand(d[h], rest, [...base, h]) : [];
}
function walkJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walkJson(path.join(dir, e.name)) : e.name.endsWith('.json') ? [path.join(dir, e.name)] : []));
}

// A beállítások összeállítása: tartalom.config.json → „forras” rész + alapértékek
function settings(root) {
  const cf = path.join(root, 'tartalom.config.json');
  let c = null;
  if (fs.existsSync(cf)) c = JSON.parse(fs.readFileSync(cf, 'utf8'));
  const s = { ...DEFAULTS, ...((c && c.forras) || {}) };
  if (!s.fajlok) {
    const fromSets = c && c.keszletek ? Object.values(c.keszletek).filter(k => k && k.fajl && /\.json$/.test(k.fajl)).map(k => k.fajl) : [];
    s.fajlok = fromSets.length ? fromSets : walkJson(path.join(root, 'web/data')).map(f => path.relative(root, f)).filter(f => !/art-override\.json$/.test(f));
  }
  s.fajlok = [...new Set(s.fajlok)].filter(f => path.resolve(root, f) !== path.resolve(root, s.forrasFajl));
  s.hasConfig = !!c;
  return s;
}

// A fő ellenőrzés – visszaad: { errors, warns, infos, stats, sources, uses }
function check(root, opt = {}) {
  const S = settings(root);
  const errors = [], warns = [], infos = [];
  const now = opt.ev || new Date().getFullYear();
  const exempt = S.szamKivetelek.map(x => new RegExp(x, 'giu'));
  const stats = { files: 0, texts: 0, withNum: 0, sources: 0, todo: 0 };

  // 1) Forrásjegyzék
  const regFile = path.join(root, S.forrasFajl), sources = new Map(), uses = new Map();
  if (fs.existsSync(regFile)) {
    let reg;
    try { reg = JSON.parse(fs.readFileSync(regFile, 'utf8')); } catch (e) { errors.push(`${S.forrasFajl}: nem érvényes JSON (${e.message})`); reg = {}; }
    const parts = splitArr(S.forrasTomb), listPath = parts.slice(0, parts.lastIndexOf('[]')), idKey = parts[parts.length - 1];
    const list = expand(reg, listPath)[0];
    if (!list || !Array.isArray(list.value)) errors.push(`${S.forrasFajl}: nem találom a forrás-listát (${listPath.join('.')})`);
    else list.value.forEach((f, i) => {
      const w = `${S.forrasFajl} › ${f && f[idKey] ? f[idKey] : '#' + (i + 1)}`;
      if (!f || typeof f !== 'object') { errors.push(`${w}: a forrás egy { id, cim, url, kiado, ev } objektum legyen`); return; }
      const id = f[idKey];
      if (!id || typeof id !== 'string' || !/^[\p{L}\p{N}_.-]+$/u.test(id)) errors.push(`${w}: hiányzó vagy hibás id (betű, szám, _ . - lehet, szóköz nélkül)`);
      else if (sources.has(id)) errors.push(`${w}: az id kétszer szerepel`);
      else sources.set(id, f);
      if (!f.cim) errors.push(`${w}: hiányzik a cím („cim”)`);
      if (!f.url) errors.push(`${w}: hiányzik a link („url”) – a konkrét oldal címe, ahol a szám szerepel`);
      else if (!isUrl(f.url)) errors.push(`${w}: a link http:// vagy https:// kezdetű, szóköz nélküli cím legyen („${f.url}”)`);
      if (!f.kiado) warns.push(`${w}: nincs kiadó („kiado”) – ki adta ki (pl. KSH, Eurostat, NÉBIH)?`);
      if (f.ev === undefined || f.ev === '') warns.push(`${w}: nincs év („ev”) – mikori az adat?`);
      else if (!Number.isInteger(Number(f.ev)) || Number(f.ev) < 1900 || Number(f.ev) > now + 1) errors.push(`${w}: az év („ev”) egy évszám legyen (pl. 2024), nem „${f.ev}”`);
      else if (S.regiForrasEv && now - Number(f.ev) > S.regiForrasEv) warns.push(`${w}: régi forrás (${f.ev}, ${now - Number(f.ev)} éves) – van frissebb adat?`);
    });
    stats.sources = sources.size;
  } else infos.push(`Nincs forrásjegyzék (${S.forrasFajl}) – forrásra csak http(s) linkkel lehet hivatkozni.`);

  // Egy forrás-mező értékének ellenőrzése; visszaadja az érvényes hivatkozások listáját
  function refs(val, where) {
    const list = Array.isArray(val) ? val : [val], ok = [];
    for (const r of list) {
      if (typeof r !== 'string' || !r.trim()) { errors.push(`${where}: a forrás egy id vagy http(s) link legyen (szöveg), nem ${JSON.stringify(r)}`); continue; }
      if (isUrl(r)) { ok.push(r); continue; }
      if (looksUrl(r)) { errors.push(`${where}: a link http:// vagy https:// kezdetű legyen („${r}”)`); continue; }
      if (!sources.has(r)) { errors.push(`${where}: ismeretlen forrás „${r}” – vedd fel a ${S.forrasFajl} fájlba (docs/forrasok.md), vagy adj meg http(s) linket`); continue; }
      uses.set(r, (uses.get(r) || 0) + 1); ok.push(r);
    }
    return ok;
  }
  // Olvasható hely: kartyak[bicikli].szoveg (tömbelemnél az id, ha van; különben a sorszám 1-től)
  const label = (data, p) => { let o = data; return p.map((k, i) => { o = o == null ? o : o[k];
    return typeof k === 'number' ? `[${o && typeof o === 'object' && o.id !== undefined ? o.id : k + 1 + '.'}]` : (i ? '.' : '') + k; }).join(''); };
  const snippet = (s, m) => { const i = Math.max(0, s.indexOf(m) - 25); return (i ? '…' : '') + s.slice(i, i + 70).replace(/\n/g, ' ') + (s.length > i + 70 ? '…' : ''); };

  // 2) Tartalom: minden szöveg bejárása, a legközelebbi forrás-mezővel
  for (const rel of S.fajlok) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) { warns.push(`${rel}: a beállításban szerepel, de nincs ilyen fájl`); continue; }
    if (!/\.json$/.test(rel)) { warns.push(`${rel}: csak JSON-fájlt tudok átnézni – kihagyva`); continue; }
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { errors.push(`${rel}: nem érvényes JSON (${e.message})`); continue; }
    stats.files++;
    // chain: a gyökértől az aktuális helyig vezető objektumok (a forrást ezekben keressük, alulról felfelé)
    const walk = (node, p, chain, exemptHere) => {
      if (typeof node === 'string') { text(node, chain, exemptHere, `${rel} › ${label(data, p)}`); return; }
      if (Array.isArray(node)) { node.forEach((x, i) => walk(x, [...p, i], chain, exemptHere)); return; }
      if (!node || typeof node !== 'object') return;
      const ex = exemptHere || (typeof node._forrasNemKell === 'string' && node._forrasNemKell.trim() !== '');
      if (node._forrasNemKell !== undefined && !ex) warns.push(`${rel} › ${label(data, p) || '(gyökér)'}: a "_forrasNemKell" mellé írd az indoklást (szövegként)`);
      const ch = [...chain, node];
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('_')) continue;
        const here = `${rel} › ${label(data, [...p, k])}`;
        if (S.forrasMezok.includes(k)) { refs(v, here); continue; }
        if (S.urlMezok.includes(k) && typeof v === 'string') { if (v && !isUrl(v)) errors.push(`${here}: a link http:// vagy https:// kezdetű, szóköz nélküli cím legyen („${v}”)`); continue; }
        if (S.kihagyottMezok.includes(k)) continue;
        walk(v, [...p, k], ch, ex);
      }
    };
    const text = (s, chain, ex, here) => {
      if (isUrl(s)) return;
      stats.texts++;
      if (/TODO:\s*forrás kell/i.test(s)) { stats.todo++; warns.push(`${here}: „TODO: forrás kell” – a játékos is látja; forrás kell, vagy a mondat szám nélkül`); }
      let t = s.replace(/\{\{?\w+\}?\}/g, '');           // {n}, {{NEV}} helyőrzők nem számok
      for (const re of exempt) t = t.replace(re, '');
      const digit = /\d[\d\s.,]*\s*%?|%/.exec(t), word = S.szamSzavak ? NUM_WORDS.exec(t) : null;
      if (!digit && !word) return;
      stats.withNum++;
      if (ex) return;
      let src = null;                                        // a legközelebbi objektum, amelyiknek van forrás-mezője
      for (let i = chain.length - 1; i >= 0 && !src; i--) {
        const o = chain[i];
        if (o && typeof o === 'object' && !Array.isArray(o)) for (const k of S.forrasMezok) if (o[k] !== undefined && o[k] !== '' && !(Array.isArray(o[k]) && !o[k].length)) { src = o[k]; break; }
      }
      const what = digit ? `szám van a szövegben („${digit[0].trim()}”)` : `szóval írt szám van a szövegben („${word[0]}”)`;
      if (!src) {
        const m = `${here}: ${what}, de nincs forrás – add meg a „${S.forrasMezok[0]}” mezőt, vagy írd szám nélkül / „TODO: forrás kell”. Szöveg: ${snippet(s, (digit || word)[0].trim())}`;
        if (digit || S.szamSzavak === 'hiba') errors.push(m); else warns.push(m);
        return;
      }
      const n = new Set((Array.isArray(src) ? src : [src]).filter(x => typeof x === 'string' && (isUrl(x) || sources.has(x)))).size;
      if (digit && S.ketForrasSzamhoz && n < 2) warns.push(`${here}: ${what}, de csak ${n} forrás van – számhoz lehetőleg 2 egyező forrás kell`);
    };
    walk(data, [], [], false);
  }
  const unused = [...sources.keys()].filter(id => !uses.has(id));
  if (unused.length) infos.push(`Hivatkozás nélküli forrás(ok) a jegyzékben: ${unused.join(', ')}`);
  return { errors, warns, infos, stats, sources, uses, settings: S };
}

function report(root, opt = {}) {
  const r = check(root, opt), rel = path.relative(process.cwd(), root) || '.';
  console.log(`Forrás-ellenőrzés (${rel}${r.settings.hasConfig ? '' : ', tartalom.config.json nélkül – alapbeállítás'})`);
  console.log(`  Forrásjegyzék: ${r.settings.forrasFajl} – ${r.stats.sources} forrás · átnézve ${r.stats.files} fájl, ${r.stats.texts} szöveg, ebből ${r.stats.withNum} tartalmaz számot`);
  if (opt.lista) for (const [id, f] of r.sources) console.log(`  • ${id} – ${f.cim || '?'} (${f.kiado || '?'}, ${f.ev || '?'}) · ${r.uses.get(id) || 0} hivatkozás\n      ${f.url || ''}`);
  for (const e of r.errors) console.log('  ✖ HIBA: ' + e);
  for (const w of r.warns) console.log('  ⚠ ' + w);
  for (const i of r.infos) console.log('  ℹ ' + i);
  if (r.errors.length) console.log(`✖ Forrás-ellenőrzés: ${r.errors.length} hiba, ${r.warns.length} figyelmeztetés – szabály és teendők: docs/forrasok.md`);
  else console.log(`✓ forrás-ellenőrzés rendben (${r.stats.withNum} számos szöveg, ${r.stats.sources} forrás${r.warns.length ? ', ' + r.warns.length + ' figyelmeztetés' : ''})`);
  return r;
}

if (require.main === module) {
  const r = report(process.cwd(), { lista: process.argv.includes('--lista') });
  process.exit(r.errors.length ? 1 : 0);
}
module.exports = { check, report, settings, NUM_WORDS };
