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
// Única excepció editorial: la portada de Planifica > Presupuestos utilitza
// una fotografia pròpia d'Unsplash, no la portada genèrica de Presupuesto.
// Les dues resolucions han de derivar del MATEIX original.
const externalManifestPath="configuracion/imagenes/externas/unsplash/optimizadas/manifest.json";
const externalImgs=JSON.parse(fs.readFileSync(file(externalManifestPath),"utf8")).images;
function imageInfo(name,source="fondos"){return source==="externas"?externalImgs[name]:imgs[name]}

function variant(name,width,source="fondos"){
  const info=imageInfo(name,source);
  // El generador Unsplash crea 1600px, suficients per a aquesta fotografia
  // vertical, mentre que les portades genèriques creen 1920px.
  const effective=source==="externas"&&String(width)==="1920"?"1600":String(width);
  const v=info?.variants?.[effective];
  if(!v||!fs.existsSync(file(v.path.slice(1))))throw Error("Versió "+effective+" inexistent: "+name);
  return v.path+"?v="+info.fingerprint;
}
function sync(p,content){
  const old=fs.existsSync(file(p))?fs.readFileSync(file(p),"utf8"):null;
  if(content===old)return;
  updated.push(p);
  if(write){fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),content,"utf8");}
}
const registry=JSON.parse(fs.readFileSync(file("configuracion/datos/portadas-vcc.json"),"utf8"));
const pages=registry.pages.map(({page,image,selector,kind,source})=>[page,image,selector,kind,source||"fondos"]);
for(const [p,name,, ,source] of pages) {
  if(!approvedFiles.includes(p))issues.push("Pàgina optimitzada no aprovada "+p);
  if(!imageInfo(name,source))issues.push("No hi ha imatge original "+name);
  for(const w of ["480","960","1920"])try{variant(name,w,source)}catch(e){issues.push(e.message)}
  const info=imageInfo(name,source);
  if(info){
    const original=file(info.source.slice(1));
    if(!fs.existsSync(original))issues.push("Falta original "+info.source);
    else if(crypto.createHash("sha256").update(fs.readFileSync(original)).digest("hex").slice(0,12)!==info.fingerprint)
      issues.push("Variants desactualitzades per "+info.source);
  }
}
if(issues.length)throw Error(issues.join("\n"));
const maps=pages.filter(x=>x[3]!=="img"), css=[];
css.push("/* VCC · Portades responsives: originals intactes, mateixes fotografies a cada pantalla.");
css.push("   El fade i les posicions segueixen regulats pels CSS de components. */");
for(const [media,width] of [["(max-width: 767px)","960"],["(min-width: 768px)","1920"]]){
  css.push("@media "+media+" {");
  for(const [,name,selector,kind,source] of maps){
    const url="url('"+variant(name,width,source)+"')";
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
    const [,name,selector,kind,source]=cfg;
    if(kind==="img"){
      const imgRE=new RegExp('<img\\b(?=[^>]*\\bclass=["\\u0027][^"\\u0027]*\\b'+selector+'\\b)[^>]*>','i');
      if(!imgRE.test(html))issues.push(p+": no s'ha trobat l'img de la portada");
      else {
        html=html.replace(imgRE,tag=>{
          let result=tag.replace(/\s+srcset=["'][^"']*["']/gi,"").replace(/\s+sizes=["'][^"']*["']/gi,"");
          result=result.replace(/\bsrc=["'][^"']*["']/i,'src="'+variant(name,"1920",source)+'"');
          // El navegador selecciona la mida correcta sense renderitzar una
          // segona fotografia. Hero no lazy; dimensió per evitar CLS.
          result=result.replace(/\s+loading=["']lazy["']/gi,"");
          if(!/\bfetchpriority=/.test(result))result=result.replace(/>$/,' fetchpriority="high">');
          const dim=imageInfo(name,source).variants["960"];
          if(!/\bwidth=["']/.test(result))result=result.replace(/>$/,' width="'+dim.width+'">');
          if(!/\bheight=["']/.test(result))result=result.replace(/>$/,' height="'+dim.height+'">');
          return result.replace(/>$/,' srcset="'+variant(name,"960",source)+' 960w, '+variant(name,"1920",source)+' '+(source==="externas"?"1600":"1920")+'w" sizes="(max-width: 767px) 320px, 100vw">');
        });
      }
    }
    const preloadMobile='<link rel="preload" as="image" type="image/webp" media="(max-width: 767px)" href="'+variant(name,"960",source)+'" fetchpriority="high">';
    const preloadDesktop='<link rel="preload" as="image" type="image/webp" media="(min-width: 768px)" href="'+variant(name,"1920",source)+'" fetchpriority="high">';
    html=html.replace(/<link\b[^>]*\brel=["']preload["'][^>]*>\s*/gi,tag=>{
      if(!/\bas=["']image["']/i.test(tag))return tag;
      const href=tag.match(/\bhref=["']([^"']+)/i)?.[1]?.split("?")[0]||"";
      const selected=imageInfo(name,source);
      const priorSource=source==="externas"&&p==="planifica/presupuesto/index.html"&&
        href.includes("/configuracion/imagenes/fondos/optimizadas/fondos-presupuesto-");
      const samePhoto=href.includes(selected?.source||"__missing__")||
        Object.values(selected?.variants||{}).some(v=>href===v.path);
      return samePhoto||priorSource?"":tag;
    });
    // LCP: l'escàner del navegador descobreix el recurs ABANS dels CSS,
    // evitant la descoberta tardana al final del <head>.
    const early=/<meta\b[^>]*\bcharset\s*=\s*["']?[^\s>]+[^>]*>/i;
    html=early.test(html)?html.replace(early,tag=>tag+"\n"+preloadMobile+"\n"+preloadDesktop):
      html.replace(/<head\b[^>]*>/i,tag=>tag+"\n"+preloadMobile+"\n"+preloadDesktop);
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
  // Un mateix full local només es carrega una vegada. En cas de versió
  // print/onload + versió directa, conservar la directa. <noscript> no
  // participa al renderitzat amb JS i no es modifica.
  const fallbacks=[];
  html=html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,chunk=>{
    const token='VCC_NOSCRIPT_'+fallbacks.length+'_END';
    fallbacks.push(chunk);return token;
  });
  const linkRE=/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi;
  const candidates=[...html.matchAll(linkRE)].map(m=>m[0]);
  const choices=new Map();
  candidates.forEach((tag,i)=>{
    const href=tag.match(/\bhref=["']([^"']+)/i)?.[1]?.split('?')[0];
    if(!href?.startsWith('/configuracion/css/'))return;
    const deferred=/\bmedia=["']print["']|\bonload=/.test(tag),weight=deferred?0:1;
    const previous=choices.get(href);
    if(!previous||weight>previous.weight)choices.set(href,{index:i,weight});
  });
  let ix=0;
  html=html.replace(linkRE,tag=>{
    const href=tag.match(/\bhref=["']([^"']+)/i)?.[1]?.split('?')[0];
    const keep=!href?.startsWith('/configuracion/css/')||choices.get(href)?.index===ix;
    ix++;return keep?tag:'';
  });
  html=html.replace(/VCC_NOSCRIPT_(\d+)_END/g,(_,num)=>fallbacks[Number(num)]);
  if(html!==original){pagesChanged++;sync(p,html);}
}
if(issues.length)throw Error(issues.join("\n"));
if(!write && updated.length){
  console.error("VCC portades desactualitzades:",updated.join(", "));
  process.exitCode=1;
}
console.log("VCC portades: "+pages.length+" portades registrades; "+pagesChanged+
  " HTML per sincronitzar; "+updated.length+" fitxers "+(write?"actualitzats":"pendents"));
