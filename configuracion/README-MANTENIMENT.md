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
