# Presupuestos por país y zona (VCC)

Fuente de datos única para las estimaciones que aparecen en las páginas de presupuesto de país.

## Archivo actual

- `suecia.json` — seis zonas de Suecia y cuatro estilos: `lujo`, `medio`, `vcc`, `mochilero`.
- La página `/destinos/suecia/presupuesto` carga este JSON a través del atributo `data-budget-prices`. Nunca debe mantener otra tabla de importes en JavaScript o CSS.

## Actualizar precios

1. Abrir `configuracion/datos/presupuestos/suecia.json`.
2. Elegir `zones -> identificador_zona -> prices -> estilo -> categoría`.
3. Escribir el importe en **euros por persona (pax)**: `alojamiento` es por **noche**; `comida`, `transporte`, `actividades` y `extras` son por **día**. Usar enteros no negativos.
4. Actualizar `updated` con la fecha de revisión y publicar en `quality`. Comprobar los cuatro perfiles, la calculadora y las tarjetas de zona.
5. Tras validar los nuevos importes, actualizar el parámetro de versión `?v=` de `data-budget-prices` en la página si se usa una caché de larga duración.

## Añadir una nueva zona

- Incorporar una entrada nueva dentro de `zones`, con clave sencilla en minúsculas (por ejemplo `skane`), `name`, `selectLabel`, `detail`, `transport` y los 20 importes (5 categorías por 4 estilos).
- Añadir `card` con `type`, `symbol`, `image` (o `null`), `description` y, si ya existe una guía de presupuesto real, `realBudgetUrl`.
- La página crea automáticamente la opción del selector y una tarjeta nueva a partir de la ficha compartida.
- No es necesario modificar el JavaScript de la calculadora para cambiar cifras o sumar zonas.

## Significado de las cifras

Las cantidades almacenadas son **escenarios ilustrativos para planificar** (no precios en tiempo real, medias oficiales, tarifas verificadas ni gastos reales de VCC). Se debe indicar explícitamente cuando una guía sí muestra el gasto real de un viaje, como Estocolmo en 3 días.

Fórmula de total de viaje: **(alojamiento × noches + (comida + transporte + actividades + extras) × días) × viajeros**. Los importes de una zona se suman por categoría para obtener el ejemplo de `€/pax/día` del perfil, con la convención de una noche por día.

## Extender a otros países

Crear `<pais>.json` con el mismo esquema v1. Las páginas deben apuntar a su archivo con `data-budget-prices` y adaptar el código de país si se añade una nueva página. La estructura se ha documentado para poder convertir el cargador de presupuestos en componente global cuando existan otros países, sin forzar una abstracción prematura.
