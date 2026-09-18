// ============================================================
//  Kép- és 3D-generátor promptok minden matricához — node tools/art-prompts.js
//  Kimenet: docs/illusztracio-promptok.csv (2D) és docs/modell-promptok.csv (3D) – Excelben is ékezethelyesen nyílik
//
//  Egy prompt négy rétegből áll (útmutató: docs/promptolas.md):
//   1. TÁRGY      – a matrica angol neve (en) + a kötelezően látszó jellemzők (look, ha van)
//   2. SZÍNEK     – automatikusan a kódmatrica anyagaiból (így a kép a játékban lévő matricához illik)
//   3. KOMPOZÍCIÓ – egy tárgy, középen, a kép ~90%-a, enyhe 3/4-es nézet
//   4. STÍLUS + TILTÁSOK – a beeco eredeti matricáiból MÉRVE (web/assets/items, 62 kép):
//      fehér perem ≈ a képszélesség 3%-a, tömör olívazöld árnyék (≈ #5A6337) elmosás nélkül, ≈ 2,7% jobbra és 2,3% le.
//  A kész PNG-ket a „Fájlnév” oszlop szerint kell elnevezni, majd: python3 tools/art-import.py <png-mappa>
// ============================================================
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), ART_DIR = path.join(ROOT, 'web/js/art');
const ART = require(path.join(ART_DIR, 'art.js'));
global.ART = ART;

// ---- a stílus EGY helyen – ha változik, a docs/promptolas.md is frissüljön ----
const STYLE = 'Flat vector sticker illustration in a faceted low-poly style: every surface is split into a few flat planes '
  + 'with 3 to 4 hard-edged tones and no gradients, light from the top left, small flat white highlight shapes. '
  + 'A thin outline in a darker shade of each color (never black). A thick white die-cut border around the whole silhouette, '
  + 'about 3% of the image width. A solid olive-green (#5A6337) drop shadow behind the white border, offset slightly to the '
  + 'lower right (about 2.5% of the image), with no blur. Friendly, slightly saturated real-world colors, never neon.';
const COMPOSITION = 'Exactly one object, shown in a slight three-quarter view (it may be tilted up to about 25 degrees), '
  + 'centered and filling about 90% of a square canvas. Transparent background, nothing else in the image.';
const AVOID = ['text', 'letters', 'numbers', 'logos', 'brand names', 'labels with writing', 'watermark', 'background or scene',
  'floor or ground plane', 'extra objects', 'hands', 'faces', 'photorealism', '3D render look', 'gradients', 'black outlines',
  'soft or blurry shadow'];
// 3D (szöveg→3D és kép→3D) – a gyártói tanácsok szerint (Meshy: fontos szavak elöl, „game-ready, clean edges, minimal
// geometry”, egy tárgy, ≤800 karakter; Tripo: „Low-poly game asset of …” sablon, negatív prompt ≤255 karakter)
const STYLE_3D = 'Game-ready stylized low-poly model: flat shading with a cel-shaded look, clean edges, minimal geometry, '
  + 'solid matte colors without fine texture noise, slightly chunky friendly proportions. Single object, front-facing, centered, '
  + 'standing on its own base.';
const AVOID_3D = 'background elements, ground plane, pedestal, floating particles, smoke, sparkles, text, labels, logos, extra objects';

// anyag → színnév (a képgenerátorok a színnevet jobban értik, mint a hex kódot)
const COLOR = { honey:'honey yellow', gold:'golden yellow', leaf:'leaf green', grass:'fresh grass green', sage:'pale sage green',
  teal:'teal', sky:'light sky blue', water:'water blue', glass:'clear pale-blue glass', blue:'medium blue', red:'red', tomato:'tomato red',
  orange:'orange', ember:'deep orange', pink:'pink', blossom:'soft pink', berry:'berry red', purple:'lavender purple', paper:'white',
  cream:'cream', white:'white', cardboard:'cardboard brown', wood:'warm wood brown', soil:'soil brown', chocolate:'chocolate brown',
  skin:'peach', steel:'light steel grey', dark:'dark charcoal grey' };

