/**
 * VCC · única transformació canònica de fotografies de targetes HTML.
 * Reutilitzada pels generadors editorials i el sincronitzador final.
 * No canvia colors, crop, HTML semàntic ni originals de R2.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './publicacion-vcc.mjs';

const manifestPath=path.join(ROOT,'configuracion/imagenes/externas/unsplash/optimizadas/manifest.json');
export const cardManifest=fs.existsSync(manifestPath)
  ?JSON.parse(fs.readFileSync(manifestPath,'utf8')):null;
export const cardPhotos=cardManifest?.images||{};
const prefix='/configuracion/imagenes/externas/unsplash/';
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'=["\\x27]([^"\\x27]+)["\\x27]','i'))?.[1]||'';
const sizesFor=(page)=>{
 if(page==='planifica/donde-ir/index.html')
   return '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 280px';
 if(page==='index.html')
   return '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 400px';
 if(page==='destinos/index.html')
   return '(max-width: 700px) 90vw, 500px';
 return '(max-width: 700px) 94vw, (max-width: 1200px) 50vw, 600px';
};
const variant=(photo,width)=>photo.variants[String(width)].path+'?v='+photo.fingerprint;

export function normalizeCardImageHtml(html,page){
 return html.replace(/<img\b[^>]*>/gi,tag=>{
   const source=(attr(tag,'data-vcc-card-source')||attr(tag,'src')).split('?')[0];
   if(!source.startsWith(prefix)||source.includes('/optimizadas/'))return tag;
   const info=cardPhotos[path.posix.basename(source)];
   if(!info||info.source!==source)return tag;
   if(attr(tag,'srcset')&&!attr(tag,'data-vcc-card-source'))return tag;
   const srcset=[480,960,1600].map(w=>variant(info,w)+' '+w+'w').join(', ');
   const clean=tag.replace(/\s+data-vcc-card-source=["'][^"']+["']/gi,'')
     .replace(/\s+srcset=["'][^"']+["']/gi,'')
     .replace(/\s+sizes=["'][^"']+["']/gi,'')
     .replace(/\bsrc=["'][^"']+["']/i,'src="'+variant(info,960)+'"');
   return clean.replace(/>$/, ' data-vcc-card-source="'+source+
     '" srcset="'+srcset+'" sizes="'+sizesFor(page)+'">');
 });
}
