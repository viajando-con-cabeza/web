# Galeria VCC reutilitzable · Booking

Component compartit per a guies de `Viajando con Cabeza`, preparat inicialment per a l'itinerari d'Estocolm a la branca `quality`.

## Fitxers de referència

- **JavaScript:** `/configuracion/js/componentes/vcc-gallery-booking.js`.
- **CSS:** `/configuracion/css/componentes/vcc-gallery-booking.css`.
- **Implementació actual:** `/destinos/suecia/estocolmo/itinerario.html`.

El component genera tot el visor. **No cal copiar el HTML intern del modal** ni el JavaScript del zoom, el desplaçament, les miniatures, el comptador o els controls.

## Integració en una guia nova

1. Carregar el CSS compartit i el JavaScript compartit al final de la pàgina (pot ser `defer`).
2. Per a cada galeria, utilitzar un contenidor `class="vcc-booking-gallery"` i a dins un mosaic `class="day-mosaic count-8"` amb `data-title` i opcionalment `data-description`. Cada fotografia és un `<button type="button" data-photo="URL_ORIGINAL">` amb un `<img src="URL_MINI" alt="...">`. La foto 5 pot incorporar `<span class="more" aria-hidden="true">+3 fotos</span>`.
3. Afegir un sol modal buit a la pàgina:

```html
<div class="day-lightbox vcc-booking-gallery-modal"
     data-vcc-booking-gallery
     data-vcc-gallery-selector=".vcc-booking-gallery .day-mosaic"
     hidden role="dialog" aria-modal="true"
     aria-label="Galería de fotografías"></div>
```

El component s'inicialitza automàticament. Si la guia té un DOM especial, també es pot cridar `window.VCCBookingGallery.mount(modal, {gallerySelector, overviewSelector})`; les instàncies es protegeixen contra inicialitzacions duplicades.

## Component universal de galeria (novembre 2026)

Les dues pàgines, **«Qué ver · Imprescindibles»** i **«Estocolmo en 3 días»**, carreguen exactament els mateixos recursos principals:

- `/configuracion/css/componentes/vcc-gallery-booking.css`: **únic CSS de galeria**, incloent estructura, títols, fletxes, botó «← Galería», miniatures, laterals, responsive i colors
- `/configuracion/js/componentes/vcc-gallery-booking.js`: **únic controlador universal**, incloent el text del retorn, mosaic, ampliació, comptador, zoom i gestos

No cal carregar els antics fitxers `vcc-gallery-ui.css` ni `vcc-gallery-ui.js` a les dues guies: el seu contingut ha quedat integrat al component universal. No tornar a duplicar regles a les plantilles d'Itinerario o Imprescindibles.

El codi editorial i els fragments que no són galeries continuen essent específics de cada pàgina.

## Comportaments conservats

- Cinc miniatures visibles i comptador discret; en clicar, mosaic complet (3 columnes en escriptori, mosaic vertical en mòbil).
- Fotografia individual amb lateral editorial a escriptori, miniatures i comptador `1 / 8`, `2 / 8`…
- **Cursor de mà (dit índex)** sobre la fotografia individual d'escriptori, com a «Qué ver».
- Zoom **natiu** de Mac/Windows, moviment bidireccional dins del visor i recentrat en sortir; no es bloqueja Ctrl+rodeta ni el gest del trackpad.
- Zoom tàctil i lliscament al mòbil; previsualitzacions R2 i fallback a l'original.
- La galeria no modifica l'hero, el subheader ni els textos SEO de cada pàgina.

## Límits

El CSS de mosaic actual està optimitzat per a **8 fotografies** amb 5 visibles; per a altres quantitats convé ampliar explícitament les classes `count-N`. El visor de **«Qué ver · Imprescindibles»** encara conserva el seu codi original per no introduir regressions; quan es vulgui migrar, cal validar per separat les seves galeries de 1 a 15 monuments i els gestos específics.
