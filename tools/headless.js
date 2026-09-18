// ============================================================
//  Fej nélküli Chrome/Chromium a fejlesztői eszközöknek (márka-képek, matrica-PNG-k)
//  Böngésző: CHROME=<útvonal> környezeti változó, vagy a Google Chrome / a Playwright-Chromium, ha a gépen van.
// ============================================================
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');

function findChrome(){
  const list = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  const pw = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if(fs.existsSync(pw)) for(const d of fs.readdirSync(pw).filter(d => /^chromium/.test(d)).sort().reverse())
    list.push(path.join(pw, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'), path.join(pw, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'));
  const found = list.find(p => p && fs.existsSync(p));
  if(!found){ console.log('Nem találok Chrome-ot/Chromiumot. Add meg: CHROME=/út/a/chrome node …'); process.exit(1); }
  return found;
}

// egy HTML-fájl „lefotózása”: w×h képpont, transparent = átlátszó háttér
function shot(htmlFile, out, w, h, transparent){
  const args = ['--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--virtual-time-budget=4000', `--screenshot=${out}`];
  if(transparent) args.push('--default-background-color=00000000');
  execFileSync(findChrome(), [...args, 'file://' + path.resolve(htmlFile)], { stdio:'pipe' });
}

module.exports = { findChrome, shot };
