# Comparador universal de transporte · VCC

**Fuente de verdad del cálculo:** `/configuracion/js/componentes/vcc-transporte-optimizador.js`
**Primer catálogo publicado:** `/configuracion/datos/transporte/estocolmo-sl-2026.js`
**Primera integración visual:** `/destinos/suecia/estocolmo/como-moverse.html`

## Objetivo

Comparar, por destino y moneda, transporte público (billetes y abonos de horas,
días o número de viajes) con el coste introducido de transporte privado.
La persona lectora informa días, VALIDACIONES DE BILLETE POR PERSONA/día,
número de viajeros, tarifa aplicable y, si procede, costes de coche.
El precio oficial lo carga VCC desde la ficha del destino; el lector puede
modificarlo para SIMULAR, sin alterar nunca la ficha oficial.

## Comparador universal VCC · tres alternativas configurables

**Piloto**: Estocolmo, `destinos/suecia/estocolmo/como-moverse.html` (rama `quality`).
No trasladar los cambios a la guía general de Suecia sin aprobación.

- Motor: `configuracion/js/componentes/vcc-transporte-comparador-universal.js`
- CSS compartido (opt-in): `configuracion/css/componentes/vcc-transporte-comparador-universal.css`
- Catálogo SL del destino: `configuracion/datos/transporte/estocolmo-sl-2026.js`

El usuario elige **cualquiera de las tres combinaciones de dos alternativas**
o las tres a la vez: coche, billetes individuales, abonos. Las flechas de
cada tarjeta reordenan las opciones visibles sin perder datos; debe haber
al menos dos activas. Alineación exterior: usa el ancho de `.mv-container`;
no introducir un `max-width` menor que reduzca los márgenes del blog.

### Entradas compartidas

Días, número de viajeros, categoría de tarifa, número de viajes por
persona y precio habitual de un viaje. La sección desplegable de
viajes permite editar **día, hora, tipo de transporte, precio y
cobertura por abono** para cada billete. También se admiten precios
distintos en días y trayectos diferentes.

### Coche

Tipo propio o alquilado, plazas por coche, alquiler total, combustible
total, **párquing por día**, peajes totales y extras/seguro.
El párquing se multiplica por los días seleccionados. Todos los
gastos son **por vehículo** y el grupo necesita
`ceil(viajeros/plazas)` coches. Solo se incluyen sus costes si
alquiler (cuando corresponde) y combustible están informados.
Si no cubre el mismo recorrido, se excluye de la recomendación.

### Abonos y complementos

Cada bono tiene tipo (N horas / días / viajes), precio y **unidades por
persona**. Se pueden añadir, eliminar y combinar hasta diez tipos,
ocho unidades de cada uno. Los bonos seleccionados se consideran
comprados; los viajes marcados como no cubiertos, y los trayectos
sobrantes, se cobran aparte como billetes individuales.

La cobertura combinada se aproxima mediante asignación por ahorro
marginal; no garantiza una optimización exhaustiva de horarios.
Un abono de menos de 24 horas exige horas reales en los trayectos
elegibles; para títulos más largos sin horas se aproxima por días,
y se muestra el aviso. No inventar la existencia comercial de
abonos: los personalizados son simulaciones.

### Resultados

Precios por persona y para todo el grupo. La recomendación evalúa
**solo las opciones seleccionadas y con datos suficientes**, destacando
el coste menor y el ahorro frente a otra alternativa. Cuando faltan
datos necesarios, el resultado es provisional y lo advierte.

### Galería editorial

`Elige tu transporte` usa `vcc-gallery-companion-grid`: dos
tarjetas de transporte navegables en la izquierda y una columna fija
a la derecha con el mosaico de 15 fotos del componente
`vcc-gallery-booking`. Solo navegan las tarjetas, no las fotos.
Se ha eliminado la sección independiente de "Nuestra experiencia".
El modal conserva las fotos originales, sus etiquetas y el visor
compartido; en pantallas pequeñas el mosaico queda debajo del carrusel.

