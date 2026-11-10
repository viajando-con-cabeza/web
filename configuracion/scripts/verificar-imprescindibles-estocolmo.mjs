/**
 * Guardarraíl técnico para la guía de los 15 imprescindibles (quality).
 * Sin dependencias, sin acceder a R2 y sin modificar archivos.
 * Protege las rutas SEO, la compatibilidad de las galerías y el mapa/PDF.
 * No sustituye una prueba visual o una medición de Core Web Vitals.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));
const page='destinos/suecia/estocolmo/imprescindibles.html';
const canonical='https://viajandoconcabeza.com/destinos/suecia/estocolmo/imprescindibles';
const errors=[];
const verify=(condition,message)=>{if(!condition)errors.push(message);};
const html=read(page);
const sitemap=read('sitemap.xml');
const map=read('configuracion/js/destinos/suecia/estocolmo/imprescindibles-mapa.js');
const interaction=read('configuracion/js/plantillas/imprescindibles-interactions.js');
const css=read('configuracion/css/destinos/suecia/estocolmo/imprescindibles-decisiones.css');
const galleryCss=read('configuracion/css/plantillas/imprescindibles.css');
const config=JSON.parse(read('wrangler.jsonc'));
verify(config.assets?.html_handling==='auto-trailing-slash',
  'Cloudflare: la ruta canónica necesita html_handling=auto-trailing-slash');
verify(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]===canonical,
  'SEO: canonical no coincide con la ruta publica sin .html');
verify(html.match(/<meta property="og:url" content="([^"]+)"/)?.[1]===canonical,
  'SEO: og:url no coincide con el canonical');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
verify(urls.filter(url=>url===canonical).length===1,
  'SEO: sitemap debe contener exactamente una URL canónica para la guía');
verify(!urls.includes(canonical+'.html'),
  'SEO: sitemap contiene versión .html duplicada');
const image=html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
verify(image?.startsWith('https://viajandoconcabeza.com/'),
  'SEO: falta imagen social absoluta');
if(image?.startsWith('https://viajandoconcabeza.com/')){
  verify(exists(image.split('https://viajandoconcabeza.com/')[1]),
    'SEO: no existe el archivo usado en og:image');
}
const hero='/configuracion/imagenes/fondos/fondos-que-ver.webp';
verify(exists(hero.slice(1)) && galleryCss.includes(hero),
  'Rendimiento: la imagen del hero no coincide con la plantilla');
verify(html.includes('<link rel="preload" as="image" href="'+hero+'" fetchpriority="high">'),
  'Rendimiento: falta preload prioritario del hero real');

const ids=[...html.matchAll(/<section class="place place--no-media" id="([^"]+)" data-ssr-place="1"/g)]
  .map(match=>match[1]);
verify(ids.length===15 && new Set(ids).size===15,
  'HTML: deben existir 15 fichas únicas sin depender de JavaScript');
const dataMatch=html.match(/const data=(\[[\s\S]*?\]);\s*const esc=/);
let data=[];
try{data=JSON.parse(dataMatch?.[1]||'null');}
catch(error){errors.push('Datos editoriales: JSON inválido '+error.message);}
verify(Array.isArray(data)&&data.length===15,
  'Datos editoriales: deben existir 15 lugares');
if(Array.isArray(data)&&data.length===15){
  verify(ids.every((id,i)=>data[i]?.[0]===id),
    'Datos editoriales: orden de IDs distinto de las secciones HTML');
  verify(data.every(place=>typeof place[4]==='string' &&
    typeof place[9]==='string' && place[4].trim() && place[9].trim()),
    'Contenido: descripciones o consejos VCC vacíos');
}
for(const [name,regex] of [
  ['costes',/const VCC_COSTS=(\{[^\n]+\});/],
  ['comentarios de puntuación',/const VCC_RATING_COMMENTS=(\{[^\n]+\});/]
]){
  try{
    const obj=JSON.parse(html.match(regex)?.[1]||'null');
    verify(obj && ids.every(id=>typeof obj[id]!=='undefined') &&
      Object.keys(obj).length===15,
      'Datos: faltan '+name+' en alguna ficha');
  }catch(error){errors.push('Datos: JSON de '+name+' inválido: '+error.message);}
}
verify(html.indexOf('id="mapa-imprescindibles"')<
  html.indexOf('<main class="imp-main" id="places">'),
  'Experiencia: mapa debe estar antes de las 15 fichas');
verify(html.includes('nav.innerHTML=\'<a href="#mapa-imprescindibles"'),
  'Navegación: el índice debe comenzar por Mapa');
verify(html.includes("card.className='place-info-card'") &&
  html.includes("card.append(description,facts)"),
  'Estilos: la hidratación debe conservar la tarjeta blanca VCC');
verify(css.includes('place.place--no-media .place-copy > .advice') &&
  css.includes('place.place--no-media .place-info-card > .facts'),
  'Estilos: no se debe perder la anchura y fila de iconos sin fotografía');
verify(html.includes('gallery.dataset.seoImages=p[0]===\'ferry\'?\'false\':\'true\''),
  'Galerías: conservar tratamiento de fotos AVIF del ferry');

const ferry=html.match(/const FERRY_PHOTOS=\[([\s\S]*?)\]\.map\(key=>FERRY_BASE\+key\);/);
const ferryFiles=[...(ferry?.[1]||'').matchAll(/(?:paisajes|bosques|mar)\/DSC\d+\.avif/g)]
  .map(m=>m[0]);
verify(ferryFiles.length===9 && new Set(ferryFiles).size===9,
  'R2: las 9 fotografías originales del ferry deben mantenerse');
verify(html.includes("'20'+'26-dia8/'"),
  'R2: la ruta del ferry debe conservar el año 2026');
verify(interaction.includes('estocolmo-archipelago') &&
  interaction.includes('optimizedPhoto'),
  'R2: se ha cambiado el tratamiento de miniaturas AVIF');
verify(map.includes("pdf.save('estocolmo-15-imprescindibles-vcc.pdf')") &&
  html.includes('id="imp-export-pdf"'),
  'Mapa: botón o generación del PDF eliminados');

const geo=map.match(/const geo = \{([\s\S]*?)\n  \};/);
const geoIds=[...(geo?.[1]||'').matchAll(/'([^']+)':\[/g)].map(m=>m[1]);
verify(geoIds.length===15 && ids.every(id=>geoIds.includes(id)),
  'Mapa: faltan coordenadas de alguno de los 15 lugares');

const jsonLD=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
verify(jsonLD.length===1,'SEO: debe existir un único bloque JSON-LD');
try{
  const ld=JSON.parse(jsonLD[0]?.[1]||'null');
  const graph=ld?.['@graph']||[];
  const pageNode=graph.find(n=>n['@type']==='CollectionPage');
  const crumbs=graph.find(n=>n['@type']==='BreadcrumbList');
  const listing=graph.find(n=>n['@type']==='ItemList');
  verify(pageNode?.url===canonical,'SEO: JSON-LD Page.url distinto de canonical');
  verify(crumbs?.itemListElement?.at(-1)?.item===canonical,
    'SEO: última miga de pan no coincide con canonical');
  verify(listing?.itemListElement?.length===15 &&
    listing.itemListElement.every((n,i)=>n.position===i+1 &&
      n.item?.url===canonical+'#'+ids[i]),
    'SEO: JSON-LD debe describir los 15 anchors reales');
}catch(error){errors.push('SEO: JSON-LD inválido: '+error.message);}

// Comprobar sintaxis del JS sin ejecutarlo ni cargar fotografías ni bibliotecas.
for(const [i,match] of [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].includes('src=')||match[1].includes('ld+json'))continue;
  try{new vm.Script(match[2],{filename:page+'#inline-'+i});}
  catch(error){errors.push('Sintaxis inline '+i+': '+error.message);}
}
for(const match of html.matchAll(/<script[^>]*src="(\/configuracion\/[^"]+)"/g)){
  const file=match[1].split(/[?#]/)[0].slice(1);
  verify(exists(file),'JavaScript: falta '+file);
}
for(const file of [
  'configuracion/js/plantillas/imprescindibles-interactions.js',
  'configuracion/js/plantillas/imprescindibles-galeria-escritorio.js',
  'configuracion/js/plantillas/imprescindibles-galeria-movil.js',
  'configuracion/js/destinos/suecia/estocolmo/imprescindibles-mapa.js'
]){
  try{new vm.Script(read(file),{filename:file});}
  catch(error){errors.push('Sintaxis '+file+': '+error.message);}
}
if(errors.length){
  for(const message of errors)console.error('IMPRESCINDIBLES ERROR:',message);
  process.exitCode=1;
}else{
  console.log('IMPRESCINDIBLES OK: 15 fichas, mapa/PDF, rutas R2, SEO, recursos y JS verificados.');
}
