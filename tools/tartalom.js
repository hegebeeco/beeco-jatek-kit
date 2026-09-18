#!/usr/bin/env node
// ============================================================
//  TARTALOM ⇄ TÁBLÁZAT (CSV) – a beeco csapat Excelben / Google Táblázatban szerkesztheti a játék szövegeit.
//
//  A PROJEKT GYÖKÉRMAPPÁJÁBÓL futtasd (ott van a tartalom.config.json):
//    node tools/tartalom.js export [készlet]                  → <csvMappa>/<készlet>.csv
//    node tools/tartalom.js import [készlet] [--dry]          ← <csvMappa>/<készlet>.csv
//        --csv <fájl>   másik CSV beolvasása (csak egy készlettel)
//        --force        akkor is írjon, ha a sort az export óta a JSON-ban is módosították
//    node tools/tartalom.js lista                             → a készletek és oszlopaik
//
//  Mit szerkeszthet a táblázat? Ezt a projekt tartalom.config.json fájlja mondja meg (készletenként: melyik JSON,
//  melyik tömb, melyik mező szerkeszthető / csak olvasható / kötelező, max. hossz, lehetséges értékek, link- és
//  forrásmezők). Útmutató: docs/tartalom-szerkesztes.md · forrás-szabály: docs/forrasok.md
//
//  Miért marad kicsi a git-diff? Nem írjuk újra a fájlt (JSON.stringify), mert a JSON-ok kézzel formázottak. Egy saját
//  elemző megjegyzi minden érték PONTOS helyét, és importkor csak a megváltozott értékek bájtjait cseréli. Írás előtt
//  ellenőrzi, hogy az új fájl pontosan a tervezett változásokat tartalmazza – ha nem, nem ír.
//
//  A kitből jön (beeco-jatek-kit/tools/tartalom.js) – a projektben ne írd át, a projekt-specifikus rész a configban van.
//  (A fájl 200 sor fölött van: önálló parancssori eszköz; ha tovább nő, az elemző és a CSV-rész kiemelhető.)
// ============================================================
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const ROOT = process.cwd();                          // a projekt gyökere = ahonnan futtatod (az eszköz a kitből másolódik)
const CONFIG_FILE = path.join(ROOT, 'tartalom.config.json');
const RO = ' (csak olvasható)';
class UserError extends Error {}

// ------------------------------------------------------------
//  1. Helymegőrző elemző (JSON + egyszerű JS objektum-literál)
//     Minden csomópont: { t, start, end, ... } – start/end karakterpozíció a forrásban.
// ------------------------------------------------------------
function parseLiteral(src, pos) {
  let i = pos;
  const fail = (m) => { throw new Error(`Elemzési hiba (${m}) a(z) ${i}. karakternél: ` + JSON.stringify(src.slice(i, i + 40))); };
  const ws = () => {
    for (;;) {
      if (/\s/.test(src[i] || '')) { i++; continue; }
      if (src.startsWith('//', i)) { const n = src.indexOf('\n', i); i = n < 0 ? src.length : n + 1; continue; }
      if (src.startsWith('/*', i)) { const n = src.indexOf('*/', i); if (n < 0) fail('lezáratlan megjegyzés'); i = n + 2; continue; }
      return;
    }
  };
  const str = () => {
    const q = src[i], start = i; i++;
    let v = '';
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\n') fail('sortörés a szövegben');
      if (src[i] === '\\') {
        const c = src[i + 1]; i += 2;
        const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
        if (c === 'u') { v += String.fromCharCode(parseInt(src.substr(i, 4), 16)); i += 4; }
        else if (c === 'x') { v += String.fromCharCode(parseInt(src.substr(i, 2), 16)); i += 2; }
        else if (c in map) v += map[c];
        else if (c === '\n') { /* sorfolytatás */ }
        else v += c;
      } else v += src[i++];
    }
    if (src[i] !== q) fail('lezáratlan szöveg');
    i++;
    return { t: 'str', start, end: i, value: v, quote: q };
  };
  const value = () => {
    ws();
    const c = src[i], start = i;
    if (c === '{') {
      i++; const members = [];
      for (;;) {
        ws(); if (src[i] === '}') { i++; break; }
        let key, keyQuoted = false, keyQuote = '"'; const keyStart = i;
        if (src[i] === '"' || src[i] === "'") { const k = str(); key = k.value; keyQuoted = true; keyQuote = k.quote; }
        else { const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 200)); if (!m) fail('kulcs'); key = m[0]; i += key.length; }
        const keyEnd = i; ws(); if (src[i] !== ':') fail('kettőspont'); i++;
        const v = value(); members.push({ key, keyStart, keyEnd, keyQuoted, keyQuote, value: v });
        ws(); if (src[i] === ',') { i++; continue; } if (src[i] === '}') { i++; break; } fail('vessző vagy }');
      }
      return { t: 'obj', start, end: i, members };
    }
    if (c === '[') {
      i++; const items = [];
      for (;;) {
        ws(); if (src[i] === ']') { i++; break; }
        items.push(value()); ws();
        if (src[i] === ',') { i++; continue; } if (src[i] === ']') { i++; break; } fail('vessző vagy ]');
      }
      return { t: 'arr', start, end: i, items };
    }
    if (c === '"' || c === "'") return str();
    const m = /^(true|false|null|-?0x[0-9a-fA-F]+|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/.exec(src.slice(i, i + 40));
    if (!m) fail('ismeretlen érték');
    i += m[0].length;
    const raw = m[0];
    const v = raw === 'true' ? true : raw === 'false' ? false : raw === 'null' ? null : Number(raw);
    return { t: v === null ? 'null' : typeof v === 'boolean' ? 'bool' : 'num', start, end: i, value: v };
  };
  const node = value();
  return { node, end: i };
}
function plain(n) {
  if (n.t === 'obj') { const o = {}; for (const m of n.members) o[m.key] = plain(m.value); return o; }
  if (n.t === 'arr') return n.items.map(plain);
  return n.value;
}
const member = (n, key) => (n && n.t === 'obj' ? n.members.find(m => m.key === key) : undefined);
function nodeAt(n, p) {                              // út (pl. ['kartyak', 3, 'bal', 'felirat']) → csomópont
  for (const k of p) {
    if (!n) return undefined;
    if (typeof k === 'number') n = n.t === 'arr' ? n.items[k] : undefined;
    else { const m = member(n, k); n = m && m.value; }
  }
  return n;
}
function getAt(o, p) { for (const k of p) { if (o == null) return undefined; o = o[k]; } return o; }

