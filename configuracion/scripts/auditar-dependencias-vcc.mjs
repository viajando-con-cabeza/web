/**
 * Auditoria estàtica de dependències i costos de manteniment VCC.
 * Es recorren tots els HTML/CSS/JS, però les pàgines publicables es
 * defineixen al registre editorial (mai no s'infereixen de GitHub).
 * No elimina res: els recursos dinàmics poden no ser detectats.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,approvedFiles} from './lib/publicacion-vcc.mjs';
const skip=new Set(['.git','node_modules','.wrangler','.next','preview-dist','dist','build']);
function filesIn(rel=''){
 const abs=path.join(ROOT,rel);
 return fs.readdirSync(abs,{withFileTypes:true}).flatMap(ent=>{
   if(skip.has(ent.name))return [];
   const file=path.posix.join(rel,ent.name);
   return ent.isDirectory()?filesIn(file):ent.isFile()?[file]:[];
 });
}
const all=filesIn();
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
 approved.push({file,cssRequests:local.length,cssRawKB:Math.round(size/1024),
   inlineBlocks:(text.match(/<style\b/gi)||[]).length,
   inlineAttributes:(text.match(/\sstyle\s*=/gi)||[]).length,
   duplicateCss:[...new Set(local.filter((p,i)=>local.indexOf(p)!==i))]});
}
const orphanCss=[...refs].filter(([p,where])=>where.size===0).map(([p])=>p);
const biggest=approved.toSorted((a,b)=>b.cssRawKB-a.cssRawKB);
const report={approved:approved.length,cssFiles:css.length,
  cssBytes:css.reduce((n,p)=>n+fs.statSync(path.join(ROOT,p)).size,0),
  orphansPossiblyUnused:orphanCss.length,
  orphanCandidates:orphanCss,
  pageTopCSS:biggest.slice(0,12),
  pagesWithInlineBlocks:approved.filter(x=>x.inlineBlocks),
  duplicateLinkedCSS:approved.filter(x=>x.duplicateCss.length)
};
console.log('VCC arquitectura:',approved.length,'pàgines aprovades,',
 css.length,'CSS,',orphanCss.length,'CSS sense cap referència literal.');
console.log('Pàgines CSS més pesades:',JSON.stringify(biggest.slice(0,8)));
console.log('CSS candidats a arxivar (cal revisar JS dinàmic):',JSON.stringify(orphanCss));
if(process.env.GITHUB_STEP_SUMMARY){
 const summary=['## Manteniment CSS VCC','Pàgines aprovades: **'+approved.length+
  '** · CSS a Git: **'+css.length+'** · Candidats sense referència: **'+orphanCss.length+'**',
  '| Pàgina | Peticions CSS HTML | KB CSS original HTML |',
  '|---|---:|---:|',...biggest.slice(0,8).map(p=>'| '+p.file+' | '+p.cssRequests+' | '+p.cssRawKB+' |'),
  'La mida exclou CSS injectat per JS. Cap fitxer es considera segur de suprimir sense revisió.',''];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.join('\n'));
}
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
