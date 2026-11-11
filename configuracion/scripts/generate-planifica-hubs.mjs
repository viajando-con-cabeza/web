import fs from "node:fs";
import path from "node:path";

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
function replaceAuto(file,start,end,body){
  const full=path.join(ROOT,file);
  let html=fs.readFileSync(full,"utf8");
  const a=html.indexOf(start), b=html.indexOf(end);
  if(a<0||b<0||b<a) throw new Error(`Missing auto markers in ${file}`);
  html=html.slice(0,a+start.length)+"\n"+body.trim()+"\n"+html.slice(b);
  fs.writeFileSync(full,html);
}

const all = walk(path.join(ROOT,"destinos")).filter(f => !f.endsWith(".html") || !/<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex/i.test(fs.readFileSync(f,"utf8")));

// Metadata editorial. Los importes se leen siempre del presupuesto publicado
// (perfil VCC), para no duplicar cifras ni confundir estimaciones con gastos reales.
const budgetEditorial = {
  "destinos/suecia/estocolmo/presupuesto.html": {
    type: "ciudades", typeLabel: "Ciudades", days: 3,
    image: "/configuracion/imagenes/externas/unsplash/photo-1509356843151-3e7d96241e11.webp",
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
const budgetCards = budgetFiles.map(file => {
  const html = fs.readFileSync(file, "utf8");
  const filePath = rel(file);
  const {country,continent} = metaFor(file);
  const destination = destinationFrom(html, file, "budget");
  const info = budgetEditorial[filePath] || {};
  const daily = budgetDailyAmount(html);
  const type = info.type || "otros";
  const typeLabel = info.typeLabel || "Otros viajes";
  const daysLabel = Number.isInteger(info.days) && info.days > 0 ? "<span>◷ " + info.days + " días</span>" : "";
  const photo = info.image || "/configuracion/imagenes/externas/unsplash/photo-1500530855697-b586d89ba3ee.webp";
  const description = info.description || "Consulta nuestro presupuesto completo, las categorías de gasto y los consejos para este destino.";
  const priceLabel = daily === null ? "Ver presupuesto" : new Intl.NumberFormat("es-ES", {maximumFractionDigits:1}).format(daily) + " €/persona/día";
  return [
    '<article class="it-card budget-card" data-continent="' + esc(continent) + '" data-type="' + esc(type) + '" data-daily="' + (daily ?? "") + '">',
    '<img src="' + esc(photo) + '" alt="Viaje a ' + esc(destination) + ', ' + esc(country) + '" loading="lazy" decoding="async">',
    '<div class="it-card-copy"><h2>' + esc(destination.toUpperCase()) + '</h2><p>' + esc(description) + '</p>',
    '<div class="it-meta"><span class="budget-price">€ ' + esc(priceLabel) + '</span><span>⌖ ' + esc(typeLabel) + '</span>' + daysLabel + '</div>',
    '<a href="/' + esc(filePath) + '" class="it-cta">VER PRESUPUESTO COMPLETO →</a></div></article>'
  ].join("");
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
  const href="/"+rel(file);
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
].filter(file=>!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(fs.readFileSync(file,"utf8")));
const packingCards = packingSources.map(file=>{
  const filePath=rel(file);
  const info=packingEditorial[filePath]||{};
  const html=fs.readFileSync(file,"utf8");
  const title=plain((html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||"");
  const slug=filePath.split("/").at(-2);
  const name=info.name||(title.match(/Qu[eé] llevar a\s+([^|:]+)/i)||[])[1]?.trim()||titleCaseSlug(slug);
  const fromDestinos=filePath.startsWith("destinos/");
  const countrySlug=fromDestinos?filePath.split("/")[1]:slug;
  const continent=info.continent||countryMeta[countrySlug]?.[1]||"all";
  const type=Array.isArray(info.type)?info.type:["otros"];
  const typeLabel=info.typeLabel||"Otros viajes";
  const description=info.description||"Consulta la checklist de equipaje, la ropa recomendada y los consejos para este destino.";
  const image=info.image||"/configuracion/imagenes/fondos/fondos-que-llevar.webp";
  const continentLabel=packingContinents[continent]||"Más destinos";
  const href="/"+filePath.replace(/\/index\.html$/i,"/");
  const markup=[
    '<article class="it-card packing-card" data-continent="'+esc(continent)+'" data-type="'+esc(type.join(" "))+'">',
    '<img src="'+esc(image)+'" alt="'+esc('Imagen ilustrativa para la guía de equipaje de '+name)+'" width="640" height="360" loading="lazy" decoding="async">',
    '<div class="it-card-copy"><h2>'+esc(name.toUpperCase())+'</h2><p>'+esc(description)+'</p>',
    '<div class="it-meta"><span>⌖ '+esc(typeLabel)+'</span><span>◎ '+esc(continentLabel)+'</span><span>✓ Checklist</span></div>',
    '<a href="'+esc(href)+'" class="it-cta">VER QUÉ LLEVAR →</a></div></article>'
  ].join("");
  return {markup,priority:info.priority??999,name};
}).sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name,"es"));
replaceAuto("planifica/que-llevar/index.html","<!-- AUTO_PACKING_START -->","<!-- AUTO_PACKING_END -->",packingCards.map(card=>card.markup).join("\n"));

console.log(`Hubs actualizados: ${budgetCards.length} presupuestos, ${mapCards.length} mapas, ${packingCards.length} guías de equipaje.`);
