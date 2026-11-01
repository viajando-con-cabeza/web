# Configuración compartida

- `css/plantillas/`: diseño de las tres plantillas.
- `js/plantillas/galeria-lugares.js`: visor reutilizable de lugares, sin fotos ni textos de demostración de Estocolmo.
- `js/plantillas/galeria-itinerario.js`: galerías, navegación y carrusel de días; usa los días del contenido.
- `plantillas/articulos/`: HTML base del generador.
- `plantillas/destino-ejemplo.json`: contenido inicial editable para nuevos destinos.
- `plantillas/archivo/`: estructuras antiguas, conservadas como referencia; no las uses para páginas nuevas.
- `css/destinos/` y `js/destinos/`: estilos o comportamiento todavía específicos de páginas existentes.
- `imagenes/`: solo recursos comunes. Las fotos propias de un destino van con él.

El generador requiere Node.js y no instala dependencias. Más instrucciones en el README de la raíz.
