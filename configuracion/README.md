# Configuracio de recursos VCC

La branca de desenvolupament es quality. Produccio main no es modifica sense aprovacio.

## GitHub: recursos globals

- configuracion/imagenes/marca/: SVG i logos oficials.
- configuracion/imagenes/fondos/: fons actuals; old/ per compatibilitat.
- configuracion/imagenes/iconos/: SVG i iconografia reutilitzable, inclos como-moverse/.
- configuracion/imagenes/ilustraciones/: transportes/ i como-moverse/zonas/.
- configuracion/imagenes/banderas/flags/: banderes PNG locals.
- configuracion/imagenes/continentes/: mapes SVG, JPG i WebP.
- configuracion/imagenes/externas/: fotografies externes autoritzades, amb llicencia.
- configuracion/css/, js/, plantillas/, scripts/, datos/, workers/: codi comu i control.

Les fotos d'una destinacio es conserven preferentment a R2. Excepcions actuals a GitHub: 30 previsualitzacions optimitzades de Göteborg i un SVG especific d'Estocolm en destinos/.../imagenes/.

## Cloudflare R2: estructura

vcc-images/destinos/<pais>/<lloc>/<any-diaN>/<categoria>/<foto>
vcc-images/__vcc_ai_reviews__/destinos/.../foto.avif.json
vcc-images/__vcc_ai_reviews__/_archive/: registres orfes recuperables.

Per renombrar una carpeta R2: inventariar, copiar objectes, verificar mida/ETag, moure caches IA (actualitzar key), corregir HTML/CSS/JS i provar quality. Eliminar l'original nomes despres.

## Formats

No confiar en l'extensio. AVIF valid conte ISO BMFF amb marca ftyp i avif/avis; WebP conte RIFF/WEBP. Algunes fotos anteriors al 08-11-2026 tenen extensio .avif i bytes WebP. Preservar fins a migracio verificada.

El Worker de conversio ara comprova bytes reals abans d'esborrar JPG. No convertir massivament ni esborrar JPG/HEIC originals sense verificacio.

## Inventaris

- datos/inventario-r2.json: recompte de R2 i noms llegats pendents.
- datos/recursos-externs-pendents.json: excepcions de fotografies de tercers encara no migrades.
- datos/imagenes-externas-migrades.json: fotografies i banderes descarregades.
- rutas-recursos.json i /_redirects: compatibilitat de rutes.

Els recursos corporatius no poden estar solts a configuracion/imagenes/: s'han de posar dins una categoria. Les imatges de desti es mantenen a destinos/.../imagenes/ o R2.

## Sistema de disseny global (quality, novembre 2026)

**Font de veritat:** `configuracion/css/base/tokens-vcc.css`, carregat una sola vegada
pel `configuracion/js/site-header.js`. No afegiu valors nous de font o accent
directament als HTML. El sistema respecta, per defecte, l'estil visual existent.

| Canvi global | Variable a modificar |
| --- | --- |
| Tipus de lletra de text | `--vcc-font-body` |
| Tipus de lletra de títols | `--vcc-font-heading` |
| Tipus de lletra manuscrita | `--vcc-font-script` |
| Ajustar títols de les plantilles migrades | `--vcc-heading-size-adjust: 1px` |
| Ajustar sobretítols de les plantilles migrades | `--vcc-overline-size-adjust: 1px` |
| Color d'accent en components migrats | `--vcc-accent-override: #color` (opcional) |
| Alçada del subheader | `--vcc-component-subheader-height` |
| Lletra del subheader | `--vcc-component-subheader-desktop-font` / `--vcc-component-subheader-mobile-font` |
| Alçada editorial del hero | `--vcc-component-hero-desktop-height` |
| Mida i posició de fletxes mòbils | `--vcc-carousel-arrow-size`, `--vcc-carousel-arrow-previous-offset` |
| Espai superior controls mòbils | `--vcc-carousel-mobile-padding-top` |

Els ajustaments de títols actuen sobre les plantilles que ja s'han adaptat
(no sobre qualsevol regla històrica no migrada). Els valors inicials de
`0px` preserven exactament les mides aprovades.

