/* VCC · Cataleg Dónde ir: l'estat publicat deriva només de publicacion-vcc.json.
 * Les futures guies són visibles com a pròximament, sense enllaços públics.
 * El href original queda emmagatzemat per tornar-se a activar quan s'aprovi.
 */
import fs from "node:fs";
import path from "node:path";
import {ROOT, approvedFiles, publicRoute, normalizePublicPath} from "./lib/publicacion-vcc.mjs";
const page="planifica/donde-ir/index.html";
const file=path.join(ROOT,page),original=fs.readFileSync(file,"utf8");
const publicRoutes=new Set(approvedFiles.map(publicRoute));
const write=process.argv.includes("--write");
const css="/configuracion/css/componentes/estat-publicacio-vcc.css";
const escapeAttr=value=>value.replace(/&/g,"&amp;").replace(/"/g,"&quot;");
let total=0,active=0,drafts=0;
let output=original.replace(/<a\b(?=[^>]*\bdata-di-item\b)[^>]*>/gi,tag=>{
  total++;
  const old=tag.match(/\bdata-vcc-original-href="([^"]*)"/i)?.[1]||
    tag.match(/\bhref="([^"]*)"/i)?.[1];
  if(!old)throw new Error("Tarjeta sin URL original en "+page);
  const target=normalizePublicPath(old,"/planifica/donde-ir/");
  if(!target)return tag; // enlaces externos no se modifican
  const clean=tag.replace(/\s+(?:href|data-vcc-original-href|data-vcc-publication|aria-disabled)="[^"]*"/gi,"").replace(/>$/,"");
  if(publicRoutes.has(target)){
    active++;
    return clean+' href="'+escapeAttr(target)+'">';
  }
  drafts++;
  return clean+' data-vcc-original-href="'+escapeAttr(old)+'" data-vcc-publication="draft" aria-disabled="true">';
});
if(!output.includes('href="'+css+'"')){
  output=output.replace(/<\/head\s*>/i,'<link rel="stylesheet" href="'+css+'">\n</head>');
}
if(total===0)throw new Error("No se localizaron tarjetas data-di-item");
if(write&&output!==original)fs.writeFileSync(file,output,"utf8");
console.log("VCC Dónde ir:",total,"tarjetas,",active,"publicadas,",drafts,"en borrador;",
  output===original?"sin cambios":write?"sincronizadas":"desactualizadas");
if(!write&&original!==output)process.exitCode=1;