// Érték kódolása a fájl stílusában (JSON: "…", JS: az eredeti idézőjellel)
function encodeStr(v, quote) {
  if (quote === '"') return JSON.stringify(v);
  return quote + v.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), '\\' + quote)
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + quote;
}
function encodeKey(k, q, bare) { return bare && /^[A-Za-z_$][\w$]*$/.test(k) ? k : encodeStr(k, q); }
function encodeValue(v, q, st) {                     // st: { sepKV, bareKeys } – új sornál a testvérek formája
  if (typeof v === 'string') return encodeStr(v, q);
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return String(v);
  if (Array.isArray(v)) return '[' + v.map(x => encodeValue(x, q, st)).join(', ') + ']';
  const s = st || { sepKV: ': ', bareKeys: false };
  return '{ ' + Object.keys(v).map(k => encodeKey(k, q, s.bareKeys) + s.sepKV + encodeValue(v[k], q, s)).join(', ') + ' }';
}

// ------------------------------------------------------------
//  2. A config (tartalom.config.json) beolvasása és ellenőrzése
// ------------------------------------------------------------
const segs = p => (p === '.' ? [] : String(p).split('.'));   // 'bal.felirat' → ['bal','felirat']; 'szintek[].kartyak' → ['szintek','[]','kartyak']
function splitArr(p) { return String(p).split('.').flatMap(s => (s.endsWith('[]') ? [s.slice(0, -2), '[]'] : [s])).filter(Boolean); }
// Út kibontása: minden '[]' egy tömb összes elemét jelenti → [{ path, value }]
function expand(data, parts, base = []) {
  if (!parts.length) return [{ path: base, value: data }];
  const [h, ...rest] = parts;
  if (h === '[]') return Array.isArray(data) ? data.flatMap((x, i) => expand(x, rest, [...base, i])) : [];
  return data && typeof data === 'object' && h in data ? expand(data[h], rest, [...base, h]) : [];
}
const asMap = (x) => (Array.isArray(x) ? Object.fromEntries(x.map(k => [k, k.replace(/\./g, ' ')])) : { ...(x || {}) });

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) throw new UserError(`Nincs tartalom.config.json ebben a mappában: ${ROOT}\n` +
    '  A projekt gyökérmappájából futtasd (pl. cd ~/CLAUDE/<projekt>), vagy készíts egyet a kit mintája alapján\n' +
    '  (beeco-jatek-kit/sablon/tartalom.config.json).');
  let c;
  try { c = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (e) { throw new UserError('A tartalom.config.json nem érvényes JSON: ' + e.message); }
  const bad = m => { throw new UserError('tartalom.config.json: ' + m); };
  if (!c.keszletek || typeof c.keszletek !== 'object') bad('hiányzik a "keszletek" objektum');
  const F = c.forras || {};
  const cfg = {
    outDir: path.join(ROOT, c.csvMappa || 'docs/tartalom'),
    limit: c.javasoltMaxHossz === undefined ? 200 : c.javasoltMaxHossz,
    forrasFajl: F.forrasFajl || 'web/data/forrasok.json',
    forrasTomb: F.forrasTomb || 'forrasok[].id',
    sets: {},
  };
  for (const [name, k] of Object.entries(c.keszletek)) {
    if (name.startsWith('_')) continue;
    if (!/^[\w-]+$/.test(name)) bad(`a készlet neve („${name}”) csak betű, szám, _ és - lehet (ez lesz a CSV fájlneve)`);
    if (!k.fajl) bad(`${name}: hiányzik a "fajl"`);
    if (!Array.isArray(k.tipusok) || !k.tipusok.length) bad(`${name}: hiányzik a "tipusok" lista`);
    const types = k.tipusok.map((t, ti) => {
      const where = `${name}.tipusok[${ti}]`;
      if (!t.tipus) bad(`${where}: hiányzik a "tipus" (a sor típusának neve a táblázatban)`);
      const srcs = ['tomb', 'szotar', 'kulcsok'].filter(x => t[x]);
      if (srcs.length !== 1) bad(`${where} (${t.tipus}): pontosan egy kell ezek közül: "tomb", "szotar", "kulcsok"`);
      const ed = asMap(t.szerkesztheto), ro = asMap(t.csakOlvashato);
      if (!Object.keys(ed).length) bad(`${where} (${t.tipus}): nincs "szerkesztheto" mező`);
      const set = x => new Set(x || []);
      const req = set(t.kotelezo), urls = set(t.urlMezok), srcF = set(t.forrasMezok), nums = set(t.szamMezok), lists = set(t.listaMezok);
      for (const k2 of [...req, ...urls, ...srcF, ...nums, ...lists, ...Object.keys(t.maxHossz || {}), ...Object.keys(t.lehetsegesErtekek || {})])
        if (!(k2 in ed)) bad(`${where} (${t.tipus}): a(z) „${k2}” mező nincs a "szerkesztheto" listában`);
      const idKey = t.id || 'id';
      const fields = [
        ...Object.entries(ed).map(([key, col]) => ({ key, col, ro: false, opt: !req.has(key), url: urls.has(key), forras: srcF.has(key),
          num: nums.has(key), list: lists.has(key), max: (t.maxHossz || {})[key], allowed: (t.lehetsegesErtekek || {})[key] })),
        ...Object.entries(ro).map(([key, col]) => ({ key, col, ro: true })),
      ];
      let rows, arrPath = null;
      if (t.tomb) {
        const parts = splitArr(t.tomb);
        if (!parts.includes('[]')) arrPath = parts;          // új sort csak egyszerű (nem beágyazott) tömbbe veszünk fel
        rows = d => expand(d, [...parts, '[]']).map(x => ({ id: String(x.value && x.value[idKey]), path: x.path }));
      } else if (t.szotar) {
        const parts = splitArr(t.szotar);
        rows = d => { const o = getAt(d, parts); return o && typeof o === 'object' ? Object.keys(o).filter(x => !x.startsWith('_')).map(x => ({ id: x, path: [...parts, x] })) : []; };
      } else {
        rows = d => t.kulcsok.filter(x => getAt(d, segs(x)) !== undefined).map(x => ({ id: x, path: segs(x) }));
      }
      if (t.ujSor && !arrPath) bad(`${where} (${t.tipus}): "ujSor" csak egyszerű "tomb"-nél lehet (nem beágyazott, nem szótár)`);
      return { type: t.tipus, rows, fields, idKey, arrPath, ujSor: !!t.ujSor, egyutt: t.egyuttKell || {} };
    });
    cfg.sets[name] = { name, title: k.cim || name, file: k.fajl, jsVar: k.jsValtozo || null, types };
  }
  return cfg;
}

