/* VCC · Auditoria de tots els HTML, CSS i JS, sense dependències ni escriptures.
 * Usage: node configuracion/scripts/auditar-escalabilidad-vcc.mjs [--json] [--strict-hubs]
 */
import fs from "node:fs";
import path from "node:path";
import {gzipSync} from "node:zlib";
import {ROOT, approvedFiles, publicRoute, normalizePublicPath, listSiteHtml} from "./lib/publicacion-vcc.mjs";

const published=new Set(approvedFiles.map(publicRoute)), pages=listSiteHtml().sort();
function walk(folder) {
  if(!fs.existsSync(folder))return [];
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{
    const p=path.join(folder,e.name);
    return e.isDirectory()?walk(p):e.isFile()?[p]:[];
  });
}
const styles=walk(path.join(ROOT,"configuracion/css")).filter(p=>p.endsWith(".css"));
const scripts=walk(path.join(ROOT,"configuracion/js")).filter(p=>p.endsWith(".js"));
const images=walk(path.join(ROOT,"configuracion/imagenes"))
  .filter(p=>/\.(?:webp|avif|png|jpe?g)$/i.test(p));
const sizes=new Map([...styles,...scripts,...images].map(p=>["/"+path.relative(ROOT,p).split(path.sep).join("/"),fs.statSync(p).size]));
// La mida CSS sense compressió és de diagnòstic; per detectar el cost
// aproximat de xarxa fem gzip per full. Cloudflare pot usar Brotli, per
// tant aquesta no és una mesura real del CDN ni dels bytes a la cache.
const cssGzip=new Map(styles.map(p=>[
 "/"+path.relative(ROOT,p).split(path.sep).join("/"),
 gzipSync(fs.readFileSync(p),{level:9}).length
]));
const approved=new Set(approvedFiles);
const stats={html:pages.length,approved:approved.size,drafts:pages.length-approved.size,cssFiles:styles.length,jsFiles:scripts.length,
  cssBytes:styles.reduce((n,p)=>n+fs.statSync(p).size,0),jsBytes:scripts.reduce((n,p)=>n+fs.statSync(p).size,0)};
