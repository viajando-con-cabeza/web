/** Catàlegs d'itineraris: la portada és l'única font de targetes destacades. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function featuredCards(home){
 const a=home.indexOf('<section class="home-featured-itineraries"'),b=home.indexOf("</section>",a);
 if(a<0||b<0)throw Error("Featured itineraries not found");
 const cards=[...home.slice(a,b).matchAll(/<article\b[^>]*\bhome-route-card\b[^>]*>[\s\S]*?<\/article>/gi)].map(m=>m[0]);
 if(cards.length<1||cards.length>40)throw Error("Unusual featured itinerary count "+cards.length);
 return cards;
}
function escapeAttr(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function stripHtml(s){return String(s).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();}
function featuredToCatalog(card,mode){
 const name=stripHtml(card.match(/<h3 class="vcc-it-title">([\s\S]*?)<\/h3>/i)?.[1]||"");
 const multi=[...card.matchAll(/<span class="vcc-card-kicker-part">([\s\S]*?)<\/span>/gi)].map(m=>stripHtml(m[1]));
 const single=card.match(/<span class="vcc-card-kicker">([\s\S]*?)<\/span>/i)?.[1];
 const types=(multi.length?multi:[stripHtml(single||"")]).map(t=>t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase());
 const typeMap={"CIUDADES":"ciudades","PLAYAS":"playas","ISLAS":"islas","NATURALEZA":"naturaleza","NAVIDAD":"navidad","COMBINADOS":"combinados","RUTA COMBINADA":"combinados","MONTANAS":"montanas","RUTA EN COCHE":"coche"};
 const modes=[...new Set(types.map(t=>typeMap[t]).filter(Boolean))];
 if(!name||!modes.length)throw Error("Itinerary missing name/category: "+name);
 const flags=[...card.matchAll(/<img\b[^>]*class="vcc-it-country-flag"[^>]*alt="([^"]+)"[^>]*>/gi)].map(m=>m[1]);
 const countryCodes={"Suecia":"se","España":"es","Austria":"at","Alemania":"de","Suiza":"ch","Italia":"it","Francia":"fr","Estados Unidos":"us","Portugal":"pt","Noruega":"no"};
 const countries=[...new Set(flags.map(f=>countryCodes[f]).filter(Boolean))];
 if(!countries.length)throw Error("No recognized country flags for "+name);
 const continent="europa"; // Els destacats actuals son exclusivament europeus.
 const search=stripHtml(card).replace(/\s+/g," ");
 const attrs=mode==="planifica"
   ?'data-di-item data-continent="'+continent+'" data-country="'+countries.join(" ")+'" data-type="'+modes.join(" ")+'" data-di-search="'+escapeAttr(search)+'"'
   :'data-it-card data-continent="'+continent+'" data-type="'+modes.join(" ")+'" data-it-search="'+escapeAttr(search)+'"';
 let copy=card.replace(/<article\b[^>]*>/i,'<article class="di-mini-card di-itinerary-card vcc-it-card vcc-itinerary-unified" '+attrs+'>')
  .replace('class="home-feature-photo vcc-it-photo"','class="di-mini-photo vcc-it-photo"')
  .replace('class="home-feature-details di-mini-body"','class="di-mini-body"')
  .replaceAll('class="home-card-desc di-mini-desc"','class="di-mini-desc"')
  .replaceAll('class="home-feature-link vcc-it-cta"','class="vcc-it-cta"')
  .replaceAll('class="home-feature-pending vcc-it-upcoming"','class="vcc-it-upcoming"')
  .replace(/<a class="vcc-card-score"[^>]*>([\s\S]*?)<\/a>/g,'<span class="vcc-card-score" role="img" aria-label="Valoración VCC">$1</span>');
 if(!copy.includes("vcc-card-kicker")||!copy.includes('vcc-it-facts'))throw Error("Missing shared card structure: "+name);
 return copy;
}
function synchronizeFeatured(html,home,mode){
 const cards=featuredCards(home).map(c=>featuredToCatalog(c,mode));
 const prefix=mode==="planifica"?'<div class="di-mini-grid" data-di-list="itinerarios">':'<div class="di-mini-grid" id="itineraries-grid">';
 const marker=mode==="planifica"?'<p class="di-no-results" data-di-empty="itinerarios"':'<p class="di-no-results" id="itinerary-empty"';
 const a=html.indexOf(prefix),q=html.indexOf(marker,a),b=html.lastIndexOf("</div>",q);
 if(a<0||q<0||b<a||b>q)throw Error("Itinerary grid markers missing: "+mode);
 const before=html.slice(a+prefix.length,b);
 if(!before.includes('vcc-it-card'))throw Error("Existing grid not found: "+mode);
 let updated=html.slice(0,a+prefix.length)+"\n"+cards.join("\n")+"\n"+html.slice(b);
 updated=updated.replaceAll("INSPÍRATE CON NUESTROS ITINERARIOS","ITINERARIOS DESTACADOS");
 if(mode==="planifica"){
   updated=updated.replace(/(<span\b[^>]*data-di-count="itinerarios"[^>]*>)[^<]*(<\/span>)/,'$1'+cards.length+' itinerarios$2');
 }else{
   updated=updated.replace(/(<span\b[^>]*id="itinerary-count"[^>]*>)[^<]*(<\/span>)/,'$1'+cards.length+' itinerarios$2');
 }
 return updated;
}
const home=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const write=process.argv.includes('--write');
const targets=[['itinerarios/index.html','main'],['planifica/donde-ir/index.html','planifica']];
let stale=0;
for(const [file,mode] of targets){
 const full=path.join(ROOT,file),before=fs.readFileSync(full,'utf8');
 const after=synchronizeFeatured(before,home,mode);
 if(before!==after){stale++; if(write){fs.writeFileSync(full,after,'utf8'); console.log('VCC: itineraris destacats sincronitzats:',file);}else console.error('VCC: itineraris destacats desactualitzats:',file);}
 else console.log('VCC: itineraris destacats OK:',file);
}
if(stale&&!write)process.exitCode=1;
