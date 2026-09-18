// ============================================================
//  JÁTÉK-FOTÓ – láthatatlan böngészős ellenőrzés: saját kis statikus szerver (a web/ mappa) + fej nélküli Chrome,
//  a DevTools-protokollon vezérelve (JS futtatás a játékban, képernyőkép, konzol-hibák). Nem kell hozzá dev-szerver
//  és nem nyílik ablak – a WebGL-kép is friss (a rejtett böngészőpanelnél elavulhat).
//  node tools/jatek-foto.js <config.json>
//  config: { size:[w,h], touch?:bool, cpu?:szorzó (CPU-lassítás, pl. 4 ≈ közepes Android), gpu?:bool (valódi videókártya a szoftveres helyett),
//           dpr?:képpontsűrűség, root?:'mappa' (alap: web/), load?:ms, steps:[ {js:'kód (await is)'} | {file:'szkript.js'} | {wait:ms} | {shot:'ki.png'} ] }
//  Minta: tools/hatter-minta/fotoz.js
// ============================================================
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), { spawn } = require('child_process');
const REPO = path.join(__dirname, '..');
const { findChrome } = require(REPO + '/tools/headless.js');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ROOT = cfg.root || REPO + '/web';
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.glb':'model/gltf-binary' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  fs.readFile(f, (err, buf) => { if(err){ res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type':TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control':'no-store' }); res.end(buf); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
srv.listen(0, async () => {
  const port = srv.address().port, dbg = 9300 + Math.floor(Math.random() * 500);
  const [w, h] = cfg.size || [1280, 800];
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const ch = spawn(findChrome(), ['--headless', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, ...(cfg.gpu ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
    '--hide-scrollbars', `--window-size=${w},${h}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio:'ignore' });
  let targets; for(let i = 0; i < 50; i++){ try{ targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); if(targets.find(t => t.type === 'page')) break; }catch(e){} await sleep(100); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), logs = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if(m.id && pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id); }
    else if(m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    else if(m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id:i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width:w, height:h, deviceScaleFactor:cfg.dpr || 1, mobile:!!cfg.touch });
  if(cfg.cpu) await send('Emulation.setCPUThrottlingRate', { rate:cfg.cpu });
  if(cfg.touch) await send('Emulation.setTouchEmulationEnabled', { enabled:true, maxTouchPoints:5 });
  await send('Page.navigate', { url:`http://127.0.0.1:${port}${cfg.path || '/'}` });
  await sleep(cfg.load || 3000);
  for(const s of cfg.steps || []){
    if(s.wait) await sleep(s.wait);
    if(s.file){ const r = await send('Runtime.evaluate', { expression:fs.readFileSync(s.file, 'utf8'), returnByValue:true }); const ex = r.result?.exceptionDetails; console.log(ex ? 'FÁJL HIBA: ' + s.file + ' ' + (ex.exception?.description || ex.text) : 'betöltve: ' + path.basename(s.file)); }
    if(s.js){ const r = await send('Runtime.evaluate', { expression:`(async()=>{ ${s.js} })()`, awaitPromise:true, returnByValue:true });
      const v = r.result?.result?.value, ex = r.result?.exceptionDetails; console.log(ex ? 'JS HIBA: ' + (ex.exception?.description || ex.text) : 'js → ' + JSON.stringify(v)); }
    if(s.shot){ const r = await send('Page.captureScreenshot', { format:'png' }); fs.writeFileSync(s.shot, Buffer.from(r.result.data, 'base64')); console.log('kép →', s.shot); }
  }
  console.log(logs.length ? 'KONZOL:\n' + logs.join('\n') : 'konzol: üres');
  ws.close(); ch.kill(); srv.close(); try{ fs.rmSync(prof, { recursive:true, force:true }); }catch(e){}
  process.exit(0);
});
