/* VCC ES→EN incremental translation memory. Draft-only: never publishes /en/.
 * Source content remains in Spanish; image URLs, markup and JS are not sent.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const config=JSON.parse(fs.readFileSync(path.join(root,'configuracion/datos/idiomas-vcc.json'),'utf8'));
const options=config.translation||{};
const output='configuracion/datos/i18n/en-segments.json';
const fullOut=path.join(root,output);
const model='@cf/meta/m2m100-1.2b';
const maxPerRun=Math.max(0,Math.min(90,Number(options.maxSegmentsPerRun||60)));
const sources=options.pilotPages||[];
const sha=t=>crypto.createHash('sha256').update(t).digest('hex');
const decode=t=>String(t).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
const valid=t=>t.length>=9&&t.length<=850&&/[a-záéíóúñü]/i.test(t)&&!/^[-+\d.,€% ]+$/.test(t)&&!/<[^>]+>/.test(t);
function attr(tag,key){
 const m=tag.match(new RegExp('\\b'+key+'\\s*=\\s*(["\\x27])([\\s\\S]*?)\\1','i'));
 return m?.[2]||'';
}
function segments(html){
 const ordered=new Set();
 const add=t=>{const s=decode(t);if(valid(s)&&!s.includes('{{')&&!s.includes('$'+'{'))ordered.add(s);};
 const title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
 if(title)add(title[1]);
 for(const m of html.matchAll(/<meta\b[^>]*>/gi)){
  const tag=m[0],name=attr(tag,'name')||attr(tag,'property');
  if(/^(description|og:description|og:title|twitter:description|twitter:title)$/i.test(name))add(attr(tag,'content'));
 }
 const clean=html.replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<(script|style|svg|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<[^>]+\s(?:data-translate|translate)=["']no["'][^>]*>[\s\S]*?<\/[^>]+>/gi,' ');
 for(const m of clean.matchAll(/>([^<>]+)</g))add(m[1]);
 for(const m of clean.matchAll(/<(?:img|input)\b[^>]*>/gi))add(attr(m[0],'alt'));
 return [...ordered];
}
const state=fs.existsSync(fullOut)?JSON.parse(fs.readFileSync(fullOut,'utf8')):{version:1,model,segments:{},pages:{}};
if(state.version!==1||state.model!==model)throw Error('Unsupported translation memory version/model');
state.rejected||={};
// Never accept machine output that changes the destination, prices, dates, or VCC name.
// Recheck the complete cache whenever the pilot runs (also catches older translations).
function qualityIssue(es,en){
 const pairs=[
  [/Estocolmo/i,/Stockholm/i,'Stockholm'],
  [/Suecia/i,/Sweden/i,'Sweden'],
  [/Gotemburgo/i,/Gothenburg/i,'Gothenburg'],
  [/Vaxholm/i,/Vaxholm/i,'Vaxholm'],
  [/Grinda/i,/Grinda/i,'Grinda'],
  [/Sigtuna/i,/Sigtuna/i,'Sigtuna'],
  [/Djurgården/i,/Djurg(?:å|a)rden/i,'Djurgarden'],
  [/Malmö/i,/Malm(?:ö|o)/i,'Malmo']
 ];
 for(const [src,dst,label] of pairs)if(src.test(es)&&!dst.test(en))return 'place-name-'+label;
 if(/New York/i.test(en)&&!/Nueva York|New York/i.test(es))return 'unexpected-city';
 if(/Viajando con Cabeza/.test(es)&&!en.includes('Viajando con Cabeza'))return 'protected-brand-changed';
 if(/\bVCC\b/.test(es)&&!/\bVCC\b/.test(en))return 'protected-vcc-changed';
 const srcNumbers=[...es.matchAll(/\b\d{2,4}\b/g)].map(x=>x[0]);
 if(srcNumbers.some(n=>!en.includes(n)))return 'numeric-value-changed';
 if(es.includes('€')&&!en.includes('€'))return 'currency-changed';
 if(/\s+(?:a|the|of|to)$/i.test(en))return 'incomplete-fragment';
 return null;
}
for(const [key,item] of Object.entries(state.segments)){
 const reason=qualityIssue(item.es,item.en);
 if(reason){
  state.rejected[key]={es:item.es,candidate:item.en,reason};
  delete state.segments[key];
 }
}
const today=new Date().toISOString().slice(0,10);
if(state.daily?.date!==today)state.daily={date:today,requested:0};
const maxPerDay=Math.max(0,Math.min(150,Number(options.maxSegmentsPerDay||80)));
let pending=0,done=0,requested=0,failed=0;const errors=[];
async function translate(text){
 const endpoint=process.env.VCC_TRANSLATOR_URL, token=process.env.VCC_TRANSLATOR_OIDC;
 if(!endpoint||!token)throw Error('Translation Worker URL/OIDC not configured');
 for(let n=0;n<3;n++){
  const response=await fetch(endpoint,{
   method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},
   body:JSON.stringify({text,source_lang:'es',target_lang:'en'}),signal:AbortSignal.timeout(30000)
  });
  const data=await response.json().catch(()=>({}));
  if(response.ok&&typeof data.translated_text==='string'&&data.translated_text.trim())return data.translated_text.trim();
  if(![429,503].includes(response.status)||n===2)throw Error('Worker HTTP '+response.status+' ('+(data.error||'unknown')+')');
  await new Promise(resolve=>setTimeout(resolve,1000*(n+1)));
 }
}
if(!Array.isArray(sources)||!sources.length)throw Error('No translation pilot pages configured');
if(!options.status?.startsWith('pilot-')){console.log('ES→EN inactive; no files modified');process.exit(0);}
for(const source of sources){
 if(!/^destinos\/[a-z0-9/_-]+\.html$/.test(source)||source.includes('..'))throw Error('Unapproved source: '+source);
 const full=path.join(root,source);
 if(!fs.existsSync(full))throw Error('Missing ES source: '+source);
 const html=fs.readFileSync(full,'utf8');
 const texts=segments(html),sourceHash=sha(html);
 for(const t of texts){
  const key=sha(model+'\0'+t);
  if(!state.segments[key]&&!state.rejected[key]){
   pending++;
   if(requested>=maxPerRun||state.daily.requested>=maxPerDay)continue;
   requested++;
   state.daily.requested++;
   try{
    const en=await translate(t);
    const reason=qualityIssue(t,en);
    if(reason){
      // Keep the original and suspicious output for a later editorial check.
      state.rejected[key]={es:t,candidate:en,reason};
      failed++;
    }else{
      state.segments[key]={es:t,en,model};done++;
    }
   }catch(err){failed++;errors.push(source+': '+err.message);}
  }
 }
 const readyUnits=texts.filter(t=>!!state.segments[sha(model+'\0'+t)]).length;
 state.pages[source]={sourceHash,sourceUnits:texts.length,readyUnits,status:readyUnits===texts.length?'translated-not-reviewed':'in-progress'};
 console.log(source+': '+readyUnits+'/'+texts.length+' units stored');
}
if(process.argv.includes('--write')){
 fs.mkdirSync(path.dirname(fullOut),{recursive:true});
 fs.writeFileSync(fullOut,JSON.stringify(state,null,2)+'\n');
}
console.log('ES→EN pilot: '+done+' new, '+pending+' missing, '+requested+' attempted, '+failed+' failed; nothing published');
if(errors.length){
  for(const s of errors.slice(0,4))console.error('::warning::'+s);
  // Persist successful drafts even when one inference fails; retry missing segments later.
}
if(Object.keys(state.rejected).length)console.warn('::warning::'+Object.keys(state.rejected).length+' segments need editorial review before EN publication');
