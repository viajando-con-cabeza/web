/* VCC: test d'integritat de les fotos úniques dels catàlegs. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const root=resolve(__dirname,'../..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const pages={"index.html":4,"itinerarios/index.html":3,"planifica/que-llevar/index.html":1,"planifica/presupuesto/index.html":1,"planifica/donde-ir/index.html":2};
for(const [file,expected] of Object.entries(pages)){
 const html=read(file);
 const covers=[...html.matchAll(/<img\b[^>]*class="vcc-card-cover-photo"[^>]*>/g)].map(m=>m[0]);
 assert.equal(covers.length,expected,file+': nombre de fotos únic incorrecte');
 assert.doesNotMatch(html,/data-vcc-it-(?:gallery|slide|count|dir)/,file+': torna el carrusel de fotos');
 assert.doesNotMatch(html,/itinerarios-galeria-vcc\.js/,file+': JS de carrusel innecessari');
 assert.match(html,/vcc-foto-unica-targetes\.css/,file+': manca CSS compartit');
 for(const tag of covers){
  assert.match(tag,/\balt="[^"]+"/,file+': manca text alternatiu');
  assert.match(tag,/\bsrcset="[^"]+\/mini\/[^"]+480w, [^"]+\/visor\/[^"]+1800w"/,file+': manca srcset');
  assert.match(tag,/\bloading="lazy"/,file+': la foto ha de ser diferida');
 }
}
const home=read('index.html');
assert.match(home,/data-home-carousel="itinerarios"/);
assert.match(home,/data-home-carousel="guías"/);
assert.match(home,/inicio-destacados\.js/);
console.log('VCC: fotos úniques en 5 pàgines, carrusels de targetes conservats.');
