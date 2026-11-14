/**
 * VCC · Una sola font de veritat per al pressupost real d'Estocolm 3 dies.
 * El total VCC de presupuesto.html és el valor publicat; l'itinerari i les
 * tres targetes (Inicio, Itinerarios, Planifica/Dónde ir) han de coincidir.
 *
 * node configuracion/scripts/sincronizar-importe-itinerario-vcc.mjs --write
 * node configuracion/scripts/sincronizar-importe-itinerario-vcc.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const files=['index.html','itinerarios/index.html','planifica/donde-ir/index.html'];
const budget=fs.readFileSync(path.join(root,'destinos/suecia/estocolmo/presupuesto.html'),'utf8');
const publishedItinerary=fs.readFileSync(path.join(root,'destinos/suecia/estocolmo/itinerario.html'),'utf8');
const publishedTotal=budget.match(/id=["']vcc-budget-panel-vcc["'][\s\S]*?class=["']vcc-budget-total-person["'][^>]*>\s*([\d.,]+)\s*€/i)?.[1];
const itineraryTotal=publishedItinerary.match(/class=["']vcc-itinerary-budget__price["'][^>]*>\s*<strong>([\d.,]+)\s*€/i)?.[1];
const parseEuros=v=>Number(v?.replace(/\./g,'').replace(',','.'));
const value=parseEuros(publishedTotal);
if(!Number.isFinite(value)||value<=0)throw new Error('No s ha trobat el total REAL VCC a presupuesto.html');
if(value!==parseEuros(itineraryTotal))throw new Error('El total VCC del pressupost no coincideix amb el total de l’itinerari');
const canonical=new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(value)+' €/pax';
const cardRe=/<article\b[^>]*\bvcc-itinerary-unified\b[^>]*>[\s\S]*?<\/article>/gi;
const priceRe=/\b\d+(?:[.,]\d+)?\s*€\s*\/\s*(?:pax|persona)\b/g;
const write=process.argv.includes('--write');
const check=process.argv.includes('--check')||!write;
const errors=[];
for(const file of files){
  const target=path.join(root,file),html=fs.readFileSync(target,'utf8');
  let found=0,prices=0;
  let output=html.replace(cardRe,card=>{
    if(!card.includes('Estocolmo en 3 días')||!card.includes('/destinos/suecia/estocolmo/itinerario'))return card;
    found++;
    if(!card.includes('vcc-card-kicker'))throw new Error(file+': no hi ha categoria dins del cos de la targeta');
    return card.replace(priceRe,()=>{prices++;return canonical;});
  });
  if(found!==1||prices!==(file==='planifica/donde-ir/index.html'?2:1)){
    throw new Error(file+': es troben '+found+' targetes Estocolmo i '+prices+' imports; esperats 1 i '+(file==='planifica/donde-ir/index.html'?2:1));
  }

  // La portada mostra durada només als itineraris, mai a Guías destacadas.
  if(file==='index.html'){
    const start=output.indexOf('<section class="home-featured-guide"');
    const end=output.indexOf('</section>',start);
    if(start<0||end<start)throw new Error('No es troba Guías destacadas a Inicio');
    const body=output.slice(start,end);
    const cleaned=body.replace(/<span class="di-route-stats"><svg\b[^>]*>[\s\S]*?<\/svg>\s*\d+\s+d[ií]as?<\/span>/gi,'');
    output=output.slice(0,start)+cleaned+output.slice(end);
  }
  if(output!==html){
    if(check)errors.push(file+' desactualitzat: cal sincronitzar a '+canonical);
    if(write){fs.writeFileSync(target,output,'utf8');console.log('VCC sync: '+file+' → '+canonical);}
  }else console.log('VCC OK: '+file+' = '+canonical);
}
if(errors.length){for(const e of errors)console.error(e);process.exitCode=1;}
