# Arquitectura escalable de Viajando con Cabeza (VCC)

**Estat:** proposta tècnica aplicada parcialment a `quality` · 17-11-2026. No és una migració global ni un canvi a producció.
**Objectiu:** créixer de Suècia/Estocolm a centenars de països, regions, ciutats, itineraris i guies mantenint un únic sistema visual, una única font de dades i la qualitat editorial.

## 1. Diagnòstic inicial del repositori

Inventari d'un snapshot de la branca `quality` (comptant fitxers de recursos, fonts i esborranys):

| Indicador | Valor inicial |
| --- | ---: |
| Fitxers en Git | 1.137 |
| HTML del lloc (sense configuracion/) | 133 |
| HTML aprovats al registre editorial | 25 |
| HTML no aprovats / esborranys | 108 |
| CSS | 201, ~4,0 MB abans de compressió |
| JavaScript .js | 101 |
| WebP | 324, ~118 MB |
| Metadades de països per a catàlegs | 44 |
| Bundles CSS al manifest | 15 |

**Important:** la presència d'una pàgina d'Espanya, Itàlia, Roma, etc. al repositori NO la converteix en una guia acabada. L'estat de publicació el decideix només `configuracion/datos/publicacion-vcc.json` (deny-by-default). No eliminar aquests esborranys, imatges o redireccions en massa: alguns tenen dependències, proves històriques o referències internes. Arxivar només després d'un inventari d'enllaços i rutes. Suècia/Estocolm és la **referència visual aprovada pel projecte**, encara que el registre de publicació de SEO no inclogui tots els seus documents.

### Riscos identificats

- **CSS acumulat:** bundles generats, fonts repetides i retocs amb `!important`. No és segur suprimir-los per nom. Primer mesurar cadenes `@import`, pàgines que els carreguen i ordre de cascada. Auditar amb `npm run audit:architecture`.
- **Generadors diferents:** `configuracion/scripts/destinos.mjs` crea tres articles des de JSON, però les landings i l'experiència editorial més completa de Suècia/Estocolm encara no estan convertides íntegrament en un generador comú. No presentar el generador actual com si ja reproduís fidelment totes aquestes pàgines.
- **Contingut dins d'HTML/JS:** pressupostos, FAQ, targetes i guies encara barregen dades amb presentació. Les dades que es repeteixen han d'anar cap a models versionats.
- **Moltes fotografies a Git:** el contingut fotogràfic nou hauria de prioritzar el R2 existent. Mantindre fotos pròpies, originals i versions optimitzades; no convertir o esborrar originals automàticament.
- **CI pendent:** algunes proves heretades d'hero havien quedat lligades a literals CSS antics. Una auditoria de recursos també detecta una imatge externa sense registre que cal identificar abans de donar-la per bona. No ignorar els errors.

## 2. Fonts de veritat (evitar segones configuracions paral·leles)

| Responsabilitat | Font canònica | Normativa |
| --- | --- | --- |
| Fonts, paleta, mides i separacions | `configuracion/css/base/tokens-vcc.css` | Un canvi global ha d'arribar als components migrats. Mantenir valors per defecte fins que hi hagi revisió visual |
| CSS i components de capçalera | `configuracion/css/componentes/vcc-capcaleres-editorials.css` i `vcc-altura-portades-subheader.css` | Suècia i Estocolm comparteixen composició i tokens |
| Conjunt de bundles CSS | `configuracion/datos/compilacion-css-vcc.json` | Editar fonts, generar bundles; no modificar el CSS compilat a mà |
| Dades de països/continents | `configuracion/datos/paises-vcc.json` | Només etiquetes geogràfiques, mai estat editorial |
| Estat de publicació i SEO | `configuracion/datos/publicacion-vcc.json` | Denegar per defecte, aprovació explícita |
| Plantilles de referència | `configuracion/datos/plantilles-vcc.json` | Suècia/Estocolm són les referències que s'hauran d'extreure a components, no copiar literalment |
| Idiomes (contracte futur) | `configuracion/datos/idiomas-vcc.json` | ES font, EN planificat. Cap traducció automàtica activada encara |
| Fotografies de viatge | Cloudflare R2 existent | Una sola clau de foto original, variants optimitzades sense alterar el look |
| Estats UI i càlculs | `configuracion/js/componentes/` + lògica de plantilla | Components compartits; la informació de cada pàgina no ha de duplicar algoritmes |

