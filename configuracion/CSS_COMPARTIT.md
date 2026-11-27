# CSS compartit de Viajando con Cabeza
**Estat: branca `quality`, 12-11-2026. No afecta `main`.**

## Fonts de veritat (editar aquí)

| Element | CSS que carrega el web |
| --- | --- |
| Portada «Inicio» | `configuracion/css/inicio-vcc.css` (consolida en ordre els nou retocs antics `inicio-*.css`) |
| Bases i amplades de barres de valoració | `configuracion/css/paginas.css` — classes `.vcc-bar-w0` fins a `.vcc-bar-w100` |
| Capçalera/menú fallback compartit | `configuracion/css/componentes/header-fallback-vcc.css`; també a `planifica/index.html` |
| Galeria compartida | `configuracion/css/componentes/vcc-gallery-booking.css` i `configuracion/js/componentes/vcc-gallery-booking.js` |
| Plantilla «Entradas y pases» | `configuracion/css/plantillas/entradas-pases-vcc.css` (integra els antics «ahorrar» i «editorial» en l’ordre original) |
| Estils pressupost Estocolm | `configuracion/css/destinos/suecia/estocolmo/presupuesto-head-core-v1.css` (inclou l'antiga «armonia») |
| Estat confirmació formulari | `configuracion/css/contacto.css` |
| Acció «Abrir mapa completo» | `configuracion/css/plantillas/itinerario-core-vcc.css` |
| Navegació activa de «Qué ver» | `configuracion/css/destinos/suecia/estocolmo/estocolmo-content.css` |

## Normes per a noves guies

1. Reutilitzar elements i CSS de `configuracion` abans de crear un fitxer amb nom de nova versió. No afegir `<style>` a cada HTML.
2. El disseny fix ha de viure al CSS; les dades editorials, com una fotografia concreta o un valor `--score`, poden mantenir variables CSS personalitzades en el contingut quan sigui necessari.
3. Per a valoracions de 0–100%, usar `class="vcc-bar-wNN"` en lloc de `style="width:NN%"`.
4. Les regles de plantilla han de quedar en `css/plantillas/`, les compartides a `css/componentes/` o als estils base i les excepcions molt puntuals a `css/destinos/`.
5. No alterar l'ordre dels fulls, els breakpoints ni els selectors globals sense contrastar les vistes de mòbil i escriptori.
6. Quan es modifica un CSS, canviar el paràmetre de versió `?v=` de la pàgina que el carrega per evitar resultats antics a la CDN.
7. Abans de publicar, executar `npm run css:check` i `npm test` i validar la portada, Estocolm, itinerari i calculadores en dispositius reals.

Els fitxers antics fusionats s'han **mantingut temporalment per compatibilitat i reversió**, però les pàgines actualitzades ja no els carreguen. **No editar-los com si fossin fonts actives**: fer els nous canvis als CSS canònics de la taula. No eliminar fitxers antics sense verificar totes les referències del repositori, incloent els esborranys.

Els comprovadors són `configuracion/scripts/verificar-css-vcc.mjs` i `configuracion/scripts/verificar-estilos-html-vcc.mjs`. Els tests limiten la regressió de dependències i estils inline.
