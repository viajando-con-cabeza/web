# VCC · Web bilingüe ES / EN

## Font única i manteniment

- ES és l'única font editable de HTML, CSS, fotografies, JS i estructura.
- Les pàgines es declaren a configuracion/datos/publicacion-vcc.json (approved).
- EN es genera a en/<same-path>; no s'edita mai a mà.
- Recursos compartits: configuracion/css, configuracion/js, configuracion/imagenes.
- Memòria de traduccions: configuracion/datos/i18n/en-segments.json.
- UI dinàmica traduïda amb configuracion/js/vcc-en-runtime.js, només amb frases disponibles al diccionari local.
- URL equivalents ES /destinos/... i EN /en/destinos/..., mantenint els slugs originals.

## Actualització automàtica a Quality

1. Cada push a quality valida i actualitza primer la versió castellana.
2. El job translate_en demana al Cloudflare AI Worker només els segments nous, amb OIDC de GitHub.
3. El generador sincronitza a EN la disposició, els recursos, les fotografies, els continguts i els textos que ja estan traduïts.
4. Un test comprova que les 25 pàgines aprovades tenen els mateixos fitxers CSS, JS i les mateixes imatges i seccions.
5. Les traduccions s'emmagatzemen i reutilitzen. Els canvis del diccionari invaliden la caché per hash.
6. Quan s'aprova una pàgina castellana nova en el registre, es crea automàticament l'equivalent en anglès.

## Estat editorial / limitacions

- Aquesta primera activació és PROVISIONAL: els fragments sense traduir encara surten en castellà. Per això EN és noindex,follow.
- Alguns textos generats només dins del JavaScript poden no estar al diccionari; s'hauran de cobrir abans de publicar EN com a complet.
- Si s'esgota la quota diària o falla GitHub/Cloudflare, la traducció nova pot trigar més que uns minuts.
- Els resultats de la IA requereixen validació de topònims, contingut, avisos, formularis i SEO abans d'habilitar-los a main.
- Les quotes de segments a configuracion/datos/idiomas-vcc.json limiten les peticions, però no garanteixen un import màxim de facturació.
- No s'afegeixen encara versions EN al sitemap ni s'activa hreflang públic per evitar indexar contingut bilingüe incomplet.

## Ordres de verificació

    node configuracion/scripts/traduccions/generar-en.mjs --write
    node configuracion/scripts/traduccions/generar-en.mjs --check
    node configuracion/scripts/traduccions/verificar-en.mjs

La traducció de segments requereix el Worker URL i el GitHub OIDC i s'executa a les Actions. NO modificar manualment els HTML generats a en/: seran sobreescrits al següent cicle.
