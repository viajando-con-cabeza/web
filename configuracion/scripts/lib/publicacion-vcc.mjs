/* VCC · Registre editorial únic.
 * Fonts de veritat: publicacion-vcc.json; cap guia es publica per existir a Git.
 * Usat per SEO, sitemap, hubs i generadors de futures destinacions.
 */
import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const registry = Object.freeze(
  JSON.parse(fs.readFileSync(path.join(ROOT,"configuracion/datos/publicacion-vcc.json"),"utf8"))
);
export const ORIGIN = registry.origin;
export const approvedFiles = Object.freeze([...registry.approved]);
export const PUBLISHED_FILES = new Set(approvedFiles);

export function publicRoute(file) {
  const normalized = String(file).replace(/\\/g,"/");
  if(normalized==="index.html")return "/";
  if(normalized.endsWith("/index.html"))return "/"+normalized.slice(0,-"index.html".length);
  if(normalized.endsWith(".html"))return "/"+normalized.slice(0,-".html".length);
  throw new Error("Se requiere un archivo HTML: "+normalized);
}
export const publicUrl = file => ORIGIN+publicRoute(file);
export const isPublished = file => PUBLISHED_FILES.has(String(file).replace(/\\/g,"/"));
export const relativeSiteFile = fullPath => path.relative(ROOT,fullPath).split(path.sep).join("/");
export function normalizePublicPath(href) {
  try {
    const uri = new URL(href, ORIGIN);
    if(uri.origin!==ORIGIN)return null;
    const decoded=decodeURIComponent(uri.pathname);
    if(decoded.includes("..")||decoded.includes("\\")||decoded.startsWith("//"))return null;
    return decoded.replace(/\/index\.html$/i,"/").replace(/\.html$/i,"");
  }catch{return null;}
}
export function listSiteHtml(dir=ROOT, relative="") {
  const skip = new Set([".git",".github",".wrangler","node_modules","preview-dist","configuracion",".openai","dist"]);
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const p=path.posix.join(relative,entry.name);
    if(entry.isDirectory())return skip.has(entry.name)?[]:listSiteHtml(path.join(dir,entry.name),p);
    return entry.isFile()&&p.endsWith(".html")?[p]:[];
  });
}
