// ============================================================
//  HANG — közös hangkezelés a beeco játékokhoz: némítás, halk háttérzene, rövid hangjelzés, rezgés
//  A visszajelző hangok (jó / majdnem) a design systemben vannak: dsSound / dsFeedback (web/js/ds.js). Ez a fájl a többit adja.
//  Mentés az eszközön ugyanazokkal a kulcsokkal, mint a beeco-szelektalj játékokban (beeco_muted, beeco_music, beeco_haptic),
//  így a közös címen futó játékok beállítása közös. Böngésző csak felhasználói gesztus után ad hangot: az első kattintáskor indul.
// ============================================================
const beecoHang = (function(){
  const ls = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };
  let AC = null, timer = null, idx = 0;
  const S = { muted:ls('beeco_muted', '0') === '1', music:ls('beeco_music', '1') !== '0', haptic:ls('beeco_haptic', '1') !== '0' };
  const audio = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
  function beep(freq, dur, type, vol){ if(S.muted) return; const a = audio(); if(!a) return; const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.06; o.connect(g); g.connect(a.destination);
    const t = a.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12)); o.stop(t + (dur || 0.12)); }
  // halk pad-akkordok (nagyon alacsony hangerő, 3,9 mp-enként) – ugyanaz a hangzás, mint a Szelektálj!-ban
  const CHORDS = [[220, 277, 330], [196, 247, 294], [247, 294, 370], [165, 208, 262]];
  function chord(){ if(S.muted || !S.music) return; const a = audio(); if(!a) return; const t0 = a.currentTime, ch = CHORDS[idx++ % CHORDS.length];
    ch.forEach(f => { const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
      o.type = 'sine'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 850; o.connect(lp); lp.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.028, t0 + 1.3); g.gain.linearRampToValueAtTime(0.0001, t0 + 3.7);
      o.start(t0); o.stop(t0 + 3.9); }); }
  const zeneStart = () => { if(timer || S.muted || !S.music) return; chord(); timer = setInterval(chord, 3900); };
  const zeneStop = () => { if(timer){ clearInterval(timer); timer = null; } };
  // a ds.js visszajelzése ezt hívja rezgésre (window.haptic)
  if(typeof window !== 'undefined' && typeof window.haptic !== 'function')
    window.haptic = p => { if(S.haptic) try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };
  return {
    audio, beep, zeneStart, zeneStop,
    get muted(){ return S.muted; }, get music(){ return S.music; }, get haptic(){ return S.haptic; },
    setMuted(m){ S.muted = !!m; lsSet('beeco_muted', m ? '1' : '0'); m ? zeneStop() : zeneStart(); },
    setMusic(on){ S.music = !!on; lsSet('beeco_music', on ? '1' : '0'); on ? zeneStart() : zeneStop(); },
    setHaptic(on){ S.haptic = !!on; lsSet('beeco_haptic', on ? '1' : '0'); },
  };
})();
// a design system hangjai (dsSound → beep) is ezen mennek át, így a némítás rájuk is érvényes
if(typeof window !== "undefined" && typeof window.beep !== "function") window.beep = (f, d, t, v) => beecoHang.beep(f, d, t, v);