**n8n:** pot orquestrar avisos, traduccions, revisions, publicacions o xarxes. No ha de ser la font de veritat dels colors, pàgines, contingut o traduccions: aquestes dades han de quedar versionades a Git. Si n8n s'atura, la web publicada ha de continuar funcionant.

## 3. Model de contingut per a centenars de destinacions

Jerarquia de URL estable:

```text
/destinos/{pais}/
/destinos/{pais}/{region}/                 # opcional
/destinos/{pais}/{region?}/{ciudad}/
/destinos/{pais}/{region?}/{ciudad}/itinerario/
```

No crear 80 variants d'HTML repetit a mà. El futur model de contingut ha de descriure dades i no CSS:

- **País:** codi, nom ES, continent, dades generals, portada R2, regions i guies disponibles.
- **Regió:** identificador, país pare, ciutats i itineraris, cobertura, fotografia.
- **Ciutat:** dies ideals, pressupost, descripció, punts d'interès, mobilitat, allotjament, fotos, valoració VCC.
- **Itinerari:** seqüència de dies, trams, parades, duracions, transports, cost i mapa, amb un identificador estable.
- **Guies:** `cuando-ir`, `como-llegar`, `como-moverse`, `donde-dormir`, `presupuesto`, `que-llevar`, `imprescindibles`, etc. Les que no tenen dades reals es mantenen en draft.

La plantilla **dissenya**; el JSON **aporta contingut**; el generador **crea HTML estàtic**; el registre editorial **decideix la publicació**. Els scripts haurien de fallar si falten dades essencials en un contingut marcat ready, no inventar punts ni imports.

### Migració per etapes, sense perdre el disseny validat

1. **Congelar les referències de Suècia i Estocolm** com a referències de regressió visual i funcional per ordinador, mòbil i vista d'ordinador al mòbil.
2. **Extreure elements compartits reals:** hero de país/ciutat, seccions editorials, targetes Planifica, FAQ, comparadors, carrusels, Consejo VCC, footer, PDF.
3. **Separar contingut i codi:** introduir un esquema de dades amb camps obligatoris i opcionals, i generar una guia de prova des del nou motor.
4. **Provar paritat amb Estocolm** (textos, dades, fotos R2, responsive, SEO, interaccions, PDFs) abans de substituir cap HTML existent.
5. **Escalar a la resta de països** utilitzant només la nova plantilla, no copiant Estocolm fitxer a fitxer.

`configuracion/scripts/destinos.mjs` és avui un generador útil d'esborranys de tres articles; **no és encara el generador definitiu de totes les pàgines basades en Estocolm**. No migrar-lo a cegues.

## 4. Traducció automàtica gratuïta (fase posterior)

**No activada actualment**. El contracte de l'idioma és a `configuracion/datos/idiomas-vcc.json`.

Objectiu: publicar sempre ES com a origen, generar EN en el **build** i servir-lo estàticament des de `/en/...`. Així els lectors no provoquen cap traducció en cada visita.

Pipeline previst:
1. Detectar canvis a blocs de text estables (clau del bloc, hash del contingut, llengua i versió del glossari).
2. Enviar **només blocs nous o canviats** a Cloudflare Workers AI dins la quota gratuïta o a un motor local de codi obert com Argos Translate. Un Worker no ha de bloquejar les peticions dels usuaris.
3. Desar resultats a fitxers versionats amb cache i possibilitat de correcció manual; conservar intactes HTML estructural, classes, JS, URL, imatges, xifres, imports i la marca VCC.
4. Traduir també strings d'UI, textos de calculadores, filtres, `aria-label`, formularis, metadades SEO i PDF. Provar funcionalitats en ES/EN.
5. Generar URL i `hreflang` només si la versió anglesa existeix i està revisada. No indexar traduccions buides ni enllaçar a «Coming soon».
6. Posar límit estricte a consum i concurrència: **0 € és objectiu de despesa addicional, no una garantia de traducció il·limitada**.

