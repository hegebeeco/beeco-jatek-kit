# {{NEV}}

beeco webjáték – a [beeco-jatek-kit](https://github.com/hegebeeco/beeco-jatek-kit) sablonjából.

- Kipróbálás helyben: bármilyen statikus szerverrel a `web/` mappából (pl. `npx serve web`), vagy `node tools/jatek-foto.js`.
- Ellenőrzés: `for f in tests/check-*.js; do node $f; done && node tools/smoke.js`
- Közös fájlok frissítése a kitből: `node ~/CLAUDE/beeco-jatek-kit/tools/kit-sync.js .`
