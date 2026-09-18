// ============================================================
//  Matricák — ÖKO-PECSÉT KERETEK a Greenwashing-vadászhoz (p_ + név)
//
//  Ezek NEM valódi tanúsító jelek: a kitalált márkák „öko-pecsétjeinek" kerete, és azoknak a hivatalos címkéknek a
//  helykitöltője, amelyek logója engedélyköteles (docs/greenwashing-logok.csv). A pecsét szövegét a játék írja rá
//  HTML-ben (a matricákon sosincs szöveg) – ezért mindegyik közepén VILÁGOS, üres mező marad.
//  Felépítés: külső gyűrű-tárcsa → belső gyűrű-tárcsa → világos középmező → díszek a gyűrűn → fénycsík.
//  (Az art.js-ben minden alakzat kitöltött, ezért a gyűrűket egymásra rajzolt tárcsák adják.)
//  Stílus: a közös matrica-készlet (art.js) – 4 tónus, vékony kontúr, fehér perem, tömör olíva árnyék.
// ============================================================
(function(){
  const { R, rad, arc, band, leaf, star } = ART.geo;
  // hol fér el a szöveg az egyes kereteken: [közép x %, közép y %, szélesség %] – a játék ebből állítja a feliratot
  const BOX = { p_rozetta:[50, 50, 48], p_baber:[50, 50, 48], p_pipa:[50, 50, 48], p_szalag:[50, 46, 46], p_pajzs:[50, 52, 42],
    p_fold:[50, 50, 48], p_pecset:[50, 50, 46], p_csepp:[50, 50, 44], p_fa:[50, 50, 46], p_cimke:[58, 50, 46], p_erem:[50, 44, 40], p_hatszog:[50, 50, 46] };
  if(typeof window !== 'undefined') window.GW_SEAL_BOX = BOX;
  const add = (name, hu, en, shapes) => ART.add(name, { emoji:[], hu, en, shadow:'hard', shapes });
  const disc = (r, m, tone, d) => ({ t:'circle', cx:50, cy:50, r, m, tone, d:!!d });
  const field = (r, m = 'paper') => disc(r, m, 'light', true);                   // középmező: ide kerül a szöveg
  // fogazott (rozettás) körvonal: n hullám a peremen
  const rosette = (r, n, amp) => R(Array.from({ length:n * 6 }, (_, i) => {
    const a = rad(i / (n * 6) * 360), q = r + Math.cos(a * n) * amp;
    return [50 + q * Math.cos(a), 50 + q * Math.sin(a)]; }));
  const at = (a, r) => [50 + r * Math.cos(rad(a)), 50 + r * Math.sin(rad(a))];   // polár hely (0° = jobbra, 90° = lefelé)

  // 1. rozetta – a „hivatalosnak látszó" bio-pecsét
  add('p_rozetta', 'öko-pecsét (rozetta)', 'scalloped eco seal frame', [
    { t:'poly', m:'leaf', fc:'none', tone:'base', pts:rosette(40, 14, 3) },
    disc(35, 'leaf', 'dark', true), field(31, 'cream'),
    ...[-1, 1].map(s => ({ t:'path', m:'leaf', tone:'light', d:true, p:leaf(50 + s * 5, 23, s > 0 ? -35 : -145, 12, 6.5) })),
    { t:'circle', cx:50, cy:50, r:2.4, m:'honey', tone:'base', d:true },
    { t:'shine', cx:33, cy:33, rx:9, ry:3.4, rot:-38, ox:50, oy:50 },
  ]);
  // 2. babérkoszorús kör
  add('p_baber', 'öko-pecsét (babérkoszorú)', 'laurel wreath seal frame', [
    disc(40, 'grass', 'dark'), disc(36, 'grass', 'base', true), field(31, 'paper'),
    ...[-1, 1].flatMap(s => [0, 1, 2, 3].map(i => { const a = 150 + i * 20; const [x, y] = at(s > 0 ? a : 180 - a + 180, 33.5);
      return { t:'path', m:'leaf', tone:i % 2 ? 'base' : 'dark', d:true, p:leaf(x, y, (s > 0 ? a : 360 - a) + 90, 11, 6) }; })),
    { t:'poly', m:'honey', tone:'base', d:true, pts:star(50, 20, 5.4, 2.3, 5) },
    { t:'shine', cx:32, cy:36, rx:8, ry:3, rot:-45, ox:50, oy:50 },
  ]);
  // 3. pipás kör – „ellenőrizve"
  add('p_pipa', 'öko-pecsét (pipa)', 'checkmark seal frame', [
    disc(40, 'teal', 'dark'), disc(36, 'teal', 'base', true), field(31, 'paper'),
    { t:'poly', m:'teal', tone:'base', d:true, o:0.35, pts:band([[34, 52], [45, 64], [68, 36]], 8) },
    ...[0, 1, 2].map(i => ({ t:'circle', cx:at(200 + i * 70, 33.6)[0], cy:at(200 + i * 70, 33.6)[1], r:2.6, m:'teal', tone:'light', d:true })),
    { t:'shine', cx:33, cy:34, rx:9, ry:3.2, rot:-40, ox:50, oy:50 },
  ]);
  // 4. szalagos kör – „banner"
  add('p_szalag', 'öko-pecsét (szalag)', 'ribbon banner seal frame', [
    disc(38, 'grass', 'dark'), disc(34, 'grass', 'base', true), field(30, 'cream'),
    { t:'poly', m:'honey', tone:'base', pts:[[8, 60], [92, 60], [92, 78], [79, 69], [66, 78], [50, 69], [34, 78], [21, 69], [8, 78]] },
    { t:'poly', m:'honey', tone:'dark', d:true, pts:[[8, 60], [92, 60], [92, 64], [8, 64]] },
    ...[-1, 1].map(s => ({ t:'path', m:'leaf', tone:'base', d:true, p:leaf(50 + s * 7, 24, s > 0 ? -35 : -145, 12, 6.5) })),
    { t:'shine', cx:32, cy:35, rx:8, ry:3, rot:-42, ox:50, oy:50 },
  ]);
  // 5. pajzs levéllel
  add('p_pajzs', 'öko-pecsét (pajzs)', 'shield seal frame', [
    { t:'path', m:'leaf', fc:'v', p:'M50 8 L88 21 V52 C88 71 69 85 50 92 C31 85 12 71 12 52 V21 Z' },
    { t:'path', m:'leaf', tone:'dark', d:true, p:'M50 14 L83 25 V52 C83 68 66 80 50 86 C34 80 17 68 17 52 V25 Z' },
    { t:'path', m:'paper', tone:'light', d:true, p:'M50 19 L78 28 V52 C78 65 64 75 50 80 C36 75 22 65 22 52 V28 Z' },
    { t:'path', m:'leaf', tone:'base', d:true, o:0.35, p:leaf(50, 72, -90, 24, 14) },
    { t:'poly', m:'honey', tone:'base', d:true, pts:star(50, 24, 5, 2.1, 5) },
    { t:'shine', x:26, y:28, w:7, h:20, rot:12, ox:50, oy:50 },
  ]);
  // 6. földgolyó gyűrűvel
  add('p_fold', 'öko-pecsét (földgolyó)', 'globe seal frame', [
    disc(40, 'sky', 'dark'), disc(36, 'sky', 'base', true), field(31, 'paper'),
    ...[0, 1, 2].map(i => ({ t:'poly', m:'water', tone:'dark', d:true, o:0.45, pts:band(arc(50, 50, 34, 100 + i * 60, 160 + i * 60, 8), 2.4, false) })),
    { t:'path', m:'grass', tone:'base', d:true, p:leaf(50, 22, -40, 13, 7) },
    { t:'path', m:'leaf', tone:'dark', d:true, p:leaf(50, 22, -140, 11, 6) },
    { t:'shine', cx:33, cy:34, rx:9, ry:3.2, rot:-40, ox:50, oy:50 },
  ]);
  // 7. csillagos dupla gyűrű – „tanúsítvány"
  add('p_pecset', 'öko-pecsét (csillagos)', 'starred double ring seal frame', [
    disc(40, 'honey', 'dark'), disc(36, 'honey', 'base', true), field(30, 'cream'),
    ...[-30, -15, 0, 15, 30].map(a => ({ t:'poly', m:'honey', tone:'light', d:true, pts:star(at(a - 90, 33.5)[0], at(a - 90, 33.5)[1], 4.2, 1.8, 5) })),
    ...[150, 210].map(a => ({ t:'path', m:'leaf', tone:'base', d:true, p:leaf(at(a, 33)[0], at(a, 33)[1], a - 90, 10, 5.5) })),
    { t:'shine', cx:32, cy:36, rx:8, ry:3, rot:-45, ox:50, oy:50 },
  ]);
  // 8. vízcseppes kör
  add('p_csepp', 'öko-pecsét (vízcsepp)', 'water drop seal frame', [
    disc(40, 'water', 'dark'), disc(36, 'water', 'base', true), field(31, 'paper'),
    { t:'path', m:'water', tone:'base', d:true, o:0.4, p:'M50 24 C60 38 67 46 67 54 C67 64 59 71 50 71 C41 71 33 64 33 54 C33 46 40 38 50 24 Z' },
    ...[0, 1, 2, 3].map(i => ({ t:'circle', cx:at(120 + i * 40, 33.6)[0], cy:at(120 + i * 40, 33.6)[1], r:2.4, m:'water', tone:'light', d:true })),
    { t:'shine', cx:33, cy:34, rx:9, ry:3.2, rot:-40, ox:50, oy:50 },
  ]);
  // 9. fás kör
  add('p_fa', 'öko-pecsét (fa)', 'tree seal frame', [
    disc(40, 'sage', 'dark'), disc(36, 'sage', 'base', true), field(31, 'paper'),
    { t:'poly', m:'wood', tone:'dark', d:true, o:0.5, pts:[[47.5, 58], [52.5, 58], [53.5, 76], [46.5, 76]] },
    { t:'circle', cx:50, cy:44, r:15, m:'leaf', tone:'base', d:true, o:0.35 },
    { t:'circle', cx:39, cy:52, r:9, m:'leaf', tone:'dark', d:true, o:0.3 },
    { t:'circle', cx:61, cy:52, r:9, m:'grass', tone:'base', d:true, o:0.35 },
    ...[160, 200].map(a => ({ t:'circle', cx:at(a, 33.6)[0], cy:at(a, 33.6)[1], r:2.6, m:'sage', tone:'light', d:true })),
    { t:'shine', cx:33, cy:34, rx:9, ry:3.2, rot:-40, ox:50, oy:50 },
  ]);
  // 10. függő címke (tag)
  add('p_cimke', 'öko-pecsét (függőcímke)', 'hanging tag seal frame', [
    { t:'path', m:'grass', fc:'h', p:'M26 20 H88 C92 20 94 22 94 26 V74 C94 78 92 80 88 80 H26 L8 50 Z' },
    { t:'path', m:'grass', tone:'dark', d:true, p:'M28 25 H89 V75 H28 L14 50 Z' },
    { t:'path', m:'paper', tone:'light', d:true, p:'M31 29 H86 V71 H31 L20 50 Z' },
    { t:'circle', cx:24, cy:50, r:4.4, m:'grass', tone:'dark', d:true },
    { t:'poly', m:'cardboard', tone:'dark', d:true, pts:band([[24, 50], [14, 36], [9, 20]], 2.6, false) },
    { t:'path', m:'leaf', tone:'base', d:true, o:0.5, p:leaf(78, 44, 120, 15, 8) },
    { t:'shine', x:36, y:33, w:24, h:3.6 },
  ]);
  // 11. érem szalagokkal
  add('p_erem', 'öko-pecsét (érem)', 'medal seal frame', [
    { t:'poly', m:'leaf', tone:'dark', pts:[[33, 60], [45, 60], [39, 93], [26, 84]] },
    { t:'poly', m:'leaf', tone:'base', pts:[[55, 60], [67, 60], [74, 84], [61, 93]] },
    disc(34, 'gold', 'dark'), { t:'circle', cx:50, cy:44, r:34, m:'gold', tone:'dark' },
    { t:'circle', cx:50, cy:44, r:30, m:'gold', tone:'base', d:true },
    { t:'circle', cx:50, cy:44, r:26, m:'cream', tone:'light', d:true },
    { t:'poly', m:'gold', tone:'light', d:true, pts:star(50, 18, 5.6, 2.4, 5) },
    { t:'shine', cx:33, cy:30, rx:9, ry:3.2, rot:-38, ox:50, oy:50 },
  ]);
  // 12. hatszög keret
  add('p_hatszog', 'öko-pecsét (hatszög)', 'hexagon seal frame', [
    { t:'poly', m:'grass', fc:'v', pts:R(arc(50, 50, 44, -90, 210, 6)) },
    { t:'poly', m:'grass', tone:'dark', d:true, pts:R(arc(50, 50, 39, -90, 210, 6)) },
    { t:'poly', m:'paper', tone:'light', d:true, pts:R(arc(50, 50, 33, -90, 210, 6)) },
    ...[-1, 1].map(s => ({ t:'path', m:'leaf', tone:s > 0 ? 'base' : 'dark', d:true, p:leaf(50, 22, s > 0 ? -45 : -135, 12, 6.5) })),
    { t:'poly', m:'honey', tone:'base', d:true, pts:star(50, 78, 4.6, 2, 5) },
    { t:'shine', x:29, y:36, w:6.5, h:18, rot:14, ox:50, oy:50 },
  ]);
})();
