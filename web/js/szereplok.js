// ============================================================
//  KÖZÖS SZEREPLŐK — a beeco játékok rajzolt figurái (SVG, kódból – nincs letöltendő kép)
//  Eredet: az Ökos-rejtély Zöldi családja (Anya, Apa, Panni, Marci, Nagyi). beeco-stílus: olívazöld körvonal, telt színek.
//  Használat: szereploHTML('anya', 'talk' | 'happy' | 'sad') · a méhecske ('meh') a valódi beeco-kép (DS.moods).
//  Új szereplő: szereploHozzaad('tanar', { skin, hair, style:'short'|'long'|'ponytail'|'spiky'|'bun', shirt, extra:'glasses'|'beard'|'earring'|'freckles'|'' }, 'Tanár néni').
//  A bőr-, haj- és ruhaszínek TARTALOM-színek (a figura kinézete), a körvonal és a szem a design system olívája.
// ============================================================
const SZEREPLO_KINEZET = {
  anya:  { skin:'#f2c9a5', hair:'#7a3e1d', style:'long',     shirt:'#f28bb3', extra:'earring' },
  apa:   { skin:'#e9bb94', hair:'#3b2a1e', style:'short',    shirt:'#6fa8dc', extra:'beard' },
  panni: { skin:'#f5d1b0', hair:'#d99a3a', style:'ponytail', shirt:'#b784d6', extra:'' },
  marci: { skin:'#f2c9a5', hair:'#c0662a', style:'spiky',    shirt:'#7bc86c', extra:'freckles' },
  nagyi: { skin:'#f0cdb2', hair:'#d9d9d9', style:'bun',      shirt:'#f2c14e', extra:'glasses' },
};

function szereploSVG(id, mood){
  const L = SZEREPLO_KINEZET[id]; if(!L) return null;
  const S = `stroke="${DS.color.olive}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;   // körvonal: a design system olívája
  const hairBack = { long:`<path d="M22 50 Q20 92 34 100 L86 100 Q100 92 98 50 Q96 18 60 16 Q24 18 22 50Z" fill="${L.hair}" ${S}/>`,
                     ponytail:`<path d="M92 44 Q116 52 106 88 Q100 70 90 62Z" fill="${L.hair}" ${S}/>`,
                     bun:`<circle cx="60" cy="16" r="13" fill="${L.hair}" ${S}/>` }[L.style] || '';
  const hairTop = { long:`<path d="M30 52 Q32 22 60 22 Q88 22 90 52 Q76 36 58 38 Q42 40 30 52Z" fill="${L.hair}" ${S}/>`,
                    short:`<path d="M32 48 Q30 20 60 20 Q90 20 88 48 Q80 32 60 32 Q40 32 32 48Z" fill="${L.hair}" ${S}/>`,
                    ponytail:`<path d="M31 50 Q30 22 60 22 Q90 22 89 50 Q74 34 50 36 Q38 40 31 50Z" fill="${L.hair}" ${S}/>`,
                    spiky:`<path d="M30 50 L34 24 L44 34 L50 16 L60 30 L70 14 L76 32 L86 22 L90 50 Q74 38 60 38 Q44 38 30 50Z" fill="${L.hair}" ${S}/>`,
                    bun:`<path d="M31 50 Q32 26 60 26 Q88 26 89 50 Q76 38 60 38 Q44 38 31 50Z" fill="${L.hair}" ${S}/>` }[L.style] || '';
  const mouth = mood === 'talk' ? `<ellipse cx="60" cy="72" rx="8" ry="6" fill="#7a2a2a" ${S} stroke-width="3"/>`
    : `<path d="M50 70 Q60 ${mood === 'sad' ? 64 : 78} 70 70" fill="none" ${S} stroke-width="3.5"/>`;
  const extra = {
    earring:`<circle cx="30" cy="66" r="3.5" fill="${DS.color.honey}" ${S} stroke-width="2"/><circle cx="90" cy="66" r="3.5" fill="${DS.color.honey}" ${S} stroke-width="2"/>`,
    beard:`<path d="M34 62 Q36 90 60 92 Q84 90 86 62 Q80 80 60 80 Q40 80 34 62Z" fill="${L.hair}" ${S} stroke-width="3"/>`,
    freckles:`<g fill="#c0662a"><circle cx="44" cy="64" r="1.6"/><circle cx="49" cy="67" r="1.6"/><circle cx="71" cy="67" r="1.6"/><circle cx="76" cy="64" r="1.6"/></g>`,
    glasses:`<g fill="none" ${S} stroke-width="3"><circle cx="47" cy="55" r="9"/><circle cx="73" cy="55" r="9"/><path d="M56 55 L64 55"/></g>`,
  }[L.extra] || '';
  return `<svg class="szereplo" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${hairBack}
    <path d="M18 130 Q20 100 60 98 Q100 100 102 130Z" fill="${L.shirt}" ${S}/>
    <rect x="50" y="84" width="20" height="16" fill="${L.skin}" ${S} stroke-width="3"/>
    <ellipse cx="60" cy="58" rx="30" ry="32" fill="${L.skin}" ${S}/>
    ${hairTop}
    <circle cx="47" cy="55" r="4" fill="${DS.color.olive}"/><circle cx="73" cy="55" r="4" fill="${DS.color.olive}"/>
    <circle cx="45.5" cy="53.5" r="1.3" fill="#fff"/><circle cx="71.5" cy="53.5" r="1.3" fill="#fff"/>
    <ellipse cx="40" cy="68" rx="5" ry="3" fill="#f28b8b" opacity=".45"/><ellipse cx="80" cy="68" rx="5" ry="3" fill="#f28b8b" opacity=".45"/>
    ${mouth}${extra}
  </svg>`;
}
const SZEREPLO_NEV = { anya:'Anya', apa:'Apa', panni:'Panni', marci:'Marci', nagyi:'Nagyi', meh:'beeco méhecske' };
function szereploHozzaad(id, kinezet, nev){ SZEREPLO_KINEZET[id] = kinezet; if(nev) SZEREPLO_NEV[id] = nev; }
function szereploHTML(id, mood){
  if(id === 'meh') return `<img class="szereplo" src="${dsMood(mood === 'sad' ? 'think' : 'good')}" alt="">`;
  return szereploSVG(id, mood) || '';
}
