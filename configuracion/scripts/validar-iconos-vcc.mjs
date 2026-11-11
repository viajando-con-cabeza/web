/* VCC: les icones son recursos SVG externs, mai vectors definits dins d'HTML/JS/CSS.
 * Validació per totes les pagines (publicades, ocultes i plantilles) a Quality. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SKIP=new Set(['.git','node_modules','.wrangler','dist','build']);
function walk(dir=''){
  let out=[];
  for(const ent of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
    if(SKIP.has(ent.name))continue;
    const name=path.posix.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(name));
    else if(ent.isFile())out.push(name);
  }
  return out;
}
const files=walk();
const errors=[];
let htmlChecked=0,cssChecked=0,jsChecked=0,externalReferences=0;
const isGeometry=/<(?:path|rect|circle|ellipse|line|polyline|polygon|symbol|text|image|linearGradient|radialGradient|foreignObject)\b/i;
for(const file of files){
  if(!/\.(html|css|js)$/i.test(file))continue;
  if(file==='configuracion/scripts/validar-iconos-vcc.mjs')continue;
  // Els Workers administratius tenen la seva UI pròpia, no son pagines del blog.
  if(file.startsWith('configuracion/workers/'))continue;
  const src=fs.readFileSync(path.join(ROOT,file),'utf8');
  if(/\.html$/i.test(file)){
    htmlChecked++;
    for(const block of src.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)){
      if(isGeometry.test(block[1]))errors.push(file+': SVG dibuixat directament al HTML');
    }
    for(const use of src.matchAll(/<use\b[^>]*\b(?:href|xlink:href)=["'](\/configuracion\/imagenes\/iconos\/[^"'#]+\.svg)#([^"']+)["']/gi)){
      externalReferences++;
      const fileTarget=use[1].slice(1),id=use[2];
      if(!fs.existsSync(path.join(ROOT,fileTarget))){errors.push(file+': no existeix '+fileTarget);continue;}
      const svg=fs.readFileSync(path.join(ROOT,fileTarget),'utf8');
      if(!new RegExp('\\bid=["\\\']'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\\\']').test(svg)){
        errors.push(file+': identificador SVG absent '+fileTarget+'#'+id);
      }
    }
  }else if(/\.css$/i.test(file)){
    cssChecked++;
    if(/data:image\/svg\+xml/i.test(src))errors.push(file+': SVG embegut en data URI CSS');
  }else {
    jsChecked++;
    for(const block of src.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)){
      if(isGeometry.test(block[1]))errors.push(file+': icona SVG embeguda directament en JS');
    }
  }
}
console.log('VCC icones: '+htmlChecked+' HTML · '+cssChecked+' CSS · '+jsChecked+' JS · '+externalReferences+' referencies externes verificades');
if(errors.length){
 for(const item of errors.slice(0,100))console.error('ICONA INCORRECTA:',item);
 process.exitCode=1;
}
