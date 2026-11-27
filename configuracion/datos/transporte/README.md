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

## Comparador universal VCC · tres alternativas fijas

**Piloto:** `destinos/suecia/estocolmo/como-moverse.html`, rama `quality`.
No extender a la guía general de Suecia sin aprobación.

**Archivos:** `configuracion/js/componentes/vcc-transporte-comparador-universal.js`
(lógica), `configuracion/css/componentes/vcc-transporte-comparador-universal.css`
(estilo compartido) y `configuracion/datos/transporte/estocolmo-sl-2026.js`
(referencia de importes SL). Todas las opciones son simulaciones editables.

### Diseño vigente

- Tres tarjetas **siempre visibles, fijas y en el mismo orden**: coche,
  billetes sueltos, abonos y pases. No hay barra «COMPARA», casillas de
  activación ni flechas de reordenamiento.
- Solo son filtros comunes **días y viajeros**. Kicker manuscrito Caveat
  encima del título de cada tarjeta, igual que otros encabezados VCC.
- En las tres tarjetas se presentan al pie, idénticos y **en negro**,
  `Por persona` y `Total`. Los importes del transporte público son
  **por persona**; en coche se introduce el coste del **vehículo** (o la
  suma de todos los vehículos) y se reparte entre viajeros.
- Los resúmenes de selección son recuadros neutros de **tres elementos
  por fila**, hasta tres filas con desplazamiento vertical interno. En
  móvil tienen dos columnas. **Cada elemento es el punto de edición**:
  pulsarlo abre un mini-editor (descripción y precio; también tipo en
  abonos), con acciones Listo, Eliminar y cerrar. No hay ventanas grandes.
- «+ Añadir viaje» y «+ Añadir» son enlaces de texto discretos que agregan
  directamente la nueva ficha **al final de la lista** y desplazan la
  vista del resumen hacia abajo, sin abrir el editor.
- La recomendación VCC mantiene el cuadro naranja translúcido y el ahorro
  en blanco, pero **sin título ni sobretítulo grande encima**. Una nota
  «Consejo VCC» discreta queda debajo. La recomendación informa de la
  alternativa más barata, su coste por persona y total y el ahorro frente
  a las otras dos si se conocen sus importes. Los casos incompletos se
  marcan como provisionales y los empates no se presentan como ahorro.
- Las **tres filas finales de totales** tienen la misma franja completa
  gris casi blanca, incluidos los importes de la opción recomendada.
- «Limpiar todo» es un control de texto pequeño en el extremo inferior
  derecho. Elimina las entradas, los abonamientos y los gastos del coche,
  conservando días y viajeros en sus valores iniciales. Al no haber
  entradas ni importes no se recomienda una alternativa ficticia de 0 €.
- La casilla «Coche y transporte público cubren la misma ruta» ha sido
  retirada. Se asume que el usuario introduce alternativas para un mismo
  viaje; no se infiere que todos los recorridos sean equivalentes.

### Entradas y cálculo

**Coche**: alquiler total + combustible + párquing del grupo por día × días +
peajes + extras. Si se utilizan varios vehículos, se introduce la suma
de todos sus costes, sin multiplicaciones automáticas por vehículos.
Coche propio omite el alquiler. Para formar una conclusión definitiva
debe tener importes suficientes y el recorrido debe ser equivalente.

**Billetes sueltos**: cada fila tiene número, descripción y precio;
el sumatorio es por persona. Se pueden agregar, eliminar y editar hasta
40 trayectos con precios distintos. El mini-editor de cada ficha se superpone sin modificar la altura
de la tarjeta.

**Abonos y pases**: una **lista única** con filas formadas por número,
**Tipo** (`Abono` o `Billete`), descripción, precio y eliminar. Un botón
`+ Añadir` incorpora nuevos elementos (máximo 40). Un billete marcado
en esta tercera tarjeta representa un billete complementario que no cubre
el pase. No se deduce automáticamente la cobertura de la descripción
de un abono: el usuario decide qué necesita y introduce los precios.

El sumatorio de la tercera tarjeta = abonos + billetes complementarios,
**por persona**; el coste de grupo es esa cantidad × viajeros. Un importe
sin informar invalida esa alternativa sin considerarlo cero. Se admite
incluso una lista solo de billetes, que se denomina «Billetes personalizados»
en la recomendación. El resultado es provisional cuando falta algún
importe de las demás opciones.

### Galería editorial

En «Elige tu transporte» quedan dos tarjetas navegables más el mosaico
fijo de 15 fotos `vcc-gallery-booking`, sin tarjeta exterior. El mosaico
desktop es 12 px más bajo (6 arriba / abajo). En móvil usa la proporción
compartida. No modificar los activos ni la galería al editar la calculadora.

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
