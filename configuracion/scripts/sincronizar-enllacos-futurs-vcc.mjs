/**
 * VCC · Gestió d'enllaços a guies pendents, build-time, sense canviar el disseny.
 * Font de veritat: publicacion-vcc.json + enllacos-futurs-vcc.json.
 * Conservar href original i restaurar-lo automàticament en aprovar una guia.
 * Cap enllaç a una pàgina pare de navegació (breadcrumb) es modifica.
 *
 * node configuracion/scripts/sincronizar-enllacos-futurs-vcc.mjs --write
 * node configuracion/scripts/sincronizar-enllacos-futurs-vcc.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import {ROOT, approvedFiles, publicRoute, normalizePublicPath, listSiteHtml} from "./lib/publicacion-vcc.mjs";

const write=process.argv.includes("--write");
const check=process.argv.includes("--check") || !write;
const asJson=process.argv.includes("--json");
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,"configuracion/datos/enllacos-futurs-vcc.json"),"utf8"));
const published=new Set(approvedFiles.map(publicRoute));
const siteFiles=listSiteHtml();
const existing=new Set(siteFiles.map(publicRoute));
const issues=[], changes=[];
let softened=0, restored=0, ancestors=0;
const originalAttribute="data-vcc-original-href";
const publicationAttribute="data-vcc-publication";
const attr=(tag,key)=>tag.match(new RegExp("\\s"+key+"=(['\"])(.*?)\\1","i"))?.[2];
const cleanTag=tag=>tag
  .replace(/\s+(?:href|data-vcc-original-href|data-vcc-publication)=(["']).*?\1/gi,"")
  .replace(/>$/, "");
const escapeAttr=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;");
const localRoute=(href,base)=>{
  if(!href || /[<>]|(\$\{)/.test(href))return null;
  return normalizePublicPath(href,base);
};
function fallbackFor(route){
  if(Object.prototype.hasOwnProperty.call(manifest.exact,route))
    return manifest.exact[route];
  return (manifest.prefixes||[]).find(x=>route.startsWith(x.prefix))?.fallback||null;
}
function isAncestor(route,current){
  return route!==current && current.startsWith(route) && route.endsWith("/");
}
function verifyFallbacks(){
  if(manifest.version!==1)issues.push("Versió del mapa d'enllaços desconeguda");
  const targets=[...Object.values(manifest.exact),...(manifest.prefixes||[]).map(x=>x.fallback)];
  for(const fallback of new Set(targets)){
    const u=new URL(fallback,"https://viajandoconcabeza.com/");
    const route=normalizePublicPath(fallback);
    if(!published.has(route))issues.push("El fallback no és una pàgina aprovada: "+fallback);
    if(u.hash){
      const targetFile=approvedFiles.find(file=>publicRoute(file)===route);
      if(!targetFile)continue;
      const html=fs.readFileSync(path.join(ROOT,targetFile),"utf8");
      const id=decodeURIComponent(u.hash.slice(1));
      if(!html.includes('id="'+id+'"')&&!html.includes("id='"+id+"'"))
        issues.push("Anchor de fallback absent: "+fallback);
    }
  }
}
verifyFallbacks();

for(const file of approvedFiles){
  const full=path.join(ROOT,file);
  const current=publicRoute(file);
  const original=fs.readFileSync(full,"utf8");
  const next=original.replace(/<a\b[^>]*>/gi,tag=>{
    const href=attr(tag,"href");
    const stored=attr(tag,originalAttribute);
    if(!href&&!stored)return tag;
    const intention=stored||href;
    const route=localRoute(intention,current);
    if(!route||!route.startsWith("/destinos/"))return tag;
    const fallback=fallbackFor(route);
    if(published.has(route)){
      if(!stored)return tag;
      restored++;
      return cleanTag(tag)+' href="'+escapeAttr(stored)+'">';
    }
    if(isAncestor(route,current) && existing.has(route)){ancestors++;return tag;}
    if(!fallback){
      if(!existing.has(route))issues.push(file+" enllaç inexistent: "+intention);
      else issues.push(file+" guia no aprovada sense fallback configurat: "+intention);
      return tag;
    }
    if(!existing.has(route))issues.push(file+" guia pendent sense fitxer: "+intention);
    const alreadyStored=stored===intention &&
      href===fallback && attr(tag,publicationAttribute)==="draft";
    if(alreadyStored)return tag;
    softened++;
    return cleanTag(tag)+' href="'+escapeAttr(fallback)+'" data-vcc-original-href="'+escapeAttr(intention)+'" data-vcc-publication="draft">';
  });
  if(next!==original){
    changes.push(file);
    if(write)fs.writeFileSync(full,next,"utf8");
  }
}
const result={approved:approvedFiles.length,modified:changes.length,files:changes,temporaryFallbacks:softened,restored,ancestorsPreserved:ancestors,issues};
if(asJson)console.log(JSON.stringify(result,null,2));
else console.log("VCC enllaços futurs:",result.approved,"guies aprovades;",result.modified,"fitxers per sincronitzar;",softened,"fallbacks;",restored,"restaurats;",issues.length,"incidències");
if(issues.length){for(const x of issues)console.error("VCC ENLLAÇ:",x);process.exitCode=1;}
if(check&&changes.length){console.error("VCC enllaços pendents de sincronitzar:",changes.join(", "));process.exitCode=1;}
