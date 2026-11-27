/* Utilitats compartides de SEO static per a VCC.
 * Afegir aqui les pagines que ja estan preparades per a indexacio. */
import fs from "node:fs";
import path from "node:path";

import {ORIGIN, ROOT, approvedFiles, publicRoute} from "./publicacion-vcc.mjs";
export {ORIGIN, ROOT};
export const publishable=approvedFiles.map(file=>[file,publicRoute(file)]);

export function readSiteFile(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

export function canonicalUrl(relativeUrl) {
  return ORIGIN + relativeUrl;
}

export function headOf(html) {
  return html.split(/<\/head\s*>/i)[0] || "";
}

export function linkCanonical(head) {
  const link = [...head.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0])
    .find(tag=>/\brel=["']canonical["']/i.test(tag));
  return link?.match(/\bhref=["']([^"']+)["']/i)?.[1] || null;
}

export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map(match=>match[1].trim());
}

export function fileForPublicUrl(uri) {
  const url = new URL(uri);
  if(url.origin!==ORIGIN) return null;
  const route = decodeURIComponent(url.pathname);
  if(route.includes("..")) return null;
  const relative = route.replace(/^\//, "");
  if(!relative || route.endsWith("/")) return path.join(ROOT, relative, "index.html");
  return path.join(ROOT, relative.endsWith(".html") ? relative : relative + ".html");
}