// az alakzat közelítő területe (a takarást nem számoljuk – a fő színekhez elég)
function area(s){
  switch(s.t){
    case 'rect': return s.w * s.h;
    case 'circle': return Math.PI * s.r * s.r;
    case 'ellipse': return Math.PI * s.rx * s.ry;
    case 'poly': return Math.abs(s.pts.reduce((a, p, i) => { const q = s.pts[(i + 1) % s.pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    case 'path': { const b = ART.bbox(s); return b[2] * b[3] * 0.7; }
  }
  return 0;
}
function mainColors(A){
  const w = {};
  for(const s of A.shapes){ if(s.d || s.t === 'line' || s.t === 'shine' || !ART.MAT[s.m]) continue; w[s.m] = (w[s.m] || 0) + area(s); }
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const names = Object.entries(w).sort((a, b) => b[1] - a[1]).filter(([, v]) => v / total >= 0.1).slice(0, 3).map(([m]) => COLOR[m] || m);
  return [...new Set(names)];
}
// a tiltás ne ütközzön magával a tárggyal (hüvelykujj, állatok, fűcsomón heverő szemét)
const avoidFor = (en) => AVOID.filter(a => !(a === 'hands' && /hand|thumb|finger/i.test(en))
  && !(a === 'faces' && /frog|rabbit|chicken|hen|fish|turtle|bat\b|butterfly|worm|bee|brain/i.test(en))
  && !(a === 'floor or ground plane' && /grass|ground|hill|patch|pile|soil|mound/i.test(en)));
const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

const LIB_HU = { nature:'Természet, energia, jelek', home:'Otthon', office:'Iroda, technika', food:'Ételek, italok',
  huto:'Hűtő-mester ételei', 'huto-kamra':'Hűtő-mester ételei (kamra, zöldség)', things:'Ruha, közlekedés, díjak', waste:'Szelektálj! hulladékok (papír, műanyag-fém, üveg)', 'waste-b':'Szelektálj! hulladékok (kommunális, bio, olaj)', 'waste-special':'Szelektálj! különleges hulladékok', 'waste-special-b':'Szelektálj! e-hulladék, gyógyszer, zöldhulladék', pecset:'Greenwashing öko-pecsét keretek', gw:'Greenwashing termékek', 'gw-b':'Greenwashing termékek (2)', 'gw-c':'Greenwashing termékek (3)', 'gw-d':'Greenwashing termékek (4)', imp:'Mi van mögötte? termékei',
  devices:'Háztartási gépek, mérőórák', extra:'Célzott és egyéb matricák' };
const rows = [], rows3d = [];
for(const f of fs.readdirSync(ART_DIR).filter(f => /^art-.+\.js$/.test(f)).sort()){
  const before = new Set(ART.names());
  require(path.join(ART_DIR, f));
  const lib = f.replace(/^art-|\.js$/g, '');
  for(const n of ART.names().filter(n => !before.has(n))){
    const A = ART.LIB[n], colors = mainColors(A);
    const subject = `${A.en}${A.look ? ', ' + A.look : ''}`;
    const colorTxt = colors.length ? `Main colors: ${list(colors)}.` : '';
    const avoid = avoidFor(subject);
    const prompt = `Subject: ${subject}. ${colorTxt} ${COMPOSITION} Style: ${STYLE} Do not include: ${avoid.join(', ')}.`.replace(/\s+/g, ' ');
    const styleShort = `flat faceted low-poly vector sticker, hard-edged flat shading, light from top left, `
      + `thick white die-cut border, solid olive green offset drop shadow lower right, single centered object`;
    const short = `${subject}, ${colors.join(', ')}, ${styleShort}, transparent background`;
    // Midjourney: nem tud átlátszó hátteret → sima világos háttér, utána az Editorban „Erase Background”;
    // kizárás --no-val (rövid lista), stílus --sref-fel (a stílus-referencia képe) – docs/promptolas.md 5. pont
    const mj = `${subject}, ${colors.join(', ')}, ${styleShort}, plain light grey background `
      + `--ar 1:1 --no text, letters, numbers, logo, watermark, gradient, scenery --sref STILUS_KEP`;
    rows.push([LIB_HU[lib] || lib, A.hu, (A.emoji || []).join(' '), `${n}.png`, prompt, short, mj, avoid.join(', ')]);
    const p3d = `Low-poly game asset: ${subject}. ${colors.length ? `Colors: ${list(colors)}.` : ''} ${STYLE_3D} No ${AVOID_3D}.`.replace(/\s+/g, ' ');
    if(p3d.length > 800) console.log(`⚠ ${n}: a 3D prompt ${p3d.length} karakter (a Meshy legfeljebb 800-at fogad)`);
    rows3d.push([LIB_HU[lib] || lib, A.hu, `${n}.glb`, `vazlat/${n}.png`, p3d, AVOID_3D]);
  }
}
const q = v => `"${String(v).replace(/"/g, '""')}"`;
const writeCsv = (file, head, data) => {
  fs.writeFileSync(path.join(ROOT, file), '﻿' + [head, ...data].map(r => r.map(q).join(',')).join('\r\n') + '\r\n');
  console.log(`${data.length} sor → ${file}`);
};
writeCsv('docs/illusztracio-promptok.csv', ['Csoport', 'Magyar név', 'Emoji', 'Fájlnév (mentsd így)',
  'Teljes prompt (ChatGPT / OpenAI, Gemini – csatold: docs/promptolas/stilus-referencia.jpg)',
  'Rövid prompt (Recraft, Ideogram, Firefly – stílus-referenciával)',
  'Midjourney (STILUS_KEP helyére a stílus-referencia; utána Erase Background)', 'Tiltások (negatív mezőbe: Recraft, Ideogram)'], rows);
writeCsv('docs/modell-promptok.csv', ['Csoport', 'Magyar név', 'Fájlnév (mentsd így)',
  'Kép→3D bemenet (node tools/art-png.js <mappa>/vazlat --flat)', '3D prompt (szöveg→3D, vagy a kép mellé)',
  '3D tiltások (Tripo negative_prompt)'], rows3d);
