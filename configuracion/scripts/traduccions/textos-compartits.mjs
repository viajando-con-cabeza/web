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
 'PAX':'PAX','pax':'pax','Próximamente':'Coming soon',
 'PRÓXIMAMENTE':'COMING SOON','Día 1':'Day 1','Día 2':'Day 2','Día 3':'Day 3'
};
export const normalize=s=>String(s||'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&')
 .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(m,n)=>String.fromCodePoint(Number(n)))
 .replace(/\s+/g,' ').trim();
export function eligible(value){
 const t=normalize(value);
 return t.length>=2&&t.length<=3500&&/[a-záéíóúñü]/i.test(t)&&
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
  if(/^(description|og:description|og:title|twitter:description|twitter:title)$/i.test(name))add(result,attr(m[0],'content'));
 }
 const clean=source.replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<(script|style|svg|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<[^>]+\s(?:data-translate|translate)=["']no["'][^>]*>[\s\S]*?<\/[^>]+>/gi,' ');
 for(const m of clean.matchAll(/>([^<>]+)</g))add(result,m[1]);
 for(const m of clean.matchAll(/<(?:img|input|a|button|textarea|area|abbr|select|option|nav|section|div)\b[^>]*>/gi)){
  for(const key of ['alt','aria-label','title','placeholder'])add(result,attr(m[0],key));
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
