# Viajando con Cabeza · piloto de arquitectura en main

Este es un **piloto funcional de la guía de país Suecia**, no una migración completa del sitio. La página pública conserva `destinos/suecia/index.html` y la misma URL. Las guías de ciudad, imprescindibles e itinerarios continúan con su implementación anterior.

- `config/theme.css`: colores y anchura de la guía de país, con valores iniciales equivalentes a los existentes.
- `content/destinos/suecia.js`: ficha de Suecia, guías, itinerarios, preguntas, tarjetas y selección de imágenes. Es una copia de los datos que ya utilizaba producción; se conserva el objeto `SWEDEN_CONTENT` para no romper el planificador.
- `components/country-cards.js`: renderizado reutilizable de tarjetas, galerías horizontales, preguntas y opciones.
- `templates/country.js`: estructura de una guía de país; toma los datos de `window.VCC_COUNTRY_CONTENT` o, por compatibilidad, `window.SWEDEN_CONTENT`.
- `assets/destinos/suecia/`: carpeta para subir fotografías nuevas a GitHub.

## Editar Suecia

1. Selecciona la rama deseada en GitHub. Para cambiar la web pública, usa `main`; para experimentar, usa `quality` **una vez que se haya incorporado este piloto a esa rama**. Las ramas no comparten los cambios automáticamente.
2. Para modificar textos, tarjetas o fotos elegidas, edita `web/content/destinos/suecia.js` en esa rama. Usa rutas de imagen que empiecen por `/` para que no dependan de la profundidad de la página.
3. Para modificar el diseño de las tarjetas de país, edita `web/components/country-cards.js` y el CSS correspondiente. Para cambiar la estructura de la guía, edita `web/templates/country.js`. Para cambiar el color o la anchura de esta guía, edita `web/config/theme.css`.
4. Comprueba `destinos/suecia/` y sus enlaces después de cada cambio. Las URLs públicas y los scripts de interacción originales se mantienen por compatibilidad.

## Límites del piloto

El CSS de la web antigua sigue existiendo, así que todavía no hay un sistema global de estilos para **todas** las páginas. Las fotos actuales son externas y no se han descargado ni recolocado. La navegación, el buscador de rutas de Suecia y las páginas de Estocolmo siguen utilizando código anterior. Los workflows actuales de GitHub no verifican automáticamente enlaces, imágenes ni resultados visuales; hace falta ampliar las pruebas antes de migrar el sitio completo. No cambies el directorio de publicación de Cloudflare a `web/`: la raíz del sitio sigue estando en la raíz del repositorio.