Futur n8n: desencadenar tasques de traducció i comprovació després d'un push, enviar alertes en cas d'error, no reescriure directament la web en temps real.

## 5. Control de regressió, costos i rendiment

- `npm run architecture:check`: valida fonts de veritat, metadades, plantilles, tokens i estat editorial. S'executa dins `site:check` i per tant a Quality i producció.
- `npm run architecture:report`: resum JSON d'HTML, esborranys, països, bundles i problemes; utilitzable per CI/n8n.
- `npm run audit:architecture`: graf de dependències CSS, fonts compartides solapades i pàgines pesades. **Informatiu**, no suprimir res automàticament.
- `npm run site:sync`: genera els fitxers derivats. No modificar paquets `*-compilado*.css` sense canviar la font.
- `npm run site:check` i `npm run review:full`: controls actuals.
- Revisió visual: portada, Suècia, Estocolm, itinerari, pressupost, eines de Planifica, PDF, PC/mòbil i Chrome en mode escriptori mòbil.

La mida en bytes del CSS no equival a transferència real (compressió, caché, HTTP). Tot i així, una web amb centenars de guies requereix menys CSS repetit, imatges R2 amb lazy loading, bundles condicionats per tipus de pàgina i estratègies de cache verificades.

### Deute mesurat per l'auditoria de dependències (GitHub Actions)

Abans de fusionar a producció, prioritzar aquests casos concrets, sense canviar el disseny aprovat només per baixar un recompte:

| Àrea | Diagnòstic mesurat | Acció segura |
| --- | --- | --- |
| Estocolm · pressupost | ~420 KB CSS cru en 5 enllaços (abans ~533 KB i 5 solapaments de ~133 KB) | Consolidació aplicada al manifest: conservar els components al final de la cascada; comprovar amb regressió visual |
| Estocolm · què portar | ~384 KB CSS cru, 14 fulls | Extreure CSS de plantilla reutilitzable i eliminar només dependències comprovades |
| Estocolm · imprescindibles | ~347 KB CSS cru, 14 fulls | Centralitzar targetes i carrusel sense tocar galeries ni fotos |
| Planifica · vols i targetes | 17 fulls CSS cadascuna; el validador actual limita a 16 | Consolidar els fitxers realment co-carregats i conservar la mateixa cascada |
| Estocolm · allotjament / pressupost | El validador detecta ordre de cascada inconsistent | Comparar càrregues reals i la regla aprovada; corregir la font, no afeblir el test |
| Imatges externes | Auditoria visual detecta una URL d'Unsplash no registrada en targetes destacades | Identificar la imatge i substituir-la per fotografia pròpia de R2 si correspon; no aprovar-la silenciosament |

**Estat CI:** el workflow `VCC · Arquitectura i creixement` ha passat. El workflow global `Quality` encara falla en comprovacions de cascada CSS existents; l'auditoria de recursos bloqueja una fotografia externa no registrada. Aquests errors es mantenen visibles perquè no confonguem un contracte arquitectònic correcte amb un desplegament visual o una publicació completament validada.

## 5 bis. Correccions aplicades i estat comprovat (17-11-2026)

**A les execucions GitHub Actions sobre la branca Quality:**
- Quality — PASSA: https://github.com/viajando-con-cabeza/web/actions/runs/44085808442
- Recursos visuals — PASSA: https://github.com/viajando-con-cabeza/web/actions/runs/44085808514

### Canvis tècnics confirmats

