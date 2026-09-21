// ============================================================
//  NYELV (i18n) — magyar / angol a beeco játékokban
//
//  Elv: a kódban a MAGYAR szöveg marad a kulcs – tr('Kezdés') → angolul 'Start' a szótárból; ha egy fordítás hiányzik,
//  a magyar szöveg jelenik meg (nem törik el semmi), és a tests/check-i18n.js jelzi a hiányt.
//  • tr('{n} pont', { n:12 }) – változók {név} alakban · I18N.tr = tr
//  • Szótár: web/js/i18n/en-*.js fájlok: I18N.add('en', { 'Kezdés':'Start', … }) (modulonként egy fájl – nem ütköznek)
//  • Tartalom (JSON): web/data/x.json magyar, web/data/en/x.json angol – I18N.fetchJSON('data/x.json') a nyelv szerint tölt,
//    és ha nincs angol, a magyarra esik vissza. Az angol fájl szerkezete (azonosítók, számok, linkek) egyezik a magyarral.
//  • HTML: <b data-i18n>Kezdés</b> szövege, data-i18n-attr="placeholder,aria-label,title" attribútumai – I18N.applyDom().
//  • Nyelv: ?lang=en|hu az URL-ben > mentett választás (beeco_lang) > a böngésző nyelvei (ha van köztük magyar → magyar, különben angol).
//  • Számok/dátum: I18N.locale ('hu-HU' | 'en-GB'), I18N.num(v, tizedes).
//  • Nyelvválasztó: I18N.selectorHTML() (ds-seg: HU | EN) – a kattintást egy közös figyelő kezeli (bind nem kell); váltáskor az oldal újratölt (a ?lang= nélkül).
// ============================================================
(function(root){
  const LANGS = { hu:{ nev:'Magyar', rovid:'HU', locale:'hu-HU' }, en:{ nev:'English', rovid:'EN', locale:'en-GB' } };
  const dict = { hu:{}, en:{} }, missing = new Set();
  const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} } };
  function detect(){
    if(typeof location === 'undefined') return 'hu';
    const q = new URLSearchParams(location.search).get('lang');
    if(q && LANGS[q]){ store.set('beeco_lang', q); return q; }
    const s = store.get('beeco_lang'); if(s && LANGS[s]) return s;
    const nav = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    return nav.some(l => /^hu\b/i.test(l || '')) || !nav.length ? 'hu' : 'en';
  }
  let lang = detect();
  if(typeof document !== 'undefined') document.documentElement.lang = lang;
  const fill = (s, vars) => !vars ? s : String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  function tr(hu, vars){
    if(hu == null) return '';
    if(lang === 'hu') return fill(hu, vars);
    const t = dict[lang][hu];
    if(t == null){ missing.add(hu); return fill(hu, vars); }
    return fill(t, vars);
  }
  const I18N = {
    LANGS, tr,
    get lang(){ return lang; }, get locale(){ return LANGS[lang].locale; },
    add(l, obj){ Object.assign(dict[l] || (dict[l] = {}), obj); },
    has(hu){ return lang === 'hu' || dict[lang][hu] != null; },
    // váltás: mentés, és újratöltés az URL ?lang= paramétere NÉLKÜL (különben a link nyelve felülírná a választást)
    set(l){ if(!LANGS[l] || l === lang) return; store.set('beeco_lang', l);
      if(typeof location === 'undefined') return;
      const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.toString()); },
    num(v, d){ return new Intl.NumberFormat(LANGS[lang].locale, { maximumFractionDigits:d || 0, minimumFractionDigits:d || 0 }).format(v); },
    dataUrl(p){ return lang === 'hu' ? p : p.replace(/^(\.?\/?)(data\/)/, `$1$2${lang}/`); },
    // tartalom a nyelv szerint; ha az angol hiányzik, a magyar jön (a konzolba egy figyelmeztetés kerül)
    fetchJSON(p, opts){
      const get = u => fetch(u, Object.assign({ cache:'no-cache' }, opts || {})).then(r => { if(!r.ok) throw new Error(u + ': HTTP ' + r.status); return r.json(); });
      if(lang === 'hu') return get(p);
      return get(I18N.dataUrl(p)).catch(() => { console.info('[i18n] nincs ' + lang + ' tartalom, magyar jön: ' + p); return get(p); });
    },
    applyDom(rootEl){
      if(lang === 'hu' || typeof document === 'undefined') return;
      const r = rootEl || document;
      r.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n') || el.textContent.trim(); el.textContent = tr(k); });
      r.querySelectorAll('[data-i18n-attr]').forEach(el => el.getAttribute('data-i18n-attr').split(',').forEach(a => {
        a = a.trim(); const v = el.getAttribute(a); if(v) el.setAttribute(a, tr(v)); }));
    },
    selectorHTML(){
      return `<div class="ds-seg ds-lang" role="radiogroup" aria-label="${tr('Nyelv')}">${Object.entries(LANGS).map(([k, L]) =>
        `<button type="button" role="radio" lang="${k}" aria-checked="${k === lang}" class="${k === lang ? 'on' : ''}" data-lang="${k}" title="${L.nev}">${L.rovid}</button>`).join('')}</div>`;
    },
    bind(el){ el.addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if(!b) return; e.stopPropagation(); I18N.set(b.dataset.lang); }); },
    hianyzik(){ return [...missing]; },                            // fejlesztéshez: melyik szöveg nem fordított (konzolból)
  };
  root.I18N = I18N; root.tr = tr;
  if(typeof module !== 'undefined' && module.exports) module.exports = I18N;
  if(typeof document !== 'undefined'){
    document.addEventListener('DOMContentLoaded', () => I18N.applyDom());
    // minden nyelvválasztó (I18N.selectorHTML) magától működik: egy közös, elkapó (capture) kattintás-figyelő
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.ds-lang [data-lang]'); if(!b) return;
      e.preventDefault(); e.stopPropagation(); I18N.set(b.dataset.lang); }, true);
  }
})(typeof window !== 'undefined' ? window : globalThis);
