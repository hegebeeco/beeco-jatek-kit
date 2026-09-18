// ============================================================


// ---- ruha, kiegészítők, szépségápolás ----
ART.add('farmer', { emoji:['👖'], hu:'farmer', en:'blue denim jeans', shapes:[
  { t:'path', m:'blue', p:'M24 10 H76 L86 88 C86 90 85 91 83 91 H58 C56 91 55 90 55 88 L50 36 L45 88 C45 90 44 91 42 91 H17 C15 91 14 90 14 88 Z' },
  { t:'rect', x:23, y:8, w:54, h:10, r:2, m:'blue', tone:'dark' },
  { t:'line', pts:[[50, 18], [50, 34]], m:'blue', w:2 },
  { t:'line', pts:[[40, 19], [37, 26], [25, 30]], m:'honey', tone:'base', w:2 },
  { t:'line', pts:[[60, 19], [63, 26], [75, 30]], m:'honey', tone:'base', w:2 },
  { t:'circle', cx:50, cy:13, r:2.5, m:'gold', fc:'none', d:true },
  { t:'line', pts:[[16, 82], [44, 82]], m:'blue', w:2 }, { t:'line', pts:[[56, 82], [84, 82]], m:'blue', w:2 },
]});
// sportcipő: oldalnézet, orrával jobbra (a díszítés semleges sarokerősítés, nem márkajel)
ART.add('sportcipo', { emoji:['👟'], hu:'sportcipő', en:'running sneaker', shapes:[
  { t:'path', m:'teal', fc:'none', tone:'light', p:'M30 30 C30 20 38 16 44 20 L50 38 L36 40 Z' },
  { t:'path', m:'teal', p:'M10 72 L11 38 C11 31 16 27 22 28 L32 30 C34 36 38 40 44 40 L50 38 L78 51 C88 55 92 63 91 72 Z' },
  { t:'path', m:'teal', tone:'dark', d:true, p:'M12 34 C14 28 28 27 33 31 C27 34 18 34 12 37 Z' },
  { t:'path', m:'teal', tone:'dark', p:'M11 50 C19 50 25 58 25 72 L10 72 Z' },
  { t:'path', m:'white', tone:'light', p:'M70 72 C70 61 77 55 83 56 C89 58 92 65 91 72 Z' },
  { t:'path', m:'white', fc:'h', p:'M6 70 H92 C94 70 94 80 90 84 C88 86 86 87 82 87 H12 C8 87 6 82 6 70 Z' },
  { t:'line', pts:[[48, 38], [52, 46]], m:'white', tone:'light', w:3 },
  { t:'line', pts:[[56, 41], [60, 49]], m:'white', tone:'light', w:3 },
  { t:'line', pts:[[64, 45], [68, 53]], m:'white', tone:'light', w:3 },
  { t:'line', pts:[[10, 79], [91, 79]], m:'white', tone:'dark', w:2 },
]});
ART.add('kabat', { emoji:['🧥'], hu:'kabát', en:'warm jacket', shapes:[
  { t:'path', m:'orange', p:'M36 10 H64 L84 20 C88 22 89 25 89 29 L92 80 C92 82 91 83 89 83 L80 84 C78 84 77 83 77 81 L75 48 V88 C75 90 74 91 72 91 H28 C26 91 25 90 25 88 V48 L23 81 C23 83 22 84 20 84 L11 83 C9 83 8 82 8 80 L11 29 C11 25 12 22 16 20 Z' },
  { t:'poly', m:'cream', pts:[[40, 10], [60, 10], [50, 30]] },
  { t:'poly', m:'orange', tone:'light', pts:[[36, 10], [50, 32], [44, 46], [30, 16]] },
  { t:'poly', m:'orange', tone:'dark', pts:[[64, 10], [50, 32], [56, 46], [70, 16]] },
  { t:'line', pts:[[50, 32], [50, 90]], m:'orange', w:2.2 },
  { t:'line', pts:[[25, 26], [25, 60]], m:'orange', tone:'dark', w:2 }, { t:'line', pts:[[75, 26], [75, 60]], m:'orange', tone:'dark', w:2 },
  { t:'line', pts:[[31, 70], [42, 70]], m:'orange', w:2 }, { t:'line', pts:[[58, 70], [69, 70]], m:'orange', w:2 },
]});
// baseball-sapka: oldalnézet, ellenzővel jobbra
ART.add('sapka', { emoji:['🧢'], hu:'baseballsapka', en:'baseball cap', shapes:[
  { t:'path', m:'blue', tone:'dark', p:'M46 62 C62 56 84 58 91 66 C93 70 90 74 84 74 C70 74 58 72 46 70 Z' },
  { t:'path', m:'blue', p:'M10 66 C10 38 26 22 48 22 C70 22 82 38 82 62 C82 66 80 68 76 68 L14 70 C11 70 10 68 10 66 Z' },
  { t:'path', m:'blue', tone:'dark', d:true, line:false, p:'M46 23 C36 32 34 52 36 69 L39 69 C38 52 40 34 50 23 Z' },
  { t:'rect', x:10, y:62, w:72, h:7, r:3.5, m:'blue', tone:'dark' },
  { t:'ellipse', cx:48, cy:21, rx:5, ry:3, m:'blue', tone:'dark' },
]});
ART.add('ruzs', { emoji:['💄'], hu:'rúzs', en:'lipstick', shapes:[
  { t:'path', m:'red', p:'M39 40 V22 C39 18 41 16 45 14 L61 7 V40 Z' },
  { t:'shine', x:43, y:20, w:4, h:16 },
  { t:'rect', x:36, y:36, w:28, h:14, m:'gold', fc:'v' },
  { t:'rect', x:31, y:48, w:38, h:8, r:2, m:'gold', tone:'dark' },
  { t:'rect', x:33, y:55, w:34, h:37, r:3, m:'berry', fc:'v' },
]});
ART.add('szappan', { emoji:['🧼'], hu:'szappan', en:'bar of soap with bubbles', shapes:[
  { t:'rect', x:10, y:48, w:80, h:38, r:15, m:'blossom', fc:'h' },
  { t:'rect', x:22, y:55, w:56, h:16, r:8, m:'blossom', tone:'light', line:false, d:true },
  { t:'circle', cx:30, cy:36, r:10, m:'glass', tone:'light' },
  { t:'circle', cx:55, cy:24, r:14, m:'glass', tone:'light' },
  { t:'circle', cx:78, cy:36, r:8, m:'glass', tone:'light' },
  { t:'shine', cx:50, cy:19, rx:4, ry:2.5, rot:-30, o:.9, ox:50, oy:50 },
  { t:'shine', cx:27, cy:33, rx:3, ry:2, rot:-30, o:.9, ox:50, oy:50 },
]});
// konyhai szivacs: sárga szivacs zöld súrolóréteggel, 3/4-es nézet
ART.add('szivacs', { emoji:['🧽'], hu:'szivacs', en:'kitchen sponge with green scrub pad', shapes:[
  { t:'poly', m:'honey', tone:'light', pts:[[10, 40], [30, 24], [90, 24], [70, 40]] },
  { t:'poly', m:'honey', tone:'base', pts:[[10, 40], [70, 40], [70, 64], [10, 64]] },
  { t:'poly', m:'honey', tone:'dark', pts:[[70, 40], [90, 24], [90, 48], [70, 64]] },
  { t:'poly', m:'leaf', tone:'base', pts:[[10, 64], [70, 64], [70, 80], [10, 80]] },
  { t:'poly', m:'leaf', tone:'dark', pts:[[70, 64], [90, 48], [90, 64], [70, 80]] },
  ...[[22, 48, 3.5], [40, 54, 4], [58, 47, 3], [30, 58, 2.5], [52, 32, 3], [70, 30, 2.5]].map(([x, y, r]) => ({ t:'ellipse', cx:x, cy:y, rx:r, ry:r * .8, m:'honey', tone:'dark', line:false, d:true })),
]});
ART.add('hatizsak', { emoji:['🎒'], hu:'hátizsák', en:'hiking backpack', shapes:[
  { t:'path', m:'leaf', tone:'dark', p:'M40 18 C40 8 60 8 60 18 L55 18 C55 13 45 13 45 18 Z' },
  { t:'rect', x:12, y:40, w:10, h:40, r:5, m:'leaf', tone:'dark' },
  { t:'rect', x:78, y:40, w:10, h:40, r:5, m:'leaf', tone:'dark' },
  { t:'path', m:'leaf', p:'M20 40 C20 24 32 16 50 16 C68 16 80 24 80 40 V84 C80 89 77 92 72 92 H28 C23 92 20 89 20 84 Z' },
  { t:'path', m:'leaf', tone:'light', p:'M22 42 C22 28 34 22 50 22 C66 22 78 28 78 42 L72 48 H28 Z' },
  { t:'rect', x:28, y:58, w:44, h:28, r:6, m:'honey', fc:'h' },
  { t:'line', pts:[[28, 67], [72, 67]], m:'honey', w:2 },
  { t:'rect', x:46, y:63, w:8, h:8, r:2, m:'dark', fc:'none', d:true },
]});
ART.add('kituntetes', { emoji:['🎖️'], hu:'kitüntetés', en:'military medal with striped ribbon', shapes:[
  { t:'poly', m:'red', pts:[[28, 8], [72, 8], [72, 40], [50, 50], [28, 40]] },
  { t:'poly', m:'honey', tone:'base', pts:[[43, 8], [57, 8], [57, 46.5], [50, 50], [43, 46.5]] },
  { t:'rect', x:46, y:46, w:8, h:10, r:2, m:'gold', fc:'v' },
  { t:'poly', m:'gold', pts:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 12 : 27; return [Math.round((50 + r * Math.cos(a)) * 10) / 10, Math.round((70 + r * Math.sin(a)) * 10) / 10]; }) },
  { t:'circle', cx:50, cy:71, r:7, m:'gold', tone:'dark' },
]});
ART.add('trofea', { emoji:['🏆'], hu:'trófea', en:'gold trophy cup', shapes:[
  { t:'path', m:'gold', tone:'dark', p:'M28 18 H16 C10 18 8 24 9 31 C11 42 19 48 30 48 L29 41 C22 41 17 37 16 31 C15 27 17 25 20 25 H28 Z' },
  { t:'path', m:'gold', tone:'dark', p:'M72 18 H84 C90 18 92 24 91 31 C89 42 81 48 70 48 L71 41 C78 41 83 37 84 31 C85 27 83 25 80 25 H72 Z' },
  { t:'rect', x:44, y:56, w:12, h:16, m:'gold', fc:'v' },
  { t:'path', m:'gold', p:'M24 10 H76 V34 C76 52 64 62 50 62 C36 62 24 52 24 34 Z' },
  { t:'shine', x:31, y:16, w:5, h:26, rot:-6, ox:50, oy:50 },
  { t:'rect', x:32, y:70, w:36, h:8, r:2, m:'gold', fc:'h' },
  { t:'rect', x:24, y:77, w:52, h:15, r:3, m:'wood', fc:'h' },
  { t:'rect', x:38, y:81, w:24, h:6, r:1.5, m:'gold', tone:'light', d:true },
]});
ART.add('pajzs', { emoji:['🛡️'], hu:'pajzs', en:'protective shield', shapes:[
  { t:'path', m:'steel', p:'M50 8 C60 14 74 17 86 17 C87 52 76 78 50 92 C24 78 13 52 14 17 C26 17 40 14 50 8 Z' },
  { t:'path', m:'blue', p:'M50 17 C58 21 69 24 78 24 C78 52 69 72 50 83 C31 72 22 52 22 24 C31 24 42 21 50 17 Z' },
  { t:'shine', x:28, y:30, w:5, h:24, rot:-4, ox:50, oy:50 },
  ...[[50, 12.5], [20, 21], [80, 21], [50, 87]].map(([x, y]) => ({ t:'circle', cx:x, cy:y, r:1.8, m:'steel', tone:'dark', line:false, d:true })),
]});
ART.add('szalloda', { emoji:['🏨'], hu:'szálloda', en:'hotel building with star sign', shapes:[
  { t:'rect', x:26, y:8, w:48, h:16, r:5, m:'leaf', fc:'h' },
  ...[37, 50, 63].map(x => ({ t:'poly', m:'honey', tone:'base', d:true, line:false, pts:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.2 : 5; return [Math.round((x + r * Math.cos(a)) * 10) / 10, Math.round((16.5 + r * Math.sin(a)) * 10) / 10]; }) })),
  { t:'rect', x:14, y:24, w:72, h:68, r:3, m:'cream' },
  { t:'rect', x:22, y:32, w:56, h:12, r:2, m:'sky' },
  { t:'rect', x:22, y:50, w:56, h:12, r:2, m:'sky' },
  ...[40.7, 59.3].flatMap(x => [{ t:'line', pts:[[x, 33], [x, 43]], m:'cream', tone:'base', w:3.5 }, { t:'line', pts:[[x, 51], [x, 61]], m:'cream', tone:'base', w:3.5 }]),
  { t:'rect', x:40, y:76, w:20, h:16, r:1.5, m:'wood', fc:'v' },
  { t:'rect', x:32, y:68, w:36, h:9, r:3, m:'red', fc:'h' },
]});
ART.add('hudvelykujj', { emoji:['👍'], hu:'felfelé mutató hüvelykujj', en:'thumbs-up hand', shapes:[
  { t:'rect', x:10, y:46, w:20, h:44, r:4, m:'teal', fc:'v' },
  { t:'path', m:'skin', p:'M30 50 L37 18 C38 11 49 10 50 18 L52 44 Z' },
  { t:'rect', x:27, y:42, w:46, h:46, r:11, m:'skin' },
  ...[42, 53, 64, 75].map(y => ({ t:'rect', x:52, y, w:32, h:12, r:6, m:'skin', fc:'h' })),
  { t:'line', pts:[[38, 40], [48, 44]], m:'skin', w:2 },
]});
ART.add('agy', { emoji:['🧠'], hu:'agy', en:'cute pink brain', shapes:[
  { t:'path', m:'pink', p:'M20 68 C8 64 8 46 20 42 C18 28 32 20 44 26 C50 16 68 16 74 26 C88 26 94 42 86 52 C94 62 86 76 74 74 C70 84 56 86 50 78 C42 86 26 82 26 72 C22 72 20 70 20 68 Z' },
  { t:'line', pts:[[50, 26], [46, 36], [52, 46], [48, 58], [50, 78]], m:'pink', tone:'dark', w:2.5 },
  { t:'line', pts:[[22, 52], [30, 50], [36, 56]], m:'pink', tone:'dark', w:2.5 },
  { t:'line', pts:[[30, 34], [36, 40], [34, 46]], m:'pink', tone:'dark', w:2.5 },
  { t:'line', pts:[[62, 32], [66, 40], [74, 40]], m:'pink', tone:'dark', w:2.5 },
  { t:'line', pts:[[64, 54], [72, 56], [80, 52]], m:'pink', tone:'dark', w:2.5 },
  { t:'line', pts:[[34, 70], [40, 64]], m:'pink', tone:'dark', w:2.5 }, { t:'line', pts:[[62, 72], [60, 64]], m:'pink', tone:'dark', w:2.5 },
  { t:'shine', cx:32, cy:30, rx:6, ry:3, rot:-25, ox:50, oy:50 },
]});
// nyomozó: arc helyett kalap + nagyító
ART.add('nyomozo', { emoji:['🕵️'], hu:'nyomozó', en:'detective hat and magnifying glass', shapes:[
  { t:'ellipse', cx:42, cy:46, rx:34, ry:9, m:'wood', tone:'dark' },
  { t:'path', m:'wood', p:'M21 46 C19 28 26 14 35 16 C39 20 46 20 50 16 C58 14 66 28 63 46 Z' },
  { t:'rect', x:20, y:36, w:44, h:8, m:'dark', fc:'h' },
  { t:'rect', x:73, y:66, w:10, h:26, r:4, m:'dark', fc:'v', rot:-45, ox:78, oy:79 },
  { t:'circle', cx:60, cy:62, r:19, m:'gold' },
  { t:'circle', cx:60, cy:62, r:13, m:'glass' },
  { t:'shine', cx:54, cy:56, rx:4, ry:7, rot:40, ox:50, oy:50 },
]});
// cumisüveg: aranyos „baba” jel arc nélkül (a tartalomban: babaruha)
ART.add('cumisuveg', { emoji:['👶'], hu:'cumisüveg', en:'baby bottle', shapes:[
  { t:'path', m:'honey', p:'M50 7 C55 7 57 11 57 16 L60 24 H40 L43 16 C43 11 45 7 50 7 Z' },
  { t:'rect', x:34, y:22, w:32, h:12, r:3, m:'sky', fc:'h' },
  { t:'rect', x:30, y:32, w:40, h:60, r:12, m:'white', fc:'v' },
  { t:'path', m:'cream', fc:'h', p:'M31 56 H69 V80 C69 87 65 91 58 91 H42 C35 91 31 87 31 80 Z' },
  ...[46, 58, 70].map(y => ({ t:'line', pts:[[31, y], [40, y]], m:'white', tone:'dark', w:2 })),
  { t:'shine', x:58, y:38, w:4, h:34 },
]});