## Alta de un nuevo destino

1. Crear `configuracion/datos/transporte/<destino>-<ano>.js` y publicar
   `window.VCCTransportDestination` con schemaVersion, destination, city,
   operator, currency, updated, source, categories, modes y tickets.
2. Cada billete incluye `id`, `label`, `type`, `quantity`, `scope: "person"`
   y `price: { adult: ..., reduced: ... }`, si esos grupos existen.
3. `type:"rides"` indica un billete o bono para N VALIDACIONES. Una
   transferencia que sigue dentro de la validez del billete sencillo NO se
   introduce como otra validación pagada. Ejemplo: `quantity:10` significa
   bono de diez usos, no diez días.
4. `type:"hours"` y `type:"days"` representan uso ilimitado durante
   esas horas o días. 48 horas = `type:"hours", quantity:48`.
5. Solo introducir títulos comercializados de verdad, con origen oficial,
   categoría elegible, zonas y fecha de validez. **No inventar** un bono de
   48 horas o de diez viajes si la red no lo ofrece.
6. En una nueva página, reutilizar el mismo motor (no copiar su algoritmo).
   El HTML debe incluir el catálogo del destino, el optimizador común y la
   presentación de calculadora, con scripts `defer` en ese orden.
7. Las tarifas del operador deben revisarse al actualizar la guía; no hay
   sincronización automática con los precios oficiales.

## Advertencias importantes

- El cálculo diario NO incluye horarios exactos de cada trayecto.
  Los abonos de 24, 48, 72 horas y de varios días se comparan en BLOQUES
  DE DÍAS como aproximación conservadora. Una activación a las 16:00 puede
  dar cobertura real al día siguiente. Para ofrecer exactitud hace falta
  indicar fecha y hora de los trayectos.
- Un billete de 75 minutos cuenta como una validación pagada. Los transbordos
  dentro de su vigencia pueden no requerir otro billete.
- Un abono de 2 horas u otro inferior a 24 horas puede aparecer en el editor,
  pero el motor lo **excluye de la optimización** si no existe un horario de
  trayectos. No se debe fingir una comparación numérica exacta.
- Los bonos de N viajes se calculan por persona, sin caducidad dentro del
  itinerario y no transferibles. Si en otro destino se permiten bonos
  compartidos, caducidades, tarifas por zonas, viajeros mixtos o límites
  de transbordos, esos casos necesitan reglas adicionales antes de publicar
  el resultado como concluyente.
- El cotxe usa SOLO los importes introducidos por el visitante. Deben
  considerarse alquiler, aparcamiento, combustible, peajes/congestión,
  seguro y plazas. Los trayectos con ferry y los recorridos interurbanos
  pueden NO ser comparables a los billetes urbanos elegidos.
- Dejar los precios simulados claramente marcados como SIMULACIÓN PERSONAL.
  No guardarlos como si fueran oficiales.

## Datos de Estocolmo (SL, 2026)

Fuentes oficiales: https://sl.se/en/fares-and-tickets
y tarifa 2026 de SL, vigente desde el 8 de enero de 2026.
Billete 75 minutos: 43/26 SEK; 24 h: 180/110; 72 h: 360/220;
7 días: 470/290 (adulto/reducida, si procede).
SL integra metro, autobús, tranvía y parte de los ferris; por tanto no
debe inventarse un abono de autobús distinto cuando todos comparten título.

## Próximos desarrollos

- Horarios concretos de cada trayecto para títulos de menos de 24 horas,
  activaciones por horas reales y días mixtos.
- Cálculo de múltiples categorías de viajeros en un mismo grupo.
- Reglas de bonos compartidos, zonas y tarifas por franjas/horas.
- Extraer toda la plantilla visual a componente genérico cuando exista un
  segundo destino; preservar márgenes y CSS de la guía compartida.
