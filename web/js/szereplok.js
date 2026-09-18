// ============================================================
//  KÖZÖS SZEREPLŐK — a beeco játékok rajzolt figurái (SVG, kódból – nincs letöltendő kép)
//  Eredet: az Ökos-rejtély Zöldi családja (Anya, Apa, Panni, Marci, Nagyi). beeco-stílus: olívazöld körvonal, telt színek.
//  Használat: szereploHTML('anya', 'talk' | 'happy' | 'sad') · a méhecske ('meh') a valódi beeco-kép (DS.moods).
//  Új szereplő: szereploHozzaad('id', { skin, hair, style, shirt, extra, hat?, hatColor?, detail?, apron?, pack? }, 'Név').
//    style:  'short' | 'long' | 'ponytail' | 'spiky' | 'bun' | 'bob' | 'curly' | 'bald'
//    extra:  'glasses' | 'beard' | 'earring' | 'freckles' | 'mustache' | ''   (tömb is lehet: ['glasses', 'mustache'])
//    hat:    'cap' (svájcisapka) | 'driver' (tányérsapka) | 'helmet' (bukósisak) | 'sun' (szalmakalap) | 'scarf' (kendő)   + hatColor
//    detail: 'apron' (kötény, szín: apron) | 'collar' (gallér, zakó; a belső ing színe: inner) | 'tie' (nyakkendő) | 'backpack' (hátizsák-pánt, szín: pack)
//            | 'stethoscope'   (tömb is lehet)
//  A városlakók (2026-09-18, pl. a „Polgármester egy napra” játékhoz) KITALÁLT figurák: valódi személyt, pártszínt vagy -jelet nem viselnek.
//  A bőr-, haj- és ruhaszínek TARTALOM-színek (a figura kinézete), a körvonal és a szem a design system olívája.
// ============================================================
const SZEREPLO_KINEZET = {
  anya:  { skin:'#f2c9a5', hair:'#7a3e1d', style:'long',     shirt:'#f28bb3', extra:'earring' },
  apa:   { skin:'#e9bb94', hair:'#3b2a1e', style:'short',    shirt:'#6fa8dc', extra:'beard' },
  panni: { skin:'#f5d1b0', hair:'#d99a3a', style:'ponytail', shirt:'#b784d6', extra:'' },
  marci: { skin:'#f2c9a5', hair:'#c0662a', style:'spiky',    shirt:'#7bc86c', extra:'freckles' },
  nagyi: { skin:'#f0cdb2', hair:'#d9d9d9', style:'bun',      shirt:'#f2c14e', extra:'glasses' },
  // a város lakói – kitalált figurák, változatos kor, nem és bőrszín; a polgármester ruhája szándékosan semleges (nincs pártszín)
  polgarmester:{ skin:'#c68a5e', hair:'#2b2019', style:'bob',   shirt:'#8a9a7b', extra:'earring', detail:'collar' },
  boltos:      { skin:'#e9bb94', hair:'#5a3a22', style:'short', shirt:'#b1deff', extra:'mustache', detail:'apron', apron:'#fecf39' },
  diak:        { skin:'#8d5a3b', hair:'#1f1a17', style:'curly', shirt:'#f5b4c7', extra:'', hat:'helmet', hatColor:'#6fa8dc', detail:'backpack', pack:'#fecf39' },
  nyugdijas:   { skin:'#f0cdb2', hair:'#e6e6e6', style:'bald',  shirt:'#a8743a', extra:'mustache', hat:'cap', hatColor:'#7c8a6a' },
  kertesz:     { skin:'#d9a47a', hair:'#7a3e1d', style:'ponytail', shirt:'#7bc86c', extra:'freckles', hat:'sun', hatColor:'#f2d98c', detail:'apron', apron:'#8c6636' },
  buszsofor:   { skin:'#b97a4f', hair:'#2b2019', style:'short', shirt:'#d6e8f7', extra:'beard', hat:'driver', hatColor:'#3f5f8a', detail:'tie' },
  orvos:       { skin:'#f5d1b0', hair:'#3b2a1e', style:'bun',   shirt:'#fffdf6', inner:'#8fc7c0', extra:'', detail:['collar', 'stethoscope'] },
  tanar:       { skin:'#e0ac85', hair:'#8a8a8a', style:'short', shirt:'#f2c14e', extra:'glasses', detail:'collar' },
};

