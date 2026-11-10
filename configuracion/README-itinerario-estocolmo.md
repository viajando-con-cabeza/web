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

## Última passada de manteniment i estabilitat

- Les **27 miniatures de R2** tenen les dimensions exactes del fitxer servit pel Worker (`width` i `height`), mesurades al navegador. Les 31 imatges estàtiques de l'HTML declaren dimensions; això ajuda a reservar l'espai i a reduir possibles salts en càrrega.
- Les fotografies miniatura es mantenen amb `loading="lazy"` i `decoding="async"`; les mides provenen de la versió **mini**, no necessàriament de la fotografia original. En canviar una fotografia, tornar a mesurar les dimensions reals del derivat.
- El visor compartit reutilitza els **mateixos elements de miniatura** en passar entre fotografies. Només reconstrueix la llista en canviar de galeria; en tancar-la, n'allibera els nodes.
- Prova local sense dependències: `node configuracion/tests/itinerario-integridad.cjs`. Verifica els 3 dies, 16 parades, 24 fotografies, 3 Consejo VCC, canonical, sitemap, JSON-LD, mapes, dimensions de les imatges i enllaços als components.
- Workflow de la branca `quality`: `.github/workflows/vcc-itinerario-quality.yml`. Executa les mateixes proves automàticament quan canvien els fitxers relacionats.

Aquestes comprovacions **no substitueixen** la comparació en navegador ni Lighthouse: el CSS manté regles històriques necessàries perquè no variïn hero, subheader, mosaics i responsive.

## Tancament tècnic · rendiment i manteniment (10/11/2026)

- Tots tres blocs CSS que abans vivien dins de l'HTML (sticky, alineació i fallback de capçalera) estan ara **dins** `configuracion/css/plantillas/itinerario-core-vcc.css`, sense cap petició addicional. Si cal revisar l'estil de capçalera o subheader, modificar-lo allà (en lloc de tornar a crear `<style>` a la pàgina).
- El bloc final conserva la mateixa composició de fons i el mateix retall. El CSS compartit ara apunta a la versió optimitzada `photo-1464822759023-fed622ff2c3b-vcc-optimizado.webp` (uns **474 KB transferits** en la prova, abans 865 KB); la descàrrega es difereix fins que el bloc `data-vcc-lazy-background` s'apropa al viewport, mitjançant `configuracion/js/componentes/vcc-lazy-background.js`. La classe `vcc-bg-ready` restaura íntegrament la declaració del CSS compartit.
- El test d'integritat comprova ara també que no tornin a aparèixer CSS inline i que no es perdi la càrrega diferida.
- Mesura inicial de navegador a 390×844 sense CPU/xarxa limitades: **FCP 468 ms; LCP 884 ms; CLS 0; TTFB 142 ms** (una mostra de laboratori, no dades de visitants). La quantitat de feina en tasques llargues mesurada és **281 ms** per sobre dels llindars de 50 ms (aproximació, no TBT Lighthouse). Després del desplegament, una segona execució de navegador a 390×844 va registrar **FCP 1.052 ms; LCP 1.672 ms; CLS 0; TTFB 347 ms** i uns 442 ms de tasques llargues per sobre dels 50 ms (aproximació). La variabilitat és pròpia d'aquestes dues mostres no estrangulades; cal Lighthouse/CrUX abans de definir cap puntuació general.
- L'aplicació no ofereix ara `/cdn-cgi/image/` per optimitzar al vol el fons (404 en la comprovació), per això s'ha prioritzat ajornar la descàrrega, no substituir la fotografia.
- Els overrides històrics s'han conservat intencionadament quan canviar-los comportava risc. **Un nombre alt de `!important` no demostra per si mateix una puntuació baixa de Core Web Vitals**; qualsevol eliminació futura necessita comparació visual abans i després.

## Checklist abans de publicar

- Comparar hero, subheader, resum, targetes, tres dies, Consejo VCC i footer en 390px i 1280px.
- Obrir el mosaic de cada dia, passar a foto individual i comprovar `1 / 8`, fletxes, «← Galería», tancament i retorn al mosaic.
- Comprovar pan amb zoom de navegador Mac/Windows i els gestos tàctils.
- Verificar que **no** es descarrega `fondos-itinerario.webp`.
- Revisar la canonical, el sitemap, les dades estructurades i la regla `noindex` de `quality`.
- Mesurar LCP/INP/CLS en dispositiu real o Lighthouse abans d'afirmar valors.

La fulla `itinerario-core-vcc.css` i la de retocs contenen overrides històrics intencionats. Evitar eliminar `!important` sense comparació de geometria i CSS computat; hi ha regles compartides amb altres plantilles.