// ------------------------------------------------------------
//  3. Forrásfájl betöltése (JSON vagy egy JS-fájl objektum-változója: "jsValtozo")
// ------------------------------------------------------------
function loadSource(g) {
  const file = path.join(ROOT, g.file);
  if (!fs.existsSync(file)) throw new UserError(`Nincs ilyen fájl: ${g.file}`);
  const text = fs.readFileSync(file, 'utf8');
  let start = 0;
  if (g.jsVar) {
    const m = new RegExp('\\b(?:const|let|var)\\s+' + g.jsVar + '\\s*=\\s*').exec(text);
    if (!m) throw new UserError(`${g.file}: nem található a ${g.jsVar} objektum`);
    start = m.index + m[0].length;
  }
  const { node } = parseLiteral(text, start);
  const data = plain(node);
  const truth = evalSource(g, text);                // önellenőrzés: a saját elemző ugyanazt látja, mint a JavaScript
  if (JSON.stringify(truth) !== JSON.stringify(data)) throw new Error(`${g.file}: a helymegőrző elemző eltér a JS-értelmezéstől – fejlesztő kell`);
  const firstStr = (function find(n) { if (!n) return null; if (n.t === 'str') return n; for (const c of n.t === 'obj' ? n.members.map(m => m.value) : n.t === 'arr' ? n.items : []) { const r = find(c); if (r) return r; } return null; })(node);
  const firstObj = (function find(n) { if (!n) return null; if (n.t === 'obj' && n.members.length) return n; for (const c of n.t === 'obj' ? n.members.map(m => m.value) : n.t === 'arr' ? n.items : []) { const r = find(c); if (r) return r; } return null; })(node);
  const m0 = firstObj && firstObj.members[0];      // a fájl kulcs-stílusa („"id":"x"” vagy „"id": "x"”) – új sornál, ha nincs testvér
  return { file, text, node, data, quote: g.jsVar ? (firstStr ? firstStr.quote : "'") : '"',
    style: m0 ? { sepKV: text.slice(m0.keyEnd, m0.value.start), bareKeys: !m0.keyQuoted } : { sepKV: ': ', bareKeys: !!g.jsVar } };
}
function evalSource(g, text) {
  if (!g.jsVar) return JSON.parse(text);
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(text + `\n;this.__tartalom = ${g.jsVar};`, ctx, { filename: g.file });
  return JSON.parse(JSON.stringify(ctx.__tartalom));
}