1. Compilació de base `paginas.css + overrides.css` en un únic full compartit, utilitzat per Vuelos, Tarjetas de viaje, Mapas i Calcula tu viaje. Ordre de cascada conservat.
2. Fonts d'editorial + «Cómo ahorrar» empaquetades per Pressupost i Allotjament. Sense moure les regles.
3. Dues peticions de Google Fonts unificades en una a Mapas i Calcula tu viaje. Famílies i pesos iguals.
4. SVG de ratings, passes, «Sigue descubriendo» i controls de Suècia extrets a recursos externs. Les guies aprovades no dibuixen vectors nous en HTML/JS/CSS.
5. Foto externa no registrada eliminada d'una targeta d'itinerari *no publicat*. Substituïda per logo corporatiu neutre fins que hi hagi foto pròpia del lloc.
6. `WebPage` JSON-LD sincronitzada automàticament des de title/description/canonical/OG de cada pàgina aprovada. S'han tret 3 nodes preexistents duplicats, conservant les breadcrumbs i les dades d'ItemList reals.
7. Proves de SEO, itinerari, vols/PDF, Cuándo ir, Imprescindibles i portades actualitzades per comprovar fonts R2, classes i estructures **realment aprovades**, no snapshots antics.
8. Auditoria CSS: pes cru i estimació gzip. Pressupost Estocolm ha baixat de ~533 KB a ~420 KB CSS cru; mesurar gzip de nou després de regenerar bundles. El pes cru no és la transferència real de xarxa.

### Deute que no hem esborrat a cegues

- Les **62 icones SVG incrustades** que quedaven en set esborranys ja s'han migrat a sprites externs. La validació ara exigeix SVG compartit també als esborranys.
- Després de la neteja queden un àlies de compatibilitat CSS i possibles recursos sense referències literals que no es poden declarar orfes sense inspeccionar els carregadors dinàmics.
- Els solapaments grans del Pressupost Estocolm ja s'han eliminat de les inclusions primerenques conservant els últims components; resten solapaments interns menors de portades/guies, que requereixen comparació visual abans de tocar selectors.
- Alguns enllaços des de pàgines aprovades apunten a guies no aprovades. Els hubs principals ja apliquen la política editorial `deny-by-default`; abans de publicar nous destins, revisar també les relacions entre guies.
- **No s'ha fet una comparació visual exhaustiva en navegadors** ni un mesurament de Core Web Vitals en una URL desplegada per a cada pàgina. Quality correcte no implica absència de regressions visuals ni cap promesa de posicionament a Google.
- Traducció EN **encara desactivada**; depèn d'implementar un pipeline verificat i editorialment revisat.

### Criteri SEO

No afegir `meta keywords` ni blocs amb paraules ocultes. Google no utilitza la primera etiqueta, i les dades estructurades han de descriure contingut real. Prioritzar contingut propi, títols i descripcions únics, rutes estables, enllaços editorials, qualitat fotogràfica, rendiment i seguiment a Search Console.

Fonts: https://developers.google.com/search/docs/fundamentals/seo-starter-guide i https://developers.google.com/search/docs/appearance/structured-data/sd-policies.

## 5 ter. Consolidació segura del repositori — Quality (17-11-2026)

### Enllaços a guies en preparació, sense canvis de maquetació

- `configuracion/datos/enllacos-futurs-vcc.json` conté redireccions temporals **d'enllaços de contingut**, no redireccions HTTP de les URL dels esborranys.
- `configuracion/scripts/sincronizar-enllacos-futurs-vcc.mjs` conserva `data-vcc-original-href` i restaura l'enllaç en aprovar el destí. Està integrat a `site:sync` i `site:check`.
- El catàleg `planifica/donde-ir/` conserva els seus 41 esborranys no clicables; la seva font de veritat continua sent `sincronizar-catalogo-vcc.mjs`.
- Els enllaços cap a la pàgina pare de país, i les molles de pa, no es desactiven encara que aquell país estigui exclòs del sitemap. `auditar-escalabilidad-vcc.mjs` deixa de comptar `data-vcc-original-href` com un `href` real.
- Quan s'aprovin pàgines concretes, comprovar que el `site:sync` restaura les URL i que `links:check` no identifica alternatives obsoletes.

### Estils, icones i recursos

