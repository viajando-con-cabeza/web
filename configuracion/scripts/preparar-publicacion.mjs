/**
 * VCC · Publicación SEO centralizada, sin dependencias.
 * --write sincroniza todas las páginas y sitemap;
 * --check comprueba que no haya páginas desprotegidas ni canonicals incoherentes.
 * Todo HTML nuevo es NOINDEX hasta añadirlo a datos/publicacion-vcc.json.
 */
import fs from 'node:fs';
import path from 'node:path';

import {ROOT, registry as config, PUBLISHED_FILES as approved, ORIGIN, publicUrl as url, listSiteHtml as scan} from "./lib/publicacion-vcc.mjs";
const write=process.argv.includes('--write');
const issues=[], changes=[];
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
  let newTags=isReady
    ? '<link rel="canonical" href="'+urlValue+'">\n<meta property="og:url" content="'+urlValue+'">\n'
    : '<meta name="robots" content="noindex,follow">\n';
  if(isReady) {
    const head=html.split(/<\/head\s*>/i)[0]||'';
    const metaTag=name=>[...head.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0])
      .find(tag=>new RegExp('\\b(?:name|property)=["\\u0027]'+name+'["\\u0027]','i').test(tag))||'';
    const enc=value=>value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    const title=head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]||'Viajando con Cabeza';
    const desc=metaTag('description').match(/\bcontent=["']([^"']*)/i)?.[1]||
      'Itinerarios y guías de viaje basados en experiencias reales.';
    if(!metaTag('og:title'))newTags+='<meta property="og:title" content="'+enc(title)+'">\n';
    if(!metaTag('og:description'))newTags+='<meta property="og:description" content="'+enc(desc)+'">\n';
    if(!metaTag('og:image')) {
      const image=config.socialImages?.[file]||'/configuracion/imagenes/fondos/fondos-inicio.webp';
      if(!fs.existsSync(path.join(ROOT,image.slice(1))))issues.push(file+': foto OG inexistente '+image);
      newTags+='<meta property="og:image" content="'+ORIGIN+image+'">\n';
    }
    if(!metaTag('twitter:card'))newTags+='<meta name="twitter:card" content="summary_large_image">\n';
    if(file==='index.html' && !html.includes('data-vcc-schema-website')) {
      const websiteSchema={
        "@context":"https://schema.org",
        "@type":"WebSite",
        "name":"Viajando con Cabeza",
        "url":ORIGIN+"/",
        "inLanguage":"es",
        "description":"Itinerarios reales, guías de viaje, presupuestos y consejos para viajar mejor."
      };
      newTags+='<script type="application/ld+json" data-vcc-schema-website>'+JSON.stringify(websiteSchema)+'</script>\n';
    }
  }
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
