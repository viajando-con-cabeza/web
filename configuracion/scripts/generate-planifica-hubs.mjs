import fs from "node:fs";
import path from "node:path";
import {PUBLISHED_FILES, publicRoute} from "./lib/publicacion-vcc.mjs";
import {normalizeCardImageHtml} from "./lib/targetes-vcc.mjs";

const ROOT = process.cwd();

const countryMeta = {
  "espana": ["ESPAÑA","europa"], "italia": ["ITALIA","europa"], "francia": ["FRANCIA","europa"],
  "suecia": ["SUECIA","europa"], "austria": ["AUSTRIA","europa"], "alemania": ["ALEMANIA","europa"],
  "portugal": ["PORTUGAL","europa"], "grecia": ["GRECIA","europa"], "croacia": ["CROACIA","europa"],
  "noruega": ["NORUEGA","europa"], "dinamarca": ["DINAMARCA","europa"], "finlandia": ["FINLANDIA","europa"],
  "reino-unido": ["REINO UNIDO","europa"], "irlanda": ["IRLANDA","europa"], "suiza": ["SUIZA","europa"],
  "belgica": ["BÉLGICA","europa"], "paises-bajos": ["PAÍSES BAJOS","europa"], "islandia": ["ISLANDIA","europa"],
  "estados-unidos": ["ESTADOS UNIDOS","america"], "canada": ["CANADÁ","america"], "mexico": ["MÉXICO","america"],
  "argentina": ["ARGENTINA","america"], "chile": ["CHILE","america"], "peru": ["PERÚ","america"], "brasil": ["BRASIL","america"],
  "japon": ["JAPÓN","asia"], "china": ["CHINA","asia"], "tailandia": ["TAILANDIA","asia"], "indonesia": ["INDONESIA","asia"],
  "malasia": ["MALASIA","asia"], "singapur": ["SINGAPUR","asia"], "turquia": ["TURQUÍA","asia"],
  "emiratos-arabes-unidos": ["EMIRATOS ÁRABES UNIDOS","asia"], "india": ["INDIA","asia"], "vietnam": ["VIETNAM","asia"],
  "sudafrica": ["SUDÁFRICA","africa"], "madagascar": ["MADAGASCAR","africa"], "marruecos": ["MARRUECOS","africa"],
  "egipto": ["EGIPTO","africa"], "kenia": ["KENIA","africa"], "tanzania": ["TANZANIA","africa"],
  "australia": ["AUSTRALIA","oceania"], "nueva-zelanda": ["NUEVA ZELANDA","oceania"],
  "polinesia-francesa": ["POLINESIA FRANCESA","oceania"]
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
function rel(file){ return path.relative(ROOT,file).split(path.sep).join("/"); }
function esc(s=""){ return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function plain(s=""){ return s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(); }
function titleCaseSlug(s=""){ return s.split("-").map(x=>x ? x[0].toUpperCase()+x.slice(1) : x).join(" "); }
function metaFor(file){
  const parts = rel(file).split("/");
  const countrySlug = parts[1] || "";
  const [country, continent] = countryMeta[countrySlug] || [titleCaseSlug(countrySlug).toUpperCase(), "all"];
  return {country,continent};
}
function destinationFrom(html,file,type){
  const title = plain((html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||"");
  let m;
  if(type==="budget") m = title.match(/viajar a\s+([^:|]+?)(?:\s*[:|]|$)/i);
  if(type==="map") m = title.match(/^(.+?)(?:\s+en\s+\d+\s+d[ií]as|\s*\||$)/i);
  if(m?.[1]) return m[1].trim();
  const parts=rel(file).split("/");
  return titleCaseSlug(parts[parts.length-2]||"Destino");
}
const CHECK=process.argv.includes("--check");
const outdated=[];
function replaceAuto(file,start,end,body){
  const full=path.join(ROOT,file);
  const before=fs.readFileSync(full,"utf8");
  const a=before.indexOf(start), b=before.indexOf(end);
  if(a<0||b<0||b<a) throw new Error(`Missing auto markers in ${file}`);
  // La mateixa transformació que aplica la publicació final: evita que
  // --check detecti com a desactualitzades les targetes WebP responsives.
  const html=before.slice(0,a+start.length)+"\n"+normalizeCardImageHtml(body.trim(),file)+"\n"+before.slice(b);
  if(html!==before){
    outdated.push(file);
    if(!CHECK)fs.writeFileSync(full,html);
  }
}

const all = walk(path.join(ROOT,"destinos")).filter(file=>file.endsWith(".html") && PUBLISHED_FILES.has(rel(file)));

/* Catàlegs Planifica: la mateixa targeta i galeria que /itinerarios/.
   Les noves guies s'afegeixen automàticament sense copiar CSS ni JavaScript. */
const STOCKHOLM_GALLERY=[
 "https://img.viajandoconcabeza.com/destinos/suecia/estocolmo/2026-dia6/DSC07945.avif",
 "https://img.viajandoconcabeza.com/destinos/suecia/estocolmo/2026-dia6/DSC08003.avif",
 "https://img.viajandoconcabeza.com/destinos/suecia/estocolmo/2026-dia7/DSC08199.avif",
 "https://img.viajandoconcabeza.com/destinos/suecia/estocolmo/2026-dia7/DSC08255.avif"
];
const CATALOG_ICONS="/configuracion/imagenes/iconos/paginas/itinerarios-iconos.svg";
function catalogIcon(id,cls=""){
 return '<svg'+(cls?' class="'+cls+'"':'')+' viewBox="0 0 24 24" aria-hidden="true"><use href="'+CATALOG_ICONS+'#'+id+'"></use></svg>';
}
function catalogGallery(images,title,category){
 const srcs=(images||[]).filter(Boolean);
 const slides=srcs.map((src,i)=>
   '<img data-vcc-it-slide class="'+(i===0?'is-current':'')+'" '+(i===0?'src':'data-src')+'="'+esc(src)+'" alt="'+esc('Foto '+(i+1)+' de '+srcs.length+': '+title)+'"'+(i?' aria-hidden="true"':'')+' width="640" height="380" loading="lazy" decoding="async">'
 ).join("");
 const multiple=srcs.length>1;
 const arrow=multiple?
 '<button class="vcc-it-gallery-button" type="button" data-vcc-it-dir="prev" aria-label="Foto anterior de '+esc(title)+'">'+catalogIcon("it-arrow-left")+'</button>'+
 '<button class="vcc-it-gallery-button" type="button" data-vcc-it-dir="next" aria-label="Foto siguiente de '+esc(title)+'">'+catalogIcon("it-arrow-right")+'</button>'+
 '<span class="vcc-it-photo-count" data-vcc-it-count aria-live="polite">1 / '+srcs.length+'</span>':"";
 return '<span class="di-mini-photo vcc-it-photo" data-vcc-it-gallery role="group" aria-label="Fotos de '+esc(title)+'" tabindex="0">'+slides+
 '<span class="di-mini-tag">'+catalogIcon("it-category-city")+esc(category.toUpperCase())+'</span>'+arrow+'</span>';
}
function catalogCountry(country){
 return '<span class="di-country-line">'+
 (country.toLocaleLowerCase('es')==='suecia'
 ?'<svg class="vcc-it-country-flag" viewBox="0 0 32 20" role="img" aria-label="Bandera de Suecia"><use href="'+CATALOG_ICONS+'#it-flag-se"></use></svg>'
 :"")+'<span>'+esc(country)+'</span></span>';
}
function catalogCard({kind,title,description,href,images,country,type,typeLabel,continent,days,daily}){
 const budget=kind==="budget";
 const label=budget?'VER PRESUPUESTO':'VER QUÉ LLEVAR';
 const price=daily===null?'Consultar guía':new Intl.NumberFormat("es-ES",{maximumFractionDigits:1}).format(daily)+' €/persona/día';
 const duration=budget?(days?days+' días':'Viaje real'):'Por temporada';
 const facts='<span class="di-route-stats">'+catalogIcon("it-clock")+esc(duration)+'</span>'+
 '<span class="di-budget-row" title="'+(budget?'Gasto por persona y día':'Lista de equipaje')+'">'+
 '<svg class="vcc-it-coins" viewBox="0 0 24 24" aria-hidden="true"><use href="'+CATALOG_ICONS+'#'+(budget?'it-coins':'it-category-city')+'"></use></svg>'+
 '<span class="di-price">'+esc(budget?price:'Checklist')+'</span></span>'+catalogCountry(country);
 const search=[title,description,country,typeLabel,continent,budget?price:'equipaje ropa checklist maleta'].join(' ');
 return '<article class="di-mini-card vcc-it-card '+(budget?'budget-card':'packing-card')+'" data-it-card data-it-search="'+esc(search)+'" data-continent="'+esc(continent)+'" data-type="'+esc(type)+'"'+(budget?' data-daily="'+(daily??'')+'"':'')+'>'+
 catalogGallery(images,title,typeLabel)+
 '<div class="di-mini-body"><a class="vcc-it-title" href="'+esc(href)+'">'+esc(title)+'</a>'+
 '<div class="vcc-it-facts">'+facts+'</div><span class="di-mini-desc">'+esc(description)+'</span>'+
 '<a class="vcc-it-cta" href="'+esc(href)+'">'+label+' <span aria-hidden="true">↗</span></a></div></article>';
}


// Metadata editorial. Los importes se leen siempre del presupuesto publicado
// (perfil VCC), para no duplicar cifras ni confundir estimaciones con gastos reales.
const budgetEditorial = {
  "destinos/suecia/estocolmo/presupuesto.html": {
    type: "ciudades", typeLabel: "Ciudades", days: 3,
    image: "/configuracion/imagenes/externas/unsplash/photo-1509356843151-3e7d96241e11.webp",
    gallery: STOCKHOLM_GALLERY,
    description: "Nuestro gasto real en una escapada urbana de 3 días: alojamiento, comida, transporte y actividades. Sin vuelos ni traslados de ida y vuelta."
  }
};

function budgetDailyAmount(html) {
  const declared = html.match(/<meta[^>]+name=["']vcc-budget-daily["'][^>]+content=["']([\d.,]+)["']/i);
  const vccButton = html.match(/<button[^>]*data-budget-mode=["']vcc["'][\s\S]*?<\/button>/i);
  const actual = vccButton?.[0].match(/class=["']vcc-budget-mode-price["'][\s\S]*?<strong[^>]*>\s*(?:≈\s*)?([\d.,]+)\s*€\s*<\/strong>/i);
  const rawAmount = declared?.[1] || actual?.[1];
  if (!rawAmount) return null;
  const normalized = Number(rawAmount.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

const budgetFiles = all.filter(f=>/\/presupuesto\.html$/i.test(f));
const budgetCards = budgetFiles.map(file=>{
 const html=fs.readFileSync(file,"utf8");
 const filePath=rel(file);
 const {country,continent}=metaFor(file);
 const destination=destinationFrom(html,file,"budget");
 const info=budgetEditorial[filePath]||{};
 const daily=budgetDailyAmount(html);
 const type=info.type||"otros";
 const typeLabel=info.typeLabel||"Otros viajes";
 const title=destination+(info.days?' en '+info.days+' días':'');
 return catalogCard({kind:"budget",title,description:info.description||
  "Consulta nuestro presupuesto completo, las categorías de gasto y los consejos para este destino.",
  href:publicRoute(filePath),images:info.gallery||[info.image||
  "/configuracion/imagenes/fondos/fondos-presupuesto.webp"],country,
  type,typeLabel,continent,days:info.days||null,daily});
}).sort((a,b)=>a.localeCompare(b,"es"));
replaceAuto("planifica/presupuesto/index.html", "<!-- AUTO_BUDGETS_START -->", "<!-- AUTO_BUDGETS_END -->", budgetCards.join("\n"));

const mapFiles = all.filter(f=>/\/itinerario\.html$/i.test(f));
const mapCards = mapFiles.map(file=>{
  const html=fs.readFileSync(file,"utf8");
  const google=[...html.matchAll(/https:\/\/www\.google\.com\/maps\/[^"'\s<]+/gi)].map(m=>m[0]);
  const hasMapAnchor=/id=["']mapa["']/i.test(html);
  if(!google.length && !hasMapAnchor) return null;
  const {country,continent}=metaFor(file);
  const destination=destinationFrom(html,file,"map");
  const title=plain((html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||"");
  const h1=plain((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"");
  const d=(h1.match(/(\d+)\s+D[IÍ]AS/i)||title.match(/en\s+(\d+)\s+d[ií]as/i)||[])[1];
  const dayCount=Number(d)||Math.max(1,(html.match(/VER RUTA EN GOOGLE MAPS/gi)||[]).length);
  const routes=Array.from({length:dayCount},(_,i)=>`<li><strong>Día ${i+1}</strong><span>Ruta del día ${i+1}</span></li>`).join("");
  const href=publicRoute(rel(file));
  return `<article class="card destination" data-continent="${esc(continent)}"><div class="preview"><span class="badge">MAPA + ${dayCount} DÍA${dayCount===1?"":"S"}</span><i class="line"></i><i class="dot d1"></i><i class="dot d2"></i><i class="dot d3"></i><i class="dot d4"></i></div><div class="body"><div class="titleline"><div><h3>${esc(destination)}</h3><div class="country">${esc(country)}</div></div><div class="days">${dayCount} día${dayCount===1?"":"s"}</div></div><div class="general"><b>⌖ Mapa general</b><span>Mapa y rutas enlazados desde el itinerario</span></div><ul class="routes">${routes}</ul><div class="actions"><a class="primary" href="${href}#mapa">VER MAPA GENERAL ↗</a><a class="secondary" href="${href}">VER ITINERARIO →</a></div></div></article>`;
}).filter(Boolean).sort((a,b)=>a.localeCompare(b,"es"));

const mapPlaceholder=`<article class="placeholder"><span>PRÓXIMAMENTE</span><h3>Más mapas VCC</h3><p>Cada nuevo itinerario con mapa o rutas de Google Maps aparecerá automáticamente aquí.</p></article>`;
replaceAuto("planifica/mapas/index.html","<!-- AUTO_MAPS_START -->","<!-- AUTO_MAPS_END -->",[...mapCards,mapPlaceholder].join("\n"));


/* Qué llevar: añadir automáticamente todas las guías de equipaje existentes,
   tanto las guías de Planifica como las de Destinos. Solo se publican archivos reales. */
const packingEditorial = {
  "destinos/suecia/estocolmo/que-llevar.html": {
    "name": "Estocolmo",
    "country": "Suecia",
    "continent": "europa",
    "type": [
      "ciudades"
    ],
    "typeLabel": "Ciudades",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1509356843151-3e7d96241e11.webp",
    "gallery": STOCKHOLM_GALLERY,
    "description": "Checklist personalizada según el mes y los días de viaje: ropa, equipaje y consejos prácticos.",
    "priority": 1
  },
  "planifica/que-llevar/suecia/index.html": {
    "name": "Suecia",
    "country": "Suecia",
    "continent": "europa",
    "type": [
      "ciudades",
      "naturaleza",
      "montanas"
    ],
    "typeLabel": "Ciudades · Naturaleza",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1531366936337-7c912a4589a7.webp",
    "description": "Ropa por capas, prendas de abrigo y calzado adecuado para cada época del año.",
    "priority": 2
  },
  "planifica/que-llevar/bali/index.html": {
    "name": "Bali",
    "country": "Indonesia",
    "continent": "asia",
    "type": [
      "playas",
      "naturaleza",
      "combinados"
    ],
    "typeLabel": "Playas · Naturaleza",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1537996194471-e657df975ab4.webp",
    "description": "Lo esencial para playas, excursiones, humedad y temporada de lluvias.",
    "priority": 3
  },
  "planifica/que-llevar/fuerteventura/index.html": {
    "name": "Fuerteventura",
    "country": "España",
    "continent": "europa",
    "type": [
      "playas",
      "naturaleza",
      "coche"
    ],
    "typeLabel": "Playas · Naturaleza",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1507525428034-b723cf961d3e.webp",
    "description": "Bañador, protección solar, cortavientos y básicos para recorrer la isla.",
    "priority": 4
  },
  "planifica/que-llevar/estados-unidos/index.html": {
    "name": "Estados Unidos",
    "country": "Estados Unidos",
    "continent": "america",
    "type": [
      "coche",
      "naturaleza",
      "ciudades",
      "combinados"
    ],
    "typeLabel": "Ruta en coche · Naturaleza",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1500530855697-b586d89ba3ee.webp",
    "description": "Equipaje versátil para una ruta que combina carretera, ciudades y parques naturales.",
    "priority": 5
  },
  "planifica/que-llevar/dubai/index.html": {
    "name": "Dubái",
    "country": "Emiratos Árabes Unidos",
    "continent": "asia",
    "type": [
      "ciudades",
      "combinados"
    ],
    "typeLabel": "Ciudades",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1518005020951-eccb494ad742.webp",
    "description": "Ropa fresca, calzado cómodo y prendas adecuadas para las visitas y el calor.",
    "priority": 6
  },
  "planifica/que-llevar/roma/index.html": {
    "name": "Roma",
    "country": "Italia",
    "continent": "europa",
    "type": [
      "ciudades"
    ],
    "typeLabel": "Ciudades",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1552832230-c0197dd311b5.webp",
    "description": "Calzado para caminar, ropa de temporada y accesorios para una escapada urbana.",
    "priority": 7
  },
  "planifica/que-llevar/paris/index.html": {
    "name": "París",
    "country": "Francia",
    "continent": "europa",
    "type": [
      "ciudades"
    ],
    "typeLabel": "Ciudades",
    "image": "/configuracion/imagenes/externas/unsplash/photo-1502602898657-3e91760cbb34.webp",
    "description": "Capas, prendas para la lluvia y una checklist práctica para descubrir la ciudad.",
    "priority": 8
  }
};
const packingContinents = {europa:"Europa",asia:"Asia",america:"América",africa:"África",oceania:"Oceanía"};
const packingSources = [
  ...walk(path.join(ROOT,"planifica","que-llevar")).filter(file=>/^planifica\/que-llevar\/[^/]+\/index\.html$/i.test(rel(file))),
  ...all.filter(file=>/^destinos\/.+\/que-llevar\.html$/i.test(rel(file)))
].filter(file=>PUBLISHED_FILES.has(rel(file)));
const packingCards = packingSources.map(file=>{
 const filePath=rel(file);
 const info=packingEditorial[filePath]||{};
 const html=fs.readFileSync(file,"utf8");
 const title=plain((html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||"");
 const slug=filePath.split("/").at(-2);
 const name=info.name||(title.match(/Qu[eé] llevar a\s+([^|:]+)/i)||[])[1]?.trim()||titleCaseSlug(slug);
 const fromDestinos=filePath.startsWith("destinos/");
 const countrySlug=fromDestinos?filePath.split("/")[1]:slug;
 const country=info.country||countryMeta[countrySlug]?.[0]||"";
 const continent=info.continent||countryMeta[countrySlug]?.[1]||"all";
 const type=Array.isArray(info.type)?info.type:["otros"];
 const typeLabel=info.typeLabel||"Otros viajes";
 const description=info.description||"Consulta la checklist de equipaje, la ropa recomendada y los consejos para este destino.";
 const href=publicRoute(filePath);
 const markup=catalogCard({kind:"packing",title:"Qué llevar a "+name,description,href,
  images:info.gallery||[info.image||"/configuracion/imagenes/fondos/fondos-que-llevar.webp"],
  country,type:type.join(" "),typeLabel,continent});
 return {markup,priority:info.priority??999,name};
}).sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name,"es"));
replaceAuto("planifica/que-llevar/index.html","<!-- AUTO_PACKING_START -->","<!-- AUTO_PACKING_END -->",packingCards.map(card=>card.markup).join("\n"));

console.log(`Hubs actualizados: ${budgetCards.length} presupuestos, ${mapCards.length} mapas, ${packingCards.length} guías de equipaje.`);
if(CHECK&&outdated.length){
  console.error("VCC: catálogos automáticos desactualizados: "+outdated.join(", "));
  process.exitCode=1;
}
