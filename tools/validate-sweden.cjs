'use strict';
// Comprobación sin dependencias: ejecuta datos, componentes y plantilla reales.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = {innerHTML: ''};
const context = vm.createContext({
  window: {},
  document: {readyState: 'complete', getElementById: id => id === 'country-content' ? root : null},
  console
});
const execute = file => vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
const original = fs.readFileSync('js/paises/suecia.js', 'utf8');
const migrated = fs.readFileSync('web/content/destinos/suecia.js', 'utf8');
assert.equal(migrated, original, 'El contenido original de Suecia debe conservarse íntegro');

execute('web/content/destinos/suecia.js');
execute('web/components/country-cards.js');
execute('web/templates/country.js');
assert.match(root.innerHTML, /<h1>SUECIA<\/h1>/);
assert.match(root.innerHTML, /id="guias"/);
assert.match(root.innerHTML, /id="itinerarios"/);
assert.match(root.innerHTML, /id="faq"/);
assert.match(root.innerHTML, /id="planifica"/);
assert.match(root.innerHTML, /id="planificador"/);
assert.equal((root.innerHTML.match(/class="country-guide-card"/g) || []).length, context.window.SWEDEN_CONTENT.guides.length);
assert.equal((root.innerHTML.match(/class="country-itinerary"/g) || []).length, context.window.SWEDEN_CONTENT.itineraries.length);

const entry = fs.readFileSync('destinos/suecia/index.html', 'utf8');
for (const file of ['../../web/config/theme.css','../../web/content/destinos/suecia.js','../../web/components/country-cards.js','../../web/templates/country.js','../../js/paises/suecia-ui.js']) {
  assert.ok(entry.includes(file), `Falta la referencia ${file}`);
  assert.ok(fs.existsSync(path.resolve('destinos/suecia',file)), `No existe el recurso ${file}`);
}
assert.match(entry, /https:\/\/viajandoconcabeza\.com\/destinos\/suecia\//, 'La URL canónica debe mantenerse');

// El mismo molde tiene que permitir un único lugar y omitir bloques opcionales.
const originalContent = context.window.SWEDEN_CONTENT;
context.window.VCC_COUNTRY_CONTENT = {...originalContent,name: 'Prueba',guides: [originalContent.guides[0]],itineraries: [],faq: [],preparation: [],planner: null};
execute('web/templates/country.js');
assert.match(root.innerHTML, /<h1>PRUEBA<\/h1>/);
assert.equal((root.innerHTML.match(/class="country-guide-card"/g) || []).length, 1);
assert.doesNotMatch(root.innerHTML, /id="planificador"/);
console.log('Suecia: estructura, contenido íntegro, enlaces locales y plantilla flexible — OK');