- `vcc-base-paginas-compartit.css` substitueix `paginas.css` i `overrides.css` com un únic paquet **en el mateix ordre** a les pàgines migrades: Planifica, Alojamientos, Vuelos, Tarjetas, Mapas, Calcula tu viaje i Qué llevar Estocolmo.
- Els SVG de Suècia (carrusels, transport, allotjament, pressupost) i Planifica (Apps i Seguros) s'han traslladat a `configuracion/imagenes/iconos/compartidos/`. Conserven classes, mides i geometries dels originals. El validador d'icones ja bloqueja qualsevol nova geometria incrustada, també als esborranys.
- Eliminar només CSS després de comprovar referències HTML, JS, imports, manifest i àlies. Eliminats com a obsolets `presupuestos-hub.css`, `que-llevar-hub.css`, `paginas/planifica-apps-interno-1.css` i `planifica-tarjetas-modelo-estocolmo-vcc.css`.
- `acciones-pdf-vcc.css` es manté deliberadament com a àlies de compatibilitat; s'ha eliminat `presupuesto-compartido-vcc.css` perquè no tenia dependències al repositori. **No renombrar físicament fitxers d'imatges ni icones en ús**: trencaria cache, URL i peticions.
- La consolidació dels bundles del Pressupost, Itinerari i Allotjament s'ha aplicat conservant els CSS compartits posteriors i la cascada. Qualsevol solapament restant s'ha de validar abans de suprimir-lo.

### Contractes per generar futurs destins

- El generador històric `destinos.mjs` continua sent un **scaffold de tres guies** (imprescindibles, itinerari, pressupost), NO una còpia definitiva de les plantilles visuals de Suècia/Estocolm.
- `configuracion/plantillas/destino-ejemplo.json` arrenca amb `ready:false` i `editorialReviewed:false` perquè les xifres de mostra, fotografies de referència i textos de demostració no es puguin publicar per accident.
- Per activar `ready:true` cal revisió editorial explícita, text propi i fotografies originals en R2 VCC o la carpeta d'imatges pròpia de la ciutat. Encara així, el registre `publicacion-vcc.json` ha d'aprovar individualment la pàgina per poder-se indexar.
- El motor v2 de país/regió/ciutat/itinerari està creat i connectat a `site:sync` però **sense cap model real publicat encara**. Les pàgines actuals de Suècia/Estocolm no s'han reescrit; la memòria ES→EN pilot no implica publicar `/en/`.
- **Regla per a noves fotos:** noms de fitxer originals estables, sense renombrar fitxers públics, variants AVIF/WebP derivades sense filtres de color, referència a R2 en dades de destinació. No atribuir fotos de Suècia a ciutats no visitades.

### Comprovació abans de promoure a main

1. Executar `npm run site:sync` i `npm run site:check`, després `npm test` i l'auditoria de recursos visuals.
2. Revisar a navegador les pàgines de referència **Suècia/Estocolm i Planifica** en mòbil i escriptori (hero, capçaleres, marges, carrusels, estats del mapa, calculadores, PDF, totes les fotos pròpies).
3. Fer proves de regressió URL/ancoratges i visual després de qualsevol reorganització de carpetes.
4. Comparar Core Web Vitals a Google Search Console/PageSpeed a l'entorn real abans de considerar l'optimització completada.
5. No fusionar una refactorització només perquè els tests estructurals passin; han de coincidir també l'aspecte i la funcionalitat reals.

## 5 quater. Motor v2 i regressió visual automatitzada (17-11-2026)

### Quatre tipus de pàgina a partir d'un JSON compartit

- **Renderitzador:** `configuracion/scripts/lib/plantilles-destins-vcc.mjs`
- **CLI:** `configuracion/scripts/generar-destins-vcc.mjs` (`npm run destinos:v2-new`, `destinos:v2-build`, `destinos:v2-check`, `destinos:v2-test`)
- **Font de contingut:** `configuracion/contenido/destinos/` amb README d'exemples
- **Full visual únic, encapsulat:** `configuracion/css/plantillas/destinos-genericos-vcc.css`, que consumeix els tokens globals d'hero, fonts i marges
- **Validació i SEO:** publicar només per `reviewed + editorialReviewed + publicacion-vcc.json`, la resta `noindex`. Metaetiquetes, URL canònica, WebPage i BreadcrumbList. Imatges pròpies R2.
- **CI:** quatre tests unitaris de tipus, rutes, noindex i SEO passen al workflow `Quality`.
- **Compatibilitat:** el generador v2 mai sobreescriu els HTML editats manualment; les guies Suècia/Estocolm continuen intactes. El generador històric `destinos.mjs` només s'utilitza per a continguts antics.

