/* VCC · Anti-regressions CSS, sense dependències.
 * Detecta només regles EXACTAMENT iguals, amb el mateix selector i
 * el mateix context @media/@supports. No altera el disseny.
 */
import fs from 'node:fs';

const paths=[
  'configuracion/css/inicio-vcc.css',
  'configuracion/css/plantillas/entradas-pases-vcc.css',
  'configuracion/css/destinos/suecia/estocolmo/presupuesto-head-core-v1.css',
  'configuracion/css/paginas-principales-unificadas.css',
  'configuracion/css/plantillas/que-llevar-vcc-quality-optimizado.css',
  'configuracion/css/destinos/suecia/estocolmo/presupuesto-perfiles-desplegables.css'
];
function findDuplicates(css){
  const stack=[], rules=[];
  let start=0;
  for(let i=0;i<css.length;i++){
    if(css[i]==='/'&&css[i+1]==='*'){
      const end=css.indexOf('*/',i+2);
      if(end<0)break;
      i=end+1;continue;
    }
    if(css[i]==='"'||css[i]==="'"){
      const quote=css[i];
      while(++i<css.length&&css[i]!==quote){if(css[i]==='\\')i++;}
      continue;
    }
    if(css[i]==='{'){
      const raw=css.slice(start,i);
      const head=raw.replace(/\/\*[\s\S]*?\*\//g,'').trim();
      if(stack.length)stack[stack.length-1].children++;
      stack.push({head,raw,at:head.startsWith('@'),start,open:i,children:0});
      start=i+1;
    }else if(css[i]==='}'){
      const entry=stack.pop();
      if(!entry){start=i+1;continue;}
      if(!entry.at&&!entry.children&&stack.every(x=>x.at)
         &&!entry.raw.includes('/*')&&entry.head&&!entry.head.includes('@')){
        rules.push(JSON.stringify([stack.map(x=>x.head),entry.head,
          css.slice(entry.open+1,i).trim()]));
      }
      start=i+1;
    }
  }
  const seen=new Set(),dup=[];
  for(const key of rules){if(seen.has(key))dup.push(JSON.parse(key)[1]);else seen.add(key);}
  return dup;
}
const failures=[];
for(const file of paths){
  const css=fs.readFileSync(file,'utf8');
  const duplicates=findDuplicates(css);
  if(duplicates.length)failures.push(file+': '+duplicates.length+' regles idèntiques redundants');
}
const tokens=fs.readFileSync('configuracion/css/base/tokens-vcc.css','utf8');
for(const prop of ['--vcc-color-accent','--vcc-font-body','--vcc-consejo-border-color','--vcc-carousel-arrow-size']){
  if(!tokens.includes(prop))failures.push('Falta variable del sistema '+prop);
}
const header=fs.readFileSync('configuracion/js/site-header.js','utf8');
if(!header.includes('data-vcc-design-tokens')||!header.includes('data-vcc-carousel-tokens'))
  failures.push('Header no carrega de manera única les variables compartides');
if(failures.length){for(const f of failures)console.error('CSS VCC:',f);process.exitCode=1;}
else console.log('VCC CSS OK: regles exactes deduplicades, tokens i carregadors comuns correctes.');
