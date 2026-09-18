// ============================================================
//  MECHANIKA 2 – RÁCS + SZOMSZÉDSÁGI HATÁSOK: a logika (Élő kert, városrész-tervező)
//
//  Egy w × h rács; minden mezőre egy lapka (tile) kerülhet (pl. 'fa'). Az értékelés SZABÁLYOK alapján
//  számol több értéket egyszerre (pl. élőhely, víz, hő, használhatóság), és mezőnként megmondja, honnan jött
//  a hatás – ebből rajzolható a „hőtérkép”. A számok absztrakt játékértékek, nem mért adatok.
//
//  Szabályok (rules): { metric:'chebyshev' | 'manhattan', tiles:{ <típus>:{
//     base:{ elohely:2 },                                         – a lapka saját értéke a saját mezején
//     near:[{ type:'virag' | ['a','b'] | '*', radius:1, add:{ elohely:1 }, max:3 }],
//                                                                 – bónusz/büntetés a lapkának minden illő szomszéd után (max: legfeljebb ennyiszer)
//     aura:{ radius:1, add:{ ho:-1 }, self:false } } } }          – hatás a környék MINDEN mezőjére (üresre is)
//  Tiszta logika → tests/check-mech.js. Böngészőben: MechRacs.create · Node-ban: require(…).create
// ============================================================
(function(root){
  const typeOf = (t) => t == null ? null : (typeof t === 'object' ? t.type : t);
  const add = (into, vals, k = 1) => { for(const v in vals) into[v] = (into[v] || 0) + vals[v] * k; };

  function create(w, h){
    const cells = new Array(w * h).fill(null);
    const undoStack = [];
    const inside = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w && y < h;
    const get = (x, y) => inside(x, y) ? cells[y * w + x] : null;
    const set = (x, y, t, remember) => {
      if(!inside(x, y)) return false;
      const prev = cells[y * w + x];
      if(prev === t) return false;                        // nincs változás → nem kerül a visszavonásba
      if(remember) undoStack.push({ x, y, prev });
      cells[y * w + x] = t;
      return true;
    };
    // távolság: chebyshev = az átlós szomszéd is 1 (király-lépés); manhattan = csak vízszintes/függőleges lépések
    const dist = (ax, ay, bx, by, metric) => metric === 'manhattan'
      ? Math.abs(ax - bx) + Math.abs(ay - by) : Math.max(Math.abs(ax - bx), Math.abs(ay - by));

    const grid = {
      w, h, get, inside,
      place:(x, y, tile) => set(x, y, tile == null ? null : tile, true),
      remove:(x, y) => set(x, y, null, true),
      undo(){ const u = undoStack.pop(); if(!u) return null; cells[u.y * w + u.x] = u.prev; return u; },
      canUndo:() => undoStack.length > 0,
      clear(){ cells.fill(null); undoStack.length = 0; },
      // a (x, y) körüli mezők radius távolságon belül (saját maga nélkül), rácson belül: [{ x, y, d, tile }]
      neighbors(x, y, radius = 1, metric = 'chebyshev'){
        const out = [];
        for(let yy = y - radius; yy <= y + radius; yy++) for(let xx = x - radius; xx <= x + radius; xx++){
          if((xx === x && yy === y) || !inside(xx, yy)) continue;
          const d = dist(x, y, xx, yy, metric);
          if(d <= radius) out.push({ x:xx, y:yy, d, tile:get(xx, yy) });
        }
        return out;
      },
      count:(type) => cells.filter(t => t != null && (type == null || typeOf(t) === type)).length,
      toJSON:() => ({ w, h, cells:cells.slice() }),
      load(d){ if(d && d.cells && d.cells.length === cells.length){ d.cells.forEach((t, i) => { cells[i] = t; }); undoStack.length = 0; } return grid; },

      // ÉRTÉKELÉS → { totals:{ érték:szám }, cells:[{ x, y, tile, values:{…}, parts:[{ kind, from:{x,y}, add:{…} }] }], cell(x,y) }
      evaluate(rules = {}){
        const metric = rules.metric || 'chebyshev', R = rules.tiles || {};
        const res = [];
        for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) res.push({ x, y, tile:get(x, y), values:{}, parts:[] });
        const at = (x, y) => res[y * w + x];
        const push = (c, kind, from, vals, k = 1) => {
          if(!vals || !k) return;
          const a = {}; add(a, vals, k); add(c.values, a); c.parts.push({ kind, from, add:a });
        };
        for(const c of res){
          const rule = R[typeOf(c.tile)]; if(!rule) continue;
          const me = { x:c.x, y:c.y };
          push(c, 'base', me, rule.base);
          for(const n of [].concat(rule.near || [])){
            const types = n.type === '*' ? null : [].concat(n.type);
            let k = grid.neighbors(c.x, c.y, n.radius || 1, metric)
              .filter(o => o.tile != null && (!types || types.includes(typeOf(o.tile)))).length;
            if(n.max != null) k = Math.min(k, n.max);
            push(c, 'near', me, n.add, k);
          }
          if(rule.aura){
            const targets = grid.neighbors(c.x, c.y, rule.aura.radius || 1, metric);
            if(rule.aura.self) targets.push({ x:c.x, y:c.y });
            for(const t of targets) push(at(t.x, t.y), 'aura', me, rule.aura.add);
          }
        }
        const totals = {};
        for(const v of rules.values || []) totals[v] = 0;
        for(const c of res) add(totals, c.values);
        return { totals, cells:res, cell:(x, y) => inside(x, y) ? at(x, y) : null };
      },
    };
    return grid;
  }

  const api = { create, typeOf };
  if(typeof module !== 'undefined' && module.exports){ module.exports = api; return; }
  root.MechRacs = Object.assign(root.MechRacs || {}, api);
})(typeof window !== 'undefined' ? window : globalThis);
