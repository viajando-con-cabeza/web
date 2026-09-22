# Estado de la migración VCC

La publicación de los diseños existentes en `quality` es una operación diferente de la refactorización hacia plantillas reutilizables.

- Las páginas públicas siguen viviendo en las rutas originales (`destinos/...`) para conservar URLs.
- La carpeta `web/` contiene un **piloto parcial** de la plantilla de país Suecia (`web/templates/country.js`, `web/components/country-cards.js` y `web/content/destinos/suecia.js`). Actualmente no es el origen de todas las páginas de producción.
- Las guías y sus interacciones existentes usan todavía archivos HTML/CSS/JS legados. NO elimines `css/`, `js/`, `destinos/` ni los recursos `assets/` al subir fotografías.
- Las imágenes nuevas pueden cargarse en `web/assets/destinos/suecia/` pero una imagen solo aparece cuando se referencia expresamente desde el contenido que utilice la página correspondiente.
- No cambies la raíz de publicación del sitio a `web/` hasta implementar y validar un generador que produzca las mismas rutas públicas.

**Próximo paso de arquitectura:** migrar páginas de ciudad, imprescindibles e itinerario hacia componentes reutilizables y separar sus textos y fotos de las plantillas, comprobando antes las páginas generadas y sus enlaces.
