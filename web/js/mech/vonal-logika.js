// ============================================================
//  MECHANIKA 3 – PONTOK ÖSSZEKÖTÉSE: a logika (Beporzó hálózat, zöldfolyosók, közlekedési háló)
//
//  Pontok (nodes: { id, x, y, type }) és a köztük húzott kapcsolatok (élek). Korlátok: legnagyobb távolság
//  (maxDist), összes kapcsolat (maxLinks), pontonkénti kapcsolat (maxDegree), és egy saját szabály (allow).
//  Gráf-mérőszámok: összefüggő részek (components), elszigetelt pontok (isolated), KRITIKUS pontok
//  (articulationPoints – ha kiesnek, a háló szétszakad), kritikus kapcsolatok (bridges), legrövidebb út (shortestPath).
//  „Zavarás” (kaszálás, építkezés): remove(pont vagy kapcsolat). Tiszta logika → tests/check-mech.js.
// ============================================================
(function(root){
  const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;

  function create(o = {}){
    const nodes = new Map((o.nodes || []).map(n => [n.id, Object.assign({}, n)]));
    const edges = new Map();                               // kulcs 'a|b' → [a, b]
    const lim = { maxDist:o.maxDist ?? Infinity, maxLinks:o.maxLinks ?? Infinity, maxDegree:o.maxDegree ?? Infinity };
    const nb = (id) => { const out = []; for(const [a, b] of edges.values()){ if(a === id) out.push(b); else if(b === id) out.push(a); } return out; };
    const dist = (a, b) => { const p = nodes.get(a), q = nodes.get(b); return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : Infinity; };

    const g = {
      limits:lim, dist, neighbors:nb,
      nodes:() => [...nodes.values()],
      node:(id) => nodes.get(id) || null,
      edges:() => [...edges.values()].map(e => e.slice()),
      has:(a, b) => edges.has(key(a, b)),
      degree:(id) => nb(id).length,
      // összeköthető-e? → { ok, reason }  reason: ugyanaz · nincs · megvan · tavol · keret · fok · szabaly
      canConnect(a, b){
        if(a === b) return { ok:false, reason:'ugyanaz' };
        if(!nodes.has(a) || !nodes.has(b)) return { ok:false, reason:'nincs' };
        if(edges.has(key(a, b))) return { ok:false, reason:'megvan' };
        if(dist(a, b) > lim.maxDist + 1e-9) return { ok:false, reason:'tavol' };
        if(edges.size >= lim.maxLinks) return { ok:false, reason:'keret' };
        if(nb(a).length >= lim.maxDegree || nb(b).length >= lim.maxDegree) return { ok:false, reason:'fok' };
        if(o.allow && !o.allow(nodes.get(a), nodes.get(b))) return { ok:false, reason:'szabaly' };
        return { ok:true, reason:null };
      },
      connect(a, b){ const r = g.canConnect(a, b); if(r.ok) edges.set(key(a, b), a < b ? [a, b] : [b, a]); return r; },
      disconnect:(a, b) => edges.delete(key(a, b)),
      // zavarás: remove('id') → a pont a kapcsolataival együtt kiesik · remove(['a','b']) vagy remove({a,b}) → egy kapcsolat
      remove(t){
        if(Array.isArray(t)) return g.disconnect(t[0], t[1]) ? { edges:[t.slice()] } : null;
        if(t && typeof t === 'object') return g.disconnect(t.a, t.b) ? { edges:[[t.a, t.b]] } : null;
        const n = nodes.get(t); if(!n) return null;
        const gone = nb(t).map(x => { edges.delete(key(t, x)); return [t, x]; });
        nodes.delete(t);
        return { node:n, edges:gone };
      },
      // összefüggő részek, a legnagyobb elöl: [['a','b'], ['c']]
      components(){
        const seen = new Set(), out = [];
        for(const id of nodes.keys()){
          if(seen.has(id)) continue;
          const part = [], stack = [id]; seen.add(id);
          while(stack.length){ const v = stack.pop(); part.push(v); for(const w of nb(v)) if(!seen.has(w)){ seen.add(w); stack.push(w); } }
          out.push(part);
        }
        return out.sort((p, q) => q.length - p.length);
      },
      isolated:() => [...nodes.keys()].filter(id => nb(id).length === 0),
      // Tarjan-algoritmus: „mikor jutok vissza egy korábbi pontra kerülőúton?” – ha egy ág nem jut vissza, a pont / él kritikus
      articulationPoints:() => tarjan().points,
      bridges:() => tarjan().bridges,
      // legrövidebb út LÉPÉSEKBEN (szélességi keresés) → { hops, length (a vonalak összhossza), path } | null
      shortestPath(a, b){
        if(!nodes.has(a) || !nodes.has(b)) return null;
        const prev = new Map([[a, null]]), q = [a];
        while(q.length){ const v = q.shift(); if(v === b) break; for(const w of nb(v)) if(!prev.has(w)){ prev.set(w, v); q.push(w); } }
        if(!prev.has(b)) return null;
        const path = []; for(let v = b; v != null; v = prev.get(v)) path.unshift(v);
        let length = 0; for(let i = 1; i < path.length; i++) length += dist(path[i - 1], path[i]);
        return { hops:path.length - 1, length, path };
      },
      metrics(){
        const comps = g.components(), t = tarjan();
        return { nodes:nodes.size, links:edges.size, maxLinks:lim.maxLinks, components:comps.length,
          largest:comps.length ? comps[0].length : 0, isolated:g.isolated(), critical:t.points, bridges:t.bridges };
      },
    };

    function tarjan(){
      const disc = new Map(), low = new Map(), points = new Set(), bridges = [];
      let time = 0;
      const dfs = (u, parent) => {
        disc.set(u, time); low.set(u, time); time++;
        let children = 0;
        for(const v of nb(u)){
          if(!disc.has(v)){
            children++; dfs(v, u);
            low.set(u, Math.min(low.get(u), low.get(v)));
            if(parent !== null && low.get(v) >= disc.get(u)) points.add(u);
            if(low.get(v) > disc.get(u)) bridges.push(u < v ? [u, v] : [v, u]);
          } else if(v !== parent) low.set(u, Math.min(low.get(u), disc.get(v)));
        }
        if(parent === null && children > 1) points.add(u);
      };
      for(const id of nodes.keys()) if(!disc.has(id)) dfs(id, null);
      return { points:[...points], bridges };
    }
    return g;
  }

  const api = { create };
  if(typeof module !== 'undefined' && module.exports){ module.exports = api; return; }
  root.MechVonal = Object.assign(root.MechVonal || {}, api);
})(typeof window !== 'undefined' ? window : globalThis);
