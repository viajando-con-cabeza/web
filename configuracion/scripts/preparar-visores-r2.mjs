/* VCC · Precalentament de visors R2 després de publicar un itinerari a quality.
 * Requereix només Node 20+; no toca ni reemplaça els originals.
 * El Worker de previsualitzacions genera i desa els visors la primera vegada.
 */
import {readFile} from 'node:fs/promises';

const base='https://img.viajandoconcabeza.com';
const html=await readFile('destinos/suecia/estocolmo/itinerario.html','utf8');
const keys=[...new Set([...html.matchAll(/data-photo="https:\/\/img\.viajandoconcabeza\.com\/(destinos\/[^"]+\.(?:avif|webp))"/gi)].map(m=>m[1]))];
if(keys.length<3||keys.length>200)throw Error('Nombre de fotos inesperat: '+keys.length);
for(const key of keys){
 if(!/^destinos\/[a-z0-9_/-]+\.(?:avif|webp)$/i.test(key)||key.includes('//')||key.includes('..'))
  throw Error('Clau R2 no vàlida: '+key);
}
console.log('Preparant visors nítids de '+keys.length+' fotos; originals intactes.');
const errors=[],count={success:0},concurrency=2;
let next=0;
const pause=ms=>new Promise(done=>setTimeout(done,ms));
async function warm(key){
 const url=base+'/__vcc_preview/visor/'+key;
 let issue='';
 for(let attempt=1;attempt<=4;attempt++){
  const timeout=AbortSignal.timeout(45000);
  try{
   const response=await fetch(url,{signal:timeout,redirect:'manual',
    headers:{Accept:'image/avif,image/webp;q=0.7','User-Agent':'VCC-Quality-R2-Preview-Warmup/1.0'}});
   if(!response.ok)throw Error('HTTP '+response.status+(response.headers.get('location')?' redirect':''));
   const bytes=Buffer.from(await response.arrayBuffer());
   // Valida format real, no sols extensió ni Content-Type.
   const avif=bytes.length>=16&&bytes.toString('ascii',4,8)==='ftyp'&&
    (bytes.toString('ascii',8,12)==='avif'||bytes.toString('ascii',8,12)==='avis'||
     bytes.toString('ascii',16,20)==='avif');
   const webp=bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&
    bytes.toString('ascii',8,12)==='WEBP';
   if(!avif&&!webp)throw Error('Resposta no és AVIF/WebP');
   count.success++;
   if(count.success%10===0)console.log('Preparades '+count.success+'/'+keys.length+' (última: '+bytes.length+' bytes)');
   return;
  }catch(err){
   issue=String(err?.message||err);
   if(attempt<4)await pause(1000*attempt*attempt);
  }
 }
 errors.push(key+' · '+issue);
 console.error('No preparada:',key,issue);
}
await Promise.all(Array.from({length:concurrency},async()=>{
 while(next<keys.length){
  const key=keys[next++];
  await warm(key);
 }
}));
console.log('RESULTAT: '+count.success+'/'+keys.length+' visors nítids preparats.');
if(errors.length){
 console.error('Falten '+errors.length+' visors: '+errors.join('\n'));
 process.exitCode=1;
}
