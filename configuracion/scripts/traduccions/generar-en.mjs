/**
 * VCC English mirror: generated, NEVER edited by hand.
 * ES files in publicacion-vcc.json are the only source of structure, photos and CSS.
 * Missing translation => preserve source text and keep the EN page noindex.
 *
 * Usage: node configuracion/scripts/traduccions/generar-en.mjs --write
 *        node configuracion/scripts/traduccions/generar-en.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,approvedFiles,listSiteHtml,publicRoute,ORIGIN} from '../lib/publicacion-vcc.mjs';
import {SEED,MODEL,normalize,eligible,interactiveTexts,fallbackEnglish} from './textos-compartits.mjs';

const legacy=JSON.parse(fs.readFileSync(path.join(ROOT,'configuracion/datos/i18n/en-segments.json'),'utf8'));
const v2=JSON.parse(fs.readFileSync(path.join(ROOT,'configuracion/datos/i18n/en-segments-v2.json'),'utf8'));
if(v2.model!==MODEL)throw Error('English model mismatch in translation memory');
// The newer contextual model always supersedes the old, lower-quality translator.
const dict=new Map([...Object.values(legacy.segments||{}).map(v=>[v.es,v.en]),
 ...Object.entries(SEED),...Object.values(v2.segments||{}).map(v=>[v.es,v.en])].filter(v=>v[0]&&v[1]));
const mode=process.argv.includes('--write')?'write':process.argv.includes('--check')?'check':'report';
// Mirror draft ES HTML too: approved pages link to some noindex drafts.
const sourceFiles=listSiteHtml().filter(file=>!file.startsWith('en/')).sort();
const routes=new Map(sourceFiles.map(file=>[publicRoute(file),'/en'+publicRoute(file)]));
// Runtime only needs strings inserted by JavaScript after HTML load. Static text
// is already translated in generated HTML; avoid sending the whole blog to visitors.
const liveTexts=interactiveTexts(ROOT,approvedFiles);
const clientStrings=new Map(Object.entries(SEED));
for(const t of liveTexts){
 const en=dict.get(t)||fallbackEnglish(t);
 if(en)clientStrings.set(t,en);
}
const runtimeData=JSON.stringify({version:2,routes:Object.fromEntries(routes),dictionary:Object.fromEntries(clientStrings)});
const version=crypto.createHash('sha256').update(runtimeData).digest('hex').slice(0,12);
const issues=[],summaries=[];
const escapeText=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escapeAttribute=s=>escapeText(s).replace(/"/g,'&quot;');
const attr=(tag,key)=>{
 const m=tag.match(new RegExp('\\b'+key+'\\s*=\\s*(["\\x27])([\\s\\S]*?)\\1','i'));
 return m?.[2]||'';
};
function mirror(file,source){
 let wanted=0,available=0;
 const translate=(value,kind='text')=>{
   const key=normalize(value);
   if(!eligible(key)||key.includes('{{')||key.includes('$'+'{'))return value;
   wanted++;
   const en=dict.get(key)||fallbackEnglish(key);
   if(!en)return value;
   available++;
   // Never inject HTML returned by the AI model as markup.
   const match=String(value).match(/^(\s*)([\s\S]*?)(\s*)$/);
   const safe=kind==='attr'?escapeAttribute(en):escapeText(en);
   return match?match[1]+safe+match[3]:safe;
 };
 // Remove executable and machine-readable blocks before rewriting visible text.
 const protectedBlocks=[];
 let html=source.replace(/<(script|style|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
  m=>'<!--VCC_I18N_KEEP_'+(protectedBlocks.push(m)-1)+'-->');
 html=html.replace(/<title\b([^>]*)>([\s\S]*?)<\/title>/gi,(all,attrs,value)=>
  '<title'+attrs+'>'+translate(value)+'</title>');
 // Translate only textual attributes, on every HTML element, including
 // headings, buttons, inputs, SVG wrappers, ARIA and option labels. Never touch
 // IDs, classes, data IDs, URLs or application configuration attributes.
 html=html.replace(/<[a-z][a-z0-9:-]*\b[^>]*>/gi,tag=>{
  if(/\b(?:translate|data-translate)\s*=\s*["']no["']/i.test(tag))return tag;
  const metaName=attr(tag,'name')||attr(tag,'property');
  const names=['alt','aria-label','aria-description','title','placeholder','label'];
  if(/^<meta\b/i.test(tag)&&/^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)$/i.test(metaName))names.push('content');
  for(const name of names){
   const pattern=new RegExp('(\\b'+name+'\\s*=\\s*)(["\\x27])([\\s\\S]*?)\\2','i');
   tag=tag.replace(pattern,(whole,prefix,quote,value)=>{
    const translated=translate(value,'attr');
    return prefix+quote+(quote==="'"?translated.replace(/'/g,'&#39;'):translated)+quote;
   });
  }
  return tag;
 });
 // Text nodes: same HTML element hierarchy and same styling as ES.
 html=html.replace(/>([^<>]+)</g,(all,value)=>'>'+translate(value)+'<');
 html=html.replace(/<html\b([^>]*)>/i,(all,attrs)=>
  '<html'+attrs.replace(/\blang\s*=\s*(["'])[^"']*\1/i,'')
   .replace(/\s+data-vcc-en-coverage\s*=\s*(["'])[^"']*\1/gi,'')+
   ' lang="en" data-vcc-generated-en="1" data-vcc-i18n-version="'+version+'" data-vcc-en-coverage="'+
   (wanted?Math.round(available/wanted*100):100)+'">');
 // Canonical/robots/alternate from ES are never carried over to an EN mirror.
 html=html.replace(/<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>\s*/gi,'');
 html=html.replace(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>\s*/gi,'');
 html=html.replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>\s*/gi,'');
 // Correct the Open Graph locale in generated English pages.
 html=html.replace(/<meta\b(?=[^>]*\bproperty=["']og:locale["'])[^>]*>/gi,
  tag=>tag.replace(/(\bcontent=["'])[^"']*(["'])/i,'$1en_US$2'));
 // ES structured data is not valid in EN; restore it once translated & reviewed.
 const enRoute=routes.get(publicRoute(file));
 const canonical=ORIGIN+enRoute;
 const seo='<meta name="robots" content="noindex,follow">\n'+
   '<link rel="canonical" href="'+escapeAttribute(canonical)+'">\n'+
   '<meta property="og:url" content="'+escapeAttribute(canonical)+'">\n';
 html=html.replace(/<head\b([^>]*)>/i,(all,attrs)=>'<head'+attrs+'>\n'+seo);
 // Normalize all relative links against the ORIGINAL Spanish location,
 // since the English mirror lives one folder deeper. Known HTML routes move
 // to /en/; shared images, JS and CSS stay on their original absolute paths.
 const sourceBase=new URL(publicRoute(file),ORIGIN);
 const resolveLink=(raw,toEnglish)=>{
   if(!raw || /^(?:#|\/\/|https?:|mailto:|tel:|data:|javascript:|blob:)/i.test(raw) ||
      raw.includes('{{') || raw.includes('$'+'{'))return raw;
   try{
     const resolved=new URL(raw,sourceBase);
     if(resolved.origin!==ORIGIN)return raw;
     const route=resolved.pathname.replace(/\/index\.html$/i,'/').replace(/\.html$/i,'');
     const target=toEnglish?routes.get(route):null;
     return (target||resolved.pathname)+resolved.search+resolved.hash;
   }catch{return raw;}
 };
 html=html.replace(/<(a|area|link|img|source|script|iframe|video|audio|form)\b[^>]*>/gi,tag=>{
   const kind=tag.match(/^<([a-z]+)/i)?.[1]?.toLowerCase()||'';
   const name=kind==='form'?'action':
     ['img','source','script','iframe','video','audio'].includes(kind)?'src':'href';
   const re=new RegExp('(\\b'+name+'\\s*=\\s*)(["\\x27])([^"\\x27]*)\\2','i');
   return tag.replace(re,(whole,prefix,quote,raw)=>
     prefix+quote+resolveLink(raw,kind==='a'||kind==='area')+quote);
 });
 // The language switch must NEVER be machine-translated, and its ES target
 // must NEVER be converted to /en/. Rebuild only the controls from the path.
 const sourceRoute=publicRoute(file);
 const sourceHref=sourceRoute;
 const englishHref=enRoute;
 const switchMarkup='<div class="shared-language" aria-label="Language">'+
   '<a href="'+sourceHref+'" lang="es" aria-label="Español">ES</a>'+
   '<span aria-hidden="true">|</span>'+
   '<a href="'+englishHref+'" lang="en" class="active" aria-label="English">EN</a>'+
   '</div>';
 html=html.replace(/<div\b(?=[^>]*\bclass=["'][^"']*\bshared-language\b)[^>]*>[\s\S]*?<\/div>/gi,switchMarkup);
 // Navigation is not prose: use fixed translated menu terms rather than
 // accepting incorrect generic AI translations (Beginning, Planned, ours...).
 const navLabels=['HOME','DESTINATIONS','ITINERARIES','PLAN','ABOUT','CONTACT'];
 html=html.replace(/(<nav\b[^>]*\bclass=["'][^"']*\bshared-menu\b[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/gi,
  (_,open,inner,close)=>{
   let count=0;
   const rewritten=inner.replace(/(<a\b[^>]*>)([\s\S]*?)(<\/a>)/gi,(_,start,content,end)=>
     start+(navLabels[count++]||content)+end);
   return open+rewritten+close;
  });
 // Executable and structured-data blocks have never been exposed to the
 // link/text rewriting; restore original scripts byte-for-byte.
 html=html.replace(/<!--VCC_I18N_KEEP_(\d+)-->/g,(all,n)=>{
   const block=protectedBlocks[Number(n)]||'';
   return /<script\b[^>]*\btype=["']application\/ld\+json["']/i.test(block)?'':block;
 });
 html=html.replace(/<\/body\s*>/i,
  '<script src="/configuracion/js/vcc-en-runtime.js" defer></script>\n</body>');
 return {html,wanted,available,canonical};
}
function emit(relative,content){
 const full=path.join(ROOT,relative);
 if(mode==='write'){
  fs.mkdirSync(path.dirname(full),{recursive:true});
  if(!fs.existsSync(full)||fs.readFileSync(full,'utf8')!==content){
   fs.writeFileSync(full,content);issues.push('updated '+relative);
  }
 }else if(mode==='check'&&(!fs.existsSync(full)||fs.readFileSync(full,'utf8')!==content)){
  issues.push('out of date '+relative);
 }
}
for(const file of sourceFiles){
 const source=fs.readFileSync(path.join(ROOT,file),'utf8');
 const mirrorFile='en/'+file;
 const {html,wanted,available}=mirror(file,source);
 emit(mirrorFile,html);
 summaries.push({page:file,translated:available,total:wanted,percent:wanted?Math.round(100*available/wanted):100});
}
emit('configuracion/datos/i18n/en-runtime.json',runtimeData+'\n');
const complete=summaries.filter(p=>p.translated===p.total).length;
console.log('VCC EN mirror: '+summaries.length+' ES pages mirrored ('+approvedFiles.length+' approved); '+complete+' with complete cached static text translations.');
console.log('VCC EN coverage: '+summaries.reduce((n,p)=>n+p.translated,0)+'/'+summaries.reduce((n,p)=>n+p.total,0)+' segments, English noindex until editorial review.');
console.log(JSON.stringify(summaries));
if(issues.length)console.log(issues.slice(0,40).join('\n')+(issues.length>40?'\n...':''));
if(mode==='check'&&issues.length)process.exitCode=1;
