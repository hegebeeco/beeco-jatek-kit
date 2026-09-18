// ============================================================
//  MECHANIKA 1 – DÖNTÉSKÁRTYA: a logika (sor + késleltetett következmények)
//
//  Mire jó? Polgármester egy napra, Greenwashing-stílusú „húzd balra / jobbra” játékok.
//  A kártyák egy SORBAN (pakliban) jönnek. Egy döntés később visszaüthet: a queue.schedule(kártya, n)
//  úgy teszi be a következmény-kártyát, hogy előtte még pontosan n másik kártya jöjjön.
//  Tiszta logika (nincs benne DOM) → Node-ban tesztelhető: tests/check-mech.js.
//  Böngészőben: MechKartya.queue(...) · Node-ban: require('web/js/mech/kartya-logika.js').queue(...)
//  A felület (húzás, gombok, kirepülés): kartya-ui.js. Leírás: docs/mechanikak.md
// ============================================================
(function(root){
  // queue(pakli, beállítások) → sor-objektum
  //   opts.followUp(kártya, oldal) → { card, after } | null   – a döntésből automatikusan jövő következmény
  //   A kártya saját mezője is lehet: card.left.then / card.right.then = { card:{…}, after:2 }
  function queue(cards, opts = {}){
    const deck = (cards || []).slice();
    const later = [];          // ütemezett következmények: { due, seq, card }
    let drawn = 0, seq = 0, current = null;
    const history = [];        // [{ card, side }] – a profilhoz / kör végi összegzéshez

    const q = {
      // következő kártya: ha egy következmény „esedékes”, az jön; különben a pakli teteje;
      // ha a pakli elfogyott, a még függő következmények sorban jönnek (nem vesznek el)
      next(){
        let i = -1;
        for(let k = 0; k < later.length; k++){
          const e = later[k];
          if(e.due <= drawn && (i < 0 || e.due < later[i].due || (e.due === later[i].due && e.seq < later[i].seq))) i = k;
        }
        if(i < 0 && !deck.length && later.length){          // pakli vége: a legkorábbi függő jön
          i = 0; for(let k = 1; k < later.length; k++) if(later[k].due < later[i].due || (later[k].due === later[i].due && later[k].seq < later[i].seq)) i = k;
        }
        current = i >= 0 ? later.splice(i, 1)[0].card : (deck.length ? deck.shift() : null);
        if(current) drawn++;
        return current;
      },
      // következmény ütemezése: after = hány MÁSIK kártya jöjjön előtte (0 = rögtön a következő)
      schedule(card, after = 0){
        if(!card) return q;
        later.push({ due:drawn + Math.max(0, Math.floor(after)), seq:seq++, card });
        return q;
      },
      // döntés rögzítése – a kártya/beállítás szerinti következményt magától ütemezi
      decide(side, card = current){
        if(!card) return null;
        history.push({ card, side });
        const own = card[side] && card[side].then;
        const f = own || (opts.followUp ? opts.followUp(card, side) : null);
        if(f && f.card) q.schedule(f.card, f.after || 0);
        return f || null;
      },
      current:() => current,
      drawn:() => drawn,                                // eddig kihúzott kártyák száma
      pending:() => later.map(e => ({ card:e.card, in:Math.max(0, e.due - drawn) })),   // in = ennyi másik kártya van még előtte
      remaining:() => deck.length + later.length,
      history:() => history.slice(),
      done:() => !deck.length && !later.length,
    };
    return q;
  }

  const api = { queue };
  if(typeof module !== 'undefined' && module.exports){ module.exports = api; return; }
  root.MechKartya = Object.assign(root.MechKartya || {}, api);
})(typeof window !== 'undefined' ? window : globalThis);
