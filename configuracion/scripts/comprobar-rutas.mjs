import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const skip=new Set(['.git','node_modules','preview-dist','.openai']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>skip.has(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const errors=[];let checked=0;
function verify(value,file,kind){
 value=value.replaceAll('&quot;','"').replaceAll('&#34;','"').replaceAll('&#39;',"'").replaceAll('&apos;',"'").replaceAll('&amp;','&');if(!value||/^(https?:|data:|mailto:|tel:|#|\/\/|javascript:)/i.test(value)||/[${}<>]/.test(value))return;
 const bare=value.split(/[?#]/)[0];if(!bare)return;
 // Resolve ordinary relative paths directly; absolute site paths relative to repository root.
 const full=bare.startsWith('/')?path.join(root,bare.slice(1)):path.resolve(path.dirname(file),bare);
 if(!full.startsWith(root+path.sep)&&full!==root){errors.push({file:path.relative(root,file),url:value,reason:'outside-root'});return;}
 const options=[full,full+'.html',path.join(full,'index.html')];
 checked++;if(!options.some(p=>fs.existsSync(p)))errors.push({file:path.relative(root,file),url:value,kind});
}
for(const file of walk(root)){
 if(file.includes('/configuracion/plantillas/'))continue;
 const s=fs.readFileSync(file,'utf8');
 if(file.endsWith('.html'))for(const m of s.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi))verify(m[1],file,'html');
 if(/\.(html|css)$/.test(file))for(const m of s.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g))verify(m[1],file,'css');
}
const report={checked,errors};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else{console.log(`${checked} rutas locales revisadas; ${errors.length} recursos o enlaces ausentes.`);for(const e of errors)console.log(`${e.file}: ${e.url}`);}
process.exitCode=errors.length?1:0;
