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

/* JSON-LD derivat de les molles de pa REALMENT visibles a l'HTML.
 * No s'inventa navegació ni s'afegeix un segon BreadcrumbList quan ja existeix.
 */
function syncVisibleBreadcrumbSchema(html,canonical){
  // El generador d'imatges pot afegir CSS al final del head: actualitzem
  // l'script IN SITU per no canviar-ne l'ordre a cada nova execució.
  const generated=/<script\b(?=[^>]*\bdata-vcc-generated-breadcrumb\b)[^>]*>[\s\S]*?<\/script>/gi;
  const existing=html.match(generated)?.[0]||null;
  const nav=html.match(/<nav\b(?=[^>]*\bid=["']vcc-global-breadcrumb["'])[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
  if(!nav)return existing?html.replace(generated,''):html;
  const jsonld=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .filter(match=>!match[0].includes('data-vcc-generated-breadcrumb'));
  const hasBreadcrumb=jsonld.some(match=>{
    try{
      const value=JSON.parse(match[1]);
      const nodes=Array.isArray(value)?value:(value?.['@graph']||[value]);
      return nodes.some(node=>node?.['@type']==='BreadcrumbList'||
        (Array.isArray(node?.['@type'])&&node['@type'].includes('BreadcrumbList')));
    }catch{return false;}
  });
  if(hasBreadcrumb)return existing?html.replace(generated,''):html;
  const strip=text=>text.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
  const links=[...nav.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const current=nav.match(/<(?:strong|span)\b(?=[^>]*aria-current=["']page["'])[^>]*>([\s\S]*?)<\/(?:strong|span)>/i)?.[1];
  if(!links.length||!current)return html;
  const elements=links.map((m,i)=>({
    '@type':'ListItem',position:i+1,name:strip(m[2]),
    item:new URL(m[1],canonical).href
  }));
  elements.push({'@type':'ListItem',position:elements.length+1,name:strip(current),item:canonical});
  if(elements.some(item=>!item.name))return html;
  const data={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':elements};
  const script='<script type="application/ld+json" data-vcc-generated-breadcrumb>'+
    JSON.stringify(data)+'</script>';
  return existing?html.replace(generated,script):
    html.replace(/<\/head\s*>/i,script+'\n</head>');
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
      const image=config.socialImages?.[file];
      if(!image)issues.push(file+': imagen social no configurada en publicacion-vcc.json');
      if(image){
        if(!image.startsWith('/'))issues.push(file+': socialImages requiere ruta absoluta del sitio');
        else if(!fs.existsSync(path.join(ROOT,image.slice(1))))issues.push(file+': foto OG inexistente '+image);
        newTags+='<meta property="og:image" content="'+ORIGIN+image+'">\n';
      }
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
  if(isReady)html=syncVisibleBreadcrumbSchema(html,urlValue);
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
// El menú compartit també consulta el registre, sense fetch ni llistes de països fixes.
const headerPath="configuracion/js/site-header.js";
const headerContent=fs.readFileSync(path.join(ROOT,headerPath),"utf8");
const headStart="/* VCC_PUBLIC_ROUTES_START */";
const headEnd="/* VCC_PUBLIC_ROUTES_END */";
const indexStart=headerContent.indexOf(headStart);
const indexEnd=headerContent.indexOf(headEnd);
if(indexStart<0||indexEnd<indexStart)issues.push("site-header.js: marcadors de rutes absents");
else {
  const routes=[...approved].map(file=>url(file).slice(ORIGIN.length)).sort();
  const data=headStart+"\n  const publicRoutes=new Set("+JSON.stringify(routes)+");\n  "+headEnd;
  set(headerPath,headerContent.slice(0,indexStart)+data+headerContent.slice(indexEnd+headEnd.length));
}

if(issues.length||(!write&&changes.length)){
  issues.forEach(e=>console.error('ERROR:',e));
  if(!write)changes.slice(0,100).forEach(e=>console.error('DESACTUALIZADO:',e));
  console.error('VCC:',issues.length,'errores,',changes.length,'archivos pendientes');
  process.exitCode=1;
}else console.log('VCC SEO:',pages.length,'HTML; aprobados',approved.size,
  '; protegidos por noindex',pages.length-approved.size,
  '; archivos actualizados',changes.length);
