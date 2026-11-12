/* CSS crític de la primera pantalla de Presupuesto.
 * Es genera a partir del bundle canònic; el CSS complet es manté intacte
 * i s'aplica a continuació. No editeu a mà el fitxer generat.
 */
import fs from 'node:fs';
const sourcePath='configuracion/css/plantillas/presupuesto-compilado-vcc.css';
const targetPath='configuracion/css/plantillas/presupuesto-critico-vcc.css';
const criticalTokens=[
  '#vcc-lcp-hero','#vcc-global-breadcrumb','.budget-hero','.budget-crumb',
  '.hero-eyebrow','.hero-intro','.hero-lead','.vcc-hero-lcp',
  '.vcc-portada-transparente','.shared-','.st-tabs','.vcc-subnav',
  '.vcc-bc-sep','.vcc-original-breadcrumb','.vcc-has-global-breadcrumb',
  '.vcc-unified-subheader','.vcc-standardized-hero-height',
  '.vcc-subheader-hero','.budget-main','.philosophy-',
  '.budget-section','.section-heading','.vcc-trip-context'
];
function delimiter(source,from,block=false){
  let quote='',escaped=false,parens=0,level=0;
  for(let i=from;i<source.length;i++){
    const c=source[i];
    if(quote){
      if(escaped)escaped=false;
      else if(c==='\\')escaped=true;
      else if(c===quote)quote='';
      continue;
    }
    if(c==='"'||c==="'"){quote=c;continue}
    if(!block){
      if(c==='(')parens++;
      else if(c===')')parens--;
      if(parens===0&&(c==='{'||c===';'))return i;
    }else{
      if(c==='{')level++;
      else if(c==='}'&&--level===0)return i;
    }
  }
  return -1;
}
function required(selector){
  if(criticalTokens.some(token=>selector.includes(token)))return true;
  return selector.split(',').some(s=>
    /^(?:html|body|:root|\\*|a|img|main|button)$/i.test(s.trim())||
    /^(?:html\\s+)?body\\.budget-vcc$/i.test(s.trim())||
    /^(?:\\.budget-vcc\\s+)?\\.st-shell(?:\\s+a)?$/i.test(s.trim()));
}
function extract(source){
  let out='',cursor=0;
  while(cursor<source.length){
    const open=delimiter(source,cursor);
    if(open<0)break;
    const selector=source.slice(cursor,open).trim();
    const type=source[open];
    cursor=open+1;
    if(type===';')continue;
    const end=delimiter(source,open,true);
    if(end<0)throw Error('CSS incomplet: '+selector.slice(0,100));
    const body=source.slice(open+1,end);
    cursor=end+1;
    if(selector.startsWith('@')){
      if(/^@(?:media|supports|container|layer)\\b/i.test(selector)){
        const inner=extract(body);
        if(inner.trim())out+=selector+'{'+inner+'}\\n';
      }
    }else if(required(selector))out+=selector+'{'+body+'}\\n';
  }
  return out;
}
const original=fs.readFileSync(sourcePath,'utf8');
const stripped=original.replace(/\\/\\*[\\s\\S]*?\\*\\//g,'');
const output='/* AUTO-GENERAT · CSS crític mòbil de Presupuesto. No editar. */\\n'+extract(stripped);
if(!output.includes('.vcc-hero-lcp-picture')||!output.includes('.shared-header')||
   !output.includes('#vcc-global-breadcrumb')||!output.includes('.budget-hero'))
  throw Error('Falten estils imprescindibles de la portada');
if(process.argv.includes('--write')){
  fs.writeFileSync(targetPath,output);
  console.log('CSS crític de Presupuesto generat:',output.length,'bytes');
}else if(!fs.existsSync(targetPath)||fs.readFileSync(targetPath,'utf8')!==output){
  throw Error('CSS crític de Presupuesto desactualitzat. Executa npm run css:build');
}else console.log('CSS crític de Presupuesto al dia');
