# Contingut de destinacions VCC · motor v2

Aquest directori contindrà els **fitxers de dades** dels futurs països, regions, ciutats i itineraris, sense duplicar HTML/CSS. **Suècia i Estocolm no es reescriuen**: continuen com a referències visuals fins que hi hagi paritat demostrada.

## Crear un esborrany

Des de l'arrel del repositori:

```bash
npm run destinos:v2-new -- country noruega
npm run destinos:v2-new -- region noruega fiordos
npm run destinos:v2-new -- city noruega oslo
npm run destinos:v2-new -- itinerary noruega oslo itinerario
npm run destinos:v2-build
npm run destinos:v2-check
```

Per a ciutats i itineraris dins una regió, l'ordre és `city país regió ciutat` i `itinerary país regió ciutat slug`.

El nou sistema crea una fitxa JSON en aquest directori i no copia cap CSS. Les plantilles comparteixen `configuracion/css/plantillas/destinos-genericos-vcc.css` i els tokens VCC globals. El generador produeix HTML estàtic, títols, metadescripcions i, quan estigui aprovat, canonical i JSON-LD.

### Publicació

Les dades comencen amb `status: "draft"`, `editorialReviewed: false` i sense fotografia fictícia. Després de revisar textos, dades i imatges pròpies de Cloudflare R2, es poden marcar com `reviewed`, però **no s'indexen** fins que la pàgina estigui també a `configuracion/datos/publicacion-vcc.json`.

El generador no pot sobreescriure una pàgina editada manualment: únicament actualitza pàgines que tinguin la marca `data-vcc-generated-destination`.

### Preparació del contingut

- `kind`: `country`, `region`, `city` o `itinerary`
- `slug`, `country`, `region` i `city`: jerarquia de URL
- `name`, `seoTitle`, `tagline`, `description`, `facts`: capçalera
- `sections`: seccions amb `id`, `title`, `description` i `cards`
- `faq`: preguntes i respostes reals
- `days`: dies i parades per a itineraris
- `heroImage`, `heroAlt`: fotografies originals pròpies a R2

No inventar costos, puntuacions ni experiències i no copiar fotografies d'una altra destinació. El contingut és l'única part que s'ha d'editar quan es crea una destinació nova.
