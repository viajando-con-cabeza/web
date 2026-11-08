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
