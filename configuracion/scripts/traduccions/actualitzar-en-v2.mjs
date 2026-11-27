/* VCC ES→EN v2: resumable, cost-limited build-time batch translation.
   This is the only translation source for /en/; no visitor AI requests. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,approvedFiles,listSiteHtml} from '../lib/publicacion-vcc.mjs';
import {MODEL,SEED,htmlTexts,interactiveTexts,fallbackEnglish} from './textos-compartits.mjs';

const options=JSON.parse(fs.readFileSync(path.join(ROOT,'configuracion/datos/idiomas-vcc.json'),'utf8')).translation||{};
const location='configuracion/datos/i18n/en-segments-v2.json';
const full=path.join(ROOT,location);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const key=x=>sha(MODEL+'\0'+x);
const files=listSiteHtml().filter(f=>!f.startsWith('en/')).sort();
const approvedSet=new Set(approvedFiles);
const original=[...approvedFiles,...files.filter(f=>!approvedSet.has(f))];
const state=fs.existsSync(full)?JSON.parse(fs.readFileSync(full,'utf8')):
 {version:2,model:MODEL,segments:{},rejected:{},pages:{},daily:{}};
if(state.version!==2||state.model!==MODEL)throw Error('Translation memory v2 mismatch');
state.rejected||={};state.pages||={};state.segments||={};
const day=new Date().toISOString().slice(0,10);
if(state.daily?.date!==day)state.daily={date:day,batches:0,attempts:0};
const maxPerDay=Math.min(600,Math.max(1,Number(options.maxBatchesPerDay||350)));
const maxPerRun=Math.min(600,Math.max(1,Number(options.maxBatchesPerRun||350)));
const groupMax=Math.min(20,Math.max(1,Number(options.batchSize||12)));
let identity=process.env.VCC_TRANSLATOR_OIDC||'',identityAt=Date.now(),renewal;
async function getToken(){
 if(identity&&Date.now()-identityAt<170000)return identity;
 if(renewal)return renewal;
 const url=process.env.ACTIONS_ID_TOKEN_REQUEST_URL,secret=process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
 if(!url||!secret)return identity;
 renewal=(async()=>{
  const separator=url.includes('?')?'&':'?';
  const response=await fetch(url+separator+'audience=vcc-en-translator-quality',
    {headers:{authorization:'Bearer '+secret},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('OIDC token HTTP '+response.status);
  const data=await response.json();
  if(!data.value)throw Error('Missing OIDC token');
  identity=data.value;identityAt=Date.now();return identity;
 })();
 try{return await renewal;}finally{renewal=null;}
}
const endpoint=process.env.VCC_TRANSLATOR_URL?.replace(/\/translate(?:-batch)?\/?$/,'/translate-batch');
async function translate(texts){
 if(!endpoint)throw Error('Worker URL missing');
 const t=await getToken();
 if(!t)throw Error('Worker OIDC missing');
 const response=await fetch(endpoint,{
  method:'POST',headers:{authorization:'Bearer '+t,'content-type':'application/json'},
  body:JSON.stringify({texts,source_lang:'es',target_lang:'en'}),
  signal:AbortSignal.timeout(85000)
 });
 const data=await response.json().catch(()=>({}));
 if(response.ok&&Array.isArray(data.translations)&&data.translations.length===texts.length)return data.translations;
 const err=new Error('Worker HTTP '+response.status+': '+(data.error||'invalid-batch'));
 err.status=response.status;
 throw err;
}
function issue(es,en){
 if(typeof en!=='string'||!en.trim()||en.length>7500)return 'empty';
 if(es.includes('Viajando con Cabeza')&&!en.includes('Viajando con Cabeza'))return 'brand-changed';
 if(/\bVCC\b/.test(es)&&!/\bVCC\b/.test(en))return 'VCC-changed';
 for(const [p,english]of [[/Estocolmo/i,/Stockholm/i],[/Suecia/i,/Sweden/i],[/Gotemburgo/i,/Gothenburg/i]])
  if(p.test(es)&&!english.test(en))return 'place-changed';
 if(/New York/i.test(en)&&!/New York|Nueva York/i.test(es))return 'unexpected-city';
 const nums=[...es.matchAll(/\d+(?:[.,]\d+)?/g)].map(x=>x[0]);
 if(nums.some(n=>!en.includes(n)))return 'number-changed';
 if([...es.matchAll(/[€£$]/g)].some(x=>!en.includes(x[0])))return 'currency-changed';
 if(en.includes('<script')||en.includes('</')||en.includes('javascript:'))return 'markup-injection';
 if(es.length>35&&en.length<es.length*0.2)return 'truncated';
 return null;
}
const metadata=new Map(),seen=new Set(),tasks=[];
function add(t){
 const id=key(t);
 if(SEED[t]!=null||fallbackEnglish(t)!=null||seen.has(id)||state.segments[id]||state.rejected[id]?.attempts>=2)return;
 seen.add(id);tasks.push({id,es:t});
}
for(const file of original){
 const html=fs.readFileSync(path.join(ROOT,file),'utf8'),texts=htmlTexts(html);
 metadata.set(file,{hash:sha(html),texts});
 if(approvedSet.has(file))texts.forEach(add);
}
const dynamic=interactiveTexts(ROOT,approvedFiles);
dynamic.forEach(add);
for(const file of original)if(!approvedSet.has(file))metadata.get(file).texts.forEach(add);
const groups=[];let i=0;
while(i<tasks.length){
 const group=[];let size=0;
 while(i<tasks.length&&group.length<groupMax){
  if(group.length&&size+tasks[i].es.length>5200)break;
  group.push(tasks[i]);size+=tasks[i].es.length;i++;
 }
 groups.push(group);
}
let done=0,failed=0,attempted=0,stop=false;
const allowance=Math.min(maxPerRun,Math.max(0,maxPerDay-state.daily.batches));
const selected=groups.slice(0,allowance);
async function solve(batch,level=0){
 if(stop)return;
 try{
  const english=await translate(batch.map(x=>x.es));
  for(let i=0;i<batch.length;i++){
   const item=batch[i],en=english[i]?.trim(),reason=issue(item.es,en);
   if(!reason){
    state.segments[item.id]={es:item.es,en,model:MODEL};
    delete state.rejected[item.id];done++;
   }else{
    if(batch.length>1&&level<2)await solve([item],level+1);
    else{
     const prev=state.rejected[item.id]?.attempts||0;
     state.rejected[item.id]={es:item.es,candidate:en,reason,attempts:prev+1};
     failed++;
    }
   }
  }
 }catch(error){
  if([429,402,403].includes(error.status)){stop=true;console.warn('::warning::Translation quota: '+error.message);return;}
  if(batch.length>1&&level<3){
   const middle=Math.ceil(batch.length/2);
   await solve(batch.slice(0,middle),level+1);
   await solve(batch.slice(middle),level+1);
  }else{
   failed+=batch.length;
   console.warn('::warning::Translation batch error: '+error.message);
  }
 }
}
let current=0;
async function runWorker(){
 while(current<selected.length&&!stop){
  const group=selected[current++];
  state.daily.batches++;state.daily.attempts+=group.length;attempted++;
  await solve(group);
  if(attempted%20===0){
   console.log('VCC EN translated',done,'from',attempted,'batches, rejected',failed);
   if(process.argv.includes('--write'))fs.writeFileSync(full,JSON.stringify(state)+'\n');
  }
 }
}
if(!/^(auto|pilot)-/.test(options.status||''))throw Error('Quality translation disabled');
await Promise.all(Array.from({length:Math.min(4,selected.length)},runWorker));
for(const [file,{hash,texts}]of metadata){
 const ready=texts.filter(t=>SEED[t]!=null||fallbackEnglish(t)!=null||state.segments[key(t)]).length;
 state.pages[file]={sourceHash:hash,units:texts.length,ready,complete:ready===texts.length};
}
state.dynamic={extracted:dynamic.length,ready:dynamic.filter(t=>SEED[t]!=null||fallbackEnglish(t)!=null||state.segments[key(t)]).length};
state.report={runDate:new Date().toISOString(),batches:attempted,translated:done,failed,
 remaining:tasks.length-done,approved:approvedFiles.length,allPages:files.length};
if(process.argv.includes('--write')){
 fs.mkdirSync(path.dirname(full),{recursive:true});
 fs.writeFileSync(full,JSON.stringify(state)+'\n');
}
console.log('VCC EN v2 batch report:',JSON.stringify({report:state.report,dynamic:state.dynamic,daily:state.daily}));
