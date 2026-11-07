# Viajando con Cabeza

## Dónde editar

| Sección | Carpeta |
| --- | --- |
| Inicio | `index.html` (dirección pública `/`) e `inicio/imagenes/` |
| Destinos | `destinos/<pais>/<ciudad>/` |
| Itinerarios generales | `itinerarios/` |
| Planifica | `planifica/` |
| Nosotros | `nosotros/` |
| Contacto | `contacto/` |
| Diseño, comportamiento y plantillas comunes | `configuracion/` |

Las páginas conservan sus direcciones públicas. `index.html` permanece en la raíz para que Inicio funcione sin redirecciones. Las rutas con región, como `destinos/espana/andalucia/cordoba/`, se conservan.

## Recursos

- `configuracion/css/`: estilos globales, plantillas y estilos específicos por destino/sección.
- `configuracion/js/`: navegación, galerías y demás comportamiento.
- `configuracion/imagenes/`: marca, fondos genéricos, iconos e ilustraciones comunes.
- `destinos/imagenes/`: mapas y portadas del índice general de Destinos.
- `destinos/<pais>/<ciudad>/imagenes/`: fotografías y recursos exclusivos de ese destino.
- `configuracion/plantillas/`: bases reutilizables y ejemplo de contenido.
- `configuracion/scripts/`: creación de destinos, generación de hubs y comprobación de rutas.

Las imágenes externas ya enlazadas se mantienen como externas: no se han descargado ni atribuido a VCC. Cuando tengas fotos propias, guárdalas en `imagenes/` del destino y cambia su ruta en el contenido.

## Crear otro destino con las tres plantillas

Desde la raíz del repositorio, con Node.js:

```bash
node configuracion/scripts/destinos.mjs crear espana ciudad-nueva
```

1. Edita `destinos/espana/ciudad-nueva/contenido.json`.
2. Añade tus fotos a `destinos/espana/ciudad-nueva/imagenes/`.
3. Genera las páginas:

```bash
node configuracion/scripts/destinos.mjs generar espana ciudad-nueva
node configuracion/scripts/comprobar-rutas.mjs
```

Se generan `imprescindibles.html`, `itinerario.html` y `presupuesto.html`. No hace falta copiar CSS ni JavaScript. El número de días sale de la lista `itinerary.days`; no se añade ningún día de demostración.

El contenido inicial es un borrador, no una guía de viaje. Sustituye textos, imágenes, mapas, consejos y precios; revisa las tres páginas antes de cambiar `ready` a `true`. Mientras sea `false`, las páginas llevan `noindex` y los hubs de Planifica las excluyen. Esto evita indexación accidental, pero NO restringe el acceso: un borrador puede verse si se conoce su URL. No guardes datos privados en el repositorio.

`generar` reemplaza las tres páginas de ese destino con el contenido del JSON. Conserva `contenido.json` como fuente; no edites esas páginas generadas a mano. El comando `crear` rechaza destinos que ya existen.

Las páginas existentes, como Estocolmo, mantienen su HTML editorial actual y sus recursos ya reorganizados. No se regeneran ni se sobrescriben automáticamente. La migración de su contenido al JSON nuevo puede hacerse por separado conservando el diseño aprobado.

## Comprobar

```bash
node configuracion/scripts/comprobar-rutas.mjs
node configuracion/scripts/generate-planifica-hubs.mjs
```

El workflow Quality ejecuta las comprobaciones al publicar. Trabaja en `quality`; producción sigue usando `main`.

## Galerías fotográficas y zoom del blog (plantilla común)

El comportamiento de referencia aprobado está en `configuracion/js/plantillas/imprescindibles-galeria-escritorio.js` y sus estilos en `configuracion/css/plantillas/imprescindibles-galeria-escritorio.css`. La página de Estocolmo (`destinos/suecia/estocolmo/imprescindibles.html`) es la referencia visual, pero no debe copiarse su JS para cada ciudad.

La plantilla `configuracion/plantillas/articulos/imprescindibles.html` ya carga el **mismo visor reutilizable** para nuevos destinos generados con `configuracion/scripts/destinos.mjs`. El mosaico se crea a partir de las fotos declaradas por el destino y admite una sola foto o varios álbumes, con móvil y escritorio separados. No se añaden fotos de ejemplo a nuevas ciudades.

Comportamiento de escritorio aprobado: abrir mosaico → foto individual → `Ctrl + rueda` (zoom nativo de navegador) → pan del ratón por los cuatro sentidos, con recorrido amplio y equilibrado. El punto del zoom permanece fijo bajo el cursor, el regreso al zoom del 100 % restaura el encuadre original, y el cierre restituye el scroll de la página. No modificar estos comportamientos al cambiar un destino.

**Ámbito:** visores de fotografías de las páginas «Qué ver / Imprescindibles». Las cabeceras decorativas SVG/WebP (`hero`, `vcc-hero`, etc.) no son visores interactivos; no se les añade pan ni se interviene en su fondo automáticamente. Si otra sección incorpora un visor fotográfico, integrar el componente común respetando su estructura antes de activarlo.

## Compatibilidad

`_redirects` conserva las antiguas direcciones de recursos trasladados. `configuracion/rutas-recursos.json` documenta su nueva ubicación. Solo se han unificado imágenes con bytes idénticos; las variantes distintas se conservan.