// ------------------------------------------------------------
//  4. Sorok, oszlopok, cellák
// ------------------------------------------------------------
const fieldPath = (row, f) => [...row.path, ...segs(f.key)];
const fieldValue = (data, row, f) => getAt(data, fieldPath(row, f));
function cellText(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.map(x => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ');
  if (typeof v === 'boolean') return v ? 'igen' : 'nem';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
function columns(g) {
  const cols = ['típus' + RO, 'id' + RO];
  for (const t of g.types) for (const f of t.fields) { const h = f.col + (f.ro ? RO : ''); if (!cols.includes(h)) cols.push(h); }
  cols.push('ellenőrző kód' + RO);
  return cols;
}
// A sor szerkeszthető értékeinek ujjlenyomata – ebből látszik importkor, ha a JSON azóta változott. Csak betűk (az Excel ne alakítsa számmá).
function rowHash(data, row, t) {
  const s = JSON.stringify(t.fields.filter(f => !f.ro).map(f => fieldValue(data, row, f) ?? null));
  return [...crypto.createHash('sha1').update(s).digest()].slice(0, 8).map(b => String.fromCharCode(97 + b % 26)).join('');
}
function allRows(g, data) {
  const out = [], dup = [];
  for (const t of g.types) {
    const seen = new Set();
    for (const r of t.rows(data)) {
      if (seen.has(r.id)) dup.push(`${t.type} „${r.id}”`);
      seen.add(r.id); out.push({ ...r, t, key: t.type + '|' + r.id });
    }
  }
  if (dup.length) throw new UserError(`${g.file}: ismétlődő azonosító(k): ${dup.join(', ')} – ezt fejlesztő javítja (az id legyen egyedi).`);
  return out;
}
// Lehetséges értékek: lista, vagy út ugyanabban a fájlban („ertekek[].id”), vagy másik fájlban („web/data/x.json#tomb[].id”)
function allowedValues(spec, data) {
  if (Array.isArray(spec)) return spec.map(String);
  const [file, p] = String(spec).includes('#') ? String(spec).split('#') : [null, spec];
  const d = file ? JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')) : data;
  return expand(d, splitArr(p)).map(x => String(x.value));
}
function sourceIds(cfg, pending) {
  const f = path.join(ROOT, cfg.forrasFajl);
  const ids = fs.existsSync(f) ? expand(JSON.parse(fs.readFileSync(f, 'utf8')), splitArr(cfg.forrasTomb)).map(x => String(x.value)) : [];
  return new Set([...ids, ...pending]);
}

// ------------------------------------------------------------
//  5. CSV (UTF-8 BOM, ';' elválasztó – a magyar Excel így nyitja meg jól; minden cella idézőjelben, sortörés megmarad)
// ------------------------------------------------------------
const FORMULA = /^[=+\-@]/;   // az Excel képletnek venné → egy ' kerül elé, importkor levesszük (képlet-védelem)
function csvCell(s) { s = String(s); if (FORMULA.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
function writeCsv(file, header, rows) {
  fs.writeFileSync(file, '﻿' + [header, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n') + '\r\n', 'utf8');
}
function readCsv(file) {
  const s = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  // Elválasztó az első sorból (Excel HU: ';', Google Táblázat: ',', néha tabulátor)
  const nl = s.search(/\r?\n/), first = s.slice(0, nl < 0 ? s.length : nl);
  const count = ch => first.split(ch).length - 1;
  const sep = [';', ',', '\t'].sort((a, b) => count(b) - count(a))[0];
  const rows = []; let row = [], cell = '', q = false, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i += 2; continue; } q = false; i++; continue; }
      cell += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === sep) { row.push(cell); cell = ''; i++; continue; }
    if (c === '\r' || c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i += (c === '\r' && s[i + 1] === '\n') ? 2 : 1; continue; }
    cell += c; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const clean = v => { v = v.replace(/\r\n?/g, '\n'); if (v[0] === "'" && FORMULA.test(v.slice(1))) v = v.slice(1); return v; };
  return { sep, rows: rows.filter(r => r.some(c => c.trim() !== '')).map(r => r.map(clean)) };
}

// ------------------------------------------------------------
//  6. Export
// ------------------------------------------------------------
function exportSet(cfg, g) {
  const src = loadSource(g), header = columns(g);
  const rows = allRows(g, src.data).map(r => {
    const line = new Array(header.length).fill('');
    line[0] = r.t.type; line[1] = r.id;
    for (const f of r.t.fields) line[header.indexOf(f.col + (f.ro ? RO : ''))] = cellText(fieldValue(src.data, r, f));
    line[header.length - 1] = rowHash(src.data, r, r.t);
    return line;
  });
  fs.mkdirSync(cfg.outDir, { recursive: true });
  const out = path.join(cfg.outDir, g.name + '.csv');
  writeCsv(out, header, rows);
  console.log(`✔ ${g.title}: ${rows.length} sor → ${path.relative(ROOT, out)}`);
}

// ------------------------------------------------------------
//  7. Import
// ------------------------------------------------------------
const numbersIn = s => (String(s).match(/\d+(?:[.,  ]\d+)*/g) || []).map(x => x.replace(/[\s  ]/g, ''));
const short = (s, n = 90) => { s = cellText(s).replace(/\n/g, '⏎'); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const isUrl = v => /^https?:\/\/\S+$/.test(v);

// Cella → új érték. Visszaad: { skip } (nincs változás) | { value } (undefined = mező törlése) | { error }
function parseCell(f, cur, raw) {
  let v = raw;
  if (typeof cur === 'string' && cur === cur.trim()) v = v.trim();
  const isList = f.list || (Array.isArray(cur) && cur.every(x => typeof x === 'string'));
  const isNum = f.num || typeof cur === 'number';
  const empty = v.trim() === '';
  if (empty) {
    if (cur === undefined || cur === '' || (Array.isArray(cur) && !cur.length)) return { skip: true };
    return f.opt ? { value: undefined } : { error: 'kötelező mező, nem lehet üres' };
  }
  if (cur !== undefined && typeof cur !== 'string' && !isList && !isNum) return { error: 'ez a mező nem szöveg – fejlesztő kell' };
  let nv = v;
  if (isNum) {
    if (!/^-?\d+(?:[.,]\d+)?$/.test(v.trim())) return { error: `számot vár (pl. 2024), ez nem az: „${v}”` };
    nv = Number(v.trim().replace(',', '.'));
  } else if (isList) nv = v.split(/\s*[,;\n]\s*/).map(x => x.trim()).filter(Boolean);
  return same(nv, cur) ? { skip: true } : { value: nv };
}

function importSet(cfg, g, opt, pending) {
  const errors = [], warns = [], changes = [], edits = [];
  let src = null;
  const csvFile = opt.csv || path.join(cfg.outDir, g.name + '.csv');
  try { src = loadSource(g); } catch (e) { errors.push(e.message); return finish(); }
  const data = src.data;
  if (!fs.existsSync(csvFile)) { errors.push(`Nincs ilyen CSV: ${path.relative(ROOT, csvFile)} – előbb: node tools/tartalom.js export ${g.name}`); return finish(); }
  const { rows, sep } = readCsv(csvFile);
  const header = (rows.shift() || []).map(h => h.trim());
  const colIdx = h => { let k = header.indexOf(h); if (k < 0 && h.endsWith(RO)) k = header.indexOf(h.slice(0, -RO.length)); return k; };
  const iType = colIdx('típus' + RO), iId = colIdx('id' + RO), iHash = colIdx('ellenőrző kód' + RO);
  if (iType < 0 || iId < 0) { errors.push(`A CSV fejlécéből hiányzik a „típus” vagy az „id” oszlop (elválasztó: ${JSON.stringify(sep)}).`); return finish(); }
  const known = new Set(columns(g).flatMap(h => [h, h.replace(RO, '')]));
  for (const h of header) if (h && !known.has(h)) warns.push(`Ismeretlen oszlop, kihagyva: „${h}”`);
  const missingCols = columns(g).filter(h => !h.endsWith(RO) && colIdx(h) < 0);
  if (missingCols.length) warns.push(`Hiányzó oszlop(ok), ezek nem változnak: ${missingCols.join(', ')}`);

  let current;
  try { current = new Map(allRows(g, data).map(r => [r.key, r])); } catch (e) { errors.push(e.message); return finish(); }
  const typeByName = new Map(g.types.map(t => [t.type, t]));
  const seen = new Set(), unknown = [], longOld = {}, newRows = new Map();
  let srcIds = null;
  const knownSources = () => srcIds || (srcIds = sourceIds(cfg, pending));

  for (const [n, cells] of rows.entries()) {
    const line = n + 2, type = (cells[iType] || '').trim(), rid = (cells[iId] || '').trim();
    const key = type + '|' + rid;
    if (seen.has(key)) { errors.push(`${line}. sor: kétszer szerepel: ${type} „${rid}”`); continue; }
    seen.add(key);
    let r = current.get(key);
    const t = typeByName.get(type);
    const isNew = !r && t && t.ujSor;
    if (!r && !isNew) { unknown.push(`${line}. sor: ${type || '(üres típus)'} „${rid}”`); continue; }
    const where = `${line}. sor (${type} ${rid})`;
    if (isNew) {
      if (!/^[\p{L}\p{N}_-]+$/u.test(rid)) { errors.push(`${where}: az új sor id-je csak betű, szám, _ és - lehet (szóköz nélkül)`); continue; }
      r = { id: rid, t, path: null, key, isNew: true };
    }
    const next = {}, planned = [];
    for (const f of r.t.fields) {
      const h = f.col + (f.ro ? RO : ''), k = colIdx(h);
      const cur = r.isNew ? undefined : fieldValue(data, r, f);
      next[f.key] = cur;
      if (k < 0) continue;
      const raw = cells[k] ?? '';
      if (f.ro) {
        if (raw.trim() !== cellText(cur).trim()) warns.push(`${where}: a „${f.col}” csak olvasható – a módosítás nem kerül át (fejlesztő kell hozzá).`);
        continue;
      }
      const max = f.url || f.forras || f.num ? 0 : f.max === undefined ? cfg.limit : f.max;
      const res = parseCell(f, cur, raw);
      const err = m => errors.push(`${where} · ${f.col}: ${m}`), warn = m => warns.push(`${where} · ${f.col}: ${m}`);
      if (res.skip) { if (max && typeof cur === 'string' && cur.length > max) longOld[f.col] = (longOld[f.col] || 0) + 1; continue; }
      if (res.error) { err(res.error); continue; }
      const nv = res.value; next[f.key] = nv;
      if (nv === undefined) { planned.push({ f, cur, v: nv }); continue; }
      // Változott → ellenőrzések
      const vals = Array.isArray(nv) ? nv.map(String) : [String(nv)];
      if (f.url) { const b = vals.filter(x => !isUrl(x)); if (b.length) { err(`a link http:// vagy https:// kezdetű, szóköz nélküli cím legyen (${b.join(', ')})`); continue; } }
      if (f.forras) {
        const ids = knownSources(), b = vals.filter(x => !isUrl(x) && !ids.has(x));
        if (b.length) { err(`ismeretlen forrás: ${b.join(', ')} – a forrás id-je a ${cfg.forrasFajl} fájlból, vagy egy http(s) link (docs/forrasok.md)`); continue; }
      }
      if (f.allowed) {
        let ok; try { ok = allowedValues(f.allowed, data); } catch (e) { err('a lehetséges értékek listája nem olvasható: ' + e.message); continue; }
        const b = vals.filter(x => !ok.includes(x));
        if (b.length) { err(`ismeretlen érték „${b.join(', ')}” – lehetséges: ${ok.join(', ')}`); continue; }
      }
      if (typeof nv === 'string') {
        if (max && nv.length > max) warn(`${nv.length} karakter (javasolt legfeljebb ${max}) – rövidítsd, ha lehet`);
        const lostPh = (String(cur || '').match(/\{\w+\}/g) || []).filter(ph => !nv.includes(ph));
        if (lostPh.length) { err(`a(z) ${lostPh.join(', ')} helyőrzőnek benne kell maradnia (ide kerül a szám)`); continue; }
        if (!f.url && !f.forras) {
          const newNums = numbersIn(nv).filter(x => !numbersIn(cur || '').includes(x));
          if (newNums.length) planned.newNums = (planned.newNums || []).concat([[f.col, newNums]]);
        }
        if (cur && nv.replace(/\s/g, '') === String(cur).replace(/\s/g, '')) warn('csak szóköz/sortörés változott – lehet, hogy a táblázatkezelő alakította át');
        if (/^\d{4}\.\s?\d{2}\.\s?\d{2}\.?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(nv) && !/^\d{4}\./.test(cur || '')) warn('dátumnak tűnik – lehet, hogy az Excel alakította át');
      }
      planned.push({ f, cur, v: nv });
    }
    if (!planned.length && !r.isNew) continue;
    // Soron belüli szabályok: kötelező mezők új sornál, „ha X van, Y is kell”, szám csak forrással
    const filled = k => next[k] !== undefined && next[k] !== '' && !(Array.isArray(next[k]) && !next[k].length);
    if (r.isNew) for (const f of r.t.fields) if (!f.ro && !f.opt && !filled(f.key)) errors.push(`${where} · ${f.col}: új sornál kötelező`);
    for (const [k, needs] of Object.entries(r.t.egyutt)) if (filled(k)) for (const x of [].concat(needs)) if (!filled(x)) {
      const fx = r.t.fields.find(f => f.key === x); errors.push(`${where} · ${fx ? fx.col : x}: ha a(z) „${k}” ki van töltve, ez is kell`);
    }
    for (const [col, nums] of planned.newNums || []) {
      const srcFields = r.t.fields.filter(f => f.forras);
      if (srcFields.length && !srcFields.some(f => filled(f.key))) errors.push(`${where} · ${col}: új szám (${nums.join(', ')}) forrás nélkül – töltsd ki a forrást, vagy írd szám nélkül (docs/forrasok.md)`);
      else warns.push(`${where} · ${col}: új szám a szövegben (${nums.join(', ')}) – a forrás tényleg ezt a számot mondja? (docs/forrasok.md)`);
    }
    if (r.isNew) { newRows.set(key, { r, next }); continue; }
    // Ütközés: az export óta a JSON-ban is módosították ezt a sort?
    const hv = iHash >= 0 ? (cells[iHash] || '').trim() : '';
    if (hv && hv !== rowHash(data, r, r.t) && !opt.force) {
      errors.push(`${where}: a sort az export óta a fájlban is módosították – exportálj újra, és vidd át a változtatást (vagy --force).`);
      continue;
    }
    for (const p of planned) {
      try { edits.push(planEdit(src, r, p.f, p.v)); } catch (e) { errors.push(`${where} · ${p.f.col}: ${e.message}`); continue; }
      changes.push({ where: `${r.t.type} ${r.id} · ${p.f.col}`, from: p.cur, to: p.v });
    }
  }
  // Új sorok (csak "ujSor": true típusnál) – tömbönként egyetlen beszúrás a tömb végére
  const byType = new Map();
  for (const { r, next } of newRows.values()) (byType.get(r.t) || byType.set(r.t, []).get(r.t)).push({ r, next });
  for (const [t, list] of byType) {
    try { edits.push(planNewRows(src, t, list)); } catch (e) { errors.push(`${t.type}: ${e.message}`); continue; }
    for (const { r } of list) changes.push({ where: `${t.type} ${r.id}`, from: undefined, to: '(új sor)', newRow: true });
    if (path.resolve(ROOT, g.file) === path.resolve(ROOT, cfg.forrasFajl)) for (const { r } of list) pending.add(r.id);
  }
  const missing = [...current.values()].filter(r => !seen.has(r.key));
  if (unknown.length) warns.push(`Ismeretlen sorok (nincs ilyen id vagy típus – új elemet ennél a típusnál csak fejlesztő vesz fel), kihagyva:\n      ${unknown.join('\n      ')}`);
  if (missing.length) warns.push(`A CSV-ből hiányzó sorok (a fájlban változatlanok maradnak – törölni csak fejlesztő tud): ${missing.map(r => r.t.type + ' ' + r.id).join(', ')}`);
  for (const [col, n] of Object.entries(longOld)) warns.push(`(tájékoztató) ${n} meglévő „${col}” szöveg hosszabb a javasoltnál – rövidítésre jelölt.`);
  return finish();

  function finish() {
    const rel = g.file;
    console.log(`\n── ${g.title} (${rel}) – ${changes.length} változás, ${errors.length} hiba, ${warns.length} figyelmeztetés`);
    for (const c of changes) {
      if (c.newRow) { console.log(`  + új sor: ${c.where}`); continue; }
      const kind = c.from === undefined ? '+ új mező' : c.to === undefined ? '− mező törlése' : '~';
      console.log(`  ${kind} ${c.where}\n      régi: ${c.from === undefined ? '(nincs)' : short(c.from)}\n      új:   ${c.to === undefined ? '(törölve)' : short(c.to)}`);
    }
    for (const e of errors) console.log('  ✖ HIBA: ' + e);
    for (const w of warns) console.log('  ⚠ ' + w);
    const res = { errors, warns, changes };
    if (errors.length) { console.log('  → Hiba miatt a fájl NEM változott. Javítsd a CSV-t, és futtasd újra.'); return res; }
    if (!changes.length) { console.log('  → Nincs változás, a fájl érintetlen.'); return res; }
    if (opt.dry) { console.log('  → Próbafuttatás (--dry): a fájl NEM változott.'); return res; }
    try { applyEdits(g, src, edits); } catch (e) { errors.push(e.message); console.log('  ✖ HIBA: ' + e.message); return res; }
    console.log(`  ✔ Mentve: ${rel}`);
    return res;
  }
}

// Egy mező módosítása: csere / új mező / mező törlése – csak az érintett bájtok.
function planEdit(src, row, f, v) {
  const p = fieldPath(row, f), key = p[p.length - 1];
  const parent = nodeAt(src.node, p.slice(0, -1)), n = nodeAt(src.node, p);
  const q = n && n.t === 'str' ? n.quote : n && n.t === 'arr' && n.items[0] && n.items[0].t === 'str' ? n.items[0].quote : src.quote;
  if (n && v !== undefined) return { start: n.start, end: n.end, text: encodeValue(v, q), sets: [{ path: p, value: v }] };
  if (!n && v === undefined) throw new Error('nincs mit törölni');
  if (!parent || parent.t !== 'obj') throw new Error(`Az új mező (${p.join('.')}) szülő-objektuma hiányzik – ezt fejlesztő veszi fel.`);
  const ms = parent.members, idx = ms.findIndex(m => m.key === key);
  const del = { sets: [{ path: p, value: undefined }], text: '' };
  if (n) {                                          // törlés
    if (idx > 0) return { ...del, start: ms[idx - 1].value.end, end: n.end };
    if (ms.length > 1) return { ...del, start: ms[0].keyStart, end: ms[1].keyStart };
    return { ...del, start: ms[0].keyStart, end: n.end };
  }
  // Új mező – oda, ahol a testvér-objektumokban a leggyakrabban áll (a kulcssorrend a fájl szokását követi), különben a
  // végére; a szomszédok formájában (behúzás, kulcs-idézőjel, „: ”/„:”).
  if (!ms.length) throw new Error(`Üres objektumba (${p.slice(0, -1).join('.')}) nem tudok mezőt írni – fejlesztő kell.`);
  const box = nodeAt(src.node, p.slice(0, -2));
  const sibs = !box ? [] : box.t === 'arr' ? box.items : box.t === 'obj' ? box.members.map(m => m.value) : [];
  const votes = {};
  for (const s of sibs) {
    if (s.t !== 'obj') continue;
    const k = s.members.findIndex(m => m.key === key);
    if (k > 0 && ms.some(m => m.key === s.members[k - 1].key)) votes[s.members[k - 1].key] = (votes[s.members[k - 1].key] || 0) + 1;
  }
  const best = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0];
  const ai = best ? ms.findIndex(m => m.key === best) : ms.length - 1, anchor = ms[ai];
  const prevEnd = ai > 0 ? ms[ai - 1].value.end : parent.start + 1;
  const lead = /\s*$/.exec(src.text.slice(prevEnd, anchor.keyStart).replace(/^\s*,?/, ''))[0] || ' ';
  const sepKV = src.text.slice(anchor.keyEnd, anchor.value.start);
  const kq = anchor.keyQuoted ? anchor.keyQuote : null;
  const keyText = kq ? encodeStr(key, kq) : encodeKey(key, "'", true);
  const vq = anchor.value.t === 'str' ? anchor.value.quote : (kq || src.quote);
  return { start: anchor.value.end, end: anchor.value.end, text: ',' + lead + keyText + sepKV + encodeValue(v, vq), sets: [{ path: p, value: v }] };
}

// Új sorok egy tömb végére, az utolsó elem formájában (egysoros objektum, ugyanaz a behúzás és kulcs-stílus).
function planNewRows(src, t, list) {
  const arr = nodeAt(src.node, t.arrPath);
  if (!arr || arr.t !== 'arr') throw new Error(`a(z) ${t.arrPath.join('.')} tömb nem található – fejlesztő kell`);
  const last = arr.items[arr.items.length - 1];
  const m0 = last && last.t === 'obj' && last.members[0];
  const st = m0 ? { sepKV: src.text.slice(m0.keyEnd, m0.value.start), bareKeys: !m0.keyQuoted } : src.style;
  const objs = list.map(({ r, next }) => {
    const o = { [t.idKey]: r.id };
    for (const f of t.fields) {
      if (f.ro || next[f.key] === undefined || next[f.key] === '') continue;
      let box = o; const ks = segs(f.key);
      for (const k of ks.slice(0, -1)) box = box[k] = box[k] || {};
      box[ks[ks.length - 1]] = next[f.key];
    }
    return o;
  });
  const sets = objs.map((o, i) => ({ path: [...t.arrPath, arr.items.length + i], value: o }));
  const body = objs.map(o => encodeValue(o, src.quote, st));
  if (last) {
    const prevEnd = arr.items.length > 1 ? arr.items[arr.items.length - 2].end : arr.start + 1;
    const lead = /\s*$/.exec(src.text.slice(prevEnd, last.start).replace(/^\s*,?/, ''))[0] || ' ';
    return { start: last.end, end: last.end, text: body.map(b => ',' + lead + b).join(''), sets };
  }
  const lineStart = src.text.lastIndexOf('\n', arr.start) + 1, indent = /^[ \t]*/.exec(src.text.slice(lineStart))[0];
  return { start: arr.start + 1, end: arr.end - 1, text: body.map(b => '\n' + indent + ' ' + b).join(',') + '\n' + indent, sets };
}

function applyEdits(g, src, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].end > sorted[i - 1].start) throw new Error('Egymást átfedő módosítások – fejlesztő kell.');
  let text = src.text;
  for (const e of sorted) text = text.slice(0, e.start) + e.text + text.slice(e.end);
  // Ellenőrzés írás előtt: az új fájl értelmezhető, és PONTOSAN a tervezett változásokat tartalmazza
  const expected = JSON.parse(JSON.stringify(src.data));
  for (const e of edits) for (const s of e.sets) {
    const parent = getAt(expected, s.path.slice(0, -1)), k = s.path[s.path.length - 1];
    if (s.value === undefined) delete parent[k]; else parent[k] = s.value;
  }
  let got;
  try { got = evalSource(g, text); } catch (e) { throw new Error('Az írás utáni ellenőrzés hibát talált – a fájl NEM változott. Szólj egy fejlesztőnek. (' + e.message + ')'); }
  const canon = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v));
  if (canon(got) !== canon(expected)) throw new Error('Az írás utáni ellenőrzés eltérést talált – a fájl NEM változott. Szólj egy fejlesztőnek.');
  fs.writeFileSync(src.file, text, 'utf8');
}

