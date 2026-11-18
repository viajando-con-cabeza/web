/* Shared ES->EN text inventory: visible HTML + dynamic UI, not executable code. */
import fs from 'node:fs';
import path from 'node:path';
export const MODEL='@cf/google/gemma-4-26b-a4b-it';
export const SEED={
 'Viajando con Cabeza':'Viajando con Cabeza',VCC:'VCC',
 'INICIO':'HOME','Inicio':'Home','DESTINOS':'DESTINATIONS','Destinos':'Destinations',
 'ITINERARIOS':'ITINERARIES','Itinerarios':'Itineraries','PLANIFICA':'PLAN',
 'Planifica':'Plan','NOSOTROS':'ABOUT','Nosotros':'About us','CONTACTO':'CONTACT',
 'Contacto':'Contact','ES':'ES','EN':'EN','Suecia':'Sweden','Estocolmo':'Stockholm',
 'SUECIA':'SWEDEN','ESTOCOLMO':'STOCKHOLM','Ver más':'View more',
 'VER MÁS':'VIEW MORE','Ver todos':'View all','VOLVER':'BACK',
 'Volver':'Back','LEER MÁS':'READ MORE','Leer más':'Read more',
 'Web oficial':'Official website','WEB OFICIAL':'OFFICIAL WEBSITE',
 'PAX':'PAX','pax':'pax','El mapa interactivo requiere JavaScript. Puedes consultar cada lugar y su enlace a Google Maps más abajo.':'The interactive map requires JavaScript. You can find each location and its Google Maps link below.',
 'Próximamente':'Coming soon',
 'PRÓXIMAMENTE':'COMING SOON','Día 1':'Day 1','Día 2':'Day 2','Día 3':'Day 3'
};
export const normalize=s=>String(s||'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&')
 .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(m,n)=>String.fromCodePoint(Number(n)))
 .replace(/\s+/g,' ').trim();
