'use strict';
// Comprueba la publicación real de Suecia y conserva las pruebas del piloto de plantilla.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(file, 'utf8');
const routes = [
  'destinos/suecia/index.html',
  'destinos/suecia/estocolmo/index.html',
  'destinos/suecia/estocolmo/imprescindibles.html',
  'destinos/suecia/estocolmo/itinerario.html',
  'destinos/suecia/estocolmo/presupuesto.html',
  'destinos/suecia/estocolmo/cuando-ir.html'
];
for (const file of routes) {
  assert.ok(fs.existsSync(file), `Falta la página ${file}`);
  const html = read(file);
  assert.match(html, /<title>/i, `Falta el título en ${file}`);
  assert.match(html, /rel="canonical"/i, `Falta la URL canónica en ${file}`);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/gi)) {
    const ref = match[1].split(/[?#]/)[0];
    if (/^(?:https?:|\/\/|\/|#|data:)/i.test(ref) || !/\.(?:css|js)$/i.test(ref)) continue;
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), ref)), `Recurso local no encontrado: ${file} → ${ref}`);
  }
}
const sweden = read('destinos/suecia/index.html');
for (const ref of ['../../js/site-header.js','../../js/paises/suecia.js','../../js/paises/suecia-page.js','../../js/paises/suecia-ui.js']) {
  assert.ok(sweden.includes(ref), `La guía de Suecia no carga ${ref}`);
}
const places = read('destinos/suecia/estocolmo/imprescindibles.html');
assert.match(places, /15 imprescindibles/i);
assert.match(places, /gamla-stan/);
assert.match(places, /stromkajen/);
for (const slug of ['imprescindibles','itinerario','presupuesto','cuando-ir']) {
  const alias = `destinos/suecia/estocolmo/${slug}/index.html`;
  assert.ok(fs.existsSync(alias), `Falta la URL sin extensión: ${alias}`);
  assert.ok(read(alias).includes(`/${slug}.html`), `El alias ${slug} no apunta a su página`);
}
assert.ok(read('_redirects').includes('/destinos/suecia/estocolmo/imprescindibles.html 301'), 'Falta el redirect de imprescindibles');

// El prototipo de plantilla sigue siendo una prueba independiente; todavía no es
// la fuente de la página publicada en destinos/suecia/index.html.
const root = {innerHTML: ''};
const context = vm.createContext({
  window: {},
  document: {readyState: 'complete', getElementById: id => id === 'country-content' ? root : null},
  console
});
const execute = file => vm.runInContext(read(file), context, {filename: file});
execute('web/content/destinos/suecia.js');
execute('web/components/country-cards.js');
execute('web/templates/country.js');
assert.match(root.innerHTML, /<h1>SUECIA<\/h1>/);
assert.match(root.innerHTML, /id="guias"/);
assert.match(root.innerHTML, /id="itinerarios"/);
assert.match(root.innerHTML, /id="faq"/);
const originalContent = context.window.SWEDEN_CONTENT;
assert.equal((root.innerHTML.match(/class="country-guide-card"/g) || []).length, originalContent.guides.length);
context.window.VCC_COUNTRY_CONTENT = {...originalContent, name:'Prueba', guides:[originalContent.guides[0]], itineraries:[], faq:[], preparation:[], planner:null};
execute('web/templates/country.js');
assert.match(root.innerHTML, /<h1>PRUEBA<\/h1>/);
assert.equal((root.innerHTML.match(/class="country-guide-card"/g) || []).length, 1);
assert.doesNotMatch(root.innerHTML, /id="planificador"/);
console.log('Suecia: páginas, recursos locales, rutas sin extensión y piloto de plantilla — OK');
