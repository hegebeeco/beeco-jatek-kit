// ============================================================
//  SMOKE-TESZT – „elindul-e mind a hat játék?” – automatikusan minden élesítés előtt (CI), de kézzel is futtatható
//
//  node tools/smoke.js             → a smoke.config.json oldalai (pl. főmenü, kioszk): minden játék elindítása egymás után
//  node tools/smoke.js --offline   → ugyanez + OFFLINE próba: a service worker letölt mindent, aztán leállítjuk
//                                     a szervert, elvágjuk a hálózatot, újratöltünk, és újra elindítjuk a játékokat
//
//  Hogyan: saját kis statikus szerver a web/ mappára (a netlify.toml biztonsági fejlécével, hogy a CSP-hibák is
//  kiderüljenek) + fej nélküli Chrome a DevTools-protokollon (mint a tools/jatek-foto.js).
//  Hibának számít: el nem kapott JS-kivétel, console.error, a böngésző hibanaplója (pl. 404, CSP-tiltás),
//  hiányzó indító függvény. Bármelyik → 1-es kilépési kód (a CI ekkor NEM élesít).
//  Böngésző: CHROME=<útvonal>, különben Google Chrome / Chromium a szokásos helyeken vagy a PATH-on.
// ============================================================
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), { spawn, execFileSync } = require('child_process');
const REPO = path.join(__dirname, '..'), ROOT = path.join(REPO, 'web');
const OFFLINE = process.argv.includes('--offline');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.glb':'model/gltf-binary' };

// A játékok indítása (globális függvények) és a betöltendő oldalak: a projekt gyökerében lévő smoke.config.json-ból
// { "pages":[["Főmenü","/"]], "games":[["Név","inditoFuggveny()",várakozás_ms]], "between":"openMenu()", "ready":"typeof openMenu === 'function'" } – így ugyanez a fájl
// minden beeco játék-projektben használható (beeco-jatek-kit).
const SMOKE_CFG = JSON.parse(fs.readFileSync(path.join(REPO, 'smoke.config.json'), 'utf8'));
const GAMES = SMOKE_CFG.games, PAGES = SMOKE_CFG.pages, BETWEEN = SMOKE_CFG.between ?? 'openMenu()';
const READY = SMOKE_CFG.ready || "typeof openMenu === 'function'";   // mikor „kész” az oldal (JS-kifejezés)   // "" = nincs lépés a játékok között