Això proporciona una **estructura tècnica ja utilitzable per als nous destins**, però no garanteix encara una equivalència al píxel del nou disseny amb TOTES les plantilles històriques: cal validar la primera pàgina real abans de publicar-la.

### Regressió visual executada a GitHub Actions

`VCC · Regressió visual responsive` utilitza Chromium amb fotografies neutralitzades només per comparar la geometria de manera reproduïble. Compara ordinador, tauleta i mòbil, text visible, CSS calculat, marges, rectangles, estils, fotos per ruta i 404 locals.

Referència visual immutable `21433cc37ceaeca04fd73608027f497f2cf2d9b0`, abans dels canvis d'aquest cicle.

- Inclou les **25 pàgines publicables** i **8 guies/esborranys visuals** de Suècia/Planifica, 33 pàgines × 3 dispositius = 99 comprovacions.
- S'exclou de la comparació d'identitat estricta la fotografia decorativa **aleatòria** de Contacto (només si la captura, CSS i text són equivalents).
- No se substitueix una prova humana amb fotografies i interaccions reals. El mapa, carrusels i PDF requereixen validació manual puntual; Core Web Vitals és una auditoria separada.

### Política de neteja conservadora

Eliminat el CSS `presupuesto-compartido-vcc.css` (~12 KB) sense cap dependència; es preserva l'àlies `acciones-pdf-vcc.css` per compatibilitat. S'han eliminat dues fonts repetides addicionals dels bundles d'Itinerari i Allotjament, conservant les versions carregades després de la base, sense canviar selectors.

No eliminar fotografies, icones o carpetes només per tenir noms antics: una URL pot estar referenciada des de CSS, JS, R2 o enllaços externs.

## 6. Ordre de prioritats

**Ara — sense regressions:** consolidar metadades del catàleg, declarar referències i idiomes, fer editables els tokens, afegir controls automàtics, corregir tests obsolets i registrar pendents.

**Següent — contingut nou:** utilitzar el motor v2 disponible per als propers països/regions/ciutats i comprovar-ne els components contra Suècia/Estocolm. Les guies existents continuen amb les seves plantilles aprovades. No esborrar esborranys antics abans de preparar rutes de reemplaçament.

**Després — traducció EN + SEO:** pipeline incremental, revisió, cache persistent i selector ES/EN correcte per totes les pàgines.

**Creixement:** afegir destins principalment aportant JSON, fotos R2 i itineraris; nous components visuals només si no existeix una variant compartida.

## 7. Normes d'edició a partir d'ara

1. **Primer cercar la font compartida existent**, després editar. Evitar un `fix-v11.css` per cada pàgina.
2. Els colors i les tipografies van a tokens; les diferències del tipus de targeta van a components; els textos, imports, fotos i noms a dades.
3. Cap contingut, preu o imatge fictícia marcat com publicat. Les dades VCC són dades reals.
4. No modificar fitxers compilats manualment, ni eliminar carpetes de destins abans d'inventariar enllaços, redireccions, fotos i SEO.
5. No carregar traducció AI al navegador de cada lector. La versió publicada ha de ser ràpida i independent de n8n/IA.
6. Preservar `main`; revisar `quality` i validar tests + vistes abans de promoure.

> **Estat honest:** aquesta primera fase defineix contractes reutilitzables, extreu les metadades de països i automatitza validacions. No ha migrat totes les pàgines, ni ha eliminat 201 CSS, ni ha encès la traducció EN. Fer aquests canvis alhora posaria en risc el disseny ja aprovat.
