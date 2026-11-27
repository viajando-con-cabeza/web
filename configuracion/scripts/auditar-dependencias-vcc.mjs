/**
 * Auditoria estàtica de dependències i costos de manteniment VCC.
 * Es recorren tots els HTML/CSS/JS, però les pàgines publicables es
 * defineixen al registre editorial (mai no s'infereixen de GitHub).
 * No elimina res: els recursos dinàmics poden no ser detectats.
 */
import fs from 'node:fs';
import path from 'node:path';
import { listarFitxers } from './lib/listar-fitxers.mjs';
import {ROOT,approvedFiles} from './lib/publicacion-vcc.mjs';
const all=listarFitxers(ROOT,{ignorar:new Set(['.git','node_modules','.wrangler','.next','preview-dist','dist','build'])});
const code=all.filter(p=>/\.(?:html|css|js|mjs|json|yml|yaml|md)$/.test(p));
const css=all.filter(p=>p.startsWith('configuracion/css/')&&p.endsWith('.css'));
const refs=new Map(css.map(file=>[file,new Set()]));
const cssReg=/(?:^|[^\w])\/?(configuracion\/css\/[\w./-]+\.css)\b/g;
for(const codePath of code){
 const text=fs.readFileSync(path.join(ROOT,codePath),'utf8');
 for(const match of text.matchAll(cssReg)){
   const key=match[1];
   if(key===codePath)continue;
   if(refs.has(key))refs.get(key).add(codePath);
 }
}
/* Audita també les fonts transitories dels paquets compilats.
 * Un HTML pot enllaçar una sola vegada cada fitxer i, igualment,
 * descarregar regles duplicades perquè un paquet ja les incorpora.
 * Respectem la cascada: s'informa dels candidats, NO es reescriu CSS.
 */
const bundleManifest=JSON.parse(fs.readFileSync(
 path.join(ROOT,'configuracion/datos/compilacion-css-vcc.json'),'utf8'));