// ------------------------------------------------------------
//  8. Parancssor
// ------------------------------------------------------------
function usage(cfg) {
  console.log('Használat (a projekt gyökérmappájából):\n  node tools/tartalom.js export [készlet]\n' +
    '  node tools/tartalom.js import [készlet] [--dry] [--csv fájl] [--force]\n  node tools/tartalom.js lista\n' +
    (cfg ? 'Készletek: ' + Object.keys(cfg.sets).join(', ') + ' (vagy üresen / „mind”: az összes)\n' : '') + 'Útmutató: docs/tartalom-szerkesztes.md');
}
function list(cfg) {
  for (const g of Object.values(cfg.sets)) {
    console.log(`\n${g.name} – ${g.title} (${g.file}) → ${path.relative(ROOT, path.join(cfg.outDir, g.name + '.csv'))}`);
    for (const t of g.types) {
      const ed = t.fields.filter(f => !f.ro).map(f => f.col + (f.opt ? '°' : '')), ro = t.fields.filter(f => f.ro).map(f => f.col);
      console.log(`  ${t.type}: ${ed.join(', ')}${ro.length ? ' · csak olvasható: ' + ro.join(', ') : ''}${t.ujSor ? ' · új sor felvehető' : ''}`);
    }
  }
  console.log('\n(° = nem kötelező)');
}
function main() {
  const args = process.argv.slice(2), cmd = args[0];
  const flag = f => args.includes(f), csvI = args.indexOf('--csv');
  let cfg;
  try { cfg = loadConfig(); } catch (e) { if (!(e instanceof UserError)) throw e; console.error('✖ ' + e.message); process.exit(1); }
  if (cmd === 'lista') { list(cfg); return; }
  const opt = { dry: flag('--dry'), force: flag('--force'), csv: csvI > 0 && args[csvI + 1] ? path.resolve(args[csvI + 1]) : null };
  const names = args.slice(1).filter((a, i) => !a.startsWith('--') && args[i] !== '--csv');   // args[i] = az előző elem (slice(1) miatt)
  const sets = names.length && names[0] !== 'mind' ? names : Object.keys(cfg.sets);
  if (!['export', 'import'].includes(cmd) || sets.some(x => !cfg.sets[x])) {
    const bad = sets.filter(x => !cfg.sets[x]);
    if (cmd && bad.length) console.log('Ismeretlen készlet: ' + bad.join(', '));
    usage(cfg); process.exit(cmd ? 1 : 0);
  }
  if (opt.csv && sets.length !== 1) { console.error('A --csv csak egy készlettel együtt adható meg.'); process.exit(1); }
  let bad = 0; const pending = new Set();          // ugyanebben a futásban felvett új források (a forrás-mezők ellenőrzéséhez)
  for (const id of sets) {
    try {
      if (cmd === 'export') exportSet(cfg, cfg.sets[id]);
      else if (importSet(cfg, cfg.sets[id], opt, pending).errors.length) bad++;
    } catch (e) { bad++; console.error(`✖ ${id}: ${e.message}`); }
  }
  if (cmd === 'import') console.log(bad ? `\n✖ ${bad} készletnél hiba volt.` : '\n✔ Kész. Utána futtasd az ellenőrzéseket: for f in tests/check-*.js; do node $f; done');
  process.exit(bad ? 1 : 0);
}
if (require.main === module) main();
module.exports = { parseLiteral, readCsv, loadConfig, expand, splitArr };
