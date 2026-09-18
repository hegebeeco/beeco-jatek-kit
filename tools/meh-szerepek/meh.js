// ============================================================
//  Szerepes méhecske – közös összerakó (tools/meh-szerepek/*.html használja)
//
//  A beeco méhecskét NEM rajzoljuk újra: az eredeti képet (web/assets/brand/bee-happy.webp)
//  tesszük le, és fölé/mögé kódból rajzolt kellékeket (SVG) teszünk.
//  Koordináták: „rácstér” – a méhecske itt mindig x=18, y=44, 250×251.6 méretű (lásd rács: docs/meh-szerepek.md).
//  A végső 300×300-as képen a kompozíció a tartalma köré igazítva, középre kerül (automatikus viewBox).
//
//  Használat egy szerep-fájlban:
//    <script>window.MEH = { back: '<svg-részlet a méhecske MÖGÖTT>', front: '<svg-részlet ELŐTTE>' };</script>
//    <script src="meh.js"></script>
// ============================================================
(function(){
  const M = window.MEH || {};
  const bee = new URL('../../web/assets/brand/bee-happy.webp', location.href).href;
  document.body.style.cssText = 'margin:0;background:transparent;overflow:hidden';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', 300); svg.setAttribute('height', 300);
  svg.innerHTML = `<g id="all"><g id="back">${M.back || ''}</g>
    <image href="${bee}" x="18" y="44" width="250" height="251.6"/>
    <g id="front">${M.front || ''}</g></g>`;
  document.body.appendChild(svg);
  // automatikus keret: a tartalom (méhecske + kellékek) köré, négyzetesen, kis margóval – mint a meglévő szerep-képeken
  const b = svg.getElementById ? svg.querySelector('#all').getBBox() : null;
  const pad = M.pad ?? 8, side = Math.max(b.width, b.height) + pad * 2;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  svg.setAttribute('viewBox', `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
})();
