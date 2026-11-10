/** Validación SEO mínima de Cuándo ir en el despliegue Quality.
 * No consulta redes ni modifica ficheros. Detecta regresiones antes del deploy. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const html = read('destinos/suecia/estocolmo/cuando-ir.html');
const sitemap = read('sitemap.xml');
const headers = read('_headers');
const wrangler = JSON.parse(read('wrangler.jsonc'));
const canonical = 'https://viajandoconcabeza.com/destinos/suecia/estocolmo/cuando-ir';
const folder = 'configuracion/css/componentes/galeria-vcc-cuando-ir.css';

const matches = (source, pattern) => [...source.matchAll(pattern)];
const ids = matches(html, /\bid="([^"]+)"/g).map(m => m[1]);
const headings = matches(html, /<h1\b/g);

assert.equal(wrangler.assets.html_handling, 'auto-trailing-slash',
  'El Worker y la URL canónica deben usar el mismo modo de rutas');
assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), 'Canonical no coincide con la ruta real');
assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`), 'OG URL no coincide');
assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), 'La URL no está correctamente en sitemap.xml');
assert.ok(!sitemap.includes(`<loc>${canonical}.html</loc>`), 'Sitemap contiene URL con redirección');
assert.equal(headings.length, 1, 'Debe haber un solo H1');
assert.equal(ids.length, new Set(ids).size, 'Hay ids duplicados');
assert.equal(matches(html, /data-month-panel="\d+"/g).length, 12, 'Falta un mes');
assert.equal(matches(html, /class="ci-month-vcc"/g).length, 12, 'Falta un consejo mensual');
assert.ok(html.includes('class="ci-quick-answer"'), 'Falta la respuesta rápida');
assert.ok(html.includes('data-count="8" data-mosaic-visible="4"'), 'Galería incompleta');
assert.ok(html.includes('data-seo-images="true"'), 'Mosaico sin imágenes SEO');
assert.ok(!html.includes('ci-august-vcc'), 'Consejo de agosto redundante');
assert.ok(!html.includes('href="/configuracion/css/plantillas/imprescindibles.css'), 'CSS de galería pesada otra vez');
assert.ok(existsSync(folder), 'Falta el CSS compartido reducido');
assert.ok(html.includes('/configuracion/css/componentes/galeria-vcc-cuando-ir.css'), 'Galería sin CSS');
assert.ok(headers.includes('https://web-quality.albertini1199.workers.dev/*') && headers.includes('X-Robots-Tag: noindex'),
  'Debe excluirse el entorno de pruebas');
assert.ok(!/^(?:\/\*|https:\/\/viajandoconcabeza\.com\/\*)\s*\n\s*X-Robots-Tag:\s*noindex/m.test(headers),
  'No bloquear el dominio de producción');

const ld = matches(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  .map(m => JSON.parse(m[1]));
const graph = ld.flatMap(v => v['@graph'] || [v]);
const webpage = graph.find(v => v['@type'] === 'WebPage');
const bread = graph.find(v => v['@type'] === 'BreadcrumbList');
assert.equal(webpage?.url, canonical, 'Schema WebPage URL incorrecta');
assert.equal(webpage?.['@id'], canonical + '#webpage', 'Schema WebPage ID incorrecto');
assert.equal(bread?.itemListElement?.at(-1)?.item, canonical, 'Schema Breadcrumb incorrecto');

console.log('SEO Cuándo ir: canonical, sitemap, schema, Quality noindex y galería validados.');
