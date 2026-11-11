/**
 * VCC · Publicación SEO centralizada, sin dependencias.
 * --write sincroniza todas las páginas y sitemap;
 * --check comprueba que no haya páginas desprotegidas ni canonicals incoherentes.
 * Todo HTML nuevo es NOINDEX hasta añadirlo a datos/publicacion-vcc.json.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const config=JSON.parse(fs.readFileSync('configuracion/datos/publicacion-vcc.json','utf8'));
const approved=new Set(config.approved);
const ORIGIN=config.origin;
const write=process.argv.includes('--write');
const issues=[], changes=[];
const ignore=new Set(['.git','.github','.wrangler','node_modules','preview-dist','configuracion','.openai']);
function scan(folder=ROOT,relative=''){
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{
    if(e.isDirectory()){
      return ignore.has(e.name)?[]:scan(path.join(folder,e.name),path.posix.join(relative,e.name));
    }
    const rel=path.posix.join(relative,e.name);
    return rel.endsWith('.html')?[rel]:[];
  });
}
function route(file){
  if(file==='index.html')return '/';
  if(file.endsWith('/index.html'))return '/'+file.slice(0,-10);
  return '/'+file.replace(/\.html$/,'');
}
const url=file=>ORIGIN+route(file);
function set(file,value){
  const p=path.join(ROOT,file),before=fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;
  if(before===value)return;
  changes.push(file);
  if(write)fs.writeFileSync(p,value,'utf8');
}
function decorate(html,file,isReady){
  if(!/<head\b[^>]*>/i.test(html)||!/<\/head\s*>/i.test(html)){
    issues.push(file+': head ausente o mal formado');return html;
  }
  const urlValue=url(file);
  html=html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi,'')
           .replace(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>\s*/gi,'')
           .replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>\s*/gi,'');
  const newTags=isReady
    ? '<link rel="canonical" href="'+urlValue+'">\n<meta property="og:url" content="'+urlValue+'">\n'
    : '<meta name="robots" content="noindex,follow">\n';
  html=html.replace(/<head\b[^>]*>\s*/i,tag=>tag.trimEnd()+'\n'+newTags);
  if(isReady && !file.endsWith('/index.html') && file!=='index.html'){
    html=html.split(ORIGIN+'/'+file).join(urlValue);
  }
  return html;
}
if(config.policy!=='deny-by-default')issues.push('policy debe ser deny-by-default');
if(ORIGIN!=='https://viajandoconcabeza.com')issues.push('ORIGIN debe ser dominio final');
const pages=scan().sort(), found=new Set(pages);
for(const file of approved)if(!found.has(file))issues.push('Archivo aprobado no existe: '+file);
for(const file of pages){
  const html=fs.readFileSync(path.join(ROOT,file),'utf8');
  set(file,decorate(html,file,approved.has(file)));
}
const canonicalList=[...approved].map(url).sort();
if(new Set(canonicalList).size!==canonicalList.length)issues.push('Canonical duplicada');
set('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  canonicalList.map(u=>'  <url><loc>'+u+'</loc></url>').join('\n')+'\n</urlset>\n');
if(issues.length||(!write&&changes.length)){
  issues.forEach(e=>console.error('ERROR:',e));
  if(!write)changes.slice(0,100).forEach(e=>console.error('DESACTUALIZADO:',e));
  console.error('VCC:',issues.length,'errores,',changes.length,'archivos pendientes');
  process.exitCode=1;
}else console.log('VCC SEO:',pages.length,'HTML; aprobados',approved.size,
  '; protegidos por noindex',pages.length-approved.size,
  '; archivos actualizados',changes.length);
