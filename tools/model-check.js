// ============================================================
//  3D-modell (GLB) ellenőrzése a játék kerete szerint — node tools/model-check.js <fájl.glb | mappa> [--hos]
//
//  Mit néz? háromszög- és csúcsszám, anyagok, textúrák száma és mérete, fájlméret, befoglaló méret (arány),
//  és hogy kell-e hozzá külön dekóder (Draco, meshopt). Függőség nélkül olvassa a GLB-t (fejléc + JSON + bináris rész).
//
//  A KERET a mi döntésünk (mobilon 30 fps, csalogató oldal gyors betöltése) – nem külső szabvány; ha változik,
//  a docs/promptolas.md 3D részét is frissítsd. --hos: „főszereplő” tárgy (pl. kuka a kert közepén) lazább kerettel.
// ============================================================
const fs = require('fs'), path = require('path');

const BUDGET = {
  normal: { tris:5000, textures:2, texSize:1024, materials:8, kb:400 },
  hos:    { tris:12000, textures:3, texSize:1024, materials:12, kb:900 },
};
// ezekhez a Three.js r128 GLTFLoader külön dekódert kér → kerüljük (a kép → 3D eszköz exportjában kapcsold ki)
const NEEDS_DECODER = { KHR_draco_mesh_compression:'Draco-dekóder', EXT_meshopt_compression:'meshopt-dekóder', KHR_texture_basisu:'KTX2/Basis-dekóder' };

function readGlb(file){
  const buf = fs.readFileSync(file);
  if(buf.toString('utf8', 0, 4) !== 'glTF') throw new Error('nem GLB (hiányzik a „glTF” fejléc) – .gltf esetén exportáld .glb-be');
  const version = buf.readUInt32LE(4); if(version !== 2) throw new Error('csak glTF 2.0 támogatott, ez: ' + version);
  let off = 12, json = null, bin = null;
  while(off < buf.length){
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4), data = buf.subarray(off + 8, off + 8 + len);
    if(type === 0x4E4F534A) json = JSON.parse(data.toString('utf8')); else if(type === 0x004E4942) bin = data;
    off += 8 + len;
  }
  if(!json) throw new Error('hiányzik a JSON-rész');
  return { json, bin, size:buf.length };
}

// kép mérete a fejlécből (PNG: IHDR, JPEG: SOF-marker)
function imageSize(b){
  if(!b || b.length < 24) return null;
  if(b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if(b[0] === 0xFF && b[1] === 0xD8){
    let i = 2;
    while(i < b.length - 9){
      if(b[i] !== 0xFF){ i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if(m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  return null;
}

function check(file, hos){
  const B = hos ? BUDGET.hos : BUDGET.normal, { json, bin, size } = readGlb(file), A = json.accessors || [], problems = [], notes = [];
  let tris = 0, verts = 0, min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for(const mesh of json.meshes || []) for(const p of mesh.primitives || []){
    const pos = A[p.attributes && p.attributes.POSITION]; if(!pos) continue;
    verts += pos.count;
    const mode = p.mode == null ? 4 : p.mode;
    if(mode === 4) tris += (p.indices != null ? A[p.indices].count : pos.count) / 3;
    else if(mode === 5 || mode === 6) tris += (p.indices != null ? A[p.indices].count : pos.count) - 2;
    if(pos.min && pos.max) for(let k = 0; k < 3; k++){ min[k] = Math.min(min[k], pos.min[k]); max[k] = Math.max(max[k], pos.max[k]); }
  }
  const used = [...(json.extensionsUsed || []), ...(json.extensionsRequired || [])];
  for(const e of new Set(used)) if(NEEDS_DECODER[e]) problems.push(`${NEEDS_DECODER[e]} kellene hozzá (${e}) – exportáld tömörítés nélkül`);
  const images = (json.images || []).map(img => {
    if(img.uri && !img.uri.startsWith('data:')) return { ext:true, uri:img.uri };
    const bv = img.bufferView != null && json.bufferViews[img.bufferView];
    const data = bv && bin ? bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength) : null;
    return { size:imageSize(data), bytes:data ? data.length : 0, mime:img.mimeType };
  });
  if(images.some(i => i.ext)) problems.push('külső textúra-fájlra hivatkozik – exportáld egyetlen .glb-be (beágyazott képekkel)');
  const big = images.filter(i => i.size && Math.max(...i.size) > B.texSize);
  if(tris > B.tris) problems.push(`sok háromszög: ${Math.round(tris)} (keret: ${B.tris}) – kérj „low poly”-t, vagy csökkentsd (remesh / decimate)`);
  if(images.length > B.textures) problems.push(`sok textúra: ${images.length} (keret: ${B.textures})`);
  if(big.length) problems.push(`túl nagy textúra: ${big.map(i => i.size.join('×')).join(', ')} (keret: ${B.texSize} px)`);
  if((json.materials || []).length > B.materials) problems.push(`sok anyag: ${json.materials.length} (keret: ${B.materials})`);
  if(size / 1024 > B.kb) problems.push(`nagy fájl: ${Math.round(size / 1024)} KB (keret: ${B.kb} KB)`);
  const dim = max.map((v, k) => v - min[k]);
  if(dim.every(isFinite)){
    notes.push(`méret: ${dim.map(v => v.toFixed(2)).join(' × ')} (x × y × z)`);
    if(min[1] < -0.05 * dim[1]) notes.push('a talppontja nem y = 0-n áll (a játék a betöltéskor igazítja, de szebb, ha a modellben is ott van)');
  }
  const texTxt = images.length ? images.map(i => i.size ? `${i.size.join('×')} ${i.mime || ''}`.trim() : '?').join(', ') : 'nincs (csúcsszínek / sima színek)';
  return { file, ok:!problems.length, lines:[`${Math.round(tris)} háromszög · ${verts} csúcs · ${(json.materials || []).length} anyag · textúra: ${texTxt} · ${Math.round(size / 1024)} KB`, ...notes], problems };
}

const args = process.argv.slice(2), hos = args.includes('--hos'), target = args.find(a => !a.startsWith('--'));
if(!target){ console.log('Használat: node tools/model-check.js <fájl.glb | mappa> [--hos]'); process.exit(1); }
const files = fs.statSync(target).isDirectory() ? fs.readdirSync(target).filter(f => /\.glb$/i.test(f)).map(f => path.join(target, f)) : [target];
let bad = 0;
for(const f of files){
  try{
    const r = check(f, hos);
    console.log(`${r.ok ? '✓' : '✗'} ${path.basename(f)}`); r.lines.forEach(l => console.log('   ' + l)); r.problems.forEach(p => console.log('   ⚠ ' + p));
    if(!r.ok) bad++;
  }catch(e){ console.log(`✗ ${path.basename(f)}: ${e.message}`); bad++; }
}
console.log(`\n${files.length - bad}/${files.length} modell fér bele a keretbe${hos ? ' (főszereplő)' : ''}.`);
process.exit(bad ? 1 : 0);
