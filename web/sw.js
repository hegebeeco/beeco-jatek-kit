// ============================================================
//  SERVICE WORKER – offline mód (rendezvény, kioszk: ha leesik a Wi-Fi, a játék megy tovább)
//
//  A service worker egy háttérben futó szkript, amit a böngésző az oldal és a hálózat közé tesz: minden kérést
//  (fájlt) elkap, és eldönti, a hálózatról vagy a saját tárából (Cache Storage) adja-e. Első betöltéskor
//  letölti a TELJES játékgyűjteményt (web/sw-files.json listája), így egyszeri betöltés után mind a hat játék
//  internet nélkül is indul – nem csak az, amelyiket megnyitották.
//
//  Stratégiák:
//   • HTML és *.json (tartalom)   → hálózat előbb (4 mp türelem), ha nincs net: a tárolt példány
//   • JS, CSS, képek, betűk, assets → tárból azonnal, a háttérben frissítve („stale-while-revalidate”)
//   • Three.js és QR-könyvtár (cdnjs) → tárból (verziószámos URL, sosem változik)
//   • Supabase (ranglista), POST és minden más külső kérés → SOSEM tároljuk, a SW nem nyúl hozzá
//
//  A VERSION sort a tools/sw-lista.js írja (ne kézzel!) – bármely fájl változásakor új verzió = új tár;
//  telepítéskor csak a ténylegesen megváltozott fájlokat tölti le újra (a többit átmásolja a régi tárból).
//  Leírás: docs/offline-es-ci.md
// ============================================================
const VERSION = '1e1eeb193609'; // a tools/sw-lista.js írja
const PREFIX = 'beeco-';
const CACHE = PREFIX + VERSION;
const META = new URL('__beeco-meta', self.location).href;          // a tár „adatlapja”: melyik fájl milyen hash-sel van benne
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
];
const NET_TIMEOUT = 4000;   // ms – „van Wi-Fi, de nincs internet” esetén se várjon a végtelenségig
const PARALLEL = 6;         // egyszerre ennyi fájlt tölt le telepítéskor

// Egységes tár-kulcs: a lekérdezés (?kioszk=rezsi) nem számít, a „/” = „/index.html”
function keyOf(u){
  const url = new URL(u, self.location);
  url.search = ''; url.hash = '';
  if(url.pathname.endsWith('/')) url.pathname += 'index.html';
  return url.href;
}

// Átirányított választ (pl. Netlify „szép URL”) a böngésző nem enged navigációra – ezért „tisztán” tároljuk
async function store(cache, key, res){
  if(res.redirected) res = new Response(await res.blob(), { status:res.status, statusText:res.statusText, headers:res.headers });
  return cache.put(key, res);
}
const cacheable = res => res && res.ok && (res.type === 'basic' || res.type === 'cors' || res.type === 'default');

// ---------- Telepítés: a teljes lista letöltése ----------
self.addEventListener('install', event => {
  self.skipWaiting();                                               // az új verzió azonnal átveszi a helyet (lásd offline.js)
  event.waitUntil(precache());
});

async function precache(){
  const man = await (await fetch('sw-files.json', { cache:'no-store' })).json();
  const cache = await caches.open(CACHE);
  // korábbi tárak (és adatlapjuk) – a változatlan fájlokat innen másoljuk, nem töltjük le újra
  const olds = [];
  for(const name of await caches.keys()){
    if(!name.startsWith(PREFIX) || name === CACHE) continue;
    const c = await caches.open(name), m = await c.match(META);
    olds.push({ c, files: m ? ((await m.json()).files || {}) : {} });
  }
  const jobs = Object.keys(man.files).map(f => async () => {
    const key = keyOf(f);
    for(const o of olds) if(o.files[f] === man.files[f]){ const hit = await o.c.match(key, { ignoreVary:true }); if(hit){ await cache.put(key, hit); return true; } }
    try{
      // az index.html-t mappaként kérjük („./”), hogy a Netlify ne irányítson át
      const res = await fetch(new Request(f === 'index.html' ? './' : f, { cache:'no-cache' }));
      if(cacheable(res)){ await store(cache, key, res); return true; }
    }catch(e){}
    for(const o of olds){ const hit = await o.c.match(key, { ignoreVary:true }); if(hit){ await cache.put(key, hit); break; } }  // inkább régi, mint semmi
    return false;
  });
  for(const url of CDN) jobs.push(async () => {
    for(const o of olds){ const hit = await o.c.match(url, { ignoreVary:true }); if(hit){ await cache.put(url, hit); return true; } }
    try{ const res = await fetch(url, { mode:'cors', credentials:'omit' }); if(res.ok){ await cache.put(url, res); return true; } }catch(e){}
    return false;
  });
  let failed = 0, next = 0;
  const worker = async () => { while(next < jobs.length){ const job = jobs[next++]; if(!(await job())) failed++; } };
  await Promise.all(Array.from({ length:PARALLEL }, worker));
  // részleges siker is jobb a semminél: a hiányzó fájlok használat közben kerülnek a tárba
  await cache.put(META, new Response(JSON.stringify({ version:VERSION, files:man.files, failed, complete: failed === 0, at: Date.now() }),
    { headers:{ 'Content-Type':'application/json' } }));
}

