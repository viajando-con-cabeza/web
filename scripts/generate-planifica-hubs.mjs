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

const all = walk(path.join(ROOT,"destinos"));

const budgetFiles = all.filter(f=>/\/presupuesto\.html$/i.test(f));
const budgetCards = budgetFiles.map(file=>{
  const html=fs.readFileSync(file,"utf8");
  const {country,continent}=metaFor(file);
  const destination=destinationFrom(html,file,"budget");
  const featured=(html.match(/<article[^>]*class=["'][^"']*mode-card[^"']*featured[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)||[])[1]||"";
  const amount=plain((featured.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)||[])[1]||"") || "Ver guía";
  const href="/"+rel(file);
  const firstImg=(html.match(/<img[^>]+src=["']([^"']+)["']/i)||[])[1]||"";
  const bg = /^https?:\/\//.test(firstImg) ? firstImg : "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=84";
  return `<article class="card destination" data-continent="${esc(continent)}"><div class="card-media" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.48)),url('${esc(bg)}')"><div><small>${esc(country)} · ${esc(destination.toUpperCase())}</small><h3>${esc(destination)}</h3></div></div><div class="card-body"><div class="metrics"><div class="metric"><small>PRESUPUESTO VCC</small><strong>${esc(amount)}</strong><small>persona / día</small></div><div class="metric"><small>TIPO DE VIAJE</small><strong>VCC</strong><small>calidad + criterio</small></div></div><div class="mini"><span>🛏 Alojamiento</span><span>🍴 Comida</span><span>🚇 Transporte</span><span>🎟 Actividades</span></div><div class="highlight"><b>En la guía completa:</b> presupuesto, consejos y gastos del destino.</div><a class="cta" href="${href}">VER PRESUPUESTO COMPLETO →</a></div></article>`;
}).sort((a,b)=>a.localeCompare(b,"es"));

const budgetPlaceholder = `<article class="placeholder"><span>PRÓXIMAMENTE</span><h3>Más presupuestos VCC</h3><p>Cada nuevo presupuesto publicado dentro de un destino aparecerá automáticamente aquí.</p></article>`;
replaceAuto("planifica/presupuesto/index.html","<!-- AUTO_BUDGETS_START -->","<!-- AUTO_BUDGETS_END -->",[...budgetCards,budgetPlaceholder].join("\n"));

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

console.log(`Hubs actualizados: ${budgetCards.length} presupuestos, ${mapCards.length} mapas.`);
