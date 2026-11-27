/**
 * VCC · Portades d'Inicio sincronitzades amb les guies i itineraris de Suecia.
 * La foto canònica és la de configuracion/js/paises/suecia.js.
 * Sense correspondència, manté la foto editorial existent (ex.: Menorca).
 * Ús: node configuracion/scripts/sincronizar-destacados-vcc.mjs --write|--check
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {ROOT} from './lib/publicacion-vcc.mjs';

const homeFile=path.join(ROOT,'index.html');
const configFile=path.join(ROOT,'configuracion/js/paises/suecia.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(configFile,'utf8'),context,{filename:configFile,timeout:1000});
const country=context.window.COUNTRY_CONFIG;
if(!country?.guides||!country?.itineraries)throw new Error('No s ha pogut llegir la guia de Suecia');
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const sizes='(max-width: 760px) 86vw, (max-width: 1100px) 48vw, 380px';

function imageTag(tag,photo){
 let img=tag.replace(/\s+(?:srcset|sizes|data-vcc-card-source)=["'][^"']*["']/gi,'')
  .replace(/\bsrc=["'][^"']*["']/i,'src="'+esc(photo)+'"')
  .replace(/\bwidth=["'][^"']*["']/i,'width="640"')
  .replace(/\bheight=["'][^"']*["']/i,'height="380"');
 const responsive=photo.includes('/__vcc_preview/visor/')
  ?' srcset="'+esc(photo.replace('/__vcc_preview/visor/','/__vcc_preview/mini/'))+' 480w, '+esc(photo)+' 1800w" sizes="'+sizes+'"'
  :'';
 return img.replace(/>$/,responsive+'>');
}
const old=fs.readFileSync(homeFile,'utf8');
let matched=0,missing=0;
const output=old.replace(/<article\b[^>]*\bhome-feature-card\b[^>]*>[\s\S]*?<\/article>/gi,card=>{
 const marker=card.match(/\bdata-vcc-suecia-(guia|itinerario)="([^"]+)"/i);
 if(!marker)return card; // Portada alternativa per les guies que encara no existeixen
 const source=(marker[1]==='guia'?country.guides:country.itineraries).find(x=>x.title===marker[2]);
 if(!source?.image){missing++;return card;}
 matched++;
 return card.replace(/<img\b[^>]*>/i,tag=>imageTag(tag,source.image));
});
if(!matched)throw new Error('Cap portada de Suecia marcada a Inicio');
if(process.argv.includes('--write')){
 if(output!==old)fs.writeFileSync(homeFile,output,'utf8');
 console.log('VCC destacats: '+matched+' fotos enllacades, '+missing+' alternatives, '+(output===old?'correcte':'actualitzat'));
}else{
 if(output!==old){console.error('Portades destacades desincronitzades. Executa --write');process.exitCode=1;}
 else console.log('VCC destacats: '+matched+' portades coincideixen amb Suecia; '+missing+' alternatives');
}
