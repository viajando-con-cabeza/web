/* Contractes VCC: aerolínies, taula mòbil i exportació PDF, sense dades inventades. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resumirComparacion} from '../js/componentes/vcc-vuelos-pdf.js';
const html=fs.readFileSync('planifica/vuelos/index.html','utf8');
const css=fs.readFileSync('configuracion/css/componentes/planifica-vuelos-comparador-vcc.css','utf8');
const js=fs.readFileSync('configuracion/js/planifica-vuelos.js','utf8');
const pdf=fs.readFileSync('configuracion/js/componentes/vcc-vuelos-pdf.js','utf8');
const links=[...html.matchAll(/<a class="vl-air-action" href="([^"]+)" target="_blank" rel="noopener noreferrer"[^>]*>WEB OFICIAL/g)];
assert.equal(links.length,16,'Les 16 aerolínies han d’enllaçar al web oficial');
links.forEach(m=>assert.ok(m[1].startsWith('https://'),'URL d’aerolínia insegura'));
assert.doesNotMatch(html,/data-use-airline|data-save-comparison|data-share-comparison|data-share-fallback/);
assert.match(html,/data-export-pdf/);
assert.match(js,/data-export-pdf/);
assert.match(css,/@media\(max-width:720px\)\s*\{[\s\S]*?#calculadora \.vl-calc-table tr>\*:first-child\{position:static/);
assert.match(pdf,/logo-vcc\.svg/);
assert.match(pdf,/jspdf\/4\.2\.1/);
const flights=[
 {airline:'ryanair',route:'BCN - ARN',base:'35.5',baggage:'15',seat:'',food:'',transfer:'12'},
 {airline:'vueling',route:'BCN - ARN',base:'60',baggage:'0',seat:'',food:'',transfer:'10'},
 {airline:'',route:'',base:'',baggage:'',seat:'',food:'',transfer:''}
];
const result=resumirComparacion(flights);
assert.equal(result.valid.length,2);
assert.equal(result.lowest,62.5);
assert.equal(result.winners[0].index,0);
assert.equal(result.items[1].total,70);
assert.equal(resumirComparacion([flights[0]]).lowest,null);
assert.equal(resumirComparacion([{...flights[0],base:''}]).valid.length,0);
console.log('VCC Vuelos OK: 16 webs oficials, scroll mòbil complet, PDF i càlculs.');
