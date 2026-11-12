# VCC · Regles per construir guies ràpides i fàcils de mantenir

Aquest document fixa el patró de qualitat per a **totes les noves guies de destinació**. El codi canònic és el punt de partida: no es creen CSS acumulatius ni excepcions per cada pàgina quan un component ja existeix.

## 1. Estils: una font, paquets reutilitzables

- Editar els CSS canònics. Mai els fitxers `*-compilat.css` ni els paquets `*-compartit.css` generats.
- Registrar fonts i sortides a `configuracion/datos/compilacion-css-vcc.json`. El generador és `configuracion/scripts/compilar-css-vcc.mjs`.
- Les guies d'Estocolm comparteixen:
  - `vcc-guies-ui-compartit.css`: UI editorial i capçaleres.
  - `vcc-guies-core-fons-compartit.css`: tokens, header, hero LCP i fons de guies relacionades.
  - Un `[guia]-base-compilat.css` amb els estils específics, sense duplicar-los en cada HTML.
- Conservar la cascada original: **base → UI compartida → complements opcionals → guies relacionades → portades responsives → core/fons compartit**.
- El CSS de la primera pantalla es carrega normalment. No fer `media=print/onload` per al CSS base ni per al core: provoca canvis visuals o pot empitjorar l'LCP.
- `configuracion/scripts/publicar-portadas-rapidas.mjs` actualitza el CSS de portada in situ, sense moure'l després del core ni duplicar els estils globals.

## 2. Imatge LCP: una única fotografia per pantalla

- Sempre la mateixa foto aprovada, sense retocs automàtics de brillantor, saturació, contrast ni enquadrament.
- `<meta name="viewport">` ha d'anar **abans** del `preload` d'imatge.
- En portades WebP locals, crear una versió mòbil de 960 px i una d'escriptori de 1920 px; condicionar amb `media`, `srcset` i `sizes`. No descarregar les dues al mòbil.
- En portades AVIF de R2, preferir la ruta optimitzada `/__vcc_preview/visor/`, mai l'original de diversos MB com a URL de portada. Un únic `<link rel="preload" as="image" type="image/avif" ... fetchpriority="high">` que coincideixi amb la foto visible.
- Prioritzar sempre la imatge LCP amb `fetchpriority="high"`, `loading="eager"` i dimensions intrínseques. No aplicar lazy loading al primer hero.
- Mantenir les fotografies de seccions llunyanes fora de la ruta de càrrega inicial sempre que el disseny final no salti.
- Les imatges de galeria no visibles es carreguen amb el lazy loader compartit, no amb scripts nous per pàgina.

## 3. Components i JavaScript

- Reutilitzar capçalera, subheader, breadcrumb, fletxes de carrusel, targetes i footer.
- No tornar a injectar al DOM components o CSS que ja estan al HTML inicial.
- Evitar seqüències de lectures i escriptures de geometria durant el primer render (reflows forçats).
- Consolidar funcionalitats repetides als components compartits, sense canviar silenciosament l'experiència mòbil.

## 4. Publicar i verificar sense regressions

1. Fer els canvis a **quality**. No modificar `main` sense aprovació.
2. Executar `npm run site:sync` i `npm run site:check`, més `npm test` quan pertoqui.
3. Comprovar que el generador no ha afegit CSS duplicats i que l'ordre de les regles no canvia.
4. Revisar PageSpeed Insights **mòbil i escriptori**; apuntar FCP, LCP, TBT, CLS i Speed Index, sense confondre puntuació de laboratori amb dades reals.
5. Comparar diverses execucions abans/després, perquè una oscil·lació d'1–4 punts pot no indicar una regressió real.
6. Si l'LCP o el disseny empitjoren, **restaurar la versió validada**, no encadenar més pegats.

La versió estable de `presupuesto.html` que va obtenir **93 en mòbil i 100 en escriptori** és una referència: no cal reescriure-la per traslladar-ne el patró a altres pàgines.

## 5. Contractes automàtics

- `verificar-estilos-html-vcc.mjs`: un únic core, sense duplicacions, amb l'ordre de cascada dels paquets de guies.
- `verificar-portadas-unificadas.mjs`: un preload AVIF per a fotos de R2 o dos preloads WebP condicionals per a portades locals; viewport primer, imatge prioritària.
- Les guies noves que comparteixin aquest patró s'han de registrar al manifest i han de reutilitzar els mateixos components en lloc de començar de zero.