// ---------- Aktiválás: régi tárak törlése, a nyitott oldalak átvétele ----------
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for(const name of await caches.keys()) if(name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

// ---------- Állapot-lekérdezés az oldalról (offline.js) ----------
self.addEventListener('message', event => {
  if(!event.data || event.data.type !== 'beeco-status' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const m = await (await caches.open(CACHE)).match(META);
    const meta = m ? await m.json() : {};
    event.ports[0].postMessage({ version:VERSION, complete:!!meta.complete, failed:meta.failed ?? null });
  })());
});

// ---------- Kérések ----------
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET' || req.headers.has('range')) return;       // POST (ranglista-beküldés) és részleges letöltés: nem tároljuk
  const url = new URL(req.url);
  if(url.hostname.endsWith('.supabase.co')) return;                   // ranglista: mindig élő
  if(url.origin === self.location.origin){
    if(/\/(sw\.js|sw-files\.json)$/.test(url.pathname) || url.pathname.endsWith('/__beeco-meta')) return;
    const key = keyOf(url);
    if(req.mode === 'navigate' || /\.(html|json)$/.test(key)) event.respondWith(networkFirst(req, key));
    else event.respondWith(staleWhileRevalidate(event, req, key));
    return;
  }
  if(CDN.includes(url.href)) event.respondWith(fromCdn(req, url.href));
  // minden más külső kérés: a böngészőre bízzuk
});

// hálózat előbb, türelmi idővel; ha nincs net (vagy lassú), a tárolt példány
async function networkFirst(req, key){
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(async res => { if(cacheable(res)) await store(cache, key, res.clone()); return res; });
  net.catch(() => {});                                                 // ha a tár nyer, a hálózati hiba ne legyen „kezeletlen”
  const timeout = new Promise(r => setTimeout(() => r(null), NET_TIMEOUT));
  try{
    const res = await Promise.race([net, timeout]);
    if(res) return res;
  }catch(e){}
  const hit = await cache.match(key, { ignoreVary:true }) || (req.mode === 'navigate' ? await cache.match(keyOf('./'), { ignoreVary:true }) : null);
  return hit || net;                                                   // nincs tárolt példány: marad a (lassú vagy hibás) hálózat
}

// tárból azonnal, a háttérben frissítve
async function staleWhileRevalidate(event, req, key){
  const cache = await caches.open(CACHE);
  const hit = await cache.match(key, { ignoreVary:true });
  const net = fetch(req).then(async res => { if(cacheable(res)) await store(cache, key, res.clone()); return res; });
  if(hit){ event.waitUntil(net.catch(() => {})); return hit; }
  return net;
}

// cdnjs: verziószámos, változatlan fájl → tárból; CORS-os választ tárolunk, mert az a sima <script> és az
// integrity + crossOrigin='anonymous' betöltésnek (QR-könyvtár) is megfelel
async function fromCdn(req, url){
  const cache = await caches.open(CACHE);
  const hit = await cache.match(url, { ignoreVary:true });
  if(hit) return hit;
  let res;
  try{ res = await fetch(url, { mode:'cors', credentials:'omit' }); }catch(e){ return fetch(req); }   // CORS gond: az eredeti kérés, tárolás nélkül
  if(res.ok) await cache.put(url, res.clone());
  return res;
}
