// ============================================================
//  QR-KÓD — a beeco app letöltéséhez (kioszk nyitóképernyő, képernyővédő, kör vége kioszkban)
//
//  A kód mindig a rolunk.json → appUrl címből készül: ha ott kicserélik a linket, a QR magától frissül.
//  Könyvtár: qrcode-generator 1.4.4 (Kazuhiko Arase, MIT-licenc, ~20 KB) a cdnjs-ről – CSAK akkor töltődik be,
//  amikor QR-t kell mutatni; integritás-ellenőrzéssel (SRI), így módosított fájlt a böngésző nem futtat.
//  Használat: qrHTML(url, méret) egy helyőrzőt ad; a qrFill(gyökér) kitölti a benne lévő helyőrzőket SVG-vel.
// ============================================================
const QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
const QR_SRI = 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1';
let qrLib = null;
function qrLoad(){
  return qrLib || (qrLib = new Promise((res, rej) => {
    if(window.qrcode) return res(window.qrcode);
    const s = document.createElement('script'); s.src = QR_SRC; s.integrity = QR_SRI; s.crossOrigin = 'anonymous';
    s.onload = () => res(window.qrcode); s.onerror = () => { qrLib = null; rej(new Error('QR-könyvtár nem tölthető be')); };
    document.head.appendChild(s);
  }));
}
// SVG: olíva modulok krém alapon, 2 modulnyi csendes zónával (a beolvasáshoz kell)
async function qrSVG(text){
  const q = (await qrLoad())(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), m = 2; let d = '';
  for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2*m} ${n + 2*m}" shape-rendering="crispEdges" role="img" aria-label="QR-kód: ${esc(text)}">`
    + `<rect width="100%" height="100%" fill="${DS.color.paper}"/><path d="${d}" fill="${DS.color.olive}"/></svg>`;
}
const qrHTML = (url, size) => `<span class="ds-qr" data-qr="${esc(url)}" style="--qr:${size || 140}px"></span>`;
function qrFill(root){
  (root || document).querySelectorAll('.ds-qr[data-qr]:not(.done)').forEach(el => {
    el.classList.add('done');
    qrSVG(el.dataset.qr).then(svg => { el.innerHTML = svg; }).catch(() => { el.classList.add('fail'); el.textContent = el.dataset.qr.replace(/^https?:\/\//, ''); });
  });
}
