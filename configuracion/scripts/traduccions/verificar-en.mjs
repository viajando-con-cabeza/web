/* Quality gate: every approved English page must reuse the Spanish layout,
 * photographs, stylesheets and original application scripts. Editorial
 * completeness is intentionally a separate gate; all EN mirrors are noindex.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,approvedFiles} from '../lib/publicacion-vcc.mjs';

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
for(const file of approvedFiles){
 const enFile='en/'+file;
 if(!fs.existsSync(path.join(ROOT,enFile))){failures.push('missing '+enFile);continue}
 const source=read(file),en=read(enFile);
 if(!/<html\b[^>]*\blang=["']en["']/i.test(en))failures.push(enFile+': missing lang=en');
 if(!/data-vcc-generated-en=["']1["']/.test(en))failures.push(enFile+': not generated');
 if(!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']noindex,follow["']/i.test(en))failures.push(enFile+': must remain noindex until editorial review');
 if(!en.includes('/configuracion/js/vcc-en-runtime.js'))failures.push(enFile+': no dynamic UI translation');
 equivalent(images(source),images(en),'images',enFile);
 equivalent(styles(source),styles(en),'CSS links',enFile);
 equivalent(scripts(source),scripts(en),'application scripts',enFile);
 equivalent(sections(source),sections(en),'section structure',enFile);
}
if(failures.length){
 console.error('VCC ES/EN parity failed:\n'+failures.join('\n'));
 process.exitCode=1;
}else console.log('VCC ES/EN parity: '+approvedFiles.length+' approved pages share exactly the same image, stylesheet, script and section structure.');
