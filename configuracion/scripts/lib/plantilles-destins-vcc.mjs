/**
 * VCC · Motor HTML estàtic de futures destinacions.
 * Una plantilla per país, regió, ciutat i itinerari; no modifica els
 * HTML existents de Suècia/Estocolm i no copia codi de CSS per destinació.
 * El mateix conjunt de tokens i components val per totes les noves pàgines.
 */
import {ORIGIN,approvedFiles,normalizePublicPath} from './publicacion-vcc.mjs';
const approved=new Set(approvedFiles.map(f=>f==='index.html'?'/':f.endsWith('/index.html')?'/'+f.slice(0,-10):'/'+f.replace(/\.html$/,'')));
const ESC={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
export const esc=value=>String(value??'').replace(/[&<>"']/g,x=>ESC[x]);
const token=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const entityTypes=Object.freeze(['country','region','city','itinerary']);
export const routeOf=c=>{
  const base='/destinos/'+c.country+'/';
  if(c.kind==='country')return base;
  if(c.kind==='region')return base+c.slug+'/';
  const r=c.region?c.region+'/':'';
  if(c.kind==='city')return base+r+c.slug+'/';
  if(c.kind==='itinerary')return base+r+c.city+'/'+c.slug;
  throw new Error('Tipus desconegut: '+c.kind);
};
export function validateModel(c){
  const errors=[];
  if(c?.version!==1||!entityTypes.includes(c.kind))errors.push('version/kind');
  for(const key of ['slug','country'])if(!token.test(c[key]||''))errors.push(key);
  if(c.kind==='country'&&c.slug!==c.country)errors.push('Country slug ha de coincidir amb country');
  if((c.kind==='city'||c.kind==='itinerary')&&c.region&&!token.test(c.region))errors.push('region');
  if(c.kind==='itinerary'&&!token.test(c.city||''))errors.push('city');
  if(!String(c.name||'').trim()||!String(c.description||'').trim())errors.push('name/description');
  if(!['draft','reviewed'].includes(c.status))errors.push('status');
  if(!Array.isArray(c.facts)||!Array.isArray(c.sections)||!Array.isArray(c.faq))errors.push('facts/sections/faq');
  if(c.kind==='itinerary'&&(!Array.isArray(c.days)||(c.status==='reviewed'&&!c.days.length)))errors.push('days');
  for(const s of c.sections||[]){
    if(!token.test(s.id||'')||!String(s.title||'').trim())errors.push('section '+s.id);
    for(const card of s.cards||[]){
      if(!String(card.title||'').trim())errors.push('card title');
      if(card.image && (!card.imageAlt||!String(card.imageAlt).trim()))errors.push('card imageAlt');
    }
  }
  const urls=[c.heroImage,...(c.sections||[]).flatMap(s=>(s.cards||[]).map(x=>x.image))].filter(Boolean);
  for(const image of urls)if(!/^(https:\/\/img\.viajandoconcabeza\.com\/|\/configuracion\/imagenes\/)/.test(image))
     errors.push('Imatge no autoritzada: '+image);
  if(c.status==='reviewed'){
    if(c.editorialReviewed!==true)errors.push('Cal aprovació editorial explícita');
    if(!c.heroImage?.startsWith('https://img.viajandoconcabeza.com/'))errors.push('Portada pròpia R2 obligatòria');
    if(!c.facts?.length)errors.push('Dades bàsiques obligatòries');
    if(c.description.includes('PENDIENTE')||c.description.includes('Describe aquí'))errors.push('Text provisional');
  }
  return errors;
}
const logo='/configuracion/imagenes/marca/logo-viajando-con-cabeza.svg';
const markupCard=card=>{
  const internal=card.href&&normalizePublicPath(card.href);
  const linkable=Boolean(card.href&&(!internal||approved.has(internal)));
  return '<article class="vcc-destino-tile">'+
    (card.image?'<img src="'+esc(card.image)+'" alt="'+esc(card.imageAlt)+'" width="640" height="420" loading="lazy" decoding="async">':'')+
    '<div class="vcc-destino-tile-content">'+
    (card.tag?'<small>'+esc(card.tag)+'</small>':'')+'<h3>'+esc(card.title)+'</h3>'+
    (card.description?'<p>'+esc(card.description)+'</p>':'')+
    (linkable?'<a class="vcc-destino-link" href="'+esc(card.href)+'">'+esc(card.cta||'VER GUÍA')+'</a>':
    '<span class="vcc-destino-soon">PRÓXIMAMENTE</span>')+
    '</div></article>';
};
const getAncestors=c=>{
  const items=[{name:'Inicio',url:'/'},{name:'Destinos',url:'/destinos/'}];
  const country='/destinos/'+c.country+'/';
  if(c.kind==='country')return items;
  items.push({name:c.countryName||c.country,url:country});
  if(c.region&&c.kind!=='region')items.push({name:c.regionName||c.region,url:country+c.region+'/'});
  if(c.kind==='itinerary')items.push({name:c.cityName||c.city,url:country+(c.region?c.region+'/':'')+c.city+'/'});
  return items;
};
const breadcrumb=c=>{
  const items=getAncestors(c);
  return '<nav class="vcc-destino-breadcrumbs" aria-label="Ruta de navegación">'+items.map(x=>'<a href="'+esc(x.url)+'">'+esc(x.name)+'</a><span aria-hidden="true">›</span>').join('')+'<strong aria-current="page">'+esc(c.name)+'</strong></nav>';
};
const schemaFor=(c,route)=>{
  const ancestors=getAncestors(c);
  const items=[...ancestors,{name:c.name,url:route}];
  return [
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((x,i)=>({
      '@type':'ListItem',position:i+1,name:x.name,item:ORIGIN+x.url
    }))},
    {'@context':'https://schema.org','@type':'WebPage','@id':ORIGIN+route+'#webpage',
      url:ORIGIN+route,name:c.seoTitle||c.name,description:c.description,
      inLanguage:'es',isPartOf:{'@type':'WebSite',name:'Viajando con Cabeza',url:ORIGIN+'/'},
      ...(c.heroImage?{primaryImageOfPage:{'@type':'ImageObject',url:c.heroImage}}:{})}
  ];
};
const json=x=>JSON.stringify(x).replace(/</g,'\\u003c');
function sections(c){
  const groups=(c.sections||[]).map(s=>'<section class="vcc-destino-section" id="'+esc(s.id)+'"><div class="vcc-destino-heading"><div>'+
      (s.kicker?'<p>'+esc(s.kicker)+'</p>':'')+'<h2>'+esc(s.title)+'</h2></div>'+
      (s.description?'<span>'+esc(s.description)+'</span>':'')+'</div>'+
      '<div class="vcc-destino-grid">'+(s.cards||[]).map(markupCard).join('')+'</div></section>');
  if(c.kind==='itinerary')groups.unshift('<section class="vcc-destino-section" id="ruta"><div class="vcc-destino-heading"><div><p>Nuestra ruta</p><h2>ITINERARIO DÍA A DÍA</h2></div></div>'+
   (c.days||[]).map((d,i)=>'<article class="vcc-destino-day"><h3>'+esc(d.title||'Día '+(i+1))+'</h3>'+
     (d.description?'<p>'+esc(d.description)+'</p>':'')+
     '<ol>'+ (d.stops||[]).map(p=>'<li class="vcc-destino-stop">'+esc(p)+'</li>').join('')+'</ol></article>').join('')+'</section>');
  if(c.faq?.length)groups.push('<section class="vcc-destino-section" id="faq"><div class="vcc-destino-heading"><div><p>Antes de viajar</p><h2>PREGUNTAS FRECUENTES</h2></div></div><div class="vcc-destino-faq">'+
    c.faq.map(x=>'<details><summary>'+esc(x.question)+'</summary><p>'+esc(x.answer)+'</p></details>').join('')+'</div></section>');
  return groups.join('');
}
export function renderDestination(c){
 const errors=validateModel(c);if(errors.length)throw new Error('Dades invàlides: '+errors.join(', '));
 const route=routeOf(c), published=approved.has(route)&&c.status==='reviewed';
 if(approved.has(route)&&!published)throw new Error('Ruta aprovada però no revisada: '+route);
 const title=String(c.seoTitle||c.name+' | Viajando con Cabeza');
 const intro=String(c.description);
 const facts=c.facts.map(f=>'<div class="vcc-destino-fact"><strong>'+esc(f.label)+'</strong><span>'+esc(f.value)+'</span>'+
   (f.note?'<small>'+esc(f.note)+'</small>':'')+'</div>').join('');
 const tabs=[...(c.kind==='itinerary'?[{id:'ruta',title:'ITINERARIO'}]:[]),...c.sections.map(s=>({id:s.id,title:s.navTitle||s.title})),...(c.faq.length?[{id:'faq',title:'FAQ'}]:[])];
 const head=['<!doctype html>','<html lang="es"><head>','<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
   !published?'<meta name="robots" content="noindex,follow">':'<meta name="robots" content="index,follow">',
   published?'<link rel="canonical" href="'+esc(ORIGIN+route)+'">':'',
   '<title>'+esc(title)+'</title><meta name="description" content="'+esc(intro)+'">',
   '<meta property="og:type" content="website"><meta property="og:title" content="'+esc(title)+'">',
   '<meta property="og:description" content="'+esc(intro)+'">',
   published?'<meta property="og:url" content="'+esc(ORIGIN+route)+'">':'',
   c.heroImage?'<meta property="og:image" content="'+esc(c.heroImage)+'">':'',
   '<meta name="twitter:card" content="summary_large_image">',
   '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
   '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=DM+Sans:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet">',
   '<link rel="stylesheet" data-vcc-core-styles href="/configuracion/css/componentes/vcc-core-compartit.css">',
   '<link rel="stylesheet" href="/configuracion/css/plantillas/destinos-genericos-vcc.css">',
   ...(published?schemaFor(c,route).map(x=>'<script type="application/ld+json">'+json(x)+'</script>'):[]),
   '</head>'];
 const body=['<body class="vcc-destino-v2" data-vcc-generated-destination="1" data-vcc-kind="'+c.kind+'">',
   '<header class="shared-header"></header>',
   ...(published?[]:['<div class="vcc-destino-draft" role="status">GUÍA EN PREPARACIÓN · BORRADOR NO INDEXABLE</div>']),
   '<section class="vcc-destino-hero">',
   ...(c.heroImage?['<img class="vcc-destino-hero-image" src="'+esc(c.heroImage)+'" alt="'+esc(c.heroAlt||c.name)+'" width="1600" height="900" fetchpriority="high" decoding="async">']:[]),
   '<div class="vcc-destino-hero-inner">'+breadcrumb(c)+
   '<div class="vcc-destino-card vcc-guide-hero-copy"><p class="vcc-destino-kicker vcc-guide-hero-kicker">'+esc(c.tagline||'Viajando con Cabeza')+'</p>'+
   '<h1>'+esc(c.name.toUpperCase())+'</h1><p class="vcc-destino-description vcc-guide-hero-description">'+esc(c.description)+'</p>'+
   '<div class="vcc-destino-facts">'+facts+'</div></div></div></section>',
   ...(tabs.length?['<nav class="vcc-destino-tabs" aria-label="Secciones de la guía">'+tabs.map(x=>'<a href="#'+esc(x.id)+'">'+esc(x.title)+'</a>').join('')+'</nav>']:[]),
   '<main class="vcc-destino-main">'+sections(c)+'</main>',
   '<footer class="vcc-global-footer"></footer>',
   '<script src="/configuracion/js/site-header.js"></script><script src="/configuracion/js/site-footer.js"></script>',
   '</body></html>'];
 return [...head,...body].join('\n')+'\n';
}