// ---------- böngésző keresése (macOS + Linux/CI) ----------
function findChrome(){
  const list = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'];
  const pw = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if(fs.existsSync(pw)) for(const d of fs.readdirSync(pw).filter(d => /^chromium/.test(d)).sort().reverse())
    list.push(path.join(pw, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'), path.join(pw, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'));
  for(const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'])
    try{ list.push(execFileSync('which', [name], { encoding:'utf8', stdio:['ignore', 'pipe', 'ignore'] }).trim()); }catch(e){}
  const found = list.find(p => p && fs.existsSync(p));
  if(!found){ console.error('Nem találok Chrome-ot/Chromiumot. Add meg: CHROME=/út/a/chrome node tools/smoke.js'); process.exit(1); }
  return found;
}

// ---------- statikus szerver, a Netlify CSP-jével ----------
const CSP = (fs.readFileSync(path.join(REPO, 'netlify.toml'), 'utf8').match(/Content-Security-Policy\s*=\s*"([^"]+)"/) || [])[1];
const sockets = new Set();
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, path.normalize(p));
  if(!f.startsWith(ROOT)){ res.writeHead(403); res.end(); return; }
  fs.readFile(f, (err, buf) => {
    if(err){ res.writeHead(404); res.end(); return; }
    // az offline próbához: ha az index.html még nem tölti be az offline.js-t, a teszt beszúrja (csak itt, a fájl nem változik)
    if(OFFLINE && p === '/index.html' && !buf.includes('js/offline.js')) buf = Buffer.from(buf.toString().replace('</body>', '<script src="js/offline.js"></script></body>'));
    const h = { 'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control':'no-cache' };
    if(CSP) h['Content-Security-Policy'] = CSP;
    res.writeHead(200, h); res.end(buf);
  });
});
srv.on('connection', s => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
const stopServer = () => new Promise(r => { srv.close(r); for(const s of sockets) s.destroy(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let chrome, prof;
function finish(code){ try{ chrome && chrome.kill(); }catch(e){} try{ prof && fs.rmSync(prof, { recursive:true, force:true }); }catch(e){} process.exit(code); }
const LIMIT_MIN = OFFLINE ? 12 : 6;
setTimeout(() => { console.error(`HIBA: a smoke-teszt ${LIMIT_MIN} perc alatt sem végzett – leállítom.`); finish(1); }, LIMIT_MIN * 60 * 1000).unref();

srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port, base = `http://127.0.0.1:${port}`, dbg = 9300 + Math.floor(Math.random() * 500);
  prof = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-'));
  const args = ['--headless', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--hide-scrollbars', '--window-size=1280,800', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', '--mute-audio'];
  if(process.platform === 'linux') args.push('--no-sandbox', '--disable-dev-shm-usage');
  chrome = spawn(findChrome(), [...args, 'about:blank'], { stdio:'ignore' });

  // ---------- DevTools-kapcsolat ----------
  let targets;
  for(let i = 0; i < 100; i++){ try{ targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); if(targets.find(t => t.type === 'page')) break; }catch(e){} await sleep(100); }
  if(!targets){ console.error('HIBA: a Chrome nem indult el.'); finish(1); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); let errors = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if(m.id && pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id); return; }
    if(m.method === 'Runtime.exceptionThrown'){ const d = m.params.exceptionDetails; errors.push('kivétel: ' + (d.exception?.description || d.text).split('\n').slice(0, 3).join(' | ')); }
    else if(m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    else if(m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('böngésző: ' + m.params.entry.text + (m.params.entry.url ? ' (' + m.params.entry.url + ')' : ''));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id:i, method, params })); });
  const run = async expr => { const r = await send('Runtime.evaluate', { expression:expr, awaitPromise:true, returnByValue:true });
    const ex = r.result?.exceptionDetails; if(ex) throw new Error(ex.exception?.description || ex.text); return r.result?.result?.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled:false });

  const report = [];   // [oldal, lépés, hibák[]]
  async function load(label, url){
    errors = [];
    await send('Page.navigate', { url });
    let ok = false;
    for(let i = 0; i < 200 && !ok; i++){ await sleep(100); try{ ok = await run(`document.readyState === 'complete' && (${READY})`); }catch(e){} }
    await sleep(1500);
    report.push([label, 'betöltés', ok ? errors : [...errors, 'az oldal 20 mp alatt sem töltött be (' + READY + ')']]);
    return ok;
  }
  async function games(label){
    for(const [name, call, wait] of GAMES){
      errors = [];
      const fn = call.slice(0, call.indexOf('('));
      try{
        if(await run(`typeof ${fn}`) !== 'function') throw new Error(`hiányzik a ${fn}() függvény`);
        await run(`(async () => { const r = ${call}; if(r && r.then) await r; return true; })()`);
      }catch(e){ errors.push('indítás: ' + e.message.split('\n')[0]); }
      await sleep(wait);
      if(BETWEEN) try{ await run(`(async () => { const r = ${BETWEEN}; if(r && r.then) await r; return true; })()`); }catch(e){ errors.push(BETWEEN + ': ' + e.message.split('\n')[0]); }
      await sleep(600);
      report.push([label, name, errors]);
    }
  }

  for(const [label, p] of PAGES) if(await load(label, base + p)) await games(label);

  // ---------- offline próba ----------
  if(OFFLINE){
    await load('Offline előkészítés', base + '/');
    let st = null;
    try{ st = await run(`Promise.race([window.beecoOffline ? beecoOffline.ready : Promise.resolve(null), new Promise(r => setTimeout(() => r('időtúllépés'), 90000))])`); }catch(e){}
    const prep = report[report.length - 1][2];
    if(!st || st === 'időtúllépés' || !st.cached) prep.push('a service worker nem tárolt el mindent: ' + JSON.stringify(st));
    else console.log(`offline: a service worker kész (verzió ${st.version})`);
    // hálózat elvágása: a szerver leáll, a lap és a service worker is „offline” (DevTools-emuláció)
    await stopServer();
    const off = { offline:true, latency:0, downloadThroughput:0, uploadThroughput:0 };
    await send('Network.emulateNetworkConditions', off);
    const sw = (await send('Target.getTargets')).result.targetInfos.filter(t => t.type === 'service_worker');
    for(const t of sw){ const a = await send('Target.attachToTarget', { targetId:t.targetId, flatten:true });
      await new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id:i, sessionId:a.result.sessionId, method:'Network.emulateNetworkConditions', params:off })); }); }
    for(const [label0, p] of PAGES){ const label = 'OFFLINE ' + label0.toLowerCase();
      if(!(await load(label, base + p))) continue;
      const errs = report[report.length - 1][2];
      const chk = await run(`(async () => ({ sw: !!navigator.serviceWorker.controller, three: !document.querySelector('script[src*="three"]') ? null : typeof THREE !== 'undefined' && !!THREE.WebGLRenderer,
        net: await fetch('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js?elerheto', { mode:'no-cors' }).then(() => true, () => false),
        qr: typeof qrLoad === 'function' ? await Promise.resolve(qrLoad()).then(q => !!q, () => false) : null }))()`).catch(e => ({ hiba:e.message }));
      await sleep(300);
      for(let i = errs.length - 1; i >= 0; i--) if(errs[i].includes('?elerheto')) errs.splice(i, 1);   // a szándékos hálózat-próba hibája nem hiba
      console.log(`${label}: SW vezérel=${chk.sw}, Three.js=${chk.three}, QR-könyvtár=${chk.qr}, hálózat elérhető=${chk.net} (SW-célpont: ${sw.length})`);
      if(!chk.sw) errs.push('a lapot nem a service worker szolgálta ki');
      if(chk.three === false) errs.push('a Three.js nem töltődött be offline');
      if(chk.qr === false) errs.push('a QR-könyvtár (cdnjs) nem töltődött be offline');
      if(chk.net) errs.push('a hálózat NEM volt elvágva – a próba érvénytelen');
      await games(label);
    }
  }

  // ---------- összesítő ----------
  let bad = 0;
  console.log('\nSMOKE-TESZT – ' + (OFFLINE ? 'online + offline' : 'online'));
  for(const [page, step, errs] of report){
    if(errs.length) bad++;
    console.log(`${errs.length ? 'HIBA' : ' ok '}  ${page} – ${step}`);
    for(const e of errs.slice(0, 8)) console.log('        ' + e.slice(0, 300));
    if(errs.length > 8) console.log(`        … és még ${errs.length - 8} hiba`);
  }
  console.log(bad ? `\nEREDMÉNY: ${bad} lépésben hiba – NEM élesíthető.` : `\nEREDMÉNY: minden rendben (${report.length} lépés).`);
  ws.close(); await stopServer().catch(() => {});
  finish(bad ? 1 : 0);
});
