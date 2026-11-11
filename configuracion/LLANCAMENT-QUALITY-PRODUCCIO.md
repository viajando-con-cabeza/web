# VCC · Preparació del llançament (quality → main)

## Un sol registre per a SEO
L'única llista de pàgines candidates a indexació és `configuracion/datos/publicacion-vcc.json`.
Els HTML no inclosos a `approved` es marquen automàticament `noindex,follow` i NO apareixen al sitemap.
Això inclou destinacions futures, guies breus, versions angleses i pàgines de demostració.

**Publicar una nova destinació:** acabar-ne el contingut, verificar horaris/preus/imatges, afegir l'HTML a `approved`, i executar `npm run seo:sync` (o deixar que Quality ho sincronitzi). El generador crea les URL canòniques sense `.html`, Open Graph, Twitter Cards i el sitemap.

## CSS i components
Les variables de marca són a `configuracion/css/base/tokens-vcc.css`.
Les normes de navegació i carrusels són a `configuracion/css/componentes/`.
No repetiu CSS de subheaders, fletxes o Consejo VCC a una pàgina; les especificitats històriques s'han de retirar progressivament, no amb noves capes de `!important`.
Qualsevol refactor visual s'ha de comprovar a 390 px i escriptori, i amb les proves de GitHub.
La carpeta `node_modules` no es publica ni es versiona; el `package.json` declara eines opcionals.

## Abans de fer merge a main
1. Revisar manualment **totes les pàgines a approved**; `approved` indica candidat tècnic, no una certificació editorial.
2. Completar les dades legals del titular a la política de privacitat. El workflow Production BLOQUEJA el release fins llavors.
3. Comprovar l'enviament del formulari a `info@viajandoconcabeza.com`, inclosa l'activació de FormSubmit i la recepció real.
4. Verificar les fotografies reals i el MIME dels fitxers R2 (especialment `.avif` amb bytes WebP) i resoldre enllaços externs pendents de les pàgines aprovades.
5. Executar `npm test`, `npm run seo:check` i verificar **Quality**, **Components VCC compartits**, **VCC itinerario · integridad** i **Auditar recursos visuals VCC**.
6. Validar la navegació en mòbil i escriptori; Lighthouse/PageSpeed per a LCP, INP i CLS, accessibilitat i contrast.
7. Quan el contingut estigui aprovat, fer PR de `quality` cap a `main`. NO desplegar el Worker de proves `web-quality` com a productiu.
8. Verificar que el domini de proves té `X-Robots-Tag: noindex` real i que el domini final NO el té. Després, afegir la propietat a Google Search Console i enviar `/sitemap.xml`.

Les pàgines noves es poden editar sense perdre l'estat d'esborrany. No promocionar-les com a guies publicades fins al control editorial.

## Ordres per escalar a noves destinacions

- `npm run destino:crear -- pais ciutat`: crea un esborrany amb `contenido.json` i carpeta de fotos, sense fer-lo públic.
- `npm run destino:generar -- pais ciutat`: genera guies des de les plantilles compartides, amb hero CSS extern i `noindex` fins a aprovació editorial.
- `npm run site:sync`: actualitza els tres catàlegs Planifica, les targetes de Dónde ir, sitemap i metadades SEO des del mateix registre.
- `npm run site:check`: comprova que els fitxers generats estan al dia, sense modificar el codi.
- `npm run audit:site`: inspecciona tots els HTML, CSS i JS, duplicacions d'assets i enllaços a esborranys.

**Publicació:** només cal aprovar les noves rutes a `configuracion/datos/publicacion-vcc.json` i configurar la imatge social corresponent. Els catàlegs i les rutes s'actualitzaran amb `site:sync`. No modificar els fitxers de `main` des de l'entorn de proves.

## Separació real de Workers (punt de seguretat)

- `quality/wrangler.jsonc` ha de conservar el Worker `web-quality` mentre es prova la branca de desenvolupament.
- A la branca `main`, el fitxer arrel `wrangler.jsonc` ha d'apuntar a `web-main` i incloure `html_handling: auto-trailing-slash`.
- `wrangler.production.jsonc` és la referència explícita per al deploy final. Una fusió completa de `quality` podria sobreescriure la configuració arrel de `main`; cal preservar-la o regenerar-la amb els valors de producció abans del desplegament.
- `npm run deploy:check-quality` comprova l'entorn de proves. A `main`, executar `npm run deploy:check-production` abans de desplegar. El workflow Production el bloqueja si detecta `web-quality` o un mode d'URL incorrecte.
- No fusionar o desplegar automàticament sense haver comprovat el domini real i les capçaleres `noindex`.