function szereploSVG(id, mood){
  const L = SZEREPLO_KINEZET[id]; if(!L) return null;
  const S = `stroke="${DS.color.olive}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;   // körvonal: a design system olívája
  const hairBack = { long:`<path d="M22 50 Q20 92 34 100 L86 100 Q100 92 98 50 Q96 18 60 16 Q24 18 22 50Z" fill="${L.hair}" ${S}/>`,
                     ponytail:`<path d="M92 44 Q116 52 106 88 Q100 70 90 62Z" fill="${L.hair}" ${S}/>`,
                     bun:`<circle cx="60" cy="16" r="13" fill="${L.hair}" ${S}/>`,
                     bob:`<path d="M26 54 Q24 88 38 92 L82 92 Q96 88 94 54 Q92 20 60 20 Q28 20 26 54Z" fill="${L.hair}" ${S}/>`,
                     curly:`<g fill="${L.hair}" ${S}>${[[30,46],[36,30],[50,21],[70,21],[84,30],[90,46],[92,62],[28,62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join('')}</g>` }[L.style] || '';
  const hairTop = { long:`<path d="M30 52 Q32 22 60 22 Q88 22 90 52 Q76 36 58 38 Q42 40 30 52Z" fill="${L.hair}" ${S}/>`,
                    short:`<path d="M32 48 Q30 20 60 20 Q90 20 88 48 Q80 32 60 32 Q40 32 32 48Z" fill="${L.hair}" ${S}/>`,
                    ponytail:`<path d="M31 50 Q30 22 60 22 Q90 22 89 50 Q74 34 50 36 Q38 40 31 50Z" fill="${L.hair}" ${S}/>`,
                    spiky:`<path d="M30 50 L34 24 L44 34 L50 16 L60 30 L70 14 L76 32 L86 22 L90 50 Q74 38 60 38 Q44 38 30 50Z" fill="${L.hair}" ${S}/>`,
                    bun:`<path d="M31 50 Q32 26 60 26 Q88 26 89 50 Q76 38 60 38 Q44 38 31 50Z" fill="${L.hair}" ${S}/>`,
                    bob:`<path d="M30 56 Q30 24 60 24 Q90 24 90 56 Q84 40 72 36 Q60 44 40 40 Q32 46 30 56Z" fill="${L.hair}" ${S}/>`,
                    curly:`<g fill="${L.hair}" ${S} stroke-width="3">${[[40,34],[52,29],[66,29],[79,34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
                    bald:`<path d="M31 58 Q28 42 37 37 Q38 48 35 60Z M89 58 Q92 42 83 37 Q82 48 85 60Z" fill="${L.hair}" ${S} stroke-width="3"/>` }[L.style] || '';
  const mouth = mood === 'talk' ? `<ellipse cx="60" cy="72" rx="8" ry="6" fill="#7a2a2a" ${S} stroke-width="3"/>`
    : `<path d="M50 70 Q60 ${mood === 'sad' ? 64 : 78} 70 70" fill="none" ${S} stroke-width="3.5"/>`;
  const EXTRA = {
    earring:`<circle cx="30" cy="66" r="3.5" fill="${DS.color.honey}" ${S} stroke-width="2"/><circle cx="90" cy="66" r="3.5" fill="${DS.color.honey}" ${S} stroke-width="2"/>`,
    beard:`<path d="M34 62 Q36 90 60 92 Q84 90 86 62 Q80 80 60 80 Q40 80 34 62Z" fill="${L.hair}" ${S} stroke-width="3"/>`,
    freckles:`<g fill="#c0662a"><circle cx="44" cy="64" r="1.6"/><circle cx="49" cy="67" r="1.6"/><circle cx="71" cy="67" r="1.6"/><circle cx="76" cy="64" r="1.6"/></g>`,
    glasses:`<g fill="none" ${S} stroke-width="3"><circle cx="47" cy="55" r="9"/><circle cx="73" cy="55" r="9"/><path d="M56 55 L64 55"/></g>`,
    mustache:`<path d="M46 68 Q53 61 60 65.5 Q67 61 74 68 Q67 70.5 60 68 Q53 70.5 46 68Z" fill="${L.hair}" ${S} stroke-width="2.5"/>`,
  };
  const extra = [].concat(L.extra || []).map(k => EXTRA[k] || '').join('');
  // fejfedő (a haj fölé kerül) – a hatColor tartalom-szín, a sötét részek a design system olívája
  const H = L.hatColor || DS.color.honey, dark = DS.color['olive-soft'];
  const hat = {
    cap:`<path d="M27 42 Q27 15 60 15 Q93 15 93 42Z" fill="${H}" ${S}/><path d="M29 42 Q60 51 91 42 Q60 36 29 42Z" fill="${dark}" ${S} stroke-width="3"/>`,
    driver:`<path d="M31 42 L25 26 Q60 12 95 26 L89 42Z" fill="${H}" ${S}/><path d="M31 42 H89 V48 H31Z" fill="${dark}" ${S} stroke-width="3"/><path d="M34 48 Q60 60 86 48Z" fill="${DS.color.olive}" ${S} stroke-width="3"/><circle cx="60" cy="31" r="4.5" fill="${DS.color.honey}" ${S} stroke-width="2"/>`,
    helmet:`<path d="M32 50 Q34 74 44 86 M88 50 Q86 74 76 86" fill="none" ${S} stroke-width="2.5"/><path d="M25 50 Q25 14 60 14 Q95 14 95 50 Q60 41 25 50Z" fill="${H}" ${S}/><path d="M47 19 L45 33 M60 16 V32 M73 19 L75 33" fill="none" ${S} stroke-width="3"/>`,
    sun:`<ellipse cx="60" cy="37" rx="47" ry="10" fill="${H}" ${S}/><path d="M37 37 Q36 11 60 11 Q84 11 83 37Z" fill="${H}" ${S}/><path d="M37.5 29 Q60 35 82.5 29 L83 36 Q60 41 37 36Z" fill="${DS.color.leaf}" ${S} stroke-width="2.5"/>`,
    scarf:`<path d="M24 58 Q22 20 60 18 Q98 20 96 58 Q90 36 60 34 Q30 36 24 58Z" fill="${H}" ${S}/><path d="M30 64 Q34 92 50 96 L70 96 Q86 92 90 64" fill="none" ${S} stroke-width="3"/>`,
  }[L.hat] || '';
  // ruha-részlet (a póló fölé)
  const DETAIL = {
    apron:`<path d="M44 100 L40 112 L36 130 H84 L80 112 L76 100" fill="none" ${S} stroke-width="3"/><path d="M40 112 H80 L84 130 H36Z" fill="${L.apron || DS.color.honey}" ${S} stroke-width="3"/><path d="M52 118 H68 V126 H52Z" fill="none" ${S} stroke-width="2.5"/>`,
    collar:`<path d="M50 99 L60 120 L70 99Z" fill="${L.inner || DS.color.paper}" ${S} stroke-width="3"/><path d="M50 99 L44 110 L57 114 M70 99 L76 110 L63 114" fill="none" ${S} stroke-width="3"/>`,
    tie:`<path d="M50 99 L60 112 L70 99Z" fill="${DS.color.paper}" ${S} stroke-width="3"/><path d="M57 106 H63 L65 122 L60 128 L55 122Z" fill="${dark}" ${S} stroke-width="2.5"/>`,
    backpack:`<path d="M26 108 L37 101 L42 130 H32Z M94 108 L83 101 L78 130 H88Z" fill="${L.pack || DS.color.honey}" ${S} stroke-width="3"/>`,
    stethoscope:`<path d="M46 99 Q47 118 60 119 Q73 118 74 99" fill="none" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/><path d="M66 118 Q70 122 68 125" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="67" cy="126" r="3.5" fill="#c7cfc4" ${S} stroke-width="2"/>`,
  };
  const detail = [].concat(L.detail || []).map(k => DETAIL[k] || '').join('');
  return `<svg class="szereplo" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${hairBack}
    <path d="M18 130 Q20 100 60 98 Q100 100 102 130Z" fill="${L.shirt}" ${S}/>
    <rect x="50" y="84" width="20" height="16" fill="${L.skin}" ${S} stroke-width="3"/>
    ${detail}
    <ellipse cx="60" cy="58" rx="30" ry="32" fill="${L.skin}" ${S}/>
    ${hairTop}${hat}
    <circle cx="47" cy="55" r="4" fill="${DS.color.olive}"/><circle cx="73" cy="55" r="4" fill="${DS.color.olive}"/>
    <circle cx="45.5" cy="53.5" r="1.3" fill="#fff"/><circle cx="71.5" cy="53.5" r="1.3" fill="#fff"/>
    <ellipse cx="40" cy="68" rx="5" ry="3" fill="#f28b8b" opacity=".45"/><ellipse cx="80" cy="68" rx="5" ry="3" fill="#f28b8b" opacity=".45"/>
    ${mouth}${extra}
  </svg>`;
}
const SZEREPLO_NEV = { anya:'Anya', apa:'Apa', panni:'Panni', marci:'Marci', nagyi:'Nagyi', meh:'beeco méhecske',
  polgarmester:'Polgármester', boltos:'Boltos', diak:'Diák', nyugdijas:'Nyugdíjas szomszéd', kertesz:'Kertész', buszsofor:'Buszsofőr',
  orvos:'Orvos', tanar:'Tanár' };
function szereploHozzaad(id, kinezet, nev){ SZEREPLO_KINEZET[id] = kinezet; if(nev) SZEREPLO_NEV[id] = nev; }
function szereploHTML(id, mood){
  if(id === 'meh') return `<img class="szereplo" src="${dsMood(mood === 'sad' ? 'think' : 'good')}" alt="">`;
  return szereploSVG(id, mood) || '';
}
