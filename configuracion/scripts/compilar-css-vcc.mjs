/**
 * Compila @import locals sense canviar ni una declaració ni la cascada CSS.
 * La configuració del manifest permet afegir més guies sense duplicar scripts.
 * npm run css:build  (actualitza els fitxers generats)
 * npm run css:verify (falla si estan desactualitzats)
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'configuracion/datos/compilacion-css-vcc.json'),'utf8'));
const rx=/@import\s+url\(\s*(['"]?)(\/configuracion\/css\/[^)"']+?\.css(?:\?[^)"']*)?)\1\s*\)\s*;/g;
const stripComments=text=>text.replace(/\/\*[\s\S]*?\*\//g,'');
function expand(rel,ancestors=[]) {
 if(ancestors.includes(rel))throw new Error('Cicle @import: '+[...ancestors,rel].join(' → '));
 const full=path.join(root,rel);
 if(!fs.existsSync(full))throw new Error('CSS font inexistent: '+rel);
 let source=fs.readFileSync(full,'utf8');
 source=source.replace(rx,(_whole,_quote,uri)=>{
   const target=decodeURIComponent(uri.split('?')[0]).slice(1);
   const css=expand(target,[...ancestors,rel]);
   return '\n/* === '+target+' === */\n'+css.trimEnd()+'\n';
 });
 if(/@import\b/.test(stripComments(source)))throw new Error('Import no suportat a '+rel+'; només URL absolutes locals');
 const relativeAssets=[...stripComments(source).matchAll(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g)]
   .map(m=>m[1]).filter(url=>!url.startsWith('/')&&!url.startsWith('data:')&&!/^https?:/.test(url)&&!url.startsWith('#'));
 if(relativeAssets.length)throw new Error('Revisar URL relativa CSS: '+rel+' '+relativeAssets[0]);
 return source;
}
// Compactació conservadora del bundle de Presupuesto: només comentaris
// i espais prescindibles, sense tocar selectores, valors o ordre de cascada.
function compactBudgetCSS(css){
 let result='',quote='',escaped=false,pendingSpace=false;
 for(let i=0;i<css.length;i++){
   const char=css[i],next=css[i+1];
   if(quote){
     result+=char;
     if(escaped)escaped=false;
     else if(char==='\\')escaped=true;
     else if(char===quote)quote='';
     continue;
   }
   if(char==='"'||char==="'"){
     if(pendingSpace){result+=' ';pendingSpace=false}
     quote=char;result+=char;continue;
   }
   if(char==='/'&&next==='*'){
     i+=2;
     while(i<css.length&&!(css[i]==='*'&&css[i+1]==='/'))i++;
     i++;continue;
   }
   if(/\s/.test(char)){pendingSpace=true;continue}
   if(pendingSpace){
     const previous=result.at(-1)||'';
     if(!/[{;:,}]/.test(previous)&&!/[{;:,}]/.test(char))result+=' ';
     pendingSpace=false;
   }
   result+=char;
 }
 if(quote)throw new Error('Cadena CSS sense tancar a Presupuesto');
 return result;
}
const budgetOutput='configuracion/css/plantillas/presupuesto-compilado-vcc.css';
let errors=0;
for(const {entry,sources,out} of manifest.bundles){
 const joined=Array.isArray(sources)
   ? sources.map(p=>'/* === '+p+' === */\n'+expand(p).trimEnd()+'\n').join('\n')
   : expand(entry);
 const generated=Array.isArray(sources)
   ? "/* AUTO-GENERAT · CSS comu de VCC. Edita les fonts canonicas de configuracion/css.\n * Regenerar: npm run css:build. Inclou tokens, carrusels, subheader, breadcrumb i header.\n */\n"+joined
   : '/* AUTO-GENERAT. Edita els CSS originals i executa: npm run css:build.\n * Cap @import bloquejant: la cascada es conserva i es carreguen 8 fulls menys.\n */\n'+joined;
 const optimized=out===budgetOutput?compactBudgetCSS(generated):generated;
 const output=path.join(root,out);
 if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,optimized);console.log('CSS compilat:',out);}
 else if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==optimized){console.error('CSS desactualitzat: '+out+' (executa npm run css:build)');errors++;}
 else console.log('CSS al dia:',out);
}
if(errors)process.exitCode=1;
