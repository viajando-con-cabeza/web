/* Utilitats compartides de SEO static per a VCC.
 * Afegir aqui les pagines que ja estan preparades per a indexacio. */
import fs from "node:fs";
import path from "node:path";

export const ORIGIN = "https://viajandoconcabeza.com";
export const ROOT = process.cwd();
export const publishable = [
  ["index.html", "/"],
  ["destinos/index.html", "/destinos/"],
  ["itinerarios/index.html", "/itinerarios/"],
  ["planifica/index.html", "/planifica/"],
  ["planifica/vuelos/index.html", "/planifica/vuelos/"],
  ["planifica/alojamientos/index.html", "/planifica/alojamientos/"],
  ["planifica/presupuesto/index.html", "/planifica/presupuesto/"],
  ["planifica/que-llevar/index.html", "/planifica/que-llevar/"],
  ["planifica/donde-ir/index.html", "/planifica/donde-ir/"],
  ["planifica/mapas/index.html", "/planifica/mapas/"],
  ["planifica/calcula-tu-viaje/index.html", "/planifica/calcula-tu-viaje/"],
  ["planifica/tarjetas-de-viaje/index.html", "/planifica/tarjetas-de-viaje/"],
  ["nosotros/index.html", "/nosotros/"],
  ["contacto/index.html", "/contacto/"],
  ["destinos/suecia/estocolmo/index.html", "/destinos/suecia/estocolmo/"],
  ["destinos/suecia/estocolmo/itinerario.html", "/destinos/suecia/estocolmo/itinerario"],
  ["destinos/suecia/estocolmo/imprescindibles.html", "/destinos/suecia/estocolmo/imprescindibles"],
  ["destinos/suecia/estocolmo/presupuesto.html", "/destinos/suecia/estocolmo/presupuesto"],
  ["destinos/suecia/estocolmo/cuando-ir.html", "/destinos/suecia/estocolmo/cuando-ir"],
  ["destinos/suecia/estocolmo/como-moverse.html", "/destinos/suecia/estocolmo/como-moverse"],
  ["destinos/suecia/estocolmo/como-llegar.html", "/destinos/suecia/estocolmo/como-llegar"],
  ["destinos/suecia/estocolmo/que-ver.html", "/destinos/suecia/estocolmo/que-ver.html"],
  ["destinos/suecia/estocolmo/que-llevar.html", "/destinos/suecia/estocolmo/que-llevar.html"],
  ["destinos/suecia/estocolmo/donde-dormir.html", "/destinos/suecia/estocolmo/donde-dormir.html"],
  ["destinos/suecia/estocolmo/entradas-y-pases.html", "/destinos/suecia/estocolmo/entradas-y-pases.html"],
  ["destinos/italia/roma/index.html", "/destinos/italia/roma/"],
  ["destinos/italia/roma/que-ver.html", "/destinos/italia/roma/que-ver.html"]
];

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
