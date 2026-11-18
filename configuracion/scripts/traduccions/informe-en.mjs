/* EN coverage: cannot mistake a mirrored HTML page for a translated one. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,approvedFiles} from '../lib/publicacion-vcc.mjs';
import {MODEL,SEED,htmlTexts,interactiveTexts} from './textos-compartits.mjs';
const v2=JSON.parse(fs.readFileSync(path.join(ROOT,'configuracion/datos/i18n/en-segments-v2.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(ROOT,'configuracion/datos/i18n/en-segments.json'),'utf8'));
const key=x=>crypto.createHash('sha256').update(MODEL+'\0'+x).digest('hex');
const v2texts=new Set(Object.values(v2.segments||{}).map(x=>x.es));
const oldtexts=new Set(Object.values(old.segments||{}).map(x=>x.es));
const measured=[];
for(const file of approvedFiles){
 const html=fs.readFileSync(path.join(ROOT,file),'utf8'),texts=htmlTexts(html);
 let fresh=0,glossary=0,legacy=0,missing=0;const examples=[];
 for(const t of texts){
  if(v2texts.has(t))fresh++;
  else if(SEED[t]!=null)glossary++;
  else if(oldtexts.has(t))legacy++;
  else{missing++;if(examples.length<3)examples.push(t.slice(0,140));}
 }
 measured.push({file,total:texts.length,fresh,glossary,legacy,missing,examples});
}
const dynamic=interactiveTexts(ROOT,approvedFiles);
const total=measured.reduce((a,x)=>a+x.total,0);
const fresh=measured.reduce((a,x)=>a+x.fresh+x.glossary,0);
const oldFallback=measured.reduce((a,x)=>a+x.legacy,0);
const missing=measured.reduce((a,x)=>a+x.missing,0);
const dynamicMissing=dynamic.filter(t=>!v2texts.has(t)&&SEED[t]==null&&!oldtexts.has(t));
const report={
 generatedAt:new Date().toISOString(),locale:'en',source:'es',
 approvedPages:approvedFiles.length,
 approved:{total,fresh,legacy:oldFallback,missing,coveragePercent:total?Math.round(100*(total-missing)/total):100,
  contextualPercent:total?Math.round(100*fresh/total):100},
 dynamic:{total:dynamic.length,missing:dynamicMissing.length,
  coveragePercent:dynamic.length?Math.round(100*(dynamic.length-dynamicMissing.length)/dynamic.length):100,
  missingSamples:dynamicMissing.slice(0,7).map(t=>t.slice(0,120))},
 rejected:Object.keys(v2.rejected||{}).length,
 pages:measured
};
const filename=path.join(ROOT,'configuracion/datos/i18n/en-coverage.json');
if(process.argv.includes('--write'))fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
console.log('VCC EN translation coverage:',JSON.stringify({
 pages:report.approvedPages,approved:report.approved,dynamic:report.dynamic,
 rejected:report.rejected}));
if(process.argv.includes('--strict')&&(missing||oldFallback||dynamicMissing.length||report.rejected))process.exitCode=1;
