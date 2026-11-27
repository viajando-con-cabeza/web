/**
 * VCC · Sync de miniatures responsive dels <img> amb fotos locals.
 * Fonts úniques: manifest.json i lib/targetes-vcc.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,approvedFiles} from './lib/publicacion-vcc.mjs';
import {cardManifest,cardPhotos,normalizeCardImageHtml} from './lib/targetes-vcc.mjs';

const write=process.argv.includes('--write');
const issues=[],changes=[];
if(!cardManifest){
 console.error('VCC TARGETES: manca manifest. Executa npm run cards:build');
 process.exit(1);
}
for(const [name,info] of Object.entries(cardPhotos)){
 const original=path.join(ROOT,info.source.slice(1));
 if(!fs.existsSync(original)){issues.push('Original absent: '+name);continue;}
 const hash=crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex').slice(0,12);
 if(hash!==info.fingerprint)issues.push('Miniatura desactualitzada: '+name);
 for(const v of Object.values(info.variants))
   if(!fs.existsSync(path.join(ROOT,v.path.slice(1))))
     issues.push('Fitxer WebP optimitzat absent: '+v.path);
}
for(const page of approvedFiles){
 const file=path.join(ROOT,page),old=fs.readFileSync(file,'utf8');
 const html=normalizeCardImageHtml(old,page);
 if(html!==old){
   changes.push(page);
   if(write)fs.writeFileSync(file,html);
 }
}
if(issues.length||(!write&&changes.length)){
 for(const problem of issues)console.error('VCC TARGETES ERROR:',problem);
 if(!write)for(const page of changes)
   console.error('VCC TARGETES PENDENTS:',page);
 process.exitCode=1;
}
console.log('VCC targetes:',Object.keys(cardPhotos).length,'originals optimitzats,',
 changes.length,(write?'HTML sincronitzats':'HTML pendents'));
