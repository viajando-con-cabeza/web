/* Contractes VCC: aerolínies, taula mòbil i exportació PDF, sense dades inventades. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resumirComparacion,PDF_LAYOUT_VCC,exportarComparacionPDF} from '../js/componentes/vcc-vuelos-pdf.js';
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

/* Prova real de l'execució del generador: renderitzat de totes les files,
 * consell VCC a la dreta i annex per a trajectes llargs. Sense xarxa ni DOM.
 */
const L=PDF_LAYOUT_VCC;
assert.equal(L.rows.length,8);
assert.ok(L.tableX+L.tableWidth<L.adviceX,"El consell ha d'anar al costat de la taula");
assert.ok(L.adviceY>=L.tableY+L.headHeight,'La targeta comença sota la capçalera');
assert.ok(L.tableY+L.headHeight+L.rows.reduce((n,row)=>n+row.height,0)<190,
  'La taula ha de cabre en una pàgina A4 apaïsada');
assert.match(pdf,/MEJOR OPCIÓN VCC/);
assert.match(pdf,/LO QUE TE AHORRAS/);
assert.match(pdf,/Nuestro consejo/);
assert.match(pdf,/ICON_SPRITE/);
class FakePdf{
  static instances=[];
  constructor(options){this.options=options;this.ops=[];this.size=8;this.pages=1;FakePdf.instances.push(this);}
  setProperties(data){this.properties=data;}
  setLineWidth(){}
  setFillColor(){}
  setDrawColor(){}
  setTextColor(){}
  setFont(){}
  setFontSize(size){this.size=size;}
  rect(...args){this.ops.push(['rect',...args]);}
  roundedRect(...args){this.ops.push(['roundedRect',...args]);}
  line(...args){this.ops.push(['line',...args]);}
  circle(...args){this.ops.push(['circle',...args]);}
  text(...args){this.ops.push(['text',...args]);}
  getTextWidth(value){return String(value).length*this.size*.185;}
  splitTextToSize(value,maxWidth){
    const str=String(value);
    const n=Math.max(1,Math.floor(maxWidth/(this.size*.185)));
    return str.match(new RegExp('.{1,'+n+'}','g'))||[''];
  }
  addPage(){this.pages++;}
  setPage(page){this.activePage=page;}
  save(name){this.filename=name;}
}
globalThis.window={jspdf:{jsPDF:FakePdf}};
const airlines=[['ryanair','Ryanair'],['vueling','Vueling'],['lufthansa','Lufthansa']];
const filename=await exportarComparacionPDF(flights,airlines);
const generated=FakePdf.instances.at(-1);
assert.match(filename,/^VCC-comparativa-vuelos-\d{4}-\d{2}-\d{2}\.pdf$/);
assert.equal(generated.options.orientation,'landscape');
assert.equal(generated.pages,1);
assert.ok(generated.ops.some(x=>x[0]==='roundedRect'&&x[1]===L.adviceX&&x[2]===L.adviceY),
  'Manca la targeta lateral del consell VCC');
assert.ok(generated.ops.some(x=>x[0]==='roundedRect'&&x[1]===L.tableX&&x[2]===L.tableY),
  "Manca la taula de comparació a l'esquerra");
assert.equal(generated.filename,filename);
const longFlights=[
 ...flights.slice(0,2),
 {airline:'lufthansa',route:'Trayecto extraordinariamente largo con múltiples escalas y varios aeropuertos',base:'35',baggage:'0',seat:'0',food:'0',transfer:'5'},
 {airline:'',route:'',base:'40',baggage:'0',seat:'0',food:'0',transfer:'0'},
 {airline:'',route:'',base:'45',baggage:'0',seat:'0',food:'0',transfer:'0'}
];
await exportarComparacionPDF(longFlights,airlines);
assert.equal(FakePdf.instances.at(-1).pages,2,'Els trajectes llargs han de conservar-se complets');
delete globalThis.window;

console.log('VCC Vuelos OK: 16 webs oficials, scroll mòbil complet, PDF estil VCC i càlculs.');
