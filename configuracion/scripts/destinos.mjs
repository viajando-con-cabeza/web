import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const T=path.join(ROOT,'configuracion/plantillas/articulos');
const [action,country,city]=process.argv.slice(2);
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
if(!['crear','generar'].includes(action)||!slug.test(country||'')||!slug.test(city||'')){
 console.error('Uso: node configuracion/scripts/destinos.mjs crear|generar pais ciudad');process.exit(1);
}
const dir=path.join(ROOT,'destinos',country,city),base=`/destinos/${country}/${city}/`;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=x=>JSON.stringify(x).replace(/</g,'\\u003c');
const url=s=>{s=String(s||'');if(s&&!s.startsWith('/')&&!/^https:\/\//.test(s))throw Error(`Usa una URL https o ruta desde la raíz: ${s}`);return esc(s);};
const pic=(p,alt='')=>`<img loading="lazy" src="${url(p)}" alt="${esc(alt)}">`;
if(action==='crear'){
 if(fs.existsSync(dir))throw Error('El destino ya existe; no se sobrescribe.');
 fs.mkdirSync(path.join(dir,'imagenes'),{recursive:true});
 const countryIndex=path.join(ROOT,'destinos',country,'index.html');
 if(!fs.existsSync(countryIndex))fs.writeFileSync(countryIndex,`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${esc(country)} | VCC</title></head><body><h1>${esc(country)}</h1><p>País en preparación.</p><a href="${city}/index.html">${esc(city)}</a></body></html>`);
 const d=read(path.join(ROOT,'configuracion/plantillas/destino-ejemplo.json'));
 d.country=country[0].toUpperCase()+country.slice(1);d.city=city[0].toUpperCase()+city.slice(1);
 fs.writeFileSync(path.join(dir,'contenido.json'),JSON.stringify(d,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'imagenes/README.md'),'# Fotos de este destino\n\nGuarda aquí las fotos propias, con nombres sin espacios. En contenido.json usa rutas como '+base+'imagenes/plaza.webp.\n');
 console.log('Destino creado. Edita '+base+'contenido.json y ejecuta generar.');process.exit(0);
}
const d=read(path.join(dir,'contenido.json'));
if(!d.city||!d.country||!Array.isArray(d.places)||!d.places.length||!d.itinerary?.days?.length)throw Error('Faltan ciudad, país, lugares o días.');
if(d.itinerary.days.length>30)throw Error('Máximo 30 días por itinerario.');
const ids=new Set();for(const p of d.places){if(!slug.test(p.id||'')||ids.has(p.id)||!p.photos?.length)throw Error('Cada lugar necesita un id único y al menos una foto.');ids.add(p.id);}
for(const day of d.itinerary.days)if(!day.title||!day.photos?.length||!day.stops?.length)throw Error('Cada día necesita título, fotografías y paradas.');
for(const profile of ['lujo','medio','vcc','mochilero'])for(const key of ['alojamiento','comida','transporte','actividades','extras'])if(!Number.isFinite(d.budget.prices[profile]?.[key])||d.budget.prices[profile][key]<0)throw Error('Precio no válido: '+profile+'.'+key);
const image=d.hero||'/configuracion/imagenes/fondos/fondos-itinerario.webp';
url(image);
const img=(v)=>v||image;
const common={COUNTRY:esc(d.country),CITY:esc(d.city),CITY_UPPER:esc(d.city.toUpperCase()),EYEBROW:esc(`${d.country} · ${d.city}`.toUpperCase()),COUNTRY_URL:`/destinos/${country}/`};
function render(name,slots){
 let s=fs.readFileSync(path.join(T,name+'.html'),'utf8').replaceAll('<meta name="robots" content="noindex,nofollow">','');
 const values={...common,...slots};
 s=s.replace(/\{\{([A-Z_]+)\}\}/g,(_,k)=>{if(!(k in values))throw Error('Falta campo '+k);return values[k];});
 s=s.replace('</head>',`<style>html body .imp-page .imp-hero{background-image:linear-gradient(90deg,#f8f4eef5,#f8f4ee15),url(${JSON.stringify(image)})!important}</style>${d.ready?'':'<meta name="robots" content="noindex,nofollow">'}</head>`);
 if(!d.ready)s=s.replace(/<body([^>]*)>/,'<body$1><div style="padding:10px;background:#f2e6d3;text-align:center;font:13px sans-serif">BORRADOR · Contenido de ejemplo pendiente de completar y revisar</div>');
 fs.writeFileSync(path.join(dir,name+'.html'),s);
}
const canonical=name=>'https://viajandoconcabeza.com'+base+name+'.html';
const places=d.places.map(p=>[p.id,p.name,p.type,p.subtitle,p.description,p.area,p.duration,p.rating,p.subtitle,p.tip,...p.photos.map((_,i)=>p.id+'-'+i)]);
const images=Object.fromEntries(d.places.flatMap(p=>p.photos.map((src,i)=>[p.id+'-'+i,src])));
render('imprescindibles',{TITLE:esc(`Qué ver en ${d.city} | VCC`),DESCRIPTION:esc(d.intro),CANONICAL:canonical('imprescindibles'),HEADING:esc(`QUÉ VER EN ${d.city.toUpperCase()}`),SUBTITLE:esc('Nuestros imprescindibles'),INTRO:esc(d.intro),IMAGES_JSON:json(images),PLACES_JSON:json(places),MAP_QUERY_JSON:json(d.city+', '+d.country)});
const days=d.itinerary.days;
const nav='<a href="#resumen">INTRODUCCIÓN</a>'+days.map((_,i)=>`<a href="#dia${i+1}">DÍA ${i+1}</a>`).join('');
const overview=days.map((day,i)=>`<a class="overview-card" href="#dia${i+1}">${pic(img(day.photos[0]),day.title)}<div><small>DÍA ${i+1}</small><h3>${esc(day.title)}</h3><p>${esc(day.subtitle)}</p></div></a>`).join('');
const map=d.itinerary.map?`<iframe title="Mapa de ${esc(d.city)}" loading="lazy" src="${url(d.itinerary.map)}"></iframe>`:'<p>Añade el mapa de esta ruta en contenido.json.</p>';
const main=`<section id="resumen" class="vcc-summary"><div><span class="hand">Antes de empezar…</span><h2>Tu ruta por ${esc(d.city)}</h2><p>${esc(d.itinerary.intro)}</p></div><div class="vcc-summary-map">${map}</div><div class="overview-list">${overview}</div></section>`+days.map((day,i)=>`<article class="day-section day-${i+1}" id="dia${i+1}"><div class="day-intro"><span class="hand">Día ${i+1} · ${esc(day.subtitle)}</span><h2>${esc(day.title)}</h2><p>${esc(day.description)}</p><aside class="day-tip"><img src="/configuracion/imagenes/marca/logo-vcc-vuelo-transparente.svg" alt=""><div><strong>CONSEJO VCC</strong>${esc(day.tip)}</div></aside>${day.route?`<a class="map-button day-route-link" href="${url(day.route)}" target="_blank" rel="noopener">VER RUTA EN GOOGLE MAPS ↗</a>`:''}</div><div class="day-schedule"><h3>RUTA HORA A HORA</h3><ol class="timeline">${day.stops.map(stop=>`<li><time>${esc(stop.time)}</time><span>${esc(stop.title)}<small class="stop-detail">${esc(stop.description)}</small></span></li>`).join('')}</ol></div><div class="day-gallery"><div class="day-mosaic count-${Math.min(4,day.photos.length)}" data-title="${esc(day.title)}" data-description="${esc(day.description)}">${day.photos.slice(0,4).map((src,j)=>`<button type="button" data-photo="${url(src)}" aria-label="Ampliar fotografía ${j+1}">${pic(src,day.title)}</button>`).join('')}</div></div></article>`).join('')+`<section class="route-end"><span class="hand">La aventura continúa ♡</span><h2>Más ideas para tu viaje</h2><a href="imprescindibles.html">QUÉ VER EN ${esc(d.city.toUpperCase())} →</a></section>`;
render('itinerario',{TITLE:esc(`${d.city} en ${days.length} días | VCC`),DESCRIPTION:esc(d.itinerary.intro),CANONICAL:canonical('itinerario'),HEADING:esc(`${d.city.toUpperCase()} EN ${days.length} DÍAS`),SUBTITLE:esc(d.itinerary.subtitle),INTRO:esc(d.itinerary.intro),MAIN:main,NAV:nav});
const heading=(id,title,kicker,body)=>`<section class="budget-section ${id==='ahorrar'?'savings':id==='gastar'?'spend':'surprise'}-section" id="${id}"><header class="section-heading"><div><p>${esc(kicker)}</p><h2>${esc(title)}</h2></div></header>${body}</section>`;
const carousel=(track,prev,next)=>`<div class="carousel-shell"><button class="carousel-arrow prev" type="button" aria-label="${prev}">‹</button>${track}<button class="carousel-arrow next" type="button" aria-label="${next}">›</button></div>`;
const savings=heading('ahorrar',`CÓMO AHORRAR EN ${d.city.toUpperCase()}`,'Pequeños cambios, gran diferencia',carousel(`<div class="tips-track">${d.budget.savings.map((x,i)=>`<article class="saving-tip"><span class="saving-number">${i+1}</span><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div>`,'Consejo anterior','Consejo siguiente'));
const spending=heading('gastar','EN QUÉ GASTAR Y EN QUÉ NO','Prioriza lo que cambia el viaje',`<div class="spend-grid decision-grid">${['worth','skip'].map(k=>{const items=d.budget[k];const pages=[];for(let i=0;i<items.length;i+=3)pages.push(items.slice(i,i+3));return `<article class="spend-panel ${k} decision-panel"><header><span class="decision-label">${k==='worth'?'SÍ: DALE PRIORIDAD':'AQUÍ PUEDES RECORTAR'}</span><h3>${k==='worth'?'Invierte en recuerdos':'Ahorra sin perder viaje'}</h3></header>${carousel(`<div class="tips-track decision-pages">${pages.map(page=>`<div class="decision-page">${page.map(x=>`<div class="decision-row">${pic(img(x.photo),x.title)}<div><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></div></div>`).join('')}</div>`).join('')}</div>`,'Anterior','Siguiente')}</article>`;}).join('')}</div>`);
const warnings=heading('sorpresas','GASTOS QUE TE PUEDEN SORPRENDER','Ojo con esto',carousel(`<div class="surprise-grid tips-track">${d.budget.warnings.map(x=>`<article><span class="surprise-icon" aria-hidden="true">⚠</span><div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div></article>`).join('')}</div>`,'Gasto sorpresa anterior','Gasto sorpresa siguiente'));
const related=`<section class="related-section"><div class="related-inner"><div class="related-head"><div><p>Continúa planificando</p><h2>SIGUE DESCUBRIENDO ${esc(d.city.toUpperCase())}</h2></div></div><div class="related-grid">${[['imprescindibles','Qué ver'],['itinerario','Itinerario']].map(([name,title])=>`<article><a href="${name}.html">${pic(image,title)}<div class="related-card-copy"><strong>${title}</strong><span>Continúa tu viaje</span><b aria-hidden="true">↗</b></div></a></article>`).join('')}</div></div></section>`;
render('presupuesto',{TITLE:esc(`Presupuesto de ${d.city} | VCC`),DESCRIPTION:esc(d.budget.intro),CANONICAL:canonical('presupuesto'),HEADING:esc(`PRESUPUESTO EN ${d.city.toUpperCase()}`),SUBTITLE:esc('Viajar con cabeza'),INTRO:esc(d.budget.intro),SAVINGS:savings,SPENDING:spending,WARNINGS:warnings,RELATED:related,PRICES_JSON:json(d.budget.prices),STATE_JSON:json({days:days.length,nights:Math.max(0,days.length-1),people:2,choices:Object.fromEntries(['alojamiento','comida','transporte','actividades','extras'].map(k=>[k,'vcc']))})});
// Profile cards use each destination's own editable rates, not Stockholm's prices.
let budget=fs.readFileSync(path.join(dir,'presupuesto.html'),'utf8');
for(const [cls,k] of [['luxury','lujo'],['medium','medio'],['vcc-choice','vcc'],['backpacker','mochilero']]){
 const amount=Object.values(d.budget.prices[k]).reduce((a,b)=>a+b,0);
 budget=budget.replace(new RegExp('(<article class="philosophy-profile '+cls+'">[\\s\\S]*?<div class="profile-price"><strong>)[^<]+'),`$1${amount} €`);
}
fs.writeFileSync(path.join(dir,'presupuesto.html'),budget);
if(!fs.existsSync(path.join(dir,'index.html'))||fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('<!-- VCC_GENERATED_INDEX -->'))fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><!-- VCC_GENERATED_INDEX --><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${d.ready?'':'<meta name="robots" content="noindex,nofollow">'}<title>${esc(d.city)} | VCC</title></head><body><header class="page-header"></header><main style="max-width:900px;margin:50px auto;font-family:sans-serif"><h1>${esc(d.city)}</h1><p>${d.ready?esc(d.intro):'Borrador de destino. Revisa su contenido antes de publicar.'}</p>${['imprescindibles','itinerario','presupuesto'].map(name=>`<p><a href="${name}.html">${name}</a></p>`).join('')}</main><script src="/configuracion/js/site-header.js"></script></body></html>`);
console.log(`Generadas 3 páginas en ${base}. ${d.ready?'Listas para revisión editorial final.':'Borradores noindex: no se añaden al sitemap ni a la navegación.'}`);
