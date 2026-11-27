# VCC · Web bilingüe ES → EN (Quality)

## Una única font de veritat

El castellà és la font editable. Les versions sota `en/` es generen automàticament des dels HTML originals. Comparteixen CSS, fotografies, scripts, estructura i components. **Mai no s'edita manualment `en/`**.

`configuracion/datos/publicacion-vcc.json` defineix les pàgines aprovades (actualment 25); el generador replica també els esborranys en anglès, conservant `noindex`. Els canvis d'estructura i imatges es reflecteixen per regeneració. L'anglès manté els mateixos slugs precedits de `/en/`.

## Pipeline de traducció

1. El workflow `.github/workflows/quality.yml` s'executa a cada push de la branca `quality` i admet `workflow_dispatch`.
2. `actualitzar-en-v2.mjs` inventaria textos HTML, atributs accessibles, scripts JS amb textos visibles i dades JSON dels pressupostos i països, sempre prioritzant les 25 pàgines aprovades.
3. Només els textos no traduïts es transmeten en **lots** al Worker `vcc-en-translator-quality`, amb token GitHub OIDC verificat. El model contextual és `@cf/google/gemma-4-26b-a4b-it`. No es fa cap crida d'IA per visita al blog.
4. Es guarden a `configuracion/datos/i18n/en-segments-v2.json` i es validen marca, topònims, quantitats i monedes. La memòria anterior `en-segments.json` és només una alternativa temporal.
5. `generar-en.mjs` genera HTML en anglès i un diccionari JavaScript petit per als textos que apareixen dinàmicament.
6. `verificar-en.mjs` comprova equivalència de rutes, scripts, imatges i estils. `comprobar-rutas.mjs` detecta enllaços trencats.
7. `informe-en.mjs --write` genera `configuracion/datos/i18n/en-coverage.json` amb cobertura **real de textos**, no només el recompte de pàgines replicades.
8. Un sol commit actualitza la memòria i els miralls. Cloudflare desplega automàticament els canvis de `quality`.

## Represa

Quan hi ha pàgines pendents i no s'ha arribat al límit del dia, cada push continua la traducció. La tasca diària independent **Traducció EN VCC Quality** (05:10 Europe/Madrid) també revisa el progrés i provoca un nou push a `quality` si cal. Els GitHub Actions `schedule` només s'executarien a la branca per defecte (`main`), de manera que no s'utilitzen per programar exclusivament `quality`.

El nombre màxim de lots i la seva mida es configuren a `configuracion/datos/idiomas-vcc.json`. Cloudflare Workers AI té límits de consum i pot aplicar càrrecs si el compte excedeix la quota gratuïta. Els límits de peticions **no garanteixen un cost màxim contractual**.

## Comprovacions manuals

    node configuracion/scripts/traduccions/actualitzar-en-v2.mjs --write  # cal OIDC del workflow
    node configuracion/scripts/traduccions/generar-en.mjs --write
    node configuracion/scripts/traduccions/generar-en.mjs --check
    node configuracion/scripts/traduccions/verificar-en.mjs
    node configuracion/scripts/traduccions/informe-en.mjs --write
    node configuracion/scripts/traduccions/informe-en.mjs --strict

**No declarar la traducció completa ni activar indexació fins que** `--strict` passi, les frases de JavaScript estiguin cobertes i hi hagi una revisió editorial humana de llengua, SEO, metadades, avisos legals, formularis i mobile.

**Main i producció no es modifiquen per aquest flux.**
