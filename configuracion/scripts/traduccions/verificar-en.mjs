/* Quality gate: every approved English page must reuse the Spanish layout,
 * photographs, stylesheets and original application scripts. Editorial
 * completeness is intentionally a separate gate; all EN mirrors are noindex.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,approvedFiles,listSiteHtml,publicRoute} from '../lib/publicacion-vcc.mjs';

const failures=[];
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const tags=(html,name)=>[...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','gi'))].map(m=>m[0]);
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\\x27])([^"\\x27]*)\\1','i'))?.[2]||'';
const images=html=>tags(html,'img').map(tag=>[attr(tag,'src'),attr(tag,'srcset')]);
const styles=html=>tags(html,'link').filter(t=>/\brel=["']stylesheet["']/i.test(t)).map(t=>attr(t,'href'));
const scripts=html=>tags(html,'script').map(t=>attr(t,'src')).filter(Boolean).filter(t=>!t.includes('vcc-en-runtime.js'));
const sections=html=>(html.match(/<section\b/gi)||[]).length;
function equivalent(a,b,label,file){
 if(JSON.stringify(a)!==JSON.stringify(b))failures.push(file+': '+label+' differs from Spanish source');
}
const sourceFiles=listSiteHtml().filter(file=>!file.startsWith('en/')).sort();
for(const file of sourceFiles){
 const enFile='en/'+file;
 if(!fs.existsSync(path.join(ROOT,enFile))){failures.push('missing '+enFile);continue}
 const source=read(file),en=read(enFile);
 if(!/<html\b[^>]*\blang=["']en["']/i.test(en))failures.push(enFile+': missing lang=en');
 if(!/data-vcc-generated-en=["']1["']/.test(en))failures.push(enFile+': not generated');
 if(!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']noindex,follow["']/i.test(en))failures.push(enFile+': must remain noindex until editorial review');
 if(!en.includes('/configuracion/js/vcc-en-runtime.js'))failures.push(enFile+': no dynamic UI translation');
 const sourceRoute=publicRoute(file);
 const enRoute='/en'+sourceRoute;
 if(source.includes('class="shared-language"')){
   const switcher=en.match(/<div\b[^>]*class="shared-language"[^>]*>[\s\S]*?<\/div>/i)?.[0]||'';
   if(!switcher.includes('href="'+sourceRoute+'"')||
      !switcher.includes('href="'+enRoute+'"')||
      !/<a\b[^>]*lang="es"[^>]*>ES<\/a>/i.test(switcher)||
      !/<a\b[^>]*lang="en"[^>]*>EN<\/a>/i.test(switcher))
      failures.push(enFile+': broken ES/EN language switch ('+sourceRoute+' / '+enRoute+')');
 }
 if(source.includes('class="shared-menu"')){
   const menu=en.match(/<nav\b[^>]*class="shared-menu"[^>]*>[\s\S]*?<\/nav>/i)?.[0]||'';
   if(!['HOME','DESTINATIONS','ITINERARIES','PLAN','ABOUT','CONTACT'].every(label=>menu.includes('>'+label+'</a>')))
     failures.push(enFile+': wrong English navigation labels');
 }

 equivalent(images(source),images(en),'images',enFile);
 equivalent(styles(source),styles(en),'CSS links',enFile);
 equivalent(scripts(source),scripts(en),'application scripts',enFile);
 equivalent(sections(source),sections(en),'section structure',enFile);
}
// The 16 Stockholm essentials are rebuilt from inline JavaScript. HTML-only
// translation coverage used to report 100% even when these cards stayed ES.
// Require translations for the editorial fields, prices and rating tooltips.
try {
 const source=read('destinos/suecia/estocolmo/imprescindibles.html');
 const dataMatch=source.match(/const data=\[([\s\S]*?)\n\];/);
 const costsMatch=source.match(/const VCC_COSTS=(\{.*?\});/);
 const ratingsMatch=source.match(/const VCC_RATING_COMMENTS=(\{.*?\});/);
 if(!dataMatch||!costsMatch||!ratingsMatch)throw Error('inline essentials schema changed');
 const rows=JSON.parse('['+dataMatch[1]+']');
 const costs=JSON.parse(costsMatch[1]);
 const ratings=JSON.parse(ratingsMatch[1]);
 const glossary=JSON.parse(read('configuracion/datos/i18n/stockholm-essentials-en.json')).dictionary;
 const runtime=JSON.parse(read('configuracion/datos/i18n/en-runtime.json')).dictionary;
 const translations={...runtime,...glossary};
 const visible=new Set([
  ...rows.flatMap(r=>[r[2],r[3],r[4],r[6],r[8],r[9]]),
  ...Object.values(costs).flat(),...Object.values(ratings)
 ]);
 for(const item of visible){
   if(typeof item!=='string'||!item.trim()||/^[€£$]+$/.test(item)||/^\d+[–-]\d+ min$/.test(item))continue;
   if(!translations[item])failures.push('Stockholm essentials runtime English missing: '+item.slice(0,90));
 }
 const runtimeSource=read('configuracion/js/vcc-en-runtime.js');
 if(!runtimeSource.includes('stockholm-essentials-en.json'))failures.push('Stockholm essentials glossary not loaded by EN runtime');
 const gallerySource=read('configuracion/js/plantillas/imprescindibles-interactions.js');
 if(!gallerySource.includes('isEnglish?')||!gallerySource.includes("'photos'"))failures.push('Stockholm mosaic photo counter not localized');
} catch(error){failures.push('Stockholm essentials dynamic translation audit: '+error.message)}

if(failures.length){
 console.error('VCC ES/EN parity failed:\n'+failures.join('\n'));
 process.exitCode=1;
}else console.log('VCC ES/EN parity: '+sourceFiles.length+' HTML pages share assets and layout; language switch and menu checks pass.');