### Components reutilitzables

- `configuracion/css/componentes/header-vcc-global.css`: capçalera compartida.
- `configuracion/css/componentes/header-fallback-vcc.css`: estil de reserva del header.
- `configuracion/css/componentes/subheader-unificado-vcc.css`: navegació secundària.
- `configuracion/css/componentes/vcc-hero-editorial-vcc.css`: hero editorial compartit.
- `configuracion/css/componentes/carruseles-vcc.css`: variants `editorial`,
  `compacto`, `detalle` via `data-vcc-carousel`.
- `configuracion/css/componentes/carruseles-flechas-movil-vcc.css`:
  criteri comú mòbil, una targeta amb dues fletxes a dalt a la dreta.
- `configuracion/css/componentes/vcc-gallery-booking.css` i
  `configuracion/js/componentes/vcc-gallery-booking.js`: visor de fotografies.
- `configuracion/css/componentes/consejo-vcc-global.css`: Consejo VCC.

Les variants de carrusel utilitzen estils compartits, però alguns controladors
JavaScript específics de pàgina continuen vigents: no els suprimiu fins
que la seva equivalència funcional i visual estigui verificada.

### Icones i fotografies

No es pot dibuixar un SVG estàtic dins d'una pàgina. Les figures són a
`configuracion/imagenes/iconos/`, dins de `paginas/`, `compartidos/` o
les carpetes específiques. A l'HTML es pot mantenir un SVG buit amb
`<use href="/configuracion/imagenes/iconos/...svg#nom-icono"></use>`
per preservar les dimensions i el color CSS. El traçat està només al fitxer
SVG extern. Les medalles complexes poden utilitzar `<img src="/configuracion/imagenes/iconos/...svg">`.

La validació de CI `node configuracion/scripts/validar-iconos-vcc.mjs`
revisa la geometria incrustada en HTML i JS, les dades SVG dins de CSS
i l'existència dels sprites referenciats. No emmagatzemar icones
SVG com a `data:image/svg+xml`. Les fotos de viatge continuen a R2,
sense migració addicional en aquesta fase.

### Revisió abans de publicar

1. Treballar només a `quality` i conservar `main` sense canvis fins a l'aprovació.
2. Comprovar GitHub Actions: **Quality**, **Components VCC compartits** i
   **Auditar recursos visuals VCC**.
3. Verificar canvis visibles amb les versions mòbil i escriptori de les guies
   principals abans de fusionar a producció.

## SEO i components compartits (2026-11-11)

- `configuracion/scripts/lib/seo-site.mjs`: única llista de pàgines preparades per indexació amb la ruta HTML i la canonical pública. Ampliar aquesta llista quan una guia estigui acabada.
- `configuracion/scripts/verificar-seo-global.mjs`: comprovació global de H1, títol, descripció, canonical, sitemap i exclusions `noindex`. Integrada a l'Action `Quality`.
- `sitemap.xml`: ha de contenir només URL públiques reals; mai enllaços cap a `quality` ni pàgines marcades `noindex`.
- `configuracion/css/componentes/presupuesto-gastos-dia-vcc.css`: component de dues columnes per a les despeses diàries. Es carrega DESPRÉS de `presupuesto-perfiles-desplegables.css`. No duplicar aquestes regles al CSS específic d'Estocolm.
- Les mini galeries dels índexs (carrusels de targetes) no són el visor modal de `vcc-gallery-booking`. Els filtres tipus pestanya duen `data-vcc-filter-nav`, i no s'han de convertir en subheaders d'àncores.
- La portada anglesa i el catàleg Apps tenen `noindex,follow` fins que estiguin complets.
- Abans de passar a `main`: completar les dades reals del titular de la política de privacitat; revisar formats de fitxers R2 i la capçalera `X-Robots-Tag` efectiva del domini `quality`.

Les fotografies aportades per VCC es conserven. Una URL externa o una extensió AVIF incorrecta es revisa com a incidència de ruta o format, sense presumir per això que les fotografies no siguin pròpies.
