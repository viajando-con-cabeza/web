/* Validacion SEO comun para paginas publicables de VCC (quality/main).
 * No altera archivos, no requiere red ni librerias externas.
 * El listado vive en lib/seo-site.mjs y se comparte al ampliar destinos. */
import fs from "node:fs";
import {
  ORIGIN, publishable, readSiteFile, canonicalUrl,
  headOf, linkCanonical, sitemapLocs, fileForPublicUrl
} from "./lib/seo-site.mjs";

const issues = [];
const fail = message => issues.push(message);
const xml = readSiteFile("sitemap.xml");
const listed = sitemapLocs(xml);
const urls = new Set(listed);
if (listed.length !== urls.size) fail("Hay entradas duplicadas en sitemap.xml");

for (const loc of listed) {
  let file;
  try { file = fileForPublicUrl(loc); }
  catch { fail("URL mal formada en sitemap: " + loc); continue; }
  if (!file) fail("Dominio o ruta no valida en sitemap: " + loc);
  else if (!fs.existsSync(file)) fail("Sitemap apunta a pagina inexistente: " + loc);
}

for (const [file, route] of publishable) {
  if (!fs.existsSync(file)) { fail("Falta la pagina publicable: " + file); continue; }
  const html = readSiteFile(file);
  const head = headOf(html);
  const expected = canonicalUrl(route);
  const canonical = linkCanonical(head);
  if (canonical !== expected) fail(file + ": canonical " + (canonical || "ausente") + " != " + expected);
  if (!urls.has(expected)) fail(file + ": pagina publicable ausente del sitemap");
  if (!/<title\b[^>]*>[^<]+<\/title>/i.test(head)) fail(file + ": falta title");
  if (!/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'][^"']+["']/i.test(head))
    fail(file + ": falta meta description");
  if (/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(head))
    fail(file + ": pagina publicable marcada noindex");
  // Metadata social completa per pàgina: impedeix futures publicacions incompletes.
  const metaTags=[...head.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0]);
  const socialKeys=['property="og:title"','property="og:description"','property="og:image"',
    'property="og:url"','name="twitter:card"'];
  for(const key of socialKeys){
    const tags=metaTags.filter(tag=>tag.includes(key));
    if(tags.length!==1)fail(file+': se requiere un '+key+' (encontrados '+tags.length+')');
    else if(!/\bcontent=["'][^"']+["']/i.test(tags[0]))fail(file+': valor vacío para '+key);
  }
  const ogTag=metaTags.find(tag=>tag.includes('property="og:url"'));
  const ogUrl=ogTag?.match(/\bcontent=["']([^"']+)/i)?.[1];
  if(ogUrl!==expected)fail(file+': og:url diferente de canonical');
  const h1 = (html.match(/<h1\b/gi) || []).length;
  if (h1 !== 1) fail(file + ": requiere un H1 en el HTML inicial (tiene " + h1 + ")");
}

// Paginacion/enlaces en construccion: accesibles para usuarios, no para indexacion.
for (const [file, route] of [["en/index.html","/en/"], ["planifica/apps/index.html","/planifica/apps/"]]) {
  if (!fs.existsSync(file)) continue;
  const head = headOf(readSiteFile(file));
  if (!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(head))
    fail(file + ": se debe marcar noindex hasta completar contenido");
  if (urls.has(ORIGIN + route)) fail(file + ": un borrador no debe estar en sitemap");
}

// El sitio sigue creciendo: cada HTML nuevo debe quedar noindex hasta aprobarse.
const {readdirSync,readFileSync}=fs;
const ignored=new Set([".git",".github","node_modules","configuracion",".wrangler","preview-dist",".openai"]);
function scan(dir=""){
  return readdirSync(dir||".",{withFileTypes:true}).flatMap(entry=>{
    const p=dir?dir+"/"+entry.name:entry.name;
    return entry.isDirectory()?(ignored.has(entry.name)?[]:scan(p)):(p.endsWith(".html")?[p]:[]);
  });
}
const approvedFiles=new Set(publishable.map(([file])=>file));
for(const file of scan()){
  if(approvedFiles.has(file))continue;
  const head=headOf(readFileSync(file,"utf8"));
  if(!/<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["']noindex,follow["'])[^>]*>/i.test(head))
    fail(file+": borrador sin noindex,follow (publicacion no autorizada)");
}
if(!readSiteFile("wrangler.jsonc").includes('"html_handling": "auto-trailing-slash"'))
  fail("Cloudflare: falta html_handling auto-trailing-slash");
for(const loc of listed)if(/\.html(?:[?#]|$)/i.test(loc))
  fail("Sitemap: URL .html no canónica "+loc);

const headers = readSiteFile("_headers");
if (!headers.includes("https://quality.viajandoconcabeza.com/*") ||
    !headers.includes("X-Robots-Tag: noindex"))
  fail("Faltan reglas de noindex del entorno quality");
if (headers.includes("https://viajandoconcabeza.com/*\n  X-Robots-Tag: noindex"))
  fail("La produccion no debe heredar noindex");

if (issues.length) {
  for (const issue of issues) console.error("SEO VCC:", issue);
  console.error("Errores SEO:", issues.length);
  process.exitCode = 1;
} else {
  console.log("SEO VCC OK:", publishable.length,
    "paginas publicables verificadas,", listed.length, "entradas de sitemap");
}
