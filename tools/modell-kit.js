// ============================================================
//  3D-modell készlet Node-ban: a web/js/art/model-kit.js (ugyanaz a kód fut a játékban) + GLB-mentés
//  Mérce (B szint): docs/rajzolas.md · megtekintés: tools/modell-nezo.html · ellenőrzés: node tools/model-check.js
//
//  const G = require('<repo>/tools/modell-kit.js'); const m = G.model();
//  m.add(G.chamferBox(w,h,d,c), { color:'steel:1', t:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz] }) … m.save('x.glb') → { tris, materials, bytes }
//  koordináták: Y fel, +Z = eleje, a mentésnél a talp y = 0-ra kerül
// ============================================================
const fs = require('fs'), path = require('path');
const MODEL = require(path.join(__dirname, '../web/js/art/model-kit.js'));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
// sRGB → lineáris (a glTF alapszíne lineáris)
const toLinear = c => { const hex = MODEL.hexOf(c); return [16, 8, 0].map(sh => { const v = (hex >> sh & 255) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); };

function model(){
  const m = MODEL.model();
  m.save = file => {
    const views = [], acc = [], meshes = [], mats = [], bins = []; let off = 0, minY = Infinity;
    for(const g of m.groups().values()) for(const tri of g) for(const p of tri) minY = Math.min(minY, p[1]);
    [...m.groups().entries()].forEach(([color, tris], i) => {
      const P = [], N = [];
      for(const tri of tris){ const n = norm(cross(sub(tri[1], tri[0]), sub(tri[2], tri[0]))); for(const p of tri){ P.push(p[0], p[1] - minY, p[2]); N.push(...n); } }
      const pb = Buffer.from(new Float32Array(P).buffer), nb = Buffer.from(new Float32Array(N).buffer);
      const mn = [0, 1, 2].map(k => Math.min(...P.filter((_, j) => j % 3 === k))), mx = [0, 1, 2].map(k => Math.max(...P.filter((_, j) => j % 3 === k)));
      views.push({ buffer:0, byteOffset:off, byteLength:pb.length }); off += pb.length; bins.push(pb);
      views.push({ buffer:0, byteOffset:off, byteLength:nb.length }); off += nb.length; bins.push(nb);
      acc.push({ bufferView:views.length - 2, componentType:5126, count:P.length / 3, type:'VEC3', min:mn, max:mx }, { bufferView:views.length - 1, componentType:5126, count:N.length / 3, type:'VEC3' });
      mats.push({ name:color, pbrMetallicRoughness:{ baseColorFactor:[...toLinear(color), 1], metallicFactor:0, roughnessFactor:0.9 } });
      meshes.push({ primitives:[{ attributes:{ POSITION:acc.length - 2, NORMAL:acc.length - 1 }, material:i }] });
    });
    const bin = Buffer.concat(bins);
    const json = { asset:{ version:'2.0', generator:'beeco model-kit' }, scene:0, scenes:[{ nodes:meshes.map((_, i) => i) }], nodes:meshes.map((_, i) => ({ mesh:i })), meshes, materials:mats, accessors:acc, bufferViews:views, buffers:[{ byteLength:bin.length }] };
    const pad = (b, c) => Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4, c)]), j = pad(Buffer.from(JSON.stringify(json)), 0x20), bb = pad(bin, 0);
    const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + bb.length, 8);
    const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
    const out = Buffer.concat([head, ch(j.length, 0x4E4F534A), j, ch(bb.length, 0x004E4942), bb]);
    fs.writeFileSync(file, out);
    return { ...m.stats(), bytes:out.length };
  };
  return m;
}
module.exports = Object.assign({}, MODEL, { model, toLinear });
