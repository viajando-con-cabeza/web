# VCC · Guia de manteniment (branca quality)

## On s'han de modificar els estils?

1. **Disseny general:** `configuracion/css/base/tokens-vcc.css`.
2. **Capçalera, navegació i breadcrumbs:** fonts canonòniques de `configuracion/css/componentes/`.
3. **Portades, números i fletxes mòbils:** també a `componentes/`; no copiar regles dins de cada HTML.
4. **Una secció editorial:** `configuracion/css/plantillas/` (una plantilla per a moltes destinacions).
5. **Casos únics d'una destinació:** `configuracion/css/destinos/<pais>/<ciutat>/`, només quan són realment específics.

Els fitxers `vcc-core-compartit.css`, `vcc-ui-compartida.css` i `imprescindibles-compilado-vcc.css` són **generats**: no s'editen manualment.

## Comprovacions que cal passar

```sh
npm run css:build
node configuracion/scripts/generar-ui-compartida.mjs
npm run css:verify
node configuracion/scripts/generar-ui-compartida.mjs --check
npm run css:check
npm run audit:architecture
npm run audit:styles
npm run site:check
```

**Abans de main:** revisar visualment a quality (mòbil/escriptori), validar enllaços, sitemap, accesibilitat i rendiment real (LCP, CLS, INP). Les comprovacions de Node no substitueixen la revisió visual ni Lighthouse.

## Regles per no multiplicar el codi

- No afegir `<style>` a un HTML publicat ni `style="..."` per a formats fixos.
- No afegir un nou CSS `-fix-v2`, `-v11` o `-final`: editar la font canònica.
- Evitar `!important` quan una classe del component i una variable CSS resolen el cas.
- Reutilitzar header, footer, subheaders, galeries i carrusels en lloc de copiar-los.
- Identificar cada pàgina aprovada a `configuracion/datos/publicacion-vcc.json`; els esborranys no s'indexen.
- No esborrar fitxers que l'auditoria consideri "possiblement no utilitzats" sense comprovar carregadors JS, recursos R2 i plantilles antigues.
- Els CSS compartits es carreguen en paquets; canviar una font exigeix regenerar les sortides i validar-les abans de publicar.

## Miniatures de targetes i cost de les fotos

Les imatges WebP de més de 250 KB utilitzades per pàgines aprovades es converteixen automàticament a amplades de 480, 960 i 1600 px. No s'alteren originals, colors, retalls ni imatges R2. Per regenerar: `npm run cards:build` (requereix Pillow); per comprovar: `npm run cards:check`. La font d'una targeta continua registrada a `data-vcc-card-source` i cada variant té un fingerprint per evitar fotografies obsoletes.

## Revisió integral del blog

Des de l'arrel del projecte: `npm run review:full`. Comprova rutes, SEO, idempotència de generadors, CSS, galeries, itineraris, SVG i estructura dels recursos. `Quality` bloqueja fotos locals de més de 400 KB sense `srcset` i imatges sense `alt` a les pàgines aprovades. També reporta imatges sense dimensions. Aquestes proves són estàtiques: cal completar-les amb Lighthouse i comparació visual mòbil/escriptori abans de publicar a `main`.

## Portades responsives: mateixa foto, menys pes

La font de veritat és `configuracion/datos/portadas-vcc.json`: registra les **19 portades** aprovades, la fotografia original, el selector CSS i si és un element `<img>` o una capa de fons. No duplicar rutes en CSS de pàgina ni inventar una fotografia específica per al mòbil.

- **Original únic:** `configuracion/imagenes/fondos/fondos-*.webp` o, quan el registre marca `externas`, la fotografia existent d'Unsplash. Sense alteracions de saturació, contrast, brillantor o retall: les variants només redueixen amplada i compressió.
- **Mòbil / ordinador:** versions `960` i `1920` (o `1600` per a la portada vertical externa), referenciades a `portadas-rapidas-vcc.css` i `srcset` dels herois natius. Cadascuna té fingerprint per evitar caches antigues. Les dues deriven del mateix fitxer.
- **LCP:** els dos preloads alternatius, condicionats per `media`, tenen `fetchpriority="high"` i es col·loquen després de `meta charset`, abans dels fulls CSS. No afegir altres preloads per a la mateixa portada.
- **Components compartits:** `portadas-lcp-nativo-vcc.css` es compila dins de `vcc-core-compartit.css`; no carregar-lo novament a cada guia. El degradat blanc i les posicions continuen a `portadas-transparencia.css`.
- **Per regenerar:** `npm run site:sync` o `npm run hero:build` (amb imatges ja generades); **per validar:** `npm run hero:check`. El test `verificar-portadas-unificadas.mjs` comprova imatges, variants, preloads, pes i rutes. En canvi de font externa, primer `npm run cards:build`.
- **Rendiment real:** el pressupost mòbil de fotografia és com a màxim 275 KB per pàgina registrada. Això **no garanteix una puntuació PageSpeed fixa**: cal mesurar LCP, CSS bloquejant, fonts, recursos JS i CLS en la URL publicada a quality després de cada canvi.

No reintroduir versions `fondos-*-mobile.webp` separades ni workflows específics per pàgina. Qualsevol nova guia ha d'entrar al registre compartit, no crear una variant pròpia del generador.
