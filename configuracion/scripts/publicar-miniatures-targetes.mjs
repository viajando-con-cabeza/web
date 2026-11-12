/**
 * VCC · Publicació de miniatures responsive per a fotos editorials locals.
 * Font única: manifest generat per generar-miniatures-targetes.py.
 * --write sincronitza els HTML aprovats; --check comprova idempotència.
 * No toca CSS, fotos R2 ni text, només atributs dels <img> afectats.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,approvedFiles} from './lib/publicacion-vcc.mjs';

const manifestPath='configuracion/imagenes/externas/unsplash/optimizadas/manifest.json';
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,manifestPath),'utf8'));
const photos=manifest.images;
const issues=[],changes=[];
const write=process.argv.includes('--write');
const originalPrefix='/configuracion/imagenes/externas/unsplash/';
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
const version=(photo,width)=>photo.variants[String(width)].path+'?v='+photo.fingerprint;
for(const [name,info] of Object.entries(photos)){
 const original=path.join(ROOT,info.source.slice(1));
 if(!fs.existsSync(original)){issues.push('Fotografia original absent: '+name);continue;}
 const hash=crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex').slice(0,12);
 if(hash!==info.fingerprint)issues.push('Miniatura desactualitzada: '+name);
 for(const v of Object.values(info.variants))
   if(!fs.existsSync(path.join(ROOT,v.path.slice(1))))
     issues.push('Fitxer WebP optimitzat absent: '+v.path);
}
for(const page of approvedFiles){
 const file=path.join(ROOT,page),old=fs.readFileSync(file,'utf8');
 let count=0;
 const html=old.replace(/<img\b[^>]*>/gi,tag=>{
   const source=attr(tag,'data-vcc-card-source')||attr(tag,'src').split('?')[0];
   if(!source.startsWith(originalPrefix)||source.includes('/optimizadas/'))return tag;
   const info=photos[path.posix.basename(source)];
   if(!info||info.source!==source)return tag;
   if(attr(tag,'srcset')&&!attr(tag,'data-vcc-card-source'))return tag;
   count++;
   const set=[480,960,1600].map(w=>version(info,w)+' '+w+'w').join(', ');
   let next=tag.replace(/\s+data-vcc-card-source=["'][^"']+["']/gi,'')
     .replace(/\s+srcset=["'][^"']+["']/gi,'')
     .replace(/\s+sizes=["'][^"']+["']/gi,'')
     .replace(/\bsrc=["'][^"']+["']/i,'src="'+version(info,960)+'"');
   next=next.replace(/>$/, ' data-vcc-card-source="'+source+
     '" srcset="'+set+'" sizes="'+sizesFor(page)+'">');
   return next;
 });
 if(html!==old){changes.push({page,photos:count});if(write)fs.writeFileSync(file,html);}
}
if(issues.length || (!write&&changes.length)){
 for(const problem of issues)console.error('VCC TARGETES ERROR:',problem);
 if(!write)for(const {page,photos} of changes)
   console.error('VCC TARGETES PENDENTS:',page,photos);
 process.exitCode=1;
}
console.log('VCC targetes:',Object.keys(photos).length,'originals reutilitzables,',
 changes.length,(write?'HTML sincronitzats':'HTML pendents'));