export function eligible(value){
 const t=normalize(value);
 return t.length>=2&&t.length<=3500&&/[a-záéíóúñü]/i.test(t)&&
  !/^[-−+≈]?\s*\d[\d\s.,:–-]*(?:h|°C)$/i.test(t)&&
  !/^[-−+≈]?\s*\d[\d\s.,:–-]*\s*[€£$]\s*\/\s*pax$/i.test(t)&&
  !/^[-+\d.,€£$% \s]+$/.test(t)&&!/[<>]/.test(t)&&!t.includes('{{')&&!t.includes('$'+'{');
}
const attr=(tag,key)=>tag.match(new RegExp('\\b'+key+'\\s*=\\s*(["\\x27])([\\s\\S]*?)\\1','i'))?.[2]||'';
const add=(set,value)=>{const t=normalize(value);if(eligible(t))set.add(t);};
export function htmlTexts(source){
 const result=new Set();
 const title=source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
 if(title)add(result,title[1]);
 for(const m of source.matchAll(/<meta\b[^>]*>/gi)){
  const name=attr(m[0],'name')||attr(m[0],'property');
  if(/^(description|og:description|og:title|og:image:alt|twitter:description|twitter:title|twitter:image:alt)$/i.test(name))add(result,attr(m[0],'content'));
 }
 const clean=source.replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<(script|style|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<[^>]+\s(?:data-translate|translate)=["']no["'][^>]*>[\s\S]*?<\/[^>]+>/gi,' ');
 for(const m of clean.matchAll(/>([^<>]+)</g))add(result,m[1]);
 for(const m of clean.matchAll(/<[a-z][a-z0-9:-]*\b[^>]*>/gi)){
  for(const key of ['alt','aria-label','aria-description','title','placeholder','label'])add(result,attr(m[0],key));
 }
 return [...result];
}
const spanishCue=/[áéíóúñü¿¡]|\b(?:elije|elige|consulta|descubre|gu[ií]a|presupuesto|viaje|viajar|nuestra|nuestro|consejos|m[aá]s|d[ií]as|ahorra|busca|destino|d[oó]nde|cu[aá]ndo|cu[aá]nto|selecciona|filtrar|cargar|ver|qu[eé]|guardar|aeropuerto|descuento|persona|noche|meses|precio|alojamiento|tren|maleta|mochila|vuelos|itinerario|planifica|ciudad|transporte)\b/i;
function jsStrings(script){
 const output=new Set();
 if(!spanishCue.test(script))return [];
 const literals=[...script.matchAll(/"((?:\\.|[^"\\]){2,1800})"|'((?:\\.|[^'\\]){2,1800})'/g)]
   .map(m=>m[1]??m[2]??'');
 // Template string literal content, not JS interpolation or selectors.
 const sections=script.split(String.fromCharCode(96));
 for(let i=1;i<sections.length;i+=2)literals.push(sections[i]);
 for(const raw of literals){
  // Do not mistake embedded JavaScript source or comments for visible UI copy.
  if(/\bconst\s+footerCSSPath\b/.test(raw))continue;
  if(!spanishCue.test(raw))continue;
  if(raw.includes('<')&&raw.includes('>')){
    const stripped=raw.replace(/\$\{[^}]*\}/g,' ');
    for(const m of stripped.matchAll(/>([^<>]+)</g))add(output,m[1]);
  }else if(raw.length<400&&spanishCue.test(raw)&&
     (/\s/.test(raw)||/[áéíóúñü¿¡]/.test(raw)) &&
     !/^(?:https?:|\/|\.\/|[.#][a-z-]+|\w+\.[cm]?[jt]s|--[a-z-]+|[a-z_-]+\s*:\s*)/i.test(raw) &&
     !/[{};]/.test(raw)&&!/(?:document\.|window\.|querySelector|classList|localStorage|console\.|JSON\.)/.test(raw)){
    add(output,raw);
  }
 }
 return [...output];
}
export function interactiveTexts(root,sourceFiles=[]){
 const out=new Set(),base=path.join(root,'configuracion/js');
 function walk(dir){
  if(!fs.existsSync(dir))return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
   const full=path.join(dir,e.name);
   if(e.isDirectory())walk(full);
   else if(e.isFile()&&e.name.endsWith('.js')){
    for(const t of jsStrings(fs.readFileSync(full,'utf8')))out.add(t);
   }
  }
 }
 walk(base);
 // Some interactive tools render labels directly from shared JSON data, not HTML.
 const budget=path.join(root,'configuracion/datos/presupuestos/suecia.json');
 if(fs.existsSync(budget)){
  const data=JSON.parse(fs.readFileSync(budget,'utf8'));
  const visit=(obj,field='')=>{
   if(typeof obj==='string'){
    if(/^(?:label|name|detail|description|transport|unit|lujo|medio|mochilero|vcc)$/i.test(field)&&
      !/^(?:https?:|\/|[a-z0-9-]+\.avif)$/i.test(obj))add(out,obj);
   }else if(Array.isArray(obj))obj.forEach(x=>visit(x,field));
   else if(obj&&typeof obj==='object')for(const [k,v]of Object.entries(obj))visit(v,k);
  };
  visit(data);
 }
 const countries=path.join(root,'configuracion/datos/paises-vcc.json');
 if(fs.existsSync(countries)){
  const data=JSON.parse(fs.readFileSync(countries,'utf8'));
  for(const value of Object.values(data.countries||{}))
   if(Array.isArray(value)&&typeof value[0]==='string')add(out,value[0]);
 }
 for(const file of sourceFiles){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
   for(const t of jsStrings(match[1]))out.add(t);
  }
 }
 return [...out];
}

/** Reviewed deterministic EN for rating aria-labels and decimal-price descriptions
 *  that neural translators would otherwise reformat or leave in Spanish. */
