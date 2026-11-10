# VCC — Itinerari de 3 dies d'Estocolm (branca `quality`)

## Arquitectura i responsabilitat dels fitxers

| Fitxer | Ús |
| --- | --- |
| `destinos/suecia/estocolmo/itinerario.html` | Contingut editorial, mapes, horaris, SEO, fotos R2 i els tres dies |
| `configuracion/css/plantillas/itinerario-core-vcc.css` | Estructura original de l'itinerari, contingut i alineació |
| `configuracion/css/plantillas/itinerario-polish-vcc.css` | Ajustos visuals de l'itinerari, sense galeries ni el fons antic |
| `configuracion/css/componentes/vcc-hero-editorial-vcc.css` | Hero reutilitzable: degradat, tipografia, dimensions i punts de tall |
| `configuracion/css/componentes/vcc-gallery-booking.css` | Mosaics i modal compartits; no duplicar-los a la pàgina |
| `configuracion/css/componentes/vcc-gallery-ui.css` | Estils compartits entre «Qué ver» i «Itinerario» |
| `configuracion/js/componentes/vcc-gallery-booking.js` | Visor reutilitzable amb 8 fotos, zoom, controls i gestos |
| `configuracion/js/componentes/vcc-gallery-ui.js` | Text únic «← Galería» |
| `configuracion/js/destinos/suecia/estocolmo/vcc-section-scrollspy.js` | Subheader, tab activa i fixació mòbil opcional |

## Canvi de la fotografia del hero

La foto de la portada és una única variable al mateix contenidor HTML:

```html
<section class="vcc-hero" style="--vcc-hero-image:url('URL_DE_LA_FOTO')">
```

El CSS compartit no ha de contenir cap imatge d'Estocolm. En substituir-la, cal actualitzar també la URL del `rel="preload" as="image"` de l'HTML, i si es vol que les previsualitzacions a xarxes siguin coherents, `og:image` i el camp `image` de `BlogPosting`.

**No tornar a carregar** `fondos-itinerario.webp`: el fons anterior generava una descàrrega sobrant d'uns 565 KB.

## Fotografies dels dies

Cada `.day-mosaic.count-8` conté vuit `button[data-photo]` (URL original a R2), amb `img[src]` per a la miniatura (Worker de previsualitzacions). Hi ha 3 mosaics i 24 places en total. El component crea el modal i carrega l'original quan el lector obre una fotografia individual.

Si la nova fotografia té una proporció diferent, comprovar el retall en el mosaic i el visor abans d'afegir atributs `width`/`height` arbitraris.

## Navegació i rendiment

El subheader activa la fixació amb `data-vcc-sticky-mobile`. La seva lògica ja és al scrollspy compartit: **no afegir un altre controlador inline**. Les tres targetes de resum són estàtiques; l'antic JS de carrusel (només per a més de tres targetes) s'ha eliminat.

`vcc-gallery-booking.js` registra els gestos globals del zoom **només quan la galeria s'obre**, i els retira en tancar-la. Evitar listeners globals duplicats.

Les imatges dels mosaics són miniatures `loading="lazy" decoding="async"`. El My Maps també porta `loading="lazy"`. La portada és la única imatge explícitament precoç amb `fetchpriority="high"`.

## Checklist abans de publicar

- Comparar hero, subheader, resum, targetes, tres dies, Consejo VCC i footer en 390px i 1280px.
- Obrir el mosaic de cada dia, passar a foto individual i comprovar `1 / 8`, fletxes, «← Galería», tancament i retorn al mosaic.
- Comprovar pan amb zoom de navegador Mac/Windows i els gestos tàctils.
- Verificar que **no** es descarrega `fondos-itinerario.webp`.
- Revisar la canonical, el sitemap, les dades estructurades i la regla `noindex` de `quality`.
- Mesurar LCP/INP/CLS en dispositiu real o Lighthouse abans d'afirmar valors.

La fulla `itinerario-core-vcc.css` i la de retocs contenen overrides històrics intencionats. Evitar eliminar `!important` sense comparació de geometria i CSS computat; hi ha regles compartides amb altres plantilles.
