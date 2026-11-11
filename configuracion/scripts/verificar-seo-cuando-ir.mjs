/** Validación SEO mínima de Cuándo ir en el despliegue Quality.
 * No consulta redes ni modifica ficheros. Detecta regresiones antes del deploy. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const html = read('destinos/suecia/estocolmo/cuando-ir.html');
const css = read('configuracion/css/destinos/suecia/estocolmo/cuando-ir-vcc.css');
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
assert.equal(matches(html, /class="ci-month-result" id="ci-month-panel-\d+"/g).length, 12,
  'Las fichas mensuales deben conservar sus 12 contenedores con anclaje');
assert.equal(matches(html, /class="ci-month-sources"/g).length, 1,
  'La nota de WeatherSpark debe aparecer una sola vez debajo del calendario');
assert.ok(css.includes('.ci-calendar-section>.ci-month-sources'),
  'La fuente compartida debe aparecer fuera de la tarjeta mensual');
assert.ok(!html.includes('ci-legend'), 'No se debe repetir la leyenda de precios del calendario');
assert.ok(html.includes('class="ci-quick-answer"'), 'Falta la respuesta rápida');
assert.ok(html.includes('data-count="8" data-mosaic-visible="4"'), 'Galería incompleta');
assert.ok(html.includes('data-seo-images="true"'), 'Mosaico sin imágenes SEO');
assert.ok(!html.includes('ci-august-vcc'), 'Consejo de agosto redundante');
assert.ok(!html.includes('href="/configuracion/css/plantillas/imprescindibles.css'), 'CSS de galería pesada otra vez');
assert.ok(existsSync(folder), 'Falta el CSS compartido reducido');
const lazyGallery = 'configuracion/js/componentes/vcc-gallery-lazy-loader.js';
assert.ok(html.includes('/'+lazyGallery) && html.includes('data-vcc-lazy-gallery'),
  'La galería de agosto debe cargar de forma diferida para mejorar el móvil');
assert.ok(existsSync(lazyGallery), 'No existe el cargador diferido de la galería');
const galleryLoader=read(lazyGallery);
assert.ok(galleryLoader.includes('/configuracion/css/componentes/galeria-vcc-cuando-ir.css')
  && galleryLoader.includes('/configuracion/css/componentes/vcc-gallery-booking.css'),
  'El cargador debe mantener los estilos originales de la galería');
assert.ok(galleryLoader.includes('/configuracion/js/componentes/vcc-gallery-booking.js')
  && galleryLoader.includes('/configuracion/js/plantillas/imprescindibles-interactions.js'),
  'El cargador debe mantener los controladores compartidos originales');
assert.ok(html.includes('data-vcc-lazy-background') && html.includes('vcc-lazy-background.js'),
  'La imagen de montañas no debe bloquear la carga inicial');
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


/* Regresiones funcionales: la extracción a módulos no debe perder enlaces,
   controles, selección mensual ni navegación accesible. */
const interaccionesPath = 'configuracion/js/destinos/suecia/estocolmo/cuando-ir-interacciones.js';
const subheaderPath = 'configuracion/js/destinos/suecia/estocolmo/cuando-ir-subheader.js';
for (const file of [interaccionesPath, subheaderPath]) {
  assert.ok(existsSync(file), `Falta el módulo de Cuándo ir: ${file}`);
  assert.ok(html.includes('/' + file), `El HTML no carga el módulo: ${file}`);
}
const interacciones = read(interaccionesPath);
const subheader = read(subheaderPath);
const monthButtons = matches(html, /<button\b[^>]*\bdata-month="(\d+)"[^>]*>/g);
assert.equal(monthButtons.length, 12, 'El calendario debe tener 12 botones');
const monthIndices = monthButtons.map(m => Number(m[1])).sort((a,b) => a-b);
assert.deepEqual(monthIndices, Array.from({length: 12}, (_,i) => i),
  'Los botones mensuales deben cubrir de enero a diciembre sin duplicados');
for (const [i, button] of monthButtons.entries()) {
  assert.ok(button[0].includes('aria-controls="ci-month-panel-' + button[1] + '"'),
    `El botón del mes ${button[1]} no apunta a su panel`);
}
assert.ok(interacciones.includes("calendar.addEventListener('keydown'"),
  'Falta la navegación mensual con teclado');
assert.ok(interacciones.includes("choices.addEventListener('click'"),
  'La selección de tipo de viaje debe seguir operativa');
assert.ok(interacciones.includes('monthPanels.forEach('),
  'La selección mensual debe alternar la visibilidad de los paneles');
assert.ok(subheader.includes('ci-subnav-placeholder') && subheader.includes('scheduleSync'),
  'Falta el comportamiento de fijación del subheader sin saltos');
for (const anchor of matches(html, /<nav class="st-tabs ci-subnav"[^>]*>([\s\S]*?)<\/nav>/g)
    .flatMap(m => matches(m[1], /href="#([^"]+)"/g).map(x => x[1]))) {
  assert.ok(ids.includes(anchor), `El subheader enlaza a una sección inexistente: #${anchor}`);
}
assert.ok(/@media\s*\(max-width:\s*800px\)/.test(css) &&
  css.includes('fondos-cuando-ir.webp') && html.includes('fondos-cuando-ir.webp'),
  'La portada de fondo única debe mantenerse también en móvil');

// Tres iconos SVG compartidos externamente; la geometría nunca se declara en el HTML.
const symbolPath='configuracion/imagenes/iconos/paginas/estocolmo-cuando-ir-simbolos.svg';
assert.ok(existsSync(symbolPath),'Falta la biblioteca externa de iconos del calendario');
const symbols=read(symbolPath);
for (const id of ['ci-icon-sunset','ci-icon-good','ci-icon-bad']) {
  assert.equal(symbols.split('<symbol id="' + id + '"').length - 1, 1,
    `Debe existir un solo símbolo externo: ${id}`);
  assert.equal(html.split('href="/' + symbolPath + '#' + id + '"').length - 1, 12,
    `Las doce fichas deben reutilizar el símbolo SVG externo: ${id}`);
  assert.equal(html.split('<symbol id="' + id + '"').length - 1, 0,
    `El icono no debe declararse dentro del HTML: ${id}`);
}

// Carrusel móvil de Nuestra experiencia: preservar tres tarjetas legibles y sus flechas.
assert.equal(matches(html, /<article class="ci-august-plan">/g).length, 3,
  'Deben mantenerse los tres consejos meteorológicos');
assert.ok(html.includes('class="ci-august-weather-prev"') &&
  html.includes('class="ci-august-weather-next"'),
  'Faltan las flechas superiores del carrusel de experiencia');
assert.ok(css.includes('.ci-august-weather-options>.ci-august-plan') &&
  css.includes('flex:0 0 100%') && css.includes('scroll-snap-type:x mandatory'),
  'Las tarjetas deben ocupar todo el ancho disponible en móvil');
assert.ok(interacciones.includes("weatherPrev.addEventListener('click'") &&
  interacciones.includes("weatherTrack.addEventListener('scroll'"),
  'Faltan los controles y el seguimiento de scroll del carrusel');

console.log('SEO Cuándo ir: canonical, sitemap, schema, Quality noindex y galería validados.');
