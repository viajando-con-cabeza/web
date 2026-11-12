/* VCC · Portades ràpides.
 * Deriva les versions responsives de les mateixes fotografies originals.
 * No remaqueta, no aplica filtres i només activa assets que ja existeixen.
 * --write genera CSS/HTML; --check verifica que tot és idempotent.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {ROOT, approvedFiles} from "./lib/publicacion-vcc.mjs";
const manifestPath="configuracion/imagenes/fondos/optimizadas/manifest.json";
const cssPath="configuracion/css/componentes/portadas-rapidas-vcc.css";
const sharedCorePath="configuracion/css/componentes/vcc-core-compartit.css";
const write=process.argv.includes("--write");
const issues=[],updated=[];
const file=p=>path.join(ROOT,p);
if(!fs.existsSync(file(manifestPath))) {
  console.error("Falten WebP optimitzats. Executa python configuracion/scripts/generar-portadas-rapidas.py");
  process.exit(1);
}
const manifest=JSON.parse(fs.readFileSync(file(manifestPath),"utf8"));
const imgs=manifest.images;
function variant(name,width){
  const info=imgs[name],v=info?.variants?.[width];
  if(!v||!fs.existsSync(file(v.path.slice(1))))throw Error("Versió "+width+" inexistent: "+name);
  return v.path+"?v="+info.fingerprint;
}
function sync(p,content){
  const old=fs.existsSync(file(p))?fs.readFileSync(file(p),"utf8"):null;
  if(content===old)return;
  updated.push(p);
  if(write){fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),content,"utf8");}
}
const pages=[
  ["index.html","fondos-inicio","body.inicio-vcc .home-hero::before","bg"],
  ["destinos/index.html","fondos-destinos","body.destinos-vcc .destinos-about-hero > .about-hero-photo","bg"],
  ["itinerarios/index.html","fondos-itinerarios","body.itinerarios-vcc:not(.que-llevar-hub):not(.presupuestos-vcc) .itinerarios-hero > .about-hero-photo","bg"],
  ["planifica/index.html","fondos-planifica","body.planifica-vcc .planifica-about-hero > .about-hero-photo","bg"],
  ["nosotros/index.html","fondos-nosotros","body.about-vcc .about-hero > .about-hero-photo","bg"],
  ["contacto/index.html","fondos-contacto","body:has(.contact-page) .contact-page .contact-hero::before","bg"],
  ["planifica/donde-ir/index.html","fondos-como-llegar","html body .di-hero.vcc-portada-transparente","var"],
  ["planifica/vuelos/index.html","fondos-vuelos","html body .vl-page .vl-hero.tv-hero.vcc-portada-transparente","var"],
  ["planifica/tarjetas-de-viaje/index.html","fondos-planifica","html body .tv-page .tv-hero.vcc-portada-transparente","var"],
  ["planifica/que-llevar/index.html","fondos-que-llevar","body.que-llevar-hub .itinerarios-hero > .about-hero-photo","bg"],
  ["destinos/suecia/estocolmo/imprescindibles.html","fondos-que-ver","html body .imp-page .imp-hero.vcc-portada-transparente","var"],
  ["destinos/suecia/estocolmo/presupuesto.html","fondos-presupuesto","html body.budget-vcc .budget-hero.vcc-portada-transparente","var"],
  ["destinos/suecia/estocolmo/cuando-ir.html","fondos-cuando-ir","html body.ci-page .vcc-hero.vcc-portada-transparente","vcc"],
  ["destinos/suecia/estocolmo/como-llegar.html","fondos-como-llegar","html body .cl-page.cl-landing .cl-landing-hero.vcc-portada-transparente","var"],
  ["destinos/suecia/estocolmo/como-moverse.html","fondos-como-moverse","html body .mv-page .mv-hero.vcc-portada-transparente","var"],
  ["destinos/suecia/estocolmo/entradas-y-pases.html","fondos-entradas-y-pases","html body .ep-page .ep-hero.vcc-portada-transparente","var"],
  ["destinos/suecia/estocolmo/donde-dormir.html","fondos-donde-dormir","dv-hero-photo","img"],
  ["destinos/suecia/estocolmo/que-llevar.html","fondos-que-llevar","ql-hero-photo","img"]
];
for(const [p,name] of pages) {
  if(!approvedFiles.includes(p))issues.push("Pàgina optimitzada no aprovada "+p);
  if(!imgs[name])issues.push("No hi ha imatge original "+name);
  for(const w of ["480","960","1920"])try{variant(name,w)}catch(e){issues.push(e.message)}
}
if(issues.length)throw Error(issues.join("\n"));
const maps=pages.filter(x=>x[3]!=="img"), css=[];
css.push("/* VCC · Portades responsives: originals intactes, mateixes fotografies a cada pantalla.");
css.push("   El fade i les posicions segueixen regulats pels CSS de components. */");
for(const [media,width] of [["(max-width: 767px)","960"],["(min-width: 768px)","1920"]]){
  css.push("@media "+media+" {");
  for(const [,name,selector,kind] of maps){
    const url="url('"+variant(name,width)+"')";
    const declarations=kind==="bg"?"background-image:"+url+"!important;":
      "--vcc-portada-imatge:"+url+"!important;"+(kind==="vcc"?"--vcc-hero-image:"+url+"!important;":"");
    css.push("  "+selector+"{"+declarations+"}");
  }
  css.push("}");
}
const text=css.join("\n")+"\n";
sync(cssPath,text);
const linkHash=crypto.createHash("sha256").update(text).digest("hex").slice(0,12);
const link='<link rel="stylesheet" data-vcc-fast-heroes href="/'+cssPath+'?v='+linkHash+'">';
// La navegacio no pot esperar que site-header.js injecti el CSS després del DOM.
// El mateix CSS compartit es carrega ara al <head> de totes les pàgines aprovades.
if(!fs.existsSync(file(sharedCorePath)))throw Error("Falta el CSS compartit. Executa npm run css:build");
const coreHash=crypto.createHash("sha256").update(fs.readFileSync(file(sharedCorePath))).digest("hex").slice(0,12);
const coreLink='<link rel="stylesheet" data-vcc-core-styles href="/'+sharedCorePath+'?v='+coreHash+'">';
const named=new Map(pages.map(x=>[x[0],x]));
const originalRE=/\/configuracion\/imagenes\/fondos\/(fondos-[\w-]+)\.webp(?:\?[^"'\s<)]*)?/i;
let pagesChanged=0;
for(const p of approvedFiles){
  if(!fs.existsSync(file(p)))continue;
  const original=fs.readFileSync(file(p),"utf8");
  let html=original;
  const cfg=named.get(p);
  // La fotografia OG no es toca. Els preloads només són de la portada real.
  if(cfg){
    const [,name,selector,kind]=cfg;
    if(kind==="img"){
      const imgRE=new RegExp('<img\\b(?=[^>]*\\bclass=["\\u0027][^"\\u0027]*\\b'+selector+'\\b)[^>]*>','i');
      if(!imgRE.test(html))issues.push(p+": no s'ha trobat l'img de la portada");
      else {
        html=html.replace(imgRE,tag=>{
          let result=tag.replace(/\s+srcset=["'][^"']*["']/gi,"").replace(/\s+sizes=["'][^"']*["']/gi,"");
          result=result.replace(/\bsrc=["'][^"']*["']/i,'src="'+variant(name,"1920")+'"');
          return result.replace(/>$/,' srcset="'+variant(name,"960")+' 960w, '+variant(name,"1920")+' 1920w" sizes="(max-width: 767px) 300px, 100vw">');
        });
      }
    }
    const preloadMobile='<link rel="preload" as="image" type="image/webp" media="(max-width: 767px)" href="'+variant(name,"960")+'" fetchpriority="high">';
    const preloadDesktop='<link rel="preload" as="image" type="image/webp" media="(min-width: 768px)" href="'+variant(name,"1920")+'" fetchpriority="high">';
    html=html.replace(/<link\b[^>]*\brel=["']preload["'][^>]*>\s*/gi,tag=>{
      if(!/\bas=["']image["']/i.test(tag)||
         !(tag.includes("/configuracion/imagenes/fondos/"+name+".webp")||
           tag.includes("/configuracion/imagenes/fondos/optimizadas/"+name+"-")))return tag;
      return "";
    });
    // El preload s'ha d'inserir durant el parseig inicial, no via JavaScript.
    html=html.replace(/<\/head\s*>/i,preloadMobile+"\n"+preloadDesktop+"\n</head>");
  }
  // El logotip té viewBox 620x216; reservar la proporció a l'HTML
  // evita reflows mentre arriben els estils globals, sense canviar-ne el CSS.
  html=html.replace(/<img\b(?=[^>]*\bsrc=["']\/configuracion\/imagenes\/marca\/logo-viajando-con-cabeza\.svg["'])[^>]*>/gi,tag=>{
    if(!/\bwidth=["']/.test(tag))tag=tag.replace(/>$/,' width="620">');
    if(!/\bheight=["']/.test(tag))tag=tag.replace(/>$/,' height="216">');
    return tag;
  });
  // Thumb: no descarregar 1 MB per cada targeta de 300 px.
  html=html.replace(/<img\b[^>]*>/gi,tag=>{
    if(/\bsrcset=/.test(tag))return tag;
    const matched=tag.match(/\bsrc=["']([^"']*\/configuracion\/imagenes\/fondos\/(fondos-[\w-]+)\.webp)(?:\?[^"']*)?["']/i);
    if(!matched||!imgs[matched[2]])return tag;
    const w=tag.match(/\bwidth=["'](\d+)["']/i)?.[1];
    if(!w||Number(w)>850)return tag;
    const name=matched[2];
    return tag.replace(/>$/,' srcset="'+variant(name,"480")+' 480w, '+variant(name,"960")+' 960w" sizes="(max-width: 767px) 50vw, '+Math.max(200,Number(w))+'px">');
  });
  // La ruta versionada de la CSS canvia només quan canvien les fotos.
  html=html.replace(/<link\b[^>]*data-vcc-fast-heroes[^>]*>\s*/gi,"");
  if(cfg){
    // Evitem nous salts de linia a cada generacio; la sortida ha de ser idempotent.
    html=html.replace(/(?:\r?\n[ \t]*){2,}(?=<\/head\s*>)/i,"\n");
    html=html.replace(/<\/head\s*>/i,link+"\n</head>");
  }
  // Prevenir FOUC/CLS: el CSS del header i dels tokens arriba amb l'HTML.
  // Es reescriu idempotentment amb hash de contingut per compartir caché.
  // Unificar també els enllaços antics afegits sense data-vcc-core-styles.
  html=html.replace(/<link\b(?=[^>]*\bhref=["']\/configuracion\/css\/componentes\/vcc-core-compartit\.css(?:\?[^"']*)?["'])[^>]*>\s*/gi,"");
  if(html.includes('/configuracion/js/site-header.js')){
    html=html.replace(/(?:\r?\n[ \t]*){2,}(?=<\/head\s*>)/i,"\n");
    html=html.replace(/<\/head\s*>/i,coreLink+"\n</head>");
  }
  if(html!==original){pagesChanged++;sync(p,html);}
}
if(issues.length)throw Error(issues.join("\n"));
if(!write && updated.length){
  console.error("VCC portades desactualitzades:",updated.join(", "));
  process.exitCode=1;
}
console.log("VCC portades: "+pages.length+" portades registrades; "+pagesChanged+
  " HTML per sincronitzar; "+updated.length+" fitxers "+(write?"actualitzats":"pendents"));
