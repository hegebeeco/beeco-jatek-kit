// ============================================================
//  LED-izzó – közös méretek (cm; Y fel, a csatlakozó-csúcs alja Y = 0). Valós méret ≈ 6 cm széles × 11 cm magas.
//  A 2D matricák (matrica.js – vetítéssel) és a 3D modellek (modell.js – esztergálással) is ebből épülnek,
//  így a három szint és a két műfaj arányai egyeznek.
// ============================================================
const DOME_R = 3.0, JOINT_R = 2.42, JOINT_Y = 5.9;
module.exports = {
  tip:    [[0.30, 0.00], [0.45, 0.34]],                            // érintkező csúcs (forraszpötty)
  ins:    [[0.72, 0.34], [0.95, 0.95]],                            // sötét szigetelő gyűrű
  base:   { y0:0.95, y1:3.40, valley:1.28, crest:1.43 },          // E27 menetes fém talp
  collar: [[1.47, 3.40], [1.50, 3.62]],                            // a talp pereme (peremezés)
  neck:   [[1.55, 3.62], [1.74, 4.30], [2.06, 5.15], [2.42, 5.90]],  // bordás műanyag nyak (hűtőborda)
  dome:   { R:DOME_R, jointR:JOINT_R, jointY:JOINT_Y, yc:JOINT_Y + Math.sqrt(DOME_R ** 2 - JOINT_R ** 2) },   // opál (tejfehér) búra
};