const ratingWord={'Fabuloso':'Excellent','Muy bien':'Very good','Fantástico':'Fantastic','Excelente':'Excellent'};
const nameEn=v=>v.replace(/\bEstocolmo\b/g,'Stockholm').replace(/\bSuecia\b/g,'Sweden');
const NUMERIC_PRICES=new Map([
 ['Taxi puntual (trayecto tipo ≈32 €) + billete SL suelto ≈3,91 €/adulto. Sin coche.','Occasional taxi (typical trip ≈32 €) + single SL ticket ≈3,91 €/adult. No car.'],
 ['Taxi puntual (≈32 € para 10 km/15 min) + SL suelto ≈3,91 €/adulto; sin parking','Occasional taxi (≈32 € for 10 km/15 min) + single SL ticket ≈3,91 €/adult; no parking'],
 ['Taxi puntual a Djurgården + SL suelto ≈3,91 €/adulto; sin abono','Occasional taxi to Djurgården + single SL ticket ≈3,91 €/adult; no pass'],
 ['Taxi urbano puntual o billete SL ≈3,91 €/adulto; sin alquiler','Occasional city taxi or SL ticket ≈3,91 €/adult; no rental car'],
 ['Abono SL 72 h ≈32,74 €/adulto; margen para taxi puntual. Sin coche.','SL 72 h pass ≈32,74 €/adult; budget for an occasional taxi. No car.'],
 ['Abono SL 72 h ≈32,74 €/adulto para todo el viaje (importe prorrateado)','SL 72 h pass ≈32,74 €/adult for the whole trip (allocated cost)'],
 ['Metro/tranvía con abono SL 72 h (≈32,74 €/adulto los 3 días); margen para taxi','Metro/tram with an SL 72 h pass (≈32,74 €/adult for all 3 days); budget for taxis'],
 ['Abono SL 72 h (≈32,74 €/adulto los 3 días); margen para otros traslados','SL 72 h pass (≈32,74 €/adult for all 3 days); budget for extra transfers'],
 ['25 €/pax/día en comidas y cafés (≈8–12,50 €/comida, media orientativa).','25 €/person/day for meals and cafés (≈8–12,50 €/meal, indicative average).'],
 ['7 billetes SL por persona (301 SEK ≈27,37 € por persona). Gasto total de transporte: 90 € entre dos.','7 SL tickets per person (301 SEK ≈27,37 € per person). Total transport cost: 90 € for two.'],
 ['2 billetes SL sueltos por persona (≈7,82 €/adulto). Transporte del día: 25 € entre dos.','2 single SL tickets per person (≈7,82 €/adult). Daily transport: 25 € for two.'],
 ['3 billetes SL sueltos por persona (≈11,73 €/adulto). Transporte del día: 39 € entre dos.','3 single SL tickets per person (≈11,73 €/adult). Daily transport: 39 € for two.'],
 ['2 billetes SL sueltos por persona (≈7,82 €/adulto). Transporte del día: 26 € entre dos.','2 single SL tickets per person (≈7,82 €/adult). Daily transport: 26 € for two.'],
 ['Billetes SL sueltos ≈3,91 €/adulto (7 serían ≈27,37 €/persona). Sin taxi ni coche.','Single SL tickets ≈3,91 €/adult (7 would be ≈27,37 €/person). No taxi or car.'],
 ['2 billetes SL sueltos/persona ≈7,82 €/adulto; resto a pie','2 single SL tickets/person ≈7,82 €/adult; walk the rest'],
 ['3 billetes SL sueltos/persona ≈11,73 €/adulto; resto a pie','3 single SL tickets/person ≈11,73 €/adult; walk the rest'],
 ['2 billetes SL sueltos/persona ≈7,82 €/adulto; sin taxi ni coche','2 single SL tickets/person ≈7,82 €/adult; no taxi or car']
]);
export function fallbackEnglish(value){
 const t=normalize(value);
 if(NUMERIC_PRICES.has(t))return NUMERIC_PRICES.get(t);
 const metrics={
  'Conexiones':'Transport connections','Oferta hotelera':'Hotel selection',
  'Restaurantes y servicios':'Restaurants and amenities','Tranquilidad':'Peace and quiet',
  'Ambiente y entorno':'Atmosphere and surroundings','Oferta cultural':'Cultural attractions',
  'Relación calidad-precio':'Value for money'
 };
 const metric=t.match(/^(.+): ([\d,.]+) sobre 10$/i);
 if(metric&&metrics[metric[1]])return metrics[metric[1]]+': '+metric[2]+' out of 10';
 if(/^Guía VCC: https?:\/\//i.test(t))return 'VCC guide: '+t.slice('Guía VCC: '.length);
 let m;
 if((m=t.match(/^(.+), valoración editorial VCC ([\d,.]+) sobre 10\. Ver análisis y (\d+) hoteles$/i)))
  return nameEn(m[1])+', VCC editorial rating '+m[2]+' out of 10. View analysis and '+m[3]+' hotels';
 if((m=t.match(/^Valoración VCC: ([\d,.]+) de 10 · (.+)$/i)))
  return 'VCC rating: '+m[1]+' out of 10 · '+(ratingWord[m[2]]||m[2]);
 if((m=t.match(/^Relación calidad-precio: ([\d,.]+) sobre 10$/i)))
  return 'Value for money: '+m[1]+' out of 10';
 if((m=t.match(/^Nota VCC del destino (.+): ([\d,.]+) sobre 10, (.+)$/i)))
  return 'VCC destination rating for '+nameEn(m[1])+': '+m[2]+' out of 10, '+(ratingWord[m[3]]||m[3]);
 if((m=t.match(/^Nota VCC de guía general de (.+): ([\d,.]+) sobre 10, (.+)$/i)))
  return 'VCC general guide rating for '+nameEn(m[1])+': '+m[2]+' out of 10, '+(ratingWord[m[3]]||m[3]);
 if((m=t.match(/^Ver valoración VCC de (.+): ([\d,.]+) sobre 10$/i)))
  return 'View VCC rating for '+nameEn(m[1])+': '+m[2]+' out of 10';
 if((m=t.match(/^Nota VCC de (.+): ([\d,.]+), (.+)$/i)))
  return 'VCC rating for '+nameEn(m[1])+': '+m[2]+', '+(ratingWord[m[3]]||m[3]);
 return null;
}
