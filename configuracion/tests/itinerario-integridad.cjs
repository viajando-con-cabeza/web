/* VCC · Regressions de l'itinerari d'Estocolm.
 * Execució: node configuracion/tests/itinerario-integridad.cjs
 * Sense paquets externs, xarxa ni modificacions de fitxers.
 * Aquests tests comproven contingut, integritat i dependències; per a
 * geometria, gestos de zoom i Core Web Vitals cal un navegador real. */
'use strict';

const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, dirname, join } = require('node:path');
const { Script } = require('node:vm');

const root = resolve(__dirname, '../..');
const read = file => readFileSync(join(root, file), 'utf8');
const html = read('destinos/suecia/estocolmo/itinerario.html');
const core = read('configuracion/css/plantillas/itinerario-core-vcc.css');
const polish = read('configuracion/css/plantillas/itinerario-polish-vcc.css');
const hero = read('configuracion/css/componentes/vcc-hero-editorial-vcc.css');
const heroTransparency = read('configuracion/css/componentes/portadas-transparencia.css');
const galleryJS = read('configuracion/js/componentes/vcc-gallery-booking.js');
const galleryLoader = read('configuracion/js/componentes/vcc-itinerary-gallery-on-demand.js');
const bundle = read('configuracion/css/plantillas/itinerario-compilado-vcc.css');
const scrollspy = read('configuracion/js/destinos/suecia/estocolmo/vcc-section-scrollspy.js');
const lazyBgJS = read('configuracion/js/componentes/vcc-lazy-background.js');

const count = (text, pattern) => [...text.matchAll(pattern)].length;
const gallery = [...html.matchAll(/<div class="day-mosaic count-(\d+)"[\s\S]*?<\/div>/g)];
const expectedPhotos = [34, 25, 30];

assert.match(html, /<html lang="es">/);
assert.equal(count(html, /<h1\b/g), 1, 'La pàgina ha de tenir un sol H1');
assert.match(html, /<title>Estocolmo en 3 días: ruta por horas y mapa \| VCC<\/title>/);
assert.match(html, /<meta name="description" content="[^"]+"/);
const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
assert.equal(canonical, 'https://viajandoconcabeza.com/destinos/suecia/estocolmo/itinerario');
assert.ok(read('sitemap.xml').includes(canonical + '</loc>'), 'Canonical i sitemap han de coincidir');

const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(match => JSON.parse(match[1]));
assert.deepEqual(ld.map(item => item['@type']).sort(), ['BlogPosting', 'BreadcrumbList']);
assert.equal(ld.find(item => item['@type'] === 'BlogPosting').mainEntityOfPage['@id'], canonical);

