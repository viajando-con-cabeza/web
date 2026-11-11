# Galeria fotogràfica VCC — component únic

**Font de veritat:** `configuracion/css/componentes/vcc-gallery-booking.css` i
`configuracion/js/componentes/vcc-gallery-booking.js`.

Totes les galeries fotogràfiques de les guies publicades han de reutilitzar aquests
dos fitxers. No crear un nou lightbox, ni un altre mosaic ampliat, ni botons de
retorn amb estils independents. Els arxius antics
`imprescindibles-galeria-movil.js` i `imprescindibles-galeria-escritorio.js`
no s'han de carregar a cap guia activa.

## Què pot variar per pàgina?

Únicament les fotografies (R2), els títols, subtítols, descripcions i els
enllaços editorials. Els estils del **visor** (capçalera de 58 px, fletxes,
botons, mosaic ampliat, fotografia individual, miniatures, zoom, swipe i
adaptació mòbil) es gestionen al component comú.

## Integració d'una nova guia

Afegir una única referència a cada recurs:

```html
<link rel="stylesheet" href="/configuracion/css/componentes/vcc-gallery-booking.css">

<div class="day-lightbox vcc-booking-gallery-modal"
     data-vcc-booking-gallery
     data-vcc-gallery-selector=".vcc-booking-gallery .day-mosaic"
     hidden role="dialog" aria-modal="true"
     aria-label="Galería de fotografías"></div>

<script src="/configuracion/js/componentes/vcc-gallery-booking.js" defer></script>
```

La plantilla de l'itinerari utilitza `button[data-photo]`, amb la foto original
a `data-photo`, i una miniatura a `img.src`. Les fitxes de llocs de
`Qué ver` i la secció `Cuándo ir` utilitzen `.gallery[data-images]`, un
array JSON amb les URL originals, i el mosaic editorial generat per
`imprescindibles-interactions.js`. Cap pàgina no ha d'escriure el seu
propi controlador del visor.

El modal ha d'estar present una sola vegada per pàgina, i
`data-vcc-gallery-selector` ha d'apuntar als mosaics reals.

## Control de qualitat

La comprovació de les URL publicades del sitemap és:

```sh
node configuracion/scripts/validar-galeries.mjs
```

La branca `quality` executa aquest control amb GitHub Actions. Si una guia
publicada incorpora un visor antic o no carrega els fitxers comuns, la
comprovació falla. Les pàgines sense galeries no han de carregar el visor.

## Llegenda opcional de cada fotografia

El visor comú mostra una **mini descripció sota la fotografia individual**, però
només si aquella fotografia té el text configurat. Als mosaics no apareix mai
i les fotos sense llegenda no deixen cap buit.

- Itineraris amb botons: `<button data-photo="URL" data-caption="Vista del port al capvespre">…</button>`.
- Guies amb `data-images`: afegir `data-captions='["Vista del port", "", "Un carrer del centre"]'` al mateix mosaic (array paral·lel; text buit si no n'hi ha).

El visor mostra la llegenda amb `textContent` sense HTML, i limita el text a
200 caràcters. Quan s'entra a la foto individual, el focus programàtic recau sobre el contenidor
amb `tabindex="-1"` i no sobre el botó «Galería». El botó rep el seu
contorn de focus només quan el lector hi navega amb Tab.

## Rendiment i focus — galeria de moltes fotos

El botó «Galería» del visor individual no mostra cap requadre de focus
(per petició editorial); la resta de botons mantenen `:focus-visible`.

Les galeries amb originals R2 de diversos MB poden declarar `data-fast-preview`
al mosaic `.day-mosaic`: aleshores la fotografia apareix immediatament amb
la miniatura disponible i l'original es carrega de manera diferida, només
si el lector continua en aquella fotografia. Si existeix un visor optimitzat
per una foto, el botó pot declarar `data-visor="URL"`; es mostrarà en
lloc de la miniatura mentre es carrega l'original.

El component compartit només precarrega dues miniatures adjacents en mòbil
i cancel·la les càrregues grans pendents quan es canvia de fotografia.
No precarregueu els originals ni genereu un visor per cada foto al canvi
de diapositiva. El compte de fotografies i el visor amb swipe no canvien.