const findings=[],pageStats=[],critical=[];
function attr(tag,key){const m=tag.match(new RegExp("\\b"+key+"=[\"']([^\"']*)[\"']","i"));return m?m[1]:"";}
const hubs=new Set(["planifica/presupuesto/index.html","planifica/mapas/index.html","planifica/que-llevar/index.html"]);
for(const file of pages){
  const originalHtml=fs.readFileSync(path.join(ROOT,file),"utf8"),live=approved.has(file);
  // Els <noscript> són recursos alternatius quan no hi ha JS: no s'han de
  // comptar juntament amb els CSS/JS de la càrrega normal del navegador.
  const html=originalHtml.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,"");
  const sheets=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]).filter(x=>/\brel=["']stylesheet["']/i.test(x));
  const css=sheets.map(x=>attr(x,"href").split("?")[0]).filter(Boolean);
  const googleFontRequests=css.filter(x=>x==="https://fonts.googleapis.com/css2").length;
  const js=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/gi)].map(x=>x[1].split("?")[0]);
  const repeatCss=css.filter((v,i)=>css.indexOf(v)!==i),repeatJs=js.filter((v,i)=>js.indexOf(v)!==i);
  // IMPORTANT: \\bhref també detectava el sufix de data-vcc-original-href.
  // Cal inspeccionar NOMÉS atributs href reals, i no comptar breadcrumbs
  // ascendents cap a un país en draft com un enllaç a una guia futura.
  const current=publicRoute(file);
  const localLinks=[...html.matchAll(/<a\b[^>]*\s+href=["']([^"']+)/gi)]
    .map(x=>x[1]).filter(x=>!x.includes("${"))
    .map(x=>normalizePublicPath(x,current)).filter(Boolean);
  const isAncestor=route=>route!==current && route.endsWith("/") && current.startsWith(route);
  const drafts=[...new Set(localLinks.filter(x=>
    x.startsWith("/destinos/")&&!published.has(x)&&!isAncestor(x)))];
  const draftsRedirected=[...html.matchAll(/<a\b[^>]*\s+data-vcc-publication=["']draft["']/gi)].length;
  const imgs=[...html.matchAll(/<img\b[^>]*>/gi)].map(x=>x[0]);
  const missingAlt=imgs.filter(x=>!/\balt=/.test(x)).length;
  const noDimensions=imgs.filter(x=>!/\bwidth=["']\d+/.test(x)||!/\bheight=["']\d+/.test(x)).length;
  // Pressupost de càrrega: les fotos locals grans no s'han de servir com a
  // fitxer únic a targetes; els originals R2 del visor s'avaluen a part.
  const heavyImg=imgs.filter(tag=>{
    const url=attr(tag,"src").split("?")[0];
    return url.startsWith("/configuracion/imagenes/") &&
      (sizes.get(url)||0)>400*1024 && !/\bsrcset=["']/.test(tag);
  });
  const result={file,live,stylesheets:css.length,googleFontRequests,cssRawBytes:css.reduce((n,u)=>n+(sizes.get(u)||0),0),
    cssGzipEstimate:css.reduce((n,u)=>n+(cssGzip.get(u)||0),0),
    javascript:js.length,jsRawBytes:js.reduce((n,u)=>n+(sizes.get(u)||0),0),
    repeatedCSS:repeatCss.length,repeatedJS:repeatJs.length,inlineStyle:(html.match(/<style\b/gi)||[]).length,
    inlineScript:(html.match(/<script\b(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/gi)||[]).length,
    images:imgs.length,missingAlt,noDimensions,linksToDrafts:drafts.length,draftFallbacks:draftsRedirected};
  if(live){
    if(googleFontRequests>1)critical.push(file+": "+googleFontRequests+" peticions Google Fonts CSS; consolidar la família en una URL");
    if(repeatCss.length||repeatJs.length)critical.push(file+": recursos CSS/JS cargados repetidamente");
    if(missingAlt)critical.push(file+": "+missingAlt+" imagenes sin texto alternativo");
    if(heavyImg.length)critical.push(file+": "+heavyImg.length+" fotografies locals >400 KB sense srcset");
    if(css.length>20)critical.push(file+": "+css.length+" hojas CSS (límite 20)");
    // 350KB de CSS cru no equivalen al que descarrega l'usuari.
    // No relaxem el pressupost: el substituïm per un límit
    // comprimit + límit dur de CSS cru per protegir el parseig.
    if(result.cssGzipEstimate>125*1024)
      critical.push(file+": "+Math.round(result.cssGzipEstimate/1024)+" KB gzip CSS estimat (límit 125 KB)");
    if(result.cssRawBytes>650*1024)
      critical.push(file+": "+Math.round(result.cssRawBytes/1024)+" KB CSS cru (límit sever 650 KB)");
    else if(result.cssRawBytes>350*1024)
      findings.push({file,kind:"heavy-css-uncompressed",
        rawKB:Math.round(result.cssRawBytes/1024),
        gzipKB:Math.round(result.cssGzipEstimate/1024)});
    if(!html.includes("site-header.js")||!html.includes("site-footer.js"))
      critical.push(file+": faltan componentes comunes header/footer");
  }
  pageStats.push(result);
  if(repeatCss.length||repeatJs.length)findings.push({file,kind:"duplicate-assets",css:repeatCss,js:repeatJs});
  if(live&&drafts.length)findings.push({file,kind:"links-to-drafts",count:drafts.length,examples:drafts.slice(0,6)});
  if(live&&missingAlt)findings.push({file,kind:"missing-alt",count:missingAlt});
  if(hubs.has(file)&&drafts.length)critical.push(file+": "+drafts.length+" links to unpublished guides");
}
const sum=key=>pageStats.reduce((n,x)=>n+(x[key]||0),0);
const totals={duplicateCSS:sum("repeatedCSS"),duplicateJS:sum("repeatedJS"),inlineStyle:sum("inlineStyle"),
  inlineScript:sum("inlineScript"),missingAlt:pageStats.filter(x=>x.live).reduce((n,x)=>n+x.missingAlt,0),
  pagesLinkingDrafts:pageStats.filter(x=>x.live&&x.linksToDrafts).length,
  pagesWithDraftFallbacks:pageStats.filter(x=>x.live&&x.draftFallbacks).length,
  totalDraftFallbacks:sum("draftFallbacks")};
pageStats.sort((a,b)=>b.cssRawBytes-a.cssRawBytes);
const topCssPages=pageStats.slice(0,12).map(x=>({file:x.file,css:x.stylesheets,cssKB:Math.round(x.cssRawBytes/1024),gzipKB:Math.round(x.cssGzipEstimate/1024),
  js:x.javascript,jsKB:Math.round(x.jsRawBytes/1024),draftLinks:x.linksToDrafts}));
const report={stats,totals,topCssPages,findings:findings.slice(0,90),critical};
if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
else{
  console.log("VCC escala:",stats.html,"HTML;",stats.cssFiles,"CSS;",stats.jsFiles,"JS");
  console.log("Publicables",stats.approved,"| esborranys",stats.drafts);
  console.log("CSS:",Math.round(stats.cssBytes/1024),"KB originals | JS:",Math.round(stats.jsBytes/1024),"KB originals");
  console.log("CSS/JS duplicats en una mateixa pàgina:",totals.duplicateCSS,totals.duplicateJS);
  console.log("Inline styles/scripts:",totals.inlineStyle,totals.inlineScript,
    "| pàgines aprovades enllaçant esborranys:",totals.pagesLinkingDrafts);
  console.log("Pàgines més pesades (CSS):",JSON.stringify(topCssPages.slice(0,8)));
  for(const entry of critical)console.error("BLOQUEIG HUB:",entry);
}
if(process.env.GITHUB_STEP_SUMMARY){
  const lines=["## Auditoria escalabilitat VCC",
    "HTML: "+stats.html+" · CSS: "+stats.cssFiles+" · JS: "+stats.jsFiles,
    "Publicables: "+stats.approved+" · Esborranys: "+stats.drafts,
    "Enllaços als esborranys en pàgines publicables: "+totals.pagesLinkingDrafts,
    "CSS/JS duplicats a la mateixa pàgina: "+totals.duplicateCSS+"/"+totals.duplicateJS,
    "### CSS per pàgina"];
  for(const p of topCssPages.slice(0,6))lines.push("- "+p.file+": "+p.cssKB+" KB cru / ~"+p.gzipKB+" KB gzip ("+p.css+" fitxers)");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join("\n")+"\n");
}
if(process.argv.includes("--strict-hubs")&&critical.length)process.exitCode=1;