assert.equal(count(html, /class="day-section day-/g), 3, 'Cal conservar els 3 dies');
assert.equal(count(html, /class="stop-detail"/g), 17, 'Cal conservar les 17 parades dels tres dies');
assert.equal(count(html, /<aside class="day-tip">/g), 3, 'Cal conservar els 3 Consejo VCC');
assert.equal(gallery.length, 3, 'Cal conservar tres mosaics');
gallery.forEach((block, day) => {
  assert.equal(Number(block[1]), expectedPhotos[day], 'Comptador de fotos incorrecte al dia ' + (day + 1));
  assert.equal(count(block[0], /<button\b/g), expectedPhotos[day], 'Fotos incorrectes al dia ' + (day + 1));
  assert.equal(count(block[0], /data-photo="[^"]+"/g), expectedPhotos[day], 'Falten originals al dia ' + (day + 1));
  const srcTags = [...block[0].matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(x => x[1]);
  // Només 5 fotos renderitzades per dia al HTML inicial: les altres continuen
  // disponibles als botons data-photo i les carrega el visor quan calen.
  assert.equal(srcTags.length, 5, 'El mosaic inicial ha de ser compacte al dia ' + (day + 1));
  assert.ok(srcTags.every(url => url.includes('/__vcc_preview/mini/') || url.includes('/__vcc_preview/visor/')), 'No carregar originals directament al mosaic');
});
assert.match(html, /google\.com\/maps\/d\/embed/);
assert.match(html, /<iframe[^>]+loading="lazy"/);
assert.match(html, /<a href="#resumen">LA RUTA<\/a>/);
for (const day of [1, 2, 3]) {
  assert.ok(html.includes('href="#dia' + day + '"'), 'Falta la navegació del dia ' + day);
}

const images = [...html.matchAll(/<img\b[^>]*>/g)].map(x => x[0]);
assert.ok(images.length >= 15 && images.length < 35, 'El mosaic inicial no ha de renderitzar les 89 fotos abans de la interacció');
images.forEach((tag, i) => {
  assert.match(tag, /\balt="[^"]*"/, 'Falta alt a la foto ' + i);
  assert.match(tag, /\bwidth="\d+"/, 'Falta width a la foto ' + i);
  assert.match(tag, /\bheight="\d+"/, 'Falta height a la foto ' + i);
});
const previewImgs=gallery.flatMap(block => [...block[0].matchAll(/<img\b[^>]*>/g)].map(x=>x[0]));
assert.equal(previewImgs.length, 15, 'Cinc imatges visibles per dia; les 89 originals es mantenen com data-photo');
assert.equal(previewImgs.filter(tag => tag.includes('/__vcc_preview/mini/')).length, 12,
  'Cada mosaic ha de tenir una foto principal nítida i quatre miniatures R2');
previewImgs.forEach(tag => {
  assert.match(tag, /\bloading="lazy"/, 'Les previsualitzacions han de ser lazy');
  assert.match(tag, /\bdecoding="async"/, 'Les previsualitzacions han de descodificar-se async');
});

const desktopHeroUrl=hero.match(/--vcc-hero-image:url\('([^']+\.avif)'\)/)?.[1];
const mobileHeroUrl=hero.match(/@media\(max-width:767px\)[\s\S]*?--vcc-hero-image:url\('([^']+\.webp)'\)/)?.[1];
const preloadTags=[...html.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/gi)].map(m=>m[0])
  .filter(tag=>/\bas="image"/.test(tag));
const href=tag=>tag?.match(/\bhref="([^"]+)"/)?.[1];
const desktopPreload=href(preloadTags.find(tag=>tag.includes('media="(min-width: 768px)"')));
const mobilePreload=href(preloadTags.find(tag=>tag.includes('media="(max-width: 767px)"')));
assert.ok(desktopHeroUrl?.startsWith('https://img.viajandoconcabeza.com/'),
  "El hero escriptori ha de mantenir l'original R2");
assert.equal(desktopHeroUrl,desktopPreload,'El preload escriptori ha de correspondre al CSS');
assert.ok(mobileHeroUrl?.startsWith('/configuracion/imagenes/fondos/optimizadas/'),
  "El hero mòbil ha d'utilitzar el WebP local reduït");
assert.equal(mobileHeroUrl,mobilePreload,'El preload mòbil ha de correspondre al CSS');
assert.ok(existsSync(join(root,mobileHeroUrl.slice(1))),'WebP responsive mòbil inexistent');
assert.doesNotMatch(html,/--vcc-hero-image:url\(/,'No duplicar declaracions de portada a HTML');
const socialImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
assert.ok(socialImage?.startsWith('https://img.viajandoconcabeza.com/destinos/'), 'Falta original per a les xarxes socials');
assert.equal(ld.find(item => item['@type'] === 'BlogPosting').image, socialImage);
assert.ok(desktopHeroUrl.includes('/__vcc_preview/visor/'), 'El hero escriptori ha de fer servir el visor optimitzat');
assert.match(galleryJS, /requestOriginalForZoom\(\)/, 'Originals només quan es fa zoom');
assert.match(heroTransparency, /var\(--vcc-hero-image\)/, 'Degradat de portada compartit');
assert.doesNotMatch(core, /fondos-itinerario\.webp/, 'No tornar a descarregar l’antic fons');
assert.doesNotMatch(core + polish, /\.day-mosaic\.count-4/, 'No reintroduir l’antic mosaic de 4');

assert.match(html, /data-vcc-lazy-background/, 'El fons final ha de ser diferit');
assert.match(html, /vcc-lazy-background\.js/, 'Falta carregador del fons de les guies');
assert.match(core, /\.vcc-discover-section\[data-vcc-lazy-background\]:not\(\.vcc-bg-ready\)/, 'El CSS ha de desactivar el fons fora de pantalla');
assert.match(lazyBgJS, /IntersectionObserver/, 'Cal mantenir lazy background per al bloc final');
assert.equal(count(html, /<style id=/g), 0, 'Els estils editorials han de viure a configuracion');
assert.match(html, /data-vcc-sticky-mobile/);
assert.match(scrollspy, /stickyMobile=nav\.hasAttribute\('data-vcc-sticky-mobile'\)/);
assert.match(html, /vcc-itinerary-gallery-on-demand\.js/, 'El visor només es carrega a demanda');
assert.match(html, /data-vcc-lazy-gallery-modal/, 'Cal activar el visor diferit');
assert.doesNotMatch(html, /<script[^>]*src="[^"]*vcc-gallery-booking\.js/, 'No carregar el controlador abans de fer scroll');
assert.match(galleryLoader, /vcc-gallery-booking\.js/, 'El carregador diferit ha de muntar el visor comú');
assert.match(html, /vcc-gallery-booking\.css/, 'El mosaic necessita CSS des del primer pintat');
assert.match(html, /itinerario-compilado-vcc\.css/, 'Un sol CSS compilat per a la guia');
assert.match(bundle, /--vcc-hero-image:url\(/, 'El bundle ha de conservar el CSS de portada');
assert.doesNotMatch(bundle, /@import\s+url/, 'No carregar @import bloquejants');
assert.doesNotMatch(html, /<link[^>]*href="[^"]*vcc-hero-editorial-vcc\.css/, 'Hero integrat en el bundle');
assert.doesNotMatch(html, /itinerario-vcc-gallery\.js/);
assert.doesNotMatch(html, /itinerary-mobile-sticky-controller/);
assert.match(galleryJS, /lastActiveThumb/, 'Les miniatures actives no es recalculen totes amb cada foto');
assert.match(galleryJS, /warmSharp\(/, 'La galeria ha de precalentar les fotos nítides');
assert.match(galleryJS, /vcc-gallery-sharp-loading/, "El visor no ha d'estirar miniatures borroses");
assert.match(galleryJS, /deactivateGlobalGestures\(\)/);
assert.match(galleryJS, /day-lightbox-to-grid vcc-gallery-ui-back/, 'Cal mantenir el botó de Galería compartit');
assert.match(galleryJS, /<span>Galería<\/span>/, 'Cal mantenir el text del botó compartit');

for (const file of [
  'configuracion/js/componentes/vcc-gallery-booking.js',
  'configuracion/js/componentes/vcc-itinerary-gallery-on-demand.js',
  'configuracion/js/componentes/vcc-lazy-background.js',
  'configuracion/js/destinos/suecia/estocolmo/vcc-section-scrollspy.js'
]) {
  assert.doesNotThrow(() => new Script(read(file), { filename: file }), 'JS invàlid: ' + file);
}

const assetUrls = [
  ...html.matchAll(/<link\b[^>]*\bhref="(\/configuracion\/[^"]+\.css(?:\?[^"]*)?)"/g),
  ...html.matchAll(/<script\b[^>]*\bsrc="(\/configuracion\/[^"]+\.js(?:\?[^"]*)?)"/g)
].map(m => m[1].split('?')[0].slice(1));
assetUrls.forEach(file => assert.ok(existsSync(join(root, file)), 'Fitxer CSS/JS no trobat: ' + file));

console.log('VCC itinerari: OK — SEO, 3 dies, 17 parades, 89 fotos conservades, 15 previews R2, hero, mapes i components.');