const bundles=new Map(bundleManifest.bundles.map(({entry,sources,out})=>[
 out,Array.isArray(sources)?sources:[entry]
]));
// La font d'aquest paquet generat està definida en generar-ui-compartida.mjs.
bundles.set('configuracion/css/componentes/vcc-ui-compartida.css',[
 'configuracion/css/componentes/carruseles-flechas-movil-vcc.css',
 'configuracion/css/componentes/portadas-transparencia.css',
 'configuracion/css/componentes/numeros-consejos-vcc.css'
]);
const cssLeavesCache=new Map();
function cssLeaves(file,ancestors=[]){
 if(ancestors.includes(file))throw new Error('Cicle CSS al manifest: '+[...ancestors,file].join(' -> '));
 if(cssLeavesCache.has(file))return cssLeavesCache.get(file);
 const components=bundles.get(file);
 let leaves;
 if(components){
   leaves=[...new Set(components.flatMap(src=>cssLeaves(src,[...ancestors,file])))];
 }else{
   leaves=[file];
   const full=path.join(ROOT,file);
   if(fs.existsSync(full)){
     const content=fs.readFileSync(full,'utf8');
     const imports=[...content.matchAll(/@import\s+url\(\s*["']?(\/configuracion\/css\/[^)"']+\.css)/g)]
       .map(m=>m[1].slice(1));
     // La resta de les declaracions pròpies del fitxer també compten.
     for(const imported of imports)leaves.push(...cssLeaves(imported,[...ancestors,file]));
   }
   leaves=[...new Set(leaves)];
 }
 cssLeavesCache.set(file,leaves);
 return leaves;
}
const pageCssPaths=new Map();
const approved=[];
for(const file of approvedFiles){
 const original=fs.readFileSync(path.join(ROOT,file),'utf8');
 // No comptabilitzar fallbacks <noscript> com a peticions CSS ordinàries.
 const text=original.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,'');
 const links=[...text.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0])
  .filter(t=>/\brel\s*=\s*["']stylesheet["']/i.test(t))
  .map(t=>t.match(/\bhref\s*=\s*["']([^"']+)/i)?.[1]||'')
  .filter(u=>u.startsWith('/configuracion/css/'));
 const local=links.map(x=>x.split('?')[0]);
 const size=local.reduce((acc,p)=>acc+(fs.existsSync(path.join(ROOT,p.slice(1)))?fs.statSync(path.join(ROOT,p.slice(1))).size:0),0);
 pageCssPaths.set(file,local.map(x=>x.slice(1)));
 approved.push({file,cssRequests:local.length,cssRawKB:Math.round(size/1024),
   inlineBlocks:(text.match(/<style\b/gi)||[]).length,
   inlineAttributes:(text.match(/\sstyle\s*=/gi)||[]).length,
   duplicateCss:[...new Set(local.filter((p,i)=>local.indexOf(p)!==i))]});
}
/* Solapaments de fonts CSS per pàgina, incloent imports i bundles.
 * És una mesura de mantenibilitat, NO de transferència real de xarxa:
 * compressió, cache i regles CSS de cascada canvien el cost efectiu.
 */
const sourceOverlap=[];
for(const [file,cssPaths] of pageCssPaths){
 const owners=new Map();
 for(const cssPath of cssPaths){
   for(const leaf of cssLeaves(cssPath)){
     if(!owners.has(leaf))owners.set(leaf,new Set());
     owners.get(leaf).add(cssPath);
   }
 }
 const shared=[...owners.entries()]
   .filter(([,includes])=>includes.size>1)
   .map(([leaf,includes])=>({
     leaf,through:[...includes],
     rawBytes:fs.existsSync(path.join(ROOT,leaf))?fs.statSync(path.join(ROOT,leaf)).size:0
   }));
 if(shared.length){
   sourceOverlap.push({
     file,overlappingSources:shared.length,
     redundantRawBytes:shared.reduce((sum,x)=>sum+x.rawBytes*(x.through.length-1),0),
     examples:shared.sort((a,b)=>b.rawBytes-a.rawBytes).slice(0,7)
   });
 }
}
sourceOverlap.sort((a,b)=>b.redundantRawBytes-a.redundantRawBytes);
const orphanCss=[...refs].filter(([p,where])=>where.size===0).map(([p])=>p);
const biggest=approved.toSorted((a,b)=>b.cssRawKB-a.cssRawKB);
const report={approved:approved.length,cssFiles:css.length,
  cssBytes:css.reduce((n,p)=>n+fs.statSync(path.join(ROOT,p)).size,0),
  orphansPossiblyUnused:orphanCss.length,
  orphanCandidates:orphanCss,
  pageTopCSS:biggest.slice(0,12),
  pagesWithInlineBlocks:approved.filter(x=>x.inlineBlocks),
  duplicateLinkedCSS:approved.filter(x=>x.duplicateCss.length),
  nestedCSSOverlap:{pages:sourceOverlap.length,topPages:sourceOverlap.slice(0,12)}
};
console.log('VCC arquitectura:',approved.length,'pàgines aprovades,',
 css.length,'CSS,',orphanCss.length,'CSS sense cap referència literal.');
console.log('Pàgines CSS més pesades:',JSON.stringify(biggest.slice(0,8)));
console.log('CSS candidats a arxivar (cal revisar JS dinàmic):',JSON.stringify(orphanCss));
console.log('Solapaments CSS per bundles (candidats, no eliminar cegament):',
 JSON.stringify(sourceOverlap.slice(0,6).map(x=>({file:x.file,overlaps:x.overlappingSources,
 rawKB:Math.round(x.redundantRawBytes/1024),examples:x.examples.map(y=>y.leaf)}))));
if(process.env.GITHUB_STEP_SUMMARY){
 const summary=['## Manteniment CSS VCC','Pàgines aprovades: **'+approved.length+
  '** · CSS a Git: **'+css.length+'** · Candidats sense referència: **'+orphanCss.length+'**',
  '| Pàgina | Peticions CSS HTML | KB CSS original HTML |',
  '|---|---:|---:|',...biggest.slice(0,8).map(p=>'| '+p.file+' | '+p.cssRequests+' | '+p.cssRawKB+' |'),
  'La mida exclou CSS injectat per JS. Cap fitxer es considera segur de suprimir sense revisió.',
  '',
  '### Fonts CSS repetides dins de bundles i links',
  '| Pàgina | Fonts solapades | KB repetits teòrics (sense cache) |',
  '|---|---:|---:|',
  ...sourceOverlap.slice(0,8).map(x=>'| '+x.file+' | '+x.overlappingSources+' | '+Math.round(x.redundantRawBytes/1024)+' |'),
  'Aquest recompte és orientatiu. No és una mètrica de transferència i no justifica eliminar CSS sense validar la cascada.',''];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.join('\n'));
}
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
